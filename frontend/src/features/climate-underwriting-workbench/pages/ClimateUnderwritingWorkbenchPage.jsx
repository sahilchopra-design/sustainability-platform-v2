import React, { useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Climate Underwriting Workbench
// Single-counterparty underwriting view composing THREE wired backend engines:
//   1. POST /api/v1/insurance/calculate                 (Solvency II CAT / SCR / TP)
//   2. POST /api/v1/physical-risk-pricing/price          (E104 physical peril pricing)
//      POST /api/v1/physical-risk-pricing/return-period-losses
//   3. POST /api/v1/pcaf-module/calculate/{asset_class}  (PCAF v2.0 financed emissions)
// The combined underwriting decision summary is DERIVED locally from the three
// live engine responses (no fabricated numbers). Requests go through the CRA
// dev proxy (/api → localhost:8001) with the global axios Bearer token.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

// 30 countries supported by the physical-risk-pricing engine (ISO3) with the
// ISO2 code used by PCAF holding metadata and the display name.
const COUNTRIES = [
  { iso3: 'USA', iso2: 'US', name: 'United States' },
  { iso3: 'GBR', iso2: 'GB', name: 'United Kingdom' },
  { iso3: 'DEU', iso2: 'DE', name: 'Germany' },
  { iso3: 'FRA', iso2: 'FR', name: 'France' },
  { iso3: 'JPN', iso2: 'JP', name: 'Japan' },
  { iso3: 'CHN', iso2: 'CN', name: 'China' },
  { iso3: 'IND', iso2: 'IN', name: 'India' },
  { iso3: 'BRA', iso2: 'BR', name: 'Brazil' },
  { iso3: 'AUS', iso2: 'AU', name: 'Australia' },
  { iso3: 'ZAF', iso2: 'ZA', name: 'South Africa' },
  { iso3: 'NLD', iso2: 'NL', name: 'Netherlands' },
  { iso3: 'BGD', iso2: 'BD', name: 'Bangladesh' },
  { iso3: 'PHL', iso2: 'PH', name: 'Philippines' },
  { iso3: 'IDN', iso2: 'ID', name: 'Indonesia' },
  { iso3: 'VNM', iso2: 'VN', name: 'Vietnam' },
  { iso3: 'MEX', iso2: 'MX', name: 'Mexico' },
  { iso3: 'EGY', iso2: 'EG', name: 'Egypt' },
  { iso3: 'NGA', iso2: 'NG', name: 'Nigeria' },
  { iso3: 'PAK', iso2: 'PK', name: 'Pakistan' },
  { iso3: 'TUR', iso2: 'TR', name: 'Turkey' },
  { iso3: 'ARE', iso2: 'AE', name: 'United Arab Emirates' },
  { iso3: 'SAU', iso2: 'SA', name: 'Saudi Arabia' },
  { iso3: 'SGP', iso2: 'SG', name: 'Singapore' },
  { iso3: 'CAN', iso2: 'CA', name: 'Canada' },
  { iso3: 'ARG', iso2: 'AR', name: 'Argentina' },
  { iso3: 'KOR', iso2: 'KR', name: 'South Korea' },
  { iso3: 'ESP', iso2: 'ES', name: 'Spain' },
  { iso3: 'ITA', iso2: 'IT', name: 'Italy' },
  { iso3: 'THA', iso2: 'TH', name: 'Thailand' },
  { iso3: 'POL', iso2: 'PL', name: 'Poland' },
];

const INSURANCE_PERILS = ['flood', 'tropical_cyclone', 'wildfire', 'drought', 'winter_storm', 'hail', 'earthquake'];
const INSURANCE_SCENARIOS = ['1.5C', '2C', '3C'];
const PHYS_ASSET_CLASSES = ['property', 'infrastructure', 'agriculture', 'energy', 'marine'];
const NGFS_SCENARIOS = [
  { id: 'orderly', label: 'Orderly (NZ2050)' },
  { id: 'disorderly', label: 'Disorderly (Delayed)' },
  { id: 'hot_house', label: 'Hot House (Current Policies)' },
];
const HORIZONS = ['2030', '2040', '2050'];
const PCAF_ASSET_CLASSES = ['business_loans', 'corporate_bonds', 'listed_equity', 'project_finance'];
const GICS_SECTORS = ['Energy', 'Materials', 'Industrials', 'Utilities', 'Consumer Discretionary',
  'Consumer Staples', 'Health Care', 'Financials', 'Information Technology', 'Communication Services', 'Real Estate', 'Unknown'];

// Hand-authored editable example inputs (illustrative underwriting submission —
// NOT live data; every figure below is user-editable before running the engines).
const DEFAULT_INPUTS = {
  entityName: 'Mekong Delta Logistics Hub Co.',
  countryIso3: 'VNM',
  // Insurance (Solvency II) — EUR
  insurerType: 'primary',
  catPeril: 'flood',
  gwpEur: 85_000_000,
  tpEur: 240_000_000,
  scrEur: 120_000_000,
  ownFundsEur: 210_000_000,
  gl100Eur: 60_000_000,
  gl250Eur: 95_000_000,
  aalEur: 9_000_000,
  pmlEur: 110_000_000,
  riRetentionPct: 30,
  riLimitEur: 70_000_000,
  totalEconLossEur: 150_000_000,
  coalExclusion: true,
  oilSandsExclusion: true,
  arcticExclusion: true,
  ffCapPct: 100,
  insScenario: '2C',
  insHorizonYear: 2050,
  // Physical risk pricing — USD
  physAssetClass: 'infrastructure',
  assetValueUsd: 250_000_000,
  ngfsScenario: 'disorderly',
  horizon: '2050',
  // Real CMIP6 climate-projection lookup (Open-Meteo) — optional real-scenario
  // input alongside the NGFS-amplified engine pricing above, not a replacement.
  assetLat: 10.03,
  assetLng: 105.78,
  includeClimateProjection: true,
  // PCAF — EUR
  pcafAssetClass: 'business_loans',
  sectorGics: 'Industrials',
  outstandingEur: 45_000_000,
  totalEquityEur: 180_000_000,
  totalDebtEur: 120_000_000,
  evicEur: 320_000_000,
  revenueEur: 210_000_000,
  scope1Tonnes: '',      // optional reported tCO2e — blank = engine sector fallback
  scope2Tonnes: '',
  verified: false,
  // Decision-summary assumptions (local, editable)
  costOfCapitalPct: 6,
  expenseLoadingPct: 15,
  eurUsd: 1.08,
};

const fmtUsd = (v) => (v == null || isNaN(v)) ? '—'
  : Math.abs(v) >= 1e9 ? `$${(v / 1e9).toFixed(2)}B`
  : Math.abs(v) >= 1e6 ? `$${(v / 1e6).toFixed(2)}M`
  : Math.abs(v) >= 1e3 ? `$${(v / 1e3).toFixed(1)}K` : `$${Number(v).toFixed(0)}`;
const fmtEur = (v) => (v == null || isNaN(v)) ? '—'
  : Math.abs(v) >= 1e9 ? `€${(v / 1e9).toFixed(2)}B`
  : Math.abs(v) >= 1e6 ? `€${(v / 1e6).toFixed(2)}M`
  : Math.abs(v) >= 1e3 ? `€${(v / 1e3).toFixed(1)}K` : `€${Number(v).toFixed(0)}`;
const fmtNum = (v, d = 1) => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });
const fmtPct = (v, d = 1) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}%`;

const Badge = ({ status, liveText, demoText }) => {
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live{liveText ? ` — ${liveText}` : ''}</span>;
  if (status === 'loading') return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Calling engine</span>;
  if (status === 'demo') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ Demo{demoText ? ` — ${demoText}` : ' — engine unavailable'}</span>;
  return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Idle — run assessment</span>;
};

const Kpi = ({ label, value, sub, color = T.navy }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Section = ({ title, tag, status, children, demoText }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>{title}</h2>
      <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>{tag}</span>
      <div style={{ marginLeft: 'auto' }}><Badge status={status} demoText={demoText} /></div>
    </div>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: T.sub, minWidth: 130, flex: 1 }}>
    <span style={{ fontWeight: 600 }}>{label}</span>
    {children}
  </label>
);

const inputStyle = {
  border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 8px',
  fontSize: 12, fontFamily: T.mono, color: T.navy, background: '#fff', width: '100%', boxSizing: 'border-box',
};

const TIER_COLOR = {
  low: T.green, moderate: T.teal, elevated: T.amber, high: T.amber,
  very_high: T.red, extreme: T.red,
};

export default function ClimateUnderwritingWorkbenchPage() {
  const [inp, setInp] = useState(DEFAULT_INPUTS);
  const set = (k) => (e) => {
    const raw = e && e.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setInp((p) => ({ ...p, [k]: raw }));
  };
  const num = (v, fb = 0) => { const n = parseFloat(v); return isNaN(n) ? fb : n; };

  // Per-engine call state: { status: idle|loading|live|demo, data, error }
  const [ins, setIns] = useState({ status: 'idle', data: null, error: null });
  const [phys, setPhys] = useState({ status: 'idle', data: null, error: null });
  const [rpl, setRpl] = useState({ status: 'idle', data: null, error: null });
  const [pcaf, setPcaf] = useState({ status: 'idle', data: null, error: null });
  const [climProj, setClimProj] = useState({ status: 'idle', data: null, error: null });

  const country = COUNTRIES.find((c) => c.iso3 === inp.countryIso3) || COUNTRIES[0];

  const runAll = useCallback(async () => {
    // 1) Solvency II insurance capital — POST /api/v1/insurance/calculate
    setIns({ status: 'loading', data: null, error: null });
    axios.post('/api/v1/insurance/calculate', {
      entity_name: inp.entityName,
      insurer_type: inp.insurerType,
      domicile_country: country.iso3,
      cat_peril: inp.catPeril,
      gross_written_premium_eur: num(inp.gwpEur),
      technical_provisions_eur: num(inp.tpEur),
      scr_eur: num(inp.scrEur),
      own_funds_eur: num(inp.ownFundsEur),
      gross_loss_1in100_baseline_eur: num(inp.gl100Eur),
      gross_loss_1in250_baseline_eur: num(inp.gl250Eur),
      average_annual_loss_baseline_eur: num(inp.aalEur),
      probable_max_loss_baseline_eur: num(inp.pmlEur),
      reinsurance_retention_pct: num(inp.riRetentionPct) / 100,
      reinsurance_limit_eur: num(inp.riLimitEur) || null,
      coal_exclusion: !!inp.coalExclusion,
      oil_sands_exclusion: !!inp.oilSandsExclusion,
      arctic_drilling_exclusion: !!inp.arcticExclusion,
      fossil_fuel_new_business_cap_pct: num(inp.ffCapPct, 100),
      total_economic_loss_baseline_eur: num(inp.totalEconLossEur) || null,
      scenario: inp.insScenario,
      horizon_year: num(inp.insHorizonYear, 2050),
      save_to_db: false,
    }, { timeout: 20000 })
      .then(({ data }) => setIns({ status: 'live', data, error: null }))
      .catch((e) => setIns({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }));

    // 2) Physical peril pricing — POST /price and /return-period-losses
    setPhys({ status: 'loading', data: null, error: null });
    setRpl({ status: 'loading', data: null, error: null });
    axios.post('/api/v1/physical-risk-pricing/price', {
      entity_id: inp.entityName,
      asset_class: inp.physAssetClass,
      country_iso: country.iso3,
      asset_value_usd: num(inp.assetValueUsd, 1),
      ngfs_scenario: inp.ngfsScenario,
      time_horizon: inp.horizon,
    }, { timeout: 20000 })
      .then(({ data }) => {
        if (data && data.error) setPhys({ status: 'demo', data: null, error: data.error });
        else setPhys({ status: 'live', data, error: null });
      })
      .catch((e) => setPhys({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }));
    axios.post('/api/v1/physical-risk-pricing/return-period-losses', {
      country_iso: country.iso3,
      asset_class: inp.physAssetClass,
      asset_value_usd: num(inp.assetValueUsd, 1),
    }, { timeout: 20000 })
      .then(({ data }) => {
        if (data && data.error) setRpl({ status: 'demo', data: null, error: data.error });
        else setRpl({ status: 'live', data, error: null });
      })
      .catch((e) => setRpl({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }));

    // 2b) Real CMIP6 climate projection (Open-Meteo) — optional real-scenario
    // input alongside the NGFS-amplified engine pricing above (does not replace it).
    if (inp.includeClimateProjection) {
      setClimProj({ status: 'loading', data: null, error: null });
      axios.get('/api/v1/open-meteo/climate-projection', {
        params: {
          lat: num(inp.assetLat, 0),
          lon: num(inp.assetLng, 0),
          scenario: inp.ngfsScenario,
          start_year: Math.max(2025, num(inp.horizon, 2050) - 20),
          end_year: num(inp.horizon, 2050),
        },
        timeout: 30000,
      })
        .then(({ data }) => setClimProj({ status: 'live', data, error: null }))
        .catch((e) => setClimProj({ status: 'demo', data: null, error: e?.response?.data?.error?.message || e?.response?.data?.detail || e.message }));
    } else {
      setClimProj({ status: 'idle', data: null, error: null });
    }

    // 3) PCAF financed emissions — POST /api/v1/pcaf-module/calculate/{asset_class}
    setPcaf({ status: 'loading', data: null, error: null });
    axios.post(`/api/v1/pcaf-module/calculate/${inp.pcafAssetClass}`, {
      holding: {
        asset_class: inp.pcafAssetClass,
        entity_name: inp.entityName,
        sector_gics: inp.sectorGics,
        country_iso: country.iso2,
        outstanding_amount_eur: num(inp.outstandingEur),
        enterprise_value_eur: num(inp.evicEur),
        total_equity_eur: num(inp.totalEquityEur),
        total_debt_eur: num(inp.totalDebtEur),
        annual_revenue_eur: num(inp.revenueEur),
        scope1_co2e_tonnes: inp.scope1Tonnes === '' ? null : num(inp.scope1Tonnes),
        scope2_co2e_tonnes: inp.scope2Tonnes === '' ? null : num(inp.scope2Tonnes),
        verification_status: inp.verified ? 'verified' : 'none',
      },
    }, { timeout: 20000 })
      .then(({ data }) => setPcaf({ status: 'live', data, error: null }))
      .catch((e) => setPcaf({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }));
  }, [inp, country]);

  // Peril breakdown chart data (from live /price response)
  const perilChart = useMemo(() => {
    if (!phys.data?.acute_peril_breakdown) return [];
    return Object.entries(phys.data.acute_peril_breakdown).map(([peril, d]) => ({
      peril, pml100: d.pml_100yr_usd, amplified: d.amplified_score, baseline: d.baseline_score,
    }));
  }, [phys.data]);

  // Return-period loss chart for the selected insurance peril's physical analogue
  const rplPeril = useMemo(() => {
    const map = { tropical_cyclone: 'cyclone', winter_storm: 'cyclone', hail: 'flood' };
    return map[inp.catPeril] || inp.catPeril;
  }, [inp.catPeril]);

  const rplChart = useMemo(() => {
    const tbl = rpl.data?.peril_loss_table?.[rplPeril]?.return_period_losses;
    if (!tbl) return [];
    return Object.entries(tbl).map(([rpLabel, d]) => ({
      rp: rpLabel, insured: d.insured_loss_usd, uninsured: d.uninsured_loss_usd,
    }));
  }, [rpl.data, rplPeril]);

  const chronicRadar = useMemo(() => {
    if (!phys.data?.chronic_stressor_breakdown) return [];
    return Object.entries(phys.data.chronic_stressor_breakdown).map(([k, d]) => ({
      stressor: k.replace(/_/g, ' '), baseline: +(d.baseline_score * 100).toFixed(1), amplified: +(d.amplified_score * 100).toFixed(1),
    }));
  }, [phys.data]);

  // ── Combined underwriting decision summary (derived from live outputs only) ──
  const summary = useMemo(() => {
    if (ins.status !== 'live' || phys.status !== 'live' || pcaf.status !== 'live') return null;
    const fx = num(inp.eurUsd, 1.08);
    const coc = num(inp.costOfCapitalPct, 6) / 100;
    const loading = Math.min(0.6, Math.max(0, num(inp.expenseLoadingPct, 15) / 100));

    const ealUsd = phys.data.expected_annual_loss_usd || 0;
    const scrAddonUsd = (ins.data.scr_climate_addon_eur || 0) * fx;
    const capitalCostUsd = scrAddonUsd * coc;
    const purePremiumUsd = ealUsd + capitalCostUsd;
    const suggestedPremiumUsd = loading < 1 ? purePremiumUsd / (1 - loading) : purePremiumUsd;
    const gwpUsd = num(inp.gwpEur) * fx;
    const premiumAdequacy = suggestedPremiumUsd > 0 ? gwpUsd / suggestedPremiumUsd : null;

    const outstandingM = num(inp.outstandingEur) / 1e6;
    const feIntensity = outstandingM > 0 ? (pcaf.data.financed_total_tco2e || 0) / outstandingM : null;

    const solvencyPost = ins.data.solvency_ratio_post_addon;
    const tier = phys.data.risk_tier;
    const flags = [];
    if (solvencyPost != null && solvencyPost < 1.0) flags.push('Solvency ratio post climate add-on below 100% — capital breach under Solvency II.');
    if (premiumAdequacy != null && premiumAdequacy < 1.0) flags.push(`Charged premium covers only ${(premiumAdequacy * 100).toFixed(0)}% of risk-adjusted premium requirement.`);
    if (['very_high', 'extreme'].includes(tier)) flags.push(`Physical risk tier "${tier}" under ${inp.ngfsScenario} / ${inp.horizon}.`);
    if (ins.data.reserve_adequacy && ins.data.reserve_adequacy !== 'adequate') flags.push(`Reserve adequacy: ${ins.data.reserve_adequacy} (deficiency ${fmtEur(ins.data.reserve_deficiency_eur)}).`);
    if (ins.data.reinsurance_adequate === false) flags.push(`Reinsurance programme inadequate — gap ${fmtEur(ins.data.reinsurance_gap_eur)}.`);
    if (feIntensity != null && feIntensity > 500) flags.push(`Financed emissions intensity ${fmtNum(feIntensity, 0)} tCO2e/€M exceeds 500 — transition-risk referral threshold.`);

    let decision = 'ACCEPT';
    if ((solvencyPost != null && solvencyPost < 1.0) ||
        (premiumAdequacy != null && premiumAdequacy < 0.6 && ['very_high', 'extreme'].includes(tier))) decision = 'DECLINE';
    else if (flags.length > 0) decision = 'REFER';

    return {
      ealUsd, scrAddonUsd, capitalCostUsd, purePremiumUsd, suggestedPremiumUsd,
      gwpUsd, premiumAdequacy, feIntensity, solvencyPost, tier, flags, decision,
    };
  }, [ins, phys, pcaf, inp]);

  const decisionColor = summary?.decision === 'ACCEPT' ? T.green : summary?.decision === 'REFER' ? T.amber : T.red;
  const anyDemo = [ins, phys, pcaf].some((s) => s.status === 'demo');
  const summaryStatus = summary ? 'live' : (anyDemo ? 'demo' : (ins.status === 'idle' ? 'idle' : 'loading'));

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.navy, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>UW-1</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Climate Underwriting Workbench</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.teal + '22', color: T.teal, border: `1px solid ${T.teal}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Solvency II CAT/SCR</span>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>NGFS Physical Pricing</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>PCAF v2.0 Part A</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 16, maxWidth: 1000 }}>
        One counterparty/asset → three live engines in a single underwriting view: Solvency II climate CAT capital
        (EIOPA ORSA 2022), NGFS-amplified physical peril pricing (E104), and PCAF financed emissions attribution.
        Risk-adjusted premium suggestion = physical EAL + cost of climate capital, grossed for expenses.
      </div>

      {/* ── Input panel ─────────────────────────────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Submission — Counterparty / Asset Inputs</h2>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Editable defaults — hand-authored illustrative submission, not live data</span>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <Field label="Counterparty / Asset name"><input style={inputStyle} value={inp.entityName} onChange={set('entityName')} /></Field>
          <Field label="Country">
            <select style={inputStyle} value={inp.countryIso3} onChange={set('countryIso3')}>
              {COUNTRIES.map((c) => <option key={c.iso3} value={c.iso3}>{c.name} ({c.iso3})</option>)}
            </select>
          </Field>
          <Field label="CAT peril (Solvency II)">
            <select style={inputStyle} value={inp.catPeril} onChange={set('catPeril')}>
              {INSURANCE_PERILS.map((p) => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
            </select>
          </Field>
          <Field label="Physical asset class">
            <select style={inputStyle} value={inp.physAssetClass} onChange={set('physAssetClass')}>
              {PHYS_ASSET_CLASSES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Sums insured / asset value (USD)"><input type="number" style={inputStyle} value={inp.assetValueUsd} onChange={set('assetValueUsd')} /></Field>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <Field label="GWP (EUR)"><input type="number" style={inputStyle} value={inp.gwpEur} onChange={set('gwpEur')} /></Field>
          <Field label="Technical provisions (EUR)"><input type="number" style={inputStyle} value={inp.tpEur} onChange={set('tpEur')} /></Field>
          <Field label="SCR (EUR)"><input type="number" style={inputStyle} value={inp.scrEur} onChange={set('scrEur')} /></Field>
          <Field label="Own funds (EUR)"><input type="number" style={inputStyle} value={inp.ownFundsEur} onChange={set('ownFundsEur')} /></Field>
          <Field label="Gross loss 1-in-100 baseline (EUR)"><input type="number" style={inputStyle} value={inp.gl100Eur} onChange={set('gl100Eur')} /></Field>
          <Field label="Gross loss 1-in-250 baseline (EUR)"><input type="number" style={inputStyle} value={inp.gl250Eur} onChange={set('gl250Eur')} /></Field>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <Field label="AAL baseline (EUR)"><input type="number" style={inputStyle} value={inp.aalEur} onChange={set('aalEur')} /></Field>
          <Field label="PML baseline (EUR)"><input type="number" style={inputStyle} value={inp.pmlEur} onChange={set('pmlEur')} /></Field>
          <Field label="Total economic loss baseline (EUR)"><input type="number" style={inputStyle} value={inp.totalEconLossEur} onChange={set('totalEconLossEur')} /></Field>
          <Field label="Reinsurance retention (%)"><input type="number" style={inputStyle} value={inp.riRetentionPct} onChange={set('riRetentionPct')} /></Field>
          <Field label="Reinsurance limit (EUR)"><input type="number" style={inputStyle} value={inp.riLimitEur} onChange={set('riLimitEur')} /></Field>
          <Field label="Climate scenario (insurance)">
            <select style={inputStyle} value={inp.insScenario} onChange={set('insScenario')}>
              {INSURANCE_SCENARIOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <Field label="NGFS scenario (physical pricing)">
            <select style={inputStyle} value={inp.ngfsScenario} onChange={set('ngfsScenario')}>
              {NGFS_SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Horizon">
            <select style={inputStyle} value={inp.horizon} onChange={set('horizon')}>
              {HORIZONS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </Field>
          <Field label="Asset lat (real CMIP6 lookup)"><input type="number" step="0.01" style={inputStyle} value={inp.assetLat} onChange={set('assetLat')} /></Field>
          <Field label="Asset lon (real CMIP6 lookup)"><input type="number" step="0.01" style={inputStyle} value={inp.assetLng} onChange={set('assetLng')} /></Field>
          <label style={{ display: 'flex', alignItems: 'flex-end', gap: 6, fontSize: 11, color: T.sub, fontWeight: 600, paddingBottom: 6 }}>
            <input type="checkbox" checked={!!inp.includeClimateProjection} onChange={set('includeClimateProjection')} /> Include real CMIP6 climate projection (Open-Meteo)
          </label>
          <Field label="PCAF asset class">
            <select style={inputStyle} value={inp.pcafAssetClass} onChange={set('pcafAssetClass')}>
              {PCAF_ASSET_CLASSES.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
            </select>
          </Field>
          <Field label="GICS sector">
            <select style={inputStyle} value={inp.sectorGics} onChange={set('sectorGics')}>
              {GICS_SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Outstanding exposure (EUR)"><input type="number" style={inputStyle} value={inp.outstandingEur} onChange={set('outstandingEur')} /></Field>
          <Field label="EVIC (EUR)"><input type="number" style={inputStyle} value={inp.evicEur} onChange={set('evicEur')} /></Field>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <Field label="Total equity (EUR)"><input type="number" style={inputStyle} value={inp.totalEquityEur} onChange={set('totalEquityEur')} /></Field>
          <Field label="Total debt (EUR)"><input type="number" style={inputStyle} value={inp.totalDebtEur} onChange={set('totalDebtEur')} /></Field>
          <Field label="Annual revenue (EUR)"><input type="number" style={inputStyle} value={inp.revenueEur} onChange={set('revenueEur')} /></Field>
          <Field label="Reported Scope 1 (tCO2e, optional)"><input type="number" style={inputStyle} value={inp.scope1Tonnes} onChange={set('scope1Tonnes')} placeholder="blank = sector fallback" /></Field>
          <Field label="Reported Scope 2 (tCO2e, optional)"><input type="number" style={inputStyle} value={inp.scope2Tonnes} onChange={set('scope2Tonnes')} placeholder="blank = sector fallback" /></Field>
          <label style={{ display: 'flex', alignItems: 'flex-end', gap: 6, fontSize: 11, color: T.sub, fontWeight: 600, paddingBottom: 6 }}>
            <input type="checkbox" checked={!!inp.verified} onChange={set('verified')} /> Emissions verified (ISAE 3410)
          </label>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.sub, fontWeight: 600 }}>
            <input type="checkbox" checked={!!inp.coalExclusion} onChange={set('coalExclusion')} /> Coal exclusion
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.sub, fontWeight: 600 }}>
            <input type="checkbox" checked={!!inp.oilSandsExclusion} onChange={set('oilSandsExclusion')} /> Oil sands exclusion
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.sub, fontWeight: 600 }}>
            <input type="checkbox" checked={!!inp.arcticExclusion} onChange={set('arcticExclusion')} /> Arctic drilling exclusion
          </label>
          <button onClick={runAll} style={{
            marginLeft: 'auto', background: T.navy, color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 26px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
          }}>
            Run underwriting assessment →
          </button>
        </div>
      </div>

      {/* ── 1) Insurance capital ────────────────────────────────────────── */}
      <Section title="1 · Insurance Capital — Solvency II Climate CAT / SCR / TP"
        tag="POST /api/v1/insurance/calculate" status={ins.status} demoText={ins.error}>
        {ins.status === 'live' && ins.data && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <Kpi label="Gross 1-in-100 (climate-adj)" value={fmtEur(ins.data.gross_loss_1in100_eur)} sub={`Net ${fmtEur(ins.data.net_loss_1in100_eur)}`} />
              <Kpi label="Gross 1-in-250 (climate-adj)" value={fmtEur(ins.data.gross_loss_1in250_eur)} sub={`Net ${fmtEur(ins.data.net_loss_1in250_eur)}`} />
              <Kpi label="CAT loss change" value={fmtPct(ins.data.cat_loss_change_pct)} sub={`${ins.data.scenario} @ ${ins.data.horizon_year}`} color={T.amber} />
              <Kpi label="SCR climate add-on" value={fmtEur(ins.data.scr_climate_addon_eur)} sub={`Total SCR ${fmtEur(ins.data.total_scr_eur)}`} color={T.red} />
              <Kpi label="Solvency ratio post add-on" value={fmtPct(ins.data.solvency_ratio_post_addon * 100, 0)}
                sub={`Pre: ${fmtPct(ins.data.solvency_ratio_pre_addon * 100, 0)}`}
                color={ins.data.solvency_ratio_post_addon >= 1 ? T.green : T.red} />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Kpi label="TP climate uplift" value={fmtPct(ins.data.tp_uplift_pct)} sub={`Adj TP ${fmtEur(ins.data.climate_adjusted_tp_eur)}`} />
              <Kpi label="Reserve adequacy" value={ins.data.reserve_adequacy}
                sub={ins.data.reserve_deficiency_eur > 0 ? `Deficiency ${fmtEur(ins.data.reserve_deficiency_eur)}` : 'No deficiency'}
                color={ins.data.reserve_adequacy === 'adequate' ? T.green : T.amber} />
              <Kpi label="Protection gap" value={fmtPct(ins.data.protection_gap_pct)} sub={fmtEur(ins.data.protection_gap_eur)} />
              <Kpi label="ESG underwriting score" value={fmtNum(ins.data.esg_underwriting_score, 0)} sub="Exclusion policies" color={T.teal} />
              <Kpi label="Reinsurance" value={ins.data.reinsurance_adequate ? 'Adequate' : 'Inadequate'}
                sub={ins.data.reinsurance_gap_eur > 0 ? `Gap ${fmtEur(ins.data.reinsurance_gap_eur)}` : 'Within limit'}
                color={ins.data.reinsurance_adequate ? T.green : T.red} />
            </div>
            {ins.data.warnings?.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 11, color: T.amber }}>⚠ {ins.data.warnings.join(' · ')}</div>
            )}
            <div style={{ marginTop: 8, fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>{ins.data.methodology_ref}</div>
          </>
        )}
        {ins.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Insurance climate risk engine unreachable — no figures shown (this workbench never fabricates results). Error: {String(ins.error)}</div>}
        {ins.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Run the assessment to compute Solvency II climate-adjusted CAT losses, TP uplift and SCR add-on.</div>}
      </Section>

      {/* ── 2) Physical peril pricing ───────────────────────────────────── */}
      <Section title="2 · Physical Peril Pricing — NGFS-Amplified EAL / PML / Climate VaR"
        tag="POST /api/v1/physical-risk-pricing/price · /return-period-losses" status={phys.status} demoText={phys.error}>
        {phys.status === 'live' && phys.data && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="Composite risk score" value={fmtNum(phys.data.composite_physical_risk_score, 3)}
                sub={`Baseline ${fmtNum(phys.data.baseline_composite_score, 3)}`} />
              <Kpi label="Risk tier" value={phys.data.risk_tier} color={TIER_COLOR[phys.data.risk_tier] || T.navy} />
              <Kpi label="Expected annual loss" value={fmtUsd(phys.data.expected_annual_loss_usd)} color={T.amber} />
              <Kpi label="PML 100yr" value={fmtUsd(phys.data.pml_100yr_usd)} />
              <Kpi label="Climate VaR 95%" value={fmtUsd(phys.data.climate_var_95pct_usd)} sub={`${fmtPct(phys.data.climate_var_pct_asset_value)} of asset value`} color={T.red} />
              <Kpi label="Risk premium" value={`${fmtNum(phys.data.risk_premium_bps, 0)} bps`} sub={`Insured ratio ${fmtNum(phys.data.avg_insured_ratio, 2)}`} color={T.indigo} />
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 340 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>PML 100yr by acute peril (USD)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={perilChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="peril" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtUsd(v)} width={70} />
                    <Tooltip formatter={(v) => fmtUsd(v)} />
                    <Bar dataKey="pml100" name="PML 100yr" radius={[3, 3, 0, 0]}>
                      {perilChart.map((d, i) => <Cell key={i} fill={[T.blue, T.teal, T.amber, T.purple, T.red][i % 5]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1.4, minWidth: 300 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Chronic stressors — baseline vs {inp.ngfsScenario} {inp.horizon} (score ×100)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={chronicRadar}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="stressor" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis tick={{ fontSize: 9 }} />
                    <Radar name="Baseline" dataKey="baseline" stroke={T.teal} fill={T.teal} fillOpacity={0.25} />
                    <Radar name="Amplified" dataKey="amplified" stroke={T.red} fill={T.red} fillOpacity={0.2} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {rpl.status === 'live' && rplChart.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                  Return-period loss curve — {rplPeril} (insured vs uninsured, USD) <Badge status="live" />
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={rplChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="rp" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtUsd(v)} width={70} />
                    <Tooltip formatter={(v) => fmtUsd(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="insured" stackId="a" name="Insured" fill={T.teal} />
                    <Bar dataKey="uninsured" stackId="a" name="Uninsured (protection gap)" fill={T.red} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {rpl.status === 'demo' && <div style={{ marginTop: 10, fontSize: 11, color: T.amber }}>Return-period loss table unavailable: {String(rpl.error)}</div>}
            <div style={{ marginTop: 8, fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
              {phys.data.methodology?.eal_method} · Sources: {(phys.data.methodology?.sources || []).join(', ')}
            </div>
          </>
        )}
        {phys.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Physical risk pricing engine unreachable — no figures shown. Error: {String(phys.error)}</div>}
        {phys.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Run the assessment to price acute + chronic physical risk under the selected NGFS scenario.</div>}

        {/* 2b — Real CMIP6 climate projection (Open-Meteo), optional real-scenario
            input alongside the NGFS-amplified engine pricing above. Independent data
            source; does not replace or feed the engine's NGFS-scenario methodology. */}
        {inp.includeClimateProjection && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px dashed ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: T.navy }}>Real CMIP6 Climate Projection — optional, alongside NGFS pricing</h3>
              <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/open-meteo/climate-projection</span>
              <div style={{ marginLeft: 'auto' }}><Badge status={climProj.status === 'live' ? 'live' : climProj.status === 'loading' ? 'loading' : climProj.status === 'demo' ? 'demo' : undefined} demoText={climProj.error} /></div>
            </div>
            {climProj.status === 'live' && climProj.data && (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                  <Kpi label="Ensemble mean daily max temp" value={climProj.data.ensemble?.mean_daily_max_temperature_c ? `${climProj.data.ensemble.mean_daily_max_temperature_c.mean.toFixed(1)}°C` : '—'}
                    sub={`range ${climProj.data.ensemble?.mean_daily_max_temperature_c?.min ?? '—'}–${climProj.data.ensemble?.mean_daily_max_temperature_c?.max ?? '—'}°C across ${climProj.data.models?.length ?? 0} models`} color={T.red} />
                  <Kpi label="Ensemble mean annual precip" value={climProj.data.ensemble?.mean_annual_precipitation_mm ? `${fmtNum(climProj.data.ensemble.mean_annual_precipitation_mm.mean, 0)} mm` : '—'}
                    sub={`range ${fmtNum(climProj.data.ensemble?.mean_annual_precipitation_mm?.min, 0)}–${fmtNum(climProj.data.ensemble?.mean_annual_precipitation_mm?.max, 0)} mm`} color={T.blue} />
                  <Kpi label="Ensemble max daily wind" value={climProj.data.ensemble?.max_daily_wind_speed_kmh ? `${fmtNum(climProj.data.ensemble.max_daily_wind_speed_kmh.mean, 0)} km/h` : '—'} color={T.teal} />
                  <Kpi label="Window / models" value={`${climProj.data.window?.start_date?.slice(0, 4)}–${climProj.data.window?.end_date?.slice(0, 4)}`} sub={(climProj.data.models || []).join(', ')} />
                </div>
                <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, lineHeight: 1.5 }}>
                  {climProj.data.source} · coverage {climProj.data.coverage} · {climProj.data.mode_label}<br />
                  {climProj.data.upstream_scenario_note}
                </div>
              </>
            )}
            {climProj.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Climate projection unavailable — physical peril pricing above is unaffected. Error: {String(climProj.error)}</div>}
            {climProj.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Run the assessment to fetch a real CMIP6-downscaled climate projection for the asset's coordinates (Open-Meteo), as a real-scenario complement to the NGFS-amplified pricing above.</div>}
          </div>
        )}
      </Section>

      {/* ── 3) Financed emissions ───────────────────────────────────────── */}
      <Section title="3 · Financed Emissions — PCAF v2.0 Attribution"
        tag={`POST /api/v1/pcaf-module/calculate/${inp.pcafAssetClass}`} status={pcaf.status} demoText={pcaf.error}>
        {pcaf.status === 'live' && pcaf.data && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <Kpi label="Attribution factor" value={fmtNum(pcaf.data.attribution_factor, 4)} sub={pcaf.data.asset_class} />
              <Kpi label="Financed Scope 1" value={`${fmtNum(pcaf.data.financed_scope1_tco2e, 1)} tCO2e`} />
              <Kpi label="Financed Scope 2" value={`${fmtNum(pcaf.data.financed_scope2_tco2e, 1)} tCO2e`} />
              {pcaf.data.financed_scope3_tco2e != null && <Kpi label="Financed Scope 3" value={`${fmtNum(pcaf.data.financed_scope3_tco2e, 1)} tCO2e`} />}
              <Kpi label="Financed total" value={`${fmtNum(pcaf.data.financed_total_tco2e, 1)} tCO2e`} color={T.purple} />
              <Kpi label="PCAF DQS" value={pcaf.data.pcaf_dqs} sub={pcaf.data.emission_source || ''} color={pcaf.data.pcaf_dqs <= 2 ? T.green : pcaf.data.pcaf_dqs <= 3 ? T.amber : T.red} />
              <Kpi label="Intensity" value={`${fmtNum((pcaf.data.financed_total_tco2e || 0) / Math.max(0.001, num(inp.outstandingEur) / 1e6), 1)} tCO2e/€M`} sub="per €M outstanding" />
            </div>
            <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>{pcaf.data.methodology}</div>
          </>
        )}
        {pcaf.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>PCAF unified engine unreachable — no figures shown. Error: {String(pcaf.error)}</div>}
        {pcaf.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Run the assessment to attribute the counterparty's emissions to the financed exposure (PCAF Tables 5.1–5.3).</div>}
      </Section>

      {/* ── 4) Combined decision summary ────────────────────────────────── */}
      <Section title="4 · Underwriting Decision Summary"
        tag="Derived locally from live engine outputs — no fabricated data" status={summaryStatus}
        demoText="requires all three engines live">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <Field label="Cost of capital (%)"><input type="number" style={inputStyle} value={inp.costOfCapitalPct} onChange={set('costOfCapitalPct')} /></Field>
          <Field label="Expense + profit loading (%)"><input type="number" style={inputStyle} value={inp.expenseLoadingPct} onChange={set('expenseLoadingPct')} /></Field>
          <Field label="EUR/USD FX (for EUR capital → USD)"><input type="number" step="0.01" style={inputStyle} value={inp.eurUsd} onChange={set('eurUsd')} /></Field>
          <div style={{ flex: 2 }} />
        </div>
        {summary ? (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="Physical EAL" value={fmtUsd(summary.ealUsd)} sub="From engine 2 (live)" />
              <Kpi label="Cost of climate capital" value={fmtUsd(summary.capitalCostUsd)}
                sub={`SCR add-on ${fmtUsd(summary.scrAddonUsd)} × ${fmtNum(num(inp.costOfCapitalPct), 1)}%`} />
              <Kpi label="Pure risk premium" value={fmtUsd(summary.purePremiumUsd)} sub="EAL + capital cost" />
              <Kpi label="Risk-adjusted premium suggestion" value={fmtUsd(summary.suggestedPremiumUsd)}
                sub={`Grossed for ${fmtNum(num(inp.expenseLoadingPct), 0)}% loading`} color={T.indigo} />
              <Kpi label="Premium adequacy (GWP ÷ suggested)" value={summary.premiumAdequacy != null ? `${(summary.premiumAdequacy * 100).toFixed(0)}%` : '—'}
                color={summary.premiumAdequacy >= 1 ? T.green : T.red} />
              <Kpi label="Financed intensity" value={summary.feIntensity != null ? `${fmtNum(summary.feIntensity, 0)} tCO2e/€M` : '—'} sub="From engine 3 (live)" />
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{
                background: decisionColor + '15', border: `2px solid ${decisionColor}`, borderRadius: 10,
                padding: '18px 30px', textAlign: 'center', minWidth: 180,
              }}>
                <div style={{ fontSize: 11, color: T.sub, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recommendation</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: decisionColor, fontFamily: T.mono }}>{summary.decision}</div>
                <div style={{ fontSize: 10.5, color: T.sub, marginTop: 4 }}>Heuristic — subject to underwriter judgement</div>
              </div>
              <div style={{ flex: 1, minWidth: 300 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Referral flags ({summary.flags.length})</div>
                {summary.flags.length === 0 && <div style={{ fontSize: 12, color: T.green }}>No referral flags — solvency, premium adequacy, physical tier, reserves, reinsurance and carbon intensity all within thresholds.</div>}
                {summary.flags.map((f, i) => (
                  <div key={i} style={{ fontSize: 12, color: T.slate, padding: '5px 0', borderBottom: `1px dashed ${T.border}` }}>⚑ {f}</div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: T.sub }}>
            The combined summary renders only when all three engines return live results
            {anyDemo ? ' — one or more engines are currently unavailable (see section badges above).' : '. Run the assessment above.'}
          </div>
        )}
      </Section>

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, marginTop: 4 }}>
        Engines: services/insurance_climate_risk.py (Solvency II Art. 44a / EIOPA ORSA 2022 / Swiss Re sigma) ·
        services/physical_risk_pricing_engine.py (NGFS CGFI 2023, INFORM 2023, ND-GAIN 2023) ·
        services/pcaf_unified_engine.py (PCAF Global GHG Standard v2.0, Tables 5.1–5.3).
        FX conversion and decision heuristic are local presentation-layer assumptions (editable above).
      </div>
    </div>
  );
}
