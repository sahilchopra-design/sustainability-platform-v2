import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, LabelList, ComposedChart, Line, Legend,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// PF Credit Rating Engine (NX2-09)
// Agency-methodology-style project finance rating with:
//   · FACTOR TREE   3-level scorecard (Operations & asset / Financial /
//                   Country & system → sub-factors → component blends),
//                   weights visible AND editable — sibling groups re-normalise
//   · DSCR VOL.     coefficient-of-variation sub-factor from P50/P90 DSCR
//                   arrays (or a direct CoV input; documented proxy fallback)
//   · NOTCHING      phase, structural subordination (mezz −1/−2), external
//                   support/guarantee uplift capped at the guarantor, ±caps
//   · ESG OVERLAY   transition/ESG notching (0 to −2) from carbon-intensity
//                   percentile vs sector + SBTi/taxonomy mitigants — monotone,
//                   labeled interpretation of the agencies' ESG credit factors;
//                   rating WITH vs WITHOUT the overlay shown side by side
//   · PD CURVE      full 1-10y cumulative + marginal PD (log-survival
//                   interpolation of the 1/5/10y anchors, labeled) + EL profile
//   · PEERS         12 hand-authored anonymised PF profiles (labeled) plotted
//                   as a DSCR × gearing scatter with the user's deal overlaid
// Live engines:
//   1. POST /api/v1/pf-rating/rate           (scorecard + tree + notching + PD)
//   2. GET  /api/v1/pf-rating/ref/scorecard  (all weights/knots/rules, transparent)
//   3. GET  /api/v1/pf-rating/ref/peers      (peer table, hand-authored, labeled)
// The EL panel recomputes locally from the returned PD when LGD/exposure are
// edited (display-level derivation of live engine output — no fabrication).
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const fmtPct = (v, d = 2) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}%`;
const fmt$ = (v) => (v == null || isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

const RATING_COLOR = (r) => {
  if (!r) return T.slate;
  if (r.startsWith('A')) return T.green;
  if (r.startsWith('BBB')) return T.teal;
  if (r.startsWith('BB')) return T.amber;
  return T.red;
};

const FACTOR_LABELS = {
  phase: 'Phase risk',
  resource_risk: 'Resource risk (P90/P50)',
  revenue_contract: 'Revenue contract quality',
  structure: 'Financial structure',
  counterparty: 'Counterparty / contractor',
  country: 'Country / jurisdiction',
};

// Mirror of the backend FACTOR_TREE_DEF (api/v1/routes/pf_rating.py) — used to
// render the editable weight inputs; the engine re-normalises and echoes back.
const TREE_DEF = [
  {
    key: 'operations', label: 'Operations & asset risk', weight: 0.40,
    children: [
      { key: 'resource_risk', label: 'Resource / volume risk (P90/P50)', weight: 0.25 },
      { key: 'technology', label: 'Technology track record', weight: 0.20 },
      { key: 'opex_risk', label: 'Opex risk / cost predictability', weight: 0.15 },
      { key: 'counterparty_om', label: 'Counterparty — EPC / O&M quality', weight: 0.20 },
      { key: 'contract_mix', label: 'Contract mix & offtake quality', weight: 0.20 },
    ],
  },
  {
    key: 'financial', label: 'Financial risk', weight: 0.40,
    children: [
      { key: 'dscr_level', label: 'DSCR level (min)', weight: 0.35 },
      { key: 'dscr_volatility', label: 'DSCR volatility (CoV)', weight: 0.15 },
      { key: 'leverage', label: 'Leverage (gearing)', weight: 0.20 },
      { key: 'refi_risk', label: 'Refinancing risk (balloon share)', weight: 0.10 },
      { key: 'structure_protections', label: 'Structural protections', weight: 0.20 },
    ],
  },
  {
    key: 'country_system', label: 'Country & system risk', weight: 0.20,
    children: [
      { key: 'sovereign_tier', label: 'Sovereign / jurisdiction tier', weight: 0.70 },
      { key: 'legal_framework', label: 'Legal / PF enforcement framework', weight: 0.30 },
    ],
  },
];

const Badge = ({ status, demoText }) => {
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live</span>;
  if (status === 'loading') return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Calling engine</span>;
  if (status === 'demo') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Demo{demoText ? ` — ${demoText}` : ' — engine unavailable'}</span>;
  return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Idle — run scorecard</span>;
};

const Kpi = ({ label, value, sub, color = T.navy }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const RatingCard = ({ label, rating, sub, big = false }) => (
  <div style={{
    background: RATING_COLOR(rating) + '15', border: `2px solid ${RATING_COLOR(rating)}`,
    borderRadius: 10, padding: big ? '14px 26px' : '10px 18px', display: 'flex', flexDirection: 'column',
    justifyContent: 'center', minWidth: big ? 165 : 130, flex: big ? undefined : 1,
  }}>
    <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    <div style={{ fontSize: big ? 38 : 28, fontWeight: 800, color: RATING_COLOR(rating), fontFamily: T.mono, lineHeight: 1.1 }}>{rating || '—'}</div>
    {sub && <div style={{ fontSize: 10.5, color: T.sub }}>{sub}</div>}
  </div>
);

const inputStyle = {
  border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 8px',
  fontSize: 12, fontFamily: T.mono, color: T.navy, background: '#fff', width: '100%', boxSizing: 'border-box',
};
const th = { textAlign: 'left', fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 8px', borderBottom: `2px solid ${T.border}` };
const td = { fontSize: 12, color: T.slate, padding: '6px 8px', borderBottom: `1px solid ${T.border}` };
const tdMono = { ...td, fontFamily: T.mono, textAlign: 'right' };
const thR = { ...th, textAlign: 'right' };

const Field = ({ label, children, width = 190 }) => (
  <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 4, width }}>
    {label}
    {children}
  </label>
);

const ScoreBar = ({ score, width = 120 }) => (
  <div style={{ width, height: 8, background: T.cream, borderRadius: 4, overflow: 'hidden', display: 'inline-block', verticalAlign: 'middle' }}>
    <div style={{
      width: `${Math.max(0, Math.min(100, score))}%`, height: '100%', borderRadius: 4,
      background: score >= 70 ? T.green : score >= 50 ? T.gold : T.red,
    }} />
  </div>
);

// Hand-authored editable defaults — an illustrative operating contracted solar
// project. NOT live data; mirror of the backend scorecard inputs.
const DEFAULTS = {
  project_name: 'Meseta Solar 100 MW — operating',
  phase: 'operation',
  p90_p50_ratio: 0.88,
  contracted_revenue_pct: 85,
  offtaker_rating: 'BBB',
  min_dscr: 1.32,
  gearing_pct: 74,
  dsra_months: 6,
  cash_sweep_pct: 25,
  contractor_quality: 'tier1_unwrapped',
  country_tier: 'a',
  // v2
  technology: 'proven_conventional',
  opex_risk: 'budgeted_with_reserves',
  legal_framework: 'mature',
  refi_share_pct: 0,
  seniority: 'senior',
  subordination_depth_pct: 0,
  guarantee: 'none',
  guarantor_rating: '',
};
const parseArray = (text) => text.split(/[\s,;]+/).map((s) => parseFloat(s)).filter((x) => !isNaN(x));

export default function PfCreditRatingEnginePage() {
  const [inp, setInp] = useState(DEFAULTS);
  const [lgdPct, setLgdPct] = useState(35);
  const [exposureUsd, setExposureUsd] = useState(80000000);
  // DSCR volatility inputs
  const [dscrP50Text, setDscrP50Text] = useState('');
  const [dscrP90Text, setDscrP90Text] = useState('');
  const [dscrCovPct, setDscrCovPct] = useState('');
  // ESG overlay inputs
  const [esgOn, setEsgOn] = useState(true);
  const [esg, setEsg] = useState({ carbon_intensity_percentile: 30, sbti_aligned: false, taxonomy_revenue_pct: 100 });
  // Editable tree weights (dotted path -> string); blanks fall back to defaults
  const [wt, setWt] = useState({});

  const [rating, setRating] = useState({ status: 'idle', data: null, error: null });
  const [ref, setRef] = useState({ status: 'loading', data: null, error: null });
  const [peers, setPeers] = useState({ status: 'loading', data: null, error: null });

  const set = (k, v) => setInp((p) => ({ ...p, [k]: v }));
  const setE = (k, v) => setEsg((p) => ({ ...p, [k]: v }));
  const num = (v) => { const x = parseFloat(v); return isNaN(x) ? null : x; };

  useEffect(() => {
    axios.get('/api/v1/pf-rating/ref/scorecard', { timeout: 15000 })
      .then(({ data }) => setRef({ status: 'live', data, error: null }))
      .catch((e) => setRef({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }));
    axios.get('/api/v1/pf-rating/ref/peers', { timeout: 15000 })
      .then(({ data }) => setPeers({ status: 'live', data, error: null }))
      .catch((e) => setPeers({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }));
  }, []);

  const runRating = useCallback(async () => {
    setRating({ status: 'loading', data: null, error: null });
    const weightOverrides = {};
    Object.entries(wt).forEach(([path, v]) => {
      const x = parseFloat(v);
      if (!isNaN(x) && x >= 0) weightOverrides[path] = x;
    });
    const p50Arr = parseArray(dscrP50Text);
    const p90Arr = parseArray(dscrP90Text);
    try {
      const { data } = await axios.post('/api/v1/pf-rating/rate', {
        project_name: inp.project_name,
        phase: inp.phase,
        p90_p50_ratio: num(inp.p90_p50_ratio),
        contracted_revenue_pct: num(inp.contracted_revenue_pct),
        offtaker_rating: inp.offtaker_rating,
        min_dscr: num(inp.min_dscr),
        gearing_pct: num(inp.gearing_pct),
        dsra_months: num(inp.dsra_months),
        cash_sweep_pct: num(inp.cash_sweep_pct),
        contractor_quality: inp.contractor_quality,
        country_tier: inp.country_tier,
        lgd_pct: num(lgdPct),
        exposure_usd: num(exposureUsd) || null,
        // v2: factor tree extras
        technology: inp.technology,
        opex_risk: inp.opex_risk,
        legal_framework: inp.legal_framework,
        refi_share_pct: num(inp.refi_share_pct) ?? 0,
        ...(Object.keys(weightOverrides).length ? { weight_overrides: weightOverrides } : {}),
        // v2: DSCR volatility
        ...(p50Arr.length >= 2 ? { dscr_p50_path: p50Arr } : {}),
        ...(p50Arr.length >= 2 && p90Arr.length === p50Arr.length ? { dscr_p90_path: p90Arr } : {}),
        ...(num(dscrCovPct) != null ? { dscr_cov_pct: num(dscrCovPct) } : {}),
        // v2: notching
        seniority: inp.seniority,
        subordination_depth_pct: num(inp.subordination_depth_pct) ?? 0,
        guarantee: inp.guarantee,
        ...(inp.guarantee !== 'none' && inp.guarantor_rating ? { guarantor_rating: inp.guarantor_rating } : {}),
        // v2: ESG overlay
        ...(esgOn ? {
          esg: {
            carbon_intensity_percentile: num(esg.carbon_intensity_percentile) ?? 50,
            sbti_aligned: !!esg.sbti_aligned,
            taxonomy_revenue_pct: num(esg.taxonomy_revenue_pct) ?? 0,
          },
        } : {}),
      }, { timeout: 20000 });
      setRating({ status: 'live', data, error: null });
    } catch (e) {
      setRating({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message });
    }
  }, [inp, lgdPct, exposureUsd, wt, dscrP50Text, dscrP90Text, dscrCovPct, esgOn, esg]);

  const res = rating.status === 'live' ? rating.data : null;
  const tree = res?.factor_tree || null;
  const notch = res?.notching || null;
  const esgRes = res?.esg_overlay || null;
  const summary = res?.rating_summary || null;
  const pdTerm = res?.pd_term_structure || null;

  // Driver waterfall data (legacy flat scorecard, notches vs anchor)
  const driverData = useMemo(() => {
    if (!res) return [];
    return res.drivers.map((d) => ({
      name: FACTOR_LABELS[d.factor] || d.factor,
      notches: d.notches_vs_anchor,
      score: d.factor_score,
      weight: d.weight,
      input: d.input,
    }));
  }, [res]);

  // PD term-structure chart data (with vs without ESG overlay)
  const pdChart = useMemo(() => {
    if (!pdTerm?.without_esg_overlay) return [];
    const wo = pdTerm.without_esg_overlay.curve;
    const wi = pdTerm.with_esg_overlay?.curve || null;
    return wo.map((row, i) => ({
      year: row.year,
      cumWithout: row.cum_pd_pct,
      margWithout: row.marginal_pd_pct,
      cumWith: wi ? wi[i].cum_pd_pct : null,
      elWithout: row.cum_el_pct,
      elWith: wi ? wi[i].cum_el_pct : null,
    }));
  }, [pdTerm]);

  // Peer scatter — peers colored by rating + the user's deal overlaid
  const peerScatter = useMemo(() => {
    if (peers.status !== 'live' || !peers.data) return { peers: [], deal: [] };
    return {
      peers: peers.data.peers.map((p) => ({
        x: p.gearing_pct, y: p.min_dscr, z: 90, rating: p.rating,
        name: `${p.peer} — ${p.sector}`, contracted: p.contracted_pct, note: p.note,
      })),
      deal: [{
        x: num(inp.gearing_pct) ?? 0, y: num(inp.min_dscr) ?? 0, z: 240,
        rating: summary?.final_with_esg_overlay || '—', name: inp.project_name,
        contracted: num(inp.contracted_revenue_pct) ?? 0, note: 'Your deal',
      }],
    };
  }, [peers, inp, summary]);

  // EL panel — reactive display-level recompute from live PD when LGD/exposure edited
  const el = useMemo(() => {
    if (!res) return null;
    const lgd = (num(lgdPct) ?? 35) / 100;
    const exp = num(exposureUsd);
    const mk = (pdPct) => ({
      elPct: pdPct * lgd,
      elUsd: exp ? exp * (pdPct / 100) * lgd : null,
    });
    return {
      y1: mk(res.pd.pd_1y_pct), y5: mk(res.pd.pd_5y_pct), y10: mk(res.pd.pd_10y_pct),
    };
  }, [res, lgdPct, exposureUsd]);

  const setWeight = (path, v) => setWt((p) => ({ ...p, [path]: v }));

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.teal, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>NX2-09</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>PF Credit Rating Engine</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>3-Level Factor Tree</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Notching + Guarantee Uplift</span>
          <span style={{ background: T.green + '22', color: T.green, border: `1px solid ${T.green}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>ESG / Transition Overlay</span>
          <span style={{ background: T.gold + '33', color: T.amber, border: `1px solid ${T.gold}66`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>1-10y PD Curve + Peers</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 16, maxWidth: 1120 }}>
        Project-finance rating in the style of the agency methodologies: a three-level factor tree (weights editable,
        re-normalised per group) → 0–100 score → indicative notch → documented notching chain (construction phase,
        structural subordination, guarantee uplift capped at the guarantor) → transition/ESG overlay (0 to −2 notches,
        monotone in carbon-intensity percentile, shown WITH vs WITHOUT) → 1–10y cumulative/marginal PD curve and EL
        profile. Every table and rule is documented in the engine and shown below — indicative only, <b>not</b> an
        agency rating.
      </div>

      {/* ── 1 · Scorecard inputs ─────────────────────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>1 · Transaction profile</h2>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Editable defaults — hand-authored illustrative project, not live data</span>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Field label="Project name" width={250}><input style={inputStyle} value={inp.project_name} onChange={(e) => set('project_name', e.target.value)} /></Field>
          <Field label="Phase" width={130}>
            <select style={inputStyle} value={inp.phase} onChange={(e) => set('phase', e.target.value)}>
              <option value="operation">Operation</option>
              <option value="construction">Construction</option>
            </select>
          </Field>
          <Field label="P90/P50 CFADS ratio (resource risk)" width={200}><input type="number" step="0.01" min="0.4" max="1" style={inputStyle} value={inp.p90_p50_ratio} onChange={(e) => set('p90_p50_ratio', e.target.value)} /></Field>
          <Field label="Contracted revenue %" width={140}><input type="number" style={inputStyle} value={inp.contracted_revenue_pct} onChange={(e) => set('contracted_revenue_pct', e.target.value)} /></Field>
          <Field label="Offtaker rating" width={110}>
            <select style={inputStyle} value={inp.offtaker_rating} onChange={(e) => set('offtaker_rating', e.target.value)}>
              {['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'NR'].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Min DSCR (x)" width={100}><input type="number" step="0.05" style={inputStyle} value={inp.min_dscr} onChange={(e) => set('min_dscr', e.target.value)} /></Field>
          <Field label="Gearing %" width={90}><input type="number" style={inputStyle} value={inp.gearing_pct} onChange={(e) => set('gearing_pct', e.target.value)} /></Field>
          <Field label="DSRA (months)" width={100}><input type="number" style={inputStyle} value={inp.dsra_months} onChange={(e) => set('dsra_months', e.target.value)} /></Field>
          <Field label="Cash sweep %" width={100}><input type="number" style={inputStyle} value={inp.cash_sweep_pct} onChange={(e) => set('cash_sweep_pct', e.target.value)} /></Field>
          <Field label="Contractor / operator quality" width={210}>
            <select style={inputStyle} value={inp.contractor_quality} onChange={(e) => set('contractor_quality', e.target.value)}>
              <option value="tier1_fixed_price_wrap">Tier-1, fixed-price full wrap</option>
              <option value="tier1_unwrapped">Tier-1, unwrapped</option>
              <option value="tier2_wrapped">Tier-2, wrapped</option>
              <option value="tier2_unwrapped">Tier-2, unwrapped</option>
              <option value="unproven">Unproven</option>
            </select>
          </Field>
          <Field label="Country tier (sovereign)" width={150}>
            <select style={inputStyle} value={inp.country_tier} onChange={(e) => set('country_tier', e.target.value)}>
              <option value="aaa_aa">AAA–AA</option>
              <option value="a">A</option>
              <option value="bbb">BBB</option>
              <option value="bb">BB</option>
              <option value="b_or_below">B or below</option>
            </select>
          </Field>
          <Field label="Technology track record" width={190}>
            <select style={inputStyle} value={inp.technology} onChange={(e) => set('technology', e.target.value)}>
              <option value="proven_conventional">Proven, conventional</option>
              <option value="proven_new_vintage">Proven class, new vintage</option>
              <option value="limited_track_record">Limited track record</option>
              <option value="first_of_a_kind">First of a kind</option>
            </select>
          </Field>
          <Field label="Opex risk" width={190}>
            <select style={inputStyle} value={inp.opex_risk} onChange={(e) => set('opex_risk', e.target.value)}>
              <option value="fixed_price_om_contract">Fixed-price O&amp;M contract</option>
              <option value="budgeted_with_reserves">Budgeted, with reserves</option>
              <option value="variable_exposed">Variable / exposed</option>
            </select>
          </Field>
          <Field label="Legal / PF framework" width={150}>
            <select style={inputStyle} value={inp.legal_framework} onChange={(e) => set('legal_framework', e.target.value)}>
              <option value="mature">Mature</option>
              <option value="developing">Developing</option>
              <option value="untested">Untested</option>
            </select>
          </Field>
          <Field label="Balloon / bullet share % (refi risk)" width={190}><input type="number" style={inputStyle} value={inp.refi_share_pct} onChange={(e) => set('refi_share_pct', e.target.value)} /></Field>
        </div>

        {/* Notching + DSCR volatility + ESG inputs */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 14 }}>
          <div style={{ flex: 1, minWidth: 320, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.purple, marginBottom: 8 }}>Notching — seniority &amp; support</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Field label="Seniority" width={130}>
                <select style={inputStyle} value={inp.seniority} onChange={(e) => set('seniority', e.target.value)}>
                  <option value="senior">Senior</option>
                  <option value="mezzanine">Mezzanine</option>
                </select>
              </Field>
              <Field label="Senior debt ahead % (mezz)" width={160}><input type="number" style={inputStyle} disabled={inp.seniority !== 'mezzanine'} value={inp.subordination_depth_pct} onChange={(e) => set('subordination_depth_pct', e.target.value)} /></Field>
              <Field label="Guarantee" width={120}>
                <select style={inputStyle} value={inp.guarantee} onChange={(e) => set('guarantee', e.target.value)}>
                  <option value="none">None</option>
                  <option value="partial">Partial (+1)</option>
                  <option value="full">Full wrap (+2)</option>
                </select>
              </Field>
              <Field label="Guarantor rating (uplift cap)" width={160}>
                <select style={inputStyle} disabled={inp.guarantee === 'none'} value={inp.guarantor_rating} onChange={(e) => set('guarantor_rating', e.target.value)}>
                  <option value="">— no cap —</option>
                  {['A', 'A-', 'BBB+', 'BBB', 'BBB-', 'BB+', 'BB', 'BB-', 'B+', 'B', 'B-'].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
              Mezz −1 (senior ahead &lt; 60%) or −2 (≥ 60%); construction −1/−2 by EPC wrap; net notching capped at [−3, +2].
            </div>
          </div>
          <div style={{ flex: 1.3, minWidth: 360, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.blue, marginBottom: 8 }}>DSCR volatility (CoV sub-factor)</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 4 }}>
                P50 DSCR path (paste from the debt sizer)
                <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="e.g. 1.45, 1.42, 1.38, …" value={dscrP50Text} onChange={(e) => setDscrP50Text(e.target.value)} />
              </label>
              <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 4 }}>
                P90 DSCR path (optional, same length)
                <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="e.g. 1.22, 1.20, 1.15, …" value={dscrP90Text} onChange={(e) => setDscrP90Text(e.target.value)} />
              </label>
              <Field label="…or direct CoV % (overrides)" width={150}><input type="number" step="0.5" style={inputStyle} placeholder="blank = derive" value={dscrCovPct} onChange={(e) => setDscrCovPct(e.target.value)} /></Field>
            </div>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
              CoV = stdev/mean of the P50 path; with a P90 path, implied σ = mean gap ÷ 1.2816 (documented) — the max is
              used (conservative). No paths ⇒ proxy from the P90/P50 CFADS ratio.
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 320, border: `1px solid ${esgOn ? T.green + '77' : T.border}`, borderRadius: 8, padding: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, fontWeight: 800, color: T.green, marginBottom: 8 }}>
              <input type="checkbox" checked={esgOn} onChange={(e) => setEsgOn(e.target.checked)} />
              Transition / ESG notching overlay
            </label>
            {esgOn && (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Field label="Carbon-intensity percentile vs sector" width={190}><input type="number" min="0" max="100" style={inputStyle} value={esg.carbon_intensity_percentile} onChange={(e) => setE('carbon_intensity_percentile', e.target.value)} /></Field>
                  <Field label="Taxonomy-aligned revenue %" width={160}><input type="number" min="0" max="100" style={inputStyle} value={esg.taxonomy_revenue_pct} onChange={(e) => setE('taxonomy_revenue_pct', e.target.value)} /></Field>
                  <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-end', paddingBottom: 6 }}>
                    <input type="checkbox" checked={esg.sbti_aligned} onChange={(e) => setE('sbti_aligned', e.target.checked)} />
                    SBTi-aligned target
                  </label>
                </div>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
                  0 = cleanest in sector, 100 = most carbon-intensive (user input). Overlay 0 to −2 notches, monotone —
                  labeled interpretation of the agencies' ESG credit-factor approach.
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <button onClick={runRating} style={{
            background: T.navy, color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 26px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
          }}>
            Rate the transaction →
          </button>
        </div>
      </div>

      {/* ── 2 · Rating chain & drivers ───────────────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>2 · Rating chain — tree → notching → ESG overlay (with vs without)</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/pf-rating/rate</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={rating.status} demoText={rating.error} /></div>
        </div>

        {rating.status === 'live' && res && summary && (
          <>
            <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', flexWrap: 'wrap', marginBottom: 8 }}>
              <RatingCard label="Tree scorecard" rating={summary.tree_scorecard} sub={`score ${tree?.tree_score}`} />
              <div style={{ alignSelf: 'center', fontSize: 20, color: T.sub }}>→</div>
              <RatingCard label={`After notching (${notch?.net_notches >= 0 ? '+' : ''}${notch?.net_notches})`} rating={summary.after_notching}
                sub={notch?.guarantor_cap_applied ? `capped at guarantor ${notch.guarantor_rating}` : 'phase · subordination · support'} />
              <div style={{ alignSelf: 'center', fontSize: 20, color: T.sub }}>→</div>
              <RatingCard label="WITHOUT ESG overlay" rating={esgRes?.rating_without_overlay} sub="pre-overlay" />
              <RatingCard label={`WITH ESG overlay (${esgRes?.overlay_notches ?? 0})`} rating={esgRes?.rating_with_overlay}
                sub={esgRes?.available ? `carbon pctile ${esgRes.carbon_intensity_percentile}` : 'overlay off'} big />
              <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Kpi label="Legacy flat scorecard" value={`${res.indicative_rating} · ${res.weighted_score}`} sub="Original 6-factor scorecard (kept for continuity)" />
                <Kpi label="DSCR volatility (CoV)" value={fmtPct(res.dscr_volatility.cov_pct, 1)} sub={`Sub-factor score ${res.dscr_volatility.score} · ${res.dscr_volatility.basis}`} color={T.blue} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: T.sub, fontFamily: T.mono, marginBottom: 12 }}>{summary.chain} · NOT an agency rating</div>

            {/* Notching steps + ESG rationale */}
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 14 }}>
              <div style={{ flex: 1, minWidth: 340 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Notching steps (documented rules — section 6)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Step</th><th style={thR}>Notches</th><th style={th}>Rationale</th></tr></thead>
                  <tbody>
                    {notch.steps.map((s) => (
                      <tr key={s.step}>
                        <td style={{ ...td, fontWeight: 600, color: T.navy }}>{s.step.replace(/_/g, ' ')}</td>
                        <td style={{ ...tdMono, fontWeight: 700, color: s.notches > 0 ? T.green : s.notches < 0 ? T.red : T.sub }}>{s.notches > 0 ? `+${s.notches}` : s.notches}</td>
                        <td style={{ ...td, fontSize: 11 }}>{s.rationale}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ ...td, fontWeight: 800, color: T.navy }}>Net (capped)</td>
                      <td style={{ ...tdMono, fontWeight: 800 }}>{notch.net_notches > 0 ? `+${notch.net_notches}` : notch.net_notches}{notch.net_notches !== notch.net_notches_uncapped ? ` (uncapped ${notch.net_notches_uncapped})` : ''}</td>
                      <td style={{ ...td, fontSize: 11, color: T.sub }}>{notch.cap_floor_rule}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {esgRes?.available && (
                <div style={{ flex: 1, minWidth: 340 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>ESG overlay rationale</div>
                  <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, fontSize: 12, color: T.slate, lineHeight: 1.65 }}>
                    <span style={{ fontFamily: T.mono, fontWeight: 700, color: esgRes.overlay_notches < 0 ? T.red : T.green }}>
                      {esgRes.overlay_notches} notch(es)
                    </span>{' — '}{esgRes.rationale}
                  </div>
                </div>
              )}
            </div>

            {/* Legacy driver waterfall */}
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.4, minWidth: 380 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                  Legacy driver waterfall — notches gained / lost vs scorecard anchor ({ref.status === 'live' ? `score ${ref.data.anchor.score}` : 'score 60'})
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={driverData} layout="vertical" margin={{ left: 60, right: 40, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`} label={{ value: 'Notches vs anchor', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={150} />
                    <Tooltip formatter={(v, n, p) => [`${v > 0 ? '+' : ''}${Number(v).toFixed(2)} notches · factor score ${p?.payload?.score} · weight ${(p?.payload?.weight * 100).toFixed(0)}%`, p?.payload?.input]} />
                    <ReferenceLine x={0} stroke={T.slate} />
                    <Bar dataKey="notches" radius={[0, 3, 3, 0]}>
                      {driverData.map((d, i) => <Cell key={i} fill={d.notches >= 0 ? T.green : T.red} />)}
                      <LabelList dataKey="notches" position="right" formatter={(v) => `${v > 0 ? '+' : ''}${Number(v).toFixed(2)}`} style={{ fontSize: 10, fontFamily: T.mono }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1.6, minWidth: 420 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Legacy factor detail (full tables in section 6)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>Factor</th><th style={th}>Input</th><th style={thR}>Score</th>
                      <th style={thR}>Weight</th><th style={thR}>Notches</th>
                    </tr>
                  </thead>
                  <tbody>
                    {res.drivers.map((d) => (
                      <tr key={d.factor}>
                        <td style={{ ...td, fontWeight: 600, color: T.navy }}>{FACTOR_LABELS[d.factor] || d.factor}</td>
                        <td style={{ ...td, fontSize: 11 }}>{d.input}</td>
                        <td style={tdMono}>{d.factor_score}</td>
                        <td style={tdMono}>{(d.weight * 100).toFixed(0)}%</td>
                        <td style={{ ...tdMono, fontWeight: 700, color: d.notches_vs_anchor >= 0 ? T.green : T.red }}>
                          {d.notches_vs_anchor > 0 ? '+' : ''}{d.notches_vs_anchor.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {res.structure_subscores && (
                  <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6, fontFamily: T.mono }}>
                    Structure sub-scores: min DSCR {res.structure_subscores.min_dscr} · gearing {res.structure_subscores.gearing} · DSRA {res.structure_subscores.dsra} · sweep {res.structure_subscores.sweep}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        {rating.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Rating engine unreachable or inputs rejected — no figures shown (this page never fabricates results). Error: {String(rating.error)}</div>}
        {rating.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Fill the transaction profile and run the scorecard. Weights, notching and ESG rules are fully documented below.</div>}
      </div>

      {/* ── 3 · Factor tree ──────────────────────────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>3 · Factor tree — weights editable, roll-up shown after each run</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>weight_overrides · sibling groups re-normalised to Σ = 1</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr>
                <th style={th}>Factor (level 1 → 2 → 3)</th><th style={thR}>Weight (edit)</th><th style={thR}>Normalised</th>
                <th style={th}>Input</th><th style={thR}>Score</th><th style={th}>Roll-up</th><th style={thR}>Notches vs anchor</th>
              </tr>
            </thead>
            <tbody>
              {TREE_DEF.map((g) => {
                const gRes = tree?.groups?.find((x) => x.key === g.key);
                return (
                  <React.Fragment key={g.key}>
                    <tr style={{ background: T.cream + '99' }}>
                      <td style={{ ...td, fontWeight: 800, color: T.navy }}>{g.label}</td>
                      <td style={tdMono}>
                        <input type="number" step="0.05" min="0" style={{ ...inputStyle, width: 70, textAlign: 'right', padding: '3px 6px' }}
                          placeholder={String(g.weight)} value={wt[g.key] ?? ''} onChange={(e) => setWeight(g.key, e.target.value)} />
                      </td>
                      <td style={{ ...tdMono, fontWeight: 700 }}>{gRes ? `${(gRes.weight_normalized * 100).toFixed(1)}%` : `${(g.weight * 100).toFixed(0)}%`}</td>
                      <td style={td} />
                      <td style={{ ...tdMono, fontWeight: 800, color: T.navy }}>{gRes ? gRes.score : '—'}</td>
                      <td style={td}>{gRes && <ScoreBar score={gRes.score} width={140} />}</td>
                      <td style={{ ...tdMono, fontWeight: 700, color: gRes && gRes.notches_vs_anchor >= 0 ? T.green : T.red }}>
                        {gRes ? `${gRes.notches_vs_anchor > 0 ? '+' : ''}${gRes.notches_vs_anchor.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                    {g.children.map((c) => {
                      const cRes = gRes?.children?.find((x) => x.key === c.key);
                      return (
                        <React.Fragment key={c.key}>
                          <tr>
                            <td style={{ ...td, paddingLeft: 28, fontWeight: 600, color: T.slate }}>├ {c.label}</td>
                            <td style={tdMono}>
                              <input type="number" step="0.05" min="0" style={{ ...inputStyle, width: 70, textAlign: 'right', padding: '3px 6px' }}
                                placeholder={String(c.weight)} value={wt[`${g.key}.${c.key}`] ?? ''} onChange={(e) => setWeight(`${g.key}.${c.key}`, e.target.value)} />
                            </td>
                            <td style={tdMono}>{cRes ? `${(cRes.weight_normalized * 100).toFixed(1)}%` : `${(c.weight * 100).toFixed(0)}%`}</td>
                            <td style={{ ...td, fontSize: 11 }}>{cRes?.input || '—'}</td>
                            <td style={{ ...tdMono, fontWeight: 700 }}>{cRes ? cRes.score : '—'}</td>
                            <td style={td}>{cRes && <ScoreBar score={cRes.score} />}</td>
                            <td style={{ ...tdMono, color: cRes && cRes.notches_vs_anchor >= 0 ? T.green : T.red }}>
                              {cRes ? `${cRes.notches_vs_anchor > 0 ? '+' : ''}${cRes.notches_vs_anchor.toFixed(2)}` : '—'}
                            </td>
                          </tr>
                          {cRes?.components?.map((k) => (
                            <tr key={k.key}>
                              <td style={{ ...td, paddingLeft: 52, fontSize: 11, color: T.sub }}>└ {k.key.replace(/_/g, ' ')}</td>
                              <td style={{ ...tdMono, fontSize: 11 }}>{(k.weight * 100).toFixed(0)}%</td>
                              <td style={td} />
                              <td style={{ ...td, fontSize: 11 }}>{k.input}</td>
                              <td style={{ ...tdMono, fontSize: 11 }}>{k.score}</td>
                              <td style={td}>{<ScoreBar score={k.score} width={80} />}</td>
                              <td style={td} />
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              {tree && (
                <tr style={{ background: T.gold + '22' }}>
                  <td style={{ ...td, fontWeight: 800, color: T.navy }}>Tree roll-up</td>
                  <td style={td} /><td style={{ ...tdMono, fontWeight: 700 }}>100%</td><td style={td} />
                  <td style={{ ...tdMono, fontWeight: 800, color: T.navy }}>{tree.tree_score}</td>
                  <td style={{ ...td, fontFamily: T.mono, fontWeight: 800, color: RATING_COLOR(tree.tree_rating) }}>{tree.tree_rating}</td>
                  <td style={td} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 10.5, color: T.sub, marginTop: 8 }}>
          {tree ? tree.basis_note : 'Run the scorecard to populate scores and the roll-up. Blank weight = engine default; edited weights are re-normalised per sibling group.'}
        </div>
      </div>

      {/* ── 4 · PD term structure & EL profile ───────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>4 · PD term structure (1–10y) &amp; expected loss</h2>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Interpolated from indicative 1/5/10y anchors — labeled, derived from Moody's/S&amp;P PF default studies</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <Field label="LGD % (Moody's PF ultimate recovery ~80%)" width={230}><input type="number" style={inputStyle} value={lgdPct} onChange={(e) => setLgdPct(e.target.value)} /></Field>
            <Field label="Exposure (USD)" width={160}><input type="number" style={inputStyle} value={exposureUsd} onChange={(e) => setExposureUsd(e.target.value)} /></Field>
          </div>
        </div>
        {res && el && pdTerm ? (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <Kpi label={`PD 1y / 5y / 10y — ${pdTerm.without_esg_overlay.rating} (pre-ESG)`} value={`${fmtPct(res.pd.pd_1y_pct)} / ${fmtPct(res.pd.pd_5y_pct)} / ${fmtPct(res.pd.pd_10y_pct)}`} sub="Legacy anchors at the flat-scorecard rating" color={T.indigo} />
              <Kpi label="EL 10y (% of exposure)" value={fmtPct(el.y10.elPct, 3)} sub={`PD 10y × LGD ${lgdPct}% (flat-scorecard rating)`} color={T.purple} />
              <Kpi label="EL 10y (USD)" value={el.y10.elUsd != null ? fmt$(el.y10.elUsd) : '—'} sub={`On ${fmt$(parseFloat(exposureUsd))} exposure`} color={T.red} />
              {pdTerm.with_esg_overlay && (
                <Kpi label="ESG overlay PD impact (10y)" value={`${fmtPct(pdTerm.without_esg_overlay.curve[9].cum_pd_pct)} → ${fmtPct(pdTerm.with_esg_overlay.curve[9].cum_pd_pct)}`}
                  sub={`${pdTerm.without_esg_overlay.rating} → ${pdTerm.with_esg_overlay.rating} (with overlay)`} color={T.amber} />
              )}
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.2, minWidth: 380 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}>
                  Cumulative PD (line, %) and marginal PD (bars, %) — {pdTerm.without_esg_overlay.rating}{pdTerm.with_esg_overlay ? ` vs ${pdTerm.with_esg_overlay.rating} (ESG overlay)` : ''}
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={pdChart} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: 'Horizon (years)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v, n) => [v == null ? '—' : `${Number(v).toFixed(3)}%`, n]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="margWithout" name="Marginal PD (pre-ESG)" fill={T.gold} radius={[3, 3, 0, 0]} barSize={14} />
                    <Line type="monotone" dataKey="cumWithout" name={`Cumulative PD — ${pdTerm.without_esg_overlay.rating}`} stroke={T.indigo} strokeWidth={2.2} dot={{ r: 2.5 }} />
                    {pdTerm.with_esg_overlay && (
                      <Line type="monotone" dataKey="cumWith" name={`Cumulative PD — ${pdTerm.with_esg_overlay.rating} (with ESG)`} stroke={T.red} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 2 }} />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>{pdTerm.without_esg_overlay.interpolation_note}</div>
              </div>
              <div style={{ flex: 1, minWidth: 340 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}>EL term profile — cumulative PD × LGD {pdTerm.lgd_pct}%{pdTerm.exposure_usd ? ` × ${fmt$(pdTerm.exposure_usd)}` : ''}</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>Yr</th><th style={thR}>Cum PD %</th><th style={thR}>Marg PD %</th>
                      <th style={thR}>Cum EL %</th><th style={thR}>Cum EL USD</th>
                      {pdTerm.with_esg_overlay && <th style={thR}>Cum EL % (ESG)</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {pdTerm.without_esg_overlay.curve.map((row, i) => (
                      <tr key={row.year}>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{row.year}</td>
                        <td style={tdMono}>{row.cum_pd_pct.toFixed(3)}</td>
                        <td style={tdMono}>{row.marginal_pd_pct.toFixed(3)}</td>
                        <td style={tdMono}>{row.cum_el_pct.toFixed(3)}</td>
                        <td style={tdMono}>{row.cum_el_usd != null ? fmt$(row.cum_el_usd) : '—'}</td>
                        {pdTerm.with_esg_overlay && <td style={{ ...tdMono, color: T.red }}>{pdTerm.with_esg_overlay.curve[i].cum_el_pct.toFixed(3)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 8 }}>{res.pd.basis}</div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: T.sub }}>Run the scorecard to populate the PD curve and expected loss. LGD and exposure recompute the legacy EL panel instantly from the live PD; the 1–10y profile re-runs with the engine.</div>
        )}
      </div>

      {/* ── 5 · Peer benchmark scatter ───────────────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>5 · Peer benchmark — min DSCR × gearing, colored by rating</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/pf-rating/ref/peers</span>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Hand-authored anonymised profiles — illustrative, not real transactions</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={peers.status} demoText={peers.error} /></div>
        </div>
        {peers.status === 'live' && peers.data && (
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ flex: 1.2, minWidth: 400 }}>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 12, right: 24, bottom: 14, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" dataKey="x" name="Gearing" unit="%" domain={[35, 95]} tick={{ fontSize: 10 }}
                    label={{ value: 'Gearing (%)', position: 'insideBottom', offset: -8, fontSize: 10 }} />
                  <YAxis type="number" dataKey="y" name="Min DSCR" domain={[1.0, 2.3]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}x`}
                    label={{ value: 'Min DSCR (x)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <ZAxis type="number" dataKey="z" range={[70, 260]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }}
                    formatter={(v, n) => [n === 'Gearing' ? `${v}%` : `${Number(v).toFixed(2)}x`, n]}
                    labelFormatter={() => ''}
                    content={({ payload }) => {
                      const p = payload?.[0]?.payload;
                      if (!p) return null;
                      return (
                        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 11 }}>
                          <div style={{ fontWeight: 700, color: T.navy }}>{p.name}</div>
                          <div style={{ fontFamily: T.mono }}>rating <b style={{ color: RATING_COLOR(p.rating) }}>{p.rating}</b> · DSCR {Number(p.y).toFixed(2)}x · gearing {p.x}% · contracted {p.contracted}%</div>
                          <div style={{ color: T.sub }}>{p.note}</div>
                        </div>
                      );
                    }} />
                  <Scatter name="Peers" data={peerScatter.peers}>
                    {peerScatter.peers.map((p, i) => <Cell key={i} fill={RATING_COLOR(p.rating)} fillOpacity={0.75} />)}
                  </Scatter>
                  <Scatter name="Your deal" data={peerScatter.deal} shape="star">
                    {peerScatter.deal.map((p, i) => <Cell key={i} fill={T.navy} stroke={T.gold} strokeWidth={2} />)}
                  </Scatter>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </ScatterChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 10.5, color: T.sub }}>
                Star = your deal ({inp.min_dscr}x · {inp.gearing_pct}%{summary ? ` · rated ${summary.final_with_esg_overlay} by this engine` : ''}).
                Higher DSCR + lower gearing → stronger; color = peer rating.
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 380 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Peer</th><th style={th}>Sector</th><th style={thR}>Contr. %</th>
                    <th style={thR}>Min DSCR</th><th style={thR}>Gearing</th><th style={th}>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {peers.data.peers.map((p) => (
                    <tr key={p.peer}>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{p.peer}</td>
                      <td style={{ ...td, fontSize: 11 }}>{p.sector}</td>
                      <td style={tdMono}>{p.contracted_pct}%</td>
                      <td style={tdMono}>{p.min_dscr.toFixed(2)}x</td>
                      <td style={tdMono}>{p.gearing_pct}%</td>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 800, color: RATING_COLOR(p.rating) }}>{p.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>{peers.data.basis_note} (as of {peers.data.as_of})</div>
            </div>
          </div>
        )}
        {peers.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Peer reference unavailable. Error: {String(peers.error)}</div>}
      </div>

      {/* ── 6 · Transparent scorecard reference ──────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>6 · Scorecard weights, rating map, notching/ESG rules &amp; PD table (full transparency)</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/pf-rating/ref/scorecard</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={ref.status} demoText={ref.error} /></div>
        </div>
        {ref.status === 'live' && ref.data && (
          <>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Legacy factor weights (sum = 1.00)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Factor</th><th style={thR}>Weight</th></tr></thead>
                  <tbody>
                    {Object.entries(ref.data.weights).map(([f, w]) => (
                      <tr key={f}>
                        <td style={{ ...td, fontWeight: 600, color: T.navy }}>{FACTOR_LABELS[f] || f}</td>
                        <td style={tdMono}>{(w * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
                  Internal blends — revenue: {(ref.data.internal_blends.revenue_contract.contracted_share * 100).toFixed(0)}% contracted share
                  / {(ref.data.internal_blends.revenue_contract.offtaker_quality * 100).toFixed(0)}% offtaker; structure:
                  {' '}{(ref.data.internal_blends.structure.min_dscr * 100).toFixed(0)}% DSCR / {(ref.data.internal_blends.structure.gearing * 100).toFixed(0)}% gearing
                  / {(ref.data.internal_blends.structure.dsra * 100).toFixed(0)}% DSRA / {(ref.data.internal_blends.structure.sweep * 100).toFixed(0)}% sweep.
                  Tree basis: {ref.data.factor_tree?.basis_note}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Score → rating bands ({ref.data.points_per_notch} pts/notch)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={thR}>Score floor</th><th style={th}>Rating</th></tr></thead>
                  <tbody>
                    {ref.data.rating_bands.map((b) => (
                      <tr key={b.rating}>
                        <td style={tdMono}>{b.score_floor}</td>
                        <td style={{ ...td, fontWeight: 700, color: RATING_COLOR(b.rating), fontFamily: T.mono }}>{b.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ flex: 1.4, minWidth: 320 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Cumulative PD by notch (%, anchors)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Rating</th><th style={thR}>1y</th><th style={thR}>5y</th><th style={thR}>10y</th></tr></thead>
                  <tbody>
                    {Object.entries(ref.data.pd_table).map(([r, p]) => (
                      <tr key={r} style={{ background: res && res.indicative_rating === r ? T.gold + '22' : 'transparent' }}>
                        <td style={{ ...td, fontWeight: 700, color: RATING_COLOR(r), fontFamily: T.mono }}>{r}</td>
                        <td style={tdMono}>{p.pd_1y_pct}</td>
                        <td style={tdMono}>{p.pd_5y_pct}</td>
                        <td style={tdMono}>{p.pd_10y_pct}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>{ref.data.pd_basis_note} {ref.data.pd_curve_interpolation}</div>
              </div>
            </div>
            {(ref.data.notching_rules || ref.data.esg_overlay_rules) && (
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 14 }}>
                {ref.data.notching_rules && (
                  <div style={{ flex: 1, minWidth: 340 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Notching rules (documented)</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {Object.entries(ref.data.notching_rules).map(([k, v]) => (
                          <tr key={k}>
                            <td style={{ ...td, fontWeight: 600, color: T.navy, whiteSpace: 'nowrap' }}>{k.replace(/_/g, ' ')}</td>
                            <td style={{ ...td, fontSize: 11 }}>{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {ref.data.esg_overlay_rules && (
                  <div style={{ flex: 1, minWidth: 340 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>ESG overlay mapping (labeled interpretation)</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={th}>Carbon-intensity percentile</th><th style={thR}>Penalty (half-notches)</th></tr></thead>
                      <tbody>
                        {ref.data.esg_overlay_rules.carbon_intensity_penalty_half_notches.map((r, i) => (
                          <tr key={i}>
                            <td style={{ ...td, fontFamily: T.mono }}>{r.percentile_lt != null ? `< ${r.percentile_lt}` : `≤ ${r.percentile_lte}`}</td>
                            <td style={tdMono}>{r.penalty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
                      Mitigants (half-notches): SBTi target −{ref.data.esg_overlay_rules.mitigants_half_notches.sbti_aligned_target};
                      taxonomy ≥66% −{ref.data.esg_overlay_rules.mitigants_half_notches.taxonomy_revenue_gte_66pct};
                      ≥33% −{ref.data.esg_overlay_rules.mitigants_half_notches.taxonomy_revenue_gte_33pct}.
                      {' '}{ref.data.esg_overlay_rules.rule} {ref.data.esg_overlay_rules.basis}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {ref.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Scorecard reference unavailable. Error: {String(ref.error)}</div>}
      </div>

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
        Engine: api/v1/routes/pf_rating.py — 3-level factor tree (weights editable, re-normalised) + documented knot
        tables; notching chain (phase / subordination / guarantee, capped); ESG overlay monotone in carbon-intensity
        percentile (labeled interpretation of agency ESG credit factors); PD anchors hand-authored from Moody's/S&amp;P PF
        default studies with log-survival 1–10y interpolation (labeled). EL panel recomputes locally from the live PD when
        LGD / exposure change. Deterministic — no PRNG. Pairs with NX2-02 (/project-finance-debt-sizer): paste its DSCR
        path here for the volatility sub-factor and use its min DSCR / gearing as structure inputs.
      </div>
    </div>
  );
}
