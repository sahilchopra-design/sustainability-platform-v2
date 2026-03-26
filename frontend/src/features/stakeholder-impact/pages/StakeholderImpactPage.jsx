import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ReferenceLine, AreaChart, Area, PieChart, Pie,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#4f46e5','#0891b2','#7c3aed','#be185d','#d97706','#15803d','#1e40af','#9f1239','#059669'];

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const LS_PORT = 'ra_portfolio_v1';
const LS_ENGAGE = 'ra_stakeholder_engagement_v1';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const fmt = (n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';
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
  const map = { green: { bg: '#dcfce7', text: '#166534' }, red: { bg: '#fee2e2', text: '#991b1b' }, amber: { bg: '#fef3c7', text: '#92400e' }, blue: { bg: '#dbeafe', text: '#1e40af' }, navy: { bg: '#e0e7ff', text: '#1b3a5c' }, gold: { bg: '#fef3c7', text: '#92400e' }, sage: { bg: '#dcfce7', text: '#166534' }, gray: { bg: '#f3f4f6', text: '#374151' }, purple: { bg: '#ede9fe', text: '#5b21b6' } };
  const c = map[color] || map.gray;
  return <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text }}>{label}</span>;
};
const Sel = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 10 }}>
    {label && <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, background: T.surface, color: T.text, fontFamily: T.font }}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
);
const tbl = { width: '100%', fontSize: 12, borderCollapse: 'collapse', fontFamily: T.font };
const th = { border: `1px solid ${T.border}`, padding: '8px 10px', fontSize: 11, textAlign: 'left', fontWeight: 600, color: T.textSec, background: T.surfaceH, textTransform: 'uppercase', letterSpacing: 0.3 };
const td = { border: `1px solid ${T.border}`, padding: '7px 10px', fontSize: 12, color: T.text };

/* ═══════════════════════════════════════════════════════════════════════════
   STAKEHOLDER GROUPS (8 — ESRS-aligned)
   ═══════════════════════════════════════════════════════════════════════════ */
const STAKEHOLDER_GROUPS = [
  { id:'SH01', name:'Employees & Workers', icon:'\uD83D\uDC77', esrs:'S1', description:'Direct employees, contractors, temporary workers',
    impact_channels:['Working conditions','Health & safety','Pay equity','Career development','Diversity'],
    engagement_mechanisms:['Employee surveys','Works councils','Grievance mechanisms','Town halls'],
    metrics:['Turnover rate','Safety incident rate','Gender pay gap','Training hours','Engagement score'] },
  { id:'SH02', name:'Supply Chain Workers', icon:'\uD83C\uDFED', esrs:'S2', description:'Workers in Tier 1-3 supply chain',
    impact_channels:['Living wage','Forced labour risk','Child labour risk','Working hours','Freedom of association'],
    engagement_mechanisms:['Supplier audits','Certification schemes','Collaborative initiatives'],
    metrics:['Audit coverage %','Violations found','Remediation rate'] },
  { id:'SH03', name:'Local Communities', icon:'\uD83C\uDFD8\uFE0F', esrs:'S3', description:'Communities near operations, affected populations',
    impact_channels:['Land rights','Environmental contamination','Economic displacement','Cultural heritage','Health impacts'],
    engagement_mechanisms:['Community advisory panels','FPIC processes','Impact assessments','Benefit sharing'],
    metrics:['Community investment ($)','Grievances filed','Resettlement cases','Local employment %'] },
  { id:'SH04', name:'Consumers & End-Users', icon:'\uD83D\uDED2', esrs:'S4', description:'Product users, customers, vulnerable consumers',
    impact_channels:['Product safety','Data privacy','Responsible marketing','Accessibility','Health impacts'],
    engagement_mechanisms:['Customer surveys','Product recalls','Complaint mechanisms'],
    metrics:['Customer complaints','Data breaches','Product recalls','NPS score'] },
  { id:'SH05', name:'Investors & Shareholders', icon:'\uD83D\uDCB0', esrs:null, description:'Equity holders, bondholders, LP investors',
    impact_channels:['Financial returns','ESG integration','Climate risk','Governance quality'],
    engagement_mechanisms:['AGMs','Proxy voting','Direct engagement','Stewardship codes'],
    metrics:['TSR','ESG score trend','Proxy voting results','Engagement outcomes'] },
  { id:'SH06', name:'Regulators & Government', icon:'\uD83C\uDFDB\uFE0F', esrs:'G1', description:'National regulators, supranational bodies, tax authorities',
    impact_channels:['Regulatory compliance','Tax contributions','Lobbying','Policy engagement'],
    engagement_mechanisms:['Regulatory filings','Consultations','Industry associations'],
    metrics:['Fines/penalties','Tax paid','Lobbying spend','Compliance rate'] },
  { id:'SH07', name:'Environment & Nature', icon:'\uD83C\uDF0D', esrs:'E1-E5', description:'Ecosystems, biodiversity, climate system, natural resources',
    impact_channels:['GHG emissions','Pollution','Water use','Land use change','Biodiversity loss','Resource depletion'],
    engagement_mechanisms:['Environmental monitoring','Impact assessments','Restoration programs'],
    metrics:['Scope 1+2 emissions','Water withdrawal','Waste generated','Biodiversity impact'] },
  { id:'SH08', name:'Future Generations', icon:'\uD83D\uDC76', esrs:null, description:'Long-term intergenerational equity, climate legacy',
    impact_channels:['Carbon budget overshoot','Resource depletion','Biodiversity loss','Pollution legacy','Climate debt'],
    engagement_mechanisms:['Long-term target setting','Intergenerational equity frameworks'],
    metrics:['Net zero alignment','Carbon budget share','Nature positive status'] },
];

/* ── SDG Cross-Reference ──────────────────────────────────────────────────── */
const SDG_MAP = {
  SH01: ['SDG 3 Good Health','SDG 5 Gender Equality','SDG 8 Decent Work','SDG 10 Reduced Inequalities'],
  SH02: ['SDG 1 No Poverty','SDG 8 Decent Work','SDG 10 Reduced Inequalities','SDG 12 Responsible Consumption'],
  SH03: ['SDG 1 No Poverty','SDG 2 Zero Hunger','SDG 6 Clean Water','SDG 11 Sustainable Cities','SDG 16 Peace & Justice'],
  SH04: ['SDG 3 Good Health','SDG 12 Responsible Consumption','SDG 16 Peace & Justice'],
  SH05: ['SDG 8 Decent Work','SDG 9 Industry & Innovation','SDG 13 Climate Action','SDG 17 Partnerships'],
  SH06: ['SDG 16 Peace & Justice','SDG 17 Partnerships'],
  SH07: ['SDG 6 Clean Water','SDG 7 Clean Energy','SDG 13 Climate Action','SDG 14 Life Below Water','SDG 15 Life on Land'],
  SH08: ['SDG 7 Clean Energy','SDG 13 Climate Action','SDG 14 Life Below Water','SDG 15 Life on Land'],
};

/* ── ESRS Mapping ─────────────────────────────────────────────────────────── */
const ESRS_MAP = [
  { esrs: 'ESRS S1', title: 'Own Workforce', stakeholders: ['SH01'] },
  { esrs: 'ESRS S2', title: 'Workers in Value Chain', stakeholders: ['SH02'] },
  { esrs: 'ESRS S3', title: 'Affected Communities', stakeholders: ['SH03'] },
  { esrs: 'ESRS S4', title: 'Consumers & End-Users', stakeholders: ['SH04'] },
  { esrs: 'ESRS G1', title: 'Business Conduct', stakeholders: ['SH05','SH06'] },
  { esrs: 'ESRS E1', title: 'Climate Change', stakeholders: ['SH07','SH08'] },
  { esrs: 'ESRS E2', title: 'Pollution', stakeholders: ['SH03','SH07'] },
  { esrs: 'ESRS E3', title: 'Water & Marine Resources', stakeholders: ['SH03','SH07'] },
  { esrs: 'ESRS E4', title: 'Biodiversity & Ecosystems', stakeholders: ['SH03','SH07','SH08'] },
  { esrs: 'ESRS E5', title: 'Circular Economy', stakeholders: ['SH04','SH07'] },
];

/* ── Sector Impact Profiles ───────────────────────────────────────────────── */
const SECTOR_PROFILES = {
  Energy:      { SH01:72, SH02:55, SH03:85, SH04:40, SH05:68, SH06:80, SH07:95, SH08:90 },
  Materials:   { SH01:78, SH02:70, SH03:82, SH04:35, SH05:60, SH06:72, SH07:88, SH08:82 },
  Industrials: { SH01:70, SH02:62, SH03:55, SH04:60, SH05:58, SH06:65, SH07:72, SH08:65 },
  Financials:  { SH01:65, SH02:30, SH03:38, SH04:72, SH05:88, SH06:82, SH07:42, SH08:50 },
  Technology:  { SH01:80, SH02:55, SH03:28, SH04:85, SH05:75, SH06:70, SH07:45, SH08:48 },
  Healthcare:  { SH01:72, SH02:50, SH03:42, SH04:92, SH05:70, SH06:78, SH07:48, SH08:55 },
  'Consumer Discretionary': { SH01:60, SH02:78, SH03:35, SH04:80, SH05:62, SH06:58, SH07:55, SH08:50 },
  'Consumer Staples': { SH01:62, SH02:82, SH03:55, SH04:78, SH05:65, SH06:62, SH07:65, SH08:58 },
  'Real Estate': { SH01:55, SH02:40, SH03:75, SH04:50, SH05:72, SH06:68, SH07:70, SH08:65 },
  Utilities:   { SH01:68, SH02:48, SH03:80, SH04:60, SH05:72, SH06:85, SH07:90, SH08:85 },
  Agriculture: { SH01:70, SH02:85, SH03:78, SH04:60, SH05:55, SH06:72, SH07:92, SH08:88 },
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function StakeholderImpactPage() {
  const navigate = useNavigate();

  /* ── Portfolio ──────────────────────────────────────────────────────────── */
  const portfolio = useMemo(() => {
    const saved = loadLS(LS_PORT);
    if (saved?.holdings?.length) return saved.holdings.map(h => {
      const master = GLOBAL_COMPANY_MASTER.find(c => c.isin === h.isin || c.company_name === h.company_name);
      return { ...h, ...master, weight: h.weight_pct || h.weight || 0 };
    });
    return GLOBAL_COMPANY_MASTER.slice(0, 30).map((c, i) => ({ ...c, weight: +(3.33).toFixed(2) }));
  }, []);

  /* ── State ──────────────────────────────────────────────────────────────── */
  const [tab, setTab] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState(portfolio[0]?.company_name || '');
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  /* ── Impact scores per stakeholder group (adjustable) ───────────────────── */
  const [impactScores, setImpactScores] = useState(() => {
    const saved = loadLS(LS_ENGAGE);
    if (saved?.impactScores) return saved.impactScores;
    const init = {};
    STAKEHOLDER_GROUPS.forEach(g => {
      const s = seed(g.id);
      init[g.id] = {
        positive: Math.round(30 + sRand(s) * 50),
        negative: Math.round(15 + sRand(s + 1) * 45),
        influence: Math.round(30 + sRand(s + 2) * 60),
        severity: Math.round(25 + sRand(s + 3) * 55),
      };
    });
    return init;
  });

  /* ── Engagement actions ─────────────────────────────────────────────────── */
  const [actions, setActions] = useState(() => {
    const saved = loadLS(LS_ENGAGE);
    if (saved?.actions) return saved.actions;
    return STAKEHOLDER_GROUPS.map(g => ({
      group_id: g.id,
      action: g.engagement_mechanisms[0] || 'TBD',
      status: ['Planned','Active','Completed'][Math.floor(sRand(seed(g.id) + 10) * 3)],
      owner: ['ESG Team','Compliance','HR','Operations','Procurement','Investor Relations'][Math.floor(sRand(seed(g.id) + 11) * 6)],
      priority: sRand(seed(g.id) + 12) > 0.5 ? 'High' : sRand(seed(g.id) + 12) > 0.25 ? 'Medium' : 'Low',
    }));
  });

  /* ── Persist ────────────────────────────────────────────────────────────── */
  useEffect(() => { saveLS(LS_ENGAGE, { impactScores, actions, timestamp: new Date().toISOString() }); }, [impactScores, actions]);

  /* ── Derived ────────────────────────────────────────────────────────────── */
  const totalPositive = Object.values(impactScores).reduce((s, g) => s + g.positive, 0);
  const totalNegative = Object.values(impactScores).reduce((s, g) => s + g.negative, 0);
  const netImpact = totalPositive - totalNegative;
  const totalChannels = STAKEHOLDER_GROUPS.reduce((s, g) => s + g.impact_channels.length, 0);
  const activeEngagements = actions.filter(a => a.status === 'Active').length;
  const priorityHigh = actions.filter(a => a.priority === 'High').length;
  const dataCoverage = Math.round((STAKEHOLDER_GROUPS.filter(g => impactScores[g.id]?.positive > 0).length / STAKEHOLDER_GROUPS.length) * 100);

  /* ── Impact quantification (USD Mn estimate) ────────────────────────────── */
  const impactQuantification = useMemo(() => {
    return STAKEHOLDER_GROUPS.map(g => {
      const sc = impactScores[g.id] || { positive: 40, negative: 25 };
      const portfolioValue = portfolio.reduce((s, c) => s + (c.market_cap_usd_mn || 5000), 0);
      const posMn = Math.round(portfolioValue * sc.positive * 0.00008);
      const negMn = Math.round(portfolioValue * sc.negative * 0.00006);
      return { ...g, positive_usd_mn: posMn, negative_usd_mn: negMn, net_usd_mn: posMn - negMn };
    });
  }, [impactScores, portfolio]);

  /* ── Radar data ─────────────────────────────────────────────────────────── */
  const radarData = STAKEHOLDER_GROUPS.map(g => ({
    group: g.name.split(' ')[0],
    positive: impactScores[g.id]?.positive || 0,
    negative: impactScores[g.id]?.negative || 0,
    influence: impactScores[g.id]?.influence || 0,
  }));

  /* ── Impact timeline ────────────────────────────────────────────────────── */
  const timelineData = useMemo(() => {
    const years = [2025, 2030, 2035, 2040, 2045, 2050];
    return years.map(y => {
      const row = { year: y };
      STAKEHOLDER_GROUPS.forEach(g => {
        const base = (impactScores[g.id]?.positive || 40) - (impactScores[g.id]?.negative || 25);
        const trend = g.esrs?.startsWith('E') ? 2.5 : g.esrs?.startsWith('S') ? 1.5 : 0.8;
        row[g.id] = clamp(Math.round(base + trend * (y - 2025)), -100, 100);
      });
      return row;
    });
  }, [impactScores]);

  /* ── Sorting ────────────────────────────────────────────────────────────── */
  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('asc'); } };
  const sortIcon = (col) => sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

  /* ── Exports ────────────────────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const rows = [['Group ID','Group Name','ESRS','Positive Score','Negative Score','Net Impact','Influence','Severity','Positive USD Mn','Negative USD Mn']];
    impactQuantification.forEach(g => {
      const sc = impactScores[g.id] || {};
      rows.push([g.id, g.name, g.esrs || 'N/A', sc.positive, sc.negative, sc.positive - sc.negative, sc.influence, sc.severity, g.positive_usd_mn, g.negative_usd_mn]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `stakeholder_impact_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }, [impactQuantification, impactScores]);

  const exportJSON = useCallback(() => {
    const payload = { export_date: new Date().toISOString(), stakeholder_groups: STAKEHOLDER_GROUPS.length, impact_scores: impactScores, actions, quantification: impactQuantification };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'stakeholder_engagement.json'; a.click(); URL.revokeObjectURL(url);
  }, [impactScores, actions, impactQuantification]);

  const handlePrint = useCallback(() => window.print(), []);

  /* ── Company-level profile ──────────────────────────────────────────────── */
  const companyProfile = useMemo(() => {
    if (!selectedCompany) return null;
    const comp = portfolio.find(c => c.company_name === selectedCompany);
    if (!comp) return null;
    const sec = comp.sector || 'Financials';
    const profile = SECTOR_PROFILES[sec] || SECTOR_PROFILES.Financials;
    return STAKEHOLDER_GROUPS.map(g => {
      const base = profile[g.id] || 50;
      const noise = (sRand(seed(selectedCompany + g.id)) - 0.5) * 20;
      return { ...g, impact_score: clamp(Math.round(base + noise), 0, 100), sector: sec };
    });
  }, [selectedCompany, portfolio]);

  const TABS = ['Impact Overview', 'Engagement & Quantification', 'Company View', 'SDG & ESRS Mapping'];

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 28 }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: 0 }}>Stakeholder Impact & Engagement Mapper</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <Badge label="8 Stakeholder Groups" color="navy" />
            <Badge label="ESRS-Aligned" color="sage" />
            <Badge label="Impact Quantification" color="gold" />
            <Badge label={`${portfolio.length} Holdings`} color="blue" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn onClick={exportCSV} small>Export CSV</Btn>
          <Btn onClick={exportJSON} small>Export JSON</Btn>
          <Btn onClick={handlePrint} small>Print</Btn>
        </div>
      </div>

      {/* ── 8 KPI Cards ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 24 }}>
        <KpiCard label="Stakeholder Groups" value={STAKEHOLDER_GROUPS.length} sub="ESRS S1-S4, G1, E1-E5" accent={T.navy} />
        <KpiCard label="Impact Channels" value={totalChannels} sub="Tracked across all groups" accent={T.sage} />
        <KpiCard label="Active Engagements" value={activeEngagements} sub={`of ${actions.length} total`} accent={T.green} />
        <KpiCard label="Positive Impact" value={totalPositive} sub="Aggregate score" accent={T.green} />
        <KpiCard label="Negative Impact" value={totalNegative} sub="Aggregate score" accent={T.red} />
        <KpiCard label="Net Impact Score" value={netImpact > 0 ? `+${netImpact}` : netImpact} sub={netImpact >= 0 ? 'Net positive' : 'Net negative'} accent={netImpact >= 0 ? T.green : T.red} />
        <KpiCard label="Priority Engagements" value={priorityHigh} sub="High priority" accent={T.amber} />
        <KpiCard label="Data Coverage" value={`${dataCoverage}%`} sub="Groups with scores" accent={T.gold} />
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => <Btn key={t} onClick={() => setTab(i)} active={tab === i} small>{t}</Btn>)}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════
         TAB 0: Impact Overview
         ═════════════════════════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <div>
          {/* ── Stakeholder Impact Matrix ────────────────────────────────────── */}
          <Section title="Stakeholder Impact Matrix" badge="8 Groups - Adjustable Scores">
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Adjust positive and negative impact scores per stakeholder group. These feed into quantification, priority, and engagement planning downstream.</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={tbl}>
                <thead>
                  <tr>
                    <th style={th}>Group</th><th style={th}>ESRS</th>
                    <th style={{ ...th, background: '#dcfce7' }}>Positive (0-100)</th>
                    <th style={{ ...th, background: '#fee2e2' }}>Negative (0-100)</th>
                    <th style={th}>Net</th><th style={th}>Influence (0-100)</th><th style={th}>Severity (0-100)</th>
                    <th style={th}>Channels</th>
                  </tr>
                </thead>
                <tbody>
                  {STAKEHOLDER_GROUPS.map(g => {
                    const sc = impactScores[g.id] || { positive: 40, negative: 25, influence: 50, severity: 40 };
                    const net = sc.positive - sc.negative;
                    return (
                      <tr key={g.id}>
                        <td style={{ ...td, fontWeight: 600 }}><span style={{ marginRight: 6 }}>{g.icon}</span>{g.name}</td>
                        <td style={td}>{g.esrs || 'N/A'}</td>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input type="range" min={0} max={100} value={sc.positive} onChange={e => setImpactScores(prev => ({ ...prev, [g.id]: { ...prev[g.id], positive: +e.target.value } }))} style={{ width: 70, accentColor: T.green }} />
                            <span style={{ fontWeight: 700, minWidth: 24, color: T.green }}>{sc.positive}</span>
                          </div>
                        </td>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input type="range" min={0} max={100} value={sc.negative} onChange={e => setImpactScores(prev => ({ ...prev, [g.id]: { ...prev[g.id], negative: +e.target.value } }))} style={{ width: 70, accentColor: T.red }} />
                            <span style={{ fontWeight: 700, minWidth: 24, color: T.red }}>{sc.negative}</span>
                          </div>
                        </td>
                        <td style={{ ...td, fontWeight: 700, color: net >= 0 ? T.green : T.red }}>{net > 0 ? `+${net}` : net}</td>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input type="range" min={0} max={100} value={sc.influence} onChange={e => setImpactScores(prev => ({ ...prev, [g.id]: { ...prev[g.id], influence: +e.target.value } }))} style={{ width: 70, accentColor: T.navy }} />
                            <span style={{ fontWeight: 600, minWidth: 24 }}>{sc.influence}</span>
                          </div>
                        </td>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input type="range" min={0} max={100} value={sc.severity} onChange={e => setImpactScores(prev => ({ ...prev, [g.id]: { ...prev[g.id], severity: +e.target.value } }))} style={{ width: 70, accentColor: T.amber }} />
                            <span style={{ fontWeight: 600, minWidth: 24 }}>{sc.severity}</span>
                          </div>
                        </td>
                        <td style={{ ...td, textAlign: 'center' }}>{g.impact_channels.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── Stakeholder Relevance Radar ──────────────────────────────────── */}
          <Section title="Stakeholder Relevance Radar" badge="8-Axis">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="group" tick={{ fontSize: 11, fill: T.textSec }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Positive Impact" dataKey="positive" stroke={T.green} fill={T.green} fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Negative Impact" dataKey="negative" stroke={T.red} fill={T.red} fillOpacity={0.15} strokeWidth={2} />
                <Radar name="Influence" dataKey="influence" stroke={T.navy} fill={T.navy} fillOpacity={0.1} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Section>

          {/* ── Positive vs Negative Bar Chart ──────────────────────────────── */}
          <Section title="Positive vs Negative Impact by Stakeholder" badge="Comparison">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={STAKEHOLDER_GROUPS.map(g => ({ name: g.name.split(' ')[0], positive: impactScores[g.id]?.positive || 0, negative: -(impactScores[g.id]?.negative || 0) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={0} stroke={T.textMut} />
                <Bar dataKey="positive" name="Positive" fill={T.green} radius={[4, 4, 0, 0]} />
                <Bar dataKey="negative" name="Negative" fill={T.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          {/* ── Engagement Priority Matrix ───────────────────────────────────── */}
          <Section title="Engagement Priority Matrix" badge="Severity x Influence">
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>X = Impact Severity | Y = Stakeholder Influence. Top-right quadrant = highest engagement priority.</div>
            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" dataKey="severity" name="Severity" domain={[0, 100]} label={{ value: 'Impact Severity', position: 'bottom', offset: 10, style: { fontSize: 11 } }} />
                <YAxis type="number" dataKey="influence" name="Influence" domain={[0, 100]} label={{ value: 'Stakeholder Influence', angle: -90, position: 'left', style: { fontSize: 11 } }} />
                <ReferenceLine x={50} stroke={T.amber} strokeDasharray="5 5" />
                <ReferenceLine y={50} stroke={T.amber} strokeDasharray="5 5" />
                <Tooltip content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 12, fontFamily: T.font }}>
                      <div style={{ fontWeight: 700, color: T.navy }}>{d.icon} {d.name}</div>
                      <div>Severity: {d.severity} | Influence: {d.influence}</div>
                      <div style={{ marginTop: 4 }}><Badge label={d.severity >= 50 && d.influence >= 50 ? 'HIGH PRIORITY' : 'Monitor'} color={d.severity >= 50 && d.influence >= 50 ? 'red' : 'gray'} /></div>
                    </div>
                  );
                }} />
                <Scatter data={STAKEHOLDER_GROUPS.map(g => ({ ...g, severity: impactScores[g.id]?.severity || 40, influence: impactScores[g.id]?.influence || 50 }))}>
                  {STAKEHOLDER_GROUPS.map((g, i) => <Cell key={g.id} fill={COLORS[i % COLORS.length]} r={10} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
         TAB 1: Engagement & Quantification
         ═════════════════════════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <div>
          {/* ── Impact Quantification Table ──────────────────────────────────── */}
          <Section title="Impact Quantification" badge="USD Mn Estimates">
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Estimated financial value of positive and negative impacts per stakeholder group, derived from portfolio market cap and impact severity scores.</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={tbl}>
                <thead>
                  <tr>
                    <th style={th}>Stakeholder Group</th>
                    <th style={{ ...th, textAlign: 'right' }}>Positive (USD Mn)</th>
                    <th style={{ ...th, textAlign: 'right' }}>Negative (USD Mn)</th>
                    <th style={{ ...th, textAlign: 'right' }}>Net (USD Mn)</th>
                    <th style={th}>Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  {impactQuantification.map(g => (
                    <tr key={g.id}>
                      <td style={{ ...td, fontWeight: 600 }}>{g.icon} {g.name}</td>
                      <td style={{ ...td, textAlign: 'right', color: T.green, fontWeight: 700 }}>+{fmt(g.positive_usd_mn)}</td>
                      <td style={{ ...td, textAlign: 'right', color: T.red, fontWeight: 700 }}>-{fmt(g.negative_usd_mn)}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: g.net_usd_mn >= 0 ? T.green : T.red }}>{g.net_usd_mn >= 0 ? '+' : ''}{fmt(g.net_usd_mn)}</td>
                      <td style={td}><Badge label={g.net_usd_mn >= 0 ? 'Net Positive' : 'Net Negative'} color={g.net_usd_mn >= 0 ? 'green' : 'red'} /></td>
                    </tr>
                  ))}
                  <tr style={{ background: T.surfaceH, fontWeight: 700 }}>
                    <td style={{ ...td, fontWeight: 700 }}>TOTAL</td>
                    <td style={{ ...td, textAlign: 'right', color: T.green, fontWeight: 700 }}>+{fmt(impactQuantification.reduce((s, g) => s + g.positive_usd_mn, 0))}</td>
                    <td style={{ ...td, textAlign: 'right', color: T.red, fontWeight: 700 }}>-{fmt(impactQuantification.reduce((s, g) => s + g.negative_usd_mn, 0))}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{fmt(impactQuantification.reduce((s, g) => s + g.net_usd_mn, 0))}</td>
                    <td style={td} />
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── Engagement Action Plan ───────────────────────────────────────── */}
          <Section title="Engagement Action Plan" badge="Per Stakeholder Group">
            <div style={{ overflowX: 'auto' }}>
              <table style={tbl}>
                <thead>
                  <tr>
                    <th style={th}>Group</th><th style={th}>Recommended Action</th>
                    <th style={th}>Status</th><th style={th}>Owner</th><th style={th}>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map((a, idx) => {
                    const g = STAKEHOLDER_GROUPS.find(sg => sg.id === a.group_id);
                    return (
                      <tr key={a.group_id}>
                        <td style={{ ...td, fontWeight: 600 }}>{g?.icon} {g?.name}</td>
                        <td style={td}>
                          <select value={a.action} onChange={e => { const newA = [...actions]; newA[idx] = { ...newA[idx], action: e.target.value }; setActions(newA); }} style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 12, background: T.surface, width: '100%' }}>
                            {(g?.engagement_mechanisms || []).map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </td>
                        <td style={td}>
                          <select value={a.status} onChange={e => { const newA = [...actions]; newA[idx] = { ...newA[idx], status: e.target.value }; setActions(newA); }} style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 12, background: T.surface }}>
                            {['Planned','Active','Completed'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td style={td}>{a.owner}</td>
                        <td style={td}><Badge label={a.priority} color={a.priority === 'High' ? 'red' : a.priority === 'Medium' ? 'amber' : 'green'} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── Impact Timeline ──────────────────────────────────────────────── */}
          <Section title="Impact Evolution Timeline (2025-2050)" badge="Net Impact Projection">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis domain={[-50, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={0} stroke={T.textMut} strokeDasharray="3 3" />
                {STAKEHOLDER_GROUPS.slice(0, 6).map((g, i) => (
                  <Area key={g.id} type="monotone" dataKey={g.id} name={g.name.split(' ')[0]} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.1} strokeWidth={2} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          {/* ── Stakeholder Details ──────────────────────────────────────────── */}
          <Section title="Stakeholder Group Details" badge="Channels, Mechanisms, Metrics">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {STAKEHOLDER_GROUPS.map(g => (
                <div key={g.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>{g.icon} {g.name}</div>
                    {g.esrs && <Badge label={g.esrs} color="navy" />}
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{g.description}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>IMPACT CHANNELS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {g.impact_channels.map(c => <Badge key={c} label={c} color="sage" />)}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>KEY METRICS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {g.metrics.map(m => <Badge key={m} label={m} color="blue" />)}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
         TAB 2: Company View
         ═════════════════════════════════════════════════════════════════════════ */}
      {tab === 2 && (
        <div>
          {/* ── Company-Level Stakeholder Profile ───────────────────────────── */}
          <Section title="Company-Level Stakeholder Profile" badge="Individual Holding">
            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 20 }}>
              <div>
                <Sel label="SELECT HOLDING" value={selectedCompany} onChange={setSelectedCompany} options={portfolio.map(c => ({ value: c.company_name, label: c.company_name }))} />
                {selectedCompany && (() => {
                  const c = portfolio.find(p => p.company_name === selectedCompany);
                  return c ? (
                    <div style={{ background: T.surfaceH, borderRadius: 8, padding: 12, fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 6 }}>{c.company_name}</div>
                      <div>Sector: {c.sector || 'N/A'}</div>
                      <div>Weight: {c.weight}%</div>
                      <div>ISIN: {c.isin || 'N/A'}</div>
                    </div>
                  ) : null;
                })()}
              </div>
              <div>
                {companyProfile && (
                  <>
                    <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                      <table style={tbl}>
                        <thead>
                          <tr>
                            <th style={th}>Stakeholder</th><th style={th}>Impact Score</th><th style={th}>Assessment</th><th style={th}>Top Channel</th>
                          </tr>
                        </thead>
                        <tbody>
                          {companyProfile.sort((a, b) => b.impact_score - a.impact_score).map(g => (
                            <tr key={g.id}>
                              <td style={{ ...td, fontWeight: 600 }}>{g.icon} {g.name}</td>
                              <td style={td}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ width: 100, height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{ width: `${g.impact_score}%`, height: '100%', background: g.impact_score >= 70 ? T.red : g.impact_score >= 40 ? T.amber : T.green, borderRadius: 4 }} />
                                  </div>
                                  <span style={{ fontWeight: 700 }}>{g.impact_score}</span>
                                </div>
                              </td>
                              <td style={td}><Badge label={g.impact_score >= 70 ? 'High Impact' : g.impact_score >= 40 ? 'Moderate' : 'Low'} color={g.impact_score >= 70 ? 'red' : g.impact_score >= 40 ? 'amber' : 'green'} /></td>
                              <td style={{ ...td, fontSize: 11 }}>{g.impact_channels[0]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={companyProfile.map(g => ({ group: g.name.split(' ')[0], score: g.impact_score }))}>
                        <PolarGrid stroke={T.border} />
                        <PolarAngleAxis dataKey="group" tick={{ fontSize: 10, fill: T.textSec }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                        <Radar name="Impact Score" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            </div>
          </Section>

          {/* ── Holdings Table ───────────────────────────────────────────────── */}
          <Section title="Holdings Stakeholder Summary" badge="Sortable">
            <div style={{ overflowX: 'auto', maxHeight: 420 }}>
              <table style={tbl}>
                <thead>
                  <tr>
                    {[{ key: 'name', label: 'Company' }, { key: 'sector', label: 'Sector' }, { key: 'weight', label: 'Weight %' }].map(c => (
                      <th key={c.key} style={{ ...th, cursor: 'pointer' }} onClick={() => toggleSort(c.key)}>{c.label}{sortIcon(c.key)}</th>
                    ))}
                    <th style={th}>Top 3 Affected Stakeholders</th>
                    <th style={th}>Net Impact</th>
                    <th style={th}>Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.slice(0, 25).map(c => {
                    const s = seed(c.company_name);
                    const sec = c.sector || 'Financials';
                    const profile = SECTOR_PROFILES[sec] || SECTOR_PROFILES.Financials;
                    const sorted = STAKEHOLDER_GROUPS.map(g => ({ ...g, score: (profile[g.id] || 50) + Math.round((sRand(s + seed(g.id)) - 0.5) * 15) })).sort((a, b) => b.score - a.score);
                    const top3 = sorted.slice(0, 3);
                    const net = Math.round(sRand(s + 100) * 60 - 10);
                    const engStatus = sRand(s + 200) > 0.6 ? 'Active' : sRand(s + 200) > 0.3 ? 'Planned' : 'Minimal';
                    return (
                      <tr key={c.isin || c.company_name}>
                        <td style={{ ...td, fontWeight: 600 }}>{c.company_name}</td>
                        <td style={td}>{c.sector || 'N/A'}</td>
                        <td style={{ ...td, textAlign: 'right' }}>{c.weight?.toFixed(2)}</td>
                        <td style={td}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {top3.map(g => <Badge key={g.id} label={`${g.icon} ${g.name.split(' ')[0]}`} color="navy" />)}
                          </div>
                        </td>
                        <td style={{ ...td, fontWeight: 700, color: net >= 0 ? T.green : T.red }}>{net >= 0 ? `+${net}` : net}</td>
                        <td style={td}><Badge label={engStatus} color={engStatus === 'Active' ? 'green' : engStatus === 'Planned' ? 'amber' : 'gray'} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
         TAB 3: SDG & ESRS Mapping
         ═════════════════════════════════════════════════════════════════════════ */}
      {tab === 3 && (
        <div>
          {/* ── ESRS Stakeholder Mapping ─────────────────────────────────────── */}
          <Section title="ESRS Stakeholder Mapping" badge="Standards to Groups">
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Which ESRS topical standards map to which stakeholder groups. A single standard may affect multiple stakeholder groups.</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={tbl}>
                <thead>
                  <tr>
                    <th style={th}>ESRS Standard</th><th style={th}>Title</th>
                    {STAKEHOLDER_GROUPS.map(g => <th key={g.id} style={{ ...th, textAlign: 'center', fontSize: 10 }}>{g.icon}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {ESRS_MAP.map(e => (
                    <tr key={e.esrs}>
                      <td style={{ ...td, fontWeight: 700 }}>{e.esrs}</td>
                      <td style={td}>{e.title}</td>
                      {STAKEHOLDER_GROUPS.map(g => (
                        <td key={g.id} style={{ ...td, textAlign: 'center', background: e.stakeholders.includes(g.id) ? '#dcfce7' : T.surface }}>
                          {e.stakeholders.includes(g.id) ? '\u2713' : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── SDG Cross-Reference ──────────────────────────────────────────── */}
          <Section title="SDG Cross-Reference" badge="Stakeholder Impacts to SDGs">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {STAKEHOLDER_GROUPS.map(g => (
                <div key={g.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>{g.icon} {g.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(SDG_MAP[g.id] || []).map(sdg => (
                      <Badge key={sdg} label={sdg} color={sdg.includes('Climate') ? 'sage' : sdg.includes('Health') ? 'red' : sdg.includes('Work') ? 'blue' : sdg.includes('Water') ? 'navy' : 'gold'} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Coverage Pie ─────────────────────────────────────────────────── */}
          <Section title="Stakeholder Coverage by ESRS Pillar" badge="Distribution">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={[
                    { name: 'Social (S1-S4)', value: 4, fill: T.navyL },
                    { name: 'Governance (G1)', value: 2, fill: T.gold },
                    { name: 'Environmental (E1-E5)', value: 2, fill: T.sage },
                  ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                    {[T.navyL, T.gold, T.sage].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Engagement Summary</div>
                {['Planned', 'Active', 'Completed'].map(status => {
                  const count = actions.filter(a => a.status === status).length;
                  const color = status === 'Active' ? T.green : status === 'Completed' ? T.sage : T.amber;
                  return (
                    <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
                      <span style={{ fontSize: 12, color: T.textSec, flex: 1 }}>{status}</span>
                      <span style={{ fontWeight: 700, fontSize: 18, color: T.navy }}>{count}</span>
                    </div>
                  );
                })}
                <div style={{ marginTop: 16, fontSize: 12, color: T.textMut }}>
                  Total impact channels tracked: {totalChannels}. Groups with high-priority engagement needs: {priorityHigh}.
                </div>
              </div>
            </div>
          </Section>

          {/* ── Framework Context ────────────────────────────────────────────── */}
          <Section title="Stakeholder Impact in Regulatory Context" badge="CSRD / CSDDD / UNGP">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              {[
                { title: 'CSRD / ESRS', desc: 'Double materiality assessment requires explicit identification of affected stakeholders for each material topic. ESRS S1-S4 provide dedicated stakeholder-specific disclosure requirements.' },
                { title: 'CSDDD (CS3D)', desc: 'Corporate Sustainability Due Diligence Directive requires human rights and environmental due diligence across the value chain, directly engaging affected stakeholders.' },
                { title: 'UN Guiding Principles', desc: 'UNGP framework requires business enterprises to identify and assess actual and potential human rights impacts, consult with affected stakeholders, and provide remedy mechanisms.' },
              ].map(f => (
                <div key={f.title} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ fontWeight: 700, color: T.navy, fontSize: 14, marginBottom: 8 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Sector Impact Heatmap ────────────────────────────────────────── */}
          <Section title="Sector-Stakeholder Impact Heatmap" badge="11 Sectors x 8 Groups">
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Default impact severity scores by sector and stakeholder group. Darker shading indicates higher impact. These benchmarks inform company-level assessments.</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={tbl}>
                <thead>
                  <tr>
                    <th style={th}>Sector</th>
                    {STAKEHOLDER_GROUPS.map(g => <th key={g.id} style={{ ...th, textAlign: 'center', fontSize: 10 }}>{g.icon}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(SECTOR_PROFILES).map(([sec, profile]) => (
                    <tr key={sec}>
                      <td style={{ ...td, fontWeight: 600, fontSize: 11 }}>{sec}</td>
                      {STAKEHOLDER_GROUPS.map(g => {
                        const val = profile[g.id] || 50;
                        const bg = val >= 80 ? '#fee2e2' : val >= 60 ? '#fef3c7' : val >= 40 ? '#fefce8' : '#f0fdf4';
                        return <td key={g.id} style={{ ...td, textAlign: 'center', fontSize: 10, fontWeight: 600, background: bg }}>{val}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: T.textSec }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 14, height: 14, background: '#fee2e2', borderRadius: 3 }} /> High (&ge;80)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 14, height: 14, background: '#fef3c7', borderRadius: 3 }} /> Medium-High (60-79)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 14, height: 14, background: '#fefce8', borderRadius: 3 }} /> Medium (40-59)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 14, height: 14, background: '#f0fdf4', borderRadius: 3 }} /> Low (&lt;40)</div>
            </div>
          </Section>

          {/* ── Grievance & Remedy Tracker ───────────────────────────────────── */}
          <Section title="Grievance & Remedy Mechanism Tracker" badge="Due Diligence">
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Track grievance mechanisms available to each stakeholder group per UNGP Pillar 3 (Access to Remedy) and CSDDD requirements.</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={tbl}>
                <thead>
                  <tr>
                    <th style={th}>Stakeholder</th><th style={th}>Grievance Channel</th><th style={th}>Accessibility</th><th style={th}>Cases Filed (est.)</th><th style={th}>Resolution Rate</th><th style={th}>Avg. Resolution Time</th><th style={th}>UNGP Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {STAKEHOLDER_GROUPS.map(g => {
                    const s = seed(g.id + 'grievance');
                    const cases = Math.round(5 + sRand(s) * 50);
                    const resolution = Math.round(55 + sRand(s + 1) * 40);
                    const days = Math.round(15 + sRand(s + 2) * 60);
                    const channels = ['Hotline','Web portal','Union rep','Community panel','Ombudsperson','Email','In-person'][Math.floor(sRand(s + 3) * 7)];
                    const access = sRand(s + 4) > 0.6 ? 'High' : sRand(s + 4) > 0.3 ? 'Medium' : 'Low';
                    const ungp = resolution >= 80 && access === 'High' ? 'Aligned' : resolution >= 60 ? 'Partially aligned' : 'Gaps identified';
                    return (
                      <tr key={g.id}>
                        <td style={{ ...td, fontWeight: 600 }}>{g.icon} {g.name}</td>
                        <td style={td}>{channels}</td>
                        <td style={td}><Badge label={access} color={access === 'High' ? 'green' : access === 'Medium' ? 'amber' : 'red'} /></td>
                        <td style={{ ...td, textAlign: 'center' }}>{cases}</td>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 50, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${resolution}%`, height: '100%', background: resolution >= 80 ? T.green : resolution >= 60 ? T.amber : T.red, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600 }}>{resolution}%</span>
                          </div>
                        </td>
                        <td style={{ ...td, textAlign: 'center' }}>{days}d</td>
                        <td style={td}><Badge label={ungp} color={ungp === 'Aligned' ? 'green' : ungp.includes('Partial') ? 'amber' : 'red'} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── Impact Materiality Contribution ──────────────────────────────── */}
          <Section title="Impact Materiality Contribution to ESRS Topics" badge="Double Materiality Link">
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Shows how stakeholder impact assessments feed into the ESRS double materiality framework. Each ESRS social/environmental topic is informed by specific stakeholder group impacts.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {ESRS_MAP.filter(e => e.stakeholders.length > 0).map(e => (
                <div key={e.esrs} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>{e.esrs}: {e.title}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {e.stakeholders.map(shId => {
                      const g = STAKEHOLDER_GROUPS.find(sg => sg.id === shId);
                      if (!g) return null;
                      const sc = impactScores[shId] || { positive: 40, negative: 25 };
                      const net = sc.positive - sc.negative;
                      return (
                        <div key={shId} style={{ background: T.surfaceH, borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
                          <span style={{ fontWeight: 600 }}>{g.icon} {g.name.split(' ')[0]}</span>
                          <span style={{ marginLeft: 6, fontWeight: 700, color: net >= 0 ? T.green : T.red }}>{net >= 0 ? '+' : ''}{net}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Engagement Maturity Assessment ──────────────────────────────── */}
          <Section title="Stakeholder Engagement Maturity Assessment" badge="5-Level Model">
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Rate the maturity of engagement with each stakeholder group on a 5-level scale from Reactive (ad-hoc, complaint-driven) to Transformative (co-creation, shared value).</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={tbl}>
                <thead>
                  <tr>
                    <th style={th}>Stakeholder</th>
                    {['1. Reactive','2. Responsive','3. Proactive','4. Strategic','5. Transformative'].map(l => (
                      <th key={l} style={{ ...th, textAlign: 'center', fontSize: 10 }}>{l}</th>
                    ))}
                    <th style={th}>Current Level</th>
                  </tr>
                </thead>
                <tbody>
                  {STAKEHOLDER_GROUPS.map(g => {
                    const s = seed(g.id + 'maturity');
                    const level = Math.floor(1 + sRand(s) * 4.99);
                    return (
                      <tr key={g.id}>
                        <td style={{ ...td, fontWeight: 600 }}>{g.icon} {g.name.split(' & ')[0]}</td>
                        {[1,2,3,4,5].map(l => (
                          <td key={l} style={{ ...td, textAlign: 'center', background: l <= level ? (l >= 4 ? '#dcfce7' : l >= 2 ? '#fef3c7' : '#fee2e2') : T.surface }}>
                            {l <= level ? '\u2588' : '\u2591'}
                          </td>
                        ))}
                        <td style={{ ...td, fontWeight: 700, textAlign: 'center' }}>
                          <Badge label={['','Reactive','Responsive','Proactive','Strategic','Transformative'][level]} color={level >= 4 ? 'green' : level >= 2 ? 'amber' : 'red'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      )}

      {/* ── Cross-Navigation ──────────────────────────────────────────────── */}
      <div style={{ marginTop: 32, paddingTop: 20, borderTop: `2px solid ${T.border}`, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: T.textMut, alignSelf: 'center' }}>Navigate to:</span>
        {[
          { label: 'Double Materiality', path: '/double-materiality' },
          { label: 'Human Rights (CSDDD)', path: '/csddd-compliance' },
          { label: 'Board Diversity', path: '/ai-governance' },
          { label: 'Stewardship Tracker', path: '/stewardship-tracker' },
          { label: 'TNFD / LEAP', path: '/corporate-nature-strategy' },
          { label: 'Living Wage', path: '/social-bond' },
          { label: 'Supply Chain', path: '/supply-chain-map' },
        ].map(n => <Btn key={n.path} onClick={() => navigate(n.path)} small>{n.label}</Btn>)}
      </div>
    </div>
  );
}
