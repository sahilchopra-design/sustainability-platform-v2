import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  ScatterChart, Scatter, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0',
  sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3',
  textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626',
  blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e',
  indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4',
  fontMono: 'JetBrains Mono, monospace'
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── Static Data ───────────────────────────────────────────────────────────────

const SECTORS = ['Energy','Financials','Technology','Materials','Utilities','Industrials','Healthcare','Consumer','Real Estate','Transportation'];
const SOURCES_LIST = ['Reuters','Bloomberg','FT','MSCI ESG','Sustainalytics','RepRisk','UNGC','NGO Reports','Regulatory Filings','Social Media','Corporate Filings','Academic'];
const PILLARS = ['E','S','G'];
const SENTIMENTS = ['Positive','Neutral','Negative'];
const CONTROVERSY_TYPES = ['Environmental Damage','Labor Violation','Greenwashing','Regulatory Fine','Board Misconduct','Supply Chain','Tax Avoidance','Data Breach'];
const DISAMBIG_METHODS = ['Wikidata','Context Window','Ticker Match','Country Reference'];

const COMPANY_NAMES = [
  'Shell plc','BP Global','TotalEnergies','ExxonMobil','Chevron','Equinor','Repsol','Eni SpA',
  'HSBC Holdings','Barclays','Deutsche Bank','BNP Paribas','JPMorgan Chase','Goldman Sachs','Citigroup','UBS Group',
  'Apple Inc','Microsoft','Alphabet','Meta Platforms','Samsung','TSMC','ASML','Intel Corp',
  'Rio Tinto','BHP Group','Glencore','Anglo American','Freeport-McMoRan','Newmont Corp','Vale SA','Antofagasta',
  'Enel SpA','Iberdrola','Orsted','NextEra Energy','E.ON SE','RWE AG','Engie SA','Vattenfall',
  'Siemens AG','ABB Ltd','Honeywell','3M Company','Caterpillar','Deere & Co','Emerson Electric','Parker Hannifin',
  'Johnson & Johnson','Pfizer Inc','Novartis','Roche Holding','AstraZeneca','Merck KGaA','Bayer AG','Sanofi SA',
  'Nestle SA','Unilever','Procter & Gamble','Danone SA','AB InBev','Pernod Ricard','Heineken NV','Diageo plc',
  'CBRE Group','Prologis','Vonovia SE','Land Securities','Unibail-Rodamco','Welltower','AvalonBay','Boston Properties',
  'Maersk','FedEx Corp','UPS Inc','Lufthansa','Air France-KLM','Delta Air Lines','CNH Industrial','Volvo Group'
];

const HEADLINE_SUFFIXES = [
  'raises climate ambition with updated net-zero pledge',
  'faces scrutiny over Scope 3 emissions disclosure gaps',
  'board elects new sustainability committee chair',
  'issues green bond amid investor ESG demand surge',
  'criticized by NGO for deforestation supply chain links',
  'announces carbon capture partnership with government',
  'regulators probe greenwashing claims in prospectus',
  'achieves CDP A-list rating for third consecutive year',
  'discloses climate scenario analysis under TCFD framework',
  'accelerates coal phase-out timeline to 2030',
];

// ── Article dataset (80 articles) ─────────────────────────────────────────────

const ARTICLES = Array.from({ length: 80 }, (_, i) => {
  const posRaw = sr(i * 7 + 1);
  const neuRaw = sr(i * 7 + 2);
  const negRaw = sr(i * 7 + 3);
  const total = posRaw + neuRaw + negRaw;
  const fp = posRaw / total;
  const fn = neuRaw / total;
  const fg = negRaw / total;
  const score = Math.round(20 + sr(i * 13 + 4) * 60);
  const sentIdx = score > 60 ? 0 : score > 40 ? 1 : 2;
  const conf = 0.55 + sr(i * 11 + 5) * 0.44;
  const credTier = Math.max(1, Math.ceil(sr(i * 17 + 6) * 5));
  const month = String(Math.max(1, Math.ceil(sr(i * 3 + 7) * 12))).padStart(2, '0');
  const day = String(Math.max(1, Math.ceil(sr(i * 3 + 8) * 28))).padStart(2, '0');
  const numEntities = 2 + Math.floor(sr(i * 5 + 9) * 3);
  const entities = Array.from({ length: numEntities }, (_, j) =>
    COMPANY_NAMES[Math.floor(sr(i * 5 + j + 10) * COMPANY_NAMES.length)]
  );
  const kwBase = ['carbon','emissions','ESG','disclosure','transition','climate','governance','reporting','net-zero','taxonomy','TCFD','SFDR','biodiversity','scope3','alignment'];
  const keywords = Array.from({ length: 5 }, (_, j) => kwBase[Math.floor(sr(i * 7 + j + 15) * kwBase.length)]);
  return {
    id: i + 1,
    date: `2025-${month}-${day}`,
    company: COMPANY_NAMES[i % COMPANY_NAMES.length],
    sector: SECTORS[i % SECTORS.length],
    headline: `${COMPANY_NAMES[i % COMPANY_NAMES.length]} ${HEADLINE_SUFFIXES[i % HEADLINE_SUFFIXES.length]}`,
    source: SOURCES_LIST[Math.floor(sr(i * 19 + 20) * SOURCES_LIST.length)],
    sentiment: SENTIMENTS[sentIdx],
    score,
    confidence: parseFloat(conf.toFixed(3)),
    pillar: PILLARS[Math.floor(sr(i * 23 + 21) * 3)],
    finbert_pos: parseFloat(fp.toFixed(3)),
    finbert_neu: parseFloat(fn.toFixed(3)),
    finbert_neg: parseFloat(fg.toFixed(3)),
    entities: [...new Set(entities)],
    keywords,
    credibility_tier: credTier,
  };
});

// ── Company dataset (80 companies) ────────────────────────────────────────────

const COMPANIES = Array.from({ length: 80 }, (_, i) => {
  const baseScore = 30 + sr(i * 31 + 1) * 50;
  const history = Array.from({ length: 24 }, (_, m) => {
    const raw = baseScore + (sr(i * 7 + m + 2) - 0.5) * 20;
    return Math.max(10, Math.min(90, raw));
  });
  let ewma = history[0];
  const ewmaHistory = history.map(v => {
    ewma = 0.15 * v + 0.85 * ewma;
    return parseFloat(ewma.toFixed(2));
  });
  const smf = parseFloat(((sr(i * 41 + 4) - 0.5) * 2).toFixed(3));
  const srs = parseFloat(((sr(i * 43 + 5) - 0.5) * 2).toFixed(3));
  const cp = parseFloat((sr(i * 47 + 6) * 1.5).toFixed(3));
  return {
    id: i + 1,
    name: COMPANY_NAMES[i],
    sector: SECTORS[i % SECTORS.length],
    sentimentScore: parseFloat(baseScore.toFixed(1)),
    sentimentHistory: history.map((v, m) => ({ month: m + 1, raw: parseFloat(v.toFixed(1)), ewma: ewmaHistory[m] })),
    controversyScore: parseFloat((sr(i * 37 + 3) * 10).toFixed(1)),
    controversyType: CONTROVERSY_TYPES[Math.floor(sr(i * 71 + 11) * CONTROVERSY_TYPES.length)],
    smf, srs, cp,
    fwdReturn1d: parseFloat(((sr(i * 53 + 7) - 0.48) * 4).toFixed(2)),
    fwdReturn5d: parseFloat(((sr(i * 59 + 8) - 0.48) * 8).toFixed(2)),
    fwdReturn21d: parseFloat(((sr(i * 61 + 9) - 0.48) * 15).toFixed(2)),
    fwdReturn63d: parseFloat(((sr(i * 67 + 10) - 0.48) * 25).toFixed(2)),
  };
});

// ── Entity disambiguation (50 records) ───────────────────────────────────────

const SEED_DISAMBIG = [
  { raw: 'Shell', resolved: 'Shell plc (Netherlands)', conf: 0.82, alts: [{ name: 'Shell Nigeria', conf: 0.71 }, { name: 'Shell Midstream', conf: 0.55 }], method: 'Wikidata' },
  { raw: 'Amazon', resolved: 'Amazon.com Inc', conf: 0.91, alts: [{ name: 'Amazon River Basin', conf: 0.44 }, { name: 'Amazon India', conf: 0.38 }], method: 'Ticker Match' },
  { raw: 'Mercury', resolved: 'Mercury NZ Limited', conf: 0.77, alts: [{ name: 'Mercury Systems', conf: 0.66 }, { name: 'Mercury General Corp', conf: 0.59 }], method: 'Context Window' },
  { raw: 'Phoenix', resolved: 'Phoenix Group Holdings', conf: 0.74, alts: [{ name: 'Phoenix Suns (NBA)', conf: 0.22 }, { name: 'City of Phoenix', conf: 0.18 }], method: 'Country Reference' },
  { raw: 'Pioneer', resolved: 'Pioneer Natural Resources', conf: 0.88, alts: [{ name: 'Pioneer Corporation Japan', conf: 0.49 }, { name: 'Pioneer Electronics', conf: 0.41 }], method: 'Ticker Match' },
  { raw: 'Orion', resolved: 'Orion Energy Systems', conf: 0.71, alts: [{ name: 'Orion Health NZ', conf: 0.60 }, { name: 'Orion SA Belgium', conf: 0.52 }], method: 'Wikidata' },
  { raw: 'Atlas', resolved: 'Atlas Copco AB', conf: 0.85, alts: [{ name: 'Atlas Air Worldwide', conf: 0.57 }, { name: 'Atlas Financial', conf: 0.43 }], method: 'Context Window' },
  { raw: 'Vanguard', resolved: 'Vanguard Group (Asset Mgr)', conf: 0.93, alts: [{ name: 'Vanguard Health', conf: 0.31 }], method: 'Wikidata' },
  { raw: 'Pacific Gas', resolved: 'Pacific Gas & Electric (PG&E)', conf: 0.96, alts: [{ name: 'Pacific Gas Transmission', conf: 0.48 }], method: 'Ticker Match' },
  { raw: 'Summit', resolved: 'Summit Materials', conf: 0.72, alts: [{ name: 'Summit Utilities', conf: 0.61 }, { name: 'Summit Healthcare', conf: 0.44 }], method: 'Country Reference' },
];
const AMBIG_NAMES = ['Horizon','Apex','Beacon','Zenith','Eclipse','Nova','Sentinel','Meridian','Spectrum','Catalyst','Nexus','Vertex','Pinnacle','Sterling','Clarity','Delta','Sigma','Omega','Vector','Matrix'];
const GENERATED_DISAMBIG = Array.from({ length: 40 }, (_, i) => {
  const conf = 0.70 + sr(i * 13 + 1) * 0.29;
  const alt1conf = Math.max(0.3, conf - 0.10 - sr(i * 7 + 2) * 0.15);
  const alt2conf = Math.max(0.2, conf - 0.20 - sr(i * 7 + 3) * 0.20);
  const raw = AMBIG_NAMES[i % AMBIG_NAMES.length] + (i > 19 ? ` ${i}` : '');
  return {
    raw,
    resolved: `${AMBIG_NAMES[i % AMBIG_NAMES.length]} ${SECTORS[(i * 3) % SECTORS.length]} Corp`,
    conf: parseFloat(conf.toFixed(2)),
    alts: [
      { name: `${AMBIG_NAMES[i % AMBIG_NAMES.length]} Holdings`, conf: parseFloat(alt1conf.toFixed(2)) },
      { name: `${AMBIG_NAMES[(i + 1) % AMBIG_NAMES.length]} International`, conf: parseFloat(alt2conf.toFixed(2)) },
    ],
    method: DISAMBIG_METHODS[i % DISAMBIG_METHODS.length],
  };
});
const ENTITIES_DISAMBIG = [...SEED_DISAMBIG, ...GENERATED_DISAMBIG];

// ── Source metadata (12 sources) ─────────────────────────────────────────────

const SOURCE_META = SOURCES_LIST.map((name, i) => {
  const tier = i < 3 ? 1 : i < 6 ? 2 : i < 9 ? 3 : i < 11 ? 4 : 5;
  const articles = Math.round(100 + sr(i * 17 + 1) * 4900);
  const avgSentiment = parseFloat((40 + sr(i * 19 + 2) * 30).toFixed(1));
  const biasScore = parseFloat(((sr(i * 23 + 3) - 0.5) * 100).toFixed(1));
  const avgConf = parseFloat((0.60 + sr(i * 29 + 4) * 0.35).toFixed(2));
  const credWeight = [1.0, 0.85, 0.70, 0.55, 0.40][tier - 1];
  const enPct = Math.round(40 + sr(i * 31 + 5) * 40);
  const frPct = Math.round(5 + sr(i * 31 + 6) * 20);
  const dePct = Math.round(5 + sr(i * 31 + 7) * 15);
  const esPct = Math.round(3 + sr(i * 31 + 8) * 12);
  const jpPct = Math.max(0, 100 - enPct - frPct - dePct - esPct);
  return { name, tier, articles_tracked: articles, avg_sentiment: avgSentiment, bias_score: biasScore, avg_confidence: avgConf, credibility_weight: credWeight, lang: { EN: enPct, FR: frPct, DE: dePct, ES: esPct, JP: jpPct } };
});

// ── NLP model benchmarks (6 models) ──────────────────────────────────────────

const NLP_MODELS = [
  { name: 'FinBERT', ref: 'arXiv:1908.10063', domain: 'Finance', classes: 3, f1_e: 0.87, f1_s: 0.84, f1_g: 0.86, f1_avg: 0.87, precision: 0.88, recall: 0.86, latency_ms: 180, cost_per_k: 0.80, open_source: true, training_docs: '4,500,000', use_case: 'Earnings calls, press releases' },
  { name: 'ClimateRoBERTa', ref: 'climatebert/distilroberta-base-climate-sentiment', domain: 'Climate/ESG', classes: 3, f1_e: 0.89, f1_s: 0.77, f1_g: 0.79, f1_avg: 0.82, precision: 0.83, recall: 0.81, latency_ms: 120, cost_per_k: 0.60, open_source: true, training_docs: '2,100,000', use_case: 'Climate disclosures, TCFD filings' },
  { name: 'ESG-BERT', ref: 'nbroad/ESG-BERT', domain: 'ESG Multi-pillar', classes: 3, f1_e: 0.81, f1_s: 0.78, f1_g: 0.77, f1_avg: 0.79, precision: 0.80, recall: 0.78, latency_ms: 160, cost_per_k: 0.70, open_source: true, training_docs: '1,800,000', use_case: 'ESG reports, CSRD filings' },
  { name: 'VADER + ESG Lexicon', ref: 'Rule-based + Finance Terms', domain: 'General + ESG', classes: 3, f1_e: 0.69, f1_s: 0.73, f1_g: 0.71, f1_avg: 0.71, precision: 0.72, recall: 0.70, latency_ms: 8, cost_per_k: 0.01, open_source: true, training_docs: 'N/A (lexicon)', use_case: 'High-volume, low-latency screening' },
  { name: 'TextBlob', ref: 'General Purpose NLP', domain: 'General', classes: 2, f1_e: 0.61, f1_s: 0.66, f1_g: 0.64, f1_avg: 0.64, precision: 0.65, recall: 0.63, latency_ms: 3, cost_per_k: 0.001, open_source: true, training_docs: 'N/A (lexicon)', use_case: 'Baseline benchmark only' },
  { name: 'GPT-4o Zero-shot', ref: 'OpenAI GPT-4o (API)', domain: 'Universal', classes: 3, f1_e: 0.91, f1_s: 0.88, f1_g: 0.88, f1_avg: 0.89, precision: 0.90, recall: 0.88, latency_ms: 1200, cost_per_k: 10.00, open_source: false, training_docs: 'Proprietary', use_case: 'Complex filings, nuanced governance text' },
];

// ── Controversy data (40 companies × events) ─────────────────────────────────

const CONTROVERSY_DATA = Array.from({ length: 40 }, (_, i) => {
  const company = COMPANIES[i];
  const numEvents = 3 + Math.floor(sr(i * 7 + 1) * 6);
  const eventLabels = ['Filing submitted','Fine levied','NGO report published','Regulatory inquiry opened','Media investigation','Court ruling','Settlement reached','Class action filed'];
  const severities = ['Low','Medium','High','Critical'];
  const events = Array.from({ length: numEvents }, (_, j) => {
    const month = String(Math.max(1, Math.ceil(sr(i * 5 + j + 2) * 12))).padStart(2, '0');
    const day = String(Math.max(1, Math.ceil(sr(i * 5 + j + 3) * 27))).padStart(2, '0');
    return {
      date: `2024-${month}-${day}`,
      event: eventLabels[Math.floor(sr(i * 7 + j + 5) * eventLabels.length)],
      severity: severities[Math.floor(sr(i * 5 + j + 6) * 4)],
      sentimentDrop: parseFloat((1 + sr(i * 3 + j + 4) * 12).toFixed(1)),
    };
  });
  return { ...company, events, fadeHalfLife: Math.round(14 + sr(i * 11 + 7) * 60) };
});

const FADE_RATES = { 'Environmental Damage': 42, 'Labor Violation': 28, 'Greenwashing': 35, 'Regulatory Fine': 21, 'Board Misconduct': 56, 'Supply Chain': 24, 'Tax Avoidance': 18, 'Data Breach': 30 };

// ── Derived alpha / backtest data ─────────────────────────────────────────────

const BACKTEST_MONTHS = (() => {
  let cumLS = 100, cumBench = 100;
  return Array.from({ length: 12 }, (_, i) => {
    const lsReturn = parseFloat(((sr(i * 17 + 1) - 0.42) * 6).toFixed(2));
    const benchReturn = parseFloat(((sr(i * 17 + 2) - 0.47) * 4).toFixed(2));
    cumLS *= (1 + lsReturn / 100);
    cumBench *= (1 + benchReturn / 100);
    return { month: `M${i + 1}`, lsReturn, benchReturn, cumLS: parseFloat(cumLS.toFixed(2)), cumBench: parseFloat(cumBench.toFixed(2)) };
  });
})();

const IC_DECAY = [
  { horizon: '1D', smf: parseFloat((0.08 + sr(1) * 0.06).toFixed(3)), srs: parseFloat((0.05 + sr(2) * 0.04).toFixed(3)), cp: parseFloat((0.03 + sr(3) * 0.03).toFixed(3)) },
  { horizon: '5D', smf: parseFloat((0.11 + sr(4) * 0.07).toFixed(3)), srs: parseFloat((0.07 + sr(5) * 0.05).toFixed(3)), cp: parseFloat((0.05 + sr(6) * 0.04).toFixed(3)) },
  { horizon: '21D', smf: parseFloat((0.09 + sr(7) * 0.06).toFixed(3)), srs: parseFloat((0.06 + sr(8) * 0.05).toFixed(3)), cp: parseFloat((0.07 + sr(9) * 0.05).toFixed(3)) },
  { horizon: '63D', smf: parseFloat((0.06 + sr(10) * 0.05).toFixed(3)), srs: parseFloat((0.04 + sr(11) * 0.04).toFixed(3)), cp: parseFloat((0.09 + sr(12) * 0.06).toFixed(3)) },
];

// ── Calibration / uncertainty data ───────────────────────────────────────────

const CALIBRATION_BINS = Array.from({ length: 10 }, (_, i) => {
  const midConf = (i + 0.5) / 10;
  const actualAcc = Math.max(0, Math.min(1, midConf + (sr(i * 7 + 1) - 0.5) * 0.15));
  return { bin: `${i * 10}-${(i + 1) * 10}%`, confidence: parseFloat(midConf.toFixed(2)), accuracy: parseFloat(actualAcc.toFixed(3)), count: Math.round(20 + sr(i * 11 + 2) * 60) };
});

const ACF_DATA = Array.from({ length: 20 }, (_, i) => ({
  lag: i + 1,
  acf: parseFloat((Math.exp(-0.15 * (i + 1)) * (sr(i * 13 + 1) > 0.3 ? 1 : -1) * (0.3 + sr(i * 13 + 2) * 0.4)).toFixed(3)),
}));

const PILLAR_SEASONALITY = Array.from({ length: 24 }, (_, m) => {
  const month = (m % 12) + 1;
  return {
    month: `${2023 + Math.floor(m / 12)}-${String(month).padStart(2, '0')}`,
    E: parseFloat((55 + Math.sin((month / 12) * Math.PI * 2) * 8 + (sr(m * 7 + 1) - 0.5) * 5).toFixed(1)),
    S: parseFloat((50 + Math.cos((month / 12) * Math.PI * 2) * 6 + (sr(m * 7 + 2) - 0.5) * 5).toFixed(1)),
    G: parseFloat((48 + Math.sin((month / 12) * Math.PI * 2 + 1) * 4 + (sr(m * 7 + 3) - 0.5) * 5).toFixed(1)),
  };
});

const IMPULSE_RESPONSE = Array.from({ length: 12 }, (_, t) => ({
  week: t,
  response: parseFloat((Math.exp(-0.3 * t) * 100).toFixed(1)),
}));

const SECTOR_TRAJECTORIES = SECTORS.map((sec, si) => ({
  sector: sec,
  data: Array.from({ length: 24 }, (_, m) => ({
    month: `${2023 + Math.floor(m / 12)}-${String((m % 12) + 1).padStart(2, '0')}`,
    value: parseFloat((40 + sr(si * 7 + m + 1) * 30).toFixed(1)),
  })),
}));

// ── Shared UI ─────────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingBottom: 6, borderBottom: `2px solid ${T.indigo}` }}>
    {children}
  </div>
);

const Badge = ({ label, color }) => (
  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: color + '20', color, border: `1px solid ${color}40`, fontFamily: T.fontMono, flexShrink: 0 }}>
    {label}
  </span>
);

const SENT_COLOR = { Positive: T.green, Neutral: T.amber, Negative: T.red };
const PILLAR_COLOR = { E: T.sage, S: T.blue, G: T.purple };
const TIER_COLORS = [T.green, T.blue, T.amber, T.orange, T.red];

// ── Tab 1: Live Intelligence Feed ─────────────────────────────────────────────

function TabLiveFeed() {
  const [filterPillar, setFilterPillar] = useState('All');
  const [filterSentiment, setFilterSentiment] = useState('All');
  const [filterSource, setFilterSource] = useState('All');

  const filtered = useMemo(() => ARTICLES.filter(a =>
    (filterPillar === 'All' || a.pillar === filterPillar) &&
    (filterSentiment === 'All' || a.sentiment === filterSentiment) &&
    (filterSource === 'All' || a.source === filterSource)
  ), [filterPillar, filterSentiment, filterSource]);

  const avgConf = filtered.length ? (filtered.reduce((s, a) => s + a.confidence, 0) / filtered.length).toFixed(3) : '0.000';
  const highConf = filtered.filter(a => a.confidence > 0.85).length;
  const byPillar = { E: filtered.filter(a => a.pillar === 'E').length, S: filtered.filter(a => a.pillar === 'S').length, G: filtered.filter(a => a.pillar === 'G').length };
  const controversyFlags = filtered.filter(a => a.sentiment === 'Negative' && a.confidence > 0.80).length;

  const pillarPie = PILLARS.map(p => ({ name: p, value: byPillar[p] }));
  const sentDist = SENTIMENTS.map(s => ({ name: s, value: filtered.filter(a => a.sentiment === s).length }));

  const Sel = ({ v, cur, set }) => (
    <button onClick={() => set(v)} style={{ padding: '4px 10px', fontSize: 11, borderRadius: 4, border: `1px solid ${cur === v ? T.indigo : T.border}`, background: cur === v ? T.indigo + '15' : T.sub, color: cur === v ? T.indigo : T.textSec, cursor: 'pointer', fontFamily: T.fontMono, marginRight: 4 }}>{v}</button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Avg Confidence" value={avgConf} sub="Epistemic certainty" color={T.indigo} />
        <KpiCard label="High-Conf Articles" value={highConf} sub="Confidence > 0.85" color={T.green} />
        <KpiCard label="E / S / G Split" value={`${byPillar.E}/${byPillar.S}/${byPillar.G}`} sub="By ESG pillar" color={T.sage} />
        <KpiCard label="Controversy Flags" value={controversyFlags} sub="Negative + high-conf" color={T.red} />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>PILLAR:</span>
        {['All','E','S','G'].map(v => <Sel key={v} v={v} cur={filterPillar} set={setFilterPillar} />)}
        <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginLeft: 8 }}>SENTIMENT:</span>
        {['All',...SENTIMENTS].map(v => <Sel key={v} v={v} cur={filterSentiment} set={setFilterSentiment} />)}
        <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginLeft: 8 }}>SOURCE:</span>
        {['All',...SOURCES_LIST.slice(0,5)].map(v => <Sel key={v} v={v} cur={filterSource} set={setFilterSource} />)}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Pillar Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pillarPie} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {pillarPie.map((_, i) => <Cell key={i} fill={[T.sage, T.blue, T.purple][i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Sentiment Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={sentDist}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
              <Bar dataKey="value">{sentDist.map((d, i) => <Cell key={i} fill={[T.green, T.amber, T.red][i]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <SectionTitle>Article Intelligence Feed — {filtered.length} articles</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 460, overflowY: 'auto' }}>
        {filtered.map(a => (
          <div key={a.id} style={{ background: T.card, border: `1px solid ${T.borderL}`, borderRadius: 8, padding: '12px 16px', borderLeft: `4px solid ${SENT_COLOR[a.sentiment]}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.textPri, marginBottom: 4 }}>{a.headline}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                  <Badge label={a.pillar} color={PILLAR_COLOR[a.pillar]} />
                  <Badge label={a.sentiment} color={SENT_COLOR[a.sentiment]} />
                  <Badge label={a.source} color={T.navy} />
                  <Badge label={`Tier ${a.credibility_tier}`} color={T.gold} />
                  <span style={{ fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>{a.date}</span>
                </div>
                <div style={{ fontSize: 10, color: T.textSec }}>
                  Entities: {a.entities.join(' · ')} | Keywords: {a.keywords.join(', ')}
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 80 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: SENT_COLOR[a.sentiment] }}>{a.score}</div>
                <div style={{ fontSize: 10, color: T.textSec }}>score</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: a.confidence > 0.85 ? T.green : a.confidence > 0.70 ? T.amber : T.red }}>{(a.confidence * 100).toFixed(1)}%</div>
                <div style={{ fontSize: 10, color: T.textSec }}>confidence</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: T.textSec, fontFamily: T.fontMono, marginRight: 4 }}>FinBERT:</span>
              <div style={{ flex: 1, height: 8, borderRadius: 4, overflow: 'hidden', background: T.sub, display: 'flex' }}>
                <div style={{ width: `${a.finbert_pos * 100}%`, background: T.green }} />
                <div style={{ width: `${a.finbert_neu * 100}%`, background: T.amber }} />
                <div style={{ width: `${a.finbert_neg * 100}%`, background: T.red }} />
              </div>
              <span style={{ fontSize: 9, color: T.textSec, fontFamily: T.fontMono, marginLeft: 4 }}>
                P{(a.finbert_pos * 100).toFixed(0)}%/N{(a.finbert_neu * 100).toFixed(0)}%/Neg{(a.finbert_neg * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 2: Entity Disambiguation ──────────────────────────────────────────────

function TabEntityDisambig() {
  const [query, setQuery] = useState('');

  const methodCounts = DISAMBIG_METHODS.map(m => ({ name: m, value: ENTITIES_DISAMBIG.filter(e => e.method === m).length }));
  const mostAmbiguous = [...ENTITIES_DISAMBIG].sort((a, b) => a.conf - b.conf).slice(0, 20);

  const confBars = [0.70, 0.75, 0.80, 0.85, 0.90, 0.95].map(t => ({
    threshold: `>${Math.round(t * 100)}%`,
    count: ENTITIES_DISAMBIG.filter(e => e.conf >= t).length,
  }));

  const simResult = useMemo(() => {
    if (!query || query.length < 2) return null;
    const seed = query.length * 7 + query.charCodeAt(0);
    const matchIdx = Math.floor(sr(seed + 1) * COMPANY_NAMES.length);
    const alt1Idx = Math.floor(sr(seed + 2) * COMPANY_NAMES.length);
    const alt2Idx = Math.floor(sr(seed + 3) * COMPANY_NAMES.length);
    const conf = 0.65 + sr(seed + 4) * 0.32;
    return {
      resolved: COMPANY_NAMES[matchIdx],
      conf: conf.toFixed(3),
      method: DISAMBIG_METHODS[Math.floor(sr(seed + 5) * 4)],
      alts: [
        { name: COMPANY_NAMES[alt1Idx], conf: Math.max(0.3, conf - 0.15).toFixed(3) },
        { name: COMPANY_NAMES[alt2Idx], conf: Math.max(0.2, conf - 0.28).toFixed(3) },
      ],
    };
  }, [query]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Total Entities" value={ENTITIES_DISAMBIG.length} sub="Tracked for disambiguation" color={T.indigo} />
        <KpiCard label="Avg Resolve Conf" value={(ENTITIES_DISAMBIG.reduce((s, e) => s + e.conf, 0) / ENTITIES_DISAMBIG.length).toFixed(3)} sub="Wikidata-anchored" color={T.green} />
        <KpiCard label="Wikidata Resolved" value={ENTITIES_DISAMBIG.filter(e => e.method === 'Wikidata').length} sub="Primary method" color={T.blue} />
        <KpiCard label="Low Confidence" value={ENTITIES_DISAMBIG.filter(e => e.conf < 0.75).length} sub="Conf < 0.75 — manual review" color={T.red} />
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Disambiguation Method Mix</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={methodCounts} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {methodCounts.map((_, i) => <Cell key={i} fill={[T.indigo, T.blue, T.sage, T.amber][i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Entity Count by Confidence Threshold</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={confBars}>
              <XAxis dataKey="threshold" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
              <Bar dataKey="count" fill={T.indigo} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>What-If: Simulate Entity Resolution</SectionTitle>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Type a company name to simulate resolution (e.g. Mercury, Atlas, Shell)..." style={{ flex: 1, padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, fontFamily: T.fontMono, background: T.sub }} />
        </div>
        {simResult && (
          <div style={{ background: T.sub, borderRadius: 8, padding: 14 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Resolution Result for "{query}"</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div><span style={{ color: T.textSec, fontSize: 11 }}>Resolved: </span><span style={{ fontWeight: 700, color: T.indigo }}>{simResult.resolved}</span></div>
              <div><span style={{ color: T.textSec, fontSize: 11 }}>Confidence: </span><span style={{ fontWeight: 700, color: T.green }}>{simResult.conf}</span></div>
              <div><span style={{ color: T.textSec, fontSize: 11 }}>Method: </span><Badge label={simResult.method} color={T.blue} /></div>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 11, color: T.textSec }}>Alternatives: </span>
              {simResult.alts.map((alt, i) => (
                <span key={i} style={{ fontSize: 11, marginRight: 14 }}>{alt.name} <span style={{ color: T.textSec }}>({alt.conf})</span></span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>20 Most Ambiguous Entities (Lowest Resolution Confidence)</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Raw Name','Resolved To','Confidence','Method','Top Alternative','Alt Conf'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, fontFamily: T.fontMono, fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mostAmbiguous.map((e, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                  <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy, fontFamily: T.fontMono }}>{e.raw}</td>
                  <td style={{ padding: '7px 10px', color: T.textPri }}>{e.resolved}</td>
                  <td style={{ padding: '7px 10px' }}><span style={{ color: e.conf < 0.75 ? T.red : e.conf < 0.85 ? T.amber : T.green, fontWeight: 700 }}>{e.conf.toFixed(2)}</span></td>
                  <td style={{ padding: '7px 10px' }}><Badge label={e.method} color={T.indigo} /></td>
                  <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{e.alts[0]?.name}</td>
                  <td style={{ padding: '7px 10px', fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>{e.alts[0]?.conf.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: Confidence & Uncertainty ──────────────────────────────────────────

function TabConfidenceUncertainty() {
  const [selectedSector, setSelectedSector] = useState(SECTORS[0]);

  const scatterByPillar = PILLARS.map(p => ({
    pillar: p,
    data: ARTICLES.filter(a => a.pillar === p).map(a => ({ score: a.score, confidence: a.confidence })),
  }));

  const sectorTrend = Array.from({ length: 12 }, (_, m) => {
    const base = 45 + sr(selectedSector.length * 7 + m + 1) * 25;
    const sigma = 5 + sr(selectedSector.length * 7 + m + 2) * 8;
    return { month: `M${m + 1}`, sentiment: parseFloat(base.toFixed(1)), upper: parseFloat((base + sigma).toFixed(1)), lower: parseFloat((base - sigma).toFixed(1)) };
  });

  const confHistogram = Array.from({ length: 10 }, (_, i) => {
    const lo = 0.55 + i * 0.044;
    const hi = lo + 0.044;
    return { bin: `${Math.round(lo * 100)}-${Math.round(hi * 100)}`, count: ARTICLES.filter(a => a.confidence >= lo && a.confidence < hi).length };
  });

  const articleTypeData = [
    { type: 'Long Filings', avgConf: 0.82, spread: 0.06 },
    { type: 'Short News', avgConf: 0.71, spread: 0.09 },
    { type: 'Social Media', avgConf: 0.59, spread: 0.14 },
    { type: 'Regulatory', avgConf: 0.88, spread: 0.04 },
    { type: 'NGO Reports', avgConf: 0.76, spread: 0.08 },
  ];

  const totalConf = ARTICLES.reduce((s, a) => s + a.confidence, 0);
  const avgConf = ARTICLES.length ? totalConf / ARTICLES.length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Avg Aleatoric Unc." value={(1 - avgConf).toFixed(3)} sub="Irreducible data noise" color={T.red} />
        <KpiCard label="Avg Epistemic Conf." value={avgConf.toFixed(3)} sub="Model-reducible uncertainty" color={T.indigo} />
        <KpiCard label="Low-Conf Zone" value={ARTICLES.filter(a => a.confidence < 0.65).length} sub="Articles — conf < 0.65" color={T.amber} />
        <KpiCard label="Calibration ECE" value="0.042" sub="Expected Calibration Error" color={T.green} />
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 2, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Sentiment Score vs Confidence — Colored by Pillar</SectionTitle>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>Red dashed line = Low-Confidence Zone threshold (conf &lt; 0.65). Epistemic uncertainty highest in this region.</div>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" dataKey="score" name="Score" domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: 'Sentiment Score', position: 'insideBottom', offset: -4, fontSize: 11 }} />
              <YAxis type="number" dataKey="confidence" name="Confidence" domain={[0.5, 1.0]} tick={{ fontSize: 10 }} label={{ value: 'Confidence', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <ReferenceLine y={0.65} stroke={T.red} strokeDasharray="5 5" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v) => parseFloat(v).toFixed(3)} />
              {scatterByPillar.map(({ pillar, data }) => (
                <Scatter key={pillar} name={`Pillar ${pillar}`} data={data} fill={PILLAR_COLOR[pillar]} opacity={0.75} />
              ))}
              <Legend />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Confidence Score Histogram</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={confHistogram}>
              <XAxis dataKey="bin" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={45} />
              <YAxis tick={{ fontSize: 10 }} /><Tooltip />
              <Bar dataKey="count" fill={T.indigo} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <SectionTitle>Bootstrap Confidence Intervals — Sector Sentiment Trend (±1σ)</SectionTitle>
          <select value={selectedSector} onChange={e => setSelectedSector(e.target.value)} style={{ fontSize: 11, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.fontMono, background: T.sub }}>
            {SECTORS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>Shaded band = ±1σ bootstrap interval derived from 1,000 resamples of sector articles.</div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={sectorTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis domain={[20, 80]} tick={{ fontSize: 10 }} /><Tooltip />
            <Area type="monotone" dataKey="upper" stroke="none" fill={T.indigo + '30'} />
            <Area type="monotone" dataKey="lower" stroke="none" fill={T.card} />
            <Line type="monotone" dataKey="sentiment" stroke={T.indigo} strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Calibration Reliability Diagram</SectionTitle>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>Perfect calibration: confidence bin = actual accuracy. Deviations indicate over/underconfidence.</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={CALIBRATION_BINS}>
              <XAxis dataKey="bin" tick={{ fontSize: 9 }} /><YAxis domain={[0, 1]} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => parseFloat(v).toFixed(3)} />
              <Bar dataKey="accuracy" fill={T.blue} name="Actual Accuracy" />
              <Bar dataKey="confidence" fill={T.indigo + '80'} name="Predicted Conf" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Model Uncertainty by Article Type</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {articleTypeData.map(at => (
              <div key={at.type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: T.textPri }}>{at.type}</span>
                  <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.textSec }}>CI ±{(at.spread * 100).toFixed(0)}%</span>
                </div>
                <div style={{ height: 12, background: T.sub, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: `${(at.avgConf - at.spread) * 100}%`, width: `${at.spread * 200}%`, height: '100%', background: T.indigo + '40' }} />
                  <div style={{ position: 'absolute', left: `${at.avgConf * 100 - 1}%`, width: 3, height: '100%', background: T.indigo, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>Avg confidence: {at.avgConf.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab 4: Controversy Intelligence ──────────────────────────────────────────

function TabControversy() {
  const [selectedCompany, setSelectedCompany] = useState(CONTROVERSY_DATA[0].name);
  const active = CONTROVERSY_DATA.find(c => c.name === selectedCompany) || CONTROVERSY_DATA[0];

  const top10 = [...CONTROVERSY_DATA].sort((a, b) => b.controversyScore - a.controversyScore).slice(0, 10);
  const fadeData = Object.entries(FADE_RATES).map(([type, hl]) => ({ type: type.substring(0, 14), halfLife: hl }));
  const heatmapData = CONTROVERSY_TYPES.map(ct => {
    const comps = CONTROVERSY_DATA.filter(c => c.controversyType === ct);
    const avgScore = comps.length ? comps.reduce((s, c) => s + c.controversyScore, 0) / comps.length : 0;
    return { type: ct, avgScore: parseFloat(avgScore.toFixed(1)), count: comps.length };
  });
  const totalEvents = CONTROVERSY_DATA.reduce((s, c) => s + c.events.length, 0);
  const avgScore = CONTROVERSY_DATA.reduce((s, c) => s + c.controversyScore, 0) / CONTROVERSY_DATA.length;

  const SEV_COLORS = { Low: T.textSec, Medium: T.amber, High: T.orange, Critical: T.red };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Companies Monitored" value={CONTROVERSY_DATA.length} sub="Active controversy watch" color={T.red} />
        <KpiCard label="Avg Controversy Score" value={avgScore.toFixed(1)} sub="0–10 severity scale" color={T.orange} />
        <KpiCard label="High Severity (≥7)" value={CONTROVERSY_DATA.filter(c => c.controversyScore >= 7).length} sub="Companies above threshold" color={T.red} />
        <KpiCard label="Total Events Tracked" value={totalEvents} sub="All controversy events" color={T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Top 10 Controversy Score Companies</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top10} layout="vertical">
              <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={100} />
              <Tooltip /><Bar dataKey="controversyScore" fill={T.red} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Controversy Fade Half-Life by Type (Days)</SectionTitle>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>Board Misconduct has the longest reputational persistence at 56 days.</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fadeData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="type" tick={{ fontSize: 9 }} width={110} />
              <Tooltip /><Bar dataKey="halfLife" fill={T.orange} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Controversy Severity Heatmap — by Controversy Type</SectionTitle>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
          {heatmapData.map(h => {
            const intensity = h.avgScore / 10;
            return (
              <div key={h.type} style={{ background: `rgba(220,38,38,${0.08 + intensity * 0.65})`, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', minWidth: 120, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: intensity > 0.55 ? '#fff' : T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>{h.type}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: intensity > 0.55 ? '#fff' : T.textPri }}>{h.avgScore}</div>
                <div style={{ fontSize: 10, color: intensity > 0.55 ? '#ffffffcc' : T.textSec }}>{h.count} cos</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <SectionTitle>Controversy Event Timeline</SectionTitle>
          <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} style={{ fontSize: 11, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.fontMono, background: T.sub }}>
            {CONTROVERSY_DATA.map(c => <option key={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <Badge label={`Score: ${active.controversyScore}/10`} color={T.red} />
          <Badge label={active.controversyType} color={T.orange} />
          <Badge label={`Half-life: ${active.fadeHalfLife}d`} color={T.amber} />
          <Badge label={`${active.events.length} events`} color={T.navy} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...active.events].sort((a, b) => a.date.localeCompare(b.date)).map((ev, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 12px', background: T.sub, borderRadius: 6, borderLeft: `3px solid ${SEV_COLORS[ev.severity]}` }}>
              <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.textSec, minWidth: 90 }}>{ev.date}</span>
              <span style={{ flex: 1, fontSize: 12, color: T.textPri }}>{ev.event}</span>
              <Badge label={ev.severity} color={SEV_COLORS[ev.severity]} />
              <span style={{ fontSize: 11, color: T.red, fontFamily: T.fontMono }}>-{ev.sentimentDrop.toFixed(1)} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab 5: Temporal Dynamics ──────────────────────────────────────────────────

function TabTemporalDynamics() {
  const [selectedSector, setSelectedSector] = useState(SECTORS[0]);
  const sectorData = SECTOR_TRAJECTORIES.find(s => s.sector === selectedSector);

  const regimeData = sectorData ? sectorData.data.map((d, i) => {
    const window = sectorData.data.slice(Math.max(0, i - 3), i + 1).map(x => x.value);
    const mean = window.reduce((s, v) => s + v, 0) / window.length;
    const std = Math.sqrt(window.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / window.length);
    let regime = 'Stable';
    if (d.value > mean + 5) regime = 'Bullish';
    else if (d.value < mean - 5) regime = 'Bearish';
    else if (std > 5) regime = 'Volatile';
    return { ...d, regime, rollingStd: parseFloat(std.toFixed(2)) };
  }) : [];

  const REGIME_COLORS = { Bullish: T.green, Bearish: T.red, Volatile: T.orange, Stable: T.blue };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Data Coverage" value="80×24M" sub="1,920 sentiment observations" color={T.indigo} />
        <KpiCard label="EWMA λ" value="0.15" sub="Exponential weight decay" color={T.navy} />
        <KpiCard label="Mean Reversion T½" value="4.2 wks" sub="Post-shock half-life (AR1 γ=0.70)" color={T.amber} />
        <KpiCard label="E Pillar Seasonal" value="±8 pts" sub="Peak: Q2 (AGM / reporting season)" color={T.sage} />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <SectionTitle>Sector Sentiment Trajectory (24 Months) — EWMA λ=0.15</SectionTitle>
          <select value={selectedSector} onChange={e => setSelectedSector(e.target.value)} style={{ fontSize: 11, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.fontMono, background: T.sub }}>
            {SECTORS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          {regimeData.map((d, i) => (
            <div key={i} style={{ flex: 1, height: 8, background: REGIME_COLORS[d.regime], borderRadius: 2 }} title={`${d.month}: ${d.regime}`} />
          ))}
        </div>
        <div style={{ fontSize: 10, color: T.textSec, marginBottom: 8 }}>
          Regime bar: {Object.entries(REGIME_COLORS).map(([k, v]) => <span key={k} style={{ marginRight: 10 }}><span style={{ color: v }}>■</span> {k}</span>)}
        </div>
        <ResponsiveContainer width="100%" height={190}>
          <AreaChart data={sectorData?.data || []}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="month" tick={{ fontSize: 9 }} interval={3} />
            <YAxis domain={[20, 80]} tick={{ fontSize: 10 }} /><Tooltip />
            <Area type="monotone" dataKey="value" stroke={T.indigo} fill={T.indigo + '25'} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Autocorrelation Function (ACF) — Top Company, Lags 1–20</SectionTitle>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>Dashed lines = 95% CI bounds (±1.96/√n). Bars outside bounds indicate significant autocorrelation.</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ACF_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="lag" tick={{ fontSize: 10 }} label={{ value: 'Lag', position: 'insideBottom', offset: -4, fontSize: 11 }} />
              <YAxis domain={[-1, 1]} tick={{ fontSize: 10 }} />
              <ReferenceLine y={0.22} stroke={T.red} strokeDasharray="4 4" />
              <ReferenceLine y={-0.22} stroke={T.red} strokeDasharray="4 4" />
              <Tooltip formatter={v => parseFloat(v).toFixed(3)} />
              <Bar dataKey="acf">{ACF_DATA.map((d, i) => <Cell key={i} fill={d.acf > 0 ? T.blue : T.red} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Impulse Response — Mean Reversion Curve</SectionTitle>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>% of initial sentiment shock remaining after t weeks. AR(1) coefficient γ=0.70.</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={IMPULSE_RESPONSE}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} label={{ value: 'Weeks post-shock', position: 'insideBottom', offset: -4, fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} /><Tooltip formatter={v => `${parseFloat(v).toFixed(1)}%`} />
              <Area type="monotone" dataKey="response" stroke={T.orange} fill={T.orange + '30'} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Pillar Seasonality — Monthly Average E / S / G (24 Months)</SectionTitle>
        <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>Environmental peaks Q2 (AGM/reporting season); Social peaks Q4 (workforce reporting); Governance near-flat throughout.</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={PILLAR_SEASONALITY}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="month" tick={{ fontSize: 9 }} interval={2} />
            <YAxis domain={[30, 70]} tick={{ fontSize: 10 }} /><Tooltip /><Legend />
            <Line type="monotone" dataKey="E" stroke={T.sage} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="S" stroke={T.blue} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="G" stroke={T.purple} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Tab 6: Source & Language Analysis ────────────────────────────────────────

function TabSourceLanguage() {
  const LANGS = ['EN', 'FR', 'DE', 'ES', 'JP'];
  const langColors = [T.indigo, T.blue, T.sage, T.amber, T.purple];

  const langPie = LANGS.map(lang => ({
    name: lang,
    value: Math.round(SOURCE_META.reduce((s, src) => s + src.lang[lang], 0) / SOURCE_META.length),
  }));

  const biasScatterData = SOURCE_META.map(s => ({ name: s.name, bias: s.bias_score, confidence: s.avg_confidence, tier: s.tier }));
  const volumeData = SOURCE_META.map(s => ({ name: s.name.substring(0, 10), articles: s.articles_tracked }));

  const multiLangData = COMPANY_NAMES.slice(0, 5).map((co, i) => ({
    company: co.split(' ')[0],
    EN: parseFloat((45 + sr(i * 7 + 1) * 30).toFixed(1)),
    FR: parseFloat((40 + sr(i * 7 + 2) * 35).toFixed(1)),
    DE: parseFloat((42 + sr(i * 7 + 3) * 28).toFixed(1)),
  }));

  const avgBias = SOURCE_META.reduce((s, src) => s + src.bias_score, 0) / SOURCE_META.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Sources Tracked" value={SOURCE_META.length} sub="Tier 1–5 coverage" color={T.navy} />
        <KpiCard label="Avg Source Bias" value={avgBias.toFixed(1)} sub="-50 bearish → +50 bullish" color={T.amber} />
        <KpiCard label="Tier 1 Sources" value={SOURCE_META.filter(s => s.tier === 1).length} sub="Highest credibility weight" color={T.green} />
        <KpiCard label="Avg Cred Weight" value={(SOURCE_META.reduce((s, src) => s + src.credibility_weight, 0) / SOURCE_META.length).toFixed(2)} sub="Weighted sentiment pool" color={T.indigo} />
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 2, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Source Bias vs Credibility Confidence Scatter</SectionTitle>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>Color = credibility tier (green=T1, red=T5). X=0 is unbiased.</div>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" dataKey="bias" name="Bias Score" domain={[-55, 55]} tick={{ fontSize: 10 }} label={{ value: 'Bias Score', position: 'insideBottom', offset: -4, fontSize: 11 }} />
              <YAxis type="number" dataKey="confidence" name="Confidence" domain={[0.55, 1.0]} tick={{ fontSize: 10 }} />
              <ReferenceLine x={0} stroke={T.textSec} strokeDasharray="3 3" />
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 11 }}>
                  <div style={{ fontWeight: 700 }}>{payload[0]?.payload?.name}</div>
                  <div>Bias: {payload[0]?.payload?.bias?.toFixed(1)}</div>
                  <div>Conf: {payload[0]?.payload?.confidence?.toFixed(2)}</div>
                  <div>Tier: {payload[0]?.payload?.tier}</div>
                </div>
              ) : null} />
              {[1,2,3,4,5].map(tier => (
                <Scatter key={tier} name={`Tier ${tier}`} data={biasScatterData.filter(d => d.tier === tier)} fill={TIER_COLORS[tier - 1]} />
              ))}
              <Legend />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Language Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={langPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                {langPie.map((_, i) => <Cell key={i} fill={langColors[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Source Article Volume</SectionTitle>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={volumeData}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
            <Bar dataKey="articles" fill={T.indigo} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Multi-Language Sentiment Divergence (EN vs FR vs DE)</SectionTitle>
        <div style={{ fontSize: 11, color: T.textSec, marginBottom: 10 }}>Divergence reflects market-specific framing bias: EU-press typically more bearish on governance; EN-press more bullish on E pillar.</div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={multiLangData}>
            <XAxis dataKey="company" tick={{ fontSize: 11 }} /><YAxis domain={[30, 80]} tick={{ fontSize: 10 }} /><Tooltip /><Legend />
            <Bar dataKey="EN" fill={T.indigo} /><Bar dataKey="FR" fill={T.blue} /><Bar dataKey="DE" fill={T.sage} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Source Metadata Table</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Source','Tier','Articles','Avg Sent','Bias','Avg Conf','Cred Wt','EN%','FR%','DE%'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, fontFamily: T.fontMono, fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SOURCE_META.map((s, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600, color: T.navy }}>{s.name}</td>
                  <td style={{ padding: '6px 10px' }}><Badge label={`T${s.tier}`} color={TIER_COLORS[s.tier - 1]} /></td>
                  <td style={{ padding: '6px 10px', fontFamily: T.fontMono }}>{s.articles_tracked.toLocaleString()}</td>
                  <td style={{ padding: '6px 10px', color: s.avg_sentiment > 60 ? T.green : s.avg_sentiment > 45 ? T.amber : T.red }}>{s.avg_sentiment.toFixed(1)}</td>
                  <td style={{ padding: '6px 10px', color: s.bias_score > 10 ? T.green : s.bias_score < -10 ? T.red : T.textSec }}>{s.bias_score > 0 ? '+' : ''}{s.bias_score.toFixed(1)}</td>
                  <td style={{ padding: '6px 10px', fontFamily: T.fontMono }}>{s.avg_confidence.toFixed(2)}</td>
                  <td style={{ padding: '6px 10px', fontFamily: T.fontMono }}>{s.credibility_weight.toFixed(2)}</td>
                  <td style={{ padding: '6px 10px' }}>{s.lang.EN}%</td>
                  <td style={{ padding: '6px 10px' }}>{s.lang.FR}%</td>
                  <td style={{ padding: '6px 10px' }}>{s.lang.DE}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab 7: Alpha Generation ───────────────────────────────────────────────────

function TabAlphaGeneration() {
  const [smfW, setSmfW] = useState(0.5);
  const [srsW, setSrsW] = useState(0.3);
  const [cpW, setCpW] = useState(0.2);

  const sortedCombined = useMemo(() => {
    return [...COMPANIES].sort((a, b) => (b.smf * smfW + b.srs * srsW + b.cp * cpW) - (a.smf * smfW + a.srs * srsW + a.cp * cpW));
  }, [smfW, srsW, cpW]);

  const longPort = sortedCombined.slice(0, 20);
  const shortPort = sortedCombined.slice(60, 80);
  const longRet = longPort.length ? longPort.reduce((s, c) => s + c.fwdReturn21d, 0) / longPort.length : 0;
  const shortRet = shortPort.length ? shortPort.reduce((s, c) => s + c.fwdReturn21d, 0) / shortPort.length : 0;
  const lsRet = parseFloat((longRet - shortRet).toFixed(2));
  const combinedSharpe = parseFloat((lsRet / 8.5 * Math.sqrt(252)).toFixed(2));

  const factorExposureData = COMPANIES.slice(0, 20).map(c => ({ name: c.name.split(' ')[0], smf: c.smf, srs: c.srs, cp: c.cp }));
  const smfSharp = parseFloat((0.52 + sr(1) * 0.3).toFixed(2));
  const srsSharp = parseFloat((0.38 + sr(2) * 0.25).toFixed(2));
  const cpSharp = parseFloat((0.29 + sr(3) * 0.2).toFixed(2));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="SMF Sharpe" value={smfSharp.toFixed(2)} sub="Sentiment Momentum Factor" color={T.indigo} />
        <KpiCard label="SRS Sharpe" value={srsSharp.toFixed(2)} sub="Sentiment Reversal Signal" color={T.blue} />
        <KpiCard label="CP Sharpe" value={cpSharp.toFixed(2)} sub="Controversy Premium" color={T.orange} />
        <KpiCard label="Combined L/S Sharpe" value={combinedSharpe.toFixed(2)} sub="Custom factor weights" color={T.green} />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Factor Combination Optimizer</SectionTitle>
        <div style={{ fontSize: 11, color: T.textSec, marginBottom: 14 }}>Adjust factor weights to observe combined portfolio Sharpe ratio. SMF: sentiment momentum, SRS: reversal, CP: controversy premium.</div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
          {[['SMF Weight', smfW, setSmfW, T.indigo],['SRS Weight', srsW, setSrsW, T.blue],['CP Weight', cpW, setCpW, T.orange]].map(([label, val, setter, color]) => (
            <div key={label} style={{ flex: 1, minWidth: 160 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: T.textPri, fontFamily: T.fontMono }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: T.fontMono }}>{parseFloat(val).toFixed(1)}</span>
              </div>
              <input type="range" min={0} max={1} step={0.1} value={val} onChange={e => setter(parseFloat(e.target.value))} style={{ width: '100%', accentColor: color }} />
            </div>
          ))}
        </div>
        <div style={{ background: T.sub, borderRadius: 8, padding: 14, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div><span style={{ fontSize: 11, color: T.textSec }}>L/S Return (21d): </span><span style={{ fontSize: 16, fontWeight: 700, color: lsRet > 0 ? T.green : T.red }}>{lsRet > 0 ? '+' : ''}{lsRet}%</span></div>
          <div><span style={{ fontSize: 11, color: T.textSec }}>Combined Sharpe: </span><span style={{ fontSize: 16, fontWeight: 700, color: T.indigo }}>{combinedSharpe}</span></div>
          <div><span style={{ fontSize: 11, color: T.textSec }}>Long avg 21d: </span><span style={{ fontWeight: 700, color: T.green }}>{longRet.toFixed(2)}%</span></div>
          <div><span style={{ fontSize: 11, color: T.textSec }}>Short avg 21d: </span><span style={{ fontWeight: 700, color: T.red }}>{shortRet.toFixed(2)}%</span></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Simulated L/S Factor Portfolio vs Benchmark (12M)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={BACKTEST_MONTHS}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => parseFloat(v).toFixed(2)} /><Legend />
              <Line type="monotone" dataKey="cumLS" stroke={T.indigo} strokeWidth={2} name="L/S Portfolio" dot={false} />
              <Line type="monotone" dataKey="cumBench" stroke={T.textSec} strokeWidth={1.5} name="Benchmark" dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>IC Decay — Information Coefficient by Forward Horizon</SectionTitle>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>IC = rank correlation of factor signal vs forward returns. SMF decays faster than CP at longer horizons.</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={IC_DECAY}>
              <XAxis dataKey="horizon" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => parseFloat(v).toFixed(3)} /><Legend />
              <Bar dataKey="smf" fill={T.indigo} name="SMF" />
              <Bar dataKey="srs" fill={T.blue} name="SRS" />
              <Bar dataKey="cp" fill={T.orange} name="CP" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Factor Exposure — Top 20 Companies (by SMF)</SectionTitle>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={factorExposureData}>
            <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={v => parseFloat(v).toFixed(3)} /><Legend />
            <Bar dataKey="smf" fill={T.indigo} name="SMF" />
            <Bar dataKey="srs" fill={T.blue} name="SRS" />
            <Bar dataKey="cp" fill={T.orange} name="CP" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Long / Short Portfolio Top 10 Each Side</SectionTitle>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.green, marginBottom: 8, fontFamily: T.fontMono }}>LONG — Highest Combined Score</div>
            {longPort.slice(0, 10).map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 11 }}>
                <span style={{ color: T.textPri }}>{c.name}</span>
                <span style={{ fontFamily: T.fontMono, color: T.green }}>SMF {c.smf.toFixed(3)}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.red, marginBottom: 8, fontFamily: T.fontMono }}>SHORT — Lowest Combined Score</div>
            {shortPort.slice(0, 10).map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 11 }}>
                <span style={{ color: T.textPri }}>{c.name}</span>
                <span style={{ fontFamily: T.fontMono, color: T.red }}>SMF {c.smf.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab 8: NLP Model Benchmarking ─────────────────────────────────────────────

function TabNLPBenchmarking() {
  const f1ByModel = NLP_MODELS.map(m => ({ name: m.name.split(' ')[0], E: m.f1_e, S: m.f1_s, G: m.f1_g, avg: m.f1_avg }));
  const latencyAccData = NLP_MODELS.map(m => ({ name: m.name.split(' ')[0], latency: m.latency_ms, f1: m.f1_avg, cost: m.cost_per_k, open: m.open_source }));

  const CODE_SNIPPET = `# HuggingFace Free Inference API — ESG Sentiment (30k req/month free)
import requests

# FinBERT — Finance-tuned 3-class sentiment (arXiv:1908.10063)
FINBERT = "https://api-inference.huggingface.co/models/ProsusAI/finbert"

# ClimateRoBERTa — Climate-domain sentiment
CLIMATE_ROBERTA = "https://api-inference.huggingface.co/models/climatebert/distilroberta-base-climate-sentiment"

# ESG-BERT — E/S/G category classification
ESG_BERT = "https://api-inference.huggingface.co/models/nbroad/ESG-BERT"

HEADERS = {"Authorization": "Bearer hf_YOUR_FREE_TOKEN"}

def analyze(model_url, text):
    r = requests.post(model_url, headers=HEADERS, json={"inputs": text})
    results = r.json()[0]
    # Returns: [{"label": "positive|neutral|negative", "score": float}]
    return max(results, key=lambda x: x["score"])

# Example: analyze a TCFD disclosure paragraph
result = analyze(CLIMATE_ROBERTA, "The company has committed to net-zero by 2040...")
print(result)  # {"label": "positive", "score": 0.91}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Models Compared" value={NLP_MODELS.length} sub="Across E / S / G pillars" color={T.indigo} />
        <KpiCard label="Best F1 (avg)" value="0.89" sub="GPT-4o Zero-shot" color={T.green} />
        <KpiCard label="Best Open-Source F1" value="0.87" sub="FinBERT (arXiv:1908.10063)" color={T.blue} />
        <KpiCard label="Min Latency" value="3ms" sub="TextBlob (baseline only)" color={T.amber} />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>F1 Score by Model and ESG Pillar</SectionTitle>
        <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>ClimateRoBERTa leads on E-pillar (0.89); GPT-4o leads overall (0.89 avg). Open-source models highlighted.</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={f1ByModel}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis domain={[0.5, 1.0]} tick={{ fontSize: 10 }} />
            <Tooltip formatter={v => parseFloat(v).toFixed(3)} /><Legend />
            <Bar dataKey="E" fill={T.sage} name="E Pillar" />
            <Bar dataKey="S" fill={T.blue} name="S Pillar" />
            <Bar dataKey="G" fill={T.purple} name="G Pillar" />
            <Bar dataKey="avg" fill={T.indigo} name="Avg F1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Latency vs F1 Accuracy — Open-Source vs Proprietary</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" dataKey="latency" name="Latency (ms)" tick={{ fontSize: 10 }} label={{ value: 'Latency (ms)', position: 'insideBottom', offset: -4, fontSize: 11 }} />
              <YAxis type="number" dataKey="f1" name="F1 Score" domain={[0.55, 0.95]} tick={{ fontSize: 10 }} />
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 11 }}>
                  <div style={{ fontWeight: 700 }}>{payload[0]?.payload?.name}</div>
                  <div>F1: {payload[0]?.payload?.f1?.toFixed(3)}</div>
                  <div>Latency: {payload[0]?.payload?.latency}ms</div>
                  <div>Cost/1k: ${payload[0]?.payload?.cost}</div>
                </div>
              ) : null} />
              <Scatter data={latencyAccData.filter(d => d.open)} fill={T.indigo} name="Open-Source" />
              <Scatter data={latencyAccData.filter(d => !d.open)} fill={T.red} name="Proprietary" />
              <Legend />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Cost per 1,000 Documents</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {[...NLP_MODELS].sort((a, b) => a.cost_per_k - b.cost_per_k).map(m => (
              <div key={m.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: T.textPri }}>{m.name.split(' ').slice(0, 2).join(' ')}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {m.open_source && <Badge label="OSS" color={T.green} />}
                    <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.navy }}>${m.cost_per_k.toFixed(3)}</span>
                  </div>
                </div>
                <div style={{ height: 8, background: T.sub, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (m.cost_per_k / 10) * 100)}%`, background: m.open_source ? T.indigo : T.red, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Full Model Comparison Table</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Model','Reference','Domain','Cls','F1-E','F1-S','F1-G','F1-Avg','Prec','Recall','Lat(ms)','$/1k','OSS','Training Docs','Use Case'].map(h => (
                  <th key={h} style={{ padding: '7px 8px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, fontFamily: T.fontMono, fontSize: 9, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NLP_MODELS.map((m, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: T.navy, whiteSpace: 'nowrap' }}>{m.name}</td>
                  <td style={{ padding: '6px 8px', color: T.blue, fontSize: 9, fontFamily: T.fontMono, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.ref}</td>
                  <td style={{ padding: '6px 8px', color: T.textSec, whiteSpace: 'nowrap' }}>{m.domain}</td>
                  <td style={{ padding: '6px 8px', fontFamily: T.fontMono, textAlign: 'center' }}>{m.classes}</td>
                  <td style={{ padding: '6px 8px', fontFamily: T.fontMono, color: m.f1_e >= 0.85 ? T.green : T.textPri }}>{m.f1_e.toFixed(2)}</td>
                  <td style={{ padding: '6px 8px', fontFamily: T.fontMono, color: m.f1_s >= 0.85 ? T.green : T.textPri }}>{m.f1_s.toFixed(2)}</td>
                  <td style={{ padding: '6px 8px', fontFamily: T.fontMono, color: m.f1_g >= 0.85 ? T.green : T.textPri }}>{m.f1_g.toFixed(2)}</td>
                  <td style={{ padding: '6px 8px', fontFamily: T.fontMono, fontWeight: 700, color: m.f1_avg >= 0.85 ? T.green : m.f1_avg >= 0.75 ? T.amber : T.red }}>{m.f1_avg.toFixed(2)}</td>
                  <td style={{ padding: '6px 8px', fontFamily: T.fontMono }}>{m.precision.toFixed(2)}</td>
                  <td style={{ padding: '6px 8px', fontFamily: T.fontMono }}>{m.recall.toFixed(2)}</td>
                  <td style={{ padding: '6px 8px', fontFamily: T.fontMono }}>{m.latency_ms}</td>
                  <td style={{ padding: '6px 8px', fontFamily: T.fontMono }}>${m.cost_per_k.toFixed(3)}</td>
                  <td style={{ padding: '6px 8px' }}>{m.open_source ? <Badge label="Yes" color={T.green} /> : <Badge label="No" color={T.red} />}</td>
                  <td style={{ padding: '6px 8px', fontSize: 9, fontFamily: T.fontMono }}>{m.training_docs}</td>
                  <td style={{ padding: '6px 8px', fontSize: 10, color: T.textSec }}>{m.use_case}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>HuggingFace Free Inference API — Integration Snippet</SectionTitle>
        <div style={{ fontSize: 11, color: T.textSec, marginBottom: 10 }}>
          Free tier: 30,000 requests/month. No GPU provisioning required. FinBERT, ClimateRoBERTa, and ESG-BERT all available at zero cost for prototyping.
        </div>
        <pre style={{ background: '#1e1e2e', color: '#cdd6f4', padding: 16, borderRadius: 8, fontSize: 11, fontFamily: T.fontMono, overflowX: 'auto', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
          {CODE_SNIPPET}
        </pre>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const TABS = [
  { key: 'feed', label: 'Live Intelligence Feed' },
  { key: 'entity', label: 'Entity Disambiguation' },
  { key: 'confidence', label: 'Confidence & Uncertainty' },
  { key: 'controversy', label: 'Controversy Intelligence' },
  { key: 'temporal', label: 'Temporal Dynamics' },
  { key: 'source', label: 'Source & Language' },
  { key: 'alpha', label: 'Alpha Generation' },
  { key: 'nlp', label: 'NLP Benchmarking' },
];

export default function AiSentimentPage() {
  const [activeTab, setActiveTab] = useState('feed');

  const renderTab = () => {
    switch (activeTab) {
      case 'feed': return <TabLiveFeed />;
      case 'entity': return <TabEntityDisambig />;
      case 'confidence': return <TabConfidenceUncertainty />;
      case 'controversy': return <TabControversy />;
      case 'temporal': return <TabTemporalDynamics />;
      case 'source': return <TabSourceLanguage />;
      case 'alpha': return <TabAlphaGeneration />;
      case 'nlp': return <TabNLPBenchmarking />;
      default: return <TabLiveFeed />;
    }
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.indigo}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 10, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>EP-H5 · AI Sentiment Intelligence</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', letterSpacing: -0.5 }}>AI Sentiment Intelligence</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>NLP-powered ESG engine · FinBERT / ClimateRoBERTa · Entity disambiguation · Alpha signals · Model benchmarking</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: T.gold, fontFamily: T.fontMono, marginBottom: 4 }}>COVERAGE</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>80 Articles · 80 Companies</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>12 Sources · 50 Entity Records · 6 NLP Models</div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '0 32px', display: 'flex', overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{ padding: '14px 18px', fontSize: 12, fontWeight: activeTab === tab.key ? 700 : 500, color: activeTab === tab.key ? T.indigo : T.textSec, background: 'transparent', border: 'none', borderBottom: activeTab === tab.key ? `3px solid ${T.indigo}` : '3px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.15s' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 32px' }}>
        {renderTab()}
      </div>

      {/* Footer */}
      <div style={{ background: T.card, borderTop: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>EP-H5 · AI Sentiment Intelligence · Seeded synthetic data — no external API calls</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {['FinBERT (arXiv:1908.10063)','ClimateRoBERTa (HF)','ESG-BERT (nbroad)','SFDR Art.8/9'].map(ref => (
            <span key={ref} style={{ fontSize: 9, color: T.textSec, fontFamily: T.fontMono }}>{ref}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
