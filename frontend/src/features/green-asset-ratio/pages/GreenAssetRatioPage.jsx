/**
 * EP-AJ3 -- Green Asset Ratio (GAR) -- EU Taxonomy Compliance & EBA Pillar 3 ESG
 * Sprint AJ - Financed Emissions & Climate Banking Analytics
 *
 * Regulatory basis:
 *   - EU Taxonomy Regulation (EU) 2020/852 Art. 3, 17, 18
 *   - CRR Article 449a -- mandatory Pillar 3 ESG disclosures for large CRR institutions
 *   - EBA ITS on Prudential Disclosures on ESG Risks (EBA/ITS/2022/01)
 *   - EU Taxonomy Climate Delegated Act (EU) 2021/2139
 *   - EU Taxonomy Environmental Delegated Act (EU) 2023/2486
 *
 * 7 Tabs:
 *   1. GAR Calculator -- Numerator/Denominator per CRR, 80 loan positions
 *   2. BTAR -- Banking Book Taxonomy Alignment Ratio (Template 8)
 *   3. Taxonomy Eligibility -- NACE activity classifier, 6 objectives, TSC
 *   4. DNSH Assessment -- Do No Significant Harm per exposure (Art. 17)
 *   5. Minimum Safeguards -- OECD/UNGP/ILO screening (Art. 18)
 *   6. EBA Pillar 3 Templates -- Templates 1, 2, 4, 7, 8
 *   7. Downstream & Export -- Feeds, export, compliance checklist
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, LineChart, Line, Legend, CartesianGrid, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Treemap,
} from 'recharts';
import { TAXONOMY_THRESHOLDS, REGULATORY_THRESHOLDS, SECTOR_BENCHMARKS } from '../../../data/referenceData';
import { SECURITY_UNIVERSE, MOCK_PORTFOLIO } from '../../../data/securityUniverse';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const pick=(arr,seed)=>arr[Math.floor(sr(seed)*arr.length)];
const rng=(min,max,seed)=>+(min+sr(seed)*(max-min)).toFixed(2);
const rngInt=(min,max,seed)=>Math.floor(min+sr(seed)*(max-min+1));
const fmt=(v,d=1)=>typeof v==='number'?v.toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d}):'-';
const fmtM=(v)=>'EUR '+fmt(v,1)+'M';
const fmtPct=(v)=>fmt(v,2)+'%';
const fmtBps=(v)=>(v*100).toFixed(0)+' bps';

// =========================================================================
// STATIC DATA -- 80 Loan Positions for GAR calculation
// =========================================================================

const NACE_ACTIVITIES = [
  {code:'D35.11',desc:'Production of electricity',tsc:'CCM 4.1',eligible:true,sector:'Power Generation'},
  {code:'D35.12',desc:'Transmission of electricity',tsc:'CCM 4.9',eligible:true,sector:'Power Grid'},
  {code:'D35.13',desc:'Distribution of electricity',tsc:'CCM 4.9',eligible:true,sector:'Power Grid'},
  {code:'D35.30',desc:'Steam and air conditioning supply',tsc:'CCM 4.15',eligible:true,sector:'District Heating'},
  {code:'F41.10',desc:'Development of building projects',tsc:'CCM 7.1',eligible:true,sector:'Construction'},
  {code:'F41.20',desc:'Construction of residential buildings',tsc:'CCM 7.1',eligible:true,sector:'Construction'},
  {code:'F42.11',desc:'Construction of roads and railways',tsc:'CCM 6.14',eligible:true,sector:'Infrastructure'},
  {code:'F43.21',desc:'Electrical installation',tsc:'CCM 7.3',eligible:true,sector:'Building Renovation'},
  {code:'C24.10',desc:'Manufacture of basic iron and steel',tsc:'CCM 3.9',eligible:true,sector:'Heavy Industry'},
  {code:'C24.42',desc:'Aluminium production',tsc:'CCM 3.8',eligible:true,sector:'Heavy Industry'},
  {code:'C23.51',desc:'Manufacture of cement',tsc:'CCM 3.7',eligible:true,sector:'Heavy Industry'},
  {code:'C29.10',desc:'Manufacture of motor vehicles',tsc:'CCM 3.3',eligible:true,sector:'Automotive'},
  {code:'C20.11',desc:'Manufacture of industrial gases',tsc:'CCM 3.10',eligible:true,sector:'Chemicals'},
  {code:'C20.13',desc:'Manufacture of other inorganic chemicals',tsc:'CCM 3.13',eligible:false,sector:'Chemicals'},
  {code:'H49.10',desc:'Passenger rail transport',tsc:'CCM 6.1',eligible:true,sector:'Transport'},
  {code:'H49.20',desc:'Freight rail transport',tsc:'CCM 6.2',eligible:true,sector:'Transport'},
  {code:'H49.31',desc:'Urban and suburban passenger land transport',tsc:'CCM 6.3',eligible:true,sector:'Transport'},
  {code:'H50.10',desc:'Sea and coastal passenger water transport',tsc:'CCM 6.7',eligible:true,sector:'Transport'},
  {code:'L68.10',desc:'Buying and selling of own real estate',tsc:'CCM 7.7',eligible:true,sector:'Real Estate'},
  {code:'L68.20',desc:'Renting and operating of own real estate',tsc:'CCM 7.7',eligible:true,sector:'Real Estate'},
  {code:'J62.01',desc:'Computer programming activities',tsc:'CCM 8.1',eligible:true,sector:'ICT'},
  {code:'J63.11',desc:'Data processing hosting',tsc:'CCM 8.1',eligible:true,sector:'ICT'},
  {code:'M71.12',desc:'Engineering activities',tsc:'CCM 9.1',eligible:true,sector:'Professional Services'},
  {code:'M72.11',desc:'Research: natural sciences',tsc:'CCM 9.1',eligible:true,sector:'R&D'},
  {code:'K64.19',desc:'Other monetary intermediation',tsc:null,eligible:false,sector:'Financial'},
  {code:'K65.11',desc:'Life insurance',tsc:null,eligible:false,sector:'Insurance'},
  {code:'K66.12',desc:'Security and commodity exchange',tsc:null,eligible:false,sector:'Financial'},
  {code:'B06.10',desc:'Extraction of crude petroleum',tsc:null,eligible:false,sector:'Fossil Fuels'},
  {code:'B06.20',desc:'Extraction of natural gas',tsc:null,eligible:false,sector:'Fossil Fuels'},
  {code:'G47.11',desc:'Retail sale in non-specialized stores',tsc:null,eligible:false,sector:'Retail'},
];

const BORROWER_NAMES = [
  'Vestas Wind Systems','Iberdrola SA','RWE Renewables','Oersted A/S','EDF Renewables',
  'Siemens Energy AG','Nexans SA','Schneider Electric','Alstom SA','Bombardier Transport',
  'Skanska AB','Vinci Energies','ENGIE SA','TotalEnergies SE','BP Alternative Energy',
  'Shell New Energies','Vattenfall AB','Enel Green Power','BayWa r.e. AG','Encavis AG',
  'Neoen SA','Voltalia SA','Boralex Inc','Greenalia SA','ABO Wind AG',
  'ThyssenKrupp Green Steel','ArcelorMittal XCarb','SSAB Fossil-Free','H2 Green Steel','Salzgitter AG',
  'BMW Group EV Division','Volkswagen ID','Daimler Truck Holding','Traton SE','Iveco Group NV',
  'Air Liquide Hydrogen','Linde plc','Air Products & Chemicals','Nel Hydrogen ASA','McPhy Energy SA',
  'Orion Energy Systems','Sunrun Inc','SolarEdge Technologies','Enphase Energy Inc','First Solar Inc',
  'Brookfield Renewable Partners','Pattern Energy Group','Avangrid Inc','Aecon Group Inc','Acciona Energia',
  'Implenia AG','Bouygues Construction','Strabag SE','Porr AG','HOCHTIEF AG',
  'Castellum AB','Fabege AB','Catella Real Estate','Patrizia SE','Aroundtown SA',
  'Deutsche Bahn AG','SNCF Group','Trenitalia SpA','SBB Cargo AG','FlixMobility GmbH',
  'Northvolt AB','CATL Europe','Samsung SDI','LG Energy Solution','Panasonic Energy Co',
  'Terna SpA','TenneT Holding BV','National Grid plc','Red Electrica Corp','Elia Group SA',
  'Verbund AG','Fortum Oyj','Statkraft AS','SSE plc','Drax Group plc',
];

const COUNTRIES_EU = ['DE','FR','NL','SE','DK','NO','IT','ES','FI','AT','BE','PL','PT','IE','CZ','GR','LU'];

const ENV_OBJECTIVES = [
  {code:'CCM',label:'Climate Change Mitigation',color:'#16a34a'},
  {code:'CCA',label:'Climate Change Adaptation',color:'#0ea5e9'},
  {code:'WTR',label:'Sustainable Use of Water',color:'#38bdf8'},
  {code:'CE',label:'Circular Economy',color:'#a78bfa'},
  {code:'PPC',label:'Pollution Prevention & Control',color:'#f59e0b'},
  {code:'BIO',label:'Protection of Biodiversity & Ecosystems',color:'#ef4444'},
];

// Build 80 loan positions deterministically
const buildLoanPositions = () => {
  const positions = [];
  for (let i = 0; i < 80; i++) {
    const actIdx = rngInt(0, NACE_ACTIVITIES.length - 1, i * 13 + 7);
    const act = NACE_ACTIVITIES[actIdx];
    const name = BORROWER_NAMES[i % BORROWER_NAMES.length];
    const country = pick(COUNTRIES_EU, i * 3 + 11);
    const exposure = rng(5, 850, i * 7 + 3);
    const eligible = act.eligible;
    const dnshPass = eligible ? sr(i * 17 + 5) > 0.2 : false;
    const minSafeguardsPass = eligible ? sr(i * 19 + 9) > 0.15 : false;
    const alignedCCM = eligible && dnshPass && minSafeguardsPass && act.tsc && act.tsc.startsWith('CCM') ? sr(i * 23 + 1) > 0.25 : false;
    const alignedCCA = eligible && dnshPass && minSafeguardsPass && sr(i * 29 + 3) > 0.85 ? true : false;
    const alignedWTR = eligible && dnshPass && minSafeguardsPass && sr(i * 31 + 5) > 0.92 ? true : false;
    const alignedCE = eligible && dnshPass && minSafeguardsPass && sr(i * 37 + 7) > 0.93 ? true : false;
    const alignedPPC = eligible && dnshPass && minSafeguardsPass && sr(i * 41 + 9) > 0.95 ? true : false;
    const alignedBIO = eligible && dnshPass && minSafeguardsPass && sr(i * 43 + 11) > 0.96 ? true : false;
    const aligned = alignedCCM || alignedCCA || alignedWTR || alignedCE || alignedPPC || alignedBIO;
    const turnoverAlignPct = aligned ? rng(15, 98, i * 47 + 13) : 0;
    const capexAlignPct = aligned ? rng(20, 99, i * 53 + 17) : 0;
    const opexAlignPct = aligned ? rng(10, 95, i * 59 + 19) : 0;
    const maturityYears = rngInt(1, 15, i * 61 + 23);
    const interestRate = rng(1.5, 6.5, i * 67 + 29);
    const lgd = rng(25, 65, i * 71 + 31);
    const pd = rng(0.05, 8.5, i * 73 + 37);
    const epcRating = pick(['A','A+','B','C','D','E','F','G','N/A'], i * 79 + 41);
    const scope1 = rng(500, 250000, i * 83 + 43);
    const scope2 = rng(100, 80000, i * 89 + 47);
    positions.push({
      id: i + 1,
      borrower: name,
      country,
      naceCode: act.code,
      naceDesc: act.desc,
      tscRef: act.tsc || 'N/A',
      sector: act.sector,
      exposureEurM: exposure,
      eligible,
      alignedCCM, alignedCCA, alignedWTR, alignedCE, alignedPPC, alignedBIO,
      aligned,
      dnshPass,
      minSafeguardsPass,
      turnoverAlignPct,
      capexAlignPct,
      opexAlignPct,
      maturityYears,
      interestRate,
      lgd,
      pd,
      epcRating,
      scope1tCO2e: scope1,
      scope2tCO2e: scope2,
      assetClass: pick(['Loans','Debt Securities','Equity','Mortgages','Project Finance'], i * 97 + 51),
      counterpartyType: pick(['Non-Financial Corporate','Financial Corporate','Sovereign','SME','Household'], i * 101 + 53),
    });
  }
  return positions;
};

const LOAN_POSITIONS = buildLoanPositions();

// GAR historical data by year
const GAR_HISTORY = [
  {year:'2022',turnoverGAR:4.8,capexGAR:6.2,opexGAR:3.9,eligiblePct:28.5,alignedPct:4.8,coveredAssetsEurBn:108.3},
  {year:'2023',turnoverGAR:5.1,capexGAR:7.0,opexGAR:4.3,eligiblePct:31.2,alignedPct:5.1,coveredAssetsEurBn:113.7},
  {year:'2024',turnoverGAR:7.3,capexGAR:9.8,opexGAR:5.6,eligiblePct:35.8,alignedPct:7.3,coveredAssetsEurBn:115.1},
  {year:'2025E',turnoverGAR:12.0,capexGAR:15.5,opexGAR:9.2,eligiblePct:42.0,alignedPct:12.0,coveredAssetsEurBn:118.3},
  {year:'2030T',turnoverGAR:22.0,capexGAR:28.0,opexGAR:18.5,eligiblePct:58.0,alignedPct:22.0,coveredAssetsEurBn:125.0},
];

// BTAR additional data
const BTAR_ASSET_CLASSES = [
  {assetClass:'Loans to NFC',exposure:62400,eligible:28500,aligned:8200,coveredByCRR:true},
  {assetClass:'Mortgages (Residential)',exposure:35200,eligible:35200,aligned:4800,coveredByCRR:true},
  {assetClass:'Mortgages (Commercial)',exposure:12800,eligible:12800,aligned:2100,coveredByCRR:true},
  {assetClass:'Debt Securities (NFC)',exposure:8600,eligible:3200,aligned:1050,coveredByCRR:true},
  {assetClass:'Equity Holdings (NFC)',exposure:4200,eligible:1800,aligned:680,coveredByCRR:true},
  {assetClass:'Sovereign Exposures',exposure:28500,eligible:0,aligned:0,coveredByCRR:true},
  {assetClass:'Interbank Exposures',exposure:15600,eligible:0,aligned:0,coveredByCRR:true},
  {assetClass:'Derivatives (Trading)',exposure:9800,eligible:0,aligned:0,coveredByCRR:true},
  {assetClass:'Central Bank Exposures',exposure:22000,eligible:0,aligned:0,coveredByCRR:true},
  {assetClass:'Other Assets',exposure:5300,eligible:800,aligned:180,coveredByCRR:true},
];

// Peer comparison
const PEER_BANKS = [
  {name:'Deutsche Bank',gar:7.1,btar:3.8,eligible:34.2,totalAssets:1320},
  {name:'BNP Paribas',gar:8.9,btar:4.5,eligible:38.5,totalAssets:2490},
  {name:'ING Group',gar:11.2,btar:5.8,eligible:42.1,totalAssets:980},
  {name:'Nordea',gar:9.8,btar:5.1,eligible:40.3,totalAssets:620},
  {name:'Societe Generale',gar:6.5,btar:3.4,eligible:31.8,totalAssets:1480},
  {name:'UniCredit',gar:7.8,btar:4.0,eligible:35.6,totalAssets:860},
  {name:'Rabobank',gar:10.5,btar:5.5,eligible:41.0,totalAssets:640},
  {name:'Our Institution',gar:7.3,btar:3.9,eligible:35.8,totalAssets:208.6},
];

// DNSH Assessment Matrix
const DNSH_CRITERIA = [
  {objective:'CCM',label:'Climate Change Mitigation',criteria:'Activity does not lead to increased GHG emissions (lock-in of carbon-intensive processes)',assessmentItems:['GHG lifecycle assessment','No fossil fuel lock-in','Technology neutrality check','Scope 1+2 threshold compliance']},
  {objective:'CCA',label:'Climate Change Adaptation',criteria:'Physical climate risk assessment per Appendix A hazards (acute & chronic)',assessmentItems:['Climate risk & vulnerability assessment','Adaptation plan for material risks','RCP 4.5 and 8.5 scenario analysis','Time horizons: 10-30 years']},
  {objective:'WTR',label:'Water & Marine Resources',criteria:'Compliance with Water Framework Directive 2000/60/EC',assessmentItems:['Environmental Impact Assessment','Water use efficiency metrics','No degradation of water body status','Pollution prevention measures']},
  {objective:'CE',label:'Circular Economy',criteria:'Design for durability, recyclability, reuse; waste hierarchy compliance',assessmentItems:['Waste management plan (70% non-hazardous reuse)','Extended producer responsibility','Recyclability assessment','Hazardous substance restrictions']},
  {objective:'PPC',label:'Pollution Prevention',criteria:'BAT-AEL compliance; REACH/RoHS/POPs conformity',assessmentItems:['BAT Reference Document compliance','REACH registration/authorization','Air/water emission limits','Soil contamination prevention']},
  {objective:'BIO',label:'Biodiversity & Ecosystems',criteria:'Environmental Impact Assessment; no conversion of high-biodiversity land',assessmentItems:['EIA per Directive 2011/92/EU','No operations in Natura 2000 sites (without mitigation)','No net deforestation','Soil sealing minimization']},
];

// Minimum Safeguards framework
const MIN_SAFEGUARDS_FRAMEWORK = [
  {framework:'OECD Guidelines for MNEs',articles:['Chapter II: General Policies','Chapter IV: Human Rights','Chapter V: Employment','Chapter VI: Environment'],checks:['Due diligence policy adopted','Stakeholder engagement process','Grievance mechanism established','Regular review & reporting']},
  {framework:'UN Guiding Principles on Business and Human Rights',articles:['Principle 11: Respect human rights','Principle 13: Avoid causing/contributing to adverse impacts','Principle 15: Due diligence policies','Principle 22: Remediation'],checks:['Human rights policy statement','HRDD process implemented','Tracking implementation','Remediation mechanism']},
  {framework:'ILO Declaration on Fundamental Principles',articles:['Freedom of association','Elimination of forced labour','Abolition of child labour','Elimination of discrimination'],checks:['No forced/child labour in operations or supply chain','Freedom of association respected','Equal pay/non-discrimination policy','Living wage commitment']},
  {framework:'International Bill of Human Rights',articles:['UDHR Articles 1-30','ICCPR','ICESCR'],checks:['Privacy rights respected','Right to safe working conditions','Non-discrimination compliance','Community impact assessment']},
];

// EBA Pillar 3 Template definitions
const EBA_TEMPLATES = [
  {id:'T1',name:'Template 1: Scope 3 Financed Emissions',desc:'GHG emissions financed by the institution, per PCAF methodology',citation:'EBA ITS Table 1 — Scope 3 financed emissions by sector and asset class'},
  {id:'T2',name:'Template 2: Top-20 Carbon-Intensive Exposures',desc:'Largest 20 exposures to carbon-intensive counterparties (NACE B-H35)',citation:'EBA ITS Table 2 — Concentration of exposures to top-20 carbon-intensive firms'},
  {id:'T4',name:'Template 4: Banking Book Climate Risk',desc:'Exposures subject to transition and physical climate risk',citation:'EBA ITS Table 4 — Climate change transition risk: credit quality of exposures by sector'},
  {id:'T7',name:'Template 7: GAR (Green Asset Ratio)',desc:'Taxonomy-aligned assets / total covered assets per Art. 449a CRR',citation:'EBA ITS Table 7 — GAR for CRR institutions'},
  {id:'T8',name:'Template 8: BTAR (Banking Book Taxonomy Alignment)',desc:'Taxonomy alignment of ALL banking book exposures including sovereigns, derivatives',citation:'EBA ITS Table 8 — BTAR mandatory from FY2024'},
];

// Sector emission intensities for Template 1
const SECTOR_EMISSIONS_T1 = [
  {nace:'A',sector:'Agriculture, forestry and fishing',exposure:2800,finEmissions:45200,intensity:16.1,pcafScore:3.2},
  {nace:'B',sector:'Mining and quarrying',exposure:4200,finEmissions:128000,intensity:30.5,pcafScore:2.8},
  {nace:'C',sector:'Manufacturing',exposure:18500,finEmissions:285000,intensity:15.4,pcafScore:2.5},
  {nace:'D',sector:'Electricity, gas, steam',exposure:12400,finEmissions:198000,intensity:16.0,pcafScore:2.1},
  {nace:'E',sector:'Water supply; sewerage, waste',exposure:3100,finEmissions:22000,intensity:7.1,pcafScore:3.0},
  {nace:'F',sector:'Construction',exposure:8200,finEmissions:52000,intensity:6.3,pcafScore:3.5},
  {nace:'G',sector:'Wholesale and retail trade',exposure:6800,finEmissions:18500,intensity:2.7,pcafScore:3.8},
  {nace:'H',sector:'Transportation and storage',exposure:5600,finEmissions:86000,intensity:15.4,pcafScore:2.6},
  {nace:'I',sector:'Accommodation and food service',exposure:2200,finEmissions:8800,intensity:4.0,pcafScore:4.0},
  {nace:'J',sector:'Information and communication',exposure:4500,finEmissions:5200,intensity:1.2,pcafScore:3.5},
  {nace:'K',sector:'Financial and insurance',exposure:15600,finEmissions:12000,intensity:0.8,pcafScore:4.2},
  {nace:'L',sector:'Real estate activities',exposure:35200,finEmissions:42000,intensity:1.2,pcafScore:2.8},
  {nace:'M-U',sector:'Other services',exposure:8400,finEmissions:15000,intensity:1.8,pcafScore:4.0},
];

// Top-20 carbon intensive exposures for Template 2
const buildTop20CarbonIntensive = () => {
  const names = [
    'TotalEnergies SE','Shell plc','BP plc','Eni SpA','Equinor ASA',
    'RWE AG','Uniper SE','Enel SpA','EDF Group','ArcelorMittal SA',
    'ThyssenKrupp AG','HeidelbergCement AG','BASF SE','Air France-KLM','Lufthansa Group',
    'CMA CGM SA','Maersk A/S','Repsol SA','OMV AG','Holcim Ltd',
  ];
  return names.map((name, i) => ({
    rank: i + 1,
    counterparty: name,
    nace: pick(['B06.1','B06.2','C24.1','C23.5','D35.1','H50.1','H51.1','C20.1'], i * 7),
    exposure: rng(800, 5200, i * 11 + 3),
    scope1tCO2e: rng(2e6, 120e6, i * 13 + 7),
    scope2tCO2e: rng(200000, 15e6, i * 17 + 11),
    scope3tCO2e: rng(5e6, 500e6, i * 19 + 13),
    intensity: rng(50, 1200, i * 23 + 17),
    transitionRisk: pick(['Very High','High','Medium-High','Medium'], i * 29),
    maturity: rng(1, 12, i * 31 + 19),
  }));
};
const TOP20_CARBON = buildTop20CarbonIntensive();

// Compliance checklist for downstream
const COMPLIANCE_CHECKLIST = [
  {id:1,item:'GAR numerator calculated per EBA ITS Template 7',status:'complete',regulatory:'CRR Art. 449a',deadline:'2024-06-30'},
  {id:2,item:'BTAR calculated per EBA ITS Template 8 (all CRR exposures)',status:'complete',regulatory:'EBA ITS 2022/01',deadline:'2024-06-30'},
  {id:3,item:'DNSH assessment completed for all eligible exposures',status:'complete',regulatory:'Taxonomy Reg Art. 17',deadline:'2024-06-30'},
  {id:4,item:'Minimum safeguards screening completed',status:'complete',regulatory:'Taxonomy Reg Art. 18',deadline:'2024-06-30'},
  {id:5,item:'Scope 3 financed emissions reported (Template 1)',status:'in_progress',regulatory:'EBA ITS Table 1',deadline:'2024-12-31'},
  {id:6,item:'Top-20 carbon-intensive counterparty disclosure (Template 2)',status:'complete',regulatory:'EBA ITS Table 2',deadline:'2024-06-30'},
  {id:7,item:'Banking book climate risk exposures (Template 4)',status:'in_progress',regulatory:'EBA ITS Table 4',deadline:'2024-12-31'},
  {id:8,item:'Turnover-based GAR disclosure',status:'complete',regulatory:'EBA ITS',deadline:'2024-06-30'},
  {id:9,item:'CapEx-based GAR disclosure',status:'complete',regulatory:'EBA ITS',deadline:'2024-06-30'},
  {id:10,item:'OpEx-based GAR supplementary disclosure',status:'in_progress',regulatory:'EBA ITS',deadline:'2025-06-30'},
  {id:11,item:'CSRD E1 climate taxonomy alignment cross-reference',status:'pending',regulatory:'ESRS E1',deadline:'2025-01-01'},
  {id:12,item:'SFDR PAI #3 taxonomy alignment reporting',status:'in_progress',regulatory:'SFDR RTS Annex I',deadline:'2024-12-31'},
  {id:13,item:'EBA XML/XBRL submission format validated',status:'pending',regulatory:'EBA Filing Rules',deadline:'2025-03-31'},
  {id:14,item:'Internal audit sign-off on GAR methodology',status:'pending',regulatory:'Internal',deadline:'2025-06-30'},
  {id:15,item:'Board-level approval of Pillar 3 ESG disclosures',status:'pending',regulatory:'CRR Art. 449a',deadline:'2025-06-30'},
];

// =========================================================================
// STYLE HELPERS
// =========================================================================
const S = {
  page: { background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: 0 },
  header: { background: T.navy, color: '#fff', padding: '28px 32px 18px', borderBottom: `3px solid ${T.gold}` },
  headerTitle: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', margin: 0 },
  headerSub: { fontSize: 13, color: T.goldL, fontFamily: T.mono, marginTop: 4 },
  citation: { fontSize: 11, color: T.goldL, fontFamily: T.mono, marginTop: 6, opacity: 0.85 },
  tabBar: { display: 'flex', gap: 0, background: T.surface, borderBottom: `1px solid ${T.border}`, overflowX: 'auto', padding: '0 24px' },
  tab: (active) => ({ padding: '12px 20px', cursor: 'pointer', fontWeight: active ? 700 : 500, fontSize: 13, color: active ? T.navy : T.textSec, borderBottom: active ? `3px solid ${T.gold}` : '3px solid transparent', background: 'transparent', whiteSpace: 'nowrap', transition: 'all .15s', fontFamily: T.font }),
  body: { padding: '24px 32px', maxWidth: 1600, margin: '0 auto' },
  card: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px 24px', marginBottom: 20 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 },
  kpiRow: { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 },
  kpi: (accent) => ({ flex: '1 1 180px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', borderLeft: `4px solid ${accent || T.navy}` }),
  kpiLabel: { fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiValue: { fontSize: 26, fontWeight: 700, color: T.navy, marginTop: 4 },
  kpiSub: { fontSize: 11, color: T.textSec, marginTop: 2 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font },
  th: { textAlign: 'left', padding: '10px 12px', borderBottom: `2px solid ${T.border}`, fontWeight: 700, color: T.navy, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: T.mono, whiteSpace: 'nowrap', background: T.surfaceH },
  td: { padding: '8px 12px', borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.text, whiteSpace: 'nowrap' },
  badge: (color) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: color + '18', color, fontFamily: T.mono }),
  toggle: (active) => ({ padding: '6px 14px', borderRadius: 4, border: `1px solid ${active ? T.navy : T.border}`, background: active ? T.navy : T.surface, color: active ? '#fff' : T.textSec, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: T.font }),
  select: { padding: '6px 12px', borderRadius: 4, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, color: T.text, background: T.surface },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8, marginTop: 20 },
  citationBox: { background: T.surfaceH, border: `1px solid ${T.borderL}`, borderRadius: 6, padding: '10px 14px', fontSize: 11, color: T.textSec, fontFamily: T.mono, marginTop: 12, lineHeight: 1.6 },
  progressBar: (pct, color) => ({ width: '100%', height: 6, borderRadius: 3, background: T.surfaceH, position: 'relative', overflow: 'hidden' }),
  progressFill: (pct, color) => ({ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 3, background: color || T.green }),
  chip: (color) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600, background: color + '20', color, marginRight: 4 }),
  wizardStep: (active, done) => ({ padding: '10px 16px', borderRadius: 6, border: `1px solid ${done ? T.green : active ? T.gold : T.border}`, background: done ? T.green + '10' : active ? T.gold + '10' : T.surface, cursor: 'pointer', fontSize: 12, fontWeight: active ? 700 : 500, color: done ? T.green : active ? T.navy : T.textSec }),
  exportBtn: { padding: '10px 20px', borderRadius: 6, background: T.navy, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none', fontFamily: T.font },
};

const YN = (v) => v ? <span style={S.badge(T.green)}>YES</span> : <span style={S.badge(T.red)}>NO</span>;
const StatusBadge = ({status}) => {
  const colors = {complete: T.green, in_progress: T.amber, pending: T.textMut};
  const labels = {complete:'Complete', in_progress:'In Progress', pending:'Pending'};
  return <span style={S.badge(colors[status]||T.textMut)}>{labels[status]||status}</span>;
};

// =========================================================================
// TAB 1: GAR Calculator
// =========================================================================
const TabGARCalculator = ({positions}) => {
  const [garType, setGarType] = useState('turnover');
  const [assetFilter, setAssetFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [sortCol, setSortCol] = useState('exposureEurM');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const uniqueAssetClasses = useMemo(() => ['All', ...new Set(positions.map(p => p.assetClass))], [positions]);
  const uniqueCountries = useMemo(() => ['All', ...new Set(positions.map(p => p.country)).values()].sort(), [positions]);

  const filtered = useMemo(() => {
    let d = [...positions];
    if (assetFilter !== 'All') d = d.filter(p => p.assetClass === assetFilter);
    if (countryFilter !== 'All') d = d.filter(p => p.country === countryFilter);
    d.sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'number') return sortAsc ? av - bv : bv - av;
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return d;
  }, [positions, assetFilter, countryFilter, sortCol, sortAsc]);

  const stats = useMemo(() => {
    const totalExposure = filtered.reduce((s, p) => s + p.exposureEurM, 0);
    const eligibleExposure = filtered.filter(p => p.eligible).reduce((s, p) => s + p.exposureEurM, 0);
    const alignedExposure = filtered.filter(p => p.aligned).reduce((s, p) => s + p.exposureEurM, 0);
    const garTypeKey = garType === 'turnover' ? 'turnoverAlignPct' : garType === 'capex' ? 'capexAlignPct' : 'opexAlignPct';
    const weightedAligned = filtered.filter(p => p.aligned).reduce((s, p) => s + p.exposureEurM * p[garTypeKey] / 100, 0);
    const gar = totalExposure > 0 ? (weightedAligned / totalExposure) * 100 : 0;
    const eligiblePct = totalExposure > 0 ? (eligibleExposure / totalExposure) * 100 : 0;
    const dnshPassRate = filtered.filter(p => p.eligible).length > 0 ? (filtered.filter(p => p.dnshPass).length / filtered.filter(p => p.eligible).length) * 100 : 0;
    const msPassRate = filtered.filter(p => p.eligible).length > 0 ? (filtered.filter(p => p.minSafeguardsPass).length / filtered.filter(p => p.eligible).length) * 100 : 0;
    return { totalExposure, eligibleExposure, alignedExposure, gar, eligiblePct, weightedAligned, dnshPassRate, msPassRate };
  }, [filtered, garType]);

  const objBreakdown = useMemo(() => ENV_OBJECTIVES.map(obj => {
    const key = `aligned${obj.code}`;
    const cnt = filtered.filter(p => p[key]).length;
    const exp = filtered.filter(p => p[key]).reduce((s, p) => s + p.exposureEurM, 0);
    return { ...obj, count: cnt, exposure: exp };
  }), [filtered]);

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);
  const doSort = (col) => { setSortCol(col); setSortAsc(sortCol === col ? !sortAsc : false); };

  // Waterfall chart data
  const waterfallData = [
    {name:'Total Assets', value: stats.totalExposure, color: T.navy},
    {name:'Not Covered', value: -(stats.totalExposure - stats.totalExposure * 0.92), color: T.textMut},
    {name:'Covered Assets', value: stats.totalExposure * 0.92, color: T.navyL},
    {name:'Not Eligible', value: -(stats.totalExposure * 0.92 - stats.eligibleExposure), color: T.amber},
    {name:'Eligible', value: stats.eligibleExposure, color: T.gold},
    {name:'DNSH Fail', value: -(stats.eligibleExposure * (1 - stats.dnshPassRate / 100)), color: T.red},
    {name:'MS Fail', value: -(stats.eligibleExposure * stats.dnshPassRate / 100 * (1 - stats.msPassRate / 100) * 0.5), color: '#ef4444'},
    {name:'Aligned (GAR Numerator)', value: stats.weightedAligned, color: T.green},
  ];

  return (
    <div>
      <div style={S.citationBox}>
        <strong>Regulatory Basis:</strong> CRR Art. 449a, EBA ITS Table 7 -- Green Asset Ratio (GAR)<br/>
        <strong>Formula:</strong> GAR = Taxonomy-Aligned Assets (Numerator) / Total Covered Assets (Denominator) x 100<br/>
        <strong>Denominator:</strong> Total on-balance-sheet assets subject to CRR, excluding exposures to central governments, central banks, supranational issuers (Art. 449a(1)(a))<br/>
        <strong>Numerator:</strong> Exposures to taxonomy-aligned activities meeting: (1) Substantial Contribution, (2) DNSH, (3) Minimum Safeguards<br/>
        <strong>GAR variants:</strong> Turnover GAR (primary KPI), CapEx GAR (forward-looking), OpEx GAR (supplementary)
      </div>

      {/* GAR Type Toggle */}
      <div style={{display:'flex',gap:8,marginTop:16,marginBottom:16,alignItems:'center'}}>
        <span style={{fontSize:12,fontWeight:700,color:T.textSec}}>GAR Metric:</span>
        {['turnover','capex','opex'].map(t => (
          <button key={t} style={S.toggle(garType===t)} onClick={()=>setGarType(t)}>
            {t==='turnover'?'Turnover GAR':t==='capex'?'CapEx GAR':'OpEx GAR'}
          </button>
        ))}
        <div style={{flex:1}}/>
        <select style={S.select} value={assetFilter} onChange={e=>setAssetFilter(e.target.value)}>
          {uniqueAssetClasses.map(a=><option key={a} value={a}>{a}</option>)}
        </select>
        <select style={S.select} value={countryFilter} onChange={e=>setCountryFilter(e.target.value)}>
          {uniqueCountries.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div style={S.kpiRow}>
        <div style={S.kpi(T.navy)}>
          <div style={S.kpiLabel}>TOTAL COVERED ASSETS</div>
          <div style={S.kpiValue}>{fmtM(stats.totalExposure)}</div>
          <div style={S.kpiSub}>{filtered.length} positions | CRR-covered</div>
        </div>
        <div style={S.kpi(T.gold)}>
          <div style={S.kpiLabel}>ELIGIBLE EXPOSURES</div>
          <div style={S.kpiValue}>{fmtM(stats.eligibleExposure)}</div>
          <div style={S.kpiSub}>{fmtPct(stats.eligiblePct)} of covered</div>
        </div>
        <div style={S.kpi(T.green)}>
          <div style={S.kpiLabel}>{garType.toUpperCase()} GAR</div>
          <div style={{...S.kpiValue,color:T.green}}>{fmtPct(stats.gar)}</div>
          <div style={S.kpiSub}>Aligned / Covered x 100</div>
        </div>
        <div style={S.kpi(T.sage)}>
          <div style={S.kpiLabel}>ALIGNED EXPOSURE</div>
          <div style={S.kpiValue}>{fmtM(stats.weightedAligned)}</div>
          <div style={S.kpiSub}>Weighted by {garType} alignment %</div>
        </div>
        <div style={S.kpi(T.amber)}>
          <div style={S.kpiLabel}>DNSH PASS RATE</div>
          <div style={S.kpiValue}>{fmtPct(stats.dnshPassRate)}</div>
          <div style={S.kpiSub}>Of eligible exposures</div>
        </div>
        <div style={S.kpi('#7c3aed')}>
          <div style={S.kpiLabel}>MIN SAFEGUARDS PASS</div>
          <div style={S.kpiValue}>{fmtPct(stats.msPassRate)}</div>
          <div style={S.kpiSub}>OECD/UNGP/ILO screening</div>
        </div>
      </div>

      {/* Environmental Objective Breakdown */}
      <div style={S.card}>
        <div style={S.cardTitle}>Alignment by Environmental Objective</div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          {objBreakdown.map(obj => (
            <div key={obj.code} style={{flex:'1 1 220px',padding:'12px 16px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surface}}>
              <div style={{fontSize:11,fontFamily:T.mono,color:obj.color,fontWeight:700}}>{obj.code}</div>
              <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{obj.label}</div>
              <div style={{fontSize:20,fontWeight:700,color:T.navy,marginTop:4}}>{obj.count} positions</div>
              <div style={{fontSize:12,color:T.textSec}}>{fmtM(obj.exposure)} exposure</div>
            </div>
          ))}
        </div>
      </div>

      {/* GAR History Chart */}
      <div style={S.card}>
        <div style={S.cardTitle}>GAR Trend (Turnover / CapEx / OpEx)</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={GAR_HISTORY} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}} />
            <YAxis tick={{fontSize:11,fill:T.textSec}} unit="%" />
            <Tooltip contentStyle={{fontSize:11,fontFamily:T.font}} />
            <Legend wrapperStyle={{fontSize:11}} />
            <Bar dataKey="turnoverGAR" name="Turnover GAR" fill={T.green} radius={[3,3,0,0]} />
            <Bar dataKey="capexGAR" name="CapEx GAR" fill={T.sage} radius={[3,3,0,0]} />
            <Bar dataKey="opexGAR" name="OpEx GAR" fill={T.gold} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Waterfall */}
      <div style={S.card}>
        <div style={S.cardTitle}>GAR Numerator/Denominator Waterfall</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={waterfallData}>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis tick={{fontSize:10,fill:T.textSec}} />
            <Tooltip formatter={v=>fmtM(Math.abs(v))} contentStyle={{fontSize:11}} />
            <Bar dataKey="value" radius={[3,3,0,0]}>
              {waterfallData.map((d,i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Loan Positions Table */}
      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={S.cardTitle}>Loan Positions ({filtered.length} positions, {fmtM(stats.totalExposure)} total)</div>
          <div style={{fontSize:11,color:T.textSec}}>Page {page+1} of {totalPages}</div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead>
              <tr>
                {[
                  {key:'id',label:'#'},{key:'borrower',label:'Borrower'},{key:'country',label:'Ctry'},
                  {key:'naceCode',label:'NACE'},{key:'tscRef',label:'TSC Ref'},{key:'sector',label:'Sector'},
                  {key:'exposureEurM',label:'Exposure (EUR M)'},{key:'assetClass',label:'Asset Class'},
                  {key:'eligible',label:'Eligible'},{key:'aligned',label:'Aligned'},
                  {key:'alignedCCM',label:'CCM'},{key:'alignedCCA',label:'CCA'},{key:'alignedWTR',label:'WTR'},
                  {key:'alignedCE',label:'CE'},{key:'alignedPPC',label:'PPC'},{key:'alignedBIO',label:'BIO'},
                  {key:'dnshPass',label:'DNSH'},{key:'minSafeguardsPass',label:'Min Safeguards'},
                  {key:garType+'AlignPct',label:garType.charAt(0).toUpperCase()+garType.slice(1)+' Align %'},
                ].map(c => (
                  <th key={c.key} style={{...S.th,cursor:'pointer'}} onClick={()=>doSort(c.key)}>
                    {c.label}{sortCol===c.key?(sortAsc?' \u25B2':' \u25BC'):''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(p => {
                const alignKey = garType+'AlignPct';
                return (
                  <tr key={p.id} style={{background:p.id%2===0?T.surfaceH:'transparent'}}>
                    <td style={S.td}>{p.id}</td>
                    <td style={{...S.td,fontWeight:600,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis'}}>{p.borrower}</td>
                    <td style={S.td}>{p.country}</td>
                    <td style={{...S.td,fontFamily:T.mono,fontSize:11}}>{p.naceCode}</td>
                    <td style={{...S.td,fontFamily:T.mono,fontSize:10}}>{p.tscRef}</td>
                    <td style={S.td}>{p.sector}</td>
                    <td style={{...S.td,textAlign:'right',fontWeight:600}}>{fmt(p.exposureEurM,1)}</td>
                    <td style={S.td}>{p.assetClass}</td>
                    <td style={S.td}>{YN(p.eligible)}</td>
                    <td style={S.td}>{YN(p.aligned)}</td>
                    <td style={S.td}>{YN(p.alignedCCM)}</td>
                    <td style={S.td}>{YN(p.alignedCCA)}</td>
                    <td style={S.td}>{YN(p.alignedWTR)}</td>
                    <td style={S.td}>{YN(p.alignedCE)}</td>
                    <td style={S.td}>{YN(p.alignedPPC)}</td>
                    <td style={S.td}>{YN(p.alignedBIO)}</td>
                    <td style={S.td}>{YN(p.dnshPass)}</td>
                    <td style={S.td}>{YN(p.minSafeguardsPass)}</td>
                    <td style={{...S.td,textAlign:'right'}}>{p.aligned?fmtPct(p[alignKey]):'-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{display:'flex',gap:8,marginTop:12,justifyContent:'center'}}>
          <button style={S.toggle(false)} onClick={()=>setPage(Math.max(0,page-1))} disabled={page===0}>Prev</button>
          {Array.from({length:totalPages},(_,i)=>i).slice(Math.max(0,page-2),page+3).map(i=>(
            <button key={i} style={S.toggle(page===i)} onClick={()=>setPage(i)}>{i+1}</button>
          ))}
          <button style={S.toggle(false)} onClick={()=>setPage(Math.min(totalPages-1,page+1))} disabled={page>=totalPages-1}>Next</button>
        </div>
      </div>

      {/* Peer Comparison */}
      <div style={S.card}>
        <div style={S.cardTitle}>Peer Comparison -- GAR & BTAR</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={PEER_BANKS} barCategoryGap="15%">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis tick={{fontSize:10,fill:T.textSec}} unit="%" />
            <Tooltip contentStyle={{fontSize:11}} />
            <Legend wrapperStyle={{fontSize:11}} />
            <Bar dataKey="gar" name="GAR %" fill={T.green} radius={[3,3,0,0]} />
            <Bar dataKey="btar" name="BTAR %" fill={T.sage} radius={[3,3,0,0]} />
            <Bar dataKey="eligible" name="Eligible %" fill={T.gold} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// =========================================================================
// TAB 2: BTAR
// =========================================================================
const TabBTAR = ({positions}) => {
  const [selectedScope, setSelectedScope] = useState('consolidated');

  const btarStats = useMemo(() => {
    const totalBankingBook = BTAR_ASSET_CLASSES.reduce((s, a) => s + a.exposure, 0);
    const totalEligible = BTAR_ASSET_CLASSES.reduce((s, a) => s + a.eligible, 0);
    const totalAligned = BTAR_ASSET_CLASSES.reduce((s, a) => s + a.aligned, 0);
    const btar = totalBankingBook > 0 ? (totalAligned / totalBankingBook) * 100 : 0;
    const eligiblePct = totalBankingBook > 0 ? (totalEligible / totalBankingBook) * 100 : 0;
    const scaleFactor = selectedScope === 'bank_only' ? 0.87 : selectedScope === 'insurance' ? 0.13 : 1.0;
    return {
      totalBankingBook: totalBankingBook * scaleFactor,
      totalEligible: totalEligible * scaleFactor,
      totalAligned: totalAligned * scaleFactor,
      btar: btar,
      eligiblePct: eligiblePct,
    };
  }, [selectedScope]);

  // BTAR vs GAR comparison
  const garVsBtar = [
    {metric:'Scope',gar:'Covered assets (excl. sovereign, central bank)',btar:'ALL CRR banking book exposures'},
    {metric:'Sovereign Exposures',gar:'Excluded from denominator',btar:'Included in denominator'},
    {metric:'Derivatives',gar:'Excluded',btar:'Included (mark-to-market)'},
    {metric:'Interbank',gar:'Excluded',btar:'Included'},
    {metric:'Central Bank',gar:'Excluded',btar:'Included'},
    {metric:'Mandatory From',gar:'FY2024 (phased since FY2022)',btar:'FY2024'},
    {metric:'EBA Template',gar:'Template 7',btar:'Template 8'},
    {metric:'Purpose',gar:'Prudential disclosure of green assets',btar:'Full balance sheet taxonomy alignment view'},
  ];

  return (
    <div>
      <div style={S.citationBox}>
        <strong>Regulatory Basis:</strong> EBA ITS on Pillar 3 ESG Disclosures, Template 8 -- BTAR<br/>
        <strong>Key Difference from GAR:</strong> BTAR includes ALL CRR exposures (sovereign, interbank, central bank, derivatives) in the denominator, while GAR excludes them. This results in a lower BTAR than GAR.<br/>
        <strong>Mandatory:</strong> FY2024 onwards for all CRR institutions subject to Art. 449a. First full disclosure due H1 2025.
      </div>

      <div style={{display:'flex',gap:8,marginTop:16,marginBottom:16}}>
        <span style={{fontSize:12,fontWeight:700,color:T.textSec}}>Scope:</span>
        {[{k:'consolidated',l:'Consolidated Group'},{k:'bank_only',l:'Bank Only'},{k:'insurance',l:'Insurance Sub'}].map(s=>(
          <button key={s.k} style={S.toggle(selectedScope===s.k)} onClick={()=>setSelectedScope(s.k)}>{s.l}</button>
        ))}
      </div>

      <div style={S.kpiRow}>
        <div style={S.kpi(T.navy)}>
          <div style={S.kpiLabel}>TOTAL BANKING BOOK</div>
          <div style={S.kpiValue}>EUR {fmt(btarStats.totalBankingBook/1000,1)}Bn</div>
          <div style={S.kpiSub}>All CRR exposures</div>
        </div>
        <div style={S.kpi(T.gold)}>
          <div style={S.kpiLabel}>ELIGIBLE EXPOSURES</div>
          <div style={S.kpiValue}>EUR {fmt(btarStats.totalEligible/1000,1)}Bn</div>
          <div style={S.kpiSub}>{fmtPct(btarStats.eligiblePct)} of total</div>
        </div>
        <div style={S.kpi(T.green)}>
          <div style={S.kpiLabel}>BTAR</div>
          <div style={{...S.kpiValue,color:T.green}}>{fmtPct(btarStats.btar)}</div>
          <div style={S.kpiSub}>Aligned / Total Banking Book</div>
        </div>
        <div style={S.kpi(T.sage)}>
          <div style={S.kpiLabel}>ALIGNED ASSETS</div>
          <div style={S.kpiValue}>EUR {fmt(btarStats.totalAligned/1000,1)}Bn</div>
          <div style={S.kpiSub}>Meeting all 3 criteria</div>
        </div>
      </div>

      {/* Asset class breakdown */}
      <div style={S.card}>
        <div style={S.cardTitle}>BTAR by Asset Class (Template 8 Format)</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Asset Class</th>
              <th style={{...S.th,textAlign:'right'}}>Total Exposure (EUR M)</th>
              <th style={{...S.th,textAlign:'right'}}>Eligible (EUR M)</th>
              <th style={{...S.th,textAlign:'right'}}>Aligned (EUR M)</th>
              <th style={{...S.th,textAlign:'right'}}>Eligibility %</th>
              <th style={{...S.th,textAlign:'right'}}>Alignment %</th>
              <th style={S.th}>CRR Covered</th>
            </tr>
          </thead>
          <tbody>
            {BTAR_ASSET_CLASSES.map((a, i) => {
              const scale = selectedScope === 'bank_only' ? 0.87 : selectedScope === 'insurance' ? 0.13 : 1.0;
              return (
                <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                  <td style={{...S.td,fontWeight:600}}>{a.assetClass}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(a.exposure*scale,0)}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(a.eligible*scale,0)}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(a.aligned*scale,0)}</td>
                  <td style={{...S.td,textAlign:'right'}}>{a.exposure>0?fmtPct(a.eligible/a.exposure*100):'-'}</td>
                  <td style={{...S.td,textAlign:'right',color:a.aligned>0?T.green:T.textMut}}>{a.exposure>0?fmtPct(a.aligned/a.exposure*100):'-'}</td>
                  <td style={S.td}>{YN(a.coveredByCRR)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{fontWeight:700,background:T.surfaceH}}>
              <td style={S.td}>TOTAL</td>
              <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(btarStats.totalBankingBook,0)}</td>
              <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(btarStats.totalEligible,0)}</td>
              <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(btarStats.totalAligned,0)}</td>
              <td style={{...S.td,textAlign:'right'}}>{fmtPct(btarStats.eligiblePct)}</td>
              <td style={{...S.td,textAlign:'right',color:T.green}}>{fmtPct(btarStats.btar)}</td>
              <td style={S.td}/>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Donut chart */}
      <div style={S.card}>
        <div style={S.cardTitle}>BTAR Composition</div>
        <div style={{display:'flex',gap:24,alignItems:'center',flexWrap:'wrap'}}>
          <ResponsiveContainer width={300} height={240}>
            <PieChart>
              <Pie data={BTAR_ASSET_CLASSES} dataKey="exposure" nameKey="assetClass" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={1}>
                {BTAR_ASSET_CLASSES.map((a,i)=><Cell key={i} fill={[T.green,T.sage,T.gold,T.navy,T.navyL,T.textMut,T.amber,'#7c3aed','#0ea5e9','#a78bfa'][i%10]} />)}
              </Pie>
              <Tooltip formatter={(v)=>'EUR '+fmt(v,0)+'M'} contentStyle={{fontSize:11}} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{flex:1}}>
            {BTAR_ASSET_CLASSES.map((a,i)=>(
              <div key={i} style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                <div style={{width:10,height:10,borderRadius:2,background:[T.green,T.sage,T.gold,T.navy,T.navyL,T.textMut,T.amber,'#7c3aed','#0ea5e9','#a78bfa'][i%10]}}/>
                <span style={{fontSize:11,color:T.textSec,flex:1}}>{a.assetClass}</span>
                <span style={{fontSize:11,fontFamily:T.mono,color:T.text}}>EUR {fmt(a.exposure,0)}M</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GAR vs BTAR comparison */}
      <div style={S.card}>
        <div style={S.cardTitle}>GAR vs BTAR -- Scope Differences</div>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Metric</th><th style={S.th}>GAR (Template 7)</th><th style={S.th}>BTAR (Template 8)</th></tr></thead>
          <tbody>
            {garVsBtar.map((r,i)=>(
              <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{r.metric}</td>
                <td style={S.td}>{r.gar}</td>
                <td style={S.td}>{r.btar}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =========================================================================
// TAB 3: Taxonomy Eligibility
// =========================================================================
const TabTaxonomyEligibility = ({positions}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedObjective, setSelectedObjective] = useState('All');

  const filteredActivities = useMemo(() => {
    let acts = [...NACE_ACTIVITIES];
    if (searchQuery) acts = acts.filter(a => a.desc.toLowerCase().includes(searchQuery.toLowerCase()) || a.code.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedObjective !== 'All') acts = acts.filter(a => a.tsc && a.tsc.startsWith(selectedObjective));
    return acts;
  }, [searchQuery, selectedObjective]);

  const eligibilityStats = useMemo(() => {
    const total = positions.length;
    const eligible = positions.filter(p => p.eligible).length;
    const byObjective = ENV_OBJECTIVES.map(obj => {
      const key = `aligned${obj.code}`;
      return { ...obj, alignedCount: positions.filter(p => p[key]).length, eligibleCount: positions.filter(p => p.eligible && p.tscRef.startsWith(obj.code)).length };
    });
    return { total, eligible, notEligible: total - eligible, byObjective };
  }, [positions]);

  return (
    <div>
      <div style={S.citationBox}>
        <strong>Regulatory Basis:</strong> Taxonomy Regulation (EU) 2020/852 Art. 3 -- Criteria for environmental sustainability<br/>
        <strong>6 Environmental Objectives:</strong> Climate Change Mitigation (CCM), Climate Change Adaptation (CCA), Sustainable Use and Protection of Water and Marine Resources (WTR), Transition to a Circular Economy (CE), Pollution Prevention and Control (PPC), Protection and Restoration of Biodiversity and Ecosystems (BIO)<br/>
        <strong>TSC Source:</strong> Climate Delegated Act (EU) 2021/2139, Environmental Delegated Act (EU) 2023/2486
      </div>

      <div style={{display:'flex',gap:12,marginTop:16,marginBottom:16,flexWrap:'wrap'}}>
        <input style={{...S.select,flex:'1 1 240px'}} placeholder="Search NACE code or activity description..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
        <select style={S.select} value={selectedObjective} onChange={e=>setSelectedObjective(e.target.value)}>
          <option value="All">All Objectives</option>
          {ENV_OBJECTIVES.map(o=><option key={o.code} value={o.code}>{o.code} -- {o.label}</option>)}
        </select>
      </div>

      <div style={S.kpiRow}>
        <div style={S.kpi(T.green)}>
          <div style={S.kpiLabel}>ELIGIBLE POSITIONS</div>
          <div style={S.kpiValue}>{eligibilityStats.eligible}</div>
          <div style={S.kpiSub}>{fmtPct(eligibilityStats.eligible/eligibilityStats.total*100)} of portfolio</div>
        </div>
        <div style={S.kpi(T.red)}>
          <div style={S.kpiLabel}>NOT ELIGIBLE</div>
          <div style={S.kpiValue}>{eligibilityStats.notEligible}</div>
          <div style={S.kpiSub}>No corresponding Delegated Act activity</div>
        </div>
      </div>

      {/* Objective radar */}
      <div style={S.card}>
        <div style={S.cardTitle}>Eligibility & Alignment by Environmental Objective</div>
        <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
          <ResponsiveContainer width={320} height={260}>
            <RadarChart data={eligibilityStats.byObjective} cx="50%" cy="50%" outerRadius={90}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="code" tick={{fontSize:11,fill:T.textSec}} />
              <PolarRadiusAxis tick={{fontSize:9}} />
              <Radar name="Eligible" dataKey="eligibleCount" stroke={T.gold} fill={T.gold} fillOpacity={0.3} />
              <Radar name="Aligned" dataKey="alignedCount" stroke={T.green} fill={T.green} fillOpacity={0.3} />
              <Legend wrapperStyle={{fontSize:11}} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{flex:1}}>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Objective</th><th style={S.th}>Eligible</th><th style={S.th}>Aligned</th><th style={S.th}>Conversion Rate</th></tr></thead>
              <tbody>
                {eligibilityStats.byObjective.map((o,i)=>(
                  <tr key={o.code} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                    <td style={S.td}><span style={{color:o.color,fontWeight:700}}>{o.code}</span> {o.label}</td>
                    <td style={{...S.td,textAlign:'center'}}>{o.eligibleCount}</td>
                    <td style={{...S.td,textAlign:'center'}}>{o.alignedCount}</td>
                    <td style={{...S.td,textAlign:'center'}}>{o.eligibleCount>0?fmtPct(o.alignedCount/o.eligibleCount*100):'-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* NACE Activity Classifier */}
      <div style={S.card}>
        <div style={S.cardTitle}>NACE Activity Classifier -- Delegated Act Mapping</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>NACE Code</th>
              <th style={S.th}>Activity Description</th>
              <th style={S.th}>TSC Reference</th>
              <th style={S.th}>Sector</th>
              <th style={S.th}>Eligible</th>
              <th style={S.th}>Portfolio Count</th>
              <th style={S.th}>Portfolio Exposure</th>
            </tr>
          </thead>
          <tbody>
            {filteredActivities.map((a,i)=>{
              const matchingPositions = positions.filter(p=>p.naceCode===a.code);
              const totalExp = matchingPositions.reduce((s,p)=>s+p.exposureEurM,0);
              return (
                <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                  <td style={{...S.td,fontFamily:T.mono,fontWeight:600}}>{a.code}</td>
                  <td style={S.td}>{a.desc}</td>
                  <td style={{...S.td,fontFamily:T.mono,color:a.tsc?T.green:T.textMut}}>{a.tsc||'N/A'}</td>
                  <td style={S.td}>{a.sector}</td>
                  <td style={S.td}>{YN(a.eligible)}</td>
                  <td style={{...S.td,textAlign:'center'}}>{matchingPositions.length}</td>
                  <td style={{...S.td,textAlign:'right'}}>{totalExp>0?fmtM(totalExp):'-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* TSC Thresholds from referenceData */}
      <div style={S.card}>
        <div style={S.cardTitle}>Technical Screening Criteria -- Key Thresholds</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
          {TAXONOMY_THRESHOLDS && Object.entries(TAXONOMY_THRESHOLDS.climate_mitigation || {}).map(([key,val],i) => (
            <div key={key} style={{padding:'12px 16px',borderRadius:6,border:`1px solid ${T.border}`,background:T.surface}}>
              <div style={{fontSize:12,fontWeight:700,color:T.navy}}>{key.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</div>
              <div style={{fontSize:20,fontWeight:700,color:T.green,marginTop:4}}>{typeof val.threshold==='number'?val.threshold+' '+val.unit:val.threshold||val.note}</div>
              {val.condition && <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{val.condition}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// TAB 4: DNSH Assessment
// =========================================================================
const TabDNSH = ({positions}) => {
  const [selectedPosition, setSelectedPosition] = useState(0);
  const [wizardStep, setWizardStep] = useState(0);

  const eligiblePositions = useMemo(() => positions.filter(p => p.eligible), [positions]);
  const pos = eligiblePositions[selectedPosition] || eligiblePositions[0];

  const dnshResults = useMemo(() => {
    if (!pos) return [];
    return DNSH_CRITERIA.map((c, i) => {
      const pass = sr(pos.id * 100 + i * 7) > 0.25;
      const score = rng(0, 100, pos.id * 100 + i * 11);
      const evidence = pass ? 'Documented assessment provided' : 'Assessment incomplete or adverse finding';
      return { ...c, pass, score, evidence };
    });
  }, [pos]);

  if (!pos) return <div style={S.card}>No eligible positions found.</div>;

  return (
    <div>
      <div style={S.citationBox}>
        <strong>Regulatory Basis:</strong> Taxonomy Regulation (EU) 2020/852 Art. 17 -- Do No Significant Harm (DNSH)<br/>
        <strong>Requirement:</strong> An economic activity shall be considered as significantly harming an environmental objective if it leads to significant negative impacts on any of the 6 objectives.<br/>
        <strong>Assessment:</strong> Per-activity, per-objective DNSH criteria defined in Climate Delegated Act Annex I Appendix A-D.<br/>
        <strong>Key:</strong> ALL 6 objectives must pass DNSH for alignment. Failure on any single objective = NOT aligned.
      </div>

      <div style={{display:'flex',gap:12,marginTop:16,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:12,fontWeight:700}}>Select Position:</span>
        <select style={{...S.select,minWidth:300}} value={selectedPosition} onChange={e=>setSelectedPosition(Number(e.target.value))}>
          {eligiblePositions.map((p,i)=><option key={p.id} value={i}>#{p.id} {p.borrower} ({p.naceCode})</option>)}
        </select>
      </div>

      {/* Position summary */}
      <div style={S.kpiRow}>
        <div style={S.kpi(T.navy)}>
          <div style={S.kpiLabel}>BORROWER</div>
          <div style={{fontSize:16,fontWeight:700,color:T.navy}}>{pos.borrower}</div>
          <div style={S.kpiSub}>{pos.naceCode} -- {pos.naceDesc}</div>
        </div>
        <div style={S.kpi(T.gold)}>
          <div style={S.kpiLabel}>EXPOSURE</div>
          <div style={S.kpiValue}>{fmtM(pos.exposureEurM)}</div>
        </div>
        <div style={S.kpi(pos.dnshPass?T.green:T.red)}>
          <div style={S.kpiLabel}>DNSH OVERALL</div>
          <div style={{...S.kpiValue,color:pos.dnshPass?T.green:T.red}}>{pos.dnshPass?'PASS':'FAIL'}</div>
          <div style={S.kpiSub}>{dnshResults.filter(r=>r.pass).length}/6 objectives passed</div>
        </div>
      </div>

      {/* DNSH Wizard Steps */}
      <div style={S.card}>
        <div style={S.cardTitle}>6-Step DNSH Assessment Wizard</div>
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          {DNSH_CRITERIA.map((c,i)=>(
            <button key={i} style={S.wizardStep(wizardStep===i,dnshResults[i]?.pass)} onClick={()=>setWizardStep(i)}>
              {i+1}. {c.objective} {dnshResults[i]?.pass?'\u2713':'\u2717'}
            </button>
          ))}
        </div>

        {/* Active wizard step detail */}
        {dnshResults[wizardStep] && (
          <div style={{padding:'16px 20px',borderRadius:8,border:`1px solid ${dnshResults[wizardStep].pass?T.green:T.red}`,background:dnshResults[wizardStep].pass?T.green+'08':T.red+'08'}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{DNSH_CRITERIA[wizardStep].label}</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:4}}>{DNSH_CRITERIA[wizardStep].criteria}</div>
            <div style={{fontSize:14,fontWeight:700,color:dnshResults[wizardStep].pass?T.green:T.red,marginTop:8}}>
              Result: {dnshResults[wizardStep].pass?'PASS':'FAIL'} (Score: {fmt(dnshResults[wizardStep].score,0)}/100)
            </div>
            <div style={{fontSize:12,color:T.textSec,marginTop:4}}>Evidence: {dnshResults[wizardStep].evidence}</div>
            <div style={{marginTop:12}}>
              <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6}}>Assessment Checklist:</div>
              {DNSH_CRITERIA[wizardStep].assessmentItems.map((item,j)=>{
                const checked = sr(pos.id*200+wizardStep*10+j)>0.3;
                return (
                  <div key={j} style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                    <span style={{color:checked?T.green:T.red,fontWeight:700,fontSize:14}}>{checked?'\u2713':'\u2717'}</span>
                    <span style={{fontSize:12,color:checked?T.text:T.red}}>{item}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Full matrix */}
      <div style={S.card}>
        <div style={S.cardTitle}>DNSH Assessment Summary -- All Eligible Positions</div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th><th style={S.th}>Borrower</th><th style={S.th}>NACE</th><th style={S.th}>Exposure</th>
                {DNSH_CRITERIA.map(c=><th key={c.objective} style={S.th}>{c.objective}</th>)}
                <th style={S.th}>Overall</th>
              </tr>
            </thead>
            <tbody>
              {eligiblePositions.slice(0,30).map((p,i)=>{
                const results = DNSH_CRITERIA.map((c,j)=>sr(p.id*100+j*7)>0.25);
                const overall = results.every(Boolean);
                return (
                  <tr key={p.id} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                    <td style={S.td}>{p.id}</td>
                    <td style={{...S.td,fontWeight:600,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis'}}>{p.borrower}</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{p.naceCode}</td>
                    <td style={{...S.td,textAlign:'right'}}>{fmt(p.exposureEurM,1)}</td>
                    {results.map((r,j)=><td key={j} style={{...S.td,textAlign:'center'}}>{YN(r)}</td>)}
                    <td style={{...S.td,textAlign:'center'}}>{YN(overall)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// TAB 5: Minimum Safeguards
// =========================================================================
const TabMinSafeguards = ({positions}) => {
  const [selectedFramework, setSelectedFramework] = useState(0);

  const screeningResults = useMemo(() => {
    return positions.filter(p => p.eligible).slice(0, 40).map((p, i) => {
      const oecdPass = sr(p.id * 301 + 1) > 0.18;
      const ungpPass = sr(p.id * 307 + 3) > 0.15;
      const iloPass = sr(p.id * 311 + 5) > 0.12;
      const ibohrPass = sr(p.id * 313 + 7) > 0.20;
      const overallPass = oecdPass && ungpPass && iloPass && ibohrPass;
      const riskLevel = !overallPass ? 'High' : sr(p.id * 317) > 0.5 ? 'Low' : 'Medium';
      return { ...p, oecdPass, ungpPass, iloPass, ibohrPass, overallPass, riskLevel };
    });
  }, [positions]);

  const fw = MIN_SAFEGUARDS_FRAMEWORK[selectedFramework];
  const passRate = screeningResults.length > 0 ? (screeningResults.filter(r => r.overallPass).length / screeningResults.length) * 100 : 0;

  return (
    <div>
      <div style={S.citationBox}>
        <strong>Regulatory Basis:</strong> Taxonomy Regulation (EU) 2020/852 Art. 18 -- Minimum Safeguards<br/>
        <strong>Requirement:</strong> Activities must comply with OECD Guidelines for MNEs, UN Guiding Principles on Business and Human Rights (UNGPs), ILO Declaration on Fundamental Principles, and the International Bill of Human Rights.<br/>
        <strong>PSF Interpretation:</strong> Platform on Sustainable Finance Report on Minimum Safeguards (Oct 2022) -- operationalized through four pillars: human rights, bribery/corruption, taxation, fair competition.
      </div>

      <div style={S.kpiRow}>
        <div style={S.kpi(T.green)}>
          <div style={S.kpiLabel}>PASS RATE</div>
          <div style={S.kpiValue}>{fmtPct(passRate)}</div>
          <div style={S.kpiSub}>{screeningResults.filter(r=>r.overallPass).length}/{screeningResults.length} counterparties</div>
        </div>
        <div style={S.kpi(T.red)}>
          <div style={S.kpiLabel}>FAILED SCREENING</div>
          <div style={S.kpiValue}>{screeningResults.filter(r=>!r.overallPass).length}</div>
          <div style={S.kpiSub}>Require remediation or exclusion</div>
        </div>
        <div style={S.kpi(T.navy)}>
          <div style={S.kpiLabel}>FRAMEWORKS ASSESSED</div>
          <div style={S.kpiValue}>4</div>
          <div style={S.kpiSub}>OECD, UNGP, ILO, IBHR</div>
        </div>
      </div>

      {/* Framework selector */}
      <div style={S.card}>
        <div style={S.cardTitle}>Minimum Safeguards Frameworks</div>
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          {MIN_SAFEGUARDS_FRAMEWORK.map((f,i)=>(
            <button key={i} style={S.toggle(selectedFramework===i)} onClick={()=>setSelectedFramework(i)}>
              {f.framework.split(' ').slice(0,3).join(' ')}
            </button>
          ))}
        </div>
        <div style={{padding:'16px 20px',borderRadius:8,border:`1px solid ${T.border}`,background:T.surfaceH}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{fw.framework}</div>
          <div style={{marginTop:12}}>
            <div style={{fontSize:12,fontWeight:700,color:T.textSec,marginBottom:6}}>Key Articles/Principles:</div>
            {fw.articles.map((a,j)=>(
              <div key={j} style={{fontSize:12,color:T.text,marginBottom:2,paddingLeft:12}}>- {a}</div>
            ))}
          </div>
          <div style={{marginTop:12}}>
            <div style={{fontSize:12,fontWeight:700,color:T.textSec,marginBottom:6}}>Compliance Checks:</div>
            {fw.checks.map((c,j)=>(
              <div key={j} style={{fontSize:12,color:T.text,marginBottom:2,paddingLeft:12}}>- {c}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Screening results */}
      <div style={S.card}>
        <div style={S.cardTitle}>Per-Borrower Minimum Safeguards Screening</div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th><th style={S.th}>Borrower</th><th style={S.th}>Country</th>
                <th style={S.th}>OECD</th><th style={S.th}>UNGP</th><th style={S.th}>ILO</th><th style={S.th}>IBHR</th>
                <th style={S.th}>Overall</th><th style={S.th}>Risk Level</th><th style={S.th}>Exposure</th>
              </tr>
            </thead>
            <tbody>
              {screeningResults.map((r,i)=>(
                <tr key={r.id} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                  <td style={S.td}>{r.id}</td>
                  <td style={{...S.td,fontWeight:600}}>{r.borrower}</td>
                  <td style={S.td}>{r.country}</td>
                  <td style={S.td}>{YN(r.oecdPass)}</td>
                  <td style={S.td}>{YN(r.ungpPass)}</td>
                  <td style={S.td}>{YN(r.iloPass)}</td>
                  <td style={S.td}>{YN(r.ibohrPass)}</td>
                  <td style={S.td}>{YN(r.overallPass)}</td>
                  <td style={S.td}><span style={S.badge(r.riskLevel==='High'?T.red:r.riskLevel==='Medium'?T.amber:T.green)}>{r.riskLevel}</span></td>
                  <td style={{...S.td,textAlign:'right'}}>{fmtM(r.exposureEurM)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// TAB 6: EBA Pillar 3 Templates
// =========================================================================
const TabEBAPillar3 = ({positions}) => {
  const [selectedTemplate, setSelectedTemplate] = useState('T1');

  const renderTemplate1 = () => (
    <div>
      <div style={S.sectionTitle}>Template 1 -- Scope 3 Financed Emissions by NACE Sector</div>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>NACE</th><th style={S.th}>Sector</th>
            <th style={{...S.th,textAlign:'right'}}>Exposure (EUR M)</th>
            <th style={{...S.th,textAlign:'right'}}>Financed Emissions (tCO2e)</th>
            <th style={{...S.th,textAlign:'right'}}>Emission Intensity (tCO2e/EUR M)</th>
            <th style={{...S.th,textAlign:'right'}}>PCAF Score</th>
          </tr>
        </thead>
        <tbody>
          {SECTOR_EMISSIONS_T1.map((s,i)=>(
            <tr key={s.nace} style={{background:i%2===0?T.surfaceH:'transparent'}}>
              <td style={{...S.td,fontFamily:T.mono,fontWeight:600}}>{s.nace}</td>
              <td style={S.td}>{s.sector}</td>
              <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(s.exposure,0)}</td>
              <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{s.finEmissions.toLocaleString()}</td>
              <td style={{...S.td,textAlign:'right'}}>{fmt(s.intensity,1)}</td>
              <td style={{...S.td,textAlign:'center'}}><span style={S.badge(s.pcafScore<=2.5?T.green:s.pcafScore<=3.5?T.amber:T.red)}>{fmt(s.pcafScore,1)}</span></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{fontWeight:700,background:T.surfaceH}}>
            <td style={S.td} colSpan={2}>TOTAL</td>
            <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(SECTOR_EMISSIONS_T1.reduce((s,r)=>s+r.exposure,0),0)}</td>
            <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{SECTOR_EMISSIONS_T1.reduce((s,r)=>s+r.finEmissions,0).toLocaleString()}</td>
            <td style={{...S.td,textAlign:'right'}}>{fmt(SECTOR_EMISSIONS_T1.reduce((s,r)=>s+r.finEmissions,0)/SECTOR_EMISSIONS_T1.reduce((s,r)=>s+r.exposure,0),1)}</td>
            <td style={S.td}/>
          </tr>
        </tfoot>
      </table>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={SECTOR_EMISSIONS_T1}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="nace" tick={{fontSize:10,fill:T.textSec}} />
          <YAxis tick={{fontSize:10,fill:T.textSec}} />
          <Tooltip contentStyle={{fontSize:11}} />
          <Bar dataKey="finEmissions" name="Financed Emissions (tCO2e)" fill={T.navy} radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderTemplate2 = () => (
    <div>
      <div style={S.sectionTitle}>Template 2 -- Top-20 Carbon-Intensive Exposures</div>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>#</th><th style={S.th}>Counterparty</th><th style={S.th}>NACE</th>
            <th style={{...S.th,textAlign:'right'}}>Exposure (EUR M)</th>
            <th style={{...S.th,textAlign:'right'}}>Scope 1 (tCO2e)</th>
            <th style={{...S.th,textAlign:'right'}}>Scope 2 (tCO2e)</th>
            <th style={{...S.th,textAlign:'right'}}>Scope 3 (tCO2e)</th>
            <th style={{...S.th,textAlign:'right'}}>Intensity</th>
            <th style={S.th}>Transition Risk</th>
            <th style={{...S.th,textAlign:'right'}}>Maturity (yr)</th>
          </tr>
        </thead>
        <tbody>
          {TOP20_CARBON.map((r,i)=>(
            <tr key={r.rank} style={{background:i%2===0?T.surfaceH:'transparent'}}>
              <td style={S.td}>{r.rank}</td>
              <td style={{...S.td,fontWeight:600}}>{r.counterparty}</td>
              <td style={{...S.td,fontFamily:T.mono}}>{r.nace}</td>
              <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(r.exposure,1)}</td>
              <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{(r.scope1tCO2e/1e6).toFixed(1)}M</td>
              <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{(r.scope2tCO2e/1e6).toFixed(1)}M</td>
              <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{(r.scope3tCO2e/1e6).toFixed(1)}M</td>
              <td style={{...S.td,textAlign:'right'}}>{fmt(r.intensity,0)}</td>
              <td style={S.td}><span style={S.badge(r.transitionRisk==='Very High'?T.red:r.transitionRisk==='High'?'#ef4444':T.amber)}>{r.transitionRisk}</span></td>
              <td style={{...S.td,textAlign:'right'}}>{fmt(r.maturity,1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTemplate4 = () => {
    const sectors = SECTOR_EMISSIONS_T1.slice(0,10);
    return (
      <div>
        <div style={S.sectionTitle}>Template 4 -- Banking Book Climate Change Transition Risk</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Sector</th>
              <th style={{...S.th,textAlign:'right'}}>Performing (EUR M)</th>
              <th style={{...S.th,textAlign:'right'}}>Stage 2 (EUR M)</th>
              <th style={{...S.th,textAlign:'right'}}>NPL (EUR M)</th>
              <th style={{...S.th,textAlign:'right'}}>Total (EUR M)</th>
              <th style={S.th}>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {sectors.map((s,i)=>{
              const perf = s.exposure * rng(0.85, 0.96, i * 101);
              const stg2 = s.exposure * rng(0.02, 0.10, i * 103);
              const npl = s.exposure - perf - stg2;
              const risk = s.intensity > 15 ? 'High' : s.intensity > 5 ? 'Medium' : 'Low';
              return (
                <tr key={s.nace} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                  <td style={S.td}>{s.sector}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(perf,1)}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(stg2,1)}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(Math.max(0,npl),1)}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono,fontWeight:600}}>{fmt(s.exposure,1)}</td>
                  <td style={S.td}><span style={S.badge(risk==='High'?T.red:risk==='Medium'?T.amber:T.green)}>{risk}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTemplate78 = () => (
    <div>
      <div style={S.sectionTitle}>Templates 7 & 8 -- GAR and BTAR Summary</div>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>KPI</th>
            <th style={{...S.th,textAlign:'right'}}>Turnover</th>
            <th style={{...S.th,textAlign:'right'}}>CapEx</th>
            <th style={{...S.th,textAlign:'right'}}>OpEx</th>
          </tr>
        </thead>
        <tbody>
          {[
            {kpi:'GAR (Template 7) -- Covered Assets Only',t:7.3,c:9.8,o:5.6},
            {kpi:'BTAR (Template 8) -- All CRR Exposures',t:3.9,c:5.2,o:3.0},
            {kpi:'Eligible %',t:35.8,c:42.1,o:30.5},
            {kpi:'Aligned to CCM',t:6.1,c:8.4,o:4.8},
            {kpi:'Aligned to CCA',t:0.8,c:1.0,o:0.5},
            {kpi:'Aligned to remaining 4 objectives',t:0.4,c:0.4,o:0.3},
            {kpi:'DNSH pass rate (%)',t:78.5,c:78.5,o:78.5},
            {kpi:'Minimum Safeguards pass rate (%)',t:84.2,c:84.2,o:84.2},
          ].map((r,i)=>(
            <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
              <td style={{...S.td,fontWeight:600}}>{r.kpi}</td>
              <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(r.t)}</td>
              <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(r.c)}</td>
              <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(r.o)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div style={S.citationBox}>
        <strong>Regulatory Basis:</strong> EBA ITS on Prudential Disclosures on ESG Risks (EBA/ITS/2022/01)<br/>
        <strong>Templates Covered:</strong> Template 1 (Scope 3 financed emissions by sector), Template 2 (Top-20 carbon-intensive exposures), Template 4 (Banking book transition risk by credit quality), Templates 7/8 (GAR/BTAR)<br/>
        <strong>Applicability:</strong> All CRR institutions meeting Art. 449a thresholds. Large institutions from FY2024, smaller from FY2025.
      </div>

      <div style={{display:'flex',gap:8,marginTop:16,marginBottom:16,flexWrap:'wrap'}}>
        {EBA_TEMPLATES.map(t=>(
          <button key={t.id} style={S.toggle(selectedTemplate===t.id)} onClick={()=>setSelectedTemplate(t.id)}>{t.id}: {t.name.split(':')[1]?.trim()||t.name}</button>
        ))}
      </div>

      {/* Template description */}
      {EBA_TEMPLATES.filter(t=>t.id===selectedTemplate).map(t=>(
        <div key={t.id} style={{...S.card,borderLeft:`4px solid ${T.navy}`}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{t.name}</div>
          <div style={{fontSize:12,color:T.textSec,marginTop:4}}>{t.desc}</div>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.gold,marginTop:4}}>Citation: {t.citation}</div>
        </div>
      ))}

      {selectedTemplate === 'T1' && renderTemplate1()}
      {selectedTemplate === 'T2' && renderTemplate2()}
      {selectedTemplate === 'T4' && renderTemplate4()}
      {(selectedTemplate === 'T7' || selectedTemplate === 'T8') && renderTemplate78()}
    </div>
  );
};

// =========================================================================
// TAB 7: Downstream & Export
// =========================================================================
const TabDownstreamExport = () => {
  const [exportFormat, setExportFormat] = useState('xml');

  const downstreamFeeds = [
    {target:'CSRD E1 -- Climate',field:'Taxonomy alignment % (Turnover, CapEx)',status:'active',frequency:'Annual'},
    {target:'SFDR PAI #3 -- GHG intensity of investee companies',field:'Weighted average carbon intensity + taxonomy alignment',status:'active',frequency:'Annual'},
    {target:'SFDR Taxonomy Alignment (Art. 5/6)',field:'% of investments in taxonomy-aligned activities',status:'active',frequency:'Semi-annual'},
    {target:'Climate Banking Hub',field:'GAR, BTAR, Pillar 3 ESG KPIs',status:'active',frequency:'Quarterly'},
    {target:'PCAF Financed Emissions Engine',field:'Scope 3 Cat 15 emissions by sector',status:'active',frequency:'Annual'},
    {target:'Credit Risk Models',field:'Taxonomy alignment as credit risk mitigant',status:'planned',frequency:'Quarterly'},
    {target:'Internal Risk Appetite Framework',field:'GAR target as risk appetite metric',status:'active',frequency:'Quarterly'},
    {target:'Investor Reporting',field:'Fund-level taxonomy alignment disclosure',status:'active',frequency:'Semi-annual'},
  ];

  return (
    <div>
      <div style={S.citationBox}>
        <strong>Export Formats:</strong> EBA XML (XBRL filing format), CSV (internal analytics), PDF (Board reporting)<br/>
        <strong>Downstream Consumers:</strong> CSRD E1 climate disclosures, SFDR PAI reporting, Climate Banking Hub, Risk Appetite Framework<br/>
        <strong>Submission Timeline:</strong> EBA Pillar 3 ESG: H1 annually | SFDR PAI: 30 June annually | CSRD: With annual report
      </div>

      {/* Export buttons */}
      <div style={S.card}>
        <div style={S.cardTitle}>Export Data</div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
          {['xml','xbrl','csv','pdf'].map(f=>(
            <button key={f} style={S.toggle(exportFormat===f)} onClick={()=>setExportFormat(f)}>{f.toUpperCase()}</button>
          ))}
        </div>
        <div style={{padding:12,borderRadius:6,background:T.surfaceH,border:`1px solid ${T.border}`}}>
          <div style={{fontSize:12,fontWeight:700,color:T.navy}}>Selected: {exportFormat.toUpperCase()}</div>
          <div style={{fontSize:11,color:T.textSec,marginTop:4}}>
            {exportFormat === 'xml' && 'EBA XML format per ITS filing taxonomy. Includes Templates 1, 2, 4, 7, 8.'}
            {exportFormat === 'xbrl' && 'ESEF/EBA XBRL inline format for machine-readable disclosure.'}
            {exportFormat === 'csv' && 'Raw data export for internal analytics and data warehouse integration.'}
            {exportFormat === 'pdf' && 'Board-ready PDF with executive summary, charts, and compliance status.'}
          </div>
          <button style={{...S.exportBtn,marginTop:12}}>Generate {exportFormat.toUpperCase()} Export</button>
        </div>
      </div>

      {/* Downstream feeds */}
      <div style={S.card}>
        <div style={S.cardTitle}>Downstream Data Feeds</div>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Target System</th><th style={S.th}>Data Fields</th><th style={S.th}>Status</th><th style={S.th}>Frequency</th></tr>
          </thead>
          <tbody>
            {downstreamFeeds.map((f,i)=>(
              <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{f.target}</td>
                <td style={S.td}>{f.field}</td>
                <td style={S.td}><span style={S.badge(f.status==='active'?T.green:T.amber)}>{f.status}</span></td>
                <td style={S.td}>{f.frequency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Compliance checklist */}
      <div style={S.card}>
        <div style={S.cardTitle}>Compliance Checklist</div>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>#</th><th style={S.th}>Item</th><th style={S.th}>Status</th><th style={S.th}>Regulatory Basis</th><th style={S.th}>Deadline</th></tr>
          </thead>
          <tbody>
            {COMPLIANCE_CHECKLIST.map((c,i)=>(
              <tr key={c.id} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={S.td}>{c.id}</td>
                <td style={{...S.td,maxWidth:400}}>{c.item}</td>
                <td style={S.td}><StatusBadge status={c.status}/></td>
                <td style={{...S.td,fontFamily:T.mono,fontSize:10}}>{c.regulatory}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{c.deadline}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{marginTop:12,display:'flex',gap:16}}>
          <div style={{fontSize:12,color:T.textSec}}>
            Complete: <strong style={{color:T.green}}>{COMPLIANCE_CHECKLIST.filter(c=>c.status==='complete').length}</strong> |
            In Progress: <strong style={{color:T.amber}}>{COMPLIANCE_CHECKLIST.filter(c=>c.status==='in_progress').length}</strong> |
            Pending: <strong style={{color:T.textMut}}>{COMPLIANCE_CHECKLIST.filter(c=>c.status==='pending').length}</strong>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={S.card}>
        <div style={S.cardTitle}>Overall Compliance Progress</div>
        <div style={S.progressBar(0, T.green)}>
          <div style={S.progressFill(COMPLIANCE_CHECKLIST.filter(c=>c.status==='complete').length/COMPLIANCE_CHECKLIST.length*100, T.green)} />
        </div>
        <div style={{fontSize:12,color:T.textSec,marginTop:8}}>
          {Math.round(COMPLIANCE_CHECKLIST.filter(c=>c.status==='complete').length/COMPLIANCE_CHECKLIST.length*100)}% complete
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// EXPANDED TAB 1 ADDENDUM: GAR Sensitivity Analysis & Scenario Projections
// =========================================================================
const TabGARSensitivity = ({positions}) => {
  const [sensitivityVar, setSensitivityVar] = useState('dnshPassRate');

  // Sensitivity: What-if scenarios for GAR improvement
  const sensitivityScenarios = useMemo(()=>{
    const baseAligned = positions.filter(p=>p.aligned).reduce((s,p)=>s+p.exposureEurM*p.turnoverAlignPct/100,0);
    const baseCovered = positions.reduce((s,p)=>s+p.exposureEurM,0);
    const baseGAR = baseCovered>0?(baseAligned/baseCovered)*100:0;
    return [
      {scenario:'Current State',gar:baseGAR,change:0,driver:'Baseline',feasibility:'-'},
      {scenario:'100% DNSH pass rate',gar:baseGAR*1.28,change:baseGAR*0.28,driver:'Improve DNSH documentation for 20 borderline exposures',feasibility:'Medium'},
      {scenario:'100% Min Safeguards pass',gar:baseGAR*1.15,change:baseGAR*0.15,driver:'Complete UNGP/OECD screening for all eligible',feasibility:'High'},
      {scenario:'+EUR 5Bn green mortgages',gar:baseGAR*1.35,change:baseGAR*0.35,driver:'Originate EPC A-rated residential mortgages',feasibility:'High'},
      {scenario:'+EUR 3Bn renewable project finance',gar:baseGAR*1.42,change:baseGAR*0.42,driver:'New wind/solar PF deals with full taxonomy docs',feasibility:'Medium'},
      {scenario:'Convert 50% eligible to aligned',gar:baseGAR*1.85,change:baseGAR*0.85,driver:'Full TSC compliance + DNSH + MS for eligible book',feasibility:'Low'},
      {scenario:'Full green strategy 2030',gar:22.0,change:22.0-baseGAR,driver:'Combination of all levers + new origination strategy',feasibility:'Strategic target'},
      {scenario:'Reduce non-eligible by EUR 10Bn',gar:baseGAR*1.55,change:baseGAR*0.55,driver:'Run off fossil fuel exposures, reduce non-taxonomy lending',feasibility:'Medium'},
    ];
  },[positions]);

  // GAR projection by year under different strategies
  const projectionData = [
    {year:2024,conservative:7.3,moderate:7.3,aggressive:7.3},
    {year:2025,conservative:8.5,moderate:10.2,aggressive:12.8},
    {year:2026,conservative:9.8,moderate:12.5,aggressive:16.2},
    {year:2027,conservative:11.2,moderate:14.8,aggressive:19.5},
    {year:2028,conservative:12.5,moderate:17.0,aggressive:22.8},
    {year:2029,conservative:13.8,moderate:19.2,aggressive:25.5},
    {year:2030,conservative:15.0,moderate:22.0,aggressive:28.0},
  ];

  // Country breakdown
  const countryBreakdown = useMemo(()=>{
    const map = {};
    positions.forEach(p=>{
      if(!map[p.country]) map[p.country]={country:p.country,total:0,eligible:0,aligned:0,count:0};
      map[p.country].total+=p.exposureEurM;
      if(p.eligible) map[p.country].eligible+=p.exposureEurM;
      if(p.aligned) map[p.country].aligned+=p.exposureEurM;
      map[p.country].count++;
    });
    return Object.values(map).sort((a,b)=>b.total-a.total);
  },[positions]);

  // Asset class breakdown
  const assetClassBreakdown = useMemo(()=>{
    const map = {};
    positions.forEach(p=>{
      if(!map[p.assetClass]) map[p.assetClass]={assetClass:p.assetClass,total:0,eligible:0,aligned:0,count:0,avgPD:0,avgLGD:0};
      map[p.assetClass].total+=p.exposureEurM;
      if(p.eligible) map[p.assetClass].eligible+=p.exposureEurM;
      if(p.aligned) map[p.assetClass].aligned+=p.exposureEurM;
      map[p.assetClass].count++;
      map[p.assetClass].avgPD+=p.pd;
      map[p.assetClass].avgLGD+=p.lgd;
    });
    return Object.values(map).map(a=>({...a,avgPD:a.avgPD/a.count,avgLGD:a.avgLGD/a.count,gar:a.total>0?(a.aligned/a.total*100):0})).sort((a,b)=>b.total-a.total);
  },[positions]);

  // Sector breakdown
  const sectorBreakdown = useMemo(()=>{
    const map = {};
    positions.forEach(p=>{
      if(!map[p.sector]) map[p.sector]={sector:p.sector,total:0,eligible:0,aligned:0,count:0,avgEmissions:0};
      map[p.sector].total+=p.exposureEurM;
      if(p.eligible) map[p.sector].eligible+=p.exposureEurM;
      if(p.aligned) map[p.sector].aligned+=p.exposureEurM;
      map[p.sector].count++;
      map[p.sector].avgEmissions+=p.scope1tCO2e+p.scope2tCO2e;
    });
    return Object.values(map).map(s=>({...s,avgEmissions:s.avgEmissions/s.count,gar:s.total>0?(s.aligned/s.total*100):0})).sort((a,b)=>b.total-a.total);
  },[positions]);

  // Maturity profile
  const maturityProfile = useMemo(()=>{
    const buckets = {'0-1yr':0,'1-3yr':0,'3-5yr':0,'5-7yr':0,'7-10yr':0,'10-15yr':0};
    const alignedBuckets = {'0-1yr':0,'1-3yr':0,'3-5yr':0,'5-7yr':0,'7-10yr':0,'10-15yr':0};
    positions.forEach(p=>{
      const k = p.maturityYears<=1?'0-1yr':p.maturityYears<=3?'1-3yr':p.maturityYears<=5?'3-5yr':p.maturityYears<=7?'5-7yr':p.maturityYears<=10?'7-10yr':'10-15yr';
      buckets[k]+=p.exposureEurM;
      if(p.aligned) alignedBuckets[k]+=p.exposureEurM;
    });
    return Object.keys(buckets).map(k=>({bucket:k,total:buckets[k],aligned:alignedBuckets[k],gar:buckets[k]>0?(alignedBuckets[k]/buckets[k]*100):0}));
  },[positions]);

  // EPC rating distribution
  const epcDistribution = useMemo(()=>{
    const map = {};
    positions.forEach(p=>{
      if(!map[p.epcRating]) map[p.epcRating]={rating:p.epcRating,count:0,exposure:0,aligned:0};
      map[p.epcRating].count++;
      map[p.epcRating].exposure+=p.exposureEurM;
      if(p.aligned) map[p.epcRating].aligned+=p.exposureEurM;
    });
    return Object.values(map).sort((a,b)=>{
      const order = ['A+','A','B','C','D','E','F','G','N/A'];
      return order.indexOf(a.rating)-order.indexOf(b.rating);
    });
  },[positions]);

  return (
    <div>
      {/* Sensitivity table */}
      <div style={S.card}>
        <div style={S.cardTitle}>GAR Sensitivity Analysis -- What-If Scenarios</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Scenario</th>
              <th style={{...S.th,textAlign:'right'}}>Projected GAR (%)</th>
              <th style={{...S.th,textAlign:'right'}}>Change (pp)</th>
              <th style={S.th}>Key Driver</th>
              <th style={S.th}>Feasibility</th>
            </tr>
          </thead>
          <tbody>
            {sensitivityScenarios.map((s,i)=>(
              <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent',fontWeight:i===0?700:400}}>
                <td style={{...S.td,fontWeight:600}}>{s.scenario}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:T.green}}>{fmtPct(s.gar)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:s.change>0?T.green:T.text}}>{s.change>0?'+':''}{fmtPct(s.change)}</td>
                <td style={{...S.td,fontSize:11}}>{s.driver}</td>
                <td style={S.td}><span style={S.badge(s.feasibility==='High'?T.green:s.feasibility==='Medium'?T.amber:s.feasibility==='Low'?T.red:T.navyL)}>{s.feasibility}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* GAR projection */}
      <div style={S.card}>
        <div style={S.cardTitle}>GAR Projection 2024-2030 (Three Strategy Paths)</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}} />
            <YAxis tick={{fontSize:11,fill:T.textSec}} unit="%" domain={[0,30]} />
            <Tooltip contentStyle={{fontSize:11}} />
            <Legend wrapperStyle={{fontSize:11}} />
            <Line type="monotone" dataKey="conservative" name="Conservative" stroke={T.textMut} strokeWidth={2} />
            <Line type="monotone" dataKey="moderate" name="Moderate (Target)" stroke={T.gold} strokeWidth={2} strokeDasharray="5 5" />
            <Line type="monotone" dataKey="aggressive" name="Aggressive" stroke={T.green} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Country breakdown */}
      <div style={S.card}>
        <div style={S.cardTitle}>GAR by Country of Counterparty</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Country</th><th style={{...S.th,textAlign:'right'}}>Total (EUR M)</th>
              <th style={{...S.th,textAlign:'right'}}>Eligible (EUR M)</th><th style={{...S.th,textAlign:'right'}}>Aligned (EUR M)</th>
              <th style={{...S.th,textAlign:'right'}}>GAR %</th><th style={{...S.th,textAlign:'right'}}>Positions</th>
            </tr>
          </thead>
          <tbody>
            {countryBreakdown.map((c,i)=>(
              <tr key={c.country} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{c.country}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(c.total,1)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(c.eligible,1)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(c.aligned,1)}</td>
                <td style={{...S.td,textAlign:'right',color:c.total>0&&c.aligned/c.total>0.1?T.green:T.amber}}>{c.total>0?fmtPct(c.aligned/c.total*100):'-'}</td>
                <td style={{...S.td,textAlign:'center'}}>{c.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Asset class breakdown */}
      <div style={S.card}>
        <div style={S.cardTitle}>GAR by Asset Class</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Asset Class</th><th style={{...S.th,textAlign:'right'}}>Total (EUR M)</th>
              <th style={{...S.th,textAlign:'right'}}>Eligible</th><th style={{...S.th,textAlign:'right'}}>Aligned</th>
              <th style={{...S.th,textAlign:'right'}}>GAR %</th><th style={{...S.th,textAlign:'right'}}>Avg PD</th>
              <th style={{...S.th,textAlign:'right'}}>Avg LGD</th><th style={{...S.th,textAlign:'right'}}>Count</th>
            </tr>
          </thead>
          <tbody>
            {assetClassBreakdown.map((a,i)=>(
              <tr key={a.assetClass} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{a.assetClass}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(a.total,1)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(a.eligible,1)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(a.aligned,1)}</td>
                <td style={{...S.td,textAlign:'right',color:a.gar>10?T.green:T.amber}}>{fmtPct(a.gar)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(a.avgPD)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(a.avgLGD)}</td>
                <td style={{...S.td,textAlign:'center'}}>{a.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sector breakdown with emissions */}
      <div style={S.card}>
        <div style={S.cardTitle}>GAR by Sector (with Emission Intensity)</div>
        <div style={{overflowX:'auto'}}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Sector</th><th style={{...S.th,textAlign:'right'}}>Total (EUR M)</th>
                <th style={{...S.th,textAlign:'right'}}>Eligible</th><th style={{...S.th,textAlign:'right'}}>Aligned</th>
                <th style={{...S.th,textAlign:'right'}}>GAR %</th>
                <th style={{...S.th,textAlign:'right'}}>Avg Emissions (tCO2e)</th>
                <th style={{...S.th,textAlign:'right'}}>Count</th>
              </tr>
            </thead>
            <tbody>
              {sectorBreakdown.map((s,i)=>(
                <tr key={s.sector} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                  <td style={{...S.td,fontWeight:600}}>{s.sector}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(s.total,1)}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(s.eligible,1)}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(s.aligned,1)}</td>
                  <td style={{...S.td,textAlign:'right',color:s.gar>10?T.green:s.gar>0?T.amber:T.textMut}}>{fmtPct(s.gar)}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(s.avgEmissions,0)}</td>
                  <td style={{...S.td,textAlign:'center'}}>{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maturity profile */}
      <div style={S.card}>
        <div style={S.cardTitle}>GAR by Maturity Bucket</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={maturityProfile}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="bucket" tick={{fontSize:11,fill:T.textSec}} />
            <YAxis tick={{fontSize:10,fill:T.textSec}} />
            <Tooltip contentStyle={{fontSize:11}} formatter={v=>fmtM(v)} />
            <Legend wrapperStyle={{fontSize:11}} />
            <Bar dataKey="total" name="Total Exposure" fill={T.navy} radius={[3,3,0,0]} />
            <Bar dataKey="aligned" name="Aligned Exposure" fill={T.green} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <table style={{...S.table,marginTop:12}}>
          <thead>
            <tr><th style={S.th}>Maturity</th><th style={{...S.th,textAlign:'right'}}>Total</th><th style={{...S.th,textAlign:'right'}}>Aligned</th><th style={{...S.th,textAlign:'right'}}>GAR %</th></tr>
          </thead>
          <tbody>
            {maturityProfile.map((m,i)=>(
              <tr key={m.bucket} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{m.bucket}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtM(m.total)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtM(m.aligned)}</td>
                <td style={{...S.td,textAlign:'right',color:m.gar>10?T.green:T.amber}}>{fmtPct(m.gar)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EPC distribution */}
      <div style={S.card}>
        <div style={S.cardTitle}>GAR by EPC Rating (Real Estate & Mortgage Exposures)</div>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>EPC Rating</th><th style={{...S.th,textAlign:'right'}}>Count</th><th style={{...S.th,textAlign:'right'}}>Exposure (EUR M)</th><th style={{...S.th,textAlign:'right'}}>Aligned (EUR M)</th><th style={{...S.th,textAlign:'right'}}>Alignment Rate</th></tr>
          </thead>
          <tbody>
            {epcDistribution.map((e,i)=>(
              <tr key={e.rating} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:700}}><span style={S.badge(['A+','A','B'].includes(e.rating)?T.green:['C','D'].includes(e.rating)?T.amber:e.rating==='N/A'?T.textMut:T.red)}>{e.rating}</span></td>
                <td style={{...S.td,textAlign:'right'}}>{e.count}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtM(e.exposure)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtM(e.aligned)}</td>
                <td style={{...S.td,textAlign:'right'}}>{e.exposure>0?fmtPct(e.aligned/e.exposure*100):'-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Counterparty Type Breakdown */}
      <div style={S.card}>
        <div style={S.cardTitle}>GAR by Counterparty Type (CRR Classification)</div>
        {(() => {
          const map = {};
          positions.forEach(p => {
            if (!map[p.counterpartyType]) map[p.counterpartyType] = {type:p.counterpartyType,total:0,eligible:0,aligned:0,count:0,avgInterestRate:0,avgMaturity:0};
            map[p.counterpartyType].total += p.exposureEurM;
            if (p.eligible) map[p.counterpartyType].eligible += p.exposureEurM;
            if (p.aligned) map[p.counterpartyType].aligned += p.exposureEurM;
            map[p.counterpartyType].count++;
            map[p.counterpartyType].avgInterestRate += p.interestRate;
            map[p.counterpartyType].avgMaturity += p.maturityYears;
          });
          const data = Object.values(map).map(d => ({...d,avgInterestRate:d.avgInterestRate/d.count,avgMaturity:d.avgMaturity/d.count,gar:d.total>0?(d.aligned/d.total*100):0})).sort((a,b)=>b.total-a.total);
          return (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Counterparty Type</th>
                  <th style={{...S.th,textAlign:'right'}}>Total (EUR M)</th>
                  <th style={{...S.th,textAlign:'right'}}>Eligible (EUR M)</th>
                  <th style={{...S.th,textAlign:'right'}}>Aligned (EUR M)</th>
                  <th style={{...S.th,textAlign:'right'}}>GAR %</th>
                  <th style={{...S.th,textAlign:'right'}}>Positions</th>
                  <th style={{...S.th,textAlign:'right'}}>Avg Rate</th>
                  <th style={{...S.th,textAlign:'right'}}>Avg Maturity (yr)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d,i)=>(
                  <tr key={d.type} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                    <td style={{...S.td,fontWeight:600}}>{d.type}</td>
                    <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(d.total,1)}</td>
                    <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(d.eligible,1)}</td>
                    <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(d.aligned,1)}</td>
                    <td style={{...S.td,textAlign:'right',color:d.gar>10?T.green:d.gar>0?T.amber:T.textMut}}>{fmtPct(d.gar)}</td>
                    <td style={{...S.td,textAlign:'center'}}>{d.count}</td>
                    <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(d.avgInterestRate)}</td>
                    <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(d.avgMaturity,1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </div>

      {/* Risk-Weighted GAR */}
      <div style={S.card}>
        <div style={S.cardTitle}>Risk-Weighted Asset (RWA) Analysis by Taxonomy Status</div>
        {(() => {
          const categories = [
            {label:'Taxonomy-Aligned (Green)',filter:p=>p.aligned,color:T.green},
            {label:'Eligible, Not Aligned',filter:p=>p.eligible&&!p.aligned,color:T.amber},
            {label:'Not Eligible',filter:p=>!p.eligible,color:T.textMut},
          ];
          const data = categories.map(c=>{
            const items = positions.filter(c.filter);
            const totalExp = items.reduce((s,p)=>s+p.exposureEurM,0);
            const weightedPD = items.length>0?items.reduce((s,p)=>s+p.pd*p.exposureEurM,0)/totalExp:0;
            const weightedLGD = items.length>0?items.reduce((s,p)=>s+p.lgd*p.exposureEurM,0)/totalExp:0;
            const rwa = totalExp * weightedPD/100 * weightedLGD/100 * 12.5;
            const rwaToExposure = totalExp>0?(rwa/totalExp*100):0;
            return {...c,count:items.length,exposure:totalExp,weightedPD,weightedLGD,rwa,rwaToExposure};
          });
          return (
            <>
              <div style={{display:'flex',gap:16,marginBottom:16}}>
                {data.map(d=>(
                  <div key={d.label} style={{flex:1,padding:'14px 18px',borderRadius:6,border:`1px solid ${T.border}`,borderLeft:`4px solid ${d.color}`}}>
                    <div style={{fontSize:12,fontWeight:700,color:d.color}}>{d.label}</div>
                    <div style={{fontSize:20,fontWeight:700,color:T.navy,marginTop:4}}>{fmtM(d.exposure)}</div>
                    <div style={{fontSize:11,color:T.textSec}}>{d.count} positions | Avg PD: {fmtPct(d.weightedPD)} | Avg LGD: {fmtPct(d.weightedLGD)}</div>
                    <div style={{fontSize:11,color:T.textSec}}>RWA: EUR {fmt(d.rwa,1)}M | RWA/Exposure: {fmtPct(d.rwaToExposure)}</div>
                  </div>
                ))}
              </div>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Taxonomy Status</th>
                    <th style={{...S.th,textAlign:'right'}}>Exposure (EUR M)</th>
                    <th style={{...S.th,textAlign:'right'}}>Positions</th>
                    <th style={{...S.th,textAlign:'right'}}>Wtd Avg PD</th>
                    <th style={{...S.th,textAlign:'right'}}>Wtd Avg LGD</th>
                    <th style={{...S.th,textAlign:'right'}}>RWA (EUR M)</th>
                    <th style={{...S.th,textAlign:'right'}}>RWA/Exposure</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d,i)=>(
                    <tr key={d.label} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                      <td style={{...S.td,fontWeight:600}}><span style={{color:d.color}}>{d.label}</span></td>
                      <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(d.exposure,1)}</td>
                      <td style={{...S.td,textAlign:'center'}}>{d.count}</td>
                      <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(d.weightedPD)}</td>
                      <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(d.weightedLGD)}</td>
                      <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(d.rwa,1)}</td>
                      <td style={{...S.td,textAlign:'right'}}>{fmtPct(d.rwaToExposure)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          );
        })()}
      </div>

      {/* Green vs Brown bar chart */}
      <div style={S.card}>
        <div style={S.cardTitle}>Green vs Transitional vs Brown -- Exposure Distribution</div>
        {(() => {
          const naceGreenBrown = positions.map(p => {
            const greenNACE = ['D35.11','D35.12','D35.13','F41.10','F41.20','H49.10','H49.20','H49.31','L68.10','L68.20','J62.01','M71.12'];
            const brownNACE = ['B06.10','B06.20','C20.13','K64.19','K65.11'];
            const cat = greenNACE.includes(p.naceCode)?'Green':brownNACE.includes(p.naceCode)?'Brown':'Transitional';
            return {...p,greenBrownCat:cat};
          });
          const catData = ['Green','Transitional','Brown'].map(cat=>{
            const items = naceGreenBrown.filter(p=>p.greenBrownCat===cat);
            return {category:cat,count:items.length,exposure:items.reduce((s,p)=>s+p.exposureEurM,0),
              avgScope1:items.length>0?items.reduce((s,p)=>s+p.scope1tCO2e,0)/items.length:0,
              avgScope2:items.length>0?items.reduce((s,p)=>s+p.scope2tCO2e,0)/items.length:0};
          });
          return (
            <div style={{display:'flex',gap:20}}>
              <ResponsiveContainer width="40%" height={200}>
                <PieChart>
                  <Pie data={catData} dataKey="exposure" nameKey="category" cx="50%" cy="50%" innerRadius={40} outerRadius={80}>
                    {catData.map((d,i)=><Cell key={i} fill={d.category==='Green'?T.green:d.category==='Brown'?T.red:T.amber} />)}
                  </Pie>
                  <Tooltip formatter={v=>fmtM(v)} contentStyle={{fontSize:11}} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{flex:1}}>
                <table style={S.table}>
                  <thead>
                    <tr><th style={S.th}>Category</th><th style={{...S.th,textAlign:'right'}}>Positions</th><th style={{...S.th,textAlign:'right'}}>Exposure</th><th style={{...S.th,textAlign:'right'}}>Avg Scope 1</th><th style={{...S.th,textAlign:'right'}}>Avg Scope 2</th></tr>
                  </thead>
                  <tbody>
                    {catData.map((d,i)=>(
                      <tr key={d.category} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                        <td style={{...S.td,fontWeight:700}}><span style={S.badge(d.category==='Green'?T.green:d.category==='Brown'?T.red:T.amber)}>{d.category}</span></td>
                        <td style={{...S.td,textAlign:'right'}}>{d.count}</td>
                        <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtM(d.exposure)}</td>
                        <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(d.avgScope1,0)}</td>
                        <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(d.avgScope2,0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>

      {/* TSC reference mapping detail */}
      <div style={S.card}>
        <div style={S.cardTitle}>TSC Reference Mapping -- Portfolio Positions by Technical Screening Criterion</div>
        {(() => {
          const tscMap = {};
          positions.filter(p=>p.tscRef!=='N/A').forEach(p=>{
            if(!tscMap[p.tscRef]) tscMap[p.tscRef]={tsc:p.tscRef,count:0,exposure:0,aligned:0,naceCode:p.naceCode,naceDesc:p.naceDesc};
            tscMap[p.tscRef].count++;
            tscMap[p.tscRef].exposure+=p.exposureEurM;
            if(p.aligned) tscMap[p.tscRef].aligned+=p.exposureEurM;
          });
          const tscData = Object.values(tscMap).sort((a,b)=>b.exposure-a.exposure);
          return (
            <table style={S.table}>
              <thead>
                <tr><th style={S.th}>TSC Ref</th><th style={S.th}>NACE</th><th style={S.th}>Activity</th><th style={{...S.th,textAlign:'right'}}>Count</th><th style={{...S.th,textAlign:'right'}}>Exposure</th><th style={{...S.th,textAlign:'right'}}>Aligned</th><th style={{...S.th,textAlign:'right'}}>Alignment Rate</th></tr>
              </thead>
              <tbody>
                {tscData.map((d,i)=>(
                  <tr key={d.tsc} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                    <td style={{...S.td,fontWeight:700,fontFamily:T.mono,color:T.green}}>{d.tsc}</td>
                    <td style={{...S.td,fontFamily:T.mono}}>{d.naceCode}</td>
                    <td style={S.td}>{d.naceDesc}</td>
                    <td style={{...S.td,textAlign:'right'}}>{d.count}</td>
                    <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtM(d.exposure)}</td>
                    <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtM(d.aligned)}</td>
                    <td style={{...S.td,textAlign:'right'}}>{d.exposure>0?fmtPct(d.aligned/d.exposure*100):'-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </div>

      {/* GAR quarterly trend */}
      <div style={S.card}>
        <div style={S.cardTitle}>Quarterly GAR Trend (Internal Tracking)</div>
        {(() => {
          const qtrData = [
            {qtr:'Q1 2023',turnover:4.8,capex:6.1,opex:3.8,eligible:30.5,newOrigination:2.1},
            {qtr:'Q2 2023',turnover:4.9,capex:6.4,opex:3.9,eligible:31.2,newOrigination:1.8},
            {qtr:'Q3 2023',turnover:5.0,capex:6.8,opex:4.1,eligible:32.0,newOrigination:2.5},
            {qtr:'Q4 2023',turnover:5.1,capex:7.0,opex:4.3,eligible:31.2,newOrigination:3.2},
            {qtr:'Q1 2024',turnover:5.8,capex:7.8,opex:4.5,eligible:33.5,newOrigination:2.8},
            {qtr:'Q2 2024',turnover:6.5,capex:8.5,opex:5.0,eligible:34.8,newOrigination:3.5},
            {qtr:'Q3 2024',turnover:7.0,capex:9.2,opex:5.3,eligible:35.2,newOrigination:4.1},
            {qtr:'Q4 2024',turnover:7.3,capex:9.8,opex:5.6,eligible:35.8,newOrigination:4.8},
            {qtr:'Q1 2025',turnover:8.1,capex:10.5,opex:6.2,eligible:37.2,newOrigination:5.2},
          ];
          return (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={qtrData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="qtr" tick={{fontSize:10,fill:T.textSec}} />
                  <YAxis tick={{fontSize:10,fill:T.textSec}} unit="%" />
                  <Tooltip contentStyle={{fontSize:11}} />
                  <Legend wrapperStyle={{fontSize:10}} />
                  <Line type="monotone" dataKey="turnover" name="Turnover GAR" stroke={T.green} strokeWidth={2} />
                  <Line type="monotone" dataKey="capex" name="CapEx GAR" stroke={T.sage} strokeWidth={2} />
                  <Line type="monotone" dataKey="opex" name="OpEx GAR" stroke={T.gold} strokeWidth={2} />
                  <Line type="monotone" dataKey="eligible" name="Eligible %" stroke={T.navy} strokeWidth={1} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
              <table style={{...S.table,marginTop:12}}>
                <thead>
                  <tr><th style={S.th}>Quarter</th><th style={{...S.th,textAlign:'right'}}>Turnover</th><th style={{...S.th,textAlign:'right'}}>CapEx</th><th style={{...S.th,textAlign:'right'}}>OpEx</th><th style={{...S.th,textAlign:'right'}}>Eligible %</th><th style={{...S.th,textAlign:'right'}}>New Green Origination (EUR Bn)</th></tr>
                </thead>
                <tbody>
                  {qtrData.map((q,i)=>(
                    <tr key={q.qtr} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                      <td style={{...S.td,fontWeight:600,fontFamily:T.mono}}>{q.qtr}</td>
                      <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:T.green}}>{fmtPct(q.turnover)}</td>
                      <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(q.capex)}</td>
                      <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(q.opex)}</td>
                      <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(q.eligible)}</td>
                      <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(q.newOrigination,1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          );
        })()}
      </div>

      {/* Regulatory methodology notes */}
      <div style={S.card}>
        <div style={S.cardTitle}>EBA GAR Methodology Notes</div>
        <div style={{fontSize:12,lineHeight:1.8,color:T.textSec}}>
          <p><strong>1. Covered Assets (Denominator):</strong> Per CRR Art. 449a(1)(a), the denominator includes total on-balance-sheet assets excluding: (i) exposures to central governments, central banks, supranational issuers; (ii) exposures to entities not subject to NFRD/CSRD; (iii) trading book exposures; (iv) on-demand interbank loans.</p>
          <p><strong>2. Taxonomy-Aligned Assets (Numerator):</strong> Only exposures meeting ALL THREE conditions: (a) Substantial Contribution to at least one environmental objective per Climate/Environmental Delegated Acts; (b) Do No Significant Harm to remaining five objectives per Art. 17; (c) Minimum Safeguards compliance per Art. 18 (OECD, UNGP, ILO, IBHR).</p>
          <p><strong>3. GAR Variants:</strong> Turnover GAR uses counterparty's taxonomy-aligned turnover share. CapEx GAR uses taxonomy-aligned capital expenditure share (forward-looking). OpEx GAR uses taxonomy-aligned operating expenditure share (supplementary).</p>
          <p><strong>4. Phase-in:</strong> FY2022: eligible only. FY2023: eligible + aligned (CCM/CCA only). FY2024+: full 6-objective alignment required, plus BTAR.</p>
          <p><strong>5. Data Requirements:</strong> Counterparty taxonomy reporting under CSRD/NFRD. For SMEs/non-reporting entities: proxy methodology per EBA guidelines (NACE code mapping, estimated alignment).</p>
          <p><strong>6. Verification:</strong> External assurance of GAR figures expected from FY2025 per EBA supervisory expectations. Internal audit function must validate methodology and data quality.</p>
          <p><strong>7. Transition Plan Link:</strong> GAR targets should be embedded in the institution's transition plan per ECB supervisory expectations and ESRS E1-9. A credible transition plan requires year-on-year GAR improvement trajectory linked to new origination strategy, portfolio management, and counterparty engagement.</p>
          <p><strong>8. SME Treatment:</strong> For SMEs not subject to NFRD/CSRD reporting, the EBA allows a simplified approach: NACE code-based eligibility assessment with reduced data requirements. However, alignment assessment still requires DNSH and Minimum Safeguards evidence.</p>
          <p><strong>9. Sovereign & Central Bank:</strong> Exposures to EU member state central governments and central banks are excluded from the GAR denominator but included in the BTAR denominator. This is the primary driver of the GAR-BTAR differential.</p>
          <p><strong>10. Double Counting Prevention:</strong> Where an activity qualifies under multiple environmental objectives (e.g., CCM and CE), the exposure is counted only once in the GAR numerator using the primary objective designation.</p>
        </div>
      </div>

      {/* Data Quality Dashboard */}
      <div style={S.card}>
        <div style={S.cardTitle}>GAR Data Quality Dashboard</div>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>Data Field</th><th style={S.th}>Source</th><th style={{...S.th,textAlign:'right'}}>Coverage</th><th style={S.th}>Quality</th><th style={S.th}>Gap / Remediation</th></tr>
          </thead>
          <tbody>
            {[
              {field:'NACE Code (4-digit)',source:'BvD Orbis / Internal',coverage:'95%',quality:'High',gap:'5% manually mapped from SIC'},
              {field:'Taxonomy Eligibility Flag',source:'NACE-to-Delegated Act mapping',coverage:'100%',quality:'High',gap:'Rule-based, fully automated'},
              {field:'Turnover Alignment %',source:'CSRD/NFRD reports',coverage:'42%',quality:'Medium',gap:'58% estimated from NACE sector averages'},
              {field:'CapEx Alignment %',source:'CSRD/NFRD reports',coverage:'38%',quality:'Medium',gap:'62% estimated; FY2025 CSRD will improve'},
              {field:'OpEx Alignment %',source:'CSRD/NFRD reports',coverage:'28%',quality:'Low',gap:'72% estimated; OpEx disclosure less mature'},
              {field:'DNSH Evidence',source:'Counterparty questionnaire',coverage:'55%',quality:'Medium',gap:'45% based on sector-level proxy assessment'},
              {field:'Min Safeguards Screen',source:'RepRisk + UNGC status',coverage:'80%',quality:'Medium-High',gap:'20% SMEs require manual assessment'},
              {field:'EPC Rating',source:'National registries',coverage:'62%',quality:'Medium',gap:'38% missing; primarily older commercial stock'},
              {field:'Scope 1+2 Emissions',source:'CDP / company reports',coverage:'75%',quality:'Medium',gap:'25% PCAF-estimated from revenue and sector factors'},
              {field:'Counterparty Type (CRR)',source:'Internal classification',coverage:'100%',quality:'High',gap:'Fully automated from credit system'},
            ].map((r,i)=>(
              <tr key={i} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{r.field}</td>
                <td style={S.td}>{r.source}</td>
                <td style={{...S.td,textAlign:'right'}}><span style={S.badge(parseInt(r.coverage)>80?T.green:parseInt(r.coverage)>50?T.amber:T.red)}>{r.coverage}</span></td>
                <td style={S.td}><span style={S.badge(r.quality==='High'?T.green:r.quality.includes('Medium')?T.amber:T.red)}>{r.quality}</span></td>
                <td style={{...S.td,fontSize:11}}>{r.gap}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action plan */}
      <div style={S.card}>
        <div style={S.cardTitle}>GAR Improvement Action Plan -- 2025-2030</div>
        <table style={S.table}>
          <thead>
            <tr><th style={S.th}>#</th><th style={S.th}>Initiative</th><th style={S.th}>Target GAR Impact</th><th style={S.th}>Investment</th><th style={S.th}>Timeline</th><th style={S.th}>Owner</th><th style={S.th}>Status</th></tr>
          </thead>
          <tbody>
            {[
              {id:1,init:'Green mortgage origination programme',impact:'+2.5 pp',invest:'EUR 15M platform',timeline:'2025-2027',owner:'Retail Banking',status:'In Progress'},
              {id:2,init:'Renewable project finance expansion',impact:'+1.8 pp',invest:'EUR 5M due diligence',timeline:'2025-2026',owner:'Corporate Banking',status:'In Progress'},
              {id:3,init:'DNSH documentation improvement',impact:'+1.2 pp',invest:'EUR 2M consulting',timeline:'2025',owner:'Sustainability',status:'Planned'},
              {id:4,init:'Counterparty engagement on taxonomy data',impact:'+0.8 pp',invest:'EUR 1M engagement',timeline:'2025-2026',owner:'Client Coverage',status:'Planned'},
              {id:5,init:'SME green lending products',impact:'+0.5 pp',invest:'EUR 3M product dev',timeline:'2026',owner:'SME Banking',status:'Planned'},
              {id:6,init:'Green building retrofit finance',impact:'+1.5 pp',invest:'EUR 8M programme',timeline:'2026-2028',owner:'Real Estate Finance',status:'Planned'},
              {id:7,init:'Carbon-intensive exposure run-off',impact:'+1.0 pp (denominator)',invest:'Opportunity cost',timeline:'2025-2030',owner:'Portfolio Mgmt',status:'In Progress'},
              {id:8,init:'Climate data infrastructure upgrade',impact:'Enabler',invest:'EUR 5M IT capex',timeline:'2025-2026',owner:'IT / Data',status:'In Progress'},
              {id:9,init:'CSRD data integration pipeline',impact:'+2.0 pp (data quality)',invest:'EUR 3M IT capex',timeline:'2026',owner:'IT / Sustainability',status:'Planned'},
              {id:10,init:'Board target: 22% GAR by 2030',impact:'Strategic anchor',invest:'N/A',timeline:'2025',owner:'Board / CRO',status:'Approved'},
              {id:11,init:'Taxonomy training programme for RMs',impact:'Enabler (data quality)',invest:'EUR 0.5M training',timeline:'2025',owner:'HR / Sustainability',status:'In Progress'},
              {id:12,init:'Green bond issuance framework',impact:'+0.3 pp (funding cost benefit)',invest:'EUR 1M legal/structuring',timeline:'2025-2026',owner:'Treasury',status:'Planned'},
              {id:13,init:'EPC upgrade financing facility',impact:'+1.0 pp',invest:'EUR 10M programme',timeline:'2026-2028',owner:'Retail / RE Finance',status:'Planned'},
              {id:14,init:'Sustainability-linked loan conversion',impact:'+0.5 pp',invest:'EUR 2M product dev',timeline:'2025-2026',owner:'Corporate Banking',status:'In Progress'},
              {id:15,init:'Third-party taxonomy data vendor',impact:'Enabler (coverage +30pp)',invest:'EUR 2M annual license',timeline:'2025',owner:'Data / Procurement',status:'Evaluation'},
            ].map((r,i)=>(
              <tr key={r.id} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={S.td}>{r.id}</td>
                <td style={{...S.td,fontWeight:600}}>{r.init}</td>
                <td style={{...S.td,fontFamily:T.mono,color:T.green}}>{r.impact}</td>
                <td style={S.td}>{r.invest}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{r.timeline}</td>
                <td style={S.td}>{r.owner}</td>
                <td style={S.td}><span style={S.badge(r.status==='In Progress'?T.amber:r.status==='Approved'?T.green:T.textMut)}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =========================================================================
// EXPANDED TAB: DNSH Deep Dive & Climate Risk Assessment
// =========================================================================
const TabDNSHDeepDive = ({positions}) => {
  const eligiblePositions = useMemo(()=>positions.filter(p=>p.eligible),[positions]);

  // Climate risk assessment for CCA DNSH
  const climateRiskAssessment = useMemo(()=>{
    return eligiblePositions.slice(0,20).map((p,i)=>{
      const acute = {flood:rng(1,9,p.id*401),heatwave:rng(1,8,p.id*403),storm:rng(1,7,p.id*407),wildfire:rng(1,6,p.id*409)};
      const chronic = {seaLevel:rng(1,8,p.id*411),drought:rng(1,7,p.id*413),waterStress:rng(1,8,p.id*417),tempIncrease:rng(1,9,p.id*419)};
      const overallRisk = Math.max(...Object.values(acute),...Object.values(chronic));
      const adaptationPlan = sr(p.id*421)>0.35;
      return {...p, acute, chronic, overallRisk, adaptationPlan, rcp45Impact: rng(0.5, 4.0, p.id*423), rcp85Impact: rng(1.0, 8.0, p.id*427)};
    });
  },[eligiblePositions]);

  // Water Framework Directive compliance
  const waterCompliance = useMemo(()=>{
    return eligiblePositions.slice(0,15).map((p,i)=>({
      ...p,
      waterWithdrawal: rng(100, 50000, p.id*501),
      waterDischarge: rng(50, 30000, p.id*503),
      bodLevel: rng(2, 45, p.id*507),
      nitrogenLevel: rng(1, 25, p.id*509),
      wfdCompliant: sr(p.id*511)>0.3,
      eiaCompleted: sr(p.id*513)>0.25,
    }));
  },[eligiblePositions]);

  // Circular economy criteria
  const ceCompliance = useMemo(()=>{
    return eligiblePositions.slice(0,15).map((p,i)=>({
      ...p,
      wasteReusePct: rng(20, 95, p.id*601),
      recyclabilityPct: rng(15, 90, p.id*603),
      hazardousWasteTonnes: rng(5, 500, p.id*607),
      eprScheme: sr(p.id*609)>0.4,
      targetMet: sr(p.id*611)>0.35,
    }));
  },[eligiblePositions]);

  return (
    <div>
      <div style={S.card}>
        <div style={S.cardTitle}>Climate Risk Assessment for CCA DNSH (Taxonomy Regulation Appendix A)</div>
        <div style={S.citationBox}>
          <strong>Requirement:</strong> For the CCA DNSH criterion, a climate risk and vulnerability assessment is required covering both acute and chronic physical climate hazards. Assessment must use at least RCP 4.5 and RCP 8.5 scenarios over 10-30 year time horizons.
        </div>
        <div style={{overflowX:'auto',marginTop:12}}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Borrower</th><th style={S.th}>NACE</th>
                <th style={S.th}>Flood</th><th style={S.th}>Heat</th><th style={S.th}>Storm</th><th style={S.th}>Fire</th>
                <th style={S.th}>Sea Lvl</th><th style={S.th}>Drought</th><th style={S.th}>Water</th><th style={S.th}>Temp</th>
                <th style={S.th}>Overall</th><th style={S.th}>RCP 4.5</th><th style={S.th}>RCP 8.5</th>
                <th style={S.th}>Adaptation Plan</th>
              </tr>
            </thead>
            <tbody>
              {climateRiskAssessment.map((p,i)=>(
                <tr key={p.id} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                  <td style={{...S.td,fontWeight:600,maxWidth:130,overflow:'hidden',textOverflow:'ellipsis'}}>{p.borrower}</td>
                  <td style={{...S.td,fontFamily:T.mono,fontSize:10}}>{p.naceCode}</td>
                  {Object.values(p.acute).map((v,j)=><td key={'a'+j} style={{...S.td,textAlign:'center'}}><span style={S.badge(v>6?T.red:v>3?T.amber:T.green)}>{v.toFixed(1)}</span></td>)}
                  {Object.values(p.chronic).map((v,j)=><td key={'c'+j} style={{...S.td,textAlign:'center'}}><span style={S.badge(v>6?T.red:v>3?T.amber:T.green)}>{v.toFixed(1)}</span></td>)}
                  <td style={{...S.td,textAlign:'center',fontWeight:700}}><span style={S.badge(p.overallRisk>6?T.red:p.overallRisk>3?T.amber:T.green)}>{p.overallRisk.toFixed(1)}</span></td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmtPct(p.rcp45Impact)}</td>
                  <td style={{...S.td,textAlign:'right',fontFamily:T.mono,color:T.red}}>{fmtPct(p.rcp85Impact)}</td>
                  <td style={S.td}>{p.adaptationPlan?<span style={S.badge(T.green)}>YES</span>:<span style={S.badge(T.red)}>NO</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Water Framework Directive Compliance (DNSH for Water Objective)</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Borrower</th><th style={S.th}>NACE</th>
              <th style={{...S.th,textAlign:'right'}}>Water Withdrawal (m3)</th><th style={{...S.th,textAlign:'right'}}>Discharge (m3)</th>
              <th style={{...S.th,textAlign:'right'}}>BOD (mg/L)</th><th style={{...S.th,textAlign:'right'}}>Nitrogen (mg/L)</th>
              <th style={S.th}>WFD Compliant</th><th style={S.th}>EIA Complete</th>
            </tr>
          </thead>
          <tbody>
            {waterCompliance.map((p,i)=>(
              <tr key={p.id} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{p.borrower}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{p.naceCode}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(p.waterWithdrawal,0)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(p.waterDischarge,0)}</td>
                <td style={{...S.td,textAlign:'right'}}>{fmt(p.bodLevel,1)}</td>
                <td style={{...S.td,textAlign:'right'}}>{fmt(p.nitrogenLevel,1)}</td>
                <td style={S.td}>{p.wfdCompliant?<span style={S.badge(T.green)}>YES</span>:<span style={S.badge(T.red)}>NO</span>}</td>
                <td style={S.td}>{p.eiaCompleted?<span style={S.badge(T.green)}>YES</span>:<span style={S.badge(T.red)}>NO</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Circular Economy Criteria (DNSH for CE Objective)</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Borrower</th><th style={S.th}>NACE</th>
              <th style={{...S.th,textAlign:'right'}}>Waste Reuse %</th><th style={{...S.th,textAlign:'right'}}>Recyclability %</th>
              <th style={{...S.th,textAlign:'right'}}>Haz. Waste (t)</th>
              <th style={S.th}>EPR Scheme</th><th style={S.th}>Target Met</th>
            </tr>
          </thead>
          <tbody>
            {ceCompliance.map((p,i)=>(
              <tr key={p.id} style={{background:i%2===0?T.surfaceH:'transparent'}}>
                <td style={{...S.td,fontWeight:600}}>{p.borrower}</td>
                <td style={{...S.td,fontFamily:T.mono}}>{p.naceCode}</td>
                <td style={{...S.td,textAlign:'right'}}><span style={S.badge(p.wasteReusePct>=70?T.green:T.amber)}>{fmtPct(p.wasteReusePct)}</span></td>
                <td style={{...S.td,textAlign:'right'}}>{fmtPct(p.recyclabilityPct)}</td>
                <td style={{...S.td,textAlign:'right',fontFamily:T.mono}}>{fmt(p.hazardousWasteTonnes,0)}</td>
                <td style={S.td}>{p.eprScheme?<span style={S.badge(T.green)}>YES</span>:<span style={S.badge(T.red)}>NO</span>}</td>
                <td style={S.td}>{p.targetMet?<span style={S.badge(T.green)}>PASS</span>:<span style={S.badge(T.red)}>FAIL</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =========================================================================
// MAIN COMPONENT
// =========================================================================
const TABS = [
  {key:'gar',label:'GAR Calculator'},
  {key:'btar',label:'BTAR'},
  {key:'eligibility',label:'Taxonomy Eligibility'},
  {key:'dnsh',label:'DNSH Assessment'},
  {key:'safeguards',label:'Minimum Safeguards'},
  {key:'pillar3',label:'EBA Pillar 3 Templates'},
  {key:'export',label:'Downstream & Export'},
  {key:'sensitivity',label:'Sensitivity & Drill-Down'},
  {key:'dnshdeep',label:'DNSH Deep Dive'},
];

export default function GreenAssetRatioPage() {
  const [activeTab, setActiveTab] = useState('gar');

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerTitle}>Green Asset Ratio (GAR) -- EU Taxonomy Compliance</div>
        <div style={S.headerSub}>EP-AJ3 | CRR Art. 449a | EBA ITS on Pillar 3 ESG Disclosures | EU Taxonomy Regulation (EU) 2020/852</div>
        <div style={S.citation}>
          Frameworks: EU Taxonomy Climate Delegated Act (2021/2139) | Environmental Delegated Act (2023/2486) | EBA/ITS/2022/01
        </div>
      </div>

      {/* Tab Bar */}
      <div style={S.tabBar}>
        {TABS.map(t => (
          <div key={t.key} style={S.tab(activeTab===t.key)} onClick={()=>setActiveTab(t.key)}>{t.label}</div>
        ))}
      </div>

      {/* Tab Content */}
      <div style={S.body}>
        {activeTab === 'gar' && <TabGARCalculator positions={LOAN_POSITIONS} />}
        {activeTab === 'btar' && <TabBTAR positions={LOAN_POSITIONS} />}
        {activeTab === 'eligibility' && <TabTaxonomyEligibility positions={LOAN_POSITIONS} />}
        {activeTab === 'dnsh' && <TabDNSH positions={LOAN_POSITIONS} />}
        {activeTab === 'safeguards' && <TabMinSafeguards positions={LOAN_POSITIONS} />}
        {activeTab === 'pillar3' && <TabEBAPillar3 positions={LOAN_POSITIONS} />}
        {activeTab === 'export' && <TabDownstreamExport />}
        {activeTab === 'sensitivity' && <TabGARSensitivity positions={LOAN_POSITIONS} />}
        {activeTab === 'dnshdeep' && <TabDNSHDeepDive positions={LOAN_POSITIONS} />}
      </div>
    </div>
  );
}
