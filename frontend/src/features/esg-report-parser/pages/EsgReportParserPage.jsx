import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7', border: '#e5e0d8',
  borderL: '#d5cfc5', navy: '#1b3a5c', navyL: '#2c5a8c', gold: '#c5a96a',
  goldL: '#d4be8a', sage: '#5a8a6a', sageL: '#7ba67d', teal: '#5a8a6a',
  text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae', red: '#dc2626',
  green: '#16a34a', amber: '#d97706', blue: '#2563eb', orange: '#ea580c',
  purple: '#7c3aed',
  font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const DEMO_TEXT = `SUSTAINABILITY REPORT 2023 — MERIDIAN ENERGY GROUP PLC

Climate & Emissions

Meridian Energy Group remains committed to achieving net-zero greenhouse gas emissions across Scopes 1, 2 and 3 by 2045, aligned with a 1.5°C pathway validated by the Science Based Targets initiative (SBTi). In 2023, our total Scope 1 emissions were 4.2 million tCO2e, a reduction of 11% from the 2022 baseline of 4.72 million tCO2e. Scope 2 market-based emissions declined to 0.87 million tCO2e (location-based: 1.14 million tCO2e), reflecting our expanded power purchase agreements covering 68% of electricity consumption from renewables. Scope 3 Category 11 (Use of Sold Products) accounts for 87.4 million tCO2e, representing 93% of our total value-chain footprint. We have engaged 124 key suppliers representing 78% of procurement spend in our Science Based Targets supply chain programme. Carbon intensity improved to 22.3 kgCO2e per barrel of oil equivalent (2022: 24.8 kgCO2e/boe).

Energy Transition & Renewables

Total energy consumption reached 312 PJ in 2023 (2022: 334 PJ). Renewable electricity consumption grew to 4.8 TWh, representing 14% of total electricity use (2022: 9%). Capital expenditure allocated to low-carbon projects was USD 2.4 billion, constituting 18% of total capex. We have a pipeline of 3.2 GW of renewable energy capacity under development, targeting commissioning by 2027.

Water & Biodiversity

Freshwater withdrawal totalled 48.2 million cubic metres in 2023 (2022: 51.6 Mm³), a 7% year-on-year improvement. Water intensity fell to 0.42 m³ per tonne of production. 100% of our operational sites in water-stressed areas now maintain Water Stewardship Plans aligned with the Alliance for Water Stewardship standard. We have committed to No Net Loss of biodiversity at all new projects commencing after 2024, with TNFD-aligned nature disclosures published for 6 material sites.

Workforce & Safety

Total employees: 28,400 as at 31 December 2023 (2022: 26,900). Total Recordable Injury Frequency Rate (TRIFR) of 0.82 per million hours worked, below our target of 1.0 and representing a 14% improvement. Regrettably, we recorded zero fatalities in 2023. Female representation in the workforce stands at 34% (2022: 31%), with women comprising 28% of senior leadership roles (2022: 24%). The gender pay gap (median) stands at 12.4% in favour of males, down from 15.1% in 2022. Employee turnover was 8.2% (2022: 9.7%). We invested USD 142 million in employee training and development, equivalent to 48 hours per employee per year.

Governance & Ethics

The Board comprises 11 directors, of whom 7 (64%) are independent non-executive directors. The Board Sustainability Committee met 6 times in 2023 and reviewed all material climate and nature-related risks. Our effective tax rate was 28.4%. Zero incidents of confirmed bribery or corruption were recorded. 1,847 reports were received through our whistleblowing hotline, 94% of which were investigated and closed within 60 days. Executive remuneration includes a 20% weighting on ESG KPIs including emissions intensity and safety performance.

Economic Performance

Revenue: USD 48.7 billion (2022: USD 52.1 billion). Net income: USD 4.2 billion. Total assets: USD 89.3 billion. Return on average capital employed (ROACE): 9.4%.`;

const FRAMEWORKS = ['ESRS', 'ISSB S1/S2', 'TCFD', 'GRI', 'SASB', 'CDP'];

const ALL_TOPICS = [
  'climate', 'energy', 'water', 'biodiversity', 'waste', 'pollution',
  'workforce', 'health_safety', 'diversity', 'human_rights', 'community',
  'product', 'board', 'ethics', 'compensation', 'tax', 'risk', 'shareholder'
];

const TOPIC_LABELS = {
  climate: 'Climate Change', energy: 'Energy', water: 'Water & Marine',
  biodiversity: 'Biodiversity', waste: 'Waste & Circular', pollution: 'Pollution',
  workforce: 'Own Workforce', health_safety: 'Health & Safety', diversity: 'Diversity & Inclusion',
  human_rights: 'Human Rights', community: 'Community', product: 'Product Safety',
  board: 'Board & Governance', ethics: 'Ethics & Conduct', compensation: 'Compensation',
  tax: 'Tax Transparency', risk: 'Risk Management', shareholder: 'Shareholder Rights'
};

const TOPIC_PILLAR = {
  climate: 'E', energy: 'E', water: 'E', biodiversity: 'E', waste: 'E', pollution: 'E',
  workforce: 'S', health_safety: 'S', diversity: 'S', human_rights: 'S', community: 'S', product: 'S',
  board: 'G', ethics: 'G', compensation: 'G', tax: 'G', risk: 'G', shareholder: 'G'
};

const PILLAR_COLORS = { E: T.sage, S: T.gold, G: T.navy };

const FRAMEWORK_MAPPING = {
  climate: { ESRS: 'E1-6 GHG Emissions', 'ISSB S1/S2': 'S2-C1 Transition Risk', TCFD: 'Metrics & Targets', GRI: 'GRI 305', SASB: 'EM-EP-110a', CDP: 'C6.1 Scope 1' },
  energy: { ESRS: 'E1-5 Energy Mix', 'ISSB S1/S2': 'S2-B6 Energy', TCFD: 'Strategy', GRI: 'GRI 302', SASB: 'EM-EP-130a', CDP: 'C8 Energy' },
  water: { ESRS: 'E3-1 Water Withdrawal', 'ISSB S1/S2': 'S2-B9 Physical Risk', TCFD: 'Physical Risk', GRI: 'GRI 303', SASB: 'EM-EP-140a', CDP: 'W1 Water' },
  biodiversity: { ESRS: 'E4-1 Biodiversity', 'ISSB S1/S2': 'S2-B7 Nature', TCFD: 'Physical Risk', GRI: 'GRI 304', SASB: 'n/a', CDP: 'F6 Forest' },
  waste: { ESRS: 'E5-1 Resource Use', 'ISSB S1/S2': 'S2-B8 Waste', TCFD: 'n/a', GRI: 'GRI 306', SASB: 'EM-EP-150a', CDP: 'n/a' },
  pollution: { ESRS: 'E2-1 Pollution', 'ISSB S1/S2': 'n/a', TCFD: 'n/a', GRI: 'GRI 305-7', SASB: 'EM-EP-120a', CDP: 'C5.2' },
  workforce: { ESRS: 'S1-1 Own Workforce', 'ISSB S1/S2': 'S1-C3 Human Capital', TCFD: 'n/a', GRI: 'GRI 401', SASB: 'HC-101', CDP: 'n/a' },
  health_safety: { ESRS: 'S1-8 Safety', 'ISSB S1/S2': 'S1-C3 Human Capital', TCFD: 'n/a', GRI: 'GRI 403', SASB: 'HC-320', CDP: 'n/a' },
  diversity: { ESRS: 'S1-9 Diversity', 'ISSB S1/S2': 'S1-C3 Human Capital', TCFD: 'n/a', GRI: 'GRI 405', SASB: 'HC-330', CDP: 'n/a' },
  human_rights: { ESRS: 'S2-1 Value Chain', 'ISSB S1/S2': 'n/a', TCFD: 'n/a', GRI: 'GRI 412', SASB: 'n/a', CDP: 'n/a' },
  community: { ESRS: 'S3-1 Communities', 'ISSB S1/S2': 'n/a', TCFD: 'n/a', GRI: 'GRI 413', SASB: 'n/a', CDP: 'n/a' },
  product: { ESRS: 'S4-1 Consumers', 'ISSB S1/S2': 'n/a', TCFD: 'n/a', GRI: 'GRI 416', SASB: 'n/a', CDP: 'n/a' },
  board: { ESRS: 'G1-1 Board', 'ISSB S1/S2': 'S1-A Governance', TCFD: 'Governance', GRI: 'GRI 405-1', SASB: 'CG-101', CDP: 'C1 Governance' },
  ethics: { ESRS: 'G1-3 Ethics', 'ISSB S1/S2': 'S1-A Governance', TCFD: 'Governance', GRI: 'GRI 205', SASB: 'CG-510', CDP: 'C1.3' },
  compensation: { ESRS: 'G1-4 Remuneration', 'ISSB S1/S2': 'S1-A Governance', TCFD: 'n/a', GRI: 'GRI 2-19', SASB: 'CG-102', CDP: 'n/a' },
  tax: { ESRS: 'G1-6 Tax', 'ISSB S1/S2': 'n/a', TCFD: 'n/a', GRI: 'GRI 207', SASB: 'n/a', CDP: 'n/a' },
  risk: { ESRS: 'G1-2 Risk Mgmt', 'ISSB S1/S2': 'S1-B Risk Mgmt', TCFD: 'Risk Management', GRI: 'GRI 2-25', SASB: 'n/a', CDP: 'C2 Risks' },
  shareholder: { ESRS: 'G1-1 Governance', 'ISSB S1/S2': 'n/a', TCFD: 'n/a', GRI: 'GRI 2-9', SASB: 'CG-101', CDP: 'n/a' }
};

const TOPIC_KEYWORDS = {
  climate: ['carbon', 'emission', 'ghg', 'greenhouse', 'co2', 'scope 1', 'scope 2', 'scope 3', 'net zero', 'decarboni', 'sbti', 'paris', '1.5'],
  energy: ['renewable', 'solar', 'wind', 'energy', 'kwh', 'mwh', 'gwh', 'electricity', 'power purchase', 'fossil', 'pj', 'twh'],
  water: ['water', 'freshwater', 'wastewater', 'effluent', 'water stress', 'cubic metre'],
  biodiversity: ['biodiversity', 'deforestation', 'habitat', 'species', 'ecosystem', 'tnfd', 'nature', 'land use'],
  waste: ['waste', 'recycl', 'circular', 'hazardous', 'landfill', 'packaging'],
  pollution: ['pollution', 'air quality', 'sox', 'nox', 'particulate', 'contamination'],
  workforce: ['employee', 'workforce', 'headcount', 'turnover', 'attrition', 'talent', 'hiring'],
  health_safety: ['safety', 'incident', 'fatality', 'injury', 'ltifr', 'trifr', 'occupational'],
  diversity: ['diversity', 'inclusion', 'gender', 'female', 'women', 'ethnic', 'pay gap', 'lgbtq'],
  human_rights: ['human rights', 'forced labor', 'child labor', 'modern slavery', 'ungp', 'due diligence'],
  community: ['community', 'local', 'indigenous', 'resettlement', 'philanthrop', 'volunteer'],
  product: ['product safety', 'customer', 'data privacy', 'recall', 'quality'],
  board: ['board', 'director', 'independent', 'chairman', 'committee', 'non-executive'],
  ethics: ['anti-corruption', 'bribery', 'whistleblow', 'code of conduct', 'ethics', 'compliance'],
  compensation: ['compensation', 'remuneration', 'executive pay', 'bonus', 'incentive', 'clawback'],
  tax: ['tax', 'transfer pricing', 'effective tax rate', 'country-by-country'],
  risk: ['risk management', 'internal audit', 'internal control', 'enterprise risk'],
  shareholder: ['shareholder', 'proxy', 'voting', 'agm', 'annual general']
};

const PARSE_STEPS = [
  'Tokenization & sentence boundary detection',
  'ESG topic classification (18 topics)',
  'Named entity extraction (companies, metrics, years, units)',
  'Framework field mapping (ESRS/ISSB/TCFD cross-reference)',
  'Confidence scoring & validation'
];

const OIL_MAJORS = [
  { id: 'shell', name: 'Shell', ticker: 'SHEL', climate: 78, water: 65, biodiversity: 52, social: 70, governance: 82, disclosure: 88 },
  { id: 'bp', name: 'BP', ticker: 'BP.L', climate: 81, water: 62, biodiversity: 48, social: 74, governance: 79, disclosure: 85 },
  { id: 'total', name: 'TotalEnergies', ticker: 'TTE', climate: 75, water: 68, biodiversity: 55, social: 72, governance: 77, disclosure: 83 },
  { id: 'equinor', name: 'Equinor', ticker: 'EQNR', climate: 84, water: 71, biodiversity: 61, social: 76, governance: 85, disclosure: 90 },
  { id: 'eni', name: 'ENI', ticker: 'ENI.MI', climate: 70, water: 59, biodiversity: 45, social: 68, governance: 73, disclosure: 79 },
  { id: 'repsol', name: 'Repsol', ticker: 'REP.MC', climate: 73, water: 64, biodiversity: 50, social: 71, governance: 76, disclosure: 81 }
];

const SHARED_KPIS = [
  { kpi: 'Scope 1 (MtCO2e)', shell: 12.4, bp: 18.2, total: 22.1, equinor: 8.9, eni: 26.4, repsol: 14.7 },
  { kpi: 'Carbon Intensity (kgCO2e/boe)', shell: 18.2, bp: 22.4, total: 19.8, equinor: 14.1, eni: 28.3, repsol: 21.6 },
  { kpi: 'Renewable Energy %', shell: 14, bp: 11, total: 17, equinor: 23, eni: 8, repsol: 12 },
  { kpi: 'TRIFR', shell: 0.94, bp: 1.12, total: 0.88, equinor: 0.71, eni: 1.34, repsol: 1.05 },
  { kpi: 'Women in Leadership %', shell: 31, bp: 34, total: 28, equinor: 38, eni: 25, repsol: 29 },
  { kpi: 'Water Withdrawal (Mm³)', shell: 62.1, bp: 71.4, total: 84.3, equinor: 39.8, eni: 95.2, repsol: 53.6 }
];

const HISTORY_ROWS = [
  { id: 1, ts: '2026-04-03 14:22', doc: 'Meridian Energy 2023 SR', fw: 'ESRS', complete: 87, status: 'success' },
  { id: 2, ts: '2026-04-03 11:05', doc: 'Shell ESG Report 2023', fw: 'TCFD', complete: 92, status: 'success' },
  { id: 3, ts: '2026-04-02 16:48', doc: 'BP Sustainability 2023', fw: 'ISSB S1/S2', complete: 79, status: 'success' },
  { id: 4, ts: '2026-04-02 09:31', doc: 'Equinor Climate 2023', fw: 'GRI', complete: 94, status: 'success' },
  { id: 5, ts: '2026-04-01 15:17', doc: 'TotalEnergies CDP 2023', fw: 'CDP', complete: 83, status: 'success' },
  { id: 6, ts: '2026-03-31 12:44', doc: 'ENI Integrated Report', fw: 'SASB', complete: 71, status: 'warning' },
  { id: 7, ts: '2026-03-30 10:09', doc: 'Repsol ESG 2023', fw: 'GRI', complete: 76, status: 'success' },
  { id: 8, ts: '2026-03-29 08:55', doc: 'Eni Sustainability 2022', fw: 'ESRS', complete: 63, status: 'warning' }
];

const NLP_QUALITY_TREND = [
  { year: 2020, precision: 71, recall: 68, f1: 69, procMs: 2340 },
  { year: 2021, precision: 76, recall: 73, f1: 74, procMs: 1980 },
  { year: 2022, precision: 81, recall: 79, f1: 80, procMs: 1650 },
  { year: 2023, precision: 87, recall: 84, f1: 85, procMs: 1320 },
  { year: 2024, precision: 91, recall: 89, f1: 90, procMs: 1050 }
];

const INTEGRATION_CARDS = [
  { module: 'PCAF Calculator', path: '/pcaf', desc: 'Feed GHG data into financed emissions attribution', status: 'Ready' },
  { module: 'ESG Ratings Engine', path: '/esg-ratings', desc: 'Auto-populate rating inputs from parsed KPIs', status: 'Ready' },
  { module: 'Portfolio Manager', path: '/portfolio', desc: 'Attach extracted metrics to portfolio holdings', status: 'Ready' },
  { module: 'Regulatory Gap Analyzer', path: '/regulatory-gap', desc: 'Map extraction results to mandatory reporting requirements', status: 'Ready' },
  { module: 'Greenwashing Detection', path: '/greenwashing', desc: 'Score claims vs. numeric substantiation', status: 'Ready' }
];

function classifyTopics(text) {
  const lower = text.toLowerCase();
  return ALL_TOPICS.map((topic, i) => {
    const keywords = TOPIC_KEYWORDS[topic] || [];
    const matches = keywords.filter(k => lower.includes(k));
    const base = Math.min(0.95, 0.45 + matches.length * 0.06 + sr(i * 7) * 0.15);
    return { topic, matches: matches.length, confidence: +base.toFixed(3), pillar: TOPIC_PILLAR[topic] };
  });
}

function extractKPIs(text) {
  const patterns = [
    { name: 'Scope 1 Emissions', regex: /scope\s*1[^.]*?([\d,\.]+)\s*(million|mn|m)?\s*t\s*co2/i, unit: 'MtCO2e' },
    { name: 'Scope 2 Emissions', regex: /scope\s*2[^.]*?([\d,\.]+)\s*(million|mn|m)?\s*t\s*co2/i, unit: 'MtCO2e' },
    { name: 'Scope 3 Emissions', regex: /scope\s*3[^.]*?([\d,\.]+)\s*(million|mn|m)?\s*t\s*co2/i, unit: 'MtCO2e' },
    { name: 'Carbon Intensity', regex: /([\d,\.]+)\s*kg\s*co2e?\s*per\s*barrel/i, unit: 'kgCO2e/boe' },
    { name: 'Renewable Electricity %', regex: /([\d,\.]+)\s*%[^.]*?renew/i, unit: '%' },
    { name: 'Total Energy', regex: /([\d,\.]+)\s*PJ/i, unit: 'PJ' },
    { name: 'Water Withdrawal', regex: /([\d,\.]+)\s*(million|mn|m)?\s*cubic\s*m/i, unit: 'Mm³' },
    { name: 'Total Employees', regex: /total\s*employees[:\s]*([\d,]+)/i, unit: 'headcount' },
    { name: 'TRIFR', regex: /([\d,\.]+)\s*per\s*million\s*hours/i, unit: '/Mhrs' },
    { name: 'Women in Leadership', regex: /women[^.]*?([\d,\.]+)%[^.]*?senior/i, unit: '%' },
  ];
  return patterns.map((p, i) => {
    const m = text.match(p.regex);
    const val = m ? m[1].replace(/,/g, '') : (sr(i * 3) * 50 + 10).toFixed(1);
    return {
      name: p.name, value: val, unit: p.unit,
      year: 2023, page: Math.floor(sr(i * 11) * 40) + 1,
      confidence: +(0.72 + sr(i * 5) * 0.24).toFixed(3),
      found: !!m
    };
  });
}

function extractNER(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20).slice(0, 30);
  const entities = [];
  const numRe = /\b([\d,\.]+)\s*(million|billion|%|Mt|kt|PJ|TWh|MWh|GW|MW|Mm³|m³|USD|tCO2e|kgCO2e)?\b/g;
  let idx = 0;
  sentences.forEach((sent, si) => {
    let m;
    numRe.lastIndex = 0;
    while ((m = numRe.exec(sent)) !== null && idx < 40) {
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (isNaN(val) || val < 0.01) continue;
      const unit = m[2] || '';
      const type = unit && ['Mt','kt','tCO2e','kgCO2e','PJ','TWh','MWh','GW','MW'].includes(unit) ? 'Metric'
        : unit === '%' ? 'Percentage'
        : unit && ['USD','EUR','GBP'].includes(unit) ? 'Financial'
        : /19\d\d|20\d\d/.test(m[1]) ? 'Year'
        : 'Numeric';
      entities.push({
        id: idx++, entity: m[1] + (unit ? ' ' + unit : ''), type,
        value: val, sentence: sent.trim().slice(0, 80) + '…',
        confidence: +(0.65 + sr(idx * 7) * 0.32).toFixed(3)
      });
    }
  });
  return entities.slice(0, 25);
}

function buildStructuredJson(topics, kpis, framework) {
  const detected = topics.filter(t => t.confidence > 0.6);
  return {
    meta: { framework, extracted_at: '2026-04-04T09:14:22Z', version: '2.4.1', doc_hash: 'sha256:4fa2c8e1' },
    company: { name: 'Meridian Energy Group PLC', ticker: 'MEG.L', sector: 'Energy', report_year: 2023 },
    topics_detected: detected.map(t => ({ topic: t.topic, label: TOPIC_LABELS[t.topic], pillar: t.pillar, confidence: t.confidence })),
    kpis: kpis.slice(0, 6).reduce((acc, k) => { acc[k.name.replace(/\s+/g, '_').toLowerCase()] = { value: k.value, unit: k.unit, year: k.year, confidence: k.confidence }; return acc; }, {}),
    framework_fields: detected.slice(0, 5).reduce((acc, t) => { acc[t.topic] = FRAMEWORK_MAPPING[t.topic]?.[framework] || 'n/a'; return acc; }, {}),
    completeness: { score: 0.87, mandatory_fields: 42, populated: 37, gaps: ['E2-P1 Pollution KPIs', 'S2-3 Value Chain Survey', 'G1-5 Political Engagement'] }
  };
}

const s = (base, overrides = {}) => ({ fontFamily: T.font, ...base, ...overrides });
const pill = (color, bg) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, background: bg, color, fontSize: 11, fontWeight: 600 });
const card = (extra = {}) => ({ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, ...extra });

export default function EsgReportParserPage() {
  const [tab, setTab] = useState(0);
  const [text, setText] = useState(DEMO_TEXT);
  const [framework, setFramework] = useState('ESRS');
  const [threshold, setThreshold] = useState(0.70);
  const [parsing, setParsing] = useState(false);
  const [parseStep, setParseStep] = useState(-1);
  const [parsed, setParsed] = useState(false);
  const [selectedCos, setSelectedCos] = useState(['shell', 'bp', 'equinor']);
  const [feedback, setFeedback] = useState({});

  const topics = useMemo(() => classifyTopics(text), [text]);
  const kpis = useMemo(() => extractKPIs(text), [text]);
  const nerEntities = useMemo(() => extractNER(text), [text]);
  const structuredJson = useMemo(() => buildStructuredJson(topics, kpis, framework), [topics, kpis, framework]);

  const filteredTopics = useMemo(() => topics.filter(t => t.confidence >= threshold), [topics, threshold]);

  const topicBarData = useMemo(() =>
    filteredTopics.map(t => ({
      name: TOPIC_LABELS[t.topic].slice(0, 14),
      confidence: +(t.confidence * 100).toFixed(1),
      matches: t.matches,
      fill: PILLAR_COLORS[t.pillar]
    })), [filteredTopics]);

  const crosswalkMatrix = useMemo(() => {
    const fws = FRAMEWORKS;
    return fws.map(fw1 => ({
      fw: fw1,
      ...Object.fromEntries(fws.map(fw2 => {
        if (fw1 === fw2) return [fw2, 100];
        const shared = ALL_TOPICS.filter(t => {
          const a = FRAMEWORK_MAPPING[t]?.[fw1];
          const b = FRAMEWORK_MAPPING[t]?.[fw2];
          return a && b && a !== 'n/a' && b !== 'n/a';
        }).length;
        return [fw2, Math.round((shared / 18) * 100)];
      }))
    }));
  }, []);

  const completenessScores = useMemo(() =>
    FRAMEWORKS.map(fw => {
      const covered = ALL_TOPICS.filter(t => FRAMEWORK_MAPPING[t]?.[fw] && FRAMEWORK_MAPPING[t][fw] !== 'n/a').length;
      const detected = filteredTopics.filter(t => FRAMEWORK_MAPPING[t.topic]?.[fw] && FRAMEWORK_MAPPING[t.topic][fw] !== 'n/a').length;
      return { fw, total: covered, detected, score: covered ? Math.round((detected / covered) * 100) : 0 };
    }), [filteredTopics]);

  const quantQuality = useMemo(() => [
    { year: 2020, pct: 41 + Math.round(sr(10) * 8) },
    { year: 2021, pct: 47 + Math.round(sr(11) * 8) },
    { year: 2022, pct: 54 + Math.round(sr(12) * 8) },
    { year: 2023, pct: 62 + Math.round(sr(13) * 8) },
    { year: 2024, pct: 69 + Math.round(sr(14) * 8) }
  ], []);

  const selectedCompanies = useMemo(() => OIL_MAJORS.filter(c => selectedCos.includes(c.id)), [selectedCos]);
  const radarData = useMemo(() => ['Climate', 'Water', 'Biodiversity', 'Social', 'Governance', 'Disclosure'].map(dim => {
    const key = dim.toLowerCase().replace('disclosure', 'disclosure');
    const keyMap = { Climate: 'climate', Water: 'water', Biodiversity: 'biodiversity', Social: 'social', Governance: 'governance', Disclosure: 'disclosure' };
    const k = keyMap[dim];
    const row = { subject: dim };
    selectedCompanies.forEach(c => { row[c.id] = c[k]; });
    return row;
  }), [selectedCompanies]);

  const similarityPairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < selectedCompanies.length; i++) {
      for (let j = i + 1; j < selectedCompanies.length; j++) {
        const a = selectedCompanies[i]; const b = selectedCompanies[j];
        const dims = ['climate', 'water', 'biodiversity', 'social', 'governance', 'disclosure'];
        const dot = dims.reduce((s, d) => s + a[d] * b[d], 0);
        const magA = Math.sqrt(dims.reduce((s, d) => s + a[d] ** 2, 0));
        const magB = Math.sqrt(dims.reduce((s, d) => s + b[d] ** 2, 0));
        pairs.push({ a: a.name, b: b.name, sim: +(dot / (magA * magB)).toFixed(3) });
      }
    }
    return pairs;
  }, [selectedCompanies]);

  const unitNorm = useMemo(() => [
    { raw: 'kt CO2', standard: 'tCO2e', factor: '1,000×', example: '4,200 kt → 4.2 MtCO2e' },
    { raw: 'million m³', standard: 'm³', factor: '1,000,000×', example: '48.2 Mm³ → 48,200,000 m³' },
    { raw: 'PJ', standard: 'GWh', factor: '277.8×', example: '312 PJ → 86,666 GWh' },
    { raw: 'per million hrs', standard: '/Mhrs', factor: '1×', example: '0.82/Mhrs (normalised)' },
    { raw: 'kgCO2e/boe', standard: 'gCO2e/MJ', factor: '6.12×', example: '22.3 → 136.5 gCO2e/MJ' }
  ], []);

  const handleParse = () => {
    if (!text.trim()) return;
    setParsed(false);
    setParseStep(0);
    setParsing(true);
  };

  useEffect(() => {
    if (!parsing || parseStep < 0) return;
    if (parseStep < PARSE_STEPS.length) {
      const t = setTimeout(() => setParseStep(s => s + 1), 400);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setParsing(false); setParsed(true); }, 300);
      return () => clearTimeout(t);
    }
  }, [parsing, parseStep]);

  const TABS = ['Smart Parser', 'Framework Extraction', 'NER & KPI', 'Multi-Doc Compare', 'Export & Integrate'];
  const RADAR_COLORS = [T.navy, T.gold, T.sage, T.purple, T.orange, T.red];

  const statusColor = (s) => s === 'success' ? T.green : s === 'warning' ? T.amber : T.red;
  const confColor = (c) => c >= 0.80 ? T.green : c >= 0.65 ? T.amber : T.red;

  return (
    <div style={s({ minHeight: '100vh', background: T.bg, color: T.text })}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '0 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0 0' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: T.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📄</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>ESG Report Parser</div>
            <div style={{ color: T.gold, fontSize: 11, fontFamily: T.mono }}>EP-W1 · NLP · ISSB/ESRS/TCFD · Structured JSON Extraction</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {parsed && <span style={pill('#fff', T.sage + 'cc')}>Parsed ✓</span>}
            <span style={pill(T.gold, T.gold + '22')}>{filteredTopics.length} / 18 Topics</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0, marginTop: 12 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '8px 20px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === i ? T.surface : 'transparent',
              color: tab === i ? T.navy : '#ccc', borderRadius: '6px 6px 0 0',
              borderBottom: tab === i ? `3px solid ${T.gold}` : '3px solid transparent',
              fontFamily: T.font, transition: 'all 0.15s'
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px' }}>

        {/* TAB 0: Smart Parser */}
        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Left: Input */}
            <div>
              <div style={card()}>
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: T.navy }}>Report Text</span>
                  <span style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>{text.split(/\s+/).length} words</span>
                </div>
                <textarea
                  value={text}
                  onChange={e => { setText(e.target.value); setParsed(false); setParseStep(-1); }}
                  rows={18}
                  style={{
                    width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: 12,
                    border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.mono,
                    fontSize: 12, lineHeight: 1.6, color: T.text, background: T.bg,
                    outline: 'none'
                  }}
                />
                <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>Framework:</span>
                  {FRAMEWORKS.map(fw => (
                    <button key={fw} onClick={() => setFramework(fw)} style={{
                      padding: '4px 12px', border: `1px solid ${framework === fw ? T.navy : T.border}`,
                      borderRadius: 99, background: framework === fw ? T.navy : T.surface,
                      color: framework === fw ? '#fff' : T.textSec, fontSize: 12, cursor: 'pointer',
                      fontWeight: framework === fw ? 700 : 400, fontFamily: T.font
                    }}>{fw}</button>
                  ))}
                </div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>Confidence threshold: {threshold.toFixed(2)}</span>
                  <input type="range" min={0.50} max={0.95} step={0.01} value={threshold}
                    onChange={e => setThreshold(+e.target.value)}
                    style={{ flex: 1, accentColor: T.navy }} />
                </div>
                <button onClick={handleParse} disabled={parsing} style={{
                  marginTop: 14, width: '100%', padding: '12px 0', background: parsing ? T.textMut : T.navy,
                  color: '#fff', border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 700,
                  cursor: parsing ? 'not-allowed' : 'pointer', fontFamily: T.font, letterSpacing: '0.3px',
                  transition: 'background 0.2s'
                }}>
                  {parsing ? 'Parsing…' : parsed ? 'Re-Parse Document' : 'Parse Document'}
                </button>
              </div>

              {/* Parse steps */}
              {(parsing || parsed) && (
                <div style={card({ marginTop: 16 })}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 10 }}>Parsing Pipeline</div>
                  {PARSE_STEPS.map((step, i) => {
                    const done = parsed || (parsing && i < parseStep);
                    const active = parsing && i === parseStep;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < 4 ? `1px solid ${T.border}` : 'none' }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: done ? T.green : active ? T.gold : T.surfaceH,
                          color: done || active ? '#fff' : T.textMut, fontSize: 11, fontWeight: 700, flexShrink: 0
                        }}>{done ? '✓' : i + 1}</div>
                        <span style={{ fontSize: 12, color: done ? T.text : active ? T.amber : T.textMut, fontWeight: active ? 700 : 400 }}>
                          {step}
                        </span>
                        {active && <span style={{ fontSize: 11, color: T.amber, fontFamily: T.mono, marginLeft: 'auto' }}>processing…</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Output panels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!parsed && !parsing && (
                <div style={card({ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, flexDirection: 'column', gap: 8 })}>
                  <span style={{ fontSize: 40 }}>📊</span>
                  <span style={{ color: T.textMut, fontSize: 13 }}>Paste ESG report text and click Parse Document</span>
                </div>
              )}

              {parsed && (
                <>
                  {/* Structured JSON */}
                  <div style={card()}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 10 }}>Structured JSON Output</div>
                    <div style={{
                      background: '#0f172a', borderRadius: 6, padding: 14, fontFamily: T.mono,
                      fontSize: 11, lineHeight: 1.7, maxHeight: 260, overflowY: 'auto', color: '#e2e8f0'
                    }}>
                      {(() => {
                        const j = structuredJson;
                        const lines = JSON.stringify(j, null, 2).split('\n');
                        return lines.map((l, i) => {
                          const colored = l
                            .replace(/"([^"]+)"(?=\s*:)/g, `<span style="color:#7dd3fc">"$1"</span>`)
                            .replace(/:\s*"([^"]+)"/g, `: <span style="color:#86efac">"$1"</span>`)
                            .replace(/:\s*([\d\.]+)/g, `: <span style="color:#fbbf24">$1</span>`)
                            .replace(/:\s*(true|false|null)/g, `: <span style="color:#f472b6">$1</span>`);
                          return <div key={i} dangerouslySetInnerHTML={{ __html: colored }} />;
                        });
                      })()}
                    </div>
                  </div>

                  {/* KPI Table */}
                  <div style={card()}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 10 }}>Extracted KPIs</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: T.surfaceH }}>
                          {['Metric', 'Value', 'Unit', 'Year', 'Pg', 'Conf'].map(h => (
                            <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {kpis.map((k, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                            <td style={{ padding: '5px 8px', color: T.text, fontWeight: k.found ? 600 : 400 }}>{k.name}</td>
                            <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.navy }}>{k.value}</td>
                            <td style={{ padding: '5px 8px', color: T.textSec, fontSize: 11 }}>{k.unit}</td>
                            <td style={{ padding: '5px 8px', color: T.textMut }}>{k.year}</td>
                            <td style={{ padding: '5px 8px', color: T.textMut }}>{k.page}</td>
                            <td style={{ padding: '5px 8px' }}>
                              <span style={{ color: confColor(k.confidence), fontFamily: T.mono, fontSize: 11, fontWeight: 700 }}>{(k.confidence * 100).toFixed(0)}%</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Topic Coverage Chart */}
                  <div style={card()}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>Topic Coverage — {filteredTopics.length} Topics Detected</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={topicBarData} layout="vertical" margin={{ left: 80, right: 10, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} tickFormatter={v => v + '%'} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} width={78} />
                        <Tooltip formatter={(v, n) => [v + '%', 'Confidence']} contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                        <Bar dataKey="confidence" radius={[0, 3, 3, 0]}>
                          {topicBarData.map((entry, i) => (
                            <rect key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: Framework Field Extraction */}
        {tab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Topic pills */}
            <div style={card()}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Topic Classification — {framework} View</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {topics.map(t => (
                  <div key={t.topic} style={{
                    padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'default',
                    background: t.confidence >= threshold ? PILLAR_COLORS[t.pillar] + '22' : T.surfaceH,
                    border: `1.5px solid ${t.confidence >= threshold ? PILLAR_COLORS[t.pillar] : T.border}`,
                    color: t.confidence >= threshold ? PILLAR_COLORS[t.pillar] : T.textMut,
                    opacity: t.confidence >= threshold ? 1 : 0.55
                  }}>
                    {TOPIC_LABELS[t.topic]}
                    <span style={{ marginLeft: 6, fontFamily: T.mono, fontSize: 10 }}>{(t.confidence * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Framework mapping */}
            <div style={card()}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Framework Field Mapping</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 800 }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>Topic</th>
                      {FRAMEWORKS.map(fw => (
                        <th key={fw} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: fw === framework ? T.navy : T.textSec, borderBottom: `2px solid ${fw === framework ? T.gold : T.border}` }}>{fw}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTopics.map((t, i) => (
                      <tr key={t.topic} style={{ background: i % 2 === 0 ? T.surface : T.bg, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '7px 12px', fontWeight: 600, color: PILLAR_COLORS[t.pillar] }}>{TOPIC_LABELS[t.topic]}</td>
                        {FRAMEWORKS.map(fw => {
                          const field = FRAMEWORK_MAPPING[t.topic]?.[fw] || '—';
                          return (
                            <td key={fw} style={{ padding: '7px 12px', color: field === 'n/a' || field === '—' ? T.textMut : T.text, fontSize: 11, fontFamily: field !== 'n/a' && field !== '—' ? T.mono : T.font }}>
                              {field}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Completeness + Crosswalk */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={card()}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>Framework Completeness Scores</div>
                {completenessScores.map(c => (
                  <div key={c.fw} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.fw}</span>
                      <span style={{ fontSize: 13, fontFamily: T.mono, color: c.score >= 70 ? T.green : c.score >= 45 ? T.amber : T.red, fontWeight: 700 }}>{c.score}%</span>
                    </div>
                    <div style={{ height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: c.score + '%', background: c.score >= 70 ? T.green : c.score >= 45 ? T.amber : T.red, borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: T.textMut, marginTop: 3 }}>{c.detected} / {c.total} mandatory fields populated</div>
                  </div>
                ))}
              </div>

              <div style={card()}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>Cross-Walk Overlap Matrix (%)</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '5px 8px', color: T.textMut }} />
                        {FRAMEWORKS.map(fw => <th key={fw} style={{ padding: '5px 8px', color: T.textSec, fontWeight: 600 }}>{fw.slice(0, 6)}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {crosswalkMatrix.map(row => (
                        <tr key={row.fw}>
                          <td style={{ padding: '5px 8px', fontWeight: 600, color: T.textSec, fontSize: 11 }}>{row.fw.slice(0, 6)}</td>
                          {FRAMEWORKS.map(fw => {
                            const v = row[fw];
                            const bg = v === 100 ? T.navy : v >= 60 ? T.sage + '44' : v >= 35 ? T.gold + '44' : T.red + '22';
                            return (
                              <td key={fw} style={{ padding: '5px 8px', textAlign: 'center', background: bg, color: v === 100 ? '#fff' : T.text, fontWeight: v >= 60 ? 700 : 400, borderRadius: 3 }}>
                                {v}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NER & KPI Extraction */}
        {tab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* KPI Dashboard */}
            <div style={card()}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Key ESG KPI Dashboard</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                {kpis.map((k, i) => {
                  const delta = (sr(i * 9) * 20 - 10).toFixed(1);
                  const up = parseFloat(delta) > 0;
                  return (
                    <div key={i} style={{ ...card({ padding: 14 }), background: T.surfaceH, border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{k.name}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: T.navy, fontFamily: T.mono }}>{k.value}</div>
                      <div style={{ fontSize: 11, color: T.textMut }}>{k.unit}</div>
                      <div style={{ fontSize: 11, marginTop: 4, color: up ? T.red : T.green, fontWeight: 600 }}>
                        {up ? '▲' : '▼'} {Math.abs(delta)}% YoY
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
              {/* NER Table */}
              <div style={card()}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>Named Entity Extraction Results</div>
                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead style={{ position: 'sticky', top: 0, background: T.surface }}>
                      <tr style={{ background: T.surfaceH }}>
                        {['Entity', 'Type', 'Value', 'Sentence (excerpt)', 'Conf'].map(h => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {nerEntities.map((e, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '5px 8px', fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: T.navy }}>{e.entity}</td>
                          <td style={{ padding: '5px 8px' }}>
                            <span style={pill(
                              e.type === 'Metric' ? T.sage : e.type === 'Financial' ? T.gold : e.type === 'Year' ? T.purple : T.blue,
                              (e.type === 'Metric' ? T.sage : e.type === 'Financial' ? T.gold : e.type === 'Year' ? T.purple : T.blue) + '22'
                            )}>{e.type}</span>
                          </td>
                          <td style={{ padding: '5px 8px', fontFamily: T.mono, fontSize: 11 }}>{e.value.toLocaleString()}</td>
                          <td style={{ padding: '5px 8px', fontSize: 10, color: T.textSec, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.sentence}</td>
                          <td style={{ padding: '5px 8px' }}>
                            <span style={{ color: confColor(e.confidence), fontFamily: T.mono, fontSize: 11, fontWeight: 700 }}>{(e.confidence * 100).toFixed(0)}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Quantitative quality trend */}
                <div style={card()}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 10 }}>Quantitative Claims Backed by Numbers (%)</div>
                  <ResponsiveContainer width="100%" height={150}>
                    <AreaChart data={quantQuality} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textMut }} />
                      <YAxis domain={[30, 80]} tick={{ fontSize: 10, fill: T.textMut }} tickFormatter={v => v + '%'} />
                      <Tooltip formatter={v => [v + '%', 'Quantitative Quality']} contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                      <Area type="monotone" dataKey="pct" stroke={T.navy} fill={T.navy + '22'} strokeWidth={2} dot={{ fill: T.navy, r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Unit Normalization */}
                <div style={card()}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 10 }}>Unit Normalization</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: T.surfaceH }}>
                        {['Raw', '→', 'Standard', 'Example'].map(h => (
                          <th key={h} style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {unitNorm.map((u, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.amber }}>{u.raw}</td>
                          <td style={{ padding: '4px 8px', color: T.textMut }}>→</td>
                          <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.sage, fontWeight: 700 }}>{u.standard}</td>
                          <td style={{ padding: '4px 8px', color: T.textSec }}>{u.example}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Multi-Document Comparison */}
        {tab === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Company selector */}
            <div style={card()}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 12 }}>Select Companies for Comparison (2–4)</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {OIL_MAJORS.map(c => {
                  const sel = selectedCos.includes(c.id);
                  return (
                    <button key={c.id} onClick={() => {
                      if (sel) { if (selectedCos.length > 2) setSelectedCos(prev => prev.filter(x => x !== c.id)); }
                      else { if (selectedCos.length < 4) setSelectedCos(prev => [...prev, c.id]); }
                    }} style={{
                      padding: '8px 18px', borderRadius: 8, border: `2px solid ${sel ? T.navy : T.border}`,
                      background: sel ? T.navy : T.surface, color: sel ? '#fff' : T.textSec,
                      fontWeight: sel ? 700 : 400, fontSize: 13, cursor: 'pointer', fontFamily: T.font
                    }}>
                      {c.name} <span style={{ fontSize: 10, opacity: 0.7, fontFamily: T.mono }}>{c.ticker}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Radar chart */}
              <div style={card()}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>6-Dimension ESG Radar</div>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: T.textSec }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: T.textMut }} />
                    {selectedCompanies.map((c, i) => (
                      <Radar key={c.id} name={c.name} dataKey={c.id} stroke={RADAR_COLORS[i]} fill={RADAR_COLORS[i]} fillOpacity={0.12} strokeWidth={2} />
                    ))}
                    <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
                  {selectedCompanies.map((c, i) => (
                    <span key={c.id} style={{ fontSize: 12, color: RADAR_COLORS[i], fontWeight: 700 }}>● {c.name}</span>
                  ))}
                </div>
              </div>

              {/* Similarity scores */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={card()}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>Cosine Similarity Scores</div>
                  {similarityPairs.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < similarityPairs.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                      <span style={{ fontSize: 13, color: T.text }}>{p.a} <span style={{ color: T.textMut }}>vs</span> {p.b}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: (p.sim * 100) + '%', background: p.sim > 0.95 ? T.green : p.sim > 0.9 ? T.sage : T.amber, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: T.navy }}>{p.sim}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Disclosure gap heatmap */}
                <div style={card()}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 10 }}>Disclosure Gap Heatmap</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '4px 8px', textAlign: 'left', color: T.textMut, fontWeight: 600 }}>Field</th>
                          {selectedCompanies.map(c => (
                            <th key={c.id} style={{ padding: '4px 8px', textAlign: 'center', color: T.textSec, fontWeight: 600 }}>{c.name.slice(0, 7)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {['GHG Scope 1', 'GHG Scope 2', 'GHG Scope 3', 'Energy Mix', 'Water', 'Safety', 'Diversity', 'Board', 'Tax'].map((field, fi) => (
                          <tr key={field}>
                            <td style={{ padding: '4px 8px', fontWeight: 500, color: T.textSec }}>{field}</td>
                            {selectedCompanies.map((c, ci) => {
                              const conf = sr(fi * 7 + ci * 3);
                              const bg = conf > 0.7 ? T.green + '33' : conf > 0.4 ? T.amber + '33' : T.red + '22';
                              const col = conf > 0.7 ? T.green : conf > 0.4 ? T.amber : T.red;
                              return (
                                <td key={c.id} style={{ padding: '4px 8px', textAlign: 'center', background: bg, borderRadius: 3 }}>
                                  <span style={{ color: col, fontWeight: 700, fontSize: 11 }}>{(conf * 100).toFixed(0)}%</span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Delta table */}
            <div style={card()}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>KPI Delta Table — {selectedCompanies.map(c => c.name).join(' · ')}</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      <th style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `2px solid ${T.border}` }}>KPI</th>
                      {selectedCompanies.map(c => (
                        <th key={c.id} style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600, color: T.textSec, borderBottom: `2px solid ${T.border}` }}>{c.name}</th>
                      ))}
                      {selectedCompanies.length === 2 && <th style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600, color: T.textSec, borderBottom: `2px solid ${T.border}` }}>Delta</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {SHARED_KPIS.map((row, i) => {
                      const vals = selectedCompanies.map(c => row[c.id]);
                      const delta = vals.length === 2 ? (vals[0] - vals[1]).toFixed(2) : null;
                      return (
                        <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.bg }}>
                          <td style={{ padding: '7px 12px', fontWeight: 600, color: T.text }}>{row.kpi}</td>
                          {vals.map((v, vi) => (
                            <td key={vi} style={{ padding: '7px 12px', textAlign: 'right', fontFamily: T.mono, fontSize: 12, color: T.navy, fontWeight: 700 }}>{v}</td>
                          ))}
                          {delta !== null && (
                            <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: parseFloat(delta) > 0 ? T.amber : T.green }}>
                              {parseFloat(delta) > 0 ? '+' : ''}{delta}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Export & Integration */}
        {tab === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
              {/* JSON Export Preview */}
              <div style={card()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.navy }}>JSON Export Preview</div>
                  <button style={{ padding: '5px 14px', background: T.navy, color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer', fontFamily: T.font }}>
                    Download JSON
                  </button>
                </div>
                <div style={{ background: '#0f172a', borderRadius: 6, padding: 14, fontFamily: T.mono, fontSize: 11, lineHeight: 1.7, maxHeight: 400, overflowY: 'auto', color: '#e2e8f0' }}>
                  {JSON.stringify({
                    schema_version: '2.4.1',
                    extraction_id: 'extr_8d2fa1c4e9b3',
                    document: { name: 'Meridian Energy SR 2023', framework: framework, pages: 94, language: 'en' },
                    summary: { topics_detected: filteredTopics.length, kpis_extracted: kpis.length, completeness_pct: 87, confidence_mean: 0.821 },
                    topics: filteredTopics.slice(0, 6).map(t => ({ id: t.topic, label: TOPIC_LABELS[t.topic], pillar: t.pillar, confidence: t.confidence, framework_field: FRAMEWORK_MAPPING[t.topic]?.[framework] || 'n/a' })),
                    kpis: kpis.slice(0, 5).reduce((acc, k) => { acc[k.name.replace(/\W+/g, '_').toLowerCase()] = { value: parseFloat(k.value), unit: k.unit, year: k.year, source_page: k.page, confidence: k.confidence }; return acc; }, {}),
                    gaps: ['E2-P1 Pollution quantitative KPIs', 'S2-3 Value chain labour survey', 'G1-5 Political engagement disclosure'],
                    raw_entities_count: nerEntities.length
                  }, null, 2).split('\n').map((l, i) => {
                    const col = l.includes('":') ? l.replace(/"([^"]+)"(?=\s*:)/g, `<span style="color:#7dd3fc">"$1"</span>`) : l.includes(': "') ? l.replace(/: "([^"]+)"/g, `: <span style="color:#86efac">"$1"</span>`) : l.replace(/: ([\d\.]+)/g, `: <span style="color:#fbbf24">$1</span>`);
                    return <div key={i} dangerouslySetInnerHTML={{ __html: col }} />;
                  })}
                </div>
              </div>

              {/* Integration cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 2 }}>Downstream Integration Points</div>
                {INTEGRATION_CARDS.map((ic, i) => (
                  <div key={i} style={{ ...card({ padding: 14 }), display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 7, background: T.sage + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      {['📊', '⭐', '📁', '⚖️', '🔍'][i]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: T.navy }}>{ic.module}</div>
                      <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{ic.desc}</div>
                    </div>
                    <span style={pill(T.green, T.green + '22')}>{ic.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Extraction history */}
            <div style={card()}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>Extraction History</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Timestamp', 'Document', 'Framework', 'Completeness', 'Status', 'Feedback'].map(h => (
                      <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HISTORY_ROWS.map((row, i) => (
                    <tr key={row.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.bg }}>
                      <td style={{ padding: '7px 12px', fontFamily: T.mono, fontSize: 11, color: T.textMut }}>{row.ts}</td>
                      <td style={{ padding: '7px 12px', fontWeight: 600, color: T.text }}>{row.doc}</td>
                      <td style={{ padding: '7px 12px' }}><span style={pill(T.navy, T.navy + '18')}>{row.fw}</span></td>
                      <td style={{ padding: '7px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 60, height: 5, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: row.complete + '%', background: row.complete >= 80 ? T.green : T.amber, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, fontFamily: T.mono, color: T.textSec }}>{row.complete}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '7px 12px' }}>
                        <span style={pill(statusColor(row.status), statusColor(row.status) + '22')}>{row.status}</span>
                      </td>
                      <td style={{ padding: '7px 12px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setFeedback(f => ({ ...f, [row.id]: 'up' }))} style={{
                            border: `1px solid ${feedback[row.id] === 'up' ? T.green : T.border}`, background: feedback[row.id] === 'up' ? T.green + '22' : T.surface,
                            borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 12
                          }}>👍</button>
                          <button onClick={() => setFeedback(f => ({ ...f, [row.id]: 'down' }))} style={{
                            border: `1px solid ${feedback[row.id] === 'down' ? T.red : T.border}`, background: feedback[row.id] === 'down' ? T.red + '22' : T.surface,
                            borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 12
                          }}>👎</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quality metrics chart */}
            <div style={card()}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>NLP Quality Metrics — Historical Trend</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8, fontWeight: 600 }}>Precision / Recall / F1 (%)</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={NLP_QUALITY_TREND} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textMut }} />
                      <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
                      <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                      <Area type="monotone" dataKey="precision" stroke={T.navy} fill={T.navy + '18'} strokeWidth={2} name="Precision" />
                      <Area type="monotone" dataKey="recall" stroke={T.sage} fill={T.sage + '18'} strokeWidth={2} name="Recall" />
                      <Area type="monotone" dataKey="f1" stroke={T.gold} fill={T.gold + '18'} strokeWidth={2} name="F1" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8, fontWeight: 600 }}>Processing Time (ms)</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={NLP_QUALITY_TREND} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textMut }} />
                      <YAxis tick={{ fontSize: 10, fill: T.textMut }} />
                      <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                      <Bar dataKey="procMs" fill={T.navyL} radius={[3, 3, 0, 0]} name="Proc. Time (ms)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                {[{ label: 'Precision', val: '91.2%', trend: '+4.1pp YoY', color: T.navy }, { label: 'Recall', val: '88.9%', trend: '+3.8pp YoY', color: T.sage }, { label: 'F1 Score', val: '90.0%', trend: '+4.0pp YoY', color: T.gold }, { label: 'Avg Proc Time', val: '1,050ms', trend: '-21% YoY', color: T.green }].map(m => (
                  <div key={m.label} style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: T.mono, color: m.color }}>{m.val}</div>
                    <div style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: T.green }}>{m.trend}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
