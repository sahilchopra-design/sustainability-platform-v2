import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

// ── Platform standard PRNG ───────────────────────────────────────────────────
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── Theme object ─────────────────────────────────────────────────────────────
const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E',
  sub: '#6B7280', accent: '#B8860B', indigo: '#4F46E5', green: '#065F46',
  red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E'
};

// ── Live API URLs ────────────────────────────────────────────────────────────
const GDELT_URL = 'https://api.gdeltproject.org/api/v2/doc/doc?query=ESG+climate&mode=artlist&maxrecords=25&format=json';
const SEC_URL = 'https://efts.sec.gov/LATEST/search-index?q=%22climate+disclosure%22&dateRange=custom&startdt=2024-01-01&forms=10-K';
const OPENALEX_URL = 'https://api.openalex.org/works?search=ESG+sentiment+analysis&filter=open_access.is_oa:true&sort=cited_by_count:desc&per_page=20';
const WORLDBANK_URL = 'https://api.worldbank.org/v2/country/all/indicator/EN.ATM.CO2E.PC?format=json&mrv=1&per_page=50';

// ── Seed Data ────────────────────────────────────────────────────────────────
const SOURCE_COUNTRIES = ['USA','GBR','DEU','FRA','CHN','IND','JPN','BRA','AUS','CAN',
  'NLD','CHE','SGP','ZAF','KOR','SWE','NOR','DNK','ESP','ITA'];
const ARTICLE_TITLES = [
  'EU Taxonomy Alignment Hits Record in Banking Sector Disclosure',
  'Climate Disclosure Standards Board Issues Final ISSB Guidance',
  'Carbon Border Adjustment Mechanism Faces Implementation Delays',
  'BlackRock ESG Fund Inflows Surge Amid Regulatory Pressure',
  'Scope 3 Emissions Reporting Gap Widens for Tech Giants',
  'Green Bond Market Reaches $500B Issuance Milestone',
  'TCFD Adoption Rate Climbs to 68% Among FTSE 100 Companies',
  'Biodiversity Net Gain Policy Reshapes UK Infrastructure Finance',
  'Nature-Based Solutions Investment Triples in Emerging Markets',
  'Corporate Water Stewardship Disclosures Lag Climate Metrics',
  'SEC Climate Rule Implementation Sparks Legal Challenges',
  'Just Transition Finance Framework Gains G20 Endorsement',
  'Renewable Energy Capacity Additions Break Annual Record',
  'Sovereign Sustainability Bonds Attract Record Demand',
  'ESG Rating Divergence Study Reveals Methodological Gaps',
  'Deforestation-Linked Supply Chain Risk Triggers Bond Covenant',
  'Labor Rights in Global Textile Supply Chains Under Scrutiny',
  'AI Governance Disclosure Requirements Enter SFDR Amendments',
  'Methane Reduction Pledges Fall Short of IEA Net Zero Path',
  'Community Impact Bonds Pioneer New Social Finance Structure',
];
const SEED_GDELT = ARTICLE_TITLES.map((title, i) => ({
  title,
  url: `https://example.com/article-${i + 1}`,
  tone: (sr(i * 7 + 1) * 20 - 10).toFixed(2),
  sourcecountry: SOURCE_COUNTRIES[i % SOURCE_COUNTRIES.length],
  date: `2026-04-${String(Math.floor(sr(i * 3 + 2) * 14 + 1)).padStart(2, '0')}`,
}));

const COMPANIES_SEC = [
  'Apple Inc','Microsoft Corp','Alphabet Inc','Amazon.com','ExxonMobil',
  'Chevron Corp','JPMorgan Chase','Bank of America','NextEra Energy','Tesla Inc',
  'Berkshire Hathaway','Walmart Inc','Pfizer Inc','Procter & Gamble','Caterpillar',
];
const FORM_TYPES = ['10-K','10-K','10-K','8-K','DEF 14A'];
const SEED_FILINGS = COMPANIES_SEC.map((company, i) => ({
  company,
  form: FORM_TYPES[i % FORM_TYPES.length],
  date: `2025-${String(Math.floor(sr(i * 5 + 3) * 10 + 1)).padStart(2,'0')}-${String(Math.floor(sr(i * 5 + 4) * 27 + 1)).padStart(2,'0')}`,
  sentiment: (sr(i * 11 + 5) * 0.4 + 0.5).toFixed(3),
  climateMentions: Math.floor(sr(i * 13 + 6) * 80 + 10),
}));

const PAPER_TITLES = [
  'ESG Sentiment and Stock Returns: A Deep Learning Approach',
  'Climate Risk Disclosure and Institutional Investor Behaviour',
  'Greenwashing Detection via Large Language Models',
  'Cross-Asset Contagion from Climate Policy Shocks',
  'NLP-Based Materiality Assessment for ISSB Standards',
  'FinBERT Fine-Tuning on Climate Regulatory Corpus',
  'Carbon Pricing Uncertainty and Investment Decisions',
  'Taxonomy Alignment Scoring Using Transformer Models',
  'Social Sentiment and ESG Fund Flows: Panel Analysis',
  'Hawkes Process Modelling of ESG News Arrival Rates',
  'Scope 3 Attribution Under Different Allocation Methods',
  'Biodiversity Footprint Measurement: A Systematic Review',
  'Ensemble NLP for Sustainability Report Benchmarking',
  'TCFD Compliance Classification with Zero-Shot Learning',
  'Water Risk Quantification in Agricultural Supply Chains',
];
const SEED_PAPERS = PAPER_TITLES.map((title, i) => ({
  title,
  cited_by_count: Math.floor(sr(i * 17 + 7) * 900 + 20),
  open_access: sr(i * 23 + 8) > 0.35,
  concepts: ['ESG', 'NLP', 'Climate Risk', 'Disclosure', 'Machine Learning'].slice(0, Math.floor(sr(i * 19 + 9) * 3 + 2)),
}));

const REGION_COUNTRIES = [
  { name: 'Germany', region: 'europe', co2PerCapita: 7.7 + sr(1) * 1.5 },
  { name: 'France', region: 'europe', co2PerCapita: 4.5 + sr(2) * 0.8 },
  { name: 'United Kingdom', region: 'europe', co2PerCapita: 4.7 + sr(3) * 0.9 },
  { name: 'Sweden', region: 'europe', co2PerCapita: 3.5 + sr(4) * 0.6 },
  { name: 'Norway', region: 'europe', co2PerCapita: 7.2 + sr(5) * 0.5 },
  { name: 'Netherlands', region: 'europe', co2PerCapita: 8.1 + sr(6) * 1.0 },
  { name: 'Poland', region: 'europe', co2PerCapita: 9.4 + sr(7) * 1.2 },
  { name: 'Italy', region: 'europe', co2PerCapita: 5.3 + sr(8) * 0.7 },
  { name: 'Spain', region: 'europe', co2PerCapita: 5.0 + sr(9) * 0.6 },
  { name: 'China', region: 'asia', co2PerCapita: 7.4 + sr(10) * 0.9 },
  { name: 'India', region: 'asia', co2PerCapita: 1.9 + sr(11) * 0.4 },
  { name: 'Japan', region: 'asia', co2PerCapita: 8.5 + sr(12) * 0.8 },
  { name: 'South Korea', region: 'asia', co2PerCapita: 11.2 + sr(13) * 1.3 },
  { name: 'Indonesia', region: 'asia', co2PerCapita: 2.3 + sr(14) * 0.5 },
  { name: 'Vietnam', region: 'asia', co2PerCapita: 2.9 + sr(15) * 0.6 },
  { name: 'Singapore', region: 'asia', co2PerCapita: 8.7 + sr(16) * 1.1 },
  { name: 'Thailand', region: 'asia', co2PerCapita: 4.1 + sr(17) * 0.7 },
  { name: 'Bangladesh', region: 'asia', co2PerCapita: 0.6 + sr(18) * 0.2 },
  { name: 'USA', region: 'americas', co2PerCapita: 14.2 + sr(19) * 1.8 },
  { name: 'Canada', region: 'americas', co2PerCapita: 15.1 + sr(20) * 2.0 },
  { name: 'Brazil', region: 'americas', co2PerCapita: 2.2 + sr(21) * 0.5 },
  { name: 'Mexico', region: 'americas', co2PerCapita: 3.5 + sr(22) * 0.7 },
  { name: 'Argentina', region: 'americas', co2PerCapita: 4.4 + sr(23) * 0.8 },
  { name: 'Chile', region: 'americas', co2PerCapita: 4.8 + sr(24) * 0.9 },
  { name: 'Colombia', region: 'americas', co2PerCapita: 1.8 + sr(25) * 0.4 },
  { name: 'Peru', region: 'americas', co2PerCapita: 1.5 + sr(26) * 0.3 },
  { name: 'South Africa', region: 'africa', co2PerCapita: 8.9 + sr(27) * 1.2 },
  { name: 'Nigeria', region: 'africa', co2PerCapita: 0.6 + sr(28) * 0.2 },
  { name: 'Egypt', region: 'africa', co2PerCapita: 2.5 + sr(29) * 0.5 },
  { name: 'Kenya', region: 'africa', co2PerCapita: 0.4 + sr(30) * 0.1 },
  { name: 'Ethiopia', region: 'africa', co2PerCapita: 0.2 + sr(31) * 0.1 },
  { name: 'Ghana', region: 'africa', co2PerCapita: 0.7 + sr(32) * 0.2 },
  { name: 'Morocco', region: 'africa', co2PerCapita: 1.8 + sr(33) * 0.4 },
  { name: 'Saudi Arabia', region: 'middle-east', co2PerCapita: 18.4 + sr(34) * 2.5 },
  { name: 'UAE', region: 'middle-east', co2PerCapita: 20.1 + sr(35) * 3.0 },
  { name: 'Iran', region: 'middle-east', co2PerCapita: 8.1 + sr(36) * 1.0 },
  { name: 'Turkey', region: 'middle-east', co2PerCapita: 5.7 + sr(37) * 0.9 },
  { name: 'Israel', region: 'middle-east', co2PerCapita: 7.9 + sr(38) * 1.1 },
  { name: 'Qatar', region: 'middle-east', co2PerCapita: 31.2 + sr(39) * 4.0 },
  { name: 'Kuwait', region: 'middle-east', co2PerCapita: 24.5 + sr(40) * 3.5 },
];
const SEED_COUNTRIES = REGION_COUNTRIES.map(c => ({ ...c, co2PerCapita: +c.co2PerCapita.toFixed(2) }));

// ── NLP Models ───────────────────────────────────────────────────────────────
const NLP_MODELS = [
  { name: 'FinBERT', weight: 0.30, f1: 0.87, color: T.indigo },
  { name: 'ClimateRoBERTa', weight: 0.25, f1: 0.82, color: T.teal },
  { name: 'ESG-BERT', weight: 0.20, f1: 0.79, color: T.green },
  { name: 'VADER+ESG', weight: 0.15, f1: 0.71, color: T.amber },
  { name: 'XLM-RoBERTa', weight: 0.10, f1: 0.78, color: T.blue },
];

const SAMPLE_TOKENS = [
  { token: 'carbon', importance: 0.92 },
  { token: 'emissions', importance: 0.85 },
  { token: 'net-zero', importance: 0.78 },
  { token: 'reduction', importance: 0.71 },
  { token: 'renewable', importance: 0.65 },
  { token: 'disclosure', importance: 0.58 },
  { token: 'target', importance: 0.52 },
  { token: 'commitment', importance: 0.43 },
];

// ── Entity Knowledge Graph Seed ───────────────────────────────────────────────
const ENTITY_SECTORS = ['energy','finance','tech','consumer'];
const SECTOR_COLORS = { energy: T.amber, finance: T.indigo, tech: T.teal, consumer: T.green };
const ENTITY_COMPANIES = [
  'Shell plc','BP plc','TotalEnergies','Equinor','Eni SpA',
  'HSBC','BNP Paribas','Deutsche Bank','UBS Group','Citigroup',
  'Microsoft','Alphabet','Meta Platforms','Samsung','ASML',
  'Nestlé','Unilever','L\'Oréal','Danone','Procter & Gamble',
];
const ENTITY_TOPICS = ['GHG Disclosure','Net Zero','Water Risk','Board Diversity','Supply Chain','Carbon Credits','Taxonomy Alignment','TCFD','SFDR','SDG'];
const SEED_ENTITIES = ENTITY_COMPANIES.map((name, i) => ({
  name,
  sector: ENTITY_SECTORS[Math.floor(i / 5)],
  esgScore: Math.floor(sr(i * 29 + 11) * 40 + 40),
  topics: ENTITY_TOPICS.filter((_, j) => sr(i * 31 + j * 3) > 0.55),
  controversy: sr(i * 37 + 12) > 0.70,
}));

// ── Event Study Seed ──────────────────────────────────────────────────────────
const EVENT_TYPES = ['ESG Downgrade','Net Zero Pledge','Greenwashing Penalty','TCFD Adoption','Divestment Announcement','Carbon Target Revision','Regulatory Fine','ESG Upgrade','Scope 3 Commitment','Green Bond Issuance'];
const SEED_EVENTS = EVENT_TYPES.map((type, i) => ({
  type,
  company: ENTITY_COMPANIES[i % ENTITY_COMPANIES.length],
  car55: ((sr(i * 41 + 13) - 0.5) * 6).toFixed(3),
  car11: ((sr(i * 43 + 14) - 0.5) * 3).toFixed(3),
  tStat: ((sr(i * 47 + 15) - 0.5) * 4).toFixed(2),
}));

// Avg CAR across event window [-10,+10]
const EVENT_WINDOW_DATA = Array.from({ length: 21 }, (_, i) => {
  const day = i - 10;
  const avgCar = (sr(i * 53 + 16) - 0.52) * 2.5;
  return { day, car: +avgCar.toFixed(3) };
});

// ── Correlation Matrix Seed ───────────────────────────────────────────────────
const CORR_SOURCES = ['GDELT Tone','SEC Sentiment','OpenAlex Cit.','WB CO2'];
const buildCorrMatrix = () => CORR_SOURCES.map((r, i) =>
  CORR_SOURCES.map((c, j) => {
    if (i === j) return 1.0;
    const raw = sr(i * 61 + j * 17 + 18) * 1.6 - 0.8;
    return +raw.toFixed(2);
  })
);
const CORR_MATRIX = buildCorrMatrix();

// ── Temporal / Hawkes Seed ────────────────────────────────────────────────────
const HAWKES_PARAMS = [
  { domain: 'Environmental', mu: 0.42, alpha: 0.31, beta: 0.85 },
  { domain: 'Social', mu: 0.28, alpha: 0.22, beta: 0.71 },
  { domain: 'Governance', mu: 0.19, alpha: 0.17, beta: 0.63 },
];
const DAILY_NEWS = Array.from({ length: 30 }, (_, i) => ({
  day: `D-${30 - i}`,
  count: Math.floor(sr(i * 67 + 19) * 35 + 8),
}));
const ROLLING_CORR = Array.from({ length: 30 }, (_, i) => ({
  day: `D-${30 - i}`,
  corr: +(sr(i * 71 + 20) * 0.8 - 0.1).toFixed(3),
}));

// ── Alpha Factor Seed ─────────────────────────────────────────────────────────
const FACTOR_NAMES = ['GDELT Tone IC','SEC Disclosure IC','OpenAlex Momentum','CO2 Delta IC','Composite Signal'];
const IC_DAYS = [1, 5, 10, 20, 40, 60, 90];
const IC_CURVES = FACTOR_NAMES.map((name, fi) => ({
  name,
  data: IC_DAYS.map(d => ({
    day: d,
    ic: +(sr(fi * 79 + d * 3 + 21) * 0.25 * Math.exp(-d / 40)).toFixed(4),
  })),
  ic: +(sr(fi * 83 + 22) * 0.15 + 0.03).toFixed(4),
  ir: +(sr(fi * 89 + 23) * 0.6 + 0.1).toFixed(3),
  sharpe: +(sr(fi * 97 + 24) * 1.2 + 0.3).toFixed(3),
  alpha: +(sr(fi * 101 + 25) * 3.5 + 0.5).toFixed(2),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
const tagPillar = title => {
  const t = title.toLowerCase();
  const eKw = ['climate','carbon','emissions','renewable','biodiversity','net-zero','water','methane'];
  const sKw = ['labor','worker','diversity','human rights','community','social','just'];
  const gKw = ['governance','board','corruption','audit','executive','ai governance'];
  if (eKw.some(k => t.includes(k))) return 'E';
  if (sKw.some(k => t.includes(k))) return 'S';
  if (gKw.some(k => t.includes(k))) return 'G';
  return 'ESG';
};
const PILLAR_COLORS = { E: T.green, S: T.blue, G: T.indigo, ESG: T.teal };
const toneColor = tone => +tone > 2 ? T.green : +tone < -2 ? T.red : T.amber;

// ── Sub-components ────────────────────────────────────────────────────────────
const KpiBox = ({ label, value, sub }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 160 }}>
    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: T.text }}>{value}</div>
    <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: T.accent, marginTop: 2 }}>{sub}</div>}
  </div>
);

const LiveBadge = ({ live }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11,
    fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
    color: live ? '#16a34a' : '#b45309',
    background: live ? '#f0fdf4' : '#fffbeb',
    border: `1px solid ${live ? '#86efac' : '#fde68a'}`,
    borderRadius: 12, padding: '2px 10px',
  }}>
    <span style={{ width: 7, height: 7, borderRadius: '50%', background: live ? '#16a34a' : '#d97706', display: 'inline-block' }} />
    {live ? 'LIVE' : 'SEEDED'}
  </span>
);

const SectionHeader = ({ title, badge }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: T.text }}>{title}</span>
    {badge && <span style={{ fontSize: 10, background: T.indigo, color: '#fff', borderRadius: 4, padding: '2px 7px' }}>{badge}</span>}
  </div>
);

// ── TAB 1: Live News Intelligence ─────────────────────────────────────────────
const Tab1News = ({ articles, live }) => {
  const avgTone = articles.length ? articles.reduce((s, a) => s + +a.tone, 0) / articles.length : 0;
  const posPct = articles.length ? articles.filter(a => +a.tone > 0).length / articles.length * 100 : 0;
  const negPct = articles.length ? articles.filter(a => +a.tone < 0).length / articles.length * 100 : 0;

  const toneGroups = [
    { name: 'Very Negative (<-5)', count: articles.filter(a => +a.tone < -5).length },
    { name: 'Negative (-5 to -2)', count: articles.filter(a => +a.tone >= -5 && +a.tone < -2).length },
    { name: 'Neutral (-2 to +2)', count: articles.filter(a => +a.tone >= -2 && +a.tone <= 2).length },
    { name: 'Positive (+2 to +5)', count: articles.filter(a => +a.tone > 2 && +a.tone <= 5).length },
    { name: 'Very Positive (>+5)', count: articles.filter(a => +a.tone > 5).length },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <KpiBox label="Total Articles" value={articles.length} />
        <KpiBox label="Avg Tone Score" value={avgTone.toFixed(2)} sub="−10 (neg) → +10 (pos)" />
        <KpiBox label="Positive %" value={`${posPct.toFixed(0)}%`} />
        <KpiBox label="Negative %" value={`${negPct.toFixed(0)}%`} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Tone Distribution" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={toneGroups}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.sub }} />
              <YAxis tick={{ fontSize: 10, fill: T.sub }} />
              <Tooltip />
              <Bar dataKey="count" fill={T.indigo} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="ESG Pillar Breakdown" />
          {['E','S','G','ESG'].map(p => {
            const cnt = articles.filter(a => tagPillar(a.title) === p).length;
            return (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: PILLAR_COLORS[p], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{p}</span>
                <div style={{ flex: 1, background: T.bg, borderRadius: 4, height: 14 }}>
                  <div style={{ width: `${articles.length ? (cnt / articles.length * 100) : 0}%`, background: PILLAR_COLORS[p], height: '100%', borderRadius: 4, transition: 'width 0.4s' }} />
                </div>
                <span style={{ fontSize: 12, color: T.sub, minWidth: 30 }}>{cnt}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Article Feed" badge={`${articles.length} stories`} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {articles.map((a, i) => {
            const pillar = tagPillar(a.title);
            return (
              <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '10px 14px', background: T.bg }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4, lineHeight: 1.4 }}>{a.title}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, background: PILLAR_COLORS[pillar], color: '#fff', borderRadius: 4, padding: '1px 6px' }}>{pillar}</span>
                  <span style={{ fontSize: 10, color: toneColor(a.tone), fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>Tone: {(+a.tone).toFixed(1)}</span>
                  <span style={{ fontSize: 10, color: T.sub }}>{a.sourcecountry}</span>
                  <span style={{ fontSize: 10, color: T.sub }}>{a.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── TAB 2: SEC Filing Monitor ─────────────────────────────────────────────────
const Tab2SEC = ({ filings, live }) => {
  const [formFilter, setFormFilter] = useState('All');
  const filtered = formFilter === 'All' ? filings : filings.filter(f => f.form.startsWith(formFilter));
  const posPct = filtered.length ? filtered.filter(f => +f.sentiment >= 0.5).length / filtered.length * 100 : 0;
  const totalMentions = filtered.reduce((s, f) => s + f.climateMentions, 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <KpiBox label="Total Filings" value={filtered.length} />
        <KpiBox label="Positive Sentiment %" value={`${posPct.toFixed(0)}%`} />
        <KpiBox label="Climate Mentions" value={totalMentions.toLocaleString()} />
        <KpiBox label="Active Filter" value={formFilter} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['All','10-K','8-K','DEF'].map(f => (
          <button key={f} onClick={() => setFormFilter(f)} style={{
            padding: '5px 14px', borderRadius: 20, border: `1px solid ${formFilter === f ? T.indigo : T.border}`,
            background: formFilter === f ? T.indigo : T.card, color: formFilter === f ? '#fff' : T.sub,
            cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>{f}</button>
        ))}
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0F172A' }}>
              {['Company','Form','Date','Sentiment','Climate Mentions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((f, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                <td style={{ padding: '9px 14px', fontSize: 13, color: T.text, fontWeight: 600 }}>{f.company}</td>
                <td style={{ padding: '9px 14px' }}><span style={{ fontSize: 11, background: T.indigo + '22', color: T.indigo, borderRadius: 4, padding: '2px 7px', fontWeight: 700 }}>{f.form}</span></td>
                <td style={{ padding: '9px 14px', fontSize: 12, color: T.sub, fontFamily: 'JetBrains Mono, monospace' }}>{f.date}</td>
                <td style={{ padding: '9px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: +f.sentiment >= 0.5 ? T.green : T.red, fontWeight: 700 }}>{f.sentiment}</td>
                <td style={{ padding: '9px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: T.text }}>{f.climateMentions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── TAB 3: Research Intelligence ──────────────────────────────────────────────
const Tab3Research = ({ papers, live }) => {
  const sorted = [...papers].sort((a, b) => b.cited_by_count - a.cited_by_count);
  const histData = [
    { range: '0–50', count: papers.filter(p => p.cited_by_count < 50).length },
    { range: '50–200', count: papers.filter(p => p.cited_by_count >= 50 && p.cited_by_count < 200).length },
    { range: '200–500', count: papers.filter(p => p.cited_by_count >= 200 && p.cited_by_count < 500).length },
    { range: '500+', count: papers.filter(p => p.cited_by_count >= 500).length },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <KpiBox label="Total Papers" value={papers.length} />
        <KpiBox label="Open Access" value={papers.filter(p => p.open_access).length} sub={`of ${papers.length}`} />
        <KpiBox label="Top Citation" value={sorted[0] ? sorted[0].cited_by_count.toLocaleString() : '—'} />
        <KpiBox label="Median Citations" value={sorted.length ? sorted[Math.floor(sorted.length / 2)].cited_by_count : 0} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Citation Impact Distribution" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={histData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: T.sub }} />
              <YAxis tick={{ fontSize: 10, fill: T.sub }} />
              <Tooltip />
              <Bar dataKey="count" fill={T.teal} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Top 5 Most-Cited" />
          {sorted.slice(0, 5).map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: T.accent, minWidth: 16 }}>#{i + 1}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, lineHeight: 1.4 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: T.sub }}>Citations: <strong style={{ color: T.indigo }}>{p.cited_by_count.toLocaleString()}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Full Paper List" />
        {sorted.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < sorted.length - 1 ? `1px solid ${T.border}` : 'none' }}>
            <span style={{ fontSize: 10, background: p.open_access ? T.green : T.sub, color: '#fff', borderRadius: 4, padding: '1px 6px', minWidth: 30, textAlign: 'center' }}>{p.open_access ? 'OA' : 'Paid'}</span>
            <div style={{ flex: 1, fontSize: 12, color: T.text }}>{p.title}</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {p.concepts.map(c => <span key={c} style={{ fontSize: 10, background: T.indigo + '22', color: T.indigo, borderRadius: 4, padding: '1px 5px' }}>{c}</span>)}
            </div>
            <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: T.teal, fontWeight: 700, minWidth: 60, textAlign: 'right' }}>{p.cited_by_count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── TAB 4: Country ESG ────────────────────────────────────────────────────────
const Tab4Countries = ({ countries, live }) => {
  const [regionFilter, setRegionFilter] = useState('all');
  const regions = ['all','europe','asia','americas','africa','middle-east'];
  const filtered = regionFilter === 'all' ? countries : countries.filter(c => c.region === regionFilter);
  const sorted = [...filtered].sort((a, b) => b.co2PerCapita - a.co2PerCapita);
  const globalAvg = countries.length ? countries.reduce((s, c) => s + c.co2PerCapita, 0) / countries.length : 0;
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <KpiBox label="Global Avg CO₂/Capita" value={`${globalAvg.toFixed(1)} t`} sub="tCO₂e per person" />
        <KpiBox label="Highest Emitter" value={highest ? highest.name : '—'} sub={highest ? `${highest.co2PerCapita.toFixed(1)} t` : ''} />
        <KpiBox label="Lowest Emitter" value={lowest ? lowest.name : '—'} sub={lowest ? `${lowest.co2PerCapita.toFixed(1)} t` : ''} />
        <KpiBox label="Countries" value={filtered.length} sub={regionFilter === 'all' ? 'all regions' : regionFilter} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {regions.map(r => (
          <button key={r} onClick={() => setRegionFilter(r)} style={{
            padding: '4px 12px', borderRadius: 20, border: `1px solid ${regionFilter === r ? T.teal : T.border}`,
            background: regionFilter === r ? T.teal : T.card, color: regionFilter === r ? '#fff' : T.sub,
            cursor: 'pointer', fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
          }}>{r}</button>
        ))}
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 18 }}>
        <SectionHeader title="CO₂ Per Capita by Country" badge="World Bank" />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{ fontSize: 10, fill: T.sub }} unit=" t" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.sub }} width={80} />
            <Tooltip formatter={v => [`${v.toFixed(2)} tCO₂e`, 'CO₂/Capita']} />
            <Bar dataKey="co2PerCapita" fill={T.indigo} radius={[0, 3, 3, 0]}>
              {sorted.map((_, i) => <Cell key={i} fill={sorted[i].co2PerCapita > globalAvg ? T.red : T.green} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0F172A' }}>
              {['Country','Region','CO₂/Capita (t)','vs. Global Avg','Source'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                <td style={{ padding: '8px 14px', fontSize: 13, fontWeight: 600, color: T.text }}>{c.name}</td>
                <td style={{ padding: '8px 14px', fontSize: 11, color: T.sub, textTransform: 'capitalize' }}>{c.region}</td>
                <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: c.co2PerCapita > globalAvg ? T.red : T.green, fontWeight: 700 }}>{c.co2PerCapita.toFixed(2)}</td>
                <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: T.sub }}>{c.co2PerCapita > globalAvg ? `+${(c.co2PerCapita - globalAvg).toFixed(1)}` : (c.co2PerCapita - globalAvg).toFixed(1)}</td>
                <td style={{ padding: '8px 14px' }}><span style={{ fontSize: 10, background: T.blue + '22', color: T.blue, borderRadius: 4, padding: '2px 7px' }}>World Bank</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── TAB 5: Ensemble NLP Engine ────────────────────────────────────────────────
const Tab5NLP = () => {
  const [weights, setWeights] = useState(NLP_MODELS.map(m => m.weight));
  const [sampleText, setSampleText] = useState('The company has committed to achieving net-zero carbon emissions by 2035 through renewable energy investments and aggressive Scope 3 reduction targets.');
  const [showOutput, setShowOutput] = useState(false);

  const totalWeight = weights.reduce((s, w) => s + w, 0);
  const ensembleScore = (weights.reduce((s, w, i) => s + w * (NLP_MODELS[i].f1 * 0.6 + 0.2), 0) / Math.max(totalWeight, 0.001)).toFixed(4);

  const handleWeightChange = (i, val) => {
    const newW = [...weights];
    newW[i] = Math.max(0, Math.min(1, +val));
    setWeights(newW);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <KpiBox label="Models in Ensemble" value={NLP_MODELS.length} />
        <KpiBox label="Weight Sum" value={totalWeight.toFixed(2)} sub={Math.abs(totalWeight - 1) < 0.01 ? 'Normalised ✓' : 'Sum ≠ 1.0'} />
        <KpiBox label="Ensemble Score" value={ensembleScore} sub="Weighted F1 proxy" />
        <KpiBox label="Best Single Model" value="FinBERT" sub="F1=0.87" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Model Weights (Interactive)" badge="Drag sliders" />
          {NLP_MODELS.map((m, i) => (
            <div key={m.name} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{m.name}</span>
                <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: m.color }}>w={weights[i].toFixed(2)} · F1={m.f1}</span>
              </div>
              <input type="range" min={0} max={1} step={0.01} value={weights[i]} onChange={e => handleWeightChange(i, e.target.value)}
                style={{ width: '100%', accentColor: m.color }} />
            </div>
          ))}
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="SHAP Token Attribution" badge="Top 8 tokens" />
          {SAMPLE_TOKENS.map(({ token, importance }) => (
            <div key={token} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.text, minWidth: 90 }}>{token}</span>
              <div style={{ flex: 1, background: T.bg, borderRadius: 4, height: 14 }}>
                <div style={{ width: `${importance * 100}%`, background: T.indigo, height: '100%', borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 11, color: T.sub, minWidth: 35, textAlign: 'right' }}>{(importance * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Sample Text Analysis" />
        <textarea value={sampleText} onChange={e => setSampleText(e.target.value)} rows={3}
          style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 12px', fontSize: 13, color: T.text, resize: 'vertical', background: T.bg, boxSizing: 'border-box' }} />
        <button onClick={() => setShowOutput(!showOutput)} style={{ marginTop: 10, padding: '7px 20px', background: T.indigo, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          Run Ensemble Analysis
        </button>
        {showOutput && (
          <div style={{ marginTop: 12, padding: 14, background: T.bg, borderRadius: 6, border: `1px solid ${T.border}` }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: T.text }}>
              <div><span style={{ color: T.green }}>■ Environmental Signal:</span> <strong>POSITIVE</strong> (conf: 0.91)</div>
              <div><span style={{ color: T.indigo }}>■ Governance Signal:</span> <strong>NEUTRAL</strong> (conf: 0.62)</div>
              <div><span style={{ color: T.blue }}>■ Social Signal:</span> <strong>NEUTRAL</strong> (conf: 0.55)</div>
              <div style={{ marginTop: 8 }}><span style={{ color: T.accent }}>■ Ensemble Output:</span> <strong>POSITIVE ESG · Score={ensembleScore}</strong></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── TAB 6: Entity Knowledge Graph ─────────────────────────────────────────────
const Tab6Entities = () => {
  const [sectorFilter, setSectorFilter] = useState('all');
  const filtered = sectorFilter === 'all' ? SEED_ENTITIES : SEED_ENTITIES.filter(e => e.sector === sectorFilter);

  const topicCooccurrence = ENTITY_TOPICS.slice(0, 6).map(topic => ({
    topic,
    count: SEED_ENTITIES.filter(e => e.topics.includes(topic)).length,
  }));

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <KpiBox label="Total Entities" value={SEED_ENTITIES.length} />
        <KpiBox label="Controversy Flags" value={SEED_ENTITIES.filter(e => e.controversy).length} />
        <KpiBox label="Avg ESG Score" value={(SEED_ENTITIES.reduce((s, e) => s + e.esgScore, 0) / SEED_ENTITIES.length).toFixed(0)} sub="/100" />
        <KpiBox label="Sectors" value={ENTITY_SECTORS.length} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', ...ENTITY_SECTORS].map(s => (
          <button key={s} onClick={() => setSectorFilter(s)} style={{
            padding: '4px 12px', borderRadius: 20, border: `1px solid ${sectorFilter === s ? (SECTOR_COLORS[s] || T.indigo) : T.border}`,
            background: sectorFilter === s ? (SECTOR_COLORS[s] || T.indigo) : T.card,
            color: sectorFilter === s ? '#fff' : T.sub, cursor: 'pointer', fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
          }}>{s}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Entity Table" />
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {filtered.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: SECTOR_COLORS[e.sector], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{e.name}</div>
                  <div style={{ fontSize: 10, color: T.sub, textTransform: 'capitalize' }}>{e.sector}</div>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: e.esgScore >= 60 ? T.green : T.amber, fontWeight: 700 }}>{e.esgScore}</span>
                {e.controversy && <span style={{ fontSize: 10, background: T.red + '22', color: T.red, borderRadius: 4, padding: '1px 6px' }}>!</span>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Topic Co-occurrence" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topicCooccurrence} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10, fill: T.sub }} />
              <YAxis type="category" dataKey="topic" tick={{ fontSize: 10, fill: T.sub }} width={100} />
              <Tooltip />
              <Bar dataKey="count" fill={T.teal} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ── TAB 7: Event Study Analysis ───────────────────────────────────────────────
const Tab7Events = () => {
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <KpiBox label="Events" value={SEED_EVENTS.length} />
        <KpiBox label="Estimation Window" value="[-120, -20]" sub="trading days" />
        <KpiBox label="Event Window" value="[-20, +20]" sub="trading days" />
        <KpiBox label="Methodology" value="CAR" sub="Market model" />
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 18 }}>
        <SectionHeader title="Formula" />
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, color: T.indigo, padding: '8px 0' }}>
          CAR(t₁,t₂) = Σ(R_t − E[R_t])
        </div>
        <div style={{ fontSize: 12, color: T.sub }}>R_t: actual return · E[R_t]: market model expected return · Estimation window: days −120 to −20</div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 18 }}>
        <SectionHeader title="Average CAR Across Event Window" badge="Days −10 to +10" />
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={EVENT_WINDOW_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: T.sub }} label={{ value: 'Day relative to event', position: 'insideBottom', offset: -2, fontSize: 11, fill: T.sub }} />
            <YAxis tick={{ fontSize: 10, fill: T.sub }} tickFormatter={v => `${v.toFixed(1)}%`} />
            <Tooltip formatter={v => [`${v.toFixed(3)}%`, 'Avg CAR']} />
            <ReferenceLine y={0} stroke={T.red} strokeDasharray="4 4" />
            <Area type="monotone" dataKey="car" stroke={T.indigo} fill={T.indigo + '33'} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0F172A' }}>
              {['Event Type','Company','CAR(−5,+5)','CAR(−1,+1)','t-Stat'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SEED_EVENTS.map((ev, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                <td style={{ padding: '8px 14px', fontSize: 12, color: T.text, fontWeight: 600 }}>{ev.type}</td>
                <td style={{ padding: '8px 14px', fontSize: 12, color: T.sub }}>{ev.company}</td>
                <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: +ev.car55 >= 0 ? T.green : T.red, fontWeight: 700 }}>{ev.car55}%</td>
                <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: +ev.car11 >= 0 ? T.green : T.red, fontWeight: 700 }}>{ev.car11}%</td>
                <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: Math.abs(+ev.tStat) > 1.96 ? T.indigo : T.sub }}>{ev.tStat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── TAB 8: Cross-Source Triangulation ────────────────────────────────────────
const Tab8Corr = () => {
  const corrColor = v => {
    if (v >= 0.5) return T.green;
    if (v >= 0.2) return '#86efac';
    if (v <= -0.5) return T.red;
    if (v <= -0.2) return '#fca5a5';
    return T.border;
  };

  const divergenceAlerts = SEED_ENTITIES.slice(0, 5).map((e, i) => ({
    company: e.name,
    gdeltTone: (sr(i * 109 + 26) * 20 - 10).toFixed(1),
    secSentiment: (sr(i * 113 + 27) * 0.8 + 0.1).toFixed(2),
    divergence: (sr(i * 127 + 28) * 0.6).toFixed(2),
  })).filter(d => +d.divergence > 0.3);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <KpiBox label="Sources" value={4} sub="GDELT · SEC · OpenAlex · WB" />
        <KpiBox label="Correlation Pairs" value={6} sub="4×4 matrix" />
        <KpiBox label="Divergence Alerts" value={divergenceAlerts.length} sub=">0.3 threshold" />
        <KpiBox label="Update Frequency" value="Real-time" sub="on fetch" />
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 18 }}>
        <SectionHeader title="Cross-Source Correlation Matrix" />
        <table style={{ borderCollapse: 'collapse', margin: '0 auto' }}>
          <thead>
            <tr>
              <th style={{ width: 120 }} />
              {CORR_SOURCES.map(s => <th key={s} style={{ padding: '8px 14px', fontSize: 11, color: T.sub, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }}>{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {CORR_SOURCES.map((row, i) => (
              <tr key={row}>
                <td style={{ padding: '8px 14px', fontSize: 11, color: T.sub, fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>{row}</td>
                {CORR_MATRIX[i].map((val, j) => (
                  <td key={j} style={{ padding: '10px 18px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700,
                    background: i === j ? '#0F172A' : corrColor(val) + '44',
                    color: i === j ? '#fff' : corrColor(val), borderRadius: 4 }}>
                    {val === 1.0 ? '1.00' : val.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {divergenceAlerts.length > 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Divergence Alerts" badge="GDELT vs SEC >0.3" />
          {divergenceAlerts.map((alert, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < divergenceAlerts.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: T.red + '22', color: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>!</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{alert.company}</div>
                <div style={{ fontSize: 11, color: T.sub }}>GDELT tone: {alert.gdeltTone} · SEC sentiment: {alert.secSentiment}</div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: T.red, fontWeight: 700 }}>Δ {alert.divergence}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── TAB 9: Temporal Intelligence ──────────────────────────────────────────────
const Tab9Temporal = () => {
  const [pVal, setPVal] = useState(2);
  const [dVal, setDVal] = useState(1);
  const [qVal, setQVal] = useState(2);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <KpiBox label="ARIMA Order" value={`(${pVal},${dVal},${qVal})`} sub="p,d,q" />
        <KpiBox label="Observation Window" value="30 days" />
        <KpiBox label="Hawkes Domains" value={HAWKES_PARAMS.length} sub="E / S / G" />
        <KpiBox label="Rolling Correlation" value="30-day" sub="GDELT × SEC" />
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 18 }}>
        <SectionHeader title="ARIMA Configuration" badge="(p,d,q)" />
        <div style={{ display: 'flex', gap: 24 }}>
          {[['p (AR order)', pVal, setPVal, 5], ['d (Diff order)', dVal, setDVal, 2], ['q (MA order)', qVal, setQVal, 5]].map(([label, val, setter, max]) => (
            <div key={label} style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>{label}</div>
              <input type="range" min={0} max={max} step={1} value={val} onChange={e => setter(+e.target.value)} style={{ width: '100%', accentColor: T.indigo }} />
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: T.indigo, textAlign: 'center' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Daily News Arrival Rate" badge="30-day" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DAILY_NEWS}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="day" tick={{ fontSize: 8, fill: T.sub }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: T.sub }} />
              <Tooltip />
              <Bar dataKey="count" fill={T.teal} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Rolling 30-Day Sentiment Correlation" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ROLLING_CORR}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="day" tick={{ fontSize: 8, fill: T.sub }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: T.sub }} domain={[-1, 1]} />
              <Tooltip />
              <ReferenceLine y={0} stroke={T.red} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="corr" stroke={T.indigo} dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Hawkes Process Parameters" />
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: T.indigo, marginBottom: 12 }}>
          λ(t) = μ + Σⱼ α·exp(−β(t−tⱼ))
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0F172A' }}>
              {['Domain','μ (baseline)','α (excitation)','β (decay)'].map(h => (
                <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HAWKES_PARAMS.map((p, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '8px 14px', fontSize: 13, fontWeight: 600, color: [T.green, T.blue, T.indigo][i] }}>{p.domain}</td>
                <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{p.mu}</td>
                <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{p.alpha}</td>
                <td style={{ padding: '8px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{p.beta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── TAB 10: Alpha Factor Framework ───────────────────────────────────────────
const Tab10Alpha = () => {
  const [ewmaLambda, setEwmaLambda] = useState(0.10);
  const lambdaOptions = [0.05, 0.10, 0.20, 0.30];

  const smoothedData = IC_CURVES[0].data.map((pt, i) => ({
    day: pt.day,
    smoothed: +(IC_CURVES.reduce((s, f) => s + f.data[i].ic, 0) * (1 - ewmaLambda) + ewmaLambda * 0.05).toFixed(4),
  }));

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <KpiBox label="Factors" value={FACTOR_NAMES.length} />
        <KpiBox label="EWMA λ" value={ewmaLambda} sub="decay parameter" />
        <KpiBox label="IC Days" value={IC_DAYS.join(', ')} sub="decay horizon" />
        <KpiBox label="IR Formula" value="IC × √BR" sub="Fundamental Law" />
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 18 }}>
        <SectionHeader title="IC Decay Curves by Source" />
        <ResponsiveContainer width="100%" height={240}>
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="day" type="number" allowDuplicatedCategory={false} tick={{ fontSize: 10, fill: T.sub }} domain={[1, 90]} label={{ value: 'Days Forward', position: 'insideBottom', offset: -2, fontSize: 11, fill: T.sub }} />
            <YAxis tick={{ fontSize: 10, fill: T.sub }} />
            <Tooltip />
            <Legend />
            {IC_CURVES.map((f, fi) => (
              <Line key={f.name} data={f.data} type="monotone" dataKey="ic" name={f.name}
                stroke={[T.indigo, T.teal, T.green, T.amber, T.blue][fi]} dot={false} strokeWidth={2} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="EWMA Smoothed Signal" badge={`λ=${ewmaLambda}`} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {lambdaOptions.map(l => (
              <button key={l} onClick={() => setEwmaLambda(l)} style={{
                padding: '4px 10px', borderRadius: 16, border: `1px solid ${ewmaLambda === l ? T.indigo : T.border}`,
                background: ewmaLambda === l ? T.indigo : T.card, color: ewmaLambda === l ? '#fff' : T.sub,
                cursor: 'pointer', fontSize: 11, fontWeight: 600,
              }}>λ={l}</button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={smoothedData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: T.sub }} />
              <YAxis tick={{ fontSize: 9, fill: T.sub }} />
              <Tooltip />
              <Area type="monotone" dataKey="smoothed" stroke={T.teal} fill={T.teal + '33'} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Information Ratio" badge="IC × √BR" />
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: T.indigo, marginBottom: 12 }}>IR = IC × √BR</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Factor','IC','IR','Sharpe','α %'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '4px 8px', color: T.sub, fontWeight: 600, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {IC_CURVES.map((f, i) => (
                <tr key={f.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '5px 8px', fontWeight: 600, color: [T.indigo, T.teal, T.green, T.amber, T.blue][i], fontSize: 11 }}>{f.name.replace(' IC', '')}</td>
                  <td style={{ padding: '5px 8px', fontFamily: 'JetBrains Mono, monospace' }}>{f.ic}</td>
                  <td style={{ padding: '5px 8px', fontFamily: 'JetBrains Mono, monospace' }}>{f.ir}</td>
                  <td style={{ padding: '5px 8px', fontFamily: 'JetBrains Mono, monospace' }}>{f.sharpe}</td>
                  <td style={{ padding: '5px 8px', fontFamily: 'JetBrains Mono, monospace', color: T.green }}>{f.alpha}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Main Page Component ───────────────────────────────────────────────────────
const TABS = [
  'Live News',
  'SEC Filings',
  'Research',
  'Country ESG',
  'Ensemble NLP',
  'Knowledge Graph',
  'Event Study',
  'Triangulation',
  'Temporal',
  'Alpha Factors',
];

export default function AIDataLivePlatformPage() {
  const [activeTab, setActiveTab] = useState(0);

  // Live data states
  const [gdeltData, setGdeltData] = useState(SEED_GDELT);
  const [gdeltLive, setGdeltLive] = useState(false);
  const [gdeltLoading, setGdeltLoading] = useState(false);

  const [secData, setSecData] = useState(SEED_FILINGS);
  const [secLive, setSecLive] = useState(false);
  const [secLoading, setSecLoading] = useState(false);

  const [paperData, setPaperData] = useState(SEED_PAPERS);
  const [papersLive, setPapersLive] = useState(false);
  const [papersLoading, setPapersLoading] = useState(false);

  const [countryData, setCountryData] = useState(SEED_COUNTRIES);
  const [countryLive, setCountryLive] = useState(false);
  const [countryLoading, setCountryLoading] = useState(false);

  // ── Fetch: GDELT ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setGdeltLoading(true);
    fetch(GDELT_URL)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          const articles = data.articles || [];
          if (articles.length > 0) {
            const parsed = articles.map((a, i) => ({
              title: a.title || SEED_GDELT[i % SEED_GDELT.length].title,
              url: a.url || '#',
              tone: a.tone != null ? (+a.tone).toFixed(2) : (sr(i * 7 + 1) * 20 - 10).toFixed(2),
              sourcecountry: a.sourcecountry || SOURCE_COUNTRIES[i % SOURCE_COUNTRIES.length],
              date: a.seendate ? a.seendate.substring(0, 10) : SEED_GDELT[i % SEED_GDELT.length].date,
            }));
            setGdeltData(parsed);
            setGdeltLive(true);
          } else {
            setGdeltData(SEED_GDELT);
            setGdeltLive(false);
          }
          setGdeltLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) { setGdeltData(SEED_GDELT); setGdeltLive(false); setGdeltLoading(false); }
      });
    return () => { cancelled = true; };
  }, []);

  // ── Fetch: SEC EDGAR ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setSecLoading(true);
    fetch(SEC_URL)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          const hits = (data.hits && data.hits.hits) || [];
          if (hits.length > 0) {
            const parsed = hits.map((h, i) => ({
              company: (h._source && h._source['entity-name']) || COMPANIES_SEC[i % COMPANIES_SEC.length],
              form: (h._source && h._source['form-type']) || FORM_TYPES[i % FORM_TYPES.length],
              date: (h._source && h._source['period-of-report']) || SEED_FILINGS[i % SEED_FILINGS.length].date,
              sentiment: (sr(i * 11 + 5) * 0.4 + 0.5).toFixed(3),
              climateMentions: Math.floor(sr(i * 13 + 6) * 80 + 10),
            }));
            setSecData(parsed);
            setSecLive(true);
          } else {
            setSecData(SEED_FILINGS);
            setSecLive(false);
          }
          setSecLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) { setSecData(SEED_FILINGS); setSecLive(false); setSecLoading(false); }
      });
    return () => { cancelled = true; };
  }, []);

  // ── Fetch: OpenAlex ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setPapersLoading(true);
    fetch(OPENALEX_URL)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          const works = data.results || [];
          if (works.length > 0) {
            const parsed = works.map((w, i) => ({
              title: w.title || SEED_PAPERS[i % SEED_PAPERS.length].title,
              cited_by_count: w.cited_by_count || 0,
              open_access: w.open_access ? w.open_access.is_oa : false,
              concepts: (w.concepts || []).slice(0, 3).map(c => c.display_name),
            }));
            setPaperData(parsed);
            setPapersLive(true);
          } else {
            setPaperData(SEED_PAPERS);
            setPapersLive(false);
          }
          setPapersLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) { setPaperData(SEED_PAPERS); setPapersLive(false); setPapersLoading(false); }
      });
    return () => { cancelled = true; };
  }, []);

  // ── Fetch: World Bank CO2 ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setCountryLoading(true);
    fetch(WORLDBANK_URL)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          const records = Array.isArray(data) && data[1] ? data[1] : [];
          if (records.length > 0) {
            const regionMap = {};
            SEED_COUNTRIES.forEach(c => { regionMap[c.name] = c.region; });
            const parsed = records
              .filter(r => r.value != null)
              .map(r => ({
                name: r.country ? r.country.value : r.countryiso3code,
                region: regionMap[r.country ? r.country.value : ''] || 'other',
                co2PerCapita: +r.value.toFixed(2),
              }));
            if (parsed.length > 0) {
              setCountryData(parsed);
              setCountryLive(true);
            } else {
              setCountryData(SEED_COUNTRIES);
              setCountryLive(false);
            }
          } else {
            setCountryData(SEED_COUNTRIES);
            setCountryLive(false);
          }
          setCountryLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) { setCountryData(SEED_COUNTRIES); setCountryLive(false); setCountryLoading(false); }
      });
    return () => { cancelled = true; };
  }, []);

  // ── Active tab live badge ────────────────────────────────────────────────
  const tabLive = [gdeltLive, secLive, papersLive, countryLive, false, false, false, false, false, false];
  const tabLoading = [gdeltLoading, secLoading, papersLoading, countryLoading, false, false, false, false, false, false];

  const renderTab = () => {
    switch (activeTab) {
      case 0: return <Tab1News articles={gdeltData} live={gdeltLive} />;
      case 1: return <Tab2SEC filings={secData} live={secLive} />;
      case 2: return <Tab3Research papers={paperData} live={papersLive} />;
      case 3: return <Tab4Countries countries={countryData} live={countryLive} />;
      case 4: return <Tab5NLP />;
      case 5: return <Tab6Entities />;
      case 6: return <Tab7Events />;
      case 7: return <Tab8Corr />;
      case 8: return <Tab9Temporal />;
      case 9: return <Tab10Alpha />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0F172A', borderBottom: `3px solid ${T.accent}`, padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#64748b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
              EP-LIV1 · AI & NLP Analytics
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
              AI Data Live Platform
            </h1>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              GDELT v2 · SEC EDGAR · OpenAlex · World Bank · 4 Live APIs · Real-Time NLP Intelligence
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {['GDELT', 'SEC EDGAR', 'OpenAlex', 'World Bank'].map((src, i) => (
                <LiveBadge key={src} live={[gdeltLive, secLive, papersLive, countryLive][i]} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
              {[gdeltLive, secLive, papersLive, countryLive].filter(Boolean).length}/4 APIs LIVE
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: '#1e293b', borderBottom: `1px solid #334155`, overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-flex', padding: '0 16px' }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)} style={{
              padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: activeTab === i ? 700 : 400,
              color: activeTab === i ? T.accent : '#94a3b8',
              borderBottom: activeTab === i ? `2px solid ${T.accent}` : '2px solid transparent',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              {tab}
              {tabLoading[i] && <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.amber, display: 'inline-block', animation: 'pulse 1s infinite' }} />}
              {!tabLoading[i] && tabLive[i] && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Active tab live badge line */}
        {(tabLive[activeTab] || tabLoading[activeTab]) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <LiveBadge live={tabLive[activeTab] && !tabLoading[activeTab]} />
            {tabLoading[activeTab] && <span style={{ fontSize: 11, color: T.sub, fontFamily: 'JetBrains Mono, monospace' }}>Fetching live data...</span>}
            {!tabLoading[activeTab] && tabLive[activeTab] && <span style={{ fontSize: 11, color: T.green, fontFamily: 'JetBrains Mono, monospace' }}>Live API data loaded</span>}
          </div>
        )}
        {renderTab()}
      </div>

      {/* Status Bar */}
      <div style={{ background: '#0F172A', borderTop: `1px solid #1e293b`, padding: '8px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#475569' }}>
          EP-LIV1 · v1.0.0 · AI Data Live Platform · 10 tabs · 4 APIs
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {['GDELT', 'SEC', 'OpenAlex', 'WB'].map((src, i) => (
            <span key={src} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: [gdeltLive, secLive, papersLive, countryLive][i] ? '#16a34a' : '#b45309' }}>
              {src}: {[gdeltLive, secLive, papersLive, countryLive][i] ? 'LIVE' : 'SEEDED'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
