import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ReferenceLine, BarChart, Bar, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#4f46e5','#0891b2','#7c3aed','#be185d','#d97706','#15803d','#1e40af','#9f1239','#059669'];
const ESG_COLORS = { E:'#5a8a6a', S:'#2c5a8c', G:'#c5a96a' };

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const LS_PORT = 'ra_portfolio_v1';
const LS_ASSESS = 'ra_materiality_assessment_v1';
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
   ESRS SUSTAINABILITY TOPICS (10 E/S/G + 30 Sub-topics)
   Per EFRAG ESRS Set 1 — effective 2025 reporting
   ═══════════════════════════════════════════════════════════════════════════ */
const ESRS_TOPICS = [
  { id:'E1', name:'Climate Change', esrs:'ESRS E1', category:'E', subtopics:[
    { id:'E1-1', name:'Climate change mitigation', description:'GHG emissions reduction, energy transition' },
    { id:'E1-2', name:'Climate change adaptation', description:'Physical risk resilience, adaptation planning' },
    { id:'E1-3', name:'Energy', description:'Energy consumption, efficiency, renewables share' },
  ]},
  { id:'E2', name:'Pollution', esrs:'ESRS E2', category:'E', subtopics:[
    { id:'E2-1', name:'Air pollution', description:'SOx, NOx, particulate matter, ozone-depleting substances' },
    { id:'E2-2', name:'Water pollution', description:'Effluent discharge, microplastics, thermal pollution' },
    { id:'E2-3', name:'Soil pollution', description:'Contamination, chemicals, heavy metals' },
    { id:'E2-4', name:'Substances of concern', description:'REACH, POPs, endocrine disruptors' },
  ]},
  { id:'E3', name:'Water & Marine Resources', esrs:'ESRS E3', category:'E', subtopics:[
    { id:'E3-1', name:'Water consumption', description:'Withdrawal, discharge, recycling in water-stressed areas' },
    { id:'E3-2', name:'Marine resources', description:'Sustainable fisheries, ocean acidification, coral impact' },
  ]},
  { id:'E4', name:'Biodiversity & Ecosystems', esrs:'ESRS E4', category:'E', subtopics:[
    { id:'E4-1', name:'Direct impact drivers', description:'Land use change, exploitation, pollution, invasive species, climate' },
    { id:'E4-2', name:'Impact on species', description:'Threatened species, habitat degradation' },
    { id:'E4-3', name:'Impact on ecosystems', description:'Ecosystem services, degradation, restoration' },
  ]},
  { id:'E5', name:'Circular Economy', esrs:'ESRS E5', category:'E', subtopics:[
    { id:'E5-1', name:'Resource inflows', description:'Recycled/renewable content, critical raw materials' },
    { id:'E5-2', name:'Resource outflows', description:'Waste generation, recycling rates, hazardous waste' },
  ]},
  { id:'S1', name:'Own Workforce', esrs:'ESRS S1', category:'S', subtopics:[
    { id:'S1-1', name:'Working conditions', description:'Pay, working time, work-life balance, health & safety' },
    { id:'S1-2', name:'Equal treatment & opportunities', description:'Gender equality, diversity, non-discrimination' },
    { id:'S1-3', name:'Other work-related rights', description:'Freedom of association, collective bargaining, privacy' },
  ]},
  { id:'S2', name:'Workers in Value Chain', esrs:'ESRS S2', category:'S', subtopics:[
    { id:'S2-1', name:'Working conditions in supply chain', description:'Forced labour, child labour, living wage' },
    { id:'S2-2', name:'Equal treatment in supply chain', description:'Non-discrimination, indigenous rights' },
  ]},
  { id:'S3', name:'Affected Communities', esrs:'ESRS S3', category:'S', subtopics:[
    { id:'S3-1', name:'Community economic, social, cultural rights', description:'Land rights, FPIC, resettlement, livelihoods' },
    { id:'S3-2', name:'Community civil and political rights', description:'Security, freedom of expression, privacy' },
  ]},
  { id:'S4', name:'Consumers & End-Users', esrs:'ESRS S4', category:'S', subtopics:[
    { id:'S4-1', name:'Information-related impacts', description:'Data privacy, product safety, responsible marketing' },
    { id:'S4-2', name:'Personal safety', description:'Product recalls, health impacts, vulnerable groups' },
  ]},
  { id:'G1', name:'Business Conduct', esrs:'ESRS G1', category:'G', subtopics:[
    { id:'G1-1', name:'Corporate culture & ethics', description:'Anti-corruption, whistleblowing, lobbying transparency' },
    { id:'G1-2', name:'Management of supplier relationships', description:'Payment practices, responsible procurement' },
    { id:'G1-3', name:'Political engagement & lobbying', description:'Political donations, trade association membership' },
  ]},
];

const TOTAL_SUBTOPICS = ESRS_TOPICS.reduce((s, t) => s + t.subtopics.length, 0);

/* ═══════════════════════════════════════════════════════════════════════════
   SECTOR-SPECIFIC DEFAULT MATERIALITY
   11 sectors x financial + impact per topic (pre-populated benchmarks)
   Source: EFRAG Sector-Agnostic guidance + SASB-ISSB crosswalk heuristics
   ═══════════════════════════════════════════════════════════════════════════ */
const SECTORS = [
  { value:'energy', label:'Energy & Utilities' },
  { value:'materials', label:'Materials & Mining' },
  { value:'industrials', label:'Industrials' },
  { value:'consumer_disc', label:'Consumer Discretionary' },
  { value:'consumer_staples', label:'Consumer Staples' },
  { value:'healthcare', label:'Healthcare' },
  { value:'financials', label:'Financials' },
  { value:'technology', label:'Technology' },
  { value:'communications', label:'Communications' },
  { value:'real_estate', label:'Real Estate' },
  { value:'agriculture', label:'Agriculture & Forestry' },
];

const SECTOR_DEFAULTS = {
  energy:          { E1:[92,95], E2:[85,88], E3:[70,72], E4:[68,75], E5:[55,50], S1:[75,70], S2:[60,65], S3:[80,85], S4:[40,35], G1:[78,72] },
  materials:       { E1:[88,90], E2:[82,85], E3:[78,80], E4:[75,82], E5:[72,68], S1:[80,75], S2:[72,78], S3:[70,72], S4:[35,30], G1:[70,68] },
  industrials:     { E1:[80,78], E2:[70,72], E3:[55,52], E4:[50,55], E5:[65,60], S1:[78,72], S2:[65,70], S3:[48,50], S4:[55,50], G1:[72,68] },
  consumer_disc:   { E1:[60,55], E2:[45,40], E3:[40,38], E4:[35,40], E5:[70,72], S1:[65,60], S2:[80,85], S3:[35,38], S4:[82,78], G1:[68,65] },
  consumer_staples:{ E1:[65,62], E2:[58,55], E3:[72,75], E4:[60,68], E5:[75,78], S1:[70,65], S2:[85,88], S3:[55,58], S4:[80,75], G1:[65,62] },
  healthcare:      { E1:[50,45], E2:[62,58], E3:[55,50], E4:[40,42], E5:[48,45], S1:[72,68], S2:[55,52], S3:[42,45], S4:[90,88], G1:[80,78] },
  financials:      { E1:[72,40], E2:[25,20], E3:[22,18], E4:[30,28], E5:[20,18], S1:[68,62], S2:[35,30], S3:[40,38], S4:[75,72], G1:[88,85] },
  technology:      { E1:[55,48], E2:[30,25], E3:[35,30], E4:[22,25], E5:[45,42], S1:[78,72], S2:[62,65], S3:[30,32], S4:[88,85], G1:[82,80] },
  communications:  { E1:[48,42], E2:[22,18], E3:[20,15], E4:[18,20], E5:[30,28], S1:[70,65], S2:[45,48], S3:[35,38], S4:[85,82], G1:[78,75] },
  real_estate:     { E1:[82,78], E2:[40,38], E3:[65,60], E4:[55,58], E5:[60,55], S1:[58,55], S2:[42,40], S3:[68,72], S4:[48,45], G1:[65,62] },
  agriculture:     { E1:[78,82], E2:[75,78], E3:[88,92], E4:[90,95], E5:[65,68], S1:[72,68], S2:[82,88], S3:[78,82], S4:[60,55], G1:[58,55] },
};

/* ═══════════════════════════════════════════════════════════════════════════
   MATERIALITY ASSESSMENT LOGIC
   ═══════════════════════════════════════════════════════════════════════════ */
function assessMateriality(financial, impact, threshold = 50) {
  const f = financial >= threshold, i = impact >= threshold;
  return {
    financial_material: f, impact_material: i,
    doubly_material: f && i, material: f || i,
    quadrant: f && i ? 'Double' : f ? 'Financial Only' : i ? 'Impact Only' : 'Not Material',
    quadrantColor: f && i ? 'green' : f ? 'blue' : i ? 'amber' : 'gray',
  };
}

/* ── Financial Materiality Drivers per topic ──────────────────────────────── */
const FINANCIAL_DRIVERS = {
  E1: ['Carbon pricing & ETS exposure', 'Stranded asset risk', 'Physical damage costs', 'Transition capex requirements', 'Green financing access'],
  E2: ['Remediation liabilities', 'Regulatory fines (IED/REACH)', 'Permit revocation risk', 'Insurance cost escalation'],
  E3: ['Water scarcity operational disruption', 'Desalination capex', 'Regulatory allocation cuts', 'Reputational damage'],
  E4: ['Ecosystem service dependency', 'No Net Loss compliance costs', 'Supply chain disruption', 'Biodiversity offset costs'],
  E5: ['Raw material price volatility', 'Extended Producer Responsibility fees', 'Waste disposal cost escalation', 'Circular revenue opportunities'],
  S1: ['Talent acquisition & retention costs', 'Health & safety liabilities', 'Collective bargaining impact', 'DEI litigation exposure'],
  S2: ['Supply chain disruption from labor violations', 'Import ban risk (UFLPA)', 'Brand damage from supply scandals', 'Audit & remediation costs'],
  S3: ['Social license to operate risk', 'Community litigation', 'Project delay from opposition', 'Compensation & resettlement costs'],
  S4: ['Product liability & recalls', 'Data breach penalties (GDPR)', 'Consumer class actions', 'Reputational damage from safety failures'],
  G1: ['Anti-corruption fines (FCPA/UKBA)', 'Procurement fraud losses', 'Political contribution backlash', 'Debarment from public contracts'],
};

/* ── Impact Materiality Drivers per topic ─────────────────────────────────── */
const IMPACT_DRIVERS = {
  E1: ['Scale: Global GHG contribution', 'Scope: 1.5C budget overshoot', 'Irremediability: Irreversible tipping points'],
  E2: ['Scale: Population exposed to pollutants', 'Scope: Bioaccumulation & persistence', 'Irremediability: Soil/groundwater contamination'],
  E3: ['Scale: Water-stressed communities affected', 'Scope: Ecosystem degradation', 'Irremediability: Aquifer depletion'],
  E4: ['Scale: Species extinction risk', 'Scope: Ecosystem collapse cascades', 'Irremediability: Extinction is permanent'],
  E5: ['Scale: Resource depletion rate', 'Scope: Waste pollution reach', 'Irremediability: Non-degradable waste accumulation'],
  S1: ['Scale: Number of workers affected', 'Scope: Severity of conditions', 'Irremediability: Occupational disease, death'],
  S2: ['Scale: Supply chain worker population', 'Scope: Modern slavery severity', 'Irremediability: Child development impact'],
  S3: ['Scale: Community displacement numbers', 'Scope: Cultural heritage destruction', 'Irremediability: Loss of traditional livelihoods'],
  S4: ['Scale: Consumer base exposed', 'Scope: Severity of harm (health/safety)', 'Irremediability: Long-term health effects'],
  G1: ['Scale: Systemic corruption impact', 'Scope: Market distortion', 'Irremediability: Erosion of institutional trust'],
};

/* ── CSRD Disclosure Requirements per topic ───────────────────────────────── */
const CSRD_DISCLOSURES = {
  E1: ['E1-1: Transition plan for climate change mitigation', 'E1-2: Policies related to climate change', 'E1-3: Actions and resources', 'E1-4: Targets', 'E1-5: Energy consumption & mix', 'E1-6: Scope 1/2/3 GHG emissions', 'E1-7: GHG removals & carbon credits', 'E1-8: Internal carbon pricing', 'E1-9: Anticipated financial effects'],
  E2: ['E2-1: Policies on pollution', 'E2-2: Actions and resources', 'E2-3: Targets', 'E2-4: Pollution of air, water, soil', 'E2-5: Substances of concern/very high concern', 'E2-6: Anticipated financial effects'],
  E3: ['E3-1: Policies on water & marine resources', 'E3-2: Actions and resources', 'E3-3: Targets', 'E3-4: Water consumption', 'E3-5: Anticipated financial effects'],
  E4: ['E4-1: Transition plan for biodiversity', 'E4-2: Policies on biodiversity & ecosystems', 'E4-3: Actions and resources', 'E4-4: Targets', 'E4-5: Impact metrics', 'E4-6: Anticipated financial effects'],
  E5: ['E5-1: Policies on resource use & circular economy', 'E5-2: Actions and resources', 'E5-3: Targets', 'E5-4: Resource inflows', 'E5-5: Resource outflows', 'E5-6: Anticipated financial effects'],
  S1: ['S1-1: Policies on own workforce', 'S1-2: Engagement processes', 'S1-3: Remediation processes', 'S1-4: Actions on material impacts', 'S1-5: Targets', 'S1-6 to S1-17: Detailed metrics on working conditions, pay, diversity, safety'],
  S2: ['S2-1: Policies on value chain workers', 'S2-2: Engagement processes', 'S2-3: Remediation channels', 'S2-4: Actions on material impacts', 'S2-5: Targets'],
  S3: ['S3-1: Policies on affected communities', 'S3-2: Engagement processes', 'S3-3: Remediation channels', 'S3-4: Actions on material impacts', 'S3-5: Targets'],
  S4: ['S4-1: Policies on consumers & end-users', 'S4-2: Engagement processes', 'S4-3: Remediation channels', 'S4-4: Actions on material impacts', 'S4-5: Targets'],
  G1: ['G1-1: Business conduct policies and culture', 'G1-2: Management of relationships with suppliers', 'G1-3: Prevention & detection of corruption/bribery', 'G1-4: Confirmed incidents of corruption', 'G1-5: Political influence & lobbying activities', 'G1-6: Payment practices'],
};

/* ── ISSB vs CSRD comparison ──────────────────────────────────────────────── */
const ISSB_COMPARISON = ESRS_TOPICS.map(t => {
  const issbFinancial = SECTOR_DEFAULTS.energy[t.id]?.[0] || 50;
  return { id: t.id, name: t.name, issb_covers: t.category === 'E' || t.id === 'G1', note: t.category === 'S' ? 'ISSB does not directly require impact materiality for social topics' : t.id === 'G1' ? 'Partially covered via IFRS S1 governance disclosures' : 'Covered via IFRS S2 climate / SASB sector standards' };
});

/* ── Stakeholder Relevance ────────────────────────────────────────────────── */
const STAKEHOLDER_RELEVANCE = {
  Investors: ['E1','E2','E5','S1','G1'], Employees: ['S1','S2','G1'], Communities: ['E2','E3','E4','S3'],
  Regulators: ['E1','E2','E3','E4','E5','S1','S2','G1'], Consumers: ['S4','E5','G1'], NGOs: ['E1','E4','S2','S3'],
  Suppliers: ['S2','E5','G1'], 'Future Generations': ['E1','E3','E4'],
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DoubleMaterialityPage() {
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
  const [sector, setSector] = useState('energy');
  const [threshold, setThreshold] = useState(50);
  const [tab, setTab] = useState(0);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(portfolio[0]?.company_name || '');
  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState('asc');

  /* ── Scores (sector defaults + user overrides) ──────────────────────────── */
  const [scores, setScores] = useState(() => {
    const saved = loadLS(LS_ASSESS);
    if (saved?.scores) return saved.scores;
    const defaults = SECTOR_DEFAULTS[sector] || SECTOR_DEFAULTS.energy;
    const init = {};
    ESRS_TOPICS.forEach(t => { init[t.id] = { financial: defaults[t.id]?.[0] || 50, impact: defaults[t.id]?.[1] || 50 }; });
    return init;
  });
  const [notes, setNotes] = useState(() => {
    const saved = loadLS(LS_ASSESS);
    return saved?.notes || {};
  });

  /* ── Apply sector defaults when sector changes ──────────────────────────── */
  const applySectorDefaults = useCallback((s) => {
    setSector(s);
    const defaults = SECTOR_DEFAULTS[s] || SECTOR_DEFAULTS.energy;
    const newScores = {};
    ESRS_TOPICS.forEach(t => { newScores[t.id] = { financial: defaults[t.id]?.[0] || 50, impact: defaults[t.id]?.[1] || 50 }; });
    setScores(newScores);
  }, []);

  /* ── Persist ────────────────────────────────────────────────────────────── */
  useEffect(() => { saveLS(LS_ASSESS, { scores, notes, sector, threshold, timestamp: new Date().toISOString() }); }, [scores, notes, sector, threshold]);

  /* ── Assessments ────────────────────────────────────────────────────────── */
  const assessments = useMemo(() => ESRS_TOPICS.map(t => {
    const s = scores[t.id] || { financial: 50, impact: 50 };
    const a = assessMateriality(s.financial, s.impact, threshold);
    return { ...t, ...s, ...a };
  }), [scores, threshold]);

  const materialTopics = assessments.filter(a => a.material);
  const doublyMaterial = assessments.filter(a => a.doubly_material);
  const financialOnly = assessments.filter(a => a.financial_material && !a.impact_material);
  const impactOnly = assessments.filter(a => a.impact_material && !a.financial_material);
  const notMaterial = assessments.filter(a => !a.material);

  /* ── Sorted table data ──────────────────────────────────────────────────── */
  const sortedAssessments = useMemo(() => {
    const arr = [...assessments];
    arr.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return arr;
  }, [assessments, sortCol, sortDir]);

  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('asc'); } };
  const sortIcon = (col) => sortCol === col ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

  /* ── Portfolio-level aggregation ────────────────────────────────────────── */
  const portfolioMateriality = useMemo(() => {
    return ESRS_TOPICS.map(t => {
      let wf = 0, wi = 0, tw = 0;
      portfolio.forEach(c => {
        const s = seed(c.company_name + t.id);
        const base = scores[t.id] || { financial: 50, impact: 50 };
        const noise = (sRand(s) - 0.5) * 20;
        wf += (base.financial + noise) * (c.weight / 100);
        wi += (base.impact + noise) * (c.weight / 100);
        tw += c.weight / 100;
      });
      return { id: t.id, name: t.name, financial: tw ? Math.round(wf / tw) : 0, impact: tw ? Math.round(wi / tw) : 0 };
    });
  }, [portfolio, scores]);

  /* ── Trend projection ───────────────────────────────────────────────────── */
  const trendData = useMemo(() => {
    const years = [2025, 2027, 2030, 2035, 2040, 2050];
    return years.map(y => {
      const row = { year: y };
      ESRS_TOPICS.forEach(t => {
        const base = scores[t.id]?.financial || 50;
        const trend = t.category === 'E' ? 1.8 : t.category === 'S' ? 1.2 : 0.8;
        row[t.id] = Math.min(100, Math.round(base + trend * (y - 2025)));
      });
      return row;
    });
  }, [scores]);

  /* ── Company-level assessment ───────────────────────────────────────────── */
  const companyAssessment = useMemo(() => {
    if (!selectedCompany) return null;
    const comp = portfolio.find(c => c.company_name === selectedCompany);
    if (!comp) return null;
    return ESRS_TOPICS.map(t => {
      const s = seed(selectedCompany + t.id);
      const base = scores[t.id] || { financial: 50, impact: 50 };
      const nf = clamp(Math.round(base.financial + (sRand(s) - 0.5) * 30), 0, 100);
      const ni = clamp(Math.round(base.impact + (sRand(s + 1) - 0.5) * 30), 0, 100);
      return { ...t, financial: nf, impact: ni, ...assessMateriality(nf, ni, threshold) };
    });
  }, [selectedCompany, scores, threshold, portfolio]);

  /* ── Exports ────────────────────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const rows = [['Topic ID','Topic Name','ESRS','Category','Financial Score','Impact Score','Quadrant','Material','Sector','Threshold']];
    assessments.forEach(a => rows.push([a.id, a.name, a.esrs, a.category, a.financial, a.impact, a.quadrant, a.material ? 'Yes' : 'No', sector, threshold]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `double_materiality_assessment_${sector}_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }, [assessments, sector, threshold]);

  const exportJSON = useCallback(() => {
    const payload = { assessment_date: new Date().toISOString(), sector, threshold, topics: assessments.map(a => ({ id: a.id, name: a.name, esrs: a.esrs, category: a.category, financial_score: a.financial, impact_score: a.impact, quadrant: a.quadrant, material: a.material, subtopics: a.subtopics })), notes, portfolio_summary: { holdings: portfolio.length, sector_profile: sector } };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `materiality_matrix_${sector}.json`; a.click(); URL.revokeObjectURL(url);
  }, [assessments, notes, sector, threshold, portfolio]);

  const handlePrint = useCallback(() => window.print(), []);

  /* ── Tabs ───────────────────────────────────────────────────────────────── */
  const TABS = ['Matrix & Assessment', 'Topic Details', 'Portfolio View', 'CSRD Requirements', 'ISSB Comparison'];

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 28 }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: 0 }}>Double Materiality Assessment Engine</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <Badge label="CSRD/ESRS" color="navy" />
            <Badge label="10 Topics" color="sage" />
            <Badge label={`${TOTAL_SUBTOPICS} Sub-topics`} color="gold" />
            <Badge label="Financial + Impact" color="blue" />
            <Badge label={`Threshold: ${threshold}`} color="amber" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn onClick={exportCSV} small>Export CSV</Btn>
          <Btn onClick={exportJSON} small>Export JSON</Btn>
          <Btn onClick={handlePrint} small>Print</Btn>
        </div>
      </div>

      {/* ── 12 KPI Cards ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 24 }}>
        <KpiCard label="Topics Assessed" value={ESRS_TOPICS.length} sub="ESRS E1-G1" accent={T.navy} />
        <KpiCard label="Material (Financial)" value={assessments.filter(a => a.financial_material).length} sub={`>= ${threshold} threshold`} accent={T.navyL} />
        <KpiCard label="Material (Impact)" value={assessments.filter(a => a.impact_material).length} sub={`>= ${threshold} threshold`} accent={T.sage} />
        <KpiCard label="Doubly Material" value={doublyMaterial.length} sub="Both dimensions" accent={T.green} />
        <KpiCard label="Financial Only" value={financialOnly.length} sub="Outside-in only" accent={T.navyL} />
        <KpiCard label="Impact Only" value={impactOnly.length} sub="Inside-out only" accent={T.amber} />
        <KpiCard label="Not Material" value={notMaterial.length} sub={`Below ${threshold}`} accent={T.textMut} />
        <KpiCard label="Threshold" value={threshold} sub="Adjustable (20-80)" accent={T.gold} />
        <KpiCard label="Sub-topics" value={TOTAL_SUBTOPICS} sub="Across all topics" />
        <KpiCard label="Coverage" value={pct(100)} sub="All 10 ESRS topics" accent={T.sage} />
        <KpiCard label="Sector Profile" value={SECTORS.find(s => s.value === sector)?.label || sector} sub="Selected benchmark" />
        <KpiCard label="Completeness" value={pct((materialTopics.length / ESRS_TOPICS.length) * 100)} sub="Topics with determination" accent={T.gold} />
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => <Btn key={t} onClick={() => setTab(i)} active={tab === i} small>{t}</Btn>)}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════
         TAB 0: Matrix & Assessment
         ═════════════════════════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <div>
          {/* ── Sector Profile + Threshold ──────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <Section title="Sector Profile" badge="EFRAG Benchmarks">
              <Sel label="SELECT SECTOR" value={sector} onChange={applySectorDefaults} options={SECTORS} />
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 6 }}>Selecting a sector pre-populates default financial and impact materiality scores based on EFRAG sector-agnostic guidance and SASB-ISSB crosswalk heuristics. Scores are fully adjustable.</div>
            </Section>
            <Section title="Materiality Threshold" badge="Dynamic">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <input type="range" min={20} max={80} value={threshold} onChange={e => setThreshold(+e.target.value)} style={{ flex: 1, accentColor: T.gold }} />
                <span style={{ fontSize: 20, fontWeight: 700, color: T.navy, minWidth: 40 }}>{threshold}</span>
              </div>
              <div style={{ fontSize: 12, color: T.textSec }}>A topic is material if Financial OR Impact score meets this threshold. Doubly material = both meet threshold. Range 20-80. Default: 50 (EFRAG recommended).</div>
            </Section>
          </div>

          {/* ── Double Materiality Matrix (THE CORE VISUAL) ─────────────────── */}
          <Section title="Double Materiality Matrix" badge="Interactive Scatter">
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>
              X-axis = Impact Materiality (inside-out: company's effect on people & planet) | Y-axis = Financial Materiality (outside-in: sustainability issues affecting the company). Bubble size = sub-topic count. Color = E (green) / S (blue) / G (gold). Threshold lines create 4 quadrants.
            </div>
            <ResponsiveContainer width="100%" height={480}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" dataKey="impact" name="Impact Materiality" domain={[0, 100]} tickCount={11} label={{ value: 'Impact Materiality (Inside-Out)', position: 'bottom', offset: 10, style: { fontSize: 12, fill: T.textSec } }} />
                <YAxis type="number" dataKey="financial" name="Financial Materiality" domain={[0, 100]} tickCount={11} label={{ value: 'Financial Materiality (Outside-In)', angle: -90, position: 'left', offset: 10, style: { fontSize: 12, fill: T.textSec } }} />
                <ReferenceLine x={threshold} stroke={T.red} strokeDasharray="5 5" label={{ value: `Threshold ${threshold}`, position: 'top', style: { fontSize: 10, fill: T.red } }} />
                <ReferenceLine y={threshold} stroke={T.red} strokeDasharray="5 5" />
                <Tooltip content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, fontSize: 12, fontFamily: T.font, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>{d.id}: {d.name}</div>
                      <div>Financial: <strong>{d.financial}</strong> | Impact: <strong>{d.impact}</strong></div>
                      <div style={{ marginTop: 4 }}><Badge label={d.quadrant} color={d.quadrantColor} /></div>
                      <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>{d.subtopics.length} sub-topics | {d.esrs}</div>
                    </div>
                  );
                }} />
                <Scatter data={assessments} shape="circle">
                  {assessments.map((entry) => (
                    <Cell key={entry.id} fill={ESG_COLORS[entry.category]} r={6 + entry.subtopics.length * 2} fillOpacity={0.8} stroke={entry.doubly_material ? T.green : 'none'} strokeWidth={entry.doubly_material ? 2 : 0} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            {/* ── Quadrant Legend ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
              {[{ label: 'Doubly Material (top-right)', color: T.green }, { label: 'Financial Only (top-left)', color: T.navyL }, { label: 'Impact Only (bottom-right)', color: T.amber }, { label: 'Not Material (bottom-left)', color: T.textMut }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textSec }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: l.color }} />{l.label}
                </div>
              ))}
              {Object.entries(ESG_COLORS).map(([k, c]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textSec }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />{k === 'E' ? 'Environmental' : k === 'S' ? 'Social' : 'Governance'}
                </div>
              ))}
            </div>
          </Section>

          {/* ── ESRS Topic Assessment Table (sortable) ──────────────────────── */}
          <Section title="ESRS Topic Assessment" badge="Editable Scores">
            <div style={{ overflowX: 'auto' }}>
              <table style={tbl}>
                <thead>
                  <tr>
                    {[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Topic' }, { key: 'esrs', label: 'ESRS' }, { key: 'category', label: 'Pillar' }, { key: 'financial', label: 'Financial Score' }, { key: 'impact', label: 'Impact Score' }, { key: 'quadrant', label: 'Quadrant' }, { key: 'subtopics', label: 'Sub-topics' }].map(c => (
                      <th key={c.key} style={{ ...th, cursor: 'pointer' }} onClick={() => toggleSort(c.key)}>{c.label}{sortIcon(c.key)}</th>
                    ))}
                    <th style={th}>Expand</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAssessments.map(a => (
                    <React.Fragment key={a.id}>
                      <tr style={{ background: a.doubly_material ? '#f0fdf4' : a.material ? '#fefce8' : T.surface }}>
                        <td style={{ ...td, fontWeight: 700, color: ESG_COLORS[a.category] }}>{a.id}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{a.name}</td>
                        <td style={td}>{a.esrs}</td>
                        <td style={td}><Badge label={a.category} color={a.category === 'E' ? 'sage' : a.category === 'S' ? 'blue' : 'gold'} /></td>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={0} max={100} value={a.financial} onChange={e => setScores(prev => ({ ...prev, [a.id]: { ...prev[a.id], financial: +e.target.value } }))} style={{ width: 80, accentColor: T.navy }} />
                            <span style={{ fontWeight: 700, minWidth: 28 }}>{a.financial}</span>
                          </div>
                        </td>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={0} max={100} value={a.impact} onChange={e => setScores(prev => ({ ...prev, [a.id]: { ...prev[a.id], impact: +e.target.value } }))} style={{ width: 80, accentColor: T.sage }} />
                            <span style={{ fontWeight: 700, minWidth: 28 }}>{a.impact}</span>
                          </div>
                        </td>
                        <td style={td}><Badge label={a.quadrant} color={a.quadrantColor} /></td>
                        <td style={{ ...td, textAlign: 'center' }}>{a.subtopics.length}</td>
                        <td style={{ ...td, textAlign: 'center' }}>
                          <button onClick={() => setExpandedTopic(expandedTopic === a.id ? null : a.id)} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: 16, color: T.navy }}>{expandedTopic === a.id ? '\u25B2' : '\u25BC'}</button>
                        </td>
                      </tr>
                      {/* ── Sub-Topic Deep Dive ────────────────────────────────── */}
                      {expandedTopic === a.id && a.subtopics.map(st => {
                        const sf = clamp(Math.round(a.financial + (sRand(seed(st.id)) - 0.5) * 20), 0, 100);
                        const si = clamp(Math.round(a.impact + (sRand(seed(st.id) + 1) - 0.5) * 20), 0, 100);
                        const sa = assessMateriality(sf, si, threshold);
                        return (
                          <tr key={st.id} style={{ background: T.surfaceH }}>
                            <td style={{ ...td, paddingLeft: 28, fontSize: 11, color: T.textSec }}>{st.id}</td>
                            <td style={{ ...td, fontSize: 11 }}>{st.name}</td>
                            <td style={{ ...td, fontSize: 11 }} colSpan={2}>{st.description}</td>
                            <td style={{ ...td, fontSize: 11, fontWeight: 600 }}>{sf}</td>
                            <td style={{ ...td, fontSize: 11, fontWeight: 600 }}>{si}</td>
                            <td style={td}><Badge label={sa.quadrant} color={sa.quadrantColor} /></td>
                            <td style={td} colSpan={2} />
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── Stakeholder Relevance Matrix ─────────────────────────────────── */}
          <Section title="Stakeholder Relevance Matrix" badge="8 Groups x 10 Topics">
            <div style={{ overflowX: 'auto' }}>
              <table style={tbl}>
                <thead>
                  <tr>
                    <th style={th}>Stakeholder Group</th>
                    {ESRS_TOPICS.map(t => <th key={t.id} style={{ ...th, fontSize: 10, textAlign: 'center' }}>{t.id}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(STAKEHOLDER_RELEVANCE).map(([group, topics]) => (
                    <tr key={group}>
                      <td style={{ ...td, fontWeight: 600 }}>{group}</td>
                      {ESRS_TOPICS.map(t => (
                        <td key={t.id} style={{ ...td, textAlign: 'center', background: topics.includes(t.id) ? '#dcfce7' : T.surface }}>
                          {topics.includes(t.id) ? '\u2713' : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── Notes / Override ─────────────────────────────────────────────── */}
          <Section title="Manual Override & Justification Notes" badge="Persisted">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {ESRS_TOPICS.map(t => (
                <div key={t.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: ESG_COLORS[t.category], marginBottom: 4 }}>{t.id}: {t.name}</div>
                  <textarea value={notes[t.id] || ''} onChange={e => setNotes(prev => ({ ...prev, [t.id]: e.target.value }))} placeholder="Enter justification for materiality determination..." rows={2} style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 12, fontFamily: T.font, resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
         TAB 1: Topic Details (Financial & Impact Drivers)
         ═════════════════════════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <div>
          {/* ── Financial Materiality Drivers ────────────────────────────────── */}
          <Section title="Financial Materiality Drivers" badge="Outside-In Risk Analysis">
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Per topic: what financial risks or opportunities does this sustainability issue create? Revenue impact, cost escalation, asset impairment, access to capital.</div>
            {assessments.filter(a => a.financial_material).map(a => (
              <div key={a.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, color: ESG_COLORS[a.category], fontSize: 14 }}>{a.id}</span>
                    <span style={{ fontWeight: 600, color: T.navy }}>{a.name}</span>
                    <Badge label={`Financial: ${a.financial}`} color="blue" />
                  </div>
                  <Badge label={a.quadrant} color={a.quadrantColor} />
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: T.textSec }}>
                  {(FINANCIAL_DRIVERS[a.id] || []).map((d, i) => <li key={i} style={{ marginBottom: 3 }}>{d}</li>)}
                </ul>
              </div>
            ))}
          </Section>

          {/* ── Impact Materiality Drivers ───────────────────────────────────── */}
          <Section title="Impact Materiality Drivers" badge="Inside-Out Assessment">
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Per topic: scale (how widespread), scope (reversibility), irremediability of company impacts on people and planet.</div>
            {assessments.filter(a => a.impact_material).map(a => (
              <div key={a.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, color: ESG_COLORS[a.category], fontSize: 14 }}>{a.id}</span>
                    <span style={{ fontWeight: 600, color: T.navy }}>{a.name}</span>
                    <Badge label={`Impact: ${a.impact}`} color="sage" />
                  </div>
                  <Badge label={a.quadrant} color={a.quadrantColor} />
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: T.textSec }}>
                  {(IMPACT_DRIVERS[a.id] || []).map((d, i) => <li key={i} style={{ marginBottom: 3 }}>{d}</li>)}
                </ul>
              </div>
            ))}
          </Section>

          {/* ── Category Breakdown Pie ───────────────────────────────────────── */}
          <Section title="Material Topics by Category" badge="E / S / G">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={[
                    { name: 'Environmental', value: materialTopics.filter(t => t.category === 'E').length, fill: ESG_COLORS.E },
                    { name: 'Social', value: materialTopics.filter(t => t.category === 'S').length, fill: ESG_COLORS.S },
                    { name: 'Governance', value: materialTopics.filter(t => t.category === 'G').length, fill: ESG_COLORS.G },
                  ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                    {[ESG_COLORS.E, ESG_COLORS.S, ESG_COLORS.G].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Quadrant Distribution</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { name: 'Double', count: doublyMaterial.length, fill: T.green },
                    { name: 'Financial Only', count: financialOnly.length, fill: T.navyL },
                    { name: 'Impact Only', count: impactOnly.length, fill: T.amber },
                    { name: 'Not Material', count: notMaterial.length, fill: T.textMut },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {[T.green, T.navyL, T.amber, T.textMut].map((c, i) => <Cell key={i} fill={c} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Section>

          {/* ── Materiality Over Time ────────────────────────────────────────── */}
          <Section title="Materiality Trend Projection (2025-2050)" badge="Forward-Looking">
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>Projected financial materiality scores based on regulatory momentum, physical risk escalation, and societal expectations. Environmental topics trend upward fastest.</div>
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {ESRS_TOPICS.slice(0, 5).map((t, i) => (
                  <Area key={t.id} type="monotone" dataKey={t.id} name={t.name} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
         TAB 2: Portfolio View
         ═════════════════════════════════════════════════════════════════════════ */}
      {tab === 2 && (
        <div>
          {/* ── Portfolio-Level Materiality Aggregation ──────────────────────── */}
          <Section title="Portfolio-Level Materiality Aggregation" badge={`${portfolio.length} Holdings`}>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Weight-averaged materiality scores across all portfolio holdings. Each company's scores are derived from sector benchmark + company-specific noise.</div>
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" dataKey="impact" name="Impact" domain={[0, 100]} label={{ value: 'Weighted Impact Score', position: 'bottom', offset: 10, style: { fontSize: 11 } }} />
                <YAxis type="number" dataKey="financial" name="Financial" domain={[0, 100]} label={{ value: 'Weighted Financial Score', angle: -90, position: 'left', style: { fontSize: 11 } }} />
                <ReferenceLine x={threshold} stroke={T.red} strokeDasharray="5 5" />
                <ReferenceLine y={threshold} stroke={T.red} strokeDasharray="5 5" />
                <Tooltip content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (<div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 12 }}><strong>{d.id}: {d.name}</strong><br />Financial: {d.financial} | Impact: {d.impact}</div>);
                }} />
                <Scatter data={portfolioMateriality}>
                  {portfolioMateriality.map((d, i) => <Cell key={d.id} fill={COLORS[i % COLORS.length]} r={8} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </Section>

          {/* ── Company-Level Assessment ─────────────────────────────────────── */}
          <Section title="Company-Level Materiality Assessment" badge="Individual Holding">
            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 20 }}>
              <div>
                <Sel label="SELECT HOLDING" value={selectedCompany} onChange={setSelectedCompany} options={portfolio.map(c => ({ value: c.company_name, label: c.company_name }))} />
                {selectedCompany && (
                  <div style={{ background: T.surfaceH, borderRadius: 8, padding: 12, fontSize: 12 }}>
                    <div style={{ fontWeight: 600, color: T.navy, marginBottom: 6 }}>Company Profile</div>
                    {(() => { const c = portfolio.find(p => p.company_name === selectedCompany); return c ? (<><div>Sector: {c.sector || 'N/A'}</div><div>Weight: {c.weight}%</div><div>ISIN: {c.isin || 'N/A'}</div></>) : null; })()}
                  </div>
                )}
              </div>
              <div>
                {companyAssessment && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={tbl}>
                      <thead>
                        <tr>
                          <th style={th}>Topic</th><th style={th}>Financial</th><th style={th}>Impact</th><th style={th}>Quadrant</th><th style={th}>Material</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyAssessment.map(a => (
                          <tr key={a.id} style={{ background: a.doubly_material ? '#f0fdf4' : T.surface }}>
                            <td style={{ ...td, fontWeight: 600 }}>{a.id}: {a.name}</td>
                            <td style={{ ...td, fontWeight: 700 }}>{a.financial}</td>
                            <td style={{ ...td, fontWeight: 700 }}>{a.impact}</td>
                            <td style={td}><Badge label={a.quadrant} color={a.quadrantColor} /></td>
                            <td style={td}>{a.material ? <Badge label="Yes" color="green" /> : <Badge label="No" color="gray" />}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* ── Holdings Impact Radar ────────────────────────────────────────── */}
          <Section title="Portfolio Materiality Radar" badge="10-Axis">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={portfolioMateriality.map(d => ({ topic: d.id, financial: d.financial, impact: d.impact }))}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11, fill: T.textSec }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Financial" dataKey="financial" stroke={T.navy} fill={T.navy} fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Impact" dataKey="impact" stroke={T.sage} fill={T.sage} fillOpacity={0.2} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Section>

          {/* ── Holdings Table ───────────────────────────────────────────────── */}
          <Section title="Holdings Materiality Summary" badge="Sortable">
            <div style={{ overflowX: 'auto', maxHeight: 400 }}>
              <table style={tbl}>
                <thead>
                  <tr>
                    <th style={th}>Company</th><th style={th}>Sector</th><th style={th}>Weight %</th><th style={th}>Top Material Topic</th><th style={th}>Doubly Material Count</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.slice(0, 25).map(c => {
                    const s = seed(c.company_name);
                    const topTopic = ESRS_TOPICS[Math.abs(s) % ESRS_TOPICS.length];
                    const dmc = Math.round(3 + sRand(s) * 5);
                    return (
                      <tr key={c.isin || c.company_name}>
                        <td style={{ ...td, fontWeight: 600 }}>{c.company_name}</td>
                        <td style={td}>{c.sector || 'N/A'}</td>
                        <td style={{ ...td, textAlign: 'right' }}>{c.weight?.toFixed(2)}</td>
                        <td style={td}><Badge label={topTopic.id} color={topTopic.category === 'E' ? 'sage' : topTopic.category === 'S' ? 'blue' : 'gold'} /> {topTopic.name}</td>
                        <td style={{ ...td, textAlign: 'center', fontWeight: 700 }}>{dmc}</td>
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
         TAB 3: CSRD Reporting Requirements
         ═════════════════════════════════════════════════════════════════════════ */}
      {tab === 3 && (
        <div>
          <Section title="CSRD Disclosure Requirements for Material Topics" badge="ESRS Set 1">
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>Only material topics trigger mandatory ESRS topical standard disclosures. Cross-cutting standards (ESRS 1, ESRS 2) apply to all undertakings regardless of materiality assessment outcome.</div>
            {assessments.filter(a => a.material).map(a => (
              <div key={a.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, color: ESG_COLORS[a.category], fontSize: 15 }}>{a.esrs}</span>
                    <span style={{ fontWeight: 600, color: T.navy }}>{a.name}</span>
                    <Badge label={a.quadrant} color={a.quadrantColor} />
                  </div>
                  <div style={{ fontSize: 11, color: T.textMut }}>{(CSRD_DISCLOSURES[a.id] || []).length} disclosure requirements</div>
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: T.textSec, columns: 2, columnGap: 24 }}>
                  {(CSRD_DISCLOSURES[a.id] || []).map((d, i) => <li key={i} style={{ marginBottom: 4, breakInside: 'avoid' }}>{d}</li>)}
                </ul>
              </div>
            ))}
            {notMaterial.length > 0 && (
              <div style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginTop: 8 }}>
                <div style={{ fontWeight: 600, color: T.textSec, marginBottom: 8 }}>Not Material (No Topical Disclosures Required)</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {notMaterial.map(a => <Badge key={a.id} label={`${a.id}: ${a.name}`} color="gray" />)}
                </div>
                <div style={{ fontSize: 11, color: T.textMut, marginTop: 8 }}>Per ESRS 1 para 30: When a sustainability matter is assessed as not material, the undertaking shall briefly explain the conclusions of its materiality assessment.</div>
              </div>
            )}
          </Section>

          {/* ── Cross-cutting standards ──────────────────────────────────────── */}
          <Section title="Cross-Cutting Standards (Always Applicable)" badge="ESRS 1 & 2">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>ESRS 1 — General Requirements</div>
                <ul style={{ fontSize: 12, color: T.textSec, paddingLeft: 18, margin: 0 }}>
                  <li>Basis for preparation</li><li>Materiality assessment methodology</li><li>Value chain boundaries</li><li>Time horizons definition</li><li>Estimation & uncertainty disclosures</li>
                </ul>
              </div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>ESRS 2 — General Disclosures</div>
                <ul style={{ fontSize: 12, color: T.textSec, paddingLeft: 18, margin: 0 }}>
                  <li>GOV-1 to GOV-5: Governance structure, due diligence, risk management</li><li>SBM-1 to SBM-3: Strategy & business model, stakeholder interests</li><li>IRO-1 to IRO-2: Identification & assessment of impacts, risks, opportunities</li><li>MDR: Minimum Disclosure Requirements for policies, actions, targets, metrics</li>
                </ul>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
         TAB 4: ISSB vs CSRD Comparison
         ═════════════════════════════════════════════════════════════════════════ */}
      {tab === 4 && (
        <div>
          <Section title="ISSB (IFRS S1/S2) vs CSRD (ESRS) Materiality Comparison" badge="Single vs Double">
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>
              ISSB applies single materiality (financial only, sometimes called enterprise value). CSRD applies double materiality (financial + impact). This comparison shows which additional topics become material when impact materiality is considered alongside financial materiality.
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={tbl}>
                <thead>
                  <tr>
                    <th style={th}>Topic</th><th style={th}>ESRS</th>
                    <th style={{ ...th, background: '#dbeafe' }}>Financial Score</th>
                    <th style={{ ...th, background: '#dcfce7' }}>Impact Score</th>
                    <th style={th}>ISSB Material?</th><th style={th}>CSRD Material?</th><th style={th}>Added by Double Materiality</th><th style={th}>ISSB Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map(a => {
                    const issbMaterial = a.financial >= threshold;
                    const csrdMaterial = a.material;
                    const addedByDouble = csrdMaterial && !issbMaterial;
                    const comp = ISSB_COMPARISON.find(c => c.id === a.id);
                    return (
                      <tr key={a.id} style={{ background: addedByDouble ? '#fef3c7' : T.surface }}>
                        <td style={{ ...td, fontWeight: 600 }}>{a.id}: {a.name}</td>
                        <td style={td}>{a.esrs}</td>
                        <td style={{ ...td, fontWeight: 700, textAlign: 'center', background: a.financial >= threshold ? '#dbeafe' : T.surface }}>{a.financial}</td>
                        <td style={{ ...td, fontWeight: 700, textAlign: 'center', background: a.impact >= threshold ? '#dcfce7' : T.surface }}>{a.impact}</td>
                        <td style={{ ...td, textAlign: 'center' }}>{issbMaterial ? <Badge label="Yes" color="blue" /> : <Badge label="No" color="gray" />}</td>
                        <td style={{ ...td, textAlign: 'center' }}>{csrdMaterial ? <Badge label="Yes" color="green" /> : <Badge label="No" color="gray" />}</td>
                        <td style={{ ...td, textAlign: 'center' }}>{addedByDouble ? <Badge label="NEW via Impact" color="amber" /> : '-'}</td>
                        <td style={{ ...td, fontSize: 11 }}>{comp?.note || ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <KpiCard label="ISSB Material Topics" value={assessments.filter(a => a.financial >= threshold).length} sub="Financial materiality only" accent={T.navyL} />
              <KpiCard label="CSRD Material Topics" value={materialTopics.length} sub="Double materiality" accent={T.sage} />
              <KpiCard label="Added by Impact Dimension" value={assessments.filter(a => a.material && a.financial < threshold).length} sub="Not captured by ISSB" accent={T.amber} />
            </div>
          </Section>

          {/* ── Framework interoperability summary ──────────────────────────── */}
          <Section title="Framework Interoperability Summary" badge="ISSB-CSRD-GRI-SASB">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[
                { framework: 'ISSB (IFRS S1/S2)', approach: 'Single materiality (financial/enterprise value)', scope: 'Climate-focused + SASB industry metrics', status: 'Effective Jan 2024' },
                { framework: 'CSRD (ESRS)', approach: 'Double materiality (financial + impact)', scope: '10 E/S/G topics, 30 sub-topics', status: 'Effective Jan 2025 (large undertakings)' },
                { framework: 'GRI Standards', approach: 'Impact materiality', scope: 'Universal + topic-specific (300+)', status: 'Interoperable with ESRS via EFRAG mapping' },
                { framework: 'SASB Standards', approach: 'Financial materiality (industry-specific)', scope: '77 industries, 26 issue categories', status: 'Incorporated into ISSB / IFRS S1' },
              ].map(f => (
                <div key={f.framework} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontWeight: 700, color: T.navy, fontSize: 13, marginBottom: 6 }}>{f.framework}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}><strong>Approach:</strong> {f.approach}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}><strong>Scope:</strong> {f.scope}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>{f.status}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Score Comparison Bar Chart ───────────────────────────────────── */}
          <Section title="Financial vs Impact Score Comparison" badge="All 10 Topics">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={assessments.map(a => ({ name: a.id, financial: a.financial, impact: a.impact }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={40} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine x={threshold} stroke={T.red} strokeDasharray="5 5" label={{ value: `Threshold: ${threshold}`, style: { fontSize: 10, fill: T.red } }} />
                <Bar dataKey="financial" name="Financial (Outside-In)" fill={T.navy} radius={[0, 4, 4, 0]} />
                <Bar dataKey="impact" name="Impact (Inside-Out)" fill={T.sage} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          {/* ── Sector Benchmark Comparison ──────────────────────────────────── */}
          <Section title="Cross-Sector Materiality Benchmarks" badge="11 Sectors">
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Compare default materiality scores across sectors. Useful for multi-sector portfolios and understanding relative exposure across industries.</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={tbl}>
                <thead>
                  <tr>
                    <th style={th}>Sector</th>
                    {ESRS_TOPICS.map(t => <th key={t.id} style={{ ...th, textAlign: 'center', fontSize: 10 }}>{t.id}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {SECTORS.map(s => {
                    const def = SECTOR_DEFAULTS[s.value] || {};
                    return (
                      <tr key={s.value} style={{ background: s.value === sector ? '#f0fdf4' : T.surface }}>
                        <td style={{ ...td, fontWeight: 600, fontSize: 11 }}>{s.label} {s.value === sector ? '\u2190' : ''}</td>
                        {ESRS_TOPICS.map(t => {
                          const f = def[t.id]?.[0] || 50;
                          const i = def[t.id]?.[1] || 50;
                          const avg = Math.round((f + i) / 2);
                          const bg = avg >= 75 ? '#fee2e2' : avg >= 50 ? '#fef3c7' : '#f0fdf4';
                          return <td key={t.id} style={{ ...td, textAlign: 'center', fontSize: 10, fontWeight: 600, background: bg }}>{avg}</td>;
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: T.textSec }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 14, height: 14, background: '#fee2e2', borderRadius: 3 }} /> High (&ge;75)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 14, height: 14, background: '#fef3c7', borderRadius: 3 }} /> Medium (50-74)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 14, height: 14, background: '#f0fdf4', borderRadius: 3 }} /> Low (&lt;50)</div>
            </div>
          </Section>

          {/* ── Gap Analysis: ISSB vs CSRD ──────────────────────────────────── */}
          <Section title="Disclosure Gap Analysis" badge="What ISSB Misses">
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>
              Topics that are material under CSRD double materiality but would not be captured under ISSB single (financial-only) materiality. These represent the incremental reporting burden for EU-regulated entities.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 12 }}>
              {assessments.map(a => {
                const issbMaterial = a.financial >= threshold;
                const csrdMaterial = a.material;
                const gap = csrdMaterial && !issbMaterial;
                return (
                  <div key={a.id} style={{ background: T.surface, border: `1px solid ${gap ? T.amber : T.border}`, borderRadius: 10, padding: 14, borderLeft: `3px solid ${gap ? T.amber : csrdMaterial ? T.green : T.textMut}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: ESG_COLORS[a.category], fontSize: 13 }}>{a.id}: {a.name}</span>
                      <Badge label={gap ? 'GAP' : csrdMaterial ? 'Aligned' : 'Neither'} color={gap ? 'amber' : csrdMaterial ? 'green' : 'gray'} />
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec }}>Financial: {a.financial} | Impact: {a.impact}</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>
                      ISSB: {issbMaterial ? 'Material' : 'Not material'} | CSRD: {csrdMaterial ? 'Material' : 'Not material'}
                    </div>
                    {gap && <div style={{ fontSize: 11, color: T.amber, marginTop: 4, fontWeight: 600 }}>Additional CSRD disclosures required: {(CSRD_DISCLOSURES[a.id] || []).length} items</div>}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ── Data Quality & Confidence ────────────────────────────────────── */}
          <Section title="Assessment Data Quality & Confidence" badge="Audit Trail">
            <div style={{ overflowX: 'auto' }}>
              <table style={tbl}>
                <thead>
                  <tr>
                    <th style={th}>Topic</th><th style={th}>Data Source Quality</th><th style={th}>Assessment Confidence</th><th style={th}>Last Reviewed</th><th style={th}>Evidence Base</th><th style={th}>Reviewer Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map(a => {
                    const s = seed(a.id + sector);
                    const dq = ['High','Medium','Medium','High','Low'][Math.floor(sRand(s) * 5)];
                    const conf = Math.round(60 + sRand(s + 1) * 35);
                    const reviewed = `2025-0${Math.floor(1 + sRand(s + 2) * 4)}-${String(Math.floor(1 + sRand(s + 3) * 28)).padStart(2, '0')}`;
                    const evidence = ['Sector benchmarks + internal data','Industry reports + peer comparison','Regulatory guidance + expert judgment','Stakeholder consultation + quantitative data','Limited data - sector proxy used'][Math.floor(sRand(s + 4) * 5)];
                    return (
                      <tr key={a.id}>
                        <td style={{ ...td, fontWeight: 600 }}>{a.id}: {a.name}</td>
                        <td style={td}><Badge label={dq} color={dq === 'High' ? 'green' : dq === 'Medium' ? 'amber' : 'red'} /></td>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${conf}%`, height: '100%', background: conf >= 80 ? T.green : conf >= 60 ? T.amber : T.red, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600 }}>{conf}%</span>
                          </div>
                        </td>
                        <td style={{ ...td, fontSize: 11 }}>{reviewed}</td>
                        <td style={{ ...td, fontSize: 11 }}>{evidence}</td>
                        <td style={{ ...td, fontSize: 11, color: T.textMut }}>{notes[a.id] || 'No notes'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── Materiality Sensitivity Analysis ────────────────────────────── */}
          <Section title="Threshold Sensitivity Analysis" badge="What-If">
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Shows how the number of material topics changes across different threshold values. Helps calibrate the threshold for your risk appetite.</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={[20,30,40,50,60,70,80].map(t => {
                const mat = assessments.filter(a => (scores[a.id]?.financial || 50) >= t || (scores[a.id]?.impact || 50) >= t).length;
                const dbl = assessments.filter(a => (scores[a.id]?.financial || 50) >= t && (scores[a.id]?.impact || 50) >= t).length;
                return { threshold: t, material: mat, doubly_material: dbl };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="threshold" tick={{ fontSize: 11 }} label={{ value: 'Threshold', position: 'bottom', style: { fontSize: 11 } }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine x={threshold} stroke={T.red} strokeDasharray="5 5" label={{ value: 'Current', style: { fontSize: 10, fill: T.red } }} />
                <Area type="monotone" dataKey="material" name="Material Topics" stroke={T.sage} fill={T.sage} fillOpacity={0.3} />
                <Area type="monotone" dataKey="doubly_material" name="Doubly Material" stroke={T.navy} fill={T.navy} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          {/* ── SASB-ISSB-CSRD Crosswalk Detail ─────────────────────────────── */}
          <Section title="SASB-ISSB-CSRD Crosswalk Reference" badge="Interoperability">
            <div style={{ overflowX: 'auto' }}>
              <table style={tbl}>
                <thead>
                  <tr>
                    <th style={th}>ESRS Topic</th><th style={th}>SASB Equivalent</th><th style={th}>ISSB Coverage</th><th style={th}>GRI Standard</th><th style={th}>Disclosure Count (CSRD)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { esrs: 'E1', sasb: 'GHG Emissions, Energy Management', issb: 'IFRS S2 (full)', gri: 'GRI 302, 305', count: 9 },
                    { esrs: 'E2', sasb: 'Air Quality, Ecological Impacts', issb: 'Partial via S2', gri: 'GRI 303, 305, 306', count: 6 },
                    { esrs: 'E3', sasb: 'Water & Wastewater Management', issb: 'Partial via S2', gri: 'GRI 303', count: 5 },
                    { esrs: 'E4', sasb: 'Ecological Impacts', issb: 'Not directly covered', gri: 'GRI 304', count: 6 },
                    { esrs: 'E5', sasb: 'Waste & Hazardous Materials', issb: 'Not directly covered', gri: 'GRI 301, 306', count: 6 },
                    { esrs: 'S1', sasb: 'Employee H&S, DEI, Labor Practices', issb: 'Partial via SASB', gri: 'GRI 401-406', count: 17 },
                    { esrs: 'S2', sasb: 'Supply Chain Labor Standards', issb: 'Partial via SASB', gri: 'GRI 407-409, 414', count: 5 },
                    { esrs: 'S3', sasb: 'Community Relations, Human Rights', issb: 'Not directly covered', gri: 'GRI 411, 413', count: 5 },
                    { esrs: 'S4', sasb: 'Customer Welfare, Data Security', issb: 'Partial via SASB', gri: 'GRI 416-418', count: 5 },
                    { esrs: 'G1', sasb: 'Business Ethics, Anti-Corruption', issb: 'Partial via S1 governance', gri: 'GRI 205-206, 415', count: 6 },
                  ].map(row => (
                    <tr key={row.esrs}>
                      <td style={{ ...td, fontWeight: 700 }}>{row.esrs}</td>
                      <td style={{ ...td, fontSize: 11 }}>{row.sasb}</td>
                      <td style={td}><Badge label={row.issb.includes('full') ? 'Full' : row.issb.includes('Partial') ? 'Partial' : 'Gap'} color={row.issb.includes('full') ? 'green' : row.issb.includes('Partial') ? 'amber' : 'red'} /></td>
                      <td style={{ ...td, fontSize: 11 }}>{row.gri}</td>
                      <td style={{ ...td, textAlign: 'center', fontWeight: 700 }}>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── Assessment Document Export ───────────────────────────────────── */}
          <Section title="Assessment Document Generation" badge="CSRD Compliance">
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Generate CSRD Materiality Assessment Document</div>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>
                This generates a structured materiality assessment document per ESRS 1 requirements, including methodology description, stakeholder engagement summary, topic-by-topic determination with justification, and disclosure requirements mapping.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                <div style={{ background: T.surfaceH, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>SECTION 1</div>
                  <div style={{ fontSize: 12, color: T.navy }}>Methodology & Process Description</div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>Threshold: {threshold} | Sector: {SECTORS.find(s => s.value === sector)?.label}</div>
                </div>
                <div style={{ background: T.surfaceH, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>SECTION 2</div>
                  <div style={{ fontSize: 12, color: T.navy }}>Topic-by-Topic Determination</div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>{materialTopics.length} material | {notMaterial.length} not material</div>
                </div>
                <div style={{ background: T.surfaceH, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>SECTION 3</div>
                  <div style={{ fontSize: 12, color: T.navy }}>Disclosure Requirements Matrix</div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>{materialTopics.reduce((s, t) => s + (CSRD_DISCLOSURES[t.id]?.length || 0), 0)} total disclosures</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn onClick={exportCSV}>Export Assessment CSV</Btn>
                <Btn onClick={exportJSON}>Export Full JSON</Btn>
                <Btn onClick={handlePrint}>Print Assessment</Btn>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ── Cross-Navigation ──────────────────────────────────────────────── */}
      <div style={{ marginTop: 32, paddingTop: 20, borderTop: `2px solid ${T.border}`, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: T.textMut, alignSelf: 'center' }}>Navigate to:</span>
        {[
          { label: 'ISSB/TCFD', path: '/issb-tcfd' },
          { label: 'GRI Reporting', path: '/comprehensive-reporting' },
          { label: 'EU Taxonomy', path: '/eu-taxonomy' },
          { label: 'Regulatory Gap', path: '/regulatory-gap' },
          { label: 'Stakeholder Impact', path: '/stakeholder-impact' },
          { label: 'CSRD iXBRL', path: '/csrd-ixbrl' },
          { label: 'SFDR PAI', path: '/sfdr-pai' },
        ].map(n => <Btn key={n.path} onClick={() => navigate(n.path)} small>{n.label}</Btn>)}
      </div>
    </div>
  );
}
