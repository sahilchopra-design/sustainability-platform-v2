import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const COMPANIES = [
  'Shell plc','BP plc','TotalEnergies','ExxonMobil','Chevron','Equinor','Repsol','Eni SpA',
  'HSBC Holdings','Barclays plc','BNP Paribas','Deutsche Bank','ING Group','Société Générale','UniCredit','Santander',
  'Apple Inc','Microsoft Corp','Alphabet Inc','Meta Platforms','Amazon','Samsung Electronics','TSMC','Intel Corp',
  'Unilever','Nestlé','Danone','AB InBev','Kraft Heinz','Diageo','LOreal','Procter Gamble',
  'Volkswagen AG','Toyota Motor','BMW Group','Mercedes-Benz','Stellantis','Renault','Volvo Group','Ford Motor',
  'ArcelorMittal','ThyssenKrupp','Glencore','Rio Tinto','BHP Group','Anglo American','Alcoa Corp','Nucor Corp',
  'Siemens AG','ABB Ltd','Schneider Electric','Honeywell','Emerson Electric','GE Vernova','Vestas Wind','Orsted',
  'NextEra Energy','Enel SpA','Iberdrola','EDF Group','RWE AG','E.ON SE','Vattenfall','Engie SA',
  'Walmart','Amazon.com','Carrefour','Tesco plc','Ahold Delhaize','Kroger','Lidl','IKEA Group',
  'AXA Group','Allianz SE','Munich Re','Swiss Re','Zurich Insurance','Aviva plc','Legal General','Prudential plc',
];

const SECTORS = ['Energy','Banking','Technology','Consumer Goods','Automotive','Materials','Industrials','Utilities','Retail','Insurance'];
const DOC_TYPES = ['Annual Report','Sustainability Report','CDP Response','TCFD Report','SFDR PAI','Proxy Statement','10-K','ESG Supplement'];
const GW_RISKS = ['Low','Medium','High','Critical'];
const LANGUAGES = ['English','German','French','Spanish','Dutch','Italian'];

const DOCUMENTS = Array.from({ length: 80 }, (_, i) => {
  const company = COMPANIES[i];
  const sector = SECTORS[Math.floor(sr(i * 3) * 10)];
  const year = 2022 + Math.floor(sr(i * 7) * 5);
  const type = DOC_TYPES[Math.floor(sr(i * 11) * 8)];
  const pages = Math.floor(sr(i * 13) * 350) + 50;
  const wordCount = Math.floor(sr(i * 17) * 105000) + 15000;
  const language = LANGUAGES[Math.floor(sr(i * 19) * 6)];
  const extracted = sr(i * 23) > 0.25;
  const greenwashScore = Math.floor(sr(i * 29) * 100);
  const greenwashRisk = greenwashScore < 25 ? 'Low' : greenwashScore < 50 ? 'Medium' : greenwashScore < 75 ? 'High' : 'Critical';
  const compliancePct = Math.floor(sr(i * 31) * 70) + 30;
  return { id: i + 1, company, sector, year, type, pages, wordCount, language, extracted, greenwashRisk, greenwashScore, compliancePct };
});

const ESRS_STANDARDS = ['ESRS E1','ESRS E2','ESRS E3','ESRS E4','ESRS E5','ESRS S1','ESRS S2','ESRS S3','ESRS S4','ESRS G1','IFRS S1','IFRS S2','TCFD Governance','TCFD Strategy','SEC Climate Rule','SFDR PAI'];

const EXCERPT_TEXTS = [
  'Our Scope 1 and 2 emissions decreased by 18% compared to 2020 baseline, driven by renewable energy procurement.',
  'We have committed to achieve net-zero greenhouse gas emissions across our value chain by 2050.',
  'Climate-related financial risks are integrated into our enterprise risk management framework.',
  'Biodiversity loss represents a material risk to our agricultural supply chains in tropical regions.',
  'Water consumption intensity reduced by 22% against our 2018 baseline across manufacturing sites.',
  'We engage with over 3,000 suppliers on environmental and social performance standards annually.',
  'Our workforce gender pay gap stands at 12.4%, down from 15.8% in the prior reporting period.',
  'Board oversight of climate-related risks is conducted quarterly through the Risk Committee.',
  'We have validated science-based targets for Scope 1, 2, and 3 emissions through SBTi.',
  'Physical risk assessments were conducted for 95% of our asset portfolio under RCP 4.5 and 8.5.',
  'Our taxonomy-aligned green revenue represents 34% of total consolidated revenue for FY2024.',
  'Transition plan includes 5.2bn capital allocation to low-carbon technologies through 2030.',
];

const STANDARD_MAPPED = ['ESRS E1-4','ESRS E1-1','ESRS E1-5','ESRS E4-2','ESRS E3-1','ESRS S2-3','ESRS S1-16','ESRS G1-2','IFRS S2-6','IFRS S2-14','ESRS E1-8','ESRS E1-3'];
const GAPS = [
  'Scope 3 category breakdown missing','Baseline year not specified','No third-party verification referenced',
  'Methodology not disclosed','Forward-looking targets absent','Quantification missing','Sector-specific metrics absent',
  'Transition plan details lacking','Scenario analysis not included','TCFD cross-reference missing','None identified','Completeness requires additional data points',
];

const EXTRACTIONS = EXCERPT_TEXTS.map((excerpt, i) => ({
  id: i + 1, excerpt, standard: STANDARD_MAPPED[i],
  confidence: Math.floor(sr(i * 37) * 34) + 65,
  completeness: Math.floor(sr(i * 41) * 60) + 40,
  gap: GAPS[i],
}));

const GW_CATEGORIES = ['Vague Claims','Unsubstantiated Targets','Missing Baselines','Cherry-picking Data','Misleading Scope','False Labeling','Offsetting Abuse','Regulatory Non-compliance'];
const GW_SEVERITIES = ['Critical','High','Medium','Low'];
const GW_PHRASES = [
  '"sustainable by nature"','"net-zero aligned"','"carbon neutral operations"','"eco-friendly products"',
  '"green by 2030"','"science-based approach"','"minimal environmental impact"','"fully offset emissions"',
  '"climate positive"','"zero footprint commitment"','"responsible sourcing"','"low-carbon solutions"',
];

const GREENWASH_FLAGS = DOCUMENTS.map((doc, i) => ({
  company: doc.company,
  score: doc.greenwashScore,
  flags: [0, 1, 2].map(j => ({
    category: GW_CATEGORIES[Math.floor(sr(i * 43 + j) * 8)],
    severity: GW_SEVERITIES[Math.floor(sr(i * 47 + j) * 4)],
    phrase: GW_PHRASES[Math.floor(sr(i * 53 + j) * 12)],
    regulation: ESRS_STANDARDS[Math.floor(sr(i * 59 + j) * 16)],
    remediation: 'Provide quantified baseline data and third-party verified metrics for this claim.',
  })),
}));

const COMMITMENT_TYPES = ['Net Zero Target','Emission Reduction','Renewable Energy','Water Reduction','Biodiversity','Supplier Code','Board Diversity','Pay Gap Reporting','Science Based Target (SBTi)','TCFD Adoption','CDP Reporting'];
const COVERAGE_TYPES = ['Company','Group','Scope 1-3'];
const COMMITMENT_TEXTS = [
  'Net-zero GHG emissions across all operations by 2050',
  'Reduce Scope 1+2 emissions 50% by 2030 vs 2019',
  '100% renewable electricity in own operations by 2025',
  'Cut water intensity 30% by 2030 vs 2020 baseline',
  'No net deforestation in supply chain by 2025',
  'Mandatory ESG supplier assessment for all tier-1',
  '40% women in senior leadership roles by 2027',
  'Report gender pay gap annually under UK regulations',
  'SBTi-validated 1.5C-aligned targets for Scope 1-3',
  'Full TCFD disclosure in annual report from 2023',
  'Submit annual CDP questionnaire at A-list level',
];

const COMMITMENTS = Array.from({ length: 200 }, (_, i) => ({
  id: i + 1,
  company: COMPANIES[Math.floor(sr(i * 61) * 80)],
  text: COMMITMENT_TEXTS[Math.floor(sr(i * 67) * 11)],
  type: COMMITMENT_TYPES[Math.floor(sr(i * 71) * 11)],
  targetYear: 2025 + Math.floor(sr(i * 73) * 26),
  baselineYear: 2015 + Math.floor(sr(i * 79) * 10),
  quantified: sr(i * 83) > 0.35,
  verified: sr(i * 89) > 0.55,
  coverage: COVERAGE_TYPES[Math.floor(sr(i * 97) * 3)],
  confidence: Math.floor(sr(i * 101) * 39) + 60,
}));

const CLAIM_TYPES = ['Reduction','Target','Achievement','Certification'];
const VERIFICATION_SOURCES = ['Third-party audit','CDP','SBTi','UNFCCC','Unverified'];
const CLAIM_TEXTS = [
  'Reduced Scope 1 emissions by 37% since 2019',
  'Achieved carbon neutrality across all owned facilities',
  'Sourced 78% of electricity from renewables in 2024',
  'SBTi validated 1.5C-aligned near-term targets',
  'CDP A-list recognition for climate disclosure quality',
  'Reduced water intensity by 22% vs 2018 baseline',
  'Zero waste to landfill at 85% of manufacturing sites',
  'Gender pay gap narrowed to 8.2% in reporting year',
  'Supply chain emissions reduced 15% through supplier programme',
  'TCFD-aligned disclosure independently assured',
];

const CLAIMS = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  company: COMPANIES[Math.floor(sr(i * 103) * 80)],
  text: CLAIM_TEXTS[Math.floor(sr(i * 107) * 10)],
  type: CLAIM_TYPES[Math.floor(sr(i * 109) * 4)],
  verifiable: sr(i * 113) > 0.4,
  source: VERIFICATION_SOURCES[Math.floor(sr(i * 127) * 5)],
  consistencyScore: Math.floor(sr(i * 131) * 100),
  redFlags: sr(i * 137) > 0.6 ? ['No baseline stated','Scope unclear'] : sr(i * 137) > 0.3 ? ['Methodology missing'] : [],
}));

const FRAMEWORKS = ['CSRD','SFDR','ISSB','SEC','TCFD','GRI'];
const RISK_TYPES = ['Greenwashing','Non-compliance','Completeness Gap','Ambiguity'];
const PATTERN_TEXTS = [
  'carbon neutral (?!certified|verified|audited)','net.?zero (?!aligned to|validated by)','sustainable (?!development|finance)',
  'green (?!bond|taxonomy|finance)','eco.?friendly (?!certified|labeled)','climate positive (?!by|through)',
  'responsible (?!investment|sourcing)','science.?based (?!targets validated)','emissions (?!reduction target|data)',
  'aligned (?!to Paris|with 1.5)','offset (?!verified|certified|Gold Standard)','renewable (?!energy certificate)',
  'low.?carbon (?!roadmap|pathway)','transition (?!plan|risk|pathway)','material (?!ESG risk|topic identified)',
  'double materiality (?!assessment conducted)','taxonomy.?aligned (?!revenue|CapEx)','PAI (?!indicator|metric|table)',
  'TCFD (?!report|disclosure|aligned)','climate.?related (?!financial risk|disclosure)',
  'physical risk (?!assessment|scenario)','transition risk (?!scenario|assessment)',
  'stranded asset (?!analysis|risk)','scenario analysis (?!conducted|disclosed)',
  'stakeholder (?!engagement|materiality)','board (?!oversight|diversity|climate)',
  'supply chain (?!emissions|due diligence)','biodiversity (?!strategy|TNFD)',
  'water (?!stewardship|intensity)','social (?!impact|audit|KPIs)',
  'gender (?!pay gap|diversity)','human rights (?!due diligence)',
  'circular economy (?!strategy|targets)','waste (?!reduction target|landfill)',
  'SFDR Article (?!8|9|6)','ESRS (?!E1|E2|S1|G1)','GRI (?!Standard|Index)',
  'CDP (?!A-list|B-score)','SBTi (?!validated|committed)','ISSB (?!S1|S2|aligned)',
];

const PATTERNS = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  pattern: PATTERN_TEXTS[i],
  framework: FRAMEWORKS[Math.floor(sr(i * 139) * 6)],
  riskType: RISK_TYPES[Math.floor(sr(i * 149) * 4)],
  frequency: Math.floor(sr(i * 151) * 45),
  severity: GW_SEVERITIES[Math.floor(sr(i * 157) * 4)],
}));

const DATA_SOURCES = [
  {
    name: 'SEC EDGAR Full-Text Search',
    endpoint: 'https://efts.sec.gov/LATEST/search-index?q=climate',
    format: 'JSON', rateLimit: 'No limit stated', auth: 'None',
    useCase: 'Full-text NLP on all US public climate filings (10-K, 8-K, proxy)',
    sample: "fetch('https://efts.sec.gov/LATEST/search-index?q=climate+risk&dateRange=custom&startdt=2024-01-01')\n  .then(r => r.json())\n  .then(d => d.hits.hits.map(h => h._source.file_date))",
  },
  {
    name: 'EU ESRS Taxonomy (EFRAG)',
    endpoint: 'https://www.efrag.org/en/projects/esrs-standards',
    format: 'PDF/XML', rateLimit: 'Unrestricted', auth: 'None',
    useCase: 'Regulatory pattern library for ESRS disclosure completeness scoring',
    sample: "# Download ESRS E1 PDF, parse with pdfplumber\nimport pdfplumber\nwith pdfplumber.open('ESRS_E1.pdf') as pdf:\n    text = '\\n'.join(p.extract_text() for p in pdf.pages)",
  },
  {
    name: 'CDP Open Data Portal',
    endpoint: 'https://www.cdp.net/en/data',
    format: 'CSV/Excel', rateLimit: 'Manual download', auth: 'Free registration',
    useCase: 'CDP questionnaire responses for verified climate commitments and Scope data',
    sample: "import pandas as pd\ndf = pd.read_csv('CDP_2024_Climate_Change.csv')\nscope1 = df[df['Question_Number'] == 'C6.1'][['Account_Name','Response']]",
  },
  {
    name: 'GRI Standards Repository',
    endpoint: 'https://www.globalreporting.org/standards/',
    format: 'PDF/HTML', rateLimit: 'Unrestricted', auth: 'None',
    useCase: 'GRI Standard cross-mapping for sustainability report compliance checks',
    sample: "import requests, bs4\nr = requests.get('https://www.globalreporting.org/standards/gri-305-emissions-2016/')\nsoup = bs4.BeautifulSoup(r.text, 'html.parser')\ndisclosures = soup.find_all(class_='disclosure-title')",
  },
  {
    name: 'TCFD Knowledge Hub',
    endpoint: 'https://www.tcfdhub.org/',
    format: 'HTML/PDF', rateLimit: 'Unrestricted', auth: 'None',
    useCase: 'TCFD disclosure examples and good-practice benchmarking for NLP training data',
    sample: "# Scrape TCFD company reports index\nimport requests, bs4\nr = requests.get('https://www.tcfdhub.org/companies/')\nsoup = bs4.BeautifulSoup(r.text, 'html.parser')\nlinks = [a['href'] for a in soup.select('a.company-link')]",
  },
  {
    name: 'SBTi Target Dashboard',
    endpoint: 'https://sciencebasedtargets.org/companies-taking-action',
    format: 'CSV', rateLimit: 'Unrestricted', auth: 'None',
    useCase: 'Verified SBTi target status for commitment extraction cross-validation',
    sample: "import pandas as pd\ndf = pd.read_csv('https://sciencebasedtargets.org/resources/files/SBTi-Progress-Report.csv')\nvalidated = df[df['Target Classification'] == 'Near-term'][['Company Name','Target Year','Status']]",
  },
  {
    name: 'HuggingFace ClimateBERT',
    endpoint: 'https://huggingface.co/climatebert/distilroberta-base-climate-sentiment',
    format: 'JSON API', rateLimit: '30,000 chars/month free', auth: 'HF_TOKEN (free)',
    useCase: 'Zero-shot climate claim sentiment and greenwashing detection via NLP model',
    sample: "import requests\nAPI = 'https://api-inference.huggingface.co/models/climatebert/distilroberta-base-climate-sentiment'\nheaders = {'Authorization': 'Bearer HF_TOKEN'}\nr = requests.post(API, headers=headers, json={'inputs': 'We are carbon neutral.'})\nprint(r.json())",
  },
  {
    name: 'Climate Policy Radar',
    endpoint: 'https://app.climatepolicyradar.org/',
    format: 'JSON API', rateLimit: '100 req/day free', auth: 'API key (free)',
    useCase: 'Policy text NLP for regulatory gap analysis and jurisdiction mapping',
    sample: "import requests\nr = requests.get('https://api.climatepolicyradar.org/v1/searches',\n  params={'q': 'net zero', 'limit': 20},\n  headers={'Authorization': 'Bearer CPR_API_KEY'})\npolicies = r.json()['data']",
  },
  {
    name: 'UNFCCC NDC Registry',
    endpoint: 'https://unfccc.int/NDCREG',
    format: 'JSON/XML', rateLimit: 'Unrestricted', auth: 'None',
    useCase: 'Country-level NDC commitment extraction for sovereign disclosure benchmarking',
    sample: "import requests\nr = requests.get('https://unfccc.int/sites/default/files/NDC/NDCREG.json')\nndcs = r.json()\nfor country in ndcs:\n    print(country['Party'], country['Submission_Date'], country['NDC_Status'])",
  },
  {
    name: 'Our World in Data CO2',
    endpoint: 'https://github.com/owid/co2-data',
    format: 'CSV', rateLimit: 'Unrestricted', auth: 'None',
    useCase: 'Country emission baselines for corporate claim benchmarking and intensity normalisation',
    sample: "import pandas as pd\ndf = pd.read_csv('https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv')\nde = df[(df.country == 'Germany') & (df.year >= 2015)][['year','co2','co2_per_capita','share_global_co2']]",
  },
];

const COMPLIANCE_MATRIX = DOCUMENTS.slice(0, 40).map((doc, i) => {
  const row = { company: doc.company, sector: doc.sector };
  ESRS_STANDARDS.forEach((std, j) => {
    const v = sr(i * 163 + j * 7);
    row[std] = v > 0.65 ? 'compliant' : v > 0.35 ? 'partial' : v > 0.1 ? 'missing' : 'na';
  });
  return row;
});

const TABS = ['Document Library','BERT Extraction','Greenwashing AI','Compliance Map','Commitment Extractor','Regulatory Fingerprint','Claim Verification','Data Sources'];

const GW_COLOR = { Low: T.green, Medium: T.amber, High: T.orange, Critical: T.red };
const SEV_COLOR = { Critical: T.red, High: T.orange, Medium: T.amber, Low: T.green };

function Badge({ color, text }) {
  return (
    <span style={{ background: color + '1a', color, border: '1px solid ' + color + '40', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, fontFamily: T.fontMono, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  );
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Sel({ placeholder, value, onChange, opts }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ border: '1px solid ' + T.border, borderRadius: 6, padding: '5px 10px', fontSize: 12, color: T.textPri, background: T.card, cursor: 'pointer' }}>
      <option value="All">{placeholder}</option>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

const headerStyle = {
  position: 'sticky', top: 0, background: T.sub, zIndex: 1, padding: '8px 12px',
  fontSize: 11, color: T.textSec, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
  cursor: 'pointer', userSelect: 'none', borderBottom: '1px solid ' + T.border, whiteSpace: 'nowrap',
};
const cellStyle = { padding: '8px 12px', fontSize: 12, color: T.textPri, borderBottom: '1px solid ' + T.borderL, verticalAlign: 'middle' };

export default function NLPDisclosureParserPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDoc, setSelectedDoc] = useState(DOCUMENTS[0]);
  const [docTypeFilter, setDocTypeFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [gwRiskFilter, setGwRiskFilter] = useState('All');
  const [sortCol, setSortCol] = useState('id');
  const [sortAsc, setSortAsc] = useState(true);
  const [bertModel, setBertModel] = useState('FinBERT');
  const [bertTokens, setBertTokens] = useState('256');
  const [bertIndustry, setBertIndustry] = useState('All');
  const [selectedExtraction, setSelectedExtraction] = useState(EXTRACTIONS[0]);
  const [selectedPattern, setSelectedPattern] = useState(PATTERNS[0]);
  const [commitTypeFilter, setCommitTypeFilter] = useState('All');
  const [commitVerifiedFilter, setCommitVerifiedFilter] = useState('All');
  const [commitQuantFilter, setCommitQuantFilter] = useState('All');
  const [claimTypeFilter, setClaimTypeFilter] = useState('All');
  const [claimVerifFilter, setClaimVerifFilter] = useState('All');

  const filteredDocs = useMemo(() => {
    let d = DOCUMENTS;
    if (docTypeFilter !== 'All') d = d.filter(x => x.type === docTypeFilter);
    if (sectorFilter !== 'All') d = d.filter(x => x.sector === sectorFilter);
    if (yearFilter !== 'All') d = d.filter(x => x.year === Number(yearFilter));
    if (gwRiskFilter !== 'All') d = d.filter(x => x.greenwashRisk === gwRiskFilter);
    return [...d].sort((a, b) => {
      const va = a[sortCol], vb = b[sortCol];
      if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? va - vb : vb - va;
    });
  }, [docTypeFilter, sectorFilter, yearFilter, gwRiskFilter, sortCol, sortAsc]);

  const avgGwScore = filteredDocs.length ? Math.round(filteredDocs.reduce((a, b) => a + b.greenwashScore, 0) / filteredDocs.length) : 0;
  const highRiskCount = filteredDocs.filter(d => d.greenwashRisk === 'High' || d.greenwashRisk === 'Critical').length;
  const extractedPct = filteredDocs.length ? Math.round(filteredDocs.filter(d => d.extracted).length / filteredDocs.length * 100) : 0;

  const gwChartData = GW_RISKS.map(r => ({ name: r, count: DOCUMENTS.filter(d => d.greenwashRisk === r).length }));
  const scatterData = DOCUMENTS.map(d => ({ x: d.wordCount, y: d.greenwashScore, name: d.company }));
  const sectorGwData = SECTORS.map(s => {
    const docs = DOCUMENTS.filter(d => d.sector === s);
    return { sector: s, avg: docs.length ? Math.round(docs.reduce((a, b) => a + b.greenwashScore, 0) / docs.length) : 0 };
  });

  const complianceSummary = ESRS_STANDARDS.map(std => {
    const vals = COMPLIANCE_MATRIX.map(row => row[std]);
    const compliant = vals.filter(v => v === 'compliant').length;
    const partial = vals.filter(v => v === 'partial').length;
    const total = vals.filter(v => v !== 'na').length;
    return { std, rate: total ? Math.round((compliant + partial * 0.5) / total * 100) : 0, compliant, partial, missing: vals.filter(v => v === 'missing').length };
  });
  const leastCompliant = [...complianceSummary].sort((a, b) => a.rate - b.rate)[0] || { std: 'N/A', rate: 0 };
  const bestCompliant = [...complianceSummary].sort((a, b) => b.rate - a.rate)[0] || { std: 'N/A', rate: 0 };

  const complianceTrend = [2020, 2021, 2022, 2023, 2024, 2025, 2026].map((yr, i) => ({
    year: yr, rate: Math.floor(35 + sr(i * 211) * 30 + i * 4),
  }));

  const filteredCommitments = useMemo(() => {
    let c = COMMITMENTS;
    if (commitTypeFilter !== 'All') c = c.filter(x => x.type === commitTypeFilter);
    if (commitVerifiedFilter !== 'All') c = c.filter(x => String(x.verified) === commitVerifiedFilter);
    if (commitQuantFilter !== 'All') c = c.filter(x => String(x.quantified) === commitQuantFilter);
    return c;
  }, [commitTypeFilter, commitVerifiedFilter, commitQuantFilter]);

  const commitByType = COMMITMENT_TYPES.map(t => ({ type: t.slice(0, 18), count: COMMITMENTS.filter(c => c.type === t).length }));
  const quantPie = [
    { name: 'Quantified', value: COMMITMENTS.filter(c => c.quantified).length },
    { name: 'Vague', value: COMMITMENTS.filter(c => !c.quantified).length },
  ];
  const commitTimeline = Array.from({ length: 12 }, (_, i) => ({
    year: 2015 + i,
    count: COMMITMENTS.filter(c => c.targetYear === 2015 + i).length,
  }));

  const frameworkSeverityGrid = FRAMEWORKS.map(fw => {
    const row = { framework: fw };
    RISK_TYPES.forEach(rt => { row[rt] = PATTERNS.filter(p => p.framework === fw && p.riskType === rt).length; });
    return row;
  });

  const filteredClaims = useMemo(() => {
    let c = CLAIMS;
    if (claimTypeFilter !== 'All') c = c.filter(x => x.type === claimTypeFilter);
    if (claimVerifFilter !== 'All') c = c.filter(x => String(x.verifiable) === claimVerifFilter);
    return c;
  }, [claimTypeFilter, claimVerifFilter]);

  const verifiablePie = [
    { name: 'Verifiable', value: CLAIMS.filter(c => c.verifiable).length },
    { name: 'Unverifiable', value: CLAIMS.filter(c => !c.verifiable).length },
  ];
  const claimByType = CLAIM_TYPES.map(t => ({ type: t, count: CLAIMS.filter(c => c.type === t).length }));
  const verifTrend = [2020, 2021, 2022, 2023, 2024, 2025, 2026].map((yr, i) => ({
    year: yr, pct: Math.floor(30 + sr(i * 223) * 30 + i * 5),
  }));

  function SortHeader({ label, col }) {
    return (
      <th style={headerStyle} onClick={() => { setSortCol(col); setSortAsc(sortCol === col ? !sortAsc : true); }}>
        {label} {sortCol === col ? (sortAsc ? '\u2191' : '\u2193') : ''}
      </th>
    );
  }

  const avgExtrConf = EXTRACTIONS.length ? Math.round(EXTRACTIONS.reduce((a, b) => a + b.confidence, 0) / EXTRACTIONS.length) : 0;
  const coverageRate = EXTRACTIONS.length ? Math.round(EXTRACTIONS.filter(e => e.confidence >= 75).length / EXTRACTIONS.length * 100) : 0;

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.bg, minHeight: '100vh', color: T.textPri }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ background: T.navy, borderBottom: '3px solid ' + T.teal, padding: '18px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: T.teal + '22', border: '1px solid ' + T.teal + '44', borderRadius: 8, padding: '8px 14px', fontFamily: T.fontMono, fontSize: 12, color: T.teal, fontWeight: 700 }}>EP-BL2</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff' }}>NLP Disclosure &amp; Greenwashing Intelligence</h1>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
              AI-powered extraction · BERT/FinBERT · ESRS/ISSB/TCFD compliance · 80 documents · 200 commitments · 100 claims
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div style={{ background: T.card, borderBottom: '1px solid ' + T.border, display: 'flex', overflowX: 'auto', padding: '0 20px' }}>
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)} style={{
            background: 'none', border: 'none', padding: '13px 18px', fontSize: 13,
            fontWeight: activeTab === i ? 700 : 500,
            color: activeTab === i ? T.teal : T.textSec,
            borderBottom: activeTab === i ? '2px solid ' + T.teal : '2px solid transparent',
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
          }}>{tab}</button>
        ))}
      </div>

      <div style={{ padding: '24px 28px', maxWidth: 1440, margin: '0 auto' }}>

        {/* ══════════════════════════════════════════════════════
            TAB 0 — Document Library
        ══════════════════════════════════════════════════════ */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              <KpiCard label="Total Documents" value={filteredDocs.length} sub="in current filter" color={T.teal} />
              <KpiCard label="Avg Greenwash Score" value={avgGwScore} sub="0=clean · 100=critical" color={avgGwScore > 60 ? T.red : avgGwScore > 40 ? T.amber : T.green} />
              <KpiCard label="High / Critical Risk" value={highRiskCount} sub={filteredDocs.length ? Math.round(highRiskCount / filteredDocs.length * 100) + '% of filtered' : '0%'} color={T.orange} />
              <KpiCard label="Extraction Coverage" value={extractedPct + '%'} sub="docs with BERT extraction" color={T.indigo} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <Sel placeholder="All Types" value={docTypeFilter} onChange={setDocTypeFilter} opts={DOC_TYPES} />
              <Sel placeholder="All Sectors" value={sectorFilter} onChange={setSectorFilter} opts={SECTORS} />
              <Sel placeholder="All Years" value={yearFilter} onChange={setYearFilter} opts={['2022','2023','2024','2025','2026']} />
              <Sel placeholder="All GW Risk" value={gwRiskFilter} onChange={setGwRiskFilter} opts={GW_RISKS} />
              <span style={{ fontSize: 12, color: T.textSec, marginLeft: 8 }}>{filteredDocs.length} documents shown — click row to select for BERT analysis</span>
            </div>

            <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <SortHeader label="#" col="id" />
                      <SortHeader label="Company" col="company" />
                      <SortHeader label="Sector" col="sector" />
                      <SortHeader label="Year" col="year" />
                      <SortHeader label="Type" col="type" />
                      <SortHeader label="Pages" col="pages" />
                      <SortHeader label="Words" col="wordCount" />
                      <SortHeader label="Language" col="language" />
                      <th style={headerStyle}>Extracted</th>
                      <SortHeader label="GW Risk" col="greenwashRisk" />
                      <SortHeader label="GW Score" col="greenwashScore" />
                      <SortHeader label="Compliance%" col="compliancePct" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map(doc => (
                      <tr key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        style={{ cursor: 'pointer', background: selectedDoc && selectedDoc.id === doc.id ? T.teal + '0d' : 'transparent' }}
                        onMouseEnter={e => { if (!selectedDoc || selectedDoc.id !== doc.id) e.currentTarget.style.background = T.surfaceH; }}
                        onMouseLeave={e => { e.currentTarget.style.background = selectedDoc && selectedDoc.id === doc.id ? T.teal + '0d' : 'transparent'; }}
                      >
                        <td style={cellStyle}>{doc.id}</td>
                        <td style={{ ...cellStyle, fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.company}</td>
                        <td style={{ ...cellStyle, color: T.textSec }}>{doc.sector}</td>
                        <td style={{ ...cellStyle, fontFamily: T.fontMono }}>{doc.year}</td>
                        <td style={cellStyle}><Badge color={T.indigo} text={doc.type} /></td>
                        <td style={{ ...cellStyle, fontFamily: T.fontMono }}>{doc.pages}</td>
                        <td style={{ ...cellStyle, fontFamily: T.fontMono }}>{(doc.wordCount / 1000).toFixed(0)}k</td>
                        <td style={{ ...cellStyle, color: T.textSec }}>{doc.language}</td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>{doc.extracted ? <span style={{ color: T.green, fontWeight: 700 }}>✓</span> : <span style={{ color: T.textSec }}>—</span>}</td>
                        <td style={cellStyle}><Badge color={GW_COLOR[doc.greenwashRisk]} text={doc.greenwashRisk} /></td>
                        <td style={{ ...cellStyle, fontFamily: T.fontMono, color: doc.greenwashScore > 70 ? T.red : doc.greenwashScore > 45 ? T.amber : T.green, fontWeight: 700 }}>{doc.greenwashScore}</td>
                        <td style={cellStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ flex: 1, background: T.borderL, borderRadius: 4, height: 6 }}>
                              <div style={{ width: doc.compliancePct + '%', background: doc.compliancePct > 70 ? T.green : doc.compliancePct > 50 ? T.amber : T.red, height: 6, borderRadius: 4 }} />
                            </div>
                            <span style={{ fontFamily: T.fontMono, fontSize: 11 }}>{doc.compliancePct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedDoc && (
              <div style={{ marginTop: 14, background: T.card, border: '1px solid ' + T.teal + '44', borderRadius: 8, padding: 14, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: T.teal }}>{selectedDoc.company}</span>
                <span style={{ color: T.textSec, fontSize: 12 }}>{selectedDoc.type} · {selectedDoc.year} · {selectedDoc.pages} pages · {(selectedDoc.wordCount / 1000).toFixed(0)}k words</span>
                <Badge color={GW_COLOR[selectedDoc.greenwashRisk]} text={'GW: ' + selectedDoc.greenwashRisk} />
                <span style={{ fontSize: 12, color: T.textSec }}>Switch to "BERT Extraction" tab to analyse this document</span>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 1 — BERT Extraction Engine
        ══════════════════════════════════════════════════════ */}
        {activeTab === 1 && (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {/* Left: extraction list */}
            <div style={{ flex: 2, minWidth: 320 }}>
              <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: 20, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: T.navy, marginBottom: 8 }}>
                  {selectedDoc ? selectedDoc.company + ' — ' + selectedDoc.type + ' ' + selectedDoc.year : 'No document selected'}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {selectedDoc && <Badge color={T.indigo} text={selectedDoc.type} />}
                  {selectedDoc && <Badge color={T.teal} text={selectedDoc.pages + ' pages'} />}
                  {selectedDoc && <Badge color={GW_COLOR[selectedDoc.greenwashRisk]} text={'GW: ' + selectedDoc.greenwashRisk} />}
                  {selectedDoc && <Badge color={T.sage} text={selectedDoc.language} />}
                </div>
                <div style={{ fontSize: 12, color: T.textSec }}>12 ESRS/ISSB/TCFD data points extracted · Model: {bertModel} · max_tokens: {bertTokens} · Industry: {bertIndustry}</div>
              </div>

              {EXTRACTIONS.map(ex => (
                <div key={ex.id} onClick={() => setSelectedExtraction(ex)} style={{
                  background: selectedExtraction && selectedExtraction.id === ex.id ? T.teal + '0d' : T.card,
                  border: '1px solid ' + (selectedExtraction && selectedExtraction.id === ex.id ? T.teal : T.border),
                  borderRadius: 8, padding: 14, marginBottom: 10, cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1, fontSize: 12, color: T.textPri, fontStyle: 'italic', lineHeight: 1.5 }}>
                      &ldquo;{ex.excerpt.slice(0, 95)}...&rdquo;
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', minWidth: 110 }}>
                      <Badge color={T.indigo} text={ex.standard} />
                      <Badge color={ex.confidence >= 85 ? T.green : ex.confidence >= 70 ? T.amber : T.red} text={ex.confidence + '% conf'} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: T.textSec, minWidth: 90 }}>Completeness</span>
                    <div style={{ flex: 1, background: T.borderL, borderRadius: 4, height: 8 }}>
                      <div style={{ width: ex.completeness + '%', background: ex.completeness > 70 ? T.green : ex.completeness > 50 ? T.amber : T.red, height: 8, borderRadius: 4 }} />
                    </div>
                    <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec, minWidth: 36 }}>{ex.completeness}%</span>
                  </div>
                  {ex.gap !== 'None identified' && (
                    <div style={{ fontSize: 11, color: T.amber, background: T.amber + '12', borderRadius: 4, padding: '3px 8px', display: 'inline-block' }}>
                      Gap: {ex.gap}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right: model config + JSON output */}
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: 18, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>Model Configuration</div>

                <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 4 }}>Architecture</label>
                <select value={bertModel} onChange={e => setBertModel(e.target.value)} style={{ width: '100%', border: '1px solid ' + T.border, borderRadius: 6, padding: '7px 10px', marginBottom: 12, fontSize: 12, background: T.bg }}>
                  {['BERT-base','RoBERTa','FinBERT'].map(m => <option key={m}>{m}</option>)}
                </select>

                <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 4 }}>Max Tokens</label>
                <select value={bertTokens} onChange={e => setBertTokens(e.target.value)} style={{ width: '100%', border: '1px solid ' + T.border, borderRadius: 6, padding: '7px 10px', marginBottom: 12, fontSize: 12, background: T.bg }}>
                  {['128','256','512'].map(t => <option key={t}>{t}</option>)}
                </select>

                <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 4 }}>Industry Calibration</label>
                <select value={bertIndustry} onChange={e => setBertIndustry(e.target.value)} style={{ width: '100%', border: '1px solid ' + T.border, borderRadius: 6, padding: '7px 10px', marginBottom: 16, fontSize: 12, background: T.bg }}>
                  {['All','Energy','Finance','Manufacturing'].map(t => <option key={t}>{t}</option>)}
                </select>

                <div style={{ borderTop: '1px solid ' + T.borderL, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['Avg Confidence', avgExtrConf + '%', T.teal],
                    ['Coverage Rate', coverageRate + '%', T.green],
                    ['Auto-filled', EXTRACTIONS.filter(e => e.completeness >= 70).length + ' / ' + EXTRACTIONS.length, T.indigo],
                    ['Needs Review', EXTRACTIONS.filter(e => e.completeness < 70).length + ' items', T.amber],
                  ].map(([label, val, col]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: T.textSec }}>{label}</span>
                      <span style={{ fontFamily: T.fontMono, fontWeight: 700, color: col }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedExtraction && (
                <div style={{ background: '#0d1117', border: '1px solid ' + T.teal + '44', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.teal, marginBottom: 10 }}>// MODEL OUTPUT JSON</div>
                  <pre style={{ margin: 0, fontFamily: T.fontMono, fontSize: 10, color: '#94d2bd', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
{JSON.stringify({
  extraction_id: selectedExtraction.id,
  model: bertModel,
  industry: bertIndustry,
  max_tokens: Number(bertTokens),
  standard_mapped: selectedExtraction.standard,
  confidence: (selectedExtraction.confidence / 100).toFixed(2),
  completeness: (selectedExtraction.completeness / 100).toFixed(2),
  excerpt: selectedExtraction.excerpt.slice(0, 55) + '...',
  identified_gap: selectedExtraction.gap,
  timestamp: '2026-04-16T09:00:00Z',
}, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 2 — Greenwashing Detection AI
        ══════════════════════════════════════════════════════ */}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              <KpiCard label="Companies Analysed" value={80} sub="full corpus" color={T.teal} />
              <KpiCard label="Corpus Avg Score" value={Math.round(DOCUMENTS.reduce((a, b) => a + b.greenwashScore, 0) / DOCUMENTS.length)} sub="0=clean · 100=critical" color={T.amber} />
              <KpiCard label="Critical Risk" value={DOCUMENTS.filter(d => d.greenwashRisk === 'Critical').length} sub="companies flagged" color={T.red} />
              <KpiCard label="Clean (Low Risk)" value={DOCUMENTS.filter(d => d.greenwashRisk === 'Low').length} sub="companies" color={T.green} />
            </div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 300, background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>Companies by Greenwash Risk Tier</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={gwChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4,4,0,0]}>
                      {gwChartData.map((entry, i) => <Cell key={i} fill={GW_COLOR[entry.name]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ flex: 1, minWidth: 300, background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>Document Size vs Greenwash Score</div>
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="x" name="Words" tickFormatter={v => (v / 1000).toFixed(0) + 'k'} tick={{ fontSize: 10 }} label={{ value: 'Word Count', position: 'insideBottom', fontSize: 10, dy: 10 }} />
                    <YAxis dataKey="y" name="GW Score" tick={{ fontSize: 10 }} label={{ value: 'GW Score', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip content={({ payload }) => payload && payload.length ? (
                      <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 6, padding: '6px 10px', fontSize: 11 }}>
                        {payload[0].payload.name}<br />Score: {payload[0].payload.y}
                      </div>
                    ) : null} />
                    <Scatter data={scatterData} fill={T.teal} opacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: 18, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>Sector Greenwash Heatmap — Average Score</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {sectorGwData.map(s => (
                  <div key={s.sector} style={{ flex: 1, minWidth: 90, background: T.sub, borderRadius: 8, padding: '12px 10px', textAlign: 'center', borderTop: '3px solid ' + (s.avg > 70 ? T.red : s.avg > 45 ? T.amber : T.green) }}>
                    <div style={{ fontSize: 10, color: T.textSec, marginBottom: 4, fontWeight: 600 }}>{s.sector}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: T.fontMono, color: s.avg > 70 ? T.red : s.avg > 45 ? T.amber : T.teal }}>{s.avg}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>Top 15 Companies by Greenwash Score — Detection Flags</div>
              <div style={{ overflowY: 'auto', maxHeight: 480 }}>
                {[...GREENWASH_FLAGS].sort((a, b) => b.score - a.score).slice(0, 15).map((gf, i) => (
                  <div key={i} style={{ borderBottom: '1px solid ' + T.borderL, padding: '12px 0', display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 160 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: T.navy }}>{gf.company}</div>
                      <div style={{ fontFamily: T.fontMono, fontSize: 13, color: gf.score > 70 ? T.red : gf.score > 45 ? T.amber : T.green, fontWeight: 700 }}>Score: {gf.score}</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {gf.flags.map((fl, j) => (
                        <div key={j} style={{ background: T.sub, border: '1px solid ' + SEV_COLOR[fl.severity] + '44', borderRadius: 8, padding: '8px 12px', minWidth: 190 }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 5 }}>
                            <Badge color={SEV_COLOR[fl.severity]} text={fl.severity} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: T.textPri }}>{fl.category}</span>
                          </div>
                          <div style={{ fontSize: 11, color: T.textSec, fontStyle: 'italic', marginBottom: 4 }}>{fl.phrase}</div>
                          <div style={{ fontSize: 10, color: T.indigo, marginBottom: 4 }}>{fl.regulation}</div>
                          <div style={{ fontSize: 10, color: T.green }}>Fix: {fl.remediation.slice(0, 60)}...</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 3 — Compliance Map
        ══════════════════════════════════════════════════════ */}
        {activeTab === 3 && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              <KpiCard label="Standards Tracked" value={ESRS_STANDARDS.length} sub="ESRS + IFRS + TCFD + SEC + SFDR" color={T.teal} />
              <KpiCard label="Avg Compliance" value={Math.round(complianceSummary.reduce((a, b) => a + b.rate, 0) / complianceSummary.length) + '%'} sub="corpus-weighted" color={T.green} />
              <KpiCard label="Least Compliant" value={leastCompliant.std.slice(0, 9)} sub={leastCompliant.rate + '% compliance rate'} color={T.red} />
              <KpiCard label="Best Compliance" value={bestCompliant.std.slice(0, 9)} sub={bestCompliant.rate + '% compliance rate'} color={T.sage} />
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
              <div style={{ flex: 2, minWidth: 320, background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>Compliance Rate by Standard</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={complianceSummary} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" domain={[0,100]} tick={{ fontSize: 10 }} tickFormatter={v => v + '%'} />
                    <YAxis dataKey="std" type="category" width={100} tick={{ fontSize: 9 }} />
                    <Tooltip formatter={v => v + '%'} />
                    <Bar dataKey="rate" radius={[0,4,4,0]}>
                      {complianceSummary.map((entry, i) => (
                        <Cell key={i} fill={entry.rate > 70 ? T.green : entry.rate > 50 ? T.amber : T.red} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ flex: 1, minWidth: 260, background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>Compliance Trend 2020–2026</div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={complianceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0,100]} tick={{ fontSize: 10 }} tickFormatter={v => v + '%'} />
                    <Tooltip formatter={v => v + '%'} />
                    <Line type="monotone" dataKey="rate" stroke={T.teal} strokeWidth={2} dot={{ r: 4, fill: T.teal }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>Compliance Matrix — 40 Companies x 16 Standards</div>
              <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', minWidth: 1000 }}>
                  <thead>
                    <tr>
                      <th style={{ ...headerStyle, minWidth: 140, textAlign: 'left' }}>Company</th>
                      {ESRS_STANDARDS.map(std => (
                        <th key={std} style={{ ...headerStyle, minWidth: 72, textAlign: 'center' }}>{std.slice(0, 8)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPLIANCE_MATRIX.map((row, i) => (
                      <tr key={i}>
                        <td style={{ ...cellStyle, fontWeight: 600, fontSize: 11, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.company}</td>
                        {ESRS_STANDARDS.map(std => {
                          const v = row[std];
                          const icon = v === 'compliant' ? '\u2713' : v === 'partial' ? '\u007e' : v === 'missing' ? '\u2717' : 'N/A';
                          const col = v === 'compliant' ? T.green : v === 'partial' ? T.amber : v === 'missing' ? T.red : T.textSec;
                          return (
                            <td key={std} style={{ ...cellStyle, textAlign: 'center', fontWeight: 700, color: col, fontSize: 14, background: v === 'compliant' ? T.green + '08' : v === 'missing' ? T.red + '08' : 'transparent' }}>
                              {icon}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 20, fontSize: 11, color: T.textSec, flexWrap: 'wrap' }}>
                {[['✓ Compliant', T.green], ['~ Partial', T.amber], ['✗ Missing', T.red], ['N/A — Not applicable', T.textSec]].map(([label, col]) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ color: col, fontWeight: 700, fontFamily: T.fontMono }}>{label.split(' ')[0]}</span>
                    <span>{label.split(' ').slice(1).join(' ')}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 4 — Commitment Extractor
        ══════════════════════════════════════════════════════ */}
        {activeTab === 4 && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              <KpiCard label="Total Commitments" value={filteredCommitments.length} sub="in current filter" color={T.teal} />
              <KpiCard label="Quantified" value={filteredCommitments.filter(c => c.quantified).length} sub={filteredCommitments.length ? Math.round(filteredCommitments.filter(c => c.quantified).length / filteredCommitments.length * 100) + '% of filtered' : '0%'} color={T.green} />
              <KpiCard label="Third-party Verified" value={filteredCommitments.filter(c => c.verified).length} sub="independently assured" color={T.indigo} />
              <KpiCard label="Avg NLP Confidence" value={filteredCommitments.length ? Math.round(filteredCommitments.reduce((a, b) => a + b.confidence, 0) / filteredCommitments.length) + '%' : '0%'} sub="extraction confidence" color={T.amber} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <Sel placeholder="All Types" value={commitTypeFilter} onChange={setCommitTypeFilter} opts={COMMITMENT_TYPES} />
              <Sel placeholder="All Verified" value={commitVerifiedFilter} onChange={setCommitVerifiedFilter} opts={['true','false']} />
              <Sel placeholder="All Quantified" value={commitQuantFilter} onChange={setCommitQuantFilter} opts={['true','false']} />
            </div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 300, background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>Commitments by Type</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={commitByType} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="type" type="category" width={145} tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={T.teal} radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ flex: 1, minWidth: 200, background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>Quantified vs Vague</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={quantPie} cx="50%" cy="50%" outerRadius={65} dataKey="value"
                      label={({ name, percent }) => name.slice(0,5) + ' ' + (percent * 100).toFixed(0) + '%'}
                      labelLine={false} fontSize={10}>
                      {quantPie.map((_, i) => <Cell key={i} fill={[T.teal, T.amber][i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ flex: 1, minWidth: 220, background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>Commitment Target Year Distribution</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={commitTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="year" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={T.indigo} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ overflowY: 'auto', maxHeight: 400 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={headerStyle}>Company</th>
                      <th style={headerStyle}>Commitment Text</th>
                      <th style={headerStyle}>Type</th>
                      <th style={headerStyle}>Target Yr</th>
                      <th style={headerStyle}>Base Yr</th>
                      <th style={headerStyle}>Quantified</th>
                      <th style={headerStyle}>Verified</th>
                      <th style={headerStyle}>Coverage</th>
                      <th style={headerStyle}>Conf%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCommitments.slice(0, 60).map(c => (
                      <tr key={c.id}>
                        <td style={{ ...cellStyle, fontWeight: 600, fontSize: 11, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.company}</td>
                        <td style={{ ...cellStyle, fontSize: 11, maxWidth: 210 }}>{c.text.slice(0, 52)}...</td>
                        <td style={cellStyle}><Badge color={T.teal} text={c.type.slice(0, 16)} /></td>
                        <td style={{ ...cellStyle, fontFamily: T.fontMono }}>{c.targetYear}</td>
                        <td style={{ ...cellStyle, fontFamily: T.fontMono }}>{c.baselineYear}</td>
                        <td style={cellStyle}>{c.quantified ? <Badge color={T.green} text="Yes" /> : <Badge color={T.amber} text="No" />}</td>
                        <td style={cellStyle}>{c.verified ? <Badge color={T.green} text="Verified" /> : <Badge color={T.red} text="Unverified" />}</td>
                        <td style={{ ...cellStyle, fontSize: 11 }}>{c.coverage}</td>
                        <td style={{ ...cellStyle, fontFamily: T.fontMono, color: c.confidence >= 80 ? T.green : T.amber }}>{c.confidence}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 5 — Regulatory Fingerprint
        ══════════════════════════════════════════════════════ */}
        {activeTab === 5 && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              <KpiCard label="Pattern Library" value={PATTERNS.length} sub="regulatory linguistic markers" color={T.teal} />
              <KpiCard label="Frameworks Covered" value={FRAMEWORKS.length} sub="CSRD SFDR ISSB SEC TCFD GRI" color={T.indigo} />
              <KpiCard label="Max Frequency" value={Math.max(...PATTERNS.map(p => p.frequency))} sub="docs containing top pattern" color={T.red} />
              <KpiCard label="Critical Patterns" value={PATTERNS.filter(p => p.severity === 'Critical').length} sub="require immediate action" color={T.orange} />
            </div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 340, background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>Pattern Frequency Across Corpus (Top 20)</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[...PATTERNS].sort((a, b) => b.frequency - a.frequency).slice(0, 20).map(p => ({ name: p.framework + ' · ' + p.riskType.slice(0, 8), freq: p.frequency, sev: p.severity }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={115} tick={{ fontSize: 8 }} />
                    <Tooltip />
                    <Bar dataKey="freq" radius={[0,4,4,0]}>
                      {[...PATTERNS].sort((a, b) => b.frequency - a.frequency).slice(0, 20).map((p, i) => (
                        <Cell key={i} fill={SEV_COLOR[p.severity]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ flex: 1, minWidth: 260, background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>Framework x Risk Type Grid</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr>
                      <th style={{ ...headerStyle, textAlign: 'left', fontSize: 10 }}>Framework</th>
                      {RISK_TYPES.map(rt => <th key={rt} style={{ ...headerStyle, fontSize: 8, textAlign: 'center' }}>{rt.slice(0, 7)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {frameworkSeverityGrid.map((row, i) => (
                      <tr key={i}>
                        <td style={{ ...cellStyle, fontWeight: 700, color: T.navy }}>{row.framework}</td>
                        {RISK_TYPES.map(rt => {
                          const v = row[rt];
                          return (
                            <td key={rt} style={{
                              ...cellStyle, textAlign: 'center', fontFamily: T.fontMono, fontWeight: 700,
                              color: v > 2 ? T.red : v > 1 ? T.amber : T.green,
                              background: v > 2 ? T.red + '10' : v > 1 ? T.amber + '10' : T.green + '08',
                            }}>{v}</td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 300, background: T.card, border: '1px solid ' + T.border, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid ' + T.border, fontWeight: 700, fontSize: 13, color: T.navy }}>Pattern Library ({PATTERNS.length} markers)</div>
                <div style={{ overflowY: 'auto', maxHeight: 420 }}>
                  {PATTERNS.map(p => (
                    <div key={p.id} onClick={() => setSelectedPattern(p)} style={{
                      padding: '10px 16px', borderBottom: '1px solid ' + T.borderL, cursor: 'pointer',
                      background: selectedPattern && selectedPattern.id === p.id ? T.teal + '0d' : 'transparent',
                    }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 5, flexWrap: 'wrap' }}>
                        <Badge color={T.indigo} text={p.framework} />
                        <Badge color={SEV_COLOR[p.severity]} text={p.severity} />
                        <span style={{ fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>freq: {p.frequency}</span>
                      </div>
                      <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.teal, wordBreak: 'break-all' }}>{p.pattern}</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPattern && (
                <div style={{ flex: 1, minWidth: 300, background: T.card, border: '1px solid ' + T.teal + '44', borderRadius: 10, padding: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Pattern Detection Detail</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                    <Badge color={T.indigo} text={selectedPattern.framework} />
                    <Badge color={T.orange} text={selectedPattern.riskType} />
                    <Badge color={SEV_COLOR[selectedPattern.severity]} text={selectedPattern.severity} />
                  </div>
                  <div style={{ background: T.sub, borderRadius: 6, padding: '8px 12px', fontFamily: T.fontMono, fontSize: 11, color: T.teal, marginBottom: 14, wordBreak: 'break-all' }}>
                    {selectedPattern.pattern}
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 6 }}>
                    Corpus frequency: <strong style={{ color: T.navy }}>{selectedPattern.frequency}</strong> documents
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>
                    Risk type: <strong style={{ color: T.orange }}>{selectedPattern.riskType}</strong>
                  </div>
                  <div style={{ borderTop: '1px solid ' + T.border, paddingTop: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: T.navy, marginBottom: 8 }}>Example detection — {COMPANIES[0]}</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>Section: Governance &amp; Strategy · Page 34</div>
                    <div style={{ background: T.amber + '12', border: '1px solid ' + T.amber + '44', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: T.textPri, fontStyle: 'italic', marginBottom: 12 }}>
                      &ldquo;...our <strong style={{ color: T.amber }}>sustainable</strong> operations across all business segments have demonstrated consistent improvement over the reporting period...&rdquo;
                    </div>
                    <div style={{ fontSize: 11, color: T.green, background: T.green + '10', borderRadius: 6, padding: '8px 12px' }}>
                      Suggested remediation: Replace vague descriptor with quantified statement referencing a verified metric, baseline year, and assurance provider.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 6 — Claim Verification Engine
        ══════════════════════════════════════════════════════ */}
        {activeTab === 6 && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              <KpiCard label="Claims Extracted" value={filteredClaims.length} sub="quantitative ESG claims" color={T.teal} />
              <KpiCard label="Verifiable" value={filteredClaims.filter(c => c.verifiable).length} sub="with external source" color={T.green} />
              <KpiCard label="Unverifiable" value={filteredClaims.filter(c => !c.verifiable).length} sub="no audit trail" color={T.red} />
              <KpiCard label="Red-flagged" value={filteredClaims.filter(c => c.redFlags.length > 0).length} sub="claims with concerns" color={T.amber} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <Sel placeholder="All Claim Types" value={claimTypeFilter} onChange={setClaimTypeFilter} opts={CLAIM_TYPES} />
              <Sel placeholder="All Verifiable" value={claimVerifFilter} onChange={setClaimVerifFilter} opts={['true','false']} />
            </div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>Verifiable vs Unverifiable</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={verifiablePie} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                      label={({ name, percent }) => name.slice(0, 5) + ' ' + (percent * 100).toFixed(0) + '%'}
                      labelLine={false} fontSize={11}>
                      {verifiablePie.map((_, i) => <Cell key={i} fill={[T.teal, T.red][i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ flex: 1, minWidth: 220, background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>Claims by Type</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={claimByType}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={T.indigo} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ flex: 1, minWidth: 220, background: T.card, border: '1px solid ' + T.border, borderRadius: 10, padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>Verification Coverage Trend 2020–2026</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={verifTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => v + '%'} />
                    <Tooltip formatter={v => v + '%'} />
                    <Line type="monotone" dataKey="pct" stroke={T.green} strokeWidth={2} dot={{ r: 3, fill: T.green }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ overflowY: 'auto', maxHeight: 420 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={headerStyle}>Company</th>
                      <th style={headerStyle}>Claim Text</th>
                      <th style={headerStyle}>Type</th>
                      <th style={headerStyle}>Verifiable</th>
                      <th style={headerStyle}>Source</th>
                      <th style={headerStyle}>Consistency</th>
                      <th style={headerStyle}>Red Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.slice(0, 60).map(c => (
                      <tr key={c.id}>
                        <td style={{ ...cellStyle, fontWeight: 600, fontSize: 11, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.company}</td>
                        <td style={{ ...cellStyle, fontSize: 11, maxWidth: 220 }}>{c.text.slice(0, 55)}...</td>
                        <td style={cellStyle}><Badge color={T.indigo} text={c.type} /></td>
                        <td style={cellStyle}>{c.verifiable ? <Badge color={T.green} text="Yes" /> : <Badge color={T.red} text="No" />}</td>
                        <td style={{ ...cellStyle, fontSize: 11 }}>{c.source}</td>
                        <td style={cellStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 60, background: T.borderL, borderRadius: 4, height: 6 }}>
                              <div style={{ width: c.consistencyScore + '%', background: c.consistencyScore > 70 ? T.green : T.amber, height: 6, borderRadius: 4 }} />
                            </div>
                            <span style={{ fontFamily: T.fontMono, fontSize: 10 }}>{c.consistencyScore}</span>
                          </div>
                        </td>
                        <td style={cellStyle}>
                          {c.redFlags.length > 0
                            ? <span style={{ fontSize: 10, color: T.red }}>{c.redFlags.join(', ')}</span>
                            : <span style={{ fontSize: 10, color: T.green }}>None</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 7 — Data Sources & API Guide
        ══════════════════════════════════════════════════════ */}
        {activeTab === 7 && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: T.navy, margin: '0 0 6px' }}>Free Data Sources for NLP Disclosure Analysis</h2>
              <p style={{ fontSize: 13, color: T.textSec, margin: 0 }}>
                10 best open-access endpoints for building disclosure parsers, greenwashing detectors, ESG compliance engines, and commitment trackers — no paid API keys required.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {DATA_SOURCES.map((ds, i) => (
                <div key={i} style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ padding: '16px 22px', borderBottom: '1px solid ' + T.borderL, display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ background: T.teal + '15', border: '1px solid ' + T.teal + '33', borderRadius: 8, padding: '8px 14px', fontFamily: T.fontMono, fontSize: 13, color: T.teal, fontWeight: 800, minWidth: 36, textAlign: 'center' }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: T.navy, marginBottom: 5 }}>{ds.name}</div>
                      <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.blue, marginBottom: 10, wordBreak: 'break-all' }}>{ds.endpoint}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Badge color={T.teal} text={ds.format} />
                        <Badge color={T.indigo} text={ds.rateLimit} />
                        <Badge color={ds.auth === 'None' ? T.green : T.amber} text={'Auth: ' + ds.auth} />
                      </div>
                    </div>
                    <div style={{ flex: 2, minWidth: 220 }}>
                      <div style={{ fontSize: 11, color: T.textSec, fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>NLP Use Case</div>
                      <div style={{ fontSize: 13, color: T.textPri, lineHeight: 1.5 }}>{ds.useCase}</div>
                    </div>
                  </div>
                  <div style={{ background: '#0d1117', padding: '14px 22px' }}>
                    <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.teal, marginBottom: 8, letterSpacing: 1 }}>// SAMPLE FETCH</div>
                    <pre style={{ margin: 0, fontFamily: T.fontMono, fontSize: 11, color: '#94d2bd', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{ds.sample}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
