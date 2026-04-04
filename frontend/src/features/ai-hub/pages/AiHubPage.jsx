import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

/* ── Theme ─────────────────────────────────────────────────────── */
const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7',
  border: '#e5e0d8', borderL: '#d5cfc5',
  navy: '#1b3a5c', navyL: '#2c5a8c',
  gold: '#c5a96a', goldL: '#d4be8a',
  sage: '#5a8a6a', sageL: '#7ba67d',
  teal: '#5a8a6a', text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706',
  blue: '#2563eb', orange: '#ea580c', purple: '#7c3aed',
  font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
let _sc = 7000;

/* ── 9 AI Modules ────────────────────────────────────────────── */
const AI_MODULES = [
  { id: 'ep-w1',  code: 'EP-W1',  name: 'ESG Report Parser',         route: '/ai-hub/esg-report-parser',        category: 'NLP',    status: 'active',  lastRun: '2m ago',   accuracy: 89.2, throughput: 47, alertCount: 3,  modelType: 'NLP/NER',         trainedOn: '2026-03-22', samples: 12470, inferenceMs: 340 },
  { id: 'ep-w2',  code: 'EP-W2',  name: 'Predictive ESG',            route: '/ai-hub/predictive-esg',           category: 'ML',     status: 'active',  lastRun: '5m ago',   accuracy: 84.7, throughput: 31, alertCount: 1,  modelType: 'Gradient Boost',  trainedOn: '2026-03-20', samples: 23400, inferenceMs: 210 },
  { id: 'ep-bl1', code: 'EP-BL1', name: 'ML Risk Scorer',            route: '/ml-analytics/ml-risk-scorer',    category: 'ML',     status: 'active',  lastRun: '1m ago',   accuracy: 91.5, throughput: 62, alertCount: 5,  modelType: 'Random Forest',   trainedOn: '2026-03-24', samples: 31800, inferenceMs: 180 },
  { id: 'ep-bl2', code: 'EP-BL2', name: 'NLP Disclosure Parser',     route: '/ml-analytics/nlp-disclosure',    category: 'NLP',    status: 'running', lastRun: '0m ago',   accuracy: 87.3, throughput: 28, alertCount: 2,  modelType: 'BERT-finetune',   trainedOn: '2026-03-21', samples: 8900,  inferenceMs: 520 },
  { id: 'ep-bd1', code: 'EP-BD1', name: 'Greenium Signal',           route: '/quant-esg/greenium-signal',      category: 'Signal', status: 'active',  lastRun: '8m ago',   accuracy: 78.9, throughput: 19, alertCount: 4,  modelType: 'Time-Series',     trainedOn: '2026-03-18', samples: 15600, inferenceMs: 95  },
  { id: 'ep-bd2', code: 'EP-BD2', name: 'Sentiment Pipeline',        route: '/quant-esg/sentiment-pipeline',   category: 'Signal', status: 'active',  lastRun: '3m ago',   accuracy: 82.1, throughput: 88, alertCount: 0,  modelType: 'FinBERT',         trainedOn: '2026-03-25', samples: 44200, inferenceMs: 145 },
  { id: 'ep-by1', code: 'EP-BY1', name: 'LLM ESG Extractor',         route: '/ai-hub/llm-esg-extractor',       category: 'LLM',    status: 'running', lastRun: '0m ago',   accuracy: 93.8, throughput: 14, alertCount: 0,  modelType: 'LLM/RAG',         trainedOn: '2026-03-28', samples: 6700,  inferenceMs: 1840},
  { id: 'ep-by2', code: 'EP-BY2', name: 'Greenwashing Detection',    route: '/ai-hub/greenwashing-detection',  category: 'LLM',    status: 'active',  lastRun: '12m ago',  accuracy: 88.4, throughput: 22, alertCount: 7,  modelType: 'LLM/Classifier',  trainedOn: '2026-03-26', samples: 9300,  inferenceMs: 1320},
  { id: 'ep-by3', code: 'EP-BY3', name: 'ESG Narrative Intelligence', route: '/ai-hub/esg-narrative',          category: 'LLM',    status: 'idle',    lastRun: '47m ago',  accuracy: 85.6, throughput: 9,  alertCount: 1,  modelType: 'LLM/Generation',  trainedOn: '2026-03-27', samples: 4100,  inferenceMs: 2100},
];

const CAT_COLOR = { NLP: T.blue, ML: T.sage, LLM: T.navy, Signal: T.gold };
const STATUS_COLOR = { active: T.green, running: T.amber, idle: T.textMut };

/* ── 15 companies ────────────────────────────────────────────── */
const COMPANIES = [
  'Reliance Industries','TCS','HDFC Bank','Infosys','Shell plc',
  'Apple Inc.','Microsoft','JPMorgan','BHP Group','Enel SpA',
  'Nestle SA','Samsung','Volkswagen','BP plc','Siemens AG'
];

/* ── Signal bus: 40 signals ─────────────────────────────────── */
const SIGNAL_TYPES = [
  'ESG Score Update','Greenwashing Flag','Sentiment Shift','Risk Score Spike',
  'Disclosure Gap','Narrative Arc Change','Greenium Expansion','Extraction Complete',
  'Anomaly Detected','NLP Coverage Update'
];

const SIGNALS = Array.from({ length: 40 }, (_, i) => {
  const mod = AI_MODULES[i % 9];
  const company = COMPANIES[Math.floor(sr(i * 3) * 15)];
  const direction = sr(i * 7) > 0.5 ? 'up' : 'down';
  const value = (sr(i * 11) * 40 + 50).toFixed(1);
  const confidence = (sr(i * 13) * 25 + 70).toFixed(1);
  const minsAgo = Math.floor(sr(i * 17) * 120);
  const sigType = SIGNAL_TYPES[i % SIGNAL_TYPES.length];
  const actionable = sr(i * 19) > 0.6;
  return { id: `SIG-${1000 + i}`, module: mod.code, moduleName: mod.name, category: mod.category, company, signalType: sigType, value: parseFloat(value), direction, confidence: parseFloat(confidence), timestamp: `${minsAgo}m ago`, actionable, minsAgo };
});

/* ── 15 Alerts ───────────────────────────────────────────────── */
const ALERTS = [
  { id: 'ALT-001', module: 'EP-BY2', company: 'Shell plc',           severity: 'critical', msg: 'Greenwashing score 87 — claims exceed disclosed scope 3 data',   time: '4m ago' },
  { id: 'ALT-002', module: 'EP-BL1', company: 'Volkswagen',          severity: 'high',     msg: 'ML risk score spiked +18 pts — supply chain controversy signal',  time: '9m ago' },
  { id: 'ALT-003', module: 'EP-W1',  company: 'BP plc',              severity: 'high',     msg: 'Disclosure parser: 3 material gaps vs prior year report',         time: '11m ago' },
  { id: 'ALT-004', module: 'EP-BD2', company: 'JPMorgan',            severity: 'medium',   msg: 'Sentiment turned negative after Q1 earnings call transcript',     time: '15m ago' },
  { id: 'ALT-005', module: 'EP-BY3', company: 'BHP Group',           severity: 'medium',   msg: 'Narrative arc reversed: net-zero commitments weakened in latest filing', time: '22m ago' },
  { id: 'ALT-006', module: 'EP-W2',  company: 'Enel SpA',            severity: 'low',      msg: 'Predictive ESG: score expected to improve +4.2 pts next quarter', time: '28m ago' },
  { id: 'ALT-007', module: 'EP-BD1', company: 'HDFC Bank',           severity: 'medium',   msg: 'Greenium signal contracted — bond spread compression halted',      time: '31m ago' },
  { id: 'ALT-008', module: 'EP-BL2', company: 'Samsung',             severity: 'low',      msg: 'NLP parser: new disclosure detected — labour standards section',   time: '38m ago' },
  { id: 'ALT-009', module: 'EP-BY2', company: 'Nestle SA',           severity: 'high',     msg: 'Greenwashing flag: water intensity claims inconsistent with CDP data', time: '42m ago' },
  { id: 'ALT-010', module: 'EP-W1',  company: 'Siemens AG',          severity: 'low',      msg: 'Report parsed: 94% field coverage, 2 optional fields missing',    time: '51m ago' },
  { id: 'ALT-011', module: 'EP-BL1', company: 'TCS',                 severity: 'low',      msg: 'ML risk score stable at 28 — no action required',                 time: '55m ago' },
  { id: 'ALT-012', module: 'EP-BY1', company: 'Microsoft',           severity: 'medium',   msg: 'LLM extractor: carbon offset accounting methodology changed',     time: '62m ago' },
  { id: 'ALT-013', module: 'EP-BD2', company: 'Apple Inc.',          severity: 'low',      msg: 'Sentiment signal positive — supply chain transparency praised',    time: '74m ago' },
  { id: 'ALT-014', module: 'EP-W2',  company: 'Reliance Industries', severity: 'high',     msg: 'Predictive ESG: transition risk model flags coal exposure increase', time: '81m ago' },
  { id: 'ALT-015', module: 'EP-BY3', company: 'Infosys',             severity: 'low',      msg: 'Narrative intelligence: ESG story consistent YoY, minor language shift', time: '89m ago' },
];

/* ── 24h throughput data ─────────────────────────────────────── */
const THROUGHPUT_24H = Array.from({ length: 24 }, (_, h) => ({
  hour: `${String(h).padStart(2,'0')}:00`,
  NLP: Math.round(sr(h * 3) * 30 + (h > 7 && h < 20 ? 25 : 5)),
  ML:  Math.round(sr(h * 5) * 25 + (h > 7 && h < 20 ? 20 : 4)),
  LLM: Math.round(sr(h * 7) * 15 + (h > 8 && h < 19 ? 10 : 2)),
  Signal: Math.round(sr(h * 11) * 35 + (h > 6 && h < 21 ? 30 : 8)),
}));

/* ── Accuracy trend (monthly) ───────────────────────────────── */
const MONTHS = ['Jan-25','Feb-25','Mar-25','Apr-25','May-25','Jun-25','Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25','Jan-26','Feb-26','Mar-26','Apr-26'];
const ACCURACY_TREND = MONTHS.map((m, i) => ({
  month: m,
  'EP-W1':  parseFloat((82 + sr(i * 3) * 10 + i * 0.4).toFixed(1)),
  'EP-BL1': parseFloat((85 + sr(i * 7) * 8  + i * 0.35).toFixed(1)),
  'EP-BY1': parseFloat((79 + sr(i * 11) * 12 + i * 0.55).toFixed(1)),
  'EP-BD2': parseFloat((76 + sr(i * 13) * 9  + i * 0.3).toFixed(1)),
}));

/* ── Signal decay data ───────────────────────────────────────── */
const DECAY_DATA = [
  { module: 'EP-W1',  name: 'ESG Report Parser',      halfLife: 42, r2_1m: 0.71, r2_3m: 0.53, r2_6m: 0.38 },
  { module: 'EP-W2',  name: 'Predictive ESG',          halfLife: 68, r2_1m: 0.64, r2_3m: 0.59, r2_6m: 0.51 },
  { module: 'EP-BL1', name: 'ML Risk Scorer',          halfLife: 31, r2_1m: 0.78, r2_3m: 0.44, r2_6m: 0.29 },
  { module: 'EP-BL2', name: 'NLP Disclosure Parser',   halfLife: 55, r2_1m: 0.67, r2_3m: 0.55, r2_6m: 0.41 },
  { module: 'EP-BD1', name: 'Greenium Signal',         halfLife: 14, r2_1m: 0.82, r2_3m: 0.31, r2_6m: 0.18 },
  { module: 'EP-BD2', name: 'Sentiment Pipeline',      halfLife: 7,  r2_1m: 0.88, r2_3m: 0.22, r2_6m: 0.11 },
  { module: 'EP-BY1', name: 'LLM ESG Extractor',       halfLife: 60, r2_1m: 0.69, r2_3m: 0.61, r2_6m: 0.49 },
  { module: 'EP-BY2', name: 'Greenwashing Detection',  halfLife: 90, r2_1m: 0.73, r2_3m: 0.68, r2_6m: 0.59 },
  { module: 'EP-BY3', name: 'ESG Narrative Intel.',    halfLife: 75, r2_1m: 0.61, r2_3m: 0.57, r2_6m: 0.52 },
];

/* ── Agentic pipelines ───────────────────────────────────────── */
const PIPELINES = [
  {
    id: 'p1', name: 'Full Due Diligence',
    steps: ['ESG Report Parser', 'LLM Extractor', 'GW Detection', 'Predictive Score', 'Risk Alert'],
    estimatedTime: '8-12 min', lastRun: '2026-04-03', runs: 47,
    description: 'End-to-end ESG due diligence for new investment candidates'
  },
  {
    id: 'p2', name: 'Quarterly Monitoring',
    steps: ['Narrative Intelligence', 'Sentiment Pipeline', 'ML Risk Scorer', 'Portfolio Update'],
    estimatedTime: '4-6 min', lastRun: '2026-04-01', runs: 124,
    description: 'Ongoing monitoring of portfolio companies across AI signal modules'
  },
  {
    id: 'p3', name: 'Regulatory Filing Check',
    steps: ['CSRD Parser', 'ISSB Mapper', 'Gap Analyzer', 'Remediation Plan'],
    estimatedTime: '6-9 min', lastRun: '2026-03-31', runs: 38,
    description: 'Automated regulatory compliance check against CSRD and ISSB standards'
  },
  {
    id: 'p4', name: 'New Investment Screen',
    steps: ['Company Enrichment', 'ESG Score', 'GW Screen', 'Engagement Priority'],
    estimatedTime: '3-5 min', lastRun: '2026-04-03', runs: 211,
    description: 'Rapid screening pipeline for new investment universe expansion'
  },
  {
    id: 'p5', name: 'Controversy Response',
    steps: ['Controversy Scan', 'Narrative Arc', 'Peer Benchmark', 'Stakeholder Brief'],
    estimatedTime: '5-8 min', lastRun: '2026-03-30', runs: 19,
    description: 'Structured response workflow triggered by controversy event detection'
  },
];

const RECENT_RUNS = [
  { ts: '2026-04-04 09:31', pipeline: 'Full Due Diligence',      companies: 3,  artifacts: 'dd_report_shell_2026Q1.pdf', status: 'complete' },
  { ts: '2026-04-04 08:55', pipeline: 'New Investment Screen',   companies: 12, artifacts: 'screen_batch_047.xlsx',       status: 'complete' },
  { ts: '2026-04-04 07:22', pipeline: 'Quarterly Monitoring',    companies: 28, artifacts: 'portfolio_monitor_Q12026.json', status: 'complete' },
  { ts: '2026-04-03 18:44', pipeline: 'Regulatory Filing Check', companies: 5,  artifacts: 'csrd_gap_report_v3.pdf',      status: 'complete' },
  { ts: '2026-04-03 15:10', pipeline: 'Controversy Response',    companies: 1,  artifacts: 'controversy_brief_bhp.pdf',   status: 'complete' },
  { ts: '2026-04-03 12:08', pipeline: 'New Investment Screen',   companies: 8,  artifacts: 'screen_batch_046.xlsx',       status: 'complete' },
];

const AGENT_LOG = [
  '[09:31:04] AGENT: Initiating Full Due Diligence for Shell plc, BP plc, Enel SpA',
  '[09:31:06] EP-W1: Loading sustainability reports (FY2025) — 3 documents queued',
  '[09:31:09] EP-W1: Parsing complete — Shell 94% coverage, BP 87%, Enel 91%',
  '[09:31:14] EP-BY1: LLM extraction started — extracting 48 ESG fields per company',
  '[09:31:28] EP-BY1: Extracted: Carbon targets ✓ Water ✓ Social KPIs ✓ Governance ✓',
  '[09:31:31] EP-BY2: Greenwashing detection running — cross-referencing CDP, GRI, SASB',
  '[09:31:39] EP-BY2: ALERT — Shell plc greenwashing score 87 (threshold 60)',
  '[09:31:41] EP-W2: Predictive ESG scoring initiated for 3 entities',
  '[09:31:48] EP-W2: Shell plc 12-mo forecast: 52.3 → 48.1 (−7.9% transition risk)',
  '[09:31:52] EP-BL1: ML risk enrichment applied — risk scores updated',
  '[09:31:55] AGENT: Generating consolidated DD report...',
  '[09:32:01] AGENT: dd_report_shell_2026Q1.pdf written (42 pages)',
  '[09:32:02] AGENT: Workflow complete — 3 companies processed, 1 critical alert',
  '[08:55:11] AGENT: New Investment Screen — batch of 12 companies from MSCI EM index',
  '[08:55:13] EP-BL1: Parallel ML scoring initiated — 12 threads',
  '[08:55:21] EP-BD1: Greenium signal fetch — 12 bond CUSIPs resolved',
  '[08:55:24] EP-BY2: GW pre-screen: 2 flags (Samsung threshold 64, Volkswagen 71)',
  '[08:55:29] EP-W2: ESG scores generated — avg 61.4, range 41–79',
  '[08:55:32] AGENT: Engagement priority matrix computed',
  '[08:55:34] AGENT: screen_batch_047.xlsx exported to workspace',
];

/* ── Correlation matrix data ─────────────────────────────────── */
const CODES = AI_MODULES.map(m => m.code);
const CORR_MATRIX = useMemo ? null : null; // will compute in component

/* ── CSS keyframes injected once ────────────────────────────── */
const PULSE_CSS = `
@keyframes aiPulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
@keyframes aiSpin  { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
@keyframes aiFadeIn { from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:translateY(0);} }
`;

/* ── Helper components ───────────────────────────────────────── */
const Pill = ({ children, color = T.navy, bg }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: T.mono, background: bg || `${color}18`, color }}>
    {children}
  </span>
);

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 120 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy, letterSpacing: -0.5 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const SeverityBadge = ({ sev }) => {
  const map = { critical: { color: T.red, label: 'CRITICAL' }, high: { color: T.orange, label: 'HIGH' }, medium: { color: T.amber, label: 'MEDIUM' }, low: { color: T.green, label: 'LOW' } };
  const { color, label } = map[sev] || map.low;
  return <Pill color={color}>{label}</Pill>;
};

const ModuleBadge = ({ code, category }) => (
  <Pill color={CAT_COLOR[category] || T.navy}>{code}</Pill>
);

/* ── Main Component ─────────────────────────────────────────── */
export default function AiHubPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [sigFilter, setSigFilter] = useState('ALL');
  const [selectedCompany, setSelectedCompany] = useState(COMPANIES[0]);
  const [runningPipeline, setRunningPipeline] = useState(null);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [tick, setTick] = useState(0);
  const logRef = useRef(null);

  // inject keyframes
  useEffect(() => {
    if (!document.getElementById('ai-hub-css')) {
      const el = document.createElement('style');
      el.id = 'ai-hub-css';
      el.textContent = PULSE_CSS;
      document.head.appendChild(el);
    }
  }, []);

  // pulse tick for running indicators
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 900);
    return () => clearInterval(t);
  }, []);

  // pipeline animation
  useEffect(() => {
    if (runningPipeline === null) return;
    const pipeline = PIPELINES[runningPipeline];
    if (pipelineStep < pipeline.steps.length) {
      const t = setTimeout(() => setPipelineStep(s => s + 1), 1200);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setRunningPipeline(null); setPipelineStep(0); }, 800);
      return () => clearTimeout(t);
    }
  }, [runningPipeline, pipelineStep]);

  // scroll agent log to bottom
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [activeTab]);

  /* ── Computed values ─────────────────────────────────────── */
  const filteredSignals = useMemo(() =>
    sigFilter === 'ALL' ? SIGNALS : SIGNALS.filter(s => s.module === sigFilter),
    [sigFilter]
  );

  // Per-company AI scores
  const companyScores = useMemo(() => {
    return COMPANIES.map((name, ci) => {
      const base = sr(ci * 29) * 40 + 45;
      return {
        name,
        esgScore:       parseFloat((base + sr(ci * 3) * 10).toFixed(1)),
        extractConf:    parseFloat((75 + sr(ci * 5) * 20).toFixed(1)),
        gwScore:        parseFloat((sr(ci * 7) * 60 + 20).toFixed(1)),
        sentiment:      parseFloat((sr(ci * 11) * 60 + 30).toFixed(1)),
        mlRisk:         parseFloat((sr(ci * 13) * 55 + 20).toFixed(1)),
        greenium:       parseFloat((sr(ci * 17) * 40 - 20).toFixed(1)),
        narrativeArc:   ['Improving','Stable','Declining','Improving','Stable'][ci % 5],
        disclosureQual: parseFloat((70 + sr(ci * 19) * 25).toFixed(1)),
        nlpComplete:    parseFloat((65 + sr(ci * 23) * 30).toFixed(1)),
        flagCount:      Math.floor(sr(ci * 31) * 5),
      };
    });
  }, []);

  const selectedScores = useMemo(() =>
    companyScores.find(c => c.name === selectedCompany) || companyScores[0],
    [selectedCompany, companyScores]
  );

  const convergedAlerts = useMemo(() =>
    companyScores.filter(c => c.flagCount >= 3),
    [companyScores]
  );

  const divergenceAlerts = useMemo(() =>
    companyScores.filter(c => c.gwScore > 60 && c.esgScore > 60),
    [companyScores]
  );

  // Correlation matrix (9x9)
  const corrMatrix = useMemo(() => {
    return CODES.map((r, ri) => CODES.map((c, ci) => {
      if (ri === ci) return 1.0;
      const v = 0.3 + sr(ri * 9 + ci * 13) * 0.65;
      return parseFloat(v.toFixed(2));
    }));
  }, []);

  // Retraining schedule
  const retrainSchedule = useMemo(() => AI_MODULES.map(m => {
    const daysUntil = Math.floor(sr(m.id.length * 7) * 60 + 5);
    const driftScore = parseFloat((sr(m.id.length * 11) * 0.18 + 0.02).toFixed(3));
    return { ...m, daysUntil, driftScore, driftAlert: driftScore > 0.12 };
  }), []);

  const TABS = ['Mission Control', 'Signal Intelligence', 'Model Registry', 'Signal Alpha', 'Agentic Console'];

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, borderBottom: `3px solid ${T.gold}`, padding: '20px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono, letterSpacing: 2, marginBottom: 4 }}>EP-W6 · AI ANALYTICS HUB</div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>AI Command Center</h1>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>Unified intelligence aggregator — 9 modules · 40 live signals · 5 agentic pipelines</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            {AI_MODULES.slice(0, 5).map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }} onClick={() => navigate(m.route)}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[m.status], animation: m.status === 'running' ? 'aiPulse 1s infinite' : m.status === 'active' ? 'none' : 'none', opacity: m.status === 'idle' ? 0.5 : 1 }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: T.mono }}>{m.code}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: T.font, color: activeTab === i ? T.gold : 'rgba(255,255,255,0.55)', borderBottom: activeTab === i ? `2px solid ${T.gold}` : '2px solid transparent', transition: 'all 0.15s' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1400 }}>

        {/* ── TAB 1: Mission Control ─────────────────────────── */}
        {activeTab === 0 && (
          <div style={{ animation: 'aiFadeIn 0.25s ease' }}>
            {/* KPI Row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <KpiCard label="SIGNALS TODAY" value="247" sub="+18% vs yesterday" color={T.navy} />
              <KpiCard label="ALERTS REQUIRING ACTION" value="12" sub="3 critical, 9 high/medium" color={T.red} />
              <KpiCard label="AVG MODEL ACCURACY" value="87.3%" sub="Across 9 active models" color={T.green} />
              <KpiCard label="COMPANIES COVERED" value="156" sub="In active monitoring" color={T.navy} />
              <KpiCard label="SIGNALS / HOUR" value="42" sub="Rolling 1-hour average" color={T.sage} />
            </div>

            {/* Module status bar */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 10 }}>MODULE STATUS · {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {AI_MODULES.map(m => (
                  <div key={m.id} onClick={() => navigate(m.route)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: T.surfaceH, border: `1px solid ${T.borderL}`, borderRadius: 6, padding: '7px 12px', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[m.status], animation: m.status === 'running' ? 'aiPulse 1s infinite' : 'none', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.text, fontFamily: T.mono }}>{m.code}</div>
                      <div style={{ fontSize: 10, color: T.textMut }}>{m.lastRun}</div>
                    </div>
                    <Pill color={CAT_COLOR[m.category]}>{m.category}</Pill>
                  </div>
                ))}
              </div>
            </div>

            {/* Throughput chart + Signal feed */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, marginBottom: 20 }}>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>24-Hour Signal Throughput</div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={THROUGHPUT_24H} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="hour" tick={{ fontSize: 9, fontFamily: T.mono }} interval={3} />
                    <YAxis tick={{ fontSize: 9, fontFamily: T.mono }} />
                    <Tooltip contentStyle={{ fontSize: 11, fontFamily: T.mono }} />
                    <Area type="monotone" dataKey="Signal" stackId="1" stroke={T.gold}    fill={`${T.gold}40`}    />
                    <Area type="monotone" dataKey="NLP"    stackId="1" stroke={T.blue}    fill={`${T.blue}40`}    />
                    <Area type="monotone" dataKey="ML"     stackId="1" stroke={T.sage}    fill={`${T.sage}40`}    />
                    <Area type="monotone" dataKey="LLM"    stackId="1" stroke={T.navy}    fill={`${T.navy}50`}    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10, fontFamily: T.mono }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Signal feed */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Live Signal Feed</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['ALL', ...AI_MODULES.map(m => m.code)].slice(0, 6).map(f => (
                      <button key={f} onClick={() => setSigFilter(f)} style={{ padding: '3px 8px', border: `1px solid ${sigFilter === f ? T.navy : T.border}`, borderRadius: 4, background: sigFilter === f ? T.navy : 'transparent', color: sigFilter === f ? '#fff' : T.textSec, fontSize: 10, fontFamily: T.mono, cursor: 'pointer' }}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {filteredSignals.slice(0, 15).map(sig => (
                    <div key={sig.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: sig.actionable ? `${T.amber}0a` : T.surfaceH, borderRadius: 5, border: `1px solid ${sig.actionable ? T.amber + '40' : T.borderL}` }}>
                      <ModuleBadge code={sig.module} category={sig.category} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.text, minWidth: 110 }}>{sig.company}</span>
                      <span style={{ fontSize: 10, color: T.textSec, flex: 1 }}>{sig.signalType}</span>
                      <span style={{ fontSize: 11, fontFamily: T.mono, color: sig.direction === 'up' ? T.green : T.red, fontWeight: 700 }}>
                        {sig.direction === 'up' ? '▲' : '▼'} {sig.value}
                      </span>
                      <span style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>{sig.confidence}%</span>
                      <span style={{ fontSize: 10, color: T.textMut, minWidth: 40, textAlign: 'right' }}>{sig.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alert feed */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10 }}>Priority Alert Feed ({ALERTS.length} active)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {ALERTS.slice(0, 9).map(a => (
                  <div key={a.id} style={{ padding: '10px 12px', background: T.surfaceH, borderRadius: 6, border: `1px solid ${T.borderL}`, borderLeft: `3px solid ${a.severity === 'critical' ? T.red : a.severity === 'high' ? T.orange : a.severity === 'medium' ? T.amber : T.green}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <SeverityBadge sev={a.severity} />
                      <ModuleBadge code={a.module} category={AI_MODULES.find(m => m.code === a.module)?.category || 'NLP'} />
                      <span style={{ fontSize: 10, color: T.textMut, marginLeft: 'auto' }}>{a.time}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{a.company}</div>
                    <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{a.msg}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: Signal Intelligence ─────────────────────── */}
        {activeTab === 1 && (
          <div style={{ animation: 'aiFadeIn 0.25s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 16, marginBottom: 16 }}>
              {/* Correlation matrix */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10 }}>Signal Correlation Matrix (9×9)</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: 10, fontFamily: T.mono }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '4px 6px', background: T.surfaceH, border: `1px solid ${T.border}`, color: T.textMut }}></th>
                        {CODES.map(c => (
                          <th key={c} style={{ padding: '4px 6px', background: T.surfaceH, border: `1px solid ${T.border}`, color: T.textSec, whiteSpace: 'nowrap', fontSize: 9 }}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {corrMatrix.map((row, ri) => (
                        <tr key={ri}>
                          <td style={{ padding: '4px 6px', background: T.surfaceH, border: `1px solid ${T.border}`, color: T.textSec, fontWeight: 700, whiteSpace: 'nowrap', fontSize: 9 }}>{CODES[ri]}</td>
                          {row.map((v, ci) => {
                            const pct = ri === ci ? 1 : v;
                            const bg = ri === ci ? T.navy : `rgba(92,138,106,${pct * 0.7})`;
                            return (
                              <td key={ci} title={`${CODES[ri]} × ${CODES[ci]}: ${v}`} style={{ padding: '5px 7px', border: `1px solid ${T.border}`, background: bg, color: ri === ci ? '#fff' : pct > 0.7 ? T.navy : T.textSec, textAlign: 'center', fontWeight: ri === ci ? 700 : 400 }}>
                                {ri === ci ? '—' : v.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Company profile card */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Multi-Module Company View</div>
                  <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} style={{ fontSize: 11, fontFamily: T.font, border: `1px solid ${T.border}`, borderRadius: 5, padding: '4px 8px', background: T.surfaceH, color: T.text, marginLeft: 'auto' }}>
                    {COMPANIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                {selectedScores && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{selectedCompany}</div>
                      {selectedScores.flagCount >= 3 && (
                        <Pill color={T.red}>CONVERGED ALERT ({selectedScores.flagCount} modules flagged)</Pill>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {[
                        { label: 'ESG Score (EP-W2)', val: `${selectedScores.esgScore}`, unit: '/100', color: selectedScores.esgScore > 60 ? T.green : T.amber },
                        { label: 'LLM Extraction Conf. (EP-BY1)', val: `${selectedScores.extractConf}`, unit: '%', color: T.navy },
                        { label: 'Greenwashing Score (EP-BY2)', val: `${selectedScores.gwScore}`, unit: '/100', color: selectedScores.gwScore > 60 ? T.red : T.green },
                        { label: 'Sentiment Score (EP-BD2)', val: `${selectedScores.sentiment}`, unit: '/100', color: selectedScores.sentiment > 50 ? T.green : T.red },
                        { label: 'ML Risk Score (EP-BL1)', val: `${selectedScores.mlRisk}`, unit: '/100', color: selectedScores.mlRisk > 50 ? T.red : T.green },
                        { label: 'Greenium bps (EP-BD1)', val: `${selectedScores.greenium > 0 ? '+' : ''}${selectedScores.greenium}`, unit: 'bps', color: selectedScores.greenium > 0 ? T.green : T.red },
                        { label: 'Narrative Arc (EP-BY3)', val: selectedScores.narrativeArc, unit: '', color: selectedScores.narrativeArc === 'Improving' ? T.green : selectedScores.narrativeArc === 'Declining' ? T.red : T.amber },
                        { label: 'Disclosure Quality (EP-W1)', val: `${selectedScores.disclosureQual}`, unit: '%', color: T.navy },
                        { label: 'NLP Completeness (EP-BL2)', val: `${selectedScores.nlpComplete}`, unit: '%', color: T.navy },
                      ].map(row => (
                        <div key={row.label} style={{ padding: '8px 10px', background: T.surfaceH, borderRadius: 6, border: `1px solid ${T.borderL}` }}>
                          <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono, marginBottom: 3 }}>{row.label}</div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: row.color, fontFamily: T.mono }}>{row.val}<span style={{ fontSize: 11, fontWeight: 400, color: T.textMut }}>{row.unit}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Converged + Divergence alerts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10 }}>Converged Risk Alerts (≥3 modules flagged)</div>
                {convergedAlerts.length === 0 ? <div style={{ color: T.textMut, fontSize: 12 }}>No converged alerts</div> : (
                  convergedAlerts.map(c => (
                    <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: `${T.red}0a`, border: `1px solid ${T.red}30`, borderRadius: 6, marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.red, animation: 'aiPulse 1.2s infinite' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{c.name}</span>
                      <Pill color={T.red}>{c.flagCount} MODULES</Pill>
                      <span style={{ fontSize: 10, color: T.textMut, marginLeft: 'auto' }}>ESG {c.esgScore} · GW {c.gwScore}</span>
                    </div>
                  ))
                )}
              </div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10 }}>Divergence Alerts (High ESG + High GW Risk)</div>
                {divergenceAlerts.length === 0 ? <div style={{ color: T.textMut, fontSize: 12 }}>No divergence alerts</div> : (
                  divergenceAlerts.map(c => (
                    <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: `${T.orange}0a`, border: `1px solid ${T.orange}40`, borderRadius: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 14 }}>⚠</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{c.name}</span>
                      <span style={{ fontSize: 10, color: T.textSec }}>ESG {c.esgScore} vs GW {c.gwScore}</span>
                      <Pill color={T.orange}>DIVERGE</Pill>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: Model Registry ──────────────────────────── */}
        {activeTab === 2 && (
          <div style={{ animation: 'aiFadeIn 0.25s ease' }}>
            {/* Model table */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10 }}>Model Performance Registry</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Module','Model Type','Accuracy','Last Trained','Training Samples','Inference ms','Status','Drift Score'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, color: T.textMut, fontFamily: T.mono, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {retrainSchedule.map((m, i) => (
                    <tr key={m.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.borderL}` }}>
                        <div style={{ fontWeight: 700, color: T.navy, fontFamily: T.mono, fontSize: 11 }}>{m.code}</div>
                        <div style={{ fontSize: 10, color: T.textSec }}>{m.name}</div>
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.borderL}` }}><Pill color={CAT_COLOR[m.category]}>{m.modelType}</Pill></td>
                      <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.borderL}`, fontFamily: T.mono, fontWeight: 700, color: m.accuracy > 88 ? T.green : m.accuracy > 80 ? T.amber : T.red }}>{m.accuracy}%</td>
                      <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.borderL}`, fontFamily: T.mono, fontSize: 10, color: T.textSec }}>{m.trainedOn}</td>
                      <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.borderL}`, fontFamily: T.mono, fontSize: 10 }}>{m.samples.toLocaleString()}</td>
                      <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.borderL}`, fontFamily: T.mono, fontSize: 10, color: m.inferenceMs > 1000 ? T.amber : T.textSec }}>{m.inferenceMs}ms</td>
                      <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.borderL}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[m.status], animation: m.status === 'running' ? 'aiPulse 1s infinite' : 'none' }} />
                          <span style={{ fontSize: 10, textTransform: 'capitalize', color: STATUS_COLOR[m.status] }}>{m.status}</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: `1px solid ${T.borderL}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontFamily: T.mono, fontSize: 10, color: m.driftAlert ? T.red : T.green }}>{m.driftScore}</span>
                          {m.driftAlert && <Pill color={T.red}>DRIFT</Pill>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
              {/* Accuracy trend chart */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Model Accuracy Trend (Jan 2025 – Apr 2026)</div>
                <div style={{ fontSize: 10, color: T.textMut, marginBottom: 10 }}>Benchmarks: Regulatory 75% · Generic NLP 68%</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={ACCURACY_TREND} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 8, fontFamily: T.mono }} interval={3} />
                    <YAxis tick={{ fontSize: 9, fontFamily: T.mono }} domain={[60, 100]} />
                    <Tooltip contentStyle={{ fontSize: 10, fontFamily: T.mono }} />
                    <Line type="monotone" dataKey="EP-W1"  stroke={T.navy}   strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="EP-BL1" stroke={T.sage}   strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="EP-BY1" stroke={T.purple} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="EP-BD2" stroke={T.gold}   strokeWidth={2} dot={false} />
                    {/* Benchmark lines */}
                    <Line type="monotone" dataKey={() => 75} stroke={T.amber} strokeWidth={1} strokeDasharray="5 3" dot={false} name="Reg. Benchmark" />
                    <Line type="monotone" dataKey={() => 68} stroke={T.textMut} strokeWidth={1} strokeDasharray="3 3" dot={false} name="Generic NLP" />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 9, fontFamily: T.mono }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Retraining schedule */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10 }}>Retraining Schedule</div>
                {retrainSchedule.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ fontSize: 10, fontFamily: T.mono, fontWeight: 700, color: T.navy, minWidth: 60 }}>{m.code}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 5, background: T.borderL, borderRadius: 3 }}>
                        <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(100, (1 - m.daysUntil / 60) * 100)}%`, background: m.daysUntil < 10 ? T.red : m.daysUntil < 20 ? T.amber : T.green }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontFamily: T.mono, color: m.daysUntil < 10 ? T.red : T.textSec, minWidth: 55, textAlign: 'right' }}>in {m.daysUntil}d</span>
                    {m.driftAlert && <Pill color={T.red}>URGENT</Pill>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: Signal Alpha ─────────────────────────────── */}
        {activeTab === 3 && (
          <div style={{ animation: 'aiFadeIn 0.25s ease' }}>
            {/* Alpha KPIs */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <KpiCard label="AVG 1M R² (SIGNALS→ESG)" value="0.74" sub="Best: Greenium 0.82" color={T.green} />
              <KpiCard label="AVG SIGNAL HALF-LIFE" value="49 days" sub="Weighted by coverage" color={T.navy} />
              <KpiCard label="ANALYST HOURS SAVED/MONTH" value="1,840 hrs" sub="~$276k @ $150/hr" color={T.sage} />
              <KpiCard label="REPORTS PROCESSED (YTD)" value="4,712" sub="vs 312 manually feasible" color={T.gold} />
              <KpiCard label="COVERAGE MULTIPLIER" value="15.1×" sub="AI vs analyst manual" color={T.purple} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 16 }}>
              {/* Signal decay chart */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Signal Decay & Predictive Power</div>
                <div style={{ fontSize: 10, color: T.textMut, marginBottom: 10 }}>R² correlation to forward ESG score improvement by time horizon</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      {['Module','Signal Type','Half-Life','1M R²','3M R²','6M R²'].map(h => (
                        <th key={h} style={{ padding: '7px 8px', textAlign: 'left', fontSize: 10, color: T.textMut, fontFamily: T.mono, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DECAY_DATA.map((d, i) => (
                      <tr key={d.module} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ padding: '7px 8px', borderBottom: `1px solid ${T.borderL}`, fontFamily: T.mono, fontSize: 10, fontWeight: 700, color: T.navy }}>{d.module}</td>
                        <td style={{ padding: '7px 8px', borderBottom: `1px solid ${T.borderL}`, fontSize: 10, color: T.textSec }}>{d.name}</td>
                        <td style={{ padding: '7px 8px', borderBottom: `1px solid ${T.borderL}`, fontFamily: T.mono, fontSize: 11, color: d.halfLife < 14 ? T.red : d.halfLife < 40 ? T.amber : T.green }}>{d.halfLife}d</td>
                        {[d.r2_1m, d.r2_3m, d.r2_6m].map((v, vi) => (
                          <td key={vi} style={{ padding: '7px 8px', borderBottom: `1px solid ${T.borderL}`, fontFamily: T.mono, fontSize: 11, color: v > 0.7 ? T.green : v > 0.5 ? T.amber : T.textSec }}>{v.toFixed(2)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ROI calculator */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>AI ROI Calculator</div>
                  {[
                    { label: 'Reports processed (YTD)', ai: '4,712', manual: '312', unit: 'reports' },
                    { label: 'Time per report', ai: '~18s', manual: '~3.5 hrs', unit: '' },
                    { label: 'Total analyst hours', ai: '23 hrs', manual: '1,863 hrs', unit: 'YTD' },
                    { label: 'Cost (@ $150/hr)', ai: '$3,450', manual: '$279,450', unit: 'YTD' },
                    { label: 'Net saving', ai: '', manual: '$276,000', unit: 'YTD' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 11 }}>
                      <span style={{ color: T.textSec }}>{row.label}</span>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {row.ai && <span style={{ fontFamily: T.mono, color: T.green, fontWeight: 600 }}>{row.ai}</span>}
                        <span style={{ fontFamily: T.mono, color: row.label.includes('saving') ? T.green : T.textSec }}>{row.manual} {row.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top signals by predictive power */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px', flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10 }}>Top Signals by Predictive Power</div>
                  {[
                    { module: 'EP-BD1', signal: 'Greenium Expansion', score: 94 },
                    { module: 'EP-BY2', signal: 'Greenwashing Flag', score: 91 },
                    { module: 'EP-BD2', signal: 'Sentiment Shift', score: 88 },
                    { module: 'EP-BL1', signal: 'Risk Score Spike', score: 86 },
                    { module: 'EP-BY1', signal: 'LLM Extraction Complete', score: 83 },
                    { module: 'EP-W1',  signal: 'Disclosure Gap', score: 79 },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <span style={{ fontSize: 10, fontFamily: T.mono, color: T.textMut, minWidth: 20 }}>#{i + 1}</span>
                      <ModuleBadge code={s.module} category={AI_MODULES.find(m => m.code === s.module)?.category || 'ML'} />
                      <span style={{ fontSize: 11, color: T.text, flex: 1 }}>{s.signal}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 60, height: 5, background: T.borderL, borderRadius: 3 }}>
                          <div style={{ width: `${s.score}%`, height: '100%', borderRadius: 3, background: s.score > 88 ? T.green : T.sage }} />
                        </div>
                        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.textSec }}>{s.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Portfolio impact */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10 }}>Portfolio Impact — AI-Driven Engagement Tracking</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {COMPANIES.slice(0, 5).map((c, i) => {
                  const pre = parseFloat((45 + sr(i * 7) * 20).toFixed(1));
                  const post = parseFloat((pre + sr(i * 13) * 12 + 3).toFixed(1));
                  return (
                    <div key={c} style={{ padding: '10px 12px', background: T.surfaceH, borderRadius: 6, border: `1px solid ${T.borderL}` }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: T.text, marginBottom: 6 }}>{c}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 9, color: T.textMut }}>Pre-AI</span>
                        <span style={{ fontSize: 9, color: T.textMut }}>Post-AI</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: T.mono, fontSize: 14, color: T.textSec }}>{pre}</span>
                        <span style={{ color: T.green, fontSize: 12 }}>→</span>
                        <span style={{ fontFamily: T.mono, fontSize: 14, color: T.green, fontWeight: 700 }}>{post}</span>
                      </div>
                      <div style={{ fontSize: 9, color: T.green, textAlign: 'right', marginTop: 2 }}>+{(post - pre).toFixed(1)} pts</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: Agentic Console ──────────────────────────── */}
        {activeTab === 4 && (
          <div style={{ animation: 'aiFadeIn 0.25s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
              {/* Pipelines */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PIPELINES.map((p, pi) => (
                  <div key={p.id} style={{ background: T.surface, border: `1px solid ${runningPipeline === pi ? T.gold : T.border}`, borderRadius: 8, padding: '14px 16px', transition: 'border-color 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: T.textSec }}>{p.description}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>{p.estimatedTime}</div>
                          <div style={{ fontSize: 10, color: T.textMut }}>{p.runs} runs · last {p.lastRun}</div>
                        </div>
                        <button
                          onClick={() => { if (runningPipeline === null) { setRunningPipeline(pi); setPipelineStep(0); } }}
                          disabled={runningPipeline !== null}
                          style={{ padding: '6px 14px', background: runningPipeline === pi ? T.amber : T.navy, border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: T.font, cursor: runningPipeline !== null ? 'not-allowed' : 'pointer', opacity: runningPipeline !== null && runningPipeline !== pi ? 0.5 : 1, transition: 'background 0.2s' }}>
                          {runningPipeline === pi ? 'Running...' : 'Run'}
                        </button>
                      </div>
                    </div>
                    {/* Step flow */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
                      {p.steps.map((step, si) => {
                        const isActive = runningPipeline === pi && si === pipelineStep;
                        const isDone = runningPipeline === pi ? si < pipelineStep : false;
                        return (
                          <React.Fragment key={si}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 5, background: isActive ? `${T.amber}20` : isDone ? `${T.green}15` : T.surfaceH, border: `1px solid ${isActive ? T.amber : isDone ? T.green : T.borderL}`, fontSize: 10, color: isActive ? T.amber : isDone ? T.green : T.textSec, fontWeight: isActive || isDone ? 700 : 400, transition: 'all 0.3s' }}>
                              {isActive && <span style={{ animation: 'aiSpin 1s linear infinite', display: 'inline-block' }}>↻</span>}
                              {isDone && <span>✓</span>}
                              {step}
                            </div>
                            {si < p.steps.length - 1 && <span style={{ fontSize: 12, color: T.borderL, margin: '0 2px' }}>→</span>}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: recent runs + agent log */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10 }}>Recent Workflow Runs</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                    <thead>
                      <tr>
                        {['Timestamp','Pipeline','Co.','Artifacts'].map(h => (
                          <th key={h} style={{ padding: '5px 6px', textAlign: 'left', color: T.textMut, fontFamily: T.mono, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {RECENT_RUNS.map((r, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                          <td style={{ padding: '5px 6px', borderBottom: `1px solid ${T.borderL}`, fontFamily: T.mono, color: T.textSec }}>{r.ts.split(' ')[1]}</td>
                          <td style={{ padding: '5px 6px', borderBottom: `1px solid ${T.borderL}`, color: T.text, fontWeight: 600 }}>{r.pipeline}</td>
                          <td style={{ padding: '5px 6px', borderBottom: `1px solid ${T.borderL}`, fontFamily: T.mono, color: T.textSec }}>{r.companies}</td>
                          <td style={{ padding: '5px 6px', borderBottom: `1px solid ${T.borderL}`, color: T.textSec, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.artifacts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Agent log */}
                <div style={{ background: T.navy, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px', flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, fontFamily: T.mono, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ animation: 'aiPulse 1.5s infinite', display: 'inline-block' }}>●</span>
                    AGENT LOG
                  </div>
                  <div ref={logRef} style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {AGENT_LOG.map((line, i) => (
                      <div key={i} style={{ fontSize: 10, fontFamily: T.mono, color: line.includes('ALERT') ? T.red : line.includes('AGENT:') ? T.goldL : 'rgba(255,255,255,0.65)', lineHeight: 1.5, animation: `aiFadeIn 0.2s ease ${i * 0.03}s both` }}>
                        {line}
                      </div>
                    ))}
                    {runningPipeline !== null && (
                      <div style={{ fontSize: 10, fontFamily: T.mono, color: T.amber, animation: 'aiPulse 0.8s infinite' }}>
                        [{new Date().toTimeString().slice(0, 8)}] AGENT: {PIPELINES[runningPipeline].steps[Math.min(pipelineStep, PIPELINES[runningPipeline].steps.length - 1)]} running...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: '10px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.surface }}>
        <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>EP-W6 · AI Analytics Hub · 9 modules · 156 companies · signals refreshed continuously</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {AI_MODULES.map(m => (
            <button key={m.id} onClick={() => navigate(m.route)} style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
              {m.code}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
