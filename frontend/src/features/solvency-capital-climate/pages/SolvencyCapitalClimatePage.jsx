import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, ComposedChart, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ── Constants ──────────────────────────────────────────────── */
const TABS = [
  'SCR Dashboard',
  'NatCat Climate Module',
  'SCR Standard Formula',
  'ORSA Stress Scenarios',
  'Capital Efficiency',
];

const TYPES = ['Life', 'Non-Life', 'Composite', 'Reinsurer'];
const JURISDICTIONS = ['UK', 'EU', 'US', 'Australia', 'Bermuda'];
const TYPE_COLORS = { Life: T.indigo, 'Non-Life': T.teal, Composite: T.amber, Reinsurer: T.purple };
const JURI_COLORS = { UK: T.indigo, EU: T.blue, US: T.red, Australia: T.teal, Bermuda: T.orange };

const ORSA_SCENARIOS = [
  { name: 'Base', scrMultiplier: 1.00, ownFundsImpact: 0, narrative: 'No additional climate stress; baseline Solvency II SCR.' },
  { name: 'Moderate Physical', scrMultiplier: 1.15, ownFundsImpact: -5, narrative: 'RCP 4.5 physical risk scenario; moderate flood/wind frequency uplift.' },
  { name: 'Severe Physical', scrMultiplier: 1.35, ownFundsImpact: -12, narrative: 'RCP 8.5 severe physical stress; tail losses materially elevated.' },
  { name: 'Abrupt Transition', scrMultiplier: 1.25, ownFundsImpact: -18, narrative: 'Disorderly transition; stranded asset losses hit own funds directly.' },
  { name: 'Combined Tail', scrMultiplier: 1.55, ownFundsImpact: -28, narrative: 'Simultaneous severe physical + abrupt transition; systemic tail scenario.' },
];

const SCR_MODULES = ['NatCat', 'Market Risk', 'Credit Risk', 'Operational', 'Life/Health'];
const MODULE_COLORS = [T.red, T.indigo, T.amber, T.orange, T.teal];

const PERILS = ['Flood', 'Wind', 'Wildfire'];
const PERIL_COLORS = [T.blue, T.teal, T.orange];

// 15 entities
const ENTITIES = Array.from({ length: 15 }, (_, i) => {
  const juri = JURISDICTIONS[i % 5];
  const framework = juri === 'US' ? 'NAIC RBC' : 'Solvency II';
  const type = TYPES[Math.floor(sr(i * 11) * 4)];
  const eligibleOwnFunds = sr(i * 13) * 5000 + 500;
  const baseSCR = sr(i * 17) * 0.18 + 0.10;
  const natcatSCR = sr(i * 23) * 0.08 + 0.02;
  const climateLoading = sr(i * 29) * 0.04 + 0.01;
  const lossAbsorbingCapacity = sr(i * 31) * 0.35 + 0.15;
  const solvencyRatio = sr(i * 37) * 180 + 110;
  const climateAdjustedSCR = baseSCR + natcatSCR * (1 + climateLoading);
  const ownFundsAboveMinimum = solvencyRatio > 150;
  // SCR module weights (sum ≈ baseSCR, seeded)
  const mods = SCR_MODULES.map((_, mi) => +(sr(i * 7 + mi + 2) * 0.05 + 0.02).toFixed(4));
  const modTotal = mods.reduce((a, b) => a + b, 0);
  // Peril shares for NatCat decomposition (sum to 1)
  const perilRaw = PERILS.map((_, pi) => sr(i * 3 + pi + 100) + 0.1);
  const perilSum = perilRaw.reduce((a, b) => a + b, 0);
  const perilShares = perilSum > 0 ? perilRaw.map(v => v / perilSum) : [0.33, 0.33, 0.34];
  return {
    name: 'Insurer ' + String.fromCharCode(65 + i),
    type, jurisdiction: juri, framework,
    eligibleOwnFunds: +eligibleOwnFunds.toFixed(1),
    baseSCR: +baseSCR.toFixed(4),
    natcatSCR: +natcatSCR.toFixed(4),
    climateLoading: +climateLoading.toFixed(4),
    lossAbsorbingCapacity: +lossAbsorbingCapacity.toFixed(4),
    solvencyRatio: +solvencyRatio.toFixed(1),
    climateAdjustedSCR: +climateAdjustedSCR.toFixed(4),
    ownFundsAboveMinimum,
    scrModules: mods,
    modTotal: +modTotal.toFixed(4),
    perilShares,
  };
});

/* ── Helpers ─────────────────────────────────────────────────── */
const fmt = (v, d = 1) => v.toFixed(d);
const fmtM = v => `$${fmt(v, 0)}M`;
const fmtPct = v => `${fmt(v * 100, 1)}%`;
const pctOf = (v, total) => total > 0 ? (v / total) * 100 : 0;

/* ── Sub-components ─────────────────────────────────────────── */
const KpiCard = ({ label, value, sub, color = T.indigo }) => (
  <div style={{
    background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: '16px 20px', flex: 1, minWidth: 160,
  }}>
    <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{sub}</div>}
  </div>
);

const SectionHeader = ({ title, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, borderBottom: `2px solid ${T.border}`, marginBottom: 24, flexWrap: 'wrap' }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{
        padding: '10px 16px', fontSize: 13, fontWeight: active === t ? 700 : 500,
        color: active === t ? T.indigo : T.muted,
        background: 'none', border: 'none', cursor: 'pointer',
        borderBottom: active === t ? `2px solid ${T.indigo}` : '2px solid transparent',
        marginBottom: -2,
      }}>{t}</button>
    ))}
  </div>
);

const ScenarioSelector = ({ scenarios, active, onChange }) => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
    {scenarios.map((s, i) => (
      <button key={s.name} onClick={() => onChange(i)} style={{
        padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
        background: active === i ? T.indigo : T.sub,
        color: active === i ? '#fff' : T.text,
        border: `1px solid ${active === i ? T.indigo : T.border}`,
        cursor: 'pointer',
      }}>{s.name}</button>
    ))}
  </div>
);

/* ════════════════════════════════════════════════════════════ */
export default function SolvencyCapitalClimatePage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [selectedEntity, setSelectedEntity] = useState(0);

  /* ── Core computations ────────────────────────────────────── */
  const computed = useMemo(() => {
    const scenario = ORSA_SCENARIOS[scenarioIdx];
    const entityData = ENTITIES.map(e => {
      const climateSCR = e.baseSCR * scenario.scrMultiplier + e.natcatSCR * e.climateLoading;
      const adjustedOF = e.eligibleOwnFunds * (1 + scenario.ownFundsImpact / 100);
      const capitalRequirement = e.eligibleOwnFunds * climateSCR;
      const adjustedSolvencyRatio = capitalRequirement > 0
        ? (adjustedOF / capitalRequirement) * 100
        : 0;
      const capitalEfficiency = capitalRequirement > 0
        ? Math.min(e.eligibleOwnFunds / capitalRequirement, 5)
        : 5;
      const capitalBuffer = adjustedSolvencyRatio < 150
        ? (1.5 * capitalRequirement - adjustedOF)
        : 0;
      return {
        ...e, climateSCR, adjustedOF, capitalRequirement,
        adjustedSolvencyRatio, capitalEfficiency, capitalBuffer,
        passFail: adjustedSolvencyRatio >= 150,
      };
    });

    const belowTarget = entityData.filter(e => !e.passFail).length;
    const pctBelowTarget = entityData.length ? belowTarget / entityData.length : 0;
    const avgSolvencyRatio = entityData.length
      ? entityData.reduce((a, b) => a + b.adjustedSolvencyRatio, 0) / entityData.length
      : 0;
    const totalCapitalAtRisk = entityData.filter(e => !e.passFail)
      .reduce((a, b) => a + b.capitalBuffer, 0);
    const avgClimateLoading = ENTITIES.length
      ? ENTITIES.reduce((a, b) => a + b.climateLoading, 0) / ENTITIES.length
      : 0;

    return { entityData, belowTarget, pctBelowTarget, avgSolvencyRatio, totalCapitalAtRisk, avgClimateLoading };
  }, [scenarioIdx]);

  /* ── Tab 2: NatCat chart data ─────────────────────────────── */
  const natcatChartData = useMemo(() => computed.entityData.map(e => ({
    name: e.name.replace('Insurer ', ''),
    baseSCR: +(e.baseSCR * 100).toFixed(2),
    natcatSCR: +(e.natcatSCR * 100).toFixed(2),
    climateLoading: +(e.climateLoading * 100).toFixed(2),
  })), [computed.entityData]);

  const natcatTableData = useMemo(() => ENTITIES.map((e, i) => {
    const floodSCR = e.natcatSCR * e.perilShares[0];
    const windSCR = e.natcatSCR * e.perilShares[1];
    const wildfireSCR = e.natcatSCR * e.perilShares[2];
    return {
      ...e, floodSCR: +floodSCR.toFixed(4),
      windSCR: +windSCR.toFixed(4),
      wildfireSCR: +wildfireSCR.toFixed(4),
    };
  }), []);

  /* ── Tab 3: Standard formula stacked ─────────────────────── */
  const formulaChartData = useMemo(() => ENTITIES.map((e, i) => {
    const row = { name: e.name.replace('Insurer ', '') };
    SCR_MODULES.forEach((m, mi) => {
      row[m] = +(e.scrModules[mi] * 100).toFixed(2);
    });
    // Diversification benefit: BSCR < sum of modules
    const sumMods = e.scrModules.reduce((a, b) => a + b, 0);
    const divBenefit = sumMods > 0 ? (1 - (e.baseSCR / sumMods)) * 100 : 0;
    row['Diversification Benefit'] = +Math.max(0, divBenefit).toFixed(2);
    return row;
  }), []);

  /* ── Tab 4: ORSA per entity ──────────────────────────────── */
  const orsaEntityData = useMemo(() => {
    const e = ENTITIES[selectedEntity];
    return ORSA_SCENARIOS.map((sc, si) => {
      const climateSCR = e.baseSCR * sc.scrMultiplier + e.natcatSCR * e.climateLoading;
      const adjOF = e.eligibleOwnFunds * (1 + sc.ownFundsImpact / 100);
      const capReq = e.eligibleOwnFunds * climateSCR;
      const ratio = capReq > 0 ? (adjOF / capReq) * 100 : 0;
      const bufferNeeded = ratio < 150 ? (1.5 * capReq - adjOF) : 0;
      return {
        scenario: sc.name,
        scrMultiplier: sc.scrMultiplier,
        ownFundsImpact: sc.ownFundsImpact,
        adjustedRatio: +ratio.toFixed(1),
        bufferNeeded: +bufferNeeded.toFixed(1),
        pass: ratio >= 150,
        narrative: sc.narrative,
      };
    });
  }, [selectedEntity]);

  /* ── Tab 5: Capital efficiency scatter ───────────────────── */
  const scatterData = useMemo(() => computed.entityData.map(e => ({
    name: e.name,
    x: +e.capitalEfficiency.toFixed(3),
    y: +e.adjustedSolvencyRatio.toFixed(1),
    type: e.type,
  })), [computed.entityData]);

  /* ── Tab 5: Radar for selected entity ───────────────────── */
  const radarData = useMemo(() => {
    const e = ENTITIES[selectedEntity];
    return [
      { dim: 'NatCat SCR', value: +(e.natcatSCR * 100 * 10).toFixed(1) },
      { dim: 'Transition Risk', value: +(e.climateLoading * 100 * 12).toFixed(1) },
      { dim: 'Market Risk', value: +(e.scrModules[1] * 100 * 8).toFixed(1) },
      { dim: 'Liquidity', value: +(e.lossAbsorbingCapacity * 100).toFixed(1) },
      { dim: 'Diversification', value: +((1 - e.baseSCR / (e.modTotal || 0.01)) * 100).toFixed(1) },
    ].map(d => ({ ...d, value: Math.min(Math.max(d.value, 0), 100) }));
  }, [selectedEntity]);

  /* ── Rankings for Tab 5 ──────────────────────────────────── */
  const rankingsData = useMemo(() => (
    [...computed.entityData]
      .sort((a, b) => b.adjustedSolvencyRatio - a.adjustedSolvencyRatio)
      .slice(0, 10)
  ), [computed.entityData]);

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '24px 32px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ background: T.teal, borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 18 }}>🏛</span>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>Solvency Capital Climate Engine</div>
            <div style={{ fontSize: 12, color: T.muted }}>EP-DC4 · Solvency II & NAIC Climate-Adjusted SCR Calculator · 15 Entities · 5 ORSA Scenarios</div>
          </div>
        </div>
      </div>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* ─── TAB 1: SCR Dashboard ─── */}
      {activeTab === TABS[0] && (
        <div>
          <ScenarioSelector scenarios={ORSA_SCENARIOS} active={scenarioIdx} onChange={setScenarioIdx} />

          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <KpiCard label="Avg Solvency Ratio" value={`${fmt(computed.avgSolvencyRatio, 1)}%`} sub="Eligible own funds / climate SCR" color={computed.avgSolvencyRatio < 150 ? T.red : T.green} />
            <KpiCard label="Below 150% Target" value={fmtPct(computed.pctBelowTarget)} sub={`${computed.belowTarget} of ${ENTITIES.length} entities`} color={T.red} />
            <KpiCard label="Total Capital at Risk" value={fmtM(computed.totalCapitalAtRisk)} sub="Buffer needed for failing entities" color={T.orange} />
            <KpiCard label="Avg Climate Loading" value={fmtPct(computed.avgClimateLoading)} sub="NatCat SCR add-on across group" color={T.amber} />
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <SectionHeader title="Adjusted Solvency Ratio by Entity" sub="Climate-adjusted solvency ratio under selected ORSA scenario. Dashed lines at 100% (MCR) and 150% (target SCR)." />
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={computed.entityData} margin={{ left: 20, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.muted }} />
                <YAxis domain={[0, 400]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: T.muted }} />
                <Tooltip formatter={(v, n) => [`${v.toFixed(1)}%`, n]} />
                <ReferenceLine y={150} stroke={T.amber} strokeDasharray="5 5" label={{ value: '150% Target', position: 'insideTopLeft', fontSize: 11, fill: T.amber }} />
                <ReferenceLine y={100} stroke={T.red} strokeDasharray="4 4" label={{ value: '100% MCR', position: 'insideBottomLeft', fontSize: 11, fill: T.red }} />
                <Bar dataKey="adjustedSolvencyRatio" name="Solvency Ratio (%)" radius={[4, 4, 0, 0]}>
                  {computed.entityData.map((e, i) => (
                    <Cell key={i} fill={e.adjustedSolvencyRatio < 100 ? T.red : e.adjustedSolvencyRatio < 150 ? T.amber : T.green} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
              {[
                { col: T.green, label: '≥ 150% (Target)' },
                { col: T.amber, label: '100–150% (Monitor)' },
                { col: T.red, label: '< 100% (Breach)' },
              ].map(({ col, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.muted }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: col }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: NatCat Climate Module ─── */}
      {activeTab === TABS[1] && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <SectionHeader title="Base SCR + NatCat SCR + Climate Loading by Entity" sub="Stacked composition of SCR components (% of eligible own funds). Climate loading is the additional NatCat uplift." />
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={natcatChartData} margin={{ left: 20, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.muted }} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: T.muted }} />
                <Tooltip formatter={(v, n) => [`${v.toFixed(2)}%`, n]} />
                <Legend />
                <Bar dataKey="baseSCR" name="Base SCR" fill={T.indigo} stackId="a" />
                <Bar dataKey="natcatSCR" name="NatCat SCR" fill={T.red} stackId="a" />
                <Bar dataKey="climateLoading" name="Climate Loading" fill={T.orange} stackId="a" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <SectionHeader title="Climate Loading Decomposition by Peril" sub="NatCat climate loading allocated to Flood / Wind / Wildfire based on exposure weighting" />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={natcatTableData.map(e => ({
                  name: e.name.replace('Insurer ', ''),
                  Flood: +(e.floodSCR * 100).toFixed(3),
                  Wind: +(e.windSCR * 100).toFixed(3),
                  Wildfire: +(e.wildfireSCR * 100).toFixed(3),
                }))}
                margin={{ left: 20, right: 10, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.muted }} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: T.muted }} />
                <Tooltip formatter={(v, n) => [`${v.toFixed(3)}%`, n]} />
                <Legend />
                {PERILS.map((p, pi) => (
                  <Bar key={p} dataKey={p} fill={PERIL_COLORS[pi]} stackId="b" />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <SectionHeader title="NatCat Parameter Table" />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Entity', 'Type', 'Jurisdiction', 'Framework', 'NatCat SCR', 'Climate Loading', 'Flood Share', 'Wind Share', 'Wildfire Share'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.muted, borderBottom: `2px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {natcatTableData.map((e, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: T.text }}>{e.name}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: TYPE_COLORS[e.type] + '20', color: TYPE_COLORS[e.type], borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>{e.type}</span>
                      </td>
                      <td style={{ padding: '8px 12px', color: T.muted }}>{e.jurisdiction}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: T.blue }}>{e.framework}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{fmtPct(e.natcatSCR)}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: T.orange }}>{fmtPct(e.climateLoading)}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{(e.perilShares[0] * 100).toFixed(1)}%</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{(e.perilShares[1] * 100).toFixed(1)}%</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{(e.perilShares[2] * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: SCR Standard Formula ─── */}
      {activeTab === TABS[2] && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <SectionHeader title="SCR Standard Formula — Module Contributions by Entity" sub="Stacked SCR module decomposition (% of eligible own funds). BSCR applies diversification correlation matrix." />
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={formulaChartData} margin={{ left: 20, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.muted }} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: T.muted }} />
                <Tooltip formatter={(v, n) => [`${v.toFixed(2)}%`, n]} />
                <Legend />
                {SCR_MODULES.map((m, mi) => (
                  <Bar key={m} dataKey={m} fill={MODULE_COLORS[mi]} stackId="c" />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <SectionHeader title="Diversification Benefit (BSCR vs Sum of Modules)" sub="Positive diversification benefit reflects correlation credit in Solvency II standard formula" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={formulaChartData.map(d => ({
                  name: d.name,
                  divBenefit: d['Diversification Benefit'],
                }))}
                margin={{ left: 20, right: 10, top: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.muted }} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: T.muted }} />
                <Tooltip formatter={(v, n) => [`${v.toFixed(2)}%`, 'Diversification Benefit']} />
                <Bar dataKey="divBenefit" name="Diversification Benefit (%)" fill={T.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─── TAB 4: ORSA Stress Scenarios ─── */}
      {activeTab === TABS[3] && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Select Entity:</label>
            <select
              value={selectedEntity}
              onChange={e => setSelectedEntity(Number(e.target.value))}
              style={{ padding: '8px 14px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, fontSize: 13, color: T.text, cursor: 'pointer' }}
            >
              {ENTITIES.map((e, i) => <option key={i} value={i}>{e.name} ({e.type} · {e.jurisdiction})</option>)}
            </select>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <SectionHeader
              title={`Solvency Ratio Under 5 ORSA Scenarios — ${ENTITIES[selectedEntity].name}`}
              sub="Adjusted solvency ratio deteriorates under physical/transition climate stress. 150% target threshold shown."
            />
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={orsaEntityData} margin={{ left: 20, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 11, fill: T.muted }} />
                <YAxis tickFormatter={v => `${v}%`} domain={[0, 400]} tick={{ fontSize: 11, fill: T.muted }} />
                <Tooltip formatter={(v, n) => [`${v.toFixed(1)}%`, n]} />
                <ReferenceLine y={150} stroke={T.amber} strokeDasharray="5 5" label={{ value: '150% Target', position: 'insideTopRight', fontSize: 11, fill: T.amber }} />
                <ReferenceLine y={100} stroke={T.red} strokeDasharray="4 4" label={{ value: '100% MCR', position: 'insideBottomRight', fontSize: 11, fill: T.red }} />
                <Line type="monotone" dataKey="adjustedRatio" stroke={T.indigo} strokeWidth={3} dot={{ r: 6, fill: T.indigo }} name="Solvency Ratio (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <SectionHeader title="ORSA Scenario Detail Table" />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Scenario', 'SCR Multiplier', 'Own Funds Impact', 'Adjusted Ratio', 'Capital Buffer Needed', 'Pass/Fail', 'Narrative'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.muted, borderBottom: `2px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orsaEntityData.map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: T.text }}>{row.scenario}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{row.scrMultiplier.toFixed(2)}×</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: row.ownFundsImpact < 0 ? T.red : T.muted }}>{row.ownFundsImpact}%</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: row.adjustedRatio < 150 ? T.red : T.green }}>{row.adjustedRatio.toFixed(1)}%</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: row.bufferNeeded > 0 ? T.red : T.muted }}>
                      {row.bufferNeeded > 0 ? fmtM(row.bufferNeeded) : '—'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        background: (row.pass ? T.green : T.red) + '20',
                        color: row.pass ? T.green : T.red,
                        border: `1px solid ${(row.pass ? T.green : T.red)}40`,
                        borderRadius: 4, padding: '3px 10px', fontSize: 11, fontWeight: 700
                      }}>{row.pass ? 'PASS' : 'FAIL'}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: T.muted, maxWidth: 260 }}>{row.narrative}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 5: Capital Efficiency ─── */}
      {activeTab === TABS[4] && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 3, minWidth: 340 }}>
              <SectionHeader title="Capital Efficiency vs Solvency Ratio" sub="Scatter: x = capital efficiency (own funds / capital requirement, capped 5×), y = adjusted solvency ratio. Colored by entity type." />
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" dataKey="x" name="Capital Efficiency" domain={[0, 5.5]} tickFormatter={v => `${v.toFixed(1)}×`} tick={{ fontSize: 11, fill: T.muted }} label={{ value: 'Capital Efficiency (×)', position: 'insideBottom', offset: -4, fontSize: 11, fill: T.muted }} />
                  <YAxis type="number" dataKey="y" name="Solvency Ratio" tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: T.muted }} />
                  <ReferenceLine y={150} stroke={T.amber} strokeDasharray="4 4" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
                          <div style={{ fontWeight: 700, color: T.text }}>{d.name}</div>
                          <div style={{ color: T.muted }}>Efficiency: {d.x.toFixed(2)}×</div>
                          <div style={{ color: T.muted }}>Solvency: {d.y.toFixed(1)}%</div>
                          <div style={{ color: TYPE_COLORS[d.type] || T.indigo }}>{d.type}</div>
                        </div>
                      );
                    }}
                  />
                  {TYPES.map(type => (
                    <Scatter
                      key={type}
                      name={type}
                      data={scatterData.filter(d => d.type === type)}
                      fill={TYPE_COLORS[type]}
                    />
                  ))}
                  <Legend />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 1, minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <SectionHeader title="Risk Radar" sub={ENTITIES[selectedEntity].name} />
                <select
                  value={selectedEntity}
                  onChange={e => setSelectedEntity(Number(e.target.value))}
                  style={{ padding: '5px 10px', borderRadius: 5, border: `1px solid ${T.border}`, fontSize: 11, color: T.text, background: T.sub, marginLeft: 'auto' }}
                >
                  {ENTITIES.map((e, i) => <option key={i} value={i}>{e.name}</option>)}
                </select>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: T.muted }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: T.muted }} tickCount={4} />
                  <Radar name="Risk Profile" dataKey="value" stroke={T.teal} fill={T.teal} fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <SectionHeader title="Top 10 Entities by Solvency Ratio" sub="Ranked under current ORSA scenario selection. Green = above target, amber = monitor zone." />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Rank', 'Entity', 'Type', 'Jurisdiction', 'Own Funds ($M)', 'Capital Req ($M)', 'Capital Efficiency', 'Solvency Ratio', 'Status'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.muted, borderBottom: `2px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rankingsData.map((e, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: T.muted, fontFamily: 'monospace' }}>#{i + 1}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: T.text }}>{e.name}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ background: TYPE_COLORS[e.type] + '20', color: TYPE_COLORS[e.type], borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>{e.type}</span>
                    </td>
                    <td style={{ padding: '8px 12px', color: T.muted }}>{e.jurisdiction}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{fmtM(e.eligibleOwnFunds)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{fmtM(e.capitalRequirement)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: T.blue }}>{e.capitalEfficiency.toFixed(2)}×</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700, color: e.adjustedSolvencyRatio < 150 ? T.amber : T.green }}>
                      {e.adjustedSolvencyRatio.toFixed(1)}%
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        background: (e.passFail ? T.green : T.red) + '20',
                        color: e.passFail ? T.green : T.red,
                        border: `1px solid ${(e.passFail ? T.green : T.red)}40`,
                        borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                      }}>{e.passFail ? 'PASS' : 'FAIL'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
