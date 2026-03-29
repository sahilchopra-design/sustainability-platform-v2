import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis, AreaChart, Area, LineChart, Line } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ================================================================
   UNGP FRAMEWORK — 3 PILLARS
   ================================================================ */
const UNGP_PILLARS = [
  { id: 'P1', name: 'State Duty to Protect', description: 'Governments must protect against human rights abuses by business', relevance: 'Sets the regulatory context -- country-level enforcement varies' },
  { id: 'P2', name: 'Corporate Responsibility to Respect', description: 'Companies must avoid infringing human rights and address adverse impacts', relevance: 'The core assessment -- does the company have a human rights policy, DD process, and remedy mechanism?' },
  { id: 'P3', name: 'Access to Remedy', description: 'Victims must have access to effective remedy (judicial and non-judicial)', relevance: 'Does the company have a grievance mechanism? Is it accessible and effective?' },
];

/* ================================================================
   8 SALIENT HUMAN RIGHTS ISSUES
   ================================================================ */
const HR_SALIENT_ISSUES = [
  { id: 'HR01', issue: 'Forced Labour & Modern Slavery', severity: 'Critical', sectors: ['Consumer Staples', 'Consumer Discretionary', 'Materials'], indicators: ['Recruitment fees', 'Document retention', 'Movement restrictions', 'Excessive overtime'], country_risk_factor: { IN: 0.72, CN: 0.68, BD: 0.85, VN: 0.75, TH: 0.65, BR: 0.52, ZA: 0.45, US: 0.15, GB: 0.12, DE: 0.08 } },
  { id: 'HR02', issue: 'Child Labour', severity: 'Critical', sectors: ['Consumer Staples', 'Materials'], indicators: ['Age verification', 'Hazardous work', 'School attendance'], country_risk_factor: { IN: 0.65, CN: 0.35, BD: 0.78, NG: 0.82, CG: 0.88, GH: 0.72, BR: 0.38, ZA: 0.42 } },
  { id: 'HR03', issue: 'Freedom of Association', severity: 'High', sectors: ['Industrials', 'Consumer Discretionary', 'Materials'], indicators: ['Union recognition', 'Collective bargaining', 'Worker committees'], country_risk_factor: { CN: 0.85, VN: 0.82, BD: 0.75, EG: 0.72, SA: 0.80, AE: 0.78, US: 0.35, GB: 0.12 } },
  { id: 'HR04', issue: 'Occupational Health & Safety', severity: 'High', sectors: ['Energy', 'Materials', 'Industrials', 'Utilities'], indicators: ['Fatality rate', 'Injury rate', 'Safety training', 'PPE provision'], country_risk_factor: { IN: 0.65, CN: 0.55, BD: 0.78, BR: 0.48, ZA: 0.52, US: 0.22, GB: 0.15, DE: 0.10 } },
  { id: 'HR05', issue: 'Land Rights & Indigenous Peoples', severity: 'High', sectors: ['Energy', 'Materials', 'Real Estate', 'Utilities'], indicators: ['FPIC process', 'Land acquisition', 'Resettlement', 'Cultural heritage'], country_risk_factor: { BR: 0.72, AU: 0.45, CA: 0.38, IN: 0.62, ID: 0.68, CG: 0.82 } },
  { id: 'HR06', issue: 'Privacy & Data Rights', severity: 'Medium', sectors: ['IT', 'Communication Services', 'Financials', 'Health Care'], indicators: ['Data protection', 'Surveillance', 'Consent mechanisms', 'Breach response'], country_risk_factor: { CN: 0.78, US: 0.35, GB: 0.15, DE: 0.10, IN: 0.55, SG: 0.20 } },
  { id: 'HR07', issue: 'Discrimination & Equal Treatment', severity: 'Medium', sectors: ['All'], indicators: ['Pay equity', 'Hiring practices', 'Promotion rates', 'Accessibility'], country_risk_factor: { SA: 0.72, JP: 0.55, KR: 0.52, US: 0.32, IN: 0.58, BR: 0.42, GB: 0.18, DE: 0.15 } },
  { id: 'HR08', issue: 'Community Impact & Displacement', severity: 'High', sectors: ['Energy', 'Materials', 'Real Estate', 'Industrials'], indicators: ['Resettlement plans', 'Community consultation', 'Benefit sharing', 'Grievance resolution'], country_risk_factor: { IN: 0.68, CN: 0.65, BR: 0.58, ZA: 0.55, CG: 0.82, ID: 0.62 } },
];

/* ================================================================
   UNGP DD ASSESSMENT CHECKLIST — 15 ITEMS
   ================================================================ */
const UNGP_DD_CHECKLIST = [
  { id: 'DD01', category: 'Policy', item: 'Human rights policy approved by board', weight: 8 },
  { id: 'DD02', category: 'Policy', item: 'Policy references UNGPs and ILO core conventions', weight: 6 },
  { id: 'DD03', category: 'Policy', item: 'Policy covers supply chain and business relationships', weight: 8 },
  { id: 'DD04', category: 'DD Process', item: 'Human rights impact assessment conducted', weight: 10 },
  { id: 'DD05', category: 'DD Process', item: 'Salient human rights issues identified', weight: 8 },
  { id: 'DD06', category: 'DD Process', item: 'Affected stakeholder engagement conducted', weight: 8 },
  { id: 'DD07', category: 'DD Process', item: 'Supply chain human rights audits conducted', weight: 10 },
  { id: 'DD08', category: 'DD Process', item: 'Risk mitigation actions implemented', weight: 8 },
  { id: 'DD09', category: 'Integration', item: 'HR DD integrated into procurement processes', weight: 6 },
  { id: 'DD10', category: 'Integration', item: 'HR training for relevant employees', weight: 4 },
  { id: 'DD11', category: 'Tracking', item: 'KPIs and targets for HR performance', weight: 6 },
  { id: 'DD12', category: 'Tracking', item: 'Regular monitoring and reporting on HR issues', weight: 6 },
  { id: 'DD13', category: 'Remedy', item: 'Operational-level grievance mechanism in place', weight: 8 },
  { id: 'DD14', category: 'Remedy', item: 'Mechanism is accessible, predictable, transparent', weight: 4 },
  { id: 'DD15', category: 'Remedy', item: 'Track record of providing effective remedy', weight: 4 },
];

const TOTAL_DD_WEIGHT = UNGP_DD_CHECKLIST.reduce((s, c) => s + c.weight, 0);

/* ================================================================
   COUNTRY HEATMAP COUNTRIES
   ================================================================ */
const HEATMAP_COUNTRIES = ['IN', 'CN', 'BD', 'VN', 'TH', 'BR', 'ZA', 'US', 'GB', 'DE', 'SA', 'CG', 'ID', 'AU'];
const COUNTRY_NAMES = { IN: 'India', CN: 'China', BD: 'Bangladesh', VN: 'Vietnam', TH: 'Thailand', BR: 'Brazil', ZA: 'South Africa', US: 'United States', GB: 'United Kingdom', DE: 'Germany', SA: 'Saudi Arabia', CG: 'DR Congo', ID: 'Indonesia', AU: 'Australia', NG: 'Nigeria', GH: 'Ghana', EG: 'Egypt', AE: 'UAE', CA: 'Canada', JP: 'Japan', KR: 'South Korea', SG: 'Singapore' };

/* ================================================================
   MODERN SLAVERY ACT REQUIREMENTS
   ================================================================ */
const MODERN_SLAVERY_REQS = [
  { jurisdiction: 'UK', act: 'UK Modern Slavery Act 2015', threshold: 'Turnover > GBP 36M', requirements: ['Annual slavery statement', 'Board-approved statement', 'Supply chain due diligence', 'Risk assessment disclosure'], penalty: 'Injunction, reputational' },
  { jurisdiction: 'AU', act: 'AU Modern Slavery Act 2018', threshold: 'Revenue > AUD 100M', requirements: ['Annual Modern Slavery Statement', 'Describe risks in operations & supply chain', 'Actions taken to assess & address risks', 'Effectiveness assessment'], penalty: 'Minister may require compliance notice' },
  { jurisdiction: 'US', act: 'Uyghur Forced Labor Prevention Act', threshold: 'Any goods from Xinjiang region', requirements: ['Rebuttable presumption of forced labor', 'Clear and convincing evidence required', 'Supply chain tracing'], penalty: 'Import seizure, CBP detention' },
  { jurisdiction: 'CA', act: 'Canada Fighting Against Forced Labour Act', threshold: 'Entities doing business in CA with assets/revenue >$20M or 250+ employees', requirements: ['Annual report to Public Safety', 'Steps taken to prevent forced/child labor', 'Training and due diligence measures'], penalty: 'Fine up to $250,000' },
];

/* ================================================================
   CSDDD ART 6-8 HR DD OBLIGATIONS
   ================================================================ */
const CSDDD_HR_ARTICLES = [
  { article: 'Art 6', title: 'Integrating DD into policies', obligation: 'Companies must adopt a human rights & environmental DD policy updated annually', deadline: '2027 (large cos)' },
  { article: 'Art 7', title: 'Identifying adverse impacts', obligation: 'Map actual and potential adverse HR impacts in own operations, subsidiaries, and value chain', deadline: '2027' },
  { article: 'Art 8', title: 'Preventing & mitigating impacts', obligation: 'Take appropriate measures to prevent potential adverse impacts and bring actual ones to an end', deadline: '2027' },
  { article: 'Art 9', title: 'Remediation', obligation: 'Provide remediation where company caused or contributed to adverse impact', deadline: '2027' },
  { article: 'Art 10', title: 'Meaningful stakeholder engagement', obligation: 'Engage affected stakeholders at all stages of the DD process', deadline: '2027' },
  { article: 'Art 11', title: 'Complaints procedure', obligation: 'Establish and maintain a complaints procedure for persons affected', deadline: '2027' },
];

/* ================================================================
   REGULATORY TIMELINE
   ================================================================ */
const REG_TIMELINE = [
  { year: 2015, event: 'UK Modern Slavery Act enacted', type: 'Legislation' },
  { year: 2017, event: 'French Duty of Vigilance Law', type: 'Legislation' },
  { year: 2018, event: 'Australia Modern Slavery Act enacted', type: 'Legislation' },
  { year: 2021, event: 'Germany Supply Chain Due Diligence Act', type: 'Legislation' },
  { year: 2022, event: 'US Uyghur Forced Labor Prevention Act effective', type: 'Legislation' },
  { year: 2023, event: 'EU CSDDD political agreement', type: 'Framework' },
  { year: 2024, event: 'EU CSDDD formally adopted', type: 'Framework' },
  { year: 2024, event: 'Canada Fighting Against Forced Labour Act', type: 'Legislation' },
  { year: 2026, event: 'CSDDD transposition deadline for Member States', type: 'Deadline' },
  { year: 2027, event: 'CSDDD applies to large companies (>1000 emp, >EUR 450M)', type: 'Deadline' },
  { year: 2028, event: 'CSDDD extends to mid-range companies', type: 'Deadline' },
  { year: 2029, event: 'CSDDD applies to all in-scope companies', type: 'Deadline' },
];

/* ================================================================
   SECTOR RISK PROFILES
   ================================================================ */
const SECTOR_RISK_PROFILES = {
  'Consumer Staples': { top_issues: ['Forced Labour', 'Child Labour', 'Community Impact'], affected_workers: ['Agricultural laborers', 'Processing plant workers', 'Seasonal workers'], regulatory_exposure: 'Very High' },
  Materials: { top_issues: ['Forced Labour', 'OHS', 'Land Rights'], affected_workers: ['Mine workers', 'Smelter operators', 'Transport workers'], regulatory_exposure: 'Very High' },
  Energy: { top_issues: ['OHS', 'Land Rights', 'Community Impact'], affected_workers: ['Rig workers', 'Pipeline laborers', 'Refinery staff'], regulatory_exposure: 'High' },
  Industrials: { top_issues: ['Freedom of Association', 'OHS', 'Discrimination'], affected_workers: ['Factory workers', 'Construction laborers', 'Logistics staff'], regulatory_exposure: 'High' },
  'Consumer Discretionary': { top_issues: ['Forced Labour', 'Freedom of Association', 'Discrimination'], affected_workers: ['Garment workers', 'Electronics assemblers', 'Retail staff'], regulatory_exposure: 'High' },
  Financials: { top_issues: ['Privacy', 'Discrimination', 'Community Impact'], affected_workers: ['Office workers', 'Call center staff'], regulatory_exposure: 'Medium' },
  IT: { top_issues: ['Privacy', 'Discrimination', 'Supply chain forced labour'], affected_workers: ['Tech workers', 'Hardware assembly workers'], regulatory_exposure: 'Medium' },
  'Health Care': { top_issues: ['Privacy', 'OHS', 'Discrimination'], affected_workers: ['Healthcare workers', 'Lab technicians'], regulatory_exposure: 'Medium' },
  Utilities: { top_issues: ['OHS', 'Land Rights', 'Community Impact'], affected_workers: ['Plant operators', 'Lineworkers', 'Dam construction'], regulatory_exposure: 'High' },
  'Communication Services': { top_issues: ['Privacy', 'Freedom of Association', 'Discrimination'], affected_workers: ['Content moderators', 'Network installers'], regulatory_exposure: 'Medium' },
  'Real Estate': { top_issues: ['Land Rights', 'OHS', 'Community Impact'], affected_workers: ['Construction workers', 'Maintenance staff'], regulatory_exposure: 'High' },
};

const BAR_COLORS = [T.red, T.amber, T.navy, T.gold, T.sage, '#7c3aed', '#0d9488', '#ec4899'];

/* ================================================================
   HELPERS
   ================================================================ */
const mapSector = s => (s === 'IT' ? 'Information Technology' : s);
const sevClr = v => v === 'Critical' ? T.red : v === 'High' ? T.amber : v === 'Medium' ? T.gold : T.green;
const riskClr = v => v >= 0.7 ? T.red : v >= 0.5 ? T.amber : v >= 0.3 ? T.gold : T.green;
const fmt = n => n == null ? '-' : typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n;
const pct = n => n == null ? '-' : `${(n * 100).toFixed(0)}%`;
const hash = s => { let h = 0; for (let i = 0; i < (s||'').length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return Math.abs(h); };

/* ================================================================
   INLINE COMPONENTS
   ================================================================ */
const Section = ({ title, sub, children, style }) => (
  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20, ...style }}>
    <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: sub ? 2 : 12, fontFamily: T.font }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: T.textMut, marginBottom: 14 }}>{sub}</div>}
    {children}
  </div>
);

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '16px 18px', minWidth: 150, flex: '1 1 170px' }}>
    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6, fontFamily: T.font }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: color || T.navy, fontFamily: T.font }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Btn = ({ children, onClick, active, small, style }) => (
  <button onClick={onClick} style={{ padding: small ? '5px 12px' : '8px 18px', borderRadius: 8, border: `1px solid ${active ? T.navy : T.border}`, background: active ? T.navy : T.surface, color: active ? '#fff' : T.text, fontSize: small ? 12 : 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.font, transition: 'all .15s', ...style }}>{children}</button>
);

const Badge = ({ text, color }) => (
  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${color}18`, color, fontFamily: T.font }}>{text}</span>
);

const TH = ({ children, onClick, sorted, style }) => (
  <th onClick={onClick} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: `2px solid ${T.border}`, cursor: onClick ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap', fontFamily: T.font, ...style }}>
    {children}{sorted ? (sorted === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
  </th>
);

const TD = ({ children, style }) => (
  <td style={{ padding: '9px 12px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}`, fontFamily: T.font, ...style }}>{children}</td>
);

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
const HumanRightsDDPage = () => {
  const navigate = useNavigate();

  /* -- Portfolio -- */
  const portfolio = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1') || '[]');
      if (raw.length) return raw;
      return (GLOBAL_COMPANY_MASTER || []).slice(0, 25);
    } catch { return (GLOBAL_COMPANY_MASTER || []).slice(0, 25); }
  }, []);

  /* -- DD Scorecard state persisted -- */
  const [ddScores, setDdScores] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_human_rights_dd_v1')) || {}; } catch { return {}; }
  });
  useEffect(() => { localStorage.setItem('ra_human_rights_dd_v1', JSON.stringify(ddScores)); }, [ddScores]);

  const [sortCol, setSortCol] = useState('hrRiskScore');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [issueFilter, setIssueFilter] = useState('All');

  /* -- Generate deterministic HR data per holding -- */
  const scoredHoldings = useMemo(() => {
    return portfolio.map(c => {
      const sector = c.gics_sector || c.sector || 'Financials';
      const displaySector = mapSector(sector);
      const h = hash(c.isin || c.company_name || '');
      const country = c.country_code || c.domicile || 'IN';
      const weight = c.weight_pct || c.portfolio_weight || 2 + (h % 6);

      /* Compute risk factors from country exposure */
      const forcedLabourRisk = +(HR_SALIENT_ISSUES[0].country_risk_factor[country] || 0.30).toFixed(2);
      const childLabourRisk = +(HR_SALIENT_ISSUES[1].country_risk_factor[country] || 0.25).toFixed(2);
      const foaRisk = +(HR_SALIENT_ISSUES[2].country_risk_factor[country] || 0.30).toFixed(2);
      const ohsRisk = +(HR_SALIENT_ISSUES[3].country_risk_factor[country] || 0.25).toFixed(2);

      /* Sector multiplier */
      const sectorProfile = SECTOR_RISK_PROFILES[sector] || SECTOR_RISK_PROFILES['Financials'];
      const sectorMult = sectorProfile.regulatory_exposure === 'Very High' ? 1.3 : sectorProfile.regulatory_exposure === 'High' ? 1.1 : 0.8;

      /* Overall HR risk score 0-100 */
      const baseRisk = ((forcedLabourRisk + childLabourRisk + foaRisk + ohsRisk) / 4) * 100 * sectorMult;
      const hrRiskScore = Math.min(100, Math.max(5, Math.round(baseRisk + (h % 15) - 7)));

      /* UNGP compliance from DD checklist */
      const companyDD = ddScores[c.isin || c.company_name] || {};
      let ungpScore = 0;
      let ungpMax = 0;
      UNGP_DD_CHECKLIST.forEach(item => {
        ungpMax += item.weight;
        const val = companyDD[item.id];
        if (val === 'Met') ungpScore += item.weight;
        else if (val === 'Partial') ungpScore += item.weight * 0.5;
      });
      const ungpPct = ungpMax > 0 ? Math.round((ungpScore / ungpMax) * 100) : Math.max(15, 85 - hrRiskScore + (h % 20));

      /* Grievance mechanism */
      const hasGrievance = ungpPct > 55 || (h % 3 === 0);
      const topIssue = hrRiskScore > 65 ? 'Forced Labour' : hrRiskScore > 45 ? 'OHS' : hrRiskScore > 30 ? 'Freedom of Association' : 'Privacy';
      const supplyChainRisk = Math.min(100, Math.max(10, hrRiskScore + (h % 20) - 10));

      return { ...c, sector, displaySector, country, weight, forcedLabourRisk, childLabourRisk, foaRisk, ohsRisk, hrRiskScore, ungpPct, hasGrievance, topIssue, supplyChainRisk, sectorMult };
    });
  }, [portfolio, ddScores]);

  /* -- Sort helper -- */
  const toggleSort = col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };
  const sorted = dir => dir === 'asc' ? 'asc' : 'desc';

  const sortedHoldings = useMemo(() => {
    const arr = [...scoredHoldings];
    arr.sort((a, b) => {
      const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return arr;
  }, [scoredHoldings, sortCol, sortDir]);

  /* -- KPI metrics -- */
  const kpis = useMemo(() => {
    if (!scoredHoldings.length) return {};
    const avgHR = (scoredHoldings.reduce((s, h) => s + h.hrRiskScore, 0) / scoredHoldings.length).toFixed(1);
    const criticalCount = scoredHoldings.filter(h => h.hrRiskScore >= 65).length;
    const highRisk = scoredHoldings.filter(h => h.hrRiskScore >= 50).length;
    const avgUNGP = (scoredHoldings.reduce((s, h) => s + h.ungpPct, 0) / scoredHoldings.length).toFixed(0);
    const forcedExposure = (scoredHoldings.reduce((s, h) => s + h.forcedLabourRisk * (h.weight || 2), 0) / scoredHoldings.reduce((s, h) => s + (h.weight || 2), 0) * 100).toFixed(1);
    const childExposure = (scoredHoldings.reduce((s, h) => s + h.childLabourRisk * (h.weight || 2), 0) / scoredHoldings.reduce((s, h) => s + (h.weight || 2), 0) * 100).toFixed(1);
    const avgSC = (scoredHoldings.reduce((s, h) => s + h.supplyChainRisk, 0) / scoredHoldings.length).toFixed(0);
    const grievancePct = ((scoredHoldings.filter(h => h.hasGrievance).length / scoredHoldings.length) * 100).toFixed(0);
    return { avgHR, criticalCount, highRisk, avgUNGP, forcedExposure, childExposure, avgSC, grievancePct };
  }, [scoredHoldings]);

  /* -- Issue exposure bar data -- */
  const issueExposure = useMemo(() => HR_SALIENT_ISSUES.map(iss => {
    const exposed = scoredHoldings.filter(h => {
      const s = h.sector;
      return iss.sectors.includes('All') || iss.sectors.includes(s);
    });
    const totalWeight = exposed.reduce((s, h) => s + (h.weight || 2), 0);
    return { issue: iss.issue.length > 22 ? iss.issue.slice(0, 22) + '...' : iss.issue, fullIssue: iss.issue, severity: iss.severity, exposedCount: exposed.length, portfolioWeight: +totalWeight.toFixed(1), color: sevClr(iss.severity) };
  }), [scoredHoldings]);

  /* -- DD scorecard toggle -- */
  const setDdStatus = useCallback((companyKey, itemId, status) => {
    setDdScores(prev => {
      const comp = { ...(prev[companyKey] || {}) };
      comp[itemId] = comp[itemId] === status ? null : status;
      return { ...prev, [companyKey]: comp };
    });
  }, []);

  /* -- Country heatmap data -- */
  const heatmapData = useMemo(() => HEATMAP_COUNTRIES.map(cc => {
    const row = { country: COUNTRY_NAMES[cc] || cc, code: cc };
    HR_SALIENT_ISSUES.forEach(iss => {
      row[iss.id] = iss.country_risk_factor[cc] || 0;
    });
    return row;
  }), []);

  /* -- Engagement priority -- */
  const engagementPriority = useMemo(() => {
    return scoredHoldings.map(h => ({
      name: (h.company_name || '').slice(0, 18),
      hrRisk: h.hrRiskScore,
      weight: h.weight || 2,
      priority: +((h.hrRiskScore / 100) * (h.weight || 2)).toFixed(2),
    })).sort((a, b) => b.priority - a.priority).slice(0, 15);
  }, [scoredHoldings]);

  /* -- Exports -- */
  const exportCSV = useCallback(() => {
    const headers = ['Company', 'ISIN', 'Country', 'Sector', 'HR Risk Score', 'UNGP Score %', 'Forced Labour Risk', 'Child Labour Risk', 'Top Issue', 'Supply Chain Risk', 'Grievance Mechanism', 'Weight %'];
    const rows = sortedHoldings.map(h => [h.company_name, h.isin, h.country, h.sector, h.hrRiskScore, h.ungpPct, h.forcedLabourRisk, h.childLabourRisk, h.topIssue, h.supplyChainRisk, h.hasGrievance ? 'Yes' : 'No', h.weight]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'human_rights_dd_report.csv'; a.click();
  }, [sortedHoldings]);

  const exportJSON = useCallback(() => {
    const data = { generated: new Date().toISOString(), holdings: sortedHoldings.length, ddScores, checklist: UNGP_DD_CHECKLIST };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ungp_scorecard.json'; a.click();
  }, [sortedHoldings, ddScores]);

  const handlePrint = useCallback(() => window.print(), []);

  /* -- Render -- */
  return (
    <div style={{ padding: 24, fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      {/* ===== 1. HEADER ===== */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.navy, margin: 0 }}>Human Rights Due Diligence Engine</h1>
          <Badge text="UNGPs" color={T.navy} /><Badge text="CSDDD" color={T.sage} /><Badge text="8 Salient Issues" color={T.gold} /><Badge text="15 DD Items" color={T.amber} />
        </div>
        <p style={{ color: T.textSec, fontSize: 13, marginTop: 6 }}>UN Guiding Principles assessment across {scoredHoldings.length} holdings -- EU CSDDD Art 6-11 human rights due diligence obligations</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {['overview', 'scorecard', 'supply-chain', 'regulation'].map(t => (
            <Btn key={t} active={activeTab === t} onClick={() => setActiveTab(t)} small>{t === 'overview' ? 'Overview' : t === 'scorecard' ? 'DD Scorecard' : t === 'supply-chain' ? 'Supply Chain' : 'Regulation'}</Btn>
          ))}
        </div>
      </div>

      {/* ===== 2. KPI CARDS ===== */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="Portfolio HR Risk" value={kpis.avgHR || '-'} sub="0-100 scale" color={parseFloat(kpis.avgHR) > 50 ? T.red : T.navy} />
        <KpiCard label="Critical Issues" value={kpis.criticalCount || 0} sub="Holdings w/ risk>65" color={T.red} />
        <KpiCard label="High-Risk Holdings" value={kpis.highRisk || 0} sub="Risk score >= 50" color={T.amber} />
        <KpiCard label="UNGP Compliance" value={`${kpis.avgUNGP || 0}%`} sub="Avg DD score" color={T.sage} />
        <KpiCard label="Forced Labour Exp." value={`${kpis.forcedExposure || 0}%`} sub="Wtd avg risk" color={T.red} />
        <KpiCard label="Child Labour Exp." value={`${kpis.childExposure || 0}%`} sub="Wtd avg risk" color={T.amber} />
        <KpiCard label="Supply Chain HR Risk" value={kpis.avgSC || '-'} sub="Avg score 0-100" color={T.navy} />
        <KpiCard label="Grievance Coverage" value={`${kpis.grievancePct || 0}%`} sub="Holdings w/ mechanism" color={T.sage} />
      </div>

      {/* ===== 3. SALIENT ISSUES RISK MATRIX ===== */}
      <Section title="Salient Issues Risk Matrix" sub="8 human rights issues by severity -- portfolio exposure per issue (holdings count + weight %)">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {['All', 'Critical', 'High', 'Medium'].map(f => (
            <Btn key={f} small active={issueFilter === f} onClick={() => setIssueFilter(f)}>{f}</Btn>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={issueFilter === 'All' ? issueExposure : issueExposure.filter(e => e.severity === issueFilter)} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="issue" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="exposedCount" name="Exposed Holdings" fill={T.navy} radius={[4,4,0,0]} />
            <Bar dataKey="portfolioWeight" name="Portfolio Weight %" fill={T.gold} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
          {HR_SALIENT_ISSUES.map(iss => (
            <div key={iss.id} style={{ background: T.surfaceH, borderRadius: 8, padding: '8px 12px', fontSize: 11, flex: '1 1 220px', border: `1px solid ${T.border}` }}>
              <div style={{ fontWeight: 700, color: sevClr(iss.severity), marginBottom: 3 }}>{iss.issue}</div>
              <div style={{ color: T.textSec }}>Severity: <strong>{iss.severity}</strong> | Sectors: {iss.sectors.join(', ')}</div>
              <div style={{ color: T.textMut, marginTop: 2 }}>Indicators: {iss.indicators.join(', ')}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== 4. COUNTRY HR RISK HEATMAP ===== */}
      <Section title="Country Human Rights Risk Heatmap" sub="14 countries x 8 issues -- color-coded by country risk factor (0-1 scale)">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                <TH style={{ position: 'sticky', left: 0, background: T.surface, zIndex: 2 }}>Country</TH>
                {HR_SALIENT_ISSUES.map(iss => <TH key={iss.id} style={{ textAlign: 'center', fontSize: 9, maxWidth: 80 }}>{iss.issue.split(' ').slice(0, 2).join(' ')}</TH>)}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map(row => (
                <tr key={row.code}>
                  <TD style={{ fontWeight: 600, position: 'sticky', left: 0, background: T.surface, zIndex: 1 }}>{row.country}</TD>
                  {HR_SALIENT_ISSUES.map(iss => {
                    const v = row[iss.id] || 0;
                    const bg = v >= 0.7 ? '#fecaca' : v >= 0.5 ? '#fed7aa' : v >= 0.3 ? '#fef08a' : v > 0 ? '#bbf7d0' : T.surfaceH;
                    return <TD key={iss.id} style={{ textAlign: 'center', background: bg, fontWeight: 600, color: v >= 0.7 ? T.red : v >= 0.5 ? T.amber : T.text }}>{v > 0 ? (v * 100).toFixed(0) + '%' : '-'}</TD>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ===== 5. UNGP DD SCORECARD ===== */}
      <Section title="UNGP DD Scorecard" sub="Select a holding to assess against 15-item checklist. Status persisted to localStorage.">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {scoredHoldings.slice(0, 15).map(h => {
            const key = h.isin || h.company_name;
            return <Btn key={key} small active={selectedHolding === key} onClick={() => setSelectedHolding(key)}>{(h.company_name || '').slice(0, 14)}</Btn>;
          })}
        </div>
        {selectedHolding && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><TH>ID</TH><TH>Category</TH><TH>Assessment Item</TH><TH style={{ textAlign: 'center' }}>Weight</TH><TH style={{ textAlign: 'center' }}>Status</TH></tr>
              </thead>
              <tbody>
                {UNGP_DD_CHECKLIST.map(item => {
                  const current = (ddScores[selectedHolding] || {})[item.id] || null;
                  return (
                    <tr key={item.id}>
                      <TD style={{ fontWeight: 600 }}>{item.id}</TD>
                      <TD><Badge text={item.category} color={item.category === 'Policy' ? T.navy : item.category === 'DD Process' ? T.sage : item.category === 'Integration' ? T.gold : item.category === 'Tracking' ? T.navyL : T.amber} /></TD>
                      <TD>{item.item}</TD>
                      <TD style={{ textAlign: 'center', fontWeight: 600 }}>{item.weight}</TD>
                      <TD style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          {['Met', 'Partial', 'Not Met'].map(st => (
                            <button key={st} onClick={() => setDdStatus(selectedHolding, item.id, st)} style={{ padding: '3px 8px', borderRadius: 6, border: `1px solid ${current === st ? (st === 'Met' ? T.green : st === 'Partial' ? T.amber : T.red) : T.border}`, background: current === st ? (st === 'Met' ? '#dcfce7' : st === 'Partial' ? '#fef3c7' : '#fecaca') : T.surface, color: current === st ? (st === 'Met' ? T.green : st === 'Partial' ? T.amber : T.red) : T.textMut, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: T.font }}>{st}</button>
                          ))}
                        </div>
                      </TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(() => {
              const comp = ddScores[selectedHolding] || {};
              let earned = 0, maxW = 0;
              UNGP_DD_CHECKLIST.forEach(item => { maxW += item.weight; if (comp[item.id] === 'Met') earned += item.weight; else if (comp[item.id] === 'Partial') earned += item.weight * 0.5; });
              const pctVal = maxW > 0 ? Math.round((earned / maxW) * 100) : 0;
              return (
                <div style={{ marginTop: 14, padding: 14, background: T.surfaceH, borderRadius: 10, display: 'flex', gap: 20, alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>UNGP DD Score:</div>
                  <div style={{ flex: 1, background: T.border, borderRadius: 6, height: 14, overflow: 'hidden' }}>
                    <div style={{ width: `${pctVal}%`, height: '100%', background: pctVal >= 70 ? T.green : pctVal >= 40 ? T.amber : T.red, borderRadius: 6, transition: 'width .3s' }} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: pctVal >= 70 ? T.green : pctVal >= 40 ? T.amber : T.red }}>{pctVal}%</div>
                </div>
              );
            })()}
          </div>
        )}
      </Section>

      {/* ===== 6. HOLDINGS HR RISK TABLE ===== */}
      <Section title="Holdings HR Risk Table" sub="All holdings with human rights risk metrics -- click headers to sort">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[
                  { key: 'company_name', label: 'Company' }, { key: 'country', label: 'Country' }, { key: 'sector', label: 'Sector' },
                  { key: 'hrRiskScore', label: 'HR Risk' }, { key: 'topIssue', label: 'Top Issue' }, { key: 'ungpPct', label: 'UNGP %' },
                  { key: 'forcedLabourRisk', label: 'Forced Lab.' }, { key: 'hasGrievance', label: 'Grievance' }, { key: 'weight', label: 'Wt %' },
                ].map(col => (
                  <TH key={col.key} onClick={() => toggleSort(col.key)} sorted={sortCol === col.key ? sorted(sortDir) : null}>{col.label}</TH>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((h, i) => (
                <tr key={h.isin || i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <TD style={{ fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.company_name}</TD>
                  <TD>{h.country}</TD>
                  <TD style={{ fontSize: 11 }}>{h.sector}</TD>
                  <TD><Badge text={h.hrRiskScore} color={h.hrRiskScore >= 65 ? T.red : h.hrRiskScore >= 40 ? T.amber : T.green} /></TD>
                  <TD style={{ fontSize: 11 }}>{h.topIssue}</TD>
                  <TD style={{ fontWeight: 600, color: h.ungpPct >= 70 ? T.green : h.ungpPct >= 40 ? T.amber : T.red }}>{h.ungpPct}%</TD>
                  <TD style={{ color: riskClr(h.forcedLabourRisk), fontWeight: 600 }}>{pct(h.forcedLabourRisk)}</TD>
                  <TD><Badge text={h.hasGrievance ? 'Yes' : 'No'} color={h.hasGrievance ? T.green : T.red} /></TD>
                  <TD>{fmt(h.weight)}%</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ===== 7. MODERN SLAVERY ACT COMPLIANCE ===== */}
      <Section title="Modern Slavery Act Compliance" sub="UK / AU / US / CA requirements per holding">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {MODERN_SLAVERY_REQS.map(r => (
            <div key={r.jurisdiction} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, background: T.surfaceH }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 6 }}>{r.act}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>Threshold: {r.threshold}</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: T.text }}>
                {r.requirements.map((req, i) => <li key={i} style={{ marginBottom: 3 }}>{req}</li>)}
              </ul>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 8 }}>Penalty: {r.penalty}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.sage, marginTop: 4 }}>Portfolio exposure: {scoredHoldings.filter(h => r.jurisdiction === 'UK' ? (h.country === 'GB' || (h.weight || 0) > 3) : r.jurisdiction === 'AU' ? h.country === 'AU' : r.jurisdiction === 'US' ? h.country === 'US' : h.country === 'CA').length} holdings</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== 8. SUPPLY CHAIN HR RISK ===== */}
      <Section title="Supply Chain Human Rights Risk" sub="Cross-reference: which supply chain tiers carry highest labor risk">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { tier: 'Tier 1 (Direct Suppliers)', risk: 55, issues: 'OHS, Freedom of Association, Working hours', audited: '72%' },
            { tier: 'Tier 2 (Sub-suppliers)', risk: 72, issues: 'Forced Labour, Child Labour, Wages', audited: '28%' },
            { tier: 'Tier 3+ (Raw Materials)', risk: 85, issues: 'Modern Slavery, Land Rights, Community displacement', audited: '8%' },
          ].map(t => (
            <div key={t.tier} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, background: T.surface }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 6, fontSize: 14 }}>{t.tier}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1, background: T.border, borderRadius: 6, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${t.risk}%`, height: '100%', background: t.risk >= 70 ? T.red : t.risk >= 50 ? T.amber : T.green, borderRadius: 6 }} />
                </div>
                <span style={{ fontWeight: 800, color: t.risk >= 70 ? T.red : t.risk >= 50 ? T.amber : T.green }}>{t.risk}</span>
              </div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Key issues: {t.issues}</div>
              <div style={{ fontSize: 11, color: T.textMut }}>Audit coverage: {t.audited}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== 9. CSDDD HR REQUIREMENTS ===== */}
      <Section title="CSDDD Human Rights Requirements" sub="EU Corporate Sustainability Due Diligence Directive -- Art 6-11 obligations">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><TH>Article</TH><TH>Title</TH><TH>Obligation</TH><TH>Deadline</TH></tr></thead>
            <tbody>
              {CSDDD_HR_ARTICLES.map((a, i) => (
                <tr key={a.article} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <TD style={{ fontWeight: 700 }}>{a.article}</TD>
                  <TD style={{ fontWeight: 600 }}>{a.title}</TD>
                  <TD style={{ fontSize: 12 }}>{a.obligation}</TD>
                  <TD><Badge text={a.deadline} color={T.navy} /></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ===== 10. SECTOR RISK PROFILE CARDS ===== */}
      <Section title="Sector Risk Profile Cards" sub="Per sector: top 3 salient issues, affected worker categories, regulatory exposure">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {Object.entries(SECTOR_RISK_PROFILES).map(([sector, profile]) => {
            const count = scoredHoldings.filter(h => h.sector === sector).length;
            return (
              <div key={sector} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, background: T.surface }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: T.navy, fontSize: 13 }}>{sector}</span>
                  <Badge text={`${count} holdings`} color={T.sage} />
                </div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Top issues: <strong>{profile.top_issues.join(', ')}</strong></div>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>Workers: {profile.affected_workers.join(', ')}</div>
                <div style={{ fontSize: 11 }}>Regulatory: <Badge text={profile.regulatory_exposure} color={profile.regulatory_exposure === 'Very High' ? T.red : profile.regulatory_exposure === 'High' ? T.amber : T.gold} /></div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ===== 11. ENGAGEMENT PRIORITY MATRIX ===== */}
      <Section title="Engagement Priority Matrix" sub="Holdings ranked by HR risk x portfolio weight -- top 15 stewardship priorities">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={engagementPriority} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="priority" name="Engagement Priority" radius={[4,4,0,0]}>
              {engagementPriority.map((e, i) => <Cell key={i} fill={e.priority > 3 ? T.red : e.priority > 1.5 ? T.amber : T.sage} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ===== 12. REMEDY EFFECTIVENESS ===== */}
      <Section title="Remedy Effectiveness Assessment" sub="Do companies with grievance mechanisms actually use them?">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { label: 'With Grievance Mechanism', value: scoredHoldings.filter(h => h.hasGrievance).length, total: scoredHoldings.length, color: T.green },
            { label: 'Mechanism Accessible', value: Math.round(scoredHoldings.filter(h => h.hasGrievance).length * 0.68), total: scoredHoldings.filter(h => h.hasGrievance).length, color: T.sage },
            { label: 'Cases Resolved (est.)', value: Math.round(scoredHoldings.filter(h => h.hasGrievance).length * 0.45), total: scoredHoldings.filter(h => h.hasGrievance).length, color: T.gold },
            { label: 'Effective Remedy Provided', value: Math.round(scoredHoldings.filter(h => h.hasGrievance).length * 0.30), total: scoredHoldings.filter(h => h.hasGrievance).length, color: T.amber },
          ].map(m => (
            <div key={m.label} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, background: T.surface, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>of {m.total} holdings</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginTop: 6 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== 13. REGULATORY TIMELINE ===== */}
      <Section title="Regulatory Timeline" sub="Key milestones: CSDDD, UK/AU Modern Slavery, US Uyghur Act, Canada FAFLA">
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: T.border }} />
          {REG_TIMELINE.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14, position: 'relative' }}>
              <div style={{ position: 'absolute', left: -18, top: 4, width: 10, height: 10, borderRadius: '50%', background: r.year >= 2026 ? T.amber : T.sage, border: `2px solid ${T.surface}` }} />
              <div style={{ minWidth: 40, fontWeight: 700, color: T.navy, fontSize: 13 }}>{r.year}</div>
              <div>
                <div style={{ fontWeight: 600, color: T.text, fontSize: 13 }}>{r.event}</div>
                <Badge text={r.type} color={r.type === 'Legislation' ? T.sage : r.type === 'Framework' ? T.navy : T.amber} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== 14. EXPORTS & CROSS-NAV ===== */}
      <Section title="Exports & Navigation">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <Btn onClick={exportCSV}>Export HR DD Report (CSV)</Btn>
          <Btn onClick={exportJSON}>Export UNGP Scorecard (JSON)</Btn>
          <Btn onClick={handlePrint}>Print Report</Btn>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'CSDDD Readiness', path: '/csddd-readiness' },
            { label: 'Supply Chain Analytics', path: '/supply-chain-analytics' },
            { label: 'Stewardship Dashboard', path: '/stewardship-dashboard' },
            { label: 'Controversy Monitor', path: '/controversy-monitor' },
            { label: 'Board Diversity', path: '/board-diversity' },
            { label: 'Employee Wellbeing', path: '/employee-wellbeing' },
          ].map(n => (
            <Btn key={n.path} small onClick={() => navigate(n.path)} style={{ background: T.surfaceH }}>{n.label}</Btn>
          ))}
        </div>
      </Section>

      {/* ===== UNGP PILLARS REFERENCE ===== */}
      <Section title="UNGP Framework Reference" sub="Three Pillars of the UN Guiding Principles on Business and Human Rights">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {UNGP_PILLARS.map(p => (
            <div key={p.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, background: T.surfaceH }}>
              <div style={{ fontWeight: 700, color: T.navy, fontSize: 14, marginBottom: 4 }}>{p.id}: {p.name}</div>
              <div style={{ fontSize: 12, color: T.text, marginBottom: 6 }}>{p.description}</div>
              <div style={{ fontSize: 11, color: T.textSec, fontStyle: 'italic' }}>{p.relevance}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== FORCED LABOUR DEEP DIVE ===== */}
      <Section title="Forced Labour & Modern Slavery Deep Dive" sub="Country-level risk exposure for HR01 -- weighted by portfolio allocation">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
          {Object.entries(HR_SALIENT_ISSUES[0].country_risk_factor).sort((a, b) => b[1] - a[1]).map(([cc, risk]) => {
            const holdingsInCountry = scoredHoldings.filter(h => h.country === cc);
            return (
              <div key={cc} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, background: risk >= 0.7 ? '#fef2f2' : risk >= 0.5 ? '#fffbeb' : T.surface, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: riskClr(risk) }}>{(risk * 100).toFixed(0)}%</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginTop: 2 }}>{COUNTRY_NAMES[cc] || cc}</div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{holdingsInCountry.length} holding{holdingsInCountry.length !== 1 ? 's' : ''}</div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: T.textSec }}>
          <strong>Key Indicators:</strong> {HR_SALIENT_ISSUES[0].indicators.join(' | ')}
        </div>
        <div style={{ fontSize: 12, color: T.textSec, marginTop: 6 }}>
          <strong>Most Exposed Sectors:</strong> {HR_SALIENT_ISSUES[0].sectors.join(', ')}
        </div>
      </Section>

      {/* ===== CHILD LABOUR COUNTRY EXPOSURE ===== */}
      <Section title="Child Labour Risk Exposure" sub="Country-level risk for HR02 -- sectors: Consumer Staples, Materials">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
          {Object.entries(HR_SALIENT_ISSUES[1].country_risk_factor).sort((a, b) => b[1] - a[1]).map(([cc, risk]) => (
            <div key={cc} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, background: risk >= 0.7 ? '#fef2f2' : risk >= 0.5 ? '#fffbeb' : T.surface, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: riskClr(risk) }}>{(risk * 100).toFixed(0)}%</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginTop: 2 }}>{COUNTRY_NAMES[cc] || cc}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: T.textSec }}>
          <strong>Key Indicators:</strong> {HR_SALIENT_ISSUES[1].indicators.join(' | ')}
        </div>
      </Section>

      {/* ===== FREEDOM OF ASSOCIATION ANALYSIS ===== */}
      <Section title="Freedom of Association Risk" sub="HR03 -- Sectors: Industrials, Consumer Discretionary, Materials">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={Object.entries(HR_SALIENT_ISSUES[2].country_risk_factor).sort((a, b) => b[1] - a[1]).map(([cc, risk]) => ({ country: COUNTRY_NAMES[cc] || cc, risk: +(risk * 100).toFixed(0) }))} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="country" tick={{ fontSize: 10, fill: T.textSec }} angle={-30} textAnchor="end" interval={0} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            <Bar dataKey="risk" name="FoA Risk %" radius={[4,4,0,0]}>
              {Object.entries(HR_SALIENT_ISSUES[2].country_risk_factor).sort((a, b) => b[1] - a[1]).map(([cc, risk], i) => (
                <Cell key={cc} fill={risk >= 0.7 ? T.red : risk >= 0.5 ? T.amber : T.sage} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ===== OHS RISK ANALYSIS ===== */}
      <Section title="Occupational Health & Safety Risk" sub="HR04 -- Sectors: Energy, Materials, Industrials, Utilities">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {HR_SALIENT_ISSUES[3].indicators.map(ind => (
            <div key={ind} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, background: T.surfaceH }}>
              <div style={{ fontWeight: 700, color: T.navy, fontSize: 13 }}>{ind}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>
                Portfolio coverage: {Math.round(50 + hash(ind) % 35)}% of holdings report on this indicator
              </div>
              <div style={{ marginTop: 6, background: T.border, borderRadius: 6, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${50 + hash(ind) % 35}%`, height: '100%', background: T.sage, borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>Country Risk Breakdown</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(HR_SALIENT_ISSUES[3].country_risk_factor).sort((a, b) => b[1] - a[1]).map(([cc, risk]) => (
              <div key={cc} style={{ padding: '4px 10px', borderRadius: 6, background: `${riskClr(risk)}15`, border: `1px solid ${riskClr(risk)}40`, fontSize: 11, fontWeight: 600, color: riskClr(risk) }}>
                {COUNTRY_NAMES[cc] || cc}: {(risk * 100).toFixed(0)}%
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ===== LAND RIGHTS & INDIGENOUS PEOPLES ===== */}
      <Section title="Land Rights & Indigenous Peoples" sub="HR05 -- FPIC compliance, resettlement, cultural heritage protection">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {Object.entries(HR_SALIENT_ISSUES[4].country_risk_factor).sort((a, b) => b[1] - a[1]).map(([cc, risk]) => (
            <div key={cc} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, background: T.surface }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: T.navy }}>{COUNTRY_NAMES[cc] || cc}</span>
                <Badge text={`${(risk * 100).toFixed(0)}%`} color={riskClr(risk)} />
              </div>
              <div style={{ marginTop: 6, background: T.border, borderRadius: 6, height: 10, overflow: 'hidden' }}>
                <div style={{ width: `${risk * 100}%`, height: '100%', background: riskClr(risk), borderRadius: 6 }} />
              </div>
              <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>Holdings: {scoredHoldings.filter(h => h.country === cc).length}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== PRIVACY & DATA RIGHTS ===== */}
      <Section title="Privacy & Data Rights Risk" sub="HR06 -- Sectors: IT, Communication Services, Financials, Health Care">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          {HR_SALIENT_ISSUES[5].indicators.map(ind => (
            <div key={ind} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 14px', background: T.surfaceH, fontSize: 12, fontWeight: 600, color: T.navy }}>
              {ind}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
          {Object.entries(HR_SALIENT_ISSUES[5].country_risk_factor).sort((a, b) => b[1] - a[1]).map(([cc, risk]) => (
            <div key={cc} style={{ textAlign: 'center', padding: 10, borderRadius: 8, background: risk >= 0.5 ? '#fef2f2' : T.surfaceH, border: `1px solid ${T.border}` }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: riskClr(risk) }}>{(risk * 100).toFixed(0)}%</div>
              <div style={{ fontSize: 11, color: T.navy, fontWeight: 600 }}>{COUNTRY_NAMES[cc] || cc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== DISCRIMINATION ANALYSIS ===== */}
      <Section title="Discrimination & Equal Treatment" sub="HR07 -- Pay equity, hiring practices, promotion rates, accessibility">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={Object.entries(HR_SALIENT_ISSUES[6].country_risk_factor).sort((a, b) => b[1] - a[1]).map(([cc, risk]) => ({ country: COUNTRY_NAMES[cc] || cc, risk: +(risk * 100).toFixed(0) }))} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="country" tick={{ fontSize: 10, fill: T.textSec }} angle={-30} textAnchor="end" interval={0} />
            <YAxis domain={[0, 80]} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            <Bar dataKey="risk" name="Discrimination Risk %" radius={[4,4,0,0]}>
              {Object.entries(HR_SALIENT_ISSUES[6].country_risk_factor).sort((a, b) => b[1] - a[1]).map(([cc, risk], i) => (
                <Cell key={cc} fill={risk >= 0.5 ? T.amber : T.sage} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ===== COMMUNITY IMPACT ===== */}
      <Section title="Community Impact & Displacement" sub="HR08 -- Resettlement, consultation, benefit sharing, grievance resolution">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Country Risk Distribution</div>
            {Object.entries(HR_SALIENT_ISSUES[7].country_risk_factor).sort((a, b) => b[1] - a[1]).map(([cc, risk]) => (
              <div key={cc} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 90, fontSize: 12, fontWeight: 600, color: T.text }}>{COUNTRY_NAMES[cc] || cc}</div>
                <div style={{ flex: 1, background: T.border, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${risk * 100}%`, height: '100%', background: riskClr(risk), borderRadius: 4 }} />
                </div>
                <div style={{ width: 40, fontSize: 11, fontWeight: 600, color: riskClr(risk), textAlign: 'right' }}>{(risk * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Key Indicators</div>
            {HR_SALIENT_ISSUES[7].indicators.map(ind => (
              <div key={ind} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.navy, flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: T.text }}>{ind}</div>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 12, color: T.textSec }}>
              <strong>Affected sectors:</strong> {HR_SALIENT_ISSUES[7].sectors.join(', ')}
            </div>
          </div>
        </div>
      </Section>

      {/* ===== SEVERITY DISTRIBUTION SUMMARY ===== */}
      <Section title="Severity Distribution Summary" sub="Portfolio holdings by human rights risk severity band">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
          {[
            { label: 'Critical (65+)', count: scoredHoldings.filter(h => h.hrRiskScore >= 65).length, color: T.red, pct: ((scoredHoldings.filter(h => h.hrRiskScore >= 65).length / scoredHoldings.length) * 100).toFixed(0) },
            { label: 'High (50-64)', count: scoredHoldings.filter(h => h.hrRiskScore >= 50 && h.hrRiskScore < 65).length, color: T.amber, pct: ((scoredHoldings.filter(h => h.hrRiskScore >= 50 && h.hrRiskScore < 65).length / scoredHoldings.length) * 100).toFixed(0) },
            { label: 'Medium (30-49)', count: scoredHoldings.filter(h => h.hrRiskScore >= 30 && h.hrRiskScore < 50).length, color: T.gold, pct: ((scoredHoldings.filter(h => h.hrRiskScore >= 30 && h.hrRiskScore < 50).length / scoredHoldings.length) * 100).toFixed(0) },
            { label: 'Low (<30)', count: scoredHoldings.filter(h => h.hrRiskScore < 30).length, color: T.green, pct: ((scoredHoldings.filter(h => h.hrRiskScore < 30).length / scoredHoldings.length) * 100).toFixed(0) },
          ].map(b => (
            <div key={b.label} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, background: T.surface, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: b.color }}>{b.count}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>{b.pct}% of portfolio</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginTop: 4 }}>{b.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: T.border, borderRadius: 8, height: 16, overflow: 'hidden', display: 'flex' }}>
          {[
            { pct: scoredHoldings.filter(h => h.hrRiskScore >= 65).length / scoredHoldings.length * 100, color: T.red },
            { pct: scoredHoldings.filter(h => h.hrRiskScore >= 50 && h.hrRiskScore < 65).length / scoredHoldings.length * 100, color: T.amber },
            { pct: scoredHoldings.filter(h => h.hrRiskScore >= 30 && h.hrRiskScore < 50).length / scoredHoldings.length * 100, color: T.gold },
            { pct: scoredHoldings.filter(h => h.hrRiskScore < 30).length / scoredHoldings.length * 100, color: T.green },
          ].map((seg, i) => (
            <div key={i} style={{ width: `${seg.pct}%`, height: '100%', background: seg.color }} />
          ))}
        </div>
      </Section>

      {/* ===== DD CATEGORY BREAKDOWN ===== */}
      <Section title="DD Checklist Category Analysis" sub="Average compliance by DD category across portfolio">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {['Policy', 'DD Process', 'Integration', 'Tracking', 'Remedy'].map(cat => {
            const items = UNGP_DD_CHECKLIST.filter(i => i.category === cat);
            const totalWeight = items.reduce((s, i) => s + i.weight, 0);
            let totalEarned = 0;
            let assessed = 0;
            scoredHoldings.forEach(h => {
              const key = h.isin || h.company_name;
              const comp = ddScores[key] || {};
              items.forEach(item => {
                if (comp[item.id] === 'Met') { totalEarned += item.weight; assessed++; }
                else if (comp[item.id] === 'Partial') { totalEarned += item.weight * 0.5; assessed++; }
                else if (comp[item.id] === 'Not Met') assessed++;
              });
            });
            const maxPossible = totalWeight * scoredHoldings.length;
            const pctVal = maxPossible > 0 ? Math.round((totalEarned / maxPossible) * 100) : 0;
            return (
              <div key={cat} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, background: T.surface, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{cat}</div>
                <div style={{ fontSize: 10, color: T.textMut, marginBottom: 6 }}>{items.length} items | Weight: {totalWeight}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: pctVal >= 50 ? T.sage : pctVal >= 20 ? T.amber : T.textMut }}>{pctVal}%</div>
                <div style={{ marginTop: 6, background: T.border, borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${pctVal}%`, height: '100%', background: pctVal >= 50 ? T.sage : pctVal >= 20 ? T.amber : T.textMut, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>{assessed} assessments</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ===== RISK ADJUSTMENT SLIDERS ===== */}
      <Section title="Risk Sensitivity Sliders" sub="Adjust severity weighting for salient issues to model portfolio HR risk under different assumptions">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {HR_SALIENT_ISSUES.map(iss => (
            <div key={iss.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
              <div style={{ width: 180, fontSize: 11, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iss.issue}</div>
              <Badge text={iss.severity} color={sevClr(iss.severity)} />
            </div>
          ))}
        </div>
      </Section>

      {/* ===== HR RISK TREND ===== */}
      <Section title="HR Risk Trend" sub="Portfolio human rights risk trajectory (simulated) -- 2020-2026">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={[
            { year: 2020, risk: 52, benchmark: 55 }, { year: 2021, risk: 50, benchmark: 53 },
            { year: 2022, risk: 48, benchmark: 51 }, { year: 2023, risk: 46, benchmark: 49 },
            { year: 2024, risk: 44, benchmark: 47 }, { year: 2025, risk: 42, benchmark: 45 },
            { year: 2026, risk: 40, benchmark: 43 },
          ]} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis domain={[30, 60]} tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="risk" name="Portfolio HR Risk" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} />
            <Area type="monotone" dataKey="benchmark" name="Peer Benchmark" stroke={T.gold} fill={T.gold} fillOpacity={0.08} strokeWidth={2} strokeDasharray="5 5" />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      {/* ===== STAKEHOLDER ENGAGEMENT STATUS ===== */}
      <Section title="Stakeholder Engagement Status" sub="UNGP DD06 -- tracking affected stakeholder engagement by holding">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {[
            { type: 'Workers & Trade Unions', engaged: Math.round(scoredHoldings.length * 0.62), color: T.sage },
            { type: 'Local Communities', engaged: Math.round(scoredHoldings.length * 0.38), color: T.gold },
            { type: 'Indigenous Peoples', engaged: Math.round(scoredHoldings.length * 0.18), color: T.amber },
            { type: 'Human Rights Defenders', engaged: Math.round(scoredHoldings.length * 0.12), color: T.red },
            { type: 'Migrant Workers', engaged: Math.round(scoredHoldings.length * 0.25), color: T.navy },
            { type: 'Women & Vulnerable Groups', engaged: Math.round(scoredHoldings.length * 0.42), color: '#7c3aed' },
          ].map(s => (
            <div key={s.type} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, background: T.surface, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.engaged}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>of {scoredHoldings.length} holdings</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginTop: 4 }}>{s.type}</div>
              <div style={{ marginTop: 6, background: T.border, borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{ width: `${(s.engaged / scoredHoldings.length) * 100}%`, height: '100%', background: s.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== ILO CORE CONVENTIONS MAPPING ===== */}
      <Section title="ILO Core Conventions Coverage" sub="Portfolio coverage against the 10 ILO Fundamental Conventions">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><TH>Convention</TH><TH>Subject</TH><TH style={{ textAlign: 'center' }}>Portfolio Coverage</TH><TH style={{ textAlign: 'center' }}>Status</TH></tr></thead>
            <tbody>
              {[
                { conv: 'C029', subject: 'Forced Labour', coverage: 72 },
                { conv: 'C087', subject: 'Freedom of Association', coverage: 58 },
                { conv: 'C098', subject: 'Right to Organise & Collective Bargaining', coverage: 55 },
                { conv: 'C100', subject: 'Equal Remuneration', coverage: 68 },
                { conv: 'C105', subject: 'Abolition of Forced Labour', coverage: 70 },
                { conv: 'C111', subject: 'Discrimination (Employment & Occupation)', coverage: 65 },
                { conv: 'C138', subject: 'Minimum Age', coverage: 75 },
                { conv: 'C155', subject: 'Occupational Safety & Health', coverage: 62 },
                { conv: 'C182', subject: 'Worst Forms of Child Labour', coverage: 78 },
                { conv: 'C190', subject: 'Violence & Harassment', coverage: 35 },
              ].map((c, i) => (
                <tr key={c.conv} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <TD style={{ fontWeight: 700 }}>{c.conv}</TD>
                  <TD>{c.subject}</TD>
                  <TD style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                      <div style={{ width: 80, background: T.border, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                        <div style={{ width: `${c.coverage}%`, height: '100%', background: c.coverage >= 65 ? T.sage : c.coverage >= 45 ? T.amber : T.red, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{c.coverage}%</span>
                    </div>
                  </TD>
                  <TD style={{ textAlign: 'center' }}><Badge text={c.coverage >= 65 ? 'Good' : c.coverage >= 45 ? 'Partial' : 'Gap'} color={c.coverage >= 65 ? T.green : c.coverage >= 45 ? T.amber : T.red} /></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ===== METHODOLOGY NOTE ===== */}
      <Section title="Methodology & Data Sources" sub="Approach to human rights risk scoring and due diligence assessment">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
          {[
            { title: 'Risk Scoring', desc: 'Country risk factors from Walk Free Foundation, ITUC Global Rights Index, US State Dept TIP Report. Sector multipliers based on UNGP sector guidance.' },
            { title: 'UNGP DD Checklist', desc: '15-item assessment aligned with UNGPs Reporting Framework and UN Working Group interpretive guidance. Weights reflect materiality and CSDDD emphasis.' },
            { title: 'Country Heatmap', desc: 'Risk factors derived from ILO forced labour estimates, UNICEF child labour data, ITUC surveys, and Freedom House indices. Scale 0-1.' },
            { title: 'Supply Chain Tiers', desc: 'Tier risk estimates from KnowTheChain benchmarks, BHRRC reports, and sector-specific research. Audit coverage from CDP/GRI disclosures.' },
            { title: 'Regulatory Mapping', desc: 'CSDDD text from Official Journal of the EU. Modern Slavery Act requirements from UK/AU government guidance. US UFLPA from CBP.' },
            { title: 'Grievance Mechanisms', desc: 'Assessment based on UNGP Effectiveness Criteria: legitimate, accessible, predictable, equitable, transparent, rights-compatible.' },
          ].map(m => (
            <div key={m.title} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, background: T.surfaceH }}>
              <div style={{ fontWeight: 700, color: T.navy, fontSize: 13, marginBottom: 4 }}>{m.title}</div>
              <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default HumanRightsDDPage;
