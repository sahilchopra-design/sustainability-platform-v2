import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  PieChart, Pie, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, LineChart, Line,
} from 'recharts';

/* ═══════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════ */
const T = {
  bg: '#f5f3ef',
  surface: '#ffffff',
  surfaceAlt: '#f9f7f3',
  border: '#e4dfd6',
  navy: '#1b3a5c',
  navyL: '#2c5282',
  gold: '#c8992a',
  goldL: '#e0b84a',
  teal: '#0d7377',
  tealL: '#14a0a5',
  sage: '#4a7c59',
  amber: '#d97706',
  red: '#dc2626',
  green: '#16a34a',
  purple: '#7c3aed',
  text: '#1b3a5c',
  textSec: '#5c6b7e',
  textMut: '#9aa3ae',
  font: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const sr = (s) => { let x = Math.sin(s * 9301 + 49297) * 233280; return (x - Math.floor(x)); };

/* ═══════════════════════════════════════════════════════════════════
   UNDP 6-PILLAR FRAMEWORK DATA
   ═══════════════════════════════════════════════════════════════════ */
const PILLARS = [
  {
    id: 1, icon: '🏛️', color: '#1b3a5c', lightColor: '#dbeafe',
    title: 'Public Sector Coordination & National Alignment',
    subtitle: 'Strategic Planning · Inter-Agency Coordination · NDC/SDG Alignment',
    subsections: [
      { id: '1.1', title: 'Strategic Planning, Identifying Gaps & National Priorities', description: 'Map financing needs against NDCs, NAPs, and SDG targets. Identify structural market gaps and define blended finance intervention points.' },
      { id: '1.2', title: 'Public Sector Institutional Roles & Inter-Agency Coordination', description: 'Establish clear roles across ministries, central banks, and development agencies. Build coordination mechanisms to prevent fragmentation of concessional resources.' },
    ],
    indicators: ['INFF alignment score', 'NDC financing gap ($B)', 'Inter-agency protocols active', 'National blended finance strategy adopted'],
    maturityLevels: ['No strategy', 'Awareness', 'Planning', 'Implementation', 'Scaling'],
  },
  {
    id: 2, icon: '⚖️', color: '#7c3aed', lightColor: '#ede9fe',
    title: 'Policy & Regulatory Environment',
    subtitle: 'Legal Frameworks · Financial Sector Levers · Carbon Regulation',
    subsections: [
      { id: '2.1', title: 'Legal & Institutional Frameworks', description: 'Establish legal basis for PPPs, blended vehicles (SMVs, SPVs), and guarantee instruments. Resolve regulatory ambiguity blocking private capital flows.' },
      { id: '2.2', title: 'Sectoral & Financial Policy Instruments', description: 'Deploy viability gap funding (VGF), tax incentives, feed-in tariffs, and offtake guarantees to improve risk-return profiles for private investors.' },
      { id: '2.3', title: 'Financial Sector Regulatory Levers', description: 'Use central bank tools — green taxonomy, risk-weight adjustments, disclosure requirements — to mobilize domestic institutional capital.' },
      { id: '2.4', title: 'Carbon & Climate Finance Regulation', description: 'Develop carbon market frameworks aligned with Article 6. Regulate climate disclosures (TCFD/ISSB) to improve transparency and attract ESG investors.' },
    ],
    indicators: ['PPP legal framework enacted', 'Green taxonomy adopted', 'Carbon price signal ($/tCO2e)', 'TCFD disclosure rate (%)'],
    maturityLevels: ['No framework', 'Draft policy', 'Enacted', 'Enforced', 'Market-embedded'],
  },
  {
    id: 3, icon: '💰', color: '#0d7377', lightColor: '#ccfbf1',
    title: 'Supply & Deployment of Concessional Capital',
    subtitle: 'DFI Commitments · Minimum Concessionality · Transparent Mapping',
    subsections: [
      { id: '3.1', title: 'Increasing the Supply of Concessional Resources', description: 'Expand bilateral ODA commitments, DFI balance sheet utilization, and MDB capital adequacy for climate action. Unlock GCF, GEF, and CIF resources.' },
      { id: '3.2', title: 'Ensuring Effective Concessional Capital Deployment', description: 'Apply minimum concessionality principle — deploy only what is needed to catalyze private investment. Avoid market distortion and monitor leverage ratios.' },
      { id: '3.3', title: 'Establishing a Transparent Mapping System', description: 'Create registry of concessional commitments, pipeline transactions, and leverage ratios. Enable evidence-based allocation of scarce public resources.' },
    ],
    indicators: ['Concessional capital committed ($B)', 'Avg leverage ratio (x)', 'Pipeline mapped (%)', 'Minimum concessionality compliance (%)'],
    maturityLevels: ['Ad hoc', 'Tracked', 'Optimized', 'Systematized', 'Market-standard'],
  },
  {
    id: 4, icon: '🏦', color: '#d97706', lightColor: '#fef3c7',
    title: 'Market Development & Private Sector Mobilization',
    subtitle: 'Domestic Capital · International Investors · Market Confidence',
    subsections: [
      { id: '4.1', title: 'Mobilizing Domestic & International Commercial Capital', description: 'Engage pension funds, insurance companies, and sovereign wealth funds through co-investment platforms. Develop local currency instruments to eliminate FX risk.' },
      { id: '4.2', title: 'Strengthening Market Confidence', description: 'Build track record through demonstration transactions. Standardize deal structures, improve credit ratings, and enhance ESG disclosure to reduce perceived risk.' },
    ],
    indicators: ['Domestic inst. capital mobilized ($B)', 'FX hedging facility size ($M)', 'Credit-rated deals (%)', 'Repeat investor rate (%)'],
    maturityLevels: ['No market', 'Pilot deals', 'Growing market', 'Active market', 'Deep market'],
  },
  {
    id: 5, icon: '📋', color: '#4a7c59', lightColor: '#dcfce7',
    title: 'Project Pipeline Development & Standardization',
    subtitle: 'PPFs · Origination · Replicability · Governance',
    subsections: [
      { id: '5.1', title: 'Project Origination & Preparation', description: 'Fund Project Preparation Facilities (PPFs) to bring bankable projects to market. Provide technical assistance, feasibility studies, and transaction advisory at early stage.' },
      { id: '5.2', title: 'Standardization & Replicability', description: 'Develop template term sheets, risk allocation matrices, and impact frameworks. Reduce transaction costs and enable replication at scale across geographies.' },
      { id: '5.3', title: 'Institutional Anchoring & Pipeline Governance', description: 'Establish pipeline governance committees with clear origination mandates. Anchor blended finance pipeline in national planning cycles and DFI investment strategies.' },
    ],
    indicators: ['Bankable projects in pipeline (#)', 'Avg deal prep cost ($M)', 'Template deal replication rate (%)', 'PPF facilities operational (#)'],
    maturityLevels: ['No pipeline', 'Scattered deals', 'Pipeline forming', 'Systematic pipeline', 'Deep pipeline'],
  },
  {
    id: 6, icon: '📊', color: '#c8992a', lightColor: '#fef9c3',
    title: 'Information Architecture',
    subtitle: 'IMM · IRIS+ · Transparency · Market Intelligence',
    subsections: [
      { id: '6.1', title: 'Impact, Results & Measurement', description: 'Implement IRIS+ aligned IMM systems. Build theory of change per transaction. Track output (jobs, MW, households) and outcome (emissions reduced, income improved) metrics.' },
      { id: '6.2', title: 'Transparency', description: 'Publish concessional capital flows, leverage ratios, and impact results. Adopt OECD DAC reporting standards. Enable market participants to assess additionality and effectiveness.' },
      { id: '6.3', title: 'Market Intelligence', description: 'Maintain Convergence-style deal database tracking transaction structures, instruments, and leverage ratios. Generate market benchmarks to inform future deal structuring.' },
    ],
    indicators: ['IRIS+ indicators tracked (#)', 'Public reporting rate (%)', 'Market database coverage (%)', 'Theory of change quality (%)'],
    maturityLevels: ['No data', 'Basic tracking', 'Standardized', 'Verified', 'Market-leading'],
  },
];

/* ═══════════════════════════════════════════════════════════════════
   INSTRUMENTS
   ═══════════════════════════════════════════════════════════════════ */
const INSTRUMENTS = [
  { id: 'I1', name: 'Concessional Loan', category: 'Debt', pillar: 3, risk: 'Low', cost: '2–4%', provider: 'ADB · IFC · JICA · GCF', description: 'Below-market rate loans reducing cost of capital for projects where commercial rates make returns unviable.', leverage: 3.5, concessionality: 'High', useCase: 'Infrastructure, Renewable Energy, Agriculture' },
  { id: 'I2', name: 'Viability Gap Funding', category: 'Grant', pillar: 2, risk: 'None (grant)', cost: '0%', provider: 'Government · DFI · GEF', description: 'One-time capital subsidy closing revenue or cost gap that prevents private sector participation at commercial returns.', leverage: 2.8, concessionality: 'Very High', useCase: 'Urban Infrastructure, Water & Sanitation, Healthcare' },
  { id: 'I3', name: 'Credit Guarantee', category: 'Guarantee', pillar: 2, risk: 'Contingent', cost: '0.5–2% fee', provider: 'MIGA · USAID DCA · CGCC · GuarantCo', description: 'Risk-sharing instrument absorbing a defined percentage of credit losses (e.g., 90% as in Cambodia CGCC scheme).', leverage: 5.2, concessionality: 'Medium', useCase: 'MSME Finance, Agricultural Lending' },
  { id: 'I4', name: 'First-Loss Capital', category: 'Equity', pillar: 3, risk: 'High (absorbs first)', cost: '0–5%', provider: 'Foundations · Impact Funds · DFIs', description: 'Subordinated capital tranche absorbing initial portfolio losses before senior investors, enabling commercial participation.', leverage: 4.1, concessionality: 'Very High', useCase: 'Fund Structures, Financial Inclusion, NBS' },
  { id: 'I5', name: 'Political Risk Insurance', category: 'Guarantee', pillar: 2, risk: 'Contingent', cost: '0.5–1.5% premium', provider: 'MIGA · DFC · ATI · ECGD', description: 'Coverage against expropriation, currency inconvertibility, and breach of contract by sovereign counterparties.', leverage: 3.8, concessionality: 'Low', useCase: 'Cross-border Investment, Sovereign Offtake' },
  { id: 'I6', name: 'Project Preparation Grant', category: 'Grant', pillar: 5, risk: 'None (grant)', cost: '0%', provider: 'GCF · CIF · GEF · PIDG PREP', description: 'Early-stage technical assistance funding covering feasibility studies, transaction advisory, and environmental assessment.', leverage: 6.0, concessionality: 'Very High', useCase: 'Project Pipeline Development' },
  { id: 'I7', name: 'Local Currency Facility', category: 'FX Risk', pillar: 4, risk: 'Currency', cost: '1–3% hedging cost', provider: 'TCX · MAS · Central Banks', description: 'FX hedging or local currency lending eliminating currency mismatch that deters foreign investors from EM markets.', leverage: 2.5, concessionality: 'Medium', useCase: 'All Sectors in EM/DEs' },
  { id: 'I8', name: 'Subordinated Debt', category: 'Debt', pillar: 3, risk: 'Moderate-High', cost: '5–8%', provider: 'DFIs · Impact Investors · Foundations', description: 'Junior debt tranche ranked below senior creditors, providing structural credit enhancement to attract senior commercial lenders.', leverage: 3.2, concessionality: 'Medium', useCase: 'Infrastructure Funds, SME Finance' },
  { id: 'I9', name: 'Green/Sustainability Bond', category: 'Bond', pillar: 4, risk: 'Low-Medium', cost: '4–7% yield', provider: 'Capital Markets · MDBs · Sovereign', description: 'Labeled bond instrument channeling capital to sustainable projects. Sustainability-linked bonds tie coupon to ESG KPI targets.', leverage: 4.5, concessionality: 'Low', useCase: 'Renewable Energy, Infrastructure, Sovereign SDG' },
  { id: 'I10', name: 'Power Purchase Agreement', category: 'Revenue Guarantee', pillar: 2, risk: 'Revenue certainty', cost: 'Tariff mechanism', provider: 'Government · SOE · Utility', description: 'Long-term offtake contract providing revenue certainty enabling private investment in renewable energy without concessional capital.', leverage: 5.8, concessionality: 'Low', useCase: 'Renewable Energy, Energy Transition' },
];

/* ═══════════════════════════════════════════════════════════════════
   REGIONAL MARKET DATA (Convergence 2016–2024)
   ═══════════════════════════════════════════════════════════════════ */
const MARKETS = [
  { country: 'India', region: 'South Asia', transactions: 85, financing: 11.8, topSector: 'Renewable Energy', mainDFI: 'IFC · ADB', avgLeverage: 3.8 },
  { country: 'Indonesia', region: 'SE Asia', transactions: 40, financing: 9.0, topSector: 'Infrastructure', mainDFI: 'ADB · JICA', avgLeverage: 3.2 },
  { country: 'Vietnam', region: 'SE Asia', transactions: 42, financing: 8.3, topSector: 'Renewable Energy', mainDFI: 'ADB · JICA · IFC', avgLeverage: 3.5 },
  { country: 'Philippines', region: 'SE Asia', transactions: 27, financing: 3.8, topSector: 'Climate Adaptation', mainDFI: 'ADB · GCF', avgLeverage: 2.9 },
  { country: 'Pakistan', region: 'South Asia', transactions: 30, financing: 2.9, topSector: 'Energy', mainDFI: 'ADB · IFC · AIIB', avgLeverage: 2.6 },
  { country: 'Bangladesh', region: 'South Asia', transactions: 26, financing: 1.4, topSector: 'Agri · Garments', mainDFI: 'IFC · AIIB', avgLeverage: 2.2 },
  { country: 'Thailand', region: 'SE Asia', transactions: 9, financing: 2.7, topSector: 'Infrastructure', mainDFI: 'ADB · IFC', avgLeverage: 3.0 },
  { country: 'Myanmar', region: 'SE Asia', transactions: 15, financing: 2.4, topSector: 'Energy', mainDFI: 'ADB · IFC', avgLeverage: 2.8 },
  { country: 'Lao PDR', region: 'SE Asia', transactions: 13, financing: 1.3, topSector: 'Energy', mainDFI: 'ADB · IFC', avgLeverage: 2.7 },
  { country: 'Cambodia', region: 'SE Asia', transactions: 9, financing: 1.3, topSector: 'MSME Finance', mainDFI: 'CGCC · ADB', avgLeverage: 2.1 },
  { country: 'Nepal', region: 'South Asia', transactions: 3, financing: 0.5, topSector: 'Agriculture', mainDFI: 'DCGF · ADB', avgLeverage: 1.8 },
  { country: 'Sri Lanka', region: 'South Asia', transactions: 9, financing: 0.9, topSector: 'Energy', mainDFI: 'ADB · IFC', avgLeverage: 2.4 },
];

/* ═══════════════════════════════════════════════════════════════════
   VEHICLE ARCHETYPES
   ═══════════════════════════════════════════════════════════════════ */
const VEHICLES = [
  { id: 'V1', name: 'SDG Indonesia One', type: 'Local DFI-Led', country: 'Indonesia', size: 'Multi-$B', implementing: 'PT Sarana Multi Infrastruktur (SMI)', ministry: 'Ministry of Finance', focus: 'SDG-aligned infrastructure', instruments: ['Concessional Loan', 'Guarantee', 'First-Loss Equity'], leverage: 4.2, quadrant: 'Q2' },
  { id: 'V2', name: 'NIIF (India)', type: 'Local DFI-Led', country: 'India', size: '$4.9B', implementing: 'National Investment & Infrastructure Fund', ministry: 'Ministry of Finance', focus: 'Infrastructure & sustainability', instruments: ['Equity', 'Concessional Debt'], leverage: 5.1, quadrant: 'Q2' },
  { id: 'V3', name: 'GAIA Platform', type: 'Private Sector-Led', country: 'Global (25 EMDEs)', size: '$1.48B', implementing: 'Private-led blended platform', ministry: 'N/A', focus: 'Climate adaptation & mitigation', instruments: ['Long-term Loans', 'Concessional Tranche', 'Grants'], leverage: 3.8, quadrant: 'Q4' },
  { id: 'V4', name: 'FAST-P', type: 'Donor/Public Finance-Led Regional', country: 'Asia-Pacific', size: 'Multi-$B', implementing: 'Convergence + MDBs', ministry: 'Various', focus: 'Asia energy transition', instruments: ['Concessional Loan', 'TA Grant', 'First-Loss'], leverage: 4.0, quadrant: 'Q3' },
  { id: 'V5', name: 'SCALED', type: 'Donor/Public Finance-Led Regional', country: 'Asia-Pacific', size: 'Multi-$B', implementing: 'ADB + Partners', ministry: 'Various', focus: 'Scaling sustainable capital', instruments: ['Guarantee', 'Concessional Debt'], leverage: 3.5, quadrant: 'Q3' },
  { id: 'V6', name: 'EAIF', type: 'Infrastructure Fund', country: 'Africa', size: '$1B+', implementing: 'Emerging Africa Infrastructure Fund', ministry: 'N/A', focus: 'African infrastructure', instruments: ['Senior Debt', 'Mezzanine'], leverage: 3.0, quadrant: 'Q3' },
  { id: 'V7', name: 'CGCC', type: 'Credit Guarantee Scheme', country: 'Cambodia', size: 'Facility-based', implementing: 'Credit Guarantee Corp. Cambodia', ministry: 'Ministry of Economy', focus: 'MSME & economic stimulus (90% coverage)', instruments: ['Credit Guarantee'], leverage: 2.1, quadrant: 'Q2' },
  { id: 'V8', name: 'Pentagreen', type: 'Private Sector-Led', country: 'SE Asia', size: '$150M+', implementing: 'Temasek + HSBC', ministry: 'N/A', focus: 'Transition assets in SE Asia', instruments: ['Concessional Debt', 'Subordinated Debt'], leverage: 3.3, quadrant: 'Q4' },
];

/* ═══════════════════════════════════════════════════════════════════
   CONCESSIONAL CAPITAL PROVIDERS
   ═══════════════════════════════════════════════════════════════════ */
const PROVIDERS = [
  { name: 'World Bank/IFC', type: 'MDB', commitments: 91, volume: 14.2, regions: 'Global' },
  { name: 'PIDG', type: 'Facility', commitments: 71, volume: 5.8, regions: 'Africa · Asia' },
  { name: 'ADB', type: 'MDB', commitments: 55, volume: 9.0, regions: 'Asia-Pacific' },
  { name: 'USAID', type: 'Bilateral', commitments: 33, volume: 2.4, regions: 'Global' },
  { name: 'JICA', type: 'Bilateral', commitments: 24, volume: 3.8, regions: 'Asia' },
  { name: 'FMO', type: 'DFI', commitments: 29, volume: 2.1, regions: 'Global' },
  { name: 'GCF', type: 'Climate Fund', commitments: 14, volume: 4.3, regions: 'Global' },
  { name: 'EIB', type: 'MDB', commitments: 18, volume: 3.2, regions: 'Europe · Global' },
  { name: 'AIIB', type: 'MDB', commitments: 12, volume: 2.6, regions: 'Asia' },
  { name: 'GEF', type: 'Climate Fund', commitments: 11, volume: 1.4, regions: 'Global' },
];

const SDG_COLORS_MAP = {
  1: '#e5243b', 2: '#dda63a', 3: '#4c9f38', 4: '#c5192d', 5: '#ff3a21',
  6: '#26bde2', 7: '#fcc30b', 8: '#a21942', 9: '#fd6925', 10: '#dd1367',
  11: '#fd9d24', 12: '#bf8b2e', 13: '#3f7e44', 14: '#0a97d9', 15: '#56c02b',
  16: '#00689d', 17: '#19486a',
};

const YEAR_DEAL_DATA = [
  { year: 2016, deals: 22, volume: 3.2, avgLeverage: 2.4 },
  { year: 2017, deals: 28, volume: 4.1, avgLeverage: 2.6 },
  { year: 2018, deals: 35, volume: 5.8, avgLeverage: 2.9 },
  { year: 2019, deals: 42, volume: 7.2, avgLeverage: 3.0 },
  { year: 2020, deals: 31, volume: 5.1, avgLeverage: 2.8 },
  { year: 2021, deals: 48, volume: 8.9, avgLeverage: 3.2 },
  { year: 2022, deals: 52, volume: 9.8, avgLeverage: 3.4 },
  { year: 2023, deals: 46, volume: 7.6, avgLeverage: 3.1 },
  { year: 2024, deals: 41, volume: 4.3, avgLeverage: 3.0 },
];

const SECTOR_DEAL_DATA = [
  { sector: 'Renewable Energy', deals: 112, volume: 18.4, avgLev: 3.8, avgConc: 22 },
  { sector: 'Infrastructure',   deals: 68,  volume: 14.2, avgLev: 3.1, avgConc: 28 },
  { sector: 'MSME Finance',     deals: 55,  volume: 8.1,  avgLev: 2.3, avgConc: 35 },
  { sector: 'Agriculture',      deals: 42,  volume: 5.6,  avgLev: 2.0, avgConc: 40 },
  { sector: 'Climate Adaptation', deals: 28, volume: 4.2, avgLev: 1.8, avgConc: 45 },
  { sector: 'Healthcare',       deals: 18,  volume: 2.1,  avgLev: 1.9, avgConc: 42 },
  { sector: 'NBS/Forestry',     deals: 14,  volume: 1.8,  avgLev: 1.5, avgConc: 55 },
  { sector: 'Water & Sanitation', deals: 8, volume: 1.6,  avgLev: 1.6, avgConc: 50 },
];

const RISK_FACTORS_DEFAULT = [
  { id:'R1', category:'Political',    name:'Political Instability',      probability:2, impact:4, mitigation:'Political Risk Insurance (MIGA)',        mitigated:false },
  { id:'R2', category:'Currency',     name:'FX Depreciation Risk',       probability:3, impact:4, mitigation:'Local currency facility (TCX)',           mitigated:false },
  { id:'R3', category:'Credit',       name:'Offtaker Default',           probability:2, impact:5, mitigation:'Payment guarantee + escrow',             mitigated:false },
  { id:'R4', category:'Regulatory',   name:'Policy/Regulatory Change',   probability:3, impact:3, mitigation:'Stabilisation clause in PPA',            mitigated:false },
  { id:'R5', category:'Construction', name:'Construction Cost Overrun',  probability:3, impact:3, mitigation:'Completion guarantee + contingency',      mitigated:false },
  { id:'R6', category:'Market',       name:'Demand/Revenue Shortfall',   probability:2, impact:4, mitigation:'Minimum volume guarantee',               mitigated:false },
  { id:'R7', category:'Environmental',name:'Climate/Physical Risk',      probability:2, impact:3, mitigation:'Insurance + resilient design',            mitigated:false },
  { id:'R8', category:'Liquidity',    name:'Refinancing Risk',           probability:2, impact:3, mitigation:'Debt service reserve account',            mitigated:false },
  { id:'R9', category:'ESG',          name:'Social/Env Controversy',     probability:1, impact:4, mitigation:'IFC PS compliance + ESIA',               mitigated:false },
];

const DEAL_SCORING_CRITERIA = [
  { id:'S1', category:'Additionality', label:'Additionality',                       weight:20 },
  { id:'S2', category:'Impact',        label:'Development Impact & SDG alignment',  weight:18 },
  { id:'S3', category:'Leverage',      label:'Leverage vs. sector benchmark',        weight:15 },
  { id:'S4', category:'Replicability', label:'Scalability & Replicability',          weight:12 },
  { id:'S5', category:'Sustainability',label:'Financial Sustainability',             weight:12 },
  { id:'S6', category:'Governance',    label:'Governance & Fiduciary Standards',     weight:10 },
  { id:'S7', category:'Gender',        label:'Gender & Inclusion',                   weight:8  },
  { id:'S8', category:'Concessionality',label:'Minimum Concessionality applied',    weight:5  },
];

const DFI_BENCHMARKS = [
  { name:'IFC',  region:'Global',       avgLeverage:4.2, avgConcPct:18, climate:38, minProjectSize:10, sectors:['Financial Services','Infrastructure','Agribusiness'] },
  { name:'ADB',  region:'Asia-Pacific', avgLeverage:3.6, avgConcPct:24, climate:44, minProjectSize:5,  sectors:['Infrastructure','Energy','Urban','Finance'] },
  { name:'JICA', region:'Asia',         avgLeverage:2.8, avgConcPct:35, climate:30, minProjectSize:20, sectors:['Infrastructure','Agriculture','Healthcare','Education'] },
  { name:'FMO',  region:'Global EM',    avgLeverage:3.9, avgConcPct:20, climate:41, minProjectSize:5,  sectors:['Financial Institutions','Energy','Agri & Food'] },
  { name:'GCF',  region:'Global',       avgLeverage:3.2, avgConcPct:45, climate:100,minProjectSize:10, sectors:['Mitigation','Adaptation','Cross-cutting'] },
  { name:'AIIB', region:'Asia',         avgLeverage:3.5, avgConcPct:22, climate:35, minProjectSize:50, sectors:['Transport','Energy','Urban','ICT'] },
];

/* ═══════════════════════════════════════════════════════════════════
   UI PRIMITIVES
   ═══════════════════════════════════════════════════════════════════ */
const Card = ({ children, style }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, ...style }}>
    {children}
  </div>
);
const KPI = ({ label, value, sub, color, icon }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px' }}>
    {icon && <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>}
    <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: T.mono }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);
const Pill = ({ label, color = T.navy }) => (
  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: color + '18', color, border: `1px solid ${color}30`, marginRight: 4, marginBottom: 4 }}>{label}</span>
);
const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: '10px 20px', border: 'none', borderBottom: active ? `2px solid ${T.navy}` : '2px solid transparent', background: 'transparent', color: active ? T.navy : T.textSec, fontWeight: active ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: T.font, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
    {label}
  </button>
);
const SectionHeader = ({ title, sub, icon }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      <div style={{ fontSize: 17, fontWeight: 700, color: T.navy }}>{title}</div>
    </div>
    {sub && <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   GRANT ELEMENT CALCULATOR (OECD DAC NPV)
   ═══════════════════════════════════════════════════════════════════ */
function GrantElementCalc() {
  const [loanAmt, setLoanAmt] = useState(100);
  const [rate, setRate] = useState(3);
  const [grace, setGrace] = useState(3);
  const [maturity, setMaturity] = useState(15);
  const discountRate = 10;

  const schedule = useMemo(() => {
    const rows = [];
    const repYears = maturity - grace;
    for (let t = 1; t <= Math.min(maturity, 20); t++) {
      const principalThisYear = t > grace && repYears > 0 ? loanAmt / repYears : 0;
      const outstanding = t > grace && repYears > 0 ? loanAmt - (loanAmt / repYears) * (t - grace - 1) : loanAmt;
      const interest = outstanding * rate / 100;
      const payment = principalThisYear + interest;
      const pv = payment / Math.pow(1 + discountRate / 100, t);
      rows.push({ t, payment: +payment.toFixed(2), pv: +pv.toFixed(2) });
    }
    return rows;
  }, [loanAmt, rate, grace, maturity]);

  const totalPV = schedule.reduce((s, r) => s + r.pv, 0);
  const ge = loanAmt > 0 ? ((1 - totalPV / loanAmt) * 100) : 0;
  const geClass = ge >= 50 ? { label: 'Highly Concessional', color: T.green } : ge >= 25 ? { label: 'Concessional', color: T.amber } : { label: 'Non-Concessional', color: T.red };

  const compData = [
    { label: 'Your GE', value: Math.max(0, ge), fill: geClass.color },
    { label: 'ODA Threshold (25%)', value: 25, fill: T.amber },
    { label: 'Highly Conc. (50%)', value: 50, fill: T.green },
  ];

  return (
    <div>
      <SectionHeader title="Grant Element Calculator" icon="📐" sub="OECD DAC NPV method — discount rate 10% (commercial benchmark)" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          {[
            { label: `Loan Amount ($M): $${loanAmt}M`, val: loanAmt, set: setLoanAmt, min: 1, max: 500, step: 5, color: T.navy },
            { label: `Interest Rate: ${rate}%`, val: rate, set: setRate, min: 0, max: 12, step: 0.5, color: T.teal },
            { label: `Grace Period: ${grace} yrs`, val: grace, set: setGrace, min: 0, max: 10, step: 1, color: T.purple },
            { label: `Maturity: ${maturity} yrs`, val: maturity, set: setMaturity, min: 5, max: 30, step: 1, color: T.amber },
          ].map(({ label, val, set, min, max, step, color }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 5 }}>
                <span>{label}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(+e.target.value)}
                style={{ width: '100%', accentColor: color, cursor: 'pointer' }} />
            </div>
          ))}
          <div style={{ background: geClass.color + '15', border: `1px solid ${geClass.color}40`, borderRadius: 10, padding: 16, marginTop: 8 }}>
            <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grant Element</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: geClass.color, fontFamily: T.mono }}>{ge.toFixed(1)}%</div>
            <div style={{ display: 'inline-block', background: geClass.color, color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700, marginTop: 4 }}>{geClass.label}</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textSec, marginBottom: 8, textTransform: 'uppercase' }}>Payment Schedule (PV)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={schedule} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="t" tick={{ fontSize: 9 }} label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 10 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip formatter={(v, n) => [`$${v}M`, n === 'payment' ? 'Nominal' : 'PV']} />
              <Bar dataKey="payment" name="payment" fill={T.navy + '60'} radius={[2,2,0,0]} />
              <Bar dataKey="pv" name="pv" fill={T.teal} radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textSec, marginTop: 16, marginBottom: 8, textTransform: 'uppercase' }}>GE vs Benchmarks</div>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={compData} layout="vertical" margin={{ left: 130, right: 20 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} unit="%" />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: T.textSec }} width={130} />
              <Tooltip formatter={v => [`${v.toFixed(1)}%`]} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {compData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ADDITIONALITY SCORER
   ═══════════════════════════════════════════════════════════════════ */
function AdditionalityScorer() {
  const FACTORS = [
    { key: 'marketFailure',       label: 'Market Failure Evidence',          weight: 15, desc: 'Documented gap between commercially viable supply and development-oriented demand' },
    { key: 'returnGap',           label: 'Return Gap / Viability',           weight: 15, desc: 'Quantified difference between required IRR and market clearing rate without public support' },
    { key: 'riskPremium',         label: 'Risk Premium Above Market',        weight: 12, desc: 'Excess risk premium demanded by commercial investors relative to project risk profile' },
    { key: 'policyAbsent',        label: 'Policy/Regulation Absent',         weight: 10, desc: 'Absence of enabling policy or regulatory framework preventing private investment' },
    { key: 'demonstrationEffect', label: 'Demonstration Effect',             weight: 10, desc: 'First-mover or replicability potential to catalyse follow-on private capital' },
    { key: 'sectorTrackRecord',   label: 'Sector Track Record',              weight: 8,  desc: 'DFI/UNDP prior engagement and credibility in the sector/country' },
    { key: 'devImpact',           label: 'Development Impact Quality',       weight: 15, desc: 'Depth, breadth, and sustainability of development outcomes delivered' },
    { key: 'dfiConvening',        label: 'DFI Convening Power',              weight: 7,  desc: 'Ability to convene diverse investor types and reduce transaction costs' },
    { key: 'concNecessity',       label: 'Concessionality Necessity',        weight: 8,  desc: 'Evidence that concessionality level is minimum needed to achieve viability' },
  ];

  const [scores, setScores] = useState({ marketFailure:6, returnGap:5, riskPremium:6, policyAbsent:4, demonstrationEffect:7, sectorTrackRecord:5, devImpact:8, dfiConvening:6, concNecessity:7 });
  const [selected, setSelected] = useState(null);

  const composite = FACTORS.reduce((s, f) => s + (scores[f.key] / 10) * f.weight, 0);
  const cls = composite > 70 ? { label: 'Strong Additionality', color: T.green } : composite >= 40 ? { label: 'Moderate Additionality', color: T.amber } : { label: 'Weak Additionality', color: T.red };
  const recommendation = composite > 70 ? 'Concessional support is clearly justified — proceed with full deployment.' : composite >= 40 ? 'Consider additional market failure evidence before deployment.' : 'Reassess whether public support is warranted — strengthen the case.';

  const radarData = FACTORS.map(f => ({ factor: f.label.split(' ').slice(0,2).join(' '), score: scores[f.key], fullMark: 10 }));

  return (
    <div>
      <SectionHeader title="Additionality Scorer" icon="➕" sub="9-factor OECD additionality framework — score each dimension 0–10" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          {FACTORS.map(f => (
            <div key={f.key} onClick={() => setSelected(f.key === selected ? null : f.key)}
              style={{ background: selected === f.key ? T.navy + '0a' : 'transparent', border: `1px solid ${selected === f.key ? T.navy + '40' : T.border}`, borderRadius: 8, padding: '10px 12px', marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{f.label}</span>
                <span style={{ fontSize: 12, fontWeight: 800, fontFamily: T.mono, color: T.teal }}>{scores[f.key]}/10 · w:{f.weight}</span>
              </div>
              {selected === f.key && <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6, lineHeight: 1.5 }}>{f.desc}</div>}
              <input type="range" min={0} max={10} step={1} value={scores[f.key]}
                onChange={e => setScores(p => ({ ...p, [f.key]: +e.target.value }))}
                onClick={ev => ev.stopPropagation()}
                style={{ width: '100%', accentColor: T.teal, cursor: 'pointer' }} />
            </div>
          ))}
        </div>
        <div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="factor" tick={{ fontSize: 9, fill: T.textSec }} />
              <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
              <Radar dataKey="score" stroke={T.teal} fill={T.teal} fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ background: cls.color + '15', border: `1px solid ${cls.color}40`, borderRadius: 10, padding: 16, marginTop: 8 }}>
            <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Composite Score</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: cls.color, fontFamily: T.mono }}>{composite.toFixed(1)}</div>
            <div style={{ display: 'inline-block', background: cls.color, color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{cls.label}</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 10, lineHeight: 1.5 }}>{recommendation}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCENARIO ANALYSIS
   ═══════════════════════════════════════════════════════════════════ */
function ScenarioAnalysis() {
  const [baseConcPct, setBaseConcPct] = useState(25);
  const [baseGrantPct, setBaseGrantPct] = useState(8);
  const [totalSize, setTotalSize] = useState(100);
  const [mktConfidence, setMktConfidence] = useState(50);

  const buildScenario = (concMult, commDelta, label, color) => {
    const conc = Math.min(80, baseConcPct * concMult);
    const grant = baseGrantPct;
    const comm = Math.max(0, 100 - conc - grant + commDelta);
    const pub = (conc + grant) / 100 * totalSize;
    const leverage = pub > 0 ? (comm / 100 * totalSize) / pub : 0;
    const mobilization = pub > 0 ? totalSize / pub : 0;
    return { label, color, conc: +conc.toFixed(1), grant, comm: +comm.toFixed(1), pub: +pub.toFixed(1), leverage: +leverage.toFixed(2), mobilization: +mobilization.toFixed(2) };
  };

  const confidence = mktConfidence / 100;
  const optWeight = Math.min(confidence * 2, 1);
  const stressWeight = Math.min((1 - confidence) * 2, 1);

  const optimistic = buildScenario(0.8,  8,  'Optimistic', T.green);
  const base       = buildScenario(1.0,  0,  'Base Case',  T.teal);
  const stressed   = buildScenario(1.3, -15, 'Stressed',   T.amber);

  const blendedLev = optimistic.leverage * optWeight * 0.33 + base.leverage * 0.34 + stressed.leverage * stressWeight * 0.33;

  const chartData = [
    { name: 'Leverage (x)',    Optimistic: optimistic.leverage, Base: base.leverage, Stressed: stressed.leverage },
    { name: 'Mobilization (x)',Optimistic: optimistic.mobilization, Base: base.mobilization, Stressed: stressed.mobilization },
    { name: 'Public Capital %',Optimistic: optimistic.conc + optimistic.grant, Base: base.conc + base.grant, Stressed: stressed.conc + stressed.grant },
  ];

  return (
    <div>
      <SectionHeader title="Scenario Analysis" icon="🔮" sub="3-scenario blended finance model — drag Market Confidence to morph between scenarios" />
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>
          <span>Market Confidence: <span style={{ fontFamily: T.mono, color: T.teal }}>{mktConfidence}%</span></span>
          <span style={{ color: T.textMut }}>0 = Stressed · 50 = Base · 100 = Optimistic</span>
        </div>
        <input type="range" min={0} max={100} value={mktConfidence} onChange={e => setMktConfidence(+e.target.value)}
          style={{ width: '100%', accentColor: T.teal, cursor: 'pointer' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        {[optimistic, base, stressed].map(sc => (
          <div key={sc.label} style={{ background: sc.color + '10', border: `2px solid ${sc.color}40`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: sc.color, marginBottom: 10 }}>{sc.label}</div>
            {[
              { l: 'Leverage', v: `${sc.leverage}x` },
              { l: 'Mobilization', v: `${sc.mobilization}x` },
              { l: 'Conc. Loan', v: `${sc.conc}%` },
              { l: 'Grant/TA', v: `${sc.grant}%` },
              { l: 'Commercial', v: `${sc.comm}%` },
              { l: 'Public Capital', v: `$${sc.pub}M` },
            ].map(r => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: `1px solid ${sc.color}20` }}>
                <span style={{ color: T.textSec }}>{r.l}</span>
                <span style={{ fontWeight: 700, fontFamily: T.mono, color: sc.color }}>{r.v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textSec, marginBottom: 8, textTransform: 'uppercase' }}>Scenario Comparison</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ left: 0, bottom: 20, top: 5, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-20} textAnchor="end" />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Optimistic" fill={T.green} radius={[3,3,0,0]} />
              <Bar dataKey="Base" fill={T.teal} radius={[3,3,0,0]} />
              <Bar dataKey="Stressed" fill={T.amber} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec, marginBottom: 10 }}>Also adjust inputs:</div>
            {[
              { label: `Concessional Loan: ${baseConcPct}%`, val: baseConcPct, set: setBaseConcPct, min: 0, max: 80, color: T.teal },
              { label: `Grant / TA: ${baseGrantPct}%`, val: baseGrantPct, set: setBaseGrantPct, min: 0, max: 40, color: T.purple },
              { label: `Total Size: $${totalSize}M`, val: totalSize, set: setTotalSize, min: 10, max: 1000, step: 10, color: T.navy },
            ].map(({ label, val, set, min, max, step, color }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{label}</div>
                <input type="range" min={min} max={max} step={step || 1} value={val} onChange={e => set(+e.target.value)}
                  style={{ width: '100%', accentColor: color, cursor: 'pointer' }} />
              </div>
            ))}
          </div>
          <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Confidence-Weighted Leverage</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.navy, fontFamily: T.mono }}>{blendedLev.toFixed(2)}x</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CAPITAL STACK OPTIMIZER
   ═══════════════════════════════════════════════════════════════════ */
function CapitalStackOptimizer() {
  const [targetLeverage, setTargetLeverage] = useState(3.0);
  const [sector, setSector] = useState('Renewable Energy');
  const [totalSize, setTotalSize] = useState(100);
  const [maxGrant, setMaxGrant] = useState(20);

  const SECTOR_OPTS = ['Renewable Energy','Infrastructure','MSME Finance','Agriculture','Climate Adaptation','Healthcare','NBS/Forestry'];

  const result = useMemo(() => {
    let lo = 0, hi = 80, optConc = null;
    for (let iter = 0; iter < 50; iter++) {
      const mid = (lo + hi) / 2;
      const pub = (mid + maxGrant) / 100;
      const comm = Math.max(0, 1 - pub);
      const lev = pub > 0 ? comm / pub : 0;
      if (lev >= targetLeverage) { optConc = mid; hi = mid; }
      else lo = mid;
      if (hi - lo < 0.01) break;
    }
    if (optConc === null) return { achievable: false };
    const pub = (optConc + maxGrant) / 100 * totalSize;
    const comm = totalSize - pub;
    const lev = pub > 0 ? comm / pub : 0;
    return { achievable: true, optConc: +optConc.toFixed(1), pub: +pub.toFixed(1), comm: +comm.toFixed(1), lev: +lev.toFixed(2) };
  }, [targetLeverage, maxGrant, totalSize]);

  const lineData = useMemo(() => {
    return Array.from({ length: 61 }, (_, i) => {
      const conc = i;
      const pub = (conc + maxGrant) / 100;
      const comm = Math.max(0, 1 - pub);
      return { conc, lev: pub > 0 ? +(comm / pub).toFixed(2) : 0 };
    });
  }, [maxGrant]);

  return (
    <div>
      <SectionHeader title="Capital Stack Optimizer" icon="⚙️" sub="Binary search for minimum concessionality to achieve target leverage (minimum concessionality principle)" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 5 }}>Sector</label>
            <select value={sector} onChange={e => setSector(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, background: '#fff' }}>
              {SECTOR_OPTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {[
            { label: `Target Leverage: ${targetLeverage}x`, val: targetLeverage, set: setTargetLeverage, min: 0.5, max: 8, step: 0.1, color: T.navy },
            { label: `Total Deal Size: $${totalSize}M`, val: totalSize, set: setTotalSize, min: 10, max: 1000, step: 10, color: T.teal },
            { label: `Max Grant/TA: ${maxGrant}%`, val: maxGrant, set: setMaxGrant, min: 0, max: 40, step: 1, color: T.purple },
          ].map(({ label, val, set, min, max, step, color }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 5 }}>{label}</div>
              <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(+e.target.value)}
                style={{ width: '100%', accentColor: color, cursor: 'pointer' }} />
            </div>
          ))}
          {result.achievable ? (
            <div style={{ background: T.green + '12', border: `1px solid ${T.green}40`, borderRadius: 10, padding: 16, marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.green, marginBottom: 8 }}>✓ Optimal Structure Found</div>
              {[
                { l: 'Min. Concessionality', v: `${result.optConc}%` },
                { l: 'Public Capital', v: `$${result.pub}M (${(result.pub / totalSize * 100).toFixed(1)}%)` },
                { l: 'Commercial Capital', v: `$${result.comm}M` },
                { l: 'Achieved Leverage', v: `${result.lev}x` },
              ].map(r => (
                <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: `1px solid ${T.green}20` }}>
                  <span style={{ color: T.textSec }}>{r.l}</span>
                  <span style={{ fontWeight: 700, fontFamily: T.mono, color: T.navy }}>{r.v}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: T.red + '12', border: `1px solid ${T.red}40`, borderRadius: 10, padding: 16, marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.red }}>⚠ Target leverage not achievable</div>
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 6 }}>Consider increasing deal size or reducing target leverage.</div>
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textSec, marginBottom: 8, textTransform: 'uppercase' }}>Leverage vs Concessionality Curve</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="conc" tick={{ fontSize: 9 }} label={{ value: 'Concessionality %', position: 'insideBottom', offset: -10, fontSize: 10 }} />
              <YAxis tick={{ fontSize: 9 }} label={{ value: 'Leverage (x)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v}x`, 'Leverage']} labelFormatter={l => `Conc: ${l}%`} />
              <Line dataKey="lev" stroke={T.teal} strokeWidth={2} dot={false} />
              {result.achievable && (
                <Line data={[{ conc: 0, lev: targetLeverage }, { conc: 80, lev: targetLeverage }]}
                  dataKey="lev" stroke={T.amber} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
          {result.achievable && (
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 8, textAlign: 'center' }}>
              Dashed line = target {targetLeverage}x · Optimal concessionality: <strong style={{ color: T.teal }}>{result.optConc}%</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LEVERAGE CALCULATOR
   ═══════════════════════════════════════════════════════════════════ */
function LeverageCalculator() {
  const [totalSize, setTotalSize] = useState(100);
  const [concPct, setConcPct] = useState(25);
  const [grantPct, setGrantPct] = useState(8);
  const [guaranteePct, setGuaranteePct] = useState(10);
  const [sector, setSector] = useState('Renewable Energy');

  const publicInput = (concPct + grantPct) / 100 * totalSize;
  const guaranteeExposure = guaranteePct / 100 * totalSize;
  const commercialCapital = totalSize - publicInput;
  const leverageRatio = publicInput > 0 ? (commercialCapital / publicInput) : 0;
  const blendingRatio = publicInput / totalSize;
  const mobilizationRatio = totalSize / Math.max(publicInput, 1);
  const minConcessionality = Math.max(0, publicInput - (totalSize * 0.05));

  const stackData = [
    { name: 'Grants', value: grantPct, color: '#7c3aed' },
    { name: 'Concessional Debt', value: concPct, color: '#0d7377' },
    { name: 'Guarantees', value: guaranteePct, color: '#d97706' },
    { name: 'Commercial Capital', value: Math.max(0, 100 - concPct - grantPct - guaranteePct), color: '#1b3a5c' },
  ];

  const sectorBenchmarks = {
    'Renewable Energy': { leverage: 3.5, concMin: 15, concMax: 30 },
    'Infrastructure': { leverage: 2.8, concMin: 20, concMax: 40 },
    'MSME Finance': { leverage: 2.0, concMin: 25, concMax: 50 },
    'Agriculture': { leverage: 1.8, concMin: 30, concMax: 55 },
    'Climate Adaptation': { leverage: 1.5, concMin: 35, concMax: 60 },
    'Healthcare': { leverage: 1.6, concMin: 30, concMax: 55 },
    'NBS/Forestry': { leverage: 1.2, concMin: 40, concMax: 70 },
  };
  const bench = sectorBenchmarks[sector] || sectorBenchmarks['Infrastructure'];
  const leverageOk = leverageRatio >= bench.leverage;
  const concOk = concPct >= bench.concMin && concPct <= bench.concMax;

  const CALC_TABS = [
    { id: 'leverage',      label: '⚖️ Leverage & Blending' },
    { id: 'grant',         label: '📐 Grant Element' },
    { id: 'additionality', label: '➕ Additionality' },
    { id: 'scenarios',     label: '🔮 Scenarios' },
    { id: 'optimizer',     label: '⚙️ Optimizer' },
  ];
  const [calcTab, setCalcTab] = useState('leverage');

  return (
    <Card>
      <SectionHeader title="Calculators" icon="⚖️" sub="UNDP Minimum Concessionality Principle — leverage, grant element, additionality, scenario analysis, optimizer" />
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {CALC_TABS.map(ct => (
          <button key={ct.id} onClick={() => setCalcTab(ct.id)}
            style={{ padding: '7px 14px', borderRadius: 6, border: `1px solid ${calcTab === ct.id ? T.navy : T.border}`, background: calcTab === ct.id ? T.navy : '#fff', color: calcTab === ct.id ? '#fff' : T.textSec, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {ct.label}
          </button>
        ))}
      </div>
      {calcTab === 'grant' && <GrantElementCalc />}
      {calcTab === 'additionality' && <AdditionalityScorer />}
      {calcTab === 'scenarios' && <ScenarioAnalysis />}
      {calcTab === 'optimizer' && <CapitalStackOptimizer />}
      {calcTab === 'leverage' && <div>
      <SectionHeader title="Leverage & Blending Calculator" icon="⚖️" sub="UNDP Minimum Concessionality Principle — deploy only what is needed to crowd in private capital" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Inputs */}
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 6 }}>Sector</label>
            <select value={sector} onChange={e => setSector(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, background: '#fff', color: T.text }}>
              {Object.keys(sectorBenchmarks).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {[
            { label: 'Total Transaction Size ($M)', val: totalSize, set: setTotalSize, min: 1, max: 2000, step: 5, color: T.navy },
            { label: 'Concessional Loan (%)', val: concPct, set: setConcPct, min: 0, max: 80, step: 1, color: T.teal },
            { label: 'Grants / TA (%)', val: grantPct, set: setGrantPct, min: 0, max: 40, step: 1, color: T.purple },
            { label: 'Guarantees (%)', val: guaranteePct, set: setGuaranteePct, min: 0, max: 30, step: 1, color: T.amber },
          ].map(({ label, val, set, min, max, step, color }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ fontWeight: 600, color: T.text }}>{label}</span>
                <span style={{ fontWeight: 700, color }}>{label.includes('$M') ? `$${val}M` : `${val}%`}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(+e.target.value)}
                style={{ width: '100%', accentColor: color, cursor: 'pointer' }} />
            </div>
          ))}

          {/* Capital stack bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Capital Stack</div>
            <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden', border: `1px solid ${T.border}` }}>
              {stackData.filter(d => d.value > 0).map(d => (
                <div key={d.name} title={`${d.name}: ${d.value}%`} style={{ width: `${d.value}%`, background: d.color, transition: 'width 0.3s' }} />
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {stackData.filter(d => d.value > 0).map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                  <span style={{ color: T.textSec }}>{d.name}: {d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ background: leverageOk ? '#dcfce7' : '#fef3c7', border: `1px solid ${leverageOk ? '#16a34a' : '#d97706'}40`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leverage Ratio</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: leverageOk ? T.green : T.amber }}>{leverageRatio.toFixed(1)}x</div>
              <div style={{ fontSize: 11, color: T.textSec }}>Benchmark: ≥{bench.leverage}x for {sector}</div>
            </div>
            <div style={{ background: '#dbeafe', border: '1px solid #3b82f640', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobilization Ratio</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: T.navyL }}>{mobilizationRatio.toFixed(1)}x</div>
              <div style={{ fontSize: 11, color: T.textSec }}>Total capital per $1 public</div>
            </div>
            <div style={{ background: '#f3e8ff', border: '1px solid #7c3aed40', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Blending Ratio</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: T.purple }}>{(blendingRatio * 100).toFixed(1)}%</div>
              <div style={{ fontSize: 11, color: T.textSec }}>Public capital share of total</div>
            </div>
            <div style={{ background: '#ccfbf1', border: '1px solid #0d737740', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Public Capital ($M)</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: T.teal }}>${publicInput.toFixed(1)}M</div>
              <div style={{ fontSize: 11, color: T.textSec }}>Conc. + Grant deployed</div>
            </div>
          </div>

          {/* Minimum concessionality check */}
          <div style={{ background: concOk ? '#f0fdf4' : '#fff7ed', border: `1px solid ${concOk ? '#16a34a' : '#d97706'}30`, borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: concOk ? T.green : T.amber, marginBottom: 6 }}>
              {concOk ? '✓ Minimum Concessionality Principle Met' : '⚠ Review Concessionality Level'}
            </div>
            <div style={{ fontSize: 12, color: T.textSec }}>
              {sector} benchmark: {bench.concMin}–{bench.concMax}% concessional. Current: {concPct}%.
              {!concOk && concPct < bench.concMin && ' Consider increasing concessional allocation.'}
              {!concOk && concPct > bench.concMax && ' High concessionality may distort the market.'}
            </div>
          </div>

          {/* Transaction breakdown */}
          <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaction Breakdown</div>
            {[
              { label: 'Total Transaction', value: `$${totalSize}M`, color: T.navy },
              { label: 'Commercial Capital Mobilized', value: `$${commercialCapital.toFixed(1)}M`, color: T.navyL },
              { label: 'Concessional Loan', value: `$${(concPct / 100 * totalSize).toFixed(1)}M`, color: T.teal },
              { label: 'Grants / Technical Assistance', value: `$${(grantPct / 100 * totalSize).toFixed(1)}M`, color: T.purple },
              { label: 'Guarantee Exposure', value: `$${guaranteeExposure.toFixed(1)}M`, color: T.amber },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                <span style={{ color: T.textSec }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: r.color, fontFamily: T.mono }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PILLAR ASSESSMENT
   ═══════════════════════════════════════════════════════════════════ */
function PillarAssessment() {
  const [scores, setScores] = useState({ 1: 2, 2: 2, 3: 1, 4: 2, 5: 1, 6: 1 });
  const [selectedPillar, setSelectedPillar] = useState(1);
  const [country, setCountry] = useState('Indonesia');

  const radarData = PILLARS.map(p => ({
    pillar: `P${p.id}`,
    score: scores[p.id] || 0,
    fullMark: 4,
  }));

  const totalScore = Object.values(scores).reduce((s, v) => s + v, 0);
  const maxScore = PILLARS.length * 4;
  const maturityPct = (totalScore / maxScore) * 100;
  const overallMaturity = maturityPct < 25 ? 'Ad Hoc' : maturityPct < 50 ? 'Developing' : maturityPct < 75 ? 'Established' : 'Advanced';
  const maturityColor = maturityPct < 25 ? T.red : maturityPct < 50 ? T.amber : maturityPct < 75 ? T.teal : T.green;

  const pillar = PILLARS.find(p => p.id === selectedPillar);

  return (
    <Card>
      <SectionHeader title="6-Pillar Maturity Assessment" icon="📊" sub="Score each pillar 0–4 to assess country/platform readiness for blended finance at scale" />

      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec }}>Country / Platform:</div>
        <input value={country} onChange={e => setCountry(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, width: 200 }} />
        <div style={{ marginLeft: 'auto', background: maturityColor + '18', border: `1px solid ${maturityColor}40`, borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 700, color: maturityColor }}>
          {overallMaturity} — {maturityPct.toFixed(0)}%
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Scoring sliders */}
        <div>
          {PILLARS.map(p => (
            <div key={p.id}
              onClick={() => setSelectedPillar(p.id)}
              style={{ background: selectedPillar === p.id ? p.lightColor : T.surfaceAlt, border: `1px solid ${selectedPillar === p.id ? p.color : T.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 10, cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>{p.icon}</span>
                <div style={{ fontSize: 12, fontWeight: 700, color: p.color, flex: 1 }}>Pillar {p.id}: {p.title.split(' ').slice(0, 4).join(' ')}…</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: p.color, fontFamily: T.mono }}>{scores[p.id]}/4</div>
              </div>
              <input type="range" min={0} max={4} step={1} value={scores[p.id]}
                onChange={e => setScores(prev => ({ ...prev, [p.id]: +e.target.value }))}
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', accentColor: p.color, cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMut, marginTop: 2 }}>
                {p.maturityLevels.map((m, i) => <span key={i}>{m}</span>)}
              </div>
            </div>
          ))}
        </div>

        {/* Radar + pillar detail */}
        <div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="pillar" tick={{ fontSize: 12, fill: T.textSec, fontFamily: T.mono, fontWeight: 700 }} />
              <PolarRadiusAxis domain={[0, 4]} tick={false} axisLine={false} />
              <Radar name={country} dataKey="score" stroke={T.teal} fill={T.teal} fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>

          {pillar && (
            <div style={{ background: pillar.lightColor, border: `1px solid ${pillar.color}30`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: pillar.color, marginBottom: 8 }}>{pillar.icon} Pillar {pillar.id}: {pillar.title}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{pillar.subtitle}</div>
              {pillar.subsections.map(s => (
                <div key={s.id} style={{ marginBottom: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.6)', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: pillar.color, marginBottom: 2 }}>{s.id} {s.title}</div>
                  <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>{s.description}</div>
                </div>
              ))}
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Indicators</div>
                {pillar.indicators.map(ind => (
                  <div key={ind} style={{ fontSize: 11, color: T.textSec, padding: '3px 0', borderBottom: `1px solid ${pillar.color}20` }}>› {ind}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   INSTRUMENTS LIBRARY
   ═══════════════════════════════════════════════════════════════════ */
function InstrumentsLibrary() {
  const [selected, setSelected] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', ...new Set(INSTRUMENTS.map(i => i.category))];
  const filtered = categoryFilter === 'All' ? INSTRUMENTS : INSTRUMENTS.filter(i => i.category === categoryFilter);

  const leverageData = INSTRUMENTS.map(i => ({ name: i.name.split(' ').slice(0, 2).join(' '), leverage: i.leverage, category: i.category }));
  const catColors = { Debt: T.navy, Grant: T.purple, Guarantee: T.amber, Equity: T.teal, Bond: T.sage, 'FX Risk': T.gold, 'Revenue Guarantee': T.green };

  return (
    <Card>
      <SectionHeader title="UNDP Blended Finance Instruments" icon="🛠️" sub="10 instrument archetypes mapped to pillars, risk profiles, and leverage benchmarks" />

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${categoryFilter === c ? T.navy : T.border}`, background: categoryFilter === c ? T.navy : '#fff', color: categoryFilter === c ? '#fff' : T.textSec, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Instrument cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(inst => {
            const col = catColors[inst.category] || T.navy;
            const isSelected = selected?.id === inst.id;
            return (
              <div key={inst.id} onClick={() => setSelected(isSelected ? null : inst)}
                style={{ background: isSelected ? col + '10' : T.surfaceAlt, border: `1px solid ${isSelected ? col : T.border}`, borderRadius: 8, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, background: col + '20', color: col, padding: '1px 7px', borderRadius: 10 }}>{inst.category}</span>
                      <span style={{ fontSize: 11, color: T.textMut }}>Pillar {inst.pillar}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{inst.name}</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{inst.description.substring(0, 80)}…</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: col, fontFamily: T.mono }}>{inst.leverage}x</div>
                    <div style={{ fontSize: 10, color: T.textMut }}>leverage</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail + chart */}
        <div>
          {selected ? (
            <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 10 }}>{selected.name}</div>
              {[
                ['Category', selected.category],
                ['Framework Pillar', `Pillar ${selected.pillar}`],
                ['Risk Profile', selected.risk],
                ['Cost', selected.cost],
                ['Typical Providers', selected.provider],
                ['Leverage Benchmark', `${selected.leverage}x`],
                ['Concessionality', selected.concessionality],
                ['Primary Use Case', selected.useCase],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span style={{ color: T.textSec, minWidth: 130 }}>{k}</span>
                  <span style={{ fontWeight: 600, color: T.navy }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 10, fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>{selected.description}</div>
            </div>
          ) : (
            <div style={{ marginBottom: 16, padding: 16, background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, color: T.textSec }}>← Select an instrument to view details</div>
            </div>
          )}

          <div style={{ fontSize: 12, fontWeight: 700, color: T.textSec, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leverage Benchmarks by Instrument</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={leverageData} layout="vertical" margin={{ left: 80, right: 20, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 7]} unit="x" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} width={80} />
              <Tooltip formatter={(v) => [`${v}x`, 'Leverage']} />
              <Bar dataKey="leverage" radius={[0, 4, 4, 0]}>
                {leverageData.map((entry, i) => (
                  <Cell key={i} fill={catColors[entry.category] || T.navy} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MARKET INTELLIGENCE
   ═══════════════════════════════════════════════════════════════════ */
function MarketIntelligence() {
  const [view, setView] = useState('map');

  const totalTx = MARKETS.reduce((s, m) => s + m.transactions, 0);
  const totalVol = MARKETS.reduce((s, m) => s + m.financing, 0);
  const avgLev = MARKETS.reduce((s, m) => s + m.avgLeverage, 0) / MARKETS.length;

  const barData = [...MARKETS].sort((a, b) => b.financing - a.financing).slice(0, 10).map(m => ({
    name: m.country,
    financing: m.financing,
    transactions: m.transactions,
  }));

  const providerData = PROVIDERS.map(p => ({ name: p.name, commitments: p.commitments, volume: p.volume, type: p.type }));
  const typeColors = { MDB: T.navy, DFI: T.teal, Bilateral: T.amber, Facility: T.purple, 'Climate Fund': T.green };

  return (
    <Card>
      <SectionHeader title="Market Intelligence Dashboard" icon="🌏" sub="Convergence Blended Finance Database — South & Southeast Asia 2016–2024 (345 transactions, ~$56B)" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <KPI label="Total Transactions" value={totalTx} sub="South & SE Asia 2016-24" icon="📋" />
        <KPI label="Aggregate Financing" value={`$${totalVol.toFixed(0)}B`} sub="Combined deal volume" color={T.teal} icon="💵" />
        <KPI label="Avg Leverage Ratio" value={`${avgLev.toFixed(1)}x`} sub="Private per $1 public" color={T.green} icon="⚖️" />
        <KPI label="Top Market" value="India" sub="85 deals · $11.8B" color={T.amber} icon="🏆" />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['Markets', 'Providers', 'Trends', 'Sectors'].map(v => (
          <button key={v} onClick={() => setView(v.toLowerCase())}
            style={{ padding: '7px 16px', borderRadius: 6, border: `1px solid ${view === v.toLowerCase() ? T.navy : T.border}`, background: view === v.toLowerCase() ? T.navy : '#fff', color: view === v.toLowerCase() ? '#fff' : T.textSec, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {v}
          </button>
        ))}
      </div>

      {view === 'markets' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ left: 0, bottom: 30, top: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} unit="B" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [n === 'financing' ? `$${v}B` : v, n === 'financing' ? 'Volume' : 'Transactions']} />
                <Bar yAxisId="left" dataKey="financing" name="financing" fill={T.teal} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="transactions" name="transactions" fill={T.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 290 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surfaceAlt }}>
                  {['Country', 'Region', 'Deals', 'Volume', 'Avg Lev', 'Top Sector'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MARKETS.map((m, i) => (
                  <tr key={m.country} style={{ background: i % 2 === 0 ? '#fff' : T.surfaceAlt }}>
                    <td style={{ padding: '7px 10px', fontWeight: 700, color: T.navy }}>{m.country}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{m.region}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.mono, color: T.text }}>{m.transactions}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.mono, color: T.teal, fontWeight: 700 }}>${m.financing}B</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.mono, color: T.green, fontWeight: 700 }}>{m.avgLeverage}x</td>
                    <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{m.topSector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'providers' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={providerData} layout="vertical" margin={{ left: 100, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} width={100} />
              <Tooltip />
              <Bar dataKey="commitments" name="Commitments" radius={[0, 4, 4, 0]}>
                {providerData.map((p, i) => <Cell key={i} fill={typeColors[p.type] || T.navy} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ overflowY: 'auto', maxHeight: 280 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surfaceAlt }}>
                  {['Provider', 'Type', 'Commits', 'Volume ($B)', 'Regions'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROVIDERS.map((p, i) => (
                  <tr key={p.name} style={{ background: i % 2 === 0 ? '#fff' : T.surfaceAlt }}>
                    <td style={{ padding: '7px 10px', fontWeight: 700, color: T.navy }}>{p.name}</td>
                    <td style={{ padding: '7px 10px' }}><Pill label={p.type} color={typeColors[p.type] || T.navy} /></td>
                    <td style={{ padding: '7px 10px', fontFamily: T.mono }}>{p.commitments}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.mono, color: T.teal, fontWeight: 700 }}>${p.volume}B</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, color: T.textSec }}>{p.regions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'trends' && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textSec, marginBottom: 12, textTransform: 'uppercase' }}>Annual Deal Volume & Transaction Count (2016–2024)</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={YEAR_DEAL_DATA} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: 'Volume ($B)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} label={{ value: '# Deals', angle: 90, position: 'insideRight', fontSize: 10 }} />
              <Tooltip formatter={(v, n) => [n === 'volume' ? `$${v}B` : n === 'avgLeverage' ? `${v}x` : v, n === 'volume' ? 'Volume' : n === 'deals' ? 'Deals' : 'Avg Leverage']} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="left" type="monotone" dataKey="volume" stroke={T.teal} strokeWidth={2} dot={{ r: 4 }} name="volume" />
              <Line yAxisId="right" type="monotone" dataKey="deals" stroke={T.amber} strokeWidth={2} dot={{ r: 4 }} name="deals" />
              <Line yAxisId="left" type="monotone" dataKey="avgLeverage" stroke={T.purple} strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="avgLeverage" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16 }}>
            <KPI label="Peak Volume Year" value="2022" sub="$9.8B · 52 deals" color={T.teal} />
            <KPI label="Peak Leverage Year" value="2022" sub="3.4x avg" color={T.green} />
            <KPI label="COVID-19 Impact" value="2020" sub="31 deals · -$3.8B YoY drop" color={T.amber} />
          </div>
        </div>
      )}

      {view === 'sectors' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.textSec, marginBottom: 8, textTransform: 'uppercase' }}>Deal Volume by Sector ($B)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={SECTOR_DEAL_DATA} layout="vertical" margin={{ left: 130, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 9 }} unit="B" />
                <YAxis type="category" dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} width={130} />
                <Tooltip formatter={v => [`$${v}B`]} />
                <Bar dataKey="volume" fill={T.teal} radius={[0, 4, 4, 0]}>
                  {SECTOR_DEAL_DATA.map((_, i) => <Cell key={i} fill={[T.teal, T.navy, T.amber, T.sage, T.purple, T.green, T.red, T.gold][i % 8]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 280 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surfaceAlt }}>
                  {['Sector', 'Deals', 'Volume ($B)', 'Avg Lev', 'Avg Conc%'].map(h => (
                    <th key={h} style={{ padding: '7px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTOR_DEAL_DATA.map((s, i) => (
                  <tr key={s.sector} style={{ background: i % 2 === 0 ? '#fff' : T.surfaceAlt }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600, color: T.navy, fontSize: 11 }}>{s.sector}</td>
                    <td style={{ padding: '6px 8px', fontFamily: T.mono }}>{s.deals}</td>
                    <td style={{ padding: '6px 8px', fontFamily: T.mono, color: T.teal, fontWeight: 700 }}>${s.volume}B</td>
                    <td style={{ padding: '6px 8px', fontFamily: T.mono, color: T.green, fontWeight: 700 }}>{s.avgLev}x</td>
                    <td style={{ padding: '6px 8px', fontFamily: T.mono }}>{s.avgConc}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   VEHICLE STRUCTURES
   ═══════════════════════════════════════════════════════════════════ */
function VehicleStructures() {
  const [selected, setSelected] = useState(null);

  const quadrantLabels = {
    Q1: { label: 'Q1: Donor/Funder-Led · Single Country', color: T.purple },
    Q2: { label: 'Q2: Local DFI-Led', color: T.teal },
    Q3: { label: 'Q3: Donor/Public-Led · Regional/Global', color: T.amber },
    Q4: { label: 'Q4: Private Sector-Led', color: T.green },
  };

  return (
    <Card>
      <SectionHeader title="Blended Finance Vehicle Archetypes" icon="🏗️" sub="Platform quadrant model — categorized by leadership structure and geographic scope" />

      {/* Quadrant grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
          const qv = VEHICLES.filter(v => v.quadrant === q);
          const qInfo = quadrantLabels[q];
          return (
            <div key={q} style={{ background: T.surfaceAlt, border: `1px solid ${qInfo.color}30`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: qInfo.color, marginBottom: 10, borderBottom: `2px solid ${qInfo.color}30`, paddingBottom: 6 }}>{qInfo.label}</div>
              {qv.length === 0 ? <div style={{ fontSize: 12, color: T.textMut }}>—</div> : qv.map(v => (
                <div key={v.id} onClick={() => setSelected(selected?.id === v.id ? null : v)}
                  style={{ background: selected?.id === v.id ? qInfo.color + '15' : '#fff', border: `1px solid ${selected?.id === v.id ? qInfo.color : T.border}`, borderRadius: 7, padding: '10px 12px', marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 2 }}>{v.name}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{v.country} · {v.size}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: qInfo.color, fontWeight: 700, fontFamily: T.mono }}>{v.leverage}x leverage</span>
                    <Pill label={v.type} color={qInfo.color} />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 10 }}>{selected.name}</div>
              {[
                ['Type', selected.type],
                ['Geography', selected.country],
                ['Size', selected.size],
                ['Implementing Entity', selected.implementing],
                ['Government Anchor', selected.ministry],
                ['Focus', selected.focus],
                ['Avg Leverage', `${selected.leverage}x`],
                ['Quadrant', selected.quadrant],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span style={{ color: T.textSec, minWidth: 130 }}>{k}</span>
                  <span style={{ fontWeight: 600, color: T.navy }}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.textSec, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instruments Used</div>
              {selected.instruments.map(inst => (
                <div key={inst} style={{ padding: '6px 10px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 6, marginBottom: 6, fontSize: 12, color: T.navy, fontWeight: 600 }}>✓ {inst}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   IMPACT MEASUREMENT (IRIS+ / IMM / Theory of Change)
   ═══════════════════════════════════════════════════════════════════ */
function ImpactMeasurement() {
  const [sector, setSector] = useState('Renewable Energy');
  const [txSize, setTxSize] = useState(100);

  const impactModels = {
    'Renewable Energy': {
      sdgs: [7, 13], color: T.teal,
      outputs: [
        { label: 'MW Capacity Installed', formula: (s) => (s * 1.2).toFixed(0), unit: 'MW' },
        { label: 'Households Electrified', formula: (s) => (s * 2200).toLocaleString(), unit: 'HH' },
        { label: 'Jobs Created (Construction)', formula: (s) => (s * 18).toFixed(0), unit: 'FTEs' },
      ],
      outcomes: [
        { label: 'GHG Emissions Avoided', formula: (s) => (s * 0.85).toFixed(1) + 'K', unit: 'tCO2e/yr' },
        { label: 'Energy Cost Reduction', formula: (s) => (s * 2.1).toFixed(1) + '%', unit: 'avg' },
        { label: 'Local Energy Security', formula: () => 'Improved', unit: '' },
      ],
      iris: ['PI9922 — Energy generated', 'PI5765 — GHG emissions avoided', 'OI7292 — Jobs created'],
    },
    'MSME Finance': {
      sdgs: [1, 8, 10], color: T.amber,
      outputs: [
        { label: 'MSMEs Financed', formula: (s) => (s * 45).toFixed(0), unit: 'enterprises' },
        { label: 'Avg Loan Size', formula: (s) => `$${(s / 0.45 / (s * 45) * 1000000).toFixed(0)}`, unit: '$' },
        { label: 'Women-Led Enterprises', formula: (s) => (s * 18).toFixed(0), unit: 'enterprises' },
      ],
      outcomes: [
        { label: 'Jobs Sustained', formula: (s) => (s * 320).toLocaleString(), unit: 'jobs' },
        { label: 'Revenue Uplift', formula: (s) => (s * 1.6).toFixed(1) + '%', unit: 'avg' },
        { label: 'Financial Inclusion Gain', formula: () => 'Expanded', unit: '' },
      ],
      iris: ['PI4720 — Number of enterprises', 'OI4066 — Jobs sustained', 'PI6712 — Women clients served'],
    },
    'Climate Adaptation': {
      sdgs: [11, 13], color: T.purple,
      outputs: [
        { label: 'People Protected', formula: (s) => (s * 8500).toLocaleString(), unit: 'persons' },
        { label: 'Infrastructure Resilience Index', formula: () => '+0.4', unit: 'pts' },
        { label: 'Climate-Resilient Assets', formula: (s) => (s * 3.2).toFixed(0), unit: 'assets' },
      ],
      outcomes: [
        { label: 'Economic Losses Avoided', formula: (s) => `$${(s * 2.8).toFixed(0)}M`, unit: 'annually' },
        { label: 'Disaster Recovery Time', formula: () => '-35%', unit: 'reduction' },
        { label: 'Community Resilience', formula: () => 'Enhanced', unit: '' },
      ],
      iris: ['OI5967 — Disaster risk reduction', 'PI2738 — People benefiting', 'OI3342 — Adaptation finance mobilized'],
    },
    'Agriculture': {
      sdgs: [2, 8], color: T.sage,
      outputs: [
        { label: 'Smallholder Farmers Reached', formula: (s) => (s * 620).toLocaleString(), unit: 'farmers' },
        { label: 'Agricultural Land (Ha)', formula: (s) => (s * 1800).toLocaleString(), unit: 'hectares' },
        { label: 'Value Chain Actors Supported', formula: (s) => (s * 85).toFixed(0), unit: 'actors' },
      ],
      outcomes: [
        { label: 'Crop Yield Increase', formula: () => '+22%', unit: 'avg' },
        { label: 'Farmer Income Growth', formula: () => '+18%', unit: 'avg' },
        { label: 'Food Security', formula: () => 'Improved', unit: '' },
      ],
      iris: ['PI7775 — Agricultural producers served', 'OI5775 — Improved crop yield', 'PI2384 — Women farmers served'],
    },
  };

  const model = impactModels[sector] || impactModels['Renewable Energy'];

  const tocSteps = [
    { label: 'INPUTS', items: [`$${txSize}M concessional capital`, 'Technical assistance grants', 'DFI risk sharing', 'Guarantee facility'] },
    { label: 'ACTIVITIES', items: ['Project screening & due diligence', 'Financing provision', 'Technical support', 'Performance monitoring'] },
    { label: 'OUTPUTS', items: model.outputs.map(o => `${o.label}: ${o.formula(txSize)} ${o.unit}`) },
    { label: 'OUTCOMES', items: model.outcomes.map(o => `${o.label}: ${o.formula(txSize)} ${o.unit}`) },
    { label: 'IMPACT', items: model.sdgs.map(s => `SDG ${s}`).concat(['Climate goal contribution', 'Systemic market change']) },
  ];
  const tocColors = [T.purple, T.teal, T.amber, T.green, T.navy];

  return (
    <Card>
      <SectionHeader title="Impact Measurement & Management (IMM)" icon="📏" sub="IRIS+ aligned — Theory of Change per sector, UNDP-ISO joint framework, SDG outcome mapping" />

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 5 }}>Sector</label>
          <select value={sector} onChange={e => setSector(e.target.value)} style={{ padding: '7px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, background: '#fff' }}>
            {Object.keys(impactModels).map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec, marginBottom: 5 }}>Transaction Size: ${txSize}M</div>
          <input type="range" min={10} max={500} step={10} value={txSize} onChange={e => setTxSize(+e.target.value)}
            style={{ width: 200, accentColor: model.color, cursor: 'pointer' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          {model.sdgs.map(s => (
            <div key={s} style={{ width: 32, height: 32, borderRadius: 6, background: SDG_COLORS_MAP[s], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', title: `SDG ${s}` }}>
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Theory of Change */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, overflowX: 'auto' }}>
        {tocSteps.map((step, i) => (
          <div key={step.label} style={{ flex: 1, minWidth: 140 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1, background: tocColors[i], borderRadius: i === 0 ? '8px 0 0 8px' : i === 4 ? '0 8px 8px 0' : 0, padding: '8px 10px', minHeight: 32 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em' }}>{step.label}</div>
              </div>
              {i < 4 && <div style={{ width: 20, height: 0, border: 'none', borderTop: `12px solid transparent`, borderBottom: `12px solid transparent`, borderLeft: `12px solid ${tocColors[i]}`, flexShrink: 0 }} />}
            </div>
            <div style={{ padding: '10px 8px', background: tocColors[i] + '10', border: `1px solid ${tocColors[i]}25`, marginTop: 4, borderRadius: 6, minHeight: 100 }}>
              {step.items.map(item => (
                <div key={item} style={{ fontSize: 11, color: T.text, padding: '3px 0', borderBottom: `1px solid ${tocColors[i]}20`, lineHeight: 1.4 }}>• {item}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* IRIS+ indicators */}
      <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textSec, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>IRIS+ Indicators — {sector}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {model.iris.map(ind => (
            <div key={ind} style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 11, color: T.navy, fontFamily: T.mono }}>
              {ind}
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio Impact Aggregator */}
      <PortfolioImpactAggregator />

      {/* Extended IRIS+ Catalog */}
      <ExtendedIrisCatalog />
    </Card>
  );
}

function PortfolioImpactAggregator() {
  const [deals] = useState(() => {
    try { return JSON.parse(localStorage.getItem('undp_bf_deals_v1') || '[]'); } catch { return []; }
  });

  if (deals.length === 0) return (
    <div style={{ background: T.surfaceAlt, border: `1px dashed ${T.border}`, borderRadius: 8, padding: 20, textAlign: 'center', color: T.textMut, fontSize: 13, marginBottom: 16 }}>
      Add deals in Pipeline Builder tab to see portfolio impact aggregation here.
    </div>
  );

  const impactByKey = (d) => {
    const s = d.totalSize || 0;
    if (d.sector === 'Renewable Energy') return { metric: 'MW Installed', value: +(s * 1.2).toFixed(0) };
    if (d.sector === 'MSME Finance')     return { metric: 'MSMEs Financed', value: +(s * 45).toFixed(0) };
    if (d.sector === 'Climate Adaptation') return { metric: 'People Protected', value: +(s * 8500).toFixed(0) };
    if (d.sector === 'Agriculture')      return { metric: 'Farmers Reached', value: +(s * 620).toFixed(0) };
    return { metric: 'Beneficiaries', value: +(s * 500).toFixed(0) };
  };

  const grouped = {};
  deals.forEach(d => {
    if (!grouped[d.sector]) grouped[d.sector] = { deals: 0, totalSize: 0, impact: 0, metric: '' };
    grouped[d.sector].deals += 1;
    grouped[d.sector].totalSize += d.totalSize || 0;
    const imp = impactByKey(d);
    grouped[d.sector].impact += imp.value;
    grouped[d.sector].metric = imp.metric;
  });

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Portfolio Impact Aggregator</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: T.surfaceAlt }}>
            {['Sector', '# Deals', 'Total Size ($M)', 'Key Output Metric', 'Est. Impact'].map(h => (
              <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([sector, data], i) => (
            <tr key={sector} style={{ background: i % 2 === 0 ? '#fff' : T.surfaceAlt }}>
              <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{sector}</td>
              <td style={{ padding: '7px 10px', fontFamily: T.mono }}>{data.deals}</td>
              <td style={{ padding: '7px 10px', fontFamily: T.mono, color: T.teal, fontWeight: 700 }}>${data.totalSize.toFixed(0)}M</td>
              <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{data.metric}</td>
              <td style={{ padding: '7px 10px', fontFamily: T.mono, fontWeight: 700, color: T.green }}>{data.impact.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExtendedIrisCatalog() {
  const [search, setSearch] = useState('');
  const ALL_IRIS = [
    { code:'PI9922', name:'Energy generated (MWh)', unit:'MWh/yr', methodology:'Metered generation data', sector:'Renewable Energy' },
    { code:'PI5765', name:'GHG emissions avoided', unit:'tCO2e/yr', methodology:'IPCC emission factors', sector:'Renewable Energy' },
    { code:'OI7292', name:'Jobs created (FTEs)', unit:'FTEs', methodology:'Labour survey', sector:'Renewable Energy' },
    { code:'PI2918', name:'Capacity installed', unit:'MW', methodology:'Nameplate capacity', sector:'Renewable Energy' },
    { code:'OI3341', name:'Energy access beneficiaries', unit:'HH', methodology:'Census proxy', sector:'Renewable Energy' },
    { code:'PI4720', name:'Enterprises financed', unit:'count', methodology:'Disbursement records', sector:'MSME Finance' },
    { code:'OI4066', name:'Jobs sustained', unit:'jobs', methodology:'Borrower reporting', sector:'MSME Finance' },
    { code:'PI6712', name:'Women clients served', unit:'count', methodology:'KYC data', sector:'MSME Finance' },
    { code:'OI8821', name:'Revenue growth (avg %)', unit:'%', methodology:'Financial statements', sector:'MSME Finance' },
    { code:'PI3399', name:'First-time borrowers', unit:'count', methodology:'Credit bureau', sector:'MSME Finance' },
    { code:'OI5967', name:'Disaster risk reduction index', unit:'index', methodology:'UNDRR DesInventar', sector:'Climate Adaptation' },
    { code:'PI2738', name:'People benefiting from adaptation', unit:'persons', methodology:'Beneficiary surveys', sector:'Climate Adaptation' },
    { code:'OI3342', name:'Adaptation finance mobilized', unit:'$M', methodology:'OECD DAC tracking', sector:'Climate Adaptation' },
    { code:'PI7775', name:'Agricultural producers served', unit:'farmers', methodology:'Outreach records', sector:'Agriculture' },
    { code:'OI5775', name:'Crop yield improvement', unit:'%', methodology:'Control group comparison', sector:'Agriculture' },
    { code:'PI2384', name:'Women farmers served', unit:'count', methodology:'Gender disaggregation', sector:'Agriculture' },
    { code:'OI1188', name:'Food security improvement', unit:'HDDS score', methodology:'Household survey', sector:'Agriculture' },
    { code:'PI6601', name:'Hectares under sustainable mgmt', unit:'ha', methodology:'Remote sensing', sector:'Agriculture' },
  ];

  const filtered = ALL_IRIS.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase()) || r.sector.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>Extended IRIS+ Catalog</div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search indicators..."
          style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: 200 }} />
      </div>
      <div style={{ overflowY: 'auto', maxHeight: 260 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead style={{ position: 'sticky', top: 0, background: T.surfaceAlt, zIndex: 1 }}>
            <tr>
              {['Code', 'Indicator Name', 'Unit', 'Methodology', 'Sector'].map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.code} style={{ background: i % 2 === 0 ? '#fff' : T.surfaceAlt }}>
                <td style={{ padding: '6px 10px', fontFamily: T.mono, fontWeight: 700, color: T.teal, fontSize: 11 }}>{r.code}</td>
                <td style={{ padding: '6px 10px', color: T.navy, fontWeight: 600, fontSize: 11 }}>{r.name}</td>
                <td style={{ padding: '6px 10px', fontFamily: T.mono, fontSize: 11 }}>{r.unit}</td>
                <td style={{ padding: '6px 10px', color: T.textSec, fontSize: 11 }}>{r.methodology}</td>
                <td style={{ padding: '6px 10px' }}><Pill label={r.sector} color={T.navy} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DEAL BUILDER
   ═══════════════════════════════════════════════════════════════════ */
function DealBuilder() {
  const defaultDeal = { name: '', country: '', sector: 'Renewable Energy', totalSize: 50, concPct: 25, grantPct: 8, guaranteePct: 10, vehicle: 'Local DFI-Led', sdgs: [7, 13], status: 'Structuring', notes: '' };
  const [deals, setDeals] = useState(() => {
    try { return JSON.parse(localStorage.getItem('undp_bf_deals_v1') || '[]'); } catch { return []; }
  });
  const [form, setForm] = useState(defaultDeal);
  const [showForm, setShowForm] = useState(false);
  const [statusView, setStatusView] = useState('grid');

  useEffect(() => { localStorage.setItem('undp_bf_deals_v1', JSON.stringify(deals)); }, [deals]);

  const commPct = Math.max(0, 100 - form.concPct - form.grantPct - form.guaranteePct);
  const leverage = form.concPct + form.grantPct > 0 ? (commPct / (form.concPct + form.grantPct)).toFixed(1) : '—';

  const addDeal = () => {
    if (!form.name || !form.country) return;
    setDeals(prev => [...prev, { ...form, id: `UDEAL${Date.now()}`, leverage: parseFloat(leverage) || 0 }]);
    setForm(defaultDeal);
    setShowForm(false);
  };

  const dealScore = (d) => {
    const sectorBench = { 'Renewable Energy': 3.5, 'Infrastructure': 2.8, 'MSME Finance': 2.0, 'Agriculture': 1.8, 'Climate Adaptation': 1.5, 'Healthcare': 1.6, 'NBS/Forestry': 1.2 };
    const bench = sectorBench[d.sector] || 2.5;
    const levScore = Math.min(30, (d.leverage / bench) * 30);
    const sdgScore = Math.min(20, (d.sdgs || []).length * 2);
    const nameScore = d.name && d.country ? 15 : 0;
    const concScore = d.concPct >= 10 && d.concPct <= 50 ? 15 : 5;
    const sectorImpact = ['Renewable Energy','Climate Adaptation','NBS/Forestry'].includes(d.sector) ? 1 : 0.7;
    return Math.min(100, Math.round(levScore + sdgScore + nameScore + concScore + sectorImpact * 20));
  };

  const STATUSES = ['Structuring', 'Due Diligence', 'Closed', 'Monitoring'];
  const allSdgs = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];

  // Portfolio KPIs
  const totalPortfolio = deals.reduce((s, d) => s + d.totalSize, 0);
  const wtdLeverage = deals.length ? deals.reduce((s, d) => s + d.leverage * d.totalSize, 0) / Math.max(totalPortfolio, 1) : 0;
  const totalPublic = deals.reduce((s, d) => s + (d.concPct + d.grantPct) / 100 * d.totalSize, 0);
  const countries = new Set(deals.map(d => d.country).filter(Boolean)).size;

  return (
    <Card>
      <SectionHeader title="Transaction Pipeline Builder" icon="🔨" sub="Structure and track blended finance deals — saved locally, UNDP framework compliant" />

      {deals.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          <KPI label="Portfolio Size" value={`$${totalPortfolio.toFixed(0)}M`} sub={`${deals.length} deals`} color={T.navy} icon="💼" />
          <KPI label="Wtd Avg Leverage" value={`${wtdLeverage.toFixed(1)}x`} sub="Portfolio average" color={T.green} icon="⚖️" />
          <KPI label="Public Capital" value={`$${totalPublic.toFixed(0)}M`} sub="Conc. + Grant deployed" color={T.teal} icon="🏛️" />
          <KPI label="Countries" value={countries} sub="Unique geographies" color={T.amber} icon="🌍" />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setShowForm(v => !v)}
          style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: T.teal, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {showForm ? '✕ Cancel' : '+ Structure New Deal'}
        </button>
        {deals.length > 0 && ['grid','board'].map(v => (
          <button key={v} onClick={() => setStatusView(v)}
            style={{ padding: '7px 14px', borderRadius: 6, border: `1px solid ${statusView === v ? T.navy : T.border}`, background: statusView === v ? T.navy : '#fff', color: statusView === v ? '#fff' : T.textSec, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {v === 'grid' ? '⊞ Grid' : '⧉ Board'}
          </button>
        ))}
      </div>

      {showForm && (
        <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            {[
              { label: 'Project Name *', key: 'name', placeholder: 'Vietnam Solar Fund' },
              { label: 'Country *', key: 'country', placeholder: 'Vietnam' },
              { label: 'Sector', key: 'sector', type: 'select', opts: ['Renewable Energy', 'Infrastructure', 'MSME Finance', 'Agriculture', 'Climate Adaptation', 'Healthcare', 'NBS/Forestry', 'Education', 'Water & Sanitation'] },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                {f.type === 'select' ? (
                  <select value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, background: '#fff' }}>
                    {f.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, boxSizing: 'border-box' }} />
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
            {[
              { label: 'Total Size ($M)', key: 'totalSize', min: 1, max: 2000 },
              { label: 'Concessional Loan (%)', key: 'concPct', min: 0, max: 80, color: T.teal },
              { label: 'Grant / TA (%)', key: 'grantPct', min: 0, max: 40, color: T.purple },
              { label: 'Guarantee (%)', key: 'guaranteePct', min: 0, max: 30, color: T.amber },
            ].map(f => (
              <div key={f.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 4, textTransform: 'uppercase' }}>
                  <span>{f.label}</span>
                  <span style={{ color: f.color || T.navy, fontFamily: T.mono }}>{f.key === 'totalSize' ? `$${form[f.key]}M` : `${form[f.key]}%`}</span>
                </div>
                <input type="range" min={f.min} max={f.max} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: +e.target.value }))}
                  style={{ width: '100%', accentColor: f.color || T.navy, cursor: 'pointer' }} />
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 4, textTransform: 'uppercase' }}>Vehicle Type</div>
              <select value={form.vehicle} onChange={e => setForm(p => ({ ...p, vehicle: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13 }}>
                {['Local DFI-Led', 'Donor/Funder-Led', 'Private Sector-Led', 'Regional Platform', 'Guarantee Scheme', 'PPP'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 4, textTransform: 'uppercase' }}>Target SDGs</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {allSdgs.map(s => (
                  <button key={s} onClick={() => setForm(p => ({ ...p, sdgs: p.sdgs.includes(s) ? p.sdgs.filter(x => x !== s) : [...p.sdgs, s] }))}
                    style={{ width: 28, height: 28, borderRadius: 5, border: 'none', background: form.sdgs.includes(s) ? SDG_COLORS_MAP[s] : '#eee', color: form.sdgs.includes(s) ? '#fff' : '#999', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 4, textTransform: 'uppercase' }}>Deal Status</div>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13 }}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Preview */}
          <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, marginBottom: 14, display: 'flex', gap: 20 }}>
            {[
              { l: 'Commercial %', v: `${commPct}%`, c: T.navy },
              { l: 'Leverage Ratio', v: `${leverage}x`, c: T.green },
              { l: 'Blending Ratio', v: `${form.concPct + form.grantPct}%`, c: T.teal },
              { l: 'Public Capital', v: `$${((form.concPct + form.grantPct) / 100 * form.totalSize).toFixed(0)}M`, c: T.purple },
            ].map(r => (
              <div key={r.l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: r.c, fontFamily: T.mono }}>{r.v}</div>
                <div style={{ fontSize: 10, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.l}</div>
              </div>
            ))}
          </div>

          <button onClick={addDeal}
            style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: T.teal, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Save to Pipeline
          </button>
        </div>
      )}

      {deals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: T.textMut, fontSize: 13, border: `1px dashed ${T.border}`, borderRadius: 8 }}>
          No deals structured yet. Click above to add your first transaction.
        </div>
      ) : statusView === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {deals.map(d => {
            const score = dealScore(d);
            const scoreColor = score >= 70 ? T.green : score >= 45 ? T.amber : T.red;
            return (
              <div key={d.id} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, flex: 1 }}>{d.name}</div>
                  <button onClick={() => setDeals(prev => prev.filter(x => x.id !== d.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMut, fontSize: 16, padding: 0 }}>✕</button>
                </div>
                <div style={{ fontSize: 11, color: T.textSec, margin: '4px 0 6px' }}>{d.country} · {d.sector}</div>
                <Pill label={d.status || 'Structuring'} color={T.teal} />
                <div style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${score}%`, height: '100%', background: scoreColor, borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor, fontFamily: T.mono, minWidth: 32 }}>{score}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                  <div><span style={{ color: T.textMut }}>Size </span><span style={{ fontWeight: 700, fontFamily: T.mono }}>${d.totalSize}M</span></div>
                  <div><span style={{ color: T.textMut }}>Leverage </span><span style={{ fontWeight: 700, color: T.green, fontFamily: T.mono }}>{d.leverage}x</span></div>
                  <div><span style={{ color: T.textMut }}>Conc. </span><span style={{ fontWeight: 700, fontFamily: T.mono }}>{d.concPct}%</span></div>
                  <div><span style={{ color: T.textMut }}>Grant </span><span style={{ fontWeight: 700, fontFamily: T.mono }}>{d.grantPct}%</span></div>
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                  {(d.sdgs || []).map(s => (
                    <div key={s} style={{ width: 22, height: 22, borderRadius: 4, background: SDG_COLORS_MAP[s], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>{s}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {STATUSES.map(status => (
            <div key={status} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${T.border}` }}>
                {status} <span style={{ fontSize: 11, color: T.textMut, fontWeight: 400 }}>({deals.filter(d => (d.status || 'Structuring') === status).length})</span>
              </div>
              {deals.filter(d => (d.status || 'Structuring') === status).map(d => (
                <div key={d.id} style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 7, padding: '8px 10px', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 2 }}>{d.name || '(unnamed)'}</div>
                  <div style={{ fontSize: 10, color: T.textSec }}>{d.country} · ${d.totalSize}M</div>
                  <div style={{ fontSize: 10, color: T.green, fontWeight: 700, fontFamily: T.mono, marginTop: 3 }}>{d.leverage}x leverage</div>
                </div>
              ))}
              {deals.filter(d => (d.status || 'Structuring') === status).length === 0 && (
                <div style={{ fontSize: 11, color: T.textMut, textAlign: 'center', padding: 12 }}>No deals</div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   RISK MATRIX
   ═══════════════════════════════════════════════════════════════════ */
function RiskMatrix() {
  const [risks, setRisks] = useState(() => RISK_FACTORS_DEFAULT.map(r => ({ ...r })));
  const [selected, setSelected] = useState(null);
  const [newRisk, setNewRisk] = useState({ name: '', category: 'Credit', probability: 2, impact: 3 });
  const [showAdd, setShowAdd] = useState(false);

  const CATEGORIES = ['Political','Currency','Credit','Regulatory','Construction','Market','Environmental','Liquidity','ESG'];

  const cellColor = (pi) => pi >= 16 ? '#fca5a5' : pi >= 12 ? '#fdba74' : pi >= 8 ? '#fde68a' : pi >= 4 ? '#bbf7d0' : '#d1fae5';
  const cellBorder = (pi) => pi >= 16 ? '#ef4444' : pi >= 12 ? '#f97316' : pi >= 8 ? '#f59e0b' : pi >= 4 ? '#16a34a' : '#059669';

  const toggleMitigate = (id) => {
    setRisks(prev => prev.map(r => {
      if (r.id !== id) return r;
      if (!r.mitigated) return { ...r, mitigated: true, probability: Math.max(1, r.probability - 1) };
      return { ...r, mitigated: false, probability: RISK_FACTORS_DEFAULT.find(d => d.id === id)?.probability || r.probability };
    }));
    setSelected(null);
  };

  const addRisk = () => {
    if (!newRisk.name) return;
    const id = `RX${Date.now()}`;
    setRisks(prev => [...prev, { ...newRisk, id, mitigation: 'Manual mitigation required', mitigated: false }]);
    setNewRisk({ name: '', category: 'Credit', probability: 2, impact: 3 });
    setShowAdd(false);
  };

  const preScore = risks.reduce((s, r) => s + r.probability * r.impact, 0);
  const maxPI = risks.reduce((mx, r) => Math.max(mx, r.probability * r.impact), 0);
  const residualLabel = maxPI >= 16 ? 'Critical' : maxPI >= 12 ? 'High' : maxPI >= 6 ? 'Medium' : 'Low';
  const residualColor = maxPI >= 16 ? T.red : maxPI >= 12 ? T.amber : maxPI >= 6 ? T.gold : T.green;

  const selectedRisk = risks.find(r => r.id === selected);

  return (
    <Card>
      <SectionHeader title="Risk Matrix" icon="⚠️" sub="5×5 probability × impact heat map — click a risk to mitigate or customize" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'start' }}>
        <div>
          {/* 5×5 Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(5, 1fr)', gap: 2, marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: T.textMut, writingMode: 'vertical-rl', textAlign: 'center', paddingRight: 4 }}>PROBABILITY ↑</div>
            {[5,4,3,2,1].map(p => (
              <React.Fragment key={p}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textSec, display: 'contents' }} />
                {[1,2,3,4,5].map(im => {
                  const pi = p * im;
                  const inCell = risks.filter(r => r.probability === p && r.impact === im);
                  return (
                    <div key={im} style={{ background: cellColor(pi), border: `1px solid ${cellBorder(pi)}`, borderRadius: 4, minHeight: 52, padding: 4, display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
                      <div style={{ fontSize: 8, color: cellBorder(pi), fontWeight: 700, fontFamily: T.mono }}>{pi}</div>
                      {inCell.map(r => (
                        <div key={r.id} onClick={() => setSelected(r.id === selected ? null : r.id)}
                          style={{ fontSize: 9, background: r.mitigated ? '#86efac' : '#fff', border: `1px solid ${r.mitigated ? '#16a34a' : '#d1d5db'}`, borderRadius: 3, padding: '1px 4px', cursor: 'pointer', fontWeight: 600, color: T.navy, lineHeight: 1.3 }}>
                          {r.id}{r.mitigated ? '✓' : ''}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
            <div />
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ fontSize: 9, color: T.textMut, textAlign: 'center', marginTop: 2 }}>{i}</div>
            ))}
            <div style={{ gridColumn: '2 / 7', fontSize: 9, color: T.textMut, textAlign: 'center', marginTop: 2 }}>IMPACT →</div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {[['≥16 Critical','#fca5a5'],['≥12 High','#fdba74'],['≥8 Medium','#fde68a'],['≥4 Low','#bbf7d0'],['<4 Negligible','#d1fae5']].map(([l, c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
                <span style={{ color: T.textSec }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: 260 }}>
          <div style={{ background: residualColor + '15', border: `1px solid ${residualColor}40`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Residual Rating</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: residualColor }}>{residualLabel}</div>
            <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Composite: {preScore} · Max P×I: {maxPI}</div>
          </div>

          {selectedRisk ? (
            <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{selectedRisk.id}: {selectedRisk.name}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}><Pill label={selectedRisk.category} color={T.teal} /></div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6, lineHeight: 1.5 }}><strong>Mitigation:</strong> {selectedRisk.mitigation}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 10 }}>P×I: {selectedRisk.probability * selectedRisk.impact} | Status: {selectedRisk.mitigated ? '✓ Mitigated' : 'Open'}</div>
              <button onClick={() => toggleMitigate(selectedRisk.id)}
                style={{ width: '100%', padding: '8px', borderRadius: 6, border: 'none', background: selectedRisk.mitigated ? T.amber : T.green, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                {selectedRisk.mitigated ? 'Un-mitigate' : 'Mark Mitigated'}
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: T.textMut, textAlign: 'center', padding: 16, background: T.surfaceAlt, borderRadius: 8, marginBottom: 12 }}>Click a risk badge to view detail</div>
          )}

          <div style={{ overflowY: 'auto', maxHeight: 200, marginBottom: 12 }}>
            {risks.map(r => (
              <div key={r.id} onClick={() => setSelected(r.id === selected ? null : r.id)}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: selected === r.id ? T.navy + '0a' : 'transparent', borderRadius: 5, cursor: 'pointer', fontSize: 11 }}>
                <span style={{ fontWeight: 600, color: r.mitigated ? T.green : T.text }}>{r.id}: {r.name.substring(0, 22)}</span>
                <span style={{ fontFamily: T.mono, color: cellBorder(r.probability * r.impact) }}>{r.probability * r.impact}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowAdd(v => !v)}
              style={{ flex: 1, padding: '7px', borderRadius: 6, border: `1px solid ${T.border}`, background: '#fff', color: T.navy, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              + Add Risk
            </button>
            <button onClick={() => setRisks(RISK_FACTORS_DEFAULT.map(r => ({ ...r })))}
              style={{ padding: '7px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: '#fff', color: T.textSec, fontSize: 11, cursor: 'pointer' }}>
              Reset
            </button>
          </div>

          {showAdd && (
            <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, marginTop: 10 }}>
              <input value={newRisk.name} onChange={e => setNewRisk(p => ({ ...p, name: e.target.value }))} placeholder="Risk name"
                style={{ width: '100%', padding: '6px 8px', borderRadius: 5, border: `1px solid ${T.border}`, fontSize: 12, marginBottom: 8, boxSizing: 'border-box' }} />
              <select value={newRisk.category} onChange={e => setNewRisk(p => ({ ...p, category: e.target.value }))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 5, border: `1px solid ${T.border}`, fontSize: 12, marginBottom: 8 }}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              {['probability','impact'].map(k => (
                <div key={k} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>{k.charAt(0).toUpperCase() + k.slice(1)}: {newRisk[k]}</div>
                  <input type="range" min={1} max={5} value={newRisk[k]} onChange={e => setNewRisk(p => ({ ...p, [k]: +e.target.value }))}
                    style={{ width: '100%', accentColor: T.teal, cursor: 'pointer' }} />
                </div>
              ))}
              <button onClick={addRisk}
                style={{ width: '100%', padding: '7px', borderRadius: 5, border: 'none', background: T.teal, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Add
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DFI BENCHMARK
   ═══════════════════════════════════════════════════════════════════ */
function DFIBenchmark() {
  const [selectedDFIs, setSelectedDFIs] = useState(['IFC', 'ADB', 'GCF']);
  const [dealSector, setDealSector] = useState('Infrastructure');
  const [dealSize, setDealSize] = useState(25);

  const toggleDFI = (name) => setSelectedDFIs(prev => prev.includes(name) ? prev.filter(d => d !== name) : [...prev, name]);

  const selected = DFI_BENCHMARKS.filter(d => selectedDFIs.includes(d.name));

  const radarData = ['avgLeverage','avgConcPct','climate','minProjectSize'].map(key => {
    const norms = { avgLeverage: 6, avgConcPct: 60, climate: 100, minProjectSize: 60 };
    const row = { metric: key === 'avgLeverage' ? 'Leverage' : key === 'avgConcPct' ? 'Concessionality' : key === 'climate' ? 'Climate %' : 'Min Size', fullMark: 1 };
    selected.forEach(d => { row[d.name] = +(d[key] / norms[key]).toFixed(2); });
    return row;
  });

  const COLORS = [T.navy, T.teal, T.green, T.amber, T.purple, T.red];

  const scatterData = DFI_BENCHMARKS.map(d => ({ name: d.name, x: d.avgLeverage, y: d.avgConcPct, z: d.climate }));

  const fits = DFI_BENCHMARKS.filter(d => d.minProjectSize <= dealSize && d.sectors.some(s => s.toLowerCase().includes(dealSector.toLowerCase().split(' ')[0])));
  const bestFit = fits.sort((a, b) => b.avgLeverage - a.avgLeverage)[0] || null;

  const DEAL_SECTORS = ['Infrastructure','Energy','Finance','Agriculture','Healthcare','Education','Adaptation'];

  return (
    <Card>
      <SectionHeader title="DFI Benchmarking" icon="📐" sub="Compare DFI blended finance parameters — find the best-fit DFI for your deal" />

      {/* DFI toggles */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {DFI_BENCHMARKS.map((d, i) => (
          <button key={d.name} onClick={() => toggleDFI(d.name)}
            style={{ padding: '6px 14px', borderRadius: 20, border: `2px solid ${selectedDFIs.includes(d.name) ? COLORS[i] : T.border}`, background: selectedDFIs.includes(d.name) ? COLORS[i] + '18' : '#fff', color: selectedDFIs.includes(d.name) ? COLORS[i] : T.textMut, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            {d.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Radar */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textSec, marginBottom: 8, textTransform: 'uppercase' }}>Normalized Comparison</div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: T.textSec }} />
              <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
              {selected.map((d, i) => (
                <Radar key={d.name} name={d.name} dataKey={d.name} stroke={COLORS[DFI_BENCHMARKS.findIndex(x => x.name === d.name)]} fill={COLORS[DFI_BENCHMARKS.findIndex(x => x.name === d.name)]} fillOpacity={0.15} strokeWidth={2} />
              ))}
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Scatter */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textSec, marginBottom: 8, textTransform: 'uppercase' }}>Leverage vs Concessionality (size = climate%)</div>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" name="Avg Leverage" type="number" tick={{ fontSize: 9 }} label={{ value: 'Avg Leverage (x)', position: 'insideBottom', offset: -5, fontSize: 10 }} domain={[2, 5]} />
              <YAxis dataKey="y" name="Avg Conc%" type="number" tick={{ fontSize: 9 }} label={{ value: 'Conc%', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <ZAxis dataKey="z" range={[80, 400]} />
              <Tooltip content={({ payload }) => payload && payload[0] ? (
                <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
                  <div style={{ fontWeight: 700 }}>{payload[0]?.payload?.name}</div>
                  <div>Leverage: {payload[0]?.payload?.x}x</div>
                  <div>Conc: {payload[0]?.payload?.y}%</div>
                  <div>Climate: {payload[0]?.payload?.z}%</div>
                </div>
              ) : null} />
              <Scatter data={scatterData} fill={T.teal}>
                {scatterData.map((d, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', marginTop: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surfaceAlt }}>
              {['DFI','Region','Avg Leverage','Avg Conc%','Climate%','Min Size ($M)','Key Sectors'].map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DFI_BENCHMARKS.map((d, i) => (
              <tr key={d.name} style={{ background: selectedDFIs.includes(d.name) ? COLORS[i] + '08' : (i % 2 === 0 ? '#fff' : T.surfaceAlt) }}>
                <td style={{ padding: '7px 10px', fontWeight: 700, color: COLORS[i] }}>{d.name}</td>
                <td style={{ padding: '7px 10px', color: T.textSec }}>{d.region}</td>
                <td style={{ padding: '7px 10px', fontFamily: T.mono, color: T.green, fontWeight: 700 }}>{d.avgLeverage}x</td>
                <td style={{ padding: '7px 10px', fontFamily: T.mono }}>{d.avgConcPct}%</td>
                <td style={{ padding: '7px 10px', fontFamily: T.mono, color: T.teal }}>{d.climate}%</td>
                <td style={{ padding: '7px 10px', fontFamily: T.mono }}>${d.minProjectSize}M</td>
                <td style={{ padding: '7px 10px', fontSize: 11, color: T.textSec }}>{d.sectors.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Best fit */}
      <div style={{ marginTop: 20, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Best-Fit DFI for Your Deal</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.textSec, display: 'block', marginBottom: 4 }}>Deal Sector</label>
            <select value={dealSector} onChange={e => setDealSector(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: '#fff' }}>
              {DEAL_SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 4 }}>Deal Size: ${dealSize}M</div>
            <input type="range" min={5} max={200} step={5} value={dealSize} onChange={e => setDealSize(+e.target.value)}
              style={{ width: 180, accentColor: T.navy, cursor: 'pointer' }} />
          </div>
        </div>
        {bestFit ? (
          <div style={{ background: T.green + '12', border: `1px solid ${T.green}40`, borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.green }}>✓ Best Match: {bestFit.name}</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 6 }}>Region: {bestFit.region} · Avg Leverage: {bestFit.avgLeverage}x · Climate Focus: {bestFit.climate}% · Min Project: ${bestFit.minProjectSize}M</div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: T.amber }}>⚠ No DFI match for deal size ${dealSize}M in {dealSector} — consider IFC or FMO for flexibility.</div>
        )}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'framework',   label: '🏛️ 6-Pillar Framework' },
  { id: 'calculator',  label: '⚖️ Calculators' },
  { id: 'instruments', label: '🛠️ Instruments' },
  { id: 'markets',     label: '🌏 Market Intelligence' },
  { id: 'vehicles',    label: '🏗️ Vehicles' },
  { id: 'impact',      label: '📏 Impact (IMM)' },
  { id: 'pipeline',    label: '🔨 Pipeline' },
  { id: 'risk',        label: '⚠️ Risk Matrix' },
  { id: 'benchmarks',  label: '📐 DFI Benchmarks' },
];

export default function UndpBlendedFinancePage() {
  const [activeTab, setActiveTab] = useState('framework');

  // Summary KPIs from the full framework dataset
  const totalTx = MARKETS.reduce((s, m) => s + m.transactions, 0);
  const totalVol = MARKETS.reduce((s, m) => s + m.financing, 0);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font }}>
      {/* Header */}
      <div style={{ background: T.navy, borderBottom: `3px solid ${T.gold}`, padding: '18px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: T.mono, letterSpacing: '0.1em', marginBottom: 4 }}>
              A² INTELLIGENCE · BLENDED FINANCE
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
              UNDP Strategic Blended Finance Framework
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
              6-Pillar Maturity Model · Convergence Market Database · IRIS+ Impact Measurement · Transaction Pipeline
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Transactions', value: `${totalTx}`, sub: 'S+SE Asia 2016–24' },
              { label: 'Volume', value: `$${totalVol.toFixed(0)}B`, sub: 'aggregate financing' },
              { label: 'Pillars', value: '6', sub: 'UNDP framework' },
              { label: 'Instruments', value: '10', sub: 'blending archetypes' },
            ].map(k => (
              <div key={k.label} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 14px', textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.goldL, fontFamily: T.mono }}>{k.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{k.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${T.border}`, padding: '0 32px', overflowX: 'auto', display: 'flex' }}>
        {TABS.map(t => (
          <Tab key={t.id} label={t.label} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>

        {/* ── Framework Overview ── */}
        {activeTab === 'framework' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
              <KPI label="Total S+SE Asia Volume" value={`$${totalVol.toFixed(0)}B`} sub="345 transactions 2016–2024" color={T.teal} icon="💵" />
              <KPI label="Avg Leverage Ratio (Region)" value="3.1x" sub="Private capital per $1 public" color={T.green} icon="⚖️" />
              <KPI label="Top Concessional Provider" value="IFC / World Bank" sub="91 commitments in region" color={T.amber} icon="🏦" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {PILLARS.map(p => (
                <div key={p.id} style={{ background: p.lightColor, border: `2px solid ${p.color}30`, borderRadius: 12, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{p.icon}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: p.color, letterSpacing: '0.03em' }}>PILLAR {p.id}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{p.title}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>{p.subtitle}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {p.subsections.map(s => (
                      <div key={s.id} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: p.color, marginBottom: 2 }}>{s.id} {s.title}</div>
                        <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>{s.description}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {p.indicators.map(ind => (
                      <span key={ind} style={{ fontSize: 10, padding: '2px 8px', background: p.color + '15', color: p.color, borderRadius: 10, border: `1px solid ${p.color}30` }}>{ind}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'calculator' && <LeverageCalculator />}
        {activeTab === 'instruments' && <InstrumentsLibrary />}
        {activeTab === 'markets' && <MarketIntelligence />}
        {activeTab === 'vehicles' && <VehicleStructures />}
        {activeTab === 'impact' && <ImpactMeasurement />}
        {activeTab === 'pipeline'    && <DealBuilder />}
        {activeTab === 'risk'        && <RiskMatrix />}
        {activeTab === 'benchmarks'  && <DFIBenchmark />}
      </div>
    </div>
  );
}
