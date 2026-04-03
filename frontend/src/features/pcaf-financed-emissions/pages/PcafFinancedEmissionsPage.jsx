/**
 * PcafFinancedEmissionsPage.jsx
 * ═══════════════════════════════════════════════════════════════════════════════
 * PCAF Standard v2 (3rd Edition) — Parts A, B, C
 * 7 Tabs | 28 useState hooks | 60 pre-loaded holdings | 12 asset classes
 * Framework citations: PCAF Standard v2, Chapters 3-6
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
import { generatePortfolioAuditTrail, downloadTrail, stepStatusColor, flagSeverityColor, dqsColor, PCAF_CITATIONS } from '../../../data/pcafAuditTrail';
import { useCarbonCredit } from '../../../context/CarbonCreditContext';

/* ═══════════════════════════════════════════════════════════════════════════════
   THEME, PRNG, UTILITIES
   ═══════════════════════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

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
function fmtPct(n){return n==null?'\u2014':(n*100).toFixed(2)+'%';}
function fmtNum(n){if(n==null)return '\u2014';return n.toLocaleString('en-US',{maximumFractionDigits:2});}
function fmtCcy(n,ccy='$'){return n==null?'\u2014':ccy+fmtNum(n);}

/* ═══════════════════════════════════════════════════════════════════════════════
   PCAF ASSET CLASS DEFINITIONS — Chapter 4, Table 4.1
   Each entry maps to a specific PCAF chapter and attribution methodology.
   ═══════════════════════════════════════════════════════════════════════════════ */
const ASSET_CLASS_DEFS=[
  {
    ac:'Listed Equity',ch:'4.2',
    formula:'FE_i = (Outstanding_i / EVIC_i) \u00d7 Company_Emissions_i',
    denom:'Enterprise Value Including Cash (EVIC)',
    note:'EVIC = Market Cap + Total Debt + Preferred Stock + Minority Interest. Attribution factor is proportional to ownership share. Use period-end EVIC.',
    dqsRange:'1-5',
    scopeGuidance:'Scope 1 and 2 required; Scope 3 encouraged for high-impact sectors.',
    dataHierarchy:'1. Verified reported (CDP/GRI) 2. Unverified reported 3. Physical activity 4. Economic activity 5. Proxy estimation',
  },
  {
    ac:'Corporate Bonds',ch:'4.3',
    formula:'FE_i = (Outstanding_i / EVIC_i) \u00d7 Company_Emissions_i',
    denom:'Enterprise Value Including Cash (EVIC)',
    note:'Same attribution as listed equity. Bond outstanding amount as numerator, not notional. Use market value for fair-value portfolios.',
    dqsRange:'1-5',
    scopeGuidance:'Scope 1 and 2 required. For green bonds, also report use-of-proceeds emissions separately.',
    dataHierarchy:'1. Issuer CDP/GRI 2. Annual report 3. Sector average 4. Revenue proxy 5. Headcount proxy',
  },
  {
    ac:'Business Loans',ch:'4.4',
    formula:'FE_i = (Outstanding_i / (EVIC_i or Total_E+D_i)) \u00d7 Company_Emissions_i',
    denom:'EVIC (if listed) or Total Equity + Debt (if unlisted)',
    note:'For unlisted borrowers: use total equity + total debt from most recent audited financial statements. If unavailable, use total assets.',
    dqsRange:'1-5',
    scopeGuidance:'Scope 1 and 2 required. For SME loans where data unavailable, use sector-based estimation.',
    dataHierarchy:'1. Company GHG inventory 2. Physical activity data 3. Sector EF \u00d7 revenue 4. Sector EF \u00d7 assets 5. Headcount proxy',
  },
  {
    ac:'Project Finance',ch:'4.5',
    formula:'FE_i = (Outstanding_i / Total_Project_Cost_i) \u00d7 Project_Emissions_i',
    denom:'Total project cost (equity + debt financing)',
    note:'Attribution = outstanding loan / total project cost. Use project-level emissions from monitoring reports. For construction phase, include embodied emissions.',
    dqsRange:'1-5',
    scopeGuidance:'Project-level Scope 1 and 2. For renewable projects, report lifecycle emissions including manufacturing.',
    dataHierarchy:'1. Direct monitoring 2. Modelled from activity data 3. Grid EF \u00d7 capacity 4. Sector proxy 5. Revenue proxy',
  },
  {
    ac:'Commercial Real Estate',ch:'4.6',
    formula:'FE_i = (Outstanding_i / Property_Value_i) \u00d7 Building_Emissions_i',
    denom:'Property value (current appraisal or purchase price)',
    note:'Building emissions from EPC ratings, energy audits, or benchmarks. Include Scope 1 (on-site combustion) and Scope 2 (purchased electricity/heating).',
    dqsRange:'1-5',
    scopeGuidance:'Building-level Scope 1 + 2. Apply CRREM methodology for stranding risk.',
    dataHierarchy:'1. Metered energy consumption 2. EPC + floor area 3. Building type benchmark 4. National average 5. Floor area proxy',
  },
  {
    ac:'Mortgages',ch:'4.7',
    formula:'FE_i = (Outstanding_i / Property_Value_i) \u00d7 Building_Emissions_i',
    denom:'Property value at origination (or latest valuation)',
    note:'EPC to emissions: use national avg kWh/m\u00b2 by rating band \u00d7 floor area \u00d7 grid emission factor. For portfolios, use distribution of EPC ratings.',
    dqsRange:'1-5',
    scopeGuidance:'Per-property Scope 1 + 2 from energy consumption.',
    dataHierarchy:'1. Smart meter data 2. EPC + floor area 3. Postcode-level proxy 4. National avg by type 5. National average',
  },
  {
    ac:'Vehicle Loans',ch:'4.8',
    formula:'FE_i = (Outstanding_i / Vehicle_Value_i) \u00d7 (CO2_per_km \u00d7 Annual_km)',
    denom:'Vehicle value at origination',
    note:'For ICE: use WLTP CO2/km. For EVs: Scope 1 = 0; Scope 2 = grid EF \u00d7 kWh/km \u00d7 annual km. Default 15,000 km/year.',
    dqsRange:'1-5',
    scopeGuidance:'Vehicle-level Scope 1 (tailpipe) and Scope 2 (electricity for EVs).',
    dataHierarchy:'1. Telematics data 2. Manufacturer CO2/km + annual mileage 3. Vehicle class average 4. National fleet average 5. Proxy',
  },
  {
    ac:'Sovereign Debt',ch:'4.9',
    formula:'FE_i = (Outstanding_i / PPP_GDP_i) \u00d7 Sovereign_Emissions_i',
    denom:'Purchasing Power Parity adjusted GDP',
    note:'Use production-based accounting (territory principle). Source: UNFCCC National Inventory Reports or World Bank WDI.',
    dqsRange:'1-3',
    scopeGuidance:'National-level GHG inventory (all sectors). Separate from LULUCF.',
    dataHierarchy:'1. UNFCCC NIR 2. National report 3. WB/IMF estimates',
  },
  {
    ac:'Use-of-Proceeds',ch:'4.10',
    formula:'FE_i = (Outstanding_i / Total_Bond_Issuance_i) \u00d7 Proceeds_Emissions_i',
    denom:'Total bond issuance amount',
    note:'Green/social/sustainability bonds. Track use of proceeds allocation. Apply emissions per project category.',
    dqsRange:'1-5',
    scopeGuidance:'Project-level emissions from impact reports. Report avoided vs. actual emissions separately.',
    dataHierarchy:'1. Issuer impact report 2. Project monitoring 3. Sector average 4. Proxy 5. No data',
  },
  {
    ac:'Securitisations',ch:'4.11',
    formula:'FE_i = (Tranche_Outstanding / Pool_Value) \u00d7 Pool_Emissions',
    denom:'Total securitisation pool value',
    note:'Look through to underlying assets where possible. For RMBS: use mortgage methodology. For ABS: use relevant asset class.',
    dqsRange:'3-5',
    scopeGuidance:'Underlying asset-level emissions aggregated to pool level.',
    dataHierarchy:'1. Full look-through 2. Pool-level average 3. Sector proxy 4. National average 5. No data',
  },
  {
    ac:'Sub-Sovereign',ch:'4.12',
    formula:'FE_i = (Outstanding / Total_Entity_Debt) \u00d7 Entity_Emissions',
    denom:'Total debt of sub-sovereign entity',
    note:'Municipal/state bonds. Use entity-level GHG data where available, or pro-rata from national.',
    dqsRange:'2-5',
    scopeGuidance:'Entity-level or proportional national emissions.',
    dataHierarchy:'1. Entity GHG report 2. State/regional inventory 3. Pro-rata national 4. Proxy 5. No data',
  },
  {
    ac:'Undrawn Commitments',ch:'4.13',
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
   PCAF Standard v2, Chapter 4 — representative multi-asset FI portfolio
   UNIT CONVENTION: evic=$Bn, outstanding=$M, scope1/2/3 in tCO2e
   ═══════════════════════════════════════════════════════════════════════════════ */
const BASE_POSITIONS=[
  // ── Listed Equity (20 positions) ── PCAF Ch.4.2 ──
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
  // ── Corporate Bonds (12 positions) ── PCAF Ch.4.3 ──
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
  // ── Project Finance (8 positions) ── PCAF Ch.4.5 ──
  {id:33,name:'North Sea Wind Farm (1.2 GW)',ticker:null,country:'GB',geo:'EMEA',assetClass:'Project Finance',sector:'Renewables',evic:null,outstanding:480,scope1:8400,scope2:4000,scope3:62000,dqs:3,source:'Project monitoring report 2023',currency:'GBP',projectCost:1200},
  {id:34,name:'Solar Farm \u2014 Vietnam (320 MW)',ticker:null,country:'VN',geo:'APAC',assetClass:'Project Finance',sector:'Renewables',evic:null,outstanding:210,scope1:4200,scope2:2600,scope3:28000,dqs:4,source:'Physical proxy \u2014 GEF grid factor',currency:'USD',projectCost:580},
  {id:35,name:'Coal-to-Gas Transition \u2014 Indonesia',ticker:null,country:'ID',geo:'APAC',assetClass:'Project Finance',sector:'Electric Utilities',evic:null,outstanding:340,scope1:2840000,scope2:1440000,scope3:4200000,dqs:4,source:'Physical proxy \u2014 IEA EF',currency:'USD',projectCost:920},
  {id:36,name:'Wastewater Treatment \u2014 Brazil',ticker:null,country:'BR',geo:'Americas',assetClass:'Project Finance',sector:'Infrastructure',evic:null,outstanding:85,scope1:21200,scope2:10000,scope3:48000,dqs:4,source:'Physical proxy \u2014 IPCC CH4 EF',currency:'BRL',projectCost:240},
  {id:37,name:'Offshore Wind \u2014 Taiwan Strait (400MW)',ticker:null,country:'TW',geo:'APAC',assetClass:'Project Finance',sector:'Renewables',evic:null,outstanding:310,scope1:5800,scope2:2800,scope3:42000,dqs:3,source:'Project monitoring report 2023',currency:'TWD',projectCost:860},
  {id:38,name:'Hydro Dam \u2014 Ethiopia (2 GW)',ticker:null,country:'ET',geo:'EMEA',assetClass:'Project Finance',sector:'Renewables',evic:null,outstanding:680,scope1:2200,scope2:1000,scope3:8400,dqs:5,source:'Headcount proxy \u2014 limited data',currency:'USD',projectCost:4800},
  {id:39,name:'Gas Pipeline \u2014 Kazakhstan',ticker:null,country:'KZ',geo:'EMEA',assetClass:'Project Finance',sector:'Oil & Gas',evic:null,outstanding:430,scope1:1940000,scope2:1000000,scope3:6200000,dqs:5,source:'Revenue proxy \u2014 IEA EF',currency:'USD',projectCost:1800},
  {id:40,name:'Solar + Storage \u2014 Chile (600 MW)',ticker:null,country:'CL',geo:'Americas',assetClass:'Project Finance',sector:'Renewables',evic:null,outstanding:390,scope1:9200,scope2:5000,scope3:52000,dqs:3,source:'Project monitoring report 2023',currency:'USD',projectCost:1100},
  // ── Commercial Real Estate (5 positions) ── PCAF Ch.4.6 ──
  {id:41,name:'Canary Wharf Office Complex, London',ticker:null,country:'GB',geo:'EMEA',assetClass:'Commercial Real Estate',sector:'Real Estate',evic:null,outstanding:620,scope1:12400,scope2:6000,scope3:84000,dqs:3,source:'EPC + energy audit 2023',currency:'GBP',propertyValue:900,sqm:42000,epcRating:'B'},
  {id:42,name:'Schiphol Logistics Hub, Amsterdam',ticker:null,country:'NL',geo:'EMEA',assetClass:'Commercial Real Estate',sector:'Real Estate',evic:null,outstanding:310,scope1:6200,scope2:3000,scope3:42000,dqs:4,source:'CRREM physical proxy',currency:'EUR',propertyValue:480,sqm:28000,epcRating:'C'},
  {id:43,name:'La D\u00e9fense Mixed-Use, Paris',ticker:null,country:'FR',geo:'EMEA',assetClass:'Commercial Real Estate',sector:'Real Estate',evic:null,outstanding:480,scope1:9800,scope2:4800,scope3:68000,dqs:3,source:'DPE audit 2023',currency:'EUR',propertyValue:720,sqm:35000,epcRating:'B'},
  {id:44,name:'Midtown Manhattan Office Tower, NYC',ticker:null,country:'US',geo:'Americas',assetClass:'Commercial Real Estate',sector:'Real Estate',evic:null,outstanding:740,scope1:14800,scope2:7300,scope3:102000,dqs:3,source:'LL97 disclosure 2023',currency:'USD',propertyValue:1200,sqm:55000,epcRating:'A'},
  {id:45,name:'Tokyo Grade-A Office, Shinjuku',ticker:null,country:'JP',geo:'APAC',assetClass:'Commercial Real Estate',sector:'Real Estate',evic:null,outstanding:560,scope1:11200,scope2:5600,scope3:78000,dqs:4,source:'CASBEE proxy estimate',currency:'JPY',propertyValue:840,sqm:38000,epcRating:'B'},
  // ── Mortgages (5 positions) ── PCAF Ch.4.7 ──
  {id:46,name:'UK Residential Mortgage Portfolio',ticker:null,country:'GB',geo:'EMEA',assetClass:'Mortgages',sector:'Residential',evic:null,outstanding:2400,scope1:128000,scope2:61000,scope3:0,dqs:4,source:'EPC distribution proxy',currency:'GBP',avgPropertyValue:380,loanCount:8200,avgEPC:'D'},
  {id:47,name:'Dutch Mortgage Book (NHG-backed)',ticker:null,country:'NL',geo:'EMEA',assetClass:'Mortgages',sector:'Residential',evic:null,outstanding:1840,scope1:92000,scope2:42000,scope3:0,dqs:4,source:'RVO NL EPC proxy 2023',currency:'EUR',avgPropertyValue:420,loanCount:5400,avgEPC:'C'},
  {id:48,name:'French Immobilier Portfolio',ticker:null,country:'FR',geo:'EMEA',assetClass:'Mortgages',sector:'Residential',evic:null,outstanding:1210,scope1:64000,scope2:34600,scope3:0,dqs:5,source:'DPE distribution proxy',currency:'EUR',avgPropertyValue:310,loanCount:4200,avgEPC:'D'},
  {id:49,name:'US Conforming Mortgage Pool (GSE)',ticker:null,country:'US',geo:'Americas',assetClass:'Mortgages',sector:'Residential',evic:null,outstanding:3800,scope1:192000,scope2:92000,scope3:0,dqs:5,source:'ENERGY STAR proxy \u2014 headcount',currency:'USD',avgPropertyValue:440,loanCount:9800,avgEPC:'N/A'},
  {id:50,name:'Australian Residential Book',ticker:null,country:'AU',geo:'APAC',assetClass:'Mortgages',sector:'Residential',evic:null,outstanding:920,scope1:48200,scope2:24200,scope3:0,dqs:4,source:'NatHERS rating proxy',currency:'AUD',avgPropertyValue:580,loanCount:2100,avgEPC:'5-star'},
  // ── Vehicle Loans (3 positions) ── PCAF Ch.4.8 ──
  {id:51,name:'UK Auto Loan Pool \u2014 ICE Fleet',ticker:null,country:'GB',geo:'EMEA',assetClass:'Vehicle Loans',sector:'Automotive',evic:null,outstanding:420,scope1:184000,scope2:0,scope3:0,dqs:4,source:'DVLA avg CO2/km \u00d7 15k km/yr',currency:'GBP',vehicleCount:14200,avgCO2km:142,avgMileage:15000},
  {id:52,name:'EU EV Financing Portfolio',ticker:null,country:'DE',geo:'EMEA',assetClass:'Vehicle Loans',sector:'Automotive',evic:null,outstanding:280,scope1:0,scope2:42000,scope3:0,dqs:3,source:'Manufacturer CO2/km = 0; grid EF',currency:'EUR',vehicleCount:8400,avgCO2km:0,avgMileage:12000},
  {id:53,name:'US Light-Truck Loan Pool',ticker:null,country:'US',geo:'Americas',assetClass:'Vehicle Loans',sector:'Automotive',evic:null,outstanding:640,scope1:312000,scope2:0,scope3:0,dqs:4,source:'EPA avg 242 gCO2/mi \u00d7 12k mi/yr',currency:'USD',vehicleCount:18600,avgCO2km:150,avgMileage:19200},
  // ── Sovereign Debt (3 positions) ── PCAF Ch.4.9 ──
  {id:54,name:'UK Gilt 1.5% 2047',ticker:null,country:'GB',geo:'EMEA',assetClass:'Sovereign Debt',sector:'Sovereign',evic:null,outstanding:180,scope1:326000000,scope2:0,scope3:0,dqs:2,source:'UNFCCC NIR 2023',currency:'GBP'},
  {id:55,name:'US Treasury 4.25% 2034',ticker:null,country:'US',geo:'Americas',assetClass:'Sovereign Debt',sector:'Sovereign',evic:null,outstanding:240,scope1:5222000000,scope2:0,scope3:0,dqs:2,source:'EPA GHG Inventory 2023',currency:'USD'},
  {id:56,name:'German Bund 0.5% 2030',ticker:null,country:'DE',geo:'EMEA',assetClass:'Sovereign Debt',sector:'Sovereign',evic:null,outstanding:160,scope1:674000000,scope2:0,scope3:0,dqs:2,source:'UBA Germany NIR 2023',currency:'EUR'},
  // ── Use-of-Proceeds (2 positions) ── PCAF Ch.4.10 ──
  {id:57,name:'World Bank Green Bond 2.5% 2028',ticker:null,country:'US',geo:'Americas',assetClass:'Use-of-Proceeds',sector:'Infrastructure',evic:null,outstanding:120,scope1:42000,scope2:18000,scope3:0,dqs:3,source:'World Bank Green Bond Impact Report 2023',currency:'USD',totalBondSize:2000},
  {id:58,name:'EIB Climate Awareness Bond 0.5% 2029',ticker:null,country:'LU',geo:'EMEA',assetClass:'Use-of-Proceeds',sector:'Renewables',evic:null,outstanding:95,scope1:28000,scope2:12000,scope3:0,dqs:3,source:'EIB CAB Impact Report 2023',currency:'EUR',totalBondSize:1500},
  // ── Securitisations (1 position) ── PCAF Ch.4.11 ──
  {id:59,name:'RMBS Pool \u2014 UK Prime Mortgages',ticker:null,country:'GB',geo:'EMEA',assetClass:'Securitisations',sector:'Residential',evic:null,outstanding:340,scope1:68000,scope2:32000,scope3:0,dqs:5,source:'Look-through to underlying EPC data',currency:'GBP',poolValue:1800},
  // ── Undrawn Commitments (1 position) ── PCAF Ch.4.13 ──
  {id:60,name:'Revolving Credit Facility \u2014 Diversified Ind.',ticker:null,country:'US',geo:'Americas',assetClass:'Undrawn Commitments',sector:'Industrials',evic:65,outstanding:200,scope1:1420000,scope2:680000,scope3:12000000,dqs:4,source:'Sector-avg EF; CCF=75%',currency:'USD',ccf:0.75,committedAmount:800},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   INSURANCE PORTFOLIO — Part B (Chapter 5)
   8 Lines of Business with full sector emission factor references
   ═══════════════════════════════════════════════════════════════════════════════ */
const INSURANCE_LOB=[
  {id:1,lob:'Motor',subLob:'Private & Commercial Motor',premiumM:1420,claimsM:980,exposureM:8400,
   efPerPremium:0.42,efSource:'PCAF v2 Ch.5 Table 5.2',dqs:3,
   notes:'Direct auto insurance; fleet avg 165 gCO2/km \u00d7 15k km; DQS 3 via fleet-level data',
   methodology:'Attribution = GWP proportion. EF derived from UK motor fleet avg emissions per unit premium (DEFRA 2023 + Lloyd\'s analysis).',
   riskFactors:'Physical risk: flood/hail damage increasing claims frequency. Transition risk: ICE fleet depreciation as EV adoption accelerates.'},
  {id:2,lob:'Property',subLob:'Residential & SME Property',premiumM:2100,claimsM:1340,exposureM:14200,
   efPerPremium:0.28,efSource:'PCAF v2 Ch.5 \u2014 residential buildings avg',dqs:4,
   notes:'Home & commercial property; EPC-based proxy for building emissions per premium unit',
   methodology:'Attribution = GWP proportion. EF from UK building stock energy intensity (BRE/DEFRA) mapped to premium volume.',
   riskFactors:'Physical risk: increasing flood, windstorm, wildfire losses. Transition risk: EPC min standards may reduce insurable stock.'},
  {id:3,lob:'Commercial',subLob:'General Liability & PI',premiumM:3400,claimsM:1820,exposureM:22000,
   efPerPremium:0.61,efSource:'PCAF v2 Ch.5 \u2014 commercial multi-sector avg',dqs:4,
   notes:'General liability, workers comp, professional indemnity across multiple sectors',
   methodology:'Attribution = GWP proportion. Weighted sector EF based on insured industry mix.',
   riskFactors:'Liability risk: increasing climate litigation. D&O exposure for greenwashing and climate disclosure failures.'},
  {id:4,lob:'Life',subLob:'Term & Whole Life',premiumM:4800,claimsM:2100,exposureM:42000,
   efPerPremium:0.08,efSource:'PCAF v2 Ch.5 \u2014 life insurance low-intensity proxy',dqs:5,
   notes:'Term & whole life; minimal direct emissions link; mainly investment portfolio emissions',
   methodology:'Low EF reflects weak causal link between life insurance and GHG emissions. Investment-side emissions reported separately under Part A.',
   riskFactors:'Mortality risk from extreme heat events. Longevity risk changes from climate-driven health impacts.'},
  {id:5,lob:'Health',subLob:'Medical & Dental',premiumM:2200,claimsM:1640,exposureM:12000,
   efPerPremium:0.05,efSource:'PCAF v2 Ch.5 \u2014 health sector proxy',dqs:5,
   notes:'Medical & dental insurance; healthcare sector has low-to-moderate direct emissions',
   methodology:'EF from healthcare sector energy intensity. Primarily Scope 2 (hospital electricity).',
   riskFactors:'Climate-driven health impacts: heat stress, vector-borne diseases, air quality.'},
  {id:6,lob:'Reinsurance',subLob:'Property Cat & Specialty',premiumM:1800,claimsM:1200,exposureM:18000,
   efPerPremium:0.35,efSource:'PCAF v2 Ch.5 \u2014 reinsurance composite',dqs:4,
   notes:'Property cat & specialty reinsurance; composite EF weighted by underlying LoB mix',
   methodology:'Attribution follows ceded premium. EF is composite of underlying primary insurance mix, weighted by reinsured exposure.',
   riskFactors:'Nat cat severity increasing: Swiss Re estimates 5-7% annual loss trend increase from climate change.'},
  {id:7,lob:'Project Insurance',subLob:'Construction All-Risk & DSU',premiumM:680,claimsM:340,exposureM:6200,
   efPerPremium:0.74,efSource:'PCAF v2 Ch.5 \u2014 construction/infrastructure',dqs:4,
   notes:'Construction all-risk, delay in start-up, PI for infrastructure and energy projects',
   methodology:'High EF reflects construction sector emission intensity. Project-level monitoring where available.',
   riskFactors:'Physical risk during construction: extreme weather delays. Stranded asset risk for fossil fuel projects.'},
  {id:8,lob:'Marine',subLob:'Hull, Cargo & P&I',premiumM:920,claimsM:580,exposureM:8400,
   efPerPremium:0.89,efSource:'PCAF v2 Ch.5 Table 5.3 \u2014 IMO shipping avg',dqs:3,
   notes:'Hull & cargo; IMO MEPC.352(78) CII reference; highest EF of all LOBs',
   methodology:'EF derived from IMO Fourth GHG Study (2020). Marine sector avg tCO2e per premium dollar based on global fleet fuel consumption.',
   riskFactors:'Regulatory risk: IMO decarbonisation targets (50% by 2050). Fuel transition costs: LNG/methanol/ammonia.'},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   FACILITATED EMISSIONS — Part C (Chapter 6)
   7 Deal Types with full attribution methodology
   ═══════════════════════════════════════════════════════════════════════════════ */
const FACILITATED_DEALS=[
  {id:1,type:'Bond Underwriting',client:'TotalEnergies SE',sector:'Oil & Gas',dealSizeM:4200,underwrittenM:840,clientScope1:33100000,clientScope2:20100000,clientScope3:950000000,attrFormula:'Underwritten / Deal Size',citation:'PCAF v2, Ch.6, \u00a76.2',dqs:2,year:2023,bookRunner:'Joint',peerGroup:'Bulge bracket syndicate of 6 banks'},
  {id:2,type:'IPO',client:'Acme Renewables Ltd',sector:'Renewables',dealSizeM:1800,underwrittenM:360,clientScope1:28000,clientScope2:14000,clientScope3:42000,attrFormula:'Underwritten / Deal Size',citation:'PCAF v2, Ch.6, \u00a76.3',dqs:3,year:2024,bookRunner:'Lead',peerGroup:'Lead left + 2 co-managers'},
  {id:3,type:'Equity Placement',client:'BHP Group',sector:'Mining',dealSizeM:2400,underwrittenM:600,clientScope1:28100000,clientScope2:14200000,clientScope3:320000000,attrFormula:'Placed / Deal Size',citation:'PCAF v2, Ch.6, \u00a76.4',dqs:2,year:2023,bookRunner:'Joint',peerGroup:'3-bank syndicate'},
  {id:4,type:'Syndicated Loan',client:'ArcelorMittal SA',sector:'Steel',dealSizeM:3600,underwrittenM:720,clientScope1:58400000,clientScope2:14500000,clientScope3:62000000,attrFormula:'Committed / Total Facility',citation:'PCAF v2, Ch.6, \u00a76.5',dqs:3,year:2023,bookRunner:'MLA',peerGroup:'Syndicate of 8 banks'},
  {id:5,type:'Securitisation',client:'UK RMBS Originator',sector:'Real Estate',dealSizeM:2800,underwrittenM:560,clientScope1:840000,clientScope2:400000,clientScope3:0,attrFormula:'Tranche / Pool Value',citation:'PCAF v2, Ch.6, \u00a76.6',dqs:4,year:2024,bookRunner:'Structuring Agent',peerGroup:'Sole arranger'},
  {id:6,type:'Convertible Bond',client:'Volkswagen AG',sector:'Automotive',dealSizeM:1400,underwrittenM:420,clientScope1:16200000,clientScope2:7900000,clientScope3:520000000,attrFormula:'Underwritten / Deal Size',citation:'PCAF v2, Ch.6, \u00a76.7',dqs:2,year:2023,bookRunner:'Joint',peerGroup:'2-bank syndicate'},
  {id:7,type:'Advisory M&A',client:'Mining Target Co.',sector:'Mining',dealSizeM:6800,underwrittenM:0,clientScope1:10200000,clientScope2:5200000,clientScope3:82000000,attrFormula:'Advisory fee / Deal Size (capped 10%)',citation:'PCAF v2, Ch.6, \u00a76.8',dqs:4,year:2024,bookRunner:'Sole Advisor',peerGroup:'Financial advisor (no underwriting)'},
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
  {id:'F1',name:'Financed Emissions \u2014 Listed Equity & Corporate Bonds',section:'\u00a74.2-4.3',
   formula:'FE_i = (Outstanding_i / EVIC_i) \u00d7 Company_Emissions_i',
   latex:'FE_i = \\frac{O_i}{EVIC_i} \\times E_i',
   variables:['Outstanding_i = current exposure in reporting currency ($M)','EVIC_i = Enterprise Value Including Cash = Market Cap + Total Debt + Preferred Stock + Minority Interest ($Bn)','Company_Emissions_i = Scope 1 + Scope 2 emissions (tCO2e)'],
   notes:'EVIC is the standard denominator per PCAF v2 \u00a74.2.1. If EVIC unavailable for listed companies, use market cap \u00d7 sector leverage ratio (DQS auto-downgrades). For unlisted, see Business Loans methodology.',
   example:'Shell plc: FE = ($31.2M / $245Bn) \u00d7 68,400,000 tCO2e = 8,709 tCO2e. Attribution factor = 0.01274%.',
   edgeCases:['Null EVIC: use sector-median proxy from S&P Capital IQ; DQS auto-downgrades to min(current, 4)','Multi-currency: convert all to reporting currency at period-end FX rate per PCAF \u00a73.2.4','Negative EVIC (distressed companies): use total assets as denominator; flag as DQS 5','Dual-listed securities: use primary listing EVIC to avoid double-counting'],
   validation:['Outstanding must be > 0 and \u2264 EVIC','EVIC should be period-end (matching emissions reporting period)','Emissions must match most recent 12-month reporting period']},
  {id:'F2',name:'Financed Emissions \u2014 Business Loans',section:'\u00a74.4',
   formula:'FE_i = (Outstanding_i / (EVIC_i or E+D_i)) \u00d7 Company_Emissions_i',
   latex:'FE_i = \\frac{O_i}{EVIC_i \\text{ or } (E_i + D_i)} \\times E_i',
   variables:['Outstanding_i = drawn loan amount ($M)','E+D_i = Total Equity + Total Debt from most recent audited financials ($M)','Company_Emissions_i = Scope 1 + Scope 2 (tCO2e)'],
   notes:'For unlisted borrowers without public EVIC data, use Total Equity + Total Debt from the most recent audited financial statements. If both are unavailable, use Total Assets as a last resort (DQS 4 minimum).',
   example:'SME Loan: FE = ($8M / $25M E+D) \u00d7 420,000 tCO2e = 134,400 tCO2e. Attribution factor = 32.0%.',
   edgeCases:['No financials: use revenue \u00d7 sector EF; DQS = 4 minimum','Negative equity (insolvent): use total assets; flag for review','Revolving facilities: use average drawn balance over period'],
   validation:['E+D should be from audited financials within 18 months of reporting date','Outstanding must reflect drawn balance, not commitment']},
  {id:'F3',name:'Financed Emissions \u2014 Project Finance',section:'\u00a74.5',
   formula:'FE_i = (Outstanding_i / Total_Project_Cost_i) \u00d7 Project_Emissions_i',
   latex:'FE_i = \\frac{O_i}{TPC_i} \\times PE_i',
   variables:['Outstanding_i = current loan balance ($M)','Total_Project_Cost_i = total equity + debt financing for the project ($M)','Project_Emissions_i = annual project-level emissions (tCO2e)'],
   notes:'For renewables, use lifecycle emissions including construction and decommissioning. For fossil fuel projects, include fugitive emissions (methane leakage). Multi-phase projects: allocate to phase being financed.',
   example:'Wind Farm: FE = ($480M / $1,200M) \u00d7 12,400 tCO2e = 4,960 tCO2e. Attribution = 40%.',
   edgeCases:['Multiple tranches with different seniority: use pro-rata attribution','JV structures: attribute based on equity share, not debt share','Construction phase: use expected operational emissions if not yet operational'],
   validation:['Outstanding must not exceed total project cost','Project emissions should be forward-looking for new projects']},
  {id:'F4',name:'Financed Emissions \u2014 Commercial Real Estate',section:'\u00a74.6',
   formula:'FE_i = (Outstanding_i / Property_Value_i) \u00d7 Building_Emissions_i',
   latex:'FE_i = \\frac{O_i}{PV_i} \\times BE_i',
   variables:['Outstanding_i = mortgage/loan balance ($M)','Property_Value_i = current appraisal or purchase price ($M)','Building_Emissions_i = annual energy-related Scope 1+2 emissions (tCO2e)'],
   notes:'Use EPC ratings where available. Apply CRREM methodology for stranded asset risk assessment. Include Scope 1 (on-site combustion: gas boilers, CHP) and Scope 2 (purchased electricity/district heating).',
   example:'Canary Wharf: FE = ($620M / $900M) \u00d7 18,400 tCO2e = 12,676 tCO2e. Attribution = 68.9%.',
   edgeCases:['Mixed-use buildings: allocate by gross lettable area per use type','Vacant properties: use design energy consumption at full occupancy','Refurbishment: update emissions post-renovation; may trigger DQS upgrade'],
   validation:['Property value must be recent (within 3 years or latest appraisal)','Building emissions should include common areas and landlord-controlled spaces']},
  {id:'F5',name:'Financed Emissions \u2014 Mortgages',section:'\u00a74.7',
   formula:'FE_i = (Outstanding_i / Property_Value_i) \u00d7 Building_Emissions_i',
   latex:'FE_i = \\frac{O_i}{PV_i} \\times BE_i',
   variables:['Outstanding_i = current mortgage balance ($M)','Property_Value_i = value at origination or latest valuation ($M)','Building_Emissions_i = annual emissions from EPC/floor area \u00d7 grid EF (tCO2e)'],
   notes:'EPC to emissions conversion: use national avg kWh/m\u00b2 by EPC rating band \u00d7 floor area \u00d7 national grid emission factor. For portfolio-level reporting, use EPC distribution of the mortgage book.',
   example:'UK Mortgage: FE = (\u00a3250K / \u00a3400K) \u00d7 4.2 tCO2e = 2.625 tCO2e per mortgage. Portfolio: 8,200 mortgages \u00d7 avg 23.0 tCO2e attribution = 189,000 tCO2e.',
   edgeCases:['Properties without EPC: use postcode-level proxy or national average; DQS = 5','Buy-to-let: emissions still attributed to mortgage holder, not tenant','Partial repayments: update outstanding balance for accurate attribution'],
   validation:['Property value should be at origination for LTV consistency','EPC rating must be current (within 10 years in UK)']},
  {id:'F6',name:'Financed Emissions \u2014 Vehicle Loans',section:'\u00a74.8',
   formula:'FE_i = (Outstanding_i / Vehicle_Value_i) \u00d7 (CO2_per_km \u00d7 Annual_km)',
   latex:'FE_i = \\frac{O_i}{VV_i} \\times (\\frac{gCO2}{km} \\times km_{annual})',
   variables:['Outstanding_i = loan balance ($)','Vehicle_Value_i = purchase price ($)','CO2_per_km = manufacturer WLTP test-cycle gCO2/km','Annual_km = estimated annual mileage (default 15,000 km EU / 19,200 km US)'],
   notes:'For EVs: Scope 1 = 0; Scope 2 = grid EF \u00d7 kWh/100km \u00d7 annual km / 100. For ICE vehicles, use WLTP (EU) or EPA combined (US) CO2/km rating.',
   example:'UK ICE: FE = (\u00a318K / \u00a335K) \u00d7 (142 gCO2/km \u00d7 15,000 km) = 1,097 kgCO2e per vehicle.',
   edgeCases:['Hybrid vehicles: use combined (electric + ICE) weighted by electric-mode proportion','Commercial vehicles: use VECTO declared value for HDV','Fleet financing: aggregate by vehicle category'],
   validation:['CO2/km must be WLTP (not NEDC) for EU vehicles post-2018','Annual mileage assumption should match national statistics']},
  {id:'F7',name:'Financed Emissions \u2014 Sovereign Debt',section:'\u00a74.9',
   formula:'FE_i = (Outstanding_i / PPP_GDP_i) \u00d7 Sovereign_Emissions_i',
   latex:'FE_i = \\frac{O_i}{GDP_{PPP,i}} \\times SE_i',
   variables:['Outstanding_i = sovereign bond holding ($M)','PPP_GDP_i = purchasing power parity GDP of the sovereign ($Bn)','Sovereign_Emissions_i = national GHG inventory total (tCO2e)'],
   notes:'Use production-based accounting (territory principle per UNFCCC). Source: UNFCCC National Inventory Reports, or World Bank WDI / IMF WEO. Exclude LULUCF unless specifically including land-use sector.',
   example:'UK Gilt: FE = ($180M / $3,340Bn) \u00d7 326,000,000 tCO2e = 17,569 tCO2e.',
   edgeCases:['Sub-sovereign: use regional emissions if available; otherwise pro-rata from national','Inflation-linked bonds: use nominal outstanding for attribution','Multi-currency sovereign bonds: convert to USD at IMF period-end rate'],
   validation:['PPP GDP must be from same year as emissions data','National emissions should be latest available UNFCCC submission']},
  {id:'F8',name:'Financed Emissions \u2014 Use-of-Proceeds Instruments',section:'\u00a74.10',
   formula:'FE_i = (Outstanding_i / Total_Bond_Issuance_i) \u00d7 Proceeds_Emissions_i',
   latex:'FE_i = \\frac{O_i}{TBI_i} \\times PE_i',
   variables:['Outstanding_i = holding amount ($M)','Total_Bond_Issuance_i = total issuance amount of the bond ($M)','Proceeds_Emissions_i = emissions from projects financed by proceeds (tCO2e)'],
   notes:'Green/social/sustainability bonds. Track proceeds allocation from issuer impact reports. Report avoided emissions vs actual emissions separately.',
   example:'World Bank Green Bond: FE = ($120M / $2,000M) \u00d7 42,000 tCO2e = 2,520 tCO2e.',
   edgeCases:['Unallocated proceeds: apply issuer-level EF to unallocated portion','Multi-project bonds: weight by allocation percentage per project','Refinancing: use current project emissions, not original'],
   validation:['Proceeds allocation should be from most recent impact report','Total bond size must match issuance amount']},
  {id:'F9',name:'Insurance-Associated Emissions',section:'\u00a75.1',
   formula:'FE_ins = GWP_lob \u00d7 Sector_EF_per_Premium_lob',
   latex:'FE_{ins} = GWP_{lob} \\times EF_{sector,lob}',
   variables:['GWP_lob = gross written premium for line of business ($M)','Sector_EF_per_Premium_lob = tCO2e per $M premium by LoB'],
   notes:'Part B methodology per PCAF v2 Chapter 5. Attribution based on premium volume, not claims paid. Use sector-specific emission factors from Table 5.2-5.3.',
   example:'Motor: FE = $1,420M \u00d7 0.42 tCO2e/$M = 596,400 tCO2e.',
   edgeCases:['Multi-year policies: use annualised premium','Reinsurance: net of retrocession','Coinsurance: use share of premium'],
   validation:['Premium must be gross written (not net of reinsurance for primary)','EF should be periodically updated as sector decarbonises']},
  {id:'F10',name:'Facilitated Emissions',section:'\u00a76.1',
   formula:'FE_fac = (Underwritten_i / Deal_Size_i) \u00d7 Client_Emissions_i',
   latex:'FE_{fac} = \\frac{UW_i}{DS_i} \\times CE_i',
   variables:['Underwritten_i = bank committed/underwritten amount ($M)','Deal_Size_i = total deal size ($M)','Client_Emissions_i = issuer/client Scope 1+2 emissions (tCO2e)'],
   notes:'Part C methodology per PCAF v2 Chapter 6. Capital markets transactions including bond underwriting, IPO, equity placements, syndicated loans, securitisation structuring.',
   example:'TotalEnergies Bond: FE = ($840M / $4,200M) \u00d7 53,200,000 tCO2e = 10,640,000 tCO2e.',
   edgeCases:['Advisory-only mandates: cap at advisory fee / deal size (max 10%) per \u00a76.8','Multiple bookrunners: each reports based on their underwriting commitment','Green bond underwriting: use project emissions, not issuer-level'],
   validation:['Underwritten must not exceed deal size','Client emissions should be from same reporting period as deal']},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   DOWNSTREAM MODULE CONNECTIONS
   ═══════════════════════════════════════════════════════════════════════════════ */
const DOWNSTREAM_MODULES=[
  {module:'SFDR PAI #1 \u2014 GHG Emissions',field:'totalFinancedEmissions',description:'Total Scope 1, 2, and 3 GHG emissions of investee companies, proportional to ownership. Directly sourced from PCAF Part A financed emissions calculation.',format:'tCO2e',regulation:'SFDR RTS, Annex I, Table 1, Indicator 1',inputFields:['financedEmissions per holding','scope coverage flags'],frequency:'Annual (PAI reference period)'},
  {module:'SFDR PAI #2 \u2014 Carbon Footprint',field:'carbonFootprint',description:'Total financed emissions divided by current value of all investments (AUM). Measures emission intensity per unit invested.',format:'tCO2e per EUR M invested',regulation:'SFDR RTS, Annex I, Table 1, Indicator 2',inputFields:['totalFinancedEmissions','portfolio AUM'],frequency:'Annual'},
  {module:'SFDR PAI #3 \u2014 GHG Intensity',field:'waciIntensity',description:'Weighted Average Carbon Intensity (WACI) of investee companies. Weighted by portfolio weight \u00d7 company intensity (emissions/revenue).',format:'tCO2e per EUR M revenue',regulation:'SFDR RTS, Annex I, Table 1, Indicator 3',inputFields:['company emissions','company revenue','portfolio weights'],frequency:'Annual'},
  {module:'Portfolio Temperature Score',field:'impliedTemperatureRise',description:'Implied temperature rise based on company-level emission pathways vs Paris-aligned budgets. Uses SBTi/GFANZ methodology.',format:'\u00b0C above pre-industrial',regulation:'TCFD / SBTi / GFANZ guidance',inputFields:['company emissions trajectory','SBTi targets','sector pathway'],frequency:'Quarterly'},
  {module:'Climate Value-at-Risk',field:'climateValueAtRisk',description:'Financial risk quantification from carbon pricing, regulatory costs, physical damage, and technology shifts under NGFS scenarios.',format:'% of portfolio NAV',regulation:'TCFD Scenario Analysis / NGFS',inputFields:['financed emissions','carbon prices','physical risk exposure'],frequency:'Annual / semi-annual'},
  {module:'CSRD E1 \u2014 Climate Change',field:'esrsE1Emissions',description:'ESRS E1 disclosure on Scope 1, 2, 3 emissions and transition plans. PCAF provides the financed emissions base for financial institution E1 disclosures.',format:'tCO2e / intensity per EUR M',regulation:'CSRD ESRS E1-5, E1-6',inputFields:['total financed emissions by scope','intensity metrics','DQS distribution'],frequency:'Annual (CSRD reporting cycle)'},
  {module:'EBA Pillar 3 \u2014 ESG Risk',field:'ebaPillar3',description:'Banking book financed emissions, WACI, and data quality scores for prudential ESG disclosure per EBA ITS.',format:'tCO2e / DQS weighted',regulation:'EBA ITS on Pillar 3 ESG 2022/2453',inputFields:['financed emissions by asset class','WACI','DQS distribution','counterparty-level data'],frequency:'Annual (aligned with Pillar 3)'},
  {module:'TCFD Metrics & Targets',field:'tcfdMetrics',description:'PCAF-sourced metrics for TCFD-aligned climate disclosure. Includes absolute emissions, intensity, and data quality.',format:'Multiple metrics',regulation:'TCFD Recommendations 2017, 2021 guidance',inputFields:['financed emissions absolute & intensity','YoY comparison','target progress'],frequency:'Annual'},
];

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPUTATION FUNCTIONS
   ═══════════════════════════════════════════════════════════════════════════════ */
function computeAttrFactor(p){
  // Project Finance: Outstanding / Total Project Cost (Ch.4.5)
  if(p.assetClass==='Project Finance'){
    const tpc=p.projectCost||p.outstanding*2.5;
    return Math.min(1.0,p.outstanding/tpc);
  }
  // CRE: Outstanding / Property Value (Ch.4.6)
  if(p.assetClass==='Commercial Real Estate'){
    const pv=p.propertyValue||p.outstanding*1.5;
    return Math.min(1.0,p.outstanding/pv);
  }
  // Mortgages, Vehicle Loans, Securitisations: typically 1.0 (full attribution)
  if(['Mortgages','Vehicle Loans','Securitisations'].includes(p.assetClass))return 1.0;
  // Sovereign Debt: Outstanding / PPP GDP (Ch.4.9)
  if(p.assetClass==='Sovereign Debt'){
    const gdp=COUNTRY_PPP_GDP[p.country]||COUNTRY_PPP_GDP.default;
    return Math.min(1.0,(p.outstanding/(gdp*1000)));
  }
  // Use-of-Proceeds: Outstanding / Total Bond Size (Ch.4.10)
  if(p.assetClass==='Use-of-Proceeds'){
    const tbs=p.totalBondSize||p.outstanding*10;
    return Math.min(1.0,p.outstanding/tbs);
  }
  // Sub-Sovereign: Outstanding / Total Entity Debt
  if(p.assetClass==='Sub-Sovereign')return 0.10;
  // Undrawn Commitments: CCF x (Outstanding / EVIC) (Ch.4.13)
  if(p.assetClass==='Undrawn Commitments'){
    const ccf=p.ccf||0.75;
    if(!p.evic){const se=SECTOR_MEDIAN_EVIC[p.sector]||SECTOR_MEDIAN_EVIC.default;return ccf*(se?Math.min(1.0,p.outstanding/se):0.5);}
    return ccf*Math.min(1.0,p.outstanding/p.evic);
  }
  // Listed Equity, Corporate Bonds, Business Loans: Outstanding / EVIC (Ch.4.2-4.4)
  if(!p.evic){
    const se=SECTOR_MEDIAN_EVIC[p.sector]||SECTOR_MEDIAN_EVIC.default;
    return se?Math.min(1.0,p.outstanding/se):1.0;
  }
  return Math.min(1.0,p.outstanding/p.evic);
}

function computeRow(p){
  const totalEmissions=(p.scope1||0)+(p.scope2||0);
  const totalWithScope3=totalEmissions+(p.scope3||0);
  const attrFactor=computeAttrFactor(p);
  const financedEmissions=+(attrFactor*totalEmissions).toFixed(0);
  const financedScope3=+(attrFactor*(p.scope3||0)).toFixed(0);
  const evicWarning=(!p.evic&&['Listed Equity','Corporate Bonds','Business Loans'].includes(p.assetClass))?'NULL_EVIC \u2014 sector proxy used':null;
  const adjustedDqs=evicWarning?Math.max(p.dqs,4):p.dqs;
  const revenueM=p.evic?p.evic*350:(SECTOR_MEDIAN_EVIC[p.sector]||50)*350;
  const waci=revenueM>0?(totalEmissions/revenueM):0;
  const carbonIntensity=p.outstanding>0?financedEmissions/p.outstanding:0;
  const scope1Pct=totalEmissions>0?(p.scope1||0)/totalEmissions:0;
  const scope2Pct=totalEmissions>0?(p.scope2||0)/totalEmissions:0;
  return{...p,totalEmissions,totalWithScope3,attrFactor,financedEmissions,financedScope3,waci,carbonIntensity,evicWarning,dqs:adjustedDqs,scope1Pct,scope2Pct};
}

const INITIAL_POSITIONS=BASE_POSITIONS.map(computeRow);

/* ═══════════════════════════════════════════════════════════════════════════════
   REUSABLE UI COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */
function KPICard({label,value,sub,color,mono}){
  return(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:'14px 18px',flex:1,minWidth:150}}>
    <div style={{fontSize:10,color:T.textMut,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:4,fontFamily:T.mono}}>{label}</div>
    <div style={{fontSize:21,fontWeight:700,color:color||T.navy,lineHeight:1.1,fontFamily:mono?T.mono:T.font}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:T.textSec,marginTop:4}}>{sub}</div>}
  </div>);
}

function TabBar({tabs,active,onChange}){
  return(<div style={{display:'flex',borderBottom:`2px solid ${T.border}`,marginBottom:24,gap:0,overflowX:'auto'}}>
    {tabs.map(t=>(<button key={t} onClick={()=>onChange(t)} style={{padding:'10px 18px',border:'none',background:'none',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:T.font,color:active===t?T.navy:T.textMut,borderBottom:active===t?`2px solid ${T.navy}`:'2px solid transparent',marginBottom:-2,transition:'color 0.15s',whiteSpace:'nowrap'}}>{t}</button>))}
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
function AddPositionModal({onAdd,onClose}){
  const[form,setForm]=useState({name:'',country:'US',geo:'Americas',assetClass:'Listed Equity',sector:'Technology',evic:'',outstanding:'',scope1:'',scope2:'',scope3:'',dqs:'3',source:'Manual entry',currency:'USD',projectCost:'',propertyValue:''});
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const[errors,setErrors]=useState({});

  function validate(){
    const e={};
    if(!form.name.trim())e.name='Company/instrument name is required';
    if(!form.outstanding||+form.outstanding<=0)e.outstanding='Outstanding exposure must be > 0';
    if((!form.scope1||+form.scope1===0)&&(!form.scope2||+form.scope2===0))e.scope1='At least Scope 1 or Scope 2 emissions required';
    if(['Listed Equity','Corporate Bonds','Business Loans'].includes(form.assetClass)&&form.evic&&+form.evic<=0)e.evic='EVIC must be > 0 if provided';
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
        <div style={{fontSize:11,color:T.textMut,marginBottom:16}}>PCAF Standard v2 \u2014 All 12 asset classes supported. Fields adapt based on selected asset class.</div>
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
   TAB 1: PART A — FINANCED EMISSIONS (12 Asset Classes)
   PCAF Standard v2, Chapter 4
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

  const filtered=useMemo(()=>{
    let ps=positions;
    if(acFilter!=='All')ps=ps.filter(p=>p.assetClass===acFilter);
    if(geoFilter!=='All')ps=ps.filter(p=>p.geo===geoFilter);
    if(dqsFilter!=='All')ps=ps.filter(p=>p.dqs===+dqsFilter);
    if(search.trim()){const q=search.toLowerCase();ps=ps.filter(p=>p.name.toLowerCase().includes(q)||p.sector.toLowerCase().includes(q)||p.country.toLowerCase().includes(q));}
    return[...ps].sort((a,b)=>sortDir*(a[sortKey]>b[sortKey]?1:-1));
  },[positions,acFilter,geoFilter,dqsFilter,search,sortKey,sortDir]);

  const totalFE=useMemo(()=>positions.reduce((s,p)=>s+p.financedEmissions,0),[positions]);
  const totalFEScope3=useMemo(()=>positions.reduce((s,p)=>s+p.financedScope3,0),[positions]);
  const totalOut=useMemo(()=>positions.reduce((s,p)=>s+p.outstanding,0),[positions]);
  const avgDqs=useMemo(()=>(positions.reduce((s,p)=>s+p.dqs,0)/positions.length).toFixed(2),[positions]);
  const carbonFootprint=useMemo(()=>totalOut>0?totalFE/(totalOut/1000):0,[totalFE,totalOut]);
  const waci=useMemo(()=>{let num=0,den=0;positions.forEach(p=>{num+=p.outstanding*p.waci;den+=p.outstanding;});return den>0?num/den:0;},[positions]);
  const carbonCostM=useMemo(()=>(totalFE*carbonPrice/1e6).toFixed(1),[totalFE,carbonPrice]);

  const byAC=useMemo(()=>{const m={};positions.forEach(p=>{if(!m[p.assetClass])m[p.assetClass]={ac:p.assetClass,count:0,fe:0,out:0,avgDqs:0,totalDqs:0};const e=m[p.assetClass];e.count++;e.fe+=p.financedEmissions;e.out+=p.outstanding;e.totalDqs+=p.dqs;});Object.values(m).forEach(v=>v.avgDqs=+(v.totalDqs/v.count).toFixed(1));return Object.values(m).sort((a,b)=>b.fe-a.fe);},[positions]);
  const byGeo=useMemo(()=>{const m={};positions.forEach(p=>{if(!m[p.geo])m[p.geo]={geo:p.geo,fe:0,count:0,out:0};m[p.geo].fe+=p.financedEmissions;m[p.geo].count++;m[p.geo].out+=p.outstanding;});return Object.values(m);},[positions]);
  const bySector=useMemo(()=>{const m={};positions.forEach(p=>{if(!m[p.sector])m[p.sector]={sector:p.sector,fe:0,count:0};m[p.sector].fe+=p.financedEmissions;m[p.sector].count++;});return Object.values(m).sort((a,b)=>b.fe-a.fe).slice(0,15);},[positions]);
  const top10=useMemo(()=>[...positions].sort((a,b)=>b.financedEmissions-a.financedEmissions).slice(0,10),[positions]);

  function handleSort(key){if(sortKey===key)setSortDir(d=>-d);else{setSortKey(key);setSortDir(-1);}}
  function startEdit(p){setExpandedId(p.id);setEditDraft({outstanding:p.outstanding,evicOverride:p.evic,scope1:p.scope1,scope2:p.scope2,scope3:p.scope3,dqs:p.dqs});}
  function applyEdit(p){
    const updated={...p,outstanding:+editDraft.outstanding,evic:editDraft.evicOverride?+editDraft.evicOverride:null,scope1:+editDraft.scope1,scope2:+(editDraft.scope2||0),scope3:+(editDraft.scope3||0),dqs:+editDraft.dqs};
    setPositions(prev=>prev.map(x=>x.id===p.id?computeRow(updated):x));setExpandedId(null);
  }
  function removeSelected(){setPositions(prev=>prev.filter(p=>!selected.has(p.id)));setSelected(new Set());}
  function toggleSelect(id){setSelected(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});}

  const hdr=(key,label,align)=>(<th onClick={()=>handleSort(key)} style={{padding:'8px 8px',textAlign:align||'left',fontSize:10,fontWeight:700,color:T.textSec,letterSpacing:'0.03em',textTransform:'uppercase',cursor:'pointer',userSelect:'none',whiteSpace:'nowrap',borderBottom:`1px solid ${T.border}`,background:T.bg,fontFamily:T.mono,position:'sticky',top:0,zIndex:2}}>{label}{sortKey===key?(sortDir===-1?' \u25BC':' \u25B2'):''}</th>);
  const inp={width:'100%',padding:'5px 8px',border:`1px solid ${T.border}`,borderRadius:5,fontSize:12,fontFamily:T.font,color:T.text,background:T.bg};

  const exportCSV=useCallback(()=>{
    const keys=['name','assetClass','sector','country','currency','outstanding','attrFactor','scope1','scope2','scope3','financedEmissions','financedScope3','waci','dqs','source'];
    const csv=[keys.join(','),...positions.map(r=>keys.map(k=>{let v=r[k];if(typeof v==='number')return v;return`"${String(v||'').replace(/"/g,'""')}"`;}).join(','))].join('\n');
    const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='pcaf_part_a_financed_emissions.csv';a.click();URL.revokeObjectURL(u);
  },[positions]);

  return(<div>
    <SectionHeader title="Part A: Financed Emissions" citation="PCAF Standard v2, Chapter 4" description={`12 asset classes across ${positions.length} holdings. Attribution Factor = Outstanding / Denominator (per asset class). Financed Emissions = Attribution Factor x Scope 1+2 Emissions. All formulas per PCAF v2 Chapters 4.2-4.13.`}/>

    {/* KPI Row */}
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
      <KPICard label="Total Financed Emissions" value={fmt(totalFE)+' tCO2e'} sub={`${positions.length} positions | Scope 1+2`} color={T.navy}/>
      <KPICard label="Including Scope 3" value={fmt(totalFE+totalFEScope3)+' tCO2e'} sub="All scopes attributed" color={T.navyL}/>
      <KPICard label="Carbon Footprint" value={carbonFootprint.toFixed(0)+' tCO2e/$Bn'} sub="Total FE / AUM" color={T.gold}/>
      <KPICard label="WACI" value={waci.toFixed(1)} sub="tCO2e / $M revenue" color={T.sage}/>
      <KPICard label="Avg DQS" value={avgDqs} sub="Portfolio average" color={DQS_COLOR[Math.round(+avgDqs)]||T.amber}/>
      <KPICard label="Carbon Cost" value={'$'+carbonCostM+'M'} sub={`@ $${carbonPrice}/tCO2e`} color={T.red}/>
      <KPICard label="CC Credits Financed" value={ccPcaf.totalFinancedCredits?.toLocaleString() || '0'} sub="Carbon Credit Engine" color={'#059669'}/>
    </div>

    {/* Charts */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:20}}>
      <Card title="FE by Asset Class" citation="\u00a74.1 Table 4.1">
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
          <BarChart data={top10} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:9,fill:T.textSec}} tickFormatter={v=>fmt(v)}/><YAxis type="category" dataKey="name" tick={{fontSize:7,fill:T.textSec}} width={110}/><Tooltip {...tip}/><Bar dataKey="financedEmissions" fill={T.navy} radius={[0,4,4,0]} name="FE tCO2e"/></BarChart>
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
            {hdr('outstanding','Exp $M','right')}{hdr('attrFactor','Attr%','right')}{hdr('scope1','S1 tCO2e','right')}{hdr('scope2','S2 tCO2e','right')}
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
                </td>
                <td style={{padding:'5px 8px'}}><Badge color={AC_COLORS[p.assetClass]||T.navy}>{p.assetClass==='Commercial Real Estate'?'CRE':p.assetClass==='Undrawn Commitments'?'Undrawn':p.assetClass.length>16?p.assetClass.slice(0,14)+'\u2026':p.assetClass}</Badge></td>
                <td style={{padding:'5px 8px',color:T.textSec,fontSize:10}}>{p.sector}</td>
                <td style={{padding:'5px 8px',fontFamily:T.mono,fontSize:10}}>{p.country}</td>
                <td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono,fontSize:10}}>{fmtNum(p.outstanding)}</td>
                <td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono,fontSize:10}}>{fmtPct(p.attrFactor)}</td>
                <td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono,fontSize:10}}>{fmt(p.scope1)}</td>
                <td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono,fontSize:10}}>{fmt(p.scope2)}</td>
                {scopeView==='1+2+3'&&<td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono,fontSize:10}}>{fmt(p.scope3)}</td>}
                <td style={{padding:'5px 8px',textAlign:'right',fontWeight:600,color:p.financedEmissions>1e6?T.red:p.financedEmissions>1e5?T.amber:T.text,fontFamily:T.mono,fontSize:10}}>
                  {fmt(scopeView==='1+2+3'?p.financedEmissions+p.financedScope3:p.financedEmissions)}
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
                      <button onClick={()=>applyEdit(p)} style={{padding:'5px 14px',border:'none',borderRadius:4,background:T.sage,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>Recalculate</button>
                    </div>
                    <div style={{marginTop:6,fontSize:10,color:T.textMut,fontFamily:T.mono}}>
                      PCAF {ASSET_CLASS_DEFS.find(d=>d.ac===p.assetClass)?.ch||'Ch.4'}: FE = ({fmtPct(p.attrFactor)}) \u00d7 {fmt(p.totalEmissions)} = {fmt(p.financedEmissions)} tCO2e | Carbon cost: ${(p.financedEmissions*carbonPrice/1e6).toFixed(3)}M @ ${carbonPrice}/t | Source: {p.source}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
      <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Showing {filtered.length} of {positions.length} positions | Scope: {scopeView} | Filtered FE: {fmt(filtered.reduce((s,p)=>s+p.financedEmissions,0))} tCO2e</div>
      <div style={{fontSize:10,color:T.textMut}}>Total exposure: ${fmt(totalOut)}M | Positions with EVIC warning: {positions.filter(p=>p.evicWarning).length}</div>
    </div>
    {showAdd&&<AddPositionModal onAdd={p=>setPositions(prev=>[p,...prev])} onClose={()=>setShowAdd(false)}/>}
  </div>);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB 2: PART B — INSURANCE-ASSOCIATED EMISSIONS (Chapter 5)
   8 Lines of Business with full methodology
   ═══════════════════════════════════════════════════════════════════════════════ */
function PartBTab(){
  const[lobData,setLobData]=useState(INSURANCE_LOB);
  const[editId,setEditId]=useState(null);
  const[editForm,setEditForm]=useState({});
  const[showDetails,setShowDetails]=useState(null);

  const totalPremium=useMemo(()=>lobData.reduce((s,l)=>s+l.premiumM,0),[lobData]);
  const totalFE=useMemo(()=>lobData.reduce((s,l)=>s+Math.round(l.premiumM*l.efPerPremium),0),[lobData]);
  const totalClaims=useMemo(()=>lobData.reduce((s,l)=>s+l.claimsM,0),[lobData]);
  const totalExposure=useMemo(()=>lobData.reduce((s,l)=>s+l.exposureM,0),[lobData]);
  const avgDqs=useMemo(()=>(lobData.reduce((s,l)=>s+l.dqs,0)/lobData.length).toFixed(1),[lobData]);
  const lobFE=useMemo(()=>lobData.map(l=>({lob:l.lob,fe:Math.round(l.premiumM*l.efPerPremium),premium:l.premiumM,intensity:(l.efPerPremium).toFixed(2)})),[lobData]);
  const lossRatio=useMemo(()=>(totalClaims/totalPremium*100).toFixed(1),[totalClaims,totalPremium]);

  function startLobEdit(l){setEditId(l.id);setEditForm({premiumM:l.premiumM,claimsM:l.claimsM,exposureM:l.exposureM,efPerPremium:l.efPerPremium,dqs:l.dqs});}
  function applyLobEdit(id){setLobData(prev=>prev.map(l=>l.id===id?{...l,premiumM:+editForm.premiumM,claimsM:+editForm.claimsM,exposureM:+editForm.exposureM,efPerPremium:+editForm.efPerPremium,dqs:+editForm.dqs}:l));setEditId(null);}

  return(<div>
    <SectionHeader title="Part B: Insurance-Associated Emissions" citation="PCAF Standard v2, Chapter 5" description={`8 lines of business. Formula: FE = Gross Written Premium x Sector Emission Factor per Premium unit. Attribution based on premium volume (not claims). Total GWP: $${fmt(totalPremium)}M across ${lobData.length} LOBs.`}/>
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
      <KPICard label="Total GWP" value={'$'+fmt(totalPremium)+'M'} sub="Gross written premium" color={T.navy}/>
      <KPICard label="Insurance FE" value={fmt(totalFE)+' tCO2e'} sub="All 8 LOBs" color={T.red}/>
      <KPICard label="Total Exposure" value={'$'+fmt(totalExposure)+'M'} sub="Sum insured" color={T.gold}/>
      <KPICard label="Loss Ratio" value={lossRatio+'%'} sub="Claims / Premium" color={+lossRatio>70?T.red:T.green}/>
      <KPICard label="Avg DQS" value={avgDqs} sub="LOB weighted" color={DQS_COLOR[Math.round(+avgDqs)]||T.amber}/>
      <KPICard label="Avg Intensity" value={(totalFE/totalPremium).toFixed(3)} sub="tCO2e per $M GWP" color={T.sage}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
      <Card title="FE by Line of Business" citation="Ch.5, Table 5.2-5.3">
        <ResponsiveContainer width="100%" height={250}><BarChart data={lobFE}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="lob" tick={{fontSize:9,fill:T.textSec}}/><YAxis tick={{fontSize:9,fill:T.textSec}} tickFormatter={v=>fmt(v)}/><Tooltip {...tip}/><Bar dataKey="fe" name="FE tCO2e" radius={[4,4,0,0]}>{lobFE.map((d,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}</Bar></BarChart></ResponsiveContainer>
      </Card>
      <Card title="Premium vs Claims by LOB">
        <ResponsiveContainer width="100%" height={250}><BarChart data={lobData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="lob" tick={{fontSize:9,fill:T.textSec}}/><YAxis tick={{fontSize:9,fill:T.textSec}}/><Tooltip {...tip}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="premiumM" name="Premium $M" fill={T.navy}/><Bar dataKey="claimsM" name="Claims $M" fill={T.gold}/></BarChart></ResponsiveContainer>
      </Card>
    </div>

    {/* LOB Detail Table */}
    <div style={{overflowX:'auto',borderRadius:8,border:`1px solid ${T.border}`}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,fontFamily:T.font}}>
        <thead style={{background:T.bg}}><tr>
          {['LOB','Sub-LOB','Premium $M','Claims $M','Exposure $M','EF (tCO2e/$M)','Financed Em.','DQS','Actions'].map(h=><th key={h} style={{padding:'7px 8px',textAlign:'left',fontSize:10,fontWeight:700,color:T.textSec,borderBottom:`1px solid ${T.border}`,fontFamily:T.mono}}>{h}</th>)}
        </tr></thead>
        <tbody>{lobData.map((l,ri)=>(
          <React.Fragment key={l.id}>
            <tr style={{background:ri%2===0?T.surface:T.bg,borderBottom:`1px solid ${T.border}`}}>
              <td style={{padding:'6px 8px',fontWeight:600,color:T.navy}}>{l.lob}</td>
              <td style={{padding:'6px 8px',fontSize:10,color:T.textSec}}>{l.subLob}</td>
              <td style={{padding:'6px 8px',textAlign:'right'}}>{editId===l.id?<input type="number" value={editForm.premiumM} onChange={e=>setEditForm(f=>({...f,premiumM:e.target.value}))} style={{width:80,padding:'3px 6px',border:`1px solid ${T.border}`,borderRadius:3,fontSize:11}}/>:fmtNum(l.premiumM)}</td>
              <td style={{padding:'6px 8px',textAlign:'right'}}>{editId===l.id?<input type="number" value={editForm.claimsM} onChange={e=>setEditForm(f=>({...f,claimsM:e.target.value}))} style={{width:80,padding:'3px 6px',border:`1px solid ${T.border}`,borderRadius:3,fontSize:11}}/>:fmtNum(l.claimsM)}</td>
              <td style={{padding:'6px 8px',textAlign:'right'}}>{fmtNum(l.exposureM)}</td>
              <td style={{padding:'6px 8px',textAlign:'right',fontFamily:T.mono}}>{editId===l.id?<input type="number" step="0.01" value={editForm.efPerPremium} onChange={e=>setEditForm(f=>({...f,efPerPremium:e.target.value}))} style={{width:60,padding:'3px 6px',border:`1px solid ${T.border}`,borderRadius:3,fontSize:11}}/>:l.efPerPremium.toFixed(2)}</td>
              <td style={{padding:'6px 8px',textAlign:'right',fontWeight:600,color:l.premiumM*l.efPerPremium>500000?T.red:T.text}}>{fmt(Math.round(l.premiumM*l.efPerPremium))}</td>
              <td style={{padding:'6px 8px',textAlign:'center'}}><span style={{fontWeight:700,color:DQS_COLOR[l.dqs]}}>{l.dqs}</span></td>
              <td style={{padding:'6px 8px',display:'flex',gap:4}}>
                {editId===l.id?<button onClick={()=>applyLobEdit(l.id)} style={{padding:'2px 8px',border:'none',borderRadius:3,background:T.sage,color:'#fff',fontSize:10,cursor:'pointer'}}>Save</button>:<button onClick={()=>startLobEdit(l)} style={{padding:'2px 8px',border:`1px solid ${T.border}`,borderRadius:3,fontSize:10,cursor:'pointer'}}>Edit</button>}
                <button onClick={()=>setShowDetails(showDetails===l.id?null:l.id)} style={{padding:'2px 8px',border:`1px solid ${T.border}`,borderRadius:3,fontSize:10,cursor:'pointer'}}>{showDetails===l.id?'\u2013':'+'}</button>
              </td>
            </tr>
            {showDetails===l.id&&<tr style={{background:'#f8fafc'}}><td colSpan={9} style={{padding:'10px 16px',fontSize:11,lineHeight:1.6}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><strong style={{color:T.navy}}>Methodology:</strong><br/>{l.methodology}</div>
                <div><strong style={{color:T.navy}}>Risk Factors:</strong><br/>{l.riskFactors}</div>
              </div>
              <div style={{marginTop:8,padding:8,background:T.bg,borderRadius:4,fontFamily:T.mono,fontSize:10}}>
                Calculation: FE = ${fmtNum(l.premiumM)}M \u00d7 {l.efPerPremium} tCO2e/$M = {fmt(Math.round(l.premiumM*l.efPerPremium))} tCO2e | Source: {l.efSource}
              </div>
            </td></tr>}
          </React.Fragment>
        ))}</tbody>
      </table>
    </div>
    <InfoBox type="info"><strong>PCAF v2 Ch.5 \u00a75.1:</strong> Insurance-associated emissions are attributed proportionally to gross written premium. This methodology captures the insurer&apos;s role in enabling economic activities that generate emissions. For investment-side emissions, see Part A (financed emissions).</InfoBox>
  </div>);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TAB 3: PART C — FACILITATED EMISSIONS (Chapter 6)
   7 Deal Types with full attribution
   ═══════════════════════════════════════════════════════════════════════════════ */
function PartCTab(){
  const[deals,setDeals]=useState(FACILITATED_DEALS);
  const[showForm,setShowForm]=useState(false);
  const[expandedDeal,setExpandedDeal]=useState(null);
  const[newDeal,setNewDeal]=useState({type:'Bond Underwriting',client:'',sector:'',dealSizeM:'',underwrittenM:'',clientScope1:'',clientScope2:'',dqs:'3'});

  const dealData=useMemo(()=>deals.map(d=>{const attr=d.underwrittenM>0?d.underwrittenM/d.dealSizeM:(d.type==='Advisory M&A'?0.10:0);const clientEM=(d.clientScope1||0)+(d.clientScope2||0);return{...d,attrFactor:attr,clientEM,facilitatedEm:Math.round(attr*clientEM),facilitatedScope3:Math.round(attr*(d.clientScope3||0))};}),[deals]);
  const totalFac=useMemo(()=>dealData.reduce((s,d)=>s+d.facilitatedEm,0),[dealData]);
  const totalDeals=useMemo(()=>deals.reduce((s,d)=>s+d.dealSizeM,0),[deals]);
  const totalUW=useMemo(()=>deals.reduce((s,d)=>s+d.underwrittenM,0),[deals]);

  function addDeal(){
    if(!newDeal.client||!newDeal.dealSizeM)return;
    const d={...newDeal,id:Date.now(),dealSizeM:+newDeal.dealSizeM,underwrittenM:+(newDeal.underwrittenM||0),clientScope1:+(newDeal.clientScope1||0),clientScope2:+(newDeal.clientScope2||0),clientScope3:0,dqs:+newDeal.dqs,attrFormula:'Underwritten / Deal Size',citation:'PCAF v2, Ch.6',year:2024,bookRunner:'TBD',peerGroup:'TBD'};
    setDeals(prev=>[d,...prev]);setShowForm(false);
  }

  return(<div>
    <SectionHeader title="Part C: Facilitated Emissions" citation="PCAF Standard v2, Chapter 6" description={`7 deal types across ${deals.length} transactions. Attribution = Underwritten Amount / Deal Size. Capital markets facilitation captures the bank's role in enabling client financing that generates emissions.`}/>
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
      <KPICard label="Total Facilitated Em." value={fmt(totalFac)+' tCO2e'} sub={`${deals.length} transactions`} color={T.navy}/>
      <KPICard label="Deal Volume" value={'$'+fmt(totalDeals)+'M'} sub="Total deal size" color={T.gold}/>
      <KPICard label="Underwritten" value={'$'+fmt(totalUW)+'M'} sub="Bank committed" color={T.sage}/>
      <KPICard label="Avg Attribution" value={totalDeals>0?fmtPct(totalUW/totalDeals):'\u2014'} sub="UW / Deal" color={T.navyL}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
      <Card title="Facilitated Em. by Deal Type" citation="\u00a76.1">
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
            <td style={{padding:'5px 8px',textAlign:'right'}}>{fmtPct(d.attrFactor)}</td>
            <td style={{padding:'5px 8px',textAlign:'right',fontFamily:T.mono,fontSize:10}}>{fmt(d.clientEM)}</td>
            <td style={{padding:'5px 8px',textAlign:'right',fontWeight:600,color:d.facilitatedEm>5e6?T.red:T.text}}>{fmt(d.facilitatedEm)}</td>
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
  const currentAvg=(positions.reduce((s,p)=>s+p.dqs,0)/positions.length).toFixed(2);
  const simulatedAvg=useMemo(()=>{let t=0;positions.forEach(p=>{t+=Math.min(p.dqs,targetDqs[p.assetClass]||p.dqs);});return(t/positions.length).toFixed(2);},[positions,targetDqs]);
  const improved=Object.values(actionStatus).filter(v=>v==='complete').length;
  const dqsByAC=useMemo(()=>{const m={};positions.forEach(p=>{if(!m[p.assetClass])m[p.assetClass]={ac:p.assetClass,avg:0,n:0,t:0};m[p.assetClass].t+=p.dqs;m[p.assetClass].n++;});Object.values(m).forEach(v=>v.avg=+(v.t/v.n).toFixed(1));return Object.values(m).sort((a,b)=>b.avg-a.avg);},[positions]);
  const coverageByScope=useMemo(()=>[{scope:'Scope 1',pct:Math.round(positions.filter(p=>p.scope1>0).length/positions.length*100)},{scope:'Scope 2',pct:Math.round(positions.filter(p=>p.scope2>0).length/positions.length*100)},{scope:'Scope 3',pct:Math.round(positions.filter(p=>p.scope3>0).length/positions.length*100)}],[positions]);

  function markAction(id,st){setActionStatus(prev=>({...prev,[id]:st}));if(st==='complete')setPositions(prev=>prev.map(p=>p.id===id?computeRow({...p,dqs:Math.max(1,p.dqs-1)}):p));}

  return(<div>
    <SectionHeader title="Data Quality Assessment" citation="PCAF Standard v2, Chapter 3" description="DQS 1-5 scoring per holding. Improvement wizard with actionable steps. Coverage analysis by scope. 12-quarter quality trend."/>
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
      <Card title="12-Quarter DQS Trend" citation="Ch.3, \u00a73.4"><ResponsiveContainer width="100%" height={200}><LineChart data={QUARTERLY_DQS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="q" tick={{fontSize:8,fill:T.textSec}}/><YAxis domain={[1,5]} tick={{fontSize:9}}/><Tooltip {...tip}/><Line type="monotone" dataKey="avg" stroke={T.navy} strokeWidth={2} name="Avg DQS"/></LineChart></ResponsiveContainer></Card>
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
    <SectionHeader title="Reference Data & Methodology" citation="PCAF Standard v2"/>
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
    {sec==='ac'&&<Card title="Asset Class Definitions" citation="Ch.4"><div style={{display:'grid',gap:10}}>{ASSET_CLASS_DEFS.map(d=><div key={d.ac} style={{padding:10,background:T.bg,borderRadius:6,border:`1px solid ${T.border}`}}>
      <div style={{display:'flex',gap:8,alignItems:'baseline',marginBottom:4}}><strong style={{color:T.navy}}>{d.ac}</strong><span style={{fontSize:9,fontFamily:T.mono,color:T.gold}}>Ch. {d.ch}</span></div>
      <div style={{fontFamily:T.mono,fontSize:11,background:T.surface,padding:'3px 6px',borderRadius:3,marginBottom:4}}>{d.formula}</div>
      <div style={{fontSize:10,color:T.textSec}}>Denominator: {d.denom} | DQS: {d.dqsRange}</div>
      <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{d.note}</div>
      <div style={{fontSize:10,color:T.textSec,marginTop:2}}>Scope guidance: {d.scopeGuidance}</div>
    </div>)}</div></Card>}
    {sec==='dqs'&&<Card title="DQS Definitions" citation="Ch.3"><div style={{display:'grid',gap:8}}>{DQS_DEFINITIONS.map(d=><div key={d.score} style={{display:'flex',gap:10,padding:10,background:T.bg,borderRadius:6,border:`1px solid ${T.border}`}}>
      <div style={{width:36,height:36,borderRadius:18,background:DQS_COLOR[d.score],display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:15,flexShrink:0}}>{d.score}</div>
      <div><div style={{fontWeight:700,color:T.navy}}>{d.label}</div><div style={{fontSize:11,color:T.textSec}}>{d.description}</div><div style={{fontSize:10,color:T.textMut,marginTop:2}}>{d.method} | Uncertainty: {d.uncertainty} | Weight: {d.weight}</div></div>
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
  const result=useMemo(()=>{const o=+calc.outstanding,e=+calc.evic,em=+calc.emissions;if(!o||!e||!em)return null;const attr=Math.min(1.0,o/e);const fe=attr*em;return{attr,fe,ci:fe/o};},[calc]);

  return(<div>
    <SectionHeader title="PCAF Formula Engine" citation="Chapters 3-6" description="All PCAF formulas with section citations, worked examples, edge case handling."/>
    <Card title="Interactive Calculator" citation="\u00a74.2" style={{marginBottom:16}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
        <div><label style={{fontSize:10,color:T.textSec}}>Outstanding ($M)</label><input type="number" value={calc.outstanding} onChange={e=>setCalc(f=>({...f,outstanding:e.target.value}))} style={{width:'100%',padding:'6px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:12}}/></div>
        <div><label style={{fontSize:10,color:T.textSec}}>EVIC ($Bn)</label><input type="number" value={calc.evic} onChange={e=>setCalc(f=>({...f,evic:e.target.value}))} style={{width:'100%',padding:'6px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:12}}/></div>
        <div><label style={{fontSize:10,color:T.textSec}}>Scope 1+2 (tCO2e)</label><input type="number" value={calc.emissions} onChange={e=>setCalc(f=>({...f,emissions:e.target.value}))} style={{width:'100%',padding:'6px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:12}}/></div>
      </div>
      {result&&<div style={{marginTop:10,padding:10,background:T.bg,borderRadius:6,fontFamily:T.mono,fontSize:11}}>
        Attribution = ${calc.outstanding}M / ${calc.evic}Bn = <strong>{fmtPct(result.attr)}</strong> | FE = {fmtPct(result.attr)} \u00d7 {fmt(+calc.emissions)} = <strong style={{color:T.navy}}>{fmt(result.fe)} tCO2e</strong> | Intensity = {result.ci.toFixed(1)} tCO2e/$M
      </div>}
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
  const totalFE=useMemo(()=>positions.reduce((s,p)=>s+p.financedEmissions,0),[positions]);
  const totalOut=useMemo(()=>positions.reduce((s,p)=>s+p.outstanding,0),[positions]);
  const aumBn=totalOut/1000;
  const[exportFmt,setExportFmt]=useState('json');

  const downstream=useMemo(()=>{
    const waci=totalOut>0?positions.reduce((s,p)=>s+p.outstanding*p.waci,0)/totalOut:0;
    const avgDqs=(positions.reduce((s,p)=>s+p.dqs,0)/positions.length).toFixed(1);
    return DOWNSTREAM_MODULES.map(m=>{
      let v='\u2014';
      if(m.field==='totalFinancedEmissions')v=fmt(totalFE)+' tCO2e';
      else if(m.field==='carbonFootprint')v=aumBn>0?(totalFE/aumBn).toFixed(0)+' tCO2e/\u20acM':'\u2014';
      else if(m.field==='waciIntensity')v=waci.toFixed(1)+' tCO2e/\u20acM';
      else if(m.field==='impliedTemperatureRise')v=(1.5+sr(42)*1.5).toFixed(1)+'\u00b0C';
      else if(m.field==='climateValueAtRisk')v=(sr(43)*8+2).toFixed(1)+'% NAV';
      else if(m.field==='esrsE1Emissions')v=fmt(totalFE);
      else if(m.field==='ebaPillar3')v=fmt(totalFE)+' | DQS '+avgDqs;
      else if(m.field==='tcfdMetrics')v='FE + WACI + DQS';
      return{...m,value:v};
    });
  },[positions,totalFE,totalOut,aumBn]);

  const doExport=useCallback(()=>{
    const payload={timestamp:new Date().toISOString(),portfolio:{totalFE:totalFE,totalExposure:totalOut,count:positions.length,avgDqs:+(positions.reduce((s,p)=>s+p.dqs,0)/positions.length).toFixed(2)},modules:Object.fromEntries(downstream.map(m=>[m.field,{value:m.value,regulation:m.regulation}])),holdings:positions.map(p=>({name:p.name,ac:p.assetClass,fe:p.financedEmissions,dqs:p.dqs,attr:p.attrFactor}))};
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
          <div style={{fontSize:14,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{m.value}</div>
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
        {label:'Total Financed Emissions',value:fmt(trail.portfolio.totalFinancedEmissions)+' tCO2e',color:T.navy},
        {label:'Portfolio WACI',value:trail.portfolio.portfolioWaci.toFixed(3)+' tCO2e/$M',color:T.navy},
        {label:'Avg DQS',value:trail.portfolio.avgDqs,color:dqsColor(Math.round(trail.portfolio.avgDqs))},
        {label:'DQS Target Met',value:trail.portfolio.dqsMeetsTarget?'✓ Yes':'✗ No',color:trail.portfolio.dqsMeetsTarget?T.green:T.red},
        {label:'Flags',value:trail.portfolio.flagSummary.total,color:trail.portfolio.flagSummary.errors>0?T.red:T.amber},
      ].map((k,i)=>(
        <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:'10px 16px',minWidth:140}}>
          <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k.label}</div>
          <div style={{fontSize:16,fontWeight:700,color:k.color,marginTop:2}}>{k.value}</div>
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
              <span style={{fontFamily:T.mono,fontSize:11,color:T.navy,width:100}}>{pt.summary.financedEmissions.toFixed(1)} tCO2e</span>
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
                    {step.checks.map((c,ci)=><span key={ci} style={{fontSize:9,padding:'1px 6px',borderRadius:10,background:'rgba(91,138,106,0.1)',color:T.sage}}>✓ {c}</span>)}
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
   MAIN PAGE COMPONENT — 8 Tabs
   ═══════════════════════════════════════════════════════════════════════════════ */
const TABS=['Part A: Financed','Part B: Insurance','Part C: Facilitated','Data Quality','Reference Data','Formula Engine','Downstream','Audit Trail'];

export default function PcafFinancedEmissionsPage(){
  const[activeTab,setActiveTab]=useState(TABS[0]);
  const[positions,setPositions]=useState(INITIAL_POSITIONS);
  const ccData = useCarbonCredit(); const ccPcaf = ccData.adaptForPcaf();

  return(
    <div style={{padding:'24px 32px',fontFamily:T.font,background:T.bg,minHeight:'100vh'}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>PCAF Financed Emissions</h1>
        <p style={{fontSize:12,color:T.textSec,margin:'4px 0 0'}}>PCAF Standard v2 (3rd Edition) \u2014 Parts A, B, C | {positions.length} holdings | 12 asset classes | 10 formulas with \u00a7 citations</p>
      </div>
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab}/>
      {activeTab===TABS[0]&&<PartATab positions={positions} setPositions={setPositions}/>}
      {activeTab===TABS[1]&&<PartBTab/>}
      {activeTab===TABS[2]&&<PartCTab/>}
      {activeTab===TABS[3]&&<DataQualityTab positions={positions} setPositions={setPositions}/>}
      {activeTab===TABS[4]&&<ReferenceDataTab/>}
      {activeTab===TABS[5]&&<FormulaEngineTab/>}
      {activeTab===TABS[6]&&<DownstreamTab positions={positions}/>}
      {activeTab===TABS[7]&&<AuditTrailTab positions={positions}/>}
    </div>
  );
}
