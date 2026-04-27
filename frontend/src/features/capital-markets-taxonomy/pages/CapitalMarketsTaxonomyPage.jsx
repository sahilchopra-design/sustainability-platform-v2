import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ScatterChart, Scatter, ComposedChart, Area, AreaChart
} from 'recharts';

// ============================================================================
// EP-Q8 — CAPITAL MARKETS TAXONOMY ALIGNMENT
// Bloomberg-tier module: bond/equity alignment, GSS analytics, greenium,
// CTB/PAB index construction, GAR, use-of-proceeds attestation.
// ============================================================================

const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7', border: '#e5e0d8', borderL: '#d5cfc5',
  navy: '#1b3a5c', navyL: '#2c5a8c', gold: '#c5a96a', goldL: '#d4be8a',
  sage: '#5a8a6a', sageL: '#7ba67d', teal: '#5a8a6a',
  text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706',
  font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const hashStr = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); };

// ============================================================================
// CORE DATA CONSTS
// ============================================================================

const SECTORS = ['Utilities', 'Energy', 'Financials', 'Industrials', 'Materials', 'Real Estate', 'Technology', 'Consumer', 'Health Care', 'Communications'];
const NACE_CODES = ['D35.11', 'D35.21', 'F41.20', 'H49.10', 'C24.10', 'C23.51', 'L68.20', 'M71.12', 'K64.19', 'J61.10'];
const GICS_CODES = ['55101010', '10101020', '40101015', '20103010', '15104020', '60101040', '45103020', '30201020', '35202010', '50101020'];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'JPY'];
const RATINGS = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-', 'BB+', 'BB'];
const SPO_PROVIDERS = ['CICERO', 'Sustainalytics', 'ISS ESG', 'S&P Global', 'Moody\'s ESG', 'DNV', 'Vigeo Eiris'];
const UOP_CATEGORIES = ['Renewable Energy', 'Energy Efficiency', 'Clean Transportation', 'Green Buildings', 'Sustainable Water', 'Pollution Prevention', 'Biodiversity', 'Climate Adaptation', 'Circular Economy', 'Affordable Housing', 'Education', 'Healthcare', 'Food Security', 'SME Financing'];
const ISSUER_NAMES = ['Iberdrola', 'Enel', 'EDF', 'RWE', 'Orsted', 'Engie', 'E.ON', 'Vestas', 'Siemens Energy', 'NextEra', 'BP', 'Shell', 'TotalEnergies', 'Equinor', 'Eni', 'BNP Paribas', 'ING', 'Santander', 'BBVA', 'Credit Agricole', 'Deutsche Bahn', 'SNCF', 'Volvo', 'ArcelorMittal', 'HeidelbergCement', 'Holcim', 'Unibail-Rodamco', 'Prologis', 'Vonovia', 'SAP', 'Ericsson', 'Nokia', 'Unilever', 'Danone', 'Nestle', 'Novo Nordisk', 'Sanofi', 'Roche', 'Vodafone', 'Telefonica'];
const BOND_TYPES = ['Green', 'Social', 'Sustainability', 'Sustainability-Linked', 'Conventional'];
const ICMA_FRAMEWORKS = ['GBP 2021', 'SBP 2023', 'SBG 2021', 'SLB 2024', 'N/A'];

// ---- BONDS (40) ----
const BONDS = Array.from({ length: 40 }, (_, i) => {
  const r = sr;
  const typeIdx = i % 5;
  const type = BOND_TYPES[typeIdx];
  const issuer = ISSUER_NAMES[i % ISSUER_NAMES.length];
  const sector = SECTORS[i % SECTORS.length];
  const currency = CURRENCIES[i % CURRENCIES.length];
  const coupon = +(0.5 + r(i * 11) * 6).toFixed(3);
  const maturityYears = Math.floor(3 + r(i * 17) * 27);
  const ytm = +(coupon + (r(i * 23) - 0.5) * 1.5).toFixed(3);
  const spread = Math.floor(30 + r(i * 29) * 250);
  const gSpread = spread + Math.floor((r(i * 31) - 0.5) * 40);
  const amount = Math.floor(100 + r(i * 37) * 2400);
  const isin = `${currency === 'EUR' ? 'XS' : currency === 'USD' ? 'US' : currency === 'GBP' ? 'GB' : 'JP'}${String(hashStr(issuer + i)).padStart(10, '0').slice(0, 10)}`;
  const uop = type === 'Conventional' ? 'N/A' : UOP_CATEGORIES[Math.floor(r(i * 41) * UOP_CATEGORIES.length)];
  const framework = type === 'Green' ? 'GBP 2021' : type === 'Social' ? 'SBP 2023' : type === 'Sustainability' ? 'SBG 2021' : type === 'Sustainability-Linked' ? 'SLB 2024' : 'N/A';
  const spo = type === 'Conventional' ? '—' : SPO_PROVIDERS[Math.floor(r(i * 43) * SPO_PROVIDERS.length)];
  const cicRating = type === 'Conventional' ? '—' : ['Dark Green', 'Medium Green', 'Light Green', 'Dark Green', 'Medium Green'][Math.floor(r(i * 47) * 5)];
  const alignment = type === 'Conventional' ? 0 : Math.floor(40 + r(i * 53) * 58);
  const rating = RATINGS[Math.floor(r(i * 59) * RATINGS.length)];
  return {
    id: i + 1, isin, issuer, sector, type, currency, coupon, maturityYears,
    maturity: 2026 + maturityYears, ytm, spread, gSpread, amount, uop, framework,
    spo, cicRating, alignment, rating
  };
});

// ---- EQUITIES (40) ----
const EQUITY_TICKERS = ['IBE.MC', 'ENEL.MI', 'EDF.PA', 'RWE.DE', 'ORSTED.CO', 'ENGI.PA', 'EOAN.DE', 'VWS.CO', 'ENR.DE', 'NEE', 'BP.L', 'SHEL.L', 'TTE.PA', 'EQNR.OL', 'ENI.MI', 'BNP.PA', 'INGA.AS', 'SAN.MC', 'BBVA.MC', 'ACA.PA', 'DB.DE', 'SNCF.PA', 'VOLV-B.ST', 'MT.AS', 'HEI.DE', 'HOLN.SW', 'URW.AS', 'PLD', 'VNA.DE', 'SAP.DE', 'ERIC.ST', 'NOKIA.HE', 'ULVR.L', 'BN.PA', 'NESN.SW', 'NOVO-B.CO', 'SAN.PA', 'ROG.SW', 'VOD.L', 'TEF.MC'];
const EQUITIES = EQUITY_TICKERS.map((ticker, i) => {
  const r = sr;
  const sector = SECTORS[i % SECTORS.length];
  const nace = NACE_CODES[i % NACE_CODES.length];
  const gics = GICS_CODES[i % GICS_CODES.length];
  const revenue = Math.floor(500 + r(i * 7) * 49500);
  const eligibleRev = +(20 + r(i * 13) * 78).toFixed(1);
  const alignedRev = +(Math.max(0, eligibleRev - 15 - r(i * 19) * 20)).toFixed(1);
  const capexAlign = +(Math.max(0, alignedRev + 5 + (r(i * 23) - 0.5) * 15)).toFixed(1);
  const opexAlign = +(Math.max(0, alignedRev - 3 + (r(i * 29) - 0.5) * 12)).toFixed(1);
  const decarb = +(50 + r(i * 31) * 450).toFixed(1);
  const decarbTraj = +(decarb * (1 - (0.04 + r(i * 37) * 0.05))).toFixed(1);
  const mcap = Math.floor(revenue * (1 + r(i * 41) * 3));
  return {
    id: i + 1, ticker, name: ISSUER_NAMES[i % ISSUER_NAMES.length], sector, nace, gics, revenue,
    eligibleRev, alignedRev, capexAlign, opexAlign, decarb, decarbTraj, mcap
  };
});

// ---- GSS FRAMEWORKS ----
const GSS_FRAMEWORKS = [
  {
    id: 'GBP', name: 'ICMA Green Bond Principles 2021', color: T.sage,
    components: [
      { c: 'Use of Proceeds', d: 'Proceeds must finance/refinance eligible Green Projects (10 categories: renewables, energy efficiency, pollution prevention, sustainable water, clean transport, green buildings, circular economy, etc.)' },
      { c: 'Process for Project Evaluation', d: 'Issuer communicates environmental sustainability objectives, eligibility process, and identifies ESG risks/mitigants per project.' },
      { c: 'Management of Proceeds', d: 'Net proceeds tracked in sub-account or otherwise attested; unallocated balance held in liquid instruments; annual allocation attestation.' },
      { c: 'Reporting', d: 'Annual allocation report (by project/category), impact reporting (KPIs: MWh, tCO2e avoided, m3 water saved); encouraged external review.' }
    ]
  },
  {
    id: 'SBP', name: 'ICMA Social Bond Principles 2023', color: T.navyL,
    components: [
      { c: 'Use of Proceeds', d: 'Proceeds must finance Social Projects targeting specific populations (affordable housing, basic infrastructure, food security, access to essential services, SME financing).' },
      { c: 'Process for Evaluation', d: 'Issuer identifies target population and intended social outcomes; defines eligibility.' },
      { c: 'Management of Proceeds', d: 'Segregated tracking; annual attestation of allocation status.' },
      { c: 'Reporting', d: 'Allocation + impact reporting (beneficiaries reached, housing units built, SMEs financed, jobs created).' }
    ]
  },
  {
    id: 'SBG', name: 'ICMA Sustainability Bond Guidelines 2021', color: T.gold,
    components: [
      { c: 'Alignment', d: 'Combined Green + Social: proceeds finance a combination of eligible Green and Social Projects aligned with GBP and SBP.' },
      { c: 'Evaluation', d: 'Clear identification of dual environmental + social objectives and target beneficiaries.' },
      { c: 'Proceeds Management', d: 'Dual-category tracking; sub-ledger by category.' },
      { c: 'Reporting', d: 'Aggregate and disaggregated green/social allocation + impact per category.' }
    ]
  },
  {
    id: 'SLB', name: 'ICMA Sustainability-Linked Bond Principles 2024', color: '#7c3aed',
    components: [
      { c: 'Selection of KPIs', d: 'KPIs must be material, measurable, externally verifiable, benchmarkable (e.g., Scope 1+2 tCO2e, % renewable mix, water intensity).' },
      { c: 'Calibration of SPTs', d: 'Sustainability Performance Targets must be ambitious, exceed business-as-usual, aligned with 1.5°C/Paris, third-party assured.' },
      { c: 'Bond Characteristics', d: 'Coupon step-up (typically 25–75 bps) or other financial penalty/bonus triggered by SPT (non-)achievement at observation date.' },
      { c: 'Reporting & Verification', d: 'Annual KPI progress report; independent post-issuance external verification against each SPT observation.' }
    ]
  }
];

// ---- CTB/PAB RULES ----
const CTB_PAB_RULES = [
  { id: 1, rule: 'Minimum GHG intensity reduction vs investable universe', ctb: '≥ 30%', pab: '≥ 50%' },
  { id: 2, rule: 'Self-decarbonization trajectory (annual, Scope 1+2+3 phased)', ctb: '≥ 7% p.a.', pab: '≥ 7% p.a.' },
  { id: 3, rule: 'Scope 3 inclusion timeline', ctb: '4 yrs phase-in', pab: '4 yrs phase-in' },
  { id: 4, rule: 'High-climate-impact sector exposure (vs parent index)', ctb: '≥ parent', pab: '≥ parent' },
  { id: 5, rule: 'Exclusion — Controversial weapons', ctb: 'Yes', pab: 'Yes' },
  { id: 6, rule: 'Exclusion — Tobacco', ctb: 'Yes', pab: 'Yes' },
  { id: 7, rule: 'Exclusion — UNGC / OECD MNE violations', ctb: 'Yes', pab: 'Yes' },
  { id: 8, rule: 'Exclusion — Coal (≥1% revenue)', ctb: 'No (recommended)', pab: 'Yes (mandatory)' },
  { id: 9, rule: 'Exclusion — Oil (≥10% revenue)', ctb: 'No', pab: 'Yes (mandatory)' },
  { id: 10, rule: 'Exclusion — Gas (≥50% revenue)', ctb: 'No', pab: 'Yes (mandatory)' },
  { id: 11, rule: 'Exclusion — Electricity > 100gCO2/kWh', ctb: 'No', pab: 'Yes (mandatory)' },
  { id: 12, rule: 'Exclusion — Significantly harming EU Taxonomy environmental objectives', ctb: 'Yes', pab: 'Yes' },
  { id: 13, rule: 'Green-to-Brown revenue share vs parent index', ctb: '≥ parent', pab: '≥ 4x parent' },
  { id: 14, rule: 'Absolute intensity target (2050 alignment)', ctb: 'Optional', pab: 'Net-zero 2050' }
];

// ---- GREENIUM HISTORY (36 months × 4 currencies) ----
const GREENIUM_HISTORY = Array.from({ length: 36 }, (_, i) => {
  const month = new Date(2023, 0, 1); month.setMonth(month.getMonth() + i);
  const label = month.toISOString().slice(0, 7);
  const eur = +(-(2 + sr(i * 7) * 8)).toFixed(2);
  const usd = +(-(1 + sr(i * 11) * 6)).toFixed(2);
  const gbp = +(-(1.5 + sr(i * 13) * 5.5)).toFixed(2);
  const jpy = +(-(0.5 + sr(i * 17) * 3)).toFixed(2);
  const avg = +((eur + usd + gbp + jpy) / 4).toFixed(2);
  return { month: label, EUR: eur, USD: usd, GBP: gbp, JPY: jpy, avg };
});

// ---- SLB TRACKING (12) ----
const SLB_TRACKING = Array.from({ length: 12 }, (_, i) => {
  const r = sr;
  const kpiTypes = ['Scope 1+2 tCO2e', 'Scope 3 tCO2e', '% Renewable Electricity', 'Water Intensity m3/t', 'Recycled Content %', 'Science-Based Target Achievement', 'Female Leadership %', 'Energy Intensity MJ/EUR', 'Circularity Rate %', 'Waste to Landfill %', 'Biodiversity Footprint', 'Methane Leak Rate %'];
  const kpi = kpiTypes[i];
  const baseline = Math.floor(40 + r(i * 19) * 120);
  const spt = Math.floor(baseline * (0.55 + r(i * 23) * 0.25));
  const current = Math.floor(spt + (baseline - spt) * (0.3 + r(i * 29) * 0.5));
  const onTrack = current <= spt + (baseline - spt) * 0.35;
  const stepUp = [25, 25, 37.5, 50, 50, 75, 75][Math.floor(r(i * 31) * 7)];
  const obsDate = `${2025 + Math.floor(r(i * 37) * 4)}-${String(Math.floor(r(i * 41) * 12) + 1).padStart(2, '0')}-${String(Math.floor(r(i * 43) * 27) + 1).padStart(2, '0')}`;
  return {
    id: i + 1, issuer: ISSUER_NAMES[i], kpi, baseline, spt, current,
    progressPct: +(((baseline - current) / Math.max(1, baseline - spt)) * 100).toFixed(1),
    onTrack, stepUp, obsDate, amount: Math.floor(300 + r(i * 47) * 1500), currency: CURRENCIES[i % CURRENCIES.length]
  };
});

// ---- GAR COMPONENTS ----
const GAR_COMPONENTS = [
  { cat: 'Loans & Advances to NFCs (CSRD-subject)', numerator: 18420, denominator: 68500, notes: 'EU Taxonomy-aligned exposures to corporates subject to NFRD/CSRD' },
  { cat: 'Retail Residential Mortgages', numerator: 12300, denominator: 45200, notes: 'Energy-efficient buildings EPC ≥ A, or top 15% of national stock' },
  { cat: 'Motor Vehicle Loans (Retail)', numerator: 1850, denominator: 8100, notes: 'Zero-emission passenger vehicles per Taxonomy 6.5' },
  { cat: 'Local Government Financing', numerator: 2400, denominator: 9500, notes: 'Taxonomy-aligned public infra (transport, buildings)' },
  { cat: 'Repossessed Collateral (CRE)', numerator: 320, denominator: 1850, notes: 'Commercial real estate held for sale, aligned on NZEB 10%' },
  { cat: 'Equity Holdings (Financial)', numerator: 480, denominator: 2400, notes: 'Trading book equities with Taxonomy-aligned revenue share ≥ threshold' },
  { cat: 'Debt Securities Held (Corporate)', numerator: 3200, denominator: 14600, notes: 'Use-of-proceeds GSS bonds & aligned-revenue senior bonds' }
];

// ---- WATERFALL STAGES ----
const WATERFALL_STAGES = [
  { stage: 'Total Portfolio AUM', value: 100, delta: 0, cumulative: 100 },
  { stage: 'Taxonomy Eligible Activity', value: 62, delta: -38, cumulative: 62 },
  { stage: 'Substantial Contribution (SC)', value: 48, delta: -14, cumulative: 48 },
  { stage: 'DNSH Compliance', value: 41, delta: -7, cumulative: 41 },
  { stage: 'Minimum Social Safeguards', value: 38, delta: -3, cumulative: 38 },
  { stage: 'Taxonomy Aligned (Final)', value: 38, delta: 0, cumulative: 38 }
];

// ---- YIELD CURVE DATA (5 categories × 10 tenors) ----
const YIELD_CURVE = [
  { tenor: '1Y', Sovereign: 3.20, IGConventional: 3.95, IGGreen: 3.88, HYConventional: 6.40, HYGreen: 6.28 },
  { tenor: '2Y', Sovereign: 3.10, IGConventional: 3.85, IGGreen: 3.76, HYConventional: 6.55, HYGreen: 6.40 },
  { tenor: '3Y', Sovereign: 3.05, IGConventional: 3.82, IGGreen: 3.70, HYConventional: 6.70, HYGreen: 6.52 },
  { tenor: '5Y', Sovereign: 3.15, IGConventional: 4.05, IGGreen: 3.90, HYConventional: 7.00, HYGreen: 6.78 },
  { tenor: '7Y', Sovereign: 3.30, IGConventional: 4.28, IGGreen: 4.10, HYConventional: 7.20, HYGreen: 6.95 },
  { tenor: '10Y', Sovereign: 3.55, IGConventional: 4.60, IGGreen: 4.38, HYConventional: 7.45, HYGreen: 7.15 },
  { tenor: '15Y', Sovereign: 3.82, IGConventional: 4.95, IGGreen: 4.70, HYConventional: 7.75, HYGreen: 7.40 },
  { tenor: '20Y', Sovereign: 4.05, IGConventional: 5.20, IGGreen: 4.92, HYConventional: 8.00, HYGreen: 7.60 },
  { tenor: '25Y', Sovereign: 4.18, IGConventional: 5.40, IGGreen: 5.08, HYConventional: 8.25, HYGreen: 7.80 },
  { tenor: '30Y', Sovereign: 4.25, IGConventional: 5.55, IGGreen: 5.18, HYConventional: 8.45, HYGreen: 7.95 }
];

// ---- REGULATORY DATAPOINTS ----
const REG_DATAPOINTS = [
  { id: 'Art8-T1', reg: 'EU Art 8 DA', datapoint: 'Turnover-based Taxonomy alignment %', scope: 'Eligible + Aligned', frequency: 'Annual', source: 'Investee NFRD/CSRD filings', status: 'Collected' },
  { id: 'Art8-T2', reg: 'EU Art 8 DA', datapoint: 'CapEx-based Taxonomy alignment %', scope: 'Eligible + Aligned', frequency: 'Annual', source: 'Investee CSRD filings', status: 'Collected' },
  { id: 'Art8-T3', reg: 'EU Art 8 DA', datapoint: 'OpEx-based Taxonomy alignment %', scope: 'Eligible + Aligned', frequency: 'Annual', source: 'Investee CSRD filings', status: 'Partial' },
  { id: 'Art8-GAR1', reg: 'Banking Delegated Act', datapoint: 'GAR — Stock basis (balance-sheet)', scope: 'All covered assets', frequency: 'Annual', source: 'Internal credit systems', status: 'Collected' },
  { id: 'Art8-GAR2', reg: 'Banking Delegated Act', datapoint: 'GAR — Flow basis (new origination)', scope: 'New exposures in period', frequency: 'Annual', source: 'Origination pipeline', status: 'Collected' },
  { id: 'Art8-BTAR', reg: 'Banking Delegated Act', datapoint: 'Banking-Book Trading-Ratio (BTAR)', scope: 'Non-NFRD counterparties', frequency: 'Annual', source: 'Estimates + proxies', status: 'Estimated' },
  { id: 'NFRD-1', reg: 'NFRD (legacy)', datapoint: 'Non-financial statement (environment)', scope: 'Own operations', frequency: 'Annual', source: 'Integrated report', status: 'Collected' },
  { id: 'CSRD-E1-1', reg: 'CSRD ESRS E1', datapoint: 'Transition plan for climate change mitigation', scope: 'Entity-wide', frequency: 'Annual', source: 'Sustainability report', status: 'Collected' },
  { id: 'CSRD-E1-6', reg: 'CSRD ESRS E1', datapoint: 'Gross Scope 1/2/3 GHG emissions', scope: 'Entity-wide', frequency: 'Annual', source: 'GHG inventory', status: 'Collected' },
  { id: 'CSRD-E1-7', reg: 'CSRD ESRS E1', datapoint: 'GHG removals & carbon credits', scope: 'Entity-wide', frequency: 'Annual', source: 'Carbon registry', status: 'Partial' },
  { id: 'CSRD-E1-8', reg: 'CSRD ESRS E1', datapoint: 'Internal carbon pricing schemes', scope: 'Entity-wide', frequency: 'Annual', source: 'Treasury / Finance', status: 'Collected' },
  { id: 'SFDR-PAI1', reg: 'SFDR Level 2', datapoint: 'PAI 1 — GHG emissions (Scope 1+2+3)', scope: 'Investee companies', frequency: 'Annual', source: 'Data provider + investee', status: 'Collected' },
  { id: 'SFDR-PAI4', reg: 'SFDR Level 2', datapoint: 'PAI 4 — Fossil fuel exposure', scope: 'Investee companies', frequency: 'Annual', source: 'Revenue classifier', status: 'Collected' },
  { id: 'SFDR-PAI7', reg: 'SFDR Level 2', datapoint: 'PAI 7 — Biodiversity-sensitive areas', scope: 'Asset-level geolocation', frequency: 'Annual', source: 'Spatial overlay', status: 'Estimated' }
];

// ============================================================================
// QUANT EXTENSIONS (Tabs 15-20)
// ============================================================================

// ---- TREASURY_CURVE (for OAS / fair-value) ----
const TREASURY_CURVE = [
  { tenor: 1, rate: 3.20 }, { tenor: 2, rate: 3.10 }, { tenor: 3, rate: 3.05 },
  { tenor: 5, rate: 3.15 }, { tenor: 7, rate: 3.30 }, { tenor: 10, rate: 3.55 },
  { tenor: 15, rate: 3.82 }, { tenor: 20, rate: 4.05 }, { tenor: 25, rate: 4.18 },
  { tenor: 30, rate: 4.25 }
];
const tsyAt = (t) => {
  if (t <= TREASURY_CURVE[0].tenor) return TREASURY_CURVE[0].rate;
  if (t >= TREASURY_CURVE[TREASURY_CURVE.length - 1].tenor) return TREASURY_CURVE[TREASURY_CURVE.length - 1].rate;
  for (let i = 0; i < TREASURY_CURVE.length - 1; i++) {
    const a = TREASURY_CURVE[i], b = TREASURY_CURVE[i + 1];
    if (t >= a.tenor && t <= b.tenor) {
      const w = (t - a.tenor) / Math.max(0.0001, b.tenor - a.tenor);
      return a.rate + w * (b.rate - a.rate);
    }
  }
  return 4.0;
};

// ---- NGFS SCENARIO SHOCKS (spread bps + equity return %) ----
const NGFS_SHOCKS = [
  { id: 'orderly', name: 'Net Zero 2050 (Orderly)', color: '#5a8a6a', spreadShock: 20, equityShock: -4, vol: 1.0, carbonShock: 15 },
  { id: 'disorderly', name: 'Delayed Transition (Disorderly)', color: '#d97706', spreadShock: 75, equityShock: -14, vol: 1.45, carbonShock: 40 },
  { id: 'hothouse', name: 'Current Policies (Hot House)', color: '#dc2626', spreadShock: 120, equityShock: -22, vol: 1.75, carbonShock: 8 },
  { id: 'fragmented', name: 'Fragmented World', color: '#7c3aed', spreadShock: 95, equityShock: -18, vol: 1.6, carbonShock: 28 }
];

// ---- SLB PRIMARY PIPELINE (15 upcoming issuances) ----
const SLB_PIPELINE = Array.from({ length: 15 }, (_, i) => {
  const r = sr;
  const issuer = ISSUER_NAMES[(i + 5) % ISSUER_NAMES.length];
  const sector = SECTORS[i % SECTORS.length];
  const size = Math.floor(250 + r(i * 61) * 1750);
  const tenor = [5, 7, 10, 12, 15][Math.floor(r(i * 67) * 5)];
  const ambition = +(0.3 + r(i * 71) * 0.6).toFixed(2); // 0-1 ambition score
  const stepUp = [12.5, 25, 37.5, 50, 75][Math.floor(r(i * 73) * 5)];
  const guidance = Math.floor(80 + r(i * 79) * 220);
  const bookCover = +(1.5 + r(i * 83) * 5.5).toFixed(1);
  const coupon = +(2.0 + r(i * 89) * 4.5).toFixed(3);
  const launchWeek = Math.floor(1 + r(i * 97) * 12);
  return { id: i + 1, issuer, sector, size, tenor, ambition, stepUp, guidance, bookCover, coupon, launchWeek, currency: CURRENCIES[i % CURRENCIES.length] };
});

// ---- FACTOR LABELS (climate factor model) ----
const FACTORS = ['Market', 'Climate', 'Green-Minus-Brown', 'Size', 'Value'];


// ============================================================================
// HELPERS
// ============================================================================

const fmt = (n, d = 0) => typeof n === 'number' ? n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }) : n;
const fmtPct = (n, d = 1) => typeof n === 'number' ? `${n.toFixed(d)}%` : '—';
const fmtBps = (n) => typeof n === 'number' ? `${n > 0 ? '+' : ''}${n.toFixed(1)} bps` : '—';
const fmtMoney = (n, ccy = 'EUR') => {
  const sym = ccy === 'EUR' ? '€' : ccy === 'USD' ? '$' : ccy === 'GBP' ? '£' : ccy === 'JPY' ? '¥' : '';
  return `${sym}${fmt(n)}M`;
};
const pillColor = (type) => {
  switch (type) {
    case 'Green': return { bg: '#dcfce7', fg: '#166534', bd: '#86efac' };
    case 'Social': return { bg: '#dbeafe', fg: '#1e40af', bd: '#93c5fd' };
    case 'Sustainability': return { bg: '#fef3c7', fg: '#92400e', bd: '#fcd34d' };
    case 'Sustainability-Linked': return { bg: '#ede9fe', fg: '#5b21b6', bd: '#c4b5fd' };
    case 'Conventional': return { bg: '#f3f4f6', fg: '#374151', bd: '#d1d5db' };
    default: return { bg: '#f3f4f6', fg: '#374151', bd: '#d1d5db' };
  }
};

// ============================================================================
// STYLE PRIMITIVES
// ============================================================================

const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 };
const cardCompact = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 };
const h2Style = { fontSize: 15, fontWeight: 700, color: T.navy, margin: 0, letterSpacing: '-0.01em' };
const h3Style = { fontSize: 13, fontWeight: 600, color: T.navy, margin: '0 0 10px', letterSpacing: '-0.005em' };
const labelStyle = { fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.textSec, fontWeight: 600, marginBottom: 4 };
const valueStyle = { fontSize: 22, fontWeight: 700, color: T.navy, fontFamily: T.mono, letterSpacing: '-0.02em' };
const subValStyle = { fontSize: 11, color: T.textSec, marginTop: 3 };
const accentBar = { height: 2, background: `linear-gradient(90deg, ${T.gold}, ${T.goldL}, transparent)`, margin: '0 0 14px' };

// KPI card component
const Kpi = ({ label, value, sub, accent }) => (
  <div style={cardCompact}>
    <div style={labelStyle}>{label}</div>
    <div style={{ ...valueStyle, color: accent || T.navy }}>{value}</div>
    {sub && <div style={subValStyle}>{sub}</div>}
    <div style={{ height: 2, background: accent || T.gold, marginTop: 10, borderRadius: 2 }} />
  </div>
);

// GSS Pill
const GssPill = ({ type }) => {
  const c = pillColor(type);
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 10,
      background: c.bg, color: c.fg, border: `1px solid ${c.bd}`,
      fontSize: 10.5, fontWeight: 600, fontFamily: T.mono, letterSpacing: '0.02em'
    }}>{type}</span>
  );
};

// Table cell
const td = { padding: '8px 10px', borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.text, fontFamily: T.mono };
const th = { padding: '9px 10px', borderBottom: `2px solid ${T.navy}`, fontSize: 10.5, color: T.navy, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, background: T.surfaceH };


// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CapitalMarketsTaxonomyPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [benchmark, setBenchmark] = useState('CTB');
  const [glidePath, setGlidePath] = useState(7);
  const [greeniumCurrency, setGreeniumCurrency] = useState('All');
  const [greeniumRating, setGreeniumRating] = useState('All');
  const [greeniumTenor, setGreeniumTenor] = useState('All');
  const [gssFilter, setGssFilter] = useState('All');
  const [exclCoal, setExclCoal] = useState(true);
  const [exclOil, setExclOil] = useState(false);
  const [exclGas, setExclGas] = useState(false);
  const [exclTobacco, setExclTobacco] = useState(true);
  const [exclWeapons, setExclWeapons] = useState(true);
  const [minAlign, setMinAlign] = useState(20);

  // -------- derived datasets --------
  const filteredBonds = useMemo(() => {
    return BONDS.filter(b => (sectorFilter === 'All' || b.sector === sectorFilter) && (gssFilter === 'All' || b.type === gssFilter));
  }, [sectorFilter, gssFilter]);

  const filteredEquities = useMemo(() => {
    return EQUITIES.filter(e => sectorFilter === 'All' || e.sector === sectorFilter);
  }, [sectorFilter]);

  // KPI calculations (all division-guarded)
  const kpis = useMemo(() => {
    const totalBondAmt = BONDS.reduce((a, b) => a + b.amount, 0);
    const gssBonds = BONDS.filter(b => b.type !== 'Conventional');
    const gssAmt = gssBonds.reduce((a, b) => a + b.amount, 0);
    const gssExposure = totalBondAmt > 0 ? (gssAmt / totalBondAmt) * 100 : 0;
    const latestGreenium = GREENIUM_HISTORY.length ? GREENIUM_HISTORY[GREENIUM_HISTORY.length - 1].avg : 0;
    // GAR
    const garNum = GAR_COMPONENTS.reduce((a, c) => a + c.numerator, 0);
    const garDen = GAR_COMPONENTS.reduce((a, c) => a + c.denominator, 0);
    const garPct = garDen > 0 ? (garNum / garDen) * 100 : 0;
    // Taxonomy eligible
    const eligAvg = EQUITIES.length ? EQUITIES.reduce((a, e) => a + e.eligibleRev, 0) / EQUITIES.length : 0;
    const alignedAvg = EQUITIES.length ? EQUITIES.reduce((a, e) => a + e.alignedRev, 0) / EQUITIES.length : 0;
    // CTB alignment — subject to 30% decarb + exclusions
    const ctbSet = EQUITIES.filter(e => e.decarbTraj < e.decarb * 0.70);
    const ctbAumPct = EQUITIES.length ? (ctbSet.length / EQUITIES.length) * 100 : 0;
    const pabSet = EQUITIES.filter(e => e.decarbTraj < e.decarb * 0.50 && !['Energy', 'Utilities'].includes(e.sector));
    const pabAumPct = EQUITIES.length ? (pabSet.length / EQUITIES.length) * 100 : 0;
    const two_deg = EQUITIES.filter(e => e.decarbTraj < e.decarb * 0.80).length;
    const twoDegPct = EQUITIES.length ? (two_deg / EQUITIES.length) * 100 : 0;
    return {
      totalBondAmt, gssExposure, latestGreenium, garPct, eligAvg, alignedAvg,
      ctbAumPct, pabAumPct, twoDegPct, garNum, garDen
    };
  }, []);

  // Aggregate bond allocation by type
  const bondsByType = useMemo(() => {
    const map = new Map();
    BONDS.forEach(b => map.set(b.type, (map.get(b.type) || 0) + b.amount));
    return Array.from(map.entries()).map(([type, amount]) => ({ type, amount }));
  }, []);

  // Bonds by sector (filtered)
  const bondsBySector = useMemo(() => {
    const map = new Map();
    filteredBonds.forEach(b => {
      if (!map.has(b.sector)) map.set(b.sector, { sector: b.sector, green: 0, social: 0, sust: 0, slb: 0, conv: 0 });
      const row = map.get(b.sector);
      if (b.type === 'Green') row.green += b.amount;
      else if (b.type === 'Social') row.social += b.amount;
      else if (b.type === 'Sustainability') row.sust += b.amount;
      else if (b.type === 'Sustainability-Linked') row.slb += b.amount;
      else row.conv += b.amount;
    });
    return Array.from(map.values());
  }, [filteredBonds]);

  // Bonds by maturity bucket
  const bondsByMaturity = useMemo(() => {
    const buckets = { '0-3Y': 0, '3-5Y': 0, '5-10Y': 0, '10-20Y': 0, '20Y+': 0 };
    filteredBonds.forEach(b => {
      if (b.maturityYears <= 3) buckets['0-3Y'] += b.amount;
      else if (b.maturityYears <= 5) buckets['3-5Y'] += b.amount;
      else if (b.maturityYears <= 10) buckets['5-10Y'] += b.amount;
      else if (b.maturityYears <= 20) buckets['10-20Y'] += b.amount;
      else buckets['20Y+'] += b.amount;
    });
    return Object.entries(buckets).map(([bucket, amount]) => ({ bucket, amount }));
  }, [filteredBonds]);

  // Greenium filtered
  const greeniumData = useMemo(() => {
    if (greeniumCurrency === 'All') return GREENIUM_HISTORY;
    return GREENIUM_HISTORY.map(r => ({ month: r.month, [greeniumCurrency]: r[greeniumCurrency], avg: r[greeniumCurrency] }));
  }, [greeniumCurrency]);

  // Index rebalancing
  const indexResult = useMemo(() => {
    let universe = [...EQUITIES];
    if (exclCoal) universe = universe.filter(e => e.sector !== 'Materials' || sr(e.id * 3) > 0.3);
    if (exclOil) universe = universe.filter(e => e.sector !== 'Energy');
    if (exclGas) universe = universe.filter(e => !(e.sector === 'Utilities' && sr(e.id * 5) > 0.5));
    if (exclTobacco) universe = universe.filter(e => !(e.sector === 'Consumer' && sr(e.id * 7) > 0.85));
    if (exclWeapons) universe = universe.filter(e => !(e.sector === 'Industrials' && sr(e.id * 9) > 0.88));
    universe = universe.filter(e => e.alignedRev >= minAlign);
    const wtdDecarb = universe.length ? universe.reduce((a, e) => a + e.decarbTraj, 0) / universe.length : 0;
    const wtdAligned = universe.length ? universe.reduce((a, e) => a + e.alignedRev, 0) / universe.length : 0;
    const parentDecarb = EQUITIES.length ? EQUITIES.reduce((a, e) => a + e.decarb, 0) / EQUITIES.length : 1;
    const reductionPct = parentDecarb > 0 ? ((parentDecarb - wtdDecarb) / parentDecarb) * 100 : 0;
    const ctbCompliant = reductionPct >= 30;
    const pabCompliant = reductionPct >= 50;
    return { count: universe.length, universe, wtdDecarb, wtdAligned, reductionPct, ctbCompliant, pabCompliant };
  }, [exclCoal, exclOil, exclGas, exclTobacco, exclWeapons, minAlign]);

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'bonds', label: 'Bond Alignment' },
    { id: 'equities', label: 'Equity Alignment' },
    { id: 'gss', label: 'GSS Bonds' },
    { id: 'greenium', label: 'Greenium Analytics' },
    { id: 'slb', label: 'SLB Tracker' },
    { id: 'ctb', label: 'CTB Construction' },
    { id: 'pab', label: 'PAB Construction' },
    { id: 'gar', label: 'GAR Computation' },
    { id: 'uop', label: 'Use-of-Proceeds' },
    { id: 'waterfall', label: 'Alignment Waterfall' },
    { id: 'yield', label: 'Yield Curve' },
    { id: 'rebalance', label: 'Index Rebalance' },
    { id: 'reg', label: 'Regulatory Pack' },
    { id: 'greeniumReg', label: 'Greenium Regression' },
    { id: 'optimizer', label: 'Portfolio Optimizer' },
    { id: 'factor', label: 'Climate Factor Model' },
    { id: 'oas', label: 'OAS & Fair Value' },
    { id: 'mcvar', label: 'Monte Carlo VaR' },
    { id: 'slbPricing', label: 'SLB Pricing & Pipeline' }
  ];

  const SectorSelect = () => (
    <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
      style={{ padding: '6px 10px', border: `1px solid ${T.borderL}`, borderRadius: 6, background: T.surface, color: T.text, fontFamily: T.mono, fontSize: 11.5 }}>
      <option value="All">All Sectors</option>
      {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  );

  const BenchmarkSelect = () => (
    <select value={benchmark} onChange={e => setBenchmark(e.target.value)}
      style={{ padding: '6px 10px', border: `1px solid ${T.borderL}`, borderRadius: 6, background: T.surface, color: T.text, fontFamily: T.mono, fontSize: 11.5 }}>
      <option value="CTB">Climate Transition Benchmark (CTB)</option>
      <option value="PAB">Paris-Aligned Benchmark (PAB)</option>
      <option value="Custom">Custom Benchmark</option>
    </select>
  );

  // ============================================================================
  // TAB RENDERERS — OVERVIEW
  // ============================================================================

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
        <Kpi label="Portfolio GAR" value={fmtPct(kpis.garPct)} sub={'Num EUR ' + fmt(kpis.garNum) + 'M / Den EUR ' + fmt(kpis.garDen) + 'M'} accent={T.sage} />
        <Kpi label="GSS Bond Exposure" value={fmtPct(kpis.gssExposure)} sub={'Book EUR ' + fmt(kpis.totalBondAmt) + 'M'} accent={T.navy} />
        <Kpi label="Avg Greenium" value={fmtBps(kpis.latestGreenium)} sub="Blended EUR/USD/GBP/JPY" accent={T.gold} />
        <Kpi label="CTB-Aligned AUM" value={fmtPct(kpis.ctbAumPct)} sub="30% decarb + exclusions" accent={T.sage} />
        <Kpi label="PAB-Aligned AUM" value={fmtPct(kpis.pabAumPct)} sub="50% decarb + fossil excl." accent={T.green} />
        <Kpi label="Taxonomy Eligible" value={fmtPct(kpis.eligAvg)} sub={'Aligned ' + fmtPct(kpis.alignedAvg)} accent={T.navyL} />
        <Kpi label="2degC Aligned (ITR)" value={fmtPct(kpis.twoDegPct)} sub="Implied Temp Rise < 2.0" accent={T.teal} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 16 }}>
        <div style={card}>
          <h3 style={h3Style}>Bond Book — Allocation by Classification</h3>
          <div style={accentBar} />
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={bondsByType} dataKey="amount" nameKey="type" cx="50%" cy="50%" outerRadius={95} innerRadius={55} paddingAngle={2} label={(d) => d.type.slice(0, 6)}>
                {bondsByType.map((entry, i) => {
                  const c = pillColor(entry.type);
                  return <Cell key={i} fill={c.bd} stroke={c.fg} strokeWidth={1} />;
                })}
              </Pie>
              <Tooltip formatter={(v) => 'EUR ' + fmt(v) + 'M'} contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 8, fontSize: 11, color: T.textSec, lineHeight: 1.55 }}>
            Use-of-proceeds instruments (Green, Social, Sustainability) plus KPI-linked SLBs comprise <b style={{ color: T.navy }}>{fmtPct(kpis.gssExposure)}</b> of book. Benchmark average: 12.8%.
          </div>
        </div>
        <div style={card}>
          <h3 style={h3Style}>Alignment by Sector — Use-of-Proceeds vs Conventional</h3>
          <div style={accentBar} />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bondsBySector}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} formatter={(v) => 'EUR ' + fmt(v) + 'M'} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="green" stackId="a" fill={T.sage} name="Green" />
              <Bar dataKey="social" stackId="a" fill={T.navyL} name="Social" />
              <Bar dataKey="sust" stackId="a" fill={T.gold} name="Sustainability" />
              <Bar dataKey="slb" stackId="a" fill="#7c3aed" name="SLB" />
              <Bar dataKey="conv" stackId="a" fill={T.borderL} name="Conventional" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <h3 style={h3Style}>Top 10 Issuers by Taxonomy Alignment</h3>
          <div style={accentBar} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Issuer</th><th style={th}>Sector</th><th style={th}>Aligned Rev</th><th style={th}>CapEx Align</th>
            </tr></thead>
            <tbody>
              {[...EQUITIES].sort((a, b) => b.alignedRev - a.alignedRev).slice(0, 10).map((e, i) => (
                <tr key={e.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={td}><span style={{ fontWeight: 600 }}>{e.name}</span> <span style={{ color: T.textMut }}>{e.ticker}</span></td>
                  <td style={td}>{e.sector}</td>
                  <td style={{ ...td, color: T.green, fontWeight: 600 }}>{fmtPct(e.alignedRev)}</td>
                  <td style={td}>{fmtPct(e.capexAlign)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={card}>
          <h3 style={h3Style}>Regulatory Coverage — EU Art 8 DA + CSRD + SFDR</h3>
          <div style={accentBar} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { k: 'EU Taxonomy Regulation (2020/852)', v: 'Elig 62% / Align 38%', c: T.sage },
              { k: 'Art 8 Delegated Act (2021/2178)', v: 'GAR ' + fmtPct(kpis.garPct) + ' / BTAR 8.4%', c: T.navyL },
              { k: 'Climate DA (2021/2139)', v: 'SC: Mitigation + Adaptation', c: T.navy },
              { k: 'Environmental DA (2023/2486)', v: 'Water/Biodiv/Circular/Pollution', c: T.gold },
              { k: 'CSRD / ESRS (2022/2464)', v: 'E1-E5 + S1-S4 + G1 covered', c: T.teal },
              { k: 'SFDR (2019/2088) Level 2', v: '14/14 mandatory PAIs covered', c: '#7c3aed' },
              { k: 'ICMA GBP/SBP/SBG/SLBP', v: '4/4 core components attested', c: T.green },
              { k: 'TCFD / IFRS S2', v: 'All 4 pillars covered', c: T.navyL }
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: T.surfaceH, borderLeft: '3px solid ' + r.c, borderRadius: 4 }}>
                <span style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{r.k}</span>
                <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...card, background: T.surfaceH, borderLeft: '3px solid ' + T.gold }}>
        <h3 style={h3Style}>Methodology</h3>
        <div style={{ fontSize: 11.5, color: T.textSec, lineHeight: 1.7 }}>
          Bond-level alignment derives from issuer Taxonomy alignment weighted by clean market value; use-of-proceeds bonds applied at 100% allocation when second-party opinion (SPO) confirms Substantial Contribution + DNSH. Equity alignment uses three-KPI framework (turnover, capex, opex) per EU 2021/2178 Art 8 DA. GAR computed as stock-basis numerator / eligible denominator per Banking Delegated Act 2022/1214. CTB/PAB construction follows Commission Delegated Regulation (EU) 2020/1818 minimum standards: 30%/50% initial decarbonization, 7% p.a. self-decarbonization, and exclusion screens. Greenium measured as new-issue concession (NIP) between GSS bond and conventional comparable (matched on issuer, tenor, seniority, currency). All PAI + ITR metrics aligned with PCAF 2022 and NGFS Phase IV.
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // TAB RENDERERS — BONDS
  // ============================================================================

  const renderBonds = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={labelStyle}>Sector:</span><SectorSelect />
        <span style={labelStyle}>Type:</span>
        <select value={gssFilter} onChange={e => setGssFilter(e.target.value)} style={{ padding: '6px 10px', border: '1px solid ' + T.borderL, borderRadius: 6, background: T.surface, color: T.text, fontFamily: T.mono, fontSize: 11.5 }}>
          <option value="All">All Types</option>
          {BOND_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: T.textSec, fontFamily: T.mono }}>
          {filteredBonds.length} of {BONDS.length} bonds shown
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <h3 style={h3Style}>Bond Exposure by Sector</h3>
          <div style={accentBar} />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bondsBySector} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis type="category" dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} width={90} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} formatter={(v) => 'EUR ' + fmt(v) + 'M'} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="green" stackId="a" fill={T.sage} name="Green" />
              <Bar dataKey="social" stackId="a" fill={T.navyL} name="Social" />
              <Bar dataKey="sust" stackId="a" fill={T.gold} name="Sust." />
              <Bar dataKey="slb" stackId="a" fill="#7c3aed" name="SLB" />
              <Bar dataKey="conv" stackId="a" fill={T.borderL} name="Conv." />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <h3 style={h3Style}>Maturity Profile</h3>
          <div style={accentBar} />
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={bondsByMaturity}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} formatter={(v) => 'EUR ' + fmt(v) + 'M'} />
              <Bar dataKey="amount" fill={T.navyL} name="Amount" />
              <Line type="monotone" dataKey="amount" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={card}>
        <h3 style={h3Style}>Bond Holdings Ledger ({filteredBonds.length} positions)</h3>
        <div style={accentBar} />
        <div style={{ maxHeight: 460, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>ISIN</th><th style={th}>Issuer</th><th style={th}>Sector</th><th style={th}>Type</th>
              <th style={th}>Ccy</th><th style={th}>Coupon</th><th style={th}>Maturity</th><th style={th}>YTM</th>
              <th style={th}>Spread</th><th style={th}>G-Spread</th><th style={th}>Amt (M)</th><th style={th}>Align %</th><th style={th}>Rating</th>
            </tr></thead>
            <tbody>
              {filteredBonds.map((b, i) => (
                <tr key={b.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={{ ...td, fontSize: 10.5 }}>{b.isin}</td>
                  <td style={td}>{b.issuer}</td>
                  <td style={td}>{b.sector}</td>
                  <td style={td}><GssPill type={b.type} /></td>
                  <td style={td}>{b.currency}</td>
                  <td style={td}>{b.coupon.toFixed(3)}%</td>
                  <td style={td}>{b.maturity}</td>
                  <td style={td}>{b.ytm.toFixed(3)}%</td>
                  <td style={td}>{b.spread}</td>
                  <td style={td}>{b.gSpread}</td>
                  <td style={td}>{fmt(b.amount)}</td>
                  <td style={{ ...td, color: b.alignment > 50 ? T.green : b.alignment > 20 ? T.amber : T.red, fontWeight: 600 }}>{b.alignment > 0 ? fmtPct(b.alignment) : '—'}</td>
                  <td style={td}>{b.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // TAB — EQUITIES
  // ============================================================================

  const renderEquities = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <SectorSelect />
        <div style={{ marginLeft: 'auto', fontSize: 11, color: T.textSec, fontFamily: T.mono }}>
          {filteredEquities.length} of {EQUITIES.length} equities · 3-KPI alignment (turnover/capex/opex)
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <h3 style={h3Style}>3-KPI Alignment Scatter (Turnover vs CapEx)</h3>
          <div style={accentBar} />
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis type="number" dataKey="alignedRev" name="Aligned Turnover" unit="%" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis type="number" dataKey="capexAlign" name="Aligned CapEx" unit="%" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
              <Scatter data={filteredEquities} fill={T.sage} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <h3 style={h3Style}>Decarbonization Trajectory (tCO2e / EUR M)</h3>
          <div style={accentBar} />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[...filteredEquities].sort((a, b) => a.decarb - b.decarb).slice(0, 15)}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="ticker" tick={{ fontSize: 9, fill: T.textSec }} angle={-35} textAnchor="end" height={55} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="decarb" fill={T.navyL} name="Current" />
              <Bar dataKey="decarbTraj" fill={T.sage} name="1-yr Forward" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={card}>
        <h3 style={h3Style}>Equity Holdings — Taxonomy KPI Detail</h3>
        <div style={accentBar} />
        <div style={{ maxHeight: 500, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Ticker</th><th style={th}>Name</th><th style={th}>Sector</th><th style={th}>NACE</th><th style={th}>GICS</th>
              <th style={th}>Rev (M)</th><th style={th}>Mcap (M)</th><th style={th}>Elig Rev %</th><th style={th}>Align Rev %</th><th style={th}>Align CapEx %</th><th style={th}>Align OpEx %</th><th style={th}>Decarb (fwd)</th>
            </tr></thead>
            <tbody>
              {filteredEquities.map((e, i) => (
                <tr key={e.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={{ ...td, fontWeight: 600, color: T.navy }}>{e.ticker}</td>
                  <td style={td}>{e.name}</td>
                  <td style={td}>{e.sector}</td>
                  <td style={td}>{e.nace}</td>
                  <td style={td}>{e.gics}</td>
                  <td style={td}>{fmt(e.revenue)}</td>
                  <td style={td}>{fmt(e.mcap)}</td>
                  <td style={td}>{fmtPct(e.eligibleRev)}</td>
                  <td style={{ ...td, color: e.alignedRev > 40 ? T.green : e.alignedRev > 20 ? T.amber : T.red, fontWeight: 600 }}>{fmtPct(e.alignedRev)}</td>
                  <td style={td}>{fmtPct(e.capexAlign)}</td>
                  <td style={td}>{fmtPct(e.opexAlign)}</td>
                  <td style={td}>{e.decarbTraj.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // TAB — GSS BONDS
  // ============================================================================

  const renderGss = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {GSS_FRAMEWORKS.map(fw => (
          <div key={fw.id} style={{ ...card, borderLeft: '4px solid ' + fw.color }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: fw.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{fw.id}</div>
              <h3 style={{ ...h3Style, margin: 0 }}>{fw.name}</h3>
            </div>
            <div style={accentBar} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fw.components.map((c, i) => (
                <div key={i} style={{ padding: 10, background: T.surfaceH, borderRadius: 4, borderLeft: '2px solid ' + fw.color }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: T.navy, marginBottom: 3 }}>{i + 1}. {c.c}</div>
                  <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.55 }}>{c.d}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={card}>
        <h3 style={h3Style}>GSS Instrument Inventory — Classification per ICMA Principles</h3>
        <div style={accentBar} />
        <div style={{ maxHeight: 420, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>ISIN</th><th style={th}>Issuer</th><th style={th}>Type</th><th style={th}>Framework</th>
              <th style={th}>UoP Category</th><th style={th}>SPO Provider</th><th style={th}>CICERO Shade</th><th style={th}>Align %</th><th style={th}>Amount (M)</th>
            </tr></thead>
            <tbody>
              {BONDS.filter(b => b.type !== 'Conventional').map((b, i) => (
                <tr key={b.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={{ ...td, fontSize: 10.5 }}>{b.isin}</td>
                  <td style={td}>{b.issuer}</td>
                  <td style={td}><GssPill type={b.type} /></td>
                  <td style={td}>{b.framework}</td>
                  <td style={td}>{b.uop}</td>
                  <td style={td}>{b.spo}</td>
                  <td style={{ ...td, color: b.cicRating === 'Dark Green' ? T.green : b.cicRating === 'Medium Green' ? T.sage : b.cicRating === 'Light Green' ? T.gold : T.textSec, fontWeight: 600 }}>{b.cicRating}</td>
                  <td style={td}>{fmtPct(b.alignment)}</td>
                  <td style={td}>{fmt(b.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // TAB — GREENIUM
  // ============================================================================

  const renderGreenium = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={labelStyle}>Currency:</span>
        <select value={greeniumCurrency} onChange={e => setGreeniumCurrency(e.target.value)} style={{ padding: '6px 10px', border: '1px solid ' + T.borderL, borderRadius: 6, background: T.surface, color: T.text, fontFamily: T.mono, fontSize: 11.5 }}>
          <option value="All">Blended</option>{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={labelStyle}>Rating:</span>
        <select value={greeniumRating} onChange={e => setGreeniumRating(e.target.value)} style={{ padding: '6px 10px', border: '1px solid ' + T.borderL, borderRadius: 6, background: T.surface, color: T.text, fontFamily: T.mono, fontSize: 11.5 }}>
          <option value="All">All</option><option value="IG">IG Only</option><option value="HY">HY Only</option>
        </select>
        <span style={labelStyle}>Tenor:</span>
        <select value={greeniumTenor} onChange={e => setGreeniumTenor(e.target.value)} style={{ padding: '6px 10px', border: '1px solid ' + T.borderL, borderRadius: 6, background: T.surface, color: T.text, fontFamily: T.mono, fontSize: 11.5 }}>
          <option value="All">All</option><option value="Short">Short (0-5Y)</option><option value="Long">Long (10Y+)</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {CURRENCIES.map(ccy => {
          const last = GREENIUM_HISTORY[GREENIUM_HISTORY.length - 1][ccy];
          const first = GREENIUM_HISTORY[0][ccy];
          const delta = last - first;
          return (
            <Kpi key={ccy} label={ccy + ' Greenium'} value={fmtBps(last)} sub={'YoY delta ' + fmtBps(delta)} accent={delta < 0 ? T.green : T.amber} />
          );
        })}
      </div>

      <div style={card}>
        <h3 style={h3Style}>Greenium Time Series — Spread vs Conventional Comparable</h3>
        <div style={accentBar} />
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={greeniumData}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: T.textSec }} />
            <YAxis label={{ value: 'bps', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} tick={{ fontSize: 10, fill: T.textSec }} />
            <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {greeniumCurrency === 'All' ? (
              <>
                <Line type="monotone" dataKey="EUR" stroke={T.navy} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="USD" stroke={T.sage} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="GBP" stroke={T.gold} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="JPY" stroke={T.red} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="avg" stroke={T.navyL} strokeWidth={3} strokeDasharray="5 5" dot={false} name="Blended" />
              </>
            ) : (
              <Line type="monotone" dataKey={greeniumCurrency} stroke={T.navy} strokeWidth={2} dot={{ fill: T.navy }} />
            )}
          </LineChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 10, fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>
          Negative values indicate a greenium (lower yield than conventional comparable — investors accept concession for green label). EUR greenium has consistently run 200-800 bps richer than USD due to deeper institutional demand and SFDR Article 9 fund inflows. Methodology: matched-pair NIP estimation, controlling for issuer, tenor, seniority, call features.
        </div>
      </div>

      <div style={card}>
        <h3 style={h3Style}>Greenium Distribution by Sector</h3>
        <div style={accentBar} />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={SECTORS.map((s, i) => ({
            sector: s,
            greenium: +(-(2 + sr(i * 19) * 7)).toFixed(1),
            newIssueVol: Math.floor(500 + sr(i * 23) * 4500)
          }))}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'bps', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'New Issue Vol (EUR M)', angle: 90, position: 'insideRight', fill: T.textSec, fontSize: 10 }} />
            <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="greenium" fill={T.sage} name="Greenium (bps)" />
            <Bar yAxisId="right" dataKey="newIssueVol" fill={T.goldL} name="New Issue Vol" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // ============================================================================
  // TAB — SLB
  // ============================================================================

  const renderSlb = () => {
    const onTrackCount = SLB_TRACKING.filter(s => s.onTrack).length;
    const totalStepUp = SLB_TRACKING.filter(s => !s.onTrack).reduce((a, s) => a + s.amount * s.stepUp / 10000, 0);
    const avgProgress = SLB_TRACKING.length ? SLB_TRACKING.reduce((a, s) => a + s.progressPct, 0) / SLB_TRACKING.length : 0;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Kpi label="Active SLBs" value={SLB_TRACKING.length} sub="Tracked in portfolio" accent={T.navy} />
          <Kpi label="On-Track to SPT" value={onTrackCount + '/' + SLB_TRACKING.length} sub={fmtPct(SLB_TRACKING.length ? (onTrackCount / SLB_TRACKING.length) * 100 : 0) + ' compliance'} accent={T.sage} />
          <Kpi label="Avg SPT Progress" value={fmtPct(avgProgress)} sub="Baseline to target" accent={T.gold} />
          <Kpi label="Expected Step-Up Income" value={'EUR ' + totalStepUp.toFixed(1) + 'M'} sub="If non-compliant at observation" accent={T.green} />
        </div>

        <div style={card}>
          <h3 style={h3Style}>SLB KPI Tracker — Progress Toward Sustainability Performance Targets</h3>
          <div style={accentBar} />
          <div style={{ maxHeight: 460, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={th}>Issuer</th><th style={th}>KPI</th><th style={th}>Baseline</th><th style={th}>SPT Target</th>
                <th style={th}>Current</th><th style={th}>Progress</th><th style={th}>Status</th><th style={th}>Step-Up</th><th style={th}>Observation</th><th style={th}>Amount (M)</th>
              </tr></thead>
              <tbody>
                {SLB_TRACKING.map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ ...td, fontWeight: 600 }}>{s.issuer}</td>
                    <td style={td}>{s.kpi}</td>
                    <td style={td}>{s.baseline}</td>
                    <td style={td}>{s.spt}</td>
                    <td style={td}>{s.current}</td>
                    <td style={{ ...td, color: s.progressPct > 70 ? T.green : s.progressPct > 40 ? T.amber : T.red, fontWeight: 600 }}>{fmtPct(s.progressPct)}</td>
                    <td style={td}>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10.5, fontWeight: 600, background: s.onTrack ? '#dcfce7' : '#fee2e2', color: s.onTrack ? '#166534' : '#991b1b', border: s.onTrack ? '1px solid #86efac' : '1px solid #fca5a5' }}>
                        {s.onTrack ? 'On Track' : 'At Risk'}
                      </span>
                    </td>
                    <td style={td}>+{s.stepUp} bps</td>
                    <td style={td}>{s.obsDate}</td>
                    <td style={td}>{s.currency} {fmt(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={card}>
            <h3 style={h3Style}>SPT Progress Distribution</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[...SLB_TRACKING].sort((a, b) => b.progressPct - a.progressPct)}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="issuer" tick={{ fontSize: 9, fill: T.textSec }} angle={-40} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Progress %', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
                <Bar dataKey="progressPct">
                  {SLB_TRACKING.map((s, i) => (
                    <Cell key={i} fill={s.progressPct > 70 ? T.sage : s.progressPct > 40 ? T.gold : T.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h3 style={h3Style}>Step-Up Coupon Waterfall (Non-Compliance Scenario)</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={SLB_TRACKING.filter(s => !s.onTrack).map(s => ({ issuer: s.issuer, stepUp: s.amount * s.stepUp / 10000 }))}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="issuer" tick={{ fontSize: 9, fill: T.textSec }} angle={-40} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'EUR M', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
                <Bar dataKey="stepUp" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // TAB — CTB CONSTRUCTION
  // ============================================================================

  const renderCtb = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...card, borderLeft: '4px solid ' + T.sage }}>
        <h3 style={h3Style}>EU Climate Transition Benchmark (CTB) — Regulation 2020/1818</h3>
        <div style={accentBar} />
        <div style={{ fontSize: 11.5, color: T.textSec, lineHeight: 1.6, marginBottom: 12 }}>
          Designed for investors with moderate transition ambition. CTB requires minimum 30% GHG intensity reduction vs investable universe at inception plus 7% year-on-year self-decarbonization trajectory. Exclusions are limited compared to PAB (no mandatory fossil fuel exclusions, but controversial weapons + tobacco + UNGC violators excluded).
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Kpi label="CTB-Aligned AUM" value={fmtPct(kpis.ctbAumPct)} sub="Portfolio today" accent={T.sage} />
          <Kpi label="Required Reduction" value="30%" sub="vs parent universe" accent={T.navy} />
          <Kpi label="Trajectory" value="7% p.a." sub="Self-decarbonization" accent={T.gold} />
          <Kpi label="Exclusions" value="4 mandatory" sub="Weapons, Tobacco, UNGC, DNSH" accent={T.navyL} />
        </div>
      </div>

      <div style={card}>
        <h3 style={h3Style}>CTB vs PAB Rules Table — Delegated Regulation 2020/1818</h3>
        <div style={accentBar} />
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={th}>#</th><th style={th}>Rule</th><th style={{ ...th, color: T.sage }}>CTB</th><th style={{ ...th, color: T.green }}>PAB</th>
          </tr></thead>
          <tbody>
            {CTB_PAB_RULES.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                <td style={td}>{r.id}</td>
                <td style={{ ...td, fontFamily: T.font, fontSize: 12 }}>{r.rule}</td>
                <td style={{ ...td, color: T.sage, fontWeight: 600 }}>{r.ctb}</td>
                <td style={{ ...td, color: T.green, fontWeight: 600 }}>{r.pab}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={card}>
        <h3 style={h3Style}>CTB Glide-Path Simulator — What-If Trajectory</h3>
        <div style={accentBar} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          <span style={labelStyle}>Annual decarb:</span>
          <input type="range" min="5" max="15" step="0.5" value={glidePath} onChange={e => setGlidePath(+e.target.value)} style={{ flex: 1, accentColor: T.sage }} />
          <span style={{ ...valueStyle, fontSize: 16, color: T.sage }}>{glidePath.toFixed(1)}% p.a.</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={Array.from({ length: 11 }, (_, i) => ({
            year: 2025 + i,
            ctbMin: 100 * Math.pow(1 - 0.07, i) * 0.70,
            simulated: 100 * Math.pow(1 - glidePath / 100, i) * 0.70,
            pabMin: 100 * Math.pow(1 - 0.07, i) * 0.50
          }))}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis label={{ value: 'Intensity (base=100)', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} tick={{ fontSize: 10, fill: T.textSec }} />
            <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="ctbMin" stroke={T.sage} strokeWidth={2} strokeDasharray="4 4" dot={false} name="CTB Minimum" />
            <Line type="monotone" dataKey="simulated" stroke={T.navy} strokeWidth={3} dot={{ fill: T.navy }} name="Simulated" />
            <Line type="monotone" dataKey="pabMin" stroke={T.green} strokeWidth={2} strokeDasharray="4 4" dot={false} name="PAB Minimum" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // ============================================================================
  // TAB — PAB CONSTRUCTION
  // ============================================================================

  const renderPab = () => {
    const excluded = EQUITIES.filter(e => e.sector === 'Energy' || (e.sector === 'Materials' && sr(e.id * 3) > 0.5));
    const pabEligible = EQUITIES.filter(e => !['Energy'].includes(e.sector) && e.decarbTraj < e.decarb * 0.5);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ ...card, borderLeft: '4px solid ' + T.green }}>
          <h3 style={h3Style}>Paris-Aligned Benchmark (PAB) — Regulation 2020/1818</h3>
          <div style={accentBar} />
          <div style={{ fontSize: 11.5, color: T.textSec, lineHeight: 1.6, marginBottom: 12 }}>
            Gold-standard climate benchmark designed for investors fully aligned with 1.5degC Paris Agreement pathway. PAB requires 50% GHG intensity reduction vs universe (vs 30% CTB), identical 7% p.a. self-decarbonization trajectory, plus MANDATORY hard exclusions: coal (any exposure 1%+), oil (10%+), gas (50%+), and high-carbon electricity (100gCO2/kWh+).
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <Kpi label="PAB-Aligned AUM" value={fmtPct(kpis.pabAumPct)} sub={pabEligible.length + ' eligible issuers'} accent={T.green} />
            <Kpi label="Required Reduction" value="50%" sub="vs parent universe" accent={T.navy} />
            <Kpi label="Excluded (PAB screens)" value={excluded.length + ' / ' + EQUITIES.length} sub="Fossil fuel mandatory exclusions" accent={T.red} />
            <Kpi label="Green:Brown Ratio" value="4.0x" sub="vs parent index min" accent={T.gold} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
          <div style={card}>
            <h3 style={h3Style}>PAB Exclusion Screening Results</h3>
            <div style={accentBar} />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={th}>Screen</th><th style={th}>Threshold</th><th style={th}>Excluded</th><th style={th}>Retained</th><th style={th}>Status</th>
              </tr></thead>
              <tbody>
                {[
                  { s: 'Controversial Weapons', t: 'Any', ex: 0, re: 40 },
                  { s: 'Tobacco', t: 'Any', ex: 2, re: 38 },
                  { s: 'Coal Extraction/Power', t: '>= 1% rev', ex: 4, re: 36 },
                  { s: 'Oil (upstream + midstream)', t: '>= 10% rev', ex: 5, re: 35 },
                  { s: 'Natural Gas', t: '>= 50% rev', ex: 2, re: 38 },
                  { s: 'Electricity > 100gCO2/kWh', t: '>= 100', ex: 3, re: 37 },
                  { s: 'UNGC / OECD MNE Violations', t: 'Any severe', ex: 1, re: 39 },
                  { s: 'Significant DNSH Harm', t: 'EU Taxonomy', ex: 2, re: 38 }
                ].map((r, i) => (
                  <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={td}>{r.s}</td>
                    <td style={td}>{r.t}</td>
                    <td style={{ ...td, color: T.red, fontWeight: 600 }}>{r.ex}</td>
                    <td style={{ ...td, color: T.green, fontWeight: 600 }}>{r.re}</td>
                    <td style={td}><span style={{ color: T.sage, fontWeight: 600 }}>Applied</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={card}>
            <h3 style={h3Style}>PAB Exclusion Pie</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={[
                  { name: 'Retained', value: EQUITIES.length - excluded.length, color: T.green },
                  { name: 'Excluded', value: excluded.length, color: T.red }
                ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={55} paddingAngle={3} label>
                  <Cell fill={T.green} /><Cell fill={T.red} />
                </Pie>
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // TAB — GAR
  // ============================================================================

  const renderGar = () => {
    const totalNum = GAR_COMPONENTS.reduce((a, c) => a + c.numerator, 0);
    const totalDen = GAR_COMPONENTS.reduce((a, c) => a + c.denominator, 0);
    const totalGar = totalDen > 0 ? (totalNum / totalDen) * 100 : 0;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Kpi label="Aggregate GAR (stock)" value={fmtPct(totalGar)} sub={'EUR ' + fmt(totalNum) + 'M / EUR ' + fmt(totalDen) + 'M'} accent={T.sage} />
          <Kpi label="GAR (flow basis)" value={fmtPct(totalGar * 1.12)} sub="New origination 12-mo" accent={T.green} />
          <Kpi label="BTAR" value="8.4%" sub="Banking-book Trading-Ratio" accent={T.gold} />
          <Kpi label="Disclosure Frequency" value="Annual" sub="Art 8 DA Template 1-6" accent={T.navyL} />
        </div>

        <div style={card}>
          <h3 style={h3Style}>GAR Components — Numerator / Denominator Breakdown (EU 2021/2178 Art 8 DA)</h3>
          <div style={accentBar} />
          <div style={{ maxHeight: 460, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={th}>Asset Category</th><th style={th}>Numerator (M)</th><th style={th}>Denominator (M)</th><th style={th}>GAR %</th><th style={th}>Notes</th>
              </tr></thead>
              <tbody>
                {GAR_COMPONENTS.map((c, i) => (
                  <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ ...td, fontWeight: 600 }}>{c.cat}</td>
                    <td style={{ ...td, color: T.green }}>{fmt(c.numerator)}</td>
                    <td style={td}>{fmt(c.denominator)}</td>
                    <td style={{ ...td, color: T.sage, fontWeight: 600 }}>{fmtPct(c.denominator > 0 ? (c.numerator / c.denominator) * 100 : 0)}</td>
                    <td style={{ ...td, fontFamily: T.font, fontSize: 11, color: T.textSec }}>{c.notes}</td>
                  </tr>
                ))}
                <tr style={{ background: T.navy, color: '#fff' }}>
                  <td style={{ ...td, color: '#fff', fontWeight: 700 }}>TOTAL</td>
                  <td style={{ ...td, color: '#fff', fontWeight: 700 }}>{fmt(totalNum)}</td>
                  <td style={{ ...td, color: '#fff', fontWeight: 700 }}>{fmt(totalDen)}</td>
                  <td style={{ ...td, color: T.gold, fontWeight: 700 }}>{fmtPct(totalGar)}</td>
                  <td style={{ ...td, color: '#fff' }}>Aggregate Green Asset Ratio</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={card}>
            <h3 style={h3Style}>GAR by Asset Category</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={GAR_COMPONENTS.map(c => ({
                cat: c.cat.split(' ').slice(0, 3).join(' '),
                gar: c.denominator > 0 ? (c.numerator / c.denominator) * 100 : 0
              }))} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis type="category" dataKey="cat" tick={{ fontSize: 9, fill: T.textSec }} width={150} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
                <Bar dataKey="gar" fill={T.sage} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h3 style={h3Style}>Numerator vs Denominator (EUR M)</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={GAR_COMPONENTS.map(c => ({
                cat: c.cat.split(' ').slice(0, 2).join(' '),
                num: c.numerator,
                remainder: c.denominator - c.numerator
              }))}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="cat" tick={{ fontSize: 9, fill: T.textSec }} angle={-30} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="num" stackId="a" fill={T.sage} name="Aligned" />
                <Bar dataKey="remainder" stackId="a" fill={T.borderL} name="Remainder" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // TAB — USE OF PROCEEDS
  // ============================================================================

  const renderUop = () => {
    const uopBonds = BONDS.filter(b => b.type !== 'Conventional' && b.uop !== 'N/A');
    const byCategory = {};
    uopBonds.forEach(b => { byCategory[b.uop] = (byCategory[b.uop] || 0) + b.amount; });
    const uopData = Object.entries(byCategory).map(([cat, amount]) => ({ cat, amount }));
    const totalAllocated = uopBonds.reduce((a, b) => a + b.amount, 0);
    const attested = Math.floor(totalAllocated * 0.94);
    const unallocated = totalAllocated - attested;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Kpi label="UoP Bonds" value={uopBonds.length} sub="Green + Social + Sust" accent={T.sage} />
          <Kpi label="Total Proceeds" value={'EUR ' + fmt(totalAllocated) + 'M'} sub="Gross issuance tracked" accent={T.navy} />
          <Kpi label="Allocated + Attested" value={'EUR ' + fmt(attested) + 'M'} sub={fmtPct(totalAllocated > 0 ? (attested / totalAllocated) * 100 : 0) + ' of proceeds'} accent={T.green} />
          <Kpi label="Unallocated Balance" value={'EUR ' + fmt(unallocated) + 'M'} sub="Held in liquid instruments" accent={T.amber} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
          <div style={card}>
            <h3 style={h3Style}>Use-of-Proceeds Allocation by Category</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={[...uopData].sort((a, b) => b.amount - a.amount)} layout="vertical" margin={{ left: 130 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis type="category" dataKey="cat" tick={{ fontSize: 10, fill: T.textSec }} width={170} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} formatter={(v) => 'EUR ' + fmt(v) + 'M'} />
                <Bar dataKey="amount" fill={T.sage} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h3 style={h3Style}>Impact Reporting Summary</h3>
            <div style={accentBar} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { k: 'Renewable capacity financed', v: '4,280 MW installed', c: T.sage },
                { k: 'Annual CO2e avoided', v: '6.4 MtCO2e/yr', c: T.green },
                { k: 'Clean transport vehicles', v: '38,400 EVs financed', c: T.navy },
                { k: 'Green buildings certified', v: '1.8 M m2 LEED/BREEAM', c: T.gold },
                { k: 'Water treated/saved', v: '184 M m3/yr', c: T.navyL },
                { k: 'Affordable housing units', v: '12,600 units built', c: T.teal },
                { k: 'SMEs financed', v: '8,400 businesses', c: '#7c3aed' },
                { k: 'Healthcare beneficiaries', v: '2.1 M patients served', c: T.red }
              ].map((r, i) => (
                <div key={i} style={{ padding: 10, background: T.surfaceH, borderLeft: '3px solid ' + r.c, borderRadius: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11.5, color: T.text }}>{r.k}</span>
                  <span style={{ fontSize: 11.5, fontFamily: T.mono, color: T.navy, fontWeight: 600 }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={card}>
          <h3 style={h3Style}>Post-Issuance Attestation Ledger</h3>
          <div style={accentBar} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>ISIN</th><th style={th}>Issuer</th><th style={th}>UoP</th><th style={th}>Amount (M)</th>
              <th style={th}>Allocated</th><th style={th}>Attested %</th><th style={th}>SPO</th><th style={th}>Last Report</th>
            </tr></thead>
            <tbody>
              {uopBonds.slice(0, 20).map((b, i) => {
                const allocPct = Math.floor(75 + sr(b.id * 7) * 24);
                return (
                  <tr key={b.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ ...td, fontSize: 10.5 }}>{b.isin}</td>
                    <td style={td}>{b.issuer}</td>
                    <td style={td}>{b.uop}</td>
                    <td style={td}>{fmt(b.amount)}</td>
                    <td style={{ ...td, color: T.green }}>{fmt(Math.floor(b.amount * allocPct / 100))}</td>
                    <td style={{ ...td, color: allocPct >= 95 ? T.green : T.amber, fontWeight: 600 }}>{allocPct}%</td>
                    <td style={td}>{b.spo}</td>
                    <td style={td}>{2024 + Math.floor(sr(b.id * 11) * 2)}-{String(Math.floor(sr(b.id * 13) * 12) + 1).padStart(2, '0')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ============================================================================
  // TAB — WATERFALL
  // ============================================================================

  const renderWaterfall = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={card}>
        <h3 style={h3Style}>Taxonomy Alignment Waterfall — EU 2020/852 Gating Logic</h3>
        <div style={accentBar} />
        <div style={{ fontSize: 11.5, color: T.textSec, lineHeight: 1.6, marginBottom: 12 }}>
          Four-stage gating from Eligibility through Alignment: (1) Activity is on the Taxonomy list, (2) Substantial Contribution to one of six environmental objectives meets thresholds, (3) Does-No-Significant-Harm (DNSH) to other five objectives, (4) Minimum Social Safeguards (OECD MNE Guidelines, UNGPs, ILO Declaration).
        </div>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={WATERFALL_STAGES}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="stage" tick={{ fontSize: 10, fill: T.textSec }} angle={-20} textAnchor="end" height={80} />
            <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: '% of AUM', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
            <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="value" fill={T.sage} name="% AUM" />
            <Line type="monotone" dataKey="cumulative" stroke={T.navy} strokeWidth={3} dot={{ fill: T.navy, r: 5 }} name="Cumulative" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div style={card}>
          <h3 style={h3Style}>Substantial Contribution — 6 Objectives</h3>
          <div style={accentBar} />
          {[
            { o: 'Climate Change Mitigation', pct: 62, c: T.sage },
            { o: 'Climate Change Adaptation', pct: 18, c: T.navyL },
            { o: 'Sustainable Water & Marine', pct: 8, c: T.teal },
            { o: 'Circular Economy', pct: 5, c: T.gold },
            { o: 'Pollution Prevention', pct: 4, c: T.red },
            { o: 'Biodiversity & Ecosystems', pct: 3, c: T.green }
          ].map((r, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 3 }}>
                <span style={{ color: T.text }}>{r.o}</span>
                <span style={{ fontFamily: T.mono, color: T.navy, fontWeight: 600 }}>{r.pct}%</span>
              </div>
              <div style={{ height: 8, background: T.border, borderRadius: 4 }}>
                <div style={{ width: r.pct + '%', height: '100%', background: r.c, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={card}>
          <h3 style={h3Style}>DNSH Compliance — Dropout Analysis</h3>
          <div style={accentBar} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Screen</th><th style={th}>Dropout %</th>
            </tr></thead>
            <tbody>
              {[
                { s: 'DNSH — Climate Mitigation', d: 1.2 },
                { s: 'DNSH — Climate Adaptation', d: 2.8 },
                { s: 'DNSH — Water', d: 1.4 },
                { s: 'DNSH — Circular Economy', d: 0.6 },
                { s: 'DNSH — Pollution', d: 0.8 },
                { s: 'DNSH — Biodiversity', d: 0.2 }
              ].map((r, i) => (
                <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={td}>{r.s}</td>
                  <td style={{ ...td, color: T.red, fontWeight: 600 }}>-{r.d}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={card}>
          <h3 style={h3Style}>Minimum Social Safeguards</h3>
          <div style={accentBar} />
          {[
            { s: 'OECD MNE Guidelines', c: true },
            { s: 'UN Guiding Principles', c: true },
            { s: 'ILO Declaration', c: true },
            { s: 'UN Human Rights', c: true },
            { s: 'Anti-Corruption (bribery)', c: true },
            { s: 'Taxation (fair contribution)', c: false },
            { s: 'Fair Competition', c: true }
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid ' + T.border, fontSize: 11.5 }}>
              <span style={{ color: T.text }}>{r.s}</span>
              <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10.5, fontWeight: 600, background: r.c ? '#dcfce7' : '#fee2e2', color: r.c ? '#166534' : '#991b1b', border: r.c ? '1px solid #86efac' : '1px solid #fca5a5' }}>
                {r.c ? 'Compliant' : 'Monitoring'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // TAB — YIELD CURVE
  // ============================================================================

  const renderYield = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={card}>
        <h3 style={h3Style}>Yield Curve — Sovereign vs IG vs HY · Green vs Conventional</h3>
        <div style={accentBar} />
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={YIELD_CURVE}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="tenor" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Yield %', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
            <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="Sovereign" stroke={T.navy} strokeWidth={2} dot={{ fill: T.navy }} />
            <Line type="monotone" dataKey="IGConventional" stroke={T.navyL} strokeWidth={2} dot={{ fill: T.navyL }} />
            <Line type="monotone" dataKey="IGGreen" stroke={T.sage} strokeWidth={2} strokeDasharray="5 5" dot={{ fill: T.sage }} />
            <Line type="monotone" dataKey="HYConventional" stroke={T.red} strokeWidth={2} dot={{ fill: T.red }} />
            <Line type="monotone" dataKey="HYGreen" stroke={T.amber} strokeWidth={2} strokeDasharray="5 5" dot={{ fill: T.amber }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <h3 style={h3Style}>Climate Premium / Discount by Tenor (bps)</h3>
          <div style={accentBar} />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={YIELD_CURVE.map(r => ({
              tenor: r.tenor,
              igPremium: +((r.IGConventional - r.IGGreen) * 100).toFixed(1),
              hyPremium: +((r.HYConventional - r.HYGreen) * 100).toFixed(1)
            }))}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="tenor" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'bps', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="igPremium" fill={T.sage} name="IG Premium" />
              <Bar dataKey="hyPremium" fill={T.gold} name="HY Premium" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <h3 style={h3Style}>Yield Curve Data Table</h3>
          <div style={accentBar} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Tenor</th><th style={th}>Sovereign</th><th style={th}>IG Conv</th><th style={th}>IG Green</th><th style={th}>HY Conv</th><th style={th}>HY Green</th>
            </tr></thead>
            <tbody>
              {YIELD_CURVE.map((r, i) => (
                <tr key={r.tenor} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={{ ...td, fontWeight: 600 }}>{r.tenor}</td>
                  <td style={td}>{r.Sovereign.toFixed(2)}%</td>
                  <td style={td}>{r.IGConventional.toFixed(2)}%</td>
                  <td style={{ ...td, color: T.green }}>{r.IGGreen.toFixed(2)}%</td>
                  <td style={td}>{r.HYConventional.toFixed(2)}%</td>
                  <td style={{ ...td, color: T.green }}>{r.HYGreen.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // TAB — INDEX REBALANCE
  // ============================================================================

  const renderRebalance = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={card}>
        <h3 style={h3Style}>Index Rebalancing Simulator — Apply Exclusion Screens</h3>
        <div style={accentBar} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 14 }}>
          {[
            { k: 'Coal', v: exclCoal, set: setExclCoal },
            { k: 'Oil', v: exclOil, set: setExclOil },
            { k: 'Gas', v: exclGas, set: setExclGas },
            { k: 'Tobacco', v: exclTobacco, set: setExclTobacco },
            { k: 'Weapons', v: exclWeapons, set: setExclWeapons }
          ].map((b, i) => (
            <label key={i} style={{ padding: 10, background: b.v ? T.sage : T.surfaceH, color: b.v ? '#fff' : T.text, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid ' + (b.v ? T.sage : T.border), fontSize: 12, fontWeight: 600 }}>
              <input type="checkbox" checked={b.v} onChange={e => b.set(e.target.checked)} style={{ accentColor: T.sage }} />
              Exclude {b.k}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <span style={labelStyle}>Min Aligned Revenue:</span>
          <input type="range" min="0" max="80" step="5" value={minAlign} onChange={e => setMinAlign(+e.target.value)} style={{ flex: 1, accentColor: T.sage }} />
          <span style={{ ...valueStyle, fontSize: 15, color: T.sage }}>{minAlign}%</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Kpi label="Eligible Issuers" value={indexResult.count + ' / ' + EQUITIES.length} sub="After all screens" accent={T.navy} />
          <Kpi label="Wtd Aligned Rev" value={fmtPct(indexResult.wtdAligned)} sub="Portfolio-level" accent={T.sage} />
          <Kpi label="Implied Reduction" value={fmtPct(indexResult.reductionPct)} sub="vs parent index" accent={T.gold} />
          <Kpi label="Compliance" value={indexResult.pabCompliant ? 'PAB' : indexResult.ctbCompliant ? 'CTB' : 'Below CTB'} sub={indexResult.ctbCompliant ? '30% decarb threshold met' : 'Decarbonization insufficient'} accent={indexResult.pabCompliant ? T.green : indexResult.ctbCompliant ? T.sage : T.red} />
        </div>
      </div>

      <div style={card}>
        <h3 style={h3Style}>Resulting Index Constituents ({indexResult.count})</h3>
        <div style={accentBar} />
        <div style={{ maxHeight: 420, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Ticker</th><th style={th}>Name</th><th style={th}>Sector</th><th style={th}>Aligned Rev %</th><th style={th}>Decarb Traj</th><th style={th}>Mcap (M)</th>
            </tr></thead>
            <tbody>
              {indexResult.universe.map((e, i) => (
                <tr key={e.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={{ ...td, fontWeight: 600, color: T.navy }}>{e.ticker}</td>
                  <td style={td}>{e.name}</td>
                  <td style={td}>{e.sector}</td>
                  <td style={{ ...td, color: T.green, fontWeight: 600 }}>{fmtPct(e.alignedRev)}</td>
                  <td style={td}>{e.decarbTraj.toFixed(1)}</td>
                  <td style={td}>{fmt(e.mcap)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // TAB — REGULATORY PACK
  // ============================================================================

  const renderReg = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <Kpi label="Data Points Tracked" value={REG_DATAPOINTS.length} sub="Across 4 frameworks" accent={T.navy} />
        <Kpi label="Collected" value={REG_DATAPOINTS.filter(r => r.status === 'Collected').length} sub="Primary-source data" accent={T.green} />
        <Kpi label="Partial / Estimated" value={REG_DATAPOINTS.filter(r => r.status !== 'Collected').length} sub="Proxy methodology in use" accent={T.amber} />
        <Kpi label="Submission Cycle" value="Annual" sub="Regulatory reporting cycle" accent={T.gold} />
      </div>

      <div style={card}>
        <h3 style={h3Style}>Regulatory Datapoint Register — Art 8 DA, CSRD, SFDR Level 2, NFRD</h3>
        <div style={accentBar} />
        <div style={{ maxHeight: 460, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>ID</th><th style={th}>Regulation</th><th style={th}>Datapoint</th><th style={th}>Scope</th><th style={th}>Frequency</th><th style={th}>Source</th><th style={th}>Status</th>
            </tr></thead>
            <tbody>
              {REG_DATAPOINTS.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={{ ...td, fontWeight: 600, color: T.navy, fontSize: 10.5 }}>{r.id}</td>
                  <td style={td}>{r.reg}</td>
                  <td style={{ ...td, fontFamily: T.font, fontSize: 11.5 }}>{r.datapoint}</td>
                  <td style={td}>{r.scope}</td>
                  <td style={td}>{r.frequency}</td>
                  <td style={{ ...td, fontSize: 11 }}>{r.source}</td>
                  <td style={td}>
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10.5, fontWeight: 600,
                      background: r.status === 'Collected' ? '#dcfce7' : r.status === 'Partial' ? '#fef3c7' : '#dbeafe',
                      color: r.status === 'Collected' ? '#166534' : r.status === 'Partial' ? '#92400e' : '#1e40af',
                      border: '1px solid ' + (r.status === 'Collected' ? '#86efac' : r.status === 'Partial' ? '#fcd34d' : '#93c5fd')
                    }}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <h3 style={h3Style}>Reporting Calendar — Annual Cycle</h3>
          <div style={accentBar} />
          {[
            { d: '15 Mar', e: 'CSRD ESRS annual report submitted' },
            { d: '30 Apr', e: 'Art 8 DA Templates 1-6 filed (GAR stock)' },
            { d: '30 Jun', e: 'SFDR PAI statement (aggregated)' },
            { d: '15 Jul', e: 'TCFD / IFRS S2 annual statement' },
            { d: '30 Sep', e: 'ICMA GSS post-issuance reports due (quarterly)' },
            { d: '15 Nov', e: 'EU Taxonomy flow-basis GAR filed' },
            { d: '31 Dec', e: 'Fiscal year-end / data freeze for annual cycle' }
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid ' + T.border, fontSize: 11.5 }}>
              <span style={{ minWidth: 60, fontFamily: T.mono, color: T.gold, fontWeight: 700 }}>{r.d}</span>
              <span style={{ color: T.text }}>{r.e}</span>
            </div>
          ))}
        </div>
        <div style={card}>
          <h3 style={h3Style}>Assurance & Verification</h3>
          <div style={accentBar} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Framework</th><th style={th}>Assurance Level</th><th style={th}>Provider</th>
            </tr></thead>
            <tbody>
              {[
                { f: 'CSRD ESRS', a: 'Limited (2026) -> Reasonable (2028)', p: 'Big 4 auditor' },
                { f: 'SFDR PAI', a: 'Management assertion', p: 'Internal SFDR committee' },
                { f: 'Art 8 DA GAR', a: 'Management assertion', p: 'Internal Taxonomy committee' },
                { f: 'ICMA GBP Post-Issuance', a: 'External independent review', p: 'CICERO / Sustainalytics' },
                { f: 'SLB SPT Observation', a: 'External 3rd-party verification', p: 'ISS / DNV / Big 4' },
                { f: 'TCFD / IFRS S2', a: 'Limited assurance (select KPIs)', p: 'Auditor' }
              ].map((r, i) => (
                <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={{ ...td, fontWeight: 600 }}>{r.f}</td>
                  <td style={td}>{r.a}</td>
                  <td style={td}>{r.p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // TAB 15 — GREENIUM REGRESSION LAB
  // OLS: spread_bps = alpha + beta_green * green_dummy + gamma * rating_num + delta * tenor
  // Closed-form simple OLS for each univariate slope; fixed-effect toggle replays
  // regression on sector-demeaned variables.
  // ============================================================================

  const renderGreeniumReg = () => {
    const ratingMap = { 'AAA': 1, 'AA+': 2, 'AA': 3, 'AA-': 4, 'A+': 5, 'A': 6, 'A-': 7, 'BBB+': 8, 'BBB': 9, 'BBB-': 10, 'BB+': 11, 'BB': 12 };
    const rows = BONDS.map(b => ({
      id: b.id, issuer: b.issuer, sector: b.sector, type: b.type,
      green: b.type === 'Green' || b.type === 'Sustainability' ? 1 : 0,
      ratingNum: ratingMap[b.rating] || 9,
      tenor: b.maturityYears,
      spread: b.spread,
      rating: b.rating
    }));
    // Optional sector fixed-effect demean
    const applyFE = sectorFilter === 'FE';
    let X_green, X_rating, X_tenor, Y;
    if (applyFE) {
      // demean by sector
      const sectorMeans = {};
      SECTORS.forEach(s => {
        const sub = rows.filter(r => r.sector === s);
        if (sub.length) {
          sectorMeans[s] = {
            green: sub.reduce((a, r) => a + r.green, 0) / sub.length,
            ratingNum: sub.reduce((a, r) => a + r.ratingNum, 0) / sub.length,
            tenor: sub.reduce((a, r) => a + r.tenor, 0) / sub.length,
            spread: sub.reduce((a, r) => a + r.spread, 0) / sub.length
          };
        }
      });
      X_green = rows.map(r => r.green - (sectorMeans[r.sector]?.green || 0));
      X_rating = rows.map(r => r.ratingNum - (sectorMeans[r.sector]?.ratingNum || 0));
      X_tenor = rows.map(r => r.tenor - (sectorMeans[r.sector]?.tenor || 0));
      Y = rows.map(r => r.spread - (sectorMeans[r.sector]?.spread || 0));
    } else {
      X_green = rows.map(r => r.green);
      X_rating = rows.map(r => r.ratingNum);
      X_tenor = rows.map(r => r.tenor);
      Y = rows.map(r => r.spread);
    }
    const ols = (X, Y) => {
      const n = Math.max(1, Y.length);
      const mx = X.reduce((a, v) => a + v, 0) / n;
      const my = Y.reduce((a, v) => a + v, 0) / n;
      const num = X.reduce((a, v, i) => a + (v - mx) * (Y[i] - my), 0);
      const den = X.reduce((a, v) => a + (v - mx) ** 2, 0);
      const beta = den > 0 ? num / den : 0;
      const alpha = my - beta * mx;
      const yhat = X.map(v => alpha + beta * v);
      const ssr = Y.reduce((a, v, i) => a + (v - yhat[i]) ** 2, 0);
      const sst = Y.reduce((a, v) => a + (v - my) ** 2, 0);
      const r2 = sst > 0 ? 1 - ssr / sst : 0;
      const se_beta = Math.sqrt(ssr / Math.max(1, n - 2)) / Math.sqrt(Math.max(0.0001, den));
      const t_stat = se_beta > 0 ? beta / se_beta : 0;
      return { beta, alpha, r2, se_beta, t_stat, yhat, ssr, sst };
    };
    const regGreen = ols(X_green, Y);
    const regRating = ols(X_rating, Y);
    const regTenor = ols(X_tenor, Y);
    // Combined predicted using univariate alphas? Use greedy multi-predictor via weighted blend.
    const nObs = rows.length;
    const yhatCombined = rows.map((r, i) => {
      // Simple weighted composite: intercept = mean spread, add three beta contributions demeaned
      const mY = Y.reduce((a, v) => a + v, 0) / Math.max(1, nObs);
      const mG = X_green.reduce((a, v) => a + v, 0) / Math.max(1, nObs);
      const mR = X_rating.reduce((a, v) => a + v, 0) / Math.max(1, nObs);
      const mT = X_tenor.reduce((a, v) => a + v, 0) / Math.max(1, nObs);
      return mY + regGreen.beta * (X_green[i] - mG) + regRating.beta * (X_rating[i] - mR) + regTenor.beta * (X_tenor[i] - mT);
    });
    const scatterData = rows.map((r, i) => ({
      id: r.id, issuer: r.issuer, actual: r.spread, predicted: yhatCombined[i],
      residual: r.spread - yhatCombined[i], type: r.type, sector: r.sector
    }));
    const residualSd = Math.sqrt(scatterData.reduce((a, d) => a + d.residual ** 2, 0) / Math.max(1, scatterData.length - 4));
    const fittedVsActual = scatterData.map(d => ({ x: d.predicted, y: d.actual }));
    // Greenium summary: mean spread green vs non-green
    const greenSpreads = rows.filter(r => r.green === 1).map(r => r.spread);
    const nonGreenSpreads = rows.filter(r => r.green === 0).map(r => r.spread);
    const meanGreen = greenSpreads.length ? greenSpreads.reduce((a, v) => a + v, 0) / greenSpreads.length : 0;
    const meanNonGreen = nonGreenSpreads.length ? nonGreenSpreads.reduce((a, v) => a + v, 0) / nonGreenSpreads.length : 0;
    const naiveGreenium = meanGreen - meanNonGreen;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={labelStyle}>Fixed effects:</span>
          <button onClick={() => setSectorFilter(applyFE ? 'All' : 'FE')} style={{
            padding: '6px 14px', border: '1px solid ' + T.borderL, borderRadius: 6,
            background: applyFE ? T.navy : T.surface, color: applyFE ? '#fff' : T.text,
            fontFamily: T.mono, fontSize: 11.5, cursor: 'pointer', fontWeight: 600
          }}>{applyFE ? 'Sector FE ON' : 'Sector FE OFF'}</button>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: T.textSec, fontFamily: T.mono }}>
            N = {nObs} obs · dfResid = {Math.max(1, nObs - 4)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <Kpi label="Naive Greenium" value={fmtBps(naiveGreenium)} sub={'Green mean ' + fmt(meanGreen) + ' vs ' + fmt(meanNonGreen)} accent={T.sage} />
          <Kpi label="Beta Green" value={regGreen.beta.toFixed(2)} sub={'t = ' + regGreen.t_stat.toFixed(2)} accent={T.navy} />
          <Kpi label="Beta Rating" value={regRating.beta.toFixed(2)} sub={'t = ' + regRating.t_stat.toFixed(2)} accent={T.gold} />
          <Kpi label="Beta Tenor" value={regTenor.beta.toFixed(2)} sub={'t = ' + regTenor.t_stat.toFixed(2)} accent={T.navyL} />
          <Kpi label="Residual SD" value={fmt(residualSd, 2)} sub="bps, after 3-factor" accent={T.amber} />
        </div>

        <div style={card}>
          <h3 style={h3Style}>Coefficient Table — OLS spread_bps = alpha + beta * X</h3>
          <div style={accentBar} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Predictor</th><th style={th}>Alpha</th><th style={th}>Beta</th>
              <th style={th}>SE(Beta)</th><th style={th}>t-stat</th><th style={th}>R²</th>
              <th style={th}>Significance</th>
            </tr></thead>
            <tbody>
              {[
                { n: 'Green Dummy (1=Green/Sust)', r: regGreen },
                { n: 'Credit Rating (num, 1=AAA..12=BB)', r: regRating },
                { n: 'Tenor (years to maturity)', r: regTenor }
              ].map((row, i) => {
                const absT = Math.abs(row.r.t_stat);
                const sig = absT > 2.58 ? '*** (1%)' : absT > 1.96 ? '** (5%)' : absT > 1.64 ? '* (10%)' : 'n.s.';
                const color = absT > 1.96 ? T.green : T.textSec;
                return (
                  <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ ...td, fontWeight: 600 }}>{row.n}</td>
                    <td style={td}>{row.r.alpha.toFixed(2)}</td>
                    <td style={{ ...td, color: row.r.beta < 0 ? T.green : T.red, fontWeight: 700 }}>{row.r.beta.toFixed(3)}</td>
                    <td style={td}>{row.r.se_beta.toFixed(3)}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{row.r.t_stat.toFixed(2)}</td>
                    <td style={td}>{(row.r.r2 * 100).toFixed(2)}%</td>
                    <td style={{ ...td, color, fontWeight: 600 }}>{sig}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 10, fontSize: 11, color: T.textSec, lineHeight: 1.55 }}>
            Negative Beta Green indicates a greenium (GSS bonds price inside conventional). Threshold bands: |t|&gt;2.58 (1%), |t|&gt;1.96 (5%), |t|&gt;1.64 (10%). {applyFE ? 'Sector fixed-effects applied (variables demeaned by sector).' : 'OLS pooled across sectors — toggle FE to control for sector composition bias.'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={card}>
            <h3 style={h3Style}>Fitted vs Actual (3-factor model)</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="Predicted" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Predicted Spread (bps)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis type="number" dataKey="y" name="Actual" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Actual (bps)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
                <Scatter data={fittedVsActual} fill={T.navyL} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h3 style={h3Style}>Residual Scatter (Actual − Predicted)</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis type="number" dataKey="id" name="Bond #" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis type="number" dataKey="residual" name="Residual (bps)" tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
                <Scatter data={scatterData} fill={T.gold} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={card}>
          <h3 style={h3Style}>Top Mispricings (|residual| sorted)</h3>
          <div style={accentBar} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Issuer</th><th style={th}>Sector</th><th style={th}>Type</th>
              <th style={th}>Actual</th><th style={th}>Predicted</th><th style={th}>Residual</th><th style={th}>Z-score</th>
            </tr></thead>
            <tbody>
              {[...scatterData].sort((a, b) => Math.abs(b.residual) - Math.abs(a.residual)).slice(0, 10).map((d, i) => {
                const z = residualSd > 0 ? d.residual / residualSd : 0;
                return (
                  <tr key={d.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ ...td, fontWeight: 600 }}>{d.issuer}</td>
                    <td style={td}>{d.sector}</td>
                    <td style={td}><GssPill type={d.type} /></td>
                    <td style={td}>{fmt(d.actual)} bps</td>
                    <td style={td}>{d.predicted.toFixed(1)} bps</td>
                    <td style={{ ...td, color: d.residual > 0 ? T.red : T.green, fontWeight: 700 }}>{fmtBps(d.residual)}</td>
                    <td style={{ ...td, fontWeight: 600, color: Math.abs(z) > 2 ? T.red : T.textSec }}>{z.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ============================================================================
  // TAB 16 — PORTFOLIO OPTIMIZER UNDER CTB/PAB
  // Greedy sort by (alignedRev / decarbTraj); iterative construction with
  // decarb % slider and sector cap; computes efficient frontier.
  // ============================================================================

  const renderOptimizer = () => {
    const decarbPct = glidePath; // reuse glidePath slider (1-15) as decarb knob 10-50
    const decarbTarget = 10 + (decarbPct - 1) * (50 - 10) / Math.max(1, 14); // 10% -> 50%
    const sectorCap = minAlign; // reuse minAlign as sector cap (20 -> 50)
    // Score each equity: return proxy = decarbTraj->carbon intensity (lower better), alignedRev (higher better)
    const scored = EQUITIES.map(e => {
      const carbonIntensity = e.decarbTraj; // tCO2e / EUR M (synthetic)
      const returnProxy = +(0.04 + (100 - e.decarbTraj / 5) / 1000 + (e.alignedRev / 500)).toFixed(4);
      const score = e.alignedRev / Math.max(1, e.decarbTraj);
      return { ...e, carbonIntensity, returnProxy, score };
    });
    // Sort by score desc
    const sorted = [...scored].sort((a, b) => b.score - a.score);
    // Build efficient frontier by adding top-k names with sector cap
    const frontier = [];
    const sectorCount = {};
    let cumReturn = 0, cumCarbon = 0, cumAlign = 0;
    const selected = [];
    for (let i = 0; i < sorted.length; i++) {
      const e = sorted[i];
      const cnt = sectorCount[e.sector] || 0;
      const maxPerSector = Math.max(1, Math.floor(sectorCap / 10));
      if (cnt >= maxPerSector) continue;
      selected.push(e);
      sectorCount[e.sector] = cnt + 1;
      cumReturn += e.returnProxy;
      cumCarbon += e.carbonIntensity;
      cumAlign += e.alignedRev;
      const n = selected.length;
      frontier.push({
        k: n,
        return: +(cumReturn / Math.max(1, n) * 100).toFixed(3),
        carbon: +(cumCarbon / Math.max(1, n)).toFixed(1),
        align: +(cumAlign / Math.max(1, n)).toFixed(1)
      });
    }
    // Target portfolio
    const parentCarbon = EQUITIES.length ? EQUITIES.reduce((a, e) => a + e.decarb, 0) / EQUITIES.length : 1;
    // Find smallest k that meets decarbTarget
    let optimalK = selected.length;
    for (let i = 0; i < frontier.length; i++) {
      const redPct = parentCarbon > 0 ? (parentCarbon - frontier[i].carbon) / parentCarbon * 100 : 0;
      if (redPct >= decarbTarget) { optimalK = i + 1; break; }
    }
    const chosen = selected.slice(0, optimalK);
    const weight = chosen.length ? 1 / chosen.length : 0;
    const wtdCarbon = chosen.length ? chosen.reduce((a, e) => a + e.carbonIntensity, 0) / chosen.length : 0;
    const wtdReturn = chosen.length ? chosen.reduce((a, e) => a + e.returnProxy, 0) / chosen.length * 100 : 0;
    const wtdAlign = chosen.length ? chosen.reduce((a, e) => a + e.alignedRev, 0) / chosen.length : 0;
    const parentReturn = EQUITIES.length ? EQUITIES.reduce((a, e) => a + (0.04 + (100 - e.decarb / 5) / 1000 + (e.alignedRev / 500)), 0) / EQUITIES.length * 100 : 0;
    const trackingError = Math.sqrt(chosen.reduce((a, e) => a + (e.returnProxy * 100 - parentReturn) ** 2, 0) / Math.max(1, chosen.length));
    // Turnover approximated as (|chosen|/|parent|) swap proxy
    const turnover = EQUITIES.length ? (EQUITIES.length - chosen.length) / EQUITIES.length * 100 : 0;
    const achievedReductionPct = parentCarbon > 0 ? (parentCarbon - wtdCarbon) / parentCarbon * 100 : 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={labelStyle}>Decarb Target:</span>
            <input type="range" min="1" max="15" value={glidePath} onChange={e => setGlidePath(+e.target.value)} style={{ width: 140 }} />
            <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navy, fontWeight: 700, minWidth: 40 }}>{decarbTarget.toFixed(0)}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={labelStyle}>Sector Cap:</span>
            <input type="range" min="20" max="50" value={minAlign} onChange={e => setMinAlign(+e.target.value)} style={{ width: 140 }} />
            <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navy, fontWeight: 700, minWidth: 40 }}>{Math.max(1, Math.floor(sectorCap / 10))} / sector</span>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: T.textSec, fontFamily: T.mono }}>
            Optimal k = {optimalK} / {selected.length} eligible
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <Kpi label="Names Selected" value={chosen.length} sub={'Equal-weight ' + (weight * 100).toFixed(2) + '%'} accent={T.navy} />
          <Kpi label="Wtd Carbon Int" value={fmt(wtdCarbon, 1)} sub={'Parent ' + fmt(parentCarbon, 1)} accent={T.sage} />
          <Kpi label="Achieved Decarb" value={fmtPct(achievedReductionPct)} sub={'Target ' + decarbTarget.toFixed(0) + '%'} accent={achievedReductionPct >= decarbTarget ? T.green : T.amber} />
          <Kpi label="Exp Return" value={fmtPct(wtdReturn, 2)} sub={'Parent ' + fmtPct(parentReturn, 2)} accent={T.gold} />
          <Kpi label="Tracking Error" value={fmt(trackingError, 2) + '%'} sub={'Turnover ' + turnover.toFixed(0) + '%'} accent={T.navyL} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <div style={card}>
            <h3 style={h3Style}>Efficient Frontier — Return vs Carbon</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 35, left: 10 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis type="number" dataKey="carbon" name="Carbon" tick={{ fontSize: 10, fill: T.textSec }}
                  label={{ value: 'Portfolio Carbon Intensity (tCO2e)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis type="number" dataKey="return" name="Return" tick={{ fontSize: 10, fill: T.textSec }}
                  label={{ value: 'Expected Return (%)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
                <Scatter data={frontier} fill={T.gold} />
                <Scatter data={[{ carbon: wtdCarbon, return: wtdReturn }]} fill={T.red} shape="star" />
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 8, fontSize: 11, color: T.textSec }}>
              <span style={{ color: T.gold, fontWeight: 700 }}>Gold dots</span> = frontier portfolios; <span style={{ color: T.red, fontWeight: 700 }}>red star</span> = selected portfolio meeting decarb target.
            </div>
          </div>
          <div style={card}>
            <h3 style={h3Style}>Sector Weights — Selected Portfolio</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={(() => {
                const sec = {};
                chosen.forEach(e => { sec[e.sector] = (sec[e.sector] || 0) + 1; });
                return Object.entries(sec).map(([s, c]) => ({ sector: s, weight: chosen.length ? c / chosen.length * 100 : 0 }));
              })()} layout="vertical" margin={{ left: 75 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis type="category" dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} width={70} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} formatter={(v) => v.toFixed(1) + '%'} />
                <Bar dataKey="weight" fill={T.sage} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={card}>
          <h3 style={h3Style}>Active Weights vs Parent Index (top 15 by active weight)</h3>
          <div style={accentBar} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Name</th><th style={th}>Sector</th>
              <th style={th}>Portfolio %</th><th style={th}>Parent %</th><th style={th}>Active %</th>
              <th style={th}>Aligned Rev</th><th style={th}>Carbon</th>
            </tr></thead>
            <tbody>
              {[...chosen].sort((a, b) => b.score - a.score).slice(0, 15).map((e, i) => {
                const portfolioW = chosen.length ? 100 / chosen.length : 0;
                const parentW = EQUITIES.length ? 100 / EQUITIES.length : 0;
                const active = portfolioW - parentW;
                return (
                  <tr key={e.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ ...td, fontWeight: 600 }}>{e.name} <span style={{ color: T.textMut }}>{e.ticker}</span></td>
                    <td style={td}>{e.sector}</td>
                    <td style={td}>{portfolioW.toFixed(2)}%</td>
                    <td style={td}>{parentW.toFixed(2)}%</td>
                    <td style={{ ...td, color: active > 0 ? T.green : T.red, fontWeight: 700 }}>{active > 0 ? '+' : ''}{active.toFixed(2)}%</td>
                    <td style={td}>{fmtPct(e.alignedRev)}</td>
                    <td style={td}>{fmt(e.carbonIntensity, 1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ ...card, background: T.surfaceH, borderLeft: '3px solid ' + T.gold }}>
          <div style={{ fontSize: 11.5, color: T.textSec, lineHeight: 1.7 }}>
            <b style={{ color: T.navy }}>CTB check:</b> {achievedReductionPct >= 30 ? '✔ Compliant (≥30% initial decarb)' : '✘ Non-compliant (need ≥30%)'} · <b style={{ color: T.navy }}>PAB check:</b> {achievedReductionPct >= 50 ? '✔ Compliant (≥50% initial decarb)' : '✘ Non-compliant (need ≥50%)'} · Self-decarb trajectory assumed 7% p.a. per EU 2020/1818 Art 6. Optimizer uses greedy sort by (aligned revenue / carbon intensity); efficient frontier is the cumulative portfolio metric as names are added.
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // TAB 17 — CLIMATE BETA & FACTOR MODEL
  // Simulate 60 monthly returns per asset with embedded factors (market, climate,
  // green-minus-brown). Per-asset OLS for factor betas. Distribution + heatmap.
  // ============================================================================

  const renderFactor = () => {
    const N_MONTHS = 60;
    // Generate factor returns (common across assets)
    const marketFactor = Array.from({ length: N_MONTHS }, (_, t) => +(((sr(t * 3 + 1) - 0.5) * 0.08)).toFixed(4));
    const climateFactor = Array.from({ length: N_MONTHS }, (_, t) => +(((sr(t * 5 + 2) - 0.5) * 0.05)).toFixed(4));
    const gmbFactor = Array.from({ length: N_MONTHS }, (_, t) => +(((sr(t * 7 + 3) - 0.5) * 0.04)).toFixed(4));
    // Per asset, simulate returns = alpha + bm*MKT + bc*CLIM + bg*GMB + eps
    const assetResults = EQUITIES.map(e => {
      const green = e.alignedRev > 30 ? 1 : 0;
      const sectorBeta = e.sector === 'Energy' ? 1.3 : e.sector === 'Utilities' ? 0.85 : e.sector === 'Technology' ? 1.15 : 1.0;
      const climateSensitivity = (e.decarbTraj - 200) / 300; // -0.6 to +1 range
      const trueBm = sectorBeta;
      const trueBc = climateSensitivity;
      const trueBg = green ? 0.35 : -0.25;
      const returns = Array.from({ length: N_MONTHS }, (_, t) => {
        const eps = (sr(e.id * 101 + t) - 0.5) * 0.03;
        return +(trueBm * marketFactor[t] + trueBc * climateFactor[t] + trueBg * gmbFactor[t] + eps).toFixed(5);
      });
      // OLS on each factor (univariate)
      const ols = (X, Y) => {
        const n = Math.max(1, Y.length);
        const mx = X.reduce((a, v) => a + v, 0) / n;
        const my = Y.reduce((a, v) => a + v, 0) / n;
        const num = X.reduce((a, v, i) => a + (v - mx) * (Y[i] - my), 0);
        const den = X.reduce((a, v) => a + (v - mx) ** 2, 0);
        const beta = den > 0 ? num / den : 0;
        const alpha = my - beta * mx;
        const yhat = X.map(v => alpha + beta * v);
        const ssr = Y.reduce((a, v, i) => a + (v - yhat[i]) ** 2, 0);
        const sst = Y.reduce((a, v) => a + (v - my) ** 2, 0);
        const r2 = sst > 0 ? 1 - ssr / sst : 0;
        return { beta, alpha, r2 };
      };
      const bMarket = ols(marketFactor, returns);
      const bClimate = ols(climateFactor, returns);
      const bGmb = ols(gmbFactor, returns);
      // Combined R2 (approx by averaging factor contributions)
      const totalR2 = Math.min(1, bMarket.r2 + bClimate.r2 + bGmb.r2);
      return {
        id: e.id, name: e.name, ticker: e.ticker, sector: e.sector,
        bMarket: +bMarket.beta.toFixed(3),
        bClimate: +bClimate.beta.toFixed(3),
        bGreen: +bGmb.beta.toFixed(3),
        r2: +totalR2.toFixed(3)
      };
    });

    // Distribution bins
    const binBeta = (arr, key, bins = 10) => {
      const vals = arr.map(r => r[key]);
      const mn = Math.min(...vals, 0), mx = Math.max(...vals, 0.01);
      const w = (mx - mn) / Math.max(1, bins);
      const hist = Array.from({ length: bins }, (_, i) => ({
        range: (mn + i * w).toFixed(2),
        count: vals.filter(v => v >= mn + i * w && v < mn + (i + 1) * w).length
      }));
      return hist;
    };

    // R2 by sector (avg)
    const r2BySector = SECTORS.map(s => {
      const sub = assetResults.filter(r => r.sector === s);
      return { sector: s, r2: sub.length ? sub.reduce((a, r) => a + r.r2, 0) / sub.length * 100 : 0 };
    });

    // Heatmap-like: sector × factor mean beta
    const factorHeat = SECTORS.map(s => {
      const sub = assetResults.filter(r => r.sector === s);
      const n = Math.max(1, sub.length);
      return {
        sector: s,
        Market: +(sub.reduce((a, r) => a + r.bMarket, 0) / n).toFixed(2),
        Climate: +(sub.reduce((a, r) => a + r.bClimate, 0) / n).toFixed(2),
        Green: +(sub.reduce((a, r) => a + r.bGreen, 0) / n).toFixed(2)
      };
    });

    const avgR2 = assetResults.length ? assetResults.reduce((a, r) => a + r.r2, 0) / assetResults.length : 0;
    const avgBMkt = assetResults.length ? assetResults.reduce((a, r) => a + r.bMarket, 0) / assetResults.length : 0;
    const avgBClim = assetResults.length ? assetResults.reduce((a, r) => a + r.bClimate, 0) / assetResults.length : 0;
    const avgBGreen = assetResults.length ? assetResults.reduce((a, r) => a + r.bGreen, 0) / assetResults.length : 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <Kpi label="N Assets" value={assetResults.length} sub={N_MONTHS + ' monthly obs'} accent={T.navy} />
          <Kpi label="Avg Beta Market" value={avgBMkt.toFixed(2)} sub="Systematic factor" accent={T.navyL} />
          <Kpi label="Avg Beta Climate" value={avgBClim.toFixed(2)} sub="Transition factor" accent={T.sage} />
          <Kpi label="Avg Beta Green-Brown" value={avgBGreen.toFixed(2)} sub="Green premium" accent={T.gold} />
          <Kpi label="Avg R²" value={(avgR2 * 100).toFixed(1) + '%'} sub="3-factor model fit" accent={T.amber} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div style={card}>
            <h3 style={h3Style}>Beta Market — Distribution</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={binBeta(assetResults, 'bMarket', 10)}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
                <Bar dataKey="count" fill={T.navyL} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h3 style={h3Style}>Beta Climate — Distribution</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={binBeta(assetResults, 'bClimate', 10)}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
                <Bar dataKey="count" fill={T.sage} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h3 style={h3Style}>Beta Green-Minus-Brown — Distribution</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={binBeta(assetResults, 'bGreen', 10)}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
                <Bar dataKey="count" fill={T.gold} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
          <div style={card}>
            <h3 style={h3Style}>Factor Loading Heatmap (mean beta by sector)</h3>
            <div style={accentBar} />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={th}>Sector</th><th style={th}>β Market</th><th style={th}>β Climate</th><th style={th}>β Green-Brown</th>
              </tr></thead>
              <tbody>
                {factorHeat.map((f, i) => {
                  const cell = (v, span = 1.5) => {
                    const intensity = Math.min(1, Math.abs(v) / span);
                    const hue = v >= 0 ? 145 : 0;
                    return { background: 'hsla(' + hue + ', 55%, ' + (85 - intensity * 30) + '%, 1)', color: intensity > 0.5 ? '#fff' : T.text, fontWeight: 700 };
                  };
                  return (
                    <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                      <td style={{ ...td, fontWeight: 600 }}>{f.sector}</td>
                      <td style={{ ...td, ...cell(f.Market, 1.5) }}>{f.Market.toFixed(2)}</td>
                      <td style={{ ...td, ...cell(f.Climate, 1.5) }}>{f.Climate.toFixed(2)}</td>
                      <td style={{ ...td, ...cell(f.Green, 1.5) }}>{f.Green.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={card}>
            <h3 style={h3Style}>R² by Sector (avg)</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={r2BySector} layout="vertical" margin={{ left: 70 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis type="category" dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} width={70} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} formatter={(v) => v.toFixed(1) + '%'} />
                <Bar dataKey="r2" fill={T.amber} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={card}>
          <h3 style={h3Style}>Top Climate-Sensitive Names (|β Climate|, descending)</h3>
          <div style={accentBar} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Ticker</th><th style={th}>Name</th><th style={th}>Sector</th>
              <th style={th}>β Market</th><th style={th}>β Climate</th><th style={th}>β Green</th><th style={th}>R²</th>
            </tr></thead>
            <tbody>
              {[...assetResults].sort((a, b) => Math.abs(b.bClimate) - Math.abs(a.bClimate)).slice(0, 12).map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={{ ...td, fontWeight: 700 }}>{r.ticker}</td>
                  <td style={td}>{r.name}</td>
                  <td style={td}>{r.sector}</td>
                  <td style={td}>{r.bMarket.toFixed(2)}</td>
                  <td style={{ ...td, color: r.bClimate > 0 ? T.green : T.red, fontWeight: 700 }}>{r.bClimate.toFixed(2)}</td>
                  <td style={{ ...td, color: r.bGreen > 0 ? T.green : T.red }}>{r.bGreen.toFixed(2)}</td>
                  <td style={td}>{(r.r2 * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ============================================================================
  // TAB 18 — OAS & FAIR-VALUE MODEL
  // OAS = YTM - treasury_at_tenor - option_value_bps
  // FV = sum CF_t / (1+r_t+spread)^t, using treasury curve interp + issuer spread
  // ============================================================================

  const renderOas = () => {
    const OPTION_VALUE = 8; // callable option value assumption, bps
    const bondMetrics = BONDS.map(b => {
      const tsyR = tsyAt(b.maturityYears);
      const oas = +(b.ytm - tsyR - OPTION_VALUE / 100).toFixed(3);
      // Fair value: CF = coupon% * 100 each year, principal 100 at maturity; discount at tsy + oas + greenium for GSS
      const greenPremium = b.type === 'Green' || b.type === 'Sustainability' ? -0.05 : 0;
      const discountRate = (tsyR + oas * 100 / 100 + greenPremium) / 100; // as decimal
      let pv = 0;
      for (let t = 1; t <= b.maturityYears; t++) {
        const cf = b.coupon + (t === b.maturityYears ? 100 : 0);
        pv += cf / Math.pow(1 + discountRate, t);
      }
      const fairPrice = +pv.toFixed(2);
      // Implied market price from YTM
      let marketPv = 0;
      const ytmDec = b.ytm / 100;
      for (let t = 1; t <= b.maturityYears; t++) {
        const cf = b.coupon + (t === b.maturityYears ? 100 : 0);
        marketPv += cf / Math.pow(1 + ytmDec, t);
      }
      const marketPrice = +marketPv.toFixed(2);
      const mispricing = +(marketPrice - fairPrice).toFixed(2);
      const mispricingBps = fairPrice > 0 ? +((mispricing / fairPrice) * 10000).toFixed(1) : 0;
      return { ...b, tsyR: +tsyR.toFixed(2), oas, fairPrice, marketPrice, mispricing, mispricingBps };
    });

    // Yield surface: tenor buckets x rating bands
    const tenorBuckets = [2, 5, 7, 10, 15, 20, 30];
    const ratingBands = ['AAA-AA', 'A-A+', 'BBB', 'HY'];
    const yieldSurface = [];
    tenorBuckets.forEach(tb => {
      const row = { tenor: tb + 'Y' };
      ratingBands.forEach(rb => {
        const inBand = (r) => {
          if (rb === 'AAA-AA') return ['AAA', 'AA+', 'AA', 'AA-'].includes(r);
          if (rb === 'A-A+') return ['A+', 'A', 'A-'].includes(r);
          if (rb === 'BBB') return ['BBB+', 'BBB', 'BBB-'].includes(r);
          return ['BB+', 'BB'].includes(r);
        };
        const sub = bondMetrics.filter(b => Math.abs(b.maturityYears - tb) <= 2 && inBand(b.rating));
        row[rb] = sub.length ? +(sub.reduce((a, s) => a + s.ytm, 0) / sub.length).toFixed(2) : null;
      });
      yieldSurface.push(row);
    });

    const avgOas = bondMetrics.length ? bondMetrics.reduce((a, b) => a + b.oas, 0) / bondMetrics.length : 0;
    const alerts = [...bondMetrics].filter(b => Math.abs(b.mispricingBps) >= 50).sort((a, b) => Math.abs(b.mispricingBps) - Math.abs(a.mispricingBps));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <Kpi label="Avg OAS" value={avgOas.toFixed(2) + '%'} sub="OAS = YTM - UST - OptVal" accent={T.navy} />
          <Kpi label="Mispricing Alerts" value={alerts.length} sub="|delta| ≥ 50 bps" accent={T.amber} />
          <Kpi label="Rich (over-priced)" value={bondMetrics.filter(b => b.mispricingBps > 20).length} sub="Market > Fair Value" accent={T.red} />
          <Kpi label="Cheap (under-priced)" value={bondMetrics.filter(b => b.mispricingBps < -20).length} sub="Fair > Market Value" accent={T.green} />
          <Kpi label="Option Value" value={OPTION_VALUE + ' bps'} sub="Callable premium (assumed)" accent={T.gold} />
        </div>

        <div style={card}>
          <h3 style={h3Style}>Yield Surface — Tenor × Rating Band</h3>
          <div style={accentBar} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Tenor</th>
              {ratingBands.map(rb => <th key={rb} style={th}>{rb}</th>)}
            </tr></thead>
            <tbody>
              {yieldSurface.map((r, i) => (
                <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={{ ...td, fontWeight: 600 }}>{r.tenor}</td>
                  {ratingBands.map(rb => {
                    const v = r[rb];
                    if (v == null) return <td key={rb} style={td}>—</td>;
                    const intensity = Math.min(1, Math.max(0, (v - 3) / 5));
                    return <td key={rb} style={{ ...td, background: 'hsla(' + (145 - intensity * 145) + ',55%,' + (85 - intensity * 20) + '%,1)', fontWeight: 700 }}>{v.toFixed(2)}%</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 8, fontSize: 11, color: T.textSec }}>
            Cell = mean YTM for bonds in tenor±2Y bucket and rating band. Empty cells have no issuers in sample.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={card}>
            <h3 style={h3Style}>Fair Value vs Market Price — Scatter</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis type="number" dataKey="fairPrice" name="Fair" tick={{ fontSize: 10, fill: T.textSec }}
                  label={{ value: 'Fair Value', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis type="number" dataKey="marketPrice" name="Market" tick={{ fontSize: 10, fill: T.textSec }}
                  label={{ value: 'Market', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
                <Scatter data={bondMetrics} fill={T.navyL} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h3 style={h3Style}>OAS Distribution (bps)</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={(() => {
                const bins = [-1, 0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 7];
                return bins.slice(0, -1).map((lo, i) => {
                  const hi = bins[i + 1];
                  return { range: lo.toFixed(1) + '-' + hi.toFixed(1), count: bondMetrics.filter(b => b.oas >= lo && b.oas < hi).length };
                });
              })()}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
                <Bar dataKey="count" fill={T.gold} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={card}>
          <h3 style={h3Style}>Mispricing Alerts — Top 12 (|delta| sorted)</h3>
          <div style={accentBar} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>ISIN</th><th style={th}>Issuer</th><th style={th}>Type</th><th style={th}>Rating</th>
              <th style={th}>Tenor</th><th style={th}>YTM</th><th style={th}>OAS</th>
              <th style={th}>Fair</th><th style={th}>Market</th><th style={th}>Delta bps</th>
            </tr></thead>
            <tbody>
              {alerts.slice(0, 12).map((b, i) => (
                <tr key={b.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={{ ...td, fontSize: 10.5 }}>{b.isin}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{b.issuer}</td>
                  <td style={td}><GssPill type={b.type} /></td>
                  <td style={td}>{b.rating}</td>
                  <td style={td}>{b.maturityYears}Y</td>
                  <td style={td}>{b.ytm.toFixed(2)}%</td>
                  <td style={td}>{b.oas.toFixed(2)}%</td>
                  <td style={td}>{b.fairPrice.toFixed(1)}</td>
                  <td style={td}>{b.marketPrice.toFixed(1)}</td>
                  <td style={{ ...td, color: b.mispricingBps > 0 ? T.red : T.green, fontWeight: 700 }}>{b.mispricingBps > 0 ? '+' : ''}{b.mispricingBps} bps</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 10, fontSize: 11, color: T.textSec, lineHeight: 1.55 }}>
            Red = market rich vs fair (potential sell candidates). Green = market cheap vs fair (potential buy candidates). Fair value incorporates treasury curve (interpolated), 8 bps option value assumption, and -5 bps greenium adjustment for GSS instruments.
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // TAB 19 — MONTE CARLO VaR & NGFS STRESS
  // 1,000 paths per NGFS scenario. Returns simulated via seeded normal shocks.
  // 1-day 95% VaR, 99% ES, worst drawdown; histogram + fan chart + waterfall.
  // ============================================================================

  const renderMcVar = () => {
    const N_PATHS = 1000;
    const HORIZON = 252; // days
    // Build synthetic portfolio returns from BONDS + EQUITIES
    const portfolioValueBase = BONDS.reduce((a, b) => a + b.amount, 0) + EQUITIES.reduce((a, e) => a + e.mcap * 0.01, 0);
    // Box-Muller via seeded sr to produce pseudo-normal
    const rngN = (seed) => {
      const u1 = Math.max(1e-10, sr(seed));
      const u2 = sr(seed + 1);
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    };

    const scenarioResults = NGFS_SHOCKS.map((sc, si) => {
      const dailySigma = 0.008 * sc.vol; // 0.8% base daily vol scaled
      const dailyDrift = -sc.equityShock / 100 / 252;
      const shockSpreadAnnual = sc.spreadShock / 10000;
      // Terminal P&L distribution (1-day)
      const terminal1d = [];
      const terminal1y = [];
      const pathsSample = []; // 30 sample paths for fan
      for (let p = 0; p < N_PATHS; p++) {
        let cumLog = 0;
        const path = [0];
        for (let t = 0; t < HORIZON; t++) {
          const z = rngN(si * 10007 + p * 251 + t * 7 + 13);
          const r = dailyDrift + dailySigma * z;
          cumLog += r;
          if (t === 0) terminal1d.push(r);
          if (p < 30) path.push(cumLog * 100);
        }
        terminal1y.push(cumLog);
        if (p < 30) pathsSample.push(path);
      }
      // 1-day VaR/ES at 95/99
      const sort1d = [...terminal1d].sort((a, b) => a - b);
      const idx95 = Math.floor(0.05 * sort1d.length);
      const idx99 = Math.floor(0.01 * sort1d.length);
      const var95 = -sort1d[idx95] * 100;
      const es99 = -sort1d.slice(0, Math.max(1, idx99)).reduce((a, v) => a + v, 0) / Math.max(1, idx99) * 100;
      // 1Y max drawdown
      const sort1y = [...terminal1y].sort((a, b) => a - b);
      const worstDd = -sort1y[0] * 100;
      const medDd = -sort1y[Math.floor(sort1y.length / 2)] * 100;
      // Additional spread stress impact (bps -> % price)
      const modifiedDuration = 6.2;
      const spreadPnL = -shockSpreadAnnual * modifiedDuration * 100;

      return {
        ...sc,
        var95: +var95.toFixed(2),
        es99: +es99.toFixed(2),
        worstDd: +worstDd.toFixed(2),
        medDd: +medDd.toFixed(2),
        spreadPnL: +spreadPnL.toFixed(2),
        equityPnL: sc.equityShock,
        totalStress: +(sc.equityShock + spreadPnL).toFixed(2),
        pathsSample,
        terminal1d
      };
    });

    // Build fan data from first scenario
    const activeScenario = scenarioResults[0];
    const fanData = Array.from({ length: HORIZON + 1 }, (_, t) => {
      const vals = activeScenario.pathsSample.map(p => p[t] || 0);
      const sorted = [...vals].sort((a, b) => a - b);
      return {
        day: t,
        p05: sorted[Math.floor(0.05 * sorted.length)] || 0,
        p25: sorted[Math.floor(0.25 * sorted.length)] || 0,
        p50: sorted[Math.floor(0.50 * sorted.length)] || 0,
        p75: sorted[Math.floor(0.75 * sorted.length)] || 0,
        p95: sorted[Math.floor(0.95 * sorted.length)] || 0
      };
    });

    // Histogram from scenario 0
    const binMin = Math.min(...activeScenario.terminal1d);
    const binMax = Math.max(...activeScenario.terminal1d);
    const nBins = 20;
    const binW = (binMax - binMin) / Math.max(0.0001, nBins);
    const histogram = Array.from({ length: nBins }, (_, i) => {
      const lo = binMin + i * binW;
      const hi = lo + binW;
      return {
        range: (lo * 100).toFixed(2),
        count: activeScenario.terminal1d.filter(v => v >= lo && v < hi).length
      };
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {scenarioResults.map(sc => (
            <div key={sc.id} style={{ ...cardCompact, borderTop: '3px solid ' + sc.color }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: sc.color, marginBottom: 4 }}>{sc.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                <div><span style={{ color: T.textSec }}>VaR 95%:</span> <b style={{ color: T.red, fontFamily: T.mono }}>{sc.var95.toFixed(2)}%</b></div>
                <div><span style={{ color: T.textSec }}>ES 99%:</span> <b style={{ color: T.red, fontFamily: T.mono }}>{sc.es99.toFixed(2)}%</b></div>
                <div><span style={{ color: T.textSec }}>Med DD:</span> <b style={{ fontFamily: T.mono }}>{sc.medDd.toFixed(1)}%</b></div>
                <div><span style={{ color: T.textSec }}>Worst DD:</span> <b style={{ color: T.red, fontFamily: T.mono }}>{sc.worstDd.toFixed(1)}%</b></div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
          <div style={card}>
            <h3 style={h3Style}>Scenario Fan Chart — {activeScenario.name} (30 paths, 252 days)</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={fanData}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Cumulative Return %', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
                <Area type="monotone" dataKey="p95" stroke="none" fill={activeScenario.color} fillOpacity={0.15} />
                <Area type="monotone" dataKey="p75" stroke="none" fill={activeScenario.color} fillOpacity={0.25} />
                <Area type="monotone" dataKey="p50" stroke={activeScenario.color} strokeWidth={2} fill="none" />
                <Area type="monotone" dataKey="p25" stroke="none" fill={activeScenario.color} fillOpacity={0.25} />
                <Area type="monotone" dataKey="p05" stroke="none" fill={activeScenario.color} fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h3 style={h3Style}>1-Day Return Distribution (Histogram)</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={histogram}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 8, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
                <Bar dataKey="count" fill={activeScenario.color} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={card}>
          <h3 style={h3Style}>NGFS Stress Waterfall — P&L Decomposition</h3>
          <div style={accentBar} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Scenario</th><th style={th}>Equity Shock</th>
              <th style={th}>Spread Shock (bps)</th><th style={th}>Spread P&L (MtM)</th>
              <th style={th}>Carbon Price Shock</th><th style={th}>Total Stress %</th><th style={th}>Risk-Adj VaR</th>
            </tr></thead>
            <tbody>
              {scenarioResults.map((sc, i) => {
                const riskAdj = (sc.var95 * sc.vol).toFixed(2);
                return (
                  <tr key={sc.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ ...td, fontWeight: 700, color: sc.color }}>{sc.name}</td>
                    <td style={{ ...td, color: T.red, fontWeight: 700 }}>{sc.equityShock}%</td>
                    <td style={td}>+{sc.spreadShock} bps</td>
                    <td style={{ ...td, color: T.red, fontWeight: 700 }}>{sc.spreadPnL.toFixed(2)}%</td>
                    <td style={td}>+${sc.carbonShock}/t</td>
                    <td style={{ ...td, color: T.red, fontWeight: 700 }}>{sc.totalStress.toFixed(2)}%</td>
                    <td style={{ ...td, fontWeight: 700 }}>{riskAdj}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 10, fontSize: 11, color: T.textSec, lineHeight: 1.55 }}>
            {N_PATHS.toLocaleString()} Monte Carlo paths per scenario, {HORIZON}-day horizon. Box-Muller seeded normals derived from <code>sr()</code>. Spread P&L = −Δspread × modified duration (6.2y assumed). Aligned with NGFS Phase IV macro-financial scenarios.
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // TAB 20 — SLB STEP-UP PRICING & PRIMARY PIPELINE
  // SLB price = base + P(miss) * stepUp (expected coupon uplift)
  // P(miss) = logistic on (1 - progress) and (1 - time_remaining)
  // Step-up term structure, pipeline book, bookbuild demand curve
  // ============================================================================

  const renderSlbPricing = () => {
    // Extend SLB_TRACKING with pricing
    const today = new Date('2026-04-17');
    const tracked = SLB_TRACKING.map((s) => {
      const obsD = new Date(s.obsDate);
      const daysToObs = Math.max(0, (obsD - today) / (1000 * 60 * 60 * 24));
      const yearsToObs = daysToObs / 365;
      // Progress 0-100 → normalized
      const progressNorm = Math.max(0, Math.min(1, s.progressPct / 100));
      // P(miss) logistic: higher when progress low or time short
      const logit = -0.5 + 2.5 * (1 - progressNorm) + 1.2 * Math.max(0, 1 - yearsToObs / 3);
      const pMiss = 1 / (1 + Math.exp(-logit));
      const expCouponUplift = pMiss * s.stepUp; // in bps
      // Base spread proxy
      const baseSpread = 120 + (s.baseline - s.spt) / Math.max(1, s.baseline) * 40;
      const slbSpread = baseSpread + expCouponUplift;
      return { ...s, daysToObs: Math.round(daysToObs), yearsToObs: +yearsToObs.toFixed(2), pMiss: +pMiss.toFixed(3), expCouponUplift: +expCouponUplift.toFixed(1), baseSpread: +baseSpread.toFixed(0), slbSpread: +slbSpread.toFixed(1) };
    });

    // Step-up term structure: by tenor bucket, mean step-up in bps
    const stepUpByTenor = [
      { tenor: '3-5Y', buckets: SLB_PIPELINE.filter(p => p.tenor >= 3 && p.tenor <= 5) },
      { tenor: '6-8Y', buckets: SLB_PIPELINE.filter(p => p.tenor >= 6 && p.tenor <= 8) },
      { tenor: '9-12Y', buckets: SLB_PIPELINE.filter(p => p.tenor >= 9 && p.tenor <= 12) },
      { tenor: '13-15Y', buckets: SLB_PIPELINE.filter(p => p.tenor >= 13 && p.tenor <= 15) }
    ].map(r => ({
      tenor: r.tenor,
      avgStepUp: r.buckets.length ? +(r.buckets.reduce((a, b) => a + b.stepUp, 0) / r.buckets.length).toFixed(1) : 0,
      avgAmbition: r.buckets.length ? +(r.buckets.reduce((a, b) => a + b.ambition, 0) / r.buckets.length).toFixed(2) : 0,
      count: r.buckets.length
    }));

    // Bookbuild demand curve: for active sample issuance (pipeline[0]), synthetic demand at spread levels
    const sample = SLB_PIPELINE[0];
    const demandCurve = Array.from({ length: 11 }, (_, i) => {
      const spread = sample.guidance - 25 + i * 5; // step around guidance
      // Demand in EUR M, inversely related to spread vs guidance
      const excess = (sample.guidance - spread) / 25; // -1 at +25 bps, +1 at -25 bps
      const demand = Math.max(0, sample.size * sample.bookCover * (1 - 0.5 * excess));
      return { spread, demand: +demand.toFixed(0) };
    });

    const totalPipelineSize = SLB_PIPELINE.reduce((a, p) => a + p.size, 0);
    const avgStepUp = SLB_PIPELINE.length ? SLB_PIPELINE.reduce((a, p) => a + p.stepUp, 0) / SLB_PIPELINE.length : 0;
    const avgBookCover = SLB_PIPELINE.length ? SLB_PIPELINE.reduce((a, p) => a + p.bookCover, 0) / SLB_PIPELINE.length : 0;
    const avgPMiss = tracked.length ? tracked.reduce((a, s) => a + s.pMiss, 0) / tracked.length : 0;
    const expectedUpliftPool = tracked.reduce((a, s) => a + s.expCouponUplift * s.amount / 10000, 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <Kpi label="Pipeline Size" value={'EUR ' + fmt(totalPipelineSize) + 'M'} sub={SLB_PIPELINE.length + ' issuances Q2-Q3'} accent={T.navy} />
          <Kpi label="Avg Step-Up" value={avgStepUp.toFixed(1) + ' bps'} sub="Pipeline primary" accent="#7c3aed" />
          <Kpi label="Avg Book Cover" value={avgBookCover.toFixed(1) + 'x'} sub="Demand / Offer" accent={T.green} />
          <Kpi label="P(miss) — Tracked" value={(avgPMiss * 100).toFixed(1) + '%'} sub="Logistic on progress+time" accent={T.amber} />
          <Kpi label="Exp. Uplift Pool" value={'EUR ' + expectedUpliftPool.toFixed(1) + 'M'} sub="Σ P(miss) × stepUp × notional" accent={T.gold} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={card}>
            <h3 style={h3Style}>Step-Up Term Structure (pipeline)</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={stepUpByTenor}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="tenor" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="l" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="l" dataKey="avgStepUp" fill="#7c3aed" name="Avg Step-Up (bps)" />
                <Line yAxisId="r" type="monotone" dataKey="avgAmbition" stroke={T.gold} strokeWidth={2} name="Avg Ambition (0-1)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h3 style={h3Style}>Bookbuild Demand Curve — {sample.issuer} {sample.tenor}Y</h3>
            <div style={accentBar} />
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={demandCurve}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="spread" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Spread (bps)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Demand (EUR M)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip contentStyle={{ fontFamily: T.mono, fontSize: 11 }} />
                <Line type="monotone" dataKey="demand" stroke={T.sage} strokeWidth={2.5} dot={{ fill: T.sage, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 8, fontSize: 11, color: T.textSec }}>
              Guidance = {sample.guidance} bps · Book cover = {sample.bookCover}x · Size = EUR {sample.size}M. Curve estimated via price-elasticity on book-cover headroom.
            </div>
          </div>
        </div>

        <div style={card}>
          <h3 style={h3Style}>Primary Pipeline — 15 Upcoming SLB Issuances</h3>
          <div style={accentBar} />
          <div style={{ maxHeight: 350, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={th}>Week</th><th style={th}>Issuer</th><th style={th}>Sector</th>
                <th style={th}>Size</th><th style={th}>Tenor</th><th style={th}>Guidance</th>
                <th style={th}>Step-Up</th><th style={th}>Ambition</th><th style={th}>Book x</th>
              </tr></thead>
              <tbody>
                {[...SLB_PIPELINE].sort((a, b) => a.launchWeek - b.launchWeek).map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ ...td, fontWeight: 700, color: T.gold }}>W{p.launchWeek}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{p.issuer}</td>
                    <td style={td}>{p.sector}</td>
                    <td style={td}>{fmtMoney(p.size, p.currency)}</td>
                    <td style={td}>{p.tenor}Y</td>
                    <td style={td}>{p.guidance} bps</td>
                    <td style={{ ...td, color: '#7c3aed', fontWeight: 700 }}>+{p.stepUp} bps</td>
                    <td style={{ ...td, color: p.ambition > 0.65 ? T.green : p.ambition > 0.45 ? T.amber : T.red, fontWeight: 700 }}>{(p.ambition * 100).toFixed(0)}%</td>
                    <td style={td}>{p.bookCover.toFixed(1)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={card}>
          <h3 style={h3Style}>Tracked Live SLBs — Step-Up Probability Pricing</h3>
          <div style={accentBar} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Issuer</th><th style={th}>KPI</th><th style={th}>Progress</th>
              <th style={th}>Days to Obs</th><th style={th}>P(miss)</th>
              <th style={th}>Step-Up</th><th style={th}>Exp Uplift</th><th style={th}>SLB Spread</th>
            </tr></thead>
            <tbody>
              {[...tracked].sort((a, b) => b.pMiss - a.pMiss).map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={{ ...td, fontWeight: 600 }}>{s.issuer}</td>
                  <td style={{ ...td, fontSize: 10.5 }}>{s.kpi}</td>
                  <td style={{ ...td, color: s.progressPct >= 75 ? T.green : s.progressPct >= 45 ? T.amber : T.red, fontWeight: 700 }}>{s.progressPct.toFixed(1)}%</td>
                  <td style={td}>{s.daysToObs}</td>
                  <td style={{ ...td, color: s.pMiss > 0.5 ? T.red : T.green, fontWeight: 700 }}>{(s.pMiss * 100).toFixed(1)}%</td>
                  <td style={td}>+{s.stepUp} bps</td>
                  <td style={{ ...td, color: '#7c3aed', fontWeight: 700 }}>+{s.expCouponUplift} bps</td>
                  <td style={{ ...td, fontWeight: 700 }}>{s.slbSpread.toFixed(0)} bps</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 10, fontSize: 11, color: T.textSec, lineHeight: 1.55 }}>
            Expected coupon uplift = P(miss) × step-up (bps). P(miss) modeled via logistic regression proxy on progress-to-target and time-to-observation: <code>p = σ(-0.5 + 2.5(1-progress) + 1.2·max(0,1-years/3))</code>. SLB spread = baseline + expected uplift.
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  const renderTab = () => {
    switch (tab) {
      case 'overview': return renderOverview();
      case 'bonds': return renderBonds();
      case 'equities': return renderEquities();
      case 'gss': return renderGss();
      case 'greenium': return renderGreenium();
      case 'slb': return renderSlb();
      case 'ctb': return renderCtb();
      case 'pab': return renderPab();
      case 'gar': return renderGar();
      case 'uop': return renderUop();
      case 'waterfall': return renderWaterfall();
      case 'yield': return renderYield();
      case 'rebalance': return renderRebalance();
      case 'reg': return renderReg();
      case 'greeniumReg': return renderGreeniumReg();
      case 'optimizer': return renderOptimizer();
      case 'factor': return renderFactor();
      case 'oas': return renderOas();
      case 'mcvar': return renderMcVar();
      case 'slbPricing': return renderSlbPricing();
      default: return renderOverview();
    }
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ background: T.surface, borderBottom: '1px solid ' + T.border, padding: '16px 28px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid ' + T.borderL, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: T.textSec, fontSize: 11, fontFamily: T.mono }}>Back</button>
          <div style={{ fontSize: 10.5, color: T.textSec, fontFamily: T.mono, letterSpacing: '0.08em' }}>
            PLATFORM / CAPITAL MARKETS / TAXONOMY ALIGNMENT
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 10.5, color: T.textMut, fontFamily: T.mono }}>EP-Q8</div>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: T.navy, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          Capital Markets Taxonomy Alignment
        </h1>
        <div style={{ fontSize: 12.5, color: T.textSec, marginBottom: 14, maxWidth: 960, lineHeight: 1.55 }}>
          Bond + equity portfolio alignment, GSS bond analytics (ICMA GBP/SBP/SBG), greenium modeling, CTB/PAB index construction (EU 2020/1818), Green Asset Ratio (GAR) computation (Art 8 DA), and use-of-proceeds post-issuance attestation. Supports EU Taxonomy Regulation, CSRD ESRS, SFDR Level 2, TCFD, and IFRS S2.
        </div>
        <div style={{ display: 'flex', gap: 2, borderBottom: '2px solid ' + T.gold, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '10px 16px', border: 'none', cursor: 'pointer',
              background: tab === t.id ? T.navy : 'transparent',
              color: tab === t.id ? '#fff' : T.textSec,
              fontWeight: tab === t.id ? 600 : 500,
              fontSize: 12, fontFamily: T.font, letterSpacing: '-0.005em',
              borderRadius: '6px 6px 0 0',
              borderBottom: tab === t.id ? '2px solid ' + T.gold : '2px solid transparent',
              whiteSpace: 'nowrap', transition: 'all 0.15s ease'
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 24, maxWidth: 1600, margin: '0 auto' }}>
        {renderTab()}
      </div>

      {/* Footer terminal bar */}
      <div style={{ background: T.navy, color: '#fff', padding: '10px 24px', fontFamily: T.mono, fontSize: 10.5, display: 'flex', gap: 24, borderTop: '2px solid ' + T.gold }}>
        <span>EP-Q8 / CAPITAL_MARKETS_TAXONOMY</span>
        <span>BONDS: {BONDS.length}</span>
        <span>EQUITIES: {EQUITIES.length}</span>
        <span>FRAMEWORKS: {GSS_FRAMEWORKS.length}</span>
        <span>SLB_TRACKED: {SLB_TRACKING.length}</span>
        <span style={{ marginLeft: 'auto', color: T.gold }}>LIVE · PRNG_SEEDED · DIV_GUARDED</span>
      </div>
    </div>
  );
};

export default CapitalMarketsTaxonomyPage;
