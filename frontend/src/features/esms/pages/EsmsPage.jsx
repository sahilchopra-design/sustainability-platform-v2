import React, { useState, useCallback } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';

// ── Theme ──────────────────────────────────────────────────────────────────
const T = {
  bg: '#f6f4f0', navy: '#1b3a5c', gold: '#c5a96a', sage: '#5a8a6a',
  card: '#ffffff', border: '#e2ddd5', text: '#2c2c2c', sub: '#6b7280',
  red: '#dc2626', amber: '#d97706', green: '#16a34a', blue: '#2563eb',
  indigo: '#4f46e5', teal: '#0d9488',
  font: "'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

// ── Constants ──────────────────────────────────────────────────────────────
const MODULE_CODE = 'E148';

const STATUS_SCORE = { 'Not Started': 0, 'In Progress': 33, 'Implemented': 67, 'Certified': 100 };
const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Implemented', 'Certified'];
const RISK_CATEGORIES = ['High', 'Substantial', 'Moderate', 'Low'];

const EP_SECTORS = [
  'Mining', 'Oil & Gas', 'Power (Thermal)', 'Power (Renewable)', 'Infrastructure',
  'Agriculture & Forestry', 'Manufacturing', 'Chemicals & Petrochemicals',
  'Metals & Smelting', 'Waste Management', 'Water & Sanitation',
  'Telecommunications', 'Transport (Road/Rail)', 'Transport (Aviation/Maritime)',
  'Real Estate & Property Development', 'Tourism & Hospitality',
  'Financial Services', 'Health Care', 'Education', 'Other',
];

const COUNTRIES = [
  { value: '', label: 'Select country...' },
  { value: 'AF', label: 'Afghanistan' }, { value: 'AL', label: 'Albania' }, { value: 'DZ', label: 'Algeria' },
  { value: 'AR', label: 'Argentina' }, { value: 'AU', label: 'Australia' }, { value: 'AT', label: 'Austria' },
  { value: 'BD', label: 'Bangladesh' }, { value: 'BE', label: 'Belgium' }, { value: 'BR', label: 'Brazil' },
  { value: 'KH', label: 'Cambodia' }, { value: 'CA', label: 'Canada' }, { value: 'CL', label: 'Chile' },
  { value: 'CN', label: 'China' }, { value: 'CO', label: 'Colombia' }, { value: 'CD', label: 'Congo (DRC)' },
  { value: 'CR', label: 'Costa Rica' }, { value: 'HR', label: 'Croatia' }, { value: 'CZ', label: 'Czech Republic' },
  { value: 'DK', label: 'Denmark' }, { value: 'EC', label: 'Ecuador' }, { value: 'EG', label: 'Egypt' },
  { value: 'ET', label: 'Ethiopia' }, { value: 'FI', label: 'Finland' }, { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Germany' }, { value: 'GH', label: 'Ghana' }, { value: 'GR', label: 'Greece' },
  { value: 'GT', label: 'Guatemala' }, { value: 'HN', label: 'Honduras' }, { value: 'HK', label: 'Hong Kong' },
  { value: 'HU', label: 'Hungary' }, { value: 'IN', label: 'India' }, { value: 'ID', label: 'Indonesia' },
  { value: 'IE', label: 'Ireland' }, { value: 'IL', label: 'Israel' }, { value: 'IT', label: 'Italy' },
  { value: 'JP', label: 'Japan' }, { value: 'JO', label: 'Jordan' }, { value: 'KE', label: 'Kenya' },
  { value: 'KR', label: 'South Korea' }, { value: 'KW', label: 'Kuwait' }, { value: 'LA', label: 'Laos' },
  { value: 'LB', label: 'Lebanon' }, { value: 'MY', label: 'Malaysia' }, { value: 'MX', label: 'Mexico' },
  { value: 'MA', label: 'Morocco' }, { value: 'MZ', label: 'Mozambique' }, { value: 'MM', label: 'Myanmar' },
  { value: 'NP', label: 'Nepal' }, { value: 'NL', label: 'Netherlands' }, { value: 'NZ', label: 'New Zealand' },
  { value: 'NG', label: 'Nigeria' }, { value: 'NO', label: 'Norway' }, { value: 'OM', label: 'Oman' },
  { value: 'PK', label: 'Pakistan' }, { value: 'PA', label: 'Panama' }, { value: 'PE', label: 'Peru' },
  { value: 'PH', label: 'Philippines' }, { value: 'PL', label: 'Poland' }, { value: 'PT', label: 'Portugal' },
  { value: 'QA', label: 'Qatar' }, { value: 'RO', label: 'Romania' }, { value: 'RU', label: 'Russia' },
  { value: 'SA', label: 'Saudi Arabia' }, { value: 'SN', label: 'Senegal' }, { value: 'SG', label: 'Singapore' },
  { value: 'ZA', label: 'South Africa' }, { value: 'ES', label: 'Spain' }, { value: 'LK', label: 'Sri Lanka' },
  { value: 'SE', label: 'Sweden' }, { value: 'CH', label: 'Switzerland' }, { value: 'TW', label: 'Taiwan' },
  { value: 'TZ', label: 'Tanzania' }, { value: 'TH', label: 'Thailand' }, { value: 'TR', label: 'Turkey' },
  { value: 'UG', label: 'Uganda' }, { value: 'UA', label: 'Ukraine' }, { value: 'AE', label: 'UAE' },
  { value: 'GB', label: 'United Kingdom' }, { value: 'US', label: 'United States' },
  { value: 'UY', label: 'Uruguay' }, { value: 'VN', label: 'Vietnam' }, { value: 'ZM', label: 'Zambia' },
  { value: 'ZW', label: 'Zimbabwe' },
];

const ESMS_COMPONENTS = [
  { id: 1, name: 'E&S Policy', desc: 'Formal policy statement signed by senior management', category: 'Governance' },
  { id: 2, name: 'Identification of Risks and Impacts', desc: 'Process to identify E&S risks', category: 'Risk Management' },
  { id: 3, name: 'Management Programs', desc: 'Programs to mitigate identified risks', category: 'Risk Management' },
  { id: 4, name: 'Organizational Capacity & Competency', desc: 'Dedicated E&S staff, training programs', category: 'Governance' },
  { id: 5, name: 'Emergency Preparedness & Response', desc: 'Emergency plans, drills, equipment', category: 'Operations' },
  { id: 6, name: 'Stakeholder Engagement', desc: 'Consultation process, disclosure, informed participation', category: 'Stakeholder' },
  { id: 7, name: 'External Communications & Grievance Mechanism', desc: 'Public complaints channel', category: 'Stakeholder' },
  { id: 8, name: 'Ongoing Reporting', desc: 'Internal & external E&S performance reporting', category: 'Monitoring' },
  { id: 9, name: 'Monitoring & Review', desc: 'KPIs, audits, management review process', category: 'Monitoring' },
  { id: 10, name: 'Supply Chain Management', desc: 'E&S requirements in procurement, supplier audits', category: 'Operations' },
  { id: 11, name: 'Biodiversity & Ecosystem Services', desc: 'Impact on natural habitats, protected areas', category: 'Environmental' },
  { id: 12, name: 'Indigenous Peoples', desc: 'FPIC process, cultural heritage protection', category: 'Social' },
  { id: 13, name: 'Labor & Working Conditions', desc: 'OHS, fair wages, non-discrimination, child labor', category: 'Social' },
  { id: 14, name: 'Community Health, Safety & Security', desc: 'Impact on surrounding communities', category: 'Social' },
  { id: 15, name: 'Land Acquisition & Involuntary Resettlement', desc: 'Compensation, livelihood restoration', category: 'Social' },
  { id: 16, name: 'Climate Change & GHG Management', desc: 'Carbon footprint, adaptation measures', category: 'Environmental' },
];

const IFC_PS = [
  {
    num: 1, name: 'Assessment and Management of E&S Risks and Impacts',
    requirements: [
      'Establish and maintain an ESMS appropriate to the nature and scale of the project',
      'Conduct E&S impact assessment covering direct, indirect, and cumulative impacts',
      'Develop an E&S management plan with mitigation measures and timelines',
      'Establish organizational capacity with defined roles and responsibilities',
      'Implement stakeholder engagement process proportionate to project risks',
    ],
    components: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    gaps: 'Lack of formal ESMS documentation, no dedicated E&S personnel, inadequate stakeholder engagement',
  },
  {
    num: 2, name: 'Labor and Working Conditions',
    requirements: [
      'Establish working conditions consistent with national law and ILO conventions',
      'Implement occupational health and safety measures',
      'Prevent use of forced labor and child labor',
      'Establish grievance mechanism for workers',
    ],
    components: [4, 7, 13],
    gaps: 'Weak OHS protocols, no worker grievance mechanism, supply chain labor risks unaddressed',
  },
  {
    num: 3, name: 'Resource Efficiency and Pollution Prevention',
    requirements: [
      'Implement measures to improve resource efficiency (energy, water, materials)',
      'Avoid or minimize pollution through prevention and control technologies',
      'Manage hazardous and non-hazardous waste responsibly',
      'Reduce project-related GHG emissions where technically and financially feasible',
    ],
    components: [3, 5, 9, 16],
    gaps: 'No GHG inventory, inadequate waste management plan, missing pollution prevention measures',
  },
  {
    num: 4, name: 'Community Health, Safety, and Security',
    requirements: [
      'Assess risks to community health, safety, and security from project activities',
      'Implement measures to prevent or minimize community exposure to hazards',
      'Ensure security personnel act within applicable law and respect human rights',
    ],
    components: [5, 6, 14],
    gaps: 'No community impact assessment, inadequate emergency response for communities, security force conduct unmonitored',
  },
  {
    num: 5, name: 'Land Acquisition and Involuntary Resettlement',
    requirements: [
      'Avoid or minimize physical and economic displacement',
      'Provide compensation at full replacement cost',
      'Implement livelihood restoration programs for displaced persons',
      'Establish transparent and accessible grievance mechanism',
    ],
    components: [6, 7, 15],
    gaps: 'Inadequate compensation framework, no livelihood restoration plan, missing displacement monitoring',
  },
  {
    num: 6, name: 'Biodiversity Conservation and Sustainable Management of Living Natural Resources',
    requirements: [
      'Assess direct, indirect, and cumulative impacts on biodiversity and ecosystem services',
      'Avoid impacts on critical habitats; achieve net gain in biodiversity where feasible',
      'Apply mitigation hierarchy: avoid, minimize, restore, offset',
      'Sustainable management of living natural resources',
    ],
    components: [2, 3, 9, 11],
    gaps: 'No biodiversity baseline assessment, missing mitigation hierarchy, no offset strategy for critical habitats',
  },
  {
    num: 7, name: 'Indigenous Peoples',
    requirements: [
      'Conduct Free, Prior, and Informed Consent (FPIC) for projects affecting indigenous lands',
      'Avoid adverse impacts on indigenous peoples\' rights, lands, and resources',
      'Provide culturally appropriate benefits and opportunities',
    ],
    components: [6, 7, 12],
    gaps: 'No FPIC process documented, insufficient cultural heritage assessment, missing benefit-sharing agreements',
  },
  {
    num: 8, name: 'Cultural Heritage',
    requirements: [
      'Protect tangible and intangible cultural heritage from project impacts',
      'Implement chance-find procedures for archaeological discoveries',
      'Consult with affected communities on cultural heritage matters',
    ],
    components: [2, 6, 12],
    gaps: 'No chance-find procedure, inadequate cultural heritage survey, missing community consultation on heritage',
  },
];

const TEMPLATES = [
  { name: 'E&S Policy Template', desc: 'Comprehensive environmental and social policy statement template covering governance commitments, scope, and accountability frameworks aligned with IFC PS1.', ps: 'PS1', pages: '8-12' },
  { name: 'Risk Assessment Matrix', desc: 'Structured matrix for identifying, evaluating, and prioritizing E&S risks across project lifecycle phases with severity and likelihood scoring.', ps: 'PS1, PS2-PS8', pages: '15-20' },
  { name: 'Stakeholder Engagement Plan', desc: 'Framework for stakeholder identification, mapping, consultation planning, disclosure requirements, and ongoing engagement tracking.', ps: 'PS1, PS5, PS7', pages: '20-30' },
  { name: 'Grievance Mechanism Procedure', desc: 'Step-by-step procedure for receiving, registering, investigating, and resolving complaints from workers and external stakeholders.', ps: 'PS1, PS2, PS4', pages: '10-15' },
  { name: 'Emergency Response Plan', desc: 'Emergency preparedness and response plan covering hazard scenarios, notification chains, evacuation procedures, and drill schedules.', ps: 'PS1, PS3, PS4', pages: '25-35' },
  { name: 'Monitoring & Reporting Framework', desc: 'KPI definitions, monitoring schedules, data collection methods, and internal/external reporting templates for E&S performance.', ps: 'PS1', pages: '12-18' },
  { name: 'Supply Chain E&S Due Diligence Checklist', desc: 'Checklist for assessing and managing E&S risks in supply chains including supplier screening, audit protocols, and corrective actions.', ps: 'PS1, PS2', pages: '8-12' },
  { name: 'Corrective Action Plan Template', desc: 'Template for documenting non-conformances, root cause analysis, corrective measures, responsible parties, and completion tracking.', ps: 'PS1-PS8', pages: '6-10' },
];

const REGULATORY_FRAMEWORKS = [
  { code: 'IFC', name: 'IFC Performance Standards (PS1-PS8)' },
  { code: 'EP', name: 'Equator Principles IV' },
  { code: 'OECD', name: 'OECD Common Approaches' },
  { code: 'EU', name: 'EU Taxonomy (DNSH)' },
  { code: 'GRI', name: 'GRI Standards' },
  { code: 'ISO', name: 'ISO 14001 / ISO 45001' },
];

const REG_MATRIX = {
  1:  { IFC: true, EP: true, OECD: true, EU: true, GRI: true, ISO: true },
  2:  { IFC: true, EP: true, OECD: true, EU: true, GRI: true, ISO: true },
  3:  { IFC: true, EP: true, OECD: true, EU: false, GRI: true, ISO: true },
  4:  { IFC: true, EP: true, OECD: false, EU: false, GRI: true, ISO: true },
  5:  { IFC: true, EP: true, OECD: false, EU: false, GRI: false, ISO: true },
  6:  { IFC: true, EP: true, OECD: true, EU: false, GRI: true, ISO: false },
  7:  { IFC: true, EP: true, OECD: true, EU: false, GRI: true, ISO: false },
  8:  { IFC: true, EP: true, OECD: true, EU: true, GRI: true, ISO: true },
  9:  { IFC: true, EP: true, OECD: true, EU: true, GRI: true, ISO: true },
  10: { IFC: true, EP: false, OECD: true, EU: true, GRI: true, ISO: true },
  11: { IFC: true, EP: true, OECD: true, EU: true, GRI: true, ISO: false },
  12: { IFC: true, EP: true, OECD: true, EU: false, GRI: true, ISO: false },
  13: { IFC: true, EP: true, OECD: true, EU: true, GRI: true, ISO: true },
  14: { IFC: true, EP: true, OECD: true, EU: false, GRI: true, ISO: false },
  15: { IFC: true, EP: true, OECD: true, EU: false, GRI: true, ISO: false },
  16: { IFC: true, EP: true, OECD: true, EU: true, GRI: true, ISO: true },
};

// ── Mini components ────────────────────────────────────────────────────────
const Btn = ({ children, onClick, disabled, color = 'navy', sm }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? '#9ca3af' : (color === 'navy' ? T.navy : color === 'gold' ? T.gold : color === 'green' ? T.green : color === 'red' ? T.red : T.sage),
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

const Inp = ({ label, value, onChange, type = 'text', placeholder, small }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{label}</label>}
    <input value={value} onChange={e => onChange(e.target.value)} type={type} placeholder={placeholder}
      style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: small ? '5px 10px' : '8px 12px',
        fontSize: small ? 12 : 13, fontFamily: T.font, background: '#fafafa', color: T.text, outline: 'none' }} />
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

const Badge = ({ text, color }) => (
  <span style={{ background: color || T.navy, color: '#fff', borderRadius: 20,
    padding: '3px 12px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{text}</span>
);

const SectionTitle = ({ children }) => (
  <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, margin: '0 0 12px', fontFamily: T.font }}>{children}</h3>
);

// ── Helper: maturity color ─────────────────────────────────────────────────
const maturityColor = (score) => {
  if (score >= 91) return T.green;
  if (score >= 76) return T.teal;
  if (score >= 51) return T.blue;
  if (score >= 26) return T.amber;
  return T.red;
};

const maturityLevel = (score) => {
  if (score >= 91) return 'Optimized';
  if (score >= 76) return 'Managed';
  if (score >= 51) return 'Defined';
  if (score >= 26) return 'Developing';
  return 'Initial';
};

const priorityLabel = (status) => {
  if (status === 'Not Started') return 'Critical';
  if (status === 'In Progress') return 'High';
  if (status === 'Implemented') return 'Medium';
  return 'Low';
};

const priorityColor = (p) => {
  if (p === 'Critical') return T.red;
  if (p === 'High') return T.amber;
  if (p === 'Medium') return T.blue;
  return T.green;
};

const recommendation = (comp, status) => {
  if (status === 'Certified') return 'Maintain certification; schedule periodic surveillance audits';
  if (status === 'Implemented') return 'Seek third-party certification or external verification';
  if (status === 'In Progress') return `Complete implementation of ${comp.name} with documented procedures and evidence`;
  return `Initiate development of ${comp.name}: assign responsibility, draft procedures, allocate budget`;
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function EsmsPage() {
  const [tab, setTab] = useState(0);
  const TABS = ['ESMS Assessment', 'IFC Performance Standards', 'ESMS Templates', 'Regulatory Mapping'];

  // ── Assessment state ───────────────────────────────────────────────────
  const [orgName, setOrgName] = useState('');
  const [sector, setSector] = useState('');
  const [country, setCountry] = useState('');
  const [employees, setEmployees] = useState('');
  const [revenue, setRevenue] = useState('');
  const [riskCategory, setRiskCategory] = useState('');

  const initComponents = () => ESMS_COMPONENTS.map(c => ({ ...c, status: 'Not Started', notes: '' }));
  const [components, setComponents] = useState(initComponents);
  const [results, setResults] = useState(null);

  const updateComponent = useCallback((id, field, val) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
  }, []);

  // ── Run assessment ─────────────────────────────────────────────────────
  const runAssessment = useCallback(() => {
    const scores = components.map(c => STATUS_SCORE[c.status]);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const matScore = Math.round(avg);
    const implemented = components.filter(c => c.status === 'Implemented' || c.status === 'Certified').length;
    const gaps = components.filter(c => c.status !== 'Implemented' && c.status !== 'Certified');
    const criticalGaps = components.filter(c => c.status === 'Not Started').length;

    // Category scores for radar
    const categories = ['Governance', 'Risk Management', 'Operations', 'Stakeholder', 'Monitoring', 'Environmental', 'Social'];
    const radarData = categories.map(cat => {
      const catComps = components.filter(c => c.category === cat);
      const catAvg = catComps.length > 0 ? catComps.reduce((a, c) => a + STATUS_SCORE[c.status], 0) / catComps.length : 0;
      return { category: cat, score: Math.round(catAvg), fullMark: 100 };
    });

    // Bar chart data for each component
    const barData = components.map(c => ({
      name: c.id + '. ' + (c.name.length > 22 ? c.name.slice(0, 22) + '...' : c.name),
      score: STATUS_SCORE[c.status],
      fullName: c.name,
    }));

    // Action plan timeline
    const actionPlan = gaps.map((c, i) => {
      const pri = priorityLabel(c.status);
      const months = pri === 'Critical' ? '1-3 months' : pri === 'High' ? '3-6 months' : '6-12 months';
      return { id: c.id, name: c.name, status: c.status, priority: pri, timeline: months, action: recommendation(c, c.status) };
    });

    setResults({
      matScore, matLevel: maturityLevel(matScore), implemented, total: 16, criticalGaps,
      radarData, barData, gaps, actionPlan,
    });
  }, [components]);

  // ── Tab renderers ──────────────────────────────────────────────────────

  const renderAssessment = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Organization Info */}
      <Card>
        <SectionTitle>Organization Information</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          <Inp label="Organization Name" value={orgName} onChange={setOrgName} placeholder="Enter organization name" />
          <Sel label="Sector" value={sector} onChange={setSector}
            options={[{ value: '', label: 'Select sector...' }, ...EP_SECTORS.map(s => ({ value: s, label: s }))]} />
          <Sel label="Country" value={country} onChange={setCountry} options={COUNTRIES} />
          <Inp label="Number of Employees" value={employees} onChange={setEmployees} type="number" placeholder="e.g. 5000" />
          <Inp label="Annual Revenue (USD)" value={revenue} onChange={setRevenue} type="number" placeholder="e.g. 50000000" />
          <Sel label="E&S Risk Category" value={riskCategory} onChange={setRiskCategory}
            options={[{ value: '', label: 'Select risk category...' }, ...RISK_CATEGORIES.map(r => ({ value: r, label: r }))]} />
        </div>
      </Card>

      {/* Component Checklist — grouped by category */}
      {(() => {
        const ESMS_GROUPS = [
          { title: 'Governance', color: T.navy, bg: '#f0f4f8', border: '#b0c4de', ids: [1, 4, 8] },
          { title: 'Assessment', color: T.indigo, bg: '#eef2ff', border: '#a5b4fc', ids: [2, 9] },
          { title: 'Implementation', color: T.teal, bg: '#f0fdfa', border: '#99f6e4', ids: [3, 5, 10] },
          { title: 'Social', color: T.sage, bg: '#f0fdf4', border: '#86efac', ids: [6, 7, 12, 13, 14, 15] },
          { title: 'Environmental', color: T.green, bg: '#ecfdf5', border: '#6ee7b7', ids: [11, 16] },
        ];
        const thStyle = (color, first, last) => ({
          padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#fff',
          background: color, ...(first ? { borderRadius: '6px 0 0 0' } : {}), ...(last ? { borderRadius: '0 6px 0 0' } : {}),
        });
        return (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 4 }}>ESMS Component Checklist (IFC PS1)</div>
            <p style={{ fontSize: 12, color: T.sub, margin: '0 0 14px' }}>
              Assess the implementation status of each ESMS component. Provide evidence notes where applicable.
            </p>
            {ESMS_GROUPS.map(g => {
              const groupComps = g.ids.map(id => components.find(c => c.id === id)).filter(Boolean);
              return (
                <Card key={g.title} style={{ background: g.bg, borderColor: g.border, borderLeft: `4px solid ${g.color}`, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: g.color, margin: 0 }}>{g.title}</h3>
                    <span style={{ background: g.color, color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                      {g.ids.length} components
                    </span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                      <thead>
                        <tr>
                          <th style={thStyle(g.color, true, false)}>#</th>
                          <th style={thStyle(g.color, false, false)}>Component</th>
                          <th style={thStyle(g.color, false, false)}>Description</th>
                          <th style={{ ...thStyle(g.color, false, false), textAlign: 'center' }}>Status</th>
                          <th style={thStyle(g.color, false, true)}>Evidence Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupComps.map((c, i) => (
                          <tr key={c.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: `1px solid ${T.border}` }}>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: g.color }}>{c.id}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: T.text, minWidth: 180 }}>{c.name}</td>
                            <td style={{ padding: '8px 12px', color: T.sub, minWidth: 200 }}>{c.desc}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <select value={c.status} onChange={e => updateComponent(c.id, 'status', e.target.value)}
                                style={{
                                  border: `1px solid ${T.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 11,
                                  fontFamily: T.font, background: '#fafafa', color: T.text, minWidth: 110,
                                }}>
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td style={{ padding: '8px 12px', minWidth: 200 }}>
                              <input value={c.notes} onChange={e => updateComponent(c.id, 'notes', e.target.value)}
                                placeholder="Document evidence..."
                                style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 11,
                                  width: '100%', fontFamily: T.font, background: '#fafafa', color: T.text, boxSizing: 'border-box' }} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })}
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn onClick={runAssessment}>Run Assessment</Btn>
              <Btn color="sage" onClick={() => { setComponents(initComponents); setResults(null); }}>Reset</Btn>
            </div>
          </>
        );
      })()}

      {/* Results */}
      {results && (
        <>
          {/* KPI Strip */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <KpiCard label="Maturity Score" value={results.matScore + '/100'} color={maturityColor(results.matScore)} sub={results.matLevel} />
            <KpiCard label="Maturity Level" value={
              <Badge text={results.matLevel} color={maturityColor(results.matScore)} />
            } />
            <KpiCard label="Components Implemented" value={`${results.implemented}/16`} color={T.sage} sub={`${Math.round(results.implemented / 16 * 100)}% complete`} />
            <KpiCard label="Critical Gaps" value={results.criticalGaps} color={results.criticalGaps > 0 ? T.red : T.green} sub={results.criticalGaps > 0 ? 'Requires immediate action' : 'No critical gaps'} />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card>
              <SectionTitle>ESMS Maturity by Category</SectionTitle>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={results.radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: T.sub }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Score" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <SectionTitle>Component Scores</SectionTitle>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={results.barData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v, n, p) => [v, p.payload.fullName]} />
                  <Bar dataKey="score" fill={T.navy} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Gap Analysis Table */}
          <Card>
            <SectionTitle>Gap Analysis</SectionTitle>
            {results.gaps.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: T.green, fontWeight: 600, fontSize: 14 }}>
                All 16 ESMS components are fully implemented or certified.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                  <thead>
                    <tr style={{ background: '#f1f0eb' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: T.navy }}>Component</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', color: T.navy }}>Current Status</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', color: T.navy }}>Priority</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: T.navy }}>Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.gaps.map((c, i) => {
                      const pri = priorityLabel(c.status);
                      return (
                        <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.id}. {c.name}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <Badge text={c.status} color={c.status === 'Not Started' ? T.red : c.status === 'In Progress' ? T.amber : T.blue} />
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <Badge text={pri} color={priorityColor(pri)} />
                          </td>
                          <td style={{ padding: '8px 12px', color: T.sub }}>{recommendation(c, c.status)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Action Plan Timeline */}
          {results.actionPlan.length > 0 && (
            <Card>
              <SectionTitle>Action Plan Timeline</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Critical', 'High', 'Medium'].map(pri => {
                  const items = results.actionPlan.filter(a => a.priority === pri);
                  if (items.length === 0) return null;
                  return (
                    <div key={pri}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Badge text={pri} color={priorityColor(pri)} />
                        <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{items[0].timeline}</span>
                      </div>
                      {items.map(a => (
                        <div key={a.id} style={{ marginLeft: 20, padding: '6px 0', borderLeft: `3px solid ${priorityColor(pri)}`, paddingLeft: 14, marginBottom: 4 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{a.id}. {a.name}</div>
                          <div style={{ fontSize: 11, color: T.sub }}>{a.action}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );

  const renderIFCPS = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card style={{ background: '#eff6ff', border: `1px solid #93c5fd` }}>
        <div style={{ fontSize: 13, color: '#1e40af' }}>
          <strong>IFC Performance Standards</strong> are the international benchmark for managing environmental and social risks in project finance.
          They form the basis of the Equator Principles and are widely adopted by DFIs, MDBs, and commercial lenders globally.
        </div>
      </Card>
      {IFC_PS.map(ps => (
        <Card key={ps.num}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.navy, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
              {ps.num}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>PS{ps.num}: {ps.name}</div>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 6 }}>Key Requirements:</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: T.sub, lineHeight: 1.8 }}>
              {ps.requirements.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 4 }}>Applicable ESMS Components:</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {ps.components.map(cid => (
                  <Badge key={cid} text={`${cid}. ${ESMS_COMPONENTS.find(c => c.id === cid).name}`} color={T.sage} />
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 10, padding: '8px 12px', background: '#fffbeb', borderRadius: 6, border: `1px solid #fcd34d` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 2 }}>Common Gaps:</div>
            <div style={{ fontSize: 11, color: '#92400e' }}>{ps.gaps}</div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderTemplates = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card style={{ background: '#f0fdf4', border: `1px solid #86efac` }}>
        <div style={{ fontSize: 13, color: '#166534' }}>
          <strong>ESMS Templates</strong> provide standardized frameworks for building your Environmental and Social Management System.
          Each template is aligned with IFC Performance Standards and can be customized for your organization.
        </div>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
        {TEMPLATES.map((t, i) => (
          <Card key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: T.indigo, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{t.name}</div>
            </div>
            <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>{t.desc}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, color: T.text }}>
                <strong>IFC PS:</strong> <span style={{ color: T.indigo }}>{t.ps}</span>
              </div>
              <div style={{ fontSize: 11, color: T.text }}>
                <strong>Pages:</strong> {t.pages}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderRegMapping = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card style={{ background: '#faf5ff', border: `1px solid #d8b4fe` }}>
        <div style={{ fontSize: 13, color: '#6b21a8' }}>
          <strong>Regulatory Mapping</strong> shows which ESMS components are required or recommended by each regulatory framework.
          This helps identify overlapping requirements and prioritize compliance efforts.
        </div>
      </Card>
      <Card>
        <SectionTitle>ESMS Component vs Regulatory Framework Matrix</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
            <thead>
              <tr style={{ background: T.navy, color: '#fff' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', borderRadius: '6px 0 0 0', position: 'sticky', left: 0, background: T.navy, zIndex: 2, minWidth: 200 }}>ESMS Component</th>
                {REGULATORY_FRAMEWORKS.map((f, i) => (
                  <th key={f.code} style={{ padding: '10px 8px', textAlign: 'center', fontSize: 10, minWidth: 90,
                    borderRadius: i === REGULATORY_FRAMEWORKS.length - 1 ? '0 6px 0 0' : undefined }}>{f.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ESMS_COMPONENTS.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? '#fafafa' : '#fff', borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: T.text, position: 'sticky', left: 0,
                    background: i % 2 === 0 ? '#fafafa' : '#fff', zIndex: 1 }}>
                    {c.id}. {c.name}
                  </td>
                  {REGULATORY_FRAMEWORKS.map(f => {
                    const val = REG_MATRIX[c.id]?.[f.code];
                    return (
                      <td key={f.code} style={{ padding: '8px', textAlign: 'center' }}>
                        {val ? (
                          <span style={{ color: T.green, fontSize: 16, fontWeight: 700 }}>&#10003;</span>
                        ) : (
                          <span style={{ color: '#d1d5db', fontSize: 16 }}>&#10007;</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Summary row */}
              <tr style={{ background: '#f1f0eb', fontWeight: 700 }}>
                <td style={{ padding: '10px 12px', color: T.navy, position: 'sticky', left: 0, background: '#f1f0eb', zIndex: 1 }}>
                  Coverage (out of 16)
                </td>
                {REGULATORY_FRAMEWORKS.map(f => {
                  const count = Object.values(REG_MATRIX).filter(m => m[f.code]).length;
                  return (
                    <td key={f.code} style={{ padding: '10px 8px', textAlign: 'center', color: T.navy }}>
                      {count}/16
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Framework details */}
      <Card>
        <SectionTitle>Framework Details</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {[
            { code: 'IFC', name: 'IFC Performance Standards', scope: 'PS1-PS8', desc: 'Eight performance standards covering assessment, labor, pollution, community, resettlement, biodiversity, indigenous peoples, and cultural heritage.', coverage: '16/16' },
            { code: 'EP', name: 'Equator Principles IV', scope: '10 Principles', desc: 'Risk management framework for financial institutions to determine, assess, and manage environmental and social risk in project finance.', coverage: '15/16' },
            { code: 'OECD', name: 'OECD Common Approaches', scope: 'Export Credit', desc: 'Environmental and social due diligence standards for officially supported export credits by OECD member countries.', coverage: '13/16' },
            { code: 'EU', name: 'EU Taxonomy (DNSH)', scope: 'Do No Significant Harm', desc: 'Technical screening criteria ensuring economic activities do no significant harm to environmental objectives under the EU Taxonomy Regulation.', coverage: '8/16' },
            { code: 'GRI', name: 'GRI Standards', scope: 'Sustainability Reporting', desc: 'Global Reporting Initiative standards for sustainability disclosure covering environmental, social, and governance topics.', coverage: '15/16' },
            { code: 'ISO', name: 'ISO 14001 / ISO 45001', scope: 'Management Systems', desc: 'ISO 14001 for environmental management systems and ISO 45001 for occupational health and safety management systems.', coverage: '10/16' },
          ].map(f => (
            <div key={f.code} style={{ padding: 14, border: `1px solid ${T.border}`, borderRadius: 8, background: '#fafafa' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{f.name}</div>
              <div style={{ fontSize: 11, color: T.indigo, fontWeight: 600, marginBottom: 6 }}>{f.scope}</div>
              <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.6, marginBottom: 8 }}>{f.desc}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>ESMS Coverage: <span style={{ color: T.green }}>{f.coverage}</span></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>
            Environmental & Social Management System (ESMS)
          </div>
          <div style={{ color: T.gold, fontSize: 12, marginTop: 4 }}>
            {MODULE_CODE} &middot; IFC PS1 &middot; Equator Principles IV &middot; OECD Common Approaches
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Badge text="IFC PS1 Aligned" color={T.sage} />
          <Badge text="EP IV Compliant" color={T.gold} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${T.border}`, display: 'flex', padding: '0 28px' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            background: 'none', border: 'none', borderBottom: tab === i ? `3px solid ${T.navy}` : '3px solid transparent',
            padding: '12px 20px', fontSize: 13, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? T.navy : T.sub, cursor: 'pointer', fontFamily: T.font,
            transition: 'all .15s',
          }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '20px 28px', maxWidth: 1400, margin: '0 auto' }}>
        {tab === 0 && renderAssessment()}
        {tab === 1 && renderIFCPS()}
        {tab === 2 && renderTemplates()}
        {tab === 3 && renderRegMapping()}
      </div>
    </div>
  );
}
