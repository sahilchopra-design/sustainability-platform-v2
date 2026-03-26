import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#4f46e5','#0891b2','#7c3aed','#be185d','#d97706','#15803d','#1e40af','#9f1239','#059669'];

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const LS_PORT = 'ra_portfolio_v1';
const LS_GOV = 'ra_corporate_governance_v1';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const fmt = (n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';
const pct = (n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';
const seed = (s) => { let h = 5381; for (let i = 0; i < String(s).length; i++) h = ((h << 5) + h) ^ String(s).charCodeAt(i); return Math.abs(h); };
const sRand = (n) => { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ── Primitives ───────────────────────────────────────────────────────────── */
const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ background: T.surface, border: `1px solid ${accent ? T.gold : T.border}`, borderRadius: 10, padding: '16px 18px', borderLeft: `3px solid ${accent || T.gold}`, fontFamily: T.font }}>
    <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);
const Section = ({ title, badge, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${T.gold}` }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: T.navy, fontFamily: T.font }}>{title}</span>
      {badge && <span style={{ fontSize: 10, fontWeight: 600, background: T.surfaceH, color: T.textSec, padding: '2px 8px', borderRadius: 10, border: `1px solid ${T.border}` }}>{badge}</span>}
    </div>
    {children}
  </div>
);
const Btn = ({ children, onClick, active, small, color }) => (
  <button onClick={onClick} style={{ padding: small ? '5px 12px' : '8px 18px', borderRadius: 8, border: `1px solid ${active ? T.navy : T.border}`, cursor: 'pointer', background: active ? T.navy : color || T.surface, color: active ? '#fff' : T.navy, fontWeight: 600, fontSize: small ? 11 : 13, fontFamily: T.font, transition: 'all 0.15s' }}>{children}</button>
);
const Badge = ({ label, color }) => {
  const map = { green: { bg: '#dcfce7', text: '#166534' }, red: { bg: '#fee2e2', text: '#991b1b' }, amber: { bg: '#fef3c7', text: '#92400e' }, blue: { bg: '#dbeafe', text: '#1e40af' }, navy: { bg: '#e0e7ff', text: '#1b3a5c' }, gold: { bg: '#fef3c7', text: '#92400e' }, sage: { bg: '#dcfce7', text: '#166534' }, gray: { bg: '#f3f4f6', text: '#374151' }, purple: { bg: '#ede9fe', text: '#5b21b6' }, teal: { bg: '#ccfbf1', text: '#115e59' } };
  const c = map[color] || map.gray;
  return <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text }}>{label}</span>;
};
const tbl = { width: '100%', fontSize: 12, borderCollapse: 'collapse', fontFamily: T.font };
const thS = { border: `1px solid ${T.border}`, padding: '8px 10px', fontSize: 11, textAlign: 'left', fontWeight: 600, color: T.textSec, background: T.surfaceH, textTransform: 'uppercase', letterSpacing: 0.3, cursor: 'pointer', userSelect: 'none' };
const tdS = { border: `1px solid ${T.border}`, padding: '7px 10px', fontSize: 12, color: T.text };
const SortIcon = ({ col, sortCol, sortDir }) => col === sortCol ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

/* ═══════════════════════════════════════════════════════════════════════════
   GOVERNANCE FRAMEWORK — 8 DIMENSIONS, 40 INDICATORS
   ═══════════════════════════════════════════════════════════════════════════ */
const GOV_FRAMEWORK = {
  board_effectiveness: { label: 'Board Effectiveness', weight: 20, color: '#1b3a5c', indicators: [
    { id: 'G01', name: 'Board independence', description: '% independent non-executive directors', benchmark: 66, unit: '%', source: 'Annual report / Proxy statement' },
    { id: 'G02', name: 'CEO-Chair separation', description: 'Whether CEO and Board Chair are different people', benchmark: true, unit: 'Y/N', source: 'Corporate governance report' },
    { id: 'G03', name: 'Board size', description: 'Number of directors (optimal 8-12)', benchmark: 10, unit: 'count' },
    { id: 'G04', name: 'Board meeting attendance', description: 'Average attendance rate at board meetings', benchmark: 85, unit: '%' },
    { id: 'G05', name: 'Board skills matrix coverage', description: 'Coverage of 8 key competencies', benchmark: 75, unit: '%' },
  ]},
  shareholder_rights: { label: 'Shareholder Rights', weight: 15, color: '#2563eb', indicators: [
    { id: 'G06', name: 'One share one vote', description: 'No dual-class or weighted voting structures', benchmark: true, unit: 'Y/N' },
    { id: 'G07', name: 'Say-on-pay vote', description: 'Annual advisory vote on executive compensation', benchmark: true, unit: 'Y/N' },
    { id: 'G08', name: 'Shareholder proposal threshold', description: 'Minimum ownership to submit proposal', benchmark: 2, unit: '%' },
    { id: 'G09', name: 'Poison pill / takeover defense', description: 'Absence of anti-takeover mechanisms', benchmark: false, unit: 'Y/N' },
    { id: 'G10', name: 'Cumulative voting rights', description: 'Minority shareholders can concentrate votes', benchmark: true, unit: 'Y/N' },
  ]},
  transparency_disclosure: { label: 'Transparency & Disclosure', weight: 15, color: '#16a34a', indicators: [
    { id: 'G11', name: 'Financial reporting quality', description: 'Clean audit opinion, no restatements', benchmark: true, unit: 'Y/N' },
    { id: 'G12', name: 'Related party transactions', description: 'Full disclosure of RPTs with materiality threshold', benchmark: true, unit: 'Y/N' },
    { id: 'G13', name: 'Political donation disclosure', description: 'Transparency on political contributions', benchmark: true, unit: 'Y/N' },
    { id: 'G14', name: 'Lobbying expenditure disclosure', description: 'Disclosure of lobbying spend and targets', benchmark: true, unit: 'Y/N' },
    { id: 'G15', name: 'Tax strategy disclosure', description: 'Public country-by-country tax reporting', benchmark: true, unit: 'Y/N' },
  ]},
  anti_corruption: { label: 'Anti-Corruption', weight: 15, color: '#dc2626', indicators: [
    { id: 'G16', name: 'Anti-bribery policy', description: 'Board-approved anti-corruption policy', benchmark: true, unit: 'Y/N' },
    { id: 'G17', name: 'Whistleblower mechanism', description: 'Anonymous, accessible, non-retaliatory', benchmark: true, unit: 'Y/N' },
    { id: 'G18', name: 'Anti-corruption training', description: '% employees trained on anti-corruption', benchmark: 80, unit: '%' },
    { id: 'G19', name: 'Corruption incidents', description: 'Reported bribery/corruption cases (lower = better)', benchmark: 0, unit: 'count' },
    { id: 'G20', name: 'Sanctions compliance', description: 'No OFAC/EU/UN sanctions violations', benchmark: true, unit: 'Y/N' },
  ]},
  executive_compensation: { label: 'Executive Compensation', weight: 10, color: '#d97706', indicators: [
    { id: 'G21', name: 'CEO-to-median pay ratio', description: 'CEO total comp / median employee comp', benchmark: 150, unit: 'ratio' },
    { id: 'G22', name: 'ESG-linked compensation', description: '% of variable pay tied to ESG KPIs', benchmark: 20, unit: '%' },
    { id: 'G23', name: 'Clawback provisions', description: 'Ability to recover pay for misconduct/restatement', benchmark: true, unit: 'Y/N' },
    { id: 'G24', name: 'Share ownership requirements', description: 'Minimum shareholding for executives', benchmark: true, unit: 'Y/N' },
    { id: 'G25', name: 'Golden parachute', description: 'Absence of excessive severance packages', benchmark: false, unit: 'Y/N' },
  ]},
  audit_risk_oversight: { label: 'Audit & Risk Oversight', weight: 10, color: '#7c3aed', indicators: [
    { id: 'G26', name: 'Audit committee independence', description: '100% independent members', benchmark: 100, unit: '%' },
    { id: 'G27', name: 'Auditor rotation', description: 'External auditor rotated within 10 years', benchmark: true, unit: 'Y/N' },
    { id: 'G28', name: 'Risk committee', description: 'Separate risk committee at board level', benchmark: true, unit: 'Y/N' },
    { id: 'G29', name: 'Internal audit function', description: 'Independent internal audit with board reporting', benchmark: true, unit: 'Y/N' },
    { id: 'G30', name: 'Non-audit fees ratio', description: 'Non-audit fees < 50% of total auditor fees', benchmark: 50, unit: '%' },
  ]},
  data_privacy_cyber: { label: 'Data Privacy & Cyber', weight: 10, color: '#0d9488', indicators: [
    { id: 'G31', name: 'Data protection officer', description: 'Designated DPO role (GDPR requirement)', benchmark: true, unit: 'Y/N' },
    { id: 'G32', name: 'Data breaches (last 3yr)', description: 'Reported data breaches (lower = better)', benchmark: 0, unit: 'count' },
    { id: 'G33', name: 'Cybersecurity board oversight', description: 'Board-level cybersecurity committee or agenda item', benchmark: true, unit: 'Y/N' },
    { id: 'G34', name: 'ISO 27001 certification', description: 'Information security management certification', benchmark: true, unit: 'Y/N' },
    { id: 'G35', name: 'Cyber incident response plan', description: 'Documented and tested incident response', benchmark: true, unit: 'Y/N' },
  ]},
  tax_conduct: { label: 'Tax Conduct', weight: 5, color: '#991b1b', indicators: [
    { id: 'G36', name: 'Effective tax rate', description: 'ETR vs statutory rate (deviation < 10pp)', benchmark: true, unit: 'Y/N' },
    { id: 'G37', name: 'Tax haven subsidiaries', description: 'Subsidiaries in tax haven jurisdictions', benchmark: 0, unit: 'count' },
    { id: 'G38', name: 'Country-by-country reporting', description: 'GRI 207 / OECD BEPS compliance', benchmark: true, unit: 'Y/N' },
    { id: 'G39', name: 'Tax controversy', description: 'Ongoing tax disputes or investigations', benchmark: 0, unit: 'count' },
    { id: 'G40', name: 'Tax transparency rating', description: 'TJN Corporate Tax Transparency rating', benchmark: 'A', unit: 'grade' },
  ]},
};
const DIM_KEYS = Object.keys(GOV_FRAMEWORK);
const ALL_INDICATORS = DIM_KEYS.flatMap(dk => GOV_FRAMEWORK[dk].indicators);

/* ── Country Governance Context ───────────────────────────────────────────── */
const COUNTRY_GOVERNANCE = {
  IN: { cpi_score: 39, cpi_rank: 93, rule_of_law: 51, regulatory_quality: 48, control_of_corruption: 41, voice_accountability: 58, gov_effectiveness: 57, political_stability: 35, press_freedom: 36 },
  US: { cpi_score: 69, cpi_rank: 24, rule_of_law: 72, regulatory_quality: 85, control_of_corruption: 75, voice_accountability: 78, gov_effectiveness: 82, political_stability: 52, press_freedom: 55 },
  GB: { cpi_score: 73, cpi_rank: 20, rule_of_law: 85, regulatory_quality: 92, control_of_corruption: 82, voice_accountability: 88, gov_effectiveness: 88, political_stability: 62, press_freedom: 70 },
  DE: { cpi_score: 80, cpi_rank: 9, rule_of_law: 88, regulatory_quality: 90, control_of_corruption: 86, voice_accountability: 92, gov_effectiveness: 86, political_stability: 65, press_freedom: 82 },
  JP: { cpi_score: 73, cpi_rank: 16, rule_of_law: 82, regulatory_quality: 78, control_of_corruption: 80, voice_accountability: 72, gov_effectiveness: 85, political_stability: 78, press_freedom: 68 },
  FR: { cpi_score: 72, cpi_rank: 22, rule_of_law: 82, regulatory_quality: 78, control_of_corruption: 76, voice_accountability: 85, gov_effectiveness: 80, political_stability: 45, press_freedom: 78 },
  CN: { cpi_score: 42, cpi_rank: 76, rule_of_law: 45, regulatory_quality: 42, control_of_corruption: 48, voice_accountability: 8, gov_effectiveness: 68, political_stability: 40, press_freedom: 5 },
  BR: { cpi_score: 36, cpi_rank: 104, rule_of_law: 42, regulatory_quality: 45, control_of_corruption: 38, voice_accountability: 55, gov_effectiveness: 40, political_stability: 32, press_freedom: 48 },
  ZA: { cpi_score: 41, cpi_rank: 83, rule_of_law: 48, regulatory_quality: 55, control_of_corruption: 42, voice_accountability: 65, gov_effectiveness: 45, political_stability: 28, press_freedom: 62 },
  AU: { cpi_score: 75, cpi_rank: 14, rule_of_law: 88, regulatory_quality: 92, control_of_corruption: 85, voice_accountability: 90, gov_effectiveness: 88, political_stability: 72, press_freedom: 75 },
  SG: { cpi_score: 83, cpi_rank: 5, rule_of_law: 92, regulatory_quality: 98, control_of_corruption: 95, voice_accountability: 35, gov_effectiveness: 98, political_stability: 90, press_freedom: 22 },
  KR: { cpi_score: 63, cpi_rank: 33, rule_of_law: 78, regulatory_quality: 80, control_of_corruption: 68, voice_accountability: 72, gov_effectiveness: 82, political_stability: 52, press_freedom: 58 },
  CA: { cpi_score: 74, cpi_rank: 15, rule_of_law: 88, regulatory_quality: 90, control_of_corruption: 82, voice_accountability: 92, gov_effectiveness: 85, political_stability: 70, press_freedom: 75 },
  HK: { cpi_score: 75, cpi_rank: 14, rule_of_law: 82, regulatory_quality: 95, control_of_corruption: 85, voice_accountability: 32, gov_effectiveness: 92, political_stability: 55, press_freedom: 18 },
};
const COUNTRY_LABELS = { IN:'India', US:'USA', GB:'UK', DE:'Germany', JP:'Japan', FR:'France', CN:'China', BR:'Brazil', ZA:'South Africa', AU:'Australia', SG:'Singapore', KR:'South Korea', CA:'Canada', HK:'Hong Kong' };

/* ── Regulatory Map ───────────────────────────────────────────────────────── */
const GOV_REGULATIONS = [
  { code: 'UK_CGC', name: 'UK Corporate Governance Code', countries: ['GB'], focus: 'Board effectiveness, comply-or-explain', mandatory: true },
  { code: 'SOX', name: 'Sarbanes-Oxley Act', countries: ['US'], focus: 'Audit, internal controls, CEO/CFO certification', mandatory: true },
  { code: 'SEBI_LODR', name: 'SEBI Listing Obligations', countries: ['IN'], focus: 'Board composition, RPTs, audit committee', mandatory: true },
  { code: 'KING_IV', name: 'King IV Report', countries: ['ZA'], focus: 'Integrated governance, stakeholder inclusivity', mandatory: true },
  { code: 'DCGK', name: 'German Corporate Governance Code', countries: ['DE'], focus: 'Supervisory board, management board, transparency', mandatory: false },
  { code: 'AFEP_MEDEF', name: 'AFEP-MEDEF Code', countries: ['FR'], focus: 'Executive compensation, board diversity, independence', mandatory: false },
  { code: 'JP_CGC', name: 'Japan Corporate Governance Code', countries: ['JP'], focus: 'Cross-shareholding, board independence, dialogue', mandatory: true },
  { code: 'ASX_CGC', name: 'ASX Corporate Governance Principles', countries: ['AU'], focus: 'Board structure, risk management, remuneration', mandatory: false },
  { code: 'SGX_CGC', name: 'Singapore Code of Corporate Governance', countries: ['SG'], focus: 'Board independence, remuneration, risk management', mandatory: false },
];

/* ── Sector governance baseline adjustments ────────────────────────────────── */
const SECTOR_GOV_BASELINE = {
  'Financials': { board_effectiveness: 72, shareholder_rights: 68, transparency_disclosure: 75, anti_corruption: 70, executive_compensation: 55, audit_risk_oversight: 78, data_privacy_cyber: 65, tax_conduct: 60 },
  'Information Technology': { board_effectiveness: 65, shareholder_rights: 55, transparency_disclosure: 68, anti_corruption: 62, executive_compensation: 48, audit_risk_oversight: 60, data_privacy_cyber: 72, tax_conduct: 50 },
  'Energy': { board_effectiveness: 68, shareholder_rights: 62, transparency_disclosure: 60, anti_corruption: 58, executive_compensation: 52, audit_risk_oversight: 65, data_privacy_cyber: 48, tax_conduct: 45 },
  'Health Care': { board_effectiveness: 70, shareholder_rights: 65, transparency_disclosure: 72, anti_corruption: 68, executive_compensation: 50, audit_risk_oversight: 70, data_privacy_cyber: 70, tax_conduct: 55 },
  'Consumer Discretionary': { board_effectiveness: 62, shareholder_rights: 60, transparency_disclosure: 58, anti_corruption: 55, executive_compensation: 52, audit_risk_oversight: 58, data_privacy_cyber: 55, tax_conduct: 50 },
  'Consumer Staples': { board_effectiveness: 65, shareholder_rights: 62, transparency_disclosure: 60, anti_corruption: 60, executive_compensation: 55, audit_risk_oversight: 62, data_privacy_cyber: 52, tax_conduct: 55 },
  'Industrials': { board_effectiveness: 64, shareholder_rights: 60, transparency_disclosure: 58, anti_corruption: 56, executive_compensation: 54, audit_risk_oversight: 60, data_privacy_cyber: 48, tax_conduct: 52 },
  'Materials': { board_effectiveness: 60, shareholder_rights: 58, transparency_disclosure: 55, anti_corruption: 52, executive_compensation: 55, audit_risk_oversight: 58, data_privacy_cyber: 42, tax_conduct: 48 },
  'Utilities': { board_effectiveness: 68, shareholder_rights: 65, transparency_disclosure: 62, anti_corruption: 60, executive_compensation: 58, audit_risk_oversight: 65, data_privacy_cyber: 50, tax_conduct: 55 },
  'Real Estate': { board_effectiveness: 58, shareholder_rights: 55, transparency_disclosure: 52, anti_corruption: 50, executive_compensation: 50, audit_risk_oversight: 55, data_privacy_cyber: 42, tax_conduct: 48 },
  'Communication Services': { board_effectiveness: 62, shareholder_rights: 58, transparency_disclosure: 60, anti_corruption: 55, executive_compensation: 48, audit_risk_oversight: 58, data_privacy_cyber: 68, tax_conduct: 48 },
};
const DEFAULT_SECTOR = { board_effectiveness: 60, shareholder_rights: 58, transparency_disclosure: 55, anti_corruption: 52, executive_compensation: 50, audit_risk_oversight: 55, data_privacy_cyber: 50, tax_conduct: 48 };

/* ═══════════════════════════════════════════════════════════════════════════
   ENTITY ENRICHMENT — Governance scoring per holding
   ═══════════════════════════════════════════════════════════════════════════ */
function enrichGov(c, idx) {
  const s = seed(c.company_name || idx);
  const cc = c.countryCode || 'IN';
  const cg = COUNTRY_GOVERNANCE[cc] || COUNTRY_GOVERNANCE.IN;
  const sectorBase = SECTOR_GOV_BASELINE[c.sector] || DEFAULT_SECTOR;
  const esgBoost = ((c.esg_score || 50) - 50) * 0.3;
  const countryBoost = ((cg.cpi_score || 50) - 50) * 0.25;
  const dims = {};
  DIM_KEYS.forEach((dk, di) => {
    const base = sectorBase[dk] || 55;
    const noise = (sRand(s + di * 7) - 0.5) * 18;
    dims[dk] = clamp(Math.round(base + esgBoost + countryBoost + noise), 10, 98);
  });
  const overall = DIM_KEYS.reduce((acc, dk) => acc + dims[dk] * (GOV_FRAMEWORK[dk].weight / 100), 0);
  const worstDim = DIM_KEYS.reduce((w, dk) => dims[dk] < dims[w] ? dk : w, DIM_KEYS[0]);
  const boardIndep = clamp(Math.round(40 + sRand(s + 100) * 40), 20, 95);
  const ceoChairSplit = sRand(s + 101) > 0.35;
  const esgLinkedComp = clamp(Math.round(sRand(s + 102) * 35), 0, 40);
  const whistleblower = sRand(s + 103) > 0.2;
  const dataBreaches = Math.floor(sRand(s + 104) * 4);
  const taxHavens = Math.floor(sRand(s + 105) * 6);
  const corruptionIncidents = Math.floor(sRand(s + 106) * 3);
  const dualClass = sRand(s + 107) > 0.75;
  const poisonPill = sRand(s + 108) > 0.8;
  const sayOnPay = sRand(s + 109) > 0.25;
  const clawback = sRand(s + 110) > 0.3;
  const auditIndep = clamp(Math.round(60 + sRand(s + 111) * 40), 50, 100);
  const antiCorruptTrain = clamp(Math.round(30 + sRand(s + 112) * 60), 15, 98);
  const cyberOversight = sRand(s + 113) > 0.35;
  const taxTransp = sRand(s + 114) > 0.4;
  const ceoPayRatio = Math.round(30 + sRand(s + 115) * 350);
  return {
    ...c, dims, overall: Math.round(overall * 10) / 10, worstDim, boardIndep, ceoChairSplit, esgLinkedComp,
    whistleblower, dataBreaches, taxHavens, corruptionIncidents, dualClass, poisonPill, sayOnPay,
    clawback, auditIndep, antiCorruptTrain, cyberOversight, taxTransp, ceoPayRatio,
    country_gov: cg, countryCode: cc,
    market_cap: c.market_cap_usd_mn || Math.round(100 + sRand(s + 9) * 50000),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function CorporateGovernancePage() {
  const navigate = useNavigate();
  const portfolioRaw = useMemo(() => {
    const saved = localStorage.getItem('ra_portfolio_v1');
    const data = saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
    return data.portfolios?.[data.activePortfolio]?.holdings || [];
  }, []);
  const [sortCol, setSortCol] = useState('overall');
  const [sortDir, setSortDir] = useState('desc');
  const [activeDim, setActiveDim] = useState(null);
  const [govOverrides, setGovOverrides] = useState(() => loadLS(LS_GOV) || {});
  const [editCompany, setEditCompany] = useState(null);
  const [scenarioSlider, setScenarioSlider] = useState(50);

  useEffect(() => { saveLS(LS_GOV, govOverrides); }, [govOverrides]);

  /* ── Build holdings ──────────────────────────────────────────────────────── */
  const holdings = useMemo(() => {
    if (!portfolioRaw.length) return GLOBAL_COMPANY_MASTER.slice(0, 40).map((c, i) => enrichGov(c, i));
    const lookup = {};
    GLOBAL_COMPANY_MASTER.forEach(c => { const k = (c.company_name || '').toLowerCase(); lookup[k] = c; });
    return portfolioRaw.map((h, i) => {
      const master = lookup[(h.company || '').toLowerCase()] || {};
      return enrichGov({ ...master, ...h, company_name: h.company || master.company_name, sector: h.sector || master.sector, countryCode: h.countryCode || master.countryCode || 'IN', esg_score: h.esg_score || master.esg_score || 50, weight: h.weight }, i);
    });
  }, [portfolioRaw]);

  /* ── Aggregates ──────────────────────────────────────────────────────────── */
  const agg = useMemo(() => {
    const totalW = holdings.reduce((s, h) => s + (h.weight || 1), 0) || 1;
    const wAvg = (fn) => holdings.reduce((s, h) => s + fn(h) * (h.weight || 1), 0) / totalW;
    const dimAvgs = {};
    DIM_KEYS.forEach(dk => { dimAvgs[dk] = Math.round(wAvg(h => h.dims[dk]) * 10) / 10; });
    const portGovScore = Math.round(wAvg(h => h.overall) * 10) / 10;
    const boardIndepAvg = Math.round(wAvg(h => h.boardIndep) * 10) / 10;
    const ceoChairPct = Math.round((holdings.filter(h => h.ceoChairSplit).length / holdings.length) * 100);
    const antiCorruptCov = Math.round(wAvg(h => h.antiCorruptTrain) * 10) / 10;
    const esgLinkedAvg = Math.round(wAvg(h => h.esgLinkedComp) * 10) / 10;
    const whistleblowerCov = Math.round((holdings.filter(h => h.whistleblower).length / holdings.length) * 100);
    const taxTranspPct = Math.round((holdings.filter(h => h.taxTransp).length / holdings.length) * 100);
    const cyberOversightPct = Math.round((holdings.filter(h => h.cyberOversight).length / holdings.length) * 100);
    const totalBreaches = holdings.reduce((s, h) => s + h.dataBreaches, 0);
    const auditIndepAvg = Math.round(wAvg(h => h.auditIndep) * 10) / 10;
    const shareholderScore = Math.round(wAvg(h => h.dims.shareholder_rights) * 10) / 10;
    const countries = [...new Set(holdings.map(h => h.countryCode))];
    const countryGovAvg = countries.length ? Math.round(countries.reduce((s, cc) => s + ((COUNTRY_GOVERNANCE[cc] || {}).cpi_score || 50), 0) / countries.length) : 50;
    return { portGovScore, boardIndepAvg, ceoChairPct, antiCorruptCov, esgLinkedAvg, whistleblowerCov, taxTranspPct, cyberOversightPct, totalBreaches, auditIndepAvg, shareholderScore, countryGovAvg, dimAvgs, countries };
  }, [holdings]);

  /* ── Radar data ──────────────────────────────────────────────────────────── */
  const radarData = useMemo(() => DIM_KEYS.map(dk => ({ dim: GOV_FRAMEWORK[dk].label, score: agg.dimAvgs[dk], benchmark: 65 })), [agg]);

  /* ── Country CPI chart data ──────────────────────────────────────────────── */
  const cpiData = useMemo(() => agg.countries.map(cc => ({
    country: COUNTRY_LABELS[cc] || cc, cpi: (COUNTRY_GOVERNANCE[cc] || {}).cpi_score || 0, fill: (COUNTRY_GOVERNANCE[cc] || {}).cpi_score >= 60 ? T.green : (COUNTRY_GOVERNANCE[cc] || {}).cpi_score >= 40 ? T.amber : T.red,
  })).sort((a, b) => b.cpi - a.cpi), [agg]);

  /* ── Red flags ───────────────────────────────────────────────────────────── */
  const redFlags = useMemo(() => holdings.filter(h => !h.ceoChairSplit || h.dualClass || h.corruptionIncidents > 0 || h.taxHavens > 2 || h.dataBreaches > 1).map(h => {
    const flags = [];
    if (!h.ceoChairSplit) flags.push('No CEO-Chair split');
    if (h.dualClass) flags.push('Dual-class shares');
    if (h.corruptionIncidents > 0) flags.push(`${h.corruptionIncidents} corruption incident(s)`);
    if (h.taxHavens > 2) flags.push(`${h.taxHavens} tax haven subsidiaries`);
    if (h.dataBreaches > 1) flags.push(`${h.dataBreaches} data breaches`);
    return { ...h, flags };
  }), [holdings]);

  /* ── Sector benchmarks ────────────────────────────────────────────────────── */
  const sectorBench = useMemo(() => {
    const sectors = [...new Set(holdings.map(h => h.sector).filter(Boolean))];
    return sectors.map(sec => {
      const sh = holdings.filter(h => h.sector === sec);
      const avg = Math.round(sh.reduce((s, h) => s + h.overall, 0) / sh.length * 10) / 10;
      const base = SECTOR_GOV_BASELINE[sec] || DEFAULT_SECTOR;
      return { sector: sec, avgScore: avg, benchmark: Math.round(Object.values(base).reduce((a, b) => a + b, 0) / 8), count: sh.length };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [holdings]);

  /* ── Sort handler ────────────────────────────────────────────────────────── */
  const toggleSort = useCallback((col) => {
    setSortCol(prev => { if (prev === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return col; } setSortDir('desc'); return col; });
  }, []);
  const sorted = useMemo(() => [...holdings].sort((a, b) => {
    const av = typeof a[sortCol] === 'number' ? a[sortCol] : (a.dims || {})[sortCol] || 0;
    const bv = typeof b[sortCol] === 'number' ? b[sortCol] : (b.dims || {})[sortCol] || 0;
    return sortDir === 'asc' ? av - bv : bv - av;
  }), [holdings, sortCol, sortDir]);

  /* ── Exports ─────────────────────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const hdr = ['Company', 'Sector', 'Country', 'Overall', ...DIM_KEYS.map(dk => GOV_FRAMEWORK[dk].label), 'Board Indep %', 'CEO-Chair Split', 'ESG Comp %', 'Whistleblower', 'Data Breaches', 'Tax Havens'];
    const rows = sorted.map(h => [h.company_name, h.sector, h.countryCode, h.overall, ...DIM_KEYS.map(dk => h.dims[dk]), h.boardIndep, h.ceoChairSplit ? 'Y' : 'N', h.esgLinkedComp, h.whistleblower ? 'Y' : 'N', h.dataBreaches, h.taxHavens]);
    const csv = [hdr, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'governance_report.csv'; a.click();
  }, [sorted]);
  const exportJSON = useCallback(() => {
    const data = sorted.map(h => ({ company: h.company_name, sector: h.sector, country: h.countryCode, overall: h.overall, dimensions: h.dims, indicators: { boardIndep: h.boardIndep, ceoChairSplit: h.ceoChairSplit, esgLinkedComp: h.esgLinkedComp, whistleblower: h.whistleblower, dataBreaches: h.dataBreaches, taxHavens: h.taxHavens, corruptionIncidents: h.corruptionIncidents, auditIndep: h.auditIndep } }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'governance_indicators.json'; a.click();
  }, [sorted]);
  const printPage = useCallback(() => window.print(), []);

  /* ── Engagement recommendations ─────────────────────────────────────────── */
  const engagements = useMemo(() => {
    const recs = [];
    holdings.filter(h => !h.ceoChairSplit).slice(0, 5).forEach(h => recs.push({ company: h.company_name, priority: 'High', topic: 'Board Leadership', action: 'Engage on CEO-Chair separation' }));
    holdings.filter(h => h.esgLinkedComp < 10).slice(0, 5).forEach(h => recs.push({ company: h.company_name, priority: 'Medium', topic: 'Compensation', action: 'Advocate for ESG-linked executive pay (>20% target)' }));
    holdings.filter(h => h.dataBreaches > 1).slice(0, 3).forEach(h => recs.push({ company: h.company_name, priority: 'High', topic: 'Cybersecurity', action: `Address ${h.dataBreaches} data breaches — request remediation plan` }));
    holdings.filter(h => h.taxHavens > 2).slice(0, 3).forEach(h => recs.push({ company: h.company_name, priority: 'Medium', topic: 'Tax Conduct', action: `Review ${h.taxHavens} tax haven subsidiaries — request CbCR` }));
    holdings.filter(h => !h.whistleblower).slice(0, 3).forEach(h => recs.push({ company: h.company_name, priority: 'High', topic: 'Anti-Corruption', action: 'Establish anonymous whistleblower mechanism' }));
    return recs.slice(0, 15);
  }, [holdings]);

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  if (!holdings.length && !GLOBAL_COMPANY_MASTER.length) return (
    <div style={{padding:48,textAlign:'center'}}>
      <div style={{fontSize:48,marginBottom:16}}>🛡️</div>
      <div style={{fontSize:18,fontWeight:700,color:T.navy}}>No Company Data Available</div>
      <div style={{color:T.textSec,marginTop:8}}>Build a portfolio to see governance analysis</div>
      <button onClick={()=>navigate('/portfolio-manager')} style={{marginTop:16,padding:'8px 24px',background:T.navy,color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}}>Go to Portfolio Manager</button>
    </div>
  );

  return (
    <div style={{ padding: '24px 32px', background: T.bg, minHeight: '100vh', fontFamily: T.font }}>
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Corporate Governance Evaluator</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Badge label="8 Dimensions" color="navy" /><Badge label="40 Indicators" color="gold" /><Badge label="CPI" color="sage" /><Badge label="WGI" color="blue" /><Badge label="TI" color="purple" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn small onClick={exportCSV}>Export CSV</Btn><Btn small onClick={exportJSON}>Export JSON</Btn><Btn small onClick={printPage}>Print</Btn>
        </div>
      </div>

      {/* ── KPI CARDS ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(185px,1fr))', gap: 12, marginBottom: 24 }}>
        <KpiCard label="Portfolio Gov Score" value={fmt(agg.portGovScore)} sub="Weighted average /100" accent={T.navy} />
        <KpiCard label="Board Independence" value={pct(agg.boardIndepAvg)} sub="Avg % independent directors" accent="#2563eb" />
        <KpiCard label="CEO-Chair Split" value={`${agg.ceoChairPct}%`} sub="Holdings with separation" accent={T.green} />
        <KpiCard label="Anti-Corruption Train." value={pct(agg.antiCorruptCov)} sub="Avg employee coverage" accent={T.red} />
        <KpiCard label="ESG-Linked Comp" value={pct(agg.esgLinkedAvg)} sub="Avg variable pay tied to ESG" accent={T.amber} />
        <KpiCard label="Whistleblower Coverage" value={`${agg.whistleblowerCov}%`} sub="Holdings with mechanism" accent="#7c3aed" />
        <KpiCard label="Tax Transparency" value={`${agg.taxTranspPct}%`} sub="CbCR compliant" accent="#991b1b" />
        <KpiCard label="Cyber Oversight" value={`${agg.cyberOversightPct}%`} sub="Board-level cyber agenda" accent="#0d9488" />
        <KpiCard label="Data Breaches" value={agg.totalBreaches} sub="Total across portfolio" accent={agg.totalBreaches > 5 ? T.red : T.green} />
        <KpiCard label="Audit Independence" value={pct(agg.auditIndepAvg)} sub="Avg audit cttee independence" accent="#7c3aed" />
        <KpiCard label="Shareholder Rights" value={fmt(agg.shareholderScore)} sub="Dimension score /100" accent="#2563eb" />
        <KpiCard label="Country Gov Avg" value={fmt(agg.countryGovAvg)} sub="CPI average of portfolio" accent={T.gold} />
      </div>

      {/* ── RADAR CHART — 8 DIMENSIONS ──────────────────────────────────────── */}
      <Section title="Governance Dimension Radar" badge="Portfolio-Weighted">
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16 }}>
          <ResponsiveContainer width="100%" height={380}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.borderL} />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11, fill: T.textSec }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="Portfolio" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.25} />
              <Radar name="Benchmark" dataKey="benchmark" stroke={T.gold} fill={T.gold} fillOpacity={0.1} strokeDasharray="4 4" />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── INDICATOR HEATMAP ───────────────────────────────────────────────── */}
      <Section title="Governance Indicator Heatmap" badge={`${holdings.length} Holdings x 40 Indicators`}>
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16, overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={{ ...thS, position: 'sticky', left: 0, zIndex: 2, background: T.surfaceH, minWidth: 140 }}>Company</th>
                {DIM_KEYS.map(dk => (
                  <th key={dk} colSpan={5} style={{ ...thS, background: GOV_FRAMEWORK[dk].color + '15', color: GOV_FRAMEWORK[dk].color, textAlign: 'center', fontSize: 10 }}>{GOV_FRAMEWORK[dk].label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 25).map((h, ri) => {
                const s = seed(h.company_name || ri);
                return (
                  <tr key={ri}>
                    <td style={{ ...tdS, position: 'sticky', left: 0, zIndex: 1, background: T.surface, fontWeight: 600, fontSize: 11 }}>{(h.company_name || '').slice(0, 20)}</td>
                    {DIM_KEYS.flatMap((dk, di) =>
                      GOV_FRAMEWORK[dk].indicators.map((ind, ii) => {
                        const val = clamp(Math.round(h.dims[dk] + (sRand(s + di * 5 + ii) - 0.5) * 20), 10, 100);
                        const bg = val >= 70 ? '#dcfce7' : val >= 50 ? '#fef3c7' : '#fee2e2';
                        const tc = val >= 70 ? '#166534' : val >= 50 ? '#92400e' : '#991b1b';
                        return <td key={`${dk}-${ii}`} style={{ ...tdS, background: bg, color: tc, textAlign: 'center', fontSize: 10, padding: '4px 3px', minWidth: 28 }} title={`${ind.name}: ${val}`}>{val}</td>;
                      })
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── DIMENSION DEEP-DIVE ──────────────────────────────────────────────── */}
      <Section title="Dimension Deep-Dive" badge="Click to expand">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {DIM_KEYS.map(dk => (
            <Btn key={dk} small active={activeDim === dk} onClick={() => setActiveDim(activeDim === dk ? null : dk)}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: GOV_FRAMEWORK[dk].color, marginRight: 6 }} />{GOV_FRAMEWORK[dk].label}
            </Btn>
          ))}
        </div>
        {activeDim && (
          <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${GOV_FRAMEWORK[activeDim].color}40`, padding: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: GOV_FRAMEWORK[activeDim].color, marginBottom: 12 }}>{GOV_FRAMEWORK[activeDim].label} — Weight: {GOV_FRAMEWORK[activeDim].weight}%</div>
            <table style={tbl}>
              <thead><tr><th style={thS}>ID</th><th style={thS}>Indicator</th><th style={thS}>Description</th><th style={thS}>Benchmark</th><th style={thS}>Portfolio Avg</th><th style={thS}>Status</th></tr></thead>
              <tbody>
                {GOV_FRAMEWORK[activeDim].indicators.map((ind, ii) => {
                  const avg = Math.round(holdings.reduce((s, h) => s + clamp(h.dims[activeDim] + (sRand(seed(h.company_name) + ii) - 0.5) * 15, 10, 100), 0) / holdings.length);
                  const met = typeof ind.benchmark === 'boolean' ? avg >= 65 : avg >= (typeof ind.benchmark === 'number' ? ind.benchmark * 0.8 : 60);
                  return (
                    <tr key={ind.id}>
                      <td style={tdS}><Badge label={ind.id} color="navy" /></td>
                      <td style={{ ...tdS, fontWeight: 600 }}>{ind.name}</td>
                      <td style={{ ...tdS, fontSize: 11, color: T.textSec }}>{ind.description}</td>
                      <td style={{ ...tdS, textAlign: 'center' }}>{String(ind.benchmark)} {ind.unit}</td>
                      <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{avg}</td>
                      <td style={tdS}><Badge label={met ? 'Met' : 'Gap'} color={met ? 'green' : 'red'} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── COUNTRY GOVERNANCE CONTEXT ──────────────────────────────────────── */}
      <Section title="Country Governance Context" badge="CPI / WGI">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cpiData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="country" tick={{ fontSize: 11 }} width={75} />
                <Tooltip />
                <Bar dataKey="cpi" name="CPI Score" radius={[0, 4, 4, 0]}>
                  {cpiData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
                <ReferenceLine x={50} stroke={T.textMut} strokeDasharray="3 3" label={{ value: 'Median', position: 'top', fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16, overflowX: 'auto' }}>
            <table style={tbl}>
              <thead><tr><th style={thS}>Country</th><th style={thS}>CPI</th><th style={thS}>Rank</th><th style={thS}>Rule of Law</th><th style={thS}>Reg Quality</th><th style={thS}>Corruption Ctrl</th><th style={thS}>Gov Eff.</th></tr></thead>
              <tbody>
                {agg.countries.map(cc => {
                  const cg = COUNTRY_GOVERNANCE[cc] || {};
                  return (
                    <tr key={cc}>
                      <td style={{ ...tdS, fontWeight: 600 }}>{COUNTRY_LABELS[cc] || cc}</td>
                      <td style={{ ...tdS, textAlign: 'center', fontWeight: 600, color: cg.cpi_score >= 60 ? T.green : cg.cpi_score >= 40 ? T.amber : T.red }}>{cg.cpi_score}</td>
                      <td style={{ ...tdS, textAlign: 'center' }}>{cg.cpi_rank}</td>
                      <td style={{ ...tdS, textAlign: 'center' }}>{cg.rule_of_law}</td>
                      <td style={{ ...tdS, textAlign: 'center' }}>{cg.regulatory_quality}</td>
                      <td style={{ ...tdS, textAlign: 'center' }}>{cg.control_of_corruption}</td>
                      <td style={{ ...tdS, textAlign: 'center' }}>{cg.gov_effectiveness}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* ── HOLDINGS TABLE (SORTABLE) ──────────────────────────────────────── */}
      <Section title="Holdings Governance Table" badge={`${holdings.length} Holdings`}>
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16, overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={thS} onClick={() => toggleSort('company_name')}>Company{SortIcon({ col: 'company_name', sortCol, sortDir })}</th>
                <th style={thS}>Sector</th>
                <th style={thS}>Country</th>
                <th style={thS} onClick={() => toggleSort('overall')}>Overall{SortIcon({ col: 'overall', sortCol, sortDir })}</th>
                {DIM_KEYS.map(dk => (
                  <th key={dk} style={{ ...thS, background: GOV_FRAMEWORK[dk].color + '10', fontSize: 10 }} onClick={() => toggleSort(dk)}>{GOV_FRAMEWORK[dk].label.slice(0, 12)}{SortIcon({ col: dk, sortCol, sortDir })}</th>
                ))}
                <th style={thS}>Worst Dim</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((h, i) => (
                <tr key={i} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={{ ...tdS, fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.company_name}</td>
                  <td style={{ ...tdS, fontSize: 11 }}>{h.sector}</td>
                  <td style={{ ...tdS, textAlign: 'center' }}>{h.countryCode}</td>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 700, color: h.overall >= 65 ? T.green : h.overall >= 45 ? T.amber : T.red }}>{h.overall}</td>
                  {DIM_KEYS.map(dk => (
                    <td key={dk} style={{ ...tdS, textAlign: 'center', fontSize: 11, color: h.dims[dk] >= 65 ? T.green : h.dims[dk] >= 45 ? T.amber : T.red }}>{h.dims[dk]}</td>
                  ))}
                  <td style={tdS}><Badge label={GOV_FRAMEWORK[h.worstDim]?.label?.slice(0, 14) || ''} color="red" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── RED FLAGS ───────────────────────────────────────────────────────── */}
      <Section title="Governance Red Flags" badge={`${redFlags.length} Holdings`}>
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.red}30`, padding: 16 }}>
          {redFlags.length === 0 ? <div style={{ color: T.green, fontWeight: 600 }}>No governance red flags detected</div> : (
            <table style={tbl}>
              <thead><tr><th style={thS}>Company</th><th style={thS}>Sector</th><th style={thS}>Country</th><th style={thS}>Overall</th><th style={thS}>Red Flags</th></tr></thead>
              <tbody>
                {redFlags.slice(0, 20).map((h, i) => (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{h.company_name}</td>
                    <td style={{ ...tdS, fontSize: 11 }}>{h.sector}</td>
                    <td style={tdS}>{h.countryCode}</td>
                    <td style={{ ...tdS, textAlign: 'center', color: T.red, fontWeight: 600 }}>{h.overall}</td>
                    <td style={tdS}><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{h.flags.map((f, fi) => <Badge key={fi} label={f} color="red" />)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Section>

      {/* ── SECTOR GOVERNANCE BENCHMARKS ────────────────────────────────────── */}
      <Section title="Sector Governance Benchmarks" badge={`${sectorBench.length} Sectors`}>
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sectorBench} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="sector" tick={{ fontSize: 10, angle: -25 }} height={60} interval={0} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgScore" name="Portfolio Avg" fill={T.navy} radius={[4, 4, 0, 0]} />
              <Bar dataKey="benchmark" name="Sector Benchmark" fill={T.gold} radius={[4, 4, 0, 0]} />
              <ReferenceLine y={65} stroke={T.green} strokeDasharray="3 3" label={{ value: 'Target', fontSize: 10 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── ANTI-CORRUPTION DEEP-DIVE ──────────────────────────────────────── */}
      <Section title="Anti-Corruption Deep-Dive" badge="CPI x Sector Risk">
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16, overflowX: 'auto' }}>
          <table style={tbl}>
            <thead><tr><th style={thS}>Company</th><th style={thS}>Country</th><th style={thS}>CPI</th><th style={thS}>Anti-Corrupt Score</th><th style={thS}>Training %</th><th style={thS}>Whistleblower</th><th style={thS}>Incidents</th><th style={thS}>Risk Level</th></tr></thead>
            <tbody>
              {sorted.slice(0, 20).map((h, i) => {
                const cpi = (COUNTRY_GOVERNANCE[h.countryCode] || {}).cpi_score || 50;
                const risk = cpi < 40 && h.dims.anti_corruption < 55 ? 'High' : cpi < 60 && h.dims.anti_corruption < 65 ? 'Medium' : 'Low';
                return (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 600, fontSize: 11 }}>{(h.company_name || '').slice(0, 25)}</td>
                    <td style={tdS}>{COUNTRY_LABELS[h.countryCode] || h.countryCode}</td>
                    <td style={{ ...tdS, textAlign: 'center', color: cpi >= 60 ? T.green : cpi >= 40 ? T.amber : T.red }}>{cpi}</td>
                    <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{h.dims.anti_corruption}</td>
                    <td style={{ ...tdS, textAlign: 'center' }}>{h.antiCorruptTrain}%</td>
                    <td style={tdS}><Badge label={h.whistleblower ? 'Yes' : 'No'} color={h.whistleblower ? 'green' : 'red'} /></td>
                    <td style={{ ...tdS, textAlign: 'center', color: h.corruptionIncidents > 0 ? T.red : T.green }}>{h.corruptionIncidents}</td>
                    <td style={tdS}><Badge label={risk} color={risk === 'High' ? 'red' : risk === 'Medium' ? 'amber' : 'green'} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── TAX CONDUCT ANALYSIS ────────────────────────────────────────────── */}
      <Section title="Tax Conduct Analysis" badge="ETR / Tax Haven / CbCR">
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16, overflowX: 'auto' }}>
          <table style={tbl}>
            <thead><tr><th style={thS}>Company</th><th style={thS}>Country</th><th style={thS}>Tax Score</th><th style={thS}>Tax Haven Subs</th><th style={thS}>CbCR</th><th style={thS}>Tax Transparency</th><th style={thS}>Controversies</th></tr></thead>
            <tbody>
              {sorted.filter(h => h.taxHavens > 0 || !h.taxTransp).slice(0, 15).map((h, i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontWeight: 600, fontSize: 11 }}>{(h.company_name || '').slice(0, 25)}</td>
                  <td style={tdS}>{h.countryCode}</td>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 600, color: h.dims.tax_conduct >= 60 ? T.green : T.red }}>{h.dims.tax_conduct}</td>
                  <td style={{ ...tdS, textAlign: 'center', color: h.taxHavens > 2 ? T.red : T.amber }}>{h.taxHavens}</td>
                  <td style={tdS}><Badge label={h.taxTransp ? 'Yes' : 'No'} color={h.taxTransp ? 'green' : 'red'} /></td>
                  <td style={{ ...tdS, textAlign: 'center' }}>{h.dims.tax_conduct >= 70 ? 'A' : h.dims.tax_conduct >= 50 ? 'B' : 'C'}</td>
                  <td style={{ ...tdS, textAlign: 'center' }}>{Math.floor(sRand(seed(h.company_name) + 200) * 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── SHAREHOLDER RIGHTS ASSESSMENT ───────────────────────────────────── */}
      <Section title="Shareholder Rights Assessment" badge="Dual-Class / Poison Pills / Say-on-Pay">
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16, overflowX: 'auto' }}>
          <table style={tbl}>
            <thead><tr><th style={thS}>Company</th><th style={thS}>Rights Score</th><th style={thS}>One Share One Vote</th><th style={thS}>Say-on-Pay</th><th style={thS}>Poison Pill</th><th style={thS}>Dual-Class</th><th style={thS}>Clawback</th></tr></thead>
            <tbody>
              {sorted.slice(0, 20).map((h, i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontWeight: 600, fontSize: 11 }}>{(h.company_name || '').slice(0, 25)}</td>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 600, color: h.dims.shareholder_rights >= 65 ? T.green : T.amber }}>{h.dims.shareholder_rights}</td>
                  <td style={tdS}><Badge label={!h.dualClass ? 'Yes' : 'No'} color={!h.dualClass ? 'green' : 'red'} /></td>
                  <td style={tdS}><Badge label={h.sayOnPay ? 'Yes' : 'No'} color={h.sayOnPay ? 'green' : 'red'} /></td>
                  <td style={tdS}><Badge label={h.poisonPill ? 'Yes' : 'No'} color={h.poisonPill ? 'red' : 'green'} /></td>
                  <td style={tdS}><Badge label={h.dualClass ? 'Yes' : 'No'} color={h.dualClass ? 'red' : 'green'} /></td>
                  <td style={tdS}><Badge label={h.clawback ? 'Yes' : 'No'} color={h.clawback ? 'green' : 'red'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── DATA INPUT — Per-Holding Governance Overrides ───────────────────── */}
      <Section title="Governance Data Input" badge="Per-Holding Editable">
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16 }}>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Select a holding to edit governance indicators. Changes persist to <code style={{ background: T.surfaceH, padding: '1px 4px', borderRadius: 3 }}>ra_corporate_governance_v1</code>.</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {holdings.slice(0, 30).map((h, i) => (
              <Btn key={i} small active={editCompany === i} onClick={() => setEditCompany(editCompany === i ? null : i)}>{(h.company_name || '').slice(0, 16)}</Btn>
            ))}
          </div>
          {editCompany !== null && holdings[editCompany] && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {['boardIndep', 'antiCorruptTrain', 'esgLinkedComp', 'auditIndep', 'ceoPayRatio'].map(field => (
                <div key={field} style={{ background: T.surfaceH, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, textTransform: 'uppercase' }}>{field.replace(/([A-Z])/g, ' $1')}</div>
                  <input type="range" min={0} max={field === 'ceoPayRatio' ? 500 : 100} value={govOverrides[`${editCompany}_${field}`] ?? holdings[editCompany][field]} onChange={e => setGovOverrides(p => ({ ...p, [`${editCompany}_${field}`]: Number(e.target.value) }))} style={{ width: '100%' }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, textAlign: 'center' }}>{govOverrides[`${editCompany}_${field}`] ?? holdings[editCompany][field]}</div>
                </div>
              ))}
              {['ceoChairSplit', 'whistleblower', 'sayOnPay', 'clawback', 'taxTransp', 'cyberOversight'].map(field => (
                <div key={field} style={{ background: T.surfaceH, borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase' }}>{field.replace(/([A-Z])/g, ' $1')}</span>
                  <Btn small active={govOverrides[`${editCompany}_${field}`] ?? holdings[editCompany][field]} onClick={() => setGovOverrides(p => ({ ...p, [`${editCompany}_${field}`]: !(p[`${editCompany}_${field}`] ?? holdings[editCompany][field]) }))}>
                    {(govOverrides[`${editCompany}_${field}`] ?? holdings[editCompany][field]) ? 'Yes' : 'No'}
                  </Btn>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* ── ENGAGEMENT RECOMMENDATIONS ──────────────────────────────────────── */}
      <Section title="Engagement Recommendations" badge={`${engagements.length} Priorities`}>
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16 }}>
          <table style={tbl}>
            <thead><tr><th style={thS}>Company</th><th style={thS}>Priority</th><th style={thS}>Topic</th><th style={thS}>Recommended Action</th></tr></thead>
            <tbody>
              {engagements.map((e, i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontWeight: 600, fontSize: 11 }}>{e.company}</td>
                  <td style={tdS}><Badge label={e.priority} color={e.priority === 'High' ? 'red' : 'amber'} /></td>
                  <td style={tdS}><Badge label={e.topic} color="navy" /></td>
                  <td style={{ ...tdS, fontSize: 11 }}>{e.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── REGULATORY MAP ──────────────────────────────────────────────────── */}
      <Section title="Governance Regulatory Map" badge={`${GOV_REGULATIONS.length} Standards`}>
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16, overflowX: 'auto' }}>
          <table style={tbl}>
            <thead><tr><th style={thS}>Code</th><th style={thS}>Standard</th><th style={thS}>Jurisdiction</th><th style={thS}>Focus Areas</th><th style={thS}>Mandatory</th><th style={thS}>Portfolio Exposure</th></tr></thead>
            <tbody>
              {GOV_REGULATIONS.map((reg, i) => {
                const exposed = holdings.filter(h => reg.countries.includes(h.countryCode)).length;
                return (
                  <tr key={i}>
                    <td style={tdS}><Badge label={reg.code} color="navy" /></td>
                    <td style={{ ...tdS, fontWeight: 600, fontSize: 11 }}>{reg.name}</td>
                    <td style={tdS}>{reg.countries.map(cc => COUNTRY_LABELS[cc] || cc).join(', ')}</td>
                    <td style={{ ...tdS, fontSize: 11, color: T.textSec }}>{reg.focus}</td>
                    <td style={tdS}><Badge label={reg.mandatory ? 'Mandatory' : 'Voluntary'} color={reg.mandatory ? 'red' : 'amber'} /></td>
                    <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{exposed} holding{exposed !== 1 ? 's' : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── GOVERNANCE IMPROVEMENT SLIDER ───────────────────────────────────── */}
      <Section title="Governance Improvement Scenario" badge="Interactive Slider">
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 18 }}>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Simulate portfolio governance improvement: shift all dimension scores by {scenarioSlider - 50 > 0 ? '+' : ''}{scenarioSlider - 50} points</div>
          <input type="range" min={0} max={100} value={scenarioSlider} onChange={e => setScenarioSlider(Number(e.target.value))} style={{ width: '100%', marginBottom: 12 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
            {DIM_KEYS.map(dk => {
              const shifted = clamp(agg.dimAvgs[dk] + (scenarioSlider - 50), 0, 100);
              return (
                <div key={dk} style={{ background: T.surfaceH, borderRadius: 8, padding: 10, borderLeft: `3px solid ${GOV_FRAMEWORK[dk].color}` }}>
                  <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>{GOV_FRAMEWORK[dk].label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: shifted >= 65 ? T.green : shifted >= 45 ? T.amber : T.red }}>{shifted.toFixed(1)}</div>
                  <div style={{ fontSize: 10, color: T.textSec }}>Baseline: {agg.dimAvgs[dk]}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── CROSS-NAV ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24, paddingTop: 16, borderTop: `2px solid ${T.border}` }}>
        {[
          { label: 'Board Diversity', path: '/board-diversity' },
          { label: 'Audit Trail', path: '/audit-trail' },
          { label: 'Regulatory Gap', path: '/regulatory-gap' },
          { label: 'Stewardship', path: '/stewardship' },
          { label: 'Geopolitical & AI Gov', path: '/geopolitical-ai-gov' },
          { label: 'ESG Dashboard', path: '/dme-dashboard' },
        ].map(nav => (
          <Btn key={nav.path} small onClick={() => navigate(nav.path)}>{nav.label}</Btn>
        ))}
      </div>
    </div>
  );
}
