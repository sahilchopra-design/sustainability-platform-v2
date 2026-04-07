import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Cell, ScatterChart, Scatter
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', bg: '#f0ede8',
  red: '#991b1b', green: '#065f46', gray: '#6b7280', orange: '#c2410c',
  blue: '#1d4ed8', teal: '#0f766e', purple: '#6d28d9', amber: '#b45309',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5',
  lightNavy: '#e8eef5', border: '#d6cfc4'
};
const fmt = (n) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n.toFixed(0)}`;

// ─── Damage Function Standards ──────────────────────────────────────────────
const DF_STANDARDS = {
  jrc: {
    label: 'JRC (EU Joint Research Centre)',
    perils: ['flood_riverine', 'flood_coastal', 'flood_pluvial'],
    desc: 'European flood damage functions per PESETA IV. Depth-damage curves for residential, commercial, infrastructure assets. Based on JRC Technical Report EUR 29711 EN.',
    formula: 'DR = 1 − exp(−(d / α)^β)  where d = inundation depth, α = scale, β = shape',
    params: { residential: { alpha: 1.5, beta: 0.8 }, commercial: { alpha: 2.0, beta: 0.75 }, infrastructure: { alpha: 2.8, beta: 0.9 } },
  },
  hazus: {
    label: 'HAZUS-MH (FEMA, US)',
    perils: ['flood_riverine', 'wind_cyclone'],
    desc: 'FEMA HAZUS Multi-Hazard: flood depth-damage curves + wind fragility functions. Standard for US assets and increasingly used internationally.',
    formula: 'DR = min(1, Σ P(DS_i) × mean(damage | DS_i))  across damage states (none/slight/moderate/extensive/complete)',
    params: { residential: { alpha: 1.2, beta: 1.1 }, commercial: { alpha: 1.8, beta: 0.95 }, infrastructure: { alpha: 3.0, beta: 0.7 } },
  },
  fema_p58: {
    label: 'FEMA P-58 (Seismic/Wind Fragility)',
    perils: ['wind_cyclone'],
    desc: 'FEMA P-58 fragility functions for wind and seismic. Performance-based engineering: component-level damage → repair cost mapping.',
    formula: 'P(DS ≥ ds | IM) = Φ[(ln(IM) − ln(θ)) / β]  where θ = median capacity, β = dispersion',
    params: { residential: { theta: 45, beta_d: 0.6 }, commercial: { theta: 55, beta_d: 0.5 }, infrastructure: { theta: 65, beta_d: 0.55 } },
  },
  wbgt: {
    label: 'WBGT Productivity Loss (ISO 7933)',
    perils: ['extreme_heat'],
    desc: 'Wet Bulb Globe Temperature productivity loss model per ISO 7933 / OSHA heat stress standards. Labour productivity loss as function of WBGT.',
    formula: 'Productivity_Loss = max(0, min(1, (WBGT − 25) / 15))  for moderate work intensity',
    params: { light: { threshold: 28, slope: 0.04 }, moderate: { threshold: 25, slope: 0.067 }, heavy: { threshold: 22, slope: 0.1 } },
  },
};

// ─── Asset Classes ───────────────────────────────────────────────────────────
const ASSET_CLASSES = [
  { id: 'residential_re',  label: 'Residential RE',    value: 250e6,  alphaKey: 'residential' },
  { id: 'commercial_re',   label: 'Commercial RE',     value: 500e6,  alphaKey: 'commercial' },
  { id: 'infrastructure',  label: 'Infrastructure',    value: 1200e6, alphaKey: 'infrastructure' },
  { id: 'agriculture',     label: 'Agriculture',       value: 80e6,   alphaKey: 'residential' },
  { id: 'energy_assets',   label: 'Energy Assets',     value: 350e6,  alphaKey: 'commercial' },
];

// ─── Return Periods ──────────────────────────────────────────────────────────
const RETURN_PERIODS = [2, 5, 10, 25, 50, 100, 200, 250, 500, 1000];

// Generate depth-damage curve for a given standard + asset class
function generateDamageCurve(standard, assetClass, maxIntensity, numPoints = 20) {
  const std = DF_STANDARDS[standard];
  const params = std?.params?.[assetClass] || { alpha: 1.5, beta: 0.8 };
  return Array.from({ length: numPoints }, (_, i) => {
    const intensity = (i / (numPoints - 1)) * maxIntensity;
    let dr;
    if (standard === 'fema_p58') {
      // Lognormal fragility
      const theta = params.theta || 45;
      const bd = params.beta_d || 0.6;
      dr = intensity <= 0 ? 0 : Math.min(1, (1 / (1 + Math.exp(-(Math.log(intensity / theta) / bd)))));
    } else if (standard === 'wbgt') {
      const threshold = params.moderate?.threshold || 25;
      const slope = params.moderate?.slope || 0.067;
      dr = Math.max(0, Math.min(1, (intensity - threshold) * slope));
    } else {
      // JRC / HAZUS: exponential
      const alpha = params[assetClass]?.alpha || params.alpha || 1.5;
      const beta = params[assetClass]?.beta || params.beta || 0.8;
      dr = Math.min(1, 1 - Math.exp(-Math.pow(intensity / alpha, beta)));
    }
    return { intensity: parseFloat(intensity.toFixed(2)), dr: parseFloat(dr.toFixed(4)), dr_pct: parseFloat((dr * 100).toFixed(2)) };
  });
}

// Generate exceedance probability curve
function generateEPCurve(assetValue, standard, assetClass, scenario) {
  const scenarioMult = { current: 1.0, ssp1_26: 1.15, ssp2_45: 1.35, ssp5_85: 1.68, ssp5_2100: 2.42 }[scenario] || 1;
  return RETURN_PERIODS.map((rp, i) => {
    const baseLossFrac = Math.min(0.9, 0.02 * Math.pow(rp, 0.55) * (1 + sr(i * 7) * 0.15));
    const adjLoss = baseLossFrac * scenarioMult;
    const lossUsd = assetValue * Math.min(0.95, adjLoss);
    return {
      returnPeriod: rp,
      exceedancePct: parseFloat((100 / rp).toFixed(3)),
      lossUsd: Math.round(lossUsd),
      lossPct: parseFloat((Math.min(0.95, adjLoss) * 100).toFixed(2)),
    };
  });
}

const SCENARIOS = [
  { id: 'current',   label: 'Current',     mult: 1.00, color: T.green },
  { id: 'ssp1_26',  label: 'SSP1-2.6',   mult: 1.15, color: T.blue },
  { id: 'ssp2_45',  label: 'SSP2-4.5',   mult: 1.35, color: T.amber },
  { id: 'ssp5_85',  label: 'SSP5-8.5',   mult: 1.68, color: T.orange },
  { id: 'ssp5_2100', label: 'SSP5-8.5/2100', mult: 2.42, color: T.red },
];

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)}
        style={{ padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          color: active === t ? T.navy : T.gray, fontFamily: 'inherit',
          borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent',
          marginBottom: -2 }}>
        {t}
      </button>
    ))}
  </div>
);

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', minWidth: 130 }}>
    <div style={{ fontSize: 11, color: T.gray, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.gray, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function DamageFunctionCalculatorPage() {
  const [tab, setTab] = useState('Vulnerability Curves');
  const [standard, setStandard] = useState('jrc');
  const [assetClass, setAssetClass] = useState('residential_re');
  const [scenario, setScenario] = useState('current');
  const [assetValue, setAssetValue] = useState(250e6);
  const [intensityInput, setIntensityInput] = useState(2.5);

  const stdObj = DF_STANDARDS[standard];
  const assetObj = ASSET_CLASSES.find(a => a.id === assetClass);
  const scenarioObj = SCENARIOS.find(s => s.id === scenario);
  const scenarioMult = scenarioObj?.mult || 1;

  // Damage curve for selected standard
  const maxIntensity = standard === 'wbgt' ? 45 : standard === 'fema_p58' ? 100 : 6;
  const damageCurve = useMemo(() => generateDamageCurve(standard, assetObj?.alphaKey || 'residential', maxIntensity), [standard, assetClass]);

  // EP curve
  const epCurve = useMemo(() => generateEPCurve(assetValue, standard, assetObj?.alphaKey, scenario), [assetValue, standard, assetClass, scenario]);

  // Point estimate
  const adjIntensity = intensityInput;
  const pointDR = damageCurve.reduce((closest, pt) => Math.abs(pt.intensity - adjIntensity) < Math.abs(closest.intensity - adjIntensity) ? pt : closest, damageCurve[0]);
  const pointLossUsd = assetValue * pointDR.dr;

  // AAL, PML
  const aal = useMemo(() => {
    let sum = 0;
    for (let i = 1; i < epCurve.length; i++) {
      const probBand = (1 / epCurve[i - 1].returnPeriod) - (1 / epCurve[i].returnPeriod);
      sum += probBand * ((epCurve[i - 1].lossUsd + epCurve[i].lossUsd) / 2);
    }
    return Math.round(sum * 365);
  }, [epCurve]);

  const pml100 = epCurve.find(e => e.returnPeriod === 100)?.lossUsd || 0;
  const pml250 = epCurve.find(e => e.returnPeriod === 250)?.lossUsd || 0;

  // Multi-standard comparison
  const standardComparison = useMemo(() => Object.keys(DF_STANDARDS).map(s => {
    const curve = generateDamageCurve(s, assetObj?.alphaKey || 'residential', maxIntensity);
    const pt = curve.reduce((closest, pt) => Math.abs(pt.intensity - adjIntensity) < Math.abs(closest.intensity - adjIntensity) ? pt : closest, curve[0]);
    return { standard: s, label: DF_STANDARDS[s].label.split('(')[0].trim(), dr: pt.dr_pct, lossUsd: assetValue * pt.dr };
  }), [standard, assetClass, adjIntensity, assetValue]);

  return (
    <div style={{ padding: '24px 28px', background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: T.gray, fontFamily: 'JetBrains Mono, monospace' }}>EP-BX2</span>
          <span style={{ fontSize: 11, color: T.gray }}>·</span>
          <span style={{ fontSize: 11, color: T.gray }}>JRC · HAZUS-MH · FEMA P-58 · WBGT ISO 7933 · AAL · EAL · PML 100yr/250yr</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.navy }}>Damage Function Calculator</h1>
        <div style={{ fontSize: 12, color: T.gray, marginTop: 3 }}>Vulnerability curves · Depth-damage functions · Exceedance probability · Actuarial loss metrics</div>
      </div>

      {/* Controls */}
      <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20,
        display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, color: T.gray, display: 'block', marginBottom: 4 }}>Damage Function Standard</label>
          <select value={standard} onChange={e => setStandard(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit', minWidth: 200 }}>
            {Object.entries(DF_STANDARDS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: T.gray, display: 'block', marginBottom: 4 }}>Asset Class</label>
          <select value={assetClass} onChange={e => { setAssetClass(e.target.value); setAssetValue(ASSET_CLASSES.find(a => a.id === e.target.value)?.value || 250e6); }}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }}>
            {ASSET_CLASSES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: T.gray, display: 'block', marginBottom: 4 }}>Asset Value ($M)</label>
          <input type="number" value={(assetValue / 1e6).toFixed(0)} onChange={e => setAssetValue(parseFloat(e.target.value) * 1e6)}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', width: 90 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: T.gray, display: 'block', marginBottom: 4 }}>
            Hazard Intensity {standard === 'wbgt' ? '(WBGT °C)' : standard === 'fema_p58' ? '(Wind m/s)' : '(Flood depth m)'}
          </label>
          <input type="number" step="0.1" value={intensityInput} onChange={e => setIntensityInput(parseFloat(e.target.value) || 0)}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', width: 90 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: T.gray, display: 'block', marginBottom: 4 }}>Climate Scenario</label>
          <select value={scenario} onChange={e => setScenario(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }}>
            {SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.label} ({s.mult.toFixed(2)}×)</option>)}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="Point Damage Ratio" value={`${(pointDR.dr * 100).toFixed(1)}%`}
          sub={`At intensity ${adjIntensity} · ${stdObj?.label.split('(')[0]}`}
          color={pointDR.dr > 0.5 ? T.red : pointDR.dr > 0.25 ? T.amber : T.green} />
        <KpiCard label="Point Loss Estimate" value={fmt(pointLossUsd)} sub={`${assetObj?.label} · $${(assetValue / 1e6).toFixed(0)}M value`} color={T.navy} />
        <KpiCard label="AAL (Annual)" value={fmt(aal)} sub={`${scenarioObj?.label} scenario`} color={T.orange} />
        <KpiCard label="PML 100yr" value={fmt(pml100)} sub="1% annual exceedance probability" color={T.red} />
        <KpiCard label="PML 250yr" value={fmt(pml250)} sub="0.4% annual exceedance probability" color={T.red} />
        <KpiCard label="AAL / Value" value={`${((aal / assetValue) * 100).toFixed(2)}%`} sub="Annualized risk rate" color={T.purple} />
      </div>

      <TabBar tabs={['Vulnerability Curves', 'AAL Calculator', 'PML Stress Test', 'Asset Class Comparison', 'Damage Attribution']}
        active={tab} onChange={setTab} />

      {/* --- VULNERABILITY CURVES --- */}
      {tab === 'Vulnerability Curves' && (
        <div>
          <div style={{ background: '#fff8ef', border: `1px solid ${T.gold}`, borderRadius: 8, padding: '10px 16px', marginBottom: 18, fontSize: 12 }}>
            <strong>Formula ({stdObj?.label}):</strong> <span style={{ fontFamily: 'JetBrains Mono, monospace', color: T.navy }}>{stdObj?.formula}</span>
            <div style={{ marginTop: 4, color: T.gray }}>{stdObj?.desc}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
            {/* Damage curve */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>
                Depth-Damage Curve — {assetObj?.label} · {stdObj?.label.split('(')[0]}
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={damageCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="intensity" label={{ value: standard === 'wbgt' ? 'WBGT (°C)' : standard === 'fema_p58' ? 'Wind speed (m/s)' : 'Inundation depth (m)', position: 'insideBottom', offset: -5, fontSize: 11 }} tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [`${v}%`, 'Damage Ratio']} labelFormatter={l => `Intensity: ${l}`} />
                  <ReferenceLine x={adjIntensity} stroke={T.gold} strokeDasharray="4 4"
                    label={{ value: `Input: ${adjIntensity}`, position: 'top', fontSize: 10, fill: T.amber }} />
                  <ReferenceLine y={pointDR.dr_pct} stroke={T.red} strokeDasharray="4 4"
                    label={{ value: `DR: ${pointDR.dr_pct.toFixed(1)}%`, position: 'right', fontSize: 10, fill: T.red }} />
                  <Line type="monotone" dataKey="dr_pct" stroke={T.navy} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Standard comparison at given intensity */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>
                Standard Comparison at Intensity {adjIntensity}
              </div>
              {standardComparison.map(s => (
                <div key={s.standard} style={{ marginBottom: 14, padding: '8px 12px',
                  background: s.standard === standard ? T.lightNavy : T.bg, borderRadius: 6,
                  border: `1px solid ${s.standard === standard ? T.navy : T.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 18, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                        color: s.dr > 50 ? T.red : s.dr > 25 ? T.amber : T.green }}>{s.dr.toFixed(1)}%</div>
                      <div style={{ fontSize: 11, color: T.gray }}>Damage ratio</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: T.navy }}>{fmt(s.lossUsd)}</div>
                      <div style={{ fontSize: 11, color: T.gray }}>Loss estimate</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- AAL CALCULATOR --- */}
      {tab === 'AAL Calculator' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
            {/* EP curve */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Exceedance Probability Curve</div>
              <div style={{ fontSize: 11, color: T.gray, marginBottom: 14 }}>Loss USD vs. Annual Exceedance Probability · {scenarioObj?.label}</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={epCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="exceedancePct" tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }}
                    label={{ value: 'Annual Exceedance Probability (%)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [fmt(v), 'Loss']} labelFormatter={l => `AEP: ${l}%`} />
                  <Area type="monotone" dataKey="lossUsd" stroke={T.navy} fill={T.lightNavy} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Return period table */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Return Period Loss Table</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.lightNavy }}>
                    {['Return Period', 'AEP', 'Loss', '% of Value'].map(h => (
                      <th key={h} style={{ padding: '7px 8px', fontWeight: 600, color: T.navy, borderBottom: `1px solid ${T.border}`, textAlign: 'right', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {epCurve.map((row, i) => {
                    const highlight = [100, 250].includes(row.returnPeriod);
                    return (
                      <tr key={row.returnPeriod} style={{ background: highlight ? '#fffbeb' : i % 2 === 0 ? '#fff' : T.bg }}>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: highlight ? 700 : 400, color: T.navy }}>{row.returnPeriod}yr</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: T.gray, fontSize: 11 }}>{row.exceedancePct}%</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: highlight ? 700 : 400, color: T.navy }}>{fmt(row.lossUsd)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                          color: row.lossPct > 50 ? T.red : row.lossPct > 25 ? T.amber : T.gray }}>{row.lossPct.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: 12, padding: '8px 10px', background: T.lightNavy, borderRadius: 6, fontSize: 11, color: T.navy }}>
                <strong>AAL = </strong>
                <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>∫ Loss(p) dp ≈ {fmt(aal)}/yr</span>
                <div style={{ color: T.gray, marginTop: 2 }}>Trapezoidal integration over exceedance curve · {scenarioObj?.label}</div>
              </div>
            </div>
          </div>

          {/* Scenario AAL comparison */}
          <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18, marginTop: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>AAL Across Climate Scenarios</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SCENARIOS.map(s => {
                const epC = generateEPCurve(assetValue, standard, assetObj?.alphaKey, s.id);
                let sum = 0;
                for (let i = 1; i < epC.length; i++) {
                  const pb = (1 / epC[i - 1].returnPeriod) - (1 / epC[i].returnPeriod);
                  sum += pb * ((epC[i - 1].lossUsd + epC[i].lossUsd) / 2);
                }
                return { label: s.label.split(' (')[0], aal: Math.round(sum * 365), fill: s.color };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={v => `$${(v / 1e6).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [fmt(v), 'AAL']} />
                <Bar dataKey="aal" radius={[4, 4, 0, 0]}>
                  {SCENARIOS.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* --- PML STRESS TEST --- */}
      {tab === 'PML Stress Test' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {/* PML across scenarios */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>PML by Return Period & Scenario</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={RETURN_PERIODS.map((rp, i) => {
                  const row = { rp: `${rp}yr` };
                  SCENARIOS.forEach(s => {
                    const ep = generateEPCurve(assetValue, standard, assetObj?.alphaKey, s.id);
                    row[s.id] = ep.find(e => e.returnPeriod === rp)?.lossUsd || 0;
                  });
                  return row;
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="rp" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [fmt(v), '']} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  {SCENARIOS.map(s => (
                    <Line key={s.id} type="monotone" dataKey={s.id} name={s.label.split(' (')[0]}
                      stroke={s.color} strokeWidth={s.id === scenario ? 3 : 1.5}
                      strokeDasharray={s.id === scenario ? undefined : '4 4'} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* PML summary cards */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>PML Summary — {scenarioObj?.label}</div>
              {[100, 250, 500, 1000].map(rp => {
                const pml = epCurve.find(e => e.returnPeriod === rp)?.lossUsd || 0;
                const pmlPct = (pml / assetValue) * 100;
                const label = rp === 100 ? '1-in-100 (Insurance standard)' : rp === 250 ? '1-in-250 (Solvency II / ECB CST)' : rp === 500 ? '1-in-500 (Severe stress)' : '1-in-1000 (Extreme tail)';
                return (
                  <div key={rp} style={{ marginBottom: 14, padding: '10px 14px', background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{rp}-year PML</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: pmlPct > 50 ? T.red : T.navy }}>{fmt(pml)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.gray, marginBottom: 6 }}>{label}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ flex: 1, height: 8, background: '#fff', borderRadius: 4 }}>
                        <div style={{ width: `${Math.min(100, pmlPct)}%`, height: '100%', background: pmlPct > 50 ? T.red : pmlPct > 25 ? T.amber : T.green, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: T.navy }}>{pmlPct.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- ASSET CLASS COMPARISON --- */}
      {tab === 'Asset Class Comparison' && (
        <div>
          <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Damage Ratio Comparison by Asset Class</div>
            <div style={{ fontSize: 11, color: T.gray, marginBottom: 14 }}>At intensity {adjIntensity} · {stdObj?.label.split('(')[0]} · {scenarioObj?.label}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {ASSET_CLASSES.map(ac => {
                const curve = generateDamageCurve(standard, ac.alphaKey, maxIntensity);
                const pt = curve.reduce((c, p) => Math.abs(p.intensity - adjIntensity) < Math.abs(c.intensity - adjIntensity) ? p : c, curve[0]);
                const lossUsd = ac.value * pt.dr * scenarioMult;
                const color = pt.dr_pct > 50 ? T.red : pt.dr_pct > 25 ? T.amber : T.green;
                return (
                  <div key={ac.id} style={{ padding: '14px 16px', background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{ac.label}</div>
                    <div style={{ fontSize: 26, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color }}>{Math.min(100, pt.dr_pct * scenarioMult).toFixed(1)}%</div>
                    <div style={{ fontSize: 11, color: T.gray, marginBottom: 6 }}>Damage ratio</div>
                    <div style={{ fontSize: 14, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: T.navy }}>{fmt(lossUsd)}</div>
                    <div style={{ fontSize: 11, color: T.gray }}>on ${(ac.value / 1e6).toFixed(0)}M asset</div>
                    <div style={{ height: 6, background: '#fff', borderRadius: 3, marginTop: 8 }}>
                      <div style={{ width: `${Math.min(100, pt.dr_pct * scenarioMult)}%`, height: '100%', background: color, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- DAMAGE ATTRIBUTION --- */}
      {tab === 'Damage Attribution' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {/* Attribution by climate change component */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Damage Attribution by Climate Change Component</div>
              {[
                { label: 'Baseline (Current Climate)', value: Math.round(pml100 / scenarioMult), color: T.green },
                { label: `Scenario Increment (${scenarioObj?.label})`, value: Math.round(pml100 - pml100 / scenarioMult), color: T.orange },
              ].map(row => (
                <div key={row.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: T.navy }}>{row.label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: T.navy }}>{fmt(row.value)}</span>
                  </div>
                  <div style={{ height: 10, background: T.bg, borderRadius: 5 }}>
                    <div style={{ width: `${(row.value / pml100) * 100}%`, height: '100%', background: row.color, borderRadius: 5 }} />
                  </div>
                </div>
              ))}
              <div style={{ padding: '10px 12px', background: T.lightNavy, borderRadius: 8, marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>Total PML 100yr</div>
                <div style={{ fontSize: 20, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: T.red }}>{fmt(pml100)}</div>
                <div style={{ fontSize: 11, color: T.gray }}>{scenarioObj?.label} · {stdObj?.label.split('(')[0]}</div>
              </div>
            </div>

            {/* Attribution by peril type */}
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Attributable Loss by Peril Band</div>
              {['Primary (Flood/Wind)', 'Secondary (Heat/Drought)', 'Tail (SLR/Wildfire)'].map((band, i) => {
                const pcts = [0.55, 0.30, 0.15];
                const val = Math.round(pml100 * pcts[i]);
                const colors = [T.blue, T.amber, T.orange];
                return (
                  <div key={band} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: T.navy }}>{band}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700 }}>{fmt(val)} ({(pcts[i] * 100).toFixed(0)}%)</span>
                    </div>
                    <div style={{ height: 10, background: T.bg, borderRadius: 5 }}>
                      <div style={{ width: `${pcts[i] * 100}%`, height: '100%', background: colors[i], borderRadius: 5 }} />
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Regulatory Capital Guidance</div>
                {[
                  { reg: 'ECB Climate Stress Test 2022', metric: 'PML 100yr / Tier 1 Capital', value: `${((pml100 / (assetValue * 0.12)) * 100).toFixed(1)}%`, note: 'Add-on if >5%' },
                  { reg: 'BoE CBES 2021', metric: 'AAL / RWA', value: `${((aal / (assetValue * 0.85)) * 100).toFixed(2)}%`, note: 'Monitor if >1%' },
                  { reg: 'Solvency II SCR (Ins.)', metric: 'PML 200yr / SCR', value: `${((epCurve.find(e => e.returnPeriod === 200)?.lossUsd || 0) / (assetValue * 0.15) * 100).toFixed(1)}%`, note: 'Cap req. if >25%' },
                ].map(r => (
                  <div key={r.reg} style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                    <div style={{ fontWeight: 600, color: T.navy }}>{r.reg}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      <span style={{ color: T.gray }}>{r.metric}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: T.navy }}>{r.value} <span style={{ color: T.gray, fontFamily: 'inherit', fontWeight: 400 }}>— {r.note}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
