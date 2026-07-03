import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, PieChart, Pie, Cell, Legend } from 'recharts';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f4f6f9', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── Seed Data ────────────────────────────────────────────────────────────────
const SEED_BSKY = Array.from({ length: 25 }, (_, i) => ({
  uri: `at://did:plc:example/app.bsky.feed.post/${i}`,
  record: {
    text: ['$SHEL greenwashing scandal - new oil field approval contradicts net zero pledge 🚨', 'BlackRock voting AGAINST climate resolutions again this year. ESG washing confirmed.', 'Tesla labor practices under scrutiny - Berlin factory workers demand better conditions', 'HSBC financed emissions disclosure: $65B in fossil fuels last year. Net zero? Really?', 'Microsoft carbon negative by 2030 - actually seems credible with data backing it up', 'Shell: net zero by 2050 but new drilling licenses approved in 2025. Pick one. #greenwashing', 'BP reduces Scope 3 targets for second consecutive year under investor pressure', 'Unilever sustainability report: 80% sustainable sourcing achieved. One of the good ones.', 'Goldman Sachs ESG fund - 40% holdings in fossil fuel companies. Definition of irony.', 'Apple supply chain: independent audit confirms labor violations at 3 Taiwanese suppliers'][i % 10],
    createdAt: new Date(Date.now() - i * 3600000 * 6).toISOString(),
    langs: ['en']
  },
  author: { handle: `user${i}@bsky.social`, displayName: `ESG Analyst ${i}` },
  likeCount: Math.round(sr(i * 7) * 500),
  replyCount: Math.round(sr(i * 11) * 50),
  repostCount: Math.round(sr(i * 13) * 200),
  indexedAt: new Date(Date.now() - i * 3600000 * 6).toISOString()
}));

const SEED_ABSA_PAPERS = Array.from({ length: 15 }, (_, i) => ({
  id: `W${3000 + i}`,
  title: ['Aspect-Based Sentiment Analysis for ESG Disclosures', 'ABSA-ESG: Fine-grained sentiment for sustainability reports', 'Natural Language Inference for ESG Claim Verification', 'Hedge Detection in Corporate Sustainability Language', 'Boilerplate vs Novel Disclosure: An NLP Approach', 'Cross-lingual ABSA for Multi-market ESG Analysis', 'Sentence-level ESG Sentiment with Aspect Extraction', 'NLI for TCFD Claim Consistency Verification', 'Negation Handling in ESG Text Classification', 'Readability and ESG Disclosure Quality', 'Active Learning for ABSA Annotation in Finance', 'Zero-shot NLI for New ESG Regulatory Frameworks', 'Temporal Aspect Sentiment in Sustainability Commitments', 'Irony and Sarcasm in ESG Social Media', 'Contrastive Pairs for Greenwashing vs Genuine Disclosure'][i],
  publication_year: 2022 + Math.floor(sr(i * 7) * 3),
  cited_by_count: Math.round(5 + sr(i * 11) * 120),
  open_access: { is_oa: true, oa_url: 'https://arxiv.org/' }
}));

const COMPANIES_80 = ['Shell', 'BP', 'TotalEnergies', 'ExxonMobil', 'Chevron', 'Apple', 'Microsoft', 'Alphabet', 'Amazon', 'Meta', 'Unilever', 'Nestle', 'Danone', 'HSBC', 'Barclays', 'BlackRock', 'Goldman Sachs', 'JPMorgan', 'Deutsche Bank', 'BNP Paribas', 'Siemens', 'BMW', 'Volkswagen', 'Toyota', 'Tesla', 'Walmart', 'Target', 'Tesco', 'Carrefour', 'Aldi', 'Rio Tinto', 'BHP', 'Glencore', 'Anglo American', 'Vale', 'Novartis', 'AstraZeneca', 'Pfizer', 'Johnson & Johnson', 'Roche', 'Airbus', 'Boeing', 'Rolls-Royce', 'Honeywell', 'GE', 'Duke Energy', 'NextEra', 'Enel', 'Orsted', 'Iberdrola', 'AB InBev', 'Heineken', 'Diageo', 'Pernod Ricard', 'Remy Cointreau', 'Nike', 'Adidas', 'Puma', 'H&M', 'Inditex', 'BASF', 'Dow', 'LyondellBasell', 'Sabic', 'Covestro', 'Caterpillar', 'Deere', 'CNH Industrial', 'Komatsu', 'Volvo', 'Procter & Gamble', 'Colgate', 'Henkel', 'Reckitt', 'L\'Oreal', 'Sanofi', 'Eni', 'Equinor', 'Saudi Aramco', 'ConocoPhillips'];

const ESG_ASPECTS = {
  E: ['Carbon Emissions', 'Renewable Energy', 'Water Management', 'Biodiversity', 'Waste', 'Supply Chain Emissions', 'Energy Efficiency', 'Climate Targets'],
  S: ['Labor Practices', 'Human Rights', 'Community Relations', 'Employee Diversity', 'Health & Safety', 'Executive Pay', 'Supply Chain Labor', 'Gender Equality'],
  G: ['Board Independence', 'Audit Quality', 'Transparency', 'Anti-Corruption', 'Shareholder Rights', 'Executive Compensation', 'Tax Practices', 'Whistleblower Policy']
};
const ALL_ASPECTS = [...ESG_ASPECTS.E, ...ESG_ASPECTS.S, ...ESG_ASPECTS.G];

const SECTORS_10 = ['Energy', 'Financials', 'Technology', 'Consumer Staples', 'Healthcare', 'Industrials', 'Materials', 'Utilities', 'Real Estate', 'Communication'];

const HEDGE_PHRASES = [
  { phrase: 'aspire to', level: 1, label: 'Strong Hedge' },
  { phrase: 'are exploring', level: 1, label: 'Strong Hedge' },
  { phrase: 'subject to', level: 1, label: 'Strong Hedge' },
  { phrase: 'contingent on', level: 1, label: 'Strong Hedge' },
  { phrase: 'may consider', level: 1, label: 'Strong Hedge' },
  { phrase: 'hope to', level: 2, label: 'Hedge' },
  { phrase: 'working toward', level: 2, label: 'Hedge' },
  { phrase: 'expect to', level: 2, label: 'Hedge' },
  { phrase: 'look to', level: 2, label: 'Hedge' },
  { phrase: 'strive to', level: 2, label: 'Hedge' },
  { phrase: 'aim to', level: 3, label: 'Weak Positive' },
  { phrase: 'intend to', level: 3, label: 'Weak Positive' },
  { phrase: 'seek to', level: 3, label: 'Weak Positive' },
  { phrase: 'targeting', level: 3, label: 'Weak Positive' },
  { phrase: 'working to', level: 3, label: 'Weak Positive' },
  { phrase: 'committed to', level: 4, label: 'Moderate' },
  { phrase: 'plan to achieve', level: 4, label: 'Moderate' },
  { phrase: 'on track to', level: 4, label: 'Moderate' },
  { phrase: 'progressing toward', level: 4, label: 'Moderate' },
  { phrase: 'taking steps to', level: 4, label: 'Moderate' },
  { phrase: 'will achieve', level: 5, label: 'Strong' },
  { phrase: 'have achieved', level: 5, label: 'Strong' },
  { phrase: 'completed', level: 5, label: 'Strong' },
  { phrase: 'delivered', level: 5, label: 'Strong' },
  { phrase: 'confirmed', level: 5, label: 'Strong' },
];

const BOILERPLATE_CATS = [
  'Generic sustainability pledge',
  'Standard materiality claim',
  'GRI/TCFD adoption boilerplate',
  'Net zero pledge template',
  'Supply chain standard',
  'Board oversight template',
  'Third-party assurance claim',
  'UN SDG alignment',
  'Forward-looking disclaimer',
  'Water risk acknowledgment',
];

const LANGUAGES = [
  { lang: 'en', model: 'FinBERT (ProsusAI)', f1: 0.87, notes: 'Best for EN financial' },
  { lang: 'fr', model: 'CamemBERT-base', f1: 0.81, notes: 'Best for FR text' },
  { lang: 'de', model: 'BERT-base-german', f1: 0.79, notes: 'Common for CSRD' },
  { lang: 'es', model: 'BETO (dccuchile)', f1: 0.77, notes: 'LatAm companies' },
  { lang: 'zh', model: 'MacBERT-base', f1: 0.74, notes: 'For Chinese disclosures' },
  { lang: 'ja', model: 'BERT-base-japanese', f1: 0.76, notes: 'Tokyo Stock Exchange' },
  { lang: 'mul', model: 'mBERT (Google)', f1: 0.71, notes: 'Fallback for all' },
  { lang: 'mul2', model: 'XLM-RoBERTa', f1: 0.78, notes: 'Better than mBERT' },
];

// ── Helper Components ─────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', borderTop: `3px solid ${color || T.purple}` }}>
      <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: T.textPri }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function LiveBadge({ live, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: live ? '#dcfce7' : '#fef3c7', color: live ? T.green : T.amber, border: `1px solid ${live ? '#86efac' : '#fcd34d'}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontFamily: T.fontMono, fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: live ? T.green : T.amber, display: 'inline-block' }} />
      {live ? `LIVE — ${label}` : `SEEDED — ${label}`}
    </span>
  );
}

function ConceptBox({ title, children }) {
  return (
    <div style={{ background: '#f0f0ff', border: `1px solid ${T.indigo}`, borderLeft: `4px solid ${T.purple}`, borderRadius: 8, padding: '14px 18px', marginBottom: 20 }}>
      <div style={{ fontWeight: 700, color: T.purple, marginBottom: 6, fontSize: 13 }}>{title}</div>
      <div style={{ color: T.textPri, fontSize: 13, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontWeight: 700, fontSize: 15, color: T.navy, margin: '24px 0 12px', borderBottom: `1px solid ${T.border}`, paddingBottom: 6 }}>{children}</div>;
}

function postSentiment(text) {
  const t = text.toLowerCase();
  const posWords = ['achieved', 'successful', 'praised', 'milestone', 'credible', 'good', 'impressive', 'positive', 'strong'];
  const negWords = ['violation', 'greenwashing', 'scandal', 'criticized', 'irony', 'washing', 'contradicts', 'reduces', 'demand', 'scrutiny'];
  const pos = posWords.filter(w => t.includes(w)).length;
  const neg = negWords.filter(w => t.includes(w)).length;
  if (neg > pos) return { label: 'Negative', color: T.red, score: -(neg / (pos + neg + 0.01)) };
  if (pos > neg) return { label: 'Positive', color: T.green, score: pos / (pos + neg + 0.01) };
  return { label: 'Neutral', color: T.amber, score: 0 };
}

function postPillar(text) {
  const t = text.toLowerCase();
  if (['carbon', 'fossil', 'climate', 'renewable', 'emission', 'net zero', 'oil', 'energy'].some(w => t.includes(w))) return { label: 'E', color: T.green };
  if (['labor', 'worker', 'supply chain', 'human rights', 'diversity', 'community'].some(w => t.includes(w))) return { label: 'S', color: T.blue };
  return { label: 'G', color: T.purple };
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SocialAlternativeDataPage() {
  const [tab, setTab] = useState(0);

  // Bluesky API
  const [bskyPosts, setBskyPosts] = useState([]);
  const [bskyLive, setBskyLive] = useState(false);
  const [bskyLoading, setBskyLoading] = useState(false);
  const [bskyQuery, setBskyQuery] = useState('ESG sustainability greenwashing');
  const [bskyInput, setBskyInput] = useState('ESG sustainability greenwashing');

  // GDELT
  const [gdeltSocial, setGdeltSocial] = useState([]);
  const [gdeltLive, setGdeltLive] = useState(false);

  // OpenAlex
  const [absPapers, setAbsPapers] = useState([]);

  // ABSA filters
  const [absaAspectFilter, setAbsaAspectFilter] = useState('All');
  const [absaPillarFilter, setAbsaPillarFilter] = useState('All');
  const [absaSentFilter, setAbsaSentFilter] = useState('All');

  // Alt-data what-if
  const [altDataWeight, setAltDataWeight] = useState(20);

  useEffect(() => {
    let cancelled = false;
    setBskyLoading(true);
    fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(bskyQuery)}&limit=25`)
      .then(r => r.json())
      .then(d => {
        if (!cancelled) { setBskyPosts(d.posts || []); setBskyLive(true); setBskyLoading(false); }
      })
      .catch(() => { if (!cancelled) { setBskyPosts(SEED_BSKY); setBskyLive(false); setBskyLoading(false); } });
    return () => { cancelled = true; };
  }, [bskyQuery]);

  useEffect(() => {
    let cancelled = false;
    fetch('https://api.gdeltproject.org/api/v2/doc/doc?query=ESG+sustainability+greenwashing+climate&mode=ArtList&maxrecords=25&format=json&timespan=1week')
      .then(r => r.json())
      .then(d => { if (!cancelled) { setGdeltSocial(d.articles || []); setGdeltLive(true); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('https://api.openalex.org/works?search=aspect+based+sentiment+analysis+ESG+financial&filter=open_access.is_oa:true&per-page=15&sort=cited_by_count:desc&mailto=platform@aaimpact.ai')
      .then(r => r.json())
      .then(d => { if (!cancelled) setAbsPapers(d.results || []); })
      .catch(() => { if (!cancelled) setAbsPapers(SEED_ABSA_PAPERS); });
    return () => { cancelled = true; };
  }, []);

  const posts = bskyPosts.length > 0 ? bskyPosts : SEED_BSKY;

  // Derived analytics from posts
  const sentimentCounts = useMemo(() => {
    const counts = { Positive: 0, Neutral: 0, Negative: 0 };
    posts.forEach(p => {
      const text = p.record?.text || '';
      counts[postSentiment(text).label]++;
    });
    return counts;
  }, [posts]);

  const avgSentScore = useMemo(() => {
    if (!posts.length) return 0;
    const total = posts.reduce((acc, p) => acc + postSentiment(p.record?.text || '').score, 0);
    return (total / posts.length).toFixed(2);
  }, [posts]);

  const controversyCount = useMemo(() => posts.filter(p => {
    const t = (p.record?.text || '').toLowerCase();
    return ['scandal', 'greenwashing', 'violation', 'irony', 'contradicts'].some(w => t.includes(w));
  }).length, [posts]);

  // ABSA simulated data
  const absaData = useMemo(() => {
    const texts = [
      "Shell's renewable investments are impressive but their lobbying is shameful",
      "Microsoft's carbon negative pledge backed by credible data and real investment",
      "HSBC financed emissions far exceed their net zero commitments — contradiction",
      "Tesla worker safety records are concerning despite strong EV innovation",
      "Unilever board independence score is industry-leading",
      "BP audit quality questioned after emissions accounting inconsistencies",
      "Goldman ESG fund transparency is poor — holdings not fully disclosed",
      "Apple supply chain labor practices audit reveals violations at 3 suppliers",
      "NextEra renewable energy targets confirmed with third-party certification",
      "Volkswagen anti-corruption measures strengthened post-Dieselgate scandal",
    ];
    const results = [];
    let idx = 0;
    for (let ci = 0; ci < COMPANIES_80.length && results.length < 50; ci++) {
      const text = texts[ci % texts.length];
      const aspectIdx = Math.floor(sr(ci * 17) * ALL_ASPECTS.length);
      const aspect = ALL_ASPECTS[aspectIdx];
      const pillar = aspectIdx < 8 ? 'E' : aspectIdx < 16 ? 'S' : 'G';
      const sentRaw = sr(ci * 31);
      const sentiment = sentRaw > 0.6 ? 'Positive' : sentRaw > 0.35 ? 'Neutral' : 'Negative';
      const conf = 0.65 + sr(ci * 43) * 0.34;
      results.push({ id: idx++, company: COMPANIES_80[ci], text: text.slice(0, 80), aspect, pillar, sentiment, confidence: conf.toFixed(2) });
    }
    return results;
  }, []);

  const filteredAbsa = useMemo(() => absaData.filter(r => {
    if (absaAspectFilter !== 'All' && r.aspect !== absaAspectFilter) return false;
    if (absaPillarFilter !== 'All' && r.pillar !== absaPillarFilter) return false;
    if (absaSentFilter !== 'All' && r.sentiment !== absaSentFilter) return false;
    return true;
  }), [absaData, absaAspectFilter, absaPillarFilter, absaSentFilter]);

  // Aspect heatmap data
  const aspectHeatmap = useMemo(() => ALL_ASPECTS.map((asp, ai) => {
    const row = { aspect: asp };
    SECTORS_10.forEach((sec, si) => { row[sec] = +(sr(ai * 13 + si * 7) * 2 - 1).toFixed(2); });
    return row;
  }), []);

  // Aspect trend data (12 months)
  const aspectTrend = useMemo(() => Array.from({ length: 12 }, (_, m) => {
    const obj = { month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m] };
    ['Carbon Emissions', 'Renewable Energy', 'Labor Practices', 'Board Independence', 'Water Management', 'Transparency', 'Human Rights', 'Anti-Corruption'].forEach((asp, ai) => {
      obj[asp] = +(sr(m * 11 + ai * 7) * 2 - 1).toFixed(2);
    });
    return obj;
  }), []);

  // NLI claims
  const nliClaims = useMemo(() => Array.from({ length: 60 }, (_, i) => {
    const claims = [
      'We achieved carbon neutrality in 2023 across all operations',
      'Our Scope 3 emissions have been independently verified',
      'We are committed to achieving net zero by 2040',
      'Our supply chain meets ILO labor standards',
      'We have no material anti-corruption violations',
      'Our board is 60% independent directors',
      'Third-party assurance provided by Big Four firm',
      'We have reduced water consumption by 30% since 2018',
    ];
    const sources = ['CDP Report', 'Third-party Audit', 'SBTi Certification', 'UNFCCC', 'No evidence'];
    const nliRaw = sr(i * 17);
    const nliLabel = nliRaw > 0.55 ? 'Entailment' : nliRaw > 0.3 ? 'Neutral' : 'Contradiction';
    const src = sources[Math.floor(sr(i * 23) * sources.length)];
    const gwRisk = nliLabel === 'Contradiction' ? 'High' : nliLabel === 'Neutral' && src === 'No evidence' ? 'Medium' : 'Low';
    return {
      id: i,
      company: COMPANIES_80[i % COMPANIES_80.length],
      claim: claims[i % claims.length],
      hypothesis: 'The company has verified third-party certification for this claim',
      nli: nliLabel,
      confidence: (0.65 + sr(i * 37) * 0.34).toFixed(2),
      source: src,
      gwRisk,
    };
  }), []);

  // Hedge data for 80 companies
  const hedgeData = useMemo(() => COMPANIES_80.map((co, i) => ({
    company: co,
    sector: SECTORS_10[Math.floor(sr(i * 7) * SECTORS_10.length)],
    hedgeDensity: +(5 + sr(i * 13) * 45).toFixed(1),
    avgCertainty: +(1.5 + sr(i * 19) * 3.5).toFixed(2),
    mostHedgedTopic: ALL_ASPECTS[Math.floor(sr(i * 29) * ALL_ASPECTS.length)],
    yoyChange: +((sr(i * 41) - 0.5) * 0.8).toFixed(2),
    esgScore: +(20 + sr(i * 53) * 80).toFixed(1),
  })), []);

  // Boilerplate data for 80 companies
  const boilerplateData = useMemo(() => COMPANIES_80.map((co, i) => {
    const cats = {};
    BOILERPLATE_CATS.forEach((cat, ci) => { cats[`cat${ci}`] = sr(i * 7 + ci * 13) > 0.45; });
    const bpPct = BOILERPLATE_CATS.filter((_, ci) => cats[`cat${ci}`]).length / BOILERPLATE_CATS.length * 100;
    return {
      company: co,
      bpPct: +bpPct.toFixed(1),
      noveltyScore: +(100 - bpPct).toFixed(1),
      esgScore: +(20 + sr(i * 53) * 80).toFixed(1),
      ...cats
    };
  }), []);

  // Readability data
  const readabilityData = useMemo(() => COMPANIES_80.map((co, i) => ({
    company: co,
    sector: SECTORS_10[Math.floor(sr(i * 7) * SECTORS_10.length)],
    flesch: +(30 + sr(i * 11) * 50).toFixed(1),
    fkGrade: +(8 + sr(i * 17) * 10).toFixed(1),
    gunningFog: +(10 + sr(i * 23) * 12).toFixed(1),
    smog: +(8 + sr(i * 29) * 8).toFixed(1),
    coleman: +(9 + sr(i * 37) * 8).toFixed(1),
    esgScore: +(20 + sr(i * 53) * 80).toFixed(1),
  })), []);

  // Alt data signals
  const altSignals = useMemo(() => {
    const signals = ['Social Sentiment Velocity', 'GDELT News Tone', 'Job Posting ESG Keywords', 'Patent Filings (CleanTech)', 'Supplier News Sentiment', 'Regulatory Mention Frequency'];
    return COMPANIES_80.slice(0, 20).map((co, i) => ({
      company: co,
      ...Object.fromEntries(signals.map((s, si) => [s, +((sr(i * 7 + si * 13) * 2 - 1).toFixed(2))]))
    }));
  }, []);

  const COLORS = [T.purple, T.blue, T.green, T.red, T.amber, T.teal, T.orange, T.indigo];
  const sentPieData = [
    { name: 'Positive', value: sentimentCounts.Positive, fill: T.green },
    { name: 'Neutral', value: sentimentCounts.Neutral, fill: T.amber },
    { name: 'Negative', value: sentimentCounts.Negative, fill: T.red },
  ];

  const tabs = ['Social Dashboard', 'Bluesky Monitor', 'ABSA Engine', 'NLI Verification', 'Hedge Detection', 'Boilerplate', 'Alt-Data Alpha', 'Multi-Lingual', 'Readability', 'Integration Guide'];

  // ── Render Tabs ─────────────────────────────────────────────────────────────
  function renderTab0() {
    const topicCounts = {};
    posts.forEach(p => {
      const words = (p.record?.text || '').toLowerCase().split(/\s+/);
      ['esg', 'greenwashing', 'climate', 'net zero', 'carbon', 'scope 3', 'fossil', 'renewable', 'sbti', 'disclosure'].forEach(kw => {
        if (words.some(w => w.includes(kw))) topicCounts[kw] = (topicCounts[kw] || 0) + 1;
      });
    });
    const topicData = Object.entries(topicCounts).map(([k, v]) => ({ topic: k, count: v }));
    const engagementData = posts.slice(0, 10).map((p, i) => ({
      id: i + 1,
      likes: p.likeCount || 0,
      reposts: p.repostCount || 0,
      replies: p.replyCount || 0,
    }));

    return (
      <div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <LiveBadge live={bskyLive} label={`${posts.length} Bluesky posts`} />
          <LiveBadge live={gdeltLive} label={`${gdeltSocial.length} GDELT articles`} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          <KpiCard label="Bluesky Posts" value={posts.length} sub="from live or seed" color={T.purple} />
          <KpiCard label="GDELT Articles" value={gdeltSocial.length || '25 (seed)'} sub="last 7 days" color={T.blue} />
          <KpiCard label="Avg Social Sentiment" value={avgSentScore} sub="−1 neg → +1 pos" color={avgSentScore >= 0 ? T.green : T.red} />
          <KpiCard label="Controversy Signals" value={controversyCount} sub="posts with risk keywords" color={T.red} />
        </div>

        <SectionTitle>Sentiment Distribution — Live Posts</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={sentPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {sentPieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Trending ESG Topics (Post Frequency)</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topicData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="topic" type="category" tick={{ fontSize: 10 }} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill={T.purple} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <SectionTitle>Top Bluesky Posts</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {posts.slice(0, 8).map((p, i) => {
            const text = p.record?.text || '';
            const sent = postSentiment(text);
            const pillar = postPillar(text);
            return (
              <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: T.navy, fontSize: 12, marginBottom: 2 }}>{p.author?.handle || `user${i}@bsky.social`}</div>
                    <div style={{ color: T.textPri, fontSize: 13, lineHeight: 1.5 }}>{text.slice(0, 200)}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', minWidth: 100 }}>
                    <span style={{ background: sent.color + '20', color: sent.color, borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{sent.label}</span>
                    <span style={{ background: pillar.color + '20', color: pillar.color, borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{pillar.label}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: T.textSec }}>
                  <span>❤️ {p.likeCount || 0}</span>
                  <span>🔁 {p.repostCount || 0}</span>
                  <span>💬 {p.replyCount || 0}</span>
                  <span>{new Date(p.indexedAt || p.record?.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {gdeltSocial.length > 0 && (
          <>
            <SectionTitle>GDELT Articles (Live)</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {gdeltSocial.slice(0, 6).map((a, i) => (
                <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: T.navy }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{a.domain} · {a.seendate}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  function renderTab1() {
    return (
      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={bskyInput}
            onChange={e => setBskyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setBskyQuery(bskyInput)}
            placeholder="Search Bluesky..."
            style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.fontMono }}
          />
          <button onClick={() => setBskyQuery(bskyInput)} style={{ padding: '8px 16px', background: T.purple, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            {bskyLoading ? 'Loading...' : 'Search'}
          </button>
          <LiveBadge live={bskyLive} label="Bluesky Public API" />
        </div>
        {bskyLoading && <div style={{ color: T.purple, fontFamily: T.fontMono, fontSize: 13, marginBottom: 12 }}>⏳ Querying Bluesky public API...</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {posts.map((p, i) => {
            const text = p.record?.text || '';
            const sent = postSentiment(text);
            const pillar = postPillar(text);
            const engagement = (p.likeCount || 0) + (p.repostCount || 0) + (p.replyCount || 0);
            const tier = (p.repostCount || 0) > 100 ? { label: 'Viral', color: T.red } : (p.repostCount || 0) > 50 ? { label: 'High', color: T.orange } : engagement > 20 ? { label: 'Normal', color: T.blue } : { label: 'Low', color: T.textSec };
            const isInfluencer = engagement > 200;
            return (
              <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.purple + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: T.purple }}>
                        {(p.author?.displayName || 'U')[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: T.navy }}>{p.author?.displayName || `User ${i}`}</div>
                        <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>{p.author?.handle || `user${i}@bsky.social`}</div>
                      </div>
                      {isInfluencer && <span style={{ background: '#fef3c7', color: T.amber, border: `1px solid #fcd34d`, borderRadius: 12, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>KEY VOICE</span>}
                    </div>
                    <div style={{ color: T.textPri, fontSize: 13, lineHeight: 1.6 }}>{text}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', minWidth: 110 }}>
                    <span style={{ background: sent.color + '20', color: sent.color, borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{sent.label}</span>
                    <span style={{ background: pillar.color + '20', color: pillar.color, borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Pillar {pillar.label}</span>
                    <span style={{ background: tier.color + '20', color: tier.color, borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{tier.label}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: T.textSec, fontFamily: T.fontMono }}>
                  <span>❤️ {p.likeCount || 0}</span>
                  <span>🔁 {p.repostCount || 0}</span>
                  <span>💬 {p.replyCount || 0}</span>
                  <span style={{ marginLeft: 'auto' }}>{new Date(p.indexedAt || p.record?.createdAt || Date.now()).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        <SectionTitle>Engagement Distribution</SectionTitle>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={posts.slice(0, 12).map((p, i) => ({ post: `P${i + 1}`, likes: p.likeCount || 0, reposts: p.repostCount || 0, replies: p.replyCount || 0 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="post" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="likes" fill={T.purple} stackId="a" />
              <Bar dataKey="reposts" fill={T.blue} stackId="a" />
              <Bar dataKey="replies" fill={T.teal} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  function renderTab2() {
    const papers = absPapers.length > 0 ? absPapers : SEED_ABSA_PAPERS;
    return (
      <div>
        <ConceptBox title="What is Aspect-Based Sentiment Analysis (ABSA)?">
          Standard sentiment: "Shell's renewable investments are impressive but their lobbying is shameful" → Positive (0.6). ABSA: Renewable investments → Positive (0.9); Lobbying → Negative (0.8). ABSA gives aspect-level granularity — far more actionable for ESG analytics and engagement strategies.
        </ConceptBox>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <select value={absaAspectFilter} onChange={e => setAbsaAspectFilter(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
            <option value="All">All Aspects</option>
            {ALL_ASPECTS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={absaPillarFilter} onChange={e => setAbsaPillarFilter(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
            <option value="All">All Pillars</option>
            <option value="E">E — Environmental</option>
            <option value="S">S — Social</option>
            <option value="G">G — Governance</option>
          </select>
          <select value={absaSentFilter} onChange={e => setAbsaSentFilter(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
            <option value="All">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>
          <span style={{ fontSize: 12, color: T.textSec, alignSelf: 'center' }}>{filteredAbsa.length} results</span>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Company', 'Text (excerpt)', 'Aspect', 'Sentiment', 'Confidence', 'Pillar'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAbsa.slice(0, 20).map((r, i) => {
                const sentColor = r.sentiment === 'Positive' ? T.green : r.sentiment === 'Negative' ? T.red : T.amber;
                const pillarColor = r.pillar === 'E' ? T.green : r.pillar === 'S' ? T.blue : T.purple;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{r.company}</td>
                    <td style={{ padding: '8px 12px', color: T.textSec, maxWidth: 200 }}>{r.text}...</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ background: T.indigo + '15', color: T.indigo, borderRadius: 6, padding: '2px 8px', fontFamily: T.fontMono, fontSize: 11 }}>{r.aspect}</span></td>
                    <td style={{ padding: '8px 12px' }}><span style={{ background: sentColor + '20', color: sentColor, borderRadius: 12, padding: '2px 8px', fontWeight: 700, fontSize: 11 }}>{r.sentiment}</span></td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{r.confidence}</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ background: pillarColor + '20', color: pillarColor, borderRadius: 12, padding: '2px 8px', fontWeight: 700, fontSize: 11 }}>{r.pillar}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <SectionTitle>Aspect Sentiment Heatmap (24 Aspects × 10 Sectors)</SectionTitle>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, overflowX: 'auto', marginBottom: 24 }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 10, minWidth: 600 }}>
            <thead>
              <tr>
                <th style={{ padding: '4px 8px', textAlign: 'left', color: T.textSec }}>Aspect</th>
                {SECTORS_10.map(s => <th key={s} style={{ padding: '4px 6px', color: T.textSec, fontWeight: 600, whiteSpace: 'nowrap' }}>{s.slice(0, 6)}</th>)}
              </tr>
            </thead>
            <tbody>
              {aspectHeatmap.map((row, ai) => (
                <tr key={ai}>
                  <td style={{ padding: '3px 8px', fontWeight: 600, color: T.navy, whiteSpace: 'nowrap', fontSize: 10 }}>{row.aspect}</td>
                  {SECTORS_10.map(sec => {
                    const val = row[sec];
                    const bg = val > 0.3 ? `rgba(22,163,74,${Math.min(0.8, val)})` : val < -0.3 ? `rgba(220,38,38,${Math.min(0.8, -val)})` : '#f3f4f6';
                    return <td key={sec} style={{ padding: '3px 6px', textAlign: 'center', background: bg, color: Math.abs(val) > 0.3 ? '#fff' : T.textPri, borderRadius: 4, fontSize: 10 }}>{val.toFixed(1)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 10, color: T.textSec, marginTop: 8 }}>Green = positive sentiment · Red = negative sentiment · Intensity = magnitude</div>
        </div>

        <SectionTitle>Aspect Sentiment Trends (12 Months)</SectionTitle>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 24 }}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={aspectTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis domain={[-1, 1]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              {['Carbon Emissions', 'Renewable Energy', 'Labor Practices', 'Board Independence'].map((asp, i) => (
                <Line key={asp} type="monotone" dataKey={asp} stroke={COLORS[i]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <SectionTitle>ABSA Research Papers (OpenAlex {absPapers.length > 0 ? 'LIVE' : 'Seeded'})</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
          {papers.slice(0, 6).map((p, i) => (
            <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: T.navy, marginBottom: 4 }}>{p.title || p.display_name}</div>
              <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>Year: {p.publication_year} · Citations: {p.cited_by_count}</div>
              {(p.open_access?.oa_url || p.open_access?.is_oa) && (
                <a href={p.open_access?.oa_url || 'https://arxiv.org'} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: T.purple, marginTop: 4, display: 'block' }}>Open Access →</a>
              )}
            </div>
          ))}
        </div>

        <SectionTitle>HuggingFace ABSA Models</SectionTitle>
        <div style={{ background: '#1e1e2e', borderRadius: 10, padding: '14px 18px', fontFamily: T.fontMono, fontSize: 12, color: '#e2e8f0', marginBottom: 12 }}>
          <div style={{ color: '#a78bfa', marginBottom: 4 }}># ABSA Integration</div>
          <div>from transformers import pipeline</div>
          <div style={{ color: '#6ee7b7' }}>absa = pipeline(<span style={{ color: '#fcd34d' }}>"text-classification"</span>, model=<span style={{ color: '#fcd34d' }}>"yangheng/deberta-v3-base-absa-v1.1"</span>)</div>
          <div>text = <span style={{ color: '#fcd34d' }}>"Shell's renewable investments are impressive but their lobbying is shameful"</span></div>
          <div>aspects = [<span style={{ color: '#fcd34d' }}>"renewable investments"</span>, <span style={{ color: '#fcd34d' }}>"lobbying"</span>]</div>
          <div>for aspect in aspects:</div>
          <div>{"    "}result = absa(f<span style={{ color: '#fcd34d' }}>"[CLS] {'{'}text{'}'} [SEP] {'{'}aspect{'}'} [SEP]"</span>)</div>
          <div>{"    "}print(f<span style={{ color: '#fcd34d' }}>"{'{'}{'{'}aspect{'}'}{'}'}: {'{'}{'{'}result[0]['label']{'}'}{'}'} ({'{'}{'{'}result[0]['score']:.2f{'}'}{'}'}) "</span>)</div>
        </div>
      </div>
    );
  }

  function renderTab3() {
    const nliByType = [
      { type: 'Quantitative Targets', entailment: 42, neutral: 35, contradiction: 23 },
      { type: 'Qualitative Commitments', entailment: 51, neutral: 29, contradiction: 20 },
      { type: 'Achievement Claims', entailment: 38, neutral: 22, contradiction: 40 },
      { type: 'Certification Claims', entailment: 65, neutral: 18, contradiction: 17 },
    ];
    const contradictionTrend = Array.from({ length: 6 }, (_, i) => ({ year: 2018 + i, contradiction: 45 - i * 3.2 + sr(i * 7) * 4 }));

    return (
      <div>
        <ConceptBox title="What is Natural Language Inference (NLI)?">
          NLI classifies the relationship between a premise (company claim) and hypothesis (verification statement). Entailment = claim is verified by available evidence. Contradiction = claim is contradicted. Neutral = insufficient evidence either way. Gold standard for automated ESG claim checking at scale.
        </ConceptBox>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Company', 'Claim (premise)', 'NLI Label', 'Confidence', 'Evidence Source', 'Greenwash Risk'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nliClaims.slice(0, 20).map((r, i) => {
                const nliColor = r.nli === 'Entailment' ? T.green : r.nli === 'Contradiction' ? T.red : T.amber;
                const gwColor = r.gwRisk === 'High' ? T.red : r.gwRisk === 'Medium' ? T.amber : T.green;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy, fontSize: 11 }}>{r.company}</td>
                    <td style={{ padding: '8px 12px', color: T.textSec, maxWidth: 220, fontSize: 11 }}>{r.claim}</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ background: nliColor + '20', color: nliColor, borderRadius: 12, padding: '2px 8px', fontWeight: 700, fontSize: 11 }}>{r.nli}</span></td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, fontSize: 11 }}>{r.confidence}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11 }}>{r.source}</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ background: gwColor + '20', color: gwColor, borderRadius: 12, padding: '2px 8px', fontWeight: 700, fontSize: 11 }}>{r.gwRisk}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>NLI by Claim Type</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={nliByType}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="type" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="entailment" name="Entailment" fill={T.green} stackId="a" />
                <Bar dataKey="neutral" name="Neutral" fill={T.amber} stackId="a" />
                <Bar dataKey="contradiction" name="Contradiction" fill={T.red} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>Contradiction Rate Over Time (%)</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={contradictionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="contradiction" stroke={T.red} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <SectionTitle>HuggingFace NLI Models</SectionTitle>
        <div style={{ background: '#1e1e2e', borderRadius: 10, padding: '14px 18px', fontFamily: T.fontMono, fontSize: 12, color: '#e2e8f0' }}>
          <div style={{ color: '#a78bfa', marginBottom: 4 }}># NLI Claim Verification</div>
          <div>from transformers import pipeline</div>
          <div>nli = pipeline(<span style={{ color: '#fcd34d' }}>"zero-shot-classification"</span>, model=<span style={{ color: '#fcd34d' }}>"cross-encoder/nli-deberta-v3-small"</span>)</div>
          <div>claim = <span style={{ color: '#fcd34d' }}>"We achieved carbon neutrality across all operations in 2023"</span></div>
          <div>result = nli(claim, candidate_labels=[<span style={{ color: '#fcd34d' }}>"verified"</span>, <span style={{ color: '#fcd34d' }}>"contradicted"</span>, <span style={{ color: '#fcd34d' }}>"insufficient evidence"</span>])</div>
          <div style={{ color: '#86efac', marginTop: 8 }}># Free models: cross-encoder/nli-deberta-v3-small · facebook/bart-large-mnli · typeform/distilbert-base-uncased-mnli</div>
        </div>
      </div>
    );
  }

  function renderTab4() {
    const sectorHedge = SECTORS_10.map((s, i) => ({ sector: s, avgHedgeDensity: +(10 + sr(i * 17) * 40).toFixed(1), avgCertainty: +(1.5 + sr(i * 23) * 3).toFixed(2) }));
    const hedgeVsEsg = hedgeData.slice(0, 40).map(d => ({ hedgeDensity: d.hedgeDensity, esgScore: d.esgScore }));
    const topHedge = [...hedgeData].sort((a, b) => b.hedgeDensity - a.hedgeDensity).slice(0, 15);

    return (
      <div>
        <ConceptBox title="Hedge & Certainty Detection in ESG Language">
          Hedge detection identifies epistemic uncertainty in corporate language. "We aim to achieve net zero by 2050" (Level 3 — Weak Positive) vs "We WILL achieve net zero by 2040 — confirmed by SBTi" (Level 5 — Strong). High hedge density signals regulatory and reputational risk.
        </ConceptBox>

        <SectionTitle>Certainty Spectrum</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          {[
            { level: 5, label: 'Strong Commitment', color: T.green, examples: 'We WILL achieve... / We HAVE achieved... / Completed / Delivered' },
            { level: 4, label: 'Moderate', color: T.teal, examples: 'We ARE COMMITTED to... / We PLAN to... / On track to...' },
            { level: 3, label: 'Weak Positive', color: T.amber, examples: 'We AIM to... / We INTEND to... / We SEEK to...' },
            { level: 2, label: 'Hedge', color: T.orange, examples: 'We HOPE to... / Working toward... / We EXPECT to...' },
            { level: 1, label: 'Strong Hedge', color: T.red, examples: 'We ASPIRE to... / Exploring... / Subject to... / Contingent on...' },
          ].map(lvl => (
            <div key={lvl.level} style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', borderLeft: `4px solid ${lvl.color}` }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: lvl.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{lvl.level}</div>
              <div>
                <div style={{ fontWeight: 700, color: lvl.color, fontSize: 13 }}>{lvl.label}</div>
                <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.fontMono }}>{lvl.examples}</div>
              </div>
            </div>
          ))}
        </div>

        <SectionTitle>Hedge Phrases Lexicon</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {HEDGE_PHRASES.map((ph, i) => {
            const color = ph.level <= 1 ? T.red : ph.level <= 2 ? T.orange : ph.level <= 3 ? T.amber : ph.level <= 4 ? T.teal : T.green;
            return (
              <span key={i} style={{ background: color + '20', color, border: `1px solid ${color}40`, borderRadius: 12, padding: '4px 10px', fontSize: 11, fontFamily: T.fontMono }}>
                {ph.phrase} <span style={{ opacity: 0.6 }}>L{ph.level}</span>
              </span>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>Hedge Density vs ESG Score</div>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="hedgeDensity" name="Hedge Density" tick={{ fontSize: 10 }} label={{ value: 'Hedge Density', position: 'bottom', fontSize: 10 }} />
                <YAxis dataKey="esgScore" name="ESG Score" tick={{ fontSize: 10 }} label={{ value: 'ESG Score', angle: -90, position: 'left', fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={hedgeVsEsg} fill={T.purple} opacity={0.6} /></ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>Hedge Density by Sector</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sectorHedge} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="sector" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip />
                <Bar dataKey="avgHedgeDensity" fill={T.orange} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <SectionTitle>Company Hedge Analysis (Top 15 Most Hedged)</SectionTitle>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: T.sub }}>
              {['Company', 'Hedge Density', 'Avg Certainty', 'Most Hedged Topic', 'YoY Change', 'ESG Score'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {topHedge.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{r.company}</td>
                  <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{r.hedgeDensity}</td>
                  <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>
                    <span style={{ color: r.avgCertainty > 3 ? T.green : r.avgCertainty > 2 ? T.amber : T.red }}>{r.avgCertainty}</span>
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: 11, color: T.textSec }}>{r.mostHedgedTopic}</td>
                  <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>
                    <span style={{ color: r.yoyChange > 0 ? T.green : T.red }}>{r.yoyChange > 0 ? '+' : ''}{r.yoyChange}</span>
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{r.esgScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderTab5() {
    const sortedByNovelty = [...boilerplateData].sort((a, b) => b.noveltyScore - a.noveltyScore);
    const noveltyVsEsg = boilerplateData.slice(0, 40).map(d => ({ noveltyScore: d.noveltyScore, esgScore: d.esgScore }));
    const bpCatUsage = BOILERPLATE_CATS.map((cat, ci) => ({
      cat: cat.slice(0, 30),
      pct: +(boilerplateData.filter(d => d[`cat${ci}`]).length / boilerplateData.length * 100).toFixed(1)
    }));

    return (
      <div>
        <ConceptBox title="Boilerplate vs Novel Disclosure Detection">
          Boilerplate detection identifies copy-pasted standard language vs genuinely novel disclosure. TF-IDF cosine similarity to a standard template corpus — similarity &gt; 0.8 = boilerplate. Companies with high novelty scores (&gt;80%) are making substantive, informative disclosures. Low novelty (&lt;30%) = checkbox compliance only.
        </ConceptBox>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          <KpiCard label="Avg Boilerplate %" value={`${(boilerplateData.reduce((a, d) => a + d.bpPct, 0) / boilerplateData.length).toFixed(1)}%`} color={T.orange} />
          <KpiCard label="High Novelty Companies" value={boilerplateData.filter(d => d.noveltyScore > 80).length} sub=">80% novelty score" color={T.green} />
          <KpiCard label="Low Novelty Companies" value={boilerplateData.filter(d => d.noveltyScore < 30).length} sub="<30% novelty score" color={T.red} />
          <KpiCard label="Most Common Template" value={bpCatUsage.sort((a, b) => b.pct - a.pct)[0]?.pct + '%'} sub={bpCatUsage.sort((a, b) => b.pct - a.pct)[0]?.cat.slice(0, 20)} color={T.amber} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>Boilerplate Template Usage (%)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[...bpCatUsage].sort((a, b) => b.pct - a.pct)} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="cat" type="category" tick={{ fontSize: 9 }} width={160} />
                <Tooltip />
                <Bar dataKey="pct" fill={T.orange} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>Novelty Score vs ESG Rating</div>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="noveltyScore" name="Novelty Score" tick={{ fontSize: 10 }} />
                <YAxis dataKey="esgScore" name="ESG Score" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Scatter data={noveltyVsEsg} fill={T.teal} opacity={0.7} /></ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <SectionTitle>Company Novelty Rankings</SectionTitle>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: T.sub }}>
              {['Rank', 'Company', 'Boilerplate %', 'Novelty Score', 'ESG Score', 'Quality'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {sortedByNovelty.slice(0, 20).map((r, i) => {
                const qualColor = r.noveltyScore > 70 ? T.green : r.noveltyScore > 40 ? T.amber : T.red;
                const qualLabel = r.noveltyScore > 70 ? 'Substantive' : r.noveltyScore > 40 ? 'Mixed' : 'Checkbox';
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.textSec }}>#{i + 1}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{r.company}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{r.bpPct}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>
                      <span style={{ color: qualColor, fontWeight: 700 }}>{r.noveltyScore}%</span>
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{r.esgScore}</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ background: qualColor + '20', color: qualColor, borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{qualLabel}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <SectionTitle>NLP Pipeline: TF-IDF Boilerplate Detection</SectionTitle>
        <div style={{ background: '#1e1e2e', borderRadius: 10, padding: '14px 18px', fontFamily: T.fontMono, fontSize: 12, color: '#e2e8f0' }}>
          <div style={{ color: '#a78bfa', marginBottom: 4 }}># TF-IDF Boilerplate Detection</div>
          <div>from sklearn.feature_extraction.text import TfidfVectorizer</div>
          <div>from sklearn.metrics.pairwise import cosine_similarity</div>
          <div style={{ marginTop: 6 }}>vectorizer = TfidfVectorizer(ngram_range=(1,3), max_features=10000)</div>
          <div>template_vec = vectorizer.fit_transform(BOILERPLATE_TEMPLATES)</div>
          <div>report_vec = vectorizer.transform([company_report])</div>
          <div>scores = cosine_similarity(report_vec, template_vec)</div>
          <div>boilerplate_pct = (scores &gt; 0.8).mean() * 100</div>
        </div>
      </div>
    );
  }

  function renderTab6() {
    const ALT_SIGNALS = ['Social Sentiment Velocity', 'GDELT News Tone', 'Job Posting ESG Keywords', 'Patent Filings (CleanTech)', 'Supplier News Sentiment', 'Regulatory Mention Frequency'];
    const icDecayData = ALT_SIGNALS.map((sig, si) => ({
      signal: sig.slice(0, 20),
      '1D': +(0.05 + sr(si * 7) * 0.1).toFixed(3),
      '5D': +(0.04 + sr(si * 11) * 0.08).toFixed(3),
      '21D': +(0.02 + sr(si * 17) * 0.06).toFixed(3),
      '63D': +(0.005 + sr(si * 23) * 0.03).toFixed(3),
    }));
    const sharpeData = Array.from({ length: 9 }, (_, i) => ({
      weight: i * 5,
      sharpe: +(0.8 + i * 0.04 - Math.pow(i - 6, 2) * 0.005 + sr(i * 7) * 0.05).toFixed(3)
    }));
    const topMentioned = posts.slice(0, 10).map((p, i) => ({
      company: COMPANIES_80[i % 10],
      mentions: Math.round(sr(i * 17) * 40 + 5),
      engagement: (p.likeCount || 0) + (p.repostCount || 0),
    }));

    return (
      <div>
        <SectionTitle>Alternative Data Signal Framework</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {ALT_SIGNALS.map((sig, i) => (
            <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px', borderTop: `3px solid ${COLORS[i]}` }}>
              <div style={{ fontWeight: 700, color: COLORS[i], fontSize: 12, marginBottom: 4 }}>{sig}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>IC(1D): {icDecayData[i]?.['1D']} · Half-life: {Math.round(3 + sr(i * 31) * 15)}d</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>IC Decay by Signal (1D → 63D)</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={icDecayData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="signal" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                {['1D', '5D', '21D', '63D'].map((period, pi) => (
                  <Line key={period} type="monotone" dataKey={period} stroke={COLORS[pi]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>Alt-Data Weight → Portfolio Sharpe</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: T.textSec }}>Alt-Data Weight: <strong>{altDataWeight}%</strong></label>
              <input type="range" min={0} max={40} value={altDataWeight} onChange={e => setAltDataWeight(+e.target.value)} style={{ width: '100%', marginTop: 4 }} />
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={sharpeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="weight" tick={{ fontSize: 10 }} label={{ value: 'Alt-Data Weight (%)', position: 'bottom', fontSize: 10 }} />
                <YAxis domain={[0.7, 1.1]} tick={{ fontSize: 10 }} label={{ value: 'Sharpe', angle: -90, position: 'left', fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="sharpe" stroke={T.purple} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <SectionTitle>Live Social Attention Signal (Bluesky × Engagement)</SectionTitle>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 24 }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topMentioned}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="company" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="engagement" name="Engagement Score" fill={T.purple} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <SectionTitle>Signal Construction Table (20 Companies)</SectionTitle>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead><tr style={{ background: T.sub }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}` }}>Company</th>
              {ALT_SIGNALS.map(s => <th key={s} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 10 }}>{s.slice(0, 10)}</th>)}
            </tr></thead>
            <tbody>
              {altSignals.slice(0, 15).map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                  <td style={{ padding: '6px 12px', fontWeight: 600, color: T.navy }}>{r.company}</td>
                  {ALT_SIGNALS.map(s => {
                    const val = r[s];
                    return <td key={s} style={{ padding: '6px 10px', textAlign: 'right', fontFamily: T.fontMono, color: val > 0 ? T.green : T.red }}>{val > 0 ? '+' : ''}{val}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderTab7() {
    const langDist = LANGUAGES.map((l, i) => ({ ...l, articles: Math.round(3 + sr(i * 17) * 12) }));
    const divergenceData = COMPANIES_80.slice(0, 10).map((co, i) => ({
      company: co.slice(0, 12),
      enSentiment: +((sr(i * 7) * 2 - 1).toFixed(2)),
      nativeSentiment: +((sr(i * 13) * 2 - 1).toFixed(2)),
      divergence: +(Math.abs(sr(i * 7) - sr(i * 13)) * 1.5).toFixed(2),
    }));

    return (
      <div>
        <SectionTitle>Language Detection from Live Posts</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>GDELT Articles by Language</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={langDist} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="lang" type="category" tick={{ fontSize: 10 }} width={40} />
                <Tooltip />
                <Bar dataKey="articles" fill={T.blue} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>Language-Specific NLP Models</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ background: T.sub }}>
                {['Language', 'Model', 'F1', 'Notes'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {LANGUAGES.map((l, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontWeight: 700, color: T.purple }}>{l.lang}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11 }}>{l.model}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>
                      <span style={{ color: l.f1 > 0.80 ? T.green : l.f1 > 0.75 ? T.amber : T.red }}>{l.f1}</span>
                    </td>
                    <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{l.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <SectionTitle>Cross-Lingual Sentiment Divergence (EN vs Native Language Media)</SectionTitle>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 24 }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={divergenceData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="company" tick={{ fontSize: 10 }} />
              <YAxis domain={[-1.5, 1.5]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="enSentiment" name="EN Sentiment" fill={T.blue} />
              <Bar dataKey="nativeSentiment" name="Native Sentiment" fill={T.purple} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <SectionTitle>Divergence Analysis</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...divergenceData].sort((a, b) => b.divergence - a.divergence).slice(0, 6).map((r, i) => (
            <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, color: T.navy }}>{r.company}</div>
              <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.fontMono }}>EN: {r.enSentiment} · Native: {r.nativeSentiment}</div>
              <span style={{ background: r.divergence > 0.5 ? T.red + '20' : T.amber + '20', color: r.divergence > 0.5 ? T.red : T.amber, borderRadius: 12, padding: '2px 10px', fontWeight: 700, fontSize: 12 }}>
                Δ {r.divergence}
              </span>
            </div>
          ))}
        </div>
        <div style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', marginTop: 16, fontSize: 12, color: T.textSec }}>
          Note: Machine-translated text loses 8–15% sentiment accuracy vs native language model. High divergence (&gt;0.5) between EN and native coverage may indicate media bias or information asymmetry.
        </div>
      </div>
    );
  }

  function renderTab8() {
    const complexityTrend = Array.from({ length: 6 }, (_, i) => ({
      year: 2018 + i,
      flesch: +(38 + i * 1.2 + sr(i * 7) * 4).toFixed(1),
      fkGrade: +(15 - i * 0.4 + sr(i * 11) * 1.5).toFixed(1),
    }));
    const readVsEsg = readabilityData.slice(0, 40).map(d => ({ flesch: d.flesch, esgScore: d.esgScore }));
    const zoneData = [
      { zone: 'Very Easy (70-100)', count: readabilityData.filter(d => d.flesch >= 70).length },
      { zone: 'Standard (60-70)', count: readabilityData.filter(d => d.flesch >= 60 && d.flesch < 70).length },
      { zone: 'Difficult (40-60)', count: readabilityData.filter(d => d.flesch >= 40 && d.flesch < 60).length },
      { zone: 'Very Difficult (<40)', count: readabilityData.filter(d => d.flesch < 40).length },
    ];

    return (
      <div>
        <SectionTitle>Readability Metrics Reference</SectionTitle>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: T.sub }}>
              {['Metric', 'Formula', 'Interpretation'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {[
                ['Flesch Reading Ease', '206.835 − 1.015(w/s) − 84.6(syl/w)', 'Higher = easier. 60–70 = standard prose'],
                ['Flesch-Kincaid Grade', '0.39(w/s) + 11.8(syl/w) − 15.59', 'Grade level required to comprehend'],
                ['Gunning Fog Index', '0.4 × (w/s + % complex words × 100)', '>12 = hard for general public'],
                ['SMOG Index', '3 + √(polysyllables × 30/sentences)', 'Medical/legal readability standard'],
                ['Coleman-Liau', '0.0588L − 0.296S − 15.8', 'Grade level (L=avg letters/100w, S=sents/100w)'],
              ].map(([metric, formula, interp], i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{metric}</td>
                  <td style={{ padding: '10px 12px', fontFamily: T.fontMono, fontSize: 11, color: T.purple }}>{formula}</td>
                  <td style={{ padding: '10px 12px', color: T.textSec }}>{interp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>Readability Trend 2018–2023</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={complexityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="flesch" name="Flesch Ease" stroke={T.green} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="fkGrade" name="FK Grade" stroke={T.red} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 12 }}>Readability Zones Distribution</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={zoneData}>
                <XAxis dataKey="zone" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill={T.teal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <SectionTitle>Flesch Reading Ease vs ESG Rating</SectionTitle>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 24 }}>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="flesch" name="Flesch Reading Ease" tick={{ fontSize: 10 }} label={{ value: 'Flesch Reading Ease', position: 'bottom', fontSize: 10 }} />
              <YAxis dataKey="esgScore" name="ESG Score" tick={{ fontSize: 10 }} label={{ value: 'ESG Score', angle: -90, position: 'left', fontSize: 10 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={readVsEsg} fill={T.teal} opacity={0.7} /></ScatterChart>
          </ResponsiveContainer>
        </div>

        <SectionTitle>80-Company Readability Scores</SectionTitle>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: T.sub }}>
              {['Company', 'Flesch Ease', 'FK Grade', 'Gunning Fog', 'SMOG', 'Coleman-Liau', 'ESG Score'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {readabilityData.slice(0, 20).map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy, fontSize: 11 }}>{r.company}</td>
                  <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}><span style={{ color: r.flesch > 60 ? T.green : r.flesch > 40 ? T.amber : T.red }}>{r.flesch}</span></td>
                  <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{r.fkGrade}</td>
                  <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}><span style={{ color: r.gunningFog > 14 ? T.red : T.amber }}>{r.gunningFog}</span></td>
                  <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{r.smog}</td>
                  <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{r.coleman}</td>
                  <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{r.esgScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderTab9() {
    const papers = absPapers.length > 0 ? absPapers : SEED_ABSA_PAPERS;
    return (
      <div>
        <SectionTitle>ABSA Implementation (Python)</SectionTitle>
        <div style={{ background: '#1e1e2e', borderRadius: 10, padding: '16px 20px', fontFamily: T.fontMono, fontSize: 12, color: '#e2e8f0', marginBottom: 20 }}>
          <div style={{ color: '#a78bfa', marginBottom: 6 }}># pip install transformers torch</div>
          <div>from transformers import pipeline</div>
          <div style={{ marginTop: 6 }}>absa = pipeline(<span style={{ color: '#fcd34d' }}>"text-classification"</span>, model=<span style={{ color: '#fcd34d' }}>"yangheng/deberta-v3-base-absa-v1.1"</span>)</div>
          <div>text = <span style={{ color: '#fcd34d' }}>"Shell's renewable investments are impressive but their lobbying is shameful"</span></div>
          <div>aspects = [<span style={{ color: '#fcd34d' }}>"renewable investments"</span>, <span style={{ color: '#fcd34d' }}>"lobbying"</span>]</div>
          <div>for aspect in aspects:</div>
          <div>{"    "}result = absa(f<span style={{ color: '#fcd34d' }}>"[CLS] {'{text}'} [SEP] {'{aspect}'} [SEP]"</span>)</div>
          <div>{"    "}print(f<span style={{ color: '#fcd34d' }}>"{'{'}{'{aspect}'}{'}'}: {'{'}{'{result[0][\'label\']}'}{'}' } ({'{'}{'{result[0][\'score\']:.2f}'}{'}'}) "</span>)</div>
          <div style={{ color: '#6ee7b7', marginTop: 8 }}># Model: yangheng/deberta-v3-base-absa-v1.1 (free, HuggingFace)</div>
          <div style={{ color: '#6ee7b7' }}># Alt:   kardosdrur/deberta-v3-large-absa-reviews (free, larger)</div>
        </div>

        <SectionTitle>NLI Claim Verification (Python)</SectionTitle>
        <div style={{ background: '#1e1e2e', borderRadius: 10, padding: '16px 20px', fontFamily: T.fontMono, fontSize: 12, color: '#e2e8f0', marginBottom: 20 }}>
          <div>from transformers import pipeline</div>
          <div>nli = pipeline(<span style={{ color: '#fcd34d' }}>"zero-shot-classification"</span>, model=<span style={{ color: '#fcd34d' }}>"cross-encoder/nli-deberta-v3-small"</span>)</div>
          <div>claim = <span style={{ color: '#fcd34d' }}>"We achieved carbon neutrality across all operations in 2023"</span></div>
          <div>hypothesis = <span style={{ color: '#fcd34d' }}>"The company has third-party verified carbon neutrality certification"</span></div>
          <div>result = nli(claim, candidate_labels=[<span style={{ color: '#fcd34d' }}>"verified"</span>, <span style={{ color: '#fcd34d' }}>"contradicted"</span>, <span style={{ color: '#fcd34d' }}>"insufficient evidence"</span>])</div>
          <div style={{ color: '#6ee7b7', marginTop: 8 }}># Free models: cross-encoder/nli-deberta-v3-small · facebook/bart-large-mnli · typeform/distilbert-base-uncased-mnli</div>
        </div>

        <SectionTitle>Hedge Detection (Python Regex)</SectionTitle>
        <div style={{ background: '#1e1e2e', borderRadius: 10, padding: '16px 20px', fontFamily: T.fontMono, fontSize: 12, color: '#e2e8f0', marginBottom: 20 }}>
          <div>import re</div>
          <div style={{ marginTop: 6 }}>HEDGE_PATTERNS = {'{'}</div>
          <div>{"    "}<span style={{ color: '#fcd34d' }}>'strong_hedge'</span>: r<span style={{ color: '#86efac' }}>'\b(aspire|explore|consider|hope to|working toward)\b'</span>,</div>
          <div>{"    "}<span style={{ color: '#fcd34d' }}>'weak_hedge'</span>: r<span style={{ color: '#86efac' }}>'\b(aim|intend|seek|expect|plan to)\b'</span>,</div>
          <div>{"    "}<span style={{ color: '#fcd34d' }}>'moderate'</span>: r<span style={{ color: '#86efac' }}>'\b(committed to|will work|target)\b'</span>,</div>
          <div>{"    "}<span style={{ color: '#fcd34d' }}>'strong'</span>: r<span style={{ color: '#86efac' }}>'\b(will|have achieved|completed|delivered)\b'</span>,</div>
          <div>{'}'}</div>
          <div style={{ marginTop: 6 }}>def hedge_density(text):</div>
          <div>{"    "}words = len(text.split())</div>
          <div>{"    "}hedges = sum(len(re.findall(p, text, re.IGNORECASE)) for p in HEDGE_PATTERNS.values())</div>
          <div>{"    "}return (hedges / words * 1000) if words else 0  <span style={{ color: '#6ee7b7' }}># per 1000 words</span></div>
        </div>

        <SectionTitle>Bluesky API Reference</SectionTitle>
        <div style={{ background: '#1e1e2e', borderRadius: 10, padding: '16px 20px', fontFamily: T.fontMono, fontSize: 12, color: '#e2e8f0', marginBottom: 20 }}>
          <div style={{ color: '#a78bfa' }}># Bluesky Public API — No auth required for public search</div>
          <div style={{ color: '#fcd34d', marginTop: 4 }}>GET https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts</div>
          <div style={{ color: '#6ee7b7', marginTop: 6 }}># Parameters:</div>
          <div>{"  "}q: string           <span style={{ color: '#6ee7b7' }}># Search query</span></div>
          <div>{"  "}limit: 1-100        <span style={{ color: '#6ee7b7' }}># Results per page (default 25)</span></div>
          <div>{"  "}cursor: string      <span style={{ color: '#6ee7b7' }}># Pagination cursor</span></div>
          <div>{"  "}since: datetime     <span style={{ color: '#6ee7b7' }}># Filter from date (ISO 8601)</span></div>
          <div>{"  "}until: datetime     <span style={{ color: '#6ee7b7' }}># Filter to date (ISO 8601)</span></div>
          <div>{"  "}lang: string        <span style={{ color: '#6ee7b7' }}># Language filter (e.g. 'en')</span></div>
          <div style={{ color: '#6ee7b7', marginTop: 6 }}># Response shape: {'{ posts: [...], cursor: string }'}</div>
          <div style={{ color: '#6ee7b7' }}># Post: {'{ uri, cid, author, record: { text, createdAt }, likeCount, replyCount, repostCount }'}</div>
        </div>

        <SectionTitle>Top Research Papers (OpenAlex {papers === SEED_ABSA_PAPERS ? 'Seeded' : 'Live'})</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {papers.slice(0, 5).map((p, i) => (
            <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 4 }}>{p.title || p.display_name}</div>
                  <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>Year: {p.publication_year} · Citations: {p.cited_by_count} · Open Access</div>
                </div>
                <span style={{ background: T.purple + '20', color: T.purple, borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>#{i + 1} Most Cited</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', marginTop: 24 }}>
          <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8, fontSize: 13 }}>Module Summary — EP-SAD1</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 12, color: T.textSec }}>
            <div><strong style={{ color: T.purple }}>3 Live APIs:</strong> Bluesky Public · GDELT DocAPI · OpenAlex</div>
            <div><strong style={{ color: T.purple }}>NLP Methods:</strong> ABSA · NLI · Hedge Detection · Boilerplate · TF-IDF</div>
            <div><strong style={{ color: T.purple }}>Analytics:</strong> 24 ESG Aspects · 60 NLI Claims · 80 Companies</div>
            <div><strong style={{ color: T.purple }}>Models:</strong> DeBERTa-v3 · BART-MNLI · FinBERT · XLM-RoBERTa</div>
            <div><strong style={{ color: T.purple }}>Alt-Data:</strong> 6 signals · IC decay · Sharpe optimization</div>
            <div><strong style={{ color: T.purple }}>Languages:</strong> 8 language models · Cross-lingual divergence</div>
          </div>
        </div>
      </div>
    );
  }

  const tabRenderers = [renderTab0, renderTab1, renderTab2, renderTab3, renderTab4, renderTab5, renderTab6, renderTab7, renderTab8, renderTab9];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.purple}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontFamily: T.fontMono, color: T.purple, fontSize: 11 }}>EP-SAD1</span>
              <span style={{ background: T.purple + '30', color: T.purple, border: `1px solid ${T.purple}`, borderRadius: 12, padding: '2px 10px', fontSize: 10, fontWeight: 700 }}>AI & NLP Analytics</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Social & Alternative Data Intelligence</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, fontFamily: T.fontMono }}>Bluesky API · GDELT Social · ABSA · NLI · Hedge Detection · Boilerplate · Alt-Data Alpha · 3 Live APIs</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <LiveBadge live={bskyLive} label="Bluesky" />
            <LiveBadge live={gdeltLive} label="GDELT" />
            <LiveBadge live={absPapers.length > 0} label="OpenAlex" />
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, overflowX: 'auto' }}>
        <div style={{ display: 'flex', minWidth: 'max-content', padding: '0 24px' }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{ padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: tab === i ? 700 : 500, fontSize: 12, color: tab === i ? T.purple : T.textSec, borderBottom: `3px solid ${tab === i ? T.purple : 'transparent'}`, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
        {tabRenderers[tab]?.()}
      </div>
    </div>
  );
}
