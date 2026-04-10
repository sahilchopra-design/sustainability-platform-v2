import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, ReferenceLine,
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
   HERO'S JOURNEY — 12 STAGES APPLIED TO SUSTAINABILITY
   ═══════════════════════════════════════════════════════════════════ */
const HEROS_JOURNEY = [
  { stage: 1, name: 'The Ordinary World', desc: 'Pre-sustainability state: business as usual, unaware of environmental/social impacts', sustainability: 'Baseline operations without ESG integration', color: '#94a3b8' },
  { stage: 2, name: 'Call to Adventure', desc: 'Catalyst event: regulation, stakeholder pressure, climate event, or market shift', sustainability: 'CSRD mandate, investor ESG demands, climate disaster affecting operations', color: '#3b82f6' },
  { stage: 3, name: 'Refusal of the Call', desc: 'Initial resistance: cost concerns, skepticism, "not our problem" mentality', sustainability: 'Board pushback, CapEx concerns, greenwashing temptation', color: '#ef4444' },
  { stage: 4, name: 'Meeting the Mentor', desc: 'Finding guidance: consultants, frameworks, peer leaders, industry bodies', sustainability: 'Engaging KPMG/EY, adopting GRI/ESRS, joining SBTi, hiring Chief Sustainability Officer', color: '#8b5cf6' },
  { stage: 5, name: 'Crossing the Threshold', desc: 'Commitment to action: first sustainability report, public targets, governance changes', sustainability: 'Publishing first CSRD report, setting SBTi targets, board ESG committee', color: '#06b6d4' },
  { stage: 6, name: 'Tests, Allies, Enemies', desc: 'Early challenges: data gaps, supplier pushback, methodology debates', sustainability: 'Scope 3 data collection, supply chain engagement, taxonomy alignment struggles', color: '#f59e0b' },
  { stage: 7, name: 'Approach to Inmost Cave', desc: 'Preparing for the hardest transformation: business model changes needed', sustainability: 'Transition plan development, stranded asset assessment, green CapEx planning', color: '#ec4899' },
  { stage: 8, name: 'The Ordeal', desc: 'Critical transformation moment: fundamental business model pivot or major investment', sustainability: 'Divesting fossil fuels, restructuring supply chain, massive renewable investment', color: '#dc2626' },
  { stage: 9, name: 'The Reward', desc: 'Tangible results: improved ratings, cost savings, new revenue streams', sustainability: 'MSCI AAA rating, 30% energy cost reduction, green bond issuance, customer loyalty', color: '#16a34a' },
  { stage: 10, name: 'The Road Back', desc: 'Sustaining momentum: embedding changes, scaling what works', sustainability: 'Integrating ESG into all business decisions, training workforce, supplier cascading', color: '#0891b2' },
  { stage: 11, name: 'The Resurrection', desc: 'Proving resilience: surviving climate events, regulatory changes, market shifts', sustainability: 'Passing ECB climate stress test, CSRD audit success, surviving supply chain disruption', color: '#7c3aed' },
  { stage: 12, name: 'Return with the Elixir', desc: 'Becoming the mentor: industry leadership, sharing knowledge, influencing policy', sustainability: 'Chairing industry coalitions, policy advocacy, open-sourcing methodology, benchmark status', color: '#065f46' },
];

/* ═══════════════════════════════════════════════════════════════════
   6 STAKEHOLDER NARRATIVE JOURNEYS
   ═══════════════════════════════════════════════════════════════════ */
const STAKEHOLDER_JOURNEYS = [
  { audience: 'Investor', priorities: ['ROI', 'Risk Mitigation', 'Regulatory Compliance', 'Transition Readiness'], tone: 'Data-driven, Precise, Forward-looking', keyMessages: ['Climate risk is financial risk', 'Transition plan is investment thesis', 'ESG alpha generation'], color: '#1d4ed8' },
  { audience: 'Customer', priorities: ['Product Sustainability', 'Transparency', 'Affordability', 'Brand Trust'], tone: 'Authentic, Relatable, Visual', keyMessages: ['Our product journey from source to shelf', 'Your purchase impact', 'Real progress, real numbers'], color: '#16a34a' },
  { audience: 'Employee', priorities: ['Purpose', 'Workplace Safety', 'Career Growth', 'Inclusion'], tone: 'Inspirational, Inclusive, Action-oriented', keyMessages: ['You are part of the solution', 'Our people strategy', 'Skills for the green transition'], color: '#7c3aed' },
  { audience: 'Supplier', priorities: ['Partnership', 'Capacity Building', 'Fair Terms', 'Decarbonization Support'], tone: 'Collaborative, Practical, Supportive', keyMessages: ['Growing together sustainably', 'Shared value creation', 'Tools and training provided'], color: '#ea580c' },
  { audience: 'Community', priorities: ['Local Impact', 'Job Creation', 'Environmental Protection', 'Health & Safety'], tone: 'Warm, Concrete, Place-based', keyMessages: ['Our commitment to your neighborhood', 'Local hiring and investment', 'Environmental stewardship'], color: '#be123c' },
  { audience: 'Regulator', priorities: ['Compliance', 'Transparency', 'Data Quality', 'Governance'], tone: 'Formal, Precise, Evidence-based', keyMessages: ['Full compliance demonstrated', 'Robust governance framework', 'Audit-ready data systems'], color: '#0f766e' },
];

/* ═══════════════════════════════════════════════════════════════════
   TONE SPECTRUM BY SECTION
   ═══════════════════════════════════════════════════════════════════ */
const TONE_SECTIONS = [
  { section: 'CEO Letter', tones: ['Inspirational', 'Accountable', 'Forward-looking'], weight: { inspirational: 40, accountable: 35, formal: 5, transparent: 10, empathetic: 10 } },
  { section: 'Governance', tones: ['Formal', 'Transparent', 'Precise'], weight: { inspirational: 5, accountable: 20, formal: 40, transparent: 30, empathetic: 5 } },
  { section: 'Strategy', tones: ['Confident', 'Data-driven', 'Ambitious'], weight: { inspirational: 25, accountable: 15, formal: 20, transparent: 20, empathetic: 20 } },
  { section: 'Risk & Opportunities', tones: ['Balanced', 'Analytical', 'Honest'], weight: { inspirational: 10, accountable: 30, formal: 25, transparent: 25, empathetic: 10 } },
  { section: 'Metrics & Targets', tones: ['Precise', 'Evidence-based', 'Benchmark-aware'], weight: { inspirational: 5, accountable: 25, formal: 35, transparent: 30, empathetic: 5 } },
  { section: 'Social Impact', tones: ['Empathetic', 'Story-driven', 'Human'], weight: { inspirational: 30, accountable: 15, formal: 5, transparent: 15, empathetic: 35 } },
  { section: 'Environmental Data', tones: ['Scientific', 'Precise', 'Methodical'], weight: { inspirational: 5, accountable: 20, formal: 40, transparent: 30, empathetic: 5 } },
  { section: 'Forward-Looking', tones: ['Visionary', 'Cautious', 'Science-aligned'], weight: { inspirational: 35, accountable: 25, formal: 15, transparent: 15, empathetic: 10 } },
];

/* ═══════════════════════════════════════════════════════════════════
   RELATABLE EQUIVALENTS
   ═══════════════════════════════════════════════════════════════════ */
const EQUIVALENTS = {
  tCO2e: [
    { factor: 0.216, unit: 'cars off the road for 1 year', icon: 'car' },
    { factor: 0.123, unit: 'homes powered for 1 year', icon: 'home' },
    { factor: 16.53, unit: 'tree seedlings grown for 10 years', icon: 'tree' },
    { factor: 0.00043, unit: 'flights London to New York', icon: 'plane' },
    { factor: 113.0, unit: 'smartphones charged', icon: 'phone' },
  ],
  MWh: [
    { factor: 0.075, unit: 'homes powered for 1 year', icon: 'home' },
    { factor: 3412.14, unit: 'hours of LED bulb operation', icon: 'bulb' },
    { factor: 0.00029, unit: 'Olympic swimming pools heated', icon: 'pool' },
  ],
  'm3': [
    { factor: 0.0004, unit: 'Olympic swimming pools', icon: 'pool' },
    { factor: 400.0, unit: 'average showers', icon: 'shower' },
    { factor: 6667.0, unit: 'glasses of drinking water', icon: 'glass' },
  ],
};

/* ═══════════════════════════════════════════════════════════════════
   REPORT EXCERPTS
   ═══════════════════════════════════════════════════════════════════ */
const REPORT_EXCERPTS = [
  { company: 'Unilever', year: 2023, section: 'CEO Letter', type: 'Narrative', tone: 'Inspirational', keyTakeaway: 'Integrated sustainability as core business strategy, linked to growth', quality: 92 },
  { company: 'BASF', year: 2023, section: 'Governance', type: 'Semi-Narrative', tone: 'Formal', keyTakeaway: 'Board-level sustainability committee with clear mandate and KPIs', quality: 88 },
  { company: 'Shell', year: 2023, section: 'Strategy', type: 'Narrative', tone: 'Defensive', keyTakeaway: 'Transition plan with caveats, balancing energy security and climate', quality: 65 },
  { company: 'Microsoft', year: 2023, section: 'Metrics & Targets', type: 'Data', tone: 'Precise', keyTakeaway: 'Carbon negative by 2030, backed by $1B Climate Innovation Fund', quality: 95 },
  { company: 'IKEA', year: 2023, section: 'Social Impact', type: 'Narrative', tone: 'Empathetic', keyTakeaway: 'Worker wellbeing in supply chain with living wage commitment', quality: 85 },
  { company: 'Volkswagen', year: 2023, section: 'Risk & Opportunities', type: 'Semi-Narrative', tone: 'Balanced', keyTakeaway: 'Post-Dieselgate transformation: EV strategy as risk mitigation', quality: 72 },
  { company: 'Schneider Electric', year: 2023, section: 'Environmental Data', type: 'Data', tone: 'Scientific', keyTakeaway: 'SSI index: 200+ quantified KPIs across all ESG dimensions', quality: 96 },
  { company: 'Nestle', year: 2023, section: 'Forward-Looking', type: 'Narrative', tone: 'Cautious', keyTakeaway: 'Net zero roadmap with regenerative agriculture transition plan', quality: 78 },
  { company: 'Orsted', year: 2023, section: 'Strategy', type: 'Narrative', tone: 'Confident', keyTakeaway: 'From fossil fuels to world leader in offshore wind: transformation story', quality: 94 },
  { company: 'Patagonia', year: 2023, section: 'CEO Letter', type: 'Narrative', tone: 'Authentic', keyTakeaway: 'Purpose-driven business model: Earth is our only shareholder', quality: 98 },
];

/* ═══════════════════════════════════════════════════════════════════
   MESSAGE HIERARCHY
   ═══════════════════════════════════════════════════════════════════ */
const MSG_LEVELS = ['Core Message', 'Supporting Message 1', 'Supporting Message 2', 'Supporting Message 3'];

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT MIX BENCHMARKS
   ═══════════════════════════════════════════════════════════════════ */
const COMPONENT_MIX = [
  { section: 'CEO Letter', data: 15, narrative: 70, visual: 15, bestData: 10, bestNarrative: 75, bestVisual: 15 },
  { section: 'Governance', data: 30, narrative: 55, visual: 15, bestData: 35, bestNarrative: 50, bestVisual: 15 },
  { section: 'Strategy', data: 25, narrative: 55, visual: 20, bestData: 25, bestNarrative: 50, bestVisual: 25 },
  { section: 'Risk & Opportunities', data: 40, narrative: 40, visual: 20, bestData: 45, bestNarrative: 35, bestVisual: 20 },
  { section: 'Metrics & Targets', data: 60, narrative: 20, visual: 20, bestData: 55, bestNarrative: 20, bestVisual: 25 },
  { section: 'Social Impact', data: 25, narrative: 55, visual: 20, bestData: 20, bestNarrative: 55, bestVisual: 25 },
  { section: 'Environmental Data', data: 65, narrative: 15, visual: 20, bestData: 60, bestNarrative: 15, bestVisual: 25 },
  { section: 'Forward-Looking', data: 30, narrative: 50, visual: 20, bestData: 30, bestNarrative: 50, bestVisual: 20 },
];

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
const TABS = ['Narrative Dashboard','Hero\'s Journey Mapper','Stakeholder Journeys','Tone Spectrum','Relatable Equivalents','Message Hierarchy Builder','Report Excerpts Library','Component Mix Analyzer'];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, borderRadius: 10, padding: '16px 20px', border: `1px solid ${T.border}`, minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.text, fontFamily: T.mono, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function NarrativeIntelligencePage() {
  const [tab, setTab] = useState(0);
  const [currentStage, setCurrentStage] = useState(5);
  const [equivType, setEquivType] = useState('tCO2e');
  const [equivAmount, setEquivAmount] = useState('125000');
  const [msgHierarchy, setMsgHierarchy] = useState({ core: '', s1: '', s2: '', s3: '' });
  const [selectedAudience, setSelectedAudience] = useState(null);

  const equivResults = useMemo(() => {
    const amt = parseFloat(equivAmount);
    if (!amt || amt <= 0) return [];
    const equivs = EQUIVALENTS[equivType] || [];
    return equivs.map(e => ({
      ...e,
      result: (amt * e.factor),
      display: `${(amt * e.factor).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${e.unit}`
    }));
  }, [equivType, equivAmount]);

  const toneChartData = useMemo(() => TONE_SECTIONS.map(t => ({
    section: t.section,
    Inspirational: t.weight.inspirational,
    Accountable: t.weight.accountable,
    Formal: t.weight.formal,
    Transparent: t.weight.transparent,
    Empathetic: t.weight.empathetic,
  })), []);

  const avgExcerptQuality = useMemo(() => {
    const len = REPORT_EXCERPTS.length;
    return len > 0 ? Math.round(REPORT_EXCERPTS.reduce((s, e) => s + e.quality, 0) / len) : 0;
  }, []);

  const sty = {
    page: { fontFamily: T.font, background: T.surface, minHeight: '100vh', padding: 24, color: T.text },
    header: { marginBottom: 20 },
    title: { fontSize: 22, fontWeight: 700, color: T.navy },
    subtitle: { fontSize: 13, color: T.sub, marginTop: 4 },
    tabs: { display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 },
    tab: (a) => ({ padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: a ? 700 : 500, cursor: 'pointer', background: a ? T.navy : 'transparent', color: a ? '#fff' : T.sub, border: 'none', fontFamily: T.font }),
    kpiRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
    grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 },
    card: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 },
    cardTitle: { fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
    th: { textAlign: 'left', padding: '8px 10px', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 11, color: T.sub },
    td: { padding: '8px 10px', borderBottom: `1px solid ${T.border}` },
    select: { padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font },
    badge: (c) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, color: '#fff', background: c }),
    input: { padding: '8px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, width: '100%' },
    textarea: { width: '100%', minHeight: 60, padding: 10, borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, resize: 'vertical' },
    stageCard: (active) => ({ background: active ? T.navy : T.card, color: active ? '#fff' : T.text, border: `1px solid ${active ? T.navy : T.border}`, borderRadius: 10, padding: 16, cursor: 'pointer', transition: 'all 0.2s' }),
  };

  return (
    <div style={sty.page}>
      <div style={sty.header}>
        <div style={sty.title}>Narrative Intelligence Studio</div>
        <div style={sty.subtitle}>Storytelling, tone, and narrative architecture -- Hero's Journey, 6 stakeholder journeys, tone spectrum, relatable equivalents</div>
      </div>

      <div style={sty.tabs}>
        {TABS.map((t, i) => <button key={t} style={sty.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {/* ── TAB 0: Narrative Dashboard ── */}
      {tab === 0 && (<div>
        <div style={sty.kpiRow}>
          <KpiCard label="Journey Stages" value={HEROS_JOURNEY.length} sub="Hero's Journey model" color={T.indigo} />
          <KpiCard label="Stakeholder Arcs" value={STAKEHOLDER_JOURNEYS.length} sub="Audience-specific" color={T.blue} />
          <KpiCard label="Tone Sections" value={TONE_SECTIONS.length} sub="Section-by-section" color={T.purple} />
          <KpiCard label="Current Stage" value={currentStage} sub={HEROS_JOURNEY[currentStage - 1]?.name} color={T.green} />
          <KpiCard label="Report Excerpts" value={REPORT_EXCERPTS.length} sub={`Avg quality: ${avgExcerptQuality}%`} color={T.teal} />
        </div>
        <div style={sty.grid2}>
          <div style={sty.card}>
            <div style={sty.cardTitle}>Story Arc Progress</div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={HEROS_JOURNEY.map((h, i) => ({ stage: `S${h.stage}`, intensity: Math.round(20 + sr(i * 17 + 500) * 40 + (h.stage >= 7 && h.stage <= 9 ? 30 : 0)), current: h.stage === currentStage ? 100 : 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="stage" fontSize={10} />
                <YAxis domain={[0, 100]} fontSize={10} />
                <Tooltip />
                <Area type="monotone" dataKey="intensity" name="Narrative Intensity" stroke={T.indigo} fill={T.indigo} fillOpacity={0.2} />
                <ReferenceLine x={`S${currentStage}`} stroke={T.red} strokeWidth={2} label="Current" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={sty.card}>
            <div style={sty.cardTitle}>Tone Balance Across Report</div>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={Object.keys(TONE_SECTIONS[0].weight).map(tone => {
                const avg = TONE_SECTIONS.length > 0 ? Math.round(TONE_SECTIONS.reduce((s, t) => s + (t.weight[tone] || 0), 0) / TONE_SECTIONS.length) : 0;
                return { tone: tone.charAt(0).toUpperCase() + tone.slice(1), value: avg };
              })}>
                <PolarGrid />
                <PolarAngleAxis dataKey="tone" fontSize={10} />
                <PolarRadiusAxis domain={[0, 50]} fontSize={9} />
                <Radar name="Balance" dataKey="value" stroke={T.purple} fill={T.purple} fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Component Mix Summary</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={COMPONENT_MIX}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="section" fontSize={10} angle={-15} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} fontSize={10} />
              <Tooltip />
              <Legend />
              <Bar dataKey="data" name="Data %" stackId="a" fill={T.blue} />
              <Bar dataKey="narrative" name="Narrative %" stackId="a" fill={T.green} />
              <Bar dataKey="visual" name="Visual %" stackId="a" fill={T.gold} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>)}

      {/* ── TAB 1: Hero's Journey Mapper ── */}
      {tab === 1 && (<div>
        <div style={{ fontSize: 13, color: T.sub, marginBottom: 16 }}>Click a stage to set your current position in the sustainability journey.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {HEROS_JOURNEY.map(h => (
            <div key={h.stage} style={sty.stageCard(h.stage === currentStage)} onClick={() => setCurrentStage(h.stage)}>
              <div style={{ fontSize: 11, fontFamily: T.mono, marginBottom: 4, opacity: 0.7 }}>Stage {h.stage}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{h.name}</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 6 }}>{h.desc}</div>
              <div style={{ fontSize: 11, fontWeight: 600, borderTop: `1px solid ${h.stage === currentStage ? 'rgba(255,255,255,0.3)' : T.border}`, paddingTop: 6, marginTop: 4 }}>
                {h.sustainability}
              </div>
            </div>
          ))}
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Journey Intensity Curve</div>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={HEROS_JOURNEY.map((h, i) => ({ name: h.name.split(' ').slice(1, 3).join(' '), stage: h.stage, tension: Math.round(10 + (h.stage <= 3 ? h.stage * 15 : h.stage <= 8 ? 45 + (h.stage - 3) * 10 : 95 - (h.stage - 8) * 15) + sr(i * 13) * 10) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" fontSize={9} angle={-20} textAnchor="end" height={70} />
              <YAxis domain={[0, 100]} fontSize={10} />
              <Tooltip />
              <Area type="monotone" dataKey="tension" name="Narrative Tension" stroke={T.red} fill={T.red} fillOpacity={0.15} />
              <Line type="monotone" dataKey="tension" stroke={T.red} strokeWidth={2} dot={{ fill: T.red }} />
              <ReferenceLine x={HEROS_JOURNEY[currentStage - 1]?.name.split(' ').slice(1, 3).join(' ')} stroke={T.navy} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>)}

      {/* ── TAB 2: Stakeholder Journeys ── */}
      {tab === 2 && (<div>
        <div style={sty.grid3}>
          {STAKEHOLDER_JOURNEYS.map((sj, i) => (
            <div key={i} style={{ ...sty.card, borderLeft: `4px solid ${sj.color}`, cursor: 'pointer', background: selectedAudience === i ? '#f5f3ee' : T.card }} onClick={() => setSelectedAudience(selectedAudience === i ? null : i)}>
              <div style={{ fontSize: 16, fontWeight: 700, color: sj.color, marginBottom: 8 }}>{sj.audience}</div>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Tone: {sj.tone}</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Priorities:</div>
                {sj.priorities.map((p, pi) => <div key={pi} style={{ fontSize: 12, padding: '2px 0' }}>{pi + 1}. {p}</div>)}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Key Messages:</div>
                {sj.keyMessages.map((m, mi) => <div key={mi} style={{ fontSize: 12, padding: '2px 0', fontStyle: 'italic' }}>"{m}"</div>)}
              </div>
            </div>
          ))}
        </div>
        {selectedAudience !== null && (
          <div style={sty.card}>
            <div style={sty.cardTitle}>{STAKEHOLDER_JOURNEYS[selectedAudience].audience} Narrative Arc</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={['Awareness','Interest','Consideration','Commitment','Advocacy'].map((stage, si) => ({ stage, engagement: Math.round(20 + si * 18 + sr(selectedAudience * 50 + si * 13) * 10) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="stage" fontSize={11} />
                <YAxis domain={[0, 100]} fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="engagement" stroke={STAKEHOLDER_JOURNEYS[selectedAudience].color} strokeWidth={3} dot={{ r: 5, fill: STAKEHOLDER_JOURNEYS[selectedAudience].color }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>)}

      {/* ── TAB 3: Tone Spectrum ── */}
      {tab === 3 && (<div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Tone Weights by Report Section</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={toneChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="section" fontSize={10} angle={-15} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} fontSize={10} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Inspirational" stackId="a" fill="#8b5cf6" />
              <Bar dataKey="Accountable" stackId="a" fill="#3b82f6" />
              <Bar dataKey="Formal" stackId="a" fill="#6b7280" />
              <Bar dataKey="Transparent" stackId="a" fill="#06b6d4" />
              <Bar dataKey="Empathetic" stackId="a" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ ...sty.card, marginTop: 16 }}>
          <div style={sty.cardTitle}>Section Tone Detail</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Section</th><th style={sty.th}>Primary Tones</th><th style={sty.th}>Inspirational</th><th style={sty.th}>Accountable</th><th style={sty.th}>Formal</th><th style={sty.th}>Transparent</th><th style={sty.th}>Empathetic</th></tr></thead>
            <tbody>
              {TONE_SECTIONS.map((t, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : T.card }}>
                  <td style={sty.td}><strong>{t.section}</strong></td>
                  <td style={sty.td}>{t.tones.join(', ')}</td>
                  <td style={sty.td}>{t.weight.inspirational}%</td>
                  <td style={sty.td}>{t.weight.accountable}%</td>
                  <td style={sty.td}>{t.weight.formal}%</td>
                  <td style={sty.td}>{t.weight.transparent}%</td>
                  <td style={sty.td}>{t.weight.empathetic}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>)}

      {/* ── TAB 4: Relatable Equivalents ── */}
      {tab === 4 && (<div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Convert Sustainability Metrics to Relatable Equivalents</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <input style={{ ...sty.input, maxWidth: 200 }} type="number" value={equivAmount} onChange={e => setEquivAmount(e.target.value)} placeholder="Amount" />
            <select style={sty.select} value={equivType} onChange={e => setEquivType(e.target.value)}>
              <option value="tCO2e">tCO2e</option>
              <option value="MWh">MWh</option>
              <option value="m3">m3 (water)</option>
            </select>
          </div>
          {equivResults.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280, 1fr))', gap: 12 }}>
              {equivResults.map((eq, i) => (
                <div key={i} style={{ background: '#f5f3ee', borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{eq.result.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  <div style={{ fontSize: 13, color: T.text, marginTop: 4 }}>{eq.unit}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 6 }}>= {parseFloat(equivAmount).toLocaleString()} {equivType}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>)}

      {/* ── TAB 5: Message Hierarchy Builder ── */}
      {tab === 5 && (<div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Message Hierarchy Builder</div>
          <div style={{ fontSize: 13, color: T.sub, marginBottom: 16 }}>Build a consistent message hierarchy: Core message flows down into 3 supporting messages.</div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.indigo, marginBottom: 6 }}>Core Message</div>
            <textarea style={sty.textarea} value={msgHierarchy.core} onChange={e => setMsgHierarchy(p => ({ ...p, core: e.target.value }))} placeholder="e.g. 'We are building a resilient, net-zero business that creates value for all stakeholders.'" />
          </div>
          {['s1', 's2', 's3'].map((key, i) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.blue, marginBottom: 6 }}>Supporting Message {i + 1}</div>
              <textarea style={sty.textarea} value={msgHierarchy[key]} onChange={e => setMsgHierarchy(p => ({ ...p, [key]: e.target.value }))} placeholder={['Environmental stewardship and emissions reduction', 'Social responsibility and workforce development', 'Governance excellence and transparency'][i]} />
            </div>
          ))}
          {msgHierarchy.core && (
            <div style={{ marginTop: 16, padding: 16, background: '#f5f3ee', borderRadius: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Consistency Check</div>
              <div style={{ fontSize: 12, color: T.text }}>
                Core message length: {msgHierarchy.core.length} chars {msgHierarchy.core.length > 150 ? '(consider shortening)' : '(good length)'}<br />
                Supporting messages: {[msgHierarchy.s1, msgHierarchy.s2, msgHierarchy.s3].filter(Boolean).length}/3 defined<br />
                Estimated reading level: {msgHierarchy.core.split(' ').length > 20 ? 'Complex (simplify for broader audience)' : 'Accessible'}
              </div>
            </div>
          )}
        </div>
      </div>)}

      {/* ── TAB 6: Report Excerpts Library ── */}
      {tab === 6 && (<div>
        <div style={sty.kpiRow}>
          <KpiCard label="Excerpts" value={REPORT_EXCERPTS.length} sub="Real-world examples" color={T.indigo} />
          <KpiCard label="Avg Quality" value={`${avgExcerptQuality}%`} color={avgExcerptQuality > 80 ? T.green : T.amber} />
          <KpiCard label="Best Practice" value={REPORT_EXCERPTS.reduce((best, e) => e.quality > best.quality ? e : best, REPORT_EXCERPTS[0]).company} color={T.green} />
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Report Excerpt Examples</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Company</th><th style={sty.th}>Year</th><th style={sty.th}>Section</th><th style={sty.th}>Type</th><th style={sty.th}>Tone</th><th style={sty.th}>Key Takeaway</th><th style={sty.th}>Quality</th></tr></thead>
            <tbody>
              {REPORT_EXCERPTS.map((e, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : T.card }}>
                  <td style={sty.td}><strong>{e.company}</strong></td>
                  <td style={sty.td}>{e.year}</td>
                  <td style={sty.td}>{e.section}</td>
                  <td style={sty.td}><span style={sty.badge(e.type === 'Data' ? T.blue : e.type === 'Narrative' ? T.green : T.purple)}>{e.type}</span></td>
                  <td style={sty.td}>{e.tone}</td>
                  <td style={{ ...sty.td, maxWidth: 300 }}>{e.keyTakeaway}</td>
                  <td style={sty.td}><span style={sty.badge(e.quality > 90 ? T.green : e.quality > 75 ? T.blue : T.amber)}>{e.quality}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ ...sty.card, marginTop: 16 }}>
          <div style={sty.cardTitle}>Quality Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={REPORT_EXCERPTS.map(e => ({ company: e.company, quality: e.quality }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="company" fontSize={10} angle={-20} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} fontSize={10} />
              <Tooltip />
              <Bar dataKey="quality" name="Quality Score">{REPORT_EXCERPTS.map((e, i) => <Cell key={i} fill={e.quality > 90 ? T.green : e.quality > 75 ? T.blue : T.amber} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>)}

      {/* ── TAB 7: Component Mix Analyzer ── */}
      {tab === 7 && (<div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Data / Narrative / Visual Ratio by Section</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={COMPONENT_MIX}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="section" fontSize={10} angle={-15} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} fontSize={10} />
              <Tooltip />
              <Legend />
              <Bar dataKey="data" name="Data %" stackId="current" fill={T.blue} />
              <Bar dataKey="narrative" name="Narrative %" stackId="current" fill={T.green} />
              <Bar dataKey="visual" name="Visual %" stackId="current" fill={T.gold} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ ...sty.card, marginTop: 16 }}>
          <div style={sty.cardTitle}>Current vs Best-Practice Comparison</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Section</th><th style={sty.th}>Data %</th><th style={sty.th}>Best Data %</th><th style={sty.th}>Narrative %</th><th style={sty.th}>Best Narrative %</th><th style={sty.th}>Visual %</th><th style={sty.th}>Best Visual %</th><th style={sty.th}>Gap</th></tr></thead>
            <tbody>
              {COMPONENT_MIX.map((c, i) => {
                const gap = Math.abs(c.data - c.bestData) + Math.abs(c.narrative - c.bestNarrative) + Math.abs(c.visual - c.bestVisual);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fafaf7' : T.card }}>
                    <td style={sty.td}><strong>{c.section}</strong></td>
                    <td style={sty.td}>{c.data}%</td>
                    <td style={sty.td}>{c.bestData}%</td>
                    <td style={sty.td}>{c.narrative}%</td>
                    <td style={sty.td}>{c.bestNarrative}%</td>
                    <td style={sty.td}>{c.visual}%</td>
                    <td style={sty.td}>{c.bestVisual}%</td>
                    <td style={sty.td}><span style={sty.badge(gap <= 10 ? T.green : gap <= 20 ? '#d97706' : T.red)}>{gap}pp</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>)}
    </div>
  );
}
