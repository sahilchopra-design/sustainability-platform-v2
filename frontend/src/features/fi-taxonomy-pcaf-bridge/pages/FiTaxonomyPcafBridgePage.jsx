import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ComposedChart, Area, AreaChart } from 'recharts';

const T={bg:'#f4f6f9',surface:'#ffffff',surfaceH:'#eef1f6',border:'#e3e8ef',borderL:'#cfd6e0',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const fmt = (n,d=1) => n==null?'--':Number(n).toFixed(d);
const fmtPct=(n)=>n==null?'--':Number(n).toFixed(1)+'%';
const fmtMn=(n)=>n==null?'--':'$'+Number(n).toFixed(0)+'M';
const fmtBn=(n)=>n==null?'--':'$'+Number(n).toFixed(1)+'Bn';
// Computed from the current date rather than hardcoded, so this doesn't go
// stale the way "Q1 2026" did (still showing Q1 when opened well into Q3).
const currentRegulatoryQuarter = (() => {
  const now = new Date();
  return `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
})();

// ============ DATA BLOCKS ============
// `fe` (financed emissions) per class is NOT hardcoded here — it's derived
// in assetClassBreakdown below by distributing the single headline FE total
// (stats.fe, from LOAN_BOOK) via each class's `weight`, so it always
// reconciles with every other FE figure on this page (see assetClassBreakdown).
const ASSET_CLASSES = [
  { id: 'AC1', name: 'Listed Equity', code: 'EQ', weight: 0.14, pcafCoverage: 92, taxonomyCoverage: 71, dqs: 2.1 },
  { id: 'AC2', name: 'Corporate Bonds', code: 'CB', weight: 0.22, pcafCoverage: 88, taxonomyCoverage: 64, dqs: 2.4 },
  { id: 'AC3', name: 'Business Loans', code: 'BL', weight: 0.28, pcafCoverage: 78, taxonomyCoverage: 58, dqs: 3.2 },
  { id: 'AC4', name: 'Project Finance', code: 'PF', weight: 0.08, pcafCoverage: 96, taxonomyCoverage: 84, dqs: 1.8 },
  { id: 'AC5', name: 'CRE Loans', code: 'CRE', weight: 0.11, pcafCoverage: 82, taxonomyCoverage: 69, dqs: 2.7 },
  { id: 'AC6', name: 'Residential Mortgages', code: 'MTG', weight: 0.13, pcafCoverage: 95, taxonomyCoverage: 74, dqs: 2.2 },
  { id: 'AC7', name: 'Motor Vehicle Loans', code: 'MV', weight: 0.04, pcafCoverage: 90, taxonomyCoverage: 52, dqs: 2.9 },
];

const SECTORS = ['Energy','Utilities','Materials','Industrials','Real Estate','Transport','Agriculture','Financials'];
const TAX_STATUS = ['Aligned','Eligible','Non-Eligible','Excluded'];
const LOAN_BOOK = Array.from({length:30}, (_,i)=>{
  const sector = SECTORS[i % SECTORS.length];
  const ead = 50 + sr(i*3+1)*950;
  const aligned = sr(i*7+2) < 0.38 ? sr(i*11+3)*0.82 : 0;
  const eligible = sr(i*13+4) < 0.55 ? sr(i*17+5)*0.42 : 0;
  const dqs = 1 + Math.floor(sr(i*19+6)*5);
  const pd = 0.001 + sr(i*23+7) * 0.08;
  const lgd = 0.25 + sr(i*29+8)*0.45;
  const intensity = 40 + sr(i*31+9)*180;
  return {
    id: `L${String(i+1).padStart(3,'0')}`,
    counterparty: `Obligor ${String.fromCharCode(65+(i%26))}-${Math.floor(i/26)+1}`,
    sector, ead: +ead.toFixed(1),
    alignedPct: +(aligned*100).toFixed(1),
    eligiblePct: +((aligned+eligible)*100).toFixed(1),
    dqs, pd: +(pd*100).toFixed(2), lgd: +(lgd*100).toFixed(1),
    ewb: +(ead*pd*lgd).toFixed(2),
    naceCode: ['B.05','C.20','D.35','F.41','H.49','L.68','A.01','K.64'][i%8],
    intensity: +intensity.toFixed(1),
    fe: +(ead*intensity/1000).toFixed(2),
    maturity: 1 + Math.floor(sr(i*37+10)*24),
  };
});

const MORTGAGE_POOL = Array.from({length:20}, (_,i)=>{
  const epc = ['A','B','C','D','E','F','G'][Math.floor(sr(i*3+1)*7)];
  const epcOrd = 'ABCDEFG'.indexOf(epc);
  const bal = 10 + sr(i*5+2)*90;
  const ltv = 45 + sr(i*7+3)*45;
  const taxonomyAlign = epcOrd <= 1 ? 0.85 : (epcOrd === 2 ? 0.22 : 0);
  const kwhM2 = [60,90,120,160,210,270,340][epcOrd];
  return {
    id: `MTG-${String(i+1).padStart(2,'0')}`,
    region: ['DE','FR','NL','IT','ES','BE','AT','IE'][i%8],
    vintage: 2015 + Math.floor(sr(i*11+4)*10),
    epc, epcOrd, balance: +bal.toFixed(1), ltv: +ltv.toFixed(1),
    alignedPct: +(taxonomyAlign*100).toFixed(1),
    kwhM2, dqs: epcOrd <= 2 ? 2 : (epcOrd <= 4 ? 3 : 4),
    emissions: +(kwhM2 * 0.24 * bal * 80 / 1000).toFixed(2),
    units: Math.floor(80 + sr(i*13+5)*400),
  };
});

const CRE_ASSETS = Array.from({length:15}, (_,i)=>{
  const typ = ['Office','Retail','Logistics','Hotel','Mixed','Industrial'][i%6];
  const epc = ['A','B','C','D','E','F'][Math.floor(sr(i*3+1)*6)];
  const epcOrd = 'ABCDEF'.indexOf(epc);
  const gav = 20 + sr(i*5+2)*180;
  const loan = gav * (0.5 + sr(i*7+3)*0.3);
  const aligned = epcOrd <= 1 ? 0.78 : (epcOrd === 2 ? 0.35 : 0);
  return {
    id: `CRE-${String(i+1).padStart(2,'0')}`,
    type: typ, city: ['London','Paris','Berlin','Madrid','Amsterdam','Milan','Vienna','Dublin'][i%8],
    epc, epcOrd, gav: +gav.toFixed(1), loan: +loan.toFixed(1),
    ltv: +(loan/gav*100).toFixed(1),
    alignedPct: +(aligned*100).toFixed(1),
    intensity: [30,50,75,110,160,220][epcOrd],
    retrofit: epcOrd >= 3 ? +(loan * 0.08).toFixed(2) : 0,
    dqs: epcOrd <= 2 ? 2 : 3,
  };
});

const INSURANCE_LOB = [
  { id: 'P&C-Motor', name: 'Motor (P&C)', grossPremium: 2840, technProv: 4120, greenShare: 18.4, scrBase: 512, naturalCat: 'Low' },
  { id: 'P&C-Prop', name: 'Commercial Property', grossPremium: 1920, technProv: 3850, greenShare: 24.7, scrBase: 687, naturalCat: 'High' },
  { id: 'Health', name: 'Health', grossPremium: 3640, technProv: 5120, greenShare: 9.2, scrBase: 420, naturalCat: 'Low' },
  { id: 'Life-Savings', name: 'Life Savings', grossPremium: 8920, technProv: 41200, greenShare: 31.5, scrBase: 2840, naturalCat: 'Low' },
  { id: 'Life-Protect', name: 'Life Protection', grossPremium: 2140, technProv: 12400, greenShare: 22.1, scrBase: 840, naturalCat: 'Low' },
  { id: 'Reins', name: 'Reinsurance Assumed', grossPremium: 1520, technProv: 2890, greenShare: 15.8, scrBase: 485, naturalCat: 'Very High' },
];

const KPI_TEMPLATES = [
  { id: 'KPI1', name: 'GAR Turnover', scope: 'Stock', metric: '% Turnover aligned', value: 18.4, benchmark: 22.1 },
  { id: 'KPI2', name: 'GAR CapEx', scope: 'Stock', metric: '% CapEx aligned', value: 27.6, benchmark: 31.0 },
  { id: 'KPI3', name: 'GAR OpEx', scope: 'Stock', metric: '% OpEx aligned', value: 14.2, benchmark: 18.9 },
  { id: 'KPI4', name: 'GAR Flow Turnover', scope: 'Flow', metric: 'New origination %', value: 24.8, benchmark: 26.5 },
  { id: 'KPI5', name: 'Trading Book GAR', scope: 'Trading', metric: 'Derivatives/HFT excl.', value: 6.7, benchmark: 8.4 },
  { id: 'KPI6', name: 'Fees & Commissions', scope: 'Services', metric: 'Advisory aligned %', value: 21.3, benchmark: 24.0 },
  { id: 'KPI7', name: 'Off-Balance Sheet', scope: 'OBS', metric: 'Guarantees aligned %', value: 12.5, benchmark: 16.8 },
];

const NACE_MAP = [
  { nace: 'A.01', desc: 'Crop & animal prod.', tsc: 'E: Climate Mitigation', eligible: 'Yes', ccmDNSH: 'Pass' },
  { nace: 'B.05', desc: 'Coal mining', tsc: 'Excluded', eligible: 'No', ccmDNSH: 'Fail' },
  { nace: 'B.06', desc: 'Oil & gas extraction', tsc: 'Excluded', eligible: 'No', ccmDNSH: 'Fail' },
  { nace: 'C.10', desc: 'Food manufacturing', tsc: 'N/A', eligible: 'No', ccmDNSH: '--' },
  { nace: 'C.19', desc: 'Coke & petroleum', tsc: 'Excluded', eligible: 'No', ccmDNSH: 'Fail' },
  { nace: 'C.20', desc: 'Chemicals manufacturing', tsc: '3.10 Hydrogen', eligible: 'Partial', ccmDNSH: 'Cond.' },
  { nace: 'C.23', desc: 'Cement / glass / lime', tsc: '3.7 Cement', eligible: 'Partial', ccmDNSH: 'Cond.' },
  { nace: 'C.24', desc: 'Basic metals (steel)', tsc: '3.9 Iron & Steel', eligible: 'Partial', ccmDNSH: 'Cond.' },
  { nace: 'C.27', desc: 'Electrical equipment', tsc: '3.6 Low-carbon tech', eligible: 'Yes', ccmDNSH: 'Pass' },
  { nace: 'C.28', desc: 'Machinery manufacturing', tsc: '3.6', eligible: 'Yes', ccmDNSH: 'Pass' },
  { nace: 'C.29', desc: 'Motor vehicles', tsc: '3.3 Low-carbon transport', eligible: 'Partial', ccmDNSH: 'Cond.' },
  { nace: 'D.35', desc: 'Electricity generation', tsc: '4.1-4.31', eligible: 'Yes', ccmDNSH: 'Pass' },
  { nace: 'E.36', desc: 'Water supply', tsc: '5.1', eligible: 'Yes', ccmDNSH: 'Pass' },
  { nace: 'E.37', desc: 'Sewerage', tsc: '5.3', eligible: 'Yes', ccmDNSH: 'Pass' },
  { nace: 'E.38', desc: 'Waste collection/treatment', tsc: '5.5', eligible: 'Yes', ccmDNSH: 'Pass' },
  { nace: 'F.41', desc: 'Building construction', tsc: '7.1 New construction', eligible: 'Yes', ccmDNSH: 'Pass' },
  { nace: 'F.43', desc: 'Building renovation', tsc: '7.2 Renovation', eligible: 'Yes', ccmDNSH: 'Pass' },
  { nace: 'G.45', desc: 'Motor vehicle trade', tsc: 'N/A', eligible: 'No', ccmDNSH: '--' },
  { nace: 'H.49', desc: 'Land transport', tsc: '6.1-6.15', eligible: 'Yes', ccmDNSH: 'Pass' },
  { nace: 'H.50', desc: 'Water transport', tsc: '6.7-6.11', eligible: 'Partial', ccmDNSH: 'Cond.' },
  { nace: 'H.51', desc: 'Air transport', tsc: '6.18-6.19', eligible: 'Partial', ccmDNSH: 'Cond.' },
  { nace: 'J.61', desc: 'Telecommunications', tsc: '8.1 Data-driven', eligible: 'Yes', ccmDNSH: 'Pass' },
  { nace: 'J.62', desc: 'Computer services', tsc: '8.2', eligible: 'Yes', ccmDNSH: 'Pass' },
  { nace: 'K.64', desc: 'Financial services', tsc: 'N/A (out-of-scope)', eligible: 'No', ccmDNSH: '--' },
  { nace: 'K.65', desc: 'Insurance', tsc: '10.1 Non-life climate', eligible: 'Yes', ccmDNSH: 'Pass' },
  { nace: 'L.68', desc: 'Real estate activities', tsc: '7.7 Acquisition', eligible: 'Yes', ccmDNSH: 'Pass' },
  { nace: 'M.71', desc: 'Architecture/engineering', tsc: '9.1-9.2 Eng. services', eligible: 'Yes', ccmDNSH: 'Pass' },
  { nace: 'N.77', desc: 'Rental & leasing', tsc: 'N/A', eligible: 'Partial', ccmDNSH: 'Cond.' },
  { nace: 'P.85', desc: 'Education', tsc: 'N/A', eligible: 'No', ccmDNSH: '--' },
  { nace: 'Q.86', desc: 'Healthcare', tsc: 'N/A', eligible: 'No', ccmDNSH: '--' },
];

const DQS_DETAILS = [
  { score: 1, label: 'Verified reported', desc: 'Actual emissions data, third-party verified per ISO 14064-3', color: T.green, share: 8 },
  { score: 2, label: 'Unverified reported', desc: 'Actual emissions reported; no third-party assurance', color: T.sageL, share: 24 },
  { score: 3, label: 'Physical activity proxy', desc: 'Company-specific primary data × sector intensity factor', color: T.gold, share: 38 },
  { score: 4, label: 'Economic activity proxy', desc: 'Revenue × sector avg intensity (EXIOBASE, GHGP)', color: T.amber, share: 22 },
  { score: 5, label: 'Asset-class proxy', desc: 'Portfolio-level or regional avg; lowest granularity', color: T.red, share: 8 },
];

const SCR_IMPACT = [
  { scenario: 'Base (current)', scrModule: 'Market Risk', pre: 8420, post: 8420, relief: 0, factorApplied: '1.000' },
  { scenario: 'GSF @0.75 (Aligned)', scrModule: 'Credit Spread', pre: 3420, post: 2565, relief: 855, factorApplied: '0.750' },
  { scenario: 'GSF @0.80 (Eligible)', scrModule: 'Credit Spread', pre: 3420, post: 2736, relief: 684, factorApplied: '0.800' },
  { scenario: 'Penalising (1.50)', scrModule: 'Property / Nat-Cat', pre: 2140, post: 3210, relief: -1070, factorApplied: '1.500' },
  { scenario: 'Combined Mitig.', scrModule: 'Aggregate', pre: 15200, post: 13280, relief: 1920, factorApplied: 'Blended' },
  { scenario: 'Stress: 2°C Disorderly', scrModule: 'Aggregate', pre: 15200, post: 17640, relief: -2440, factorApplied: 'Stress' },
];

const CSRD_DATAPOINTS = [
  { id: 'E1-1', name: 'Transition Plan', status: 'Ready', source: 'PCAF + Taxonomy', evidence: 'Board-approved plan 2026-03-14', gap: 0 },
  { id: 'E1-4', name: 'Targets (SBTi-aligned)', status: 'Ready', source: 'PCAF', evidence: '1.5C FLAG pathway validated', gap: 0 },
  { id: 'E1-5', name: 'Energy Consumption', status: 'Partial', source: 'Own ops', evidence: 'Scope 1+2 complete; S3 partial', gap: 12 },
  { id: 'E1-6', name: 'GHG Emissions (S1+S2+S3)', status: 'Ready', source: 'PCAF Cat 15', evidence: 'Financed emissions per PCAF', gap: 0 },
  { id: 'E1-7', name: 'GHG Removals & Credits', status: 'Partial', source: 'VCM registries', evidence: 'Verra/Gold Standard mapped', gap: 8 },
  { id: 'E1-8', name: 'Internal Carbon Pricing', status: 'Ready', source: 'Policy doc', evidence: 'Shadow price $85/tCO2', gap: 0 },
  { id: 'E1-9', name: 'Physical + Transition Risk $', status: 'Gap', source: 'NGFS', evidence: 'Quant model pending', gap: 34 },
  { id: 'SFDR PAI-1', name: 'GHG emissions (scope 1-3)', status: 'Ready', source: 'PCAF', evidence: 'Cross-mapped', gap: 0 },
  { id: 'SFDR PAI-4', name: 'Fossil Fuel Exposure', status: 'Ready', source: 'NACE B.05/B.06', evidence: 'Screened', gap: 0 },
  { id: 'Tax Art 8 Turn.', name: 'Turnover KPI', status: 'Ready', source: 'Counterparty disc.', evidence: 'Published 2026-Q1', gap: 0 },
  { id: 'Tax Art 8 CapEx', name: 'CapEx KPI', status: 'Ready', source: 'Counterparty disc.', evidence: 'Published 2026-Q1', gap: 0 },
  { id: 'Tax Art 8 OpEx', name: 'OpEx KPI', status: 'Partial', source: 'Counterparty disc.', evidence: '62% coverage', gap: 18 },
];

const WATERFALL_STAGES = [
  { stage: 'Total Loan Book', value: 100, cumulative: 100, color: T.navy, type: 'total' },
  { stage: '− Sovereigns (excl.)', value: -8, cumulative: 92, color: T.textMut, type: 'deduct' },
  { stage: '− Central Banks', value: -3, cumulative: 89, color: T.textMut, type: 'deduct' },
  { stage: '− Derivatives/HFT', value: -5, cumulative: 84, color: T.textMut, type: 'deduct' },
  { stage: '= In-Scope Denom.', value: 84, cumulative: 84, color: T.navyL, type: 'subtotal' },
  { stage: '− Non-NFRD Corp.', value: -22, cumulative: 62, color: T.amber, type: 'deduct' },
  { stage: '= Eligible Pool', value: 62, cumulative: 62, color: T.gold, type: 'subtotal' },
  { stage: '− DNSH Failures', value: -14, cumulative: 48, color: T.red, type: 'deduct' },
  { stage: '− MinSafeg. Fail', value: -4, cumulative: 44, color: T.red, type: 'deduct' },
  { stage: '= Aligned Pool', value: 44, cumulative: 44, color: T.sage, type: 'subtotal' },
  { stage: 'GAR (Stock)', value: 18.4, cumulative: 18.4, color: T.green, type: 'final' },
];

// ============ DEEP RISK DATA (Tabs 15-20) ============
const NGFS_SCENARIOS_PD = [
  { id: 'ORD', name: 'Orderly (Net Zero 2050)', pdMult: 1.08, lgdShift: 0.02, feShift: -0.22, gdp2030: -0.4, gdp2050: 0.2, color: '#16a34a' },
  { id: 'DEL', name: 'Delayed Transition', pdMult: 1.34, lgdShift: 0.06, feShift: -0.14, gdp2030: -1.2, gdp2050: -2.4, color: '#d97706' },
  { id: 'HOT', name: 'Hot House World', pdMult: 1.52, lgdShift: 0.11, feShift: 0.18, gdp2030: -2.1, gdp2050: -6.8, color: '#dc2626' },
  { id: 'CUR', name: 'Current Policies', pdMult: 1.41, lgdShift: 0.09, feShift: 0.08, gdp2030: -1.6, gdp2050: -4.3, color: '#b91c1c' },
  { id: 'NZ2050', name: 'Net Zero 2050 (1.5°C)', pdMult: 1.12, lgdShift: 0.03, feShift: -0.28, gdp2030: -0.7, gdp2050: -0.1, color: '#15803d' },
];

const SECTOR_PD_MULT = {
  'Energy': { ORD: 1.18, DEL: 1.78, HOT: 1.24, CUR: 1.62, NZ2050: 1.32 },
  'Utilities': { ORD: 1.14, DEL: 1.52, HOT: 1.32, CUR: 1.44, NZ2050: 1.22 },
  'Materials': { ORD: 1.22, DEL: 1.68, HOT: 1.58, CUR: 1.56, NZ2050: 1.28 },
  'Industrials': { ORD: 1.10, DEL: 1.38, HOT: 1.42, CUR: 1.36, NZ2050: 1.14 },
  'Real Estate': { ORD: 1.06, DEL: 1.24, HOT: 1.72, CUR: 1.28, NZ2050: 1.08 },
  'Transport': { ORD: 1.16, DEL: 1.54, HOT: 1.38, CUR: 1.48, NZ2050: 1.20 },
  'Agriculture': { ORD: 1.08, DEL: 1.30, HOT: 1.92, CUR: 1.34, NZ2050: 1.12 },
  'Financials': { ORD: 1.04, DEL: 1.18, HOT: 1.28, CUR: 1.20, NZ2050: 1.06 },
};

const IFRS_STAGE_RULES = [
  { stage: 1, label: 'Performing', desc: '12-month ECL; no SICR', pdFloor: 0, pdCeil: 2.0, color: '#16a34a' },
  { stage: 2, label: 'Under-performing', desc: 'Lifetime ECL; SICR triggered', pdFloor: 2.0, pdCeil: 6.0, color: '#d97706' },
  { stage: 3, label: 'Non-performing (Credit-impaired)', desc: 'Lifetime ECL; default', pdFloor: 6.0, pdCeil: 100, color: '#dc2626' },
];

const CLIMATE_PD_UPLIFT = {
  'Energy': 1.32,
  'Utilities': 1.22,
  'Materials': 1.28,
  'Industrials': 1.16,
  'Real Estate': 1.18,
  'Transport': 1.24,
  'Agriculture': 1.35,
  'Financials': 1.08,
};

const RISK_APPETITE_THRESHOLDS = [
  { id: 'RA1', metric: 'Stressed CET1 Ratio', unit: '%', current: 13.8, warn: 12.0, breach: 10.5, direction: 'higher', pillar: 'Pillar 1/2' },
  { id: 'RA2', metric: 'Climate-Stressed Leverage', unit: '%', current: 5.2, warn: 4.5, breach: 3.5, direction: 'higher', pillar: 'Pillar 1' },
  { id: 'RA3', metric: 'Portfolio Temp. Alignment', unit: '°C', current: 2.4, warn: 2.7, breach: 3.0, direction: 'lower', pillar: 'Pillar 2' },
  { id: 'RA4', metric: 'Brown Exposure % EAD', unit: '%', current: 14.6, warn: 18.0, breach: 25.0, direction: 'lower', pillar: 'Pillar 2' },
  { id: 'RA5', metric: 'Green Asset Ratio', unit: '%', current: 18.4, warn: 15.0, breach: 12.0, direction: 'higher', pillar: 'Pillar 2' },
  { id: 'RA6', metric: 'Single-Name Concentration', unit: '% CET1', current: 7.8, warn: 10.0, breach: 15.0, direction: 'lower', pillar: 'Pillar 1' },
  { id: 'RA7', metric: 'Physical Risk VaR (1-in-200)', unit: '% EAD', current: 3.2, warn: 4.5, breach: 6.0, direction: 'lower', pillar: 'Pillar 2' },
  { id: 'RA8', metric: 'Transition Risk Loss', unit: '% EAD', current: 2.1, warn: 3.0, breach: 4.5, direction: 'lower', pillar: 'Pillar 2' },
  { id: 'RA9', metric: 'DQS Weighted Avg', unit: 'score', current: 2.8, warn: 3.5, breach: 4.2, direction: 'lower', pillar: 'Pillar 3' },
  { id: 'RA10', metric: 'CSRD Gap Score', unit: '%', current: 9.2, warn: 15.0, breach: 25.0, direction: 'lower', pillar: 'Pillar 3' },
];

const SOLVENCY_II_FACTORS = {
  'P&C-Motor': { nonLifePrem: 0.10, nonLifeRes: 0.09, catNat: 0.02, spread: 0.04, equity: 0.39, property: 0.25 },
  'P&C-Prop': { nonLifePrem: 0.14, nonLifeRes: 0.11, catNat: 0.18, spread: 0.05, equity: 0.39, property: 0.25 },
  'Health': { nonLifePrem: 0.08, nonLifeRes: 0.07, catNat: 0.01, spread: 0.03, equity: 0.39, property: 0.25 },
  'Life-Savings': { nonLifePrem: 0.00, nonLifeRes: 0.00, catNat: 0.00, spread: 0.08, equity: 0.39, property: 0.25 },
  'Life-Protect': { nonLifePrem: 0.00, nonLifeRes: 0.00, catNat: 0.00, spread: 0.06, equity: 0.39, property: 0.25 },
  'Reins': { nonLifePrem: 0.16, nonLifeRes: 0.12, catNat: 0.22, spread: 0.05, equity: 0.39, property: 0.25 },
};

// Basel IRB asymptotic correlation + inverse normal (Beasley-Springer) + normal CDF (rational approx)
const baselR = (PD) => {
  const e50 = Math.exp(-50);
  const a = (1 - Math.exp(-50*PD)) / (1 - e50);
  return 0.12 * a + 0.24 * (1 - a);
};
const ndInv = (p) => {
  if (p <= 0 || p >= 1) return 0;
  if (p <= 0.5) {
    const t = Math.sqrt(-2 * Math.log(p));
    return -(t - (2.515517 + 0.802853*t + 0.010328*t*t) / (1 + 1.432788*t + 0.189269*t*t + 0.001308*t*t*t));
  }
  const t = Math.sqrt(-2 * Math.log(1 - p));
  return t - (2.515517 + 0.802853*t + 0.010328*t*t) / (1 + 1.432788*t + 0.189269*t*t + 0.001308*t*t*t);
};
const nCdf = (x) => {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804 * Math.exp(-x*x/2);
  const p = d*t*(0.319381530 + t*(-0.356563782 + t*(1.781477937 + t*(-1.821255978 + t*1.330274429))));
  return x >= 0 ? 1 - p : p;
};
const irbK = (PD, LGD, M) => {
  if (PD <= 0) return 0;
  if (PD >= 1) return LGD;
  const R = baselR(PD);
  const b = Math.pow(0.11852 - 0.05478 * Math.log(PD), 2);
  const mAdj = (1 + (M - 2.5) * b) / (1 - 1.5 * b);
  const cond = nCdf((ndInv(PD) + Math.sqrt(R) * ndInv(0.999)) / Math.sqrt(Math.max(1e-9, 1 - R)));
  return LGD * (cond - PD) * mAdj;
};

// ============ STYLES ============
const S={
  root:{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:T.font},
  shell:{maxWidth:1640,margin:'0 auto',padding:'24px 28px 80px'},
  h1:{fontSize:26,fontWeight:700,letterSpacing:-0.3,margin:0,color:T.navy},
  sub:{fontSize:13,color:T.textSec,margin:'6px 0 0'},
  tabBar:{display:'flex',flexWrap:'wrap',gap:4,borderBottom:`1px solid ${T.border}`,marginTop:18,marginBottom:22},
  tab:(a)=>({padding:'10px 14px',fontSize:12,fontWeight:a?700:500,color:a?T.navy:T.textSec,borderBottom:a?`2px solid ${T.gold}`:'2px solid transparent',background:'transparent',border:'none',cursor:'pointer',fontFamily:T.font,letterSpacing:0.2,whiteSpace:'nowrap'}),
  card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:18,marginBottom:16},
  cardH:{fontSize:13,fontWeight:700,color:T.navy,margin:'0 0 14px',letterSpacing:0.3,textTransform:'uppercase'},
  kpiGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:18},
  kpi:{background:T.surface,border:`1px solid ${T.border}`,borderLeft:`3px solid ${T.gold}`,borderRadius:6,padding:'14px 16px'},
  kpiLbl:{fontSize:10,color:T.textSec,textTransform:'uppercase',letterSpacing:0.8,fontWeight:600,fontFamily:T.mono},
  kpiVal:{fontSize:22,fontWeight:700,color:T.navy,margin:'6px 0 2px',fontFamily:T.mono},
  kpiSub:{fontSize:11,color:T.textMut},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14},
  grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14},
  table:{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.mono},
  th:{textAlign:'left',padding:'10px 10px',borderBottom:`2px solid ${T.borderL}`,color:T.navy,fontSize:10,letterSpacing:0.5,textTransform:'uppercase',fontWeight:700,background:T.surfaceH},
  td:{padding:'9px 10px',borderBottom:`1px solid ${T.border}`,color:T.text},
  pill:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:c+'22',color:c,fontFamily:T.mono,letterSpacing:0.4}),
  btn:(a)=>({padding:'7px 14px',fontSize:11,border:`1px solid ${a?T.navy:T.border}`,background:a?T.navy:T.surface,color:a?'#fff':T.text,borderRadius:4,cursor:'pointer',fontFamily:T.mono,letterSpacing:0.3,fontWeight:600}),
  slider:{width:'100%',accentColor:T.navy},
  label:{fontSize:11,color:T.textSec,fontFamily:T.mono,letterSpacing:0.3,display:'block',marginBottom:6},
  select:{padding:'7px 10px',fontSize:12,border:`1px solid ${T.border}`,borderRadius:4,background:T.surface,color:T.text,fontFamily:T.mono},
  chip:(c)=>({display:'inline-block',padding:'3px 8px',background:c,color:'#fff',fontSize:10,fontWeight:700,borderRadius:3,letterSpacing:0.4,fontFamily:T.mono}),
  alertBox:{background:'#fff8ec',border:`1px solid ${T.gold}`,borderRadius:6,padding:12,fontSize:12,color:T.navy,marginBottom:14,fontFamily:T.mono},
  accent:{width:40,height:3,background:T.gold,marginBottom:16,borderRadius:2},
};

const PIE_COLORS=[T.navy,T.gold,T.sage,T.amber,T.red,T.navyL,T.sageL,T.goldL];

function Kpi({ label, value, sub, accent=T.gold }) {
  return (
    <div style={{...S.kpi,borderLeftColor:accent}}>
      <div style={S.kpiLbl}>{label}</div>
      <div style={S.kpiVal}>{value}</div>
      {sub && <div style={S.kpiSub}>{sub}</div>}
    </div>
  );
}

function DqsPill({ v }) {
  const d = DQS_DETAILS[v-1] || DQS_DETAILS[4];
  return <span style={S.pill(d.color)}>DQS {v}</span>;
}

function StatusPill({ s }) {
  const c = s==='Ready'?T.green:s==='Partial'?T.amber:s==='Gap'?T.red:T.textMut;
  return <span style={S.pill(c)}>{s}</span>;
}

// ============ MAIN COMPONENT ============
export default function FiTaxonomyPcafBridgePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [scrScenario, setScrScenario] = useState('GSF @0.80 (Eligible)');
  const [dqsFloor, setDqsFloor] = useState(5);
  const [ltvMax, setLtvMax] = useState(100);
  const [garTarget, setGarTarget] = useState(22);
  const [assetClassFilter, setAssetClassFilter] = useState('All');
  const [ngfsScenario, setNgfsScenario] = useState('DEL');
  const [irbHorizon, setIrbHorizon] = useState(3);
  const [ifrsOverlay, setIfrsOverlay] = useState(1);
  const [cfTarget, setCfTarget] = useState(28);
  const [icaapStress, setIcaapStress] = useState(0.6);
  const [solvLob, setSolvLob] = useState('All');

  const filteredLoans = useMemo(() => {
    return LOAN_BOOK.filter(l => (sectorFilter==='All' || l.sector===sectorFilter) && l.dqs <= dqsFloor);
  }, [sectorFilter, dqsFloor]);

  const stats = useMemo(() => {
    const tot = filteredLoans.reduce((a,l)=>a+l.ead, 0);
    const aligned = filteredLoans.reduce((a,l)=>a+l.ead*l.alignedPct/100, 0);
    const eligible = filteredLoans.reduce((a,l)=>a+l.ead*l.eligiblePct/100, 0);
    const fe = filteredLoans.reduce((a,l)=>a+l.fe, 0);
    const ewb = filteredLoans.reduce((a,l)=>a+l.ewb, 0);
    const dqsW = tot>0 ? filteredLoans.reduce((a,l)=>a+l.ead*l.dqs, 0)/tot : 0;
    return {
      totalEAD: tot,
      alignedPct: tot>0 ? aligned/tot*100 : 0,
      eligiblePct: tot>0 ? eligible/tot*100 : 0,
      fe, ewb,
      dqsW,
      count: filteredLoans.length,
    };
  }, [filteredLoans]);

  // ASSET_CLASSES previously carried its own independent, hand-typed `fe`
  // figures that summed to ~1,301 ktCO2e — about 37% off the loan-book-derived
  // headline total (stats.fe, ~1,791 ktCO2e), i.e. two disconnected "truths"
  // for the same portfolio's financed emissions. Re-derive each class's FE by
  // distributing the single headline total via its `weight` (weights already
  // sum to 1.00 by construction) so every FE figure on this page reconciles
  // to one number, as PCAF/GAP-006 requires.
  const assetClassBreakdown = useMemo(
    () => ASSET_CLASSES.map(a => ({ ...a, fe: +(a.weight * stats.fe).toFixed(1) })),
    [stats.fe]
  );

  const bankingGAR = stats.alignedPct;
  // Trading-book GAR and the insurance Green Supporting Factor are static
  // illustrative placeholders — this module has no trading-book or
  // insurance-book loan data (only the banking-book LOAN_BOOK above), so
  // these two figures cannot be computed here. Flagged as such rather than
  // presented indistinguishably alongside the computed banking-book KPIs.
  const tradingGAR = 6.7; // illustrative placeholder — no trading-book data source in this module
  const insuranceGF = 18.9; // illustrative placeholder — no insurance-book data source in this module
  const pcafDqs = stats.dqsW;
  const alignCov = stats.count>0 ? (filteredLoans.filter(l=>l.alignedPct>0).length / stats.count * 100) : 0;
  const csrdReadyPct = (CSRD_DATAPOINTS.filter(d=>d.status==='Ready').length / Math.max(1,CSRD_DATAPOINTS.length)) * 100;

  const sectorStats = useMemo(() => {
    return SECTORS.map(s => {
      const ls = LOAN_BOOK.filter(l=>l.sector===s);
      const tot = ls.reduce((a,l)=>a+l.ead,0);
      const al = ls.reduce((a,l)=>a+l.ead*l.alignedPct/100,0);
      const fe = ls.reduce((a,l)=>a+l.fe,0);
      return { sector: s, total: +tot.toFixed(1), alignedPct: tot>0?+(al/tot*100).toFixed(1):0, fe: +fe.toFixed(1), count: ls.length };
    });
  }, []);

  const tabs = [
    'Overview','Banking-Book GAR','Trading-Book GAR','PCAF × Taxonomy','Alignment Waterfall',
    'Mortgage Pool','CRE','Solvency II GSF','Underwriting Taxonomy','CSRD Art 8',
    'DQS (1–5)','NACE Map','SCR Impact','KPI Templates',
    'NGFS Stress Lab','IRB Capital & RWA','IFRS 9 ECL × Climate','Counterfactual GAR','ICAAP & Risk Appetite','Solvency II SCR Climate'
  ];

  const handleTab = useCallback((i)=> setTab(i), []);

  return (
    <div style={S.root}>
      <div style={S.shell}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
          <div>
            <div style={{fontSize:10,color:T.gold,fontFamily:T.mono,letterSpacing:2,fontWeight:700,marginBottom:6}}>MODULE EP-Q9 · REGULATORY BRIDGE</div>
            <h1 style={S.h1}>FI Taxonomy × PCAF Bridge</h1>
            <p style={S.sub}>Banking-book GAR · Solvency II Green Factor · PCAF × Taxonomy × CSRD triple-reporting disclosure engine</p>
          </div>
          <div style={{textAlign:'right',fontSize:10,fontFamily:T.mono,color:T.textSec,letterSpacing:0.5}}>
            <div>EU TAXONOMY ART. 8 · DA 2021/2178</div>
            <div style={{color:T.textMut}}>PCAF Standard, 3rd Ed. (Dec 2025) · CSRD ESRS E1 · SOLV II 2009/138</div>
            <div style={{marginTop:6,color:T.gold}}>ILLUSTRATIVE · {currentRegulatoryQuarter} REGULATORY CYCLE</div>
          </div>
        </div>
        <div style={S.accent}/>

        <div style={S.tabBar}>
          {tabs.map((t,i)=>(
            <button key={t} style={S.tab(tab===i)} onClick={()=>handleTab(i)}>{String(i+1).padStart(2,'0')}. {t}</button>
          ))}
        </div>

        {tab===0 && (
          <>
            <div style={S.kpiGrid}>
              <Kpi label="Banking GAR (Stock)" value={fmtPct(bankingGAR)} sub={`Target ${garTarget}% · gap ${fmt(garTarget-bankingGAR,1)} pts`} accent={T.navy}/>
              <Kpi label="Trading Book GAR (illustrative)" value={fmtPct(tradingGAR)} sub="No trading-book data source — placeholder, not computed" accent={T.gold}/>
              <Kpi label="Insurance Green Factor (illustrative)" value={fmtPct(insuranceGF)} sub="No insurance-book data source — placeholder, not computed" accent={T.sage}/>
              <Kpi label="Financed Emissions" value={fmt(stats.fe/1000,2)+' MtCO₂e'} sub={`${stats.count} counterparties`} accent={T.amber}/>
              <Kpi label="PCAF DQS (Weighted)" value={fmt(pcafDqs,2)} sub="Scale 1 (best) – 5" accent={pcafDqs<=2.5?T.green:pcafDqs<=3.5?T.amber:T.red}/>
              <Kpi label="Alignment Coverage" value={fmtPct(alignCov)} sub={`${Math.round(alignCov*stats.count/100)} / ${stats.count} counterparties`} accent={T.navyL}/>
              <Kpi label="CSRD Datapoint Readiness" value={fmtPct(csrdReadyPct)} sub={`${CSRD_DATAPOINTS.filter(d=>d.status==='Ready').length}/${CSRD_DATAPOINTS.length} ready`} accent={T.sageL}/>
            </div>

            <div style={S.alertBox}>
              <strong>Regulatory context:</strong> EBA GAR &amp; BTAR disclosures mandatory from 2024 reporting year. Trading book Article 8 DA amendment effective 2026. ESAs' QoC opinion 2025/03 requires PCAF mapping for SFDR PAI-1. This module provides end-to-end reconciliation.
            </div>

            <div style={S.grid2}>
              <div style={S.card}>
                <div style={S.cardH}>Asset-Class Coverage · PCAF vs. Taxonomy</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ASSET_CLASSES} margin={{top:8,right:8,left:0,bottom:40}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="code" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} angle={-30} textAnchor="end"/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'Coverage %',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono,background:T.surface,border:`1px solid ${T.border}`}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                    <Bar dataKey="pcafCoverage" fill={T.navy} name="PCAF Cov %" radius={[3,3,0,0]}/>
                    <Bar dataKey="taxonomyCoverage" fill={T.gold} name="Taxonomy Cov %" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={S.card}>
                <div style={S.cardH}>Financed Emissions by Asset Class</div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={assetClassBreakdown} dataKey="fe" nameKey="name" outerRadius={100} label={(e)=>`${e.code}: ${fmt(e.fe,0)}`} labelLine={false}>
                      {assetClassBreakdown.map((e,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={(v)=>[fmt(v,1)+' ktCO₂e','FE']} contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardH}>Sector Alignment Snapshot — Banking Book</div>
              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>Sector</th><th style={S.th}>Counterparties</th><th style={S.th}>Total EAD ($M)</th>
                  <th style={S.th}>Aligned %</th><th style={S.th}>Financed Emissions (ktCO₂e)</th><th style={S.th}>Status</th>
                </tr></thead>
                <tbody>
                  {sectorStats.map((s,i)=>(
                    <tr key={s.sector} style={{background:i%2?T.surfaceH:T.surface}}>
                      <td style={S.td}>{s.sector}</td>
                      <td style={S.td}>{s.count}</td>
                      <td style={S.td}>{fmt(s.total,1)}</td>
                      <td style={S.td}>{fmtPct(s.alignedPct)}</td>
                      <td style={S.td}>{fmt(s.fe,1)}</td>
                      <td style={S.td}>{s.alignedPct>=20?<span style={S.chip(T.green)}>ON-TRACK</span>:s.alignedPct>=10?<span style={S.chip(T.amber)}>BEHIND</span>:<span style={S.chip(T.red)}>LAG</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={S.card}>
              <div style={S.cardH}>Reconciliation Narrative — PCAF ⇄ Taxonomy ⇄ CSRD</div>
              <ol style={{fontSize:12,lineHeight:1.7,color:T.textSec,margin:0,paddingLeft:18}}>
                <li><strong style={{color:T.navy}}>Denominator alignment:</strong> PCAF uses outstanding amount ∪ committed; Taxonomy GAR uses gross carrying amount — reconcile via footnote (avg delta 3.2% this portfolio).</li>
                <li><strong style={{color:T.navy}}>Scope boundary:</strong> PCAF Cat 15 includes all asset classes; GAR excludes sovereigns, central banks, derivatives, trading HFT (~16% of assets here).</li>
                <li><strong style={{color:T.navy}}>Activity-based vs entity-based:</strong> Taxonomy reports activity-level KPIs from counterparty disclosure; PCAF uses weighted attribution factor (EVIC / loan-to-value).</li>
                <li><strong style={{color:T.navy}}>DNSH &amp; Min Safeguards:</strong> 14% of eligible pool fails DNSH; 4% fails Min Safeguards (OECD MNE + UNGP alignment test).</li>
                <li><strong style={{color:T.navy}}>CSRD E1-6 crosswalk:</strong> PCAF output feeds directly; Scope 1+2 operational captured in E1-5.</li>
              </ol>
            </div>
          </>
        )}

        {tab===1 && (
          <>
            <div style={S.card}>
              <div style={S.cardH}>Filters & What-If Controls</div>
              <div style={{display:'flex',gap:18,flexWrap:'wrap',alignItems:'flex-end'}}>
                <div style={{minWidth:160}}>
                  <label style={S.label}>Sector filter</label>
                  <select style={S.select} value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)}>
                    <option>All</option>
                    {SECTORS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{minWidth:220}}>
                  <label style={S.label}>Max DQS floor ({dqsFloor}) — only show loans with DQS ≤ floor</label>
                  <input type="range" min={1} max={5} step={1} value={dqsFloor} onChange={e=>setDqsFloor(+e.target.value)} style={S.slider}/>
                </div>
                <div style={{minWidth:220}}>
                  <label style={S.label}>GAR target (%) for gap analysis: {garTarget}%</label>
                  <input type="range" min={10} max={40} step={1} value={garTarget} onChange={e=>setGarTarget(+e.target.value)} style={S.slider}/>
                </div>
                <button style={S.btn(false)} onClick={()=>{setSectorFilter('All');setDqsFloor(5);setGarTarget(22);}}>Reset</button>
              </div>
            </div>

            <div style={S.kpiGrid}>
              <Kpi label="Banking GAR (Stock)" value={fmtPct(stats.alignedPct)} sub={`${fmtBn(stats.totalEAD/1000)} EAD`} accent={T.navy}/>
              <Kpi label="Eligible Pool %" value={fmtPct(stats.eligiblePct)} sub="Aligned ⊆ Eligible"/>
              <Kpi label="Financed Emissions" value={fmt(stats.fe,0)+' ktCO₂e'} sub="Scope 1+2 attribution"/>
              <Kpi label="Expected Wtd. Loss" value={'$'+fmt(stats.ewb,2)+'M'} sub="PD × LGD × EAD" accent={T.red}/>
              <Kpi label="Filtered Loans" value={stats.count} sub={`of ${LOAN_BOOK.length} in book`}/>
              <Kpi label="Gap to Target" value={fmtPct(garTarget-stats.alignedPct)} sub="Origination deficit" accent={T.amber}/>
            </div>

            <div style={S.card}>
              <div style={S.cardH}>Banking Loan Book — Full Detail ({filteredLoans.length} rows)</div>
              <div style={{maxHeight:480,overflow:'auto'}}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>ID</th><th style={S.th}>Counterparty</th><th style={S.th}>Sector</th><th style={S.th}>NACE</th>
                    <th style={S.th}>EAD ($M)</th><th style={S.th}>Aligned %</th><th style={S.th}>Eligible %</th>
                    <th style={S.th}>DQS</th><th style={S.th}>PD %</th><th style={S.th}>LGD %</th>
                    <th style={S.th}>EL ($M)</th><th style={S.th}>FE (ktCO₂e)</th><th style={S.th}>Mat. (M)</th>
                  </tr></thead>
                  <tbody>
                    {filteredLoans.map((l,i)=>(
                      <tr key={l.id} style={{background:i%2?T.surfaceH:T.surface}}>
                        <td style={S.td}>{l.id}</td>
                        <td style={S.td}>{l.counterparty}</td>
                        <td style={S.td}>{l.sector}</td>
                        <td style={S.td}>{l.naceCode}</td>
                        <td style={S.td}>{fmt(l.ead,1)}</td>
                        <td style={S.td}><span style={S.pill(l.alignedPct>0?T.green:T.textMut)}>{fmtPct(l.alignedPct)}</span></td>
                        <td style={S.td}>{fmtPct(l.eligiblePct)}</td>
                        <td style={S.td}><DqsPill v={l.dqs}/></td>
                        <td style={S.td}>{fmt(l.pd,2)}</td>
                        <td style={S.td}>{fmt(l.lgd,1)}</td>
                        <td style={S.td}>{fmt(l.ewb,2)}</td>
                        <td style={S.td}>{fmt(l.fe,2)}</td>
                        <td style={S.td}>{l.maturity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={S.grid2}>
              <div style={S.card}>
                <div style={S.cardH}>Aligned vs Eligible vs Non-Elig. (by Sector)</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sectorStats.map(s=>({sector:s.sector,aligned:s.alignedPct,eligible:Math.min(100,s.alignedPct*1.55),non:Math.max(0,100-s.alignedPct*1.55)}))} stackOffset="expand">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="sector" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} angle={-25} textAnchor="end" height={60}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                    <Bar dataKey="aligned" stackId="a" fill={T.sage} name="Aligned"/>
                    <Bar dataKey="eligible" stackId="a" fill={T.gold} name="Eligible-only"/>
                    <Bar dataKey="non" stackId="a" fill={T.textMut} name="Non-Eligible"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>GAR Gap-to-Target Bridge</div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={[
                    {stage:'Current',gar:stats.alignedPct,target:garTarget},
                    {stage:'+ CapEx plans',gar:Math.min(100,stats.alignedPct+2.5),target:garTarget},
                    {stage:'+ DNSH remediation',gar:Math.min(100,stats.alignedPct+4.5),target:garTarget},
                    {stage:'+ New origination',gar:Math.min(100,stats.alignedPct+7.2),target:garTarget},
                    {stage:'2028 Target',gar:Math.min(100,stats.alignedPct+9.5),target:garTarget},
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="stage" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} angle={-20} textAnchor="end" height={60}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                    <Bar dataKey="gar" fill={T.navy} name="Projected GAR %" radius={[3,3,0,0]}/>
                    <Line dataKey="target" stroke={T.gold} name="Target" strokeWidth={2.5} dot={false} strokeDasharray="5 3"/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {tab===2 && (
          <>
            <div style={S.alertBox}>
              <strong>Trading-Book GAR (RTS 2024/Q4):</strong> Exclusions include: (a) derivatives, (b) held-for-trading equities &lt; 90d, (c) reverse repos, (d) cleared margin. Only long-dated equity &amp; corporate bond inventory contributes. This page reports the revised in-scope trading book.
            </div>
            <div style={S.kpiGrid}>
              <Kpi label="Trading Book Nominal" value={fmtBn(142.8)} accent={T.navy}/>
              <Kpi label="In-Scope (post-exclusions)" value={fmtBn(34.2)} sub="24.0% of nominal"/>
              <Kpi label="Trading GAR (Turnover)" value={fmtPct(6.7)} accent={T.gold}/>
              <Kpi label="Trading GAR (CapEx)" value={fmtPct(9.2)}/>
              <Kpi label="Fossil-Fuel Exposure" value={fmtPct(14.3)} sub="B.05 + B.06 + C.19" accent={T.red}/>
              <Kpi label="Non-NFRD Excluded" value={fmtPct(42.1)} sub="Pre-2028 coverage gap"/>
            </div>
            <div style={S.grid2}>
              <div style={S.card}>
                <div style={S.cardH}>Trading Book Composition by NACE Top-10</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={NACE_MAP.slice(0,10).map((n,i)=>({nace:n.nace,exposure:+(8+sr(i*7)*42).toFixed(1),aligned:+(n.eligible==='Yes'?(4+sr(i*11)*12):0).toFixed(1)}))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis type="number" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis type="category" dataKey="nace" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                    <Bar dataKey="exposure" fill={T.navyL} name="Exposure ($M)"/>
                    <Bar dataKey="aligned" fill={T.gold} name="Aligned ($M)"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>Long/Short Net Aligned Position (30d rolling)</div>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={Array.from({length:30},(_,i)=>({d:i+1,long:+(8+sr(i*3)*6).toFixed(2),short:-(3+sr(i*5)*4).toFixed(2),net:+(5+sr(i*7)*3-sr(i*11)*2).toFixed(2)}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="d" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'Day',position:'insideBottom',offset:-4,style:{fontSize:10,fill:T.textSec}}}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'$M aligned',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                    <Area type="monotone" dataKey="long" stackId="1" fill={T.sage} stroke={T.sage} name="Long Aligned"/>
                    <Area type="monotone" dataKey="short" stackId="1" fill={T.red} stroke={T.red} name="Short Aligned"/>
                    <Line type="monotone" dataKey="net" stroke={T.navy} strokeWidth={2} name="Net" dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.cardH}>Trading-Book Exclusions Detail (RTS 2024/Q4)</div>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Category</th><th style={S.th}>Gross Notional ($Bn)</th><th style={S.th}>Treatment</th><th style={S.th}>In-Scope?</th><th style={S.th}>Rationale</th></tr></thead>
                <tbody>
                  {[
                    {c:'IR / FX Swaps',n:52.4,t:'Excluded',s:'No',r:'No corporate counterparty attribution'},
                    {c:'Equity Options < 90d',n:14.1,t:'Excluded',s:'No',r:'Held-for-trading exemption'},
                    {c:'Corporate Bonds (AFS)',n:22.3,t:'Included',s:'Yes',r:'Long inventory > 90d'},
                    {c:'Listed Equity Inventory',n:11.9,t:'Included',s:'Yes',r:'Book value / attribution applies'},
                    {c:'Reverse Repos',n:8.4,t:'Excluded',s:'No',r:'Collateralised financing'},
                    {c:'Cleared Margin (CCP)',n:16.8,t:'Excluded',s:'No',r:'CCP netting set'},
                    {c:'Credit Derivatives',n:10.7,t:'Excluded',s:'No',r:'Synthetic — no new financing'},
                    {c:'Commodity Forwards',n:6.2,t:'Excluded',s:'No',r:'Physical commodity'},
                  ].map((r,i)=>(
                    <tr key={i} style={{background:i%2?T.surfaceH:T.surface}}>
                      <td style={S.td}>{r.c}</td><td style={S.td}>{fmt(r.n,1)}</td>
                      <td style={S.td}><span style={S.pill(r.t==='Included'?T.green:T.textMut)}>{r.t}</span></td>
                      <td style={S.td}>{r.s}</td><td style={S.td}>{r.r}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab===3 && (
          <>
            <div style={S.card}>
              <div style={S.cardH}>PCAF × Taxonomy Bridge Matrix</div>
              <p style={{fontSize:12,color:T.textSec,margin:'0 0 12px'}}>Each PCAF asset class cross-walked to Taxonomy Art 8 KPIs with attribution convention differences.</p>
              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>PCAF Class</th><th style={S.th}>Weight</th><th style={S.th}>PCAF Coverage</th>
                  <th style={S.th}>Taxonomy Coverage</th><th style={S.th}>Coverage Delta</th><th style={S.th}>Wtd. DQS</th>
                  <th style={S.th}>FE (ktCO₂e)</th><th style={S.th}>Attribution Basis</th>
                </tr></thead>
                <tbody>
                  {assetClassBreakdown.map((a,i)=>(
                    <tr key={a.id} style={{background:i%2?T.surfaceH:T.surface}}>
                      <td style={S.td}>{a.name}</td>
                      <td style={S.td}>{fmtPct(a.weight*100)}</td>
                      <td style={S.td}><span style={S.pill(T.navy)}>{fmtPct(a.pcafCoverage)}</span></td>
                      <td style={S.td}><span style={S.pill(T.gold)}>{fmtPct(a.taxonomyCoverage)}</span></td>
                      <td style={S.td}>{fmtPct(a.pcafCoverage-a.taxonomyCoverage)}</td>
                      <td style={S.td}><DqsPill v={Math.round(a.dqs)}/></td>
                      <td style={S.td}>{fmt(a.fe,1)}</td>
                      <td style={S.td}>{a.code==='MTG'?'LTV-based':a.code==='CRE'?'LTV-based':a.code==='PF'?'Project-level':'EVIC / Debt'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={S.grid2}>
              <div style={S.card}>
                <div style={S.cardH}>Coverage Gap Waterfall (PCAF vs Taxonomy)</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={ASSET_CLASSES.map(a=>({code:a.code,gap:+(a.pcafCoverage-a.taxonomyCoverage).toFixed(1)}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="code" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'% points',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Bar dataKey="gap" fill={T.amber} radius={[3,3,0,0]} name="PCAF-Tax Gap"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>Attribution Factor Reconciliation</div>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart margin={{top:8,right:8,bottom:20,left:8}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="pcaf" name="PCAF Attribution %" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'PCAF Attribution %',position:'insideBottom',offset:-4,style:{fontSize:10,fill:T.textSec}}}/>
                    <YAxis dataKey="tax" name="Taxonomy Attribution %" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'Taxonomy %',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Scatter name="Counterparty" data={LOAN_BOOK.slice(0,25).map(l=>({pcaf:+(40+sr(l.id.charCodeAt(1))*50).toFixed(1),tax:l.alignedPct}))} fill={T.navy}/>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardH}>Bridge Reconciliation Formula</div>
              <div style={{fontFamily:T.mono,fontSize:12,background:T.surfaceH,padding:14,borderRadius:6,lineHeight:1.9,border:`1px solid ${T.border}`}}>
                <div><span style={{color:T.gold}}>GAR_aligned</span> = Σ<sub>i</sub> ( EAD<sub>i</sub> × α<sub>i</sub><sup>Tax</sup> × DNSH<sub>i</sub> × MinSafe<sub>i</sub> ) / Σ<sub>i</sub> EAD<sub>i,in-scope</sub></div>
                <div><span style={{color:T.gold}}>FE_PCAF</span> = Σ<sub>i</sub> ( ω<sub>i</sub> × E<sub>i</sub> ) where ω<sub>i</sub> = Outstanding / (EVIC or Property Value)</div>
                <div><span style={{color:T.gold}}>Reconciliation δ</span> = ( Σ ω<sub>i</sub> − Σ α<sub>i</sub> ) × EAD<sub>i</sub> — explained via denominator, scope &amp; DNSH adjustments</div>
              </div>
            </div>
          </>
        )}

        {tab===4 && (
          <>
            <div style={S.card}>
              <div style={S.cardH}>Loan-Book Alignment Waterfall — Total → GAR</div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={WATERFALL_STAGES} margin={{top:8,right:8,left:0,bottom:80}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="stage" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} angle={-35} textAnchor="end" height={100}/>
                  <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'% of Total Book',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                  <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                  <Bar dataKey="cumulative" radius={[4,4,0,0]}>
                    {WATERFALL_STAGES.map((s,i)=><Cell key={i} fill={s.color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={S.card}>
              <div style={S.cardH}>Waterfall Breakdown — Step-by-Step</div>
              <table style={S.table}>
                <thead><tr><th style={S.th}>#</th><th style={S.th}>Stage</th><th style={S.th}>Type</th><th style={S.th}>Δ (%)</th><th style={S.th}>Cumulative (%)</th><th style={S.th}>Notes</th></tr></thead>
                <tbody>
                  {WATERFALL_STAGES.map((s,i)=>(
                    <tr key={i} style={{background:i%2?T.surfaceH:T.surface}}>
                      <td style={S.td}>{i+1}</td>
                      <td style={S.td}><strong>{s.stage}</strong></td>
                      <td style={S.td}><span style={S.chip(s.color)}>{s.type.toUpperCase()}</span></td>
                      <td style={S.td}>{s.value>=0?'+':''}{fmt(s.value,1)}</td>
                      <td style={S.td}>{fmt(s.cumulative,1)}</td>
                      <td style={S.td}>{i===0?'Total FI balance sheet':i===4?'Art 8 DA in-scope base':i===6?'NFRD-eligible universe':i===9?'Final aligned %':'Deduction per Art 8 DA'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={S.grid3}>
              <div style={S.card}>
                <div style={S.cardH}>DNSH Failure Heatmap</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={[
                    {crit:'Climate Adapt.',fails:14},{crit:'Water',fails:8},{crit:'Circular Econ.',fails:11},
                    {crit:'Pollution',fails:18},{crit:'Biodiversity',fails:9},
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="crit" tick={{fontSize:9,fill:T.textSec,fontFamily:T.mono}} angle={-20} textAnchor="end" height={50}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Bar dataKey="fails" fill={T.red} radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>Min Safeguards Breakdown</div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={[{name:'OECD MNE',value:42},{name:'UN Guiding',value:28},{name:'ILO Core',value:18},{name:'UNGC',value:12}]} dataKey="value" outerRadius={80} label={(e)=>e.name}>
                      {[0,1,2,3].map(i=><Cell key={i} fill={PIE_COLORS[i]}/>)}
                    </Pie>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>Remediation Roadmap</div>
                <ul style={{fontSize:11,color:T.textSec,lineHeight:1.8,paddingLeft:16,margin:0,fontFamily:T.mono}}>
                  <li><strong style={{color:T.navy}}>Q1-Q2:</strong> Expand NACE coverage to 85% (+12 sectors)</li>
                  <li><strong style={{color:T.navy}}>Q2-Q3:</strong> Roll out DNSH eval to 100% new originations</li>
                  <li><strong style={{color:T.navy}}>Q3-Q4:</strong> Third-party assurance for PCAF DQS 1-2</li>
                  <li><strong style={{color:T.navy}}>2027:</strong> GAR &gt; 22% target (from 18.4% today)</li>
                  <li><strong style={{color:T.navy}}>2028:</strong> Trading book full integration post-RTS</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {tab===5 && (
          <>
            <div style={S.card}>
              <div style={S.cardH}>LTV Filter — What-If</div>
              <div style={{display:'flex',gap:18,alignItems:'flex-end',flexWrap:'wrap'}}>
                <div style={{minWidth:260}}>
                  <label style={S.label}>Maximum LTV (%): {ltvMax}</label>
                  <input type="range" min={40} max={100} step={5} value={ltvMax} onChange={e=>setLtvMax(+e.target.value)} style={S.slider}/>
                </div>
                <div style={{fontSize:11,color:T.textSec,fontFamily:T.mono}}>Cohorts shown: {MORTGAGE_POOL.filter(m=>m.ltv<=ltvMax).length} / {MORTGAGE_POOL.length}</div>
              </div>
            </div>

            {(() => {
              const pool = MORTGAGE_POOL.filter(m=>m.ltv<=ltvMax);
              const totBal = pool.reduce((a,m)=>a+m.balance,0);
              const aligned = pool.reduce((a,m)=>a+m.balance*m.alignedPct/100,0);
              const em = pool.reduce((a,m)=>a+m.emissions,0);
              const avgKwh = pool.length>0 ? pool.reduce((a,m)=>a+m.kwhM2,0)/pool.length : 0;
              const avgLtv = pool.length>0 ? pool.reduce((a,m)=>a+m.ltv,0)/pool.length : 0;
              return (
                <div style={S.kpiGrid}>
                  <Kpi label="Total Balance" value={fmtMn(totBal)} sub={`${pool.length} cohorts`} accent={T.navy}/>
                  <Kpi label="Aligned Share" value={fmtPct(totBal>0?aligned/totBal*100:0)} accent={T.sage}/>
                  <Kpi label="Avg kWh/m²" value={fmt(avgKwh,0)} sub="EPC A=60, G=340"/>
                  <Kpi label="Financed Emissions" value={fmt(em,1)+' ktCO₂e'} accent={T.amber}/>
                  <Kpi label="Avg LTV" value={fmtPct(avgLtv)}/>
                  <Kpi label="Units Financed" value={pool.reduce((a,m)=>a+m.units,0).toLocaleString()}/>
                </div>
              );
            })()}

            <div style={S.grid2}>
              <div style={S.card}>
                <div style={S.cardH}>EPC Distribution — Cohort Count</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={['A','B','C','D','E','F','G'].map(e=>({epc:e,count:MORTGAGE_POOL.filter(m=>m.epc===e).length,bal:MORTGAGE_POOL.filter(m=>m.epc===e).reduce((a,m)=>a+m.balance,0)}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="epc" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis yAxisId="l" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis yAxisId="r" orientation="right" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                    <Bar yAxisId="l" dataKey="count" fill={T.navy} name="Cohorts" radius={[3,3,0,0]}/>
                    <Bar yAxisId="r" dataKey="bal" fill={T.gold} name="Balance ($M)" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>Kwh/m² vs LTV Scatter (size = balance)</div>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="ltv" name="LTV %" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis dataKey="kwhM2" name="kWh/m²" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Scatter data={MORTGAGE_POOL} fill={T.navy}/>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardH}>Mortgage Cohort Detail (filtered)</div>
              <div style={{maxHeight:400,overflow:'auto'}}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>ID</th><th style={S.th}>Region</th><th style={S.th}>Vintage</th><th style={S.th}>EPC</th>
                    <th style={S.th}>Balance ($M)</th><th style={S.th}>LTV %</th><th style={S.th}>Units</th>
                    <th style={S.th}>kWh/m²</th><th style={S.th}>Aligned %</th><th style={S.th}>DQS</th><th style={S.th}>FE (ktCO₂e)</th>
                  </tr></thead>
                  <tbody>
                    {MORTGAGE_POOL.filter(m=>m.ltv<=ltvMax).map((m,i)=>(
                      <tr key={m.id} style={{background:i%2?T.surfaceH:T.surface}}>
                        <td style={S.td}>{m.id}</td>
                        <td style={S.td}>{m.region}</td>
                        <td style={S.td}>{m.vintage}</td>
                        <td style={S.td}><span style={S.chip(m.epcOrd<=1?T.green:m.epcOrd<=3?T.amber:T.red)}>{m.epc}</span></td>
                        <td style={S.td}>{fmt(m.balance,1)}</td>
                        <td style={S.td}>{fmt(m.ltv,1)}</td>
                        <td style={S.td}>{m.units}</td>
                        <td style={S.td}>{m.kwhM2}</td>
                        <td style={S.td}>{fmtPct(m.alignedPct)}</td>
                        <td style={S.td}><DqsPill v={m.dqs}/></td>
                        <td style={S.td}>{fmt(m.emissions,2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab===6 && (
          <>
            <div style={S.kpiGrid}>
              <Kpi label="CRE Portfolio GAV" value={fmtMn(CRE_ASSETS.reduce((a,c)=>a+c.gav,0))} accent={T.navy}/>
              <Kpi label="Loan Balance" value={fmtMn(CRE_ASSETS.reduce((a,c)=>a+c.loan,0))}/>
              <Kpi label="Portfolio LTV" value={fmtPct(CRE_ASSETS.reduce((a,c)=>a+c.loan,0)/Math.max(1,CRE_ASSETS.reduce((a,c)=>a+c.gav,0))*100)}/>
              <Kpi label="Aligned GAV" value={fmtPct(CRE_ASSETS.reduce((a,c)=>a+c.gav*c.alignedPct/100,0)/Math.max(1,CRE_ASSETS.reduce((a,c)=>a+c.gav,0))*100)} accent={T.sage}/>
              <Kpi label="Retrofit Capex Req." value={fmtMn(CRE_ASSETS.reduce((a,c)=>a+c.retrofit,0))} sub="DNSH transition req." accent={T.amber}/>
              <Kpi label="Avg Intensity" value={fmt(CRE_ASSETS.reduce((a,c)=>a+c.intensity,0)/Math.max(1,CRE_ASSETS.length),0)+' kWh/m²'}/>
            </div>

            <div style={S.grid2}>
              <div style={S.card}>
                <div style={S.cardH}>CRE by Property Type</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={['Office','Retail','Logistics','Hotel','Mixed','Industrial'].map(t=>{
                    const a = CRE_ASSETS.filter(c=>c.type===t);
                    return {type:t,gav:a.reduce((x,c)=>x+c.gav,0),aligned:a.reduce((x,c)=>x+c.gav*c.alignedPct/100,0)};
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="type" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} angle={-20} textAnchor="end" height={60}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                    <Bar dataKey="gav" fill={T.navy} name="GAV ($M)" radius={[3,3,0,0]}/>
                    <Bar dataKey="aligned" fill={T.gold} name="Aligned ($M)" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>EPC Transition Cost Curve</div>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={['A','B','C','D','E','F'].map((e,i)=>{
                    const a = CRE_ASSETS.filter(c=>c.epc===e);
                    return {epc:e,count:a.length,capex:a.reduce((x,c)=>x+c.retrofit,0),aligned:a.length>0?a.reduce((x,c)=>x+c.alignedPct,0)/a.length:0};
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="epc" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis yAxisId="l" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis yAxisId="r" orientation="right" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                    <Bar yAxisId="l" dataKey="capex" fill={T.amber} name="CapEx Req. ($M)" radius={[3,3,0,0]}/>
                    <Line yAxisId="r" dataKey="aligned" stroke={T.sage} strokeWidth={2.5} name="Avg Aligned %" dot={{r:4}}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardH}>CRE Asset Detail</div>
              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>ID</th><th style={S.th}>Type</th><th style={S.th}>City</th><th style={S.th}>EPC</th>
                  <th style={S.th}>GAV ($M)</th><th style={S.th}>Loan ($M)</th><th style={S.th}>LTV %</th>
                  <th style={S.th}>Aligned %</th><th style={S.th}>Intensity</th><th style={S.th}>Retrofit $</th><th style={S.th}>DQS</th>
                </tr></thead>
                <tbody>
                  {CRE_ASSETS.map((c,i)=>(
                    <tr key={c.id} style={{background:i%2?T.surfaceH:T.surface}}>
                      <td style={S.td}>{c.id}</td>
                      <td style={S.td}>{c.type}</td>
                      <td style={S.td}>{c.city}</td>
                      <td style={S.td}><span style={S.chip(c.epcOrd<=1?T.green:c.epcOrd<=3?T.amber:T.red)}>{c.epc}</span></td>
                      <td style={S.td}>{fmt(c.gav,1)}</td>
                      <td style={S.td}>{fmt(c.loan,1)}</td>
                      <td style={S.td}>{fmt(c.ltv,1)}</td>
                      <td style={S.td}>{fmtPct(c.alignedPct)}</td>
                      <td style={S.td}>{c.intensity}</td>
                      <td style={S.td}>{c.retrofit>0?fmt(c.retrofit,2):'—'}</td>
                      <td style={S.td}><DqsPill v={c.dqs}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab===7 && (
          <>
            <div style={S.alertBox}>
              <strong>Solvency II Green Supporting Factor:</strong> EIOPA Opinion 2024/28 and Commission proposal introduce GSF of 0.75–0.80 for Taxonomy-aligned credit spread risk exposures and a 1.50 factor for fossil-fuel assets (penalising). Module simulates SCR relief / penalty impact on own funds.
            </div>
            <div style={S.card}>
              <div style={S.cardH}>SCR Scenario Selector</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {SCR_IMPACT.map(s=>(
                  <button key={s.scenario} style={S.btn(scrScenario===s.scenario)} onClick={()=>setScrScenario(s.scenario)}>{s.scenario}</button>
                ))}
              </div>
            </div>
            {(()=>{
              const sc = SCR_IMPACT.find(s=>s.scenario===scrScenario) || SCR_IMPACT[0];
              return (
                <div style={S.kpiGrid}>
                  <Kpi label="SCR Module" value={sc.scrModule} accent={T.navy}/>
                  <Kpi label="Pre-GSF SCR ($M)" value={fmt(sc.pre,0)}/>
                  <Kpi label="Post-GSF SCR ($M)" value={fmt(sc.post,0)} accent={sc.relief>0?T.sage:T.red}/>
                  <Kpi label="Capital Relief ($M)" value={(sc.relief>=0?'+':'')+fmt(sc.relief,0)} accent={sc.relief>=0?T.green:T.red}/>
                  <Kpi label="Factor" value={sc.factorApplied}/>
                  <Kpi label="Own Funds Δ" value={fmtPct(sc.relief/Math.max(1,sc.pre)*100)}/>
                </div>
              );
            })()}

            <div style={S.grid2}>
              <div style={S.card}>
                <div style={S.cardH}>All Scenarios — Pre vs Post SCR</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={SCR_IMPACT}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="scenario" tick={{fontSize:9,fill:T.textSec,fontFamily:T.mono}} angle={-25} textAnchor="end" height={80}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'SCR ($M)',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                    <Bar dataKey="pre" fill={T.navy} name="Pre-GSF" radius={[3,3,0,0]}/>
                    <Bar dataKey="post" fill={T.gold} name="Post-GSF" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>Capital Relief / Penalty</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={SCR_IMPACT}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="scenario" tick={{fontSize:9,fill:T.textSec,fontFamily:T.mono}} angle={-25} textAnchor="end" height={80}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Bar dataKey="relief" radius={[3,3,3,3]} name="Relief ($M)">
                      {SCR_IMPACT.map((s,i)=><Cell key={i} fill={s.relief>=0?T.green:T.red}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.cardH}>Scenario Table</div>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Scenario</th><th style={S.th}>Module</th><th style={S.th}>Pre ($M)</th><th style={S.th}>Post ($M)</th><th style={S.th}>Δ ($M)</th><th style={S.th}>Factor</th></tr></thead>
                <tbody>
                  {SCR_IMPACT.map((s,i)=>(
                    <tr key={i} style={{background:i%2?T.surfaceH:T.surface}}>
                      <td style={S.td}>{s.scenario}</td>
                      <td style={S.td}>{s.scrModule}</td>
                      <td style={S.td}>{fmt(s.pre,0)}</td>
                      <td style={S.td}>{fmt(s.post,0)}</td>
                      <td style={S.td}><span style={S.pill(s.relief>=0?T.green:T.red)}>{s.relief>=0?'+':''}{fmt(s.relief,0)}</span></td>
                      <td style={S.td}>{s.factorApplied}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab===8 && (
          <>
            <div style={S.kpiGrid}>
              <Kpi label="Total Gross Premium" value={fmtMn(INSURANCE_LOB.reduce((a,l)=>a+l.grossPremium,0))} accent={T.navy}/>
              <Kpi label="Technical Provisions" value={fmtMn(INSURANCE_LOB.reduce((a,l)=>a+l.technProv,0))}/>
              <Kpi label="Weighted Green Share" value={fmtPct(INSURANCE_LOB.reduce((a,l)=>a+l.grossPremium*l.greenShare,0)/Math.max(1,INSURANCE_LOB.reduce((a,l)=>a+l.grossPremium,0)))} accent={T.sage}/>
              <Kpi label="Aggregate SCR" value={fmtMn(INSURANCE_LOB.reduce((a,l)=>a+l.scrBase,0))}/>
              <Kpi label="Nat-Cat Exposure" value={INSURANCE_LOB.filter(l=>l.naturalCat==='High'||l.naturalCat==='Very High').length+' LOBs'} accent={T.red}/>
              <Kpi label="LOB Count" value={INSURANCE_LOB.length}/>
            </div>

            <div style={S.card}>
              <div style={S.cardH}>Underwriting Taxonomy KPI by LOB</div>
              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>Line of Business</th><th style={S.th}>Gross Prem ($M)</th>
                  <th style={S.th}>Tech Prov ($M)</th><th style={S.th}>Green Share %</th>
                  <th style={S.th}>Base SCR ($M)</th><th style={S.th}>Nat-Cat Risk</th>
                  <th style={S.th}>Art 8 Eligibility</th>
                </tr></thead>
                <tbody>
                  {INSURANCE_LOB.map((l,i)=>(
                    <tr key={l.id} style={{background:i%2?T.surfaceH:T.surface}}>
                      <td style={S.td}><strong>{l.name}</strong></td>
                      <td style={S.td}>{fmt(l.grossPremium,0)}</td>
                      <td style={S.td}>{fmt(l.technProv,0)}</td>
                      <td style={S.td}><span style={S.pill(l.greenShare>=20?T.green:l.greenShare>=10?T.amber:T.red)}>{fmtPct(l.greenShare)}</span></td>
                      <td style={S.td}>{fmt(l.scrBase,0)}</td>
                      <td style={S.td}><span style={S.chip(l.naturalCat==='Very High'?T.red:l.naturalCat==='High'?T.amber:T.green)}>{l.naturalCat}</span></td>
                      <td style={S.td}>{l.id.startsWith('P&C-Prop')||l.id==='Reins'?'10.1 Climate NL Ins.':l.id.startsWith('Life')?'10.2 Sustainable Life':'Out-of-scope'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={S.grid2}>
              <div style={S.card}>
                <div style={S.cardH}>Premium vs Green Share</div>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={INSURANCE_LOB}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec,fontFamily:T.mono}} angle={-25} textAnchor="end" height={80}/>
                    <YAxis yAxisId="l" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis yAxisId="r" orientation="right" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                    <Bar yAxisId="l" dataKey="grossPremium" fill={T.navy} name="Gross Premium ($M)" radius={[3,3,0,0]}/>
                    <Line yAxisId="r" dataKey="greenShare" stroke={T.gold} strokeWidth={2.5} name="Green Share %" dot={{r:4}}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>SCR Allocation (Radar)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={INSURANCE_LOB.map(l=>({name:l.name.slice(0,10),scr:l.scrBase,green:l.greenShare*25}))}>
                    <PolarGrid stroke={T.border}/>
                    <PolarAngleAxis dataKey="name" tick={{fontSize:9,fill:T.textSec,fontFamily:T.mono}}/>
                    <PolarRadiusAxis tick={{fontSize:9,fill:T.textSec}}/>
                    <Radar name="SCR ($M)" dataKey="scr" stroke={T.navy} fill={T.navy} fillOpacity={0.4}/>
                    <Radar name="Green (x25)" dataKey="green" stroke={T.gold} fill={T.gold} fillOpacity={0.3}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {tab===9 && (
          <>
            <div style={S.alertBox}>
              <strong>Triple-Reporting Mandate:</strong> CSRD ESRS E1 datapoints must reconcile with SFDR PAI (Regulation 2022/1288) and Taxonomy Art 8. This view tracks PCAF-sourced datapoints ready for CSRD assurance, maps to SFDR PAI indicators, and flags gaps.
            </div>
            <div style={S.kpiGrid}>
              <Kpi label="Total Datapoints" value={CSRD_DATAPOINTS.length} accent={T.navy}/>
              <Kpi label="Ready" value={CSRD_DATAPOINTS.filter(d=>d.status==='Ready').length} accent={T.green}/>
              <Kpi label="Partial" value={CSRD_DATAPOINTS.filter(d=>d.status==='Partial').length} accent={T.amber}/>
              <Kpi label="Gaps" value={CSRD_DATAPOINTS.filter(d=>d.status==='Gap').length} accent={T.red}/>
              <Kpi label="Avg Gap %" value={fmtPct(CSRD_DATAPOINTS.reduce((a,d)=>a+d.gap,0)/Math.max(1,CSRD_DATAPOINTS.length))}/>
              <Kpi label="Readiness Score" value={fmtPct((CSRD_DATAPOINTS.filter(d=>d.status==='Ready').length/Math.max(1,CSRD_DATAPOINTS.length))*100)} accent={T.sage}/>
            </div>
            <div style={S.card}>
              <div style={S.cardH}>CSRD / SFDR / Taxonomy Datapoint Inventory</div>
              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>Datapoint ID</th><th style={S.th}>Name</th><th style={S.th}>Status</th>
                  <th style={S.th}>Source System</th><th style={S.th}>Evidence</th><th style={S.th}>Gap %</th>
                </tr></thead>
                <tbody>
                  {CSRD_DATAPOINTS.map((d,i)=>(
                    <tr key={d.id} style={{background:i%2?T.surfaceH:T.surface}}>
                      <td style={S.td}><strong>{d.id}</strong></td>
                      <td style={S.td}>{d.name}</td>
                      <td style={S.td}><StatusPill s={d.status}/></td>
                      <td style={S.td}>{d.source}</td>
                      <td style={S.td}>{d.evidence}</td>
                      <td style={S.td}>{d.gap>0?<span style={S.pill(T.red)}>{d.gap}%</span>:'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={S.grid2}>
              <div style={S.card}>
                <div style={S.cardH}>Readiness Breakdown</div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={[
                      {name:'Ready',value:CSRD_DATAPOINTS.filter(d=>d.status==='Ready').length},
                      {name:'Partial',value:CSRD_DATAPOINTS.filter(d=>d.status==='Partial').length},
                      {name:'Gap',value:CSRD_DATAPOINTS.filter(d=>d.status==='Gap').length},
                    ]} dataKey="value" outerRadius={100} label={(e)=>`${e.name}: ${e.value}`}>
                      <Cell fill={T.green}/><Cell fill={T.amber}/><Cell fill={T.red}/>
                    </Pie>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>Source System Coverage</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={Array.from(new Set(CSRD_DATAPOINTS.map(d=>d.source))).map(src=>({src,n:CSRD_DATAPOINTS.filter(d=>d.source===src).length}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="src" tick={{fontSize:9,fill:T.textSec,fontFamily:T.mono}} angle={-25} textAnchor="end" height={80}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Bar dataKey="n" fill={T.navy} radius={[3,3,0,0]} name="Datapoints"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {tab===10 && (
          <>
            <div style={S.alertBox}>
              <strong>PCAF Data Quality Scoring (1=best, 5=lowest):</strong> Per the PCAF Standard (3rd Edition, Dec 2025 — the five-level data quality scale is unchanged from the 2nd Edition), DQS governs emissions attribution confidence. FI-wide weighted DQS should trend towards 2.0 by 2030.
            </div>
            <div style={S.kpiGrid}>
              <Kpi label="Wtd. Portfolio DQS" value={fmt(pcafDqs,2)} accent={pcafDqs<=2.5?T.green:pcafDqs<=3.5?T.amber:T.red}/>
              <Kpi label="DQS 1-2 Share" value={fmtPct(DQS_DETAILS.slice(0,2).reduce((a,d)=>a+d.share,0))} accent={T.green}/>
              <Kpi label="DQS 4-5 Share" value={fmtPct(DQS_DETAILS.slice(3).reduce((a,d)=>a+d.share,0))} accent={T.red}/>
              <Kpi label="DQS Target 2030" value="2.00" accent={T.gold}/>
            </div>

            <div style={S.card}>
              <div style={S.cardH}>DQS Level Definitions (PCAF Standard, 3rd Ed. Dec 2025)</div>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Score</th><th style={S.th}>Label</th><th style={S.th}>Description</th><th style={S.th}>Portfolio Share</th></tr></thead>
                <tbody>
                  {DQS_DETAILS.map((d,i)=>(
                    <tr key={d.score} style={{background:i%2?T.surfaceH:T.surface}}>
                      <td style={S.td}><DqsPill v={d.score}/></td>
                      <td style={S.td}><strong>{d.label}</strong></td>
                      <td style={S.td}>{d.desc}</td>
                      <td style={S.td}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:120,height:8,background:T.surfaceH,borderRadius:4,overflow:'hidden'}}>
                            <div style={{width:`${d.share}%`,height:'100%',background:d.color}}/>
                          </div>
                          <span style={{fontFamily:T.mono,fontSize:11}}>{d.share}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={S.grid2}>
              <div style={S.card}>
                <div style={S.cardH}>DQS Distribution by Loan Count</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[1,2,3,4,5].map(s=>({score:`DQS ${s}`,count:LOAN_BOOK.filter(l=>l.dqs===s).length}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="score" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Bar dataKey="count" radius={[3,3,0,0]}>
                      {[1,2,3,4,5].map(s=><Cell key={s} fill={DQS_DETAILS[s-1].color}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>DQS Improvement Pathway (2026 → 2030)</div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={[2026,2027,2028,2029,2030].map((y,i)=>({year:y,actual:i===0?pcafDqs:null,pathway:+(pcafDqs-i*((pcafDqs-2.0)/4)).toFixed(2),target:2.0}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis domain={[1,5]} tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                    <Line dataKey="actual" stroke={T.navy} strokeWidth={3} name="Actual" dot={{r:5}}/>
                    <Line dataKey="pathway" stroke={T.gold} strokeWidth={2} strokeDasharray="5 3" name="Pathway" dot={false}/>
                    <Line dataKey="target" stroke={T.sage} strokeWidth={1.5} name="Target 2.0" dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {tab===11 && (
          <>
            <div style={S.kpiGrid}>
              <Kpi label="NACE Codes Mapped" value={NACE_MAP.length} accent={T.navy}/>
              <Kpi label="Fully Eligible" value={NACE_MAP.filter(n=>n.eligible==='Yes').length} accent={T.green}/>
              <Kpi label="Partial" value={NACE_MAP.filter(n=>n.eligible==='Partial').length} accent={T.amber}/>
              <Kpi label="Excluded" value={NACE_MAP.filter(n=>n.eligible==='No').length} accent={T.red}/>
              <Kpi label="DNSH Pass" value={NACE_MAP.filter(n=>n.ccmDNSH==='Pass').length}/>
              <Kpi label="DNSH Fail" value={NACE_MAP.filter(n=>n.ccmDNSH==='Fail').length} accent={T.red}/>
            </div>
            <div style={S.card}>
              <div style={S.cardH}>NACE ⇄ Taxonomy Technical Screening Criteria Map</div>
              <div style={{maxHeight:540,overflow:'auto'}}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>NACE</th><th style={S.th}>Description</th><th style={S.th}>Taxonomy Activity (TSC)</th>
                    <th style={S.th}>Eligible</th><th style={S.th}>CCM DNSH</th>
                  </tr></thead>
                  <tbody>
                    {NACE_MAP.map((n,i)=>(
                      <tr key={n.nace} style={{background:i%2?T.surfaceH:T.surface}}>
                        <td style={S.td}><strong>{n.nace}</strong></td>
                        <td style={S.td}>{n.desc}</td>
                        <td style={S.td}>{n.tsc}</td>
                        <td style={S.td}><span style={S.pill(n.eligible==='Yes'?T.green:n.eligible==='Partial'?T.amber:T.red)}>{n.eligible}</span></td>
                        <td style={S.td}><span style={S.chip(n.ccmDNSH==='Pass'?T.green:n.ccmDNSH==='Cond.'?T.amber:n.ccmDNSH==='Fail'?T.red:T.textMut)}>{n.ccmDNSH}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.cardH}>Eligibility Distribution</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={['Yes','Partial','No'].map(e=>({elig:e,count:NACE_MAP.filter(n=>n.eligible===e).length}))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="elig" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                  <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                  <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                  <Bar dataKey="count" radius={[3,3,0,0]}>
                    <Cell fill={T.green}/><Cell fill={T.amber}/><Cell fill={T.red}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {tab===12 && (
          <>
            <div style={S.alertBox}>
              <strong>Regulatory Capital Impact:</strong> This view aggregates Pillar 1 (SCR / RWA), Pillar 2 (ICAAP / ORSA), and Pillar 3 (disclosure) effects of Taxonomy alignment via GSF scenarios. Cross-applies to CRR Art 501a green SMEs and EBA Art 501b for infrastructure.
            </div>
            {(()=>{
              const sc = SCR_IMPACT.find(s=>s.scenario===scrScenario) || SCR_IMPACT[0];
              const rwaBase = 58200;
              const rwaAdj = rwaBase - sc.relief * 12.5;
              return (
                <>
                  <div style={S.kpiGrid}>
                    <Kpi label="Baseline RWA ($M)" value={fmt(rwaBase,0)} accent={T.navy}/>
                    <Kpi label="Adjusted RWA ($M)" value={fmt(rwaAdj,0)} accent={T.gold}/>
                    <Kpi label="CET1 Ratio (pre)" value={fmtPct(13.6)} sub="€4.2Bn own funds"/>
                    <Kpi label="CET1 Ratio (post)" value={fmtPct(13.6*rwaBase/Math.max(1,rwaAdj))} accent={T.sage}/>
                    <Kpi label="ICAAP Buffer" value={fmtPct(2.4)} sub="P2G"/>
                    <Kpi label="CCB + CCYB" value={fmtPct(3.0)} sub="Combined"/>
                  </div>
                  <div style={S.grid2}>
                    <div style={S.card}>
                      <div style={S.cardH}>RWA Density by Asset Class</div>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={ASSET_CLASSES.map(a=>({code:a.code,rwa:+(rwaBase*a.weight).toFixed(0),adj:+((rwaBase-sc.relief*a.weight*12.5)*a.weight/a.weight).toFixed(0)}))}>
                          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                          <XAxis dataKey="code" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                          <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                          <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                          <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                          <Bar dataKey="rwa" fill={T.navy} name="Base RWA" radius={[3,3,0,0]}/>
                          <Bar dataKey="adj" fill={T.gold} name="GSF-Adj RWA" radius={[3,3,0,0]}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={S.card}>
                      <div style={S.cardH}>Capital Stack Waterfall</div>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[
                          {l:'CET1 Reqmt',v:4.5},{l:'+Cap Cons. Buffer',v:2.5},{l:'+CCYB',v:0.5},
                          {l:'+O-SII Buffer',v:1.0},{l:'+P2R',v:1.8},{l:'+P2G',v:2.4},{l:'Total',v:12.7},
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                          <XAxis dataKey="l" tick={{fontSize:9,fill:T.textSec,fontFamily:T.mono}} angle={-25} textAnchor="end" height={70}/>
                          <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'% of RWA',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                          <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                          <Bar dataKey="v" fill={T.navy} radius={[3,3,0,0]}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              );
            })()}
            <div style={S.card}>
              <div style={S.cardH}>Pillar 1/2/3 Impact Summary</div>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Pillar</th><th style={S.th}>Requirement</th><th style={S.th}>Pre-GSF</th><th style={S.th}>Post-GSF</th><th style={S.th}>Impact</th></tr></thead>
                <tbody>
                  {[
                    {p:'Pillar 1',req:'RWA (CRR)',pre:'$58.2Bn',post:'$56.1Bn',imp:'-3.6%',c:T.sage},
                    {p:'Pillar 1',req:'SCR (Solv II)',pre:'$15.2Bn',post:'$13.3Bn',imp:'-12.6%',c:T.sage},
                    {p:'Pillar 2',req:'ICAAP SREP',pre:'P2R 1.8%',post:'P2R 1.6%',imp:'-20bps',c:T.sage},
                    {p:'Pillar 2',req:'ORSA (Solv II)',pre:'Green premium 18.9%',post:'Target 25%',imp:'+6.1pts',c:T.gold},
                    {p:'Pillar 3',req:'EBA ESG Pillar 3',pre:'Partial',post:'Full per ITS',imp:'Compliant',c:T.green},
                    {p:'Pillar 3',req:'Taxonomy Art 8 DA',pre:'KPI1-5',post:'KPI1-7',imp:'Expanded',c:T.green},
                  ].map((r,i)=>(
                    <tr key={i} style={{background:i%2?T.surfaceH:T.surface}}>
                      <td style={S.td}><strong>{r.p}</strong></td>
                      <td style={S.td}>{r.req}</td>
                      <td style={S.td}>{r.pre}</td>
                      <td style={S.td}>{r.post}</td>
                      <td style={S.td}><span style={S.chip(r.c)}>{r.imp}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab===13 && (
          <>
            <div style={S.kpiGrid}>
              <Kpi label="Templates" value={KPI_TEMPLATES.length} accent={T.navy}/>
              <Kpi label="Avg KPI Value" value={fmtPct(KPI_TEMPLATES.reduce((a,k)=>a+k.value,0)/Math.max(1,KPI_TEMPLATES.length))} accent={T.gold}/>
              <Kpi label="Avg Benchmark" value={fmtPct(KPI_TEMPLATES.reduce((a,k)=>a+k.benchmark,0)/Math.max(1,KPI_TEMPLATES.length))}/>
              <Kpi label="Gap to Peer Median" value={fmtPct(KPI_TEMPLATES.reduce((a,k)=>a+(k.benchmark-k.value),0)/Math.max(1,KPI_TEMPLATES.length))} accent={T.amber}/>
            </div>
            <div style={S.card}>
              <div style={S.cardH}>EBA ITS J — Disclosure KPI Templates (KPI1–KPI7)</div>
              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>KPI</th><th style={S.th}>Name</th><th style={S.th}>Scope</th><th style={S.th}>Metric</th>
                  <th style={S.th}>Current %</th><th style={S.th}>Peer Benchmark %</th><th style={S.th}>Gap</th>
                </tr></thead>
                <tbody>
                  {KPI_TEMPLATES.map((k,i)=>(
                    <tr key={k.id} style={{background:i%2?T.surfaceH:T.surface}}>
                      <td style={S.td}><strong>{k.id}</strong></td>
                      <td style={S.td}>{k.name}</td>
                      <td style={S.td}><span style={S.chip(T.navy)}>{k.scope}</span></td>
                      <td style={S.td}>{k.metric}</td>
                      <td style={S.td}>{fmtPct(k.value)}</td>
                      <td style={S.td}>{fmtPct(k.benchmark)}</td>
                      <td style={S.td}><span style={S.pill(k.value>=k.benchmark?T.green:T.red)}>{(k.value-k.benchmark).toFixed(1)} pts</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={S.grid2}>
              <div style={S.card}>
                <div style={S.cardH}>KPI vs Benchmark</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={KPI_TEMPLATES}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="id" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'%',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                    <Bar dataKey="value" fill={T.navy} name="Current" radius={[3,3,0,0]}/>
                    <Bar dataKey="benchmark" fill={T.gold} name="Peer Benchmark" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>KPI Radar vs Benchmark</div>
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={KPI_TEMPLATES}>
                    <PolarGrid stroke={T.border}/>
                    <PolarAngleAxis dataKey="id" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <PolarRadiusAxis tick={{fontSize:9,fill:T.textSec}}/>
                    <Radar name="Current" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.35}/>
                    <Radar name="Benchmark" dataKey="benchmark" stroke={T.gold} fill={T.gold} fillOpacity={0.25}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.cardH}>Methodology &amp; Assurance Notes</div>
              <ul style={{fontSize:12,color:T.textSec,lineHeight:1.8,paddingLeft:18,margin:0}}>
                <li><strong style={{color:T.navy}}>KPI1-3 (Stock):</strong> Turnover / CapEx / OpEx KPIs — computed on in-scope denominator per Art 8 DA Annex V.</li>
                <li><strong style={{color:T.navy}}>KPI4 (Flow):</strong> New origination during reporting period only — excludes maturities &amp; pay-downs.</li>
                <li><strong style={{color:T.navy}}>KPI5 (Trading):</strong> Excludes derivatives, held-for-trading equities &lt; 90d, reverse repos, cleared margin.</li>
                <li><strong style={{color:T.navy}}>KPI6 (Services):</strong> Fees from advisory/underwriting where counterparty activity is aligned.</li>
                <li><strong style={{color:T.navy}}>KPI7 (OBS):</strong> Off-balance sheet items: guarantees, letters of credit, undrawn commitments.</li>
                <li><strong style={{color:T.navy}}>Assurance:</strong> Limited assurance mandatory 2024-28; reasonable assurance from 2028.</li>
              </ul>
            </div>
          </>
        )}

        {tab===14 && (() => {
          const scen = NGFS_SCENARIOS_PD.find(s=>s.id===ngfsScenario) || NGFS_SCENARIOS_PD[0];
          const stressed = LOAN_BOOK.map(l => {
            const secMult = (SECTOR_PD_MULT[l.sector] && SECTOR_PD_MULT[l.sector][scen.id]) || scen.pdMult;
            const basePd = l.pd / 100;
            const stressedPd = Math.min(0.99, basePd * secMult);
            const stressedLgd = Math.min(0.99, (l.lgd/100) + scen.lgdShift);
            const baseEL = l.ead * basePd * (l.lgd/100);
            const stressedEL = l.ead * stressedPd * stressedLgd;
            const deltaEL = stressedEL - baseEL;
            return { ...l, basePd, stressedPd: +stressedPd, stressedLgd, baseEL, stressedEL, deltaEL };
          });
          const totalBase = stressed.reduce((a,s)=>a+s.baseEL,0);
          const totalStressed = stressed.reduce((a,s)=>a+s.stressedEL,0);
          const totalDelta = totalStressed - totalBase;
          const feBase = LOAN_BOOK.reduce((a,l)=>a+l.fe,0);
          const feStressed = feBase * (1 + scen.feShift);
          const sectorAgg = SECTORS.map(s => {
            const ls = stressed.filter(x=>x.sector===s);
            const b = ls.reduce((a,x)=>a+x.baseEL,0);
            const st = ls.reduce((a,x)=>a+x.stressedEL,0);
            return { sector: s, base: +b.toFixed(2), stressed: +st.toFixed(2), delta: +(st-b).toFixed(2) };
          });
          const fanChart = [2026,2028,2030,2035,2040,2045,2050].map((yr,i) => {
            const t = i/6;
            return {
              year: yr,
              orderly: +(totalBase * (1 + (NGFS_SCENARIOS_PD[0].pdMult-1)*t)).toFixed(1),
              delayed: +(totalBase * (1 + (NGFS_SCENARIOS_PD[1].pdMult-1)*t)).toFixed(1),
              hothouse: +(totalBase * (1 + (NGFS_SCENARIOS_PD[2].pdMult-1)*t*(1+t*0.4))).toFixed(1),
              current: +(totalBase * (1 + (NGFS_SCENARIOS_PD[3].pdMult-1)*t)).toFixed(1),
              nz2050: +(totalBase * (1 + (NGFS_SCENARIOS_PD[4].pdMult-1)*t)).toFixed(1),
            };
          });
          const waterfall = [
            { label: 'Base EL', val: +totalBase.toFixed(1), color: T.navy },
            { label: 'Δ PD (Transition)', val: +((stressed.reduce((a,s)=>a+s.ead*(s.stressedPd-s.basePd)*(s.lgd/100),0))).toFixed(1), color: T.amber },
            { label: 'Δ LGD (Collateral)', val: +((stressed.reduce((a,s)=>a+s.ead*s.stressedPd*scen.lgdShift,0))).toFixed(1), color: T.red },
            { label: 'Stressed EL', val: +totalStressed.toFixed(1), color: T.sage },
          ];
          return (
          <>
            <div style={S.alertBox}>
              <strong>NGFS PHASE IV STRESS LAB</strong> — applies sector-specific PD multipliers &amp; LGD shifts per NGFS long-term scenarios. EL = PD × LGD × EAD per Basel framework. Fan chart shows 2026-2050 loss trajectory.
            </div>
            <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
              <span style={S.label}>NGFS Scenario:</span>
              {NGFS_SCENARIOS_PD.map(s => (
                <button key={s.id} style={{...S.btn(ngfsScenario===s.id),borderColor:ngfsScenario===s.id?s.color:T.border,background:ngfsScenario===s.id?s.color:T.surface}} onClick={()=>setNgfsScenario(s.id)}>{s.name}</button>
              ))}
            </div>
            <div style={S.kpiGrid}>
              <Kpi label="BASE EL" value={fmtMn(totalBase)} sub={`${LOAN_BOOK.length} loans`} accent={T.navy}/>
              <Kpi label="STRESSED EL" value={fmtMn(totalStressed)} sub={scen.name} accent={scen.color}/>
              <Kpi label="Δ EL" value={(totalDelta>=0?'+':'')+fmtMn(totalDelta)} sub={`${fmtPct(totalBase>0?totalDelta/totalBase*100:0)} vs base`} accent={totalDelta>0?T.red:T.green}/>
              <Kpi label="Δ FE (financed CO₂e)" value={fmtPct(scen.feShift*100)} sub={`${fmtMn(feStressed-feBase)}e tCO₂`} accent={T.gold}/>
              <Kpi label="GDP IMPACT 2030" value={fmtPct(scen.gdp2030)} sub="vs reference" accent={T.amber}/>
              <Kpi label="GDP IMPACT 2050" value={fmtPct(scen.gdp2050)} sub="vs reference" accent={T.red}/>
            </div>
            <div style={S.grid2}>
              <div style={S.card}>
                <div style={S.cardH}>EL Decomposition Waterfall</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={waterfall}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="label" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'$M',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Bar dataKey="val" radius={[3,3,0,0]}>
                      {waterfall.map((e,i)=><Cell key={i} fill={e.color}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>Sector EL: Base vs Stressed</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={sectorAgg}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'$M',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                    <Bar stackId="a" dataKey="base" fill={T.navyL} name="Base EL" radius={[0,0,0,0]}/>
                    <Bar stackId="a" dataKey="delta" fill={scen.color} name="Incremental (Stress)" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.cardH}>Fan Chart: Portfolio EL Trajectory 2026-2050 — All NGFS Scenarios</div>
              <ResponsiveContainer width="100%" height={360}>
                <ComposedChart data={fanChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                  <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'EL ($M)',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                  <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                  <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                  <Area type="monotone" dataKey="hothouse" stroke={NGFS_SCENARIOS_PD[2].color} fill={NGFS_SCENARIOS_PD[2].color} fillOpacity={0.15} name="Hot House"/>
                  <Area type="monotone" dataKey="current" stroke={NGFS_SCENARIOS_PD[3].color} fill={NGFS_SCENARIOS_PD[3].color} fillOpacity={0.10} name="Current Policies"/>
                  <Line type="monotone" dataKey="delayed" stroke={NGFS_SCENARIOS_PD[1].color} strokeWidth={2} name="Delayed Transition" dot={false}/>
                  <Line type="monotone" dataKey="orderly" stroke={NGFS_SCENARIOS_PD[0].color} strokeWidth={2} name="Orderly" dot={false}/>
                  <Line type="monotone" dataKey="nz2050" stroke={NGFS_SCENARIOS_PD[4].color} strokeWidth={2} strokeDasharray="4 3" name="Net Zero 2050" dot={false}/>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={S.card}>
              <div style={S.cardH}>Top 12 Loans by Δ EL — {scen.name}</div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Loan ID</th><th style={S.th}>Counterparty</th><th style={S.th}>Sector</th>
                    <th style={S.th}>EAD</th><th style={S.th}>Base PD</th><th style={S.th}>Stressed PD</th>
                    <th style={S.th}>Base EL</th><th style={S.th}>Stressed EL</th><th style={S.th}>Δ EL</th>
                  </tr></thead>
                  <tbody>
                    {[...stressed].sort((a,b)=>b.deltaEL-a.deltaEL).slice(0,12).map(s => (
                      <tr key={s.id}>
                        <td style={S.td}>{s.id}</td><td style={S.td}>{s.counterparty}</td><td style={S.td}>{s.sector}</td>
                        <td style={S.td}>{fmtMn(s.ead)}</td>
                        <td style={S.td}>{fmtPct(s.basePd*100)}</td>
                        <td style={{...S.td,color:scen.color,fontWeight:700}}>{fmtPct(s.stressedPd*100)}</td>
                        <td style={S.td}>{fmtMn(s.baseEL)}</td>
                        <td style={S.td}>{fmtMn(s.stressedEL)}</td>
                        <td style={{...S.td,color:s.deltaEL>0?T.red:T.green,fontWeight:700}}>{(s.deltaEL>=0?'+':'')+fmtMn(s.deltaEL)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
          );
        })()}

        {tab===15 && (() => {
          const irbLoans = LOAN_BOOK.map(l => {
            const pd = l.pd/100;
            const lgd = l.lgd/100;
            const M = Math.max(1, Math.min(5, l.maturity/4 + 1));
            const kVal = irbK(pd, lgd, M);
            const rwa = kVal * 12.5 * l.ead;
            const capital = kVal * l.ead;
            return { ...l, M:+M.toFixed(2), k:+kVal, rwa:+rwa.toFixed(2), capital:+capital.toFixed(3), R:+baselR(pd).toFixed(3) };
          });
          const totalRWA = irbLoans.reduce((a,l)=>a+l.rwa,0);
          const totalEAD = irbLoans.reduce((a,l)=>a+l.ead,0);
          const totalCapital = irbLoans.reduce((a,l)=>a+l.capital,0);
          const rwaDensity = totalEAD>0 ? totalRWA/totalEAD*100 : 0;
          const stressedK = irbLoans.map(l => {
            const secMult = (SECTOR_PD_MULT[l.sector] && SECTOR_PD_MULT[l.sector]['DEL']) || 1.34;
            const stPd = Math.min(0.99, (l.pd/100) * secMult);
            const stK = irbK(stPd, l.lgd/100, l.M);
            return stK * 12.5 * l.ead;
          });
          const stressedRWA = stressedK.reduce((a,x)=>a+x,0);
          const sectorRWA = SECTORS.map(s => {
            const ls = irbLoans.filter(x=>x.sector===s);
            const tEad = ls.reduce((a,x)=>a+x.ead,0);
            const tRwa = ls.reduce((a,x)=>a+x.rwa,0);
            return { sector: s, ead: +tEad.toFixed(1), rwa: +tRwa.toFixed(1), density: tEad>0?+(tRwa/tEad*100).toFixed(1):0 };
          });
          const rwaBuckets = [
            { bucket: '0-30%', count: irbLoans.filter(l=>l.ead>0 && l.rwa/l.ead<0.3).length, color: T.green },
            { bucket: '30-60%', count: irbLoans.filter(l=>l.ead>0 && l.rwa/l.ead>=0.3 && l.rwa/l.ead<0.6).length, color: T.sage },
            { bucket: '60-100%', count: irbLoans.filter(l=>l.ead>0 && l.rwa/l.ead>=0.6 && l.rwa/l.ead<1.0).length, color: T.gold },
            { bucket: '100-150%', count: irbLoans.filter(l=>l.ead>0 && l.rwa/l.ead>=1.0 && l.rwa/l.ead<1.5).length, color: T.amber },
            { bucket: '>150%', count: irbLoans.filter(l=>l.ead>0 && l.rwa/l.ead>=1.5).length, color: T.red },
          ];
          // Concentration: HHI on EAD
          const hhi = totalEAD>0 ? irbLoans.reduce((a,l)=>a+Math.pow(l.ead/totalEAD*100,2),0) : 0;
          return (
          <>
            <div style={S.alertBox}>
              <strong>BASEL IRB CAPITAL &amp; RWA MODEL</strong> — asymptotic single risk factor (ASRF): K = LGD × [Φ((Φ⁻¹(PD)+√R·Φ⁻¹(0.999))/√(1-R))] × M_adj; R = 0.12·(1-e⁻⁵⁰·ᴾᴰ)/(1-e⁻⁵⁰) + 0.24·(1-...). RWA = K × 12.5 × EAD per BCBS 128.
            </div>
            <div style={S.kpiGrid}>
              <Kpi label="TOTAL EAD" value={fmtMn(totalEAD)} sub={`${irbLoans.length} loans`} accent={T.navy}/>
              <Kpi label="TOTAL RWA" value={fmtMn(totalRWA)} sub="Basel IRB-A" accent={T.gold}/>
              <Kpi label="CAPITAL REQ (8%)" value={fmtMn(totalCapital)} sub="Pillar 1 minimum" accent={T.sage}/>
              <Kpi label="RWA DENSITY" value={fmtPct(rwaDensity)} sub="RWA / EAD" accent={T.amber}/>
              <Kpi label="NGFS-DELAYED RWA" value={fmtMn(stressedRWA)} sub={`+${fmtPct(totalRWA>0?(stressedRWA-totalRWA)/totalRWA*100:0)} vs base`} accent={T.red}/>
              <Kpi label="CONCENTRATION (HHI)" value={fmt(hhi,0)} sub={hhi<500?'Low':hhi<1500?'Moderate':'High'} accent={hhi<1500?T.green:T.red}/>
            </div>
            <div style={S.grid2}>
              <div style={S.card}>
                <div style={S.cardH}>RWA Density Distribution</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={rwaBuckets}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="bucket" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'# Loans',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Bar dataKey="count" radius={[3,3,0,0]}>
                      {rwaBuckets.map((e,i)=><Cell key={i} fill={e.color}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>Sector RWA &amp; Density</div>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={sectorRWA}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis yAxisId="l" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'RWA ($M)',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                    <YAxis yAxisId="r" orientation="right" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'Density %',angle:90,position:'insideRight',style:{fontSize:10,fill:T.textSec}}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                    <Bar yAxisId="l" dataKey="rwa" fill={T.navy} name="RWA $M" radius={[3,3,0,0]}/>
                    <Line yAxisId="r" type="monotone" dataKey="density" stroke={T.gold} strokeWidth={2} name="RWA Density %" dot={{r:3,fill:T.gold}}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.cardH}>Per-Loan IRB Capital Calculation (Top 15 by RWA)</div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>ID</th><th style={S.th}>Sector</th>
                    <th style={S.th}>EAD</th><th style={S.th}>PD%</th><th style={S.th}>LGD%</th>
                    <th style={S.th}>R (corr)</th><th style={S.th}>M</th><th style={S.th}>K</th>
                    <th style={S.th}>RWA</th><th style={S.th}>Density</th><th style={S.th}>Capital</th>
                  </tr></thead>
                  <tbody>
                    {[...irbLoans].sort((a,b)=>b.rwa-a.rwa).slice(0,15).map(l => (
                      <tr key={l.id}>
                        <td style={S.td}>{l.id}</td><td style={S.td}>{l.sector}</td>
                        <td style={S.td}>{fmtMn(l.ead)}</td><td style={S.td}>{fmt(l.pd,2)}</td>
                        <td style={S.td}>{fmt(l.lgd,1)}</td><td style={S.td}>{fmt(l.R,3)}</td>
                        <td style={S.td}>{fmt(l.M,2)}</td><td style={S.td}>{fmt(l.k*100,2)}%</td>
                        <td style={S.td}>{fmtMn(l.rwa)}</td>
                        <td style={S.td}>{fmtPct(l.ead>0?l.rwa/l.ead*100:0)}</td>
                        <td style={{...S.td,color:T.gold,fontWeight:700}}>{fmtMn(l.capital)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
          );
        })()}

        {tab===16 && (() => {
          const ecl = LOAN_BOOK.map(l => {
            const basePd = l.pd/100;
            const lgd = l.lgd/100;
            const uplift = CLIMATE_PD_UPLIFT[l.sector] || 1.15;
            const climatePd = Math.min(0.99, basePd * (1 + (uplift-1) * ifrsOverlay));
            let stage = 1;
            if (climatePd*100 > 6.0) stage = 3;
            else if (climatePd*100 > 2.0) stage = 2;
            const maturityYrs = Math.max(1, l.maturity/4);
            // 12m ECL for Stage 1; lifetime (approx) for Stage 2/3
            const ecl12 = l.ead * climatePd * lgd;
            const eclLife = l.ead * (1 - Math.pow(1 - climatePd, maturityYrs)) * lgd;
            const eclBook = stage===1 ? ecl12 : eclLife;
            // Base ECL (no climate overlay)
            const baseEcl12 = l.ead * basePd * lgd;
            const baseEclLife = l.ead * (1 - Math.pow(1 - basePd, maturityYrs)) * lgd;
            const baseEclBook = (basePd*100 > 2.0) ? baseEclLife : baseEcl12;
            return { ...l, climatePd, stage, eclBook:+eclBook.toFixed(2), baseEclBook:+baseEclBook.toFixed(2), uplift, maturityYrs:+maturityYrs.toFixed(1) };
          });
          const stage1 = ecl.filter(e=>e.stage===1);
          const stage2 = ecl.filter(e=>e.stage===2);
          const stage3 = ecl.filter(e=>e.stage===3);
          const s1Ead = stage1.reduce((a,e)=>a+e.ead,0);
          const s2Ead = stage2.reduce((a,e)=>a+e.ead,0);
          const s3Ead = stage3.reduce((a,e)=>a+e.ead,0);
          const s1Ecl = stage1.reduce((a,e)=>a+e.eclBook,0);
          const s2Ecl = stage2.reduce((a,e)=>a+e.eclBook,0);
          const s3Ecl = stage3.reduce((a,e)=>a+e.eclBook,0);
          const totalEcl = s1Ecl+s2Ecl+s3Ecl;
          const baseTotalEcl = ecl.reduce((a,e)=>a+e.baseEclBook,0);
          const totalEad = s1Ead+s2Ead+s3Ead;
          const coverageRatio = totalEad>0 ? totalEcl/totalEad*100 : 0;
          const climateUplift = baseTotalEcl>0 ? (totalEcl-baseTotalEcl)/baseTotalEcl*100 : 0;
          const stageData = [
            { stage: 'Stage 1', ead: +s1Ead.toFixed(1), ecl: +s1Ecl.toFixed(2), count: stage1.length, color: IFRS_STAGE_RULES[0].color },
            { stage: 'Stage 2', ead: +s2Ead.toFixed(1), ecl: +s2Ecl.toFixed(2), count: stage2.length, color: IFRS_STAGE_RULES[1].color },
            { stage: 'Stage 3', ead: +s3Ead.toFixed(1), ecl: +s3Ecl.toFixed(2), count: stage3.length, color: IFRS_STAGE_RULES[2].color },
          ];
          const decomp = [
            { comp: 'Base PD', val: +baseTotalEcl.toFixed(2), color: T.navy },
            { comp: 'Climate Uplift', val: +(totalEcl-baseTotalEcl).toFixed(2), color: T.amber },
            { comp: 'Climate-Adj ECL', val: +totalEcl.toFixed(2), color: T.red },
          ];
          const sectorUplift = SECTORS.map(s => ({
            sector: s,
            uplift: +((CLIMATE_PD_UPLIFT[s]||1.15)*100-100).toFixed(1),
          }));
          return (
          <>
            <div style={S.alertBox}>
              <strong>IFRS 9 EXPECTED CREDIT LOSS × CLIMATE OVERLAY</strong> — SICR-based staging (PD &gt; 2% → Stage 2; PD &gt; 6% → Stage 3). 12-month ECL for Stage 1; lifetime ECL for Stage 2/3. Climate overlay uplift = sector-specific PD multiplier per TPT/ECB sector vulnerability grid.
            </div>
            <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
              <span style={S.label}>Climate Overlay Intensity: {fmt(ifrsOverlay*100,0)}%</span>
              <input type="range" min={0} max={2} step={0.05} value={ifrsOverlay} onChange={e=>setIfrsOverlay(+e.target.value)} style={{...S.slider,maxWidth:320}}/>
              <span style={{fontSize:11,color:T.textSec,fontFamily:T.mono}}>0% = no overlay · 100% = full sector uplift · 200% = severe stress</span>
            </div>
            <div style={S.kpiGrid}>
              <Kpi label="TOTAL ECL" value={fmtMn(totalEcl)} sub={`${ecl.length} loans`} accent={T.navy}/>
              <Kpi label="BASE ECL (no climate)" value={fmtMn(baseTotalEcl)} sub="Status quo" accent={T.navyL}/>
              <Kpi label="CLIMATE UPLIFT" value={fmtPct(climateUplift)} sub="Δ vs base" accent={climateUplift>20?T.red:T.amber}/>
              <Kpi label="COVERAGE RATIO" value={fmtPct(coverageRatio)} sub="ECL / EAD" accent={T.gold}/>
              <Kpi label="STAGE 2 MIGRATION" value={`${stage2.length} loans`} sub={fmtMn(s2Ead)} accent={IFRS_STAGE_RULES[1].color}/>
              <Kpi label="STAGE 3 (NPL)" value={`${stage3.length} loans`} sub={fmtMn(s3Ead)} accent={IFRS_STAGE_RULES[2].color}/>
            </div>
            <div style={S.grid3}>
              <div style={S.card}>
                <div style={S.cardH}>Stage Distribution (EAD)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={stageData} dataKey="ead" nameKey="stage" outerRadius={90} label={({stage,ead})=>`${stage}: ${fmtMn(ead)}`}>
                      {stageData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                    </Pie>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>ECL Decomposition</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={decomp}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="comp" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'$M',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Bar dataKey="val" radius={[3,3,0,0]}>
                      {decomp.map((e,i)=><Cell key={i} fill={e.color}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>Sector Climate PD Uplift %</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[...sectorUplift].sort((a,b)=>b.uplift-a.uplift)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis type="number" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis type="category" dataKey="sector" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} width={90}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Bar dataKey="uplift" fill={T.amber} radius={[0,3,3,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.cardH}>Loan-Level Stage &amp; ECL (Top 15 by ECL)</div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>ID</th><th style={S.th}>Sector</th>
                    <th style={S.th}>EAD</th><th style={S.th}>Base PD%</th>
                    <th style={S.th}>Climate PD%</th><th style={S.th}>Uplift</th>
                    <th style={S.th}>Stage</th><th style={S.th}>Maturity</th>
                    <th style={S.th}>Base ECL</th><th style={S.th}>Climate ECL</th>
                  </tr></thead>
                  <tbody>
                    {[...ecl].sort((a,b)=>b.eclBook-a.eclBook).slice(0,15).map(l => {
                      const sr_ = IFRS_STAGE_RULES[l.stage-1];
                      return (
                        <tr key={l.id}>
                          <td style={S.td}>{l.id}</td><td style={S.td}>{l.sector}</td>
                          <td style={S.td}>{fmtMn(l.ead)}</td><td style={S.td}>{fmt(l.pd,2)}</td>
                          <td style={S.td}>{fmt(l.climatePd*100,2)}</td>
                          <td style={S.td}>×{fmt(l.uplift,2)}</td>
                          <td style={S.td}><span style={S.pill(sr_.color)}>S{l.stage}</span></td>
                          <td style={S.td}>{fmt(l.maturityYrs,1)}y</td>
                          <td style={S.td}>{fmtMn(l.baseEclBook)}</td>
                          <td style={{...S.td,color:T.red,fontWeight:700}}>{fmtMn(l.eclBook)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
          );
        })()}

        {tab===17 && (() => {
          const total = LOAN_BOOK.reduce((a,l)=>a+l.ead,0);
          const currentAligned = LOAN_BOOK.reduce((a,l)=>a+l.ead*l.alignedPct/100,0);
          const currentGar = total>0 ? currentAligned/total*100 : 0;
          // Target aligned $ = cfTarget% × target total. Solve greedy: exit non-aligned loans ranked by "exit cost" ascending until GAR hits target.
          // Exit cost proxy: LGD × PD × EAD (expected credit loss to unwind) + retention (lower margin). Normalise per $.
          const nonAligned = LOAN_BOOK.filter(l=>l.alignedPct < 5).map(l => ({
            ...l,
            exitCost: (l.ead * (l.pd/100) * (l.lgd/100)) + l.ead * 0.02, // 2% friction
            costPerDollar: (l.pd/100) * (l.lgd/100) + 0.02,
          }));
          const sorted = [...nonAligned].sort((a,b)=>a.costPerDollar - b.costPerDollar);
          // Each $1 exit reduces denominator by $1; aligned $ unchanged → GAR rises.
          let newTotal = total;
          let exited = 0;
          let totalExitCost = 0;
          const exitedList = [];
          for (const l of sorted) {
            const candidateGar = newTotal-l.ead>0 ? currentAligned/(newTotal-l.ead)*100 : 100;
            if (currentGar >= cfTarget) break;
            if (candidateGar >= cfTarget) {
              // Partial exit to just reach target: solve currentAligned/(newTotal - x) = cfTarget/100
              const xFull = newTotal - (currentAligned*100/cfTarget);
              if (xFull>0 && xFull<=l.ead) {
                newTotal -= xFull;
                exited += xFull;
                totalExitCost += l.costPerDollar * xFull;
                exitedList.push({ ...l, exited: +xFull.toFixed(1), partial: true });
                break;
              }
            }
            newTotal -= l.ead;
            exited += l.ead;
            totalExitCost += l.exitCost;
            exitedList.push({ ...l, exited: l.ead, partial: false });
            if (newTotal>0 && currentAligned/newTotal*100 >= cfTarget) break;
          }
          const achievedGar = newTotal>0 ? currentAligned/newTotal*100 : 0;
          const brownExposure = LOAN_BOOK.filter(l=>l.alignedPct<5).reduce((a,l)=>a+l.ead,0);
          const brownCapitalTied = brownExposure * 0.08; // 8% capital requirement
          const strandedAssetRisk = nonAligned.filter(l=>['Energy','Materials'].includes(l.sector)).reduce((a,l)=>a+l.ead,0);
          const pathChart = [
            { step: 'As-Is', gar: +currentGar.toFixed(2), total: +total.toFixed(1), cost: 0 },
            ...exitedList.slice(0,10).map((x,i) => {
              const cum = exitedList.slice(0,i+1).reduce((a,e)=>a+(e.exited||0),0);
              const cumCost = exitedList.slice(0,i+1).reduce((a,e)=>a+(e.partial?e.costPerDollar*e.exited:e.exitCost),0);
              const newT = total - cum;
              return { step: `Exit ${x.id}`, gar: newT>0?+(currentAligned/newT*100).toFixed(2):100, total: +newT.toFixed(1), cost: +cumCost.toFixed(1) };
            }),
          ];
          return (
          <>
            <div style={S.alertBox}>
              <strong>COUNTERFACTUAL GAR SIMULATOR</strong> — solves for minimum-cost path to target Green Asset Ratio via greedy exit: rank non-aligned loans by exit cost/$ (PD×LGD + 2% friction) ascending, exit until target hit. Exposes capital tied up in brown assets &amp; stranded-asset risk concentration.
            </div>
            <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
              <span style={S.label}>Target GAR: {fmtPct(cfTarget)}</span>
              <input type="range" min={10} max={60} step={1} value={cfTarget} onChange={e=>setCfTarget(+e.target.value)} style={{...S.slider,maxWidth:360}}/>
              <span style={{fontSize:11,color:T.textSec,fontFamily:T.mono}}>Current: {fmtPct(currentGar)} · Minimum: 10% · Maximum: 60%</span>
            </div>
            <div style={S.kpiGrid}>
              <Kpi label="CURRENT GAR" value={fmtPct(currentGar)} sub="As-is stock" accent={T.navy}/>
              <Kpi label="TARGET GAR" value={fmtPct(cfTarget)} sub="User-set" accent={T.gold}/>
              <Kpi label="ACHIEVED GAR" value={fmtPct(achievedGar)} sub={achievedGar>=cfTarget?'Target hit':'Infeasible'} accent={achievedGar>=cfTarget?T.green:T.red}/>
              <Kpi label="EXIT $ REQUIRED" value={fmtMn(exited)} sub={`${exitedList.length} loans affected`} accent={T.amber}/>
              <Kpi label="MIN EXIT COST" value={fmtMn(totalExitCost)} sub={`${fmtPct(exited>0?totalExitCost/exited*100:0)} per $`} accent={T.red}/>
              <Kpi label="BROWN EAD" value={fmtMn(brownExposure)} sub={`${fmtMn(brownCapitalTied)} capital tied`} accent={T.amber}/>
              <Kpi label="STRANDED ASSET RISK" value={fmtMn(strandedAssetRisk)} sub="Energy + Materials" accent={T.red}/>
              <Kpi label="COST/$ RATIO" value={fmtPct(exited>0?totalExitCost/exited*100:0)} sub="Efficiency" accent={T.sage}/>
            </div>
            <div style={S.grid2}>
              <div style={S.card}>
                <div style={S.cardH}>Minimum-Cost Exit Path: GAR Trajectory</div>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={pathChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="step" tick={{fontSize:9,fill:T.textSec,fontFamily:T.mono}} angle={-35} textAnchor="end" height={70}/>
                    <YAxis yAxisId="l" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'GAR %',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                    <YAxis yAxisId="r" orientation="right" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'Cost $M',angle:90,position:'insideRight',style:{fontSize:10,fill:T.textSec}}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                    <Line yAxisId="l" type="monotone" dataKey="gar" stroke={T.sage} strokeWidth={2} name="Achieved GAR %" dot={{r:3,fill:T.sage}}/>
                    <Bar yAxisId="r" dataKey="cost" fill={T.gold} name="Cumulative Exit Cost $M" radius={[3,3,0,0]}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>As-Is vs Target Composition</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={[
                    { label: 'Current', aligned: +currentAligned.toFixed(1), other: +(total-currentAligned).toFixed(1) },
                    { label: 'Target', aligned: +currentAligned.toFixed(1), other: +(newTotal-currentAligned).toFixed(1) },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="label" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'EAD $M',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                    <Bar stackId="a" dataKey="aligned" fill={T.sage} name="Aligned" radius={[0,0,0,0]}/>
                    <Bar stackId="a" dataKey="other" fill={T.textMut} name="Non-aligned" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.cardH}>Recommended Exit Schedule (minimum cost)</div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Rank</th><th style={S.th}>ID</th><th style={S.th}>Counterparty</th>
                    <th style={S.th}>Sector</th><th style={S.th}>EAD</th>
                    <th style={S.th}>Exited $</th><th style={S.th}>Type</th>
                    <th style={S.th}>Cost/$</th><th style={S.th}>Exit Cost</th>
                  </tr></thead>
                  <tbody>
                    {exitedList.map((x,i) => (
                      <tr key={x.id}>
                        <td style={S.td}>{i+1}</td><td style={S.td}>{x.id}</td><td style={S.td}>{x.counterparty}</td>
                        <td style={S.td}>{x.sector}</td><td style={S.td}>{fmtMn(x.ead)}</td>
                        <td style={{...S.td,color:T.navy,fontWeight:700}}>{fmtMn(x.exited||0)}</td>
                        <td style={S.td}><span style={S.pill(x.partial?T.gold:T.red)}>{x.partial?'PARTIAL':'FULL'}</span></td>
                        <td style={S.td}>{fmtPct(x.costPerDollar*100)}</td>
                        <td style={{...S.td,color:T.red,fontWeight:700}}>{fmtMn(x.partial?x.costPerDollar*x.exited:x.exitCost)}</td>
                      </tr>
                    ))}
                    {exitedList.length===0 && <tr><td style={{...S.td,textAlign:'center',color:T.textMut}} colSpan={9}>Already at or above target.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
          );
        })()}

        {tab===18 && (() => {
          // ICAAP: combine loan EL (Pillar 2), RWA (Pillar 1), taxonomy alignment (Pillar 3)
          const totalEad = LOAN_BOOK.reduce((a,l)=>a+l.ead,0);
          const baseRWA = LOAN_BOOK.reduce((a,l)=>{
            const kVal = irbK(l.pd/100, l.lgd/100, Math.max(1, Math.min(5, l.maturity/4+1)));
            return a + kVal*12.5*l.ead;
          }, 0);
          const totalEL = LOAN_BOOK.reduce((a,l)=>a+l.ewb,0);
          // Apply icaapStress climate shock factor (0-1.5) to PD
          const stressedRWA = LOAN_BOOK.reduce((a,l)=>{
            const stPd = Math.min(0.99, (l.pd/100) * (1 + icaapStress));
            const kVal = irbK(stPd, (l.lgd/100) + icaapStress*0.05, Math.max(1, Math.min(5, l.maturity/4+1)));
            return a + kVal*12.5*l.ead;
          }, 0);
          const cet1 = 22400; // base $M capital
          const cet1Ratio = baseRWA>0 ? cet1/baseRWA*100 : 0;
          const stressedCET1 = cet1 - (stressedRWA-baseRWA)*0.08 - totalEL*0.5;
          const stressedCET1Ratio = stressedRWA>0 ? stressedCET1/stressedRWA*100 : 0;
          const pillarData = [
            { pillar: 'Pillar 1', base: +(baseRWA*0.08).toFixed(0), stressed: +(stressedRWA*0.08).toFixed(0), desc: 'Credit + Mkt + Op Risk' },
            { pillar: 'Pillar 2', base: +totalEL.toFixed(0), stressed: +(totalEL*(1+icaapStress*0.8)).toFixed(0), desc: 'Climate EL + Concentration' },
            { pillar: 'Pillar 3', base: +(csrdReadyPct*10).toFixed(0), stressed: +(csrdReadyPct*10*0.92).toFixed(0), desc: 'Disclosure Capital Adj.' },
          ];
          // Risk appetite evaluation
          const appetite = RISK_APPETITE_THRESHOLDS.map(r => {
            const higher = r.direction==='higher';
            const breach = higher ? r.current < r.breach : r.current > r.breach;
            const warn = higher ? r.current < r.warn : r.current > r.warn;
            const status = breach ? 'BREACH' : warn ? 'WARN' : 'OK';
            const color = breach ? T.red : warn ? T.amber : T.green;
            return { ...r, status, color };
          });
          const nBreach = appetite.filter(a=>a.status==='BREACH').length;
          const nWarn = appetite.filter(a=>a.status==='WARN').length;
          const nOK = appetite.filter(a=>a.status==='OK').length;
          return (
          <>
            <div style={S.alertBox}>
              <strong>ICAAP PILLAR 1-3 INTEGRATION &amp; RISK APPETITE</strong> — Pillar 1 (regulatory minimum) + Pillar 2 (climate EL, concentration, IRRBB) + Pillar 3 (disclosure capital adjustment). Stressed CET1 ratio computed under climate shock scenario. 10-threshold risk appetite dashboard.
            </div>
            <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
              <span style={S.label}>Climate Stress Factor: +{fmtPct(icaapStress*100)}</span>
              <input type="range" min={0} max={1.5} step={0.05} value={icaapStress} onChange={e=>setIcaapStress(+e.target.value)} style={{...S.slider,maxWidth:320}}/>
              <span style={{fontSize:11,color:T.textSec,fontFamily:T.mono}}>0 = no stress · 0.6 = moderate (NGFS Delayed) · 1.5 = severe (Hot House)</span>
            </div>
            <div style={S.kpiGrid}>
              <Kpi label="CET1 CAPITAL" value={fmtMn(cet1)} sub="Base" accent={T.navy}/>
              <Kpi label="CET1 RATIO (BASE)" value={fmtPct(cet1Ratio)} sub={cet1Ratio>10.5?'In appetite':'Breach'} accent={cet1Ratio>10.5?T.green:T.red}/>
              <Kpi label="STRESSED CET1 $" value={fmtMn(stressedCET1)} sub={`Δ ${fmtMn(stressedCET1-cet1)}`} accent={T.amber}/>
              <Kpi label="STRESSED CET1 RATIO" value={fmtPct(stressedCET1Ratio)} sub={stressedCET1Ratio>10.5?'Pass':'BREACH'} accent={stressedCET1Ratio>10.5?T.sage:T.red}/>
              <Kpi label="APPETITE BREACH" value={`${nBreach}/10`} sub="Critical" accent={nBreach>0?T.red:T.green}/>
              <Kpi label="APPETITE WARN" value={`${nWarn}/10`} sub="Monitor" accent={nWarn>0?T.amber:T.green}/>
              <Kpi label="APPETITE OK" value={`${nOK}/10`} sub="In appetite" accent={T.green}/>
              <Kpi label="PILLAR 2 ADD-ON" value={fmtMn(totalEL)} sub={`+${fmtMn(totalEL*icaapStress*0.8)} stressed`} accent={T.gold}/>
            </div>
            <div style={S.grid2}>
              <div style={S.card}>
                <div style={S.cardH}>Pillar 1/2/3 Capital Build — Base vs Stressed</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={pillarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="pillar" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'$M',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                    <Bar dataKey="base" fill={T.navy} name="Base" radius={[3,3,0,0]}/>
                    <Bar dataKey="stressed" fill={T.red} name="Climate-Stressed" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>Risk Appetite Status — 10 Thresholds</div>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={[
                      { name: 'In Appetite', value: nOK, color: T.green },
                      { name: 'Warning', value: nWarn, color: T.amber },
                      { name: 'Breach', value: nBreach, color: T.red },
                    ]} dataKey="value" nameKey="name" outerRadius={90} label={({name,value})=>`${name}: ${value}`}>
                      <Cell fill={T.green}/><Cell fill={T.amber}/><Cell fill={T.red}/>
                    </Pie>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.cardH}>Risk Appetite Dashboard (10 thresholds)</div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>ID</th><th style={S.th}>Metric</th><th style={S.th}>Pillar</th>
                    <th style={S.th}>Current</th><th style={S.th}>Warn</th><th style={S.th}>Breach</th>
                    <th style={S.th}>Direction</th><th style={S.th}>Status</th>
                  </tr></thead>
                  <tbody>
                    {appetite.map(r => (
                      <tr key={r.id}>
                        <td style={S.td}>{r.id}</td><td style={S.td}>{r.metric}</td><td style={S.td}>{r.pillar}</td>
                        <td style={{...S.td,fontWeight:700}}>{fmt(r.current,1)} {r.unit}</td>
                        <td style={S.td}>{fmt(r.warn,1)}</td>
                        <td style={S.td}>{fmt(r.breach,1)}</td>
                        <td style={S.td}>{r.direction==='higher'?'↑ higher = better':'↓ lower = better'}</td>
                        <td style={S.td}><span style={S.pill(r.color)}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
          );
        })()}

        {tab===19 && (() => {
          const lobs = solvLob==='All' ? INSURANCE_LOB : INSURANCE_LOB.filter(l=>l.id===solvLob);
          // Base SCR = premium × non-life factor + reserves × res factor + catNat factor (heuristic, Standard Formula aligned)
          const solvCalc = lobs.map(l => {
            const f = SOLVENCY_II_FACTORS[l.id] || SOLVENCY_II_FACTORS['P&C-Prop'];
            const scrPrem = l.grossPremium * f.nonLifePrem;
            const scrRes = l.technProv * f.nonLifeRes;
            const scrCatNat = l.grossPremium * f.catNat;
            const scrSpread = l.technProv * f.spread;
            const baseSCR = scrPrem + scrRes + scrCatNat + scrSpread;
            // Climate sub-module (proposed EIOPA): nat-cat uplift 1.4× for High/VH, transition spread add 1.2×
            const catMult = l.naturalCat==='Very High' ? 1.80 : l.naturalCat==='High' ? 1.40 : l.naturalCat==='Medium' ? 1.15 : 1.02;
            const transMult = 1 + (100-l.greenShare)/100 * 0.25; // brown gets hit
            const climateCat = scrCatNat * catMult;
            const climateSpread = scrSpread * transMult;
            const climateSCR = scrPrem + scrRes + climateCat + climateSpread;
            // Solvency ratio: assume Own Funds 2.2× of base SCR as baseline
            const ownFunds = l.scrBase * 2.2;
            const solvRatioBase = l.scrBase>0 ? ownFunds/l.scrBase*100 : 0;
            const solvRatioClimate = climateSCR>0 ? ownFunds/climateSCR*100 : 0;
            return { ...l, baseSCR:+baseSCR.toFixed(0), climateSCR:+climateSCR.toFixed(0), climateCat:+climateCat.toFixed(0), climateSpread:+climateSpread.toFixed(0), scrPrem:+scrPrem.toFixed(0), scrRes:+scrRes.toFixed(0), scrCatNat:+scrCatNat.toFixed(0), scrSpread:+scrSpread.toFixed(0), solvRatioBase:+solvRatioBase.toFixed(0), solvRatioClimate:+solvRatioClimate.toFixed(0), deltaScr:+(climateSCR-baseSCR).toFixed(0), catMult, transMult:+transMult.toFixed(2) };
          });
          const totalBaseScr = solvCalc.reduce((a,l)=>a+l.baseSCR,0);
          const totalClimateScr = solvCalc.reduce((a,l)=>a+l.climateSCR,0);
          const diversificationBenefit = totalBaseScr * 0.18; // typical 15-20% correlation benefit
          const diversClimate = totalClimateScr * 0.15; // lower benefit post-stress
          const netBaseScr = totalBaseScr - diversificationBenefit;
          const netClimateScr = totalClimateScr - diversClimate;
          const ownFundsTotal = solvCalc.reduce((a,l)=>a+l.scrBase*2.2, 0);
          const solvBase = netBaseScr>0 ? ownFundsTotal/netBaseScr*100 : 0;
          const solvClimate = netClimateScr>0 ? ownFundsTotal/netClimateScr*100 : 0;
          const subModule = [
            { mod: 'Premium Risk', base: +solvCalc.reduce((a,l)=>a+l.scrPrem,0).toFixed(0), climate: +solvCalc.reduce((a,l)=>a+l.scrPrem,0).toFixed(0) },
            { mod: 'Reserve Risk', base: +solvCalc.reduce((a,l)=>a+l.scrRes,0).toFixed(0), climate: +solvCalc.reduce((a,l)=>a+l.scrRes,0).toFixed(0) },
            { mod: 'Cat-Nat', base: +solvCalc.reduce((a,l)=>a+l.scrCatNat,0).toFixed(0), climate: +solvCalc.reduce((a,l)=>a+l.climateCat,0).toFixed(0) },
            { mod: 'Credit Spread', base: +solvCalc.reduce((a,l)=>a+l.scrSpread,0).toFixed(0), climate: +solvCalc.reduce((a,l)=>a+l.climateSpread,0).toFixed(0) },
          ];
          return (
          <>
            <div style={S.alertBox}>
              <strong>SOLVENCY II SCR CLIMATE SUB-MODULE</strong> — per-LOB Standard Formula SCR (Premium + Reserve + Cat-Nat + Credit Spread) with proposed EIOPA climate sub-module: nat-cat uplift 1.02×-1.80× by peril class, transition uplift (1 + brown share × 25%). Diversification benefit: 18% base, 15% post-climate.
            </div>
            <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
              <span style={S.label}>LOB Filter:</span>
              <select value={solvLob} onChange={e=>setSolvLob(e.target.value)} style={S.select}>
                <option value="All">All LOBs</option>
                {INSURANCE_LOB.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div style={S.kpiGrid}>
              <Kpi label="BASE SCR (GROSS)" value={fmtMn(totalBaseScr)} sub={`${solvCalc.length} LOBs`} accent={T.navy}/>
              <Kpi label="CLIMATE SCR (GROSS)" value={fmtMn(totalClimateScr)} sub={`+${fmtPct(totalBaseScr>0?(totalClimateScr-totalBaseScr)/totalBaseScr*100:0)}`} accent={T.red}/>
              <Kpi label="DIVERS. BENEFIT (BASE)" value={fmtMn(diversificationBenefit)} sub="−18%" accent={T.sage}/>
              <Kpi label="NET BASE SCR" value={fmtMn(netBaseScr)} sub="Post-diversification" accent={T.gold}/>
              <Kpi label="NET CLIMATE SCR" value={fmtMn(netClimateScr)} sub={`Δ ${fmtMn(netClimateScr-netBaseScr)}`} accent={T.amber}/>
              <Kpi label="SOLV. RATIO (BASE)" value={fmtPct(solvBase)} sub={solvBase>150?'Strong':solvBase>100?'Adequate':'Breach'} accent={solvBase>150?T.green:solvBase>100?T.amber:T.red}/>
              <Kpi label="SOLV. RATIO (CLIMATE)" value={fmtPct(solvClimate)} sub={`Δ ${fmtPct(solvClimate-solvBase)}`} accent={solvClimate>150?T.sage:solvClimate>100?T.amber:T.red}/>
              <Kpi label="OWN FUNDS" value={fmtMn(ownFundsTotal)} sub="Tier 1 + 2" accent={T.navy}/>
            </div>
            <div style={S.grid2}>
              <div style={S.card}>
                <div style={S.cardH}>SCR Sub-Module: Base vs Climate</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={subModule}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="mod" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}}/>
                    <YAxis tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'$M',angle:-90,position:'insideLeft',style:{fontSize:10,fill:T.textSec}}}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Legend wrapperStyle={{fontSize:10,fontFamily:T.mono}}/>
                    <Bar dataKey="base" fill={T.navy} name="Base SCR" radius={[3,3,0,0]}/>
                    <Bar dataKey="climate" fill={T.red} name="Climate-Adj SCR" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <div style={S.cardH}>Per-LOB SCR Delta (Climate − Base)</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={[...solvCalc].sort((a,b)=>b.deltaScr-a.deltaScr)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis type="number" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} label={{value:'Δ $M',position:'insideBottom',offset:-2,style:{fontSize:10,fill:T.textSec}}}/>
                    <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:T.textSec,fontFamily:T.mono}} width={140}/>
                    <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono}}/>
                    <Bar dataKey="deltaScr" fill={T.amber} name="Δ SCR" radius={[0,3,3,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.cardH}>Per-LOB Solvency II SCR Breakdown</div>
              <div style={{overflowX:'auto'}}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>LOB</th><th style={S.th}>Nat-Cat</th>
                    <th style={S.th}>Green %</th><th style={S.th}>Base SCR</th>
                    <th style={S.th}>Cat Mult</th><th style={S.th}>Trans Mult</th>
                    <th style={S.th}>Climate SCR</th><th style={S.th}>Δ SCR</th>
                    <th style={S.th}>Solv. Base</th><th style={S.th}>Solv. Climate</th>
                  </tr></thead>
                  <tbody>
                    {solvCalc.map(l => (
                      <tr key={l.id}>
                        <td style={S.td}>{l.name}</td>
                        <td style={S.td}><span style={S.pill(l.naturalCat==='Very High'?T.red:l.naturalCat==='High'?T.amber:T.green)}>{l.naturalCat}</span></td>
                        <td style={S.td}>{fmtPct(l.greenShare)}</td>
                        <td style={S.td}>{fmtMn(l.baseSCR)}</td>
                        <td style={S.td}>×{fmt(l.catMult,2)}</td>
                        <td style={S.td}>×{fmt(l.transMult,2)}</td>
                        <td style={{...S.td,color:T.red,fontWeight:700}}>{fmtMn(l.climateSCR)}</td>
                        <td style={{...S.td,color:l.deltaScr>0?T.red:T.green,fontWeight:700}}>{(l.deltaScr>=0?'+':'')+fmtMn(l.deltaScr)}</td>
                        <td style={S.td}>{fmtPct(l.solvRatioBase)}</td>
                        <td style={{...S.td,color:l.solvRatioClimate<100?T.red:T.navy,fontWeight:700}}>{fmtPct(l.solvRatioClimate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
          );
        })()}

        <div style={{marginTop:32,paddingTop:18,borderTop:`1px solid ${T.border}`,fontSize:10,color:T.textMut,fontFamily:T.mono,letterSpacing:0.4,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
          <div>MODULE EP-Q9 · FI TAXONOMY × PCAF BRIDGE · BLOOMBERG-TIER REGULATORY ANALYTICS</div>
          <div>DATA · DA 2021/2178 ANNEX V · PCAF Standard, 3rd Ed. (Dec 2025) · ESRS E1 · SOLV II 2009/138/EC</div>
          <div>CLASSIFICATION · INTERNAL · MODEL RISK TIER 1</div>
        </div>

      </div>
    </div>
  );
}
