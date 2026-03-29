import React, { useState, useCallback } from 'react';
import axios from 'axios';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  CartesianGrid, ZAxis, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Cell
} from 'recharts';

const API = 'http://localhost:8000';

// ── Theme ──────────────────────────────────────────────────────────────────
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const CHART_COLORS = ['#1b3a5c', '#c5a96a', '#5a8a6a', '#2563eb', '#9333ea', '#ea580c', '#0d9488', '#dc2626', '#0891b2', '#7c3aed'];

// ── ESRS Topics ────────────────────────────────────────────────────────────
const ESRS_TOPICS = {
  Environmental: [
    { id: 'E1', name: 'Climate change', standard: 'ESRS E1' },
    { id: 'E2', name: 'Pollution', standard: 'ESRS E2' },
    { id: 'E3', name: 'Water & marine resources', standard: 'ESRS E3' },
    { id: 'E4', name: 'Biodiversity & ecosystems', standard: 'ESRS E4' },
    { id: 'E5', name: 'Resource use & circular economy', standard: 'ESRS E5' },
  ],
  Social: [
    { id: 'S1', name: 'Own workforce', standard: 'ESRS S1' },
    { id: 'S2', name: 'Workers in the value chain', standard: 'ESRS S2' },
    { id: 'S3', name: 'Affected communities', standard: 'ESRS S3' },
    { id: 'S4', name: 'Consumers & end-users', standard: 'ESRS S4' },
  ],
  Governance: [
    { id: 'G1', name: 'Business conduct', standard: 'ESRS G1' },
  ],
};

const ALL_TOPICS = Object.values(ESRS_TOPICS).flat();
const SCALE_OPTIONS = ['none', 'low', 'moderate', 'significant', 'critical'];
const LIKELIHOOD_OPTIONS = ['unlikely', 'possible', 'likely', 'certain'];
const REVERSIBILITY_OPTIONS = ['reversible', 'irreversible'];
const RISK_TYPE_OPTIONS = ['physical', 'transition', 'litigation', 'market', 'reputational'];
const TIME_HORIZON_OPTIONS = ['short', 'medium', 'long'];
const ENGAGEMENT_METHODS = ['survey', 'interview', 'workshop', 'panel'];
const STAKEHOLDER_GROUPS = ['investors', 'employees', 'communities', 'regulators', 'customers', 'suppliers'];

// ── ESRS Standards Reference Data ──────────────────────────────────────────
const ESRS_STANDARDS = [
  { id: 'ESRS 2', name: 'General disclosures', category: 'Cross-cutting', mandatory: true, datapoints: 136,
    description: 'General disclosures on governance, strategy, impact/risk/opportunity management, and metrics & targets applicable to all undertakings.',
    keyDisclosures: ['GOV-1 Role of admin/management bodies', 'SBM-1 Strategy, business model & value chain', 'IRO-1 Description of DMA process', 'MDR-P Policies', 'MDR-A Actions', 'MDR-T Targets'] },
  { id: 'ESRS E1', name: 'Climate change', category: 'Environmental', mandatory: false, datapoints: 61,
    description: 'Disclosure requirements for climate change mitigation, adaptation, and energy. Covers GHG emissions (Scope 1-3), energy consumption, and transition plans.',
    keyDisclosures: ['E1-1 Transition plan for climate change mitigation', 'E1-4 GHG emissions targets', 'E1-6 Gross Scopes 1/2/3 & total GHG emissions', 'E1-8 Internal carbon pricing', 'E1-9 Anticipated financial effects'] },
  { id: 'ESRS E2', name: 'Pollution', category: 'Environmental', mandatory: false, datapoints: 28,
    description: 'Covers pollution of air, water, soil, substances of concern, and substances of very high concern (SVHC).',
    keyDisclosures: ['E2-1 Policies on pollution', 'E2-2 Actions & resources on pollution', 'E2-4 Pollution of air, water & soil', 'E2-5 Substances of concern & SVHC', 'E2-6 Anticipated financial effects'] },
  { id: 'ESRS E3', name: 'Water & marine resources', category: 'Environmental', mandatory: false, datapoints: 21,
    description: 'Covers water consumption, water withdrawals & discharges, impacts on marine resources, and water stress areas.',
    keyDisclosures: ['E3-1 Policies on water & marine resources', 'E3-4 Water consumption', 'E3-5 Anticipated financial effects'] },
  { id: 'ESRS E4', name: 'Biodiversity & ecosystems', category: 'Environmental', mandatory: false, datapoints: 36,
    description: 'Covers direct impact drivers on biodiversity loss, impacts on the state of species, land-use change, and ecosystem services.',
    keyDisclosures: ['E4-1 Transition plan on biodiversity', 'E4-4 Biodiversity & ecosystem change targets', 'E4-5 Impact metrics on biodiversity', 'E4-6 Anticipated financial effects'] },
  { id: 'ESRS E5', name: 'Resource use & circular economy', category: 'Environmental', mandatory: false, datapoints: 18,
    description: 'Covers resource inflows (material use), resource outflows (waste), and circular economy practices.',
    keyDisclosures: ['E5-1 Policies on resource use & circular economy', 'E5-4 Resource inflows', 'E5-5 Resource outflows', 'E5-6 Anticipated financial effects'] },
  { id: 'ESRS S1', name: 'Own workforce', category: 'Social', mandatory: false, datapoints: 83,
    description: 'Covers working conditions, equal treatment & opportunities, and other work-related rights for the undertaking\'s own workforce.',
    keyDisclosures: ['S1-1 Policies on own workforce', 'S1-6 Characteristics of employees', 'S1-9 Diversity metrics', 'S1-14 Health & safety metrics', 'S1-16 Remuneration metrics', 'S1-17 Incidents & complaints'] },
  { id: 'ESRS S2', name: 'Workers in the value chain', category: 'Social', mandatory: false, datapoints: 20,
    description: 'Covers working conditions, equal treatment, and other work-related rights for workers in the upstream and downstream value chain.',
    keyDisclosures: ['S2-1 Policies on value chain workers', 'S2-2 Engagement processes', 'S2-4 Targets for value chain workers', 'S2-5 Severe impacts & actions'] },
  { id: 'ESRS S3', name: 'Affected communities', category: 'Social', mandatory: false, datapoints: 18,
    description: 'Covers impacts on communities related to land, security, indigenous peoples, and community economic/social/cultural rights.',
    keyDisclosures: ['S3-1 Policies on affected communities', 'S3-2 Engagement processes', 'S3-4 Targets for communities', 'S3-5 Severe impacts & actions'] },
  { id: 'ESRS S4', name: 'Consumers & end-users', category: 'Social', mandatory: false, datapoints: 18,
    description: 'Covers information-related impacts (privacy, safety), personal safety, and social inclusion of consumers/end-users.',
    keyDisclosures: ['S4-1 Policies on consumers', 'S4-2 Engagement processes', 'S4-4 Targets for consumers', 'S4-5 Severe impacts & actions'] },
  { id: 'ESRS G1', name: 'Business conduct', category: 'Governance', mandatory: false, datapoints: 20,
    description: 'Covers corporate culture, anti-corruption & bribery, political engagement, payment practices, and management of supplier relationships.',
    keyDisclosures: ['G1-1 Business conduct policies & culture', 'G1-2 Management of supplier relationships', 'G1-3 Prevention & detection of corruption', 'G1-4 Confirmed incidents of corruption', 'G1-6 Payment practices'] },
];

// ── DMA Process Steps ──────────────────────────────────────────────────────
const DMA_STEPS = [
  { step: 1, title: 'Understand the context', description: 'Map the undertaking\'s sector(s), business model, value chain, geographic presence, and key stakeholder groups. Identify the activities, business relationships, and operating context that determine where impacts, risks, and opportunities (IROs) may arise.' },
  { step: 2, title: 'Identify actual & potential IROs', description: 'Using sector-specific ESRS guidance and stakeholder input, create a long list of actual and potential impacts on people and environment, and financial risks and opportunities arising from sustainability matters. Cover all ESRS topical standards (E1-E5, S1-S4, G1).' },
  { step: 3, title: 'Assess impact materiality', description: 'Rate each impact using severity criteria: Scale (how grave), Scope (how widespread), Irremediable character (whether and to what extent it can be remedied). For potential impacts, also assess Likelihood. An impact is material if severity (and likelihood for potential impacts) exceed defined thresholds.' },
  { step: 4, title: 'Assess financial materiality', description: 'Rate each risk/opportunity by financial Magnitude (effect on cash flows, capital, cost of capital), Likelihood of occurrence, and Time horizon (short/medium/long-term). A sustainability matter is financially material if it triggers or may trigger material financial effects on the undertaking.' },
  { step: 5, title: 'Determine material topics (dual threshold)', description: 'Apply the double materiality principle: a sustainability topic is material if it is material from an impact perspective OR a financial perspective (or both). No netting of impacts against financial opportunities. Document the rationale for each determination.' },
  { step: 6, title: 'Map to ESRS disclosure requirements', description: 'For each material topic, identify the corresponding ESRS topical standard(s) and their specific disclosure requirements (DRs) and datapoints. ESRS 2 General Disclosures apply to all undertakings regardless of materiality. Topical standards are subject to materiality assessment.' },
  { step: 7, title: 'Document & disclose', description: 'Prepare the IRO-1 disclosure describing the DMA process, including how stakeholders were engaged, what thresholds were applied, and the resulting list of material topics. Disclose in the sustainability statement as part of ESRS 2 requirements. The DMA must be updated annually.' },
];

// ── Mini components ────────────────────────────────────────────────────────
const Btn = ({ children, onClick, disabled, color = 'navy', sm }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? '#9ca3af' : (color === 'navy' ? T.navy : color === 'gold' ? T.gold : color === 'green' ? T.green : color === 'red' ? T.red : color === 'indigo' ? T.indigo : T.sage),
    color: '#fff', border: 'none', borderRadius: 6,
    padding: sm ? '6px 14px' : '10px 22px',
    fontSize: sm ? 12 : 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: T.font, transition: 'opacity .15s',
  }}>{children}</button>
);

const Card = ({ children, style }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
    padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', ...style }}>
    {children}
  </div>
);

const KpiCard = ({ label, value, sub, color, wide }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
    padding: '16px 20px', minWidth: wide ? 200 : 140, flex: 1 }}>
    <div style={{ fontSize: 11, color: T.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, margin: '6px 0 2px' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub }}>{sub}</div>}
  </div>
);

const Sel = ({ label, value, onChange, options }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 12px',
        fontSize: 13, fontFamily: T.font, background: '#fafafa', color: T.text }}>
      {options.map(o => <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>{typeof o === 'string' ? o : o.label}</option>)}
    </select>
  </div>
);

const Inp = ({ label, value, onChange, type = 'text', placeholder, small }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{label}</label>}
    <input value={value} onChange={e => onChange(e.target.value)} type={type} placeholder={placeholder}
      style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: small ? '5px 10px' : '8px 12px',
        fontSize: small ? 12 : 13, fontFamily: T.font, background: '#fafafa', color: T.text, outline: 'none' }} />
  </div>
);

const Alert = ({ children, type = 'info' }) => {
  const colors = { info: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' }, warn: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e' }, ok: { bg: '#f0fdf4', border: '#86efac', text: '#166534' }, err: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' } };
  const c = colors[type] || colors.info;
  return <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '12px 16px', fontSize: 13, color: c.text }}>{children}</div>;
};

const Badge = ({ label, color }) => (
  <span style={{ background: color || T.navy, color: '#fff', borderRadius: 20,
    padding: '2px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
);

const SectionHeader = ({ icon, title, subtitle, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
    <div style={{ width: 36, height: 36, borderRadius: 8, background: color || T.navy,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff' }}>{icon}</div>
    <div>
      <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: T.sub }}>{subtitle}</div>}
    </div>
  </div>
);

const MultiSelect = ({ options, selected, onChange, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{label}</label>}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {options.map(o => {
        const val = typeof o === 'string' ? o : o.id;
        const lbl = typeof o === 'string' ? o : `${o.id} ${o.name}`;
        const active = selected.includes(val);
        return (
          <button key={val} onClick={() => onChange(active ? selected.filter(s => s !== val) : [...selected, val])}
            style={{ padding: '3px 10px', fontSize: 11, borderRadius: 14, border: `1px solid ${active ? T.indigo : T.border}`,
              background: active ? '#eef2ff' : '#fafafa', color: active ? T.indigo : T.sub, cursor: 'pointer',
              fontFamily: T.font, fontWeight: active ? 600 : 400 }}>{lbl}</button>
        );
      })}
    </div>
  </div>
);

const MATERIALITY_COLORS = { critical: '#dc2626', significant: '#ea580c', moderate: '#d97706', low: '#65a30d', none: '#9ca3af' };
const SEVERITY_SCORE = { critical: 4, significant: 3, moderate: 2, low: 1, none: 0 };
const LIKELIHOOD_SCORE = { certain: 4, likely: 3, possible: 2, unlikely: 1 };
const RISK_COLORS = { physical: '#2563eb', transition: '#7c3aed', litigation: '#dc2626', market: '#d97706', reputational: '#0891b2' };

// ── Main Component ─────────────────────────────────────────────────────────
export default function CsrdDmaPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Tab 1 state: impact assessments
  const [impactData, setImpactData] = useState(() =>
    ALL_TOPICS.reduce((acc, t) => ({ ...acc, [t.id]: { scale: 'none', likelihood: 'possible', reversibility: 'reversible' } }), {})
  );
  const [financialData, setFinancialData] = useState(() =>
    ALL_TOPICS.reduce((acc, t) => ({ ...acc, [t.id]: { risk_type: 'transition', magnitude_cr: 0, time_horizon: 'medium', likelihood: 'possible' } }), {})
  );
  const [dmaResult, setDmaResult] = useState(null);

  // Tab 2 state: stakeholder engagement
  const [stakeholders, setStakeholders] = useState(() =>
    STAKEHOLDER_GROUPS.map(g => ({ group: g, method: 'survey', topics: [], priority: 3 }))
  );
  const [stakeholderResult, setStakeholderResult] = useState(null);

  // Tab 3 state: topic prioritisation
  const [priorityOverrides, setPriorityOverrides] = useState({});
  const [priorityResult, setPriorityResult] = useState(null);

  const TABS = [
    'Double Materiality Assessment', 'Stakeholder Engagement',
    'Topic Prioritisation', 'ESRS Standards Map', 'DMA Process Guide'
  ];

  // ── API calls ──────────────────────────────────────────────────────────
  const runDMA = useCallback(async () => {
    setLoading(true); setError(''); setDmaResult(null);
    try {
      const payload = {
        company_name: 'Assessment Entity',
        sector: 'General',
        impact_assessments: ALL_TOPICS.map(t => ({
          topic_id: t.id, topic_name: t.name, standard: t.standard,
          ...impactData[t.id],
        })),
        financial_assessments: ALL_TOPICS.map(t => ({
          topic_id: t.id, topic_name: t.name, standard: t.standard,
          ...financialData[t.id],
          magnitude_cr: Number(financialData[t.id].magnitude_cr) || 0,
        })),
      };
      const { data } = await axios.post(`${API}/api/v1/csrd-dma/full-assessment`, payload);
      setDmaResult(data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally { setLoading(false); }
  }, [impactData, financialData]);

  const runStakeholder = useCallback(async () => {
    setLoading(true); setError(''); setStakeholderResult(null);
    try {
      const { data } = await axios.post(`${API}/api/v1/csrd-dma/stakeholder-engagement`, {
        stakeholder_inputs: stakeholders.map(s => ({
          group: s.group, method: s.method,
          topics_raised: s.topics, priority_score: Number(s.priority),
        })),
      });
      setStakeholderResult(data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally { setLoading(false); }
  }, [stakeholders]);

  const runPrioritisation = useCallback(async () => {
    setLoading(true); setError(''); setPriorityResult(null);
    try {
      const topics = ALL_TOPICS.map(t => {
        const imp = impactData[t.id];
        const fin = financialData[t.id];
        return {
          topic_id: t.id, topic_name: t.name, standard: t.standard,
          impact_score: SEVERITY_SCORE[imp.scale] * LIKELIHOOD_SCORE[imp.likelihood],
          financial_score: (Number(fin.magnitude_cr) || 0) * LIKELIHOOD_SCORE[fin.likelihood],
          stakeholder_priority: priorityOverrides[t.id] ?? 3,
        };
      });
      const { data } = await axios.post(`${API}/api/v1/csrd-dma/topic-prioritisation`, { topics });
      setPriorityResult(data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally { setLoading(false); }
  }, [impactData, financialData, priorityOverrides]);

  const updateImpact = (topicId, field, val) => setImpactData(p => ({ ...p, [topicId]: { ...p[topicId], [field]: val } }));
  const updateFinancial = (topicId, field, val) => setFinancialData(p => ({ ...p, [topicId]: { ...p[topicId], [field]: val } }));
  const updateStakeholder = (idx, field, val) => setStakeholders(p => p.map((s, i) => i === idx ? { ...s, [field]: val } : s));

  // ── Scatter data builder ───────────────────────────────────────────────
  const buildScatterData = () => ALL_TOPICS.map(t => {
    const imp = impactData[t.id];
    const fin = financialData[t.id];
    const impactScore = SEVERITY_SCORE[imp.scale] * LIKELIHOOD_SCORE[imp.likelihood];
    const financialScore = (Number(fin.magnitude_cr) || 0) * LIKELIHOOD_SCORE[fin.likelihood];
    return { topic: t.id, name: t.name, impact: impactScore, financial: financialScore, scale: imp.scale };
  });

  // ── Tab 1: Double Materiality Assessment ───────────────────────────────
  const renderTab1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Impact Materiality */}
      <Card style={{ borderLeft: `4px solid ${T.indigo}` }}>
        <SectionHeader icon={"\u26A0"} title="Impact Materiality" subtitle="Assess actual/potential impacts on people & environment" color={T.indigo} />
        {Object.entries(ESRS_TOPICS).map(([pillar, topics]) => (
          <div key={pillar} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.indigo, marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5 }}>{pillar}</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8f7f4' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Topic</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Scale</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Likelihood</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Reversibility</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map(t => {
                    const d = impactData[t.id];
                    const score = SEVERITY_SCORE[d.scale] * LIKELIHOOD_SCORE[d.likelihood];
                    return (
                      <tr key={t.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: T.text }}>
                          <span style={{ color: T.indigo, marginRight: 6 }}>{t.id}</span>{t.name}
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <select value={d.scale} onChange={e => updateImpact(t.id, 'scale', e.target.value)}
                            style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 12, fontFamily: T.font, background: '#fafafa', color: MATERIALITY_COLORS[d.scale] || T.text, fontWeight: 600 }}>
                            {SCALE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <select value={d.likelihood} onChange={e => updateImpact(t.id, 'likelihood', e.target.value)}
                            style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 12, fontFamily: T.font, background: '#fafafa' }}>
                            {LIKELIHOOD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <select value={d.reversibility} onChange={e => updateImpact(t.id, 'reversibility', e.target.value)}
                            style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 12, fontFamily: T.font, background: d.reversibility === 'irreversible' ? '#fef2f2' : '#fafafa', color: d.reversibility === 'irreversible' ? T.red : T.text }}>
                            {REVERSIBILITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <Badge label={score} color={score >= 12 ? T.red : score >= 6 ? T.amber : score >= 2 ? T.gold : T.sub} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </Card>

      {/* Financial Materiality */}
      <Card style={{ borderLeft: `4px solid ${T.navy}` }}>
        <SectionHeader icon={"\u20B9"} title="Financial Materiality" subtitle="Assess financial risks & opportunities from sustainability matters" color={T.navy} />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8f7f4' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Topic</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Risk Type</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>Magnitude (Cr)</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Time Horizon</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Likelihood</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Fin. Score</th>
              </tr>
            </thead>
            <tbody>
              {ALL_TOPICS.map(t => {
                const d = financialData[t.id];
                const fScore = (Number(d.magnitude_cr) || 0) * LIKELIHOOD_SCORE[d.likelihood];
                return (
                  <tr key={t.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.text }}>
                      <span style={{ color: T.navy, marginRight: 6 }}>{t.id}</span>{t.name}
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <select value={d.risk_type} onChange={e => updateFinancial(t.id, 'risk_type', e.target.value)}
                        style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 12, fontFamily: T.font, background: '#fafafa', color: RISK_COLORS[d.risk_type] || T.text, fontWeight: 600 }}>
                        {RISK_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input type="number" value={d.magnitude_cr} onChange={e => updateFinancial(t.id, 'magnitude_cr', e.target.value)}
                        style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 12, fontFamily: T.font, background: '#fafafa', width: 80 }}
                        placeholder="0" min={0} />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <select value={d.time_horizon} onChange={e => updateFinancial(t.id, 'time_horizon', e.target.value)}
                        style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 12, fontFamily: T.font, background: '#fafafa' }}>
                        {TIME_HORIZON_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <select value={d.likelihood} onChange={e => updateFinancial(t.id, 'likelihood', e.target.value)}
                        style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 12, fontFamily: T.font, background: '#fafafa' }}>
                        {LIKELIHOOD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, color: fScore > 500 ? T.red : fScore > 100 ? T.amber : T.sub, fontSize: 13 }}>
                        {fScore.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Run Button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Btn onClick={runDMA} disabled={loading} color="indigo">
          {loading ? 'Running...' : '\u25B6 Run Double Materiality'}
        </Btn>
      </div>

      {error && <Alert type="err">{error}</Alert>}

      {/* Results */}
      {dmaResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <SectionHeader icon={"\uD83D\uDCCA"} title="Materiality Matrix" subtitle="Impact severity (Y) vs Financial magnitude (X)" color={T.indigo} />
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="financial" name="Financial Score" label={{ value: 'Financial Magnitude', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }} />
                <YAxis type="number" dataKey="impact" name="Impact Score" label={{ value: 'Impact Severity', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
                <ZAxis type="number" range={[80, 400]} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: T.navy }}>{d.topic} {d.name}</div>
                      <div>Impact: {d.impact} | Financial: {d.financial.toLocaleString()}</div>
                      <div>Scale: <span style={{ color: MATERIALITY_COLORS[d.scale] }}>{d.scale}</span></div>
                    </div>
                  );
                }} />
                <Scatter data={buildScatterData()} fill={T.indigo}>
                  {buildScatterData().map((entry, i) => (
                    <Cell key={i} fill={MATERIALITY_COLORS[entry.scale] || T.sub} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </Card>

          {/* KPI summary */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <KpiCard label="Material Topics" value={dmaResult.material_topics?.length ?? '-'} color={T.indigo} sub="Dual threshold" />
            <KpiCard label="Impact Material" value={dmaResult.impact_material_count ?? '-'} color={T.red} sub="Severity threshold exceeded" />
            <KpiCard label="Financial Material" value={dmaResult.financial_material_count ?? '-'} color={T.amber} sub="Magnitude threshold exceeded" />
            <KpiCard label="ESRS Standards Triggered" value={dmaResult.esrs_standards_triggered?.length ?? '-'} color={T.navy} sub="Topical reporting" />
          </div>

          {/* Material topics list */}
          {dmaResult.material_topics && dmaResult.material_topics.length > 0 && (
            <Card>
              <SectionHeader icon={"\u2713"} title="Material Topics" subtitle="Topics exceeding dual materiality threshold" color={T.green} />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f8f7f4' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Topic</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Impact Material</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Financial Material</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>ESRS Standard</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dmaResult.material_topics.map((mt, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                          <span style={{ color: T.indigo, marginRight: 4 }}>{mt.topic_id || mt.id}</span>
                          {mt.topic_name || mt.name}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {mt.impact_material ? <Badge label="Yes" color={T.red} /> : <Badge label="No" color={T.sub} />}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {mt.financial_material ? <Badge label="Yes" color={T.amber} /> : <Badge label="No" color={T.sub} />}
                        </td>
                        <td style={{ padding: '8px 10px' }}><Badge label={mt.standard || mt.esrs_standard || '-'} color={T.navy} /></td>
                        <td style={{ padding: '8px 10px', fontSize: 11, color: T.sub }}>{mt.rationale || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ESRS Standards triggered */}
          {dmaResult.esrs_standards_triggered && (
            <Card>
              <SectionHeader icon={"\uD83D\uDCC4"} title="ESRS Reporting Requirements" subtitle="Standards triggered by material topics" color={T.navy} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Badge label="ESRS 2 (Always required)" color={T.green} />
                {dmaResult.esrs_standards_triggered.map((s, i) => (
                  <Badge key={i} label={s} color={T.indigo} />
                ))}
              </div>
              {dmaResult.reporting_requirements && (
                <div style={{ marginTop: 16, fontSize: 12, color: T.sub }}>
                  <strong>Total disclosure requirements:</strong> {dmaResult.reporting_requirements.total_drs ?? '-'} |{' '}
                  <strong>Total datapoints:</strong> {dmaResult.reporting_requirements.total_datapoints ?? '-'}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );

  // ── Tab 2: Stakeholder Engagement ──────────────────────────────────────
  const renderTab2 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card style={{ borderLeft: `4px solid ${T.sage}` }}>
        <SectionHeader icon={"\uD83D\uDC65"} title="Stakeholder Group Inputs" subtitle="Define engagement methods, topics raised, and priority scores per group" color={T.sage} />
        {stakeholders.map((s, idx) => (
          <div key={s.group} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 12, background: '#fafaf8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Badge label={s.group.charAt(0).toUpperCase() + s.group.slice(1)} color={CHART_COLORS[idx % CHART_COLORS.length]} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
              <Sel label="Engagement Method" value={s.method} onChange={v => updateStakeholder(idx, 'method', v)}
                options={ENGAGEMENT_METHODS} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Priority Score (1-5)</label>
                <input type="range" min={1} max={5} value={s.priority}
                  onChange={e => updateStakeholder(idx, 'priority', Number(e.target.value))}
                  style={{ accentColor: T.indigo }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: T.indigo, textAlign: 'center' }}>{s.priority}</div>
              </div>
            </div>
            <MultiSelect label="Topics Raised" options={ALL_TOPICS} selected={s.topics}
              onChange={v => updateStakeholder(idx, 'topics', v)} />
          </div>
        ))}
      </Card>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Btn onClick={runStakeholder} disabled={loading} color="sage">
          {loading ? 'Running...' : '\u25B6 Run Stakeholder Engagement Analysis'}
        </Btn>
      </div>

      {error && <Alert type="err">{error}</Alert>}

      {stakeholderResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <KpiCard label="Engagement Adequacy" value={stakeholderResult.adequacy_score != null ? `${(stakeholderResult.adequacy_score * 100).toFixed(0)}%` : '-'} color={T.sage} sub="Overall adequacy" />
            <KpiCard label="Topics Covered" value={stakeholderResult.topics_covered ?? '-'} color={T.indigo} sub={`of ${ALL_TOPICS.length} ESRS topics`} />
            <KpiCard label="Avg Priority" value={stakeholderResult.avg_priority?.toFixed(1) ?? '-'} color={T.gold} sub="Across all groups" />
          </div>

          {/* Stakeholder priority matrix */}
          {stakeholderResult.priority_matrix && (
            <Card>
              <SectionHeader icon={"\uD83D\uDCCA"} title="Stakeholder Priority Matrix" subtitle="Priority scores by group and topic" color={T.sage} />
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stakeholderResult.priority_matrix} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="topic" fontSize={11} angle={-30} textAnchor="end" height={60} />
                  <YAxis domain={[0, 5]} fontSize={11} />
                  <Tooltip />
                  <Legend />
                  {STAKEHOLDER_GROUPS.map((g, i) => (
                    <Bar key={g} dataKey={g} fill={CHART_COLORS[i % CHART_COLORS.length]} stackId="a" />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Topic frequency */}
          {stakeholderResult.topic_frequency && (
            <Card>
              <SectionHeader icon={"\uD83D\uDD22"} title="Topic Frequency" subtitle="How often each topic was raised across stakeholder groups" color={T.indigo} />
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stakeholderResult.topic_frequency} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={11} />
                  <YAxis type="category" dataKey="topic" fontSize={11} width={50} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.indigo} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  // ── Tab 3: Topic Prioritisation ────────────────────────────────────────
  const renderTab3 = () => {
    const matrixData = ALL_TOPICS.map(t => {
      const imp = impactData[t.id];
      const fin = financialData[t.id];
      const impactScore = SEVERITY_SCORE[imp.scale] * LIKELIHOOD_SCORE[imp.likelihood];
      const financialScore = (Number(fin.magnitude_cr) || 0) * LIKELIHOOD_SCORE[fin.likelihood];
      const override = priorityOverrides[t.id];
      return { id: t.id, name: t.name, standard: t.standard, impactScore, financialScore, stakeholderPriority: override ?? 3 };
    });
    const impactThreshold = 6;
    const financialThreshold = 100;
    const materialTopics = matrixData.filter(d => d.impactScore >= impactThreshold || d.financialScore >= financialThreshold);
    const nonMaterialTopics = matrixData.filter(d => d.impactScore < impactThreshold && d.financialScore < financialThreshold);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card style={{ borderLeft: `4px solid ${T.gold}` }}>
          <SectionHeader icon={"\uD83C\uDFAF"} title="Topic Prioritisation Matrix" subtitle="Position topics by impact severity and financial magnitude; adjust stakeholder priority" color={T.gold} />

          {/* Visual matrix */}
          <ResponsiveContainer width="100%" height={420}>
            <ScatterChart margin={{ top: 20, right: 40, bottom: 30, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="financialScore" name="Financial Score"
                label={{ value: 'Financial Magnitude Score', position: 'insideBottom', offset: -10, style: { fontSize: 12, fill: T.sub } }} />
              <YAxis type="number" dataKey="impactScore" name="Impact Score"
                label={{ value: 'Impact Severity Score', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: T.sub } }} />
              <ZAxis type="number" dataKey="stakeholderPriority" range={[60, 300]} name="Stakeholder Priority" />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: T.navy }}>{d.id} {d.name}</div>
                    <div>Impact: {d.impactScore} | Financial: {d.financialScore.toLocaleString()}</div>
                    <div>Stakeholder priority: {d.stakeholderPriority}</div>
                    <div style={{ fontWeight: 600, color: (d.impactScore >= impactThreshold || d.financialScore >= financialThreshold) ? T.green : T.sub }}>
                      {(d.impactScore >= impactThreshold || d.financialScore >= financialThreshold) ? 'MATERIAL' : 'Non-material'}
                    </div>
                  </div>
                );
              }} />
              {/* Threshold reference lines via scatter */}
              <Scatter data={matrixData} fill={T.indigo}>
                {matrixData.map((entry, i) => (
                  <Cell key={i} fill={(entry.impactScore >= impactThreshold || entry.financialScore >= financialThreshold) ? T.green : T.sub} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 11, color: T.sub, marginTop: 4 }}>
            <span>Bubble size = stakeholder priority</span>
            <span style={{ color: T.green, fontWeight: 700 }}>Green = Material</span>
            <span style={{ color: T.sub, fontWeight: 700 }}>Grey = Non-material</span>
            <span>Impact threshold = {impactThreshold} | Financial threshold = {financialThreshold}</span>
          </div>
        </Card>

        {/* Priority override inputs */}
        <Card>
          <SectionHeader icon={"\u270F"} title="Adjust Stakeholder Priorities" subtitle="Override default priority (1-5) for each topic" color={T.indigo} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {ALL_TOPICS.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: '#fafaf8' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.indigo, minWidth: 24 }}>{t.id}</span>
                <span style={{ fontSize: 11, flex: 1, color: T.text }}>{t.name}</span>
                <input type="number" min={1} max={5} value={priorityOverrides[t.id] ?? 3}
                  onChange={e => setPriorityOverrides(p => ({ ...p, [t.id]: Number(e.target.value) }))}
                  style={{ width: 40, border: `1px solid ${T.border}`, borderRadius: 4, padding: '3px 6px', fontSize: 12, fontFamily: T.font, textAlign: 'center' }} />
              </div>
            ))}
          </div>
        </Card>

        {/* Run */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Btn onClick={runPrioritisation} disabled={loading} color="gold">
            {loading ? 'Running...' : '\u25B6 Run Topic Prioritisation'}
          </Btn>
        </div>

        {error && <Alert type="err">{error}</Alert>}

        {/* Material topics summary */}
        <Card>
          <SectionHeader icon={"\u2713"} title="Material Topic List" subtitle={`${materialTopics.length} material topics identified (dual threshold)`} color={T.green} />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f0fdf4' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Topic</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Impact</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Financial</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>Priority</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}` }}>ESRS Standard</th>
                </tr>
              </thead>
              <tbody>
                {materialTopics.map(mt => (
                  <tr key={mt.id} style={{ borderBottom: `1px solid ${T.border}`, background: '#f7fdf9' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                      <span style={{ color: T.green, marginRight: 4 }}>{mt.id}</span>{mt.name}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <Badge label={mt.impactScore} color={mt.impactScore >= impactThreshold ? T.red : T.sub} />
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: mt.financialScore >= financialThreshold ? T.amber : T.sub }}>{mt.financialScore.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{mt.stakeholderPriority}</td>
                    <td style={{ padding: '8px 10px' }}><Badge label={mt.standard} color={T.navy} /></td>
                  </tr>
                ))}
                {materialTopics.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: T.sub }}>No material topics identified. Adjust assessments in Tab 1 or lower the thresholds.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Gap analysis */}
        <Card>
          <SectionHeader icon={"\uD83D\uDD0D"} title="ESRS Gap Analysis" subtitle="Which standards require reporting vs. not triggered" color={T.amber} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {ESRS_STANDARDS.filter(s => s.id !== 'ESRS 2').map(std => {
              const triggered = materialTopics.some(mt => mt.standard === std.id);
              return (
                <div key={std.id} style={{ padding: '12px 14px', borderRadius: 8, border: `1px solid ${triggered ? T.green : T.border}`, background: triggered ? '#f0fdf4' : '#fafafa', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: triggered ? T.green : T.sub,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>
                    {triggered ? '\u2713' : '\u2212'}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: triggered ? T.green : T.sub }}>{std.id}</div>
                    <div style={{ fontSize: 11, color: T.text }}>{std.name}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', borderRadius: 6, fontSize: 12, color: T.green }}>
            <strong>ESRS 2 General Disclosures</strong> is always required regardless of materiality assessment results.
          </div>
        </Card>

        {priorityResult && (
          <Card>
            <SectionHeader icon={"\uD83D\uDCCB"} title="API Prioritisation Result" subtitle="Server-side topic ranking" color={T.indigo} />
            <pre style={{ background: '#f8f7f4', borderRadius: 8, padding: 16, fontSize: 11, overflow: 'auto', maxHeight: 300, color: T.text }}>
              {JSON.stringify(priorityResult, null, 2)}
            </pre>
          </Card>
        )}
      </div>
    );
  };

  // ── Tab 4: ESRS Standards Map ──────────────────────────────────────────
  const renderTab4 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Alert type="info">
        The ESRS (European Sustainability Reporting Standards) comprise 12 standards: ESRS 2 (General), 5 Environmental (E1-E5), 4 Social (S1-S4), and 1 Governance (G1). ESRS 2 is mandatory for all in-scope undertakings; topical standards are subject to the double materiality assessment.
      </Alert>

      {/* Summary KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Total Standards" value="12" color={T.navy} sub="ESRS 2 + 10 topical + ESRS 1" />
        <KpiCard label="Total Datapoints" value={ESRS_STANDARDS.reduce((a, s) => a + s.datapoints, 0)} color={T.indigo} sub="Across all standards" />
        <KpiCard label="Mandatory" value="1" color={T.red} sub="ESRS 2 General" />
        <KpiCard label="Subject to Materiality" value="10" color={T.gold} sub="E1-E5, S1-S4, G1" />
      </div>

      {/* Standards by category */}
      {['Cross-cutting', 'Environmental', 'Social', 'Governance'].map(cat => {
        const stds = ESRS_STANDARDS.filter(s => s.category === cat);
        if (stds.length === 0) return null;
        const catColor = cat === 'Cross-cutting' ? T.navy : cat === 'Environmental' ? T.green : cat === 'Social' ? T.blue : T.gold;
        return (
          <div key={cat}>
            <div style={{ fontSize: 14, fontWeight: 700, color: catColor, marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5 }}>{cat}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stds.map(std => (
                <Card key={std.id} style={{ borderLeft: `4px solid ${catColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{std.id} - {std.name}</div>
                      <div style={{ fontSize: 12, color: T.sub, marginTop: 4, maxWidth: 700 }}>{std.description}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      <Badge label={`${std.datapoints} datapoints`} color={catColor} />
                      <Badge label={std.mandatory ? 'Mandatory' : 'Subject to materiality'} color={std.mandatory ? T.red : T.gold} />
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 6, textTransform: 'uppercase' }}>Key Disclosure Requirements</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {std.keyDisclosures.map((dr, i) => (
                        <span key={i} style={{ padding: '4px 10px', background: '#f8f7f4', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, color: T.text }}>{dr}</span>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Tab 5: DMA Process Guide ───────────────────────────────────────────
  const renderTab5 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <Alert type="info">
        The Double Materiality Assessment (DMA) is a mandatory process under the CSRD/ESRS framework. It determines which sustainability topics are material from both an impact perspective (inside-out) and a financial perspective (outside-in). This guide outlines the 7-step process as defined by EFRAG.
      </Alert>
      <div style={{ marginTop: 20, position: 'relative', paddingLeft: 40 }}>
        {/* Timeline line */}
        <div style={{ position: 'absolute', left: 18, top: 0, bottom: 0, width: 3, background: `linear-gradient(to bottom, ${T.indigo}, ${T.sage})`, borderRadius: 2 }} />

        {DMA_STEPS.map((s, idx) => (
          <div key={s.step} style={{ position: 'relative', marginBottom: idx < DMA_STEPS.length - 1 ? 24 : 0 }}>
            {/* Step number circle */}
            <div style={{ position: 'absolute', left: -40, top: 0, width: 36, height: 36, borderRadius: '50%',
              background: CHART_COLORS[idx % CHART_COLORS.length], color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800,
              boxShadow: '0 2px 8px rgba(0,0,0,.12)', zIndex: 1 }}>
              {s.step}
            </div>
            <Card style={{ marginLeft: 10, borderLeft: `3px solid ${CHART_COLORS[idx % CHART_COLORS.length]}` }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6 }}>
                Step {s.step}: {s.title}
              </div>
              <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6 }}>{s.description}</div>
            </Card>
          </div>
        ))}
      </div>

      {/* Key principles */}
      <Card style={{ marginTop: 24, borderLeft: `4px solid ${T.gold}` }}>
        <SectionHeader icon={"\u2B50"} title="Key DMA Principles" subtitle="Core requirements from ESRS 1 & ESRS 2" color={T.gold} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {[
            { title: 'Double materiality', desc: 'A topic is material if it meets impact OR financial materiality thresholds (not both required).' },
            { title: 'No netting', desc: 'Positive impacts cannot offset negative impacts. Each IRO is assessed independently.' },
            { title: 'Value chain scope', desc: 'Consider impacts across the full value chain: upstream, own operations, and downstream.' },
            { title: 'Stakeholder engagement', desc: 'Affected stakeholders and their views must be factored into the materiality assessment.' },
            { title: 'Annual reassessment', desc: 'The DMA must be updated at least annually to reflect changes in context and IROs.' },
            { title: 'Transparency', desc: 'The process, thresholds, and rationale must be disclosed under ESRS 2 IRO-1.' },
          ].map((p, i) => (
            <div key={i} style={{ padding: '12px 14px', background: '#fffbf0', border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 4 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${T.indigo}, ${T.navy})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 800 }}>DM</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>CSRD Double Materiality Assessment</div>
            <div style={{ fontSize: 12, color: T.sub }}>E152 &middot; ESRS-aligned impact & financial materiality analysis &middot; Stakeholder engagement &middot; Topic prioritisation</div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: `2px solid ${T.border}`, overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{
              padding: '10px 20px', fontSize: 13, fontWeight: tab === i ? 700 : 500,
              color: tab === i ? T.indigo : T.sub, background: tab === i ? '#eef2ff' : 'transparent',
              border: 'none', borderBottom: tab === i ? `3px solid ${T.indigo}` : '3px solid transparent',
              cursor: 'pointer', fontFamily: T.font, transition: 'all .15s', whiteSpace: 'nowrap',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 0 && renderTab1()}
      {tab === 1 && renderTab2()}
      {tab === 2 && renderTab3()}
      {tab === 3 && renderTab4()}
      {tab === 4 && renderTab5()}
    </div>
  );
}
