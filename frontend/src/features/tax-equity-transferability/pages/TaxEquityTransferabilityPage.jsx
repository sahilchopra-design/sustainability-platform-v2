import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine, BarChart, Cell,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Tax Equity & Transferability (NX2-13)
// US IRA monetization: partnership-flip solver (target-IRR flip timing,
// pre/post-flip allocations, MACRS/bonus/straight-line depreciation, real
// IRC §48/§45 credit parameters), §50 recapture & DRO/§704(b) capital-account
// tracking, §6418 transfer-market depth, sale-leaseback & inverted-lease
// structure menu, and a sustainability overlay ($/tCO2e of the tax subsidy).
// Live engines:
//   1. POST /api/v1/tax-equity/flip                 (year-by-year flip solver + depth blocks)
//   2. POST /api/v1/tax-equity/structures           (flip vs sale-leaseback vs inverted lease)
//   3. GET  /api/v1/tax-equity/ref/ira-parameters   (real IRA constants, labeled)
//   4. GET  /api/v1/tax-equity/ref/transfer-market  (hand-authored §6418 pricing table)
//   5. GET  /api/v1/tax-equity/ref/adder-checklists (real adder criteria, summarized)
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

const fmtM = (v, d = 2) => (v == null || isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: d })}M`;
const fmtNum = (v, d = 2) => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });
const fmtPct = (v, d = 2) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}%`;

const Badge = ({ status, demoText }) => {
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live</span>;
  if (status === 'loading') return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Calling engine</span>;
  if (status === 'demo') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Demo{demoText ? ` — ${demoText}` : ' — engine unavailable'}</span>;
  return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Idle — run solver</span>;
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
const groupLabel = { fontSize: 11, fontWeight: 800, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 8px' };

const Fld = ({ label, children, hint }) => (
  <label style={{ display: 'block', fontSize: 11, color: T.sub, fontWeight: 600 }}>
    <div style={{ marginBottom: 3 }}>{label}</div>
    {children}
    {hint && <div style={{ fontSize: 10, color: T.sub, fontWeight: 400, marginTop: 2 }}>{hint}</div>}
  </label>
);

const Chk = ({ label, checked, onChange, hint }) => (
  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: T.slate, fontWeight: 600, cursor: 'pointer' }}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: T.navy, marginTop: 2 }} />
    <span>{label}{hint && <div style={{ fontSize: 10, color: T.sub, fontWeight: 400 }}>{hint}</div>}</span>
  </label>
);

export default function TaxEquityTransferabilityPage() {
  const [inp, setInp] = useState({
    capex_musd: 180, itc_eligible_pct: 95, credit_mode: 'itc',
    prevailing_wage_met: true, energy_community: false, domestic_content: false,
    ptc_rate_usd_mwh: 27.5, ptc_inflation_pct: 2.0,
    annual_generation_mwh: 420000, use_p90_generation: false, p90_factor: 0.88,
    ppa_price_usd_mwh: 48, revenue_escalation_pct: 1.5,
    annual_opex_musd: 3.2, opex_escalation_pct: 2.0, tax_rate_pct: 21,
    depreciation_method: 'macrs_5yr', placed_in_service_year: 2026,
    apply_obbba_100pct_bonus: false, straight_line_years: 12,
    subsidy_discount_rate_pct: 7.0,
    te_target_irr_pct: 7.5, te_investment_pct_of_capex: 40,
    preflip_te_alloc_pct: 99, postflip_te_alloc_pct: 5, analysis_years: 20,
    dro_cap_pct_of_investment: 25, disposition_year: '',
    transfer_price_per_dollar: 0.92, insurance_wrap_pct_of_credit: 1.25,
    hybrid_transfer_pct: 25, grid_intensity_tco2_mwh: 0.38,
    slb_fmv_stepup_pct: 15, inverted_strip_pct: 5, inverted_lease_term_years: 7,
  });
  const set = (k, v) => setInp((p) => ({ ...p, [k]: v }));

  const [res, setRes] = useState({ status: 'idle', data: null, error: null });
  const [structRes, setStructRes] = useState({ status: 'idle', data: null, error: null });
  const [ira, setIra] = useState({ status: 'loading', data: null, error: null });
  const [checklists, setChecklists] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    axios.get('/api/v1/tax-equity/ref/ira-parameters', { timeout: 15000 })
      .then(({ data }) => setIra({ status: 'live', data, error: null }))
      .catch((e) => setIra({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }));
    axios.get('/api/v1/tax-equity/ref/adder-checklists', { timeout: 15000 })
      .then(({ data }) => setChecklists({ status: 'live', data, error: null }))
      .catch((e) => setChecklists({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }));
  }, []);

  const buildPayload = useCallback(() => ({
    ...inp,
    capex_musd: parseFloat(inp.capex_musd),
    itc_eligible_pct: parseFloat(inp.itc_eligible_pct),
    ptc_rate_usd_mwh: parseFloat(inp.ptc_rate_usd_mwh),
    ptc_inflation_pct: parseFloat(inp.ptc_inflation_pct),
    annual_generation_mwh: parseFloat(inp.annual_generation_mwh),
    p90_factor: parseFloat(inp.p90_factor),
    ppa_price_usd_mwh: parseFloat(inp.ppa_price_usd_mwh),
    revenue_escalation_pct: parseFloat(inp.revenue_escalation_pct),
    annual_opex_musd: parseFloat(inp.annual_opex_musd),
    opex_escalation_pct: parseFloat(inp.opex_escalation_pct),
    tax_rate_pct: parseFloat(inp.tax_rate_pct),
    placed_in_service_year: parseInt(inp.placed_in_service_year, 10),
    straight_line_years: parseInt(inp.straight_line_years, 10),
    subsidy_discount_rate_pct: parseFloat(inp.subsidy_discount_rate_pct),
    te_target_irr_pct: parseFloat(inp.te_target_irr_pct),
    te_investment_pct_of_capex: parseFloat(inp.te_investment_pct_of_capex),
    preflip_te_alloc_pct: parseFloat(inp.preflip_te_alloc_pct),
    postflip_te_alloc_pct: parseFloat(inp.postflip_te_alloc_pct),
    analysis_years: parseInt(inp.analysis_years, 10),
    dro_cap_pct_of_investment: parseFloat(inp.dro_cap_pct_of_investment),
    disposition_year: inp.disposition_year === '' ? null : parseInt(inp.disposition_year, 10),
    transfer_price_per_dollar: parseFloat(inp.transfer_price_per_dollar),
    insurance_wrap_pct_of_credit: parseFloat(inp.insurance_wrap_pct_of_credit),
    hybrid_transfer_pct: parseFloat(inp.hybrid_transfer_pct),
    grid_intensity_tco2_mwh: parseFloat(inp.grid_intensity_tco2_mwh),
    slb_fmv_stepup_pct: parseFloat(inp.slb_fmv_stepup_pct),
    inverted_strip_pct: parseFloat(inp.inverted_strip_pct),
    inverted_lease_term_years: parseInt(inp.inverted_lease_term_years, 10),
  }), [inp]);

  const run = useCallback(async () => {
    setRes({ status: 'loading', data: null, error: null });
    try {
      const { data } = await axios.post('/api/v1/tax-equity/flip', buildPayload(), { timeout: 30000 });
      setRes({ status: 'live', data, error: null });
    } catch (e) {
      setRes({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
    }
  }, [buildPayload]);

  const runStructures = useCallback(async () => {
    setStructRes({ status: 'loading', data: null, error: null });
    try {
      const { data } = await axios.post('/api/v1/tax-equity/structures', buildPayload(), { timeout: 30000 });
      setStructRes({ status: 'live', data, error: null });
    } catch (e) {
      setStructRes({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
    }
  }, [buildPayload]);

  const d = res.data;
  const s = structRes.data;
  const isItc = inp.credit_mode === 'itc';
  const modeBtn = (active) => ({
    flex: 1, padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
    fontFamily: T.font, border: `1px solid ${active ? T.navy : T.border}`,
    background: active ? T.navy : '#fff', color: active ? '#fff' : T.slate,
  });

  const depMethods = d?.depreciation_comparison?.methods;
  const depBars = depMethods ? [
    { name: 'Bonus §168(k)', npv: depMethods.bonus.npv_tax_shield_musd, yr1: depMethods.bonus.year1_pct_of_basis, fill: T.purple },
    { name: 'MACRS 5-yr', npv: depMethods.macrs_5yr.npv_tax_shield_musd, yr1: depMethods.macrs_5yr.year1_pct_of_basis, fill: T.indigo },
    { name: 'Straight-line', npv: depMethods.straight_line.npv_tax_shield_musd, yr1: depMethods.straight_line.year1_pct_of_basis, fill: T.slate },
  ] : [];

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.green, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>NX2-13</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Tax Equity & Transferability</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>IRC §48 / §45 Credits</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Flip · Sale-Leaseback · Inverted Lease</span>
          <span style={{ background: T.red + '18', color: T.red, border: `1px solid ${T.red}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>§50 Recapture · DRO · §704(b)</span>
          <span style={{ background: T.gold + '33', color: T.amber, border: `1px solid ${T.gold}66`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>§6418 Transfer Market · $/tCO2e</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 16, maxWidth: 1050 }}>
        US IRA monetization economics: the engine builds the after-tax cash + tax-benefit allocation year by year
        (MACRS 5-yr / §168(k) bonus phase-down / straight-line, ITC basis reduced by 50% per §50(c)(3)), solves the
        flip year, tracks the §704(b) capital account against the DRO cap, prices §50(a)(1) recapture scenarios,
        and compares monetization routes: flip vs §6418 transfer (with a hand-authored size/vintage discount table,
        insurance wrap, forward-vs-spot and a re-solved hybrid) vs sale-leaseback vs inverted lease — each with the
        effective $/tCO2e of the federal tax subsidy at your grid intensity.
      </div>

      {/* ── Inputs ──────────────────────────────────────────────────────── */}
      <div style={secCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={h2s}>Structure Inputs</h2>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Editable defaults — hand-authored illustrative project</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={run} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font }}>
              Solve flip & compare →
            </button>
            <button onClick={runStructures} disabled={!isItc} title={isItc ? '' : 'Structure menu models ITC structures — switch to ITC'} style={{ background: isItc ? T.purple : T.border, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: isItc ? 'pointer' : 'not-allowed', fontFamily: T.font }}>
              Structure menu →
            </button>
          </div>
        </div>

        {/* Credit mode toggle */}
        <div style={{ display: 'flex', gap: 8, maxWidth: 460, marginBottom: 14 }}>
          <button style={modeBtn(isItc)} onClick={() => set('credit_mode', 'itc')}>ITC — §48 investment credit</button>
          <button style={modeBtn(!isItc)} onClick={() => set('credit_mode', 'ptc')}>PTC — §45 production credit (10y)</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <Fld label="Capex ($M)"><input type="number" style={inputStyle} value={inp.capex_musd} onChange={(e) => set('capex_musd', e.target.value)} /></Fld>
          {isItc && <Fld label="ITC-eligible basis (% of capex)"><input type="number" min="0" max="100" style={inputStyle} value={inp.itc_eligible_pct} onChange={(e) => set('itc_eligible_pct', e.target.value)} /></Fld>}
          {!isItc && <Fld label="PTC rate ($/MWh)" hint="2024 IRS published rate 27.50 with PWA"><input type="number" step="0.5" style={inputStyle} value={inp.ptc_rate_usd_mwh} onChange={(e) => set('ptc_rate_usd_mwh', e.target.value)} /></Fld>}
          {!isItc && <Fld label="PTC inflation adj (%/yr)"><input type="number" step="0.25" style={inputStyle} value={inp.ptc_inflation_pct} onChange={(e) => set('ptc_inflation_pct', e.target.value)} /></Fld>}
          <Fld label="P50 generation (MWh/yr)"><input type="number" style={inputStyle} value={inp.annual_generation_mwh} onChange={(e) => set('annual_generation_mwh', e.target.value)} /></Fld>
          <Fld label="PPA price ($/MWh)"><input type="number" style={inputStyle} value={inp.ppa_price_usd_mwh} onChange={(e) => set('ppa_price_usd_mwh', e.target.value)} /></Fld>
          <Fld label="Revenue escalation (%/yr)"><input type="number" step="0.25" style={inputStyle} value={inp.revenue_escalation_pct} onChange={(e) => set('revenue_escalation_pct', e.target.value)} /></Fld>
          <Fld label="Opex ($M/yr)"><input type="number" step="0.1" style={inputStyle} value={inp.annual_opex_musd} onChange={(e) => set('annual_opex_musd', e.target.value)} /></Fld>
          <Fld label="Opex escalation (%/yr)"><input type="number" step="0.25" style={inputStyle} value={inp.opex_escalation_pct} onChange={(e) => set('opex_escalation_pct', e.target.value)} /></Fld>
          <Fld label="Tax rate (%)" hint="21% federal corporate default"><input type="number" step="0.5" style={inputStyle} value={inp.tax_rate_pct} onChange={(e) => set('tax_rate_pct', e.target.value)} /></Fld>
          <Fld label="TE target after-tax IRR (%)"><input type="number" step="0.25" style={inputStyle} value={inp.te_target_irr_pct} onChange={(e) => set('te_target_irr_pct', e.target.value)} /></Fld>
          <Fld label="TE investment (% of capex)"><input type="number" min="1" max="100" style={inputStyle} value={inp.te_investment_pct_of_capex} onChange={(e) => set('te_investment_pct_of_capex', e.target.value)} /></Fld>
          <Fld label="Pre-flip TE allocation (%)" hint="Default 99/1"><input type="number" min="50" max="100" style={inputStyle} value={inp.preflip_te_alloc_pct} onChange={(e) => set('preflip_te_alloc_pct', e.target.value)} /></Fld>
          <Fld label="Post-flip TE allocation (%)" hint="Default 5/95"><input type="number" min="0" max="50" style={inputStyle} value={inp.postflip_te_alloc_pct} onChange={(e) => set('postflip_te_alloc_pct', e.target.value)} /></Fld>
          <Fld label="Analysis horizon (years)"><input type="number" min="6" max="35" style={inputStyle} value={inp.analysis_years} onChange={(e) => set('analysis_years', e.target.value)} /></Fld>
        </div>

        <div style={groupLabel}>Depreciation, tax depth & risk</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <Fld label="Depreciation method" hint="Flows into the flip model + NPV comparison">
            <select style={inputStyle} value={inp.depreciation_method} onChange={(e) => set('depreciation_method', e.target.value)}>
              <option value="macrs_5yr">MACRS 5-yr (§168)</option>
              <option value="bonus">Bonus §168(k) + MACRS remainder</option>
              <option value="straight_line">Straight-line (ADS-style)</option>
            </select>
          </Fld>
          <Fld label="Placed-in-service year" hint="Drives the §168(k) phase-down: 60% '24 / 40% '25 / 20% '26"><input type="number" min="2022" max="2030" style={inputStyle} value={inp.placed_in_service_year} onChange={(e) => set('placed_in_service_year', e.target.value)} /></Fld>
          <Fld label="Straight-line years"><input type="number" min="5" max="30" style={inputStyle} value={inp.straight_line_years} onChange={(e) => set('straight_line_years', e.target.value)} /></Fld>
          <Fld label="Subsidy discount rate (%)" hint="For NPV-of-tax-benefits, PTC PV & $/tCO2e"><input type="number" step="0.25" style={inputStyle} value={inp.subsidy_discount_rate_pct} onChange={(e) => set('subsidy_discount_rate_pct', e.target.value)} /></Fld>
          <Fld label="DRO cap (% of TE investment)" hint="§704(b) deficit-restoration cap — labeled simplification"><input type="number" min="0" max="100" style={inputStyle} value={inp.dro_cap_pct_of_investment} onChange={(e) => set('dro_cap_pct_of_investment', e.target.value)} /></Fld>
          <Fld label="Disposition year (optional)" hint="End-of-year sale → §50(a)(1) recapture scenario"><input type="number" min="1" max="35" style={inputStyle} value={inp.disposition_year} onChange={(e) => set('disposition_year', e.target.value)} placeholder="—" /></Fld>
          <Fld label="P90/P50 factor" hint="Output-risk sensitivity — PTC volume & revenue"><input type="number" step="0.01" min="0.5" max="1" style={inputStyle} value={inp.p90_factor} onChange={(e) => set('p90_factor', e.target.value)} /></Fld>
          <Fld label="Grid intensity (tCO2e/MWh)" hint="Displaced grid — drives $/tCO2e (user input, labeled)"><input type="number" step="0.01" min="0" max="2" style={inputStyle} value={inp.grid_intensity_tco2_mwh} onChange={(e) => set('grid_intensity_tco2_mwh', e.target.value)} /></Fld>
        </div>

        <div style={groupLabel}>Structure-menu terms (sale-leaseback / inverted lease)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <Fld label="SLB FMV step-up (% over capex)" hint="§50(d)(4) 3-month-window FMV sale — ~15% typical, labeled"><input type="number" min="0" max="40" style={inputStyle} value={inp.slb_fmv_stepup_pct} onChange={(e) => set('slb_fmv_stepup_pct', e.target.value)} /></Fld>
          <Fld label="Inverted-lease cash strip (%)" hint="TE-lessee share of pretax cash during term"><input type="number" min="0" max="30" style={inputStyle} value={inp.inverted_strip_pct} onChange={(e) => set('inverted_strip_pct', e.target.value)} /></Fld>
          <Fld label="Inverted-lease term (years)"><input type="number" min="5" max="15" style={inputStyle} value={inp.inverted_lease_term_years} onChange={(e) => set('inverted_lease_term_years', e.target.value)} /></Fld>
          <Fld label="Insurance wrap (% of credit)" hint="Recapture/qualification wrap — ~1-3% range, labeled"><input type="number" step="0.25" min="0" max="10" style={inputStyle} value={inp.insurance_wrap_pct_of_credit} onChange={(e) => set('insurance_wrap_pct_of_credit', e.target.value)} /></Fld>
          <Fld label="Hybrid transfer carve-out (%)" hint="% of credits sold under §6418 alongside the flip"><input type="number" min="0" max="100" style={inputStyle} value={inp.hybrid_transfer_pct} onChange={(e) => set('hybrid_transfer_pct', e.target.value)} /></Fld>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 14 }}>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', flex: 1, minWidth: 320 }}>
            <Chk label="Prevailing wage & apprenticeship met" hint="×5 multiplier: ITC 6%→30% (§48)" checked={inp.prevailing_wage_met} onChange={(v) => set('prevailing_wage_met', v)} />
            <Chk label="Energy community" hint={isItc ? '+10pp ITC (+2pp w/o PWA)' : '+10% of PTC'} checked={inp.energy_community} onChange={(v) => set('energy_community', v)} />
            <Chk label="Domestic content" hint={isItc ? '+10pp ITC (+2pp w/o PWA)' : '+10% of PTC'} checked={inp.domestic_content} onChange={(v) => set('domestic_content', v)} />
            <Chk label="Run at P90 generation" hint="Output-risk case: revenue + credit volume × P90/P50" checked={inp.use_p90_generation} onChange={(v) => set('use_p90_generation', v)} />
            <Chk label="OBBBA 100% bonus restoration" hint="P.L. 119-21 (2025) — labeled toggle; verify acquisition-date eligibility" checked={inp.apply_obbba_100pct_bonus} onChange={(v) => set('apply_obbba_100pct_bonus', v)} />
          </div>
          <div style={{ flex: 1, minWidth: 300, background: T.cream, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>§6418 transfer price per $1.00</div>
              <input type="range" min="0.80" max="1.00" step="0.005" value={inp.transfer_price_per_dollar} onChange={(e) => set('transfer_price_per_dollar', e.target.value)} style={{ flex: 1, minWidth: 120, accentColor: T.green }} />
              <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: T.green }}>${Number(inp.transfer_price_per_dollar).toFixed(3)}</div>
            </div>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>
              Market-range note: ~$0.90–0.95 per $1.00 of credit seen in 2023–2025 market commentary — APPROXIMATE, not a quote.
              The engine also auto-selects a size/type table price (shown in results).
            </div>
          </div>
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      <div style={secCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={h2s}>Flip Solution</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/tax-equity/flip</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={res.status} demoText={res.error} /></div>
        </div>

        {res.status === 'live' && d && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="Flip year" value={d.flip_achieved ? `Year ${d.flip_year}` : 'Not achieved'}
                sub={d.flip_achieved ? `TE cum. IRR ${fmtPct(d.te_irr_at_flip_pct)} ≥ target ${fmtPct(parseFloat(inp.te_target_irr_pct))}` : 'Within horizon — see solver notes'}
                color={d.flip_achieved ? T.green : T.red} />
              <Kpi label="TE full-horizon IRR" value={fmtPct(d.te_full_horizon_irr_pct)} sub={`Investment ${fmtM(d.te_investment_musd)}`} color={T.purple} />
              <Kpi label="Sponsor IRR — flip" value={fmtPct(d.sponsor_irr_flip_structure_pct)} sub={`Sponsor equity ${fmtM(d.sponsor_equity_musd)}`} color={T.indigo} />
              <Kpi label="Sponsor IRR — transfer" value={fmtPct(d.sponsor_irr_transfer_structure_pct)} sub="§6418 sale, sponsor keeps depreciation" color={T.teal} />
              <Kpi label={isItc ? `ITC @ ${fmtNum(d.itc_rate_applied_pct, 0)}%` : `PTC @ ${fmtNum(d.ptc_effective_rate_usd_mwh)} $/MWh`}
                value={fmtM(d.gross_credit_musd)} sub={isItc ? 'Year-1 credit (§48)' : '10-yr credits, inflation-adj (§45)'} color={T.amber} />
              <Kpi label="Depreciable basis" value={fmtM(d.depreciable_basis_musd)} sub={isItc ? 'Capex − 50% of ITC (§50(c)(3))' : 'Full capex (PTC — no haircut)'} />
            </div>

            {/* Sponsor vs TE cashflow chart */}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
              Sponsor vs tax-equity after-tax cashflow by year ($M) + TE cumulative IRR vs target — engine output
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={d.yearly} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                <YAxis yAxisId="cf" tick={{ fontSize: 10 }} label={{ value: '$M', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <YAxis yAxisId="irr" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v, n) => [n.includes('IRR') ? fmtPct(v) : fmtM(v), n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="cf" dataKey="te_cf_musd" name="TE investor CF" stackId="cf" fill={T.purple} fillOpacity={0.85} />
                <Bar yAxisId="cf" dataKey="sponsor_cf_musd" name="Sponsor CF" stackId="cf" fill={T.gold} fillOpacity={0.9} />
                <Line yAxisId="irr" type="monotone" dataKey="te_cumulative_irr_pct" name="TE cumulative IRR %" stroke={T.red} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                <ReferenceLine yAxisId="irr" y={parseFloat(inp.te_target_irr_pct)} stroke={T.red} strokeDasharray="4 4" label={{ value: `target ${inp.te_target_irr_pct}%`, fontSize: 10, fill: T.red }} />
                {d.flip_achieved && <ReferenceLine yAxisId="cf" x={d.flip_year} stroke={T.green} strokeDasharray="4 4" label={{ value: `FLIP y${d.flip_year}`, fontSize: 10, fill: T.green }} />}
              </ComposedChart>
            </ResponsiveContainer>

            {/* Allocation table */}
            <div style={{ marginTop: 16, overflowX: 'auto' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                Year-by-year after-tax allocation waterfall (engine output — pre-flip rows at {fmtNum(inp.preflip_te_alloc_pct, 0)}% TE, post-flip at {fmtNum(inp.postflip_te_alloc_pct, 0)}%)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Yr</th><th style={th}>Revenue</th><th style={th}>Opex</th><th style={th}>Depreciation</th>
                    <th style={th}>Taxable</th><th style={th}>Tax</th><th style={th}>Credits</th><th style={th}>After-tax value</th>
                    <th style={th}>TE alloc</th><th style={th}>TE CF</th><th style={th}>Sponsor CF</th><th style={th}>TE cum. IRR</th>
                  </tr>
                </thead>
                <tbody>
                  {d.yearly.map((y) => {
                    const postFlip = d.flip_achieved && y.year > d.flip_year;
                    return (
                      <tr key={y.year} style={postFlip ? { background: T.green + '0d' } : undefined}>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{y.year}{d.flip_achieved && y.year === d.flip_year ? ' ⚑' : ''}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtM(y.revenue_musd)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtM(y.opex_musd)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtM(y.depreciation_musd)}</td>
                        <td style={{ ...td, fontFamily: T.mono, color: y.taxable_income_musd < 0 ? T.red : T.slate }}>{fmtM(y.taxable_income_musd)}</td>
                        <td style={{ ...td, fontFamily: T.mono, color: y.tax_musd < 0 ? T.green : T.slate }}>{fmtM(y.tax_musd)}</td>
                        <td style={{ ...td, fontFamily: T.mono, color: T.amber, fontWeight: y.credits_musd > 0 ? 700 : 400 }}>{fmtM(y.credits_musd)}</td>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{fmtM(y.after_tax_value_musd)}</td>
                        <td style={{ ...td, fontFamily: T.mono, color: postFlip ? T.green : T.purple, fontWeight: 700 }}>{fmtPct(y.te_alloc_pct, 0)}</td>
                        <td style={{ ...td, fontFamily: T.mono, color: T.purple }}>{fmtM(y.te_cf_musd)}</td>
                        <td style={{ ...td, fontFamily: T.mono, color: T.amber }}>{fmtM(y.sponsor_cf_musd)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{y.te_cumulative_irr_pct != null ? fmtPct(y.te_cumulative_irr_pct) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Transferability vs flip comparison */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 16 }}>
              <div style={{ flex: 1, minWidth: 320, background: T.cream, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 8 }}>Partnership flip (this structure)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td style={td}>TE investment at close</td><td style={{ ...td, fontFamily: T.mono, fontWeight: 700, textAlign: 'right' }}>{fmtM(d.te_investment_musd)}</td></tr>
                    <tr><td style={td}>Credits + depreciation monetised via TE partner</td><td style={{ ...td, fontFamily: T.mono, fontWeight: 700, textAlign: 'right', color: T.green }}>Full</td></tr>
                    <tr><td style={td}>Flip year</td><td style={{ ...td, fontFamily: T.mono, fontWeight: 700, textAlign: 'right' }}>{d.flip_achieved ? d.flip_year : '—'}</td></tr>
                    <tr><td style={td}>Sponsor IRR</td><td style={{ ...td, fontFamily: T.mono, fontWeight: 700, textAlign: 'right', color: T.indigo }}>{fmtPct(d.sponsor_irr_flip_structure_pct)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div style={{ flex: 1, minWidth: 320, background: T.cream, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 8 }}>§6418 credit transfer (labeled market-range price)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td style={td}>Gross credits</td><td style={{ ...td, fontFamily: T.mono, fontWeight: 700, textAlign: 'right' }}>{fmtM(d.transferability?.gross_credits_musd)}</td></tr>
                    <tr><td style={td}>Net proceeds @ ${Number(inp.transfer_price_per_dollar).toFixed(3)}/$1.00</td><td style={{ ...td, fontFamily: T.mono, fontWeight: 700, textAlign: 'right', color: T.green }}>{fmtM(d.transferability?.net_transfer_proceeds_musd)}</td></tr>
                    <tr><td style={td}>Discount cost vs face</td><td style={{ ...td, fontFamily: T.mono, fontWeight: 700, textAlign: 'right', color: T.red }}>{fmtM(d.transferability?.discount_cost_musd)}</td></tr>
                    <tr><td style={td}>Timing</td><td style={{ ...td, textAlign: 'right', fontSize: 11 }}>{d.transferability?.timing}</td></tr>
                    <tr><td style={td}>Sponsor IRR</td><td style={{ ...td, fontFamily: T.mono, fontWeight: 700, textAlign: 'right', color: T.teal }}>{fmtPct(d.transferability?.sponsor_irr_pct)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ ...noteBox, marginTop: 10 }}>
              <b>Complexity note:</b> {d.transferability?.complexity_note}
            </div>

            {/* ── Recapture & DRO / capital accounts ─────────────────────── */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 16 }}>
              <div style={{ flex: 1, minWidth: 340 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>
                  §50(a)(1) ITC recapture — disposition scenarios {d.recapture?.applies ? '' : '(PTC: reference only — no investment recapture)'}
                </div>
                <div style={{ fontSize: 10.5, color: T.sub, marginBottom: 6 }}>{d.recapture?.statute}. {d.recapture?.convention}.</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Disposition (end of yr)</th><th style={{ ...th, textAlign: 'right' }}>Recapture %</th><th style={{ ...th, textAlign: 'right' }}>Clawback ($M)</th></tr></thead>
                  <tbody>
                    {(d.recapture?.disposition_scenarios || []).map((sc) => {
                      const chosen = d.recapture?.chosen_scenario?.disposition_end_of_year === sc.disposition_end_of_year;
                      return (
                        <tr key={sc.disposition_end_of_year} style={chosen ? { background: T.red + '11' } : undefined}>
                          <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{sc.disposition_end_of_year}{chosen ? ' ◂ scenario' : ''}</td>
                          <td style={{ ...td, fontFamily: T.mono, textAlign: 'right', color: sc.recapture_pct > 0 ? T.red : T.green }}>{fmtPct(sc.recapture_pct, 0)}</td>
                          <td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmtM(sc.recapture_musd)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>{d.recapture?.note}</div>
              </div>
              <div style={{ flex: 1.4, minWidth: 380 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>
                  TE §704(b) book capital account vs DRO cap ({fmtM(d.capital_accounts?.dro_cap_musd)} = {fmtNum(inp.dro_cap_pct_of_investment, 0)}% of investment)
                </div>
                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr><th style={th}>Yr</th><th style={th}>Book income</th><th style={th}>Cash dist.</th><th style={th}>ITC adj.</th><th style={th}>Loss realloc.</th><th style={th}>Capital acct</th></tr>
                    </thead>
                    <tbody>
                      {(d.capital_accounts?.rows || []).map((r) => (
                        <tr key={r.year} style={r.dro_breach ? { background: '#fef2f2' } : undefined}>
                          <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{r.year}{r.dro_breach ? ' ⚠' : ''}</td>
                          <td style={{ ...td, fontFamily: T.mono, color: r.book_income_musd < 0 ? T.red : T.slate }}>{fmtM(r.book_income_musd)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtM(r.cash_distributed_musd)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtM(r.itc_basis_adjustment_musd)}</td>
                          <td style={{ ...td, fontFamily: T.mono, color: r.loss_reallocated_musd > 0 ? T.red : T.slate }}>{fmtM(r.loss_reallocated_musd)}</td>
                          <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: r.capital_account_musd < 0 ? T.amber : T.navy }}>{fmtM(r.capital_account_musd)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>{d.capital_accounts?.label}</div>
                <div style={{ fontSize: 11, color: d.capital_accounts?.first_dro_breach_year ? T.red : T.green, fontWeight: 700, marginTop: 4 }}>{d.capital_accounts?.note}</div>
              </div>
            </div>

            {/* ── Depreciation comparison ─────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 16 }}>
              <div style={{ flex: 1, minWidth: 340 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>
                  NPV of depreciation tax shield @ {fmtNum(inp.subsidy_discount_rate_pct, 1)}% — bonus {fmtNum(d.depreciation_comparison?.bonus_rate_applied_pct, 0)}% (PIS {inp.placed_in_service_year}{d.depreciation_comparison?.obbba_applied ? ', OBBBA' : ''})
                </div>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={depBars} margin={{ bottom: 5, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                    <YAxis tick={{ fontSize: 10 }} label={{ value: '$M', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip formatter={(v, n, pt) => [`${fmtM(v)} (yr-1 ${fmtPct(pt?.payload?.yr1, 1)} of basis)`, 'NPV of tax shield']} />
                    <Bar dataKey="npv" radius={[3, 3, 0, 0]}>
                      {depBars.map((b, i) => <Cell key={i} fill={b.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 10.5, color: T.sub }}>{d.depreciation_comparison?.ordering_note}</div>
              </div>
              <div style={{ flex: 1, minWidth: 340 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>Method detail (full schedules, engine output)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Method</th><th style={{ ...th, textAlign: 'right' }}>Yr-1 % of basis</th><th style={{ ...th, textAlign: 'right' }}>Total shield</th><th style={{ ...th, textAlign: 'right' }}>NPV shield</th></tr></thead>
                  <tbody>
                    {depMethods && [['bonus', 'Bonus §168(k)'], ['macrs_5yr', 'MACRS 5-yr'], ['straight_line', `Straight-line (${inp.straight_line_years}y)`]].map(([k, name]) => (
                      <tr key={k} style={k === inp.depreciation_method ? { background: T.indigo + '11' } : undefined}>
                        <td style={{ ...td, fontWeight: 700 }}>{name}{k === inp.depreciation_method ? ' ◂ in model' : ''}</td>
                        <td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmtPct(depMethods[k].year1_pct_of_basis, 1)}</td>
                        <td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmtM(depMethods[k].total_shield_musd)}</td>
                        <td style={{ ...td, fontFamily: T.mono, textAlign: 'right', fontWeight: 700 }}>{fmtM(depMethods[k].npv_tax_shield_musd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>{d.depreciation_comparison?.label}</div>
                <div style={{ fontSize: 10.5, color: T.amber, marginTop: 4 }}>{d.depreciation_comparison?.obbba_note}</div>
              </div>
            </div>

            {/* ── Transfer-market depth ───────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 16 }}>
              <div style={{ flex: 1, minWidth: 340 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>§6418 market pricing table (hand-authored, labeled)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Credit</th><th style={th}>Size tier</th><th style={{ ...th, textAlign: 'right' }}>$/1.00 (spot)</th></tr></thead>
                  <tbody>
                    {(d.transfer_market?.table?.rows || []).map((r, i) => {
                      const selected = d.transfer_market?.auto_selected?.credit === r.credit && d.transfer_market?.auto_selected?.size_tier === r.size_tier;
                      return (
                        <tr key={i} style={selected ? { background: T.green + '11' } : undefined}>
                          <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{r.credit}{selected ? ' ◂ your deal' : ''}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{r.size_tier}</td>
                          <td style={{ ...td, fontFamily: T.mono, textAlign: 'right', fontWeight: selected ? 700 : 400 }}>${Number(r.price_per_dollar).toFixed(3)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
                  Vintage: spot +0.000 · forward next-year {fmtNum(d.transfer_market?.table?.vintage_adjustment_per_dollar?.forward_next_year, 3)} · 2+ yrs {fmtNum(d.transfer_market?.table?.vintage_adjustment_per_dollar?.forward_2plus_years, 3)}. {d.transfer_market?.table?.label}
                </div>
              </div>
              <div style={{ flex: 1.2, minWidth: 360 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>Wrap, forward-vs-spot & hybrid (engine output)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td style={td}>Insurance wrap ({fmtNum(inp.insurance_wrap_pct_of_credit, 2)}% of face)</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmtM(d.transfer_market?.insurance_wrap?.cost_musd)} → net ${fmtNum(d.transfer_market?.insurance_wrap?.net_price_after_wrap, 4)}/$1.00</td></tr>
                    <tr><td style={td}>Spot proceeds (table price)</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmtM(d.transfer_market?.forward_vs_spot?.spot_proceeds_musd)} @ ${fmtNum(d.transfer_market?.forward_vs_spot?.spot_price, 3)}</td></tr>
                    <tr><td style={td}>Forward next-year commitment</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmtM(d.transfer_market?.forward_vs_spot?.forward_next_year_proceeds_musd)} @ ${fmtNum(d.transfer_market?.forward_vs_spot?.forward_next_year_price, 3)}</td></tr>
                    <tr><td style={{ ...td, fontWeight: 700 }}>Hybrid: flip + {fmtNum(inp.hybrid_transfer_pct, 0)}% credit carve-out</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right', fontWeight: 700 }}>flip yr {d.transfer_market?.hybrid?.flip_year ?? '—'} · sponsor IRR {fmtPct(d.transfer_market?.hybrid?.sponsor_irr_pct)} · TE IRR {fmtPct(d.transfer_market?.hybrid?.te_irr_pct)}</td></tr>
                    <tr><td style={td}>Hybrid carve-out proceeds</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right', color: T.green }}>{fmtM(d.transfer_market?.hybrid?.sponsor_proceeds_musd)} on {fmtM(d.transfer_market?.hybrid?.credits_transferred_musd)} of credits</td></tr>
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>{d.transfer_market?.forward_vs_spot?.note}</div>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>{d.transfer_market?.hybrid?.note}</div>
              </div>
            </div>

            {/* ── PTC depth (conditional) ─────────────────────────────────── */}
            {d.ptc_detail && (
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 16 }}>
                <div style={{ flex: 1.2, minWidth: 380 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>
                    §45 PTC 10-year credit stream — P50 (engine output; rate escalated {fmtNum(inp.ptc_inflation_pct, 1)}%/yr)
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={d.ptc_detail.p50_stream} margin={{ bottom: 5, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} label={{ value: '$M', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                      <Tooltip formatter={(v, n) => [fmtM(v), n]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="credit_musd" name="Credit (nominal)" fill={T.amber} fillOpacity={0.85} radius={[3, 3, 0, 0]} />
                      <Line type="monotone" dataKey="pv_musd" name={`PV @ ${inp.subsidy_discount_rate_pct}%`} stroke={T.navy} strokeWidth={2} dot={{ r: 2 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, minWidth: 300 }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                    <Kpi label="PV 10-yr credits — P50" value={fmtM(d.ptc_detail.pv_10yr_p50_musd)} sub={`@ ${inp.subsidy_discount_rate_pct}% discount`} color={T.amber} />
                    <Kpi label="PV — P90" value={fmtM(d.ptc_detail.pv_10yr_p90_musd)} sub={`P90/P50 = ${fmtNum(d.ptc_detail.p90_factor, 2)}`} color={T.slate} />
                    <Kpi label="Credit PV at risk (P50→P90)" value={fmtM(d.ptc_detail.pv_at_risk_p50_vs_p90_musd)} sub={`Model basis: ${d.ptc_detail.model_basis}`} color={T.red} />
                  </div>
                  <div style={{ fontSize: 11, color: T.slate }}>{d.ptc_detail.mechanics}</div>
                  <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>{d.ptc_detail.note}</div>
                </div>
              </div>
            )}

            {/* ── Sustainability × financial ──────────────────────────────── */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 14, marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.green, marginBottom: 8 }}>
                Sustainability × financial — effective $/tCO2e of the federal tax subsidy (documented)
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <Kpi label="Lifetime avoided emissions" value={`${fmtNum(d.sustainability?.lifetime_avoided_tco2e, 0)} t`} sub={`${fmtNum(d.sustainability?.annual_generation_mwh_basis, 0)} MWh (${d.sustainability?.generation_basis}) × ${fmtNum(inp.grid_intensity_tco2_mwh, 2)} t/MWh × ${inp.analysis_years}y`} color={T.green} />
                <Kpi label="PV of tax benefits" value={fmtM(d.sustainability?.pv_total_tax_benefits_musd)} sub={`credits ${fmtM(d.sustainability?.pv_credits_musd)} + dep shield ${fmtM(d.sustainability?.pv_depreciation_shield_musd)}`} />
                <Kpi label="$/tCO2e — flip (full monetization)" value={`$${fmtNum(d.sustainability?.subsidy_usd_per_tco2e?.flip_full_monetization, 2)}`} color={T.navy} />
                <Kpi label="$/tCO2e — §6418 transfer" value={`$${fmtNum(d.sustainability?.subsidy_usd_per_tco2e?.transfer_credits_at_market, 2)}`} sub="Credits at market price net of wrap" color={T.teal} />
                <Kpi label="$/tCO2e — credits only" value={`$${fmtNum(d.sustainability?.subsidy_usd_per_tco2e?.credits_only, 2)}`} color={T.amber} />
              </div>
              <div style={{ fontSize: 10.5, color: T.sub }}>{d.sustainability?.label}</div>
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>{d.sustainability?.note}</div>
            </div>

            <div style={{ marginTop: 12, fontSize: 10.5, color: T.sub }}>
              {d.solver_notes.map((m, i) => <div key={i}>• {m}</div>)}
            </div>
          </>
        )}
        {res.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Tax-equity engine unreachable — no figures shown (this page never fabricates results). Error: {String(res.error)}</div>}
        {res.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Set the structure inputs above and run the solver. The flip search, every year of the allocation waterfall, recapture/DRO tracking, depreciation comparison, transfer-market depth and the $/tCO2e overlay are returned by the engine and shown in full.</div>}
      </div>

      {/* ── Structure menu ──────────────────────────────────────────────── */}
      <div style={secCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={h2s}>Structure Menu — Flip vs Sale-Leaseback vs Inverted Lease</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/tax-equity/structures</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={structRes.status} demoText={structRes.error} /></div>
        </div>
        {structRes.status === 'live' && s && (
          <>
            <div style={{ overflowX: 'auto', marginBottom: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Structure</th><th style={{ ...th, textAlign: 'right' }}>Sponsor IRR</th><th style={{ ...th, textAlign: 'right' }}>Sponsor NPV</th>
                    <th style={{ ...th, textAlign: 'right' }}>TE IRR</th><th style={{ ...th, textAlign: 'right' }}>TE capital</th><th style={{ ...th, textAlign: 'right' }}>Gross ITC</th>
                    <th style={th}>Complexity</th><th style={th}>Recapture exposure</th><th style={{ ...th, textAlign: 'right' }}>$/tCO2e</th>
                  </tr>
                </thead>
                <tbody>
                  {s.comparison_matrix.map((r) => (
                    <tr key={r.structure}>
                      <td style={{ ...td, fontWeight: 700, color: T.navy }}>{r.structure}</td>
                      <td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{r.sponsor_irr_pct != null ? fmtPct(r.sponsor_irr_pct) : 'n/m'}</td>
                      <td style={{ ...td, fontFamily: T.mono, textAlign: 'right', fontWeight: 700 }}>{fmtM(r.sponsor_npv_musd)}</td>
                      <td style={{ ...td, fontFamily: T.mono, textAlign: 'right', color: T.purple }}>{fmtPct(r.te_irr_pct)}</td>
                      <td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmtM(r.te_capital_musd)}</td>
                      <td style={{ ...td, fontFamily: T.mono, textAlign: 'right', color: T.amber }}>{fmtM(r.gross_itc_musd)}</td>
                      <td style={td}>{r.complexity}</td>
                      <td style={{ ...td, fontSize: 11 }}>{r.recapture_exposure}</td>
                      <td style={{ ...td, fontFamily: T.mono, textAlign: 'right', color: T.green }}>${fmtNum(r.subsidy_usd_per_tco2e, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {[['Partnership flip', s.partnership_flip], ['Sale-leaseback', s.sale_leaseback], ['Inverted lease', s.inverted_lease]].map(([name, st]) => (
                <div key={name} style={{ flex: 1, minWidth: 300, background: T.cream, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>{name}</div>
                  <div style={{ fontSize: 11, color: T.slate, marginBottom: 8 }}>{st.mechanics}</div>
                  <div style={{ fontSize: 11, fontFamily: T.mono, color: T.sub }}>
                    {st.level_rent_musd != null && <div>Level rent: {fmtM(st.level_rent_musd)}/yr × {st.lease_term_years}y</div>}
                    {st.fmv_musd != null && <div>FMV: {fmtM(st.fmv_musd)} (ITC uplift vs flip {fmtM(st.itc_uplift_vs_flip_musd)})</div>}
                    {st.itc_income_inclusion_tax_musd_per_yr != null && <div>§50(d)(5) income-inclusion tax: {fmtM(st.itc_income_inclusion_tax_musd_per_yr)}/yr × 5y</div>}
                    {st.flip_year != null && <div>Flip year: {st.flip_year}</div>}
                    <div>Sponsor NPV @ {fmtNum(inp.subsidy_discount_rate_pct, 1)}%: {fmtM(st.sponsor_npv_musd)}</div>
                  </div>
                  {st.sponsor_irr_note && <div style={{ fontSize: 10.5, color: T.amber, marginTop: 6 }}>{st.sponsor_irr_note}</div>}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 10 }}>
              <b>Subsidy intensity:</b> {s.subsidy_intensity?.label} {s.subsidy_intensity?.note}
            </div>
            <div style={{ marginTop: 8, fontSize: 10.5, color: T.sub }}>
              {s.method_notes.map((m, i) => <div key={i}>• {m}</div>)}
            </div>
          </>
        )}
        {structRes.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Structure engine unreachable — no figures shown. Error: {String(structRes.error)}</div>}
        {structRes.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Run the structure menu (ITC mode) to compare the partnership flip against a sale-leaseback (level rent solved to the lessor target IRR on the FMV step-up basis) and an inverted lease (prepaid rent solved to the TE target; §50(d)(5) income inclusion) — including recapture exposure and $/tCO2e subsidy intensity per structure.</div>}
      </div>

      {/* ── Adder qualification checklists ─────────────────────────────── */}
      <div style={secCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <h2 style={h2s}>Adder Qualification Checklists (Real IRA Criteria, Summarized)</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/tax-equity/ref/adder-checklists</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={checklists.status} demoText={checklists.error} /></div>
        </div>
        {checklists.status === 'live' && checklists.data && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 10 }}>{checklists.data.label}</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {[['domestic_content', 'Domestic content', inp.domestic_content], ['energy_community', 'Energy community', inp.energy_community]].map(([key, name, claimed]) => (
                <div key={key} style={{ flex: 1, minWidth: 320, background: claimed ? '#f0fdf4' : T.cream, border: `1px solid ${claimed ? '#bbf7d0' : T.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 4 }}>
                    {name} — {checklists.data[key].adder} {claimed ? <span style={{ color: T.green }}>· claimed in your run</span> : <span style={{ color: T.sub }}>· not claimed</span>}
                  </div>
                  <div style={{ fontSize: 10.5, fontFamily: T.mono, color: T.sub, marginBottom: 6 }}>{checklists.data[key].statute}</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: T.slate, lineHeight: 1.6 }}>
                    {checklists.data[key].checklist.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}
        {checklists.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Checklist reference unavailable. Error: {String(checklists.error)}</div>}
      </div>

      {/* ── IRA parameter table ─────────────────────────────────────────── */}
      <div style={secCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <h2 style={h2s}>IRA Parameters Used (Transparent)</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/tax-equity/ref/ira-parameters</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={ira.status} demoText={ira.error} /></div>
        </div>
        {ira.status === 'live' && ira.data && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 10 }}>{ira.data.label}</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr><th style={th}>Parameter</th><th style={th}>Value</th><th style={th}>Statutory basis</th></tr>
                </thead>
                <tbody>
                  <tr><td style={td}>ITC base rate</td><td style={{ ...td, fontFamily: T.mono }}>{ira.data.itc.base_rate_pct}% (×{ira.data.itc.pwa_multiplier} = {ira.data.itc.base_rate_with_pwa_pct}% with PWA)</td><td style={td}>{ira.data.itc.statute}</td></tr>
                  <tr><td style={td}>ITC energy-community adder</td><td style={{ ...td, fontFamily: T.mono }}>+{ira.data.itc.energy_community_adder_pp.with_pwa}pp (with PWA) / +{ira.data.itc.energy_community_adder_pp.without_pwa}pp</td><td style={td}>{ira.data.itc.statute}</td></tr>
                  <tr><td style={td}>ITC domestic-content adder</td><td style={{ ...td, fontFamily: T.mono }}>+{ira.data.itc.domestic_content_adder_pp.with_pwa}pp (with PWA) / +{ira.data.itc.domestic_content_adder_pp.without_pwa}pp</td><td style={td}>{ira.data.itc.statute}</td></tr>
                  <tr><td style={td}>ITC basis reduction</td><td style={{ ...td, fontSize: 11 }}>{ira.data.itc.basis_reduction}</td><td style={td}>IRC §50(c)(3)</td></tr>
                  <tr><td style={td}>ITC recapture vesting</td><td style={{ ...td, fontFamily: T.mono }}>{Object.entries(ira.data.itc_recapture_schedule_pct || {}).map(([y, p]) => `${y}y:${p}%`).join(' · ')}</td><td style={td}>IRC §50(a)(1)</td></tr>
                  <tr><td style={td}>PTC rate (2024 published)</td><td style={{ ...td, fontFamily: T.mono }}>${ira.data.ptc.base_rate_2024_usd_mwh}/MWh · {ira.data.ptc.duration_years} years</td><td style={td}>{ira.data.ptc.statute}</td></tr>
                  <tr><td style={td}>PTC adders</td><td style={{ ...td, fontFamily: T.mono }}>+{ira.data.ptc.energy_community_adder_pct_of_credit}% / +{ira.data.ptc.domestic_content_adder_pct_of_credit}% of credit</td><td style={td}>{ira.data.ptc.statute}</td></tr>
                  <tr><td style={td}>MACRS 5-year schedule</td><td style={{ ...td, fontFamily: T.mono }}>{ira.data.macrs_5yr_pct.join(' / ')}%</td><td style={td}>IRC §168 (half-year convention)</td></tr>
                  <tr><td style={td}>Bonus depreciation phase-down</td><td style={{ ...td, fontFamily: T.mono }}>{Object.entries(ira.data.bonus_depreciation_phasedown_pct || {}).map(([y, p]) => `${y}:${p}%`).join(' · ')}</td><td style={td}>IRC §168(k) (TCJA as amended; see OBBBA note)</td></tr>
                  <tr><td style={td}>Transferability price range</td><td style={{ ...td, fontFamily: T.mono }}>${ira.data.transferability.market_price_range_per_dollar[0]}–${ira.data.transferability.market_price_range_per_dollar[1]} per $1.00</td><td style={td}>{ira.data.transferability.statute} — {ira.data.transferability.note}</td></tr>
                  <tr><td style={td}>Federal corporate tax rate</td><td style={{ ...td, fontFamily: T.mono }}>{ira.data.federal_corporate_tax_rate_pct}%</td><td style={td}>IRC §11 (TCJA 2017)</td></tr>
                </tbody>
              </table>
            </div>
            {ira.data.obbba_note && <div style={{ ...noteBox, marginTop: 10 }}><b>OBBBA note:</b> {ira.data.obbba_note}</div>}
          </>
        )}
        {ira.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>IRA reference unavailable. Error: {String(ira.error)}</div>}
      </div>

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
        Engine: api/v1/routes/tax_equity.py — real IRA statutory parameters (IRC §48/§45/§168/§168(k)/§50/§6418,
        labeled), year-by-year after-tax allocation model with MACRS/bonus/straight-line toggle, flip year via
        bisection-IRR scan, §50(a)(1) recapture scenarios, §704(b) capital-account/DRO tracking (documented
        simplification), §6418 transfer-market table + wrap + forward/spot + re-solved hybrid, sale-leaseback and
        inverted-lease solvers, and a documented $/tCO2e subsidy-intensity overlay. Nothing on this page is
        fabricated client-side.
      </div>
    </div>
  );
}
