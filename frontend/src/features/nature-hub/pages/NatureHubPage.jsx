import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const PIE_COLORS = [T.navy, T.gold, T.sage, T.red, T.amber, '#7c3aed', '#0d9488', '#ec4899', '#6366f1', '#f43f5e', '#84cc16', '#06b6d4'];

/* ── Deterministic seed ── */
const seed = (s) => { let x = Math.sin(s * 2.7183 + 1) * 10000; return x - Math.floor(x); };

/* ══════════════════════════════════════════════════════════════
   MODULE STATUS DEFINITIONS
   ══════════════════════════════════════════════════════════════ */
const MODULE_CARDS = [
  { id: 'tnfd_leap', name: 'TNFD LEAP Assessment', path: '/tnfd-leap', icon: 'L', accent: T.sage, metricLabel: 'LEAP Phase', metricValue: 'Evaluate', subMetric: '14 disclosures mapped' },
  { id: 'biodiversity', name: 'Biodiversity Footprint', path: '/biodiversity-footprint', icon: 'B', accent: T.green, metricLabel: 'MSA Loss', metricValue: '12.4%', subMetric: 'Portfolio-weighted MSA' },
  { id: 'ecosystem', name: 'Ecosystem Services', path: '/ecosystem-services', icon: 'E', accent: T.gold, metricLabel: 'Services at Risk', metricValue: '7 of 18', subMetric: 'ENCORE dependency mapping' },
  { id: 'water', name: 'Water Stress Analytics', path: '/water-risk', icon: 'W', accent: '#0d9488', metricLabel: 'Water Risk Score', metricValue: '3.2/5', subMetric: 'WRI Aqueduct composite' },
  { id: 'scenarios', name: 'Nature Scenarios', path: '/nature-scenarios', icon: 'S', accent: '#7c3aed', metricLabel: 'Scenario VaR', metricValue: '-8.2%', subMetric: '3 NGFS-aligned scenarios' },
];

/* ══════════════════════════════════════════════════════════════
   TNFD 14 DISCLOSURES
   ══════════════════════════════════════════════════════════════ */
const TNFD_DISCLOSURES = [
  { id: 'GOV-A', name: 'Board oversight of nature-related D&O', pillar: 'Governance' },
  { id: 'GOV-B', name: 'Management role in assessing nature risks', pillar: 'Governance' },
  { id: 'GOV-C', name: 'Human rights policies in relation to nature', pillar: 'Governance' },
  { id: 'STR-A', name: 'Nature-related D&O identified over short/medium/long term', pillar: 'Strategy' },
  { id: 'STR-B', name: 'Effect on business model and value chain', pillar: 'Strategy' },
  { id: 'STR-C', name: 'Resilience of strategy under different scenarios', pillar: 'Strategy' },
  { id: 'STR-D', name: 'Location of assets and activities in priority areas', pillar: 'Strategy' },
  { id: 'RMG-A', name: 'Processes for identifying nature-related D&O', pillar: 'Risk Mgmt' },
  { id: 'RMG-B', name: 'Processes for managing nature-related risks', pillar: 'Risk Mgmt' },
  { id: 'RMG-C', name: 'Integration into overall risk management', pillar: 'Risk Mgmt' },
  { id: 'MET-A', name: 'Metrics on nature-related D&O', pillar: 'Metrics' },
  { id: 'MET-B', name: 'Metrics on dependencies and impacts', pillar: 'Metrics' },
  { id: 'MET-C', name: 'Targets and goals for nature management', pillar: 'Metrics' },
  { id: 'MET-D', name: 'Nature-related financial effects', pillar: 'Metrics' },
];

/* ══════════════════════════════════════════════════════════════
   ECOSYSTEM SERVICE CRITICALITY
   ══════════════════════════════════════════════════════════════ */
const ECOSYSTEM_SERVICES = [
  { service: 'Pollination', criticality: 92, sectors_affected: 4, revenue_at_risk_pct: 8.5 },
  { service: 'Water Purification', criticality: 88, sectors_affected: 6, revenue_at_risk_pct: 7.2 },
  { service: 'Climate Regulation', criticality: 85, sectors_affected: 8, revenue_at_risk_pct: 6.8 },
  { service: 'Soil Fertility', criticality: 82, sectors_affected: 3, revenue_at_risk_pct: 5.9 },
  { service: 'Flood Protection', criticality: 78, sectors_affected: 5, revenue_at_risk_pct: 5.1 },
  { service: 'Genetic Resources', criticality: 75, sectors_affected: 3, revenue_at_risk_pct: 4.3 },
  { service: 'Timber & Fibre', criticality: 72, sectors_affected: 4, revenue_at_risk_pct: 3.8 },
  { service: 'Marine Fisheries', criticality: 68, sectors_affected: 2, revenue_at_risk_pct: 3.2 },
  { service: 'Carbon Sequestration', criticality: 65, sectors_affected: 7, revenue_at_risk_pct: 2.9 },
  { service: 'Recreation & Tourism', criticality: 55, sectors_affected: 2, revenue_at_risk_pct: 1.8 },
];

/* ══════════════════════════════════════════════════════════════
   WATER RISK GEOGRAPHY
   ══════════════════════════════════════════════════════════════ */
const WATER_GEOGRAPHY = [
  { country: 'India', code: 'IN', stress_score: 4.2, portfolio_weight: 18.5, risk_tier: 'Extremely High' },
  { country: 'China', code: 'CN', stress_score: 3.6, portfolio_weight: 12.3, risk_tier: 'High' },
  { country: 'United States', code: 'US', stress_score: 2.8, portfolio_weight: 22.1, risk_tier: 'Medium-High' },
  { country: 'Brazil', code: 'BR', stress_score: 2.1, portfolio_weight: 5.4, risk_tier: 'Low-Medium' },
  { country: 'Australia', code: 'AU', stress_score: 3.4, portfolio_weight: 6.2, risk_tier: 'High' },
  { country: 'South Africa', code: 'ZA', stress_score: 3.8, portfolio_weight: 3.8, risk_tier: 'High' },
  { country: 'UK', code: 'GB', stress_score: 1.8, portfolio_weight: 8.5, risk_tier: 'Low-Medium' },
  { country: 'Germany', code: 'DE', stress_score: 2.2, portfolio_weight: 5.1, risk_tier: 'Medium-High' },
  { country: 'Japan', code: 'JP', stress_score: 2.5, portfolio_weight: 7.8, risk_tier: 'Medium-High' },
  { country: 'Singapore', code: 'SG', stress_score: 2.9, portfolio_weight: 4.2, risk_tier: 'Medium-High' },
  { country: 'France', code: 'FR', stress_score: 2.0, portfolio_weight: 3.6, risk_tier: 'Low-Medium' },
  { country: 'Canada', code: 'CA', stress_score: 1.4, portfolio_weight: 2.5, risk_tier: 'Low' },
];

/* ══════════════════════════════════════════════════════════════
   CBD / GBF TARGET ALIGNMENT
   ══════════════════════════════════════════════════════════════ */
const GBF_TARGETS = [
  { id: 'T3', target: '30x30 Protection', description: '30% of land and sea protected by 2030', portfolio_alignment: 62, gap: 'High exposure to unprotected biomes' },
  { id: 'T7', target: 'Pollution Reduction', description: 'Reduce pollution to non-harmful levels', portfolio_alignment: 48, gap: 'Chemical & fertiliser supply chain risks' },
  { id: 'T10', target: 'Sustainable Agriculture', description: 'Agriculture managed sustainably', portfolio_alignment: 55, gap: 'Regenerative practices lag in portfolio' },
  { id: 'T14', target: 'Mainstream Biodiversity', description: 'Integrate biodiversity into policies and business', portfolio_alignment: 72, gap: 'TNFD adoption improving' },
  { id: 'T15', target: 'Business Nature Disclosure', description: 'Monitor, assess, disclose nature dependencies', portfolio_alignment: 58, gap: '42% of holdings lack nature disclosure' },
  { id: 'T18', target: 'Harmful Subsidies', description: 'Redirect harmful subsidies', portfolio_alignment: 35, gap: 'Fossil fuel subsidy exposure remains' },
  { id: 'T19', target: 'Finance Mobilisation', description: 'Mobilise $200B/yr for biodiversity', portfolio_alignment: 45, gap: 'Green bond allocation below target' },
];

/* ══════════════════════════════════════════════════════════════
   ACTION PRIORITIZATION
   ══════════════════════════════════════════════════════════════ */
const ACTION_PRIORITIES = [
  { id: 'A1', action: 'Complete TNFD LEAP assessment for all material locations', module: 'TNFD LEAP', urgency: 9, impact: 9, status: 'In Progress' },
  { id: 'A2', action: 'Map water-dependent revenue streams to WRI Aqueduct basins', module: 'Water Stress', urgency: 8, impact: 8, status: 'Planned' },
  { id: 'A3', action: 'Establish biodiversity baseline using MSA methodology', module: 'Biodiversity', urgency: 8, impact: 9, status: 'In Progress' },
  { id: 'A4', action: 'Stress test portfolio under Ecosystem Collapse scenario', module: 'Nature Scenarios', urgency: 7, impact: 9, status: 'Completed' },
  { id: 'A5', action: 'Engage top 10 holdings on SBTN target-setting', module: 'Biodiversity', urgency: 9, impact: 8, status: 'Planned' },
  { id: 'A6', action: 'Assess ENCORE dependencies for critical ecosystem services', module: 'Ecosystem', urgency: 7, impact: 8, status: 'In Progress' },
  { id: 'A7', action: 'Align deforestation risk screening with EUDR requirements', module: 'Deforestation', urgency: 9, impact: 7, status: 'Planned' },
  { id: 'A8', action: 'Integrate nature VaR into quarterly risk reporting', module: 'Nature Scenarios', urgency: 6, impact: 8, status: 'Planned' },
  { id: 'A9', action: 'Set portfolio-level pollination dependency reduction target', module: 'Ecosystem', urgency: 5, impact: 7, status: 'Not Started' },
  { id: 'A10', action: 'Develop water stewardship targets per AWS Standard', module: 'Water Stress', urgency: 7, impact: 7, status: 'Planned' },
];

/* ══════════════════════════════════════════════════════════════
   CROSS-MODULE CONSISTENCY
   ══════════════════════════════════════════════════════════════ */
const SECTORS = ['Energy', 'Materials', 'Utilities', 'Consumer Staples', 'Consumer Discretionary', 'Health Care', 'Financials', 'IT', 'Communication Services', 'Industrials', 'Real Estate'];
const CROSS_MODULE_DATA = SECTORS.map((s, i) => ({
  sector: s,
  nature_risk: Math.round(20 + seed(i * 3) * 60),
  climate_risk: Math.round(25 + seed(i * 5 + 1) * 55),
  water_risk: Math.round(15 + seed(i * 7 + 2) * 65),
  biodiversity_risk: Math.round(18 + seed(i * 11 + 3) * 62),
}));

/* ══════════════════════════════════════════════════════════════
   UI PRIMITIVES
   ══════════════════════════════════════════════════════════════ */
const Card = ({ children, style }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, ...style }}>{children}</div>
);
const KpiCard = ({ label, value, sub, color }) => (
  <Card>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.font, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy, fontFamily: T.font }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.font, marginTop: 2 }}>{sub}</div>}
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

const thS = { padding: '8px 10px', fontSize: 11, fontWeight: 600, color: T.textSec, textAlign: 'left', borderBottom: `2px solid ${T.border}`, background: T.surfaceH, fontFamily: T.font, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
const tdS = { padding: '8px 10px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}`, fontFamily: T.font };

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function NatureHubPage() {
  const navigate = useNavigate();

  /* ── Portfolio from localStorage ── */
  const portfolio = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1') || '[]');
      return raw.map(h => {
        const master = GLOBAL_COMPANY_MASTER.find(c => c.id === h.id || c.ticker === h.ticker);
        return master ? { ...master, weight: h.weight || 0 } : null;
      }).filter(Boolean);
    } catch { return []; }
  }, []);
  const holdings = portfolio.length > 0 ? portfolio : GLOBAL_COMPANY_MASTER.slice(0, 30).map((c, i) => ({ ...c, weight: Math.round((3 + seed(i) * 5) * 100) / 100 }));
  const totalWeight = holdings.reduce((s, h) => s + h.weight, 0);

  /* ── TNFD disclosure progress from localStorage ── */
  const [tnfdStatus, setTnfdStatus] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ra_tnfd_disclosure_status') || '{}');
      const state = {};
      TNFD_DISCLOSURES.forEach(d => { state[d.id] = saved[d.id] || 'Not Started'; });
      return state;
    } catch {
      const state = {};
      TNFD_DISCLOSURES.forEach(d => { state[d.id] = 'Not Started'; });
      return state;
    }
  });

  const updateTnfdStatus = useCallback((id, status) => {
    setTnfdStatus(prev => {
      const next = { ...prev, [id]: status };
      localStorage.setItem('ra_tnfd_disclosure_status', JSON.stringify(next));
      return next;
    });
  }, []);

  const tnfdCompletePct = Math.round(Object.values(tnfdStatus).filter(s => s === 'Completed').length / TNFD_DISCLOSURES.length * 100);

  /* ── Sortable table state ── */
  const [sortBy, setSortBy] = useState('urgency_impact');
  const [sortDir, setSortDir] = useState('desc');
  const toggleSort = useCallback((col) => {
    setSortBy(prev => { if (prev === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return col; } setSortDir('desc'); return col; });
  }, []);

  /* ── Sorted actions ── */
  const sortedActions = useMemo(() => {
    const a = [...ACTION_PRIORITIES];
    a.sort((x, y) => {
      let va, vb;
      if (sortBy === 'urgency_impact') { va = x.urgency * x.impact; vb = y.urgency * y.impact; }
      else if (sortBy === 'urgency') { va = x.urgency; vb = y.urgency; }
      else if (sortBy === 'impact') { va = x.impact; vb = y.impact; }
      else if (sortBy === 'action') { return sortDir === 'asc' ? x.action.localeCompare(y.action) : y.action.localeCompare(x.action); }
      else { va = x.urgency; vb = y.urgency; }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return a;
  }, [sortBy, sortDir]);

  /* ── Nature Risk Radar data ── */
  const radarData = [
    { axis: 'Biodiversity', value: 65 },
    { axis: 'Water', value: 72 },
    { axis: 'Land Use', value: 58 },
    { axis: 'Pollution', value: 48 },
    { axis: 'Climate-Nature Nexus', value: 70 },
    { axis: 'Supply Chain Nature', value: 62 },
  ];

  /* ── Computed KPIs ── */
  const natureDependencyScore = Math.round(holdings.reduce((s, h) => {
    const depMap = { Energy: 55, Materials: 72, Utilities: 68, 'Consumer Staples': 82, 'Consumer Discretionary': 45, 'Health Care': 38, Financials: 25, IT: 15, 'Communication Services': 10, Industrials: 52, 'Real Estate': 60 };
    return s + (depMap[h.sector] || 30) * (h.weight / totalWeight);
  }, 0));

  const natureImpactScore = Math.round(natureDependencyScore * 0.85 + 8);
  const msaLoss = 12.4;
  const waterRiskScore = 3.2;
  const biodiversityHotspotExposure = Math.round(holdings.filter(h => ['Consumer Staples', 'Materials', 'Energy', 'Real Estate'].includes(h.sector)).reduce((s, h) => s + h.weight, 0) / totalWeight * 100);
  const speciesAtRisk = Math.round(biodiversityHotspotExposure * 1.8);
  const ecosystemServicesAtRisk = 7;
  const deforestationExposure = Math.round(holdings.filter(h => ['Consumer Staples', 'Materials'].includes(h.sector)).reduce((s, h) => s + h.weight, 0) / totalWeight * 100);
  const waterDependentRevenue = Math.round(holdings.filter(h => ['Utilities', 'Consumer Staples', 'Materials', 'Energy'].includes(h.sector)).reduce((s, h) => s + h.weight, 0) / totalWeight * 100);
  const natureScenarioVaR = -8.2;
  const cbdAlignment = Math.round(GBF_TARGETS.reduce((s, t) => s + t.portfolio_alignment, 0) / GBF_TARGETS.length);

  /* ── Climate + Nature integration numbers ── */
  const climateVaR = 8;
  const natureVaR = 5;
  const correlationAdd = 1;
  const combinedVaR = climateVaR + natureVaR - correlationAdd;

  /* ── Export functions ── */
  const exportCSV = useCallback(() => {
    const rows = [['Metric', 'Value']];
    rows.push(['Nature Dependency Score', natureDependencyScore]);
    rows.push(['Nature Impact Score', natureImpactScore]);
    rows.push(['MSA Loss %', msaLoss]);
    rows.push(['Water Risk Score', waterRiskScore]);
    rows.push(['TNFD Compliance %', tnfdCompletePct]);
    rows.push(['Biodiversity Hotspot Exposure %', biodiversityHotspotExposure]);
    rows.push(['CBD Alignment %', cbdAlignment]);
    GBF_TARGETS.forEach(t => rows.push([`GBF ${t.id}: ${t.target}`, `${t.portfolio_alignment}%`]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `nature_hub_dashboard_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  }, [natureDependencyScore, natureImpactScore, tnfdCompletePct, biodiversityHotspotExposure, cbdAlignment]);

  const exportJSON = useCallback(() => {
    const data = { natureDependencyScore, natureImpactScore, msaLoss, waterRiskScore, tnfdCompletePct, biodiversityHotspotExposure, cbdAlignment, gbfTargets: GBF_TARGETS, actions: ACTION_PRIORITIES, crossModule: CROSS_MODULE_DATA };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `nature_hub_intelligence_${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
  }, [natureDependencyScore, natureImpactScore, tnfdCompletePct, biodiversityHotspotExposure, cbdAlignment]);

  const exportMarkdown = useCallback(() => {
    let md = `# Nature & Biodiversity Intelligence Dashboard\n\n## KPIs\n`;
    md += `| Metric | Value |\n|---|---|\n`;
    md += `| Nature Dependency Score | ${natureDependencyScore}/100 |\n| MSA Loss | ${msaLoss}% |\n| Water Risk | ${waterRiskScore}/5 |\n| TNFD Compliance | ${tnfdCompletePct}% |\n| CBD Alignment | ${cbdAlignment}% |\n\n`;
    md += `## GBF Target Alignment\n| Target | Alignment |\n|---|---|\n`;
    GBF_TARGETS.forEach(t => { md += `| ${t.id}: ${t.target} | ${t.portfolio_alignment}% |\n`; });
    md += `\n## Priority Actions\n| Action | Urgency | Impact | Status |\n|---|---|---|---|\n`;
    sortedActions.forEach(a => { md += `| ${a.action} | ${a.urgency}/9 | ${a.impact}/9 | ${a.status} |\n`; });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `nature_hub_report_${Date.now()}.md`; a.click(); URL.revokeObjectURL(url);
  }, [natureDependencyScore, tnfdCompletePct, cbdAlignment, sortedActions]);

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 28px' }}>

        {/* ── 1. HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: T.navy }}>Nature & Biodiversity Intelligence Dashboard</div>
            <div style={{ fontSize: 13, color: T.textSec, marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge label="Hub" color={T.navy} /> <Badge label="TNFD" color={T.sage} />
              <Badge label="ENCORE" color={T.gold} /> <Badge label="MSA" color={T.green} />
              <Badge label="Water" color="#0d9488" /> <Badge label="5 Modules" color="#7c3aed" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={exportCSV} variant="outline">Export CSV</Btn>
            <Btn onClick={exportJSON} variant="outline">Export JSON</Btn>
            <Btn onClick={exportMarkdown} variant="outline">Export MD</Btn>
          </div>
        </div>

        {/* ── 2. MODULE STATUS CARDS ── */}
        <Section title="Module Status" sub="5 Nature & Biodiversity analysis modules">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
            {MODULE_CARDS.map(m => (
              <div key={m.id} onClick={() => navigate(m.path)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, cursor: 'pointer', borderTop: `4px solid ${m.accent}`, transition: 'box-shadow .2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${m.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: m.accent }}>{m.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{m.name}</div>
                </div>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{m.metricLabel}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: m.accent }}>{m.metricValue}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{m.subMetric}</div>
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: m.accent }}>Explore &rarr;</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 3. KPI CARDS (12, 2 rows) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
          <KpiCard label="Nature Dependency Score" value={`${natureDependencyScore}/100`} sub="Portfolio-weighted" color={natureDependencyScore > 60 ? T.red : T.amber} />
          <KpiCard label="Nature Impact Score" value={`${natureImpactScore}/100`} sub="Aggregate impact" color={natureImpactScore > 60 ? T.red : T.amber} />
          <KpiCard label="MSA Loss (Portfolio)" value={`${msaLoss}%`} sub="Mean Species Abundance" color={T.red} />
          <KpiCard label="Water Risk Score" value={`${waterRiskScore}/5`} sub="WRI Aqueduct" color={waterRiskScore > 3 ? T.red : T.amber} />
          <KpiCard label="TNFD Compliance" value={`${tnfdCompletePct}%`} sub={`${Object.values(tnfdStatus).filter(s => s === 'Completed').length}/14 disclosures`} color={tnfdCompletePct > 60 ? T.green : T.amber} />
          <KpiCard label="Hotspot Exposure" value={`${biodiversityHotspotExposure}%`} sub="Biodiversity hotspot sectors" color={biodiversityHotspotExposure > 40 ? T.red : T.amber} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
          <KpiCard label="Species at Risk" value={speciesAtRisk} sub="Portfolio-linked species" color={T.red} />
          <KpiCard label="Ecosystem Services Risk" value={`${ecosystemServicesAtRisk}/18`} sub="ENCORE critical services" color={T.amber} />
          <KpiCard label="Deforestation Exposure" value={`${deforestationExposure}%`} sub="High-risk commodity sectors" color={deforestationExposure > 20 ? T.red : T.amber} />
          <KpiCard label="Water-Dependent Rev" value={`${waterDependentRevenue}%`} sub="Revenue in water-heavy sectors" color={waterDependentRevenue > 40 ? T.red : T.amber} />
          <KpiCard label="Nature Scenario VaR" value={`${natureScenarioVaR}%`} sub="Ecosystem Collapse scenario" color={T.red} />
          <KpiCard label="CBD Target Alignment" value={`${cbdAlignment}%`} sub="7 Kunming-Montreal targets" color={cbdAlignment > 60 ? T.green : T.amber} />
        </div>

        {/* ── 4. NATURE RISK RADAR ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <Section title="Nature Risk Profile" sub="6-axis assessment">
            <Card>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.borderL} />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: T.textSec }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Risk Score" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          {/* ── 6. ECOSYSTEM SERVICE CRITICALITY ── */}
          <Section title="Ecosystem Service Criticality" sub="Top 10 most critical for portfolio">
            <Card>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={ECOSYSTEM_SERVICES} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis type="category" dataKey="service" tick={{ fontSize: 10, fill: T.textSec }} width={120} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, fontFamily: T.font }} />
                  <Bar dataKey="criticality" name="Criticality Score" radius={[0, 4, 4, 0]}>
                    {ECOSYSTEM_SERVICES.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>
        </div>

        {/* ── 5. TNFD DISCLOSURE PROGRESS ── */}
        <Section title="TNFD Disclosure Progress" sub={`${tnfdCompletePct}% complete (${Object.values(tnfdStatus).filter(s => s === 'Completed').length}/14)`}>
          <Card>
            <div style={{ width: '100%', height: 10, background: T.borderL, borderRadius: 5, marginBottom: 20 }}>
              <div style={{ width: `${tnfdCompletePct}%`, height: 10, borderRadius: 5, background: tnfdCompletePct > 60 ? T.green : T.amber, transition: 'width .4s' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {TNFD_DISCLOSURES.map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: tnfdStatus[d.id] === 'Completed' ? `${T.green}08` : T.surfaceH, borderRadius: 8, border: `1px solid ${tnfdStatus[d.id] === 'Completed' ? T.green + '30' : T.border}` }}>
                  <select value={tnfdStatus[d.id]} onChange={e => updateTnfdStatus(d.id, e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 11, fontFamily: T.font, background: T.surface, cursor: 'pointer', minWidth: 95 }}>
                    {['Not Started', 'In Progress', 'Completed'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{d.id}: {d.name.slice(0, 50)}{d.name.length > 50 ? '...' : ''}</div>
                    <div style={{ fontSize: 10, color: T.textMut }}>{d.pillar}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ── 7. WATER RISK GEOGRAPHY ── */}
        <Section title="Water Risk Geography" sub="Countries colored by water stress + portfolio weight">
          <Card style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thS}>Country</th><th style={thS}>Code</th><th style={thS}>Stress Score (/5)</th><th style={thS}>Portfolio Weight %</th><th style={thS}>Risk Tier</th><th style={thS}>Exposure</th>
                </tr>
              </thead>
              <tbody>
                {WATER_GEOGRAPHY.sort((a, b) => b.stress_score - a.stress_score).map((row, ri) => {
                  const tierColor = row.stress_score >= 3.5 ? T.red : row.stress_score >= 2.5 ? T.amber : T.green;
                  return (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ ...tdS, fontWeight: 600 }}>{row.country}</td>
                      <td style={tdS}>{row.code}</td>
                      <td style={tdS}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 6, background: T.borderL, borderRadius: 3 }}>
                            <div style={{ width: `${row.stress_score / 5 * 100}%`, height: 6, borderRadius: 3, background: tierColor }} />
                          </div>
                          <span style={{ fontWeight: 600, color: tierColor }}>{row.stress_score}</span>
                        </div>
                      </td>
                      <td style={tdS}>{row.portfolio_weight}%</td>
                      <td style={tdS}><Badge label={row.risk_tier} color={tierColor} /></td>
                      <td style={{ ...tdS, fontWeight: 700, color: (row.stress_score * row.portfolio_weight) > 50 ? T.red : T.amber }}>{Math.round(row.stress_score * row.portfolio_weight * 10) / 10}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* ── 8. NATURE + CLIMATE INTEGRATION ── */}
        <Section title="Nature + Climate Integration" sub="How nature risk compounds climate risk">
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: 16, background: `${T.amber}10`, borderRadius: 10 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.amber }}>{climateVaR}%</div>
                <div style={{ fontSize: 12, color: T.textSec }}>Climate VaR</div>
              </div>
              <div style={{ textAlign: 'center', padding: 16, background: `${T.sage}10`, borderRadius: 10 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.sage }}>{natureVaR}%</div>
                <div style={{ fontSize: 12, color: T.textSec }}>Nature VaR</div>
              </div>
              <div style={{ textAlign: 'center', padding: 16, background: `${T.red}10`, borderRadius: 10 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.red }}>+{correlationAdd}%</div>
                <div style={{ fontSize: 12, color: T.textSec }}>Correlation Add</div>
              </div>
              <div style={{ textAlign: 'center', padding: 16, background: `${T.navy}10`, borderRadius: 10, border: `2px solid ${T.navy}` }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.navy }}>{combinedVaR}%</div>
                <div style={{ fontSize: 12, color: T.textSec }}>Combined VaR</div>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: 14, background: T.surfaceH, borderRadius: 10, fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>
              Portfolio faces <b>{climateVaR}%</b> climate VaR plus <b>{natureVaR}%</b> nature VaR. Correlation between nature and climate shocks adds <b>{correlationAdd}%</b>, yielding <b style={{ color: T.navy }}>{combinedVaR}% combined value-at-risk</b>. Nature-climate feedback loops (deforestation reducing carbon sinks, ocean warming destroying marine ecosystems) create non-linear compounding effects.
            </div>
          </Card>
        </Section>

        {/* ── 9. CROSS-MODULE CONSISTENCY ── */}
        <Section title="Cross-Module Consistency" sub="Do nature and climate modules agree on sector exposure?">
          <Card style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thS}>Sector</th><th style={thS}>Nature Risk</th><th style={thS}>Climate Risk</th><th style={thS}>Water Risk</th><th style={thS}>Biodiversity Risk</th><th style={thS}>Avg</th><th style={thS}>Consistency</th>
                </tr>
              </thead>
              <tbody>
                {CROSS_MODULE_DATA.map((row, ri) => {
                  const avg = Math.round((row.nature_risk + row.climate_risk + row.water_risk + row.biodiversity_risk) / 4);
                  const spread = Math.max(row.nature_risk, row.climate_risk, row.water_risk, row.biodiversity_risk) - Math.min(row.nature_risk, row.climate_risk, row.water_risk, row.biodiversity_risk);
                  const consistency = spread < 15 ? 'High' : spread < 30 ? 'Medium' : 'Low';
                  return (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ ...tdS, fontWeight: 600 }}>{row.sector}</td>
                      {[row.nature_risk, row.climate_risk, row.water_risk, row.biodiversity_risk].map((v, vi) => (
                        <td key={vi} style={{ ...tdS, fontWeight: 600, color: v > 60 ? T.red : v > 40 ? T.amber : T.green }}>{v}</td>
                      ))}
                      <td style={{ ...tdS, fontWeight: 700, color: avg > 55 ? T.red : T.amber }}>{avg}</td>
                      <td style={tdS}><Badge label={consistency} color={consistency === 'High' ? T.green : consistency === 'Medium' ? T.amber : T.red} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* ── 10. ACTION PRIORITIZATION TABLE (sortable) ── */}
        <Section title="Action Prioritization" sub="Combined actions from all modules, ranked by urgency x impact">
          <Card style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    { key: 'action', label: 'Action' }, { key: 'module', label: 'Module' },
                    { key: 'urgency', label: 'Urgency' }, { key: 'impact', label: 'Impact' },
                    { key: 'urgency_impact', label: 'Priority Score' }, { key: 'status', label: 'Status' },
                  ].map(col => (
                    <th key={col.key} style={thS} onClick={() => toggleSort(col.key)}>
                      {col.label} {sortBy === col.key ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedActions.map((a, ri) => {
                  const statusColor = a.status === 'Completed' ? T.green : a.status === 'In Progress' ? T.amber : a.status === 'Planned' ? T.navyL : T.textMut;
                  return (
                    <tr key={a.id} style={{ background: ri % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ ...tdS, maxWidth: 320 }}>{a.action}</td>
                      <td style={tdS}><Badge label={a.module} color={T.sage} /></td>
                      <td style={{ ...tdS, fontWeight: 600, color: a.urgency >= 8 ? T.red : T.amber }}>{a.urgency}/9</td>
                      <td style={{ ...tdS, fontWeight: 600, color: a.impact >= 8 ? T.navy : T.textSec }}>{a.impact}/9</td>
                      <td style={{ ...tdS, fontWeight: 700, color: T.navy }}>{a.urgency * a.impact}</td>
                      <td style={tdS}><Badge label={a.status} color={statusColor} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </Section>

        {/* ── 11. CBD/GBF TARGET DASHBOARD ── */}
        <Section title="CBD / GBF Target Dashboard" sub="Portfolio alignment with 7 Kunming-Montreal Global Biodiversity Framework targets">
          <Card>
            {GBF_TARGETS.map((t, i) => (
              <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '80px 200px 1fr 120px', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: i < GBF_TARGETS.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.navy }}>{t.id}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{t.target}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>{t.description}</div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 10, background: T.borderL, borderRadius: 5 }}>
                      <div style={{ width: `${t.portfolio_alignment}%`, height: 10, borderRadius: 5, background: t.portfolio_alignment > 60 ? T.green : t.portfolio_alignment > 40 ? T.amber : T.red, transition: 'width .4s' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: t.portfolio_alignment > 60 ? T.green : t.portfolio_alignment > 40 ? T.amber : T.red, minWidth: 40 }}>{t.portfolio_alignment}%</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 3 }}>{t.gap}</div>
                </div>
                <Badge label={t.portfolio_alignment > 60 ? 'On Track' : t.portfolio_alignment > 40 ? 'At Risk' : 'Off Track'} color={t.portfolio_alignment > 60 ? T.green : t.portfolio_alignment > 40 ? T.amber : T.red} />
              </div>
            ))}
          </Card>
        </Section>

        {/* ── 12. QUICK ACTION CARDS ── */}
        <Section title="Quick Actions" sub="Navigate to sub-modules">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
            {MODULE_CARDS.map(m => (
              <Btn key={m.id} onClick={() => navigate(m.path)} variant="outline" style={{ textAlign: 'center', width: '100%', padding: '14px 12px' }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>{m.subMetric}</div>
              </Btn>
            ))}
          </div>
        </Section>

        {/* ── 13. DATA SOURCES & METHODOLOGY ── */}
        <Section title="Data Sources & Methodology">
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { source: 'ENCORE', org: 'UNEP-WCMC', desc: 'Ecosystem service dependency & impact mapping for industry sectors', url: 'encore.naturalcapital.finance' },
                { source: 'WRI Aqueduct', org: 'World Resources Institute', desc: 'Water stress, flood risk, drought risk at basin level', url: 'wri.org/aqueduct' },
                { source: 'IPBES', org: 'Intergovernmental Panel', desc: 'Global biodiversity assessment, ecosystem services valuation', url: 'ipbes.net' },
                { source: 'IUCN Red List', org: 'IUCN', desc: 'Species threat assessments, biodiversity indicators, protected areas', url: 'iucnredlist.org' },
                { source: 'TNFD v1.0', org: 'Taskforce on Nature', desc: '14 recommended disclosures, LEAP approach', url: 'tnfd.global' },
                { source: 'SBTN', org: 'Science Based Targets', desc: 'Nature target-setting methodology for corporates', url: 'sciencebasedtargetsnetwork.org' },
                { source: 'GBF / CBD', org: 'Convention on Biological Diversity', desc: 'Kunming-Montreal 23 targets for 2030', url: 'cbd.int/gbf' },
                { source: 'NGFS', org: 'Network for Greening Financial System', desc: 'Nature-related scenario framework for financial risk', url: 'ngfs.net' },
              ].map((ds, i) => (
                <div key={i} style={{ padding: 14, background: T.surfaceH, borderRadius: 10, borderLeft: `3px solid ${PIE_COLORS[i % PIE_COLORS.length]}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{ds.source}</div>
                  <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600 }}>{ds.org}</div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 4, lineHeight: 1.4 }}>{ds.desc}</div>
                  <div style={{ fontSize: 10, color: T.navyL, marginTop: 4 }}>{ds.url}</div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ── 14. CROSS-NAV ── */}
        <Section title="Cross-Module Navigation">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'TNFD LEAP Assessment', path: '/tnfd-leap' },
              { label: 'Biodiversity Footprint', path: '/biodiversity-footprint' },
              { label: 'Ecosystem Services', path: '/ecosystem-services' },
              { label: 'Water Stress Analytics', path: '/water-risk' },
              { label: 'Nature Scenarios', path: '/nature-scenarios' },
              { label: 'Deforestation Risk', path: '/deforestation-risk' },
              { label: 'Portfolio Suite', path: '/portfolio-suite' },
              { label: 'Physical Risk', path: '/climate-physical-risk' },
              { label: 'Supply Chain Map', path: '/supply-chain-map' },
              { label: 'Climate Scenarios (NGFS)', path: '/ngfs-scenarios' },
              { label: 'Nature Capital Accounting', path: '/nature-capital-accounting' },
              { label: 'Portfolio Dashboard', path: '/portfolio-dashboard' },
            ].map(nav => (
              <Btn key={nav.path} onClick={() => navigate(nav.path)} variant="outline" style={{ textAlign: 'center', width: '100%' }}>{nav.label} &rarr;</Btn>
            ))}
          </div>
        </Section>

        {/* ── Footer ── */}
        <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 11, color: T.textMut }}>
          EP-M6 Nature & Biodiversity Intelligence Hub | TNFD | ENCORE | MSA | GBF | Data: IPBES, WRI, IUCN, NGFS | Sprint M
        </div>
      </div>
    </div>
  );
}
