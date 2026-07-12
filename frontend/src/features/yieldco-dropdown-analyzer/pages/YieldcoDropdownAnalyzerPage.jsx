import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, Legend, ReferenceLine, ComposedChart, Area,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// YieldCo Dropdown Analyzer (NX2-14)
// Asset-rotation analytics for a YieldCo: CAFD/share accretion-dilution of a
// sponsor dropdown, payout sustainability, NAV/share bridge, leverage, IDR
// (incentive distribution rights) sponsor/public split, a dropdown vs
// green-securitization takeout comparison — PLUS a per-asset 5-year CAFD/DPS
// model with committed dropdowns, a valuation suite (three-stage DDM,
// yield-spread, NAV SOTP, implied cost of equity), corporate capital
// structure (revolver/HoldCo notes, DSCR/FFO, dividend-cut stress), NOL
// shield runway, and a sustainability×financial overlay (fleet emissions
// intensity roll-up, dropdown emissions-accretion screen, green-eligible
// CAFD share, sustainability cost-of-equity premium).
//
// ALL math on this page is computed locally in the browser from the editable
// inputs below (display-level corporate-finance derivations — no engine call,
// no fabricated data). Every formula is documented next to its output.
// Defaults are hand-authored illustrative values, clearly labeled, editable.
// The ABS takeout alternative is covered in depth by the /green-securitization
// module — this page only compares headline economics (text reference only).
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
const fmtX = (v, d = 2) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}x`;
const fmtDps = (v) => (v == null || isNaN(v)) ? '—' : `$${Number(v).toFixed(4)}`;
const fmtInt = (v, d = 3) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}`;
const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

const Kpi = ({ label, value, sub, color = T.navy }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const LocalBadge = () => (
  <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
    ◆ Local model — computed in-page from your inputs, no engine call
  </span>
);

const EditableBadge = ({ text = 'Editable defaults — hand-authored illustrative values, not live data' }) => (
  <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{text}</span>
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

const Field = ({ label, value, onChange, unit, step = 'any', width = 150 }) => (
  <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 4, width }}>
    {label}{unit ? ` (${unit})` : ''}
    <input type="number" step={step} style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)} />
  </label>
);

// Hand-authored illustrative YieldCo profile (roughly renewables-YieldCo-scale
// figures, e.g. a mid-cap listed vehicle). Fully editable — NOT live data.
const DEFAULT_PROFILE = {
  sharesM: 200,        // shares outstanding, millions
  price: 15.0,         // $/share
  cafd0: 320,          // current annual CAFD, $M
  payoutPct: 80,       // payout ratio, % of CAFD distributed
  netDebt0: 1600,      // existing net debt, $M (corporate-level, ~5.0x CAFD)
  kePct: 9.5,          // cost of equity, %
  kdPct: 6.0,          // cost of debt, %
};

// Hand-authored illustrative dropdown (a ~150 MW contracted solar portfolio).
const DEFAULT_DROP = {
  assetCafd: 42,       // asset CAFD, $M/yr
  purchase: 480,       // purchase price, $M (≈11.4x CAFD)
  eqPct: 40,           // % funded by equity issuance
  debtPct: 48,         // % funded by new debt
  retPct: 12,          // % funded by retained CAFD (cash on hand)
  discPct: 3,          // equity issuance discount to market, %
};

// Classic MLP-style IDR splits, restated as absolute DPS thresholds around the
// default profile's ~$1.28 DPS. Hand-authored illustrative tiers — editable.
const DEFAULT_IDR_TIERS = [
  { id: 1, upTo: 1.00, takePct: 0 },
  { id: 2, upTo: 1.15, takePct: 15 },
  { id: 3, upTo: 1.30, takePct: 25 },
  { id: 4, upTo: null, takePct: 50 },   // top tier: above last threshold ("high splits")
];

// Hand-authored illustrative operating fleet (sums to the profile's 320 $M
// CAFD). Intensities are per-asset tCO2e/MWh (renewables ~0; small reservoir
// figure for hydro; unabated gas ~0.45). Fully editable — NOT live data.
const DEFAULT_ASSETS = [
  { id: 1, name: 'Wind A (contracted)', type: 'contracted', genGwh: 1400, cafd: 120, intensity: 0.0, declinePct: 1.5, lifeYrs: 22, taxonomy: true },
  { id: 2, name: 'Solar B (contracted)', type: 'contracted', genGwh: 900, cafd: 90, intensity: 0.0, declinePct: 0.8, lifeYrs: 25, taxonomy: true },
  { id: 3, name: 'Hydro C (contracted)', type: 'contracted', genGwh: 700, cafd: 60, intensity: 0.004, declinePct: 0.5, lifeYrs: 30, taxonomy: true },
  { id: 4, name: 'Gas peaker D (merchant)', type: 'merchant', genGwh: 300, cafd: 50, intensity: 0.45, declinePct: 2.0, lifeYrs: 15, taxonomy: false },
];

// Committed sponsor dropdown schedule (ROFO pipeline). Hand-authored — editable.
const DEFAULT_SCHEDULE = [
  { id: 1, year: 1, name: 'Solar dropdown I', cafd: 42, purchase: 480, genGwh: 380, intensity: 0.0, taxonomy: true },
  { id: 2, year: 3, name: 'Wind dropdown II', cafd: 35, purchase: 400, genGwh: 450, intensity: 0.0, taxonomy: true },
];

// Hand-authored DPS-yield-vs-10yr spread history (illustrative sector-average
// levels, labeled — NOT a market data feed).
const SPREAD_HISTORY = [
  { year: 2019, spreadBps: 350 }, { year: 2020, spreadBps: 420 }, { year: 2021, spreadBps: 280 },
  { year: 2022, spreadBps: 380 }, { year: 2023, spreadBps: 450 }, { year: 2024, spreadBps: 400 },
  { year: 2025, spreadBps: 370 },
];

export default function YieldcoDropdownAnalyzerPage() {
  const [p, setP] = useState(DEFAULT_PROFILE);
  const [d, setD] = useState(DEFAULT_DROP);
  const [tiers, setTiers] = useState(DEFAULT_IDR_TIERS);
  const [absAdvPct, setAbsAdvPct] = useState(80);   // ABS advance rate, % of asset value
  const [absCoupon, setAbsCoupon] = useState(5.25); // ABS senior coupon, %

  // ── Depth-module state (all local, editable, labeled) ────────────────────
  const [assets, setAssets] = useState(DEFAULT_ASSETS);
  const [sched, setSched] = useState(DEFAULT_SCHEDULE);
  const [mp, setMp] = useState({    // multi-year & valuation params
    dpsGrowthTargetPct: 5,          // DPS growth target %/yr (policy)
    payoutMaxPct: 90,               // payout ceiling (policy rule, documented)
    kContrPct: 7.5,                 // discount rate — contracted assets
    kMerchPct: 11.0,                // discount rate — merchant assets
    gTermPct: 2.0,                  // terminal DPS growth (DDM stage 3)
    tenYrPct: 4.3,                  // 10-yr treasury yield (user input)
    spreadBps: 380,                 // required DPS-yield spread over 10yr
  });
  const [cap, setCap] = useState({  // corporate capital structure
    revolver: 300, revRatePct: 6.5, notes: 1300, notesRatePct: 5.5,
  });
  const [taxS, setTaxS] = useState({ nol: 250, taxableFracPct: 40 });
  const [sus, setSus] = useState({ slopePctPerT: 2.0, benchmarkT: 0.10 });

  const setProf = (k) => (v) => setP((prev) => ({ ...prev, [k]: v }));
  const setDrop = (k) => (v) => setD((prev) => ({ ...prev, [k]: v }));
  const setMpF = (k) => (v) => setMp((prev) => ({ ...prev, [k]: v }));
  const setCapF = (k) => (v) => setCap((prev) => ({ ...prev, [k]: v }));
  const setTaxF = (k) => (v) => setTaxS((prev) => ({ ...prev, [k]: v }));
  const setSusF = (k) => (v) => setSus((prev) => ({ ...prev, [k]: v }));
  const setTier = (id, k, v) => setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, [k]: v } : t)));
  const addTier = () => setTiers((prev) => {
    const body = prev.slice(0, -1); const top = prev[prev.length - 1];
    const lastUpTo = body.length ? num(body[body.length - 1].upTo) : 0;
    return [...body, { id: Math.max(...prev.map((t) => t.id)) + 1, upTo: +(lastUpTo + 0.10).toFixed(2), takePct: 35 }, top];
  });
  const removeTier = (id) => setTiers((prev) => (prev.length > 2 ? prev.filter((t) => t.id !== id) : prev));

  const setAsset = (id, k, v) => setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, [k]: v } : a)));
  const addAsset = () => setAssets((prev) => [...prev, {
    id: Math.max(0, ...prev.map((a) => a.id)) + 1, name: `Asset ${prev.length + 1}`, type: 'contracted',
    genGwh: 400, cafd: 30, intensity: 0.0, declinePct: 1.0, lifeYrs: 20, taxonomy: true,
  }]);
  const removeAsset = (id) => setAssets((prev) => (prev.length > 1 ? prev.filter((a) => a.id !== id) : prev));
  const setSchedRow = (id, k, v) => setSched((prev) => prev.map((s) => (s.id === id ? { ...s, [k]: v } : s)));
  const addSched = () => setSched((prev) => [...prev, {
    id: Math.max(0, ...prev.map((s) => s.id)) + 1, year: Math.min(5, prev.length + 1),
    name: `Dropdown ${prev.length + 1}`, cafd: 30, purchase: 330, genGwh: 300, intensity: 0.0, taxonomy: true,
  }]);
  const removeSched = (id) => setSched((prev) => prev.filter((s) => s.id !== id));

  // ── Core dropdown model (all display-level math, documented below) ────────
  const m = useMemo(() => {
    const sharesM = num(p.sharesM), price = num(p.price), cafd0 = num(p.cafd0);
    const payout = num(p.payoutPct) / 100, netDebt0 = num(p.netDebt0);
    const ke = num(p.kePct) / 100, kd = num(p.kdPct) / 100;
    const assetCafd = num(d.assetCafd), purchase = num(d.purchase);
    const eqPct = num(d.eqPct) / 100, debtPct = num(d.debtPct) / 100, retPct = num(d.retPct) / 100;
    const disc = num(d.discPct) / 100;
    if (sharesM <= 0 || price <= 0 || cafd0 <= 0) return null;

    const mixSum = eqPct + debtPct + retPct;
    const mixOk = Math.abs(mixSum - 1) < 0.005;

    const mktCap = sharesM * price;                       // $M
    const wacc = (mktCap * ke + netDebt0 * kd) / (mktCap + netDebt0); // pre-deal, no-tax (documented)

    // Funding
    const equityRaised = purchase * eqPct;
    const issuePrice = price * (1 - disc);
    const newSharesM = issuePrice > 0 ? equityRaised / issuePrice : 0;
    const debtRaised = purchase * debtPct;
    const retainedUsed = purchase * retPct;
    const retainedAvailYr = cafd0 * (1 - payout);         // one year of retained CAFD

    // Pro-forma CAFD
    const interestDrag = debtRaised * kd;
    const cafd1 = cafd0 + assetCafd - interestDrag;
    const shares1 = sharesM + newSharesM;

    const cafdps0 = cafd0 / sharesM;
    const cafdps1 = shares1 > 0 ? cafd1 / shares1 : null;
    const accretionPct = cafdps1 != null ? (cafdps1 / cafdps0 - 1) * 100 : null;

    // Distribution policy: DPS held constant at the pre-deal level
    const dps0 = cafdps0 * payout;
    const payout1 = cafdps1 > 0 ? (dps0 / cafdps1) * 100 : null;   // post-dropdown payout ratio at held DPS
    const coverage0 = payout > 0 ? 1 / payout : null;
    const coverage1 = dps0 > 0 && cafdps1 != null ? cafdps1 / dps0 : null;
    const dps1IfPayoutHeld = cafdps1 != null ? cafdps1 * payout : null; // alternative: hold payout ratio, grow DPS

    // Leverage (retained cash used lowers cash → raises net debt)
    const netDebt1 = netDebt0 + debtRaised + retainedUsed;
    const lev0 = cafd0 > 0 ? netDebt0 / cafd0 : null;
    const lev1 = cafd1 > 0 ? netDebt1 / cafd1 : null;

    // NAV bridge — EV = gross CAFD capitalized at the pre-deal WACC (perpetuity,
    // no growth — documented simplification); NAV = EV − net debt.
    const ev0 = cafd0 / wacc;
    const nav0 = ev0 - netDebt0;
    const navps0 = nav0 / sharesM;
    const assetCapValue = assetCafd / wacc;               // capitalized value of dropped CAFD
    const ev1 = (cafd0 + assetCafd) / wacc;
    const nav1 = ev1 - netDebt1;
    const navps1 = shares1 > 0 ? nav1 / shares1 : null;
    const navAccretionPct = navps1 != null && navps0 !== 0 ? (navps1 / navps0 - 1) * 100 : null;
    const purchaseVsValue = assetCapValue - purchase;     // >0: bought below capitalized value

    return {
      sharesM, price, cafd0, payout, netDebt0, ke, kd, mktCap, wacc,
      assetCafd, purchase, mixOk, mixSum,
      equityRaised, issuePrice, newSharesM, debtRaised, retainedUsed, retainedAvailYr,
      interestDrag, cafd1, shares1, cafdps0, cafdps1, accretionPct,
      dps0, payout1, coverage0, coverage1, dps1IfPayoutHeld,
      netDebt1, lev0, lev1,
      ev0, nav0, navps0, assetCapValue, ev1, nav1, navps1, navAccretionPct, purchaseVsValue,
    };
  }, [p, d]);

  // ── IDR waterfall at the pro-forma distribution level ─────────────────────
  // Convention (documented in-page): the declared distribution per share is
  // allocated marginally across tiers; within each tier the sponsor receives
  // take% OF THE TOTAL CASH distributed in that tier and the public receives
  // (100 − take)%. Sponsor IDR cash is therefore part of the declared total
  // (no gross-up convention).
  const idr = useMemo(() => {
    if (!m || m.cafdps1 == null) return null;
    const dpsEval = m.dps0; // evaluate at the held pre-deal DPS on pro-forma share count
    const totalCash = dpsEval * m.shares1; // $M (DPS $ × shares M)
    let prev = 0; let sponsor = 0; let publicCash = 0;
    const rows = tiers.map((t, i) => {
      const isTop = i === tiers.length - 1;
      const cap2 = isTop ? Infinity : num(t.upTo);
      const bandLo = prev;
      const bandHi = Math.max(cap2, bandLo);
      const inBandPs = Math.max(0, Math.min(dpsEval, bandHi) - bandLo);
      prev = bandHi;
      const bandCash = inBandPs * m.shares1;
      const take = Math.min(Math.max(num(t.takePct), 0), 100) / 100;
      const sp = bandCash * take; const pub = bandCash * (1 - take);
      sponsor += sp; publicCash += pub;
      return {
        id: t.id, isTop, lo: bandLo, hi: isTop ? null : bandHi, takePct: num(t.takePct),
        inBandPs, bandCash, sponsorCash: sp, publicCash: pub,
      };
    });
    const sponsorSharePct = totalCash > 0 ? (sponsor / totalCash) * 100 : 0;
    const effectivePublicDps = m.shares1 > 0 ? publicCash / m.shares1 : null;
    return { dpsEval, totalCash, rows, sponsor, publicCash, sponsorSharePct, effectivePublicDps };
  }, [m, tiers]);

  // ── Accretion sensitivity: purchase price sweep at the chosen funding mix ─
  const sweep = useMemo(() => {
    if (!m) return [];
    const pts = [];
    for (let f = 0.6; f <= 1.4001; f += 0.05) {
      const purch = m.purchase * f;
      const eq = purch * (num(d.eqPct) / 100);
      const newSh = m.issuePrice > 0 ? eq / m.issuePrice : 0;
      const debt = purch * (num(d.debtPct) / 100);
      const cafd1 = m.cafd0 + m.assetCafd - debt * m.kd;
      const cps1 = (m.sharesM + newSh) > 0 ? cafd1 / (m.sharesM + newSh) : null;
      pts.push({
        multiple: m.assetCafd > 0 ? +(purch / m.assetCafd).toFixed(1) : 0,
        purchase: Math.round(purch),
        accretion: cps1 != null ? +(((cps1 / m.cafdps0) - 1) * 100).toFixed(2) : null,
      });
    }
    return pts;
  }, [m, d]);

  const navBridge = useMemo(() => {
    if (!m) return [];
    return [
      { name: 'NAV before', value: +m.nav0.toFixed(0), fill: T.navy },
      { name: '+ Capitalized asset CAFD', value: +m.assetCapValue.toFixed(0), fill: T.green },
      { name: '− New debt', value: -m.debtRaised.toFixed(0), fill: T.red },
      { name: '− Retained cash used', value: -m.retainedUsed.toFixed(0), fill: T.amber },
      { name: 'NAV after', value: +m.nav1.toFixed(0), fill: T.teal },
    ];
  }, [m]);

  // ── Takeout comparison (qualitative + headline economics) ─────────────────
  const takeout = useMemo(() => {
    if (!m) return null;
    const adv = num(absAdvPct) / 100;
    const absProceeds = m.purchase * adv;   // advance vs the same asset value benchmark
    const absCost = num(absCoupon);
    return { absProceeds, absCost, adv };
  }, [m, absAdvPct, absCoupon]);

  const retainedWarning = m && m.retainedUsed > m.retainedAvailYr;

  // ═══════════════════════════════════════════════════════════════════════
  // DEPTH MODULES — all local, documented math
  // ═══════════════════════════════════════════════════════════════════════

  // Fleet roll-up: generation-weighted emissions intensity + green CAFD share.
  const fleet = useMemo(() => {
    const totGen = assets.reduce((s, a) => s + num(a.genGwh), 0);
    const totCafd = assets.reduce((s, a) => s + num(a.cafd), 0);
    const emis = assets.reduce((s, a) => s + num(a.genGwh) * 1000 * num(a.intensity), 0); // tCO2e (GWh→MWh)
    const intensity = totGen > 0 ? emis / (totGen * 1000) : 0;                            // tCO2e/MWh
    const greenCafd = assets.reduce((s, a) => s + (a.taxonomy ? num(a.cafd) : 0), 0);
    const greenSharePct = totCafd > 0 ? (greenCafd / totCafd) * 100 : 0;
    return { totGen, totCafd, emis, intensity, greenCafd, greenSharePct };
  }, [assets]);

  // 5-year model: per-asset decline roll-up + committed dropdowns + financing.
  const fy = useMemo(() => {
    if (!m) return null;
    const gT = num(mp.dpsGrowthTargetPct) / 100;
    const pMax = num(mp.payoutMaxPct) / 100;
    let shares = m.sharesM;
    let dpsPrev = m.dps0;
    let corpInterestBase = num(cap.revolver) * num(cap.revRatePct) / 100 + num(cap.notes) * num(cap.notesRatePct) / 100;
    let addedInterest = 0;   // interest on dropdown acquisition debt
    const rows = [];
    for (let t = 1; t <= 5; t++) {
      // existing fleet declines per asset
      const fleetCafd = assets.reduce((s, a) => s + num(a.cafd) * Math.pow(1 - num(a.declinePct) / 100, t), 0);
      // committed dropdowns in force (CAFD held flat post-entry — documented)
      let ddCafd = 0;
      sched.forEach((s) => {
        const y = Math.max(1, Math.min(5, parseInt(s.year, 10) || 1));
        if (t === y) {
          // finance at the headline funding mix and issue price (static — documented)
          const eq = num(s.purchase) * (num(d.eqPct) / 100);
          shares += m.issuePrice > 0 ? eq / m.issuePrice : 0;
          addedInterest += num(s.purchase) * (num(d.debtPct) / 100) * m.kd;
        }
        if (t >= y) ddCafd += num(s.cafd);
      });
      const cafdT = fleetCafd + ddCafd - addedInterest;
      const cafdps = shares > 0 ? cafdT / shares : 0;
      // DPS policy rule (documented): grow at target unless the payout ceiling
      // binds — DPS_t = min(DPS_{t−1} × (1+g), payoutMax × CAFD/share_t).
      const dps = Math.min(dpsPrev * (1 + gT), pMax * cafdps);
      const cut = dps < dpsPrev - 1e-9;
      const coverage = dps > 0 ? cafdps / dps : null;
      const payoutT = cafdps > 0 ? (dps / cafdps) * 100 : null;
      const corpInterest = corpInterestBase + addedInterest;
      rows.push({
        year: t, fleetCafd, ddCafd, addedInterest, cafd: cafdT, shares, cafdps, dps, cut,
        coverage, payoutPct: payoutT, corpInterest,
        dscr: corpInterest > 0 ? cafdT / corpInterest : null,
      });
      dpsPrev = dps;
    }
    const dpsCagr = rows.length && m.dps0 > 0 ? (Math.pow(rows[4].dps / m.dps0, 1 / 5) - 1) * 100 : null;
    return { rows, dpsCagr };
  }, [m, assets, sched, mp, d, cap]);

  // Three-stage DDM + implied cost of equity (bisection). Documented:
  // stage 1 = the 5-yr model DPS path; stage 2 = growth fades linearly from
  // the model's year-5 growth to g_term over years 6-10; stage 3 = Gordon
  // terminal value at g_term, all discounted at ke.
  const ddmValueAt = useMemo(() => {
    if (!fy || !m) return null;
    const path = fy.rows.map((r) => r.dps);
    const g5 = fy.rows[4].dps > 0 && fy.rows[3].dps > 0 ? fy.rows[4].dps / fy.rows[3].dps - 1 : num(mp.gTermPct) / 100;
    const gTerm = num(mp.gTermPct) / 100;
    return (ke) => {
      if (ke <= gTerm + 1e-6) return Infinity;
      let pv = 0; let dps = path[4]; let g = g5;
      for (let t = 1; t <= 5; t++) pv += path[t - 1] / Math.pow(1 + ke, t);
      for (let t = 6; t <= 10; t++) {
        g = g5 + (gTerm - g5) * ((t - 5) / 5);            // linear fade
        dps *= (1 + g);
        pv += dps / Math.pow(1 + ke, t);
      }
      const tv = dps * (1 + gTerm) / (ke - gTerm);
      return pv + tv / Math.pow(1 + ke, 10);
    };
  }, [fy, m, mp]);

  const valuation = useMemo(() => {
    if (!ddmValueAt || !m || !fy) return null;
    const ke = m.ke;
    const gTerm = num(mp.gTermPct) / 100;
    const ddmValue = ddmValueAt(ke);
    // implied cost of equity: bisection so DDM(ke*) = market price (documented)
    let lo = gTerm + 0.002, hi = 0.5, impliedKe = null;
    if (ddmValueAt(lo) > m.price && ddmValueAt(hi) < m.price) {
      for (let i = 0; i < 100; i++) {
        const mid = (lo + hi) / 2;
        if (ddmValueAt(mid) > m.price) lo = mid; else hi = mid;
      }
      impliedKe = (lo + hi) / 2;
    }
    // yield-spread valuation
    const dps1 = fy.rows[0].dps;
    const fairYield = num(mp.tenYrPct) / 100 + num(mp.spreadBps) / 10000;
    const fairPrice = fairYield > 0 ? dps1 / fairYield : null;
    const curYieldPct = m.price > 0 ? (dps1 / m.price) * 100 : null;
    const curSpreadBps = curYieldPct != null ? (curYieldPct - num(mp.tenYrPct)) * 100 : null;
    // NAV SOTP: per-asset DCF of declining CAFD over remaining life at the
    // contracted or merchant discount rate (documented).
    const kC = num(mp.kContrPct) / 100, kM = num(mp.kMerchPct) / 100;
    const sotpRows = assets.map((a) => {
      const r = a.type === 'merchant' ? kM : kC;
      const decl = num(a.declinePct) / 100;
      const life = Math.min(Math.max(parseInt(a.lifeYrs, 10) || 1, 1), 40);
      let v = 0;
      for (let k = 1; k <= life; k++) v += num(a.cafd) * Math.pow(1 - decl, k) / Math.pow(1 + r, k);
      return { name: a.name, type: a.type, rate: r, life, value: v, cafd: num(a.cafd) };
    });
    const gav = sotpRows.reduce((s, r) => s + r.value, 0);
    const corpDebt = num(cap.revolver) + num(cap.notes);
    const nav = gav - corpDebt;
    const navps = m.sharesM > 0 ? nav / m.sharesM : null;
    return {
      ddmValue, impliedKe, dps1, fairYield, fairPrice, curYieldPct, curSpreadBps,
      sotpRows, gav, corpDebt, nav, navps,
      premToDdmPct: ddmValue > 0 ? (m.price / ddmValue - 1) * 100 : null,
      premToNavPct: navps > 0 ? (m.price / navps - 1) * 100 : null,
    };
  }, [ddmValueAt, m, fy, mp, assets, cap]);

  // Capital structure + dividend-cut stress test.
  const capm = useMemo(() => {
    if (!m || !fy) return null;
    const corpDebt = num(cap.revolver) + num(cap.notes);
    const interest = num(cap.revolver) * num(cap.revRatePct) / 100 + num(cap.notes) * num(cap.notesRatePct) / 100;
    const cafd1 = fy.rows[0].cafd;
    const dscr = interest > 0 ? cafd1 / interest : null;
    const ffoDebtPct = corpDebt > 0 ? (cafd1 / corpDebt) * 100 : null;
    const debtMismatch = Math.abs(corpDebt - m.netDebt0) > 1;
    // Dividend-cut stress: CAFD haircuts; policy rule (documented): CUT when
    // coverage < 1.00x; WATCH when 1.00–1.10x; HOLD above 1.10x.
    const dpsCash = m.dps0 * m.sharesM;
    const stress = [0, -10, -20, -30].map((h) => {
      const cafdH = cafd1 * (1 + h / 100);
      const cov = dpsCash > 0 ? cafdH / dpsCash : null;
      const dscrH = interest > 0 ? cafdH / interest : null;
      const verdict = cov == null ? '—' : cov < 1.0 ? 'CUT' : cov < 1.1 ? 'WATCH' : 'HOLD';
      const impliedDps = cov != null && cov < 1.0 ? (cafdH / m.sharesM) : m.dps0; // rebase to 100% payout if cut
      return { haircut: h, cafd: cafdH, coverage: cov, dscr: dscrH, verdict, impliedDps };
    });
    return { corpDebt, interest, dscr, ffoDebtPct, debtMismatch, stress, dpsCash };
  }, [m, fy, cap]);

  // NOL shield runway + CAFD-after-tax bridge (documented simplification:
  // taxable income ≈ CAFD × taxable fraction; §172 post-2017 NOLs offset at
  // most 80% of taxable income; cash tax at 21% on the remainder).
  const nolm = useMemo(() => {
    if (!fy) return null;
    let bal = num(taxS.nol);
    const frac = num(taxS.taxableFracPct) / 100;
    let cashTaxYear = null;
    const rows = fy.rows.map((r) => {
      const taxable = Math.max(r.cafd * frac, 0);
      const usable = Math.min(bal, 0.8 * taxable);
      const cashTax = (taxable - usable) * 0.21;
      if (cashTax > 0.005 && cashTaxYear == null) cashTaxYear = r.year;
      bal = Math.max(bal - usable, 0);
      return { year: r.year, cafd: r.cafd, taxable, nolUsed: usable, nolBal: bal, cashTax, cafdAfterTax: r.cafd - cashTax };
    });
    return { rows, cashTaxYear, endBal: bal };
  }, [fy, taxS]);

  // Sustainability × financial overlay.
  const susm = useMemo(() => {
    if (!m || !valuation || !ddmValueAt) return null;
    // Dropdown emissions-accretion screen: does each dropdown raise or lower
    // fleet intensity? intensity = Σ gen×int / Σ gen (gen-weighted average).
    const baseGen = fleet.totGen * 1000;                  // MWh (GWh × 1000)
    const baseEmis = fleet.emis;                          // tCO2e
    const screen = sched.map((s) => {
      const g = num(s.genGwh) * 1000;
      const e = g * num(s.intensity);
      const after = (baseGen + g) > 0 ? (baseEmis + e) / (baseGen + g) : 0;
      const delta = after - fleet.intensity;
      return {
        name: s.name, year: s.year, intensity: num(s.intensity), after, delta,
        accretive: delta > 1e-12,                          // raises fleet intensity
      };
    });
    // Green-eligible CAFD share incl. scheduled dropdowns (year-5 basis).
    const greenCafd5 = assets.reduce((s, a) => s + (a.taxonomy ? num(a.cafd) : 0), 0)
      + sched.reduce((s2, s) => s2 + (s.taxonomy ? num(s.cafd) : 0), 0);
    const totCafd5 = assets.reduce((s, a) => s + num(a.cafd), 0) + sched.reduce((s2, s) => s2 + num(s.cafd), 0);
    const greenShare5 = totCafd5 > 0 ? (greenCafd5 / totCafd5) * 100 : 0;
    // Sustainability cost-of-equity premium (HAND-AUTHORED, labeled): Δke =
    // slope% × (fleet intensity − benchmark), floored so ke stays > g_term.
    const slope = num(sus.slopePctPerT) / 100;            // ke change per 1.0 tCO2e/MWh
    const bench = num(sus.benchmarkT);
    const dKe = slope * (fleet.intensity - bench);
    const keAdj = Math.max(m.ke + dKe, num(mp.gTermPct) / 100 + 0.005);
    const ddmAtAdj = ddmValueAt(keAdj);
    const sens = [];
    for (let i = 0; i <= 10; i++) {
      const intens = i * 0.05;                            // 0 → 0.50 tCO2e/MWh
      const keI = Math.max(m.ke + slope * (intens - bench), num(mp.gTermPct) / 100 + 0.005);
      sens.push({ intensity: +intens.toFixed(2), kePct: +(keI * 100).toFixed(2), ddm: +ddmValueAt(keI).toFixed(2) });
    }
    return { screen, greenShare5, dKe, keAdj, ddmAtAdj, sens };
  }, [m, valuation, ddmValueAt, fleet, sched, assets, sus, mp]);

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.teal, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>NX2-14</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>YieldCo Dropdown Analyzer</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>CAFD Accretion · 5-yr Model</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>DDM · Yield Spread · NAV SOTP · Implied kₑ</span>
          <span style={{ background: T.red + '18', color: T.red, border: `1px solid ${T.red}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>DSCR · Dividend-Cut Stress · NOL Runway</span>
          <span style={{ background: T.gold + '33', color: T.amber, border: `1px solid ${T.gold}66`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Fleet Intensity · Green CAFD · IDR</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 16, maxWidth: 1050 }}>
        Sponsor-to-YieldCo asset rotation ("dropdown") economics: pro-forma CAFD/share accretion-dilution,
        distribution sustainability, NAV/share bridge, leverage, IDR sponsor/public split — plus a per-asset
        5-year CAFD/DPS/coverage model with the committed dropdown schedule, a three-stage DDM / yield-spread /
        NAV-SOTP valuation suite with an implied-cost-of-equity solver, corporate capital structure (revolver +
        HoldCo notes, DSCR/FFO, dividend-cut stress), an NOL shield runway, and a sustainability overlay (fleet
        emissions intensity, dropdown emissions-accretion screen, green-eligible CAFD, cost-of-equity premium).
        All figures are computed locally from the editable inputs; nothing on this page is fabricated engine output.
      </div>

      {/* ── YieldCo profile ─────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={h2}>YieldCo Profile</h2>
          <EditableBadge />
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Field label="Shares outstanding" unit="M" value={p.sharesM} onChange={setProf('sharesM')} />
          <Field label="Share price" unit="$" value={p.price} onChange={setProf('price')} />
          <Field label="Current annual CAFD" unit="$M" value={p.cafd0} onChange={setProf('cafd0')} />
          <Field label="Payout ratio" unit="% of CAFD" value={p.payoutPct} onChange={setProf('payoutPct')} />
          <Field label="Existing net debt" unit="$M" value={p.netDebt0} onChange={setProf('netDebt0')} />
          <Field label="Cost of equity kₑ" unit="%" value={p.kePct} onChange={setProf('kePct')} />
          <Field label="Cost of debt k_d" unit="%" value={p.kdPct} onChange={setProf('kdPct')} />
        </div>
        {m && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
            <Kpi label="Market cap" value={fmtM(m.mktCap, 0)} sub="shares × price" />
            <Kpi label="CAFD / share" value={fmtDps(m.cafdps0)} sub="CAFD ÷ shares" />
            <Kpi label="DPS (declared)" value={fmtDps(m.dps0)} sub="CAFD/share × payout ratio" color={T.indigo} />
            <Kpi label="Coverage" value={fmtX(m.coverage0)} sub="CAFD/share ÷ DPS" />
            <Kpi label="Net debt / CAFD" value={fmtX(m.lev0, 1)} sub="Pre-dropdown leverage" />
            <Kpi label="WACC (pre-deal)" value={fmtPct(m.wacc * 100, 2)} sub="(E·kₑ + D·k_d)/(E+D), no tax shield" color={T.teal} />
          </div>
        )}
      </div>

      {/* ── Dropdown modeling ───────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={h2}>Dropdown — Accretion / Dilution Model</h2>
          <EditableBadge text="Editable defaults — illustrative ~150 MW contracted solar dropdown" />
          <div style={{ marginLeft: 'auto' }}><LocalBadge /></div>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
          <Field label="Asset CAFD" unit="$M/yr" value={d.assetCafd} onChange={setDrop('assetCafd')} />
          <Field label="Purchase price" unit="$M" value={d.purchase} onChange={setDrop('purchase')} />
          <Field label="Equity issuance" unit="% of price" value={d.eqPct} onChange={setDrop('eqPct')} />
          <Field label="New debt" unit="% of price" value={d.debtPct} onChange={setDrop('debtPct')} />
          <Field label="Retained CAFD" unit="% of price" value={d.retPct} onChange={setDrop('retPct')} />
          <Field label="Equity issue discount" unit="% to market" value={d.discPct} onChange={setDrop('discPct')} />
        </div>
        {m && !m.mixOk && (
          <div style={{ fontSize: 12, color: T.red, fontWeight: 700, marginBottom: 10 }}>
            Funding mix sums to {fmtPct(m.mixSum * 100, 1)} — set equity + debt + retained = 100% for a fully funded purchase.
          </div>
        )}
        {retainedWarning && (
          <div style={{ fontSize: 12, color: T.amber, fontWeight: 700, marginBottom: 10 }}>
            Retained-CAFD funding ({fmtM(m.retainedUsed, 0)}) exceeds one year of retained CAFD ({fmtM(m.retainedAvailYr, 0)} = CAFD × (1 − payout)) — assumes accumulated cash on hand.
          </div>
        )}
        <div style={formulaBox}>
          new shares = (price% × purchase) ÷ [share price × (1 − discount)] &nbsp;·&nbsp;
          interest drag = new debt × k_d &nbsp;·&nbsp;
          pro-forma CAFD = CAFD₀ + asset CAFD − interest drag &nbsp;·&nbsp;
          pro-forma CAFD/share = pro-forma CAFD ÷ (shares₀ + new shares) &nbsp;·&nbsp;
          accretion = pro-forma CAFD/share ÷ CAFD/share₀ − 1.
          Distribution policy: DPS held at the pre-deal level; post-dropdown payout = DPS₀ ÷ pro-forma CAFD/share;
          coverage = pro-forma CAFD/share ÷ DPS₀. Retained-CAFD funding raises net debt (cash used).
        </div>
        {m && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="CAFD/share accretion" value={fmtPct(m.accretionPct, 2)}
                sub={`${fmtDps(m.cafdps0)} → ${fmtDps(m.cafdps1)}`}
                color={m.accretionPct >= 0 ? T.green : T.red} />
              <Kpi label="Purchase multiple" value={m.assetCafd > 0 ? fmtX(m.purchase / m.assetCafd, 1) : '—'} sub="price ÷ asset CAFD" />
              <Kpi label="New shares issued" value={`${fmtNum(m.newSharesM, 1)}M`} sub={`at ${fmtDps(m.issuePrice)} (${fmtNum(num(d.discPct), 1)}% discount)`} />
              <Kpi label="Post-dropdown payout" value={fmtPct(m.payout1, 1)} sub={`vs ${fmtPct(m.payout * 100, 0)} pre-deal · DPS held ${fmtDps(m.dps0)}`}
                color={m.payout1 != null && m.payout1 > 100 ? T.red : m.payout1 > 90 ? T.amber : T.green} />
              <Kpi label="Coverage after" value={fmtX(m.coverage1)} sub={`${fmtX(m.coverage0)} before · <1.0x = unsustainable`}
                color={m.coverage1 != null && m.coverage1 < 1 ? T.red : T.navy} />
              <Kpi label="Net debt / CAFD after" value={fmtX(m.lev1, 1)} sub={`${fmtX(m.lev0, 1)} before`}
                color={m.lev1 != null && m.lev1 > 5 ? T.amber : T.navy} />
            </div>

            {/* Funding + CAFD walk table */}
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.2, minWidth: 340 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Funding & pro-forma CAFD walk</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Line</th><th style={th}>Amount</th><th style={th}>Basis</th></tr></thead>
                  <tbody>
                    <tr><td style={td}>Purchase price</td><td style={{ ...td, fontFamily: T.mono }}>{fmtM(m.purchase, 0)}</td><td style={td}>input</td></tr>
                    <tr><td style={td}>Equity issuance</td><td style={{ ...td, fontFamily: T.mono }}>{fmtM(m.equityRaised, 0)}</td><td style={td}>{fmtNum(m.newSharesM, 1)}M new shares @ {fmtDps(m.issuePrice)}</td></tr>
                    <tr><td style={td}>New debt</td><td style={{ ...td, fontFamily: T.mono }}>{fmtM(m.debtRaised, 0)}</td><td style={td}>at k_d {fmtPct(m.kd * 100, 2)}</td></tr>
                    <tr><td style={td}>Retained CAFD (cash)</td><td style={{ ...td, fontFamily: T.mono }}>{fmtM(m.retainedUsed, 0)}</td><td style={td}>vs {fmtM(m.retainedAvailYr, 0)}/yr retained</td></tr>
                    <tr><td style={{ ...td, fontWeight: 700 }}>CAFD₀</td><td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{fmtM(m.cafd0, 0)}</td><td style={td}>input</td></tr>
                    <tr><td style={td}>+ Asset CAFD</td><td style={{ ...td, fontFamily: T.mono, color: T.green }}>+{fmtM(m.assetCafd, 0)}</td><td style={td}>dropdown contribution</td></tr>
                    <tr><td style={td}>− Interest on new debt</td><td style={{ ...td, fontFamily: T.mono, color: T.red }}>−{fmtM(m.interestDrag, 1)}</td><td style={td}>{fmtM(m.debtRaised, 0)} × {fmtPct(m.kd * 100, 2)}</td></tr>
                    <tr><td style={{ ...td, fontWeight: 700 }}>Pro-forma CAFD</td><td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: T.teal }}>{fmtM(m.cafd1, 1)}</td><td style={td}>on {fmtNum(m.shares1, 1)}M shares</td></tr>
                  </tbody>
                </table>
              </div>
              <div style={{ flex: 1.4, minWidth: 380 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                  CAFD/share accretion vs purchase price (funding mix held at {fmtNum(num(d.eqPct), 0)}/{fmtNum(num(d.debtPct), 0)}/{fmtNum(num(d.retPct), 0)})
                </div>
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={sweep} margin={{ bottom: 20, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="multiple" tick={{ fontSize: 10 }} label={{ value: 'Purchase multiple (× asset CAFD)', position: 'insideBottom', offset: -8, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} label={{ value: 'Accretion %', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip formatter={(v, n, pt) => [`${v}% · ${fmtM(pt?.payload?.purchase, 0)}`, 'CAFD/share accretion']} />
                    <ReferenceLine y={0} stroke={T.red} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="accretion" stroke={T.indigo} strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Fleet register + committed dropdown schedule ─────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={h2}>Fleet Register & Committed Dropdown Schedule</h2>
          <EditableBadge text="Editable per-asset register — hand-authored illustrative fleet (sums to the profile CAFD)" />
          <div style={{ marginLeft: 'auto' }}><LocalBadge /></div>
        </div>
        <div style={formulaBox}>
          Fleet intensity = Σ(generationᵢ × intensityᵢ) ÷ Σ generationᵢ (generation-weighted tCO2e/MWh) &nbsp;·&nbsp;
          green-eligible CAFD share = Σ CAFD of taxonomy-aligned assets ÷ total CAFD &nbsp;·&nbsp;
          the 5-yr model rolls each asset's CAFD at (1 − decline)ᵗ and adds each committed dropdown from its entry
          year (financed at the headline funding mix and issue price — static, documented).
        </div>
        <div style={{ overflowX: 'auto', marginBottom: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Asset</th><th style={th}>Contract</th><th style={th}>Gen (GWh/yr)</th><th style={th}>CAFD ($M)</th>
                <th style={th}>Intensity (tCO2e/MWh)</th><th style={th}>Decline (%/yr)</th><th style={th}>Life (yrs)</th><th style={th}>Taxonomy</th><th style={{ ...th, width: 46 }} />
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id}>
                  <td style={td}><input style={{ ...inputStyle, minWidth: 150 }} value={a.name} onChange={(e) => setAsset(a.id, 'name', e.target.value)} /></td>
                  <td style={td}>
                    <select style={{ ...inputStyle, width: 110 }} value={a.type} onChange={(e) => setAsset(a.id, 'type', e.target.value)}>
                      <option value="contracted">Contracted</option><option value="merchant">Merchant</option>
                    </select>
                  </td>
                  <td style={td}><input type="number" style={{ ...inputStyle, width: 80 }} value={a.genGwh} onChange={(e) => setAsset(a.id, 'genGwh', e.target.value)} /></td>
                  <td style={td}><input type="number" style={{ ...inputStyle, width: 70 }} value={a.cafd} onChange={(e) => setAsset(a.id, 'cafd', e.target.value)} /></td>
                  <td style={td}><input type="number" step="0.01" style={{ ...inputStyle, width: 80 }} value={a.intensity} onChange={(e) => setAsset(a.id, 'intensity', e.target.value)} /></td>
                  <td style={td}><input type="number" step="0.1" style={{ ...inputStyle, width: 60 }} value={a.declinePct} onChange={(e) => setAsset(a.id, 'declinePct', e.target.value)} /></td>
                  <td style={td}><input type="number" style={{ ...inputStyle, width: 55 }} value={a.lifeYrs} onChange={(e) => setAsset(a.id, 'lifeYrs', e.target.value)} /></td>
                  <td style={{ ...td, textAlign: 'center' }}><input type="checkbox" checked={!!a.taxonomy} onChange={(e) => setAsset(a.id, 'taxonomy', e.target.checked)} style={{ accentColor: T.green }} /></td>
                  <td style={td}>{assets.length > 1 && <button onClick={() => removeAsset(a.id)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.red, cursor: 'pointer', fontSize: 11, padding: '3px 7px' }}>✕</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addAsset} style={{ background: 'transparent', border: `1px dashed ${T.navy}66`, borderRadius: 8, color: T.navy, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '6px 14px', marginBottom: 14 }}>+ Add asset</button>

        <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Committed dropdown schedule (sponsor ROFO pipeline — years 1-5)</div>
        <div style={{ overflowX: 'auto', marginBottom: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Dropdown</th><th style={th}>Entry yr</th><th style={th}>CAFD ($M)</th><th style={th}>Purchase ($M)</th>
                <th style={th}>Gen (GWh/yr)</th><th style={th}>Intensity (tCO2e/MWh)</th><th style={th}>Taxonomy</th><th style={{ ...th, width: 46 }} />
              </tr>
            </thead>
            <tbody>
              {sched.map((s) => (
                <tr key={s.id}>
                  <td style={td}><input style={{ ...inputStyle, minWidth: 140 }} value={s.name} onChange={(e) => setSchedRow(s.id, 'name', e.target.value)} /></td>
                  <td style={td}><input type="number" min="1" max="5" style={{ ...inputStyle, width: 55 }} value={s.year} onChange={(e) => setSchedRow(s.id, 'year', e.target.value)} /></td>
                  <td style={td}><input type="number" style={{ ...inputStyle, width: 70 }} value={s.cafd} onChange={(e) => setSchedRow(s.id, 'cafd', e.target.value)} /></td>
                  <td style={td}><input type="number" style={{ ...inputStyle, width: 80 }} value={s.purchase} onChange={(e) => setSchedRow(s.id, 'purchase', e.target.value)} /></td>
                  <td style={td}><input type="number" style={{ ...inputStyle, width: 80 }} value={s.genGwh} onChange={(e) => setSchedRow(s.id, 'genGwh', e.target.value)} /></td>
                  <td style={td}><input type="number" step="0.01" style={{ ...inputStyle, width: 80 }} value={s.intensity} onChange={(e) => setSchedRow(s.id, 'intensity', e.target.value)} /></td>
                  <td style={{ ...td, textAlign: 'center' }}><input type="checkbox" checked={!!s.taxonomy} onChange={(e) => setSchedRow(s.id, 'taxonomy', e.target.checked)} style={{ accentColor: T.green }} /></td>
                  <td style={td}><button onClick={() => removeSched(s.id)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.red, cursor: 'pointer', fontSize: 11, padding: '3px 7px' }}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addSched} style={{ background: 'transparent', border: `1px dashed ${T.navy}66`, borderRadius: 8, color: T.navy, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '6px 14px', marginBottom: 12 }}>+ Add committed dropdown</button>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Kpi label="Fleet generation" value={`${fmtNum(fleet.totGen, 0)} GWh`} sub={`${assets.length} assets`} />
          <Kpi label="Fleet CAFD (register)" value={fmtM(fleet.totCafd, 0)} sub={m && Math.abs(fleet.totCafd - m.cafd0) > 1 ? `⚠ differs from profile CAFD ${fmtM(m.cafd0, 0)}` : 'matches profile CAFD'} color={m && Math.abs(fleet.totCafd - m.cafd0) > 1 ? T.amber : T.navy} />
          <Kpi label="Fleet emissions intensity" value={`${fmtInt(fleet.intensity)} t/MWh`} sub={`${fmtNum(fleet.emis, 0)} tCO2e/yr ÷ ${fmtNum(fleet.totGen * 1000, 0)} MWh`} color={T.green} />
          <Kpi label="Green-eligible CAFD share" value={fmtPct(fleet.greenSharePct, 1)} sub="Taxonomy-aligned asset CAFD ÷ total (self-designated flags)" color={T.teal} />
        </div>
      </div>

      {/* ── 5-year CAFD / DPS / coverage model ───────────────────────────── */}
      {fy && m && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <h2 style={h2}>5-Year CAFD/Share Model — Fleet Decline + Committed Dropdowns</h2>
            <div style={{ marginLeft: 'auto' }}><LocalBadge /></div>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
            <Field label="DPS growth target" unit="%/yr" value={mp.dpsGrowthTargetPct} onChange={setMpF('dpsGrowthTargetPct')} />
            <Field label="Payout ceiling" unit="% of CAFD/sh" value={mp.payoutMaxPct} onChange={setMpF('payoutMaxPct')} />
          </div>
          <div style={formulaBox}>
            CAFDₜ = Σᵢ CAFDᵢ×(1−declineᵢ)ᵗ + Σ dropdown CAFD (from entry year, flat) − Σ acquisition-debt interest
            &nbsp;·&nbsp; sharesₜ grow by each dropdown's equity tranche ÷ issue price &nbsp;·&nbsp;
            DPS policy (documented rule): DPSₜ = min(DPSₜ₋₁ × (1+g_target), payout_ceiling × CAFD/shareₜ) —
            the ceiling binds when growth outruns CAFD; a DPS below last year's level is flagged as a CUT
            &nbsp;·&nbsp; coverage = CAFD/share ÷ DPS.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <Kpi label="Year-5 CAFD" value={fmtM(fy.rows[4].cafd, 0)} sub={`vs ${fmtM(m.cafd0, 0)} today`} />
            <Kpi label="Year-5 CAFD/share" value={fmtDps(fy.rows[4].cafdps)} sub={`on ${fmtNum(fy.rows[4].shares, 1)}M shares`} />
            <Kpi label="DPS path CAGR" value={fmtPct(fy.dpsCagr, 2)} sub={`target ${fmtNum(mp.dpsGrowthTargetPct, 1)}%/yr`} color={fy.dpsCagr >= num(mp.dpsGrowthTargetPct) - 0.05 ? T.green : T.amber} />
            <Kpi label="Min coverage (yrs 1-5)" value={fmtX(Math.min(...fy.rows.map((r) => r.coverage ?? 99)))} sub="<1.0x = payout exceeds CAFD" color={Math.min(...fy.rows.map((r) => r.coverage ?? 99)) < 1 ? T.red : T.navy} />
            {fy.rows.some((r) => r.cut) && <Kpi label="DPS cut flagged" value={`Year ${fy.rows.find((r) => r.cut)?.year}`} sub="Payout ceiling binds below prior DPS" color={T.red} />}
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ flex: 1.4, minWidth: 400 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>CAFD/share vs DPS path + coverage trajectory (local model)</div>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={fy.rows} margin={{ bottom: 5, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="ps" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                  <YAxis yAxisId="cov" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(1)}x`} domain={[0.8, 'auto']} />
                  <Tooltip formatter={(v, n) => [n === 'Coverage (right)' ? fmtX(v) : fmtDps(v), n]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="ps" dataKey="cafdps" name="CAFD/share" fill={T.indigo} fillOpacity={0.75} radius={[3, 3, 0, 0]} />
                  <Line yAxisId="ps" type="monotone" dataKey="dps" name="DPS (policy rule)" stroke={T.green} strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="cov" type="monotone" dataKey="coverage" name="Coverage (right)" stroke={T.red} strokeWidth={2} strokeDasharray="5 3" dot={false} />
                  <ReferenceLine yAxisId="cov" y={1} stroke={T.red} strokeDasharray="2 4" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 340, overflowX: 'auto' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Year-by-year roll-up</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr><th style={th}>Yr</th><th style={th}>Fleet</th><th style={th}>Dropdowns</th><th style={th}>−Interest</th><th style={th}>CAFD</th><th style={th}>CAFD/sh</th><th style={th}>DPS</th><th style={th}>Payout</th><th style={th}>Cov</th></tr>
                </thead>
                <tbody>
                  {fy.rows.map((r) => (
                    <tr key={r.year} style={r.cut ? { background: '#fef2f2' } : undefined}>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{r.year}{r.cut ? ' ⚠' : ''}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtM(r.fleetCafd, 0)}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: T.green }}>+{fmtM(r.ddCafd, 0)}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: T.red }}>−{fmtM(r.addedInterest, 1)}</td>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{fmtM(r.cafd, 0)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtDps(r.cafdps)}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: r.cut ? T.red : T.green, fontWeight: 700 }}>{fmtDps(r.dps)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(r.payoutPct, 0)}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: r.coverage < 1 ? T.red : T.slate }}>{fmtX(r.coverage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Valuation suite ─────────────────────────────────────────────── */}
      {valuation && m && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <h2 style={h2}>Valuation Suite — Three-Stage DDM · Yield Spread · NAV SOTP · Implied kₑ</h2>
            <div style={{ marginLeft: 'auto' }}><LocalBadge /></div>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
            <Field label="Terminal DPS growth g" unit="%" value={mp.gTermPct} onChange={setMpF('gTermPct')} />
            <Field label="10-yr treasury yield" unit="%" value={mp.tenYrPct} onChange={setMpF('tenYrPct')} />
            <Field label="Required yield spread" unit="bps over 10yr" value={mp.spreadBps} onChange={setMpF('spreadBps')} />
            <Field label="Discount rate — contracted" unit="%" value={mp.kContrPct} onChange={setMpF('kContrPct')} />
            <Field label="Discount rate — merchant" unit="%" value={mp.kMerchPct} onChange={setMpF('kMerchPct')} />
          </div>
          <div style={formulaBox}>
            THREE-STAGE DDM (documented): stage 1 = 5-yr model DPS path · stage 2 (yrs 6-10) = growth fades linearly
            from the model's year-5 growth to g_term · stage 3 = Gordon terminal DPS₁₀×(1+g)/(kₑ−g), all at kₑ
            &nbsp;·&nbsp; YIELD-SPREAD: fair price = DPS₁ ÷ (10yr + spread) — spread history table is hand-authored,
            labeled &nbsp;·&nbsp; NAV SOTP: per-asset DCF of declining CAFD over remaining life at the contracted or
            merchant rate, minus corporate debt &nbsp;·&nbsp; IMPLIED kₑ: bisection solving DDM(kₑ*) = market price.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <Kpi label="DDM value / share" value={fmtDps(valuation.ddmValue)} sub={`at kₑ ${fmtPct(m.ke * 100, 2)} · price ${fmtDps(m.price)} (${fmtPct(valuation.premToDdmPct, 1)} vs DDM)`} color={valuation.premToDdmPct > 0 ? T.red : T.green} />
            <Kpi label="Implied cost of equity" value={valuation.impliedKe != null ? fmtPct(valuation.impliedKe * 100, 2) : 'no root'} sub="DDM(kₑ*) = market price (bisection)" color={T.purple} />
            <Kpi label="Yield-spread fair price" value={fmtDps(valuation.fairPrice)} sub={`DPS₁ ${fmtDps(valuation.dps1)} ÷ (${fmtNum(mp.tenYrPct, 1)}% + ${fmtNum(mp.spreadBps, 0)}bp)`} color={T.blue} />
            <Kpi label="Current yield / spread" value={fmtPct(valuation.curYieldPct, 2)} sub={`${fmtNum(valuation.curSpreadBps, 0)}bp over the 10yr`} />
            <Kpi label="NAV SOTP / share" value={fmtDps(valuation.navps)} sub={`GAV ${fmtM(valuation.gav, 0)} − corp debt ${fmtM(valuation.corpDebt, 0)} (${fmtPct(valuation.premToNavPct, 1)} price vs NAV)`} color={T.teal} />
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ flex: 1.2, minWidth: 360 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>NAV SOTP — per-asset DCF at differentiated discount rates</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Asset</th><th style={th}>Rate</th><th style={th}>Life</th><th style={{ ...th, textAlign: 'right' }}>DCF value</th><th style={{ ...th, textAlign: 'right' }}>× CAFD</th></tr></thead>
                <tbody>
                  {valuation.sotpRows.map((r, i) => (
                    <tr key={i}>
                      <td style={td}>{r.name}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: r.type === 'merchant' ? T.amber : T.teal }}>{fmtPct(r.rate * 100, 1)} {r.type === 'merchant' ? '(merch)' : '(contr)'}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{r.life}y</td>
                      <td style={{ ...td, fontFamily: T.mono, textAlign: 'right', fontWeight: 700 }}>{fmtM(r.value, 0)}</td>
                      <td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{r.cafd > 0 ? fmtX(r.value / r.cafd, 1) : '—'}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ ...td, fontWeight: 800 }}>GAV − corp debt = NAV</td><td style={td} /><td style={td} />
                    <td style={{ ...td, fontFamily: T.mono, textAlign: 'right', fontWeight: 800, color: T.teal }}>{fmtM(valuation.nav, 0)}</td>
                    <td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmtDps(valuation.navps)}/sh</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                DPS-yield spread history vs 10yr (hand-authored illustrative levels, labeled — NOT market data)
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={SPREAD_HISTORY} margin={{ bottom: 5, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: 'bps', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`${v}bp`, 'sector DPS-yield spread']} />
                  <ReferenceLine y={num(mp.spreadBps)} stroke={T.navy} strokeDasharray="4 4" label={{ value: `your ${mp.spreadBps}bp`, fontSize: 10, fill: T.navy }} />
                  {valuation.curSpreadBps != null && <ReferenceLine y={valuation.curSpreadBps} stroke={T.red} strokeDasharray="2 4" label={{ value: `current ${fmtNum(valuation.curSpreadBps, 0)}bp`, fontSize: 10, fill: T.red }} />}
                  <Bar dataKey="spreadBps" fill={T.gold} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 10.5, color: T.sub }}>
                Wider current spread than required = cheap on yield basis (and vice versa). Triangulate DDM, yield
                and SOTP — dispersion between the three is itself a signal about embedded growth expectations.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Capital structure & dividend-cut stress ──────────────────────── */}
      {capm && m && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <h2 style={h2}>Corporate Capital Structure — Revolver, HoldCo Notes, DSCR & Dividend-Cut Stress</h2>
            <div style={{ marginLeft: 'auto' }}><LocalBadge /></div>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
            <Field label="Revolver drawn" unit="$M" value={cap.revolver} onChange={setCapF('revolver')} />
            <Field label="Revolver rate" unit="%" value={cap.revRatePct} onChange={setCapF('revRatePct')} />
            <Field label="HoldCo notes" unit="$M" value={cap.notes} onChange={setCapF('notes')} />
            <Field label="Notes coupon" unit="%" value={cap.notesRatePct} onChange={setCapF('notesRatePct')} />
          </div>
          {capm.debtMismatch && (
            <div style={{ fontSize: 11.5, color: T.amber, fontWeight: 700, marginBottom: 8 }}>
              Revolver + notes ({fmtM(capm.corpDebt, 0)}) differs from the profile's net debt ({fmtM(m.netDebt0, 0)}) — the
              SOTP and DSCR use the instrument-level figures; align them for consistency.
            </div>
          )}
          <div style={formulaBox}>
            Corporate DSCR = CAFD₁ ÷ corporate interest (revolver×rate + notes×coupon; CAFD is already net of
            project-level debt service — documented) &nbsp;·&nbsp; FFO/debt ≈ CAFD ÷ (revolver + notes)
            &nbsp;·&nbsp; DIVIDEND-CUT STRESS (documented policy rule): at each CAFD haircut, coverage = stressed
            CAFD ÷ current dividend cash; verdict CUT &lt; 1.00x ≤ WATCH &lt; 1.10x ≤ HOLD; a CUT rebases DPS to
            100% payout of stressed CAFD.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <Kpi label="Corporate interest" value={fmtM(capm.interest, 1)} sub={`on ${fmtM(capm.corpDebt, 0)} revolver + notes`} />
            <Kpi label="Corporate DSCR (yr 1)" value={fmtX(capm.dscr)} sub="CAFD ÷ corporate interest" color={capm.dscr != null && capm.dscr < 2 ? T.amber : T.navy} />
            <Kpi label="FFO / debt" value={fmtPct(capm.ffoDebtPct, 1)} sub="CAFD ÷ corporate debt (proxy)" />
            <Kpi label="Dividend cash" value={fmtM(capm.dpsCash, 0)} sub={`DPS ${fmtDps(m.dps0)} × ${fmtNum(m.sharesM, 0)}M shares`} color={T.indigo} />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><th style={th}>CAFD haircut</th><th style={{ ...th, textAlign: 'right' }}>Stressed CAFD</th><th style={{ ...th, textAlign: 'right' }}>Coverage</th><th style={{ ...th, textAlign: 'right' }}>DSCR</th><th style={th}>Verdict</th><th style={{ ...th, textAlign: 'right' }}>DPS if rule applied</th></tr>
            </thead>
            <tbody>
              {capm.stress.map((r) => (
                <tr key={r.haircut} style={r.verdict === 'CUT' ? { background: '#fef2f2' } : r.verdict === 'WATCH' ? { background: '#fffbeb' } : undefined}>
                  <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{r.haircut === 0 ? 'Base' : `${r.haircut}%`}</td>
                  <td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmtM(r.cafd, 0)}</td>
                  <td style={{ ...td, fontFamily: T.mono, textAlign: 'right', color: r.coverage < 1 ? T.red : T.slate }}>{fmtX(r.coverage)}</td>
                  <td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmtX(r.dscr)}</td>
                  <td style={{ ...td, fontWeight: 800, color: r.verdict === 'CUT' ? T.red : r.verdict === 'WATCH' ? T.amber : T.green }}>{r.verdict}</td>
                  <td style={{ ...td, fontFamily: T.mono, textAlign: 'right', color: r.verdict === 'CUT' ? T.red : T.slate }}>{fmtDps(r.impliedDps)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── NOL shield runway ───────────────────────────────────────────── */}
      {nolm && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <h2 style={h2}>Tax Attributes — NOL Shield Runway & CAFD-After-Tax Bridge</h2>
            <div style={{ marginLeft: 'auto' }}><LocalBadge /></div>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
            <Field label="NOL balance" unit="$M" value={taxS.nol} onChange={setTaxF('nol')} />
            <Field label="Taxable fraction of CAFD" unit="%" value={taxS.taxableFracPct} onChange={setTaxF('taxableFracPct')} />
          </div>
          <div style={formulaBox}>
            DOCUMENTED SIMPLIFIED SCHEDULE: taxable incomeₜ ≈ CAFDₜ × taxable fraction (accelerated depreciation
            shields the rest — user-set proxy, not a tax computation) &nbsp;·&nbsp; §172 post-2017 rule: NOLs offset
            at most 80% of taxable income &nbsp;·&nbsp; cash taxₜ = 21% × (taxable − NOL used) &nbsp;·&nbsp;
            the runway ends the first year cash tax &gt; 0 ("cash-taxpayer year").
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <Kpi label="Cash-taxpayer year" value={nolm.cashTaxYear ? `Year ${nolm.cashTaxYear}` : 'Beyond year 5'} sub={nolm.cashTaxYear ? 'NOL 80% limitation binds from year 1 (§172)' : `NOL remaining ${fmtM(nolm.endBal, 0)} at year 5`} color={nolm.cashTaxYear ? T.amber : T.green} />
            <Kpi label="Year-1 CAFD after tax" value={fmtM(nolm.rows[0].cafdAfterTax, 1)} sub={`CAFD ${fmtM(nolm.rows[0].cafd, 0)} − cash tax ${fmtM(nolm.rows[0].cashTax, 1)}`} />
            <Kpi label="NOL used (yrs 1-5)" value={fmtM(num(taxS.nol) - nolm.endBal, 0)} sub={`of ${fmtM(num(taxS.nol), 0)} balance`} color={T.purple} />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><th style={th}>Yr</th><th style={{ ...th, textAlign: 'right' }}>CAFD</th><th style={{ ...th, textAlign: 'right' }}>Taxable proxy</th><th style={{ ...th, textAlign: 'right' }}>NOL used (≤80%)</th><th style={{ ...th, textAlign: 'right' }}>NOL balance</th><th style={{ ...th, textAlign: 'right' }}>Cash tax @21%</th><th style={{ ...th, textAlign: 'right' }}>CAFD after tax</th></tr>
            </thead>
            <tbody>
              {nolm.rows.map((r) => (
                <tr key={r.year} style={r.cashTax > 0.005 ? { background: '#fffbeb' } : undefined}>
                  <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{r.year}</td>
                  <td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmtM(r.cafd, 0)}</td>
                  <td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmtM(r.taxable, 1)}</td>
                  <td style={{ ...td, fontFamily: T.mono, textAlign: 'right', color: T.purple }}>{fmtM(r.nolUsed, 1)}</td>
                  <td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmtM(r.nolBal, 1)}</td>
                  <td style={{ ...td, fontFamily: T.mono, textAlign: 'right', color: r.cashTax > 0.005 ? T.red : T.slate }}>{fmtM(r.cashTax, 2)}</td>
                  <td style={{ ...td, fontFamily: T.mono, textAlign: 'right', fontWeight: 700 }}>{fmtM(r.cafdAfterTax, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Sustainability × financial overlay ───────────────────────────── */}
      {susm && m && (
        <div style={{ ...card, background: '#f7fdf9', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <h2 style={{ ...h2, color: T.green }}>Sustainability × Financial — Fleet Intensity, Dropdown Screen & kₑ Premium</h2>
            <div style={{ marginLeft: 'auto' }}><LocalBadge /></div>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
            <Field label="kₑ slope" unit="% per 1.0 tCO2e/MWh" value={sus.slopePctPerT} onChange={setSusF('slopePctPerT')} />
            <Field label="Intensity benchmark" unit="tCO2e/MWh" value={sus.benchmarkT} onChange={setSusF('benchmarkT')} />
          </div>
          <div style={formulaBox}>
            Fleet intensity = generation-weighted Σ genᵢ×intensityᵢ ÷ Σ genᵢ &nbsp;·&nbsp; DROPDOWN EMISSIONS
            SCREEN: post-deal intensity = (fleet emissions + dropdown gen×intensity) ÷ (fleet gen + dropdown gen);
            a dropdown ABOVE the current fleet intensity is intensity-ACCRETIVE (flagged) &nbsp;·&nbsp;
            SUSTAINABILITY kₑ PREMIUM (HAND-AUTHORED, labeled — user slope, not an estimated market coefficient):
            Δkₑ = slope × (fleet intensity − benchmark); DDM re-priced at kₑ + Δkₑ.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <Kpi label="Fleet intensity" value={`${fmtInt(fleet.intensity)} t/MWh`} sub={`benchmark ${fmtInt(num(sus.benchmarkT), 2)} — ${fleet.intensity > num(sus.benchmarkT) ? 'above' : 'below'}`} color={fleet.intensity > num(sus.benchmarkT) ? T.amber : T.green} />
            <Kpi label="Green-eligible CAFD (incl. pipeline)" value={fmtPct(susm.greenShare5, 1)} sub={`register-only ${fmtPct(fleet.greenSharePct, 1)}`} color={T.teal} />
            <Kpi label="Sustainability Δkₑ" value={`${susm.dKe >= 0 ? '+' : ''}${fmtNum(susm.dKe * 100, 2)}pp`} sub={`kₑ ${fmtPct(m.ke * 100, 2)} → ${fmtPct(susm.keAdj * 100, 2)} (labeled mapping)`} color={susm.dKe > 0 ? T.red : T.green} />
            <Kpi label="DDM at adjusted kₑ" value={fmtDps(susm.ddmAtAdj)} sub={`vs ${fmtDps(valuation?.ddmValue)} at base kₑ`} color={T.purple} />
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ flex: 1.1, minWidth: 360 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Dropdown emissions-accretion screen (committed schedule)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Dropdown</th><th style={{ ...th, textAlign: 'right' }}>Asset t/MWh</th><th style={{ ...th, textAlign: 'right' }}>Fleet after</th><th style={{ ...th, textAlign: 'right' }}>Δ intensity</th><th style={th}>Verdict</th></tr></thead>
                <tbody>
                  {susm.screen.map((s, i) => (
                    <tr key={i} style={s.accretive ? { background: '#fef2f2' } : undefined}>
                      <td style={{ ...td, fontWeight: 700 }}>{s.name} (yr {s.year})</td>
                      <td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmtInt(s.intensity)}</td>
                      <td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmtInt(s.after)}</td>
                      <td style={{ ...td, fontFamily: T.mono, textAlign: 'right', color: s.accretive ? T.red : T.green }}>{s.delta >= 0 ? '+' : ''}{fmtInt(s.delta, 4)}</td>
                      <td style={{ ...td, fontWeight: 800, color: s.accretive ? T.red : T.green }}>{s.accretive ? '⚠ INTENSITY-ACCRETIVE' : 'Intensity-dilutive'}</td>
                    </tr>
                  ))}
                  {susm.screen.length === 0 && <tr><td style={td} colSpan={5}>No committed dropdowns — add one in the schedule above to screen it.</td></tr>}
                </tbody>
              </table>
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 6 }}>
                A gas/thermal dropdown on a renewables fleet flags intensity-ACCRETIVE: it raises the fleet's
                generation-weighted tCO2e/MWh, erodes the green-eligible CAFD share and — via the labeled slope —
                the cost of equity. Screen each ROFO asset before it prices.
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 340 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                Sustainability-premium sensitivity: DDM value vs fleet intensity (slope {fmtNum(num(sus.slopePctPerT), 1)}%/t — user assumption, labeled)
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={susm.sens} margin={{ bottom: 15, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="intensity" tick={{ fontSize: 10 }} label={{ value: 'Fleet intensity (tCO2e/MWh)', position: 'insideBottom', offset: -6, fontSize: 10 }} />
                  <YAxis yAxisId="v" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                  <YAxis yAxisId="k" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                  <Tooltip formatter={(v, n) => [n === 'kₑ (right)' ? fmtPct(v, 2) : fmtDps(v), n]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area yAxisId="v" type="monotone" dataKey="ddm" name="DDM value/share" stroke={T.green} fill={T.green} fillOpacity={0.15} strokeWidth={2} />
                  <Line yAxisId="k" type="monotone" dataKey="kePct" name="kₑ (right)" stroke={T.red} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                  <ReferenceLine yAxisId="v" x={+fleet.intensity.toFixed(2)} stroke={T.navy} strokeDasharray="4 4" label={{ value: 'your fleet', fontSize: 10, fill: T.navy }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── NAV/share bridge ────────────────────────────────────────────── */}
      {m && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <h2 style={h2}>NAV / Share Bridge</h2>
            <div style={{ marginLeft: 'auto' }}><LocalBadge /></div>
          </div>
          <div style={formulaBox}>
            EV = gross CAFD ÷ WACC (zero-growth perpetuity at the pre-deal WACC — documented simplification;
            swap in your own cap rate by editing kₑ/k_d) &nbsp;·&nbsp; NAV = EV − net debt &nbsp;·&nbsp;
            NAV after = NAV before + (asset CAFD ÷ WACC) − new debt − retained cash used &nbsp;·&nbsp;
            NAV/share after = NAV after ÷ (shares₀ + new shares). Equity issuance moves value only through dilution
            (cash in = cash out to the sponsor). Value created = capitalized asset CAFD − purchase price.
            The per-asset SOTP above is the finer-grained alternative (differentiated rates, finite lives).
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <Kpi label="NAV/share before" value={fmtDps(m.navps0)} sub={`NAV ${fmtM(m.nav0, 0)} ÷ ${fmtNum(m.sharesM, 0)}M shares`} />
            <Kpi label="NAV/share after" value={fmtDps(m.navps1)} sub={`NAV ${fmtM(m.nav1, 0)} ÷ ${fmtNum(m.shares1, 1)}M shares`} color={T.teal} />
            <Kpi label="NAV/share accretion" value={fmtPct(m.navAccretionPct, 2)} color={m.navAccretionPct >= 0 ? T.green : T.red} />
            <Kpi label="Capitalized asset value" value={fmtM(m.assetCapValue, 0)} sub={`asset CAFD ÷ WACC ${fmtPct(m.wacc * 100, 2)}`} />
            <Kpi label="Purchase vs value" value={fmtM(m.purchaseVsValue, 0)}
              sub={m.purchaseVsValue >= 0 ? 'bought below capitalized value' : 'premium paid over capitalized value'}
              color={m.purchaseVsValue >= 0 ? T.green : T.red} />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={navBridge} margin={{ bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
              <YAxis tick={{ fontSize: 10 }} label={{ value: '$M', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip formatter={(v) => fmtM(v, 0)} />
              <ReferenceLine y={0} stroke={T.slate} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {navBridge.map((b, i) => <Cell key={i} fill={b.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── IDR panel ───────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={h2}>Incentive Distribution Rights — Sponsor vs Public Split</h2>
          <EditableBadge text="Editable tier table — classic MLP-style splits, hand-authored thresholds" />
          <div style={{ marginLeft: 'auto' }}><LocalBadge /></div>
        </div>
        <div style={formulaBox}>
          Convention: the declared DPS (held at the pre-deal level, {m ? fmtDps(m.dps0) : '—'}) is allocated
          marginally across tiers on the pro-forma share count. Within each tier the sponsor receives take% of the
          total cash distributed in that tier; the public receives (100 − take)%. Sponsor IDR cash is part of the
          declared total (no gross-up). Tier cash = (DPS in band) × pro-forma shares.
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
          <thead>
            <tr>
              <th style={th}>Tier</th><th style={th}>Band (DPS $/share)</th><th style={th}>Sponsor take %</th>
              <th style={th}>DPS in band</th><th style={th}>Cash in band ($M)</th>
              <th style={th}>Sponsor ($M)</th><th style={th}>Public ($M)</th><th style={{ ...th, width: 50 }} />
            </tr>
          </thead>
          <tbody>
            {tiers.map((t, i) => {
              const r = idr?.rows?.[i];
              const isTop = i === tiers.length - 1;
              return (
                <tr key={t.id}>
                  <td style={{ ...td, fontWeight: 700, color: T.navy }}>{i + 1}{isTop ? ' (high splits)' : ''}</td>
                  <td style={{ ...td, fontFamily: T.mono }}>
                    {r ? fmtDps(r.lo) : '—'} → {isTop ? '∞' : (
                      <input type="number" step="0.01" style={{ ...inputStyle, width: 80, display: 'inline-block' }}
                        value={t.upTo ?? ''} onChange={(e) => setTier(t.id, 'upTo', e.target.value)} />
                    )}
                  </td>
                  <td style={td}>
                    <input type="number" step="1" min="0" max="100" style={{ ...inputStyle, width: 70 }}
                      value={t.takePct} onChange={(e) => setTier(t.id, 'takePct', e.target.value)} />
                  </td>
                  <td style={{ ...td, fontFamily: T.mono }}>{r ? fmtDps(r.inBandPs) : '—'}</td>
                  <td style={{ ...td, fontFamily: T.mono }}>{r ? fmtNum(r.bandCash, 1) : '—'}</td>
                  <td style={{ ...td, fontFamily: T.mono, color: T.purple }}>{r ? fmtNum(r.sponsorCash, 1) : '—'}</td>
                  <td style={{ ...td, fontFamily: T.mono }}>{r ? fmtNum(r.publicCash, 1) : '—'}</td>
                  <td style={td}>
                    {!isTop && tiers.length > 2 && (
                      <button onClick={() => removeTier(t.id)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.red, cursor: 'pointer', fontSize: 11, padding: '3px 7px' }}>✕</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button onClick={addTier} style={{ background: 'transparent', border: `1px dashed ${T.navy}66`, borderRadius: 8, color: T.navy, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '6px 14px', marginBottom: 12 }}>
          + Add tier below high splits
        </button>
        {idr && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Kpi label="Total declared distributions" value={fmtM(idr.totalCash, 1)} sub={`${fmtDps(idr.dpsEval)} × ${fmtNum(m.shares1, 1)}M shares`} />
            <Kpi label="Sponsor IDR cash" value={fmtM(idr.sponsor, 1)} sub="Σ tier cash × take%" color={T.purple} />
            <Kpi label="Public distributions" value={fmtM(idr.publicCash, 1)} color={T.teal} />
            <Kpi label="Sponsor share of total" value={fmtPct(idr.sponsorSharePct, 1)}
              sub="IDR drag on public economics" color={idr.sponsorSharePct > 25 ? T.red : idr.sponsorSharePct > 10 ? T.amber : T.green} />
            <Kpi label="Effective public DPS" value={fmtDps(idr.effectivePublicDps)} sub={`vs declared ${fmtDps(idr.dpsEval)}`} />
          </div>
        )}
      </div>

      {/* ── Takeout comparison ──────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={h2}>Takeout Comparison — YieldCo Dropdown vs Green Securitization (ABS)</h2>
          <EditableBadge text="Editable ABS terms — headline comparison only" />
          <div style={{ marginLeft: 'auto' }}><LocalBadge /></div>
        </div>
        <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 12 }}>
          Sponsor's monetization choice for the same asset: sell it into the YieldCo (full purchase price, funded at the
          YieldCo's WACC, sponsor keeps IDR upside) vs issue a green ABS against the asset's contracted cash flows
          (partial advance at the ABS coupon, sponsor keeps 100% of the residual). Full ABS structuring — tranching,
          credit enhancement, waterfall — lives in the <b>/green-securitization</b> module (text reference only; open it from the nav).
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
          <Field label="ABS advance rate" unit="% of asset value" value={absAdvPct} onChange={setAbsAdvPct} />
          <Field label="ABS senior coupon" unit="%" value={absCoupon} onChange={setAbsCoupon} />
        </div>
        {m && takeout && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><th style={th}>Dimension</th><th style={th}>YieldCo dropdown</th><th style={th}>Green securitization (ABS)</th></tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...td, fontWeight: 700 }}>Upfront proceeds to sponsor</td>
                <td style={{ ...td, fontFamily: T.mono, color: T.teal }}>{fmtM(m.purchase, 0)} (100% of purchase price)</td>
                <td style={{ ...td, fontFamily: T.mono }}>{fmtM(takeout.absProceeds, 0)} ({fmtPct(takeout.adv * 100, 0)} advance on the same value benchmark)</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 700 }}>Cost of funds</td>
                <td style={{ ...td, fontFamily: T.mono }}>YieldCo WACC {fmtPct(m.wacc * 100, 2)} (equity {fmtPct(m.ke * 100, 1)} / debt {fmtPct(m.kd * 100, 1)})</td>
                <td style={{ ...td, fontFamily: T.mono }}>ABS coupon {fmtPct(takeout.absCost, 2)}{takeout.absCost < m.wacc * 100 ? ' — cheaper than WACC' : ' — dearer than WACC'}</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 700 }}>Retained upside</td>
                <td style={td}>IDR tiers on distribution growth{idr ? ` (currently ${fmtPct(idr.sponsorSharePct, 1)} of distributions)` : ''}; no direct asset residual</td>
                <td style={td}>100% of residual cash flow above debt service; equity tranche retained</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 700 }}>Risk transfer</td>
                <td style={td}>Full asset transfer; sponsor exposure via YieldCo stake + IDRs</td>
                <td style={td}>Financing only — asset, performance and residual risk stay with sponsor</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 700 }}>Balance-sheet / control</td>
                <td style={td}>Deconsolidation; YieldCo governance and conflicts committee approval</td>
                <td style={td}>Asset typically stays consolidated (SPV); rating-agency + trustee oversight</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 700 }}>Execution considerations</td>
                <td style={td}>Depends on YieldCo currency (share price vs NAV) and coverage headroom</td>
                <td style={td}>Needs contracted, ratable cash flows; green framework / SPO for green label</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
        All computations are local, display-level corporate-finance math from the editable inputs above (documented
        per panel): per-asset 5-yr CAFD/DPS/coverage model, three-stage DDM + implied-kₑ bisection, yield-spread
        and NAV-SOTP valuation, revolver/HoldCo-notes DSCR + dividend-cut stress (documented policy rule), §172
        NOL runway (simplified schedule, labeled), fleet-intensity roll-up, dropdown emissions-accretion screen,
        green-eligible CAFD share and a hand-authored sustainability kₑ premium. No engine calls; no fabricated
        data. Deeper structuring: /green-securitization (ABS takeout) · /project-finance-debt-sizer (asset-level
        debt capacity).
      </div>
    </div>
  );
}
