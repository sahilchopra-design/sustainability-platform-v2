import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  ScatterChart, Scatter, PieChart, Pie, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Cell, ReferenceLine,
  XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
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

const TABS = [
  'Report Type Selector','Section Blueprint','Component Mix Designer','Content Density Planner',
  'Stakeholder Package Builder','Drafting Workspace','Framework Alignment Checker',
  'Visual Design Guide','Digital Publishing Planner','Timeline & Milestones'
];

// ── REPORT TYPES ──────────────────────────────────────────────────────────────
const REPORT_TYPES = [
  { name:'CSRD / ESRS Annual Report', framework:'CSRD', jurisdiction:'EU', required:true, audience:'Regulators, Investors', pages:'80-200', complexity:'High', sections:9, iXBRL:true },
  { name:'ISSB S1/S2 Sustainability Report', framework:'ISSB', jurisdiction:'Global', required:true, audience:'Investors, Analysts', pages:'40-120', complexity:'High', sections:8, iXBRL:false },
  { name:'SEC Climate Disclosure (Reg S-K)', framework:'SEC', jurisdiction:'USA', required:true, audience:'Regulators, Investors', pages:'30-80', complexity:'Medium', sections:7, iXBRL:true },
  { name:'BRSR Core + Comprehensive', framework:'BRSR', jurisdiction:'India', required:true, audience:'SEBI, Investors', pages:'60-150', complexity:'High', sections:9, iXBRL:false },
  { name:'GRI Standards Report', framework:'GRI', jurisdiction:'Global', required:false, audience:'All Stakeholders', pages:'50-200', complexity:'Medium', sections:8, iXBRL:false },
  { name:'TCFD-Aligned Report', framework:'TCFD', jurisdiction:'Global', required:false, audience:'Investors, Banks', pages:'20-60', complexity:'Medium', sections:4, iXBRL:false },
  { name:'CDP Climate Response', framework:'CDP', jurisdiction:'Global', required:false, audience:'Investors, CDP Signatories', pages:'80-150', complexity:'High', sections:12, iXBRL:false },
  { name:'Integrated Report (IR Framework)', framework:'IR', jurisdiction:'Global', required:false, audience:'Board, Investors', pages:'60-120', complexity:'Medium', sections:8, iXBRL:false },
  { name:'CSR / Social Responsibility Report', framework:'CSR', jurisdiction:'Global', required:false, audience:'Community, Employees', pages:'30-80', complexity:'Low', sections:6, iXBRL:false },
  { name:'Impact Report (GIIN IRIS+)', framework:'Impact', jurisdiction:'Global', required:false, audience:'Impact Investors', pages:'20-60', complexity:'Medium', sections:7, iXBRL:false },
  { name:'Combined Annual & Sustainability', framework:'Combined', jurisdiction:'Global', required:false, audience:'All Stakeholders', pages:'150-300', complexity:'Very High', sections:12, iXBRL:true },
  { name:'SFDR Periodic Disclosure (Art 8/9)', framework:'SFDR', jurisdiction:'EU', required:true, audience:'Fund Investors', pages:'15-40', complexity:'Medium', sections:5, iXBRL:false },
  { name:'EU Taxonomy Eligibility Report', framework:'EUTax', jurisdiction:'EU', required:true, audience:'Regulators, Investors', pages:'20-50', complexity:'High', sections:6, iXBRL:true },
  { name:'UK SDR Sustainability Report', framework:'UKSDR', jurisdiction:'UK', required:true, audience:'FCA, Investors', pages:'30-70', complexity:'Medium', sections:7, iXBRL:false },
  { name:'TNFD Nature Report (LEAP)', framework:'TNFD', jurisdiction:'Global', required:false, audience:'Investors, Regulators', pages:'30-80', complexity:'High', sections:5, iXBRL:false },
  { name:'SBTi Net-Zero Transition Plan', framework:'SBTi', jurisdiction:'Global', required:false, audience:'Investors, Board', pages:'20-50', complexity:'Medium', sections:6, iXBRL:false },
  { name:'SASB Industry Report', framework:'SASB', jurisdiction:'USA', required:false, audience:'Investors', pages:'20-60', complexity:'Medium', sections:5, iXBRL:false },
  { name:'CBAM Quarterly Declaration', framework:'CBAM', jurisdiction:'EU', required:true, audience:'EU Customs', pages:'10-30', complexity:'Low', sections:4, iXBRL:false },
  { name:'CSDDD Due Diligence Statement', framework:'CSDDD', jurisdiction:'EU', required:true, audience:'Regulators', pages:'15-40', complexity:'Medium', sections:5, iXBRL:false },
  { name:'EUDR Compliance Statement', framework:'EUDR', jurisdiction:'EU', required:true, audience:'EU Regulators', pages:'10-25', complexity:'Low', sections:4, iXBRL:false },
  { name:'Australia ASRS Climate Report', framework:'ASRS', jurisdiction:'Australia', required:true, audience:'ASIC, Investors', pages:'30-80', complexity:'Medium', sections:7, iXBRL:false },
  { name:'Japan SSBJ Disclosure', framework:'SSBJ', jurisdiction:'Japan', required:true, audience:'TSE, Investors', pages:'30-60', complexity:'Medium', sections:6, iXBRL:false },
  { name:'Singapore SGX Report', framework:'SGX', jurisdiction:'Singapore', required:true, audience:'SGX, Investors', pages:'30-70', complexity:'Medium', sections:7, iXBRL:false },
  { name:'Hong Kong ESG Report', framework:'HKEX', jurisdiction:'HK', required:true, audience:'HKEX, Investors', pages:'40-90', complexity:'Medium', sections:8, iXBRL:false },
  { name:'Korea K-ESG Disclosure', framework:'KESG', jurisdiction:'Korea', required:true, audience:'KRX, Investors', pages:'30-70', complexity:'Medium', sections:7, iXBRL:false },
  { name:'Brazil CVM Sustainability Report', framework:'CVM', jurisdiction:'Brazil', required:true, audience:'CVM, Investors', pages:'30-70', complexity:'Medium', sections:6, iXBRL:false },
  { name:'Board ESG Brief', framework:'Board', jurisdiction:'Global', required:false, audience:'Board Directors', pages:'5-15', complexity:'Low', sections:4, iXBRL:false },
  { name:'Employee Sustainability Summary', framework:'Internal', jurisdiction:'Global', required:false, audience:'Employees', pages:'10-20', complexity:'Low', sections:5, iXBRL:false },
  { name:'Investor ESG Fact Sheet', framework:'Investor', jurisdiction:'Global', required:false, audience:'Investors, Analysts', pages:'2-6', complexity:'Low', sections:3, iXBRL:false },
  { name:'Sustainability Website Content', framework:'Digital', jurisdiction:'Global', required:false, audience:'Public', pages:'10-30', complexity:'Low', sections:6, iXBRL:false },
  { name:'Supply Chain Sustainability Report', framework:'SupplyChain', jurisdiction:'Global', required:false, audience:'Procurement, Partners', pages:'20-50', complexity:'Medium', sections:6, iXBRL:false },
];

// ── DISCLOSURE SECTIONS ───────────────────────────────────────────────────────
const SECTIONS = [
  { id:1, name:'CEO Letter & Forward-Looking Statements', who:'CEO, Board Chair', what:'Vision, performance summary, future outlook', when:'Annual, typically Q1', where:'Report opening', why:'Sets tone, demonstrates leadership commitment', pageRange:'2-6', wordRange:'800-2500', dataPct:10, narrativePct:70, semiPct:15, visualPct:5, tone:'Inspirational, authoritative' },
  { id:2, name:'Corporate Overview & Business Model', who:'Strategy team, IR', what:'Company profile, value chain, business model canvas', when:'Annual', where:'Section 1', why:'Context for sustainability integration', pageRange:'4-10', wordRange:'1500-4000', dataPct:20, narrativePct:45, semiPct:20, visualPct:15, tone:'Factual, concise' },
  { id:3, name:'Strategy, Governance & Risk Management', who:'Board, C-suite, Risk', what:'ESG strategy, governance structure, risk oversight, climate scenarios', when:'Annual', where:'Section 2-3', why:'TCFD/ISSB Governance & Strategy pillars', pageRange:'8-20', wordRange:'3000-8000', dataPct:25, narrativePct:40, semiPct:20, visualPct:15, tone:'Authoritative, structured' },
  { id:4, name:'Materiality Assessment & Stakeholder Engagement', who:'Sustainability team, External consultants', what:'Double materiality matrix, stakeholder mapping, engagement outcomes', when:'Biennial refresh, annual update', where:'Section 4', why:'CSRD ESRS 1 requires double materiality', pageRange:'4-12', wordRange:'1500-5000', dataPct:30, narrativePct:30, semiPct:25, visualPct:15, tone:'Analytical, inclusive' },
  { id:5, name:'Environmental Performance (E1-E5)', who:'EHS, Operations, Engineering', what:'GHG emissions (Scope 1/2/3), energy, water, biodiversity, circular economy, pollution', when:'Annual', where:'Section 5', why:'ESRS E1-E5 mandatory datapoints', pageRange:'15-40', wordRange:'5000-15000', dataPct:50, narrativePct:20, semiPct:15, visualPct:15, tone:'Technical, evidence-based' },
  { id:6, name:'Social Performance (S1-S4)', who:'HR, Supply Chain, Community', what:'Workforce diversity, health & safety, training, value chain workers, communities', when:'Annual', where:'Section 6', why:'ESRS S1-S4, GRI 401-414', pageRange:'10-25', wordRange:'4000-10000', dataPct:40, narrativePct:30, semiPct:15, visualPct:15, tone:'Empathetic, factual' },
  { id:7, name:'Governance & Business Conduct (G1)', who:'Legal, Compliance, Board', what:'Anti-corruption, lobbying, whistleblowing, tax transparency', when:'Annual', where:'Section 7', why:'ESRS G1, GRI 205-207', pageRange:'4-12', wordRange:'1500-5000', dataPct:30, narrativePct:40, semiPct:20, visualPct:10, tone:'Formal, transparent' },
  { id:8, name:'Benchmarking & Performance Targets', who:'Strategy, Sustainability', what:'Peer comparison, target progress, SBTi alignment, sector benchmarks', when:'Annual', where:'Section 8', why:'Demonstrate ambition vs peers', pageRange:'4-10', wordRange:'1500-4000', dataPct:55, narrativePct:15, semiPct:15, visualPct:15, tone:'Competitive, aspirational' },
  { id:9, name:'Appendices & Assurance', who:'Auditors, Legal, Data team', what:'Methodology notes, GRI/ESRS index, assurance statement, data tables', when:'Annual', where:'End matter', why:'Credibility, completeness, regulatory compliance', pageRange:'10-30', wordRange:'3000-10000', dataPct:70, narrativePct:10, semiPct:10, visualPct:10, tone:'Technical, precise' },
];

const DENSITY_LEVELS = ['Light','Balanced','High','Maximum'];

const STAKEHOLDER_PACKAGES = [
  { name:'Investor Package', icon:'$', priority:['Strategy & Governance','Environmental','Benchmarking','Appendices'], emphasis:'Quantitative data, targets, peer comparison', format:'PDF + iXBRL', length:'40-80 pages' },
  { name:'Employee Package', icon:'E', priority:['CEO Letter','Social Performance','Strategy','Corporate Overview'], emphasis:'Culture, wellbeing, DEI, training opportunities', format:'Interactive web + PDF summary', length:'15-30 pages' },
  { name:'Customer Package', icon:'C', priority:['Environmental','Corporate Overview','Benchmarking','Social'], emphasis:'Product sustainability, supply chain, circular economy', format:'PDF + infographic', length:'20-40 pages' },
  { name:'Regulator Package', icon:'R', priority:['All sections in full','Appendices','Assurance','Environmental'], emphasis:'Compliance completeness, data accuracy, methodology', format:'ESEF/iXBRL + PDF', length:'80-200 pages' },
  { name:'Community Package', icon:'Q', priority:['Social Performance','CEO Letter','Environmental','Governance'], emphasis:'Local impact, community investment, environmental stewardship', format:'Summary PDF + web', length:'10-20 pages' },
];

const FRAMEWORKS_CROSS = ['CSRD/ESRS','ISSB/IFRS S1-S2','GRI Standards','TCFD 11 Recs','BRSR Core','SASB'];

const CHART_RECOMMENDATIONS = [
  { section:'CEO Letter', charts:['None or 1 highlight bar chart'], count:'0-1' },
  { section:'Corporate Overview', charts:['Business model diagram','Value chain flow','Revenue split pie'], count:'2-4' },
  { section:'Strategy & Governance', charts:['Governance org chart','Scenario waterfall','Risk heatmap'], count:'3-6' },
  { section:'Materiality', charts:['Materiality matrix (scatter)','Stakeholder map','Impact bubble chart'], count:'2-4' },
  { section:'Environmental', charts:['GHG waterfall','Energy area chart','Emissions bar YoY','Target line chart','Water sankey'], count:'8-15' },
  { section:'Social', charts:['Diversity pie','Training bar','Safety line','Wage gap bar'], count:'4-8' },
  { section:'Governance', charts:['Board composition pie','Compliance radar','Incident trend line'], count:'2-4' },
  { section:'Benchmarking', charts:['Peer comparison bar','Ranking table','Target progress gauge'], count:'3-6' },
  { section:'Appendices', charts:['Data tables (no charts)','Methodology flowcharts'], count:'0-2' },
];

const DIGITAL_REQS = [
  { name:'ESEF / iXBRL Tagging', mandatory:true, applies:'EU CSRD filers', detail:'Machine-readable inline XBRL in HTML; ESRS taxonomy tags' },
  { name:'XBRL US (SEC)', mandatory:true, applies:'SEC registrants', detail:'Inline XBRL for climate disclosures per Reg S-K 1500-1506' },
  { name:'PDF/A Archival', mandatory:false, applies:'All', detail:'PDF/A-3 for long-term archival with embedded data' },
  { name:'Interactive HTML', mandatory:false, applies:'All', detail:'Web-based report with navigation, search, download' },
  { name:'API Data Feed', mandatory:false, applies:'Large cap', detail:'Structured ESG data API for data aggregators' },
  { name:'Multi-language', mandatory:true, applies:'EU listed', detail:'Report in official language + English' },
  { name:'Accessibility (WCAG)', mandatory:false, applies:'All', detail:'WCAG 2.1 AA for web reports' },
  { name:'Social Media Summary', mandatory:false, applies:'All', detail:'Key highlights formatted for LinkedIn, Twitter' },
];

const MILESTONES = [
  { phase:'Planning', week:'W1-W4', tasks:['Define report scope','Select framework','Assign section owners','Set timeline'], status:'plan' },
  { phase:'Data Collection', week:'W5-W12', tasks:['Gather E/S/G data','Validate calculations','Gap analysis','External data procurement'], status:'data' },
  { phase:'Materiality', week:'W6-W10', tasks:['Stakeholder engagement','Impact assessment','Double materiality matrix','Board sign-off'], status:'materiality' },
  { phase:'Drafting', week:'W10-W18', tasks:['Section-by-section drafting','Internal review cycles','Legal review','Board review'], status:'draft' },
  { phase:'Design & Layout', week:'W16-W20', tasks:['Visual design','Chart creation','Layout proofing','Accessibility check'], status:'design' },
  { phase:'Assurance', week:'W18-W22', tasks:['Limited assurance engagement','Data verification','Auditor queries','Statement issuance'], status:'assurance' },
  { phase:'Digital Prep', week:'W20-W24', tasks:['iXBRL tagging','ESEF validation','HTML/web build','API setup'], status:'digital' },
  { phase:'Publication', week:'W24-W26', tasks:['Board final approval','Regulatory filing','Public release','Distribution'], status:'publish' },
];

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function SustainabilityReportBuilderPage() {
  const [tab, setTab] = useState(0);
  const [jurisdictionFilter, setJurisdictionFilter] = useState('All');
  const [requiredFilter, setRequiredFilter] = useState('All');
  const [selectedSection, setSelectedSection] = useState(0);
  const [mixOverrides, setMixOverrides] = useState({});
  const [densityLevel, setDensityLevel] = useState(1);
  const [selectedStakeholder, setSelectedStakeholder] = useState(0);
  const [draftSection, setDraftSection] = useState(0);
  const [selectedFrameworks, setSelectedFrameworks] = useState(FRAMEWORKS_CROSS.map(()=>true));
  const [timelineWeek, setTimelineWeek] = useState(0);

  const jurisdictions = useMemo(() => ['All', ...new Set(REPORT_TYPES.map(r=>r.jurisdiction))], []);

  const filteredReports = useMemo(() => {
    let arr = REPORT_TYPES;
    if (jurisdictionFilter !== 'All') arr = arr.filter(r => r.jurisdiction === jurisdictionFilter);
    if (requiredFilter !== 'All') arr = arr.filter(r => requiredFilter === 'Required' ? r.required : !r.required);
    return arr;
  }, [jurisdictionFilter, requiredFilter]);

  const getMix = useCallback((sIdx, key) => {
    const k = `${sIdx}-${key}`;
    if (mixOverrides[k] !== undefined) return mixOverrides[k];
    return SECTIONS[sIdx][key];
  }, [mixOverrides]);

  const setMix = useCallback((sIdx, key, val) => {
    setMixOverrides(p => ({...p, [`${sIdx}-${key}`]: val}));
  }, []);

  const densityMultiplier = [0.6, 1.0, 1.4, 1.8][densityLevel];
  const totalWords = useMemo(() => {
    return SECTIONS.reduce((sum, s) => {
      const base = parseInt(s.wordRange.split('-')[1], 10);
      return sum + Math.round(base * densityMultiplier);
    }, 0);
  }, [densityMultiplier]);

  const totalPages = useMemo(() => {
    return SECTIONS.reduce((sum, s) => {
      const base = parseInt(s.pageRange.split('-')[1], 10);
      return sum + Math.round(base * densityMultiplier);
    }, 0);
  }, [densityMultiplier]);

  const COLORS = [T.indigo, T.green, T.teal, T.purple, T.blue, T.orange, T.amber, T.red, T.navy];

  const sectionWordData = useMemo(() => SECTIONS.map((s,i) => ({
    name: s.name.length > 20 ? s.name.slice(0,18)+'...' : s.name,
    words: Math.round(parseInt(s.wordRange.split('-')[1],10) * densityMultiplier),
    fill: COLORS[i % COLORS.length]
  })), [densityMultiplier]);

  const mixPieData = useMemo(() => {
    const s = SECTIONS[selectedSection];
    return [
      { name:'Data', value: getMix(selectedSection,'dataPct'), fill: T.indigo },
      { name:'Narrative', value: getMix(selectedSection,'narrativePct'), fill: T.green },
      { name:'Semi-Narrative', value: getMix(selectedSection,'semiPct'), fill: T.teal },
      { name:'Visual', value: getMix(selectedSection,'visualPct'), fill: T.purple },
    ];
  }, [selectedSection, getMix]);

  const frameworkMatrix = useMemo(() => {
    return SECTIONS.map((s,si) => {
      const row = { section: s.name.length > 25 ? s.name.slice(0,23)+'...' : s.name };
      FRAMEWORKS_CROSS.forEach((fw,fi) => {
        const seed = si * 100 + fi * 7 + 5000;
        const coverage = Math.round(40 + sr(seed) * 60);
        row[fw] = coverage;
      });
      return row;
    });
  }, []);

  const timelineData = useMemo(() => MILESTONES.map((m,i) => {
    const startWeek = parseInt(m.week.replace('W','').split('-')[0], 10);
    const endWeek = parseInt(m.week.replace('W','').split('-')[1], 10);
    return { name: m.phase, start: startWeek, duration: endWeek - startWeek, fill: COLORS[i % COLORS.length] };
  }), []);

  const cs = (base, active) => active ? `${base} active` : base;

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: T.font, color: T.text, background: T.surface, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: T.navy, margin: 0 }}>Sustainability Report Builder</h1>
          <p style={{ color: T.sub, fontSize: 14, margin: '4px 0 0', fontFamily: T.mono }}>
            5W Framework | {REPORT_TYPES.length} Report Types | {SECTIONS.length} Disclosure Sections | {STAKEHOLDER_PACKAGES.length} Stakeholder Packages
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.border}`, paddingBottom: 8 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '8px 14px', fontSize: 12, fontWeight: tab === i ? 700 : 500,
              background: tab === i ? T.navy : 'transparent', color: tab === i ? '#fff' : T.sub,
              border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: T.font,
              transition: 'all 0.15s'
            }}>{t}</button>
          ))}
        </div>

        {/* ── TAB 0: Report Type Selector ──────────────────────────────── */}
        {tab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <select value={jurisdictionFilter} onChange={e=>setJurisdictionFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13 }}>
                {jurisdictions.map(j => <option key={j}>{j}</option>)}
              </select>
              <select value={requiredFilter} onChange={e=>setRequiredFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13 }}>
                {['All','Required','Voluntary'].map(v => <option key={v}>{v}</option>)}
              </select>
              <span style={{ color: T.sub, fontSize: 12, alignSelf: 'center', fontFamily: T.mono }}>{filteredReports.length} report types</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['Report Type','Framework','Jurisdiction','Required','Audience','Pages','Sections','iXBRL','Complexity'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontFamily: T.mono }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((r,i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.surface, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.name}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.indigo }}>{r.framework}</td>
                      <td style={{ padding: '8px 10px' }}>{r.jurisdiction}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: r.required ? '#dcfce7' : '#fef3c7', color: r.required ? T.green : T.amber }}>
                          {r.required ? 'Required' : 'Voluntary'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: T.sub }}>{r.audience}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{r.pages}</td>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'center' }}>{r.sections}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>{r.iXBRL ? 'Yes' : '-'}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ color: r.complexity === 'Very High' ? T.red : r.complexity === 'High' ? T.orange : r.complexity === 'Medium' ? T.amber : T.green }}>
                          {r.complexity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 1: Section Blueprint ─────────────────────────────────── */}
        {tab === 1 && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {SECTIONS.map((s,i) => (
                <button key={i} onClick={()=>setSelectedSection(i)} style={{
                  padding: '6px 12px', fontSize: 11, fontWeight: selectedSection === i ? 700 : 400,
                  background: selectedSection === i ? T.indigo : T.card, color: selectedSection === i ? '#fff' : T.text,
                  border: `1px solid ${selectedSection === i ? T.indigo : T.border}`, borderRadius: 6, cursor: 'pointer', fontFamily: T.font
                }}>S{s.id}</button>
              ))}
            </div>
            {(() => {
              const s = SECTIONS[selectedSection];
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                  <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                    <h3 style={{ color: T.navy, fontSize: 16, marginTop: 0 }}>{s.name}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[['WHO', s.who], ['WHAT', s.what], ['WHEN', s.when], ['WHERE', s.where], ['WHY', s.why]].map(([label, val]) => (
                        <div key={label} style={{ background: T.surface, borderRadius: 8, padding: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.indigo, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
                          <div style={{ fontSize: 12, color: T.text }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                    <h4 style={{ color: T.navy, fontSize: 14, marginTop: 0 }}>Section Metrics</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[['Pages', s.pageRange], ['Words', s.wordRange], ['Tone', s.tone], ['Data %', s.dataPct+'%'], ['Narrative %', s.narrativePct+'%'], ['Visual %', s.visualPct+'%']].map(([k,v]) => (
                        <div key={k} style={{ background: T.surface, borderRadius: 6, padding: 10 }}>
                          <div style={{ fontSize: 10, color: T.sub, fontFamily: T.mono }}>{k}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: T.navy }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── TAB 2: Component Mix Designer ────────────────────────────── */}
        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ color: T.navy, fontSize: 16, marginTop: 0 }}>Section: {SECTIONS[selectedSection].name}</h3>
              <select value={selectedSection} onChange={e=>setSelectedSection(Number(e.target.value))} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13, marginBottom: 16, width: '100%' }}>
                {SECTIONS.map((s,i) => <option key={i} value={i}>S{s.id}: {s.name}</option>)}
              </select>
              {['dataPct','narrativePct','semiPct','visualPct'].map(key => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{key.replace('Pct','').replace(/([A-Z])/,' $1')}</span>
                    <span style={{ fontFamily: T.mono, color: T.indigo }}>{getMix(selectedSection, key)}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={getMix(selectedSection, key)}
                    onChange={e=>setMix(selectedSection, key, Number(e.target.value))}
                    style={{ width: '100%' }} />
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h4 style={{ color: T.navy, fontSize: 14, marginTop: 0 }}>Component Mix</h4>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={mixPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,value})=>`${name}: ${value}%`}>
                    {mixPieData.map((d,i)=><Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── TAB 3: Content Density Planner ───────────────────────────── */}
        {tab === 3 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Density Level:</span>
              {DENSITY_LEVELS.map((d,i) => (
                <button key={i} onClick={()=>setDensityLevel(i)} style={{
                  padding: '6px 16px', fontSize: 12, fontWeight: densityLevel === i ? 700 : 400,
                  background: densityLevel === i ? T.navy : T.card, color: densityLevel === i ? '#fff' : T.text,
                  border: `1px solid ${densityLevel === i ? T.navy : T.border}`, borderRadius: 6, cursor: 'pointer'
                }}>{d}</button>
              ))}
              <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 12, color: T.indigo }}>
                Est. {totalPages} pages | {totalWords.toLocaleString()} words
              </span>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={sectionWordData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11, fontFamily: T.mono }} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10, fontFamily: T.font }} />
                  <Tooltip formatter={v=>[v.toLocaleString(),'Words']} />
                  <Bar dataKey="words" radius={[0,4,4,0]}>
                    {sectionWordData.map((d,i)=><Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 16 }}>
              {DENSITY_LEVELS.map((d,i) => (
                <div key={i} style={{ background: densityLevel === i ? T.indigo : T.card, color: densityLevel === i ? '#fff' : T.text, borderRadius: 8, padding: 16, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{d}</div>
                  <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>{['Min content, executive summary style','Balanced depth for most audiences','Comprehensive with full methodology','Maximum detail for regulatory filing'][i]}</div>
                  <div style={{ fontSize: 12, fontFamily: T.mono, marginTop: 8 }}>{[0.6,1.0,1.4,1.8][i]}x multiplier</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: Stakeholder Package Builder ───────────────────────── */}
        {tab === 4 && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {STAKEHOLDER_PACKAGES.map((s,i) => (
                <button key={i} onClick={()=>setSelectedStakeholder(i)} style={{
                  padding: '8px 16px', fontSize: 12, fontWeight: selectedStakeholder === i ? 700 : 400,
                  background: selectedStakeholder === i ? T.indigo : T.card, color: selectedStakeholder === i ? '#fff' : T.text,
                  border: `1px solid ${selectedStakeholder === i ? T.indigo : T.border}`, borderRadius: 6, cursor: 'pointer'
                }}>{s.name}</button>
              ))}
            </div>
            {(() => {
              const pkg = STAKEHOLDER_PACKAGES[selectedStakeholder];
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                    <h3 style={{ color: T.navy, fontSize: 16, marginTop: 0 }}>{pkg.name}</h3>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: T.sub, fontFamily: T.mono }}>EMPHASIS</div>
                      <div style={{ fontSize: 13 }}>{pkg.emphasis}</div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: T.sub, fontFamily: T.mono }}>FORMAT</div>
                      <div style={{ fontSize: 13 }}>{pkg.format}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: T.sub, fontFamily: T.mono }}>LENGTH</div>
                      <div style={{ fontSize: 13 }}>{pkg.length}</div>
                    </div>
                  </div>
                  <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                    <h4 style={{ color: T.navy, fontSize: 14, marginTop: 0 }}>Priority Sections</h4>
                    {pkg.priority.map((p,i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: COLORS[i], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{i+1}</span>
                        <span style={{ fontSize: 13 }}>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── TAB 5: Drafting Workspace ─────────────────────────────────── */}
        {tab === 5 && (
          <div>
            <select value={draftSection} onChange={e=>setDraftSection(Number(e.target.value))} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13, marginBottom: 16 }}>
              {SECTIONS.map((s,i) => <option key={i} value={i}>S{s.id}: {s.name}</option>)}
            </select>
            {(() => {
              const s = SECTIONS[draftSection];
              const maxWords = Math.round(parseInt(s.wordRange.split('-')[1],10) * densityMultiplier);
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                    <h3 style={{ color: T.navy, fontSize: 16, marginTop: 0 }}>{s.name}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                      {[['WHO', s.who], ['WHAT', s.what], ['WHEN', s.when], ['WHERE', s.where], ['WHY', s.why]].map(([label, val]) => (
                        <div key={label} style={{ background: T.surface, borderRadius: 6, padding: 8 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: T.indigo, fontFamily: T.mono }}>{label}</div>
                          <div style={{ fontSize: 11, color: T.text }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                    <h4 style={{ color: T.navy, fontSize: 14, marginTop: 0 }}>Drafting Guidance</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ background: T.surface, borderRadius: 6, padding: 10 }}>
                        <div style={{ fontSize: 10, color: T.sub, fontFamily: T.mono }}>WORD TARGET</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: T.indigo }}>{maxWords.toLocaleString()}</div>
                      </div>
                      <div style={{ background: T.surface, borderRadius: 6, padding: 10 }}>
                        <div style={{ fontSize: 10, color: T.sub, fontFamily: T.mono }}>TONE</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{s.tone}</div>
                      </div>
                      <div style={{ background: T.surface, borderRadius: 6, padding: 10 }}>
                        <div style={{ fontSize: 10, color: T.sub, fontFamily: T.mono }}>DATA WEIGHT</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: T.green }}>{s.dataPct}%</div>
                      </div>
                      <div style={{ background: T.surface, borderRadius: 6, padding: 10 }}>
                        <div style={{ fontSize: 10, color: T.sub, fontFamily: T.mono }}>NARRATIVE WEIGHT</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: T.teal }}>{s.narrativePct}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── TAB 6: Framework Alignment Checker ───────────────────────── */}
        {tab === 6 && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {FRAMEWORKS_CROSS.map((fw,i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedFrameworks[i]} onChange={() => {
                    const next = [...selectedFrameworks]; next[i] = !next[i]; setSelectedFrameworks(next);
                  }} />
                  {fw}
                </label>
              ))}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontFamily: T.mono }}>Section</th>
                    {FRAMEWORKS_CROSS.filter((_,i)=>selectedFrameworks[i]).map(fw => (
                      <th key={fw} style={{ padding: '8px 10px', textAlign: 'center', fontFamily: T.mono }}>{fw}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {frameworkMatrix.map((row,ri) => (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? T.card : T.surface }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{row.section}</td>
                      {FRAMEWORKS_CROSS.filter((_,i)=>selectedFrameworks[i]).map(fw => {
                        const val = row[fw];
                        const bg = val >= 80 ? '#dcfce7' : val >= 50 ? '#fef3c7' : '#fee2e2';
                        const clr = val >= 80 ? T.green : val >= 50 ? T.amber : T.red;
                        return (
                          <td key={fw} style={{ padding: '6px 10px', textAlign: 'center', background: bg, color: clr, fontWeight: 700, fontFamily: T.mono }}>{val}%</td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 7: Visual Design Guide ────────────────────────────────── */}
        {tab === 7 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {CHART_RECOMMENDATIONS.map((cr, i) => (
                <div key={i} style={{ background: T.card, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h4 style={{ color: T.navy, fontSize: 14, margin: 0 }}>{cr.section}</h4>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: T.indigo, background: '#eef2ff', padding: '2px 8px', borderRadius: 4 }}>{cr.count} charts</span>
                  </div>
                  {cr.charts.map((c, j) => (
                    <div key={j} style={{ fontSize: 12, color: T.text, padding: '4px 0', borderBottom: j < cr.charts.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                      {c}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}`, marginTop: 16 }}>
              <h4 style={{ color: T.navy, fontSize: 14, marginTop: 0 }}>Visualization Count by Section</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={CHART_RECOMMENDATIONS.map(c => ({ name: c.section, min: parseInt(c.count.split('-')[0],10), max: parseInt(c.count.split('-')[1] || c.count.split('-')[0],10) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="max" fill={T.indigo} radius={[4,4,0,0]} name="Max Charts" />
                  <Bar dataKey="min" fill={T.teal} radius={[4,4,0,0]} name="Min Charts" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── TAB 8: Digital Publishing Planner ────────────────────────── */}
        {tab === 8 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {DIGITAL_REQS.map((d, i) => (
                <div key={i} style={{ background: T.card, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h4 style={{ color: T.navy, fontSize: 14, margin: 0 }}>{d.name}</h4>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: d.mandatory ? '#dcfce7' : '#f3f4f6', color: d.mandatory ? T.green : T.sub }}>
                      {d.mandatory ? 'Mandatory' : 'Optional'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: T.sub, marginBottom: 4, fontFamily: T.mono }}>Applies to: {d.applies}</div>
                  <div style={{ fontSize: 12, color: T.text }}>{d.detail}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 9: Timeline & Milestones ─────────────────────────────── */}
        {tab === 9 && (
          <div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}`, marginBottom: 16 }}>
              <h4 style={{ color: T.navy, fontSize: 14, marginTop: 0 }}>Report Production Timeline (26 Weeks)</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timelineData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0,26]} tick={{ fontSize: 11, fontFamily: T.mono }} label={{ value: 'Week', position: 'insideBottom', offset: -5 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fontFamily: T.font }} />
                  <Tooltip formatter={(v,name)=>[`${v} weeks`, name]} />
                  <Bar dataKey="start" stackId="a" fill="transparent" />
                  <Bar dataKey="duration" stackId="a" radius={[0,4,4,0]}>
                    {timelineData.map((d,i)=><Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {MILESTONES.map((m, i) => (
                <div key={i} style={{ background: T.card, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h4 style={{ color: T.navy, fontSize: 14, margin: 0 }}>{m.phase}</h4>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: T.indigo }}>{m.week}</span>
                  </div>
                  {m.tasks.map((t, j) => (
                    <div key={j} style={{ fontSize: 12, color: T.text, padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} />
                      {t}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
