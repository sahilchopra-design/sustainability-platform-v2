import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ScatterChart, Scatter, ComposedChart, Area, AreaChart,
} from 'recharts';

// ── Theme ───────────────────────────────────────────────────────────────────
const T = {
  bg: '#f6f4f0',
  surface: '#ffffff',
  surfaceH: '#f0ede7',
  border: '#e5e0d8',
  borderL: '#d5cfc5',
  navy: '#1b3a5c',
  navyL: '#2c5a8c',
  gold: '#c5a96a',
  goldL: '#d4be8a',
  sage: '#5a8a6a',
  sageL: '#7ba67d',
  teal: '#5a8a6a',
  text: '#1b3a5c',
  textSec: '#5c6b7e',
  textMut: '#9aa3ae',
  red: '#dc2626',
  green: '#16a34a',
  amber: '#d97706',
  font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace",
};

// ── PRNG ─────────────────────────────────────────────────────────────────────
const sr = (s) => {
  let x = Math.sin(s + 1) * 10000;
  return x - Math.floor(x);
};
const hashStr = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h);
};

// ── Static Data ───────────────────────────────────────────────────────────────
const SECTORS = [
  'Energy', 'Utilities', 'Materials', 'Financials', 'Industrials',
  'Consumer', 'Technology', 'Real Estate', 'Healthcare', 'Telecom',
];

const DOC_TYPES = [
  'CSRD Report', 'Sustainability Report', '10-K Filing',
  'Green Bond Framework', 'CDP Response',
];

const ISSUER_NAMES = [
  'Meridian Energy', 'Apex Utilities', 'Global Minerals', 'Nordic Bank',
  'Precision Industries', 'Harvest Consumer', 'DataCore Tech', 'Urban REIT',
  'MedLife Group', 'Spectrum Telecom', 'Atlantic Power', 'Volta Grid',
  'Terra Resources', 'Capital Partners', 'Aerospace GmbH', 'FoodCo PLC',
  'CloudSystems', 'CityProperty', 'BioHealth Ltd', 'NetConnect',
  'Pacific Wind', 'GreenGrid', 'Iron Mountain Mining', 'Sovereign AM',
  'MechWorks', 'NatGoods AG', 'Sigma Cloud', 'Harbor REIT',
  'PharmaCure', 'FiberLink',
];

const DOCUMENTS = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  issuer: ISSUER_NAMES[i],
  type: DOC_TYPES[i % 5],
  year: 2021 + Math.floor(sr(i * 7) * 4),
  sector: SECTORS[i % 10],
  word_count: 4000 + Math.floor(sr(i * 3) * 16000),
  pages: 20 + Math.floor(sr(i * 11) * 80),
  sentiment: parseFloat((sr(i * 13) * 1.4 - 0.4).toFixed(3)),
  quality: parseFloat((0.4 + sr(i * 17) * 0.55).toFixed(3)),
  gw_score: parseFloat((sr(i * 19) * 0.85).toFixed(3)),
  fk_grade: parseFloat((8 + sr(i * 23) * 8).toFixed(1)),
  fog: parseFloat((10 + sr(i * 29) * 10).toFixed(1)),
  sentence_len: parseFloat((15 + sr(i * 31) * 20).toFixed(1)),
  passive_pct: parseFloat((sr(i * 37) * 35).toFixed(1)),
  boilerplate_pct: parseFloat((sr(i * 41) * 40).toFixed(1)),
}));

const TOPICS = [
  { id: 1,  name: 'Climate Change Mitigation',   cat: 'Environment', esrs: 'E1', ifrs: 'S2', gri: 'GRI 305' },
  { id: 2,  name: 'Climate Adaptation',           cat: 'Environment', esrs: 'E1', ifrs: 'S2', gri: 'GRI 201' },
  { id: 3,  name: 'Water & Marine Resources',     cat: 'Environment', esrs: 'E3', ifrs: 'S2', gri: 'GRI 303' },
  { id: 4,  name: 'Biodiversity & Ecosystems',    cat: 'Environment', esrs: 'E4', ifrs: 'S2', gri: 'GRI 304' },
  { id: 5,  name: 'Circular Economy',             cat: 'Environment', esrs: 'E5', ifrs: '-',  gri: 'GRI 301' },
  { id: 6,  name: 'Energy Transition',            cat: 'Environment', esrs: 'E1', ifrs: 'S2', gri: 'GRI 302' },
  { id: 7,  name: 'Supply Chain Resilience',      cat: 'Social',      esrs: 'S2', ifrs: 'S2', gri: 'GRI 308' },
  { id: 8,  name: 'Labour & Human Rights',        cat: 'Social',      esrs: 'S1', ifrs: '-',  gri: 'GRI 408' },
  { id: 9,  name: 'Community Impact',             cat: 'Social',      esrs: 'S3', ifrs: '-',  gri: 'GRI 413' },
  { id: 10, name: 'Consumer & Product Safety',    cat: 'Social',      esrs: 'S4', ifrs: '-',  gri: 'GRI 416' },
  { id: 11, name: 'Board Diversity',              cat: 'Governance',  esrs: 'G1', ifrs: 'S1', gri: 'GRI 405' },
  { id: 12, name: 'Executive Remuneration',       cat: 'Governance',  esrs: 'G1', ifrs: 'S1', gri: 'GRI 2-19' },
  { id: 13, name: 'Anti-Corruption & Ethics',     cat: 'Governance',  esrs: 'G1', ifrs: '-',  gri: 'GRI 205' },
  { id: 14, name: 'Lobbying & Political Influence',cat:'Governance',  esrs: 'G1', ifrs: '-',  gri: 'GRI 415' },
  { id: 15, name: 'Taxonomy Alignment',           cat: 'Governance',  esrs: 'E1', ifrs: 'S2', gri: 'GRI 201' },
  { id: 16, name: 'Scope 3 Emissions',            cat: 'Environment', esrs: 'E1', ifrs: 'S2', gri: 'GRI 305' },
  { id: 17, name: 'Just Transition',              cat: 'Social',      esrs: 'S1', ifrs: '-',  gri: 'GRI 401' },
  { id: 18, name: 'Nature-Related Financial Risk',cat: 'Environment', esrs: 'E4', ifrs: 'S2', gri: 'GRI 304' },
  { id: 19, name: 'Digital & Cyber Risk',         cat: 'Governance',  esrs: 'G1', ifrs: 'S1', gri: 'GRI 418' },
  { id: 20, name: 'Stranded Asset Risk',          cat: 'Environment', esrs: 'E1', ifrs: 'S2', gri: 'GRI 201' },
];

const SENTIMENT_ASPECTS = [
  { id: 1, aspect: 'Emissions Reduction', pos: ['reducing','achieved','committed','target','net-zero'],   neg: ['increased','failed','delayed','missed','high-carbon'] },
  { id: 2, aspect: 'Renewable Energy',    pos: ['renewable','solar','wind','clean','green'],              neg: ['fossil','coal','gas','polluting','stranded'] },
  { id: 3, aspect: 'Water Management',   pos: ['efficiency','recycled','reduced','treated','conserved'], neg: ['scarcity','pollution','excessive','contaminated','depleted'] },
  { id: 4, aspect: 'Supply Chain',       pos: ['audited','certified','transparent','responsible','ethical'],neg:['violation','non-compliant','opaque','unaudited','risk'] },
  { id: 5, aspect: 'Governance Quality', pos: ['independent','diverse','accountable','transparent','robust'],neg:['concentrated','opaque','conflicted','weak','inadequate'] },
  { id: 6, aspect: 'Biodiversity',       pos: ['preserved','restored','monitored','protected','assessed'],neg:['deforestation','habitat loss','endangered','degraded','unmonitored'] },
  { id: 7, aspect: 'Social Impact',      pos: ['invested','improved','supported','engaged','empowered'],  neg: ['displaced','harmed','exploited','neglected','excluded'] },
  { id: 8, aspect: 'Disclosure Quality', pos: ['verified','audited','third-party','quantified','comparable'],neg:['vague','unverified','cherry-picked','selective','aspirational'] },
];

const GREENWASH_DIMS = [
  'Vague Language',
  'Missing Quantification',
  'Unverified Claims',
  'Cherry-Picked Metrics',
  'Future-Tense Without Targets',
];

const NER_TYPES = [
  'Companies', 'Locations', 'Regulators',
  'Standards Bodies', 'Quantities', 'Time References',
];

const QUALITY_DIMS = [
  { name: 'Completeness',          weight: 0.14 },
  { name: 'Verifiability',         weight: 0.13 },
  { name: 'Consistency',           weight: 0.12 },
  { name: 'Specificity',           weight: 0.12 },
  { name: 'Comparability',         weight: 0.10 },
  { name: 'Materiality Alignment', weight: 0.11 },
  { name: 'Forward Guidance',      weight: 0.09 },
  { name: 'Stakeholder Coverage',  weight: 0.08 },
  { name: 'Data Quality',          weight: 0.07 },
  { name: 'Assurance',             weight: 0.04 },
];

const TFIDF_TERMS = [
  'net-zero', 'Scope 1', 'Scope 2', 'Scope 3', 'TCFD', 'CSRD', 'ESRS', 'GHG intensity',
  'carbon price', 'taxonomy', 'SFDR', 'Article 8', 'Article 9', 'PAI', 'PCAF',
  'SBTi', 'biodiversity', 'water stress', 'just transition', 'stranded asset',
  'Pillar 3', 'NACE code', 'green bond', 'sustainability-linked', 'climate VaR',
  'physical risk', 'transition risk', 'TNFD', 'Nature SBT', 'ISSB S2',
  'CDP disclosure', 'WACI', 'EVIC', 'financed emissions', 'controversy',
  'deforestation', 'human rights', 'remuneration', 'board diversity', 'cyber risk',
];

const REGULATORY_REQS = {
  ESRS: [
    'E1-1 Transition Plan', 'E1-2 Policies', 'E1-3 Actions & Resources',
    'E1-4 Targets', 'E1-5 GHG Emissions', 'E1-6 GHG Removals',
    'E1-7 Energy', 'E2-1 Pollution Prevention', 'E3-1 Water Policies',
    'E4-1 Biodiversity Impact', 'S1-1 Labour Practices', 'S1-2 Working Conditions',
    'G1-1 Business Conduct', 'G1-2 Anti-Corruption', 'G1-3 Lobbying',
  ],
  ISSB: [
    'IFRS S1 Governance', 'IFRS S1 Strategy', 'IFRS S1 Risk Mgmt',
    'IFRS S1 Metrics & Targets', 'IFRS S2 Scope 1', 'IFRS S2 Scope 2',
    'IFRS S2 Scope 3', 'IFRS S2 Climate Risk', 'IFRS S2 Scenario Analysis',
    'IFRS S2 Transition Plan', 'IFRS S2 Cross-industry Metrics', 'IFRS S2 Industry Metrics',
    'IFRS S1 Materiality Process', 'IFRS S1 Forward-looking', 'IFRS S1 Comparative Info',
  ],
  GRI: [
    'GRI 2-22 Sustainability Strategy', 'GRI 201-1 Economic Value',
    'GRI 302-1 Energy Consumption', 'GRI 303-1 Water Withdrawal',
    'GRI 304-1 Biodiversity Sites', 'GRI 305-1 Scope 1', 'GRI 305-2 Scope 2',
    'GRI 305-3 Scope 3', 'GRI 308 Supplier Assessment', 'GRI 401-1 New Hires',
    'GRI 405-1 Diversity', 'GRI 406-1 Discrimination', 'GRI 413-1 Community',
    'GRI 415-1 Political Contributions', 'GRI 418-1 Customer Privacy',
  ],
  TNFD: [
    'LEAP A-Locate', 'LEAP A-Evaluate', 'LEAP A-Assess', 'LEAP A-Prepare',
    'Core Metric B1 Sensitive Sites', 'Core Metric B2 Land Use', 'Core Metric B3 Water',
    'Core Metric B4 Pollution', 'Core Metric B5 Species Impact',
    'Portfolio Metric P1 Exposure', 'Portfolio Metric P2 Dependencies',
    'Portfolio Metric P3 Impacts', 'Governance Pillar', 'Strategy Pillar',
    'Risk Management Pillar',
  ],
};

const CONTROVERSY_EVENTS = Array.from({ length: 20 }, (_, i) => {
  const types = [
    'Environmental Penalty', 'Greenwashing Allegation', 'Labour Violation',
    'Governance Failure', 'Regulatory Sanction', 'Data Breach',
    'Supply Chain Scandal', 'Taxonomy Misclassification', 'Emissions Misreporting', 'Board Conflict',
  ];
  const sevs = ['Critical', 'High', 'Medium', 'Low'];
  return {
    id: i + 1,
    issuer: ISSUER_NAMES[i % 30],
    type: types[i % 10],
    severity: sevs[Math.floor(sr(i * 7) * 4)],
    year: 2022 + Math.floor(sr(i * 11) * 3),
    nlp_detected: sr(i * 13) > 0.3,
    precision: parseFloat((0.55 + sr(i * 17) * 0.4).toFixed(2)),
    recall: parseFloat((0.50 + sr(i * 19) * 0.45).toFixed(2)),
  };
});

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtPct  = (v, d = 1) => (v * 100).toFixed(d) + '%';
const fmtNum  = (v) => v >= 1000 ? (v / 1000).toFixed(1) + 'K' : v.toString();
const sentColor = (s) => s > 0.2 ? T.green : s < -0.1 ? T.red : T.amber;
const gwColor   = (s) => s < 0.3 ? T.green : s < 0.6 ? T.amber : T.red;
const gwLabel   = (s) => s < 0.3 ? 'CLEAN' : s < 0.6 ? 'PARTIAL' : 'FLAGGED';
const sevColor  = (s) => s === 'Critical' ? T.red : s === 'High' ? T.amber : s === 'Medium' ? T.navyL : T.sage;

// ── Sub-Components ───────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '18px 20px', ...style }}>
    {children}
  </div>
);

const SectionTitle = ({ children, style = {} }) => (
  <div style={{
    fontSize: 13, fontWeight: 700, color: T.navy, textTransform: 'uppercase',
    letterSpacing: '0.06em', marginBottom: 12, fontFamily: T.font, ...style,
  }}>
    {children}
  </div>
);

const Pill = ({ label, color }) => (
  <span style={{
    display: 'inline-block', padding: '2px 10px', borderRadius: 20,
    background: color + '22', color, fontSize: 11, fontWeight: 700,
    fontFamily: T.mono, whiteSpace: 'nowrap',
  }}>
    {label}
  </span>
);

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: '14px 16px', minWidth: 130,
  }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.font, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const TH = ({ children, style = {} }) => (
  <th style={{
    padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: T.navy, background: T.surfaceH, borderBottom: `1px solid ${T.border}`,
    fontFamily: T.font, ...style,
  }}>
    {children}
  </th>
);

const TD = ({ children, style = {} }) => (
  <td style={{
    padding: '8px 12px', fontSize: 12, color: T.text,
    borderBottom: `1px solid ${T.border}`, fontFamily: T.font, ...style,
  }}>
    {children}
  </td>
);

const ScoreBar = ({ value, max = 1, color = T.navyL, width = 100 }) => (
  <div style={{ width, height: 6, borderRadius: 3, background: T.border }}>
    <div style={{
      width: `${Math.min(100, (value / (max || 1)) * 100)}%`,
      height: '100%', borderRadius: 3, background: color,
    }} />
  </div>
);

const CHART_TOOLTIP_STYLE = {
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11,
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function DmeNlpEnginePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [selDoc, setSelDoc] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [gwThresh, setGwThresh] = useState(0.5);
  const [simThresh, setSimThresh] = useState(0.7);

  const TABS = [
    'Overview', 'Materiality Topics', 'Sentiment Analysis', 'Greenwashing',
    'Named Entities', 'Disclosure Quality', 'TF-IDF / BM25', 'Semantic Similarity',
    'Temporal Trends', 'Regulatory Mapping', 'Controversy Detection',
    'Consistency Check', 'Readability', 'Model Governance',
  ];

  const filteredDocs = useMemo(
    () => sectorFilter === 'All' ? DOCUMENTS : DOCUMENTS.filter(d => d.sector === sectorFilter),
    [sectorFilter],
  );

  // topic salience matrix: doc × topic
  const topicMatrix = useMemo(
    () => DOCUMENTS.map((_, di) => TOPICS.map((_, ti) => parseFloat((0.1 + sr(di * 20 + ti) * 0.85).toFixed(3)))),
    [],
  );

  // TF-IDF: tf seeded per doc×term; df = count of docs where tf > 0.3
  const tfidfMatrix = useMemo(() => {
    const N = DOCUMENTS.length;
    const tf = DOCUMENTS.map((_, di) => TFIDF_TERMS.map((_, ti) => sr(di * 41 + ti)));
    const df = TFIDF_TERMS.map((_, ti) => Math.max(1, DOCUMENTS.filter((_, di) => tf[di][ti] > 0.3).length));
    return DOCUMENTS.map((_, di) =>
      TFIDF_TERMS.map((_, ti) =>
        parseFloat((tf[di][ti] * Math.log((N + 1) / (df[ti] + 1))).toFixed(4))
      )
    );
  }, []);

  // 50-dim embeddings via sr()
  const embeddings = useMemo(
    () => DOCUMENTS.map((_, di) => Array.from({ length: 50 }, (_, k) => sr(di * 51 + k) * 2 - 1)),
    [],
  );

  // cosine similarity matrix
  const simMatrix = useMemo(() => {
    const dot  = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
    const norm = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0)) || 1;
    return DOCUMENTS.map((_, i) =>
      DOCUMENTS.map((_, j) =>
        parseFloat((dot(embeddings[i], embeddings[j]) / (norm(embeddings[i]) * norm(embeddings[j]))).toFixed(3))
      )
    );
  }, [embeddings]);

  // cluster assignment (0–4)
  const clusters = useMemo(() => DOCUMENTS.map((_, i) => Math.floor(sr(i * 7) * 5)), []);

  // greenwash dim scores: doc × dim
  const gwMatrix = useMemo(
    () => DOCUMENTS.map((_, di) => GREENWASH_DIMS.map((_, gi) => parseFloat((sr(di * 6 + gi) * 0.9).toFixed(3)))),
    [],
  );

  // quality dim scores: doc × dim
  const qualMatrix = useMemo(
    () => DOCUMENTS.map((_, di) => QUALITY_DIMS.map((_, qi) => parseFloat((0.2 + sr(di * 11 + qi) * 0.78).toFixed(3)))),
    [],
  );

  // NER counts: doc × ner_type
  const nerMatrix = useMemo(
    () => DOCUMENTS.map((_, di) => NER_TYPES.map((_, ni) => 2 + Math.floor(sr(di * 7 + ni) * 18))),
    [],
  );

  // aspect sentiment: aspect × doc
  const aspectSentiment = useMemo(
    () => SENTIMENT_ASPECTS.map((_, ai) => DOCUMENTS.map((_, di) => parseFloat((sr(di * 9 + ai) * 1.4 - 0.4).toFixed(3)))),
    [],
  );

  // temporal: 24 quarters × 5 topics
  const TEMP_TOPICS = TOPICS.slice(0, 5);
  const temporalData = useMemo(
    () => Array.from({ length: 24 }, (_, q) => ({
      quarter: `Q${(q % 4) + 1}'${21 + Math.floor(q / 4)}`,
      ...Object.fromEntries(TEMP_TOPICS.map((t, ti) => [
        t.name.split(' ')[0],
        parseFloat((0.2 + sr(q * 6 + ti) * 0.7).toFixed(3)),
      ])),
    })),
    [],
  );

  // regulatory coverage: framework → array of req coverage scores
  const regCoverage = useMemo(
    () => Object.fromEntries(
      Object.entries(REGULATORY_REQS).map(([fw, reqs]) => [
        fw,
        reqs.map((_, ri) => parseFloat((0.3 + sr(hashStr(fw) + ri) * 0.65).toFixed(2))),
      ])
    ),
    [],
  );

  // topic velocity (current Q vs 4Q prior)
  const velocity = useMemo(
    () => TEMP_TOPICS.map((t, ti) => {
      const key = t.name.split(' ')[0];
      const cur  = temporalData[23][key];
      const prev = temporalData[19][key];
      return {
        name: t.name,
        vel: prev > 0 ? parseFloat(((cur - prev) / prev * 100).toFixed(1)) : 0,
        cur,
        prev,
      };
    }),
    [temporalData],
  );

  const doc = DOCUMENTS[selDoc];
  const CLUST_COLORS = [T.navy, T.gold, T.sage, T.red, T.amber];
  const TOPIC_COLORS6 = [T.navy, T.navyL, T.gold, T.sage, T.amber, T.red];

  // ── KPI strip ───────────────────────────────────────────────────────────────
  const docsParsed   = filteredDocs.length;
  const topicsExtracted = TOPICS.length * filteredDocs.length;
  const avgSentiment = filteredDocs.length > 0
    ? parseFloat((filteredDocs.reduce((s, d) => s + d.sentiment, 0) / filteredDocs.length).toFixed(3))
    : 0;
  const gwFlags    = filteredDocs.filter(d => d.gw_score >= gwThresh).length;
  const avgQuality = filteredDocs.length > 0
    ? parseFloat((filteredDocs.reduce((s, d) => s + d.quality, 0) / filteredDocs.length * 100).toFixed(1))
    : 0;
  const entCoverage = parseFloat((65 + sr(42) * 25).toFixed(1));
  const riskSignals = 3 + Math.floor(sr(99) * 12);

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab 0: Overview
  // ─────────────────────────────────────────────────────────────────────────────
  const renderOverview = () => {
    const topicAvg = TOPICS.map((t, ti) => ({
      name: t.name.length > 22 ? t.name.slice(0, 22) + '…' : t.name,
      salience: filteredDocs.length > 0
        ? parseFloat((filteredDocs.reduce((s, _, di_) => {
            const di = DOCUMENTS.indexOf(filteredDocs[di_]);
            return s + topicMatrix[di][ti];
          }, 0) / filteredDocs.length).toFixed(3))
        : 0,
    }));
    const sortedTopics = [...topicAvg].sort((a, b) => b.salience - a.salience);

    const sentBins   = [-0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const sentHist   = sentBins.slice(0, -1).map((lo, i) => ({
      range: `${lo}–${sentBins[i + 1]}`,
      count: filteredDocs.filter(d => d.sentiment >= lo && d.sentiment < sentBins[i + 1]).length,
    }));

    const flagged = [...filteredDocs].sort((a, b) => b.gw_score - a.gw_score).slice(0, 5);
    const nerTotals = NER_TYPES.map((n, ni) => ({
      name: n,
      total: filteredDocs.reduce((s, _, di_) => {
        const di = DOCUMENTS.indexOf(filteredDocs[di_]);
        return s + nerMatrix[di][ni];
      }, 0),
    }));

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Topic Salience Ranking (Top 20)</SectionTitle>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={sortedTopics} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 10, fill: T.textMut }} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10, fill: T.text }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="salience" fill={T.navyL} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <SectionTitle>Sentiment Distribution</SectionTitle>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={sentHist}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontSize: 9, fill: T.textMut }} />
                <YAxis tick={{ fontSize: 10, fill: T.textMut }} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="count" fill={T.sage} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <SectionTitle>Top Flagged Documents</SectionTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH>Issuer</TH><TH>Type</TH><TH>GW Score</TH><TH>Status</TH>
                </tr>
              </thead>
              <tbody>
                {flagged.map((d, i) => (
                  <tr key={i}>
                    <TD>{d.issuer.slice(0, 14)}</TD>
                    <TD style={{ color: T.textSec, fontSize: 11 }}>{d.type.slice(0, 14)}</TD>
                    <TD style={{ fontFamily: T.mono }}>{(d.gw_score * 100).toFixed(0)}%</TD>
                    <TD><Pill label={gwLabel(d.gw_score)} color={gwColor(d.gw_score)} /></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <Card style={{ gridColumn: '1/-1' }}>
          <SectionTitle>Entity Type Distribution (Corpus)</SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={nerTotals}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.text }} />
              <YAxis tick={{ fontSize: 10, fill: T.textMut }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="total" fill={T.gold} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab 1: Materiality Topics
  // ─────────────────────────────────────────────────────────────────────────────
  const renderMateriality = () => {
    const topicAvg = TOPICS.map((t, ti) => ({
      ...t,
      avg: parseFloat((DOCUMENTS.reduce((s, _, di) => s + topicMatrix[di][ti], 0) / DOCUMENTS.length).toFixed(3)),
    }));
    const traj = Array.from({ length: 8 }, (_, q) => ({
      q: `Q${(q % 4) + 1}'${24 + Math.floor(q / 4)}`,
      ...Object.fromEntries(TOPICS.slice(0, 6).map((t, ti) => [
        t.name.split(' ')[0],
        parseFloat((0.1 + sr(q * 8 + ti) * 0.85).toFixed(3)),
      ])),
    }));

    // Co-occurrence matrix (10×10): how often two topics appear together in same doc
    const TOPICS10 = TOPICS.slice(0, 10);
    const coocMatrix = TOPICS10.map((_, ai) =>
      TOPICS10.map((_, bi) => {
        if (ai === bi) return 1;
        return parseFloat((0.1 + sr(ai * 11 + bi) * 0.7).toFixed(2));
      })
    );
    const maxCooc = 1;

    // Per-doc topic summary table
    const docTopicSummary = DOCUMENTS.slice(0, 8).map((d, di) => ({
      issuer: d.issuer.slice(0, 12),
      topTopicIdx: topicMatrix[di].indexOf(Math.max(...topicMatrix[di])),
      topScore: parseFloat(Math.max(...topicMatrix[di]).toFixed(3)),
      cat: TOPICS[topicMatrix[di].indexOf(Math.max(...topicMatrix[di]))].cat,
    }));

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card style={{ gridColumn: '1/-1' }}>
          <SectionTitle>20 Materiality Topics — Avg Salience across Corpus</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[...topicAvg].sort((a, b) => b.avg - a.avg).map((t, i) => (
              <div key={i} style={{
                background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6,
                padding: '6px 12px', minWidth: 170,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>{t.name}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                  <ScoreBar value={t.avg} color={t.cat === 'Environment' ? T.sage : t.cat === 'Social' ? T.navyL : T.gold} width={80} />
                  <span style={{ fontSize: 11, fontFamily: T.mono, color: T.textSec }}>{(t.avg * 100).toFixed(0)}%</span>
                  <Pill label={t.cat} color={t.cat === 'Environment' ? T.sage : t.cat === 'Social' ? T.navyL : T.gold} />
                </div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 3 }}>{t.esrs} · {t.gri}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Topic Co-Occurrence Mini-Heatmap (10 × 10)</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 9, fontFamily: T.mono }}>
              <thead>
                <tr>
                  <th style={{ padding: '3px 4px', color: T.textMut, textAlign: 'left', minWidth: 80 }}>Topic</th>
                  {TOPICS10.map((t, i) => (
                    <th key={i} style={{ padding: '3px 4px', color: T.textMut, writingMode: 'vertical-rl', fontSize: 8 }}>
                      {t.name.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOPICS10.map((t, ai) => (
                  <tr key={ai}>
                    <td style={{ padding: '3px 4px', color: T.text, fontSize: 9, whiteSpace: 'nowrap' }}>
                      {t.name.slice(0, 14)}
                    </td>
                    {TOPICS10.map((_, bi) => {
                      const v = coocMatrix[ai][bi];
                      return (
                        <td key={bi} style={{
                          padding: '3px 4px', textAlign: 'center',
                          background: ai === bi ? T.surfaceH : `rgba(27,58,92,${(v * 0.6).toFixed(2)})`,
                          color: v > 0.6 ? '#fff' : T.text,
                          border: `1px solid ${T.border}`,
                          minWidth: 28,
                        }}>
                          {v.toFixed(1)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionTitle>Top Materiality Topic — Per Document (8 docs)</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><TH>Issuer</TH><TH>Top Topic</TH><TH>Score</TH><TH>Category</TH></tr>
            </thead>
            <tbody>
              {docTopicSummary.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <TD style={{ fontWeight: 600 }}>{r.issuer}</TD>
                  <TD style={{ fontSize: 11, color: T.textSec }}>{TOPICS[r.topTopicIdx].name.slice(0, 24)}</TD>
                  <TD style={{ fontFamily: T.mono, fontWeight: 700 }}>{(r.topScore * 100).toFixed(0)}%</TD>
                  <TD>
                    <Pill
                      label={r.cat}
                      color={r.cat === 'Environment' ? T.sage : r.cat === 'Social' ? T.navyL : T.gold}
                    />
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card style={{ gridColumn: '1/-1' }}>
          <SectionTitle>Topic Trajectory — 8 Quarters (top 6 topics)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={traj}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="q" tick={{ fontSize: 10, fill: T.textMut }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: T.textMut }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {TOPICS.slice(0, 6).map((t, ti) => (
                <Line key={ti} dataKey={t.name.split(' ')[0]} stroke={TOPIC_COLORS6[ti]} dot={false} strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab 2: Sentiment Analysis
  // ─────────────────────────────────────────────────────────────────────────────
  const renderSentiment = () => {
    const perDoc = filteredDocs.map(d => ({
      name: d.issuer.slice(0, 10),
      s: d.sentiment,
    }));
    const aspectAvg = SENTIMENT_ASPECTS.map((a, ai) => ({
      aspect: a.aspect,
      avg: parseFloat((DOCUMENTS.reduce((s, _, di) => s + aspectSentiment[ai][di], 0) / DOCUMENTS.length).toFixed(3)),
    }));
    const sectorSent = SECTORS.map(sec => {
      const docs = DOCUMENTS.filter(d => d.sector === sec);
      return {
        sector: sec.slice(0, 8),
        avg: docs.length > 0
          ? parseFloat((docs.reduce((s, d) => s + d.sentiment, 0) / docs.length).toFixed(3))
          : 0,
      };
    });

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card style={{ gridColumn: '1/-1' }}>
          <SectionTitle>Per-Document Sentiment Score</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={perDoc}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textMut }} />
              <YAxis domain={[-1, 1]} tick={{ fontSize: 10, fill: T.textMut }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="s" name="Sentiment" fill={T.navyL} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Aspect-Based Sentiment — 8 ESG Aspects</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={aspectAvg}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="aspect" tick={{ fontSize: 9, fill: T.text }} />
              <PolarRadiusAxis domain={[-1, 1]} tick={{ fontSize: 9 }} />
              <Radar name="Avg Sentiment" dataKey="avg" stroke={T.navyL} fill={T.navyL} fillOpacity={0.25} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Sector Sentiment Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sectorSent} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 9, fill: T.textMut }} />
              <YAxis type="category" dataKey="sector" width={80} tick={{ fontSize: 10, fill: T.text }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="avg" fill={T.sage} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ gridColumn: '1/-1' }}>
          <SectionTitle>Positive / Negative N-Gram Signals — {doc.issuer}</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 8 }}>Positive Signals</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><TH>N-Gram</TH><TH>Aspect</TH><TH>Frequency</TH></tr></thead>
                <tbody>
                  {SENTIMENT_ASPECTS.flatMap((a, ai) =>
                    a.pos.slice(0, 1).map(p => ({
                      ngram: p, aspect: a.aspect,
                      freq: 3 + Math.floor(sr(ai * 13 + p.length) * 12),
                    }))
                  ).sort((a, b) => b.freq - a.freq).map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <TD style={{ fontFamily: T.mono, color: T.green, fontWeight: 600 }}>{r.ngram}</TD>
                      <TD style={{ fontSize: 11, color: T.textSec }}>{r.aspect}</TD>
                      <TD style={{ fontFamily: T.mono }}>{r.freq}×</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.red, marginBottom: 8 }}>Negative Signals</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><TH>N-Gram</TH><TH>Aspect</TH><TH>Frequency</TH></tr></thead>
                <tbody>
                  {SENTIMENT_ASPECTS.flatMap((a, ai) =>
                    a.neg.slice(0, 1).map(n => ({
                      ngram: n, aspect: a.aspect,
                      freq: 1 + Math.floor(sr(ai * 17 + n.length) * 8),
                    }))
                  ).sort((a, b) => b.freq - a.freq).map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <TD style={{ fontFamily: T.mono, color: T.red, fontWeight: 600 }}>{r.ngram}</TD>
                      <TD style={{ fontSize: 11, color: T.textSec }}>{r.aspect}</TD>
                      <TD style={{ fontFamily: T.mono }}>{r.freq}×</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab 3: Greenwashing Detection
  // ─────────────────────────────────────────────────────────────────────────────
  const renderGreenwashing = () => {
    const docs30 = DOCUMENTS.map((d, di) => ({
      ...d,
      dims: GREENWASH_DIMS.map((_, gi) => gwMatrix[di][gi]),
      overall: parseFloat((gwMatrix[di].reduce((s, v) => s + v, 0) / GREENWASH_DIMS.length).toFixed(3)),
    }));
    const filtered = docs30.filter(d => d.overall >= gwThresh);
    const selDims  = docs30[selDoc].dims.map((v, gi) => ({ dim: GREENWASH_DIMS[gi].slice(0, 22), score: v }));
    const histBins = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    const hist = histBins.map((lo, i) => ({
      range: `${(lo * 100).toFixed(0)}–${((histBins[i + 1] || 1) * 100).toFixed(0)}%`,
      count: docs30.filter(d => d.overall >= lo && d.overall < (histBins[i + 1] || 1)).length,
    }));

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card style={{ gridColumn: '1/-1' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            <SectionTitle style={{ margin: 0 }}>Greenwashing Scan — 30 Disclosures</SectionTitle>
            <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 8 }}>
              Min GW Score:
              <strong style={{ fontFamily: T.mono, color: T.navy }}>{(gwThresh * 100).toFixed(0)}%</strong>
              <input
                type="range" min={0} max={0.9} step={0.05} value={gwThresh}
                onChange={e => setGwThresh(parseFloat(e.target.value))}
                style={{ width: 100 }}
              />
            </label>
            <span style={{ fontSize: 12, color: T.textMut }}>Showing {filtered.length} / 30</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr>
                  <TH>Issuer</TH>
                  <TH>Type</TH>
                  {GREENWASH_DIMS.map((d, i) => <TH key={i} style={{ fontSize: 10 }}>{d.slice(0, 12)}…</TH>)}
                  <TH>Overall</TH>
                  <TH>Status</TH>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 15).map((d, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <TD>
                      <button
                        onClick={() => setSelDoc(DOCUMENTS.findIndex(x => x.id === d.id))}
                        style={{ background: 'none', border: 'none', color: T.navyL, cursor: 'pointer', fontSize: 12, fontFamily: T.font, padding: 0 }}
                      >
                        {d.issuer.slice(0, 14)}
                      </button>
                    </TD>
                    <TD style={{ color: T.textSec, fontSize: 11 }}>{d.type.slice(0, 16)}</TD>
                    {d.dims.map((v, gi) => (
                      <TD key={gi} style={{ fontFamily: T.mono, fontSize: 11, background: `${gwColor(v)}18` }}>
                        {(v * 100).toFixed(0)}%
                      </TD>
                    ))}
                    <TD style={{ fontFamily: T.mono, fontWeight: 700 }}>{(d.overall * 100).toFixed(0)}%</TD>
                    <TD><Pill label={gwLabel(d.overall)} color={gwColor(d.overall)} /></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionTitle>GW Radar — {doc.issuer}</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={selDims}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: T.text }} />
              <PolarRadiusAxis domain={[0, 1]} tick={{ fontSize: 9 }} />
              <Radar name="GW Score" dataKey="score" stroke={T.red} fill={T.red} fillOpacity={0.2} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>GW Score Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hist}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="range" tick={{ fontSize: 9, fill: T.textMut }} />
              <YAxis tick={{ fontSize: 10, fill: T.textMut }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" fill={T.amber} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab 4: Named Entity Recognition
  // ─────────────────────────────────────────────────────────────────────────────
  const renderNER = () => {
    const docNer   = NER_TYPES.map((n, ni) => ({ type: n, count: nerMatrix[selDoc][ni] }));
    const totals   = NER_TYPES.map((n, ni) => ({ type: n, total: DOCUMENTS.reduce((s, _, di) => s + nerMatrix[di][ni], 0) }));
    const coocData = NER_TYPES.flatMap((a, ai) =>
      NER_TYPES.filter((_, bi) => bi > ai).map((b, bj) => ({
        a, b, n: Math.floor(sr(ai * 10 + bj) * 15) + 2,
      }))
    ).filter(r => r.n > 5).slice(0, 12);

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Entity Types — {doc.issuer}</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={docNer}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="type" tick={{ fontSize: 9, fill: T.textMut }} />
              <YAxis tick={{ fontSize: 10, fill: T.textMut }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" fill={T.navyL} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Corpus-Wide Entity Frequency</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={totals} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 9, fill: T.textMut }} />
              <YAxis type="category" dataKey="type" width={110} tick={{ fontSize: 10, fill: T.text }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="total" fill={T.gold} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ gridColumn: '1/-1' }}>
          <SectionTitle>Entity Co-Occurrence Links</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><TH>Entity A</TH><TH>Entity B</TH><TH>Co-occurrences</TH><TH>Strength</TH></tr>
            </thead>
            <tbody>
              {coocData.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <TD>{r.a}</TD>
                  <TD>{r.b}</TD>
                  <TD style={{ fontFamily: T.mono }}>{r.n}</TD>
                  <TD><ScoreBar value={r.n} max={20} color={T.navyL} width={100} /></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab 5: Disclosure Quality Scoring
  // ─────────────────────────────────────────────────────────────────────────────
  const renderQuality = () => {
    const docDims    = QUALITY_DIMS.map((d, qi) => ({ dim: d.name.slice(0, 18), score: qualMatrix[selDoc][qi], weight: d.weight }));
    const weighted   = parseFloat(docDims.reduce((s, d) => s + d.score * d.weight, 0).toFixed(3));
    const sectorBench = SECTORS.map(sec => {
      const docs = DOCUMENTS.filter(d => d.sector === sec);
      return { sector: sec.slice(0, 8), avg: docs.length > 0 ? parseFloat((docs.reduce((s, d) => s + d.quality, 0) / docs.length).toFixed(3)) : 0 };
    });

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Quality Score — {doc.issuer}</SectionTitle>
          <div style={{ fontSize: 30, fontWeight: 700, color: T.navy, fontFamily: T.mono, marginBottom: 12 }}>
            {(weighted * 100).toFixed(1)}
            <span style={{ fontSize: 14, color: T.textMut }}> / 100</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={docDims}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 9, fill: T.text }} />
              <PolarRadiusAxis domain={[0, 1]} tick={{ fontSize: 9 }} />
              <Radar name="Score" dataKey="score" stroke={T.navyL} fill={T.navyL} fillOpacity={0.25} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Sector Quality Benchmarks</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sectorBench} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 9, fill: T.textMut }} />
              <YAxis type="category" dataKey="sector" width={85} tick={{ fontSize: 10, fill: T.text }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="avg" fill={T.sage} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ gridColumn: '1/-1' }}>
          <SectionTitle>Quality Dimension Detail — {doc.issuer}</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><TH>Dimension</TH><TH>Weight</TH><TH>Score</TH><TH>Weighted Contribution</TH><TH>Bar</TH></tr>
            </thead>
            <tbody>
              {docDims.map((d, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <TD style={{ fontWeight: 600 }}>{d.dim}</TD>
                  <TD style={{ fontFamily: T.mono }}>{(d.weight * 100).toFixed(0)}%</TD>
                  <TD style={{ fontFamily: T.mono, fontWeight: 700, color: d.score > 0.7 ? T.green : d.score > 0.4 ? T.amber : T.red }}>
                    {(d.score * 100).toFixed(1)}
                  </TD>
                  <TD style={{ fontFamily: T.mono }}>{(d.score * d.weight * 100).toFixed(2)}</TD>
                  <TD><ScoreBar value={d.score} color={T.navyL} width={120} /></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab 6: TF-IDF / BM25
  // ─────────────────────────────────────────────────────────────────────────────
  const renderTFIDF = () => {
    const top10 = [...TFIDF_TERMS.map((t, ti) => ({ term: t, score: tfidfMatrix[selDoc][ti] }))]
      .sort((a, b) => b.score - a.score).slice(0, 10);
    const maxScore = Math.max(...tfidfMatrix.flatMap(r => r)) || 1;

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Top-10 TF-IDF Terms — {doc.issuer}</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={top10} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 9, fill: T.textMut }} />
              <YAxis type="category" dataKey="term" width={140} tick={{ fontSize: 10, fill: T.text }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="score" fill={T.navyL} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>BM25 Heatmap — 12 Terms × 8 Docs</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 10, fontFamily: T.mono }}>
              <thead>
                <tr>
                  <th style={{ padding: '4px 8px', color: T.textMut, textAlign: 'left' }}>Term</th>
                  {Array.from({ length: 8 }, (_, i) => (
                    <th key={i} style={{ padding: '4px 6px', color: T.textMut }}>{DOCUMENTS[i].issuer.slice(0, 4)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TFIDF_TERMS.slice(0, 12).map((t, ti) => (
                  <tr key={ti}>
                    <td style={{ padding: '3px 8px', color: T.text, whiteSpace: 'nowrap', fontSize: 10 }}>{t.slice(0, 18)}</td>
                    {Array.from({ length: 8 }, (_, di) => {
                      const v = tfidfMatrix[di][ti];
                      const intensity = v / maxScore;
                      return (
                        <td key={di} style={{
                          padding: '3px 6px',
                          background: `rgba(27,58,92,${(intensity * 0.75).toFixed(2)})`,
                          color: intensity > 0.5 ? '#fff' : T.text,
                          textAlign: 'center',
                          border: `1px solid ${T.border}`,
                        }}>
                          {v.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab 7: Semantic Similarity
  // ─────────────────────────────────────────────────────────────────────────────
  const renderSimilarity = () => {
    const sliceDocs = DOCUMENTS.slice(0, 12);
    const clusterGroups = Array.from({ length: 5 }, (_, ci) =>
      DOCUMENTS.filter((_, i) => clusters[i] === ci).map(d => d.issuer.slice(0, 10))
    );

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card style={{ gridColumn: '1/-1' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
            <SectionTitle style={{ margin: 0 }}>Cosine Similarity Heatmap (12 × 12)</SectionTitle>
            <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 8 }}>
              Cluster Threshold:
              <strong style={{ fontFamily: T.mono, color: T.navy }}>{simThresh}</strong>
              <input
                type="range" min={0.3} max={0.95} step={0.05} value={simThresh}
                onChange={e => setSimThresh(parseFloat(e.target.value))}
                style={{ width: 100 }}
              />
            </label>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 10, fontFamily: T.mono }}>
              <thead>
                <tr>
                  <th style={{ padding: '3px 6px' }} />
                  {sliceDocs.map((d, i) => (
                    <th key={i} style={{ padding: '3px 5px', color: T.textMut, fontSize: 9 }}>{d.issuer.slice(0, 5)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sliceDocs.map((_, i) => (
                  <tr key={i}>
                    <td style={{ padding: '3px 6px', color: T.text, fontSize: 9, whiteSpace: 'nowrap' }}>
                      {DOCUMENTS[i].issuer.slice(0, 8)}
                    </td>
                    {sliceDocs.map((_, j) => {
                      const v = simMatrix[i][j];
                      const highlight = v >= simThresh && i !== j;
                      return (
                        <td key={j} style={{
                          padding: '3px 5px',
                          background: i === j ? T.surfaceH : highlight ? `${T.navyL}55` : `rgba(27,58,92,${(v * 0.3).toFixed(2)})`,
                          color: T.text, textAlign: 'center', border: `1px solid ${T.border}`,
                        }}>
                          {v.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionTitle>5 Semantic Clusters</SectionTitle>
          {clusterGroups.map((members, ci) => (
            <div key={ci} style={{
              marginBottom: 10, padding: '8px 12px', background: T.surfaceH,
              borderRadius: 6, borderLeft: `3px solid ${CLUST_COLORS[ci]}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: CLUST_COLORS[ci], marginBottom: 4 }}>
                Cluster {ci + 1} — {members.length} documents
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {members.map((m, mi) => (
                  <span key={mi} style={{
                    fontSize: 10, background: CLUST_COLORS[ci] + '22',
                    color: CLUST_COLORS[ci], padding: '1px 6px', borderRadius: 10, fontFamily: T.mono,
                  }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>Dendrogram Summary</SectionTitle>
          {Array.from({ length: 5 }, (_, ci) => (
            <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: CLUST_COLORS[ci] }} />
              <span style={{ fontSize: 11, color: T.text, minWidth: 70 }}>Cluster {ci + 1}</span>
              <div style={{ flex: 1, height: 2, background: `${CLUST_COLORS[ci]}44`, borderRadius: 1 }} />
              <span style={{ fontSize: 11, fontFamily: T.mono, color: T.textSec }}>{clusterGroups[ci].length} members</span>
              <span style={{ fontSize: 11, fontFamily: T.mono, color: T.textMut }}>
                d̄={parseFloat((0.60 + sr(ci * 7) * 0.35).toFixed(2))}
              </span>
            </div>
          ))}
        </Card>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab 8: Temporal Trends
  // ─────────────────────────────────────────────────────────────────────────────
  const renderTemporal = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Card style={{ gridColumn: '1/-1' }}>
        <SectionTitle>Topic Salience Over 24 Quarters (5 key topics)</SectionTitle>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={temporalData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="quarter" tick={{ fontSize: 9, fill: T.textMut }} interval={3} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: T.textMut }} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {TEMP_TOPICS.map((t, ti) => (
              <Line key={ti} dataKey={t.name.split(' ')[0]} stroke={TOPIC_COLORS6[ti]} dot={false} strokeWidth={2} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionTitle>Topic Velocity (1-Year Change)</SectionTitle>
        {velocity.map((v, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0', borderBottom: `1px solid ${T.border}`,
          }}>
            <span style={{ fontSize: 12, color: T.text, flex: 1 }}>{v.name.slice(0, 28)}</span>
            <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: v.vel > 0 ? T.green : T.red, minWidth: 60, textAlign: 'right' }}>
              {v.vel > 0 ? '+' : ''}{v.vel}%
            </span>
            <span style={{ marginLeft: 8 }}>
              <Pill label={v.vel > 5 ? 'EMERGING' : v.vel < -5 ? 'DECLINING' : 'STABLE'} color={v.vel > 5 ? T.green : v.vel < -5 ? T.red : T.amber} />
            </span>
          </div>
        ))}
      </Card>

      <Card>
        <SectionTitle>Velocity Bar Chart</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={velocity}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textMut }} tickFormatter={v => v.split(' ')[0]} />
            <YAxis tick={{ fontSize: 10, fill: T.textMut }} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar dataKey="vel" name="Velocity %" fill={T.navyL} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab 9: Regulatory Mapping
  // ─────────────────────────────────────────────────────────────────────────────
  const renderRegulatory = () => {
    const frameworks = Object.keys(REGULATORY_REQS);
    const fwCoverage = frameworks.map(fw => ({
      fw,
      avg: parseFloat((regCoverage[fw].reduce((s, v) => s + v, 0) / Math.max(1, regCoverage[fw].length)).toFixed(3)),
    }));

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Framework Coverage Summary</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fwCoverage}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="fw" tick={{ fontSize: 11, fill: T.text }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: T.textMut }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="avg" fill={T.navyL} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Gap Analysis — {doc.issuer}</SectionTitle>
          <div style={{ overflowY: 'auto', maxHeight: 200 }}>
            {frameworks.map(fw => (
              <div key={fw} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{fw}</div>
                {REGULATORY_REQS[fw].filter((_, ri) => regCoverage[fw][ri] < 0.5).slice(0, 3).map((req, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                    <span style={{ color: T.textSec }}>{req.slice(0, 35)}</span>
                    <Pill label="GAP" color={T.red} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ gridColumn: '1/-1' }}>
          <SectionTitle>Requirement Coverage Detail</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><TH>Requirement</TH><TH>Framework</TH><TH>Coverage</TH><TH>Status</TH><TH>Bar</TH></tr>
              </thead>
              <tbody>
                {frameworks.flatMap(fw =>
                  REGULATORY_REQS[fw].slice(0, 4).map((req, ri) => ({ req, fw, cov: regCoverage[fw][ri] }))
                ).map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <TD style={{ fontSize: 11 }}>{r.req.slice(0, 42)}</TD>
                    <TD><Pill label={r.fw} color={T.navyL} /></TD>
                    <TD style={{ fontFamily: T.mono, fontWeight: 700, color: r.cov > 0.7 ? T.green : r.cov > 0.4 ? T.amber : T.red }}>
                      {(r.cov * 100).toFixed(0)}%
                    </TD>
                    <TD>
                      <Pill label={r.cov > 0.7 ? 'MET' : r.cov > 0.4 ? 'PARTIAL' : 'GAP'} color={r.cov > 0.7 ? T.green : r.cov > 0.4 ? T.amber : T.red} />
                    </TD>
                    <TD><ScoreBar value={r.cov} color={T.navyL} width={100} /></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab 10: Controversy Detection
  // ─────────────────────────────────────────────────────────────────────────────
  const renderControversy = () => {
    const sevOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    const sorted   = [...CONTROVERSY_EVENTS].sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
    const sevDist  = ['Critical', 'High', 'Medium', 'Low'].map(s => ({
      sev: s, count: CONTROVERSY_EVENTS.filter(e => e.severity === s).length,
    }));
    const avgPrec = CONTROVERSY_EVENTS.length > 0
      ? parseFloat((CONTROVERSY_EVENTS.reduce((s, e) => s + e.precision, 0) / CONTROVERSY_EVENTS.length).toFixed(3))
      : 0;
    const avgRec = CONTROVERSY_EVENTS.length > 0
      ? parseFloat((CONTROVERSY_EVENTS.reduce((s, e) => s + e.recall, 0) / CONTROVERSY_EVENTS.length).toFixed(3))
      : 0;
    const f1 = (avgPrec + avgRec) > 0
      ? parseFloat((2 * avgPrec * avgRec / (avgPrec + avgRec)).toFixed(3))
      : 0;

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>NLP Detection Performance</SectionTitle>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <KpiCard label="Precision" value={(avgPrec * 100).toFixed(1) + '%'} color={T.green} />
            <KpiCard label="Recall" value={(avgRec * 100).toFixed(1) + '%'} color={T.navyL} />
            <KpiCard label="F1 Score" value={(f1 * 100).toFixed(1) + '%'} color={T.gold} />
          </div>
          <SectionTitle>Severity Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={sevDist}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sev" tick={{ fontSize: 10, fill: T.text }} />
              <YAxis tick={{ fontSize: 10, fill: T.textMut }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" fill={T.red} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ gridColumn: '1/-1' }}>
          <SectionTitle>20 Controversy Events</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH>Issuer</TH><TH>Event Type</TH><TH>Year</TH><TH>Severity</TH>
                  <TH>NLP Detected</TH><TH>Precision</TH><TH>Recall</TH>
                </tr>
              </thead>
              <tbody>
                {sorted.map((e, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <TD>{e.issuer.slice(0, 16)}</TD>
                    <TD style={{ fontSize: 11 }}>{e.type}</TD>
                    <TD style={{ fontFamily: T.mono }}>{e.year}</TD>
                    <TD><Pill label={e.severity} color={sevColor(e.severity)} /></TD>
                    <TD><Pill label={e.nlp_detected ? 'YES' : 'NO'} color={e.nlp_detected ? T.green : T.red} /></TD>
                    <TD style={{ fontFamily: T.mono }}>{(e.precision * 100).toFixed(0)}%</TD>
                    <TD style={{ fontFamily: T.mono }}>{(e.recall * 100).toFixed(0)}%</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab 11: Cross-Document Consistency
  // ─────────────────────────────────────────────────────────────────────────────
  const renderConsistency = () => {
    const pairs = Array.from({ length: 10 }, (_, i) => ({
      docA: DOCUMENTS[i * 2].issuer,
      docB: DOCUMENTS[i * 2 + 1].issuer,
      topic: TOPICS[i % 20].name,
      scoreA: parseFloat((sr(i * 13) * 500 + 100).toFixed(0)),
      scoreB: parseFloat((sr(i * 17) * 500 + 100).toFixed(0)),
      delta: parseFloat((sr(i * 19) * 200 - 100).toFixed(0)),
      consistent: sr(i * 23) > 0.4,
    }));

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Consistency Score Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Consistent', value: pairs.filter(p => p.consistent).length },
                  { name: 'Inconsistent', value: pairs.filter(p => !p.consistent).length },
                ]}
                cx="50%" cy="50%" outerRadius={75} dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                <Cell fill={T.green} />
                <Cell fill={T.red} />
              </Pie>
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ gridColumn: '1/-1' }}>
          <SectionTitle>Flagged Contradictions</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <TH>Doc A</TH><TH>Doc B</TH><TH>Topic</TH><TH>Value A</TH><TH>Value B</TH><TH>Delta</TH><TH>Status</TH>
              </tr>
            </thead>
            <tbody>
              {pairs.map((p, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <TD style={{ fontSize: 11 }}>{p.docA.slice(0, 14)}</TD>
                  <TD style={{ fontSize: 11 }}>{p.docB.slice(0, 14)}</TD>
                  <TD style={{ fontSize: 11, color: T.textSec }}>{p.topic.slice(0, 22)}</TD>
                  <TD style={{ fontFamily: T.mono }}>{p.scoreA}</TD>
                  <TD style={{ fontFamily: T.mono }}>{p.scoreB}</TD>
                  <TD style={{ fontFamily: T.mono, color: Math.abs(p.delta) > 80 ? T.red : T.amber }}>
                    {p.delta > 0 ? '+' : ''}{p.delta}
                  </TD>
                  <TD><Pill label={p.consistent ? 'OK' : 'FLAG'} color={p.consistent ? T.green : T.red} /></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab 12: Readability & Complexity
  // ─────────────────────────────────────────────────────────────────────────────
  const renderReadability = () => {
    const chartData = DOCUMENTS.map(d => ({ name: d.issuer.slice(0, 8), fk: d.fk_grade, fog: d.fog, sl: d.sentence_len }));
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card style={{ gridColumn: '1/-1' }}>
          <SectionTitle>Flesch-Kincaid & Fog Index — All 30 Documents</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textMut }} />
              <YAxis tick={{ fontSize: 10, fill: T.textMut }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="fk" name="FK Grade" fill={T.navyL} radius={[3, 3, 0, 0]} />
              <Line dataKey="fog" name="Fog Index" stroke={T.red} dot={false} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Readability Metrics — {doc.issuer}</SectionTitle>
          {[
            ['FK Grade',         doc.fk_grade,          'Higher = harder to read'],
            ['Fog Index',        doc.fog,               'Gunning Fog readability score'],
            ['Avg Sentence Len', doc.sentence_len,      'words per sentence'],
            ['Passive Voice',    doc.passive_pct + '%', '% of sentences (passive)'],
            ['Boilerplate',      doc.boilerplate_pct + '%', '% of content (template text)'],
          ].map(([label, val, desc], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{label}</div>
                <div style={{ fontSize: 10, color: T.textMut }}>{desc}</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: T.mono, color: T.navy }}>{val}</div>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>FK Grade vs Passive Voice (Scatter)</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="fk" name="FK Grade" tick={{ fontSize: 9, fill: T.textMut }} label={{ value: 'FK Grade', position: 'insideBottom', offset: -4, fontSize: 10 }} />
              <YAxis dataKey="passive_pct" name="Passive %" tick={{ fontSize: 9, fill: T.textMut }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={CHART_TOOLTIP_STYLE} />
              <Scatter data={DOCUMENTS.map(d => ({ fk: d.fk_grade, passive_pct: d.passive_pct, name: d.issuer }))} fill={T.navyL} opacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab 13: Model Governance
  // ─────────────────────────────────────────────────────────────────────────────
  const renderGovernance = () => {
    const tasks = [
      { name: 'Materiality Classification', acc: 0.91, prec: 0.89, rec: 0.93, f1: 0.91, ver: 'v2.4.1', reviewed: 312 },
      { name: 'Sentiment Analysis',         acc: 0.87, prec: 0.85, rec: 0.88, f1: 0.86, ver: 'v1.9.3', reviewed: 280 },
      { name: 'Greenwashing Detection',     acc: 0.83, prec: 0.81, rec: 0.85, f1: 0.83, ver: 'v3.1.0', reviewed: 195 },
      { name: 'NER Extraction',             acc: 0.93, prec: 0.92, rec: 0.94, f1: 0.93, ver: 'v2.2.7', reviewed: 410 },
      { name: 'Quality Scoring',            acc: 0.88, prec: 0.86, rec: 0.89, f1: 0.87, ver: 'v1.5.2', reviewed: 223 },
    ];
    const queue = [
      { id: 1, doc: 'Meridian Energy CSRD',  task: 'Greenwashing', flag: 'Unverified net-zero claim',     priority: 'High' },
      { id: 2, doc: 'Nordic Bank Sust.',      task: 'NER',          flag: 'Regulator entity mismatch',    priority: 'Medium' },
      { id: 3, doc: 'Terra Resources 10-K',   task: 'Sentiment',    flag: 'Aspect score outlier (±3σ)',    priority: 'Low' },
    ];
    const versions = [
      { ver: 'v3.1.0', date: '2026-04-01', note: 'Greenwashing rules v3 — ESRS E1 alignment' },
      { ver: 'v2.4.1', date: '2026-03-15', note: 'Materiality model fine-tuned on 2,000 disclosures' },
      { ver: 'v2.2.7', date: '2026-02-20', note: 'NER: Standards Bodies + Time References types added' },
      { ver: 'v1.9.3', date: '2026-01-10', note: 'Sentiment aspect model retrained (8 aspects)' },
      { ver: 'v1.5.2', date: '2025-12-01', note: 'Quality scoring weights recalibrated (ESRS 2024)' },
    ];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card style={{ gridColumn: '1/-1' }}>
          <SectionTitle>NLP Task Performance Metrics</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <TH>Task</TH><TH>Accuracy</TH><TH>Precision</TH><TH>Recall</TH>
                <TH>F1</TH><TH>Version</TH><TH>Reviewed Samples</TH>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <TD style={{ fontWeight: 600 }}>{t.name}</TD>
                  {[t.acc, t.prec, t.rec, t.f1].map((v, j) => (
                    <TD key={j} style={{ fontFamily: T.mono, color: v > 0.9 ? T.green : v > 0.8 ? T.amber : T.red }}>
                      {(v * 100).toFixed(1)}%
                    </TD>
                  ))}
                  <TD style={{ fontFamily: T.mono, fontSize: 11 }}>{t.ver}</TD>
                  <TD style={{ fontFamily: T.mono }}>{t.reviewed}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <SectionTitle>Human-in-Loop Review Queue</SectionTitle>
          {queue.map((q, i) => (
            <div key={i} style={{
              padding: '10px 12px', marginBottom: 10, background: T.surfaceH, borderRadius: 6,
              borderLeft: `3px solid ${q.priority === 'High' ? T.red : q.priority === 'Medium' ? T.amber : T.sage}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>#{q.id} — {q.doc.slice(0, 22)}</span>
                <Pill label={q.priority} color={q.priority === 'High' ? T.red : q.priority === 'Medium' ? T.amber : T.sage} />
              </div>
              <div style={{ fontSize: 11, color: T.textSec }}>Task: {q.task}</div>
              <div style={{ fontSize: 11, color: T.textMut }}>Flag: {q.flag}</div>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>Model Version History</SectionTitle>
          {versions.map((v, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.navyL, minWidth: 55 }}>{v.ver}</span>
              <span style={{ fontSize: 11, color: T.textMut, minWidth: 82 }}>{v.date}</span>
              <span style={{ fontSize: 11, color: T.text }}>{v.note}</span>
            </div>
          ))}
        </Card>
      </div>
    );
  };

  const tabRenderers = [
    renderOverview, renderMateriality, renderSentiment, renderGreenwashing,
    renderNER, renderQuality, renderTFIDF, renderSimilarity,
    renderTemporal, renderRegulatory, renderControversy, renderConsistency,
    renderReadability, renderGovernance,
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text }}>

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 32px' }}>
        <div style={{ height: 3, background: `linear-gradient(90deg,${T.gold},${T.goldL},transparent)` }} />

        <div style={{ padding: '14px 0 0' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <button
              onClick={() => navigate(-1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMut, fontSize: 12, fontFamily: T.mono, padding: 0 }}
            >
              ← Back
            </button>
            <span style={{ color: T.textMut, fontSize: 12, fontFamily: T.mono }}>DME Risk Intelligence</span>
            <span style={{ color: T.textMut, fontSize: 12, fontFamily: T.mono }}>›</span>
            <span style={{ color: T.navy, fontSize: 12, fontFamily: T.mono, fontWeight: 700 }}>NLP Intelligence</span>
            <span style={{
              marginLeft: 8, background: T.navyL, color: '#fff', fontSize: 11,
              fontFamily: T.mono, padding: '2px 10px', borderRadius: 12, fontWeight: 700,
            }}>
              EP-U9
            </span>
          </div>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 14 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: T.navy, margin: '4px 0 4px', letterSpacing: '-0.02em' }}>
                DME NLP Intelligence Engine
              </h1>
              <div style={{ fontSize: 12, color: T.textSec }}>
                NLP-driven dynamic materiality assessment · ESG disclosure analytics · Greenwashing detection · Named entity recognition
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
                Sector:
                <select
                  value={sectorFilter}
                  onChange={e => setSectorFilter(e.target.value)}
                  style={{ fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', background: T.surface, color: T.navy, fontFamily: T.font }}
                >
                  <option>All</option>
                  {SECTORS.map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
                Document:
                <select
                  value={selDoc}
                  onChange={e => setSelDoc(parseInt(e.target.value))}
                  style={{ fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', background: T.surface, color: T.navy, fontFamily: T.font }}
                >
                  {DOCUMENTS.map((d, i) => <option key={i} value={i}>{d.issuer}</option>)}
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* KPI Strip */}
        <div style={{ display: 'flex', gap: 10, paddingBottom: 16, flexWrap: 'wrap' }}>
          <KpiCard label="Documents Parsed" value={docsParsed} sub={`${filteredDocs.reduce((s, d) => s + d.word_count, 0).toLocaleString()} words`} />
          <KpiCard label="Topics Extracted" value={fmtNum(topicsExtracted)} sub="20 topics × corpus" />
          <KpiCard label="Avg Sentiment" value={avgSentiment} color={sentColor(avgSentiment)} sub="Range −1 to +1" />
          <KpiCard label="Greenwash Flags" value={gwFlags} color={gwFlags > 5 ? T.red : T.amber} sub={`≥${(gwThresh * 100).toFixed(0)}% threshold`} />
          <KpiCard label="Avg Quality Score" value={avgQuality + '/100'} color={avgQuality > 70 ? T.green : T.amber} />
          <KpiCard label="Entity Coverage" value={entCoverage.toFixed(1) + '%'} sub="6 entity types" />
          <KpiCard label="Emerging Signals" value={riskSignals} color={T.red} sub="velocity > 5% / yr" />
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderTop: `1px solid ${T.border}` }}>
          {TABS.map((t, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              style={{
                padding: '10px 14px', background: 'none', border: 'none',
                borderBottom: `2px solid ${tab === i ? T.navyL : 'transparent'}`,
                color: tab === i ? T.navyL : T.textSec,
                fontSize: 12, fontWeight: tab === i ? 700 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: T.font, transition: 'all 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
        {tabRenderers[tab] && tabRenderers[tab]()}
      </div>

      {/* ── Status Bar ────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: T.navy, color: '#fff',
        padding: '4px 24px', display: 'flex', gap: 24,
        fontSize: 10, fontFamily: T.mono, zIndex: 100,
      }}>
        <span style={{ color: T.gold }}>EP-U9</span>
        <span>DME NLP Intelligence Engine</span>
        <span style={{ color: T.goldL }}>{doc.issuer} · {doc.type} · {doc.year}</span>
        <span>30 docs · 20 topics · 14 modules · {doc.word_count.toLocaleString()} words</span>
        <span style={{ marginLeft: 'auto', color: T.textMut }}>A² Platform · Sustainability Intelligence</span>
      </div>
      <div style={{ height: 28 }} />
    </div>
  );
}
