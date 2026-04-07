import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ComposedChart, Line, LineChart, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const ASSET_CLASSES = ['Corporate Bonds', 'Listed Equity', 'Real Estate', 'Infrastructure', 'Sovereign Bonds', 'Private Markets'];
const BUSINESS_LINES = ['Corporate Banking', 'Investment Banking', 'Asset Management', 'Insurance', 'Retail Banking'];
const ENTITIES = ['HoldCo', 'BankCo UK', 'BankCo EU', 'Asset Mgmt', 'Insurance Sub', 'Private Equity', 'Real Estate Sub', 'Treasury'];

const SCENARIOS = ['Orderly Transition', 'Disorderly Transition', 'Hot House World'];
const SCENARIO_MULT = { 'Orderly Transition': 1.0, 'Disorderly Transition': 1.45, 'Hot House World': 1.82 };

const BL_COLORS = [T.indigo, T.teal, T.gold, T.orange, T.purple];
const AC_COLORS = [T.navy, T.blue, T.teal, T.green, T.gold, T.purple];
const ENTITY_COLORS = [T.indigo, T.navy, T.teal, T.blue, T.orange, T.purple, T.green, T.gold];

const EXPOSURES = Array.from({ length: 30 }, (_, i) => {
  const exposure = sr(i * 13) * 5000 + 100;
  const physRisk = sr(i * 17) * 70 + 10;
  const transRisk = sr(i * 23) * 65 + 15;
  const entityIdx = Math.floor(sr(i * 29) * 8);
  const assetClass = ASSET_CLASSES[i % 6];
  const businessLine = BUSINESS_LINES[Math.floor(sr(i * 37) * 5)];
  const climateVaR95 = exposure * (physRisk + transRisk) / 200 * (sr(i * 41) * 0.15 + 0.05);
  const concentrationRisk = sr(i * 43) * 60 + 20;
  return { id: i, exposure, physRisk, transRisk, entityIdx, entity: ENTITIES[entityIdx], assetClass, businessLine, climateVaR95, concentrationRisk };
});

const TCFD_CHECKLIST = [
  { item: 'Board oversight of climate risks', status: true, category: 'Governance' },
  { item: 'Management role in climate risk assessment', status: true, category: 'Governance' },
  { item: 'Short/medium/long-term climate risk identification', status: true, category: 'Strategy' },
  { item: 'Climate risk impact on strategy and financial planning', status: false, category: 'Strategy' },
  { item: 'Organisational resilience to climate scenarios', status: true, category: 'Strategy' },
  { item: 'Climate risk integration in enterprise risk framework', status: false, category: 'Risk Management' },
  { item: 'Climate risk identification and assessment process', status: true, category: 'Risk Management' },
  { item: 'Climate risk management integration', status: false, category: 'Risk Management' },
  { item: 'GHG emissions and intensity metrics disclosed', status: true, category: 'Metrics & Targets' },
  { item: 'Science-based climate targets adopted', status: false, category: 'Metrics & Targets' },
];

const Kpi = ({ label, value, sub, color, wide }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px', flex: wide ? 2 : 1, minWidth: 140 }}>
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: T.muted, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: color || T.navy, lineHeight: 1.1, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{sub}</div>}
  </div>
);

const tipStyle = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, color: T.text };

const TAB_LABELS = ['Enterprise Dashboard', 'Legal Entity View', 'Business Line Attribution', 'Concentration Risk Map', 'Board Reporting'];

export default function EnterpriseClimateRiskPage() {
  const [tab, setTab] = useState(0);
  const [scenario, setScenario] = useState('Orderly Transition');

  const totalExposure = useMemo(() => EXPOSURES.reduce((s, r) => s + r.exposure, 0), []);
  const aggPhysRisk = useMemo(() => totalExposure > 0 ? EXPOSURES.reduce((s, r) => s + r.physRisk * r.exposure, 0) / totalExposure : 0, [totalExposure]);
  const aggTransRisk = useMemo(() => totalExposure > 0 ? EXPOSURES.reduce((s, r) => s + r.transRisk * r.exposure, 0) / totalExposure : 0, [totalExposure]);
  const standaloneVaR = useMemo(() => EXPOSURES.reduce((s, r) => s + r.climateVaR95, 0), []);
  const enterpriseVaR = useMemo(() => standaloneVaR * 0.75 * SCENARIO_MULT[scenario], [standaloneVaR, scenario]);
  const diversBenefit = useMemo(() => standaloneVaR - standaloneVaR * 0.75, [standaloneVaR]);

  const hhiRaw = useMemo(() => {
    if (totalExposure === 0) return 0;
    return ENTITIES.reduce((sum, ent) => {
      const entExp = EXPOSURES.filter(r => r.entity === ent).reduce((s, r) => s + r.exposure, 0);
      const share = entExp / totalExposure;
      return sum + share * share;
    }, 0) * 10000;
  }, [totalExposure]);

  const byAssetClass = useMemo(() => ASSET_CLASSES.map(ac => {
    const rows = EXPOSURES.filter(r => r.assetClass === ac);
    const exp = rows.reduce((s, r) => s + r.exposure, 0);
    const physAvg = rows.length ? rows.reduce((s, r) => s + r.physRisk, 0) / rows.length : 0;
    const transAvg = rows.length ? rows.reduce((s, r) => s + r.transRisk, 0) / rows.length : 0;
    const var95 = rows.reduce((s, r) => s + r.climateVaR95, 0) * SCENARIO_MULT[scenario];
    return { name: ac, exposure: +exp.toFixed(1), physRisk: +physAvg.toFixed(1), transRisk: +transAvg.toFixed(1), climateVaR: +var95.toFixed(1) };
  }), [scenario]);

  const byEntity = useMemo(() => ENTITIES.map((ent, ei) => {
    const rows = EXPOSURES.filter(r => r.entity === ent);
    const exp = rows.reduce((s, r) => s + r.exposure, 0);
    const physAvg = rows.length ? rows.reduce((s, r) => s + r.physRisk, 0) / rows.length : 0;
    const transAvg = rows.length ? rows.reduce((s, r) => s + r.transRisk, 0) / rows.length : 0;
    const var95 = rows.reduce((s, r) => s + r.climateVaR95, 0) * SCENARIO_MULT[scenario];
    const concAvg = rows.length ? rows.reduce((s, r) => s + r.concentrationRisk, 0) / rows.length : 0;
    return { name: ent, idx: ei, exposure: +exp.toFixed(1), physRisk: +physAvg.toFixed(1), transRisk: +transAvg.toFixed(1), climateVaR: +var95.toFixed(1), concentrationRisk: +concAvg.toFixed(1) };
  }), [scenario]);

  const byBusinessLine = useMemo(() => BUSINESS_LINES.map((bl, bi) => {
    const rows = EXPOSURES.filter(r => r.businessLine === bl);
    const exp = rows.reduce((s, r) => s + r.exposure, 0);
    const physAvg = rows.length ? rows.reduce((s, r) => s + r.physRisk, 0) / rows.length : 0;
    const transAvg = rows.length ? rows.reduce((s, r) => s + r.transRisk, 0) / rows.length : 0;
    const var95 = rows.reduce((s, r) => s + r.climateVaR95, 0) * SCENARIO_MULT[scenario];
    return { name: bl, idx: bi, exposure: +exp.toFixed(1), physRisk: +physAvg.toFixed(1), transRisk: +transAvg.toFixed(1), climateVaR: +var95.toFixed(1) };
  }), [scenario]);

  const hhiByScenario = useMemo(() => SCENARIOS.map(sc => {
    const mult = SCENARIO_MULT[sc];
    const hhi = hhiRaw * (sc === 'Orderly Transition' ? 1.0 : sc === 'Disorderly Transition' ? 1.22 : 1.48);
    return { scenario: sc.replace(' Transition', '').replace(' World', ''), hhi: +hhi.toFixed(0), mult };
  }), [hhiRaw]);

  const top5Concentration = useMemo(() => [...byEntity].sort((a, b) => b.concentrationRisk - a.concentrationRisk).slice(0, 5), [byEntity]);

  const scatterData = useMemo(() => EXPOSURES.map((r, i) => ({
    x: +r.physRisk.toFixed(1),
    y: +r.transRisk.toFixed(1),
    z: +r.exposure.toFixed(0),
    bl: r.businessLine,
    blIdx: BUSINESS_LINES.indexOf(r.businessLine),
    label: r.assetClass,
  })), []);

  const heatmapRiskTypes = ['Physical Risk', 'Transition Risk', 'Climate VaR'];
  const heatmapEntities = ENTITIES.slice(0, 8);

  const riskHeatmap = useMemo(() => heatmapEntities.map(ent => {
    const rows = EXPOSURES.filter(r => r.entity === ent);
    const physAvg = rows.length ? rows.reduce((s, r) => s + r.physRisk, 0) / rows.length : 0;
    const transAvg = rows.length ? rows.reduce((s, r) => s + r.transRisk, 0) / rows.length : 0;
    const var95 = rows.reduce((s, r) => s + r.climateVaR95, 0);
    const varPct = totalExposure > 0 ? (var95 / (totalExposure * 0.01)) : 0;
    return { entity: ent, physRisk: physAvg, transRisk: transAvg, climateVaR: varPct };
  }), [totalExposure]);

  const heatColor = v => {
    if (v > 65) return T.red;
    if (v > 45) return T.amber;
    if (v > 25) return '#eab308';
    return T.green;
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '28px 32px', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 4, height: 32, background: T.indigo, borderRadius: 2 }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.navy, letterSpacing: '-0.3px' }}>Enterprise Climate Risk Aggregator</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>EP-DB5 — TCFD & NGFS Enterprise Risk Framework | Multi-Entity Aggregation</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: T.muted }}>Scenario:</span>
            <select value={scenario} onChange={e => setScenario(e.target.value)} style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.text, cursor: 'pointer' }}>
              {SCENARIOS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {TAB_LABELS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '9px 16px', fontSize: 12, fontWeight: tab === i ? 700 : 500, color: tab === i ? T.indigo : T.muted, background: 'none', border: 'none', borderBottom: tab === i ? `2px solid ${T.indigo}` : '2px solid transparent', marginBottom: -2, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── TAB 0: Enterprise Dashboard ── */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <Kpi label="Total Exposure" value={`$${(totalExposure / 1000).toFixed(1)}B`} sub="All asset classes & entities" color={T.navy} />
            <Kpi label="Enterprise Climate VaR" value={`$${(enterpriseVaR).toFixed(0)}M`} sub={`After 25% diversification | ${scenario}`} color={T.red} />
            <Kpi label="Diversification Benefit" value={`$${(diversBenefit).toFixed(0)}M`} sub="Standalone vs portfolio VaR" color={T.green} />
            <Kpi label="Concentration HHI" value={hhiRaw.toFixed(0)} sub="Herfindahl-Hirschman Index (0-10000)" color={hhiRaw > 2500 ? T.red : hhiRaw > 1500 ? T.amber : T.green} />
            <Kpi label="Agg. Physical Risk" value={`${aggPhysRisk.toFixed(1)}`} sub="Weighted avg score (0-100)" color={T.orange} />
            <Kpi label="Agg. Transition Risk" value={`${aggTransRisk.toFixed(1)}`} sub="Weighted avg score (0-100)" color={T.purple} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Exposure by Asset Class ($M)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byAssetClass} margin={{ top: 4, right: 10, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.muted }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: T.muted }} />
                  <Tooltip contentStyle={tipStyle} formatter={v => [`$${v.toFixed(0)}M`, 'Exposure']} />
                  <Bar dataKey="exposure" radius={[4, 4, 0, 0]}>
                    {byAssetClass.map((_, i) => <Cell key={i} fill={AC_COLORS[i % AC_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Climate VaR by Asset Class ($M) — {scenario}</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byAssetClass} margin={{ top: 4, right: 10, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.muted }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: T.muted }} />
                  <Tooltip contentStyle={tipStyle} formatter={v => [`$${v.toFixed(1)}M`, 'Climate VaR 95%']} />
                  <Bar dataKey="climateVaR" radius={[4, 4, 0, 0]}>
                    {byAssetClass.map((_, i) => <Cell key={i} fill={T.red} fillOpacity={0.65 + i * 0.04} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 1: Legal Entity View ── */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <Kpi label="Entities" value={ENTITIES.length} sub="Legal entity count" color={T.navy} />
            <Kpi label="Highest Risk Entity" value={[...byEntity].sort((a, b) => b.physRisk + b.transRisk - a.physRisk - a.transRisk)[0]?.name || '-'} sub="Combined physical + transition" color={T.red} />
            <Kpi label="Max Entity Exposure" value={`$${Math.max(...byEntity.map(e => e.exposure)).toFixed(0)}M`} sub={[...byEntity].sort((a, b) => b.exposure - a.exposure)[0]?.name || ''} color={T.indigo} />
            <Kpi label="Min Entity VaR" value={`$${Math.min(...byEntity.map(e => e.climateVaR)).toFixed(1)}M`} sub="Lowest climate VaR entity" color={T.green} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Risk Contribution by Legal Entity</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byEntity} margin={{ top: 4, right: 10, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.muted }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: T.muted }} />
                  <Tooltip contentStyle={tipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="physRisk" name="Physical Risk Score" stackId="a" fill={T.orange} />
                  <Bar dataKey="transRisk" name="Transition Risk Score" stackId="a" fill={T.indigo} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Entity Risk Summary</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {['Entity', 'Exposure ($M)', 'Phys Risk', 'Trans Risk', 'VaR ($M)', 'Conc. Risk'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: T.muted, fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {byEntity.map((ent, i) => (
                      <tr key={ent.name} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.sub : T.card }}>
                        <td style={{ padding: '7px 8px', fontWeight: 600, color: ENTITY_COLORS[i % ENTITY_COLORS.length] }}>{ent.name}</td>
                        <td style={{ padding: '7px 8px', fontFamily: 'monospace' }}>${ent.exposure.toFixed(0)}</td>
                        <td style={{ padding: '7px 8px', color: ent.physRisk > 55 ? T.red : ent.physRisk > 40 ? T.amber : T.green }}>{ent.physRisk.toFixed(1)}</td>
                        <td style={{ padding: '7px 8px', color: ent.transRisk > 55 ? T.red : ent.transRisk > 40 ? T.amber : T.green }}>{ent.transRisk.toFixed(1)}</td>
                        <td style={{ padding: '7px 8px', fontFamily: 'monospace', color: T.red }}>${ent.climateVaR.toFixed(1)}</td>
                        <td style={{ padding: '7px 8px', color: ent.concentrationRisk > 55 ? T.red : ent.concentrationRisk > 40 ? T.amber : T.muted }}>{ent.concentrationRisk.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Business Line Attribution ── */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <Kpi label="Business Lines" value={BUSINESS_LINES.length} sub="Coverage" color={T.navy} />
            <Kpi label="Highest BL Exposure" value={[...byBusinessLine].sort((a, b) => b.exposure - a.exposure)[0]?.name || '-'} sub="By total exposure" color={T.indigo} />
            <Kpi label="Highest BL VaR" value={`$${Math.max(...byBusinessLine.map(b => b.climateVaR)).toFixed(0)}M`} sub={[...byBusinessLine].sort((a, b) => b.climateVaR - a.climateVaR)[0]?.name || ''} color={T.red} />
            <Kpi label="Avg Trans Risk" value={`${(byBusinessLine.reduce((s, b) => s + b.transRisk, 0) / (byBusinessLine.length || 1)).toFixed(1)}`} sub="Across all business lines" color={T.purple} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Risk Attribution by Business Line</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byBusinessLine} margin={{ top: 4, right: 10, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.muted }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: T.muted }} />
                  <Tooltip contentStyle={tipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="physRisk" name="Physical Risk" stackId="a" fill={T.orange} />
                  <Bar dataKey="transRisk" name="Transition Risk" stackId="a" fill={T.indigo} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Physical vs Transition Risk Scatter</div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>Bubble size = exposure ($M), color = business line</div>
              <ResponsiveContainer width="100%" height={270}>
                <ScatterChart margin={{ top: 4, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Physical Risk" type="number" domain={[0, 90]} tick={{ fontSize: 10, fill: T.muted }} label={{ value: 'Physical Risk Score', position: 'insideBottom', offset: -5, fontSize: 10, fill: T.muted }} />
                  <YAxis dataKey="y" name="Transition Risk" type="number" domain={[0, 90]} tick={{ fontSize: 10, fill: T.muted }} label={{ value: 'Transition Risk', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.muted }} />
                  <Tooltip contentStyle={tipStyle} cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [v, n]} />
                  <Scatter data={scatterData}>
                    {scatterData.map((d, i) => <Cell key={i} fill={BL_COLORS[d.blIdx % BL_COLORS.length]} fillOpacity={0.75} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Business Line — Climate VaR Breakdown ($M)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byBusinessLine} margin={{ top: 4, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.muted }} />
                <YAxis tick={{ fontSize: 10, fill: T.muted }} />
                <Tooltip contentStyle={tipStyle} formatter={v => [`$${v.toFixed(1)}M`, 'Climate VaR 95%']} />
                <Bar dataKey="climateVaR" name="Climate VaR ($M)" radius={[4, 4, 0, 0]}>
                  {byBusinessLine.map((_, i) => <Cell key={i} fill={BL_COLORS[i % BL_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── TAB 3: Concentration Risk Map ── */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <Kpi label="Concentration HHI" value={hhiRaw.toFixed(0)} sub={hhiRaw > 2500 ? 'Highly concentrated' : hhiRaw > 1500 ? 'Moderate concentration' : 'Low concentration'} color={hhiRaw > 2500 ? T.red : hhiRaw > 1500 ? T.amber : T.green} />
            <Kpi label="Top Concentrated Entity" value={top5Concentration[0]?.name || '-'} sub={`Score: ${top5Concentration[0]?.concentrationRisk.toFixed(1) || '-'}`} color={T.orange} />
            <Kpi label="Orderly HHI" value={hhiByScenario[0].hhi.toFixed(0)} sub="NGFS Orderly Transition" color={T.green} />
            <Kpi label="Hot House HHI" value={hhiByScenario[2].hhi.toFixed(0)} sub="NGFS Hot House World" color={T.red} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Concentration Risk Score by Entity</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byEntity} margin={{ top: 4, right: 10, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.muted }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: T.muted }} domain={[0, 100]} />
                  <Tooltip contentStyle={tipStyle} />
                  <ReferenceLine y={60} stroke={T.red} strokeDasharray="4 4" label={{ value: 'High Threshold', fontSize: 10, fill: T.red }} />
                  <Bar dataKey="concentrationRisk" name="Concentration Risk" radius={[4, 4, 0, 0]}>
                    {byEntity.map((e, i) => <Cell key={i} fill={e.concentrationRisk > 60 ? T.red : e.concentrationRisk > 45 ? T.amber : T.green} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>HHI Under NGFS Scenarios</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hhiByScenario} margin={{ top: 4, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="scenario" tick={{ fontSize: 11, fill: T.muted }} />
                  <YAxis tick={{ fontSize: 10, fill: T.muted }} />
                  <Tooltip contentStyle={tipStyle} formatter={v => [v, 'HHI']} />
                  <ReferenceLine y={2500} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Concentrated Threshold', fontSize: 9, fill: T.red }} />
                  <Bar dataKey="hhi" name="HHI" radius={[4, 4, 0, 0]} fill={T.indigo}>
                    {hhiByScenario.map((d, i) => <Cell key={i} fill={i === 0 ? T.green : i === 1 ? T.amber : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Top 5 Concentration Hotspots</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Rank', 'Entity', 'Concentration Score', 'Exposure ($M)', 'Climate VaR ($M)', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '7px 10px', color: T.muted, fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {top5Concentration.map((e, i) => (
                  <tr key={e.name} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.sub : T.card }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.muted }}>#{i + 1}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.navy }}>{e.name}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: e.concentrationRisk > 60 ? '#fee2e2' : e.concentrationRisk > 45 ? '#fef3c7' : '#dcfce7', color: e.concentrationRisk > 60 ? T.red : e.concentrationRisk > 45 ? T.amber : T.green }}>
                        {e.concentrationRisk.toFixed(1)}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>${e.exposure.toFixed(0)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: T.red }}>${e.climateVaR.toFixed(1)}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11 }}>{e.concentrationRisk > 60 ? 'Immediate Review' : e.concentrationRisk > 45 ? 'Monitoring' : 'Acceptable'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: Board Reporting View ── */}
      {tab === 4 && (
        <div>
          {/* Large KPI tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Climate Exposure', value: `$${(totalExposure / 1000).toFixed(2)}B`, sub: 'All asset classes & entities', color: T.navy, bg: '#eff6ff' },
              { label: 'Enterprise Climate VaR (95%)', value: `$${enterpriseVaR.toFixed(0)}M`, sub: `${scenario} | Post-diversification`, color: T.red, bg: '#fef2f2' },
              { label: 'Diversification Benefit', value: `$${diversBenefit.toFixed(0)}M`, sub: 'Portfolio correlation benefit', color: T.green, bg: '#f0fdf4' },
              { label: 'Concentration HHI', value: hhiRaw.toFixed(0), sub: hhiRaw > 2500 ? 'Concentrated — Board Review Required' : 'Within acceptable bounds', color: hhiRaw > 2500 ? T.red : T.amber, bg: hhiRaw > 2500 ? '#fef2f2' : '#fffbeb' },
            ].map(k => (
              <div key={k.label} style={{ background: k.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: '22px 24px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: T.muted, marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: k.color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            {/* Risk Heatmap */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Entity × Risk Type Heatmap</div>
              <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(3,1fr)`, gap: 4 }}>
                <div />
                {heatmapRiskTypes.map(rt => (
                  <div key={rt} style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', color: T.muted, textTransform: 'uppercase', padding: '4px 0' }}>{rt}</div>
                ))}
                {riskHeatmap.map((row, i) => (
                  <React.Fragment key={row.entity}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.navy, display: 'flex', alignItems: 'center', paddingRight: 8 }}>{row.entity}</div>
                    {[row.physRisk, row.transRisk, row.climateVaR].map((v, j) => (
                      <div key={j} style={{ background: heatColor(v), borderRadius: 6, padding: '10px 6px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                        {v.toFixed(1)}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 10, color: T.muted }}>
                {[{ c: T.red, l: '>65 Critical' }, { c: T.amber, l: '45-65 High' }, { c: '#eab308', l: '25-45 Medium' }, { c: T.green, l: '<25 Low' }].map(({ c, l }) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />{l}</div>
                ))}
              </div>
            </div>

            {/* TCFD Checklist */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>TCFD Disclosure Readiness</div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 14 }}>
                {TCFD_CHECKLIST.filter(c => c.status).length}/{TCFD_CHECKLIST.length} items complete
              </div>
              {TCFD_CHECKLIST.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: i < TCFD_CHECKLIST.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: item.status ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: item.status ? T.green : T.red }}>
                    {item.status ? '✓' : '✗'}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: T.text, fontWeight: item.status ? 400 : 600 }}>{item.item}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>{item.category}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scenario narrative */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>NGFS Scenario Narrative Summary</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Scenario', 'VaR Multiplier', 'Enterprise Climate VaR', 'HHI Impact', 'Key Risk Driver', 'Board Action'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '7px 10px', color: T.muted, fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { sc: 'Orderly Transition', mult: '1.0×', var: `$${(standaloneVaR * 0.75).toFixed(0)}M`, hhi: 'Baseline', driver: 'Carbon price step-up', action: 'Monitor transition exposures' },
                  { sc: 'Disorderly Transition', mult: '1.45×', var: `$${(standaloneVaR * 0.75 * 1.45).toFixed(0)}M`, hhi: '+22%', driver: 'Stranded asset repricing', action: 'Stress test portfolios quarterly' },
                  { sc: 'Hot House World', mult: '1.82×', var: `$${(standaloneVaR * 0.75 * 1.82).toFixed(0)}M`, hhi: '+48%', driver: 'Physical damage accumulation', action: 'Emergency board briefing required' },
                ].map((r, i) => (
                  <tr key={r.sc} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.sub : T.card }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: i === 0 ? T.green : i === 1 ? T.amber : T.red }}>{r.sc}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{r.mult}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: T.red, fontWeight: 700 }}>{r.var}</td>
                    <td style={{ padding: '8px 10px' }}>{r.hhi}</td>
                    <td style={{ padding: '8px 10px', color: T.muted }}>{r.driver}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11, fontStyle: 'italic', color: T.navy }}>{r.action}</td>
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
