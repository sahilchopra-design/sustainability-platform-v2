import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

/* ── ESG Lexicon ──────────────────────────────────────────────── */
const ESG_LEXICON = {
  environmental: {
    climate: ['carbon', 'emission', 'ghg', 'greenhouse', 'co2', 'methane', 'scope 1', 'scope 2', 'scope 3', 'net zero', 'carbon neutral', 'sbti', 'science-based', 'paris', '1.5 degree', 'decarboni'],
    energy: ['renewable', 'solar', 'wind', 'energy efficiency', 'kwh', 'mwh', 'gwh', 'fossil fuel', 'coal', 'natural gas', 'electricity', 'power purchase'],
    water: ['water withdrawal', 'water consumption', 'water recycl', 'water stress', 'wastewater', 'effluent', 'water intensity'],
    biodiversity: ['biodiversity', 'deforestation', 'habitat', 'species', 'ecosystem', 'tnfd', 'nature', 'land use change'],
    waste: ['waste', 'recycl', 'circular economy', 'hazardous', 'landfill', 'packaging', 'plastic'],
    pollution: ['pollution', 'air quality', 'sox', 'nox', 'particulate', 'chemical', 'contamination'],
  },
  social: {
    workforce: ['employee', 'workforce', 'headcount', 'turnover', 'attrition', 'retention', 'hiring', 'talent'],
    health_safety: ['safety', 'incident', 'fatality', 'injury', 'ltifr', 'trifr', 'occupational', 'health'],
    diversity: ['diversity', 'inclusion', 'gender', 'female', 'women', 'ethnic', 'disability', 'lgbtq', 'pay gap', 'equal'],
    human_rights: ['human rights', 'forced labor', 'child labor', 'modern slavery', 'supply chain labor', 'ungp', 'due diligence'],
    community: ['community', 'local', 'indigenous', 'resettlement', 'social impact', 'philanthrop', 'donation', 'volunteer'],
    product: ['product safety', 'customer', 'data privacy', 'data breach', 'recall', 'quality'],
  },
  governance: {
    board: ['board', 'director', 'independent', 'chairman', 'governance', 'committee', 'non-executive'],
    ethics: ['anti-corruption', 'bribery', 'whistleblow', 'code of conduct', 'ethics', 'compliance'],
    compensation: ['compensation', 'remuneration', 'executive pay', 'bonus', 'incentive', 'clawback'],
    tax: ['tax', 'transfer pricing', 'tax haven', 'effective tax rate', 'country-by-country'],
    risk: ['risk management', 'internal audit', 'internal control', 'enterprise risk'],
    shareholder: ['shareholder', 'proxy', 'voting', 'agm', 'annual general'],
  },
};

const ESRS_MAP = {
  climate: 'E1 - Climate Change', energy: 'E1 - Climate Change', water: 'E3 - Water & Marine',
  biodiversity: 'E4 - Biodiversity', waste: 'E5 - Resource Use & Circular Economy', pollution: 'E2 - Pollution',
  workforce: 'S1 - Own Workforce', health_safety: 'S1 - Own Workforce', diversity: 'S1 - Own Workforce',
  human_rights: 'S2 - Workers in Value Chain', community: 'S3 - Affected Communities', product: 'S4 - Consumers & End-Users',
  board: 'G1 - Business Conduct', ethics: 'G1 - Business Conduct', compensation: 'G1 - Business Conduct',
  tax: 'G1 - Business Conduct', risk: 'G1 - Business Conduct', shareholder: 'G1 - Business Conduct',
};

const PILLAR_COLORS = { E: T.sage, S: T.gold, G: T.navy };
const TOPIC_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#e11d48','#0891b2','#a855f7','#d946ef','#22c55e','#eab308','#64748b'];

/* ── NLP Functions ─────────────────────────────────────────────── */
function classifyTopics(text) {
  const lower = text.toLowerCase();
  const results = {};
  let eCount = 0, sCount = 0, gCount = 0;
  for (const [pillar, topics] of Object.entries(ESG_LEXICON)) {
    for (const [topic, keywords] of Object.entries(topics)) {
      const count = keywords.reduce((sum, kw) => {
        const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        return sum + (lower.match(regex) || []).length;
      }, 0);
      if (count > 0) {
        results[topic] = { count, pillar: pillar[0].toUpperCase(), pillarFull: pillar, esrs: ESRS_MAP[topic] || 'N/A' };
        if (pillar === 'environmental') eCount += count;
        else if (pillar === 'social') sCount += count;
        else gCount += count;
      }
    }
  }
  return { topics: results, eCt: eCount, sCt: sCount, gCt: gCount };
}

function computeTFIDF(documents, queryTerms) {
  const tf = (term, doc) => {
    const words = doc.toLowerCase().split(/\s+/);
    const ct = words.filter(w => w.includes(term.toLowerCase())).length;
    return ct / Math.max(1, words.length);
  };
  const idf = (term, docs) => {
    const containing = docs.filter(d => d.toLowerCase().includes(term.toLowerCase())).length;
    return Math.log((docs.length + 1) / (1 + containing));
  };
  return documents.map(doc => {
    const score = queryTerms.reduce((sum, term) => sum + tf(term, doc) * idf(term, documents), 0);
    return { doc, score };
  });
}

function extractKeyPhrases(text) {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
  const stopwords = new Set(['this','that','with','from','have','been','will','their','they','than','also','more','most','such','very','what','when','which','these','those','about','into','over','your','some','could','would','other','after','were','many','each','just','only','does','made','much','well','back','then','them','know','take','come','make','find','here','thing','year','being','people','used','first','time','where','between','under','during']);
  const filtered = words.filter(w => !stopwords.has(w));
  const freq = {};
  filtered.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  // Build bigrams
  for (let i = 0; i < filtered.length - 1; i++) {
    const bigram = filtered[i] + ' ' + filtered[i + 1];
    freq[bigram] = (freq[bigram] || 0) + 1;
  }
  const docCount = 1;
  const phrases = Object.entries(freq).map(([phrase, count]) => {
    const tfidf = (count / filtered.length) * Math.log((docCount + 1) / 2);
    return { phrase, count, tfidf: Math.abs(tfidf * count) };
  }).sort((a, b) => b.tfidf - a.tfidf);
  return phrases.slice(0, 25);
}

function extractEntities(text) {
  const numbers = [];
  const patterns = [
    { regex: /([\d,.]+)\s*(million|mn|m)\s*(tonnes?|tco2e?|mt)/gi, type: 'emissions', unit: 'Mt CO2e' },
    { regex: /([\d,.]+)\s*(gwh|mwh|kwh|gj|tj)/gi, type: 'energy', unit: 'match' },
    { regex: /([\d,.]+)\s*%/g, type: 'percentage', unit: '%' },
    { regex: /(?:usd|us\$|\$)\s*([\d,.]+)\s*(billion|million|bn|mn|m|b)/gi, type: 'financial', unit: 'USD' },
    { regex: /([\d,]+)\s*employees/gi, type: 'workforce', unit: 'count' },
    { regex: /scope\s*([123])\s*[:\-]?\s*([\d,.]+)\s*(mt|million|tonnes?|tco2e?)/gi, type: 'scope_emissions', unit: 'Mt CO2e' },
    { regex: /([\d,.]+)\s*(mw|gw)\b/gi, type: 'capacity', unit: 'MW' },
    { regex: /([\d,.]+)\s*(megalitr|ml|kl|cubic met)/gi, type: 'water', unit: 'ML' },
  ];
  patterns.forEach(p => {
    let match;
    p.regex.lastIndex = 0;
    while ((match = p.regex.exec(text)) !== null) {
      const valStr = p.type === 'scope_emissions' ? match[2] : match[1];
      const val = parseFloat(valStr.replace(/,/g, ''));
      if (!isNaN(val)) {
        const ctx = text.substring(Math.max(0, match.index - 60), Math.min(text.length, match.index + match[0].length + 60));
        numbers.push({ value: val, type: p.type, unit: p.unit === 'match' ? match[2].toUpperCase() : p.unit, context: ctx.trim(), index: match.index });
      }
    }
  });
  return numbers;
}

function scoreSentiment(text) {
  const positive = ['improve', 'increase', 'achieve', 'commit', 'target', 'reduce', 'progress', 'success', 'invest', 'innovate', 'sustainable', 'renewable', 'green', 'advance', 'milestone', 'exceed', 'strengthen', 'upgrade', 'grow', 'outperform'];
  const negative = ['fail', 'decline', 'violation', 'fine', 'penalty', 'risk', 'concern', 'challenge', 'controversy', 'spill', 'breach', 'worsen', 'miss', 'shortfall', 'delay', 'lawsuit', 'scandal', 'accident', 'damage', 'loss'];
  const words = text.toLowerCase().split(/\s+/);
  const posCount = words.filter(w => positive.some(p => w.includes(p))).length;
  const negCount = words.filter(w => negative.some(n => w.includes(n))).length;
  const total = Math.max(1, posCount + negCount);
  return { score: (posCount - negCount) / total, positive: posCount, negative: negCount, total };
}

function paragraphSentiments(text) {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 20);
  return paragraphs.map((p, i) => {
    const s = scoreSentiment(p);
    return { index: i + 1, text: p.substring(0, 80) + '...', score: s.score, positive: s.positive, negative: s.negative };
  });
}

function computeReportQuality(entities, topics, wordCount, text) {
  const dataPointDensity = Math.min(100, (entities.length / Math.max(1, wordCount / 100)) * 25);
  const topicCoverage = Math.min(100, (Object.keys(topics).length / 18) * 100);
  const quantification = Math.min(100, entities.filter(e => e.type !== 'percentage').length * 8);
  const specificity = Math.min(100, entities.filter(e => e.context.length > 30).length * 6);
  const overall = Math.round((dataPointDensity * 0.3 + topicCoverage * 0.25 + quantification * 0.25 + specificity * 0.2));
  return { overall, dataPointDensity: Math.round(dataPointDensity), topicCoverage: Math.round(topicCoverage), quantification: Math.round(quantification), specificity: Math.round(specificity) };
}

function detectGreenwashing(sentiment, entities, wordCount) {
  const sentimentScore = sentiment.score;
  const dataPointDensity = entities.length / Math.max(1, wordCount / 100);
  const flags = [];
  if (sentimentScore > 0.6 && dataPointDensity < 0.3) flags.push({ flag: 'High positive language, low data density', severity: 'high', desc: 'Report uses many positive terms but provides few quantified data points' });
  if (sentimentScore > 0.4 && entities.filter(e => e.type === 'emissions' || e.type === 'scope_emissions').length === 0) flags.push({ flag: 'Positive tone, no emissions data', severity: 'medium', desc: 'Climate-positive language without emissions quantification' });
  if (wordCount > 500 && entities.length < 3) flags.push({ flag: 'Verbose with minimal metrics', severity: 'medium', desc: 'Lengthy text with very few measurable data points' });
  const vague = ['committed to', 'working towards', 'plan to', 'aim to', 'aspire', 'exploring', 'considering'];
  const vagueCount = vague.reduce((sum, v) => sum + (text => (text.toLowerCase().match(new RegExp(v, 'g')) || []).length)(''), 0);
  if (vagueCount > 5) flags.push({ flag: 'Excessive vague commitments', severity: 'low', desc: 'Many aspirational phrases without concrete timelines' });
  return { risk: flags.length >= 2 ? 'High' : flags.length === 1 ? 'Medium' : 'Low', flags };
}

/* ── 10 Sample ESG Report Excerpts ─────────────────────────────── */
const SAMPLE_REPORTS = [
  { id: 'SR01', company: 'TechCorp Global', title: 'Climate Strategy & Emissions', text: 'TechCorp Global has achieved a significant milestone in our climate strategy. Our Scope 1 emissions decreased to 45,000 tCO2e in FY2025, representing a 23% reduction from our 2019 baseline. Scope 2 emissions stand at 120,000 tCO2e following our transition to 78% renewable electricity across global operations. We have committed to Science Based Targets initiative (SBTi) validated near-term targets aligned with 1.5 degree pathway. Our carbon neutral commitment by 2035 is supported by $2.5 billion investment in renewable energy procurement, including 450 MW of solar power purchase agreements. Total energy consumption was 850 GWh, with energy efficiency improvements delivering 15% reduction per unit of revenue. We continue to monitor Scope 3 emissions across our value chain, estimated at 2.3 million tonnes CO2e. Our internal carbon price of $85 per tonne drives capital allocation decisions toward low-carbon alternatives.' },
  { id: 'SR02', company: 'GreenBank Holdings', title: 'Sustainable Finance & Governance', text: 'GreenBank Holdings board of directors comprises 12 members, of which 9 are independent non-executive directors. Our board diversity includes 42% female representation, exceeding our 40% target. The Risk Committee oversees climate risk management and TCFD implementation. Executive compensation is linked to ESG performance with 20% of variable pay tied to sustainability KPIs including emissions reduction and diversity targets. We have financed $15 billion in green and sustainable lending, with our green bond framework receiving a positive second-party opinion from ISS ESG. Anti-corruption training completion rate reached 98% across 35,000 employees globally. Our whistleblowing hotline received 127 reports in FY2025, all investigated within 30 days. Tax transparency improved with country-by-country reporting covering 45 jurisdictions. Effective tax rate was 22.3%, compared to statutory rate of 25%.' },
  { id: 'SR03', company: 'MineralEx Corp', title: 'Environmental Impact & Water', text: 'MineralEx Corp operations consumed 8,500 megalitres of water in FY2025 with a water recycling rate of 72%. Water stress assessments were conducted at all 15 operational sites using WRI Aqueduct tool. Wastewater discharge met regulatory standards at all sites with zero significant effluent incidents. Our biodiversity management plan covers 12,000 hectares of rehabilitated land. We invested $340 million in tailings dam safety improvements. Air quality monitoring shows SOx emissions of 2,100 tonnes and NOx of 1,450 tonnes, both below permitted limits. Hazardous waste generated was 45,000 tonnes with 85% treated through certified facilities. Our circular economy strategy achieved 92% waste diversion from landfill at processing plants. We acknowledge 3 environmental incidents in the reporting period, all classified as minor with no lasting ecosystem damage. Particulate matter PM2.5 levels measured at community monitoring stations remained within WHO guidelines.' },
  { id: 'SR04', company: 'Omega Pharma', title: 'Workforce & Social Impact', text: 'Omega Pharma total workforce reached 52,000 employees across 28 countries. Employee turnover rate decreased to 11.2% from 14.5% the prior year. We invested $180 million in employee training and development, averaging 42 hours per employee. Our safety record shows LTIFR of 0.32 per million hours worked, a 15% improvement. Zero fatalities were recorded for the third consecutive year. Gender diversity improved to 38% female in management roles and 45% female in total workforce. Pay gap analysis revealed a 4.2% gender pay gap, down from 6.1% in FY2023. Community investment totaled $25 million including $12 million in philanthropic donations and 45,000 employee volunteer hours. Our supply chain due diligence program screened 2,800 suppliers for human rights risks including forced labor and child labor, with 23 high-risk suppliers identified and placed on corrective action plans. Product recalls: zero in FY2025.' },
  { id: 'SR05', company: 'SolarWind Energy', title: 'Renewable Energy Transition', text: 'SolarWind Energy expanded renewable generation capacity to 12.5 GW, adding 3.2 GW of new solar and 1.8 GW of onshore wind during FY2025. Total clean energy generated was 28,500 GWh, avoiding an estimated 18 million tonnes of CO2e compared to fossil fuel alternatives. Revenue from renewable energy now represents 65% of total revenue at $8.2 billion. Our Scope 1 emissions were 125,000 tCO2e, primarily from natural gas peaking plants. We retired 2.1 GW of coal capacity ahead of schedule and plan to be coal-free by 2028. Battery storage installations reached 2,400 MWh. Community benefit agreements are in place for 92% of operational sites. 15,000 employees support operations with a 96% safety compliance rate. Investment in grid modernization totaled $1.5 billion. Science-based targets validated for near-term 2030 emissions reduction of 55% from 2020 baseline. Green bond issuance of $3 billion funded expansion.' },
  { id: 'SR06', company: 'AutoDrive Motors', title: 'EV Transition & Supply Chain', text: 'AutoDrive Motors accelerated our electric vehicle transition with EV sales reaching 340,000 units, representing 28% of total vehicle sales. We committed to 100% EV production by 2032. Total GHG emissions including Scope 3 were 45 million tonnes CO2e, with manufacturing Scope 1 and 2 emissions at 2.8 million tonnes. Our supply chain carbon footprint mapping covers 85% of Tier 1 suppliers. Critical mineral sourcing follows responsible mining standards with 100% cobalt and lithium from audited sources. Employee workforce of 125,000 includes 12,000 in EV-specific R&D. Investment in EV technology reached $6.5 billion in FY2025. We achieved 40% recycled content in battery production. Occupational safety TRIFR improved to 1.8 per million hours. 35% of board members are female. Net zero target set for 2040 with interim targets validated by SBTi. Water consumption at manufacturing plants decreased 18% through closed-loop cooling systems.' },
  { id: 'SR07', company: 'Pacific Retail Group', title: 'Circular Economy & Packaging', text: 'Pacific Retail Group has made significant progress on our circular economy commitments. Plastic packaging reduced by 35% since 2020 baseline. We eliminated single-use plastic bags across all 2,400 stores. Food waste diverted from landfill reached 88% through donation and composting programs. Total waste generated was 180,000 tonnes with 76% recycled or recovered. Our sustainable product range grew to 4,200 SKUs representing $2.1 billion in sales. Energy efficiency investments across the store portfolio delivered 22% reduction in electricity consumption per square metre. We installed 85 MW of rooftop solar across distribution centres. Employee count stands at 95,000 with diversity programs yielding 52% female workforce. Customer data privacy framework strengthened with zero data breaches. Community engagement included $18 million in local sourcing from indigenous suppliers.' },
  { id: 'SR08', company: 'Atlas Infrastructure', title: 'Climate Resilience & Adaptation', text: 'Atlas Infrastructure has integrated climate physical risk assessment across our $45 billion asset portfolio. Using RCP 8.5 scenarios we identified $3.2 billion of assets exposed to high flood risk by 2050. Adaptation investments of $890 million include flood defenses, heat-resilient materials, and stormwater management. Our TCFD-aligned disclosure covers all material climate risks and opportunities. Scope 1 emissions from construction activities were 520,000 tCO2e. We achieved 35% reduction in cement consumption through innovative low-carbon concrete alternatives. Biodiversity net gain commitments cover 100% of new projects. Environmental impact assessments completed for all 28 active construction sites. Workforce of 18,000 employees with LTIFR of 0.45. Community engagement processes established for all projects exceeding $100 million. Board governance includes dedicated Sustainability Committee meeting quarterly. Enterprise risk management framework integrates climate scenarios into financial planning.' },
  { id: 'SR09', company: 'NovaChem Industries', title: 'Pollution Control & Safety', text: 'NovaChem Industries operates 12 chemical manufacturing facilities globally. Total air emissions include SOx 3,400 tonnes, NOx 2,100 tonnes and particulate matter 890 tonnes. All facilities comply with local air quality regulations. Chemical spills: 2 minor incidents with total volume under 500 litres, both contained within site boundaries. Hazardous waste properly disposed: 125,000 tonnes through licensed treatment facilities. Process safety incidents decreased 40% to 8 events. Our pollution prevention program invested $220 million in emission control technology including catalytic converters and scrubber systems. Contaminated land remediation ongoing at 3 legacy sites with $150 million provision. Occupational health monitoring covers 100% of exposed workers. Safety culture program reduced TRIFR to 2.1 per million hours. 28,000 employees completed safety training averaging 35 hours each. Product safety assessments completed for all 1,200 active chemical products. REACH compliance maintained for EU operations.' },
  { id: 'SR10', company: 'GlobalTech Services', title: 'Digital Sustainability & Governance', text: 'GlobalTech Services is committed to sustainable digital transformation. Our data centres achieved PUE of 1.18, industry-leading efficiency. Total electricity consumption was 4,200 GWh with 92% from renewable sources through power purchase agreements. E-waste recycling rate reached 97% across all operations. We processed 15 billion customer transactions with 99.99% uptime and zero material data breaches. Board independence at 75% with 4 of 12 directors being female. Anti-corruption training completion 100% for all 78,000 employees. Executive pay ratio of CEO to median employee is 85:1. Shareholder engagement included responses to all 12 proxy proposals at AGM. Our tax strategy published transparently with effective tax rate of 21.5% across 60 jurisdictions. Internal audit function completed 45 reviews with 12 material findings all remediated. Risk management framework assessed 250 enterprise risks including AI ethics, cybersecurity and climate transition. Whistleblowing channel received 89 reports with 100% investigation completion.' },
];

/* ── Helpers ─────────────────────────────────────────────────────── */
const fmt = (v, d = 1) => v == null ? '-' : typeof v === 'number' ? (Math.abs(v) >= 1000 ? v.toLocaleString() : v.toFixed(d)) : v;
const LS_KEY = 'ra_report_parses_v1';
const loadParses = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } };
const saveParses = (d) => { try { localStorage.setItem(LS_KEY, JSON.stringify(d.slice(0, 20))); } catch {} };

const readPortfolio = () => {
  try {
    const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1') || '{}');
    if (raw.portfolios && raw.activePortfolio && raw.portfolios[raw.activePortfolio]) return raw.portfolios[raw.activePortfolio].holdings || [];
    return [];
  } catch { return []; }
};

/* ── Component ──────────────────────────────────────────────────── */
export default function EsgReportParserPage() {
  const nav = useNavigate();
  const companies = useMemo(() => GLOBAL_COMPANY_MASTER || [], []);
  const portfolio = useMemo(() => readPortfolio(), []);

  const [inputText, setInputText] = useState('');
  const [selectedSample, setSelectedSample] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [parseLog, setParseLog] = useState(() => loadParses());
  const [sortCol, setSortCol] = useState('value');
  const [sortDir, setSortDir] = useState('desc');
  const [compareText, setCompareText] = useState('');
  const [compareAnalysis, setCompareAnalysis] = useState(null);
  const [batchTexts, setBatchTexts] = useState('');
  const [batchResults, setBatchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('analysis');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSampleChange = useCallback((e) => {
    const id = e.target.value;
    setSelectedSample(id);
    if (id) {
      const s = SAMPLE_REPORTS.find(r => r.id === id);
      if (s) setInputText(s.text);
    }
  }, []);

  const runAnalysis = useCallback((text) => {
    if (!text || text.trim().length < 20) return null;
    const words = text.trim().split(/\s+/);
    const wordCount = words.length;
    const { topics, eCt, sCt, gCt } = classifyTopics(text);
    const entities = extractEntities(text);
    const sentiment = scoreSentiment(text);
    const paraSentiments = paragraphSentiments(text);
    const keyPhrases = extractKeyPhrases(text);
    const quality = computeReportQuality(entities, topics, wordCount, text);
    const greenwash = detectGreenwashing(sentiment, entities, wordCount);
    // Match companies
    const matchedCompanies = companies.filter(c => {
      const name = (c.company_name || c.name || '').toLowerCase();
      return name.length > 3 && text.toLowerCase().includes(name);
    }).slice(0, 10);
    // ESRS mapping
    const esrsTopics = {};
    Object.entries(topics).forEach(([topic, data]) => {
      const esrs = data.esrs;
      if (!esrsTopics[esrs]) esrsTopics[esrs] = { standard: esrs, topics: [], totalCount: 0 };
      esrsTopics[esrs].topics.push(topic);
      esrsTopics[esrs].totalCount += data.count;
    });
    return {
      wordCount, topicCount: Object.keys(topics).length, entityCount: entities.length,
      sentiment, topics, entities, paraSentiments, keyPhrases, quality, greenwash,
      matchedCompanies, esrsTopics: Object.values(esrsTopics).sort((a, b) => b.totalCount - a.totalCount),
      eCt, sCt, gCt, timestamp: new Date().toISOString(),
    };
  }, [companies]);

  const handleAnalyze = useCallback(() => {
    const result = runAnalysis(inputText);
    if (result) {
      setAnalysis(result);
      const log = [{ id: Date.now(), title: selectedSample ? SAMPLE_REPORTS.find(r => r.id === selectedSample)?.title || 'Custom' : 'Custom Parse', timestamp: result.timestamp, wordCount: result.wordCount, topics: result.topicCount, entities: result.entityCount, sentiment: result.sentiment.score }, ...parseLog].slice(0, 20);
      setParseLog(log);
      saveParses(log);
    }
  }, [inputText, runAnalysis, selectedSample, parseLog]);

  const handleCompare = useCallback(() => {
    const result = runAnalysis(compareText);
    if (result) setCompareAnalysis(result);
  }, [compareText, runAnalysis]);

  const handleBatch = useCallback(() => {
    const sections = batchTexts.split(/---+/).filter(s => s.trim().length > 20);
    const results = sections.map((s, i) => {
      const r = runAnalysis(s.trim());
      return r ? { ...r, section: `Section ${i + 1}`, preview: s.trim().substring(0, 60) + '...' } : null;
    }).filter(Boolean);
    setBatchResults(results);
  }, [batchTexts, runAnalysis]);

  const handleTFIDFSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    const docs = SAMPLE_REPORTS.map(r => r.text);
    const terms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const results = computeTFIDF(docs, terms);
    const ranked = results.map((r, i) => ({
      report: SAMPLE_REPORTS[i],
      score: r.score,
      preview: r.doc.substring(0, 200) + '...',
    })).sort((a, b) => b.score - a.score).filter(r => r.score > 0);
    setSearchResults(ranked);
  }, [searchQuery]);

  const topicChartData = useMemo(() => {
    if (!analysis) return [];
    return Object.entries(analysis.topics).map(([topic, data]) => ({
      topic: topic.replace(/_/g, ' '), count: data.count, pillar: data.pillar, fill: data.pillar === 'E' ? T.sage : data.pillar === 'S' ? T.gold : T.navy,
    })).sort((a, b) => b.count - a.count);
  }, [analysis]);

  const sortedEntities = useMemo(() => {
    if (!analysis) return [];
    return [...analysis.entities].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [analysis, sortCol, sortDir]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  /* ── Exports ────────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    if (!analysis) return;
    const rows = [['Value', 'Type', 'Unit', 'Context'].join(','), ...analysis.entities.map(e => [e.value, e.type, e.unit, `"${e.context.replace(/"/g, '""')}"`].join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `esg_report_data_points_${Date.now()}.csv`; a.click();
  }, [analysis]);

  const exportJSON = useCallback(() => {
    if (!analysis) return;
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `esg_report_analysis_${Date.now()}.json`; a.click();
  }, [analysis]);

  const exportPrint = useCallback(() => { window.print(); }, []);

  /* ── Styles ─────────────────────────────────────────────────── */
  const card = { background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 };
  const kpiCard = { ...card, padding: 16, textAlign: 'center', flex: '1 1 140px', minWidth: 140 };
  const badge = (bg, color) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color });
  const btn = (bg = T.navy, color = '#fff') => ({ padding: '8px 18px', borderRadius: 8, border: 'none', background: bg, color, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font });
  const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: T.textSec, borderBottom: `2px solid ${T.border}`, cursor: 'pointer', userSelect: 'none' };
  const tdStyle = { padding: '10px 12px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}` };
  const tabBtn = (active) => ({ ...btn(active ? T.navy : T.surfaceH, active ? '#fff' : T.text), borderRadius: 8, marginRight: 6 });

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: T.navy, margin: 0 }}>ESG Report Parser & Document Intelligence</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {['NLP', 'TF-IDF', 'Entity Extraction', 'Sentiment'].map(b => <span key={b} style={badge(`${T.navy}15`, T.navy)}>{b}</span>)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btn(T.sage)} onClick={exportCSV}>Export CSV</button>
          <button style={btn(T.gold, T.navy)} onClick={exportJSON}>Export JSON</button>
          <button style={btn(T.surfaceH, T.navy)} onClick={exportPrint}>Print</button>
        </div>
      </div>

      {/* Cross-nav */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['AI Sentiment', '/ai-sentiment'], ['Materiality', '/csrd-dma'], ['ISSB/TCFD', '/issb-tcfd'], ['GRI Standards', '/comprehensive-reporting'], ['Predictive ESG', '/predictive-esg']].map(([l, p]) => (
          <button key={p} style={{ ...btn(T.surfaceH, T.navyL), fontSize: 12, padding: '5px 12px' }} onClick={() => nav(p)}>{l}</button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[['analysis', 'Analysis'], ['compare', 'Compare Mode'], ['batch', 'Batch Analysis'], ['log', 'Parse Log']].map(([k, l]) => (
          <button key={k} style={tabBtn(activeTab === k)} onClick={() => setActiveTab(k)}>{l}</button>
        ))}
      </div>

      {activeTab === 'analysis' && (
        <>
          {/* Text Input Panel */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: T.navy, fontSize: 16 }}>Paste ESG Report Text</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={selectedSample} onChange={handleSampleChange} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font }}>
                  <option value="">-- Sample Reports --</option>
                  {SAMPLE_REPORTS.map(r => <option key={r.id} value={r.id}>{r.company}: {r.title}</option>)}
                </select>
                <button style={btn(T.navy)} onClick={handleAnalyze} disabled={!inputText || inputText.length < 20}>Analyze</button>
              </div>
            </div>
            <textarea value={inputText} onChange={e => setInputText(e.target.value.slice(0, 10000))} placeholder="Paste ESG report text here (up to 10,000 characters)..." rows={8} style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: T.textMut }}>{inputText.length}/10,000 characters</span>
              <span style={{ fontSize: 12, color: T.textMut }}>{inputText.trim().split(/\s+/).filter(Boolean).length} words</span>
            </div>
          </div>

          {!analysis && (
            <div style={{ ...card, textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>&#128196;</div>
              <h3 style={{ color: T.navy, margin: '0 0 8px' }}>No Report Analyzed Yet</h3>
              <p style={{ color: T.textSec, fontSize: 14 }}>Select a sample report or paste your own ESG report text, then click "Analyze" to extract data points, classify topics, and score sentiment.</p>
            </div>
          )}

          {analysis && (
            <>
              {/* KPI Cards */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Words Analyzed', value: analysis.wordCount.toLocaleString(), color: T.navy },
                  { label: 'ESG Topics Found', value: analysis.topicCount, color: T.sage },
                  { label: 'Entities Extracted', value: analysis.entityCount, color: T.gold },
                  { label: 'Sentiment Score', value: analysis.sentiment.score.toFixed(2), color: analysis.sentiment.score >= 0 ? T.green : T.red },
                  { label: 'E Topics', value: analysis.eCt, color: T.sage },
                  { label: 'S Topics', value: analysis.sCt, color: T.gold },
                  { label: 'G Topics', value: analysis.gCt, color: T.navy },
                  { label: 'Data Points', value: analysis.entities.length, color: T.navyL },
                ].map((kpi, i) => (
                  <div key={i} style={kpiCard}>
                    <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{kpi.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              {/* Topic Classification Chart */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Topic Classification (E/S/G)</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={topicChartData} margin={{ left: 10, right: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="topic" angle={-35} textAnchor="end" tick={{ fontSize: 11, fill: T.textSec }} height={80} />
                    <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {topicChartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Extracted Data Points Table */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Extracted Data Points ({sortedEntities.length})</h3>
                {sortedEntities.length === 0 ? <p style={{ color: T.textMut, fontSize: 13 }}>No numeric data points found in text.</p> : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {[['value', 'Value'], ['type', 'Type'], ['unit', 'Unit'], ['context', 'Context']].map(([k, l]) => (
                            <th key={k} style={thStyle} onClick={() => handleSort(k)}>{l} {sortCol === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedEntities.map((e, i) => (
                          <tr key={i} style={{ background: i % 2 ? T.surfaceH : 'transparent' }}>
                            <td style={{ ...tdStyle, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(e.value, 2)}</td>
                            <td style={tdStyle}><span style={badge(e.type === 'emissions' || e.type === 'scope_emissions' ? `${T.sage}20` : e.type === 'financial' ? `${T.gold}20` : `${T.navy}20`, e.type === 'emissions' || e.type === 'scope_emissions' ? T.sage : e.type === 'financial' ? T.gold : T.navy)}>{e.type}</span></td>
                            <td style={tdStyle}>{e.unit}</td>
                            <td style={{ ...tdStyle, fontSize: 12, color: T.textSec, maxWidth: 400 }}>...{e.context}...</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pillar Distribution Pie */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>ESG Pillar Distribution</h3>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                  <ResponsiveContainer width={280} height={260}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Environmental', value: analysis.eCt, fill: T.sage },
                          { name: 'Social', value: analysis.sCt, fill: T.gold },
                          { name: 'Governance', value: analysis.gCt, fill: T.navy },
                        ].filter(d => d.value > 0)}
                        cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                        dataKey="value" paddingAngle={3}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {[T.sage, T.gold, T.navy].map((c, i) => <Cell key={i} fill={c} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    {[
                      { label: 'Environmental', count: analysis.eCt, color: T.sage, topics: Object.entries(analysis.topics).filter(([, d]) => d.pillar === 'E').map(([t]) => t) },
                      { label: 'Social', count: analysis.sCt, color: T.gold, topics: Object.entries(analysis.topics).filter(([, d]) => d.pillar === 'S').map(([t]) => t) },
                      { label: 'Governance', count: analysis.gCt, color: T.navy, topics: Object.entries(analysis.topics).filter(([, d]) => d.pillar === 'G').map(([t]) => t) },
                    ].map((pillar, i) => (
                      <div key={i} style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, border: `1px solid ${pillar.color}30`, background: `${pillar.color}08` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: pillar.color, fontSize: 14 }}>{pillar.label}</span>
                          <span style={{ fontWeight: 700, color: pillar.color, fontSize: 18 }}>{pillar.count}</span>
                        </div>
                        <div style={{ fontSize: 12, color: T.textSec }}>
                          Topics: {pillar.topics.length > 0 ? pillar.topics.map(t => t.replace(/_/g, ' ')).join(', ') : 'None detected'}
                        </div>
                        <div style={{ marginTop: 6, background: T.surfaceH, borderRadius: 4, height: 6 }}>
                          <div style={{ width: `${Math.min(100, (pillar.count / Math.max(1, analysis.eCt + analysis.sCt + analysis.gCt)) * 100)}%`, height: '100%', background: pillar.color, borderRadius: 4 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sentiment Analysis */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Sentiment Analysis</h3>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 48, fontWeight: 700, color: analysis.sentiment.score >= 0.3 ? T.green : analysis.sentiment.score <= -0.3 ? T.red : T.amber }}>{analysis.sentiment.score.toFixed(2)}</div>
                    <div style={{ fontSize: 12, color: T.textSec }}>Overall Sentiment</div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 600, color: T.green }}>{analysis.sentiment.positive}</div><div style={{ fontSize: 11, color: T.textMut }}>Positive</div></div>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 600, color: T.red }}>{analysis.sentiment.negative}</div><div style={{ fontSize: 11, color: T.textMut }}>Negative</div></div>
                  </div>
                </div>
                {analysis.paraSentiments.length > 0 && (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={analysis.paraSentiments}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="index" tick={{ fontSize: 11 }} label={{ value: 'Paragraph', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                      <YAxis domain={[-1, 1]} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
                      <Area type="monotone" dataKey="score" fill={`${T.sage}30`} stroke={T.sage} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Key Phrase Extraction (TF-IDF) */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Key Phrase Extraction (TF-IDF Ranked)</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {analysis.keyPhrases.slice(0, 20).map((kp, i) => (
                    <div key={i} style={{ padding: '6px 14px', borderRadius: 20, background: `${TOPIC_COLORS[i % TOPIC_COLORS.length]}18`, border: `1px solid ${TOPIC_COLORS[i % TOPIC_COLORS.length]}40`, fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: T.text }}>{kp.phrase}</span>
                      <span style={{ marginLeft: 6, fontSize: 11, color: T.textMut }}>({kp.count}x, TF-IDF: {kp.tfidf.toFixed(4)})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ESRS Topic Mapping */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>CSRD ESRS Topic Mapping</h3>
                {analysis.esrsTopics.length === 0 ? <p style={{ color: T.textMut, fontSize: 13 }}>No ESRS topics identified.</p> : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {analysis.esrsTopics.map((esrs, i) => (
                      <div key={i} style={{ padding: 14, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceH }}>
                        <div style={{ fontWeight: 600, color: T.navy, fontSize: 14, marginBottom: 6 }}>{esrs.standard}</div>
                        <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>Mentions: {esrs.totalCount}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {esrs.topics.map(t => <span key={t} style={badge(`${T.sage}20`, T.sage)}>{t.replace(/_/g, ' ')}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Entity-to-Company Matching */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Entity-to-Company Matching</h3>
                {analysis.matchedCompanies.length === 0 ? <p style={{ color: T.textMut, fontSize: 13 }}>No company names matched from the report text against the global company master.</p> : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {analysis.matchedCompanies.map((c, i) => (
                      <div key={i} style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, minWidth: 200 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: T.navy }}>{c.company_name || c.name}</div>
                        <div style={{ fontSize: 12, color: T.textSec }}>{c.sector} | {c._displayExchange || 'N/A'}</div>
                        <div style={{ fontSize: 12, color: T.textMut }}>ESG: {c.esg_score ?? '-'} | Risk: {c.transition_risk_score ?? '-'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Report Quality Score */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Report Quality Score</h3>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 48, fontWeight: 700, color: analysis.quality.overall >= 70 ? T.green : analysis.quality.overall >= 40 ? T.amber : T.red }}>{analysis.quality.overall}</div>
                    <div style={{ fontSize: 12, color: T.textSec }}>Overall /100</div>
                  </div>
                  {[['Data Density', analysis.quality.dataPointDensity], ['Topic Coverage', analysis.quality.topicCoverage], ['Quantification', analysis.quality.quantification], ['Specificity', analysis.quality.specificity]].map(([label, val]) => (
                    <div key={label} style={{ flex: '1 1 120px' }}>
                      <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>{label}</div>
                      <div style={{ background: T.surfaceH, borderRadius: 6, height: 10, overflow: 'hidden' }}>
                        <div style={{ width: `${val}%`, height: '100%', background: val >= 70 ? T.green : val >= 40 ? T.amber : T.red, borderRadius: 6, transition: 'width 0.5s' }} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 2 }}>{val}/100</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Greenwashing Detection */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Greenwashing Detection</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <span style={badge(analysis.greenwash.risk === 'High' ? `${T.red}20` : analysis.greenwash.risk === 'Medium' ? `${T.amber}20` : `${T.green}20`, analysis.greenwash.risk === 'High' ? T.red : analysis.greenwash.risk === 'Medium' ? T.amber : T.green)}>Risk: {analysis.greenwash.risk}</span>
                  <span style={{ fontSize: 13, color: T.textSec }}>{analysis.greenwash.flags.length} flags identified</span>
                </div>
                {analysis.greenwash.flags.length === 0 ? (
                  <p style={{ color: T.green, fontSize: 13 }}>No greenwashing indicators detected. Report appears to balance qualitative claims with quantitative data.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {analysis.greenwash.flags.map((f, i) => (
                      <div key={i} style={{ padding: 12, borderRadius: 8, border: `1px solid ${f.severity === 'high' ? T.red : f.severity === 'medium' ? T.amber : T.gold}30`, background: `${f.severity === 'high' ? T.red : f.severity === 'medium' ? T.amber : T.gold}08` }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: f.severity === 'high' ? T.red : T.amber }}>{f.flag}</div>
                        <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{f.desc}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* TF-IDF Cross-Document Search */}
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>TF-IDF Document Search Across Sample Reports</h3>
                <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 12px' }}>Search across all 10 sample reports using TF-IDF relevance scoring.</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input
                    type="text" value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Enter search terms (e.g., carbon emissions renewable)"
                    style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font }}
                    onKeyDown={e => e.key === 'Enter' && handleTFIDFSearch()}
                  />
                  <button style={btn(T.navyL)} onClick={handleTFIDFSearch}>Search</button>
                </div>
                {searchResults.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {searchResults.map((r, i) => (
                      <div key={i} style={{ padding: 14, borderRadius: 8, border: `1px solid ${T.border}`, background: i === 0 ? `${T.sage}08` : 'transparent' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <div>
                            <span style={{ fontWeight: 600, color: T.navy, fontSize: 14 }}>{r.report.company}</span>
                            <span style={{ marginLeft: 8, color: T.textSec, fontSize: 12 }}>{r.report.title}</span>
                          </div>
                          <span style={badge(`${T.sage}20`, T.sage)}>Relevance: {(r.score * 1000).toFixed(2)}</span>
                        </div>
                        <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>{r.preview}</div>
                        <button
                          style={{ ...btn(T.surfaceH, T.navyL), marginTop: 8, fontSize: 11, padding: '4px 10px' }}
                          onClick={() => { setInputText(r.report.text); setSelectedSample(r.report.id); }}
                        >Load This Report</button>
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery && searchResults.length === 0 && (
                  <p style={{ color: T.textMut, fontSize: 13 }}>No matching reports found. Try different search terms.</p>
                )}
              </div>

              {/* Data Point Summary by Type */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Extracted Data Summary by Type</h3>
                {(() => {
                  const byType = {};
                  analysis.entities.forEach(e => {
                    if (!byType[e.type]) byType[e.type] = { type: e.type, count: 0, values: [], units: new Set() };
                    byType[e.type].count++;
                    byType[e.type].values.push(e.value);
                    byType[e.type].units.add(e.unit);
                  });
                  const summaries = Object.values(byType).sort((a, b) => b.count - a.count);
                  if (summaries.length === 0) return <p style={{ color: T.textMut, fontSize: 13 }}>No data points extracted.</p>;
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                      {summaries.map((s, i) => (
                        <div key={i} style={{ padding: 14, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceH }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: T.navy, marginBottom: 4, textTransform: 'capitalize' }}>{s.type.replace(/_/g, ' ')}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textSec, marginBottom: 6 }}>
                            <span>{s.count} data point{s.count !== 1 ? 's' : ''}</span>
                            <span>Units: {[...s.units].join(', ')}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                            <div><span style={{ color: T.textMut }}>Min: </span><span style={{ fontWeight: 600 }}>{Math.min(...s.values).toLocaleString()}</span></div>
                            <div><span style={{ color: T.textMut }}>Max: </span><span style={{ fontWeight: 600 }}>{Math.max(...s.values).toLocaleString()}</span></div>
                            <div><span style={{ color: T.textMut }}>Avg: </span><span style={{ fontWeight: 600 }}>{(s.values.reduce((a, b) => a + b, 0) / s.values.length).toFixed(1)}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Word Frequency Analysis */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Top ESG Keyword Frequency</h3>
                {(() => {
                  const allKeywords = [];
                  Object.entries(ESG_LEXICON).forEach(([pillar, topics]) => {
                    Object.entries(topics).forEach(([topic, keywords]) => {
                      keywords.forEach(kw => {
                        const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                        const matches = (inputText.toLowerCase().match(regex) || []).length;
                        if (matches > 0) allKeywords.push({ keyword: kw, count: matches, pillar: pillar[0].toUpperCase(), topic });
                      });
                    });
                  });
                  const sorted = allKeywords.sort((a, b) => b.count - a.count).slice(0, 15);
                  if (sorted.length === 0) return <p style={{ color: T.textMut, fontSize: 13 }}>No ESG keywords detected.</p>;
                  return (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={sorted} layout="vertical" margin={{ left: 100, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="keyword" tick={{ fontSize: 11 }} width={95} />
                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(val, name, props) => [`${val} mentions`, `${props.payload.pillar} - ${props.payload.topic}`]} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {sorted.map((d, i) => <Cell key={i} fill={d.pillar === 'E' ? T.sage : d.pillar === 'S' ? T.gold : T.navy} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>

              {/* Readability Metrics */}
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Document Readability & Structure Metrics</h3>
                {(() => {
                  const sentences = inputText.split(/[.!?]+/).filter(s => s.trim().length > 5);
                  const words = inputText.trim().split(/\s+/).filter(Boolean);
                  const avgWordLen = words.reduce((s, w) => s + w.length, 0) / Math.max(1, words.length);
                  const avgSentenceLen = words.length / Math.max(1, sentences.length);
                  const paragraphs = inputText.split(/\n\n+/).filter(p => p.trim().length > 10);
                  const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
                  const lexicalDiversity = uniqueWords / Math.max(1, words.length);
                  // Simplified Flesch-Kincaid approximation
                  const syllableCount = words.reduce((s, w) => s + Math.max(1, w.replace(/[^aeiouy]/gi, '').length), 0);
                  const fkGrade = 0.39 * avgSentenceLen + 11.8 * (syllableCount / Math.max(1, words.length)) - 15.59;
                  const metrics = [
                    { label: 'Total Characters', value: inputText.length.toLocaleString() },
                    { label: 'Total Words', value: words.length.toLocaleString() },
                    { label: 'Sentences', value: sentences.length },
                    { label: 'Paragraphs', value: paragraphs.length },
                    { label: 'Unique Words', value: uniqueWords.toLocaleString() },
                    { label: 'Lexical Diversity', value: (lexicalDiversity * 100).toFixed(1) + '%' },
                    { label: 'Avg Word Length', value: avgWordLen.toFixed(1) + ' chars' },
                    { label: 'Avg Sentence Length', value: avgSentenceLen.toFixed(1) + ' words' },
                    { label: 'FK Grade Level', value: Math.max(0, fkGrade).toFixed(1) },
                    { label: 'Reading Level', value: fkGrade > 14 ? 'Academic' : fkGrade > 10 ? 'Professional' : fkGrade > 7 ? 'Business' : 'General' },
                  ];
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                      {metrics.map((m, i) => (
                        <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: T.surfaceH, textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>{m.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </>
      )}

      {/* Compare Mode */}
      {activeTab === 'compare' && (
        <>
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Side-by-Side Report Comparison</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: T.navy, marginBottom: 8 }}>Report A</div>
              <textarea value={inputText} onChange={e => setInputText(e.target.value.slice(0, 10000))} placeholder="Paste Report A text..." rows={6} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, resize: 'vertical', boxSizing: 'border-box' }} />
              <button style={{ ...btn(T.navy), marginTop: 8 }} onClick={handleAnalyze} disabled={!inputText || inputText.length < 20}>Analyze A</button>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: T.navy, marginBottom: 8 }}>Report B</div>
              <textarea value={compareText} onChange={e => setCompareText(e.target.value.slice(0, 10000))} placeholder="Paste Report B text..." rows={6} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, resize: 'vertical', boxSizing: 'border-box' }} />
              <button style={{ ...btn(T.sage), marginTop: 8 }} onClick={handleCompare} disabled={!compareText || compareText.length < 20}>Analyze B</button>
            </div>
          </div>
          {analysis && compareAnalysis && (
            <div style={{ marginTop: 24 }}>
              <h4 style={{ color: T.navy, margin: '0 0 12px' }}>Comparison Results</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Metric</th>
                    <th style={thStyle}>Report A</th>
                    <th style={thStyle}>Report B</th>
                    <th style={thStyle}>Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Words', analysis.wordCount, compareAnalysis.wordCount],
                    ['Topics Found', analysis.topicCount, compareAnalysis.topicCount],
                    ['Entities Extracted', analysis.entityCount, compareAnalysis.entityCount],
                    ['Sentiment', analysis.sentiment.score.toFixed(2), compareAnalysis.sentiment.score.toFixed(2)],
                    ['E Mentions', analysis.eCt, compareAnalysis.eCt],
                    ['S Mentions', analysis.sCt, compareAnalysis.sCt],
                    ['G Mentions', analysis.gCt, compareAnalysis.gCt],
                    ['Quality Score', analysis.quality.overall, compareAnalysis.quality.overall],
                    ['Greenwash Risk', analysis.greenwash.risk, compareAnalysis.greenwash.risk],
                  ].map(([label, a, b], i) => {
                    const diff = typeof a === 'number' && typeof b === 'number' ? (a - b) : '-';
                    return (
                      <tr key={i} style={{ background: i % 2 ? T.surfaceH : 'transparent' }}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{label}</td>
                        <td style={tdStyle}>{a}</td>
                        <td style={tdStyle}>{b}</td>
                        <td style={{ ...tdStyle, color: typeof diff === 'number' ? (diff > 0 ? T.green : diff < 0 ? T.red : T.textMut) : T.textMut }}>{typeof diff === 'number' ? (diff > 0 ? '+' : '') + diff.toFixed(2) : diff}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Compare topic coverage */}
              <div style={{ marginTop: 20 }}>
                <h4 style={{ color: T.navy, margin: '0 0 12px', fontSize: 14 }}>Topic Coverage Comparison</h4>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {Object.keys({ ...analysis.topics, ...compareAnalysis.topics }).sort().map(topic => {
                    const aCount = analysis.topics[topic]?.count || 0;
                    const bCount = compareAnalysis.topics[topic]?.count || 0;
                    return (
                      <div key={topic} style={{ minWidth: 120, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>{topic.replace(/_/g, ' ')}</div>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: T.navy }}>{aCount}</span>
                          <span style={{ fontSize: 12, color: T.textMut }}>vs</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: T.sage }}>{bCount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Comparison Bar Chart */}
              <div style={{ marginTop: 20 }}>
                <h4 style={{ color: T.navy, margin: '0 0 12px', fontSize: 14 }}>Pillar Comparison Chart</h4>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[
                    { pillar: 'Environmental', A: analysis.eCt, B: compareAnalysis.eCt },
                    { pillar: 'Social', A: analysis.sCt, B: compareAnalysis.sCt },
                    { pillar: 'Governance', A: analysis.gCt, B: compareAnalysis.gCt },
                    { pillar: 'Total Topics', A: analysis.topicCount, B: compareAnalysis.topicCount },
                    { pillar: 'Entities', A: analysis.entityCount, B: compareAnalysis.entityCount },
                    { pillar: 'Quality', A: analysis.quality.overall, B: compareAnalysis.quality.overall },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="pillar" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="A" name="Report A" fill={T.navy} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="B" name="Report B" fill={T.sage} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Sentiment Comparison */}
              <div style={{ marginTop: 20 }}>
                <h4 style={{ color: T.navy, margin: '0 0 12px', fontSize: 14 }}>Sentiment Comparison</h4>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ flex: 1, textAlign: 'center', padding: 16, borderRadius: 8, background: `${T.navy}08`, border: `1px solid ${T.navy}20` }}>
                    <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>Report A Sentiment</div>
                    <div style={{ fontSize: 36, fontWeight: 700, color: analysis.sentiment.score >= 0 ? T.green : T.red }}>{analysis.sentiment.score.toFixed(2)}</div>
                    <div style={{ fontSize: 12, color: T.textMut }}>{analysis.sentiment.positive} positive, {analysis.sentiment.negative} negative</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', padding: 16, borderRadius: 8, background: `${T.sage}08`, border: `1px solid ${T.sage}20` }}>
                    <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>Report B Sentiment</div>
                    <div style={{ fontSize: 36, fontWeight: 700, color: compareAnalysis.sentiment.score >= 0 ? T.green : T.red }}>{compareAnalysis.sentiment.score.toFixed(2)}</div>
                    <div style={{ fontSize: 12, color: T.textMut }}>{compareAnalysis.sentiment.positive} positive, {compareAnalysis.sentiment.negative} negative</div>
                  </div>
                </div>
              </div>
              {/* ESRS Coverage Comparison */}
              <div style={{ marginTop: 20 }}>
                <h4 style={{ color: T.navy, margin: '0 0 12px', fontSize: 14 }}>ESRS Standard Coverage</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {['E1 - Climate Change', 'E2 - Pollution', 'E3 - Water & Marine', 'E4 - Biodiversity', 'E5 - Resource Use & Circular Economy', 'S1 - Own Workforce', 'S2 - Workers in Value Chain', 'S3 - Affected Communities', 'S4 - Consumers & End-Users', 'G1 - Business Conduct'].map(esrs => {
                    const aMatch = analysis.esrsTopics.find(e => e.standard === esrs);
                    const bMatch = compareAnalysis.esrsTopics.find(e => e.standard === esrs);
                    return (
                      <div key={esrs} style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
                        <div style={{ fontWeight: 600, color: T.navy, marginBottom: 4 }}>{esrs}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: aMatch ? T.green : T.textMut }}>A: {aMatch ? aMatch.totalCount + ' mentions' : 'Not covered'}</span>
                          <span style={{ color: bMatch ? T.green : T.textMut }}>B: {bMatch ? bMatch.totalCount + ' mentions' : 'Not covered'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Sample Comparison */}
        <div style={card}>
          <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>Quick Load Sample Reports for Comparison</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {SAMPLE_REPORTS.map(r => (
              <div key={r.id} style={{ padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceH }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: T.navy }}>{r.company}</div>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>{r.title}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ ...btn(T.navy), fontSize: 11, padding: '3px 8px' }} onClick={() => { setInputText(r.text); setSelectedSample(r.id); }}>Load as A</button>
                  <button style={{ ...btn(T.sage), fontSize: 11, padding: '3px 8px' }} onClick={() => setCompareText(r.text)}>Load as B</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        </>
      )}

      {/* Batch Analysis */}
      {activeTab === 'batch' && (
        <>
        <div style={card}>
          <h3 style={{ margin: '0 0 8px', color: T.navy, fontSize: 16 }}>Batch Analysis</h3>
          <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 12px' }}>Separate multiple company sections with "---" (three dashes).</p>
          <textarea value={batchTexts} onChange={e => setBatchTexts(e.target.value)} placeholder={"Company A sustainability report text...\n---\nCompany B sustainability report text...\n---\nCompany C sustainability report text..."} rows={8} style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, resize: 'vertical', boxSizing: 'border-box' }} />
          <button style={{ ...btn(T.navy), marginTop: 10 }} onClick={handleBatch} disabled={!batchTexts || batchTexts.length < 30}>Run Batch Analysis</button>

          {batchResults.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ color: T.navy, margin: '0 0 12px', fontSize: 14 }}>Batch Results ({batchResults.length} sections)</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Section', 'Words', 'Topics', 'Entities', 'Sentiment', 'E', 'S', 'G', 'Quality'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {batchResults.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 ? T.surfaceH : 'transparent' }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{r.section}</td>
                      <td style={tdStyle}>{r.wordCount}</td>
                      <td style={tdStyle}>{r.topicCount}</td>
                      <td style={tdStyle}>{r.entityCount}</td>
                      <td style={{ ...tdStyle, color: r.sentiment.score >= 0 ? T.green : T.red }}>{r.sentiment.score.toFixed(2)}</td>
                      <td style={tdStyle}>{r.eCt}</td>
                      <td style={tdStyle}>{r.sCt}</td>
                      <td style={tdStyle}>{r.gCt}</td>
                      <td style={tdStyle}>{r.quality.overall}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Batch comparison chart */}
              <div style={{ marginTop: 20 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={batchResults.map(r => ({ name: r.section, E: r.eCt, S: r.sCt, G: r.gCt, quality: r.quality.overall }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="E" fill={T.sage} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="S" fill={T.gold} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="G" fill={T.navy} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Batch Heatmap Summary */}
        {batchResults.length > 1 && (
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Batch Report Heatmap</h3>
            <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 12px' }}>Visual comparison of ESG coverage across all batch sections.</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Section</th>
                    {Object.keys(ESG_LEXICON.environmental).concat(Object.keys(ESG_LEXICON.social), Object.keys(ESG_LEXICON.governance)).map(t => (
                      <th key={t} style={{ ...thStyle, fontSize: 10, writingMode: 'vertical-lr', textOrientation: 'mixed', height: 80 }}>{t.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {batchResults.map((r, i) => {
                    const allTopics = Object.keys(ESG_LEXICON.environmental).concat(Object.keys(ESG_LEXICON.social), Object.keys(ESG_LEXICON.governance));
                    return (
                      <tr key={i}>
                        <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: 'nowrap' }}>{r.section}</td>
                        {allTopics.map(t => {
                          const count = r.topics[t]?.count || 0;
                          const intensity = Math.min(1, count / 10);
                          const bg = count > 0 ? `rgba(90, 138, 106, ${intensity * 0.8 + 0.15})` : T.surfaceH;
                          return (
                            <td key={t} style={{ ...tdStyle, textAlign: 'center', background: bg, color: count > 3 ? '#fff' : T.text, fontSize: 12, fontWeight: count > 0 ? 600 : 400, minWidth: 32 }}>
                              {count > 0 ? count : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Batch Sentiment Comparison */}
        {batchResults.length > 1 && (
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Batch Sentiment Comparison</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {batchResults.map((r, i) => (
                <div key={i} style={{ flex: '1 1 160px', padding: 14, borderRadius: 8, border: `1px solid ${r.sentiment.score >= 0 ? T.green : T.red}30`, textAlign: 'center', background: `${r.sentiment.score >= 0 ? T.green : T.red}06` }}>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>{r.section}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: r.sentiment.score >= 0.3 ? T.green : r.sentiment.score <= -0.3 ? T.red : T.amber }}>
                    {r.sentiment.score.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>
                    +{r.sentiment.positive} / -{r.sentiment.negative}
                  </div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>
                    Quality: {r.quality.overall}/100
                  </div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>
                    <span style={badge(r.greenwash.risk === 'High' ? `${T.red}20` : r.greenwash.risk === 'Medium' ? `${T.amber}20` : `${T.green}20`, r.greenwash.risk === 'High' ? T.red : r.greenwash.risk === 'Medium' ? T.amber : T.green)}>
                      GW: {r.greenwash.risk}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </>
      )}

      {/* Parse Log */}
      {activeTab === 'log' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: T.navy, fontSize: 16 }}>Historical Parse Log ({parseLog.length}/20)</h3>
            <button style={btn(T.red + '20', T.red)} onClick={() => { setParseLog([]); saveParses([]); }}>Clear Log</button>
          </div>
          {parseLog.length === 0 ? <p style={{ color: T.textMut, fontSize: 13 }}>No previous analyses. Run an analysis to start building the log.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Title', 'Timestamp', 'Words', 'Topics', 'Entities', 'Sentiment'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {parseLog.map((p, i) => (
                  <tr key={p.id || i} style={{ background: i % 2 ? T.surfaceH : 'transparent' }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{p.title}</td>
                    <td style={tdStyle}>{new Date(p.timestamp).toLocaleString()}</td>
                    <td style={tdStyle}>{p.wordCount}</td>
                    <td style={tdStyle}>{p.topics}</td>
                    <td style={tdStyle}>{p.entities}</td>
                    <td style={{ ...tdStyle, color: p.sentiment >= 0 ? T.green : T.red }}>{(p.sentiment || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: T.textMut }}>
        EP-W1 ESG Report Parser & Document Intelligence | Sprint W AI & NLP Analytics | {companies.length} companies in master | Portfolio: {portfolio.length} holdings
      </div>
    </div>
  );
}
