import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, LineChart, Cell, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── Static reference data ────────────────────────────────────────────────────

const FRAMEWORKS = [
  { id: 'ECB',  name: 'ECB Supervisory Climate',     year: 2024, scenarios: ['Orderly', 'Disorderly', 'Hot House'],              horizon: 30, submissionDeadline: '2025-03-31' },
  { id: 'PRA',  name: 'PRA Exploratory Scenario',    year: 2024, scenarios: ['Early Action', 'Late Action', 'No Additional Action'], horizon: 30, submissionDeadline: '2025-06-30' },
  { id: 'OSFI', name: 'OSFI B-15 Climate Risk',      year: 2024, scenarios: ['Net Zero 2050', 'Current Policies', 'Delayed Transition'], horizon: 30, submissionDeadline: '2025-09-30' },
  { id: 'FED',  name: 'Federal Reserve Climate Pilot', year: 2024, scenarios: ['Physical', 'Transition', 'Combined'],             horizon: 10, submissionDeadline: '2025-12-31' },
];

const INST_NAMES = [
  'Bank Alpha', 'Bank Beta', 'Bank Gamma', 'Bank Delta', 'Bank Epsilon',
  'Insurer Zeta', 'Insurer Eta', 'Insurer Theta', 'Insurer Iota', 'Insurer Kappa',
  'Asset Mgr Lambda', 'Asset Mgr Mu', 'Asset Mgr Nu', 'Asset Mgr Xi', 'Asset Mgr Omicron',
  'Bank Pi', 'Insurer Rho', 'Bank Sigma', 'Insurer Tau', 'Asset Mgr Upsilon',
];
const INST_TYPES = ['Bank', 'Insurance', 'Asset Manager'];
const JURISDICTIONS = ['EU', 'UK', 'Canada', 'US'];

const INSTITUTIONS = INST_NAMES.map((name, i) => {
  const statusForFramework = (fi) => {
    const v = sr(i * 31 + fi * 7);
    return v < 0.4 ? 'Completed' : v < 0.7 ? 'In Progress' : 'Not Started';
  };
  return {
    id: i,
    name,
    type: INST_TYPES[i % 3],
    jurisdiction: JURISDICTIONS[i % 4],
    totalAssets: sr(i * 13) * 2000 + 100,
    regulatoryCapital: sr(i * 17) * 0.14 + 0.10,
    climateExposurePct: sr(i * 23) * 40 + 5,
    materialityScore: sr(i * 41) * 60 + 30,
    submissionStatus: {
      ECB:  statusForFramework(0),
      PRA:  statusForFramework(1),
      OSFI: statusForFramework(2),
      FED:  statusForFramework(3),
    },
  };
});

// Scenario parameters: adverseMultiplier (1.0–3.5), creditLossRate (0.5%–8%),
//   netInterestIncomeImpact (−15%–+2%), operationalRiskAdd (0–2%)
const SCENARIO_PARAMS = {};
FRAMEWORKS.forEach((fw, fi) => {
  SCENARIO_PARAMS[fw.id] = {};
  fw.scenarios.forEach((sc, si) => {
    const seed = fi * 100 + si * 10;
    SCENARIO_PARAMS[fw.id][sc] = {
      adverseMultiplier:        sr(seed + 1) * 2.5 + 1.0,
      creditLossRate:           sr(seed + 2) * 7.5 + 0.5,
      netInterestIncomeImpact:  sr(seed + 3) * 17 - 15,
      operationalRiskAdd:       sr(seed + 4) * 2.0,
    };
  });
});

// ── Helper components ────────────────────────────────────────────────────────

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${T.border}`, marginBottom: 24 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{
        padding: '9px 16px', fontSize: 13, fontWeight: active === t ? 600 : 400,
        color: active === t ? T.indigo : T.muted,
        borderBottom: active === t ? `2px solid ${T.indigo}` : '2px solid transparent',
        background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
      }}>{t}</button>
    ))}
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = { Completed: T.green, 'In Progress': T.amber, 'Not Started': T.muted };
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
      background: `${colors[status]}18`, color: colors[status],
    }}>{status}</span>
  );
};

const SectionTitle = ({ children }) => (
  <h3 style={{ fontSize: 14, fontWeight: 700, color: T.navy, margin: '0 0 14px' }}>{children}</h3>
);

// ── Main component ────────────────────────────────────────────────────────────

const TABS = ['Orchestration Dashboard', 'Scenario Calibration', 'Institution Stress Results', 'Submission Tracker', 'Regulatory Template Auto-Fill'];

export default function SupervisoryStressOrchestratorPage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [selectedFramework, setSelectedFramework] = useState('ECB');
  const [selectedScenario, setSelectedScenario] = useState('Orderly');
  const [filterType, setFilterType] = useState('All');
  const [selectedInstitution, setSelectedInstitution] = useState(0);

  const fw = useMemo(() => FRAMEWORKS.find(f => f.id === selectedFramework), [selectedFramework]);

  // Ensure selected scenario is valid for current framework
  const safeScenario = useMemo(() => {
    if (!fw) return '';
    return fw.scenarios.includes(selectedScenario) ? selectedScenario : fw.scenarios[0];
  }, [fw, selectedScenario]);

  const scenarioParams = useMemo(() => {
    if (!fw || !safeScenario) return { adverseMultiplier: 1, creditLossRate: 1, netInterestIncomeImpact: 0, operationalRiskAdd: 0 };
    return SCENARIO_PARAMS[selectedFramework][safeScenario];
  }, [selectedFramework, safeScenario, fw]);

  // Compute stress results for all institutions × selected framework/scenario
  const stressResults = useMemo(() => {
    return INSTITUTIONS.map(inst => {
      const { adverseMultiplier, creditLossRate } = scenarioParams;
      const stressedCapital = inst.regulatoryCapital - (adverseMultiplier * (creditLossRate / 100) * (inst.climateExposurePct / 100));
      const capitalShortfall = Math.max(0, 0.08 - stressedCapital) * inst.totalAssets;
      const overallRisk = inst.materialityScore * adverseMultiplier / 100;
      return { ...inst, stressedCapital, capitalShortfall, overallRisk };
    });
  }, [scenarioParams]);

  // Completion stats
  const completionStats = useMemo(() => {
    const stats = {};
    FRAMEWORKS.forEach(f => {
      const completed = INSTITUTIONS.filter(i => i.submissionStatus[f.id] === 'Completed').length;
      const inProgress = INSTITUTIONS.filter(i => i.submissionStatus[f.id] === 'In Progress').length;
      const notStarted = INSTITUTIONS.filter(i => i.submissionStatus[f.id] === 'Not Started').length;
      stats[f.id] = {
        completionRate: INSTITUTIONS.length ? completed / INSTITUTIONS.length : 0,
        completed, inProgress, notStarted,
      };
    });
    return stats;
  }, []);

  const avgCompletionRate = useMemo(() => {
    const rates = FRAMEWORKS.map(f => completionStats[f.id].completionRate);
    return rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  }, [completionStats]);

  const totalCapitalAtRisk = useMemo(() => stressResults.reduce((s, r) => s + r.capitalShortfall, 0), [stressResults]);

  const nextDeadline = useMemo(() => {
    return [...FRAMEWORKS].sort((a, b) => a.submissionDeadline.localeCompare(b.submissionDeadline))[0].submissionDeadline;
  }, []);

  // Submission status chart data (stacked bar per institution)
  const submissionChartData = useMemo(() => {
    return INSTITUTIONS.slice(0, 15).map(inst => ({
      name: inst.name.replace('Asset Mgr ', 'AM ').replace('Insurer ', 'Ins '),
      Completed: inst.submissionStatus[selectedFramework] === 'Completed' ? 1 : 0,
      'In Progress': inst.submissionStatus[selectedFramework] === 'In Progress' ? 1 : 0,
      'Not Started': inst.submissionStatus[selectedFramework] === 'Not Started' ? 1 : 0,
    }));
  }, [selectedFramework]);

  // Calibration chart: all scenarios for selected framework
  const calibrationData = useMemo(() => {
    if (!fw) return [];
    return fw.scenarios.map(sc => {
      const p = SCENARIO_PARAMS[fw.id][sc];
      return {
        scenario: sc,
        'Adverse Multiplier': +p.adverseMultiplier.toFixed(2),
        'Credit Loss Rate (%)': +p.creditLossRate.toFixed(2),
        'NII Impact (%)': +p.netInterestIncomeImpact.toFixed(2),
        'Op Risk Add (%)': +p.operationalRiskAdd.toFixed(2),
      };
    });
  }, [fw]);

  // Filtered institutions for stress results tab
  const filteredInstitutions = useMemo(() => {
    const base = filterType === 'All' ? stressResults : stressResults.filter(i => i.type === filterType);
    return [...base].sort((a, b) => b.capitalShortfall - a.capitalShortfall);
  }, [stressResults, filterType]);

  // Top 10 by shortfall for bar chart
  const top10Shortfall = useMemo(() => filteredInstitutions.slice(0, 10).map(i => ({
    name: i.name.split(' ').slice(-1)[0],
    shortfall: +i.capitalShortfall.toFixed(1),
  })), [filteredInstitutions]);

  // Submission tracker — % complete per institution across all frameworks
  const trackerData = useMemo(() => INSTITUTIONS.map(inst => {
    const completed = FRAMEWORKS.filter(f => inst.submissionStatus[f.id] === 'Completed').length;
    const inProgress = FRAMEWORKS.filter(f => inst.submissionStatus[f.id] === 'In Progress').length;
    return {
      name: inst.name.split(' ').slice(-1)[0],
      completePct: Math.round((completed / FRAMEWORKS.length) * 100),
      inProgressPct: Math.round((inProgress / FRAMEWORKS.length) * 100),
      remaining: Math.round(((FRAMEWORKS.length - completed - inProgress) / FRAMEWORKS.length) * 100),
    };
  }), []);

  // Auto-fill template fields for selected institution × selected framework
  const templateFields = useMemo(() => {
    const inst = INSTITUTIONS[selectedInstitution];
    const p = scenarioParams;
    return [
      { field: 'Institution Name',          value: inst.name,                                      status: 'Filled' },
      { field: 'Jurisdiction',              value: inst.jurisdiction,                               status: 'Filled' },
      { field: 'Institution Type',          value: inst.type,                                       status: 'Filled' },
      { field: 'Total Assets ($bn)',        value: inst.totalAssets.toFixed(1),                     status: 'Filled' },
      { field: 'Regulatory Capital Ratio',  value: (inst.regulatoryCapital * 100).toFixed(2) + '%', status: 'Filled' },
      { field: 'Climate Exposure (%)',      value: inst.climateExposurePct.toFixed(1) + '%',        status: 'Filled' },
      { field: 'Adverse Multiplier',        value: p.adverseMultiplier.toFixed(2),                  status: 'Filled' },
      { field: 'Credit Loss Rate',          value: p.creditLossRate.toFixed(2) + '%',               status: 'Filled' },
      { field: 'NII Impact',               value: p.netInterestIncomeImpact.toFixed(2) + '%',       status: 'Filled' },
      { field: 'Operational Risk Add',      value: p.operationalRiskAdd.toFixed(2) + '%',           status: 'Filled' },
      { field: 'Scenario Name',             value: safeScenario,                                    status: 'Filled' },
      { field: 'Stressed Capital Ratio',    value: (stressResults[selectedInstitution]?.stressedCapital * 100).toFixed(2) + '%', status: 'Computed' },
      { field: 'Capital Shortfall ($bn)',   value: stressResults[selectedInstitution]?.capitalShortfall.toFixed(2), status: 'Computed' },
      { field: 'Materiality Score',         value: inst.materialityScore.toFixed(1),                status: 'Filled' },
      { field: 'Scope 3 Financed Emissions', value: null,                                           status: 'Missing' },
      { field: 'Counterparty Climate VaR',  value: null,                                            status: 'Missing' },
      { field: 'Physical Risk Asset Map',   value: null,                                            status: 'Missing' },
    ];
  }, [selectedInstitution, scenarioParams, safeScenario, stressResults]);

  const coverageScore = useMemo(() => {
    const filled = templateFields.filter(f => f.status !== 'Missing').length;
    return templateFields.length ? Math.round((filled / templateFields.length) * 100) : 0;
  }, [templateFields]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '28px 32px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          EP-DB3 · Supervisory Climate Stress Tests
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.navy, margin: 0 }}>
          Supervisory Stress Test Orchestrator
        </h1>
        <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
          ECB · PRA · OSFI · Federal Reserve — Regulatory scenario mapping, auto-fill &amp; submission tracking
        </div>
      </div>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* ── TAB 1: Orchestration Dashboard ── */}
      {activeTab === 'Orchestration Dashboard' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
            <KpiCard label="Institutions Covered"  value={INSTITUTIONS.length} sub="across 4 jurisdictions" />
            <KpiCard label="Avg Completion Rate"   value={(avgCompletionRate * 100).toFixed(1) + '%'} sub="all frameworks" color={avgCompletionRate > 0.5 ? T.green : T.amber} />
            <KpiCard label="Total Capital at Risk" value={'$' + totalCapitalAtRisk.toFixed(1) + 'bn'} sub={`${safeScenario} scenario`} color={T.red} />
            <KpiCard label="Next Deadline"         value={nextDeadline} sub="ECB submission" color={T.indigo} />
          </div>

          {/* Framework selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {FRAMEWORKS.map(f => (
              <button key={f.id} onClick={() => { setSelectedFramework(f.id); setSelectedScenario(f.scenarios[0]); }} style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: selectedFramework === f.id ? T.indigo : T.card,
                color: selectedFramework === f.id ? '#fff' : T.navy,
                border: `1px solid ${selectedFramework === f.id ? T.indigo : T.border}`,
              }}>{f.id}</button>
            ))}
          </div>

          {/* Completion summary cards */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
            {FRAMEWORKS.map(f => {
              const s = completionStats[f.id];
              return (
                <div key={f.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{f.id} — {f.name}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Deadline: {f.submissionDeadline}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                    <span style={{ color: T.green }}>✓ {s.completed}</span>
                    <span style={{ color: T.amber }}>⟳ {s.inProgress}</span>
                    <span style={{ color: T.muted }}>○ {s.notStarted}</span>
                  </div>
                  <div style={{ marginTop: 8, height: 4, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: (s.completionRate * 100) + '%', background: T.green, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>

          <SectionTitle>Submission Status by Institution — {fw?.name}</SectionTitle>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px 16px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={submissionChartData} margin={{ left: 0, right: 10, top: 8, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.muted }} angle={-40} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10, fill: T.muted }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Completed"   stackId="a" fill={T.green}  />
                <Bar dataKey="In Progress" stackId="a" fill={T.amber}  />
                <Bar dataKey="Not Started" stackId="a" fill={T.muted}  />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── TAB 2: Scenario Calibration ── */}
      {activeTab === 'Scenario Calibration' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {FRAMEWORKS.map(f => (
              <button key={f.id} onClick={() => { setSelectedFramework(f.id); setSelectedScenario(f.scenarios[0]); }} style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: selectedFramework === f.id ? T.indigo : T.card,
                color: selectedFramework === f.id ? '#fff' : T.navy,
                border: `1px solid ${selectedFramework === f.id ? T.indigo : T.border}`,
              }}>{f.id}</button>
            ))}
          </div>

          <SectionTitle>Adverse Multiplier × Credit Loss Rate — {fw?.name}</SectionTitle>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px 16px', marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={calibrationData} margin={{ left: 10, right: 20, top: 8, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 11, fill: T.muted }} />
                <YAxis yAxisId="left"  tick={{ fontSize: 10, fill: T.muted }} label={{ value: 'Adverse Mult.', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.muted, offset: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.muted }} label={{ value: 'Credit Loss %', angle: 90, position: 'insideRight', fontSize: 10, fill: T.muted }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar  yAxisId="left"  dataKey="Adverse Multiplier"    fill={T.indigo} opacity={0.85} />
                <Line yAxisId="right" dataKey="Credit Loss Rate (%)"  stroke={T.red}  strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <SectionTitle>Calibration Parameter Table — {fw?.name}</SectionTitle>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Scenario', 'Adverse Multiplier', 'Credit Loss Rate', 'NII Impact', 'Op Risk Add'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fw && fw.scenarios.map((sc, si) => {
                  const p = SCENARIO_PARAMS[fw.id][sc];
                  const isSelected = sc === safeScenario;
                  return (
                    <tr key={sc} onClick={() => setSelectedScenario(sc)} style={{
                      background: isSelected ? `${T.indigo}10` : si % 2 ? T.sub : T.card,
                      cursor: 'pointer', transition: 'background 0.1s',
                    }}>
                      <td style={{ padding: '10px 14px', fontWeight: isSelected ? 700 : 400, color: isSelected ? T.indigo : T.text }}>{sc}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>{p.adverseMultiplier.toFixed(2)}×</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: T.red }}>{p.creditLossRate.toFixed(2)}%</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: p.netInterestIncomeImpact < 0 ? T.red : T.green }}>{p.netInterestIncomeImpact > 0 ? '+' : ''}{p.netInterestIncomeImpact.toFixed(2)}%</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>{p.operationalRiskAdd.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px' }}>
            <SectionTitle>All Frameworks — Scenario Comparison</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {FRAMEWORKS.map(f => (
                <div key={f.id}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{f.id}</div>
                  {f.scenarios.map(sc => {
                    const p = SCENARIO_PARAMS[f.id][sc];
                    return (
                      <div key={sc} style={{ fontSize: 11, marginBottom: 6, padding: '6px 8px', background: T.sub, borderRadius: 4 }}>
                        <div style={{ fontWeight: 600, color: T.navy, marginBottom: 2 }}>{sc}</div>
                        <div style={{ color: T.muted }}>Mult: {p.adverseMultiplier.toFixed(2)}× | CL: {p.creditLossRate.toFixed(1)}%</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Institution Stress Results ── */}
      {activeTab === 'Institution Stress Results' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: T.muted }}>Filter by type:</span>
            {['All', 'Bank', 'Insurance', 'Asset Manager'].map(t => (
              <button key={t} onClick={() => setFilterType(t)} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: filterType === t ? T.navy : T.card,
                color: filterType === t ? '#fff' : T.navy,
                border: `1px solid ${filterType === t ? T.navy : T.border}`,
              }}>{t}</button>
            ))}
            <span style={{ marginLeft: 8, fontSize: 12, color: T.muted }}>Scenario: <b>{safeScenario}</b> ({selectedFramework})</span>
          </div>

          <div style={{ display: 'flex', gap: 20, marginBottom: 28 }}>
            <div style={{ flex: 1 }}>
              <SectionTitle>Capital Shortfall — Top 10 Institutions ($bn)</SectionTitle>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 8px' }}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={top10Shortfall} layout="vertical" margin={{ left: 60, right: 20, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: T.muted }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.muted }} width={60} />
                    <Tooltip formatter={v => ['$' + v.toFixed(2) + 'bn', 'Shortfall']} />
                    <Bar dataKey="shortfall" fill={T.red} radius={[0, 3, 3, 0]}>
                      {top10Shortfall.map((_, i) => <Cell key={i} fill={i < 3 ? T.red : T.orange} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <SectionTitle>All Institution Stress Results</SectionTitle>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Institution', 'Type', 'Jurisdiction', 'Assets ($bn)', 'Reg. Capital', 'Climate Exp.', 'Stressed Capital', 'Shortfall ($bn)', 'Risk Score', `${selectedFramework} Status`].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInstitutions.map((inst, i) => (
                  <tr key={inst.id} style={{ background: i % 2 ? T.sub : T.card }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: T.navy, whiteSpace: 'nowrap' }}>{inst.name}</td>
                    <td style={{ padding: '9px 12px', color: T.muted }}>{inst.type}</td>
                    <td style={{ padding: '9px 12px', color: T.muted }}>{inst.jurisdiction}</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'monospace' }}>{inst.totalAssets.toFixed(0)}</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'monospace' }}>{(inst.regulatoryCapital * 100).toFixed(1)}%</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'monospace' }}>{inst.climateExposurePct.toFixed(1)}%</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'monospace', color: inst.stressedCapital < 0.08 ? T.red : T.green, fontWeight: 600 }}>{(inst.stressedCapital * 100).toFixed(2)}%</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'monospace', color: inst.capitalShortfall > 0 ? T.red : T.muted }}>{inst.capitalShortfall > 0 ? '$' + inst.capitalShortfall.toFixed(1) : '—'}</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'monospace' }}>{inst.overallRisk.toFixed(2)}</td>
                    <td style={{ padding: '9px 12px' }}><StatusBadge status={inst.submissionStatus[selectedFramework]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: Submission Tracker ── */}
      {activeTab === 'Submission Tracker' && (
        <div>
          <SectionTitle>Submission Progress — All Frameworks (%)</SectionTitle>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px 16px', marginBottom: 28 }}>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={trackerData} layout="vertical" margin={{ left: 80, right: 40, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.muted }} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.muted }} width={80} />
                <Tooltip formatter={v => [v + '%']} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="completePct"   stackId="a" fill={T.green}  name="Complete" />
                <Bar dataKey="inProgressPct" stackId="a" fill={T.amber}  name="In Progress" />
                <Bar dataKey="remaining"     stackId="a" fill={T.border} name="Not Started" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <SectionTitle>Regulatory Deadline Calendar</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {FRAMEWORKS.map(f => {
              const s = completionStats[f.id];
              const pct = Math.round(s.completionRate * 100);
              return (
                <div key={f.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '18px 20px' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.navy, marginBottom: 4 }}>{f.id}</div>
                  <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>{f.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.indigo, marginBottom: 8 }}>Deadline: {f.submissionDeadline}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Horizon: {f.horizon} years</div>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>Scenarios: {f.scenarios.join(' · ')}</div>
                  <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', width: pct + '%', background: pct > 60 ? T.green : pct > 30 ? T.amber : T.red, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 11, color: T.muted }}>{pct}% submitted · {s.inProgress} in progress</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 5: Regulatory Template Auto-Fill ── */}
      {activeTab === 'Regulatory Template Auto-Fill' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 4 }}>Institution</label>
              <select value={selectedInstitution} onChange={e => setSelectedInstitution(Number(e.target.value))} style={{
                padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, background: T.card, color: T.text,
              }}>
                {INSTITUTIONS.map((inst, i) => <option key={i} value={i}>{inst.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 4 }}>Framework</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {FRAMEWORKS.map(f => (
                  <button key={f.id} onClick={() => { setSelectedFramework(f.id); setSelectedScenario(f.scenarios[0]); }} style={{
                    padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: selectedFramework === f.id ? T.indigo : T.card,
                    color: selectedFramework === f.id ? '#fff' : T.navy,
                    border: `1px solid ${selectedFramework === f.id ? T.indigo : T.border}`,
                  }}>{f.id}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 4 }}>Scenario</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {fw && fw.scenarios.map(sc => (
                  <button key={sc} onClick={() => setSelectedScenario(sc)} style={{
                    padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: safeScenario === sc ? T.teal : T.card,
                    color: safeScenario === sc ? '#fff' : T.navy,
                    border: `1px solid ${safeScenario === sc ? T.teal : T.border}`,
                  }}>{sc}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <SectionTitle>Template Fields — {INSTITUTIONS[selectedInstitution].name} × {selectedFramework}</SectionTitle>
                <div style={{ fontSize: 13, fontWeight: 700, color: coverageScore >= 80 ? T.green : T.amber }}>
                  Coverage: {coverageScore}%
                </div>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Field</th>
                      <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Value</th>
                      <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templateFields.map((f, i) => {
                      const statusColor = f.status === 'Filled' ? T.green : f.status === 'Computed' ? T.blue : T.red;
                      return (
                        <tr key={i} style={{ background: i % 2 ? T.sub : T.card }}>
                          <td style={{ padding: '9px 14px', color: T.navy, fontWeight: 500 }}>{f.field}</td>
                          <td style={{ padding: '9px 14px', fontFamily: f.value ? 'monospace' : 'inherit', color: f.value ? T.text : T.muted }}>
                            {f.value ?? <span style={{ fontStyle: 'italic', color: T.red }}>— Not available</span>}
                          </td>
                          <td style={{ padding: '9px 14px' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: statusColor + '18', padding: '2px 8px', borderRadius: 10 }}>{f.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <SectionTitle>Coverage Summary</SectionTitle>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px' }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: coverageScore >= 80 ? T.green : T.amber, fontFamily: 'monospace' }}>{coverageScore}%</div>
                  <div style={{ fontSize: 12, color: T.muted }}>Template coverage score</div>
                </div>
                <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ height: '100%', width: coverageScore + '%', background: coverageScore >= 80 ? T.green : T.amber, borderRadius: 4 }} />
                </div>
                {[
                  { label: 'Filled', count: templateFields.filter(f => f.status === 'Filled').length,    color: T.green },
                  { label: 'Computed', count: templateFields.filter(f => f.status === 'Computed').length, color: T.blue },
                  { label: 'Missing', count: templateFields.filter(f => f.status === 'Missing').length,  color: T.red },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: s.color, fontWeight: 600 }}>{s.label}</span>
                    <span style={{ color: T.navy, fontFamily: 'monospace', fontWeight: 700 }}>{s.count} / {templateFields.length}</span>
                  </div>
                ))}
                <div style={{ marginTop: 20, padding: '12px', background: T.sub, borderRadius: 6, fontSize: 11, color: T.muted, lineHeight: 1.6 }}>
                  <b style={{ color: T.navy }}>Missing data flags:</b><br />
                  Scope 3 financed emissions data not yet ingested from PCAF module. Counterparty Climate VaR requires physical risk map overlay. Physical Risk Asset Map pending GIS integration.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
