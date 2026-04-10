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
  'Standards Overview','Environmental (E1-E5)','Social (S1-S4)','Governance (G1)',
  'ESRS 2 General','Framework Crosswalk','Materiality Filter',
  'Assurance Roadmap','Omnibus Impact Analyzer','Implementation Tracker'
];

// ── ESRS STANDARDS ────────────────────────────────────────────────────────────
const ESRS_STANDARDS = [
  { code:'ESRS 2', name:'General Disclosures', category:'Cross-cutting', datapoints:35, drs:12, mandatory:true, description:'Governance, strategy, IRO management, metrics & targets across all topics' },
  { code:'ESRS E1', name:'Climate Change', category:'Environmental', datapoints:42, drs:9, mandatory:false, description:'GHG emissions Scope 1/2/3, energy, transition plans, carbon pricing, financial effects' },
  { code:'ESRS E2', name:'Pollution', category:'Environmental', datapoints:28, drs:6, mandatory:false, description:'Air pollutants, water pollutants, soil pollutants, substances of concern' },
  { code:'ESRS E3', name:'Water & Marine Resources', category:'Environmental', datapoints:22, drs:5, mandatory:false, description:'Water consumption, water stress areas, marine resource impacts' },
  { code:'ESRS E4', name:'Biodiversity & Ecosystems', category:'Environmental', datapoints:38, drs:6, mandatory:false, description:'Impact on biodiversity, land use change, ecosystem degradation, species affected' },
  { code:'ESRS E5', name:'Resource Use & Circular Economy', category:'Environmental', datapoints:24, drs:6, mandatory:false, description:'Resource inflows, resource outflows, waste, circular design' },
  { code:'ESRS S1', name:'Own Workforce', category:'Social', datapoints:52, drs:17, mandatory:false, description:'Working conditions, equal treatment, health & safety, training, work-life balance' },
  { code:'ESRS S2', name:'Workers in Value Chain', category:'Social', datapoints:18, drs:5, mandatory:false, description:'Working conditions of value chain workers, due diligence, engagement' },
  { code:'ESRS S3', name:'Affected Communities', category:'Social', datapoints:16, drs:5, mandatory:false, description:'Community impacts, indigenous rights, land rights, security practices' },
  { code:'ESRS S4', name:'Consumers & End-Users', category:'Social', datapoints:14, drs:5, mandatory:false, description:'Privacy, health & safety, information quality, social inclusion' },
  { code:'ESRS G1', name:'Business Conduct', category:'Governance', datapoints:18, drs:6, mandatory:false, description:'Corporate culture, anti-corruption, political engagement, payment practices' },
];

// ── E1 CLIMATE DATAPOINTS ─────────────────────────────────────────────────────
const E1_DATAPOINTS = [
  { dr:'E1-1', name:'Transition plan for climate change mitigation', mandatory:true, type:'Narrative', methodology:'ESRS 2 IRO-1, TCFD Strategy', metric:'-', scope:'Entity-wide' },
  { dr:'E1-2', name:'Policies related to climate change mitigation and adaptation', mandatory:true, type:'Narrative', methodology:'ESRS 2 MDR-P', metric:'-', scope:'Entity-wide' },
  { dr:'E1-3', name:'Actions and resources related to climate change', mandatory:true, type:'Semi-quantitative', methodology:'ESRS 2 MDR-A', metric:'EUR invested', scope:'Entity-wide' },
  { dr:'E1-4', name:'Targets related to climate change mitigation and adaptation', mandatory:true, type:'Quantitative', methodology:'SBTi, ESRS 2 MDR-T', metric:'tCO2e, %', scope:'Entity-wide' },
  { dr:'E1-5', name:'Energy consumption and mix', mandatory:true, type:'Quantitative', methodology:'GHG Protocol, GRI 302', metric:'MWh, %', scope:'Entity-wide' },
  { dr:'E1-6', name:'Gross Scopes 1, 2, 3 and Total GHG emissions', mandatory:true, type:'Quantitative', methodology:'GHG Protocol, ISO 14064', metric:'tCO2e', scope:'Scope 1/2/3' },
  { dr:'E1-7', name:'GHG removals and GHG mitigation projects', mandatory:false, type:'Quantitative', methodology:'ISO 14064-2', metric:'tCO2e', scope:'Entity + credits' },
  { dr:'E1-8', name:'Internal carbon pricing', mandatory:false, type:'Quantitative', methodology:'CDP, CPLC', metric:'EUR/tCO2e', scope:'Entity-wide' },
  { dr:'E1-9', name:'Anticipated financial effects from climate-related physical risks', mandatory:true, type:'Quantitative', methodology:'TCFD Metrics, NGFS', metric:'EUR, % revenue', scope:'Entity-wide' },
  { dr:'E1 AR', name:'Sector-specific energy performance metrics', mandatory:false, type:'Quantitative', methodology:'NACE-based', metric:'kWh/unit', scope:'Sector-specific' },
];

const E2_DATAPOINTS = [
  { dr:'E2-1', name:'Policies related to pollution', mandatory:true, type:'Narrative', methodology:'ESRS 2 MDR-P', metric:'-', scope:'Entity-wide' },
  { dr:'E2-2', name:'Actions and resources related to pollution', mandatory:true, type:'Semi-quantitative', methodology:'ESRS 2 MDR-A', metric:'EUR', scope:'Entity-wide' },
  { dr:'E2-3', name:'Targets related to pollution', mandatory:true, type:'Quantitative', methodology:'ESRS 2 MDR-T', metric:'kg, %', scope:'Entity-wide' },
  { dr:'E2-4', name:'Pollution of air, water and soil', mandatory:true, type:'Quantitative', methodology:'E-PRTR, IED', metric:'kg pollutants', scope:'Entity-wide' },
  { dr:'E2-5', name:'Substances of concern and SVHC', mandatory:true, type:'Quantitative', methodology:'REACH, CLP', metric:'kg, count', scope:'Products/operations' },
  { dr:'E2-6', name:'Anticipated financial effects from pollution', mandatory:true, type:'Quantitative', methodology:'TCFD-aligned', metric:'EUR', scope:'Entity-wide' },
];

const E3_DATAPOINTS = [
  { dr:'E3-1', name:'Policies related to water and marine resources', mandatory:true, type:'Narrative', methodology:'ESRS 2 MDR-P', metric:'-', scope:'Entity-wide' },
  { dr:'E3-2', name:'Actions and resources related to water', mandatory:true, type:'Semi-quantitative', methodology:'ESRS 2 MDR-A', metric:'EUR', scope:'Entity-wide' },
  { dr:'E3-3', name:'Targets related to water and marine resources', mandatory:true, type:'Quantitative', methodology:'ESRS 2 MDR-T', metric:'m3, %', scope:'Entity-wide' },
  { dr:'E3-4', name:'Water consumption', mandatory:true, type:'Quantitative', methodology:'GRI 303, CDP Water', metric:'ML', scope:'By source/area' },
  { dr:'E3-5', name:'Anticipated financial effects from water risks', mandatory:true, type:'Quantitative', methodology:'WRI Aqueduct', metric:'EUR', scope:'Entity-wide' },
];

const E4_DATAPOINTS = [
  { dr:'E4-1', name:'Transition plan for biodiversity and ecosystems', mandatory:false, type:'Narrative', methodology:'TNFD LEAP', metric:'-', scope:'Entity-wide' },
  { dr:'E4-2', name:'Policies related to biodiversity and ecosystems', mandatory:true, type:'Narrative', methodology:'ESRS 2 MDR-P', metric:'-', scope:'Entity-wide' },
  { dr:'E4-3', name:'Actions and resources related to biodiversity', mandatory:true, type:'Semi-quantitative', methodology:'ESRS 2 MDR-A', metric:'EUR', scope:'Entity-wide' },
  { dr:'E4-4', name:'Targets related to biodiversity and ecosystems', mandatory:true, type:'Quantitative', methodology:'SBTN, ESRS 2 MDR-T', metric:'ha, count', scope:'Entity-wide' },
  { dr:'E4-5', name:'Impact metrics related to biodiversity change', mandatory:true, type:'Quantitative', methodology:'TNFD, MSA, PDF', metric:'MSA.km2', scope:'Sites + VC' },
  { dr:'E4-6', name:'Anticipated financial effects from biodiversity', mandatory:true, type:'Quantitative', methodology:'TNFD, ENCORE', metric:'EUR', scope:'Entity-wide' },
];

const E5_DATAPOINTS = [
  { dr:'E5-1', name:'Policies related to resource use and circular economy', mandatory:true, type:'Narrative', methodology:'ESRS 2 MDR-P', metric:'-', scope:'Entity-wide' },
  { dr:'E5-2', name:'Actions and resources related to circular economy', mandatory:true, type:'Semi-quantitative', methodology:'ESRS 2 MDR-A', metric:'EUR', scope:'Entity-wide' },
  { dr:'E5-3', name:'Targets related to resource use and circular economy', mandatory:true, type:'Quantitative', methodology:'ESRS 2 MDR-T', metric:'tonnes, %', scope:'Entity-wide' },
  { dr:'E5-4', name:'Resource inflows', mandatory:true, type:'Quantitative', methodology:'MFA', metric:'tonnes', scope:'Entity-wide' },
  { dr:'E5-5', name:'Resource outflows', mandatory:true, type:'Quantitative', methodology:'GRI 306, WFD', metric:'tonnes', scope:'By waste type' },
  { dr:'E5-6', name:'Anticipated financial effects from resource use', mandatory:true, type:'Quantitative', methodology:'TCFD-aligned', metric:'EUR', scope:'Entity-wide' },
];

const S1_DATAPOINTS = [
  { dr:'S1-1', name:'Policies related to own workforce', mandatory:true, type:'Narrative', metric:'-' },
  { dr:'S1-2', name:'Processes for engaging with own workforce', mandatory:true, type:'Narrative', metric:'-' },
  { dr:'S1-3', name:'Processes to remediate negative impacts on own workforce', mandatory:true, type:'Narrative', metric:'-' },
  { dr:'S1-4', name:'Taking action on material impacts on own workforce', mandatory:true, type:'Semi-quantitative', metric:'EUR, count' },
  { dr:'S1-5', name:'Targets related to managing impacts on own workforce', mandatory:true, type:'Quantitative', metric:'%, count' },
  { dr:'S1-6', name:'Characteristics of employees', mandatory:true, type:'Quantitative', metric:'FTE, %' },
  { dr:'S1-7', name:'Characteristics of non-employee workers', mandatory:true, type:'Quantitative', metric:'FTE, %' },
  { dr:'S1-8', name:'Collective bargaining coverage and social dialogue', mandatory:true, type:'Quantitative', metric:'%' },
  { dr:'S1-9', name:'Diversity metrics', mandatory:true, type:'Quantitative', metric:'%' },
  { dr:'S1-10', name:'Adequate wages', mandatory:true, type:'Quantitative', metric:'%, ratio' },
  { dr:'S1-11', name:'Social protection', mandatory:true, type:'Quantitative', metric:'%' },
  { dr:'S1-12', name:'Persons with disabilities', mandatory:true, type:'Quantitative', metric:'%, count' },
  { dr:'S1-13', name:'Training and skills development metrics', mandatory:true, type:'Quantitative', metric:'hours, %' },
  { dr:'S1-14', name:'Health and safety metrics', mandatory:true, type:'Quantitative', metric:'LTIR, TRIR' },
  { dr:'S1-15', name:'Work-life balance metrics', mandatory:true, type:'Quantitative', metric:'%' },
  { dr:'S1-16', name:'Remuneration metrics (pay gap)', mandatory:true, type:'Quantitative', metric:'ratio, %' },
  { dr:'S1-17', name:'Incidents, complaints and severe human rights impacts', mandatory:true, type:'Quantitative', metric:'count' },
];

const G1_DATAPOINTS = [
  { dr:'G1-1', name:'Business conduct policies and corporate culture', mandatory:true, type:'Narrative', metric:'-' },
  { dr:'G1-2', name:'Management of relationships with suppliers', mandatory:true, type:'Narrative', metric:'-' },
  { dr:'G1-3', name:'Prevention and detection of corruption and bribery', mandatory:true, type:'Quantitative', metric:'count, %' },
  { dr:'G1-4', name:'Incidents of corruption or bribery', mandatory:true, type:'Quantitative', metric:'count' },
  { dr:'G1-5', name:'Political influence and lobbying activities', mandatory:true, type:'Quantitative', metric:'EUR, count' },
  { dr:'G1-6', name:'Payment practices', mandatory:true, type:'Quantitative', metric:'days, %' },
];

const ESRS2_DATAPOINTS = [
  { dr:'GOV-1', name:'Role of administrative, management and supervisory bodies', mandatory:true, type:'Narrative', metric:'-' },
  { dr:'GOV-2', name:'Information provided to and sustainability matters addressed by the undertaking\'s administrative bodies', mandatory:true, type:'Narrative', metric:'-' },
  { dr:'GOV-3', name:'Integration of sustainability-related performance in incentive schemes', mandatory:true, type:'Quantitative', metric:'%' },
  { dr:'GOV-4', name:'Statement on due diligence', mandatory:true, type:'Narrative', metric:'-' },
  { dr:'GOV-5', name:'Risk management and internal controls over sustainability reporting', mandatory:true, type:'Narrative', metric:'-' },
  { dr:'SBM-1', name:'Strategy, business model and value chain', mandatory:true, type:'Narrative', metric:'-' },
  { dr:'SBM-2', name:'Interests and views of stakeholders', mandatory:true, type:'Narrative', metric:'-' },
  { dr:'SBM-3', name:'Material impacts, risks and opportunities and their interaction with strategy and business model', mandatory:true, type:'Narrative', metric:'-' },
  { dr:'IRO-1', name:'Description of the processes to identify and assess material IROs', mandatory:true, type:'Narrative', metric:'-' },
  { dr:'IRO-2', name:'Disclosure requirements in ESRS covered by the sustainability statement', mandatory:true, type:'Narrative', metric:'-' },
  { dr:'MDR-P', name:'Policies adopted to manage material sustainability matters', mandatory:true, type:'Narrative', metric:'-' },
  { dr:'MDR-A', name:'Actions and resources in relation to material sustainability matters', mandatory:true, type:'Semi-quantitative', metric:'EUR, count' },
];

// ── CROSSWALK ─────────────────────────────────────────────────────────────────
const CROSSWALK_MAP = [
  { esrs:'E1-6 GHG Emissions', gri:'GRI 305-1/2/3', issb:'IFRS S2 para 29', brsr:'Principle 6 KPI 1-3', sasb:'Various industry' },
  { esrs:'E1-5 Energy', gri:'GRI 302-1/2/3', issb:'IFRS S2 para 29(f)', brsr:'Principle 6 KPI 4', sasb:'IF-EU-000.A/B' },
  { esrs:'E1-4 Climate Targets', gri:'GRI 305-5', issb:'IFRS S2 para 33-36', brsr:'Principle 6 E.2', sasb:'-' },
  { esrs:'E1-1 Transition Plan', gri:'-', issb:'IFRS S2 para 14', brsr:'-', sasb:'-' },
  { esrs:'E3-4 Water', gri:'GRI 303-3/4/5', issb:'-', brsr:'Principle 6 KPI 5', sasb:'IF-WU-000.B' },
  { esrs:'E4-5 Biodiversity', gri:'GRI 304-1/2/3/4', issb:'-', brsr:'Principle 6 E.4', sasb:'-' },
  { esrs:'S1-14 H&S', gri:'GRI 403-9/10', issb:'-', brsr:'Principle 3 KPI 1-4', sasb:'Various' },
  { esrs:'S1-9 Diversity', gri:'GRI 405-1/2', issb:'-', brsr:'Principle 5 KPI 1-3', sasb:'-' },
  { esrs:'S1-16 Pay Gap', gri:'GRI 405-2', issb:'-', brsr:'Principle 5 KPI 4', sasb:'-' },
  { esrs:'G1-3 Anti-corruption', gri:'GRI 205-1/2/3', issb:'-', brsr:'Principle 1 KPI 1', sasb:'-' },
  { esrs:'G1-5 Political Influence', gri:'GRI 415-1', issb:'-', brsr:'-', sasb:'-' },
  { esrs:'GOV-1 Board Oversight', gri:'GRI 2-9/10/11/12', issb:'IFRS S2 para 6', brsr:'Section A', sasb:'-' },
  { esrs:'SBM-1 Strategy', gri:'GRI 2-1/2/6/7', issb:'IFRS S2 para 10-12', brsr:'Section A', sasb:'-' },
  { esrs:'IRO-1 Risk Process', gri:'GRI 3-1', issb:'IFRS S2 para 25', brsr:'Principle 6 E.7', sasb:'-' },
];

// ── OMNIBUS SIMPLIFICATIONS ───────────────────────────────────────────────────
const OMNIBUS_CHANGES = [
  { area:'Value Chain', before:'Full value chain reporting required from year 1', after:'Simplified value chain: only material upstream/downstream, phased over 3 years', impact:'Significant reduction for companies with complex supply chains' },
  { area:'Employee Threshold', before:'All large companies (250+ employees)', after:'1,000+ employee threshold for certain social metrics', impact:'~30% fewer companies required to report full S1 workforce data' },
  { area:'Proportionate Assessment', before:'Full double materiality for all topics', after:'Proportionate approach: qualitative-only assessment for less material topics', impact:'Reduces assessment burden by ~40% for mid-cap companies' },
  { area:'Phasing of Standards', before:'All ESRS mandatory from 2025/2026', after:'ESRS E2-E5, S2-S4 phased to 2027 for companies <1000 employees', impact:'Allows 2 extra years of preparation for smaller filers' },
  { area:'Sector Standards', before:'Sector-specific standards planned for 2025-2026', after:'Sector standards delayed to 2028 at earliest', impact:'Reduces near-term compliance complexity' },
  { area:'Assurance', before:'Limited assurance from 2025, reasonable assurance from 2028', after:'Limited assurance from 2025, reasonable assurance timeline extended to 2030+', impact:'More time to build assurance readiness' },
  { area:'Datapoint Reduction', before:'~1,100+ quantitative datapoints across all ESRS', after:'~430 core datapoints (materiality-dependent)', impact:'~60% reduction in mandatory quantitative disclosures' },
  { area:'Voluntary Datapoints', before:'Many datapoints mandatory regardless of materiality', after:'Clear mandatory/voluntary classification per datapoint', impact:'Better alignment with double materiality outcomes' },
];

// ── ASSURANCE ROADMAP ─────────────────────────────────────────────────────────
const ASSURANCE_PHASES = [
  { year:'2025-2026', level:'Limited Assurance', scope:'Selected ESRS datapoints (E1-6, GOV-1)', standard:'ISAE 3000 (Revised)', effort:'Low-Medium' },
  { year:'2027-2028', level:'Limited Assurance (Extended)', scope:'All material ESRS datapoints', standard:'ISAE 3000 + ISAE 3410', effort:'Medium' },
  { year:'2029-2030', level:'Reasonable Assurance (Phased)', scope:'E1 Climate + ESRS 2 General', standard:'ISAE 3000 Reasonable', effort:'High' },
  { year:'2031+', level:'Full Reasonable Assurance', scope:'All material sustainability disclosures', standard:'EU Sustainability Assurance Standard', effort:'Very High' },
];

// ── IMPLEMENTATION STATUS ─────────────────────────────────────────────────────
const STATUS_OPTIONS = ['Not Started','In Progress','Complete','Assured'];
const STATUS_COLORS = { 'Not Started':'#fee2e2', 'In Progress':'#fef3c7', 'Complete':'#dcfce7', 'Assured':'#dbeafe' };
const STATUS_TEXT = { 'Not Started':T.red, 'In Progress':T.amber, 'Complete':T.green, 'Assured':T.blue };

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function EsrsDatapointNavigatorPage() {
  const [tab, setTab] = useState(0);
  const [selectedStandard, setSelectedStandard] = useState(0);
  const [selectedESubTab, setSelectedESubTab] = useState(0);
  const [materialTopics, setMaterialTopics] = useState(ESRS_STANDARDS.map(()=>true));
  const [implStatus, setImplStatus] = useState({});
  const [crosswalkFilter, setCrosswalkFilter] = useState('All');

  const COLORS = [T.indigo, T.green, T.teal, T.purple, T.blue, T.orange, T.amber, T.red, T.navy, '#059669', '#7c3aed'];

  const totalDatapoints = useMemo(() => ESRS_STANDARDS.reduce((s,e)=>s+e.datapoints,0), []);
  const materialDatapoints = useMemo(() => ESRS_STANDARDS.filter((_,i)=>materialTopics[i]).reduce((s,e)=>s+e.datapoints,0), [materialTopics]);

  const dpByCategory = useMemo(() => {
    const cats = {};
    ESRS_STANDARDS.forEach(s => {
      if (!cats[s.category]) cats[s.category] = 0;
      cats[s.category] += s.datapoints;
    });
    return Object.entries(cats).map(([name,value],i) => ({ name, value, fill: COLORS[i] }));
  }, []);

  const envDatapoints = [E1_DATAPOINTS, E2_DATAPOINTS, E3_DATAPOINTS, E4_DATAPOINTS, E5_DATAPOINTS];
  const envLabels = ['E1 Climate','E2 Pollution','E3 Water','E4 Biodiversity','E5 Circular'];

  const getStatus = useCallback((code) => implStatus[code] || 'Not Started', [implStatus]);
  const setStatus = useCallback((code, val) => setImplStatus(p => ({...p, [code]: val})), []);

  const implSummary = useMemo(() => {
    const allDps = [...E1_DATAPOINTS,...E2_DATAPOINTS,...E3_DATAPOINTS,...E4_DATAPOINTS,...E5_DATAPOINTS,...S1_DATAPOINTS,...G1_DATAPOINTS,...ESRS2_DATAPOINTS];
    const counts = { 'Not Started':0, 'In Progress':0, 'Complete':0, 'Assured':0 };
    allDps.forEach(dp => { counts[getStatus(dp.dr)] = (counts[getStatus(dp.dr)]||0)+1; });
    return Object.entries(counts).map(([name,value]) => ({ name, value, fill: STATUS_TEXT[name] }));
  }, [getStatus]);

  const renderDatapointTable = (dps) => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ background: T.navy, color: '#fff' }}>
            {['DR Code','Disclosure Requirement','Mandatory','Type','Methodology','Metric','Scope'].map(h => (
              <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dps.map((dp, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.surface, borderBottom: `1px solid ${T.border}` }}>
              <td style={{ padding: '6px 8px', fontFamily: T.mono, color: T.indigo, fontWeight: 600 }}>{dp.dr}</td>
              <td style={{ padding: '6px 8px' }}>{dp.name}</td>
              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                <span style={{ padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700, background: dp.mandatory ? '#dcfce7' : '#f3f4f6', color: dp.mandatory ? T.green : T.sub }}>
                  {dp.mandatory ? 'Yes' : 'Vol.'}
                </span>
              </td>
              <td style={{ padding: '6px 8px', fontSize: 10 }}>{dp.type}</td>
              <td style={{ padding: '6px 8px', fontSize: 10, color: T.sub }}>{dp.methodology || '-'}</td>
              <td style={{ padding: '6px 8px', fontFamily: T.mono, fontSize: 10 }}>{dp.metric}</td>
              <td style={{ padding: '6px 8px', fontSize: 10 }}>{dp.scope || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ fontFamily: T.font, color: T.text, background: T.surface, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: T.navy, margin: 0 }}>ESRS Datapoint Navigator</h1>
          <p style={{ color: T.sub, fontSize: 14, margin: '4px 0 0', fontFamily: T.mono }}>
            {ESRS_STANDARDS.length} Standards | {totalDatapoints}+ Datapoints | Double Materiality | Omnibus Simplification
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.border}`, paddingBottom: 8 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '8px 14px', fontSize: 12, fontWeight: tab === i ? 700 : 500,
              background: tab === i ? T.navy : 'transparent', color: tab === i ? '#fff' : T.sub,
              border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: T.font
            }}>{t}</button>
          ))}
        </div>

        {/* TAB 0: Standards Overview */}
        {tab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              {[['Total Standards', ESRS_STANDARDS.length], ['Total Datapoints', totalDatapoints+'+'], ['Environmental', '5 (E1-E5)'], ['Social + Governance', '5 (S1-S4, G1)']].map(([k,v],i) => (
                <div key={i} style={{ background: T.card, borderRadius: 8, padding: 16, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: COLORS[i] }}>{v}</div>
                  <div style={{ fontSize: 11, color: T.sub, fontFamily: T.mono }}>{k}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
              {ESRS_STANDARDS.map((s,i) => (
                <div key={i} style={{ background: T.card, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, cursor: 'pointer' }} onClick={()=>{
                  if (s.category==='Environmental') { setTab(1); setSelectedESubTab(i-1); }
                  else if (s.category==='Social') setTab(2);
                  else if (s.category==='Governance') setTab(3);
                  else setTab(4);
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: COLORS[i % COLORS.length] }}>{s.code}</span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: s.category === 'Environmental' ? '#dcfce7' : s.category === 'Social' ? '#dbeafe' : s.category === 'Governance' ? '#fef3c7' : '#f3e8ff', color: s.category === 'Environmental' ? T.green : s.category === 'Social' ? T.blue : s.category === 'Governance' ? T.amber : T.purple }}>
                      {s.category}
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 14, color: T.navy }}>{s.name}</h4>
                  <p style={{ fontSize: 11, color: T.sub, margin: '0 0 8px' }}>{s.description}</p>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: T.mono }}>
                    <span>{s.datapoints} datapoints</span>
                    <span>{s.drs} DRs</span>
                    <span style={{ color: s.mandatory ? T.green : T.sub }}>{s.mandatory ? 'Always mandatory' : 'Materiality-based'}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}`, marginTop: 16 }}>
              <h4 style={{ color: T.navy, fontSize: 14, marginTop: 0 }}>Datapoints by Category</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={dpByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({name,value})=>`${name}: ${value}`}>
                    {dpByCategory.map((d,i)=><Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 1: Environmental */}
        {tab === 1 && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {envLabels.map((l,i) => (
                <button key={i} onClick={()=>setSelectedESubTab(i)} style={{
                  padding: '6px 14px', fontSize: 12, fontWeight: selectedESubTab === i ? 700 : 400,
                  background: selectedESubTab === i ? T.green : T.card, color: selectedESubTab === i ? '#fff' : T.text,
                  border: `1px solid ${selectedESubTab === i ? T.green : T.border}`, borderRadius: 6, cursor: 'pointer'
                }}>{l} ({envDatapoints[i].length})</button>
              ))}
            </div>
            {renderDatapointTable(envDatapoints[selectedESubTab])}
          </div>
        )}

        {/* TAB 2: Social */}
        {tab === 2 && (
          <div>
            <h3 style={{ color: T.navy, fontSize: 16 }}>S1: Own Workforce ({S1_DATAPOINTS.length} Disclosure Requirements)</h3>
            {renderDatapointTable(S1_DATAPOINTS)}
            <p style={{ color: T.sub, fontSize: 12, marginTop: 16 }}>S2 (Workers in Value Chain), S3 (Affected Communities), S4 (Consumers) follow similar structure with 5 DRs each, materiality-dependent.</p>
          </div>
        )}

        {/* TAB 3: Governance */}
        {tab === 3 && (
          <div>
            <h3 style={{ color: T.navy, fontSize: 16 }}>G1: Business Conduct ({G1_DATAPOINTS.length} Disclosure Requirements)</h3>
            {renderDatapointTable(G1_DATAPOINTS)}
          </div>
        )}

        {/* TAB 4: ESRS 2 General */}
        {tab === 4 && (
          <div>
            <h3 style={{ color: T.navy, fontSize: 16 }}>ESRS 2: General Disclosures ({ESRS2_DATAPOINTS.length} Disclosure Requirements)</h3>
            <p style={{ color: T.sub, fontSize: 12, marginBottom: 12 }}>All ESRS 2 disclosures are mandatory regardless of materiality assessment.</p>
            {renderDatapointTable(ESRS2_DATAPOINTS)}
          </div>
        )}

        {/* TAB 5: Framework Crosswalk */}
        {tab === 5 && (
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['ESRS Datapoint','GRI Standard','ISSB/IFRS S2','BRSR KPI','SASB Metric'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontFamily: T.mono }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CROSSWALK_MAP.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.surface, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: T.indigo }}>{row.esrs}</td>
                      <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{row.gri}</td>
                      <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{row.issb}</td>
                      <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{row.brsr}</td>
                      <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{row.sasb}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: Materiality Filter */}
        {tab === 6 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                <h4 style={{ color: T.navy, fontSize: 14, marginTop: 0 }}>Double Materiality Assessment</h4>
                <p style={{ color: T.sub, fontSize: 12, marginBottom: 12 }}>Toggle topics to see required datapoints:</p>
                {ESRS_STANDARDS.map((s,i) => (
                  <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={materialTopics[i]} onChange={()=>{
                      const next = [...materialTopics]; next[i] = !next[i]; setMaterialTopics(next);
                    }} disabled={s.mandatory} />
                    <span style={{ fontFamily: T.mono, color: COLORS[i % COLORS.length], fontWeight: 600, width: 60 }}>{s.code}</span>
                    <span>{s.name}</span>
                    <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 10, color: T.sub }}>{s.datapoints} DPs</span>
                  </label>
                ))}
              </div>
              <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                <h4 style={{ color: T.navy, fontSize: 14, marginTop: 0 }}>Required Datapoints</h4>
                <div style={{ fontSize: 48, fontWeight: 700, color: T.indigo, textAlign: 'center', marginBottom: 8 }}>{materialDatapoints}</div>
                <div style={{ fontSize: 12, color: T.sub, textAlign: 'center', marginBottom: 16 }}>of {totalDatapoints}+ total datapoints</div>
                <div style={{ height: 12, background: T.surface, borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${totalDatapoints > 0 ? (materialDatapoints / totalDatapoints * 100) : 0}%`, background: T.indigo, borderRadius: 6, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 11, color: T.sub, textAlign: 'center', marginTop: 4 }}>
                  {totalDatapoints > 0 ? (materialDatapoints / totalDatapoints * 100).toFixed(0) : 0}% of total
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: Assurance Roadmap */}
        {tab === 7 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {ASSURANCE_PHASES.map((p, i) => (
                <div key={i} style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: COLORS[i] }}>{p.year}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: i < 2 ? '#fef3c7' : '#dcfce7', color: i < 2 ? T.amber : T.green }}>{p.effort}</span>
                  </div>
                  <h4 style={{ color: T.navy, fontSize: 14, margin: '0 0 8px' }}>{p.level}</h4>
                  <div style={{ fontSize: 12, color: T.text, marginBottom: 4 }}><b>Scope:</b> {p.scope}</div>
                  <div style={{ fontSize: 12, color: T.sub }}><b>Standard:</b> {p.standard}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: Omnibus Impact Analyzer */}
        {tab === 8 && (
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['Area','Before Omnibus','After Omnibus','Impact'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontFamily: T.mono }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {OMNIBUS_CHANGES.map((c, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.surface, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: T.navy }}>{c.area}</td>
                      <td style={{ padding: '8px 10px', color: T.red }}>{c.before}</td>
                      <td style={{ padding: '8px 10px', color: T.green }}>{c.after}</td>
                      <td style={{ padding: '8px 10px', color: T.sub, fontStyle: 'italic' }}>{c.impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 9: Implementation Tracker */}
        {tab === 9 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                <h4 style={{ color: T.navy, fontSize: 14, marginTop: 0 }}>Implementation Progress</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={implSummary} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({name,value})=>`${name}: ${value}`}>
                      {implSummary.map((d,i)=><Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                <h4 style={{ color: T.navy, fontSize: 14, marginTop: 0 }}>Gap Analysis</h4>
                <div style={{ fontSize: 12, color: T.text }}>
                  {implSummary.map((s,i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.fill }} />
                        {s.name}
                      </span>
                      <span style={{ fontFamily: T.mono, fontWeight: 700 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
              <h4 style={{ color: T.navy, fontSize: 14, marginTop: 0 }}>Update Status per Datapoint (E1 Climate)</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.navy, color: '#fff' }}>
                      <th style={{ padding: '6px 8px', fontFamily: T.mono }}>DR</th>
                      <th style={{ padding: '6px 8px' }}>Requirement</th>
                      <th style={{ padding: '6px 8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {E1_DATAPOINTS.map((dp, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.surface }}>
                        <td style={{ padding: '6px 8px', fontFamily: T.mono, color: T.indigo }}>{dp.dr}</td>
                        <td style={{ padding: '6px 8px' }}>{dp.name}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <select value={getStatus(dp.dr)} onChange={e=>setStatus(dp.dr, e.target.value)} style={{
                            padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                            background: STATUS_COLORS[getStatus(dp.dr)], color: STATUS_TEXT[getStatus(dp.dr)],
                            border: '1px solid transparent', cursor: 'pointer', fontFamily: T.font
                          }}>
                            {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
