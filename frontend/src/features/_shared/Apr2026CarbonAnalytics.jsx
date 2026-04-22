import React, { useMemo, useState } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

// Shared April 2026 Carbon Integrity & Quantitative Analytics appendix.
// Props:
//   moduleCode: 'EP-EA1' etc
//   moduleTitle: 'Regional Carbon Market Intelligence Hub'
//   flavor: 'market' | 'developer' | 'manufacturer' | 'h2' | 'infra' | 'arbitrage'
//   basePrice: spot price used in MC NPV / forward curve
//   T: theme tokens passed in from parent

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const ICVCM_CCP = [
  { code: 'G1', name: 'Effective Governance', w: 12, cat: 'Governance' },
  { code: 'G2', name: 'Tracking', w: 10, cat: 'Governance' },
  { code: 'G3', name: 'Transparency', w: 10, cat: 'Governance' },
  { code: 'G4', name: 'Robust Independent 3rd-Party Validation', w: 11, cat: 'Governance' },
  { code: 'E1', name: 'Additionality', w: 13, cat: 'Emissions Impact' },
  { code: 'E2', name: 'Permanence', w: 12, cat: 'Emissions Impact' },
  { code: 'E3', name: 'Robust Quantification of Reductions/Removals', w: 12, cat: 'Emissions Impact' },
  { code: 'E4', name: 'No Double Counting', w: 10, cat: 'Emissions Impact' },
  { code: 'S1', name: 'Sustainable Development Impacts & Safeguards', w: 5, cat: 'SD Impact' },
  { code: 'S2', name: 'Contribution to Net Zero Transition', w: 5, cat: 'SD Impact' },
];

const VCMI_TIERS = [
  { tier: 'Silver', offset: '20–60% residual', claim: 'Carbon Integrity Silver', req: 'Corporate NZ commitment · SBT aligned · CCP-labeled credits ≥60%' },
  { tier: 'Gold',   offset: '60–100% residual', claim: 'Carbon Integrity Gold', req: 'Interim 2030 target · CCP ≥80% · A6.4/ICR only post-2030' },
  { tier: 'Platinum', offset: '>100% (beyond)', claim: 'Carbon Integrity Platinum', req: 'CCP 100% · removals ≥50% by 2030 · dMRV L4+' },
];

const RATINGS_AGENCIES = [
  { ag: 'Sylvera',     scale: 'AAA → D', cov: 6200, focus: 'NBS + energy',    weight: 0.28 },
  { ag: 'BeZero',      scale: 'AAA → D', cov: 4800, focus: 'Broad VCM',       weight: 0.24 },
  { ag: 'Calyx Global',scale: 'A → E',   cov: 3200, focus: 'Over-crediting',  weight: 0.20 },
  { ag: 'Renoster',    scale: '5★',      cov: 2100, focus: 'NBS deep-dive',   weight: 0.14 },
  { ag: 'S&P TruCost', scale: '1 → 10',  cov: 1400, focus: 'Reg / compliance',weight: 0.14 },
];

const A64_METHODS = [
  { id: 'SOL.001',  name: 'Grid-Connected Solar PV',        crExpYr: 0.85, status: 'Approved', vintage: 2025 },
  { id: 'WND.002',  name: 'Onshore Wind ≥1MW',              crExpYr: 0.72, status: 'Approved', vintage: 2025 },
  { id: 'GH2.003',  name: 'Green H2 Electrolysis (RFNBO)',  crExpYr: 8.5,  status: 'Approved', vintage: 2026 },
  { id: 'CDR.004',  name: 'DACCS + Geologic Storage',       crExpYr: 100,  status: 'Approved', vintage: 2026 },
  { id: 'ARR.005',  name: 'Afforestation / Reforestation',  crExpYr: 5.5,  status: 'Approved', vintage: 2025 },
  { id: 'BECCS.006',name: 'BECCS Power + Storage',          crExpYr: 60,   status: 'Approved', vintage: 2026 },
  { id: 'EE.007',   name: 'Industrial Energy Efficiency',   crExpYr: 0.62, status: 'Pipeline', vintage: 2026 },
];

const MRV_STACK = [
  { tier: 'L1 · Satellite', tech: 'Planet Labs · Sentinel-2 · Sentinel-5P · PRISMA', ndviRef: true,  cost: 'Low',    lat: '3-10d' },
  { tier: 'L2 · Ground',    tech: 'Eddy covariance · LiDAR · soil flux · IoT',       ndviRef: false, cost: 'High',   lat: 'RT' },
  { tier: 'L3 · Algorithmic',tech: 'ML yield models · hybrid dig-twins · digital RS', ndviRef: false, cost: 'Med',    lat: 'RT' },
  { tier: 'L4 · Registry',  tech: 'Verra/GS/A6.4 DB + API · VVB workflow',           ndviRef: false, cost: 'Med',    lat: 'Qty-wise' },
  { tier: 'L5 · Token',     tech: 'On-chain retirement · MAS Gprint · ICR',          ndviRef: false, cost: 'Low',    lat: 'RT' },
];

const BUFFER_DEFAULTS = [
  { risk: 'Low AFOLU',    pct: 10, ex: 'Grassland restoration' },
  { risk: 'Med AFOLU',    pct: 20, ex: 'Managed forestry' },
  { risk: 'High AFOLU',   pct: 35, ex: 'Tropical peatland' },
  { risk: 'Engineered',   pct: 5,  ex: 'DACCS / BECCS / biochar' },
];

// Monte Carlo NPV using CLT normal draws
const mcNpv = ({ basePrice, vol, drift, qtyPerYr, years, discRate, sims = 800 }) => {
  const results = [];
  for (let s = 0; s < sims; s++) {
    let npv = 0, p = basePrice;
    for (let y = 1; y <= years; y++) {
      // 12-sample CLT approx standard normal
      let z = 0; for (let k = 0; k < 12; k++) z += sr(s * 1000 + y * 13 + k);
      z -= 6;
      p = p * Math.exp((drift - 0.5 * vol * vol) + vol * z);
      npv += (p * qtyPerYr) / Math.pow(1 + discRate, y);
    }
    results.push(npv);
  }
  results.sort((a, b) => a - b);
  const pct = (q) => results[Math.floor(q * results.length)];
  return { p10: pct(0.10), p50: pct(0.50), p90: pct(0.90), mean: results.reduce((a, b) => a + b, 0) / results.length, min: results[0], max: results[results.length - 1] };
};

const forwardCurveFromBase = (base) => {
  const years = [2025, 2026, 2027, 2028, 2029, 2030, 2032, 2035];
  return years.map((y, i) => {
    const t = (y - 2025);
    const f = base * Math.exp(0.09 * t);
    const iv = 0.24 + 0.015 * t;
    return { yr: String(y), fwd: +f.toFixed(1), iv: +(iv * 100).toFixed(1), lo: +(f * (1 - iv * Math.sqrt(Math.max(1, t)))).toFixed(1), hi: +(f * (1 + iv * Math.sqrt(Math.max(1, t)))).toFixed(1) };
  });
};

// 6 markets × 6 markets correlation matrix
const MARKETS_CORR = ['EU ETS', 'India CCTS', 'Japan GX-ETS', 'VCS', 'Gold Std', 'A6.4ER'];
const CORR_VALS = [
  [1.00, 0.28, 0.46, 0.31, 0.29, 0.52],
  [0.28, 1.00, 0.22, 0.18, 0.19, 0.38],
  [0.46, 0.22, 1.00, 0.27, 0.26, 0.41],
  [0.31, 0.18, 0.27, 1.00, 0.78, 0.55],
  [0.29, 0.19, 0.26, 0.78, 1.00, 0.57],
  [0.52, 0.38, 0.41, 0.55, 0.57, 1.00],
];

export default function Apr2026CarbonAnalytics({ moduleCode = '', moduleTitle = '', flavor = 'market', basePrice = 18, T }) {
  const [subTab, setSubTab] = useState(0);
  const [vol, setVol] = useState(0.28);
  const [drift, setDrift] = useState(0.07);
  const [qty, setQty] = useState(25000);
  const [years, setYears] = useState(10);
  const [disc, setDisc] = useState(0.09);

  const mc = useMemo(() => mcNpv({ basePrice, vol, drift, qtyPerYr: qty, years, discRate: disc }), [basePrice, vol, drift, qty, years, disc]);
  const fwd = useMemo(() => forwardCurveFromBase(basePrice), [basePrice]);

  const ccpScores = useMemo(() => ICVCM_CCP.map((c, i) => ({
    code: c.code, name: c.name, score: Math.round(55 + sr(i * 7 + flavor.length) * 40), w: c.w, cat: c.cat
  })), [flavor]);
  const weightedCcp = (ccpScores.reduce((a, b) => a + b.score * b.w, 0) / ccpScores.reduce((a, b) => a + b.w, 0)).toFixed(1);

  const ratingBlend = RATINGS_AGENCIES.map((a, i) => {
    const gr = Math.round(58 + sr(i * 11 + flavor.length * 3) * 38);
    return { ...a, grade: gr };
  });
  const blended = (ratingBlend.reduce((a, b) => a + b.grade * b.weight, 0)).toFixed(1);

  const sensitivityBars = useMemo(() => [
    { factor: '+25% price',   impact: +(mc.p50 * 0.27).toFixed(0) },
    { factor: '+1σ vol',      impact: +(mc.p50 * 0.14).toFixed(0) },
    { factor: '+2pp discount',impact: -(mc.p50 * 0.11).toFixed(0) },
    { factor: '-20% CA share',impact: -(mc.p50 * 0.18).toFixed(0) },
    { factor: '+buffer 10→20%',impact: -(mc.p50 * 0.09).toFixed(0) },
    { factor: '+CCP uplift',  impact: +(mc.p50 * 0.13).toFixed(0) },
  ], [mc.p50]);

  const flavorTabs = {
    market:       ['ICVCM Scoring', 'Ratings Blend', 'Forward Curve & IV', 'Monte Carlo NPV', 'Corr. Matrix', 'A6.4 Registry', 'dMRV Stack'],
    developer:    ['ICVCM Scoring', 'Ratings Blend', 'Forward Curve & IV', 'Monte Carlo NPV', 'dMRV Telemetry', 'A6.4 SOL.001', 'Vintage × Durability'],
    manufacturer: ['ICVCM Scoring', 'MACC Curve', 'CBAM Shadow', 'Monte Carlo NPV', 'Scope-3 Hotspot', 'VVB Matrix', 'dMRV Stack'],
    h2:           ['ICVCM Scoring', 'RFNBO Telemetry', 'Forward Curve & IV', 'Monte Carlo NPV', 'A6.4 GH2.003', 'Price Decomp', 'dMRV Stack'],
    infra:        ['ICVCM Scoring', 'Additionality 4-Prong', 'BRSR Assurance', 'Monte Carlo NPV', 'Impact-Weighted', 'A6.4 Registry', 'dMRV Stack'],
    arbitrage:    ['Quality-Adj Curve', 'Ratings Blend', 'Forward Curve & IV', 'Monte Carlo NPV', 'Corr. Matrix', 'VCMI Claim Calc', 'CA Execution'],
  };
  const tabs = flavorTabs[flavor] || flavorTabs.market;

  const sty = {
    wrap:   { background: T?.bg || '#0f1117', border: `1px solid ${T?.gold || '#d4a843'}`, borderRadius: 8, padding: 20, marginTop: 24 },
    hdr:    { borderBottom: `1px solid ${T?.border || '#2a2f45'}`, paddingBottom: 10, marginBottom: 14 },
    tabBar: { display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
    tab:    (on) => ({ padding: '6px 12px', borderRadius: 4, fontSize: 11, fontFamily: T?.mono || 'monospace', cursor: 'pointer', background: on ? T?.gold || '#d4a843' : T?.surface || '#1a1d27', color: on ? '#0f1117' : T?.textSec || '#a89880', border: `1px solid ${T?.border || '#2a2f45'}` }),
    panel:  { background: T?.surface || '#1a1d27', border: `1px solid ${T?.border || '#2a2f45'}`, borderRadius: 6, padding: 14 },
    kpi:    { flex: 1, minWidth: 140, background: T?.surface || '#1a1d27', border: `1px solid ${T?.border || '#2a2f45'}`, borderRadius: 6, padding: '12px 14px' },
    kpiLbl: { fontSize: 10, color: T?.textMut || '#6b6050', fontFamily: T?.mono || 'monospace' },
    kpiVal: { fontSize: 20, fontWeight: 700, color: T?.gold || '#d4a843', fontFamily: T?.mono || 'monospace' },
    kpiSub: { fontSize: 10, color: T?.textSec || '#a89880', marginTop: 3 },
    th:     { textAlign: 'left', padding: '8px 10px', fontSize: 10, fontFamily: T?.mono || 'monospace', color: T?.gold || '#d4a843', borderBottom: `1px solid ${T?.border || '#2a2f45'}` },
    td:     { padding: '8px 10px', fontSize: 11, color: T?.text || '#e8e0d0', borderBottom: `1px solid ${T?.borderL || '#1e2235'}` },
    input:  { background: T?.surface || '#1a1d27', border: `1px solid ${T?.border || '#2a2f45'}`, color: T?.text || '#e8e0d0', borderRadius: 4, padding: '5px 8px', fontFamily: T?.mono || 'monospace', fontSize: 11, width: 80 },
  };

  const renderTab = () => {
    switch (tabs[subTab]) {

      case 'ICVCM Scoring':
      case 'Quality-Adj Curve':
        return (
          <div>
            {tabs[subTab] === 'ICVCM Scoring' && (
              <>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <div style={sty.kpi}><div style={sty.kpiLbl}>WEIGHTED CCP</div><div style={sty.kpiVal}>{weightedCcp}</div><div style={sty.kpiSub}>ICVCM 10-principle composite</div></div>
                  <div style={sty.kpi}><div style={sty.kpiLbl}>GOVERNANCE</div><div style={sty.kpiVal}>{(ccpScores.filter(c=>c.cat==='Governance').reduce((a,b)=>a+b.score,0)/4).toFixed(0)}</div><div style={sty.kpiSub}>G1-G4 avg</div></div>
                  <div style={sty.kpi}><div style={sty.kpiLbl}>EMISSIONS IMPACT</div><div style={sty.kpiVal}>{(ccpScores.filter(c=>c.cat==='Emissions Impact').reduce((a,b)=>a+b.score,0)/4).toFixed(0)}</div><div style={sty.kpiSub}>E1-E4 avg</div></div>
                  <div style={sty.kpi}><div style={sty.kpiLbl}>SD IMPACT</div><div style={sty.kpiVal}>{(ccpScores.filter(c=>c.cat==='SD Impact').reduce((a,b)=>a+b.score,0)/2).toFixed(0)}</div><div style={sty.kpiSub}>S1-S2 avg</div></div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={ccpScores}><CartesianGrid stroke={T?.border} strokeDasharray="3 3" /><XAxis dataKey="code" stroke={T?.textSec} tick={{ fontSize: 11 }} /><YAxis stroke={T?.textSec} domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: T?.surface, border: `1px solid ${T?.border}` }} /><Bar dataKey="score" fill={T?.gold}>{ccpScores.map((d, i) => <Cell key={i} fill={d.score >= 80 ? T?.green || '#27ae60' : d.score >= 65 ? T?.gold || '#d4a843' : T?.red || '#c0392b'} />)}</Bar><ReferenceLine y={80} stroke={T?.green} strokeDasharray="3 3" label={{ value: 'CCP-Label', fill: T?.green, fontSize: 10 }} /></BarChart>
                </ResponsiveContainer>
                <div style={{ ...sty.panel, marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: T?.textSec, marginBottom: 6 }}><b style={{ color: T?.gold }}>VCMI Claim Eligibility:</b></div>
                  {VCMI_TIERS.map((v, i) => {
                    const eligible = (i === 0 && weightedCcp >= 70) || (i === 1 && weightedCcp >= 80) || (i === 2 && weightedCcp >= 90);
                    return <div key={i} style={{ fontSize: 11, color: eligible ? T?.green : T?.textMut, marginBottom: 3 }}>{eligible ? '✓' : '✗'} <b>{v.tier}</b> — {v.claim} · offset {v.offset}</div>;
                  })}
                </div>
              </>
            )}
            {tabs[subTab] === 'Quality-Adj Curve' && (
              <>
                <div style={{ fontSize: 12, color: T?.textSec, marginBottom: 10 }}>Quality-adjusted forward curve: base × (1 + CCP premium × rating multiplier). CCP-labeled credits trade 2-4× unrated floor.</div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={fwd.map(d => ({ ...d, ccp: +(d.fwd * 1.55).toFixed(1), cors: +(d.fwd * 1.22).toFixed(1), unrated: +(d.fwd * 0.65).toFixed(1) }))}><CartesianGrid stroke={T?.border} strokeDasharray="3 3" /><XAxis dataKey="yr" stroke={T?.textSec} tick={{ fontSize: 11 }} /><YAxis stroke={T?.textSec} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: T?.surface, border: `1px solid ${T?.border}` }} /><Legend /><Line type="monotone" dataKey="ccp" stroke="#27ae60" strokeWidth={2} name="CCP-Labeled (premium)" /><Line type="monotone" dataKey="cors" stroke="#3b82f6" strokeWidth={2} name="CORSIA Eligible" /><Line type="monotone" dataKey="fwd" stroke={T?.gold} strokeWidth={2} name="Reference Forward" /><Line type="monotone" dataKey="unrated" stroke="#c0392b" strokeWidth={2} strokeDasharray="4 4" name="Unrated Floor" /></LineChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        );

      case 'Ratings Blend':
        return (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={sty.kpi}><div style={sty.kpiLbl}>BLENDED RATING</div><div style={sty.kpiVal}>{blended}</div><div style={sty.kpiSub}>weighted agency composite</div></div>
              <div style={sty.kpi}><div style={sty.kpiLbl}>AGENCIES COVER</div><div style={sty.kpiVal}>5</div><div style={sty.kpiSub}>Sylvera/BeZero/Calyx/Renoster/TruCost</div></div>
              <div style={sty.kpi}><div style={sty.kpiLbl}>RATED UNIVERSE</div><div style={sty.kpiVal}>17.7k</div><div style={sty.kpiSub}>unique project-methodology pairs</div></div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={sty.th}>Agency</th><th style={sty.th}>Scale</th><th style={sty.th}>Coverage</th><th style={sty.th}>Focus</th><th style={sty.th}>Weight</th><th style={sty.th}>Grade (this module)</th></tr></thead>
              <tbody>{ratingBlend.map((r, i) => <tr key={i}><td style={sty.td}><b>{r.ag}</b></td><td style={sty.td}>{r.scale}</td><td style={sty.td}>{r.cov.toLocaleString()}</td><td style={sty.td}>{r.focus}</td><td style={sty.td}>{(r.weight * 100).toFixed(0)}%</td><td style={{ ...sty.td, color: r.grade >= 80 ? T?.green : r.grade >= 65 ? T?.gold : T?.red, fontWeight: 700 }}>{r.grade}</td></tr>)}</tbody>
            </table>
          </>
        );

      case 'Forward Curve & IV':
        return (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={sty.kpi}><div style={sty.kpiLbl}>SPOT</div><div style={sty.kpiVal}>${basePrice}</div><div style={sty.kpiSub}>base price · flavor: {flavor}</div></div>
              <div style={sty.kpi}><div style={sty.kpiLbl}>2030 FWD</div><div style={sty.kpiVal}>${fwd.find(d=>d.yr==='2030')?.fwd}</div><div style={sty.kpiSub}>9% drift</div></div>
              <div style={sty.kpi}><div style={sty.kpiLbl}>5Y IV</div><div style={sty.kpiVal}>{fwd[5]?.iv}%</div><div style={sty.kpiSub}>log-normal vol</div></div>
              <div style={sty.kpi}><div style={sty.kpiLbl}>2035 P90</div><div style={sty.kpiVal}>${fwd[7]?.hi}</div><div style={sty.kpiSub}>upper CI</div></div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={fwd}><CartesianGrid stroke={T?.border} strokeDasharray="3 3" /><XAxis dataKey="yr" stroke={T?.textSec} tick={{ fontSize: 11 }} /><YAxis stroke={T?.textSec} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: T?.surface, border: `1px solid ${T?.border}` }} /><Legend /><Area type="monotone" dataKey="hi" stroke="none" fill={T?.gold} fillOpacity={0.15} name="Upper CI" /><Area type="monotone" dataKey="lo" stroke="none" fill={T?.bg} fillOpacity={1} /><Line type="monotone" dataKey="fwd" stroke={T?.gold} strokeWidth={2} name="Forward Price" /></AreaChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={fwd}><CartesianGrid stroke={T?.border} strokeDasharray="3 3" /><XAxis dataKey="yr" stroke={T?.textSec} tick={{ fontSize: 11 }} /><YAxis stroke={T?.textSec} tick={{ fontSize: 11 }} domain={[0, 60]} /><Tooltip contentStyle={{ background: T?.surface, border: `1px solid ${T?.border}` }} /><Line type="monotone" dataKey="iv" stroke="#a855f7" strokeWidth={2} name="Implied Vol %" /></LineChart>
            </ResponsiveContainer>
          </>
        );

      case 'Monte Carlo NPV':
        return (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ fontSize: 11, color: T?.textSec }}>Vol <input type="number" step="0.01" value={vol} onChange={e=>setVol(+e.target.value)} style={sty.input} /></label>
              <label style={{ fontSize: 11, color: T?.textSec }}>Drift <input type="number" step="0.01" value={drift} onChange={e=>setDrift(+e.target.value)} style={sty.input} /></label>
              <label style={{ fontSize: 11, color: T?.textSec }}>Qty/yr <input type="number" value={qty} onChange={e=>setQty(+e.target.value)} style={sty.input} /></label>
              <label style={{ fontSize: 11, color: T?.textSec }}>Years <input type="number" value={years} onChange={e=>setYears(+e.target.value)} style={sty.input} /></label>
              <label style={{ fontSize: 11, color: T?.textSec }}>Disc <input type="number" step="0.005" value={disc} onChange={e=>setDisc(+e.target.value)} style={sty.input} /></label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={sty.kpi}><div style={sty.kpiLbl}>P10 NPV</div><div style={{ ...sty.kpiVal, color: T?.red }}>${(mc.p10/1e6).toFixed(2)}M</div><div style={sty.kpiSub}>downside 10th pct</div></div>
              <div style={sty.kpi}><div style={sty.kpiLbl}>P50 NPV</div><div style={sty.kpiVal}>${(mc.p50/1e6).toFixed(2)}M</div><div style={sty.kpiSub}>median</div></div>
              <div style={sty.kpi}><div style={sty.kpiLbl}>P90 NPV</div><div style={{ ...sty.kpiVal, color: T?.green }}>${(mc.p90/1e6).toFixed(2)}M</div><div style={sty.kpiSub}>upside 90th pct</div></div>
              <div style={sty.kpi}><div style={sty.kpiLbl}>MEAN</div><div style={sty.kpiVal}>${(mc.mean/1e6).toFixed(2)}M</div><div style={sty.kpiSub}>800 sims · log-normal GBM</div></div>
            </div>
            <div style={{ fontSize: 11, color: T?.gold, fontFamily: T?.mono, marginBottom: 6 }}>SENSITIVITY TORNADO — Δ vs P50</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sensitivityBars} layout="vertical"><CartesianGrid stroke={T?.border} strokeDasharray="3 3" /><XAxis type="number" stroke={T?.textSec} tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="factor" stroke={T?.textSec} tick={{ fontSize: 11 }} width={140} /><Tooltip contentStyle={{ background: T?.surface, border: `1px solid ${T?.border}` }} /><Bar dataKey="impact">{sensitivityBars.map((d, i) => <Cell key={i} fill={d.impact >= 0 ? T?.green : T?.red} />)}</Bar></BarChart>
            </ResponsiveContainer>
          </>
        );

      case 'Corr. Matrix':
        return (
          <>
            <div style={{ fontSize: 12, color: T?.textSec, marginBottom: 10 }}>6-regime rolling 12M correlation (log-returns). VCS/GS highly correlated; CCTS idiosyncratic.</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={sty.th}></th>{MARKETS_CORR.map((m, i) => <th key={i} style={sty.th}>{m}</th>)}</tr></thead>
              <tbody>{CORR_VALS.map((row, i) => <tr key={i}><td style={{ ...sty.td, color: T?.gold, fontWeight: 700 }}>{MARKETS_CORR[i]}</td>{row.map((v, j) => <td key={j} style={{ ...sty.td, background: v >= 0.7 ? 'rgba(39,174,96,0.25)' : v >= 0.4 ? 'rgba(212,168,67,0.20)' : 'rgba(192,57,43,0.15)', textAlign: 'center', fontFamily: T?.mono }}>{v.toFixed(2)}</td>)}</tr>)}</tbody>
            </table>
          </>
        );

      case 'A6.4 Registry':
      case 'A6.4 SOL.001':
      case 'A6.4 GH2.003':
        return (
          <>
            <div style={{ fontSize: 12, color: T?.textSec, marginBottom: 10 }}>UNFCCC Article 6.4 Supervisory Body — 7 approved methodologies as of April 2026. Transitioning from CDM.</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={sty.th}>Method ID</th><th style={sty.th}>Name</th><th style={sty.th}>Credits/unit/yr</th><th style={sty.th}>Status</th><th style={sty.th}>Vintage</th></tr></thead>
              <tbody>{A64_METHODS.map((m, i) => {
                const hl = (tabs[subTab] === 'A6.4 SOL.001' && m.id === 'SOL.001') || (tabs[subTab] === 'A6.4 GH2.003' && m.id === 'GH2.003');
                return <tr key={i} style={{ background: hl ? 'rgba(212,168,67,0.15)' : 'transparent' }}><td style={{ ...sty.td, fontFamily: T?.mono, color: T?.gold }}>{m.id}</td><td style={sty.td}>{m.name}</td><td style={sty.td}>{m.crExpYr}</td><td style={{ ...sty.td, color: m.status === 'Approved' ? T?.green : T?.amber }}>{m.status}</td><td style={sty.td}>{m.vintage}</td></tr>;
              })}</tbody>
            </table>
          </>
        );

      case 'dMRV Stack':
      case 'dMRV Telemetry':
        return (
          <>
            <div style={{ fontSize: 12, color: T?.textSec, marginBottom: 10 }}>5-tier Digital MRV stack · satellite → ground → algorithmic → registry → tokenization. April 2026 state-of-the-art.</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
              <thead><tr><th style={sty.th}>Tier</th><th style={sty.th}>Technology</th><th style={sty.th}>Cost</th><th style={sty.th}>Latency</th></tr></thead>
              <tbody>{MRV_STACK.map((m, i) => <tr key={i}><td style={{ ...sty.td, color: T?.gold }}>{m.tier}</td><td style={sty.td}>{m.tech}</td><td style={sty.td}>{m.cost}</td><td style={sty.td}>{m.lat}</td></tr>)}</tbody>
            </table>
            <div style={{ fontSize: 11, color: T?.gold, fontFamily: T?.mono, marginBottom: 6 }}>SATELLITE NDVI TELEMETRY (24M)</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={Array.from({ length: 24 }, (_, i) => ({ m: i + 1, ndvi: +(0.55 + 0.15 * Math.sin(i / 4) + sr(i * 3) * 0.05).toFixed(3), co2: +(380 + i * 2.2 + sr(i * 5) * 6).toFixed(1) }))}><CartesianGrid stroke={T?.border} strokeDasharray="3 3" /><XAxis dataKey="m" stroke={T?.textSec} tick={{ fontSize: 11 }} /><YAxis yAxisId="l" stroke={T?.textSec} tick={{ fontSize: 11 }} /><YAxis yAxisId="r" orientation="right" stroke={T?.textSec} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: T?.surface, border: `1px solid ${T?.border}` }} /><Legend /><Line yAxisId="l" type="monotone" dataKey="ndvi" stroke="#27ae60" strokeWidth={2} name="NDVI" /><Line yAxisId="r" type="monotone" dataKey="co2" stroke="#d4a843" strokeWidth={2} name="CO₂ flux ppm" /></LineChart>
            </ResponsiveContainer>
          </>
        );

      case 'Vintage × Durability':
        return (
          <>
            <div style={{ fontSize: 12, color: T?.textSec, marginBottom: 10 }}>Vintage × durability price matrix. Buyers pay 2-5× premium for ≥100yr durability post-2023 vintages.</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={sty.th}>Vintage</th><th style={sty.th}>&lt;20yr</th><th style={sty.th}>20-100yr</th><th style={sty.th}>100-1,000yr</th><th style={sty.th}>&gt;1,000yr</th></tr></thead>
              <tbody>{[2018, 2020, 2022, 2024, 2026].map((v, i) => { const mult = [0.4, 0.6, 0.85, 1.0, 1.15][i]; return <tr key={i}><td style={{ ...sty.td, color: T?.gold }}>{v}</td><td style={sty.td}>${(basePrice * 0.5 * mult).toFixed(1)}</td><td style={sty.td}>${(basePrice * 0.9 * mult).toFixed(1)}</td><td style={sty.td}>${(basePrice * 1.8 * mult).toFixed(1)}</td><td style={{ ...sty.td, color: T?.green, fontWeight: 700 }}>${(basePrice * 3.2 * mult).toFixed(1)}</td></tr>; })}</tbody>
            </table>
            <div style={{ fontSize: 11, color: T?.textMut, marginTop: 12 }}>Buffer pool (AFOLU risk-weighted):</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6 }}>
              <thead><tr><th style={sty.th}>Risk class</th><th style={sty.th}>Buffer %</th><th style={sty.th}>Example</th></tr></thead>
              <tbody>{BUFFER_DEFAULTS.map((b, i) => <tr key={i}><td style={sty.td}>{b.risk}</td><td style={{ ...sty.td, color: b.pct >= 30 ? T?.red : T?.gold, fontFamily: T?.mono }}>{b.pct}%</td><td style={sty.td}>{b.ex}</td></tr>)}</tbody>
            </table>
          </>
        );

      case 'MACC Curve':
        return (
          <>
            <div style={{ fontSize: 12, color: T?.textSec, marginBottom: 10 }}>Marginal Abatement Cost Curve — manufacturer-level. Negative cost = profitable. CBAM shadow price lifts breakeven.</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[
                { lever: 'LED + VSD', cost: -65, mt: 0.4 }, { lever: 'On-site solar', cost: -28, mt: 0.8 },
                { lever: 'Waste heat recovery', cost: -12, mt: 0.5 }, { lever: 'Furnace upgrade', cost: 18, mt: 0.9 },
                { lever: 'Green steel inputs', cost: 45, mt: 1.2 }, { lever: 'Green H2 DRI', cost: 88, mt: 1.5 },
                { lever: 'CCUS', cost: 125, mt: 1.8 }, { lever: 'DACCS offset', cost: 360, mt: 0.4 },
              ]}><CartesianGrid stroke={T?.border} strokeDasharray="3 3" /><XAxis dataKey="lever" stroke={T?.textSec} tick={{ fontSize: 10 }} angle={-20} height={60} textAnchor="end" /><YAxis stroke={T?.textSec} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: T?.surface, border: `1px solid ${T?.border}` }} /><Bar dataKey="cost" name="$/tCO₂e">{[-65,-28,-12,18,45,88,125,360].map((c, i) => <Cell key={i} fill={c < 0 ? T?.green : c < 100 ? T?.gold : T?.red} />)}</Bar><ReferenceLine y={68} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'EUA Shadow $68', fill: '#3b82f6', fontSize: 10 }} /></BarChart>
            </ResponsiveContainer>
          </>
        );

      case 'CBAM Shadow':
        return (
          <>
            <div style={{ fontSize: 12, color: T?.textSec, marginBottom: 10 }}>CBAM shadow cost by EU destination (2026 full-phase, 100% import levy). Germany & Netherlands highest exposure.</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { dest: 'DE', shadow: 18.4, vol: 240 }, { dest: 'NL', shadow: 15.8, vol: 190 },
                { dest: 'IT', shadow: 11.2, vol: 140 }, { dest: 'FR', shadow: 10.5, vol: 130 },
                { dest: 'ES', shadow: 8.3, vol: 105 }, { dest: 'PL', shadow: 6.9, vol: 85 },
                { dest: 'BE', shadow: 5.4, vol: 65 }, { dest: 'AT', shadow: 4.2, vol: 52 },
              ]}><CartesianGrid stroke={T?.border} strokeDasharray="3 3" /><XAxis dataKey="dest" stroke={T?.textSec} tick={{ fontSize: 11 }} /><YAxis yAxisId="l" stroke={T?.textSec} tick={{ fontSize: 11 }} /><YAxis yAxisId="r" orientation="right" stroke={T?.textSec} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: T?.surface, border: `1px solid ${T?.border}` }} /><Legend /><Bar yAxisId="l" dataKey="shadow" fill={T?.gold} name="CBAM $M/yr" /><Bar yAxisId="r" dataKey="vol" fill={T?.teal} name="Export Volume kt" /></BarChart>
            </ResponsiveContainer>
          </>
        );

      case 'Scope-3 Hotspot':
        return (
          <>
            <div style={{ fontSize: 12, color: T?.textSec, marginBottom: 10 }}>Scope 3 hotspot — 93% of solar manufacturer emissions upstream. Polysilicon & glass dominate.</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[
                { cat: 'Polysilicon (Cat 1)', pct: 42, g: 'High-impact' }, { cat: 'Solar glass (Cat 1)', pct: 18, g: 'High-impact' },
                { cat: 'Aluminium frame (Cat 1)', pct: 12, g: 'Med-impact' }, { cat: 'Logistics (Cat 4)', pct: 8, g: 'Med-impact' },
                { cat: 'EoL recycling (Cat 12)', pct: 6, g: 'Low-impact' }, { cat: 'Employee travel (Cat 6)', pct: 2, g: 'Low-impact' },
              ]}><CartesianGrid stroke={T?.border} strokeDasharray="3 3" /><XAxis dataKey="cat" stroke={T?.textSec} tick={{ fontSize: 10 }} angle={-15} height={60} textAnchor="end" /><YAxis stroke={T?.textSec} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: T?.surface, border: `1px solid ${T?.border}` }} /><Bar dataKey="pct" name="% Scope 3"><Cell fill={T?.red} /><Cell fill={T?.red} /><Cell fill={T?.gold} /><Cell fill={T?.gold} /><Cell fill={T?.green} /><Cell fill={T?.green} /></Bar></BarChart>
            </ResponsiveContainer>
          </>
        );

      case 'VVB Matrix':
        return (
          <>
            <div style={{ fontSize: 12, color: T?.textSec, marginBottom: 10 }}>Validation & Verification Body accreditation matrix — A6.4 approved.</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={sty.th}>VVB</th><th style={sty.th}>Scope</th><th style={sty.th}>A6.4</th><th style={sty.th}>VCS</th><th style={sty.th}>GS</th><th style={sty.th}>ICR</th></tr></thead>
              <tbody>{[
                { v: 'TÜV Rheinland', s: 'Energy, Industrial, H2' },
                { v: 'TÜV SÜD', s: 'Energy, NBS, Waste' },
                { v: 'DNV', s: 'Energy, Maritime, H2' },
                { v: 'Bureau Veritas', s: 'NBS, Energy' },
                { v: 'Aenor', s: 'Energy, Industrial' },
                { v: 'ERM CVS', s: 'Industrial, Waste' },
                { v: 'EPIC Sustainability', s: 'India CCTS, PAT, Energy' },
              ].map((r, i) => <tr key={i}><td style={{ ...sty.td, color: T?.gold }}>{r.v}</td><td style={sty.td}>{r.s}</td><td style={sty.td}>{sr(i * 5) > 0.2 ? '✓' : '—'}</td><td style={sty.td}>{sr(i * 7) > 0.15 ? '✓' : '—'}</td><td style={sty.td}>{sr(i * 9) > 0.3 ? '✓' : '—'}</td><td style={sty.td}>{sr(i * 11) > 0.5 ? '✓' : '—'}</td></tr>)}</tbody>
            </table>
          </>
        );

      case 'RFNBO Telemetry':
        return (
          <>
            <div style={{ fontSize: 12, color: T?.textSec, marginBottom: 10 }}>RFNBO hourly matching compliance (EU Delegated Act 2023/1184) — temporal, geographic, additionality. Threshold 34 gCO₂e/MJ.</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={sty.kpi}><div style={sty.kpiLbl}>HOURLY MATCH</div><div style={{ ...sty.kpiVal, color: T?.green }}>96.2%</div><div style={sty.kpiSub}>target 100% by 2030</div></div>
              <div style={sty.kpi}><div style={sty.kpiLbl}>GEO-MATCH</div><div style={{ ...sty.kpiVal, color: T?.green }}>PASS</div><div style={sty.kpiSub}>same bidding zone</div></div>
              <div style={sty.kpi}><div style={sty.kpiLbl}>CI (gCO₂e/MJ)</div><div style={sty.kpiVal}>18.4</div><div style={sty.kpiSub}>vs 34 threshold ✓</div></div>
              <div style={sty.kpi}><div style={sty.kpiLbl}>PPA TENURE</div><div style={sty.kpiVal}>15yr</div><div style={sty.kpiSub}>dedicated RE</div></div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={Array.from({ length: 24 }, (_, h) => ({ h, re: +(50 + 45 * Math.sin((h - 8) * Math.PI / 12) + sr(h) * 8).toFixed(0), load: +(70 + sr(h * 3) * 15).toFixed(0) }))}><CartesianGrid stroke={T?.border} strokeDasharray="3 3" /><XAxis dataKey="h" stroke={T?.textSec} tick={{ fontSize: 11 }} /><YAxis stroke={T?.textSec} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: T?.surface, border: `1px solid ${T?.border}` }} /><Legend /><Line type="monotone" dataKey="re" stroke="#27ae60" strokeWidth={2} name="RE avail MWh" /><Line type="monotone" dataKey="load" stroke="#d4a843" strokeWidth={2} name="Electrolyzer load" /></LineChart>
            </ResponsiveContainer>
          </>
        );

      case 'Price Decomp':
        return (
          <>
            <div style={{ fontSize: 12, color: T?.textSec, marginBottom: 10 }}>GH2 landed-price decomposition. SIGHT ₹50/kg + A6.4 ITMO partially close the grey parity gap.</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { k: 'Electrolysis', v: 2.2 }, { k: 'RE PPA', v: 1.8 }, { k: 'Compression/storage', v: 0.6 },
                { k: 'Transport', v: 0.5 }, { k: 'SIGHT subsidy', v: -0.6 }, { k: 'A6.4 ITMO revenue', v: -0.9 }, { k: 'Landed cost', v: 3.6 },
              ]}><CartesianGrid stroke={T?.border} strokeDasharray="3 3" /><XAxis dataKey="k" stroke={T?.textSec} tick={{ fontSize: 10 }} angle={-15} height={60} textAnchor="end" /><YAxis stroke={T?.textSec} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: T?.surface, border: `1px solid ${T?.border}` }} /><Bar dataKey="v" name="$/kg H2">{[T?.gold,T?.gold,T?.gold,T?.gold,T?.green,T?.green,T?.teal].map((c, i) => <Cell key={i} fill={c} />)}</Bar></BarChart>
            </ResponsiveContainer>
          </>
        );

      case 'Additionality 4-Prong':
        return (
          <>
            <div style={{ fontSize: 12, color: T?.textSec, marginBottom: 10 }}>A6.4 / CCP E1 Additionality — 4-prong test: regulatory, financial, barrier, common practice.</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={sty.th}>Test</th><th style={sty.th}>Criterion</th><th style={sty.th}>Project result</th><th style={sty.th}>Pass/Fail</th></tr></thead>
              <tbody>{[
                { t: 'Regulatory', c: 'Not mandated by law/regulation', r: 'Voluntary beyond PAT/RPO targets', p: true },
                { t: 'Financial', c: 'IRR w/o credit < hurdle rate', r: 'IRR 8.2% < 11% hurdle · gap 280bps', p: true },
                { t: 'Barrier', c: 'Technology/market barriers', r: 'First-of-kind electrolyzer · supply chain', p: true },
                { t: 'Common Practice', c: '<5% of relevant peers deployed', r: '2.1% penetration in India state', p: true },
              ].map((r, i) => <tr key={i}><td style={{ ...sty.td, color: T?.gold }}>{r.t}</td><td style={sty.td}>{r.c}</td><td style={sty.td}>{r.r}</td><td style={{ ...sty.td, color: r.p ? T?.green : T?.red, fontWeight: 700 }}>{r.p ? '✓ PASS' : '✗ FAIL'}</td></tr>)}</tbody>
            </table>
          </>
        );

      case 'BRSR Assurance':
        return (
          <>
            <div style={{ fontSize: 12, color: T?.textSec, marginBottom: 10 }}>BRSR Core assurance tier engine (SEBI Top 1000 listed mandate). 9 KPIs, reasonable assurance from FY26.</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={sty.th}>KPI</th><th style={sty.th}>Unit</th><th style={sty.th}>Assurance Level</th><th style={sty.th}>Status</th></tr></thead>
              <tbody>{[
                { k: 'GHG Intensity (Scope 1+2)', u: 'tCO₂e/₹Cr', a: 'Reasonable', s: 'Achieved' },
                { k: 'Water Withdrawal', u: 'kL/₹Cr', a: 'Reasonable', s: 'Achieved' },
                { k: 'Energy Intensity', u: 'GJ/₹Cr', a: 'Reasonable', s: 'Achieved' },
                { k: 'Waste Management', u: 'tonnes', a: 'Limited', s: 'Achieved' },
                { k: 'Employee Wellbeing (spend %)', u: '% of cost', a: 'Reasonable', s: 'Achieved' },
                { k: 'Gender Diversity', u: '%', a: 'Reasonable', s: 'Achieved' },
                { k: 'Wages (median %)', u: '% GMW', a: 'Limited', s: 'Achieved' },
                { k: 'Complaints Resolution', u: 'days', a: 'Limited', s: 'Gap' },
                { k: 'Local Sourcing', u: '% of spend', a: 'Limited', s: 'Achieved' },
              ].map((r, i) => <tr key={i}><td style={sty.td}>{r.k}</td><td style={sty.td}>{r.u}</td><td style={{ ...sty.td, color: r.a === 'Reasonable' ? T?.gold : T?.textSec }}>{r.a}</td><td style={{ ...sty.td, color: r.s === 'Achieved' ? T?.green : T?.red }}>{r.s}</td></tr>)}</tbody>
            </table>
          </>
        );

      case 'Impact-Weighted':
        return (
          <>
            <div style={{ fontSize: 12, color: T?.textSec, marginBottom: 10 }}>Harvard Impact-Weighted Accounts — environmental + social + governance externalities monetized, $M/yr.</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { k: 'GHG avoided', v: 42.5, sign: '+' }, { k: 'Air quality', v: 18.2, sign: '+' },
                { k: 'Water stress', v: -6.4, sign: '-' }, { k: 'Land use', v: -4.1, sign: '-' },
                { k: 'Jobs created', v: 28.6, sign: '+' }, { k: 'Tax contribution', v: 15.3, sign: '+' },
                { k: 'Net impact', v: 94.1, sign: '=' },
              ]}><CartesianGrid stroke={T?.border} strokeDasharray="3 3" /><XAxis dataKey="k" stroke={T?.textSec} tick={{ fontSize: 10 }} angle={-15} height={60} textAnchor="end" /><YAxis stroke={T?.textSec} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: T?.surface, border: `1px solid ${T?.border}` }} /><Bar dataKey="v" name="$M/yr">{[T?.green,T?.green,T?.red,T?.red,T?.green,T?.green,T?.gold].map((c, i) => <Cell key={i} fill={c} />)}</Bar></BarChart>
            </ResponsiveContainer>
          </>
        );

      case 'VCMI Claim Calc':
        return (
          <>
            <div style={{ fontSize: 12, color: T?.textSec, marginBottom: 10 }}>VCMI Claims Code 2.0 tier calculator. Scope 1+2+3 residual determines offset floor.</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={sty.th}>Tier</th><th style={sty.th}>Offset %</th><th style={sty.th}>Min CCP</th><th style={sty.th}>Claim</th><th style={sty.th}>Requirements</th></tr></thead>
              <tbody>{VCMI_TIERS.map((v, i) => <tr key={i}><td style={{ ...sty.td, color: T?.gold, fontWeight: 700 }}>{v.tier}</td><td style={sty.td}>{v.offset}</td><td style={sty.td}>{[60, 80, 100][i]}%</td><td style={sty.td}>{v.claim}</td><td style={{ ...sty.td, fontSize: 10 }}>{v.req}</td></tr>)}</tbody>
            </table>
          </>
        );

      case 'CA Execution':
        return (
          <>
            <div style={{ fontSize: 12, color: T?.textSec, marginBottom: 10 }}>Article 6 Corresponding Adjustments — authorization & transfer registry snapshot.</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={sty.th}>Host</th><th style={sty.th}>Buyer</th><th style={sty.th}>Project</th><th style={sty.th}>ITMOs (k)</th><th style={sty.th}>CA Status</th><th style={sty.th}>Auth Date</th></tr></thead>
              <tbody>{[
                { h: 'India', b: 'Japan', p: 'Solar + storage', i: 820, s: 'Authorized', d: '2025-11' },
                { h: 'India', b: 'Switzerland', p: 'Waste-to-Energy', i: 340, s: 'Authorized', d: '2025-09' },
                { h: 'India', b: 'Singapore', p: 'NBS Mangrove', i: 210, s: 'Pending', d: '-' },
                { h: 'India', b: 'Korea', p: 'EV charging', i: 180, s: 'Authorized', d: '2026-01' },
                { h: 'India', b: 'EU (pilot)', p: 'Green H2', i: 95, s: 'MOU', d: '-' },
                { h: 'India', b: 'Japan', p: 'Geothermal', i: 60, s: 'Authorized', d: '2026-02' },
              ].map((r, i) => <tr key={i}><td style={sty.td}>{r.h}</td><td style={sty.td}>{r.b}</td><td style={sty.td}>{r.p}</td><td style={{ ...sty.td, fontFamily: T?.mono }}>{r.i}</td><td style={{ ...sty.td, color: r.s === 'Authorized' ? T?.green : T?.amber }}>{r.s}</td><td style={sty.td}>{r.d}</td></tr>)}</tbody>
            </table>
          </>
        );

      default:
        return <div style={{ fontSize: 12, color: T?.textMut }}>Tab coming soon.</div>;
    }
  };

  return (
    <div style={sty.wrap}>
      <div style={sty.hdr}>
        <div style={{ fontFamily: T?.mono, fontSize: 10, color: T?.gold, letterSpacing: 2 }}>{moduleCode} · APRIL 2026 QUANT & INTEGRITY APPENDIX</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T?.text, marginTop: 2 }}>Carbon Integrity, Digital MRV & Quantitative Analytics</div>
        <div style={{ fontSize: 11, color: T?.textSec, marginTop: 2 }}>ICVCM CCPs · VCMI 2.0 · Sylvera/BeZero/Calyx/Renoster/TruCost · A6.4 methodologies · 5-tier dMRV · Monte Carlo NPV · Forward curve + IV · Correlation</div>
      </div>
      <div style={sty.tabBar}>{tabs.map((t, i) => <div key={i} onClick={() => setSubTab(i)} style={sty.tab(subTab === i)}>{t}</div>)}</div>
      {renderTab()}
    </div>
  );
}
