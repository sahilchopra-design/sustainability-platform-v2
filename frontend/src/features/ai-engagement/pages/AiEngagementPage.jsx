import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#4f46e5','#0891b2','#7c3aed','#be185d','#d97706','#15803d','#1e40af','#9f1239','#059669'];

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const LS_PORT = 'ra_portfolio_v1';
const LS_ENG = 'ra_engagement_rules_v1';
const LS_STEW = 'ra_stewardship_v1';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const fmt = (n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';
const pct = (n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';
const seed = (s) => { let h = 5381; for (let i = 0; i < String(s).length; i++) h = ((h << 5) + h) ^ String(s).charCodeAt(i); return Math.abs(h); };
const sRand = (n) => { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const percentile = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length * p / 100)] || 0; };

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
  const map = { green: { bg: '#dcfce7', text: '#166534' }, red: { bg: '#fee2e2', text: '#991b1b' }, amber: { bg: '#fef3c7', text: '#92400e' }, blue: { bg: '#dbeafe', text: '#1e40af' }, navy: { bg: '#e0e7ff', text: '#1b3a5c' }, gold: { bg: '#fef3c7', text: '#92400e' }, gray: { bg: '#f3f4f6', text: '#374151' }, purple: { bg: '#ede9fe', text: '#5b21b6' }, teal: { bg: '#ccfbf1', text: '#115e59' } };
  const c = map[color] || map.gray;
  return <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text }}>{label}</span>;
};
const tbl = { width: '100%', fontSize: 12, borderCollapse: 'collapse', fontFamily: T.font };
const thS = { border: `1px solid ${T.border}`, padding: '8px 10px', fontSize: 11, textAlign: 'left', fontWeight: 600, color: T.textSec, background: T.surfaceH, textTransform: 'uppercase', letterSpacing: 0.3, cursor: 'pointer', userSelect: 'none' };
const tdS = { border: `1px solid ${T.border}`, padding: '7px 10px', fontSize: 12, color: T.text };
const SortIcon = ({ col, sortCol, sortDir }) => col === sortCol ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

/* ═══════════════════════════════════════════════════════════════════════════
   ENGAGEMENT RULES — 20 Rules across 6 Categories
   ═══════════════════════════════════════════════════════════════════════════ */
const DEFAULT_RULES = [
  // Climate (4)
  { id: 'R01', category: 'Climate', trigger: 'No SBTi commitment', condition: 'sbti', priority: 'High', action: 'Request science-based target setting', escalation: 'Letter > Meeting > Collaborative', template: 'Dear [CEO],\n\nAs a significant shareholder in [Company], we are writing to encourage your company to commit to the Science Based Targets initiative (SBTi). With [GHG_INTENSITY] tCO2e/USD Mn in GHG intensity, setting a science-based target would demonstrate leadership on climate action.\n\nWe request:\n1. Board-level commitment to SBTi within 6 months\n2. Submission of targets within 12 months\n3. Annual progress reporting\n\nWe look forward to your response.\n\nSincerely,\n[Investor Name]', kpi: 'SBTi commitment within 12 months', enabled: true },
  { id: 'R02', category: 'Climate', trigger: 'Net zero target absent or beyond 2060', condition: 'netzero', priority: 'High', action: 'Request credible net zero transition plan', escalation: 'Letter > Meeting > Proxy vote', template: 'Dear Board of Directors,\n\nWe request [Company] publish a comprehensive net zero transition plan with interim targets aligned to 1.5C. Your current target year of [TARGET_YEAR] does not meet the urgency required by climate science.\n\nKey asks:\n1. Net zero target by 2050 or earlier\n2. Interim 2030 reduction target (min 42%)\n3. Detailed capital expenditure alignment\n4. Third-party verification\n\nSincerely,\n[Investor Name]', kpi: 'Net zero target <=2050 with interim milestones', enabled: true },
  { id: 'R03', category: 'Climate', trigger: 'GHG intensity > 500 tCO2e/USD Mn', condition: 'ghg_high', priority: 'Critical', action: 'Urgent decarbonization engagement', escalation: 'Letter > Board meeting > Filing resolution', template: 'Dear [CEO],\n\nYour GHG intensity of [GHG_INTENSITY] tCO2e/USD Mn significantly exceeds the sector average of [SECTOR_AVG]. This level of carbon intensity poses material transition risk to shareholder value.\n\nWe urgently request:\n1. 20% intensity reduction commitment within 2 years\n2. Quarterly progress reporting\n3. Capex reallocation toward low-carbon technologies\n\nSincerely,\n[Investor Name]', kpi: '20% intensity reduction within 2 years', enabled: true },
  { id: 'R04', category: 'Climate', trigger: 'High transition risk (>70)', condition: 'transition_high', priority: 'High', action: 'Request climate transition strategy', escalation: 'Letter > Meeting > Vote against directors', template: 'Dear Board,\n\nWith a transition risk score of [RISK_SCORE], [Company] faces significant exposure to climate-related value destruction. We request publication of a comprehensive climate transition strategy within 12 months.\n\nSincerely,\n[Investor Name]', kpi: 'Published transition strategy within 12 months', enabled: true },
  // ESG Quality (3)
  { id: 'R05', category: 'ESG', trigger: 'ESG score below 40', condition: 'esg_low', priority: 'Medium', action: 'Comprehensive ESG improvement engagement', escalation: 'Letter > Meeting', template: 'Dear [CEO],\n\nYour company ESG score of [ESG_SCORE] places [Company] significantly below sector peers. We recommend a structured ESG improvement program targeting score improvement to above 50 within 18 months.\n\nSincerely,\n[Investor Name]', kpi: 'ESG score improvement to >50 within 18 months', enabled: true },
  { id: 'R06', category: 'ESG', trigger: 'ESG score bottom quartile of sector', condition: 'esg_bottom_q', priority: 'Medium', action: 'Sector-relative ESG improvement', escalation: 'Letter > Meeting', template: 'Dear Board,\n\n[Company] ESG performance sits in the bottom quartile of [SECTOR] peers. We request a targeted improvement plan to move to at least the second quartile within 18 months.\n\nSincerely,\n[Investor Name]', kpi: 'Move from bottom to second quartile', enabled: true },
  { id: 'R07', category: 'ESG', trigger: 'No ESG report published', condition: 'no_esg_report', priority: 'Medium', action: 'Request sustainability reporting', escalation: 'Letter > Meeting', template: 'Dear [CEO],\n\nWe note that [Company] does not currently publish a comprehensive sustainability report. We request annual ESG reporting aligned with GRI or SASB standards.\n\nSincerely,\n[Investor Name]', kpi: 'Annual sustainability report publication', enabled: true },
  // Disclosure (3)
  { id: 'R08', category: 'Disclosure', trigger: 'Missing Scope 1 or Scope 2 data', condition: 'scope_missing', priority: 'Medium', action: 'Request GHG emissions disclosure', escalation: 'Letter > Meeting > CDP request', template: 'Dear [CEO],\n\n[Company] currently lacks disclosure of Scope [MISSING_SCOPE] GHG emissions. We request comprehensive emissions reporting aligned with the GHG Protocol.\n\nSincerely,\n[Investor Name]', kpi: 'Scope 1 & 2 disclosure within 6 months', enabled: true },
  { id: 'R09', category: 'Disclosure', trigger: 'Low data quality score (<30)', condition: 'data_quality_low', priority: 'Medium', action: 'Improve ESG data quality', escalation: 'Letter > Meeting', template: 'Dear Board,\n\nThe quality and completeness of [Company] ESG disclosures requires significant improvement. Current data quality score is [DQ_SCORE]. We request engagement with a recognized ESG data provider.\n\nSincerely,\n[Investor Name]', kpi: 'Data quality score >50 within 12 months', enabled: true },
  { id: 'R10', category: 'Disclosure', trigger: 'No TCFD alignment', condition: 'no_tcfd', priority: 'High', action: 'Request TCFD-aligned reporting', escalation: 'Letter > Meeting > Proxy vote', template: 'Dear Board,\n\nWe request [Company] adopt TCFD-aligned climate risk disclosure across all four pillars: Governance, Strategy, Risk Management, and Metrics & Targets.\n\nSincerely,\n[Investor Name]', kpi: 'TCFD report within 12 months', enabled: true },
  // Governance (3)
  { id: 'R11', category: 'Governance', trigger: 'Board independence < 50%', condition: 'board_indep', priority: 'Medium', action: 'Increase board independence', escalation: 'Letter > Vote against nominees', template: 'Dear Chair,\n\nWe note that independent directors comprise less than 50% of [Company] board. We recommend increasing independence to at least two-thirds.\n\nSincerely,\n[Investor Name]', kpi: '>=2/3 independent directors', enabled: true },
  { id: 'R12', category: 'Governance', trigger: 'No CEO-Chair separation', condition: 'ceo_chair', priority: 'Medium', action: 'Separate Chair and CEO roles', escalation: 'Letter > Meeting > Proxy vote', template: 'Dear Board,\n\nThe combined CEO-Chair role at [Company] undermines board oversight effectiveness. We request appointment of an independent Chair.\n\nSincerely,\n[Investor Name]', kpi: 'Independent Chair appointed', enabled: true },
  { id: 'R13', category: 'Governance', trigger: 'No ESG committee at board level', condition: 'no_esg_committee', priority: 'Low', action: 'Establish board ESG committee', escalation: 'Letter', template: 'Dear Board,\n\nWe recommend [Company] establish a dedicated board-level ESG/Sustainability committee to strengthen oversight of material ESG risks.\n\nSincerely,\n[Investor Name]', kpi: 'ESG committee established within 12 months', enabled: true },
  // Social (4)
  { id: 'R14', category: 'Social', trigger: 'No diversity policy', condition: 'no_diversity', priority: 'Medium', action: 'Adopt workforce diversity targets', escalation: 'Letter > Meeting', template: 'Dear [CEO],\n\nWe request [Company] adopt measurable workforce diversity targets and report annually on progress, including gender pay gap data.\n\nSincerely,\n[Investor Name]', kpi: 'Published diversity targets within 6 months', enabled: true },
  { id: 'R15', category: 'Social', trigger: 'High controversy exposure', condition: 'controversy', priority: 'High', action: 'Address active controversies', escalation: 'Letter > Meeting > Collaborative engagement', template: 'Dear Board,\n\nWe are concerned about the ongoing controversies affecting [Company]. We request a comprehensive remediation plan addressing stakeholder concerns.\n\nSincerely,\n[Investor Name]', kpi: 'Remediation plan within 3 months', enabled: true },
  { id: 'R16', category: 'Social', trigger: 'No living wage commitment', condition: 'living_wage', priority: 'Low', action: 'Commit to living wage', escalation: 'Letter', template: 'Dear [CEO],\n\nWe encourage [Company] to commit to paying a living wage to all direct employees and working with suppliers to achieve the same.\n\nSincerely,\n[Investor Name]', kpi: 'Living wage accreditation', enabled: true },
  { id: 'R17', category: 'Social', trigger: 'No modern slavery statement', condition: 'modern_slavery', priority: 'Medium', action: 'Publish modern slavery statement', escalation: 'Letter > Meeting', template: 'Dear Board,\n\nWe request [Company] publish a comprehensive modern slavery statement covering all tiers of the supply chain, with measurable commitments.\n\nSincerely,\n[Investor Name]', kpi: 'Modern slavery statement published', enabled: true },
  // Nature (3)
  { id: 'R18', category: 'Nature', trigger: 'No deforestation policy (high-risk sector)', condition: 'deforestation', priority: 'High', action: 'Adopt zero-deforestation commitment', escalation: 'Letter > Meeting > Divestment warning', template: 'Dear [CEO],\n\nGiven [Company] exposure to deforestation-linked commodities, we request adoption of a zero-deforestation policy with 2025 cutoff date and NDPE commitments.\n\nSincerely,\n[Investor Name]', kpi: 'Zero-deforestation policy within 6 months', enabled: true },
  { id: 'R19', category: 'Nature', trigger: 'High water risk without mitigation', condition: 'water_risk', priority: 'Medium', action: 'Develop water stewardship plan', escalation: 'Letter > Meeting', template: 'Dear Board,\n\nWe request [Company] develop a comprehensive water stewardship strategy addressing basin-level risks and setting reduction targets.\n\nSincerely,\n[Investor Name]', kpi: 'Water stewardship plan within 12 months', enabled: true },
  { id: 'R20', category: 'Nature', trigger: 'No TNFD alignment', condition: 'no_tnfd', priority: 'Low', action: 'Adopt TNFD reporting', escalation: 'Letter', template: 'Dear Board,\n\nWe encourage [Company] to align nature-related disclosures with the Taskforce on Nature-related Financial Disclosures (TNFD) framework.\n\nSincerely,\n[Investor Name]', kpi: 'TNFD-aligned disclosure within 18 months', enabled: true },
];

const PRIORITY_SCORE = { Critical: 4, High: 3, Medium: 2, Low: 1 };
const PRIORITY_COLOR = { Critical: 'red', High: 'amber', Medium: 'blue', Low: 'gray' };
const URGENCY_COLOR = { Immediate: 'red', Quarter: 'amber', Annual: 'blue' };

/* ── Condition evaluator ─────────────────────────────────────────────────── */
function evalCondition(condKey, company, peers) {
  const s = seed(company.company_name || '');
  switch (condKey) {
    case 'sbti': return !company.sbti_committed && sRand(s + 201) > 0.35;
    case 'netzero': return !company.carbon_neutral_target_year || company.carbon_neutral_target_year > 2060;
    case 'ghg_high': return (company.ghg_intensity_tco2e_per_mn || 0) > 500;
    case 'transition_high': return (company.transition_risk_score || 0) > 70;
    case 'esg_low': return (company.esg_score || 0) < 40;
    case 'esg_bottom_q': { const sp = peers.filter(p => p.sector === company.sector); const th = percentile(sp.map(p => p.esg_score || 0), 25); return (company.esg_score || 0) < th; }
    case 'no_esg_report': return sRand(s + 202) > 0.7;
    case 'scope_missing': return !(company.scope1_mt > 0) || !(company.scope2_mt > 0);
    case 'data_quality_low': return (company.data_quality_score || 0) < 30;
    case 'no_tcfd': return sRand(s + 203) > 0.55;
    case 'board_indep': return sRand(s + 204) > 0.6;
    case 'ceo_chair': return sRand(s + 205) > 0.55;
    case 'no_esg_committee': return sRand(s + 206) > 0.5;
    case 'no_diversity': return sRand(s + 207) > 0.5;
    case 'controversy': return sRand(s + 208) > 0.75;
    case 'living_wage': return sRand(s + 209) > 0.6;
    case 'modern_slavery': return sRand(s + 210) > 0.55;
    case 'deforestation': return ['Materials', 'Consumer Staples', 'Energy'].includes(company.sector) && sRand(s + 211) > 0.5;
    case 'water_risk': return sRand(s + 212) > 0.65;
    case 'no_tnfd': return sRand(s + 213) > 0.6;
    default: return false;
  }
}

/* ── Template interpolation ──────────────────────────────────────────────── */
function fillTemplate(template, company, peers) {
  const sectorPeers = peers.filter(p => p.sector === company.sector);
  const sectorAvgGHG = sectorPeers.length ? Math.round(sectorPeers.reduce((s, p) => s + (p.ghg_intensity_tco2e_per_mn || 0), 0) / sectorPeers.length) : 0;
  return template
    .replace(/\[Company\]/g, company.company_name || 'Company')
    .replace(/\[CEO\]/g, 'CEO')
    .replace(/\[GHG_INTENSITY\]/g, fmt(company.ghg_intensity_tco2e_per_mn))
    .replace(/\[SECTOR_AVG\]/g, fmt(sectorAvgGHG))
    .replace(/\[ESG_SCORE\]/g, fmt(company.esg_score))
    .replace(/\[SECTOR\]/g, company.sector || 'sector')
    .replace(/\[TARGET_YEAR\]/g, company.carbon_neutral_target_year || 'N/A')
    .replace(/\[RISK_SCORE\]/g, fmt(company.transition_risk_score))
    .replace(/\[DQ_SCORE\]/g, fmt(company.data_quality_score))
    .replace(/\[MISSING_SCOPE\]/g, !(company.scope1_mt > 0) ? '1' : '2')
    .replace(/\[Investor Name\]/g, 'Portfolio Management Team');
}

/* ── Enrichment ──────────────────────────────────────────────────────────── */
function enrichEng(c, idx) {
  const s = seed(c.company_name || idx);
  return {
    ...c,
    esg_score: c.esg_score || Math.round(20 + sRand(s + 1) * 70),
    ghg_intensity_tco2e_per_mn: c.ghg_intensity_tco2e_per_mn || Math.round(5 + sRand(s + 2) * 800),
    transition_risk_score: c.transition_risk_score || Math.round(10 + sRand(s + 3) * 85),
    scope1_mt: c.scope1_mt || (sRand(s + 4) > 0.2 ? Math.round(100 + sRand(s + 41) * 90000) : 0),
    scope2_mt: c.scope2_mt || (sRand(s + 5) > 0.25 ? Math.round(50 + sRand(s + 51) * 30000) : 0),
    revenue_usd_mn: c.revenue_usd_mn || Math.round(100 + sRand(s + 6) * 50000),
    data_quality_score: c.data_quality_score || Math.round(15 + sRand(s + 10) * 80),
    carbon_neutral_target_year: c.carbon_neutral_target_year || (sRand(s + 11) > 0.4 ? Math.round(2030 + sRand(s + 12) * 40) : null),
    sbti_committed: c.sbti_committed || sRand(s + 13) > 0.65,
    sector: c.sector || 'Industrials',
    company_name: c.company_name || `Company_${idx}`,
    countryCode: c.countryCode || 'IN',
    weight: c.weight || 1,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function AiEngagementPage() {
  const navigate = useNavigate();
  const portfolioRaw = useMemo(() => {
    const saved = localStorage.getItem(LS_PORT);
    const data = saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
    return data.portfolios?.[data.activePortfolio]?.holdings || [];
  }, []);

  const [sortCol, setSortCol] = useState('totalScore');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [letterCompany, setLetterCompany] = useState(null);
  const [letterRule, setLetterRule] = useState(null);
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [ruleOverrides, setRuleOverrides] = useState(() => loadLS(LS_ENG) || {});
  const [engHistory, setEngHistory] = useState(() => loadLS(LS_STEW) || []);
  const [filterCategory, setFilterCategory] = useState('All');
  const [batchMode, setBatchMode] = useState(false);

  const rules = useMemo(() => {
    return DEFAULT_RULES.map(r => ({ ...r, enabled: ruleOverrides[r.id]?.enabled !== undefined ? ruleOverrides[r.id].enabled : r.enabled, priority: ruleOverrides[r.id]?.priority || r.priority }));
  }, [ruleOverrides]);

  useEffect(() => { saveLS(LS_ENG, ruleOverrides); }, [ruleOverrides]);
  useEffect(() => { saveLS(LS_STEW, engHistory); }, [engHistory]);

  /* ── Build holdings ──────────────────────────────────────────────────────── */
  const holdings = useMemo(() => {
    if (!portfolioRaw.length) return GLOBAL_COMPANY_MASTER.slice(0, 80).map((c, i) => enrichEng(c, i));
    const lookup = {};
    GLOBAL_COMPANY_MASTER.forEach(c => { const k = (c.company_name || '').toLowerCase(); lookup[k] = c; });
    return portfolioRaw.map((h, i) => {
      const master = lookup[(h.company || '').toLowerCase()] || {};
      return enrichEng({ ...master, ...h, company_name: h.company || master.company_name, sector: h.sector || master.sector, countryCode: h.countryCode || master.countryCode || 'IN' }, i);
    });
  }, [portfolioRaw]);

  /* ── Score each company ──────────────────────────────────────────────────── */
  const scored = useMemo(() => {
    return holdings.map((h, i) => {
      const triggered = rules.filter(r => r.enabled && evalCondition(r.condition, h, holdings));
      const totalScore = triggered.reduce((s, r) => s + (PRIORITY_SCORE[r.priority] || 0), 0);
      const urgency = totalScore > 10 ? 'Immediate' : totalScore > 5 ? 'Quarter' : 'Annual';
      const topAction = triggered.sort((a, b) => (PRIORITY_SCORE[b.priority] || 0) - (PRIORITY_SCORE[a.priority] || 0))[0]?.action || 'No action';
      const topCategory = triggered[0]?.category || '---';
      return { ...h, triggered, totalScore, urgency, topAction, topCategory, idx: i };
    });
  }, [holdings, rules]);

  const needsEngagement = scored.filter(s => s.triggered.length > 0);

  /* ── KPIs ────────────────────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const critical = needsEngagement.filter(s => s.triggered.some(r => r.priority === 'Critical')).length;
    const high = needsEngagement.filter(s => s.triggered.some(r => r.priority === 'High')).length;
    const avgScore = needsEngagement.length ? (needsEngagement.reduce((s, c) => s + c.totalScore, 0) / needsEngagement.length).toFixed(1) : '0';
    const triggerCounts = {};
    needsEngagement.forEach(c => c.triggered.forEach(r => { triggerCounts[r.trigger] = (triggerCounts[r.trigger] || 0) + 1; }));
    const topIssue = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '---';
    const templateCount = rules.filter(r => r.template).length;
    return { total: holdings.length, needing: needsEngagement.length, critical, high, avgScore, topIssue, templateCount, active: engHistory.length };
  }, [needsEngagement, holdings, rules, engHistory]);

  /* ── Chart data ──────────────────────────────────────────────────────────── */
  const ruleTriggerData = useMemo(() => {
    const counts = {};
    needsEngagement.forEach(c => c.triggered.forEach(r => { counts[r.id + ' ' + r.trigger.slice(0, 25)] = (counts[r.id + ' ' + r.trigger.slice(0, 25)] || 0) + 1; }));
    return Object.entries(counts).map(([name, value]) => ({ name: name.length > 30 ? name.slice(0, 28) + '..' : name, value })).sort((a, b) => b.value - a.value).slice(0, 12);
  }, [needsEngagement]);

  const categoryData = useMemo(() => {
    const counts = {};
    needsEngagement.forEach(c => c.triggered.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; }));
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [needsEngagement]);

  /* ── Sort ─────────────────────────────────────────────────────────────────── */
  const doSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };
  const sortedScored = useMemo(() => {
    let filtered = filterCategory === 'All' ? needsEngagement : needsEngagement.filter(c => c.triggered.some(r => r.category === filterCategory));
    return [...filtered].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av || '').localeCompare(String(bv || '')) : String(bv || '').localeCompare(String(av || ''));
    });
  }, [needsEngagement, sortCol, sortDir, filterCategory]);

  /* ── Letter generation ───────────────────────────────────────────────────── */
  const generatedLetter = useMemo(() => {
    if (!letterCompany || !letterRule) return '';
    const rule = rules.find(r => r.id === letterRule);
    if (!rule) return '';
    return fillTemplate(rule.template, letterCompany, holdings);
  }, [letterCompany, letterRule, rules, holdings]);

  const copyLetter = useCallback(() => {
    navigator.clipboard.writeText(generatedLetter).then(() => { setCopiedLetter(true); setTimeout(() => setCopiedLetter(false), 2000); });
  }, [generatedLetter]);

  /* ── Log to stewardship ──────────────────────────────────────────────────── */
  const logToStewardship = useCallback((company, rule) => {
    const entry = { id: Date.now(), company: company.company_name, sector: company.sector, rule: rule.id, action: rule.action, category: rule.category, priority: rule.priority, date: new Date().toISOString().split('T')[0], status: 'Initiated' };
    setEngHistory(prev => [entry, ...prev]);
  }, []);

  /* ── Exports ─────────────────────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const header = 'Company,Sector,Score,Urgency,Rules Triggered,Top Action,Category\n';
    const rows = sortedScored.map(c => `"${c.company_name}","${c.sector}",${c.totalScore},"${c.urgency}",${c.triggered.length},"${c.topAction}","${c.topCategory}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'engagement_plan.csv'; a.click(); URL.revokeObjectURL(url);
  }, [sortedScored]);

  const exportJSON = useCallback(() => {
    const letters = needsEngagement.slice(0, 30).map(c => {
      const topRule = c.triggered[0];
      return { company: c.company_name, rule: topRule?.id, letter: topRule ? fillTemplate(topRule.template, c, holdings) : '' };
    });
    const blob = new Blob([JSON.stringify({ generated: new Date().toISOString(), letters }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'engagement_letters.json'; a.click(); URL.revokeObjectURL(url);
  }, [needsEngagement, holdings]);

  const exportPrint = useCallback(() => { window.print(); }, []);

  /* ── Effectiveness data (simulated) ──────────────────────────────────────── */
  const effectivenessData = useMemo(() => {
    return ['Climate', 'ESG', 'Disclosure', 'Governance', 'Social', 'Nature'].map((cat, i) => ({
      category: cat,
      engaged: Math.round(10 + sRand(i * 7 + 1) * 30),
      improved: Math.round(3 + sRand(i * 7 + 2) * 15),
      rate: Math.round(20 + sRand(i * 7 + 3) * 50),
    }));
  }, []);

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ padding: '24px 28px', maxWidth: 1440, margin: '0 auto', fontFamily: T.font, color: T.text, background: T.bg, minHeight: '100vh' }}>

      {/* ── 1. HEADER ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.navy, margin: 0 }}>AI Engagement Recommendation Engine</h1>
          <Badge label="20 Rules" color="navy" />
          <Badge label="Priority Scoring" color="gold" />
          <Badge label="Templates" color="teal" />
          <Badge label="Tracking" color="purple" />
        </div>
        <p style={{ fontSize: 13, color: T.textSec, marginTop: 6, lineHeight: 1.5 }}>
          Rule-based scoring engine generating personalized engagement recommendations for each portfolio holding based on ESG gaps, materiality, and peer comparison.
        </p>
      </div>

      {/* ── 2. KPI CARDS ───────────────────────────────────────────────────── */}
      <Section title="Engagement Overview" badge="8 KPIs">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
          <KpiCard label="Portfolio Holdings" value={kpis.total} sub="Full universe" accent={T.navy} />
          <KpiCard label="Needing Engagement" value={kpis.needing} sub={pct(kpis.needing / kpis.total * 100) + ' of portfolio'} accent={T.amber} />
          <KpiCard label="Critical Priority" value={kpis.critical} sub="Immediate action" accent="#dc2626" />
          <KpiCard label="High Priority" value={kpis.high} sub="This quarter" accent={T.amber} />
          <KpiCard label="Avg Score" value={kpis.avgScore} sub="Engagement urgency" accent={T.gold} />
          <KpiCard label="Top Issue" value={kpis.topIssue.length > 18 ? kpis.topIssue.slice(0, 16) + '..' : kpis.topIssue} sub="Most common trigger" accent={T.sage} />
          <KpiCard label="Template Library" value={kpis.templateCount} sub="Auto-generate letters" accent="#7c3aed" />
          <KpiCard label="Active Engagements" value={kpis.active} sub="Logged to stewardship" accent={T.green} />
        </div>
      </Section>

      {/* ── 3. ENGAGEMENT PRIORITY TABLE ────────────────────────────────────── */}
      <Section title="Engagement Priority Rankings" badge={`${needsEngagement.length} companies`}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {['All', 'Climate', 'ESG', 'Disclosure', 'Governance', 'Social', 'Nature'].map(cat => (
            <Btn key={cat} small active={filterCategory === cat} onClick={() => setFilterCategory(cat)}>{cat}</Btn>
          ))}
        </div>
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 14, overflowX: 'auto' }}>
          <table style={tbl}>
            <thead>
              <tr>
                {[{ k: 'company_name', l: 'Company' }, { k: 'totalScore', l: 'Score' }, { k: 'urgency', l: 'Urgency' }, { k: 'triggered', l: '# Rules' }, { k: 'topAction', l: 'Top Action' }, { k: 'topCategory', l: 'Category' }].map(c => (
                  <th key={c.k} style={thS} onClick={() => doSort(c.k)}>{c.l}<SortIcon col={c.k} sortCol={sortCol} sortDir={sortDir} /></th>
                ))}
                <th style={thS}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedScored.slice(0, 50).map((c, i) => (
                <tr key={i} style={{ cursor: 'pointer', background: selectedCompany?.idx === c.idx ? T.surfaceH : 'transparent' }} onClick={() => setSelectedCompany(c)}>
                  <td style={{ ...tdS, fontWeight: 600, fontSize: 11 }}>{(c.company_name || '').slice(0, 24)}</td>
                  <td style={{ ...tdS, fontWeight: 700, color: c.totalScore > 10 ? T.red : c.totalScore > 5 ? T.amber : T.navy }}>{c.totalScore}</td>
                  <td style={tdS}><Badge label={c.urgency} color={URGENCY_COLOR[c.urgency] || 'gray'} /></td>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{c.triggered.length}</td>
                  <td style={{ ...tdS, fontSize: 11 }}>{(c.topAction || '').slice(0, 35)}</td>
                  <td style={tdS}><Badge label={c.topCategory} color={c.topCategory === 'Climate' ? 'red' : c.topCategory === 'ESG' ? 'blue' : c.topCategory === 'Governance' ? 'navy' : 'gold'} /></td>
                  <td style={tdS}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Btn small onClick={(e) => { e.stopPropagation(); setLetterCompany(c); setLetterRule(c.triggered[0]?.id); }}>Letter</Btn>
                      <Btn small onClick={(e) => { e.stopPropagation(); logToStewardship(c, c.triggered[0] || rules[0]); }}>Log</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedScored.length > 50 && <div style={{ fontSize: 11, color: T.textMut, marginTop: 8, textAlign: 'center' }}>Showing 50 of {sortedScored.length}. Export for full list.</div>}
        </div>
      </Section>

      {/* ── 4. RULE TRIGGER DISTRIBUTION PIE CHART ─────────────────────────── */}
      <Section title="Rule Trigger Distribution" badge="PieChart">
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 18 }}>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={ruleTriggerData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, value }) => `${name.slice(0, 18)}: ${value}`} labelLine={{ stroke: T.textMut }} >
                {ruleTriggerData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${T.border}` }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── 5. CATEGORY BAR CHART ──────────────────────────────────────────── */}
      <Section title="Engagement by Category" badge="BarChart">
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 18 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${T.border}` }} />
              <Bar dataKey="value" name="Triggers" radius={[4, 4, 0, 0]}>
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* ── 6. COMPANY DETAIL PANEL ────────────────────────────────────────── */}
      {selectedCompany && (
        <Section title="Company Engagement Detail" badge={selectedCompany.company_name}>
          <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{selectedCompany.company_name}</div>
                <div style={{ fontSize: 12, color: T.textSec }}>{selectedCompany.sector} | Score: {selectedCompany.totalScore} | {selectedCompany.urgency}</div>
              </div>
              <Btn small onClick={() => setSelectedCompany(null)}>Close</Btn>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10, marginBottom: 14 }}>
              <KpiCard label="ESG Score" value={fmt(selectedCompany.esg_score)} accent={T.sage} />
              <KpiCard label="GHG Intensity" value={fmt(selectedCompany.ghg_intensity_tco2e_per_mn)} accent={T.amber} />
              <KpiCard label="Transition Risk" value={fmt(selectedCompany.transition_risk_score)} accent={T.red} />
              <KpiCard label="Data Quality" value={fmt(selectedCompany.data_quality_score)} accent={T.navy} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Triggered Rules ({selectedCompany.triggered.length})</div>
            <table style={tbl}>
              <thead>
                <tr>
                  <th style={thS}>ID</th><th style={thS}>Category</th><th style={thS}>Trigger</th><th style={thS}>Priority</th><th style={thS}>Action</th><th style={thS}>KPI</th><th style={thS}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedCompany.triggered.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{r.id}</td>
                    <td style={tdS}><Badge label={r.category} color={r.category === 'Climate' ? 'red' : 'blue'} /></td>
                    <td style={{ ...tdS, fontSize: 11 }}>{r.trigger}</td>
                    <td style={tdS}><Badge label={r.priority} color={PRIORITY_COLOR[r.priority]} /></td>
                    <td style={{ ...tdS, fontSize: 11 }}>{r.action}</td>
                    <td style={{ ...tdS, fontSize: 10, color: T.textSec }}>{r.kpi}</td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Btn small onClick={() => { setLetterCompany(selectedCompany); setLetterRule(r.id); }}>Letter</Btn>
                        <Btn small onClick={() => logToStewardship(selectedCompany, r)}>Log</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── 7. LETTER GENERATOR ────────────────────────────────────────────── */}
      {letterCompany && (
        <Section title="Engagement Letter Generator" badge={letterCompany.company_name}>
          <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>Generate Letter for {letterCompany.company_name}</div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>Select a rule to generate a customized engagement letter.</div>
              </div>
              <Btn small onClick={() => { setLetterCompany(null); setLetterRule(null); }}>Close</Btn>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {(letterCompany.triggered || []).map(r => (
                <Btn key={r.id} small active={letterRule === r.id} onClick={() => setLetterRule(r.id)}>{r.id}: {r.trigger.slice(0, 25)}</Btn>
              ))}
            </div>
            {generatedLetter && (
              <div>
                <pre style={{ background: T.surfaceH, borderRadius: 8, padding: 16, fontSize: 12, lineHeight: 1.7, color: T.text, whiteSpace: 'pre-wrap', border: `1px solid ${T.border}`, maxHeight: 350, overflow: 'auto', fontFamily: T.font }}>{generatedLetter}</pre>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <Btn onClick={copyLetter}>{copiedLetter ? 'Copied!' : 'Copy to Clipboard'}</Btn>
                  <Btn onClick={() => logToStewardship(letterCompany, rules.find(r => r.id === letterRule) || rules[0])}>Log to Stewardship</Btn>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── 8. ENGAGEMENT TRACKER (Stewardship Log) ────────────────────────── */}
      <Section title="Engagement Tracker" badge={`${engHistory.length} logged`}>
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 14, overflowX: 'auto' }}>
          {engHistory.length === 0 ? (
            <div style={{ fontSize: 12, color: T.textMut, textAlign: 'center', padding: 20 }}>No engagements logged yet. Click "Log" on any company to begin tracking.</div>
          ) : (
            <table style={tbl}>
              <thead>
                <tr>
                  <th style={thS}>Date</th><th style={thS}>Company</th><th style={thS}>Rule</th><th style={thS}>Action</th><th style={thS}>Category</th><th style={thS}>Priority</th><th style={thS}>Status</th>
                </tr>
              </thead>
              <tbody>
                {engHistory.slice(0, 20).map((e, i) => (
                  <tr key={i}>
                    <td style={tdS}>{e.date}</td>
                    <td style={{ ...tdS, fontWeight: 600, fontSize: 11 }}>{(e.company || '').slice(0, 22)}</td>
                    <td style={tdS}><Badge label={e.rule} color="navy" /></td>
                    <td style={{ ...tdS, fontSize: 11 }}>{(e.action || '').slice(0, 30)}</td>
                    <td style={tdS}><Badge label={e.category} color="gold" /></td>
                    <td style={tdS}><Badge label={e.priority} color={PRIORITY_COLOR[e.priority]} /></td>
                    <td style={tdS}><Badge label={e.status} color="green" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Section>

      {/* ── 9. PEER COMPARISON ─────────────────────────────────────────────── */}
      {selectedCompany && (
        <Section title="Peer Comparison" badge={selectedCompany.sector}>
          <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 14 }}>
            <table style={tbl}>
              <thead>
                <tr>
                  <th style={thS}>Company</th><th style={thS}>ESG Score</th><th style={thS}>GHG Intensity</th><th style={thS}>Transition Risk</th><th style={thS}># Rules Triggered</th>
                </tr>
              </thead>
              <tbody>
                {scored.filter(c => c.sector === selectedCompany.sector).sort((a, b) => b.totalScore - a.totalScore).slice(0, 10).map((c, i) => (
                  <tr key={i} style={{ background: c.company_name === selectedCompany.company_name ? '#fef3c7' : 'transparent' }}>
                    <td style={{ ...tdS, fontWeight: c.company_name === selectedCompany.company_name ? 700 : 400, fontSize: 11 }}>{(c.company_name || '').slice(0, 24)} {c.company_name === selectedCompany.company_name ? ' *' : ''}</td>
                    <td style={{ ...tdS, fontWeight: 600, color: (c.esg_score || 0) < 40 ? T.red : T.green }}>{fmt(c.esg_score)}</td>
                    <td style={{ ...tdS, color: (c.ghg_intensity_tco2e_per_mn || 0) > 500 ? T.red : T.text }}>{fmt(c.ghg_intensity_tco2e_per_mn)}</td>
                    <td style={tdS}>{fmt(c.transition_risk_score)}</td>
                    <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{c.triggered.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── 10. ENGAGEMENT HISTORY (simulated past) ────────────────────────── */}
      <Section title="Historical Engagement Outcomes" badge="Simulated">
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 14 }}>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={thS}>Company</th><th style={thS}>Engagement Year</th><th style={thS}>Topic</th><th style={thS}>Outcome</th><th style={thS}>ESG Change</th>
              </tr>
            </thead>
            <tbody>
              {holdings.slice(0, 10).map((h, i) => {
                const s = seed(h.company_name + 'hist');
                const outcomes = ['Target Set', 'Report Published', 'In Progress', 'No Response', 'Partial Compliance'];
                const topics = ['Climate Transition', 'GHG Disclosure', 'Board Independence', 'Diversity', 'Water Risk'];
                const outcome = outcomes[Math.floor(sRand(s) * outcomes.length)];
                const esgChange = Math.round((sRand(s + 1) - 0.3) * 15);
                return (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 600, fontSize: 11 }}>{(h.company_name || '').slice(0, 22)}</td>
                    <td style={tdS}>{2023 + Math.floor(sRand(s + 2) * 3)}</td>
                    <td style={tdS}>{topics[Math.floor(sRand(s + 3) * topics.length)]}</td>
                    <td style={tdS}><Badge label={outcome} color={outcome === 'Target Set' || outcome === 'Report Published' ? 'green' : outcome === 'No Response' ? 'red' : 'amber'} /></td>
                    <td style={{ ...tdS, fontWeight: 700, color: esgChange > 0 ? T.green : esgChange < 0 ? T.red : T.textMut }}>{esgChange > 0 ? '+' : ''}{esgChange} pts</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 11. RULE CONFIGURATION ─────────────────────────────────────────── */}
      <Section title="Rule Configuration" badge="Enable/Disable & Priority">
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 14, overflowX: 'auto' }}>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10 }}>Toggle rules on/off and adjust priority levels. Changes persist to localStorage.</div>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={thS}>ID</th><th style={thS}>Category</th><th style={thS}>Trigger</th><th style={thS}>Default Priority</th><th style={thS}>Enabled</th><th style={thS}>Override Priority</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r, i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{r.id}</td>
                  <td style={tdS}><Badge label={r.category} color={r.category === 'Climate' ? 'red' : r.category === 'Governance' ? 'navy' : 'blue'} /></td>
                  <td style={{ ...tdS, fontSize: 11 }}>{r.trigger}</td>
                  <td style={tdS}><Badge label={DEFAULT_RULES[i].priority} color={PRIORITY_COLOR[DEFAULT_RULES[i].priority]} /></td>
                  <td style={tdS}>
                    <input type="checkbox" checked={r.enabled} onChange={() => setRuleOverrides(prev => ({ ...prev, [r.id]: { ...prev[r.id], enabled: !r.enabled } }))} />
                  </td>
                  <td style={tdS}>
                    <select value={r.priority} onChange={e => setRuleOverrides(prev => ({ ...prev, [r.id]: { ...prev[r.id], priority: e.target.value } }))} style={{ fontSize: 11, padding: '3px 6px', borderRadius: 4, border: `1px solid ${T.border}`, fontFamily: T.font }}>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 12. BATCH ENGAGEMENT PLAN ──────────────────────────────────────── */}
      <Section title="Batch Engagement Plan" badge="Full Portfolio">
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: T.textSec }}>Generate engagement plan for entire portfolio sorted by priority, with timeline and resource allocation.</div>
            <Btn onClick={() => setBatchMode(!batchMode)}>{batchMode ? 'Hide Plan' : 'Generate Batch Plan'}</Btn>
          </div>
          {batchMode && (
            <table style={tbl}>
              <thead>
                <tr>
                  <th style={thS}>Priority</th><th style={thS}>Company</th><th style={thS}>Top Issue</th><th style={thS}>Timeline</th><th style={thS}>Resource Est.</th><th style={thS}>Escalation</th>
                </tr>
              </thead>
              <tbody>
                {needsEngagement.sort((a, b) => b.totalScore - a.totalScore).slice(0, 25).map((c, i) => {
                  const topRule = c.triggered[0];
                  return (
                    <tr key={i}>
                      <td style={tdS}><Badge label={c.urgency} color={URGENCY_COLOR[c.urgency]} /></td>
                      <td style={{ ...tdS, fontWeight: 600, fontSize: 11 }}>{(c.company_name || '').slice(0, 22)}</td>
                      <td style={{ ...tdS, fontSize: 11 }}>{(topRule?.trigger || '').slice(0, 30)}</td>
                      <td style={tdS}>{c.urgency === 'Immediate' ? 'This Month' : c.urgency === 'Quarter' ? 'This Quarter' : 'This Year'}</td>
                      <td style={tdS}>{c.triggered.length > 3 ? '2 analysts' : '1 analyst'}</td>
                      <td style={{ ...tdS, fontSize: 10, color: T.textSec }}>{(topRule?.escalation || 'Letter').slice(0, 30)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Section>

      {/* ── 13. EFFECTIVENESS DASHBOARD ─────────────────────────────────────── */}
      <Section title="Engagement Effectiveness" badge="Historical Success Rates">
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 18 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={effectivenessData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${T.border}` }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="engaged" name="Companies Engaged" fill={T.navy} radius={[4, 4, 0, 0]} />
              <Bar dataKey="improved" name="Improved" fill={T.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10, marginTop: 14 }}>
            {effectivenessData.map((d, i) => (
              <div key={i} style={{ background: T.surfaceH, borderRadius: 8, padding: 10, borderLeft: `3px solid ${COLORS[i]}` }}>
                <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>{d.category}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: d.rate > 50 ? T.green : d.rate > 30 ? T.amber : T.red }}>{d.rate}%</div>
                <div style={{ fontSize: 10, color: T.textSec }}>Success rate</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 14. EXPORTS + CROSS-NAV ────────────────────────────────────────── */}
      <Section title="Export & Actions" badge="3 Formats">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn onClick={exportCSV}>Export Engagement Plan CSV</Btn>
          <Btn onClick={exportJSON}>Export Letters Package JSON</Btn>
          <Btn onClick={exportPrint}>Print Report</Btn>
        </div>
      </Section>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24, paddingTop: 16, borderTop: `2px solid ${T.border}` }}>
        {[
          { label: 'Stewardship', path: '/stewardship' },
          { label: 'Controversy Monitor', path: '/controversy-monitor' },
          { label: 'ESG Dashboard', path: '/dme-dashboard' },
          { label: 'Board Diversity', path: '/board-diversity' },
          { label: 'Anomaly Detection', path: '/anomaly-detection' },
          { label: 'Corporate Governance', path: '/corporate-governance' },
        ].map(nav => (
          <Btn key={nav.path} small onClick={() => navigate(nav.path)}>{nav.label}</Btn>
        ))}
      </div>
    </div>
  );
}
