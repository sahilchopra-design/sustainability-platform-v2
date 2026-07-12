import React, { useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ComposedChart, Line, Legend, ReferenceLine, AreaChart, Area, Scatter,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Energy Transition Credit Portal (NX2-15) — refined 5-tab desk
//   Single Borrower / Portfolio / Climate Matrix / PCAF & Disclosure / Pricing Lab
//
// Live engines (all badged Live/Demo per call):
//   1. POST /api/v1/basel-capital/risk-weight-irb   (CRR Art 153 IRB risk weight)
//      POST /api/v1/basel-capital/risk-weight-sa    (CRR Art 122 SA risk weight)
//   2. GET  /api/v1/ngfs-extract/scenarios?region=World
//      (NGFS Phase 5 seeded extract — IIASA Scenario Explorer, CC BY 4.0)
//   3. NEW  /api/v1/transition-credit/*  (backend/api/v1/routes/transition_credit_analytics.py)
//        POST /lifetime-el      PD term structure + IFRS 9 stage-1 vs stage-2 ECL
//        POST /climate-matrix   climate-stressed migration matrix + evolution (analytical core)
//        POST /pcaf             PCAF financed-emissions attribution + DQ + ITR
//        POST /pricing          climate-RAROC, carbon margin erosion, green RW panel, SLL ratchet
//        POST /portfolio        book EL/RAROC/emissions + scenario EL + OLS + TCFD/ISSB panel
//        GET  /ref/*            every hand-authored table the engine uses (shown in-page)
// If an engine is unreachable the panel is badged Demo and shows NO fabricated
// figures (only the documented in-page Basel III SA fallback table is ever used).
// All scorecard weights, PD ladders, matrices and multipliers are hand-authored,
// labeled and displayed in full — nothing is random, nothing is hidden.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const fmtM = (v, d = 1) => (v == null || isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: d })}M`;
const fmtNum = (v, d = 2) => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtPct = (v, d = 1) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}%`;
const fmtBps = (v, d = 0) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)} bps`;
const fmtT = (v, d = 0) => (v == null || isNaN(v)) ? '—' : `${Number(v).toLocaleString('en-US', { maximumFractionDigits: d })} t`;
const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

const Badge = ({ status, demoText }) => {
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live</span>;
  if (status === 'loading') return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Calling engine</span>;
  if (status === 'demo') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Demo{demoText ? ` — ${demoText}` : ' — engine unavailable'}</span>;
  return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Idle — run analysis</span>;
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
const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 };
const h2 = { margin: 0, fontSize: 15, fontWeight: 800, color: T.navy };
const formulaBox = {
  background: T.cream, border: `1px dashed ${T.gold}`, borderRadius: 8,
  padding: '10px 14px', fontSize: 11, color: T.slate, fontFamily: T.mono, lineHeight: 1.7, marginBottom: 12,
};
const btnStyle = (enabled = true) => ({
  background: enabled ? T.navy : T.sub, color: '#fff', border: 'none', borderRadius: 8,
  padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: enabled ? 'pointer' : 'not-allowed', fontFamily: T.font,
});
const endpointChip = { fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' };

const Field = ({ label, value, onChange, unit, width = 150 }) => (
  <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 4, width }}>
    {label}{unit ? ` (${unit})` : ''}
    <input type="number" step="any" style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)} />
  </label>
);

const SelectField = ({ label, value, onChange, options, width = 160 }) => (
  <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 4, width }}>
    {label}
    <select style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (Array.isArray(o)
        ? <option key={o[0]} value={o[0]}>{o[1]}</option>
        : <option key={o} value={o}>{o}</option>))}
    </select>
  </label>
);

// ── Hand-authored reference tables (documented, visible, editable basis) ────
// Rating → 1-yr PD. Approximation of S&P Global Ratings "Default, Transition,
// and Recovery" annual corporate default study, 1981–2023 global long-run
// average one-year default rates; investment-grade values floored near the
// Basel/CRR3 5 bps PD input floor rather than the observed ~0% rates.
// The backend /api/v1/transition-credit engine uses the SAME year-1 values in
// its cumulative PD anchors and migration-matrix default column (see /ref/*).
const RATING_LADDER = [
  { rating: 'AAA', pdPct: 0.02, cqs: 1 },
  { rating: 'AA', pdPct: 0.03, cqs: 1 },
  { rating: 'A', pdPct: 0.06, cqs: 2 },
  { rating: 'BBB', pdPct: 0.17, cqs: 3 },
  { rating: 'BB', pdPct: 0.65, cqs: 4 },
  { rating: 'B', pdPct: 3.30, cqs: 5 },
  { rating: 'CCC', pdPct: 26.50, cqs: 6 },
];
const ratingRow = (r) => RATING_LADDER.find((x) => x.rating === r) || RATING_LADDER[3];
const NON_DEFAULT_RATINGS = RATING_LADDER.map((r) => r.rating);

// Offtaker rating → bankability subscore (0-100). Hand-authored mapping.
const OFFTAKER_SCORE = { AAA: 100, AA: 92, A: 85, BBB: 70, BB: 50, B: 30, CCC: 10 };

// Revenue-quality scorecard weights — every weight visible, documented below.
const RQ_WEIGHTS = { contracted: 0.40, offtaker: 0.25, merchant: 0.20, carbon: 0.15 };

// Composite revenue-quality score → implied borrower rating (hand-authored
// bands; capped at A — single-asset project borrowers rarely rate above A).
const scoreToRating = (s) => (s >= 85 ? 'A' : s >= 70 ? 'BBB' : s >= 55 ? 'BB' : s >= 40 ? 'B' : 'CCC');

// In-page SA fallback (used only when the Basel engine is unreachable):
// Basel III standardised approach corporate risk weights by CQS
// (CRE20.16 / CRR Art 122) — hand-transcribed, real regulatory weights.
const SA_FALLBACK_RW = { 1: 0.20, 2: 0.50, 3: 1.00, 4: 1.00, 5: 1.50, 6: 1.50 };

const SECTORS = ['Solar IPP', 'Wind IPP', 'Hydro IPP', 'Geothermal', 'Storage + Solar hybrid', 'Biomass / WtE', 'Gas CCGT (transition)'];
// Extended sector list for portfolio/PCAF/pricing — matches the backend's
// SECTOR_CLASS map (green / mixed / neutral / fossil / fossil_high classes).
const SECTORS_EXT = [...SECTORS, 'Coal power', 'Oil & Gas', 'Grid / Networks', 'Other'];
const NGFS_YEARS = [2030, 2035, 2040, 2045, 2050];
const RATINGS_ALL = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D'];
const RATING_COLORS = {
  AAA: '#15803d', AA: '#4d7c0f', A: '#a16207', BBB: '#b45309',
  BB: '#c2410c', B: '#dc2626', CCC: '#991b1b', D: '#450a0a',
};
const SCEN_LABEL = {
  net_zero_2050: 'Net Zero 2050', below_2c: 'Below 2°C', delayed_transition: 'Delayed Transition',
  fragmented_world: 'Fragmented World', ndcs: 'NDCs', current_policies: 'Current Policies',
};
const SCENARIO_IDS = Object.keys(SCEN_LABEL);

// Hand-authored illustrative borrower — a mid-size contracted solar IPP with a
// merchant tail and a registered carbon-credit stream. Fully editable.
const DEFAULT_B = {
  name: 'Helios Andes Solar S.A.', sector: 'Solar IPP', country: 'Chile',
  ppaRev: 78,          // PPA-contracted revenue, $M/yr
  offtakerRating: 'BBB',
  merchantRev: 22,     // merchant revenue, $M/yr
  carbonRev: 6,        // carbon-credit revenue, $M/yr
  merchantVolPct: 35,  // merchant price volatility (annualized %, hand-authored norm 35)
  debt: 420,           // debt outstanding, $M (= EAD, drawn term loan)
  tenor: 12,           // remaining tenor, years
  lgdPct: 45,          // LGD (senior unsecured Basel foundation-IRB default)
  marginBps: 250,      // contractual margin over base, bps
  opexBps: 60,         // origination + servicing cost, bps of EAD
  capRatioPct: 10.5,   // total capital ratio applied to RWA (Basel min 8% + CCB 2.5%)
  hurdlePct: 12,       // pre-tax return-on-capital hurdle
};

// Hand-authored illustrative 7-name transition-lending book (editable in the
// Portfolio tab). Emissions are scope 1+2 tCO2e/yr; EVIC in $M; ALL labeled
// illustrative — not live data.
const DEFAULT_BOOK = [
  { name: 'Helios Andes Solar', sector: 'Solar IPP', rating: 'BBB', ead_m: 420, margin_bps: 250, lgd_pct: 45, tenor_years: 10, revenue_m: 106, evic_m: 980, emissions_tco2: 12000, data_quality: 2, itr_c: '' },
  { name: 'Boreas Offshore Wind', sector: 'Wind IPP', rating: 'BBB', ead_m: 610, margin_bps: 235, lgd_pct: 45, tenor_years: 9, revenue_m: 180, evic_m: 1450, emissions_tco2: 9000, data_quality: 2, itr_c: '' },
  { name: 'Cascadia Hydro', sector: 'Hydro IPP', rating: 'A', ead_m: 300, margin_bps: 180, lgd_pct: 40, tenor_years: 8, revenue_m: 95, evic_m: 820, emissions_tco2: 4000, data_quality: 1, itr_c: '' },
  { name: 'Thermal Ridge Geothermal', sector: 'Geothermal', rating: 'BB', ead_m: 150, margin_bps: 340, lgd_pct: 50, tenor_years: 7, revenue_m: 48, evic_m: 310, emissions_tco2: 15000, data_quality: 3, itr_c: '' },
  { name: 'Delta Gas CCGT', sector: 'Gas CCGT (transition)', rating: 'BB', ead_m: 380, margin_bps: 310, lgd_pct: 45, tenor_years: 8, revenue_m: 240, evic_m: 760, emissions_tco2: 1850000, data_quality: 2, itr_c: '' },
  { name: 'Ironpeak Coal Gen', sector: 'Coal power', rating: 'B', ead_m: 220, margin_bps: 420, lgd_pct: 55, tenor_years: 6, revenue_m: 190, evic_m: 350, emissions_tco2: 3900000, data_quality: 3, itr_c: '' },
  { name: 'GridCo Networks', sector: 'Grid / Networks', rating: 'A', ead_m: 450, margin_bps: 160, lgd_pct: 35, tenor_years: 10, revenue_m: 310, evic_m: 1600, emissions_tco2: 60000, data_quality: 2, itr_c: '' },
];

// PCAF tab default exposures — same names, adds scope-3 where a borrower
// reports it and total equity+debt for the unlisted names (option 1b).
const DEFAULT_PCAF = [
  { name: 'Helios Andes Solar', sector: 'Solar IPP', outstanding_m: 420, evic_m: 980, total_equity_debt_m: '', revenue_m: 106, emissions_tco2: 12000, scope3_tco2: 48000, data_quality: 2, itr_c: 1.6 },
  { name: 'Delta Gas CCGT', sector: 'Gas CCGT (transition)', outstanding_m: 380, evic_m: 760, total_equity_debt_m: '', revenue_m: 240, emissions_tco2: 1850000, scope3_tco2: 610000, data_quality: 2, itr_c: '' },
  { name: 'Ironpeak Coal Gen', sector: 'Coal power', outstanding_m: 220, evic_m: '', total_equity_debt_m: 340, revenue_m: 190, emissions_tco2: 3900000, scope3_tco2: '', data_quality: 3, itr_c: '' },
  { name: 'GridCo Networks', sector: 'Grid / Networks', outstanding_m: 450, evic_m: 1600, total_equity_debt_m: '', revenue_m: 310, emissions_tco2: 60000, scope3_tco2: 220000, data_quality: 2, itr_c: 2.0 },
];

// Default NGFS scenario probability weights for the Pricing Lab (must sum to 1;
// hand-authored house view — fully editable).
const DEFAULT_PROBS = { net_zero_2050: 0.25, below_2c: 0.20, delayed_transition: 0.20, fragmented_world: 0.10, ndcs: 0.15, current_policies: 0.10 };

// ── Pure scoring/credit functions (documented; reused for NGFS scenarios) ──
function revenueQuality(ppa, merchant, carbon, offtakerRating, merchantVolPct) {
  const total = ppa + merchant + carbon;
  if (total <= 0) return null;
  const shContract = ppa / total, shMerchant = merchant / total, shCarbon = carbon / total;
  const sContracted = shContract * 100;
  const sOfftaker = OFFTAKER_SCORE[offtakerRating] ?? 70;
  const sMerchant = Math.max(0, 100 - shMerchant * 100 * (num(merchantVolPct) / 35));
  const sCarbon = Math.max(0, 100 - shCarbon * 100 * 1.5);
  const composite = RQ_WEIGHTS.contracted * sContracted + RQ_WEIGHTS.offtaker * sOfftaker
    + RQ_WEIGHTS.merchant * sMerchant + RQ_WEIGHTS.carbon * sCarbon;
  return {
    total, shContract, shMerchant, shCarbon,
    sContracted, sOfftaker, sMerchant, sCarbon,
    composite, rating: scoreToRating(composite),
  };
}

function creditMetrics(rq, lgdPct, ead) {
  if (!rq) return null;
  const { pdPct, cqs } = ratingRow(rq.rating);
  const pd = pdPct / 100, lgd = num(lgdPct) / 100;
  const el = pd * lgd * ead;                    // EL = PD × LGD × EAD
  const elBps = ead > 0 ? (el / ead) * 10000 : null;
  return { pd, pdPct, cqs, lgd, el, elBps };
}

// NGFS sensitivity mapping (documented in the NGFS panel; params editable).
function stressRevenues(sd, idx, base, gdpBeta, carbonPass, carbonRefPrice) {
  if (!sd || idx < 0) return null;
  const gdpImpact = sd.gdp_impact_pct[idx];
  const carbonPrice = sd.carbon_price[idx];
  const pRef = Math.max(num(carbonRefPrice), 0.01);
  const merchant = Math.max(0, num(base.merchantRev) * (1 + (num(gdpBeta) * gdpImpact) / 100));
  const carbon = Math.max(0, num(base.carbonRev) * (1 + num(carbonPass) * ((carbonPrice - pRef) / pRef)));
  return { gdpImpact, carbonPrice, merchant, carbon };
}

// RAROC + pricing floor (documented in the Basel panel).
function raroc(rw, ead, marginBps, elBps, opexBps, capRatioPct, hurdlePct) {
  if (rw == null || ead <= 0) return null;
  const rwa = rw * ead;
  const capital = rwa * (num(capRatioPct) / 100);
  const netBps = num(marginBps) - elBps - num(opexBps);
  const netIncome = (netBps / 10000) * ead;
  const rarocPct = capital > 0 ? (netIncome / capital) * 100 : null;
  const floorBps = elBps + num(opexBps) + (num(hurdlePct) / 100) * (num(capRatioPct) / 100) * rw * 10000;
  return { rwa, capital, netBps, netIncome, rarocPct, floorBps, meetsHurdle: rarocPct != null && rarocPct >= num(hurdlePct) };
}

// ── Small presentational helpers for the new tabs ───────────────────────────
// Heat-colored migration-matrix table (values in %, diagonal outlined).
const MatrixTable = ({ ratings, matrixPct, title, note }) => (
  <div style={{ flex: 1, minWidth: 420 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>{title}</div>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={th}>From&nbsp;\&nbsp;To</th>
          {ratings.map((r) => <th key={r} style={{ ...th, textAlign: 'right' }}>{r}</th>)}
        </tr>
      </thead>
      <tbody>
        {matrixPct.map((row, i) => (
          <tr key={ratings[i]}>
            <td style={{ ...td, fontWeight: 700, color: T.navy, fontFamily: T.mono }}>{ratings[i]}</td>
            {row.map((c, j) => {
              const alpha = Math.min(Math.max(c / 100, 0), 1);
              const bg = j === ratings.length - 1
                ? `rgba(185,28,28,${Math.min(alpha * 3, 0.55).toFixed(3)})`
                : `rgba(197,169,106,${Math.min(alpha, 0.85).toFixed(3)})`;
              return (
                <td key={`${ratings[i]}-${ratings[j]}`} style={{
                  ...td, textAlign: 'right', fontFamily: T.mono, fontSize: 10.5, background: bg,
                  border: i === j ? `1.5px solid ${T.navy}` : undefined,
                }}>
                  {c >= 10 ? c.toFixed(1) : c.toFixed(2)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
    {note && <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>{note}</div>}
  </div>
);

// Editable cells for the portfolio / PCAF tables.
const EditCell = ({ value, onChange, width = 74 }) => (
  <input type="number" step="any" style={{ ...inputStyle, width, padding: '4px 6px', fontSize: 11 }}
    value={value} onChange={(e) => onChange(e.target.value)} />
);
const EditText = ({ value, onChange, width = 130 }) => (
  <input style={{ ...inputStyle, width, padding: '4px 6px', fontSize: 11 }}
    value={value} onChange={(e) => onChange(e.target.value)} />
);
const EditSelect = ({ value, onChange, options, width = 130 }) => (
  <select style={{ ...inputStyle, width, padding: '4px 6px', fontSize: 11 }} value={value} onChange={(e) => onChange(e.target.value)}>
    {options.map((o) => <option key={o} value={o}>{o}</option>)}
  </select>
);

// CSV download (client-side blob — used for the disclosure table export).
function downloadCsv(filename, rows) {
  const csv = rows.map((r) => r.map((c) => {
    const s = String(c ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

const TABS = [
  ['single', 'Single Borrower'],
  ['portfolio', 'Portfolio'],
  ['matrix', 'Climate Matrix'],
  ['pcaf', 'PCAF & Disclosure'],
  ['pricing', 'Pricing Lab'],
];

export default function EnergyTransitionCreditPortalPage() {
  const [tab, setTab] = useState('single');
  const [b, setB] = useState(DEFAULT_B);
  const setF = (k) => (v) => setB((prev) => ({ ...prev, [k]: v }));

  // ── Existing live wiring (kept): Basel IRB/SA + NGFS extract ─────────────
  const [basel, setBasel] = useState({ status: 'idle', irbRw: null, saRw: null, error: null });
  const [ngfs, setNgfs] = useState({ status: 'idle', extract: null, scenRw: null, rwSource: null, params: null, error: null });
  const [horizon, setHorizon] = useState(2035);
  const [gdpBeta, setGdpBeta] = useState(1.5);
  const [carbonPass, setCarbonPass] = useState(0.8);
  const [carbonRefPrice, setCarbonRefPrice] = useState(50);

  // ── NEW transition-credit engine state (one slot per endpoint) ───────────
  // Each: { status: idle|loading|live|demo, data, error } — Demo shows NOTHING
  // fabricated, just the error and a restart hint.
  const [ltel, setLtel] = useState({ status: 'idle', data: null, error: null });   // POST /lifetime-el
  const [amort, setAmort] = useState('linear');
  const [eir, setEir] = useState(6.0);                                             // IFRS 9 EIR, %
  const [cmx, setCmx] = useState({ status: 'idle', data: null, error: null });     // POST /climate-matrix
  const [cmxScenario, setCmxScenario] = useState('net_zero_2050');
  const [cmxSector, setCmxSector] = useState('Gas CCGT (transition)');
  const [cmxRating, setCmxRating] = useState('BBB');
  const [cmxYears, setCmxYears] = useState(10);
  const [cmxOverride, setCmxOverride] = useState('');                              // blank = documented mapping
  const [refMult, setRefMult] = useState({ status: 'idle', data: null, error: null }); // GET /ref/climate-multipliers
  const [pcaf, setPcaf] = useState({ status: 'idle', data: null, error: null });   // POST /pcaf
  const [pcafRows, setPcafRows] = useState(DEFAULT_PCAF);
  const [pcafBasis, setPcafBasis] = useState('evic');
  const [port, setPort] = useState({ status: 'idle', data: null, error: null });   // POST /portfolio
  const [book, setBook] = useState(DEFAULT_BOOK);
  const [pricing, setPricing] = useState({ status: 'idle', data: null, error: null }); // POST /pricing
  const [probs, setProbs] = useState(DEFAULT_PROBS);
  const [prc, setPrc] = useState({
    sector: 'Gas CCGT (transition)', rating: 'BB', ead: 380, tenor: 8, lgdPct: 45,
    marginBps: 310, emissions: 1850000, ebitda: 95, interest: 24, absorption: 0.6,
    currentCarbon: 15, horizonYear: 2035, greenFactorPct: 25,
    stepUp: 25, stepDown: 10, probMeet: 0.6, kpiBaseline: 400, kpiTargetPa: 5.0, kpiProjPa: 3.5,
  });
  const setP = (k) => (v) => setPrc((prev) => ({ ...prev, [k]: v }));

  // ── Base-case scoring (local, documented) ─────────────────────────────────
  const rq = useMemo(
    () => revenueQuality(num(b.ppaRev), num(b.merchantRev), num(b.carbonRev), b.offtakerRating, b.merchantVolPct),
    [b.ppaRev, b.merchantRev, b.carbonRev, b.offtakerRating, b.merchantVolPct],
  );
  const ead = num(b.debt);
  const cm = useMemo(() => creditMetrics(rq, b.lgdPct, ead), [rq, b.lgdPct, ead]);
  const maturity = Math.min(Math.max(num(b.tenor), 1), 5); // Basel effective maturity clamp 1-5y

  // ── Basel engine wiring (existing, kept) ──────────────────────────────────
  const runBasel = useCallback(async () => {
    if (!cm) return;
    setBasel({ status: 'loading', irbRw: null, saRw: null, error: null });
    try {
      const [irbRes, saRes] = await Promise.all([
        axios.post('/api/v1/basel-capital/risk-weight-irb', {
          pd: cm.pd, lgd: cm.lgd, maturity, exposure_class: 'corporates',
        }, { timeout: 20000 }),
        axios.post('/api/v1/basel-capital/risk-weight-sa', {
          exposure_class: 'corporates', credit_quality_step: cm.cqs,
        }, { timeout: 20000 }),
      ]);
      setBasel({ status: 'live', irbRw: irbRes.data?.risk_weight, saRw: saRes.data?.risk_weight, error: null });
    } catch (e) {
      // Fallback: in-page Basel III SA corporate table (real weights, labeled)
      setBasel({ status: 'demo', irbRw: null, saRw: SA_FALLBACK_RW[cm.cqs] ?? 1.0, error: e?.response?.data?.detail || e.message });
    }
  }, [cm, maturity]);

  const baselCalc = useMemo(() => {
    if (!cm || basel.status === 'idle' || basel.status === 'loading') return null;
    const irb = basel.irbRw != null ? raroc(basel.irbRw, ead, b.marginBps, cm.elBps, b.opexBps, b.capRatioPct, b.hurdlePct) : null;
    const sa = basel.saRw != null ? raroc(basel.saRw, ead, b.marginBps, cm.elBps, b.opexBps, b.capRatioPct, b.hurdlePct) : null;
    return { irb, sa };
  }, [cm, basel, ead, b.marginBps, b.opexBps, b.capRatioPct, b.hurdlePct]);

  // ── NGFS wiring + scenario credit re-pricing (existing, kept) ─────────────
  const runNgfs = useCallback(async () => {
    const params = {
      horizon, gdpBeta: num(gdpBeta), carbonPass: num(carbonPass), carbonRefPrice: num(carbonRefPrice),
      base: { ppaRev: num(b.ppaRev), merchantRev: num(b.merchantRev), carbonRev: num(b.carbonRev), offtakerRating: b.offtakerRating, merchantVolPct: b.merchantVolPct },
    };
    setNgfs({ status: 'loading', extract: null, scenRw: null, rwSource: null, params: null, error: null });
    try {
      const { data } = await axios.get('/api/v1/ngfs-extract/scenarios', {
        params: { region: 'World' }, timeout: 20000,
      });
      const idx = data.years.indexOf(params.horizon);
      const scenIds = (data.scenarios || []).map((s) => s.id);
      const stressedPds = scenIds.map((sid) => {
        const stress = stressRevenues(data.data?.[sid]?.World, idx, params.base, params.gdpBeta, params.carbonPass, params.carbonRefPrice);
        if (!stress) return null;
        const srq = revenueQuality(params.base.ppaRev, stress.merchant, stress.carbon, params.base.offtakerRating, params.base.merchantVolPct);
        return srq ? ratingRow(srq.rating).pdPct / 100 : null;
      });
      let scenRw = {}; let rwSource = 'engine';
      try {
        const rws = await Promise.all(stressedPds.map((pd) => (pd == null ? null
          : axios.post('/api/v1/basel-capital/risk-weight-irb', {
            pd, lgd: num(b.lgdPct) / 100, maturity, exposure_class: 'corporates',
          }, { timeout: 20000 }).then((r) => r.data?.risk_weight))));
        scenIds.forEach((sid, i) => { scenRw[sid] = rws[i]; });
      } catch {
        rwSource = 'sa_fallback'; scenRw = null;
      }
      setNgfs({ status: 'live', extract: data, scenRw, rwSource, params, error: null });
    } catch (e) {
      setNgfs({ status: 'demo', extract: null, scenRw: null, rwSource: null, params: null, error: e?.response?.data?.detail || e.message });
    }
  }, [horizon, gdpBeta, carbonPass, carbonRefPrice, b.ppaRev, b.merchantRev, b.carbonRev, b.offtakerRating, b.merchantVolPct, b.lgdPct, maturity]);

  const scenarioRows = useMemo(() => {
    if (ngfs.status !== 'live' || !ngfs.extract || !ngfs.params) return null;
    const data = ngfs.extract;
    const pr = ngfs.params;
    const idx = data.years.indexOf(pr.horizon);
    if (idx < 0) return null;
    return (data.scenarios || []).map((s) => {
      const stress = stressRevenues(data.data?.[s.id]?.World, idx, pr.base, pr.gdpBeta, pr.carbonPass, pr.carbonRefPrice);
      if (!stress) return null;
      const srq = revenueQuality(pr.base.ppaRev, stress.merchant, stress.carbon, pr.base.offtakerRating, pr.base.merchantVolPct);
      const scm = creditMetrics(srq, b.lgdPct, ead);
      const rw = ngfs.scenRw?.[s.id] ?? (scm ? SA_FALLBACK_RW[scm.cqs] : null);
      const rr = scm && rw != null ? raroc(rw, ead, b.marginBps, scm.elBps, b.opexBps, b.capRatioPct, b.hurdlePct) : null;
      return {
        id: s.id, name: s.name || s.id, carbonPrice: stress.carbonPrice, gdpImpact: stress.gdpImpact,
        merchant: stress.merchant, carbon: stress.carbon, totalRev: srq?.total, score: srq?.composite, rating: srq?.rating,
        pdPct: scm?.pdPct, el: scm?.el, elBps: scm?.elBps, rw,
        rarocPct: rr?.rarocPct, floorBps: rr?.floorBps,
      };
    }).filter(Boolean);
  }, [ngfs, b.lgdPct, b.marginBps, b.opexBps, b.capRatioPct, b.hurdlePct, ead]);

  const ngfsMeta = ngfs.extract?.meta;

  // ── NEW: PD term structure + IFRS 9 ECL (POST /lifetime-el) ───────────────
  const runLtel = useCallback(async () => {
    if (!rq) return;
    setLtel({ status: 'loading', data: null, error: null });
    try {
      const { data } = await axios.post('/api/v1/transition-credit/lifetime-el', {
        rating: rq.rating, lgd_pct: num(b.lgdPct), ead: num(b.debt),
        tenor_years: Math.min(Math.max(Math.round(num(b.tenor)), 1), 10),
        amortization: amort, discount_rate_pct: num(eir),
      }, { timeout: 20000 });
      setLtel({ status: 'live', data, error: null });
    } catch (e) {
      setLtel({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
    }
  }, [rq, b.lgdPct, b.debt, b.tenor, amort, eir]);

  // ── NEW: climate-stressed migration matrix (POST /climate-matrix) ─────────
  const runCmx = useCallback(async () => {
    setCmx({ status: 'loading', data: null, error: null });
    try {
      const body = {
        scenario: cmxScenario, sector: cmxSector, rating: cmxRating,
        years: Math.min(Math.max(Math.round(num(cmxYears)), 1), 10),
        lgd_pct: num(b.lgdPct), ead: num(b.debt), amortization: amort,
        discount_rate_pct: num(eir), include_all_scenarios: true,
      };
      if (String(cmxOverride).trim() !== '') body.multiplier_override = num(cmxOverride);
      const { data } = await axios.post('/api/v1/transition-credit/climate-matrix', body, { timeout: 30000 });
      setCmx({ status: 'live', data, error: null });
    } catch (e) {
      setCmx({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
    }
    // Multiplier mapping reference (idempotent; shown alongside the matrices)
    if (refMult.status === 'idle') {
      try {
        const { data } = await axios.get('/api/v1/transition-credit/ref/climate-multipliers', { timeout: 20000 });
        setRefMult({ status: 'live', data, error: null });
      } catch (e) {
        setRefMult({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
      }
    }
  }, [cmxScenario, cmxSector, cmxRating, cmxYears, cmxOverride, b.lgdPct, b.debt, amort, eir, refMult.status]);

  // ── NEW: PCAF financed emissions (POST /pcaf) ─────────────────────────────
  const runPcaf = useCallback(async () => {
    setPcaf({ status: 'loading', data: null, error: null });
    try {
      const exposures = pcafRows.map((r) => ({
        name: r.name, sector: r.sector, outstanding_m: num(r.outstanding_m),
        evic_m: String(r.evic_m).trim() === '' ? null : num(r.evic_m),
        total_equity_debt_m: String(r.total_equity_debt_m).trim() === '' ? null : num(r.total_equity_debt_m),
        revenue_m: String(r.revenue_m).trim() === '' ? null : num(r.revenue_m),
        emissions_tco2: num(r.emissions_tco2),
        scope3_tco2: String(r.scope3_tco2).trim() === '' ? null : num(r.scope3_tco2),
        data_quality: Math.min(Math.max(Math.round(num(r.data_quality)) || 3, 1), 5),
        itr_c: String(r.itr_c).trim() === '' ? null : num(r.itr_c),
      }));
      const { data } = await axios.post('/api/v1/transition-credit/pcaf', {
        exposures, attribution_basis: pcafBasis,
      }, { timeout: 20000 });
      setPcaf({ status: 'live', data, error: null });
    } catch (e) {
      setPcaf({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
    }
  }, [pcafRows, pcafBasis]);

  // ── NEW: portfolio mode (POST /portfolio) ─────────────────────────────────
  const runPort = useCallback(async () => {
    setPort({ status: 'loading', data: null, error: null });
    try {
      const borrowers = book.map((r) => ({
        name: r.name, sector: r.sector, rating: r.rating, ead_m: num(r.ead_m),
        margin_bps: num(r.margin_bps), lgd_pct: num(r.lgd_pct),
        tenor_years: Math.min(Math.max(Math.round(num(r.tenor_years)) || 7, 1), 10),
        revenue_m: String(r.revenue_m).trim() === '' ? null : num(r.revenue_m),
        evic_m: String(r.evic_m).trim() === '' ? null : num(r.evic_m),
        emissions_tco2: num(r.emissions_tco2),
        data_quality: Math.min(Math.max(Math.round(num(r.data_quality)) || 3, 1), 5),
        itr_c: String(r.itr_c).trim() === '' ? null : num(r.itr_c),
      }));
      const { data } = await axios.post('/api/v1/transition-credit/portfolio', {
        borrowers, opex_bps: num(b.opexBps), cap_ratio_pct: num(b.capRatioPct),
        hurdle_pct: num(b.hurdlePct), discount_rate_pct: num(eir),
      }, { timeout: 30000 });
      setPort({ status: 'live', data, error: null });
    } catch (e) {
      setPort({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
    }
  }, [book, b.opexBps, b.capRatioPct, b.hurdlePct, eir]);

  // ── NEW: sustainability-adjusted pricing lab (POST /pricing) ──────────────
  const probSum = useMemo(() => SCENARIO_IDS.reduce((s, k) => s + num(probs[k]), 0), [probs]);
  const runPricing = useCallback(async () => {
    setPricing({ status: 'loading', data: null, error: null });
    try {
      const body = {
        rating: prc.rating, sector: prc.sector, ead: num(prc.ead),
        tenor_years: Math.min(Math.max(Math.round(num(prc.tenor)), 1), 10),
        lgd_pct: num(prc.lgdPct), margin_bps: num(prc.marginBps),
        opex_bps: num(b.opexBps), cap_ratio_pct: num(b.capRatioPct), hurdle_pct: num(b.hurdlePct),
        amortization: amort, discount_rate_pct: num(eir),
        scenario_probs: Object.fromEntries(SCENARIO_IDS.map((k) => [k, num(probs[k])])),
        horizon_year: num(prc.horizonYear),
        emissions_tco2: num(prc.emissions), ebitda_m: num(prc.ebitda), interest_m: num(prc.interest),
        carbon_cost_absorption: num(prc.absorption), current_carbon_cost_usd_t: num(prc.currentCarbon),
        green_rw_factor_pct: num(prc.greenFactorPct),
        sll: {
          step_up_bps: num(prc.stepUp), step_down_bps: num(prc.stepDown), prob_meet: num(prc.probMeet),
          kpi_baseline: num(prc.kpiBaseline), kpi_target_reduction_pct_pa: num(prc.kpiTargetPa),
          kpi_projected_reduction_pct_pa: num(prc.kpiProjPa),
        },
      };
      // Pass the live IRB risk weight through when the Basel engine has priced
      // one on the Single Borrower tab (badged in the panel); SA table otherwise.
      if (basel.status === 'live' && basel.irbRw != null) body.risk_weight = basel.irbRw;
      const { data } = await axios.post('/api/v1/transition-credit/pricing', body, { timeout: 30000 });
      setPricing({ status: 'live', data, error: null });
    } catch (e) {
      setPricing({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
    }
  }, [prc, probs, amort, eir, b.opexBps, b.capRatioPct, b.hurdlePct, basel.status, basel.irbRw]);

  // Editable-table row helpers
  const setBookCell = (i, k) => (v) => setBook((prev) => prev.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const setPcafCell = (i, k) => (v) => setPcafRows((prev) => prev.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const addBookRow = () => setBook((prev) => (prev.length >= 10 ? prev : [...prev, { name: `Borrower ${prev.length + 1}`, sector: 'Other', rating: 'BBB', ead_m: 100, margin_bps: 250, lgd_pct: 45, tenor_years: 7, revenue_m: 50, evic_m: 250, emissions_tco2: 50000, data_quality: 3, itr_c: '' }]));
  const dropBookRow = (i) => setBook((prev) => (prev.length <= 2 ? prev : prev.filter((_, j) => j !== i)));
  const addPcafRow = () => setPcafRows((prev) => (prev.length >= 10 ? prev : [...prev, { name: `Exposure ${prev.length + 1}`, sector: 'Other', outstanding_m: 100, evic_m: 250, total_equity_debt_m: '', revenue_m: 50, emissions_tco2: 50000, scope3_tco2: '', data_quality: 3, itr_c: '' }]));
  const dropPcafRow = (i) => setPcafRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== i)));

  // ── Derived chart data for the new tabs ───────────────────────────────────
  const fanData = useMemo(() => {
    if (cmx.status !== 'live' || !cmx.data?.evolution) return null;
    return cmx.data.evolution.map((e) => {
      const row = { year: `Y${e.year}` };
      RATINGS_ALL.forEach((r) => { row[r] = (e.stressed[r] ?? 0) * 100; });
      return row;
    });
  }, [cmx]);
  const cumDefaultData = useMemo(() => {
    if (cmx.status !== 'live' || !cmx.data?.evolution) return null;
    return cmx.data.evolution.map((e) => ({
      year: `Y${e.year}`,
      baseline: (e.baseline.D ?? 0) * 100,
      stressed: (e.stressed.D ?? 0) * 100,
    }));
  }, [cmx]);
  const allScenElData = useMemo(() => {
    if (cmx.status !== 'live' || !cmx.data?.all_scenarios) return null;
    return cmx.data.all_scenarios.map((s) => ({
      name: SCEN_LABEL[s.scenario] || s.scenario, id: s.scenario,
      el: s.lifetime_el, elBps: s.annualized_el_bps, cumPd: s.cumulative_pd_pct, mult: s.multiplier,
    }));
  }, [cmx]);
  const scenBookData = useMemo(() => {
    if (port.status !== 'live' || !port.data?.scenario_book_el) return null;
    return port.data.scenario_book_el.map((r) => ({
      name: SCEN_LABEL[r.scenario] || r.scenario, id: r.scenario,
      el: r.book_lifetime_el_m, delta: r.delta_vs_baseline_m, pctEad: r.el_pct_of_ead,
    }));
  }, [port]);
  const olsChart = useMemo(() => {
    const ols = port.status === 'live' ? port.data?.ols_intensity_vs_margin : null;
    if (!ols) return null;
    return {
      points: ols.points.map((p) => ({ x: p.intensity, y: p.margin_bps, name: p.name })),
      line: ols.fit_line.map((p) => ({ x: p.intensity, lineY: p.margin_bps })),
      slope: ols.slope_bps_per_tco2_ead_m, intercept: ols.intercept_bps, r2: ols.r2, n: ols.n,
      interpretation: ols.interpretation,
    };
  }, [port]);
  const sllChart = useMemo(() => {
    if (pricing.status !== 'live' || !pricing.data?.sll_ratchet?.rows) return null;
    return pricing.data.sll_ratchet.rows.map((r) => ({
      year: `Y${r.year}`, target: r.kpi_target, projected: r.kpi_projected,
      margin: r.expected_margin_bps, onTrack: r.on_track,
    }));
  }, [pricing]);

  const exportDisclosureCsv = () => {
    const d = port.data?.disclosure;
    const bk = port.data?.book;
    if (!d || !bk) return;
    downloadCsv('tcfd_issb_disclosure_metrics.csv', [
      ['Metric', 'Value', 'Unit', 'Basis'],
      ['Financed emissions (scope 1+2)', d.financed_scope12_tco2?.toFixed(0), 'tCO2e/yr', 'PCAF attribution, borrower scope 1+2'],
      ['Financed emissions intensity', d.financed_intensity_tco2_per_ead_m?.toFixed(2), 'tCO2e per $M EAD', 'attributed emissions / total EAD'],
      ['WACI', d.waci_tco2_per_revenue_m?.toFixed(2), 'tCO2e per $M revenue', 'EAD-weighted borrower scope1+2/revenue'],
      ['Weighted ITR', d.weighted_itr_c?.toFixed(2), 'degC', 'EAD-weighted; sector proxies where borrower ITR missing'],
      ['Weighted PCAF data quality', d.weighted_pcaf_dq?.toFixed(2), 'score 1-5', 'EAD-weighted'],
      ['Carbon-related assets', d.carbon_related_assets_pct?.toFixed(1), '% of EAD', d.carbon_related_definition],
      ['Climate VaR proxy (min scenario EL)', d.climate_var_proxy?.min_el_m?.toFixed(2), '$M lifetime EL', 'six NGFS scenarios'],
      ['Climate VaR proxy (max scenario EL)', d.climate_var_proxy?.max_el_m?.toFixed(2), '$M lifetime EL', 'six NGFS scenarios'],
      ['Climate VaR proxy (range)', d.climate_var_proxy?.range_m?.toFixed(2), '$M', d.climate_var_proxy?.definition],
      ['Book RAROC', bk.raroc_pct?.toFixed(2), '%', 'sum(net income)/sum(capital), SA weights'],
      ['Book 1-yr EL', bk.el_1y_m?.toFixed(2), '$M', 'PD ladder x LGD x EAD'],
      ['Total EAD', bk.total_ead_m?.toFixed(1), '$M', `${bk.n_borrowers} borrowers`],
    ]);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.teal, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>NX2-15</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Energy Transition Credit Portal</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Basel Capital Engine</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>NGFS Phase 5 Extract</span>
          <span style={{ background: T.teal + '22', color: T.teal, border: `1px solid ${T.teal}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Transition-Credit Engine</span>
          <span style={{ background: T.gold + '33', color: T.amber, border: `1px solid ${T.gold}66`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>IFRS 9 · PCAF · TCFD/ISSB</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 14, maxWidth: 1100 }}>
        The desk's deepest sustainability × financial credit view. Single borrower: revenue quality → implied rating
        → PD/LGD/EL → Basel risk weight (live IRB + SA) → RAROC/floor → NGFS re-pricing, plus a full 1–10y PD term
        structure with IFRS 9 stage-1 vs stage-2 ECL. Climate Matrix: the analytical core — a hand-authored
        migration matrix, its NGFS-scenario-stressed version and the multi-year rating-distribution fan. Portfolio:
        a 5–10 name book with scenario-conditional EL, intensity-vs-margin OLS and concentration. PCAF &
        Disclosure: financed emissions with the full data-quality ladder and a TCFD/ISSB metrics panel. Pricing
        Lab: climate-adjusted RAROC, carbon-cost margin erosion, the green risk-weight policy debate and the SLL
        ratchet. Every table, weight and formula is shown in-page; heavy math runs server-side (badged).
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap', borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: tab === id ? T.navy : 'transparent', color: tab === id ? '#fff' : T.slate,
            border: `1px solid ${tab === id ? T.navy : T.border}`, borderBottom: 'none',
            borderRadius: '8px 8px 0 0', padding: '9px 18px', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: T.font,
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* ═══ TAB 1 · SINGLE BORROWER ═══════════════════════════════════════ */}
      {tab === 'single' && (
        <>
          {/* Borrower profile */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2}>Borrower Profile & Revenue Streams</h2>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                Editable defaults — hand-authored illustrative borrower, not live data
              </span>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 4, width: 220 }}>
                Borrower
                <input style={inputStyle} value={b.name} onChange={(e) => setF('name')(e.target.value)} />
              </label>
              <SelectField label="Sector" value={b.sector} onChange={setF('sector')} options={SECTORS} width={190} />
              <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 4, width: 140 }}>
                Country
                <input style={inputStyle} value={b.country} onChange={(e) => setF('country')(e.target.value)} />
              </label>
              <Field label="Debt outstanding (EAD)" unit="$M" value={b.debt} onChange={setF('debt')} />
              <Field label="Remaining tenor" unit="yrs" value={b.tenor} onChange={setF('tenor')} width={110} />
              <Field label="LGD" unit="%" value={b.lgdPct} onChange={setF('lgdPct')} width={100} />
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Field label="PPA-contracted revenue" unit="$M/yr" value={b.ppaRev} onChange={setF('ppaRev')} />
              <SelectField label="Offtaker rating" value={b.offtakerRating} onChange={setF('offtakerRating')} options={NON_DEFAULT_RATINGS} width={140} />
              <Field label="Merchant revenue" unit="$M/yr" value={b.merchantRev} onChange={setF('merchantRev')} />
              <Field label="Merchant price vol" unit="% p.a." value={b.merchantVolPct} onChange={setF('merchantVolPct')} width={130} />
              <Field label="Carbon-credit revenue" unit="$M/yr" value={b.carbonRev} onChange={setF('carbonRev')} />
            </div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 8 }}>
              LGD default 45% = Basel foundation-IRB senior unsecured (CRR Art 161). Set lower for well-secured project
              structures with strong covenant packages, higher for structurally subordinated positions.
            </div>
          </div>

          {/* Revenue quality + credit metrics */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2}>Revenue-Quality Score → Implied Rating → PD / LGD / EL</h2>
              <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                ◆ Local scorecard — hand-authored weights & tables, all shown below
              </span>
            </div>
            <div style={formulaBox}>
              Composite = 40% × contracted-share + 25% × offtaker-rating + 20% × merchant-exposure + 15% × carbon-exposure
              (sub-scores 0–100). &nbsp;contracted-share = PPA% of revenue × 100 · offtaker map AAA 100 / AA 92 / A 85 /
              BBB 70 / BB 50 / B 30 / CCC 10 · merchant = 100 − merchant% × (vol ÷ 35) · carbon = 100 − carbon% × 1.5
              (carbon revenue treated as least bankable). Score→rating bands: ≥85 A · 70–85 BBB · 55–70 BB · 40–55 B ·
              &lt;40 CCC (capped at A: single-asset project borrowers rarely rate higher). Rating→PD: hand-authored
              approximation of the S&P Global 1981–2023 corporate default study long-run 1-yr averages, IG floored near
              the CRR3 5 bps PD floor. EL = PD × LGD × EAD.
            </div>
            {rq && cm && (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <Kpi label="Total revenue" value={fmtM(rq.total, 1)} sub={`PPA ${fmtPct(rq.shContract * 100, 0)} · merchant ${fmtPct(rq.shMerchant * 100, 0)} · carbon ${fmtPct(rq.shCarbon * 100, 0)}`} />
                  <Kpi label="Revenue-quality score" value={fmtNum(rq.composite, 1)} sub="0–100 · weights 40/25/20/15" color={T.indigo} />
                  <Kpi label="Implied rating" value={rq.rating} sub={`CQS ${cm.cqs} (ECAI mapping)`} color={T.navy} />
                  <Kpi label="PD (1-yr)" value={fmtPct(cm.pdPct, 2)} sub="S&P study basis, approximate" color={T.amber} />
                  <Kpi label="LGD" value={fmtPct(num(b.lgdPct), 0)} sub="input" />
                  <Kpi label="Expected loss" value={fmtM(cm.el, 2)} sub={`${fmtBps(cm.elBps, 1)} of EAD ${fmtM(ead, 0)}`} color={T.red} />
                </div>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 320 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Scorecard decomposition (weight × sub-score)</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={th}>Factor</th><th style={th}>Weight</th><th style={th}>Sub-score</th><th style={th}>Contribution</th></tr></thead>
                      <tbody>
                        {[
                          ['Contracted share', RQ_WEIGHTS.contracted, rq.sContracted],
                          [`Offtaker rating (${b.offtakerRating})`, RQ_WEIGHTS.offtaker, rq.sOfftaker],
                          ['Merchant exposure', RQ_WEIGHTS.merchant, rq.sMerchant],
                          ['Carbon-price exposure', RQ_WEIGHTS.carbon, rq.sCarbon],
                        ].map(([f, w, s]) => (
                          <tr key={f}>
                            <td style={{ ...td, fontWeight: 600, color: T.navy }}>{f}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(w * 100, 0)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(s, 1)}</td>
                            <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{fmtNum(w * s, 1)}</td>
                          </tr>
                        ))}
                        <tr>
                          <td style={{ ...td, fontWeight: 700 }}>Composite</td><td style={td} />
                          <td style={td} /><td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: T.indigo }}>{fmtNum(rq.composite, 1)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ flex: 1, minWidth: 320 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                      Rating → PD ladder (hand-authored, approx. S&P 1981–2023 study) — implied rating highlighted
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={th}>Rating</th><th style={th}>1-yr PD</th><th style={th}>CQS</th><th style={th}>EL on this EAD</th></tr></thead>
                      <tbody>
                        {RATING_LADDER.map((r) => (
                          <tr key={r.rating} style={r.rating === rq.rating ? { background: T.gold + '22' } : undefined}>
                            <td style={{ ...td, fontWeight: r.rating === rq.rating ? 800 : 600, color: T.navy }}>{r.rating}{r.rating === rq.rating ? ' ◄' : ''}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(r.pdPct, 2)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{r.cqs}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtM((r.pdPct / 100) * (num(b.lgdPct) / 100) * ead, 2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* NEW: PD term structure + IFRS 9 ECL */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2}>PD Term Structure & IFRS 9 ECL — 12-Month vs Lifetime</h2>
              <span style={endpointChip}>POST /api/v1/transition-credit/lifetime-el</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge status={ltel.status} demoText={ltel.error} />
                <button onClick={runLtel} disabled={!rq} style={btnStyle(!!rq)}>Compute ECL term structure →</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
              <SelectField label="EAD amortization profile" value={amort} onChange={setAmort}
                options={[['bullet', 'Bullet (constant EAD)'], ['linear', 'Linear (straight-line, mid-year)']]} width={230} />
              <Field label="Discount rate (EIR)" unit="%" value={eir} onChange={setEir} width={150} />
            </div>
            <div style={formulaBox}>
              Server-side (deterministic): cumulative PD curve per rating = hand-authored anchors at years 1/3/5/7/10
              approximating the S&P Global 1981–2023 cumulative default tables, linearly interpolated (year-1 values
              equal the ladder above; full curves at GET /ref/pd-term-structure). Marginal PD_t = cumPD_t − cumPD_(t−1);
              conditional PD_t = marginal ÷ survival. IFRS 9: <b>stage-1 12-month ECL</b> = mPD₁ × LGD × EAD₁ × DF(0.5);
              <b> stage-2 lifetime ECL</b> = Σ_t mPD_t × LGD × EAD_t × DF(t−0.5), mid-year discounting at the EIR — the
              stage-2/stage-1 gap is the cliff a SICR trigger books on transition. Tenor is capped at 10y (curve length).
            </div>
            {ltel.status === 'live' && ltel.data && (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <Kpi label="Stage-1 ECL (12-month)" value={fmtM(ltel.data.ecl_12m, 3)} sub="IFRS 9 performing" color={T.teal} />
                  <Kpi label="Stage-2 ECL (lifetime)" value={fmtM(ltel.data.ecl_lifetime, 3)} sub="on SICR transfer" color={T.red} />
                  <Kpi label="Lifetime ÷ 12-month" value={`${fmtNum(ltel.data.lifetime_to_12m_ratio, 1)}×`} sub="stage-transfer cliff" color={T.amber} />
                  <Kpi label="Rating / profile" value={`${ltel.data.inputs?.rating} · ${ltel.data.inputs?.amortization}`} sub={`EIR ${fmtPct(num(eir), 1)} · tenor ${ltel.data.inputs?.tenor_years}y`} />
                </div>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 380 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Per-year term structure (engine output)</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={th}>Yr</th><th style={th}>Marg. PD</th><th style={th}>Cum. PD</th><th style={th}>Cond. PD</th><th style={th}>EAD $M</th><th style={th}>DF</th><th style={th}>EL $M</th></tr></thead>
                      <tbody>
                        {ltel.data.term_structure.map((r) => (
                          <tr key={r.year} style={r.year === 1 ? { background: T.teal + '11' } : undefined}>
                            <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{r.year}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(r.marginal_pd_pct, 3)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(r.cumulative_pd_pct, 2)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(r.conditional_pd_pct, 3)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.ead, 0)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.discount_factor, 3)}</td>
                            <td style={{ ...td, fontFamily: T.mono, color: T.red, fontWeight: 700 }}>{fmtNum(r.el, 3)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ flex: 1, minWidth: 380 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Discounted EL by year (bars) + cumulative PD (line)</div>
                    <ResponsiveContainer width="100%" height={280}>
                      <ComposedChart data={ltel.data.term_structure} margin={{ right: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: 'year', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                        <YAxis yAxisId="l" tick={{ fontSize: 10 }} label={{ value: 'EL $M', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                        <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} label={{ value: 'cum PD %', angle: 90, position: 'insideRight', fontSize: 10 }} />
                        <Tooltip formatter={(v, n) => [fmtNum(v, 3), n]} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar yAxisId="l" dataKey="el" name="Discounted EL $M" fill={T.red} fillOpacity={0.7} radius={[3, 3, 0, 0]} />
                        <Line yAxisId="r" type="monotone" dataKey="cumulative_pd_pct" name="Cumulative PD %" stroke={T.indigo} strokeWidth={2} dot={{ r: 2 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
            {ltel.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Transition-credit engine unreachable — no figures shown (this page never fabricates results). Error: {String(ltel.error)}. If the route was recently added, restart the backend to register /api/v1/transition-credit.</div>}
            {ltel.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Uses the implied rating from the scorecard above ({rq ? rq.rating : '—'}), the EAD and LGD inputs, and the amortization/EIR knobs here. All math server-side, tables documented at /ref/pd-term-structure.</div>}
          </div>

          {/* Basel / RAROC panel (existing live wiring, kept) */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2}>Basel Capital & RAROC Pricing Floor</h2>
              <span style={endpointChip}>POST /api/v1/basel-capital/risk-weight-irb + /risk-weight-sa</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge status={basel.status} demoText={basel.error ? `${basel.error} — using in-page Basel III SA table` : null} />
                <button onClick={runBasel} disabled={!cm} style={btnStyle(!!cm)}>Compute risk weight & RAROC →</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
              <Field label="Margin over base" unit="bps" value={b.marginBps} onChange={setF('marginBps')} width={130} />
              <Field label="Opex + origination" unit="bps" value={b.opexBps} onChange={setF('opexBps')} width={130} />
              <Field label="Capital ratio on RWA" unit="%" value={b.capRatioPct} onChange={setF('capRatioPct')} width={140} />
              <Field label="Hurdle (pre-tax RoC)" unit="%" value={b.hurdlePct} onChange={setF('hurdlePct')} width={140} />
            </div>
            <div style={formulaBox}>
              RWA = RW × EAD (RW from the live engine: IRB per CRR Art 153 with PD {cm ? fmtPct(cm.pdPct, 2) : '—'},
              LGD {fmtPct(num(b.lgdPct), 0)}, M = min(tenor, 5) = {fmtNum(maturity, 1)}y; SA per CRR Art 122 at CQS {cm ? cm.cqs : '—'}).
              &nbsp;capital = RWA × capital ratio ({fmtPct(num(b.capRatioPct), 1)} = 8% minimum + 2.5% CCB by default) ·
              RAROC = (margin − EL − opex) × EAD ÷ capital · pricing-floor margin = EL bps + opex bps + hurdle × capital
              ratio × RW × 10⁴. If the engine is unreachable the in-page Basel III SA corporate table
              (CQS 1→20% · 2→50% · 3/4→100% · 5/6→150%, CRE20.16) is used and badged Demo. The live IRB weight
              computed here is passed through to the Pricing Lab tab (badged there).
            </div>
            {baselCalc && (basel.status === 'live' || basel.status === 'demo') && (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  {baselCalc.irb && (
                    <>
                      <Kpi label="IRB risk weight" value={fmtPct(basel.irbRw * 100, 1)} sub="CRR Art 153 — live engine" color={T.blue} />
                      <Kpi label="IRB RWA" value={fmtM(baselCalc.irb.rwa, 0)} sub={`capital ${fmtM(baselCalc.irb.capital, 1)}`} />
                      <Kpi label="RAROC (IRB)" value={fmtPct(baselCalc.irb.rarocPct, 1)}
                        sub={`hurdle ${fmtPct(num(b.hurdlePct), 0)} — ${baselCalc.irb.meetsHurdle ? 'clears' : 'BELOW hurdle'}`}
                        color={baselCalc.irb.meetsHurdle ? T.green : T.red} />
                      <Kpi label="Pricing floor (IRB)" value={fmtBps(baselCalc.irb.floorBps)} sub={`vs quoted margin ${fmtBps(num(b.marginBps))}`}
                        color={num(b.marginBps) >= baselCalc.irb.floorBps ? T.green : T.red} />
                    </>
                  )}
                  {baselCalc.sa && (
                    <>
                      <Kpi label={basel.status === 'live' ? 'SA risk weight' : 'SA risk weight (in-page table)'} value={fmtPct(basel.saRw * 100, 0)}
                        sub={basel.status === 'live' ? 'CRR Art 122 — live engine' : 'Basel III CRE20.16 — in-page fallback'} color={T.purple} />
                      <Kpi label="RAROC (SA)" value={fmtPct(baselCalc.sa.rarocPct, 1)} color={baselCalc.sa.meetsHurdle ? T.green : T.red} />
                      <Kpi label="Pricing floor (SA)" value={fmtBps(baselCalc.sa.floorBps)} sub={`vs quoted margin ${fmtBps(num(b.marginBps))}`}
                        color={num(b.marginBps) >= baselCalc.sa.floorBps ? T.green : T.red} />
                    </>
                  )}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th style={th}>Approach</th><th style={th}>RW</th><th style={th}>RWA ($M)</th><th style={th}>Capital ($M)</th>
                      <th style={th}>Margin − EL − opex (bps)</th><th style={th}>Net income ($M)</th><th style={th}>RAROC</th><th style={th}>Floor margin</th></tr>
                  </thead>
                  <tbody>
                    {[['IRB (CRR Art 153)', basel.irbRw, baselCalc.irb], [basel.status === 'live' ? 'SA (CRR Art 122)' : 'SA (in-page Basel III table)', basel.saRw, baselCalc.sa]]
                      .filter(([, rw, r]) => rw != null && r)
                      .map(([name, rw, r]) => (
                        <tr key={name}>
                          <td style={{ ...td, fontWeight: 700, color: T.navy }}>{name}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(rw * 100, 1)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.rwa, 0)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.capital, 1)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.netBps, 1)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.netIncome, 2)}</td>
                          <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: r.meetsHurdle ? T.green : T.red }}>{fmtPct(r.rarocPct, 1)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtBps(r.floorBps)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </>
            )}
            {basel.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Set the pricing inputs and compute — the risk weight comes from the live Basel engine (IRB + SA), then RAROC and the margin floor are derived locally with the documented formula.</div>}
          </div>

          {/* NGFS scenario panel (existing live wiring, kept) */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2}>NGFS Phase 5 Scenario Deltas — EL / RAROC Under Transition Paths</h2>
              <span style={endpointChip}>GET /api/v1/ngfs-extract/scenarios?region=World</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge status={ngfs.status} demoText={ngfs.error} />
                <button onClick={runNgfs} style={btnStyle()}>Run scenario analysis →</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
              <SelectField label="Horizon year" value={horizon} onChange={(v) => setHorizon(parseInt(v, 10))} options={NGFS_YEARS.map((y) => [String(y), String(y)])} width={120} />
              <Field label="Merchant GDP beta β" unit="× GDP pp" value={gdpBeta} onChange={setGdpBeta} width={150} />
              <Field label="Carbon-price pass-through" unit="0–1" value={carbonPass} onChange={setCarbonPass} width={170} />
              <Field label="Credit price realized today P_ref" unit="$/tCO2" value={carbonRefPrice} onChange={setCarbonRefPrice} width={190} />
            </div>
            <div style={formulaBox}>
              Sensitivity mapping (hand-authored, parameters above): merchant′ = merchant × (1 + β × GDP-impact% ÷ 100)
              where GDP-impact = the scenario's GDP deviation vs the no-climate-change baseline at the horizon (NGFS
              Phase 5 damage-function variable; β default 1.5 — merchant power revenue is levered to activity) ·
              carbon′ = carbon × max(0, 1 + pass-through × (P_scenario − P_ref) ∕ P_ref) on the World shadow carbon
              price, anchored to the credit price the borrower realizes today (pass-through default 0.8 — realized
              credit prices track but lag the shadow price) · PPA revenue unchanged (fixed-price offtake). The stressed
              revenue mix re-runs the same scorecard → rating → PD → EL chain, and the IRB risk weight is re-priced per
              scenario via the live Basel engine{ngfs.rwSource === 'sa_fallback' ? ' (engine unreachable for re-pricing — in-page SA fallback weights in use)' : ''}.
              Parameters are frozen at run time — change a knob and re-run to keep the table consistent with the
              engine-priced risk weights. Current Policies is shown as the hot-house reference row. For the
              rating-migration view of the same six scenarios, see the Climate Matrix tab.
            </div>
            {ngfs.status === 'live' && ngfsMeta && (
              <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, marginBottom: 10 }}>
                Source: {ngfsMeta.source} · {ngfsMeta.release} · values approximate marker-model outputs — refresh from
                data.ene.iiasa.ac.at/ngfs for production precision.
              </div>
            )}
            {scenarioRows && scenarioRows.length > 0 && (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                  <thead>
                    <tr>
                      <th style={th}>Scenario ({ngfs.params?.horizon ?? horizon}, World)</th><th style={th}>Carbon $/t</th><th style={th}>GDP impact (pp)</th>
                      <th style={th}>Merchant $M</th><th style={th}>Carbon $M</th><th style={th}>Total rev $M</th>
                      <th style={th}>Score</th><th style={th}>Rating</th><th style={th}>PD</th><th style={th}>EL $M</th>
                      <th style={th}>RW</th><th style={th}>RAROC</th><th style={th}>Floor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarioRows.map((r) => (
                      <tr key={r.id} style={r.id === 'current_policies' ? { background: T.cream } : undefined}>
                        <td style={{ ...td, fontWeight: 700, color: T.navy }}>{r.name}{r.id === 'current_policies' ? ' (baseline)' : ''}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.carbonPrice, 0)}</td>
                        <td style={{ ...td, fontFamily: T.mono, color: r.gdpImpact >= 0 ? T.green : T.red }}>{r.gdpImpact >= 0 ? '+' : ''}{fmtNum(r.gdpImpact, 1)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.merchant, 1)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.carbon, 1)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.totalRev, 1)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.score, 1)}</td>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{r.rating}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(r.pdPct, 2)}</td>
                        <td style={{ ...td, fontFamily: T.mono, color: T.red }}>{fmtNum(r.el, 2)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{r.rw != null ? fmtPct(r.rw * 100, 0) : '—'}</td>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: r.rarocPct != null && r.rarocPct >= num(b.hurdlePct) ? T.green : T.red }}>{fmtPct(r.rarocPct, 1)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtBps(r.floorBps)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={scenarioRows} margin={{ bottom: 55, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" interval={0} />
                    <YAxis yAxisId="l" tick={{ fontSize: 10 }} label={{ value: 'EL $M', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} label={{ value: 'RAROC %', angle: 90, position: 'insideRight', fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [fmtNum(v, 2), n]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine yAxisId="r" y={num(b.hurdlePct)} stroke={T.amber} strokeDasharray="4 4" label={{ value: `hurdle ${fmtPct(num(b.hurdlePct), 0)}`, fontSize: 9, fill: T.amber }} />
                    <Bar yAxisId="l" dataKey="el" name="Expected loss $M" radius={[3, 3, 0, 0]}>
                      {scenarioRows.map((r) => <Cell key={r.id} fill={r.id === 'current_policies' ? T.slate : T.red} fillOpacity={0.75} />)}
                    </Bar>
                    <Line yAxisId="r" type="monotone" dataKey="rarocPct" name="RAROC %" stroke={T.indigo} strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </>
            )}
            {ngfs.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>NGFS extract endpoint unreachable — no scenario figures shown (this page never fabricates results). Error: {String(ngfs.error)}. If the route was recently added, restart the backend to register /api/v1/ngfs-extract.</div>}
            {ngfs.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Run the scenario analysis to pull the seeded NGFS Phase 5 extract (World region) and re-price EL and RAROC under each transition path.</div>}
          </div>

          {/* Integration note */}
          <div style={{ ...card, background: '#fbf8f1' }}>
            <h2 style={{ ...h2, marginBottom: 8 }}>Where to go deeper</h2>
            <div style={{ fontSize: 12, color: T.slate, lineHeight: 1.8 }}>
              This tab is the integrated single-borrower view; the other tabs deepen it (migration matrix, book,
              PCAF, pricing lab). For the underlying structure and rating machinery (text references — open from
              the nav):<br />
              · <b>/project-finance-debt-sizer</b> — DSCR-based debt capacity, sculpted amortization and covenant
              headroom for the same borrower's cash flows (feeds the "debt outstanding" input here).<br />
              · <b>/pf-credit-rating-engine</b> — full project-finance rating scorecard (construction, operation,
              counterparty and structure factors) replacing this page's revenue-quality shortcut.<br />
              · <b>/green-securitization</b> — takeout economics if the loan is refinanced in the ABS market.
            </div>
          </div>
        </>
      )}

      {/* ═══ TAB 2 · PORTFOLIO ═════════════════════════════════════════════ */}
      {tab === 'portfolio' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2}>Transition Lending Book — Editable ({book.length} borrowers, 2–10)</h2>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                Hand-authored illustrative book — not live data
              </span>
              <span style={endpointChip}>POST /api/v1/transition-credit/portfolio</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge status={port.status} demoText={port.error} />
                <button onClick={runPort} style={btnStyle()}>Run book analytics →</button>
              </div>
            </div>
            <div style={formulaBox}>
              Server-side per borrower: 1-yr EL = ladder PD × LGD × EAD · RAROC on the CRE20.16 SA risk weight ·
              lifetime EL under the baseline AND all six climate-stressed migration matrices (Climate Matrix tab
              machinery, bullet EAD, EIR {fmtPct(num(eir), 1)}) · PCAF attribution (outstanding ÷ EVIC; where EVIC is
              blank the engine uses a labeled 2×EAD proxy). Book: RAROC = Σ net income ÷ Σ capital · HHI on EAD shares ·
              OLS of margin on financed-emissions intensity (does the book price transition risk?). Opex
              {' '}{fmtBps(num(b.opexBps))}, capital ratio {fmtPct(num(b.capRatioPct), 1)}, hurdle {fmtPct(num(b.hurdlePct), 0)} come from the Single Borrower tab.
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
                <thead>
                  <tr>
                    <th style={th}>Borrower</th><th style={th}>Sector</th><th style={th}>Rating</th>
                    <th style={th}>EAD $M</th><th style={th}>Margin bps</th><th style={th}>LGD %</th><th style={th}>Tenor y</th>
                    <th style={th}>Revenue $M</th><th style={th}>EVIC $M</th><th style={th}>Scope 1+2 tCO2e</th>
                    <th style={th}>PCAF DQ</th><th style={th}>ITR °C</th><th style={th} />
                  </tr>
                </thead>
                <tbody>
                  {book.map((r, i) => (
                    <tr key={i}>
                      <td style={td}><EditText value={r.name} onChange={setBookCell(i, 'name')} width={150} /></td>
                      <td style={td}><EditSelect value={r.sector} onChange={setBookCell(i, 'sector')} options={SECTORS_EXT} width={150} /></td>
                      <td style={td}><EditSelect value={r.rating} onChange={setBookCell(i, 'rating')} options={NON_DEFAULT_RATINGS} width={64} /></td>
                      <td style={td}><EditCell value={r.ead_m} onChange={setBookCell(i, 'ead_m')} /></td>
                      <td style={td}><EditCell value={r.margin_bps} onChange={setBookCell(i, 'margin_bps')} width={64} /></td>
                      <td style={td}><EditCell value={r.lgd_pct} onChange={setBookCell(i, 'lgd_pct')} width={54} /></td>
                      <td style={td}><EditCell value={r.tenor_years} onChange={setBookCell(i, 'tenor_years')} width={48} /></td>
                      <td style={td}><EditCell value={r.revenue_m} onChange={setBookCell(i, 'revenue_m')} width={64} /></td>
                      <td style={td}><EditCell value={r.evic_m} onChange={setBookCell(i, 'evic_m')} width={64} /></td>
                      <td style={td}><EditCell value={r.emissions_tco2} onChange={setBookCell(i, 'emissions_tco2')} width={92} /></td>
                      <td style={td}><EditCell value={r.data_quality} onChange={setBookCell(i, 'data_quality')} width={40} /></td>
                      <td style={td}><EditCell value={r.itr_c} onChange={setBookCell(i, 'itr_c')} width={48} /></td>
                      <td style={td}>
                        <button onClick={() => dropBookRow(i)} title="Remove borrower" style={{
                          background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6,
                          color: T.red, cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '3px 8px',
                        }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={addBookRow} disabled={book.length >= 10} style={{
              background: 'transparent', border: `1px dashed ${T.gold}`, borderRadius: 8, color: T.amber,
              cursor: book.length >= 10 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, padding: '7px 16px', fontFamily: T.font,
            }}>+ Add borrower (max 10)</button>
            <span style={{ fontSize: 10.5, color: T.sub, marginLeft: 12 }}>
              ITR blank = engine applies the labeled hand-authored sector default proxy. DQ = PCAF data-quality score 1 (best) – 5 (worst).
            </span>
          </div>

          {port.status === 'live' && port.data && (
            <>
              {/* Book KPIs */}
              <div style={card}>
                <h2 style={{ ...h2, marginBottom: 12 }}>Book Results — Credit × Capital × Financed Emissions</h2>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <Kpi label="Total EAD" value={fmtM(port.data.book.total_ead_m, 0)} sub={`${port.data.book.n_borrowers} borrowers`} />
                  <Kpi label="Book 1-yr EL" value={fmtM(port.data.book.el_1y_m, 2)} sub={fmtBps(port.data.book.el_1y_bps, 1)} color={T.red} />
                  <Kpi label="Book RAROC" value={fmtPct(port.data.book.raroc_pct, 1)} sub={`capital ${fmtM(port.data.book.capital_m, 0)} · hurdle ${fmtPct(num(b.hurdlePct), 0)}`}
                    color={port.data.book.raroc_pct >= num(b.hurdlePct) ? T.green : T.red} />
                  <Kpi label="Financed emissions" value={fmtT(port.data.book.financed_scope12_tco2)} sub="scope 1+2, PCAF-attributed" color={T.teal} />
                  <Kpi label="Intensity" value={`${fmtNum(port.data.book.intensity_tco2_per_ead_m, 1)} t/$M`} sub="per $M EAD" color={T.teal} />
                  <Kpi label="Weighted ITR" value={`${fmtNum(port.data.book.weighted_itr_c, 2)}°C`} sub="EAD-weighted temp alignment" color={T.amber} />
                  <Kpi label="HHI sector / rating" value={`${fmtNum(port.data.book.hhi_sector, 3)} / ${fmtNum(port.data.book.hhi_rating, 3)}`} sub="concentration (0–1)" color={T.purple} />
                </div>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  <div style={{ flex: 2, minWidth: 480, overflowX: 'auto' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Per-borrower engine output</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr><th style={th}>Name</th><th style={th}>Class</th><th style={th}>PD 1y</th><th style={th}>EL 1y $M</th>
                          <th style={th}>RW (SA)</th><th style={th}>RAROC</th><th style={th}>Life EL base $M</th>
                          <th style={th}>Attr.</th><th style={th}>Fin. tCO2e</th><th style={th}>t/$M</th><th style={th}>ITR</th><th style={th}>DQ</th></tr>
                      </thead>
                      <tbody>
                        {port.data.per_borrower.map((p) => (
                          <tr key={p.name}>
                            <td style={{ ...td, fontWeight: 700, color: T.navy }}>{p.name}</td>
                            <td style={{ ...td, fontFamily: T.mono, color: ['fossil', 'fossil_high'].includes(p.sector_class) ? T.red : p.sector_class === 'green' ? T.green : T.slate }}>{p.sector_class}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(p.pd_1y_pct, 2)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(p.el_1y_m, 2)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(p.risk_weight_sa * 100, 0)}</td>
                            <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: p.raroc_pct >= num(b.hurdlePct) ? T.green : T.red }}>{fmtPct(p.raroc_pct, 1)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(p.lifetime_el_baseline_m, 2)}</td>
                            <td style={{ ...td, fontFamily: T.mono }} title={p.attribution_note}>{fmtNum(p.attribution_factor, 2)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtT(p.financed_scope12_tco2)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(p.intensity_tco2_per_ead_m, 1)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(p.itr_c, 1)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{p.data_quality}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Concentration (EAD share)</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                      <thead><tr><th style={th}>Sector</th><th style={th}>EAD $M</th><th style={th}>Share</th></tr></thead>
                      <tbody>
                        {port.data.book.sector_breakdown.map((s) => (
                          <tr key={s.sector}>
                            <td style={{ ...td, fontWeight: 600, color: T.navy }}>{s.sector}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(s.ead_m, 0)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(s.share_pct, 1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={th}>Rating</th><th style={th}>EAD $M</th><th style={th}>Share</th></tr></thead>
                      <tbody>
                        {port.data.book.rating_breakdown.map((s) => (
                          <tr key={s.rating}>
                            <td style={{ ...td, fontWeight: 600, color: T.navy, fontFamily: T.mono }}>{s.rating}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(s.ead_m, 0)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(s.share_pct, 1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Scenario book EL + OLS */}
              <div style={card}>
                <h2 style={{ ...h2, marginBottom: 12 }}>Scenario-Conditional Book EL & Transition-Risk Pricing Test</h2>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 420 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                      Book lifetime EL across all six NGFS scenarios (baseline {fmtM(port.data.book.baseline_lifetime_el_m, 1)} dashed)
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={scenBookData} margin={{ bottom: 55, right: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 10 }} label={{ value: 'lifetime EL $M', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                        <Tooltip formatter={(v, n) => [fmtNum(v, 2), n]} />
                        <ReferenceLine y={port.data.book.baseline_lifetime_el_m} stroke={T.slate} strokeDasharray="4 4"
                          label={{ value: 'baseline matrix', fontSize: 9, fill: T.slate }} />
                        <Bar dataKey="el" name="Book lifetime EL $M" radius={[3, 3, 0, 0]}>
                          {(scenBookData || []).map((r) => (
                            <Cell key={r.id} fill={r.id === 'net_zero_2050' ? T.teal : r.id === 'delayed_transition' ? T.red : r.id === 'current_policies' ? T.slate : T.amber} fillOpacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                      <thead><tr><th style={th}>Scenario</th><th style={th}>Book lifetime EL $M</th><th style={th}>Δ vs baseline $M</th><th style={th}>EL % of EAD</th></tr></thead>
                      <tbody>
                        {(scenBookData || []).map((r) => (
                          <tr key={r.id}>
                            <td style={{ ...td, fontWeight: 700, color: T.navy }}>{r.name}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.el, 2)}</td>
                            <td style={{ ...td, fontFamily: T.mono, color: r.delta >= 0 ? T.red : T.green }}>{r.delta >= 0 ? '+' : ''}{fmtNum(r.delta, 2)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(r.pctEad, 2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ flex: 1, minWidth: 420 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                      Does pricing reflect transition risk? Margin (bps) vs financed-emissions intensity (t/$M EAD), OLS
                    </div>
                    {olsChart ? (
                      <>
                        <ResponsiveContainer width="100%" height={280}>
                          <ComposedChart margin={{ right: 12, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                            <XAxis dataKey="x" type="number" tick={{ fontSize: 10 }} name="intensity"
                              label={{ value: 'financed-emissions intensity t/$M', position: 'insideBottom', offset: -4, fontSize: 10 }} />
                            <YAxis dataKey="y" type="number" tick={{ fontSize: 10 }} name="margin"
                              label={{ value: 'margin bps', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                            <Tooltip formatter={(v, n) => [fmtNum(v, 1), n]} labelFormatter={() => ''} />
                            <Scatter data={olsChart.points} name="Borrowers" fill={T.indigo} />
                            <Line data={olsChart.line} dataKey="lineY" name="OLS fit" stroke={T.amber} strokeWidth={2} dot={false} legendType="plainline" />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                        <div style={{ ...formulaBox, marginTop: 8, marginBottom: 0 }}>
                          margin = {fmtNum(olsChart.intercept, 1)} + {olsChart.slope >= 0 ? '' : '−'}{fmtNum(Math.abs(olsChart.slope), 4)} × intensity ·
                          R² = {fmtNum(olsChart.r2, 3)} · n = {olsChart.n}. {olsChart.interpretation}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: T.sub }}>OLS needs ≥3 borrowers with computable intensity (engine returns null otherwise — nothing is fabricated).</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          {port.status === 'demo' && <div style={{ ...card, fontSize: 12, color: T.sub }}>Transition-credit engine unreachable — no book figures shown. Error: {String(port.error)}. Restart the backend to register /api/v1/transition-credit.</div>}
          {port.status === 'idle' && <div style={{ ...card, fontSize: 12, color: T.sub }}>Edit the book above and run — all analytics (EL, RAROC, scenario matrices, PCAF attribution, OLS, HHI, disclosure panel) are computed server-side in one call. The TCFD/ISSB disclosure panel from this same run is on the PCAF &amp; Disclosure tab.</div>}
        </>
      )}

      {/* ═══ TAB 3 · CLIMATE MATRIX (analytical core) ══════════════════════ */}
      {tab === 'matrix' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2}>Climate-Adjusted Rating-Migration Matrix</h2>
              <span style={endpointChip}>POST /api/v1/transition-credit/climate-matrix</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge status={cmx.status} demoText={cmx.error} />
                <button onClick={runCmx} style={btnStyle()}>Stress the matrix →</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
              <SelectField label="NGFS scenario" value={cmxScenario} onChange={setCmxScenario}
                options={SCENARIO_IDS.map((s) => [s, SCEN_LABEL[s]])} width={190} />
              <SelectField label="Sector (→ climate class)" value={cmxSector} onChange={setCmxSector} options={SECTORS_EXT} width={190} />
              <SelectField label="Starting rating" value={cmxRating} onChange={setCmxRating} options={NON_DEFAULT_RATINGS} width={110} />
              <Field label="Horizon" unit="yrs, ≤10" value={cmxYears} onChange={setCmxYears} width={110} />
              <Field label="Multiplier override (blank = mapping)" value={cmxOverride} onChange={setCmxOverride} width={220} />
            </div>
            <div style={formulaBox}>
              Analytical core, all server-side and deterministic: (1) baseline annual migration matrix — hand-authored
              approximation of the S&P 1981–2023 NR-adjusted global corporate matrix, default column = this desk's 1-yr
              PD ladder, rows sum to 1 (asserted); (2) climate overlay — NGFS scenario × sector-class
              downgrade-intensity multiplier (documented mapping below, editable via the override box): every downgrade
              cell incl. default × multiplier, the diagonal absorbs the difference, rows re-normalized (asserted);
              (3) evolution — v_t = v_(t−1) · M from the one-hot start rating, every yearly distribution asserted to sum
              to 1 (matrix powers); (4) scenario-conditional lifetime EL from yearly marginal default mass, EIR
              {' '}{fmtPct(num(eir), 1)} mid-year discounting, LGD {fmtPct(num(b.lgdPct), 0)} and EAD {fmtM(num(b.debt), 0)} ({amort}) from the Single Borrower tab.
            </div>
            {cmx.status === 'live' && cmx.data && (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <Kpi label="Downgrade multiplier" value={`${fmtNum(cmx.data.multiplier, 2)}×`}
                    sub={`${SCEN_LABEL[cmx.data.scenario] || cmx.data.scenario} · ${cmx.data.sector} (${cmx.data.sector_class})`} color={T.purple} />
                  <Kpi label={`P(downgrade) @ ${cmx.data.downgrade_prob.horizon_years}y`}
                    value={fmtPct(cmx.data.downgrade_prob.stressed_pct, 1)}
                    sub={`baseline ${fmtPct(cmx.data.downgrade_prob.baseline_pct, 1)} — incl. default`}
                    color={cmx.data.downgrade_prob.stressed_pct > cmx.data.downgrade_prob.baseline_pct ? T.red : T.green} />
                  <Kpi label="Cumulative PD (horizon)" value={fmtPct(cmx.data.lifetime_el.stressed.cumulative_pd_pct, 2)}
                    sub={`baseline ${fmtPct(cmx.data.lifetime_el.baseline.cumulative_pd_pct, 2)}`} color={T.amber} />
                  <Kpi label="Lifetime EL (stressed)" value={fmtM(cmx.data.lifetime_el.stressed.lifetime_el, 2)}
                    sub={`baseline ${fmtM(cmx.data.lifetime_el.baseline.lifetime_el, 2)} · ${fmtBps(cmx.data.lifetime_el.stressed.annualized_el_bps, 1)} p.a.`} color={T.red} />
                </div>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 16 }}>
                  <MatrixTable ratings={cmx.data.ratings} matrixPct={cmx.data.baseline_matrix_pct}
                    title="Baseline annual migration matrix (%, hand-authored S&P-study approximation)"
                    note="Diagonal outlined. Default column (D) red-heat. Full basis at GET /ref/transition-matrix." />
                  <MatrixTable ratings={cmx.data.ratings} matrixPct={cmx.data.stressed_matrix_pct}
                    title={`Climate-stressed matrix (%, downgrades × ${fmtNum(cmx.data.multiplier, 2)}, diagonal re-absorbed)`}
                    note={`Row sums (engine-asserted): ${cmx.data.stressed_row_sums.map((s) => s.toFixed(6)).join(' · ')}`} />
                </div>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 16 }}>
                  <div style={{ flex: 1.4, minWidth: 460 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                      Rating-distribution fan — stressed evolution from {cmx.data.ratings && cmxRating} (stacked, sums to 100% each year)
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={fanData} margin={{ right: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} label={{ value: '% of paths', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                        <Tooltip formatter={(v, n) => [fmtPct(v, 2), n]} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {RATINGS_ALL.map((r) => (
                          <Area key={r} type="monotone" dataKey={r} stackId="1" name={r}
                            stroke={RATING_COLORS[r]} fill={RATING_COLORS[r]} fillOpacity={0.65} />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1, minWidth: 380 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                      Cumulative default mass — baseline vs stressed (matrix powers)
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={cumDefaultData} margin={{ right: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} label={{ value: 'cum. default %', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                        <Tooltip formatter={(v, n) => [fmtPct(v, 3), n]} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="baseline" name="Baseline matrix" stroke={T.slate} strokeWidth={2} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="stressed" name={`Stressed (${SCEN_LABEL[cmx.data.scenario] || cmx.data.scenario})`} stroke={T.red} strokeWidth={2} dot={{ r: 2 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {allScenElData && (
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 420 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                        Scenario-conditional lifetime EL — same borrower under all six NGFS scenario matrices
                      </div>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={allScenElData} margin={{ bottom: 55, right: 12 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                          <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" interval={0} />
                          <YAxis tick={{ fontSize: 10 }} label={{ value: 'lifetime EL $M', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                          <Tooltip formatter={(v, n) => [fmtNum(v, 2), n]} />
                          <Bar dataKey="el" name="Lifetime EL $M" radius={[3, 3, 0, 0]}>
                            {allScenElData.map((r) => (
                              <Cell key={r.id} fill={r.id === cmx.data.scenario ? T.red : T.gold} fillOpacity={0.85} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ flex: 1, minWidth: 380 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Per-scenario multipliers & EL (selected row highlighted)</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr><th style={th}>Scenario</th><th style={th}>Multiplier</th><th style={th}>Cum. PD</th><th style={th}>Lifetime EL $M</th><th style={th}>EL bps p.a.</th></tr></thead>
                        <tbody>
                          {allScenElData.map((r) => (
                            <tr key={r.id} style={r.id === cmx.data.scenario ? { background: T.gold + '22' } : undefined}>
                              <td style={{ ...td, fontWeight: 700, color: T.navy }}>{r.name}</td>
                              <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.mult, 2)}×</td>
                              <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(r.cumPd, 2)}</td>
                              <td style={{ ...td, fontFamily: T.mono, color: T.red }}>{fmtNum(r.el, 2)}</td>
                              <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.elBps, 1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
            {cmx.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Transition-credit engine unreachable — no matrices shown. Error: {String(cmx.error)}. Restart the backend to register /api/v1/transition-credit.</div>}
            {cmx.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Pick a scenario, sector and starting rating, then stress the matrix. LGD/EAD/EIR/amortization are shared with the Single Borrower tab.</div>}
          </div>

          {/* Multiplier mapping reference */}
          {refMult.status === 'live' && refMult.data && (
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                <h2 style={h2}>Documented Scenario × Sector-Class Multiplier Mapping</h2>
                <span style={endpointChip}>GET /api/v1/transition-credit/ref/climate-multipliers</span>
                <Badge status="live" />
              </div>
              <div style={{ fontSize: 11, color: T.slate, marginBottom: 10 }}>{refMult.data.basis}</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>Class \ Scenario</th>
                      {SCENARIO_IDS.map((s) => <th key={s} style={{ ...th, textAlign: 'right' }}>{SCEN_LABEL[s]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {['green', 'mixed', 'neutral', 'fossil', 'fossil_high'].map((cls) => (
                      <tr key={cls}>
                        <td style={{ ...td, fontWeight: 700, color: cls.startsWith('fossil') ? T.red : cls === 'green' ? T.green : T.navy, fontFamily: T.mono }}>{cls}</td>
                        {SCENARIO_IDS.map((s) => {
                          const v = refMult.data.class_multipliers?.[s]?.[cls];
                          return (
                            <td key={s} style={{
                              ...td, textAlign: 'right', fontFamily: T.mono, fontWeight: v > 1 ? 700 : 400,
                              color: v > 1.5 ? T.red : v > 1 ? T.amber : v < 1 ? T.green : T.slate,
                            }}>{v != null ? `${v.toFixed(2)}×` : '—'}</td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 8 }}>
                Sector → class: {Object.entries(refMult.data.sector_class || {}).map(([k, v]) => `${k} → ${v}`).join(' · ')}.
                Override any cell for a single run via the multiplier-override box above.
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ TAB 4 · PCAF & DISCLOSURE ═════════════════════════════════════ */}
      {tab === 'pcaf' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2}>PCAF Financed-Emissions Attribution ({pcafRows.length} exposures)</h2>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                Hand-authored illustrative exposures — editable
              </span>
              <span style={endpointChip}>POST /api/v1/transition-credit/pcaf</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge status={pcaf.status} demoText={pcaf.error} />
                <button onClick={runPcaf} style={btnStyle()}>Attribute emissions →</button>
              </div>
            </div>
            <div style={formulaBox}>
              PCAF Global GHG Standard, Part A (business loans): attribution factor = outstanding ÷ <b>EVIC</b>
              (listed borrowers, option 1a) or outstanding ÷ <b>total equity + debt</b> (unlisted, option 1b), capped
              at 1 — pick the primary basis below; where it is blank for an exposure the engine falls back to the other
              basis and flags a warning. Financed emissions = factor × borrower scope 1+2 (scope 3 attributed
              separately, double-counting caveats apply). WACI = outstanding-weighted (scope 1+2 ÷ revenue). Data
              quality = PCAF 1–5 ladder (criteria below). Temperature alignment: borrower ITR if supplied, else the
              labeled hand-authored sector proxy — the portfolio figure is attribution-weighted.
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
              <SelectField label="Primary attribution basis" value={pcafBasis} onChange={setPcafBasis}
                options={[['evic', 'outstanding / EVIC (option 1a, listed)'], ['total_equity_debt', 'outstanding / total equity + debt (option 1b, unlisted)']]} width={330} />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
                <thead>
                  <tr>
                    <th style={th}>Exposure</th><th style={th}>Sector</th><th style={th}>Outstanding $M</th>
                    <th style={th}>EVIC $M</th><th style={th}>Eq+Debt $M</th><th style={th}>Revenue $M</th>
                    <th style={th}>Scope 1+2 tCO2e</th><th style={th}>Scope 3 tCO2e</th><th style={th}>DQ 1–5</th><th style={th}>ITR °C</th><th style={th} />
                  </tr>
                </thead>
                <tbody>
                  {pcafRows.map((r, i) => (
                    <tr key={i}>
                      <td style={td}><EditText value={r.name} onChange={setPcafCell(i, 'name')} width={140} /></td>
                      <td style={td}><EditSelect value={r.sector} onChange={setPcafCell(i, 'sector')} options={SECTORS_EXT} width={150} /></td>
                      <td style={td}><EditCell value={r.outstanding_m} onChange={setPcafCell(i, 'outstanding_m')} /></td>
                      <td style={td}><EditCell value={r.evic_m} onChange={setPcafCell(i, 'evic_m')} width={64} /></td>
                      <td style={td}><EditCell value={r.total_equity_debt_m} onChange={setPcafCell(i, 'total_equity_debt_m')} width={64} /></td>
                      <td style={td}><EditCell value={r.revenue_m} onChange={setPcafCell(i, 'revenue_m')} width={64} /></td>
                      <td style={td}><EditCell value={r.emissions_tco2} onChange={setPcafCell(i, 'emissions_tco2')} width={92} /></td>
                      <td style={td}><EditCell value={r.scope3_tco2} onChange={setPcafCell(i, 'scope3_tco2')} width={80} /></td>
                      <td style={td}><EditCell value={r.data_quality} onChange={setPcafCell(i, 'data_quality')} width={40} /></td>
                      <td style={td}><EditCell value={r.itr_c} onChange={setPcafCell(i, 'itr_c')} width={48} /></td>
                      <td style={td}>
                        <button onClick={() => dropPcafRow(i)} title="Remove exposure" style={{
                          background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6,
                          color: T.red, cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '3px 8px',
                        }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={addPcafRow} disabled={pcafRows.length >= 10} style={{
              background: 'transparent', border: `1px dashed ${T.gold}`, borderRadius: 8, color: T.amber,
              cursor: pcafRows.length >= 10 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, padding: '7px 16px', fontFamily: T.font,
            }}>+ Add exposure (max 10)</button>

            {pcaf.status === 'live' && pcaf.data && (
              <>
                {pcaf.data.warnings?.length > 0 && (
                  <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#92400e', margin: '12px 0' }}>
                    {pcaf.data.warnings.map((w) => <div key={w}>⚠ {w}</div>)}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '14px 0' }}>
                  <Kpi label="Financed scope 1+2" value={fmtT(pcaf.data.portfolio.financed_scope12_tco2)} sub="PCAF-attributed" color={T.teal} />
                  <Kpi label="Financed scope 3" value={pcaf.data.portfolio.financed_scope3_tco2 != null ? fmtT(pcaf.data.portfolio.financed_scope3_tco2) : '—'} sub="where reported (partial)" color={T.teal} />
                  <Kpi label="Intensity" value={`${fmtNum(pcaf.data.portfolio.intensity_tco2_per_outstanding_m, 1)} t/$M`} sub="per $M outstanding" />
                  <Kpi label="WACI" value={`${fmtNum(pcaf.data.portfolio.waci_tco2_per_revenue_m, 0)} t/$M rev`} sub="outstanding-weighted" color={T.amber} />
                  <Kpi label="Weighted PCAF DQ" value={fmtNum(pcaf.data.portfolio.weighted_data_quality, 2)} sub="1 best – 5 worst" color={T.purple} />
                  <Kpi label="Weighted ITR" value={`${fmtNum(pcaf.data.portfolio.weighted_itr_c, 2)}°C`} sub="attribution-weighted proxy" color={T.red} />
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                    <thead>
                      <tr><th style={th}>Exposure</th><th style={th}>Basis used</th><th style={th}>Denominator $M</th>
                        <th style={th}>Attribution factor</th><th style={th}>Financed S1+2 tCO2e</th><th style={th}>Financed S3</th>
                        <th style={th}>t/$M outst.</th><th style={th}>t/$M revenue</th><th style={th}>DQ</th><th style={th}>ITR (src)</th></tr>
                    </thead>
                    <tbody>
                      {pcaf.data.exposures.map((e) => (
                        <tr key={e.name}>
                          <td style={{ ...td, fontWeight: 700, color: T.navy }}>{e.name}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{e.attribution_basis}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(e.attribution_denominator_m, 0)}</td>
                          <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{fmtNum(e.attribution_factor, 3)}</td>
                          <td style={{ ...td, fontFamily: T.mono, color: T.teal }}>{fmtT(e.financed_scope12_tco2)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{e.financed_scope3_tco2 != null ? fmtT(e.financed_scope3_tco2) : '—'}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(e.intensity_tco2_per_outstanding_m, 1)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{e.revenue_intensity_tco2_per_m != null ? fmtNum(e.revenue_intensity_tco2_per_m, 1) : '—'}</td>
                          <td style={{ ...td, fontFamily: T.mono }} title={e.data_quality_criteria}>{e.data_quality}</td>
                          <td style={{ ...td, fontFamily: T.mono }} title={e.itr_source}>{fmtNum(e.itr_c, 1)}°C</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>PCAF data-quality ladder (Part A criteria, paraphrased — engine reference)</div>
                <table style={{ width: '100%', maxWidth: 640, borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Score</th><th style={th}>Criteria</th></tr></thead>
                  <tbody>
                    {Object.entries(pcaf.data.pcaf_dq_ladder || {}).map(([k, v]) => (
                      <tr key={k}>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{k}</td>
                        <td style={td}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {pcaf.status === 'demo' && <div style={{ fontSize: 12, color: T.sub, marginTop: 12 }}>Transition-credit engine unreachable — no attribution shown. Error: {String(pcaf.error)}.</div>}
          </div>

          {/* TCFD / ISSB disclosure panel (from the Portfolio run) */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2}>TCFD / ISSB (IFRS S2) Metrics Panel — Auto-Computed From the Book</h2>
              <span style={endpointChip}>POST /api/v1/transition-credit/portfolio → disclosure</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge status={port.status} demoText={port.error} />
                {port.status === 'live' && (
                  <button onClick={exportDisclosureCsv} style={{ ...btnStyle(), background: T.teal }}>Export CSV ↓</button>
                )}
              </div>
            </div>
            {port.status === 'live' && port.data?.disclosure ? (
              <>
                <div style={{ fontSize: 11, color: T.slate, marginBottom: 10 }}>{port.data.disclosure.standard_note}</div>
                <table style={{ width: '100%', maxWidth: 880, borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Metric</th><th style={th}>Value</th><th style={th}>Basis / note</th></tr></thead>
                  <tbody>
                    {[
                      ['Financed emissions (scope 1+2)', fmtT(port.data.disclosure.financed_scope12_tco2), 'PCAF attribution; borrower scope 1+2 only'],
                      ['Financed emissions intensity', `${fmtNum(port.data.disclosure.financed_intensity_tco2_per_ead_m, 2)} tCO2e/$M EAD`, 'attributed emissions ÷ total EAD'],
                      ['Weighted average carbon intensity (WACI)', `${fmtNum(port.data.disclosure.waci_tco2_per_revenue_m, 1)} tCO2e/$M revenue`, 'EAD-weighted scope1+2 ÷ revenue'],
                      ['Weighted implied temperature rise', `${fmtNum(port.data.disclosure.weighted_itr_c, 2)} °C`, 'EAD-weighted; sector proxies where borrower ITR missing (labeled)'],
                      ['Weighted PCAF data quality', fmtNum(port.data.disclosure.weighted_pcaf_dq, 2), 'EAD-weighted, 1 best – 5 worst'],
                      ['Exposure to carbon-related assets', fmtPct(port.data.disclosure.carbon_related_assets_pct, 1), port.data.disclosure.carbon_related_definition],
                      ['Climate VaR proxy — range', `${fmtM(port.data.disclosure.climate_var_proxy?.range_m, 2)} (${fmtPct(port.data.disclosure.climate_var_proxy?.range_pct_of_ead, 2)} of EAD)`, port.data.disclosure.climate_var_proxy?.definition],
                      ['Climate VaR proxy — scenario EL bounds', `${fmtM(port.data.disclosure.climate_var_proxy?.min_el_m, 2)} – ${fmtM(port.data.disclosure.climate_var_proxy?.max_el_m, 2)}`, 'min/max book lifetime EL across the six NGFS scenarios'],
                    ].map(([m, v, note]) => (
                      <tr key={m}>
                        <td style={{ ...td, fontWeight: 700, color: T.navy }}>{m}</td>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{v}</td>
                        <td style={{ ...td, fontSize: 11 }}>{note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div style={{ fontSize: 12, color: T.sub }}>
                Run the book on the <b>Portfolio</b> tab first — this panel is computed server-side from the same call
                (financed emissions, WACI, carbon-related-assets share, climate-VaR proxy = scenario EL range) and can
                be exported as CSV for the reporting pack. Nothing is shown until the engine returns.
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══ TAB 5 · PRICING LAB ═══════════════════════════════════════════ */}
      {tab === 'pricing' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2}>Sustainability-Adjusted Pricing Lab</h2>
              <span style={endpointChip}>POST /api/v1/transition-credit/pricing</span>
              {basel.status === 'live' && basel.irbRw != null
                ? <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>RW: live IRB {fmtPct(basel.irbRw * 100, 1)} passed through</span>
                : <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>RW: SA table by rating (run Basel on Single Borrower for live IRB)</span>}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Badge status={pricing.status} demoText={pricing.error} />
                <button onClick={runPricing} disabled={Math.abs(probSum - 1) > 0.01} style={btnStyle(Math.abs(probSum - 1) <= 0.01)}>Price the loan →</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
              <SelectField label="Sector (→ climate class)" value={prc.sector} onChange={setP('sector')} options={SECTORS_EXT} width={180} />
              <SelectField label="Rating" value={prc.rating} onChange={setP('rating')} options={NON_DEFAULT_RATINGS} width={90} />
              <Field label="EAD" unit="$M" value={prc.ead} onChange={setP('ead')} width={100} />
              <Field label="Tenor" unit="yrs ≤10" value={prc.tenor} onChange={setP('tenor')} width={100} />
              <Field label="LGD" unit="%" value={prc.lgdPct} onChange={setP('lgdPct')} width={90} />
              <Field label="Margin" unit="bps" value={prc.marginBps} onChange={setP('marginBps')} width={100} />
              <Field label="Scope 1+2" unit="tCO2e/yr" value={prc.emissions} onChange={setP('emissions')} width={130} />
              <Field label="EBITDA" unit="$M" value={prc.ebitda} onChange={setP('ebitda')} width={100} />
              <Field label="Interest expense" unit="$M" value={prc.interest} onChange={setP('interest')} width={130} />
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
              <Field label="Carbon cost absorbed (not passed through)" unit="0–1" value={prc.absorption} onChange={setP('absorption')} width={250} />
              <Field label="Carbon price paid today" unit="$/t" value={prc.currentCarbon} onChange={setP('currentCarbon')} width={160} />
              <SelectField label="NGFS horizon" value={prc.horizonYear} onChange={setP('horizonYear')} options={NGFS_YEARS.map((y) => [String(y), String(y)])} width={110} />
              <Field label="Green supporting/penalizing factor" unit="±%" value={prc.greenFactorPct} onChange={setP('greenFactorPct')} width={220} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, margin: '4px 0 6px' }}>
              NGFS scenario probability weights (must sum to 1 — currently {fmtNum(probSum, 2)}{Math.abs(probSum - 1) > 0.01 ? ' ✕ fix to run' : ' ✓'})
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
              {SCENARIO_IDS.map((s) => (
                <Field key={s} label={SCEN_LABEL[s]} value={probs[s]} onChange={(v) => setProbs((prev) => ({ ...prev, [s]: v }))} width={130} />
              ))}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, margin: '4px 0 6px' }}>Sustainability-linked margin ratchet (SLL terms)</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
              <Field label="Step-up if KPI missed" unit="bps" value={prc.stepUp} onChange={setP('stepUp')} width={150} />
              <Field label="Step-down if KPI met" unit="bps" value={prc.stepDown} onChange={setP('stepDown')} width={150} />
              <Field label="P(meet KPI) per year" unit="0–1" value={prc.probMeet} onChange={setP('probMeet')} width={150} />
              <Field label="KPI baseline" unit="tCO2e/GWh" value={prc.kpiBaseline} onChange={setP('kpiBaseline')} width={150} />
              <Field label="Target reduction" unit="%/yr" value={prc.kpiTargetPa} onChange={setP('kpiTargetPa')} width={140} />
              <Field label="Projected reduction" unit="%/yr" value={prc.kpiProjPa} onChange={setP('kpiProjPa')} width={150} />
            </div>
            <div style={formulaBox}>
              All server-side, deterministic, documented: <b>climate-adjusted RAROC</b> = same RAROC formula with EL
              replaced by the scenario-probability-weighted annualized lifetime EL from the six stressed migration
              matrices (base uses the baseline matrix — the delta isolates transition risk). <b>Carbon-cost margin
              erosion</b> = scope 1+2 × max(P_scenario@horizon − P_today, 0) × absorbed share ÷ EAD; the coverage link
              re-rates the borrower — ICR′ = (EBITDA − carbon cost) ÷ interest, 1 notch down per 20% relative ICR
              deterioration, capped at 4 (hand-authored elasticity, documented in the response). <b>Green RW panel</b> =
              policy-debate what-if (supporting/penalizing factor ±{fmtNum(num(prc.greenFactorPct), 0)}% on the risk
              weight — labeled, NOT current law). <b>SLL ratchet PV</b> = Σ_t [p×(−step-down) + (1−p)×step-up] × EAD_t ×
              DF(t−0.5). Opex/capital-ratio/hurdle shared from the Single Borrower tab; NGFS carbon prices from the
              seeded Phase 5 extract (labeled approximate).
            </div>

            {pricing.status === 'live' && pricing.data && (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <Kpi label="Base RAROC" value={fmtPct(pricing.data.base.raroc_pct, 1)}
                    sub={`EL ${fmtBps(pricing.data.base.annualized_el_bps, 1)} p.a. · baseline matrix`} color={T.navy} />
                  <Kpi label="Climate-adjusted RAROC" value={fmtPct(pricing.data.climate_adjusted.raroc_pct, 1)}
                    sub={`weighted EL ${fmtBps(pricing.data.climate_adjusted.weighted_el_bps, 1)} · Δ ${fmtNum(pricing.data.climate_adjusted.raroc_delta_pct, 2)} pp`}
                    color={pricing.data.climate_adjusted.raroc_pct < pricing.data.base.raroc_pct ? T.red : T.green} />
                  <Kpi label="Pricing floor (climate)" value={fmtBps(pricing.data.climate_adjusted.floor_bps)}
                    sub={`base floor ${fmtBps(pricing.data.base.floor_bps)} · quoted ${fmtBps(num(prc.marginBps))}`}
                    color={num(prc.marginBps) >= pricing.data.climate_adjusted.floor_bps ? T.green : T.red} />
                  <Kpi label="Risk weight" value={fmtPct(pricing.data.risk_weight * 100, 1)} sub={pricing.data.risk_weight_source} color={T.blue} />
                  <Kpi label="SLL ratchet PV" value={fmtM(pricing.data.sll_ratchet.pv_expected_ratchet_m, 3)}
                    sub="expected margin PV to lender (+ = borrower off-track)" color={pricing.data.sll_ratchet.pv_expected_ratchet_m >= 0 ? T.amber : T.green} />
                </div>

                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 16 }}>
                  <div style={{ flex: 1, minWidth: 420 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                      Scenario-conditional annualized EL (bps p.a.) × your probability weights
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={th}>Scenario</th><th style={th}>Prob</th><th style={th}>Multiplier</th><th style={th}>EL bps p.a.</th><th style={th}>Lifetime EL $M</th><th style={th}>Cum. PD</th></tr></thead>
                      <tbody>
                        {pricing.data.climate_adjusted.scenario_rows.map((r) => (
                          <tr key={r.scenario}>
                            <td style={{ ...td, fontWeight: 700, color: T.navy }}>{SCEN_LABEL[r.scenario] || r.scenario}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.prob, 2)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.multiplier, 2)}×</td>
                            <td style={{ ...td, fontFamily: T.mono, color: T.red }}>{fmtNum(r.annualized_el_bps, 1)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.lifetime_el, 2)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(r.cumulative_pd_pct, 2)}</td>
                          </tr>
                        ))}
                        <tr style={{ background: T.gold + '22' }}>
                          <td style={{ ...td, fontWeight: 800 }}>Probability-weighted</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(probSum, 2)}</td>
                          <td style={td} />
                          <td style={{ ...td, fontFamily: T.mono, fontWeight: 800, color: T.red }}>{fmtNum(pricing.data.climate_adjusted.weighted_el_bps, 1)}</td>
                          <td style={td} /><td style={td} />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ flex: 1, minWidth: 420 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                      Carbon-cost margin erosion @ {pricing.data.carbon_margin.horizon_year} (NGFS carbon price → ICR → notching)
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={th}>Scenario</th><th style={th}>C-price $/t</th><th style={th}>Cost $M</th><th style={th}>Erosion bps</th><th style={th}>ICR → ICR′</th><th style={th}>Notches</th><th style={th}>Rating′ / PD′</th></tr></thead>
                      <tbody>
                        {pricing.data.carbon_margin.rows.map((r) => (
                          <tr key={r.scenario}>
                            <td style={{ ...td, fontWeight: 700, color: T.navy }}>{SCEN_LABEL[r.scenario] || r.scenario}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{r.carbon_price_usd_t != null ? fmtNum(r.carbon_price_usd_t, 0) : '—'}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{r.absorbed_carbon_cost_m != null ? fmtNum(r.absorbed_carbon_cost_m, 1) : '—'}</td>
                            <td style={{ ...td, fontFamily: T.mono, color: T.red }}>{r.margin_erosion_bps != null ? fmtNum(r.margin_erosion_bps, 1) : '—'}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{r.icr_base != null ? `${fmtNum(r.icr_base, 1)} → ${fmtNum(r.icr_adjusted, 1)}` : '—'}</td>
                            <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: r.notches_down > 0 ? T.red : T.green }}>{r.notches_down != null ? `−${r.notches_down}` : '—'}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{r.adjusted_rating ? `${r.adjusted_rating} / ${fmtPct(r.adjusted_pd_1y_pct, 2)}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>{pricing.data.carbon_margin.ngfs_source}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 380 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                      Green supporting / penalizing risk-weight panel — {pricing.data.green_rw_panel.framing}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={th}>Case</th><th style={th}>RW factor</th><th style={th}>Risk weight</th><th style={th}>Capital $M</th><th style={th}>RAROC</th><th style={th}>Floor bps</th></tr></thead>
                      <tbody>
                        {pricing.data.green_rw_panel.rows.map((r) => (
                          <tr key={r.case} style={r.case === 'current' ? { background: T.cream } : undefined}>
                            <td style={{ ...td, fontWeight: 700, color: r.case.startsWith('penalizing') ? T.red : r.case.startsWith('supporting') ? T.green : T.navy }}>{r.case}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.rw_factor, 2)}×</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(r.risk_weight * 100, 0)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.capital, 1)}</td>
                            <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{fmtPct(r.raroc_pct, 1)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.floor_bps, 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ flex: 1.2, minWidth: 440 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                      SLL ratchet — KPI path vs target (left) and expected margin path (right)
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <ComposedChart data={sllChart} margin={{ right: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                        <YAxis yAxisId="l" tick={{ fontSize: 10 }} label={{ value: 'KPI tCO2e/GWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                        <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} label={{ value: 'expected margin bps', angle: 90, position: 'insideRight', fontSize: 10 }} />
                        <Tooltip formatter={(v, n) => [fmtNum(v, 1), n]} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line yAxisId="l" type="monotone" dataKey="target" name="KPI target path" stroke={T.green} strokeWidth={2} strokeDasharray="5 3" dot={false} />
                        <Line yAxisId="l" type="monotone" dataKey="projected" name="Borrower projected path" stroke={T.amber} strokeWidth={2} dot={{ r: 2 }} />
                        <Line yAxisId="r" type="monotone" dataKey="margin" name="Expected margin bps" stroke={T.indigo} strokeWidth={2} dot={{ r: 2 }} />
                        <ReferenceLine yAxisId="r" y={num(prc.marginBps)} stroke={T.slate} strokeDasharray="4 4" label={{ value: 'contractual margin', fontSize: 9, fill: T.slate }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                    <div style={{ fontSize: 10.5, color: T.sub }}>
                      Projected ≤ target ⇒ on-track (step-down expected); above ⇒ off-track (step-up expected).
                      PV of the expected ratchet {fmtM(pricing.data.sll_ratchet.pv_expected_ratchet_m, 3)} — sign convention: + = extra income to the lender.
                    </div>
                  </div>
                </div>
              </>
            )}
            {pricing.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Transition-credit engine unreachable — no pricing shown. Error: {String(pricing.error)}.</div>}
            {pricing.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Defaults are a fossil-heavy transition borrower (Gas CCGT, BB) so the climate deltas are visible. Set your scenario weights (must sum to 1) and price the loan — everything is computed server-side with the documented tables.</div>}
          </div>
        </>
      )}

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
        Engines: services/basel_capital_engine.py (CRR Art 122/153 risk weights — live POST per computation) ·
        backend/data/ngfs_phase5_extract.json via /api/v1/ngfs-extract (NGFS Phase 5, IIASA Scenario Explorer,
        CC BY 4.0 — seeded approximate extract) · backend/api/v1/routes/transition_credit_analytics.py via
        /api/v1/transition-credit (PD term structures, migration matrices, PCAF, pricing lab, portfolio + TCFD/ISSB —
        deterministic, hand-authored labeled tables, all exposed at /ref/*). Scorecard weights, PD ladders and the
        NGFS sensitivity mapping are displayed in full above; nothing on this page is randomly generated.
      </div>
    </div>
  );
}
