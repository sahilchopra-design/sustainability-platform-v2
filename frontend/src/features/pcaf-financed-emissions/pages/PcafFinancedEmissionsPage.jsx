/**
 * PcafFinancedEmissionsPage.jsx
 * ═══════════════════════════════════════════════════════════════════════════════
 * PCAF Financed Emissions, 3rd Edition (Dec 2025) — Part A, 10 asset classes;
 * PCAF Insurance-Associated Emissions (Nov 2022, updated Dec 2025) — Part C;
 * PCAF Facilitated Emissions (Dec 2023) — Part B.
 * 7 Tabs | 28 useState hooks | 60 pre-loaded holdings | 10 PCAF Part A asset classes (3rd Ed.)
 * Framework citations: see data/pcafStandards.js (single source of truth)
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, LineChart, Line, AreaChart, Area, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, Treemap,
} from 'recharts';
import { EMISSION_FACTORS, SECTOR_BENCHMARKS, PCAF_DATA_QUALITY, CARBON_PRICES } from '../../../data/referenceData';
import { SECURITY_UNIVERSE, MOCK_PORTFOLIO } from '../../../data/securityUniverse';
import { getEVIC } from '../../../data/evicService';
import { getReferenceEvicBn, getReferenceRevenueM, getReferenceEntry } from '../../../data/evicReference';
import { generatePortfolioAuditTrail, downloadTrail, stepStatusColor, flagSeverityColor, dqsColor, PCAF_CITATIONS } from '../../../data/pcafAuditTrail';
import { PCAF_PART_A, PCAF_PART_B, PCAF_PART_C, isScope3Required, SCOPE3_ALL_SECTOR_YEAR, sectorRevenueProxyM } from '../../../data/pcafStandards';
import { LOB_FIELDS, calcPolicyEmissions } from '../../../data/pcafInsuranceEngine';
import { loadPortfolio, savePortfolio } from '../../../data/portfolioPersistence';
import { isIndiaMode, adaptForPCAF } from '../../../data/IndiaDataAdapter';
import PortfolioUploader from '../../../components/PortfolioUploader';
import ReportExporter from '../../../components/ReportExporter';
import CurrencyToggle from '../../../components/CurrencyToggle';
import { CDP_COMPANY_EMISSIONS } from '../../../data/publicDataSeed';

/* ═══════════════════════════════════════════════════════════════════════════════
   THEME, PRNG, UTILITIES
   ═══════════════════════════════════════════════════════════════════════════════ */
const T={bg:'#f4f6f9',surface:'#ffffff',surfaceH:'#eef1f6',border:'#e3e8ef',borderL:'#cfd6e0',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
// R3 gap D-1: SFDR PAI cards must report in EUR; this module's underlying
// positions are USD. Illustrative ECB-reference-style rate — replace with a
// live FX feed if/when one is wired in; flagged here rather than silently
// treating USD figures as EUR (the prior bug) or inventing a precise-looking
// "live" rate this module doesn't actually fetch.
const USD_TO_EUR_RATE=0.92;

const PIE_COLORS=['#0ea5e9','#06c896','#f0a828','#a78bfa','#f04060','#38bdf8','#facc15','#34d399','#fb7185','#818cf8','#c084fc','#f472b6'];
const DQS_COLOR={1:T.green,2:'#38bdf8',3:T.amber,4:'#f97316',5:T.red};
const AC_COLORS={
  'Listed Equity':'#0ea5e9','Corporate Bonds':'#06c896','Business Loans':'#22d3ee',
  'Project Finance':'#f0a828','Commercial Real Estate':'#a78bfa','Mortgages':'#f04060',
  'Vehicle Loans':'#38bdf8','Sovereign Debt':'#facc15','Use-of-Proceeds':'#34d399',
  'Securitisations':'#fb7185','Sub-Sovereign':'#818cf8','Undrawn Commitments':'#c084fc',
};
const ALL_ASSET_CLASSES=[
  'Listed Equity','Corporate Bonds','Business Loans','Project Finance',
  'Commercial Real Estate','Mortgages','Vehicle Loans','Sovereign Debt',
  'Use-of-Proceeds','Securitisations','Sub-Sovereign','Undrawn Commitments',
];

const tip={
  contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},
  labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10},
};

function fmt(n,dec=0){
  if(n==null)return '\u2014';
  if(Math.abs(n)>=1e9)return(n/1e9).toFixed(dec||2)+'B';
  if(Math.abs(n)>=1e6)return(n/1e6).toFixed(dec||2)+'M';
  if(Math.abs(n)>=1e3)return(n/1e3).toFixed(dec||1)+'K';
  return n.toFixed(dec);
}
// R3 gap B-6: fixed 2-decimal-place formatting truncates any attribution
// factor below 0.005% to a bare "0.00%" \u2014 indistinguishable from a genuine
// zero (e.g. Apple/Microsoft listed-equity rows, sovereign debt rows).
// Below that threshold, switch to 4 significant figures so a real non-zero
// value (e.g. 0.00089%) stays visible instead of being rounded away.
function fmtPct(n){
  if(n==null)return '\u2014';
  const pct=n*100;
  if(pct!==0&&Math.abs(pct)<0.005)return pct.toPrecision(4)+'%';
  return pct.toFixed(2)+'%';
}
function fmtNum(n){if(n==null)return '\u2014';return n.toLocaleString('en-US',{maximumFractionDigits:2});}
function fmtCcy(n,ccy='$'){return n==null?'\u2014':ccy+fmtNum(n);}

/* ═══════════════════════════════════════════════════════════════════════════════
   PCAF ASSET CLASS DEFINITIONS — Chapter 5 (2nd Ed. core classes); UoP/Securitisations/
   Sub-Sovereign/Undrawn Commitments are 3rd Edition (Dec 2025) additions
   Each entry maps to a specific PCAF chapter and attribution methodology.
   ═══════════════════════════════════════════════════════════════════════════════ */
const ASSET_CLASS_DEFS=[
  {
    ac:'Listed Equity',ch:'5',
    formula:'FE_i = (Outstanding_i / EVIC_i) \u00d7 Company_Emissions_i',
    denom:'Enterprise Value Including Cash (EVIC)',
    note:'EVIC = Market Cap + Total Debt + Preferred Stock + Minority Interest. Attribution factor is proportional to ownership share. Use period-end EVIC.',
    dqsRange:'1-5',
    scopeGuidance:'Scope 1 and 2 required; Scope 3 encouraged for high-impact sectors.',
    dataHierarchy:'1. Verified reported (CDP/GRI) 2. Unverified reported 3. Physical activity 4. Economic activity 5. Proxy estimation',
  },
  {
    ac:'Corporate Bonds',ch:'5',
    formula:'FE_i = (Outstanding_i / EVIC_i) \u00d7 Company_Emissions_i',
    denom:'Enterprise Value Including Cash (EVIC)',
    note:'Same attribution as listed equity. Bond outstanding amount as numerator, not notional. Use market value for fair-value portfolios.',
    dqsRange:'1-5',
    scopeGuidance:'Scope 1 and 2 required. For green bonds, also report use-of-proceeds emissions separately.',
    dataHierarchy:'1. Issuer CDP/GRI 2. Annual report 3. Sector average 4. Revenue proxy 5. Headcount proxy',
  },
  {
    ac:'Business Loans',ch:'5',
    formula:'FE_i = (Outstanding_i / (EVIC_i or Total_E+D_i)) \u00d7 Company_Emissions_i',
    denom:'EVIC (if listed) or Total Equity + Debt (if unlisted)',
    note:'For unlisted borrowers: use total equity + total debt from most recent audited financial statements. If unavailable, use total assets.',
    dqsRange:'1-5',
    scopeGuidance:'Scope 1 and 2 required. For SME loans where data unavailable, use sector-based estimation.',
    dataHierarchy:'1. Company GHG inventory 2. Physical activity data 3. Sector EF \u00d7 revenue 4. Sector EF \u00d7 assets 5. Headcount proxy',
  },
  {
    ac:'Project Finance',ch:'5',
    formula:'FE_i = (Outstanding_i / Total_Project_Cost_i) \u00d7 Project_Emissions_i',
    denom:'Total project cost (equity + debt financing)',
    note:'Attribution = outstanding loan / total project cost. Use project-level emissions from monitoring reports. For construction phase, include embodied emissions.',
    dqsRange:'1-5',
    scopeGuidance:'Project-level Scope 1 and 2. For renewable projects, report lifecycle emissions including manufacturing.',
    dataHierarchy:'1. Direct monitoring 2. Modelled from activity data 3. Grid EF \u00d7 capacity 4. Sector proxy 5. Revenue proxy',
  },
  {
    ac:'Commercial Real Estate',ch:'5',
    formula:'FE_i = (Outstanding_i / Property_Value_i) \u00d7 Building_Emissions_i',
    denom:'Property value (current appraisal or purchase price)',
    note:'Building emissions from EPC ratings, energy audits, or benchmarks. Include Scope 1 (on-site combustion) and Scope 2 (purchased electricity/heating).',
    dqsRange:'1-5',
    scopeGuidance:'Building-level Scope 1 + 2. Apply CRREM methodology for stranding risk.',
    dataHierarchy:'1. Metered energy consumption 2. EPC + floor area 3. Building type benchmark 4. National average 5. Floor area proxy',
  },
  {
    ac:'Mortgages',ch:'5',
    formula:'FE_i = (Outstanding_i / Property_Value_i) \u00d7 Building_Emissions_i',
    denom:'Property value at origination (or latest valuation)',
    note:'EPC to emissions: use national avg kWh/m\u00b2 by rating band \u00d7 floor area \u00d7 grid emission factor. For portfolios, use distribution of EPC ratings.',
    dqsRange:'1-5',
    scopeGuidance:'Per-property Scope 1 + 2 from energy consumption.',
    dataHierarchy:'1. Smart meter data 2. EPC + floor area 3. Postcode-level proxy 4. National avg by type 5. National average',
  },
  {
    ac:'Vehicle Loans',ch:'5',
    formula:'FE_i = (Outstanding_i / Vehicle_Value_i) \u00d7 (CO2_per_km \u00d7 Annual_km)',
    denom:'Vehicle value at origination',
    note:'For ICE: use WLTP CO2/km. For EVs: Scope 1 = 0; Scope 2 = grid EF \u00d7 kWh/km \u00d7 annual km. Default 15,000 km/year.',
    dqsRange:'1-5',
    scopeGuidance:'Vehicle-level Scope 1 (tailpipe) and Scope 2 (electricity for EVs).',
    dataHierarchy:'1. Telematics data 2. Manufacturer CO2/km + annual mileage 3. Vehicle class average 4. National fleet average 5. Proxy',
  },
  {
    ac:'Sovereign Debt',ch:'5 (Sovereign Debt Standard, separate publication)',
    formula:'FE_i = (Outstanding_i / PPP_GDP_i) \u00d7 Sovereign_Emissions_i',
    denom:'Purchasing Power Parity adjusted GDP',
    note:'Use production-based accounting (territory principle). Source: UNFCCC National Inventory Reports or World Bank WDI.',
    dqsRange:'1-3',
    scopeGuidance:'National-level GHG inventory (all sectors). Separate from LULUCF.',
    dataHierarchy:'1. UNFCCC NIR 2. National report 3. WB/IMF estimates',
  },
  {
    ac:'Use-of-Proceeds',ch:'3rdEd',
    formula:'FE_i = (Outstanding_i / Total_Bond_Issuance_i) \u00d7 Proceeds_Emissions_i',
    denom:'Total bond issuance amount',
    note:'Green/social/sustainability bonds. Track use of proceeds allocation. Apply emissions per project category.',
    dqsRange:'1-5',
    scopeGuidance:'Project-level emissions from impact reports. Report avoided vs. actual emissions separately.',
    dataHierarchy:'1. Issuer impact report 2. Project monitoring 3. Sector average 4. Proxy 5. No data',
  },
  {
    ac:'Securitisations',ch:'3rdEd',
    formula:'FE_i = (Tranche_Outstanding / Pool_Value) \u00d7 Pool_Emissions',
    denom:'Total securitisation pool value',
    note:'Look through to underlying assets where possible. For RMBS: use mortgage methodology. For ABS: use relevant asset class.',
    dqsRange:'3-5',
    scopeGuidance:'Underlying asset-level emissions aggregated to pool level.',
    dataHierarchy:'1. Full look-through 2. Pool-level average 3. Sector proxy 4. National average 5. No data',
  },
  {
    ac:'Sub-Sovereign',ch:'3rdEd',
    formula:'FE_i = (Outstanding / Total_Entity_Debt) \u00d7 Entity_Emissions',
    denom:'Total debt of sub-sovereign entity',
    note:'Municipal/state bonds. Use entity-level GHG data where available, or pro-rata from national.',
    dqsRange:'2-5',
    scopeGuidance:'Entity-level or proportional national emissions.',
    dataHierarchy:'1. Entity GHG report 2. State/regional inventory 3. Pro-rata national 4. Proxy 5. No data',
  },
  {
    ac:'Undrawn Commitments',ch:'3rdEd',
    formula:'FE_undrawn = CCF \u00d7 Committed_Amount \u00d7 (1/EVIC) \u00d7 Emissions',
    denom:'Credit Conversion Factor \u00d7 Commitment',
    note:'CCF typically 0-100% based on facility type (revolving, term). PCAF recommends reporting undrawn separately from drawn. CCF reflects expected drawdown probability.',
    dqsRange:'3-5',
    scopeGuidance:'Apply same scope guidance as underlying asset class, adjusted by CCF.',
    dataHierarchy:'1. Client GHG data + CCF 2. Sector EF + standard CCF 3. Basel CCF 4. Proxy 5. No data',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTOR MEDIAN EVIC + COUNTRY PPP GDP FOR SOVEREIGN CALCULATION
   Sources: S&P Capital IQ sector medians 2024, IMF WEO Apr 2025
   ═══════════════════════════════════════════════════════════════════════════════ */
const SECTOR_MEDIAN_EVIC={
  Technology:500,'Electric Utilities':60,'Oil & Gas':150,Mining:80,Steel:25,
  Cement:20,Automotive:100,Chemicals:45,Shipping:15,Aviation:30,Industrials:65,
  Retail:35,Infrastructure:40,Renewables:25,Residential:null,'Real Estate':30,
  Sovereign:null,default:50,
};

const COUNTRY_PPP_GDP={
  US:26950,GB:3340,DE:4590,FR:3130,JP:4410,AU:1580,BR:3460,
  CH:780,NL:1120,SE:640,DK:410,NO:480,IN:13150,KR:2840,
  TW:1410,VN:1120,ID:3920,ET:310,KZ:530,CL:560,MZ:42,LU:88,
  default:2000,
};

const COUNTRY_EMISSIONS={
  US:5222000000,GB:326000000,DE:674000000,FR:312000000,JP:1064000000,
  AU:397000000,BR:1020000000,CH:37000000,NL:142000000,SE:37000000,
  default:200000000,
};

/* ═══════════════════════════════════════════════════════════════════════════════
   60-POSITION PORTFOLIO — 12 Asset Classes
   PCAF Financed Emissions, 3rd Edition (Dec 2025) — representative multi-asset FI portfolio
   UNIT CONVENTION: evic=$Bn, outstanding=$M, scope1/2/3 in tCO2e
   ═══════════════════════════════════════════════════════════════════════════════ */
const BASE_POSITIONS=[
  // ── Listed Equity (20 positions) ── PCAF Ch.5 ──
  {id:1,name:'Apple Inc',ticker:'AAPL',country:'US',geo:'Americas',assetClass:'Listed Equity',sector:'Technology',evic:2740,outstanding:18.4,scope1:22100,scope2:11800,scope3:28400000,dqs:2,source:'CDP A-List 2023',currency:'USD'},
  {id:2,name:'Microsoft Corp',ticker:'MSFT',country:'US',geo:'Americas',assetClass:'Listed Equity',sector:'Technology',evic:2910,outstanding:22.1,scope1:14200,scope2:8400,scope3:14000000,dqs:2,source:'CDP A-List 2023',currency:'USD'},
  {id:3,name:'Shell plc',ticker:'SHEL',country:'GB',geo:'EMEA',assetClass:'Listed Equity',sector:'Oil & Gas',evic:245,outstanding:31.2,scope1:48200000,scope2:20200000,scope3:1200000000,dqs:1,source:'Shell Annual Report 2023',currency:'GBP'},
  {id:4,name:'TotalEnergies SE',ticker:'TTE',country:'FR',geo:'EMEA',assetClass:'Listed Equity',sector:'Oil & Gas',evic:178,outstanding:24.6,scope1:33100000,scope2:20100000,scope3:950000000,dqs:1,source:'TotalEnergies Sustainability 2023',currency:'EUR'},
  {id:5,name:'BASF SE',ticker:'BAS',country:'DE',geo:'EMEA',assetClass:'Listed Equity',sector:'Chemicals',evic:48,outstanding:12.8,scope1:16800000,scope2:5000000,scope3:78000000,dqs:2,source:'BASF CDP Response 2023',currency:'EUR'},
  {id:6,name:'BHP Group',ticker:'BHP',country:'AU',geo:'APAC',assetClass:'Listed Equity',sector:'Mining',evic:168,outstanding:19.3,scope1:28100000,scope2:14200000,scope3:320000000,dqs:1,source:'BHP Climate Report 2023',currency:'AUD'},
  {id:7,name:'Vale S.A.',ticker:'VALE',country:'BR',geo:'Americas',assetClass:'Listed Equity',sector:'Mining',evic:72,outstanding:15.7,scope1:11200000,scope2:6700000,scope3:210000000,dqs:2,source:'Vale CDP 2023',currency:'BRL'},
  {id:8,name:'Nippon Steel Corp',ticker:'5401',country:'JP',geo:'APAC',assetClass:'Listed Equity',sector:'Steel',evic:31,outstanding:8.9,scope1:48200000,scope2:10500000,scope3:46000000,dqs:3,source:'Nippon Steel CSR 2023',currency:'JPY'},
  {id:9,name:'Rio Tinto plc',ticker:'RIO',country:'GB',geo:'EMEA',assetClass:'Listed Equity',sector:'Mining',evic:98,outstanding:14.1,scope1:21400000,scope2:9800000,scope3:280000000,dqs:1,source:'Rio Tinto Climate Report 2023',currency:'GBP'},
  {id:10,name:'Glencore plc',ticker:'GLEN',country:'CH',geo:'EMEA',assetClass:'Listed Equity',sector:'Mining',evic:94,outstanding:17.6,scope1:24600000,scope2:13500000,scope3:350000000,dqs:2,source:'Glencore Responsibility 2023',currency:'CHF'},
  {id:11,name:'ExxonMobil Corp',ticker:'XOM',country:'US',geo:'Americas',assetClass:'Listed Equity',sector:'Oil & Gas',evic:388,outstanding:27.8,scope1:68000000,scope2:34000000,scope3:1400000000,dqs:2,source:'ExxonMobil CDP 2023',currency:'USD'},
  {id:12,name:'Chevron Corp',ticker:'CVX',country:'US',geo:'Americas',assetClass:'Listed Equity',sector:'Oil & Gas',evic:298,outstanding:21.4,scope1:42100000,scope2:21600000,scope3:890000000,dqs:2,source:'Chevron CDP 2023',currency:'USD'},
  {id:13,name:'ArcelorMittal SA',ticker:'MT',country:'LU',geo:'EMEA',assetClass:'Listed Equity',sector:'Steel',evic:28,outstanding:11.4,scope1:58400000,scope2:14500000,scope3:62000000,dqs:3,source:'ArcelorMittal CDP 2023',currency:'EUR'},
  {id:14,name:'HeidelbergCement AG',ticker:'HEI',country:'DE',geo:'EMEA',assetClass:'Listed Equity',sector:'Cement',evic:22,outstanding:9.4,scope1:44200000,scope2:14100000,scope3:18000000,dqs:2,source:'Heidelberg CDP 2023',currency:'EUR'},
  {id:15,name:'LafargeHolcim Ltd',ticker:'HOLN',country:'CH',geo:'EMEA',assetClass:'Listed Equity',sector:'Cement',evic:31,outstanding:11.2,scope1:58600000,scope2:17800000,scope3:22000000,dqs:2,source:'Holcim Sustainability 2023',currency:'CHF'},
  {id:16,name:'Toyota Motor Corp',ticker:'7203',country:'JP',geo:'APAC',assetClass:'Listed Equity',sector:'Automotive',evic:312,outstanding:19.7,scope1:12400000,scope2:6200000,scope3:480000000,dqs:1,source:'Toyota CDP 2023',currency:'JPY'},
  {id:17,name:'Volkswagen AG',ticker:'VOW3',country:'DE',geo:'EMEA',assetClass:'Listed Equity',sector:'Automotive',evic:84,outstanding:13.2,scope1:16200000,scope2:7900000,scope3:520000000,dqs:2,source:'VW CDP 2023',currency:'EUR'},
  {id:18,name:'Samsung Electronics',ticker:'005930',country:'KR',geo:'APAC',assetClass:'Listed Equity',sector:'Technology',evic:276,outstanding:16.4,scope1:9800000,scope2:5000000,scope3:42000000,dqs:2,source:'Samsung CDP 2023',currency:'KRW'},
  {id:19,name:'BP plc',ticker:'BP',country:'GB',geo:'EMEA',assetClass:'Listed Equity',sector:'Oil & Gas',evic:134,outstanding:18.9,scope1:31200000,scope2:13600000,scope3:820000000,dqs:1,source:'BP Sustainability 2023',currency:'GBP'},
  {id:20,name:'Equinor ASA',ticker:'EQNR',country:'NO',geo:'EMEA',assetClass:'Listed Equity',sector:'Oil & Gas',evic:102,outstanding:14.6,scope1:21800000,scope2:9800000,scope3:640000000,dqs:1,source:'Equinor CDP 2023',currency:'NOK'},
  // ── Corporate Bonds (12 positions) ── PCAF Ch.5 ──
  {id:21,name:'Ford Motor 7.45% 2031',ticker:'F',country:'US',geo:'Americas',assetClass:'Corporate Bonds',sector:'Automotive',evic:54,outstanding:14.2,scope1:4200000,scope2:2140000,scope3:180000000,dqs:3,source:'Ford CDP 2023',currency:'USD'},
  {id:22,name:'EDF Green Bond 1.625% 2030',ticker:'EDF',country:'FR',geo:'EMEA',assetClass:'Corporate Bonds',sector:'Electric Utilities',evic:89,outstanding:20.4,scope1:28400000,scope2:14300000,scope3:32000000,dqs:2,source:'EDF Sustainability 2023',currency:'EUR'},
  {id:23,name:'Petrobras 6.9% 2049',ticker:'PBR',country:'BR',geo:'Americas',assetClass:'Corporate Bonds',sector:'Oil & Gas',evic:115,outstanding:9.8,scope1:16200000,scope2:8400000,scope3:420000000,dqs:3,source:'Petrobras CDP 2023',currency:'USD'},
  {id:24,name:'Maersk 2.5% 2030',ticker:'MAERSK',country:'DK',geo:'EMEA',assetClass:'Corporate Bonds',sector:'Shipping',evic:21,outstanding:8.4,scope1:7200000,scope2:3600000,scope3:14000000,dqs:3,source:'Maersk CDP 2023',currency:'DKK'},
  {id:25,name:'Delta Air Lines 7% 2025',ticker:'DAL',country:'US',geo:'Americas',assetClass:'Corporate Bonds',sector:'Aviation',evic:19,outstanding:6.1,scope1:8400000,scope2:3000000,scope3:16000000,dqs:3,source:'Delta CDP 2023',currency:'USD'},
  {id:26,name:'Lufthansa 3.5% 2028',ticker:'LHA',country:'DE',geo:'EMEA',assetClass:'Corporate Bonds',sector:'Aviation',evic:14,outstanding:5.8,scope1:6200000,scope2:2700000,scope3:12000000,dqs:3,source:'Lufthansa CDP 2023',currency:'EUR'},
  {id:27,name:'BMW AG 0.75% 2030',ticker:'BMW',country:'DE',geo:'EMEA',assetClass:'Corporate Bonds',sector:'Automotive',evic:67,outstanding:11.8,scope1:3100000,scope2:1660000,scope3:95000000,dqs:2,source:'BMW CDP 2023',currency:'EUR'},
  {id:28,name:'Siemens AG 0.375% 2027',ticker:'SIE',country:'DE',geo:'EMEA',assetClass:'Corporate Bonds',sector:'Industrials',evic:98,outstanding:13.4,scope1:1420000,scope2:720000,scope3:28000000,dqs:2,source:'Siemens CDP 2023',currency:'EUR'},
  {id:29,name:'Schneider Electric 1.5% 2028',ticker:'SU',country:'FR',geo:'EMEA',assetClass:'Corporate Bonds',sector:'Industrials',evic:84,outstanding:11.6,scope1:580000,scope2:310000,scope3:18000000,dqs:2,source:'Schneider CDP 2023',currency:'EUR'},
  {id:30,name:'Tata Steel 5.45% 2028',ticker:'TATASTEEL',country:'IN',geo:'APAC',assetClass:'Corporate Bonds',sector:'Steel',evic:16,outstanding:8.7,scope1:28400000,scope2:10700000,scope3:42000000,dqs:4,source:'Revenue proxy \u2014 Trucost',currency:'INR'},
  {id:31,name:'IKEA bonds 1.5% 2027',ticker:'IKEA',country:'SE',geo:'EMEA',assetClass:'Corporate Bonds',sector:'Retail',evic:null,outstanding:9.2,scope1:820000,scope2:420000,scope3:6400000,dqs:4,source:'Revenue proxy \u2014 EF database',currency:'SEK'},
  {id:32,name:'H&M bonds 0.25% 2024',ticker:'HMB',country:'SE',geo:'EMEA',assetClass:'Corporate Bonds',sector:'Retail',evic:null,outstanding:6.4,scope1:540000,scope2:240000,scope3:4200000,dqs:4,source:'Revenue proxy \u2014 EF database',currency:'SEK'},
  // ── Project Finance (8 positions) ── PCAF Ch.5 ──
  {id:33,name:'North Sea Wind Farm (1.2 GW)',ticker:null,country:'GB',geo:'EMEA',assetClass:'Project Finance',sector:'Renewables',evic:null,outstanding:480,scope1:8400,scope2:4000,scope3:62000,dqs:3,source:'Project monitoring report 2023',currency:'GBP',projectCost:1200},
  {id:34,name:'Solar Farm \u2014 Vietnam (320 MW)',ticker:null,country:'VN',geo:'APAC',assetClass:'Project Finance',sector:'Renewables',evic:null,outstanding:210,scope1:4200,scope2:2600,scope3:28000,dqs:4,source:'Physical proxy \u2014 GEF grid factor',currency:'USD',projectCost:580},
  {id:35,name:'Coal-to-Gas Transition \u2014 Indonesia',ticker:null,country:'ID',geo:'APAC',assetClass:'Project Finance',sector:'Electric Utilities',evic:null,outstanding:340,scope1:2840000,scope2:1440000,scope3:4200000,dqs:4,source:'Physical proxy \u2014 IEA EF',currency:'USD',projectCost:920},
  {id:36,name:'Wastewater Treatment \u2014 Brazil',ticker:null,country:'BR',geo:'Americas',assetClass:'Project Finance',sector:'Infrastructure',evic:null,outstanding:85,scope1:21200,scope2:10000,scope3:48000,dqs:4,source:'Physical proxy \u2014 IPCC CH4 EF',currency:'BRL',projectCost:240},
  {id:37,name:'Offshore Wind \u2014 Taiwan Strait (400MW)',ticker:null,country:'TW',geo:'APAC',assetClass:'Project Finance',sector:'Renewables',evic:null,outstanding:310,scope1:5800,scope2:2800,scope3:42000,dqs:3,source:'Project monitoring report 2023',currency:'TWD',projectCost:860},
  {id:38,name:'Hydro Dam \u2014 Ethiopia (2 GW)',ticker:null,country:'ET',geo:'EMEA',assetClass:'Project Finance',sector:'Renewables',evic:null,outstanding:680,scope1:2200,scope2:1000,scope3:8400,dqs:5,source:'Headcount proxy \u2014 limited data',currency:'USD',projectCost:4800},
  {id:39,name:'Gas Pipeline \u2014 Kazakhstan',ticker:null,country:'KZ',geo:'EMEA',assetClass:'Project Finance',sector:'Oil & Gas',evic:null,outstanding:430,scope1:1940000,scope2:1000000,scope3:6200000,dqs:5,source:'Revenue proxy \u2014 IEA EF',currency:'USD',projectCost:1800},
  {id:40,name:'Solar + Storage \u2014 Chile (600 MW)',ticker:null,country:'CL',geo:'Americas',assetClass:'Project Finance',sector:'Renewables',evic:null,outstanding:390,scope1:9200,scope2:5000,scope3:52000,dqs:3,source:'Project monitoring report 2023',currency:'USD',projectCost:1100},
  // ── Commercial Real Estate (5 positions) ── PCAF Ch.5 ──
  {id:41,name:'Canary Wharf Office Complex, London',ticker:null,country:'GB',geo:'EMEA',assetClass:'Commercial Real Estate',sector:'Real Estate',evic:null,outstanding:620,scope1:12400,scope2:6000,scope3:84000,dqs:3,source:'EPC + energy audit 2023',currency:'GBP',propertyValue:900,sqm:42000,epcRating:'B'},
  {id:42,name:'Schiphol Logistics Hub, Amsterdam',ticker:null,country:'NL',geo:'EMEA',assetClass:'Commercial Real Estate',sector:'Real Estate',evic:null,outstanding:310,scope1:6200,scope2:3000,scope3:42000,dqs:4,source:'CRREM physical proxy',currency:'EUR',propertyValue:480,sqm:28000,epcRating:'C'},
  {id:43,name:'La D\u00e9fense Mixed-Use, Paris',ticker:null,country:'FR',geo:'EMEA',assetClass:'Commercial Real Estate',sector:'Real Estate',evic:null,outstanding:480,scope1:9800,scope2:4800,scope3:68000,dqs:3,source:'DPE audit 2023',currency:'EUR',propertyValue:720,sqm:35000,epcRating:'B'},
  {id:44,name:'Midtown Manhattan Office Tower, NYC',ticker:null,country:'US',geo:'Americas',assetClass:'Commercial Real Estate',sector:'Real Estate',evic:null,outstanding:740,scope1:14800,scope2:7300,scope3:102000,dqs:3,source:'LL97 disclosure 2023',currency:'USD',propertyValue:1200,sqm:55000,epcRating:'A'},
  {id:45,name:'Tokyo Grade-A Office, Shinjuku',ticker:null,country:'JP',geo:'APAC',assetClass:'Commercial Real Estate',sector:'Real Estate',evic:null,outstanding:560,scope1:11200,scope2:5600,scope3:78000,dqs:4,source:'CASBEE proxy estimate',currency:'JPY',propertyValue:840,sqm:38000,epcRating:'B'},
  // ── Mortgages (5 positions) ── PCAF Ch.5 ──
  {id:46,name:'UK Residential Mortgage Portfolio',ticker:null,country:'GB',geo:'EMEA',assetClass:'Mortgages',sector:'Residential',evic:null,outstanding:2400,scope1:128000,scope2:61000,scope3:0,dqs:4,source:'EPC distribution proxy',currency:'GBP',avgPropertyValue:380,loanCount:8200,avgEPC:'D'},
  {id:47,name:'Dutch Mortgage Book (NHG-backed)',ticker:null,country:'NL',geo:'EMEA',assetClass:'Mortgages',sector:'Residential',evic:null,outstanding:1840,scope1:92000,scope2:42000,scope3:0,dqs:4,source:'RVO NL EPC proxy 2023',currency:'EUR',avgPropertyValue:420,loanCount:5400,avgEPC:'C'},
  {id:48,name:'French Immobilier Portfolio',ticker:null,country:'FR',geo:'EMEA',assetClass:'Mortgages',sector:'Residential',evic:null,outstanding:1210,scope1:64000,scope2:34600,scope3:0,dqs:5,source:'DPE distribution proxy',currency:'EUR',avgPropertyValue:310,loanCount:4200,avgEPC:'D'},
  {id:49,name:'US Conforming Mortgage Pool (GSE)',ticker:null,country:'US',geo:'Americas',assetClass:'Mortgages',sector:'Residential',evic:null,outstanding:3800,scope1:192000,scope2:92000,scope3:0,dqs:5,source:'ENERGY STAR proxy \u2014 headcount',currency:'USD',avgPropertyValue:440,loanCount:9800,avgEPC:'N/A'},
  {id:50,name:'Australian Residential Book',ticker:null,country:'AU',geo:'APAC',assetClass:'Mortgages',sector:'Residential',evic:null,outstanding:920,scope1:48200,scope2:24200,scope3:0,dqs:4,source:'NatHERS rating proxy',currency:'AUD',avgPropertyValue:580,loanCount:2100,avgEPC:'5-star'},
  // ── Vehicle Loans (3 positions) ── PCAF Ch.5 ──
  {id:51,name:'UK Auto Loan Pool \u2014 ICE Fleet',ticker:null,country:'GB',geo:'EMEA',assetClass:'Vehicle Loans',sector:'Automotive',evic:null,outstanding:420,scope1:184000,scope2:0,scope3:0,dqs:4,source:'DVLA avg CO2/km \u00d7 15k km/yr',currency:'GBP',vehicleCount:14200,avgCO2km:142,avgMileage:15000,avgVehicleValue:35},
  {id:52,name:'EU EV Financing Portfolio',ticker:null,country:'DE',geo:'EMEA',assetClass:'Vehicle Loans',sector:'Automotive',evic:null,outstanding:280,scope1:0,scope2:42000,scope3:0,dqs:3,source:'Manufacturer CO2/km = 0; grid EF',currency:'EUR',vehicleCount:8400,avgCO2km:0,avgMileage:12000,avgVehicleValue:42},
  {id:53,name:'US Light-Truck Loan Pool',ticker:null,country:'US',geo:'Americas',assetClass:'Vehicle Loans',sector:'Automotive',evic:null,outstanding:640,scope1:312000,scope2:0,scope3:0,dqs:4,source:'EPA avg 242 gCO2/mi \u00d7 12k mi/yr',currency:'USD',vehicleCount:18600,avgCO2km:150,avgMileage:19200,avgVehicleValue:42},
  // ── Sovereign Debt (3 positions) ── PCAF Ch.5 (Sovereign Debt Standard) ──
  {id:54,name:'UK Gilt 1.5% 2047',ticker:null,country:'GB',geo:'EMEA',assetClass:'Sovereign Debt',sector:'Sovereign',evic:null,outstanding:180,scope1:326000000,scope2:0,scope3:0,dqs:2,source:'UNFCCC NIR 2023',currency:'GBP'},
  {id:55,name:'US Treasury 4.25% 2034',ticker:null,country:'US',geo:'Americas',assetClass:'Sovereign Debt',sector:'Sovereign',evic:null,outstanding:240,scope1:5222000000,scope2:0,scope3:0,dqs:2,source:'EPA GHG Inventory 2023',currency:'USD'},
  {id:56,name:'German Bund 0.5% 2030',ticker:null,country:'DE',geo:'EMEA',assetClass:'Sovereign Debt',sector:'Sovereign',evic:null,outstanding:160,scope1:674000000,scope2:0,scope3:0,dqs:2,source:'UBA Germany NIR 2023',currency:'EUR'},
  // ── Use-of-Proceeds (2 positions) ── PCAF 3rd Ed. (Dec 2025) ──
  {id:57,name:'World Bank Green Bond 2.5% 2028',ticker:null,country:'US',geo:'Americas',assetClass:'Use-of-Proceeds',sector:'Infrastructure',evic:null,outstanding:120,scope1:42000,scope2:18000,scope3:0,dqs:3,source:'World Bank Green Bond Impact Report 2023',currency:'USD',totalBondSize:2000},
  {id:58,name:'EIB Climate Awareness Bond 0.5% 2029',ticker:null,country:'LU',geo:'EMEA',assetClass:'Use-of-Proceeds',sector:'Renewables',evic:null,outstanding:95,scope1:28000,scope2:12000,scope3:0,dqs:3,source:'EIB CAB Impact Report 2023',currency:'EUR',totalBondSize:1500},
  // ── Securitisations (1 position) ── PCAF 3rd Ed. (Dec 2025) ──
  {id:59,name:'RMBS Pool \u2014 UK Prime Mortgages',ticker:null,country:'GB',geo:'EMEA',assetClass:'Securitisations',sector:'Residential',evic:null,outstanding:340,scope1:68000,scope2:32000,scope3:0,dqs:5,source:'Look-through to underlying EPC data',currency:'GBP',poolValue:1800},
  // ── Undrawn Commitments (1 position) ── PCAF 3rd Ed. (Dec 2025, optional) ──
  {id:60,name:'Revolving Credit Facility \u2014 Diversified Ind.',ticker:null,country:'US',geo:'Americas',assetClass:'Undrawn Commitments',sector:'Industrials',evic:65,outstanding:200,scope1:1420000,scope2:680000,scope3:12000000,dqs:4,source:'Sector-avg EF; CCF=75%',currency:'USD',ccf:0.75,committedAmount:800},
];
// ── Wire real CDP emissions for PCAF calculations (GAP-001) ──────────────
const _CDP_PCAF = Object.fromEntries((CDP_COMPANY_EMISSIONS||[]).map(c=>[c.name?.toLowerCase(),c]));
const _CDP_TICKER_PCAF = Object.fromEntries((CDP_COMPANY_EMISSIONS||[]).map(c=>[c.ticker?.toLowerCase(),c]));
// Override synthetic GHG values with real CDP data where company names match
(typeof BASE_POSITIONS!=='undefined'?BASE_POSITIONS:[]).forEach(h=>{
  const key = (h.company||h.name||'').toLowerCase();
  const cdp = _CDP_PCAF[key] || _CDP_TICKER_PCAF[(h.ticker||'').toLowerCase()] || Object.values(_CDP_PCAF).find(c=>key.includes(c.name?.toLowerCase()?.split(' ')[0]||'___'));
  if(cdp){
    h.scope1Kt = Math.round((cdp.scope1_mtco2e||0)*1000);
    h.scope2Kt = Math.round((cdp.scope2_market_mtco2e||0)*1000);
    h.totalEmissionsKt = Math.round((cdp.scope1_2_total_mtco2e||0)*1000);
    h.ghgIntensity = cdp.ghg_intensity;
    h.cdpDisclosed = true;
    h.cdpDataYear = cdp.data_year;
  }
});

// ── India Dataset Integration ──
const _INDIA_PCAF = isIndiaMode() ? adaptForPCAF().slice(0, 30).map((c, i) => ({
  id: i + 1, name: c.name, ticker: c.ticker, country: 'IN', geo: 'APAC',
  assetClass: 'Listed Equity', sector: c.sector, evic: c.evic / 1e9,
  outstanding: c.marketCap / 1e6 * 0.02, scope1: c.scope1, scope2: c.scope2, scope3: c.scope3,
  dqs: c.dqs, source: c.dataSource, currency: 'INR',
})) : null;
if (_INDIA_PCAF) BASE_POSITIONS.splice(0, 20, ..._INDIA_PCAF);

/* ═══════════════════════════════════════════════════════════════════════════════
   INSURANCE PORTFOLIO — Part C (PCAF IAE Standard, Nov 2022, updated Dec 2025)
   8 Lines of Business with full sector emission factor references
   ═══════════════════════════════════════════════════════════════════════════════ */
// R3 gap B-3: motor, property, commercial, reinsurance, and project
// insurance now carry the physical/financial inputs the shared PCAF IAE
// calculator (data/pcafInsuranceEngine.js \u2014 ported verbatim from the India
// BRSR module, confirmed by the R3 review as the best methodology on the
// platform) needs to compute real PCAF-attributed emissions, replacing the
// GWP x flat-sector-EF formula that produced totals 3-4 orders of magnitude
// too low. `efPerPremium`/`efSource` are kept only for Life/Health/Marine,
// none of which the shared engine (or PCAF's IAE Standard) covers \u2014 Marine
// has no documented PCAF methodology at all (unlike Life/Health, which the
// Standard explicitly excludes), so it stays on the old non-PCAF proxy,
// clearly labeled, rather than inventing an unverified formula for it.
const INSURANCE_LOB=[
  {id:1,lob:'Motor',subLob:'Private & Commercial Motor',premiumM:1420,claimsM:980,exposureM:8400,
   dqs:3,vehicle_count:900000,fuel_type:'petrol',annual_km_per_vehicle:14000,
   notes:'Direct auto insurance; PCAF IAE vehicle-count x fuel-type EF x annual km methodology (ported from the India BRSR module)',
   methodology:'PCAF IAE Standard: FE = vehicle_count x annual_km x fuel-type emission factor (kgCO2/km) / 1000.',
   riskFactors:'Physical risk: flood/hail damage increasing claims frequency. Transition risk: ICE fleet depreciation as EV adoption accelerates.'},
  {id:2,lob:'Property',subLob:'Residential & SME Property',premiumM:2100,claimsM:1340,exposureM:14200,
   dqs:4,insured_property_area_m2:210000000,epc_rating:'C',
   notes:'Home & commercial property; PCAF IAE building-area x EPC-band emission factor methodology (ported from the India BRSR module)',
   methodology:'PCAF IAE Standard: FE = insured floor area (m2) x EPC-band emission factor.',
   riskFactors:'Physical risk: increasing flood, windstorm, wildfire losses. Transition risk: EPC min standards may reduce insurable stock.'},
  {id:3,lob:'Commercial',subLob:'General Liability & PI',premiumM:3400,claimsM:1820,exposureM:22000,
   dqs:4,insured_revenue_musd:170000,
   notes:'General liability, workers comp, professional indemnity across multiple sectors; PCAF IAE revenue-based sector EF methodology (ported from the India BRSR module)',
   methodology:'PCAF IAE Standard: FE = insured revenue x sector emission factor.',
   riskFactors:'Liability risk: increasing climate litigation. D&O exposure for greenwashing and climate disclosure failures.'},
  {id:4,lob:'Life',subLob:'Term & Whole Life',premiumM:4800,claimsM:2100,exposureM:42000,
   efPerPremium:0.08,efSource:'Out of PCAF IAE scope \u2014 illustrative proxy only',dqs:5,
   notes:'Term & whole life; minimal direct emissions link; mainly investment portfolio emissions',
   methodology:'Low EF reflects weak causal link between life insurance and GHG emissions. Investment-side emissions reported separately under Part A.',
   riskFactors:'Mortality risk from extreme heat events. Longevity risk changes from climate-driven health impacts.'},
  {id:5,lob:'Health',subLob:'Medical & Dental',premiumM:2200,claimsM:1640,exposureM:12000,
   efPerPremium:0.05,efSource:'Out of PCAF IAE scope \u2014 illustrative proxy only',dqs:5,
   notes:'Medical & dental insurance; healthcare sector has low-to-moderate direct emissions',
   methodology:'EF from healthcare sector energy intensity. Primarily Scope 2 (hospital electricity).',
   riskFactors:'Climate-driven health impacts: heat stress, vector-borne diseases, air quality.'},
  {id:6,lob:'Reinsurance',subLob:'Property Cat & Specialty',premiumM:1800,claimsM:1200,exposureM:18000,
   dqs:4,ceded_premium_musd:1800,cedent_total_gwp_musd:18000,cedent_reported_tco2e:3000000,
   notes:'Property cat & specialty treaty reinsurance; PCAF IAE ceded-premium share of cedent-reported emissions methodology (ported from the India BRSR module; Dec 2025 update)',
   methodology:'PCAF IAE Standard (Dec 2025 update): FE = (ceded premium / cedent total GWP) x cedent-reported tCO2e.',
   riskFactors:'Nat cat severity increasing: Swiss Re estimates 5-7% annual loss trend increase from climate change.'},
  {id:7,lob:'Project Insurance',subLob:'Construction All-Risk & DSU',premiumM:680,claimsM:340,exposureM:6200,
   dqs:4,sum_insured_musd:5440,total_project_cost_musd:7600,project_scope1_tco2e:850000,
   notes:'Construction all-risk, delay in start-up, PI for infrastructure and energy projects; PCAF IAE sum-insured share of project Scope 1 methodology (ported from the India BRSR module; Dec 2025 update)',
   methodology:'PCAF IAE Standard (Dec 2025 update): FE = (sum insured / total project cost) x project Scope 1 emissions.',
   riskFactors:'Physical risk during construction: extreme weather delays. Stranded asset risk for fossil fuel projects.'},
  {id:8,lob:'Marine',subLob:'Hull, Cargo & P&I',premiumM:920,claimsM:580,exposureM:8400,
   efPerPremium:0.89,efSource:'Platform methodology (not PCAF-defined) \u2014 IMO shipping avg; PCAF has no documented IAE methodology for marine lines',dqs:3,
   notes:'Hull & cargo; IMO MEPC.352(78) CII reference; highest EF of all LOBs',
   methodology:'EF derived from IMO Fourth GHG Study (2020). Marine sector avg tCO2e per premium dollar based on global fleet fuel consumption.',
   riskFactors:'Regulatory risk: IMO decarbonisation targets (50% by 2050). Fuel transition costs: LNG/methanol/ammonia.'},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   FACILITATED EMISSIONS — Part C (Chapter 6)
   7 Deal Types with full attribution methodology
   ═══════════════════════════════════════════════════════════════════════════════ */
const FACILITATED_DEALS=[
  {id:1,type:'Bond Underwriting',client:'TotalEnergies SE',sector:'Oil & Gas',dealSizeM:4200,underwrittenM:840,clientScope1:33100000,clientScope2:20100000,clientScope3:950000000,attrFormula:'Underwritten / Deal Size',citation:'PCAF Standard, Part B \u2014 Facilitated Emissions (Dec 2023)',dqs:2,year:2023,bookRunner:'Joint',peerGroup:'Bulge bracket syndicate of 6 banks'},
  {id:2,type:'IPO',client:'Acme Renewables Ltd',sector:'Renewables',dealSizeM:1800,underwrittenM:360,clientScope1:28000,clientScope2:14000,clientScope3:42000,attrFormula:'Underwritten / Deal Size',citation:'PCAF Standard, Part B \u2014 Facilitated Emissions (Dec 2023)',dqs:3,year:2024,bookRunner:'Lead',peerGroup:'Lead left + 2 co-managers'},
  {id:3,type:'Equity Placement',client:'BHP Group',sector:'Mining',dealSizeM:2400,underwrittenM:600,clientScope1:28100000,clientScope2:14200000,clientScope3:320000000,attrFormula:'Placed / Deal Size',citation:'PCAF Standard, Part B \u2014 Facilitated Emissions (Dec 2023)',dqs:2,year:2023,bookRunner:'Joint',peerGroup:'3-bank syndicate'},
  {id:4,type:'Syndicated Loan',client:'ArcelorMittal SA',sector:'Steel',dealSizeM:3600,underwrittenM:720,clientScope1:58400000,clientScope2:14500000,clientScope3:62000000,attrFormula:'Committed / Total Facility',citation:'PCAF Standard, Part B \u2014 Facilitated Emissions (Dec 2023)',dqs:3,year:2023,bookRunner:'MLA',peerGroup:'Syndicate of 8 banks'},
  {id:5,type:'Securitisation',client:'UK RMBS Originator',sector:'Real Estate',dealSizeM:2800,underwrittenM:560,clientScope1:840000,clientScope2:400000,clientScope3:0,attrFormula:'Tranche / Pool Value',citation:'PCAF Standard, Part B \u2014 Facilitated Emissions (Dec 2023)',dqs:4,year:2024,bookRunner:'Structuring Agent',peerGroup:'Sole arranger'},
  {id:6,type:'Convertible Bond',client:'Volkswagen AG',sector:'Automotive',dealSizeM:1400,underwrittenM:420,clientScope1:16200000,clientScope2:7900000,clientScope3:520000000,attrFormula:'Underwritten / Deal Size',citation:'PCAF Standard, Part B \u2014 Facilitated Emissions (Dec 2023)',dqs:2,year:2023,bookRunner:'Joint',peerGroup:'2-bank syndicate'},
  {id:7,type:'Advisory M&A',client:'Mining Target Co.',sector:'Mining',dealSizeM:6800,underwrittenM:0,clientScope1:10200000,clientScope2:5200000,clientScope3:82000000,attrFormula:'Advisory fee / Deal Size (capped 10%)',citation:'PCAF Standard, Part B \u2014 Facilitated Emissions (Dec 2023)',dqs:4,year:2024,bookRunner:'Sole Advisor',peerGroup:'Financial advisor (no underwriting)'},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   DQS DEFINITIONS, IMPROVEMENT STEPS, YOY DATA, QUARTERLY TREND
   ═══════════════════════════════════════════════════════════════════════════════ */
const DQS_IMPROVEMENT_STEPS={
  5:'Obtain revenue-based emission factor from industry database or engage company directly for Scope 1+2 GHG inventory. Action: send data request template to borrower IR/sustainability team. Timeline: 3-6 months.',
  4:'Request company GHG inventory or use physical intensity proxy (e.g., production volume \u00d7 sector emission factor). Action: cross-reference with CDP, BRSR, sustainability reports. Timeline: 1-3 months.',
  3:'Request CDP submission or independent verification of self-reported data. Push for limited assurance engagement. Action: engage verification body, flag in annual review. Timeline: 6-12 months.',
  2:'Obtain third-party limited assurance; push toward reasonable assurance per ISAE 3410. Action: include in loan covenant or engagement program. Timeline: 12 months.',
  1:'Gold standard \u2014 maintain annual re-verification. Ensure data is within 12-month reporting period. No improvement action needed.',
};

const DQS_DEFINITIONS=PCAF_DATA_QUALITY||[
  {score:1,label:'Audited GHG emissions',description:'Verified reported emissions from the company (CDP verified, third-party assured per ISAE 3410)',method:'Option 1 \u2014 Reported emissions (verified)',uncertainty:'Low (\u00b110%)',weight:1.0,examples:'CDP A-List company with ISAE 3410 limited/reasonable assurance'},
  {score:2,label:'Unaudited GHG emissions',description:'Reported but unverified emissions directly from the company (sustainability report, BRSR, annual report)',method:'Option 2 \u2014 Reported emissions (unverified)',uncertainty:'Low-Medium (\u00b125%)',weight:0.85,examples:'Company sustainability report, BRSR disclosure, GRI report without external assurance'},
  {score:3,label:'Physical activity-based estimate',description:'Emissions estimated from physical activity data (MWh consumed, fuel volumes, production output) and emission factors',method:'Option 3 \u2014 Physical activity data',uncertainty:'Medium (\u00b140%)',weight:0.65,examples:'Energy bills \u00d7 DEFRA EF, production volumes \u00d7 sector intensity, building EPC \u00d7 floor area'},
  {score:4,label:'Economic activity-based estimate',description:'Emissions estimated from economic data (revenue, total assets) and sector-average emission factors',method:'Option 4 \u2014 Economic activity data',uncertainty:'Medium-High (\u00b160%)',weight:0.50,examples:'Revenue \u00d7 Trucost/EXIOBASE sector EF, total assets \u00d7 sector intensity'},
  {score:5,label:'Estimated with limited data',description:'Emissions estimated from headcount, asset class, or geography proxy with high uncertainty',method:'Option 5 \u2014 Proxy/estimation',uncertainty:'High (\u00b1100%)',weight:0.30,examples:'Headcount \u00d7 per-employee EF, national average, asset class default'},
];

const YOY_DATA=[
  {year:'2019',fe:1680000,waci:524,dqs:4.4,coverage:52,scope1Pct:70,scope2Pct:22,scope3Pct:8,positions:42},
  {year:'2020',fe:1380000,waci:462,dqs:4.2,coverage:62,scope1Pct:68,scope2Pct:24,scope3Pct:8,positions:48},
  {year:'2021',fe:1124600,waci:398,dqs:3.9,coverage:71,scope1Pct:65,scope2Pct:25,scope3Pct:10,positions:52},
  {year:'2022',fe:983200,waci:356,dqs:3.6,coverage:78,scope1Pct:62,scope2Pct:26,scope3Pct:12,positions:56},
  {year:'2023',fe:847400,waci:312,dqs:3.2,coverage:84,scope1Pct:58,scope2Pct:28,scope3Pct:14,positions:58},
  {year:'2024E',fe:791000,waci:287,dqs:2.9,coverage:91,scope1Pct:55,scope2Pct:29,scope3Pct:16,positions:60},
];

const QUARTERLY_DQS=Array.from({length:12},(_,i)=>({
  q:`Q${(i%4)+1} ${2022+Math.floor(i/4)}`,
  avg:+(3.8-i*0.08).toFixed(2),
  dqs1:Math.round(5+i*1.2),dqs2:Math.round(12+i*1.4),
  dqs3:Math.round(18+i*0.5),dqs4:Math.round(16-i*0.8),
  dqs5:Math.round(9-i*0.4),
  coveragePct:Math.round(65+i*2.2),
  newDisclosures:Math.round(2+sr(i*17)*4),
}));

/* ═══════════════════════════════════════════════════════════════════════════════
   ALL PCAF FORMULAS — With section citations, worked examples, edge cases
   ═══════════════════════════════════════════════════════════════════════════════ */
const PCAF_FORMULAS=[
  {id:'F1',name:'Financed Emissions \u2014 Listed Equity & Corporate Bonds',section:'Ch.5',
   formula:'FE_i = (Outstanding_i / EVIC_i) \u00d7 Company_Emissions_i',
   latex:'FE_i = \\frac{O_i}{EVIC_i} \\times E_i',
   variables:['Outstanding_i = current exposure in reporting currency ($M)','EVIC_i = Enterprise Value Including Cash = Market Cap + Total Debt + Preferred Stock + Minority Interest ($Bn)','Company_Emissions_i = Scope 1 + Scope 2 emissions (tCO2e)'],
   notes:'EVIC is the standard denominator per the PCAF Financed Emissions Standard (3rd Edition, Dec 2025). If EVIC unavailable for listed companies, use market cap \u00d7 sector leverage ratio (DQS auto-downgrades). For unlisted, see Business Loans methodology.',
   example:'Shell plc: FE = ($31.2M / $245Bn) \u00d7 68,400,000 tCO2e = 8,709 tCO2e. Attribution factor = 0.01274%.',
   edgeCases:['Null EVIC: use sector-median proxy from S&P Capital IQ; DQS auto-downgrades to min(current, 4)','Multi-currency: convert all to reporting currency at period-end FX rate per PCAF guidance','Negative EVIC (distressed companies): use total assets as denominator; flag as DQS 5','Dual-listed securities: use primary listing EVIC to avoid double-counting'],
   validation:['Outstanding must be > 0 and \u2264 EVIC','EVIC should be period-end (matching emissions reporting period)','Emissions must match most recent 12-month reporting period']},
  {id:'F2',name:'Financed Emissions \u2014 Business Loans',section:'Ch.5',
   formula:'FE_i = (Outstanding_i / (EVIC_i or E+D_i)) \u00d7 Company_Emissions_i',
   latex:'FE_i = \\frac{O_i}{EVIC_i \\text{ or } (E_i + D_i)} \\times E_i',
   variables:['Outstanding_i = drawn loan amount ($M)','E+D_i = Total Equity + Total Debt from most recent audited financials ($M)','Company_Emissions_i = Scope 1 + Scope 2 (tCO2e)'],
   notes:'For unlisted borrowers without public EVIC data, use Total Equity + Total Debt from the most recent audited financial statements. If both are unavailable, use Total Assets as a last resort (DQS 4 minimum).',
   example:'SME Loan: FE = ($8M / $25M E+D) \u00d7 420,000 tCO2e = 134,400 tCO2e. Attribution factor = 32.0%.',
   edgeCases:['No financials: use revenue \u00d7 sector EF; DQS = 4 minimum','Negative equity (insolvent): use total assets; flag for review','Revolving facilities: use average drawn balance over period'],
   validation:['E+D should be from audited financials within 18 months of reporting date','Outstanding must reflect drawn balance, not commitment']},
  {id:'F3',name:'Financed Emissions \u2014 Project Finance',section:'Ch.5',
   formula:'FE_i = (Outstanding_i / Total_Project_Cost_i) \u00d7 Project_Emissions_i',
   latex:'FE_i = \\frac{O_i}{TPC_i} \\times PE_i',
   variables:['Outstanding_i = current loan balance ($M)','Total_Project_Cost_i = total equity + debt financing for the project ($M)','Project_Emissions_i = annual project-level emissions (tCO2e)'],
   notes:'For renewables, use lifecycle emissions including construction and decommissioning. For fossil fuel projects, include fugitive emissions (methane leakage). Multi-phase projects: allocate to phase being financed.',
   example:'Wind Farm: FE = ($480M / $1,200M) \u00d7 12,400 tCO2e = 4,960 tCO2e. Attribution = 40%.',
   edgeCases:['Multiple tranches with different seniority: use pro-rata attribution','JV structures: attribute based on equity share, not debt share','Construction phase: use expected operational emissions if not yet operational'],
   validation:['Outstanding must not exceed total project cost','Project emissions should be forward-looking for new projects']},
  {id:'F4',name:'Financed Emissions \u2014 Commercial Real Estate',section:'Ch.5',
   formula:'FE_i = (Outstanding_i / Property_Value_i) \u00d7 Building_Emissions_i',
   latex:'FE_i = \\frac{O_i}{PV_i} \\times BE_i',
   variables:['Outstanding_i = mortgage/loan balance ($M)','Property_Value_i = current appraisal or purchase price ($M)','Building_Emissions_i = annual energy-related Scope 1+2 emissions (tCO2e)'],
   notes:'Use EPC ratings where available. Apply CRREM methodology for stranded asset risk assessment. Include Scope 1 (on-site combustion: gas boilers, CHP) and Scope 2 (purchased electricity/district heating).',
   example:'Canary Wharf: FE = ($620M / $900M) \u00d7 18,400 tCO2e = 12,676 tCO2e. Attribution = 68.9%.',
   edgeCases:['Mixed-use buildings: allocate by gross lettable area per use type','Vacant properties: use design energy consumption at full occupancy','Refurbishment: update emissions post-renovation; may trigger DQS upgrade'],
   validation:['Property value must be recent (within 3 years or latest appraisal)','Building emissions should include common areas and landlord-controlled spaces']},
  {id:'F5',name:'Financed Emissions \u2014 Mortgages',section:'Ch.5',
   formula:'FE_i = (Outstanding_i / Property_Value_i) \u00d7 Building_Emissions_i',
   latex:'FE_i = \\frac{O_i}{PV_i} \\times BE_i',
   variables:['Outstanding_i = current mortgage balance ($M)','Property_Value_i = value at origination or latest valuation ($M)','Building_Emissions_i = annual emissions from EPC/floor area \u00d7 grid EF (tCO2e)'],
   notes:'EPC to emissions conversion: use national avg kWh/m\u00b2 by EPC rating band \u00d7 floor area \u00d7 national grid emission factor. For portfolio-level reporting, use EPC distribution of the mortgage book.',
   example:'UK Mortgage: FE = (\u00a3250K / \u00a3400K) \u00d7 4.2 tCO2e = 2.625 tCO2e per mortgage. Portfolio: 8,200 mortgages \u00d7 avg 23.0 tCO2e attribution = 189,000 tCO2e.',
   edgeCases:['Properties without EPC: use postcode-level proxy or national average; DQS = 5','Buy-to-let: emissions still attributed to mortgage holder, not tenant','Partial repayments: update outstanding balance for accurate attribution'],
   validation:['Property value should be at origination for LTV consistency','EPC rating must be current (within 10 years in UK)']},
  {id:'F6',name:'Financed Emissions \u2014 Vehicle Loans',section:'Ch.5',
   formula:'FE_i = (Outstanding_i / Vehicle_Value_i) \u00d7 (CO2_per_km \u00d7 Annual_km)',
   latex:'FE_i = \\frac{O_i}{VV_i} \\times (\\frac{gCO2}{km} \\times km_{annual})',
   variables:['Outstanding_i = loan balance ($)','Vehicle_Value_i = purchase price ($)','CO2_per_km = manufacturer WLTP test-cycle gCO2/km','Annual_km = estimated annual mileage (default 15,000 km EU / 19,200 km US)'],
   notes:'For EVs: Scope 1 = 0; Scope 2 = grid EF \u00d7 kWh/100km \u00d7 annual km / 100. For ICE vehicles, use WLTP (EU) or EPA combined (US) CO2/km rating.',
   example:'UK ICE: FE = (\u00a318K / \u00a335K) \u00d7 (142 gCO2/km \u00d7 15,000 km) = 1,097 kgCO2e per vehicle.',
   edgeCases:['Hybrid vehicles: use combined (electric + ICE) weighted by electric-mode proportion','Commercial vehicles: use VECTO declared value for HDV','Fleet financing: aggregate by vehicle category'],
   validation:['CO2/km must be WLTP (not NEDC) for EU vehicles post-2018','Annual mileage assumption should match national statistics']},
  {id:'F7',name:'Financed Emissions \u2014 Sovereign Debt',section:'Ch.5 (Sovereign Debt Standard)',
   formula:'FE_i = (Outstanding_i / PPP_GDP_i) \u00d7 Sovereign_Emissions_i',
   latex:'FE_i = \\frac{O_i}{GDP_{PPP,i}} \\times SE_i',
   variables:['Outstanding_i = sovereign bond holding ($M)','PPP_GDP_i = purchasing power parity GDP of the sovereign ($Bn)','Sovereign_Emissions_i = national GHG inventory total (tCO2e)'],
   notes:'Use production-based accounting (territory principle per UNFCCC). Source: UNFCCC National Inventory Reports, or World Bank WDI / IMF WEO. Exclude LULUCF unless specifically including land-use sector.',
   example:'UK Gilt: FE = ($180M / $3,340Bn) \u00d7 326,000,000 tCO2e = 17,569 tCO2e.',
   edgeCases:['Sub-sovereign: use regional emissions if available; otherwise pro-rata from national','Inflation-linked bonds: use nominal outstanding for attribution','Multi-currency sovereign bonds: convert to USD at IMF period-end rate'],
   validation:['PPP GDP must be from same year as emissions data','National emissions should be latest available UNFCCC submission']},
  {id:'F8',name:'Financed Emissions \u2014 Use-of-Proceeds Instruments',section:'3rd Ed. (Dec 2025)',
   formula:'FE_i = (Outstanding_i / Total_Bond_Issuance_i) \u00d7 Proceeds_Emissions_i',
   latex:'FE_i = \\frac{O_i}{TBI_i} \\times PE_i',
   variables:['Outstanding_i = holding amount ($M)','Total_Bond_Issuance_i = total issuance amount of the bond ($M)','Proceeds_Emissions_i = emissions from projects financed by proceeds (tCO2e)'],
   notes:'Green/social/sustainability bonds. Track proceeds allocation from issuer impact reports. Report avoided emissions vs actual emissions separately.',
   example:'World Bank Green Bond: FE = ($120M / $2,000M) \u00d7 42,000 tCO2e = 2,520 tCO2e.',
   edgeCases:['Unallocated proceeds: apply issuer-level EF to unallocated portion','Multi-project bonds: weight by allocation percentage per project','Refinancing: use current project emissions, not original'],
   validation:['Proceeds allocation should be from most recent impact report','Total bond size must match issuance amount']},
  {id:'F9',name:'Insurance-Associated Emissions',section:'IAE Standard (Nov 2022)',
   formula:'FE_ins = GWP_lob \u00d7 Sector_EF_per_Premium_lob',
   latex:'FE_{ins} = GWP_{lob} \\times EF_{sector,lob}',
   variables:['GWP_lob = gross written premium for line of business ($M)','Sector_EF_per_Premium_lob = tCO2e per $M premium by LoB'],
   notes:'Platform methodology (not the official PCAF IAE formula) — attribution based on premium volume, not claims paid, using platform-derived sector emission factors. The PCAF Insurance-Associated Emissions Standard (Nov 2022) instead attributes via premium ÷ customer revenue × customer emissions.',
   example:'Motor: FE = $1,420M \u00d7 0.42 tCO2e/$M = 596,400 tCO2e.',
   edgeCases:['Multi-year policies: use annualised premium','Reinsurance: net of retrocession','Coinsurance: use share of premium'],
   validation:['Premium must be gross written (not net of reinsurance for primary)','EF should be periodically updated as sector decarbonises']},
  {id:'F10',name:'Facilitated Emissions',section:'Part B (Dec 2023)',
   formula:'FE_fac = (Underwritten_i / Issuer_EVIC_i) \u00d7 33% \u00d7 Client_Emissions_i',
   latex:'FE_{fac} = \\frac{UW_i}{EVIC_i} \\times 0.33 \\times CE_i',
   variables:['Underwritten_i = bank committed/underwritten amount ($M)','Issuer_EVIC_i = issuer Enterprise Value Including Cash ($Bn)','33% = PCAF facilitated-emissions weighting factor','Client_Emissions_i = issuer/client Scope 1+2 emissions (tCO2e)'],
   notes:'PCAF Standard, Part B — Facilitated Emissions (Dec 2023). Capital markets transactions including bond underwriting, IPO, equity placements, syndicated loans, securitisation structuring. Attribution = (Underwritten / Issuer EVIC) × 33% weighting factor; advisory-only mandates are out of scope. Deal Size is used as a fallback denominator only when issuer EVIC is unavailable.',
   example:'TotalEnergies Bond: FE = (($840M / 1000) / $178Bn EVIC) \u00d7 0.33 \u00d7 53,200,000 tCO2e ≈ 82,849 tCO2e.',
   edgeCases:['Advisory-only mandates (e.g. M&A advisory): out of scope of PCAF Part B (capital-markets issuance only) \u2014 excluded from the PCAF total, not capped and included','Multiple bookrunners: each reports based on their underwriting commitment','Green bond underwriting: use project emissions, not issuer-level'],
   validation:['Underwritten must not exceed deal size','Client emissions should be from same reporting period as deal']},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   DOWNSTREAM MODULE CONNECTIONS
   ═══════════════════════════════════════════════════════════════════════════════ */
const DOWNSTREAM_MODULES=[
  // R3 gap D-1: PAI #1's own field (totalFinancedEmissions) is the Scope
  // 1+2 headline (per B-2, never blended with Scope 3) \u2014 the description
  // previously claimed "Scope 1, 2, and 3" while feeding a S1+2-only number.
  {module:'SFDR PAI #1 \u2014 GHG Emissions',field:'totalFinancedEmissions',description:'Scope 1+2 GHG emissions of investee companies, proportional to ownership (reported separately from Scope 3, shown alongside). Directly sourced from PCAF Part A financed emissions calculation.',format:'tCO2e (S1+2)',regulation:'SFDR RTS, Annex I, Table 1, Indicator 1',inputFields:['financedEmissions per holding (S1+2)','financedScope3 per holding (S3, separate)'],frequency:'Annual (PAI reference period)'},
  {module:'SFDR PAI #2 \u2014 Carbon Footprint',field:'carbonFootprint',description:'Total financed emissions divided by current value of all investments (AUM), converted to EUR per the ECB reference rate. Measures emission intensity per unit invested.',format:'tCO2e per EUR M invested',regulation:'SFDR RTS, Annex I, Table 1, Indicator 2',inputFields:['totalFinancedEmissions','portfolio AUM ($M)','USD\u2192EUR reference rate'],frequency:'Annual'},
  {module:'SFDR PAI #3 \u2014 GHG Intensity',field:'waciIntensity',description:'Weighted Average Carbon Intensity (WACI) of investee companies, converted to EUR. Weighted by portfolio weight \u00d7 company intensity (emissions/revenue).',format:'tCO2e per EUR M revenue',regulation:'SFDR RTS, Annex I, Table 1, Indicator 3',inputFields:['company emissions','company revenue','portfolio weights','USD\u2192EUR reference rate'],frequency:'Annual'},
  // R3 gap D-3: this card previously rendered a seeded-random number
  // (Math.sin-based, not a real calculation) labeled as TCFD/SBTi/GFANZ
  // methodology output \u2014 a fabricated-analytics violation, not just a
  // display bug. No validated Implied Temperature Rise (ITR) methodology is
  // implemented anywhere in this module; per the review's own explicit
  // alternative ("implement one ITR method... or remove the metric"),
  // removing the fabricated value is the honest choice absent a real
  // company-level warming-pathway engine.
  {module:'Portfolio Temperature Score',field:'impliedTemperatureRise',description:'Not computed by this module \u2014 no validated Implied Temperature Rise (ITR) methodology (e.g. SBTi/CDP-WWF portfolio temperature rating) is implemented here. A prior version of this card showed a fabricated placeholder value; removed rather than left in place.',format:'\u00b0C above pre-industrial (not computed)',regulation:'TCFD / SBTi / GFANZ guidance \u2014 PCAF itself defines no ITR metric',inputFields:['\u2014 requires company-level emission trajectories + SBTi/sector pathway data, not currently sourced'],frequency:'N/A'},
  {module:'Climate Value-at-Risk',field:'climateValueAtRisk',description:'Not computed by this module \u2014 no validated climate VaR methodology (carbon pricing + physical + transition risk under NGFS scenarios) is implemented here. A prior version of this card showed a fabricated placeholder value; removed rather than left in place.',format:'% of portfolio NAV (not computed)',regulation:'TCFD Scenario Analysis / NGFS',inputFields:['\u2014 requires a scenario-analysis engine, not currently implemented'],frequency:'N/A'},
  {module:'CSRD E1 \u2014 Climate Change',field:'esrsE1Emissions',description:'ESRS E1 disclosure on Scope 1+2 financed emissions and transition plans. PCAF provides the financed emissions base for financial institution E1 disclosures.',format:'tCO2e / intensity per EUR M',regulation:'CSRD ESRS E1-5, E1-6',inputFields:['total financed emissions by scope','intensity metrics','DQS distribution'],frequency:'Annual (CSRD reporting cycle)'},
  {module:'EBA Pillar 3 \u2014 ESG Risk',field:'ebaPillar3',description:'Banking book financed emissions, WACI, and data quality scores for prudential ESG disclosure per EBA ITS.',format:'tCO2e / DQS weighted',regulation:'EBA ITS on Pillar 3 ESG 2022/2453',inputFields:['financed emissions by asset class','WACI','DQS distribution','counterparty-level data'],frequency:'Annual (aligned with Pillar 3)'},
  {module:'TCFD Metrics & Targets',field:'tcfdMetrics',description:'PCAF-sourced metrics for TCFD-aligned climate disclosure. Includes absolute emissions, intensity, and data quality.',format:'Multiple metrics',regulation:'TCFD Recommendations 2017, 2021 guidance',inputFields:['financed emissions absolute & intensity','YoY comparison','target progress'],frequency:'Annual'},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPUTATION FUNCTIONS
   ═══════════════════════════════════════════════════════════════════════════════ */
// EVIC resolution order (R3 gap A-4): (1) a genuinely analyst-verified entry
// in evic_reference.json [source no longer says TODO/"existing platform
// estimate"] -> (2) whatever EVIC value the position/reference table already
// carries, flagged as unverified -> (3) sector-median proxy, ONLY if it
// doesn't imply an implausible attribution factor -> otherwise a blocking
// data gap. This replaces an unbounded sector-median guess that could (on a
// different, now-fixed code path) turn a company the size of Apple into a
// ~$3.5Bn EVIC instead of ~$3.5Tn — a data error, not a value to silently render.
const SECTOR_PROXY_MAX_PLAUSIBLE_AF = 0.25; // >25% attribution from a sector-median guess isn't credible; flag instead of compute

function resolveEvic(p) {
  const ref = getReferenceEntry(p.ticker);
  const refIsVerified = !!(ref && typeof ref.evic_usd_bn === 'number' && !/^(TODO|Existing platform estimate)/i.test(ref.source || ''));
  if (refIsVerified) return { evicBn: ref.evic_usd_bn, tier: 'verified', source: ref.source };
  if (p.evic) return { evicBn: p.evic, tier: 'unverified', source: 'Existing platform estimate — not independently analyst-verified' };
  if (ref && typeof ref.evic_usd_bn === 'number') return { evicBn: ref.evic_usd_bn, tier: 'unverified', source: ref.source };
  // No direct EVIC anywhere for this position — try a sector-median proxy,
  // but only if it implies a plausible attribution factor; otherwise this is
  // a data gap to be flagged, not a number to silently render.
  const se = SECTOR_MEDIAN_EVIC[p.sector] || SECTOR_MEDIAN_EVIC.default;
  if (!se) return { evicBn: null, tier: 'gap', source: null };
  const impliedAf = p.outstanding / (se * 1000);
  if (impliedAf > SECTOR_PROXY_MAX_PLAUSIBLE_AF) return { evicBn: null, tier: 'gap', source: null };
  return { evicBn: se, tier: 'sector_proxy', source: `Sector-median EVIC proxy (${p.sector || 'default'})` };
}

// UNIT CONVENTION (see BASE_POSITIONS comment above): evic/se/gdp = $Bn,
// outstanding/propertyValue/projectCost/etc. = $M. Every EVIC-denominator
// branch below must convert one side before dividing (se/evic/gdp * 1000)
// — this file previously divided $M outstanding directly by $Bn EVIC with no
// conversion, overstating every listed-equity/bond/loan attribution factor
// ~1,000x (GAP-004; e.g. Shell $31.2M / $245Bn rendered as 12.73% instead of
// the correct 0.0127%).
function computeAttrFactor(p){
  // Project Finance: Outstanding / Total Project Cost (Ch.5)
  if(p.assetClass==='Project Finance'){
    const tpc=p.projectCost||p.outstanding*2.5;
    return Math.min(1.0,p.outstanding/tpc);
  }
  // CRE: Outstanding / Property Value (Ch.5)
  if(p.assetClass==='Commercial Real Estate'){
    const pv=p.propertyValue||p.outstanding*1.5;
    return Math.min(1.0,p.outstanding/pv);
  }
  // Mortgages: Outstanding / (avg property value x loan count) — pool-level
  // LTV (Ch.5). Previously hardcoded to 1.0 (100% attribution) regardless of
  // the pool's actual property values, which the data already carries
  // (GAP-014).
  if(p.assetClass==='Mortgages'){
    const totalPropertyValueM=(p.avgPropertyValue&&p.loanCount)?(p.avgPropertyValue*p.loanCount/1000):p.outstanding*1.25;
    return Math.min(1.0,p.outstanding/totalPropertyValueM);
  }
  // Vehicle Loans: Outstanding / (avg vehicle value x vehicle count) —
  // pool-level LTV (Ch.5). Previously hardcoded to 1.0 (GAP-014).
  if(p.assetClass==='Vehicle Loans'){
    const totalVehicleValueM=(p.avgVehicleValue&&p.vehicleCount)?(p.avgVehicleValue*p.vehicleCount/1000):p.outstanding*1.15;
    return Math.min(1.0,p.outstanding/totalVehicleValueM);
  }
  // Securitisations: Tranche Outstanding / Pool Value (Ch.5). Previously
  // hardcoded to 1.0 even though the data already carries poolValue (GAP-014).
  if(p.assetClass==='Securitisations'){
    const pool=p.poolValue||p.outstanding*5;
    return Math.min(1.0,p.outstanding/pool);
  }
  // Sovereign Debt: Outstanding / PPP GDP (Ch.5)
  if(p.assetClass==='Sovereign Debt'){
    const gdp=COUNTRY_PPP_GDP[p.country]||COUNTRY_PPP_GDP.default;
    return Math.min(1.0,(p.outstanding/(gdp*1000)));
  }
  // Use-of-Proceeds (PCAF Part A, 3rd Edition Dec 2025 addition):
  // Outstanding / Total Bond Size
  if(p.assetClass==='Use-of-Proceeds'){
    const tbs=p.totalBondSize||p.outstanding*10;
    return Math.min(1.0,p.outstanding/tbs);
  }
  // Sub-Sovereign (PCAF Part A, 3rd Edition Dec 2025 addition): no
  // sub-sovereign holdings currently exist in this demo portfolio to
  // attribute; flat placeholder retained.
  if(p.assetClass==='Sub-Sovereign')return 0.10;
  // Undrawn Commitments (PCAF Part A, 3rd Edition Dec 2025 addition —
  // optional, IFRS S1/S2-aligned reporting): CCF x (Outstanding / EVIC). Returns null (data gap) rather than a number
  // when no EVIC can be resolved at a plausible confidence — see resolveEvic.
  if(p.assetClass==='Undrawn Commitments'){
    const ccf=p.ccf||0.75;
    const {evicBn}=resolveEvic(p);
    if(evicBn==null)return null;
    return ccf*Math.min(1.0,p.outstanding/(evicBn*1000));
  }
  // Listed Equity, Corporate Bonds, Business Loans: Outstanding / EVIC (Ch.5).
  // Returns null (data gap) rather than a number when no EVIC can be
  // resolved at a plausible confidence — see resolveEvic.
  {
    const {evicBn}=resolveEvic(p);
    if(evicBn==null)return null;
    return Math.min(1.0,p.outstanding/(evicBn*1000));
  }
}

const EVIC_DEPENDENT_CLASSES=['Listed Equity','Corporate Bonds','Business Loans','Undrawn Commitments'];

// R3 gap B-7: data vintage & portfolio hygiene. Legal-name changes for
// issuers already in the demo book — renamed at display time only, not in
// BASE_POSITIONS itself, so ticker/name-keyed lookups elsewhere in this file
// (e.g. lookupClientEvicBn, built directly off BASE_POSITIONS) are unaffected.
const ISSUER_RENAME_MAP={
  'LafargeHolcim Ltd':'Holcim Ltd (formerly LafargeHolcim)',
  'HeidelbergCement AG':'Heidelberg Materials AG (formerly HeidelbergCement)',
};
// Bond names in this demo book embed a maturity year ("H&M bonds 0.25%
// 2024", "Delta Air Lines 7% 2025") — a matured instrument sitting in a
// "current" book is a genuine PCAF hygiene violation (use most recent
// available data; a matured bond has no current outstanding exposure),
// not just a display nit. Excluded from totals like a data gap, not zeroed.
function parseMaturityYear(name){
  const m=/\b(20\d{2})\s*$/.exec((name||'').trim());
  return m?+m[1]:null;
}
// Most `source` strings in this book embed the vintage year of the
// underlying data ("CDP A-List 2023", "Shell Annual Report 2023"). PCAF
// permits lagged data if the vintage is disclosed — flag data older than 24
// months so it doesn't silently pass as current.
function parseSourceVintageYear(source){
  const m=/\b(20\d{2})\b/.exec(source||'');
  return m?+m[1]:null;
}
const CURRENT_REPORTING_YEAR=new Date().getFullYear();

function computeRow(p){
  const totalEmissions=(p.scope1||0)+(p.scope2||0);
  const totalWithScope3=totalEmissions+(p.scope3||0);
  const attrFactor=computeAttrFactor(p);
  // A null attrFactor means computeAttrFactor hit an unresolvable/implausible
  // EVIC (see resolveEvic) — this position's financed emissions are a
  // genuine data gap, not zero. Render/aggregate it as null everywhere, never
  // coerce it to 0 (0 + null === 0 in JS, which would silently reintroduce
  // the exact "missing data renders as a real number" failure mode this
  // module has already been fixed for once, GAP-007/013).
  const dataGap=attrFactor===null;
  const financedEmissions=dataGap?null:+(attrFactor*totalEmissions).toFixed(0);
  const financedScope3=dataGap?null:+(attrFactor*(p.scope3||0)).toFixed(0);
  const isEvicDependent=EVIC_DEPENDENT_CLASSES.includes(p.assetClass);
  const evicResolution=isEvicDependent?resolveEvic(p):null;
  const dataGapReason=dataGap?`No plausible EVIC for ${p.name||'this position'} — a sector-median proxy would imply >${(SECTOR_PROXY_MAX_PLAUSIBLE_AF*100).toFixed(0)}% attribution, which is not credible. Add a verified entry to evic_reference.json.`:null;
  // Every EVIC-dependent position whose EVIC isn't a genuinely analyst-
  // verified reference-table entry is flagged — including ones that already
  // carry a hardcoded (pre-existing, unverified) EVIC value. Previously only
  // fully-null EVICs were flagged, understating how much of the book is
  // actually unverified (R3 gap A-4/GAP-028: "only 2 EVIC warnings" when
  // effectively the whole book was proxied/unverified).
  const evicWarning=dataGap
    ? 'DATA_GAP — no plausible EVIC available'
    : (evicResolution && evicResolution.tier==='sector_proxy') ? 'SECTOR_PROXY — no direct EVIC available'
    : (evicResolution && evicResolution.tier==='unverified') ? 'UNVERIFIED_EVIC — not independently analyst-verified'
    : null;
  // Revenue proxy: prefer a genuinely verified reference-table revenue figure
  // (data/evic_reference.json revenue_usd_m — R3 gap B-4) when present;
  // otherwise fall back to a sector revenue-intensity proxy (Revenue/EVIC
  // ratio), never the old flat 15%xEVIC assumption. p.evic (and the
  // SECTOR_MEDIAN_EVIC fallback) are in $Bn; revenueM must be in $M to match
  // financedEmissions' units, so convert Bn->M (x1000) before applying the
  // ratio — this was previously missing, inflating WACI ~1,000x (GAP-020,
  // e.g. header showed 606,192.9 tCO2e/$M against a status-bar figure of 312
  // for the same portfolio).
  const referenceRevenueM=getReferenceRevenueM(p.ticker);
  const revenueProxy=referenceRevenueM==null;
  const revenueM = referenceRevenueM!=null ? referenceRevenueM
    : sectorRevenueProxyM(p.sector, p.evic || SECTOR_MEDIAN_EVIC[p.sector] || 50);
  // R3 gap B-4: a revenue proxy is itself a data-quality flag, same as an
  // EVIC proxy — cap DQS at 4 (never claim DQS 1-3 confidence off a proxy
  // revenue denominator), same treatment as evicWarning above.
  const adjustedDqs=dataGap?5:(evicWarning||revenueProxy)?Math.max(p.dqs,4):p.dqs;
  // WACI is reported on Scope 1+2 by convention (waci, unchanged field name
  // so existing portfolio-weighted aggregates keep working); waciS123 is the
  // explicit, separately-labeled all-scope variant — never rendered under
  // the plain "WACI" label per PCAF/TCFD's separate-scope-reporting
  // convention (same principle as financedEmissions/financedScope3, R3 gap
  // B-2).
  const waci=revenueM>0?(totalEmissions/revenueM):0;
  const waciS123=revenueM>0?(totalWithScope3/revenueM):0;
  const carbonIntensity=(!dataGap&&p.outstanding>0)?financedEmissions/p.outstanding:0;
  const scope1Pct=totalEmissions>0?(p.scope1||0)/totalEmissions:0;
  const scope2Pct=totalEmissions>0?(p.scope2||0)/totalEmissions:0;
  // R3 gap B-7: matured instruments and stale data vintage.
  const maturityYear=parseMaturityYear(p.name);
  const matured=maturityYear!=null&&maturityYear<CURRENT_REPORTING_YEAR;
  const sourceVintageYear=parseSourceVintageYear(p.source);
  const dataVintageYears=sourceVintageYear!=null?CURRENT_REPORTING_YEAR-sourceVintageYear:null;
  const vintageWarning=dataVintageYears!=null&&dataVintageYears>2;
  const displayName=ISSUER_RENAME_MAP[p.name]||p.name;
  return{...p,name:displayName,totalEmissions,totalWithScope3,attrFactor,financedEmissions,financedScope3,waci,waciS123,revenueProxy,carbonIntensity,evicWarning,dataGap,dataGapReason,dqs:adjustedDqs,scope1Pct,scope2Pct,matured,maturityYear,sourceVintageYear,dataVintageYears,vintageWarning};
}

const INITIAL_POSITIONS=BASE_POSITIONS.map(computeRow);

// R3 gap F-13: the single source of truth for "what FE does this position
// show under the current scope toggle" — every consumer (table cell,
// footer, asset-class/geo/sector aggregates, top-10 chart) calls this same
// function instead of each re-deriving its own scopeView ternary, which is
// exactly how the table/footer and the charts/pills drifted out of sync
// with each other in the first place.
function scopedFE(p,scopeView){
  return scopeView==='1+2+3'?p.financedEmissions+p.financedScope3:p.financedEmissions;
}

// R3 gap U-A: the same "excluded from every total" filter PartATab already
// used (data-gap / matured / undrawn-commitments positions), lifted so the
// new cross-asset-class ResultsStage totals the same computable set instead
// of quietly re-deriving its own filter that could disagree with Part A's.
function computablePcafPositions(positions){
  return positions.filter(p=>!p.dataGap&&!p.matured&&p.assetClass!=='Undrawn Commitments');
}

/* ═══════════════════════════════════════════════════════════════════════════════
   REUSABLE UI COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */
// R3 gap U-C: hero KPIs (the number a user actually came to this tab to
// read) get a larger card and an optional scope chip; every card can carry
// a lineage popover (methodology citation, data vintage, source count) so a
// number is never presented without a way to see where it came from.
function KPICard({label,value,sub,color,mono,hero,chip,lineage}){
  return(<div style={{background:T.surface,border:`1px solid ${hero?color||T.navy:T.border}`,borderRadius:8,padding:hero?'18px 20px':'14px 18px',flex:hero?'1 1 220px':1,minWidth:hero?200:150,position:'relative'}}>
    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
      <div style={{fontSize:10,color:T.textMut,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',fontFamily:T.mono}}>{label}</div>
      {chip&&<span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:8,background:(color||T.navy)+'1a',color:color||T.navy,fontFamily:T.mono}}>{chip}</span>}
      {lineage&&<LineageChip {...lineage}/>}
    </div>
    <div style={{fontSize:hero?28:21,fontWeight:700,color:color||T.navy,lineHeight:1.1,fontFamily:mono?T.mono:T.font}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:T.textSec,marginTop:4}}>{sub}</div>}
  </div>);
}

// R3 gap U-C: on-demand "where did this number come from" popover — real,
// derivable facts only (methodology citation, actual source-vintage range
// and distinct-source count computed from the positions feeding the card,
// and an honest note that this is a client-side recompute, not a tracked
// backend run) rather than inventing a run ID or job number this platform
// has no real concept of.
function LineageChip({citation,vintage,sourceCount,basis}){
  const[open,setOpen]=useState(false);
  return(<span style={{position:'relative',display:'inline-flex'}}>
    <button onClick={()=>setOpen(o=>!o)} title="Where does this number come from?" style={{width:16,height:16,borderRadius:'50%',border:`1px solid ${T.borderL}`,background:T.surface,color:T.textMut,fontSize:9,lineHeight:'14px',padding:0,cursor:'pointer',fontFamily:T.mono}}>i</button>
    {open&&<div style={{position:'absolute',top:20,left:0,zIndex:20,width:220,background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:'10px 12px',boxShadow:'0 6px 20px rgba(0,0,0,0.12)',fontSize:10,color:T.textSec,lineHeight:1.6}}>
      {citation&&<div><strong style={{color:T.navy}}>Methodology:</strong> {citation}</div>}
      {vintage&&<div><strong style={{color:T.navy}}>Data vintage:</strong> {vintage}</div>}
      {sourceCount!=null&&<div><strong style={{color:T.navy}}>Distinct sources:</strong> {sourceCount}</div>}
      <div style={{marginTop:4,color:T.textMut}}>{basis||'Computed client-side from the current portfolio — recalculates on every edit, no separate tracked run.'}</div>
    </div>}
  </span>);
}

// R3 gap U-A (quick-fix half): each button gets an explicit min-height of
// 44px (WCAG touch-target guidance) and the active-state indicator is drawn
// with box-shadow instead of a negative-margin border overlap — the prior
// -2px marginBottom trick shifted the visual border without changing the
// button's own box, which is a plausible contributor to the reported
// dead-click behavior at narrow viewports where buttons wrap/overlap.
function TabBar({tabs,active,onChange}){
  return(<div style={{display:'flex',borderBottom:`2px solid ${T.border}`,marginBottom:24,gap:0,overflowX:'auto'}}>
    {tabs.map(t=>(<button key={t} onClick={()=>onChange(t)} style={{padding:'12px 18px',minHeight:44,border:'none',background:'none',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:T.font,color:active===t?T.navy:T.textMut,boxShadow:active===t?`inset 0 -2px 0 ${T.navy}`:'inset 0 -2px 0 transparent',transition:'color 0.15s',whiteSpace:'nowrap',position:'relative',zIndex:1}}>{t}</button>))}
  </div>);
}

function Badge({children,color}){return<span style={{display:'inline-block',padding:'1px 7px',borderRadius:10,fontSize:11,fontWeight:700,background:(color||T.navy)+'22',color:color||T.navy}}>{children}</span>;}

function SectionHeader({title,citation,description}){
  return(<div style={{marginBottom:16}}>
    <div style={{display:'flex',alignItems:'baseline',gap:10,flexWrap:'wrap'}}>
      <h3 style={{fontSize:15,fontWeight:700,color:T.navy,margin:0}}>{title}</h3>
      {citation&&<span style={{fontSize:10,fontFamily:T.mono,color:T.gold,background:T.gold+'18',padding:'2px 8px',borderRadius:4}}>{citation}</span>}
    </div>
    {description&&<p style={{fontSize:12,color:T.textSec,margin:'4px 0 0',lineHeight:1.5,maxWidth:900}}>{description}</p>}
  </div>);
}

function Card({children,title,citation,style}){
  return(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:18,...(style||{})}}>
    {title&&<div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:12}}>
      <div style={{fontWeight:700,color:T.navy,fontSize:14}}>{title}</div>
      {citation&&<span style={{fontSize:9,fontFamily:T.mono,color:T.gold}}>{citation}</span>}
    </div>}
    {children}
  </div>);
}

function InfoBox({type,children}){
  const colors={info:{bg:'#eff6ff',border:'#bfdbfe',text:T.navyL},warn:{bg:'#fffbeb',border:'#fde68a',text:T.amber},success:{bg:'#f0fdf4',border:'#bbf7d0',text:T.green},error:{bg:'#fef2f2',border:'#fecaca',text:T.red}};
  const c=colors[type]||colors.info;
  return(<div style={{padding:'10px 14px',background:c.bg,border:`1px solid ${c.border}`,borderRadius:6,fontSize:12,color:c.text,lineHeight:1.5,marginTop:8}}>{children}</div>);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ADD POSITION MODAL — Full form with validation
   ═══════════════════════════════════════════════════════════════════════════════ */
// R3 gap F-19: shared by both the per-field live validator and the
// on-submit validator, so "does this field pass" is answered the same way
// in both places — the field-level errors used to only clear on the next
// full Save attempt, so a message could sit there stale after the user had
// already fixed that exact field.
function validateFields(form){
  const e={};
  if(!form.name.trim())e.name='Company/instrument name is required';
  if(!form.outstanding||+form.outstanding<=0)e.outstanding='Outstanding exposure must be > 0';
  if((!form.scope1||+form.scope1===0)&&(!form.scope2||+form.scope2===0))e.scope1='At least Scope 1 or Scope 2 emissions required';
  if(['Listed Equity','Corporate Bonds','Business Loans'].includes(form.assetClass)&&form.evic&&+form.evic<=0)e.evic='EVIC must be > 0 if provided';
  return e;
}

function AddPositionModal({onAdd,onClose}){
  const[form,setForm]=useState({name:'',country:'US',geo:'Americas',assetClass:'Listed Equity',sector:'Technology',evic:'',outstanding:'',scope1:'',scope2:'',scope3:'',dqs:'3',source:'Manual entry',currency:'USD',projectCost:'',propertyValue:''});
  const[errors,setErrors]=useState({});
  // R3 gap F-19: clear (or update) each field's error the moment its value
  // changes, using the same validateFields check the Save button runs —
  // previously errors state only updated on the next full Save attempt, so
  // a field the user had already fixed kept showing its old error message.
  const set=k=>e=>{
    const value=e.target.value;
    setForm(f=>{
      const next={...f,[k]:value};
      setErrors(prevErrors=>{
        const fresh=validateFields(next);
        const{[k]:_omit,...rest}=prevErrors;
        return fresh[k]?{...rest,[k]:fresh[k]}:rest;
      });
      return next;
    });
  };

  function validate(){
    const e=validateFields(form);
    setErrors(e);return Object.keys(e).length===0;
  }

  function handleSave(){
    if(!validate())return;
    const p={
      ...form,id:Date.now(),evic:form.evic?+form.evic:null,
      outstanding:+form.outstanding,scope1:+(form.scope1||0),scope2:+(form.scope2||0),scope3:+(form.scope3||0),
      dqs:+form.dqs,projectCost:form.projectCost?+form.projectCost:null,propertyValue:form.propertyValue?+form.propertyValue:null,
    };
    onAdd(computeRow(p));onClose();
  }

  const inp={width:'100%',padding:'7px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,color:T.text,background:T.surface,boxSizing:'border-box'};
  const lbl={display:'block',fontSize:11,fontWeight:600,color:T.textSec,marginBottom:4,letterSpacing:'0.04em',textTransform:'uppercase'};
  const errS={fontSize:10,color:T.red,marginTop:2};

  const showProjectCost=['Project Finance','Use-of-Proceeds'].includes(form.assetClass);
  const showPropertyValue=['Commercial Real Estate','Mortgages'].includes(form.assetClass);
  const showEVIC=['Listed Equity','Corporate Bonds','Business Loans','Undrawn Commitments'].includes(form.assetClass);

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:T.surface,borderRadius:10,padding:28,width:640,maxWidth:'95vw',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 12px 40px rgba(0,0,0,0.18)'}}>
        <div style={{fontSize:16,fontWeight:700,color:T.navy,marginBottom:4}}>Add New Position</div>
        <div style={{fontSize:11,color:T.textMut,marginBottom:16}}>{PCAF_PART_A} \u2014 10 asset classes supported. Fields adapt based on selected asset class.</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div style={{gridColumn:'1/-1'}}><label style={lbl}>Company / Instrument Name *</label><input style={inp} value={form.name} onChange={set('name')} placeholder="e.g. BP plc or North Sea Wind Farm"/>{errors.name&&<div style={errS}>{errors.name}</div>}</div>
          <div><label style={lbl}>Asset Class *</label><select style={inp} value={form.assetClass} onChange={set('assetClass')}>{ALL_ASSET_CLASSES.map(a=><option key={a}>{a}</option>)}</select></div>
          <div><label style={lbl}>Sector (GICS)</label><input style={inp} value={form.sector} onChange={set('sector')} placeholder="e.g. Oil & Gas"/></div>
          <div><label style={lbl}>Country (ISO-2)</label><input style={inp} value={form.country} onChange={set('country')} maxLength={2} placeholder="US"/></div>
          <div><label style={lbl}>Geography</label><select style={inp} value={form.geo} onChange={set('geo')}>{['Americas','EMEA','APAC'].map(g=><option key={g}>{g}</option>)}</select></div>
          {showEVIC&&<div><label style={lbl}>EVIC ($Bn)</label><input style={inp} value={form.evic} onChange={set('evic')} type="number" placeholder="Blank uses sector proxy"/>{errors.evic&&<div style={errS}>{errors.evic}</div>}</div>}
          <div><label style={lbl}>Outstanding ($M) *</label><input style={inp} value={form.outstanding} onChange={set('outstanding')} type="number" placeholder="Current exposure"/>{errors.outstanding&&<div style={errS}>{errors.outstanding}</div>}</div>
          {showProjectCost&&<div><label style={lbl}>Total Project/Bond Size ($M)</label><input style={inp} value={form.projectCost} onChange={set('projectCost')} type="number" placeholder="For attribution calc"/></div>}
          {showPropertyValue&&<div><label style={lbl}>Property Value ($M)</label><input style={inp} value={form.propertyValue} onChange={set('propertyValue')} type="number" placeholder="Appraisal/origination"/></div>}
          <div><label style={lbl}>Scope 1 Emissions (tCO2e) *</label><input style={inp} value={form.scope1} onChange={set('scope1')} type="number" placeholder="Direct emissions"/>{errors.scope1&&<div style={errS}>{errors.scope1}</div>}</div>
          <div><label style={lbl}>Scope 2 Emissions (tCO2e)</label><input style={inp} value={form.scope2} onChange={set('scope2')} type="number" placeholder="Purchased energy"/></div>
          <div><label style={lbl}>Scope 3 Emissions (tCO2e)</label><input style={inp} value={form.scope3} onChange={set('scope3')} type="number" placeholder="Optional \u2014 value chain"/></div>
          <div><label style={lbl}>DQS Score (1\u20135)</label><select style={inp} value={form.dqs} onChange={set('dqs')}>{[1,2,3,4,5].map(d=><option key={d} value={d}>DQS {d} \u2014 {['','Audited','Unaudited','Physical proxy','Economic proxy','Estimation'][d]}</option>)}</select></div>
          <div><label style={lbl}>Currency</label><input style={inp} value={form.currency} onChange={set('currency')} maxLength={3} placeholder="USD"/></div>
          <div><label style={lbl}>Data Source</label><input style={inp} value={form.source} onChange={set('source')} placeholder="e.g. CDP 2023, Annual Report"/></div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:20,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'8px 18px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:'pointer',fontSize:13,fontFamily:T.font}}>Cancel</button>
          <button onClick={handleSave} style={{padding:'8px 18px',border:'none',borderRadius:6,background:T.navy,color:'#fff',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:T.font}}>Add Position</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB 1: PART A — FINANCED EMISSIONS (10 PCAF asset classes, 3rd Edition Dec 2025)
   PCAF Financed Emissions, 3rd Edition (Dec 2025)
   60 pre-loaded holdings, per holding: company, EVIC, outstanding, scope 1/2/3,
   attribution factor, DQS. Add/edit/remove functionality.
   ═══════════════════════════════════════════════════════════════════════════════ */
function PartATab({positions,setPositions}){
  const[search,setSearch]=useState('');
  const[acFilter,setAcFilter]=useState('All');
  const[sortKey,setSortKey]=useState('financedEmissions');
  const[sortDir,setSortDir]=useState(-1);
  const[expandedId,setExpandedId]=useState(null);
  const[editDraft,setEditDraft]=useState({});
  const[selected,setSelected]=useState(new Set());
  const[showAdd,setShowAdd]=useState(false);
  const[scopeView,setScopeView]=useState('1+2');
  const[geoFilter,setGeoFilter]=useState('All');
  const[dqsFilter,setDqsFilter]=useState('All');
  const[carbonPrice,setCarbonPrice]=useState(80);
  const[showYoY,setShowYoY]=useState(false);
  // R3 gap B-2: scope-3 phase-in is complete for all sectors from reporting
  // year 2025 onward. Default to the most recently completed calendar year
  // rather than hardcoding a value that would go stale.
  const[reportingYear,setReportingYear]=useState(()=>new Date().getFullYear()-1);

  const filtered=useMemo(()=>{
    let ps=positions;
    if(acFilter!=='All')ps=ps.filter(p=>p.assetClass===acFilter);
    if(geoFilter!=='All')ps=ps.filter(p=>p.geo===geoFilter);
    if(dqsFilter!=='All')ps=ps.filter(p=>p.dqs===+dqsFilter);
    if(search.trim()){const q=search.toLowerCase();ps=ps.filter(p=>p.name.toLowerCase().includes(q)||p.sector.toLowerCase().includes(q)||p.country.toLowerCase().includes(q));}
    return[...ps].sort((a,b)=>sortDir*(a[sortKey]>b[sortKey]?1:-1));
  },[positions,acFilter,geoFilter,dqsFilter,search,sortKey,sortDir]);

  // PCAF: report committed-but-undrawn amounts separately from the drawn
  // financed-emissions headline (the module's own ASSET_CLASS_DEFS note for
  // Undrawn Commitments already says so). Previously folded straight into
  // totalFE with no separate line (GAP-013).
  //
  // Data-gap positions (financedEmissions===null, see computeRow/resolveEvic)
  // must also be excluded from every sum below rather than folded in — in JS,
  // `0 + null` is 0, so an un-filtered reduce() would silently treat an
  // unresolvable EVIC as a computed zero (R3 gap A-4).
  // R3 gap B-7: a matured instrument (bond past its maturity year) has no
  // current outstanding exposure and cannot sit in a "current" book —
  // excluded from totals like a data gap, not zeroed.
  const computablePositions=useMemo(()=>computablePcafPositions(positions),[positions]);
  const dataGapPositions=useMemo(()=>positions.filter(p=>p.dataGap),[positions]);
  const maturedPositions=useMemo(()=>positions.filter(p=>p.matured),[positions]);
  const vintagePositions=useMemo(()=>positions.filter(p=>p.vintageWarning),[positions]);
  // R3 gap B-2: scope-3 is a real reporting requirement once the reporting
  // year crosses PCAF's phase-in thresholds — not a soft recommendation for a
  // couple of sectors. Flag positions that need it but don't have it.
  const scope3RequiredPositions=useMemo(()=>positions.filter(p=>isScope3Required(p.sector,reportingYear)),[positions,reportingYear]);
  const scope3MissingPositions=useMemo(()=>scope3RequiredPositions.filter(p=>!p.scope3),[scope3RequiredPositions]);
  const totalFE=useMemo(()=>computablePositions.reduce((s,p)=>s+p.financedEmissions,0),[computablePositions]);
  const totalUndrawnFE=useMemo(()=>positions.filter(p=>p.assetClass==='Undrawn Commitments'&&!p.dataGap).reduce((s,p)=>s+p.financedEmissions,0),[positions]);
  const totalFEScope3=useMemo(()=>computablePositions.reduce((s,p)=>s+p.financedScope3,0),[computablePositions]);
  const totalOut=useMemo(()=>positions.reduce((s,p)=>s+p.outstanding,0),[positions]);
  const avgDqs=useMemo(()=>positions.length?(positions.reduce((s,p)=>s+p.dqs,0)/positions.length).toFixed(2):'—',[positions]);
  const carbonFootprint=useMemo(()=>totalOut>0?totalFE/(totalOut/1000):0,[totalFE,totalOut]);
  const waci=useMemo(()=>{let num=0,den=0;positions.forEach(p=>{num+=p.outstanding*p.waci;den+=p.outstanding;});return den>0?num/den:0;},[positions]);
  // R3 gap B-4: WACI_S123 computed and exposed separately from the WACI_S12
  // headline above — never blended into one number, same principle as
  // financed emissions scope separation (B-2).
  const waciS123=useMemo(()=>{let num=0,den=0;positions.forEach(p=>{num+=p.outstanding*p.waciS123;den+=p.outstanding;});return den>0?num/den:0;},[positions]);
  const revenueProxyCount=useMemo(()=>positions.filter(p=>p.revenueProxy).length,[positions]);
  // R3 gap U-C: real, derivable lineage facts for the hero KPI cards —
  // coverage (how much of the raw portfolio is actually in the headline
  // total), and the source-vintage range / distinct-source count backing
  // it, computed from the same computablePositions the total itself sums.
  const coveragePct=useMemo(()=>positions.length?(computablePositions.length/positions.length*100):0,[computablePositions,positions]);
  const [showMoreKpis,setShowMoreKpis]=useState(true);
  const vintageYears=useMemo(()=>computablePositions.map(p=>p.sourceVintageYear).filter(y=>y!=null),[computablePositions]);
  const vintageRangeLabel=useMemo(()=>{
    if(!vintageYears.length)return null;
    const min=Math.min(...vintageYears),max=Math.max(...vintageYears);
    return min===max?`${min}`:`${min}–${max}`;
  },[vintageYears]);
  const distinctSourceCount=useMemo(()=>new Set(computablePositions.map(p=>p.source).filter(Boolean)).size,[computablePositions]);
  const carbonCostM=useMemo(()=>(totalFE*carbonPrice/1e6).toFixed(1),[totalFE,carbonPrice]);

  // R3 gap F-13: the scope selector (Scope 1+2 / 1+2+3) previously
  // re-rendered the table's FE cell and footer (each with its own inline
  // scopeView ternary) but not the asset-class pills, geography/sector
  // charts, or the top-10 contributors chart — those four all summed
  // p.financedEmissions (S1+2) unconditionally. Toggling to 1+2+3 therefore
  // changed the table and footer but left every chart/pill showing a
  // stale, inconsistent total. Fixed by deriving a single scopedFE value
  // per position ONCE here, and having every aggregate (and the table
  // cell/footer below) read from it — no component computes its own
  // scope-dependent total anymore.
  const scopedPositions=useMemo(()=>computablePositions.map(p=>({...p,scopedFE:scopedFE(p,scopeView)})),[computablePositions,scopeView]);
  const byAC=useMemo(()=>{const m={};scopedPositions.forEach(p=>{if(!m[p.assetClass])m[p.assetClass]={ac:p.assetClass,count:0,fe:0,out:0,avgDqs:0,totalDqs:0};const e=m[p.assetClass];e.count++;e.fe+=p.scopedFE;e.out+=p.outstanding;e.totalDqs+=p.dqs;});Object.values(m).forEach(v=>v.avgDqs=+(v.totalDqs/v.count).toFixed(1));return Object.values(m).sort((a,b)=>b.fe-a.fe);},[scopedPositions]);
  const byGeo=useMemo(()=>{const m={};scopedPositions.forEach(p=>{if(!m[p.geo])m[p.geo]={geo:p.geo,fe:0,count:0,out:0};m[p.geo].fe+=p.scopedFE;m[p.geo].count++;m[p.geo].out+=p.outstanding;});return Object.values(m);},[scopedPositions]);
  const bySector=useMemo(()=>{const m={};scopedPositions.forEach(p=>{if(!m[p.sector])m[p.sector]={sector:p.sector,fe:0,count:0};m[p.sector].fe+=p.scopedFE;m[p.sector].count++;});return Object.values(m).sort((a,b)=>b.fe-a.fe).slice(0,15);},[scopedPositions]);
  const top10=useMemo(()=>[...scopedPositions].sort((a,b)=>b.scopedFE-a.scopedFE).slice(0,10),[scopedPositions]);

  function handleSort(key){if(sortKey===key)setSortDir(d=>-d);else{setSortKey(key);setSortDir(-1);}}
  function startEdit(p){setExpandedId(p.id);setEditDraft({outstanding:p.outstanding,evicOverride:p.evic,scope1:p.scope1,scope2:p.scope2,scope3:p.scope3,dqs:p.dqs});}
  // R3 gap F-16: explicit Save/Cancel (previously one "Recalculate" button
  // that both applied and closed the row, with no way to back out of an
  // in-progress edit without committing it).
  function saveEdit(p){
    const updated={...p,outstanding:+editDraft.outstanding,evic:editDraft.evicOverride?+editDraft.evicOverride:null,scope1:+editDraft.scope1,scope2:+(editDraft.scope2||0),scope3:+(editDraft.scope3||0),dqs:+editDraft.dqs};
    setPositions(prev=>prev.map(x=>x.id===p.id?computeRow(updated):x));setExpandedId(null);setEditDraft({});
  }
  function cancelEdit(){setExpandedId(null);setEditDraft({});}
  // R3 gap F-16: the formula preview previously read the position's
  // already-committed fields (p.attrFactor/p.totalEmissions/p.financedEmissions)
  // even while the user was actively typing new values into the edit form,
  // so it stayed frozen on the pre-edit numbers until Save closed the row
  // (e.g. "× 22.6K = 0" staying stale). Recomputed live from the draft via
  // the same computeRow the Save button commits through — one calculation
  // path, not a second divergent one.
  function previewRow(p){
    const draftInput={...p,outstanding:+editDraft.outstanding||0,evic:editDraft.evicOverride?+editDraft.evicOverride:null,scope1:+editDraft.scope1||0,scope2:+(editDraft.scope2||0),scope3:+(editDraft.scope3||0),dqs:+editDraft.dqs||p.dqs};
    return computeRow(draftInput);
  }
  function removeSelected(){setPositions(prev=>prev.filter(p=>!selected.has(p.id)));setSelected(new Set());}
  function toggleSelect(id){setSelected(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});}

  const hdr=(key,label,align,title)=>(<th onClick={()=>handleSort(key)} title={title} style={{padding:'8px 8px',textAlign:align||'left',fontSize:10,fontWeight:700,color:T.textSec,letterSpacing:'0.03em',textTransform:'uppercase',cursor:'pointer',userSelect:'none',whiteSpace:'nowrap',borderBottom:`1px solid ${T.border}`,background:T.bg,fontFamily:T.mono,position:'sticky',top:0,zIndex:2}}>{label}{sortKey===key?(sortDir===-1?' \u25BC':' \u25B2'):''}</th>);
  const inp={width:'100%',padding:'5px 8px',border:`1px solid ${T.border}`,borderRadius:5,fontSize:12,fontFamily:T.font,color:T.text,background:T.bg};

  const exportCSV=useCallback(()=>{
    const keys=['name','assetClass','sector','country','currency','outstanding','attrFactor','scope1','scope2','scope3','financedEmissions','financedScope3','waci','dqs','source','matured','dataVintageYears'];
    const csv=[keys.join(','),...positions.map(r=>keys.map(k=>{let v=r[k];if(typeof v==='number')return v;return`"${String(v||'').replace(/"/g,'""')}"`;}).join(','))].join('\n');
    const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='pcaf_part_a_financed_emissions.csv';a.click();URL.revokeObjectURL(u);
  },[positions]);

  return(<div>
    <SectionHeader title="Part A: Financed Emissions" citation={PCAF_PART_A} description={`10 PCAF Part A asset classes across ${positions.length} holdings. Attribution Factor = Outstanding / Denominator (per asset class). Financed Emissions = Attribution Factor x Scope 1+2 Emissions. Core formulas per the 2nd-Edition Chapter 5 classes; Use-of-Proceeds, Securitisations, Sub-Sovereign Debt, and Undrawn Commitments are 3rd-Edition (Dec 2025) additions.`}/>

    {/* R3 gap U-C: hero row — the number a user actually opens this tab to
        read (scope-aware Financed Emissions, Coverage, Avg DQS) — always
        visible, larger cards, each with a lineage popover. Everything else
        moves to a collapsible secondary row below (expanded by default —
        nothing that was visible before is now hidden, just de-emphasized). */}
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:10}}>
      <KPICard hero label="Financed Emissions" chip={scopeView} value={fmt(scopeView==='1+2+3'?totalFE+totalFEScope3:totalFE)+' tCO2e'} sub={`${computablePositions.length}/${positions.length} positions in scope`} color={T.navy}
        lineage={{citation:PCAF_PART_A,vintage:vintageRangeLabel?`source vintage ${vintageRangeLabel}`:null,sourceCount:distinctSourceCount}}/>
      <KPICard hero label="Coverage" value={coveragePct.toFixed(0)+'%'} sub={`${positions.length-computablePositions.length} excluded (data gap / matured / undrawn)`} color={coveragePct>=90?T.green:coveragePct>=75?T.amber:T.red}
        lineage={{citation:PCAF_PART_A,basis:'Share of the raw portfolio (by position count) included in the Financed Emissions total above — the rest is reported separately (undrawn) or excluded with a stated reason (data gap, matured).'}}/>
      <KPICard hero label="Avg DQS" value={avgDqs} sub="Portfolio average, PCAF 1 (best) – 5 (worst)" color={DQS_COLOR[Math.round(+avgDqs)]||T.amber}
        lineage={{citation:'PCAF Standard, Chapter 3 — Data Quality Score',basis:`Simple average across all ${positions.length} positions, including proxy-capped scores.`}}/>
    </div>
    {(()=>{const secondaryCount=8+(dataGapPositions.length>0?1:0)+(maturedPositions.length>0?1:0)+(vintagePositions.length>0?1:0);return(
    <button onClick={()=>setShowMoreKpis(s=>!s)} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 0',border:'none',background:'none',color:T.textSec,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:T.font,marginBottom:showMoreKpis?8:16}}>
      {showMoreKpis?'▾':'▸'} {showMoreKpis?'Hide':'Show'} {secondaryCount} more metric{secondaryCount===1?'':'s'}
    </button>);})()}
    {showMoreKpis&&<div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
      <KPICard label="Including Scope 3" value={fmt(totalFE+totalFEScope3)+' tCO2e'} sub="Reported separately per PCAF, shown here as a labeled secondary figure" color={T.navyL}/>
      <KPICard label="Scope 3 Required / Missing" value={`${scope3RequiredPositions.length} / ${scope3MissingPositions.length}`} sub={`reporting year ${reportingYear} | all-sector since ${SCOPE3_ALL_SECTOR_YEAR}`} color={scope3MissingPositions.length>0?T.red:T.green}/>
      <KPICard label="Undrawn Commitments" value={fmt(totalUndrawnFE)+' tCO2e'} sub="Reported separately per PCAF" color={T.purple||'#7c3aed'}/>
      {dataGapPositions.length>0&&<KPICard label="Data Gaps" value={`${dataGapPositions.length} position${dataGapPositions.length===1?'':'s'}`} sub="No plausible EVIC — excluded, not zeroed" color={T.red}/>}
      {maturedPositions.length>0&&<KPICard label="Matured Instruments" value={`${maturedPositions.length} position${maturedPositions.length===1?'':'s'}`} sub="Past maturity — excluded from totals, not zeroed" color={T.red}/>}
      {vintagePositions.length>0&&<KPICard label="Stale Data Vintage" value={`${vintagePositions.length} position${vintagePositions.length===1?'':'s'}`} sub=">24 months old — still included, PCAF requires vintage disclosure" color={T.amber}/>}
      <KPICard label="Carbon Footprint" value={carbonFootprint.toFixed(0)+' tCO2e/$Bn'} sub="Total FE / AUM" color={T.gold}/>
      <KPICard label="WACI (S1+2)" value={waci.toFixed(1)} sub="tCO2e / $M revenue" color={T.sage}/>
      <KPICard label="WACI (S1+2+3)" value={waciS123.toFixed(1)} sub="tCO2e / $M revenue, reported separately" color={T.sageL||T.sage}/>
      <KPICard label="Revenue Proxy" value={`${revenueProxyCount}/${positions.length}`} sub="positions using a sector proxy, not reported revenue — DQS capped at 4" color={revenueProxyCount>0?T.amber:T.green}/>
      <div style={{flex:'1 0 auto',background:T.surface,borderRadius:8,padding:'8px 12px',border:`1px solid ${T.border}`,minWidth:120}}>
        <div style={{fontSize:10,color:T.textSec,letterSpacing:0.3,marginBottom:4}}>CARBON COST</div>
        <CurrencyToggle usdValue={totalFE*carbonPrice} size="md" />
        <div style={{fontSize:9,color:T.textSec,marginTop:2}}>@ ${carbonPrice}/tCO2e</div>
      </div>
    </div>}
    {/* R3 gap D-4: the "CC Credits Financed" card previously rendered the
        global Carbon Credit Engine's platform-wide total credits issued
        (an unrelated, separately-tracked registry, not this portfolio's own
        financed emissions) under a label implying a real relationship
        between the two that doesn't exist — an 11-digit unexplained KPI on
        a disclosure screen. There is no genuine per-holding link between
        this portfolio and the carbon-credit registry to compute a real
        number from, so the card is removed rather than fabricating one. */}

    {/* Charts */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:20}}>
      <Card title="FE by Asset Class" citation="PCAF Standard, Chapter 5">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart><Pie data={byAC} dataKey="fe" nameKey="ac" cx="50%" cy="50%" outerRadius={80} label={e=>e.ac.split(' ')[0]+': '+fmt(e.fe)}>
            {byAC.map((d,i)=><Cell key={i} fill={AC_COLORS[d.ac]||PIE_COLORS[i%12]}/>)}
          </Pie><Tooltip {...tip}/></PieChart>
        </ResponsiveContainer>
      </Card>
      <Card title="FE by Geography">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byGeo}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="geo" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:9,fill:T.textSec}} tickFormatter={v=>fmt(v)}/><Tooltip {...tip}/><Bar dataKey="fe" name="Financed Em." radius={[4,4,0,0]}>{byGeo.map((d,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}</Bar></BarChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Top 10 Contributors">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={top10} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:9,fill:T.textSec}} tickFormatter={v=>fmt(v)}/><YAxis type="category" dataKey="name" tick={{fontSize:7,fill:T.textSec}} width={110}/><Tooltip {...tip}/><Bar dataKey="scopedFE" fill={T.navy} radius={[0,4,4,0]} name="FE tCO2e"/></BarChart>
        </ResponsiveContainer>
      </Card>
    </div>

    {/* YoY Comparison Toggle */}
    <div style={{marginBottom:12}}>
      <button onClick={()=>setShowYoY(!showYoY)} style={{padding:'6px 14px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:T.font,background:showYoY?T.navy:T.surface,color:showYoY?'#fff':T.text,fontWeight:600}}>{showYoY?'Hide':'Show'} Year-over-Year Trend</button>
      {showYoY&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:12}}>
        <Card title="Financed Emissions YoY" citation="Annual trend"><ResponsiveContainer width="100%" height={200}><AreaChart data={YOY_DATA}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:9,fill:T.textSec}} tickFormatter={v=>fmt(v)}/><Tooltip {...tip}/><Area type="monotone" dataKey="fe" stroke={T.navy} fill={T.navy+'30'} name="FE tCO2e"/></AreaChart></ResponsiveContainer></Card>
        <Card title="WACI & DQS Trend"><ResponsiveContainer width="100%" height={200}><LineChart data={YOY_DATA}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis yAxisId="waci" tick={{fontSize:9,fill:T.textSec}}/><YAxis yAxisId="dqs" orientation="right" domain={[1,5]} tick={{fontSize:9,fill:T.textSec}}/><Tooltip {...tip}/><Legend/><Line yAxisId="waci" type="monotone" dataKey="waci" stroke={T.gold} strokeWidth={2} name="WACI"/><Line yAxisId="dqs" type="monotone" dataKey="dqs" stroke={T.red} strokeWidth={2} name="Avg DQS"/></LineChart></ResponsiveContainer></Card>
      </div>}
    </div>

    {/* Filters & Actions */}
    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:12}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search company, sector, country\u2026" style={{padding:'7px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,width:240,color:T.text}}/>
      <select value={acFilter} onChange={e=>setAcFilter(e.target.value)} style={{padding:'6px 8px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.font}}>
        <option value="All">All Asset Classes ({positions.length})</option>
        {ALL_ASSET_CLASSES.map(ac=>{const c=positions.filter(p=>p.assetClass===ac).length;return c>0?<option key={ac} value={ac}>{ac} ({c})</option>:null;})}
      </select>
      <select value={geoFilter} onChange={e=>setGeoFilter(e.target.value)} style={{padding:'6px 8px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.font}}>
        <option value="All">All Geos</option>{['Americas','EMEA','APAC'].map(g=><option key={g}>{g}</option>)}
      </select>
      <select value={dqsFilter} onChange={e=>setDqsFilter(e.target.value)} style={{padding:'6px 8px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.font}}>
        <option value="All">All DQS</option>{[1,2,3,4,5].map(d=><option key={d} value={d}>DQS {d}</option>)}
      </select>
      <select value={scopeView} onChange={e=>setScopeView(e.target.value)} style={{padding:'6px 8px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.font}}>
        <option value="1+2">Scope 1+2</option><option value="1+2+3">Scope 1+2+3</option>
      </select>
      <div style={{display:'flex',alignItems:'center',gap:4}}><span style={{fontSize:10,color:T.textMut}}>Reporting Year:</span><input type="number" value={reportingYear} onChange={e=>setReportingYear(+e.target.value)} style={{width:64,padding:'4px 6px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:11}}/></div>
      <div style={{display:'flex',alignItems:'center',gap:4}}><span style={{fontSize:10,color:T.textMut}}>CO2 Price:</span><input type="number" value={carbonPrice} onChange={e=>setCarbonPrice(+e.target.value)} style={{width:60,padding:'4px 6px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:11}} min={0}/><span style={{fontSize:10,color:T.textMut}}>$/t</span></div>
      <div style={{marginLeft:'auto',display:'flex',gap:6}}>
        {selected.size>0&&<button onClick={removeSelected} style={{padding:'5px 12px',border:`1px solid ${T.red}`,borderRadius:6,background:'#fee2e2',color:T.red,fontSize:11,fontWeight:600,cursor:'pointer'}}>Remove {selected.size}</button>}
        <button onClick={exportCSV} style={{padding:'5px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,color:T.text,fontSize:11,cursor:'pointer'}}>CSV</button>
        <button onClick={()=>setShowAdd(true)} style={{padding:'5px 12px',border:'none',borderRadius:6,background:T.navy,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>+ Add</button>
      </div>
    </div>

    {/* Asset Class Summary Strip */}
    <div style={{display:'flex',gap:6,marginBottom:10,overflowX:'auto',paddingBottom:4}}>
      {byAC.map(ac=>(<div key={ac.ac} style={{padding:'4px 10px',background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,fontSize:10,whiteSpace:'nowrap',cursor:'pointer',borderLeft:`3px solid ${AC_COLORS[ac.ac]||T.navy}`}} onClick={()=>setAcFilter(acFilter===ac.ac?'All':ac.ac)}>
        <strong>{ac.ac}</strong>: {ac.count}pos | {fmt(ac.fe)}t | DQS {ac.avgDqs}
      </div>))}
    </div>

    {/* Main Holdings Table */}
    <div style={{overflowX:'auto',borderRadius:8,border:`1px solid ${T.border}`,maxHeight:560,overflowY:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
        <thead>
          <tr>
            <th style={{padding:'6px 8px',width:28,borderBottom:`1px solid ${T.border}`,background:T.bg,position:'sticky',top:0,zIndex:2}}><input type="checkbox" onChange={e=>{if(e.target.checked)setSelected(new Set(filtered.map(p=>p.id)));else setSelected(new Set());}}/></th>
            {hdr('name','Company')}{hdr('assetClass','Asset Class')}{hdr('sector','Sector')}{hdr('country','Ctry')}
            {hdr('outstanding','Exp $M','right')}{hdr('attrFactor','Attr%','right')}{hdr('scope1','S1 tCO2e','right','For Sovereign Debt rows this is a national GHG inventory (production-based, ex-LULUCF), not a corporate Scope 1 emission')}{hdr('scope2','S2 tCO2e','right')}
            {scopeView==='1+2+3'&&hdr('scope3','S3 tCO2e','right')}
            {hdr('financedEmissions','Fin.Em.','right')}{hdr('carbonIntensity','tCO2e/$M','right')}{hdr('dqs','DQS','center')}
            <th style={{padding:'6px 8px',borderBottom:`1px solid ${T.border}`,background:T.bg,position:'sticky',top:0,zIndex:2,fontSize:10,fontFamily:T.mono,color:T.textSec}}>Act</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p,ri)=>(
            <React.Fragment key={p.id}>
              <tr style={{background:ri%2===0?T.surface:T.bg,borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'5px 8px'}}><input type="checkbox" checked={selected.has(p.id)} onChange={()=>toggleSelect(p.id)}/></td>
                <td style={{padding:'5px 8px',fontWeight:600,color:T.navy,whiteSpace:'nowrap',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis'}} title={p.name}>
                  {p.name}
                  {p.evicWarning&&<span title={p.evicWarning} style={{color:T.amber,marginLeft:3,fontSize:9}}>\u26a0</span>}
                  {isScope3Required(p.sector,reportingYear)&&!p.scope3&&<span title={`Scope 3 required for reporting year ${reportingYear} (PCAF all-sector requirement from ${SCOPE3_ALL_SECTOR_YEAR}) but not provided`} style={{color:T.red,marginLeft:3,fontSize:9}}>S3\u26a0</span>}
                  {p.matured&&<span title={`Matured instrument (maturity ${p.maturityYear}) \u2014 excluded from totals, not zeroed`} style={{color:T.red,marginLeft:3,fontSize:9}}>MATURED</span>}
                  {p.vintageWarning&&<span title={`Data vintage ${p.dataVintageYears} years old (source: ${p.source}) \u2014 PCAF permits lagged data if disclosed`} style={{color:T.amber,marginLeft:3,fontSize:9}}>\u26a0 vintage</span>}
                </td>
                <td style={{padding:'5px 8px'}}><Badge color={AC_COLORS[p.assetClass]||T.navy}>{p.assetClass==='Commercial Real Estate'?'CRE':p.assetClass==='Undrawn Commitments'?'Undrawn':p.assetClass.length>16?p.assetClass.slice(0,14)+'\u2026':p.assetClass}</Badge></td>
                <td style={{padding:'5px 8px',color:T.textSec,fontSize:10}}>{p.sector}</td>
                <td style={{padding:'5px 8px',fontFamily:T.mono,fontSize:10}}>{p.country}</td>
                <td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono,fontSize:10}}>{fmtNum(p.outstanding)}</td>
                <td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono,fontSize:10}}>{fmtPct(p.attrFactor)}</td>
                {/* R3 gap B-6: Sovereign Debt's "Scope 1" figure is a
                    national GHG inventory (production-based, ex-LULUCF) —
                    not a corporate Scope 1 emission — mixing it visually
                    into the same column style as company emissions
                    understates that difference. Distinct color + tooltip,
                    same column (no schema change), for Sovereign rows. */}
                <td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono,fontSize:10,color:p.assetClass==='Sovereign Debt'?T.gold:undefined}} title={p.assetClass==='Sovereign Debt'?'National GHG inventory (production-based, ex-LULUCF) — not a corporate Scope 1 emission':undefined}>{fmt(p.scope1)}</td>
                <td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono,fontSize:10}}>{fmt(p.scope2)}</td>
                {scopeView==='1+2+3'&&<td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono,fontSize:10}}>{fmt(p.scope3)}</td>}
                <td style={{padding:'5px 8px',textAlign:'right',fontWeight:600,color:p.dataGap?T.red:p.financedEmissions>1e6?T.red:p.financedEmissions>1e5?T.amber:T.text,fontFamily:T.mono,fontSize:10}}>
                  {p.dataGap
                    ? <span title={p.dataGapReason}>⚠ Data gap</span>
                    : fmt(scopedFE(p,scopeView))}
                </td>
                <td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono,fontSize:10}}>{p.carbonIntensity.toFixed(0)}</td>
                <td style={{padding:'5px 8px',textAlign:'center'}}><span style={{fontWeight:700,color:DQS_COLOR[p.dqs]||T.text,fontSize:12}}>{p.dqs}</span></td>
                <td style={{padding:'5px 8px'}}>
                  <button onClick={()=>expandedId===p.id?setExpandedId(null):startEdit(p)} style={{padding:'2px 8px',border:`1px solid ${T.border}`,borderRadius:3,background:expandedId===p.id?T.navy:T.surface,color:expandedId===p.id?'#fff':T.text,fontSize:10,cursor:'pointer'}}>{expandedId===p.id?'\u2715':'Edit'}</button>
                </td>
              </tr>
              {expandedId===p.id&&(
                <tr style={{background:'#eff6ff',borderBottom:`1px solid ${T.border}`}}>
                  <td colSpan={scopeView==='1+2+3'?15:14} style={{padding:'10px 16px'}}>
                    <div style={{display:'flex',gap:12,alignItems:'flex-end',flexWrap:'wrap'}}>
                      <div><label style={{fontSize:10,color:T.textSec,display:'block',marginBottom:2}}>Outstanding ($M)</label><input style={{...inp,width:90}} type="number" value={editDraft.outstanding} onChange={e=>setEditDraft(d=>({...d,outstanding:e.target.value}))}/></div>
                      <div><label style={{fontSize:10,color:T.textSec,display:'block',marginBottom:2}}>EVIC ($Bn)</label><input style={{...inp,width:80}} type="number" value={editDraft.evicOverride||''} onChange={e=>setEditDraft(d=>({...d,evicOverride:e.target.value}))} placeholder="blank"/></div>
                      <div><label style={{fontSize:10,color:T.textSec,display:'block',marginBottom:2}}>Scope 1</label><input style={{...inp,width:100}} type="number" value={editDraft.scope1} onChange={e=>setEditDraft(d=>({...d,scope1:e.target.value}))}/></div>
                      <div><label style={{fontSize:10,color:T.textSec,display:'block',marginBottom:2}}>Scope 2</label><input style={{...inp,width:100}} type="number" value={editDraft.scope2} onChange={e=>setEditDraft(d=>({...d,scope2:e.target.value}))}/></div>
                      <div><label style={{fontSize:10,color:T.textSec,display:'block',marginBottom:2}}>Scope 3</label><input style={{...inp,width:100}} type="number" value={editDraft.scope3} onChange={e=>setEditDraft(d=>({...d,scope3:e.target.value}))}/></div>
                      <div><label style={{fontSize:10,color:T.textSec,display:'block',marginBottom:2}}>DQS</label><select style={{...inp,width:50}} value={editDraft.dqs} onChange={e=>setEditDraft(d=>({...d,dqs:e.target.value}))}>{[1,2,3,4,5].map(d=><option key={d}>{d}</option>)}</select></div>
                      <button onClick={()=>saveEdit(p)} style={{padding:'5px 14px',border:'none',borderRadius:4,background:T.sage,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>Save</button>
                      <button onClick={cancelEdit} style={{padding:'5px 14px',border:`1px solid ${T.border}`,borderRadius:4,background:T.surface,color:T.text,fontSize:11,fontWeight:600,cursor:'pointer'}}>Cancel</button>
                    </div>
                    {(()=>{const preview=previewRow(p);return(
                    <div style={{marginTop:6,fontSize:10,color:T.textMut,fontFamily:T.mono}}>
                      {preview.dataGap
                        ? <span style={{color:T.red}}>⚠ {preview.dataGapReason}</span>
                        : <>{(()=>{const _ch=ASSET_CLASS_DEFS.find(d=>d.ac===p.assetClass)?.ch;return _ch==='3rdEd'?'PCAF 3rd Ed. (Dec 2025)':`PCAF Ch.${_ch||'5'}`;})()}: FE = ({fmtPct(preview.attrFactor)}) \u00d7 {fmt(preview.totalEmissions)} = {fmt(preview.financedEmissions)} tCO2e | Carbon cost: ${(preview.financedEmissions*carbonPrice/1e6).toFixed(3)}M @ ${carbonPrice}/t | Source: {p.source} <span style={{color:T.amber}}>(live preview — click Save to commit)</span></>}
                    </div>);})()}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
      <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Showing {filtered.length} of {positions.length} positions | Scope: {scopeView} | Filtered FE: {fmt(filtered.filter(p=>!p.dataGap).reduce((s,p)=>s+scopedFE(p,scopeView),0))} tCO2e{filtered.some(p=>p.dataGap)?` (${filtered.filter(p=>p.dataGap).length} data gap${filtered.filter(p=>p.dataGap).length===1?'':'s'} excluded)`:''}</div>
      <div style={{fontSize:10,color:T.textMut}}>Total exposure: ${fmt(totalOut*1e6)} | Positions with EVIC warning: {positions.filter(p=>p.evicWarning).length}</div>
    </div>
    {showAdd&&<AddPositionModal onAdd={p=>setPositions(prev=>[p,...prev])} onClose={()=>setShowAdd(false)}/>}
  </div>);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB 2: PART C — INSURANCE-ASSOCIATED EMISSIONS (PCAF IAE Standard)
   8 Lines of Business with full methodology
   ═══════════════════════════════════════════════════════════════════════════════ */
// R3 gap U-A: lifted to module scope (out of PartBTab) so the parent
// component can compute the same lobResults once and hand them to both
// PartBTab and the new cross-asset-class ResultsStage — recomputing this
// independently in two places is exactly the "two sources of truth can
// diverge" bug this session has already fixed elsewhere (F-13, DQS duality).
//
// R3 gap B-3: Motor/Property/Commercial/Reinsurance/Project Insurance now
// run through the shared PCAF IAE calculator (data/pcafInsuranceEngine.js,
// ported verbatim from the India BRSR module — confirmed by the R3 review
// as the best PCAF methodology on the platform) instead of a flat
// GWP x sector-EF proxy that produced totals 3-4 orders of magnitude too
// low (~5,236 tCO2e on $17.3Bn GWP where PCAF's own attribution method
// lands in the 10^5-10^7 range). Life, Health, and Marine have no
// documented PCAF IAE methodology at all (Marine has none; Life/Health are
// explicitly excluded by the Standard) and stay on the old premium x EF
// proxy, clearly labeled non-PCAF — previously Marine was silently folded
// into the "PCAF-scoped" total despite its efSource already saying
// "not PCAF-defined"; it's now ring-fenced alongside Life/Health.
function computeLobResults(lobData){
  return lobData.map(l=>{
    const lobValue=LOB_FIELDS[l.lob]?.lobValues?.[0];
    if(!lobValue){
      const tco2e=Math.round(l.premiumM*l.efPerPremium);
      return{...l,tco2e,outOfPcafScope:true,
        dataGapReason:`${l.lob} has no documented PCAF IAE methodology — illustrative proxy only, excluded from the PCAF-labeled total`,
        engineComputed:false};
    }
    const{tco2e,outOfPcafScope,dataGapReason}=calcPolicyEmissions({
      line_of_business:lobValue,gross_written_premium_musd:l.premiumM,
      vehicle_count:l.vehicle_count,fuel_type:l.fuel_type,annual_km_per_vehicle:l.annual_km_per_vehicle,
      insured_property_area_m2:l.insured_property_area_m2,epc_rating:l.epc_rating,
      insured_revenue_musd:l.insured_revenue_musd,
      ceded_premium_musd:l.ceded_premium_musd,cedent_total_gwp_musd:l.cedent_total_gwp_musd,cedent_reported_tco2e:l.cedent_reported_tco2e,
      sum_insured_musd:l.sum_insured_musd,total_project_cost_musd:l.total_project_cost_musd,project_scope1_tco2e:l.project_scope1_tco2e,
    });
    return{...l,tco2e:Math.round(tco2e),outOfPcafScope,dataGapReason,engineComputed:true};
  });
}

function PartBTab({lobData,setLobData,lobResults}){
  const[editId,setEditId]=useState(null);
  const[editForm,setEditForm]=useState({});
  const[showDetails,setShowDetails]=useState(null);

  const inScopeLob=useMemo(()=>lobResults.filter(l=>!l.outOfPcafScope),[lobResults]);
  const outOfScopeLob=useMemo(()=>lobResults.filter(l=>l.outOfPcafScope),[lobResults]);
  const totalPremium=useMemo(()=>lobResults.reduce((s,l)=>s+l.premiumM,0),[lobResults]);
  const totalFE=useMemo(()=>inScopeLob.reduce((s,l)=>s+l.tco2e,0),[inScopeLob]);
  const totalExtendedFE=useMemo(()=>outOfScopeLob.reduce((s,l)=>s+l.tco2e,0),[outOfScopeLob]);
  const totalClaims=useMemo(()=>lobResults.reduce((s,l)=>s+l.claimsM,0),[lobResults]);
  const totalExposure=useMemo(()=>lobResults.reduce((s,l)=>s+l.exposureM,0),[lobResults]);
  const avgDqs=useMemo(()=>lobResults.length?(lobResults.reduce((s,l)=>s+l.dqs,0)/lobResults.length).toFixed(1):'—',[lobResults]);
  const lobFE=useMemo(()=>lobResults.map(l=>({lob:l.lob,fe:l.tco2e,premium:l.premiumM,intensity:l.premiumM>0?(l.tco2e/l.premiumM).toFixed(2):'0.00',outOfScope:l.outOfPcafScope})),[lobResults]);
  const lossRatio=useMemo(()=>(totalPremium ? totalClaims/totalPremium*100 : 0).toFixed(1),[totalClaims,totalPremium]);

  function startLobEdit(l){setEditId(l.id);setEditForm({premiumM:l.premiumM,claimsM:l.claimsM,exposureM:l.exposureM,dqs:l.dqs});}
  function applyLobEdit(id){setLobData(prev=>prev.map(l=>l.id===id?{...l,premiumM:+editForm.premiumM,claimsM:+editForm.claimsM,exposureM:+editForm.exposureM,dqs:+editForm.dqs}:l));setEditId(null);}

  return(<div>
    <SectionHeader title="Part C: Insurance-Associated Emissions" citation={PCAF_PART_C} description={`${lobResults.length} lines of business (${inScopeLob.length} in PCAF IAE scope, ${outOfScopeLob.length} extended/out-of-scope). Motor/Property/Commercial/Reinsurance/Project Insurance use PCAF's real per-LOB attribution methodology (ported from the India BRSR module); Life/Health/Marine have no PCAF IAE methodology and are excluded from the PCAF-labeled total. Total GWP: $${fmt(totalPremium*1e6)}.`}/>
    {totalExtendedFE>0&&<InfoBox type="info">ℹ️ {outOfScopeLob.map(l=>l.lob).join(', ')} ({fmt(totalExtendedFE)} tCO2e) have no documented PCAF IAE methodology — shown separately below, excluded from the PCAF-labeled total.</InfoBox>}
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
      <KPICard label="Total GWP" value={'$'+fmt(totalPremium*1e6)} sub="Gross written premium" color={T.navy}/>
      <KPICard label="Insurance FE (PCAF-scoped)" value={fmt(totalFE)+' tCO2e'} sub={`${inScopeLob.length} in-scope LOBs`} color={T.red}/>
      {totalExtendedFE>0&&<KPICard label="Extended, non-PCAF" value={fmt(totalExtendedFE)+' tCO2e'} sub="Life/Health/Marine — excluded from PCAF total" color={T.textMut}/>}
      <KPICard label="Total Exposure" value={'$'+fmt(totalExposure*1e6)} sub="Sum insured" color={T.gold}/>
      <KPICard label="Loss Ratio" value={lossRatio+'%'} sub="Claims / Premium" color={+lossRatio>70?T.red:T.green}/>
      <KPICard label="Avg DQS" value={avgDqs} sub="LOB weighted" color={DQS_COLOR[Math.round(+avgDqs)]||T.amber}/>
      <KPICard label="Avg Intensity" value={(totalPremium ? totalFE/totalPremium : 0).toFixed(3)} sub="tCO2e per $M GWP (PCAF-scoped)" color={T.sage}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
      <Card title="FE by Line of Business" citation={PCAF_PART_C}>
        <ResponsiveContainer width="100%" height={250}><BarChart data={lobFE}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="lob" tick={{fontSize:9,fill:T.textSec}}/><YAxis tick={{fontSize:9,fill:T.textSec}} tickFormatter={v=>fmt(v)}/><Tooltip {...tip}/><Bar dataKey="fe" name="FE tCO2e" radius={[4,4,0,0]}>{lobFE.map((d,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}</Bar></BarChart></ResponsiveContainer>
      </Card>
      <Card title="Premium vs Claims by LOB">
        <ResponsiveContainer width="100%" height={250}><BarChart data={lobResults}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="lob" tick={{fontSize:9,fill:T.textSec}}/><YAxis tick={{fontSize:9,fill:T.textSec}}/><Tooltip {...tip}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="premiumM" name="Premium $M" fill={T.navy}/><Bar dataKey="claimsM" name="Claims $M" fill={T.gold}/></BarChart></ResponsiveContainer>
      </Card>
    </div>

    {/* LOB Detail Table */}
    <div style={{overflowX:'auto',borderRadius:8,border:`1px solid ${T.border}`}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
        <thead style={{background:T.bg}}><tr>
          {['LOB','Sub-LOB','Premium $M','Claims $M','Exposure $M','Implied Intensity (tCO2e/$M)','Financed Em.','DQS','Actions'].map(h=><th key={h} style={{padding:'7px 8px',textAlign:'left',fontSize:10,fontWeight:700,color:T.textSec,borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{h}</th>)}
        </tr></thead>
        <tbody>{lobResults.map((l,ri)=>(
          <React.Fragment key={l.id}>
            <tr style={{background:ri%2===0?T.surface:T.bg,borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:'6px 8px',fontWeight:600,color:T.navy}}>{l.lob}{l.outOfPcafScope&&<span style={{marginLeft:6,background:'#fef2f2',color:'#b91c1c',border:'1px solid #fca5a5',borderRadius:10,padding:'1px 6px',fontSize:9,fontWeight:700}}>extended, non-PCAF</span>}{l.engineComputed&&<span style={{marginLeft:6,background:'#f0fdf4',color:'#15803d',border:'1px solid #86efac',borderRadius:10,padding:'1px 6px',fontSize:9,fontWeight:700}}>PCAF IAE</span>}</td>
              <td style={{padding:'6px 8px',fontSize:10,color:T.textSec}}>{l.subLob}</td>
              <td style={{padding:'6px 8px',textAlign:'right'}}>{editId===l.id?<input type="number" value={editForm.premiumM} onChange={e=>setEditForm(f=>({...f,premiumM:e.target.value}))} style={{width:80,padding:'3px 6px',border:`1px solid ${T.border}`,borderRadius:3,fontSize:11}}/>:fmtNum(l.premiumM)}</td>
              <td style={{padding:'6px 8px',textAlign:'right'}}>{editId===l.id?<input type="number" value={editForm.claimsM} onChange={e=>setEditForm(f=>({...f,claimsM:e.target.value}))} style={{width:80,padding:'3px 6px',border:`1px solid ${T.border}`,borderRadius:3,fontSize:11}}/>:fmtNum(l.claimsM)}</td>
              <td style={{padding:'6px 8px',textAlign:'right'}}>{fmtNum(l.exposureM)}</td>
              <td style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono}} title={l.engineComputed?'Derived from the PCAF IAE per-LOB inputs, not a directly-set coefficient':'Editable flat proxy — no PCAF methodology exists for this LOB'}>{l.premiumM>0?(l.tco2e/l.premiumM).toFixed(2):'0.00'}</td>
              <td style={{padding:'6px 8px',textAlign:'right',fontWeight:600,color:l.tco2e>500000?T.red:T.text}}>{fmt(l.tco2e)}</td>
              <td style={{padding:'6px 8px',textAlign:'center'}}><span style={{fontWeight:700,color:DQS_COLOR[l.dqs]}}>{l.dqs}</span></td>
              <td style={{padding:'6px 8px',display:'flex',gap:4}}>
                {editId===l.id?<button onClick={()=>applyLobEdit(l.id)} style={{padding:'2px 8px',border:'none',borderRadius:3,background:T.sage,color:'#fff',fontSize:10,cursor:'pointer'}}>Save</button>:<button onClick={()=>startLobEdit(l)} style={{padding:'2px 8px',border:`1px solid ${T.border}`,borderRadius:3,fontSize:10,cursor:'pointer'}}>Edit</button>}
                <button onClick={()=>setShowDetails(showDetails===l.id?null:l.id)} style={{padding:'2px 8px',border:`1px solid ${T.border}`,borderRadius:3,fontSize:10,cursor:'pointer'}}>{showDetails===l.id?'–':'+'}</button>
              </td>
            </tr>
            {showDetails===l.id&&<tr style={{background:'#f8fafc'}}><td colSpan={9} style={{padding:'10px 16px',fontSize:11,lineHeight:1.6}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><strong style={{color:T.navy}}>Methodology:</strong><br/>{l.methodology}</div>
                <div><strong style={{color:T.navy}}>Risk Factors:</strong><br/>{l.riskFactors}</div>
              </div>
              <div style={{marginTop:8,padding:8,background:T.bg,borderRadius:4,fontFamily:T.mono,fontSize:10}}>
                {l.engineComputed
                  ? <>PCAF IAE calculation (see Methodology above) = {fmt(l.tco2e)} tCO2e | Premium ${fmtNum(l.premiumM)}M shown for context only — not the attribution driver</>
                  : <>Calculation: FE = ${fmtNum(l.premiumM)}M × {l.efPerPremium} tCO2e/$M = {fmt(l.tco2e)} tCO2e | Source: {l.efSource}</>}
              </div>
            </td></tr>}
          </React.Fragment>
        ))}</tbody>
      </table>
    </div>
    <InfoBox type="info"><strong>{PCAF_PART_C}:</strong> Motor, Property, Commercial, Reinsurance, and Project Insurance are computed via PCAF's real IAE attribution methodology per line of business (vehicle-count x fuel EF for motor; area x EPC-band EF for property; insured revenue x sector EF for commercial; ceded-premium share of cedent emissions for treaty reinsurance; sum-insured share of project Scope 1 for project insurance) — the same calculators used by the India BRSR module. Life, Health, and Marine have no documented PCAF IAE methodology and are excluded from the PCAF-labeled total above. For investment-side emissions, see Part A (financed emissions).</InfoBox>
  </div>);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB 3: PART C — FACILITATED EMISSIONS (Chapter 6)
   7 Deal Types with full attribution
   ═══════════════════════════════════════════════════════════════════════════════ */
// PCAF's actual Part B (Facilitated Emissions, Dec 2023) formula is
// (Underwritten / Issuer EVIC) x 33% weighting factor \u2014 not Underwritten /
// Deal Size with no weighting, which is what this tab previously computed
// (GAP-010; e.g. TotalEnergies bond showed 10.64M tCO2e with none of the
// 33% factor applied). Cross-reference each deal's client against
// BASE_POSITIONS (which already carries real EVIC for these same companies)
// to get a real denominator; fall back to Deal Size when no match exists,
// clearly flagged as a proxy. M&A advisory is out of scope of PCAF Part B
// (capital-markets issuance only per GAP-011) and is excluded from the
// PCAF-labeled total, shown separately instead.
const FACILITATED_WEIGHTING_FACTOR=0.33;
const _EVIC_BY_CLIENT=Object.fromEntries(BASE_POSITIONS.filter(p=>p.evic).map(p=>[p.name.toLowerCase(),p.evic]));
function lookupClientEvicBn(client){
  const key=(client||'').toLowerCase();
  if(_EVIC_BY_CLIENT[key])return _EVIC_BY_CLIENT[key];
  const match=Object.keys(_EVIC_BY_CLIENT).find(n=>key.includes(n.split(' ')[0])||n.includes(key.split(' ')[0]));
  return match?_EVIC_BY_CLIENT[match]:null;
}

// R3 gap U-A: lifted to module scope for the same reason as
// computeLobResults above \u2014 one computation, shared by PartCTab and
// ResultsStage, instead of a second copy that can drift.
function computeDealData(deals){
  return deals.map(d=>{
    const outOfScope=d.type==='Advisory M&A';
    const evicBn=lookupClientEvicBn(d.client);
    let attr=0,denomBasis='none';
    if(!outOfScope&&d.underwrittenM>0){
      if(evicBn){attr=((d.underwrittenM/1000)/evicBn)*FACILITATED_WEIGHTING_FACTOR;denomBasis='EVIC';}
      else{attr=(d.underwrittenM/d.dealSizeM)*FACILITATED_WEIGHTING_FACTOR;denomBasis='Deal Size (proxy \u2014 no EVIC match)';}
    }
    const clientEM=(d.clientScope1||0)+(d.clientScope2||0);
    // R3 gap B-5: advisory/M&A's extended (non-PCAF) figure is now the
    // deal's own visible attribution basis (advisoryShare x clientEM,
    // advisoryShare = advisory fee share of deal size, capped at 10% per
    // attrFormula's own documented cap) instead of a flat, undocumented 0.10
    // constant \u2014 previously the KPI card showed a non-zero total while this
    // same row's table cell showed a bare 0 with no way to see how the two
    // numbers related (R3 finding: card showed 1.54M with no visible
    // derivation).
    const advisoryShare=outOfScope?Math.min(0.10,(d.advisoryFeeM||d.dealSizeM*0.02)/d.dealSizeM||0.10):0;
    const extendedEm=outOfScope?Math.round(advisoryShare*clientEM):0;
    return{...d,attrFactor:attr,clientEM,denomBasis,outOfScope,facilitatedEm:outOfScope?0:Math.round(attr*clientEM),facilitatedScope3:outOfScope?0:Math.round(attr*(d.clientScope3||0)),advisoryShare,extendedEm};
  });
}

function PartCTab({deals,setDeals,dealData}){
  const[showForm,setShowForm]=useState(false);
  const[expandedDeal,setExpandedDeal]=useState(null);
  const[newDeal,setNewDeal]=useState({type:'Bond Underwriting',client:'',sector:'',dealSizeM:'',underwrittenM:'',clientScope1:'',clientScope2:'',dqs:'3'});

  const totalFac=useMemo(()=>dealData.reduce((s,d)=>s+d.facilitatedEm,0),[dealData]);
  const totalExtended=useMemo(()=>dealData.reduce((s,d)=>s+d.extendedEm,0),[dealData]);
  const totalDeals=useMemo(()=>deals.reduce((s,d)=>s+d.dealSizeM,0),[deals]);
  const totalUW=useMemo(()=>deals.reduce((s,d)=>s+d.underwrittenM,0),[deals]);
  // R3 gap B-5: PCAF's Part B standard permits an additional 100%-unweighted
  // disclosure alongside the mandatory 33%-weighted figure, provided it is
  // reported separately with rationale (not blended into the PCAF-labeled
  // total above). unweightedFac = weighted total / 0.33 (the weighting
  // factor's own inverse), so the two figures algebraically reconcile.
  const totalFacUnweighted=useMemo(()=>totalFac/FACILITATED_WEIGHTING_FACTOR,[totalFac]);

  function addDeal(){
    if(!newDeal.client||!newDeal.dealSizeM)return;
    const d={...newDeal,id:Date.now(),dealSizeM:+newDeal.dealSizeM,underwrittenM:+(newDeal.underwrittenM||0),clientScope1:+(newDeal.clientScope1||0),clientScope2:+(newDeal.clientScope2||0),clientScope3:0,dqs:+newDeal.dqs,attrFormula:'(Underwritten / EVIC) \u00d7 33%',citation:'PCAF Standard, Part B \u2014 Facilitated Emissions (Dec 2023)',year:2024,bookRunner:'TBD',peerGroup:'TBD'};
    setDeals(prev=>[d,...prev]);setShowForm(false);
  }

  return(<div>
    <SectionHeader title="Part B: Facilitated Emissions" citation={PCAF_PART_B} description={`${deals.length} transactions. Attribution = (Underwritten Amount / Issuer EVIC) \u00d7 33% weighting factor (mandatory). An additional 100%-unweighted figure is permitted as an optional, separately-reported disclosure per the standard \u2014 shown below, never blended into the PCAF-scoped total. M&A/advisory mandates are out of scope (capital-markets issuance only) and shown as an extended, non-PCAF metric with its own visible derivation.`}/>
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
      <KPICard label="Total Facilitated Em. (PCAF-scoped, 33% wtd.)" value={fmt(totalFac)+' tCO2e'} sub={`${deals.length} transactions`} color={T.navy}/>
      <KPICard label="Facilitated @100% (unweighted, per PCAF option)" value={fmt(totalFacUnweighted)+' tCO2e'} sub="= PCAF-scoped total ÷ 0.33, reported separately per Part B" color={T.navyL}/>
      {totalExtended>0&&<KPICard label="Advisory/M&A (extended, non-PCAF)" value={fmt(totalExtended)+' tCO2e'} sub="= advisory-fee-share × client emissions, capped at 10% — out of PCAF Part B scope" color={T.textMut}/>}
      <KPICard label="Deal Volume" value={'$'+fmt(totalDeals*1e6)} sub="Total deal size" color={T.gold}/>
      <KPICard label="Underwritten" value={'$'+fmt(totalUW*1e6)} sub="Bank committed" color={T.sage}/>
      <KPICard label="Avg Attribution" value={totalDeals>0?fmtPct(totalUW/totalDeals):'\u2014'} sub="UW / Deal (unweighted, informational)" color={T.navyL}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
      <Card title="Facilitated Em. by Deal Type" citation="PCAF Standard, Part B (Dec 2023)">
        <ResponsiveContainer width="100%" height={230}><BarChart data={dealData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="type" tick={{fontSize:8,fill:T.textSec}} interval={0}/><YAxis tick={{fontSize:9,fill:T.textSec}} tickFormatter={v=>fmt(v)}/><Tooltip {...tip}/><Bar dataKey="facilitatedEm" name="Facilitated Em." radius={[4,4,0,0]}>{dealData.map((d,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}</Bar></BarChart></ResponsiveContainer>
      </Card>
      <Card title="Deal Size vs Underwritten">
        <ResponsiveContainer width="100%" height={230}><BarChart data={dealData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="client" tick={{fontSize:7,fill:T.textSec}}/><YAxis tick={{fontSize:9,fill:T.textSec}}/><Tooltip {...tip}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="dealSizeM" name="Deal $M" fill={T.navy}/><Bar dataKey="underwrittenM" name="UW $M" fill={T.gold}/></BarChart></ResponsiveContainer>
      </Card>
    </div>
    <div style={{display:'flex',justifyContent:'flex-end',marginBottom:8}}>
      <button onClick={()=>setShowForm(!showForm)} style={{padding:'5px 12px',border:'none',borderRadius:6,background:T.navy,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>{showForm?'Cancel':'+ Add Deal'}</button>
    </div>
    {showForm&&<div style={{background:T.surfaceH,border:`1px solid ${T.border}`,borderRadius:8,padding:14,marginBottom:12,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
      <div><label style={{fontSize:10,color:T.textSec}}>Deal Type</label><select value={newDeal.type} onChange={e=>setNewDeal(f=>({...f,type:e.target.value}))} style={{width:'100%',padding:'5px',border:`1px solid ${T.border}`,borderRadius:3,fontSize:11}}>{['Bond Underwriting','IPO','Equity Placement','Syndicated Loan','Securitisation','Convertible Bond','Advisory M&A'].map(t=><option key={t}>{t}</option>)}</select></div>
      <div><label style={{fontSize:10,color:T.textSec}}>Client</label><input value={newDeal.client} onChange={e=>setNewDeal(f=>({...f,client:e.target.value}))} style={{width:'100%',padding:'5px',border:`1px solid ${T.border}`,borderRadius:3,fontSize:11}}/></div>
      <div><label style={{fontSize:10,color:T.textSec}}>Deal Size ($M)</label><input type="number" value={newDeal.dealSizeM} onChange={e=>setNewDeal(f=>({...f,dealSizeM:e.target.value}))} style={{width:'100%',padding:'5px',border:`1px solid ${T.border}`,borderRadius:3,fontSize:11}}/></div>
      <div><label style={{fontSize:10,color:T.textSec}}>Underwritten ($M)</label><input type="number" value={newDeal.underwrittenM} onChange={e=>setNewDeal(f=>({...f,underwrittenM:e.target.value}))} style={{width:'100%',padding:'5px',border:`1px solid ${T.border}`,borderRadius:3,fontSize:11}}/></div>
      <div><label style={{fontSize:10,color:T.textSec}}>Client Scope 1 (tCO2e)</label><input type="number" value={newDeal.clientScope1} onChange={e=>setNewDeal(f=>({...f,clientScope1:e.target.value}))} style={{width:'100%',padding:'5px',border:`1px solid ${T.border}`,borderRadius:3,fontSize:11}}/></div>
      <div style={{display:'flex',alignItems:'flex-end'}}><button onClick={addDeal} style={{padding:'6px 14px',border:'none',borderRadius:4,background:T.sage,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>Add</button></div>
    </div>}
    <div style={{overflowX:'auto',borderRadius:8,border:`1px solid ${T.border}`}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
        <thead style={{background:T.bg}}><tr>
          {['Type','Client','Sector','Year','Deal $M','UW $M','Attr%','Client Em.','Facilitated Em.','DQS','Ref'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',fontSize:10,fontWeight:700,color:T.textSec,borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{h}</th>)}
        </tr></thead>
        <tbody>{dealData.map((d,ri)=>(
          <tr key={d.id} style={{background:ri%2===0?T.surface:T.bg,cursor:'pointer'}} onClick={()=>setExpandedDeal(expandedDeal===d.id?null:d.id)}>
            <td style={{padding:'5px 8px'}}><Badge color={PIE_COLORS[ri%10]}>{d.type}</Badge></td>
            <td style={{padding:'5px 8px',fontWeight:600,color:T.navy}}>{d.client}</td>
            <td style={{padding:'5px 8px',fontSize:10,color:T.textSec}}>{d.sector}</td>
            <td style={{padding:'5px 8px',fontFamily:T.mono,fontSize:10}}>{d.year}</td>
            <td style={{padding:'5px 8px',textAlign:'right'}}>{fmtNum(d.dealSizeM)}</td>
            <td style={{padding:'5px 8px',textAlign:'right'}}>{fmtNum(d.underwrittenM)}</td>
            <td style={{padding:'5px 8px',textAlign:'right'}}>{d.outOfScope?fmtPct(d.advisoryShare):fmtPct(d.attrFactor)}</td>
            <td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono,fontSize:10}}>{fmt(d.clientEM)}</td>
            <td style={{padding:'5px 8px',textAlign:'right',fontWeight:600,color:d.facilitatedEm>5e6?T.red:T.text}} title={d.outOfScope?`Out of PCAF Part B scope — extended metric = ${fmtPct(d.advisoryShare)} × ${fmt(d.clientEM)} = ${fmt(d.extendedEm)} tCO2e (not counted in the PCAF-scoped total)`:undefined}>
              {d.outOfScope
                ? <span style={{color:T.textMut}}>{fmt(d.extendedEm)} <Badge color={T.textMut}>extended</Badge></span>
                : fmt(d.facilitatedEm)}
            </td>
            <td style={{padding:'5px 8px',textAlign:'center'}}><span style={{fontWeight:700,color:DQS_COLOR[d.dqs]}}>{d.dqs}</span></td>
            <td style={{padding:'5px 8px',fontSize:9,fontFamily:T.mono,color:T.textMut}}>{d.citation}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  </div>);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB 4: DATA QUALITY — DQS 1-5, improvement wizard, coverage, 12Q trend
   ═══════════════════════════════════════════════════════════════════════════════ */
function DataQualityTab({positions,setPositions}){
  const[actionStatus,setActionStatus]=useState({});
  const[targetDqs,setTargetDqs]=useState(Object.fromEntries(ALL_ASSET_CLASSES.map(ac=>[ac,['Mortgages','Vehicle Loans','Securitisations'].includes(ac)?3:2])));

  const byDqs=useMemo(()=>{const g={1:[],2:[],3:[],4:[],5:[]};positions.forEach(p=>g[p.dqs].push(p));return g;},[positions]);
  const currentAvg=(positions.length ? positions.reduce((s,p)=>s+p.dqs,0)/positions.length : 0).toFixed(2);
  const simulatedAvg=useMemo(()=>{let t=0;positions.forEach(p=>{t+=Math.min(p.dqs,targetDqs[p.assetClass]||p.dqs);});return(positions.length ? t/positions.length : 0).toFixed(2);},[positions,targetDqs]);
  const improved=Object.values(actionStatus).filter(v=>v==='complete').length;
  const dqsByAC=useMemo(()=>{const m={};positions.forEach(p=>{if(!m[p.assetClass])m[p.assetClass]={ac:p.assetClass,avg:0,n:0,t:0};m[p.assetClass].t+=p.dqs;m[p.assetClass].n++;});Object.values(m).forEach(v=>v.avg=+(v.t/v.n).toFixed(1));return Object.values(m).sort((a,b)=>b.avg-a.avg);},[positions]);
  const coverageByScope=useMemo(()=>[{scope:'Scope 1',pct:Math.round(positions.filter(p=>p.scope1>0).length/(positions.length||1)*100)},{scope:'Scope 2',pct:Math.round(positions.filter(p=>p.scope2>0).length/(positions.length||1)*100)},{scope:'Scope 3',pct:Math.round(positions.filter(p=>p.scope3>0).length/(positions.length||1)*100)}],[positions]);

  function markAction(id,st){setActionStatus(prev=>({...prev,[id]:st}));if(st==='complete')setPositions(prev=>prev.map(p=>p.id===id?computeRow({...p,dqs:Math.max(1,p.dqs-1)}):p));}

  return(<div>
    <SectionHeader title="Data Quality Assessment" citation={PCAF_PART_A} description="DQS 1-5 scoring per holding. Improvement wizard with actionable steps. Coverage analysis by scope. 12-quarter quality trend."/>
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
      <KPICard label="Current Avg DQS" value={currentAvg} color={DQS_COLOR[Math.round(+currentAvg)]}/>
      <KPICard label="Target DQS" value={simulatedAvg} sub="After improvements" color={T.sage}/>
      <KPICard label="Actions Done" value={`${improved}/${positions.length}`} color={T.navyL}/>
      <KPICard label="DQS 4-5" value={byDqs[4].length+byDqs[5].length} sub="Urgent upgrade" color={T.red}/>
      <KPICard label="DQS 1-2" value={byDqs[1].length+byDqs[2].length} sub="High quality" color={T.green}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:20}}>
      <Card title="DQS Distribution"><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={[1,2,3,4,5].map(s=>({name:`DQS ${s}`,value:byDqs[s].length}))} dataKey="value" cx="50%" cy="50%" outerRadius={75} label={e=>`${e.name}: ${e.value}`} labelLine={false}>{[1,2,3,4,5].map((s,i)=><Cell key={i} fill={DQS_COLOR[s]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></Card>
      <Card title="Avg DQS by Asset Class"><ResponsiveContainer width="100%" height={200}><BarChart data={dqsByAC} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,5]} tick={{fontSize:9}}/><YAxis type="category" dataKey="ac" tick={{fontSize:7,fill:T.textSec}} width={100}/><Tooltip {...tip}/><Bar dataKey="avg" radius={[0,4,4,0]}>{dqsByAC.map((d,i)=><Cell key={i} fill={DQS_COLOR[Math.round(d.avg)]}/>)}</Bar></BarChart></ResponsiveContainer></Card>
      <Card title="12-Quarter DQS Trend" citation="PCAF Standard, Chapter 3"><ResponsiveContainer width="100%" height={200}><LineChart data={QUARTERLY_DQS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="q" tick={{fontSize:8,fill:T.textSec}}/><YAxis domain={[1,5]} tick={{fontSize:9}}/><Tooltip {...tip}/><Line type="monotone" dataKey="avg" stroke={T.navy} strokeWidth={2} name="Avg DQS"/></LineChart></ResponsiveContainer></Card>
    </div>
    <Card title="DQS Target Setter" style={{marginBottom:16}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>{ALL_ASSET_CLASSES.filter(ac=>positions.some(p=>p.assetClass===ac)).map(ac=><div key={ac} style={{display:'flex',alignItems:'center',gap:6,padding:'5px 8px',background:T.bg,borderRadius:4}}>
        <Badge color={AC_COLORS[ac]||T.navy}>{ac.length>15?ac.slice(0,13)+'\u2026':ac}</Badge><div style={{flex:1}}/><select value={targetDqs[ac]||3} onChange={e=>setTargetDqs(t=>({...t,[ac]:+e.target.value}))} style={{padding:'2px 4px',border:`1px solid ${T.border}`,borderRadius:3,fontSize:11}}>{[1,2,3,4,5].map(d=><option key={d}>{d}</option>)}</select>
      </div>)}</div>
      <InfoBox type="success"><strong>Simulated:</strong> DQS {simulatedAvg} (current {currentAvg}). Improvement: {(+currentAvg-+simulatedAvg).toFixed(2)} points.</InfoBox>
    </Card>
    <SectionHeader title="Improvement Actions (DQS 3-5)"/>
    {[5,4,3].map(score=>byDqs[score].length>0&&<div key={score} style={{marginBottom:14}}>
      <div style={{fontSize:12,fontWeight:700,color:DQS_COLOR[score],marginBottom:6}}>DQS {score} \u2014 {byDqs[score].length} positions</div>
      <div style={{fontSize:11,color:T.textMut,marginBottom:6,lineHeight:1.5}}>{DQS_IMPROVEMENT_STEPS[score]}</div>
      {byDqs[score].map(p=>{const st=actionStatus[p.id];return<div key={p.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',background:T.surface,border:`1px solid ${T.border}`,borderRadius:5,marginBottom:4}}>
        <span style={{flex:1,fontSize:11,fontWeight:600,color:T.navy}}>{p.name}</span>
        <Badge color={AC_COLORS[p.assetClass]||T.navy}>{p.assetClass.split(' ')[0]}</Badge>
        <span style={{fontSize:9,color:T.textMut}}>{p.source}</span>
        {st==='complete'?<span style={{fontSize:10,fontWeight:700,color:T.green}}>Done</span>:st==='inprogress'?<button onClick={()=>markAction(p.id,'complete')} style={{padding:'3px 10px',border:`1px solid ${T.sage}`,borderRadius:3,background:'#f0fdf4',color:T.sage,fontSize:10,fontWeight:600,cursor:'pointer'}}>Complete</button>:<button onClick={()=>markAction(p.id,'inprogress')} style={{padding:'3px 10px',border:`1px solid ${T.amber}`,borderRadius:3,background:'#fffbeb',color:T.amber,fontSize:10,fontWeight:600,cursor:'pointer'}}>Start</button>}
      </div>;})}
    </div>)}
  </div>);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB 5: REFERENCE DATA
   ═══════════════════════════════════════════════════════════════════════════════ */
function ReferenceDataTab(){
  const[sec,setSec]=useState('ef');
  const efRows=useMemo(()=>{const rows=[];['transport','energy','materials','scope3_spend'].forEach(cat=>{const items=EMISSION_FACTORS[cat];if(items)Object.entries(items).forEach(([k,v])=>rows.push({cat,key:k,...v}));});return rows;},[]);
  const sbRows=useMemo(()=>(SECTOR_BENCHMARKS||[]).slice(0,30),[]);

  return(<div>
    <SectionHeader title="Reference Data & Methodology" citation={PCAF_PART_A}/>
    <div style={{display:'flex',gap:6,marginBottom:14}}>
      {[['ef','Emission Factors'],['sb','Sector Benchmarks'],['ac','Asset Class Defs'],['dqs','DQS Definitions'],['cp','Carbon Prices']].map(([k,l])=><button key={k} onClick={()=>setSec(k)} style={{padding:'5px 12px',border:`1px solid ${sec===k?T.navy:T.border}`,borderRadius:16,fontSize:11,fontWeight:sec===k?700:400,background:sec===k?T.navy:T.surface,color:sec===k?'#fff':T.text,cursor:'pointer'}}>{l}</button>)}
    </div>
    {sec==='ef'&&<Card title="DEFRA/EXIOBASE Emission Factors" citation="[1]"><div style={{maxHeight:500,overflowY:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
      <thead style={{position:'sticky',top:0,background:T.bg}}><tr>{['Cat','Key','Factor','Unit','Source'].map(h=><th key={h} style={{padding:'5px 6px',textAlign:'left',fontSize:9,fontWeight:700,color:T.textSec,borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{h}</th>)}</tr></thead>
      <tbody>{efRows.map((r,i)=><tr key={i} style={{background:i%2===0?T.surface:T.bg}}><td style={{padding:'4px 6px'}}>{r.cat}</td><td style={{padding:'4px 6px',fontFamily:T.mono}}>{r.key}</td><td style={{padding:'4px 6px',textAlign:'right',fontWeight:600}}>{r.factor}</td><td style={{padding:'4px 6px',color:T.textSec}}>{r.unit}</td><td style={{padding:'4px 6px',color:T.textMut}}>{r.source}</td></tr>)}</tbody>
    </table></div></Card>}
    {sec==='sb'&&<Card title="Sector Benchmarks" citation="[8]"><div style={{maxHeight:500,overflowY:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
      <thead style={{position:'sticky',top:0,background:T.bg}}><tr>{['GICS','Sector','Median','Paris 2030','SBTi','Rate'].map(h=><th key={h} style={{padding:'5px 6px',fontSize:9,fontWeight:700,color:T.textSec,borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{h}</th>)}</tr></thead>
      <tbody>{sbRows.map((r,i)=><tr key={i} style={{background:i%2===0?T.surface:T.bg}}><td style={{padding:'4px 6px',fontFamily:T.mono}}>{r.gics}</td><td style={{padding:'4px 6px',fontWeight:600}}>{r.sector}</td><td style={{padding:'4px 6px',textAlign:'right'}}>{r.medianIntensity}</td><td style={{padding:'4px 6px',textAlign:'right',color:T.green}}>{r.parisTarget2030}</td><td style={{padding:'4px 6px'}}>{r.sbtiMethod}</td><td style={{padding:'4px 6px'}}>{r.decarbRate}%</td></tr>)}</tbody>
    </table></div></Card>}
    {sec==='ac'&&<Card title="Asset Class Definitions" citation={PCAF_PART_A}><div style={{display:'grid',gap:10}}>{ASSET_CLASS_DEFS.map(d=><div key={d.ac} style={{padding:10,background:T.bg,borderRadius:6,border:`1px solid ${T.border}`}}>
      <div style={{display:'flex',gap:8,alignItems:'baseline',marginBottom:4}}><strong style={{color:T.navy}}>{d.ac}</strong><span style={{fontSize:9,fontFamily:T.mono,color:T.gold}}>{d.ch==='3rdEd'?'3rd Ed. (Dec 2025)':`Ch. ${d.ch}`}</span></div>
      <div style={{fontFamily:T.mono,fontSize:11,background:T.surface,padding:'3px 6px',borderRadius:3,marginBottom:4}}>{d.formula}</div>
      <div style={{fontSize:10,color:T.textSec}}>Denominator: {d.denom} | DQS: {d.dqsRange}</div>
      <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{d.note}</div>
      <div style={{fontSize:10,color:T.textSec,marginTop:2}}>Scope guidance: {d.scopeGuidance}</div>
    </div>)}</div></Card>}
    {sec==='dqs'&&<Card title="DQS Definitions" citation="PCAF Standard, Chapter 3"><div style={{display:'grid',gap:8}}>{DQS_DEFINITIONS.map(d=><div key={d.score} style={{display:'flex',gap:10,padding:10,background:T.bg,borderRadius:6,border:`1px solid ${T.border}`}}>
      <div style={{width:36,height:36,borderRadius:18,background:DQS_COLOR[d.score],display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:15,flexShrink:0}}>{d.score}</div>
      <div><div style={{fontWeight:700,color:T.navy}}>{d.label}</div><div style={{fontSize:11,color:T.textSec}}>{d.description}</div><div style={{fontSize:10,color:T.textMut,marginTop:2}}>{d.method} | Uncertainty: {d.uncertainty} | Internal weight (not PCAF-defined): {d.weight}</div></div>
    </div>)}</div></Card>}
    {sec==='cp'&&<Card title="Carbon Prices" citation="[2][7]"><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
      <div><div style={{fontWeight:600,color:T.navy,fontSize:12,marginBottom:6}}>Compliance Markets (2025)</div>{Object.entries(CARBON_PRICES.compliance||{}).map(([k,v])=><div key={k} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:`1px solid ${T.border}`,fontSize:11}}><span>{k.replace(/_/g,' ')}</span><strong>{v.price} {v.currency}</strong></div>)}</div>
      <div><div style={{fontWeight:600,color:T.navy,fontSize:12,marginBottom:6}}>NGFS 2050 Scenarios ($/tCO2e)</div>{Object.entries(CARBON_PRICES.ngfs_2050||{}).map(([k,v])=><div key={k} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:`1px solid ${T.border}`,fontSize:11}}><span>{k.replace(/_/g,' ')}</span><strong>${v}</strong></div>)}</div>
    </div></Card>}
  </div>);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB 6: FORMULA ENGINE — All formulas with citations, examples, edge cases
   ═══════════════════════════════════════════════════════════════════════════════ */
function FormulaEngineTab(){
  const[expanded,setExpanded]=useState(null);
  const[calc,setCalc]=useState({outstanding:'31.2',evic:'245',emissions:'68400000'});
  // Outstanding is $M and EVIC is $Bn (per the field labels below) \u2014 must
  // convert to a common unit before dividing, or the ratio is 1,000x too
  // high (GAP-004: $31.2M/$245Bn previously rendered as 12.73% instead of
  // 0.0127%; a $100M/$10Bn test case rendered as a silently-capped 100%
  // instead of the correct 1.00%). A raw ratio above 1.0 after unit
  // conversion is a data error, not a value to clamp away \u2014 it's surfaced
  // as an explicit warning instead of being hidden.
  const result=useMemo(()=>{
    const o=+calc.outstanding,e=+calc.evic,em=+calc.emissions;
    if(!o||!e||!em)return null;
    const rawAttr=(o/1000)/e;
    const invalid=rawAttr>1.0;
    const attr=Math.min(1.0,rawAttr);
    const fe=attr*em;
    return{attr,fe,ci:fe/o,invalid,rawAttr};
  },[calc]);

  return(<div>
    <SectionHeader title="PCAF Formula Engine" citation="Chapters 3-6" description="All PCAF formulas with section citations, worked examples, edge case handling."/>
    <Card title="Interactive Calculator" citation="Ch.5" style={{marginBottom:16}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
        <div><label style={{fontSize:10,color:T.textSec}}>Outstanding ($M)</label><input type="number" value={calc.outstanding} onChange={e=>setCalc(f=>({...f,outstanding:e.target.value}))} style={{width:'100%',padding:'6px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:12}}/></div>
        <div><label style={{fontSize:10,color:T.textSec}}>EVIC ($Bn)</label><input type="number" value={calc.evic} onChange={e=>setCalc(f=>({...f,evic:e.target.value}))} style={{width:'100%',padding:'6px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:12}}/></div>
        <div><label style={{fontSize:10,color:T.textSec}}>Scope 1+2 (tCO2e)</label><input type="number" value={calc.emissions} onChange={e=>setCalc(f=>({...f,emissions:e.target.value}))} style={{width:'100%',padding:'6px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:12}}/></div>
      </div>
      {result&&<div style={{marginTop:10,padding:10,background:T.bg,borderRadius:6,fontFamily:T.mono,fontSize:11}}>
        Attribution = (${calc.outstanding}M \u00f7 1000) / ${calc.evic}Bn = <strong>{fmtPct(result.attr)}</strong> | FE = {fmtPct(result.attr)} \u00d7 {fmt(+calc.emissions)} = <strong style={{color:T.navy}}>{fmt(result.fe)} tCO2e</strong> | Intensity = {result.ci.toFixed(1)} tCO2e/$M
      </div>}
      {result&&result.invalid&&<InfoBox type="warn"><strong>\u26a0 Invalid input:</strong> raw attribution factor is {fmtPct(result.rawAttr)} (&gt;100%) \u2014 Outstanding cannot exceed EVIC. Check units: Outstanding is $M, EVIC is $Bn. Capped at 100% for display only; this is a data error, not a valid result.</InfoBox>}
    </Card>
    <div style={{display:'grid',gap:10}}>
      {PCAF_FORMULAS.map(f=><div key={f.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,overflow:'hidden'}}>
        <div onClick={()=>setExpanded(expanded===f.id?null:f.id)} style={{padding:'10px 14px',cursor:'pointer',display:'flex',alignItems:'baseline',gap:8}}>
          <span style={{fontWeight:700,fontFamily:T.mono,color:T.navy,fontSize:12}}>{f.id}</span>
          <span style={{fontWeight:600,fontSize:12,flex:1}}>{f.name}</span>
          <span style={{fontSize:9,fontFamily:T.mono,color:T.gold}}>{f.section}</span>
          <span style={{color:T.textMut}}>{expanded===f.id?'\u25BC':'\u25B6'}</span>
        </div>
        {expanded===f.id&&<div style={{padding:'0 14px 14px',borderTop:`1px solid ${T.border}`}}>
          <div style={{marginTop:10,padding:8,background:T.bg,borderRadius:4,fontFamily:T.mono,fontSize:11,fontWeight:600,color:T.navy}}>{f.formula}</div>
          <div style={{marginTop:6}}><strong style={{fontSize:10,color:T.textSec}}>Variables:</strong>{f.variables.map((v,i)=><div key={i} style={{fontSize:10,color:T.textSec,paddingLeft:8}}>\u2022 {v}</div>)}</div>
          <div style={{marginTop:6,fontSize:11,color:T.textSec,lineHeight:1.5}}><strong>Notes:</strong> {f.notes}</div>
          <InfoBox type="success"><strong>Example:</strong> {f.example}</InfoBox>
          {f.edgeCases&&<div style={{marginTop:6}}><strong style={{fontSize:10,color:T.amber}}>Edge Cases:</strong>{(Array.isArray(f.edgeCases)?f.edgeCases:[f.edgeCases]).map((ec,i)=><div key={i} style={{fontSize:10,color:T.amber,paddingLeft:8}}>\u26a0 {ec}</div>)}</div>}
          {f.validation&&<div style={{marginTop:6}}><strong style={{fontSize:10,color:T.sage}}>Validation:</strong>{f.validation.map((v,i)=><div key={i} style={{fontSize:10,color:T.sage,paddingLeft:8}}>\u2713 {v}</div>)}</div>}
        </div>}
      </div>)}
    </div>
  </div>);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB 7: DOWNSTREAM CONNECTIONS & EXPORT
   ═══════════════════════════════════════════════════════════════════════════════ */
function DownstreamTab({positions}){
  // Exclude data-gap positions (financedEmissions===null) from the sum — see
  // computeRow/resolveEvic; 0+null===0 in JS would otherwise silently zero
  // them into a regulatory disclosure figure instead of excluding them.
  const totalFE=useMemo(()=>positions.filter(p=>!p.dataGap).reduce((s,p)=>s+p.financedEmissions,0),[positions]);
  const totalOut=useMemo(()=>positions.reduce((s,p)=>s+p.outstanding,0),[positions]);
  const[exportFmt,setExportFmt]=useState('json');

  const downstream=useMemo(()=>{
    const waci=totalOut>0?positions.reduce((s,p)=>s+p.outstanding*p.waci,0)/totalOut:0;
    const avgDqs=(positions.length ? positions.reduce((s,p)=>s+p.dqs,0)/positions.length : 0).toFixed(1);
    // R3 gap D-1: SFDR's PAI cards must be in EUR \u2014 the prior version left
    // USD figures unconverted under an "\u20acM" label, and separately divided
    // by AUM in $Bn (aumBn) instead of $M (totalOut), understating the
    // figure by 1,000x. Fixed to convert USD -> EUR at the same reference
    // rate and to divide by the correctly-scaled AUM.
    const carbonFootprintEur=totalOut>0?(totalFE/(totalOut*USD_TO_EUR_RATE)):null;
    const waciEur=waci/USD_TO_EUR_RATE;
    return DOWNSTREAM_MODULES.map(m=>{
      let v='\u2014';
      if(m.field==='totalFinancedEmissions')v=fmt(totalFE)+' tCO2e';
      else if(m.field==='carbonFootprint')v=carbonFootprintEur!=null?carbonFootprintEur.toFixed(0)+' tCO2e/\u20acM':'\u2014';
      else if(m.field==='waciIntensity')v=waciEur.toFixed(1)+' tCO2e/\u20acM';
      // R3 gap D-3: no validated methodology is implemented for either of
      // these two \u2014 a prior version filled them with a seeded-random
      // number (sr(42)/sr(43)) dressed up as a TCFD/SBTi/NGFS-sourced
      // figure. Removed rather than fabricated; see DOWNSTREAM_MODULES
      // description for each field for the full rationale.
      else if(m.field==='impliedTemperatureRise')v='Not computed';
      else if(m.field==='climateValueAtRisk')v='Not computed';
      else if(m.field==='esrsE1Emissions')v=fmt(totalFE);
      else if(m.field==='ebaPillar3')v=fmt(totalFE)+' | DQS '+avgDqs;
      else if(m.field==='tcfdMetrics')v='FE + WACI + DQS';
      return{...m,value:v};
    });
  },[positions,totalFE,totalOut]);

  const doExport=useCallback(()=>{
    // R3 gap B-7: PCAF requires vintage disclosure for lagged data — surface
    // it in the export rather than only in the on-screen badges.
    const dataVintage={
      maturedInstrumentsExcluded:positions.filter(p=>p.matured).map(p=>({name:p.name,maturityYear:p.maturityYear})),
      staleVintagePositions:positions.filter(p=>p.vintageWarning).map(p=>({name:p.name,source:p.source,ageYears:p.dataVintageYears})),
      exportGeneratedAt:new Date().toISOString(),
    };
    const payload={timestamp:new Date().toISOString(),portfolio:{totalFE:totalFE,totalExposure:totalOut,count:positions.length,avgDqs:+(positions.length ? positions.reduce((s,p)=>s+p.dqs,0)/positions.length : 0).toFixed(2)},modules:Object.fromEntries(downstream.map(m=>[m.field,{value:m.value,regulation:m.regulation}])),holdings:positions.map(p=>({name:p.name,ac:p.assetClass,fe:p.financedEmissions,dqs:p.dqs,attr:p.attrFactor})),dataVintage};
    const str=JSON.stringify(payload,null,2);
    const blob=new Blob([str],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='pcaf_downstream.json';a.click();URL.revokeObjectURL(u);
  },[positions,totalFE,totalOut,downstream]);

  return(<div>
    <SectionHeader title="Downstream Connections & Export" description="PCAF financed emissions feed into 8 downstream regulatory and analytical modules."/>
    <div style={{display:'grid',gap:10,marginBottom:20}}>
      {downstream.map(m=><div key={m.module} style={{display:'flex',alignItems:'center',gap:14,padding:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:6}}>
        <div style={{width:6,height:44,borderRadius:3,background:T.navy,flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,color:T.navy,fontSize:12}}>{m.module}</div>
          <div style={{fontSize:10,color:T.textSec,marginTop:1}}>{m.description}</div>
          <div style={{fontSize:9,fontFamily:T.mono,color:T.textMut,marginTop:1}}>{m.regulation}</div>
          {m.inputFields&&<div style={{fontSize:9,color:T.gold,marginTop:1}}>Inputs: {m.inputFields.join(', ')}</div>}
        </div>
        <div style={{textAlign:'right',minWidth:120}}>
          <div style={{fontSize:14,fontWeight:700,color:m.value==='Not computed'?T.textMut:T.navy,fontFamily:T.mono,fontStyle:m.value==='Not computed'?'italic':'normal'}}>{m.value}</div>
          <div style={{fontSize:9,color:T.textMut}}>{m.format} | {m.frequency}</div>
        </div>
      </div>)}
    </div>
    <Card title="Export">
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <button onClick={doExport} style={{padding:'7px 16px',border:'none',borderRadius:6,background:T.navy,color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer'}}>Export JSON Payload</button>
        <span style={{fontSize:10,color:T.textMut}}>Includes all holdings, attributions, DQS, and downstream module values</span>
      </div>
    </Card>
  </div>);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB 8: AUDIT TRAIL — ENH-017 step-by-step calculation evidence
   ═══════════════════════════════════════════════════════════════════════════════ */
function AuditTrailTab({positions}){
  const[selPos,setSelPos]=useState(null);
  const[view,setView]=useState('portfolio');// 'portfolio' | 'position'

  const trail=useMemo(()=>generatePortfolioAuditTrail(positions),[positions]);
  const posTrail=useMemo(()=>selPos!=null?trail.positions[selPos]:null,[trail,selPos]);

  const statusBg=s=>({PASS:'rgba(22,163,74,0.08)',WARN:'rgba(217,119,6,0.08)',FAIL:'rgba(220,38,38,0.08)'}[s]||'transparent');
  const FL={display:'flex',gap:8,alignItems:'center'};

  return(<div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
      <div>
        <div style={{fontWeight:700,color:T.navy,fontSize:15}}>PCAF Calculation Audit Trail</div>
        <div style={{fontSize:11,color:T.textSec,marginTop:2}}>ENH-017 · {trail.standard} · Trail ID: <span style={{fontFamily:T.mono}}>{trail.trailId}</span></div>
      </div>
      <div style={FL}>
        <button onClick={()=>downloadTrail(trail)} style={{padding:'7px 14px',border:`1px solid ${T.border}`,borderRadius:6,background:T.navy,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>↓ Export JSON</button>
        <button onClick={()=>setView(v=>v==='portfolio'?'position':'portfolio')} style={{padding:'7px 14px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,fontSize:11,cursor:'pointer'}}>{view==='portfolio'?'Position View':'Portfolio View'}</button>
      </div>
    </div>

    {/* Portfolio summary KPIs */}
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
      {[
        {label:'Total Positions',value:trail.portfolio.totalPositions,color:T.navy},
        {label:'Financed Emissions (S1+2)',value:fmt(trail.portfolio.totalFinancedEmissions)+' tCO2e',color:T.navy},
        {label:'Financed Emissions (S3)',value:fmt(trail.portfolio.totalFinancedEmissionsS3)+' tCO2e',color:T.navyL,sub:'reported separately, never blended'},
        {label:'Scope 3 Required / Missing',value:`${trail.portfolio.scope3RequiredCount} / ${trail.portfolio.scope3MissingCount}`,color:trail.portfolio.scope3MissingCount>0?T.red:T.green,sub:`for reporting year ${trail.reportingYear}`},
        {label:'Portfolio WACI (S1+2)',value:trail.portfolio.portfolioWaci.toFixed(3)+' tCO2e/$M',color:T.navy},
        {label:'Portfolio WACI (S1+2+3)',value:trail.portfolio.portfolioWaciS123.toFixed(3)+' tCO2e/$M',color:T.navyL,sub:'reported separately, never blended'},
        {label:'Revenue Proxy',value:`${trail.portfolio.revenueProxyCount} / ${trail.portfolio.totalPositions}`,color:trail.portfolio.revenueProxyCount>0?T.amber:T.green,sub:'positions on a sector proxy — DQS capped at 4'},
        {label:'Avg DQS',value:trail.portfolio.avgDqs,color:dqsColor(Math.round(trail.portfolio.avgDqs))},
        {label:'DQS Target Met',value:trail.portfolio.dqsMeetsTarget?'✓ Yes':'✗ No',color:trail.portfolio.dqsMeetsTarget?T.green:T.red},
        {label:'Flags',value:trail.portfolio.flagSummary.total,color:trail.portfolio.flagSummary.errors>0?T.red:T.amber},
      ].map((k,i)=>(
        <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:'10px 16px',minWidth:140}}>
          <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k.label}</div>
          <div style={{fontSize:16,fontWeight:700,color:k.color,marginTop:2}}>{k.value}</div>
          {k.sub&&<div style={{fontSize:9,color:T.textMut,marginTop:2}}>{k.sub}</div>}
        </div>
      ))}
    </div>

    {/* DQS distribution */}
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,marginBottom:16}}>
      <div style={{fontWeight:600,color:T.navy,fontSize:12,marginBottom:10}}>DQS Distribution — {PCAF_CITATIONS.dqs.ref}</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {trail.portfolio.dqsDistribution.map(d=>(
          <div key={d.dqs} style={{flex:1,minWidth:110,background:T.bg,borderRadius:6,padding:'8px 12px',borderLeft:`3px solid ${dqsColor(d.dqs)}`}}>
            <div style={{fontFamily:T.mono,fontSize:11,fontWeight:700,color:dqsColor(d.dqs)}}>DQS-{d.dqs}</div>
            <div style={{fontSize:10,color:T.textSec,margin:'2px 0'}}>{d.description.slice(0,35)}…</div>
            <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{d.count} positions</div>
            <div style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>{d.pct}% | {fmt(d.financedEmissions)} tCO2e</div>
          </div>
        ))}
      </div>
    </div>

    {/* Flags */}
    {trail.portfolio.flags.length>0&&<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,marginBottom:16}}>
      <div style={{fontWeight:600,color:T.navy,fontSize:12,marginBottom:8}}>
        Portfolio Flags — {trail.portfolio.flagSummary.errors} errors · {trail.portfolio.flagSummary.warnings} warnings
      </div>
      <div style={{display:'grid',gap:4}}>
        {trail.portfolio.flags.slice(0,10).map((f,i)=>(
          <div key={i} style={{...FL,padding:'6px 10px',borderRadius:4,background:`${flagSeverityColor(f.severity)}14`}}>
            <span style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:flagSeverityColor(f.severity)}}>[{f.code||f.severity.toUpperCase()}]</span>
            <span style={{fontSize:10,color:T.text,flex:1}}>{f.msg}</span>
            <span style={{fontSize:9,fontFamily:T.mono,color:T.textMut}}>{f.position}</span>
          </div>
        ))}
        {trail.portfolio.flags.length>10&&<div style={{fontSize:10,color:T.textMut,paddingLeft:10}}>…and {trail.portfolio.flags.length-10} more flags</div>}
      </div>
    </div>}

    {/* Position list with step summary */}
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16}}>
      <div style={{fontWeight:600,color:T.navy,fontSize:12,marginBottom:10}}>
        Position Audit Trails — click to expand 7-step calculation
      </div>
      <div style={{display:'grid',gap:6}}>
        {trail.positions.map((pt,i)=>(
          <div key={i} style={{border:`1px solid ${T.border}`,borderRadius:6,overflow:'hidden'}}>
            {/* Row header */}
            <div onClick={()=>{setSelPos(selPos===i?null:i);setView('position');}} style={{...FL,padding:'8px 12px',cursor:'pointer',background:selPos===i?T.bg:T.surface}}>
              <span style={{fontFamily:T.mono,fontSize:10,color:T.textMut,width:60}}>{pt.positionId}</span>
              <span style={{flex:1,fontWeight:600,fontSize:11,color:T.navy}}>{pt.positionName}</span>
              <span style={{fontFamily:T.mono,fontSize:10,color:T.textMut,width:80}}>{pt.assetClass?.slice(0,12)}</span>
              <span style={{fontFamily:T.mono,fontSize:11,color:dqsColor(pt.summary.compositeDqs),width:50}}>DQS-{pt.summary.compositeDqs}</span>
              <span style={{fontFamily:T.mono,fontSize:11,color:T.navy,width:130}} title="Scope 1+2 headline — Scope 3 reported separately, never blended">
                {pt.summary.financedEmissions.toFixed(1)} tCO2e <Badge color={T.navyL}>S1+2</Badge>
                {pt.summary.scope3Required&&pt.summary.financedEmissionsS3===0&&<span style={{color:T.red,marginLeft:3}} title={`Scope 3 required for reporting year ${trail.reportingYear} but not provided`}>⚠S3</span>}
              </span>
              <div style={{...FL,gap:4,width:80}}>
                {['PASS','WARN','FAIL'].map(s=><span key={s} style={{fontSize:9,fontFamily:T.mono,color:stepStatusColor(s)}}>{s[0]}{pt.summary[s.toLowerCase()+'Count']}</span>)}
              </div>
              <span style={{color:T.textMut}}>{selPos===i?'▲':'▼'}</span>
            </div>
            {/* Expanded 7-step trail */}
            {selPos===i&&<div style={{borderTop:`1px solid ${T.border}`,padding:'10px 12px',background:T.bg}}>
              {pt.steps.map((step,si)=>(
                <div key={si} style={{marginBottom:8,padding:'8px 10px',borderRadius:6,background:statusBg(step.status),border:`1px solid ${step.status==='PASS'?'rgba(22,163,74,0.15)':step.status==='WARN'?'rgba(217,119,6,0.2)':'rgba(220,38,38,0.2)'}`}}>
                  <div style={{...FL,marginBottom:4}}>
                    <span style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:stepStatusColor(step.status),width:24}}>{step.id}</span>
                    <span style={{fontWeight:600,fontSize:11,color:T.navy,flex:1}}>{step.label}</span>
                    <span style={{fontSize:9,fontFamily:T.mono,color:T.textMut}}>{step.citation}</span>
                    <span style={{fontSize:10,fontWeight:700,color:stepStatusColor(step.status),marginLeft:8}}>{step.status}</span>
                  </div>
                  <div style={{fontSize:10,color:T.textSec,marginBottom:4}}>{step.desc}</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <div style={{fontSize:10}}>
                      <div style={{color:T.textMut,fontFamily:T.mono,marginBottom:2}}>INPUTS</div>
                      {Object.entries(step.inputs||{}).map(([k,v])=>(
                        <div key={k} style={{...FL,justifyContent:'space-between'}}>
                          <span style={{color:T.textSec}}>{k}:</span>
                          <span style={{fontFamily:T.mono,color:T.navy,fontSize:10}}>{String(v)}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:10}}>
                      <div style={{color:T.textMut,fontFamily:T.mono,marginBottom:2}}>OUTPUTS</div>
                      {Object.entries(step.outputs||{}).map(([k,v])=>(
                        <div key={k} style={{...FL,justifyContent:'space-between'}}>
                          <span style={{color:T.textSec}}>{k}:</span>
                          <span style={{fontFamily:T.mono,color:T.navy,fontSize:10}}>{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {step.checks&&<div style={{marginTop:4,display:'flex',gap:4,flexWrap:'wrap'}}>
                    {/* The check descriptions are a static checklist for this
                        step, not individually-evaluated booleans — showing
                        every one as a green checkmark regardless of the
                        step's actual computed status (e.g. "✓ Validate EVIC
                        > 0" while EVIC was $0) was the display bug in
                        GAP-003. Icon/color now follows the step's real
                        PASS/WARN/FAIL status instead of always claiming pass. */}
                    {step.checks.map((c,ci)=><span key={ci} style={{fontSize:9,padding:'1px 6px',borderRadius:10,
                      background:step.status==='FAIL'?'rgba(220,38,38,0.1)':step.status==='WARN'?'rgba(217,119,6,0.1)':'rgba(91,138,106,0.1)',
                      color:step.status==='FAIL'?T.red:step.status==='WARN'?T.amber:T.sage}}>{step.status==='FAIL'?'✗':step.status==='WARN'?'⚠':'✓'} {c}</span>)}
                  </div>}
                </div>
              ))}
              {pt.flags.length>0&&<div style={{marginTop:6,padding:'6px 8px',borderRadius:4,background:'rgba(220,38,38,0.04)',border:`1px solid rgba(220,38,38,0.1)`}}>
                {pt.flags.map((f,fi)=><div key={fi} style={{fontSize:10,color:flagSeverityColor(f.severity),padding:'1px 0'}}>⚠ [{f.code}] {f.msg}</div>)}
              </div>}
            </div>}
          </div>
        ))}
      </div>
      <div style={{marginTop:12,padding:10,background:T.bg,borderRadius:6}}>
        <div style={{fontSize:10,fontWeight:600,color:T.navy,marginBottom:4}}>Methodology Notes</div>
        {trail.methodologyNotes.map((n,i)=><div key={i} style={{fontSize:9,color:T.textSec,padding:'1px 0'}}>• {n}</div>)}
      </div>
    </div>
  </div>);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   RESULTS STAGE — cross-asset-class summary (Part A + Part C + Part B)
   R3 gap U-A: previously getting a single combined figure meant visiting 3
   separate tabs and adding the numbers yourself. This reads the exact same
   lobResults/dealData/positions the Portfolio stage's three sub-tabs render
   — nothing here is independently recomputed, so it cannot drift from what
   those tabs show (the same principle behind computeLobResults/
   computeDealData/computablePcafPositions/scopedFE being lifted to module
   scope above).
   ═══════════════════════════════════════════════════════════════════════════════ */
function ResultsStage({positions,lobResults,dealData,onOpenAudit}){
  const computable=useMemo(()=>computablePcafPositions(positions),[positions]);
  const financedS12=useMemo(()=>computable.reduce((s,p)=>s+scopedFE(p,'1+2'),0),[computable]);
  const financedS123=useMemo(()=>computable.reduce((s,p)=>s+scopedFE(p,'1+2+3'),0),[computable]);
  const inScopeLob=useMemo(()=>lobResults.filter(l=>!l.outOfPcafScope),[lobResults]);
  const insuranceFE=useMemo(()=>inScopeLob.reduce((s,l)=>s+l.tco2e,0),[inScopeLob]);
  const facilitatedFE=useMemo(()=>dealData.reduce((s,d)=>s+d.facilitatedEm,0),[dealData]);
  const combinedS12=financedS12+insuranceFE+facilitatedFE;

  const byPart=[
    {name:'Part A: Financed',value:financedS12,color:T.navy},
    {name:'Part C: Insurance',value:insuranceFE,color:T.red},
    {name:'Part B: Facilitated',value:facilitatedFE,color:T.gold},
  ];

  return(<div>
    <SectionHeader title="Results — Cross-Asset-Class Summary" description="Financed (Part A), Insurance-Associated (Part C), and Facilitated (Part B) emissions, read from the same computations shown in the Portfolio stage's three sub-tabs. PCAF does not itself define a cross-Part aggregate — each Part must still be disclosed separately in any real filing — so the Combined figure below is this platform's own at-a-glance total, labeled as such."/>
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
      <KPICard hero label="Combined (S1+2, platform total)" value={fmt(combinedS12)+' tCO2e'} sub="Part A + Part C + Part B — not a PCAF-defined aggregate" color={T.textMut}
        lineage={{citation:`${PCAF_PART_A} + ${PCAF_PART_C} + ${PCAF_PART_B}`,basis:'Sum of the three cards to the right, each read live from the Portfolio stage — never independently recomputed here.'}}/>
      <KPICard label="Financed Em. (Part A, S1+2)" value={fmt(financedS12)+' tCO2e'} sub={`${computable.length} computable positions`} color={T.navy}/>
      <KPICard label="Insurance-Assoc. Em. (Part C, PCAF-scoped)" value={fmt(insuranceFE)+' tCO2e'} sub={`${inScopeLob.length} in-scope LOBs`} color={T.red}/>
      <KPICard label="Facilitated Em. (Part B, 33% wtd.)" value={fmt(facilitatedFE)+' tCO2e'} sub={`${dealData.length} transactions`} color={T.gold}/>
      <KPICard label="Financed Em. (Part A, S1+2+3)" value={fmt(financedS123)+' tCO2e'} sub="All-scope variant, reported separately per PCAF convention" color={T.navyL}/>
    </div>
    <Card title="Emissions by PCAF Part">
      <ResponsiveContainer width="100%" height={240}><BarChart data={byPart}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:9,fill:T.textSec}} tickFormatter={v=>fmt(v)}/><Tooltip {...tip}/><Bar dataKey="value" name="tCO2e" radius={[4,4,0,0]}>{byPart.map((d,i)=><Cell key={i} fill={d.color}/>)}</Bar></BarChart></ResponsiveContainer>
    </Card>
    <InfoBox type="info">Combined = Part A (S1+2) + Part C (PCAF-scoped LOBs) + Part B (33%-weighted). Each figure is shown separately above in the KPI row and bar chart; the Combined KPI exists only as a single at-a-glance number for this platform, not a PCAF-standard metric.</InfoBox>
    {onOpenAudit&&<div style={{marginTop:12}}><button onClick={onOpenAudit} style={{padding:'9px 16px',minHeight:44,border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>Why these numbers? → Audit Trail</button></div>}
  </div>);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   METHODOLOGY DRAWER — Reference Data + Formula Engine, slide-out from any stage
   R3 gap U-A: these two were flat tabs alongside the working tabs; they're
   reference/methodology material a user consults occasionally, not a stage
   in the workflow, so they move into a drawer reachable from every stage's
   header instead of competing for tab-bar space.
   ═══════════════════════════════════════════════════════════════════════════════ */
function MethodologyDrawer({onClose}){
  const[sub,setSub]=useState('Reference Data');
  return(
    <div style={{position:'fixed',inset:0,zIndex:9998,display:'flex',justifyContent:'flex-end'}}>
      <div onClick={onClose} style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.35)'}}/>
      <div style={{position:'relative',width:'min(880px,92vw)',height:'100%',background:T.surface,boxShadow:'-8px 0 32px rgba(0,0,0,0.18)',overflowY:'auto',padding:'24px 28px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{fontSize:16,fontWeight:700,color:T.navy}}>Methodology</div>
          <button onClick={onClose} style={{padding:'8px 14px',minHeight:44,border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:'pointer',fontSize:12,fontFamily:T.font}}>✕ Close</button>
        </div>
        <TabBar tabs={['Reference Data','Formula Engine']} active={sub} onChange={setSub}/>
        {sub==='Reference Data'?<ReferenceDataTab/>:<FormulaEngineTab/>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   AUDIT MODAL — "why this number?" drill-down, on demand instead of a
   standalone tab (full per-KPI wiring deferred; this gives every stage one
   reachable entry point into the same AuditTrailTab content rather than
   duplicating it).
   ═══════════════════════════════════════════════════════════════════════════════ */
function AuditModal({positions,onClose}){
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:9998,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{background:T.surface,borderRadius:10,padding:24,width:1100,maxWidth:'96vw',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 12px 40px rgba(0,0,0,0.18)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{fontSize:16,fontWeight:700,color:T.navy}}>Audit Trail — Why This Number?</div>
          <button onClick={onClose} style={{padding:'8px 14px',minHeight:44,border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:'pointer',fontSize:12,fontFamily:T.font}}>✕ Close</button>
        </div>
        <AuditTrailTab positions={positions}/>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STAGE NAV — 4-stage primary workflow nav (replaces the 8 flat tabs)
   Full-button tabs (min 44px touch target, no negative-margin overlay) —
   part of the same touch-target fix applied to TabBar above.
   ═══════════════════════════════════════════════════════════════════════════════ */
function StageNav({stages,active,onChange}){
  return(<div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
    {stages.map((s,i)=>(
      <button key={s} onClick={()=>onChange(s)} style={{
        display:'flex',alignItems:'center',gap:8,padding:'12px 20px',minHeight:44,
        border:`2px solid ${active===s?T.navy:T.border}`,borderRadius:8,
        background:active===s?T.navy:T.surface,color:active===s?'#fff':T.text,
        fontSize:13,fontWeight:700,fontFamily:T.font,cursor:'pointer',
        transition:'background 0.15s,color 0.15s',whiteSpace:'nowrap',
      }}>
        <span style={{fontSize:10,fontFamily:T.mono,opacity:0.65}}>{i+1}</span>{s}
      </button>
    ))}
  </div>);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT — 4-stage workflow (Portfolio → Data Quality →
   Results → Disclosures), Methodology as a drawer, Audit Trail as a modal
   ═══════════════════════════════════════════════════════════════════════════════ */
// Tab labels follow PCAF's real Part lettering: Part B = Facilitated
// Emissions (Dec 2023), Part C = Insurance-Associated Emissions (Nov 2022,
// updated Dec 2025) — these were previously swapped (R3 gap B-1). Note the
// component names below (PartBTab/PartCTab) are unchanged internal
// identifiers and don't correspond 1:1 to these display labels — PartBTab
// renders Insurance, PartCTab renders Facilitated — this is cosmetic only,
// not a functional issue, but flagged here to avoid confusing a future reader.
const STAGES=['Portfolio','Data Quality','Results','Disclosures'];
const PORTFOLIO_SUBTABS=['Financed (Part A)','Insurance (Part C)','Facilitated (Part B)'];

// R3 gaps F-16/F-19: writes (inline edits, add/remove position) previously
// lived only in React state — a reload silently reverted to the 60-holding
// demo seed with no indication anything had been lost. Persisted via
// data/portfolioPersistence.js (localStorage today, designed so a backend
// store can replace it later without touching call sites). R3 gap U-A
// extends the same persistence to the Insurance and Facilitated datasets,
// which previously reset on reload while Part A did not.
const PORTFOLIO_STORAGE_ID='global-demo-portfolio';
const INSURANCE_STORAGE_ID='global-demo-insurance-lob';
const FACILITATED_STORAGE_ID='global-demo-facilitated-deals';

export default function PcafFinancedEmissionsPage(){
  const[activeStage,setActiveStage]=useState(STAGES[0]);
  const[portfolioSubTab,setPortfolioSubTab]=useState(PORTFOLIO_SUBTABS[0]);
  const[positions,setPositions]=useState(()=>{
    const saved=loadPortfolio(PORTFOLIO_STORAGE_ID);
    // Re-run computeRow on load rather than trusting the persisted derived
    // fields as-is — safe because computeRow is idempotent over the same
    // raw inputs, and it guards against this session's calculation logic
    // having changed since the positions were last saved.
    return saved&&saved.length?saved.map(computeRow):INITIAL_POSITIONS;
  });
  useEffect(()=>{savePortfolio(PORTFOLIO_STORAGE_ID,positions);},[positions]);
  // R3 gap U-A: lobData/deals lifted here (out of PartBTab/PartCTab) so the
  // Results stage can read the same live data those tabs edit, instead of a
  // second copy that only matches at page-load.
  const[lobData,setLobData]=useState(()=>{
    const saved=loadPortfolio(INSURANCE_STORAGE_ID);
    return saved&&saved.length?saved:INSURANCE_LOB;
  });
  useEffect(()=>{savePortfolio(INSURANCE_STORAGE_ID,lobData);},[lobData]);
  const[deals,setDeals]=useState(()=>{
    const saved=loadPortfolio(FACILITATED_STORAGE_ID);
    return saved&&saved.length?saved:FACILITATED_DEALS;
  });
  useEffect(()=>{savePortfolio(FACILITATED_STORAGE_ID,deals);},[deals]);
  const lobResults=useMemo(()=>computeLobResults(lobData),[lobData]);
  const dealData=useMemo(()=>computeDealData(deals),[deals]);

  const[showUploader,setShowUploader]=useState(false);
  const[showMethodology,setShowMethodology]=useState(false);
  const[showAudit,setShowAudit]=useState(false);

  return(
    <div style={{padding:'24px 32px',fontFamily:T.font,background:T.bg,minHeight:'100vh'}}>
      <div style={{marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>PCAF Financed Emissions</h1>
          <p style={{fontSize:12,color:T.textSec,margin:'4px 0 0'}}>{PCAF_PART_A} + {PCAF_PART_C} + {PCAF_PART_B} — {positions.length} holdings | 10 Part A asset classes | 10 formulas</p>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button onClick={()=>setShowMethodology(true)} style={{padding:'9px 14px',minHeight:44,border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>Methodology</button>
          <button onClick={()=>setShowAudit(true)} style={{padding:'9px 14px',minHeight:44,border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>Audit Trail</button>
          <button onClick={()=>setShowUploader(s=>!s)} style={{background:showUploader?T.red:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'9px 14px',minHeight:44,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>
            {showUploader?'✕ Close':'Upload Portfolio'}
          </button>
          <ReportExporter title="PCAF Financed Emissions" subtitle={`${positions.length} holdings | 10 PCAF Part A asset classes (3rd Ed.)`} framework={PCAF_PART_A} sections={[{type:'kpis',title:'Portfolio Summary',data:[{label:'Holdings',value:positions.length},{label:'Total Market Value',value:'$'+fmt(positions.reduce((s,p)=>s+p.mv,0))},{label:'Asset Classes',value:[...new Set(positions.map(p=>p.ac))].length}]}]} />
        </div>
      </div>
      {showUploader&&<div style={{marginBottom:16}}><PortfolioUploader
        requiredFields={['name','sector','marketValue','scope1','scope2']}
        optionalFields={['ticker','isin','country','scope3','esgScore','dqs']}
        entityType="mixed"
        onUpload={(rows)=>{setPositions(rows.map((h,i)=>({id:i,name:h.name||`Holding ${i+1}`,sector:h.sector||'Other',ac:h.assetClass||'Listed Equity',mv:Number(h.marketValue)||0,s1:Number(h.scope1)||0,s2:Number(h.scope2)||0,s3:Number(h.scope3)||0,dqs:Number(h.dqs)||3,ticker:h.ticker||'',isin:h.isin||'',country:h.country||'US',esg:Number(h.esgScore)||50,evic:Number(h.marketValue)*1.4||0,revenue:Number(h.revenue)||Number(h.marketValue)*0.6||0,outstanding:Number(h.marketValue)||0,included:true})));setShowUploader(false);}}
      /></div>}

      <StageNav stages={STAGES} active={activeStage} onChange={setActiveStage}/>

      {activeStage==='Portfolio'&&<>
        <TabBar tabs={PORTFOLIO_SUBTABS} active={portfolioSubTab} onChange={setPortfolioSubTab}/>
        {portfolioSubTab===PORTFOLIO_SUBTABS[0]&&<PartATab positions={positions} setPositions={setPositions}/>}
        {portfolioSubTab===PORTFOLIO_SUBTABS[1]&&<PartBTab lobData={lobData} setLobData={setLobData} lobResults={lobResults}/>}
        {portfolioSubTab===PORTFOLIO_SUBTABS[2]&&<PartCTab deals={deals} setDeals={setDeals} dealData={dealData}/>}
      </>}
      {activeStage==='Data Quality'&&<DataQualityTab positions={positions} setPositions={setPositions}/>}
      {activeStage==='Results'&&<ResultsStage positions={positions} lobResults={lobResults} dealData={dealData} onOpenAudit={()=>setShowAudit(true)}/>}
      {activeStage==='Disclosures'&&<DownstreamTab positions={positions}/>}

      {showMethodology&&<MethodologyDrawer onClose={()=>setShowMethodology(false)}/>}
      {showAudit&&<AuditModal positions={positions} onClose={()=>setShowAudit(false)}/>}
    </div>
  );
}
