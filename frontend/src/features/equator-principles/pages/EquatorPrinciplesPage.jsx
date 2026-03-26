import React, { useState, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip,
} from 'recharts';

const API = 'http://localhost:8000';

// -- Theme --------------------------------------------------------------------
const T = {
  bg: '#f6f4f0', navy: '#1b3a5c', gold: '#c5a96a', sage: '#5a8a6a',
  card: '#ffffff', border: '#e2ddd5', text: '#2c2c2c', sub: '#6b7280',
  red: '#dc2626', amber: '#d97706', green: '#16a34a', blue: '#2563eb',
  indigo: '#4f46e5', teal: '#0d9488',
  font: "'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

const CHART_COLORS = ['#1b3a5c', '#c5a96a', '#5a8a6a', '#2563eb', '#9333ea', '#ea580c', '#0d9488'];

// -- Countries ----------------------------------------------------------------
const COUNTRIES = [
  { label: 'India', value: 'IN' }, { label: 'United States', value: 'US' },
  { label: 'United Kingdom', value: 'GB' }, { label: 'Germany', value: 'DE' },
  { label: 'France', value: 'FR' }, { label: 'Brazil', value: 'BR' },
  { label: 'South Africa', value: 'ZA' }, { label: 'Indonesia', value: 'ID' },
  { label: 'Nigeria', value: 'NG' }, { label: 'China', value: 'CN' },
  { label: 'Japan', value: 'JP' }, { label: 'South Korea', value: 'KR' },
  { label: 'Australia', value: 'AU' }, { label: 'Canada', value: 'CA' },
  { label: 'Mexico', value: 'MX' }, { label: 'Argentina', value: 'AR' },
  { label: 'Chile', value: 'CL' }, { label: 'Colombia', value: 'CO' },
  { label: 'Peru', value: 'PE' }, { label: 'Saudi Arabia', value: 'SA' },
  { label: 'UAE', value: 'AE' }, { label: 'Turkey', value: 'TR' },
  { label: 'Egypt', value: 'EG' }, { label: 'Kenya', value: 'KE' },
  { label: 'Ghana', value: 'GH' }, { label: 'Ethiopia', value: 'ET' },
  { label: 'Tanzania', value: 'TZ' }, { label: 'Morocco', value: 'MA' },
  { label: 'Thailand', value: 'TH' }, { label: 'Vietnam', value: 'VN' },
  { label: 'Philippines', value: 'PH' }, { label: 'Malaysia', value: 'MY' },
  { label: 'Singapore', value: 'SG' }, { label: 'Bangladesh', value: 'BD' },
  { label: 'Pakistan', value: 'PK' }, { label: 'Sri Lanka', value: 'LK' },
  { label: 'Nepal', value: 'NP' }, { label: 'Myanmar', value: 'MM' },
  { label: 'Italy', value: 'IT' }, { label: 'Spain', value: 'ES' },
  { label: 'Netherlands', value: 'NL' }, { label: 'Belgium', value: 'BE' },
  { label: 'Switzerland', value: 'CH' }, { label: 'Sweden', value: 'SE' },
  { label: 'Norway', value: 'NO' }, { label: 'Denmark', value: 'DK' },
  { label: 'Finland', value: 'FI' }, { label: 'Poland', value: 'PL' },
  { label: 'Russia', value: 'RU' }, { label: 'Ukraine', value: 'UA' },
  { label: 'Ireland', value: 'IE' }, { label: 'Portugal', value: 'PT' },
  { label: 'Austria', value: 'AT' }, { label: 'Czech Republic', value: 'CZ' },
  { label: 'Romania', value: 'RO' }, { label: 'Hungary', value: 'HU' },
  { label: 'Greece', value: 'GR' }, { label: 'New Zealand', value: 'NZ' },
  { label: 'Israel', value: 'IL' }, { label: 'Qatar', value: 'QA' },
  { label: 'Kuwait', value: 'KW' }, { label: 'Oman', value: 'OM' },
  { label: 'Bahrain', value: 'BH' }, { label: 'Jordan', value: 'JO' },
  { label: 'Iraq', value: 'IQ' }, { label: 'Cambodia', value: 'KH' },
  { label: 'Laos', value: 'LA' }, { label: 'Mongolia', value: 'MN' },
];

// -- Sectors ------------------------------------------------------------------
const SECTORS = [
  'Energy', 'Mining', 'Infrastructure', 'Manufacturing', 'Agriculture',
  'Real Estate', 'Transport', 'Water/Sanitation', 'Telecoms', 'Other',
];

// -- Designated countries (high-income OECD) ----------------------------------
const DESIGNATED_COUNTRIES = [
  'US', 'GB', 'DE', 'FR', 'AU', 'CA', 'JP', 'KR', 'IT', 'ES', 'NL', 'BE',
  'CH', 'SE', 'NO', 'DK', 'FI', 'AT', 'IE', 'PT', 'NZ', 'IL', 'SG',
];

// -- EP Principles reference --------------------------------------------------
const EP_PRINCIPLES = [
  { num: 1, name: 'Review and Categorisation', desc: 'Categorise the project based on the magnitude of its potential environmental and social risks and impacts.', requirements: ['Screen projects against IFC Performance Standards', 'Assign Category A, B, or C', 'Document categorisation rationale'] },
  { num: 2, name: 'Environmental and Social Assessment', desc: 'Conduct an appropriate Assessment process to address the relevant environmental and social risks and impacts of the proposed project.', requirements: ['Conduct ESIA for Category A and B projects', 'Include alternatives analysis', 'Address cumulative impacts', 'Include Human Rights assessment'] },
  { num: 3, name: 'Applicable Environmental and Social Standards', desc: 'The Assessment process should address compliance with relevant host country laws and the applicable IFC Performance Standards.', requirements: ['Comply with host country E&S laws', 'Meet IFC Performance Standards (PS1-PS8)', 'Apply EHS Guidelines', 'Apply good international industry practice'] },
  { num: 4, name: 'Environmental and Social Management System and EP Action Plan', desc: 'Develop or maintain an Environmental and Social Management System (ESMS) and, where applicable, an EP Action Plan.', requirements: ['Establish ESMS policies and procedures', 'Define mitigation measures', 'Allocate implementation responsibility', 'Set performance indicators and targets'] },
  { num: 5, name: 'Stakeholder Engagement', desc: 'Demonstrate effective Stakeholder Engagement as an ongoing process structured and culturally appropriate.', requirements: ['Identify affected communities', 'Disclose Assessment information', 'Conduct meaningful consultation', 'Document engagement process and outcomes'] },
  { num: 6, name: 'Grievance Mechanism', desc: 'Establish a grievance mechanism to receive and facilitate resolution of concerns and grievances about environmental and social performance.', requirements: ['Establish accessible mechanism', 'Allow for anonymous complaints', 'Ensure culturally appropriate design', 'Publish mechanism details'] },
  { num: 7, name: 'Independent Review', desc: 'An Independent Environmental and Social Consultant will carry out an Independent Review of the Assessment documentation.', requirements: ['Engage qualified independent E&S consultant', 'Review ESIA and ESMP documentation', 'Assess EP Action Plan compliance', 'Provide written opinion on compliance'] },
  { num: 8, name: 'Covenants', desc: 'Incorporate covenants linked to compliance with the EPs into the financing documentation.', requirements: ['Include E&S compliance covenants', 'Require periodic reporting', 'Define decommissioning obligations', 'Specify remedies for non-compliance'] },
  { num: 9, name: 'Independent Monitoring and Reporting', desc: 'Appoint an Independent Environmental and Social Consultant or require the client to retain qualified specialists.', requirements: ['Appoint independent monitor for Cat A+', 'Require periodic reporting to lenders', 'Monitor ongoing E&S performance', 'Report on covenant compliance'] },
  { num: 10, name: 'Reporting and Transparency', desc: 'The client will ensure that an annual report of the project is publicly available.', requirements: ['Publish annual summary report', 'Include GHG emission data (if >100k tpa CO2)', 'Disclose biodiversity and Indigenous Peoples data', 'Report in line with TCFD recommendations'] },
];

// -- ESIA stages --------------------------------------------------------------
const ESIA_STAGES = [
  { stage: 'Screening', desc: 'Determine whether the project requires an ESIA and establish the category.', docs: ['Project Description', 'Preliminary E&S Risk Summary', 'Regulatory Screening Report'], timeline: '2-4 weeks' },
  { stage: 'Scoping', desc: 'Define the scope of the assessment, key issues, and stakeholder groups to be consulted.', docs: ['Scoping Report', 'Terms of Reference', 'Stakeholder Mapping', 'Baseline Data Collection Plan'], timeline: '4-8 weeks' },
  { stage: 'Assessment', desc: 'Conduct detailed assessment of identified environmental and social impacts.', docs: ['ESIA Report', 'Baseline Studies', 'Impact Significance Matrix', 'Alternatives Analysis', 'Cumulative Impact Assessment'], timeline: '3-9 months' },
  { stage: 'Mitigation', desc: 'Develop Environmental and Social Management Plan (ESMP) with measures to avoid, minimise, restore, or offset impacts.', docs: ['ESMP', 'Biodiversity Action Plan', 'Resettlement Action Plan (if needed)', 'Indigenous Peoples Plan (if needed)', 'Emergency Response Plan'], timeline: '2-4 months' },
  { stage: 'Monitoring', desc: 'Implement monitoring programmes to track effectiveness of mitigation measures and ensure ongoing compliance.', docs: ['Monitoring Plan', 'Key Performance Indicators', 'Annual Monitoring Report', 'Stakeholder Grievance Log', 'Independent Audit Report'], timeline: 'Ongoing (annual review)' },
];

// -- IFC Performance Standards ------------------------------------------------
const IFC_PS = [
  { id: 'PS1', name: 'Assessment and Management of E&S Risks and Impacts', scope: 'Overarching standard — ESMS, stakeholder engagement, monitoring' },
  { id: 'PS2', name: 'Labor and Working Conditions', scope: 'Working conditions, workers rights, child/forced labor, OHS' },
  { id: 'PS3', name: 'Resource Efficiency and Pollution Prevention', scope: 'GHG emissions, waste management, hazardous materials, resource efficiency' },
  { id: 'PS4', name: 'Community Health, Safety, and Security', scope: 'Infrastructure and equipment safety, hazardous materials, security forces' },
  { id: 'PS5', name: 'Land Acquisition and Involuntary Resettlement', scope: 'Displacement, livelihood restoration, community engagement' },
  { id: 'PS6', name: 'Biodiversity Conservation and Sustainable Management of Living Natural Resources', scope: 'Habitat protection, ecosystem services, invasive species' },
  { id: 'PS7', name: 'Indigenous Peoples', scope: 'FPIC, cultural identity, relocation, benefit sharing' },
  { id: 'PS8', name: 'Cultural Heritage', scope: 'Tangible/intangible heritage, chance-find procedures, sacred sites' },
];

// -- Mini components ----------------------------------------------------------
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

const Alert = ({ children, type = 'info' }) => {
  const colors = { info: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' }, warn: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e' }, ok: { bg: '#f0fdf4', border: '#86efac', text: '#166534' } };
  const c = colors[type] || colors.info;
  return <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '12px 16px', fontSize: 13, color: c.text }}>{children}</div>;
};

const CategoryBadge = ({ cat }) => {
  const c = cat === 'A' ? T.red : cat === 'B' ? T.amber : T.green;
  return (
    <span style={{ background: c, color: '#fff', borderRadius: 20, padding: '3px 14px', fontSize: 12, fontWeight: 700, letterSpacing: .5 }}>
      Category {cat}
    </span>
  );
};

const Checkbox = ({ label, checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.text, cursor: 'pointer' }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
      style={{ width: 16, height: 16, accentColor: T.navy }} />
    {label}
  </label>
);

// -- Derive category ----------------------------------------------------------
function deriveCategory(sector, valueUsd) {
  const highRisk = ['Energy', 'Mining', 'Infrastructure'];
  const medRisk = ['Manufacturing', 'Agriculture', 'Transport', 'Water/Sanitation'];
  if (highRisk.includes(sector) && valueUsd >= 10_000_000) return 'A';
  if (highRisk.includes(sector) || (medRisk.includes(sector) && valueUsd >= 50_000_000)) return 'B';
  if (medRisk.includes(sector)) return 'B';
  return 'C';
}

// == Main page ================================================================
export default function EquatorPrinciplesPage() {
  const [tab, setTab] = useState('assessment');

  // -- Form state -------------------------------------------------------------
  const [projectName, setProjectName] = useState('');
  const [projectValue, setProjectValue] = useState('50000000');
  const [country, setCountry] = useState('IN');
  const [sector, setSector] = useState('Energy');
  const [categoryOverride, setCategoryOverride] = useState('');
  const [hasEsia, setHasEsia] = useState(false);
  const [communityAffected, setCommunityAffected] = useState(true);
  const [indigenousAffected, setIndigenousAffected] = useState(false);
  const [culturalHeritage, setCulturalHeritage] = useState(false);

  // -- Result state -----------------------------------------------------------
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const autoCategory = deriveCategory(sector, parseFloat(projectValue) || 0);
  const effectiveCategory = categoryOverride || autoCategory;
  const isDesignated = DESIGNATED_COUNTRIES.includes(country);

  // -- Determine which principles are required --------------------------------
  const getPrincipleStatus = useCallback((num) => {
    // Category C: only Principle 1 (review) and 10 (reporting for >$100M) required
    if (effectiveCategory === 'C') {
      if (num === 1) return 'required';
      if (num === 10 && parseFloat(projectValue) >= 100_000_000) return 'required';
      return 'not_required';
    }
    // Category A: all principles required
    if (effectiveCategory === 'A') {
      if (num === 7 && !indigenousAffected) return 'conditional';
      return 'required';
    }
    // Category B
    if (num <= 6) return 'required';
    if (num === 7) return indigenousAffected ? 'required' : 'conditional';
    if (num === 8) return 'required';
    if (num === 9) return !isDesignated ? 'required' : 'conditional';
    if (num === 10) return 'required';
    return 'required';
  }, [effectiveCategory, projectValue, indigenousAffected, isDesignated]);

  // -- Run assessment ---------------------------------------------------------
  const runAssessment = useCallback(async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const payload = {
        project_value_usd: parseFloat(projectValue) || 0,
        country_iso2: country,
        sector,
        has_existing_esia: hasEsia,
        community_affected: communityAffected,
        indigenous_peoples_affected: indigenousAffected,
        cultural_heritage_affected: culturalHeritage,
      };
      const res = await fetch(`${API}/api/v1/export-credit-esg/equator-principles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error?.message || `HTTP ${res.status}`);
      }
      setResult(await res.json());
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [projectValue, country, sector, hasEsia, communityAffected, indigenousAffected, culturalHeritage]);

  // -- Format USD -------------------------------------------------------------
  const fmtUsd = (v) => {
    const n = parseFloat(v);
    if (isNaN(n)) return '$0';
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };

  // -- Count required principles ----------------------------------------------
  const requiredCount = EP_PRINCIPLES.filter(p => getPrincipleStatus(p.num) === 'required').length;
  const conditionalCount = EP_PRINCIPLES.filter(p => getPrincipleStatus(p.num) === 'conditional').length;

  // -- Chart data for principles breakdown ------------------------------------
  const chartData = [
    { name: 'Required', value: requiredCount, fill: T.red },
    { name: 'Conditional', value: conditionalCount, fill: T.amber },
    { name: 'Not Required', value: 10 - requiredCount - conditionalCount, fill: T.green },
  ].filter(d => d.value > 0);

  // -- Tab style (matching PCAF) ----------------------------------------------
  const tabStyle = active => ({
    padding: '10px 22px', cursor: 'pointer', border: 'none', fontFamily: T.font,
    fontWeight: 600, fontSize: 13, borderBottom: active ? `3px solid ${T.navy}` : '3px solid transparent',
    background: 'transparent', color: active ? T.navy : T.sub, transition: 'color .15s',
  });

  // =========================================================================
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 28px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ background: T.navy, color: T.gold, borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700 }}>E147</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Equator Principles (EP IV) Assessment</h1>
          <span style={{ background: '#ecfdf5', color: '#15803d', border: '1px solid #86efac', borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 700 }}>LIVE API</span>
        </div>
        <p style={{ fontSize: 13, color: T.sub, margin: 0, maxWidth: 750 }}>
          EP IV project finance risk categorisation and compliance assessment. IFC Performance Standards PS1-PS8 mapping, ESIA requirements, OECD Common Approaches Category A/B/C, designated vs non-designated country analysis.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `2px solid ${T.border}`, marginBottom: 24, gap: 4, flexWrap: 'wrap' }}>
        {[
          ['assessment', 'EP Assessment'],
          ['esia', 'ESIA Tracker'],
          ['reference', 'EP Framework Reference'],
        ].map(([key, label]) => (
          <button key={key} style={tabStyle(tab === key)} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {/* ================================================================== */}
      {/* TAB 1: EP ASSESSMENT                                               */}
      {/* ================================================================== */}
      {tab === 'assessment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Input form */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, margin: '0 0 16px' }}>Project Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              <Inp label="Project Name" value={projectName} onChange={setProjectName} placeholder="e.g. Mumbai Metro Phase IV" />
              <Inp label="Project Value (USD)" value={projectValue} onChange={setProjectValue} type="number" placeholder="50000000" />
              <Sel label="Country" value={country} onChange={setCountry} options={COUNTRIES} />
              <Sel label="Sector" value={sector} onChange={setSector} options={SECTORS} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Project Category</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CategoryBadge cat={effectiveCategory} />
                  <select value={categoryOverride} onChange={e => setCategoryOverride(e.target.value)}
                    style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 12, fontFamily: T.font, background: '#fafafa' }}>
                    <option value="">Auto ({autoCategory})</option>
                    <option value="A">Override: A (High Risk)</option>
                    <option value="B">Override: B (Medium Risk)</option>
                    <option value="C">Override: C (Low Risk)</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              <Checkbox label="Has existing ESIA" checked={hasEsia} onChange={setHasEsia} />
              <Checkbox label="Community affected" checked={communityAffected} onChange={setCommunityAffected} />
              <Checkbox label="Indigenous peoples affected" checked={indigenousAffected} onChange={setIndigenousAffected} />
              <Checkbox label="Cultural heritage affected" checked={culturalHeritage} onChange={setCulturalHeritage} />
            </div>

            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Btn onClick={runAssessment} disabled={loading}>{loading ? 'Running...' : '\u25B6 Run EP Assessment'}</Btn>
              {isDesignated
                ? <span style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>Designated Country</span>
                : <span style={{ fontSize: 12, color: T.amber, fontWeight: 600 }}>Non-Designated Country</span>
              }
            </div>
          </Card>

          {error && <Alert type="warn">{error}</Alert>}

          {/* KPI strip */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <KpiCard label="EP Applicable" value={parseFloat(projectValue) >= 10_000_000 ? 'Yes' : 'No'}
              color={parseFloat(projectValue) >= 10_000_000 ? T.green : T.sub}
              sub={`Threshold: $10M (${fmtUsd(projectValue)})`} />
            <KpiCard label="Category" value={effectiveCategory}
              color={effectiveCategory === 'A' ? T.red : effectiveCategory === 'B' ? T.amber : T.green}
              sub={effectiveCategory === 'A' ? 'High Risk' : effectiveCategory === 'B' ? 'Medium Risk' : 'Low Risk'} />
            <KpiCard label="Principles Required" value={requiredCount}
              color={requiredCount >= 8 ? T.red : requiredCount >= 5 ? T.amber : T.green}
              sub={`+ ${conditionalCount} conditional`} />
            <KpiCard label="Risk Level"
              value={effectiveCategory === 'A' ? 'High' : effectiveCategory === 'B' ? 'Medium' : 'Low'}
              color={effectiveCategory === 'A' ? T.red : effectiveCategory === 'B' ? T.amber : T.green}
              sub={isDesignated ? 'Designated Country' : 'Non-Designated'} />
          </div>

          {/* Principles pie chart + bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
            <Card>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navy, margin: '0 0 10px' }}>Principles Breakdown</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v} principles`} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {chartData.map(d => (
                  <span key={d.name} style={{ fontSize: 11, color: T.sub, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: d.fill, display: 'inline-block' }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </Card>

            <Card>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: T.navy, margin: '0 0 10px' }}>Requirements by Principle</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={EP_PRINCIPLES.map(p => ({
                  name: `EP${p.num}`,
                  reqs: p.requirements.length,
                  fill: getPrincipleStatus(p.num) === 'required' ? T.red : getPrincipleStatus(p.num) === 'conditional' ? T.amber : T.green,
                }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="reqs" name="Requirements">
                    {EP_PRINCIPLES.map((p, i) => (
                      <Cell key={i} fill={getPrincipleStatus(p.num) === 'required' ? T.red : getPrincipleStatus(p.num) === 'conditional' ? T.amber : T.green} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Principles checklist — grouped by category */}
          {(() => {
            const EP_GROUPS = [
              { title: 'Review & Categorisation', color: T.navy, bg: '#f0f4f8', border: '#b0c4de', principles: [1] },
              { title: 'Environmental Principles (EP 2\u20134)', color: T.green, bg: '#f0fdf4', border: '#86efac', principles: [2, 3, 4] },
              { title: 'Social Principles (EP 5\u20137)', color: T.blue, bg: '#eff6ff', border: '#93c5fd', principles: [5, 6, 7] },
              { title: 'Financial & Monitoring (EP 8\u201310)', color: T.amber, bg: '#fffbeb', border: '#fcd34d', principles: [8, 9, 10] },
            ];
            const renderPrinciple = (p) => {
              const status = getPrincipleStatus(p.num);
              const bgColor = status === 'required' ? '#fef2f2' : status === 'conditional' ? '#fffbeb' : '#f0fdf4';
              const borderColor = status === 'required' ? '#fca5a5' : status === 'conditional' ? '#fcd34d' : '#86efac';
              const iconColor = status === 'required' ? T.red : status === 'conditional' ? T.amber : T.green;
              const icon = status === 'required' ? '\u2757' : status === 'conditional' ? '\u26A0' : '\u2705';
              return (
                <div key={p.num} style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 8, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <span style={{ background: T.navy, color: '#fff', borderRadius: 14, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>EP {p.num}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{p.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: iconColor, textTransform: 'uppercase' }}>{status === 'required' ? 'Required' : status === 'conditional' ? 'Conditional' : 'Not Required'}</span>
                  </div>
                  <p style={{ fontSize: 12, color: T.sub, margin: '0 0 8px', paddingLeft: 38 }}>{p.desc}</p>
                  {status !== 'not_required' && (
                    <ul style={{ margin: 0, paddingLeft: 56, listStyle: 'disc' }}>
                      {p.requirements.map((r, i) => (
                        <li key={i} style={{ fontSize: 12, color: T.text, marginBottom: 2 }}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            };
            return EP_GROUPS.map(g => (
              <Card key={g.title} style={{ background: g.bg, borderColor: g.border, borderLeft: `4px solid ${g.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: g.color, margin: 0 }}>{g.title}</h3>
                  <span style={{ background: g.color, color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                    {g.principles.length} {g.principles.length === 1 ? 'principle' : 'principles'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {g.principles.map(num => renderPrinciple(EP_PRINCIPLES.find(p => p.num === num)))}
                </div>
              </Card>
            ));
          })()}

          {/* API response (if available) */}
          {result && (
            <Card>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, margin: '0 0 12px' }}>API Response</h3>
              <pre style={{ background: '#f9fafb', border: `1px solid ${T.border}`, borderRadius: 6, padding: 14, fontSize: 12, color: T.text, overflow: 'auto', maxHeight: 400 }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </Card>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 2: ESIA TRACKER                                                */}
      {/* ================================================================== */}
      {tab === 'esia' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <Alert type="info">
            The Environmental and Social Impact Assessment (ESIA) is the cornerstone of EP Principle 2. Category A and B projects require a comprehensive assessment process addressing IFC Performance Standards PS1-PS8.
          </Alert>

          {/* Process flow */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, margin: '0 0 18px' }}>ESIA Process Flow</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
              {ESIA_STAGES.map((s, i) => (
                <React.Fragment key={s.stage}>
                  <div style={{
                    background: CHART_COLORS[i % CHART_COLORS.length], color: '#fff', borderRadius: 10,
                    padding: '12px 20px', minWidth: 130, textAlign: 'center', flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{s.stage}</div>
                    <div style={{ fontSize: 10, opacity: .85, marginTop: 2 }}>{s.timeline}</div>
                  </div>
                  {i < ESIA_STAGES.length - 1 && (
                    <div style={{ fontSize: 20, color: T.sub, padding: '0 6px', flexShrink: 0 }}>{'\u25B6'}</div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </Card>

          {/* Stage details */}
          {ESIA_STAGES.map((s, i) => (
            <Card key={s.stage}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ background: CHART_COLORS[i % CHART_COLORS.length], color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                  Stage {i + 1}
                </span>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: T.navy, margin: 0 }}>{s.stage}</h4>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: T.sub, fontWeight: 600 }}>{s.timeline}</span>
              </div>
              <p style={{ fontSize: 13, color: T.text, margin: '0 0 12px' }}>{s.desc}</p>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>Required Documents</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {s.docs.map(d => (
                  <span key={d} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: T.navy, fontWeight: 500 }}>
                    {d}
                  </span>
                ))}
              </div>
            </Card>
          ))}

          {/* EP Principle 2 link */}
          <Card style={{ background: '#eff6ff', borderColor: '#93c5fd' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', margin: '0 0 8px' }}>Link to EP Principle 2: Environmental and Social Assessment</h4>
            <p style={{ fontSize: 13, color: '#1e40af', margin: 0 }}>
              For Category A projects, the ESIA must include a comprehensive assessment of environmental and social risks and impacts, alternatives analysis, and cumulative impact assessment. For Category B projects in non-designated countries, a limited or focused assessment may be acceptable depending on the nature and scale of risks.
            </p>
          </Card>
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 3: EP FRAMEWORK REFERENCE                                      */}
      {/* ================================================================== */}
      {tab === 'reference' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* All 10 Principles */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, margin: '0 0 16px' }}>The 10 Equator Principles (EP IV)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {EP_PRINCIPLES.map(p => (
                <div key={p.num} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ background: T.navy, color: T.gold, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>EP {p.num}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{p.name}</span>
                  </div>
                  <p style={{ fontSize: 12, color: T.sub, margin: '0 0 8px' }}>{p.desc}</p>
                  <ul style={{ margin: 0, paddingLeft: 18, listStyle: 'disc' }}>
                    {p.requirements.map((r, i) => (
                      <li key={i} style={{ fontSize: 11, color: T.text, marginBottom: 2 }}>{r}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          {/* EP IV vs EP III */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, margin: '0 0 14px' }}>EP IV vs EP III Key Changes</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>Area</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>EP III (2013)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>EP IV (2020)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Scope', 'Project finance >$10M', 'Project finance >$10M + project-related corporate loans + bridge loans + project-related refinancing'],
                  ['Climate Change', 'Limited reference', 'Explicit climate change risk assessment; TCFD-aligned reporting for high-emission projects'],
                  ['Human Rights', 'Indirect reference via IFC PS', 'Strengthened HRDD requirements; explicit reference to UNGPs'],
                  ['Indigenous Peoples', 'FPIC for relocation only', 'FPIC for all adverse impacts on indigenous peoples (expanded scope)'],
                  ['Designated Countries', 'Robust regulatory framework assumed', 'Same approach but updated list; annual review process'],
                  ['Reporting', 'Annual EP implementation report', 'Enhanced reporting: GHG emissions for >100k tCO2/yr; biodiversity data; IP data'],
                  ['Social Risks', 'General reference', 'Explicit labour rights, gender considerations, and social risk assessment'],
                ].map(([area, ep3, ep4], i) => (
                  <tr key={area} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: T.navy }}>{area}</td>
                    <td style={{ padding: '10px 14px', color: T.sub }}>{ep3}</td>
                    <td style={{ padding: '10px 14px', color: T.text }}>{ep4}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Designated vs Non-Designated */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#166534', margin: '0 0 10px' }}>Designated Countries</h4>
              <p style={{ fontSize: 12, color: '#166534', margin: '0 0 10px' }}>
                Countries deemed to have robust environmental and social governance, legislation, and institutional capacity to protect their people and environment. For projects in these countries, compliance with host country laws is considered equivalent to meeting EP requirements for many principles.
              </p>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 6, fontWeight: 600 }}>Examples:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {['Australia', 'Austria', 'Belgium', 'Canada', 'Denmark', 'Finland', 'France', 'Germany', 'Ireland', 'Israel', 'Italy', 'Japan', 'Netherlands', 'New Zealand', 'Norway', 'Portugal', 'Singapore', 'South Korea', 'Spain', 'Sweden', 'Switzerland', 'United Kingdom', 'United States'].map(c => (
                  <span key={c} style={{ background: '#dcfce7', borderRadius: 4, padding: '2px 8px', fontSize: 10, color: '#166534', fontWeight: 500 }}>{c}</span>
                ))}
              </div>
            </Card>
            <Card style={{ background: '#fffbeb', borderColor: '#fcd34d' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#92400e', margin: '0 0 10px' }}>Non-Designated Countries</h4>
              <p style={{ fontSize: 12, color: '#92400e', margin: '0 0 10px' }}>
                All countries not on the Designated Country list. Projects in these countries require additional due diligence, including independent review and monitoring, as local regulatory frameworks may not meet international standards.
              </p>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 6, fontWeight: 600 }}>Additional requirements:</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#92400e' }}>
                <li>Assessment must reference IFC Performance Standards</li>
                <li>Independent review by qualified E&S consultant required</li>
                <li>Ongoing independent monitoring for Category A projects</li>
                <li>Public disclosure and reporting obligations apply</li>
                <li>Stakeholder engagement aligned with international practice</li>
              </ul>
            </Card>
          </div>

          {/* IFC Performance Standards */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, margin: '0 0 14px' }}>IFC Performance Standards (PS1-PS8) Mapping</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {IFC_PS.map(ps => (
                <div key={ps.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', border: `1px solid ${T.border}`, borderRadius: 8, background: '#fafafa' }}>
                  <span style={{ background: T.indigo, color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{ps.id}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{ps.name}</div>
                    <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{ps.scope}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* OECD Category criteria */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, margin: '0 0 14px' }}>OECD Common Approaches Category Criteria</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { cat: 'A', label: 'Category A — High Risk', color: T.red, bgColor: '#fef2f2', borderColor: '#fca5a5',
                  criteria: ['Projects with potential significant adverse E&S impacts', 'Impacts are diverse, irreversible, or unprecedented', 'Full ESIA required with alternatives analysis', 'Independent review and monitoring mandatory', 'Examples: large dams, major extractive projects, large-scale industrial plants'] },
                { cat: 'B', label: 'Category B — Medium Risk', color: T.amber, bgColor: '#fffbeb', borderColor: '#fcd34d',
                  criteria: ['Potential limited adverse E&S impacts', 'Impacts are few, site-specific, and largely reversible', 'Focused or limited ESIA may suffice', 'Mitigation measures are readily available', 'Examples: small-scale manufacturing, tourism, agribusiness'] },
                { cat: 'C', label: 'Category C — Low Risk', color: T.green, bgColor: '#f0fdf4', borderColor: '#86efac',
                  criteria: ['Minimal or no adverse E&S impacts', 'No further E&S assessment beyond screening', 'Financial intermediary projects with no E&S risk', 'EP requirements limited to Principle 1 (screening)', 'Examples: financial advisory, technical consulting'] },
              ].map(c => (
                <div key={c.cat} style={{ background: c.bgColor, border: `1px solid ${c.borderColor}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <CategoryBadge cat={c.cat} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: c.color }}>{c.cat === 'A' ? 'High Risk' : c.cat === 'B' ? 'Medium Risk' : 'Low Risk'}</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, listStyle: 'disc' }}>
                    {c.criteria.map((cr, i) => (
                      <li key={i} style={{ fontSize: 12, color: T.text, marginBottom: 4 }}>{cr}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
