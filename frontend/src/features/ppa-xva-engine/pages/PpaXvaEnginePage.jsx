import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine, BarChart, Bar, Cell,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// PPA XVA Engine (NX2-12)
// FULL XVA suite (CVA/DVA/FVA/KVA/MVA/ColVA) on long-dated PPAs via a
// DETERMINISTIC recombining binomial lattice (no PRNG) + hand-authored
// rating-based PD curves and an annual rating-migration matrix.
// Live engines:
//   1. POST /api/v1/ppa-xva/cva                        (lattice EE/PFE → XVA stack)
//   2. POST /api/v1/ppa-xva/netting                    (2-3 PPA netting set)
//   3. GET  /api/v1/ppa-xva/ref/pd-curves              (transparent PD table)
//   4. GET  /api/v1/ppa-xva/ref/migration-matrix       (annual transition matrix)
//   5. GET  /api/v1/renewable-ppa/ref/credit-ratings   (PPA counterparty scores)
// Every number shown comes from the engine response or a labeled input —
// nothing is fabricated client-side. CRA proxy (/api → localhost:8001).
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const RATINGS = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC'];

const fmt$ = (v, d = 0) => (v == null || isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: d })}`;
const fmt$M = (v) => (v == null || isNaN(v)) ? '—' : `$${(Number(v) / 1e6).toLocaleString('en-US', { maximumFractionDigits: 2 })}M`;
const fmtNum = (v, d = 2) => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });
const fmtPct = (v, d = 2) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}%`;

const Badge = ({ status, demoText }) => {
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live</span>;
  if (status === 'loading') return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Calling engine</span>;
  if (status === 'demo') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Demo{demoText ? ` — ${demoText}` : ' — engine unavailable'}</span>;
  return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Idle — run valuation</span>;
};

const Kpi = ({ label, value, sub, color = T.navy }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const inputStyle = {
  border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 8px',
  fontSize: 12, fontFamily: T.mono, color: T.navy, background: '#fff', width: '100%', boxSizing: 'border-box',
};
const th = { textAlign: 'left', fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 8px', borderBottom: `2px solid ${T.border}` };
const td = { fontSize: 12, color: T.slate, padding: '6px 8px', borderBottom: `1px solid ${T.border}` };
const secCard = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 };
const h2s = { margin: 0, fontSize: 15, fontWeight: 800, color: T.navy };
const noteBox = { fontSize: 11, color: T.slate, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px' };

const Fld = ({ label, children, hint }) => (
  <label style={{ display: 'block', fontSize: 11, color: T.sub, fontWeight: 600 }}>
    <div style={{ marginBottom: 3 }}>{label}</div>
    {children}
    {hint && <div style={{ fontSize: 10, color: T.sub, fontWeight: 400, marginTop: 2 }}>{hint}</div>}
  </label>
);

const Slider = ({ label, value, onChange, min = 0, max = 1, step = 0.05, color = T.red, fmt = (v) => Number(v).toFixed(2), note }) => (
  <div style={{ flex: 1, minWidth: 260, background: T.cream, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{label}</div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(e.target.value)} style={{ flex: 1, minWidth: 140, accentColor: color }} />
      <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color, minWidth: 46 }}>{fmt(value)}</div>
    </div>
    {note && <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>{note}</div>}
  </div>
);

const DEFAULT_NETTING_CONTRACTS = [
  { label: 'Wind PPA — we sell fixed', fixed_price_usd_mwh: 55, annual_volume_mwh: 250000, tenor_years: 15, holder: 'generator' },
  { label: 'Solar offtake — we buy fixed', fixed_price_usd_mwh: 50, annual_volume_mwh: 180000, tenor_years: 12, holder: 'offtaker' },
];

export default function PpaXvaEnginePage() {
  const [inp, setInp] = useState({
    fixed_price_usd_mwh: 55, annual_volume_mwh: 250000, tenor_years: 15,
    holder: 'generator',
    current_merchant_price_usd_mwh: 48, annual_drift_pct: 1.0, annual_vol_pct: 22,
    counterparty_rating: 'BBB', own_rating: 'BBB',
    recovery_rate: 0.40, own_recovery_rate: 0.40, discount_rate_pct: 4.5,
    use_rating_transitions: false,
    collateral_threshold_usd: 5000000, margin_period_days: 10,
    mta_usd: 250000, rounding_usd: 100000,
    csa_type: 'two_way', collateral_type: 'cash', initial_margin_usd: 0,
    netting_agreement: false,
    funding_spread_bps: 120, cost_of_capital_pct: 10, capital_risk_weight_pct: 100,
    colva_spread_bps: 15,
    counterparty_is_merchant_utility: true, wwr_correlation: 0.25,
    res_output_price_correlation: 0.6, counterparty_transition_score: 50,
  });
  const set = (k, v) => setInp((p) => ({ ...p, [k]: v }));

  const [res, setRes] = useState({ status: 'idle', data: null, error: null });
  const [pdRef, setPdRef] = useState({ status: 'loading', data: null, error: null });
  const [migRef, setMigRef] = useState({ status: 'loading', data: null, error: null });
  const [ppaScores, setPpaScores] = useState({ status: 'loading', data: null, error: null });
  const [showColl, setShowColl] = useState(true); // collateral comparison toggle

  // Netting-set analyzer state
  const [netContracts, setNetContracts] = useState(DEFAULT_NETTING_CONTRACTS);
  const [netRes, setNetRes] = useState({ status: 'idle', data: null, error: null });

  useEffect(() => {
    axios.get('/api/v1/ppa-xva/ref/pd-curves', { timeout: 15000 })
      .then(({ data }) => setPdRef({ status: 'live', data, error: null }))
      .catch((e) => setPdRef({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }));
    axios.get('/api/v1/ppa-xva/ref/migration-matrix', { timeout: 15000 })
      .then(({ data }) => setMigRef({ status: 'live', data, error: null }))
      .catch((e) => setMigRef({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }));
    axios.get('/api/v1/renewable-ppa/ref/credit-ratings', { timeout: 15000 })
      .then(({ data }) => setPpaScores({ status: 'live', data, error: null }))
      .catch((e) => setPpaScores({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }));
  }, []);

  const run = useCallback(async () => {
    setRes({ status: 'loading', data: null, error: null });
    try {
      const payload = {
        ...inp,
        fixed_price_usd_mwh: parseFloat(inp.fixed_price_usd_mwh),
        annual_volume_mwh: parseFloat(inp.annual_volume_mwh),
        tenor_years: parseInt(inp.tenor_years, 10),
        current_merchant_price_usd_mwh: parseFloat(inp.current_merchant_price_usd_mwh),
        annual_drift_pct: parseFloat(inp.annual_drift_pct),
        annual_vol_pct: parseFloat(inp.annual_vol_pct),
        recovery_rate: parseFloat(inp.recovery_rate),
        own_recovery_rate: parseFloat(inp.own_recovery_rate),
        discount_rate_pct: parseFloat(inp.discount_rate_pct),
        collateral_threshold_usd: parseFloat(inp.collateral_threshold_usd),
        margin_period_days: parseInt(inp.margin_period_days, 10),
        mta_usd: parseFloat(inp.mta_usd),
        rounding_usd: parseFloat(inp.rounding_usd),
        initial_margin_usd: parseFloat(inp.initial_margin_usd),
        funding_spread_bps: parseFloat(inp.funding_spread_bps),
        cost_of_capital_pct: parseFloat(inp.cost_of_capital_pct),
        capital_risk_weight_pct: parseFloat(inp.capital_risk_weight_pct),
        colva_spread_bps: parseFloat(inp.colva_spread_bps),
        wwr_correlation: parseFloat(inp.wwr_correlation),
        res_output_price_correlation: parseFloat(inp.res_output_price_correlation),
        counterparty_transition_score: parseFloat(inp.counterparty_transition_score),
      };
      const { data } = await axios.post('/api/v1/ppa-xva/cva', payload, { timeout: 30000 });
      setRes({ status: 'live', data, error: null });
    } catch (e) {
      setRes({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
    }
  }, [inp]);

  const runNetting = useCallback(async () => {
    setNetRes({ status: 'loading', data: null, error: null });
    try {
      const payload = {
        contracts: netContracts.map((c) => ({
          label: c.label,
          fixed_price_usd_mwh: parseFloat(c.fixed_price_usd_mwh),
          annual_volume_mwh: parseFloat(c.annual_volume_mwh),
          tenor_years: parseInt(c.tenor_years, 10),
          holder: c.holder,
        })),
        current_merchant_price_usd_mwh: parseFloat(inp.current_merchant_price_usd_mwh),
        annual_drift_pct: parseFloat(inp.annual_drift_pct),
        annual_vol_pct: parseFloat(inp.annual_vol_pct),
        counterparty_rating: inp.counterparty_rating,
        recovery_rate: parseFloat(inp.recovery_rate),
        discount_rate_pct: parseFloat(inp.discount_rate_pct),
      };
      const { data } = await axios.post('/api/v1/ppa-xva/netting', payload, { timeout: 30000 });
      setNetRes({ status: 'live', data, error: null });
    } catch (e) {
      setNetRes({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
    }
  }, [netContracts, inp]);

  const setContract = (i, k, v) => setNetContracts((prev) => prev.map((c, j) => (j === i ? { ...c, [k]: v } : c)));
  const addContract = () => setNetContracts((prev) => prev.length < 3
    ? [...prev, { label: `PPA ${prev.length + 1}`, fixed_price_usd_mwh: 60, annual_volume_mwh: 120000, tenor_years: 10, holder: 'generator' }]
    : prev);
  const removeContract = (i) => setNetContracts((prev) => (prev.length > 2 ? prev.filter((_, j) => j !== i) : prev));

  const d = res.data;
  const cvaShown = d ? (showColl ? d.cva_collateralized : d.cva_uncollateralized) : null;
  const netShown = d ? (showColl ? d.net_bilateral_adjustment_coll : d.net_bilateral_adjustment_uncoll) : null;
  const collReductionPct = d && d.cva_uncollateralized > 0
    ? (1 - d.cva_collateralized / d.cva_uncollateralized) * 100 : null;

  const waterfallChart = useMemo(() => {
    if (!d?.xva_waterfall) return [];
    return d.xva_waterfall.map((w) => ({ ...w, fill: w.component === 'Total XVA' ? T.navy : (w.value >= 0 ? T.red : T.green) }));
  }, [d]);

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.indigo, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>NX2-12</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>PPA XVA Engine</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Deterministic Binomial Lattice — no PRNG</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Full XVA Stack — CVA·DVA·FVA·KVA·MVA·ColVA</span>
          <span style={{ background: T.teal + '22', color: T.teal, border: `1px solid ${T.teal}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>PFE 95/99 · Netting Sets · Rating Migration</span>
          <span style={{ background: T.gold + '33', color: T.amber, border: `1px solid ${T.gold}66`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Transition-Risk PD Overlay</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 16, maxWidth: 1050 }}>
        Contract-level XVA on a long-dated PPA. Merchant prices evolve on a deterministic recombining CRR binomial
        lattice; at every node the contract is marked to market, giving EE/ENE and exact-lattice PFE 95/99 profiles.
        CVA = Σ EE_t × marginal PD_t × (1−R) × DF_t from a hand-authored PD table (or a rating-migration matrix —
        both shown); FVA on the residual funded exposure, KVA via an SA-CCR-style capital proxy (real Basel α = 1.4,
        CRE52 electricity SF 40%), MVA on initial margin, ColVA on the expected collateral balance. CSA depth:
        threshold/MTA/rounding, one-way vs two-way, collateral haircuts, MPR sensitivity. Sustainability overlay:
        counterparty transition score → labeled PD multiplier + renewable merit-order WWR channel.
      </div>

      {/* ── Inputs ──────────────────────────────────────────────────────── */}
      <div style={secCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={h2s}>Contract, Lattice, Credit, CSA & XVA Economics</h2>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Editable defaults — hand-authored illustrative terms</span>
          <button onClick={run} style={{
            marginLeft: 'auto', background: T.navy, color: '#fff', border: 'none', borderRadius: 8,
            padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
          }}>
            Compute XVA stack →
          </button>
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 8px' }}>Contract & lattice</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <Fld label="PPA fixed price ($/MWh)"><input type="number" style={inputStyle} value={inp.fixed_price_usd_mwh} onChange={(e) => set('fixed_price_usd_mwh', e.target.value)} /></Fld>
          <Fld label="Annual volume (MWh)"><input type="number" style={inputStyle} value={inp.annual_volume_mwh} onChange={(e) => set('annual_volume_mwh', e.target.value)} /></Fld>
          <Fld label="Tenor (years, 1–30)"><input type="number" min="1" max="30" style={inputStyle} value={inp.tenor_years} onChange={(e) => set('tenor_years', e.target.value)} /></Fld>
          <Fld label="Exposure holder" hint="Generator receives fixed; offtaker pays fixed">
            <select style={inputStyle} value={inp.holder} onChange={(e) => set('holder', e.target.value)}>
              <option value="generator">Generator (fixed receiver)</option>
              <option value="offtaker">Offtaker (fixed payer)</option>
            </select>
          </Fld>
          <Fld label="Current merchant price ($/MWh)"><input type="number" style={inputStyle} value={inp.current_merchant_price_usd_mwh} onChange={(e) => set('current_merchant_price_usd_mwh', e.target.value)} /></Fld>
          <Fld label="Annual drift (%)"><input type="number" step="0.5" style={inputStyle} value={inp.annual_drift_pct} onChange={(e) => set('annual_drift_pct', e.target.value)} /></Fld>
          <Fld label="Annual volatility (%)"><input type="number" step="1" style={inputStyle} value={inp.annual_vol_pct} onChange={(e) => set('annual_vol_pct', e.target.value)} /></Fld>
          <Fld label="Discount rate (%)"><input type="number" step="0.25" style={inputStyle} value={inp.discount_rate_pct} onChange={(e) => set('discount_rate_pct', e.target.value)} /></Fld>
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 8px' }}>Credit curves</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <Fld label="Counterparty rating">
            <select style={inputStyle} value={inp.counterparty_rating} onChange={(e) => set('counterparty_rating', e.target.value)}>
              {RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Fld>
          <Fld label="Own rating (DVA leg)">
            <select style={inputStyle} value={inp.own_rating} onChange={(e) => set('own_rating', e.target.value)}>
              {RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Fld>
          <Fld label="Counterparty recovery rate" hint="LGD = 1 − R"><input type="number" step="0.05" min="0" max="1" style={inputStyle} value={inp.recovery_rate} onChange={(e) => set('recovery_rate', e.target.value)} /></Fld>
          <Fld label="Own recovery rate"><input type="number" step="0.05" min="0" max="1" style={inputStyle} value={inp.own_recovery_rate} onChange={(e) => set('own_recovery_rate', e.target.value)} /></Fld>
          <Fld label="Headline PD basis" hint="Both curves always computed & compared">
            <select style={inputStyle} value={inp.use_rating_transitions ? 'migration' : 'static'} onChange={(e) => set('use_rating_transitions', e.target.value === 'migration')}>
              <option value="static">Static cumulative-PD curve</option>
              <option value="migration">Rating-migration matrix (time-varying)</option>
            </select>
          </Fld>
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 8px' }}>CSA / collateral depth</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <Fld label="CSA type">
            <select style={inputStyle} value={inp.csa_type} onChange={(e) => set('csa_type', e.target.value)}>
              <option value="two_way">Two-way</option>
              <option value="one_way_cpty_posts">One-way — counterparty posts</option>
              <option value="one_way_we_post">One-way — we post (no CVA benefit)</option>
              <option value="none">No CSA</option>
            </select>
          </Fld>
          <Fld label="Threshold ($)"><input type="number" step="500000" style={inputStyle} value={inp.collateral_threshold_usd} onChange={(e) => set('collateral_threshold_usd', e.target.value)} /></Fld>
          <Fld label="Minimum transfer amount ($)" hint="Calls below MTA are waived"><input type="number" step="50000" style={inputStyle} value={inp.mta_usd} onChange={(e) => set('mta_usd', e.target.value)} /></Fld>
          <Fld label="Rounding lot ($)" hint="Calls rounded DOWN to the lot"><input type="number" step="50000" style={inputStyle} value={inp.rounding_usd} onChange={(e) => set('rounding_usd', e.target.value)} /></Fld>
          <Fld label="Margin period of risk (days)"><input type="number" min="0" max="90" style={inputStyle} value={inp.margin_period_days} onChange={(e) => set('margin_period_days', e.target.value)} /></Fld>
          <Fld label="Collateral type" hint="CRE22-style haircut (labeled table)">
            <select style={inputStyle} value={inp.collateral_type} onChange={(e) => set('collateral_type', e.target.value)}>
              <option value="cash">Cash (0%)</option>
              <option value="government_bonds">Government bonds (~2%)</option>
              <option value="corporate_bonds">IG corporate bonds (~6%)</option>
              <option value="equities">Main-index equities (~20%)</option>
            </select>
          </Fld>
          <Fld label="Initial margin ($)" hint="Funds the MVA leg when > 0"><input type="number" step="500000" style={inputStyle} value={inp.initial_margin_usd} onChange={(e) => set('initial_margin_usd', e.target.value)} /></Fld>
          <Fld label="Netting agreement" hint="Qualitative for a single contract">
            <select style={inputStyle} value={inp.netting_agreement ? 'yes' : 'no'} onChange={(e) => set('netting_agreement', e.target.value === 'yes')}>
              <option value="no">No</option><option value="yes">Yes</option>
            </select>
          </Fld>
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 8px' }}>XVA economics (FVA / KVA / MVA / ColVA)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <Fld label="Funding spread (bps)" hint="FVA & MVA driver — FVA is exactly linear in this"><input type="number" step="5" style={inputStyle} value={inp.funding_spread_bps} onChange={(e) => set('funding_spread_bps', e.target.value)} /></Fld>
          <Fld label="Cost of capital (%)" hint="KVA hurdle on regulatory capital"><input type="number" step="0.5" style={inputStyle} value={inp.cost_of_capital_pct} onChange={(e) => set('cost_of_capital_pct', e.target.value)} /></Fld>
          <Fld label="Counterparty risk weight (%)" hint="100% unrated corporate default"><input type="number" step="25" style={inputStyle} value={inp.capital_risk_weight_pct} onChange={(e) => set('capital_risk_weight_pct', e.target.value)} /></Fld>
          <Fld label="ColVA spread (bps)" hint="Collateral remuneration vs OIS"><input type="number" step="5" style={inputStyle} value={inp.colva_spread_bps} onChange={(e) => set('colva_spread_bps', e.target.value)} /></Fld>
          <Fld label="Counterparty is merchant utility" hint="Triggers wrong-way-risk flag">
            <select style={inputStyle} value={inp.counterparty_is_merchant_utility ? 'yes' : 'no'} onChange={(e) => set('counterparty_is_merchant_utility', e.target.value === 'yes')}>
              <option value="yes">Yes</option><option value="no">No</option>
            </select>
          </Fld>
        </div>

        {/* Sustainability × financial + WWR sliders */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 14 }}>
          <Slider label="Wrong-way-risk multiplier" value={inp.wwr_correlation} onChange={(v) => set('wwr_correlation', v)}
            note="MODEL ASSUMPTION (not a calibrated copula): WWR-adjusted CVA scales EE by (1 + multiplier). Set 0 to disable; re-run to apply." />
          <Slider label="RES-output / price correlation ρ" value={inp.res_output_price_correlation} onChange={(v) => set('res_output_price_correlation', v)} color={T.teal}
            note="Renewable merit-order WWR channel: EE multiplier = 1 + 0.5ρ — hand-authored pass-through (labeled). Full ρ sweep charted below." />
          <Slider label="Counterparty transition score" value={inp.counterparty_transition_score} onChange={(v) => set('counterparty_transition_score', v)}
            min={0} max={100} step={5} color={T.green} fmt={(v) => `${Number(v).toFixed(0)}`}
            note="0–100, higher = better prepared. PD multiplier = 1 + (50 − score)/100 — hand-authored labeled mapping; adjusted CVA shown below." />
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      <div style={secCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={h2s}>Exposure Profile, PFE & Valuation Adjustments</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/ppa-xva/cva</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={showColl} onChange={(e) => setShowColl(e.target.checked)} style={{ accentColor: T.teal }} />
              Show collateralised figures
            </label>
            <Badge status={res.status} demoText={res.error} />
          </div>
        </div>

        {res.status === 'live' && d && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label={showColl ? 'CVA (collateralised)' : 'CVA (uncollateralised)'} value={fmt$(cvaShown)} sub={`LGD ${(100 * (1 - parseFloat(inp.recovery_rate))).toFixed(0)}% · ${inp.counterparty_rating} · ${inp.use_rating_transitions ? 'migration' : 'static'} basis`} color={T.red} />
              <Kpi label="DVA (own credit)" value={fmt$(d.dva)} sub={`Own rating ${inp.own_rating}`} color={T.teal} />
              <Kpi label="Net bilateral (CVA − DVA)" value={fmt$(netShown)} sub={showColl ? 'Collateralised basis' : 'Uncollateralised basis'} color={netShown >= 0 ? T.red : T.green} />
              <Kpi label="WWR-adjusted CVA" value={fmt$(d.cva_wwr_adjusted)} sub={`EE × (1 + ${Number(inp.wwr_correlation).toFixed(2)}) — model assumption`} color={T.amber} />
              <Kpi label="Peak EE" value={fmt$M(d.peak_ee)} sub={`Year ${d.peak_ee_year} · time-avg EPE ${fmt$M(d.epe_time_avg)}`} color={T.indigo} />
              <Kpi label="Contract notional" value={fmt$M(d.contract_notional_usd)} sub={`${inp.tenor_years}y × ${fmtNum(inp.annual_volume_mwh, 0)} MWh`} />
            </div>

            {/* PFE KPIs */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="Peak PFE 95" value={fmt$M(d.peak_pfe_95)} sub={`Year ${d.peak_pfe_95_year} — exact lattice quantile`} color={T.purple} />
              <Kpi label="Peak PFE 99" value={fmt$M(d.peak_pfe_99)} sub={`Year ${d.peak_pfe_99_year} · PFE99 ≥ PFE95 by construction`} color={T.red} />
              <Kpi label="PFE 95 @ 1y" value={fmt$M(d.pfe_95_at_1y)} sub="Credit-line tenor point" />
              <Kpi label="PFE 99 @ 1y" value={fmt$M(d.pfe_99_at_1y)} sub="Credit-line tenor point" />
            </div>

            {/* EE + PFE profile chart */}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
              Exposure profile: EE / ENE / PFE 95 / PFE 99 over tenor ($) — engine lattice output, {d.lattice?.steps} annual steps,
              u={d.lattice?.u}, p={d.lattice?.p_up}{d.lattice?.p_clamped ? ' (clamped)' : ''}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={d.ee_profile} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} />
                <Tooltip formatter={(v, n) => [fmt$(v), n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="ee_uncollateralized" name="EE (uncollateralised)" stroke={T.indigo} fill={T.indigo} fillOpacity={0.25} strokeWidth={2} />
                <Area type="monotone" dataKey="ee_collateralized" name="EE (collateralised)" stroke={T.teal} fill={T.teal} fillOpacity={0.3} strokeWidth={2} />
                <Line type="monotone" dataKey="pfe_95" name="PFE 95" stroke={T.purple} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="pfe_99" name="PFE 99" stroke={T.red} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ene" name="ENE (DVA leg)" stroke={T.amber} strokeWidth={2} strokeDasharray="5 3" dot={false} />
                <ReferenceLine y={parseFloat(inp.collateral_threshold_usd)} stroke={T.slate} strokeDasharray="4 4" label={{ value: 'CSA threshold', fontSize: 10, fill: T.slate }} />
              </ComposedChart>
            </ResponsiveContainer>

            {/* XVA stack waterfall */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 16 }}>
              <div style={{ flex: 1.3, minWidth: 380 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                  Total XVA stack waterfall ($) — CVA − DVA + FVA + KVA + MVA + ColVA (engine output)
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={waterfallChart} margin={{ bottom: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="component" tick={{ fontSize: 10 }} interval={0} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
                    <Tooltip formatter={(v, n, pt) => [`${fmt$(v)} — ${pt?.payload?.note || ''}`, pt?.payload?.component]} />
                    <ReferenceLine y={0} stroke={T.slate} />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                      {waterfallChart.map((w, i) => <Cell key={i} fill={w.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 300 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>XVA components</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td style={td}>FVA (FCA − FBA)</td><td style={{ ...td, fontFamily: T.mono, fontWeight: 700, textAlign: 'right' }}>{fmt$(d.fva)}</td></tr>
                    <tr><td style={td}>· FCA (funded residual EE)</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmt$(d.fca)}</td></tr>
                    <tr><td style={td}>· FBA (ENE benefit)</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmt$(d.fba)}</td></tr>
                    <tr><td style={td}>KVA — SA-CCR-style proxy (α = {d.kva_detail?.alpha}, SF elec {d.kva_detail?.supervisory_factor_electricity_pct}%)</td><td style={{ ...td, fontFamily: T.mono, fontWeight: 700, textAlign: 'right' }}>{fmt$(d.kva)}</td></tr>
                    <tr><td style={td}>MVA (IM funding)</td><td style={{ ...td, fontFamily: T.mono, fontWeight: 700, textAlign: 'right' }}>{fmt$(d.mva)}</td></tr>
                    <tr><td style={td}>ColVA ({fmtNum(inp.colva_spread_bps, 0)}bp remuneration spread)</td><td style={{ ...td, fontFamily: T.mono, fontWeight: 700, textAlign: 'right' }}>{fmt$(d.colva)}</td></tr>
                    <tr><td style={{ ...td, fontWeight: 800, color: T.navy }}>Total XVA</td><td style={{ ...td, fontFamily: T.mono, fontWeight: 800, textAlign: 'right', color: T.navy }}>{fmt$(d.total_xva)}</td></tr>
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 8 }}>{d.mva_note}</div>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>{d.kva_detail?.label}</div>
              </div>
            </div>

            {/* CSA depth: terms + MPR sensitivity */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 16 }}>
              <div style={{ flex: 1, minWidth: 300, background: T.cream, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 8 }}>CSA terms in force</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td style={td}>Type</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{d.csa_terms?.csa_type}</td></tr>
                    <tr><td style={td}>Threshold / MTA / rounding</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmt$M(d.csa_terms?.threshold_usd)} / {fmt$(d.csa_terms?.mta_usd)} / {fmt$(d.csa_terms?.rounding_usd)}</td></tr>
                    <tr><td style={td}>Collateral (haircut)</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{d.csa_terms?.collateral_type} ({fmtPct(d.csa_terms?.haircut_pct, 1)})</td></tr>
                    <tr><td style={td}>MPR / IM</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{d.csa_terms?.margin_period_days}d / {fmt$(d.csa_terms?.initial_margin_usd)}</td></tr>
                    <tr><td style={td}>CVA uncoll → coll</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right', color: T.teal }}>{fmt$(d.cva_uncollateralized)} → {fmt$(d.cva_collateralized)} ({fmtPct(collReductionPct, 1)} saved)</td></tr>
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>{d.csa_terms?.note}</div>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>{d.collateral_haircut_note}</div>
              </div>
              <div style={{ flex: 1, minWidth: 300, background: T.cream, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 8 }}>Margin-period-of-risk sensitivity (collateralised CVA)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>MPR (days)</th><th style={{ ...th, textAlign: 'right' }}>CVA coll</th><th style={{ ...th, textAlign: 'right' }}>Δ vs base ({inp.margin_period_days}d)</th></tr></thead>
                  <tbody>
                    {(d.mpr_sensitivity || []).map((m) => (
                      <tr key={m.mpr_days}>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{m.mpr_days}</td>
                        <td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmt$(m.cva_collateralized)}</td>
                        <td style={{ ...td, fontFamily: T.mono, textAlign: 'right', color: m.delta_vs_base > 0 ? T.red : T.green }}>{fmt$(m.delta_vs_base)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
                  Longer MPR → larger σ√(MPR) add-on survives collateralisation → higher residual CVA (labeled approximation).
                </div>
              </div>
            </div>

            {/* Rating transitions */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 16 }}>
              <div style={{ flex: 1.3, minWidth: 380 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                  Cumulative PD — static curve vs rating-migration matrix ({inp.counterparty_rating} start, engine output)
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={d.rating_transition?.curve_comparison || []} margin={{ bottom: 5, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} />
                    <Tooltip formatter={(v, n) => [fmtPct(v * 100, 3), n]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="cum_pd_static" name="Static curve" stroke={T.indigo} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="cum_pd_migration" name="Migration matrix" stroke={T.red} strokeWidth={2} strokeDasharray="5 3" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 300, background: T.cream, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 8 }}>
                  CVA: static vs migration basis {d.rating_transition?.drives_headline ? '(migration drives headline)' : '(static drives headline)'}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td style={td}>CVA uncoll — static</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmt$(d.rating_transition?.cva_uncoll_static)}</td></tr>
                    <tr><td style={td}>CVA uncoll — migration</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmt$(d.rating_transition?.cva_uncoll_migration)}</td></tr>
                    <tr><td style={td}>CVA coll — static</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmt$(d.rating_transition?.cva_coll_static)}</td></tr>
                    <tr><td style={td}>CVA coll — migration</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmt$(d.rating_transition?.cva_coll_migration)}</td></tr>
                    <tr><td style={{ ...td, fontWeight: 700 }}>Δ migration vs static (uncoll)</td><td style={{ ...td, fontFamily: T.mono, fontWeight: 700, textAlign: 'right', color: (d.rating_transition?.delta_migration_vs_static_uncoll || 0) > 0 ? T.red : T.green }}>{fmt$(d.rating_transition?.delta_migration_vs_static_uncoll)}</td></tr>
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>{d.rating_transition?.label}</div>
              </div>
            </div>

            {/* Sustainability × financial */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 16 }}>
              <div style={{ flex: 1, minWidth: 320, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.green, marginBottom: 8 }}>Transition-risk PD adjustment (labeled mapping)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td style={td}>Transition score → PD multiplier</td><td style={{ ...td, fontFamily: T.mono, fontWeight: 700, textAlign: 'right' }}>{fmtNum(d.transition_risk_adjustment?.counterparty_transition_score, 0)} → {fmtNum(d.transition_risk_adjustment?.pd_multiplier, 2)}×</td></tr>
                    <tr><td style={td}>CVA uncoll adjusted</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmt$(d.transition_risk_adjustment?.cva_uncollateralized_adjusted)}</td></tr>
                    <tr><td style={td}>CVA coll adjusted</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmt$(d.transition_risk_adjustment?.cva_collateralized_adjusted)}</td></tr>
                    <tr><td style={{ ...td, fontWeight: 700 }}>Δ vs base</td><td style={{ ...td, fontFamily: T.mono, fontWeight: 700, textAlign: 'right', color: (d.transition_risk_adjustment?.delta_vs_base_usd || 0) > 0 ? T.red : T.green }}>{fmt$(d.transition_risk_adjustment?.delta_vs_base_usd)}</td></tr>
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>{d.transition_risk_adjustment?.mapping}</div>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>{d.transition_risk_adjustment?.label}</div>
              </div>
              <div style={{ flex: 1.2, minWidth: 360 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                  Renewable merit-order WWR: CVA vs RES-output/price correlation ρ (engine sweep — EE × (1 + 0.5ρ), labeled)
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={d.renewable_wwr?.sweep || []} margin={{ bottom: 15, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="rho" tick={{ fontSize: 10 }} label={{ value: 'ρ (RES output vs price)', position: 'insideBottom', offset: -6, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
                    <Tooltip formatter={(v, n) => [fmt$(v), 'CVA (RES-WWR adjusted)']} />
                    <ReferenceLine x={parseFloat(inp.res_output_price_correlation)} stroke={T.teal} strokeDasharray="4 4" label={{ value: `your ρ ${Number(inp.res_output_price_correlation).toFixed(2)}`, fontSize: 10, fill: T.teal }} />
                    <Line type="monotone" dataKey="cva" stroke={T.teal} strokeWidth={2} dot={{ r: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 10.5, color: T.sub }}>
                  {d.renewable_wwr?.narrative} At ρ = {fmtNum(d.renewable_wwr?.res_output_price_correlation, 2)}: CVA {fmt$(d.cva_uncollateralized)} → {fmt$(d.renewable_wwr?.cva_res_wwr_adjusted)}.
                </div>
              </div>
            </div>

            {/* Green CSA + WWR flag */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 14 }}>
              <div style={{ flex: 1, minWidth: 300, ...noteBox }}>
                <b>Green CSA panel:</b> {d.green_csa_note}
              </div>
              <div style={{ flex: 1, minWidth: 300, background: d.wrong_way_risk_flag ? '#fef2f2' : T.cream, border: `1px solid ${d.wrong_way_risk_flag ? '#fecaca' : T.border}`, borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: d.wrong_way_risk_flag ? T.red : T.navy, marginBottom: 6 }}>
                  {d.wrong_way_risk_flag ? '⚠ Wrong-way risk flagged' : 'Wrong-way risk not structural here'}
                </div>
                <div style={{ fontSize: 11, color: T.slate }}>{d.wrong_way_risk_note}</div>
              </div>
            </div>

            {/* EE table (inspectable, period-by-period) */}
            <div style={{ marginTop: 16, overflowX: 'auto' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Period-by-period exposure & credit inputs (engine output — inspectable)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Year</th><th style={th}>Nodes</th><th style={th}>Price range ($/MWh)</th><th style={th}>E[price]</th>
                    <th style={th}>EE uncoll</th><th style={th}>EE coll</th><th style={th}>PFE 95</th><th style={th}>PFE 99</th><th style={th}>E[coll]</th><th style={th}>ENE</th>
                    <th style={th}>Cum PD stat</th><th style={th}>Cum PD mig</th><th style={th}>DF</th>
                  </tr>
                </thead>
                <tbody>
                  {d.ee_profile.map((p) => (
                    <tr key={p.year}>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{p.year}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{p.lattice_nodes}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(p.price_low, 1)} – {fmtNum(p.price_high, 1)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(p.expected_price, 1)}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: T.indigo }}>{fmt$(p.ee_uncollateralized)}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: T.teal }}>{fmt$(p.ee_collateralized)}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: T.purple }}>{fmt$(p.pfe_95)}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: T.red }}>{fmt$(p.pfe_99)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmt$(p.expected_collateral)}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: T.amber }}>{fmt$(p.ene)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(p.cumulative_pd_cpty * 100, 3)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(p.cumulative_pd_cpty_migration * 100, 3)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(p.discount_factor, 4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 12, fontSize: 10.5, color: T.sub }}>
              {d.method_notes.map((m, i) => <div key={i}>• {m}</div>)}
            </div>
          </>
        )}
        {res.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>XVA engine unreachable — no figures shown (this page never fabricates results). Error: {String(res.error)}</div>}
        {res.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Set the contract, lattice, credit, CSA and XVA-economics terms above, then compute. The full lattice method is documented in the engine and summarised in the results.</div>}
      </div>

      {/* ── Netting-set analyzer ─────────────────────────────────────────── */}
      <div style={secCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={h2s}>Netting-Set Analyzer — 2-3 PPAs, Same Counterparty</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/ppa-xva/netting</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <Badge status={netRes.status} demoText={netRes.error} />
            <button onClick={runNetting} style={{ background: T.teal, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: T.font }}>
              Analyse netting set →
            </button>
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10 }}>
          All contracts marked on the SAME merchant-price lattice (single price factor — documented). Opposing
          directions (generator vs offtaker legs) maximise offset. Net EE ≤ gross EE at every period is a node-wise
          identity, asserted at runtime in the engine; netting benefit ∈ [0, 100%] by construction. Lattice/credit
          terms are shared with the single-contract inputs above.
        </div>
        <div style={{ overflowX: 'auto', marginBottom: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><th style={th}>Contract</th><th style={th}>Fixed price ($/MWh)</th><th style={th}>Volume (MWh/yr)</th><th style={th}>Tenor (y)</th><th style={th}>Our side</th><th style={{ ...th, width: 50 }} /></tr>
            </thead>
            <tbody>
              {netContracts.map((c, i) => (
                <tr key={i}>
                  <td style={td}><input style={{ ...inputStyle, minWidth: 160 }} value={c.label} onChange={(e) => setContract(i, 'label', e.target.value)} /></td>
                  <td style={td}><input type="number" style={{ ...inputStyle, width: 90 }} value={c.fixed_price_usd_mwh} onChange={(e) => setContract(i, 'fixed_price_usd_mwh', e.target.value)} /></td>
                  <td style={td}><input type="number" style={{ ...inputStyle, width: 110 }} value={c.annual_volume_mwh} onChange={(e) => setContract(i, 'annual_volume_mwh', e.target.value)} /></td>
                  <td style={td}><input type="number" min="1" max="30" style={{ ...inputStyle, width: 60 }} value={c.tenor_years} onChange={(e) => setContract(i, 'tenor_years', e.target.value)} /></td>
                  <td style={td}>
                    <select style={{ ...inputStyle, width: 170 }} value={c.holder} onChange={(e) => setContract(i, 'holder', e.target.value)}>
                      <option value="generator">Generator (receive fixed)</option>
                      <option value="offtaker">Offtaker (pay fixed)</option>
                    </select>
                  </td>
                  <td style={td}>
                    {netContracts.length > 2 && (
                      <button onClick={() => removeContract(i)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.red, cursor: 'pointer', fontSize: 11, padding: '3px 7px' }}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {netContracts.length < 3 && (
          <button onClick={addContract} style={{ background: 'transparent', border: `1px dashed ${T.navy}66`, borderRadius: 8, color: T.navy, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '6px 14px', marginBottom: 12 }}>
            + Add third contract
          </button>
        )}
        {netRes.status === 'live' && netRes.data && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="CVA — gross (no netting)" value={fmt$(netRes.data.cva_gross)} color={T.red} />
              <Kpi label="CVA — netted" value={fmt$(netRes.data.cva_net)} color={T.teal} />
              <Kpi label="Netting benefit" value={fmtPct(netRes.data.netting_benefit_pct, 2)} sub="1 − CVA_net/CVA_gross ∈ [0,100%]" color={T.green} />
              <Kpi label="Peak gross EE" value={fmt$M(netRes.data.peak_gross_ee)} />
              <Kpi label="Peak net EE" value={fmt$M(netRes.data.peak_net_ee)} sub="≤ gross at every period (asserted)" />
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.4, minWidth: 380 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Netted vs gross EE by period ($) — engine output</div>
                <ResponsiveContainer width="100%" height={230}>
                  <ComposedChart data={netRes.data.profile} margin={{ bottom: 5, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} />
                    <Tooltip formatter={(v, n) => [fmt$(v), n]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="gross_ee" name="Gross EE" stroke={T.red} fill={T.red} fillOpacity={0.18} strokeWidth={2} />
                    <Area type="monotone" dataKey="net_ee" name="Net EE" stroke={T.teal} fill={T.teal} fillOpacity={0.3} strokeWidth={2} />
                    <Line type="monotone" dataKey="netting_benefit_pct" name="Benefit % (right)" yAxisId="pct" stroke={T.purple} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                    <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Standalone CVA per contract</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Contract</th><th style={th}>Side</th><th style={{ ...th, textAlign: 'right' }}>Standalone CVA</th></tr></thead>
                  <tbody>
                    {netRes.data.standalone_cva.map((c, i) => (
                      <tr key={i}>
                        <td style={td}>{c.label}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{c.holder}</td>
                        <td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmt$(c.cva)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 8 }}>
                  {netRes.data.method_notes.map((m, i) => <div key={i}>• {m}</div>)}
                </div>
              </div>
            </div>
          </>
        )}
        {netRes.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Netting engine unreachable — no figures shown. Error: {String(netRes.error)}</div>}
        {netRes.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Edit the 2-3 contracts above (opposing directions allowed) and run — the engine returns netted vs gross EE per period, standalone CVAs and the netting benefit.</div>}
      </div>

      {/* ── PD curve table + migration matrix + PPA counterparty scores ──── */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 18 }}>
        <div style={{ flex: 2, minWidth: 380, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <h2 style={h2s}>Rating-Based Cumulative PD Table</h2>
            <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/ppa-xva/ref/pd-curves</span>
            <div style={{ marginLeft: 'auto' }}><Badge status={pdRef.status} demoText={pdRef.error} /></div>
          </div>
          {pdRef.status === 'live' && pdRef.data && (
            <>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>{pdRef.data.label}</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>Rating</th>
                      {pdRef.data.tenors_years.map((t) => <th key={t} style={{ ...th, textAlign: 'right' }}>{t}y</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(pdRef.data.cumulative_pd_pct).map(([rating, row]) => (
                      <tr key={rating} style={rating === inp.counterparty_rating ? { background: T.indigo + '11' } : undefined}>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: T.navy }}>{rating}{rating === inp.counterparty_rating ? ' ◂' : ''}</td>
                        {row.map((v, i) => <td key={i} style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmtNum(v, 2)}%</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>Interpolation: {pdRef.data.interpolation}</div>
            </>
          )}
          {pdRef.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>PD reference unavailable. Error: {String(pdRef.error)}</div>}

          {/* Migration matrix */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 10px', flexWrap: 'wrap' }}>
            <h2 style={h2s}>Annual Rating-Migration Matrix</h2>
            <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/ppa-xva/ref/migration-matrix</span>
            <div style={{ marginLeft: 'auto' }}><Badge status={migRef.status} demoText={migRef.error} /></div>
          </div>
          {migRef.status === 'live' && migRef.data && (
            <>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>{migRef.data.label}</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>From \ To</th>
                      {migRef.data.states.map((s) => <th key={s} style={{ ...th, textAlign: 'right' }}>{s}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {migRef.data.states.filter((s) => s !== 'D').map((from) => (
                      <tr key={from} style={from === inp.counterparty_rating ? { background: T.red + '0d' } : undefined}>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: T.navy }}>{from}{from === inp.counterparty_rating ? ' ◂' : ''}</td>
                        {migRef.data.annual_transition_pct[from].map((v, i) => (
                          <td key={i} style={{ ...td, fontFamily: T.mono, textAlign: 'right', color: migRef.data.states[i] === 'D' ? T.red : T.slate, fontWeight: migRef.data.states[i] === from ? 700 : 400 }}>{fmtNum(v, 2)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>{migRef.data.usage}</div>
            </>
          )}
          {migRef.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Migration-matrix reference unavailable. Error: {String(migRef.error)}</div>}
        </div>

        <div style={{ flex: 1, minWidth: 280, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <h2 style={h2s}>PPA Counterparty Risk Scores</h2>
            <div style={{ marginLeft: 'auto' }}><Badge status={ppaScores.status} demoText={ppaScores.error} /></div>
          </div>
          <div style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px', display: 'inline-block', marginBottom: 8 }}>GET /api/v1/renewable-ppa/ref/credit-ratings</div>
          {ppaScores.status === 'live' && ppaScores.data && (
            <>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>
                Counterparty risk scores (0–100, higher = riskier) from the wired renewable-PPA risk engine —
                the same scale its bankability scoring uses. Composed for cross-reference, not re-derived here.
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={Object.entries(ppaScores.data).map(([k, v]) => ({ rating: k, score: v }))} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <YAxis type="category" dataKey="rating" tick={{ fontSize: 10, fontFamily: T.mono }} width={80} />
                  <Tooltip formatter={(v) => [v, 'PPA risk score']} />
                  <Bar dataKey="score" radius={[0, 3, 3, 0]}>
                    {Object.entries(ppaScores.data).map(([k], i) => (
                      <Cell key={i} fill={k === inp.counterparty_rating ? T.indigo : T.gold} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
          {ppaScores.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Renewable-PPA reference unavailable. Error: {String(ppaScores.error)}</div>}
        </div>
      </div>

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
        Engine: api/v1/routes/ppa_xva.py — deterministic recombining CRR binomial lattice (no PRNG), hand-authored
        rating-agency-study PD table + annual migration matrix (approximate, shown above), full XVA stack
        CVA − DVA + FVA + KVA + MVA + ColVA with the real Basel SA-CCR α = 1.4 and CRE52 electricity SF (labeled
        proxy), exact-lattice PFE 95/99, CSA threshold/MTA/rounding/haircut/MPR depth, netting-set net-vs-gross EE
        with runtime-asserted invariants, and labeled sustainability overlays (transition-score PD multiplier,
        merit-order RES WWR). Counterparty scores composed from the wired renewable-PPA engine. Nothing on this
        page is fabricated client-side.
      </div>
    </div>
  );
}
