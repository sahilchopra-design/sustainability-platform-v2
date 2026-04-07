import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ReferenceLine, ComposedChart
} from 'recharts';

// ─── Module-level constants ────────────────────────────────────────────────

const BANK_NAMES = [
  'Global Bank A', 'Eurozone Bank B', 'North Atlantic C', 'Pacific Rim D',
  'Continental E', 'Nordic Bank F', 'Sterling Group G', 'Asia Pacific H',
  'Federal Reserve I', 'Sovereign Trust J', 'First National K', 'Alpine Bank L',
  'Atlantic Trust M', 'Meridian Bank N', 'Nordic Capital O', 'Gulf Finance P',
  'Eastern Commercial Q', 'West Coast R', 'Central Clearing S', 'Harbor Trust T',
  'Highland Bank U', 'Coastal Finance V', 'Riverside Group W', 'Summit Bank X',
  'Regional Bank Y',
];

const SECTORS = ['Banking', 'Insurance', 'Asset Management'];
const JURISDICTIONS = ['EU', 'UK', 'North America', 'APAC'];

const SCENARIOS = [
  { name: 'Baseline',         pillar2Add: 0.5,  haircut: 1.00 },
  { name: 'Orderly 1.5°C',   pillar2Add: 1.2,  haircut: 0.95 },
  { name: 'Disorderly 2°C',  pillar2Add: 2.8,  haircut: 0.88 },
  { name: 'Hot House 3°C',   pillar2Add: 4.5,  haircut: 0.78 },
  { name: 'Tail Risk 4°C+',  pillar2Add: 7.2,  haircut: 0.65 },
];

const SECTOR_HAIRCUTS = [
  { sector: 'Energy',        haircut: 0.85, description: 'High fossil fuel exposure' },
  { sector: 'Real Estate',   haircut: 0.90, description: 'Physical risk & stranding' },
  { sector: 'Transport',     haircut: 0.92, description: 'Transition & EV disruption' },
  { sector: 'Utilities',     haircut: 0.88, description: 'Grid decarbonisation risk' },
  { sector: 'Manufacturing', haircut: 0.94, description: 'Carbon border adjustment' },
  { sector: 'Other',         haircut: 0.98, description: 'Diversified exposure' },
];

const SUPERVISORY_THRESHOLDS = {
  ecb:  { minTier1: 0.10, pillar2Trigger: 2.0, label: 'ECB SREP Floor' },
  pra:  { minTier1: 0.10, pillar2Trigger: 1.5, label: 'PRA SS3/19' },
  osfi: { minTier1: 0.11, pillar2Trigger: 1.8, label: 'OSFI B-15' },
};

const TABS = [
  'Capital Adequacy Overview',
  'Scenario Stress Matrix',
  'Climate RWA Decomposition',
  'Sector Concentration',
  'Supervisory Benchmarks',
];

const JURIS_COLORS = { EU: '#4f46e5', UK: '#0369a1', 'North America': '#16a34a', APAC: '#d97706' };

// ─── Component ────────────────────────────────────────────────────────────

export default function ClimateCapitalAdequacyPage() {
  const T = {
    bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
    sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
    green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
    navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
  };

  const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

  const [activeTab, setActiveTab] = useState(0);
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(2);
  const [selectedBankIdx, setSelectedBankIdx] = useState(0);

  const selectedScenario = SCENARIOS[selectedScenarioIdx];

  // ── Generate banks ────────────────────────────────────────────────────
  const BANKS = useMemo(() => Array.from({ length: 25 }, (_, i) => ({
    id: i,
    name: BANK_NAMES[i],
    totalRWA: sr(i * 13) * 800 + 200,
    tier1Capital: sr(i * 17) * 0.15 + 0.08,
    climateExposure: sr(i * 23) * 0.35 + 0.05,
    physicalRisk: sr(i * 31) * 40 + 5,
    transitionRisk: sr(i * 37) * 45 + 10,
    sector: SECTORS[i % 3],
    jurisdiction: JURISDICTIONS[i % 4],
    carbonIntensive: sr(i * 41) > 0.6,
  })), []);

  // ── Compute per-bank capital metrics for selected scenario ─────────────
  const bankMetrics = useMemo(() => {
    return BANKS.map(b => {
      const climateRWA = b.totalRWA * b.climateExposure;
      const pillar2AddOn = climateRWA * (selectedScenario.pillar2Add / 100);
      const adjustedTier1 = (b.tier1Capital * b.totalRWA - pillar2AddOn) / Math.max(1, b.totalRWA);
      const capitalShortfall = adjustedTier1 < 0.10 ? (0.10 - adjustedTier1) * b.totalRWA : 0;
      const adjHaircutTier1 = adjustedTier1 * selectedScenario.haircut;
      return {
        ...b,
        climateRWA,
        pillar2AddOn,
        adjustedTier1,
        adjHaircutTier1,
        capitalShortfall,
        nonClimateRWA: b.totalRWA - climateRWA,
        climateRWAPct: b.totalRWA > 0 ? (climateRWA / b.totalRWA) * 100 : 0,
      };
    });
  }, [BANKS, selectedScenario]);

  // ── Portfolio-level KPIs ───────────────────────────────────────────────
  const kpis = useMemo(() => {
    if (!bankMetrics.length) return { avgPillar2AddOn: 0, totalCapitalAtRisk: 0, pctShortfall: 0, avgClimateRWAPct: 0 };
    const avgPillar2AddOn = bankMetrics.reduce((s, b) => s + b.pillar2AddOn, 0) / bankMetrics.length;
    const totalCapitalAtRisk = bankMetrics.reduce((s, b) => s + b.capitalShortfall, 0);
    const shortfallCount = bankMetrics.filter(b => b.capitalShortfall > 0).length;
    const pctShortfall = (shortfallCount / bankMetrics.length) * 100;
    const avgClimateRWAPct = bankMetrics.reduce((s, b) => s + b.climateRWAPct, 0) / bankMetrics.length;
    return { avgPillar2AddOn, totalCapitalAtRisk, pctShortfall, avgClimateRWAPct };
  }, [bankMetrics]);

  // ── Scenario stress matrix for selected bank ──────────────────────────
  const scenarioMatrix = useMemo(() => {
    const b = bankMetrics[selectedBankIdx];
    if (!b) return [];
    return SCENARIOS.map(sc => {
      const climateRWA = b.climateRWA;
      const addOn = climateRWA * (sc.pillar2Add / 100);
      const adjT1 = (b.tier1Capital * b.totalRWA - addOn) / Math.max(1, b.totalRWA);
      const shortfall = adjT1 < 0.10 ? (0.10 - adjT1) * b.totalRWA : 0;
      return {
        scenario: sc.name,
        pillar2Add: sc.pillar2Add,
        addOn: addOn.toFixed(2),
        adjTier1: (adjT1 * 100).toFixed(2),
        haircutTier1: (adjT1 * sc.haircut * 100).toFixed(2),
        shortfall: shortfall.toFixed(2),
        status: adjT1 >= 0.12 ? 'Strong' : adjT1 >= 0.10 ? 'Adequate' : 'Shortfall',
      };
    });
  }, [bankMetrics, selectedBankIdx]);

  // ── Top 15 banks by pillar2AddOn ──────────────────────────────────────
  const top15Banks = useMemo(() => {
    return [...bankMetrics]
      .sort((a, b) => b.pillar2AddOn - a.pillar2AddOn)
      .slice(0, 15)
      .map(b => ({ name: b.name.split(' ').slice(-1)[0] + ' ' + b.name.split(' ').slice(0, 1)[0], pillar2AddOn: +b.pillar2AddOn.toFixed(3), jurisdiction: b.jurisdiction }));
  }, [bankMetrics]);

  // ── Sector concentration data ─────────────────────────────────────────
  const sectorData = useMemo(() => {
    return SECTOR_HAIRCUTS.map((sh, idx) => {
      const banksInSector = bankMetrics.filter(b => b.sector === SECTORS[idx % 3]);
      const totalExposure = banksInSector.reduce((s, b) => s + b.climateRWA, 0);
      const capitalImpact = totalExposure * (1 - sh.haircut);
      return { ...sh, totalExposure: +totalExposure.toFixed(1), capitalImpact: +capitalImpact.toFixed(1), bankCount: banksInSector.length };
    });
  }, [bankMetrics]);

  // ── Scatter data for supervisory benchmarks ───────────────────────────
  const scatterData = useMemo(() => {
    return bankMetrics.map(b => ({
      x: +b.physicalRisk.toFixed(1),
      y: +b.transitionRisk.toFixed(1),
      shortfall: b.capitalShortfall,
      name: b.name,
      jurisdiction: b.jurisdiction,
    }));
  }, [bankMetrics]);

  // ── Helpers ───────────────────────────────────────────────────────────
  const statusColor = (s) => s === 'Strong' ? T.green : s === 'Adequate' ? T.amber : T.red;

  const styles = {
    page: { background: T.bg, minHeight: '100vh', padding: '24px', fontFamily: "'DM Sans', system-ui, sans-serif", color: T.text },
    header: { marginBottom: '24px' },
    title: { fontSize: '22px', fontWeight: 700, color: T.navy, margin: 0 },
    subtitle: { fontSize: '13px', color: T.muted, marginTop: '4px' },
    tabBar: { display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `2px solid ${T.border}`, paddingBottom: '0' },
    tab: (active) => ({
      padding: '10px 16px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: active ? 600 : 400,
      background: active ? T.indigo : 'transparent', color: active ? '#fff' : T.muted,
      borderRadius: '6px 6px 0 0', transition: 'all 0.15s',
    }),
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
    kpiCard: { background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '18px 20px' },
    kpiLabel: { fontSize: '11px', fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' },
    kpiValue: { fontSize: '26px', fontWeight: 700, color: T.navy, margin: '6px 0 2px' },
    kpiSub: { fontSize: '12px', color: T.muted },
    card: { background: T.card, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '20px', marginBottom: '20px' },
    cardTitle: { fontSize: '14px', fontWeight: 600, color: T.navy, marginBottom: '16px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { padding: '8px 12px', background: T.sub, color: T.muted, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left', borderBottom: `1px solid ${T.border}` },
    td: { padding: '9px 12px', borderBottom: `1px solid ${T.border}`, color: T.text },
    select: { padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: '6px', background: T.card, color: T.text, fontSize: '13px' },
    row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>EP-DB1 — Climate Capital Adequacy Engine</h1>
        <p style={styles.subtitle}>
          Pillar 2 climate risk capital add-on calculator · BCBS climate guidance · ECB supervisory expectations · PRA SS3/19 · Basel IV haircuts
        </p>
      </div>

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        {TABS.map((t, i) => (
          <button key={t} style={styles.tab(activeTab === i)} onClick={() => setActiveTab(i)}>{t}</button>
        ))}
      </div>

      {/* ── Tab 0: Capital Adequacy Overview ── */}
      {activeTab === 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', color: T.muted, fontWeight: 600 }}>Basel Scenario:</label>
            <select style={styles.select} value={selectedScenarioIdx} onChange={e => setSelectedScenarioIdx(+e.target.value)}>
              {SCENARIOS.map((sc, i) => <option key={sc.name} value={i}>{sc.name}</option>)}
            </select>
          </div>

          <div style={styles.kpiGrid}>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Avg Pillar 2 Add-On</div>
              <div style={styles.kpiValue}>${kpis.avgPillar2AddOn.toFixed(2)}B</div>
              <div style={styles.kpiSub}>{selectedScenario.name} scenario</div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Total Capital At Risk</div>
              <div style={{ ...styles.kpiValue, color: kpis.totalCapitalAtRisk > 50 ? T.red : T.amber }}>${kpis.totalCapitalAtRisk.toFixed(1)}B</div>
              <div style={styles.kpiSub}>Portfolio shortfall sum</div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Banks with Shortfall</div>
              <div style={{ ...styles.kpiValue, color: kpis.pctShortfall > 30 ? T.red : T.green }}>{kpis.pctShortfall.toFixed(1)}%</div>
              <div style={styles.kpiSub}>Below 10% Tier 1 threshold</div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Avg Climate RWA %</div>
              <div style={styles.kpiValue}>{kpis.avgClimateRWAPct.toFixed(1)}%</div>
              <div style={styles.kpiSub}>Of total risk-weighted assets</div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Top 15 Banks — Pillar 2 Add-On by Scenario ($ Billions)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top15Banks} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v.toFixed(2)}B`} />
                <Tooltip formatter={(v) => [`$${v.toFixed(3)}B`, 'Pillar 2 Add-On']} />
                <Bar dataKey="pillar2AddOn" radius={[3, 3, 0, 0]} name="Pillar 2 Add-On">
                  {top15Banks.map((b, i) => (
                    <Cell key={i} fill={JURIS_COLORS[b.jurisdiction] || T.indigo} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
              {Object.entries(JURIS_COLORS).map(([j, c]) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: T.muted }}>
                  <div style={{ width: 10, height: 10, borderRadius: '2px', background: c }} />
                  {j}
                </div>
              ))}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>All Banks — Capital Status Summary</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Bank', 'Jurisdiction', 'Total RWA ($B)', 'Climate RWA ($B)', 'Pillar 2 Add-On ($B)', 'Adj. Tier 1 (%)', 'Shortfall ($B)', 'Status'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bankMetrics.map(b => (
                    <tr key={b.id}>
                      <td style={styles.td}>{b.name}</td>
                      <td style={styles.td}>{b.jurisdiction}</td>
                      <td style={styles.td}>{b.totalRWA.toFixed(1)}</td>
                      <td style={styles.td}>{b.climateRWA.toFixed(1)}</td>
                      <td style={styles.td}>{b.pillar2AddOn.toFixed(3)}</td>
                      <td style={{ ...styles.td, fontWeight: 600, color: b.adjustedTier1 < 0.10 ? T.red : T.green }}>
                        {(b.adjustedTier1 * 100).toFixed(2)}%
                      </td>
                      <td style={{ ...styles.td, color: b.capitalShortfall > 0 ? T.red : T.muted }}>
                        {b.capitalShortfall > 0 ? b.capitalShortfall.toFixed(2) : '—'}
                      </td>
                      <td style={{ ...styles.td }}>
                        <span style={{ background: b.capitalShortfall > 0 ? '#fef2f2' : '#f0fdf4', color: b.capitalShortfall > 0 ? T.red : T.green, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                          {b.capitalShortfall > 0 ? 'Shortfall' : 'Adequate'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 1: Scenario Stress Matrix ── */}
      {activeTab === 1 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', color: T.muted, fontWeight: 600 }}>Select Bank:</label>
            <select style={styles.select} value={selectedBankIdx} onChange={e => setSelectedBankIdx(+e.target.value)}>
              {bankMetrics.map((b, i) => <option key={b.id} value={i}>{b.name}</option>)}
            </select>
          </div>

          {bankMetrics[selectedBankIdx] && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>Total RWA</div>
                <div style={styles.kpiValue}>${bankMetrics[selectedBankIdx].totalRWA.toFixed(1)}B</div>
              </div>
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>Climate RWA</div>
                <div style={styles.kpiValue}>${bankMetrics[selectedBankIdx].climateRWA.toFixed(1)}B</div>
                <div style={styles.kpiSub}>{bankMetrics[selectedBankIdx].climateRWAPct.toFixed(1)}% of total</div>
              </div>
              <div style={styles.kpiCard}>
                <div style={styles.kpiLabel}>Base Tier 1 Ratio</div>
                <div style={styles.kpiValue}>{(bankMetrics[selectedBankIdx].tier1Capital * 100).toFixed(2)}%</div>
              </div>
            </div>
          )}

          <div style={styles.card}>
            <div style={styles.cardTitle}>Scenario Stress Matrix — {bankMetrics[selectedBankIdx]?.name}</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Scenario', 'Pillar 2 Rate (%)', 'Capital Add-On ($B)', 'Adj. Tier 1 (%)', 'Haircut Tier 1 (%)', 'Shortfall ($B)', 'Status'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scenarioMatrix.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : T.sub }}>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{row.scenario}</td>
                      <td style={styles.td}>{row.pillar2Add}%</td>
                      <td style={styles.td}>${row.addOn}B</td>
                      <td style={{ ...styles.td, color: +row.adjTier1 < 10 ? T.red : T.green, fontWeight: 600 }}>{row.adjTier1}%</td>
                      <td style={{ ...styles.td, color: +row.haircutTier1 < 10 ? T.red : T.amber, fontWeight: 600 }}>{row.haircutTier1}%</td>
                      <td style={{ ...styles.td, color: +row.shortfall > 0 ? T.red : T.muted }}>{+row.shortfall > 0 ? `$${row.shortfall}B` : '—'}</td>
                      <td style={styles.td}>
                        <span style={{ background: row.status === 'Strong' ? '#f0fdf4' : row.status === 'Adequate' ? '#fffbeb' : '#fef2f2', color: statusColor(row.status), padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Capital Ratio Under Each Scenario</div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={scenarioMatrix} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                <Legend />
                <ReferenceLine y={10} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Min 10%', fill: T.red, fontSize: 11 }} />
                <ReferenceLine y={12} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'Buffer 12%', fill: T.amber, fontSize: 11 }} />
                <Line type="monotone" dataKey="adjTier1" name="Adj. Tier 1 (%)" stroke={T.indigo} strokeWidth={2} dot={{ r: 5, fill: T.indigo }} />
                <Line type="monotone" dataKey="haircutTier1" name="Haircut Tier 1 (%)" stroke={T.orange} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Tab 2: Climate RWA Decomposition ── */}
      {activeTab === 2 && (
        <div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Climate vs Non-Climate RWA — All 25 Banks ($ Billions)</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart
                data={bankMetrics.map(b => ({
                  name: b.name.replace('Bank ', 'B.').replace('Group ', 'G.').replace('Capital ', 'Cap.').replace('Finance ', 'Fin.'),
                  climateRWA: +b.climateRWA.toFixed(1),
                  nonClimateRWA: +b.nonClimateRWA.toFixed(1),
                  jurisdiction: b.jurisdiction,
                }))}
                margin={{ top: 5, right: 20, left: 10, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}B`} />
                <Tooltip formatter={(v, n) => [`$${v}B`, n]} />
                <Legend verticalAlign="top" />
                <Bar dataKey="climateRWA" stackId="a" name="Climate RWA" fill={T.red} />
                <Bar dataKey="nonClimateRWA" stackId="a" name="Non-Climate RWA" fill={T.blue} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Climate RWA % by Jurisdiction — Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={JURISDICTIONS.map(j => {
                  const jBanks = bankMetrics.filter(b => b.jurisdiction === j);
                  const avgPct = jBanks.length ? jBanks.reduce((s, b) => s + b.climateRWAPct, 0) / jBanks.length : 0;
                  const maxPct = jBanks.length ? Math.max(...jBanks.map(b => b.climateRWAPct)) : 0;
                  const minPct = jBanks.length ? Math.min(...jBanks.map(b => b.climateRWAPct)) : 0;
                  return { jurisdiction: j, avgPct: +avgPct.toFixed(1), maxPct: +maxPct.toFixed(1), minPct: +minPct.toFixed(1) };
                })}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="jurisdiction" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                <Legend />
                <Bar dataKey="minPct" name="Min Climate RWA %" fill={T.green} radius={[2, 2, 0, 0]} />
                <Bar dataKey="avgPct" name="Avg Climate RWA %" fill={T.amber} radius={[2, 2, 0, 0]} />
                <Bar dataKey="maxPct" name="Max Climate RWA %" fill={T.red} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Tab 3: Sector Concentration ── */}
      {activeTab === 3 && (
        <div>
          <div style={styles.row2}>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Sector Capital Haircuts (PRA SS3/19 Framework)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sectorData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0.6, 1.0]} tickFormatter={v => (v * 100).toFixed(0) + '%'} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${(v * 100).toFixed(1)}%`, 'Capital Haircut']} />
                  <Bar dataKey="haircut" name="Haircut Factor" fill={T.indigo} radius={[3, 3, 0, 0]}>
                    {sectorData.map((d, i) => (
                      <Cell key={i} fill={d.haircut < 0.90 ? T.red : d.haircut < 0.95 ? T.amber : T.green} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Sector Exposure & Capital Impact</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sectorData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v.toFixed(0)}B`} />
                  <Tooltip formatter={(v, n) => [`$${v.toFixed(1)}B`, n]} />
                  <Legend />
                  <Bar dataKey="totalExposure" name="Climate Exposure ($B)" fill={T.blue} />
                  <Bar dataKey="capitalImpact" name="Capital Impact ($B)" fill={T.red} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Sector Concentration Detail</div>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Sector', 'Haircut Factor', 'Total Exposure ($B)', 'Capital Impact ($B)', 'Bank Count', 'Risk Description'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectorData.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : T.sub }}>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{row.sector}</td>
                    <td style={{ ...styles.td, color: row.haircut < 0.90 ? T.red : T.green, fontWeight: 600 }}>{(row.haircut * 100).toFixed(0)}%</td>
                    <td style={styles.td}>${row.totalExposure.toFixed(1)}B</td>
                    <td style={{ ...styles.td, color: T.red }}>${row.capitalImpact.toFixed(1)}B</td>
                    <td style={styles.td}>{row.bankCount}</td>
                    <td style={{ ...styles.td, color: T.muted, fontSize: '12px' }}>{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 4: Supervisory Benchmarks ── */}
      {activeTab === 4 && (
        <div>
          <div style={styles.row2}>
            {Object.entries(SUPERVISORY_THRESHOLDS).map(([key, thresh]) => (
              <div key={key} style={{ ...styles.kpiCard, borderLeft: `4px solid ${T.indigo}` }}>
                <div style={styles.kpiLabel}>{thresh.label}</div>
                <div style={{ fontSize: '13px', marginTop: '8px', color: T.text }}>
                  <div>Min Tier 1: <strong>{(thresh.minTier1 * 100).toFixed(0)}%</strong></div>
                  <div style={{ marginTop: '4px' }}>Pillar 2 Trigger: <strong>{thresh.pillar2Trigger}%</strong></div>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Physical Risk vs Transition Risk — Colored by Capital Shortfall</div>
            <div style={{ fontSize: '12px', color: T.muted, marginBottom: '12px' }}>
              Bubble color: <span style={{ color: T.red, fontWeight: 600 }}>Red = capital shortfall</span> · <span style={{ color: T.green, fontWeight: 600 }}>Green = adequate capital</span> · Circle = carbon-intensive
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Physical Risk Score" type="number" domain={[0, 50]} tick={{ fontSize: 11 }} label={{ value: 'Physical Risk Score', position: 'insideBottom', offset: -10, fontSize: 12 }} />
                <YAxis dataKey="y" name="Transition Risk Score" type="number" domain={[0, 60]} tick={{ fontSize: 11 }} label={{ value: 'Transition Risk', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{d.name}</div>
                        <div>Physical Risk: {d.x}</div>
                        <div>Transition Risk: {d.y}</div>
                        <div style={{ color: d.shortfall > 0 ? T.red : T.green }}>
                          Shortfall: {d.shortfall > 0 ? `$${d.shortfall.toFixed(2)}B` : 'None'}
                        </div>
                      </div>
                    );
                  }}
                />
                <Scatter
                  data={scatterData}
                  shape={(props) => {
                    const { cx, cy, payload } = props;
                    const color = payload.shortfall > 0 ? T.red : T.green;
                    return <circle cx={cx} cy={cy} r={6} fill={color} opacity={0.75} stroke={color} strokeWidth={1.5} />;
                  }}
                />
                <ReferenceLine x={25} stroke={T.amber} strokeDasharray="4 4" />
                <ReferenceLine y={30} stroke={T.amber} strokeDasharray="4 4" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Supervisory Compliance Summary</div>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Framework', 'Min Tier 1', 'Pillar 2 Trigger', 'Banks Compliant', 'Banks Non-Compliant', 'Coverage'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(SUPERVISORY_THRESHOLDS).map(([key, thresh], i) => {
                  const compliant = bankMetrics.filter(b => b.adjustedTier1 >= thresh.minTier1).length;
                  const nonCompliant = bankMetrics.length - compliant;
                  return (
                    <tr key={key} style={{ background: i % 2 === 0 ? '#fff' : T.sub }}>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{thresh.label}</td>
                      <td style={styles.td}>{(thresh.minTier1 * 100).toFixed(0)}%</td>
                      <td style={styles.td}>{thresh.pillar2Trigger}%</td>
                      <td style={{ ...styles.td, color: T.green, fontWeight: 600 }}>{compliant}</td>
                      <td style={{ ...styles.td, color: nonCompliant > 0 ? T.red : T.green, fontWeight: 600 }}>{nonCompliant}</td>
                      <td style={styles.td}>{((compliant / bankMetrics.length) * 100).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
