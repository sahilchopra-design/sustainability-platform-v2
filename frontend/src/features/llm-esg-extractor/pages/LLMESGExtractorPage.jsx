import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, AreaChart, Area, Cell, Legend
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7', border: '#e5e0d8',
  borderL: '#d5cfc5', navy: '#1b3a5c', navyL: '#2c5a8c', gold: '#c5a96a',
  goldL: '#d4be8a', sage: '#5a8a6a', sageL: '#7ba67d', teal: '#5a8a6a',
  text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed',
  font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

function sr(s) { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); }

// ─── Static data ─────────────────────────────────────────────────────────────

const FRAMEWORKS = {
  ESRS: [
    { id: 'E1-6', label: 'GHG Scope 1 Emissions', pillar: 'Climate', required: true, unit: 'tCO2e' },
    { id: 'E1-7', label: 'GHG Scope 2 Emissions', pillar: 'Climate', required: true, unit: 'tCO2e' },
    { id: 'E1-8', label: 'GHG Scope 3 Emissions', pillar: 'Climate', required: true, unit: 'tCO2e' },
    { id: 'E1-4', label: 'GHG Reduction Targets', pillar: 'Climate', required: true, unit: '%' },
    { id: 'E1-5', label: 'Energy Consumption', pillar: 'Climate', required: true, unit: 'GJ' },
    { id: 'E2-1', label: 'Air Pollutant Emissions', pillar: 'Pollution', required: true, unit: 'tonnes' },
    { id: 'E3-1', label: 'Water Consumption', pillar: 'Water', required: true, unit: 'm3' },
    { id: 'E3-2', label: 'Water Intensity', pillar: 'Water', required: false, unit: 'm3/€m' },
    { id: 'E4-1', label: 'Biodiversity Net Loss', pillar: 'Biodiversity', required: false, unit: 'flag' },
    { id: 'E5-4', label: 'Waste Diversion Rate', pillar: 'Circular', required: true, unit: '%' },
    { id: 'S1-1', label: 'Headcount', pillar: 'Workforce', required: true, unit: 'FTE' },
    { id: 'S1-16', label: 'Gender Pay Gap', pillar: 'Workforce', required: true, unit: '%' },
    { id: 'S1-9', label: 'LTIFR', pillar: 'Workforce', required: true, unit: 'per 1M hrs' },
    { id: 'S2-1', label: 'Supplier Code of Conduct', pillar: 'Supply Chain', required: true, unit: 'flag' },
    { id: 'G1-1', label: 'Board Independence', pillar: 'Governance', required: true, unit: '%' },
    { id: 'G1-5', label: 'Board Gender Diversity', pillar: 'Governance', required: true, unit: '%' },
    { id: 'G1-3', label: 'Anti-Bribery Training', pillar: 'Governance', required: false, unit: '% covered' },
    { id: 'E1-2', label: 'Climate Transition Plan', pillar: 'Climate', required: true, unit: 'flag' },
    { id: 'E1-3', label: 'Physical Climate Risks', pillar: 'Climate', required: true, unit: 'flag' },
    { id: 'S1-14', label: 'Pay Ratio CEO/Median', pillar: 'Workforce', required: false, unit: 'x' },
    { id: 'E5-1', label: 'Circular Economy Policy', pillar: 'Circular', required: false, unit: 'flag' },
    { id: 'G1-4', label: 'Whistleblower Policy', pillar: 'Governance', required: true, unit: 'flag' },
    { id: 'S3-1', label: 'Community Engagement', pillar: 'Communities', required: false, unit: 'flag' },
    { id: 'S4-1', label: 'Consumer Data Privacy', pillar: 'Consumers', required: true, unit: 'flag' },
    { id: 'E2-4', label: 'Hazardous Waste', pillar: 'Pollution', required: true, unit: 'tonnes' },
    { id: 'E3-3', label: 'Water in Stressed Areas', pillar: 'Water', required: false, unit: 'm3' },
    { id: 'G1-2', label: 'Conflict of Interest Policy', pillar: 'Governance', required: false, unit: 'flag' },
    { id: 'S1-8', label: 'Turnover Rate', pillar: 'Workforce', required: false, unit: '%' },
    { id: 'E1-9', label: 'Carbon Offsets Used', pillar: 'Climate', required: false, unit: 'tCO2e' },
    { id: 'S2-2', label: 'Supply Chain Audits', pillar: 'Supply Chain', required: true, unit: 'count' },
    { id: 'G1-6', label: 'Executive Pay Policy', pillar: 'Governance', required: true, unit: 'flag' },
    { id: 'E4-2', label: 'Nature Positive Target', pillar: 'Biodiversity', required: false, unit: 'flag' },
    { id: 'S1-3', label: 'Training Hours', pillar: 'Workforce', required: false, unit: 'hrs/FTE' },
    { id: 'E5-2', label: 'Plastic Waste Reduction', pillar: 'Circular', required: false, unit: 'tonnes' },
    { id: 'G1-7', label: 'Tax Transparency', pillar: 'Governance', required: false, unit: 'flag' },
    { id: 'S1-4', label: 'Employee Engagement Score', pillar: 'Workforce', required: false, unit: 'score' },
    { id: 'E2-3', label: 'Pollution Incidents', pillar: 'Pollution', required: true, unit: 'count' },
    { id: 'G1-8', label: 'Cyber Security Policy', pillar: 'Governance', required: true, unit: 'flag' },
    { id: 'S1-17', label: 'Living Wage Coverage', pillar: 'Workforce', required: false, unit: '%' },
    { id: 'E3-4', label: 'Water Recycling Rate', pillar: 'Water', required: false, unit: '%' },
    { id: 'E1-1', label: 'Net Zero Target', pillar: 'Climate', required: true, unit: 'year' },
    { id: 'S1-5', label: 'Parental Leave Policy', pillar: 'Workforce', required: false, unit: 'flag' },
  ],
  ISSB: [
    { id: 'S1-1', label: 'Sustainability Risk Governance', pillar: 'Governance', required: true, unit: 'flag' },
    { id: 'S1-2', label: 'Risk Management Integration', pillar: 'Risk', required: true, unit: 'flag' },
    { id: 'S1-3', label: 'Material Sustainability Risks', pillar: 'Risk', required: true, unit: 'flag' },
    { id: 'S1-4', label: 'Sustainability Strategy', pillar: 'Strategy', required: true, unit: 'flag' },
    { id: 'S2-A1', label: 'Climate Governance', pillar: 'Governance', required: true, unit: 'flag' },
    { id: 'S2-A2', label: 'Climate Strategy', pillar: 'Strategy', required: true, unit: 'flag' },
    { id: 'S2-A3', label: 'Climate Risk Management', pillar: 'Risk', required: true, unit: 'flag' },
    { id: 'S2-B1', label: 'Transition Risks Identified', pillar: 'Risk', required: true, unit: 'flag' },
    { id: 'S2-B2', label: 'Physical Risks Identified', pillar: 'Risk', required: true, unit: 'flag' },
    { id: 'S2-C1', label: 'GHG Scope 1', pillar: 'Metrics', required: true, unit: 'tCO2e' },
    { id: 'S2-C2', label: 'GHG Scope 2', pillar: 'Metrics', required: true, unit: 'tCO2e' },
    { id: 'S2-C3', label: 'GHG Scope 3', pillar: 'Metrics', required: true, unit: 'tCO2e' },
    { id: 'S2-C4', label: 'Carbon Intensity', pillar: 'Metrics', required: true, unit: 'tCO2e/€m' },
    { id: 'S2-C5', label: 'Climate Targets', pillar: 'Targets', required: true, unit: 'flag' },
    { id: 'S2-D1', label: 'Scenario Analysis', pillar: 'Strategy', required: true, unit: 'flag' },
    { id: 'S2-D2', label: 'Transition Plan', pillar: 'Strategy', required: true, unit: 'flag' },
    { id: 'S1-5', label: 'Sustainability Metrics', pillar: 'Metrics', required: false, unit: 'various' },
    { id: 'S1-6', label: 'Targets & Progress', pillar: 'Targets', required: true, unit: 'flag' },
    { id: 'S2-E1', label: 'Energy Transition Assets', pillar: 'Metrics', required: false, unit: '€m' },
    { id: 'S2-E2', label: 'Climate Capital Expenditure', pillar: 'Metrics', required: false, unit: '€m' },
    { id: 'S2-F1', label: 'Financed Emissions', pillar: 'Metrics', required: false, unit: 'tCO2e' },
    { id: 'S1-7', label: 'Stakeholder Engagement', pillar: 'Governance', required: false, unit: 'flag' },
    { id: 'S2-G1', label: 'Internal Carbon Price', pillar: 'Metrics', required: false, unit: '$/tCO2e' },
    { id: 'S2-H1', label: 'Climate Litigation', pillar: 'Risk', required: false, unit: 'count' },
    { id: 'S1-8', label: 'Assurance Statement', pillar: 'Governance', required: false, unit: 'flag' },
    { id: 'S2-I1', label: 'Remuneration Linkage', pillar: 'Governance', required: false, unit: 'flag' },
    { id: 'S1-9', label: 'Value Chain Exposure', pillar: 'Risk', required: true, unit: 'flag' },
    { id: 'S2-J1', label: 'TCFD Alignment', pillar: 'Governance', required: false, unit: 'flag' },
  ],
  TCFD: [
    { id: 'G-1', label: 'Board Oversight of Climate', pillar: 'Governance', required: true, unit: 'flag' },
    { id: 'G-2', label: 'Management Role', pillar: 'Governance', required: true, unit: 'flag' },
    { id: 'ST-1', label: 'Climate Risks & Opportunities', pillar: 'Strategy', required: true, unit: 'flag' },
    { id: 'ST-2', label: 'Business Model Impact', pillar: 'Strategy', required: true, unit: 'flag' },
    { id: 'ST-3', label: 'Strategy Resilience / Scenarios', pillar: 'Strategy', required: true, unit: 'flag' },
    { id: 'RM-1', label: 'Risk Identification Process', pillar: 'Risk Mgmt', required: true, unit: 'flag' },
    { id: 'RM-2', label: 'Risk Management Process', pillar: 'Risk Mgmt', required: true, unit: 'flag' },
    { id: 'RM-3', label: 'Integration into Enterprise RM', pillar: 'Risk Mgmt', required: true, unit: 'flag' },
    { id: 'MC-1', label: 'Climate Metrics Used', pillar: 'Metrics', required: true, unit: 'various' },
    { id: 'MC-2', label: 'Scope 1/2/3 Emissions', pillar: 'Metrics', required: true, unit: 'tCO2e' },
    { id: 'MC-3', label: 'Climate-related Targets', pillar: 'Targets', required: true, unit: 'flag' },
  ],
  GRI: [
    { id: '305-1', label: 'Direct GHG Emissions', pillar: 'Emissions', required: true, unit: 'tCO2e' },
    { id: '305-2', label: 'Indirect GHG Emissions', pillar: 'Emissions', required: true, unit: 'tCO2e' },
    { id: '305-3', label: 'Other Indirect GHG', pillar: 'Emissions', required: true, unit: 'tCO2e' },
    { id: '302-1', label: 'Energy Consumption', pillar: 'Energy', required: true, unit: 'GJ' },
    { id: '303-3', label: 'Water Withdrawal', pillar: 'Water', required: true, unit: 'm3' },
    { id: '306-3', label: 'Waste Generated', pillar: 'Waste', required: true, unit: 'tonnes' },
    { id: '401-1', label: 'Employee Hires & Turnover', pillar: 'Employment', required: true, unit: 'count/%' },
    { id: '403-9', label: 'Work-related Injuries', pillar: 'OHS', required: true, unit: 'LTIFR' },
    { id: '405-2', label: 'Pay Ratio by Gender', pillar: 'Diversity', required: true, unit: '%' },
    { id: '404-1', label: 'Average Training Hours', pillar: 'Training', required: false, unit: 'hrs' },
    { id: '205-1', label: 'Anti-corruption Ops Assessed', pillar: 'Governance', required: true, unit: '%' },
    { id: '417-1', label: 'Product Labelling Info', pillar: 'Marketing', required: false, unit: 'flag' },
    { id: '418-1', label: 'Customer Privacy Complaints', pillar: 'Privacy', required: true, unit: 'count' },
    { id: '102-16', label: 'Values & Codes of Conduct', pillar: 'Governance', required: false, unit: 'flag' },
    { id: '201-2', label: 'Climate Financial Risks', pillar: 'Emissions', required: false, unit: '€m' },
  ],
  SASB: [
    { id: 'EM-EP-110a', label: 'GHG Scope 1 (Energy)', pillar: 'Energy', required: true, unit: 'tCO2e' },
    { id: 'EM-EP-140a', label: 'Spills Volume', pillar: 'Energy', required: true, unit: 'm3' },
    { id: 'FN-CB-410a', label: 'Financed Emissions (Finance)', pillar: 'Finance', required: true, unit: 'tCO2e' },
    { id: 'FN-IN-410a', label: 'Climate Risk Exposure (Ins)', pillar: 'Finance', required: true, unit: '€m' },
    { id: 'IF-EN-110a', label: 'GHG Scope 1 (Industrial)', pillar: 'Industrial', required: true, unit: 'tCO2e' },
    { id: 'IF-EN-120a', label: 'NOx/SOx Emissions', pillar: 'Industrial', required: false, unit: 'tonnes' },
    { id: 'TC-HW-130a', label: 'Data Security (Tech)', pillar: 'Tech', required: true, unit: 'flag' },
    { id: 'TC-SC-430a', label: 'Supply Chain Mgmt (Tech)', pillar: 'Tech', required: false, unit: 'flag' },
    { id: 'CN-AG-140a', label: 'Water Use Efficiency (Cons)', pillar: 'Consumer', required: true, unit: 'm3/tonne' },
    { id: 'CN-AG-430a', label: 'GMO Policy (Consumer)', pillar: 'Consumer', required: false, unit: 'flag' },
    { id: 'HC-MS-330a', label: 'Patient Safety (Health)', pillar: 'Health', required: true, unit: 'count' },
    { id: 'HC-MS-250a', label: 'Ethical Marketing (Health)', pillar: 'Health', required: false, unit: 'flag' },
  ],
};

const COMPANIES = [
  { id: 1, name: 'Shell plc', sector: 'Energy', ticker: 'SHEL', reportYear: 2024, leiCode: '2138005O9XJIJN4JPN90' },
  { id: 2, name: 'HSBC Holdings', sector: 'Financial', ticker: 'HSBA', reportYear: 2024, leiCode: 'MLU0ZO3ML4LN2LL2TL30' },
  { id: 3, name: 'Siemens AG', sector: 'Industrial', ticker: 'SIE', reportYear: 2024, leiCode: 'EVKOSKS7XY1DEII3R011' },
  { id: 4, name: 'SAP SE', sector: 'Tech', ticker: 'SAP', reportYear: 2024, leiCode: 'B84HGKFN1JMM3M0YOP29' },
  { id: 5, name: 'Nestlé SA', sector: 'Consumer', ticker: 'NESN', reportYear: 2024, leiCode: '213800Q7GRZWFQA4JL27' },
  { id: 6, name: 'TotalEnergies SE', sector: 'Energy', ticker: 'TTE', reportYear: 2024, leiCode: '529900S21EQ1BO2MH056' },
  { id: 7, name: 'BNP Paribas SA', sector: 'Financial', ticker: 'BNP', reportYear: 2024, leiCode: 'R0MUWSFPU8MPRO8K5P83' },
  { id: 8, name: 'ArcelorMittal', sector: 'Industrial', ticker: 'MT', reportYear: 2024, leiCode: '549300WHQK5HGN1SBR67' },
  { id: 9, name: 'ASML Holding', sector: 'Tech', ticker: 'ASML', reportYear: 2024, leiCode: '724500Y811OXRZ8SVQ85' },
  { id: 10, name: 'Unilever plc', sector: 'Consumer', ticker: 'ULVR', reportYear: 2024, leiCode: 'PCLCHGSBS17ZS4E65X83' },
  { id: 11, name: 'Equinor ASA', sector: 'Energy', ticker: 'EQNR', reportYear: 2024, leiCode: '5493008YHTYV4UJDV6AB' },
  { id: 12, name: 'Deutsche Bank AG', sector: 'Financial', ticker: 'DBK', reportYear: 2024, leiCode: '7LTWFZYICNSX8D621K86' },
];

const LLM_MODELS = [
  { id: 'claude-opus-4', label: 'Claude Opus 4', cost_per_1k: 0.015, avg_accuracy: 0.94, speed_rating: 3, color: T.purple },
  { id: 'gpt-4o', label: 'GPT-4o', cost_per_1k: 0.010, avg_accuracy: 0.91, speed_rating: 4, color: T.green },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', cost_per_1k: 0.007, avg_accuracy: 0.88, speed_rating: 5, color: T.blue },
  { id: 'mistral-large', label: 'Mistral Large', cost_per_1k: 0.004, avg_accuracy: 0.83, speed_rating: 5, color: T.amber },
];

const LOW_CONF_REASONS = [
  'Ambiguous language — no clear quantitative anchor',
  'No quantitative data found in surrounding context',
  'Outdated reference — base year unclear',
  'Scope boundary not defined',
  'Partial disclosure — incomplete methodology',
  'Contradictory values in different sections',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const confColor = (c) => c >= 0.8 ? T.green : c >= 0.65 ? T.amber : T.red;
const confLabel = (c) => c >= 0.8 ? 'High' : c >= 0.65 ? 'Medium' : 'Low';

const Badge = ({ label, color, small }) => (
  <span style={{
    display: 'inline-block', padding: small ? '1px 6px' : '2px 8px',
    borderRadius: 4, fontSize: small ? 10 : 11, fontWeight: 700,
    background: color + '22', color: color,
    fontFamily: T.mono, letterSpacing: 0.5,
  }}>{label}</span>
);

const Card = ({ children, style = {} }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: 18, marginBottom: 16, ...style,
  }}>{children}</div>
);

const SectionTitle = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
    color: T.navy, fontFamily: T.mono, marginBottom: 12, paddingBottom: 6,
    borderBottom: `1px solid ${T.goldL}`,
  }}>{children}</div>
);

const Stat = ({ label, value, sub, color }) => (
  <div style={{ textAlign: 'center', padding: '10px 16px' }}>
    <div style={{ fontSize: 24, fontWeight: 800, color: color || T.navy, fontFamily: T.mono }}>{value}</div>
    <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: T.textMut, marginTop: 1 }}>{sub}</div>}
  </div>
);

const TABS = ['Extraction Studio', 'Framework Coverage', 'Confidence Intelligence', 'KPI Extraction', 'Multi-Doc Comparison'];

// ─── Component ───────────────────────────────────────────────────────────────

export default function LLMESGExtractorPage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [selectedCompany, setSelectedCompany] = useState(COMPANIES[0]);
  const [selectedModel, setSelectedModel] = useState(LLM_MODELS[0]);
  const [selectedFrameworks, setSelectedFrameworks] = useState(['ESRS', 'TCFD', 'GRI']);
  const [extractionRun, setExtractionRun] = useState(false);
  const [extractionStep, setExtractionStep] = useState(0);
  const [comparisonCompanies, setComparisonCompanies] = useState([COMPANIES[0], COMPANIES[1], COMPANIES[2]]);
  const [uploadedFiles] = useState([
    { name: 'Shell_Annual_Report_2024.pdf', type: 'PDF', size: '8.2 MB', pages: 312 },
    { name: 'Shell_TCFD_Report_2024.pdf', type: 'PDF', size: '2.4 MB', pages: 68 },
    { name: 'Shell_ESG_Data_2024.xbrl', type: 'XBRL', size: '540 KB', pages: null },
  ]);

  const EXTRACTION_STEPS = ['Parsing', 'Chunking', 'Extracting', 'Validating', 'Cross-mapping'];

  // Simulate extraction for selected company
  const extractionResults = useMemo(() => {
    const seed = selectedCompany.id * 31;
    const allFields = selectedFrameworks.flatMap(fw => (FRAMEWORKS[fw] || []).map(f => ({ ...f, framework: fw })));
    return allFields.map((f, i) => {
      const conf = 0.45 + sr(seed + i * 7) * 0.53;
      const extracted = conf > 0.55;
      const pageRef = extracted ? Math.floor(sr(seed + i) * 280) + 20 : null;
      const kpiVal = extracted ? (sr(seed + i * 3) * 900000 + 1000).toFixed(0) : null;
      return {
        ...f,
        confidence: parseFloat(conf.toFixed(3)),
        extracted,
        value: extracted ? (f.unit === 'flag' ? 'Yes' : f.unit === '%' ? (sr(seed + i * 2) * 80 + 10).toFixed(1) + '%' : Number(kpiVal).toLocaleString()) : 'NOT FOUND',
        pageRef,
        lowConf: conf < 0.65,
        reason: conf < 0.65 ? LOW_CONF_REASONS[Math.floor(sr(seed + i * 5) * LOW_CONF_REASONS.length)] : null,
      };
    });
  }, [selectedCompany, selectedFrameworks]);

  const summaryStats = useMemo(() => {
    const extracted = extractionResults.filter(r => r.extracted);
    const avgConf = extracted.length ? extracted.reduce((a, b) => a + b.confidence, 0) / extracted.length : 0;
    const tokens = Math.floor(sr(selectedCompany.id * 13) * 40000 + 60000);
    return {
      total: extractionResults.length,
      extracted: extracted.length,
      avgConf: avgConf.toFixed(2),
      lowConf: extractionResults.filter(r => r.lowConf && r.extracted).length,
      missing: extractionResults.filter(r => !r.extracted).length,
      tokens,
      cost: (tokens * selectedModel.cost_per_1k / 1000).toFixed(2),
      time: (sr(selectedCompany.id) * 20 + 15).toFixed(0),
    };
  }, [extractionResults, selectedModel, selectedCompany]);

  // Framework coverage per framework
  const frameworkCoverage = useMemo(() => {
    const fws = ['ESRS', 'ISSB', 'TCFD', 'GRI', 'SASB'];
    return fws.map(fw => {
      const fields = FRAMEWORKS[fw] || [];
      const seed = selectedCompany.id * 17 + fws.indexOf(fw) * 5;
      const covered = fields.filter((_, i) => sr(seed + i * 9) > 0.38).length;
      return { framework: fw, coverage: Math.round((covered / fields.length) * 100), total: fields.length, covered };
    });
  }, [selectedCompany]);

  const radarData = useMemo(() => frameworkCoverage.map(f => ({ subject: f.framework, A: f.coverage })), [frameworkCoverage]);

  const histogramData = useMemo(() => {
    const buckets = [
      { range: '0–50%', min: 0, max: 0.5 },
      { range: '50–65%', min: 0.5, max: 0.65 },
      { range: '65–70%', min: 0.65, max: 0.7 },
      { range: '70–80%', min: 0.7, max: 0.8 },
      { range: '80–90%', min: 0.8, max: 0.9 },
      { range: '90–100%', min: 0.9, max: 1.01 },
    ];
    return buckets.map(b => ({
      range: b.range,
      count: extractionResults.filter(r => r.confidence >= b.min && r.confidence < b.max).length,
    }));
  }, [extractionResults]);

  const crossMappingFields = [
    { label: 'GHG Scope 1', esrs: 'E1-6', issb: 'S2-C1', tcfd: 'MC-2', gri: '305-1', sasb: 'EM-EP-110a' },
    { label: 'GHG Scope 2', esrs: 'E1-7', issb: 'S2-C2', tcfd: 'MC-2', gri: '305-2', sasb: '—' },
    { label: 'GHG Scope 3', esrs: 'E1-8', issb: 'S2-C3', tcfd: 'MC-2', gri: '305-3', sasb: '—' },
    { label: 'Climate Targets', esrs: 'E1-4', issb: 'S2-C5', tcfd: 'MC-3', gri: '—', sasb: '—' },
    { label: 'Board Oversight', esrs: 'G1-1', issb: 'S2-A1', tcfd: 'G-1', gri: '102-16', sasb: '—' },
    { label: 'Scenario Analysis', esrs: 'E1-3', issb: 'S2-D1', tcfd: 'ST-3', gri: '201-2', sasb: '—' },
  ];

  // Scatter data for confidence intelligence
  const scatterData = useMemo(() => {
    return extractionResults.filter(r => r.extracted).map((r, i) => ({
      x: parseFloat((sr(r.id ? r.id : i * 3) * 10).toFixed(2)),
      y: r.confidence,
      framework: r.framework,
      label: r.label,
      size: r.required ? 8 : 5,
    }));
  }, [extractionResults]);

  // Model comparison data
  const modelCompData = useMemo(() => {
    const fws = ['ESRS', 'ISSB', 'TCFD', 'GRI'];
    return fws.map(fw => {
      const entry = { framework: fw };
      LLM_MODELS.forEach((m, mi) => {
        entry[m.id] = parseFloat((m.avg_accuracy - sr(mi * 7 + fws.indexOf(fw) * 3) * 0.08).toFixed(2));
      });
      return entry;
    });
  }, []);

  // KPI data
  const kpiData = useMemo(() => {
    const seed = selectedCompany.id * 23;
    const kpis = [
      { label: 'GHG Scope 1', unit: 'ktCO2e', key: 'scope1', sectorAvg: 4800, topQ: 2200 },
      { label: 'GHG Scope 2', unit: 'ktCO2e', key: 'scope2', sectorAvg: 1200, topQ: 450 },
      { label: 'GHG Scope 3', unit: 'ktCO2e', key: 'scope3', sectorAvg: 28000, topQ: 12000 },
      { label: 'Energy Intensity', unit: 'GJ/€m rev', key: 'energy', sectorAvg: 320, topQ: 140 },
      { label: 'Water Intensity', unit: 'm³/€m rev', key: 'water', sectorAvg: 850, topQ: 310 },
      { label: 'Waste Recycling', unit: '%', key: 'waste', sectorAvg: 62, topQ: 85 },
      { label: 'Board Diversity', unit: '% female', key: 'board', sectorAvg: 34, topQ: 48 },
      { label: 'Pay Gap', unit: '% gap', key: 'paygap', sectorAvg: 18, topQ: 8 },
      { label: 'LTIFR', unit: 'per 1M hrs', key: 'ltifr', sectorAvg: 1.8, topQ: 0.6 },
      { label: 'R&D Spend', unit: '% revenue', key: 'rnd', sectorAvg: 3.2, topQ: 7.1 },
    ];
    return kpis.map((k, i) => {
      const extracted = parseFloat((k.sectorAvg * (0.5 + sr(seed + i * 11) * 0.9)).toFixed(1));
      const delta = extracted - k.sectorAvg;
      const flags = [];
      if (sr(seed + i * 2) < 0.25) flags.push('Assured');
      if (sr(seed + i * 3) < 0.12) flags.push('Restatement');
      if (sr(seed + i * 4) < 0.18) flags.push('Boundary change');
      if (sr(seed + i * 5) < 0.15) flags.push('Estimation');
      return { ...k, extracted, delta, flags };
    });
  }, [selectedCompany]);

  const trendData = useMemo(() => {
    const seed = selectedCompany.id * 19;
    return [2020, 2021, 2022, 2023, 2024].map((year, i) => ({
      year,
      scope1: Math.round(5000 - sr(seed + i * 7) * 200 - i * 250),
      scope2: Math.round(1400 - sr(seed + i * 5) * 100 - i * 120),
    }));
  }, [selectedCompany]);

  // Multi-doc comparison
  const companyScores = useMemo(() => {
    return COMPANIES.map(c => {
      const seed = c.id * 41;
      const completeness = Math.round(50 + sr(seed) * 45);
      const confidence = parseFloat((0.55 + sr(seed + 1) * 0.38).toFixed(2));
      const quantRate = Math.round(40 + sr(seed + 2) * 50);
      const assured = sr(seed + 3) > 0.5;
      const score = Math.round(completeness * 0.35 + confidence * 100 * 0.30 + quantRate * 0.25 + (assured ? 100 : 0) * 0.10);
      return { ...c, completeness, confidence, quantRate, assured, score };
    });
  }, []);

  const toggleFramework = (fw) => {
    setSelectedFrameworks(prev =>
      prev.includes(fw) ? prev.filter(f => f !== fw) : [...prev, fw]
    );
  };

  const toggleComparisonCompany = (c) => {
    setComparisonCompanies(prev => {
      if (prev.find(p => p.id === c.id)) return prev.filter(p => p.id !== c.id);
      if (prev.length >= 4) return prev;
      return [...prev, c];
    });
  };

  const runExtraction = () => {
    setExtractionRun(false);
    setExtractionStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setExtractionStep(step);
      if (step >= EXTRACTION_STEPS.length) {
        clearInterval(interval);
        setExtractionRun(true);
      }
    }, 400);
  };

  const fwColors = { ESRS: T.navy, ISSB: T.teal, TCFD: T.amber, GRI: T.green, SASB: T.purple };

  // ─── Render helpers ──────────────────────────────────────────────────────────

  const renderExtractionStudio = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
      {/* Left panel */}
      <div>
        <Card>
          <SectionTitle>Document Upload</SectionTitle>
          <div style={{
            border: `2px dashed ${T.borderL}`, borderRadius: 8, padding: '20px 16px',
            textAlign: 'center', marginBottom: 12, background: T.surfaceH,
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
            <div style={{ fontSize: 12, color: T.textSec }}>Drag & drop PDF / HTML / XBRL reports</div>
            <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>or click to browse</div>
          </div>
          {uploadedFiles.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
              background: T.surfaceH, borderRadius: 6, marginBottom: 6,
            }}>
              <Badge label={f.type} color={f.type === 'PDF' ? T.red : f.type === 'XBRL' ? T.blue : T.green} small />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{f.name}</div>
                <div style={{ fontSize: 10, color: T.textMut }}>{f.size}{f.pages ? ` · ${f.pages}p` : ''}</div>
              </div>
              <span style={{ fontSize: 14, color: T.green }}>✓</span>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>LLM Model</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Model', 'Acc', 'Cost/1k', 'Speed'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '4px 6px', color: T.textMut, fontWeight: 600, fontFamily: T.mono }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LLM_MODELS.map(m => (
                <tr key={m.id} onClick={() => setSelectedModel(m)} style={{
                  cursor: 'pointer', background: selectedModel.id === m.id ? T.navy + '11' : 'transparent',
                  borderBottom: `1px solid ${T.border}`,
                }}>
                  <td style={{ padding: '5px 6px', fontWeight: 600, color: m.color, fontFamily: T.mono, fontSize: 10 }}>{m.label}</td>
                  <td style={{ padding: '5px 6px', color: T.text }}>{(m.avg_accuracy * 100).toFixed(0)}%</td>
                  <td style={{ padding: '5px 6px', color: T.text }}>${m.cost_per_1k}</td>
                  <td style={{ padding: '5px 6px' }}>{'●'.repeat(m.speed_rating)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <SectionTitle>Framework Selection</SectionTitle>
          {Object.keys(FRAMEWORKS).map(fw => (
            <label key={fw} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={selectedFrameworks.includes(fw)} onChange={() => toggleFramework(fw)}
                style={{ accentColor: fwColors[fw] }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: fwColors[fw], fontFamily: T.mono }}>{fw}</span>
              <span style={{ fontSize: 10, color: T.textMut }}>({(FRAMEWORKS[fw] || []).length} fields)</span>
            </label>
          ))}
        </Card>

        <Card>
          <SectionTitle>Company</SectionTitle>
          <select value={selectedCompany.id} onChange={e => setSelectedCompany(COMPANIES.find(c => c.id === parseInt(e.target.value)))}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12, background: T.surface, color: T.navy }}>
            {COMPANIES.map(c => (
              <option key={c.id} value={c.id}>{c.ticker} — {c.name}</option>
            ))}
          </select>
          <button onClick={runExtraction} style={{
            marginTop: 12, width: '100%', padding: '10px 0', background: T.navy, color: '#fff',
            border: 'none', borderRadius: 6, fontFamily: T.mono, fontSize: 12, fontWeight: 700,
            cursor: 'pointer', letterSpacing: 0.5,
          }}>▶ RUN EXTRACTION</button>
          {extractionStep > 0 && !extractionRun && (
            <div style={{ marginTop: 10 }}>
              {EXTRACTION_STEPS.map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: i < extractionStep ? T.green : T.textMut, fontSize: 12 }}>{i < extractionStep ? '✓' : '○'}</span>
                  <span style={{ fontSize: 11, color: i < extractionStep ? T.navy : T.textMut }}>{s}</span>
                  {i === extractionStep - 1 && !extractionRun && <span style={{ fontSize: 10, color: T.amber }}>⟳</span>}
                </div>
              ))}
            </div>
          )}
          {extractionRun && (
            <div style={{ marginTop: 8, fontSize: 11, color: T.green, fontFamily: T.mono, textAlign: 'center' }}>
              ✓ Extraction complete
            </div>
          )}
        </Card>
      </div>

      {/* Right panel */}
      <div>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, marginBottom: 16, borderBottom: `1px solid ${T.border}`, paddingBottom: 16 }}>
            <Stat label="Total Fields" value={summaryStats.total} />
            <Stat label="Extracted" value={summaryStats.extracted} color={T.green} />
            <Stat label="Avg Confidence" value={summaryStats.avgConf} color={confColor(parseFloat(summaryStats.avgConf))} />
            <Stat label="Low Confidence" value={summaryStats.lowConf} color={T.amber} />
            <Stat label="Proc. Time" value={`${summaryStats.time}s`} color={T.blue} />
            <Stat label="Token Cost" value={`$${summaryStats.cost}`} color={T.navy} sub={`${(summaryStats.tokens / 1000).toFixed(0)}k tokens`} />
          </div>

          <SectionTitle>Extraction Results</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  {['Field ID', 'Framework', 'Field Name', 'Extracted Value', 'Unit', 'Confidence', 'Page', 'Status'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.textSec, fontWeight: 700, fontFamily: T.mono, fontSize: 10, whiteSpace: 'nowrap', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {extractionResults.slice(0, 60).map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH + '88' }}>
                    <td style={{ padding: '5px 8px', fontFamily: T.mono, color: fwColors[r.framework] || T.navy, fontSize: 10 }}>{r.id}</td>
                    <td style={{ padding: '5px 8px' }}><Badge label={r.framework} color={fwColors[r.framework] || T.navy} small /></td>
                    <td style={{ padding: '5px 8px', color: T.navy, fontWeight: 500, maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</td>
                    <td style={{ padding: '5px 8px', color: r.extracted ? T.text : T.textMut, fontFamily: r.extracted ? 'inherit' : T.mono, fontSize: r.extracted ? 11 : 10 }}>{r.value}</td>
                    <td style={{ padding: '5px 8px', color: T.textMut, fontFamily: T.mono, fontSize: 10 }}>{r.unit}</td>
                    <td style={{ padding: '5px 8px' }}>
                      <span style={{ color: confColor(r.confidence), fontFamily: T.mono, fontWeight: 700 }} title={r.reason || 'Confidence based on semantic match + cross-validation'}>
                        {(r.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td style={{ padding: '5px 8px', color: T.textMut, fontFamily: T.mono, fontSize: 10 }}>{r.pageRef || '—'}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                      {!r.extracted ? <span style={{ color: T.red }}>✗</span> : r.lowConf ? <span style={{ color: T.amber }}>⚠</span> : <span style={{ color: T.green }}>✓</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderFrameworkCoverage = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card>
          <SectionTitle>Multi-Framework Coverage Radar</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.borderL} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: T.navy, fontSize: 11, fontFamily: T.mono, fontWeight: 700 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: T.textMut, fontSize: 9 }} />
              <Radar name="Coverage" dataKey="A" stroke={T.gold} fill={T.gold} fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
            {frameworkCoverage.map(f => (
              <div key={f.framework} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: fwColors[f.framework], fontFamily: T.mono }}>{f.coverage}%</div>
                <div style={{ fontSize: 10, color: T.textMut }}>{f.framework}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Confidence Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={histogramData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: T.textSec, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 11, border: `1px solid ${T.border}` }} />
              <Bar dataKey="count" fill={T.navyL} radius={[4, 4, 0, 0]}>
                {histogramData.map((d, i) => (
                  <Cell key={i} fill={d.range.startsWith('0') ? T.red : d.range.startsWith('5') ? T.amber : d.range.startsWith('9') ? T.green : T.navyL} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionTitle>Cross-Framework Field Mapping</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['ESG Topic', 'ESRS', 'ISSB', 'TCFD', 'GRI', 'SASB'].map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.textSec, fontFamily: T.mono, fontSize: 10, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {crossMappingFields.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH + '88' }}>
                <td style={{ padding: '6px 10px', fontWeight: 700, color: T.navy }}>{r.label}</td>
                {['esrs', 'issb', 'tcfd', 'gri', 'sasb'].map(fw => (
                  <td key={fw} style={{ padding: '6px 10px' }}>
                    {r[fw] !== '—' ? <Badge label={r[fw]} color={fwColors[fw.toUpperCase()] || T.navy} small /> : <span style={{ color: T.textMut }}>—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <SectionTitle>Coverage Gap — Mandatory Fields Missing or Low Confidence</SectionTitle>
        {extractionResults.filter(r => r.required && (!r.extracted || r.lowConf)).slice(0, 12).map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 12px', marginBottom: 6,
            background: T.surfaceH, borderRadius: 6, borderLeft: `3px solid ${r.extracted ? T.amber : T.red}`,
          }}>
            <Badge label={r.framework} color={fwColors[r.framework] || T.navy} small />
            <Badge label={r.id} color={T.navy} small />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{r.label}</span>
              <span style={{ fontSize: 10, color: T.textMut, marginLeft: 8 }}>Confidence: {(r.confidence * 100).toFixed(0)}%</span>
            </div>
            <div style={{ fontSize: 10, color: T.textSec }}>{r.extracted ? 'Low confidence — needs review' : 'Field not found in source'}</div>
          </div>
        ))}
      </Card>
    </div>
  );

  const renderConfidenceIntelligence = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card>
          <SectionTitle>Field Importance vs Confidence (Scatter)</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 8, right: 16, left: -10, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" name="Importance" type="number" domain={[0, 10]} tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Field Importance', position: 'insideBottom', offset: -2, fontSize: 10, fill: T.textMut }} />
              <YAxis dataKey="y" name="Confidence" domain={[0.4, 1]} tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Confidence', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: T.textMut }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontFamily: T.font, fontSize: 11, border: `1px solid ${T.border}` }}
                formatter={(val, name) => [typeof val === 'number' ? val.toFixed(2) : val, name]} />
              {Object.keys(fwColors).map(fw => (
                <Scatter key={fw} name={fw} data={scatterData.filter(d => d.framework === fw)}
                  fill={fwColors[fw]} fillOpacity={0.7} />
              ))}
              <Legend />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Model Comparison — Avg Confidence by Framework</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={modelCompData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="framework" tick={{ fontSize: 10, fill: T.textSec, fontFamily: T.mono }} />
              <YAxis domain={[0.7, 1]} tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 11, border: `1px solid ${T.border}` }}
                formatter={(val) => [(val * 100).toFixed(1) + '%']} />
              <Legend />
              {LLM_MODELS.map(m => (
                <Bar key={m.id} dataKey={m.id} name={m.label} fill={m.color} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionTitle>Low Confidence Queue — Fields Below 65% Threshold</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Framework', 'Field ID', 'Field Name', 'Confidence', 'Reason for Low Confidence', 'Suggested Prompt Refinement'].map(h => (
                <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.textSec, fontFamily: T.mono, fontSize: 10, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {extractionResults.filter(r => r.lowConf && r.extracted).slice(0, 20).map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH + '88' }}>
                <td style={{ padding: '5px 8px' }}><Badge label={r.framework} color={fwColors[r.framework] || T.navy} small /></td>
                <td style={{ padding: '5px 8px', fontFamily: T.mono, fontSize: 10, color: T.navy }}>{r.id}</td>
                <td style={{ padding: '5px 8px', color: T.navy, fontWeight: 500 }}>{r.label}</td>
                <td style={{ padding: '5px 8px' }}>
                  <span style={{ color: confColor(r.confidence), fontFamily: T.mono, fontWeight: 700 }}>{(r.confidence * 100).toFixed(0)}%</span>
                </td>
                <td style={{ padding: '5px 8px', color: T.red, fontSize: 10 }}>{r.reason}</td>
                <td style={{ padding: '5px 8px', color: T.blue, fontSize: 10, fontStyle: 'italic' }}>
                  {r.reason?.includes('quantitative') ? 'Request specific numeric values with units' :
                   r.reason?.includes('Ambiguous') ? 'Ask model to identify reporting boundary first' :
                   r.reason?.includes('Outdated') ? 'Specify base year and reporting period explicitly' :
                   r.reason?.includes('Scope') ? 'Prompt with organisational boundary definition' :
                   'Re-run with higher-context chunking strategy'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );

  const renderKPIExtraction = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card>
          <SectionTitle>Extracted KPI vs Peer Benchmarks</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['KPI', 'Unit', 'Extracted', 'Sector Avg', 'Top Quartile', 'vs. Avg', 'Flags'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.textSec, fontFamily: T.mono, fontSize: 10, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kpiData.map((k, i) => {
                const better = k.key === 'board' || k.key === 'waste' || k.key === 'rnd' ? k.extracted > k.sectorAvg : k.extracted < k.sectorAvg;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH + '88' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 600, color: T.navy }}>{k.label}</td>
                    <td style={{ padding: '5px 8px', fontFamily: T.mono, fontSize: 10, color: T.textMut }}>{k.unit}</td>
                    <td style={{ padding: '5px 8px', fontFamily: T.mono, fontWeight: 700, color: T.navy }}>{k.extracted.toLocaleString()}</td>
                    <td style={{ padding: '5px 8px', color: T.textSec }}>{k.sectorAvg.toLocaleString()}</td>
                    <td style={{ padding: '5px 8px', color: T.green }}>{k.topQ.toLocaleString()}</td>
                    <td style={{ padding: '5px 8px' }}>
                      <span style={{ color: better ? T.green : T.red, fontFamily: T.mono, fontWeight: 700, fontSize: 10 }}>
                        {better ? '▲' : '▼'} {Math.abs(k.delta).toFixed(0)}
                      </span>
                    </td>
                    <td style={{ padding: '5px 8px' }}>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {k.flags.map(f => (
                          <Badge key={f} label={f} color={f === 'Assured' ? T.green : f === 'Restatement' ? T.red : f === 'Boundary change' ? T.amber : T.blue} small />
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card>
          <SectionTitle>GHG Emissions Trend 2020–2024</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 11, border: `1px solid ${T.border}` }}
                formatter={(v) => [v.toLocaleString() + ' ktCO2e']} />
              <Legend />
              <Area type="monotone" dataKey="scope1" name="Scope 1" stroke={T.navy} fill={T.navy + '33'} strokeWidth={2} />
              <Area type="monotone" dataKey="scope2" name="Scope 2" stroke={T.teal} fill={T.teal + '33'} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: T.textMut, textAlign: 'center', marginTop: 4, fontFamily: T.mono }}>
            Extracted from {selectedCompany.name} annual reports 2020–2024 via {selectedModel.label}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderMultiDoc = () => (
    <div>
      <Card>
        <SectionTitle>Company Selector (max 4)</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {COMPANIES.map(c => {
            const sel = comparisonCompanies.find(p => p.id === c.id);
            return (
              <button key={c.id} onClick={() => toggleComparisonCompany(c)} style={{
                padding: '5px 12px', borderRadius: 16, border: `1px solid ${sel ? T.navy : T.borderL}`,
                background: sel ? T.navy : T.surface, color: sel ? '#fff' : T.textSec,
                fontFamily: T.mono, fontSize: 11, cursor: 'pointer', fontWeight: sel ? 700 : 400,
              }}>{c.ticker}</button>
            );
          })}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${comparisonCompanies.length}, 1fr)`, gap: 16, marginBottom: 20 }}>
        {comparisonCompanies.map(c => {
          const sc = companyScores.find(s => s.id === c.id) || {};
          return (
            <Card key={c.id} style={{ border: `2px solid ${T.gold}` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.navy, marginBottom: 2 }}>{c.ticker}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>{c.name} · {c.sector}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: sc.score > 70 ? T.green : sc.score > 50 ? T.amber : T.red, fontFamily: T.mono, marginBottom: 8 }}>{sc.score}</div>
              <div style={{ fontSize: 10, color: T.textMut, marginBottom: 12 }}>Disclosure Quality Score /100</div>
              {[
                { label: 'Completeness', val: sc.completeness + '%', color: T.navy },
                { label: 'Avg Confidence', val: (sc.confidence * 100).toFixed(0) + '%', color: confColor(sc.confidence) },
                { label: 'Quantification Rate', val: sc.quantRate + '%', color: T.blue },
                { label: 'Third-Party Assured', val: sc.assured ? 'Yes' : 'No', color: sc.assured ? T.green : T.textMut },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
                  <span style={{ color: T.textSec }}>{item.label}</span>
                  <span style={{ fontFamily: T.mono, fontWeight: 700, color: item.color }}>{item.val}</span>
                </div>
              ))}
            </Card>
          );
        })}
      </div>

      <Card>
        <SectionTitle>Disclosure Quality Comparison</SectionTitle>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={comparisonCompanies.map(c => {
            const sc = companyScores.find(s => s.id === c.id) || {};
            return { name: c.ticker, score: sc.score, completeness: sc.completeness, confidence: Math.round((sc.confidence || 0) * 100) };
          })} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.mono, fontWeight: 700 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: T.textSec }} />
            <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 11, border: `1px solid ${T.border}` }} />
            <Legend />
            <Bar dataKey="score" name="Quality Score" fill={T.navy} radius={[4, 4, 0, 0]} />
            <Bar dataKey="completeness" name="Completeness %" fill={T.gold} radius={[4, 4, 0, 0]} />
            <Bar dataKey="confidence" name="Avg Confidence %" fill={T.teal} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionTitle>Key Disclosure Discrepancies</SectionTitle>
        {[
          { field: 'GHG Scope 3 Boundary', note: 'Companies use different value chain boundaries — some include purchased goods & services, others exclude upstream transport' },
          { field: 'Base Year for Targets', note: 'Base years range from 2019 to 2021 across selected companies, making direct reduction comparison misleading' },
          { field: 'Energy Intensity Denominator', note: 'Some companies use revenue-based intensity, others use production volume — not directly comparable' },
          { field: 'Water Stress Definition', note: 'WRI Aqueduct vs SASB definitions produce different "stressed area" classifications' },
        ].map((d, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12, padding: '8px 12px', marginBottom: 6,
            background: T.surfaceH, borderRadius: 6, borderLeft: `3px solid ${T.amber}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, minWidth: 160 }}>{d.field}</div>
            <div style={{ fontSize: 11, color: T.textSec }}>{d.note}</div>
          </div>
        ))}
      </Card>
    </div>
  );

  // ─── Main render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font }}>
      {/* Gold accent line */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${T.gold}, ${T.goldL}, ${T.gold})` }} />

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '20px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 6, letterSpacing: 0.5 }}>
            RISK ANALYTICS / ESG INTELLIGENCE / EP-BY1
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: T.navy, letterSpacing: -0.5 }}>
                LLM ESG Field Extractor
              </h1>
              <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>
                Structured extraction of ESG disclosures · Confidence scoring · Framework cross-mapping
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Badge label={selectedCompany.ticker} color={T.navy} />
              <Badge label={selectedModel.label} color={selectedModel.color} />
              <Badge label={`${selectedFrameworks.length} Frameworks`} color={T.gold} />
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: `2px solid ${T.gold}`, marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: T.font, fontSize: 13, fontWeight: activeTab === t ? 700 : 400,
              color: activeTab === t ? T.navy : T.textSec,
              borderBottom: activeTab === t ? `3px solid ${T.gold}` : '3px solid transparent',
              marginBottom: -2, whiteSpace: 'nowrap',
            }}>{t}</button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'Extraction Studio' && renderExtractionStudio()}
        {activeTab === 'Framework Coverage' && renderFrameworkCoverage()}
        {activeTab === 'Confidence Intelligence' && renderConfidenceIntelligence()}
        {activeTab === 'KPI Extraction' && renderKPIExtraction()}
        {activeTab === 'Multi-Doc Comparison' && renderMultiDoc()}
      </div>

      {/* Terminal status bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 24,
        background: T.navy, display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 24,
      }}>
        {[
          `EP-BY1 · LLM ESG Field Extractor`,
          `Company: ${selectedCompany.ticker}`,
          `Model: ${selectedModel.label}`,
          `Fields: ${summaryStats.extracted}/${summaryStats.total} extracted`,
          `Avg conf: ${summaryStats.avgConf}`,
          `Est. cost: $${summaryStats.cost}`,
        ].map((item, i) => (
          <span key={i} style={{ fontFamily: T.mono, fontSize: 10, color: i === 0 ? T.gold : T.goldL + '99' }}>{item}</span>
        ))}
      </div>
    </div>
  );
}
