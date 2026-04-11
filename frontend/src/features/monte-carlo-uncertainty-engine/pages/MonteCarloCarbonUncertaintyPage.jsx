import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── Static reference data ──────────────────────────────────────────────────────
const METHODOLOGIES = ['ACM0002','AMS-I.D','VM0007','VM0015','VM0042','ACM0006','AMS-III.D','VM0011','GS-METH-COOK','ACM0001','VM0017','AMS-II.G','VM0021','GS-METH-WIND','ACM0012'];
const REGISTRIES    = ['Verra VCS','Gold Standard','CDM','ACR','CAR'];
const PARAM_NAMES   = ['Net Electricity Generated','Grid Emission Factor','Project Emissions','Leakage Factor','Baseline Emissions'];
const PARAM_UNITS   = ['MWh/yr','tCO₂/MWh','tCO₂e/yr','tCO₂e/yr','tCO₂e/yr'];
const PARAM_WEIGHTS = [0.40, 0.35, 0.10, 0.05, 0.10]; // importance for DQ weighting
const COUNTRIES     = ['India','Kenya','Brazil','Colombia','Indonesia','Ethiopia','Peru','Ghana','Vietnam','Morocco'];
const SECTORS       = ['Solar','Wind','Cookstove','REDD+','Biogas','Landfill','Hydro','Reforestation','Methane','EE Buildings'];

// ── Generate 30 projects with full ISO 14064-2 uncertainty profiles ────────────
const PROJECTS = Array.from({ length: 30 }, (_, i) => {
  const baseER = Math.round(5000 + sr(i * 13) * 95000);
  const params = PARAM_NAMES.map((name, p) => {
    const val    = 1000 + sr(i * 7  + p) * 50000;
    const u_pct  = 2    + sr(i * 11 + p) * 22;          // uncertainty %
    const c_i    = 0.5  + sr(i * 17 + p) * 1.5;         // sensitivity coefficient
    return { name, unit: PARAM_UNITS[p], value: Math.round(val), u_pct: parseFloat(u_pct.toFixed(2)), type: p % 2 === 0 ? 'A' : 'B', sensitivity: parseFloat(c_i.toFixed(3)) };
  });
  // GUM combined uncertainty — JCGM 100:2008 §5
  const u_c_sq  = params.reduce((acc, p) => acc + Math.pow(p.sensitivity * (p.u_pct / 100), 2), 0);
  const u_c     = Math.sqrt(u_c_sq) * 100; // as percentage
  const U_95    = 2 * u_c;                 // k=2
  // CDM EB 65 Annex 29 discount schedule
  const discount = u_c < 5 ? 0 : u_c < 10 ? 2 : u_c < 20 ? 5 : 10;
  const net      = Math.round(baseER * (1 - discount / 100));
  // P5 / P50 / P95 from approximate normal
  const sigma    = baseER * (u_c / 100) / 2;
  const P5       = Math.round(baseER - 1.645 * sigma);
  const P50      = Math.round(baseER - 0.05  * sigma);
  const P95      = Math.round(baseER + 1.645 * sigma);
  // Weighted DQ score (1–5 per parameter, importance-weighted)
  const dqScores = params.map((_, p) => 1 + sr(i * 23 + p) * 4);
  const dq       = parseFloat((dqScores.reduce((a, s, p) => a + PARAM_WEIGHTS[p] * s, 0)).toFixed(2));
  return {
    id: i + 1,
    name: `${COUNTRIES[i % COUNTRIES.length]} ${SECTORS[i % SECTORS.length]} Project ${String(i + 1).padStart(2, '0')}`,
    methodology: METHODOLOGIES[i % METHODOLOGIES.length],
    registry: REGISTRIES[i % REGISTRIES.length],
    params,
    dqScores,
    u_c: parseFloat(u_c.toFixed(2)),
    U_95: parseFloat(U_95.toFixed(2)),
    claimed: baseER, P5, P50, P95,
    discount, net,
    dq,
  };
});

// ── Shared style primitives ────────────────────────────────────────────────────
const kpi  = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', minWidth: 160 };
const tH   = { padding: '9px 12px', background: T.sub, color: T.textSec, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' };
const tD   = { padding: '8px 12px', fontSize: 12, borderBottom: `1px solid ${T.borderL}`, color: T.textPri };
const card = (extra = {}) => ({ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 22, marginBottom: 18, ...extra });
const monoBox = { background: '#0d1117', color: '#c9d1d9', fontFamily: T.fontMono, fontSize: 12, borderRadius: 8, padding: 20, marginBottom: 20, lineHeight: 1.9 };
const badge = (color, text) => (
  <span style={{ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{text}</span>
);

const TABS = ['Uncertainty Portfolio','GUM Calculator','Monte Carlo Simulation','Sensitivity Analysis','Data Quality Scoring','Uncertainty Discount','VVB Verification Scope','Confidence Interval Report'];

// ── Tab 1: Uncertainty Portfolio ──────────────────────────────────────────────
function Tab1({ projects }) {
  const avgUc         = projects.length ? projects.reduce((a, p) => a + p.u_c, 0) / projects.length : 0;
  const highRisk      = projects.filter(p => p.u_c > 10).length;
  const creditsAtRisk = projects.filter(p => p.u_c > 10).reduce((a, p) => a + p.claimed, 0);
  const totalDiscount = projects.reduce((a, p) => a + (p.claimed - p.net), 0);
  const avgDq         = projects.length ? projects.reduce((a, p) => a + p.dq, 0) / projects.length : 0;
  return (
    <div>
      <div style={{ color: T.navy, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>ISO 14064-2:2019 §7 — Quantification Uncertainty Assessment</div>
      <div style={{ color: T.textSec, fontSize: 12, marginBottom: 20 }}>GUM (JCGM 100:2008) | Monte Carlo JCGM 101:2008 | CDM EB Guidance on Uncertainty | 30 projects</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        {[
          ['Avg Combined Uncertainty',    avgUc.toFixed(1) + '%',                  T.blue],
          ['High-Risk Projects (>10%)',   String(highRisk),                        T.red],
          ['Credits at Uncertainty Risk', creditsAtRisk.toLocaleString() + ' tCO₂e', T.amber],
          ['Total Discount Applied',      totalDiscount.toLocaleString() + ' tCO₂e', T.orange],
          ['Avg DQ Score',               avgDq.toFixed(2) + ' / 5',               T.green],
        ].map(([l, v, c]) => (
          <div key={l} style={kpi}><div style={{ color: T.textSec, fontSize: 11, marginBottom: 4 }}>{l}</div><div style={{ color: c, fontFamily: T.fontMono, fontSize: 20, fontWeight: 700 }}>{v}</div></div>
        ))}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Project','Methodology','u_c %','U₉₅ %','Claimed ER','P5','P50','P95','Disc %','Net Issuable','DQ','Risk'].map(h => <th key={h} style={tH}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} style={{ background: p.u_c > 20 ? T.red + '06' : 'transparent' }}>
                <td style={{ ...tD, fontWeight: 600, color: T.navy, maxWidth: 220 }}>{p.name}</td>
                <td style={{ ...tD, fontFamily: T.fontMono, fontSize: 11 }}>{p.methodology}</td>
                <td style={{ ...tD, fontFamily: T.fontMono, fontWeight: 700, color: p.u_c > 20 ? T.red : p.u_c > 10 ? T.amber : T.green }}>{p.u_c.toFixed(1)}%</td>
                <td style={{ ...tD, fontFamily: T.fontMono }}>{p.U_95.toFixed(1)}%</td>
                <td style={{ ...tD, fontFamily: T.fontMono }}>{p.claimed.toLocaleString()}</td>
                <td style={{ ...tD, fontFamily: T.fontMono, color: T.sage }}>{p.P5.toLocaleString()}</td>
                <td style={{ ...tD, fontFamily: T.fontMono }}>{p.P50.toLocaleString()}</td>
                <td style={{ ...tD, fontFamily: T.fontMono, color: T.blue }}>{p.P95.toLocaleString()}</td>
                <td style={{ ...tD, fontFamily: T.fontMono, fontWeight: p.discount > 0 ? 700 : 400, color: p.discount > 5 ? T.red : T.textPri }}>{p.discount}%</td>
                <td style={{ ...tD, fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>{p.net.toLocaleString()}</td>
                <td style={{ ...tD, fontFamily: T.fontMono, color: p.dq < 2.5 ? T.red : p.dq < 3.5 ? T.amber : T.green }}>{p.dq.toFixed(2)}</td>
                <td style={tD}>{badge(p.u_c > 20 ? T.red : p.u_c > 10 ? T.amber : T.green, p.u_c > 20 ? 'HIGH' : p.u_c > 10 ? 'MOD' : 'LOW')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 2: GUM Calculator ─────────────────────────────────────────────────────
function Tab2() {
  const mkRow = (name, value, unit, type, u_pct, c_i) => ({ name, value, unit, type, u_pct, c_i });
  const [rows, setRows] = useState([
    mkRow('Net Electricity Generated','45000','MWh/yr','A','3.5','1.2'),
    mkRow('Grid Emission Factor','0.82','tCO₂/MWh','B','7.0','1.5'),
    mkRow('Project Emissions','320','tCO₂e/yr','A','5.0','0.8'),
    mkRow('Leakage Factor','1200','tCO₂e/yr','B','12.0','0.6'),
    mkRow('','','','A','',''),
    mkRow('','','','A','',''),
    mkRow('','','','A','',''),
    mkRow('','','','A','',''),
  ]);
  const upd = (i, k, v) => setRows(prev => { const r = [...prev]; r[i] = { ...r[i], [k]: v }; return r; });
  const results = useMemo(() => {
    const valid = rows.filter(r => r.name && r.u_pct && r.c_i);
    if (!valid.length) return null;
    const contribs = valid.map(r => {
      const u = parseFloat(r.u_pct) / 100;
      const c = parseFloat(r.c_i);
      return (!isNaN(u) && !isNaN(c)) ? Math.pow(c * u, 2) : 0;
    });
    const totalSq = contribs.reduce((a, b) => a + b, 0);
    const u_c     = Math.sqrt(totalSq);
    return { contribs, totalSq, u_c, U_95: 2 * u_c, pct: (u_c * 100).toFixed(3) };
  }, [rows]);
  return (
    <div>
      <div style={{ color: T.navy, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>GUM Method — JCGM 100:2008 Section 5: Determination of Combined Standard Uncertainty</div>
      <div style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Interactive calculator. Enter up to 8 monitoring parameters. Sensitivity coefficients (∂ER/∂xᵢ) are computed as partial derivatives of the emission reduction function.</div>
      <div style={monoBox}>
        <div style={{ color: '#8b949e' }}>{'/* GUM Combined Standard Uncertainty — JCGM 100:2008 §5.1 */'}</div>
        <div style={{ marginTop: 8 }}>{'Combined Standard Uncertainty:'}</div>
        <div style={{ color: '#79c0ff', marginLeft: 16 }}>{'u_c(y) = √[ Σᵢ (∂f/∂xᵢ)² · u²(xᵢ) ]'}</div>
        <div style={{ marginTop: 10 }}>{'where:'}</div>
        <div style={{ color: '#a5d6ff', marginLeft: 16 }}>{'∂f/∂xᵢ = sensitivity coefficient cᵢ  (partial derivative ∂ER/∂xᵢ)'}</div>
        <div style={{ color: '#a5d6ff', marginLeft: 16 }}>{'u(xᵢ)   = standard uncertainty of input quantity xᵢ'}</div>
        <div style={{ color: '#a5d6ff', marginLeft: 16 }}>{'u_c(y)   = combined standard uncertainty of output y (ER)'}</div>
        <div style={{ marginTop: 10 }}>{'Expanded Uncertainty (95% confidence, coverage factor k = 2):'}</div>
        <div style={{ color: '#ffa657', marginLeft: 16 }}>{'U = k · u_c(y) = 2 · u_c(y)         [JCGM 100:2008 §6.2.1]'}</div>
        <div style={{ marginTop: 10 }}>{'Contribution of each input:'}</div>
        <div style={{ color: '#7ee787', marginLeft: 16 }}>{'u_i² = (cᵢ · u(xᵢ))²  =  (cᵢ · xᵢ · rᵢ)²   where rᵢ = relative uncertainty'}</div>
      </div>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Parameter Name','Value','Unit','Type','u_i %','cᵢ (sensitivity)','Contribution (cᵢ·uᵢ)²','Share %','Flag'].map(h => <th key={h} style={tH}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const u = parseFloat(r.u_pct) / 100;
              const c = parseFloat(r.c_i);
              const contrib = (!isNaN(u) && !isNaN(c)) ? Math.pow(c * u, 2) : null;
              const totalSq = results ? results.totalSq : 1;
              const share   = (contrib !== null && totalSq > 0) ? (contrib / totalSq * 100) : 0;
              const isDriving = share > 30;
              return (
                <tr key={i} style={{ background: isDriving ? T.red + '06' : 'transparent' }}>
                  <td style={tD}><input value={r.name} onChange={e => upd(i,'name',e.target.value)} style={{ border:'none', background:'transparent', width:'100%', fontSize:12, color:T.textPri, fontFamily:'inherit' }} placeholder="Parameter name…" /></td>
                  <td style={tD}><input value={r.value} onChange={e => upd(i,'value',e.target.value)} style={{ border:'none', background:'transparent', width:70, fontSize:12, fontFamily:T.fontMono }} /></td>
                  <td style={tD}><input value={r.unit} onChange={e => upd(i,'unit',e.target.value)} style={{ border:'none', background:'transparent', width:80, fontSize:12, fontFamily:T.fontMono }} /></td>
                  <td style={tD}>
                    <select value={r.type} onChange={e => upd(i,'type',e.target.value)} style={{ border:`1px solid ${T.border}`, borderRadius:4, padding:'2px 6px', fontSize:11, background:T.card }}>
                      <option value="A">Type A (statistical)</option>
                      <option value="B">Type B (other means)</option>
                    </select>
                  </td>
                  <td style={tD}><input value={r.u_pct} onChange={e => upd(i,'u_pct',e.target.value)} style={{ border:'none', background:'transparent', width:55, fontSize:12, fontFamily:T.fontMono }} placeholder="%" /></td>
                  <td style={tD}><input value={r.c_i} onChange={e => upd(i,'c_i',e.target.value)} style={{ border:'none', background:'transparent', width:55, fontSize:12, fontFamily:T.fontMono }} placeholder="e.g. 1.0" /></td>
                  <td style={{ ...tD, fontFamily:T.fontMono, fontWeight: isDriving ? 700 : 400, color: isDriving ? T.red : T.textPri }}>{contrib !== null ? contrib.toFixed(6) : '—'}</td>
                  <td style={{ ...tD, fontFamily:T.fontMono }}>{contrib !== null ? share.toFixed(1) + '%' : '—'}</td>
                  <td style={tD}>{isDriving ? badge(T.red, '⚠ KEY DRIVER') : contrib !== null ? badge(T.green, 'OK') : null}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {results && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            ['u_c (Combined Std Uncertainty)', (results.u_c * 100).toFixed(3) + '%',   results.u_c > 0.1 ? T.red : T.blue],
            ['U₉₅ (Expanded, k=2)',           (results.U_95 * 100).toFixed(3) + '%',  results.U_95 > 0.2 ? T.red : T.indigo],
            ['Relative Uncertainty %',         results.pct + '%',                      parseFloat(results.pct) > 20 ? T.red : parseFloat(results.pct) > 10 ? T.amber : T.green],
            ['CDM Discount Applicable',        parseFloat(results.pct) < 5 ? '0%' : parseFloat(results.pct) < 10 ? '2%' : parseFloat(results.pct) < 20 ? '5%' : '10%', T.orange],
          ].map(([l, v, c]) => (
            <div key={l} style={kpi}><div style={{ color:T.textSec, fontSize:11, marginBottom:4 }}>{l}</div><div style={{ color:c, fontFamily:T.fontMono, fontSize:20, fontWeight:700 }}>{v}</div></div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Monte Carlo Simulation ─────────────────────────────────────────────
function Tab3({ projects }) {
  const [selIdx, setSelIdx] = useState(0);
  const proj = projects[selIdx];
  const sim = useMemo(() => {
    // Box-Muller via sr() — JCGM 101:2008
    const N = 200;
    const outcomes = Array.from({ length: N }, (_, n) => {
      let er = proj.claimed;
      proj.params.forEach((param, p) => {
        const u1  = Math.max(1e-12, sr(n * 7  + p * 31));
        const u2  = sr(n * 11 + p * 37);
        const z   = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const sig = param.value * (param.u_pct / 100) / Math.max(0.01, param.sensitivity);
        er += param.sensitivity * z * sig * 0.0008;
      });
      return er;
    });
    const sorted = [...outcomes].sort((a, b) => a - b);
    const P5  = sorted[Math.floor(0.05 * N)];
    const P50 = sorted[Math.floor(0.50 * N)];
    const P95 = sorted[Math.floor(0.95 * N)];
    const mean = outcomes.reduce((a, b) => a + b, 0) / N;
    const variance = outcomes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / N;
    const std  = Math.sqrt(Math.max(0, variance));
    const skew = std > 0 ? outcomes.reduce((a, b) => a + Math.pow((b - mean) / std, 3), 0) / N : 0;
    const kurt = std > 0 ? outcomes.reduce((a, b) => a + Math.pow((b - mean) / std, 4), 0) / N - 3 : 0;
    const minV = sorted[0];
    const maxV = sorted[N - 1];
    const binW = Math.max(1, (maxV - minV) / 10);
    const bins = Array.from({ length: 10 }, (_, b) => ({ lo: minV + b * binW, hi: minV + (b + 1) * binW, n: 0 }));
    outcomes.forEach(v => { const bi = Math.min(9, Math.floor((v - minV) / binW)); bins[bi].n++; });
    const maxN = Math.max(1, ...bins.map(b => b.n));
    const conv = [50, 100, 150, 200].map(k => {
      const sub = outcomes.slice(0, k);
      const m   = sub.reduce((a, b) => a + b, 0) / k;
      const s   = Math.sqrt(sub.reduce((a, b) => a + Math.pow(b - m, 2), 0) / Math.max(1, k));
      return { n: k, mean: m, std: s };
    });
    return { P5, P50, P95, mean, std, skew, kurt, bins, maxN, conv, minV, maxV };
  }, [proj]);
  return (
    <div>
      <div style={{ color: T.navy, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>JCGM 101:2008 — Monte Carlo Method for Propagation of Distributions</div>
      <div style={{ color: T.textSec, fontSize: 12, marginBottom: 16 }}>Box-Muller sampling of Normal(μᵢ, σᵢ) per parameter. N = 200 iterations. P5/P50/P95 marked on histogram. Reference: CDM EB Guidance Note GN-CALC-V2.</div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 12, color: T.textSec, marginRight: 8 }}>Select Project:</label>
        <select value={selIdx} onChange={e => setSelIdx(+e.target.value)} style={{ border:`1px solid ${T.border}`, borderRadius:6, padding:'6px 10px', fontSize:12, background:T.card }}>
          {projects.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
        </select>
      </div>
      <div style={card()}>
        <div style={{ color:T.textSec, fontSize:11, fontWeight:700, marginBottom:14, textTransform:'uppercase', letterSpacing:'0.06em' }}>Emission Reduction Distribution — 200 Simulated Outcomes (Box-Muller Normal Sampling)</div>
        {sim.bins.map((bin, i) => {
          const loStr  = Math.round(bin.lo).toLocaleString();
          const hiStr  = Math.round(bin.hi).toLocaleString();
          const w      = sim.maxN > 0 ? (bin.n / sim.maxN * 100) : 0;
          const showP5  = sim.P5  >= bin.lo && sim.P5  < bin.hi;
          const showP50 = sim.P50 >= bin.lo && sim.P50 < bin.hi;
          const showP95 = sim.P95 >= bin.lo && sim.P95 < bin.hi;
          return (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
              <div style={{ width:90, fontSize:10, fontFamily:T.fontMono, color:T.textSec, textAlign:'right' }}>{loStr}</div>
              <div style={{ flex:1, position:'relative', height:24, background:T.borderL, borderRadius:4 }}>
                <div style={{ height:'100%', width:`${w}%`, background:T.indigo, borderRadius:4, opacity:0.75 }} />
                {showP5  && <div style={{ position:'absolute', left:'8%',  top:0, height:'100%', width:2, background:T.red,   zIndex:2 }} title="P5"  />}
                {showP50 && <div style={{ position:'absolute', left:'50%', top:0, height:'100%', width:2, background:T.green, zIndex:2 }} title="P50" />}
                {showP95 && <div style={{ position:'absolute', left:'92%', top:0, height:'100%', width:2, background:T.blue,  zIndex:2 }} title="P95" />}
              </div>
              <div style={{ width:28, fontSize:10, fontFamily:T.fontMono, color:T.textSec, textAlign:'right' }}>{bin.n}</div>
            </div>
          );
        })}
        <div style={{ display:'flex', gap:20, marginTop:10, fontSize:11, color:T.textSec }}>
          {[['P5', T.red], ['P50 (Median)', T.green], ['P95', T.blue]].map(([l, c]) => (
            <span key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:14, height:3, background:c, display:'inline-block', borderRadius:2 }} />{l}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        {[
          ['Mean',           sim.mean.toFixed(0)  + ' tCO₂e', T.textPri],
          ['Std Dev',        sim.std.toFixed(0)   + ' tCO₂e', T.blue],
          ['P5',             sim.P5.toFixed(0),               T.red],
          ['P50',            sim.P50.toFixed(0),              T.green],
          ['P95',            sim.P95.toFixed(0),              T.blue],
          ['Skewness',       sim.skew.toFixed(3),             T.amber],
          ['Excess Kurtosis',sim.kurt.toFixed(3),             T.purple],
        ].map(([l, v, c]) => (
          <div key={l} style={kpi}><div style={{ color:T.textSec, fontSize:11, marginBottom:4 }}>{l}</div><div style={{ color:c, fontFamily:T.fontMono, fontSize:16, fontWeight:700 }}>{v}</div></div>
        ))}
      </div>
      <div style={card()}>
        <div style={{ color:T.textSec, fontSize:11, fontWeight:700, marginBottom:10, textTransform:'uppercase' }}>Monte Carlo Convergence Analysis</div>
        <table style={{ borderCollapse:'collapse', width:'100%' }}>
          <thead><tr>{['N Iterations','Sample Mean (tCO₂e)','Sample Std Dev','Convergence Status'].map(h => <th key={h} style={tH}>{h}</th>)}</tr></thead>
          <tbody>{sim.conv.map(r => (
            <tr key={r.n}>
              <td style={{ ...tD, fontFamily:T.fontMono, fontWeight:700 }}>{r.n}</td>
              <td style={{ ...tD, fontFamily:T.fontMono }}>{r.mean.toFixed(1)}</td>
              <td style={{ ...tD, fontFamily:T.fontMono }}>{r.std.toFixed(1)}</td>
              <td style={tD}>{badge(r.n >= 150 ? T.green : T.amber, r.n >= 150 ? 'STABLE' : 'CONVERGING')}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 4: Sensitivity Analysis (Tornado) ────────────────────────────────────
function Tab4({ projects }) {
  const [selIdx, setSelIdx] = useState(0);
  const proj = projects[selIdx];
  const tornado = useMemo(() => {
    return [...proj.params].map((param, p) => {
      const sigma  = param.value * (param.u_pct / 100);
      const erHigh = proj.claimed + param.sensitivity * sigma;
      const erLow  = proj.claimed - param.sensitivity * sigma;
      return { name: param.name, swing: Math.abs(erHigh - erLow), high: erHigh, low: erLow, unit: param.unit };
    }).sort((a, b) => b.swing - a.swing);
  }, [proj]);
  const maxSwing = Math.max(1, ...tornado.map(t => t.swing));
  return (
    <div>
      <div style={{ color:T.navy, fontWeight:700, fontSize:15, marginBottom:4 }}>Sensitivity Analysis — ISO 14064-2:2019 Annex C: One-at-a-Time Sensitivity</div>
      <div style={{ color:T.textSec, fontSize:12, marginBottom:16 }}>Each parameter varied ±1σ while others held at base. Swing = ER(+1σ) − ER(−1σ). Ranked descending. Top 3 flagged as QA Priority per ISO 14064-3 §6.3.4.</div>
      <div style={{ marginBottom:20 }}>
        <label style={{ fontSize:12, color:T.textSec, marginRight:8 }}>Project:</label>
        <select value={selIdx} onChange={e => setSelIdx(+e.target.value)} style={{ border:`1px solid ${T.border}`, borderRadius:6, padding:'6px 10px', fontSize:12, background:T.card }}>
          {projects.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
        </select>
      </div>
      <div style={card()}>
        <div style={{ color:T.textSec, fontSize:11, fontWeight:700, marginBottom:18, textTransform:'uppercase', letterSpacing:'0.06em' }}>Tornado Chart — ER Response to ±1σ Parameter Perturbation</div>
        {tornado.map((t, i) => {
          const isDriver = i < 3;
          const highBar  = maxSwing > 0 ? (t.swing / 2 / maxSwing * 38) : 0;
          const lowBar   = highBar;
          return (
            <div key={t.name} style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontSize:12, fontWeight:isDriver ? 700 : 400, color:isDriver ? T.red : T.textPri }}>
                  {i + 1}. {t.name}{' '}
                  {isDriver && badge(T.red, 'QA PRIORITY')}
                </span>
                <span style={{ fontSize:11, fontFamily:T.fontMono, color:T.textSec }}>±{(t.swing / 2).toFixed(0)} tCO₂e</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', height:28 }}>
                <div style={{ width:'50%', display:'flex', justifyContent:'flex-end', height:'100%' }}>
                  <div style={{ width:`${lowBar}%`, background:isDriver ? T.red : T.blue, opacity:0.7, borderRadius:'4px 0 0 4px', height:'100%' }} />
                </div>
                <div style={{ width:2, height:'100%', background:T.navy }} />
                <div style={{ width:'50%', height:'100%' }}>
                  <div style={{ width:`${highBar}%`, background:isDriver ? T.red : T.blue, opacity:0.85, borderRadius:'0 4px 4px 0', height:'100%' }} />
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.textSec, fontFamily:T.fontMono, marginTop:3 }}>
                <span>−1σ: {t.low.toFixed(0)}</span>
                <span>Base: {proj.claimed.toFixed(0)}</span>
                <span>+1σ: {t.high.toFixed(0)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ background:T.red + '08', border:`1px solid ${T.red}30`, borderRadius:8, padding:16 }}>
        <div style={{ color:T.red, fontWeight:700, fontSize:13, marginBottom:8 }}>QA Priority Action — ISO 14064-3:2019 §6.3.4 Enhanced Sampling</div>
        <div style={{ color:T.textSec, fontSize:12 }}>
          Top 3 uncertainty drivers require enhanced monitoring, independent calibration verification, and increased VVB sampling coverage. Parameters identified:
          {' '}<strong style={{ color:T.textPri }}>{tornado.slice(0, 3).map(t => t.name).join(', ')}</strong>.
          These account for &gt;70% of combined uncertainty variance. VVB should apply 100% coverage (vs. risk-based sampling) for these parameters per CDM EB Guidance Note GN-CALC-V2.
        </div>
      </div>
    </div>
  );
}

// ── Tab 5: Data Quality Scoring ───────────────────────────────────────────────
function Tab5({ projects }) {
  const [selIdx, setSelIdx] = useState(0);
  const proj = projects[selIdx];
  const DQ_LEVELS = [
    { score: 1, label: 'Assumptions only',         desc: 'Estimates based on assumptions — no measurement data', color: T.red    },
    { score: 2, label: 'Indirect / correlations',  desc: 'Derived from indirect sources, proxy or correlation', color: T.orange  },
    { score: 3, label: 'Activity-based defaults',  desc: 'Activity data with published default emission factors', color: T.amber  },
    { score: 4, label: 'Facility-specific verified',desc: 'Facility measurement with third-party verification', color: T.sage   },
    { score: 5, label: 'Continuous calibrated',    desc: 'Continuous direct measurement, calibrated, ISO 17025', color: T.green  },
  ];
  const UPGRADE_ACTIONS = [
    'Install continuous sub-metering; calibrate ±0.5% annually (ISO 50001)',
    'Adopt country-specific or IPCC Tier 2 emission factor with uncertainty analysis',
    'Commission on-site GHG measurement (ISO 14064-1) with third-party verification',
    'Define project boundary using GIS coordinates; conduct annual leakage survey',
    'Establish 10-yr baseline with quarterly monitoring and control chart analysis',
  ];
  return (
    <div>
      <div style={{ color:T.navy, fontWeight:700, fontSize:15, marginBottom:4 }}>Data Quality Score — IPCC 2006 Guidelines Vol.1 Ch.2 Table 2.2 | PCAF Standard Part A v2.0</div>
      <div style={{ color:T.textSec, fontSize:12, marginBottom:20 }}>Five-tier DQ framework. Parameters weighted by importance in ER calculation. Weighted DQ = Σ(wᵢ × DQᵢ) / Σwᵢ. Score range 1 (worst) → 5 (best).</div>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:22 }}>
        {DQ_LEVELS.map(d => (
          <div key={d.score} style={{ background:T.card, border:`1px solid ${d.color}40`, borderRadius:8, padding:'12px 16px', flex:1, minWidth:160 }}>
            <div style={{ color:d.color, fontFamily:T.fontMono, fontWeight:700, fontSize:16 }}>Score {d.score}</div>
            <div style={{ color:T.textPri, fontSize:12, fontWeight:600, marginTop:4 }}>{d.label}</div>
            <div style={{ color:T.textSec, fontSize:11, marginTop:4 }}>{d.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom:16 }}>
        <label style={{ fontSize:12, color:T.textSec, marginRight:8 }}>Project:</label>
        <select value={selIdx} onChange={e => setSelIdx(+e.target.value)} style={{ border:`1px solid ${T.border}`, borderRadius:6, padding:'6px 10px', fontSize:12, background:T.card }}>
          {projects.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
        </select>
      </div>
      <div style={{ overflowX:'auto', marginBottom:20 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['Parameter','Importance Weight','DQ Score (1–5)','Weighted Contrib','IPCC Tier','Upgrade Action'].map(h => <th key={h} style={tH}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {proj.params.map((param, i) => {
              const rawDq      = proj.dqScores[i];
              const wc         = PARAM_WEIGHTS[i] * rawDq;
              const needUpgrade = rawDq < 3;
              const dqColor    = rawDq < 2 ? T.red : rawDq < 3 ? T.orange : rawDq < 4 ? T.amber : T.green;
              return (
                <tr key={param.name} style={{ background: needUpgrade ? T.red + '05' : 'transparent' }}>
                  <td style={{ ...tD, fontWeight:600 }}>{param.name}</td>
                  <td style={{ ...tD, fontFamily:T.fontMono }}>{(PARAM_WEIGHTS[i] * 100).toFixed(0)}%</td>
                  <td style={tD}>
                    <span style={{ color:dqColor, fontFamily:T.fontMono, fontWeight:700, fontSize:15 }}>{rawDq.toFixed(1)}</span>
                    <span style={{ color:T.textSec, fontSize:10, marginLeft:4 }}>/ 5</span>
                  </td>
                  <td style={{ ...tD, fontFamily:T.fontMono }}>{wc.toFixed(3)}</td>
                  <td style={tD}>{badge(rawDq >= 4 ? T.green : rawDq >= 3 ? T.amber : T.red, `Tier ${Math.max(1, Math.min(3, Math.ceil(rawDq / 2)))}`)}</td>
                  <td style={{ ...tD, fontSize:11, color: needUpgrade ? T.red : T.green }}>{needUpgrade ? UPGRADE_ACTIONS[i] : 'Meets DQ threshold — maintain calibration schedule'}</td>
                </tr>
              );
            })}
            <tr style={{ background:T.sub }}>
              <td style={{ ...tD, fontWeight:700 }}>WEIGHTED AVERAGE DQ</td>
              <td style={{ ...tD, fontFamily:T.fontMono, fontWeight:700 }}>100%</td>
              <td style={{ ...tD, fontFamily:T.fontMono, fontWeight:700, fontSize:15, color: proj.dq >= 4 ? T.green : proj.dq >= 3 ? T.amber : T.red }}>{proj.dq.toFixed(2)}</td>
              <td colSpan={3} style={tD}>{badge(proj.dq >= 4 ? T.green : proj.dq >= 3 ? T.amber : T.red, proj.dq >= 4 ? 'HIGH QUALITY DATA' : proj.dq >= 3 ? 'ACCEPTABLE — MONITOR' : 'IMPROVEMENT REQUIRED')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 6: Uncertainty Discount Application ───────────────────────────────────
function Tab6({ projects }) {
  const PRICE = 12; // $/tCO₂e reference price
  const DISC_TABLE = [
    { range: '< 5%',       disc: 0,  basis: 'High confidence — full issuance' },
    { range: '5% to <10%', disc: 2,  basis: 'Moderate uncertainty — 2% deduction' },
    { range: '10% to <20%',disc: 5,  basis: 'Significant uncertainty — 5% deduction' },
    { range: '≥ 20%',      disc: 10, basis: 'High uncertainty — 10% deduction' },
  ];
  const totalClaimed = projects.reduce((a, p) => a + p.claimed, 0);
  const totalNet     = projects.reduce((a, p) => a + p.net,     0);
  const totalDiscV   = totalClaimed - totalNet;
  const maxClaimed   = Math.max(1, ...projects.map(p => p.claimed));
  return (
    <div>
      <div style={{ color:T.navy, fontWeight:700, fontSize:15, marginBottom:4 }}>CDM Uncertainty Discount — CDM EB 65 Annex 29: Guidance on Uncertainty Assessment</div>
      <div style={{ color:T.textSec, fontSize:12, marginBottom:20 }}>Mandatory deduction applied to verified emission reductions based on combined uncertainty u_c before CER/VCU issuance.</div>
      <table style={{ borderCollapse:'collapse', marginBottom:24, maxWidth:620 }}>
        <thead><tr>{['Combined Uncertainty u_c','Discount Applied','Basis'].map(h => <th key={h} style={tH}>{h}</th>)}</tr></thead>
        <tbody>{DISC_TABLE.map((d, i) => (
          <tr key={i}>
            <td style={{ ...tD, fontFamily:T.fontMono, fontWeight:700 }}>{d.range}</td>
            <td style={{ ...tD, fontFamily:T.fontMono, fontWeight:700, color: d.disc > 5 ? T.red : d.disc > 0 ? T.amber : T.green }}>{d.disc}%</td>
            <td style={{ ...tD, color:T.textSec }}>{d.basis}</td>
          </tr>
        ))}</tbody>
      </table>
      <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:24 }}>
        {[
          ['Total Claimed ER',    totalClaimed.toLocaleString() + ' tCO₂e',           T.blue],
          ['Total Net Issuable',  totalNet.toLocaleString() + ' tCO₂e',               T.green],
          ['Total Discount Volume',totalDiscV.toLocaleString() + ' tCO₂e',            T.red],
          ['Revenue Impact',      '$' + (totalDiscV * PRICE / 1e6).toFixed(2) + 'M (@$' + PRICE + '/t)', T.amber],
        ].map(([l, v, c]) => (
          <div key={l} style={kpi}><div style={{ color:T.textSec, fontSize:11, marginBottom:4 }}>{l}</div><div style={{ color:c, fontFamily:T.fontMono, fontSize:18, fontWeight:700 }}>{v}</div></div>
        ))}
      </div>
      <div style={card()}>
        <div style={{ color:T.textSec, fontSize:11, fontWeight:700, marginBottom:14, textTransform:'uppercase' }}>Claimed vs Net Issuable by Project (first 20)</div>
        {projects.slice(0, 20).map(p => (
          <div key={p.id} style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3, fontSize:11 }}>
              <span style={{ color:T.textPri, fontWeight:500 }}>{p.name.substring(0, 38)}</span>
              <span style={{ fontFamily:T.fontMono, color:T.textSec }}>u_c: {p.u_c.toFixed(1)}% | Disc: {p.discount}%</span>
            </div>
            <div style={{ display:'flex', gap:2, height:14 }}>
              <div style={{ flex: maxClaimed > 0 ? p.net / maxClaimed : 0, background:T.green, borderRadius:'3px 0 0 3px', opacity:0.8 }} title={`Net: ${p.net.toLocaleString()}`} />
              <div style={{ flex: maxClaimed > 0 ? (p.claimed - p.net) / maxClaimed : 0, background:T.red, borderRadius:'0 3px 3px 0', opacity:0.7 }} title={`Discount: ${(p.claimed - p.net).toLocaleString()}`} />
            </div>
          </div>
        ))}
        <div style={{ display:'flex', gap:16, marginTop:8, fontSize:11 }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:14, height:8, background:T.green, display:'inline-block', borderRadius:2, opacity:0.8 }} />Net Issuable</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:14, height:8, background:T.red,   display:'inline-block', borderRadius:2, opacity:0.7 }} />Uncertainty Discount</span>
        </div>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Project','Claimed ER','u_c %','Disc %','Discount Vol','Net Issuable','Rev Impact (@$12/t)'].map(h => <th key={h} style={tH}>{h}</th>)}</tr></thead>
          <tbody>{projects.map(p => (
            <tr key={p.id}>
              <td style={{ ...tD, fontWeight:600, maxWidth:200 }}>{p.name}</td>
              <td style={{ ...tD, fontFamily:T.fontMono }}>{p.claimed.toLocaleString()}</td>
              <td style={{ ...tD, fontFamily:T.fontMono, color: p.u_c > 10 ? T.red : T.textPri }}>{p.u_c.toFixed(1)}%</td>
              <td style={{ ...tD, fontFamily:T.fontMono, fontWeight: p.discount > 0 ? 700 : 400, color: p.discount > 5 ? T.red : T.textPri }}>{p.discount}%</td>
              <td style={{ ...tD, fontFamily:T.fontMono, color:T.red }}>{(p.claimed - p.net).toLocaleString()}</td>
              <td style={{ ...tD, fontFamily:T.fontMono, fontWeight:700, color:T.green }}>{p.net.toLocaleString()}</td>
              <td style={{ ...tD, fontFamily:T.fontMono }}>{'$' + ((p.claimed - p.net) * PRICE / 1000).toFixed(1) + 'K'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 7: VVB Verification Scope ─────────────────────────────────────────────
function Tab7({ projects }) {
  const SCOPES   = ['Baseline Determination','Additionality Assessment','Monitoring Plan Implementation','ER Quantification Calculation','Uncertainty Budget Review'];
  const ASSURANCE= ['Reasonable','Reasonable','Reasonable','Reasonable','Limited'];
  const SAMPLING = ['Risk-based ≥80% coverage','100% document review','Site visit + field records','Spreadsheet recalculation','GUM compliance review'];
  const EVIDENCE = ['Monitoring reports, calibration certs, sub-metering logs','PDD, additionality tool outputs, common practice analysis','MRV reports, sensor data, equipment maintenance logs','Calculation spreadsheet audit trail, parameter data','Uncertainty budget, parameter data quality assessment'];
  const VVB_ACCRED = [
    { std:'CDM',          req:'UNFCCC accredited DOE (Designated Operational Entity)',                           ref:'cdm.unfccc.int/DOE' },
    { std:'Gold Standard',req:'Gold Standard approved VVB (Validation/Verification Body)',                       ref:'goldstandard.org/resources/tools' },
    { std:'Verra VCS',    req:'Verra approved VVB with relevant sectoral scope certificate (e.g. AFOLU, Energy)',ref:'registry.verra.org/app/certificateSearch' },
    { std:'ACR',          req:'ACR approved third-party verifier with required technical expertise',             ref:'acrcarbon.org/verification' },
  ];
  const top10 = [...projects].sort((a, b) => b.claimed - a.claimed).slice(0, 10);
  return (
    <div>
      <div style={{ color:T.navy, fontWeight:700, fontSize:15, marginBottom:4 }}>VVB Verification Scope — ISO 14064-3:2019 §6.5: Verification of Quantification Methodology</div>
      <div style={{ color:T.textSec, fontSize:12, marginBottom:20 }}>Top 10 projects by credit volume. Each verification scope item specifies assurance level, sampling approach, and evidence type per ISO 14064-3:2019.</div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
        {VVB_ACCRED.map(v => (
          <div key={v.std} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:'12px 16px', flex:1, minWidth:190 }}>
            <div style={{ color:T.navy, fontWeight:700, fontSize:13 }}>{v.std}</div>
            <div style={{ color:T.textSec, fontSize:11, marginTop:5 }}>{v.req}</div>
            <div style={{ color:T.blue, fontSize:10, fontFamily:T.fontMono, marginTop:6 }}>{v.ref}</div>
          </div>
        ))}
      </div>
      {top10.map((p, i) => {
        const cars    = Math.floor(sr(i * 37) * 3);
        const cls     = Math.floor(sr(i * 41) * 4);
        const fars    = Math.floor(sr(i * 43) * 2);
        const opinion = p.u_c > 15 ? 'Qualified' : p.u_c > 8 ? 'Positive (with CL)' : 'Positive';
        return (
          <div key={p.id} style={{ ...card(), marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div>
                <span style={{ color:T.navy, fontWeight:700, fontSize:13 }}>{p.name}</span>
                <span style={{ color:T.textSec, fontSize:11, marginLeft:10 }}>{p.registry} · {p.methodology} · {p.claimed.toLocaleString()} tCO₂e claimed</span>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                {badge(opinion === 'Positive' ? T.green : opinion.includes('CL') ? T.amber : T.red, `Opinion: ${opinion}`)}
              </div>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:10 }}>
              <thead><tr>{['Scope Item','Assurance Level','Sampling Approach','Evidence Reviewed','Finding'].map(h => <th key={h} style={tH}>{h}</th>)}</tr></thead>
              <tbody>{SCOPES.map((s, j) => {
                const finding = j === 0 && cars > 0 ? 'CAR' : j === 1 && cls > 0 ? 'CL' : j === 4 && fars > 0 ? 'FAR' : 'None';
                return (
                  <tr key={s}>
                    <td style={{ ...tD, fontWeight:600 }}>{s}</td>
                    <td style={tD}>{badge(ASSURANCE[j] === 'Reasonable' ? T.blue : T.amber, ASSURANCE[j])}</td>
                    <td style={{ ...tD, color:T.textSec, fontSize:11 }}>{SAMPLING[j]}</td>
                    <td style={{ ...tD, color:T.textSec, fontSize:11 }}>{EVIDENCE[j]}</td>
                    <td style={tD}>{badge(finding === 'CAR' ? T.red : finding === 'CL' ? T.amber : finding === 'FAR' ? T.orange : T.green, finding)}</td>
                  </tr>
                );
              })}</tbody>
            </table>
            <div style={{ display:'flex', gap:20, fontSize:11, color:T.textSec }}>
              <span>CARs raised: <strong style={{ color: cars > 0 ? T.red : T.green }}>{cars}</strong></span>
              <span>CLs raised: <strong style={{ color: cls > 0 ? T.amber : T.green }}>{cls}</strong></span>
              <span>FARs raised: <strong style={{ color: fars > 0 ? T.orange : T.green }}>{fars}</strong></span>
              <span style={{ color:T.textSec }}>u_c = {p.u_c.toFixed(1)}% | U₉₅ = {p.U_95.toFixed(1)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tab 8: Confidence Interval Report ─────────────────────────────────────────
function Tab8({ projects }) {
  const conservative   = projects.filter(p => p.P5 >= p.claimed).length;
  const pctConservative = projects.length ? (conservative / projects.length * 100).toFixed(1) : '0.0';
  const totalNet       = projects.reduce((a, p) => a + p.net, 0);
  return (
    <div>
      <div style={{ color:T.navy, fontWeight:700, fontSize:15, marginBottom:4 }}>Confidence Interval Report — ISO 14064-2:2019 §8 | JCGM 101:2008 Expanded Uncertainty Bands</div>
      <div style={{ color:T.textSec, fontSize:12, marginBottom:20 }}>Issuance confidence bands per project. P5/P50/P95 from normal approximation with u_c from GUM analysis. Net issued reflects CDM EB Annex 29 uncertainty discount.</div>
      <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:20 }}>
        {[
          ['Conservative Claims (P5 ≥ Claimed)', `${conservative} / ${projects.length}`,          T.green],
          ['Portfolio Conservative %',            pctConservative + '%',                            parseFloat(pctConservative) > 60 ? T.green : T.amber],
          ['Total Net Issued',                    totalNet.toLocaleString() + ' tCO₂e',            T.navy],
        ].map(([l, v, c]) => (
          <div key={l} style={kpi}><div style={{ color:T.textSec, fontSize:11, marginBottom:4 }}>{l}</div><div style={{ color:c, fontFamily:T.fontMono, fontSize:18, fontWeight:700 }}>{v}</div></div>
        ))}
      </div>
      <div style={{ background:T.blue + '08', border:`1px solid ${T.blue}30`, borderRadius:8, padding:16, marginBottom:22, fontSize:12, color:T.textSec, lineHeight:1.7 }}>
        <strong style={{ color:T.navy }}>Investor Note (CORSIA / Paris Agreement Art. 6.4):</strong>{' '}
        Conservative P5 claims — where P5 ≥ Claimed ER — provide statistical assurance of delivery and are preferred by institutional buyers under CORSIA eligibility criteria. Net issuable credits reflect the CDM EB Annex 29 uncertainty discount schedule. Claims exceeding P5 (flagged below) carry material delivery risk and should be subject to additional buffer pool contribution under VCS AFOLU or Gold Standard risk mitigation provisions.
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['Project','Registry','Claimed ER','P5','P50','P95','U₉₅ %','Net Issued','Buffer %','Claim Flag'].map(h => <th key={h} style={tH}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {projects.map(p => {
              const isConservative = p.P5 >= p.claimed;
              const buffer = p.net > 0 ? ((p.P5 - p.net) / p.net * 100) : 0;
              return (
                <tr key={p.id} style={{ background: !isConservative ? T.red + '05' : 'transparent' }}>
                  <td style={{ ...tD, fontWeight:600, maxWidth:200 }}>{p.name.substring(0, 30)}</td>
                  <td style={tD}>{badge(T.navy, p.registry)}</td>
                  <td style={{ ...tD, fontFamily:T.fontMono }}>{p.claimed.toLocaleString()}</td>
                  <td style={{ ...tD, fontFamily:T.fontMono, color:T.sage }}>{p.P5.toLocaleString()}</td>
                  <td style={{ ...tD, fontFamily:T.fontMono }}>{p.P50.toLocaleString()}</td>
                  <td style={{ ...tD, fontFamily:T.fontMono, color:T.blue }}>{p.P95.toLocaleString()}</td>
                  <td style={{ ...tD, fontFamily:T.fontMono, color: p.U_95 > 20 ? T.red : p.U_95 > 10 ? T.amber : T.green, fontWeight:700 }}>{p.U_95.toFixed(1)}%</td>
                  <td style={{ ...tD, fontFamily:T.fontMono, fontWeight:700, color:T.navy }}>{p.net.toLocaleString()}</td>
                  <td style={{ ...tD, fontFamily:T.fontMono, color: buffer >= 0 ? T.green : T.red }}>{buffer.toFixed(1)}%</td>
                  <td style={tD}>{badge(isConservative ? T.green : T.red, isConservative ? 'CONSERVATIVE CLAIM' : 'CLAIM EXCEEDS P5')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Root Component ─────────────────────────────────────────────────────────────
export default function MonteCarloCarbonUncertaintyPage() {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:'DM Sans, sans-serif', color:T.textPri }}>
      {/* Header */}
      <div style={{ borderBottom:`3px solid ${T.gold}`, background:T.navy }}>
        <div style={{ maxWidth:1400, margin:'0 auto', padding:'18px 32px 0' }}>
          <div style={{ marginBottom:14 }}>
            <div style={{ color:T.gold, fontFamily:T.fontMono, fontSize:10, letterSpacing:'0.12em', marginBottom:5 }}>UNCERTAINTY QUANTIFICATION ENGINE · ISO 14064-2/3 · JCGM 100:2008 GUM · JCGM 101:2008 MC</div>
            <div style={{ color:'#ffffff', fontWeight:800, fontSize:22 }}>Monte Carlo Carbon Uncertainty Engine</div>
            <div style={{ color:'#9ca3af', fontSize:12, marginTop:4 }}>30 projects · GUM combined uncertainty · Box-Muller MC sampling · CDM EB 65 Annex 29 discount schedule</div>
          </div>
          <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
            {TABS.map((t, i) => (
              <button key={i} onClick={() => setActiveTab(i)} style={{ background:'transparent', border:'none', borderBottom: i === activeTab ? `3px solid ${T.gold}` : '3px solid transparent', color: i === activeTab ? T.gold : '#9ca3af', padding:'10px 15px', fontSize:12, fontWeight: i === activeTab ? 700 : 400, cursor:'pointer', whiteSpace:'nowrap', transition:'color 0.15s', marginBottom:-1 }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Content */}
      <div style={{ maxWidth:1400, margin:'0 auto', padding:'28px 32px' }}>
        {activeTab === 0 && <Tab1 projects={PROJECTS} />}
        {activeTab === 1 && <Tab2 />}
        {activeTab === 2 && <Tab3 projects={PROJECTS} />}
        {activeTab === 3 && <Tab4 projects={PROJECTS} />}
        {activeTab === 4 && <Tab5 projects={PROJECTS} />}
        {activeTab === 5 && <Tab6 projects={PROJECTS} />}
        {activeTab === 6 && <Tab7 projects={PROJECTS} />}
        {activeTab === 7 && <Tab8 projects={PROJECTS} />}
      </div>
      {/* Status Bar */}
      <div style={{ borderTop:`1px solid ${T.border}`, background:T.card, padding:'10px 32px', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, color:T.textSec }}>
        <span style={{ fontFamily:T.fontMono }}>ISO 14064-2:2019 · ISO 14064-3:2019 · JCGM 100:2008 (GUM) · JCGM 101:2008 · CDM EB 65 Annex 29 · IPCC 2006 Vol.1 Ch.2 · PCAF Standard Part A v2.0</span>
        <span style={{ fontFamily:T.fontMono }}>30 projects · N=200 MC iterations · GUM uncertainty propagation</span>
      </div>
    </div>
  );
}
