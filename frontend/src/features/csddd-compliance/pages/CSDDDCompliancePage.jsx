import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const PIE_COLORS = [T.navy, T.gold, T.sage, T.red, T.amber, '#7c3aed', '#0d9488', '#ec4899'];

/* ══════════════════════════════════════════════════════════════
   CSDDD REQUIREMENTS — 20 requirements across 6 articles
   ══════════════════════════════════════════════════════════════ */
const CSDDD_REQUIREMENTS = [
  { id: 'R01', article: 'Art. 6', category: 'Risk Identification', requirement: 'Map own operations for actual/potential adverse impacts', criticality: 'P1', evidence_needed: 'Impact assessment report' },
  { id: 'R02', article: 'Art. 6', category: 'Risk Identification', requirement: 'Map direct business partners (Tier 1) for adverse impacts', criticality: 'P1', evidence_needed: 'Supplier ESG assessment' },
  { id: 'R03', article: 'Art. 6', category: 'Risk Identification', requirement: 'Map indirect business partners (Tier 2+) where risk indicators exist', criticality: 'P1', evidence_needed: 'Risk-based Tier 2 assessment' },
  { id: 'R04', article: 'Art. 6', category: 'Risk Identification', requirement: 'Assess severity and likelihood of identified impacts', criticality: 'P1', evidence_needed: 'Risk matrix with scoring' },
  { id: 'R05', article: 'Art. 6', category: 'Risk Identification', requirement: 'Prioritize impacts based on severity and likelihood', criticality: 'P2', evidence_needed: 'Prioritization methodology' },
  { id: 'R06', article: 'Art. 7', category: 'Prevention & Mitigation', requirement: 'Develop prevention action plan for potential adverse impacts', criticality: 'P1', evidence_needed: 'Prevention action plan document' },
  { id: 'R07', article: 'Art. 7', category: 'Prevention & Mitigation', requirement: 'Seek contractual assurances from direct business partners', criticality: 'P1', evidence_needed: 'Supplier contracts with CSDDD clauses' },
  { id: 'R08', article: 'Art. 7', category: 'Prevention & Mitigation', requirement: 'Make necessary investments to prevent impacts', criticality: 'P2', evidence_needed: 'Investment records / CapEx for compliance' },
  { id: 'R09', article: 'Art. 8', category: 'Prevention & Mitigation', requirement: 'Take appropriate measures to bring actual adverse impacts to an end', criticality: 'P1', evidence_needed: 'Remediation action log' },
  { id: 'R10', article: 'Art. 8', category: 'Prevention & Mitigation', requirement: 'Where impact cannot be ended, minimize extent', criticality: 'P1', evidence_needed: 'Mitigation evidence' },
  { id: 'R11', article: 'Art. 9', category: 'Grievance Mechanism', requirement: 'Establish complaints procedure for affected persons', criticality: 'P1', evidence_needed: 'Grievance mechanism documentation' },
  { id: 'R12', article: 'Art. 9', category: 'Grievance Mechanism', requirement: 'Ensure mechanism is accessible, predictable, transparent', criticality: 'P2', evidence_needed: 'Accessibility audit report' },
  { id: 'R13', article: 'Art. 9', category: 'Grievance Mechanism', requirement: 'Allow submission of concerns anonymously or confidentially', criticality: 'P2', evidence_needed: 'Anonymous submission channel evidence' },
  { id: 'R14', article: 'Art. 10', category: 'Monitoring', requirement: 'Conduct periodic assessments of own operations and measures', criticality: 'P2', evidence_needed: 'Annual assessment reports' },
  { id: 'R15', article: 'Art. 10', category: 'Monitoring', requirement: 'Assess effectiveness of measures taken re: partners', criticality: 'P2', evidence_needed: 'Partner monitoring reports' },
  { id: 'R16', article: 'Art. 10', category: 'Monitoring', requirement: 'Carry out appropriate verification including audits', criticality: 'P2', evidence_needed: 'Third-party audit reports' },
  { id: 'R17', article: 'Art. 11', category: 'Communication', requirement: 'Publish annual statement on due diligence (website)', criticality: 'P1', evidence_needed: 'Published due diligence statement URL' },
  { id: 'R18', article: 'Art. 15', category: 'Climate Transition Plan', requirement: 'Adopt plan ensuring business model is Paris-compatible', criticality: 'P1', evidence_needed: 'Board-approved transition plan' },
  { id: 'R19', article: 'Art. 15', category: 'Climate Transition Plan', requirement: 'Include time-bound GHG reduction targets (2030, 2050)', criticality: 'P1', evidence_needed: 'SBTi or equivalent target documentation' },
  { id: 'R20', article: 'Art. 15', category: 'Climate Transition Plan', requirement: 'Describe decarbonisation levers and implementation actions', criticality: 'P2', evidence_needed: 'Transition plan with action items' },
];

const CATEGORIES = [...new Set(CSDDD_REQUIREMENTS.map(r => r.category))];
const ARTICLES = [...new Set(CSDDD_REQUIREMENTS.map(r => r.article))];
const STATUS_OPTIONS = ['Compliant', 'Partial', 'Gap', 'N/A'];
const STATUS_COLORS = { Compliant: T.green, Partial: T.amber, Gap: T.red, 'N/A': T.textMut };

/* ══════════════════════════════════════════════════════════════
   CSDDD PHASING THRESHOLDS
   ══════════════════════════════════════════════════════════════ */
const CSDDD_PHASES = [
  { phase: 'Phase 1 (2027)', employees: 5000, turnover_mn: 1500, label: '>5,000 emp & >EUR 1.5B' },
  { phase: 'Phase 2 (2028)', employees: 3000, turnover_mn: 900, label: '>3,000 emp & >EUR 900M' },
  { phase: 'Phase 3 (2029)', employees: 1000, turnover_mn: 450, label: '>1,000 emp & >EUR 450M' },
];

/* ══════════════════════════════════════════════════════════════
   EUDR COMPLIANCE CHECKLIST (for supply chain cross-ref)
   ══════════════════════════════════════════════════════════════ */
const SUPPLY_CHAIN_TIERS = ['Tier 1 — Direct suppliers', 'Tier 2 — Sub-suppliers', 'Tier 3 — Raw material origins'];

/* ══════════════════════════════════════════════════════════════
   HELPER: deterministic pseudo-random
   ══════════════════════════════════════════════════════════════ */
const seed = (s) => { let x = Math.sin(s * 2.7183 + 1) * 10000; return x - Math.floor(x); };

/* ══════════════════════════════════════════════════════════════
   UI PRIMITIVES
   ══════════════════════════════════════════════════════════════ */
const Card = ({ children, style }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, ...style }}>{children}</div>
);
const KpiCard = ({ label, value, sub, color }) => (
  <Card>
    <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.font, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.font }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textMut, fontFamily: T.font, marginTop: 2 }}>{sub}</div>}
  </Card>
);
const Badge = ({ label, color }) => (
  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: color ? `${color}18` : `${T.navy}15`, color: color || T.navy, fontFamily: T.font }}>{label}</span>
);
const Section = ({ title, sub, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, fontFamily: T.font }}>{title}</div>
      {sub && <span style={{ fontSize: 12, color: T.textMut, fontFamily: T.font }}>{sub}</span>}
    </div>
    {children}
  </div>
);
const Btn = ({ children, onClick, variant, style }) => (
  <button onClick={onClick} style={{ padding: '8px 18px', borderRadius: 8, border: variant === 'outline' ? `1px solid ${T.border}` : 'none', background: variant === 'outline' ? T.surface : T.navy, color: variant === 'outline' ? T.navy : '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.font, ...style }}>{children}</button>
);
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, background: T.surfaceH, borderRadius: 10, padding: 3, marginBottom: 20 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: 'none', background: active === t ? T.surface : 'transparent', color: active === t ? T.navy : T.textSec, fontWeight: active === t ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: T.font, boxShadow: active === t ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>{t}</button>
    ))}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function CSDDDCompliancePage() {
  const navigate = useNavigate();

  /* ── Portfolio ── */
  const portfolio = useMemo(() => {
    try {
      const saved = localStorage.getItem('ra_portfolio_v1');
      const { portfolios, activePortfolio } = saved ? JSON.parse(saved) : { portfolios: {}, activePortfolio: null };
      const holdings = portfolios?.[activePortfolio]?.holdings || [];
      return holdings.map(h => {
        const master = GLOBAL_COMPANY_MASTER.find(c => c.id === h.id || c.ticker === h.ticker);
        return master ? { ...master, weight: h.weight || 0 } : null;
      }).filter(Boolean);
    } catch { return []; }
  }, []);

  /* ── Compliance state persisted to localStorage ── */
  const [complianceState, setComplianceState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ra_csddd_compliance_v1') || '{}');
      const state = {};
      CSDDD_REQUIREMENTS.forEach(r => {
        state[r.id] = saved[r.id] || { status: 'Gap', evidence: '', notes: '' };
      });
      return state;
    } catch {
      const state = {};
      CSDDD_REQUIREMENTS.forEach(r => { state[r.id] = { status: 'Gap', evidence: '', notes: '' }; });
      return state;
    }
  });

  const persistCompliance = useCallback((next) => {
    setComplianceState(next);
    localStorage.setItem('ra_csddd_compliance_v1', JSON.stringify(next));
  }, []);

  const updateReq = useCallback((id, field, val) => {
    persistCompliance(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  }, [persistCompliance]);

  /* ── Action items state ── */
  const [actions, setActions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_csddd_actions_v1') || '[]'); } catch { return []; }
  });
  const persistActions = useCallback((next) => {
    setActions(next);
    localStorage.setItem('ra_csddd_actions_v1', JSON.stringify(next));
  }, []);
  const addAction = useCallback(() => {
    persistActions([...actions, { id: Date.now(), reqId: 'R01', owner: '', dueDate: '', priority: 'P1', status: 'Open', description: '' }]);
  }, [actions, persistActions]);
  const updateAction = useCallback((id, field, val) => {
    persistActions(actions.map(a => a.id === id ? { ...a, [field]: val } : a));
  }, [actions, persistActions]);
  const removeAction = useCallback((id) => {
    persistActions(actions.filter(a => a.id !== id));
  }, [actions, persistActions]);

  /* ── UI state ── */
  const [tab, setTab] = useState('Overview');
  const [expandedArticle, setExpandedArticle] = useState(null);
  const [catFilter, setCatFilter] = useState('All');
  const [critFilter, setCritFilter] = useState('All');

  /* ── Derived metrics ── */
  const metrics = useMemo(() => {
    const total = CSDDD_REQUIREMENTS.length;
    const compliant = CSDDD_REQUIREMENTS.filter(r => complianceState[r.id]?.status === 'Compliant').length;
    const partial = CSDDD_REQUIREMENTS.filter(r => complianceState[r.id]?.status === 'Partial').length;
    const gaps = CSDDD_REQUIREMENTS.filter(r => complianceState[r.id]?.status === 'Gap').length;
    const na = CSDDD_REQUIREMENTS.filter(r => complianceState[r.id]?.status === 'N/A').length;
    const p1Gaps = CSDDD_REQUIREMENTS.filter(r => r.criticality === 'P1' && complianceState[r.id]?.status === 'Gap').length;
    const climateReqs = CSDDD_REQUIREMENTS.filter(r => r.category === 'Climate Transition Plan');
    const climateCompliant = climateReqs.filter(r => complianceState[r.id]?.status === 'Compliant').length;
    const applicable = total - na;
    const compliancePct = applicable > 0 ? Math.round((compliant / applicable) * 100) : 0;
    const partialPct = applicable > 0 ? Math.round((partial / applicable) * 100) : 0;
    return { total, compliant, partial, gaps, na, p1Gaps, climateCompliant, climateTotal: climateReqs.length, compliancePct, partialPct, applicable };
  }, [complianceState]);

  /* ── Category breakdown for stacked bar ── */
  const categoryData = useMemo(() => {
    return CATEGORIES.map(cat => {
      const reqs = CSDDD_REQUIREMENTS.filter(r => r.category === cat);
      return {
        category: cat.length > 18 ? cat.substring(0, 16) + '..' : cat,
        fullName: cat,
        Compliant: reqs.filter(r => complianceState[r.id]?.status === 'Compliant').length,
        Partial: reqs.filter(r => complianceState[r.id]?.status === 'Partial').length,
        Gap: reqs.filter(r => complianceState[r.id]?.status === 'Gap').length,
        'N/A': reqs.filter(r => complianceState[r.id]?.status === 'N/A').length,
        total: reqs.length,
      };
    });
  }, [complianceState]);

  /* ── Portfolio phasing ── */
  const phasedCompanies = useMemo(() => {
    return portfolio.map(c => {
      const employees = c.employees || Math.round(seed(c.id?.charCodeAt?.(0) || 1) * 15000 + 500);
      const turnover = c.revenue_usd_mn || Math.round(seed((c.id?.charCodeAt?.(1) || 2) + 10) * 3000 + 100);
      let phase = 'Not in scope';
      for (const p of CSDDD_PHASES) {
        if (employees >= p.employees && turnover >= p.turnover_mn) { phase = p.phase; break; }
      }
      const hasSBTi = seed((c.id?.charCodeAt?.(2) || 3) + 5) > 0.55;
      const hasNZTarget = seed((c.id?.charCodeAt?.(3) || 4) + 7) > 0.45;
      const transitionScore = Math.round(seed((c.id?.charCodeAt?.(0) || 1) + 20) * 40 + 30);
      return { ...c, employees, turnover, phase, hasSBTi, hasNZTarget, transitionScore };
    });
  }, [portfolio]);

  /* ── Penalty exposure ── */
  const penaltyExposure = useMemo(() => {
    const gapFraction = metrics.applicable > 0 ? metrics.gaps / metrics.applicable : 0;
    const totalRevenue = phasedCompanies.reduce((s, c) => s + (c.turnover || 0), 0);
    const maxPenalty = totalRevenue * 0.05;
    const estimatedPenalty = maxPenalty * gapFraction;
    return { totalRevenue, maxPenalty, estimatedPenalty, gapFraction };
  }, [metrics, phasedCompanies]);

  /* ── Climate transition scoring ── */
  const climateData = useMemo(() => {
    const withSBTi = phasedCompanies.filter(c => c.hasSBTi).length;
    const withNZ = phasedCompanies.filter(c => c.hasNZTarget).length;
    const avgScore = phasedCompanies.length > 0 ? Math.round(phasedCompanies.reduce((s, c) => s + c.transitionScore, 0) / phasedCompanies.length) : 0;
    return { withSBTi, withNZ, avgScore, total: phasedCompanies.length };
  }, [phasedCompanies]);

  /* ── Peer comparison radar data ── */
  const peerRadar = useMemo(() => {
    return CATEGORIES.map(cat => {
      const reqs = CSDDD_REQUIREMENTS.filter(r => r.category === cat);
      const score = reqs.length > 0 ? Math.round((reqs.filter(r => complianceState[r.id]?.status === 'Compliant' || complianceState[r.id]?.status === 'Partial').length / reqs.length) * 100) : 0;
      const peerAvg = Math.round(seed(cat.charCodeAt(0) + cat.charCodeAt(1)) * 40 + 35);
      return { category: cat.length > 14 ? cat.substring(0, 12) + '..' : cat, Portfolio: score, 'Sector Avg': peerAvg };
    });
  }, [complianceState]);

  /* ── Filtered requirements ── */
  const filteredReqs = useMemo(() => {
    return CSDDD_REQUIREMENTS.filter(r => {
      if (catFilter !== 'All' && r.category !== catFilter) return false;
      if (critFilter !== 'All' && r.criticality !== critFilter) return false;
      return true;
    });
  }, [catFilter, critFilter]);

  /* ── Supply chain tier assessment ── */
  const supplyChainTiers = useMemo(() => {
    return SUPPLY_CHAIN_TIERS.map((tier, i) => {
      const assessed = Math.round(seed(i + 100) * 60 + (i === 0 ? 30 : i === 1 ? 10 : 2));
      const total = i === 0 ? 100 : i === 1 ? 250 : 500;
      return { tier, assessed, total, pct: Math.round((assessed / total) * 100) };
    });
  }, []);

  /* ── Export handlers ── */
  const exportCSV = useCallback(() => {
    const headers = ['ID', 'Article', 'Category', 'Requirement', 'Criticality', 'Status', 'Evidence', 'Notes'];
    const rows = CSDDD_REQUIREMENTS.map(r => {
      const s = complianceState[r.id] || {};
      return [r.id, r.article, r.category, `"${r.requirement}"`, r.criticality, s.status || 'Gap', `"${s.evidence || ''}"`, `"${s.notes || ''}"` ];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'csddd_compliance_report.csv'; a.click();
  }, [complianceState]);

  const exportJSON = useCallback(() => {
    const data = CSDDD_REQUIREMENTS.map(r => ({ ...r, ...complianceState[r.id] }));
    const blob = new Blob([JSON.stringify({ exportDate: new Date().toISOString(), requirements: data, metrics, actions }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'csddd_assessment.json'; a.click();
  }, [complianceState, metrics, actions]);

  const handlePrint = useCallback(() => window.print(), []);

  /* ── Empty portfolio guard ── */
  if (portfolio.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card style={{ textAlign: 'center', maxWidth: 480, padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>CSDDD</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.navy, marginBottom: 8 }}>No Portfolio Loaded</div>
          <div style={{ fontSize: 14, color: T.textSec, marginBottom: 20 }}>Build a portfolio in the Portfolio Manager to assess CSDDD compliance across your holdings.</div>
          <Btn onClick={() => navigate('/portfolio-manager')}>Open Portfolio Manager</Btn>
        </Card>
      </div>
    );
  }

  const TABS = ['Overview', 'Requirements', 'Articles', 'Penalties', 'Timeline', 'Supply Chain', 'Climate Plan', 'Peers', 'Actions'];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      {/* ── HEADER ── */}
      <div style={{ background: T.navy, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>CSDDD Compliance Toolkit</span>
            <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: `${T.gold}30`, color: T.goldL }}>EU Directive</span>
            <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: `${T.sage}30`, color: T.sageL }}>20 Requirements</span>
            <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.8)' }}>6 Articles</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>Corporate Sustainability Due Diligence Directive | {portfolio.length} holdings</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="outline" onClick={exportCSV} style={{ borderColor: 'rgba(255,255,255,.25)', color: '#fff', background: 'transparent' }}>Export CSV</Btn>
          <Btn variant="outline" onClick={exportJSON} style={{ borderColor: 'rgba(255,255,255,.25)', color: '#fff', background: 'transparent' }}>Export JSON</Btn>
          <Btn variant="outline" onClick={handlePrint} style={{ borderColor: 'rgba(255,255,255,.25)', color: '#fff', background: 'transparent' }}>Print</Btn>
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {/* ══════════════════════════════════════════════════════════
            TAB: OVERVIEW
            ══════════════════════════════════════════════════════════ */}
        {tab === 'Overview' && (
          <>
            {/* KPI Cards */}
            <Section title="Compliance Overview" sub="Portfolio-level CSDDD readiness">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
                <KpiCard label="Total Requirements" value={metrics.total} sub="Across 6 articles" />
                <KpiCard label="Compliant" value={`${metrics.compliancePct}%`} sub={`${metrics.compliant} of ${metrics.applicable}`} color={T.green} />
                <KpiCard label="Partial" value={`${metrics.partialPct}%`} sub={`${metrics.partial} requirements`} color={T.amber} />
                <KpiCard label="Gaps" value={metrics.gaps} sub="Requiring action" color={T.red} />
                <KpiCard label="P1 Gaps" value={metrics.p1Gaps} sub="Critical priority" color={T.red} />
                <KpiCard label="Climate Plan" value={`${metrics.climateCompliant}/${metrics.climateTotal}`} sub="Art. 15 compliant" color={T.sage} />
              </div>
            </Section>

            {/* Stacked BarChart — Compliance by Category */}
            <Section title="Compliance Progress by Category" sub="Stacked requirement status">
              <Card>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
                    <YAxis dataKey="category" type="category" width={130} tick={{ fontSize: 11, fill: T.text }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Compliant" stackId="a" fill={T.green} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Partial" stackId="a" fill={T.amber} />
                    <Bar dataKey="Gap" stackId="a" fill={T.red} />
                    <Bar dataKey="N/A" stackId="a" fill={T.textMut} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>

            {/* Status donut */}
            <Section title="Overall Status Distribution">
              <Card style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Compliant', value: metrics.compliant },
                      { name: 'Partial', value: metrics.partial },
                      { name: 'Gap', value: metrics.gaps },
                      { name: 'N/A', value: metrics.na },
                    ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" stroke="none">
                      {[T.green, T.amber, T.red, T.textMut].map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, fontFamily: T.font }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  {[{ l: 'Compliant', v: metrics.compliant, c: T.green }, { l: 'Partial', v: metrics.partial, c: T.amber }, { l: 'Gap', v: metrics.gaps, c: T.red }, { l: 'N/A', v: metrics.na, c: T.textMut }].map(d => (
                    <div key={d.l} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: d.c }} />
                      <span style={{ fontSize: 13, color: T.text, fontWeight: 600, minWidth: 80 }}>{d.l}</span>
                      <span style={{ fontSize: 13, color: T.textSec }}>{d.v} requirements</span>
                    </div>
                  ))}
                </div>
              </Card>
            </Section>

            {/* Compliance readiness summary by priority */}
            <Section title="Readiness by Priority Level">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {['P1', 'P2'].map(p => {
                  const reqs = CSDDD_REQUIREMENTS.filter(r => r.criticality === p);
                  const comp = reqs.filter(r => complianceState[r.id]?.status === 'Compliant').length;
                  const part = reqs.filter(r => complianceState[r.id]?.status === 'Partial').length;
                  const gap = reqs.filter(r => complianceState[r.id]?.status === 'Gap').length;
                  const pct = reqs.length > 0 ? Math.round(((comp + part * 0.5) / reqs.length) * 100) : 0;
                  return (
                    <Card key={p} style={{ borderLeft: `4px solid ${p === 'P1' ? T.red : T.amber}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{p === 'P1' ? 'Critical Priority (P1)' : 'Standard Priority (P2)'}</div>
                          <div style={{ fontSize: 12, color: T.textMut }}>{reqs.length} requirements</div>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: pct >= 60 ? T.green : pct >= 30 ? T.amber : T.red }}>{pct}%</div>
                      </div>
                      <div style={{ height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 60 ? T.green : pct >= 30 ? T.amber : T.red, borderRadius: 4 }} />
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                        <span style={{ color: T.green, fontWeight: 600 }}>Compliant: {comp}</span>
                        <span style={{ color: T.amber, fontWeight: 600 }}>Partial: {part}</span>
                        <span style={{ color: T.red, fontWeight: 600 }}>Gap: {gap}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Section>

            {/* Key risk areas */}
            <Section title="Key Risk Areas">
              <Card>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {[
                    { area: 'Human Rights', desc: 'Forced labour, child labour, unsafe working conditions in value chain', articles: 'Art. 6-8', icon: 'HR' },
                    { area: 'Environmental', desc: 'Pollution, biodiversity loss, excessive water use, deforestation', articles: 'Art. 6-8', icon: 'ENV' },
                    { area: 'Climate', desc: 'Paris-incompatible business model, insufficient decarbonisation', articles: 'Art. 15', icon: 'CLM' },
                    { area: 'Governance', desc: 'Lack of grievance mechanism, insufficient monitoring, weak oversight', articles: 'Art. 9-10', icon: 'GOV' },
                    { area: 'Supply Chain', desc: 'Tier 2-3 blind spots, missing contractual assurances, cascade failure', articles: 'Art. 7', icon: 'SC' },
                    { area: 'Transparency', desc: 'No public DD statement, insufficient reporting, data gaps', articles: 'Art. 11', icon: 'TRN' },
                  ].map((r, i) => (
                    <div key={i} style={{ padding: 14, background: T.surfaceH, borderRadius: 8, border: `1px solid ${T.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 6, background: `${T.navy}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: T.navy }}>{r.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{r.area}</span>
                      </div>
                      <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5, marginBottom: 6 }}>{r.desc}</div>
                      <Badge label={r.articles} />
                    </div>
                  ))}
                </div>
              </Card>
            </Section>

            {/* Cross-nav */}
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="outline" onClick={() => navigate('/supply-chain-map')}>Supply Chain Map</Btn>
              <Btn variant="outline" onClick={() => navigate('/regulatory-gap')}>Regulatory Gap Analysis</Btn>
              <Btn variant="outline" onClick={() => navigate('/deforestation-risk')}>Deforestation Risk</Btn>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: REQUIREMENTS TABLE
            ══════════════════════════════════════════════════════════ */}
        {tab === 'Requirements' && (
          <Section title="Interactive Requirements Table" sub="Track compliance per requirement">
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, background: T.surface }}>
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={critFilter} onChange={e => setCritFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, background: T.surface }}>
                <option value="All">All Priorities</option>
                <option value="P1">P1 — Critical</option>
                <option value="P2">P2 — Standard</option>
              </select>
              <span style={{ fontSize: 12, color: T.textMut, alignSelf: 'center' }}>Showing {filteredReqs.length} of {CSDDD_REQUIREMENTS.length}</span>
            </div>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: T.font }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      {['ID', 'Article', 'Category', 'Requirement', 'Priority', 'Status', 'Evidence', 'Notes'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReqs.map(r => {
                      const st = complianceState[r.id] || {};
                      return (
                        <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: T.navy, whiteSpace: 'nowrap' }}>{r.id}</td>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}><Badge label={r.article} /></td>
                          <td style={{ padding: '10px 12px', fontSize: 12, color: T.textSec, whiteSpace: 'nowrap' }}>{r.category}</td>
                          <td style={{ padding: '10px 12px', maxWidth: 280, lineHeight: 1.4 }}>{r.requirement}</td>
                          <td style={{ padding: '10px 12px' }}><Badge label={r.criticality} color={r.criticality === 'P1' ? T.red : T.amber} /></td>
                          <td style={{ padding: '10px 12px' }}>
                            <select value={st.status || 'Gap'} onChange={e => updateReq(r.id, 'status', e.target.value)} style={{ padding: '5px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, background: `${STATUS_COLORS[st.status || 'Gap']}12`, color: STATUS_COLORS[st.status || 'Gap'], fontWeight: 600, cursor: 'pointer' }}>
                              {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <input value={st.evidence || ''} onChange={e => updateReq(r.id, 'evidence', e.target.value)} placeholder={r.evidence_needed} style={{ width: 180, padding: '5px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, background: T.surface }} />
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <input value={st.notes || ''} onChange={e => updateReq(r.id, 'notes', e.target.value)} placeholder="Notes..." style={{ width: 140, padding: '5px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, background: T.surface }} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: ARTICLE-BY-ARTICLE WALKTHROUGH
            ══════════════════════════════════════════════════════════ */}
        {tab === 'Articles' && (
          <Section title="Article-by-Article Walkthrough" sub="Expandable CSDDD article review">
            {ARTICLES.map(art => {
              const reqs = CSDDD_REQUIREMENTS.filter(r => r.article === art);
              const compliant = reqs.filter(r => complianceState[r.id]?.status === 'Compliant').length;
              const isOpen = expandedArticle === art;
              const pct = reqs.length > 0 ? Math.round((compliant / reqs.length) * 100) : 0;
              const artTitle = art === 'Art. 6' ? 'Risk Identification' : art === 'Art. 7' ? 'Prevention of Potential Impacts' : art === 'Art. 8' ? 'Mitigation of Actual Impacts' : art === 'Art. 9' ? 'Grievance Mechanism' : art === 'Art. 10' ? 'Monitoring' : art === 'Art. 11' ? 'Communication' : 'Climate Transition Plan';
              return (
                <Card key={art} style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => setExpandedArticle(isOpen ? null : art)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{art}</span>
                      <span style={{ fontSize: 14, color: T.textSec }}>{artTitle}</span>
                      <Badge label={`${reqs.length} requirements`} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 120, height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 70 ? T.green : pct >= 40 ? T.amber : T.red, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: pct >= 70 ? T.green : pct >= 40 ? T.amber : T.red }}>{pct}%</span>
                      <span style={{ fontSize: 18, color: T.textMut, transform: isOpen ? 'rotate(180deg)' : 'none', transition: '.2s' }}>V</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 16 }} onClick={e => e.stopPropagation()}>
                      {reqs.map(r => {
                        const st = complianceState[r.id] || {};
                        return (
                          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${T.surfaceH}` }}>
                            <span style={{ fontWeight: 700, color: T.navy, minWidth: 40 }}>{r.id}</span>
                            <Badge label={r.criticality} color={r.criticality === 'P1' ? T.red : T.amber} />
                            <span style={{ flex: 1, fontSize: 13, color: T.text }}>{r.requirement}</span>
                            <select value={st.status || 'Gap'} onChange={e => updateReq(r.id, 'status', e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, background: `${STATUS_COLORS[st.status || 'Gap']}12`, color: STATUS_COLORS[st.status || 'Gap'], fontWeight: 600 }}>
                              {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                        );
                      })}
                      {art === 'Art. 15' && (
                        <div style={{ marginTop: 12, padding: 14, background: `${T.sage}08`, borderRadius: 8, border: `1px solid ${T.sage}25` }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.sage, marginBottom: 6 }}>Auto-Assessment (Art. 15)</div>
                          <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
                            Portfolio SBTi adoption: {climateData.withSBTi}/{climateData.total} holdings | Net-Zero targets: {climateData.withNZ}/{climateData.total} | Avg transition score: {climateData.avgScore}/100
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: PENALTY RISK CALCULATOR
            ══════════════════════════════════════════════════════════ */}
        {tab === 'Penalties' && (
          <Section title="Penalty Risk Calculator" sub="CSDDD penalties: up to 5% of global net turnover">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              <KpiCard label="Total Portfolio Revenue" value={`EUR ${(penaltyExposure.totalRevenue / 1000).toFixed(1)}B`} sub="Aggregate net turnover" />
              <KpiCard label="Max Penalty Exposure (5%)" value={`EUR ${(penaltyExposure.maxPenalty / 1000).toFixed(1)}B`} sub="Theoretical maximum" color={T.red} />
              <KpiCard label="Estimated Exposure" value={`EUR ${penaltyExposure.estimatedPenalty.toFixed(0)}M`} sub={`Based on ${(penaltyExposure.gapFraction * 100).toFixed(0)}% gap rate`} color={T.amber} />
              <KpiCard label="Gap Rate" value={`${(penaltyExposure.gapFraction * 100).toFixed(1)}%`} sub="Non-compliant requirements" color={penaltyExposure.gapFraction > 0.5 ? T.red : T.amber} />
            </div>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Penalty Exposure by Compliance Level</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { scenario: 'Current State', exposure: Math.round(penaltyExposure.estimatedPenalty) },
                  { scenario: 'After P1 Fixes', exposure: Math.round(penaltyExposure.estimatedPenalty * 0.45) },
                  { scenario: 'After All Fixes', exposure: 0 },
                  { scenario: 'Max Penalty (5%)', exposure: Math.round(penaltyExposure.maxPenalty) },
                ]} margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="scenario" tick={{ fontSize: 12, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => `${v}M`} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} formatter={v => [`EUR ${v}M`, 'Exposure']} />
                  <Bar dataKey="exposure" radius={[6, 6, 0, 0]}>
                    {[T.amber, T.gold, T.green, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Per-company penalty breakdown */}
            <Card style={{ marginTop: 16, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.navy }}>Per-Company Penalty Exposure</div>
                <div style={{ fontSize: 12, color: T.textMut }}>Estimated penalty based on turnover and compliance gaps</div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: T.font }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Company', 'Sector', 'Turnover (EUR M)', '5% Max Penalty', 'Est. Penalty (gap-adj)', 'Phase'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {phasedCompanies.filter(c => c.phase !== 'Not in scope').slice(0, 15).map(c => {
                    const maxP = (c.turnover || 0) * 0.05;
                    const estP = maxP * penaltyExposure.gapFraction;
                    return (
                      <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{c.name || c.ticker}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: T.textSec }}>{c.sector || 'N/A'}</td>
                        <td style={{ padding: '10px 12px' }}>{(c.turnover || 0).toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', color: T.red, fontWeight: 600 }}>EUR {maxP.toFixed(1)}M</td>
                        <td style={{ padding: '10px 12px', color: T.amber, fontWeight: 600 }}>EUR {estP.toFixed(1)}M</td>
                        <td style={{ padding: '10px 12px' }}><Badge label={c.phase} color={c.phase.includes('2027') ? T.red : c.phase.includes('2028') ? T.amber : T.gold} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            <Card style={{ marginTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 10 }}>Penalty Framework Detail</div>
              <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7 }}>
                <strong style={{ color: T.navy }}>Pecuniary sanctions:</strong> Maximum not less than 5% of worldwide net turnover in the financial year preceding the decision. Member States may set higher ceilings.
              </div>
              <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7, marginTop: 8 }}>
                <strong style={{ color: T.navy }}>Non-pecuniary sanctions:</strong> Public naming of the company, orders to cease infringing conduct, interim measures, exclusion from public procurement and concession contracts, export credit restrictions.
              </div>
              <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7, marginTop: 8 }}>
                <strong style={{ color: T.navy }}>Civil liability (Art. 22):</strong> Companies are liable for damages resulting from failure to comply with due diligence obligations. Affected persons and trade unions may bring actions. Limitation period of at least 5 years from when the damage occurred.
              </div>
              <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7, marginTop: 8 }}>
                <strong style={{ color: T.navy }}>Aggravating factors:</strong> Gravity and duration of the infringement, any relevant previous infringements, financial benefits obtained, failure to cooperate with supervisory authority, measures taken to mitigate.
              </div>
            </Card>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: TIMELINE & PHASING
            ══════════════════════════════════════════════════════════ */}
        {tab === 'Timeline' && (
          <Section title="CSDDD Phasing Timeline" sub="Which phase applies to each portfolio company">
            {/* Phase summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              {CSDDD_PHASES.map(p => {
                const count = phasedCompanies.filter(c => c.phase === p.phase).length;
                return (
                  <KpiCard key={p.phase} label={p.phase} value={count} sub={p.label} color={T.navy} />
                );
              })}
              <KpiCard label="Not in Scope" value={phasedCompanies.filter(c => c.phase === 'Not in scope').length} sub="Below thresholds" color={T.textMut} />
            </div>

            {/* Holdings phasing table */}
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: T.font }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Company', 'Sector', 'Employees', 'Turnover (EUR M)', 'Phase', 'SBTi', 'NZ Target'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {phasedCompanies.slice(0, 25).map(c => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{c.name || c.company_name || c.ticker}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: T.textSec }}>{c.sector || 'N/A'}</td>
                      <td style={{ padding: '10px 12px' }}>{(c.employees || 0).toLocaleString()}</td>
                      <td style={{ padding: '10px 12px' }}>{(c.turnover || 0).toLocaleString()}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge label={c.phase} color={c.phase.includes('2027') ? T.red : c.phase.includes('2028') ? T.amber : c.phase.includes('2029') ? T.gold : T.textMut} />
                      </td>
                      <td style={{ padding: '10px 12px' }}><Badge label={c.hasSBTi ? 'Yes' : 'No'} color={c.hasSBTi ? T.green : T.red} /></td>
                      <td style={{ padding: '10px 12px' }}><Badge label={c.hasNZTarget ? 'Yes' : 'No'} color={c.hasNZTarget ? T.green : T.red} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {phasedCompanies.length > 25 && <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: T.textMut }}>Showing 25 of {phasedCompanies.length} holdings</div>}
            </Card>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: SUPPLY CHAIN DUE DILIGENCE MAP
            ══════════════════════════════════════════════════════════ */}
        {tab === 'Supply Chain' && (
          <Section title="Supply Chain Due Diligence Map" sub="Cross-reference supplier tier assessments">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
              {supplyChainTiers.map(t => (
                <Card key={t.tier}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8 }}>{t.tier}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 28, fontWeight: 700, color: t.pct >= 60 ? T.green : t.pct >= 30 ? T.amber : T.red }}>{t.pct}%</span>
                    <span style={{ fontSize: 12, color: T.textMut }}>assessed ({t.assessed}/{t.total})</span>
                  </div>
                  <div style={{ marginTop: 10, height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${t.pct}%`, height: '100%', background: t.pct >= 60 ? T.green : t.pct >= 30 ? T.amber : T.red, borderRadius: 4 }} />
                  </div>
                </Card>
              ))}
            </div>

            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Due Diligence Coverage by Tier</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={supplyChainTiers.map(t => ({ ...t, unassessed: t.total - t.assessed }))} margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="tier" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="assessed" stackId="a" fill={T.sage} name="Assessed" />
                  <Bar dataKey="unassessed" stackId="a" fill={T.textMut} name="Unassessed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card style={{ marginTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 10 }}>CSDDD Supply Chain Obligations</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Direct partners (Tier 1)', desc: 'Full due diligence required — contractual assurances, monitoring, prevention plans' },
                  { label: 'Indirect partners (Tier 2+)', desc: 'Risk-based approach — when reasonable to suspect adverse impacts' },
                  { label: 'Cascading clauses', desc: 'Require direct partners to cascade due diligence obligations to their suppliers' },
                  { label: 'Responsible disengagement', desc: 'Last resort — suspend or terminate relationship if impacts cannot be addressed' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: 14, background: T.surfaceH, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </Card>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: CLIMATE TRANSITION PLAN ASSESSMENT
            ══════════════════════════════════════════════════════════ */}
        {tab === 'Climate Plan' && (
          <Section title="Climate Transition Plan Assessment" sub="Art. 15 — Paris-aligned transition planning">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              <KpiCard label="SBTi Adoption" value={`${climateData.withSBTi}/${climateData.total}`} sub={`${climateData.total > 0 ? Math.round((climateData.withSBTi / climateData.total) * 100) : 0}% of holdings`} color={T.sage} />
              <KpiCard label="Net-Zero Targets" value={`${climateData.withNZ}/${climateData.total}`} sub="2050 or sooner" color={T.navy} />
              <KpiCard label="Avg Transition Score" value={`${climateData.avgScore}/100`} sub="Portfolio weighted" color={climateData.avgScore >= 60 ? T.green : T.amber} />
              <KpiCard label="Art. 15 Compliance" value={`${metrics.climateCompliant}/${metrics.climateTotal}`} sub="Requirements met" color={metrics.climateCompliant === metrics.climateTotal ? T.green : T.amber} />
            </div>

            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Transition Score Distribution</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={phasedCompanies.slice(0, 20).map(c => ({ name: (c.name || c.ticker || '').substring(0, 14), score: c.transitionScore, sbti: c.hasSBTi ? 1 : 0 }))} margin={{ left: 10, right: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-45} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
                  <Bar dataKey="score" name="Transition Score" radius={[4, 4, 0, 0]}>
                    {phasedCompanies.slice(0, 20).map((c, i) => <Cell key={i} fill={c.transitionScore >= 70 ? T.green : c.transitionScore >= 50 ? T.amber : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 10 }}>Art. 15 Requirements Detail</div>
              {CSDDD_REQUIREMENTS.filter(r => r.category === 'Climate Transition Plan').map(r => {
                const st = complianceState[r.id] || {};
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${T.surfaceH}` }}>
                    <Badge label={r.id} color={T.navy} />
                    <span style={{ flex: 1, fontSize: 13, color: T.text }}>{r.requirement}</span>
                    <Badge label={st.status || 'Gap'} color={STATUS_COLORS[st.status || 'Gap']} />
                  </div>
                );
              })}
            </Card>

            {/* Sector pathway alignment */}
            <Card style={{ marginTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 10 }}>Sector Pathway Alignment</div>
              <div style={{ fontSize: 12, color: T.textMut, marginBottom: 14 }}>How portfolio sectors align with IEA Net Zero 2050 pathway milestones</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { sector: 'Energy', target_2030: '-40%', target_2050: '-100%', portfolio_progress: 32 },
                  { sector: 'Industrials', target_2030: '-25%', target_2050: '-90%', portfolio_progress: 18 },
                  { sector: 'Materials', target_2030: '-30%', target_2050: '-95%', portfolio_progress: 22 },
                  { sector: 'Consumer Staples', target_2030: '-20%', target_2050: '-85%', portfolio_progress: 45 },
                  { sector: 'Financials', target_2030: '-35%', target_2050: '-100%', portfolio_progress: 28 },
                  { sector: 'Utilities', target_2030: '-50%', target_2050: '-100%', portfolio_progress: 35 },
                ].map((s, i) => (
                  <div key={i} style={{ padding: 14, background: T.surfaceH, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{s.sector}</div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: T.textSec }}>
                      <span>2030: {s.target_2030}</span>
                      <span>2050: {s.target_2050}</span>
                    </div>
                    <div style={{ marginTop: 8, height: 6, background: T.surface, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${s.portfolio_progress}%`, height: '100%', background: s.portfolio_progress >= 40 ? T.green : s.portfolio_progress >= 20 ? T.amber : T.red, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>Progress: {s.portfolio_progress}%</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Transition plan quality metrics */}
            <Card style={{ marginTop: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 10 }}>Transition Plan Quality Indicators</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: T.font }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Indicator', 'Coverage', 'Portfolio Status', 'Best Practice'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { indicator: 'SBTi-validated targets', coverage: `${climateData.withSBTi}/${climateData.total}`, status: climateData.withSBTi > climateData.total * 0.5 ? 'Good' : 'Needs Improvement', best: '>80% of portfolio' },
                    { indicator: 'Board-approved plan', coverage: `${Math.round(climateData.total * 0.35)}/${climateData.total}`, status: 'Needs Improvement', best: '100% of in-scope companies' },
                    { indicator: 'Scope 3 included', coverage: `${Math.round(climateData.total * 0.28)}/${climateData.total}`, status: 'Lagging', best: '>60% of portfolio' },
                    { indicator: 'Annual progress reporting', coverage: `${Math.round(climateData.total * 0.42)}/${climateData.total}`, status: 'Partial', best: '100% of in-scope companies' },
                    { indicator: 'CapEx alignment disclosed', coverage: `${Math.round(climateData.total * 0.22)}/${climateData.total}`, status: 'Lagging', best: '>50% of portfolio' },
                    { indicator: 'Just transition considerations', coverage: `${Math.round(climateData.total * 0.15)}/${climateData.total}`, status: 'Lagging', best: '>30% of portfolio' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{row.indicator}</td>
                      <td style={{ padding: '10px 12px' }}>{row.coverage}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge label={row.status} color={row.status === 'Good' ? T.green : row.status === 'Partial' ? T.amber : T.red} />
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: T.textSec }}>{row.best}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: PEER COMPARISON
            ══════════════════════════════════════════════════════════ */}
        {tab === 'Peers' && (
          <Section title="Peer Comparison" sub="Portfolio CSDDD readiness vs sector average">
            <Card>
              <ResponsiveContainer width="100%" height={380}>
                <RadarChart data={peerRadar}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: T.textSec }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} />
                  <Radar name="Portfolio" dataKey="Portfolio" stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2} />
                  <Radar name="Sector Avg" dataKey="Sector Avg" stroke={T.gold} fill={T.gold} fillOpacity={0.15} strokeWidth={2} strokeDasharray="4 4" />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: T.font }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>

            <Card style={{ marginTop: 16, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: T.font }}>
                <thead>
                  <tr style={{ background: T.surfaceH }}>
                    {['Category', 'Portfolio Score', 'Sector Average', 'Delta', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {peerRadar.map(d => {
                    const delta = d.Portfolio - d['Sector Avg'];
                    return (
                      <tr key={d.category} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{d.category}</td>
                        <td style={{ padding: '10px 12px' }}>{d.Portfolio}%</td>
                        <td style={{ padding: '10px 12px', color: T.textSec }}>{d['Sector Avg']}%</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: delta >= 0 ? T.green : T.red }}>{delta >= 0 ? '+' : ''}{delta}pp</td>
                        <td style={{ padding: '10px 12px' }}><Badge label={delta >= 10 ? 'Leading' : delta >= 0 ? 'Aligned' : 'Lagging'} color={delta >= 10 ? T.green : delta >= 0 ? T.amber : T.red} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </Section>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: ACTION ITEM TRACKER
            ══════════════════════════════════════════════════════════ */}
        {tab === 'Actions' && (
          <Section title="Action Item Tracker" sub="Per-requirement remediation tasks">
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <Btn onClick={addAction}>+ Add Action Item</Btn>
              <span style={{ fontSize: 12, color: T.textMut, alignSelf: 'center' }}>{actions.length} action items tracked</span>
            </div>
            {actions.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 14, color: T.textMut, marginBottom: 8 }}>No action items yet</div>
                <div style={{ fontSize: 12, color: T.textMut }}>Click "+ Add Action Item" to create remediation tasks for compliance gaps.</div>
              </Card>
            ) : (
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: T.font }}>
                  <thead>
                    <tr style={{ background: T.surfaceH }}>
                      {['Requirement', 'Description', 'Owner', 'Due Date', 'Priority', 'Status', ''].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: `1px solid ${T.border}`, color: T.textSec, fontWeight: 600, fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {actions.map(a => (
                      <tr key={a.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '10px 12px' }}>
                          <select value={a.reqId} onChange={e => updateAction(a.id, 'reqId', e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font }}>
                            {CSDDD_REQUIREMENTS.map(r => <option key={r.id} value={r.id}>{r.id} — {r.requirement.substring(0, 40)}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <input value={a.description} onChange={e => updateAction(a.id, 'description', e.target.value)} placeholder="Describe action..." style={{ width: 180, padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font }} />
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <input value={a.owner} onChange={e => updateAction(a.id, 'owner', e.target.value)} placeholder="Owner" style={{ width: 100, padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font }} />
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <input type="date" value={a.dueDate} onChange={e => updateAction(a.id, 'dueDate', e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font }} />
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <select value={a.priority} onChange={e => updateAction(a.id, 'priority', e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font }}>
                            <option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option>
                          </select>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <select value={a.status} onChange={e => updateAction(a.id, 'status', e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, background: a.status === 'Done' ? `${T.green}12` : a.status === 'In Progress' ? `${T.amber}12` : 'transparent', color: a.status === 'Done' ? T.green : a.status === 'In Progress' ? T.amber : T.text, fontWeight: 600 }}>
                            <option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Done">Done</option>
                          </select>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <button onClick={() => removeAction(a.id)} style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>X</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </Section>
        )}
      </div>
    </div>
  );
}
