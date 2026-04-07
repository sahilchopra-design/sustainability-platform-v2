import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, ComposedChart, Area,
  ResponsiveContainer, Cell,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const FRAMEWORKS = ['TCFD', 'IFRS_S1', 'IFRS_S2', 'ESRS_E1', 'ESRS_E2', 'ESRS_E3', 'ESRS_E4', 'ESRS_E5', 'GRI_305', 'CDP', 'SASB', 'UK_TCFD'];
const FRAMEWORK_LABELS = { TCFD: 'TCFD', IFRS_S1: 'IFRS S1', IFRS_S2: 'IFRS S2', ESRS_E1: 'ESRS E1', ESRS_E2: 'ESRS E2', ESRS_E3: 'ESRS E3', ESRS_E4: 'ESRS E4', ESRS_E5: 'ESRS E5', GRI_305: 'GRI 305', CDP: 'CDP', SASB: 'SASB', UK_TCFD: 'UK TCFD' };
const SECTORS = ['Energy', 'Utilities', 'Materials', 'Financials', 'Industrials', 'Consumer Staples', 'Real Estate', 'Transport', 'Agriculture', 'Technology', 'Healthcare', 'Services'];
const JURISDICTIONS = ['USA', 'UK', 'EU', 'Germany', 'France', 'Australia', 'Canada', 'Japan', 'Netherlands', 'Switzerland', 'Ireland', 'Singapore'];
const REPORT_TYPES = ['Standalone', 'Integrated', 'Proxy', 'Form10K'];
const ASSURANCE_LEVELS = ['None', 'Limited', 'Reasonable'];

// Which frameworks are mandatory per jurisdiction
const JUR_MANDATORY = {
  UK: ['TCFD', 'UK_TCFD', 'GRI_305'],
  EU: ['ESRS_E1', 'ESRS_E2', 'ESRS_E3', 'ESRS_E4', 'ESRS_E5', 'TCFD'],
  Germany: ['ESRS_E1', 'ESRS_E2', 'ESRS_E3', 'ESRS_E4', 'ESRS_E5'],
  France: ['ESRS_E1', 'ESRS_E2', 'TCFD', 'GRI_305'],
  USA: ['TCFD', 'SASB', 'CDP', 'GRI_305'],
  Australia: ['TCFD', 'UK_TCFD', 'SASB'],
  Canada: ['TCFD', 'IFRS_S1', 'IFRS_S2', 'SASB'],
  Japan: ['TCFD', 'IFRS_S1', 'IFRS_S2'],
  Netherlands: ['ESRS_E1', 'ESRS_E2', 'TCFD'],
  Switzerland: ['TCFD', 'IFRS_S1', 'IFRS_S2'],
  Ireland: ['ESRS_E1', 'ESRS_E2', 'TCFD'],
  Singapore: ['TCFD', 'IFRS_S1', 'IFRS_S2', 'SASB'],
};

const IMPROVEMENT_TIPS = {
  TCFD: 'Add scenario analysis covering 1.5°C, 2°C, and 3°C+ pathways with quantitative financial impact.',
  IFRS_S1: 'Disclose all significant sustainability-related risks and opportunities with financial materiality assessments.',
  IFRS_S2: 'Include Scope 1-3 emissions, transition plans with interim milestones, and physical risk quantification.',
  ESRS_E1: 'Complete all E1 disclosure requirements including GHG inventory, climate targets, and transition plan financing.',
  ESRS_E2: 'Disclose pollution sources, targets, and monitoring metrics per ESRS E2 requirements.',
  ESRS_E3: 'Report water consumption, withdrawal, and stress exposure per ESRS E3 framework.',
  ESRS_E4: 'Assess biodiversity impacts and dependencies, disclosing material sites and TNFD alignment.',
  ESRS_E5: 'Report circular economy metrics including resource flows, waste, and circularity KPIs.',
  GRI_305: 'Report Scope 1, 2, and 3 emissions with GHG intensity metrics against base year.',
  CDP: 'Submit complete CDP questionnaire covering governance, strategy, risk management, and targets.',
  SASB: 'Apply sector-specific SASB standards with quantitative metrics for each material topic.',
  UK_TCFD: 'Meet all UK TCFD mandatory reporting requirements including quantified scenario analysis.',
};

const ENTITY_NAMES = Array.from({ length: 180 }, (_, i) => {
  const corps = ['Apex Corp', 'GlobalCo', 'TerraPlc', 'InvestFirst', 'CapitalSE', 'AssetMgmt', 'PrimeFund', 'ClearCo', 'TrustFirst', 'NovaCorp', 'MarketAG', 'VentureLtd', 'EquityInc', 'FundPrime', 'PortfolioGrp', 'AlphaHoldings', 'BetaPartners', 'GammaTrust', 'DeltaCo', 'EpsilonSE'];
  return `${corps[i % corps.length]} ${Math.floor(i / corps.length) > 0 ? String.fromCharCode(65 + (Math.floor(i / corps.length) - 1) % 26) : ''}`.trim();
});

const ENTITIES = Array.from({ length: 180 }, (_, i) => {
  const sectorIdx = Math.floor(sr(i * 7) * 12);
  const jurIdx = Math.floor(sr(i * 11) * 12);
  const jur = JURISDICTIONS[jurIdx];
  const reportTypeIdx = Math.floor(sr(i * 13) * 4);
  const assuranceIdx = Math.floor(sr(i * 17) * 3);
  const assuranceLevel = ASSURANCE_LEVELS[assuranceIdx];
  const assuranceMult = assuranceIdx === 2 ? 1.2 : assuranceIdx === 1 ? 1.1 : 1.0;
  const frameworkScores = {};
  FRAMEWORKS.forEach((f, fi) => {
    frameworkScores[f] = Math.round(sr(i * 19 + fi * 100) * 90 + 5) * assuranceMult;
    frameworkScores[f] = Math.min(100, Math.round(frameworkScores[f]));
  });
  const overallScore = Math.round(FRAMEWORKS.reduce((s, f) => s + frameworkScores[f], 0) / FRAMEWORKS.length);
  const gapCount = FRAMEWORKS.filter(f => frameworkScores[f] < 50).length;
  const mandatory = JUR_MANDATORY[jur] || ['TCFD'];
  const mandatoryGap = mandatory.filter(f => frameworkScores[f] < 60).length;
  const marketCapB = +(sr(i * 23) * 200 + 0.5).toFixed(1);
  const dataQualityScore = Math.round(sr(i * 29) * 70 + 25);
  const peerRank = i + 1;
  const disclosureYear = 2021 + Math.floor(sr(i * 31) * 3);
  const trajectory3yr = +(sr(i * 37) * 20 - 5).toFixed(1);
  return {
    id: i + 1,
    name: ENTITY_NAMES[i] || `Entity ${i + 1}`,
    sector: SECTORS[sectorIdx],
    jurisdiction: jur,
    marketCapB,
    frameworkScores,
    overallScore,
    peerRank,
    disclosureYear,
    reportType: REPORT_TYPES[reportTypeIdx],
    assuranceLevel,
    dataQualityScore,
    gapCount,
    mandatoryGap,
    materialityAssessed: sr(i * 41) > 0.4,
    doubleMaterialityDone: sr(i * 43) > 0.55,
    quantitativeTargets: sr(i * 47) > 0.35,
    forwardLookingScenarios: sr(i * 53) > 0.5,
    thirdPartyVerified: assuranceIdx > 0,
    trajectory3yr,
  };
});

const fmtPct = v => `${v.toFixed(0)}%`;
const scoreColor = s => s >= 70 ? T.green : s >= 40 ? T.amber : T.red;

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>{sub}</div>}
  </div>
);

const ScoreBadge = ({ val }) => (
  <span style={{ background: scoreColor(val) + '18', color: scoreColor(val), border: `1px solid ${scoreColor(val)}40`, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{val}</span>
);

const MiniBar = ({ val, max = 100 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
    <div style={{ width: 50, height: 6, background: T.border, borderRadius: 3 }}>
      <div style={{ height: 6, width: `${Math.min(100, val / max * 100)}%`, background: scoreColor(val), borderRadius: 3 }} />
    </div>
    <span style={{ fontSize: 10, color: scoreColor(val), fontWeight: 600 }}>{val}</span>
  </div>
);

const TABS = ['Disclosure Dashboard', 'Entity Database', 'Framework Deep Dive', 'Peer Benchmarking', 'Mandatory Requirements', 'Assurance & Quality', 'Summary & Export'];

export default function DisclosureAdequacyAnalyzerPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [jurFilter, setJurFilter] = useState('All');
  const [frameworkFilter, setFrameworkFilter] = useState([]);
  const [assuranceFilter, setAssuranceFilter] = useState('All');
  const [scoreMin, setScoreMin] = useState(0);
  const [reportTypeFilter, setReportTypeFilter] = useState('All');
  const [gapFilter, setGapFilter] = useState(12);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('overallScore');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [compareMode, setCompareMode] = useState(false);

  const filtered = useMemo(() => {
    if (!ENTITIES.length) return [];
    let arr = [...ENTITIES];
    if (sectorFilter !== 'All') arr = arr.filter(e => e.sector === sectorFilter);
    if (jurFilter !== 'All') arr = arr.filter(e => e.jurisdiction === jurFilter);
    if (assuranceFilter !== 'All') arr = arr.filter(e => e.assuranceLevel === assuranceFilter);
    if (reportTypeFilter !== 'All') arr = arr.filter(e => e.reportType === reportTypeFilter);
    if (frameworkFilter.length > 0) arr = arr.filter(e => frameworkFilter.every(f => e.frameworkScores[f] >= 50));
    if (search) arr = arr.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
    arr = arr.filter(e => e.overallScore >= scoreMin && e.gapCount <= gapFilter);
    return [...arr].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [sectorFilter, jurFilter, frameworkFilter, assuranceFilter, scoreMin, reportTypeFilter, gapFilter, search, sortCol, sortDir]);

  const avgScore = filtered.length ? (filtered.reduce((s, e) => s + e.overallScore, 0) / filtered.length).toFixed(1) : '0';

  const scoreDist = useMemo(() => [
    [0, 25], [25, 50], [50, 70], [70, 85], [85, 100]
  ].map(([lo, hi]) => ({
    range: `${lo}-${hi}`,
    count: filtered.filter(e => e.overallScore >= lo && e.overallScore < hi).length,
  })), [filtered]);

  const frameworkCoverage = useMemo(() => FRAMEWORKS.map(f => ({
    framework: FRAMEWORK_LABELS[f],
    avgScore: filtered.length ? Math.round(filtered.reduce((s, e) => s + e.frameworkScores[f], 0) / filtered.length) : 0,
    above70: filtered.filter(e => e.frameworkScores[f] >= 70).length,
    below50: filtered.filter(e => e.frameworkScores[f] < 50).length,
  })), [filtered]);

  const sectorLeaders = useMemo(() => SECTORS.map(s => {
    const ents = filtered.filter(e => e.sector === s);
    if (!ents.length) return null;
    const sorted = [...ents].sort((a, b) => b.overallScore - a.overallScore);
    return { sector: s, count: ents.length, avgScore: Math.round(ents.reduce((a, e) => a + e.overallScore, 0) / ents.length), leader: sorted[0]?.name, laggard: sorted[sorted.length - 1]?.name };
  }).filter(Boolean).sort((a, b) => b.avgScore - a.avgScore), [filtered]);

  const jurMandatoryMatrix = useMemo(() => JURISDICTIONS.map(jur => {
    const mandatoryFwks = JUR_MANDATORY[jur] || [];
    const ents = ENTITIES.filter(e => e.jurisdiction === jur);
    const complianceScores = mandatoryFwks.map(f => {
      const avg = ents.length ? ents.reduce((s, e) => s + e.frameworkScores[f], 0) / ents.length : 0;
      return { framework: FRAMEWORK_LABELS[f], score: Math.round(avg) };
    });
    return { jur, mandatoryCount: mandatoryFwks.length, entityCount: ents.length, avgGap: ents.length ? Math.round(ents.reduce((s, e) => s + e.mandatoryGap, 0) / ents.length) : 0, complianceScores };
  }), []);

  const drillEntity = selectedEntity;

  const radarData = useMemo(() => {
    if (!drillEntity) return [];
    return FRAMEWORKS.map(f => ({ subject: FRAMEWORK_LABELS[f], score: drillEntity.frameworkScores[f], fullMark: 100 }));
  }, [drillEntity]);

  const compareRadarData = useMemo(() => {
    if (!compareA || !compareB) return [];
    return FRAMEWORKS.map(f => ({ subject: FRAMEWORK_LABELS[f], a: compareA.frameworkScores[f], b: compareB.frameworkScores[f], fullMark: 100 }));
  }, [compareA, compareB]);

  const handleSort = useCallback(col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }, [sortCol]);

  const toggleFramework = useCallback(f => {
    setFrameworkFilter(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }, []);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ background: T.blue, borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>EP</div>
            <div>
              <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1, textTransform: 'uppercase' }}>EP-DA3 · Disclosure & Stranded Asset Analytics</div>
              <h1 style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>Disclosure Adequacy Analyzer</h1>
            </div>
          </div>
          <div style={{ fontSize: 12, color: T.muted }}>180 entities · 12 disclosure frameworks · jurisdiction mandatory matrix · assurance-adjusted scoring · peer benchmarking</div>
        </div>

        <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: `2px solid ${T.border}`, overflowX: 'auto', paddingBottom: 1 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)} style={{ padding: '8px 14px', border: 'none', background: activeTab === i ? T.blue : 'transparent', color: activeTab === i ? '#fff' : T.muted, borderRadius: '6px 6px 0 0', cursor: 'pointer', fontWeight: activeTab === i ? 600 : 400, fontSize: 12, whiteSpace: 'nowrap' }}>{t}</button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Search</div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Entity name..." style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12, width: 140 }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Sector</div>
            <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Jurisdiction</div>
            <select value={jurFilter} onChange={e => setJurFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {JURISDICTIONS.map(j => <option key={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Assurance</div>
            <select value={assuranceFilter} onChange={e => setAssuranceFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {ASSURANCE_LEVELS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Report Type</div>
            <select value={reportTypeFilter} onChange={e => setReportTypeFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {REPORT_TYPES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Min Score: {scoreMin}</div>
            <input type="range" min={0} max={90} value={scoreMin} onChange={e => setScoreMin(+e.target.value)} style={{ width: 90 }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Max Gaps: {gapFilter}</div>
            <input type="range" min={0} max={12} value={gapFilter} onChange={e => setGapFilter(+e.target.value)} style={{ width: 90 }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={compareMode} onChange={e => setCompareMode(e.target.checked)} />Compare Mode
          </label>
          <div style={{ fontSize: 11, color: T.muted, marginLeft: 'auto' }}>{filtered.length}/{ENTITIES.length}</div>
        </div>

        {/* Framework filter chips */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: T.muted, marginRight: 4 }}>FRAMEWORK FILTER:</span>
          {FRAMEWORKS.map(f => (
            <button key={f} onClick={() => toggleFramework(f)} style={{ padding: '2px 9px', fontSize: 10, border: `1px solid ${frameworkFilter.includes(f) ? T.blue : T.border}`, borderRadius: 10, background: frameworkFilter.includes(f) ? T.blue + '18' : 'transparent', color: frameworkFilter.includes(f) ? T.blue : T.muted, cursor: 'pointer' }}>
              {FRAMEWORK_LABELS[f]}
            </button>
          ))}
          {frameworkFilter.length > 0 && <button onClick={() => setFrameworkFilter([])} style={{ padding: '2px 8px', fontSize: 10, border: `1px solid ${T.red}`, borderRadius: 10, background: T.red + '15', color: T.red, cursor: 'pointer' }}>Clear</button>}
        </div>

        {/* Compare Mode Panel */}
        {compareMode && (
          <div style={{ background: T.card, border: `2px solid ${T.blue}`, borderRadius: 8, padding: 14, marginBottom: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Side-by-Side Framework Comparison</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              {[['A', compareA, setCompareA], ['B', compareB, setCompareB]].map(([lbl, val, setter]) => (
                <div key={lbl} style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Entity {lbl}</div>
                  <select value={val?.id || ''} onChange={e => setter(ENTITIES.find(x => x.id === +e.target.value) || null)} style={{ width: '100%', padding: '5px 8px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
                    <option value="">-- Select --</option>
                    {ENTITIES.slice(0, 60).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {compareA && compareB && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                <div>
                  {[compareA, compareB].map((ent, idx) => (
                    <div key={idx} style={{ background: T.sub, borderRadius: 6, padding: 10, marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>{ent.name}</div>
                      {[['Sector', ent.sector], ['Jurisdiction', ent.jurisdiction], ['Overall Score', ent.overallScore], ['Gaps', ent.gapCount], ['Assurance', ent.assuranceLevel], ['Data Quality', ent.dataQualityScore]].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0', borderBottom: `1px solid ${T.border}` }}>
                          <span style={{ color: T.muted }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={compareRadarData}>
                      <PolarGrid stroke={T.border} />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                      <Radar name={compareA.name} dataKey="a" stroke={T.blue} fill={T.blue} fillOpacity={0.2} />
                      <Radar name={compareB.name} dataKey="b" stroke={T.orange} fill={T.orange} fillOpacity={0.2} />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 0: Disclosure Dashboard ── */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <KpiCard label="Entities Analyzed" value={filtered.length} />
              <KpiCard label="Avg Overall Score" value={`${avgScore}/100`} color={scoreColor(+avgScore)} />
              <KpiCard label="Reasonable Assurance" value={filtered.filter(e => e.assuranceLevel === 'Reasonable').length} color={T.green} />
              <KpiCard label="Avg Gap Count" value={filtered.length ? (filtered.reduce((s, e) => s + e.gapCount, 0) / filtered.length).toFixed(1) : '0'} color={T.red} />
              <KpiCard label="Double Materiality" value={filtered.filter(e => e.doubleMaterialityDone).length} color={T.teal} />
              <KpiCard label="3rd Party Verified" value={filtered.filter(e => e.thirdPartyVerified).length} color={T.blue} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Overall Score Distribution</div>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={scoreDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Entities" radius={[4, 4, 0, 0]}>
                      {scoreDist.map((d, i) => <Cell key={i} fill={i < 2 ? T.red : i < 3 ? T.amber : T.green} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Average Framework Coverage Score</div>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={frameworkCoverage} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="framework" tick={{ fontSize: 9 }} width={60} />
                    <Tooltip />
                    <Bar dataKey="avgScore" name="Avg Score" radius={[0, 4, 4, 0]}>
                      {frameworkCoverage.map((d, i) => <Cell key={i} fill={scoreColor(d.avgScore)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Framework coverage heatmap */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Framework Coverage Heatmap</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 10 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '5px 8px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontSize: 10, color: T.muted }}>Entity</th>
                      {FRAMEWORKS.map(f => <th key={f} style={{ padding: '5px 6px', borderBottom: `2px solid ${T.border}`, fontSize: 9, whiteSpace: 'nowrap', textAlign: 'center' }}>{FRAMEWORK_LABELS[f]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[...filtered].sort((a, b) => b.overallScore - a.overallScore).slice(0, 20).map((e, i) => (
                      <tr key={e.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '4px 8px', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 10 }}>{e.name}</td>
                        {FRAMEWORKS.map(f => (
                          <td key={f} style={{ padding: '4px 6px', textAlign: 'center' }}>
                            <div style={{ width: 28, height: 20, background: scoreColor(e.frameworkScores[f]) + '50', border: `1px solid ${scoreColor(e.frameworkScores[f])}60`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: scoreColor(e.frameworkScores[f]) }}>
                              {e.frameworkScores[f]}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 6, textAlign: 'right' }}>Top 20 entities by overall score</div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 1: Entity Database ── */}
        {activeTab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Entity Database — {filtered.length} records</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {[['name', 'Name'], ['sector', 'Sector'], ['jurisdiction', 'Jur.'], ['overallScore', 'Score'], ['gapCount', 'Gaps'], ['assuranceLevel', 'Assurance'], ['dataQualityScore', 'Data Q.'], ['reportType', 'Report']].map(([col, label]) => (
                      <th key={col} onClick={() => handleSort(col)} style={{ padding: '7px 8px', textAlign: 'left', cursor: 'pointer', borderBottom: `2px solid ${T.border}`, color: sortCol === col ? T.blue : T.text, userSelect: 'none', whiteSpace: 'nowrap' }}>
                        {label} {sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </th>
                    ))}
                    {FRAMEWORKS.slice(0, 6).map(f => <th key={f} style={{ padding: '7px 5px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, fontSize: 9 }}>{FRAMEWORK_LABELS[f]}</th>)}
                    <th style={{ padding: '7px 8px' }}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((e, i) => (
                    <tr key={e.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, whiteSpace: 'nowrap' }}>{e.name}</td>
                      <td style={{ padding: '6px 8px' }}>{e.sector}</td>
                      <td style={{ padding: '6px 8px' }}>{e.jurisdiction}</td>
                      <td style={{ padding: '6px 8px' }}><ScoreBadge val={e.overallScore} /></td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: e.gapCount > 6 ? T.red : T.amber }}>{e.gapCount}</td>
                      <td style={{ padding: '6px 8px' }}>{e.assuranceLevel}</td>
                      <td style={{ padding: '6px 8px' }}><MiniBar val={e.dataQualityScore} /></td>
                      <td style={{ padding: '6px 8px', fontSize: 10 }}>{e.reportType}</td>
                      {FRAMEWORKS.slice(0, 6).map(f => (
                        <td key={f} style={{ padding: '6px 5px', textAlign: 'center' }}>
                          <div style={{ width: 24, height: 18, background: scoreColor(e.frameworkScores[f]) + '40', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: scoreColor(e.frameworkScores[f]) }}>
                            {e.frameworkScores[f]}
                          </div>
                        </td>
                      ))}
                      <td style={{ padding: '6px 8px' }}>
                        <button onClick={() => setSelectedEntity(e)} style={{ background: T.blue, color: '#fff', border: 'none', borderRadius: 3, padding: '2px 7px', fontSize: 10, cursor: 'pointer' }}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 100 && <div style={{ textAlign: 'center', padding: 10, color: T.muted, fontSize: 11 }}>Showing 100 of {filtered.length}</div>}
            </div>
          </div>
        )}

        {/* ── TAB 2: Framework Deep Dive ── */}
        {activeTab === 2 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Select Entity for Deep Dive</div>
              <select value={selectedEntity?.id || ''} onChange={e => setSelectedEntity(ENTITIES.find(x => x.id === +e.target.value) || null)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12, width: 280 }}>
                <option value="">-- Select Entity --</option>
                {ENTITIES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            {drillEntity ? (
              <div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                  <KpiCard label="Overall Score" value={drillEntity.overallScore} color={scoreColor(drillEntity.overallScore)} />
                  <KpiCard label="Framework Gaps" value={drillEntity.gapCount} color={T.red} />
                  <KpiCard label="Assurance" value={drillEntity.assuranceLevel} />
                  <KpiCard label="Data Quality" value={drillEntity.dataQualityScore} color={scoreColor(drillEntity.dataQualityScore)} />
                  <KpiCard label="Mandatory Gap" value={drillEntity.mandatoryGap} color={drillEntity.mandatoryGap > 0 ? T.red : T.green} />
                  <KpiCard label="3yr Trajectory" value={`${drillEntity.trajectory3yr > 0 ? '+' : ''}${drillEntity.trajectory3yr}`} color={drillEntity.trajectory3yr > 0 ? T.green : T.red} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                    <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Framework Scores — Radar</div>
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke={T.border} />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                        <Radar name="Score" dataKey="score" stroke={T.blue} fill={T.blue} fillOpacity={0.3} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                    <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Gap Analysis & Recommendations</div>
                    <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                      {FRAMEWORKS.map(f => {
                        const score = drillEntity.frameworkScores[f];
                        const isGap = score < 70;
                        return (
                          <div key={f} style={{ marginBottom: 10, padding: 10, background: isGap ? T.red + '08' : T.green + '08', borderRadius: 6, border: `1px solid ${isGap ? T.red : T.green}20` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, fontSize: 12 }}>{FRAMEWORK_LABELS[f]}</span>
                              <ScoreBadge val={score} />
                            </div>
                            {isGap && <div style={{ fontSize: 11, color: T.muted }}>{IMPROVEMENT_TIPS[f]}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 40, textAlign: 'center', color: T.muted }}>
                Select an entity above to view detailed framework scores and improvement recommendations.
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: Peer Benchmarking ── */}
        {activeTab === 3 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Percentile Ranking (Top 25)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[...filtered].sort((a, b) => b.overallScore - a.overallScore).slice(0, 25).map((e, i) => ({ name: e.name.split(' ')[0], score: e.overallScore, pct: Math.round((1 - i / filtered.length) * 100) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" height={45} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="score" name="Score" radius={[4, 4, 0, 0]}>
                      {[...filtered].sort((a, b) => b.overallScore - a.overallScore).slice(0, 25).map((e, i) => <Cell key={i} fill={scoreColor(e.overallScore)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Sector Leaders & Laggards</div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {sectorLeaders.map(s => (
                    <div key={s.sector} style={{ background: T.sub, borderRadius: 6, padding: 8, marginBottom: 7 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{s.sector}</div>
                      <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: T.muted }}>Avg Score</div>
                          <ScoreBadge val={s.avgScore} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: T.muted }}>Leader</div>
                          <div style={{ fontWeight: 600, color: T.green, fontSize: 10 }}>{s.leader}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: T.muted }}>Laggard</div>
                          <div style={{ fontWeight: 600, color: T.red, fontSize: 10 }}>{s.laggard}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Average Disclosure Score by Sector</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sectorLeaders}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={45} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="avgScore" name="Avg Score" radius={[4, 4, 0, 0]}>
                    {sectorLeaders.map((s, i) => <Cell key={i} fill={scoreColor(s.avgScore)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── TAB 4: Mandatory Requirements ── */}
        {activeTab === 4 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Jurisdiction × Framework Mandatory Compliance Matrix</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 10 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>Jurisdiction</th>
                      <th style={{ padding: '6px 8px', borderBottom: `2px solid ${T.border}` }}>Entities</th>
                      <th style={{ padding: '6px 8px', borderBottom: `2px solid ${T.border}` }}>Mandatory Fwks</th>
                      <th style={{ padding: '6px 8px', borderBottom: `2px solid ${T.border}` }}>Avg Gap</th>
                      {FRAMEWORKS.map(f => <th key={f} style={{ padding: '6px 5px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', fontSize: 9 }}>{FRAMEWORK_LABELS[f]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {jurMandatoryMatrix.map((jd, i) => (
                      <tr key={jd.jur} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '5px 10px', fontWeight: 600 }}>{jd.jur}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>{jd.entityCount}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>{jd.mandatoryCount}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 600, color: jd.avgGap > 2 ? T.red : T.green }}>{jd.avgGap}</td>
                        {FRAMEWORKS.map(f => {
                          const mandatory = (JUR_MANDATORY[jd.jur] || []).includes(f);
                          const sc = jd.complianceScores.find(c => c.framework === FRAMEWORK_LABELS[f]);
                          return (
                            <td key={f} style={{ padding: '5px 5px', textAlign: 'center' }}>
                              {mandatory ? (
                                <div style={{ width: 28, height: 18, background: sc ? scoreColor(sc.score) + '40' : T.border, border: `1px solid ${sc ? scoreColor(sc.score) : T.border}`, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 600, color: sc ? scoreColor(sc.score) : T.muted }}>
                                  {sc ? sc.score : 'M'}
                                </div>
                              ) : (
                                <div style={{ width: 28, height: 18, background: T.sub, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: T.muted }}>—</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Mandatory Gap Count by Jurisdiction</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={jurMandatoryMatrix.filter(d => d.entityCount > 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="jur" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={45} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="avgGap" name="Avg Mandatory Gaps" fill={T.red} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Mandatory Framework Count by Jurisdiction</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={jurMandatoryMatrix.filter(d => d.entityCount > 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="jur" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={45} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="mandatoryCount" name="Mandatory Frameworks" fill={T.amber} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: Assurance & Quality ── */}
        {activeTab === 5 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              {ASSURANCE_LEVELS.map(lvl => (
                <KpiCard key={lvl} label={`${lvl} Assurance`} value={ENTITIES.filter(e => e.assuranceLevel === lvl).length} color={lvl === 'Reasonable' ? T.green : lvl === 'Limited' ? T.amber : T.red} />
              ))}
              <KpiCard label="3rd Party Verified" value={ENTITIES.filter(e => e.thirdPartyVerified).length} color={T.blue} />
              <KpiCard label="Avg Data Quality" value={ENTITIES.length ? Math.round(ENTITIES.reduce((s, e) => s + e.dataQualityScore, 0) / ENTITIES.length) : 0} color={T.teal} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Assurance Level Distribution</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ASSURANCE_LEVELS.map(lvl => ({ level: lvl, count: filtered.filter(e => e.assuranceLevel === lvl).length, avgScore: (() => { const ents = filtered.filter(e => e.assuranceLevel === lvl); return ents.length ? Math.round(ents.reduce((s, e) => s + e.overallScore, 0) / ents.length) : 0; })() }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="level" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Entities" fill={T.blue} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgScore" name="Avg Score" fill={T.green} radius={[4, 4, 0, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Data Quality Score Distribution</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[[0, 40], [40, 60], [60, 80], [80, 100]].map(([lo, hi]) => ({ range: `${lo}-${hi}`, count: filtered.filter(e => e.dataQualityScore >= lo && e.dataQualityScore < hi).length }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Entities" radius={[4, 4, 0, 0]}>
                      {[[0, 40], [40, 60], [60, 80], [80, 100]].map((_, i) => <Cell key={i} fill={i < 1 ? T.red : i < 2 ? T.amber : i < 3 ? T.teal : T.green} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Materiality & Disclosure Completeness</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                {[['Materiality Assessed', filtered.filter(e => e.materialityAssessed).length], ['Double Materiality', filtered.filter(e => e.doubleMaterialityDone).length], ['Quantitative Targets', filtered.filter(e => e.quantitativeTargets).length], ['Forward-Looking', filtered.filter(e => e.forwardLookingScenarios).length], ['3rd Party Verified', filtered.filter(e => e.thirdPartyVerified).length]].map(([label, count]) => (
                  <div key={label} style={{ background: T.sub, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: T.blue }}>{count}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{label}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>of {filtered.length}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: Summary & Export ── */}
        {activeTab === 6 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
              <KpiCard label="Total Entities" value={ENTITIES.length} />
              <KpiCard label="Frameworks Tracked" value={FRAMEWORKS.length} />
              <KpiCard label="Jurisdictions" value={JURISDICTIONS.length} />
              <KpiCard label="Filtered" value={filtered.length} />
              <KpiCard label="Avg Overall Score" value={avgScore} color={scoreColor(+avgScore)} />
              <KpiCard label="Reasonable Assurance" value={ENTITIES.filter(e => e.assuranceLevel === 'Reasonable').length} color={T.green} />
              <KpiCard label="Avg Gap Count" value={(ENTITIES.reduce((s, e) => s + e.gapCount, 0) / ENTITIES.length).toFixed(1)} color={T.red} />
              <KpiCard label="Double Materiality" value={ENTITIES.filter(e => e.doubleMaterialityDone).length} color={T.teal} />
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Full KPI Table — Top 50 by Overall Score</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['#', 'Name', 'Sector', 'Jur.', 'Score', 'Gaps', 'Assurance', 'Data Q.', 'Materiality', 'DoubleM', 'QuantTgt', 'FwdLook', 'Verified', 'Trajectory'].map(h => <th key={h} style={{ padding: '6px 7px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[...ENTITIES].sort((a, b) => b.overallScore - a.overallScore).slice(0, 50).map((e, i) => (
                      <tr key={e.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '4px 7px' }}>{i + 1}</td>
                        <td style={{ padding: '4px 7px', fontWeight: 600, whiteSpace: 'nowrap' }}>{e.name}</td>
                        <td style={{ padding: '4px 7px' }}>{e.sector}</td>
                        <td style={{ padding: '4px 7px' }}>{e.jurisdiction}</td>
                        <td style={{ padding: '4px 7px' }}><ScoreBadge val={e.overallScore} /></td>
                        <td style={{ padding: '4px 7px', textAlign: 'center', color: e.gapCount > 6 ? T.red : T.amber }}>{e.gapCount}</td>
                        <td style={{ padding: '4px 7px' }}>{e.assuranceLevel}</td>
                        <td style={{ padding: '4px 7px', textAlign: 'center' }}>{e.dataQualityScore}</td>
                        <td style={{ padding: '4px 7px', textAlign: 'center' }}>{e.materialityAssessed ? '✓' : '✗'}</td>
                        <td style={{ padding: '4px 7px', textAlign: 'center' }}>{e.doubleMaterialityDone ? '✓' : '✗'}</td>
                        <td style={{ padding: '4px 7px', textAlign: 'center' }}>{e.quantitativeTargets ? '✓' : '✗'}</td>
                        <td style={{ padding: '4px 7px', textAlign: 'center' }}>{e.forwardLookingScenarios ? '✓' : '✗'}</td>
                        <td style={{ padding: '4px 7px', textAlign: 'center' }}>{e.thirdPartyVerified ? '✓' : '✗'}</td>
                        <td style={{ padding: '4px 7px', color: e.trajectory3yr > 0 ? T.green : T.red, fontWeight: 600 }}>{e.trajectory3yr > 0 ? '+' : ''}{e.trajectory3yr}</td>
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
