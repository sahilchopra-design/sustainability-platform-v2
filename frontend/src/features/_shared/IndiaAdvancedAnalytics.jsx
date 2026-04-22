import React, { useMemo, useState } from 'react';

// Deterministic PRNG (session-stable); MC uses Math.random for true sampling
const sr = (seed) => { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };

// -- Helpers --------------------------------------------------------------
export const mcTriangular = (fn, vars, n = 1000) => {
  const samples = [];
  for (let i = 0; i < n; i++) {
    const sample = {};
    for (const k in vars) {
      const { min, mode, max } = vars[k];
      const u = Math.random();
      const c = (mode - min) / (max - min);
      sample[k] = u < c
        ? min + Math.sqrt(u * (max - min) * (mode - min))
        : max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
    samples.push(fn(sample));
  }
  samples.sort((a, b) => a - b);
  return {
    p05: samples[Math.floor(n * 0.05)],
    p50: samples[Math.floor(n * 0.50)],
    p95: samples[Math.floor(n * 0.95)],
    mean: samples.reduce((x, v) => x + v, 0) / n,
    samples,
  };
};

export const tornadoSweep = (inputs, fn, pct = 0.20) => {
  const base = fn(inputs);
  return Object.keys(inputs).map(k => {
    const low = { ...inputs, [k]: inputs[k] * (1 - pct) };
    const high = { ...inputs, [k]: inputs[k] * (1 + pct) };
    return { driver: k, low: fn(low), high: fn(high), base };
  }).sort((a, b) => Math.abs(b.high - b.low) - Math.abs(a.high - a.low));
};

// NGFS-style carbon price paths × horizons (USD/t equivalent)
export const NGFS_PATHS = {
  'Net Zero 2050 (Orderly)': { 2025: 90,  2030: 170, 2040: 295, 2050: 420 },
  'Divergent NZ (1.5°C)':    { 2025: 40,  2030: 210, 2040: 440, 2050: 640 },
  'Delayed Transition':      { 2025: 15,  2030: 95,  2040: 330, 2050: 590 },
  'Current Policies':        { 2025: 15,  2030: 40,  2040: 85,  2050: 150 },
  'India CCTS Domestic':     { 2025: 9,   2030: 35,  2040: 80,  2050: 120 },
  'EU ETS':                  { 2025: 68,  2030: 110, 2040: 180, 2050: 240 },
  'Japan GX-ETS':            { 2025: 12,  2030: 50,  2040: 120, 2050: 200 },
};

// IFRS S2 / TCFD readiness items
export const IN_S2_CHECKLIST = [
  { id: 'gov1', area: 'Governance',     item: 'Board-level climate oversight (SEBI BRSR Core row 9)' },
  { id: 'gov2', area: 'Governance',     item: 'Exec compensation linked to climate KPIs' },
  { id: 'str1', area: 'Strategy',       item: 'Climate scenario analysis (1.5°C + 3°C)' },
  { id: 'str2', area: 'Strategy',       item: 'Transition plan disclosed (SBTi-aligned)' },
  { id: 'str3', area: 'Strategy',       item: 'Financial effects on assets/business' },
  { id: 'rsk1', area: 'Risk Mgmt',      item: 'Physical + transition risk in ERM' },
  { id: 'rsk2', area: 'Risk Mgmt',      item: 'Risk integrated with capital allocation' },
  { id: 'met1', area: 'Metrics',        item: 'Scope 1/2/3 emissions (GHG Protocol)' },
  { id: 'met2', area: 'Metrics',        item: 'Internal carbon price, CCTS/PAT tracking' },
  { id: 'met3', area: 'Metrics',        item: 'Green revenue / capex taxonomy tagged' },
  { id: 'tgt1', area: 'Targets',        item: 'SBTi-validated / India NDC-aligned target' },
  { id: 'tgt2', area: 'Targets',        item: 'Just transition & workforce targets' },
];

// BRSR Core 9 attributes (SEBI 2023)
export const BRSR_CORE = [
  { id: 'brsr1', item: 'GHG footprint (Scope 1 + 2 intensity)' },
  { id: 'brsr2', item: 'Water footprint & intensity' },
  { id: 'brsr3', item: 'Waste & circularity metrics' },
  { id: 'brsr4', item: 'Employee wellbeing & safety' },
  { id: 'brsr5', item: 'Gender diversity (board/workforce)' },
  { id: 'brsr6', item: 'Wages & complaints' },
  { id: 'brsr7', item: 'Inclusive development' },
  { id: 'brsr8', item: 'Value chain disclosures' },
  { id: 'brsr9', item: 'Openness of business (assurance)' },
];

// -- Primitive components -------------------------------------------------
export function Tornado({ rows, fmt = (n) => n.toFixed(1), T, height = 22 }) {
  if (!rows.length) return null;
  const all = rows.flatMap(r => [r.low, r.high, r.base]).filter(v => Number.isFinite(v));
  const min = Math.min(...all), max = Math.max(...all);
  const rng = max - min || 1;
  const base = rows[0].base;
  const basePct = ((base - min) / rng) * 100;
  return (
    <div style={{ padding: 10, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4 }}>
      {rows.map((r, i) => {
        const lo = ((r.low - min) / rng) * 100;
        const hi = ((r.high - min) / rng) * 100;
        const leftPct = Math.min(lo, hi), widthPct = Math.abs(hi - lo);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 5, gap: 8 }}>
            <div style={{ width: 90, fontSize: 10, fontFamily: T.mono, color: T.textSec, textAlign: 'right' }}>{r.driver}</div>
            <div style={{ flex: 1, position: 'relative', height, background: T.surfaceH, borderRadius: 2 }}>
              <div style={{ position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`, height, background: `linear-gradient(90deg, ${T.red}, ${T.green})`, borderRadius: 2 }} />
              <div style={{ position: 'absolute', left: `calc(${basePct}% - 1px)`, top: 0, width: 2, height, background: T.gold }} />
            </div>
            <div style={{ width: 120, fontSize: 10, fontFamily: T.mono, color: T.textMut, textAlign: 'left' }}>{fmt(r.low)} → {fmt(r.high)}</div>
          </div>
        );
      })}
      <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, marginTop: 6 }}>Gold line = base case · ±20% driver swing</div>
    </div>
  );
}

export function Histogram({ values, bins = 20, width = 320, height = 60, T, color }) {
  if (!values || !values.length) return null;
  const c = color || T.gold;
  const min = values[0], max = values[values.length - 1];
  const step = (max - min) / bins || 1;
  const binned = new Array(bins).fill(0);
  values.forEach(v => { const i = Math.min(bins - 1, Math.floor((v - min) / step)); binned[i]++; });
  const peak = Math.max(...binned);
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {binned.map((count, i) => {
        const h = (count / peak) * (height - 6);
        return <rect key={i} x={(i / bins) * width} y={height - h} width={(width / bins) - 1} height={h} fill={c} opacity={0.75} />;
      })}
    </svg>
  );
}

export function MCCard({ title, stats, fmt = (n) => n.toFixed(1), unit = '', T }) {
  if (!stats) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {[['P5', stats.p05, T.red], ['P50', stats.p50, T.amber], ['Mean', stats.mean, T.text], ['P95', stats.p95, T.green]].map(([l, v, c]) => (
          <div key={l}>
            <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>{l}</div>
            <div style={{ fontSize: 14, color: c, fontFamily: T.mono, fontWeight: 700 }}>{fmt(v)}{unit}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <Histogram values={stats.samples} T={T} />
      </div>
    </div>
  );
}

export function Heatmap({ data, rows, cols, fmt = (n) => n.toFixed(0), loColor, hiColor, T }) {
  const all = rows.flatMap(r => cols.map(c => data[r]?.[c] ?? 0));
  const min = Math.min(...all), max = Math.max(...all), rng = max - min || 1;
  const lo = loColor || T.green, hi = hiColor || T.red;
  const hex2rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (t) => { const a = hex2rgb(lo), b = hex2rgb(hi); return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`; };
  return (
    <table style={{ borderCollapse: 'collapse', fontSize: 10, fontFamily: T.mono, width: '100%' }}>
      <thead><tr>
        <th style={{ padding: 4, textAlign: 'left', color: T.textMut }}></th>
        {cols.map(c => <th key={c} style={{ padding: 4, color: T.textMut, textAlign: 'center' }}>{c}</th>)}
      </tr></thead>
      <tbody>{rows.map(r => (
        <tr key={r}>
          <td style={{ padding: 4, color: T.textSec, whiteSpace: 'nowrap' }}>{r}</td>
          {cols.map(c => {
            const v = data[r]?.[c] ?? 0;
            const t = (v - min) / rng;
            return <td key={c} style={{ padding: 6, background: mix(t), color: t > 0.5 ? '#fff' : '#111', textAlign: 'center', minWidth: 55 }}>{fmt(v)}</td>;
          })}
        </tr>
      ))}</tbody>
    </table>
  );
}

export function ProgressRing({ pct, size = 72, label, color, T }) {
  const r = size / 2 - 6, c = 2 * Math.PI * r, off = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
  const col = color || (pct >= 80 ? T.green : pct >= 50 ? T.amber : T.red);
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.border} strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={6} strokeDasharray={c} strokeDashoffset={off} transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeLinecap="round" />
        <text x="50%" y="50%" textAnchor="middle" dy=".35em" fontSize={13} fontFamily="'JetBrains Mono', monospace" fill={col} fontWeight={700}>{pct.toFixed(0)}%</text>
      </svg>
      {label && <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, marginTop: 4 }}>{label}</div>}
    </div>
  );
}

// -- Main component ------------------------------------------------------
/**
 * Props:
 *   T         — theme tokens
 *   moduleCode
 *   title
 *   // MC config
 *   mcModel: { title, unit, fmt, compute: (v) => number, vars: {key:{min,mode,max}} }
 *   // Tornado config
 *   tornadoModel: { title, unit, fmt, compute, inputs: {k:number} }
 *   // Scenario heatmap
 *   scenarioRows?   — NGFS rows
 *   scenarioImpact? — (priceUSDt, yr) => number  — module-specific impact given a carbon price & horizon
 *   scenarioFmt?
 *   scenarioTitle?
 *   // Compliance / checklist
 *   checklist?: [{id,area,item}]  — default IN_S2_CHECKLIST
 *   defaultCovered?: string[]     — ids covered by default
 *   // Peer comparables
 *   peers?: { cols:[{k,label,fmt?}], rows:[{...}] }
 */
export default function IndiaAdvancedAnalytics({
  T, moduleCode, title = 'Advanced Analytics & Risk Suite',
  mcModel, tornadoModel,
  scenarioImpact, scenarioFmt = (n) => n.toFixed(1), scenarioTitle = 'Scenario × Horizon — EBITDA / Margin impact (%)',
  checklist = IN_S2_CHECKLIST, defaultCovered = ['gov1', 'str1', 'met1', 'met2'],
  peers, brsrDefault = ['brsr1', 'brsr4', 'brsr5', 'brsr6'],
  frameworkBLabel = 'SEBI BRSR CORE COVERAGE', frameworkBRingLabel = 'BRSR',
  frameworkB = BRSR_CORE, scenarioPathsLabel = 'NGFS × IEA × domestic paths',
  indiaContext,
}) {
  const [mcN, setMcN] = useState(1000);
  const [reseed, setReseed] = useState(0);
  const [pathSel, setPathSel] = useState(Object.keys(NGFS_PATHS));
  const [covered, setCovered] = useState(new Set(defaultCovered));
  const [brsrCov, setBrsrCov] = useState(new Set(brsrDefault));

  const mc = useMemo(() => {
    void reseed;
    if (!mcModel) return null;
    return mcTriangular(mcModel.compute, mcModel.vars, mcN);
  }, [mcModel, mcN, reseed]);

  const torn = useMemo(() => {
    if (!tornadoModel) return [];
    return tornadoSweep(tornadoModel.inputs, tornadoModel.compute, 0.20);
  }, [tornadoModel]);

  const heatRows = Object.keys(NGFS_PATHS).filter(r => pathSel.includes(r));
  const heatCols = ['2025', '2030', '2040', '2050'];
  const heatData = useMemo(() => {
    const d = {};
    heatRows.forEach(r => {
      d[r] = {};
      heatCols.forEach(c => {
        const p = NGFS_PATHS[r][+c] ?? 0;
        d[r][c] = scenarioImpact ? scenarioImpact(p, +c) : p;
      });
    });
    return d;
  }, [heatRows, scenarioImpact]);

  const s2Pct = (covered.size / checklist.length) * 100;
  const brsrPct = (brsrCov.size / frameworkB.length) * 100;
  const toggle = (set, setter, id) => { const n = new Set(set); n.has(id) ? n.delete(id) : n.add(id); setter(n); };

  return (
    <div style={{ marginTop: 24, paddingTop: 18, borderTop: `2px solid ${T.gold}` }}>
      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 4, letterSpacing: 1 }}>
        {moduleCode} · ADVANCED ANALYTICS
      </div>
      <div style={{ fontSize: 16, color: T.text, fontWeight: 700, marginBottom: 16 }}>{title}</div>

      {/* Row 1: MC + Tornado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {mcModel && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut }}>MONTE CARLO · triangular N={mcN}</div>
              <div>
                <select value={mcN} onChange={e => setMcN(+e.target.value)} style={{ background: T.surfaceH, color: T.text, border: `1px solid ${T.border}`, fontSize: 10, fontFamily: T.mono, padding: '2px 6px' }}>
                  {[500, 1000, 2000, 5000].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <button onClick={() => setReseed(x => x + 1)} style={{ marginLeft: 6, background: T.surfaceH, color: T.gold, border: `1px solid ${T.border}`, padding: '2px 8px', fontSize: 10, fontFamily: T.mono, cursor: 'pointer', borderRadius: 3 }}>↻</button>
              </div>
            </div>
            <MCCard title={mcModel.title} stats={mc} fmt={mcModel.fmt} unit={mcModel.unit} T={T} />
          </div>
        )}
        {tornadoModel && (
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut, marginBottom: 8 }}>TORNADO · ±20% driver swing</div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 10 }}>{tornadoModel.title}</div>
              <Tornado rows={torn.map(r => ({ driver: r.driver, low: r.low, high: r.high, base: r.base }))} fmt={tornadoModel.fmt} T={T} />
            </div>
          </div>
        )}
      </div>

      {/* Row 2: Scenario heatmap */}
      {scenarioImpact && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut }}>{scenarioTitle}</div>
            <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>{scenarioPathsLabel}</div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
            <Heatmap data={heatData} rows={heatRows} cols={heatCols} fmt={scenarioFmt} T={T} />
            <div style={{ marginTop: 8, fontSize: 10, color: T.textMut, fontFamily: T.mono }}>
              Cells show module-specific impact at each scenario × horizon (green = low, red = high).
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Compliance rings + peers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 10 }}>IFRS S2 / TCFD READINESS</div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <ProgressRing pct={s2Pct} size={84} label="S2 covered" T={T} />
            <div style={{ flex: 1, maxHeight: 220, overflowY: 'auto' }}>
              <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
                <tbody>{checklist.map(c => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${T.borderL}` }}>
                    <td style={{ padding: 3, width: 24 }}><input type="checkbox" checked={covered.has(c.id)} onChange={() => toggle(covered, setCovered, c.id)} /></td>
                    <td style={{ padding: 3, fontFamily: T.mono, color: T.textMut, width: 80 }}>{c.area}</td>
                    <td style={{ padding: 3, color: T.text }}>{c.item}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 10 }}>{frameworkBLabel}</div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <ProgressRing pct={brsrPct} size={84} label={frameworkBRingLabel} T={T} />
            <div style={{ flex: 1 }}>
              <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
                <tbody>{frameworkB.map(b => (
                  <tr key={b.id} style={{ borderTop: `1px solid ${T.borderL}` }}>
                    <td style={{ padding: 3, width: 24 }}><input type="checkbox" checked={brsrCov.has(b.id)} onChange={() => toggle(brsrCov, setBrsrCov, b.id)} /></td>
                    <td style={{ padding: 3, color: T.text }}>{b.item}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Peer comparables */}
      {peers && peers.rows && peers.rows.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14, marginBottom: 16 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 10 }}>{peers.title || 'PEER / BENCHMARK COMPARABLES'}</div>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead><tr style={{ color: T.textMut }}>
              {peers.cols.map(c => <th key={c.k} style={{ padding: 6, textAlign: c.align || 'left', fontFamily: T.mono }}>{c.label}</th>)}
            </tr></thead>
            <tbody>{peers.rows.map((r, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${T.borderL}` }}>
                {peers.cols.map(c => {
                  const v = r[c.k];
                  const disp = c.fmt ? c.fmt(v, r) : v;
                  return <td key={c.k} style={{ padding: 6, textAlign: c.align || 'left', fontFamily: c.mono ? T.mono : T.font, color: c.color ? c.color(v, r) : T.text }}>{disp}</td>;
                })}
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* Row 5: India Market Context (regulatory badges + Indian peers + KPIs) */}
      {indiaContext && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 14 }}>🇮🇳</span>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 1 }}>INDIA MARKET CONTEXT</div>
            {indiaContext.subtitle && <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>· {indiaContext.subtitle}</div>}
          </div>

          {indiaContext.regulations && indiaContext.regulations.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {indiaContext.regulations.map((r, i) => (
                <span key={i} title={r.detail || ''} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: T.surfaceH, border: `1px solid ${T.borderL}`, borderRadius: 12, fontSize: 10, fontFamily: T.mono, color: r.status === 'active' ? T.green : r.status === 'partial' ? T.amber : T.textSec }}>
                  {r.status === 'active' ? '●' : r.status === 'partial' ? '◐' : '○'} {r.tag}
                </span>
              ))}
            </div>
          )}

          {indiaContext.kpis && indiaContext.kpis.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(4, indiaContext.kpis.length)}, 1fr)`, gap: 10, marginBottom: 12 }}>
              {indiaContext.kpis.map((k, i) => (
                <div key={i} style={{ padding: 8, background: T.surfaceH, borderRadius: 4, borderLeft: `3px solid ${T.gold}` }}>
                  <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono, letterSpacing: 0.5 }}>{k.label}</div>
                  <div style={{ fontSize: 14, color: T.text, fontFamily: T.mono, fontWeight: 700, marginTop: 2 }}>{k.value}</div>
                  {k.detail && <div style={{ fontSize: 9, color: T.textMut, marginTop: 2 }}>{k.detail}</div>}
                </div>
              ))}
            </div>
          )}

          {indiaContext.peers && indiaContext.peers.rows && indiaContext.peers.rows.length > 0 && (
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textSec, marginBottom: 6 }}>{indiaContext.peers.title || 'INDIAN PEER BENCHMARKS'}</div>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead><tr style={{ color: T.textMut }}>
                  {indiaContext.peers.cols.map(c => <th key={c.k} style={{ padding: 6, textAlign: c.align || 'left', fontFamily: T.mono }}>{c.label}</th>)}
                </tr></thead>
                <tbody>{indiaContext.peers.rows.map((r, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${T.borderL}` }}>
                    {indiaContext.peers.cols.map(c => {
                      const v = r[c.k];
                      const disp = c.fmt ? c.fmt(v, r) : v;
                      return <td key={c.k} style={{ padding: 6, textAlign: c.align || 'left', fontFamily: c.mono ? T.mono : T.font, color: c.color ? c.color(v, r) : T.text }}>{disp}</td>;
                    })}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {indiaContext.notes && (
            <div style={{ marginTop: 10, padding: '8px 10px', background: T.surfaceH, borderRadius: 4, fontSize: 10, color: T.textSec, fontFamily: T.mono, lineHeight: 1.5 }}>
              {indiaContext.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
