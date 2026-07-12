import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, ReferenceLine,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// NX2-17 — Compliance & National Carbon Mechanisms Desk
// Coverage: national/subnational COMPLIANCE carbon mechanisms (EU ETS, UK ETS,
// WCI, RGGI, EU ETS2, China ETS, K-ETS, India CCTS, Australia Safeguard,
// Japan GX-ETS, Singapore tax, Mexico pilot, CORSIA) + Paris Article 6 layer.
// Live engines (all deterministic, hand-authored regulatory extracts, no PRNG):
//   GET  /api/v1/compliance-carbon/schemes           scheme atlas (labeled extract)
//   GET  /api/v1/compliance-carbon/article6          Art 6.2/6.4 rulebook parameters
//   POST /api/v1/compliance-carbon/itmo-price        ITMO/A6.4ER landed-cost waterfall
//   POST /api/v1/compliance-carbon/compliance-cost   multi-scheme obligation + offset optimizer
//   POST /api/v1/compliance-carbon/cross-border      spread matrix / eligibility / arbitrage
// Composed references:
//   GET /api/v1/carbon-price-ets/ref/ets-systems     (E71 — reconciliation, not duplication)
//   GET /api/v1/carbon-price-ets/ref/cbam-sectors    (CBAM interaction panel)
//   GET /api/v1/dcm/ref/article6-guidance            (DCM Art 6 reference panel)
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

const fmtNum = (v, d = 1) => (v == null || isNaN(v)) ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d });
const fmtUsd = (v, d = 2) => (v == null || isNaN(v)) ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: d })}`;
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
const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 };
const h2s = { margin: 0, fontSize: 15, fontWeight: 800, color: T.navy };
const endpointTag = { fontSize: 10, fontFamily: T.mono, color: T.sub, background: T.cream, borderRadius: 4, padding: '2px 8px' };
const noteStyle = { fontSize: 11, color: T.sub, background: T.cream, border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 10px', marginTop: 8 };
const btnStyle = (enabled = true) => ({
  background: enabled ? T.navy : T.sub, color: '#fff', border: 'none', borderRadius: 8,
  padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: enabled ? 'pointer' : 'not-allowed', fontFamily: T.font,
});

const TYPE_COLOR = {
  cap_and_trade: T.blue, intensity_rate_based: T.purple,
  carbon_tax: T.amber, baseline_and_credit: T.teal,
};
const typeColor = (t) => {
  if (!t) return T.slate;
  if (t.includes('cap_and_trade') && t.includes('baseline')) return T.teal;
  return TYPE_COLOR[t] || (t.includes('baseline') ? T.teal : T.slate);
};
const TYPE_LABEL = {
  cap_and_trade: 'Cap & trade', intensity_rate_based: 'Intensity / rate-based',
  carbon_tax: 'Carbon tax', baseline_and_credit: 'Baseline & credit',
};

const TABS = ['Scheme Atlas', 'Article 6 Desk', 'Compliance Cost', 'Cross-Market', 'Sustainability×Financial'];

// Hand-authored editable default multi-jurisdiction entity — illustrative
// industrial group with obligations in 6 schemes. NOT live data; fully editable.
const DEFAULT_POSITIONS = [
  { id: 1, scheme_id: 'eu_ets', covered: 1000000, free: 400000, baseline: '', override: '' },
  { id: 2, scheme_id: 'china_ets', covered: 2000000, free: 0, baseline: 1800000, override: '' },
  { id: 3, scheme_id: 'korea_ets', covered: 500000, free: 450000, baseline: '', override: '' },
  { id: 4, scheme_id: 'wci_ca_qc', covered: 300000, free: 100000, baseline: '', override: '' },
  { id: 5, scheme_id: 'singapore_tax', covered: 200000, free: 0, baseline: '', override: '' },
  { id: 6, scheme_id: 'aus_safeguard', covered: 400000, free: 0, baseline: 350000, override: '' },
];
const DEFAULT_OFFSETS = [
  { id: 1, unit_type: 'CCER', price: 9, volume: 500000 },
  { id: 2, unit_type: 'KOC', price: 6, volume: 50000 },
  { id: 3, unit_type: 'ACCU', price: 23, volume: 100000 },
  { id: 4, unit_type: 'CCO', price: 15, volume: 50000 },
  { id: 5, unit_type: 'A6_ICC', price: 22, volume: 20000 },
];

export default function ComplianceCarbonDeskPage() {
  const [tab, setTab] = useState(TABS[0]);

  // ── Reference data (fetched once) ─────────────────────────────────────────
  const [schemes, setSchemes] = useState({ status: 'loading', data: null, error: null });
  const [article6, setArticle6] = useState({ status: 'loading', data: null, error: null });
  const [etsRef, setEtsRef] = useState({ status: 'loading', data: null, error: null });
  const [cbamRef, setCbamRef] = useState({ status: 'loading', data: null, error: null });
  const [dcmA6, setDcmA6] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    const fetchInto = (url, setter, pick = (d) => d) => {
      axios.get(url, { timeout: 20000 })
        .then(({ data }) => setter({ status: 'live', data: pick(data), error: null }))
        .catch((e) => setter({ status: 'demo', data: null, error: e?.response?.data?.detail || e.message }));
    };
    fetchInto('/api/v1/compliance-carbon/schemes', setSchemes);
    fetchInto('/api/v1/compliance-carbon/article6', setArticle6);
    fetchInto('/api/v1/carbon-price-ets/ref/ets-systems', setEtsRef);
    fetchInto('/api/v1/carbon-price-ets/ref/cbam-sectors', setCbamRef);
    fetchInto('/api/v1/dcm/ref/article6-guidance', setDcmA6);
  }, []);

  const schemeList = schemes.data?.schemes || [];
  const schemeById = useMemo(() => Object.fromEntries(schemeList.map((s) => [s.id, s])), [schemeList]);

  // ── ITMO pricing calculator state ──────────────────────────────────────────
  const [itmoForm, setItmoForm] = useState({
    base_credit_price_usd: 12, mechanism: '6.4_authorized',
    authorization_premium_pct: 30, ca_risk_score: 30, max_ca_discount_pct: 40,
    apply_sop_62: false, transaction_cost_usd: 1.5, mrv_cost_usd: 1.0,
    domestic_abatement_cost_usd: 60,
  });
  const [itmo, setItmo] = useState({ status: 'idle', data: null, error: null });
  const runItmo = useCallback(async () => {
    setItmo({ status: 'loading', data: null, error: null });
    try {
      const payload = {
        ...itmoForm,
        base_credit_price_usd: parseFloat(itmoForm.base_credit_price_usd),
        authorization_premium_pct: parseFloat(itmoForm.authorization_premium_pct),
        ca_risk_score: parseFloat(itmoForm.ca_risk_score),
        max_ca_discount_pct: parseFloat(itmoForm.max_ca_discount_pct),
        transaction_cost_usd: parseFloat(itmoForm.transaction_cost_usd),
        mrv_cost_usd: parseFloat(itmoForm.mrv_cost_usd),
        domestic_abatement_cost_usd: itmoForm.domestic_abatement_cost_usd === '' ? null : parseFloat(itmoForm.domestic_abatement_cost_usd),
      };
      const { data } = await axios.post('/api/v1/compliance-carbon/itmo-price', payload, { timeout: 20000 });
      setItmo({ status: 'live', data, error: null });
    } catch (e) {
      setItmo({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message });
    }
  }, [itmoForm]);

  // Waterfall data: floating bars via invisible base + delta (deterministic transform of live response)
  const waterfall = useMemo(() => {
    if (!itmo.data) return null;
    let cum = 0;
    const rows = itmo.data.waterfall.map((c) => {
      const v = c.usd_per_t;
      const start = cum;
      cum += v;
      return {
        name: c.component.replace(' (n/a)', ''),
        base: Math.min(start, cum),
        delta: Math.abs(v),
        value: v,
        fill: v < 0 ? T.red : T.gold,
      };
    });
    rows.push({ name: 'Landed cost', base: 0, delta: itmo.data.landed_cost_usd_per_delivered_t, value: itmo.data.landed_cost_usd_per_delivered_t, fill: T.teal });
    return rows;
  }, [itmo.data]);

  // ── Compliance-cost builder state ──────────────────────────────────────────
  const [entityName, setEntityName] = useState('Global Industrials Group (illustrative)');
  const [positions, setPositions] = useState(DEFAULT_POSITIONS);
  const [offsets, setOffsets] = useState(DEFAULT_OFFSETS);
  const [cc, setCc] = useState({ status: 'idle', data: null, error: null });

  const updateRow = (setter) => (id, key, value) => setter((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const updatePosition = updateRow(setPositions);
  const updateOffset = updateRow(setOffsets);
  const addPosition = () => setPositions((p) => [...p, { id: p.length ? Math.max(...p.map((r) => r.id)) + 1 : 1, scheme_id: 'eu_ets', covered: 100000, free: 0, baseline: '', override: '' }]);
  const addOffset = () => setOffsets((p) => [...p, { id: p.length ? Math.max(...p.map((r) => r.id)) + 1 : 1, unit_type: 'CCER', price: 10, volume: 10000 }]);
  const removePosition = (id) => setPositions((p) => p.filter((r) => r.id !== id));
  const removeOffset = (id) => setOffsets((p) => p.filter((r) => r.id !== id));

  const runCompliance = useCallback(async () => {
    setCc({ status: 'loading', data: null, error: null });
    try {
      const payload = {
        entity_name: entityName,
        positions: positions.map((p) => ({
          scheme_id: p.scheme_id,
          covered_emissions_tco2: parseFloat(p.covered) || 0,
          free_allocation_tco2: parseFloat(p.free) || 0,
          baseline_allowed_tco2: p.baseline === '' || p.baseline == null ? null : parseFloat(p.baseline),
          carbon_price_override_usd: p.override === '' || p.override == null ? null : parseFloat(p.override),
        })),
        offset_portfolio: offsets.filter((o) => parseFloat(o.volume) > 0 && parseFloat(o.price) > 0).map((o) => ({
          unit_type: o.unit_type, price_usd: parseFloat(o.price), volume_tco2: parseFloat(o.volume),
        })),
      };
      const { data } = await axios.post('/api/v1/compliance-carbon/compliance-cost', payload, { timeout: 20000 });
      setCc({ status: 'live', data, error: null });
    } catch (e) {
      setCc({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message });
    }
  }, [entityName, positions, offsets]);

  // ── Cross-border state ─────────────────────────────────────────────────────
  const [minSpread, setMinSpread] = useState(2);
  const [xb, setXb] = useState({ status: 'idle', data: null, error: null });
  const runCrossBorder = useCallback(async () => {
    setXb({ status: 'loading', data: null, error: null });
    try {
      const { data } = await axios.post('/api/v1/compliance-carbon/cross-border', {
        unit_prices_usd: {}, min_spread_usd: parseFloat(minSpread) || 0,
      }, { timeout: 20000 });
      setXb({ status: 'live', data, error: null });
    } catch (e) {
      setXb({ status: 'demo', data: null, error: e?.response?.data?.detail ? JSON.stringify(e.response.data.detail) : e.message });
    }
  }, [minSpread]);

  // ── Sustainability × Financial state ───────────────────────────────────────
  const [ebitdaM, setEbitdaM] = useState(500);
  const [passThroughPct, setPassThroughPct] = useState(60);
  const [icpUsd, setIcpUsd] = useState(50);

  const finView = useMemo(() => {
    if (cc.status !== 'live' || !cc.data) return null;
    const ebitda = (parseFloat(ebitdaM) || 0) * 1e6;
    if (ebitda <= 0) return null;
    const pt = Math.min(100, Math.max(0, parseFloat(passThroughPct) || 0)) / 100;
    const rows = cc.data.per_scheme.map((r) => ({
      ...r,
      costPctEbitda: (r.total_cost_usd / ebitda) * 100,
      passedThroughUsd: r.total_cost_usd * pt,
      retainedUsd: r.total_cost_usd * (1 - pt),
      retainedPctEbitda: (r.total_cost_usd * (1 - pt) / ebitda) * 100,
    }));
    const totalPct = (cc.data.total_compliance_cost_usd / ebitda) * 100;
    const retainedTotalPct = totalPct * (1 - pt);
    return { rows, totalPct, retainedTotalPct, pt };
  }, [cc, ebitdaM, passThroughPct]);

  const icpBench = useMemo(() => {
    const icp = parseFloat(icpUsd);
    if (!schemeList.length || isNaN(icp)) return null;
    return schemeList
      .filter((s) => s.price?.usd_per_t != null)
      .map((s) => ({ id: s.id, name: s.name, price: s.price.usd_per_t, aboveIcp: s.price.usd_per_t > icp }))
      .sort((a, b) => b.price - a.price);
  }, [schemeList, icpUsd]);

  // Heat color for spread matrix: red (negative) → cream (0) → green (positive)
  const heatColor = (v, maxAbs) => {
    if (v === 0 || maxAbs === 0) return T.cream;
    const t = Math.min(1, Math.abs(v) / maxAbs);
    const alpha = Math.round(20 + t * 60).toString(16).padStart(2, '0');
    return (v > 0 ? T.green : T.red) + alpha;
  };

  const priceChart = useMemo(() => schemeList
    .filter((s) => s.price?.usd_per_t != null)
    .map((s) => ({ id: s.id, name: s.name.length > 26 ? s.name.slice(0, 24) + '…' : s.name, price: s.price.usd_per_t, type: s.type }))
    .sort((a, b) => b.price - a.price), [schemeList]);

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ background: T.teal, color: '#fff', borderRadius: 8, padding: '6px 14px', fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>NX2-17</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>Compliance & National Carbon Mechanisms</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: T.blue + '22', color: T.blue, border: `1px solid ${T.blue}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>13 compliance mechanisms</span>
          <span style={{ background: T.purple + '22', color: T.purple, border: `1px solid ${T.purple}44`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Article 6.2 / 6.4 rulebook</span>
          <span style={{ background: T.gold + '33', color: T.amber, border: `1px solid ${T.gold}66`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>Deterministic engines — no PRNG</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 14, maxWidth: 1050 }}>
        National, subnational and supranational <b>compliance</b> carbon mechanisms — cap-and-trade, intensity/rate-based,
        carbon tax and baseline-and-credit — plus the Paris Agreement Article 6 market layer (6.2 ITMOs, 6.4 PACM) and CORSIA.
        Scheme parameters are a hand-authored <b>regulatory extract, approximate as of ~2025 — verify against current
        regulation for production</b>. All calculators are deterministic, documented closed-form models.
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? T.navy : T.card, color: tab === t ? '#fff' : T.navy,
            border: `1px solid ${tab === t ? T.navy : T.border}`, borderRadius: 8,
            padding: '8px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
          }}>{t}</button>
        ))}
      </div>

      {/* ═══ TAB 1 — SCHEME ATLAS ═══════════════════════════════════════════ */}
      {tab === 'Scheme Atlas' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2s}>World Coverage</h2>
              <span style={endpointTag}>GET /api/v1/compliance-carbon/schemes</span>
              <div style={{ marginLeft: 'auto' }}><Badge status={schemes.status} demoText={schemes.error} /></div>
            </div>
            {schemes.status === 'live' && schemes.data && (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                  <Kpi label="Mechanisms in atlas" value={schemes.data.total_schemes} sub="incl. CORSIA + EU ETS2 (2027)" />
                  <Kpi label="Global GHG under carbon pricing" value={fmtPct(schemes.data.global_context.carbon_pricing_share_of_global_ghg_pct, 0)} sub="World Bank State & Trends 2024 (approx)" color={T.teal} />
                  <Kpi label="Global GHG under ETS" value={fmtPct(schemes.data.global_context.ets_share_of_global_ghg_pct, 0)} sub="ICAP Status Report 2024 (approx)" color={T.blue} />
                  <Kpi label="Instruments in force" value={schemes.data.global_context.instruments_in_force} sub="taxes + ETS worldwide (approx)" />
                  <Kpi label="2023 carbon revenue" value={`$${fmtNum(schemes.data.global_context.global_carbon_revenue_2023_bn_usd, 0)}bn`} sub="World Bank 2024 (approx)" color={T.gold} />
                </div>
                <div style={noteStyle}>{schemes.data.label}. Coverage KPIs basis: {schemes.data.global_context.basis}.</div>
              </>
            )}
            {schemes.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Scheme atlas engine unreachable — no figures shown (this page never fabricates results). Error: {String(schemes.error)}</div>}
          </div>

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2s}>Price Comparison — schemes with a live price signal</h2>
              <span style={{ ...endpointTag }}>approximate ~2025 levels, USD/t — indicative only</span>
            </div>
            {priceChart.length > 0 && (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={priceChart} margin={{ bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: 'USD/tCO2e (approx)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`$${fmtNum(v, 1)}/t (approx)`, 'Price']} />
                  <Bar dataKey="price" radius={[3, 3, 0, 0]}>
                    {priceChart.map((r) => <Cell key={r.id} fill={typeColor(r.type)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 10.5, color: T.sub, marginTop: 4 }}>
              {Object.entries(TYPE_LABEL).map(([k, v]) => (
                <span key={k}><span style={{ display: 'inline-block', width: 10, height: 10, background: TYPE_COLOR[k], borderRadius: 2, marginRight: 4 }} />{v}</span>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2s}>Mechanism Atlas</h2>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Regulatory extract — approximate parameters ~2025, verify for production</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                <thead>
                  <tr>
                    <th style={th}>Mechanism</th><th style={th}>Type</th><th style={th}>Status</th>
                    <th style={th}>Coverage</th><th style={th}>Covered Mt</th><th style={th}>Price (USD/t)</th>
                    <th style={th}>Offset / credit rules</th><th style={th}>Linkage</th>
                  </tr>
                </thead>
                <tbody>
                  {schemeList.map((s) => (
                    <tr key={s.id}>
                      <td style={{ ...td, fontWeight: 600, color: T.navy, minWidth: 170 }}>
                        {s.name}
                        <div style={{ fontSize: 10, color: T.sub, fontWeight: 400 }}>{s.jurisdiction} · since {s.start_year}{s.ets_ref_id ? ' · E71 xref: ' + s.ets_ref_id : ''}</div>
                      </td>
                      <td style={td}><span style={{ background: typeColor(s.type) + '22', color: typeColor(s.type), borderRadius: 4, padding: '1px 7px', fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{TYPE_LABEL[s.type] || s.type}</span></td>
                      <td style={{ ...td, fontSize: 11 }}>{s.status}</td>
                      <td style={{ ...td, fontSize: 11, maxWidth: 220 }}>{s.coverage_sectors.join('; ')}</td>
                      <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(s.covered_emissions_mt, 0)}</td>
                      <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{s.price.usd_per_t != null ? `$${fmtNum(s.price.usd_per_t, 1)}` : '—'}<div style={{ fontSize: 9.5, color: T.sub, fontWeight: 400 }}>{s.price.as_of}</div></td>
                      <td style={{ ...td, fontSize: 11, maxWidth: 260 }}>
                        {s.offset_rules.eligible_units.length
                          ? <><b style={{ fontFamily: T.mono }}>{s.offset_rules.eligible_units.join(', ')}</b> — {s.offset_rules.limit_pct_of_obligation < 100 ? `≤${s.offset_rules.limit_pct_of_obligation}% of obligation` : 'no % limit'}</>
                          : 'No offsets permitted'}
                        <div style={{ fontSize: 10, color: T.sub }}>{s.offset_rules.notes}</div>
                      </td>
                      <td style={{ ...td, fontSize: 11, maxWidth: 180 }}>{s.linkage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2s}>Reconciliation — E71 ETS Reference Layer</h2>
              <span style={endpointTag}>GET /api/v1/carbon-price-ets/ref/ets-systems</span>
              <div style={{ marginLeft: 'auto' }}><Badge status={etsRef.status} demoText={etsRef.error} /></div>
            </div>
            {etsRef.status === 'live' && etsRef.data && (
              <div style={{ fontSize: 12, color: T.slate }}>
                The E71 carbon-price desk covers <b style={{ fontFamily: T.mono }}>{etsRef.data.total_systems}</b> ETS
                ({Object.keys(etsRef.data.ets_systems || {}).join(', ')}) with global ETS coverage
                of <b>{fmtPct(etsRef.data.global_ets_coverage_pct_ghg, 0)}</b> of GHG (source: {etsRef.data.source}).
                Schemes shared with this atlas carry an <span style={{ fontFamily: T.mono }}>ets_ref_id</span> cross-reference in the table above;
                this desk extends the set with EU ETS2, India CCTS, Australia Safeguard, Japan GX-ETS, Singapore carbon tax, Mexico pilot and CORSIA,
                plus per-scheme offset-eligibility rules. {schemes.data?.reconciliation?.price_note}
              </div>
            )}
            {etsRef.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>E71 reference layer unreachable. Error: {String(etsRef.error)}</div>}
          </div>
        </>
      )}

      {/* ═══ TAB 2 — ARTICLE 6 DESK ═════════════════════════════════════════ */}
      {tab === 'Article 6 Desk' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2s}>Paris Article 6 — Mechanism Structure</h2>
              <span style={endpointTag}>GET /api/v1/compliance-carbon/article6</span>
              <div style={{ marginLeft: 'auto' }}><Badge status={article6.status} demoText={article6.error} /></div>
            </div>
            {article6.status === 'live' && article6.data && (
              <>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 340, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.blue, marginBottom: 4 }}>{article6.data.article_6_2.name}</div>
                    <div style={{ fontSize: 10.5, fontFamily: T.mono, color: T.sub, marginBottom: 8 }}>{article6.data.article_6_2.decision_basis}</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr><td style={{ ...td, fontWeight: 700, width: 150 }}>Unit</td><td style={td}>{article6.data.article_6_2.unit}</td></tr>
                        <tr><td style={{ ...td, fontWeight: 700 }}>Authorization</td><td style={td}>{article6.data.article_6_2.authorization}</td></tr>
                        <tr><td style={{ ...td, fontWeight: 700 }}>Corresponding adjustments</td><td style={td}>{article6.data.article_6_2.corresponding_adjustments.rule}<div style={{ fontSize: 10.5, color: T.sub }}>Single-year NDC: {article6.data.article_6_2.corresponding_adjustments.single_year_ndc} · Multi-year: {article6.data.article_6_2.corresponding_adjustments.multi_year_ndc}</div></td></tr>
                        <tr><td style={{ ...td, fontWeight: 700 }}>First transfer</td><td style={td}>NDC use: {article6.data.article_6_2.first_transfer_definitions.use_toward_ndc}<div style={{ fontSize: 10.5, color: T.sub }}>OIMP/other: {article6.data.article_6_2.first_transfer_definitions.oimp_or_other}</div></td></tr>
                        <tr><td style={{ ...td, fontWeight: 700 }}>SoP / OMGE</td><td style={td}>{article6.data.article_6_2.share_of_proceeds} · OMGE: {article6.data.article_6_2.omge}</td></tr>
                        <tr><td style={{ ...td, fontWeight: 700 }}>Reporting</td><td style={{ ...td, fontSize: 11 }}>{article6.data.article_6_2.reporting_infrastructure.join(' → ')}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ flex: 1, minWidth: 340, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.purple, marginBottom: 4 }}>{article6.data.article_6_4.name}</div>
                    <div style={{ fontSize: 10.5, fontFamily: T.mono, color: T.sub, marginBottom: 8 }}>{article6.data.article_6_4.decision_basis}</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr><td style={{ ...td, fontWeight: 700, width: 150 }}>Unit classes</td><td style={td}>
                          <b>Authorized A6.4ER</b>: {article6.data.article_6_4.unit_classes.authorized_a64er}
                          <div style={{ marginTop: 4 }}><b>MCU</b>: {article6.data.article_6_4.unit_classes.mitigation_contribution_unit}</div>
                        </td></tr>
                        <tr><td style={{ ...td, fontWeight: 700 }}>Share of Proceeds</td><td style={td}><b style={{ fontFamily: T.mono }}>{article6.data.article_6_4.share_of_proceeds_pct}%</b> — {article6.data.article_6_4.share_of_proceeds_note}</td></tr>
                        <tr><td style={{ ...td, fontWeight: 700 }}>OMGE cancellation</td><td style={td}><b style={{ fontFamily: T.mono }}>{article6.data.article_6_4.omge_cancellation_pct}%</b> — {article6.data.article_6_4.omge_note}</td></tr>
                        <tr><td style={{ ...td, fontWeight: 700 }}>Governance</td><td style={{ ...td, fontSize: 11 }}>{article6.data.article_6_4.governance}</td></tr>
                        <tr><td style={{ ...td, fontWeight: 700 }}>CDM transition</td><td style={{ ...td, fontSize: 11 }}>{article6.data.article_6_4.cdm_transition}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div style={noteStyle}>{article6.data.label}. CORSIA interaction: {article6.data.corsia_interaction}</div>
              </>
            )}
            {article6.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Article 6 reference unreachable. Error: {String(article6.error)}</div>}
          </div>

          {/* ITMO pricing calculator */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2s}>ITMO / A6.4ER Pricing Calculator</h2>
              <span style={endpointTag}>POST /api/v1/compliance-carbon/itmo-price</span>
              <div style={{ marginLeft: 'auto' }}><Badge status={itmo.status} demoText={itmo.error} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              {[
                ['base_credit_price_usd', 'Base credit price ($/t)'],
                ['authorization_premium_pct', 'Authorization premium (%)'],
                ['ca_risk_score', 'CA-revocation risk (0–100)'],
                ['max_ca_discount_pct', 'Max CA discount at 100 (%)'],
                ['transaction_cost_usd', 'Transaction cost ($/t)'],
                ['mrv_cost_usd', 'MRV cost ($/t)'],
                ['domestic_abatement_cost_usd', 'Domestic abatement ($/t)'],
              ].map(([k, label]) => (
                <label key={k} style={{ fontSize: 11, color: T.sub, fontWeight: 600, width: 170 }}>
                  {label}
                  <input type="number" style={{ ...inputStyle, marginTop: 3 }} value={itmoForm[k]}
                    onChange={(e) => setItmoForm((f) => ({ ...f, [k]: e.target.value }))} />
                </label>
              ))}
              <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, width: 170 }}>
                Mechanism
                <select style={{ ...inputStyle, marginTop: 3 }} value={itmoForm.mechanism} onChange={(e) => setItmoForm((f) => ({ ...f, mechanism: e.target.value }))}>
                  <option value="6.2">Art 6.2 ITMO</option>
                  <option value="6.4_authorized">A6.4ER (authorized + CA)</option>
                  <option value="6.4_mcu">A6.4ER MCU (no CA)</option>
                </select>
              </label>
              {itmoForm.mechanism === '6.2' && (
                <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', alignItems: 'flex-end', gap: 6, paddingBottom: 6 }}>
                  <input type="checkbox" checked={itmoForm.apply_sop_62} onChange={(e) => setItmoForm((f) => ({ ...f, apply_sop_62: e.target.checked }))} />
                  Voluntarily apply SoP/OMGE (encouraged under 6.2)
                </label>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={runItmo} style={btnStyle()}>Price unit →</button>
              </div>
            </div>

            {itmo.status === 'live' && itmo.data && waterfall && (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                  <Kpi label="Landed cost / delivered t" value={fmtUsd(itmo.data.landed_cost_usd_per_delivered_t)} sub="all layers included" color={T.teal} />
                  <Kpi label="Issued units per delivered" value={fmtNum(itmo.data.issued_units_per_delivered, 4)} sub="SoP 5% + OMGE 2% gross-up (6.4)" />
                  <Kpi label="Effective CA discount" value={fmtPct(itmo.data.effective_ca_discount_pct, 2)} sub="linear map of risk score (documented)" color={T.red} />
                  <Kpi label="Components sum check" value={fmtUsd(itmo.data.components_sum_check)} sub="= landed cost (waterfall closes)" />
                </div>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  <div style={{ flex: 2, minWidth: 400 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Landed-cost build-up (USD/t) — waterfall</div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={waterfall} margin={{ bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v, n, p) => n === 'delta' ? [`$${fmtNum(p?.payload?.value, 2)}/t`, p?.payload?.name] : [null, null]} />
                        <Bar dataKey="base" stackId="wf" fill="transparent" isAnimationActive={false} />
                        <Bar dataKey="delta" stackId="wf" radius={[3, 3, 0, 0]}>
                          {waterfall.map((r, i) => <Cell key={i} fill={r.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1, minWidth: 280 }}>
                    {itmo.data.buy_vs_abate ? (
                      <div style={{ border: `2px solid ${itmo.data.buy_vs_abate.decision.startsWith('BUY') ? T.green : itmo.data.buy_vs_abate.decision.startsWith('ABATE') ? T.amber : T.blue}`, borderRadius: 8, padding: 14 }}>
                        <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', marginBottom: 4 }}>Buy vs abate verdict</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: itmo.data.buy_vs_abate.decision.startsWith('BUY') ? T.green : itmo.data.buy_vs_abate.decision.startsWith('ABATE') ? T.amber : T.blue }}>{itmo.data.buy_vs_abate.decision}</div>
                        <div style={{ fontSize: 11.5, color: T.slate, marginTop: 6 }}>{itmo.data.buy_vs_abate.reason}</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                          <tbody>
                            <tr><td style={td}>Landed cost</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmtUsd(itmo.data.buy_vs_abate.landed_cost_usd_t)}</td></tr>
                            <tr><td style={td}>Domestic abatement</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right' }}>{fmtUsd(itmo.data.buy_vs_abate.domestic_abatement_usd_t)}</td></tr>
                            <tr><td style={{ ...td, fontWeight: 700 }}>Saving per t if buying</td><td style={{ ...td, fontFamily: T.mono, textAlign: 'right', fontWeight: 700, color: itmo.data.buy_vs_abate.saving_usd_t_if_buy >= 0 ? T.green : T.red }}>{fmtUsd(itmo.data.buy_vs_abate.saving_usd_t_if_buy)}</td></tr>
                          </tbody>
                        </table>
                      </div>
                    ) : <div style={{ fontSize: 12, color: T.sub }}>Provide a domestic abatement cost to get a buy-vs-abate verdict.</div>}
                    <div style={noteStyle}>
                      <b>Model (documented):</b> {itmo.data.methodology.ca_discount_mapping}. Levies: {itmo.data.methodology.levies}. {itmo.data.methodology.note}.
                    </div>
                  </div>
                </div>
              </>
            )}
            {itmo.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Pricing engine unreachable — no figures shown. Error: {String(itmo.error)}</div>}
            {itmo.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Set the unit parameters and price. SoP 5% / OMGE 2% (Decision 3/CMA.3) are applied automatically for 6.4 units.</div>}
          </div>

          {/* Bilateral agreements */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2s}>Sovereign Buyer Programs & Bilateral Agreements</h2>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Hand-authored reference — confidence labeled per row, verify current lists</span>
            </div>
            {article6.status === 'live' && article6.data && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Buyer</th><th style={th}>Program</th><th style={th}>Model</th><th style={th}>Example agreements</th><th style={th}>Confidence</th></tr></thead>
                <tbody>
                  {article6.data.buyer_programs.map((b) => (
                    <tr key={b.buyer}>
                      <td style={{ ...td, fontWeight: 700, color: T.navy }}>{b.buyer}</td>
                      <td style={{ ...td, fontSize: 11 }}>{b.program}</td>
                      <td style={{ ...td, fontSize: 11, maxWidth: 260 }}>{b.model}</td>
                      <td style={{ ...td, fontSize: 11, maxWidth: 280 }}>{b.example_agreements.length ? b.example_agreements.join(' · ') : '—'}</td>
                      <td style={{ ...td, fontSize: 10.5, color: T.amber }}>{b.confidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* DCM Article 6 reference panel */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2s}>Cross-Reference — DCM Article 6 Guidance</h2>
              <span style={endpointTag}>GET /api/v1/dcm/ref/article6-guidance</span>
              <div style={{ marginLeft: 'auto' }}><Badge status={dcmA6.status} demoText={dcmA6.error} /></div>
            </div>
            {dcmA6.status === 'live' && dcmA6.data && (
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {['article_6_2', 'article_6_4'].map((k) => (
                  <div key={k} style={{ flex: 1, minWidth: 300, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 4 }}>{k === 'article_6_2' ? 'Art 6.2 (DCM view)' : 'Art 6.4 (DCM view)'}</div>
                    <div style={{ fontSize: 11, color: T.slate, marginBottom: 6 }}>{dcmA6.data[k].description}</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: T.slate }}>
                      {dcmA6.data[k].key_requirements.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                ))}
                <div style={{ flex: 1, minWidth: 260, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginBottom: 4 }}>Corresponding adjustments & CORSIA (DCM view)</div>
                  <div style={{ fontSize: 11, color: T.slate, fontFamily: T.mono, marginBottom: 6 }}>{dcmA6.data.corresponding_adjustments.formula}</div>
                  <div style={{ fontSize: 11, color: T.slate }}>Timing: {dcmA6.data.corresponding_adjustments.timing}</div>
                  <div style={{ fontSize: 11, color: T.slate, marginTop: 6 }}>CORSIA: {dcmA6.data.corsia.phase} · {dcmA6.data.corsia.eligible_offsets}</div>
                </div>
              </div>
            )}
            {dcmA6.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>DCM reference unreachable. Error: {String(dcmA6.error)}</div>}
          </div>
        </>
      )}

      {/* ═══ TAB 3 — COMPLIANCE COST ════════════════════════════════════════ */}
      {tab === 'Compliance Cost' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2s}>Multi-Jurisdiction Entity Builder</h2>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Editable defaults — illustrative entity, not live positions</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <input style={{ ...inputStyle, width: 280 }} value={entityName} onChange={(e) => setEntityName(e.target.value)} />
                <button onClick={runCompliance} disabled={!positions.length} style={btnStyle(positions.length > 0)}>Compute compliance cost →</button>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 10 }}>
              One row per scheme obligation. Cap-and-trade uses <b>free allocation</b>; intensity/baseline schemes use <b>allowed emissions</b> (output × benchmark or facility baseline);
              taxes apply to all covered emissions. Schemes without a live price (India CCTS, EU ETS2, GX-ETS, Mexico) need a <b>price override</b>.
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
                <thead>
                  <tr>
                    <th style={th}>Scheme</th><th style={th}>Covered emissions (tCO2e)</th><th style={th}>Free allocation (t)</th>
                    <th style={th}>Baseline allowed (t)</th><th style={th}>Price override ($/t)</th><th style={{ ...th, width: 50 }} />
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const s = schemeById[p.scheme_id];
                    return (
                      <tr key={p.id}>
                        <td style={{ ...td, minWidth: 240 }}>
                          <select style={inputStyle} value={p.scheme_id} onChange={(e) => updatePosition(p.id, 'scheme_id', e.target.value)}>
                            {schemeList.map((sc) => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                          </select>
                          {s && <div style={{ fontSize: 9.5, color: T.sub, marginTop: 2 }}>{TYPE_LABEL[s.type] || s.type} · offsets: {s.offset_rules.eligible_units.join(', ') || 'none'} {s.offset_rules.eligible_units.length ? `≤${s.offset_rules.limit_pct_of_obligation}%` : ''}</div>}
                        </td>
                        <td style={td}><input type="number" min="0" style={inputStyle} value={p.covered} onChange={(e) => updatePosition(p.id, 'covered', e.target.value)} /></td>
                        <td style={td}><input type="number" min="0" style={inputStyle} value={p.free} onChange={(e) => updatePosition(p.id, 'free', e.target.value)} /></td>
                        <td style={td}><input type="number" min="0" style={inputStyle} value={p.baseline} placeholder="intensity/baseline only" onChange={(e) => updatePosition(p.id, 'baseline', e.target.value)} /></td>
                        <td style={td}><input type="number" min="0" style={inputStyle} value={p.override} placeholder="optional" onChange={(e) => updatePosition(p.id, 'override', e.target.value)} /></td>
                        <td style={td}><button onClick={() => removePosition(p.id)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.red, cursor: 'pointer', fontSize: 11, padding: '4px 8px' }}>✕</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button onClick={addPosition} style={{ marginTop: 8, background: 'transparent', border: `1px dashed ${T.navy}66`, borderRadius: 8, color: T.navy, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '6px 14px' }}>+ Add scheme position</button>

            <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, marginTop: 14, marginBottom: 6 }}>Offset / credit portfolio (shared inventory across schemes)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: 640 }}>
              <thead><tr><th style={th}>Unit type</th><th style={th}>Price ($/t)</th><th style={th}>Volume (tCO2e)</th><th style={{ ...th, width: 50 }} /></tr></thead>
              <tbody>
                {offsets.map((o) => (
                  <tr key={o.id}>
                    <td style={td}>
                      <select style={inputStyle} value={o.unit_type} onChange={(e) => updateOffset(o.id, 'unit_type', e.target.value)}>
                        {['CCER', 'KOC', 'ACCU', 'SMC', 'CCO', 'A6_ICC', 'CORSIA_EEU', 'CCC', 'J_CREDIT', 'JCM', 'RGGI_OFFSET', 'MX_OFFSET'].map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td style={td}><input type="number" min="0" style={inputStyle} value={o.price} onChange={(e) => updateOffset(o.id, 'price', e.target.value)} /></td>
                    <td style={td}><input type="number" min="0" style={inputStyle} value={o.volume} onChange={(e) => updateOffset(o.id, 'volume', e.target.value)} /></td>
                    <td style={td}><button onClick={() => removeOffset(o.id)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, color: T.red, cursor: 'pointer', fontSize: 11, padding: '4px 8px' }}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addOffset} style={{ marginTop: 8, background: 'transparent', border: `1px dashed ${T.navy}66`, borderRadius: 8, color: T.navy, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '6px 14px' }}>+ Add offset lot</button>
          </div>

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2s}>Obligations, Offset Optimization & Marginal Cost</h2>
              <span style={endpointTag}>POST /api/v1/compliance-carbon/compliance-cost</span>
              <div style={{ marginLeft: 'auto' }}><Badge status={cc.status} demoText={cc.error} /></div>
            </div>
            {cc.status === 'live' && cc.data && (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <Kpi label="Total compliance cost" value={fmtUsd(cc.data.total_compliance_cost_usd, 0)} sub={cc.data.entity_name} color={T.navy} />
                  <Kpi label="Savings from offsets" value={fmtUsd(cc.data.total_savings_from_offsets_usd, 0)} sub="vs surrendering allowances / paying tax only" color={T.green} />
                  <Kpi label="Schemes" value={cc.data.per_scheme.length} sub="jurisdictional obligations" />
                  <Kpi label="Gross obligation" value={`${fmtNum(cc.data.per_scheme.reduce((s, r) => s + r.gross_obligation_tco2, 0), 0)} t`} sub="after free allocation / baselines" />
                </div>

                <div style={{ overflowX: 'auto', marginBottom: 14 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
                    <thead>
                      <tr>
                        <th style={th}>Scheme</th><th style={th}>Price $/t</th><th style={th}>Gross obligation (t)</th>
                        <th style={th}>Offset cap (t / %)</th><th style={th}>Offsets used (t)</th><th style={th}>Cap utilization</th>
                        <th style={th}>Residual (t)</th><th style={th}>Offset cost</th><th style={th}>Allowance / tax cost</th>
                        <th style={th}>Total</th><th style={th}>Marginal $/t</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cc.data.per_scheme.map((r) => (
                        <tr key={r.scheme_id}>
                          <td style={{ ...td, fontWeight: 600, color: T.navy }}>{r.scheme_name}<div style={{ fontSize: 9.5, color: T.sub, fontWeight: 400 }}>{TYPE_LABEL[r.type] || r.type}</div></td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.carbon_price_usd_t, 1)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.gross_obligation_tco2, 0)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.offset_cap_tco2, 0)} / {fmtPct(r.offset_limit_pct, 0)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.offsets_used_tco2, 0)}
                            {r.offsets_used_detail.length > 0 && <div style={{ fontSize: 9.5, color: T.sub }}>{r.offsets_used_detail.map((u) => `${u.unit_type} ${fmtNum(u.tco2, 0)}t@$${u.price_usd}`).join(' · ')}</div>}
                          </td>
                          <td style={td}>
                            <div style={{ background: T.cream, borderRadius: 4, height: 14, width: 90, position: 'relative', border: `1px solid ${T.border}` }}>
                              <div style={{ background: r.offset_utilization_pct_of_cap >= 99.9 ? T.amber : T.teal, width: `${Math.min(100, r.offset_utilization_pct_of_cap)}%`, height: '100%', borderRadius: 3 }} />
                              <span style={{ position: 'absolute', top: 0, left: 4, fontSize: 9, fontFamily: T.mono, color: T.navy }}>{fmtPct(r.offset_utilization_pct_of_cap, 0)}</span>
                            </div>
                          </td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(r.residual_obligation_tco2, 0)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtUsd(r.offset_cost_usd, 0)}</td>
                          <td style={{ ...td, fontFamily: T.mono }}>{fmtUsd(r.allowance_or_tax_cost_usd, 0)}</td>
                          <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{fmtUsd(r.total_cost_usd, 0)}</td>
                          <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: T.indigo }}>{fmtNum(r.marginal_cost_usd_t, 1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 380 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Marginal cost of one more tonne, per scheme (USD/t)</div>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={cc.data.per_scheme.map((r) => ({ name: r.scheme_id, marginal: r.marginal_cost_usd_t, price: r.carbon_price_usd_t }))} margin={{ bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: T.mono }} angle={-20} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v, n) => [`$${fmtNum(v, 2)}/t`, n === 'marginal' ? 'Marginal (with offsets)' : 'Scheme price']} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="price" name="Scheme carbon price" fill={T.navy} radius={[3, 3, 0, 0]} />
                        <Bar dataKey="marginal" name="Marginal cost (offset-aware)" fill={T.gold} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1, minWidth: 320 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Remaining offset inventory after optimization</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={th}>Unit</th><th style={th}>Price $/t</th><th style={th}>Remaining (t)</th></tr></thead>
                      <tbody>
                        {cc.data.offset_inventory_remaining.map((l, i) => (
                          <tr key={i}>
                            <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{l.unit_type}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(l.price_usd, 2)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(l.remaining_tco2, 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={noteStyle}><b>Optimizer (documented):</b> {cc.data.methodology.offset_optimization}. Obligation rule: {cc.data.methodology.obligation}.</div>
                  </div>
                </div>
              </>
            )}
            {cc.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Compliance-cost engine unreachable or input rejected — no figures shown. Error: {String(cc.error)}</div>}
            {cc.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Build the entity above and compute. The optimizer deploys the cheapest eligible units first, clipped exactly at each scheme's % limit.</div>}
          </div>
        </>
      )}

      {/* ═══ TAB 4 — CROSS-MARKET ═══════════════════════════════════════════ */}
      {tab === 'Cross-Market' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2s}>Compliance vs Voluntary — Cross-Market Analytics</h2>
              <span style={endpointTag}>POST /api/v1/compliance-carbon/cross-border</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
                <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Min net spread ($/t)
                  <input type="number" min="0" style={{ ...inputStyle, width: 80 }} value={minSpread} onChange={(e) => setMinSpread(e.target.value)} />
                </label>
                <button onClick={runCrossBorder} style={btnStyle()}>Run analytics →</button>
                <Badge status={xb.status} demoText={xb.error} />
              </div>
            </div>
            {xb.status === 'idle' && <div style={{ fontSize: 12, color: T.sub }}>Run to compute the inter-scheme spread matrix, unit eligibility matrix and arbitrage candidates. Unit prices are hand-authored ~2025 indicative defaults (labeled) — the engine accepts overrides.</div>}
            {xb.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>Cross-border engine unreachable — no figures shown. Error: {String(xb.error)}</div>}
            {xb.status === 'live' && xb.data && <div style={noteStyle}>{xb.data.label}. {xb.data.methodology.note}</div>}
          </div>

          {xb.status === 'live' && xb.data && (
            <>
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.navy, marginBottom: 4 }}>Inter-Scheme Price Spread Matrix (row − column, USD/t)</div>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 10 }}>{xb.data.matrix_property}. Green: row market prices carbon above column market — the shadow value of segmentation, not an executable trade unless a unit is eligible in both.</div>
                <div style={{ overflowX: 'auto' }}>
                  {(() => {
                    const ids = Object.keys(xb.data.scheme_spread_matrix);
                    const maxAbs = Math.max(...ids.flatMap((a) => ids.map((b) => Math.abs(xb.data.scheme_spread_matrix[a][b]))));
                    return (
                      <table style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr><th style={th} />{ids.map((b) => <th key={b} style={{ ...th, textAlign: 'center' }}>{b}</th>)}</tr>
                        </thead>
                        <tbody>
                          {ids.map((a) => (
                            <tr key={a}>
                              <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{a}<div style={{ fontSize: 9, color: T.sub, fontWeight: 400 }}>${fmtNum(xb.data.scheme_prices_usd[a], 1)}/t</div></td>
                              {ids.map((b) => {
                                const v = xb.data.scheme_spread_matrix[a][b];
                                return <td key={b} style={{ ...td, fontFamily: T.mono, textAlign: 'center', background: heatColor(v, maxAbs), minWidth: 70 }}>{a === b ? '·' : fmtNum(v, 1)}</td>;
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>

              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.navy, marginBottom: 4 }}>Unit × Scheme Surrender-Eligibility Matrix</div>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 10 }}>Mirrors the /schemes offset rules — which unit can legally be surrendered where (✓), before % usage caps.</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr><th style={th}>Unit (price $/t)</th>{Object.keys(schemeById).map((sid) => <th key={sid} style={{ ...th, textAlign: 'center', fontSize: 9 }}>{sid}</th>)}</tr>
                    </thead>
                    <tbody>
                      {Object.entries(xb.data.eligibility_matrix).map(([u, row]) => (
                        <tr key={u}>
                          <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{u} <span style={{ color: T.sub, fontWeight: 400 }}>(${fmtNum(xb.data.unit_prices_usd[u], 1)})</span></td>
                          {Object.keys(schemeById).map((sid) => (
                            <td key={sid} style={{ ...td, textAlign: 'center', background: row[sid] ? T.green + '22' : undefined, color: row[sid] ? T.green : T.border, fontWeight: 700 }}>{row[sid] ? '✓' : '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ ...card, flex: 1.2, minWidth: 420 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: T.navy, marginBottom: 4 }}>Arbitrage Candidates (net of fungibility haircut)</div>
                  <div style={{ fontSize: 11, color: T.sub, marginBottom: 10 }}>net = scheme price − unit price − haircut. {xb.data.methodology.spread}.</div>
                  {xb.data.arbitrage_candidates.length ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={th}>Unit</th><th style={th}>Deliver into</th><th style={th}>Unit $/t</th><th style={th}>Scheme $/t</th><th style={th}>Gross</th><th style={th}>Haircut</th><th style={th}>Net spread</th><th style={th}>Usage cap</th></tr></thead>
                      <tbody>
                        {xb.data.arbitrage_candidates.map((c, i) => (
                          <tr key={i}>
                            <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{c.unit}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{c.deliver_into}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(c.unit_price_usd, 1)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(c.scheme_price_usd, 1)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtNum(c.gross_spread_usd, 1)}</td>
                            <td style={{ ...td, fontFamily: T.mono, color: T.red }}>−{fmtNum(c.fungibility_haircut_usd, 1)}</td>
                            <td style={{ ...td, fontFamily: T.mono, fontWeight: 700, color: T.green }}>{fmtNum(c.net_spread_usd, 1)}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtPct(c.usage_cap_pct_of_obligation, 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <div style={{ fontSize: 12, color: T.sub }}>No candidates clear the minimum net spread at current indicative prices.</div>}
                  <div style={noteStyle}>Caveat: {xb.data.arbitrage_candidates[0]?.caveat || 'subject to scheme % usage caps, eligibility lists and settlement frictions'}. Default haircut for untabled units: {xb.data.default_haircut_pct_when_untabled}% (documented).</div>
                </div>
                <div style={{ ...card, flex: 1, minWidth: 380 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: T.navy, marginBottom: 4 }}>Fungibility Discount Table (documented desk reasoning)</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr><th style={th}>Unit</th><th style={th}>Discount</th><th style={th}>Reasoning</th></tr></thead>
                    <tbody>
                      {xb.data.fungibility_discounts.map((d) => (
                        <tr key={d.unit}>
                          <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{d.unit}</td>
                          <td style={{ ...td, fontFamily: T.mono, color: d.discount_pct >= 40 ? T.red : d.discount_pct >= 15 ? T.amber : T.green }}>{fmtPct(d.discount_pct, 0)}</td>
                          <td style={{ ...td, fontSize: 10.5 }}>{d.reasoning}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ═══ TAB 5 — SUSTAINABILITY × FINANCIAL ═════════════════════════════ */}
      {tab === 'Sustainability×Financial' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2s}>Compliance Cost vs Earnings</h2>
              <span style={endpointTag}>derived locally from the live /compliance-cost result</span>
              <div style={{ marginLeft: 'auto' }}><Badge status={cc.status} demoText={cc.error} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, width: 180 }}>
                Entity EBITDA ($M)
                <input type="number" min="0" style={{ ...inputStyle, marginTop: 3 }} value={ebitdaM} onChange={(e) => setEbitdaM(e.target.value)} />
              </label>
              <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, width: 220 }}>
                Carbon-cost pass-through rate (%)
                <input type="number" min="0" max="100" style={{ ...inputStyle, marginTop: 3 }} value={passThroughPct} onChange={(e) => setPassThroughPct(e.target.value)} />
              </label>
              <label style={{ fontSize: 11, color: T.sub, fontWeight: 600, width: 200 }}>
                Internal carbon price ($/t)
                <input type="number" min="0" style={{ ...inputStyle, marginTop: 3 }} value={icpUsd} onChange={(e) => setIcpUsd(e.target.value)} />
              </label>
            </div>
            {cc.status !== 'live' && <div style={{ fontSize: 12, color: T.amber }}>Run the calculator on the <b>Compliance Cost</b> tab first — this view reuses that live result; nothing is fabricated here.</div>}
            {finView && (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                  <Kpi label="Compliance cost / EBITDA" value={fmtPct(finView.totalPct, 2)} sub="all schemes, pre pass-through" color={finView.totalPct > 5 ? T.red : finView.totalPct > 2 ? T.amber : T.green} />
                  <Kpi label="Retained after pass-through" value={fmtPct(finView.retainedTotalPct, 2)} sub={`at ${fmtPct(finView.pt * 100, 0)} pass-through — % of EBITDA`} color={T.indigo} />
                  <Kpi label="Passed to customers" value={fmtUsd(cc.data.total_compliance_cost_usd * finView.pt, 0)} sub="pricing power assumption, documented" />
                  <Kpi label="Total compliance cost" value={fmtUsd(cc.data.total_compliance_cost_usd, 0)} sub="from live /compliance-cost run" />
                </div>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1.2, minWidth: 420 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Cost as % of EBITDA per scheme — retained vs passed through</div>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={finView.rows.map((r) => ({ name: r.scheme_id, retained: r.retainedPctEbitda, passed: r.costPctEbitda - r.retainedPctEbitda }))} margin={{ bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: T.mono }} angle={-20} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 10 }} label={{ value: '% of EBITDA', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                        <Tooltip formatter={(v, n) => [fmtPct(v, 3), n === 'retained' ? 'Retained (margin hit)' : 'Passed through']} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="retained" name="Retained (margin hit)" stackId="a" fill={T.red} />
                        <Bar dataKey="passed" name="Passed through" stackId="a" fill={T.gold} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div style={noteStyle}>
                      <b>Pass-through model (documented):</b> retained cost = total × (1 − pass-through rate); the rate proxies demand elasticity and market power
                      (EU ETS empirical literature spans roughly 30–100% by sector — power near-full, trade-exposed industry lower). Single-rate simplification, user-set, not a forecast.
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 360 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Per-scheme detail</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={th}>Scheme</th><th style={th}>Cost</th><th style={th}>% EBITDA</th><th style={th}>Retained</th></tr></thead>
                      <tbody>
                        {finView.rows.map((r) => (
                          <tr key={r.scheme_id}>
                            <td style={{ ...td, fontFamily: T.mono }}>{r.scheme_id}</td>
                            <td style={{ ...td, fontFamily: T.mono }}>{fmtUsd(r.total_cost_usd, 0)}</td>
                            <td style={{ ...td, fontFamily: T.mono, fontWeight: 700 }}>{fmtPct(r.costPctEbitda, 3)}</td>
                            <td style={{ ...td, fontFamily: T.mono, color: T.red }}>{fmtUsd(r.retainedUsd, 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2s}>Internal Carbon Price Benchmarking</h2>
              <span style={endpointTag}>ICP (user input) vs scheme prices from live /schemes</span>
            </div>
            {icpBench && (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={icpBench.map((s) => ({ name: s.id, price: s.price }))} margin={{ bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: T.mono }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: 'USD/t', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`$${fmtNum(v, 1)}/t`, 'Scheme price (approx)']} />
                  <ReferenceLine y={parseFloat(icpUsd) || 0} stroke={T.indigo} strokeWidth={2} strokeDasharray="6 3" label={{ value: `ICP $${icpUsd}/t`, fontSize: 10, fill: T.indigo, position: 'insideTopRight' }} />
                  <Bar dataKey="price" radius={[3, 3, 0, 0]}>
                    {icpBench.map((s) => <Cell key={s.id} fill={s.aboveIcp ? T.red : T.teal} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <div style={{ fontSize: 11.5, color: T.slate }}>
              Schemes priced <span style={{ color: T.red, fontWeight: 700 }}>above</span> your internal carbon price expose unhedged compliance-cost risk relative
              to internal planning; schemes <span style={{ color: T.teal, fontWeight: 700 }}>below</span> imply your ICP already over-provisions. Scheme prices are
              approximate ~2025 extract levels — indicative benchmarking only.
            </div>
          </div>

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={h2s}>CBAM Interaction</h2>
              <span style={endpointTag}>GET /api/v1/carbon-price-ets/ref/cbam-sectors</span>
              <div style={{ marginLeft: 'auto' }}><Badge status={cbamRef.status} demoText={cbamRef.error} /></div>
            </div>
            {cbamRef.status === 'live' && cbamRef.data && (
              <>
                <div style={{ fontSize: 12, color: T.slate, marginBottom: 10 }}>
                  The EU Carbon Border Adjustment Mechanism ({cbamRef.data.regulation}) prices embedded emissions of imports in <b>{cbamRef.data.total_sectors} sectors</b> at the EUA price,
                  crediting any <b>carbon price effectively paid in the country of origin</b> — so every national scheme in this atlas directly reduces CBAM exposure for its exporters.
                  Certificates purchasable from 2026; EU ETS free allocation phases out to 2034 in parallel. Non-EU import value in scope:
                  ~€{fmtNum(cbamRef.data.total_import_coverage_bn_eur, 0)}bn.
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(cbamRef.data.sectors || {}).map(([k, s]) => (
                    <div key={k} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', minWidth: 150 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: T.navy, textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
                        {s.import_bn_eur_from_noneu != null ? `€${fmtNum(s.import_bn_eur_from_noneu, 1)}bn non-EU imports` : ''}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={noteStyle}>
                  Interaction note: for a multi-scheme entity, paying a <b>domestic</b> carbon price (China ETS, India CCTS once priced, Türkiye's planned ETS…)
                  becomes partially <b>CBAM-deductible</b> on EU-bound exports — effectively converting local compliance cost into avoided border cost. The
                  compliance-cost optimizer on the previous tab therefore understates the value of domestic pricing for EU exporters (documented limitation).
                </div>
              </>
            )}
            {cbamRef.status === 'demo' && <div style={{ fontSize: 12, color: T.sub }}>CBAM reference unreachable — no figures shown. Error: {String(cbamRef.error)}</div>}
          </div>
        </>
      )}

      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>
        Engine: api/v1/routes/compliance_carbon.py — hand-authored regulatory extract (approx ~2025, labeled) + deterministic
        closed-form calculators (no PRNG). Composed refs: carbon-price-ets (E71 ETS systems, CBAM sectors) · dcm (Article 6 guidance).
        EBITDA/pass-through/ICP analytics are computed locally from the live /compliance-cost and /schemes responses.
      </div>
    </div>
  );
}
