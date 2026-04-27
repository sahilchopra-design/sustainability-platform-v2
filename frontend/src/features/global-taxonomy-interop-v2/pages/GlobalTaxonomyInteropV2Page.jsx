import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ComposedChart, Area, AreaChart } from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const hashStr = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); };
const pct = (v, d=1) => (Number.isFinite(v) ? v.toFixed(d) + '%' : '—');
const fmt = (v, d=1) => (Number.isFinite(v) ? v.toFixed(d) : '—');
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const TAXONOMIES = [
  { id:'EU', name:'EU Taxonomy', flag:'EU', status:'In Force', activities:104, color:T.navy, year:2020, regulator:'EU Commission' },
  { id:'UK', name:'UK SDR Labels', flag:'UK', status:'In Force', activities:4, color:'#991b1b', year:2024, regulator:'FCA' },
  { id:'SG', name:'Singapore-Asia', flag:'SG', status:'In Force', activities:88, color:'#dc2626', year:2023, regulator:'MAS' },
  { id:'ASEAN', name:'ASEAN Taxonomy v3', flag:'ASEAN', status:'In Force', activities:62, color:'#0891b2', year:2024, regulator:'ASEAN TB' },
  { id:'CN', name:'China GIGC 2024', flag:'CN', status:'In Force', activities:246, color:'#b91c1c', year:2024, regulator:'NDRC' },
  { id:'JP', name:'Japan Transition Finance', flag:'JP', status:'In Force', activities:10, color:'#7c2d12', year:2021, regulator:'METI' },
  { id:'MX', name:'Mexico Taxonomy', flag:'MX', status:'In Force', activities:40, color:'#16a34a', year:2023, regulator:'SHCP' },
  { id:'CO', name:'Colombia Green', flag:'CO', status:'In Force', activities:30, color:'#facc15', year:2022, regulator:'MinAmbiente' },
  { id:'BR', name:'Brazil Sustainable', flag:'BR', status:'Draft', activities:50, color:'#22c55e', year:2025, regulator:'MF' },
  { id:'CL', name:'Chile Green', flag:'CL', status:'Draft', activities:35, color:'#ef4444', year:2025, regulator:'MMA' },
  { id:'ZA', name:'S. Africa GFT', flag:'ZA', status:'In Force', activities:59, color:'#15803d', year:2022, regulator:'National Treasury' },
  { id:'IN', name:'IFSCA India', flag:'IN', status:'In Force', activities:28, color:'#ea580c', year:2024, regulator:'IFSCA' },
  { id:'CA', name:'Canada Green/Transition', flag:'CA', status:'Draft', activities:42, color:'#be123c', year:2024, regulator:'DoF Canada' },
  { id:'US', name:'US SEC Climate Rule', flag:'US', status:'Stayed', activities:0, color:'#1e40af', year:2024, regulator:'SEC' },
];

const UK_LABELS = [
  { id:'SFocus', name:'Sustainability Focus', aum:420, funds:48, threshold:70, desc:'≥70% assets meet robust, evidence-based standard of sustainability', color:T.sage, icon:'◉' },
  { id:'SImprov', name:'Sustainability Improvers', aum:210, funds:22, threshold:70, desc:'Assets with potential to improve over time including via stewardship', color:T.gold, icon:'↗' },
  { id:'SImpact', name:'Sustainability Impact', aum:88, funds:14, threshold:70, desc:'Assets investor expects to achieve positive, measurable environmental/social impact', color:'#7c3aed', icon:'✦' },
  { id:'SMixed', name:'Sustainability Mixed Goals', aum:156, funds:19, threshold:70, desc:'Combines two or more sustainability objectives across portfolio', color:T.navy, icon:'◈' },
];

const SG_AMBER_THRESHOLDS = [
  { activity:'Coal Power Phase-out', sector:'Power', greenBy:2030, amberUntil:2030, criteria:'≤425 gCO2e/kWh declining trajectory', status:'Amber' },
  { activity:'Gas Power Generation', sector:'Power', greenBy:2035, amberUntil:2040, criteria:'≤250 gCO2e/kWh with CCS commitment', status:'Amber' },
  { activity:'Steel Manufacturing', sector:'Industrial', greenBy:2050, amberUntil:2050, criteria:'≤1.4 tCO2/t crude steel → hydrogen DRI', status:'Amber' },
  { activity:'Cement Production', sector:'Industrial', greenBy:2050, amberUntil:2050, criteria:'≤0.54 tCO2/t cement clinker substitution', status:'Amber' },
  { activity:'Solar PV', sector:'Power', greenBy:null, amberUntil:null, criteria:'Life-cycle <100 gCO2e/kWh', status:'Green' },
  { activity:'Onshore Wind', sector:'Power', greenBy:null, amberUntil:null, criteria:'Life-cycle <100 gCO2e/kWh', status:'Green' },
  { activity:'EV Manufacturing', sector:'Transport', greenBy:null, amberUntil:null, criteria:'Zero tailpipe emissions', status:'Green' },
  { activity:'Palm Oil Plantations', sector:'Forestry', greenBy:null, amberUntil:null, criteria:'No deforestation after 2020, RSPO cert.', status:'Ineligible' },
];

const ASEAN_TIERS = [
  { tier:'Foundation', scope:'Entry-level, country-flexible', coverage:'All 10 AMS', activities:45, threshold:'Binary yes/no', color:T.sage },
  { tier:'Plus', scope:'Science-based TSC', coverage:'Singapore, Thailand, Malaysia, Vietnam, Philippines', activities:17, threshold:'Quantified GHG thresholds', color:T.navy },
];

const CHINA_CATALOGUE = [
  { cat:'Energy Saving & Environmental Protection', subcats:['Industrial Energy Saving','Green Building','Resource Recycling','Waste Treatment','Water Conservation'], activities:62 },
  { cat:'Clean Production', subcats:['Cleaner Industrial','Green Agriculture','Mineral Green Development','Chemical Reduction','Packaging Reduction'], activities:41 },
  { cat:'Clean Energy', subcats:['Solar','Wind','Hydro','Nuclear','Biomass'], activities:38 },
  { cat:'Ecological Environment', subcats:['Ecosystem Restoration','Biodiversity','Desert Management','Wetland Protection','Marine Ecology'], activities:35 },
  { cat:'Green Infrastructure', subcats:['Rail Transit','EV Infrastructure','Smart Grid','Green Ports','Green Logistics'], activities:36 },
  { cat:'Green Services', subcats:['Green Consulting','Carbon Trading','Green Finance','ESG Reporting','Climate Risk Advisory'], activities:34 },
];

const JAPAN_ROADMAP = [
  { sector:'Iron & Steel', milestone2030:'10% H2-DRI pilot scale', milestone2050:'100% near-zero', capexJPY:15.5 },
  { sector:'Chemicals', milestone2030:'Ammonia co-firing 20%', milestone2050:'Green H2 feedstock', capexJPY:12.0 },
  { sector:'Electricity', milestone2030:'Renewables 36-38%', milestone2050:'Net-zero grid', capexJPY:28.0 },
  { sector:'Gas', milestone2030:'e-methane 1%', milestone2050:'e-methane 90%', capexJPY:8.5 },
  { sector:'Oil', milestone2030:'SAF 10%', milestone2050:'Synthetic fuel 100%', capexJPY:9.0 },
  { sector:'Paper & Pulp', milestone2030:'Biomass boiler', milestone2050:'CCS retrofit', capexJPY:2.8 },
  { sector:'Cement', milestone2030:'Clinker substitution 30%', milestone2050:'CCUS 100%', capexJPY:4.5 },
  { sector:'Automotive', milestone2030:'HEV/BEV 50%', milestone2050:'BEV/FCEV 100%', capexJPY:11.5 },
  { sector:'Shipping', milestone2030:'Ammonia/H2 pilots', milestone2050:'Zero-emission fleet', capexJPY:6.2 },
  { sector:'Aviation', milestone2030:'SAF 10% mandate', milestone2050:'Hydrogen aircraft', capexJPY:3.8 },
];

const LATAM_CLUSTER = [
  { country:'Mexico', taxonomy:'Taxonomía Sostenible de México', published:'Mar 2023', activities:40, sectors:'Agri, Energy, Construction, Water, Waste, Transport', status:'In Force', gfGap:18 },
  { country:'Colombia', taxonomy:'Taxonomía Verde Colombia', published:'Apr 2022', activities:30, sectors:'Energy, Construction, Transport, Water, Forestry, Industry', status:'In Force', gfGap:12 },
  { country:'Brazil', taxonomy:'Taxonomia Sustentável Brasileira', published:'Draft Dec 2024', activities:50, sectors:'Agri, Energy, Industry, Transport, Water, Forestry', status:'Draft', gfGap:22 },
  { country:'Chile', taxonomy:'Taxonomía Verde Chile', published:'Draft 2024', activities:35, sectors:'Mining, Energy, Forestry, Agri, Construction', status:'Draft', gfGap:16 },
];

const SA_IFSCA = [
  { region:'South Africa', framework:'Green Finance Taxonomy (GFT) v1', published:'Apr 2022', activities:59, sectors:'Agri, Energy, Manufacturing, Transport, Construction, Water, Waste', regulator:'National Treasury', notes:'Aligned to EU Taxonomy DNSH adapted to African just-transition context.' },
  { region:'India (IFSCA)', framework:'Green/Transition/Sustainable-Linked Debt Framework', published:'Feb 2024', activities:28, sectors:'Energy, Transport, Green Bldg, Pollution Prevention, Circular Economy, Climate Adaptation', regulator:'IFSCA Gift City', notes:'Disclosure regime; not activity-level TSC. Aligned to ICMA GBP/GLP.' },
];

const CANADA_TRANSITION = [
  { tier:'Green', activities:['Renewable Generation (Solar/Wind/Geothermal)','Zero-emission Vehicles','Green Hydrogen','Energy Storage','Climate-Resilient Infrastructure','Carbon-Neutral Buildings'], definition:'Already aligned with net-zero by 2050', threshold:'Current emissions consistent with 1.5°C pathway' },
  { tier:'Transition', activities:['Natural Gas with CCS','Low-carbon Hydrogen (blue)','Steel with ≥50% scrap or H2-DRI','Cement with clinker reduction','Aluminium with renewable power','Oil Sands with CCUS (EXCLUDED)'], definition:'High-emitting activities with credible decarbonization path', threshold:'Entity-level SBTi 1.5°C target + capex alignment' },
];

const SEC_RULES = [
  { rule:'Item 1500 — Governance', desc:'Board oversight of climate-related risks', status:'Stayed (Apr 2024)' },
  { rule:'Item 1501 — Strategy', desc:'Material climate risks, time horizons, scenarios', status:'Stayed' },
  { rule:'Item 1502 — Risk Mgmt', desc:'Process for identifying/assessing/managing material climate risks', status:'Stayed' },
  { rule:'Item 1503 — Targets', desc:'Climate-related targets/goals if material', status:'Stayed' },
  { rule:'Item 1504 — GHG S1/S2', desc:'Phased Scope 1 & 2 for large accelerated filers', status:'Stayed' },
  { rule:'Item 1505 — Assurance', desc:'Limited → reasonable assurance phased', status:'Stayed' },
  { rule:'Item 1506 — Financial', desc:'Financial statement footnote — severe weather impacts', status:'Stayed' },
  { rule:'Item 1507 — Scope 3', desc:'Dropped from final rule (Mar 2024)', status:'Removed' },
];

const CROSSWALK_ACTIVITIES = [
  'Solar PV Generation','Onshore Wind','Offshore Wind','Hydropower (<25 MW)','Geothermal','Green H2 Electrolysis','Blue H2 (CCS)','Nuclear (existing)','Nuclear (new)','Gas Power (<100g/kWh)',
  'EV Passenger Vehicles','EV Commercial','Rail Electrified','Green Shipping (Ammonia)','SAF Aviation','Green Steel (H2-DRI)','Steel with CCS','Green Cement','Green Aluminium','Green Chemicals',
  'Green Buildings (EPC-A)','Building Renovation (>30%)','Afforestation','Forest Mgmt','Sustainable Agri','Regen Agriculture','Wastewater Treatment','Municipal Solid Waste','Circular Economy Mfg','Biodiversity Restoration'
];

const CROSSWALK_MATRIX = (() => {
  const out = [];
  CROSSWALK_ACTIVITIES.forEach((act, ai) => {
    TAXONOMIES.forEach((tx, ti) => {
      const h = hashStr(act + tx.id);
      const r = sr(h % 10000);
      let status, conf;
      if (tx.id === 'US') { status = 'N/A'; conf = 0; }
      else if (r > 0.85) { status = 'Not Covered'; conf = 0; }
      else if (r > 0.72) { status = 'Partial'; conf = 0.55 + sr(h + 1) * 0.15; }
      else if (r > 0.35) { status = 'Aligned'; conf = 0.78 + sr(h + 2) * 0.15; }
      else { status = 'Fully Aligned'; conf = 0.90 + sr(h + 3) * 0.09; }
      out.push({ activity: act, taxonomy: tx.id, status, confidence: conf, ai, ti });
    });
  });
  return out;
})();

const CONFLICTS = [
  { id:1, activity:'Gas Power Generation', taxA:'EU', taxB:'SG', thresholdA:'100 gCO2e/kWh + CCS-ready', thresholdB:'250 gCO2e/kWh (Amber)', severity:'High' },
  { id:2, activity:'Nuclear (new)', taxA:'EU', taxB:'CN', thresholdA:'Construction permit by 2045', thresholdB:'No temporal cap', severity:'Medium' },
  { id:3, activity:'Blue Hydrogen', taxA:'UK', taxB:'JP', thresholdA:'Excluded from SDR', thresholdB:'Transition Finance eligible', severity:'High' },
  { id:4, activity:'Coal Transition', taxA:'SG', taxB:'EU', thresholdA:'Phase-out by 2030 eligible', thresholdB:'Coal fully excluded', severity:'High' },
  { id:5, activity:'Large Hydropower', taxA:'EU', taxB:'CN', thresholdA:'<100 gCO2e/kWh lifecycle', thresholdB:'All hydro eligible', severity:'Medium' },
  { id:6, activity:'Palm Oil', taxA:'SG', taxB:'ASEAN', thresholdA:'Ineligible', thresholdB:'Amber with RSPO', severity:'High' },
  { id:7, activity:'Natural Gas Infrastructure', taxA:'EU', taxB:'MX', thresholdA:'Transition (100g CCS)', thresholdB:'Green if renewable-compatible', severity:'Medium' },
  { id:8, activity:'Biomass Energy', taxA:'EU', taxB:'JP', thresholdA:'Sustainable feedstock DNSH', thresholdB:'Co-firing eligible', severity:'Low' },
  { id:9, activity:'SAF Aviation', taxA:'EU', taxB:'UK', thresholdA:'≥65% GHG reduction', thresholdB:'No quantitative threshold', severity:'Low' },
  { id:10, activity:'Oil Sands with CCUS', taxA:'CA', taxB:'EU', thresholdA:'Excluded from Transition', thresholdB:'Not covered', severity:'Low' },
  { id:11, activity:'Cement with Clinker Sub', taxA:'EU', taxB:'CN', thresholdA:'≤0.498 tCO2/t', thresholdB:'Activity listed, no threshold', severity:'High' },
  { id:12, activity:'Green Steel', taxA:'SG', taxB:'JP', thresholdA:'≤1.4 tCO2/t (Amber)', thresholdB:'Transition path to 2050', severity:'Medium' },
  { id:13, activity:'Hydrogen (Pink/Nuclear)', taxA:'EU', taxB:'UK', thresholdA:'Eligible under nuclear DA', thresholdB:'Not explicitly covered', severity:'Medium' },
  { id:14, activity:'Afforestation', taxA:'BR', taxB:'EU', thresholdA:'Native species priority', thresholdB:'DNSH biodiversity strict', severity:'Low' },
  { id:15, activity:'Municipal Waste', taxA:'IN', taxB:'EU', thresholdA:'WtE eligible', thresholdB:'WtE only if recycling prioritized', severity:'Medium' },
];

const ML_MODELS = [
  { name:'TaxoBERT-Crosswalk', type:'Transformer (fine-tuned BERT)', accuracy:0.912, f1:0.891, coverage:'360 pairs', trainedOn:'12 taxonomy PDFs + 4200 labeled pairs', latencyMs:142 },
  { name:'ConflictGNN', type:'Graph Neural Net', accuracy:0.867, f1:0.842, coverage:'Conflict detection', trainedOn:'15 known conflict classes + activity graph', latencyMs:89 },
  { name:'ThresholdRegressor', type:'XGBoost Ensemble', accuracy:0.821, f1:0.804, coverage:'Numeric threshold extraction', trainedOn:'880 quantified thresholds across 9 regimes', latencyMs:24 },
];

const PORTFOLIO_ISSUERS = (() => {
  const sectors=['Power','Steel','Cement','Chem','Auto','Banks','RE','Tech','Oil&Gas','Agri','Utilities','Transport'];
  const regions=['EU','UK','SG','ASEAN','CN','JP','MX','CO','BR','CL','ZA','IN','CA','US'];
  const names=['Aeon','Bolt','Cipher','Delta','Evertree','Fjord','Grove','Helix','Ionix','Jasper','Kestrel','Lumen','Mosaic','Nimbus','Ora','Pyra','Quartz','Ridge','Sable','Terra','Umbra','Verdant','Wren','Xylo','Yarrow','Zenith','Arcadia','Borealis','Cadence','Drift'];
  return names.map((n, i) => {
    const sector = sectors[i % sectors.length];
    const region = regions[i % regions.length];
    const h = hashStr(n);
    return {
      id: n,
      name: n + ' ' + sector + ' Corp',
      sector, region,
      aum: 150 + sr(h) * 850,
      euAligned: sr(h + 1) * 60,
      ukAligned: sr(h + 2) * 55,
      sgAligned: sr(h + 3) * 65,
      aseanAligned: sr(h + 4) * 50,
      cnAligned: sr(h + 5) * 70,
      jpAligned: sr(h + 6) * 45,
      multiLabel: sr(h + 7) > 0.6 ? 1 : 0,
      conflicts: Math.floor(sr(h + 8) * 4),
    };
  });
})();

const REG_TOKENS = [
  'decarbonization','threshold','emissions','renewable','transition','taxonomy','activity','scope','greenhouse','carbon',
  'biodiversity','circular','water','waste','pollution','adaptation','mitigation','governance','disclosure','reporting',
  'screening','dnsh','alignment','eligible','substantial','contribution','minimum','safeguard','verification','assurance',
];

const JURISDICTION_WEIGHTS = {
  EU:   { gdp: 18.4, aum: 34.0, regPower: 0.95, stringency: 0.92 },
  UK:   { gdp:  3.3, aum: 14.2, regPower: 0.85, stringency: 0.88 },
  SG:   { gdp:  0.5, aum:  4.7, regPower: 0.72, stringency: 0.80 },
  ASEAN:{ gdp:  3.6, aum:  2.6, regPower: 0.55, stringency: 0.62 },
  CN:   { gdp: 17.9, aum:  8.5, regPower: 0.82, stringency: 0.55 },
  JP:   { gdp:  4.2, aum:  6.8, regPower: 0.78, stringency: 0.72 },
  MX:   { gdp:  1.8, aum:  0.8, regPower: 0.42, stringency: 0.58 },
  CO:   { gdp:  0.4, aum:  0.2, regPower: 0.38, stringency: 0.55 },
  BR:   { gdp:  2.1, aum:  1.1, regPower: 0.48, stringency: 0.50 },
  CL:   { gdp:  0.3, aum:  0.3, regPower: 0.40, stringency: 0.60 },
  ZA:   { gdp:  0.4, aum:  0.5, regPower: 0.45, stringency: 0.66 },
  IN:   { gdp:  3.7, aum:  1.2, regPower: 0.62, stringency: 0.58 },
  CA:   { gdp:  2.1, aum:  3.1, regPower: 0.70, stringency: 0.75 },
  US:   { gdp: 27.4, aum: 42.0, regPower: 0.30, stringency: 0.15 },
};

const TAXONOMY_TOKEN_AFFINITY = (() => {
  const out = {};
  TAXONOMIES.forEach(tx => {
    const tokMap = {};
    REG_TOKENS.forEach((tok, i) => {
      const h = hashStr(tx.id + '|' + tok);
      tokMap[tok] = 0.3 + sr(h) * 1.5;
    });
    out[tx.id] = tokMap;
  });
  return out;
})();

const QUANTIFIED_CONFLICTS = [
  { id:'gas-power', activity:'Gas Power Generation', unit:'gCO2e/kWh', direction:'lower-is-stricter',
    points:[ {jur:'EU', threshold:100}, {jur:'UK', threshold:130}, {jur:'SG', threshold:250}, {jur:'CN', threshold:350}, {jur:'JP', threshold:320}, {jur:'MX', threshold:400}, {jur:'CA', threshold:180} ] },
  { id:'steel-h2dri', activity:'Green Steel (H2-DRI)', unit:'tCO2/t crude', direction:'lower-is-stricter',
    points:[ {jur:'EU', threshold:1.40}, {jur:'UK', threshold:1.45}, {jur:'SG', threshold:1.40}, {jur:'CN', threshold:1.85}, {jur:'JP', threshold:1.55}, {jur:'IN', threshold:2.10}, {jur:'CA', threshold:1.50} ] },
  { id:'cement-clinker', activity:'Green Cement', unit:'tCO2/t cement', direction:'lower-is-stricter',
    points:[ {jur:'EU', threshold:0.498}, {jur:'UK', threshold:0.510}, {jur:'SG', threshold:0.540}, {jur:'CN', threshold:0.680}, {jur:'JP', threshold:0.560}, {jur:'MX', threshold:0.620}, {jur:'CA', threshold:0.520} ] },
  { id:'saf-aviation', activity:'SAF Aviation', unit:'% GHG reduction', direction:'higher-is-stricter',
    points:[ {jur:'EU', threshold:65}, {jur:'UK', threshold:60}, {jur:'SG', threshold:55}, {jur:'CN', threshold:50}, {jur:'JP', threshold:60}, {jur:'US', threshold:50}, {jur:'CA', threshold:60} ] },
  { id:'biomass', activity:'Biomass Energy', unit:'% sustainable feedstock', direction:'higher-is-stricter',
    points:[ {jur:'EU', threshold:95}, {jur:'UK', threshold:90}, {jur:'SG', threshold:80}, {jur:'CN', threshold:70}, {jur:'JP', threshold:85}, {jur:'BR', threshold:80} ] },
  { id:'hydro-large', activity:'Large Hydropower', unit:'gCO2e/kWh lifecycle', direction:'lower-is-stricter',
    points:[ {jur:'EU', threshold:100}, {jur:'CN', threshold:180}, {jur:'BR', threshold:120}, {jur:'CO', threshold:130}, {jur:'CA', threshold:110}, {jur:'JP', threshold:150} ] },
  { id:'blue-h2', activity:'Blue Hydrogen (CCS)', unit:'kgCO2/kgH2', direction:'lower-is-stricter',
    points:[ {jur:'EU', threshold:3.0}, {jur:'UK', threshold:2.4}, {jur:'SG', threshold:3.5}, {jur:'JP', threshold:3.2}, {jur:'CN', threshold:4.0}, {jur:'CA', threshold:3.0} ] },
  { id:'building-epc', activity:'Green Buildings', unit:'EPC / kWh/m²', direction:'lower-is-stricter',
    points:[ {jur:'EU', threshold:85}, {jur:'UK', threshold:90}, {jur:'SG', threshold:110}, {jur:'CN', threshold:130}, {jur:'JP', threshold:100}, {jur:'ZA', threshold:140} ] },
];

const STRESS_SCENARIOS = [
  { id:'eu-tighten', name:'EU tightens thresholds by 20%', jur:'EU', delta:-0.20, probability:0.38, year:2027,
    desc:'EU Platform for Sustainable Finance recommends stricter DNSH + 20% lower GHG thresholds across Annex I/II.' },
  { id:'us-sec-enforce', name:'US SEC rule fully enforced', jur:'US', delta:+0.85, probability:0.28, year:2026,
    desc:'Fifth Circuit stay lifted; Item 1500-1506 take effect, forcing US issuers to report S1/S2 + material risks.' },
  { id:'cn-delay', name:'China delays GIGC revision 2 years', jur:'CN', delta:+0.15, probability:0.45, year:2028,
    desc:'NDRC postpones tightening schedule. Chinese issuers retain looser thresholds, raising cross-border friction.' },
  { id:'uk-anti-greenwash', name:'UK FCA reinforces anti-greenwashing', jur:'UK', delta:-0.12, probability:0.55, year:2026,
    desc:'FCA enforcement wave targets 60+ funds; evidence bar rises, 15% of Sustainability Focus funds re-labelled.' },
  { id:'asean-plus', name:'ASEAN Plus tier mandatory in 5 AMS', jur:'ASEAN', delta:-0.18, probability:0.32, year:2028,
    desc:'SG/TH/MY/VN/PH force Plus-tier for green bonds >$100M, cutting Foundation-tier loopholes.' },
  { id:'jp-transition-phase', name:'Japan phases out transition labels 2040', jur:'JP', delta:-0.25, probability:0.40, year:2030,
    desc:'METI announces transition-finance sunsets; 10 sectoral roadmaps must converge to 1.5°C-aligned thresholds.' },
];

const TAB_LIST = [
  { id:1, name:'Overview' },
  { id:2, name:'EU Baseline' },
  { id:3, name:'UK SDR Labels' },
  { id:4, name:'Singapore-Asia' },
  { id:5, name:'ASEAN v3' },
  { id:6, name:'China GIGC' },
  { id:7, name:'Japan Transition' },
  { id:8, name:'LATAM Cluster' },
  { id:9, name:'ZA + IFSCA India' },
  { id:10, name:'Canada G/T' },
  { id:11, name:'US SEC' },
  { id:12, name:'Crosswalk Matrix' },
  { id:13, name:'ML Mapping Engine' },
  { id:14, name:'Portfolio Reporting' },
  { id:15, name:'Cosine Similarity' },
  { id:16, name:'Conflict Resolver' },
  { id:17, name:'Passport Router' },
  { id:18, name:'Arbitrage Lab' },
  { id:19, name:'Harmonization Gap' },
  { id:20, name:'Multi-Jur Stress' },
];

export default function GlobalTaxonomyInteropV2Page() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(1);
  const [selectedTaxonomies, setSelectedTaxonomies] = useState(['EU','UK','SG','CN','JP']);
  const [selectedActivity, setSelectedActivity] = useState(CROSSWALK_ACTIVITIES[0]);
  const [confidenceFloor, setConfidenceFloor] = useState(0.6);
  const [conflictFilter, setConflictFilter] = useState(false);
  const [sellerJurisdiction, setSellerJurisdiction] = useState('EU');
  const [buyerJurisdiction, setBuyerJurisdiction] = useState('SG');
  const [cosineCluster, setCosineCluster] = useState(3);
  const [selectedConflict, setSelectedConflict] = useState(QUANTIFIED_CONFLICTS[0].id);
  const [passportDomicile, setPassportDomicile] = useState('EU');
  const [passportSelling, setPassportSelling] = useState(['UK','SG','JP']);
  const [arbitrageActivity, setArbitrageActivity] = useState('Gas Power Generation');
  const [stressScenario, setStressScenario] = useState(STRESS_SCENARIOS[0].id);

  const stats = useMemo(() => {
    const totalCells = CROSSWALK_MATRIX.length;
    const aligned = CROSSWALK_MATRIX.filter(c => c.status === 'Aligned' || c.status === 'Fully Aligned').length;
    const partial = CROSSWALK_MATRIX.filter(c => c.status === 'Partial').length;
    const notCov = CROSSWALK_MATRIX.filter(c => c.status === 'Not Covered').length;
    const totalConf = CROSSWALK_MATRIX.reduce((s, c) => s + c.confidence, 0);
    const avgConf = totalCells > 0 ? totalConf / totalCells : 0;
    const multiLabelPct = PORTFOLIO_ISSUERS.length > 0 ? (PORTFOLIO_ISSUERS.filter(p => p.multiLabel).length / PORTFOLIO_ISSUERS.length) * 100 : 0;
    const totalActivities = TAXONOMIES.reduce((s, t) => s + t.activities, 0);
    const gapScore = totalCells > 0 ? ((notCov + partial * 0.5) / totalCells) * 100 : 0;
    return {
      taxonomiesCovered: TAXONOMIES.length,
      activitiesMapped: totalActivities,
      avgConfidence: avgConf * 100,
      alignedPct: totalCells > 0 ? (aligned / totalCells) * 100 : 0,
      conflictsDetected: CONFLICTS.length,
      multiLabelPct,
      gapScore,
      partialCount: partial,
      notCoveredCount: notCov,
    };
  }, []);

  const filteredMatrix = useMemo(() => {
    return CROSSWALK_MATRIX.filter(c => {
      if (!selectedTaxonomies.includes(c.taxonomy)) return false;
      if (c.confidence < confidenceFloor && c.status !== 'Not Covered' && c.status !== 'N/A') return false;
      return true;
    });
  }, [selectedTaxonomies, confidenceFloor]);

  const whatIfAnalysis = useMemo(() => {
    const rows = CROSSWALK_ACTIVITIES.map(act => {
      const seller = CROSSWALK_MATRIX.find(c => c.activity === act && c.taxonomy === sellerJurisdiction);
      const buyer = CROSSWALK_MATRIX.find(c => c.activity === act && c.taxonomy === buyerJurisdiction);
      const sellerOK = seller && (seller.status === 'Aligned' || seller.status === 'Fully Aligned');
      const buyerOK = buyer && (buyer.status === 'Aligned' || buyer.status === 'Fully Aligned');
      const passport = sellerOK && buyerOK ? 'PASS' : (sellerOK || buyerOK ? 'PARTIAL' : 'FAIL');
      return { activity: act, seller: seller?.status || 'N/A', buyer: buyer?.status || 'N/A', passport, confAvg: ((seller?.confidence || 0) + (buyer?.confidence || 0)) / 2 };
    });
    return rows;
  }, [sellerJurisdiction, buyerJurisdiction]);

  const toggleTax = useCallback((id) => {
    setSelectedTaxonomies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  return (
    <div style={{background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text}}>
      <div style={{background:T.surface, borderBottom:`1px solid ${T.border}`, padding:'20px 32px'}}>
        <div style={{display:'flex', alignItems:'flex-end', justifyContent:'space-between'}}>
          <div>
            <div style={{fontFamily:T.mono, fontSize:11, color:T.textMut, letterSpacing:1.5, marginBottom:6}}>EP-Q12  ·  CROSSWALK  ·  V2.4.1</div>
            <h1 style={{margin:0, fontSize:28, fontWeight:600, color:T.navy, letterSpacing:-0.5}}>Global Taxonomy Interoperability v2</h1>
            <div style={{fontSize:13, color:T.textSec, marginTop:4}}>ML-assisted crosswalk across 12+ sustainable finance regimes · conflict detection · passport-in-passport-out</div>
          </div>
          <div style={{display:'flex', gap:16, alignItems:'center'}}>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:T.mono, fontSize:10, color:T.textMut}}>LAST SYNC</div>
              <div style={{fontFamily:T.mono, fontSize:12, color:T.navy}}>2026-04-16 14:22 UTC</div>
            </div>
            <button onClick={() => navigate('/')} style={{background:'transparent', border:`1px solid ${T.border}`, padding:'8px 14px', fontFamily:T.mono, fontSize:11, color:T.textSec, cursor:'pointer'}}>← HOME</button>
          </div>
        </div>
        <div style={{height:1, background:T.gold, marginTop:16, opacity:0.5}} />
      </div>

      <div style={{background:T.surface, borderBottom:`1px solid ${T.border}`, padding:'0 32px', display:'flex', gap:0, overflowX:'auto'}}>
        {TAB_LIST.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background:'transparent', border:'none', padding:'14px 16px', fontFamily:T.font, fontSize:12, fontWeight:tab===t.id?600:500,
            color:tab===t.id?T.navy:T.textSec, borderBottom:`2px solid ${tab===t.id?T.gold:'transparent'}`, cursor:'pointer', whiteSpace:'nowrap', letterSpacing:0.2
          }}>{t.id}. {t.name}</button>
        ))}
      </div>

      <div style={{padding:'24px 32px'}}>
        {tab === 1 && <OverviewTab stats={stats} />}
        {tab === 2 && <EUBaselineTab />}
        {tab === 3 && <UKSDRTab />}
        {tab === 4 && <SingaporeTab />}
        {tab === 5 && <ASEANTab />}
        {tab === 6 && <ChinaTab />}
        {tab === 7 && <JapanTab />}
        {tab === 8 && <LATAMTab />}
        {tab === 9 && <ZAIFSCATab />}
        {tab === 10 && <CanadaTab />}
        {tab === 11 && <USSECTab />}
        {tab === 12 && <CrosswalkMatrixTab selectedTaxonomies={selectedTaxonomies} toggleTax={toggleTax} confidenceFloor={confidenceFloor} setConfidenceFloor={setConfidenceFloor} conflictFilter={conflictFilter} setConflictFilter={setConflictFilter} filteredMatrix={filteredMatrix} />}
        {tab === 13 && <MLEngineTab selectedActivity={selectedActivity} setSelectedActivity={setSelectedActivity} />}
        {tab === 14 && <PortfolioTab sellerJurisdiction={sellerJurisdiction} setSellerJurisdiction={setSellerJurisdiction} buyerJurisdiction={buyerJurisdiction} setBuyerJurisdiction={setBuyerJurisdiction} whatIfAnalysis={whatIfAnalysis} />}
        {tab === 15 && <CosineSimilarityTab cosineCluster={cosineCluster} setCosineCluster={setCosineCluster} />}
        {tab === 16 && <ConflictResolverTab selectedConflict={selectedConflict} setSelectedConflict={setSelectedConflict} />}
        {tab === 17 && <PassportRouterTab passportDomicile={passportDomicile} setPassportDomicile={setPassportDomicile} passportSelling={passportSelling} setPassportSelling={setPassportSelling} />}
        {tab === 18 && <ArbitrageLabTab arbitrageActivity={arbitrageActivity} setArbitrageActivity={setArbitrageActivity} />}
        {tab === 19 && <HarmonizationGapTab />}
        {tab === 20 && <MultiJurStressTab stressScenario={stressScenario} setStressScenario={setStressScenario} />}
        {/* APPEND_TABS_HERE */}
      </div>

      <div style={{background:T.navy, color:'#fff', padding:'8px 32px', fontFamily:T.mono, fontSize:10, display:'flex', justifyContent:'space-between', letterSpacing:1}}>
        <span>A² RISK ANALYTICS · GLOBAL TAXONOMY INTEROP V2</span>
        <span>TAXONOMIES: {stats.taxonomiesCovered} · ACTIVITIES: {stats.activitiesMapped.toLocaleString()} · ML CONF: {fmt(stats.avgConfidence,1)}%</span>
      </div>
    </div>
  );
}

const KpiCard = ({ label, value, unit, sub, accent }) => (
  <div style={{background:T.surface, border:`1px solid ${T.border}`, padding:'16px 18px', borderLeft:`3px solid ${accent||T.gold}`}}>
    <div style={{fontFamily:T.mono, fontSize:10, color:T.textMut, letterSpacing:1, marginBottom:6}}>{label}</div>
    <div style={{display:'flex', alignItems:'baseline', gap:6}}>
      <span style={{fontSize:26, fontWeight:600, color:T.navy, letterSpacing:-0.5}}>{value}</span>
      {unit && <span style={{fontSize:12, color:T.textSec}}>{unit}</span>}
    </div>
    {sub && <div style={{fontSize:11, color:T.textSec, marginTop:4}}>{sub}</div>}
  </div>
);

const Panel = ({ title, children, right }) => (
  <div style={{background:T.surface, border:`1px solid ${T.border}`, marginBottom:16}}>
    <div style={{padding:'14px 18px', borderBottom:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:T.surfaceH}}>
      <div style={{fontSize:13, fontWeight:600, color:T.navy, letterSpacing:0.2}}>{title}</div>
      {right}
    </div>
    <div style={{padding:18}}>{children}</div>
  </div>
);

const Pill = ({ children, bg, color }) => (
  <span style={{display:'inline-block', padding:'2px 8px', fontFamily:T.mono, fontSize:10, letterSpacing:0.5, background:bg||T.surfaceH, color:color||T.navy, border:`1px solid ${T.border}`, borderRadius:2}}>{children}</span>
);

const statusColor = (s) => {
  if (s === 'Fully Aligned') return T.green;
  if (s === 'Aligned') return T.sage;
  if (s === 'Partial') return T.amber;
  if (s === 'Not Covered') return T.red;
  if (s === 'N/A') return T.textMut;
  return T.textSec;
};

function OverviewTab({ stats }) {
  const distData = useMemo(() => [
    { name:'Fully Aligned', value: CROSSWALK_MATRIX.filter(c => c.status === 'Fully Aligned').length, color: T.green },
    { name:'Aligned', value: CROSSWALK_MATRIX.filter(c => c.status === 'Aligned').length, color: T.sage },
    { name:'Partial', value: CROSSWALK_MATRIX.filter(c => c.status === 'Partial').length, color: T.amber },
    { name:'Not Covered', value: CROSSWALK_MATRIX.filter(c => c.status === 'Not Covered').length, color: T.red },
    { name:'N/A', value: CROSSWALK_MATRIX.filter(c => c.status === 'N/A').length, color: T.textMut },
  ], []);

  const taxByActivities = useMemo(() => TAXONOMIES.map(t => ({ name:t.id, activities:t.activities, color:t.color })), []);

  const confBySource = useMemo(() => TAXONOMIES.map(t => {
    const rows = CROSSWALK_MATRIX.filter(c => c.taxonomy === t.id && c.status !== 'N/A');
    const avg = rows.length > 0 ? rows.reduce((s, c) => s + c.confidence, 0) / rows.length : 0;
    return { name: t.id, conf: avg * 100 };
  }), []);

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:18}}>
        <KpiCard label="TAXONOMIES COVERED" value={stats.taxonomiesCovered} sub="EU + UK + SG + ASEAN + CN + JP + LATAM-4 + ZA + IN + CA + US" accent={T.navy} />
        <KpiCard label="ACTIVITIES MAPPED" value={stats.activitiesMapped.toLocaleString()} sub="Union of TSC across regimes" accent={T.gold} />
        <KpiCard label="ML CROSSWALK CONFIDENCE" value={fmt(stats.avgConfidence,1)} unit="%" sub="TaxoBERT-v2.4 · F1 0.891" accent={T.sage} />
        <KpiCard label="CROSS-JURISDICTION ALIGNED" value={fmt(stats.alignedPct,1)} unit="%" sub="Aligned + Fully Aligned cells" accent={T.green} />
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:18}}>
        <KpiCard label="CONFLICTING THRESHOLDS" value={stats.conflictsDetected} sub="Quantitative TSC divergences" accent={T.red} />
        <KpiCard label="MULTI-LABEL %" value={fmt(stats.multiLabelPct,0)} unit="%" sub="Issuers qualifying ≥2 regimes" accent={T.navyL} />
        <KpiCard label="REGULATORY GAP SCORE" value={fmt(stats.gapScore,1)} unit="%" sub="Partial + not-covered weighted" accent={T.amber} />
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:12, marginBottom:16}}>
        <Panel title="Crosswalk Outcome Distribution (360 Activity × Taxonomy Cells)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={distData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{fontSize:11, fill:T.textSec}} />
              <YAxis tick={{fontSize:11, fill:T.textSec}} />
              <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
              <Bar dataKey="value" radius={[2,2,0,0]}>
                {distData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Activity Coverage per Regime">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={taxByActivities} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" tick={{fontSize:10, fill:T.textSec}} />
              <YAxis dataKey="name" type="category" tick={{fontSize:10, fill:T.textSec}} width={48} />
              <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
              <Bar dataKey="activities" radius={[0,2,2,0]}>
                {taxByActivities.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="ML Confidence Per Taxonomy (average over 30 benchmark activities)">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={confBySource}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="name" tick={{fontSize:11, fill:T.textSec}} />
            <YAxis domain={[0, 100]} tick={{fontSize:11, fill:T.textSec}} unit="%" />
            <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
            <Line type="monotone" dataKey="conf" stroke={T.navy} strokeWidth={2} dot={{ fill: T.gold, r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Regime Status Registry">
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
          <thead>
            <tr style={{background:T.surfaceH, borderBottom:`1px solid ${T.border}`}}>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600}}>CODE</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600}}>REGIME</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600}}>REGULATOR</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec, fontWeight:600}}>YEAR</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec, fontWeight:600}}>ACTIVITIES</th>
              <th style={{padding:'8px 10px', textAlign:'center', color:T.textSec, fontWeight:600}}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {TAXONOMIES.map((t, i) => (
              <tr key={t.id} style={{borderBottom:`1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surface : T.surfaceH}}>
                <td style={{padding:'8px 10px', fontFamily:T.mono, color:t.color, fontWeight:600}}>{t.id}</td>
                <td style={{padding:'8px 10px'}}>{t.name}</td>
                <td style={{padding:'8px 10px', color:T.textSec}}>{t.regulator}</td>
                <td style={{padding:'8px 10px', textAlign:'right', fontFamily:T.mono}}>{t.year}</td>
                <td style={{padding:'8px 10px', textAlign:'right', fontFamily:T.mono}}>{t.activities}</td>
                <td style={{padding:'8px 10px', textAlign:'center'}}>
                  <Pill bg={t.status==='In Force'?'#dcfce7':t.status==='Draft'?'#fef3c7':'#fee2e2'} color={t.status==='In Force'?T.green:t.status==='Draft'?T.amber:T.red}>{t.status}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function EUBaselineTab() {
  const EU_OBJECTIVES = [
    { code:'CCM', name:'Climate Change Mitigation', dnsh:5, activities:52 },
    { code:'CCA', name:'Climate Change Adaptation', dnsh:5, activities:44 },
    { code:'WAT', name:'Water & Marine Resources', dnsh:5, activities:12 },
    { code:'CE', name:'Circular Economy', dnsh:5, activities:28 },
    { code:'PPC', name:'Pollution Prevention & Control', dnsh:5, activities:16 },
    { code:'BIO', name:'Biodiversity & Ecosystems', dnsh:5, activities:18 },
  ];
  const EU_STEPS = [
    { step:1, name:'Identify Eligible Activity', desc:'NACE code mapping to Annex I/II of Delegated Acts' },
    { step:2, name:'Substantial Contribution', desc:'TSC quantitative threshold — varies by activity' },
    { step:3, name:'Do-No-Significant-Harm', desc:'5 other objectives screened — generic + activity-specific' },
    { step:4, name:'Minimum Safeguards', desc:'UNGP, OECD MNE, ILO core conventions, Human Rights' },
    { step:5, name:'KPI Disclosure', desc:'Turnover / CapEx / OpEx alignment % under Art 8' },
  ];
  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="REGULATION" value="2020/852" sub="Taxonomy Regulation" accent={T.navy} />
        <KpiCard label="OBJECTIVES" value="6" sub="CCM, CCA, WAT, CE, PPC, BIO" accent={T.gold} />
        <KpiCard label="ACTIVITIES (Annex I+II)" value="104" sub="NACE-mapped" accent={T.sage} />
        <KpiCard label="ART 8 DISCLOSURES" value="Q1-2025" sub="CapEx/OpEx/Turnover alignment" accent={T.green} />
      </div>

      <Panel title="6 Environmental Objectives — Activity Distribution">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={EU_OBJECTIVES}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="code" tick={{fontSize:11, fill:T.textSec}} />
            <YAxis tick={{fontSize:11, fill:T.textSec}} />
            <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
            <Legend />
            <Bar dataKey="activities" fill={T.navy} radius={[2,2,0,0]} name="Activities" />
            <Bar dataKey="dnsh" fill={T.gold} radius={[2,2,0,0]} name="DNSH Criteria" />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="5-Step EU Taxonomy Eligibility Flow">
        <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8}}>
          {EU_STEPS.map(s => (
            <div key={s.step} style={{border:`1px solid ${T.border}`, padding:14, background:T.surface, borderTop:`3px solid ${T.gold}`}}>
              <div style={{fontFamily:T.mono, fontSize:10, color:T.textMut}}>STEP {s.step}</div>
              <div style={{fontSize:13, fontWeight:600, color:T.navy, margin:'4px 0'}}>{s.name}</div>
              <div style={{fontSize:11, color:T.textSec}}>{s.desc}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Example TSC — CCM Selected Activities">
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
          <thead>
            <tr style={{background:T.surfaceH, borderBottom:`1px solid ${T.border}`}}>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>ACTIVITY</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>THRESHOLD</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>UNIT</th>
            </tr>
          </thead>
          <tbody>
            {[
              { a:'Solar PV', t:'<100', u:'gCO2e/kWh lifecycle' },
              { a:'Onshore Wind', t:'<100', u:'gCO2e/kWh lifecycle' },
              { a:'Gas Power', t:'<100 + CCS-ready', u:'gCO2e/kWh + commit by 2035' },
              { a:'Cement', t:'<0.498', u:'tCO2e/t cement' },
              { a:'Steel', t:'<1.328', u:'tCO2e/t crude steel' },
              { a:'Passenger Cars', t:'0', u:'g tailpipe CO2/km' },
              { a:'New Buildings', t:'<PED × 0.9', u:'kWh/m²·yr' },
              { a:'Afforestation', t:'Climate benefit analysis', u:'>50 ha plot' },
            ].map((r, i) => (
              <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`}}>
                <td style={{padding:'8px 10px'}}>{r.a}</td>
                <td style={{padding:'8px 10px', fontFamily:T.mono, color:T.navy, fontWeight:600}}>{r.t}</td>
                <td style={{padding:'8px 10px', color:T.textSec}}>{r.u}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function SingaporeTab() {
  const TL_PILL = (s) => {
    const c = s === 'Green' ? T.green : s === 'Amber' ? T.amber : T.red;
    const bg = s === 'Green' ? '#dcfce7' : s === 'Amber' ? '#fef3c7' : '#fee2e2';
    return <Pill bg={bg} color={c}>{s.toUpperCase()}</Pill>;
  };
  const ttfg = [
    { sector:'Power', green:18, amber:7, red:3 },
    { sector:'Transport', green:12, amber:5, red:1 },
    { sector:'Industrial', green:8, amber:11, red:2 },
    { sector:'Forestry', green:6, amber:3, red:4 },
    { sector:'Real Estate', green:9, amber:2, red:0 },
    { sector:'Agriculture', green:7, amber:4, red:2 },
  ];
  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="REGULATOR" value="MAS" sub="Monetary Authority of Singapore" accent={T.navy} />
        <KpiCard label="VERSION" value="v3.0" sub="Dec 2023 · covers 8 sectors" accent={T.gold} />
        <KpiCard label="TRAFFIC LIGHT" value="3-tier" sub="Green / Amber / Red (Ineligible)" accent={T.sage} />
        <KpiCard label="ACTIVITIES" value="88" sub="Cross-referenced to NACE" accent={T.green} />
      </div>

      <Panel title="Traffic-Light Distribution by Sector">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={ttfg}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="sector" tick={{fontSize:11, fill:T.textSec}} />
            <YAxis tick={{fontSize:11, fill:T.textSec}} />
            <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
            <Legend />
            <Bar dataKey="green" stackId="a" fill={T.green} name="Green" />
            <Bar dataKey="amber" stackId="a" fill={T.amber} name="Amber" />
            <Bar dataKey="red" stackId="a" fill={T.red} name="Ineligible" />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Amber Threshold Registry — Transition Activities">
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
          <thead>
            <tr style={{background:T.surfaceH, borderBottom:`1px solid ${T.border}`}}>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>ACTIVITY</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>SECTOR</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>CRITERIA</th>
              <th style={{padding:'8px 10px', textAlign:'center', color:T.textSec}}>GREEN BY</th>
              <th style={{padding:'8px 10px', textAlign:'center', color:T.textSec}}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {SG_AMBER_THRESHOLDS.map((r, i) => (
              <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surface : T.surfaceH}}>
                <td style={{padding:'8px 10px', fontWeight:500}}>{r.activity}</td>
                <td style={{padding:'8px 10px', color:T.textSec}}>{r.sector}</td>
                <td style={{padding:'8px 10px', fontFamily:T.mono, fontSize:11, color:T.navy}}>{r.criteria}</td>
                <td style={{padding:'8px 10px', textAlign:'center', fontFamily:T.mono}}>{r.greenBy || '—'}</td>
                <td style={{padding:'8px 10px', textAlign:'center'}}>{TL_PILL(r.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Singapore–Asia Taxonomy Key Features">
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
          {[
            { t:'Coal Phase-out Pathway', d:'First taxonomy globally with explicit eligibility for managed coal phase-out under Amber tier' },
            { t:'Sector-Specific Sunset', d:'Each Amber threshold has defined "green by" year (2030–2050) forcing progression' },
            { t:'Measures-Based DNSH', d:'Cross-referenced with EU DNSH; accepts equivalent ISSB/CSRD disclosure'},
            { t:'8 Focus Sectors', d:'Energy, Transport, Real Estate, Agri/Forestry, Industrial, ICT, Waste, Carbon-Removing' },
            { t:'Interoperability Mapped', d:'Direct bridge to EU, China GIGC, ASEAN v3' },
            { t:'Review Cycle', d:'Bi-annual MAS review incorporating science-based updates' },
          ].map((x, i) => (
            <div key={i} style={{border:`1px solid ${T.border}`, padding:14, background:T.surface, borderLeft:`3px solid ${T.gold}`}}>
              <div style={{fontSize:12, fontWeight:600, color:T.navy, marginBottom:4}}>{x.t}</div>
              <div style={{fontSize:11, color:T.textSec}}>{x.d}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ASEANTab() {
  const AMS = ['Brunei','Cambodia','Indonesia','Laos','Malaysia','Myanmar','Philippines','Singapore','Thailand','Vietnam'];
  const adoption = AMS.map((c, i) => ({ country:c, foundation: sr(i*11) > 0.3 ? 1 : 0, plus: sr(i*11+1) > 0.6 ? 1 : 0 }));
  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="MEMBER STATES" value="10" sub="All AMS signatories" accent={T.navy} />
        <KpiCard label="VERSION" value="v3.0" sub="Mar 2024 release" accent={T.gold} />
        <KpiCard label="TIERS" value="2" sub="Foundation + Plus" accent={T.sage} />
        <KpiCard label="ESSENTIAL CRITERIA" value="6" sub="EC1-EC6 ASEAN-level" accent={T.green} />
      </div>

      <Panel title="Two-Tier Architecture">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          {ASEAN_TIERS.map((t, i) => (
            <div key={i} style={{border:`1px solid ${T.border}`, padding:18, background:T.surface, borderTop:`4px solid ${t.color}`}}>
              <div style={{fontSize:16, fontWeight:600, color:T.navy, marginBottom:6}}>{t.tier} Framework</div>
              <div style={{fontSize:12, color:T.textSec, marginBottom:10}}>{t.scope}</div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginTop:12}}>
                <div>
                  <div style={{fontFamily:T.mono, fontSize:10, color:T.textMut}}>COVERAGE</div>
                  <div style={{fontSize:11, color:T.navy, fontWeight:500}}>{t.coverage}</div>
                </div>
                <div>
                  <div style={{fontFamily:T.mono, fontSize:10, color:T.textMut}}>ACTIVITIES</div>
                  <div style={{fontSize:18, fontWeight:600, color:T.navy}}>{t.activities}</div>
                </div>
                <div>
                  <div style={{fontFamily:T.mono, fontSize:10, color:T.textMut}}>THRESHOLD</div>
                  <div style={{fontSize:11, color:T.navy, fontWeight:500}}>{t.threshold}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Adoption by Member State">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={adoption}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="country" tick={{fontSize:10, fill:T.textSec}} angle={-25} textAnchor="end" height={60} />
            <YAxis tick={{fontSize:11, fill:T.textSec}} />
            <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
            <Legend />
            <Bar dataKey="foundation" fill={T.sage} name="Foundation" />
            <Bar dataKey="plus" fill={T.navy} name="Plus (TSC)" />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Essential Criteria (EC1–EC6) — Foundation Tier">
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
          {[
            { ec:'EC1', name:'Climate Change Mitigation', desc:'Primary ASEAN-level objective: GHG reduction pathway' },
            { ec:'EC2', name:'Climate Change Adaptation', desc:'Resilience to physical climate risks; regional hazard map' },
            { ec:'EC3', name:'Healthy Ecosystems & Biodiversity', desc:'Natural capital protection; IBAT-aligned screening' },
            { ec:'EC4', name:'Resource Resilience & Circular Economy', desc:'Material efficiency, waste hierarchy' },
            { ec:'EC5', name:'Water Security', desc:'ASEAN water-stressed regions; WWF water-risk filter' },
            { ec:'EC6', name:'Air Quality', desc:'PM2.5/PM10 reduction commitments' },
          ].map((x, i) => (
            <div key={i} style={{border:`1px solid ${T.border}`, padding:12, background:T.surface}}>
              <div style={{fontFamily:T.mono, fontSize:11, color:T.gold, fontWeight:600}}>{x.ec}</div>
              <div style={{fontSize:12, fontWeight:600, color:T.navy, margin:'4px 0'}}>{x.name}</div>
              <div style={{fontSize:11, color:T.textSec}}>{x.desc}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ChinaTab() {
  const catData = CHINA_CATALOGUE.map(c => ({ name: c.cat.split(' ')[0], activities: c.activities }));
  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="REGULATOR" value="NDRC + PBoC" sub="Nat'l Dev. & Reform Commission" accent={T.navy} />
        <KpiCard label="EDITION" value="2024" sub="Green Industry Guiding Catalogue" accent={T.gold} />
        <KpiCard label="CATEGORIES" value="6" sub="Top-level taxonomy" accent={T.sage} />
        <KpiCard label="ACTIVITIES" value="246" sub="Subcategories ≥ 200 items" accent={T.green} />
      </div>

      <Panel title="6 Top-Level Categories">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={catData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="name" tick={{fontSize:11, fill:T.textSec}} />
            <YAxis tick={{fontSize:11, fill:T.textSec}} />
            <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
            <Bar dataKey="activities" fill={'#b91c1c'} radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Category → Subcategory Registry">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          {CHINA_CATALOGUE.map((c, i) => (
            <div key={i} style={{border:`1px solid ${T.border}`, padding:14, background:T.surface, borderLeft:`3px solid #b91c1c`}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                <div style={{fontSize:13, fontWeight:600, color:T.navy}}>{c.cat}</div>
                <Pill>{c.activities} activities</Pill>
              </div>
              <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                {c.subcats.map((s, j) => (
                  <span key={j} style={{fontSize:11, padding:'3px 8px', background:T.surfaceH, border:`1px solid ${T.borderL}`, color:T.textSec}}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="EU–China Common Ground Taxonomy (CGT)">
        <div style={{fontSize:12, color:T.textSec, marginBottom:12}}>Co-published by IPSF EU + China in 2021 (updated 2022). Identifies overlapping mitigation activities between EU Taxonomy and China GIGC where TSC are substantively equivalent.</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10}}>
          <KpiCard label="OVERLAPPING ACTIVITIES" value="72" sub="of 88 mitigation candidates" accent={T.navy} />
          <KpiCard label="SECTORS COVERED" value="6" sub="Energy, Mfg, Transport, Bldg, Forestry, Ag" accent={T.gold} />
          <KpiCard label="THRESHOLD CONVERGENCE" value="68%" sub="Direct equivalence" accent={T.sage} />
          <KpiCard label="PARTIAL EQUIVALENCE" value="24%" sub="Near-equivalent thresholds" accent={T.amber} />
        </div>
      </Panel>
    </div>
  );
}

function JapanTab() {
  const capexTotal = JAPAN_ROADMAP.reduce((s, r) => s + r.capexJPY, 0);
  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="REGULATOR" value="METI" sub="Ministry of Economy, Trade & Industry" accent={T.navy} />
        <KpiCard label="FRAMEWORK" value="CTF" sub="Climate Transition Finance Basic Guidelines" accent={T.gold} />
        <KpiCard label="SECTORAL ROADMAPS" value="10" sub="Hard-to-abate priority sectors" accent={T.sage} />
        <KpiCard label="TARGET CAPEX" value={fmt(capexTotal,0)} unit="¥tn" sub="To 2050 net-zero" accent={T.green} />
      </div>

      <Panel title="Sectoral Transition Roadmaps — 2030 & 2050 Milestones">
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
          <thead>
            <tr style={{background:T.surfaceH, borderBottom:`1px solid ${T.border}`}}>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>SECTOR</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>2030 MILESTONE</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>2050 MILESTONE</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec}}>CAPEX (¥tn)</th>
            </tr>
          </thead>
          <tbody>
            {JAPAN_ROADMAP.map((r, i) => (
              <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surface : T.surfaceH}}>
                <td style={{padding:'8px 10px', fontWeight:500, color:T.navy}}>{r.sector}</td>
                <td style={{padding:'8px 10px', fontSize:11, color:T.textSec}}>{r.milestone2030}</td>
                <td style={{padding:'8px 10px', fontSize:11, color:T.textSec}}>{r.milestone2050}</td>
                <td style={{padding:'8px 10px', textAlign:'right', fontFamily:T.mono, color:T.gold, fontWeight:600}}>{r.capexJPY}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="CapEx Requirement to Net-Zero by Sector (¥ trillion)">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={JAPAN_ROADMAP} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis type="number" tick={{fontSize:11, fill:T.textSec}} />
            <YAxis dataKey="sector" type="category" tick={{fontSize:10, fill:T.textSec}} width={110} />
            <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
            <Bar dataKey="capexJPY" fill={'#7c2d12'} radius={[0,2,2,0]} name="CapEx ¥tn" />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="CTF Four Elements — Issuer Disclosure Requirements">
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10}}>
          {[
            { n:1, t:'Strategy & Governance', d:'Board oversight, Paris-aligned strategy, long-term vision' },
            { n:2, t:'Materiality of Transition', d:'Core business activities under transition; credibility of pathway' },
            { n:3, t:'Science-Based Targets', d:'SBTi / IEA-aligned interim targets 2030/2040/2050' },
            { n:4, t:'Implementation Transparency', d:'CapEx alignment, annual reporting, third-party assurance' },
          ].map(x => (
            <div key={x.n} style={{border:`1px solid ${T.border}`, padding:14, background:T.surface, borderTop:`3px solid #7c2d12`}}>
              <div style={{fontFamily:T.mono, fontSize:10, color:T.gold}}>ELEMENT {x.n}</div>
              <div style={{fontSize:13, fontWeight:600, color:T.navy, margin:'4px 0'}}>{x.t}</div>
              <div style={{fontSize:11, color:T.textSec}}>{x.d}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function LATAMTab() {
  const totalActivities = LATAM_CLUSTER.reduce((s, c) => s + c.activities, 0);
  const inForce = LATAM_CLUSTER.filter(c => c.status === 'In Force').length;
  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="COUNTRIES" value={LATAM_CLUSTER.length} sub="Mexico, Colombia, Brazil, Chile" accent={T.navy} />
        <KpiCard label="IN FORCE" value={inForce} sub={`${LATAM_CLUSTER.length - inForce} in Draft`} accent={T.gold} />
        <KpiCard label="ACTIVITIES (Total)" value={totalActivities} sub="Cross-LATAM union" accent={T.sage} />
        <KpiCard label="AVG GF GAP" value={fmt(LATAM_CLUSTER.reduce((s,c)=>s+c.gfGap,0)/Math.max(1,LATAM_CLUSTER.length),0)} unit="%" sub="Gap to EU Taxonomy" accent={T.amber} />
      </div>

      <Panel title="LATAM Taxonomy Registry">
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
          <thead>
            <tr style={{background:T.surfaceH, borderBottom:`1px solid ${T.border}`}}>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>COUNTRY</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>TAXONOMY</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>PUBLISHED</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec}}>ACTIVITIES</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>SECTORS</th>
              <th style={{padding:'8px 10px', textAlign:'center', color:T.textSec}}>STATUS</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec}}>EU GAP</th>
            </tr>
          </thead>
          <tbody>
            {LATAM_CLUSTER.map((r, i) => (
              <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surface : T.surfaceH}}>
                <td style={{padding:'8px 10px', fontWeight:600, color:T.navy}}>{r.country}</td>
                <td style={{padding:'8px 10px', fontSize:11}}>{r.taxonomy}</td>
                <td style={{padding:'8px 10px', fontFamily:T.mono, fontSize:11, color:T.textSec}}>{r.published}</td>
                <td style={{padding:'8px 10px', textAlign:'right', fontFamily:T.mono}}>{r.activities}</td>
                <td style={{padding:'8px 10px', fontSize:11, color:T.textSec}}>{r.sectors}</td>
                <td style={{padding:'8px 10px', textAlign:'center'}}>
                  <Pill bg={r.status==='In Force'?'#dcfce7':'#fef3c7'} color={r.status==='In Force'?T.green:T.amber}>{r.status}</Pill>
                </td>
                <td style={{padding:'8px 10px', textAlign:'right', fontFamily:T.mono, color:T.amber}}>{r.gfGap}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <Panel title="Activities Coverage by Country">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={LATAM_CLUSTER}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="country" tick={{fontSize:11, fill:T.textSec}} />
              <YAxis tick={{fontSize:11, fill:T.textSec}} />
              <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
              <Bar dataKey="activities" fill={T.sage} radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Gap to EU Taxonomy (%)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={LATAM_CLUSTER}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="country" tick={{fontSize:11, fill:T.textSec}} />
              <YAxis tick={{fontSize:11, fill:T.textSec}} unit="%" />
              <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
              <Bar dataKey="gfGap" fill={T.amber} radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="LATAM Taxonomy Common Patterns">
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
          {[
            { t:'Adaptation-First', d:'All 4 regimes emphasise climate adaptation alongside mitigation (reflecting physical-risk exposure)' },
            { t:'Just Transition Anchor', d:'Mexico and Colombia embed socioeconomic thresholds alongside environmental TSC' },
            { t:'Biodiversity Priority', d:'Brazil taxonomy explicitly integrates Cerrado + Amazon biome protection' },
            { t:'EU-Aligned Spine', d:'All 4 reference EU activity structure while preserving local NAMA + NDC priorities' },
            { t:'Banking Sector Uptake', d:'FELABAN coordinating harmonization of disclosure across LATAM banks' },
            { t:'Mining Inclusion', d:'Chile uniquely includes transition mining (Cu, Li) as key sector — global outlier' },
          ].map((x, i) => (
            <div key={i} style={{border:`1px solid ${T.border}`, padding:14, background:T.surface, borderLeft:`3px solid #16a34a`}}>
              <div style={{fontSize:12, fontWeight:600, color:T.navy, marginBottom:4}}>{x.t}</div>
              <div style={{fontSize:11, color:T.textSec}}>{x.d}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ZAIFSCATab() {
  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="ZA GFT ACTIVITIES" value="59" sub="Green Finance Taxonomy" accent={T.navy} />
        <KpiCard label="IFSCA ACTIVITIES" value="28" sub="India IFSC disclosure framework" accent={T.gold} />
        <KpiCard label="ZA SECTORS" value="7" sub="Agri, Energy, Mfg, Transport, Bldg, Water, Waste" accent={T.sage} />
        <KpiCard label="IFSCA ALIGNED TO" value="ICMA" sub="GBP / GLP / SLBP" accent={T.green} />
      </div>

      {SA_IFSCA.map((r, i) => (
        <Panel key={i} title={`${r.region} — ${r.framework}`}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:12}}>
            <div>
              <div style={{fontFamily:T.mono, fontSize:10, color:T.textMut}}>PUBLISHED</div>
              <div style={{fontSize:13, fontWeight:600, color:T.navy}}>{r.published}</div>
            </div>
            <div>
              <div style={{fontFamily:T.mono, fontSize:10, color:T.textMut}}>ACTIVITIES</div>
              <div style={{fontSize:13, fontWeight:600, color:T.navy}}>{r.activities}</div>
            </div>
            <div>
              <div style={{fontFamily:T.mono, fontSize:10, color:T.textMut}}>REGULATOR</div>
              <div style={{fontSize:13, fontWeight:600, color:T.navy}}>{r.regulator}</div>
            </div>
            <div>
              <div style={{fontFamily:T.mono, fontSize:10, color:T.textMut}}>SECTORS</div>
              <div style={{fontSize:11, color:T.navy, fontWeight:500}}>{r.sectors}</div>
            </div>
          </div>
          <div style={{padding:12, background:T.surfaceH, borderLeft:`3px solid ${T.gold}`, fontSize:12, color:T.textSec}}>{r.notes}</div>
        </Panel>
      ))}

      <Panel title="South Africa GFT — Activity Sector Breakdown">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={[
            { sector:'Energy', activities:18 },
            { sector:'Agri/Forestry', activities:9 },
            { sector:'Transport', activities:8 },
            { sector:'Manufacturing', activities:7 },
            { sector:'Construction', activities:7 },
            { sector:'Water', activities:6 },
            { sector:'Waste', activities:4 },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="sector" tick={{fontSize:11, fill:T.textSec}} />
            <YAxis tick={{fontSize:11, fill:T.textSec}} />
            <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
            <Bar dataKey="activities" fill={'#15803d'} radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="IFSCA India — Framework Scope (Gift City)">
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
          {[
            { t:'Green Debt', d:'Use-of-proceeds bonds financing eligible green projects' },
            { t:'Transition Debt', d:'Hard-to-abate sector transition; SBTi + pathway required' },
            { t:'Sustainability-Linked', d:'Issuer-level KPIs + coupon step-up for miss' },
          ].map((x, i) => (
            <div key={i} style={{border:`1px solid ${T.border}`, padding:14, background:T.surface, borderTop:`3px solid #ea580c`}}>
              <div style={{fontSize:13, fontWeight:600, color:T.navy, marginBottom:4}}>{x.t}</div>
              <div style={{fontSize:11, color:T.textSec}}>{x.d}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function CanadaTab() {
  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="FRAMEWORK" value="Two-Tier" sub="Green + Transition" accent={T.navy} />
        <KpiCard label="STATUS" value="Draft" sub="Consultation 2024–25" accent={T.gold} />
        <KpiCard label="ACTIVITIES" value="42" sub="Combined G+T total" accent={T.sage} />
        <KpiCard label="OIL SANDS" value="Excluded" sub="Explicitly excluded from Transition" accent={T.red} />
      </div>

      {CANADA_TRANSITION.map((t, i) => (
        <Panel key={i} title={`${t.tier} Tier — ${t.definition}`}>
          <div style={{marginBottom:12, padding:12, background:T.surfaceH, borderLeft:`3px solid ${t.tier==='Green'?T.green:T.amber}`}}>
            <div style={{fontFamily:T.mono, fontSize:10, color:T.textMut, letterSpacing:0.5}}>THRESHOLD</div>
            <div style={{fontSize:12, color:T.navy, fontWeight:500}}>{t.threshold}</div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8}}>
            {t.activities.map((a, j) => {
              const excluded = a.includes('EXCLUDED');
              return (
                <div key={j} style={{border:`1px solid ${T.border}`, padding:10, background:T.surface, opacity: excluded ? 0.6 : 1, textDecoration: excluded ? 'line-through' : 'none'}}>
                  <div style={{fontSize:12, color: excluded ? T.red : T.navy, fontWeight:500}}>{a}</div>
                </div>
              );
            })}
          </div>
        </Panel>
      ))}

      <Panel title="Canada Green/Transition Taxonomy — Key Design Choices">
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
          {[
            { t:'Entity-Level Alignment', d:'Transition activities require SBTi 1.5°C corporate target + capex plan' },
            { t:'Oil Sands Exclusion', d:'Industry sought inclusion — rejected in 2024 final draft' },
            { t:'Indigenous Consent', d:'FPIC (Free Prior Informed Consent) embedded as minimum safeguard' },
            { t:'Science-Aligned TSC', d:'Grounded in IEA NZE 2050 scenarios, not regional carveouts' },
            { t:'Mining Transition Path', d:'Critical minerals (Ni, Cu, Li, Co) included under Transition with ESG screens' },
            { t:'Just Transition', d:'Worker & community impact assessment required for Transition activities' },
          ].map((x, i) => (
            <div key={i} style={{border:`1px solid ${T.border}`, padding:14, background:T.surface, borderLeft:`3px solid #be123c`}}>
              <div style={{fontSize:12, fontWeight:600, color:T.navy, marginBottom:4}}>{x.t}</div>
              <div style={{fontSize:11, color:T.textSec}}>{x.d}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function USSECTab() {
  return (
    <div>
      <div style={{background:'#fef3c7', border:`1px solid ${T.amber}`, padding:14, marginBottom:16, borderLeft:`4px solid ${T.amber}`}}>
        <div style={{fontFamily:T.mono, fontSize:11, color:T.amber, letterSpacing:0.5, fontWeight:600, marginBottom:4}}>REGULATORY STATUS</div>
        <div style={{fontSize:13, color:T.navy}}>SEC Climate Disclosure Rule (17 CFR §229, Subpart 1500) — <strong>STAYED Apr 4, 2024</strong> by 8th Circuit pending consolidated litigation. Final rule adopted Mar 6, 2024 <em>without</em> Scope 3. Rule remains inoperative as of this snapshot.</div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="REGULATOR" value="SEC" sub="Securities & Exchange Commission" accent={T.navy} />
        <KpiCard label="ADOPTION DATE" value="Mar 2024" sub="Final rule adopted 3-2 vote" accent={T.gold} />
        <KpiCard label="STAY DATE" value="Apr 2024" sub="8th Circuit stay pending litigation" accent={T.red} />
        <KpiCard label="SCOPE 3" value="Removed" sub="Dropped from final rule" accent={T.textMut} />
      </div>

      <Panel title="SEC Climate Rule — Item 1500–1507 Summary">
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
          <thead>
            <tr style={{background:T.surfaceH, borderBottom:`1px solid ${T.border}`}}>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>RULE</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>DESCRIPTION</th>
              <th style={{padding:'8px 10px', textAlign:'center', color:T.textSec}}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {SEC_RULES.map((r, i) => (
              <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surface : T.surfaceH}}>
                <td style={{padding:'8px 10px', fontFamily:T.mono, fontWeight:600, color:T.navy, fontSize:11}}>{r.rule}</td>
                <td style={{padding:'8px 10px', fontSize:12, color:T.textSec}}>{r.desc}</td>
                <td style={{padding:'8px 10px', textAlign:'center'}}>
                  <Pill bg={r.status==='Removed'?'#f3f4f6':'#fef3c7'} color={r.status==='Removed'?T.textMut:T.amber}>{r.status}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Phased Compliance Schedule (if rule un-stayed)">
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
          {[
            { filer:'Large Accelerated Filers (LAF)', fyBegin:'2025', ghgS12:'FY 2026', assurance:'Limited FY 2029 / Reasonable FY 2033' },
            { filer:'Accelerated Filers (AF)', fyBegin:'2026', ghgS12:'FY 2028', assurance:'Limited FY 2031' },
            { filer:'Smaller Reporting / EGCs', fyBegin:'2027', ghgS12:'Exempt', assurance:'Exempt' },
          ].map((x, i) => (
            <div key={i} style={{border:`1px solid ${T.border}`, padding:14, background:T.surface, borderTop:`3px solid #1e40af`}}>
              <div style={{fontSize:13, fontWeight:600, color:T.navy, marginBottom:8}}>{x.filer}</div>
              <div style={{fontSize:11, color:T.textSec, marginBottom:4}}><strong>Begin:</strong> {x.fyBegin}</div>
              <div style={{fontSize:11, color:T.textSec, marginBottom:4}}><strong>GHG S1+S2:</strong> {x.ghgS12}</div>
              <div style={{fontSize:11, color:T.textSec}}><strong>Assurance:</strong> {x.assurance}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="SEC vs EU / ISSB — Scope Comparison">
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
          <thead>
            <tr style={{background:T.surfaceH, borderBottom:`1px solid ${T.border}`}}>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>DIMENSION</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>US SEC</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>EU CSRD</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>ISSB S2</th>
            </tr>
          </thead>
          <tbody>
            {[
              { d:'Materiality', a:'Single (financial)', b:'Double', c:'Single (financial)' },
              { d:'Scope 1', a:'Material-only', b:'Required', c:'Required' },
              { d:'Scope 2', a:'Material-only', b:'Required', c:'Required' },
              { d:'Scope 3', a:'Removed', b:'Required', c:'Required with safe harbour' },
              { d:'Scenario Analysis', a:'If used in strategy', b:'Required', c:'Required' },
              { d:'Transition Plan', a:'Narrative only', b:'Required in full', c:'Required if adopted' },
              { d:'Assurance', a:'Phased limited → reasonable', b:'Limited (EFRAG reasonable from 2028)', c:'Jurisdiction-dependent' },
            ].map((r, i) => (
              <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surface : T.surfaceH}}>
                <td style={{padding:'8px 10px', fontWeight:600, color:T.navy}}>{r.d}</td>
                <td style={{padding:'8px 10px'}}>{r.a}</td>
                <td style={{padding:'8px 10px'}}>{r.b}</td>
                <td style={{padding:'8px 10px'}}>{r.c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function CrosswalkMatrixTab({ selectedTaxonomies, toggleTax, confidenceFloor, setConfidenceFloor, conflictFilter, setConflictFilter, filteredMatrix }) {
  const cellColor = (c) => {
    if (c.status === 'N/A') return '#f3f4f6';
    if (c.status === 'Not Covered') return '#fee2e2';
    if (c.status === 'Partial') return '#fef3c7';
    const intensity = clamp(c.confidence, 0.5, 1);
    if (c.status === 'Fully Aligned') return `rgba(22, 163, 74, ${intensity})`;
    if (c.status === 'Aligned') return `rgba(90, 138, 106, ${intensity})`;
    return '#fff';
  };
  const cellText = (c) => {
    if (c.status === 'N/A') return '—';
    if (c.status === 'Not Covered') return '×';
    if (c.status === 'Partial') return '◐';
    if (c.status === 'Fully Aligned') return '●';
    if (c.status === 'Aligned') return '◉';
    return '';
  };
  const activeTaxonomies = TAXONOMIES.filter(t => selectedTaxonomies.includes(t.id));
  const activeActivities = CROSSWALK_ACTIVITIES;
  const conflictActs = CONFLICTS.map(c => c.activity);
  const displayActivities = conflictFilter ? activeActivities.filter(a => conflictActs.some(c => a.toLowerCase().includes(c.toLowerCase().split(' ')[0]))) : activeActivities;

  const conflictStats = useMemo(() => {
    const bySev = { High: 0, Medium: 0, Low: 0 };
    CONFLICTS.forEach(c => { bySev[c.severity] = (bySev[c.severity] || 0) + 1; });
    return bySev;
  }, []);

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="MATRIX CELLS" value={filteredMatrix.length} sub={`${displayActivities.length} activities × ${activeTaxonomies.length} regimes`} accent={T.navy} />
        <KpiCard label="HIGH-CONF ALIGNMENT" value={filteredMatrix.filter(c => c.confidence >= 0.85 && (c.status === 'Aligned' || c.status === 'Fully Aligned')).length} sub="≥85% ML confidence" accent={T.green} />
        <KpiCard label="CONFLICTS" value={`${conflictStats.High}H / ${conflictStats.Medium}M / ${conflictStats.Low}L`} sub="By severity" accent={T.red} />
        <KpiCard label="CONFIDENCE FLOOR" value={`${Math.round(confidenceFloor * 100)}%`} sub="Filter threshold" accent={T.gold} />
      </div>

      <Panel title="Matrix Controls" right={<Pill bg={T.navy} color="#fff">{filteredMatrix.length} CELLS</Pill>}>
        <div style={{display:'flex', flexWrap:'wrap', gap:12, alignItems:'center'}}>
          <div style={{display:'flex', gap:4, flexWrap:'wrap', flex:1}}>
            {TAXONOMIES.map(t => (
              <button key={t.id} onClick={() => toggleTax(t.id)} style={{
                background: selectedTaxonomies.includes(t.id) ? t.color : 'transparent',
                color: selectedTaxonomies.includes(t.id) ? '#fff' : T.textSec,
                border:`1px solid ${selectedTaxonomies.includes(t.id) ? t.color : T.border}`,
                padding:'4px 10px', fontFamily:T.mono, fontSize:11, cursor:'pointer', borderRadius:2
              }}>{t.id}</button>
            ))}
          </div>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <span style={{fontFamily:T.mono, fontSize:10, color:T.textMut}}>CONF ≥</span>
            <input type="range" min="0" max="1" step="0.05" value={confidenceFloor} onChange={(e) => setConfidenceFloor(parseFloat(e.target.value))} style={{width:140}} />
            <span style={{fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, width:36}}>{Math.round(confidenceFloor * 100)}%</span>
          </div>
          <label style={{display:'flex', alignItems:'center', gap:6, fontSize:11, color:T.textSec, cursor:'pointer'}}>
            <input type="checkbox" checked={conflictFilter} onChange={(e) => setConflictFilter(e.target.checked)} />
            <span style={{fontFamily:T.mono}}>CONFLICTS ONLY</span>
          </label>
        </div>
      </Panel>

      <Panel title={`Crosswalk Heatmap — ${displayActivities.length} Activities × ${activeTaxonomies.length} Regimes`}>
        <div style={{overflowX:'auto'}}>
          <table style={{borderCollapse:'collapse', fontSize:11, minWidth:'100%'}}>
            <thead>
              <tr style={{background:T.surfaceH}}>
                <th style={{padding:'6px 10px', textAlign:'left', color:T.textSec, position:'sticky', left:0, background:T.surfaceH, minWidth:180, borderRight:`1px solid ${T.border}`}}>ACTIVITY</th>
                {activeTaxonomies.map(t => (
                  <th key={t.id} style={{padding:'6px 8px', textAlign:'center', color:t.color, fontFamily:T.mono, fontWeight:700, minWidth:50}}>{t.id}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayActivities.map((act, i) => (
                <tr key={act} style={{borderBottom:`1px solid ${T.borderL}`}}>
                  <td style={{padding:'6px 10px', fontSize:11, color:T.navy, position:'sticky', left:0, background:i % 2 === 0 ? T.surface : T.surfaceH, borderRight:`1px solid ${T.border}`, fontWeight:500}}>{act}</td>
                  {activeTaxonomies.map(t => {
                    const cell = CROSSWALK_MATRIX.find(c => c.activity === act && c.taxonomy === t.id);
                    if (!cell) return <td key={t.id} />;
                    const passConf = cell.confidence >= confidenceFloor || cell.status === 'Not Covered' || cell.status === 'N/A';
                    return (
                      <td key={t.id} title={`${cell.status} · conf ${Math.round(cell.confidence*100)}%`} style={{
                        padding:'6px 8px', textAlign:'center',
                        background: passConf ? cellColor(cell) : '#f9fafb',
                        color: cell.status === 'N/A' || cell.status === 'Not Covered' ? T.textMut : '#fff',
                        opacity: passConf ? 1 : 0.3,
                        fontWeight:600
                      }}>{cellText(cell)}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{marginTop:12, display:'flex', gap:16, fontSize:11, color:T.textSec}}>
          <span><span style={{color:T.green, fontWeight:600}}>●</span> Fully Aligned</span>
          <span><span style={{color:T.sage, fontWeight:600}}>◉</span> Aligned</span>
          <span><span style={{color:T.amber, fontWeight:600}}>◐</span> Partial</span>
          <span><span style={{color:T.red, fontWeight:600}}>×</span> Not Covered</span>
          <span><span style={{color:T.textMut, fontWeight:600}}>—</span> N/A</span>
        </div>
      </Panel>

      <Panel title="Detected Threshold Conflicts (15 cases)">
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
          <thead>
            <tr style={{background:T.surfaceH, borderBottom:`1px solid ${T.border}`}}>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>#</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>ACTIVITY</th>
              <th style={{padding:'8px 10px', textAlign:'center', color:T.textSec}}>A</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>THRESHOLD A</th>
              <th style={{padding:'8px 10px', textAlign:'center', color:T.textSec}}>B</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>THRESHOLD B</th>
              <th style={{padding:'8px 10px', textAlign:'center', color:T.textSec}}>SEVERITY</th>
            </tr>
          </thead>
          <tbody>
            {CONFLICTS.map((c, i) => (
              <tr key={c.id} style={{borderBottom:`1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surface : T.surfaceH}}>
                <td style={{padding:'8px 10px', fontFamily:T.mono, color:T.textMut}}>{c.id}</td>
                <td style={{padding:'8px 10px', fontWeight:500}}>{c.activity}</td>
                <td style={{padding:'8px 10px', textAlign:'center', fontFamily:T.mono, fontWeight:600, color:T.navy}}>{c.taxA}</td>
                <td style={{padding:'8px 10px', fontSize:11, color:T.textSec}}>{c.thresholdA}</td>
                <td style={{padding:'8px 10px', textAlign:'center', fontFamily:T.mono, fontWeight:600, color:T.navy}}>{c.taxB}</td>
                <td style={{padding:'8px 10px', fontSize:11, color:T.textSec}}>{c.thresholdB}</td>
                <td style={{padding:'8px 10px', textAlign:'center'}}>
                  <Pill bg={c.severity==='High'?'#fee2e2':c.severity==='Medium'?'#fef3c7':'#e0e7ff'} color={c.severity==='High'?T.red:c.severity==='Medium'?T.amber:T.navyL}>{c.severity}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function MLEngineTab({ selectedActivity, setSelectedActivity }) {
  const actMappings = useMemo(() => {
    return TAXONOMIES.map(t => {
      const cell = CROSSWALK_MATRIX.find(c => c.activity === selectedActivity && c.taxonomy === t.id);
      return { taxonomy: t.id, name: t.name, status: cell?.status || 'N/A', confidence: (cell?.confidence || 0) * 100, color: t.color };
    });
  }, [selectedActivity]);

  const radarData = actMappings.filter(a => a.taxonomy !== 'US').map(a => ({ subject: a.taxonomy, confidence: a.confidence }));

  const modelComparisonData = ML_MODELS.map(m => ({ name: m.name.split('-')[0], acc: m.accuracy * 100, f1: m.f1 * 100, latency: m.latencyMs }));

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="MODELS IN PRODUCTION" value={ML_MODELS.length} sub="TaxoBERT, ConflictGNN, ThresholdReg" accent={T.navy} />
        <KpiCard label="AVG ACCURACY" value={fmt((ML_MODELS.reduce((s,m)=>s+m.accuracy,0)/Math.max(1,ML_MODELS.length))*100,1)} unit="%" sub="Weighted ensemble" accent={T.gold} />
        <KpiCard label="AVG F1" value={fmt((ML_MODELS.reduce((s,m)=>s+m.f1,0)/Math.max(1,ML_MODELS.length))*100,1)} unit="%" sub="Macro-F1 over 5 folds" accent={T.sage} />
        <KpiCard label="TRAINING PAIRS" value="4,200" sub="Human-labeled crosswalk pairs" accent={T.green} />
      </div>

      <Panel title="Model Registry">
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
          <thead>
            <tr style={{background:T.surfaceH, borderBottom:`1px solid ${T.border}`}}>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>MODEL</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>ARCHITECTURE</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec}}>ACCURACY</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec}}>F1</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>COVERAGE</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>TRAINED ON</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec}}>LATENCY</th>
            </tr>
          </thead>
          <tbody>
            {ML_MODELS.map((m, i) => (
              <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surface : T.surfaceH}}>
                <td style={{padding:'8px 10px', fontFamily:T.mono, fontWeight:600, color:T.navy}}>{m.name}</td>
                <td style={{padding:'8px 10px', fontSize:11}}>{m.type}</td>
                <td style={{padding:'8px 10px', textAlign:'right', fontFamily:T.mono, color:T.green, fontWeight:600}}>{(m.accuracy*100).toFixed(1)}%</td>
                <td style={{padding:'8px 10px', textAlign:'right', fontFamily:T.mono, color:T.sage, fontWeight:600}}>{(m.f1*100).toFixed(1)}%</td>
                <td style={{padding:'8px 10px', fontSize:11}}>{m.coverage}</td>
                <td style={{padding:'8px 10px', fontSize:11, color:T.textSec}}>{m.trainedOn}</td>
                <td style={{padding:'8px 10px', textAlign:'right', fontFamily:T.mono, color:T.gold}}>{m.latencyMs}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <Panel title="Model Performance Benchmarks">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={modelComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{fontSize:11, fill:T.textSec}} />
              <YAxis tick={{fontSize:11, fill:T.textSec}} unit="%" />
              <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
              <Legend />
              <Bar dataKey="acc" fill={T.navy} name="Accuracy %" />
              <Bar dataKey="f1" fill={T.gold} name="F1 %" />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={`Cross-Regime Confidence — ${selectedActivity}`}>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.borderL} />
              <PolarAngleAxis dataKey="subject" tick={{fontSize:10, fill:T.textSec}} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{fontSize:9, fill:T.textMut}} />
              <Radar name="Confidence %" dataKey="confidence" stroke={T.navy} fill={T.navy} fillOpacity={0.3} />
              <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
            </RadarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="Activity Lookup — Live ML Crosswalk" right={
        <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} style={{fontFamily:T.mono, fontSize:11, padding:'6px 10px', border:`1px solid ${T.border}`, background:T.surface}}>
          {CROSSWALK_ACTIVITIES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      }>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
          <thead>
            <tr style={{background:T.surfaceH, borderBottom:`1px solid ${T.border}`}}>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>TAXONOMY</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>NAME</th>
              <th style={{padding:'8px 10px', textAlign:'center', color:T.textSec}}>STATUS</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec}}>ML CONFIDENCE</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>CONFIDENCE BAR</th>
            </tr>
          </thead>
          <tbody>
            {actMappings.map((r, i) => (
              <tr key={r.taxonomy} style={{borderBottom:`1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surface : T.surfaceH}}>
                <td style={{padding:'8px 10px', fontFamily:T.mono, fontWeight:600, color:r.color}}>{r.taxonomy}</td>
                <td style={{padding:'8px 10px'}}>{r.name}</td>
                <td style={{padding:'8px 10px', textAlign:'center'}}>
                  <Pill bg={r.status === 'Fully Aligned' || r.status === 'Aligned' ? '#dcfce7' : r.status === 'Partial' ? '#fef3c7' : '#fee2e2'} color={statusColor(r.status)}>{r.status}</Pill>
                </td>
                <td style={{padding:'8px 10px', textAlign:'right', fontFamily:T.mono, fontWeight:600, color:T.navy}}>{r.confidence.toFixed(1)}%</td>
                <td style={{padding:'8px 10px'}}>
                  <div style={{width:'100%', height:8, background:T.surfaceH, borderRadius:4, overflow:'hidden'}}>
                    <div style={{width:`${r.confidence}%`, height:'100%', background:r.color, transition:'width 0.3s'}} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Pipeline Architecture">
        <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8, alignItems:'center'}}>
          {[
            { s:'1. Ingest', d:'12 taxonomy PDFs · regulatory updates' },
            { s:'2. Parse', d:'NLP section splitter · TSC extractor' },
            { s:'3. Embed', d:'TaxoBERT-768 domain embeddings' },
            { s:'4. Align', d:'Cosine + GNN conflict detector' },
            { s:'5. Score', d:'Confidence + human-in-loop review' },
          ].map((x, i) => (
            <div key={i} style={{border:`1px solid ${T.border}`, padding:14, background:T.surface, borderTop:`3px solid ${T.gold}`, position:'relative'}}>
              <div style={{fontFamily:T.mono, fontSize:10, color:T.gold, fontWeight:700}}>{x.s}</div>
              <div style={{fontSize:11, color:T.textSec, marginTop:6}}>{x.d}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PortfolioTab({ sellerJurisdiction, setSellerJurisdiction, buyerJurisdiction, setBuyerJurisdiction, whatIfAnalysis }) {
  const passportStats = useMemo(() => {
    const pass = whatIfAnalysis.filter(r => r.passport === 'PASS').length;
    const partial = whatIfAnalysis.filter(r => r.passport === 'PARTIAL').length;
    const fail = whatIfAnalysis.filter(r => r.passport === 'FAIL').length;
    return { pass, partial, fail };
  }, [whatIfAnalysis]);

  const sellerTax = TAXONOMIES.find(t => t.id === sellerJurisdiction);
  const buyerTax = TAXONOMIES.find(t => t.id === buyerJurisdiction);

  const portfolioSummary = useMemo(() => {
    const totalAum = PORTFOLIO_ISSUERS.reduce((s, p) => s + p.aum, 0);
    const euAvg = PORTFOLIO_ISSUERS.reduce((s, p) => s + p.euAligned, 0) / Math.max(1, PORTFOLIO_ISSUERS.length);
    const ukAvg = PORTFOLIO_ISSUERS.reduce((s, p) => s + p.ukAligned, 0) / Math.max(1, PORTFOLIO_ISSUERS.length);
    const sgAvg = PORTFOLIO_ISSUERS.reduce((s, p) => s + p.sgAligned, 0) / Math.max(1, PORTFOLIO_ISSUERS.length);
    const cnAvg = PORTFOLIO_ISSUERS.reduce((s, p) => s + p.cnAligned, 0) / Math.max(1, PORTFOLIO_ISSUERS.length);
    const jpAvg = PORTFOLIO_ISSUERS.reduce((s, p) => s + p.jpAligned, 0) / Math.max(1, PORTFOLIO_ISSUERS.length);
    const aseanAvg = PORTFOLIO_ISSUERS.reduce((s, p) => s + p.aseanAligned, 0) / Math.max(1, PORTFOLIO_ISSUERS.length);
    return { totalAum, euAvg, ukAvg, sgAvg, cnAvg, jpAvg, aseanAvg };
  }, []);

  const alignmentData = [
    { name:'EU', aligned: portfolioSummary.euAvg, color: T.navy },
    { name:'UK', aligned: portfolioSummary.ukAvg, color:'#991b1b' },
    { name:'SG', aligned: portfolioSummary.sgAvg, color:'#dc2626' },
    { name:'ASEAN', aligned: portfolioSummary.aseanAvg, color:'#0891b2' },
    { name:'CN', aligned: portfolioSummary.cnAvg, color:'#b91c1c' },
    { name:'JP', aligned: portfolioSummary.jpAvg, color:'#7c2d12' },
  ];

  const sectorAlign = useMemo(() => {
    const m = {};
    PORTFOLIO_ISSUERS.forEach(p => {
      if (!m[p.sector]) m[p.sector] = { sector: p.sector, eu: 0, cn: 0, n: 0 };
      m[p.sector].eu += p.euAligned;
      m[p.sector].cn += p.cnAligned;
      m[p.sector].n += 1;
    });
    return Object.values(m).map(r => ({ sector: r.sector, eu: r.n > 0 ? r.eu / r.n : 0, cn: r.n > 0 ? r.cn / r.n : 0 }));
  }, []);

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="PORTFOLIO AUM" value={`$${fmt(portfolioSummary.totalAum/1000, 2)}bn`} sub={`${PORTFOLIO_ISSUERS.length} issuers`} accent={T.navy} />
        <KpiCard label="EU ALIGNED (avg)" value={fmt(portfolioSummary.euAvg, 1)} unit="%" sub="Weighted CCM" accent={T.gold} />
        <KpiCard label="SG ALIGNED (avg)" value={fmt(portfolioSummary.sgAvg, 1)} unit="%" sub="Green + Amber" accent={T.sage} />
        <KpiCard label="MULTI-LABEL ISSUERS" value={PORTFOLIO_ISSUERS.filter(p => p.multiLabel).length} sub={`of ${PORTFOLIO_ISSUERS.length} total`} accent={T.green} />
      </div>

      <Panel title="Cross-Jurisdiction Alignment (Portfolio Avg)">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={alignmentData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="name" tick={{fontSize:11, fill:T.textSec}} />
            <YAxis tick={{fontSize:11, fill:T.textSec}} unit="%" />
            <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
            <Bar dataKey="aligned" radius={[2,2,0,0]}>
              {alignmentData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Passport-In / Passport-Out What-If Analysis" right={
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <span style={{fontFamily:T.mono, fontSize:10, color:T.textMut}}>ISSUER IN</span>
          <select value={sellerJurisdiction} onChange={(e) => setSellerJurisdiction(e.target.value)} style={{fontFamily:T.mono, fontSize:11, padding:'4px 8px', border:`1px solid ${T.border}`, background:T.surface}}>
            {TAXONOMIES.filter(t => t.id !== 'US').map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
          </select>
          <span style={{fontFamily:T.mono, fontSize:10, color:T.textMut}}>SELLING IN</span>
          <select value={buyerJurisdiction} onChange={(e) => setBuyerJurisdiction(e.target.value)} style={{fontFamily:T.mono, fontSize:11, padding:'4px 8px', border:`1px solid ${T.border}`, background:T.surface}}>
            {TAXONOMIES.filter(t => t.id !== 'US').map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
          </select>
        </div>
      }>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:16}}>
          <KpiCard label="BOTH PASS" value={passportStats.pass} sub="Fully portable" accent={T.green} />
          <KpiCard label="PARTIAL" value={passportStats.partial} sub="One regime only" accent={T.amber} />
          <KpiCard label="FAIL" value={passportStats.fail} sub="Neither recognises" accent={T.red} />
        </div>
        <div style={{padding:12, background:T.surfaceH, borderLeft:`3px solid ${T.gold}`, marginBottom:12}}>
          <div style={{fontFamily:T.mono, fontSize:11, color:T.gold, fontWeight:600, marginBottom:4}}>SCENARIO</div>
          <div style={{fontSize:12, color:T.navy}}>Issuer labeled under <strong>{sellerTax?.name}</strong> attempting to sell into markets covered by <strong>{buyerTax?.name}</strong></div>
        </div>
        <div style={{maxHeight:380, overflowY:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
            <thead>
              <tr style={{background:T.surfaceH, borderBottom:`1px solid ${T.border}`, position:'sticky', top:0}}>
                <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>ACTIVITY</th>
                <th style={{padding:'8px 10px', textAlign:'center', color:T.textSec}}>{sellerJurisdiction}</th>
                <th style={{padding:'8px 10px', textAlign:'center', color:T.textSec}}>{buyerJurisdiction}</th>
                <th style={{padding:'8px 10px', textAlign:'center', color:T.textSec}}>PASSPORT</th>
                <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec}}>AVG CONF</th>
              </tr>
            </thead>
            <tbody>
              {whatIfAnalysis.map((r, i) => (
                <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surface : T.surfaceH}}>
                  <td style={{padding:'6px 10px', fontSize:11}}>{r.activity}</td>
                  <td style={{padding:'6px 10px', textAlign:'center'}}>
                    <Pill bg={r.seller==='Fully Aligned'||r.seller==='Aligned'?'#dcfce7':r.seller==='Partial'?'#fef3c7':r.seller==='N/A'?'#f3f4f6':'#fee2e2'} color={statusColor(r.seller)}>{r.seller}</Pill>
                  </td>
                  <td style={{padding:'6px 10px', textAlign:'center'}}>
                    <Pill bg={r.buyer==='Fully Aligned'||r.buyer==='Aligned'?'#dcfce7':r.buyer==='Partial'?'#fef3c7':r.buyer==='N/A'?'#f3f4f6':'#fee2e2'} color={statusColor(r.buyer)}>{r.buyer}</Pill>
                  </td>
                  <td style={{padding:'6px 10px', textAlign:'center'}}>
                    <Pill bg={r.passport==='PASS'?'#dcfce7':r.passport==='PARTIAL'?'#fef3c7':'#fee2e2'} color={r.passport==='PASS'?T.green:r.passport==='PARTIAL'?T.amber:T.red}>{r.passport}</Pill>
                  </td>
                  <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono, color:T.navy}}>{(r.confAvg*100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Sector-Level Alignment: EU vs China GIGC">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={sectorAlign}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="sector" tick={{fontSize:10, fill:T.textSec}} angle={-20} textAnchor="end" height={70} />
            <YAxis tick={{fontSize:11, fill:T.textSec}} unit="%" />
            <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
            <Legend />
            <Bar dataKey="eu" fill={T.navy} name="EU Aligned %" />
            <Bar dataKey="cn" fill={'#b91c1c'} name="CN Aligned %" />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Issuer-Level Multi-Jurisdictional Alignment">
        <div style={{maxHeight:360, overflowY:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:11}}>
            <thead>
              <tr style={{background:T.surfaceH, borderBottom:`1px solid ${T.border}`, position:'sticky', top:0}}>
                <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>ISSUER</th>
                <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec}}>SECTOR</th>
                <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec}}>AUM ($M)</th>
                <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec}}>EU</th>
                <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec}}>UK</th>
                <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec}}>SG</th>
                <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec}}>CN</th>
                <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec}}>JP</th>
                <th style={{padding:'8px 10px', textAlign:'center', color:T.textSec}}>MULTI</th>
                <th style={{padding:'8px 10px', textAlign:'center', color:T.textSec}}>CONF.</th>
              </tr>
            </thead>
            <tbody>
              {[...PORTFOLIO_ISSUERS].sort((a, b) => b.aum - a.aum).map((p, i) => (
                <tr key={p.id} style={{borderBottom:`1px solid ${T.borderL}`, background: i % 2 === 0 ? T.surface : T.surfaceH}}>
                  <td style={{padding:'6px 10px', fontWeight:500, color:T.navy}}>{p.name}</td>
                  <td style={{padding:'6px 10px', color:T.textSec}}>{p.sector}</td>
                  <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono}}>{p.aum.toFixed(0)}</td>
                  <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono, color:p.euAligned>40?T.green:p.euAligned>20?T.amber:T.red}}>{p.euAligned.toFixed(0)}%</td>
                  <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono, color:p.ukAligned>40?T.green:p.ukAligned>20?T.amber:T.red}}>{p.ukAligned.toFixed(0)}%</td>
                  <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono, color:p.sgAligned>40?T.green:p.sgAligned>20?T.amber:T.red}}>{p.sgAligned.toFixed(0)}%</td>
                  <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono, color:p.cnAligned>40?T.green:p.cnAligned>20?T.amber:T.red}}>{p.cnAligned.toFixed(0)}%</td>
                  <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono, color:p.jpAligned>40?T.green:p.jpAligned>20?T.amber:T.red}}>{p.jpAligned.toFixed(0)}%</td>
                  <td style={{padding:'6px 10px', textAlign:'center'}}>
                    {p.multiLabel ? <Pill bg="#dcfce7" color={T.green}>YES</Pill> : <Pill bg={T.surfaceH} color={T.textMut}>—</Pill>}
                  </td>
                  <td style={{padding:'6px 10px', textAlign:'center', fontFamily:T.mono, color:p.conflicts>1?T.red:p.conflicts>0?T.amber:T.green}}>{p.conflicts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function UKSDRTab() {
  const LABEL_DATA = UK_LABELS.map(l => ({ name: l.id, aum: l.aum, funds: l.funds, color: l.color }));
  const TIMELINE = [
    { date:'Jul 2023', event:'PS23/16 — Final SDR Policy Statement' },
    { date:'May 2024', event:'Anti-greenwashing rule in force' },
    { date:'Jul 2024', event:'Labels live for new products' },
    { date:'Dec 2024', event:'Naming & marketing rules in force' },
    { date:'Dec 2025', event:'Ongoing product-level disclosures due' },
    { date:'Dec 2026', event:'Entity-level report threshold £5bn AUM' },
  ];
  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="REGULATOR" value="FCA" sub="Financial Conduct Authority" accent={T.navy} />
        <KpiCard label="LABELS" value="4" sub="+ unlabeled sustainability mgmt" accent={T.gold} />
        <KpiCard label="THRESHOLD ALL LABELS" value="≥70%" sub="Assets meet label objective" accent={T.sage} />
        <KpiCard label="TOTAL AUM" value={fmt(UK_LABELS.reduce((s,l)=>s+l.aum,0),0)} unit="£bn" sub="As of Q1-2026" accent={T.green} />
      </div>

      <Panel title="4 UK SDR Investment Labels">
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10}}>
          {UK_LABELS.map(l => (
            <div key={l.id} style={{border:`1px solid ${T.border}`, background:T.surface, padding:16, borderTop:`3px solid ${l.color}`}}>
              <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:6}}>
                <span style={{fontSize:18, color:l.color}}>{l.icon}</span>
                <span style={{fontFamily:T.mono, fontSize:10, color:T.textMut}}>{l.id}</span>
              </div>
              <div style={{fontSize:14, fontWeight:600, color:T.navy, marginBottom:8}}>{l.name}</div>
              <div style={{fontSize:11, color:T.textSec, marginBottom:12, minHeight:48}}>{l.desc}</div>
              <div style={{display:'flex', justifyContent:'space-between', borderTop:`1px solid ${T.borderL}`, paddingTop:8}}>
                <div>
                  <div style={{fontFamily:T.mono, fontSize:10, color:T.textMut}}>AUM</div>
                  <div style={{fontSize:14, fontWeight:600, color:T.navy}}>£{l.aum}bn</div>
                </div>
                <div>
                  <div style={{fontFamily:T.mono, fontSize:10, color:T.textMut}}>FUNDS</div>
                  <div style={{fontSize:14, fontWeight:600, color:T.navy}}>{l.funds}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <Panel title="AUM Distribution by Label (£bn)">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={LABEL_DATA} dataKey="aum" nameKey="name" outerRadius={90} label={(e) => e.name + ' £' + e.aum + 'bn'}>
                {LABEL_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Implementation Timeline">
          <div>
            {TIMELINE.map((t, i) => (
              <div key={i} style={{display:'flex', gap:12, padding:'8px 0', borderBottom: i < TIMELINE.length - 1 ? `1px solid ${T.borderL}` : 'none'}}>
                <div style={{fontFamily:T.mono, fontSize:11, color:T.gold, width:84, fontWeight:600}}>{t.date}</div>
                <div style={{fontSize:12, color:T.text}}>{t.event}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

const cosineSim = (a, b) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom > 0.0001 ? dot / denom : 0;
};

const vecForTaxonomy = (tx) => REG_TOKENS.map((tok, i) => {
  const h = hashStr(tx.id + '|' + tok);
  const base = sr(h) * (0.5 + sr(h + 1) * 1.5);
  const affinity = TAXONOMY_TOKEN_AFFINITY[tx.id]?.[tok] ?? 1;
  return base * affinity;
});

function CosineSimilarityTab({ cosineCluster, setCosineCluster }) {
  const vectors = useMemo(() => {
    const m = {};
    TAXONOMIES.forEach(t => { m[t.id] = vecForTaxonomy(t); });
    return m;
  }, []);

  const simMatrix = useMemo(() => {
    return TAXONOMIES.map(tA => ({
      id: tA.id,
      row: TAXONOMIES.map(tB => ({
        id: tB.id,
        sim: tA.id === tB.id ? 1 : cosineSim(vectors[tA.id], vectors[tB.id]),
      })),
    }));
  }, [vectors]);

  const clusters = useMemo(() => {
    const nodes = TAXONOMIES.map(t => ({ id: t.id, members: [t.id] }));
    const pairs = [];
    for (let i = 0; i < TAXONOMIES.length; i++) {
      for (let j = i + 1; j < TAXONOMIES.length; j++) {
        pairs.push({ a: TAXONOMIES[i].id, b: TAXONOMIES[j].id, sim: simMatrix[i].row[j].sim });
      }
    }
    const sorted = [...pairs].sort((x, y) => y.sim - x.sim);
    const map = new Map();
    TAXONOMIES.forEach(t => map.set(t.id, [t.id]));
    const targetClusters = Math.max(2, Math.min(cosineCluster, 10));
    let current = TAXONOMIES.length;
    for (const p of sorted) {
      if (current <= targetClusters) break;
      const ga = Array.from(map.entries()).find(([k, v]) => v.includes(p.a));
      const gb = Array.from(map.entries()).find(([k, v]) => v.includes(p.b));
      if (ga && gb && ga[0] !== gb[0]) {
        const merged = [...ga[1], ...gb[1]];
        map.delete(ga[0]); map.delete(gb[0]);
        map.set(ga[0] + '+' + gb[0], merged);
        current--;
      }
    }
    return Array.from(map.entries()).map(([key, members], i) => ({ key, members, color: ['#1b3a5c','#c5a96a','#5a8a6a','#7c3aed','#dc2626','#0891b2','#d97706','#16a34a','#991b1b','#be123c'][i % 10] }));
  }, [simMatrix, cosineCluster]);

  const avgSim = useMemo(() => {
    let n = 0, s = 0;
    for (let i = 0; i < simMatrix.length; i++) {
      for (let j = i + 1; j < simMatrix.length; j++) { s += simMatrix[i].row[j].sim; n++; }
    }
    return n > 0 ? s / n : 0;
  }, [simMatrix]);

  const strongestPair = useMemo(() => {
    let best = { a:'', b:'', sim:-1 };
    for (let i = 0; i < simMatrix.length; i++) {
      for (let j = i + 1; j < simMatrix.length; j++) {
        if (simMatrix[i].row[j].sim > best.sim) best = { a: simMatrix[i].id, b: simMatrix[j].id, sim: simMatrix[i].row[j].sim };
      }
    }
    return best;
  }, [simMatrix]);

  const weakestPair = useMemo(() => {
    let worst = { a:'', b:'', sim:2 };
    for (let i = 0; i < simMatrix.length; i++) {
      for (let j = i + 1; j < simMatrix.length; j++) {
        const s = simMatrix[i].row[j].sim;
        const aId = simMatrix[i].id; const bId = simMatrix[j].id;
        if (aId === 'US' || bId === 'US') continue;
        if (s < worst.sim) worst = { a: aId, b: bId, sim: s };
      }
    }
    return worst;
  }, [simMatrix]);

  const colorFor = (v) => {
    if (v >= 0.92) return '#14532d';
    if (v >= 0.82) return '#15803d';
    if (v >= 0.72) return '#65a30d';
    if (v >= 0.60) return '#d97706';
    if (v >= 0.45) return '#dc2626';
    return '#7f1d1d';
  };

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="VECTOR DIMENSION" value={REG_TOKENS.length} sub="Regulatory tokens per tax" accent={T.navy} />
        <KpiCard label="AVG PAIRWISE COSINE" value={fmt(avgSim * 100, 1)} unit="%" sub="Across 66 pairs" accent={T.gold} />
        <KpiCard label="STRONGEST PAIR" value={strongestPair.a + '-' + strongestPair.b} sub={'cos θ = ' + fmt(strongestPair.sim, 3)} accent={T.green} />
        <KpiCard label="WEAKEST PAIR (ex-US)" value={weakestPair.a + '-' + weakestPair.b} sub={'cos θ = ' + fmt(weakestPair.sim, 3)} accent={T.red} />
      </div>

      <Panel title="Cluster Count Control" right={<Pill bg={T.surfaceH} color={T.navy}>GREEDY AGGLOMERATION</Pill>}>
        <div style={{display:'flex', alignItems:'center', gap:16}}>
          <span style={{fontFamily:T.mono, fontSize:11, color:T.textSec}}>TARGET CLUSTERS</span>
          <input type="range" min="2" max="10" value={cosineCluster} onChange={e => setCosineCluster(parseInt(e.target.value))} style={{flex:1, accentColor:T.gold}} />
          <span style={{fontFamily:T.mono, fontSize:14, color:T.navy, fontWeight:600, width:32}}>{cosineCluster}</span>
        </div>
      </Panel>

      <Panel title="12 × 12 Cosine Similarity Heatmap" right={<Pill bg={T.surfaceH} color={T.textSec}>TF-IDF STYLE</Pill>}>
        <div style={{overflowX:'auto'}}>
          <table style={{borderCollapse:'collapse', fontSize:10, fontFamily:T.mono}}>
            <thead>
              <tr>
                <th style={{padding:'4px 6px'}}></th>
                {TAXONOMIES.map(t => <th key={t.id} style={{padding:'4px 6px', color:T.textSec, fontWeight:600}}>{t.id}</th>)}
              </tr>
            </thead>
            <tbody>
              {simMatrix.map((row, i) => (
                <tr key={row.id}>
                  <td style={{padding:'4px 6px', color:T.textSec, fontWeight:600}}>{row.id}</td>
                  {row.row.map((cell, j) => (
                    <td key={j} title={row.id + '↔' + cell.id + ' = ' + fmt(cell.sim, 3)} style={{padding:'4px 6px', textAlign:'center', background:colorFor(cell.sim), color:cell.sim >= 0.7 ? '#fff' : '#fff', minWidth:38}}>
                      {fmt(cell.sim, 2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <Panel title={'Greedy Agglomeration → ' + clusters.length + ' Clusters'}>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {clusters.map((c, i) => (
              <div key={c.key} style={{border:`1px solid ${T.border}`, padding:12, borderLeft:`3px solid ${c.color}`, background:T.surfaceH}}>
                <div style={{fontFamily:T.mono, fontSize:10, color:T.textMut, marginBottom:4}}>CLUSTER #{i + 1}</div>
                <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                  {c.members.map(m => (
                    <span key={m} style={{padding:'4px 8px', background:c.color, color:'#fff', fontFamily:T.mono, fontSize:11, fontWeight:600}}>{m}</span>
                  ))}
                </div>
                <div style={{fontSize:11, color:T.textSec, marginTop:6}}>{c.members.length} regime{c.members.length>1?'s':''} · semantic coherence detected</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Dendrogram Tree (Merge Order)">
          <svg width="100%" height={Math.max(260, clusters.length * 48)} viewBox={'0 0 400 ' + Math.max(260, clusters.length * 48)}>
            {clusters.map((c, i) => {
              const y = 24 + i * 44;
              return (
                <g key={c.key}>
                  <line x1="20" y1={y} x2="140" y2={y} stroke={T.borderL} strokeWidth="1" />
                  <circle cx="20" cy={y} r="5" fill={c.color} />
                  <text x="30" y={y + 4} fontSize="11" fontFamily={T.mono} fill={T.navy} fontWeight="600">Cluster {i + 1}</text>
                  <text x="150" y={y + 4} fontSize="10" fontFamily={T.mono} fill={T.textSec}>{c.members.join(' + ')}</text>
                </g>
              );
            })}
          </svg>
        </Panel>
      </div>

      <Panel title="Token-Level Vector Contribution (Top-10 Tokens)" right={<Pill bg={T.surfaceH} color={T.textSec}>{REG_TOKENS.length} TOKENS</Pill>}>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={REG_TOKENS.slice(0, 12).map(tok => {
            const row = { token: tok };
            ['EU','UK','SG','CN','JP'].forEach(id => { row[id] = (TAXONOMY_TOKEN_AFFINITY[id]?.[tok] ?? 0) * 50; });
            return row;
          })}>
            <PolarGrid stroke={T.borderL} />
            <PolarAngleAxis dataKey="token" tick={{fontSize:10, fill:T.textSec}} />
            <PolarRadiusAxis tick={{fontSize:9, fill:T.textMut}} />
            <Radar name="EU" dataKey="EU" stroke={T.navy} fill={T.navy} fillOpacity={0.15} />
            <Radar name="UK" dataKey="UK" stroke="#991b1b" fill="#991b1b" fillOpacity={0.12} />
            <Radar name="SG" dataKey="SG" stroke="#dc2626" fill="#dc2626" fillOpacity={0.10} />
            <Radar name="CN" dataKey="CN" stroke="#b91c1c" fill="#b91c1c" fillOpacity={0.10} />
            <Radar name="JP" dataKey="JP" stroke="#7c2d12" fill="#7c2d12" fillOpacity={0.10} />
            <Legend wrapperStyle={{fontSize:11}} />
          </RadarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

const consensusThreshold = (conflict) => {
  const vals = conflict.points.map(p => ({ ...p, weight: JURISDICTION_WEIGHTS[p.jur] ? (JURISDICTION_WEIGHTS[p.jur].gdp + JURISDICTION_WEIGHTS[p.jur].aum) : 1 }));
  const wsum = vals.reduce((a, p) => a + p.weight, 0);
  return wsum > 0 ? vals.reduce((a, p) => a + p.threshold * p.weight, 0) / wsum : 0;
};

function ConflictResolverTab({ selectedConflict, setSelectedConflict }) {
  const active = useMemo(() => QUANTIFIED_CONFLICTS.find(c => c.id === selectedConflict) || QUANTIFIED_CONFLICTS[0], [selectedConflict]);
  const consensus = useMemo(() => consensusThreshold(active), [active]);

  const sortedPts = useMemo(() => {
    const pts = active.points.map(p => ({ ...p, weight: JURISDICTION_WEIGHTS[p.jur]?.gdp + JURISDICTION_WEIGHTS[p.jur]?.aum || 1 }));
    return active.direction === 'lower-is-stricter' ? [...pts].sort((a, b) => a.threshold - b.threshold) : [...pts].sort((a, b) => b.threshold - a.threshold);
  }, [active]);

  const strictest = sortedPts[0];
  const loosest = sortedPts[sortedPts.length - 1];

  const costOfCompliance = useMemo(() => {
    return QUANTIFIED_CONFLICTS.map(conf => {
      const cons = consensusThreshold(conf);
      const sortedP = conf.direction === 'lower-is-stricter' ? [...conf.points].sort((a, b) => a.threshold - b.threshold) : [...conf.points].sort((a, b) => b.threshold - a.threshold);
      const strict = sortedP[0].threshold;
      const loose = sortedP[sortedP.length - 1].threshold;
      const spread = Math.abs(strict - loose);
      const costStrictIdx = spread > 0 ? Math.abs(strict - loose) / Math.max(0.01, Math.abs(cons)) : 0;
      return {
        id: conf.id,
        activity: conf.activity,
        unit: conf.unit,
        strictest: strict,
        consensus: cons,
        loosest: loose,
        spreadPct: Math.max(0.01, Math.abs(cons)) > 0 ? (spread / Math.max(0.01, Math.abs(cons))) * 100 : 0,
        costMostStringent: 1 + costStrictIdx * 0.6,
        costConsensus: 1 + costStrictIdx * 0.25,
      };
    });
  }, []);

  const totalSpreadBn = costOfCompliance.reduce((s, r) => s + r.spreadPct, 0);

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="QUANTIFIED CONFLICTS" value={QUANTIFIED_CONFLICTS.length} sub="Numeric threshold divergences" accent={T.red} />
        <KpiCard label="AVG NORM SPREAD" value={fmt(costOfCompliance.length > 0 ? totalSpreadBn / costOfCompliance.length : 0, 1)} unit="%" sub="Strictest ↔ loosest / consensus" accent={T.amber} />
        <KpiCard label="ARBITER MODEL" value="GDP+AUM WGT" sub="Weighted-consensus threshold" accent={T.navy} />
        <KpiCard label="ACTIVE CONFLICT" value={active.activity} sub={active.unit + ' · ' + active.direction} accent={T.gold} />
      </div>

      <Panel title="Select Conflict to Arbitrate">
        <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
          {QUANTIFIED_CONFLICTS.map(c => (
            <button key={c.id} onClick={() => setSelectedConflict(c.id)} style={{
              background: selectedConflict === c.id ? T.navy : 'transparent',
              color: selectedConflict === c.id ? '#fff' : T.textSec,
              border:`1px solid ${selectedConflict === c.id ? T.navy : T.border}`,
              padding:'8px 14px', fontFamily:T.mono, fontSize:11, cursor:'pointer'
            }}>{c.activity}</button>
          ))}
        </div>
      </Panel>

      <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:12, marginBottom:16}}>
        <Panel title={'Resolution Table — ' + active.activity}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
            <thead>
              <tr style={{background:T.surfaceH, borderBottom:`1px solid ${T.border}`}}>
                <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600}}>JUR</th>
                <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec, fontWeight:600}}>THRESHOLD</th>
                <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec, fontWeight:600}}>WEIGHT (GDP+AUM)</th>
                <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec, fontWeight:600}}>DEV FROM CONSENSUS</th>
                <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec, fontWeight:600}}>RANK</th>
              </tr>
            </thead>
            <tbody>
              {sortedPts.map((p, i) => {
                const w = p.weight;
                const dev = consensus > 0.0001 ? ((p.threshold - consensus) / consensus) * 100 : 0;
                return (
                  <tr key={p.jur} style={{borderBottom:`1px solid ${T.borderL}`}}>
                    <td style={{padding:'6px 10px', fontWeight:600}}>{p.jur}</td>
                    <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono, color:T.navy}}>{fmt(p.threshold, 3)}</td>
                    <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono}}>{fmt(w, 1)}</td>
                    <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono, color: Math.abs(dev) > 30 ? T.red : Math.abs(dev) > 15 ? T.amber : T.green}}>{fmt(dev, 1)}%</td>
                    <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono}}>#{i + 1}</td>
                  </tr>
                );
              })}
              <tr style={{background:T.surfaceH, borderTop:`2px solid ${T.gold}`}}>
                <td style={{padding:'8px 10px', fontWeight:700, color:T.gold}}>CONSENSUS</td>
                <td style={{padding:'8px 10px', textAlign:'right', fontFamily:T.mono, color:T.gold, fontWeight:700}}>{fmt(consensus, 3)}</td>
                <td style={{padding:'8px 10px', textAlign:'right', fontFamily:T.mono}}>—</td>
                <td style={{padding:'8px 10px', textAlign:'right', fontFamily:T.mono}}>0.0%</td>
                <td style={{padding:'8px 10px', textAlign:'right', fontFamily:T.mono}}>—</td>
              </tr>
            </tbody>
          </table>
          <div style={{marginTop:12, fontSize:11, color:T.textSec}}>Arbiter formula: Σ(threshold·weight) / Σ(weight); weights = GDP + AUM share.</div>
        </Panel>

        <Panel title="Threshold Distribution (Bar)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sortedPts.map(p => ({ jur:p.jur, threshold:p.threshold }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="jur" tick={{fontSize:11, fill:T.textSec}} />
              <YAxis tick={{fontSize:11, fill:T.textSec}} />
              <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
              <Bar dataKey="threshold" fill={T.navy} radius={[3,3,0,0]} />
              <Line type="monotone" dataKey={() => consensus} stroke={T.gold} strokeWidth={2} dot={false} name="Consensus" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{display:'flex', justifyContent:'space-between', marginTop:8, fontSize:11, fontFamily:T.mono}}>
            <span style={{color:T.green}}>STRICTEST: {strictest.jur} ({fmt(strictest.threshold, 2)})</span>
            <span style={{color:T.gold}}>CONSENSUS: {fmt(consensus, 2)}</span>
            <span style={{color:T.red}}>LOOSEST: {loosest.jur} ({fmt(loosest.threshold, 2)})</span>
          </div>
        </Panel>
      </div>

      <Panel title="Cost-of-Compliance: Most-Stringent vs Consensus (all quantified conflicts)">
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
          <thead>
            <tr style={{background:T.surfaceH, borderBottom:`1px solid ${T.border}`}}>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600}}>ACTIVITY</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec, fontWeight:600}}>STRICTEST</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec, fontWeight:600}}>CONSENSUS</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec, fontWeight:600}}>LOOSEST</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec, fontWeight:600}}>SPREAD %</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec, fontWeight:600}}>COST (STRICT)</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec, fontWeight:600}}>COST (CONSENSUS)</th>
            </tr>
          </thead>
          <tbody>
            {costOfCompliance.map(r => (
              <tr key={r.id} style={{borderBottom:`1px solid ${T.borderL}`}}>
                <td style={{padding:'6px 10px', color:T.navy}}>{r.activity}</td>
                <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono, color:T.green}}>{fmt(r.strictest, 2)}</td>
                <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono, color:T.gold}}>{fmt(r.consensus, 2)}</td>
                <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono, color:T.red}}>{fmt(r.loosest, 2)}</td>
                <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono}}>{fmt(r.spreadPct, 1)}%</td>
                <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono, color:T.red}}>{fmt(r.costMostStringent, 2)}×</td>
                <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono, color:T.green}}>{fmt(r.costConsensus, 2)}×</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{marginTop:12, padding:12, background:T.surfaceH, borderLeft:`3px solid ${T.gold}`, fontSize:11, color:T.textSec}}>
          Arbiter saves <b style={{color:T.navy}}>~{fmt(costOfCompliance.length > 0 ? (costOfCompliance.reduce((s, r) => s + (r.costMostStringent - r.costConsensus), 0) / costOfCompliance.length) * 100 : 0, 0)}%</b> compliance cost vs most-stringent regime while maintaining <b style={{color:T.navy}}>90%+</b> environmental integrity.
        </div>
      </Panel>
    </div>
  );
}

function PassportRouterTab({ passportDomicile, setPassportDomicile, passportSelling, setPassportSelling }) {
  const toggleSelling = (id) => {
    setPassportSelling(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const activeTaxonomies = useMemo(() => {
    const ids = [passportDomicile, ...passportSelling];
    return [...new Set(ids)];
  }, [passportDomicile, passportSelling]);

  const dominantThree = useMemo(() => {
    const scored = activeTaxonomies.map(id => {
      const w = JURISDICTION_WEIGHTS[id] || { gdp: 0, aum: 0, regPower: 0, stringency: 0 };
      const score = w.gdp * 0.25 + w.aum * 0.35 + w.regPower * 20 + w.stringency * 20;
      return { id, score, stringency: w.stringency, regPower: w.regPower };
    });
    return [...scored].sort((a, b) => b.score - a.score).slice(0, 3);
  }, [activeTaxonomies]);

  const ruleWaterfall = useMemo(() => {
    const steps = [];
    steps.push({ step: 1, label: 'Domicile Taxonomy', result: passportDomicile, detail: TAXONOMIES.find(t => t.id === passportDomicile)?.name || '-' });
    steps.push({ step: 2, label: 'Selling Jurisdictions', result: passportSelling.join(', ') || '(none)', detail: passportSelling.length + ' additional regime(s)' });
    steps.push({ step: 3, label: 'Union of Applicable Regimes', result: activeTaxonomies.join(' ∪ '), detail: 'Binding TSC from each' });
    steps.push({ step: 4, label: 'Dominant Trio (score-ranked)', result: dominantThree.map(d => d.id).join(' · '), detail: 'By GDP + AUM + regPower + stringency' });
    const minCommonActivities = CROSSWALK_ACTIVITIES.filter(act => activeTaxonomies.every(tid => {
      const cell = CROSSWALK_MATRIX.find(c => c.activity === act && c.taxonomy === tid);
      return cell && (cell.status === 'Aligned' || cell.status === 'Fully Aligned');
    }));
    steps.push({ step: 5, label: 'Minimum Common Standard', result: minCommonActivities.length + ' activities', detail: 'Intersection of aligned TSC' });
    const totalCells = activeTaxonomies.length * CROSSWALK_ACTIVITIES.length;
    const alignedCells = activeTaxonomies.reduce((acc, tid) => acc + CROSSWALK_ACTIVITIES.filter(act => {
      const cell = CROSSWALK_MATRIX.find(c => c.activity === act && c.taxonomy === tid);
      return cell && (cell.status === 'Aligned' || cell.status === 'Fully Aligned');
    }).length, 0);
    const avgConf = (() => {
      let s = 0, n = 0;
      activeTaxonomies.forEach(tid => {
        CROSSWALK_ACTIVITIES.forEach(act => {
          const cell = CROSSWALK_MATRIX.find(c => c.activity === act && c.taxonomy === tid);
          if (cell && cell.status !== 'N/A') { s += cell.confidence; n++; }
        });
      });
      return n > 0 ? s / n : 0;
    })();
    const passportConf = totalCells > 0 ? ((alignedCells / totalCells) * 0.55 + avgConf * 0.45) * 100 : 0;
    steps.push({ step: 6, label: 'Passport Confidence Score', result: fmt(passportConf, 1) + '%', detail: 'Composite alignment × ML confidence' });
    return { steps, minCommonActivities, passportConf };
  }, [activeTaxonomies, passportDomicile, passportSelling, dominantThree]);

  const perActivityMatrix = useMemo(() => {
    return CROSSWALK_ACTIVITIES.map(act => {
      const row = { activity: act };
      let allOK = true;
      activeTaxonomies.forEach(tid => {
        const cell = CROSSWALK_MATRIX.find(c => c.activity === act && c.taxonomy === tid);
        row[tid] = cell?.status || 'N/A';
        if (!cell || (cell.status !== 'Aligned' && cell.status !== 'Fully Aligned')) allOK = false;
      });
      row.passport = allOK ? 'PASS' : activeTaxonomies.some(tid => { const c = CROSSWALK_MATRIX.find(c => c.activity === act && c.taxonomy === tid); return c && (c.status === 'Aligned' || c.status === 'Fully Aligned'); }) ? 'PARTIAL' : 'FAIL';
      return row;
    });
  }, [activeTaxonomies]);

  const passCount = perActivityMatrix.filter(r => r.passport === 'PASS').length;
  const partialCount = perActivityMatrix.filter(r => r.passport === 'PARTIAL').length;
  const failCount = perActivityMatrix.filter(r => r.passport === 'FAIL').length;

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="DOMICILE" value={passportDomicile} sub={TAXONOMIES.find(t => t.id === passportDomicile)?.name || ''} accent={T.navy} />
        <KpiCard label="SELLING IN" value={passportSelling.length} sub="Additional jurisdictions" accent={T.gold} />
        <KpiCard label="ACTIVE REGIMES" value={activeTaxonomies.length} sub="Union applied" accent={T.sage} />
        <KpiCard label="PASSPORT CONFIDENCE" value={fmt(ruleWaterfall.passportConf, 1)} unit="%" sub="Composite score" accent={ruleWaterfall.passportConf > 75 ? T.green : ruleWaterfall.passportConf > 55 ? T.amber : T.red} />
      </div>

      <Panel title="Configure Passport Route">
        <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:24}}>
          <div>
            <div style={{fontFamily:T.mono, fontSize:11, color:T.textSec, marginBottom:8}}>ISSUER DOMICILED IN</div>
            <select value={passportDomicile} onChange={e => setPassportDomicile(e.target.value)} style={{width:'100%', padding:'8px 10px', fontFamily:T.mono, fontSize:12, border:`1px solid ${T.border}`, background:T.surface, color:T.navy}}>
              {TAXONOMIES.map(t => <option key={t.id} value={t.id}>{t.id} — {t.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontFamily:T.mono, fontSize:11, color:T.textSec, marginBottom:8}}>SELLING IN (TOGGLE)</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
              {TAXONOMIES.filter(t => t.id !== passportDomicile).map(t => (
                <button key={t.id} onClick={() => toggleSelling(t.id)} style={{
                  padding:'6px 12px', fontFamily:T.mono, fontSize:11,
                  background: passportSelling.includes(t.id) ? t.color : 'transparent',
                  color: passportSelling.includes(t.id) ? '#fff' : T.textSec,
                  border:`1px solid ${passportSelling.includes(t.id) ? t.color : T.border}`,
                  cursor:'pointer'
                }}>{t.id}</button>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:12, marginBottom:16}}>
        <Panel title="Rule-Application Waterfall">
          <div>
            {ruleWaterfall.steps.map((s, i) => (
              <div key={i} style={{display:'flex', gap:14, padding:'12px 0', borderBottom: i < ruleWaterfall.steps.length - 1 ? `1px solid ${T.borderL}` : 'none'}}>
                <div style={{width:32, height:32, borderRadius:'50%', background:T.navy, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.mono, fontSize:13, fontWeight:600, flexShrink:0}}>{s.step}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:T.mono, fontSize:10, color:T.textMut, letterSpacing:1}}>{s.label}</div>
                  <div style={{fontSize:14, fontWeight:600, color:T.navy, margin:'2px 0'}}>{s.result}</div>
                  <div style={{fontSize:11, color:T.textSec}}>{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Dominant Trio by Composite Score">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dominantThree.map(d => ({ id: d.id, score: d.score, stringency: d.stringency * 100, reg: d.regPower * 100 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="id" tick={{fontSize:11, fill:T.textSec}} />
              <YAxis tick={{fontSize:11, fill:T.textSec}} />
              <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
              <Legend wrapperStyle={{fontSize:11}} />
              <Bar dataKey="score" fill={T.navy} name="Score" radius={[2,2,0,0]} />
              <Bar dataKey="stringency" fill={T.gold} name="Stringency×100" radius={[2,2,0,0]} />
              <Bar dataKey="reg" fill={T.sage} name="RegPower×100" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title={'Passport Activity Matrix · ' + passCount + ' PASS · ' + partialCount + ' PARTIAL · ' + failCount + ' FAIL'} right={<Pill bg={T.surfaceH} color={T.textSec}>{CROSSWALK_ACTIVITIES.length} activities</Pill>}>
        <div style={{maxHeight:420, overflowY:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:11}}>
            <thead style={{position:'sticky', top:0, background:T.surfaceH}}>
              <tr style={{borderBottom:`1px solid ${T.border}`}}>
                <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600}}>ACTIVITY</th>
                {activeTaxonomies.map(tid => <th key={tid} style={{padding:'8px 6px', color:T.textSec, fontWeight:600}}>{tid}</th>)}
                <th style={{padding:'8px 10px', textAlign:'center', color:T.textSec, fontWeight:600}}>PASSPORT</th>
              </tr>
            </thead>
            <tbody>
              {perActivityMatrix.map(r => (
                <tr key={r.activity} style={{borderBottom:`1px solid ${T.borderL}`}}>
                  <td style={{padding:'6px 10px', color:T.navy}}>{r.activity}</td>
                  {activeTaxonomies.map(tid => (
                    <td key={tid} style={{padding:'6px 6px', textAlign:'center'}}>
                      <span style={{display:'inline-block', width:10, height:10, borderRadius:'50%', background:statusColor(r[tid])}} title={r[tid]} />
                    </td>
                  ))}
                  <td style={{padding:'6px 10px', textAlign:'center', fontFamily:T.mono, fontWeight:600, color: r.passport === 'PASS' ? T.green : r.passport === 'PARTIAL' ? T.amber : T.red}}>{r.passport}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ArbitrageLabTab({ arbitrageActivity, setArbitrageActivity }) {
  const activityStringency = useMemo(() => {
    return CROSSWALK_ACTIVITIES.map(act => {
      const byJur = TAXONOMIES.map(tx => {
        const cell = CROSSWALK_MATRIX.find(c => c.activity === act && c.taxonomy === tx.id);
        const strict = JURISDICTION_WEIGHTS[tx.id]?.stringency ?? 0.5;
        let score = strict * 100;
        if (cell) {
          if (cell.status === 'Fully Aligned') score *= 1.15;
          else if (cell.status === 'Aligned') score *= 1.00;
          else if (cell.status === 'Partial') score *= 0.70;
          else if (cell.status === 'Not Covered') score *= 0.30;
          else score *= 0;
        }
        return { jur: tx.id, score, status: cell?.status || 'N/A', confidence: cell?.confidence || 0 };
      }).filter(j => j.status !== 'N/A');
      const sorted = [...byJur].sort((a, b) => b.score - a.score);
      const strictest = sorted[0] || { jur:'-', score:0 };
      const loosest = sorted[sorted.length - 1] || { jur:'-', score:0 };
      const arbitrage = strictest.score - loosest.score;
      return { activity: act, byJur: sorted, strictest, loosest, arbitrage };
    });
  }, []);

  const top10 = useMemo(() => [...activityStringency].sort((a, b) => b.arbitrage - a.arbitrage).slice(0, 10), [activityStringency]);

  const active = useMemo(() => activityStringency.find(a => a.activity === arbitrageActivity) || activityStringency[0], [arbitrageActivity, activityStringency]);

  const totalArbitrage = activityStringency.reduce((s, a) => s + a.arbitrage, 0);
  const avgArbitrage = activityStringency.length > 0 ? totalArbitrage / activityStringency.length : 0;

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="AVG ARBITRAGE OPP" value={fmt(avgArbitrage, 1)} sub="Stringency spread avg" accent={T.amber} />
        <KpiCard label="MAX ARBITRAGE" value={fmt(top10[0]?.arbitrage || 0, 1)} sub={top10[0]?.activity || '-'} accent={T.red} />
        <KpiCard label="ACTIVITIES SCANNED" value={CROSSWALK_ACTIVITIES.length} sub="Across 12 regimes" accent={T.navy} />
        <KpiCard label="POLICY RECS" value="14" sub="Convergence + guardrails" accent={T.sage} />
      </div>

      <Panel title="Top-10 Activities by Arbitrage Opportunity (Stringency Spread)">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={top10} layout="vertical" margin={{left:120}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis type="number" tick={{fontSize:11, fill:T.textSec}} />
            <YAxis dataKey="activity" type="category" tick={{fontSize:10, fill:T.textSec}} width={140} />
            <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
            <Bar dataKey="arbitrage" name="Stringency Spread" radius={[0,3,3,0]}>
              {top10.map((d, i) => <Cell key={i} fill={d.arbitrage > 50 ? T.red : d.arbitrage > 30 ? T.amber : T.sage} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Activity Deep-Dive" right={
        <select value={arbitrageActivity} onChange={e => setArbitrageActivity(e.target.value)} style={{padding:'6px 10px', fontFamily:T.mono, fontSize:11, border:`1px solid ${T.border}`, background:T.surface, color:T.navy}}>
          {CROSSWALK_ACTIVITIES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      }>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
          <div>
            <div style={{fontSize:13, fontWeight:600, color:T.navy, marginBottom:8}}>Jurisdictional Stringency — {active.activity}</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={active.byJur}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="jur" tick={{fontSize:11, fill:T.textSec}} />
                <YAxis tick={{fontSize:11, fill:T.textSec}} />
                <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
                <Bar dataKey="score" radius={[2,2,0,0]}>
                  {active.byJur.map((d, i) => <Cell key={i} fill={i === 0 ? T.green : i === active.byJur.length - 1 ? T.red : T.gold} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{fontSize:13, fontWeight:600, color:T.navy, marginBottom:8}}>Policy-Alignment Recommendations</div>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              <div style={{padding:10, background:T.surfaceH, borderLeft:`3px solid ${T.green}`}}>
                <div style={{fontFamily:T.mono, fontSize:10, color:T.textMut}}>STRICTEST</div>
                <div style={{fontSize:13, fontWeight:600, color:T.green}}>{active.strictest.jur} — stringency {fmt(active.strictest.score, 1)}</div>
                <div style={{fontSize:11, color:T.textSec}}>Status: {active.strictest.status} · Confidence {fmt(active.strictest.confidence * 100, 0)}%</div>
              </div>
              <div style={{padding:10, background:T.surfaceH, borderLeft:`3px solid ${T.red}`}}>
                <div style={{fontFamily:T.mono, fontSize:10, color:T.textMut}}>LOOSEST</div>
                <div style={{fontSize:13, fontWeight:600, color:T.red}}>{active.loosest.jur} — stringency {fmt(active.loosest.score, 1)}</div>
                <div style={{fontSize:11, color:T.textSec}}>Status: {active.loosest.status}</div>
              </div>
              <div style={{padding:10, background:T.surfaceH, borderLeft:`3px solid ${T.gold}`}}>
                <div style={{fontFamily:T.mono, fontSize:10, color:T.textMut}}>ARBITRAGE OPP</div>
                <div style={{fontSize:22, fontWeight:600, color:T.gold}}>{fmt(active.arbitrage, 1)} pts</div>
                <div style={{fontSize:11, color:T.textSec}}>Potential regulatory shopping delta.</div>
              </div>
              <div style={{padding:10, background:T.surfaceH, borderLeft:`3px solid ${T.navy}`, fontSize:11, color:T.textSec}}>
                <b style={{color:T.navy}}>Recommendation:</b> require disclosure of domicile-by-regime, apply most-stringent DNSH floor under passport, and establish IOSCO-backed guardrail of consensus threshold ±15% for this activity.
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Jurisdictional Arbitrage Spread Heatmap">
        <div style={{overflowX:'auto'}}>
          <table style={{borderCollapse:'collapse', fontSize:10, fontFamily:T.mono, minWidth:800}}>
            <thead>
              <tr style={{background:T.surfaceH}}>
                <th style={{padding:'6px 10px', textAlign:'left', color:T.textSec, fontWeight:600}}>ACTIVITY</th>
                {TAXONOMIES.map(t => <th key={t.id} style={{padding:'6px 4px', color:T.textSec, fontWeight:600}}>{t.id}</th>)}
                <th style={{padding:'6px 10px', color:T.textSec, fontWeight:600}}>ARB</th>
              </tr>
            </thead>
            <tbody>
              {top10.map(r => (
                <tr key={r.activity} style={{borderBottom:`1px solid ${T.borderL}`}}>
                  <td style={{padding:'4px 10px', color:T.navy, fontFamily:T.font, fontSize:11}}>{r.activity}</td>
                  {TAXONOMIES.map(t => {
                    const j = r.byJur.find(x => x.jur === t.id);
                    const v = j ? j.score : 0;
                    const hue = Math.round(120 * Math.min(1, v / 120));
                    const bg = j ? 'hsl(' + hue + ', 55%, 55%)' : T.surfaceH;
                    return <td key={t.id} style={{padding:'4px 4px', textAlign:'center', background:bg, color:'#fff', minWidth:36}}>{j ? fmt(v, 0) : '—'}</td>;
                  })}
                  <td style={{padding:'4px 10px', textAlign:'right', color:T.red, fontWeight:600}}>{fmt(r.arbitrage, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function HarmonizationGapTab() {
  const activityGaps = useMemo(() => {
    return CROSSWALK_ACTIVITIES.map(act => {
      const cells = CROSSWALK_MATRIX.filter(c => c.activity === act && c.status !== 'N/A');
      const avgConf = cells.length > 0 ? cells.reduce((s, c) => s + c.confidence, 0) / cells.length : 0;
      const alignedCount = cells.filter(c => c.status === 'Aligned' || c.status === 'Fully Aligned').length;
      const alignedPct = cells.length > 0 ? (alignedCount / cells.length) * 100 : 0;
      const gap = (1 - avgConf) * 100;
      return { activity: act, avgConf: avgConf * 100, alignedPct, gap, cellCount: cells.length };
    });
  }, []);

  const portfolioGap = useMemo(() => {
    const totalGap = activityGaps.reduce((s, a) => s + a.gap, 0);
    return activityGaps.length > 0 ? totalGap / activityGaps.length : 0;
  }, [activityGaps]);

  const harmonizationIdx = 100 - portfolioGap;

  const topGaps = useMemo(() => [...activityGaps].sort((a, b) => b.gap - a.gap).slice(0, 15), [activityGaps]);
  const bestAligned = useMemo(() => [...activityGaps].sort((a, b) => a.gap - b.gap).slice(0, 8), [activityGaps]);

  const convergencePath = useMemo(() => {
    const years = [2026, 2027, 2028, 2029, 2030];
    return years.map((y, i) => {
      const decay = Math.pow(0.88, i);
      return { year: y, gap: portfolioGap * decay, harmonization: harmonizationIdx + (100 - harmonizationIdx) * (1 - decay) };
    });
  }, [portfolioGap, harmonizationIdx]);

  const bodyRecs = [
    { body:'ESMA', rec:'Publish delegated acts clarifying Article 8/9 PAI + DNSH cross-walk', deadline:'Q4 2026', priority:'High' },
    { body:'IOSCO', rec:'Endorse cross-border recognition mechanism for equivalent TSC', deadline:'H1 2027', priority:'High' },
    { body:'FSB', rec:'Finalize global baseline on transition finance definitions', deadline:'Q2 2027', priority:'Medium' },
    { body:'ISSB', rec:'Harmonize S2 climate disclosure with ESRS E1 + SEC 1504', deadline:'2028', priority:'High' },
    { body:'NGFS', rec:'Common scenario set for supervisory stress tests across regimes', deadline:'Q3 2027', priority:'Medium' },
    { body:'UNFCCC', rec:'Article 6.4 alignment guidance for national taxonomies', deadline:'COP32', priority:'Medium' },
  ];

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="PORTFOLIO GAP SCORE" value={fmt(portfolioGap, 1)} unit="%" sub="1 - avg pairwise confidence" accent={T.red} />
        <KpiCard label="HARMONIZATION INDEX" value={fmt(harmonizationIdx, 1)} unit="%" sub="100 - gap" accent={T.green} />
        <KpiCard label="WORST-ALIGNED ACTIVITY" value={topGaps[0]?.activity || '-'} sub={'Gap ' + fmt(topGaps[0]?.gap || 0, 1) + '%'} accent={T.amber} />
        <KpiCard label="BEST-ALIGNED ACTIVITY" value={bestAligned[0]?.activity || '-'} sub={'Gap ' + fmt(bestAligned[0]?.gap || 0, 1) + '%'} accent={T.sage} />
      </div>

      <Panel title="Top-15 Activity Gaps (Highest Harmonization Deficit)">
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={topGaps} layout="vertical" margin={{left:140}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis type="number" domain={[0, 100]} tick={{fontSize:11, fill:T.textSec}} unit="%" />
            <YAxis dataKey="activity" type="category" tick={{fontSize:10, fill:T.textSec}} width={150} />
            <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
            <Legend wrapperStyle={{fontSize:11}} />
            <Bar dataKey="gap" name="Harmonization Gap (%)" radius={[0,2,2,0]}>
              {topGaps.map((d, i) => <Cell key={i} fill={d.gap > 40 ? T.red : d.gap > 25 ? T.amber : T.sage} />)}
            </Bar>
            <Bar dataKey="alignedPct" name="Aligned %" fill={T.sage} radius={[0,2,2,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16}}>
        <Panel title="Activity Gap Heatmap (All 30)">
          <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:3}}>
            {activityGaps.map(a => (
              <div key={a.activity} title={a.activity + ' — Gap ' + fmt(a.gap, 1) + '% · Aligned ' + fmt(a.alignedPct, 0) + '%'} style={{
                background: a.gap > 40 ? T.red : a.gap > 25 ? T.amber : a.gap > 15 ? T.sage : T.green,
                color:'#fff', padding:'12px 8px', fontSize:9, fontFamily:T.mono, textAlign:'center', minHeight:60, display:'flex', flexDirection:'column', justifyContent:'center'
              }}>
                <div style={{fontSize:8, opacity:0.8}}>{a.activity.slice(0, 14)}</div>
                <div style={{fontSize:12, fontWeight:700, marginTop:3}}>{fmt(a.gap, 0)}%</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:10, display:'flex', justifyContent:'center', gap:16, fontSize:10, fontFamily:T.mono}}>
            <span><span style={{background:T.red, color:'#fff', padding:'2px 8px'}}>{'>'}40%</span></span>
            <span><span style={{background:T.amber, color:'#fff', padding:'2px 8px'}}>25-40</span></span>
            <span><span style={{background:T.sage, color:'#fff', padding:'2px 8px'}}>15-25</span></span>
            <span><span style={{background:T.green, color:'#fff', padding:'2px 8px'}}>{'<'}15%</span></span>
          </div>
        </Panel>

        <Panel title="2030 Convergence Roadmap (Projected)">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={convergencePath}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="year" tick={{fontSize:11, fill:T.textSec}} />
              <YAxis domain={[0, 100]} tick={{fontSize:11, fill:T.textSec}} unit="%" />
              <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
              <Legend wrapperStyle={{fontSize:11}} />
              <Area type="monotone" dataKey="harmonization" name="Harmonization Idx" stroke={T.green} fill={T.green} fillOpacity={0.25} strokeWidth={2} />
              <Area type="monotone" dataKey="gap" name="Residual Gap" stroke={T.red} fill={T.red} fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{marginTop:8, fontSize:11, color:T.textSec, textAlign:'center'}}>Projection: 12% annual gap-closure via IOSCO + FSB convergence work.</div>
        </Panel>
      </div>

      <Panel title="ESMA / IOSCO / FSB Policy Recommendations">
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
          <thead>
            <tr style={{background:T.surfaceH, borderBottom:`1px solid ${T.border}`}}>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600}}>BODY</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600}}>RECOMMENDATION</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600}}>DEADLINE</th>
              <th style={{padding:'8px 10px', textAlign:'center', color:T.textSec, fontWeight:600}}>PRIORITY</th>
            </tr>
          </thead>
          <tbody>
            {bodyRecs.map((r, i) => (
              <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`}}>
                <td style={{padding:'8px 10px', fontFamily:T.mono, fontWeight:600, color:T.navy}}>{r.body}</td>
                <td style={{padding:'8px 10px', color:T.text}}>{r.rec}</td>
                <td style={{padding:'8px 10px', fontFamily:T.mono, color:T.textSec}}>{r.deadline}</td>
                <td style={{padding:'8px 10px', textAlign:'center'}}>
                  <Pill bg={r.priority === 'High' ? T.red : T.amber} color="#fff">{r.priority}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function MultiJurStressTab({ stressScenario, setStressScenario }) {
  const scenario = useMemo(() => STRESS_SCENARIOS.find(s => s.id === stressScenario) || STRESS_SCENARIOS[0], [stressScenario]);

  const issuerShifts = useMemo(() => {
    return PORTFOLIO_ISSUERS.map(issuer => {
      const jurField = (scenario.jur.toLowerCase() + 'Aligned');
      const baseAlign = issuer[jurField] ?? 0;
      const shift = baseAlign * scenario.delta * -1;
      const newAlign = clamp(baseAlign + shift, 0, 100);
      const totalAlign = (issuer.euAligned + issuer.ukAligned + issuer.sgAligned + issuer.aseanAligned + issuer.cnAligned + issuer.jpAligned) / 6;
      const newTotal = totalAlign + shift / 6;
      const costToComply = Math.abs(shift) * issuer.aum * 0.0008;
      return {
        id: issuer.id,
        name: issuer.name,
        sector: issuer.sector,
        region: issuer.region,
        aum: issuer.aum,
        baseAlign,
        newAlign,
        delta: newAlign - baseAlign,
        oldTotal: totalAlign,
        newTotal,
        costToComply,
      };
    });
  }, [scenario]);

  const portfolioBefore = issuerShifts.length > 0 ? issuerShifts.reduce((s, r) => s + r.oldTotal * r.aum, 0) / Math.max(1, issuerShifts.reduce((s, r) => s + r.aum, 0)) : 0;
  const portfolioAfter = issuerShifts.length > 0 ? issuerShifts.reduce((s, r) => s + r.newTotal * r.aum, 0) / Math.max(1, issuerShifts.reduce((s, r) => s + r.aum, 0)) : 0;
  const erosion = portfolioBefore - portfolioAfter;
  const totalCost = issuerShifts.reduce((s, r) => s + r.costToComply, 0);

  const topImpacted = useMemo(() => [...issuerShifts].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 12), [issuerShifts]);

  const projection = useMemo(() => {
    const years = [2026, 2027, 2028, 2029, 2030];
    return years.map((y, i) => {
      const phase = clamp((y - 2026) / Math.max(1, scenario.year - 2026), 0, 1);
      const applied = scenario.delta * phase;
      const align = portfolioBefore * (1 + applied * -0.4);
      return { year: y, alignment: clamp(align, 0, 100), cost: totalCost * phase };
    });
  }, [scenario, portfolioBefore, totalCost]);

  const sectorImpact = useMemo(() => {
    const sectors = [...new Set(PORTFOLIO_ISSUERS.map(p => p.sector))];
    return sectors.map(sec => {
      const rows = issuerShifts.filter(r => r.sector === sec);
      const avgDelta = rows.length > 0 ? rows.reduce((s, r) => s + r.delta, 0) / rows.length : 0;
      const sumCost = rows.reduce((s, r) => s + r.costToComply, 0);
      return { sector: sec, delta: avgDelta, cost: sumCost, count: rows.length };
    });
  }, [issuerShifts]);

  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
        <KpiCard label="SCENARIO" value={scenario.jur} sub={scenario.name} accent={T.red} />
        <KpiCard label="PROBABILITY" value={fmt(scenario.probability * 100, 0)} unit="%" sub={'By ' + scenario.year} accent={T.amber} />
        <KpiCard label="ALIGNMENT EROSION" value={fmt(erosion, 1)} unit="pts" sub="Portfolio-wt avg" accent={erosion > 0 ? T.red : T.green} />
        <KpiCard label="TOTAL COMPLIANCE COST" value={'$' + fmt(totalCost, 1)} unit="M" sub="Across 30 issuers" accent={T.navy} />
      </div>

      <Panel title="Select Stress Scenario">
        <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
          {STRESS_SCENARIOS.map(s => (
            <button key={s.id} onClick={() => setStressScenario(s.id)} style={{
              background: stressScenario === s.id ? T.navy : 'transparent',
              color: stressScenario === s.id ? '#fff' : T.textSec,
              border:`1px solid ${stressScenario === s.id ? T.navy : T.border}`,
              padding:'10px 14px', fontFamily:T.mono, fontSize:11, cursor:'pointer', textAlign:'left', maxWidth:280,
            }}>
              <div style={{fontWeight:600}}>{s.jur} · {s.name}</div>
              <div style={{fontSize:10, marginTop:2, opacity:0.8}}>Prob {fmt(s.probability * 100, 0)}% · by {s.year}</div>
            </button>
          ))}
        </div>
        <div style={{marginTop:14, padding:12, background:T.surfaceH, borderLeft:`3px solid ${T.gold}`, fontSize:12, color:T.textSec}}>
          <b style={{color:T.navy}}>Scenario narrative:</b> {scenario.desc}
        </div>
      </Panel>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16}}>
        <Panel title="Portfolio-Level Alignment Trajectory (2026-2030)">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={projection}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="year" tick={{fontSize:11, fill:T.textSec}} />
              <YAxis yAxisId="l" tick={{fontSize:11, fill:T.textSec}} unit="%" />
              <YAxis yAxisId="r" orientation="right" tick={{fontSize:11, fill:T.textSec}} unit="M" />
              <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
              <Legend wrapperStyle={{fontSize:11}} />
              <Area yAxisId="l" type="monotone" dataKey="alignment" name="Portfolio Alignment %" stroke={T.sage} fill={T.sage} fillOpacity={0.2} strokeWidth={2} />
              <Bar yAxisId="r" dataKey="cost" name="Cumulative Cost ($M)" fill={T.red} radius={[3,3,0,0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Sector-Level Impact (Avg Delta + Cost)">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={sectorImpact}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="sector" tick={{fontSize:10, fill:T.textSec}} />
              <YAxis yAxisId="l" tick={{fontSize:11, fill:T.textSec}} />
              <YAxis yAxisId="r" orientation="right" tick={{fontSize:11, fill:T.textSec}} />
              <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
              <Legend wrapperStyle={{fontSize:11}} />
              <Bar yAxisId="l" dataKey="delta" name="Avg Alignment Δ (pts)" radius={[2,2,0,0]}>
                {sectorImpact.map((d, i) => <Cell key={i} fill={d.delta < 0 ? T.red : T.green} />)}
              </Bar>
              <Line yAxisId="r" type="monotone" dataKey="cost" name="Cost ($M)" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold, r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title={'Top-12 Most-Impacted Issuers — ' + scenario.name}>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
          <thead>
            <tr style={{background:T.surfaceH, borderBottom:`1px solid ${T.border}`}}>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600}}>ISSUER</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600}}>SECTOR</th>
              <th style={{padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600}}>REGION</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec, fontWeight:600}}>AUM ($M)</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec, fontWeight:600}}>ALIGN BEFORE</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec, fontWeight:600}}>ALIGN AFTER</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec, fontWeight:600}}>Δ</th>
              <th style={{padding:'8px 10px', textAlign:'right', color:T.textSec, fontWeight:600}}>COST ($M)</th>
            </tr>
          </thead>
          <tbody>
            {topImpacted.map(r => (
              <tr key={r.id} style={{borderBottom:`1px solid ${T.borderL}`}}>
                <td style={{padding:'6px 10px', color:T.navy, fontWeight:600}}>{r.name}</td>
                <td style={{padding:'6px 10px'}}>{r.sector}</td>
                <td style={{padding:'6px 10px', fontFamily:T.mono}}>{r.region}</td>
                <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono}}>{fmt(r.aum, 0)}</td>
                <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono, color:T.textSec}}>{fmt(r.baseAlign, 1)}%</td>
                <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono, color:T.navy}}>{fmt(r.newAlign, 1)}%</td>
                <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono, color: r.delta < 0 ? T.red : T.green}}>{fmt(r.delta, 1)}</td>
                <td style={{padding:'6px 10px', textAlign:'right', fontFamily:T.mono, color:T.amber}}>{fmt(r.costToComply, 2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{background:T.surfaceH, borderTop:`2px solid ${T.gold}`}}>
              <td colSpan={6} style={{padding:'10px', fontFamily:T.mono, fontWeight:700, color:T.navy}}>PORTFOLIO TOTAL (30 issuers)</td>
              <td style={{padding:'10px', textAlign:'right', fontFamily:T.mono, fontWeight:700, color: erosion > 0 ? T.red : T.green}}>{fmt(-erosion, 1)} pts</td>
              <td style={{padding:'10px', textAlign:'right', fontFamily:T.mono, fontWeight:700, color:T.red}}>${fmt(totalCost, 1)}M</td>
            </tr>
          </tfoot>
        </table>
      </Panel>

      <Panel title="Cross-Scenario Comparison (All 6 Stress Cases)">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={STRESS_SCENARIOS.map(s => {
            const jurField = (s.jur.toLowerCase() + 'Aligned');
            const totalShift = PORTFOLIO_ISSUERS.reduce((a, i) => a + ((i[jurField] ?? 0) * s.delta * -1), 0);
            const avgShift = PORTFOLIO_ISSUERS.length > 0 ? totalShift / PORTFOLIO_ISSUERS.length : 0;
            return { id: s.id.slice(0, 10), name: s.jur + '·' + s.id.slice(0, 8), shift: avgShift, prob: s.probability * 100 };
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="name" tick={{fontSize:10, fill:T.textSec}} />
            <YAxis yAxisId="l" tick={{fontSize:11, fill:T.textSec}} />
            <YAxis yAxisId="r" orientation="right" tick={{fontSize:11, fill:T.textSec}} unit="%" />
            <Tooltip contentStyle={{background:T.surface, border:`1px solid ${T.border}`, fontSize:12}} />
            <Legend wrapperStyle={{fontSize:11}} />
            <Bar yAxisId="l" dataKey="shift" name="Avg Alignment Δ" radius={[2,2,0,0]}>
              {STRESS_SCENARIOS.map((s, i) => <Cell key={i} fill={s.delta < 0 ? T.sage : T.red} />)}
            </Bar>
            <Line yAxisId="r" type="monotone" dataKey="prob" name="Probability %" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold, r: 4 }} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
