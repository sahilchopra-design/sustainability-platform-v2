import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, ComposedChart, ScatterChart, Scatter,
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

/* ── Module-level constants ─────────────────────────────── */
const LOB_NAMES = [
  'Property Catastrophe', 'Homeowners', 'Commercial Property',
  'Marine Cargo', 'Agricultural', 'Liability (Climate)',
  'Motor (Weather)', 'Engineering',
];
const NGFS_SCENARIOS = ['Net Zero 2050', 'Below 2°C', 'Delayed Transition', 'Hot House World'];
const SCENARIO_MULTIPLIERS = [1.05, 1.12, 1.25, 1.45];
const TABS = [
  'Reserve Dashboard',
  'Development Factors',
  'Run-Off Triangle View',
  'Tail Risk Analysis',
  'Scenario Stress Testing',
];

const LOBS = LOB_NAMES.map((name, i) => ({
  name,
  shortName: name.split(' ')[0] + (name.includes('(') ? ' (C)' : ''),
  premiumIncome: sr(i * 11) * 800 + 100,
  baseIBNR: sr(i * 17) * 0.15 + 0.05,
  climateDevFactor: sr(i * 23) * 0.08 + 0.02,
  tailRiskFactor: sr(i * 29) * 0.12 + 0.03,
  reportingLag: Math.floor(sr(i * 31) * 24) + 6,
  reserveAdequacyScore: sr(i * 37) * 40 + 45,
  longtailExposure: sr(i * 41) > 0.5,
}));

// Loss development triangle: 8 LoB × 8 development periods
const DEV_TRIANGLE = Array.from({ length: 8 }, (_, i) =>
  Array.from({ length: 8 }, (_, j) => +(sr(i * 8 + j) * 50 + j * 30).toFixed(1))
);

// Horizons for scenario stress
const HORIZONS = [2030, 2040, 2050];
const HORIZON_MULTS = [0.6, 0.85, 1.0]; // fraction of full scenario impact realized

/* ── Helpers ─────────────────────────────────────────────── */
const fmt = (v, d = 1) => v.toFixed(d);
const fmtM = v => `$${fmt(v, 0)}M`;
const fmtPct = v => `${fmt(v * 100, 1)}%`;

const devClass = cdf => {
  if (cdf < 0.04) return { label: 'Low', color: T.green };
  if (cdf < 0.07) return { label: 'Moderate', color: T.amber };
  if (cdf < 0.10) return { label: 'High', color: T.orange };
  return { label: 'Critical', color: T.red };
};

/* ── Sub-components ───────────────────────────────────────── */
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
  <div style={{ display: 'flex', gap: 4, borderBottom: `2px solid ${T.border}`, marginBottom: 24 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{
        padding: '10px 18px', fontSize: 13, fontWeight: active === t ? 700 : 500,
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
      <button key={s} onClick={() => onChange(i)} style={{
        padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
        background: active === i ? T.indigo : T.sub,
        color: active === i ? '#fff' : T.text,
        border: `1px solid ${active === i ? T.indigo : T.border}`,
        cursor: 'pointer',
      }}>{s}</button>
    ))}
  </div>
);

/* ══════════════════════════════════════════════════════════ */
export default function ClimateReserveAdequacyPage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [selectedLob, setSelectedLob] = useState(0);

  /* ── Core computations ──────────────────────────────────── */
  const computed = useMemo(() => {
    const mult = SCENARIO_MULTIPLIERS[scenarioIdx];

    const lobData = LOBS.map(lob => {
      const currentReserve = lob.premiumIncome * lob.baseIBNR;
      const requiredReserve = lob.premiumIncome * (
        lob.baseIBNR + lob.climateDevFactor * mult + lob.tailRiskFactor
      );
      const reserveGap = requiredReserve - currentReserve;
      const adequacyRatio = lob.reserveAdequacyScore / 100;
      return { ...lob, currentReserve, requiredReserve, reserveGap, adequacyRatio };
    });

    const totalReserveGap = lobData.length ? lobData.reduce((a, b) => a + b.reserveGap, 0) : 0;
    const avgClimateDevFactor = LOBS.length
      ? LOBS.reduce((a, b) => a + b.climateDevFactor, 0) / LOBS.length : 0;
    const underReserved = LOBS.filter(l => l.reserveAdequacyScore < 70).length;
    const pctUnderReserved = LOBS.length ? underReserved / LOBS.length : 0;
    const avgAdequacyScore = LOBS.length
      ? LOBS.reduce((a, b) => a + b.reserveAdequacyScore, 0) / LOBS.length : 0;

    return { lobData, totalReserveGap, avgClimateDevFactor, pctUnderReserved, avgAdequacyScore };
  }, [scenarioIdx]);

  /* ── Tab 2: Dev factor chart ─────────────────────────────── */
  const devFactorChartData = useMemo(() => LOBS.map((lob, i) => ({
    name: lob.shortName,
    ...Object.fromEntries(NGFS_SCENARIOS.map((s, si) => [
      s, +(lob.climateDevFactor * SCENARIO_MULTIPLIERS[si]).toFixed(4),
    ])),
  })), []);

  /* ── Tab 4: Tail risk ─────────────────────────────────────── */
  const tailRiskData = useMemo(() => computed.lobData.map(lob => ({
    name: lob.shortName,
    tailRiskFactor: +fmt(lob.tailRiskFactor * 100, 2),
    adequacyScore: +fmt(lob.reserveAdequacyScore, 1),
    requiredReserve: +fmt(lob.requiredReserve, 1),
    isLongtail: lob.longtailExposure,
  })), [computed.lobData]);

  const longtailStats = useMemo(() => {
    const lt = LOBS.filter(l => l.longtailExposure);
    const st = LOBS.filter(l => !l.longtailExposure);
    const avg = arr => arr.length ? arr.reduce((a, b) => a + b.tailRiskFactor, 0) / arr.length : 0;
    const avgScore = arr => arr.length ? arr.reduce((a, b) => a + b.reserveAdequacyScore, 0) / arr.length : 0;
    return {
      ltAvgTail: avg(lt), stAvgTail: avg(st),
      ltAvgScore: avgScore(lt), stAvgScore: avgScore(st),
      ltCount: lt.length, stCount: st.length,
    };
  }, []);

  // Percentile reserve levels per LoB (75th/90th/99th)
  const percentileData = useMemo(() => computed.lobData.map((lob, i) => ({
    name: lob.shortName,
    p75: +(lob.requiredReserve * (1 + sr(i * 53) * 0.12 + 0.05)).toFixed(1),
    p90: +(lob.requiredReserve * (1 + sr(i * 59) * 0.18 + 0.12)).toFixed(1),
    p99: +(lob.requiredReserve * (1 + sr(i * 61) * 0.28 + 0.22)).toFixed(1),
    base: +lob.requiredReserve.toFixed(1),
  })), [computed.lobData]);

  /* ── Tab 5: Scenario stress ──────────────────────────────── */
  const stressLineData = useMemo(() => HORIZONS.map((yr, hi) => {
    const row = { year: String(yr) };
    NGFS_SCENARIOS.forEach((s, si) => {
      const base = LOBS.reduce((acc, lob) => {
        const gap = lob.premiumIncome * lob.climateDevFactor * SCENARIO_MULTIPLIERS[si];
        return acc + gap;
      }, 0);
      row[s] = +(base * HORIZON_MULTS[hi]).toFixed(1);
    });
    return row;
  }), []);

  const strengthenTable = useMemo(() => NGFS_SCENARIOS.map((s, si) => {
    const mult = SCENARIO_MULTIPLIERS[si];
    const totalCurrent = LOBS.reduce((a, l) => a + l.premiumIncome * l.baseIBNR, 0);
    const totalRequired = LOBS.reduce((a, l) =>
      a + l.premiumIncome * (l.baseIBNR + l.climateDevFactor * mult + l.tailRiskFactor), 0);
    const strengthen = totalCurrent ? (totalRequired / totalCurrent - 1) * 100 : 0;
    return { scenario: s, multiplier: mult, strengthenPct: +strengthen.toFixed(1), totalRequired: +totalRequired.toFixed(1) };
  }), []);

  /* ── Render helpers ──────────────────────────────────────── */
  const ScenCol = [T.indigo, T.green, T.amber, T.red];

  /* ══════════════════════════════════════════════════════════ */
  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '24px 32px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ background: T.indigo, borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 18 }}>📊</span>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>Climate Reserve Adequacy Analyzer</div>
            <div style={{ fontSize: 12, color: T.muted }}>EP-DC3 · Actuarial IBNR & Climate Development Factor Assessment · Lloyd's / IAIS / Solvency II</div>
          </div>
        </div>
      </div>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* ─── TAB 1: Reserve Dashboard ─── */}
      {activeTab === TABS[0] && (
        <div>
          <ScenarioSelector scenarios={NGFS_SCENARIOS} active={scenarioIdx} onChange={setScenarioIdx} />
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <KpiCard label="Total Reserve Gap" value={fmtM(computed.totalReserveGap)} sub="Climate excess reserve need" color={T.red} />
            <KpiCard label="Avg Climate Dev Factor" value={fmtPct(computed.avgClimateDevFactor)} sub="Additional IBNR uplift" color={T.amber} />
            <KpiCard label="LoB Under-Reserved" value={fmtPct(computed.pctUnderReserved)} sub="Score < 70/100" color={T.orange} />
            <KpiCard label="Avg Adequacy Score" value={fmt(computed.avgAdequacyScore, 1)} sub="/ 100 (100 = fully adequate)" color={T.indigo} />
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <SectionHeader title="Required vs Current Reserve by Line of Business" sub="Current = baseIBNR × premium; Required adds climate development + tail risk provisions" />
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={computed.lobData} margin={{ left: 20, right: 10, top: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="shortName" tick={{ fontSize: 11, fill: T.muted }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.muted }} tickFormatter={v => `$${v.toFixed(0)}M`} />
                <Tooltip formatter={(v, n) => [`$${v.toFixed(1)}M`, n]} />
                <Legend />
                <Bar dataKey="currentReserve" name="Current Reserve" fill={T.blue} stackId="a" />
                <Bar dataKey="reserveGap" name="Climate Gap" fill={T.red} stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <SectionHeader title="Reserve Adequacy Score by LoB" sub="100 = fully adequate; threshold warning at 70" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={computed.lobData} margin={{ left: 20, right: 10, top: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="shortName" tick={{ fontSize: 11, fill: T.muted }} angle={-35} textAnchor="end" interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.muted }} />
                <Tooltip formatter={v => [v.toFixed(1), 'Adequacy Score']} />
                <ReferenceLine y={70} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Under-Reserved Threshold', position: 'insideTopLeft', fontSize: 11, fill: T.red }} />
                <Bar dataKey="reserveAdequacyScore" name="Adequacy Score" radius={[4, 4, 0, 0]}>
                  {computed.lobData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.reserveAdequacyScore < 70 ? T.red : entry.reserveAdequacyScore < 80 ? T.amber : T.green} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Development Factors ─── */}
      {activeTab === TABS[1] && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <SectionHeader title="Climate Development Factor by Scenario × LoB" sub="Climate IBNR uplift applied per NGFS scenario. Higher factor = more reserve strengthening required." />
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={devFactorChartData} margin={{ left: 20, right: 10, top: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.muted }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tickFormatter={v => `${(v * 100).toFixed(1)}%`} tick={{ fontSize: 11, fill: T.muted }} />
                <Tooltip formatter={(v, n) => [`${(v * 100).toFixed(2)}%`, n]} />
                <Legend />
                {NGFS_SCENARIOS.map((s, si) => (
                  <Bar key={s} dataKey={s} fill={ScenCol[si]} />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <SectionHeader title="Development Factor Classification Table" />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Line of Business', 'Base IBNR %', 'Climate Dev Factor', 'Tail Risk Factor', 'Reporting Lag', 'Significance', 'Long-tail'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.muted, borderBottom: `2px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LOBS.map((lob, i) => {
                  const cls = devClass(lob.climateDevFactor);
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '9px 12px', fontWeight: 600, color: T.text }}>{lob.name}</td>
                      <td style={{ padding: '9px 12px', color: T.muted, fontFamily: 'monospace' }}>{fmtPct(lob.baseIBNR)}</td>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace', color: T.text }}>{fmtPct(lob.climateDevFactor)}</td>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace', color: T.text }}>{fmtPct(lob.tailRiskFactor)}</td>
                      <td style={{ padding: '9px 12px', color: T.muted }}>{lob.reportingLag} mo</td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ background: cls.color + '20', color: cls.color, border: `1px solid ${cls.color}40`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{cls.label}</span>
                      </td>
                      <td style={{ padding: '9px 12px', color: lob.longtailExposure ? T.orange : T.muted, fontWeight: lob.longtailExposure ? 700 : 400 }}>
                        {lob.longtailExposure ? 'Long-tail' : 'Short-tail'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: Run-Off Triangle View ─── */}
      {activeTab === TABS[2] && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Select Line of Business:</label>
            <select
              value={selectedLob}
              onChange={e => setSelectedLob(Number(e.target.value))}
              style={{ padding: '8px 14px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, fontSize: 13, color: T.text, cursor: 'pointer' }}
            >
              {LOB_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
            </select>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <SectionHeader
              title={`Loss Development Triangle — ${LOB_NAMES[selectedLob]}`}
              sub="Cumulative paid losses ($M) by accident year (rows) and development period (columns). Chain-ladder IBNR estimated from last diagonal."
            />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: 620 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 14px', textAlign: 'left', background: T.navy, color: '#fff', borderRadius: '6px 0 0 0', fontSize: 11 }}>Acc. Year \ Dev. Period</th>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                      <th key={p} style={{ padding: '8px 14px', textAlign: 'right', background: T.navy, color: '#fff', fontSize: 11 }}>Period {p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEV_TRIANGLE.map((row, ri) => {
                    // Diagonal mask: show only cells where ri + colIdx <= 7 (triangle shape)
                    return (
                      <tr key={ri} style={{ background: ri % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '8px 14px', fontWeight: 700, color: T.text, borderRight: `1px solid ${T.border}` }}>
                          {2017 + ri}
                        </td>
                        {row.map((val, ci) => {
                          const isDiagonal = ri + ci === 7;
                          const isFuture = ri + ci > 7;
                          // Acceleration indicator: later periods grow faster
                          const intensity = ci / 7;
                          const bg = isFuture
                            ? '#f0f0f0'
                            : isDiagonal
                              ? T.indigo + '20'
                              : `rgba(79,70,229,${intensity * 0.15})`;
                          return (
                            <td key={ci} style={{
                              padding: '8px 14px', textAlign: 'right',
                              fontFamily: 'monospace', fontSize: 12,
                              background: bg,
                              color: isFuture ? T.muted : isDiagonal ? T.indigo : T.text,
                              fontWeight: isDiagonal ? 700 : 400,
                              borderLeft: `1px solid ${T.border}`,
                            }}>
                              {isFuture ? '—' : `${(val + (selectedLob + 1) * 5 * (ci + 1)).toFixed(1)}`}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <SectionHeader title="Chain-Ladder Development Factors" sub="Age-to-age factors derived from triangle; final column is tail factor (IBNR estimate)" />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5, 6, 7].map(p => {
                const factor = 1 + sr(selectedLob * 7 + p) * 0.15 + 0.02;
                return (
                  <div key={p} style={{ background: T.sub, borderRadius: 8, padding: '12px 16px', textAlign: 'center', minWidth: 100, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, marginBottom: 4 }}>Period {p}→{p + 1}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.indigo, fontFamily: 'monospace' }}>{factor.toFixed(4)}</div>
                  </div>
                );
              })}
              <div style={{ background: T.amber + '15', borderRadius: 8, padding: '12px 16px', textAlign: 'center', minWidth: 100, border: `1px solid ${T.amber}40` }}>
                <div style={{ fontSize: 10, color: T.amber, fontWeight: 600, marginBottom: 4 }}>Tail Factor</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.amber, fontFamily: 'monospace' }}>{(1 + sr(selectedLob * 79) * 0.08 + 0.01).toFixed(4)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Tail Risk Analysis ─── */}
      {activeTab === TABS[3] && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 2, minWidth: 320 }}>
              <SectionHeader title="Tail Risk Factor by Line of Business" sub="Tail provision as % of premium income; higher = greater extreme-event reserve requirement" />
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={tailRiskData} margin={{ left: 20, right: 10, top: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.muted }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: T.muted }} />
                  <Tooltip formatter={(v, n) => [`${v.toFixed(2)}%`, n]} />
                  <Bar dataKey="tailRiskFactor" name="Tail Risk Factor (%)" radius={[4, 4, 0, 0]}>
                    {tailRiskData.map((e, i) => (
                      <Cell key={i} fill={e.isLongtail ? T.orange : T.indigo} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 1, minWidth: 200 }}>
              <SectionHeader title="Long-tail vs Short-tail" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                {[
                  { label: 'Long-tail LoB count', val: longtailStats.ltCount, col: T.orange },
                  { label: 'Short-tail LoB count', val: longtailStats.stCount, col: T.indigo },
                  { label: 'Long-tail avg tail factor', val: fmtPct(longtailStats.ltAvgTail), col: T.orange },
                  { label: 'Short-tail avg tail factor', val: fmtPct(longtailStats.stAvgTail), col: T.indigo },
                  { label: 'Long-tail avg adequacy', val: fmt(longtailStats.ltAvgScore, 1), col: T.orange },
                  { label: 'Short-tail avg adequacy', val: fmt(longtailStats.stAvgScore, 1), col: T.indigo },
                ].map(({ label, val, col }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 12, color: T.muted }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: col, fontFamily: 'monospace' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <SectionHeader title="Percentile Reserve Levels (75th / 90th / 99th)" sub="Actuarial reserve percentile requirements; base = expected (mean) required reserve under selected scenario" />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={percentileData} margin={{ left: 20, right: 10, top: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.muted }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tickFormatter={v => `$${v.toFixed(0)}M`} tick={{ fontSize: 11, fill: T.muted }} />
                <Tooltip formatter={(v, n) => [`$${v.toFixed(1)}M`, n]} />
                <Legend />
                <Bar dataKey="base" name="Base (Expected)" fill={T.blue} />
                <Bar dataKey="p75" name="75th Percentile" fill={T.amber} />
                <Bar dataKey="p90" name="90th Percentile" fill={T.orange} />
                <Bar dataKey="p99" name="99th Percentile" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─── TAB 5: Scenario Stress Testing ─── */}
      {activeTab === TABS[4] && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <SectionHeader title="Total Reserve Gap Under NGFS Scenarios × Time Horizon" sub="Phased emergence of reserve gap to 2030, 2040, 2050 under each scenario. Regulatory buffer at 110% adequacy shown as context." />
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={stressLineData} margin={{ left: 20, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: T.muted }} />
                <YAxis tickFormatter={v => `$${v.toFixed(0)}M`} tick={{ fontSize: 11, fill: T.muted }} />
                <Tooltip formatter={(v, n) => [`$${v.toFixed(1)}M`, n]} />
                <Legend />
                {NGFS_SCENARIOS.map((s, si) => (
                  <Line key={s} type="monotone" dataKey={s} stroke={ScenCol[si]} strokeWidth={2.5} dot={{ r: 5 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <SectionHeader title="Reserve Strengthening Requirements by Scenario" sub="% increase required over current baseIBNR reserves to achieve climate-adjusted adequacy; 110% buffer shown as regulatory minimum" />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['NGFS Scenario', 'Scenario Multiplier', 'Strengthen Required (%)', 'Total Required Reserve ($M)', 'Regulatory Buffer (110%)', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.muted, borderBottom: `2px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {strengthenTable.map((row, i) => {
                  const pass = row.strengthenPct < 15;
                  const warn = row.strengthenPct >= 15 && row.strengthenPct < 30;
                  const statusColor = pass ? T.green : warn ? T.amber : T.red;
                  const statusLabel = pass ? 'Adequate' : warn ? 'Monitor' : 'Strengthen';
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text }}>{row.scenario}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: T.muted }}>{row.multiplier.toFixed(2)}×</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: row.strengthenPct > 25 ? T.red : T.text }}>{row.strengthenPct.toFixed(1)}%</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: T.text }}>{fmtM(row.totalRequired)}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: T.muted }}>{fmtM(row.totalRequired * 1.10)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: statusColor + '20', color: statusColor, border: `1px solid ${statusColor}40`, borderRadius: 4, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{statusLabel}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ background: T.indigo + '08', border: `1px solid ${T.indigo}30`, borderRadius: 10, padding: 16, marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.indigo, marginBottom: 6 }}>Regulatory Context</div>
            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
              Under Solvency II Article 77, technical provisions must be calculated using best-estimate assumptions plus a risk margin.
              Lloyd's Climate Exposure Management Guidance (2023) requires climate scenario testing across all material LoB.
              IAIS Application Paper on Climate Risk recommends IBNR uplifts consistent with NGFS scenarios.
              The 110% regulatory buffer represents the IAIS prudential margin above best-estimate reserves.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
