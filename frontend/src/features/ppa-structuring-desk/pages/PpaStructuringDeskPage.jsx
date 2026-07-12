import React, { useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// PPA Structuring Desk (NX2-01)
// Structure & value a single-asset PPA term sheet: pay-as-produced vs baseload
// vs solar-shaped, contract vs merchant-tail split, capture/cannibalization
// discount, REC/GoO + ancillary stacking, counterparty bankability.
// Live engines:
//   1. POST /api/v1/renewable-ppa/solar-yield | /wind-yield   (P50/P90 CFs)
//   2. POST /api/v1/ppa-structuring/shape-analysis            (96-pt shape engine:
//      capture rate as OUTPUT, negative-price hours, 24/7 CFE, avoided CO2,
//      carbon-adjusted effective price, EU Taxonomy screen)
//      GET  /api/v1/ppa-structuring/ref/rec-forward           (REC vintage strip)
//   3. POST /api/v1/ppa-structuring/structure                 (period-by-period valuation)
//      GET  /api/v1/ppa-structuring/ref/capture-rates         (documented tier defaults)
//   4. POST /api/v1/ppa-structuring/settlement                (two-way CfD / vPPA cash
//      settlement, negative-price clause, collar, hub-node basis)
//   5. POST /api/v1/ppa-structuring/credit-exposure           (CSA threshold/IA/MTA vs
//      2-sigma potential-exposure profile + downgrade triggers)
//   6. POST /api/v1/ppa-structuring/term-sheet-score          (weighted deal score +
//      NPV sensitivity, +/-10% on 6 drivers)
//   7. POST /api/v1/renewable-ppa/ppa-risk                    (5-dimension bankability)
// All figures come from live engine responses or user inputs — nothing is
// fabricated client-side. Portfolio-level PPA analytics live at
// /ppa-revenue-analytics (this desk is single-contract structuring).
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

// Mirrors backend/services/renewable_project_engine.py constants (keys must match)
const TURBINE_CLASSES = [
  { id: 'onshore_2mw', label: 'Onshore 2 MW' }, { id: 'onshore_4mw', label: 'Onshore 4 MW' },
  { id: 'offshore_5mw', label: 'Offshore 5 MW' }, { id: 'offshore_8mw', label: 'Offshore 8 MW' },
  { id: 'offshore_12mw', label: 'Offshore 12 MW' },
];
const WIND_REGIONS = [
  { id: 'north_sea', label: 'North Sea Offshore' }, { id: 'baltic_sea', label: 'Baltic Sea Offshore' },
  { id: 'uk_offshore', label: 'UK Offshore' }, { id: 'atlantic_france', label: 'Atlantic France' },
  { id: 'northern_europe_onshore', label: 'N. Europe Onshore' }, { id: 'central_europe_onshore', label: 'C. Europe Onshore' },
  { id: 'iberia_onshore', label: 'Iberia Onshore' }, { id: 'scandinavia_onshore', label: 'Scandinavia Onshore' },
  { id: 'mediterranean', label: 'Mediterranean' }, { id: 'us_midwest', label: 'US Midwest' },
  { id: 'us_texas', label: 'US Texas' }, { id: 'india_tamil_nadu', label: 'India Tamil Nadu' },
  { id: 'brazil_northeast', label: 'Brazil NE' }, { id: 'south_africa', label: 'South Africa' },
  { id: 'australia_nsw', label: 'Australia NSW' },
];
const SOLAR_COUNTRIES = ['DE', 'FR', 'ES', 'IT', 'PT', 'NL', 'GB', 'SE', 'PL', 'GR', 'US', 'IN', 'AU', 'BR', 'ZA', 'AE', 'SA', 'JP', 'CN', 'MX'];

const STRUCTURES = [
  { id: 'pay_as_produced', label: 'Pay-as-produced' },
  { id: 'baseload', label: 'Baseload (firm block)' },
  { id: 'solar_shaped', label: 'Solar-shaped profile' },
];
// Mirrors backend/services/ppa_risk_scorer.py CREDIT_SCORES / risk level keys
const CREDIT_RATINGS = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'unrated_ig', 'unrated_sub_ig', 'unrated', 'sovereign', 'utility'];
const RISK_LEVELS_4 = ['low', 'moderate', 'high', 'very_high'];
const REG_LEVELS = ['stable', 'moderate', 'high', 'very_high'];

const STREAM_COLORS = { PPA: T.navy, Merchant: T.indigo, REC: T.green, Ancillary: T.gold };
const SEASON_COLORS = { Winter: '#0369a1', Spring: '#15803d', Summer: '#c5a96a', Autumn: '#b45309' };
const LOAD_SHAPES = [
  { id: 'flat', label: 'Flat 24/7 (data-center / electrolyzer)' },
  { id: 'daytime_commercial', label: 'Daytime commercial (07–19)' },
  { id: 'evening_residential', label: 'Evening residential (18–22 peak)' },
];

const fmtNum = (v, d = 1) => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });
const fmtPct = (v, d = 1) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}%`;
const fmtM = (v, d = 1) => (v == null || isNaN(v)) ? '—' : `$${fmtNum(v / 1e6, d)}M`;
const num = (v, fb = 0) => { const x = parseFloat(v); return isNaN(x) ? fb : x; };

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

const Field = ({ label, children, w = 150 }) => (
  <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 4, width: w }}>
    {label}
    {children}
  </label>
);

const panel = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 };
const panelHead = { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' };
const h2 = { margin: 0, fontSize: 15, fontWeight: 800, color: T.navy };
const endpointTag = { fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' };
const editableTag = { background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 };

export default function PpaStructuringDeskPage() {
  // ── Panel 1: generation ────────────────────────────────────────────────
  const [technology, setTechnology] = useState('solar');
  const [capacityMw, setCapacityMw] = useState('100');
  const [p50Cf, setP50Cf] = useState('24.0');
  const [p90Cf, setP90Cf] = useState('21.5');
  const [degradation, setDegradation] = useState('0.4');
  const [solarCountry, setSolarCountry] = useState('ES');
  const [turbineClass, setTurbineClass] = useState('onshore_4mw');
  const [windRegion, setWindRegion] = useState('northern_europe_onshore');
  const [numTurbines, setNumTurbines] = useState('25');
  const [yieldState, setYieldState] = useState({ status: 'idle', meta: null, error: null });
  // Optional: real NASA POWER resource data for a lat/lon, in place of the
  // engine's hand-authored country/region default tables (additive -- the
  // country/region path above is unchanged and used whenever this is off).
  const [useNasaPower, setUseNasaPower] = useState(false);
  const [nasaLat, setNasaLat] = useState('51.5074');
  const [nasaLon, setNasaLon] = useState('-0.1278');

  // ── Panel 2: term sheet + merchant + stacking ──────────────────────────
  const [structure, setStructure] = useState('pay_as_produced');
  const [ppaPrice, setPpaPrice] = useState('45');
  const [tenor, setTenor] = useState('15');
  const [contractedPct, setContractedPct] = useState('80');
  const [escalation, setEscalation] = useState('1.5');
  const [forward, setForward] = useState('42');
  const [captureRate, setCaptureRate] = useState(''); // '' → engine tier default
  const [penetration, setPenetration] = useState('12');
  const [tailYears, setTailYears] = useState('10');
  const [recPrice, setRecPrice] = useState('3');
  const [recVolPct, setRecVolPct] = useState('100');
  const [ancillary, setAncillary] = useState('1500');
  const [discountRate, setDiscountRate] = useState('7');
  const [firmingPremium, setFirmingPremium] = useState('2');

  // ── Panel 3/4 state ────────────────────────────────────────────────────
  const [res, setRes] = useState({ status: 'idle', data: null, error: null });
  const [caseSel, setCaseSel] = useState('p50');
  const [offtakerName, setOfftakerName] = useState('Contoso Energy Trading BV');
  const [creditRating, setCreditRating] = useState('BBB');
  const [curtailment, setCurtailment] = useState('moderate');
  const [regulatory, setRegulatory] = useState('stable');
  const [risk, setRisk] = useState({ status: 'idle', data: null, error: null });

  // ── Fetch P50/P90 CFs from the platform yield engines ──────────────────
  const fetchYield = useCallback(async () => {
    setYieldState({ status: 'loading', meta: null, error: null });
    const geo = useNasaPower && nasaLat !== '' && nasaLon !== '' && !isNaN(parseFloat(nasaLat)) && !isNaN(parseFloat(nasaLon))
      ? { lat: parseFloat(nasaLat), lon: parseFloat(nasaLon) } : {};
    try {
      if (technology === 'wind') {
        const { data } = await axios.post('/api/v1/renewable-ppa/wind-yield', {
          turbine_class: turbineClass, region: windRegion,
          num_turbines: Math.max(1, Math.round(num(numTurbines, 10))),
          wake_loss_pct: 8.0, availability_pct: 97.0,
          ...geo,
        }, { timeout: 20000 });
        const cf = data.capacity_factor_pct;
        const ratio = data.p50_generation_mwh > 0 ? data.p90_generation_mwh / data.p50_generation_mwh : 1;
        const fromNasa = String(data.resource_source || '').startsWith('nasa_power');
        setCapacityMw(String(data.total_capacity_mw));
        setP50Cf(cf.toFixed(2));
        setP90Cf((cf * ratio).toFixed(2));
        setDegradation('0.0');
        setYieldState({
          status: 'live', error: null,
          meta: fromNasa
            ? `NASA POWER real resource @ (${nasaLat}, ${nasaLon}) · mean wind ${fmtNum(data.mean_wind_speed_ms, 2)} m/s (Weibull k=${data.weibull_k}, λ=${data.weibull_lambda}) · CF ${cf.toFixed(1)}% · P90/P50 ${(ratio * 100).toFixed(1)}%`
            : `${data.turbine_name} × ${data.num_turbines} @ ${data.region} · CF ${cf.toFixed(1)}% · P90/P50 ${(ratio * 100).toFixed(1)}%`,
        });
      } else {
        const { data } = await axios.post('/api/v1/renewable-ppa/solar-yield', {
          country: solarCountry, capacity_kwp: num(capacityMw, 100) * 1000,
          performance_ratio: 0, degradation_pct_yr: 0, // 0 → engine defaults
          ...geo,
        }, { timeout: 20000 });
        const cf = data.capacity_factor_pct;
        const ratio = data.p50_generation_mwh_yr1 > 0 ? data.p90_generation_mwh_yr1 / data.p50_generation_mwh_yr1 : 1;
        const fromNasa = String(data.resource_source || '').startsWith('nasa_power');
        setP50Cf(cf.toFixed(2));
        setP90Cf((cf * ratio).toFixed(2));
        setYieldState({
          status: 'live', error: null,
          meta: fromNasa
            ? `NASA POWER real GHI @ (${nasaLat}, ${nasaLon}): ${fmtNum(data.ghi_kwh_m2_yr, 0)} kWh/m²·yr · PR ${data.performance_ratio} · CF ${cf.toFixed(1)}% · P90/P50 ${(ratio * 100).toFixed(1)}%`
            : `${data.country_label} GHI ${fmtNum(data.ghi_kwh_m2_yr, 0)} kWh/m²·yr · PR ${data.performance_ratio} · CF ${cf.toFixed(1)}% · P90/P50 ${(ratio * 100).toFixed(1)}%`,
        });
      }
    } catch (e) {
      setYieldState({ status: 'demo', meta: null, error: e?.response?.data?.detail || e.message });
    }
  }, [technology, turbineClass, windRegion, numTurbines, solarCountry, capacityMw, useNasaPower, nasaLat, nasaLon]);

  // ── Structure & value ───────────────────────────────────────────────────
  const runStructure = useCallback(async () => {
    setRes({ status: 'loading', data: null, error: null });
    try {
      const payload = {
        technology, capacity_mw: num(capacityMw, 100),
        p50_capacity_factor_pct: num(p50Cf, 24), p90_capacity_factor_pct: num(p90Cf, 21.5),
        degradation_pct_yr: num(degradation, 0),
        structure, ppa_price_usd_mwh: num(ppaPrice, 45),
        ppa_tenor_years: Math.max(1, Math.round(num(tenor, 15))),
        contracted_volume_pct: num(contractedPct, 80), escalation_pct_yr: num(escalation, 0),
        merchant_forward_usd_mwh: num(forward, 42),
        vre_penetration_pct: num(penetration, 12),
        merchant_tail_years: Math.max(0, Math.round(num(tailYears, 10))),
        rec_price_usd_mwh: num(recPrice, 0), rec_volume_pct: num(recVolPct, 100),
        ancillary_usd_mw_yr: num(ancillary, 0),
        discount_rate_pct: num(discountRate, 7), firming_premium_usd_mwh: num(firmingPremium, 2),
      };
      if (captureRate !== '' && !isNaN(parseFloat(captureRate))) payload.capture_rate_pct = parseFloat(captureRate);
      const { data } = await axios.post('/api/v1/ppa-structuring/structure', payload, { timeout: 20000 });
      setRes({ status: 'live', data, error: null });
    } catch (e) {
      setRes({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message });
    }
  }, [technology, capacityMw, p50Cf, p90Cf, degradation, structure, ppaPrice, tenor, contractedPct,
    escalation, forward, captureRate, penetration, tailYears, recPrice, recVolPct, ancillary, discountRate, firmingPremium]);

  // ── Bankability (ppa-risk engine) ───────────────────────────────────────
  const runRisk = useCallback(async () => {
    setRisk({ status: 'loading', data: null, error: null });
    try {
      const cv = num(contractedPct, 80);
      const { data } = await axios.post('/api/v1/renewable-ppa/ppa-risk', {
        ppa_id: 'DESK-1', project_name: `${technology === 'wind' ? 'Wind' : 'Solar'} ${num(capacityMw, 0)} MW`,
        offtaker_name: offtakerName || 'Unnamed offtaker',
        offtaker_credit_rating: creditRating,
        price_structure: num(escalation, 0) > 0 ? 'fixed_escalation' : 'fixed',
        ppa_price_eur_mwh: num(ppaPrice, 45),
        tenor_years: num(tenor, 15),
        curtailment_risk: curtailment, regulatory_risk: regulatory,
        volume_hedged_pct: cv, merchant_exposure_pct: Math.max(0, 100 - cv),
        subsidy_dependence_pct: 0,
      }, { timeout: 20000 });
      setRisk({ status: 'live', data, error: null });
    } catch (e) {
      setRisk({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message });
    }
  }, [technology, capacityMw, offtakerName, creditRating, escalation, ppaPrice, tenor, curtailment, regulatory, contractedPct]);

  // ── Panel 2: hourly shape engine + sustainability overlay ─────────────
  const [shape, setShape] = useState({ status: 'idle', data: null, error: null });
  const [negShare, setNegShare] = useState('5');
  const [negLevel, setNegLevel] = useState('-10');
  const [loadShape, setLoadShape] = useState('flat');
  const [annualLoad, setAnnualLoad] = useState(''); // '' → engine sets = annual net gen
  const [gridEf, setGridEf] = useState('0.35');
  const [shadowPrice, setShadowPrice] = useState('85');
  const [lifecycle, setLifecycle] = useState(''); // '' → IPCC/NREL median by tech
  const [recSpot, setRecSpot] = useState('3');
  const [recDrift, setRecDrift] = useState('3');
  const [recStrip, setRecStrip] = useState(null);

  const runShape = useCallback(async () => {
    setShape({ status: 'loading', data: null, error: null });
    try {
      const payload = {
        technology, capacity_mw: num(capacityMw, 100), capacity_factor_pct: num(p50Cf, 24),
        merchant_forward_usd_mwh: num(forward, 42),
        negative_hour_share_pct: num(negShare, 0), negative_price_level_usd_mwh: Math.min(0, num(negLevel, -10)),
        strike_usd_mwh: num(ppaPrice, 45),
        load_shape: loadShape,
        grid_intensity_tco2_mwh: num(gridEf, 0.35), carbon_shadow_price_usd_t: num(shadowPrice, 85),
        rec_price_usd_mwh: num(recPrice, 3), ppa_price_usd_mwh: num(ppaPrice, 45),
      };
      if (annualLoad !== '' && !isNaN(parseFloat(annualLoad))) payload.annual_load_mwh = parseFloat(annualLoad);
      if (lifecycle !== '' && !isNaN(parseFloat(lifecycle))) payload.lifecycle_intensity_g_kwh = parseFloat(lifecycle);
      const [{ data }, rec] = await Promise.all([
        axios.post('/api/v1/ppa-structuring/shape-analysis', payload, { timeout: 20000 }),
        axios.get(`/api/v1/ppa-structuring/ref/rec-forward?spot_usd_mwh=${num(recSpot, 3)}&drift_pct_yr=${num(recDrift, 3)}&vintages=6`, { timeout: 15000 }).catch(() => null),
      ]);
      setShape({ status: 'live', data, error: null });
      setRecStrip(rec ? rec.data : null);
    } catch (e) {
      setShape({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message });
    }
  }, [technology, capacityMw, p50Cf, forward, negShare, negLevel, ppaPrice, loadShape, annualLoad, gridEf, shadowPrice, lifecycle, recPrice, recSpot, recDrift]);

  const shapeGenChart = useMemo(() => {
    if (!shape.data) return [];
    const g = shape.data.shapes.generation_mw;
    return Array.from({ length: 24 }, (_, h) => ({
      hour: h, Winter: g.winter[h], Spring: g.spring[h], Summer: g.summer[h], Autumn: g.autumn[h],
      Load: shape.data.shapes.load_mw ? shape.data.shapes.load_mw.summer[h] : undefined,
    }));
  }, [shape.data]);
  const shapePriceChart = useMemo(() => {
    if (!shape.data) return [];
    const p = shape.data.shapes.price_usd_mwh;
    return Array.from({ length: 24 }, (_, h) => ({
      hour: h, Winter: p.winter[h], Spring: p.spring[h], Summer: p.summer[h], Autumn: p.autumn[h],
    }));
  }, [shape.data]);

  // ── Panel 5: CfD / vPPA settlement ─────────────────────────────────────
  const [strike, setStrike] = useState('50');
  const [settleVol, setSettleVol] = useState(''); // '' → auto from shape × contracted %
  const [settleTenor, setSettleTenor] = useState('10');
  const [negClause, setNegClause] = useState(false);
  const [floorP, setFloorP] = useState('');
  const [capP, setCapP] = useState('');
  const [basis, setBasis] = useState('-1.5');
  const [basisVol, setBasisVol] = useState('2');
  const [settle, setSettle] = useState({ status: 'idle', data: null, error: null });

  const autoSettleVol = useMemo(() => {
    const cv = num(contractedPct, 80) / 100;
    if (shape.status === 'live' && shape.data) return Math.round(shape.data.capture.annual_generation_mwh * cv);
    return Math.round(num(capacityMw, 100) * 8760 * (num(p50Cf, 24) / 100) * cv);
  }, [shape, capacityMw, p50Cf, contractedPct]);

  const runSettlement = useCallback(async () => {
    setSettle({ status: 'loading', data: null, error: null });
    try {
      const payload = {
        strike_usd_mwh: num(strike, 50), strike_escalation_pct_yr: num(escalation, 0),
        tenor_years: Math.max(1, Math.round(num(settleTenor, 10))),
        annual_volume_mwh: settleVol !== '' && !isNaN(parseFloat(settleVol)) ? parseFloat(settleVol) : autoSettleVol,
        merchant_forward_usd_mwh: num(forward, 42),
        negative_price_clause: negClause,
        basis_usd_mwh: num(basis, 0), basis_vol_usd_mwh: num(basisVol, 2),
        discount_rate_pct: num(discountRate, 7),
      };
      if (floorP !== '' && !isNaN(parseFloat(floorP))) payload.floor_usd_mwh = parseFloat(floorP);
      if (capP !== '' && !isNaN(parseFloat(capP))) payload.cap_usd_mwh = parseFloat(capP);
      if (shape.status === 'live' && shape.data) {
        payload.price_shape_usd_mwh = shape.data.shapes.price_usd_mwh_96;
        payload.gen_shape_mw = shape.data.shapes.generation_mw_96;
      }
      const { data } = await axios.post('/api/v1/ppa-structuring/settlement', payload, { timeout: 20000 });
      setSettle({ status: 'live', data, error: null });
    } catch (e) {
      setSettle({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message });
    }
  }, [strike, escalation, settleTenor, settleVol, autoSettleVol, forward, negClause, basis, basisVol, discountRate, floorP, capP, shape]);

  const settleChart = useMemo(() => settle.data
    ? settle.data.per_year.map((y) => ({ year: y.year, 'Settlement ($M)': y.settlement_usd / 1e6 }))
    : [], [settle.data]);

  // ── Panel 6: credit & collateral (CSA) ─────────────────────────────────
  const [csaThreshold, setCsaThreshold] = useState('5');   // $M
  const [csaIa, setCsaIa] = useState('0');                 // $M
  const [csaMta, setCsaMta] = useState('0.25');            // $M
  const [priceSigma, setPriceSigma] = useState('8');       // $/MWh-yr
  const [credit, setCredit] = useState({ status: 'idle', data: null, error: null });

  const runCredit = useCallback(async () => {
    setCredit({ status: 'loading', data: null, error: null });
    try {
      const { data } = await axios.post('/api/v1/ppa-structuring/credit-exposure', {
        annual_volume_mwh: settleVol !== '' && !isNaN(parseFloat(settleVol)) ? parseFloat(settleVol) : autoSettleVol,
        tenor_years: Math.max(1, Math.round(num(settleTenor, 10))),
        price_sigma_usd_mwh_yr: num(priceSigma, 8),
        threshold_usd: num(csaThreshold, 5) * 1e6,
        independent_amount_usd: num(csaIa, 0) * 1e6,
        mta_usd: num(csaMta, 0.25) * 1e6,
        counterparty_rating: ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC'].includes(creditRating) ? creditRating : 'BBB',
      }, { timeout: 20000 });
      setCredit({ status: 'live', data, error: null });
    } catch (e) {
      setCredit({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message });
    }
  }, [settleVol, autoSettleVol, settleTenor, priceSigma, csaThreshold, csaIa, csaMta, creditRating]);

  const creditChart = useMemo(() => credit.data
    ? credit.data.exposure_profile.map((y) => ({
      year: y.year, 'Potential exposure ($M)': y.potential_exposure_usd / 1e6, 'Collateral call ($M)': y.collateral_call_usd / 1e6,
    }))
    : [], [credit.data]);

  // ── Panel 7: term-sheet score + sensitivity ────────────────────────────
  const [recsBundled, setRecsBundled] = useState(true);
  const [score, setScore] = useState({ status: 'idle', data: null, error: null });

  const buildStructurePayload = useCallback(() => {
    const payload = {
      technology, capacity_mw: num(capacityMw, 100),
      p50_capacity_factor_pct: num(p50Cf, 24), p90_capacity_factor_pct: num(p90Cf, 21.5),
      degradation_pct_yr: num(degradation, 0),
      structure, ppa_price_usd_mwh: num(ppaPrice, 45),
      ppa_tenor_years: Math.max(1, Math.round(num(tenor, 15))),
      contracted_volume_pct: num(contractedPct, 80), escalation_pct_yr: num(escalation, 0),
      merchant_forward_usd_mwh: num(forward, 42),
      vre_penetration_pct: num(penetration, 12),
      merchant_tail_years: Math.max(0, Math.round(num(tailYears, 10))),
      rec_price_usd_mwh: num(recPrice, 0), rec_volume_pct: num(recVolPct, 100),
      ancillary_usd_mw_yr: num(ancillary, 0),
      discount_rate_pct: num(discountRate, 7), firming_premium_usd_mwh: num(firmingPremium, 2),
    };
    if (captureRate !== '' && !isNaN(parseFloat(captureRate))) payload.capture_rate_pct = parseFloat(captureRate);
    return payload;
  }, [technology, capacityMw, p50Cf, p90Cf, degradation, structure, ppaPrice, tenor, contractedPct,
    escalation, forward, captureRate, penetration, tailYears, recPrice, recVolPct, ancillary, discountRate, firmingPremium]);

  const runScore = useCallback(async () => {
    setScore({ status: 'loading', data: null, error: null });
    try {
      const { data } = await axios.post('/api/v1/ppa-structuring/term-sheet-score', {
        structure_request: buildStructurePayload(),
        counterparty_rating: creditRating,
        cfe_score_pct: shape.status === 'live' && shape.data ? shape.data.sustainability.cfe.cfe_score_pct : 0,
        taxonomy_pass: shape.status === 'live' && shape.data ? shape.data.sustainability.eu_taxonomy_screen.pass : true,
        recs_bundled: recsBundled,
        has_collar: floorP !== '' || capP !== '',
        negative_price_clause: negClause,
      }, { timeout: 25000 });
      setScore({ status: 'live', data, error: null });
    } catch (e) {
      setScore({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message });
    }
  }, [buildStructurePayload, creditRating, shape, recsBundled, floorP, capP, negClause]);

  // ── Derived chart/table data (display-level transforms of live response) ─
  const activeCase = res.data ? res.data[caseSel] : null;
  const chartData = useMemo(() => {
    if (!activeCase) return [];
    return activeCase.periods.map((p) => ({
      year: p.year,
      PPA: p.ppa_revenue_usd / 1e6,
      Merchant: p.merchant_revenue_usd / 1e6,
      REC: p.rec_revenue_usd / 1e6,
      Ancillary: p.ancillary_revenue_usd / 1e6,
      'Firming cost': p.firming_cost_usd / 1e6,
    }));
  }, [activeCase]);
  const hasFirming = useMemo(() => activeCase && activeCase.periods.some((p) => p.firming_cost_usd > 0), [activeCase]);
  const splitPie = useMemo(() => {
    if (!activeCase) return [];
    const vs = activeCase.value_split;
    return [
      { name: 'PPA', value: vs.contracted_share_pct },
      { name: 'Merchant', value: vs.merchant_share_pct },
      { name: 'REC', value: vs.rec_share_pct },
      { name: 'Ancillary', value: vs.ancillary_share_pct },
    ].filter((d) => d.value > 0);
  }, [activeCase]);

  const riskColor = (lvl) => (lvl === 'low' ? T.green : lvl === 'moderate' ? T.teal : lvl === 'elevated' || lvl === 'high' ? T.amber : T.red);

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.teal, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>NX2-01</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>PPA Structuring Desk</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Renewable Yield Engine</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>PPA Structuring Engine</span>
          <span style={{ background: T.gold + '33', color: T.amber, border: `1px solid ${T.gold}66`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>PPA Risk Scorer</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 16, maxWidth: 1050 }}>
        Structure a single-asset PPA term sheet and value it period-by-period: pay-as-produced vs baseload vs
        solar-shaped delivery, contract vs merchant-tail split, capture-rate (cannibalization) discounting of the
        merchant strip, REC/GoO and ancillary stacking, and a firming-cost estimate for baseload blocks. P50 and P90
        generation cases run in parallel. The 96-point hourly shape engine derives the capture rate as an <b>output</b>,
        prices negative-price clauses and 24/7 CFE matching, and overlays avoided-carbon economics; CfD settlement,
        CSA credit exposure and a weighted term-sheet score complete the desk. Portfolio-level PPA analytics live at
        <b> /ppa-revenue-analytics</b> — this desk is single-contract structuring.
      </div>

      {/* ── Panel 1: Generation inputs ──────────────────────────────────── */}
      <div style={panel}>
        <div style={panelHead}>
          <h2 style={h2}>1 · Generation Case (P50 / P90)</h2>
          <span style={endpointTag}>POST /api/v1/renewable-ppa/{technology === 'wind' ? 'wind' : 'solar'}-yield</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <Badge status={yieldState.status} demoText={yieldState.error} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Field label="Technology" w={130}>
            <select style={inputStyle} value={technology} onChange={(e) => { setTechnology(e.target.value); setDegradation(e.target.value === 'wind' ? '0.0' : '0.4'); }}>
              <option value="solar">Solar PV</option>
              <option value="wind">Wind</option>
            </select>
          </Field>
          <Field label="Capacity (MW)" w={110}>
            <input type="number" min="1" style={inputStyle} value={capacityMw} onChange={(e) => setCapacityMw(e.target.value)} />
          </Field>
          <Field label="P50 net CF (%)" w={110}>
            <input type="number" min="1" max="80" step="0.1" style={inputStyle} value={p50Cf} onChange={(e) => setP50Cf(e.target.value)} />
          </Field>
          <Field label="P90 net CF (%)" w={110}>
            <input type="number" min="1" max="80" step="0.1" style={inputStyle} value={p90Cf} onChange={(e) => setP90Cf(e.target.value)} />
          </Field>
          <Field label="Degradation (%/yr)" w={120}>
            <input type="number" min="0" max="5" step="0.1" style={inputStyle} value={degradation} onChange={(e) => setDegradation(e.target.value)} />
          </Field>
          <div style={{ borderLeft: `1px solid ${T.border}`, alignSelf: 'stretch' }} />
          {technology === 'solar' ? (
            <Field label="Engine: country (GHI)" w={150}>
              <select style={inputStyle} value={solarCountry} onChange={(e) => setSolarCountry(e.target.value)}>
                {SOLAR_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          ) : (
            <>
              <Field label="Engine: turbine class" w={140}>
                <select style={inputStyle} value={turbineClass} onChange={(e) => setTurbineClass(e.target.value)}>
                  {TURBINE_CLASSES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Engine: wind region" w={170}>
                <select style={inputStyle} value={windRegion} onChange={(e) => setWindRegion(e.target.value)}>
                  {WIND_REGIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </Field>
              <Field label="Turbines (#)" w={90}>
                <input type="number" min="1" max="500" style={inputStyle} value={numTurbines} onChange={(e) => setNumTurbines(e.target.value)} />
              </Field>
            </>
          )}
          <button onClick={fetchYield} style={{
            background: T.blue, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px',
            fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
          }}>
            Fetch P50/P90 from platform engine →
          </button>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${T.border}` }}>
          <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={useNasaPower} onChange={(e) => setUseNasaPower(e.target.checked)} />
            Use real NASA POWER resource data for a lat/lon
          </label>
          {useNasaPower && (
            <>
              <Field label="Latitude" w={110}>
                <input type="number" step="0.0001" min="-90" max="90" style={inputStyle} value={nasaLat} onChange={(e) => setNasaLat(e.target.value)} />
              </Field>
              <Field label="Longitude" w={110}>
                <input type="number" step="0.0001" min="-180" max="180" style={inputStyle} value={nasaLon} onChange={(e) => setNasaLon(e.target.value)} />
              </Field>
              <span style={{ fontSize: 10.5, color: T.sub, maxWidth: 420 }}>
                Overrides the {technology === 'solar' ? 'country GHI table' : 'region Weibull table'} above with NASA POWER's real
                satellite/reanalysis {technology === 'solar' ? 'GHI (ALLSKY_SFC_SW_DWN)' : 'wind speed (WS50M)'} for this exact point,
                averaged over the last full calendar year. Falls back to the {technology === 'solar' ? 'country' : 'region'} table if
                NASA POWER is unreachable.
              </span>
            </>
          )}
        </div>
        <div style={{ fontSize: 11, color: T.sub, marginTop: 10 }}>
          {yieldState.status === 'live' && yieldState.meta && <span style={{ fontFamily: T.mono }}>Engine result applied: {yieldState.meta}</span>}
          {yieldState.status === 'idle' && 'Enter P50/P90 net capacity factors manually, or fetch them from the platform wind/solar yield engine (Weibull / GHI-based P50-P75-P90 assessment). Wind fetch also sets capacity from turbine class × count.'}
          {yieldState.status === 'demo' && <span>Yield engine unreachable — manual CF entry still works. Error: {String(yieldState.error)}</span>}
        </div>
      </div>

      {/* ── Panel 2: Term sheet ─────────────────────────────────────────── */}
      <div style={panel}>
        <div style={panelHead}>
          <h2 style={h2}>2 · PPA Term Sheet · Merchant · Revenue Stacking</h2>
          <span style={editableTag}>Editable defaults — hand-authored illustrative terms, not market quotes</span>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={runStructure} style={{
              background: T.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
            }}>
              Structure &amp; value →
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Field label="Delivery structure" w={190}>
            <select style={inputStyle} value={structure} onChange={(e) => setStructure(e.target.value)}>
              {STRUCTURES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="PPA price ($/MWh)" w={120}>
            <input type="number" min="0" step="0.5" style={inputStyle} value={ppaPrice} onChange={(e) => setPpaPrice(e.target.value)} />
          </Field>
          <Field label="Tenor (yrs)" w={90}>
            <input type="number" min="1" max="35" style={inputStyle} value={tenor} onChange={(e) => setTenor(e.target.value)} />
          </Field>
          <Field label="Contracted volume (%)" w={140}>
            <input type="number" min="0" max="100" style={inputStyle} value={contractedPct} onChange={(e) => setContractedPct(e.target.value)} />
          </Field>
          <Field label="Escalation (%/yr)" w={110}>
            <input type="number" min="-5" max="10" step="0.1" style={inputStyle} value={escalation} onChange={(e) => setEscalation(e.target.value)} />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12 }}>
          <Field label="Merchant flat forward ($/MWh)" w={170}>
            <input type="number" min="0" step="0.5" style={inputStyle} value={forward} onChange={(e) => setForward(e.target.value)} />
          </Field>
          <Field label="Capture rate (%) — blank = tier default" w={210}>
            <input type="number" min="1" max="120" step="0.5" placeholder="engine default" style={inputStyle} value={captureRate} onChange={(e) => setCaptureRate(e.target.value)} />
          </Field>
          <Field label="Same-tech VRE penetration (%)" w={180}>
            <input type="number" min="0" max="100" step="0.5" style={inputStyle} value={penetration} onChange={(e) => setPenetration(e.target.value)} />
          </Field>
          <Field label="Merchant tail (yrs post-PPA)" w={160}>
            <input type="number" min="0" max="25" style={inputStyle} value={tailYears} onChange={(e) => setTailYears(e.target.value)} />
          </Field>
          <Field label="Discount rate (%)" w={110}>
            <input type="number" min="0" max="25" step="0.25" style={inputStyle} value={discountRate} onChange={(e) => setDiscountRate(e.target.value)} />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12 }}>
          <Field label="REC/GoO price ($/MWh)" w={140}>
            <input type="number" min="0" step="0.25" style={inputStyle} value={recPrice} onChange={(e) => setRecPrice(e.target.value)} />
          </Field>
          <Field label="REC volume (% of gen)" w={140}>
            <input type="number" min="0" max="100" style={inputStyle} value={recVolPct} onChange={(e) => setRecVolPct(e.target.value)} />
          </Field>
          <Field label="Ancillary ($/MW-yr)" w={130}>
            <input type="number" min="0" step="100" style={inputStyle} value={ancillary} onChange={(e) => setAncillary(e.target.value)} />
          </Field>
          {structure === 'baseload' && (
            <Field label="Firming premium ($/MWh)" w={150}>
              <input type="number" min="0" max="50" step="0.5" style={inputStyle} value={firmingPremium} onChange={(e) => setFirmingPremium(e.target.value)} />
            </Field>
          )}
        </div>
        <div style={{ fontSize: 11, color: T.sub, marginTop: 10 }}>
          Capture-rate tier defaults (solar 98→60%, wind 97→70% by penetration) are documented modeling defaults
          calibrated to Hirth (2013, Energy Economics) and Millstein et&nbsp;al. (2021, Joule/LBNL) — served with their
          basis by <span style={{ fontFamily: T.mono }}>GET /api/v1/ppa-structuring/ref/capture-rates</span>. Override with a market quote for live work.
        </div>
      </div>

      {/* ── Panel 3: Results ────────────────────────────────────────────── */}
      <div style={panel}>
        <div style={panelHead}>
          <h2 style={h2}>3 · Revenue Build — Period by Period</h2>
          <span style={endpointTag}>POST /api/v1/ppa-structuring/structure</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {res.status === 'live' && (
              <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                {['p50', 'p90'].map((c) => (
                  <button key={c} onClick={() => setCaseSel(c)} style={{
                    background: caseSel === c ? T.navy : '#fff', color: caseSel === c ? '#fff' : T.navy,
                    border: 'none', padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: T.mono,
                  }}>
                    {c.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
            <Badge status={res.status} demoText={res.error} />
          </div>
        </div>

        {res.status === 'live' && activeCase && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label={`Realized price (${caseSel.toUpperCase()})`} value={`$${fmtNum(activeCase.weighted_avg_realized_price_usd_mwh, 2)}/MWh`}
                sub="Net revenue ÷ lifetime generation" color={T.teal} />
              <Kpi label="Lifetime net revenue" value={fmtM(activeCase.totals.net_revenue_usd)} sub={`${activeCase.periods.length} years · nominal`} />
              <Kpi label={`NPV @ ${fmtNum(res.data.assumptions.discount_rate_pct, 1)}%`} value={fmtM(activeCase.npv_net_revenue_usd)} sub="Net revenue, discounted" color={T.indigo} />
              <Kpi label="Contracted share" value={fmtPct(activeCase.value_split.contracted_share_pct)}
                sub={`PV basis: ${fmtPct(activeCase.value_split.pv_contracted_share_pct)}`} color={T.navy} />
              <Kpi label="Merchant share" value={fmtPct(activeCase.value_split.merchant_share_pct)}
                sub={`Capture ${fmtNum(res.data.assumptions.capture_rate_pct, 0)}% → $${fmtNum(res.data.assumptions.capture_price_usd_mwh, 2)}/MWh`} color={T.purple} />
              {res.data.firming && (
                <Kpi label="Firming cost (lifetime)" value={fmtM(activeCase.totals.firming_cost_usd)}
                  sub={`Block ${fmtNum(res.data.firming.block_mwh_yr / 1000, 1)} GWh/yr · match ${res.data.firming.shape_match_factor}`} color={T.red} />
              )}
              <Kpi label="P90 vs P50 net revenue" value={fmtPct(res.data.p90_vs_p50_net_revenue_pct)} sub="Downside case retention" color={T.amber} />
            </div>

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 14 }}>
              <div style={{ flex: 2.4, minWidth: 420 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                  Revenue by stream over project life, {caseSel.toUpperCase()} case ($M/yr){hasFirming ? ' · firming cost as line' : ''}
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: 'Project year', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} label={{ value: '$M', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [`$${fmtNum(v, 2)}M`, n]} labelFormatter={(l) => `Year ${l}`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="PPA" stackId="rev" fill={STREAM_COLORS.PPA} />
                    <Bar dataKey="Merchant" stackId="rev" fill={STREAM_COLORS.Merchant} />
                    <Bar dataKey="REC" stackId="rev" fill={STREAM_COLORS.REC} />
                    <Bar dataKey="Ancillary" stackId="rev" fill={STREAM_COLORS.Ancillary} />
                    {hasFirming && <Line dataKey="Firming cost" stroke={T.red} strokeWidth={2} dot={false} />}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Value split by stream (% of gross revenue)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={splitPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                      label={(d) => `${d.name} ${d.value.toFixed(0)}%`}>
                      {splitPie.map((d, i) => <Cell key={i} fill={STREAM_COLORS[d.name] || T.slate} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtPct(v)} />
                  </PieChart>
                </ResponsiveContainer>
                {res.data.firming && (
                  <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, background: T.cream, borderRadius: 6, padding: '8px 10px', marginTop: 4 }}>
                    Firming formula: {res.data.firming.formula}
                  </div>
                )}
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Inspectable period table — {caseSel.toUpperCase()} case</div>
            <div style={{ maxHeight: 300, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Yr</th><th style={th}>Phase</th><th style={th}>Gen (MWh)</th><th style={th}>PPA MWh</th>
                    <th style={th}>PPA $/MWh</th><th style={th}>PPA rev</th><th style={th}>Merch MWh</th><th style={th}>Capture $/MWh</th>
                    <th style={th}>Merch rev</th><th style={th}>REC rev</th><th style={th}>Ancillary</th><th style={th}>Firming</th><th style={th}>Net rev</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCase.periods.map((p) => (
                    <tr key={p.year} style={{ background: p.in_ppa_tenor ? 'transparent' : T.cream }}>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{p.year}</td>
                      <td style={td}>{p.in_ppa_tenor
                        ? <span style={{ color: T.navy, fontWeight: 600 }}>PPA</span>
                        : <span style={{ color: T.purple, fontWeight: 600 }}>Merchant tail</span>}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(p.generation_mwh, 0)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(p.ppa_mwh, 0)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(p.ppa_price_usd_mwh, 2)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtM(p.ppa_revenue_usd, 2)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(p.merchant_mwh, 0)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(p.capture_price_usd_mwh, 2)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtM(p.merchant_revenue_usd, 2)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtM(p.rec_revenue_usd, 2)}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtM(p.ancillary_revenue_usd, 2)}</td>
                      <td style={{ ...td, fontFamily: T.mono, color: p.firming_cost_usd > 0 ? T.red : T.slate }}>{p.firming_cost_usd > 0 ? `(${fmtM(p.firming_cost_usd, 2)})` : '—'}</td>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: T.navy }}>{fmtM(p.net_revenue_usd, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 8, fontFamily: T.mono }}>
              Assumptions echoed by engine: capture {fmtNum(res.data.assumptions.capture_rate_pct, 1)}% ({res.data.assumptions.capture_rate_source})
              · degradation {fmtNum(res.data.assumptions.degradation_pct_yr, 2)}%/yr ({res.data.assumptions.degradation_source})
              · merchant forward held flat (stated model assumption) · shape match {res.data.assumptions.shape_match_factor}
            </div>
          </>
        )}
        {res.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Structuring engine unreachable — no figures shown (this page never fabricates results). Error: {String(res.error)}</div>}
        {res.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Set the generation case and term sheet above, then run <b>Structure &amp; value</b>. The engine returns full annual arrays for both P50 and P90.</div>}
      </div>

      {/* ── Panel 4: Hourly shape engine + sustainability overlay ───────── */}
      <div style={panel}>
        <div style={panelHead}>
          <h2 style={h2}>4 · Hourly Shape Engine — Capture Rate as OUTPUT · 24/7 CFE · Carbon Overlay</h2>
          <span style={endpointTag}>POST /api/v1/ppa-structuring/shape-analysis</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={runShape} style={{
              background: T.indigo, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px',
              fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
            }}>
              Run shape engine →
            </button>
            <Badge status={shape.status} demoText={shape.error} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 6 }}>
          <Field label="Negative-price hours (% of yr)" w={170}>
            <input type="number" min="0" max="40" step="0.5" style={inputStyle} value={negShare} onChange={(e) => setNegShare(e.target.value)} />
          </Field>
          <Field label="Negative price level ($/MWh)" w={170}>
            <input type="number" max="0" step="1" style={inputStyle} value={negLevel} onChange={(e) => setNegLevel(e.target.value)} />
          </Field>
          <Field label="Offtaker load shape (24/7 CFE)" w={230}>
            <select style={inputStyle} value={loadShape} onChange={(e) => setLoadShape(e.target.value)}>
              {LOAD_SHAPES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </Field>
          <Field label="Annual load (MWh) — blank = gen" w={190}>
            <input type="number" min="0" placeholder="= annual generation" style={inputStyle} value={annualLoad} onChange={(e) => setAnnualLoad(e.target.value)} />
          </Field>
          <Field label="Grid marginal EF (tCO₂e/MWh)" w={170}>
            <input type="number" min="0" max="2" step="0.01" style={inputStyle} value={gridEf} onChange={(e) => setGridEf(e.target.value)} />
          </Field>
          <Field label="Shadow carbon ($/t)" w={130}>
            <input type="number" min="0" step="5" style={inputStyle} value={shadowPrice} onChange={(e) => setShadowPrice(e.target.value)} />
          </Field>
          <Field label="Lifecycle gCO₂e/kWh — blank = IPCC median" w={230}>
            <input type="number" min="0" placeholder={technology === 'wind' ? '12 (IPCC/NREL median)' : '41 (IPCC/NREL median)'} style={inputStyle} value={lifecycle} onChange={(e) => setLifecycle(e.target.value)} />
          </Field>
          <Field label="REC spot ($/MWh)" w={120}>
            <input type="number" min="0" step="0.25" style={inputStyle} value={recSpot} onChange={(e) => setRecSpot(e.target.value)} />
          </Field>
          <Field label="REC drift (%/yr)" w={110}>
            <input type="number" min="-20" max="30" step="0.5" style={inputStyle} value={recDrift} onChange={(e) => setRecDrift(e.target.value)} />
          </Field>
        </div>
        <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>
          Builds 24h × 4-season (96-point) generation and price shapes from documented parametric archetypes
          (<span style={{ fontFamily: T.mono }}>GET /ref/shape-archetypes</span> discloses every constant) and computes the
          capture rate <b>from the shapes</b> — Σ(gen·price)/(Σgen · avg price) — instead of taking it as an input.
          Negative-price hours convert the lowest-priced points deterministically. Uses the Panel 1/2 technology,
          capacity, P50 CF, forward and PPA price.
        </div>

        {shape.status === 'live' && shape.data && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="Capture rate (OUTPUT)" value={fmtPct(shape.data.capture.capture_rate_pct, 2)}
                sub={`Capture $${fmtNum(shape.data.capture.capture_price_usd_mwh, 2)} vs avg $${fmtNum(shape.data.capture.time_weighted_avg_price_usd_mwh, 2)}/MWh`} color={T.indigo} />
              <Kpi label="Shape decomposition" value={`${fmtNum(shape.data.capture.decomposition.seasonal_component, 3)} × ${fmtNum(shape.data.capture.decomposition.diurnal_component, 3)}`}
                sub="Seasonal × diurnal components (identity)" color={T.slate} />
              <Kpi label="Neg-price clause value" value={fmtM(shape.data.negative_price.clause_value_usd_yr, 2)}
                sub={`${fmtNum(shape.data.negative_price.negative_hours_per_year, 0)} h/yr · $${fmtNum(shape.data.negative_price.clause_value_usd_mwh_of_total_gen, 2)}/MWh of gen`} color={T.red} />
              <Kpi label="24/7 CFE score" value={fmtPct(shape.data.sustainability.cfe.cfe_score_pct)}
                sub={`${fmtNum(shape.data.sustainability.cfe.hourly_matched_mwh, 0)} MWh hourly-matched`} color={T.teal} />
              <Kpi label="Avoided emissions" value={`${fmtNum(shape.data.sustainability.emissions.avoided_tco2e_yr, 0)} tCO₂e/yr`}
                sub={`Matched MWh × ${gridEf} t/MWh grid EF · $${fmtNum(shape.data.sustainability.emissions.avoided_carbon_value_usd_yr / 1e3, 0)}k @ shadow`} color={T.green} />
              <Kpi label="Carbon-adj. effective price" value={`$${fmtNum(shape.data.sustainability.carbon_adjusted_price.effective_ppa_usd_mwh, 2)}/MWh`}
                sub={`Headline − REC $${fmtNum(shape.data.sustainability.carbon_adjusted_price.less_rec_usd_mwh, 2)} − carbon $${fmtNum(shape.data.sustainability.carbon_adjusted_price.less_avoided_carbon_usd_mwh, 2)}`} color={T.purple} />
              <Kpi label="EU Taxonomy 100g screen" value={shape.data.sustainability.eu_taxonomy_screen.pass ? 'PASS' : 'FAIL'}
                sub={`${fmtNum(shape.data.sustainability.eu_taxonomy_screen.lifecycle_intensity_g_co2e_kwh, 0)} vs 100 gCO₂e/kWh`}
                color={shape.data.sustainability.eu_taxonomy_screen.pass ? T.green : T.red} />
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
              <button onClick={() => setCaptureRate(String(shape.data.capture.capture_rate_pct))} style={{
                background: '#fff', color: T.indigo, border: `1.5px solid ${T.indigo}`, borderRadius: 8,
                padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
              }}>
                Apply {fmtPct(shape.data.capture.capture_rate_pct, 2)} as the Panel 2 capture-rate override →
              </button>
              <span style={{ fontSize: 11, color: T.sub }}>
                Capture rate then flows into <b>Structure &amp; value</b> as the merchant discount (input path kept as override).
              </span>
            </div>

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 14 }}>
              <div style={{ flex: 1, minWidth: 340 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                  Generation shape by season (MW, 24h archetype){shape.data.shapes.load_mw ? ' · summer load dotted' : ''}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={shapeGenChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} label={{ value: 'Hour', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} label={{ value: 'MW', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [`${fmtNum(v, 1)} MW`, n]} labelFormatter={(l) => `Hour ${l}:00`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {['Winter', 'Spring', 'Summer', 'Autumn'].map((s) => (
                      <Line key={s} dataKey={s} stroke={SEASON_COLORS[s]} strokeWidth={2} dot={false} />
                    ))}
                    <Line dataKey="Load" stroke={T.slate} strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 340 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>
                  Price shape by season ($/MWh — mean anchored to the ${forward} forward{num(negShare, 0) > 0 ? `, lowest ${negShare}% of hours at $${negLevel}` : ''})
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={shapePriceChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} label={{ value: 'Hour', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} label={{ value: '$/MWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [`$${fmtNum(v, 2)}/MWh`, n]} labelFormatter={(l) => `Hour ${l}:00`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {['Winter', 'Spring', 'Summer', 'Autumn'].map((s) => (
                      <Line key={s} dataKey={s} stroke={SEASON_COLORS[s]} strokeWidth={2} dot={false} />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.2, minWidth: 320 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Seasonal capture table (engine output)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>Season</th><th style={th}>Gen (MWh)</th><th style={th}>Avg $/MWh</th>
                      <th style={th}>Capture $/MWh</th><th style={th}>Capture rate</th><th style={th}>CFE %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shape.data.capture.seasonal_table.map((s, i) => (
                      <tr key={s.season}>
                        <td style={{ ...td, fontWeight: 600, color: T.navy, textTransform: 'capitalize' }}>{s.season}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(s.generation_mwh, 0)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(s.avg_price_usd_mwh, 2)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(s.capture_price_usd_mwh, 2)}</td>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: s.capture_rate != null && s.capture_rate < 1 ? T.amber : T.green }}>{s.capture_rate != null ? fmtNum(s.capture_rate, 4) : '—'}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{shape.data.sustainability.cfe.seasonal[i] ? fmtPct(shape.data.sustainability.cfe.seasonal[i].cfe_pct) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, marginTop: 6 }}>
                  {shape.data.capture.decomposition.note}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>REC/GoO vintage-forward strip (labeled compounding convention)</div>
                {recStrip ? (
                  <>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr><th style={th}>Vintage</th><th style={th}>Forward ($/MWh)</th><th style={th}>× annual gen</th></tr>
                      </thead>
                      <tbody>
                        {recStrip.strip.map((v) => (
                          <tr key={v.vintage_label}>
                            <td style={{ ...td, fontFamily: T.mono, fontWeight: 600 }}>{v.vintage_label}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(v.forward_usd_mwh, 3)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtM(v.forward_usd_mwh * shape.data.capture.annual_generation_mwh, 2)}/yr</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, marginTop: 6 }}>{recStrip.formula} — {recStrip.label}</div>
                  </>
                ) : <div style={{ fontSize: 12, color: T.sub }}>REC forward endpoint unreachable — strip omitted.</div>}
              </div>
            </div>
            <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, background: T.cream, borderRadius: 6, padding: '8px 10px', marginTop: 10 }}>
              {shape.data.label} · Negative-price clause convention: {shape.data.negative_price.convention} ·
              CFE method: {shape.data.sustainability.cfe.method} · Carbon-adjusted price: {shape.data.sustainability.carbon_adjusted_price.label}
            </div>
          </>
        )}
        {shape.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Shape engine unreachable — no shape analytics shown (nothing is fabricated client-side). Error: {String(shape.error)}</div>}
        {shape.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Run the shape engine to derive the capture rate from 96-point generation/price archetypes, quantify a negative-price clause, and score 24/7 CFE + carbon overlay against the load shape.</div>}
      </div>

      {/* ── Panel 5: CfD / vPPA settlement ──────────────────────────────── */}
      <div style={panel}>
        <div style={panelHead}>
          <h2 style={h2}>5 · Virtual PPA / Two-Way CfD Settlement</h2>
          <span style={endpointTag}>POST /api/v1/ppa-structuring/settlement</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={runSettlement} style={{
              background: T.navy, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px',
              fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
            }}>
              Settle CfD →
            </button>
            <Badge status={settle.status} demoText={settle.error} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 6 }}>
          <Field label="CfD strike ($/MWh)" w={120}>
            <input type="number" min="0" step="0.5" style={inputStyle} value={strike} onChange={(e) => setStrike(e.target.value)} />
          </Field>
          <Field label={`Volume (MWh/yr) — blank = ${fmtNum(autoSettleVol, 0)}`} w={210}>
            <input type="number" min="1" placeholder={`${autoSettleVol} auto`} style={inputStyle} value={settleVol} onChange={(e) => setSettleVol(e.target.value)} />
          </Field>
          <Field label="Tenor (yrs)" w={90}>
            <input type="number" min="1" max="35" style={inputStyle} value={settleTenor} onChange={(e) => setSettleTenor(e.target.value)} />
          </Field>
          <Field label="Collar floor ($/MWh)" w={130}>
            <input type="number" placeholder="none" style={inputStyle} value={floorP} onChange={(e) => setFloorP(e.target.value)} />
          </Field>
          <Field label="Collar cap ($/MWh)" w={130}>
            <input type="number" placeholder="none" style={inputStyle} value={capP} onChange={(e) => setCapP(e.target.value)} />
          </Field>
          <Field label="Node − hub basis ($/MWh)" w={160}>
            <input type="number" min="-50" max="50" step="0.25" style={inputStyle} value={basis} onChange={(e) => setBasis(e.target.value)} />
          </Field>
          <Field label="Basis vol σ ($/MWh)" w={130}>
            <input type="number" min="0" max="50" step="0.25" style={inputStyle} value={basisVol} onChange={(e) => setBasisVol(e.target.value)} />
          </Field>
          <label style={{ fontSize: 11.5, color: T.navy, fontWeight: 600, display: 'flex', alignItems: 'flex-end', gap: 6, paddingBottom: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={negClause} onChange={(e) => setNegClause(e.target.checked)} />
            Negative-price clause (no settlement when market &lt; $0)
          </label>
        </div>
        <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>
          Settles (strike − clamp(market, floor, cap)) × volume per shape point, volume pro-rata to the generation shape.
          {shape.status === 'live' ? ' Using the live 96-point shapes from Panel 4.' : ' Run Panel 4 first to settle against the shaped price curve; otherwise a flat forward is used.'}
          {' '}Strike escalates with the Panel 2 escalation ({escalation}%/yr).
        </div>

        {settle.status === 'live' && settle.data && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="Year-1 settlement" value={fmtM(settle.data.per_year[0].settlement_usd, 2)}
                sub={settle.data.per_year[0].direction} color={settle.data.per_year[0].settlement_usd >= 0 ? T.green : T.red} />
              <Kpi label={`Total (${settle.data.per_year.length}y)`} value={fmtM(settle.data.totals.settlement_usd, 1)}
                sub={`NPV ${fmtM(settle.data.totals.npv_usd, 1)} @ ${discountRate}%`} color={T.navy} />
              <Kpi label="Settled volume" value={`${fmtNum(settle.data.settled_volume_mwh_yr, 0)} MWh/yr`}
                sub={settle.data.excluded_volume_mwh_yr > 0 ? `${fmtNum(settle.data.excluded_volume_mwh_yr, 0)} MWh excluded by neg-price clause` : 'No volume excluded'} color={T.indigo} />
              <Kpi label="Flat-shape identity check" value={fmtM(settle.data.reference.flat_shape_identity_usd_yr1, 2)}
                sub={`(strike − avg $${fmtNum(settle.data.reference.time_weighted_avg_price_usd_mwh, 2)}) × volume`} color={T.slate} />
              <Kpi label="Expected basis P&L" value={fmtM(settle.data.basis_risk.expected_basis_pnl_usd_yr, 2)}
                sub={`±2σ band ${fmtM(settle.data.basis_risk.band_usd_yr, 2)}/yr (user σ, no PRNG)`} color={T.amber} />
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.4, minWidth: 380 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Annual CfD cash settlement ($M — positive = offtaker pays seller)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={settleChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} label={{ value: '$M', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`$${fmtNum(v, 2)}M`, 'Settlement']} labelFormatter={(l) => `Year ${l}`} />
                    <Bar dataKey="Settlement ($M)" fill={T.navy} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 300, maxHeight: 260, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th style={th}>Yr</th><th style={th}>Strike</th><th style={th}>Settled MWh</th><th style={th}>Cash</th><th style={th}>Direction</th></tr>
                  </thead>
                  <tbody>
                    {settle.data.per_year.map((y) => (
                      <tr key={y.year}>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{y.year}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(y.strike_usd_mwh, 2)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(y.settled_volume_mwh, 0)}</td>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: y.settlement_usd >= 0 ? T.green : T.red }}>{fmtM(y.settlement_usd, 2)}</td>
                        <td style={{ ...td, fontSize: 10.5 }}>{y.direction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, background: T.cream, borderRadius: 6, padding: '8px 10px', marginTop: 10 }}>
              {settle.data.mechanics} · Basis: {settle.data.basis_risk.note} · {settle.data.basis_risk.band_convention}
            </div>
          </>
        )}
        {settle.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Settlement engine unreachable — no cash flows shown. Error: {String(settle.error)}</div>}
        {settle.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Set strike, collar and basis terms, then settle. On flat shapes the year-1 settlement equals (strike − avg price) × volume exactly (QA identity).</div>}
      </div>

      {/* ── Panel 6: Credit & collateral (CSA) ──────────────────────────── */}
      <div style={panel}>
        <div style={panelHead}>
          <h2 style={h2}>6 · Credit &amp; Collateral — CSA Terms vs Potential Exposure</h2>
          <span style={endpointTag}>POST /api/v1/ppa-structuring/credit-exposure</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={runCredit} style={{
              background: T.purple, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px',
              fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
            }}>
              Profile exposure →
            </button>
            <Badge status={credit.status} demoText={credit.error} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 6 }}>
          <Field label="CSA threshold ($M)" w={130}>
            <input type="number" min="0" step="0.5" style={inputStyle} value={csaThreshold} onChange={(e) => setCsaThreshold(e.target.value)} />
          </Field>
          <Field label="Independent amount ($M)" w={160}>
            <input type="number" min="0" step="0.5" style={inputStyle} value={csaIa} onChange={(e) => setCsaIa(e.target.value)} />
          </Field>
          <Field label="MTA ($M)" w={100}>
            <input type="number" min="0" step="0.05" style={inputStyle} value={csaMta} onChange={(e) => setCsaMta(e.target.value)} />
          </Field>
          <Field label="Fwd price σ ($/MWh·yr)" w={150}>
            <input type="number" min="0.5" max="100" step="0.5" style={inputStyle} value={priceSigma} onChange={(e) => setPriceSigma(e.target.value)} />
          </Field>
        </div>
        <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>
          PE_t = 2σ√t × remaining contract volume — a documented ±2-sigma diffusion band on the user price-percentile
          input (no simulation). Volume and tenor mirror Panel 5; counterparty rating mirrors Panel 8 ({creditRating}).
        </div>

        {credit.status === 'live' && credit.data && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="Peak potential exposure" value={fmtM(credit.data.peak.potential_exposure_usd, 1)}
                sub={`Year ${credit.data.peak.year} of the profile`} color={T.red} />
              <Kpi label="Collateral call at peak" value={fmtM(credit.data.peak.collateral_call_usd, 1)}
                sub={`max(0, PE − threshold) + IA`} color={T.purple} />
              <Kpi label="CSA threshold / IA / MTA" value={`${fmtM(credit.data.csa_terms.threshold_usd, 1)} / ${fmtM(credit.data.csa_terms.independent_amount_usd, 1)} / ${fmtM(credit.data.csa_terms.mta_usd, 2)}`}
                sub={credit.data.csa_terms.mta_note} color={T.navy} />
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.4, minWidth: 380 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Potential settlement exposure &amp; collateral call by year ($M)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={creditChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} label={{ value: '$M', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip formatter={(v, n) => [`$${fmtNum(v, 1)}M`, n]} labelFormatter={(l) => `Year ${l}`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Potential exposure ($M)" fill={T.purple} fillOpacity={0.75} />
                    <Line dataKey="Collateral call ($M)" stroke={T.red} strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 320 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Downgrade-trigger table (threshold shrinks / IA grows on downgrade)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th style={th}>Rating</th><th style={th}>Threshold</th><th style={th}>IA</th><th style={th}>Collateral @ peak PE</th></tr>
                  </thead>
                  <tbody>
                    {credit.data.downgrade_trigger_table.map((r) => (
                      <tr key={r.rating} style={r.is_current ? { background: T.cream } : undefined}>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: r.is_current ? T.indigo : T.navy }}>{r.rating}{r.is_current ? ' ◄ current' : ''}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtM(r.threshold_usd, 1)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtM(r.independent_amount_usd, 1)}</td>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: T.red }}>{fmtM(r.collateral_at_peak_pe_usd, 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, marginTop: 6 }}>{credit.data.downgrade_basis}</div>
              </div>
            </div>
          </>
        )}
        {credit.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Credit engine unreachable — no exposure profile shown. Error: {String(credit.error)}</div>}
        {credit.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Set CSA terms and the forward-price sigma, then profile the potential settlement exposure and ratings-based downgrade triggers.</div>}
      </div>

      {/* ── Panel 7: Term-sheet score + NPV sensitivity ─────────────────── */}
      <div style={panel}>
        <div style={panelHead}>
          <h2 style={h2}>7 · Term-Sheet Score &amp; NPV Sensitivity</h2>
          <span style={endpointTag}>POST /api/v1/ppa-structuring/term-sheet-score</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 11.5, color: T.navy, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={recsBundled} onChange={(e) => setRecsBundled(e.target.checked)} />
              RECs bundled
            </label>
            <button onClick={runScore} style={{
              background: T.gold, color: T.navy, border: 'none', borderRadius: 8, padding: '8px 18px',
              fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
            }}>
              Score term sheet →
            </button>
            <Badge status={score.status} demoText={score.error} />
          </div>
        </div>
        <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>
          Multi-attribute score (seller view) with visible, overridable weights: price vs capture-adjusted market ·
          tenor · counterparty credit ({creditRating}) · structure flexibility (collar {floorP !== '' || capP !== '' ? 'on' : 'off'},
          neg-price clause {negClause ? 'on' : 'off'}) · sustainability (CFE {shape.status === 'live' && shape.data ? fmtPct(shape.data.sustainability.cfe.cfe_score_pct) : 'not run — 0'},
          Taxonomy, RECs). NPV sensitivity re-runs the exact /structure math at ±10% on 6 drivers.
        </div>

        {score.status === 'live' && score.data && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="Composite deal score" value={fmtNum(score.data.composite_score, 1)}
                sub={`Band: ${score.data.band}`}
                color={score.data.composite_score >= 75 ? T.green : score.data.composite_score >= 60 ? T.teal : score.data.composite_score >= 45 ? T.amber : T.red} />
              <Kpi label="Base NPV (P50)" value={fmtM(score.data.sensitivity.base_npv_usd, 1)} sub="Exact /structure math" color={T.indigo} />
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 340 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Attribute scores × visible weights</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th style={th}>Attribute</th><th style={th}>Weight</th><th style={th}>Score</th><th style={th}>Formula (engine echo)</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(score.data.attribute_scores).map(([k, v]) => (
                      <tr key={k}>
                        <td style={{ ...td, fontWeight: 600, color: T.navy }}>{k.replace(/_/g, ' ')}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(score.data.weights[k] * 100, 0)}</td>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>
                          {fmtNum(v, 1)}
                          <div style={{ background: T.cream, borderRadius: 3, height: 5, marginTop: 3 }}>
                            <div style={{ background: v >= 70 ? T.green : v >= 45 ? T.gold : T.red, borderRadius: 3, height: 5, width: `${Math.min(100, v)}%` }} />
                          </div>
                        </td>
                        <td style={{ ...td, fontSize: 10.5, fontFamily: T.mono }}>{score.data.attribute_formulas[k]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ flex: 1, minWidth: 380 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>NPV sensitivity — ±10% on 6 drivers (P50, exact /structure re-run)</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th style={th}>Driver</th><th style={th}>−10% NPV</th><th style={th}>Δ%</th><th style={th}>+10% NPV</th><th style={th}>Δ%</th></tr>
                  </thead>
                  <tbody>
                    {score.data.sensitivity.table.map((r) => (
                      <tr key={r.field}>
                        <td style={{ ...td, fontWeight: 600, color: T.navy }}>{r.driver}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtM(r.down_10_npv_usd, 1)}</td>
                        <td style={{ ...td, fontFamily: T.mono, color: (r.down_10_delta_pct ?? 0) >= 0 ? T.green : T.red }}>{r.down_10_delta_pct != null ? `${r.down_10_delta_pct > 0 ? '+' : ''}${fmtNum(r.down_10_delta_pct, 2)}%` : '—'}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtM(r.up_10_npv_usd, 1)}</td>
                        <td style={{ ...td, fontFamily: T.mono, color: (r.up_10_delta_pct ?? 0) >= 0 ? T.green : T.red }}>{r.up_10_delta_pct != null ? `${r.up_10_delta_pct > 0 ? '+' : ''}${fmtNum(r.up_10_delta_pct, 2)}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, marginTop: 6 }}>{score.data.sensitivity.method}</div>
              </div>
            </div>
          </>
        )}
        {score.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Scoring engine unreachable — no score shown. Error: {String(score.error)}</div>}
        {score.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Score the full term sheet (uses Panels 1–6 inputs: structure, capture, CFE, collar/clause, rating) and inspect which driver moves NPV most.</div>}
      </div>

      {/* ── Panel 8: Bankability ────────────────────────────────────────── */}
      <div style={panel}>
        <div style={panelHead}>
          <h2 style={h2}>8 · Counterparty Bankability</h2>
          <span style={endpointTag}>POST /api/v1/renewable-ppa/ppa-risk</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={runRisk} style={{
              background: T.teal, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px',
              fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
            }}>
              Score bankability →
            </button>
            <Badge status={risk.status} demoText={risk.error} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
          <Field label="Offtaker" w={230}>
            <input style={inputStyle} value={offtakerName} onChange={(e) => setOfftakerName(e.target.value)} />
          </Field>
          <Field label="Offtaker credit rating" w={150}>
            <select style={inputStyle} value={creditRating} onChange={(e) => setCreditRating(e.target.value)}>
              {CREDIT_RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Curtailment risk" w={130}>
            <select style={inputStyle} value={curtailment} onChange={(e) => setCurtailment(e.target.value)}>
              {RISK_LEVELS_4.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Regulatory risk" w={130}>
            <select style={inputStyle} value={regulatory} onChange={(e) => setRegulatory(e.target.value)}>
              {REG_LEVELS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>
          Term-sheet fields flow through automatically: tenor {tenor}y · price structure {num(escalation, 0) > 0 ? 'fixed_escalation' : 'fixed'} ·
          volume hedged {contractedPct}% · merchant exposure {Math.max(0, 100 - num(contractedPct, 80))}%.
          Scored by the platform PPA risk engine (5 weighted dimensions; weights shown per dimension).
        </div>

        {risk.status === 'live' && risk.data && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="Composite risk score" value={fmtNum(risk.data.composite_score, 1)} sub="0–100 · higher = riskier"
                color={risk.data.composite_score < 25 ? T.green : risk.data.composite_score < 45 ? T.teal : risk.data.composite_score < 65 ? T.amber : T.red} />
              <Kpi label="Risk band" value={risk.data.risk_band || '—'} />
              <Kpi label="Bankability verdict" value={risk.data.bankability_rating || '—'} color={T.navy} />
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1.4, minWidth: 340 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>Dimension</th><th style={th}>Weight</th><th style={th}>Raw score</th>
                      <th style={th}>Weighted</th><th style={th}>Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(risk.data.dimension_scores || []).map((d) => (
                      <tr key={d.dimension}>
                        <td style={{ ...td, fontWeight: 600, color: T.navy }}>{d.label}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(d.weight * 100, 0)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>
                          {fmtNum(d.raw_score, 0)}
                          <div style={{ background: T.cream, borderRadius: 3, height: 5, marginTop: 3, width: '100%' }}>
                            <div style={{ background: riskColor(d.risk_level), borderRadius: 3, height: 5, width: `${Math.min(100, d.raw_score)}%` }} />
                          </div>
                        </td>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{fmtNum(d.weighted_score, 1)}</td>
                        <td style={td}>
                          <span style={{ background: riskColor(d.risk_level) + '22', color: riskColor(d.risk_level), borderRadius: 4, padding: '1px 7px', fontSize: 10.5, fontWeight: 700 }}>{d.risk_level}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ flex: 1, minWidth: 280 }}>
                {(risk.data.risk_factors || []).length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.red, marginBottom: 4 }}>Risk factors</div>
                    <ul style={{ margin: '0 0 10px', paddingLeft: 18, fontSize: 11.5, color: T.slate }}>
                      {risk.data.risk_factors.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </>
                )}
                {(risk.data.mitigation_suggestions || []).length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 4 }}>Mitigation suggestions</div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: T.slate }}>
                      {risk.data.mitigation_suggestions.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </>
        )}
        {risk.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>PPA risk engine unreachable — no score shown. Error: {String(risk.error)}</div>}
        {risk.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Pick the offtaker profile and score the term sheet. Uses the same 5-dimension engine that backs the platform's PPA risk pages.</div>}
      </div>

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
        Engines: api/v1/routes/ppa_structuring.py (deterministic term-sheet math — formulas in module docstring, no PRNG:
        /structure · /shape-analysis 96-pt archetypes · /settlement CfD · /credit-exposure 2σ CSA · /term-sheet-score ·
        /ref/shape-archetypes · /ref/rec-forward) · services/renewable_project_engine.py (Weibull/GHI P50-P90 yields) ·
        services/ppa_risk_scorer.py (5-dimension bankability).
        Capture-rate tiers: hand-authored modeling defaults, basis Hirth 2013 + Millstein et al. 2021 (LBNL);
        shape archetypes, load profiles, CSA grid and score weights fully disclosed by the ref endpoints.
        Portfolio-level PPA analytics: /ppa-revenue-analytics.
      </div>
    </div>
  );
}
