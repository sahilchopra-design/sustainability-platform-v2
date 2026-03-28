import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, Cell, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { EU_ETS_ANNUAL, NGFS_CARBON_PRICES } from '../../../data/carbonPrices';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7',
  border:'#e5e0d8', borderL:'#d5cfc5',
  navy:'#1b3a5c', navyL:'#2c5a8c',
  gold:'#c5a96a', goldL:'#d4be8a',
  sage:'#5a8a6a', sageL:'#7ba67d',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  card:'0 1px 4px rgba(27,58,92,0.06)',
  cardH:'0 4px 16px rgba(27,58,92,0.1)',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

// ── Deterministic seed helper ─────────────────────────────────────────────────
const ds = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── PHYSICAL RISK ─────────────────────────────────────────────────────────────
const RISK_TYPES = ['Flood','Wildfire','Cyclone','Hail','Heat Stress','Sea Level Rise','Drought','Permafrost'];

const BORROWERS_PHYSICAL = [
  { id:1,  name:'Agricultural Co (East India)',    sector:'Agriculture', country:'India',       exposure:42,  scores:[1,1,1,1,4,1,5,1] },
  { id:2,  name:'Coastal Resort (Florida)',         sector:'Tourism',     country:'USA',         exposure:78,  scores:[5,2,5,2,3,4,2,1] },
  { id:3,  name:'Cement Plant (Pakistan)',          sector:'Industry',    country:'Pakistan',    exposure:55,  scores:[1,1,1,2,4,2,3,1] },
  { id:4,  name:'Salmon Farm (Norway)',             sector:'Agriculture', country:'Norway',      exposure:31,  scores:[2,1,1,1,3,2,1,2] },
  { id:5,  name:'Coffee Plantation (Ethiopia)',     sector:'Agriculture', country:'Ethiopia',    exposure:24,  scores:[1,1,1,1,4,1,4,1] },
  { id:6,  name:'Delta Port (Bangladesh)',          sector:'Logistics',   country:'Bangladesh',  exposure:110, scores:[5,1,2,1,3,5,3,1] },
  { id:7,  name:'Ski Resort (Alps)',                sector:'Tourism',     country:'Austria',     exposure:67,  scores:[1,2,1,3,3,2,2,1] },
  { id:8,  name:'Timber Co (California)',           sector:'Forestry',    country:'USA',         exposure:88,  scores:[3,5,1,2,3,1,4,1] },
  { id:9,  name:'Solar Farm (Arizona)',             sector:'Energy',      country:'USA',         exposure:145, scores:[1,3,3,3,5,1,4,1] },
  { id:10, name:'Steel Mill (Gulf Coast)',          sector:'Industry',    country:'USA',         exposure:200, scores:[3,1,4,3,4,2,2,1] },
  { id:11, name:'Mining Corp (Pilbara, AUS)',       sector:'Mining',      country:'Australia',   exposure:320, scores:[1,4,2,2,5,1,3,1] },
  { id:12, name:'Hydropower (Himalayas)',           sector:'Energy',      country:'Nepal',       exposure:95,  scores:[4,1,1,2,3,2,4,3] },
  { id:13, name:'Retail Chain (Mumbai)',            sector:'Retail',      country:'India',       exposure:62,  scores:[3,1,2,1,4,3,3,1] },
  { id:14, name:'Chemical Plant (Rotterdam)',       sector:'Industry',    country:'Netherlands', exposure:175, scores:[4,1,2,2,2,4,1,1] },
  { id:15, name:'Logistics Hub (Shanghai)',         sector:'Logistics',   country:'China',       exposure:280, scores:[4,1,3,2,3,4,2,1] },
  { id:16, name:'Cattle Farm (Brazil)',             sector:'Agriculture', country:'Brazil',      exposure:48,  scores:[2,3,2,2,4,1,5,1] },
  { id:17, name:'Telecom Tower Co (Philippines)',   sector:'Telecom',     country:'Philippines', exposure:72,  scores:[3,2,5,3,3,3,2,1] },
  { id:18, name:'Rail Infra (Northern Canada)',     sector:'Logistics',   country:'Canada',      exposure:155, scores:[2,2,1,3,2,1,2,5] },
  { id:19, name:'Offshore Wind Farm (North Sea)',   sector:'Energy',      country:'UK',          exposure:340, scores:[4,1,3,2,2,4,1,1] },
  { id:20, name:'Rice Paddy Cooperative (Mekong)', sector:'Agriculture', country:'Vietnam',     exposure:38,  scores:[4,1,2,1,3,4,4,1] },
  { id:21, name:'Airport (Dubai)',                  sector:'Logistics',   country:'UAE',         exposure:420, scores:[1,2,2,3,5,2,3,1] },
  { id:22, name:'Banana Plantation (Ecuador)',      sector:'Agriculture', country:'Ecuador',     exposure:29,  scores:[3,1,4,2,3,2,3,1] },
  { id:23, name:'Coal Mine (Appalachia)',           sector:'Mining',      country:'USA',         exposure:110, scores:[3,3,1,3,3,1,3,1] },
  { id:24, name:'Desalination Plant (Israel)',      sector:'Utilities',   country:'Israel',      exposure:88,  scores:[1,3,2,4,5,2,4,1] },
  { id:25, name:'LNG Terminal (Queensland)',        sector:'Energy',      country:'Australia',   exposure:260, scores:[2,4,4,3,4,2,2,1] },
  { id:26, name:'Hotel Group (Maldives)',           sector:'Tourism',     country:'Maldives',    exposure:55,  scores:[4,1,3,1,3,5,2,1] },
  { id:27, name:'Auto Assembly (Detroit)',          sector:'Industry',    country:'USA',         exposure:185, scores:[3,1,1,3,3,1,2,1] },
  { id:28, name:'Cocoa Farm (Ghana)',               sector:'Agriculture', country:'Ghana',       exposure:22,  scores:[2,2,1,1,4,1,4,1] },
  { id:29, name:'Submarine Cable (Pacific)',        sector:'Telecom',     country:'Japan',       exposure:480, scores:[3,1,5,2,2,4,1,1] },
  { id:30, name:'Forestry REIT (Siberia)',          sector:'Forestry',    country:'Russia',      exposure:75,  scores:[2,4,1,2,2,1,2,5] },
  { id:31, name:'Palm Oil Mill (Borneo)',           sector:'Agriculture', country:'Malaysia',    exposure:44,  scores:[4,3,4,2,4,2,3,1] },
  { id:32, name:'Gas Power Station (Italy)',        sector:'Energy',      country:'Italy',       exposure:140, scores:[3,2,1,3,3,2,2,1] },
  { id:33, name:'Container Port (Durban)',          sector:'Logistics',   country:'S.Africa',    exposure:98,  scores:[3,2,3,2,3,3,3,1] },
  { id:34, name:'Sugar Cane (Queensland)',          sector:'Agriculture', country:'Australia',   exposure:36,  scores:[3,4,5,3,4,1,3,1] },
  { id:35, name:'Copper Mine (Atacama)',            sector:'Mining',      country:'Chile',       exposure:290, scores:[1,3,1,2,4,1,5,1] },
  { id:36, name:'Airport (Miami)',                  sector:'Logistics',   country:'USA',         exposure:375, scores:[5,2,5,2,4,5,2,1] },
  { id:37, name:'Geothermal Plant (Iceland)',       sector:'Energy',      country:'Iceland',     exposure:68,  scores:[2,1,1,1,1,1,1,3] },
  { id:38, name:'Fish Processing (Greenland)',      sector:'Agriculture', country:'Greenland',   exposure:19,  scores:[3,1,1,1,2,3,1,4] },
  { id:39, name:'Paper Mill (Canada)',              sector:'Forestry',    country:'Canada',      exposure:82,  scores:[3,3,1,3,2,1,3,3] },
  { id:40, name:'Textile Factory (Bangladesh)',     sector:'Industry',    country:'Bangladesh',  exposure:47,  scores:[5,1,2,1,3,5,3,1] },
  { id:41, name:'Winery (Bordeaux)',                sector:'Agriculture', country:'France',      exposure:33,  scores:[2,3,1,3,4,1,3,1] },
  { id:42, name:'Cruise Terminal (Venice)',         sector:'Tourism',     country:'Italy',       exposure:61,  scores:[5,1,1,2,3,5,1,1] },
  { id:43, name:'Iron Ore (Labrador)',              sector:'Mining',      country:'Canada',      exposure:215, scores:[3,2,1,3,2,1,2,4] },
  { id:44, name:'Wind Farm (Patagonia)',            sector:'Energy',      country:'Argentina',   exposure:92,  scores:[2,2,3,3,3,1,3,1] },
  { id:45, name:'Groundnut Co (Senegal)',           sector:'Agriculture', country:'Senegal',     exposure:18,  scores:[2,2,1,1,4,1,5,1] },
  { id:46, name:'Nuclear Plant (Finland)',          sector:'Energy',      country:'Finland',     exposure:680, scores:[2,1,1,1,1,1,1,2] },
  { id:47, name:'Retail Mall (Jakarta)',            sector:'Retail',      country:'Indonesia',   exposure:57,  scores:[5,2,3,1,4,4,3,1] },
  { id:48, name:'Phosphate Mine (Morocco)',         sector:'Mining',      country:'Morocco',     exposure:130, scores:[1,3,1,2,4,1,5,1] },
  { id:49, name:'Data Centre (Singapore)',          sector:'Telecom',     country:'Singapore',   exposure:195, scores:[3,1,3,1,4,3,2,1] },
  { id:50, name:'Cruise Ship (Caribbean)',          sector:'Tourism',     country:'Bahamas',     exposure:88,  scores:[4,1,5,3,3,4,2,1] },
  { id:51, name:'Coal Power (Jharkhand)',           sector:'Energy',      country:'India',       exposure:165, scores:[2,1,1,1,5,1,4,1] },
  { id:52, name:'Agri REIT (Murray-Darling)',       sector:'Agriculture', country:'Australia',   exposure:74,  scores:[3,4,2,3,5,1,5,1] },
  { id:53, name:'Port (Gdansk)',                    sector:'Logistics',   country:'Poland',      exposure:112, scores:[3,1,2,3,2,2,2,1] },
  { id:54, name:'Tidal Barrier (Thames)',           sector:'Utilities',   country:'UK',          exposure:850, scores:[5,1,2,2,2,5,1,1] },
];

const riskColor = v => {
  if (v >= 5) return '#dc2626';
  if (v === 4) return '#ea580c';
  if (v === 3) return '#d97706';
  if (v === 2) return '#65a30d';
  return '#5a8a6a';
};

// ── TRANSITION RISK ───────────────────────────────────────────────────────────
const TRANSITION_BORROWERS = [
  { name:'Coal Power Gen (Poland)',    sector:'Power',    country:'Poland',      exposure:180, emissions:1420, ebitda:18,  ci:1.42 },
  { name:'Cement Co (Turkey)',         sector:'Cement',   country:'Turkey',      exposure:95,  emissions:840,  ebitda:22,  ci:0.84 },
  { name:'Steel Blast Furnace (DE)',   sector:'Steel',    country:'Germany',     exposure:210, emissions:1760, ebitda:14,  ci:1.76 },
  { name:'Airline (Short-haul EU)',    sector:'Aviation', country:'Germany',     exposure:135, emissions:630,  ebitda:11,  ci:0.63 },
  { name:'Oil Refinery (Rotterdam)',   sector:'Oil&Gas',  country:'Netherlands', exposure:160, emissions:580,  ebitda:9,   ci:0.58 },
  { name:'Plastic Packaging (UK)',     sector:'Chemicals',country:'UK',          exposure:72,  emissions:380,  ebitda:25,  ci:0.38 },
  { name:'Fertiliser Plant (India)',   sector:'Chemicals',country:'India',       exposure:88,  emissions:910,  ebitda:17,  ci:0.91 },
  { name:'Auto OEM (ICE-heavy, JP)',   sector:'Auto',     country:'Japan',       exposure:245, emissions:290,  ebitda:8,   ci:0.29 },
  { name:'Gas Distribution (Italy)',   sector:'Utilities',country:'Italy',       exposure:310, emissions:440,  ebitda:31,  ci:0.44 },
  { name:'Petrochems (Saudi Arabia)',  sector:'Oil&Gas',  country:'Saudi Arabia',exposure:420, emissions:720,  ebitda:38,  ci:0.72 },
  { name:'Shipping (Dry Bulk)',        sector:'Shipping', country:'Greece',      exposure:115, emissions:550,  ebitda:19,  ci:0.55 },
  { name:'Brickworks (UK)',            sector:'Cement',   country:'UK',          exposure:45,  emissions:620,  ebitda:21,  ci:0.62 },
  { name:'Pulp & Paper (Finland)',     sector:'Forestry', country:'Finland',     exposure:78,  emissions:470,  ebitda:16,  ci:0.47 },
  { name:'Asphalt & Roads (France)',   sector:'Cement',   country:'France',      exposure:62,  emissions:390,  ebitda:27,  ci:0.39 },
  { name:'Aluminium Smelter (Norway)', sector:'Steel',    country:'Norway',      exposure:130, emissions:880,  ebitda:12,  ci:0.88 },
  { name:'Thermal Coal (Colombia)',    sector:'Mining',   country:'Colombia',    exposure:95,  emissions:1100, ebitda:24,  ci:1.10 },
  { name:'Glass Manufacturer (CZ)',    sector:'Industry', country:'Czechia',     exposure:58,  emissions:510,  ebitda:18,  ci:0.51 },
  { name:'Iron Ore Sintering (AUS)',   sector:'Mining',   country:'Australia',   exposure:175, emissions:960,  ebitda:31,  ci:0.96 },
  { name:'Ammonia Plant (DE)',         sector:'Chemicals',country:'Germany',     exposure:110, emissions:830,  ebitda:14,  ci:0.83 },
  { name:'Brick Kiln Co (Pak)',        sector:'Industry', country:'Pakistan',    exposure:28,  emissions:460,  ebitda:9,   ci:0.46 },
  { name:'LPG Distributor (Brazil)',   sector:'Oil&Gas',  country:'Brazil',      exposure:88,  emissions:340,  ebitda:22,  ci:0.34 },
  { name:'Car Rental Fleet (UK)',      sector:'Auto',     country:'UK',          exposure:55,  emissions:210,  ebitda:14,  ci:0.21 },
  { name:'Cargo Airlines (Middle East)',sector:'Aviation',country:'UAE',         exposure:320, emissions:780,  ebitda:28,  ci:0.78 },
  { name:'Coke Oven (India)',          sector:'Steel',    country:'India',       exposure:65,  emissions:1050, ebitda:10,  ci:1.05 },
  { name:'Cement Grinding (Vietnam)',  sector:'Cement',   country:'Vietnam',     exposure:42,  emissions:590,  ebitda:15,  ci:0.59 },
  { name:'Peat Energy (Ireland)',      sector:'Power',    country:'Ireland',     exposure:38,  emissions:980,  ebitda:8,   ci:0.98 },
  { name:'Bitumen Refinery (Canada)',  sector:'Oil&Gas',  country:'Canada',      exposure:195, emissions:650,  ebitda:19,  ci:0.65 },
  { name:'District Heating (Poland)',  sector:'Utilities',country:'Poland',      exposure:72,  emissions:740,  ebitda:26,  ci:0.74 },
  { name:'Waste-to-Energy (Sweden)',   sector:'Utilities',country:'Sweden',      exposure:85,  emissions:290,  ebitda:33,  ci:0.29 },
  { name:'Nitrogen Chemicals (BE)',    sector:'Chemicals',country:'Belgium',     exposure:98,  emissions:620,  ebitda:20,  ci:0.62 },
];

const CARBON_PRESETS = [
  { label:'Current UK ETS (£41/t)',     price:41  },
  { label:'Central 2030 (£130/t)',      price:130 },
  { label:'High 2030 (£250/t)',         price:250 },
  { label:'Delayed Spike 2035 (£800/t)',price:800 },
];

// ── IFRS 9 ────────────────────────────────────────────────────────────────────
const IFRS9_SCENARIOS = ['Net Zero 2050','Delayed Transition','Hot House World','Custom'];

const BASE_ECL = { s1:0.18, s2:1.42, s3:8.65 }; // £M

const DISCLOSURE_ITEMS = [
  'IFRS 9 climate overlay methodology documented',
  'Physical risk scoring framework approved by CRO',
  'Transition risk PD uplift model validated',
  'Scenario narratives aligned with NGFS Phase IV',
  'Stage migration SICR assessment criteria defined',
  'EBA Pillar 3 ESG template populated (Q3)',
  'BCBS Principle 18 stress test disclosed',
  'Board-level climate risk appetite statement published',
  'ECL sensitivity analysis disclosed in notes',
  'Forward-looking climate factors model documented',
  'Data lineage for physical risk scores auditable',
  'Third-party data provider contracts reviewed',
  'Carbon price sensitivities in financial disclosures',
  'EPC/stranded asset exposure disclosed by segment',
  'Management overlay sign-off documented',
];

// ── EPC / STRANDED ASSETS ─────────────────────────────────────────────────────
const EPC_BANDS = ['A','B','C','D','E','F','G'];

// Book: £42bn total
const EPC_BASE = {
  A: { resi:1200, btl:420,  cre:380,  ind:210  },
  B: { resi:3400, btl:980,  cre:1200, ind:640  },
  C: { resi:5800, btl:1640, cre:2100, ind:1080 },
  D: { resi:7200, btl:2100, cre:2800, ind:1420 },
  E: { resi:4800, btl:1380, cre:1900, ind:920  },
  F: { resi:2100, btl:680,  cre:840,  ind:420  },
  G: { resi:900,  btl:280,  cre:320,  ind:160  },
};

const MEES_SCENARIOS = ['Current Law','Proposed 2028 (EPC C)','Conservative (EPC B by 2030)','No Change'];

const DEFAULT_HAIRCUTS = { A:0, B:0, C:2, D:6, E:14, F:22, G:30 };

const STRANDED_TIMELINE = [2024,2026,2028,2030,2032,2035,2040,2045,2050].map((yr,i) => ({
  year: yr,
  value: +(2.1 + i * 1.8 + (i > 4 ? (i-4)*3.2 : 0)).toFixed(1),
}));

const CRE_PROPERTIES = [
  { name:'West End Office (London)',      epc:'B', flood:'Low',    risk:2.1,  value:85  },
  { name:'Manchester Retail Park',        epc:'D', flood:'Med',    risk:4.8,  value:42  },
  { name:'Glasgow Industrial Unit',       epc:'E', flood:'Med',    risk:6.2,  value:18  },
  { name:'Canary Wharf Tower',            epc:'A', flood:'Low',    risk:1.4,  value:210 },
  { name:'Birmingham Warehouse',          epc:'D', flood:'High',   risk:7.4,  value:31  },
  { name:'Bristol Office Campus',         epc:'C', flood:'Low',    risk:3.1,  value:67  },
  { name:'Leeds Retail Centre',           epc:'E', flood:'High',   risk:8.2,  value:28  },
  { name:'Edinburgh Mixed Use',           epc:'B', flood:'Low',    risk:2.4,  value:54  },
  { name:'Sheffield Industrial Est.',     epc:'F', flood:'Med',    risk:9.1,  value:14  },
  { name:'Liverpool Waterfront Office',   epc:'C', flood:'High',   risk:6.8,  value:72  },
  { name:'Cardiff Logistics Hub',         epc:'D', flood:'Med',    risk:5.5,  value:39  },
  { name:'Nottingham Retail High St.',    epc:'F', flood:'Low',    risk:7.8,  value:22  },
  { name:'Cambridge Science Park',        epc:'A', flood:'Low',    risk:1.2,  value:95  },
  { name:'Hull Distribution Centre',      epc:'G', flood:'High',   risk:9.8,  value:12  },
  { name:'Southampton Port Office',       epc:'E', flood:'High',   risk:8.9,  value:25  },
  { name:'Coventry Auto Factory',         epc:'D', flood:'Low',    risk:4.2,  value:58  },
  { name:'Oxford Mixed Retail',           epc:'B', flood:'Low',    risk:2.8,  value:76  },
  { name:'Plymouth Waterfront Hotel',     epc:'E', flood:'High',   risk:7.6,  value:35  },
  { name:'Newcastle Business Park',       epc:'C', flood:'Med',    risk:3.9,  value:48  },
  { name:'Derby Manufacturing Plant',     epc:'F', flood:'Low',    risk:6.4,  value:19  },
];

// ── Stat card ─────────────────────────────────────────────────────────────────
const Stat = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8,
    padding:'14px 18px', boxShadow:T.card, minWidth:140 }}>
    <div style={{ fontSize:11, color:T.textMut, fontWeight:600, textTransform:'uppercase',
      letterSpacing:'0.06em', marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:color||T.navy, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>{sub}</div>}
  </div>
);

// ── Tab button ────────────────────────────────────────────────────────────────
const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding:'8px 18px', borderRadius:6, border:'none', cursor:'pointer',
    fontFamily:T.font, fontSize:13, fontWeight:600,
    background:active ? T.navy : 'transparent',
    color:active ? '#fff' : T.textSec,
    transition:'all 0.15s' }}>
    {label}
  </button>
);

// ── PHYSICAL RISK TAB ─────────────────────────────────────────────────────────
const PhysicalRiskTab = () => {
  const [selectedRisk, setSelectedRisk] = useState('');
  const [threshold, setThreshold] = useState(1);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [minExposure, setMinExposure] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [running, setRunning] = useState(false);
  const [phyWeights, setPhyWeights] = useState({ Flood:0.18, Wildfire:0.12, Cyclone:0.14, Hail:0.08, 'Heat Stress':0.15, 'Sea Level Rise':0.16, Drought:0.12, Permafrost:0.05 });

  const sectors = useMemo(() => ['All',...new Set(BORROWERS_PHYSICAL.map(b=>b.sector))], []);
  const countries = useMemo(() => ['All',...new Set(BORROWERS_PHYSICAL.map(b=>b.country))].sort(), []);

  const riskColIdx = selectedRisk ? RISK_TYPES.indexOf(selectedRisk) : -1;

  const filtered = useMemo(() => BORROWERS_PHYSICAL.filter(b => {
    const maxScore = Math.max(...b.scores);
    if (riskColIdx >= 0 && b.scores[riskColIdx] < threshold) return false;
    if (riskColIdx < 0 && maxScore < threshold) return false;
    if (sectorFilter !== 'All' && b.sector !== sectorFilter) return false;
    if (countryFilter !== 'All' && b.country !== countryFilter) return false;
    if (b.exposure < minExposure) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [riskColIdx, threshold, sectorFilter, countryFilter, minExposure, search]);

  const eclOverlay = useMemo(() => {
    let total = 0;
    filtered.forEach(b => {
      const weighted = RISK_TYPES.reduce((acc,rt,i) => acc + b.scores[i] * phyWeights[rt], 0);
      total += (weighted / 5) * b.exposure * 0.004;
    });
    return total.toFixed(1);
  }, [filtered, phyWeights]);

  const runAssessment = () => {
    setRunning(true);
    setTimeout(() => setRunning(false), 2000);
  };

  const floodZones = ['Flood Zone 1 (Low)', 'Flood Zone 2 (Med)', 'Flood Zone 3 (High)'];

  return (
    <div>
      {/* Controls */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:16, alignItems:'flex-end' }}>
        <div>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>Risk Type</div>
          <select value={selectedRisk} onChange={e=>setSelectedRisk(e.target.value)}
            style={{ padding:'5px 8px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:12, background:T.surface, color:T.text }}>
            <option value=''>All</option>
            {RISK_TYPES.map(r=><option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>Min Score: {threshold}</div>
          <input type='range' min={1} max={5} value={threshold} onChange={e=>setThreshold(+e.target.value)}
            style={{ width:120 }} />
        </div>
        <div>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>Sector</div>
          <select value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)}
            style={{ padding:'5px 8px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:12, background:T.surface, color:T.text }}>
            {sectors.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>Country</div>
          <select value={countryFilter} onChange={e=>setCountryFilter(e.target.value)}
            style={{ padding:'5px 8px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:12, background:T.surface, color:T.text }}>
            {countries.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>Min Exposure £m: {minExposure}</div>
          <input type='range' min={0} max={400} step={10} value={minExposure} onChange={e=>setMinExposure(+e.target.value)}
            style={{ width:110 }} />
        </div>
        <div>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>Search</div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder='Borrower name...'
            style={{ padding:'5px 9px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:12, background:T.surface, color:T.text, width:160 }} />
        </div>
        <button onClick={runAssessment} disabled={running}
          style={{ padding:'7px 16px', background:running?T.textMut:T.navy, color:'#fff', border:'none',
            borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', marginLeft:'auto' }}>
          {running ? 'Running...' : 'Run Assessment'}
        </button>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:12 }}>
        <Stat label='Borrowers shown' value={filtered.length} sub={`of 54 total`} />
        <Stat label='ECL Overlay (est.)' value={`£${eclOverlay}m`} color={T.red} />
        <Stat label='Avg Max Score' value={(filtered.reduce((a,b)=>a+Math.max(...b.scores),0)/Math.max(filtered.length,1)).toFixed(1)} />
      </div>

      <div style={{ display:'flex', gap:14 }}>
        {/* Heat grid */}
        <div style={{ flex:1, overflowX:'auto' }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr style={{ background:T.navy }}>
                  <th style={{ padding:'8px 10px', color:'#fff', textAlign:'left', fontWeight:600, minWidth:180 }}>Borrower</th>
                  <th style={{ padding:'6px', color:'#fff', fontWeight:500, fontSize:10 }}>£M Exp</th>
                  {RISK_TYPES.map(rt=>(
                    <th key={rt} style={{ padding:'6px 4px', color: rt===selectedRisk?T.gold:'#fff',
                      fontWeight:rt===selectedRisk?700:500, fontSize:9, textAlign:'center', cursor:'pointer',
                      background:rt===selectedRisk?'rgba(197,169,106,0.15)':undefined }}
                      onClick={()=>setSelectedRisk(rt===selectedRisk?'':rt)}>
                      {rt.split(' ').map((w,i)=><div key={i}>{w}</div>)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b,i) => (
                  <tr key={b.id} style={{ background:i%2===0?T.surface:T.bg, cursor:'pointer',
                    outline:selectedBorrower?.id===b.id?`2px solid ${T.navy}`:'none' }}
                    onClick={()=>setSelectedBorrower(selectedBorrower?.id===b.id?null:b)}>
                    <td style={{ padding:'6px 10px', color:T.text, fontWeight:500, fontSize:11 }}>{b.name}</td>
                    <td style={{ padding:'6px', color:T.textSec, textAlign:'right', fontSize:11 }}>{b.exposure}</td>
                    {b.scores.map((sc,j)=>(
                      <td key={j} style={{ padding:'4px', textAlign:'center',
                        background:riskColIdx===j?`${riskColor(sc)}22`:undefined }}>
                        <div style={{ width:22, height:22, borderRadius:4, background:riskColor(sc),
                          margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:10, color:'#fff', fontWeight:700 }}>{sc}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side panel */}
        {selectedBorrower && (
          <div style={{ width:280, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8,
            padding:16, boxShadow:T.cardH, flexShrink:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8 }}>{selectedBorrower.name}</div>
            <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
              {selectedBorrower.sector} | {selectedBorrower.country} | £{selectedBorrower.exposure}m
            </div>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:4, fontWeight:600 }}>LOCATION DETAILS</div>
            <div style={{ fontSize:11, color:T.textSec, marginBottom:8 }}>
              Lat/Long: {(ds(selectedBorrower.id)*90).toFixed(2)}°N, {(ds(selectedBorrower.id*3)*180).toFixed(2)}°E<br/>
              Flood zone: {floodZones[selectedBorrower.scores[0]-1 < 3 ? Math.min(selectedBorrower.scores[0]-1,2) : 2]}<br/>
              Insurance coverage: {selectedBorrower.scores[0]>=4?'Partial — gap identified':'Adequate'}
            </div>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:4, fontWeight:600 }}>RISK SCORES</div>
            {RISK_TYPES.map((rt,i)=>(
              <div key={rt} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <div style={{ fontSize:10, color:T.textSec, width:80 }}>{rt}</div>
                <div style={{ flex:1, height:8, background:T.bg, borderRadius:4, overflow:'hidden' }}>
                  <div style={{ width:`${selectedBorrower.scores[i]*20}%`, height:'100%', background:riskColor(selectedBorrower.scores[i]), borderRadius:4 }}/>
                </div>
                <div style={{ fontSize:10, fontWeight:700, color:riskColor(selectedBorrower.scores[i]), width:12 }}>{selectedBorrower.scores[i]}</div>
              </div>
            ))}
            <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:6 }}>
              {['Request risk assessment','Apply LGD haircut','Flag for covenant review'].map(a=>(
                <button key={a} style={{ padding:'6px 10px', background:T.bg, border:`1px solid ${T.border}`,
                  borderRadius:5, fontSize:11, color:T.navy, cursor:'pointer', textAlign:'left', fontWeight:500 }}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ECL overlay calculator */}
      <div style={{ marginTop:16, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>ECL Overlay Calculator — Probability Weights</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:12, alignItems:'center' }}>
          {RISK_TYPES.map(rt=>(
            <div key={rt} style={{ minWidth:130 }}>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:3 }}>{rt}: {(phyWeights[rt]*100).toFixed(0)}%</div>
              <input type='range' min={0} max={0.5} step={0.01} value={phyWeights[rt]}
                onChange={e=>setPhyWeights(p=>({...p,[rt]:+e.target.value}))}
                style={{ width:'100%' }} />
            </div>
          ))}
          <div style={{ marginLeft:'auto', textAlign:'right' }}>
            <div style={{ fontSize:11, color:T.textMut }}>Total ECL Overlay (filtered borrowers)</div>
            <div style={{ fontSize:24, fontWeight:700, color:T.red }}>£{eclOverlay}m</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── TRANSITION RISK TAB ───────────────────────────────────────────────────────
const TransitionRiskTab = () => {
  const [preset, setPreset] = useState(0);
  const [customPrice, setCustomPrice] = useState(130);
  const [isCustom, setIsCustom] = useState(false);
  const [sortKey, setSortKey] = useState('carbonCost');
  const [sortDir, setSortDir] = useState(-1);
  const [viableThreshold, setViableThreshold] = useState(20);
  const [sectorRollup, setSectorRollup] = useState(false);

  const carbonPrice = isCustom ? customPrice : CARBON_PRESETS[preset].price;

  const rows = useMemo(() => TRANSITION_BORROWERS.map(b => {
    const carbonCost = +(b.emissions * carbonPrice / 1000).toFixed(1);
    const ebitdaImpact = +(carbonCost / b.ebitda * 100).toFixed(1);
    const pdUplift = +(b.ci * carbonPrice * 0.018).toFixed(0);
    const flag = ebitdaImpact > 40 ? 'Red' : ebitdaImpact > 20 ? 'Amber' : 'Green';
    return { ...b, carbonCost, ebitdaImpact, pdUplift, flag };
  }), [carbonPrice]);

  const sorted = useMemo(() => {
    return [...rows].sort((a,b) => sortDir * (a[sortKey] - b[sortKey]));
  }, [rows, sortKey, sortDir]);

  const sectorAgg = useMemo(() => {
    const map = {};
    rows.forEach(r => {
      if (!map[r.sector]) map[r.sector] = { sector:r.sector, exposure:0, carbonCost:0, ebitda:0, count:0 };
      map[r.sector].exposure += r.exposure;
      map[r.sector].carbonCost += r.carbonCost;
      map[r.sector].ebitda += r.ebitda;
      map[r.sector].count += 1;
    });
    return Object.values(map).map(s => ({ ...s,
      ebitdaImpact: +(s.carbonCost/s.ebitda*100).toFixed(1) }));
  }, [rows]);

  const handleSort = k => {
    if (sortKey === k) setSortDir(d => -d);
    else { setSortKey(k); setSortDir(-1); }
  };

  const exportCSV = () => {
    const header = 'Company,Sector,Country,Exposure £M,Emissions ktCO2,EBITDA £M,Carbon Cost £M,EBITDA Impact %,PD Uplift bps,Flag\n';
    const body = rows.map(r=>`"${r.name}","${r.sector}","${r.country}",${r.exposure},${r.emissions},${r.ebitda},${r.carbonCost},${r.ebitdaImpact},${r.pdUplift},${r.flag}`).join('\n');
    const blob = new Blob([header+body],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='transition_risk.csv'; a.click();
  };

  const euEtsData = EU_ETS_ANNUAL.slice(-5).map(d=>({ year:String(d.year), price:d.price }));

  const thSty = k => ({ padding:'8px 10px', textAlign:'left', fontSize:11, fontWeight:700,
    color:'#fff', cursor:'pointer', background:sortKey===k?T.navyL:undefined,
    userSelect:'none', whiteSpace:'nowrap' });

  return (
    <div>
      {/* Scenario selector */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:16, alignItems:'flex-end' }}>
        <div>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:6 }}>Carbon Price Scenario</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {CARBON_PRESETS.map((p,i)=>(
              <button key={i} onClick={()=>{setPreset(i);setIsCustom(false);}}
                style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`,
                  background:!isCustom&&preset===i?T.navy:T.surface,
                  color:!isCustom&&preset===i?'#fff':T.text, fontSize:11, cursor:'pointer', fontWeight:500 }}>
                {p.label}
              </button>
            ))}
            <button onClick={()=>setIsCustom(true)}
              style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`,
                background:isCustom?T.navy:T.surface,
                color:isCustom?'#fff':T.text, fontSize:11, cursor:'pointer', fontWeight:500 }}>
              Custom
            </button>
          </div>
        </div>
        {isCustom && (
          <div>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>Custom: £{customPrice}/t</div>
            <input type='range' min={0} max={1000} value={customPrice} onChange={e=>setCustomPrice(+e.target.value)}
              style={{ width:180 }} />
          </div>
        )}
        <div style={{ marginLeft:'auto', display:'flex', gap:10, alignItems:'center' }}>
          <label style={{ fontSize:12, color:T.textSec, display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
            <input type='checkbox' checked={sectorRollup} onChange={e=>setSectorRollup(e.target.checked)} />
            Sector rollup
          </label>
          <button onClick={exportCSV}
            style={{ padding:'7px 14px', background:T.sage, color:'#fff', border:'none', borderRadius:6,
              fontSize:12, fontWeight:600, cursor:'pointer' }}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Viable threshold */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14,
        background:T.surface, border:`1px solid ${T.border}`, borderRadius:7, padding:'10px 14px' }}>
        <span style={{ fontSize:12, color:T.textSec }}>Alert when carbon cost exceeds</span>
        <input type='number' value={viableThreshold} onChange={e=>setViableThreshold(+e.target.value)}
          style={{ width:55, padding:'4px 8px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:12,
            color:T.navy, background:T.surface }} />
        <span style={{ fontSize:12, color:T.textSec }}>% of EBITDA</span>
        <span style={{ fontSize:12, color:T.red, fontWeight:600 }}>
          — {rows.filter(r=>r.ebitdaImpact>viableThreshold).length} borrowers flagged
        </span>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        <Stat label='Active price' value={`£${carbonPrice}/t`} color={T.gold} />
        <Stat label='Total carbon cost' value={`£${rows.reduce((a,b)=>a+b.carbonCost,0).toFixed(0)}m`} color={T.red} />
        <Stat label='Red-flagged borrowers' value={rows.filter(r=>r.flag==='Red').length} color={T.red} />
        <Stat label='Avg PD uplift' value={`${(rows.reduce((a,b)=>a+b.pdUplift,0)/rows.length).toFixed(0)} bps`} />
      </div>

      {/* EU ETS context chart */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:14, marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:600, color:T.navy, marginBottom:8 }}>EU ETS Historical (EUR/t) — Context</div>
        <ResponsiveContainer width='100%' height={80}>
          <AreaChart data={euEtsData}>
            <XAxis dataKey='year' tick={{fontSize:10}} />
            <YAxis tick={{fontSize:10}} />
            <Tooltip formatter={v=>`€${v}/t`} />
            <Area type='monotone' dataKey='price' stroke={T.gold} fill={`${T.gold}33`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      {sectorRollup ? (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:T.navy }}>
                {['Sector','# Borrowers','Total Exp £M','Total Carbon Cost £M','Avg EBITDA Impact %'].map(h=>(
                  <th key={h} style={{ padding:'9px 12px', color:'#fff', textAlign:'left', fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sectorAgg.sort((a,b)=>b.carbonCost-a.carbonCost).map((s,i)=>(
                <tr key={s.sector} style={{ background:i%2===0?T.surface:T.bg }}>
                  <td style={{ padding:'8px 12px', fontWeight:600, color:T.navy }}>{s.sector}</td>
                  <td style={{ padding:'8px 12px', color:T.textSec }}>{s.count}</td>
                  <td style={{ padding:'8px 12px', color:T.textSec }}>£{s.exposure}m</td>
                  <td style={{ padding:'8px 12px', fontWeight:700, color:s.carbonCost>s.ebitda?T.red:T.text }}>£{s.carbonCost.toFixed(1)}m</td>
                  <td style={{ padding:'8px 12px', color:s.ebitdaImpact>viableThreshold?T.red:T.green, fontWeight:600 }}>{s.ebitdaImpact.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead>
              <tr style={{ background:T.navy }}>
                <th style={thSty('')}>Company</th>
                <th style={thSty('')}>Sector</th>
                <th style={{ ...thSty('exposure') }} onClick={()=>handleSort('exposure')}>Exp £M {sortKey==='exposure'?(sortDir<0?'▼':'▲'):''}</th>
                <th style={{ ...thSty('emissions') }} onClick={()=>handleSort('emissions')}>Emiss. ktCO2 {sortKey==='emissions'?(sortDir<0?'▼':'▲'):''}</th>
                <th style={{ ...thSty('ebitda') }} onClick={()=>handleSort('ebitda')}>EBITDA £M</th>
                <th style={{ ...thSty('carbonCost') }} onClick={()=>handleSort('carbonCost')}>Carbon Cost {sortKey==='carbonCost'?(sortDir<0?'▼':'▲'):''}</th>
                <th style={{ ...thSty('ebitdaImpact') }} onClick={()=>handleSort('ebitdaImpact')}>EBITDA % {sortKey==='ebitdaImpact'?(sortDir<0?'▼':'▲'):''}</th>
                <th style={{ ...thSty('pdUplift') }} onClick={()=>handleSort('pdUplift')}>PD Uplift bps {sortKey==='pdUplift'?(sortDir<0?'▼':'▲'):''}</th>
                <th style={thSty('')}>Flag</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((b,i)=>{
                const over = b.ebitdaImpact > viableThreshold;
                return (
                  <tr key={b.name} style={{ background:over?'#fef2f2':i%2===0?T.surface:T.bg }}>
                    <td style={{ padding:'7px 10px', fontWeight:500, color:T.navy, fontSize:11 }}>{b.name}</td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>{b.sector}</td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>£{b.exposure}m</td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>{b.emissions}</td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>£{b.ebitda}m</td>
                    <td style={{ padding:'7px 10px', fontWeight:700, color:b.carbonCost>b.ebitda*0.3?T.red:T.text }}>£{b.carbonCost}m</td>
                    <td style={{ padding:'7px 10px', fontWeight:600, color:over?T.red:b.ebitdaImpact>10?T.amber:T.green }}>{b.ebitdaImpact}%</td>
                    <td style={{ padding:'7px 10px', color:b.pdUplift>300?T.red:T.textSec }}>{b.pdUplift}</td>
                    <td style={{ padding:'7px 10px' }}>
                      <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700,
                        background:b.flag==='Red'?'#fee2e2':b.flag==='Amber'?'#fef3c7':'#dcfce7',
                        color:b.flag==='Red'?T.red:b.flag==='Amber'?T.amber:T.green }}>
                        {b.flag}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── IFRS 9 TAB ────────────────────────────────────────────────────────────────
const IFRS9Tab = () => {
  const [scenario, setScenario] = useState(0);
  const [baseECL, setBaseECL] = useState({ ...BASE_ECL });
  const [physOverlay, setPhysOverlay] = useState({ Flood:1.2, Wildfire:0.8, 'Heat Stress':1.5, Drought:0.9, Cyclone:0.7, 'Sea Level Rise':1.8 });
  const [transOverlay, setTransOverlay] = useState({ Power:2.1, Cement:1.6, Steel:2.8, Aviation:1.4, 'Oil&Gas':1.9 });
  const [correlUplift, setCorrelUplift] = useState(0.8);
  const [runSICR, setRunSICR] = useState(false);
  const [sicrStaged, setSicrStaged] = useState(false);
  const [checklist, setChecklist] = useState(Array(15).fill(false));
  const [provYear, setProvYear] = useState(2030);
  const [provPrice, setProvPrice] = useState(250);

  const scenMultipliers = [1.0, 1.4, 2.1, 0.7];

  const mult = scenMultipliers[scenario];

  const totalPhys = useMemo(() => Object.values(physOverlay).reduce((a,b)=>a+b,0)*0.12*mult, [physOverlay, mult]);
  const totalTrans = useMemo(() => Object.values(transOverlay).reduce((a,b)=>a+b,0)*0.18*mult, [transOverlay, mult]);
  const sicrAdd = sicrStaged ? 0.85 * mult : 0;
  const totalECL = +(baseECL.s1 + baseECL.s2 + baseECL.s3 + totalPhys + totalTrans + correlUplift*mult + sicrAdd).toFixed(2);

  const waterfallData = [
    { name:'Base S1', value:+baseECL.s1.toFixed(2), fill:T.sage },
    { name:'Base S2', value:+baseECL.s2.toFixed(2), fill:T.navyL },
    { name:'Base S3', value:+baseECL.s3.toFixed(2), fill:T.navy },
    { name:'Phys Overlay', value:+totalPhys.toFixed(2), fill:T.amber },
    { name:'Trans Overlay', value:+totalTrans.toFixed(2), fill:'#ea580c' },
    { name:'Correl Uplift', value:+(correlUplift*mult).toFixed(2), fill:T.gold },
    { name:'SICR Staged', value:+sicrAdd.toFixed(2), fill:sicrStaged?T.red:T.textMut },
    { name:'TOTAL', value:totalECL, fill:T.red },
  ];

  const readiness = checklist.filter(Boolean).length;

  const provAdd = useMemo(() => {
    const yearFactor = (provYear - 2024) / 26;
    return +((provPrice / 250) * yearFactor * 1.8 * mult).toFixed(2);
  }, [provYear, provPrice, mult]);

  const topMovers = [
    { name:'Delta Port (Bangladesh)',  reason:'Sea Level Rise + Flood', ecl:+(totalPhys*0.14).toFixed(2) },
    { name:'Tidal Barrier (Thames)',   reason:'Flood + Sea Level Rise',  ecl:+(totalPhys*0.12).toFixed(2) },
    { name:'Coal Power Gen (Poland)',  reason:'Transition PD uplift',    ecl:+(totalTrans*0.16).toFixed(2) },
    { name:'Steel Blast Furnace (DE)', reason:'Transition + Correlation',ecl:+(totalTrans*0.14).toFixed(2) },
    { name:'Airport (Miami)',          reason:'Cyclone + Flood + SLR',   ecl:+(totalPhys*0.11).toFixed(2) },
    { name:'Logistics Hub (Shanghai)', reason:'Flood + Sea Level Rise',  ecl:+(totalPhys*0.10).toFixed(2) },
    { name:'Aluminium Smelter (NO)',   reason:'Transition intensity',    ecl:+(totalTrans*0.11).toFixed(2) },
    { name:'Chemical Plant (Rotterdam)',reason:'Flood + Sea Level Rise', ecl:+(totalPhys*0.09).toFixed(2) },
    { name:'Copper Mine (Atacama)',    reason:'Drought — severe',        ecl:+(totalPhys*0.08).toFixed(2) },
    { name:'Petrochems (Saudi Arabia)',reason:'Transition + Heat Stress',ecl:+(totalTrans*0.09).toFixed(2) },
  ].sort((a,b)=>b.ecl-a.ecl);

  return (
    <div>
      {/* Scenario & stage */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16, alignItems:'flex-end' }}>
        <div>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:6 }}>IFRS 9 Scenario</div>
          <div style={{ display:'flex', gap:8 }}>
            {IFRS9_SCENARIOS.map((s,i)=>(
              <button key={s} onClick={()=>setScenario(i)}
                style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`,
                  background:scenario===i?T.navy:T.surface, color:scenario===i?'#fff':T.text,
                  fontSize:12, cursor:'pointer', fontWeight:500 }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:10, marginLeft:'auto', alignItems:'center' }}>
          <button onClick={()=>{setRunSICR(true);setTimeout(()=>setRunSICR(false),1500);}}
            disabled={runSICR}
            style={{ padding:'7px 14px', background:runSICR?T.textMut:T.navyL, color:'#fff', border:'none',
              borderRadius:6, fontSize:12, cursor:'pointer', fontWeight:600 }}>
            {runSICR?'Assessing...':'Run SICR Assessment'}
          </button>
          <label style={{ fontSize:12, color:T.textSec, display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
            <input type='checkbox' checked={sicrStaged} onChange={e=>setSicrStaged(e.target.checked)} />
            Stage up high-climate-risk borrowers
          </label>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        {/* ECL component editor */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:10 }}>ECL Component Editor</div>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:6, fontWeight:600 }}>Base ECL (£M)</div>
            {(['s1','s2','s3']).map(s=>(
              <div key={s} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <label style={{ fontSize:11, color:T.textSec, width:50 }}>Stage {s[1]}:</label>
                <input type='number' step='0.01' value={baseECL[s]}
                  onChange={e=>setBaseECL(p=>({...p,[s]:+e.target.value}))}
                  style={{ width:70, padding:'4px 8px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:12 }} />
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:6, fontWeight:600 }}>Physical Risk Overlay (£M)</div>
          {Object.keys(physOverlay).map(k=>(
            <div key={k} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:11, color:T.textSec, width:90 }}>{k}</span>
              <input type='range' min={0} max={5} step={0.1} value={physOverlay[k]}
                onChange={e=>setPhysOverlay(p=>({...p,[k]:+e.target.value}))}
                style={{ flex:1 }} />
              <span style={{ fontSize:11, fontWeight:600, color:T.navy, width:30 }}>{physOverlay[k].toFixed(1)}</span>
            </div>
          ))}
          <div style={{ fontSize:11, color:T.textMut, marginBottom:6, marginTop:8, fontWeight:600 }}>Transition Risk Overlay (£M)</div>
          {Object.keys(transOverlay).map(k=>(
            <div key={k} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:11, color:T.textSec, width:90 }}>{k}</span>
              <input type='range' min={0} max={6} step={0.1} value={transOverlay[k]}
                onChange={e=>setTransOverlay(p=>({...p,[k]:+e.target.value}))}
                style={{ flex:1 }} />
              <span style={{ fontSize:11, fontWeight:600, color:T.navy, width:30 }}>{transOverlay[k].toFixed(1)}</span>
            </div>
          ))}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
            <span style={{ fontSize:11, color:T.textSec, width:90 }}>Correlation uplift</span>
            <input type='range' min={0} max={3} step={0.05} value={correlUplift}
              onChange={e=>setCorrelUplift(+e.target.value)} style={{ flex:1 }} />
            <span style={{ fontSize:11, fontWeight:600, color:T.navy, width:30 }}>{correlUplift.toFixed(2)}</span>
          </div>
        </div>

        {/* Waterfall chart */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:6 }}>ECL Waterfall — {IFRS9_SCENARIOS[scenario]}</div>
          <div style={{ fontSize:22, fontWeight:700, color:T.red, marginBottom:10 }}>Total: £{totalECL}m</div>
          <ResponsiveContainer width='100%' height={200}>
            <BarChart data={waterfallData} margin={{top:4,right:4,left:0,bottom:20}}>
              <XAxis dataKey='name' tick={{fontSize:9}} angle={-30} textAnchor='end' interval={0} />
              <YAxis tick={{fontSize:10}} />
              <Tooltip formatter={v=>`£${v}m`} />
              <Bar dataKey='value'>
                {waterfallData.map((d,i)=><Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Provision sensitivity + Top movers */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:10 }}>Provision Sensitivity</div>
          <div style={{ fontSize:12, color:T.textSec, marginBottom:8 }}>If carbon price reaches £X/t by year Y, additional provisions needed:</div>
          <div style={{ display:'flex', gap:12, marginBottom:10 }}>
            <div>
              <div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>Year: {provYear}</div>
              <input type='range' min={2025} max={2050} value={provYear} onChange={e=>setProvYear(+e.target.value)}
                style={{ width:120 }} />
            </div>
            <div>
              <div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>Price: £{provPrice}/t</div>
              <input type='range' min={50} max={1000} step={10} value={provPrice} onChange={e=>setProvPrice(+e.target.value)}
                style={{ width:120 }} />
            </div>
          </div>
          <div style={{ fontSize:20, fontWeight:700, color:T.red }}>+£{provAdd}m additional provisions</div>
          <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>vs. current scenario baseline</div>
        </div>

        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:8 }}>Top 10 ECL Drivers</div>
          {topMovers.map((m,i)=>(
            <div key={m.name} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
              <span style={{ fontSize:10, color:T.textMut, width:14 }}>{i+1}.</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, fontWeight:600, color:T.navy }}>{m.name}</div>
                <div style={{ fontSize:10, color:T.textSec }}>{m.reason}</div>
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:T.red }}>£{m.ecl}m</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclosure checklist */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.navy }}>Disclosure Readiness Checklist</div>
          <div style={{ fontSize:13, fontWeight:700, color:readiness>=12?T.green:readiness>=8?T.amber:T.red }}>
            {readiness}/{DISCLOSURE_ITEMS.length} — {readiness>=12?'Ready':'In Progress'}
          </div>
        </div>
        <div style={{ height:6, background:T.bg, borderRadius:3, marginBottom:12, overflow:'hidden' }}>
          <div style={{ width:`${readiness/15*100}%`, height:'100%',
            background:readiness>=12?T.green:readiness>=8?T.amber:T.red, borderRadius:3, transition:'width 0.3s' }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
          {DISCLOSURE_ITEMS.map((item,i)=>(
            <label key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, cursor:'pointer',
              padding:'5px 8px', borderRadius:5, background:checklist[i]?'#f0fdf4':T.bg }}>
              <input type='checkbox' checked={checklist[i]}
                onChange={e=>setChecklist(c=>c.map((v,j)=>j===i?e.target.checked:v))}
                style={{ marginTop:1, flexShrink:0 }} />
              <span style={{ fontSize:11, color:checklist[i]?T.green:T.textSec }}>{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── EPC / STRANDED ASSETS TAB ─────────────────────────────────────────────────
const StrandedAssetsTab = () => {
  const [meesScenario, setMeesScenario] = useState(0);
  const [haircuts, setHaircuts] = useState({ ...DEFAULT_HAIRCUTS });
  const [selectedYear, setSelectedYear] = useState(2030);
  const [retrofitAssumption, setRetrofitAssumption] = useState(false);

  const meesStrandedBands = [
    ['G'],
    ['F','G'],
    ['E','F','G'],
    [],
  ];

  const strandedBands = meesStrandedBands[meesScenario];

  const bookTotal = useMemo(() => {
    let t = 0;
    EPC_BANDS.forEach(b=>{
      const e = EPC_BASE[b];
      t += e.resi + e.btl + e.cre + e.ind;
    });
    return t;
  }, []);

  const strandedValue = useMemo(() => {
    let val = 0;
    strandedBands.forEach(band => {
      const e = EPC_BASE[band];
      const total = e.resi + e.btl + e.cre + e.ind;
      const hc = haircuts[band] / 100;
      let strandedAmt = total * hc;
      if (retrofitAssumption && (band === 'D' || band === 'E')) {
        strandedAmt *= 0.7;
      }
      val += strandedAmt;
    });
    return val;
  }, [strandedBands, haircuts, retrofitAssumption]);

  const haircut_risk = useMemo(() => {
    let total = 0;
    EPC_BANDS.forEach(band => {
      const e = EPC_BASE[band];
      const t = e.resi + e.btl + e.cre + e.ind;
      total += t * (haircuts[band] / 100);
    });
    return total;
  }, [haircuts]);

  const timelinePoint = STRANDED_TIMELINE.find(t=>t.year===selectedYear) || STRANDED_TIMELINE[3];

  const epcBarData = EPC_BANDS.map(band => {
    const e = EPC_BASE[band];
    return {
      band,
      Residential: e.resi,
      'Buy-to-let': e.btl,
      'Commercial RE': e.cre,
      Industrial: e.ind,
      stranded: strandedBands.includes(band),
    };
  });

  return (
    <div>
      {/* Controls */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:16, alignItems:'flex-end' }}>
        <div>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:6 }}>MEES Scenario</div>
          <div style={{ display:'flex', gap:8 }}>
            {MEES_SCENARIOS.map((s,i)=>(
              <button key={s} onClick={()=>setMeesScenario(i)}
                style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`,
                  background:meesScenario===i?T.navy:T.surface,
                  color:meesScenario===i?'#fff':T.text, fontSize:11, cursor:'pointer', fontWeight:500 }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <label style={{ fontSize:12, color:T.textSec, display:'flex', alignItems:'center', gap:6, cursor:'pointer', marginLeft:'auto' }}>
          <input type='checkbox' checked={retrofitAssumption} onChange={e=>setRetrofitAssumption(e.target.checked)} />
          Assume 30% of EPC D-G retrofit by 2028
        </label>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <Stat label='Total Mortgage Book' value='£42.0bn' sub='7 EPC bands × 4 property types' />
        <Stat label='Stranded (MEES scenario)' value={`£${strandedValue.toFixed(0)}m`} color={T.red}
          sub={strandedBands.length ? `EPC ${strandedBands.join('+')} stranded` : 'No stranding under current law'} />
        <Stat label='LGD Haircut at Risk' value={`£${haircut_risk.toFixed(0)}m`} color={T.amber} />
        <Stat label='Retrofit cost est. (E→C)' value='£18k-£35k' sub='Per property average' />
      </div>

      {/* LGD haircut editor */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:14, marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:10 }}>LGD Haircut Editor — Custom % per EPC Band</div>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          {EPC_BANDS.map(band=>(
            <div key={band} style={{ minWidth:90 }}>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:3 }}>EPC {band}: {haircuts[band]}%</div>
              <input type='range' min={0} max={50} value={haircuts[band]}
                onChange={e=>setHaircuts(h=>({...h,[band]:+e.target.value}))}
                style={{ width:'100%' }} />
            </div>
          ))}
        </div>
      </div>

      {/* EPC distribution chart */}
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:14, marginBottom:14 }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:8 }}>EPC Distribution — £42bn Book (£M)</div>
          <ResponsiveContainer width='100%' height={200}>
            <BarChart data={epcBarData} margin={{top:4,right:4,left:0,bottom:4}}>
              <XAxis dataKey='band' tick={{fontSize:11}} />
              <YAxis tick={{fontSize:10}} />
              <Tooltip formatter={v=>`£${v}m`} />
              <Bar dataKey='Residential' stackId='a' fill={T.sage} />
              <Bar dataKey='Buy-to-let' stackId='a' fill={T.navyL} />
              <Bar dataKey='Commercial RE' stackId='a' fill={T.gold} />
              <Bar dataKey='Industrial' stackId='a' fill={T.amber} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', gap:12, marginTop:6, flexWrap:'wrap' }}>
            {[['Residential',T.sage],['Buy-to-let',T.navyL],['Commercial RE',T.gold],['Industrial',T.amber]].map(([l,c])=>(
              <div key={l} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:T.textSec }}>
                <div style={{ width:10, height:10, borderRadius:2, background:c }} />{l}
              </div>
            ))}
          </div>
        </div>

        {/* Stranded asset timeline */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:6 }}>Stranded Asset Timeline</div>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>Year: {selectedYear}</div>
          <input type='range' min={2024} max={2050} step={1} value={selectedYear}
            onChange={e=>setSelectedYear(+e.target.value)} style={{ width:'100%', marginBottom:8 }} />
          <div style={{ fontSize:18, fontWeight:700, color:T.red, marginBottom:4 }}>
            £{timelinePoint?.value}bn cumulative
          </div>
          <div style={{ fontSize:11, color:T.textSec, marginBottom:10 }}>
            {strandedBands.length ? `EPC ${strandedBands.join(', ')} bands stranded` : 'No bands stranded'}
            {retrofitAssumption ? ' — 30% retrofit applied' : ''}
          </div>
          <ResponsiveContainer width='100%' height={110}>
            <AreaChart data={STRANDED_TIMELINE}>
              <XAxis dataKey='year' tick={{fontSize:9}} />
              <YAxis tick={{fontSize:9}} />
              <Tooltip formatter={v=>`£${v}bn`} />
              <Area type='monotone' dataKey='value' stroke={T.red} fill={`${T.red}22`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CRE properties */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, overflow:'hidden' }}>
        <div style={{ padding:'10px 14px', borderBottom:`1px solid ${T.border}` }}>
          <span style={{ fontSize:12, fontWeight:700, color:T.navy }}>Commercial RE — 20 Properties — Climate Risk Detail</span>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr style={{ background:T.navy }}>
              {['Property','EPC','Flood Zone','Climate Risk Score','Est. Value £M','Value Impact'].map(h=>(
                <th key={h} style={{ padding:'8px 10px', color:'#fff', textAlign:'left', fontWeight:600, fontSize:11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CRE_PROPERTIES.map((p,i)=>{
              const hc = haircuts[p.epc] || 0;
              const impact = -(p.value * hc / 100).toFixed(1);
              return (
                <tr key={p.name} style={{ background:i%2===0?T.surface:T.bg }}>
                  <td style={{ padding:'7px 10px', fontWeight:500, color:T.navy }}>{p.name}</td>
                  <td style={{ padding:'7px 10px' }}>
                    <span style={{ padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:700,
                      background:['A','B'].includes(p.epc)?'#dcfce7':['C','D'].includes(p.epc)?'#fef9c3':['E','F'].includes(p.epc)?'#fed7aa':'#fee2e2',
                      color:['A','B'].includes(p.epc)?T.green:['C','D'].includes(p.epc)?T.amber:'#c2410c' }}>
                      {p.epc}
                    </span>
                  </td>
                  <td style={{ padding:'7px 10px', color:p.flood==='High'?T.red:p.flood==='Med'?T.amber:T.green }}>{p.flood}</td>
                  <td style={{ padding:'7px 10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ flex:1, height:6, background:T.bg, borderRadius:3, overflow:'hidden', minWidth:60 }}>
                        <div style={{ width:`${p.risk*10}%`, height:'100%', background:p.risk>7?T.red:p.risk>4?T.amber:T.green, borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:10, fontWeight:700, color:p.risk>7?T.red:p.risk>4?T.amber:T.green }}>{p.risk}</span>
                    </div>
                  </td>
                  <td style={{ padding:'7px 10px', color:T.textSec }}>£{p.value}m</td>
                  <td style={{ padding:'7px 10px', fontWeight:600, color:hc>0?T.red:T.green }}>
                    {hc > 0 ? `-£${Math.abs(impact)}m` : 'No haircut'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
const ClimateCreditRiskPage = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    'Physical Risk Heat Map',
    'Transition Risk & Carbon Price',
    'IFRS 9 Climate Overlay',
    'Stranded Assets & EPC',
  ];

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, padding:'24px' }}>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:700, color:T.navy, marginBottom:4 }}>
          Climate Credit Risk Analytics
        </div>
        <div style={{ fontSize:13, color:T.textSec }}>
          Physical & transition risk overlays · IFRS 9 climate-adjusted ECL · Stranded asset modelling · £42bn mortgage book
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <Stat label='Total Borrowers' value='54' sub='Physical risk heat map' />
        <Stat label='Transition Risk Book' value='30' sub='High-carbon borrowers' />
        <Stat label='Mortgage Book' value='£42bn' sub='7 EPC × 4 property types' />
        <Stat label='Physical Risk Types' value='8' sub='Flood to Permafrost' />
        <Stat label='IFRS 9 Scenarios' value='4' sub='Net Zero to Hot House' />
        <Stat label='UK ETS (2025)' value='£41.84/t' color={T.amber} sub='Civil penalty benchmark' />
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, background:T.surface, border:`1px solid ${T.border}`,
        borderRadius:8, padding:4, marginBottom:20, width:'fit-content' }}>
        {tabs.map((t,i)=>(
          <Tab key={t} label={t} active={activeTab===i} onClick={()=>setActiveTab(i)} />
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 0 && <PhysicalRiskTab />}
        {activeTab === 1 && <TransitionRiskTab />}
        {activeTab === 2 && <IFRS9Tab />}
        {activeTab === 3 && <StrandedAssetsTab />}
      </div>
    </div>
  );
};

export default ClimateCreditRiskPage;
