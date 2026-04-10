import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, ReferenceLine, TreemapChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  surface: '#fafaf7', border: '#e2e0d8', navy: '#1b2a4a', gold: '#b8962e',
  text: '#1a1a2e', sub: '#64748b', card: '#ffffff', indigo: '#4f46e5',
  green: '#065f46', red: '#991b1b', amber: '#92400e',
  teal: '#0e7490', purple: '#6d28d9', blue: '#1d4ed8', orange: '#c2410c',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

/* ═══════════════════════════════════════════════════════════════════
   4-LEVEL METRIC HIERARCHY
   ═══════════════════════════════════════════════════════════════════ */
const L1_STRATEGIC = [
  { id: 'L1-01', name: 'Climate & Carbon', desc: 'GHG emissions, energy transition, carbon pricing', color: '#dc2626', l2Count: 8 },
  { id: 'L1-02', name: 'Natural Capital', desc: 'Water, biodiversity, land use, circular economy', color: '#16a34a', l2Count: 7 },
  { id: 'L1-03', name: 'Social & Human Capital', desc: 'Workforce, community, human rights, health & safety', color: '#2563eb', l2Count: 8 },
  { id: 'L1-04', name: 'Governance & Ethics', desc: 'Board, anti-corruption, executive pay, lobbying', color: '#7c3aed', l2Count: 6 },
  { id: 'L1-05', name: 'Financial Integration', desc: 'Climate VaR, stranded assets, green revenue, TCFD', color: '#0891b2', l2Count: 7 },
  { id: 'L1-06', name: 'Regulatory Compliance', desc: 'CSRD, ISSB, SFDR, EU Taxonomy, BRSR, SEC', color: '#d97706', l2Count: 8 },
  { id: 'L1-07', name: 'Supply Chain', desc: 'Scope 3, supplier ESG, CSDDD, modern slavery', color: '#be123c', l2Count: 6 },
  { id: 'L1-08', name: 'Innovation & Transition', desc: 'R&D, green patents, CapEx alignment, technology', color: '#0f766e', l2Count: 5 },
];

const L2_SECTIONS = L1_STRATEGIC.flatMap((l1, li) => Array.from({ length: l1.l2Count }, (_, si) => {
  const seed = li * 100 + si * 11 + 300;
  const names = {
    'L1-01': ['Scope 1 Direct','Scope 2 Energy','Scope 3 Value Chain','Energy Consumption','GHG Intensity','Carbon Pricing Exposure','Transition Risk','Climate Targets'],
    'L1-02': ['Water Withdrawal','Water Stress','Biodiversity Impact','Deforestation','Circular Economy','Pollution','Ocean Health'],
    'L1-03': ['Workforce Diversity','Health & Safety','Living Wage','Human Rights','Employee Engagement','Training','Community Impact','Modern Slavery'],
    'L1-04': ['Board Composition','Executive Pay','Anti-Corruption','Lobbying','Tax Transparency','Shareholder Rights'],
    'L1-05': ['Climate VaR','Stranded Assets','Green Revenue','TCFD Alignment','Financed Emissions','Greenium','ESG Integration'],
    'L1-06': ['CSRD Readiness','ISSB Compliance','SFDR Classification','EU Taxonomy Alignment','BRSR Compliance','SEC Disclosure','TCFD Alignment','UK SDR'],
    'L1-07': ['Scope 3 Coverage','Supplier Assessment','CSDDD Compliance','Conflict Minerals','Living Wage Chain','Deforestation-Free'],
    'L1-08': ['Green R&D Spend','Climate Patents','Green CapEx Ratio','Technology Readiness','Innovation Pipeline'],
  };
  const n = (names[l1.id] || [])[si] || `Section ${si + 1}`;
  return {
    id: `L2-${String(li * 10 + si + 1).padStart(3, '0')}`,
    parentId: l1.id,
    parentName: l1.name,
    name: n,
    l3Count: Math.floor(3 + sr(seed) * 5),
    metricCount: Math.floor(10 + sr(seed + 1) * 25),
    assuranceLevel: ['None','Limited','Reasonable','High'][Math.floor(sr(seed + 2) * 4)],
    dataFreshness: ['Real-time','Monthly','Quarterly','Annual'][Math.floor(sr(seed + 3) * 4)],
    qualityScore: Math.round(50 + sr(seed + 4) * 50),
  };
}));

const TOTAL_L3 = L2_SECTIONS.reduce((s, l) => s + l.l3Count, 0);
const TOTAL_L4 = L2_SECTIONS.reduce((s, l) => s + l.metricCount, 0);

/* ═══════════════════════════════════════════════════════════════════
   CONTEXT DIMENSIONS
   ═══════════════════════════════════════════════════════════════════ */
const CONTEXT_DIMS = ['Magnitude', 'Trend', 'Target', 'Benchmark', 'Impact'];

/* ═══════════════════════════════════════════════════════════════════
   INTEROPERABILITY MATRIX
   ═══════════════════════════════════════════════════════════════════ */
const INTEROP_METRICS = [
  { metric: 'GHG Scope 1 (tCO2e)', esrs: 'E1-6', gri: '305-1', issb: 'S2.29a', brsr: 'P-VII-Q14', sasb: 'Varies', tcfd: 'Metrics a)' },
  { metric: 'GHG Scope 2 (tCO2e)', esrs: 'E1-6', gri: '305-2', issb: 'S2.29b', brsr: 'P-VII-Q14', sasb: 'Varies', tcfd: 'Metrics a)' },
  { metric: 'GHG Scope 3 (tCO2e)', esrs: 'E1-6', gri: '305-3', issb: 'S2.29c', brsr: 'P-VII-Q15', sasb: 'Varies', tcfd: 'Metrics a)' },
  { metric: 'Energy Consumption (MWh)', esrs: 'E1-5', gri: '302-1', issb: 'S2.29e', brsr: 'P-VII-Q11', sasb: 'Varies', tcfd: 'Metrics b)' },
  { metric: 'Water Withdrawal (ML)', esrs: 'E3-4', gri: '303-3', issb: '-', brsr: 'P-VII-Q18', sasb: 'Varies', tcfd: '-' },
  { metric: 'Waste Generated (t)', esrs: 'E5-5', gri: '306-3', issb: '-', brsr: 'P-VII-Q20', sasb: 'Varies', tcfd: '-' },
  { metric: 'Gender Diversity (%)', esrs: 'S1-9', gri: '405-1', issb: '-', brsr: 'P-V-Q1', sasb: 'Varies', tcfd: '-' },
  { metric: 'Board Independence (%)', esrs: 'GOV-1', gri: '2-9', issb: 'S1.27', brsr: 'P-I-Q2', sasb: '-', tcfd: 'Governance a)' },
];

/* ═══════════════════════════════════════════════════════════════════
   KPI DEFINITION TEMPLATE
   ═══════════════════════════════════════════════════════════════════ */
const KPI_TEMPLATE_FIELDS = [
  { field: 'KPI Name', desc: 'Clear, specific metric name', example: 'GHG Scope 1 Emissions (market-based)' },
  { field: 'Unit of Measure', desc: 'SI unit or standard unit', example: 'tCO2e' },
  { field: 'Definition', desc: 'Precise calculation methodology', example: 'Sum of direct GHG emissions from owned/controlled sources' },
  { field: 'Boundary', desc: 'Organizational and operational boundary', example: 'Operational control, 100% of Scope 1 sources' },
  { field: 'Data Source', desc: 'Primary data collection system', example: 'CEMS, fuel purchase records, fleet telematics' },
  { field: 'Emission Factor', desc: 'Applied conversion factor and source', example: 'DEFRA 2024 UK GHG Conversion Factors' },
  { field: 'Base Year', desc: 'Reference year for comparisons', example: '2019 (re-baselined 2023 for M&A)' },
  { field: 'Reporting Frequency', desc: 'How often data is collected/reported', example: 'Quarterly collection, annual reporting' },
  { field: 'Assurance Level', desc: 'ISAE 3000 assurance type', example: 'Reasonable assurance (EY, ISAE 3000)' },
  { field: 'Target', desc: 'Short and long-term targets', example: '-42% by 2030 vs 2019 (SBTi validated)' },
  { field: 'Framework Mapping', desc: 'Applicable disclosure frameworks', example: 'ESRS E1-6, GRI 305-1, ISSB S2.29a, TCFD' },
  { field: 'Data Quality Score', desc: 'Internal quality assessment', example: 'DQS 1.8 (PCAF methodology)' },
  { field: 'Materiality', desc: 'Double materiality assessment result', example: 'Material (impact + financial)' },
  { field: 'Owner', desc: 'Accountable person/department', example: 'Head of Sustainability / ESG Data Team' },
  { field: 'Retention Period', desc: 'Data retention policy', example: '7 years source, 10 years audit trail' },
];

/* ═══════════════════════════════════════════════════════════════════
   FRAMEWORK CROSSWALK
   ═══════════════════════════════════════════════════════════════════ */
const CROSSWALK = Array.from({ length: 40 }, (_, i) => {
  const seed = i * 37 + 600;
  const metrics = ['GHG Scope 1','GHG Scope 2','GHG Scope 3','Energy Use','Water Withdrawal','Waste Generated','LTIR','Gender Pay Gap','Board Independence','Anti-Corruption Training','Green Revenue %','Climate VaR','Financed Emissions','Biodiversity Net Gain','Circular Material Rate','Employee Turnover','Training Hours','Community Investment','Tax Paid','Lobbying Spend','Scope 3 Cat 1','Scope 3 Cat 11','Renewable Energy %','Science-Based Target','Net Zero Commitment','Carbon Intensity','Water Recycled %','Hazardous Waste','Living Wage Coverage','Supplier ESG Score','EU Taxonomy Alignment','SFDR PAI #1','SFDR PAI #2','TCFD Coverage','CDP Score','MSCI Rating Input','S&P Global CSA','ISS Metric','Sustainalytics Input','BRSR Core'];
  return {
    metric: metrics[i],
    esrs: `E${Math.floor(sr(seed) * 5) + 1}-${Math.floor(sr(seed + 1) * 9) + 1}`,
    gri: `${300 + Math.floor(sr(seed + 2) * 100)}-${Math.floor(sr(seed + 3) * 5) + 1}`,
    issb: sr(seed + 4) > 0.3 ? `S${Math.floor(sr(seed + 5) * 2) + 1}.${Math.floor(sr(seed + 6) * 40) + 1}` : '-',
    brsr: sr(seed + 7) > 0.4 ? `P-${['I','II','III','IV','V','VI','VII','VIII','IX'][Math.floor(sr(seed + 8) * 9)]}-Q${Math.floor(sr(seed + 9) * 25) + 1}` : '-',
    sasb: sr(seed + 10) > 0.3 ? 'Sector-specific' : '-',
    coverage: Math.round(40 + sr(seed + 11) * 60),
  };
});

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
const TABS = ['Hierarchy Explorer','Strategic Dashboard','Section Metrics','Interoperability Matrix','KPI Definition Builder','Framework Crosswalk','Data Quality Scoring','Context Generator'];

const KPI = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, borderRadius: 10, padding: '16px 20px', border: `1px solid ${T.border}`, minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.text, fontFamily: T.mono, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function MetricsDataArchitecturePage() {
  const [tab, setTab] = useState(0);
  const [expandedL1, setExpandedL1] = useState({});
  const [expandedL2, setExpandedL2] = useState({});
  const [selectedL1, setSelectedL1] = useState(null);
  const [kpiValues, setKpiValues] = useState({});
  const [contextMetric, setContextMetric] = useState('');
  const [contextResult, setContextResult] = useState(null);
  const [crossFilter, setCrossFilter] = useState('All');
  const [qualityFilter, setQualityFilter] = useState('All');

  const toggleL1 = useCallback(id => setExpandedL1(p => ({ ...p, [id]: !p[id] })), []);
  const toggleL2 = useCallback(id => setExpandedL2(p => ({ ...p, [id]: !p[id] })), []);

  const l2ForSelected = useMemo(() => selectedL1 ? L2_SECTIONS.filter(l => l.parentId === selectedL1) : L2_SECTIONS, [selectedL1]);

  const avgQuality = useMemo(() => {
    const len = L2_SECTIONS.length;
    return len > 0 ? Math.round(L2_SECTIONS.reduce((s, l) => s + l.qualityScore, 0) / len) : 0;
  }, []);

  const filteredCrosswalk = useMemo(() => {
    if (crossFilter === 'All') return CROSSWALK;
    return CROSSWALK.filter(c => c.metric.toLowerCase().includes(crossFilter.toLowerCase()));
  }, [crossFilter]);

  const filteredQuality = useMemo(() => {
    if (qualityFilter === 'All') return L2_SECTIONS;
    return L2_SECTIONS.filter(l => l.assuranceLevel === qualityFilter);
  }, [qualityFilter]);

  const generateContext = useCallback(() => {
    if (!contextMetric.trim()) return;
    const seed = contextMetric.length * 17 + 99;
    setContextResult({
      metric: contextMetric,
      magnitude: `Current value: ${(100 + sr(seed) * 900).toFixed(1)} units. Represents ${(sr(seed + 1) * 5 + 0.5).toFixed(1)}% of total organizational footprint.`,
      trend: `${sr(seed + 2) > 0.5 ? 'Decreasing' : 'Increasing'} ${(sr(seed + 3) * 15 + 1).toFixed(1)}% year-over-year. 3-year CAGR: ${(sr(seed + 4) > 0.5 ? '-' : '+') + (sr(seed + 5) * 10).toFixed(1)}%.`,
      target: `Short-term: ${(sr(seed + 6) * 20 + 10).toFixed(0)}% reduction by 2027. Long-term: ${(sr(seed + 7) * 40 + 40).toFixed(0)}% reduction by 2030 (SBTi-aligned).`,
      benchmark: `Sector median: ${(80 + sr(seed + 8) * 120).toFixed(0)} units. Peer avg: ${(90 + sr(seed + 9) * 100).toFixed(0)} units. ${sr(seed + 10) > 0.5 ? 'Above' : 'Below'} sector average.`,
      impact: `Financial materiality: ${sr(seed + 11) > 0.5 ? 'High' : 'Medium'}. Impact materiality: ${sr(seed + 12) > 0.4 ? 'High' : 'Medium'}. Estimated financial exposure: $${(sr(seed + 13) * 50 + 5).toFixed(0)}M.`,
    });
  }, [contextMetric]);

  const sty = {
    page: { fontFamily: T.font, background: T.surface, minHeight: '100vh', padding: 24, color: T.text },
    header: { marginBottom: 20 },
    title: { fontSize: 22, fontWeight: 700, color: T.navy },
    subtitle: { fontSize: 13, color: T.sub, marginTop: 4 },
    tabs: { display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 },
    tab: (a) => ({ padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: a ? 700 : 500, cursor: 'pointer', background: a ? T.navy : 'transparent', color: a ? '#fff' : T.sub, border: 'none', fontFamily: T.font }),
    kpiRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
    card: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 },
    cardTitle: { fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
    th: { textAlign: 'left', padding: '8px 10px', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 11, color: T.sub },
    td: { padding: '8px 10px', borderBottom: `1px solid ${T.border}` },
    select: { padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font },
    badge: (c) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, color: '#fff', background: c }),
    input: { padding: '8px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, width: '100%' },
    btn: { padding: '8px 20px', borderRadius: 6, border: 'none', background: T.navy, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.font },
    treeItem: (level) => ({ padding: '8px 12px', paddingLeft: level * 24 + 12, cursor: 'pointer', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }),
  };

  return (
    <div style={sty.page}>
      <div style={sty.header}>
        <div style={sty.title}>Metrics & Data Architecture</div>
        <div style={sty.subtitle}>{TOTAL_L4}+ metrics in 4-level hierarchy -- {L1_STRATEGIC.length} strategic, {L2_SECTIONS.length} sections, {TOTAL_L3}+ subsections, {TOTAL_L4}+ granular</div>
      </div>

      <div style={sty.tabs}>
        {TABS.map((t, i) => <button key={t} style={sty.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {/* ── TAB 0: Hierarchy Explorer ── */}
      {tab === 0 && (<div>
        <div style={sty.kpiRow}>
          <KPI label="L1 Strategic" value={L1_STRATEGIC.length} color={T.indigo} />
          <KPI label="L2 Sections" value={L2_SECTIONS.length} color={T.blue} />
          <KPI label="L3 Subsections" value={`${TOTAL_L3}+`} color={T.teal} />
          <KPI label="L4 Granular" value={`${TOTAL_L4}+`} color={T.green} />
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>4-Level Metric Hierarchy</div>
          {L1_STRATEGIC.map(l1 => (
            <div key={l1.id}>
              <div style={{ ...sty.treeItem(0), background: expandedL1[l1.id] ? '#f0f0ea' : T.card, fontWeight: 700 }} onClick={() => toggleL1(l1.id)}>
                <span style={{ color: l1.color }}>{expandedL1[l1.id] ? '\u25BC' : '\u25B6'}</span>
                <span style={{ color: l1.color, fontFamily: T.mono, fontSize: 11 }}>{l1.id}</span>
                <span>{l1.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: T.sub }}>{l1.l2Count} sections</span>
              </div>
              {expandedL1[l1.id] && L2_SECTIONS.filter(l2 => l2.parentId === l1.id).map(l2 => (
                <div key={l2.id}>
                  <div style={{ ...sty.treeItem(1), fontSize: 13 }} onClick={() => toggleL2(l2.id)}>
                    <span style={{ color: T.sub }}>{expandedL2[l2.id] ? '\u25BC' : '\u25B6'}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 10, color: T.sub }}>{l2.id}</span>
                    <span>{l2.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: T.sub }}>{l2.metricCount} metrics</span>
                  </div>
                  {expandedL2[l2.id] && Array.from({ length: Math.min(l2.l3Count, 5) }, (_, k) => {
                    const seed = l2.id.charCodeAt(3) * 100 + k * 17;
                    return (
                      <div key={k} style={{ ...sty.treeItem(2), fontSize: 12, color: T.sub }}>
                        <span style={{ fontFamily: T.mono, fontSize: 10 }}>L3-{k + 1}</span>
                        <span>{l2.name} -- {['Measurement','Targets','Methodology','Boundary','Assurance'][k] || `Detail ${k + 1}`}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 10 }}>{Math.floor(2 + sr(seed) * 8)} L4 metrics</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>)}

      {/* ── TAB 1: Strategic Dashboard ── */}
      {tab === 1 && (<div>
        <div style={sty.kpiRow}>
          {L1_STRATEGIC.map(l1 => <KPI key={l1.id} label={l1.name} value={l1.l2Count} sub={l1.desc.split(',')[0]} color={l1.color} />)}
        </div>
        <div style={sty.grid2}>
          <div style={sty.card}>
            <div style={sty.cardTitle}>Strategic Metric Distribution</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={L1_STRATEGIC.map(l => ({ name: l.name.split(' ')[0], sections: l.l2Count, metrics: L2_SECTIONS.filter(s => s.parentId === l.id).reduce((s, x) => s + x.metricCount, 0) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Legend />
                <Bar dataKey="sections" name="Sections" fill={T.indigo} radius={[4, 4, 0, 0]} />
                <Bar dataKey="metrics" name="Metrics" fill={T.teal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={sty.card}>
            <div style={sty.cardTitle}>Quality Score by Strategic Area</div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={L1_STRATEGIC.map(l1 => {
                const secs = L2_SECTIONS.filter(s => s.parentId === l1.id);
                const avg = secs.length > 0 ? Math.round(secs.reduce((s, x) => s + x.qualityScore, 0) / secs.length) : 0;
                return { area: l1.name.split(' ')[0], score: avg };
              })}>
                <PolarGrid />
                <PolarAngleAxis dataKey="area" fontSize={10} />
                <PolarRadiusAxis domain={[0, 100]} fontSize={9} />
                <Radar name="Quality" dataKey="score" stroke={T.indigo} fill={T.indigo} fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>5 Dimensions of Context per Strategic Area</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Strategic Area</th>{CONTEXT_DIMS.map(d => <th key={d} style={sty.th}>{d}</th>)}</tr></thead>
            <tbody>
              {L1_STRATEGIC.map((l1, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : T.card }}>
                  <td style={sty.td}><strong style={{ color: l1.color }}>{l1.name}</strong></td>
                  {CONTEXT_DIMS.map((d, di) => {
                    const seed = i * 50 + di * 11 + 777;
                    const score = Math.round(40 + sr(seed) * 60);
                    return <td key={di} style={sty.td}><span style={sty.badge(score > 70 ? T.green : score > 50 ? '#d97706' : T.red)}>{score}%</span></td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>)}

      {/* ── TAB 2: Section Metrics ── */}
      {tab === 2 && (<div>
        <div style={{ marginBottom: 12 }}>
          <select style={sty.select} value={selectedL1 || ''} onChange={e => setSelectedL1(e.target.value || null)}>
            <option value="">All Strategic Areas</option>
            {L1_STRATEGIC.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>L2 Section Metrics ({l2ForSelected.length} sections)</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>ID</th><th style={sty.th}>Section</th><th style={sty.th}>Parent</th><th style={sty.th}>L3 Count</th><th style={sty.th}>Metrics</th><th style={sty.th}>Assurance</th><th style={sty.th}>Freshness</th><th style={sty.th}>Quality</th></tr></thead>
            <tbody>
              {l2ForSelected.map((l2, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : T.card }}>
                  <td style={{ ...sty.td, fontFamily: T.mono, fontSize: 10 }}>{l2.id}</td>
                  <td style={sty.td}><strong>{l2.name}</strong></td>
                  <td style={sty.td}>{l2.parentName}</td>
                  <td style={sty.td}>{l2.l3Count}</td>
                  <td style={sty.td}>{l2.metricCount}</td>
                  <td style={sty.td}><span style={sty.badge(l2.assuranceLevel === 'High' ? T.green : l2.assuranceLevel === 'Reasonable' ? T.blue : l2.assuranceLevel === 'Limited' ? '#d97706' : T.red)}>{l2.assuranceLevel}</span></td>
                  <td style={sty.td}>{l2.dataFreshness}</td>
                  <td style={sty.td}><span style={sty.badge(l2.qualityScore > 80 ? T.green : l2.qualityScore > 60 ? '#d97706' : T.red)}>{l2.qualityScore}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>)}

      {/* ── TAB 3: Interoperability Matrix ── */}
      {tab === 3 && (<div>
        <div style={sty.kpiRow}>
          <KPI label="Cross-Framework Metrics" value={INTEROP_METRICS.length} sub="Core interoperable" color={T.indigo} />
          <KPI label="Frameworks Mapped" value={6} sub="ESRS, GRI, ISSB, BRSR, SASB, TCFD" color={T.blue} />
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Interoperability Matrix: Key Metrics Across Frameworks</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={sty.table}>
              <thead><tr><th style={sty.th}>Metric</th><th style={sty.th}>ESRS</th><th style={sty.th}>GRI</th><th style={sty.th}>ISSB</th><th style={sty.th}>BRSR</th><th style={sty.th}>SASB</th><th style={sty.th}>TCFD</th></tr></thead>
              <tbody>
                {INTEROP_METRICS.map((m, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : T.card }}>
                    <td style={sty.td}><strong>{m.metric}</strong></td>
                    <td style={{ ...sty.td, fontFamily: T.mono, fontSize: 11 }}>{m.esrs}</td>
                    <td style={{ ...sty.td, fontFamily: T.mono, fontSize: 11 }}>{m.gri}</td>
                    <td style={{ ...sty.td, fontFamily: T.mono, fontSize: 11 }}>{m.issb}</td>
                    <td style={{ ...sty.td, fontFamily: T.mono, fontSize: 11 }}>{m.brsr}</td>
                    <td style={{ ...sty.td, fontFamily: T.mono, fontSize: 11 }}>{m.sasb}</td>
                    <td style={{ ...sty.td, fontFamily: T.mono, fontSize: 11 }}>{m.tcfd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>)}

      {/* ── TAB 4: KPI Definition Builder ── */}
      {tab === 4 && (<div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>KPI Definition Template ({KPI_TEMPLATE_FIELDS.length} Components)</div>
          <div style={{ fontSize: 12, color: T.sub, marginBottom: 16 }}>Fill out each component to create a fully documented KPI definition.</div>
          {KPI_TEMPLATE_FIELDS.map((f, i) => (
            <div key={i} style={{ marginBottom: 14, padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{i + 1}. {f.field}</div>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>{f.desc} -- Example: {f.example}</div>
              <input style={sty.input} value={kpiValues[f.field] || ''} onChange={e => setKpiValues(p => ({ ...p, [f.field]: e.target.value }))} placeholder={f.example} />
            </div>
          ))}
        </div>
      </div>)}

      {/* ── TAB 5: Framework Crosswalk ── */}
      {tab === 5 && (<div>
        <div style={{ marginBottom: 12 }}>
          <input style={{ ...sty.input, maxWidth: 300 }} placeholder="Filter by metric name..." value={crossFilter === 'All' ? '' : crossFilter} onChange={e => setCrossFilter(e.target.value || 'All')} />
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Framework Crosswalk ({filteredCrosswalk.length} metrics)</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Metric</th><th style={sty.th}>ESRS</th><th style={sty.th}>GRI</th><th style={sty.th}>ISSB</th><th style={sty.th}>BRSR</th><th style={sty.th}>SASB</th><th style={sty.th}>Coverage</th></tr></thead>
            <tbody>
              {filteredCrosswalk.map((c, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : T.card }}>
                  <td style={sty.td}><strong>{c.metric}</strong></td>
                  <td style={{ ...sty.td, fontFamily: T.mono, fontSize: 11 }}>{c.esrs}</td>
                  <td style={{ ...sty.td, fontFamily: T.mono, fontSize: 11 }}>{c.gri}</td>
                  <td style={{ ...sty.td, fontFamily: T.mono, fontSize: 11 }}>{c.issb}</td>
                  <td style={{ ...sty.td, fontFamily: T.mono, fontSize: 11 }}>{c.brsr}</td>
                  <td style={{ ...sty.td, fontFamily: T.mono, fontSize: 11 }}>{c.sasb}</td>
                  <td style={sty.td}><span style={sty.badge(c.coverage > 80 ? T.green : c.coverage > 60 ? '#d97706' : T.red)}>{c.coverage}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>)}

      {/* ── TAB 6: Data Quality Scoring ── */}
      {tab === 6 && (<div>
        <div style={sty.kpiRow}>
          <KPI label="Avg Quality" value={`${avgQuality}%`} color={avgQuality > 70 ? T.green : T.amber} />
          <KPI label="High Assurance" value={L2_SECTIONS.filter(l => l.assuranceLevel === 'High').length} color={T.green} />
          <KPI label="No Assurance" value={L2_SECTIONS.filter(l => l.assuranceLevel === 'None').length} color={T.red} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <select style={sty.select} value={qualityFilter} onChange={e => setQualityFilter(e.target.value)}>
            {['All','None','Limited','Reasonable','High'].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div style={sty.grid2}>
          <div style={sty.card}>
            <div style={sty.cardTitle}>Quality Score Distribution</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[{ range: '<50', count: L2_SECTIONS.filter(l => l.qualityScore < 50).length },{ range: '50-70', count: L2_SECTIONS.filter(l => l.qualityScore >= 50 && l.qualityScore < 70).length },{ range: '70-90', count: L2_SECTIONS.filter(l => l.qualityScore >= 70 && l.qualityScore < 90).length },{ range: '90+', count: L2_SECTIONS.filter(l => l.qualityScore >= 90).length }]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" name="Sections" fill={T.indigo} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={sty.card}>
            <div style={sty.cardTitle}>Assurance Level Distribution</div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={['None','Limited','Reasonable','High'].map((l, i) => ({ name: l, value: L2_SECTIONS.filter(s => s.assuranceLevel === l).length, color: [T.red, '#d97706', T.blue, T.green][i] }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                  {['None','Limited','Reasonable','High'].map((_, i) => <Cell key={i} fill={[T.red, '#d97706', T.blue, T.green][i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Per-Section Quality ({filteredQuality.length} sections)</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Section</th><th style={sty.th}>Parent</th><th style={sty.th}>Assurance</th><th style={sty.th}>Freshness</th><th style={sty.th}>Quality</th></tr></thead>
            <tbody>
              {filteredQuality.slice(0, 20).map((l, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : T.card }}>
                  <td style={sty.td}><strong>{l.name}</strong></td>
                  <td style={sty.td}>{l.parentName}</td>
                  <td style={sty.td}><span style={sty.badge(l.assuranceLevel === 'High' ? T.green : l.assuranceLevel === 'Reasonable' ? T.blue : l.assuranceLevel === 'Limited' ? '#d97706' : T.red)}>{l.assuranceLevel}</span></td>
                  <td style={sty.td}>{l.dataFreshness}</td>
                  <td style={sty.td}><span style={sty.badge(l.qualityScore > 80 ? T.green : l.qualityScore > 60 ? '#d97706' : T.red)}>{l.qualityScore}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>)}

      {/* ── TAB 7: Context Generator ── */}
      {tab === 7 && (<div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>5-Dimension Context Generator</div>
          <div style={{ fontSize: 13, color: T.sub, marginBottom: 12 }}>Select or type a metric name to auto-generate contextual dimensions: Magnitude, Trend, Target, Benchmark, and Impact.</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input style={{ ...sty.input, maxWidth: 400 }} value={contextMetric} onChange={e => setContextMetric(e.target.value)} placeholder="e.g. GHG Scope 1 Emissions" />
            <button style={sty.btn} onClick={generateContext}>Generate Context</button>
          </div>
        </div>
        {contextResult && (
          <div style={{ ...sty.card, marginTop: 16 }}>
            <div style={sty.cardTitle}>Context for: {contextResult.metric}</div>
            {CONTEXT_DIMS.map((dim, i) => {
              const key = dim.toLowerCase();
              const colors = [T.indigo, T.teal, T.green, T.blue, T.red];
              return (
                <div key={dim} style={{ padding: '12px 0', borderBottom: i < 4 ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors[i], marginBottom: 4 }}>{dim}</div>
                  <div style={{ fontSize: 13, color: T.text }}>{contextResult[key]}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>)}
    </div>
  );
}
