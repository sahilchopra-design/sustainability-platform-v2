// climateRiskDataService.js
// Shared data service for climate risk & stress testing modules.
// Plain JS module — no React, no JSX, no default export.

// ── 1. NGFS PHASE IV SCENARIOS (Nov-2023, 6 scenarios) ──────────────────────
export const NGFS_PHASE4 = [
  {
    id: 'nz2050', name: 'Net Zero 2050', temp: 1.5, category: 'Orderly',
    carbonPrice2030: 190, carbonPrice2050: 700,
    gdpImpact2030: -0.5, gdpImpact2050: -1.2,
    physicalRiskScore: 2.0, transitionRiskScore: 8.5,
    renewableShare2050: 88, coalShare2050: 1, stranded2050: 1.4,
    unemploymentPeak: 0.6, propertyPriceDrop: -8, sovereignSpreadBp: 15,
    color: '#10b981', description: 'Immediate coordinated global policy action limiting warming to 1.5°C'
  },
  {
    id: 'b2c', name: 'Below 2°C', temp: 1.7, category: 'Orderly',
    carbonPrice2030: 95, carbonPrice2050: 310,
    gdpImpact2030: -0.3, gdpImpact2050: -0.8,
    physicalRiskScore: 3.5, transitionRiskScore: 6.5,
    renewableShare2050: 75, coalShare2050: 4, stranded2050: 0.9,
    unemploymentPeak: 0.4, propertyPriceDrop: -5, sovereignSpreadBp: 10,
    color: '#14b8a6', description: 'Strong but slightly less aggressive policy keeps warming below 2°C'
  },
  {
    id: 'dnz', name: 'Divergent Net Zero', temp: 1.6, category: 'Disorderly',
    carbonPrice2030: 230, carbonPrice2050: 800,
    gdpImpact2030: -1.1, gdpImpact2050: -1.5,
    physicalRiskScore: 2.5, transitionRiskScore: 9.2,
    renewableShare2050: 90, coalShare2050: 1, stranded2050: 1.7,
    unemploymentPeak: 1.2, propertyPriceDrop: -14, sovereignSpreadBp: 35,
    color: '#f59e0b', description: 'Divergent policies across sectors lead to higher transition costs'
  },
  {
    id: 'dt', name: 'Delayed Transition', temp: 1.8, category: 'Disorderly',
    carbonPrice2030: 30, carbonPrice2050: 750,
    gdpImpact2030: -0.1, gdpImpact2050: -2.8,
    physicalRiskScore: 4.5, transitionRiskScore: 9.8,
    renewableShare2050: 70, coalShare2050: 8, stranded2050: 2.1,
    unemploymentPeak: 2.1, propertyPriceDrop: -22, sovereignSpreadBp: 65,
    color: '#ef4444', description: 'Policy inaction until 2030 then abrupt transition causes severe disruption'
  },
  {
    id: 'ndc', name: 'NDC Scenario', temp: 2.5, category: 'Hot House',
    carbonPrice2030: 20, carbonPrice2050: 60,
    gdpImpact2030: 0.0, gdpImpact2050: -3.2,
    physicalRiskScore: 7.5, transitionRiskScore: 3.5,
    renewableShare2050: 50, coalShare2050: 20, stranded2050: 0.4,
    unemploymentPeak: 0.2, propertyPriceDrop: -18, sovereignSpreadBp: 90,
    color: '#f97316', description: 'Current NDC pledges only — warming reaches 2.5°C with high physical risk'
  },
  {
    id: 'cp', name: 'Current Policies', temp: 3.0, category: 'Hot House',
    carbonPrice2030: 10, carbonPrice2050: 25,
    gdpImpact2030: 0.0, gdpImpact2050: -4.8,
    physicalRiskScore: 9.5, transitionRiskScore: 1.5,
    renewableShare2050: 40, coalShare2050: 35, stranded2050: 0.2,
    unemploymentPeak: 0.1, propertyPriceDrop: -35, sovereignSpreadBp: 160,
    color: '#dc2626', description: 'No new climate policies — 3°C+ warming with catastrophic physical damage'
  }
];

// ── 2. SECTOR PD UPLIFT TABLE (20 NACE sectors, per NGFS Phase IV scenario) ──
// Values are basis-point PD uplift vs baseline, per scenario
export const SECTOR_PD_UPLIFT = [
  { sector: 'Mining & Coal Extraction',     nace:'B',   nz2050:850, b2c:620, dnz:920, dt:1100, ndc:380, cp:200 },
  { sector: 'Oil & Gas Extraction',         nace:'B',   nz2050:720, b2c:530, dnz:780, dt:980,  ndc:320, cp:160 },
  { sector: 'Electricity Generation',       nace:'D',   nz2050:280, b2c:180, dnz:320, dt:650,  ndc:210, cp:120 },
  { sector: 'Steel & Primary Metals',       nace:'C24', nz2050:420, b2c:310, dnz:470, dt:720,  ndc:280, cp:150 },
  { sector: 'Cement & Construction Mats',   nace:'C23', nz2050:380, b2c:270, dnz:420, dt:680,  ndc:260, cp:140 },
  { sector: 'Chemicals & Petrochemicals',   nace:'C20', nz2050:310, b2c:230, dnz:350, dt:580,  ndc:220, cp:110 },
  { sector: 'Automotive Manufacturing',     nace:'C29', nz2050:190, b2c:130, dnz:240, dt:420,  ndc:150, cp:80  },
  { sector: 'Air Transport',                nace:'H51', nz2050:440, b2c:320, dnz:500, dt:780,  ndc:300, cp:160 },
  { sector: 'Shipping & Maritime',          nace:'H50', nz2050:280, b2c:200, dnz:310, dt:540,  ndc:190, cp:100 },
  { sector: 'Agriculture & Food',           nace:'A',   nz2050:180, b2c:140, dnz:220, dt:310,  ndc:320, cp:480 },
  { sector: 'Real Estate (Commercial)',     nace:'L68', nz2050:240, b2c:180, dnz:280, dt:620,  ndc:410, cp:580 },
  { sector: 'Real Estate (Residential)',    nace:'L68', nz2050:160, b2c:120, dnz:200, dt:480,  ndc:340, cp:490 },
  { sector: 'Banking & Insurance',          nace:'K',   nz2050:110, b2c:80,  dnz:130, dt:290,  ndc:180, cp:240 },
  { sector: 'Retail & Consumer Goods',      nace:'G',   nz2050:90,  b2c:70,  dnz:110, dt:220,  ndc:150, cp:200 },
  { sector: 'Healthcare',                   nace:'Q',   nz2050:40,  b2c:30,  dnz:50,  dt:90,   ndc:70,  cp:95  },
  { sector: 'ICT & Technology',             nace:'J',   nz2050:30,  b2c:25,  dnz:40,  dt:80,   ndc:60,  cp:85  },
  { sector: 'Renewables & Clean Energy',    nace:'D',   nz2050:-80, b2c:-60, dnz:-90, dt:-40,  ndc: 20, cp: 60 },
  { sector: 'Water & Waste Management',     nace:'E',   nz2050:50,  b2c:40,  dnz:60,  dt:120,  ndc:190, cp:310 },
  { sector: 'Construction',                 nace:'F',   nz2050:130, b2c:100, dnz:160, dt:350,  ndc:270, cp:380 },
  { sector: 'Transport Infrastructure',     nace:'H',   nz2050:100, b2c:80,  dnz:120, dt:280,  ndc:220, cp:300 },
];

// ── 3. SECTOR LGD UPLIFT TABLE (collateral haircut %, per scenario) ──────────
export const SECTOR_LGD_UPLIFT = [
  { sector: 'Mining & Coal Extraction',   nz2050:12.0, b2c:9.0,  dnz:14.0, dt:18.0, ndc:6.0,  cp:3.5  },
  { sector: 'Oil & Gas Extraction',       nz2050:10.5, b2c:8.0,  dnz:12.0, dt:16.0, ndc:5.5,  cp:3.0  },
  { sector: 'Electricity Generation',     nz2050:4.5,  b2c:3.2,  dnz:5.5,  dt:9.0,  ndc:3.8,  cp:2.2  },
  { sector: 'Steel & Primary Metals',     nz2050:6.5,  b2c:4.8,  dnz:7.5,  dt:11.0, ndc:4.5,  cp:2.5  },
  { sector: 'Cement & Construction Mats', nz2050:5.8,  b2c:4.2,  dnz:6.8,  dt:10.5, ndc:4.2,  cp:2.3  },
  { sector: 'Real Estate (Commercial)',   nz2050:8.0,  b2c:6.0,  dnz:9.5,  dt:16.5, ndc:12.0, cp:18.0 },
  { sector: 'Real Estate (Residential)', nz2050:5.5,  b2c:4.0,  dnz:6.5,  dt:13.0, ndc:10.5, cp:15.5 },
  { sector: 'Air Transport',              nz2050:7.0,  b2c:5.0,  dnz:8.0,  dt:12.0, ndc:5.0,  cp:2.8  },
  { sector: 'Renewables & Clean Energy',  nz2050:-1.5, b2c:-1.2, dnz:-1.8, dt:-0.8, ndc:0.5,  cp:1.5  },
  { sector: 'Agriculture & Food',         nz2050:3.5,  b2c:2.8,  dnz:4.2,  dt:6.0,  ndc:8.5,  cp:12.0 },
];

// ── 4. PHYSICAL HAZARD MULTIPLIERS (SSP x asset class) ───────────────────────
// Multiplier applied to base expected annual loss (EAL) under each SSP pathway
export const PHYSICAL_MULTIPLIERS = {
  flood:    { 'SSP1-2.6':1.0, 'SSP2-4.5':1.35, 'SSP3-7.0':1.85, 'SSP5-8.5':2.40 },
  cyclone:  { 'SSP1-2.6':1.0, 'SSP2-4.5':1.20, 'SSP3-7.0':1.55, 'SSP5-8.5':1.90 },
  wildfire: { 'SSP1-2.6':1.0, 'SSP2-4.5':1.60, 'SSP3-7.0':2.40, 'SSP5-8.5':3.50 },
  heatwave: { 'SSP1-2.6':1.0, 'SSP2-4.5':1.70, 'SSP3-7.0':2.80, 'SSP5-8.5':4.20 },
  drought:  { 'SSP1-2.6':1.0, 'SSP2-4.5':1.45, 'SSP3-7.0':2.10, 'SSP5-8.5':3.00 },
  sealevel: { 'SSP1-2.6':1.0, 'SSP2-4.5':1.25, 'SSP3-7.0':1.80, 'SSP5-8.5':2.60 },
};

// ── 5. COUNTRY PHYSICAL RISK DATABASE (50 countries) ─────────────────────────
// Base EAL % of GDP per hazard, adaptation capacity, ND-GAIN score
export const COUNTRY_PHYSICAL_RISK = [
  { iso:'US',  name:'United States',   region:'N.America', flood:0.18, cyclone:0.22, wildfire:0.14, heatwave:0.08, drought:0.11, sealevel:0.09, adaptCapacity:82, ndGain:71.2, gdpExposed:2800 },
  { iso:'CN',  name:'China',           region:'Asia',      flood:0.31, cyclone:0.18, wildfire:0.08, heatwave:0.12, drought:0.15, sealevel:0.14, adaptCapacity:64, ndGain:52.8, gdpExposed:4200 },
  { iso:'IN',  name:'India',           region:'Asia',      flood:0.42, cyclone:0.28, wildfire:0.06, heatwave:0.22, drought:0.24, sealevel:0.18, adaptCapacity:48, ndGain:41.5, gdpExposed:1400 },
  { iso:'DE',  name:'Germany',         region:'Europe',    flood:0.12, cyclone:0.04, wildfire:0.03, heatwave:0.06, drought:0.08, sealevel:0.05, adaptCapacity:88, ndGain:75.4, gdpExposed:480  },
  { iso:'JP',  name:'Japan',           region:'Asia',      flood:0.24, cyclone:0.32, wildfire:0.04, heatwave:0.10, drought:0.06, sealevel:0.16, adaptCapacity:80, ndGain:69.8, gdpExposed:620  },
  { iso:'GB',  name:'United Kingdom',  region:'Europe',    flood:0.14, cyclone:0.02, wildfire:0.02, heatwave:0.05, drought:0.07, sealevel:0.08, adaptCapacity:86, ndGain:74.1, gdpExposed:360  },
  { iso:'FR',  name:'France',          region:'Europe',    flood:0.16, cyclone:0.03, wildfire:0.06, heatwave:0.09, drought:0.10, sealevel:0.06, adaptCapacity:85, ndGain:73.2, gdpExposed:340  },
  { iso:'BR',  name:'Brazil',          region:'L.America', flood:0.28, cyclone:0.08, wildfire:0.18, heatwave:0.14, drought:0.20, sealevel:0.10, adaptCapacity:52, ndGain:44.7, gdpExposed:520  },
  { iso:'AU',  name:'Australia',       region:'Oceania',   flood:0.20, cyclone:0.26, wildfire:0.22, heatwave:0.18, drought:0.24, sealevel:0.08, adaptCapacity:84, ndGain:72.6, gdpExposed:340  },
  { iso:'CA',  name:'Canada',          region:'N.America', flood:0.15, cyclone:0.06, wildfire:0.16, heatwave:0.10, drought:0.12, sealevel:0.05, adaptCapacity:87, ndGain:76.3, gdpExposed:280  },
  { iso:'ZA',  name:'South Africa',    region:'Africa',    flood:0.22, cyclone:0.12, wildfire:0.14, heatwave:0.20, drought:0.28, sealevel:0.06, adaptCapacity:44, ndGain:38.4, gdpExposed:95   },
  { iso:'NG',  name:'Nigeria',         region:'Africa',    flood:0.35, cyclone:0.08, wildfire:0.10, heatwave:0.24, drought:0.30, sealevel:0.22, adaptCapacity:32, ndGain:28.9, gdpExposed:80   },
  { iso:'EG',  name:'Egypt',           region:'M.East',    flood:0.08, cyclone:0.05, wildfire:0.05, heatwave:0.28, drought:0.35, sealevel:0.24, adaptCapacity:38, ndGain:33.6, gdpExposed:72   },
  { iso:'SA',  name:'Saudi Arabia',    region:'M.East',    flood:0.05, cyclone:0.08, wildfire:0.03, heatwave:0.32, drought:0.38, sealevel:0.09, adaptCapacity:60, ndGain:52.1, gdpExposed:280  },
  { iso:'ID',  name:'Indonesia',       region:'Asia',      flood:0.38, cyclone:0.14, wildfire:0.20, heatwave:0.12, drought:0.16, sealevel:0.28, adaptCapacity:42, ndGain:36.8, gdpExposed:180  },
  { iso:'MX',  name:'Mexico',          region:'L.America', flood:0.24, cyclone:0.28, wildfire:0.12, heatwave:0.16, drought:0.18, sealevel:0.10, adaptCapacity:56, ndGain:48.2, gdpExposed:180  },
  { iso:'KR',  name:'South Korea',     region:'Asia',      flood:0.18, cyclone:0.22, wildfire:0.04, heatwave:0.10, drought:0.08, sealevel:0.12, adaptCapacity:78, ndGain:67.4, gdpExposed:220  },
  { iso:'TR',  name:'Turkey',          region:'Europe',    flood:0.20, cyclone:0.06, wildfire:0.10, heatwave:0.18, drought:0.22, sealevel:0.08, adaptCapacity:58, ndGain:49.8, gdpExposed:140  },
  { iso:'IT',  name:'Italy',           region:'Europe',    flood:0.18, cyclone:0.04, wildfire:0.08, heatwave:0.14, drought:0.16, sealevel:0.10, adaptCapacity:80, ndGain:68.9, gdpExposed:240  },
  { iso:'ES',  name:'Spain',           region:'Europe',    flood:0.14, cyclone:0.04, wildfire:0.10, heatwave:0.16, drought:0.18, sealevel:0.08, adaptCapacity:81, ndGain:69.5, gdpExposed:175  },
  { iso:'AR',  name:'Argentina',       region:'L.America', flood:0.26, cyclone:0.10, wildfire:0.12, heatwave:0.14, drought:0.22, sealevel:0.08, adaptCapacity:50, ndGain:43.2, gdpExposed:85   },
  { iso:'NL',  name:'Netherlands',     region:'Europe',    flood:0.28, cyclone:0.02, wildfire:0.01, heatwave:0.06, drought:0.05, sealevel:0.22, adaptCapacity:90, ndGain:77.8, gdpExposed:145  },
  { iso:'BD',  name:'Bangladesh',      region:'Asia',      flood:0.52, cyclone:0.38, wildfire:0.02, heatwave:0.26, drought:0.20, sealevel:0.46, adaptCapacity:26, ndGain:22.4, gdpExposed:55   },
  { iso:'PK',  name:'Pakistan',        region:'Asia',      flood:0.44, cyclone:0.18, wildfire:0.06, heatwave:0.28, drought:0.26, sealevel:0.14, adaptCapacity:28, ndGain:24.8, gdpExposed:62   },
  { iso:'VN',  name:'Vietnam',         region:'Asia',      flood:0.40, cyclone:0.32, wildfire:0.06, heatwave:0.18, drought:0.14, sealevel:0.32, adaptCapacity:38, ndGain:32.6, gdpExposed:75   },
  { iso:'TH',  name:'Thailand',        region:'Asia',      flood:0.34, cyclone:0.22, wildfire:0.08, heatwave:0.16, drought:0.14, sealevel:0.20, adaptCapacity:46, ndGain:40.2, gdpExposed:90   },
  { iso:'MY',  name:'Malaysia',        region:'Asia',      flood:0.32, cyclone:0.12, wildfire:0.12, heatwave:0.14, drought:0.10, sealevel:0.16, adaptCapacity:54, ndGain:47.8, gdpExposed:78   },
  { iso:'PH',  name:'Philippines',     region:'Asia',      flood:0.46, cyclone:0.48, wildfire:0.06, heatwave:0.18, drought:0.16, sealevel:0.32, adaptCapacity:34, ndGain:29.6, gdpExposed:52   },
  { iso:'ET',  name:'Ethiopia',        region:'Africa',    flood:0.28, cyclone:0.04, wildfire:0.10, heatwave:0.26, drought:0.40, sealevel:0.04, adaptCapacity:20, ndGain:17.8, gdpExposed:20   },
  { iso:'KE',  name:'Kenya',           region:'Africa',    flood:0.24, cyclone:0.06, wildfire:0.12, heatwave:0.22, drought:0.36, sealevel:0.06, adaptCapacity:28, ndGain:24.2, gdpExposed:25   },
  { iso:'GH',  name:'Ghana',           region:'Africa',    flood:0.26, cyclone:0.04, wildfire:0.08, heatwave:0.20, drought:0.28, sealevel:0.08, adaptCapacity:30, ndGain:26.4, gdpExposed:22   },
  { iso:'MA',  name:'Morocco',         region:'Africa',    flood:0.12, cyclone:0.06, wildfire:0.08, heatwave:0.24, drought:0.30, sealevel:0.06, adaptCapacity:42, ndGain:37.2, gdpExposed:40   },
  { iso:'PE',  name:'Peru',            region:'L.America', flood:0.22, cyclone:0.06, wildfire:0.10, heatwave:0.12, drought:0.20, sealevel:0.06, adaptCapacity:44, ndGain:39.6, gdpExposed:35   },
  { iso:'CO',  name:'Colombia',        region:'L.America', flood:0.30, cyclone:0.10, wildfire:0.14, heatwave:0.14, drought:0.18, sealevel:0.08, adaptCapacity:46, ndGain:41.8, gdpExposed:45   },
  { iso:'CL',  name:'Chile',           region:'L.America', flood:0.16, cyclone:0.08, wildfire:0.14, heatwave:0.10, drought:0.20, sealevel:0.06, adaptCapacity:62, ndGain:54.8, gdpExposed:52   },
  { iso:'NO',  name:'Norway',          region:'Europe',    flood:0.12, cyclone:0.02, wildfire:0.06, heatwave:0.04, drought:0.06, sealevel:0.10, adaptCapacity:92, ndGain:78.4, gdpExposed:55   },
  { iso:'SE',  name:'Sweden',          region:'Europe',    flood:0.10, cyclone:0.02, wildfire:0.08, heatwave:0.04, drought:0.06, sealevel:0.06, adaptCapacity:91, ndGain:77.2, gdpExposed:68   },
  { iso:'CH',  name:'Switzerland',     region:'Europe',    flood:0.14, cyclone:0.01, wildfire:0.04, heatwave:0.08, drought:0.08, sealevel:0.04, adaptCapacity:93, ndGain:80.1, gdpExposed:95   },
  { iso:'SG',  name:'Singapore',       region:'Asia',      flood:0.10, cyclone:0.06, wildfire:0.01, heatwave:0.14, drought:0.04, sealevel:0.18, adaptCapacity:86, ndGain:73.8, gdpExposed:75   },
  { iso:'NZ',  name:'New Zealand',     region:'Oceania',   flood:0.18, cyclone:0.12, wildfire:0.10, heatwave:0.08, drought:0.12, sealevel:0.08, adaptCapacity:85, ndGain:73.5, gdpExposed:42   },
  { iso:'PT',  name:'Portugal',        region:'Europe',    flood:0.14, cyclone:0.04, wildfire:0.14, heatwave:0.16, drought:0.20, sealevel:0.06, adaptCapacity:78, ndGain:66.8, gdpExposed:38   },
  { iso:'GR',  name:'Greece',          region:'Europe',    flood:0.16, cyclone:0.04, wildfire:0.12, heatwave:0.18, drought:0.20, sealevel:0.08, adaptCapacity:72, ndGain:61.4, gdpExposed:42   },
  { iso:'UA',  name:'Ukraine',         region:'Europe',    flood:0.18, cyclone:0.02, wildfire:0.08, heatwave:0.14, drought:0.18, sealevel:0.04, adaptCapacity:48, ndGain:42.8, gdpExposed:55   },
  { iso:'PL',  name:'Poland',          region:'Europe',    flood:0.14, cyclone:0.02, wildfire:0.06, heatwave:0.10, drought:0.12, sealevel:0.04, adaptCapacity:74, ndGain:63.2, gdpExposed:92   },
  { iso:'RO',  name:'Romania',         region:'Europe',    flood:0.20, cyclone:0.02, wildfire:0.06, heatwave:0.14, drought:0.16, sealevel:0.06, adaptCapacity:62, ndGain:53.6, gdpExposed:48   },
  { iso:'HU',  name:'Hungary',         region:'Europe',    flood:0.18, cyclone:0.02, wildfire:0.06, heatwave:0.12, drought:0.14, sealevel:0.02, adaptCapacity:66, ndGain:57.2, gdpExposed:36   },
  { iso:'IE',  name:'Ireland',         region:'Europe',    flood:0.16, cyclone:0.04, wildfire:0.02, heatwave:0.04, drought:0.06, sealevel:0.10, adaptCapacity:88, ndGain:75.8, gdpExposed:58   },
  { iso:'DK',  name:'Denmark',         region:'Europe',    flood:0.12, cyclone:0.02, wildfire:0.02, heatwave:0.04, drought:0.06, sealevel:0.12, adaptCapacity:92, ndGain:78.9, gdpExposed:46   },
  { iso:'FI',  name:'Finland',         region:'Europe',    flood:0.10, cyclone:0.01, wildfire:0.08, heatwave:0.04, drought:0.06, sealevel:0.06, adaptCapacity:91, ndGain:77.6, gdpExposed:40   },
  { iso:'BE',  name:'Belgium',         region:'Europe',    flood:0.18, cyclone:0.02, wildfire:0.02, heatwave:0.06, drought:0.07, sealevel:0.10, adaptCapacity:87, ndGain:74.8, gdpExposed:72   },
];

// ── 6. SDA SECTOR DECARBONIZATION PATHWAYS (intensity targets, NZE) ──────────
// Units: tCO2/tonne product or kgCO2/m2 or gCO2/tkm
// Array format — supports .find(), .map(), .filter() on sector property
export const SDA_PATHWAYS = [
  { sector:'steel',     label:'Steel',            unit:'tCO2/t steel',   baseline2020:1.85, target2030:1.40, target2040:0.80, target2050:0.10, currentGlobal:1.72 },
  { sector:'cement',    label:'Cement',           unit:'kgCO2/t cement', baseline2020:620,  target2030:520,  target2040:380,  target2050:100,  currentGlobal:600  },
  { sector:'aluminium', label:'Aluminium',        unit:'tCO2/t Al',      baseline2020:16.5, target2030:13.2, target2040:8.5,  target2050:1.5,  currentGlobal:15.8 },
  { sector:'aviation',  label:'Aviation',         unit:'gCO2/pkm',       baseline2020:88,   target2030:72,   target2040:50,   target2050:15,   currentGlobal:85   },
  { sector:'shipping',  label:'Shipping',         unit:'gCO2/tkm',       baseline2020:8.6,  target2030:6.9,  target2040:4.2,  target2050:0.5,  currentGlobal:8.2  },
  { sector:'buildings', label:'Buildings',        unit:'kgCO2/m²/yr',    baseline2020:42,   target2030:32,   target2040:18,   target2050:4,    currentGlobal:40   },
  { sector:'power',     label:'Power',            unit:'gCO2/kWh',       baseline2020:450,  target2030:220,  target2040:80,   target2050:5,    currentGlobal:420  },
  { sector:'road',      label:'Road Transport',   unit:'gCO2/vkm',       baseline2020:168,  target2030:125,  target2040:72,   target2050:12,   currentGlobal:160  },
];

// ── 7. CARBON PRICE PATHWAYS 2025-2050 — array format, lowercase scenario keys ─
export const CARBON_PRICE_PATHS = [
  { year:2025, nz2050:55,  b2c:35,  dnz:65,  dt:12,  ndc:12,  cp:8  },
  { year:2030, nz2050:190, b2c:95,  dnz:230, dt:30,  ndc:20,  cp:10 },
  { year:2035, nz2050:320, b2c:165, dnz:400, dt:180, ndc:28,  cp:13 },
  { year:2040, nz2050:490, b2c:240, dnz:580, dt:420, ndc:38,  cp:16 },
  { year:2045, nz2050:600, b2c:280, dnz:700, dt:600, ndc:48,  cp:20 },
  { year:2050, nz2050:700, b2c:310, dnz:800, dt:750, ndc:60,  cp:25 },
];

// ── 8. HELPER FUNCTIONS ───────────────────────────────────────────────────────

/** Compute composite physical risk score (0-10) for a country under a given SSP */
export function getCountryPhysicalRisk(iso, ssp = 'SSP2-4.5') {
  const c = COUNTRY_PHYSICAL_RISK.find(x => x.iso === iso);
  if (!c) return null;
  const m = PHYSICAL_MULTIPLIERS;
  const raw = (
    c.flood    * m.flood[ssp]    +
    c.cyclone  * m.cyclone[ssp]  +
    c.wildfire * m.wildfire[ssp] +
    c.heatwave * m.heatwave[ssp] +
    c.drought  * m.drought[ssp]  +
    c.sealevel * m.sealevel[ssp]
  ) / 6;
  const adaptDiscount = (100 - c.adaptCapacity) / 100;
  return Math.min(10, raw * 100 * adaptDiscount * 1.8).toFixed(2);
}

/** Get NGFS Phase IV scenario by id */
export function getNGFSScenario(id) {
  return NGFS_PHASE4.find(s => s.id === id) || NGFS_PHASE4[0];
}

/** Compute CBAM cost for a holding (euros) given revenue, sector, carbon price */
export function computeCBAMCost(euRevenueM, sector, carbonPricePerTonne) {
  const intensities = {
    'Steel & Primary Metals':     1.85,
    'Cement & Construction Mats': 0.62,
    'Chemicals & Petrochemicals': 0.52,
    'Electricity Generation':     0.45,
    'Aluminium':                  16.5,
  };
  const intensity = intensities[sector] || 0.3;
  return euRevenueM * intensity * carbonPricePerTonne * 1000; // euro thousands
}

/** Get annualised EAL % of asset value for a country-hazard-SSP combination */
export function getEAL(iso, hazard, ssp = 'SSP2-4.5') {
  const c = COUNTRY_PHYSICAL_RISK.find(x => x.iso === iso);
  if (!c) return 0;
  const base = c[hazard] || 0;
  const multiplier = PHYSICAL_MULTIPLIERS[hazard]?.[ssp] || 1;
  return (base * multiplier).toFixed(3);
}
