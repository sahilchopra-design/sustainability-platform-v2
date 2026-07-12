import React, { useState, useMemo, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, Line, Area,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Carbon Offtake Structurer — ERPA / offtake contracting desk (NX2-06)
// Structure a forward carbon credit purchase (ERPA): spot-indexed forward,
// fixed-price forward, prepay, or streaming — with delivery-risk haircuts by
// project stage, price indexation + floor/ceiling collar, and a quality-score
// price adjustment vs benchmark.
// Live engines:
//   1. POST /api/v1/carbon-credit-quality/score-project   (ICVCM CCP quality score)
//   2. GET  /api/v1/carbon-credit-quality/ref/price-benchmarks (price benchmarks)
// All contract economics (delivery schedule, collar payoff, prepay PV, streaming
// comparison) are computed locally, period-by-period, from user terms + the live
// quality score. Delivery-risk haircuts are labeled market-convention MODELING
// DEFAULTS (editable) — not observed market data.
// Requests use the CRA dev proxy (/api → localhost:8001) + global axios Bearer.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

// Methodology catalogue — mirrors backend services/carbon_credit_quality_engine.py
// METHODOLOGIES (20 methodologies; standard + project type are engine-consistent
// so the score-project payload is always valid).
const METHODOLOGIES = [
  { key: 'VM0015', standard: 'vcs', type: 'redd_plus', name: 'VM0015 — REDD+ (deforestation & degradation)' },
  { key: 'VM0007', standard: 'vcs', type: 'redd_plus', name: 'VM0007 — REDD+ Methodology Framework' },
  { key: 'ART_TREES', standard: 'art6_itmo', type: 'redd_plus', name: 'ART TREES v2.0 — Jurisdictional REDD+ (Art 6)' },
  { key: 'AR-ACM0003', standard: 'cdm', type: 'afforestation_reforestation', name: 'AR-ACM0003 — Afforestation & reforestation' },
  { key: 'CAR_IFM', standard: 'climate_action_reserve', type: 'afforestation_reforestation', name: 'CAR IFM — Improved Forest Management' },
  { key: 'VM0042', standard: 'vcs', type: 'soil_carbon', name: 'VM0042 — Improved agricultural land mgmt (soil)' },
  { key: 'ACR_SCA', standard: 'american_carbon_registry', type: 'soil_carbon', name: 'ACR — Soil Carbon Quantification' },
  { key: 'VM0033', standard: 'vcs', type: 'blue_carbon', name: 'VM0033 — Tidal wetland & seagrass restoration' },
  { key: 'VM0024', standard: 'vcs', type: 'blue_carbon', name: 'VM0024 — Mangrove restoration' },
  { key: 'GS_TPDDTEC', standard: 'gold_standard', type: 'improved_cookstoves', name: 'Gold Standard TPDDTEC — Cookstoves' },
  { key: 'AMS-II.G', standard: 'cdm', type: 'improved_cookstoves', name: 'AMS-II.G — Thermal efficiency (cookstoves)' },
  { key: 'ACM0002', standard: 'cdm', type: 'renewable_energy', name: 'ACM0002 — Grid-connected renewable electricity' },
  { key: 'VM0041', standard: 'vcs', type: 'renewable_energy', name: 'VM0041 — Grid-connected electricity GHG reduction' },
  { key: 'ACM0001', standard: 'cdm', type: 'methane_capture', name: 'ACM0001 — Landfill gas flaring / use' },
  { key: 'AMS-III.D', standard: 'cdm', type: 'methane_capture', name: 'AMS-III.D — Manure methane recovery' },
  { key: 'AMS-II.C', standard: 'cdm', type: 'industrial_efficiency', name: 'AMS-II.C — Demand-side energy efficiency' },
  { key: 'DAC_PILOT', standard: 'vcs', type: 'direct_air_capture', name: 'DAC Pilot — Direct Air Capture (early-stage)' },
];

// Benchmark-category mapping — mirrors the engine's own price-range selection
// (carbon_credit_quality_engine.score_project: DAC→tech_removal; RE/cookstoves/
// methane/industrial→avoidance; forestry/soil/blue→nature_based_removal).
const BENCH_CATEGORY = (type) => {
  if (type === 'direct_air_capture') return 'tech_removal';
  if (['renewable_energy', 'improved_cookstoves', 'methane_capture', 'industrial_efficiency'].includes(type)) return 'avoidance';
  return 'nature_based_removal';
};

// Delivery-risk haircut table by project stage.
// ⚠ MODELING DEFAULTS — market-convention estimates used by carbon offtake desks
// (concept-stage ERPAs are typically discounted 40–60% for non-delivery; registered
// projects 10–20%). These are hand-authored convention ranges, NOT observed data;
// the applied haircut is editable below.
const STAGE_HAIRCUTS = [
  { stage: 'concept', label: 'Concept / feasibility', defaultPct: 50, rangeNote: '40–60%', rationale: 'No validation; volume, baseline and finance all unproven' },
  { stage: 'validated', label: 'Validated (VVB-approved PDD)', defaultPct: 30, rangeNote: '20–40%', rationale: 'Design validated; implementation & verification risk remain' },
  { stage: 'registered', label: 'Registered (registry-listed)', defaultPct: 15, rangeNote: '10–20%', rationale: 'Registered; first issuance & monitoring risk remain' },
  { stage: 'issuing', label: 'Issuing (credits issued)', defaultPct: 5, rangeNote: '0–10%', rationale: 'Track record of issuance; residual monitoring/reversal risk' },
];

const CONTRACT_TYPES = [
  { id: 'spot_forward', label: 'Spot-indexed forward', note: 'Price floats with benchmark each delivery period (100% indexed)' },
  { id: 'fixed_forward', label: 'Fixed-price forward', note: 'Fixed $/t, optional indexation blend + collar' },
  { id: 'prepay', label: 'Prepay (upfront PV)', note: 'Buyer pays PV of risk-adjusted deliveries upfront at its discount rate' },
  { id: 'streaming', label: 'Streaming (% of issuance)', note: 'Buyer takes a fixed % of whatever the project actually issues' },
];

const COUNTRIES = ['Brazil', 'Indonesia', 'Kenya', 'India', 'Colombia', 'Peru', 'Ghana', 'Cambodia', 'Mexico', 'DRC', 'Vietnam', 'United States', 'Australia', 'Other'];

// AFOLU project types subject to non-permanence / reversal risk (registry buffer pools apply).
const AFOLU_TYPES = ['redd_plus', 'afforestation_reforestation', 'soil_carbon', 'blue_carbon'];

// Registry buffer-pool contribution defaults for AFOLU non-permanence.
// ⚠ LABELED DEFAULTS — indicative of each registry's published buffer regime
// (VCS AFOLU non-permanence risk tool outputs 10–40%; ART TREES applies a 5%
// buffer plus uncertainty deductions; Gold Standard A/R uses a 20% compliance
// buffer). Hand-authored convention values, editable below — verify against the
// registry's current risk-tool output for a real deal.
const BUFFER_DEFAULTS = [
  { registry: 'vcs', label: 'Verra VCS (AFOLU risk tool)', defaultPct: 20, rangeNote: '10–40% per project risk score' },
  { registry: 'gold_standard', label: 'Gold Standard (A/R buffer)', defaultPct: 20, rangeNote: '20% fixed compliance buffer' },
  { registry: 'climate_action_reserve', label: 'Climate Action Reserve (forest)', defaultPct: 18, rangeNote: '~10–20% risk-based' },
  { registry: 'american_carbon_registry', label: 'ACR (IFM / A-R)', defaultPct: 16, rangeNote: '10–20% risk-based' },
  { registry: 'art6_itmo', label: 'ART TREES (jurisdictional)', defaultPct: 5, rangeNote: '5% buffer + uncertainty deduction' },
  { registry: 'cdm', label: 'CDM (tCER/lCER regime)', defaultPct: 0, rangeNote: 'temporary-credit regime — no buffer pool' },
];

// SDG co-benefit tags by project type.
// Methodology-based tagging aligned with the platform DCM reference catalogue
// (backend/api/v1/routes/dcm.py /ref/cdr-pathways co_benefits) and standard
// SDG-impact-tool claims per project family. LABELED indicative mapping —
// project-specific SDG certification (e.g. GS4GG) supersedes these tags.
const SDG_TAGS = {
  redd_plus: ['13 Climate action', '15 Life on land', '1 No poverty (community forestry)'],
  afforestation_reforestation: ['13 Climate action', '15 Life on land', '6 Clean water (watershed)'],
  soil_carbon: ['13 Climate action', '2 Zero hunger (yields)', '15 Life on land'],
  blue_carbon: ['13 Climate action', '14 Life below water', '1 No poverty (coastal livelihoods)'],
  improved_cookstoves: ['13 Climate action', '3 Good health', '5 Gender equality', '7 Clean energy'],
  renewable_energy: ['13 Climate action', '7 Affordable & clean energy'],
  methane_capture: ['13 Climate action', '7 Clean energy', '11 Sustainable cities (waste)'],
  industrial_efficiency: ['13 Climate action', '9 Industry & innovation'],
  direct_air_capture: ['13 Climate action', '9 Industry & innovation'],
};

// Illustrative ERPA book seeds (labeled ILLUSTRATIVE — for exploring the
// portfolio analytics; every figure is a hand-authored example term, not data).
const ILLUSTRATIVE_BOOK = [
  {
    name: 'Sumatra Mangrove Restoration [ILLUSTRATIVE]', methodologyKey: 'VM0033', standard: 'vcs', type: 'blue_carbon',
    country: 'Indonesia', stage: 'validated', contractType: 'fixed_forward', vintageStart: 2027,
    tenorYears: 8, avgPrice: 21.5, qualityScore: null, art6Authorized: false,
    deliveries: [28000, 32000, 38000, 42000, 45000, 45000, 45000, 45000],
  },
  {
    name: 'Lake Victoria Cookstoves [ILLUSTRATIVE]', methodologyKey: 'GS_TPDDTEC', standard: 'gold_standard', type: 'improved_cookstoves',
    country: 'Kenya', stage: 'issuing', contractType: 'spot_forward', vintageStart: 2026,
    tenorYears: 5, avgPrice: 9.0, qualityScore: null, art6Authorized: true,
    deliveries: [95000, 95000, 90000, 90000, 85000],
  },
  {
    name: 'Great Plains DAC Offtake [ILLUSTRATIVE]', methodologyKey: 'DAC_PILOT', standard: 'vcs', type: 'direct_air_capture',
    country: 'United States', stage: 'concept', contractType: 'prepay', vintageStart: 2028,
    tenorYears: 6, avgPrice: 185.0, qualityScore: null, art6Authorized: false,
    deliveries: [4000, 6000, 9000, 12000, 15000, 15000],
  },
];

// Herfindahl–Hirschman concentration index on volume shares (0–10,000 scale).
const hhi = (shares) => shares.reduce((s, x) => s + (x * 100) ** 2, 0);

// Deterministic lognormal percentile price bands (NO simulation / PRNG):
//   P(z) = P0 · exp(z · σ · √τ),  z ∈ {−2, −1, 0, +1, +2}
// Documented approximation: percentile levels of a driftless lognormal price
// one exercise period (τ = 1y) out; option value at each band is the intrinsic
// value of the flex volume at that price level.
const priceBand = (P0, sigma, z, tauYrs = 1) => P0 * Math.exp(z * sigma * Math.sqrt(tauYrs));

const fmt = (v, d = 1) => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });
const fmtUsd = (v, d = 2) => (v == null || isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d })}`;
const fmtT = (v) => (v == null || isNaN(v)) ? '—' : `${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })} t`;
const fmtPct = (v, d = 1) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}%`;

const Badge = ({ status, demoText }) => {
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live</span>;
  if (status === 'loading') return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Calling engine</span>;
  if (status === 'demo') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Demo{demoText ? ` — ${demoText}` : ' — engine unavailable'}</span>;
  return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Idle</span>;
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
const tdM = { ...td, fontFamily: T.mono };
const lbl = { fontSize: 11, color: T.sub, fontWeight: 600, display: 'block', marginBottom: 3 };
const Field = ({ label, children, width = 170 }) => (
  <div style={{ width }}>
    <span style={lbl}>{label}</span>
    {children}
  </div>
);
const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 };

export default function CarbonOfftakeStructurerPage() {
  // ── Project description ────────────────────────────────────────────────
  const [project, setProject] = useState({
    name: 'Rio Verde REDD+ Cluster', methodologyKey: 'VM0015', stage: 'registered',
    annualVolume: 250000, country: 'Brazil', vintageStart: 2026, vintageEnd: 2033,
  });
  const meth = METHODOLOGIES.find((m) => m.key === project.methodologyKey) || METHODOLOGIES[0];
  const setP = (k, v) => setProject((p) => ({ ...p, [k]: v }));

  // ── Structure terms ────────────────────────────────────────────────────
  const [terms, setTerms] = useState({
    contractType: 'fixed_forward',
    tenorYears: 7,
    volumePerYear: 250000,     // contracted t/yr (fixed-schedule contracts)
    fixedPrice: 24,            // $/t — user term
    indexationPct: 30,         // % weight on the (quality-adjusted) benchmark; rest fixed
    benchDriftPct: 4,          // user assumption: benchmark price drift %/yr
    floor: 15, ceiling: 45,    // collar $/t (0 = off)
    discountRatePct: 10,       // prepay PV discount rate
    streamingPct: 60,          // streaming: % of actual issuance purchased
    rampYears: 5,              // haircut maturation ramp (years to reach issuing-stage haircut)
    haircutOverridePct: '',    // optional override of the stage haircut
  });
  const setT_ = (k, v) => setTerms((p) => ({ ...p, [k]: v }));

  // Quality→price mapping parameters (documented linear mapping, editable)
  const [qmap, setQmap] = useState({ slopePct: 30, midpointScore: 50 });

  // ── Engine state ───────────────────────────────────────────────────────
  const [score, setScore] = useState({ status: 'idle', data: null, error: null });
  const [bench, setBench] = useState({ status: 'loading', data: null, error: null });
  const [corsiaRef, setCorsiaRef] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let alive = true;
    axios.get('/api/v1/carbon-credit-quality/ref/price-benchmarks', { timeout: 15000 })
      .then(({ data }) => { if (alive) setBench({ status: 'live', data, error: null }); })
      .catch((e) => { if (alive) setBench({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }); });
    axios.get('/api/v1/carbon-credit-quality/ref/corsia-eligibility', { timeout: 15000 })
      .then(({ data }) => { if (alive) setCorsiaRef({ status: 'live', data, error: null }); })
      .catch((e) => { if (alive) setCorsiaRef({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }); });
    return () => { alive = false; };
  }, []);

  // ── Compliance-eligibility overlay state ───────────────────────────────
  const [overlay, setOverlay] = useState({
    art6Authorized: false,     // user flag — host-country Article 6 authorization / corresponding adjustment
    caDiscountPct: 15,         // CA-risk price discount for unauthorized units — labeled emerging-market observation, editable
    compPremiumPct: 25,        // compliance-eligible vs voluntary price differential — labeled observation, editable
  });
  const setO = (k, v) => setOverlay((p) => ({ ...p, [k]: v }));

  // ── Buffer & reversal-risk state (AFOLU non-permanence) ────────────────
  const [buf, setBuf] = useState({
    bufferPct: '',             // blank = registry default from BUFFER_DEFAULTS
    reversalProbPct: 1.0,      // user annual reversal probability (%/yr)
    insPremPct: 2.0,           // insurance premium %/yr of credit value — labeled market-range note 1–5%
  });
  const setB = (k, v) => setBuf((p) => ({ ...p, [k]: v }));

  // ── Delivery-optionality state ──────────────────────────────────────────
  const [flex, setFlex] = useState({
    flexPct: 15,               // ±% volume flexibility band (seller put / buyer call)
    volPct: 40,                // user annualized price vol assumption for the bands
    topPct: 80,                // take-or-pay floor % of contracted volume
  });
  const setF = (k, v) => setFlex((p) => ({ ...p, [k]: v }));

  // ── Ratchet / CPI / FX indexation state ─────────────────────────────────
  const [adv, setAdv] = useState({
    ratchetYear: 4,            // quality reassessment event (period #, 0 = off)
    ratchetScore: '',          // user-expected reassessed score (blank = no ratchet)
    cpiOn: false, cpiPct: 2.5, // CPI escalation of the fixed leg (user assumption)
    fxOn: false, fxRate: 5.0, fxDriftPct: 2.0, fxCcy: 'BRL', // non-USD project currency clause (user FX assumptions)
  });
  const setA = (k, v) => setAdv((p) => ({ ...p, [k]: v }));

  // ── ERPA portfolio book state ────────────────────────────────────────────
  const [book, setBook] = useState([]);

  // ── Sustainability × financial state ────────────────────────────────────
  const [sf, setSf] = useState({
    icp: 50,                   // internal carbon price $/t (user)
    baseline: 500000,          // corporate gross emissions tCO2e/yr today (user)
    nzYear: 2035,              // net-zero target year (user)
    residualPct: 10,           // residual emissions at NZ year as % of baseline (user)
  });
  const setSF = (k, v) => setSf((p) => ({ ...p, [k]: v }));

  const scoreProject = useCallback(async () => {
    setScore({ status: 'loading', data: null, error: null });
    try {
      const { data } = await axios.post('/api/v1/carbon-credit-quality/score-project', {
        entity_id: 'offtake-desk',
        project_id: `OFT-${project.methodologyKey}-${project.vintageStart}`,
        project_name: project.name,
        standard: meth.standard,
        methodology: meth.key,
        project_type: meth.type,
        vintage_year: parseInt(project.vintageStart, 10) || 2026,
        volume_tco2e: parseFloat(project.annualVolume) || 0,
      }, { timeout: 20000 });
      setScore({ status: 'live', data, error: null });
    } catch (e) {
      setScore({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
    }
  }, [project, meth]);

  // ── Benchmark base price (live median for the project's category) ──────
  const benchCat = BENCH_CATEGORY(meth.type);
  const liveBench = bench.status === 'live' ? bench.data?.[benchCat] : null;
  const [benchPriceInput, setBenchPriceInput] = useState('');
  useEffect(() => {
    if (liveBench?.median_usd_per_t != null) setBenchPriceInput(String(liveBench.median_usd_per_t));
  }, [liveBench]);
  const benchPrice = parseFloat(benchPriceInput);

  // ── Quality adjustment factor (documented linear mapping) ──────────────
  // adjustedBenchmark = benchmark × (1 + slope% × (score − midpoint)/50 / 100)
  // With defaults (slope 30, midpoint 50): score 100 → +30%, score 50 → 0%, score 0 → −30%.
  const qualityScore = score.status === 'live' ? score.data?.overall_quality_score : null;
  const qualityFactor = useMemo(() => {
    if (qualityScore == null) return null;
    const slope = parseFloat(qmap.slopePct) || 0;
    const mid = parseFloat(qmap.midpointScore) || 50;
    return 1 + (slope * ((qualityScore - mid) / 50)) / 100;
  }, [qualityScore, qmap]);

  // ── Period-by-period economics ─────────────────────────────────────────
  const econ = useMemo(() => {
    const tenor = Math.max(1, Math.min(20, parseInt(terms.tenorYears, 10) || 1));
    const volYr = parseFloat(terms.volumePerYear) || 0;
    const annVol = parseFloat(project.annualVolume) || 0;
    const fixedP = parseFloat(terms.fixedPrice) || 0;
    const wIdx = Math.max(0, Math.min(100, parseFloat(terms.indexationPct) || 0)) / 100;
    const g = (parseFloat(terms.benchDriftPct) || 0) / 100;
    const floor = parseFloat(terms.floor) || 0;
    const ceiling = parseFloat(terms.ceiling) || 0;
    const dr = (parseFloat(terms.discountRatePct) || 0) / 100;
    const streamPct = Math.max(0, Math.min(100, parseFloat(terms.streamingPct) || 0)) / 100;
    const rampYears = Math.max(0, parseInt(terms.rampYears, 10) || 0);
    if (volYr <= 0 && annVol <= 0) return null;

    const stageRow = STAGE_HAIRCUTS.find((s) => s.stage === project.stage) || STAGE_HAIRCUTS[0];
    const override = parseFloat(terms.haircutOverridePct);
    const baseHaircut = !isNaN(override) && terms.haircutOverridePct !== '' ? override : stageRow.defaultPct;
    const issuingHaircut = STAGE_HAIRCUTS[3].defaultPct; // 5%

    // Benchmark path with quality adjustment (if scored). If not scored, the
    // unadjusted benchmark is used and the term sheet flags it.
    const qf = qualityFactor ?? 1;
    const haveBench = !isNaN(benchPrice) && benchPrice > 0;

    const rows = [];
    for (let t = 1; t <= tenor; t += 1) {
      // Haircut maturation: linear decline from the stage haircut to the
      // issuing-stage haircut over rampYears (modeling default; rampYears=0 → constant).
      const ramp = rampYears > 0 ? Math.min((t - 1) / rampYears, 1) : 0;
      const haircutPct = Math.max(issuingHaircut, baseHaircut - (baseHaircut - issuingHaircut) * ramp);

      const contracted = volYr;
      const expectedIssuance = annVol * (1 - haircutPct / 100);            // project-level risk-adj issuance
      const expectedDelivered = terms.contractType === 'streaming'
        ? expectedIssuance * streamPct                                      // streaming: % of actual issuance
        : Math.min(contracted, Number.MAX_VALUE) * (1 - haircutPct / 100); // fixed schedule, risk-adjusted

      const benchT = haveBench ? benchPrice * ((1 + g) ** t) : null;
      const qBenchT = benchT != null ? benchT * qf : null;

      // Raw contract price before collar
      let rawPrice;
      if (terms.contractType === 'spot_forward') rawPrice = qBenchT;                       // 100% indexed
      else rawPrice = qBenchT != null ? (1 - wIdx) * fixedP + wIdx * qBenchT : fixedP;     // blend (fixed_forward, prepay, streaming)

      // Collar payoff — real max/min math:
      //   effective = min( max(raw, floor), ceiling )
      //   floorPayoff  = max(floor − raw, 0)   (seller protection)
      //   ceilingPayoff = max(raw − ceiling, 0) (buyer protection)
      const hasFloor = floor > 0; const hasCeil = ceiling > 0 && ceiling > floor;
      let effPrice = rawPrice;
      let floorPay = 0; let ceilPay = 0;
      if (rawPrice != null) {
        if (hasFloor) { floorPay = Math.max(floor - rawPrice, 0); effPrice = Math.max(effPrice, floor); }
        if (hasCeil) { ceilPay = Math.max(rawPrice - ceiling, 0); effPrice = Math.min(effPrice, ceiling); }
      }

      const cash = effPrice != null ? expectedDelivered * effPrice : null;  // buyer cost = seller revenue (pre-fees)
      const df = 1 / ((1 + dr) ** t);
      rows.push({
        t, year: (parseInt(project.vintageStart, 10) || 2026) + t - 1,
        haircutPct, contracted, expectedIssuance, expectedDelivered,
        shortfall: terms.contractType === 'streaming' ? 0 : contracted - expectedDelivered,
        benchT, qBenchT, rawPrice, effPrice, floorPay, ceilPay,
        cash, pv: cash != null ? cash * df : null, df,
      });
    }

    const totDelivered = rows.reduce((s, r) => s + r.expectedDelivered, 0);
    const totContracted = rows.reduce((s, r) => s + r.contracted, 0);
    const totCash = rows.every((r) => r.cash != null) ? rows.reduce((s, r) => s + r.cash, 0) : null;
    const totPV = rows.every((r) => r.pv != null) ? rows.reduce((s, r) => s + r.pv, 0) : null;
    const avgPrice = totCash != null && totDelivered > 0 ? totCash / totDelivered : null;
    // Prepay: buyer pays PV of risk-adjusted deliveries upfront
    const prepayAmount = terms.contractType === 'prepay' ? totPV : null;
    const prepayEffPrice = prepayAmount != null && totDelivered > 0 ? prepayAmount / totDelivered : null;

    // Streaming vs fixed-schedule comparison (both risk-adjusted, same price path)
    const streamCompare = rows.map((r) => {
      const fixedDeliv = volYr * (1 - r.haircutPct / 100);
      const streamDeliv = (annVol * (1 - r.haircutPct / 100)) * streamPct;
      return {
        t: r.t, year: r.year,
        fixedDeliv, streamDeliv,
        fixedCost: r.effPrice != null ? fixedDeliv * r.effPrice : null,
        streamCost: r.effPrice != null ? streamDeliv * r.effPrice : null,
      };
    });

    return {
      rows, totDelivered, totContracted, totCash, totPV, avgPrice,
      prepayAmount, prepayEffPrice, baseHaircut, stageRow, streamCompare, haveBench,
    };
  }, [terms, project, benchPrice, qualityFactor]);

  // ── Compliance-eligibility overlay (CORSIA ref + Article 6 user flags) ──
  const corsiaLocal = useMemo(() => {
    if (corsiaRef.status !== 'live' || !corsiaRef.data) return null;
    const phase = corsiaRef.data.phase_2024_2026 || {};
    const programmes = phase.eligible_programmes || [];
    const vintageOk = (parseInt(project.vintageStart, 10) || 0) >= 2016; // ref: "Issued from 2016 onwards"
    return {
      programmes,
      vintageRequirement: phase.vintage_requirement,
      unitCriteria: phase.unit_criteria,
      footnote: phase.footnote,
      programmeOk: programmes.includes(meth.standard),
      vintageOk,
      eligible: programmes.includes(meth.standard) && vintageOk,
    };
  }, [corsiaRef, meth.standard, project.vintageStart]);

  const complianceValue = useMemo(() => {
    const base = econ?.avgPrice;
    if (base == null) return null;
    const prem = (parseFloat(overlay.compPremiumPct) || 0) / 100;
    const caDisc = (parseFloat(overlay.caDiscountPct) || 0) / 100;
    const compliancePrice = base * (1 + prem);                                   // compliance-eligible differential (labeled observation)
    const caAdjusted = overlay.art6Authorized ? compliancePrice : compliancePrice * (1 - caDisc);
    return { base, compliancePrice, caAdjusted, prem, caDisc };
  }, [econ, overlay]);

  // ── Buffer & reversal-risk model (AFOLU non-permanence) ─────────────────
  // Documented model: bufferContribution_t = delivered_t × b (set aside at issuance);
  // exposure_t = cumulative net delivered; gross EL_t = p × exposure_t (user annual
  // reversal probability p — EL is LINEAR in p by construction); buffer pool absorbs
  // losses first: net EL_t = max(0, grossEL_t − cumBuffer_t).
  const isAfolu = AFOLU_TYPES.includes(meth.type);
  const bufferModel = useMemo(() => {
    if (!econ || !isAfolu) return null;
    const regRow = BUFFER_DEFAULTS.find((r) => r.registry === meth.standard)
      || { registry: meth.standard, label: `${meth.standard.toUpperCase()} (generic)`, defaultPct: 20, rangeNote: 'generic 20% convention' };
    const bOverride = parseFloat(buf.bufferPct);
    const bPct = !isNaN(bOverride) && buf.bufferPct !== '' ? bOverride : regRow.defaultPct;
    const b = Math.max(0, Math.min(90, bPct)) / 100;
    const p = Math.max(0, parseFloat(buf.reversalProbPct) || 0) / 100;
    const ins = Math.max(0, parseFloat(buf.insPremPct) || 0) / 100;

    let cumNet = 0; let cumBuffer = 0;
    const rows = econ.rows.map((r) => {
      const bufferContrib = r.expectedDelivered * b;
      const netToBuyer = r.expectedDelivered * (1 - b);
      cumBuffer += bufferContrib;
      cumNet += netToBuyer;
      const grossEL = p * cumNet;                          // tonnes/yr expected reversal
      const covered = Math.min(grossEL, cumBuffer);
      const netEL = grossEL - covered;
      const px = r.effPrice;
      return {
        t: r.t, year: r.year, delivered: r.expectedDelivered, bufferContrib, netToBuyer,
        cumBuffer, cumNet, grossEL, netEL,
        grossElUsd: px != null ? grossEL * px : null,
        netElUsd: px != null ? netEL * px : null,
        insPremUsd: px != null ? ins * cumNet * px : null, // annual premium on the held/retired stock value
      };
    });
    const tot = (k) => (rows.every((x) => x[k] != null) ? rows.reduce((s, x) => s + x[k], 0) : null);
    return {
      regRow, bPct, p: p * 100, rows,
      totBuffer: cumBuffer, totNet: cumNet,
      totGrossElUsd: tot('grossElUsd'), totNetElUsd: tot('netElUsd'), totInsUsd: tot('insPremUsd'),
    };
  }, [econ, isAfolu, meth.standard, buf]);

  // Permanence-differentiated pricing (live benchmark ref when available)
  const permSpread = useMemo(() => {
    if (bench.status !== 'live' || !bench.data) return null;
    const durable = bench.data.tech_removal?.median_usd_per_t;
    const nature = bench.data.nature_based_removal?.median_usd_per_t;
    const avoid = bench.data.avoidance?.median_usd_per_t;
    if (durable == null || nature == null) return null;
    return { durable, nature, avoid, spread: durable - nature, ratio: durable / nature };
  }, [bench]);

  // ── Delivery optionality — deterministic percentile bands (no PRNG) ─────
  const flexModel = useMemo(() => {
    if (!econ || !econ.rows.length) return null;
    const first = econ.rows[0];
    const P0 = first.qBenchT ?? (!isNaN(benchPrice) && benchPrice > 0 ? benchPrice : null);
    const K = first.effPrice ?? (parseFloat(terms.fixedPrice) || null);
    if (P0 == null || K == null) return null;
    const sigma = Math.max(0, parseFloat(flex.volPct) || 0) / 100;
    const fPct = Math.max(0, Math.min(100, parseFloat(flex.flexPct) || 0)) / 100;
    const flexVol = (parseFloat(terms.volumePerYear) || 0) * fPct;
    const bands = [-2, -1, 0, 1, 2].map((z) => {
      const price = priceBand(P0, sigma, z);
      return {
        z, label: z === 0 ? 'median' : `${z > 0 ? '+' : ''}${z}σ`,
        price,
        buyerCall: flexVol * Math.max(price - K, 0),   // buyer exercises upsize when market > contract
        sellerPut: flexVol * Math.max(K - price, 0),   // seller exercises downsize/delivery right when market < contract
      };
    });
    const topPct = Math.max(0, Math.min(100, parseFloat(flex.topPct) || 0));
    const topVol = (parseFloat(terms.volumePerYear) || 0) * topPct / 100;
    return { P0, K, sigma: sigma * 100, flexVol, bands, topPct, topVol, topCost: topVol * K };
  }, [econ, benchPrice, terms.fixedPrice, terms.volumePerYear, flex]);

  // ── Ratchet + CPI/benchmark hybrid + FX indexation path ─────────────────
  const advPath = useMemo(() => {
    if (!econ || terms.contractType === 'streaming') return null;
    const fixed = parseFloat(terms.fixedPrice) || 0;
    const wIdx = Math.max(0, Math.min(100, parseFloat(terms.indexationPct) || 0)) / 100;
    const floor = parseFloat(terms.floor) || 0;
    const ceiling = parseFloat(terms.ceiling) || 0;
    const cpi = (parseFloat(adv.cpiPct) || 0) / 100;
    const rYear = parseInt(adv.ratchetYear, 10) || 0;
    const rScore = parseFloat(adv.ratchetScore);
    const hasRatchet = rYear > 0 && !isNaN(rScore) && adv.ratchetScore !== '';
    const slope = parseFloat(qmap.slopePct) || 0;
    const mid = parseFloat(qmap.midpointScore) || 50;
    const factorOf = (s) => 1 + (slope * ((s - mid) / 50)) / 100;
    const fx0 = parseFloat(adv.fxRate) || 0;
    const fxG = (parseFloat(adv.fxDriftPct) || 0) / 100;

    const rows = econ.rows.map((r) => {
      const fixedT = adv.cpiOn ? fixed * ((1 + cpi) ** (r.t - 1)) : fixed;
      const qfT = hasRatchet && r.t >= rYear ? factorOf(rScore) : (qualityFactor ?? 1);
      const qBenchT = r.benchT != null ? r.benchT * qfT : null;
      let raw;
      if (terms.contractType === 'spot_forward') raw = qBenchT;
      else raw = qBenchT != null ? (1 - wIdx) * fixedT + wIdx * qBenchT : fixedT;
      let eff = raw;
      if (raw != null) {
        if (floor > 0) eff = Math.max(eff, floor);
        if (ceiling > 0 && ceiling > floor) eff = Math.min(eff, ceiling);
      }
      const localPx = adv.fxOn && eff != null && fx0 > 0 ? eff * fx0 * ((1 + fxG) ** (r.t - 1)) : null;
      return {
        t: r.t, year: r.year, fixedT, qfT, qBenchT, adjEff: eff, baseEff: r.effPrice,
        delta: eff != null && r.effPrice != null ? eff - r.effPrice : null, localPx,
      };
    });
    return { rows, hasRatchet, rYear, rScore, factorNew: hasRatchet ? factorOf(rScore) : null };
  }, [econ, terms, adv, qmap, qualityFactor]);

  // ── ERPA portfolio book aggregation ─────────────────────────────────────
  const addCurrentToBook = useCallback(() => {
    if (!econ) return;
    setBook((prev) => [...prev, {
      name: project.name, methodologyKey: project.methodologyKey, standard: meth.standard, type: meth.type,
      country: project.country, stage: project.stage, contractType: terms.contractType,
      vintageStart: parseInt(project.vintageStart, 10) || 2026,
      tenorYears: econ.rows.length,
      avgPrice: econ.avgPrice ?? (parseFloat(terms.fixedPrice) || 0),
      qualityScore: qualityScore ?? null,
      art6Authorized: overlay.art6Authorized,
      deliveries: econ.rows.map((r) => r.expectedDelivered),
    }]);
  }, [econ, project, meth, terms, qualityScore, overlay.art6Authorized]);

  const bookAgg = useMemo(() => {
    if (!book.length) return null;
    const contracts = book.map((c, i) => {
      const totalVol = c.deliveries.reduce((s, v) => s + v, 0);
      const cat = BENCH_CATEGORY(c.type);
      const benchNow = bench.status === 'live' ? bench.data?.[cat]?.median_usd_per_t : (!isNaN(benchPrice) && benchPrice > 0 ? benchPrice : null);
      // Mark-to-benchmark P&L (documented): (benchmark_now − contract price) × risk-adjusted volume.
      const mtb = benchNow != null ? (benchNow - c.avgPrice) * totalVol : null;
      const corsiaOk = corsiaLocal ? corsiaLocal.programmes.includes(c.standard) && c.vintageStart >= 2016 : null;
      return { ...c, idx: i, totalVol, cat, benchNow, mtb, corsiaOk, sdg: SDG_TAGS[c.type] || [] };
    });
    const totVol = contracts.reduce((s, c) => s + c.totalVol, 0);
    if (totVol <= 0) return null;

    const years = [...new Set(contracts.flatMap((c) => c.deliveries.map((_, j) => c.vintageStart + j)))].sort((a, b) => a - b);
    const schedule = years.map((y) => {
      const row = { year: y, total: 0 };
      contracts.forEach((c) => {
        const j = y - c.vintageStart;
        const v = j >= 0 && j < c.deliveries.length ? c.deliveries[j] : 0;
        row[`c${c.idx}`] = v; row.total += v;
      });
      return row;
    });

    const scored = contracts.filter((c) => c.qualityScore != null);
    const scoredVol = scored.reduce((s, c) => s + c.totalVol, 0);
    const wq = scoredVol > 0 ? scored.reduce((s, c) => s + c.qualityScore * c.totalVol, 0) / scoredVol : null;

    const groupShares = (key) => {
      const m = {};
      contracts.forEach((c) => { m[c[key]] = (m[c[key]] || 0) + c.totalVol; });
      const entries = Object.entries(m).map(([k, v]) => ({ k, vol: v, share: v / totVol })).sort((a, b) => b.vol - a.vol);
      return { entries, hhi: hhi(entries.map((e) => e.share)) };
    };

    const totMtb = contracts.every((c) => c.mtb != null) ? contracts.reduce((s, c) => s + c.mtb, 0) : null;
    const wPrice = contracts.reduce((s, c) => s + c.avgPrice * c.totalVol, 0) / totVol;
    const sdgSet = [...new Set(contracts.flatMap((c) => c.sdg))];
    return {
      contracts, totVol, schedule, years, wq, scoredVol, totMtb, wPrice, sdgSet,
      byRegistry: groupShares('standard'), byMethodology: groupShares('methodologyKey'), byCountry: groupShares('country'),
    };
  }, [book, bench, benchPrice, corsiaLocal]);

  // ── Retirement planner vs corporate net-zero path ────────────────────────
  const planner = useMemo(() => {
    const base = parseFloat(sf.baseline) || 0;
    const nz = parseInt(sf.nzYear, 10) || 0;
    const resid = Math.max(0, Math.min(100, parseFloat(sf.residualPct) || 0)) / 100;
    const y0 = new Date().getFullYear();
    if (base <= 0 || nz <= y0) return null;
    const supplyByYear = {};
    if (bookAgg) bookAgg.schedule.forEach((r) => { supplyByYear[r.year] = r.total; });
    else if (econ) econ.rows.forEach((r) => { supplyByYear[r.year] = r.expectedDelivered; });
    const endY = Math.max(nz, ...Object.keys(supplyByYear).map(Number));
    const rows = [];
    let cum = 0;
    for (let y = y0; y <= endY; y += 1) {
      // User trajectory: gross emissions decline linearly from baseline to baseline×residual% at the NZ year, flat after.
      const frac = Math.min((y - y0) / (nz - y0), 1);
      const need = base * (1 - frac * (1 - resid));
      const supply = supplyByYear[y] || 0;
      cum += supply - need;
      rows.push({ year: y, need, supply, surplus: supply - need, cumSurplus: cum });
    }
    const costPerT = bookAgg ? bookAgg.wPrice : econ?.avgPrice ?? null;
    const icp = parseFloat(sf.icp) || 0;
    return { rows, costPerT, icp, icpDelta: costPerT != null ? icp - costPerT : null, source: bookAgg ? 'portfolio book' : 'current structure' };
  }, [sf, bookAgg, econ]);

  // ── Term-sheet export (CSV) ────────────────────────────────────────────
  const termSheetRows = useMemo(() => {
    if (!econ) return [];
    const ct = CONTRACT_TYPES.find((c) => c.id === terms.contractType);
    const rows = [
      ['Instrument', `Emission Reduction Purchase Agreement (ERPA) — ${ct?.label || terms.contractType}`],
      ['Project', `${project.name} (${meth.name})`],
      ['Standard / methodology', `${meth.standard.toUpperCase()} / ${meth.key}`],
      ['Host country', project.country],
      ['Project stage', econ.stageRow.label],
      ['Vintages', `${project.vintageStart}–${project.vintageEnd}`],
      ['Tenor', `${terms.tenorYears} delivery periods (annual)`],
      ['Contracted volume', terms.contractType === 'streaming' ? `${fmtPct(parseFloat(terms.streamingPct), 0)} of actual issuance (annual issuance est. ${fmt(project.annualVolume, 0)} t)` : `${fmt(terms.volumePerYear, 0)} tCO2e per period`],
      ['Delivery-risk haircut (start)', `${fmtPct(econ.baseHaircut, 0)} (${econ.stageRow.label}; market-convention modeling default, range ${econ.stageRow.rangeNote})`],
      ['Haircut maturation ramp', terms.rampYears > 0 ? `Linear to ${STAGE_HAIRCUTS[3].defaultPct}% over ${terms.rampYears} yrs (modeling default)` : 'None (constant haircut)'],
      ['Expected delivered (total)', `${fmt(econ.totDelivered, 0)} tCO2e`],
      ['Price basis', terms.contractType === 'spot_forward' ? '100% indexed to quality-adjusted benchmark' : `${fmtUsd(parseFloat(terms.fixedPrice))} /t fixed × ${100 - (parseFloat(terms.indexationPct) || 0)}% + benchmark-indexed × ${terms.indexationPct}%`],
      ['Benchmark', `${benchCat.replace(/_/g, ' ')} median ${econ.haveBench ? fmtUsd(benchPrice) : 'n/a'} /t (${bench.status === 'live' ? 'live engine reference' : 'engine unavailable'}), drift ${terms.benchDriftPct}%/yr (user assumption)`],
      ['Quality adjustment', qualityScore != null ? `Score ${fmt(qualityScore, 1)}/100 → benchmark × ${qualityFactor.toFixed(3)} (linear: ±${qmap.slopePct}% at score 100/0, pivot ${qmap.midpointScore})` : 'Not scored — no adjustment applied'],
      ['Floor / Ceiling', `${parseFloat(terms.floor) > 0 ? fmtUsd(parseFloat(terms.floor)) : 'none'} / ${parseFloat(terms.ceiling) > 0 ? fmtUsd(parseFloat(terms.ceiling)) : 'none'} per t`],
      ['Buyer cost (undiscounted)', econ.totCash != null ? fmtUsd(econ.totCash, 0) : 'n/a — benchmark price required'],
      ['Buyer cost (PV)', econ.totPV != null ? `${fmtUsd(econ.totPV, 0)} @ ${terms.discountRatePct}% (user rate)` : 'n/a'],
      ['Volume-weighted price', econ.avgPrice != null ? `${fmtUsd(econ.avgPrice)} /t` : 'n/a'],
    ];
    if (terms.contractType === 'prepay') {
      rows.push(['Prepay amount (upfront)', econ.prepayAmount != null ? `${fmtUsd(econ.prepayAmount, 0)} (PV @ ${terms.discountRatePct}%)` : 'n/a']);
      rows.push(['Prepay effective price', econ.prepayEffPrice != null ? `${fmtUsd(econ.prepayEffPrice)} /t on expected delivered` : 'n/a']);
    }
    return rows;
  }, [econ, terms, project, meth, benchCat, benchPrice, bench.status, qualityScore, qualityFactor, qmap]);

  const exportCsv = () => {
    const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
    const lines = [['Term', 'Value'].map(esc).join(',')]
      .concat(termSheetRows.map((r) => r.map(esc).join(',')));
    if (econ) {
      lines.push('');
      lines.push(['Period', 'Year', 'Haircut %', 'Contracted t', 'Expected delivered t', 'Benchmark $/t', 'Quality-adj bench $/t', 'Contract price $/t', 'Effective (collared) $/t', 'Cash $', 'PV $'].map(esc).join(','));
      econ.rows.forEach((r) => lines.push([r.t, r.year, r.haircutPct.toFixed(1), Math.round(r.contracted), Math.round(r.expectedDelivered), r.benchT?.toFixed(2) ?? '', r.qBenchT?.toFixed(2) ?? '', r.rawPrice?.toFixed(2) ?? '', r.effPrice?.toFixed(2) ?? '', r.cash?.toFixed(0) ?? '', r.pv?.toFixed(0) ?? ''].map(esc).join(',')));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'erpa_term_sheet.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const sd = score.data;
  const isStreaming = terms.contractType === 'streaming';

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.teal, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>NX2-06</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Carbon Offtake Structurer — ERPA Desk</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>ICVCM CCP Quality Engine</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Price Benchmarks</span>
          <span style={{ background: T.gold + '33', color: T.amber, border: `1px solid ${T.gold}66`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Forward · Prepay · Streaming · Collar</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 16, maxWidth: 1050 }}>
        Structure a forward carbon credit purchase agreement: the project is quality-scored live by the ICVCM CCP engine,
        deliveries are haircut for delivery risk by project stage (documented market-convention defaults, editable), the
        contract price blends a fixed leg with a quality-adjusted benchmark index inside an optional floor/ceiling collar,
        and the economics are computed period-by-period. Prepay contracts settle at PV; streaming contracts take a % of actual issuance.
      </div>

      {/* ── Project panel ────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>1 · Credit Project</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/carbon-credit-quality/score-project</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={score.status} demoText={score.error} /></div>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
          <Field label="Project name" width={230}><input style={inputStyle} value={project.name} onChange={(e) => setP('name', e.target.value)} /></Field>
          <Field label="Methodology (sets standard + type)" width={330}>
            <select style={inputStyle} value={project.methodologyKey} onChange={(e) => setP('methodologyKey', e.target.value)}>
              {METHODOLOGIES.map((m) => <option key={m.key} value={m.key}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="Stage" width={210}>
            <select style={inputStyle} value={project.stage} onChange={(e) => setP('stage', e.target.value)}>
              {STAGE_HAIRCUTS.map((s) => <option key={s.stage} value={s.stage}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Annual volume (tCO2e/yr)" width={160}><input type="number" min="0" style={inputStyle} value={project.annualVolume} onChange={(e) => setP('annualVolume', e.target.value)} /></Field>
          <Field label="Country" width={140}>
            <select style={inputStyle} value={project.country} onChange={(e) => setP('country', e.target.value)}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="First vintage" width={100}><input type="number" style={inputStyle} value={project.vintageStart} onChange={(e) => setP('vintageStart', e.target.value)} /></Field>
          <Field label="Last vintage" width={100}><input type="number" style={inputStyle} value={project.vintageEnd} onChange={(e) => setP('vintageEnd', e.target.value)} /></Field>
          <button onClick={scoreProject} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font }}>
            Score project →
          </button>
        </div>
        <div style={{ fontSize: 10.5, color: T.sub }}>
          Standard <b style={{ fontFamily: T.mono }}>{meth.standard.toUpperCase()}</b> · type <b style={{ fontFamily: T.mono }}>{meth.type}</b> · benchmark category <b style={{ fontFamily: T.mono }}>{benchCat}</b>.
          Country and stage inform the delivery-risk model locally; the quality engine scores standard/methodology/type/vintage/volume.
        </div>

        {score.status === 'live' && sd && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <Kpi label="Quality score" value={`${fmt(sd.overall_quality_score, 1)} / 100`} sub={`Grade ${sd.quality_grade}`} color={sd.overall_quality_score >= 65 ? T.green : sd.overall_quality_score >= 45 ? T.amber : T.red} />
              <Kpi label="CCP label" value={sd.ccp_eligible ? 'Eligible' : 'Not eligible'} sub="ICVCM Core Carbon Principles" color={sd.ccp_eligible ? T.green : T.red} />
              <Kpi label="CORSIA" value={sd.corsia_eligible ? 'Eligible' : 'Not eligible'} sub="ICAO Doc 9501 (2024–26 cycle)" color={sd.corsia_eligible ? T.green : T.red} />
              <Kpi label="Permanence risk" value={sd.permanence_risk?.level?.replace(/_/g, ' ') || '—'} sub={sd.permanence_risk?.mitigation} color={(sd.permanence_risk?.risk_score || 0) > 0.5 ? T.red : T.teal} />
              <Kpi label="Engine price range" value={sd.price_range_usd ? `${fmtUsd(sd.price_range_usd.min_usd_per_t, 0)}–${fmtUsd(sd.price_range_usd.max_usd_per_t, 0)}` : '—'} sub={sd.price_range_usd?.ccp_premium_applied ? 'incl. CCP premium' : 'no CCP premium'} color={T.indigo} />
            </div>
            {(sd.issues || []).length > 0 && (
              <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 12px', fontSize: 11.5, color: '#92400e' }}>
                <b>Engine flags:</b> {sd.issues.join(' · ')}
              </div>
            )}
          </div>
        )}
        {score.status === 'demo' && <div style={{ fontSize: 12, color: T.sub, marginTop: 10 }}>Quality engine unreachable — no score applied; the benchmark is used unadjusted (this page never fabricates a score). Error: {String(score.error)}</div>}

        {/* Benchmarks */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 8px' }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: T.navy }}>Price benchmarks by category</h3>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /ref/price-benchmarks</span>
          <Badge status={bench.status} demoText={bench.error} />
        </div>
        {bench.status === 'live' && bench.data && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Category</th><th style={th}>Min $/t</th><th style={th}>Median $/t</th><th style={th}>Max $/t</th><th style={th}>Notes</th></tr></thead>
            <tbody>
              {['nature_based_removal', 'tech_removal', 'avoidance'].map((k) => (
                <tr key={k} style={k === benchCat ? { background: T.gold + '18' } : undefined}>
                  <td style={{ ...td, fontWeight: k === benchCat ? 700 : 500, color: T.navy }}>{k.replace(/_/g, ' ')}{k === benchCat ? ' ← this project' : ''}</td>
                  <td style={tdM}>{fmtUsd(bench.data[k]?.min_usd_per_t, 0)}</td>
                  <td style={tdM}>{fmtUsd(bench.data[k]?.median_usd_per_t, 0)}</td>
                  <td style={tdM}>{fmtUsd(bench.data[k]?.max_usd_per_t, 0)}</td>
                  <td style={td}>{bench.data[k]?.description}</td>
                </tr>
              ))}
              <tr>
                <td style={{ ...td, fontWeight: 600, color: T.navy }}>CCP label premium</td>
                <td style={tdM} colSpan={3}>+{bench.data.ccp_label_premium?.premium_pct_over_unlabelled}% (up to +{bench.data.ccp_label_premium?.max_premium_pct}%)</td>
                <td style={td}>{bench.data.ccp_label_premium?.description}</td>
              </tr>
            </tbody>
          </table>
        )}
        {bench.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Benchmark reference unreachable — enter a benchmark price manually below. Error: {String(bench.error)}</div>}
      </div>

      {/* ── Structure panel ──────────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, color: T.navy }}>2 · Contract Structure</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {CONTRACT_TYPES.map((c) => (
            <button key={c.id} onClick={() => setT_('contractType', c.id)} style={{
              background: terms.contractType === c.id ? T.navy : '#fff', color: terms.contractType === c.id ? '#fff' : T.navy,
              border: `1px solid ${terms.contractType === c.id ? T.navy : T.border}`, borderRadius: 8, padding: '8px 14px',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: T.font, textAlign: 'left', maxWidth: 250,
            }}>
              {c.label}
              <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>{c.note}</div>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Field label="Tenor (delivery periods, yrs)" width={150}><input type="number" min="1" max="20" style={inputStyle} value={terms.tenorYears} onChange={(e) => setT_('tenorYears', e.target.value)} /></Field>
          {!isStreaming && <Field label="Contracted volume (t/yr)" width={160}><input type="number" min="0" style={inputStyle} value={terms.volumePerYear} onChange={(e) => setT_('volumePerYear', e.target.value)} /></Field>}
          {isStreaming && <Field label="Streaming % of issuance" width={150}><input type="number" min="0" max="100" style={inputStyle} value={terms.streamingPct} onChange={(e) => setT_('streamingPct', e.target.value)} /></Field>}
          {terms.contractType !== 'spot_forward' && <Field label="Fixed price ($/t)" width={120}><input type="number" min="0" step="0.5" style={inputStyle} value={terms.fixedPrice} onChange={(e) => setT_('fixedPrice', e.target.value)} /></Field>}
          {terms.contractType !== 'spot_forward' && <Field label="Indexation to benchmark (%)" width={160}><input type="number" min="0" max="100" style={inputStyle} value={terms.indexationPct} onChange={(e) => setT_('indexationPct', e.target.value)} /></Field>}
          <Field label="Benchmark price ($/t)" width={150}>
            <input type="number" min="0" step="0.5" style={inputStyle} value={benchPriceInput} onChange={(e) => setBenchPriceInput(e.target.value)} />
            <span style={{ fontSize: 9.5, color: bench.status === 'live' ? T.green : T.amber }}>{bench.status === 'live' ? `live ${benchCat.replace(/_/g, ' ')} median (editable)` : 'manual — ref engine offline'}</span>
          </Field>
          <Field label="Benchmark drift (%/yr)" width={140}>
            <input type="number" step="0.5" style={inputStyle} value={terms.benchDriftPct} onChange={(e) => setT_('benchDriftPct', e.target.value)} />
            <span style={{ fontSize: 9.5, color: T.sub }}>user assumption</span>
          </Field>
          <Field label="Floor ($/t, 0=off)" width={110}><input type="number" min="0" step="0.5" style={inputStyle} value={terms.floor} onChange={(e) => setT_('floor', e.target.value)} /></Field>
          <Field label="Ceiling ($/t, 0=off)" width={110}><input type="number" min="0" step="0.5" style={inputStyle} value={terms.ceiling} onChange={(e) => setT_('ceiling', e.target.value)} /></Field>
          <Field label="Discount rate (%/yr)" width={130}>
            <input type="number" min="0" step="0.5" style={inputStyle} value={terms.discountRatePct} onChange={(e) => setT_('discountRatePct', e.target.value)} />
            <span style={{ fontSize: 9.5, color: T.sub }}>prepay / PV — user rate</span>
          </Field>
        </div>

        {/* Haircut + quality mapping documentation */}
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 16 }}>
          <div style={{ flex: 1.6, minWidth: 420 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>
              Delivery-risk haircut table
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, marginLeft: 8 }}>Modeling defaults — market-convention estimates, not observed data</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Stage</th><th style={th}>Default haircut</th><th style={th}>Convention range</th><th style={th}>Rationale</th></tr></thead>
              <tbody>
                {STAGE_HAIRCUTS.map((s) => (
                  <tr key={s.stage} style={s.stage === project.stage ? { background: T.gold + '18' } : undefined}>
                    <td style={{ ...td, fontWeight: s.stage === project.stage ? 700 : 500, color: T.navy }}>{s.label}{s.stage === project.stage ? ' ←' : ''}</td>
                    <td style={tdM}>{s.defaultPct}%</td>
                    <td style={tdM}>{s.rangeNote}</td>
                    <td style={td}>{s.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, alignItems: 'flex-end' }}>
              <Field label="Haircut override (%, blank = stage default)" width={220}><input type="number" min="0" max="95" style={inputStyle} value={terms.haircutOverridePct} onChange={(e) => setT_('haircutOverridePct', e.target.value)} placeholder={`stage default ${STAGE_HAIRCUTS.find((s) => s.stage === project.stage)?.defaultPct}%`} /></Field>
              <Field label="Maturation ramp (yrs to issuing-stage 5%, 0 = constant)" width={280}><input type="number" min="0" max="20" style={inputStyle} value={terms.rampYears} onChange={(e) => setT_('rampYears', e.target.value)} /></Field>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 320 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>
              Quality → price mapping
              <span style={{ background: T.cream, color: T.sub, padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, marginLeft: 8, fontFamily: T.mono }}>documented linear mapping</span>
            </div>
            <div style={{ fontSize: 11.5, color: T.slate, background: T.cream, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', fontFamily: T.mono }}>
              adj. benchmark = benchmark × (1 + slope × (score − pivot) / 50)
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
              <Field label="Slope (±% at score 100/0)" width={150}><input type="number" min="0" max="100" style={inputStyle} value={qmap.slopePct} onChange={(e) => setQmap((p) => ({ ...p, slopePct: e.target.value }))} /></Field>
              <Field label="Pivot score (no adj.)" width={130}><input type="number" min="0" max="100" style={inputStyle} value={qmap.midpointScore} onChange={(e) => setQmap((p) => ({ ...p, midpointScore: e.target.value }))} /></Field>
            </div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 8 }}>
              {qualityScore != null && qualityFactor != null
                ? <>Live score <b style={{ fontFamily: T.mono }}>{fmt(qualityScore, 1)}</b> → factor <b style={{ fontFamily: T.mono, color: qualityFactor >= 1 ? T.green : T.red }}>×{qualityFactor.toFixed(3)}</b> ({qualityFactor >= 1 ? '+' : ''}{fmtPct((qualityFactor - 1) * 100)} vs benchmark)</>
                : 'Score the project (panel 1) to apply the quality adjustment; until then the benchmark is used unadjusted.'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Economics ────────────────────────────────────────────────────── */}
      {econ && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>3 · Period-by-Period Economics</h2>
            <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>local computation — user terms × live quality score × live benchmark</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <Kpi label="Contracted volume" value={fmtT(econ.totContracted)} sub={isStreaming ? 'streaming — no fixed schedule' : `${terms.tenorYears} periods`} />
            <Kpi label="Expected delivered" value={fmtT(econ.totDelivered)} sub={`after ${fmtPct(econ.baseHaircut, 0)} start haircut${parseInt(terms.rampYears, 10) > 0 ? ' + maturation ramp' : ''}`} color={T.teal} />
            <Kpi label="Buyer cost (undisc.)" value={econ.totCash != null ? fmtUsd(econ.totCash, 0) : '—'} sub="= seller revenue, pre-fees" />
            <Kpi label="Buyer cost (PV)" value={econ.totPV != null ? fmtUsd(econ.totPV, 0) : '—'} sub={`@ ${terms.discountRatePct}% user discount rate`} color={T.indigo} />
            <Kpi label="Volume-weighted price" value={econ.avgPrice != null ? `${fmtUsd(econ.avgPrice)}/t` : '—'} sub="on expected delivered volume" color={T.navy} />
            {terms.contractType === 'prepay' && <Kpi label="Prepay (upfront)" value={econ.prepayAmount != null ? fmtUsd(econ.prepayAmount, 0) : '—'} sub={econ.prepayEffPrice != null ? `${fmtUsd(econ.prepayEffPrice)}/t effective` : ''} color={T.purple} />}
          </div>

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ flex: 1.4, minWidth: 380 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Delivery schedule — contracted vs risk-adjusted expected (t)</div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={econ.rows}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => fmtT(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {!isStreaming && <Bar dataKey="contracted" name="Contracted" fill={T.border} radius={[3, 3, 0, 0]} />}
                  <Bar dataKey="expectedDelivered" name="Expected delivered" fill={T.teal} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {econ.haveBench && (
              <div style={{ flex: 1.4, minWidth: 380 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Price path — contract vs quality-adjusted benchmark, collar bounds ($/t)</div>
                <ResponsiveContainer width="100%" height={230}>
                  <ComposedChart data={econ.rows}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip formatter={(v) => fmtUsd(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area dataKey="qBenchT" name="Quality-adj benchmark" fill={T.gold + '33'} stroke={T.gold} strokeWidth={1.5} />
                    <Line dataKey="effPrice" name="Effective contract price" stroke={T.navy} strokeWidth={2.5} dot={false} />
                    {parseFloat(terms.floor) > 0 && <Line dataKey={() => parseFloat(terms.floor)} name="Floor" stroke={T.green} strokeDasharray="5 4" dot={false} />}
                    {parseFloat(terms.ceiling) > 0 && <Line dataKey={() => parseFloat(terms.ceiling)} name="Ceiling" stroke={T.red} strokeDasharray="5 4" dot={false} />}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
            <thead>
              <tr>
                <th style={th}>Period</th><th style={th}>Year</th><th style={th}>Haircut</th>
                {!isStreaming && <th style={th}>Contracted (t)</th>}
                <th style={th}>Expected delivered (t)</th>
                {!isStreaming && <th style={th}>Shortfall (t)</th>}
                <th style={th}>Benchmark $/t</th><th style={th}>Q-adj bench $/t</th><th style={th}>Contract $/t</th>
                <th style={th}>Floor payoff</th><th style={th}>Ceiling payoff</th><th style={th}>Effective $/t</th>
                <th style={th}>Buyer cost $</th><th style={th}>PV $</th>
              </tr>
            </thead>
            <tbody>
              {econ.rows.map((r) => (
                <tr key={r.t}>
                  <td style={tdM}>{r.t}</td>
                  <td style={tdM}>{r.year}</td>
                  <td style={tdM}>{fmtPct(r.haircutPct, 1)}</td>
                  {!isStreaming && <td style={tdM}>{fmt(r.contracted, 0)}</td>}
                  <td style={{ ...tdM, fontWeight: 700, color: T.teal }}>{fmt(r.expectedDelivered, 0)}</td>
                  {!isStreaming && <td style={{ ...tdM, color: r.shortfall > 0 ? T.red : T.slate }}>{fmt(r.shortfall, 0)}</td>}
                  <td style={tdM}>{r.benchT != null ? fmtUsd(r.benchT) : '—'}</td>
                  <td style={tdM}>{r.qBenchT != null ? fmtUsd(r.qBenchT) : '—'}</td>
                  <td style={tdM}>{r.rawPrice != null ? fmtUsd(r.rawPrice) : '—'}</td>
                  <td style={{ ...tdM, color: r.floorPay > 0 ? T.green : T.slate }}>{r.floorPay > 0 ? `+${fmtUsd(r.floorPay)}` : '—'}</td>
                  <td style={{ ...tdM, color: r.ceilPay > 0 ? T.red : T.slate }}>{r.ceilPay > 0 ? `−${fmtUsd(r.ceilPay)}` : '—'}</td>
                  <td style={{ ...tdM, fontWeight: 700, color: T.navy }}>{r.effPrice != null ? fmtUsd(r.effPrice) : '—'}</td>
                  <td style={tdM}>{r.cash != null ? fmtUsd(r.cash, 0) : '—'}</td>
                  <td style={tdM}>{r.pv != null ? fmtUsd(r.pv, 0) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 10.5, color: T.sub }}>
            Collar payoff: effective = min(max(contract, floor), ceiling); floor payoff = max(floor − contract, 0) accrues to the seller,
            ceiling payoff = max(contract − ceiling, 0) accrues to the buyer. Contract $/t = (1 − w)·fixed + w·quality-adjusted benchmark, w = indexation weight.
            {terms.contractType === 'prepay' && ' Prepay = Σ PV(expected delivered × effective price) at the user discount rate — the buyer bears delivery risk in exchange for the discount.'}
          </div>

          {/* Streaming vs fixed comparison */}
          {isStreaming && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>Streaming ({terms.streamingPct}% of issuance) vs fixed schedule ({fmt(terms.volumePerYear, 0)} t/yr) — same price path, both risk-adjusted</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Year</th><th style={th}>Fixed-schedule delivered (t)</th><th style={th}>Streaming delivered (t)</th><th style={th}>Fixed cost $</th><th style={th}>Streaming cost $</th><th style={th}>Δ volume (t)</th></tr></thead>
                <tbody>
                  {econ.streamCompare.map((r) => (
                    <tr key={r.t}>
                      <td style={tdM}>{r.year}</td>
                      <td style={tdM}>{fmt(r.fixedDeliv, 0)}</td>
                      <td style={{ ...tdM, fontWeight: 700, color: T.purple }}>{fmt(r.streamDeliv, 0)}</td>
                      <td style={tdM}>{r.fixedCost != null ? fmtUsd(r.fixedCost, 0) : '—'}</td>
                      <td style={tdM}>{r.streamCost != null ? fmtUsd(r.streamCost, 0) : '—'}</td>
                      <td style={{ ...tdM, color: r.streamDeliv - r.fixedDeliv >= 0 ? T.green : T.red }}>{fmt(r.streamDeliv - r.fixedDeliv, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
                Streaming scales with what the project actually issues (no fixed-schedule shortfall exposure); a fixed schedule
                gives volume certainty on paper but bears the delivery haircut as shortfall risk.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Term sheet ───────────────────────────────────────────────────── */}
      {econ && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>4 · Term-Sheet Summary</h2>
            <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>indicative — for negotiation, not a binding offer</span>
            <button onClick={exportCsv} style={{ marginLeft: 'auto', background: T.gold, color: T.navy, border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: T.font }}>
              ⬇ Export CSV
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {termSheetRows.map(([k, v]) => (
                <tr key={k}>
                  <td style={{ ...td, width: 260, fontWeight: 700, color: T.navy, verticalAlign: 'top' }}>{k}</td>
                  <td style={{ ...td, fontFamily: T.mono, fontSize: 11.5 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 5 · Compliance-eligibility overlay ───────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>5 · Compliance-Eligibility Overlay — CORSIA · Article 6</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/carbon-credit-quality/ref/corsia-eligibility</span>
          <Badge status={corsiaRef.status} demoText={corsiaRef.error} />
          <a href="/compliance-carbon-desk" style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 700, color: T.blue }}>
            Mechanism-level compliance analytics → Compliance Carbon Desk
          </a>
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ flex: 1.3, minWidth: 380 }}>
            {corsiaLocal ? (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                  <Kpi label="CORSIA (this contract)" value={corsiaLocal.eligible ? 'Eligible' : 'Not eligible'}
                    sub={`programme ${corsiaLocal.programmeOk ? '✓' : '✗'} · vintage ≥2016 ${corsiaLocal.vintageOk ? '✓' : '✗'}`}
                    color={corsiaLocal.eligible ? T.green : T.red} />
                  <Kpi label="Engine CORSIA flag" value={sd?.corsia_eligible == null ? 'not scored' : sd.corsia_eligible ? 'Eligible' : 'Not eligible'}
                    sub="from live quality-score run (panel 1)" color={sd?.corsia_eligible ? T.green : T.sub} />
                  <Kpi label="Article 6 authorization" value={overlay.art6Authorized ? 'Authorized (CA applied)' : 'Not authorized'}
                    sub="user flag — host-country corresponding adjustment" color={overlay.art6Authorized ? T.green : T.amber} />
                </div>
                <div style={{ fontSize: 11, color: T.slate, background: T.cream, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px' }}>
                  <b>CORSIA 2024–26 eligible programmes (live ref):</b> {corsiaLocal.programmes.map((p) => p.toUpperCase()).join(' · ')}.
                  {' '}{corsiaLocal.vintageRequirement}. {corsiaLocal.unitCriteria}. <i>{corsiaLocal.footnote}</i>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: T.sub }}>CORSIA reference unreachable — no eligibility flag is computed without the live ref (nothing is fabricated). Error: {String(corsiaRef.error || '')}</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 340 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>
              Compliance-market premium & CA-risk pricing
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, marginLeft: 8 }}>labeled market observations — editable</span>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
              <Field label="Compliance premium (%)" width={160}>
                <input type="number" step="1" style={inputStyle} value={overlay.compPremiumPct} onChange={(e) => setO('compPremiumPct', e.target.value)} />
                <span style={{ fontSize: 9.5, color: T.sub }}>voluntary → compliance-eligible differential (observation)</span>
              </Field>
              <Field label="CA-risk discount (%)" width={160}>
                <input type="number" step="1" style={inputStyle} value={overlay.caDiscountPct} onChange={(e) => setO('caDiscountPct', e.target.value)} />
                <span style={{ fontSize: 9.5, color: T.sub }}>unauthorized units — emerging-market observation</span>
              </Field>
              <Field label="Art 6 authorized?" width={130}>
                <select style={inputStyle} value={overlay.art6Authorized ? 'yes' : 'no'} onChange={(e) => setO('art6Authorized', e.target.value === 'yes')}>
                  <option value="no">No (CA risk)</option>
                  <option value="yes">Yes (CA applied)</option>
                </select>
              </Field>
            </div>
            {complianceValue ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={td}>Voluntary-market contract price (vol-weighted)</td><td style={{ ...tdM, fontWeight: 700 }}>{fmtUsd(complianceValue.base)}/t</td></tr>
                  <tr><td style={td}>+ compliance-eligibility premium ({fmtPct(complianceValue.prem * 100, 0)})</td><td style={tdM}>{fmtUsd(complianceValue.compliancePrice)}/t</td></tr>
                  <tr>
                    <td style={td}>{overlay.art6Authorized ? 'Authorized — no CA discount' : `− CA-risk discount (${fmtPct(complianceValue.caDisc * 100, 0)})`}</td>
                    <td style={{ ...tdM, fontWeight: 700, color: T.indigo }}>{fmtUsd(complianceValue.caAdjusted)}/t</td>
                  </tr>
                </tbody>
              </table>
            ) : <div style={{ fontSize: 11.5, color: T.sub }}>Compute the contract economics (benchmark price required) to see the compliance-adjusted value.</div>}
          </div>
        </div>
      </div>

      {/* ── 6 · Buffer & reversal risk ───────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>6 · Buffer Pool & Reversal Risk — Non-Permanence (AFOLU)</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>EL = p × exposure — linear in the user reversal probability by construction</span>
        </div>
        {!isAfolu && (
          <div style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>
            Project type <b style={{ fontFamily: T.mono }}>{meth.type}</b> is not AFOLU — no registry buffer pool applies.
            {meth.type === 'direct_air_capture' && ' Geological storage is treated as durable (1000+ yr) — see the permanence spread panel below.'}
          </div>
        )}
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ flex: 1.6, minWidth: 440 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>
              Registry buffer-pool contribution defaults
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, marginLeft: 8 }}>Labeled defaults — verify against the registry risk tool</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
              <thead><tr><th style={th}>Registry</th><th style={th}>Default buffer</th><th style={th}>Published regime</th></tr></thead>
              <tbody>
                {BUFFER_DEFAULTS.map((b) => (
                  <tr key={b.registry} style={b.registry === meth.standard && isAfolu ? { background: T.gold + '18' } : undefined}>
                    <td style={{ ...td, fontWeight: b.registry === meth.standard ? 700 : 500, color: T.navy }}>{b.label}{b.registry === meth.standard && isAfolu ? ' ←' : ''}</td>
                    <td style={tdM}>{b.defaultPct}%</td>
                    <td style={td}>{b.rangeNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {isAfolu && (
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <Field label="Buffer contribution (%, blank = registry default)" width={230}>
                  <input type="number" min="0" max="90" style={inputStyle} value={buf.bufferPct} onChange={(e) => setB('bufferPct', e.target.value)} placeholder={`default ${bufferModel?.regRow?.defaultPct ?? 20}%`} />
                </Field>
                <Field label="Annual reversal probability (%/yr)" width={190}>
                  <input type="number" min="0" step="0.1" style={inputStyle} value={buf.reversalProbPct} onChange={(e) => setB('reversalProbPct', e.target.value)} />
                  <span style={{ fontSize: 9.5, color: T.sub }}>user assumption — fire/political/tenure risk</span>
                </Field>
                <Field label="Insurance premium (%/yr of stock value)" width={220}>
                  <input type="number" min="0" step="0.1" style={inputStyle} value={buf.insPremPct} onChange={(e) => setB('insPremPct', e.target.value)} />
                  <span style={{ fontSize: 9.5, color: T.amber }}>labeled market-range note: reversal covers quoted ~1–5%/yr</span>
                </Field>
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 320 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>
              Permanence-differentiated pricing — durable CDR vs AFOLU
              <span style={{ background: T.cream, color: T.sub, padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, marginLeft: 8, fontFamily: T.mono }}>live benchmark ref</span>
            </div>
            {permSpread ? (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Kpi label="Durable tech removal" value={`${fmtUsd(permSpread.durable, 0)}/t`} sub="engine median — DAC/BECCS, 1000+ yr" color={T.indigo} />
                <Kpi label="Nature-based (AFOLU)" value={`${fmtUsd(permSpread.nature, 0)}/t`} sub="engine median — reversal-exposed" color={T.teal} />
                <Kpi label="Permanence spread" value={`${fmtUsd(permSpread.spread, 0)}/t`} sub={`durable trades ~${fmt(permSpread.ratio, 1)}× nature-based (labeled market observation via engine ref)`} color={T.navy} />
              </div>
            ) : <div style={{ fontSize: 11.5, color: T.sub }}>Benchmark ref offline — no spread shown without live reference data.</div>}
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 8 }}>
              The spread compensates buyers for reversal risk, buffer dilution and re-issuance friction on AFOLU credits;
              durable removals carry engineered-storage counterparty risk instead.
            </div>
          </div>
        </div>
        {isAfolu && bufferModel && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <Kpi label="Buffer contribution" value={fmtPct(bufferModel.bPct, 0)} sub={`${bufferModel.regRow.label} — set aside at issuance`} color={T.teal} />
              <Kpi label="Total buffer credits" value={fmtT(bufferModel.totBuffer)} sub={`net to buyer ${fmtT(bufferModel.totNet)}`} />
              <Kpi label="Gross reversal EL" value={bufferModel.totGrossElUsd != null ? fmtUsd(bufferModel.totGrossElUsd, 0) : '—'} sub={`p = ${fmtPct(bufferModel.p)} /yr × cumulative stock (linear in p)`} color={T.red} />
              <Kpi label="Net EL after buffer" value={bufferModel.totNetElUsd != null ? fmtUsd(bufferModel.totNetElUsd, 0) : '—'} sub="buffer pool absorbs first losses" color={T.amber} />
              <Kpi label="Insurance premium (Σ)" value={bufferModel.totInsUsd != null ? fmtUsd(bufferModel.totInsUsd, 0) : '—'} sub={`@ ${buf.insPremPct}%/yr of stock value — compare vs gross EL`} color={T.indigo} />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Year</th><th style={th}>Delivered (t)</th><th style={th}>Buffer contrib (t)</th><th style={th}>Net to buyer (t)</th>
                  <th style={th}>Cum buffer (t)</th><th style={th}>Cum stock (t)</th><th style={th}>Gross EL (t/yr)</th><th style={th}>Net EL (t/yr)</th>
                  <th style={th}>Gross EL $</th><th style={th}>Insurance $/yr</th>
                </tr>
              </thead>
              <tbody>
                {bufferModel.rows.map((r) => (
                  <tr key={r.t}>
                    <td style={tdM}>{r.year}</td>
                    <td style={tdM}>{fmt(r.delivered, 0)}</td>
                    <td style={{ ...tdM, color: T.teal }}>{fmt(r.bufferContrib, 0)}</td>
                    <td style={tdM}>{fmt(r.netToBuyer, 0)}</td>
                    <td style={tdM}>{fmt(r.cumBuffer, 0)}</td>
                    <td style={tdM}>{fmt(r.cumNet, 0)}</td>
                    <td style={{ ...tdM, color: T.red }}>{fmt(r.grossEL, 0)}</td>
                    <td style={{ ...tdM, color: r.netEL > 0 ? T.red : T.green, fontWeight: 700 }}>{fmt(r.netEL, 0)}</td>
                    <td style={tdM}>{r.grossElUsd != null ? fmtUsd(r.grossElUsd, 0) : '—'}</td>
                    <td style={{ ...tdM, color: T.indigo }}>{r.insPremUsd != null ? fmtUsd(r.insPremUsd, 0) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
              Model: buffer = delivered × b (registry set-aside); exposure = cumulative net delivered stock; gross EL = p × exposure
              (expected annual reversal, LINEAR in p); net EL = max(0, gross EL − cumulative buffer). Insurance premium = rate × stock value —
              insure when the premium is below your risk-priced EL, self-insure via buffer otherwise.
            </div>
          </div>
        )}
      </div>

      {/* ── 7 · Delivery optionality ─────────────────────────────────────── */}
      {flexModel && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>7 · Delivery Optionality — Volume Flex, Take-or-Pay</h2>
            <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>deterministic ±σ percentile bands — P(z) = P₀·e^(z·σ√τ), no simulation</span>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
            <Field label="Volume flex band (±%)" width={150}>
              <input type="number" min="0" max="100" style={inputStyle} value={flex.flexPct} onChange={(e) => setF('flexPct', e.target.value)} />
              <span style={{ fontSize: 9.5, color: T.sub }}>seller put / buyer call on {fmt(flexModel.flexVol, 0)} t/yr</span>
            </Field>
            <Field label="Price volatility σ (%/yr)" width={160}>
              <input type="number" min="0" step="1" style={inputStyle} value={flex.volPct} onChange={(e) => setF('volPct', e.target.value)} />
              <span style={{ fontSize: 9.5, color: T.sub }}>user assumption — carbon vol is regime-dependent</span>
            </Field>
            <Field label="Take-or-pay floor (%)" width={150}>
              <input type="number" min="0" max="100" style={inputStyle} value={flex.topPct} onChange={(e) => setF('topPct', e.target.value)} />
              <span style={{ fontSize: 9.5, color: T.sub }}>minimum paid volume regardless of need</span>
            </Field>
            <div style={{ fontSize: 11.5, color: T.sub, alignSelf: 'flex-end', paddingBottom: 12 }}>
              Reference P₀ = year-1 quality-adj benchmark <b style={{ fontFamily: T.mono, color: T.navy }}>{fmtUsd(flexModel.P0)}</b> ·
              strike K = year-1 contract price <b style={{ fontFamily: T.mono, color: T.navy }}>{fmtUsd(flexModel.K)}</b>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8, maxWidth: 860 }}>
            <thead>
              <tr>
                <th style={th}>Band</th><th style={th}>Market price P(z) $/t</th>
                <th style={th}>Buyer call value $ (upsize {flex.flexPct}%)</th>
                <th style={th}>Seller put value $ (downsize {flex.flexPct}%)</th>
              </tr>
            </thead>
            <tbody>
              {flexModel.bands.map((b) => (
                <tr key={b.z} style={b.z === 0 ? { background: T.gold + '18' } : undefined}>
                  <td style={{ ...tdM, fontWeight: 700, color: T.navy }}>{b.label}</td>
                  <td style={tdM}>{fmtUsd(b.price)}</td>
                  <td style={{ ...tdM, color: b.buyerCall > 0 ? T.green : T.slate }}>{b.buyerCall > 0 ? fmtUsd(b.buyerCall, 0) : '—'}</td>
                  <td style={{ ...tdM, color: b.sellerPut > 0 ? T.red : T.slate }}>{b.sellerPut > 0 ? fmtUsd(b.sellerPut, 0) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 10.5, color: T.sub, flex: 1.2, minWidth: 380 }}>
              Documented approach: option value at each band = flex volume × intrinsic value at the deterministic percentile price
              P(z) = P₀·e^(z·σ√τ), τ = 1y. Wider σ ⇒ wider bands ⇒ larger optionality value at ±1σ/±2σ — the value bands are
              monotonically increasing in the vol input (verified). This is a scenario table, not a stochastic option premium.
            </div>
            <div style={{ flex: 1, minWidth: 320, background: T.cream, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: T.navy, marginBottom: 4 }}>Take-or-pay vs requirements contract</div>
              <div style={{ fontSize: 11, color: T.slate }}>
                <b>Take-or-pay:</b> buyer pays for ≥ {fmtPct(flexModel.topPct, 0)} of contracted volume ({fmt(flexModel.topVol, 0)} t/yr ≈ {fmtUsd(flexModel.topCost, 0)}/yr at K)
                even if unused — bankable revenue for the seller, stranded-cost risk for the buyer.<br />
                <b>Requirements:</b> buyer takes only what its compliance/claims need requires — flexible for the buyer,
                but unbankable volume for project finance; typically priced {'>'}take-or-pay to compensate.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 8 · Ratchet & indexation depth ───────────────────────────────── */}
      {advPath && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>8 · Ratchet & Indexation Depth — Quality Ratchet · CPI Hybrid · FX Clause</h2>
            <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>price_t = (1−w)·fixed·(1+CPI)^(t−1) + w·bench_t·qf(score_t), collared</span>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
            <Field label="Reassessment period # (0 = off)" width={180}>
              <input type="number" min="0" max="20" style={inputStyle} value={adv.ratchetYear} onChange={(e) => setA('ratchetYear', e.target.value)} />
              <span style={{ fontSize: 9.5, color: T.sub }}>quality re-scored at this delivery period</span>
            </Field>
            <Field label="Reassessed score (blank = no ratchet)" width={200}>
              <input type="number" min="0" max="100" style={inputStyle} value={adv.ratchetScore} onChange={(e) => setA('ratchetScore', e.target.value)} placeholder={qualityScore != null ? `current ${fmt(qualityScore, 1)}` : 'e.g. 60'} />
              <span style={{ fontSize: 9.5, color: T.sub }}>user expectation — ratchets the quality factor from that period</span>
            </Field>
            <Field label="CPI escalation of fixed leg" width={160}>
              <select style={inputStyle} value={adv.cpiOn ? 'on' : 'off'} onChange={(e) => setA('cpiOn', e.target.value === 'on')}>
                <option value="off">Off (flat fixed leg)</option>
                <option value="on">On (CPI-escalated)</option>
              </select>
            </Field>
            {adv.cpiOn && <Field label="CPI (%/yr, user)" width={110}><input type="number" step="0.1" style={inputStyle} value={adv.cpiPct} onChange={(e) => setA('cpiPct', e.target.value)} /></Field>}
            <Field label="Currency clause" width={150}>
              <select style={inputStyle} value={adv.fxOn ? 'on' : 'off'} onChange={(e) => setA('fxOn', e.target.value === 'on')}>
                <option value="off">USD only</option>
                <option value="on">Show local-ccy leg</option>
              </select>
            </Field>
            {adv.fxOn && (
              <>
                <Field label="Local ccy" width={80}><input style={inputStyle} value={adv.fxCcy} onChange={(e) => setA('fxCcy', e.target.value)} /></Field>
                <Field label="FX rate (local/USD)" width={130}><input type="number" min="0" step="0.1" style={inputStyle} value={adv.fxRate} onChange={(e) => setA('fxRate', e.target.value)} /></Field>
                <Field label="FX drift (%/yr, user)" width={140}><input type="number" step="0.1" style={inputStyle} value={adv.fxDriftPct} onChange={(e) => setA('fxDriftPct', e.target.value)} /></Field>
              </>
            )}
          </div>
          {advPath.hasRatchet && (
            <div style={{ fontSize: 11.5, color: T.slate, marginBottom: 8 }}>
              Ratchet event at period {advPath.rYear}: reassessed score {fmt(advPath.rScore, 1)} → quality factor
              <b style={{ fontFamily: T.mono, color: advPath.factorNew >= (qualityFactor ?? 1) ? T.green : T.red }}> ×{advPath.factorNew.toFixed(3)}</b>
              {' '}(vs ×{(qualityFactor ?? 1).toFixed(3)} before) applied to the benchmark leg from that period onward.
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
            <thead>
              <tr>
                <th style={th}>Year</th><th style={th}>Fixed leg $/t{adv.cpiOn ? ' (CPI-esc.)' : ''}</th><th style={th}>Quality factor</th>
                <th style={th}>Q-adj bench $/t</th><th style={th}>Adjusted price $/t</th><th style={th}>Base price $/t</th><th style={th}>Δ $/t</th>
                {adv.fxOn && <th style={th}>{adv.fxCcy}/t (drifted FX)</th>}
              </tr>
            </thead>
            <tbody>
              {advPath.rows.map((r) => (
                <tr key={r.t} style={advPath.hasRatchet && r.t === advPath.rYear ? { background: T.gold + '18' } : undefined}>
                  <td style={tdM}>{r.year}{advPath.hasRatchet && r.t === advPath.rYear ? ' ⚑' : ''}</td>
                  <td style={tdM}>{fmtUsd(r.fixedT)}</td>
                  <td style={tdM}>×{r.qfT.toFixed(3)}</td>
                  <td style={tdM}>{r.qBenchT != null ? fmtUsd(r.qBenchT) : '—'}</td>
                  <td style={{ ...tdM, fontWeight: 700, color: T.navy }}>{r.adjEff != null ? fmtUsd(r.adjEff) : '—'}</td>
                  <td style={tdM}>{r.baseEff != null ? fmtUsd(r.baseEff) : '—'}</td>
                  <td style={{ ...tdM, color: (r.delta ?? 0) >= 0 ? T.green : T.red }}>{r.delta != null ? `${r.delta >= 0 ? '+' : ''}${fmtUsd(r.delta)}` : '—'}</td>
                  {adv.fxOn && <td style={{ ...tdM, color: T.purple }}>{r.localPx != null ? fmt(r.localPx, 2) : '—'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 10.5, color: T.sub }}>
            Ratchets reprice the benchmark leg on quality-score reassessment events (contractual review clause); the CPI hybrid escalates
            only the fixed leg (benchmark leg already carries market inflation); the currency clause converts the USD price at the user's
            FX rate drifted at the user's %/yr — all assumptions are user inputs, none are forecasts.
          </div>
        </div>
      )}

      {/* ── 9 · ERPA portfolio book ──────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>9 · ERPA Portfolio Book — Multi-Contract Aggregation</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>MtB P&L = (benchmark_now − contract price) × risk-adjusted volume</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={addCurrentToBook} disabled={!econ} style={{ background: econ ? T.navy : T.sub, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: econ ? 'pointer' : 'not-allowed', fontFamily: T.font }}>
              + Add current structure to book
            </button>
            <button onClick={() => setBook((p) => [...p, ...ILLUSTRATIVE_BOOK])} style={{ background: '#fff', color: T.navy, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: T.font }}>
              Load 3 illustrative contracts
            </button>
            {book.length > 0 && (
              <button onClick={() => setBook([])} style={{ background: '#fff', color: T.red, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: T.font }}>
                Clear book
              </button>
            )}
          </div>
        </div>
        {!bookAgg && (
          <div style={{ fontSize: 12, color: T.sub }}>
            Empty book. Structure a deal above and add it, or load the illustrative contracts (labeled ILLUSTRATIVE — hand-authored
            example terms for exploring the aggregation analytics, not data).
          </div>
        )}
        {bookAgg && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="Contracts" value={bookAgg.contracts.length} sub={`${fmtT(bookAgg.totVol)} risk-adjusted volume`} />
              <Kpi label="Vol-weighted price" value={`${fmtUsd(bookAgg.wPrice)}/t`} sub="across the book" />
              <Kpi label="Weighted quality score" value={bookAgg.wq != null ? `${fmt(bookAgg.wq, 1)} / 100` : 'no scored contracts'} sub={bookAgg.wq != null ? `on ${fmtT(bookAgg.scoredVol)} scored volume` : 'score deals in panel 1 before adding'} color={T.indigo} />
              <Kpi label="Mark-to-benchmark P&L" value={bookAgg.totMtb != null ? `${bookAgg.totMtb >= 0 ? '+' : ''}${fmtUsd(bookAgg.totMtb, 0)}` : '—'} sub={bench.status === 'live' ? 'vs live category medians' : 'vs manual benchmark input'} color={(bookAgg.totMtb ?? 0) >= 0 ? T.green : T.red} />
              <Kpi label="Registry HHI" value={fmt(bookAgg.byRegistry.hhi, 0)} sub={bookAgg.byRegistry.hhi > 2500 ? 'concentrated (>2500)' : bookAgg.byRegistry.hhi > 1500 ? 'moderate (1500–2500)' : 'diversified (<1500)'} color={bookAgg.byRegistry.hhi > 2500 ? T.red : bookAgg.byRegistry.hhi > 1500 ? T.amber : T.green} />
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
              <thead>
                <tr>
                  <th style={th}>Contract</th><th style={th}>Registry</th><th style={th}>Methodology</th><th style={th}>Country</th>
                  <th style={th}>Type</th><th style={th}>Vintages</th><th style={th}>Volume (t)</th><th style={th}>Price $/t</th>
                  <th style={th}>Bench now $/t</th><th style={th}>MtB P&L $</th><th style={th}>Quality</th><th style={th}>CORSIA</th><th style={th}>Art 6</th><th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {bookAgg.contracts.map((c) => (
                  <tr key={c.idx}>
                    <td style={{ ...td, fontWeight: 700, color: T.navy, maxWidth: 220 }}>{c.name}</td>
                    <td style={tdM}>{c.standard.toUpperCase()}</td>
                    <td style={tdM}>{c.methodologyKey}</td>
                    <td style={td}>{c.country}</td>
                    <td style={tdM}>{c.contractType}</td>
                    <td style={tdM}>{c.vintageStart}–{c.vintageStart + c.deliveries.length - 1}</td>
                    <td style={tdM}>{fmt(c.totalVol, 0)}</td>
                    <td style={tdM}>{fmtUsd(c.avgPrice)}</td>
                    <td style={tdM}>{c.benchNow != null ? fmtUsd(c.benchNow, 0) : '—'}</td>
                    <td style={{ ...tdM, fontWeight: 700, color: (c.mtb ?? 0) >= 0 ? T.green : T.red }}>{c.mtb != null ? `${c.mtb >= 0 ? '+' : ''}${fmtUsd(c.mtb, 0)}` : '—'}</td>
                    <td style={tdM}>{c.qualityScore != null ? fmt(c.qualityScore, 1) : '—'}</td>
                    <td style={{ ...tdM, color: c.corsiaOk ? T.green : c.corsiaOk === false ? T.red : T.sub }}>{c.corsiaOk == null ? 'ref offline' : c.corsiaOk ? '✓' : '✗'}</td>
                    <td style={{ ...tdM, color: c.art6Authorized ? T.green : T.amber }}>{c.art6Authorized ? 'CA ✓' : 'no CA'}</td>
                    <td style={td}><button onClick={() => setBook((p) => p.filter((_, j) => j !== c.idx))} style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ flex: 1.5, minWidth: 420 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Aggregated delivery schedule / vintage ladder (t, stacked by contract)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={bookAgg.schedule}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => fmtT(v)} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {bookAgg.contracts.map((c, i) => (
                      <Bar key={c.idx} dataKey={`c${c.idx}`} name={c.name.replace(' [ILLUSTRATIVE]', '*')} stackId="a"
                        fill={[T.teal, T.gold, T.purple, T.indigo, T.green, T.amber, T.blue, T.red][i % 8]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 340 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Concentration by registry / methodology / country</div>
                {[['Registry', bookAgg.byRegistry], ['Methodology', bookAgg.byMethodology], ['Country', bookAgg.byCountry]].map(([label, g]) => (
                  <div key={label} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10.5, fontFamily: T.mono, color: T.navy, fontWeight: 700 }}>{label} — HHI {fmt(g.hhi, 0)}</div>
                    {g.entries.map((e) => (
                      <div key={e.k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                        <div style={{ fontSize: 10.5, width: 130, color: T.slate, fontFamily: T.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(e.k).toUpperCase()}</div>
                        <div style={{ flex: 1, background: T.cream, borderRadius: 4, height: 10 }}>
                          <div style={{ width: `${(e.share * 100).toFixed(1)}%`, background: e.share > 0.5 ? T.red : e.share > 0.3 ? T.amber : T.teal, height: 10, borderRadius: 4 }} />
                        </div>
                        <div style={{ fontSize: 10.5, fontFamily: T.mono, color: T.sub, width: 46, textAlign: 'right' }}>{fmtPct(e.share * 100, 0)}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 10.5, color: T.sub }}>
              Mark-to-benchmark uses the live category median (nature-based / tech removal / avoidance) as the observable proxy —
              it is an indicative screen, not a fair-value mark; bespoke ERPA terms (collars, prepay discounts) are not re-priced here.
              HHI &gt; 2,500 = concentrated (DoJ/FTC convention applied to volume shares).
            </div>
          </>
        )}
      </div>

      {/* ── 10 · Sustainability × financial overlay ──────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>10 · Sustainability × Financial — SDG Tags · ICP Check · Net-Zero Retirement Plan</h2>
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 340 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>
              SDG co-benefit tagging
              <span style={{ background: T.cream, color: T.sub, padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, marginLeft: 8, fontFamily: T.mono }}>methodology-based — indicative (DCM ref catalogue)</span>
            </div>
            <div style={{ fontSize: 11.5, color: T.slate, marginBottom: 6 }}>
              Current structure (<b style={{ fontFamily: T.mono }}>{meth.type}</b>):{' '}
              {(SDG_TAGS[meth.type] || []).map((s) => (
                <span key={s} style={{ display: 'inline-block', background: T.teal + '18', color: T.teal, border: `1px solid ${T.teal}44`, borderRadius: 10, padding: '1px 8px', fontSize: 10.5, fontWeight: 700, margin: '2px 4px 2px 0' }}>SDG {s}</span>
              ))}
            </div>
            {bookAgg && (
              <div style={{ fontSize: 11.5, color: T.slate }}>
                Portfolio book coverage ({bookAgg.contracts.length} contracts):{' '}
                {bookAgg.sdgSet.map((s) => (
                  <span key={s} style={{ display: 'inline-block', background: T.indigo + '15', color: T.indigo, border: `1px solid ${T.indigo}44`, borderRadius: 10, padding: '1px 8px', fontSize: 10.5, fontWeight: 700, margin: '2px 4px 2px 0' }}>SDG {s}</span>
                ))}
              </div>
            )}
            <div style={{ fontSize: 10, color: T.sub, marginTop: 6 }}>Indicative project-family mapping; certified SDG claims (e.g. GS4GG) supersede these tags.</div>
          </div>
          <div style={{ flex: 1, minWidth: 340 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>Cost per tCO2e retired vs internal carbon price</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 8 }}>
              <Field label="Internal carbon price ($/t, user)" width={190}>
                <input type="number" min="0" step="1" style={inputStyle} value={sf.icp} onChange={(e) => setSF('icp', e.target.value)} />
              </Field>
            </div>
            {planner && planner.costPerT != null ? (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Kpi label="Cost / tCO2e retired" value={`${fmtUsd(planner.costPerT)}/t`} sub={`vol-weighted, ${planner.source}`} />
                <Kpi label="Internal carbon price" value={`${fmtUsd(planner.icp)}/t`} sub="user ICP" color={T.indigo} />
                <Kpi label="ICP headroom" value={planner.icpDelta != null ? `${planner.icpDelta >= 0 ? '+' : ''}${fmtUsd(planner.icpDelta)}/t` : '—'}
                  sub={planner.icpDelta >= 0 ? 'retiring credits is cheaper than your ICP — economically consistent' : 'portfolio costs more than your ICP — revisit ICP or mix'}
                  color={(planner.icpDelta ?? 0) >= 0 ? T.green : T.red} />
              </div>
            ) : <div style={{ fontSize: 11.5, color: T.sub }}>Compute contract economics (benchmark required) or add contracts to the book to compare against your ICP.</div>}
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 6 }}>Retirement schedule vs corporate net-zero path (user trajectory)</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
          <Field label="Gross emissions today (tCO2e/yr)" width={200}><input type="number" min="0" style={inputStyle} value={sf.baseline} onChange={(e) => setSF('baseline', e.target.value)} /></Field>
          <Field label="Net-zero target year" width={140}><input type="number" min="2026" max="2060" style={inputStyle} value={sf.nzYear} onChange={(e) => setSF('nzYear', e.target.value)} /></Field>
          <Field label="Residual at NZ year (% of baseline)" width={210}>
            <input type="number" min="0" max="100" style={inputStyle} value={sf.residualPct} onChange={(e) => setSF('residualPct', e.target.value)} />
            <span style={{ fontSize: 9.5, color: T.sub }}>linear decline to this level — user trajectory</span>
          </Field>
        </div>
        {planner ? (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={planner.rows}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="v" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="c" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => fmtT(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="v" dataKey="need" name="Retirement need (emissions path)" fill={T.border} radius={[3, 3, 0, 0]} />
                <Bar yAxisId="v" dataKey="supply" name={`Credit supply (${planner.source})`} fill={T.teal} radius={[3, 3, 0, 0]} />
                <Line yAxisId="c" dataKey="cumSurplus" name="Cumulative surplus / (deficit)" stroke={T.purple} strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
              Need = user emissions trajectory (linear from {fmt(parseFloat(sf.baseline), 0)} t to {sf.residualPct}% residual at {sf.nzYear}, flat after);
              supply = risk-adjusted expected deliveries from the {planner.source}. A persistent cumulative deficit means additional
              offtakes (or steeper abatement) are needed to keep the net-zero claim funded; a surplus can be banked or sold.
            </div>
          </>
        ) : <div style={{ fontSize: 12, color: T.sub }}>Enter a baseline and a net-zero year after {new Date().getFullYear()} to build the plan.</div>}
      </div>

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
        Engines: services/carbon_credit_quality_engine.py (ICVCM CCP v2.0 · CORSIA Doc 9501 eligibility ref · price benchmarks).
        Delivery-risk haircuts, buffer defaults, reversal probability, insurance range, flex bands, compliance premium / CA discount,
        CPI/FX assumptions and the net-zero trajectory are labeled modeling defaults / user assumptions — every figure derives from a
        user term, a live engine response, or a documented default shown in-UI. Mechanism-level compliance analytics: /compliance-carbon-desk.
      </div>
    </div>
  );
}
