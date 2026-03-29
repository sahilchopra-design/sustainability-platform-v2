import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const LS_PORT = 'ra_portfolio_v1';
const LS_PREFS = 'ra_controversy_materiality_prefs_v1';
const hashStr = s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
const sr = (seed, off = 0) => { let x = Math.sin(Math.abs(seed + off) * 9301 + 49297) * 233280; return x - Math.floor(x); };
const fmt1 = v => typeof v === 'number' ? v.toFixed(1) : v;
const fmtM = v => v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v}M`;
const CHART_COLORS = [T.navy, T.gold, T.sage, '#2563eb', '#9333ea', '#ea580c', '#0d9488', T.red, '#6366f1', '#0284c7'];
const SEV_COLOR = { 5: '#991b1b', 4: T.red, 3: T.amber, 2: T.gold, 1: T.sage };
const SEV_LABEL = { 5: 'Critical', 4: 'High', 3: 'Moderate', 2: 'Low', 1: 'Minor' };

/* ══════════════════════════════════════════════════════════════
   ESRS TOPICS
   ══════════════════════════════════════════════════════════════ */
const ESRS_TOPICS = [
  { id: 'E1', label: 'Climate Change', category: 'Environment', materialScore: 78 },
  { id: 'E2', label: 'Pollution', category: 'Environment', materialScore: 52 },
  { id: 'E3', label: 'Water & Marine Resources', category: 'Environment', materialScore: 55 },
  { id: 'E4', label: 'Biodiversity & Ecosystems', category: 'Environment', materialScore: 48 },
  { id: 'E5', label: 'Circular Economy', category: 'Environment', materialScore: 38 },
  { id: 'S1', label: 'Own Workforce', category: 'Social', materialScore: 65 },
  { id: 'S2', label: 'Value Chain Workers', category: 'Social', materialScore: 45 },
  { id: 'S3', label: 'Affected Communities', category: 'Social', materialScore: 40 },
  { id: 'S4', label: 'Consumers & End-users', category: 'Social', materialScore: 42 },
  { id: 'G1', label: 'Business Conduct', category: 'Governance', materialScore: 70 },
];
const TOPIC_MAP = {};
ESRS_TOPICS.forEach(t => { TOPIC_MAP[t.id] = t; });

/* ══════════════════════════════════════════════════════════════
   CONTROVERSY-TO-ESRS MAPPING
   ══════════════════════════════════════════════════════════════ */
const CONTROVERSY_ESRS_MAP = {
  'Oil spill': ['E2', 'E3', 'E4'],
  'Emissions violation': ['E1', 'E2'],
  'Deforestation': ['E4', 'E5'],
  'Water contamination': ['E2', 'E3'],
  'Hazardous waste': ['E2', 'E5'],
  'Carbon target miss': ['E1'],
  'Greenwashing': ['E1', 'G1'],
  'Workplace accident': ['S1'],
  'Child labour': ['S2'],
  'Forced labour': ['S2'],
  'Gender discrimination': ['S1'],
  'Community displacement': ['S3'],
  'Data breach': ['S4'],
  'Product safety recall': ['S4'],
  'Living wage violation': ['S1', 'S2'],
  'Bribery/corruption': ['G1'],
  'Tax evasion': ['G1'],
  'Executive pay scandal': ['G1', 'S1'],
  'Antitrust violation': ['G1'],
  'Lobbying scandal': ['G1'],
};

/* ══════════════════════════════════════════════════════════════
   30 SAMPLE CONTROVERSY EVENTS
   ══════════════════════════════════════════════════════════════ */
const CONTROVERSY_EVENTS = [
  { id: 'CTR01', company: 'Shell PLC', ticker: 'SHEL', sector: 'Energy', type: 'Oil spill', severity: 5, date: '2024-11-15', region: 'Nigeria', estImpactUsd: 820, description: 'Major pipeline leak in Niger Delta affecting 12km of coastline', remediation: 'partial', verified: true },
  { id: 'CTR02', company: 'Volkswagen AG', ticker: 'VOW3', sector: 'Industrials', type: 'Emissions violation', severity: 4, date: '2024-09-22', region: 'Germany', estImpactUsd: 450, description: 'NOx emissions test irregularities found in 2024 diesel models', remediation: 'acknowledged', verified: true },
  { id: 'CTR03', company: 'JBS S.A.', ticker: 'JBSS3', sector: 'Consumer Staples', type: 'Deforestation', severity: 5, date: '2025-01-08', region: 'Brazil', estImpactUsd: 280, description: 'Satellite imagery links cattle suppliers to 15,000 hectares of Amazon deforestation', remediation: 'partial', verified: true },
  { id: 'CTR04', company: 'Tata Steel', ticker: 'TATASTEEL', sector: 'Materials', type: 'Water contamination', severity: 4, date: '2024-08-12', region: 'India', estImpactUsd: 120, description: 'Heavy metal discharge into river system near Jamshedpur plant', remediation: 'substantial', verified: true },
  { id: 'CTR05', company: 'BHP Group', ticker: 'BHP', sector: 'Materials', type: 'Hazardous waste', severity: 4, date: '2024-10-03', region: 'Australia', estImpactUsd: 340, description: 'Tailings dam seepage detected at Olympic Dam copper-uranium mine', remediation: 'partial', verified: false },
  { id: 'CTR06', company: 'TotalEnergies', ticker: 'TTE', sector: 'Energy', type: 'Carbon target miss', severity: 3, date: '2025-02-14', region: 'Global', estImpactUsd: 90, description: '2024 Scope 1+2 emissions 8% above stated reduction target pathway', remediation: 'acknowledged', verified: true },
  { id: 'CTR07', company: 'HSBC Holdings', ticker: 'HSBA', sector: 'Financials', type: 'Greenwashing', severity: 3, date: '2024-12-01', region: 'UK', estImpactUsd: 65, description: 'ASA ruling that ESG fund marketing was misleading to retail investors', remediation: 'substantial', verified: true },
  { id: 'CTR08', company: 'Amazon.com', ticker: 'AMZN', sector: 'Consumer Discretionary', type: 'Workplace accident', severity: 4, date: '2024-07-19', region: 'United States', estImpactUsd: 180, description: 'Three warehouse worker fatalities in Q3 2024 across US facilities', remediation: 'partial', verified: true },
  { id: 'CTR09', company: 'Shein', ticker: 'SHEIN', sector: 'Consumer Discretionary', type: 'Child labour', severity: 5, date: '2024-11-28', region: 'China', estImpactUsd: 150, description: 'Investigation reveals underage workers in tier-2 garment suppliers', remediation: 'none', verified: false },
  { id: 'CTR10', company: 'Foxconn', ticker: '2317', sector: 'IT', type: 'Forced labour', severity: 5, date: '2024-06-15', region: 'China', estImpactUsd: 200, description: 'Labour rights group documents involuntary overtime and document confiscation at Zhengzhou factory', remediation: 'acknowledged', verified: true },
  { id: 'CTR11', company: 'Goldman Sachs', ticker: 'GS', sector: 'Financials', type: 'Gender discrimination', severity: 3, date: '2024-09-30', region: 'United States', estImpactUsd: 215, description: 'Class action settlement for gender pay gap claims affecting 2,800 female employees', remediation: 'substantial', verified: true },
  { id: 'CTR12', company: 'Adani Group', ticker: 'ADANIENT', sector: 'Energy', type: 'Community displacement', severity: 4, date: '2025-01-20', region: 'India', estImpactUsd: 95, description: 'Port expansion project displaces 4,200 fishing community members without adequate compensation', remediation: 'partial', verified: false },
  { id: 'CTR13', company: 'Meta Platforms', ticker: 'META', sector: 'IT', type: 'Data breach', severity: 4, date: '2024-10-15', region: 'Global', estImpactUsd: 520, description: 'Personal data of 28M EU users exposed through API vulnerability', remediation: 'substantial', verified: true },
  { id: 'CTR14', company: 'Boeing', ticker: 'BA', sector: 'Industrials', type: 'Product safety recall', severity: 5, date: '2024-08-05', region: 'United States', estImpactUsd: 2400, description: 'Emergency grounding of 737 MAX 10 fleet after fuselage bolt inspection failures', remediation: 'partial', verified: true },
  { id: 'CTR15', company: 'Primark', ticker: 'ABF', sector: 'Consumer Discretionary', type: 'Living wage violation', severity: 3, date: '2024-12-10', region: 'Bangladesh', estImpactUsd: 40, description: 'Audit reveals 60% of Bangladeshi suppliers pay below living wage benchmarks', remediation: 'acknowledged', verified: true },
  { id: 'CTR16', company: 'Petrobras', ticker: 'PBR', sector: 'Energy', type: 'Bribery/corruption', severity: 5, date: '2024-07-28', region: 'Brazil', estImpactUsd: 680, description: 'New Lava Jato-related charges involving offshore procurement contracts', remediation: 'partial', verified: true },
  { id: 'CTR17', company: 'Credit Suisse', ticker: 'CS', sector: 'Financials', type: 'Tax evasion', severity: 4, date: '2024-06-20', region: 'Switzerland', estImpactUsd: 310, description: 'US Senate investigation reveals undisclosed US client accounts worth $2.3B', remediation: 'acknowledged', verified: true },
  { id: 'CTR18', company: 'Stellantis', ticker: 'STLA', sector: 'Industrials', type: 'Executive pay scandal', severity: 3, date: '2025-01-15', region: 'Netherlands', estImpactUsd: 25, description: 'CEO compensation package of EUR 36M draws shareholder revolt, 32% vote against', remediation: 'none', verified: true },
  { id: 'CTR19', company: 'Google', ticker: 'GOOGL', sector: 'IT', type: 'Antitrust violation', severity: 4, date: '2024-09-10', region: 'EU', estImpactUsd: 3800, description: 'EU General Court upholds EUR 4.1B antitrust fine for Android bundling practices', remediation: 'partial', verified: true },
  { id: 'CTR20', company: 'ExxonMobil', ticker: 'XOM', sector: 'Energy', type: 'Lobbying scandal', severity: 3, date: '2024-11-05', region: 'United States', estImpactUsd: 45, description: 'Leaked documents reveal coordinated lobbying to weaken EPA methane rules', remediation: 'none', verified: false },
  { id: 'CTR21', company: 'Rio Tinto', ticker: 'RIO', sector: 'Materials', type: 'Water contamination', severity: 4, date: '2024-08-25', region: 'Mongolia', estImpactUsd: 190, description: 'Oyu Tolgoi mine operations linked to aquifer depletion affecting herder communities', remediation: 'partial', verified: true },
  { id: 'CTR22', company: 'Nestle', ticker: 'NESN', sector: 'Consumer Staples', type: 'Greenwashing', severity: 2, date: '2025-02-01', region: 'EU', estImpactUsd: 35, description: 'Carbon-neutral product claims challenged by consumer advocacy group', remediation: 'substantial', verified: true },
  { id: 'CTR23', company: 'Tesla', ticker: 'TSLA', sector: 'Consumer Discretionary', type: 'Workplace accident', severity: 3, date: '2024-10-20', region: 'United States', estImpactUsd: 55, description: 'OSHA citations at Austin Gigafactory for repeated safety violations', remediation: 'partial', verified: true },
  { id: 'CTR24', company: 'Glencore', ticker: 'GLEN', sector: 'Materials', type: 'Bribery/corruption', severity: 5, date: '2024-07-10', region: 'DRC', estImpactUsd: 1200, description: 'Additional bribery charges related to DRC mining concessions, extending 2022 settlement', remediation: 'acknowledged', verified: true },
  { id: 'CTR25', company: 'Samsung Electronics', ticker: '005930', sector: 'IT', type: 'Forced labour', severity: 3, date: '2024-12-05', region: 'Vietnam', estImpactUsd: 80, description: 'NGO report documents excessive overtime at Bac Ninh component assembly plant', remediation: 'partial', verified: false },
  { id: 'CTR26', company: 'BP PLC', ticker: 'BP', sector: 'Energy', type: 'Carbon target miss', severity: 3, date: '2025-02-20', region: 'Global', estImpactUsd: 75, description: 'Revised 2030 emissions target upward by 15% from original net-zero pathway', remediation: 'acknowledged', verified: true },
  { id: 'CTR27', company: 'Walmart', ticker: 'WMT', sector: 'Consumer Staples', type: 'Living wage violation', severity: 2, date: '2024-09-18', region: 'United States', estImpactUsd: 30, description: 'Report shows 55% of hourly workers earn below regional living wage', remediation: 'partial', verified: true },
  { id: 'CTR28', company: 'Vale S.A.', ticker: 'VALE', sector: 'Materials', type: 'Community displacement', severity: 4, date: '2024-11-10', region: 'Brazil', estImpactUsd: 260, description: 'Continued resettlement failures five years after Brumadinho dam disaster', remediation: 'partial', verified: true },
  { id: 'CTR29', company: 'Barclays', ticker: 'BARC', sector: 'Financials', type: 'Tax evasion', severity: 3, date: '2024-08-15', region: 'UK', estImpactUsd: 145, description: 'HMRC investigation into structured finance arrangements used for tax avoidance', remediation: 'acknowledged', verified: false },
  { id: 'CTR30', company: 'Apple Inc.', ticker: 'AAPL', sector: 'IT', type: 'Data breach', severity: 3, date: '2025-01-25', region: 'Global', estImpactUsd: 180, description: 'iCloud vulnerability exposed location data of 3.2M users for 6 weeks', remediation: 'substantial', verified: true },
];

/* ── Enrich events with ESRS mapping ── */
const ENRICHED_EVENTS = CONTROVERSY_EVENTS.map(e => ({
  ...e,
  esrsTopics: CONTROVERSY_ESRS_MAP[e.type] || [],
  esrsLabels: (CONTROVERSY_ESRS_MAP[e.type] || []).map(id => TOPIC_MAP[id]?.label || id),
}));

/* ══════════════════════════════════════════════════════════════
   MINI COMPONENTS
   ══════════════════════════════════════════════════════════════ */
const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', minWidth: 140, flex: 1 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy, margin: '4px 0 2px' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec }}>{sub}</div>}
  </div>
);

const Badge = ({ label, color }) => {
  const colors = { navy: { bg: '#dbeafe', text: T.navy }, gold: { bg: '#fef3c7', text: '#92400e' }, sage: { bg: '#d1fae5', text: '#065f46' }, red: { bg: '#fee2e2', text: '#991b1b' }, amber: { bg: '#fef3c7', text: '#92400e' }, green: { bg: '#d1fae5', text: '#065f46' }, blue: { bg: '#dbeafe', text: '#1e40af' }, purple: { bg: '#ede9fe', text: '#6b21a8' }, gray: { bg: '#f3f4f6', text: '#374151' } };
  const c = colors[color] || colors.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: c.bg, color: c.text, whiteSpace: 'nowrap' }}>{label}</span>;
};

const Btn = ({ children, onClick, active, sm, color }) => (
  <button onClick={onClick} style={{
    background: active ? T.navy : color === 'gold' ? T.gold : color === 'sage' ? T.sage : color === 'red' ? T.red : T.surface,
    color: active ? '#fff' : (color === 'gold' || color === 'sage' || color === 'red') ? '#fff' : T.text,
    border: `1px solid ${active ? T.navy : T.border}`, borderRadius: 6,
    padding: sm ? '5px 12px' : '8px 18px', fontSize: sm ? 11 : 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.font,
  }}>{children}</button>
);

const Section = ({ title, sub, children, accent }) => (
  <div style={{ background: T.surface, border: `1px solid ${accent ? T.gold : T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
    {children}
  </div>
);

const SortHeader = ({ label, field, sortField, sortDir, onSort, style }) => (
  <th onClick={() => onSort(field)} style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer', userSelect: 'none', borderBottom: `2px solid ${T.border}`, textAlign: 'left', whiteSpace: 'nowrap', ...style }}>
    {label} {sortField === field ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
  </th>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 11, color: p.color, marginBottom: 2 }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function ControversyMaterialityPage() {
  const navigate = useNavigate();

  /* ── Portfolio from localStorage ── */
  const portfolio = useMemo(() => {
    const raw = loadLS(LS_PORT);
    if (raw && raw.portfolios && raw.activePortfolio && raw.portfolios[raw.activePortfolio]) {
      return raw.portfolios[raw.activePortfolio].holdings || [];
    }
    if (Array.isArray(raw) && raw.length) return raw;
    return GLOBAL_COMPANY_MASTER.slice(0, 20).map(c => ({ ...c, weight: 5.0 }));
  }, []);

  const holdings = useMemo(() => {
    return portfolio.map(h => {
      const match = GLOBAL_COMPANY_MASTER.find(c => c.isin === h.isin || c.ticker === h.ticker || c.company_name === h.company_name);
      return { ...h, ...match, weight: h.weight || h.portfolio_weight || 5 };
    }).filter(h => h.company_name);
  }, [portfolio]);

  /* ── State ── */
  const [sortField, setSortField] = useState('severity');
  const [sortDir, setSortDir] = useState('desc');
  const [sevFilter, setSevFilter] = useState(0);
  const [topicFilter, setTopicFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tab, setTab] = useState('overview');

  /* ── Prefs ── */
  useEffect(() => { saveLS(LS_PREFS, { sevFilter, topicFilter, typeFilter }); }, [sevFilter, topicFilter, typeFilter]);
  useEffect(() => {
    const p = loadLS(LS_PREFS);
    if (p) { if (p.sevFilter) setSevFilter(p.sevFilter); if (p.topicFilter) setTopicFilter(p.topicFilter); }
  }, []);

  /* ── Filtered events ── */
  const filteredEvents = useMemo(() => {
    return ENRICHED_EVENTS.filter(e => {
      if (sevFilter > 0 && e.severity < sevFilter) return false;
      if (topicFilter !== 'all' && !e.esrsTopics.includes(topicFilter)) return false;
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      return true;
    });
  }, [sevFilter, topicFilter, typeFilter]);

  /* ── Sort handler ── */
  const handleSort = useCallback((field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }, [sortField]);

  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const av = a[sortField], bv = b[sortField];
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av || '').localeCompare(String(bv || '')) : String(bv || '').localeCompare(String(av || ''));
    });
  }, [filteredEvents, sortField, sortDir]);

  /* ── KPI computations ── */
  const kpiData = useMemo(() => {
    const allTopics = new Set();
    ENRICHED_EVENTS.forEach(e => e.esrsTopics.forEach(t => allTopics.add(t)));
    const totalImpact = ENRICHED_EVENTS.reduce((s, e) => s + e.estImpactUsd, 0);
    const holdingTickers = new Set(holdings.map(h => h.ticker));
    const affectedHoldings = ENRICHED_EVENTS.filter(e => holdingTickers.has(e.ticker)).length;
    const avgSeverity = (ENRICHED_EVENTS.reduce((s, e) => s + e.severity, 0) / ENRICHED_EVENTS.length).toFixed(1);

    const materialTopics = ESRS_TOPICS.filter(t => t.materialScore >= 50);
    const materialIds = new Set(materialTopics.map(t => t.id));
    const topicControversyCounts = {};
    ENRICHED_EVENTS.forEach(e => e.esrsTopics.forEach(t => { topicControversyCounts[t] = (topicControversyCounts[t] || 0) + 1; }));
    const validated = Object.keys(topicControversyCounts).filter(t => materialIds.has(t)).length;
    const challenged = Object.keys(topicControversyCounts).filter(t => !materialIds.has(t)).length;
    const engagementTriggered = ENRICHED_EVENTS.filter(e => e.severity >= 4 && holdingTickers.has(e.ticker)).length;

    return { totalEvents: ENRICHED_EVENTS.length, topicsAffected: allTopics.size, totalImpact, affectedHoldings, avgSeverity, validated, challenged, engagementTriggered };
  }, [holdings]);

  /* ── Controversy-Topic Sankey (simulated as stacked bar) ── */
  const sankeyData = useMemo(() => {
    const counts = {};
    ENRICHED_EVENTS.forEach(e => {
      e.esrsTopics.forEach(tid => {
        const key = `${e.type}||${tid}`;
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    const topicTotals = {};
    Object.entries(counts).forEach(([k, v]) => {
      const tid = k.split('||')[1];
      topicTotals[tid] = (topicTotals[tid] || 0) + v;
    });
    return ESRS_TOPICS.map(t => {
      const row = { topic: t.id, label: `${t.id} ${t.label}`, total: topicTotals[t.id] || 0 };
      const types = [...new Set(ENRICHED_EVENTS.map(e => e.type))];
      types.forEach(tp => { row[tp] = counts[`${tp}||${t.id}`] || 0; });
      return row;
    }).filter(r => r.total > 0).sort((a, b) => b.total - a.total);
  }, []);

  const controversyTypes = useMemo(() => [...new Set(ENRICHED_EVENTS.map(e => e.type))], []);

  /* ── Materiality Validation Table ── */
  const validationData = useMemo(() => {
    return ESRS_TOPICS.map(t => {
      const supporting = ENRICHED_EVENTS.filter(e => e.esrsTopics.includes(t.id) && e.severity >= 3).length;
      const total = ENRICHED_EVENTS.filter(e => e.esrsTopics.includes(t.id)).length;
      const avgSev = total > 0 ? ENRICHED_EVENTS.filter(e => e.esrsTopics.includes(t.id)).reduce((s, e) => s + e.severity, 0) / total : 0;
      const isMaterial = t.materialScore >= 50;
      const status = isMaterial && total > 0 ? 'validated' : !isMaterial && total > 0 ? 'gap' : isMaterial && total === 0 ? 'untested' : 'non-material';
      return { ...t, supporting, total, avgSev, isMaterial, status, netScore: supporting * avgSev };
    });
  }, []);

  /* ── Severity by topic bar chart ── */
  const severityByTopic = useMemo(() => {
    return ESRS_TOPICS.map(t => {
      const events = ENRICHED_EVENTS.filter(e => e.esrsTopics.includes(t.id));
      const totalSeverity = events.reduce((s, e) => s + e.severity, 0);
      const maxSev = events.length > 0 ? Math.max(...events.map(e => e.severity)) : 0;
      return { topic: t.id, label: t.label, totalSeverity, maxSev, count: events.length };
    }).sort((a, b) => b.totalSeverity - a.totalSeverity);
  }, []);

  /* ── "Would This Have Been Caught?" ── */
  const caughtAnalysis = useMemo(() => {
    const materialIds = new Set(ESRS_TOPICS.filter(t => t.materialScore >= 50).map(t => t.id));
    return ENRICHED_EVENTS.map(e => {
      const flagged = e.esrsTopics.some(t => materialIds.has(t));
      return { ...e, flaggedAsMaterial: flagged, status: flagged ? 'Caught' : 'Gap' };
    });
  }, []);

  /* ── Engagement Recommendations ── */
  const engagementRecs = useMemo(() => {
    const holdingTickers = new Set(holdings.map(h => h.ticker));
    const recs = {};
    ENRICHED_EVENTS.filter(e => holdingTickers.has(e.ticker) && e.severity >= 3).forEach(e => {
      if (!recs[e.ticker]) recs[e.ticker] = { company: e.company, ticker: e.ticker, topics: new Set(), events: [], maxSev: 0, totalImpact: 0 };
      e.esrsTopics.forEach(t => recs[e.ticker].topics.add(t));
      recs[e.ticker].events.push(e);
      recs[e.ticker].maxSev = Math.max(recs[e.ticker].maxSev, e.severity);
      recs[e.ticker].totalImpact += e.estImpactUsd;
    });
    return Object.values(recs).map(r => ({ ...r, topics: [...r.topics], eventCount: r.events.length })).sort((a, b) => b.maxSev - a.maxSev || b.totalImpact - a.totalImpact);
  }, [holdings]);

  /* ── Materiality Gap Alerts ── */
  const materialityGaps = useMemo(() => {
    const nonMaterialIds = new Set(ESRS_TOPICS.filter(t => t.materialScore < 50).map(t => t.id));
    const gapTopics = {};
    ENRICHED_EVENTS.filter(e => e.severity >= 3).forEach(e => {
      e.esrsTopics.filter(t => nonMaterialIds.has(t)).forEach(t => {
        if (!gapTopics[t]) gapTopics[t] = { topic: TOPIC_MAP[t], events: [], totalSev: 0 };
        gapTopics[t].events.push(e);
        gapTopics[t].totalSev += e.severity;
      });
    });
    return Object.values(gapTopics).sort((a, b) => b.totalSev - a.totalSev);
  }, []);

  /* ── Portfolio exposure matrix ── */
  const portfolioExposure = useMemo(() => {
    const holdingTickers = new Set(holdings.map(h => h.ticker));
    const exposure = {};
    ENRICHED_EVENTS.filter(e => holdingTickers.has(e.ticker)).forEach(e => {
      e.esrsTopics.forEach(tid => {
        const key = `${e.ticker}||${tid}`;
        if (!exposure[key]) exposure[key] = { company: e.company, ticker: e.ticker, topic: tid, sevSum: 0, count: 0 };
        exposure[key].sevSum += e.severity;
        exposure[key].count += 1;
      });
    });
    return Object.values(exposure).sort((a, b) => b.sevSum - a.sevSum);
  }, [holdings]);

  /* ── Export helpers ── */
  const exportCSV = useCallback((data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
    const csv = [keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }, []);

  const exportJSON = useCallback((data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }, []);

  const exportMarkdown = useCallback(() => {
    let md = '# Controversy-Materiality Linkage Report\n\n';
    md += `Generated: ${new Date().toISOString().split('T')[0]}\n`;
    md += `Total Controversies: ${ENRICHED_EVENTS.length}\n\n`;
    md += '## Validation Summary\n\n| Topic | Material? | # Controversies | Status |\n|---|---|---|---|\n';
    validationData.forEach(v => { md += `| ${v.id} ${v.label} | ${v.isMaterial ? 'Yes' : 'No'} | ${v.total} | ${v.status} |\n`; });
    md += '\n## Controversies\n\n';
    ENRICHED_EVENTS.forEach(e => { md += `- **${e.id}** ${e.company}: ${e.type} (Sev ${e.severity}) - ${e.esrsTopics.join(', ')}\n`; });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'controversy-materiality-report.md'; a.click(); URL.revokeObjectURL(url);
  }, [validationData]);

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.navy }}>Controversy-Materiality Linkage Engine</div>
          <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>
            Links ESG controversies to ESRS materiality topics, validating or challenging your materiality assessments
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <Badge label="30 Events Tracked" color="navy" />
            <Badge label="ESRS Mapped" color="sage" />
            <Badge label="Validation Engine" color="gold" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Btn onClick={() => exportCSV(ENRICHED_EVENTS.map(e => ({ id: e.id, company: e.company, type: e.type, severity: e.severity, esrsTopics: e.esrsTopics.join(';'), date: e.date, impactUsd: e.estImpactUsd })), 'controversy-materiality.csv')} sm>Export CSV</Btn>
          <Btn onClick={() => exportJSON({ events: ENRICHED_EVENTS, validation: validationData, gaps: materialityGaps }, 'controversy-materiality.json')} sm>Export JSON</Btn>
          <Btn onClick={exportMarkdown} sm>Export MD</Btn>
        </div>
      </div>

      {/* ── 8 KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Controversies Tracked" value={kpiData.totalEvents} sub="Across all sectors" />
        <KpiCard label="ESRS Topics Affected" value={kpiData.topicsAffected} sub="of 10 total topics" color={T.navy} />
        <KpiCard label="Financial Impact (est.)" value={fmtM(kpiData.totalImpact)} sub="Aggregate USD" color={T.red} />
        <KpiCard label="Holdings Affected" value={kpiData.affectedHoldings} sub={`of ${holdings.length} portfolio`} color={T.amber} />
        <KpiCard label="Avg Severity" value={kpiData.avgSeverity} sub="out of 5.0" color={T.gold} />
        <KpiCard label="Topics Validated" value={kpiData.validated} sub="Material + controversy" color={T.green} />
        <KpiCard label="Topics Challenged" value={kpiData.challenged} sub="Gap identified" color={T.red} />
        <KpiCard label="Engagement Triggered" value={kpiData.engagementTriggered} sub="Severity >= 4 on holdings" color={T.sage} />
      </div>

      {/* ── Tab Nav ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {['overview','validation','portfolio','engagement'].map(t => (
          <Btn key={t} onClick={() => setTab(t)} active={tab === t} sm>{t.charAt(0).toUpperCase() + t.slice(1)}</Btn>
        ))}
      </div>

      {/* ════════════════════════════════════════════════
         SECTION 3 — Controversy-Topic Flow (Bar Chart)
         ════════════════════════════════════════════════ */}
      <Section title="Controversy-Topic Flow" sub="Volume of controversies flowing from types to ESRS topics">
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={sankeyData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="topic" tick={{ fontSize: 11, fill: T.textSec }} width={40} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {controversyTypes.slice(0, 8).map((tp, i) => (
              <Bar key={tp} dataKey={tp} name={tp} stackId="a" fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ════════════════════════════════════════════════
         SECTION 4 — Materiality Validation Table
         ════════════════════════════════════════════════ */}
      {(tab === 'overview' || tab === 'validation') && (
        <Section title="Materiality Validation Table" sub="For each topic: supporting controversies, challenge status, and net validation score">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase' }}>Topic</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, fontSize: 11 }}>Material?</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, fontSize: 11 }}>Score</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, fontSize: 11 }}>Total Events</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, fontSize: 11 }}>High-Sev Events</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, fontSize: 11 }}>Avg Severity</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, fontSize: 11 }}>Net Score</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}`, fontSize: 11 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {validationData.map((v, i) => (
                  <tr key={v.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                    <td style={{ padding: '10px 8px', fontWeight: 700 }}>{v.id} {v.label}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <Badge label={v.isMaterial ? 'Yes' : 'No'} color={v.isMaterial ? 'green' : 'gray'} />
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{v.materialScore}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{v.total}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{v.supporting}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{v.avgSev > 0 ? v.avgSev.toFixed(1) : '-'}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: v.netScore > 10 ? T.red : v.netScore > 5 ? T.amber : T.green }}>{v.netScore.toFixed(1)}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <Badge label={v.status === 'validated' ? 'Validated' : v.status === 'gap' ? 'Gap' : v.status === 'untested' ? 'Untested' : 'N/A'}
                        color={v.status === 'validated' ? 'green' : v.status === 'gap' ? 'red' : v.status === 'untested' ? 'amber' : 'gray'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ════════════════════════════════════════════════
         SECTION 5 — Controversy Timeline
         ════════════════════════════════════════════════ */}
      <Section title="Controversy Timeline" sub="Chronological event feed with ESRS topic badges">
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {[...ENRICHED_EVENTS].sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => (
            <div key={e.id} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ minWidth: 80, fontSize: 11, color: T.textMut, fontFamily: 'monospace' }}>{e.date}</div>
              <div style={{
                minWidth: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: SEV_COLOR[e.severity] || T.textMut, color: '#fff', fontSize: 12, fontWeight: 700,
              }}>{e.severity}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{e.company}</span>
                  <Badge label={e.type} color="navy" />
                  {e.esrsTopics.map(tid => <Badge key={tid} label={tid} color={tid.startsWith('E') ? 'green' : tid.startsWith('S') ? 'blue' : 'gold'} />)}
                </div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{e.description}</div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>
                  Impact: {fmtM(e.estImpactUsd)} | Region: {e.region} | Remediation: {e.remediation}
                  {e.verified && <span style={{ color: T.green, marginLeft: 6 }}> Verified</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ════════════════════════════════════════════════
         SECTION 6 — Portfolio Controversy Exposure
         ════════════════════════════════════════════════ */}
      {(tab === 'overview' || tab === 'portfolio') && (
        <Section title="Portfolio Controversy Exposure" sub="Holdings affected by controversies, severity-weighted by ESRS topic">
          {portfolioExposure.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: T.textMut, fontSize: 13 }}>
              No portfolio holdings have matching controversies in this dataset.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.textSec }}>Company</th>
                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.textSec }}>ESRS Topic</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: `2px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.textSec }}>Event Count</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: `2px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.textSec }}>Severity Sum</th>
                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.textSec }}>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioExposure.slice(0, 20).map((exp, i) => (
                    <tr key={`${exp.ticker}-${exp.topic}`} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{exp.company}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}><Badge label={exp.topic} color={exp.topic.startsWith('E') ? 'green' : exp.topic.startsWith('S') ? 'blue' : 'gold'} /></td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'monospace' }}>{exp.count}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{exp.sevSum}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <Badge label={exp.sevSum >= 8 ? 'Critical' : exp.sevSum >= 5 ? 'High' : 'Moderate'} color={exp.sevSum >= 8 ? 'red' : exp.sevSum >= 5 ? 'amber' : 'gold'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {/* ════════════════════════════════════════════════
         SECTION 7 — Controversy Severity by Topic
         ════════════════════════════════════════════════ */}
      <Section title="Controversy Severity by ESRS Topic" sub="Which topics accumulate the most severity from real-world controversies?">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={severityByTopic}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="topic" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="totalSeverity" name="Total Severity" radius={[4, 4, 0, 0]}>
              {severityByTopic.map((d, i) => <Cell key={d.topic} fill={d.totalSeverity >= 15 ? T.red : d.totalSeverity >= 8 ? T.amber : T.sage} />)}
            </Bar>
            <Bar dataKey="count" name="Event Count" fill={T.navy} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ════════════════════════════════════════════════
         SECTION 8 — "Would This Have Been Caught?" Analysis
         ════════════════════════════════════════════════ */}
      <Section title={'"Would This Have Been Caught?" Analysis'} sub="For each controversy: was the impacted topic already flagged as material?">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
          <div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={[
                  { name: 'Caught (topic was material)', value: caughtAnalysis.filter(e => e.flaggedAsMaterial).length },
                  { name: 'Gap (topic was NOT material)', value: caughtAnalysis.filter(e => !e.flaggedAsMaterial).length },
                ]} cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  <Cell fill={T.green} />
                  <Cell fill={T.red} />
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Assessment Gaps (Not Caught)</div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {caughtAnalysis.filter(e => !e.flaggedAsMaterial).map(e => (
                <div key={e.id} style={{ padding: 8, marginBottom: 6, border: `1px solid ${T.red}`, borderRadius: 6, background: '#fef2f2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: 12 }}>{e.id} {e.company}</span>
                    <Badge label={`Sev ${e.severity}`} color="red" />
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{e.type} &mdash; topics {e.esrsTopics.join(', ')} were not flagged as material</div>
                </div>
              ))}
              {caughtAnalysis.filter(e => !e.flaggedAsMaterial).length === 0 && (
                <div style={{ padding: 12, color: T.green, fontSize: 12 }}>All controversies were caught by existing materiality assessments.</div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════
         SECTION 9 — Engagement Recommendations
         ════════════════════════════════════════════════ */}
      {(tab === 'overview' || tab === 'engagement') && (
        <Section title="Engagement Recommendations" sub="Based on controversy-materiality linkage: which holdings need engagement on which topics?">
          {engagementRecs.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: T.textMut }}>No engagement actions triggered for current portfolio holdings.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
              {engagementRecs.map(r => (
                <div key={r.ticker} style={{ padding: 16, border: `2px solid ${r.maxSev >= 5 ? T.red : r.maxSev >= 4 ? T.amber : T.border}`, borderRadius: 10, background: r.maxSev >= 5 ? '#fef2f2' : r.maxSev >= 4 ? '#fffbeb' : T.surface }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: T.navy }}>{r.company}</span>
                    <Badge label={`Sev ${r.maxSev}`} color={r.maxSev >= 5 ? 'red' : r.maxSev >= 4 ? 'amber' : 'gold'} />
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>
                    {r.eventCount} events | Est. impact: {fmtM(r.totalImpact)}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Engage on topics:</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                    {r.topics.map(t => <Badge key={t} label={`${t} ${TOPIC_MAP[t]?.label || ''}`} color={t.startsWith('E') ? 'green' : t.startsWith('S') ? 'blue' : 'gold'} />)}
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec }}>
                    <strong>Recommended actions:</strong> Request remediation disclosure, escalate to board if severity 5, consider voting sanctions at AGM.
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ════════════════════════════════════════════════
         SECTION 10 — Sortable Controversy Table
         ════════════════════════════════════════════════ */}
      <Section title="Full Controversy Register" sub="All 30 events with ESRS mapping, severity, and financial impact">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.textSec }}>Filter:</span>
          <select value={sevFilter} onChange={e => setSevFilter(parseInt(e.target.value))} style={{ padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, fontFamily: T.font }}>
            <option value={0}>All Severities</option>
            {[5,4,3,2,1].map(s => <option key={s} value={s}>{SEV_LABEL[s]} ({s}+)</option>)}
          </select>
          <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)} style={{ padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, fontFamily: T.font }}>
            <option value="all">All Topics</option>
            {ESRS_TOPICS.map(t => <option key={t.id} value={t.id}>{t.id} {t.label}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, fontFamily: T.font }}>
            <option value="all">All Types</option>
            {controversyTypes.map(tp => <option key={tp} value={tp}>{tp}</option>)}
          </select>
          <span style={{ fontSize: 11, color: T.textMut }}>{filteredEvents.length} of {ENRICHED_EVENTS.length} events</span>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 500 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead style={{ position: 'sticky', top: 0, background: T.surface, zIndex: 1 }}>
              <tr>
                <SortHeader label="ID" field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Company" field="company" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Sector" field="sector" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Type" field="type" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Severity" field="severity" sortField={sortField} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'center' }} />
                <SortHeader label="Date" field="date" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Impact USD" field="estImpactUsd" sortField={sortField} sortDir={sortDir} onSort={handleSort} style={{ textAlign: 'right' }} />
                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: T.textSec, borderBottom: `2px solid ${T.border}` }}>ESRS Topics</th>
                <SortHeader label="Region" field="region" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Remediation" field="remediation" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((e, i) => (
                <tr key={e.id} style={{ background: i % 2 ? T.surfaceH : T.surface }}>
                  <td style={{ padding: '8px', fontWeight: 600, color: T.textSec }}>{e.id}</td>
                  <td style={{ padding: '8px', fontWeight: 700 }}>{e.company}</td>
                  <td style={{ padding: '8px' }}>{e.sector}</td>
                  <td style={{ padding: '8px' }}><Badge label={e.type} color="navy" /></td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', minWidth: 24, height: 24, borderRadius: '50%', lineHeight: '24px', textAlign: 'center', background: SEV_COLOR[e.severity], color: '#fff', fontWeight: 700, fontSize: 11 }}>{e.severity}</span>
                  </td>
                  <td style={{ padding: '8px', fontFamily: 'monospace' }}>{e.date}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'monospace' }}>{fmtM(e.estImpactUsd)}</td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {e.esrsTopics.map(t => <Badge key={t} label={t} color={t.startsWith('E') ? 'green' : t.startsWith('S') ? 'blue' : 'gold'} />)}
                    </div>
                  </td>
                  <td style={{ padding: '8px' }}>{e.region}</td>
                  <td style={{ padding: '8px' }}>
                    <Badge label={e.remediation} color={e.remediation === 'substantial' || e.remediation === 'full' ? 'green' : e.remediation === 'partial' ? 'amber' : e.remediation === 'acknowledged' ? 'gold' : 'red'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ════════════════════════════════════════════════
         SECTION 11 — Materiality Gap Alerts
         ════════════════════════════════════════════════ */}
      <Section title="Materiality Gap Alerts" sub="Topics NOT flagged as material that have high-severity controversies = assessment gap" accent>
        {materialityGaps.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: T.green, fontSize: 13 }}>
            No materiality assessment gaps detected. All high-severity controversy topics are already flagged as material.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
            {materialityGaps.map(g => (
              <div key={g.topic.id} style={{ padding: 16, border: `2px solid ${T.red}`, borderRadius: 10, background: '#fef2f2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: T.navy }}>{g.topic.id} {g.topic.label}</span>
                  <Badge label="ASSESSMENT GAP" color="red" />
                </div>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 6 }}>
                  Material Score: {g.topic.materialScore} (below threshold) | {g.events.length} controversies | Cumulative severity: {g.totalSev}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.red, marginBottom: 4 }}>Triggering events:</div>
                {g.events.slice(0, 3).map(e => (
                  <div key={e.id} style={{ fontSize: 11, color: T.textSec, marginBottom: 2 }}>
                    - {e.id} {e.company}: {e.type} (sev {e.severity})
                  </div>
                ))}
                <div style={{ marginTop: 8, fontSize: 11, color: T.navy, fontWeight: 600 }}>
                  Recommendation: Reassess materiality for {g.topic.id}. Real-world events suggest higher materiality than current scoring reflects.
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ════════════════════════════════════════════════
         SECTION 12 — Cross-Navigation
         ════════════════════════════════════════════════ */}
      <Section title="Cross-Module Navigation" sub="Navigate to related modules for deeper analysis">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {[
            { label: 'Double Materiality Assessment', path: '/double-materiality', desc: 'Full ESRS materiality matrix with financial & impact dimensions' },
            { label: 'Controversy Monitor', path: '/controversy-monitor', desc: 'Real-time ESG controversy tracking with 50+ incident types' },
            { label: 'Stewardship Tracker', path: '/stewardship-tracker', desc: 'Engagement activities, voting records, and escalation tracking' },
            { label: 'Regulatory Gap Analysis', path: '/regulatory-gap', desc: 'Identify compliance gaps across ESG regulatory frameworks' },
            { label: 'Materiality Trend Analyzer', path: '/materiality-trends', desc: 'Forecast how materiality evolves with regulation, science, and market shifts' },
            { label: 'CSDDD Compliance', path: '/csddd-compliance', desc: 'EU supply chain due diligence compliance assessment' },
          ].map(n => (
            <div key={n.path} onClick={() => navigate(n.path)} style={{
              padding: 16, border: `1px solid ${T.border}`, borderRadius: 10, cursor: 'pointer',
              background: T.surface, transition: 'all .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.navy; e.currentTarget.style.background = T.surfaceH; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{n.label}</div>
              <div style={{ fontSize: 11, color: T.textSec }}>{n.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Footer ── */}
      <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 11, color: T.textMut }}>
        Controversy-Materiality Linkage Engine &mdash; Sprint T: Dynamic Materiality Engine &mdash; {ENRICHED_EVENTS.length} events, {ESRS_TOPICS.length} topics, ESRS-mapped validation
      </div>
    </div>
  );
}
