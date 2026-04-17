/**
 * EP-BD2 — ESG Sentiment Pipeline Engine
 * Sprint BD | ESG Intelligence & Analytics
 * 8 tabs: Pipeline Architecture · Signal Ingestion · Preprocessing &
 * Vectorization · Classification Engine · Credibility Weighting & Decay ·
 * EWMA Aggregation · Velocity Alerts · Model Performance & MLOps
 */
import React, { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine, ScatterChart, Scatter
} from "recharts";

/* ── Theme ─────────────────────────────────────────────────────────────────── */
const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0',
  sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3',
  textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626',
  blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e',
  indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4',
  fontMono: 'JetBrains Mono, monospace'
};

/* ── PRNG ───────────────────────────────────────────────────────────────────── */
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ── Static Data ────────────────────────────────────────────────────────────── */
const ENTITY_NAMES = [
  'EnergyMega Corp', 'TechVerde Ltd', 'AutoEco AG', 'FinBank PLC',
  'ManufGreen SA', 'RetailSust NV', 'InfraClean Inc', 'AgriEco SpA'
];

const SOURCES = [
  'SEC Filing', 'Bloomberg', 'Reuters', 'FT', 'NGO Report',
  'Social Media', 'Industry Body', 'Analyst Note', 'Regulatory Notice', 'Press Release'
];

const PILLARS = ['E', 'S', 'G'];

const HEADLINES = [
  'Strong emissions reduction targets exceed industry benchmarks',
  'Governance restructuring raises board independence concerns',
  'Supply chain audit reveals critical labor rights gaps',
  'Renewable energy transition plan accelerated by 5 years',
  'Carbon offset programme receives Gold Standard certification',
  'CEO compensation linked to ESG KPIs for first time',
  'Water usage intensity drops 18% vs prior year baseline',
  'Greenwashing allegations surface in investigative report',
  'Biodiversity net positive commitment formally announced',
  'Diversity targets missed for third consecutive year',
  'Climate litigation risk elevated following TCFD gap disclosure',
  'Scope 3 emissions reporting framework materially expanded',
  'Human rights due diligence policy upgraded to UN standards',
  'Net-zero roadmap validated by Science Based Targets initiative',
  'Community investment programme recognised by GRI index',
  'Data privacy breach triggers regulatory investigation',
  'Just transition funding commitment of $500M announced',
  'Anti-corruption controls found deficient in internal audit',
  'Physical climate risk stress-test results published proactively',
  'Social bond issuance oversubscribed 4.2x by ESG investors'
];

const SIGNALS = Array.from({ length: 60 }, (_, i) => ({
  id: `SIG-${String(i + 1).padStart(4, '0')}`,
  source: SOURCES[Math.floor(sr(i * 7) * SOURCES.length)],
  entity: ENTITY_NAMES[Math.floor(sr(i * 11) * 8)],
  pillar: PILLARS[Math.floor(sr(i * 13) * 3)],
  raw_score: parseFloat(((sr(i * 3) * 2) - 1).toFixed(3)),
  tier: Math.floor(sr(i * 17) * 5) + 1,
  daysAgo: Math.floor(sr(i * 19) * 61),
  headline: HEADLINES[Math.floor(sr(i * 23) * HEADLINES.length)]
}));

const MODELS = [
  {
    name: 'FinBERT', accuracy: 0.936, precision: 0.928, recall: 0.921, f1: 0.924,
    latency: 42, training_date: '2025-11-15',
    confusionMatrix: [[412, 18, 5], [22, 387, 14], [8, 11, 423]]
  },
  {
    name: 'RoBERTa-ESG', accuracy: 0.918, precision: 0.911, recall: 0.903, f1: 0.907,
    latency: 67, training_date: '2025-10-22',
    confusionMatrix: [[398, 25, 12], [28, 371, 24], [15, 19, 408]]
  },
  {
    name: 'VADER+Rules', accuracy: 0.814, precision: 0.798, recall: 0.823, f1: 0.810,
    latency: 4, training_date: '2025-08-01',
    confusionMatrix: [[345, 52, 38], [41, 318, 64], [29, 47, 366]]
  },
  {
    name: 'TextBlob', accuracy: 0.762, precision: 0.741, recall: 0.755, f1: 0.748,
    latency: 2, training_date: '2025-07-10',
    confusionMatrix: [[319, 67, 49], [58, 301, 74], [44, 62, 326]]
  },
  {
    name: 'Custom LSTM', accuracy: 0.891, precision: 0.884, recall: 0.876, f1: 0.880,
    latency: 178, training_date: '2025-09-30',
    confusionMatrix: [[378, 34, 23], [31, 362, 30], [18, 27, 397]]
  }
];

const TIER_WEIGHTS = { 1: 1.00, 2: 0.85, 3: 0.65, 4: 0.45, 5: 0.25 };

const DECAY_TYPES = [
  { label: 'Instant', halfLife: 1 },
  { label: 'Fast', halfLife: 7 },
  { label: 'Medium', halfLife: 30 },
  { label: 'Slow', halfLife: 90 },
  { label: 'Chronic', halfLife: 365 },
  { label: 'Permanent', halfLife: 3650 }
];

const ALERT_ACTIONS = [
  'Initiate stakeholder engagement dialogue',
  'Escalate to ESG Committee for review',
  'Commission independent third-party audit',
  'Issue corrective action plan within 30 days',
  'Trigger board-level risk escalation',
  'Activate crisis communications protocol',
  'Request management clarification call',
  'Place issuer on ESG Watch List'
];

const ALERTS = Array.from({ length: 30 }, (_, i) => {
  const score = -(0.3 + sr(i * 7) * 0.7);
  const lvl = score < -0.9 ? 'Extreme' : score < -0.7 ? 'Critical' : score < -0.5 ? 'Elevated' : 'Watch';
  return {
    id: `ALT-${String(i + 1).padStart(3, '0')}`,
    entity: ENTITY_NAMES[Math.floor(sr(i * 11) * 8)],
    pillar: PILLARS[Math.floor(sr(i * 13) * 3)],
    level: lvl,
    score: parseFloat(score.toFixed(3)),
    direction: sr(i * 17) > 0.4 ? 'Deteriorating' : 'Improving',
    daysInAlert: Math.floor(sr(i * 19) * 45) + 1,
    action: ALERT_ACTIONS[Math.floor(sr(i * 23) * ALERT_ACTIONS.length)]
  };
});

const RETRAINING_LOG = [
  { date: '2025-12-01', model: 'FinBERT', version: 'v3.2.1', trigger: 'Scheduled monthly cycle', before_acc: 0.921, after_acc: 0.936, delta: +0.015 },
  { date: '2025-11-14', model: 'RoBERTa-ESG', version: 'v2.8.0', trigger: 'Accuracy drift >2%', before_acc: 0.901, after_acc: 0.918, delta: +0.017 },
  { date: '2025-11-01', model: 'Custom LSTM', version: 'v1.5.3', trigger: 'OOV token rate >8%', before_acc: 0.876, after_acc: 0.891, delta: +0.015 },
  { date: '2025-10-15', model: 'FinBERT', version: 'v3.1.9', trigger: 'Label imbalance threshold', before_acc: 0.914, after_acc: 0.921, delta: +0.007 },
  { date: '2025-09-30', model: 'Custom LSTM', version: 'v1.5.0', trigger: 'New training corpus available', before_acc: 0.858, after_acc: 0.876, delta: +0.018 },
  { date: '2025-09-12', model: 'RoBERTa-ESG', version: 'v2.7.4', trigger: 'KS statistic >0.15', before_acc: 0.897, after_acc: 0.901, delta: +0.004 },
  { date: '2025-08-28', model: 'VADER+Rules', version: 'v4.1.2', trigger: 'Regulatory taxonomy update', before_acc: 0.798, after_acc: 0.814, delta: +0.016 },
  { date: '2025-08-01', model: 'Custom LSTM', version: 'v1.4.8', trigger: 'F1 score degradation alert', before_acc: 0.841, after_acc: 0.858, delta: +0.017 },
  { date: '2025-07-15', model: 'FinBERT', version: 'v3.1.6', trigger: 'Schema drift detected', before_acc: 0.908, after_acc: 0.914, delta: +0.006 },
  { date: '2025-06-30', model: 'RoBERTa-ESG', version: 'v2.7.0', trigger: 'Quarterly retraining cycle', before_acc: 0.889, after_acc: 0.897, delta: +0.008 }
];

const PIPELINE_STEPS = [
  { name: 'Ingest', desc: 'Multi-source document ingestion via REST, webhook, and scheduled crawlers', latency: 12, throughput: 1840, errorRate: 0.3, health: 'Healthy', config: 'Polling interval: 5 min | Max batch: 500 docs | Dedup window: 24h', sampleIn: 'RAW HTML / PDF / JSON from 10 source adapters', sampleOut: 'Normalized JSON: {id, source, timestamp, raw_text, metadata}' },
  { name: 'Preprocess', desc: 'Text normalization, tokenization, stop-word removal, and entity extraction', latency: 8, throughput: 3200, errorRate: 0.1, health: 'Healthy', config: 'Tokenizer: WordPiece | Vocab: 32k | Lang: en/de/fr/es', sampleIn: '"Company X announces ESG targets for FY2026..."', sampleOut: '["company", "x", "announce", "esg", "target", "FY2026"]' },
  { name: 'Vectorize', desc: 'Dense embedding generation using domain-adapted FinBERT sentence encoder', latency: 38, throughput: 890, errorRate: 0.2, health: 'Healthy', config: 'Model: finbert-esg-v3 | Dims: 768 | Pooling: CLS+mean', sampleIn: 'Tokenized sequence (max 512 tokens)', sampleOut: 'float32[768] embedding vector, norm=1.0' },
  { name: 'Classify', desc: 'Ensemble classification: Positive / Neutral / Negative with calibrated probabilities', latency: 45, throughput: 720, errorRate: 0.4, health: 'Healthy', config: 'Ensemble: FinBERT×0.4 + RoBERTa×0.35 + LSTM×0.25 | Threshold: 0.55', sampleIn: 'embedding[768] + metadata', sampleOut: '{label: "Positive", prob: [0.71, 0.22, 0.07]}' },
  { name: 'Score', desc: 'Convert class probabilities to continuous [-1, +1] sentiment score with domain calibration', latency: 2, throughput: 14000, errorRate: 0.0, health: 'Healthy', config: 'Score = P(pos) - P(neg) | Calibration: isotonic regression', sampleIn: '{prob: [0.71, 0.22, 0.07]}', sampleOut: '{raw_score: 0.64, calibrated_score: 0.61}' },
  { name: 'Weight', desc: 'Apply 5-tier source credibility weights and temporal IC decay factors', latency: 1, throughput: 28000, errorRate: 0.0, health: 'Healthy', config: 'Tiers: 1.00/0.85/0.65/0.45/0.25 | Decay: 6 half-life presets', sampleIn: '{raw_score: 0.64, tier: 2, daysAgo: 7}', sampleOut: '{weighted_score: 0.44, decay_factor: 0.50, credibility: 0.85}' },
  { name: 'Decay', desc: 'Exponential information-coefficient decay: score × exp(-λ × t)', latency: 1, throughput: 31000, errorRate: 0.0, health: 'Healthy', config: 'λ = ln(2)/halfLife | halfLife: {1,7,30,90,365,3650} days', sampleIn: '{weighted_score: 0.44, daysAgo: 7, decayType: "Fast"}', sampleOut: '{decayed_score: 0.22, decay_pct: 50.0}' },
  { name: 'Aggregate', desc: 'EWMA time-series aggregation per entity-pillar pair with 4 λ presets', latency: 3, throughput: 8800, errorRate: 0.1, health: 'Warning', config: 'λ options: 0.05/0.10/0.20/0.30 | Window: 90 days | Min obs: 3', sampleIn: 'time-ordered decayed_score stream per (entity, pillar)', sampleOut: '{ewma: 0.31, sigma: 0.12, upper_band: 0.55, lower_band: 0.07}' }
];

/* ── Shared UI Components ───────────────────────────────────────────────────── */
const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, borderBottom: `2px solid ${T.purple}`, paddingBottom: 4 }}>
    {children}
  </div>
);

const Tag = ({ children, color }) => (
  <span style={{ background: `${color}18`, color, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, fontFamily: T.fontMono, textTransform: 'uppercase' }}>
    {children}
  </span>
);

const Badge = ({ val }) => {
  const c = val >= 0.05 ? T.green : val <= -0.05 ? T.red : T.amber;
  return <span style={{ color: c, fontWeight: 700, fontFamily: T.fontMono, fontSize: 12 }}>{val >= 0 ? '+' : ''}{val.toFixed(3)}</span>;
};

/* ══════════════════════════════════════════════════════════════════════════════
   TAB 1 — Pipeline Architecture
══════════════════════════════════════════════════════════════════════════════ */
function TabPipelineArchitecture() {
  const [selected, setSelected] = useState(0);
  const step = PIPELINE_STEPS[selected];

  const throughputData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, '0')}:00`,
    throughput: Math.round(step.throughput * (0.7 + sr(h * 7 + selected * 31) * 0.6))
  }));

  const healthColor = h => h === 'Healthy' ? T.green : h === 'Warning' ? T.amber : T.red;

  const totalSignals = 128_450;
  const avgLatency = parseFloat((PIPELINE_STEPS.reduce((a, s) => a + s.latency, 0) / PIPELINE_STEPS.length).toFixed(1));
  const avgError = parseFloat((PIPELINE_STEPS.reduce((a, s) => a + s.errorRate, 0) / PIPELINE_STEPS.length).toFixed(2));
  const activeAlerts = PIPELINE_STEPS.filter(s => s.health !== 'Healthy').length;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard label="Signals Today" value={totalSignals.toLocaleString()} sub="across all pipeline stages" color={T.purple} />
        <KpiCard label="Avg Latency" value={`${avgLatency} ms`} sub="end-to-end per document" color={T.blue} />
        <KpiCard label="Error Rate" value={`${avgError}%`} sub="7-day rolling average" color={avgError > 0.3 ? T.amber : T.green} />
        <KpiCard label="Active Alerts" value={activeAlerts} sub="pipeline health warnings" color={activeAlerts > 0 ? T.amber : T.green} />
      </div>

      <SectionTitle>8-Step Processing Pipeline</SectionTitle>
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, overflowX: 'auto' }}>
        {PIPELINE_STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div
              onClick={() => setSelected(i)}
              style={{
                background: selected === i ? T.purple : T.card,
                border: `2px solid ${selected === i ? T.purple : T.border}`,
                borderRadius: 8, padding: '14px 12px', cursor: 'pointer', minWidth: 110,
                textAlign: 'center', transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: selected === i ? '#fff' : T.navy, fontFamily: T.fontMono }}>{s.name}</div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: healthColor(s.health), margin: '6px auto 4px' }} />
              <div style={{ fontSize: 10, color: selected === i ? '#ffffffbb' : T.textSec }}>{s.latency} ms</div>
              <div style={{ fontSize: 10, color: selected === i ? '#ffffffbb' : T.textSec }}>{s.throughput.toLocaleString()}/min</div>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div style={{ display: 'flex', alignItems: 'center', color: T.textSec, fontSize: 18, padding: '0 4px' }}>→</div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Step Detail — {step.name}</SectionTitle>
          <p style={{ fontSize: 13, color: T.textSec, marginBottom: 12 }}>{step.desc}</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <Tag color={healthColor(step.health)}>{step.health}</Tag>
            <Tag color={T.blue}>{step.latency} ms avg</Tag>
            <Tag color={T.purple}>{step.throughput.toLocaleString()} docs/min</Tag>
            <Tag color={step.errorRate > 0 ? T.amber : T.green}>err {step.errorRate}%</Tag>
          </div>
          <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 8 }}>CONFIG: {step.config}</div>
          <div style={{ background: T.sub, borderRadius: 6, padding: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>SAMPLE INPUT</div>
            <div style={{ fontSize: 11, fontFamily: T.fontMono, color: T.teal }}>{step.sampleIn}</div>
          </div>
          <div style={{ background: T.sub, borderRadius: 6, padding: 10 }}>
            <div style={{ fontSize: 10, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>SAMPLE OUTPUT</div>
            <div style={{ fontSize: 11, fontFamily: T.fontMono, color: T.sage }}>{step.sampleOut}</div>
          </div>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>24h Throughput — {step.name}</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={throughputData}>
              <defs>
                <linearGradient id="tpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.purple} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={T.purple} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fontFamily: T.fontMono }} interval={3} />
              <YAxis tick={{ fontSize: 9, fontFamily: T.fontMono }} />
              <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
              <Area type="monotone" dataKey="throughput" stroke={T.purple} fill="url(#tpGrad)" strokeWidth={2} dot={false} name="docs/min" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <SectionTitle>Pipeline Step Comparison</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.fontMono }}>
          <thead>
            <tr style={{ background: T.sub }}>
              {['Step', 'Description', 'Avg Latency', 'Throughput', 'Error Rate', 'Health'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: T.textSec, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PIPELINE_STEPS.map((s, i) => (
              <tr key={i} onClick={() => setSelected(i)} style={{ borderBottom: `1px solid ${T.borderL}`, cursor: 'pointer', background: selected === i ? `${T.purple}08` : 'transparent' }}>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: T.purple }}>{s.name}</td>
                <td style={{ padding: '8px 12px', color: T.textSec, fontSize: 11, maxWidth: 220 }}>{s.desc.slice(0, 60)}…</td>
                <td style={{ padding: '8px 12px', color: T.navy }}>{s.latency} ms</td>
                <td style={{ padding: '8px 12px', color: T.blue }}>{s.throughput.toLocaleString()}</td>
                <td style={{ padding: '8px 12px', color: s.errorRate > 0.2 ? T.amber : T.green }}>{s.errorRate}%</td>
                <td style={{ padding: '8px 12px' }}><Tag color={healthColor(s.health)}>{s.health}</Tag></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAB 2 — Signal Ingestion
══════════════════════════════════════════════════════════════════════════════ */
function TabSignalIngestion() {
  const [srcFilter, setSrcFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [pillarFilter, setPillarFilter] = useState('All');

  const filtered = useMemo(() => SIGNALS.filter(s =>
    (srcFilter === 'All' || s.source === srcFilter) &&
    (tierFilter === 'All' || s.tier === parseInt(tierFilter)) &&
    (pillarFilter === 'All' || s.pillar === pillarFilter)
  ), [srcFilter, tierFilter, pillarFilter]);

  const sourceStats = useMemo(() => SOURCES.map(src => ({
    source: src.replace(' ', '\n'),
    count: SIGNALS.filter(s => s.source === src).length
  })), []);

  const tierDist = useMemo(() => [1,2,3,4,5].map(t => ({
    tier: `T${t}`, count: SIGNALS.filter(s => s.tier === t).length, fill: [T.purple, T.blue, T.teal, T.amber, T.red][t-1]
  })), []);

  const lagHist = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    lag: `${i*6}–${(i+1)*6}d`,
    count: SIGNALS.filter(s => s.daysAgo >= i*6 && s.daysAgo < (i+1)*6).length
  })), []);

  const scoreColor = s => s >= 0.1 ? T.green : s <= -0.1 ? T.red : T.amber;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Total Signals" value={SIGNALS.length} sub="across all sources" color={T.purple} />
        <KpiCard label="Filtered" value={filtered.length} sub="matching active filters" color={T.blue} />
        <KpiCard label="Avg Raw Score" value={filtered.length ? (filtered.reduce((a, s) => a + s.raw_score, 0) / filtered.length).toFixed(3) : '0.000'} sub="credibility-unweighted" color={T.teal} />
        <KpiCard label="Avg Days Lag" value={filtered.length ? (filtered.reduce((a, s) => a + s.daysAgo, 0) / filtered.length).toFixed(1) : '0'} sub="ingestion recency" color={T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[{ label: 'Source', val: srcFilter, set: setSrcFilter, opts: ['All', ...SOURCES] },
          { label: 'Tier', val: tierFilter, set: setTierFilter, opts: ['All','1','2','3','4','5'] },
          { label: 'Pillar', val: pillarFilter, set: setPillarFilter, opts: ['All','E','S','G'] }].map(f => (
          <div key={f.label} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>{f.label}:</span>
            <select value={f.val} onChange={e => f.set(e.target.value)} style={{ fontSize: 11, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.fontMono, background: T.card }}>
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
          <SectionTitle>Signals by Source</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sourceStats} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9, fontFamily: T.fontMono }} />
              <YAxis type="category" dataKey="source" tick={{ fontSize: 8, fontFamily: T.fontMono }} width={60} />
              <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 10 }} />
              <Bar dataKey="count" fill={T.purple} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
          <SectionTitle>Tier Distribution</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={tierDist}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="tier" tick={{ fontSize: 10, fontFamily: T.fontMono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.fontMono }} />
              <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 10 }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {tierDist.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
          <SectionTitle>Ingestion Lag Histogram</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={lagHist}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="lag" tick={{ fontSize: 8, fontFamily: T.fontMono }} />
              <YAxis tick={{ fontSize: 9, fontFamily: T.fontMono }} />
              <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 10 }} />
              <Bar dataKey="count" fill={T.teal} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <SectionTitle>Live Signal Feed (last {Math.min(20, filtered.length)})</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.fontMono }}>
          <thead>
            <tr style={{ background: T.sub }}>
              {['ID','Entity','Source','Pillar','Tier','Raw Score','Days Ago','Headline'].map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 9, color: T.textSec, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...filtered].sort((a, b) => a.daysAgo - b.daysAgo).slice(0, 20).map((s, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.sub }}>
                <td style={{ padding: '6px 10px', color: T.textSec }}>{s.id}</td>
                <td style={{ padding: '6px 10px', color: T.navy, fontWeight: 600 }}>{s.entity}</td>
                <td style={{ padding: '6px 10px' }}><Tag color={T.blue}>{s.source}</Tag></td>
                <td style={{ padding: '6px 10px' }}><Tag color={s.pillar === 'E' ? T.green : s.pillar === 'S' ? T.purple : T.blue}>{s.pillar}</Tag></td>
                <td style={{ padding: '6px 10px', color: T.textSec }}>T{s.tier}</td>
                <td style={{ padding: '6px 10px' }}><Badge val={s.raw_score} /></td>
                <td style={{ padding: '6px 10px', color: T.textSec }}>{s.daysAgo}d</td>
                <td style={{ padding: '6px 10px', color: T.textSec, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10 }}>{s.headline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAB 3 — Preprocessing & Vectorization
══════════════════════════════════════════════════════════════════════════════ */
function TabPreprocessing() {
  const prepSteps = [
    { name: 'Tokenization', input: '"Company X announces 2030 net-zero targets, exceeding EU taxonomy thresholds."', output: '["company", "x", "announces", "2030", "net-zero", "targets", "exceeding", "eu", "taxonomy", "thresholds"]', note: 'WordPiece tokenizer; subword splits for OOV' },
    { name: 'Stop-word Removal', input: '["company","x","announces","2030","net-zero","targets","exceeding","eu","taxonomy","thresholds"]', output: '["company","x","announces","2030","net-zero","targets","exceeding","taxonomy","thresholds"]', note: 'Domain-aware stop list: 487 tokens incl. ESG boilerplate' },
    { name: 'Lemmatization', input: '["exceeding","announces","targets","thresholds"]', output: '["exceed","announce","target","threshold"]', note: 'spaCy en_core_web_lg; preserves domain acronyms' },
    { name: 'Negation Handling', input: '"company does not exceed targets and fails to meet benchmarks"', output: '["NOT_exceed","fail_meet","benchmark"]', note: 'Scope window: 3 tokens post-negation marker' },
    { name: 'Domain Term Expansion', input: '"SBTi","TCFD","GRI","SFDR","CSRD"', output: '"science_based_targets_initiative","task_force_climate_disclosure","global_reporting_initiative","sustainable_finance_disclosure_regulation","corporate_sustainability_reporting_directive"', note: 'ESG lexicon: 2,340 acronym expansions' },
    { name: 'Sentence Segmentation', input: '"Targets set. Emissions down 18%. Board approved plan."', output: '["Targets set.", "Emissions down 18%.", "Board approved plan."]', note: 'Punkt segmenter; avg doc: 8.4 sentences' }
  ];

  const tfidfTerms = useMemo(() => [
    'emission', 'target', 'carbon', 'net_zero', 'climate', 'governance', 'disclosure',
    'scope3', 'renewable', 'diversity', 'biodiversity', 'water', 'supply_chain',
    'taxonomy', 'tcfd', 'sbti', 'board', 'audit', 'compliance', 'transition'
  ].map((t, i) => ({ term: t, weight: parseFloat((0.95 - i * 0.03 + sr(i * 7) * 0.05).toFixed(3)) })), []);

  const scatterData = useMemo(() => Array.from({ length: 100 }, (_, i) => ({
    x: parseFloat(((sr(i * 7) * 8) - 4).toFixed(2)),
    y: parseFloat(((sr(i * 11) * 6) - 3).toFixed(2)),
    pillar: PILLARS[Math.floor(sr(i * 13) * 3)],
    entity: ENTITY_NAMES[Math.floor(sr(i * 17) * 8)]
  })), []);

  const pillarColors = { E: T.green, S: T.purple, G: T.blue };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard label="Corpus Size" value="128,450" sub="indexed documents" color={T.purple} />
        <KpiCard label="Unique Tokens" value="47,832" sub="post-lemmatization vocab" color={T.blue} />
        <KpiCard label="OOV Rate" value="3.2%" sub="out-of-vocabulary tokens" color={T.amber} />
        <KpiCard label="Avg Doc Length" value="184" sub="tokens per document" color={T.teal} />
      </div>

      <SectionTitle>Text Preprocessing Pipeline — Step Transforms</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {prepSteps.map((s, i) => (
          <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 6 }}>{i + 1}. {s.name}</div>
            <div style={{ fontSize: 10, color: T.textSec, marginBottom: 8 }}>{s.note}</div>
            <div style={{ background: T.sub, borderRadius: 5, padding: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: T.textSec, fontFamily: T.fontMono, marginBottom: 3 }}>INPUT</div>
              <div style={{ fontSize: 10, fontFamily: T.fontMono, color: T.navy, wordBreak: 'break-all' }}>{s.input}</div>
            </div>
            <div style={{ background: `${T.teal}10`, borderRadius: 5, padding: 8 }}>
              <div style={{ fontSize: 9, color: T.textSec, fontFamily: T.fontMono, marginBottom: 3 }}>OUTPUT</div>
              <div style={{ fontSize: 10, fontFamily: T.fontMono, color: T.teal, wordBreak: 'break-all' }}>{s.output}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>TF-IDF Term Weights (Top 20)</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tfidfTerms} layout="vertical" margin={{ left: 90 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 9, fontFamily: T.fontMono }} />
              <YAxis type="category" dataKey="term" tick={{ fontSize: 9, fontFamily: T.fontMono }} width={90} />
              <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 10 }} formatter={v => v.toFixed(3)} />
              <Bar dataKey="weight" fill={T.indigo} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Embedding Space — PCA(2D) Projection</SectionTitle>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            {Object.entries(pillarColors).map(([p, c]) => (
              <div key={p} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                <span style={{ fontSize: 10, fontFamily: T.fontMono, color: T.textSec }}>{p === 'E' ? 'Environmental' : p === 'S' ? 'Social' : 'Governance'}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" name="PC1" tick={{ fontSize: 9, fontFamily: T.fontMono }} label={{ value: 'PC-1', position: 'insideBottom', offset: -2, fontSize: 9 }} />
              <YAxis dataKey="y" name="PC2" tick={{ fontSize: 9, fontFamily: T.fontMono }} label={{ value: 'PC-2', angle: -90, position: 'insideLeft', fontSize: 9 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontFamily: T.fontMono, fontSize: 10 }} />
              {PILLARS.map(p => (
                <Scatter
                  key={p} name={p}
                  data={scatterData.filter(d => d.pillar === p)}
                  fill={pillarColors[p]}
                  opacity={0.7}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAB 4 — Classification Engine
══════════════════════════════════════════════════════════════════════════════ */
function TabClassification() {
  const [selectedModel, setSelectedModel] = useState(0);
  const model = MODELS[selectedModel];

  const CLASSES = ['Positive', 'Neutral', 'Negative'];

  const featureImportance = useMemo(() => [
    'emission_reduction', 'net_zero_commit', 'board_independence', 'scope3_disclosure',
    'greenwashing_flag', 'diversity_target', 'taxonomy_align', 'water_intensity',
    'supply_chain_audit', 'carbon_price', 'renewable_pct', 'sbti_validated',
    'controversy_flag', 'tcfd_align', 'gri_report'
  ].map((f, i) => ({
    feature: f,
    importance: parseFloat((0.92 - i * 0.04 + sr(i * 7 + selectedModel * 3) * 0.06).toFixed(3))
  })), [selectedModel]);

  const calibData = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    predicted: parseFloat(((i + 1) * 0.1 - 0.05).toFixed(2)),
    actual: parseFloat(((i + 1) * 0.1 - 0.05 + (sr(i * 7 + selectedModel * 11) - 0.5) * 0.08).toFixed(3))
  })), [selectedModel]);

  const misclassified = useMemo(() => Array.from({ length: 20 }, (_, i) => {
    const trueIdx = Math.floor(sr(i * 7) * 3);
    let predIdx = Math.floor(sr(i * 11) * 3);
    if (predIdx === trueIdx) predIdx = (predIdx + 1) % 3;
    return {
      id: `ERR-${String(i + 1).padStart(3, '0')}`,
      true_label: CLASSES[trueIdx],
      pred_label: CLASSES[predIdx],
      confidence: parseFloat((0.5 + sr(i * 13) * 0.3).toFixed(3)),
      headline: HEADLINES[Math.floor(sr(i * 17) * HEADLINES.length)]
    };
  }), [selectedModel]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {MODELS.map((m, i) => (
          <div
            key={i} onClick={() => setSelectedModel(i)}
            style={{ background: selectedModel === i ? T.purple : T.card, border: `2px solid ${selectedModel === i ? T.purple : T.border}`, borderRadius: 8, padding: '10px 16px', cursor: 'pointer', textAlign: 'center' }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: selectedModel === i ? '#fff' : T.navy }}>{m.name}</div>
            <div style={{ fontSize: 11, color: selectedModel === i ? '#ffffffbb' : T.textSec, fontFamily: T.fontMono }}>F1: {(m.f1 * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Accuracy" value={`${(model.accuracy * 100).toFixed(1)}%`} color={T.green} />
        <KpiCard label="Precision" value={`${(model.precision * 100).toFixed(1)}%`} color={T.blue} />
        <KpiCard label="Recall" value={`${(model.recall * 100).toFixed(1)}%`} color={T.teal} />
        <KpiCard label="F1 Score" value={`${(model.f1 * 100).toFixed(1)}%`} color={T.purple} />
        <KpiCard label="Latency" value={`${model.latency} ms`} sub="p50 inference" color={T.amber} />
        <KpiCard label="Trained" value={model.training_date} sub="last training date" color={T.textSec} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Confusion Matrix — {model.name}</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.fontMono }}>
            <thead>
              <tr>
                <th style={{ padding: '6px 8px', fontSize: 9, color: T.textSec }}>True \ Pred</th>
                {CLASSES.map(c => <th key={c} style={{ padding: '6px 8px', fontSize: 9, color: T.textSec }}>{c.slice(0, 3)}</th>)}
              </tr>
            </thead>
            <tbody>
              {model.confusionMatrix.map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: T.navy, fontSize: 10 }}>{CLASSES[i].slice(0, 3)}</td>
                  {row.map((val, j) => (
                    <td key={j} style={{ padding: '6px 8px', textAlign: 'center', background: i === j ? `${T.green}22` : `${T.red}11`, color: i === j ? T.green : T.red, fontWeight: i === j ? 700 : 400, borderRadius: 4 }}>
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Calibration Curve</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={calibData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="predicted" tick={{ fontSize: 9, fontFamily: T.fontMono }} label={{ value: 'Predicted Prob', position: 'insideBottom', offset: -2, fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9, fontFamily: T.fontMono }} domain={[0, 1]} />
              <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 10 }} formatter={v => v.toFixed(3)} />
              <ReferenceLine stroke={T.border} strokeDasharray="4 4" segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} />
              <Line type="monotone" dataKey="actual" stroke={T.purple} strokeWidth={2} dot={{ r: 3 }} name="Actual Prob" />
              <Line type="monotone" dataKey="predicted" stroke={T.border} strokeWidth={1} strokeDasharray="4 4" dot={false} name="Perfect Cal." />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Feature Importance (Top 15)</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={featureImportance.slice(0, 10)} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9, fontFamily: T.fontMono }} />
              <YAxis type="category" dataKey="feature" tick={{ fontSize: 8, fontFamily: T.fontMono }} width={100} />
              <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 10 }} formatter={v => v.toFixed(3)} />
              <Bar dataKey="importance" fill={T.indigo} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <SectionTitle>Error Analysis — 20 Misclassified Examples</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.fontMono }}>
          <thead>
            <tr style={{ background: T.sub }}>
              {['ID', 'True Label', 'Pred Label', 'Confidence', 'Headline'].map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 9, color: T.textSec, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {misclassified.map((m, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.sub }}>
                <td style={{ padding: '6px 10px', color: T.textSec }}>{m.id}</td>
                <td style={{ padding: '6px 10px' }}><Tag color={T.green}>{m.true_label}</Tag></td>
                <td style={{ padding: '6px 10px' }}><Tag color={T.red}>{m.pred_label}</Tag></td>
                <td style={{ padding: '6px 10px', color: T.amber, fontWeight: 700 }}>{m.confidence.toFixed(3)}</td>
                <td style={{ padding: '6px 10px', color: T.textSec, fontSize: 10, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.headline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAB 5 — Credibility Weighting & Decay
══════════════════════════════════════════════════════════════════════════════ */
function TabWeightingDecay() {
  const [selectedEntity, setSelectedEntity] = useState(ENTITY_NAMES[0]);
  const [selectedPillar, setSelectedPillar] = useState('E');
  const [tier3Weight, setTier3Weight] = useState(0.65);

  const tierRows = [
    { tier: 1, label: 'Regulatory Filing / Official Disclosure', weight: 1.00, examples: 'SEC, SEBI, FCA, ESMA filings' },
    { tier: 2, label: 'Premium Financial Media', weight: 0.85, examples: 'Bloomberg, FT, Reuters, WSJ' },
    { tier: 3, label: 'Industry Body / Analyst', weight: tier3Weight, examples: 'GRI, CDP, ESG rating agencies' },
    { tier: 4, label: 'General Press / NGO', weight: 0.45, examples: 'Press releases, NGO reports' },
    { tier: 5, label: 'Social Media / Unverified', weight: 0.25, examples: 'Twitter/X, Reddit, forums' }
  ];

  const entitySignals = useMemo(() => {
    const sigs = SIGNALS.filter(s => s.entity === selectedEntity && s.pillar === selectedPillar);
    return [...sigs].sort((a, b) => {
      const wa = a.raw_score * (a.tier === 3 ? tier3Weight : TIER_WEIGHTS[a.tier]);
      const wb = b.raw_score * (b.tier === 3 ? tier3Weight : TIER_WEIGHTS[b.tier]);
      return wb - wa;
    });
  }, [selectedEntity, selectedPillar, tier3Weight]);

  const compositeByEntity = useMemo(() => ENTITY_NAMES.map(e => {
    const sigs = SIGNALS.filter(s => s.entity === e);
    const weighted = sigs.length ? sigs.reduce((acc, s) => {
      const w = s.tier === 3 ? tier3Weight : TIER_WEIGHTS[s.tier];
      return acc + s.raw_score * w;
    }, 0) / sigs.length : 0;
    return { entity: e.split(' ')[0], raw: parseFloat((sigs.length ? sigs.reduce((a, s) => a + s.raw_score, 0) / sigs.length : 0).toFixed(3)), weighted: parseFloat(weighted.toFixed(3)) };
  }), [tier3Weight]);

  const decayCurve = useMemo(() => Array.from({ length: 91 }, (_, d) => {
    const row = { day: d };
    DECAY_TYPES.forEach(dt => {
      row[dt.label] = parseFloat(Math.exp(-Math.log(2) / dt.halfLife * d).toFixed(4));
    });
    return row;
  }), []);

  const DECAY_COLORS = [T.red, T.orange, T.amber, T.green, T.teal, T.indigo];

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Tier 1 Weight" value="1.000" sub="Regulatory / Official" color={T.green} />
        <KpiCard label="Tier 3 Weight" value={tier3Weight.toFixed(2)} sub="Industry Body / Analyst" color={T.amber} />
        <KpiCard label="Tier 5 Weight" value="0.250" sub="Social / Unverified" color={T.red} />
        <KpiCard label="Max IC Decay" value="365d" sub="Chronic signal half-life" color={T.blue} />
      </div>

      <SectionTitle>5-Tier Credibility Model</SectionTitle>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.fontMono }}>
          <thead>
            <tr style={{ background: T.sub }}>
              {['Tier', 'Category', 'IC Weight', 'Example Sources'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: T.textSec, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tierRows.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                <td style={{ padding: '9px 12px' }}><Tag color={[T.green,T.teal,T.blue,T.amber,T.red][i]}>T{r.tier}</Tag></td>
                <td style={{ padding: '9px 12px', fontWeight: 600, color: T.navy }}>{r.label}</td>
                <td style={{ padding: '9px 12px', color: T.purple, fontWeight: 700, fontSize: 15 }}>{r.weight.toFixed(2)}</td>
                <td style={{ padding: '9px 12px', color: T.textSec }}>{r.examples}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>IC Decay Curves (6 half-life presets)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={decayCurve.filter((_, i) => i % 3 === 0)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: T.fontMono }} label={{ value: 'Days', position: 'insideBottom', offset: -2, fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9, fontFamily: T.fontMono }} domain={[0, 1]} label={{ value: 'Decay Factor', angle: -90, position: 'insideLeft', fontSize: 9 }} />
              <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 10 }} formatter={v => v.toFixed(4)} />
              <Legend wrapperStyle={{ fontSize: 9, fontFamily: T.fontMono }} />
              {DECAY_TYPES.map((dt, i) => (
                <Line key={dt.label} type="monotone" dataKey={dt.label} stroke={DECAY_COLORS[i]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Raw vs Weighted Score by Entity</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={compositeByEntity}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="entity" tick={{ fontSize: 9, fontFamily: T.fontMono }} />
              <YAxis tick={{ fontSize: 9, fontFamily: T.fontMono }} domain={[-0.5, 0.5]} />
              <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 10 }} formatter={v => v.toFixed(3)} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: T.fontMono }} />
              <ReferenceLine y={0} stroke={T.border} />
              <Bar dataKey="raw" fill={T.blue} opacity={0.6} name="Raw Score" />
              <Bar dataKey="weighted" fill={T.purple} name="Weighted Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <SectionTitle>What-If: Tier 3 Weight Adjustment</SectionTitle>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontFamily: T.fontMono, color: T.navy }}>Tier 3 Weight: <strong style={{ color: T.purple }}>{tier3Weight.toFixed(2)}</strong></span>
          <input type="range" min={0.40} max={0.80} step={0.01} value={tier3Weight}
            onChange={e => setTier3Weight(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: T.purple }} />
          <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.textSec }}>0.40 ← → 0.80</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select value={selectedEntity} onChange={e => setSelectedEntity(e.target.value)} style={{ fontSize: 11, padding: '5px 10px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.fontMono, background: T.card }}>
            {ENTITY_NAMES.map(e => <option key={e}>{e}</option>)}
          </select>
          <select value={selectedPillar} onChange={e => setSelectedPillar(e.target.value)} style={{ fontSize: 11, padding: '5px 10px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.fontMono, background: T.card }}>
            {PILLARS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.fontMono }}>
          <thead>
            <tr style={{ background: T.sub }}>
              {['Signal ID','Source','Tier','Raw Score','Credibility','Weighted Score'].map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 9, color: T.textSec, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entitySignals.slice(0, 15).map((s, i) => {
              const cred = s.tier === 3 ? tier3Weight : TIER_WEIGHTS[s.tier];
              const ws = s.raw_score * cred;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.sub }}>
                  <td style={{ padding: '6px 10px', color: T.textSec }}>{s.id}</td>
                  <td style={{ padding: '6px 10px' }}><Tag color={T.blue}>{s.source}</Tag></td>
                  <td style={{ padding: '6px 10px', color: T.textSec }}>T{s.tier}</td>
                  <td style={{ padding: '6px 10px' }}><Badge val={s.raw_score} /></td>
                  <td style={{ padding: '6px 10px', color: T.purple, fontWeight: 700 }}>{cred.toFixed(2)}</td>
                  <td style={{ padding: '6px 10px' }}><Badge val={parseFloat(ws.toFixed(3))} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAB 6 — EWMA Aggregation
══════════════════════════════════════════════════════════════════════════════ */
function TabEWMA() {
  const [selectedEntity, setSelectedEntity] = useState(ENTITY_NAMES[0]);
  const [lambda, setLambda] = useState(0.10);

  const LAMBDAS = [0.05, 0.10, 0.20, 0.30];
  const STAKEHOLDERS = [
    { name: 'Investor', weight: 0.20 }, { name: 'Regulator', weight: 0.18 },
    { name: 'Employee', weight: 0.15 }, { name: 'Customer', weight: 0.14 },
    { name: 'Media', weight: 0.12 }, { name: 'NGO', weight: 0.08 },
    { name: 'Community', weight: 0.07 }, { name: 'Supplier', weight: 0.06 }
  ];

  const ewmaData = useMemo(() => {
    const entityIdx = ENTITY_NAMES.indexOf(selectedEntity);
    return Array.from({ length: 90 }, (_, d) => {
      const row = { day: d + 1 };
      PILLARS.forEach((p, pi) => {
        const seed = entityIdx * 10000 + pi * 1000 + d;
        const rawScore = parseFloat(((sr(seed) * 2) - 1).toFixed(3));
        row[`${p}_raw`] = rawScore;
      });
      return row;
    }).reduce((acc, row, i) => {
      const prev = i > 0 ? acc[i - 1] : null;
      PILLARS.forEach(p => {
        row[`${p}_ewma`] = prev
          ? parseFloat((lambda * row[`${p}_raw`] + (1 - lambda) * prev[`${p}_ewma`]).toFixed(4))
          : row[`${p}_raw`];
        row[`${p}_upper`] = parseFloat((row[`${p}_ewma`] + 0.15).toFixed(4));
        row[`${p}_lower`] = parseFloat((row[`${p}_ewma`] - 0.15).toFixed(4));
      });
      acc.push(row);
      return acc;
    }, []);
  }, [selectedEntity, lambda]);

  const stakeholderContrib = useMemo(() => STAKEHOLDERS.map((sk, i) => {
    const entityIdx = ENTITY_NAMES.indexOf(selectedEntity);
    const sigCount = Math.round(4 + sr(entityIdx * 100 + i) * 12);
    return { name: sk.name, weight: sk.weight, signals: sigCount, contribution: parseFloat((sk.weight * sigCount).toFixed(2)) };
  }), [selectedEntity]);

  const displayData = ewmaData.filter((_, i) => i % 3 === 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.textSec }}>Entity:</span>
        <select value={selectedEntity} onChange={e => setSelectedEntity(e.target.value)} style={{ fontSize: 11, padding: '5px 10px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.fontMono, background: T.card }}>
          {ENTITY_NAMES.map(e => <option key={e}>{e}</option>)}
        </select>
        <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.textSec, marginLeft: 8 }}>λ (smoothing):</span>
        {LAMBDAS.map(l => (
          <button key={l} onClick={() => setLambda(l)} style={{ padding: '4px 10px', borderRadius: 4, border: `2px solid ${lambda === l ? T.purple : T.border}`, background: lambda === l ? T.purple : T.card, color: lambda === l ? '#fff' : T.navy, fontFamily: T.fontMono, fontSize: 11, cursor: 'pointer' }}>
            λ={l}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {PILLARS.map(p => {
          const last = ewmaData[ewmaData.length - 1];
          return <KpiCard key={p} label={`${p === 'E' ? 'Environmental' : p === 'S' ? 'Social' : 'Governance'} EWMA`} value={(last ? last[`${p}_ewma`] : 0).toFixed(3)} sub={`λ=${lambda} | 90-day series`} color={p === 'E' ? T.green : p === 'S' ? T.purple : T.blue} />;
        })}
        <KpiCard label="Composite EWMA" value={(ewmaData.length ? (PILLARS.reduce((a, p) => a + ewmaData[ewmaData.length - 1][`${p}_ewma`], 0) / 3) : 0).toFixed(3)} sub="equal-weighted E+S+G" color={T.navy} />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <SectionTitle>E/S/G EWMA Time Series with 2σ Confidence Bands — {selectedEntity}</SectionTitle>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          {[['E', T.green, 'Environmental'], ['S', T.purple, 'Social'], ['G', T.blue, 'Governance']].map(([p, c, label]) => (
            <div key={p} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <div style={{ width: 20, height: 2, background: c }} />
              <span style={{ fontSize: 10, fontFamily: T.fontMono, color: T.textSec }}>{label}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={displayData}>
            <defs>
              {[['E', T.green], ['S', T.purple], ['G', T.blue]].map(([p, c]) => (
                <linearGradient key={p} id={`grad${p}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={c} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: T.fontMono }} label={{ value: 'Day', position: 'insideBottom', offset: -2, fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9, fontFamily: T.fontMono }} domain={[-0.8, 0.8]} />
            <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 10 }} formatter={v => typeof v === 'number' ? v.toFixed(4) : v} />
            <ReferenceLine y={0} stroke={T.border} strokeDasharray="3 3" />
            {[['E', T.green], ['S', T.purple], ['G', T.blue]].map(([p, c]) => (
              <React.Fragment key={p}>
                <Area type="monotone" dataKey={`${p}_upper`} stroke="none" fill={`url(#grad${p})`} fillOpacity={0.3} legendType="none" />
                <Area type="monotone" dataKey={`${p}_lower`} stroke="none" fill={T.bg} legendType="none" />
                <Line type="monotone" dataKey={`${p}_ewma`} stroke={c} strokeWidth={2} dot={false} name={`${p}-EWMA`} />
              </React.Fragment>
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Stakeholder-Weighted Signal Contribution — {selectedEntity}</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stakeholderContrib}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: T.fontMono }} />
            <YAxis tick={{ fontSize: 9, fontFamily: T.fontMono }} />
            <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 10 }} formatter={v => typeof v === 'number' ? v.toFixed(2) : v} />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: T.fontMono }} />
            <Bar dataKey="contribution" fill={T.purple} name="Weight × Signal Count" radius={[3, 3, 0, 0]}>
              {stakeholderContrib.map((_, i) => <Cell key={i} fill={[T.purple, T.indigo, T.blue, T.teal, T.green, T.sage, T.amber, T.orange][i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {stakeholderContrib.map((sk, i) => (
            <div key={i} style={{ background: T.sub, borderRadius: 6, padding: '6px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.navy }}>{sk.name}</span>
              <Tag color={T.purple}>{(sk.weight * 100).toFixed(0)}%</Tag>
              <span style={{ fontSize: 10, color: T.textSec, fontFamily: T.fontMono }}>{sk.signals} sigs</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAB 7 — Velocity Alerts & Monitoring
══════════════════════════════════════════════════════════════════════════════ */
function TabAlerts() {
  const [watchThreshold, setWatchThreshold] = useState(-0.30);
  const [elevatedThreshold, setElevatedThreshold] = useState(-0.50);
  const [sortCol, setSortCol] = useState('score');

  const levelColor = l => ({ Watch: T.amber, Elevated: T.orange, Critical: T.red, Extreme: '#7f1d1d' }[l] || T.textSec);
  const dirColor = d => d === 'Deteriorating' ? T.red : T.green;

  const alertCounts = ['Watch', 'Elevated', 'Critical', 'Extreme'].map(l => ({
    level: l, count: ALERTS.filter(a => a.level === l).length, fill: levelColor(l)
  }));

  const timelineData = useMemo(() => Array.from({ length: 90 }, (_, d) => ({
    day: d + 1,
    Watch: Math.round(2 + sr(d * 7) * 4),
    Elevated: Math.round(1 + sr(d * 11) * 3),
    Critical: Math.round(sr(d * 13) * 2),
    Extreme: Math.round(sr(d * 17) * 1.2)
  })), []);

  const entityAlertFreq = useMemo(() => ENTITY_NAMES.map(e => ({
    entity: e.split(' ')[0],
    count: ALERTS.filter(a => a.entity === e).length
  })), []);

  const adjustedAlerts = useMemo(() => ALERTS.filter(a =>
    a.score <= watchThreshold
  ), [watchThreshold]);

  const sorted = useMemo(() => [...ALERTS].sort((a, b) => {
    if (sortCol === 'score') return a.score - b.score;
    if (sortCol === 'days') return b.daysInAlert - a.daysInAlert;
    return a.entity.localeCompare(b.entity);
  }), [sortCol]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {alertCounts.map(({ level, count, fill }) => (
          <KpiCard key={level} label={`${level} Alerts`} value={count} sub={`${level.toLowerCase()} threshold breached`} color={fill} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Alert Distribution by Tier</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={alertCounts}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="level" tick={{ fontSize: 10, fontFamily: T.fontMono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.fontMono }} />
              <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 10 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {alertCounts.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Entity Alert Frequency</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={entityAlertFreq}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="entity" tick={{ fontSize: 9, fontFamily: T.fontMono }} />
              <YAxis tick={{ fontSize: 10, fontFamily: T.fontMono }} />
              <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 10 }} />
              <Bar dataKey="count" fill={T.purple} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <SectionTitle>Alert Timeline — 90-Day Daily Count</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={timelineData.filter((_, i) => i % 3 === 0)}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: T.fontMono }} />
            <YAxis tick={{ fontSize: 9, fontFamily: T.fontMono }} />
            <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 10 }} />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: T.fontMono }} />
            {['Watch', 'Elevated', 'Critical', 'Extreme'].map((l, i) => (
              <Area key={l} type="monotone" dataKey={l} stroke={levelColor(l)} fill={`${levelColor(l)}22`} strokeWidth={2} dot={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionTitle>What-If: Threshold Adjustment</SectionTitle>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, fontFamily: T.fontMono, color: T.textSec, marginBottom: 6 }}>Watch Threshold: <strong style={{ color: T.amber }}>{watchThreshold.toFixed(2)}</strong></div>
            <input type="range" min={-0.60} max={-0.10} step={0.01} value={watchThreshold} onChange={e => setWatchThreshold(parseFloat(e.target.value))} style={{ width: '100%', accentColor: T.amber }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, fontFamily: T.fontMono, color: T.textSec, marginBottom: 6 }}>Elevated Threshold: <strong style={{ color: T.orange }}>{elevatedThreshold.toFixed(2)}</strong></div>
            <input type="range" min={-0.80} max={-0.30} step={0.01} value={elevatedThreshold} onChange={e => setElevatedThreshold(parseFloat(e.target.value))} style={{ width: '100%', accentColor: T.orange }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ background: T.sub, borderRadius: 6, padding: '8px 16px', fontFamily: T.fontMono, fontSize: 12 }}>
              <span style={{ color: T.textSec }}>Alerts at ≤ Watch: </span><strong style={{ color: T.purple }}>{adjustedAlerts.length}</strong>
            </div>
          </div>
        </div>
      </div>

      <SectionTitle>Active Alerts — Sort by:
        <span style={{ marginLeft: 8, gap: 6, display: 'inline-flex' }}>
          {[['score','Score'],['days','Days Active'],['entity','Entity']].map(([v,l]) => (
            <button key={v} onClick={() => setSortCol(v)} style={{ padding: '2px 8px', fontSize: 10, borderRadius: 4, border: `1px solid ${sortCol === v ? T.purple : T.border}`, background: sortCol === v ? T.purple : T.card, color: sortCol === v ? '#fff' : T.textSec, cursor: 'pointer', fontFamily: T.fontMono }}>{l}</button>
          ))}
        </span>
      </SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.fontMono }}>
          <thead>
            <tr style={{ background: T.sub }}>
              {['ID','Entity','Pillar','Level','Score','Direction','Days in Alert','Recommended Action'].map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 9, color: T.textSec, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((a, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.sub }}>
                <td style={{ padding: '6px 10px', color: T.textSec }}>{a.id}</td>
                <td style={{ padding: '6px 10px', color: T.navy, fontWeight: 600 }}>{a.entity}</td>
                <td style={{ padding: '6px 10px' }}><Tag color={a.pillar === 'E' ? T.green : a.pillar === 'S' ? T.purple : T.blue}>{a.pillar}</Tag></td>
                <td style={{ padding: '6px 10px' }}><Tag color={levelColor(a.level)}>{a.level}</Tag></td>
                <td style={{ padding: '6px 10px' }}><Badge val={a.score} /></td>
                <td style={{ padding: '6px 10px', color: dirColor(a.direction), fontWeight: 600 }}>{a.direction}</td>
                <td style={{ padding: '6px 10px', color: T.textSec }}>{a.daysInAlert}d</td>
                <td style={{ padding: '6px 10px', color: T.textSec, fontSize: 10, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAB 8 — Model Performance & MLOps
══════════════════════════════════════════════════════════════════════════════ */
function TabMLOps() {
  const MONTHS = ['Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25'];

  const accuracyDrift = useMemo(() => MONTHS.map((m, mi) => {
    const row = { month: m };
    MODELS.forEach((mdl, i) => {
      row[mdl.name] = parseFloat((mdl.accuracy - 0.05 + mi * 0.01 + sr(mi * 7 + i * 3) * 0.02).toFixed(4));
    });
    return row;
  }), []);

  const dataQuality = useMemo(() => Array.from({ length: 90 }, (_, d) => ({
    day: d + 1,
    schema_violations: Math.round(sr(d * 7) * 8),
    oov_rate: parseFloat((2.5 + sr(d * 11) * 2).toFixed(2)),
    pos_ratio: parseFloat((0.32 + sr(d * 13) * 0.1).toFixed(3)),
    neu_ratio: parseFloat((0.45 + sr(d * 17) * 0.08).toFixed(3)),
    neg_ratio: parseFloat((0.23 + sr(d * 19) * 0.1).toFixed(3))
  })), []);

  const latencyData = useMemo(() => Array.from({ length: 90 }, (_, d) => ({
    day: d + 1,
    p50: Math.round(35 + sr(d * 7) * 10),
    p95: Math.round(85 + sr(d * 11) * 25),
    p99: Math.round(140 + sr(d * 13) * 40)
  })), []);

  const ksDrift = useMemo(() => Array.from({ length: 90 }, (_, d) => ({
    day: d + 1,
    score_drift: parseFloat((0.04 + sr(d * 7) * 0.12).toFixed(4)),
    vocab_drift: parseFloat((0.02 + sr(d * 11) * 0.08).toFixed(4)),
    label_drift: parseFloat((0.03 + sr(d * 13) * 0.10).toFixed(4))
  })), []);

  const abTests = [
    { name: 'FinBERT v3.1 vs v3.2', metric: 'F1', modelA: 0.918, modelB: 0.936, winner: 'v3.2', winRate: 0.73, pValue: 0.021 },
    { name: 'RoBERTa vs LSTM on S-pillar', metric: 'Recall', modelA: 0.876, modelB: 0.903, winner: 'RoBERTa', winRate: 0.68, pValue: 0.038 },
    { name: 'Ensemble vs FinBERT-only', metric: 'Accuracy', modelA: 0.936, modelB: 0.941, winner: 'Ensemble', winRate: 0.81, pValue: 0.009 }
  ];

  const MODEL_COLORS = [T.purple, T.blue, T.teal, T.amber, T.green];

  const displayDrift = ksDrift.filter((_, i) => i % 3 === 0);
  const displayLatency = latencyData.filter((_, i) => i % 3 === 0);
  const displayQuality = dataQuality.filter((_, i) => i % 5 === 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Retraining Events" value={RETRAINING_LOG.length} sub="last 6 months" color={T.purple} />
        <KpiCard label="Best Model F1" value={`${(Math.max(...MODELS.map(m => m.f1)) * 100).toFixed(1)}%`} sub="FinBERT v3.2" color={T.green} />
        <KpiCard label="Avg Latency p50" value="38 ms" sub="production ensemble" color={T.blue} />
        <KpiCard label="OOV Rate (7d)" value="3.2%" sub="below 5% threshold" color={T.teal} />
        <KpiCard label="A/B Tests Active" value={abTests.length} sub="ongoing experiments" color={T.amber} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Accuracy Drift — 6-Month Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={accuracyDrift}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: T.fontMono }} />
              <YAxis tick={{ fontSize: 9, fontFamily: T.fontMono }} domain={[0.75, 0.96]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
              <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 10 }} formatter={v => `${(v * 100).toFixed(1)}%`} />
              <Legend wrapperStyle={{ fontSize: 9, fontFamily: T.fontMono }} />
              {MODELS.map((m, i) => (
                <Line key={m.name} type="monotone" dataKey={m.name} stroke={MODEL_COLORS[i]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>KS Drift Statistics — Feature Distributions</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={displayDrift}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: T.fontMono }} />
              <YAxis tick={{ fontSize: 9, fontFamily: T.fontMono }} />
              <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 10 }} formatter={v => v.toFixed(4)} />
              <Legend wrapperStyle={{ fontSize: 9, fontFamily: T.fontMono }} />
              <ReferenceLine y={0.15} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Alert threshold', fontSize: 8, fill: T.red }} />
              <Line type="monotone" dataKey="score_drift" stroke={T.purple} strokeWidth={2} dot={false} name="Score KS" />
              <Line type="monotone" dataKey="vocab_drift" stroke={T.blue} strokeWidth={2} dot={false} name="Vocab KS" />
              <Line type="monotone" dataKey="label_drift" stroke={T.amber} strokeWidth={2} dot={false} name="Label KS" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>SLA Latency Tracking — p50/p95/p99 (ms)</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={displayLatency}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: T.fontMono }} />
              <YAxis tick={{ fontSize: 9, fontFamily: T.fontMono }} />
              <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 10 }} formatter={v => `${v} ms`} />
              <Legend wrapperStyle={{ fontSize: 9, fontFamily: T.fontMono }} />
              <ReferenceLine y={200} stroke={T.red} strokeDasharray="4 4" label={{ value: 'SLA limit', fontSize: 8, fill: T.red }} />
              <Line type="monotone" dataKey="p50" stroke={T.green} strokeWidth={2} dot={false} name="p50" />
              <Line type="monotone" dataKey="p95" stroke={T.amber} strokeWidth={2} dot={false} name="p95" />
              <Line type="monotone" dataKey="p99" stroke={T.red} strokeWidth={2} dot={false} name="p99" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Data Quality Monitoring</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={displayQuality}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: T.fontMono }} />
              <YAxis tick={{ fontSize: 9, fontFamily: T.fontMono }} />
              <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 10 }} formatter={v => typeof v === 'number' ? v.toFixed(2) : v} />
              <Legend wrapperStyle={{ fontSize: 9, fontFamily: T.fontMono }} />
              <Line type="monotone" dataKey="schema_violations" stroke={T.red} strokeWidth={2} dot={false} name="Schema Violations" />
              <Line type="monotone" dataKey="oov_rate" stroke={T.amber} strokeWidth={2} dot={false} name="OOV Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Retraining Log</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, fontFamily: T.fontMono }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Date', 'Model', 'Ver.', 'Trigger', 'Δ Acc'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 9, color: T.textSec, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RETRAINING_LOG.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.sub }}>
                    <td style={{ padding: '5px 8px', color: T.textSec }}>{r.date}</td>
                    <td style={{ padding: '5px 8px', color: T.navy, fontWeight: 600 }}>{r.model}</td>
                    <td style={{ padding: '5px 8px', color: T.textSec }}>{r.version}</td>
                    <td style={{ padding: '5px 8px', color: T.textSec, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.trigger}</td>
                    <td style={{ padding: '5px 8px', color: r.delta >= 0 ? T.green : T.red, fontWeight: 700 }}>{r.delta >= 0 ? '+' : ''}{(r.delta * 100).toFixed(1)}pp</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>A/B Test Results</SectionTitle>
          {abTests.map((t, i) => (
            <div key={i} style={{ background: T.sub, borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{t.name}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <Tag color={T.blue}>Metric: {t.metric}</Tag>
                <Tag color={T.green}>Winner: {t.winner}</Tag>
                <Tag color={T.purple}>Win Rate: {(t.winRate * 100).toFixed(0)}%</Tag>
                <Tag color={t.pValue < 0.05 ? T.green : T.amber}>p={t.pValue.toFixed(3)}</Tag>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: T.textSec, fontFamily: T.fontMono, marginBottom: 2 }}>MODEL A</div>
                  <div style={{ background: T.blue, height: 8, borderRadius: 4, width: `${t.modelA * 100}%` }} />
                  <div style={{ fontSize: 10, fontFamily: T.fontMono, color: T.blue }}>{(t.modelA * 100).toFixed(1)}%</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: T.textSec, fontFamily: T.fontMono, marginBottom: 2 }}>MODEL B</div>
                  <div style={{ background: T.green, height: 8, borderRadius: 4, width: `${t.modelB * 100}%` }} />
                  <div style={{ fontSize: 10, fontFamily: T.fontMono, color: T.green }}>{(t.modelB * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'architecture', label: 'Pipeline Architecture' },
  { id: 'ingestion', label: 'Signal Ingestion' },
  { id: 'preprocessing', label: 'Preprocessing & Vectorization' },
  { id: 'classification', label: 'Classification Engine' },
  { id: 'weighting', label: 'Credibility Weighting & Decay' },
  { id: 'ewma', label: 'EWMA Aggregation' },
  { id: 'alerts', label: 'Velocity Alerts & Monitoring' },
  { id: 'mlops', label: 'Model Performance & MLOps' }
];

export default function SentimentPipelinePage() {
  const [activeTab, setActiveTab] = useState('architecture');

  const renderTab = () => {
    switch (activeTab) {
      case 'architecture': return <TabPipelineArchitecture />;
      case 'ingestion': return <TabSignalIngestion />;
      case 'preprocessing': return <TabPreprocessing />;
      case 'classification': return <TabClassification />;
      case 'weighting': return <TabWeightingDecay />;
      case 'ewma': return <TabEWMA />;
      case 'alerts': return <TabAlerts />;
      case 'mlops': return <TabMLOps />;
      default: return null;
    }
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.purple}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: T.fontMono, color: T.purple, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>EP-BD2 · Sprint BD · ESG Intelligence</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', letterSpacing: -0.5 }}>ESG Sentiment Pipeline Engine</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              8-stage NLP pipeline · EWMA aggregation · credibility-weighted IC decay · velocity alert system
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#64748b', fontFamily: T.fontMono, textTransform: 'uppercase' }}>Signals Processed</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.purple }}>128,450</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#64748b', fontFamily: T.fontMono, textTransform: 'uppercase' }}>Active Alerts</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.amber }}>30</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#64748b', fontFamily: T.fontMono, textTransform: 'uppercase' }}>Best F1</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#4ade80' }}>92.4%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '0 32px', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '14px 18px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 400,
            color: activeTab === tab.id ? T.purple : T.textSec, borderBottom: activeTab === tab.id ? `3px solid ${T.purple}` : '3px solid transparent',
            whiteSpace: 'nowrap', transition: 'all 0.15s'
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 32px', maxWidth: 1400 }}>
        {renderTab()}
      </div>
    </div>
  );
}
