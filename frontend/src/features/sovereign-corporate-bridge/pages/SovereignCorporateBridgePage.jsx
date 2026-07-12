import React, { useState, useMemo, useCallback, useEffect } from 'react';
import axios from 'axios';
import EntityAutocomplete from '../../../components/entity/EntityAutocomplete';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, PieChart, Pie, ScatterChart, Scatter, ZAxis,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Sovereign-Corporate Risk Bridge
// Corporate holdings → sovereign-of-domicile climate risk, joined view.
// Live engines:
//   1. POST /api/v1/sovereign-climate-risk/assess        (per unique country)
//   2. GET  /api/v1/pcaf-sovereign/ref/country-profiles   (real UNFCCC/IMF inputs)
//      POST /api/v1/pcaf-sovereign/attribution            (per holding, real inputs)
// Portfolio aggregation (holding-weighted composite, tier concentration) is
// derived locally from the live per-country responses — no fabricated numbers.
// Requests use the CRA dev proxy (/api → localhost:8001) + global axios Bearer.
//
// Additive real-data panels (per focus country, alongside the composite above):
//   3. GET /api/v1/ucdp/country-summary?iso3=      — UCDP conflict/stability nowcast
//      (token-gated live GED feed; falls back to a labeled seeded real sample)
//   4. GET /api/v1/climate-policy/country/{iso3}    — Climate Policy Radar stringency
//      (no live CPR API exists; labeled seeded real extract + documented scorer)
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

// Countries present in BOTH the sovereign climate risk engine (51 ISO2 profiles)
// and the PCAF sovereign engine (40 ISO2 profiles) — safe for both endpoints.
const BRIDGE_COUNTRIES = [
  { iso2: 'US', name: 'United States' }, { iso2: 'GB', name: 'United Kingdom' },
  { iso2: 'DE', name: 'Germany' }, { iso2: 'FR', name: 'France' },
  { iso2: 'JP', name: 'Japan' }, { iso2: 'CA', name: 'Canada' },
  { iso2: 'IT', name: 'Italy' }, { iso2: 'NL', name: 'Netherlands' },
  { iso2: 'ES', name: 'Spain' }, { iso2: 'SE', name: 'Sweden' },
  { iso2: 'NO', name: 'Norway' }, { iso2: 'DK', name: 'Denmark' },
  { iso2: 'FI', name: 'Finland' }, { iso2: 'PL', name: 'Poland' },
  { iso2: 'CZ', name: 'Czech Republic' }, { iso2: 'HU', name: 'Hungary' },
  { iso2: 'RO', name: 'Romania' }, { iso2: 'PT', name: 'Portugal' },
  { iso2: 'GR', name: 'Greece' }, { iso2: 'AT', name: 'Austria' },
  { iso2: 'BE', name: 'Belgium' }, { iso2: 'CH', name: 'Switzerland' },
  { iso2: 'AU', name: 'Australia' }, { iso2: 'NZ', name: 'New Zealand' },
  { iso2: 'CN', name: 'China' }, { iso2: 'IN', name: 'India' },
  { iso2: 'BR', name: 'Brazil' }, { iso2: 'ZA', name: 'South Africa' },
  { iso2: 'MX', name: 'Mexico' }, { iso2: 'AR', name: 'Argentina' },
  { iso2: 'TR', name: 'Turkey' }, { iso2: 'ID', name: 'Indonesia' },
  { iso2: 'SG', name: 'Singapore' }, { iso2: 'KR', name: 'South Korea' },
  { iso2: 'SA', name: 'Saudi Arabia' }, { iso2: 'AE', name: 'United Arab Emirates' },
  { iso2: 'EG', name: 'Egypt' }, { iso2: 'NG', name: 'Nigeria' },
  { iso2: 'KE', name: 'Kenya' },
];

// ISO2 -> ISO3, mirrors backend/api/v1/routes/ucdp_conflict.py::ISO2_TO_ISO3 and
// climate_policy_radar.py's country codes, so the two new panels can query by ISO3.
const ISO2_TO_ISO3 = {
  US: 'USA', GB: 'GBR', DE: 'DEU', FR: 'FRA', JP: 'JPN', CA: 'CAN',
  IT: 'ITA', NL: 'NLD', ES: 'ESP', SE: 'SWE', NO: 'NOR', DK: 'DNK',
  FI: 'FIN', PL: 'POL', CZ: 'CZE', HU: 'HUN', RO: 'ROU', PT: 'PRT',
  GR: 'GRC', AT: 'AUT', BE: 'BEL', CH: 'CHE', AU: 'AUS', NZ: 'NZL',
  CN: 'CHN', IN: 'IND', BR: 'BRA', ZA: 'ZAF', MX: 'MEX', AR: 'ARG',
  TR: 'TUR', ID: 'IDN', SG: 'SGP', KR: 'KOR', SA: 'SAU', AE: 'ARE',
  EG: 'EGY', NG: 'NGA', KE: 'KEN',
};

const CONFLICT_TIER_COLOR = { none: '#15803d', low: '#0f766e', moderate: '#b45309', active: '#b91c1c' };

const SCENARIOS = [
  { id: 'net_zero_2050', label: 'Net Zero 2050 (orderly)' },
  { id: 'below_2c', label: 'Below 2°C' },
  { id: 'delayed_transition', label: 'Delayed Transition' },
  { id: 'nationally_determined', label: 'NDCs' },
  { id: 'current_policies', label: 'Current Policies (hot house)' },
];
const HORIZONS = ['2030', '2050'];

// Hand-authored editable default holdings — realistic corporate names and
// countries of domicile, illustrative exposures. NOT live data; fully editable.
const DEFAULT_HOLDINGS = [
  { id: 1, name: 'Apple Inc.', iso2: 'US', exposureM: 420 },
  { id: 2, name: 'Siemens AG', iso2: 'DE', exposureM: 310 },
  { id: 3, name: 'Toyota Motor Corp.', iso2: 'JP', exposureM: 280 },
  { id: 4, name: 'HSBC Holdings plc', iso2: 'GB', exposureM: 250 },
  { id: 5, name: 'TotalEnergies SE', iso2: 'FR', exposureM: 230 },
  { id: 6, name: 'Reliance Industries Ltd.', iso2: 'IN', exposureM: 190 },
  { id: 7, name: 'Vale S.A.', iso2: 'BR', exposureM: 160 },
  { id: 8, name: 'Sasol Ltd.', iso2: 'ZA', exposureM: 120 },
  { id: 9, name: 'PT Bank Mandiri', iso2: 'ID', exposureM: 95 },
  { id: 10, name: 'BHP Group Ltd.', iso2: 'AU', exposureM: 145 },
];

const TIER_ORDER = ['low', 'moderate', 'high', 'very_high'];
const TIER_COLOR = { low: T.green, moderate: T.teal, high: T.amber, very_high: T.red };
const tierOf = (cs) => (cs < 25 ? 'low' : cs < 45 ? 'moderate' : cs < 65 ? 'high' : 'very_high');

const fmtM = (v) => (v == null || isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
const fmtNum = (v, d = 1) => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });
const fmtPct = (v, d = 1) => (v == null || isNaN(v)) ? '—' : `${Number(v).toFixed(d)}%`;

const Badge = ({ status, demoText }) => {
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live</span>;
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

const inputStyle = {
  border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 8px',
  fontSize: 12, fontFamily: T.mono, color: T.navy, background: '#fff', width: '100%', boxSizing: 'border-box',
};
const th = { textAlign: 'left', fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 8px', borderBottom: `2px solid ${T.border}` };
const td = { fontSize: 12, color: T.slate, padding: '6px 8px', borderBottom: `1px solid ${T.border}` };

export default function SovereignCorporateBridgePage() {
  const [holdings, setHoldings] = useState(DEFAULT_HOLDINGS);
  const [scenario, setScenario] = useState('current_policies');
  const [horizon, setHorizon] = useState('2030');

  // sovereign: { status, byIso2: {ISO2: assessResponse}, error }
  const [sov, setSov] = useState({ status: 'idle', byIso2: null, error: null });
  // pcaf: { status, byHoldingId: {id: attributionResult}, profiles, error }
  const [pcaf, setPcaf] = useState({ status: 'idle', byHoldingId: null, profiles: null, error: null });

  // ── Focus-country selector shared by the two additive real-data panels below ──
  const [focusIso2, setFocusIso2] = useState('IN');
  const focusIso3 = ISO2_TO_ISO3[focusIso2];
  const focusCountryName = BRIDGE_COUNTRIES.find((c) => c.iso2 === focusIso2)?.name || focusIso2;

  // conflict: UCDP conflict/stability nowcast for the focus country
  const [conflict, setConflict] = useState({ status: 'idle', data: null, error: null });
  // policy: Climate Policy Radar stringency extract for the focus country
  const [policy, setPolicy] = useState({ status: 'idle', data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    setConflict({ status: 'loading', data: null, error: null });
    axios.get('/api/v1/ucdp/country-summary', { params: { iso3: focusIso3 }, timeout: 15000 })
      .then(({ data }) => { if (!cancelled) setConflict({ status: data.mode === 'live' ? 'live' : 'demo', data, error: null }); })
      .catch((e) => { if (!cancelled) setConflict({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }); });

    setPolicy({ status: 'loading', data: null, error: null });
    axios.get(`/api/v1/climate-policy/country/${focusIso3}`, { timeout: 15000 })
      .then(({ data }) => { if (!cancelled) setPolicy({ status: 'demo', data, error: null }); })
      .catch((e) => {
        if (cancelled) return;
        if (e?.response?.status === 404) setPolicy({ status: 'no-coverage', data: null, error: null });
        else setPolicy({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message });
      });
    return () => { cancelled = true; };
  }, [focusIso3]);

  const updateHolding = (id, key, value) => {
    setHoldings((prev) => prev.map((h) => (h.id === id ? { ...h, [key]: value } : h)));
  };
  const addHolding = () => {
    setHoldings((prev) => [...prev, {
      id: prev.length ? Math.max(...prev.map((h) => h.id)) + 1 : 1,
      name: 'New Holding', iso2: 'US', exposureM: 50,
    }]);
  };
  const removeHolding = (id) => setHoldings((prev) => prev.filter((h) => h.id !== id));

  // Alternative way to add a NEW holding: resolve the company via GLEIF and
  // auto-fill its country of domicile from the resolved jurisdiction, instead
  // of a manual country pick. Manual entry/editing of existing rows is
  // untouched — this only affects how a fresh row gets added.
  const [gleifHoldingName, setGleifHoldingName] = useState('');
  const [gleifCandidate, setGleifCandidate] = useState(null);

  const jurisdictionToIso2 = (jurisdiction) => {
    if (!jurisdiction) return null;
    const code = jurisdiction.slice(0, 2).toUpperCase();
    return BRIDGE_COUNTRIES.some((c) => c.iso2 === code) ? code : null;
  };

  const addHoldingFromGleif = () => {
    if (!gleifCandidate) return;
    const iso2 = jurisdictionToIso2(gleifCandidate.jurisdiction) || 'US';
    setHoldings((prev) => [...prev, {
      id: prev.length ? Math.max(...prev.map((h) => h.id)) + 1 : 1,
      name: gleifCandidate.legal_name, iso2, exposureM: 50,
    }]);
    setGleifCandidate(null);
    setGleifHoldingName('');
  };

  const validHoldings = useMemo(
    () => holdings.filter((h) => h.name && h.iso2 && parseFloat(h.exposureM) > 0),
    [holdings],
  );

  const runAssessment = useCallback(async () => {
    const uniqueIso2 = [...new Set(validHoldings.map((h) => h.iso2))];

    // 1) Sovereign climate risk — one POST /assess per unique country of domicile
    setSov({ status: 'loading', byIso2: null, error: null });
    try {
      const results = await Promise.all(uniqueIso2.map((iso2) =>
        axios.post('/api/v1/sovereign-climate-risk/assess', {
          country_iso2: iso2, scenario, horizon,
        }, { timeout: 20000 }).then(({ data }) => [iso2, data]),
      ));
      const byIso2 = Object.fromEntries(results);
      setSov({ status: 'live', byIso2, error: null });
    } catch (e) {
      setSov({ status: 'demo', byIso2: null, error: e?.response?.data?.detail || e.message });
    }

    // 2) PCAF-sovereign attribution — real inputs from /ref/country-profiles
    //    (IMF GDP + debt %, UNFCCC GHG inventory), one POST /attribution per holding
    setPcaf({ status: 'loading', byHoldingId: null, profiles: null, error: null });
    try {
      const { data: refData } = await axios.get('/api/v1/pcaf-sovereign/ref/country-profiles', { timeout: 20000 });
      const profiles = refData?.result?.country_profiles || {};
      const entries = await Promise.all(validHoldings.map(async (h) => {
        const p = profiles[h.iso2];
        if (!p) return [h.id, { unsupported: true }];
        const govtDebtBn = (p.gdp_bn_2022 * p.government_debt_pct_gdp) / 100.0;
        const ghgTco2e = p.ghg_inventory_mtco2e_2022 * 1_000_000;
        const { data } = await axios.post('/api/v1/pcaf-sovereign/attribution', {
          outstanding_mn: parseFloat(h.exposureM),
          government_debt_bn: govtDebtBn,
          ghg_inventory_tco2e: ghgTco2e,
        }, { timeout: 20000 });
        return [h.id, { ...(data?.result || {}), country_name: p.country_name }];
      }));
      setPcaf({ status: 'live', byHoldingId: Object.fromEntries(entries), profiles, error: null });
    } catch (e) {
      setPcaf({ status: 'demo', byHoldingId: null, profiles: null, error: e?.response?.data?.detail || e.message });
    }
  }, [validHoldings, scenario, horizon]);

  // ── Derived portfolio view (from live sovereign responses only) ───────────
  const bridge = useMemo(() => {
    if (sov.status !== 'live' || !sov.byIso2) return null;
    const totalExposure = validHoldings.reduce((s, h) => s + parseFloat(h.exposureM), 0);
    if (totalExposure <= 0) return null;

    const rows = validHoldings.map((h) => {
      const a = sov.byIso2[h.iso2];
      const exposure = parseFloat(h.exposureM);
      const weight = exposure / totalExposure;
      const cs = a?.composite_climate_risk_score ?? null;
      return {
        ...h, exposure, weight,
        countryName: a?.country_name || h.iso2,
        composite: cs,
        tier: cs != null ? tierOf(cs) : null,
        physical: a?.physical_risk_score, transition: a?.transition_risk_score,
        fiscal: a?.fiscal_vulnerability_score, adaptation: a?.adaptation_readiness_score,
        baselineRating: a?.baseline_rating, adjustedRating: a?.climate_adjusted_rating,
        notch: a?.notch_adjustment, spreadBps: a?.climate_spread_delta_bps,
      };
    }).sort((x, y) => (y.composite ?? -1) - (x.composite ?? -1));

    const scored = rows.filter((r) => r.composite != null);
    const scoredExposure = scored.reduce((s, r) => s + r.exposure, 0);
    const wAvg = scoredExposure > 0 ? scored.reduce((s, r) => s + r.composite * r.exposure, 0) / scoredExposure : null;
    const wSpread = scoredExposure > 0 ? scored.reduce((s, r) => s + (r.spreadBps || 0) * r.exposure, 0) / scoredExposure : null;
    const wNotch = scoredExposure > 0 ? scored.reduce((s, r) => s + (r.notch || 0) * r.exposure, 0) / scoredExposure : null;

    const tierConc = TIER_ORDER.map((tier) => {
      const inTier = scored.filter((r) => r.tier === tier);
      return {
        tier,
        exposure: inTier.reduce((s, r) => s + r.exposure, 0),
        pct: totalExposure > 0 ? inTier.reduce((s, r) => s + r.exposure, 0) / totalExposure * 100 : 0,
        count: inTier.length,
      };
    });

    return { rows, totalExposure, wAvg, wSpread, wNotch, tierConc };
  }, [sov, validHoldings]);

  const attribution = useMemo(() => {
    if (pcaf.status !== 'live' || !pcaf.byHoldingId || !bridge) return null;
    const rows = bridge.rows.map((r) => ({ ...r, attr: pcaf.byHoldingId[r.id] || null }));
    const totalAttr = rows.reduce((s, r) => s + (r.attr && !r.attr.unsupported ? (r.attr.attributed_emissions_tco2e || 0) : 0), 0);
    return { rows, totalAttr };
  }, [pcaf, bridge]);

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.teal, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>SCB-1</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Sovereign-Corporate Risk Bridge</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Sovereign Climate Risk Engine</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>PCAF Part D Attribution</span>
          <span style={{ background: T.gold + '33', color: T.amber, border: `1px solid ${T.gold}66`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>NGFS Scenarios</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 16, maxWidth: 1000 }}>
        Corporate holdings → sovereign-of-domicile climate risk, joined. Each unique country of domicile is scored
        live by the sovereign climate risk engine (physical 30% · transition 25% · fiscal 25% · adaptation 20%);
        the portfolio view weights each holding by exposure. The PCAF panel applies the Part D attribution formula
        to the same exposures using real IMF debt and UNFCCC inventory inputs.
      </div>

      {/* ── Holdings input ──────────────────────────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Corporate Holdings</h2>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Editable defaults — hand-authored illustrative holdings, not live positions</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              Scenario
              <select style={{ ...inputStyle, width: 210 }} value={scenario} onChange={(e) => setScenario(e.target.value)}>
                {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              Horizon
              <select style={{ ...inputStyle, width: 90 }} value={horizon} onChange={(e) => setHorizon(e.target.value)}>
                {HORIZONS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </label>
            <button onClick={runAssessment} disabled={validHoldings.length === 0} style={{
              background: validHoldings.length ? T.navy : T.sub, color: '#fff', border: 'none', borderRadius: 8,
              padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: validHoldings.length ? 'pointer' : 'not-allowed', fontFamily: T.font,
            }}>
              Assess sovereign exposure →
            </button>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Holding</th>
              <th style={th}>Country of domicile</th>
              <th style={th}>Exposure ($M)</th>
              <th style={{ ...th, width: 60 }} />
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => (
              <tr key={h.id}>
                <td style={td}><input style={inputStyle} value={h.name} onChange={(e) => updateHolding(h.id, 'name', e.target.value)} /></td>
                <td style={td}>
                  <select style={inputStyle} value={h.iso2} onChange={(e) => updateHolding(h.id, 'iso2', e.target.value)}>
                    {BRIDGE_COUNTRIES.map((c) => <option key={c.iso2} value={c.iso2}>{c.name} ({c.iso2})</option>)}
                  </select>
                </td>
                <td style={td}><input type="number" min="0" style={inputStyle} value={h.exposureM} onChange={(e) => updateHolding(h.id, 'exposureM', e.target.value)} /></td>
                <td style={td}>
                  <button onClick={() => removeHolding(h.id)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.red, cursor: 'pointer', fontSize: 11, padding: '4px 8px' }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addHolding} style={{ marginTop: 10, background: 'transparent', border: `1px dashed ${T.navy}66`, borderRadius: 8, color: T.navy, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '7px 16px' }}>
          + Add holding
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>
              Or add a new holding via GLEIF — resolves the company and auto-fills its country of domicile
            </div>
            <EntityAutocomplete
              value={gleifHoldingName}
              onChange={setGleifHoldingName}
              onResolve={setGleifCandidate}
              placeholder="Company name (e.g. Siemens AG)…"
            />
            {gleifCandidate && (
              <div style={{ fontSize: 11, color: T.teal, fontFamily: T.mono, marginTop: 6 }}>
                {gleifCandidate.legal_name} · LEI {gleifCandidate.lei} · jurisdiction {gleifCandidate.jurisdiction || '—'}
                {!jurisdictionToIso2(gleifCandidate.jurisdiction) && (
                  <span style={{ color: T.amber }}> (country not in bridge list — defaulting to US, edit after adding)</span>
                )}
              </div>
            )}
          </div>
          <button onClick={addHoldingFromGleif} disabled={!gleifCandidate} style={{
            background: gleifCandidate ? T.teal : T.sub, color: '#fff', border: 'none', borderRadius: 8,
            padding: '9px 18px', fontSize: 12, fontWeight: 700, cursor: gleifCandidate ? 'pointer' : 'not-allowed', fontFamily: T.font, marginTop: 20,
          }}>
            + Add resolved holding
          </button>
        </div>
      </div>

      {/* ── Sovereign exposure view ─────────────────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Holding-Weighted Sovereign Climate Exposure</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>POST /api/v1/sovereign-climate-risk/assess × unique countries</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={sov.status} demoText={sov.error} /></div>
        </div>

        {sov.status === 'live' && bridge && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="Total exposure" value={fmtM(bridge.totalExposure)} sub={`${bridge.rows.length} holdings · ${new Set(bridge.rows.map((r) => r.iso2)).size} sovereigns`} />
              <Kpi label="Weighted sovereign composite" value={fmtNum(bridge.wAvg, 1)} sub="0–100 · higher = riskier" color={bridge.wAvg != null ? TIER_COLOR[tierOf(bridge.wAvg)] : T.navy} />
              <Kpi label="Weighted climate spread Δ" value={bridge.wSpread != null ? `${fmtNum(bridge.wSpread, 1)} bps` : '—'} sub="Sovereign spread uplift" color={T.indigo} />
              <Kpi label="Weighted notch adjustment" value={fmtNum(bridge.wNotch, 2)} sub="Rating notches (negative = downgrade)" />
              <Kpi label="High + very-high tier share" value={fmtPct(bridge.tierConc.filter((t) => t.tier === 'high' || t.tier === 'very_high').reduce((s, t) => s + t.pct, 0))}
                sub="Exposure in composite ≥ 45" color={T.red} />
            </div>

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ flex: 2, minWidth: 360 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Exposure by holding, coloured by sovereign risk tier ($M)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={bridge.rows} margin={{ bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v, n, p) => [`$${fmtNum(v, 0)}M · composite ${fmtNum(p?.payload?.composite, 1)}`, p?.payload?.countryName]} />
                    <Bar dataKey="exposure" name="Exposure $M" radius={[3, 3, 0, 0]}>
                      {bridge.rows.map((r, i) => <Cell key={i} fill={TIER_COLOR[r.tier] || T.slate} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1.2, minWidth: 260 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Concentration by sovereign risk tier (% of exposure)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={bridge.tierConc.filter((t) => t.exposure > 0)} dataKey="exposure" nameKey="tier"
                      cx="50%" cy="50%" outerRadius={80} label={(d) => `${d.tier} ${d.pct.toFixed(0)}%`}>
                      {bridge.tierConc.filter((t) => t.exposure > 0).map((t, i) => <Cell key={i} fill={TIER_COLOR[t.tier]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtM(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1.6, minWidth: 300 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Sovereign composite vs exposure (bubble = spread Δ bps)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <ScatterChart margin={{ bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="composite" name="Composite" tick={{ fontSize: 10 }} domain={[0, 100]} label={{ value: 'Sovereign composite (0–100)', position: 'insideBottom', offset: -6, fontSize: 10 }} />
                    <YAxis dataKey="exposure" name="Exposure $M" tick={{ fontSize: 10 }} />
                    <ZAxis dataKey="spreadBps" range={[40, 400]} name="Spread Δ bps" />
                    <Tooltip formatter={(v, n) => [fmtNum(v, 1), n]} labelFormatter={() => ''} />
                    <Scatter data={bridge.rows.filter((r) => r.composite != null)} fill={T.indigo} fillOpacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Holding</th><th style={th}>Sovereign</th><th style={th}>Exposure</th><th style={th}>Weight</th>
                  <th style={th}>Composite</th><th style={th}>Tier</th><th style={th}>Physical</th><th style={th}>Transition</th>
                  <th style={th}>Fiscal</th><th style={th}>Rating (base→adj)</th><th style={th}>Spread Δ</th>
                </tr>
              </thead>
              <tbody>
                {bridge.rows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ ...td, fontWeight: 600, color: T.navy }}>{r.name}</td>
                    <td style={td}>{r.countryName} ({r.iso2})</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{fmtM(r.exposure)}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(r.weight * 100)}</td>
                    <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{fmtNum(r.composite, 1)}</td>
                    <td style={td}>
                      {r.tier ? <span style={{ background: TIER_COLOR[r.tier] + '22', color: TIER_COLOR[r.tier], borderRadius: 4, padding: '1px 7px', fontSize: 10.5, fontWeight: 700 }}>{r.tier}</span> : '—'}
                    </td>
                    <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.physical, 1)}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.transition, 1)}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.fiscal, 1)}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{r.baselineRating || '—'} → {r.adjustedRating || '—'}{r.notch ? ` (${r.notch})` : ''}</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{r.spreadBps != null ? `+${fmtNum(r.spreadBps, 1)} bps` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {sov.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Sovereign climate risk engine unreachable — no figures shown (this page never fabricates results). Error: {String(sov.error)}</div>}
        {sov.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Edit the holdings above and run the assessment. One live engine call is made per unique country of domicile.</div>}
      </div>

      {/* ── PCAF sovereign attribution panel ────────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>PCAF Part D — Sovereign Attribution Lens</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/pcaf-sovereign/ref/country-profiles → POST /attribution × holdings</span>
          <div style={{ marginLeft: 'auto' }}><Badge status={pcaf.status} demoText={pcaf.error} /></div>
        </div>
        <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 12 }}>
          Analytical lens: the PCAF Part D formula (outstanding ÷ government debt × sovereign GHG inventory) is applied
          to each corporate exposure via its country of domicile, using real IMF government-debt and UNFCCC national-inventory
          inputs from the engine's country profiles. This is a sovereign-linkage view — it is <b>not</b> the holding's own
          PCAF-compliant financed emissions (Part A covers that).
        </div>

        {pcaf.status === 'live' && attribution && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="Total attributed sovereign GHG" value={`${fmtNum(attribution.totalAttr, 0)} tCO2e`} sub="Sum across holdings" color={T.purple} />
              <Kpi label="Attribution intensity" value={bridge && bridge.totalExposure > 0 ? `${fmtNum(attribution.totalAttr / bridge.totalExposure, 1)} tCO2e/$M` : '—'} sub="Per $M of exposure" />
              <Kpi label="Formula" value="O/D × GHG" sub="PCAF Part D §3.2 — live engine calculation" />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Holding</th><th style={th}>Sovereign</th><th style={th}>Exposure ($M)</th>
                  <th style={th}>Govt debt ($bn)</th><th style={th}>GHG inventory (MtCO2e)</th>
                  <th style={th}>Attribution factor</th><th style={th}>Attributed (tCO2e)</th>
                </tr>
              </thead>
              <tbody>
                {attribution.rows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ ...td, fontWeight: 600, color: T.navy }}>{r.name}</td>
                    <td style={td}>{r.attr?.country_name || r.countryName} ({r.iso2})</td>
                    <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.exposure, 1)}</td>
                    {r.attr && !r.attr.unsupported ? (
                      <>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.attr.government_debt_bn, 0)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{fmtNum((r.attr.ghg_inventory_tco2e || 0) / 1e6, 0)}</td>
                        <td style={{ ...td, fontFamily: T.mono }}>{r.attr.attribution_factor != null ? r.attr.attribution_factor.toExponential(3) : '—'}</td>
                        <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: T.purple }}>{fmtNum(r.attr.attributed_emissions_tco2e, 1)}</td>
                      </>
                    ) : (
                      <td style={{ ...td, color: T.amber }} colSpan={4}>Country not in PCAF sovereign profiles — excluded from attribution</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {pcaf.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>PCAF sovereign engine unreachable — no figures shown. Error: {String(pcaf.error)}</div>}
        {pcaf.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Run the assessment to compute PCAF Part D attribution per holding using real country-profile inputs.</div>}
      </div>

      {/* ── Focus-country selector for the two additive real-data panels ──── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Supplementary Real-Data Signals</h2>
          <span style={{ fontSize: 11.5, color: T.sub }}>for a single focus country, alongside (not replacing) the sovereign composite above</span>
          <label style={{ marginLeft: 'auto', fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            Focus country
            <select style={{ ...inputStyle, width: 220 }} value={focusIso2} onChange={(e) => setFocusIso2(e.target.value)}>
              {BRIDGE_COUNTRIES.map((c) => <option key={c.iso2} value={c.iso2}>{c.name} ({c.iso2})</option>)}
            </select>
          </label>
        </div>
        {bridge && (() => {
          const focusRow = bridge.rows.find((r) => r.iso2 === focusIso2);
          return focusRow ? (
            <div style={{ fontSize: 11.5, color: T.slate, marginTop: 10 }}>
              For reference, {focusCountryName}'s existing hand-authored sovereign composite score (from the
              assessment above): <b style={{ fontFamily: T.mono, color: TIER_COLOR[focusRow.tier] }}>{fmtNum(focusRow.composite, 1)}</b> ({focusRow.tier})
            </div>
          ) : (
            <div style={{ fontSize: 11.5, color: T.sub, marginTop: 10 }}>
              {focusCountryName} is not among the current holdings' sovereign composite results — run the assessment
              above with a holding domiciled in {focusCountryName} to see it side-by-side.
            </div>
          );
        })()}
      </div>

      {/* ── UCDP conflict / stability nowcast panel ─────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Conflict &amp; Stability Nowcast — {focusCountryName}</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/ucdp/country-summary?iso3={focusIso3}</span>
          <div style={{ marginLeft: 'auto' }}>
            <Badge
              status={conflict.status === 'live' ? 'live' : conflict.status === 'loading' ? 'loading' : 'demo'}
              demoText={conflict.status === 'demo' ? (conflict.error || 'seeded real sample — set UCDP_API_TOKEN for live monthly GED data') : undefined}
            />
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 12 }}>
          UCDP (Uppsala Conflict Data Program) GED conflict-event data as a real-time-ish supplementary signal —
          this is village-level-geocoded, monthly-updated armed-conflict data, distinct from the sovereign
          composite's annual index inputs. The live feed requires a free UCDP API token (email-request process,
          no self-service signup); without one this panel shows a labeled seeded real sample.
        </div>
        {conflict.status === 'loading' && <div style={{ fontSize: 12, color: T.sub }}>Loading…</div>}
        {conflict.data && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="Conflict tier" value={(conflict.data.tier || '—').toUpperCase()} color={CONFLICT_TIER_COLOR[conflict.data.tier] || T.navy} sub={conflict.data.active_since ? `Active since ${conflict.data.active_since}` : 'No active conflict identified'} />
              <Kpi label="Notable documented incidents" value={fmtNum((conflict.data.notable_incidents || []).length, 0)} sub="Seeded sample count" />
              <Kpi label="Mode" value={conflict.data.mode === 'live' ? 'Live GED' : 'Seeded sample'} sub={conflict.data.mode === 'live' ? 'Real-time monthly feed' : 'Set UCDP_API_TOKEN for live data'} />
            </div>
            {conflict.data.summary && <div style={{ fontSize: 12.5, color: T.slate, marginBottom: 10 }}>{conflict.data.summary}</div>}
            {conflict.data.actors && conflict.data.actors.length > 0 && (
              <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10 }}>
                Actors: {conflict.data.actors.join(' · ')}
              </div>
            )}
            {conflict.data.monthly_series && (
              <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10 }}>Trend: <b>{conflict.data.trend}</b></div>
            )}
            {(conflict.data.notable_incidents || []).length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Month</th><th style={th}>Documented incident</th></tr></thead>
                <tbody>
                  {conflict.data.notable_incidents.map((ev, i) => (
                    <tr key={i}><td style={{ ...td, fontFamily: T.mono }}>{ev.date}</td><td style={td}>{ev.headline}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {conflict.data.tier === 'none' && (conflict.data.notable_incidents || []).length === 0 && (
              <div style={{ fontSize: 12, color: T.sub }}>No UCDP-codeable active armed conflict identified for {focusCountryName} — a genuine finding, not a data gap.</div>
            )}
            {conflict.data.mode !== 'live' && (
              <div style={{ fontSize: 10.5, color: T.sub, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                To enable the live feed: request a free token from UCDP (email the API maintainer — see
                GET /api/v1/ucdp/status for the current contact address and process; no self-service signup
                exists) and set <code>UCDP_API_TOKEN</code>.
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Climate Policy Radar stringency panel ───────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Climate Policy Stringency — {focusCountryName}</h2>
          <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' }}>GET /api/v1/climate-policy/country/{focusIso3}</span>
          <div style={{ marginLeft: 'auto' }}>
            <Badge status="demo" demoText="seeded real extract — no live Climate Policy Radar API exists" />
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 12 }}>
          Climate Policy Radar publishes its climate-law/NDC corpus as open dataset exports (Hugging Face,
          GitHub bulk export), not a live API — verified 2026-07-05. This panel therefore shows a hand-authored
          seeded extract of real, verifiable facts (enactment date, legally-binding status, target year, sectoral
          coverage) and a fully documented, transparent stringency score computed from those facts (not a
          black-box number) — see the score breakdown below.
        </div>
        {policy.status === 'loading' && <div style={{ fontSize: 12, color: T.sub }}>Loading…</div>}
        {policy.status === 'no-coverage' && (
          <div style={{ fontSize: 12, color: T.sub }}>
            No seeded climate-policy entry for {focusCountryName} yet — an honest coverage gap, not a fabricated
            result. See GET /api/v1/climate-policy/countries for the current 21-country/bloc seeded extract.
          </div>
        )}
        {policy.data && (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <Kpi label="Stringency score" value={fmtNum(policy.data.score?.stringency_score, 1)} sub="0–100 · higher = more stringent" color={T.teal} />
              <Kpi label="Legal status" value={(policy.data.binding_tier || '—').replace(/_/g, ' ')} sub={policy.data.law_or_pledge_name} />
              <Kpi label="Target" value={`${policy.data.target_type === 'net_zero' ? 'Net zero' : (policy.data.target_type || '—')} ${policy.data.target_year || ''}`} sub={policy.data.enacted_or_announced ? `Enacted/announced ${policy.data.enacted_or_announced}` : ''} />
              <Kpi label="Coverage" value={(policy.data.coverage_tier || '—').replace(/_/g, ' ')} sub={policy.data.interim_desc} />
            </div>
            <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10 }}>
              Score breakdown (documented formula, see backend module docstring): binding {policy.data.score?.binding_points}/40
              + ambition (target-year proximity) {policy.data.score?.ambition_points}/30
              + interim milestone {policy.data.score?.interim_points}/15
              + sectoral coverage {policy.data.score?.coverage_points}/15
              = <b style={{ color: T.teal }}>{policy.data.score?.stringency_score}/100</b>
            </div>
            {policy.data.notes && <div style={{ fontSize: 11.5, color: T.slate, fontStyle: 'italic' }}>{policy.data.notes}</div>}
            <div style={{ fontSize: 10.5, color: T.sub, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>Source: {policy.data.source}</div>
          </>
        )}
        {policy.status === 'demo' && !policy.data && (
          <div style={{ fontSize: 12, color: T.sub }}>Climate policy extract unavailable — {String(policy.error)}</div>
        )}
      </div>

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
        Engines: services/sovereign_climate_risk_engine.py (51 sovereign profiles · NGFS scenarios · ND-GAIN) ·
        services/pcaf_sovereign_engine.py (PCAF Global GHG Standard Part D 2023 · UNFCCC inventories · IMF WEO debt) ·
        api/v1/routes/ucdp_conflict.py (UCDP GED — token-gated live feed, seeded real sample fallback) ·
        api/v1/routes/climate_policy_radar.py (seeded real extract, no live CPR API — documented stringency scorer).
        Portfolio weighting, tier concentration and the attribution join are computed locally from live responses.
      </div>
    </div>
  );
}
