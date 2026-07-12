import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, Cell, LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

// ═══════════════════════════════════════════════════════════════════════════════
//  CLIMATE-ADJUSTED COLLATERAL FRAMEWORK  (EP-AJ7)
//  Climate risk factor integration into the collateral framework of a lending
//  institution — physical & transition overlays on the collateral register,
//  climate-adjusted haircuts & LTV, LGD/ECL/RWA impact, regulatory mapping
//  (ECB Guide E8.4 · EBA GL/2020/06 §7 · CRR Art.208/229 · CRR3 · BCBS 2022),
//  and a governance / implementation blueprint.
// ═══════════════════════════════════════════════════════════════════════════════

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

// ── HAZARD TAXONOMY ───────────────────────────────────────────────────────────
const HAZARDS = ['River Flood','Coastal Flood','Wildfire','Cyclone/Storm','Heat Stress','Drought','Subsidence'];
const HAZARD_W = [0.20, 0.18, 0.12, 0.15, 0.13, 0.12, 0.10];

// ── COLLATERAL CLASS PARAMETERS ───────────────────────────────────────────────
// base    = base prudential haircut % (pre-climate, liquidity & fire-sale discount)
// recovery= workout recovery efficiency on adjusted collateral value
// rwSec   = SA risk weight % on secured portion | rwUnsec = unsecured portion
// pd      = portfolio-average PD % of obligors pledging this class
const CLASSES = {
  'Residential RE': { base:10, recovery:0.80, rwSec:35,  rwUnsec:75,  pd:0.9, color:'#5a8a6a' },
  'Commercial RE':  { base:15, recovery:0.75, rwSec:60,  rwUnsec:100, pd:1.6, color:'#2c5a8c' },
  'Agricultural':   { base:20, recovery:0.70, rwSec:60,  rwUnsec:100, pd:1.8, color:'#b45309' },
  'Industrial RE':  { base:20, recovery:0.70, rwSec:60,  rwUnsec:100, pd:2.1, color:'#7c3aed' },
  'Vessels':        { base:25, recovery:0.65, rwSec:80,  rwUnsec:100, pd:2.6, color:'#0e7490' },
  'Aircraft':       { base:25, recovery:0.65, rwSec:80,  rwUnsec:100, pd:2.4, color:'#be185d' },
  'Inventory':      { base:30, recovery:0.55, rwSec:100, rwUnsec:100, pd:2.9, color:'#a16207' },
  'Financial':      { base:8,  recovery:0.95, rwSec:20,  rwUnsec:100, pd:0.7, color:'#4338ca' },
  'Guarantees':     { base:5,  recovery:0.90, rwSec:20,  rwUnsec:100, pd:1.1, color:'#374151' },
};
const CLASS_NAMES = Object.keys(CLASSES);

// ── COLLATERAL REGISTER (60 items) ────────────────────────────────────────────
// hz = [River Flood, Coastal Flood, Wildfire, Cyclone, Heat, Drought, Subsidence] 1-5
// ins = insured share of physical damage · retreat = insurer-retreat exposure
// valAge = months since last full revaluation · epc / cii / acAge / cInt per class
const COLLATERAL = [
  // Residential real estate pools
  { id:1,  name:'RRE Pool — Thames Gateway (UK)',      cls:'Residential RE', country:'UK',  value:420, loan:336, epc:'D', hz:[4,4,1,2,2,1,2], ins:0.92, retreat:true,  valAge:8  },
  { id:2,  name:'RRE Pool — Somerset Levels (UK)',     cls:'Residential RE', country:'UK',  value:180, loan:144, epc:'E', hz:[5,2,1,2,2,1,1], ins:0.88, retreat:true,  valAge:14 },
  { id:3,  name:'RRE Pool — Rhine Valley (DE)',        cls:'Residential RE', country:'DE',  value:350, loan:262, epc:'C', hz:[5,1,1,2,2,1,1], ins:0.90, retreat:true,  valAge:6  },
  { id:4,  name:'RRE Pool — Amsterdam Canal Belt (NL)',cls:'Residential RE', country:'NL',  value:310, loan:248, epc:'C', hz:[3,4,1,2,1,1,3], ins:0.95, retreat:false, valAge:10 },
  { id:5,  name:'RRE Pool — Andalusian Coast (ES)',    cls:'Residential RE', country:'ES',  value:240, loan:168, epc:'D', hz:[1,3,4,2,5,4,1], ins:0.78, retreat:true,  valAge:22 },
  { id:6,  name:'RRE Pool — Provence (FR)',            cls:'Residential RE', country:'FR',  value:200, loan:150, epc:'D', hz:[2,1,5,2,4,4,2], ins:0.82, retreat:true,  valAge:18 },
  { id:7,  name:'RRE Pool — Munich Suburbs (DE)',      cls:'Residential RE', country:'DE',  value:380, loan:266, epc:'B', hz:[2,1,1,3,2,1,1], ins:0.94, retreat:false, valAge:5  },
  { id:8,  name:'RRE Pool — Stockholm Archipelago (SE)',cls:'Residential RE',country:'SE',  value:160, loan:112, epc:'B', hz:[2,3,1,2,1,1,1], ins:0.93, retreat:false, valAge:9  },
  { id:9,  name:'RRE Pool — Po Valley (IT)',           cls:'Residential RE', country:'IT',  value:210, loan:158, epc:'E', hz:[4,1,1,1,4,3,2], ins:0.80, retreat:false, valAge:26 },
  { id:10, name:'RRE Pool — Miami Beach (US)',         cls:'Residential RE', country:'US',  value:150, loan:120, epc:'C', hz:[2,5,1,5,4,1,1], ins:0.70, retreat:true,  valAge:12 },
  // Commercial real estate
  { id:11, name:'City of London Office Tower',         cls:'Commercial RE',  country:'UK',  value:480, loan:336, epc:'C', hz:[2,3,1,2,3,1,2], ins:0.96, retreat:false, valAge:7  },
  { id:12, name:'Canary Wharf Office (EPC E)',         cls:'Commercial RE',  country:'UK',  value:320, loan:256, epc:'E', hz:[3,4,1,2,3,1,1], ins:0.95, retreat:false, valAge:15 },
  { id:13, name:'Rotterdam Logistics Park',            cls:'Commercial RE',  country:'NL',  value:260, loan:182, epc:'B', hz:[4,5,1,3,1,1,2], ins:0.93, retreat:true,  valAge:6  },
  { id:14, name:'Hamburg Port Warehouses',             cls:'Commercial RE',  country:'DE',  value:190, loan:142, epc:'D', hz:[4,5,1,4,1,1,1], ins:0.90, retreat:true,  valAge:11 },
  { id:15, name:'Costa del Sol Resort Hotel',          cls:'Commercial RE',  country:'ES',  value:140, loan:112, epc:'D', hz:[1,4,3,2,5,4,1], ins:0.72, retreat:true,  valAge:20 },
  { id:16, name:'Alpine Ski Resort (Tyrol)',           cls:'Commercial RE',  country:'AT',  value:110, loan:82,  epc:'C', hz:[2,1,2,3,4,2,3], ins:0.85, retreat:false, valAge:16 },
  { id:17, name:'Paris La Défense Office',             cls:'Commercial RE',  country:'FR',  value:400, loan:280, epc:'C', hz:[2,1,1,2,4,2,3], ins:0.95, retreat:false, valAge:8  },
  { id:18, name:'Venice Boutique Hotel',               cls:'Commercial RE',  country:'IT',  value:60,  loan:48,  epc:'F', hz:[3,5,1,2,3,1,4], ins:0.65, retreat:true,  valAge:24 },
  { id:19, name:'Madrid Retail Mall',                  cls:'Commercial RE',  country:'ES',  value:180, loan:126, epc:'D', hz:[1,1,2,1,5,4,2], ins:0.88, retreat:false, valAge:13 },
  { id:20, name:'Frankfurt Data Centre',               cls:'Commercial RE',  country:'DE',  value:350, loan:245, epc:'B', hz:[3,1,1,2,4,2,1], ins:0.97, retreat:false, valAge:4  },
  { id:21, name:'Warsaw Office Campus',                cls:'Commercial RE',  country:'PL',  value:170, loan:119, epc:'C', hz:[2,1,1,2,2,2,1], ins:0.91, retreat:false, valAge:9  },
  { id:22, name:'Athens Mixed-Use Complex',            cls:'Commercial RE',  country:'GR',  value:95,  loan:76,  epc:'E', hz:[1,2,5,1,5,4,1], ins:0.70, retreat:true,  valAge:28 },
  { id:23, name:'Copenhagen Harbour Offices',          cls:'Commercial RE',  country:'DK',  value:280, loan:182, epc:'A', hz:[2,4,1,3,1,1,1], ins:0.95, retreat:false, valAge:6  },
  // Agricultural land & estates
  { id:24, name:'East Anglia Arable Estate',           cls:'Agricultural',   country:'UK',  value:85,  loan:59,  epc:null, hz:[3,2,1,2,3,4,3], ins:0.75, retreat:false, valAge:18 },
  { id:25, name:'Andalusia Olive Groves',              cls:'Agricultural',   country:'ES',  value:60,  loan:45,  epc:null, hz:[1,1,4,1,5,5,1], ins:0.60, retreat:true,  valAge:30 },
  { id:26, name:'Loire Valley Vineyards',              cls:'Agricultural',   country:'FR',  value:75,  loan:49,  epc:null, hz:[3,1,3,2,4,3,1], ins:0.70, retreat:false, valAge:21 },
  { id:27, name:'Bavarian Dairy Farms',                cls:'Agricultural',   country:'DE',  value:55,  loan:39,  epc:null, hz:[3,1,1,2,2,2,1], ins:0.82, retreat:false, valAge:12 },
  { id:28, name:'Murray-Darling Cotton (AU)',          cls:'Agricultural',   country:'AU',  value:70,  loan:56,  epc:null, hz:[3,1,4,2,5,5,1], ins:0.55, retreat:true,  valAge:25 },
  { id:29, name:'Danish Pig Farming Estate',           cls:'Agricultural',   country:'DK',  value:65,  loan:46,  epc:null, hz:[3,2,1,3,1,1,1], ins:0.85, retreat:false, valAge:10 },
  // Industrial real estate
  { id:30, name:'Ruhr Steel Works Site',               cls:'Industrial RE',  country:'DE',  value:220, loan:176, epc:'F', hz:[4,1,1,2,3,2,2], ins:0.80, retreat:false, valAge:19 },
  { id:31, name:'Antwerp Chemical Plant',              cls:'Industrial RE',  country:'BE',  value:260, loan:208, epc:'E', hz:[4,4,1,3,2,1,1], ins:0.85, retreat:true,  valAge:14 },
  { id:32, name:'Silesia Manufacturing Park',          cls:'Industrial RE',  country:'PL',  value:130, loan:104, epc:'E', hz:[2,1,1,2,2,2,3], ins:0.82, retreat:false, valAge:17 },
  { id:33, name:'Basque Auto Components Plant',        cls:'Industrial RE',  country:'ES',  value:150, loan:113, epc:'D', hz:[3,1,2,2,3,2,1], ins:0.88, retreat:false, valAge:11 },
  { id:34, name:'Teesside Process Plant',              cls:'Industrial RE',  country:'UK',  value:175, loan:140, epc:'F', hz:[3,4,1,3,1,1,1], ins:0.78, retreat:true,  valAge:23 },
  { id:35, name:'Lyon Pharma Campus',                  cls:'Industrial RE',  country:'FR',  value:210, loan:147, epc:'B', hz:[3,1,1,1,4,2,1], ins:0.95, retreat:false, valAge:5  },
  { id:36, name:'Gothenburg Battery Gigafactory',      cls:'Industrial RE',  country:'SE',  value:290, loan:203, epc:'A', hz:[2,2,1,2,1,1,1], ins:0.96, retreat:false, valAge:3  },
  // Vessels (IMO CII rating A–E)
  { id:37, name:'Capesize Bulk Carriers (×2)',         cls:'Vessels',        country:'GR',  value:80,  loan:64,  cii:'D', hz:[1,2,1,4,2,1,1], ins:0.90, retreat:false, valAge:9  },
  { id:38, name:'Aframax Crude Tanker',                cls:'Vessels',        country:'CY',  value:65,  loan:55,  cii:'E', hz:[1,2,1,4,2,1,1], ins:0.88, retreat:false, valAge:13 },
  { id:39, name:'Container Feeder Fleet (×4)',         cls:'Vessels',        country:'DE',  value:95,  loan:71,  cii:'C', hz:[1,2,1,4,1,1,1], ins:0.92, retreat:false, valAge:7  },
  { id:40, name:'LNG Carrier (174k m³)',               cls:'Vessels',        country:'NO',  value:160, loan:112, cii:'B', hz:[1,2,1,4,1,1,1], ins:0.95, retreat:false, valAge:6  },
  { id:41, name:'Ro-Pax Ferry (Baltic)',               cls:'Vessels',        country:'FI',  value:55,  loan:44,  cii:'D', hz:[1,3,1,4,1,1,1], ins:0.90, retreat:false, valAge:15 },
  { id:42, name:'Offshore Supply Vessels (×3)',        cls:'Vessels',        country:'UK',  value:45,  loan:38,  cii:'E', hz:[1,3,1,5,1,1,1], ins:0.85, retreat:true,  valAge:20 },
  // Aircraft
  { id:43, name:'A320ceo Fleet (×6)',                  cls:'Aircraft',       country:'IE',  value:120, loan:102, acAge:17, hz:[1,1,1,2,3,1,1], ins:0.92, retreat:false, valAge:12 },
  { id:44, name:'B777-300ER (×2)',                     cls:'Aircraft',       country:'AE',  value:110, loan:88,  acAge:12, hz:[1,1,1,2,4,1,1], ins:0.93, retreat:false, valAge:9  },
  { id:45, name:'A350-900 (new delivery)',             cls:'Aircraft',       country:'FR',  value:140, loan:98,  acAge:4,  hz:[1,1,1,2,2,1,1], ins:0.95, retreat:false, valAge:6  },
  { id:46, name:'B737 Freighter Conversions (×3)',     cls:'Aircraft',       country:'US',  value:60,  loan:54,  acAge:21, hz:[1,1,1,3,3,1,1], ins:0.88, retreat:false, valAge:16 },
  // Inventory & commodities (cInt = carbon cost sensitivity index)
  { id:47, name:'Steel Coil Inventory (Duisburg)',     cls:'Inventory',      country:'DE',  value:70,  loan:56,  cInt:32, hz:[3,1,1,1,1,1,1], ins:0.90, retreat:false, valAge:3  },
  { id:48, name:'Aluminium Stock (Rotterdam)',         cls:'Inventory',      country:'NL',  value:55,  loan:44,  cInt:28, hz:[3,4,1,2,1,1,1], ins:0.90, retreat:true,  valAge:2  },
  { id:49, name:'Grain Silos (Danube Basin)',          cls:'Inventory',      country:'RO',  value:40,  loan:34,  cInt:8,  hz:[2,1,1,1,3,4,1], ins:0.60, retreat:false, valAge:4  },
  { id:50, name:'Cement Clinker Stockpile',            cls:'Inventory',      country:'PL',  value:35,  loan:29,  cInt:38, hz:[1,1,1,1,2,1,1], ins:0.85, retreat:false, valAge:3  },
  { id:51, name:'Auto Parts Inventory (ICE drivetrain)',cls:'Inventory',     country:'CZ',  value:45,  loan:38,  cInt:22, hz:[2,1,1,1,1,1,1], ins:0.92, retreat:false, valAge:2  },
  // Financial collateral (transition wrong-way risk via issuer carbon intensity)
  { id:52, name:'Equity Pledge — Coal Utility (PL)',   cls:'Financial',      country:'PL',  value:90,  loan:76,  cInt:30, hz:[1,1,1,1,1,1,1], ins:1.00, retreat:false, valAge:1  },
  { id:53, name:'Bond Portfolio — IG Corporates',      cls:'Financial',      country:'LU',  value:150, loan:105, cInt:6,  hz:[1,1,1,1,1,1,1], ins:1.00, retreat:false, valAge:1  },
  { id:54, name:'Cash Deposit Pledge',                 cls:'Financial',      country:'UK',  value:60,  loan:42,  cInt:0,  hz:[1,1,1,1,1,1,1], ins:1.00, retreat:false, valAge:0  },
  { id:55, name:'Gold Bullion (allocated)',            cls:'Financial',      country:'CH',  value:45,  loan:27,  cInt:0,  hz:[1,1,1,1,1,1,1], ins:1.00, retreat:false, valAge:1  },
  { id:56, name:'Equity Pledge — O&G Major',           cls:'Financial',      country:'UK',  value:80,  loan:64,  cInt:24, hz:[1,1,1,1,1,1,1], ins:1.00, retreat:false, valAge:1  },
  // Guarantees (substitution approach — guarantor transition sensitivity)
  { id:57, name:'Parent Guarantee — Cement Group',     cls:'Guarantees',     country:'DE',  value:130, loan:117, cInt:20, hz:[1,1,1,1,1,1,1], ins:1.00, retreat:false, valAge:6  },
  { id:58, name:'ECA Guarantee — Shipyard Facility',   cls:'Guarantees',     country:'KR',  value:100, loan:85,  cInt:4,  hz:[1,1,1,1,1,1,1], ins:1.00, retreat:false, valAge:12 },
  { id:59, name:'Sovereign Guarantee — Infra Loan',    cls:'Guarantees',     country:'IT',  value:200, loan:160, cInt:2,  hz:[1,1,1,1,1,1,1], ins:1.00, retreat:false, valAge:8  },
  { id:60, name:'Insurance Wrap — Renewables SPV',     cls:'Guarantees',     country:'ES',  value:90,  loan:72,  cInt:0,  hz:[1,1,1,1,1,1,1], ins:1.00, retreat:false, valAge:4  },
];

// ── SCENARIO SET (NGFS-aligned) ───────────────────────────────────────────────
// phys  = physical hazard intensity multiplier by horizon
// trans = transition stringency multiplier by horizon
// carbon= carbon price €/tCO₂e by horizon
const SCENARIOS = {
  'Orderly — Net Zero 2050': {
    phys:{2030:1.05, 2040:1.12, 2050:1.18}, trans:{2030:1.00, 2040:1.10, 2050:1.15},
    carbon:{2030:130, 2040:210, 2050:250},
    desc:'Early, coordinated policy. Transition costs bite now but physical damages stay contained. EPC/MEES rules enforced on schedule; carbon price rises smoothly.',
  },
  'Disorderly — Delayed Transition': {
    phys:{2030:1.05, 2040:1.22, 2050:1.35}, trans:{2030:0.55, 2040:1.45, 2050:1.30},
    carbon:{2030:45, 2040:270, 2050:300},
    desc:'Policy inaction until 2030 then an abrupt correction. Sudden repricing of energy-inefficient and carbon-intensive collateral; fire-sale dynamics in stranded segments.',
  },
  'Hot House — Current Policies': {
    phys:{2030:1.12, 2040:1.45, 2050:1.95}, trans:{2030:0.35, 2040:0.40, 2050:0.45},
    carbon:{2030:35, 2040:45, 2050:55},
    desc:'No further policy. Transition add-ons stay muted but chronic and acute physical hazards escalate sharply — insurance retreat accelerates and uninsured damage dominates.',
  },
};
const SCENARIO_NAMES = Object.keys(SCENARIOS);
const HORIZONS = [2030, 2040, 2050];

// ── TRANSITION PARAMETER TABLES ───────────────────────────────────────────────
const EPC_BANDS = ['A','B','C','D','E','F','G'];
const MEES_SCENARIOS = {
  'Current Law (EPC E floor)':      { A:0, B:0, C:1, D:3,  E:6,  F:18, G:26 },
  'EPC C by 2028 (Proposed)':       { A:0, B:0, C:2, D:8,  E:15, F:24, G:32 },
  'EPC B by 2030 (Ambitious)':      { A:0, B:2, C:6, D:12, E:20, F:28, G:36 },
  'No Tightening':                  { A:0, B:0, C:0, D:2,  E:4,  F:10, G:15 },
};
const CII_ADDON  = { A:0, B:2, C:5, D:12, E:22 };  // IMO CII rating → charter-value haircut add-on %
const AC_AGE_ADDON = age => (age > 15 ? 14 : age > 10 ? 8 : age > 5 ? 4 : 1); // ICAO CO₂ std proxy

// ── CORE CALCULATION ENGINE (shared across tabs) ──────────────────────────────
const physComposite = it =>
  HAZARDS.reduce((acc, _, i) => acc + it.hz[i] * HAZARD_W[i], 0) / 5; // 0.2 … 1.0

const insEffective = (it, horizon, retreatYear) =>
  (it.retreat && horizon >= retreatYear) ? it.ins * 0.35 : it.ins;

// Expected physical damage as % of collateral value (convex damage function,
// scenario-scaled, net of effective insurance recovery)
const physAddonPct = (it, scen, horizon, retreatYear) => {
  const raw = Math.max(0, physComposite(it) - 0.2) / 0.8;        // normalise: all-1 scores → 0
  const grossDmg = raw * raw * 55;                                // convex, max 55% of value
  const mult = SCENARIOS[scen].phys[horizon];
  const uninsured = 1 - insEffective(it, horizon, retreatYear) * 0.9;
  return grossDmg * mult * uninsured;
};

// Transition add-on % of value: EPC/MEES (property), CII (vessels),
// engine-age (aircraft), carbon-cost sensitivity (inventory/financial/guarantees)
const transAddonPct = (it, scen, horizon, mees, carbonOverride) => {
  const tf = SCENARIOS[scen].trans[horizon];
  const cp = carbonOverride != null ? carbonOverride : SCENARIOS[scen].carbon[horizon];
  let a = 0;
  if (it.epc)          a += MEES_SCENARIOS[mees][it.epc];
  if (it.cii)          a += CII_ADDON[it.cii];
  if (it.acAge != null) a += AC_AGE_ADDON(it.acAge);
  if (it.cInt)         a += Math.min(18, (it.cInt * cp) / 400);
  return a * tf;
};

const staleAddonPct = it => (it.valAge > 36 ? 4 : it.valAge > 24 ? 2.5 : it.valAge > 12 ? 1 : 0);

const haircutBreakdown = (it, cfg) => {
  const base  = CLASSES[it.cls].base;
  const phys  = physAddonPct(it, cfg.scen, cfg.horizon, cfg.retreatYear);
  const trans = transAddonPct(it, cfg.scen, cfg.horizon, cfg.mees, cfg.carbonOverride);
  const stale = cfg.staleness ? staleAddonPct(it) : 0;
  const total = Math.min(90, base + phys + trans + stale);
  const adjValue = it.value * (1 - total / 100);
  return {
    base, phys, trans, stale, total, adjValue,
    ltvPre:  (it.loan / it.value) * 100,
    ltvPost: (it.loan / adjValue) * 100,
    unsecured: Math.max(0, it.loan - adjValue),
  };
};

const lgdFor = (it, adjValue) => {
  const { recovery } = CLASSES[it.cls];
  const coverage = Math.min(1, adjValue / it.loan);
  return Math.min(0.95, Math.max(0.05, 1 - recovery * coverage));
};

const DEFAULT_CFG = {
  scen:'Disorderly — Delayed Transition', horizon:2040,
  mees:'Current Law (EPC E floor)', retreatYear:2035,
  carbonOverride:null, staleness:true,
};

const fmtM  = v => `€${v >= 1000 ? (v/1000).toFixed(2) + 'bn' : v.toFixed(0) + 'm'}`;
const fmtP  = v => `${v.toFixed(1)}%`;
const hzColor = v => (v >= 5 ? '#dc2626' : v === 4 ? '#ea580c' : v === 3 ? '#d97706' : v === 2 ? '#65a30d' : '#5a8a6a');
const statusColor = s => (s === 'Met' ? T.green : s === 'Partial' ? T.amber : T.red);

// ── SHARED UI ATOMS ───────────────────────────────────────────────────────────
const Stat = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8,
    padding:'14px 18px', boxShadow:T.card, minWidth:140 }}>
    <div style={{ fontSize:11, color:T.textMut, fontWeight:600, textTransform:'uppercase',
      letterSpacing:'0.06em', marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:color||T.navy, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>{sub}</div>}
  </div>
);

const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding:'8px 14px', borderRadius:6, border:'none', cursor:'pointer',
    fontFamily:T.font, fontSize:12.5, fontWeight:600,
    background:active ? T.navy : 'transparent',
    color:active ? '#fff' : T.textSec, transition:'all 0.15s' }}>
    {label}
  </button>
);

const Card = ({ title, sub, children, style }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10,
    padding:18, boxShadow:T.card, ...style }}>
    {title && <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom: sub ? 2 : 12 }}>{title}</div>}
    {sub && <div style={{ fontSize:11.5, color:T.textSec, marginBottom:12 }}>{sub}</div>}
    {children}
  </div>
);

const Pill = ({ text, color }) => (
  <span style={{ display:'inline-block', padding:'2px 9px', borderRadius:20, fontSize:10.5, fontWeight:700,
    color:'#fff', background:color }}>{text}</span>
);

const Select = ({ label, value, onChange, options, width }) => (
  <div>
    <div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>{label}</div>
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ padding:'5px 8px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:12,
        background:T.surface, color:T.text, width: width || 'auto', fontFamily:T.font }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const Slider = ({ label, min, max, step, value, onChange, width }) => (
  <div>
    <div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>{label}</div>
    <input type='range' min={min} max={max} step={step||1} value={value}
      onChange={e => onChange(+e.target.value)} style={{ width: width || 130 }} />
  </div>
);

const th = { textAlign:'left', padding:'7px 10px', fontSize:10.5, color:T.textMut, fontWeight:700,
  textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:`2px solid ${T.border}`, whiteSpace:'nowrap' };
const td = { padding:'7px 10px', fontSize:12, color:T.text, borderBottom:`1px solid ${T.border}` };

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 1 — COLLATERAL REGISTER
// ═══════════════════════════════════════════════════════════════════════════════
const RegisterTab = () => {
  const [clsFilter, setClsFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('value');
  const [selected, setSelected] = useState(null);

  const countries = useMemo(() => ['All', ...new Set(COLLATERAL.map(c => c.country))].sort(), []);

  const rows = useMemo(() => COLLATERAL
    .map(it => ({ ...it, score: physComposite(it) * 100, hc: haircutBreakdown(it, DEFAULT_CFG) }))
    .filter(it => {
      if (clsFilter !== 'All' && it.cls !== clsFilter) return false;
      if (countryFilter !== 'All' && it.country !== countryFilter) return false;
      if (it.score < minScore) return false;
      if (search && !it.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => sortBy === 'value' ? b.value - a.value
      : sortBy === 'score' ? b.score - a.score
      : sortBy === 'ltv' ? b.hc.ltvPre - a.hc.ltvPre
      : b.hc.total - a.hc.total),
    [clsFilter, countryFilter, search, minScore, sortBy]);

  const byClass = useMemo(() => CLASS_NAMES.map(cn => ({
    name: cn.replace(' RE',''),
    value: +COLLATERAL.filter(c => c.cls === cn).reduce((a, c) => a + c.value, 0).toFixed(0),
    fill: CLASSES[cn].color,
  })), []);

  const exportCsv = () => {
    const header = 'id,name,class,country,value_eur_m,loan_eur_m,ltv_pct,phys_score,epc,cii,aircraft_age,carbon_sens,insured_pct,insurer_retreat,val_age_months';
    const lines = COLLATERAL.map(it => [
      it.id, `"${it.name}"`, it.cls, it.country, it.value, it.loan,
      ((it.loan / it.value) * 100).toFixed(1), (physComposite(it) * 100).toFixed(0),
      it.epc || '', it.cii || '', it.acAge != null ? it.acAge : '', it.cInt != null ? it.cInt : '',
      (it.ins * 100).toFixed(0), it.retreat ? 'Y' : 'N', it.valAge,
    ].join(','));
    const blob = new Blob([[header, ...lines].join('\n')], { type:'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'climate_collateral_register.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
        <Card title='Collateral Book by Class' sub='Market value of pledged collateral (€m) across the 9 eligible classes'>
          <ResponsiveContainer width='100%' height={200}>
            <BarChart data={byClass} margin={{ top:5, right:10, left:0, bottom:5 }}>
              <XAxis dataKey='name' tick={{ fontSize:10, fill:T.textSec }} interval={0} />
              <YAxis tick={{ fontSize:10, fill:T.textSec }} />
              <Tooltip formatter={v => [`€${v}m`, 'Value']} contentStyle={{ fontSize:12 }} />
              <Bar dataKey='value' radius={[4,4,0,0]}>
                {byClass.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title='Register Coverage' sub='Data completeness of climate attributes'>
          {[
            ['Geolocated to hazard zone', 100],
            ['7-hazard scores assigned', 100],
            ['EPC captured (property)', 93],
            ['Insurance terms verified', 82],
            ['CII / engine data (transport)', 100],
            ['Revaluation ≤ 12 months', 58],
          ].map(([l, p]) => (
            <div key={l} style={{ marginBottom:9 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, marginBottom:3 }}>
                <span style={{ color:T.textSec }}>{l}</span>
                <span style={{ fontWeight:700, color: p >= 90 ? T.green : p >= 70 ? T.amber : T.red }}>{p}%</span>
              </div>
              <div style={{ height:6, background:T.surfaceH, borderRadius:3 }}>
                <div style={{ width:`${p}%`, height:6, borderRadius:3,
                  background: p >= 90 ? T.sage : p >= 70 ? T.gold : T.red }} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:14, alignItems:'flex-end' }}>
        <Select label='Class' value={clsFilter} onChange={setClsFilter} options={['All', ...CLASS_NAMES]} />
        <Select label='Country' value={countryFilter} onChange={setCountryFilter} options={countries} />
        <Slider label={`Min Physical Score: ${minScore}`} min={0} max={100} step={5} value={minScore} onChange={setMinScore} />
        <Select label='Sort By' value={sortBy} onChange={setSortBy} options={['value','score','ltv','haircut']} />
        <div>
          <div style={{ fontSize:11, color:T.textMut, marginBottom:3 }}>Search</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Collateral name…'
            style={{ padding:'5px 9px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:12,
              background:T.surface, color:T.text, width:170, fontFamily:T.font }} />
        </div>
        <button onClick={exportCsv} style={{ marginLeft:'auto', padding:'7px 16px', background:T.navy,
          color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>
          Export CSV
        </button>
      </div>

      <Card>
        <div style={{ overflowX:'auto' }}>
          <table style={{ borderCollapse:'collapse', width:'100%' }}>
            <thead><tr>
              <th style={th}>Collateral</th><th style={th}>Class</th><th style={th}>Ctry</th>
              <th style={th}>Value</th><th style={th}>Loan</th><th style={th}>LTV</th>
              <th style={th}>Phys Score</th><th style={th}>EPC/CII</th><th style={th}>Insured</th>
              <th style={th}>Val Age</th><th style={th}>Climate Haircut*</th>
            </tr></thead>
            <tbody>
              {rows.map(it => (
                <tr key={it.id} onClick={() => setSelected(selected?.id === it.id ? null : it)}
                  style={{ cursor:'pointer', background: selected?.id === it.id ? T.surfaceH : 'transparent' }}>
                  <td style={{ ...td, fontWeight:600 }}>{it.name}</td>
                  <td style={td}><Pill text={it.cls} color={CLASSES[it.cls].color} /></td>
                  <td style={td}>{it.country}</td>
                  <td style={td}>€{it.value}m</td>
                  <td style={td}>€{it.loan}m</td>
                  <td style={{ ...td, fontWeight:700, color: it.hc.ltvPre > 80 ? T.red : it.hc.ltvPre > 70 ? T.amber : T.green }}>
                    {it.hc.ltvPre.toFixed(0)}%
                  </td>
                  <td style={td}>
                    <span style={{ display:'inline-block', width:34, textAlign:'center', borderRadius:4,
                      fontWeight:700, fontSize:11, color:'#fff',
                      background: hzColor(Math.ceil(it.score / 20)) }}>{it.score.toFixed(0)}</span>
                  </td>
                  <td style={td}>{it.epc || it.cii || (it.acAge != null ? `${it.acAge}y` : '—')}</td>
                  <td style={td}>{(it.ins * 100).toFixed(0)}%{it.retreat ? ' ⚠' : ''}</td>
                  <td style={{ ...td, color: it.valAge > 24 ? T.red : it.valAge > 12 ? T.amber : T.textSec }}>{it.valAge}m</td>
                  <td style={{ ...td, fontWeight:700 }}>{it.hc.total.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize:10.5, color:T.textMut, marginTop:8 }}>
          * Total climate-adjusted haircut under the default calibration (Disorderly 2040, current MEES law,
          insurer retreat 2035). {rows.length} of {COLLATERAL.length} items shown — click a row for detail.
        </div>
      </Card>

      {selected && (
        <Card title={selected.name} sub={`${selected.cls} · ${selected.country} · pledged against €${selected.loan}m exposure`}
          style={{ marginTop:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:8 }}>Hazard Profile</div>
              {HAZARDS.map((h, i) => (
                <div key={h} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                  <div style={{ width:110, fontSize:11.5, color:T.textSec }}>{h}</div>
                  <div style={{ flex:1, height:8, background:T.surfaceH, borderRadius:4 }}>
                    <div style={{ width:`${selected.hz[i] * 20}%`, height:8, borderRadius:4, background:hzColor(selected.hz[i]) }} />
                  </div>
                  <div style={{ width:16, fontSize:11.5, fontWeight:700, color:hzColor(selected.hz[i]) }}>{selected.hz[i]}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:8 }}>Default-Calibration Haircut Stack</div>
              {(() => {
                const hc = haircutBreakdown(selected, DEFAULT_CFG);
                return [
                  ['Base prudential haircut', hc.base, T.navyL],
                  ['Physical risk add-on', hc.phys, T.red],
                  ['Transition risk add-on', hc.trans, T.amber],
                  ['Valuation staleness add-on', hc.stale, T.textMut],
                  ['Total haircut', hc.total, T.navy],
                ].map(([l, v, c], i) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0',
                    borderBottom: i === 3 ? `2px solid ${T.border}` : `1px solid ${T.border}`,
                    fontWeight: i === 4 ? 800 : 500 }}>
                    <span style={{ fontSize:12, color:T.textSec }}>{l}</span>
                    <span style={{ fontSize:12.5, fontWeight:700, color:c }}>{v.toFixed(1)}%</span>
                  </div>
                ));
              })()}
              <div style={{ marginTop:10, fontSize:12, color:T.textSec }}>
                Adjusted value <b style={{ color:T.navy }}>{fmtM(haircutBreakdown(selected, DEFAULT_CFG).adjValue)}</b> ·
                LTV {haircutBreakdown(selected, DEFAULT_CFG).ltvPre.toFixed(0)}% →{' '}
                <b style={{ color: haircutBreakdown(selected, DEFAULT_CFG).ltvPost > 100 ? T.red : T.amber }}>
                  {haircutBreakdown(selected, DEFAULT_CFG).ltvPost.toFixed(0)}%
                </b>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 2 — PHYSICAL RISK OVERLAY
// ═══════════════════════════════════════════════════════════════════════════════
const PhysicalTab = () => {
  const [scen, setScen] = useState('Hot House — Current Policies');
  const [horizon, setHorizon] = useState(2050);
  const [retreatYear, setRetreatYear] = useState(2035);
  const [clsFilter, setClsFilter] = useState('All');

  const items = useMemo(() => COLLATERAL.filter(it => clsFilter === 'All' || it.cls === clsFilter), [clsFilter]);

  const withDamage = useMemo(() => items.map(it => {
    const dmgPct = physAddonPct(it, scen, horizon, retreatYear);
    const grossPct = physAddonPct({ ...it, ins:0, retreat:false }, scen, horizon, retreatYear);
    return { ...it, dmgPct, expLoss: it.value * dmgPct / 100, grossLoss: it.value * grossPct / 100 };
  }).sort((a, b) => b.expLoss - a.expLoss), [items, scen, horizon, retreatYear]);

  const totalExp = withDamage.reduce((a, i) => a + i.expLoss, 0);
  const totalGross = withDamage.reduce((a, i) => a + i.grossLoss, 0);
  const insGap = withDamage.filter(i => i.retreat).reduce((a, i) => a + i.value, 0);

  const horizonSeries = useMemo(() => HORIZONS.map(h => {
    const row = { horizon: `${h}` };
    SCENARIO_NAMES.forEach(s => {
      row[s] = +COLLATERAL.reduce((a, it) => a + it.value * physAddonPct(it, s, h, retreatYear) / 100, 0).toFixed(1);
    });
    return row;
  }), [retreatYear]);

  const top15 = withDamage.slice(0, 15).map(i => ({
    name: i.name.length > 26 ? i.name.slice(0, 24) + '…' : i.name,
    net: +i.expLoss.toFixed(1),
    insured: +(i.grossLoss - i.expLoss).toFixed(1),
  }));

  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:14, alignItems:'flex-end' }}>
        <Select label='Scenario' value={scen} onChange={setScen} options={SCENARIO_NAMES} />
        <Select label='Horizon' value={String(horizon)} onChange={v => setHorizon(+v)} options={HORIZONS.map(String)} />
        <Slider label={`Insurer Retreat Year: ${retreatYear}`} min={2026} max={2050} value={retreatYear} onChange={setRetreatYear} width={150} />
        <Select label='Class' value={clsFilter} onChange={setClsFilter} options={['All', ...CLASS_NAMES]} />
        <div style={{ marginLeft:'auto', maxWidth:420, fontSize:11, color:T.textSec, fontStyle:'italic' }}>
          {SCENARIOS[scen].desc}
        </div>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <Stat label='Expected Damage (net)' value={fmtM(totalExp)} color={T.red}
          sub={`${scen.split(' — ')[0]} · ${horizon} · after insurance`} />
        <Stat label='Gross Damage (uninsured basis)' value={fmtM(totalGross)} sub='If no insurance recovery' />
        <Stat label='Insurance Absorbs' value={fmtP(totalGross > 0 ? (1 - totalExp / totalGross) * 100 : 0)} color={T.green}
          sub='Share of gross damage transferred' />
        <Stat label='Retreat-Exposed Collateral' value={fmtM(insGap)} color={T.amber}
          sub={`Insurer withdrawal modelled from ${retreatYear}`} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card title='Top 15 — Expected Collateral Damage' sub='Net expected loss vs damage absorbed by insurance (€m)'>
          <ResponsiveContainer width='100%' height={340}>
            <BarChart data={top15} layout='vertical' margin={{ top:5, right:20, left:130, bottom:5 }}>
              <XAxis type='number' tick={{ fontSize:10, fill:T.textSec }} />
              <YAxis type='category' dataKey='name' tick={{ fontSize:9.5, fill:T.textSec }} width={130} />
              <Tooltip formatter={v => [`€${v}m`]} contentStyle={{ fontSize:12 }} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey='net' name='Net expected loss' stackId='a' fill={T.red} />
              <Bar dataKey='insured' name='Insurance-absorbed' stackId='a' fill={T.sageL} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title='Book-Level Expected Damage by Horizon' sub={`All 60 items · retreat year ${retreatYear} · €m net expected loss`}>
          <ResponsiveContainer width='100%' height={340}>
            <AreaChart data={horizonSeries} margin={{ top:5, right:20, left:0, bottom:5 }}>
              <XAxis dataKey='horizon' tick={{ fontSize:11, fill:T.textSec }} />
              <YAxis tick={{ fontSize:10, fill:T.textSec }} />
              <Tooltip formatter={v => [`€${v}m`]} contentStyle={{ fontSize:12 }} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Area type='monotone' dataKey='Hot House — Current Policies' stroke={T.red} fill={T.red} fillOpacity={0.18} strokeWidth={2} />
              <Area type='monotone' dataKey='Disorderly — Delayed Transition' stroke={T.amber} fill={T.amber} fillOpacity={0.15} strokeWidth={2} />
              <Area type='monotone' dataKey='Orderly — Net Zero 2050' stroke={T.sage} fill={T.sage} fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title='Hazard × Collateral Heat Map' sub='Physical hazard scores (1 low → 5 severe) with net expected damage under the selected calibration'>
        <div style={{ overflowX:'auto', maxHeight:440, overflowY:'auto' }}>
          <table style={{ borderCollapse:'collapse', width:'100%' }}>
            <thead><tr>
              <th style={th}>Collateral</th>
              {HAZARDS.map(h => <th key={h} style={{ ...th, textAlign:'center' }}>{h.split('/')[0]}</th>)}
              <th style={th}>Insured</th><th style={th}>Exp. Loss</th><th style={th}>% of Value</th>
            </tr></thead>
            <tbody>
              {withDamage.map(it => (
                <tr key={it.id}>
                  <td style={{ ...td, fontWeight:600, whiteSpace:'nowrap' }}>{it.name}</td>
                  {it.hz.map((v, i) => (
                    <td key={i} style={{ ...td, textAlign:'center', padding:'4px' }}>
                      <span style={{ display:'inline-block', width:26, height:20, lineHeight:'20px', borderRadius:4,
                        color:'#fff', fontWeight:700, fontSize:11, background:hzColor(v) }}>{v}</span>
                    </td>
                  ))}
                  <td style={td}>{(insEffective(it, horizon, retreatYear) * 100).toFixed(0)}%{it.retreat && horizon >= retreatYear ? ' ⚠' : ''}</td>
                  <td style={{ ...td, fontWeight:700, color: it.expLoss > 20 ? T.red : T.text }}>€{it.expLoss.toFixed(1)}m</td>
                  <td style={td}>{it.dmgPct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize:10.5, color:T.textMut, marginTop:8 }}>
          ⚠ = insurer-retreat exposure crystallised at the selected horizon: effective coverage falls to 35% of the contracted
          share, reflecting non-renewal in high-hazard zones (the dominant driver of the physical haircut add-on).
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 3 — TRANSITION RISK OVERLAY
// ═══════════════════════════════════════════════════════════════════════════════
const TransitionTab = () => {
  const [mees, setMees] = useState('EPC C by 2028 (Proposed)');
  const [scen, setScen] = useState('Disorderly — Delayed Transition');
  const [horizon, setHorizon] = useState(2040);
  const [carbon, setCarbon] = useState(SCENARIOS['Disorderly — Delayed Transition'].carbon[2040]);

  const property = useMemo(() => COLLATERAL.filter(c => c.epc), []);
  const vessels  = useMemo(() => COLLATERAL.filter(c => c.cii), []);
  const aircraft = useMemo(() => COLLATERAL.filter(c => c.acAge != null), []);
  const carbonSens = useMemo(() => COLLATERAL.filter(c => c.cInt), []);

  const epcDist = useMemo(() => EPC_BANDS.map(b => ({
    band: b,
    value: +property.filter(p => p.epc === b).reduce((a, p) => a + p.value, 0).toFixed(0),
    haircut: MEES_SCENARIOS[mees][b],
  })), [property, mees]);

  const strandedBelow = useMemo(() => {
    const floorIdx = mees.includes('EPC C') ? 2 : mees.includes('EPC B') ? 1 : mees.includes('No') ? 6 : 4;
    return property.filter(p => EPC_BANDS.indexOf(p.epc) > floorIdx).reduce((a, p) => a + p.value, 0);
  }, [property, mees]);

  const timeline = useMemo(() => [2026, 2028, 2030, 2033, 2036, 2040, 2045, 2050].map(yr => {
    const h = yr <= 2033 ? 2030 : yr <= 2043 ? 2040 : 2050;
    const ramp = Math.min(1, (yr - 2024) / (h - 2024));
    const row = { year: yr };
    SCENARIO_NAMES.forEach(s => {
      row[s.split(' — ')[0]] = +COLLATERAL.reduce((a, it) =>
        a + it.value * (transAddonPct(it, s, h, mees, null) * ramp) / 100, 0).toFixed(0);
    });
    return row;
  }), [mees]);

  const totalTransLoss = COLLATERAL.reduce((a, it) => a + it.value * transAddonPct(it, scen, horizon, mees, carbon) / 100, 0);

  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:14, alignItems:'flex-end' }}>
        <Select label='MEES / EPBD Pathway' value={mees} onChange={setMees} options={Object.keys(MEES_SCENARIOS)} />
        <Select label='Scenario' value={scen} onChange={v => { setScen(v); setCarbon(SCENARIOS[v].carbon[horizon]); }} options={SCENARIO_NAMES} />
        <Select label='Horizon' value={String(horizon)} onChange={v => { setHorizon(+v); setCarbon(SCENARIOS[scen].carbon[+v]); }} options={HORIZONS.map(String)} />
        <Slider label={`Carbon Price €${carbon}/t`} min={0} max={400} step={5} value={carbon} onChange={setCarbon} width={160} />
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <Stat label='Transition Value-at-Risk' value={fmtM(totalTransLoss)} color={T.amber}
          sub={`${scen.split(' — ')[0]} · ${horizon} · €${carbon}/t`} />
        <Stat label='Property Below MEES Floor' value={fmtM(strandedBelow)} color={T.red}
          sub={`Letting-restricted under "${mees.split(' (')[0]}"`} />
        <Stat label='CII D/E Vessel Collateral' value={fmtM(vessels.filter(v => v.cii === 'D' || v.cii === 'E').reduce((a, v) => a + v.value, 0))}
          sub='Charter clauses & retrofit exposure' />
        <Stat label='Aging Aircraft (>15y)' value={fmtM(aircraft.filter(a2 => a2.acAge > 15).reduce((a, x) => a + x.value, 0))}
          sub='ICAO CO₂ standard obsolescence' />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card title='Property Collateral by EPC Band' sub={`€m pledged value with the "${mees.split(' (')[0]}" haircut curve overlaid`}>
          <ResponsiveContainer width='100%' height={260}>
            <ComposedChart data={epcDist} margin={{ top:5, right:20, left:0, bottom:5 }}>
              <XAxis dataKey='band' tick={{ fontSize:11, fill:T.textSec }} />
              <YAxis yAxisId='v' tick={{ fontSize:10, fill:T.textSec }} />
              <YAxis yAxisId='h' orientation='right' tick={{ fontSize:10, fill:T.amber }} unit='%' />
              <Tooltip contentStyle={{ fontSize:12 }} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar yAxisId='v' dataKey='value' name='Pledged value €m' radius={[4,4,0,0]}>
                {epcDist.map((e, i) => (
                  <Cell key={i} fill={i <= 1 ? T.sage : i <= 3 ? T.gold : T.red} />
                ))}
              </Bar>
              <Line yAxisId='h' type='monotone' dataKey='haircut' name='MEES haircut %' stroke={T.navy} strokeWidth={2} dot={{ r:3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
        <Card title='Book Transition Value-at-Risk Path' sub='€m expected transition markdown by scenario (ramped to horizon calibration)'>
          <ResponsiveContainer width='100%' height={260}>
            <LineChart data={timeline} margin={{ top:5, right:20, left:0, bottom:5 }}>
              <XAxis dataKey='year' tick={{ fontSize:10, fill:T.textSec }} />
              <YAxis tick={{ fontSize:10, fill:T.textSec }} />
              <Tooltip formatter={v => [`€${v}m`]} contentStyle={{ fontSize:12 }} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <ReferenceLine x={2030} stroke={T.textMut} strokeDasharray='4 3' label={{ value:'Policy pivot', fontSize:10, fill:T.textMut }} />
              <Line type='monotone' dataKey='Disorderly' stroke={T.amber} strokeWidth={2.5} dot={false} />
              <Line type='monotone' dataKey='Orderly' stroke={T.sage} strokeWidth={2} dot={false} />
              <Line type='monotone' dataKey='Hot House' stroke={T.textMut} strokeWidth={2} strokeDasharray='5 4' dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card title='Transport Collateral — Efficiency Stranding'
          sub='Vessels priced off IMO CII rating; aircraft off engine-generation age (ICAO CO₂ standard proxy)'>
          <table style={{ borderCollapse:'collapse', width:'100%' }}>
            <thead><tr>
              <th style={th}>Asset</th><th style={th}>Rating</th><th style={th}>Value</th>
              <th style={th}>Add-on</th><th style={th}>Scenario-Scaled</th>
            </tr></thead>
            <tbody>
              {vessels.map(v => {
                const addon = CII_ADDON[v.cii];
                return (
                  <tr key={v.id}>
                    <td style={{ ...td, fontWeight:600 }}>{v.name}</td>
                    <td style={td}><Pill text={`CII ${v.cii}`} color={v.cii >= 'D' ? T.red : v.cii === 'C' ? T.amber : T.green} /></td>
                    <td style={td}>€{v.value}m</td>
                    <td style={td}>{addon}%</td>
                    <td style={{ ...td, fontWeight:700 }}>{(addon * SCENARIOS[scen].trans[horizon]).toFixed(1)}%</td>
                  </tr>
                );
              })}
              {aircraft.map(a2 => {
                const addon = AC_AGE_ADDON(a2.acAge);
                return (
                  <tr key={a2.id}>
                    <td style={{ ...td, fontWeight:600 }}>{a2.name}</td>
                    <td style={td}><Pill text={`${a2.acAge}y`} color={a2.acAge > 15 ? T.red : a2.acAge > 10 ? T.amber : T.green} /></td>
                    <td style={td}>€{a2.value}m</td>
                    <td style={td}>{addon}%</td>
                    <td style={{ ...td, fontWeight:700 }}>{(addon * SCENARIOS[scen].trans[horizon]).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        <Card title='Carbon-Cost Sensitive Collateral'
          sub={`Inventory, pledged securities & guarantees marked down by issuer/commodity carbon sensitivity at €${carbon}/tCO₂e`}>
          <table style={{ borderCollapse:'collapse', width:'100%' }}>
            <thead><tr>
              <th style={th}>Collateral</th><th style={th}>Sensitivity</th><th style={th}>Value</th>
              <th style={th}>Markdown</th><th style={th}>€ Impact</th>
            </tr></thead>
            <tbody>
              {carbonSens.map(c => {
                const md = Math.min(18, (c.cInt * carbon) / 400) * SCENARIOS[scen].trans[horizon];
                return (
                  <tr key={c.id}>
                    <td style={{ ...td, fontWeight:600 }}>{c.name}</td>
                    <td style={td}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:60, height:6, background:T.surfaceH, borderRadius:3 }}>
                          <div style={{ width:`${(c.cInt / 40) * 100}%`, height:6, borderRadius:3,
                            background: c.cInt > 25 ? T.red : c.cInt > 12 ? T.amber : T.sage }} />
                        </div>
                        <span style={{ fontSize:11 }}>{c.cInt}</span>
                      </div>
                    </td>
                    <td style={td}>€{c.value}m</td>
                    <td style={{ ...td, fontWeight:700 }}>{md.toFixed(1)}%</td>
                    <td style={{ ...td, color: md * c.value / 100 > 5 ? T.red : T.text }}>€{(md * c.value / 100).toFixed(1)}m</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ fontSize:10.5, color:T.textMut, marginTop:8 }}>
            Wrong-way risk: pledged equity/guarantees from carbon-intensive issuers lose value in exactly the
            scenarios where the borrower defaults — the framework caps their eligible value rather than netting them at par.
          </div>
        </Card>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 4 — HAIRCUT & LTV ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
const LTV_BANDS = [
  { label:'< 50%',    lo:0,   hi:50 },
  { label:'50–70%',   lo:50,  hi:70 },
  { label:'70–90%',   lo:70,  hi:90 },
  { label:'90–100%',  lo:90,  hi:100 },
  { label:'> 100%',   lo:100, hi:1e9 },
];

const EngineTab = () => {
  const [scen, setScen] = useState(DEFAULT_CFG.scen);
  const [horizon, setHorizon] = useState(DEFAULT_CFG.horizon);
  const [mees, setMees] = useState(DEFAULT_CFG.mees);
  const [retreatYear, setRetreatYear] = useState(DEFAULT_CFG.retreatYear);
  const [carbon, setCarbon] = useState(SCENARIOS[DEFAULT_CFG.scen].carbon[DEFAULT_CFG.horizon]);
  const [staleness, setStaleness] = useState(true);
  const [itemId, setItemId] = useState(1);

  const cfg = useMemo(() => ({ scen, horizon, mees, retreatYear, carbonOverride:carbon, staleness }),
    [scen, horizon, mees, retreatYear, carbon, staleness]);

  const book = useMemo(() => COLLATERAL.map(it => ({ it, hc: haircutBreakdown(it, cfg) })), [cfg]);

  const totals = useMemo(() => {
    const value = book.reduce((a, r) => a + r.it.value, 0);
    const adj   = book.reduce((a, r) => a + r.hc.adjValue, 0);
    const loan  = book.reduce((a, r) => a + r.it.loan, 0);
    const unsec = book.reduce((a, r) => a + r.hc.unsecured, 0);
    return { value, adj, loan, unsec, wHaircut: (1 - adj / value) * 100 };
  }, [book]);

  const migration = useMemo(() => LTV_BANDS.map(b => ({
    band: b.label,
    'Pre-climate':  +book.filter(r => r.hc.ltvPre  >= b.lo && r.hc.ltvPre  < b.hi).reduce((a, r) => a + r.it.loan, 0).toFixed(0),
    'Climate-adjusted': +book.filter(r => r.hc.ltvPost >= b.lo && r.hc.ltvPost < b.hi).reduce((a, r) => a + r.it.loan, 0).toFixed(0),
  })), [book]);

  const sel = book.find(r => r.it.id === itemId) || book[0];
  const waterfall = useMemo(() => {
    const { it, hc } = sel;
    const steps = [
      { name:'Market value', v: it.value, fill: T.navyL },
      { name:'Base haircut', v: -it.value * hc.base / 100, fill: T.textMut },
      { name:'Physical add-on', v: -it.value * hc.phys / 100, fill: T.red },
      { name:'Transition add-on', v: -it.value * hc.trans / 100, fill: T.amber },
      { name:'Staleness add-on', v: -it.value * hc.stale / 100, fill: T.borderL },
      { name:'Adjusted value', v: hc.adjValue, fill: T.sage },
    ];
    let run = 0;
    return steps.map((s, i) => {
      if (i === 0 || i === steps.length - 1) { run = i === 0 ? s.v : run; return { ...s, base:0, bar:Math.abs(s.v) }; }
      const start = run + s.v;
      const out = { ...s, base:start, bar:Math.abs(s.v) };
      run = start;
      return out;
    });
  }, [sel]);

  return (
    <div>
      <Card title='Calibration Console'
        sub='All parameters feed the shared engine: haircut = base(class) + physical(hazard × scenario × insurance) + transition(EPC/CII/age/carbon × stringency) + staleness'
        style={{ marginBottom:16 }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:14, alignItems:'flex-end' }}>
          <Select label='Scenario' value={scen} onChange={v => { setScen(v); setCarbon(SCENARIOS[v].carbon[horizon]); }} options={SCENARIO_NAMES} />
          <Select label='Horizon' value={String(horizon)} onChange={v => { setHorizon(+v); setCarbon(SCENARIOS[scen].carbon[+v]); }} options={HORIZONS.map(String)} />
          <Select label='MEES / EPBD Pathway' value={mees} onChange={setMees} options={Object.keys(MEES_SCENARIOS)} />
          <Slider label={`Carbon €${carbon}/t`} min={0} max={400} step={5} value={carbon} onChange={setCarbon} />
          <Slider label={`Insurer Retreat: ${retreatYear}`} min={2026} max={2050} value={retreatYear} onChange={setRetreatYear} />
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:T.textSec, cursor:'pointer' }}>
            <input type='checkbox' checked={staleness} onChange={e => setStaleness(e.target.checked)} />
            Staleness add-on
          </label>
        </div>
      </Card>

      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <Stat label='Book Market Value' value={fmtM(totals.value)} sub='60 collateral items' />
        <Stat label='Climate-Adjusted Value' value={fmtM(totals.adj)} color={T.navyL} sub={`Weighted haircut ${totals.wHaircut.toFixed(1)}%`} />
        <Stat label='Value Erosion' value={fmtM(totals.value - totals.adj)} color={T.red} sub='Market − adjusted' />
        <Stat label='Unsecured Slippage' value={fmtM(totals.unsec)} color={T.amber}
          sub='Exposure no longer covered by adjusted value' />
        <Stat label='Secured Coverage' value={fmtP(Math.min(100, totals.adj / totals.loan * 100))} color={T.green}
          sub='Adjusted value / total loans' />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card title='Single-Item Haircut Waterfall' sub='Select any register item to decompose its climate-adjusted value'>
          <div style={{ marginBottom:10 }}>
            <select value={itemId} onChange={e => setItemId(+e.target.value)}
              style={{ padding:'6px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12.5,
                background:T.surface, color:T.text, width:'100%', fontFamily:T.font }}>
              {COLLATERAL.map(it => <option key={it.id} value={it.id}>{it.name} — €{it.value}m ({it.cls})</option>)}
            </select>
          </div>
          <ResponsiveContainer width='100%' height={240}>
            <BarChart data={waterfall} margin={{ top:5, right:10, left:0, bottom:5 }}>
              <XAxis dataKey='name' tick={{ fontSize:9, fill:T.textSec }} interval={0} />
              <YAxis tick={{ fontSize:10, fill:T.textSec }} />
              <Tooltip formatter={(v, n, p) => [`€${p.payload.bar.toFixed(1)}m`, p.payload.name]} contentStyle={{ fontSize:12 }} />
              <Bar dataKey='base' stackId='w' fill='transparent' />
              <Bar dataKey='bar' stackId='w' radius={[3,3,0,0]}>
                {waterfall.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize:12, color:T.textSec }}>
            LTV {sel.hc.ltvPre.toFixed(0)}% → <b style={{ color: sel.hc.ltvPost > 100 ? T.red : sel.hc.ltvPost > 80 ? T.amber : T.green }}>
            {sel.hc.ltvPost.toFixed(0)}%</b> · total haircut <b>{sel.hc.total.toFixed(1)}%</b>
            {sel.hc.unsecured > 0 && <> · <b style={{ color:T.red }}>€{sel.hc.unsecured.toFixed(1)}m slips to unsecured</b></>}
          </div>
        </Card>

        <Card title='Book LTV Migration' sub='Loan exposure (€m) by LTV band — pre-climate vs climate-adjusted collateral values'>
          <ResponsiveContainer width='100%' height={240}>
            <BarChart data={migration} margin={{ top:5, right:10, left:0, bottom:5 }}>
              <XAxis dataKey='band' tick={{ fontSize:10, fill:T.textSec }} />
              <YAxis tick={{ fontSize:10, fill:T.textSec }} />
              <Tooltip formatter={v => [`€${v}m`]} contentStyle={{ fontSize:12 }} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey='Pre-climate' fill={T.navyL} radius={[3,3,0,0]} />
              <Bar dataKey='Climate-adjusted' fill={T.gold} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize:12, color:T.textSec }}>
            Exposure migrating above 90% LTV triggers the revaluation & remargining workflow (Trigger T3) and feeds
            the concentration limit check in the Governance tab.
          </div>
        </Card>
      </div>

      <Card title='Climate-Adjusted Register (Live under current calibration)' sub='Sorted by haircut uplift vs base — the re-margining priority queue'>
        <div style={{ overflowX:'auto', maxHeight:420, overflowY:'auto' }}>
          <table style={{ borderCollapse:'collapse', width:'100%' }}>
            <thead><tr>
              <th style={th}>Collateral</th><th style={th}>Class</th><th style={th}>Base HC</th>
              <th style={th}>+Physical</th><th style={th}>+Transition</th><th style={th}>+Stale</th>
              <th style={th}>Total HC</th><th style={th}>Adj. Value</th><th style={th}>LTV Pre→Post</th><th style={th}>Unsecured</th>
            </tr></thead>
            <tbody>
              {[...book].sort((a, b) => (b.hc.total - b.hc.base) - (a.hc.total - a.hc.base)).map(({ it, hc }) => (
                <tr key={it.id}>
                  <td style={{ ...td, fontWeight:600, whiteSpace:'nowrap' }}>{it.name}</td>
                  <td style={td}><Pill text={it.cls} color={CLASSES[it.cls].color} /></td>
                  <td style={td}>{hc.base}%</td>
                  <td style={{ ...td, color: hc.phys > 8 ? T.red : T.text }}>+{hc.phys.toFixed(1)}%</td>
                  <td style={{ ...td, color: hc.trans > 8 ? T.amber : T.text }}>+{hc.trans.toFixed(1)}%</td>
                  <td style={td}>+{hc.stale.toFixed(1)}%</td>
                  <td style={{ ...td, fontWeight:800 }}>{hc.total.toFixed(1)}%</td>
                  <td style={td}>€{hc.adjValue.toFixed(0)}m</td>
                  <td style={td}>{hc.ltvPre.toFixed(0)}% → <b style={{ color: hc.ltvPost > 100 ? T.red : hc.ltvPost > 80 ? T.amber : T.green }}>{hc.ltvPost.toFixed(0)}%</b></td>
                  <td style={{ ...td, fontWeight: hc.unsecured > 0 ? 700 : 400, color: hc.unsecured > 0 ? T.red : T.textMut }}>
                    {hc.unsecured > 0 ? `€${hc.unsecured.toFixed(1)}m` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 5 — LGD, ECL & CAPITAL IMPACT
// ═══════════════════════════════════════════════════════════════════════════════
const LgdTab = () => {
  const [scen, setScen] = useState('Disorderly — Delayed Transition');
  const [horizon, setHorizon] = useState(2040);
  const [downturn, setDownturn] = useState(15);

  const cfg = useMemo(() => ({ ...DEFAULT_CFG, scen, horizon }), [scen, horizon]);

  const byClass = useMemo(() => CLASS_NAMES.map(cn => {
    const items = COLLATERAL.filter(c => c.cls === cn);
    const loan = items.reduce((a, i) => a + i.loan, 0);
    let lgdBase = 0, lgdClim = 0, rwaBase = 0, rwaClim = 0;
    items.forEach(it => {
      const { base } = CLASSES[it.cls];
      const baseAdj = it.value * (1 - base / 100);
      const hc = haircutBreakdown(it, cfg);
      const lb = lgdFor(it, baseAdj) * (1 + downturn / 100);
      const lc = lgdFor(it, hc.adjValue) * (1 + downturn / 100);
      lgdBase += lb * it.loan; lgdClim += lc * it.loan;
      const rw = CLASSES[it.cls];
      rwaBase += Math.min(it.loan, baseAdj) * rw.rwSec / 100 + Math.max(0, it.loan - baseAdj) * rw.rwUnsec / 100;
      rwaClim += Math.min(it.loan, hc.adjValue) * rw.rwSec / 100 + Math.max(0, it.loan - hc.adjValue) * rw.rwUnsec / 100;
    });
    const pd = CLASSES[cn].pd / 100;
    const eclBase = loan * pd * (lgdBase / loan);
    const eclClim = loan * pd * (lgdClim / loan);
    return {
      cls: cn, loan,
      lgdBase: (lgdBase / loan) * 100, lgdClim: (lgdClim / loan) * 100,
      eclBase, eclClim, dEcl: eclClim - eclBase,
      rwaBase, rwaClim, dRwa: rwaClim - rwaBase,
      color: CLASSES[cn].color,
    };
  }), [cfg, downturn]);

  const tot = byClass.reduce((a, r) => ({
    loan: a.loan + r.loan, eclBase: a.eclBase + r.eclBase, eclClim: a.eclClim + r.eclClim,
    rwaBase: a.rwaBase + r.rwaBase, rwaClim: a.rwaClim + r.rwaClim,
  }), { loan:0, eclBase:0, eclClim:0, rwaBase:0, rwaClim:0 });

  const chart = byClass.map(r => ({
    name: r.cls.replace(' RE',''), 'Base LGD': +r.lgdBase.toFixed(1), 'Climate LGD': +r.lgdClim.toFixed(1),
  }));

  const sensitivity = useMemo(() => SCENARIO_NAMES.map(s => {
    const row = { scenario: s.split(' — ')[0] };
    HORIZONS.forEach(h => {
      const c = { ...DEFAULT_CFG, scen:s, horizon:h };
      let ecl = 0;
      CLASS_NAMES.forEach(cn => {
        const items = COLLATERAL.filter(x => x.cls === cn);
        const pd = CLASSES[cn].pd / 100;
        items.forEach(it => {
          const hc = haircutBreakdown(it, c);
          ecl += it.loan * pd * lgdFor(it, hc.adjValue) * (1 + downturn / 100);
        });
      });
      row[h] = +ecl.toFixed(1);
    });
    return row;
  }), [downturn]);

  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:14, alignItems:'flex-end' }}>
        <Select label='Scenario' value={scen} onChange={setScen} options={SCENARIO_NAMES} />
        <Select label='Horizon' value={String(horizon)} onChange={v => setHorizon(+v)} options={HORIZONS.map(String)} />
        <Slider label={`Downturn LGD uplift: +${downturn}%`} min={0} max={40} step={5} value={downturn} onChange={setDownturn} width={150} />
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <Stat label='Portfolio ECL (base collateral)' value={fmtM(tot.eclBase)} sub='12m PD × downturn LGD × EAD' />
        <Stat label='ECL (climate-adjusted)' value={fmtM(tot.eclClim)} color={T.amber} sub='Same PDs — LGD channel only' />
        <Stat label='ECL Uplift' value={`+${fmtP(tot.eclBase > 0 ? (tot.eclClim / tot.eclBase - 1) * 100 : 0)}`} color={T.red}
          sub={fmtM(tot.eclClim - tot.eclBase) + ' overlay candidate'} />
        <Stat label='RWA (base)' value={fmtM(tot.rwaBase)} sub='SA secured/unsecured split' />
        <Stat label='RWA Uplift' value={`+${fmtM(tot.rwaClim - tot.rwaBase)}`} color={T.amber}
          sub={`+${fmtP(tot.rwaBase > 0 ? (tot.rwaClim / tot.rwaBase - 1) * 100 : 0)} · ${fmtM((tot.rwaClim - tot.rwaBase) * 0.105)} CET1 @10.5%`} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card title='LGD by Collateral Class' sub='Workout LGD with base vs climate-adjusted collateral value (downturn-scaled)'>
          <ResponsiveContainer width='100%' height={280}>
            <BarChart data={chart} margin={{ top:5, right:10, left:0, bottom:5 }}>
              <XAxis dataKey='name' tick={{ fontSize:9.5, fill:T.textSec }} interval={0} />
              <YAxis tick={{ fontSize:10, fill:T.textSec }} unit='%' />
              <Tooltip contentStyle={{ fontSize:12 }} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey='Base LGD' fill={T.navyL} radius={[3,3,0,0]} />
              <Bar dataKey='Climate LGD' fill={T.red} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title='ECL Sensitivity Matrix' sub='Portfolio ECL (€m) across the full scenario × horizon grid at current downturn setting'>
          <table style={{ borderCollapse:'collapse', width:'100%', marginTop:6 }}>
            <thead><tr>
              <th style={th}>Scenario</th>{HORIZONS.map(h => <th key={h} style={{ ...th, textAlign:'center' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {sensitivity.map(r => (
                <tr key={r.scenario}>
                  <td style={{ ...td, fontWeight:700 }}>{r.scenario}</td>
                  {HORIZONS.map(h => {
                    const max = Math.max(...sensitivity.flatMap(x => HORIZONS.map(hh => x[hh])));
                    const min = Math.min(...sensitivity.flatMap(x => HORIZONS.map(hh => x[hh])));
                    const t2 = max > min ? (r[h] - min) / (max - min) : 0;
                    return (
                      <td key={h} style={{ ...td, textAlign:'center' }}>
                        <span style={{ display:'inline-block', minWidth:64, padding:'4px 8px', borderRadius:6, fontWeight:700,
                          background:`rgba(220,38,38,${(0.08 + t2 * 0.32).toFixed(2)})`,
                          color: t2 > 0.6 ? T.red : T.navy }}>€{r[h]}m</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize:11, color:T.textSec, marginTop:12, lineHeight:1.5 }}>
            The LGD channel is the collateral framework's contribution to IFRS 9 climate overlays: PDs are held
            flat so the delta is attributable purely to collateral value erosion, insurance retreat and MEES stranding.
            Pair with the PD overlays in <i>Climate Credit Risk Analytics</i> (EP-AJ5) for the combined ECL effect.
          </div>
        </Card>
      </div>

      <Card title='Class-Level Detail' sub='LGD, ECL and standardised-approach RWA under base vs climate-adjusted collateral values'>
        <div style={{ overflowX:'auto' }}>
          <table style={{ borderCollapse:'collapse', width:'100%' }}>
            <thead><tr>
              <th style={th}>Class</th><th style={th}>Loans</th><th style={th}>LGD Base</th><th style={th}>LGD Climate</th>
              <th style={th}>Δ LGD</th><th style={th}>ECL Base</th><th style={th}>ECL Climate</th><th style={th}>Δ ECL</th>
              <th style={th}>RWA Base</th><th style={th}>Δ RWA</th>
            </tr></thead>
            <tbody>
              {byClass.map(r => (
                <tr key={r.cls}>
                  <td style={td}><Pill text={r.cls} color={r.color} /></td>
                  <td style={td}>€{r.loan}m</td>
                  <td style={td}>{r.lgdBase.toFixed(1)}%</td>
                  <td style={{ ...td, fontWeight:700 }}>{r.lgdClim.toFixed(1)}%</td>
                  <td style={{ ...td, color: r.lgdClim - r.lgdBase > 3 ? T.red : T.amber, fontWeight:700 }}>
                    +{(r.lgdClim - r.lgdBase).toFixed(1)}pp
                  </td>
                  <td style={td}>€{r.eclBase.toFixed(1)}m</td>
                  <td style={td}>€{r.eclClim.toFixed(1)}m</td>
                  <td style={{ ...td, fontWeight:700 }}>+€{r.dEcl.toFixed(1)}m</td>
                  <td style={td}>€{r.rwaBase.toFixed(0)}m</td>
                  <td style={{ ...td, fontWeight:700, color: r.dRwa > 20 ? T.red : T.text }}>+€{r.dRwa.toFixed(0)}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 6 — REGULATORY COMPLIANCE MAP
// ═══════════════════════════════════════════════════════════════════════════════
const REG_ITEMS = [
  { fw:'ECB Guide (Nov 2020)', ref:'Expectation 8.4', req:'Monitor and manage the impact of climate-related and environmental risks on the valuation of collateral, in particular real estate.', element:'Physical & transition overlays applied to every register item; haircut engine recalibrated quarterly.', status:'Met', owner:'Head of Collateral Mgmt' },
  { fw:'ECB Guide (Nov 2020)', ref:'Expectation 7.2', req:'Include climate risks in credit risk appetite, policies and procedures at all relevant stages of credit granting.', element:'Hazard-zone concentration limits and LTV caps embedded in credit policy (Governance tab, L1–L6).', status:'Met', owner:'CRO Office' },
  { fw:'ECB Thematic Review 2022', ref:'Good Practice 4.3', req:'Geolocate collateral at address level and map to forward-looking hazard datasets (not historical loss only).', element:'100% of register geocoded; hazard scores from forward-looking RCP-conditioned maps.', status:'Partial', owner:'Data Office' },
  { fw:'EBA GL/2020/06 (LOM)', ref:'§7.1 para 208–210', req:'Collateral valuation at origination must account for factors that affect future value, including energy efficiency and environmental factors.', element:'Origination haircut includes EPC/MEES and hazard add-ons; appraiser instruction pack updated.', status:'Met', owner:'Credit Underwriting' },
  { fw:'EBA GL/2020/06 (LOM)', ref:'§7.2 para 217–223', req:'Monitoring and revaluation frequency proportionate to collateral type and market volatility; event-driven revaluation triggers.', element:'Trigger framework T1–T8: hazard events, EPC regulation change, insurer non-renewal, LTV breach.', status:'Met', owner:'Collateral Ops' },
  { fw:'EBA GL/2020/06 (LOM)', ref:'para 149', req:'Institutions should take into account ESG factors and associated risks in creditworthiness assessment.', element:'Collateral climate score feeds the counterparty ESG assessment; borrower-level linkage in build.', status:'Partial', owner:'Credit Underwriting' },
  { fw:'CRR', ref:'Art. 208(3)', req:'Monitor property values frequently — at least yearly for CRE, every 3 years for RRE — and more frequently where market conditions change significantly.', element:'Climate triggers qualify as "significant change"; staleness add-on penalises stale valuations in the interim.', status:'Met', owner:'Collateral Ops' },
  { fw:'CRR', ref:'Art. 229(1)', req:'Valuation of immovable property at or below market value, using prudent valuation criteria.', element:'Climate-adjusted value is the prudent value basis for LGD and eligible collateral amounts.', status:'Met', owner:'Independent Valuation Unit' },
  { fw:'CRR3 (Reg. 2024/1623)', ref:'Art. 229 revised — "property value"', req:'Property value must be sustainable over the life of the loan; value increases above origination capped except via genuine improvements (incl. energy efficiency).', element:'Life-of-loan sustainability test in build: adjusted value projected to loan maturity under Disorderly scenario.', status:'Partial', owner:'Credit Risk Methodology' },
  { fw:'BCBS (Jun 2022)', ref:'Principle 2', req:'Board and senior management should clearly assign climate-related responsibilities and exercise effective oversight of climate-related financial risks.', element:'Collateral climate dashboard in quarterly Board Risk Committee pack; mandate documented.', status:'Met', owner:'Board Risk Committee' },
  { fw:'BCBS (Jun 2022)', ref:'Principle 4', req:'Incorporate material climate-related financial risks into the internal capital adequacy assessment process (ICAAP).', element:'RWA/CET1 sensitivity from LGD tab flows to ICAAP climate chapter; Pillar 2 add-on under discussion.', status:'Partial', owner:'Capital Management' },
  { fw:'BCBS FAQ (Dec 2022)', ref:'CRE/RRE valuation FAQ', req:'Banks should consider whether climate risk warrants adjusting collateral values used in the credit risk framework where markets do not yet price it.', element:'Haircut add-ons applied precisely where market comparables lag climate fundamentals.', status:'Met', owner:'Credit Risk Methodology' },
  { fw:'PRA SS3/19', ref:'§3.2', req:'Scenario analysis should consider the impact of climate risks on collateral values and recovery expectations.', element:'Three NGFS-aligned scenarios × three horizons run monthly across the full register.', status:'Met', owner:'Stress Testing Team' },
  { fw:'BaFin MaRisk (7th amend.)', ref:'BTO 1.2.1 / ESG', req:'ESG risks must be considered in collateral value review and lending decisions; documentation of methodology required.', element:'Methodology paper approved by model governance; German book flagged for local calibration.', status:'Partial', owner:'Model Governance' },
  { fw:'IFRS 9', ref:'B5.5.55', req:'Collateral and other credit enhancements integral to contractual terms must be reflected in the measurement of expected credit losses.', element:'Climate-adjusted collateral value drives the LGD input to ECL (LGD channel isolated per class).', status:'Met', owner:'Finance / IFRS 9 Team' },
  { fw:'NGFS Phase IV/V', ref:'Scenario framework', req:'Use consistent, published transition/physical scenario parameters for financial risk quantification.', element:'Orderly / Disorderly / Hot House calibrations mapped to NGFS carbon price and chronic-hazard trajectories.', status:'Met', owner:'Stress Testing Team' },
  { fw:'EBA Pillar 3 ESG ITS', ref:'Template 5', req:'Disclose banking book exposures subject to physical risk, including collateral in high-hazard geographies.', element:'Register hazard-zone tagging produces Template 5 rows; energy-efficiency split (Template 2) automated.', status:'Partial', owner:'Regulatory Reporting' },
  { fw:'EU EPBD 2024 recast / UK MEES', ref:'Art. 9 / MEES Regs', req:'Minimum energy performance standards progressively restrict letting/sale of worst-performing buildings.', element:'MEES pathway selector with four legal trajectories; stranded value quantified per EPC band.', status:'Met', owner:'Real Estate Risk' },
];

const RegulatoryTab = () => {
  const [fwFilter, setFwFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expanded, setExpanded] = useState(null);

  const frameworks = ['All', ...new Set(REG_ITEMS.map(r => r.fw))];
  const rows = REG_ITEMS.filter(r =>
    (fwFilter === 'All' || r.fw === fwFilter) && (statusFilter === 'All' || r.status === statusFilter));

  const met = REG_ITEMS.filter(r => r.status === 'Met').length;
  const partial = REG_ITEMS.filter(r => r.status === 'Partial').length;

  return (
    <div>
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <Stat label='Requirements Mapped' value={REG_ITEMS.length} sub='7 regulatory frameworks' />
        <Stat label='Met' value={met} color={T.green} sub={`${((met / REG_ITEMS.length) * 100).toFixed(0)}% of mapped set`} />
        <Stat label='Partial' value={partial} color={T.amber} sub='Remediation in flight' />
        <Stat label='Gaps' value={REG_ITEMS.length - met - partial} color={T.red} sub='None open' />
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:14, alignItems:'flex-end', flexWrap:'wrap' }}>
        <Select label='Framework' value={fwFilter} onChange={setFwFilter} options={frameworks} width={260} />
        <Select label='Status' value={statusFilter} onChange={setStatusFilter} options={['All','Met','Partial','Gap']} />
        <div style={{ marginLeft:'auto', fontSize:11, color:T.textSec, maxWidth:420, fontStyle:'italic' }}>
          Anchor requirement: <b>ECB Guide Expectation 8.4</b> — climate impact on collateral valuations — plus
          EBA LOM §7 and CRR Art. 208/229, which make prudent, climate-sensitive collateral values a hard legal basis.
        </div>
      </div>

      {rows.map((r, i) => (
        <div key={i} onClick={() => setExpanded(expanded === i ? null : i)}
          style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'12px 16px',
            marginBottom:8, cursor:'pointer', boxShadow:T.card }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <Pill text={r.status} color={statusColor(r.status)} />
            <div style={{ fontSize:12.5, fontWeight:700, color:T.navy, minWidth:210 }}>{r.fw} · {r.ref}</div>
            <div style={{ fontSize:12, color:T.textSec, flex:1, whiteSpace: expanded === i ? 'normal' : 'nowrap',
              overflow:'hidden', textOverflow:'ellipsis' }}>{r.req}</div>
            <div style={{ fontSize:11, color:T.textMut }}>{expanded === i ? '▲' : '▼'}</div>
          </div>
          {expanded === i && (
            <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${T.border}`, display:'grid',
              gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <div style={{ fontSize:10.5, color:T.textMut, fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Requirement</div>
                <div style={{ fontSize:12, color:T.text, lineHeight:1.5 }}>{r.req}</div>
              </div>
              <div>
                <div style={{ fontSize:10.5, color:T.textMut, fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Framework Response</div>
                <div style={{ fontSize:12, color:T.text, lineHeight:1.5 }}>{r.element}</div>
                <div style={{ fontSize:11, color:T.textSec, marginTop:6 }}>Owner: <b>{r.owner}</b></div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 7 — GOVERNANCE & IMPLEMENTATION BLUEPRINT
// ═══════════════════════════════════════════════════════════════════════════════
const LOD_ROLES = [
  ['1st Line — Relationship & Collateral Ops', 'Captures climate attributes at origination; executes revaluation triggers; runs remargining queue.'],
  ['1st Line — Independent Valuation Unit', 'Applies climate-adjusted prudent value; instructs appraisers on hazard & EPC evidence requirements.'],
  ['2nd Line — Credit Risk Methodology', 'Owns haircut model, scenario calibration, MEES curves; annual recalibration with backtesting.'],
  ['2nd Line — Model Governance', 'Validates damage functions and LGD linkage; challenges parameter overrides; maintains model inventory entry.'],
  ['3rd Line — Internal Audit', 'Audits trigger execution, data lineage, and consistency between disclosed (Pillar 3) and internal values.'],
  ['Board Risk Committee', 'Approves risk appetite limits L1–L6; reviews quarterly collateral climate dashboard and breach reports.'],
];

const POLICY_AMENDMENTS = [
  'Collateral Valuation Policy — add climate-adjusted prudent value as the binding value basis (§4.2).',
  'Eligible Collateral Schedule — cap eligible value of carbon-intensive financial collateral (wrong-way risk, §6.1).',
  'Appraiser Instruction Pack — mandatory hazard-zone statement, EPC evidence, insurance-terms confirmation.',
  'LTV Policy — origination LTV caps computed on climate-adjusted value for Flood Zone 3 / EPC F-G assets.',
  'Insurance Policy — minimum coverage ratios by hazard score; non-renewal notification covenant in facility docs.',
  'Revaluation Policy — event-driven triggers T1–T8 override cyclical schedule; desktop AVM refresh quarterly.',
  'Credit Policy — new-origination screening: decline/structure rules for collateral above hazard thresholds.',
  'Workout & Recovery Policy — recovery timelines and fire-sale discounts differentiated by climate impairment.',
  'Data Policy — collateral geocoding to address level mandatory; EPC refresh at each revaluation event.',
  'Product Governance — green retrofit lending carve-out: improvement capex can restore eligible value.',
];

const DATA_REGISTER = [
  ['Address-level geocode (lat/long)', 'Internal + cadastral registry', 'Available'],
  ['Forward hazard maps (7 perils, RCP-conditioned)', 'Vendor (e.g. JBA / Munich Re / XDI)', 'Available'],
  ['EPC certificate & rating', 'National EPC registers', 'Available'],
  ['Retrofit cost curves by archetype', 'CRREM / national studies', 'Partial'],
  ['Insurance policy terms & exclusions', 'Borrower covenant returns', 'Partial'],
  ['Insurer non-renewal signals by postcode', 'Broker panels / market data', 'Missing'],
  ['IMO CII ratings & trajectories', 'Class societies / IMO DCS', 'Available'],
  ['Aircraft engine generation & fuel burn', 'Appraiser / OEM data', 'Available'],
  ['Commodity carbon cost pass-through', 'Internal research + ETS prices', 'Partial'],
  ['Issuer carbon intensity (financial collateral)', 'ESG data vendor', 'Available'],
  ['Local adaptation infrastructure (defences)', 'Public flood-defence registers', 'Partial'],
  ['Historic claims & loss experience', 'Internal workout database', 'Available'],
];

const TRIGGERS = [
  ['T1', 'Severe hazard event within 25km of collateral', 'Immediate desktop revaluation + insurance confirmation within 10 business days'],
  ['T2', 'EPC regulation change (MEES/EPBD trajectory shift)', 'Re-run transition overlay book-wide within 30 days; refresh haircut curve'],
  ['T3', 'Climate-adjusted LTV breaches 90%', 'Remargining request / additional collateral or guarantee within covenant period'],
  ['T4', 'Insurer non-renewal or exclusion added', 'Reclassify to retreat-exposed; physical add-on recomputed without insurance offset'],
  ['T5', 'Hazard score uplift ≥ 1 notch on map refresh', 'Full revaluation at next cycle; interim staleness add-on doubled'],
  ['T6', 'Carbon price ±40% vs calibration', 'Recalibrate carbon-sensitive markdowns; notify affected relationship teams'],
  ['T7', 'CII rating downgrade to D/E', 'Vessel charter-value review; retrofit plan required for continued eligibility'],
  ['T8', 'Concentration limit early-warning (85% of limit)', 'New-origination restriction in affected hazard zone until below threshold'],
];

const LIMITS = [
  { id:'L1', label:'Flood Zone 3 (score ≥4) share of collateral book', limit:10, current:8.2 },
  { id:'L2', label:'EPC F–G share of property collateral', limit:8,  current:6.9 },
  { id:'L3', label:'Uninsured high-hazard collateral (score ≥4, ins <70%)', limit:5,  current:4.1 },
  { id:'L4', label:'Single-hazard-zone concentration (any NUTS-2 region)', limit:12, current:9.6 },
  { id:'L5', label:'Climate-adjusted LTV > 90% share of secured book', limit:15, current:11.8 },
  { id:'L6', label:'CII D/E vessel share of transport collateral', limit:35, current:29.0 },
];

const ROADMAP = [
  { phase:'Phase 1 — Foundations (Q1–Q2)', items:[
    'Geocode full register; procure forward hazard maps; EPC register match',
    'Approve methodology paper (haircut stack, damage functions, MEES curves)',
    'Stand up climate collateral data mart + lineage documentation',
  ]},
  { phase:'Phase 2 — Engine & Policy (Q2–Q3)', items:[
    'Deploy haircut engine into collateral system of record (parallel run 1 quarter)',
    'Amend the 10 policy documents; train appraiser panel and credit officers',
    'Wire climate-adjusted value into LGD models and IFRS 9 overlay process',
  ]},
  { phase:'Phase 3 — Controls & Limits (Q3–Q4)', items:[
    'Activate triggers T1–T8 with automated monitoring; go-live limits L1–L6',
    'Board Risk Committee dashboard + breach escalation protocol',
    'Pillar 3 Template 5 automation from register hazard tagging',
  ]},
  { phase:'Phase 4 — Advanced (Year 2)', items:[
    'Life-of-loan sustainable value test (CRR3 Art. 229 revised) at origination',
    'Insurer-retreat early-warning feed from broker panel data',
    'Adaptation/retrofit lending integration — improvement capex restores value',
    'Extend to securitisation collateral pools and covered bond cover tests',
  ]},
];

const MATURITY_DIMS = [
  'Data & geocoding coverage', 'Methodology & damage functions', 'Valuation process integration',
  'Policy & documentation', 'Monitoring triggers & limits', 'LGD / capital linkage',
  'Governance & board oversight', 'Disclosure & regulatory reporting',
];

const GovernanceTab = () => {
  const [scores, setScores] = useState([4, 4, 3, 4, 3, 3, 4, 3]);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const level = avg >= 4.5 ? 'Leading' : avg >= 3.5 ? 'Advanced' : avg >= 2.5 ? 'Established' : avg >= 1.5 ? 'Developing' : 'Initial';

  const radar = MATURITY_DIMS.map((d, i) => ({ dim: d.split(' ')[0] + ' ' + (d.split(' ')[1] || ''), score: scores[i] }));

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card title='Three Lines of Defence — Role Charter' sub='Accountabilities for the climate-adjusted collateral framework'>
          {LOD_ROLES.map(([role, desc]) => (
            <div key={role} style={{ marginBottom:10, paddingBottom:10, borderBottom:`1px solid ${T.border}` }}>
              <div style={{ fontSize:12.5, fontWeight:700, color:T.navy }}>{role}</div>
              <div style={{ fontSize:11.5, color:T.textSec, lineHeight:1.5 }}>{desc}</div>
            </div>
          ))}
        </Card>
        <Card title='Risk Appetite Limits (L1–L6)' sub='Utilisation vs Board-approved limits — current calibration'>
          {LIMITS.map(l => {
            const util = (l.current / l.limit) * 100;
            return (
              <div key={l.id} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, marginBottom:3 }}>
                  <span style={{ color:T.textSec }}><b style={{ color:T.navy }}>{l.id}</b> · {l.label}</span>
                  <span style={{ fontWeight:700, color: util > 85 ? T.red : util > 70 ? T.amber : T.green }}>
                    {l.current}% / {l.limit}%
                  </span>
                </div>
                <div style={{ height:8, background:T.surfaceH, borderRadius:4, position:'relative' }}>
                  <div style={{ width:`${Math.min(100, util)}%`, height:8, borderRadius:4,
                    background: util > 85 ? T.red : util > 70 ? T.gold : T.sage }} />
                  <div style={{ position:'absolute', left:'85%', top:-2, width:2, height:12, background:T.textMut }} />
                </div>
              </div>
            );
          })}
          <div style={{ fontSize:10.5, color:T.textMut }}>Marker = 85% early-warning threshold (Trigger T8).</div>
        </Card>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card title='Revaluation Trigger Framework (T1–T8)' sub='Event-driven overrides to the cyclical revaluation schedule (EBA LOM §7.2 / CRR Art. 208(3))'>
          <table style={{ borderCollapse:'collapse', width:'100%' }}>
            <thead><tr><th style={th}>ID</th><th style={th}>Trigger Event</th><th style={th}>Required Action</th></tr></thead>
            <tbody>
              {TRIGGERS.map(([id, ev, act]) => (
                <tr key={id}>
                  <td style={{ ...td, fontWeight:800, color:T.navy }}>{id}</td>
                  <td style={{ ...td, fontWeight:600 }}>{ev}</td>
                  <td style={{ ...td, color:T.textSec }}>{act}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title='Climate Data Requirements Register' sub='Sourcing status for the 12 data elements the framework depends on'>
          <table style={{ borderCollapse:'collapse', width:'100%' }}>
            <thead><tr><th style={th}>Data Element</th><th style={th}>Source</th><th style={th}>Status</th></tr></thead>
            <tbody>
              {DATA_REGISTER.map(([el, src, st]) => (
                <tr key={el}>
                  <td style={{ ...td, fontWeight:600 }}>{el}</td>
                  <td style={{ ...td, color:T.textSec }}>{src}</td>
                  <td style={td}><Pill text={st} color={st === 'Available' ? T.green : st === 'Partial' ? T.amber : T.red} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card title='Policy Amendment Register' sub='10 policy documents that must change to operationalise the framework'>
          {POLICY_AMENDMENTS.map((p, i) => (
            <div key={i} style={{ display:'flex', gap:10, padding:'7px 0', borderBottom:`1px solid ${T.border}`,
              fontSize:12, color:T.text, lineHeight:1.45 }}>
              <span style={{ fontWeight:800, color:T.gold, minWidth:22 }}>{String(i + 1).padStart(2, '0')}</span>
              <span>{p}</span>
            </div>
          ))}
        </Card>
        <Card title='Implementation Roadmap' sub='Four phases from data foundations to CRR3 life-of-loan value tests'>
          {ROADMAP.map(ph => (
            <div key={ph.phase} style={{ marginBottom:12 }}>
              <div style={{ fontSize:12.5, fontWeight:700, color:T.navy, marginBottom:4 }}>{ph.phase}</div>
              {ph.items.map(it => (
                <div key={it} style={{ fontSize:11.5, color:T.textSec, padding:'2px 0 2px 14px', position:'relative', lineHeight:1.45 }}>
                  <span style={{ position:'absolute', left:0, color:T.sage }}>▸</span>{it}
                </div>
              ))}
            </div>
          ))}
        </Card>
      </div>

      <Card title='Framework Maturity Self-Assessment'
        sub='Score each dimension 1 (Initial) → 5 (Leading); the profile benchmarks against ECB thematic review peer distribution'>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div>
            {MATURITY_DIMS.map((d, i) => (
              <div key={d} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <div style={{ width:220, fontSize:11.5, color:T.textSec }}>{d}</div>
                <input type='range' min={1} max={5} value={scores[i]}
                  onChange={e => setScores(s => s.map((v, j) => j === i ? +e.target.value : v))}
                  style={{ flex:1 }} />
                <div style={{ width:18, fontSize:12.5, fontWeight:800, color: scores[i] >= 4 ? T.green : scores[i] >= 3 ? T.amber : T.red }}>
                  {scores[i]}
                </div>
              </div>
            ))}
            <div style={{ marginTop:12, padding:'10px 14px', background:T.surfaceH, borderRadius:8, fontSize:13 }}>
              Overall maturity: <b style={{ color:T.navy }}>{avg.toFixed(1)} / 5 — {level}</b>
              <div style={{ fontSize:11, color:T.textSec, marginTop:3 }}>
                ECB 2022 thematic review peer median ≈ 2.3 ("Developing") on collateral-specific climate integration —
                fewer than 15% of significant institutions adjusted collateral values for climate at the time.
              </div>
            </div>
          </div>
          <ResponsiveContainer width='100%' height={300}>
            <BarChart data={radar} layout='vertical' margin={{ top:5, right:20, left:110, bottom:5 }}>
              <XAxis type='number' domain={[0, 5]} tick={{ fontSize:10, fill:T.textSec }} />
              <YAxis type='category' dataKey='dim' tick={{ fontSize:10, fill:T.textSec }} width={110} />
              <Tooltip contentStyle={{ fontSize:12 }} />
              <Bar dataKey='score' radius={[0,4,4,0]}>
                {radar.map((e, i) => (
                  <Cell key={i} fill={e.score >= 4 ? T.sage : e.score >= 3 ? T.gold : T.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const ClimateCollateralFrameworkPage = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    'Collateral Register',
    'Physical Risk Overlay',
    'Transition Risk Overlay',
    'Haircut & LTV Engine',
    'LGD & Capital Impact',
    'Regulatory Map',
    'Governance Blueprint',
  ];

  const bookValue = COLLATERAL.reduce((a, c) => a + c.value, 0);
  const bookLoan  = COLLATERAL.reduce((a, c) => a + c.loan, 0);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, padding:'24px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:700, color:T.navy, marginBottom:4 }}>
          Climate-Adjusted Collateral Framework
        </div>
        <div style={{ fontSize:13, color:T.textSec }}>
          Climate risk factor integration into the collateral framework of a lending institution — 9 collateral classes ·
          7 hazards · NGFS-aligned scenarios · climate-adjusted haircuts, LTV, LGD & RWA · ECB E8.4 / EBA LOM §7 / CRR 208-229 / CRR3
        </div>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <Stat label='Collateral Book' value={fmtM(bookValue)} sub='60 items · 9 classes · 20 countries' />
        <Stat label='Secured Lending' value={fmtM(bookLoan)} sub={`Avg LTV ${((bookLoan / bookValue) * 100).toFixed(0)}%`} />
        <Stat label='Physical Hazards' value='7' sub='River/coastal flood → subsidence' />
        <Stat label='Scenarios × Horizons' value='3 × 3' sub='NGFS-aligned · 2030/2040/2050' />
        <Stat label='Regulatory Anchors' value='18' sub='ECB · EBA · CRR/CRR3 · BCBS · PRA · MaRisk' color={T.gold} />
        <Stat label='Peer Benchmark' value='<15%' color={T.amber} sub='SIs adjusting collateral for climate (ECB 2022)' />
      </div>

      <div style={{ display:'flex', gap:4, background:T.surface, border:`1px solid ${T.border}`,
        borderRadius:8, padding:4, marginBottom:20, width:'fit-content', flexWrap:'wrap' }}>
        {tabs.map((t, i) => (
          <Tab key={t} label={t} active={activeTab === i} onClick={() => setActiveTab(i)} />
        ))}
      </div>

      <div>
        {activeTab === 0 && <RegisterTab />}
        {activeTab === 1 && <PhysicalTab />}
        {activeTab === 2 && <TransitionTab />}
        {activeTab === 3 && <EngineTab />}
        {activeTab === 4 && <LgdTab />}
        {activeTab === 5 && <RegulatoryTab />}
        {activeTab === 6 && <GovernanceTab />}
      </div>
    </div>
  );
};

export default ClimateCollateralFrameworkPage;
