import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, Legend, PieChart, Pie, LineChart, Line, ScatterChart, Scatter,
} from 'recharts';

// Backend E77 AI Governance engine (EU AI Act 2024/1689 / NIST AI RMF 1.0 / OECD AI
// Principles / disparate-impact bias metrics / energy-emissions accounting).
// See backend/services/ai_governance_engine.py + backend/api/v1/routes/ai_governance.py
const API = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL || 'http://localhost:8001';
const AI_GOV_API = `${API}/api/v1/ai-governance`;

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f4f6f9',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SYSTEM_TYPES = [
  'Recruitment / HR', 'Credit Scoring', 'Healthcare Diagnostics', 'Autonomous Systems',
  'Recommendation Engine', 'Fraud Detection', 'Natural Language Processing',
  'Computer Vision', 'Predictive Analytics', 'Risk Assessment',
];

const VENDORS = ['Internal', 'OpenAI', 'Anthropic', 'Google', 'Microsoft', 'Meta', 'HuggingFace', 'Other'];
const REGIONS_LIST = ['EU', 'US', 'UK', 'SG', 'AU', 'CA', 'Other'];
const RISK_TIERS = ['Unacceptable', 'High', 'Limited', 'Minimal'];
const DOC_STATUS = ['Complete', 'Partial', 'Missing'];

const SYS_PREFIXES = ['Credit', 'Hire', 'Fraud', 'Risk', 'Recom', 'Vision', 'Predict', 'Health', 'Auto', 'NLP', 'Score', 'Detect', 'Audit', 'Alert', 'Classify'];
const SYS_SUFFIXES = ['AI', 'Bot', 'Shield', 'Pro', 'Engine', 'Net', 'Core', 'Lens', 'Guard', 'Scan', 'Flow', 'Sense', 'Pulse', 'Watch', 'Mind'];
const SYS_VERSIONS = ['-v1', '-v2', '-v3', '-Pro', '-Plus', '-Lite', '-X', ''];

const AI_SYSTEMS = Array.from({ length: 200 }, (_, i) => {
  const seed0 = i * 17 + 3;
  const pfx = SYS_PREFIXES[Math.floor(sr(seed0) * SYS_PREFIXES.length)];
  const sfx = SYS_SUFFIXES[Math.floor(sr(seed0 + 1) * SYS_SUFFIXES.length)];
  const ver = SYS_VERSIONS[Math.floor(sr(seed0 + 2) * SYS_VERSIONS.length)];
  const riskIdx = Math.floor(sr(seed0 + 3) * 4);
  const euScore = Math.round(20 + sr(seed0 + 4) * 75);
  const nistScore = Math.round(25 + sr(seed0 + 5) * 70);
  const biasScore = Math.round(10 + sr(seed0 + 6) * 80);
  const paramsBn = parseFloat((sr(seed0 + 7) * 200).toFixed(1));
  const energyMwh = Math.round(10 + sr(seed0 + 8) * 2000);
  const co2e = Math.round(energyMwh * (0.2 + sr(seed0 + 9) * 0.4));
  const auditYear = 2023 + Math.floor(sr(seed0 + 10) * 2);
  const auditMon = String(1 + Math.floor(sr(seed0 + 11) * 12)).padStart(2, '0');
  const auditDay = String(1 + Math.floor(sr(seed0 + 12) * 28)).padStart(2, '0');
  return {
    id: i + 1,
    name: `${pfx}${sfx}${ver}`,
    type: SYSTEM_TYPES[Math.floor(sr(seed0 + 13) * SYSTEM_TYPES.length)],
    region: REGIONS_LIST[Math.floor(sr(seed0 + 14) * REGIONS_LIST.length)],
    riskTier: RISK_TIERS[riskIdx],
    euAiActScore: euScore,
    nistScore,
    biasScore,
    energyMwhYr: energyMwh,
    co2eTyr: co2e,
    documentation: DOC_STATUS[Math.floor(sr(seed0 + 15) * 3)],
    humanOversight: sr(seed0 + 16) > 0.35,
    autoDecision: sr(seed0 + 17) > 0.45,
    biometricData: sr(seed0 + 18) > 0.75,
    modelParamsBn: paramsBn,
    incidentCount: Math.floor(sr(seed0 + 19) * 12),
    lastAudit: `${auditYear}-${auditMon}-${auditDay}`,
    compliancePct: Math.round(15 + sr(seed0 + 20) * 80),
    vendor: VENDORS[Math.floor(sr(seed0 + 21) * VENDORS.length)],
    trlAi: 1 + Math.floor(sr(seed0 + 22) * 9),
  };
});

const INCIDENT_TYPES = ['Bias/Discrimination', 'Data Breach', 'Model Failure', 'Regulatory Breach', 'Transparency Failure', 'Safety Incident'];
const INCIDENT_SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
const INCIDENT_STATUSES = ['Open', 'Under Review', 'Resolved', 'Escalated'];

const AI_INCIDENTS = Array.from({ length: 100 }, (_, i) => {
  const seed0 = i * 13 + 7;
  const sys = AI_SYSTEMS[Math.floor(sr(seed0) * AI_SYSTEMS.length)];
  return {
    id: i + 1,
    system: sys.name,
    type: INCIDENT_TYPES[Math.floor(sr(seed0 + 1) * INCIDENT_TYPES.length)],
    severity: INCIDENT_SEVERITIES[Math.floor(sr(seed0 + 2) * 4)],
    status: INCIDENT_STATUSES[Math.floor(sr(seed0 + 3) * 4)],
    daysOpen: Math.floor(sr(seed0 + 4) * 180),
    affectedUsers: Math.floor(sr(seed0 + 5) * 500000),
    region: REGIONS_LIST[Math.floor(sr(seed0 + 6) * REGIONS_LIST.length)],
    remediated: sr(seed0 + 7) > 0.45,
  };
});

const EU_AI_ARTICLES = [
  { art: 'Art 9', title: 'Risk Management System', desc: 'Establish, implement, document and maintain a risk management system throughout the AI lifecycle.' },
  { art: 'Art 10', title: 'Data Governance', desc: 'Training, validation and testing data must meet quality criteria; bias monitoring required.' },
  { art: 'Art 11', title: 'Technical Documentation', desc: 'Maintain technical documentation before market placement, kept up to date.' },
  { art: 'Art 13', title: 'Transparency & Information', desc: 'High-risk AI systems must be transparent; users receive meaningful information.' },
  { art: 'Art 14', title: 'Human Oversight', desc: 'Design allows human oversight; override, interrupt and correct capabilities required.' },
  { art: 'Art 15', title: 'Accuracy, Robustness & Cybersecurity', desc: 'Achieve appropriate accuracy; resilience against adversarial attacks and errors.' },
  { art: 'Art 17', title: 'Quality Management System', desc: 'Providers must implement a QMS covering entire lifecycle. ISO 9001 alignment.' },
  { art: 'Art 22', title: 'Fundamental Rights Assessment', desc: 'Public authorities must conduct FRIA before deploying high-risk AI systems.' },
  { art: 'Art 28', title: 'Obligations of Deployers', desc: 'Deployers must use systems per instructions, monitor, log and report incidents.' },
  { art: 'Art 29', title: 'Deployer Human Oversight', desc: 'Ensure output monitoring by qualified persons; suspend use if risks identified.' },
  { art: 'Art 52', title: 'Transparency for Certain AI Systems', desc: 'Chatbots and emotion recognition must disclose AI nature to users.' },
  { art: 'Art 60', title: 'EU Database for High-Risk AI', desc: 'Registration in EU AI Act database required prior to market placement.' },
  { art: 'Art 69', title: 'Codes of Conduct', desc: 'Voluntary codes for non-high-risk AI systems encouraged by Commission.' },
  { art: 'Art 72', title: 'Confidentiality', desc: 'Competent authorities and notified bodies must treat commercially sensitive data confidentially.' },
  { art: 'Art 96', title: 'Guidelines on Prohibited AI Practices', desc: 'Commission to issue guidelines on prohibited practices (Art 5) interpretation.' },
];

const NIST_SUBCATEGORIES = [
  { fn: 'Govern', sub: 'GV-1', name: 'AI Risk Policies' },
  { fn: 'Govern', sub: 'GV-2', name: 'Accountability Structures' },
  { fn: 'Govern', sub: 'GV-3', name: 'Workforce Training' },
  { fn: 'Govern', sub: 'GV-4', name: 'Organizational Culture' },
  { fn: 'Map', sub: 'MP-1', name: 'Context Identification' },
  { fn: 'Map', sub: 'MP-2', name: 'Stakeholder Engagement' },
  { fn: 'Map', sub: 'MP-3', name: 'Risk Identification' },
  { fn: 'Map', sub: 'MP-4', name: 'Impact Assessment' },
  { fn: 'Measure', sub: 'MS-1', name: 'Testing & Evaluation' },
  { fn: 'Measure', sub: 'MS-2', name: 'Bias Measurement' },
  { fn: 'Measure', sub: 'MS-3', name: 'Performance Monitoring' },
  { fn: 'Measure', sub: 'MS-4', name: 'Explainability Metrics' },
  { fn: 'Manage', sub: 'MG-1', name: 'Risk Response Plans' },
  { fn: 'Manage', sub: 'MG-2', name: 'Incident Management' },
  { fn: 'Manage', sub: 'MG-3', name: 'Continuous Improvement' },
  { fn: 'Manage', sub: 'MG-4', name: 'Third-Party Management' },
];

const PROTECTED_CHARACTERISTICS = ['Gender', 'Race/Ethnicity', 'Age', 'Disability', 'Religion', 'Nationality', 'Sexual Orientation', 'Marital Status', 'Pregnancy/Maternity', 'Socioeconomic Status', 'Language', 'Political Belief'];

const TIER_COLOR = { Unacceptable: T.red, High: T.orange, Limited: T.amber, Minimal: T.green };
const TIER_BG = { Unacceptable: '#fee2e2', High: '#ffedd5', Limited: '#fef9c3', Minimal: '#dcfce7' };
const SEV_COLOR = { Critical: T.red, High: T.orange, Medium: T.amber, Low: T.green };
const PIE_COLORS = [T.indigo, T.teal, T.amber, T.red, T.green, T.purple, T.orange, T.blue];

// ---------------------------------------------------------------------------
// Live-API mapping helpers — translate the locally-seeded system inventory
// into the request shape the backend AIGovernanceEngine (AISystemInput /
// BiasAssessmentInput) expects, and map its responses back onto display fields.
// ---------------------------------------------------------------------------

// Local SYSTEM_TYPES -> EU AI Act 2024/1689 Annex III high-risk category keys
// (keys must match EU_AI_ACT_HIGH_RISK_CATEGORIES in ai_governance_engine.py)
const TYPE_TO_AI_ACT_CATEGORY = {
  'Recruitment / HR': 'employment_hr',
  'Credit Scoring': 'essential_services',
  'Healthcare Diagnostics': 'medical_devices',
  'Autonomous Systems': 'critical_infrastructure',
  'Recommendation Engine': null,
  'Fraud Detection': 'essential_services',
  'Natural Language Processing': null,
  'Computer Vision': 'biometric_identification',
  'Predictive Analytics': null,
  'Risk Assessment': 'essential_services',
};

// Approx. grid carbon intensity by deployment region (gCO2e/kWh) — used as
// deployment_grid_carbon_gco2_kwh input to the energy-footprint calculation.
const REGION_GRID_CARBON = { EU: 311, US: 379, UK: 233, SG: 408, AU: 656, CA: 130, Other: 475 };

// Backend risk-tier enum -> frontend RISK_TIERS label
const API_TIER_TO_LABEL = {
  unacceptable: 'Unacceptable', high_risk: 'High', limited_risk: 'Limited', minimal_risk: 'Minimal',
};

// Backend bias severity -> a 0-100 "bias score" so live results can drive the
// same higher-is-worse bar charts the seeded data uses.
const BIAS_SEVERITY_TO_SCORE = { critical: 92, high: 72, medium: 50, low: 20 };

const paramScaleOf = (bn) => (bn < 1 ? 'sub_1b' : bn < 10 ? '1b_10b' : bn < 100 ? '10b_100b' : 'over_100b');

const ALL_CARD_FIELDS = ['model_details', 'intended_use', 'factors', 'metrics', 'evaluation_data', 'training_data', 'quantitative_analysis', 'ethical_considerations', 'caveats_recommendations', 'out_of_scope_uses', 'technical_specifications', 'environmental_impact'];
const modelCardFieldsOf = (docStatus) => {
  if (docStatus === 'Complete') return Object.fromEntries(ALL_CARD_FIELDS.map(k => [k, true]));
  if (docStatus === 'Missing') return Object.fromEntries(ALL_CARD_FIELDS.map(k => [k, false]));
  // Partial — first half present
  return Object.fromEntries(ALL_CARD_FIELDS.map((k, i) => [k, i % 2 === 0]));
};

// NIST AI RMF 1.0 sub-category ids (must match NIST_RMF_CATEGORIES in
// ai_governance_engine.py — 6 Govern + 5 Map + 4 Measure + 4 Manage = 19) and
// OECD AI Principles sub-indicator ids (5 principles x 2-3 sub-indicators = 12).
// Without an explicit nist_rmf_scores/oecd_scores payload the engine treats
// every category as "not assessed" (score 0) — so we derive a full score set
// from the seeded documentation/oversight signals rather than leaving these
// unset, otherwise every system's live NIST/OECD score would flatten to 0.
const NIST_ALL_CATEGORY_IDS = ['GV-1', 'GV-2', 'GV-3', 'GV-4', 'GV-5', 'GV-6', 'MP-1', 'MP-2', 'MP-3', 'MP-4', 'MP-5', 'MS-1', 'MS-2', 'MS-3', 'MS-4', 'MG-1', 'MG-2', 'MG-3', 'MG-4'];
const OECD_ALL_SUBINDICATOR_IDS = ['ig_1', 'ig_2', 'hc_1', 'hc_2', 'hc_3', 'tp_1', 'tp_2', 'tp_3', 'rb_1', 'rb_2', 'ac_1', 'ac_2'];

const docBaseScore = (docStatus) => (docStatus === 'Complete' ? 1 : docStatus === 'Partial' ? 0.5 : 0);

const nistScoresOf = (s) => {
  const base = docBaseScore(s.documentation);
  const boosted = s.humanOversight ? Math.min(1, base + 0.5) : base;
  // Alternate base/oversight-boosted score across categories so the profile
  // isn't perfectly flat, while staying fully deterministic (no PRNG).
  return Object.fromEntries(NIST_ALL_CATEGORY_IDS.map((id, i) => [id, i % 3 === 0 ? boosted : base]));
};

const oecdScoresOf = (s) => {
  const base = docBaseScore(s.documentation);
  return Object.fromEntries(OECD_ALL_SUBINDICATOR_IDS.map(id => [id, base]));
};

// Translate one seeded AI_SYSTEMS row into the AISystemInput payload shape.
const sysToApiPayload = (s) => ({
  system_id: `SYS-${s.id}`,
  system_name: s.name,
  ai_act_category: TYPE_TO_AI_ACT_CATEGORY[s.type] || null,
  is_gpai: s.type === 'Natural Language Processing' && s.modelParamsBn > 50,
  is_in_scope_eu_ai_act: true,
  parameter_scale: paramScaleOf(s.modelParamsBn),
  daily_queries: Math.round(1000 + (s.id % 20) * 4500),
  deployment_region: s.region,
  deployment_grid_carbon_gco2_kwh: REGION_GRID_CARBON[s.region] || 311,
  training_complete: true,
  model_card_fields: modelCardFieldsOf(s.documentation),
  nist_rmf_scores: nistScoresOf(s),
  oecd_scores: oecdScoresOf(s),
  sector: s.type,
});

const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px', borderLeft: accent ? `4px solid ${accent}` : undefined }}>
    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: T.textPri, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 5 }}>{sub}</div>}
  </div>
);

const SectionH = ({ title, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, borderLeft: `3px solid ${T.indigo}`, paddingLeft: 10 }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 3, paddingLeft: 13 }}>{sub}</div>}
  </div>
);

const Badge = ({ val, color, bg }) => (
  <span style={{ background: bg || '#e0e7ff', color: color || T.indigo, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{val}</span>
);

const TABS = ['AI System Inventory', 'EU AI Act Compliance', 'NIST AI RMF', 'Bias Assessment', 'AI Energy & Carbon', 'Model Risk & Docs', 'Incident Tracker', 'Governance Dashboard'];

export default function AIGovernancePage() {
  const [tab, setTab] = useState(0);

  // Inventory filters
  const [filterType, setFilterType] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterTier, setFilterTier] = useState('All');
  const [filterVendor, setFilterVendor] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedSys, setSelectedSys] = useState(AI_SYSTEMS[0]);

  // EU AI Act
  const [euSelectedSys, setEuSelectedSys] = useState(AI_SYSTEMS[0]);
  const [revenueM, setRevenueM] = useState(500);

  // NIST
  const [nistSys, setNistSys] = useState(AI_SYSTEMS[0]);
  const [nistSliders, setNistSliders] = useState({ Govern: 60, Map: 55, Measure: 50, Manage: 58 });

  // Bias
  const [biasSys, setBiasSys] = useState(AI_SYSTEMS[0]);
  const [biasDir, setBiasDir] = useState(0.82);
  const [biasSpd, setBiasSpd] = useState(-0.06);
  const [biasEog, setBiasEog] = useState(0.09);

  // Energy growth rate
  const [energyGrowth, setEnergyGrowth] = useState(12);

  // Incident filters
  const [incType, setIncType] = useState('All');
  const [incSev, setIncSev] = useState('All');
  const [incStatus, setIncStatus] = useState('All');
  const [incRegion, setIncRegion] = useState('All');

  // --- Live backend wiring (E77 AI Governance Engine) ---------------------
  // Portfolio-wide assessment: computes real EU AI Act / NIST RMF / bias /
  // energy scores for every seeded system via POST /api/v1/ai-governance/portfolio.
  // Falls back to the locally-seeded (sr() PRNG) figures, clearly labeled, if
  // the API is unreachable.
  const [portfolioLive, setPortfolioLive] = useState(null);
  const [portfolioStatus, setPortfolioStatus] = useState('loading'); // 'loading' | 'live' | 'demo'

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.post(`${AI_GOV_API}/portfolio`, {
          portfolio_id: 'AI-GOV-PORTFOLIO-001',
          organisation_name: 'Registered AI System Inventory',
          reporting_period: '2026',
          systems: AI_SYSTEMS.map(sysToApiPayload),
        }, { timeout: 15000 });
        if (!cancelled && data && data.system_results) {
          setPortfolioLive(data);
          setPortfolioStatus('live');
        } else if (!cancelled) {
          setPortfolioStatus('demo');
        }
      } catch (e) {
        if (!cancelled) setPortfolioStatus('demo');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Merge live per-system results (real EU AI Act / NIST / bias / carbon
  // figures) back onto the seeded inventory, matched by system_id. Systems
  // the API hasn't returned (e.g. call failed) keep their seeded demo values.
  const enrichedSystems = useMemo(() => {
    if (!portfolioLive || !portfolioLive.system_results) return AI_SYSTEMS;
    const byId = new Map(portfolioLive.system_results.map(r => [r.system_id, r]));
    return AI_SYSTEMS.map(s => {
      const live = byId.get(`SYS-${s.id}`);
      if (!live) return s;
      return {
        ...s,
        riskTier: API_TIER_TO_LABEL[live.eu_ai_act_risk_tier] || s.riskTier,
        euAiActScore: live.eu_ai_act_score,
        nistScore: live.nist_rmf_score,
        compliancePct: live.esg_composite_score,
        co2eTyr: Math.round(live.annual_scope2_tco2e),
        biasScore: BIAS_SEVERITY_TO_SCORE[live.bias_severity] ?? s.biasScore,
        documentation: live.model_card_completeness_pct >= 80 ? 'Complete' : live.model_card_completeness_pct >= 40 ? 'Partial' : 'Missing',
        _live: true,
      };
    });
  }, [portfolioLive]);

  // Once live data lands, re-sync any already-selected system objects so
  // detail panels reflect the real computed values instead of the seed.
  useEffect(() => {
    if (!portfolioLive) return;
    setSelectedSys(prev => enrichedSystems.find(s => s.id === prev?.id) || prev);
    setEuSelectedSys(prev => enrichedSystems.find(s => s.id === prev?.id) || prev);
    setNistSys(prev => enrichedSystems.find(s => s.id === prev?.id) || prev);
    setBiasSys(prev => enrichedSystems.find(s => s.id === prev?.id) || prev);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioLive]);

  // --- EU AI Act tab: live single-system classification -------------------
  const [euLive, setEuLive] = useState(null);
  const [euLiveStatus, setEuLiveStatus] = useState('loading');
  useEffect(() => {
    let cancelled = false;
    setEuLiveStatus('loading');
    const t = setTimeout(async () => {
      try {
        const payload = sysToApiPayload(euSelectedSys);
        const { data } = await axios.post(`${AI_GOV_API}/eu-ai-act`, {
          system_id: payload.system_id, system_name: payload.system_name,
          ai_act_category: payload.ai_act_category, is_gpai: payload.is_gpai,
          is_in_scope_eu_ai_act: payload.is_in_scope_eu_ai_act, model_card_fields: payload.model_card_fields,
        }, { timeout: 10000 });
        if (!cancelled) { setEuLive(data); setEuLiveStatus('live'); }
      } catch (e) {
        if (!cancelled) { setEuLive(null); setEuLiveStatus('demo'); }
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [euSelectedSys]);

  // --- NIST tab: live composite scoring from the 4 function sliders -------
  // Pull the authoritative NIST AI RMF 1.0 sub-category list from the engine
  // itself (GET /ref/nist-rmf-functions) so the slider->score mapping below
  // covers all 19 real sub-categories, not just the frontend's local sample.
  const [nistRefFunctions, setNistRefFunctions] = useState(null);
  useEffect(() => {
    let cancelled = false;
    axios.get(`${AI_GOV_API}/ref/nist-rmf-functions`, { timeout: 10000 })
      .then(({ data }) => { if (!cancelled && data?.functions) setNistRefFunctions(data.functions); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const [nistLive, setNistLive] = useState(null);
  const [nistLiveStatus, setNistLiveStatus] = useState('loading');
  useEffect(() => {
    let cancelled = false;
    setNistLiveStatus('loading');
    const t = setTimeout(async () => {
      try {
        // Convert each 0-100 function slider into per-sub-category scores
        // (0 / 0.5 / 1) the engine expects, applied uniformly within a function.
        const nearestHalf = v => (v >= 83 ? 1 : v >= 50 ? 0.5 : 0);
        const FN_KEY = { Govern: 'GOVERN', Map: 'MAP', Measure: 'MEASURE', Manage: 'MANAGE' };
        const scores = {};
        if (nistRefFunctions) {
          Object.entries(FN_KEY).forEach(([label, key]) => {
            const catIds = Object.keys(nistRefFunctions[key]?.categories || {});
            const v = nearestHalf(nistSliders[label]);
            catIds.forEach(id => { scores[id] = v; });
          });
        } else {
          // Reference list not loaded yet — fall back to the local sample of
          // sub-categories so the calculator still works (partial coverage).
          NIST_SUBCATEGORIES.forEach(({ fn, sub }) => { scores[sub] = nearestHalf(nistSliders[fn]); });
        }
        const { data } = await axios.post(`${AI_GOV_API}/nist-rmf`, {
          system_id: `SYS-${nistSys.id}`, system_name: nistSys.name, nist_rmf_scores: scores,
        }, { timeout: 10000 });
        if (!cancelled) { setNistLive(data); setNistLiveStatus('live'); }
      } catch (e) {
        if (!cancelled) { setNistLive(null); setNistLiveStatus('demo'); }
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [nistSliders, nistSys, nistRefFunctions]);

  // --- Bias tab: live disparate-impact / 4-5ths-rule assessment -----------
  const [biasLive, setBiasLive] = useState(null);
  const [biasLiveStatus, setBiasLiveStatus] = useState('loading');
  const BIAS_API_CHARACTERISTICS = ['gender', 'race_ethnicity', 'age', 'disability', 'religion', 'sexual_orientation', 'nationality'];
  useEffect(() => {
    let cancelled = false;
    setBiasLiveStatus('loading');
    const t = setTimeout(async () => {
      try {
        const metric_values = Object.fromEntries(BIAS_API_CHARACTERISTICS.map(c => [c, {
          disparate_impact_ratio: biasDir,
          statistical_parity_difference: biasSpd,
          equalized_odds_parity: biasEog,
        }]));
        const { data } = await axios.post(`${AI_GOV_API}/bias-assessment`, {
          system_id: `SYS-${biasSys.id}`,
          protected_characteristics: BIAS_API_CHARACTERISTICS,
          metric_values,
        }, { timeout: 10000 });
        if (!cancelled) { setBiasLive(data); setBiasLiveStatus('live'); }
      } catch (e) {
        if (!cancelled) { setBiasLive(null); setBiasLiveStatus('demo'); }
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [biasDir, biasSpd, biasEog, biasSys]);

  // --- Energy tab: live training + inference Scope 2 calculation ----------
  const [energyLive, setEnergyLive] = useState(null);
  const [energyLiveStatus, setEnergyLiveStatus] = useState('loading');
  useEffect(() => {
    let cancelled = false;
    setEnergyLiveStatus('loading');
    const t = setTimeout(async () => {
      try {
        const payload = sysToApiPayload(selectedSys);
        const { data } = await axios.post(`${AI_GOV_API}/energy-footprint`, {
          system_id: payload.system_id, system_name: payload.system_name,
          parameter_scale: payload.parameter_scale, daily_queries: payload.daily_queries,
          deployment_grid_carbon_gco2_kwh: payload.deployment_grid_carbon_gco2_kwh,
          training_complete: true, deployment_region: payload.deployment_region,
        }, { timeout: 10000 });
        if (!cancelled) { setEnergyLive(data); setEnergyLiveStatus('live'); }
      } catch (e) {
        if (!cancelled) { setEnergyLive(null); setEnergyLiveStatus('demo'); }
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [selectedSys]);

  // --- Computed data ---
  const filteredSystems = useMemo(() => enrichedSystems.filter(s => {
    if (filterType !== 'All' && s.type !== filterType) return false;
    if (filterRegion !== 'All' && s.region !== filterRegion) return false;
    if (filterTier !== 'All' && s.riskTier !== filterTier) return false;
    if (filterVendor !== 'All' && s.vendor !== filterVendor) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [enrichedSystems, filterType, filterRegion, filterTier, filterVendor, search]);

  const highRiskCount = enrichedSystems.filter(s => s.riskTier === 'High' || s.riskTier === 'Unacceptable').length;
  const avgCompliance = enrichedSystems.length ? Math.round(enrichedSystems.reduce((a, s) => a + s.compliancePct, 0) / enrichedSystems.length) : 0;
  const totalEnergy = enrichedSystems.reduce((a, s) => a + s.energyMwhYr, 0);
  const totalCo2e = enrichedSystems.reduce((a, s) => a + s.co2eTyr, 0);

  // EU compliance by type
  const euByType = useMemo(() => SYSTEM_TYPES.map(type => {
    const grp = enrichedSystems.filter(s => s.type === type);
    return { type: type.split(' / ')[0].substring(0, 12), avg: grp.length ? Math.round(grp.reduce((a, s) => a + s.euAiActScore, 0) / grp.length) : 0 };
  }), [enrichedSystems]);

  // Tier distribution
  const tierDist = useMemo(() => RISK_TIERS.map(t => ({
    name: t, value: enrichedSystems.filter(s => s.riskTier === t).length,
  })), [enrichedSystems]);

  // Article compliance for selected system — driven by the live EU AI Act
  // score from POST /api/v1/ai-governance/eu-ai-act when available, else the
  // seeded score (demo fallback, e.g. offline API).
  const euArticleStatus = useMemo(() => EU_AI_ARTICLES.map((art, i) => {
    const score = euLive ? euLive.compliance_score : euSelectedSys.euAiActScore;
    const threshold = 30 + i * 4;
    const status = score > threshold + 20 ? 'Met' : score > threshold ? 'Partial' : 'Not Met';
    return { ...art, status };
  }), [euSelectedSys, euLive]);

  const fineExposure = useMemo(() => {
    // Prefer the engine's real Art 9-49 requirements accounting when live;
    // fall back to the local 15-article threshold table.
    const metCount = euLive ? euLive.requirements_met : euArticleStatus.filter(a => a.status === 'Met').length;
    const totalReq = euLive ? euLive.requirements_total : EU_AI_ARTICLES.length;
    const notMetCount = euLive ? Math.max(0, euLive.requirements_total - euLive.requirements_met) : euArticleStatus.filter(a => a.status === 'Not Met').length;
    const maxFineM = Math.max(30, revenueM * 0.06);
    const exposure = Math.round(maxFineM * (totalReq > 0 ? notMetCount / totalReq : 0));
    return { metCount, notMetCount, exposure, maxFineM: maxFineM.toFixed(1) };
  }, [euArticleStatus, revenueM, euLive]);

  // NIST scores for selected system
  const nistRadarData = useMemo(() => [
    { subject: 'Govern', score: Math.round(20 + sr(nistSys.id * 7) * 70), target: 80 },
    { subject: 'Map', score: Math.round(20 + sr(nistSys.id * 7 + 1) * 70), target: 80 },
    { subject: 'Measure', score: Math.round(20 + sr(nistSys.id * 7 + 2) * 70), target: 80 },
    { subject: 'Manage', score: Math.round(20 + sr(nistSys.id * 7 + 3) * 70), target: 80 },
  ], [nistSys]);

  const nistTop20 = useMemo(() => [...enrichedSystems].sort((a, b) => b.nistScore - a.nistScore).slice(0, 20).map(s => ({ name: s.name.substring(0, 10), score: s.nistScore })), [enrichedSystems]);

  const nistGapData = useMemo(() => {
    const fns = ['Govern', 'Map', 'Measure', 'Manage'];
    return fns.map((fn, fi) => {
      const avg = Math.round(enrichedSystems.reduce((a, s) => a + Math.round(20 + sr(s.id * 7 + fi) * 70), 0) / Math.max(1, enrichedSystems.length));
      return { fn, avg, target: 80, gap: Math.max(0, 80 - avg) };
    });
  }, [enrichedSystems]);

  // Live weighted NIST AI RMF 1.0 composite (POST /api/v1/ai-governance/nist-rmf)
  // when reachable; otherwise a simple unweighted average of the 4 sliders (demo fallback).
  const customNistScore = useMemo(() => (
    nistLive ? Math.round(nistLive.overall_score)
      : Math.round((nistSliders.Govern + nistSliders.Map + nistSliders.Measure + nistSliders.Manage) / 4)
  ), [nistSliders, nistLive]);

  // Bias data
  const biasBarData = useMemo(() => PROTECTED_CHARACTERISTICS.map((c, i) => ({
    name: c.split('/')[0].substring(0, 10),
    dir: parseFloat((0.65 + sr(i * 11 + biasSys.id) * 0.45).toFixed(2)),
    threshold: 0.8,
  })), [biasSys]);

  const biasByType = useMemo(() => SYSTEM_TYPES.map(type => {
    const grp = enrichedSystems.filter(s => s.type === type);
    return { type: type.split(' / ')[0].substring(0, 10), avg: grp.length ? Math.round(grp.reduce((a, s) => a + s.biasScore, 0) / grp.length) : 0 };
  }), [enrichedSystems]);

  const biasTop20 = useMemo(() => [...enrichedSystems].sort((a, b) => b.biasScore - a.biasScore).slice(0, 20).map(s => ({ name: s.name.substring(0, 10), score: s.biasScore })), [enrichedSystems]);

  // Live severity from POST /api/v1/ai-governance/bias-assessment (4/5ths-rule
  // DIR + statistical parity + equalized-odds engine); local heuristic is the
  // demo fallback if the API call fails.
  const SEVERITY_API_TO_LABEL = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
  const biasSeverity = useMemo(() => {
    if (biasLive) return SEVERITY_API_TO_LABEL[biasLive.overall_bias_severity] || 'Low';
    if (biasDir < 0.7 || Math.abs(biasSpd) > 0.1 || biasEog > 0.15) return 'Critical';
    if (biasDir < 0.8 || Math.abs(biasSpd) > 0.05 || biasEog > 0.1) return 'High';
    if (biasDir < 0.9 || Math.abs(biasSpd) > 0.02 || biasEog > 0.05) return 'Medium';
    return 'Low';
  }, [biasDir, biasSpd, biasEog, biasLive]);

  const biasRemediation = useMemo(() => {
    if (biasLive && biasLive.recommendations) return biasLive.recommendations;
    const sev = biasSeverity;
    if (sev === 'Critical') return ['Suspend automated decisions immediately', 'Conduct full dataset audit', 'Retrain model with balanced data', 'Engage independent bias auditor'];
    if (sev === 'High') return ['Implement human review layer', 'Recalibrate decision thresholds', 'Expand protected class training data', 'File regulatory disclosure'];
    if (sev === 'Medium') return ['Increase monitoring frequency', 'Review feature selection', 'Test with fairness constraints'];
    return ['Continue monitoring', 'Document current metrics', 'Schedule quarterly review'];
  }, [biasSeverity, biasLive]);

  // Energy data
  const energyByScale = useMemo(() => {
    const bands = [['<7B', 0, 7], ['7–30B', 7, 30], ['30–100B', 30, 100], ['>100B', 100, Infinity]];
    return bands.map(([label, lo, hi]) => {
      const grp = enrichedSystems.filter(s => s.modelParamsBn >= lo && s.modelParamsBn < hi);
      return { label, total: grp.reduce((a, s) => a + s.energyMwhYr, 0) };
    });
  }, [enrichedSystems]);

  const co2ByVendor = useMemo(() => VENDORS.map(v => ({
    name: v, value: enrichedSystems.filter(s => s.vendor === v).reduce((a, s) => a + s.co2eTyr, 0),
  })).filter(v => v.value > 0), [enrichedSystems]);

  const energyProjection = useMemo(() => {
    const base = totalEnergy;
    return Array.from({ length: 6 }, (_, i) => ({
      year: 2025 + i,
      mwh: Math.round(base * Math.pow(1 + energyGrowth / 100, i)),
      co2e: Math.round(totalCo2e * Math.pow(1 + energyGrowth / 100, i)),
    }));
  }, [energyGrowth, totalEnergy, totalCo2e]);

  const energyByType = useMemo(() => SYSTEM_TYPES.map(type => {
    const grp = enrichedSystems.filter(s => s.type === type);
    const totalMwh = grp.reduce((a, s) => a + s.energyMwhYr, 0);
    const totalQ = grp.reduce((a, s) => a + Math.round(1000 + sr(s.id * 3) * 50000), 0);
    return { type: type.split(' / ')[0].substring(0, 12), intensity: totalQ > 0 ? parseFloat((totalMwh / totalQ * 1000).toFixed(3)) : 0 };
  }), [enrichedSystems]);

  // Model risk
  const docByType = useMemo(() => SYSTEM_TYPES.map(type => {
    const grp = enrichedSystems.filter(s => s.type === type);
    const complete = grp.filter(s => s.documentation === 'Complete').length;
    return { type: type.split(' / ')[0].substring(0, 12), pct: grp.length ? Math.round(complete / grp.length * 100) : 0 };
  }), [enrichedSystems]);

  const oversightByTier = useMemo(() => RISK_TIERS.map(tier => {
    const grp = enrichedSystems.filter(s => s.riskTier === tier);
    const withOversight = grp.filter(s => s.humanOversight).length;
    return { tier, pct: grp.length ? Math.round(withOversight / grp.length * 100) : 0 };
  }), [enrichedSystems]);

  const trlDist = useMemo(() => Array.from({ length: 9 }, (_, i) => ({
    trl: `TRL ${i + 1}`, count: enrichedSystems.filter(s => s.trlAi === i + 1).length,
  })), [enrichedSystems]);

  const incidentTop20 = useMemo(() => [...enrichedSystems].sort((a, b) => b.incidentCount - a.incidentCount).slice(0, 20).map(s => ({ name: s.name.substring(0, 10), count: s.incidentCount })), [enrichedSystems]);

  const riskMatrix = useMemo(() => enrichedSystems.slice(0, 80).map(s => ({ x: s.compliancePct, y: s.incidentCount, name: s.name })), [enrichedSystems]);

  // Incidents
  const filteredIncidents = useMemo(() => AI_INCIDENTS.filter(inc => {
    if (incType !== 'All' && inc.type !== incType) return false;
    if (incSev !== 'All' && inc.severity !== incSev) return false;
    if (incStatus !== 'All' && inc.status !== incStatus) return false;
    if (incRegion !== 'All' && inc.region !== incRegion) return false;
    return true;
  }), [incType, incSev, incStatus, incRegion]);

  const incSeverityDist = useMemo(() => INCIDENT_SEVERITIES.map(sev => ({
    name: sev, value: AI_INCIDENTS.filter(i => i.severity === sev).length,
  })), []);

  const incByType = useMemo(() => INCIDENT_TYPES.map(type => ({
    type: type.split('/')[0].substring(0, 14), count: AI_INCIDENTS.filter(i => i.type === type).length,
  })), []);

  const daysOpenHist = useMemo(() => {
    const bins = [[0, 30], [30, 60], [60, 90], [90, 120], [120, 180], [180, 999]];
    return bins.map(([lo, hi]) => ({
      range: hi === 999 ? '180+d' : `${lo}-${hi}d`,
      count: AI_INCIDENTS.filter(i => i.daysOpen >= lo && i.daysOpen < hi).length,
    }));
  }, []);

  const resolutionByType = useMemo(() => INCIDENT_TYPES.map(type => {
    const grp = AI_INCIDENTS.filter(i => i.type === type);
    const resolved = grp.filter(i => i.remediated).length;
    return { type: type.split('/')[0].substring(0, 14), rate: grp.length ? Math.round(resolved / grp.length * 100) : 0 };
  }), []);

  // Dashboard
  const complianceTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const years = [2024, 2025, 2026];
    return years.flatMap((yr, yi) => months.slice(0, yr === 2026 ? 4 : 12).map((m, mi) => ({
      month: `${m} ${yr}`,
      compliance: Math.round(45 + (yi * 12 + mi) * 0.8 + sr(yi * 12 + mi + 200) * 8),
      nist: Math.round(40 + (yi * 12 + mi) * 0.7 + sr(yi * 12 + mi + 300) * 8),
    })));
  }, []);

  const dashRadar = [
    { subject: 'EU AI Act', score: avgCompliance },
    { subject: 'NIST RMF', score: Math.round(enrichedSystems.reduce((a, s) => a + s.nistScore, 0) / Math.max(1, enrichedSystems.length)) },
    { subject: 'Bias Control', score: 100 - Math.round(enrichedSystems.reduce((a, s) => a + s.biasScore, 0) / Math.max(1, enrichedSystems.length)) },
    { subject: 'Energy Eff.', score: Math.round(60 + sr(500) * 25) },
    { subject: 'Documentation', score: Math.round(enrichedSystems.filter(s => s.documentation === 'Complete').length / Math.max(1, enrichedSystems.length) * 100) },
  ];

  const criticalSystems = enrichedSystems.filter(s => s.riskTier === 'Unacceptable' || (s.riskTier === 'High' && s.compliancePct < 40)).length;

  const selPx = { fontSize: 13, padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, color: T.textPri };
  const inpPx = { fontSize: 13, padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, color: T.textPri, width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: T.gold, fontSize: 11, fontFamily: T.fontMono, letterSpacing: '0.12em', marginBottom: 4 }}>MODULE E77 · AI GOVERNANCE</div>
            <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, margin: 0 }}>AI Governance & Regulatory Compliance</h1>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>EU AI Act · NIST AI RMF 1.0 · Bias Assessment · Energy & Carbon · 200 Systems Registry</div>
            <div style={{ marginTop: 8 }}>
              {portfolioStatus === 'loading' && <Badge val="Connecting to AI Governance Engine…" color="#94a3b8" bg="#1e293b" />}
              {portfolioStatus === 'live' && <Badge val="● Live — scores computed by /api/v1/ai-governance engine (EU AI Act 2024/1689 · NIST AI RMF 1.0)" color="#166534" bg="#dcfce7" />}
              {portfolioStatus === 'demo' && <Badge val="○ Demo Data — AI Governance API unavailable, showing seeded illustrative figures" color="#92400e" bg="#fef3c7" />}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: T.fontMono, fontSize: 11, color: '#94a3b8' }}>
            <div>{enrichedSystems.length} Systems Registered</div>
            <div>{AI_INCIDENTS.length} Incidents Tracked</div>
            <div>Avg Compliance: {avgCompliance}%</div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, display: 'flex', overflowX: 'auto', padding: '0 24px' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '13px 18px', border: 'none', cursor: 'pointer', background: 'none', whiteSpace: 'nowrap',
            fontSize: 13, fontWeight: 600, color: tab === i ? T.indigo : T.textSec,
            borderBottom: tab === i ? `2px solid ${T.indigo}` : '2px solid transparent',
            transition: 'color 0.15s',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '28px 32px' }}>

        {/* TAB 0 — AI System Inventory */}
        {tab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              <KpiCard label="Total AI Systems" value="200" sub="Across all regions & types" accent={T.indigo} />
              <KpiCard label="High / Unacceptable Risk" value={highRiskCount} sub="Requires priority action" accent={T.red} />
              <KpiCard label="Avg Compliance" value={`${avgCompliance}%`} sub="Across EU AI Act framework" accent={T.amber} />
              <KpiCard label="Total Energy (MWh/yr)" value={totalEnergy.toLocaleString()} sub="Portfolio-wide consumption" accent={T.teal} />
            </div>

            {/* Filters */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Filter Systems</div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 12 }}>
                <input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} style={inpPx} />
                <select style={selPx} value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="All">All Types</option>
                  {SYSTEM_TYPES.map(t => <option key={t} value={t}>{t.substring(0, 18)}</option>)}
                </select>
                <select style={selPx} value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
                  <option value="All">All Regions</option>
                  {REGIONS_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select style={selPx} value={filterTier} onChange={e => setFilterTier(e.target.value)}>
                  <option value="All">All Risk Tiers</option>
                  {RISK_TIERS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select style={selPx} value={filterVendor} onChange={e => setFilterVendor(e.target.value)}>
                  <option value="All">All Vendors</option>
                  {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 8 }}>Showing {filteredSystems.length} of 200 systems</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
              {/* Table */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ overflowY: 'auto', maxHeight: 520 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead style={{ background: T.sub, position: 'sticky', top: 0 }}>
                      <tr>
                        {['Name', 'Type', 'Region', 'Risk Tier', 'EU Score', 'NIST', 'Compliance'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSystems.slice(0, 60).map(s => (
                        <tr key={s.id} onClick={() => setSelectedSys(s)} style={{ borderBottom: `1px solid ${T.borderL}`, cursor: 'pointer', background: selectedSys?.id === s.id ? '#eef2ff' : 'white' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy, fontFamily: T.fontMono, fontSize: 12 }}>{s.name}</td>
                          <td style={{ padding: '8px 12px', color: T.textSec }}>{s.type.split(' / ')[0].substring(0, 14)}</td>
                          <td style={{ padding: '8px 12px' }}><Badge val={s.region} color={T.blue} bg="#dbeafe" /></td>
                          <td style={{ padding: '8px 12px' }}><Badge val={s.riskTier} color={TIER_COLOR[s.riskTier]} bg={TIER_BG[s.riskTier]} /></td>
                          <td style={{ padding: '8px 12px', color: s.euAiActScore < 40 ? T.red : s.euAiActScore < 65 ? T.amber : T.green, fontWeight: 700, fontFamily: T.fontMono }}>{s.euAiActScore}</td>
                          <td style={{ padding: '8px 12px', color: T.textSec, fontFamily: T.fontMono }}>{s.nistScore}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, fontFamily: T.fontMono, color: s.compliancePct < 40 ? T.red : s.compliancePct < 70 ? T.amber : T.green }}>{s.compliancePct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detail panel */}
              {selectedSys && (
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 4, fontFamily: T.fontMono }}>{selectedSys.name}</div>
                  <Badge val={selectedSys.riskTier} color={TIER_COLOR[selectedSys.riskTier]} bg={TIER_BG[selectedSys.riskTier]} />
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      ['Type', selectedSys.type],
                      ['Region', selectedSys.region],
                      ['Vendor', selectedSys.vendor],
                      ['Model Params', `${selectedSys.modelParamsBn}B`],
                      ['TRL-AI', selectedSys.trlAi + ' / 9'],
                      ['EU AI Act Score', selectedSys.euAiActScore + ' / 100'],
                      ['NIST RMF Score', selectedSys.nistScore + ' / 100'],
                      ['Bias Score', selectedSys.biasScore + ' / 100'],
                      ['Compliance', selectedSys.compliancePct + '%'],
                      ['Documentation', selectedSys.documentation],
                      ['Human Oversight', selectedSys.humanOversight ? 'Yes' : 'No'],
                      ['Auto Decisions', selectedSys.autoDecision ? 'Yes' : 'No'],
                      ['Biometric Data', selectedSys.biometricData ? 'Yes' : 'No'],
                      ['Energy (MWh/yr)', selectedSys.energyMwhYr.toLocaleString()],
                      ['CO₂e (t/yr)', selectedSys.co2eTyr.toLocaleString()],
                      ['Incidents', selectedSys.incidentCount],
                      ['Last Audit', selectedSys.lastAudit],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${T.borderL}`, paddingBottom: 6, fontSize: 13 }}>
                        <span style={{ color: T.textSec }}>{k}</span>
                        <span style={{ fontWeight: 600, color: T.textPri, fontFamily: typeof v === 'number' || (typeof v === 'string' && /\d/.test(v)) ? T.fontMono : 'inherit' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1 — EU AI Act Compliance */}
        {tab === 1 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              <KpiCard label="High-Risk Systems" value={enrichedSystems.filter(s => s.riskTier === 'High').length} accent={T.orange} />
              <KpiCard label="Unacceptable Risk" value={enrichedSystems.filter(s => s.riskTier === 'Unacceptable').length} accent={T.red} />
              <KpiCard label="Avg EU Compliance" value={`${avgCompliance}%`} accent={T.indigo} />
              <KpiCard label="Systems Fully Compliant" value={enrichedSystems.filter(s => s.compliancePct >= 80).length} accent={T.green} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Risk Tier Distribution" />
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={tierDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {tierDist.map((t, i) => <Cell key={i} fill={TIER_COLOR[t.name]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Avg EU Compliance by System Type" />
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={euByType} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="avg" fill={T.indigo} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Article compliance for selected system */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <SectionH title="Article-by-Article Status & Fine Exposure" />
                <select style={{ ...selPx, marginLeft: 'auto' }} value={euSelectedSys.id} onChange={e => setEuSelectedSys(enrichedSystems.find(s => s.id === parseInt(e.target.value)))}>
                  {enrichedSystems.slice(0, 50).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
                <div style={{ overflowY: 'auto', maxHeight: 380 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead style={{ background: T.sub }}>
                      <tr>
                        {['Article', 'Requirement', 'Status'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.navy, fontSize: 11, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {euArticleStatus.map((a, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                          <td style={{ padding: '8px 12px', fontFamily: T.fontMono, fontSize: 12, color: T.navy, fontWeight: 700 }}>{a.art}</td>
                          <td style={{ padding: '8px 12px', color: T.textSec }}>{a.title}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <Badge val={a.status}
                              color={a.status === 'Met' ? T.green : a.status === 'Partial' ? T.amber : T.red}
                              bg={a.status === 'Met' ? '#dcfce7' : a.status === 'Partial' ? '#fef9c3' : '#fee2e2'} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ background: T.sub, borderRadius: 8, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>Fine Exposure Calculator</div>
                    {euLiveStatus === 'live' && <Badge val="Live" color="#166534" bg="#dcfce7" />}
                    {euLiveStatus === 'demo' && <Badge val="Demo" color="#92400e" bg="#fef3c7" />}
                    {euLiveStatus === 'loading' && <Badge val="…" color={T.textSec} bg={T.sub} />}
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>Annual Revenue (€M)</div>
                  <input type="number" value={revenueM} onChange={e => setRevenueM(Math.max(1, parseFloat(e.target.value) || 1))} style={{ ...inpPx, marginBottom: 14 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      ['Requirements Met', fineExposure.metCount, T.green],
                      ['Requirements Not Met', fineExposure.notMetCount, T.red],
                      ['Max Fine (€M)', fineExposure.maxFineM, T.orange],
                      ['Estimated Exposure (€M)', fineExposure.exposure, T.red],
                    ].map(([label, val, color]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                        <span style={{ color: T.textSec }}>{label}</span>
                        <span style={{ fontWeight: 700, color, fontFamily: T.fontMono }}>{val}</span>
                      </div>
                    ))}
                  </div>
                  {euLive && (
                    <div style={{ marginTop: 12, background: '#eef2ff', borderRadius: 6, padding: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.indigo, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Live Classification — {euLive.risk_tier.replace('_', ' ')}</div>
                      <div style={{ fontSize: 12, color: T.textPri, marginTop: 4 }}>{euLive.tier_description}</div>
                      {euLive.is_gpai && euLive.gpai_obligations?.length > 0 && (
                        <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>GPAI obligations: {euLive.gpai_obligations.join(', ')}</div>
                      )}
                    </div>
                  )}
                  <div style={{ marginTop: 12, fontSize: 11, color: T.textSec }}>EU AI Act Art 99: fines up to €30M or 6% global revenue (whichever higher) for Art 5 violations; €20M or 4% for high-risk breaches.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2 — NIST AI RMF */}
        {tab === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              {['Govern', 'Map', 'Measure', 'Manage'].map((fn, fi) => {
                const avg = Math.round(enrichedSystems.reduce((a, s) => a + Math.round(20 + sr(s.id * 7 + fi) * 70), 0) / Math.max(1, enrichedSystems.length));
                return <KpiCard key={fn} label={`NIST ${fn} (avg)`} value={`${avg}/100`} sub={avg >= 80 ? 'On target' : `Gap: ${80 - avg}pts`} accent={avg >= 80 ? T.green : T.amber} />;
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <SectionH title="NIST Radar — Selected System" />
                  <select style={selPx} value={nistSys.id} onChange={e => setNistSys(enrichedSystems.find(s => s.id === parseInt(e.target.value)))}>
                    {enrichedSystems.slice(0, 50).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={nistRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: T.textSec }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Score" dataKey="score" stroke={T.indigo} fill={T.indigo} fillOpacity={0.25} />
                    <Radar name="Target" dataKey="target" stroke={T.green} fill="transparent" strokeDasharray="4 4" />
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Function Gap Analysis — Portfolio Average vs Target (80)" />
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={nistGapData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fn" tick={{ fontSize: 13 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg" fill={T.indigo} name="Portfolio Avg" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gap" fill={T.red} name="Gap to Target" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="NIST Score — Top 20 Systems" />
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={nistTop20}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill={T.teal} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <SectionH title="Custom NIST Score Calculator" sub="Adjust sliders to compute blended score" />
                  {nistLiveStatus === 'live' && <Badge val="Live" color="#166534" bg="#dcfce7" />}
                  {nistLiveStatus === 'demo' && <Badge val="Demo" color="#92400e" bg="#fef3c7" />}
                  {nistLiveStatus === 'loading' && <Badge val="…" color={T.textSec} bg={T.sub} />}
                </div>
                {['Govern', 'Map', 'Measure', 'Manage'].map(fn => (
                  <div key={fn} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: T.textSec }}>{fn}</span>
                      <span style={{ fontWeight: 700, color: T.indigo, fontFamily: T.fontMono }}>{nistSliders[fn]}/100</span>
                    </div>
                    <input type="range" min={0} max={100} value={nistSliders[fn]} onChange={e => setNistSliders(prev => ({ ...prev, [fn]: parseInt(e.target.value) }))} style={{ width: '100%', accentColor: T.indigo }} />
                  </div>
                ))}
                <div style={{ background: T.sub, borderRadius: 8, padding: 12, textAlign: 'center', marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Composite NIST Score {nistLive ? `(${nistLive.rmf_tier})` : ''}</div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: customNistScore >= 80 ? T.green : customNistScore >= 60 ? T.amber : T.red, fontFamily: T.fontMono }}>{customNistScore}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>{customNistScore >= 80 ? 'Target Met' : `${80 - customNistScore}pts below target`}</div>
                  {nistLive && nistLive.improvement_gaps?.length > 0 && (
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 8, textAlign: 'left' }}>Gaps: {nistLive.improvement_gaps.join('; ')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3 — Bias Assessment */}
        {tab === 3 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              <KpiCard label="Avg Bias Score" value={Math.round(enrichedSystems.reduce((a, s) => a + s.biasScore, 0) / Math.max(1, enrichedSystems.length))} sub="Lower = less bias" accent={T.red} />
              <KpiCard label="Systems with Bias >60" value={enrichedSystems.filter(s => s.biasScore > 60).length} accent={T.orange} />
              <KpiCard label="Protected Characteristics" value={PROTECTED_CHARACTERISTICS.length} sub="Assessed" accent={T.indigo} />
              <KpiCard label="Auto-Decision Systems" value={enrichedSystems.filter(s => s.autoDecision).length} sub="Requires bias monitoring" accent={T.amber} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <SectionH title="Disparate Impact by Protected Characteristic" />
                  <select style={selPx} value={biasSys.id} onChange={e => setBiasSys(enrichedSystems.find(s => s.id === parseInt(e.target.value)))}>
                    {enrichedSystems.slice(0, 50).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={biasBarData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                    <YAxis domain={[0, 1.3]} />
                    <Tooltip />
                    <Bar dataKey="dir" fill={T.indigo} name="DIR" radius={[4, 4, 0, 0]}>
                      {biasBarData.map((d, i) => <Cell key={i} fill={d.dir < 0.8 ? T.red : d.dir < 0.9 ? T.amber : T.green} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Red bars = DIR &lt; 0.8 (adverse impact threshold — 4/5ths rule)</div>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Avg Bias Score by System Type" />
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={biasByType} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                      {biasByType.map((d, i) => <Cell key={i} fill={d.avg > 60 ? T.red : d.avg > 40 ? T.amber : T.green} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Top 20 Most Biased Systems" />
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={biasTop20}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill={T.red} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <SectionH title="Interactive Bias Calculator" sub="Enter metrics → get severity + actions (4/5ths Rule)" />
                  {biasLiveStatus === 'live' && <Badge val="Live" color="#166534" bg="#dcfce7" />}
                  {biasLiveStatus === 'demo' && <Badge val="Demo" color="#92400e" bg="#fef3c7" />}
                  {biasLiveStatus === 'loading' && <Badge val="…" color={T.textSec} bg={T.sub} />}
                </div>
                {[
                  ['Disparate Impact Ratio', biasDir, setBiasDir, 0, 1.5, 0.01],
                  ['Stat. Parity Difference', biasSpd, setBiasSpd, -0.5, 0.5, 0.01],
                  ['Equalized Odds Gap', biasEog, setBiasEog, 0, 0.5, 0.01],
                ].map(([label, val, set, min, max, step]) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ color: T.textSec }}>{label}</span>
                      <span style={{ fontFamily: T.fontMono, fontWeight: 700, color: T.indigo }}>{Number(val).toFixed(2)}</span>
                    </div>
                    <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(parseFloat(e.target.value))} style={{ width: '100%', accentColor: T.indigo }} />
                  </div>
                ))}
                <div style={{ background: TIER_BG[biasSeverity === 'Critical' ? 'Unacceptable' : biasSeverity === 'High' ? 'High' : biasSeverity === 'Medium' ? 'Limited' : 'Minimal'], borderRadius: 8, padding: 12, marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bias Severity</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: SEV_COLOR[biasSeverity], marginBottom: 8 }}>{biasSeverity}</div>
                  {biasRemediation.map((action, i) => (
                    <div key={i} style={{ fontSize: 12, color: T.textPri, marginBottom: 4 }}>• {action}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4 — AI Energy & Carbon */}
        {tab === 4 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              <KpiCard label="Total Energy (MWh/yr)" value={totalEnergy.toLocaleString()} accent={T.teal} />
              <KpiCard label="Total CO₂e (t/yr)" value={totalCo2e.toLocaleString()} accent={T.amber} />
              <KpiCard label="Avg Energy / System" value={`${Math.round(totalEnergy / Math.max(1, enrichedSystems.length)).toLocaleString()} MWh`} accent={T.indigo} />
              <KpiCard label="Avg CO₂e / System" value={`${Math.round(totalCo2e / Math.max(1, enrichedSystems.length)).toLocaleString()} t`} accent={T.orange} />
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <SectionH title="Live Single-System Energy Assessment" sub="Training + inference Scope 2 emissions — POST /api/v1/ai-governance/energy-footprint" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {energyLiveStatus === 'live' && <Badge val="Live" color="#166534" bg="#dcfce7" />}
                  {energyLiveStatus === 'demo' && <Badge val="Demo" color="#92400e" bg="#fef3c7" />}
                  {energyLiveStatus === 'loading' && <Badge val="…" color={T.textSec} bg={T.sub} />}
                  <select style={selPx} value={selectedSys.id} onChange={e => setSelectedSys(enrichedSystems.find(s => s.id === parseInt(e.target.value)))}>
                    {enrichedSystems.slice(0, 50).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              {energyLive ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                  <div><div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase' }}>Training Energy</div><div style={{ fontSize: 18, fontWeight: 700, fontFamily: T.fontMono, color: T.navy }}>{energyLive.training_energy_mwh.toLocaleString()} MWh</div></div>
                  <div><div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase' }}>Inference (annual)</div><div style={{ fontSize: 18, fontWeight: 700, fontFamily: T.fontMono, color: T.navy }}>{energyLive.inference_annual_energy_mwh.toLocaleString()} MWh</div></div>
                  <div><div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase' }}>Annual Scope 2</div><div style={{ fontSize: 18, fontWeight: 700, fontFamily: T.fontMono, color: T.amber }}>{energyLive.annual_scope2_tco2e.toFixed(3)} tCO₂e</div></div>
                  <div><div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase' }}>EU-Avg Benchmark</div><div style={{ fontSize: 18, fontWeight: 700, fontFamily: T.fontMono, color: T.textSec }}>{energyLive.benchmark_scope2_tco2e_eu_avg.toFixed(3)} tCO₂e</div></div>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: T.textSec }}>{energyLiveStatus === 'loading' ? 'Calculating…' : 'API unavailable — showing seeded portfolio figures below.'}</div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Annual MWh by Model Scale" />
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={energyByScale}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip formatter={v => `${v.toLocaleString()} MWh`} />
                    <Bar dataKey="total" fill={T.teal} radius={[4, 4, 0, 0]} name="MWh/yr" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="tCO₂e by Vendor" />
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={co2ByVendor} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}>
                      {co2ByVendor.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => `${v.toLocaleString()} tCO₂e`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="5-Year Energy & CO₂e Projection" sub="Based on portfolio growth rate" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: T.textSec }}>Annual Growth Rate: <strong style={{ color: T.indigo, fontFamily: T.fontMono }}>{energyGrowth}%</strong></span>
                  <input type="range" min={0} max={50} value={energyGrowth} onChange={e => setEnergyGrowth(parseInt(e.target.value))} style={{ flex: 1, accentColor: T.indigo }} />
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={energyProjection}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="mwh" stroke={T.teal} strokeWidth={2} dot={{ r: 4 }} name="MWh/yr" />
                    <Line yAxisId="right" type="monotone" dataKey="co2e" stroke={T.amber} strokeWidth={2} dot={{ r: 4 }} name="tCO₂e/yr" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Energy Intensity by System Type" sub="MWh per 1,000 queries" />
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={energyByType} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip formatter={v => `${v.toFixed(3)} MWh`} />
                    <Bar dataKey="intensity" fill={T.teal} radius={[0, 4, 4, 0]} name="MWh/1k queries" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5 — Model Risk & Documentation */}
        {tab === 5 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              <KpiCard label="Documentation Complete" value={`${enrichedSystems.filter(s => s.documentation === 'Complete').length}`} sub={`${Math.round(enrichedSystems.filter(s => s.documentation === 'Complete').length / Math.max(1, enrichedSystems.length) * 100)}% of systems`} accent={T.green} />
              <KpiCard label="Documentation Missing" value={enrichedSystems.filter(s => s.documentation === 'Missing').length} accent={T.red} />
              <KpiCard label="Human Oversight Enabled" value={`${Math.round(enrichedSystems.filter(s => s.humanOversight).length / Math.max(1, enrichedSystems.length) * 100)}%`} accent={T.indigo} />
              <KpiCard label="Avg Incidents / System" value={(enrichedSystems.reduce((a, s) => a + s.incidentCount, 0) / Math.max(1, enrichedSystems.length)).toFixed(1)} accent={T.orange} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Documentation Completeness by System Type" />
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={docByType} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip formatter={v => `${v}%`} />
                    <Bar dataKey="pct" radius={[0, 4, 4, 0]} name="Complete %">
                      {docByType.map((d, i) => <Cell key={i} fill={d.pct >= 70 ? T.green : d.pct >= 40 ? T.amber : T.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Human Oversight Rate by Risk Tier" />
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={oversightByTier}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tier" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={v => `${v}%`} />
                    <Bar dataKey="pct" radius={[4, 4, 0, 0]} name="Oversight Rate %">
                      {oversightByTier.map((d, i) => <Cell key={i} fill={TIER_COLOR[d.tier]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="TRL-AI Distribution" sub="Technology Readiness Level (1=Research → 9=Proven)" />
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trlDist}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="trl" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={T.indigo} radius={[4, 4, 0, 0]} name="Systems" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Model Risk Matrix" sub="Incident count vs Compliance %" />
                <ResponsiveContainer width="100%" height={200}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" name="Compliance %" domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: 'Compliance %', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                    <YAxis dataKey="y" name="Incidents" tick={{ fontSize: 11 }} label={{ value: 'Incidents', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={riskMatrix} fill={T.indigo} fillOpacity={0.6} name="Systems" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 20 }}>
              <SectionH title="Top 20 Systems by Incident Count" />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={incidentTop20}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.orange} radius={[4, 4, 0, 0]} name="Incident Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 6 — Incident Tracker */}
        {tab === 6 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              <KpiCard label="Total Incidents" value={AI_INCIDENTS.length} accent={T.red} />
              <KpiCard label="Critical / High" value={AI_INCIDENTS.filter(i => i.severity === 'Critical' || i.severity === 'High').length} accent={T.orange} />
              <KpiCard label="Open / Escalated" value={AI_INCIDENTS.filter(i => i.status === 'Open' || i.status === 'Escalated').length} accent={T.amber} />
              <KpiCard label="Remediation Rate" value={`${Math.round(AI_INCIDENTS.filter(i => i.remediated).length / Math.max(1, AI_INCIDENTS.length) * 100)}%`} accent={T.green} />
            </div>

            {/* Filters */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 20px', marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  ['Type', incType, setIncType, ['All', ...INCIDENT_TYPES]],
                  ['Severity', incSev, setIncSev, ['All', ...INCIDENT_SEVERITIES]],
                  ['Status', incStatus, setIncStatus, ['All', ...INCIDENT_STATUSES]],
                  ['Region', incRegion, setIncRegion, ['All', ...REGIONS_LIST]],
                ].map(([label, val, set, opts]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                    <select style={selPx} value={val} onChange={e => set(e.target.value)}>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 8 }}>Showing {filteredIncidents.length} incidents</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Severity Distribution" />
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={incSeverityDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                      {incSeverityDist.map((d, i) => <Cell key={i} fill={SEV_COLOR[d.name]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Days Open Histogram" />
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={daysOpenHist}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={T.amber} radius={[4, 4, 0, 0]} name="Incidents" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Incidents by Type" />
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={incByType} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill={T.red} radius={[0, 4, 4, 0]} name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Resolution Rate by Incident Type" />
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={resolutionByType} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip formatter={v => `${v}%`} />
                    <Bar dataKey="rate" radius={[0, 4, 4, 0]} name="Resolution %">
                      {resolutionByType.map((d, i) => <Cell key={i} fill={d.rate >= 70 ? T.green : d.rate >= 40 ? T.amber : T.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Incidents table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ overflowY: 'auto', maxHeight: 400 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead style={{ background: T.sub, position: 'sticky', top: 0 }}>
                    <tr>
                      {['ID', 'System', 'Type', 'Severity', 'Status', 'Days Open', 'Affected Users', 'Region', 'Remediated'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncidents.slice(0, 50).map(inc => (
                      <tr key={inc.id} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                        <td style={{ padding: '8px 12px', fontFamily: T.fontMono, fontSize: 12, color: T.textSec }}>INC-{inc.id}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{inc.system}</td>
                        <td style={{ padding: '8px 12px', color: T.textSec, fontSize: 12 }}>{inc.type}</td>
                        <td style={{ padding: '8px 12px' }}><Badge val={inc.severity} color={SEV_COLOR[inc.severity]} bg={inc.severity === 'Critical' ? '#fee2e2' : inc.severity === 'High' ? '#ffedd5' : inc.severity === 'Medium' ? '#fef9c3' : '#dcfce7'} /></td>
                        <td style={{ padding: '8px 12px' }}><Badge val={inc.status} color={inc.status === 'Resolved' ? T.green : inc.status === 'Escalated' ? T.red : T.amber} bg={inc.status === 'Resolved' ? '#dcfce7' : inc.status === 'Escalated' ? '#fee2e2' : '#fef9c3'} /></td>
                        <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{inc.daysOpen}d</td>
                        <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{inc.affectedUsers.toLocaleString()}</td>
                        <td style={{ padding: '8px 12px' }}><Badge val={inc.region} color={T.blue} bg="#dbeafe" /></td>
                        <td style={{ padding: '8px 12px' }}><Badge val={inc.remediated ? 'Yes' : 'No'} color={inc.remediated ? T.green : T.red} bg={inc.remediated ? '#dcfce7' : '#fee2e2'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7 — Governance Dashboard */}
        {tab === 7 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              <KpiCard label="Total AI Systems" value="200" sub="Full portfolio registered" accent={T.indigo} />
              <KpiCard label="Critical Risk Systems" value={criticalSystems} sub="Require immediate action" accent={T.red} />
              <KpiCard label="Avg Compliance Score" value={`${avgCompliance}%`} sub="EU AI Act framework" accent={T.amber} />
              <KpiCard label="Total CO₂e (t/yr)" value={totalCo2e.toLocaleString()} sub="Portfolio AI carbon footprint" accent={T.teal} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Portfolio Governance Radar" sub="Avg scores across all 200 systems" />
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={dashRadar}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: T.textSec }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Portfolio" dataKey="score" stroke={T.indigo} fill={T.indigo} fillOpacity={0.3} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Compliance Trend — Jan 2024 to Apr 2026" sub="Portfolio average EU AI Act + NIST scores" />
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={complianceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} interval={2} />
                    <YAxis domain={[40, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="compliance" stroke={T.indigo} strokeWidth={2} dot={false} name="EU AI Act %" />
                    <Line type="monotone" dataKey="nist" stroke={T.teal} strokeWidth={2} dot={false} name="NIST RMF %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Regulatory priority matrix */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <SectionH title="Regulatory Gap Priority Matrix" sub="Key compliance gaps requiring action" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {[
                  { priority: 'P0 Critical', color: T.red, bg: '#fee2e2', items: [`${enrichedSystems.filter(s => s.riskTier === 'Unacceptable').length} Unacceptable-tier systems deployed`, `${enrichedSystems.filter(s => s.documentation === 'Missing' && s.riskTier === 'High').length} High-risk systems with missing documentation`, `${AI_INCIDENTS.filter(i => i.severity === 'Critical' && i.status === 'Open').length} Critical incidents unresolved`] },
                  { priority: 'P1 High', color: T.orange, bg: '#ffedd5', items: [`${enrichedSystems.filter(s => !s.humanOversight && s.riskTier === 'High').length} High-risk systems lacking human oversight`, `${enrichedSystems.filter(s => s.euAiActScore < 40).length} Systems with EU AI Act score < 40`, `${enrichedSystems.filter(s => s.biasScore > 70).length} Systems with bias score > 70`] },
                  { priority: 'P2 Medium', color: T.amber, bg: '#fef9c3', items: [`${enrichedSystems.filter(s => s.documentation === 'Partial').length} Systems with partial documentation`, `${enrichedSystems.filter(s => s.nistScore < 50).length} Systems with NIST score < 50`, `${AI_INCIDENTS.filter(i => i.daysOpen > 90 && !i.remediated).length} Incidents open > 90 days without remediation`] },
                ].map(({ priority, color, bg, items }) => (
                  <div key={priority} style={{ background: bg, borderRadius: 8, padding: 16, border: `1px solid ${color}30` }}>
                    <div style={{ fontWeight: 700, color, fontSize: 14, marginBottom: 10 }}>{priority}</div>
                    {items.map((item, i) => (
                      <div key={i} style={{ fontSize: 13, color: T.textPri, marginBottom: 6 }}>• {item}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {[
                ['Unacceptable Risk', enrichedSystems.filter(s => s.riskTier === 'Unacceptable').length, T.red],
                ['High Risk', enrichedSystems.filter(s => s.riskTier === 'High').length, T.orange],
                ['Limited Risk', enrichedSystems.filter(s => s.riskTier === 'Limited').length, T.amber],
                ['Minimal Risk', enrichedSystems.filter(s => s.riskTier === 'Minimal').length, T.green],
                ['Auto-Decision Systems', enrichedSystems.filter(s => s.autoDecision).length, T.indigo],
                ['Biometric Data Systems', enrichedSystems.filter(s => s.biometricData).length, T.purple],
                ['Fully Compliant (≥80%)', enrichedSystems.filter(s => s.compliancePct >= 80).length, T.green],
                ['Non-Compliant (<40%)', enrichedSystems.filter(s => s.compliancePct < 40).length, T.red],
              ].map(([label, value, accent]) => (
                <KpiCard key={label} label={label} value={value} accent={accent} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
