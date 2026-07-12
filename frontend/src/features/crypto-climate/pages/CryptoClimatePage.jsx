import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const CRYPTO_API = `${API}/api/v1/crypto-climate`;
const T={bg:'#f4f6f9',surface:'#ffffff',surfaceH:'#eef1f6',border:'#e3e8ef',borderL:'#cfd6e0',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const seed = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// Maps the frontend's lowercase mechanism codes to the exact consensus-mechanism
// strings the backend/services/crypto_climate_engine.py CONSENSUS_GHG_INTENSITY
// table keys on ("PoW" | "PoS" | "DPoS" | "PoA" | "PoH").
const MECHANISM_API = { pow: 'PoW', pos: 'PoS', dpos: 'DPoS', poa: 'PoA' };
// Maps the frontend's asset-type/standard option values to the engine's exact keys.
const ASSET_TYPE_API = { green_bond: 'green_bond', carbon_credit: 'carbon_credit', renewable_certificate: 'green_certificate' };
const STANDARD_API = { gold_standard: 'Gold_Standard', vcs: 'VCS', eu_gbs: 'EU_GBS' };
const MICA_REQ_LABELS = {
  energy_consumption_annual_disclosure: 'Annual energy consumption disclosure',
  renewable_energy_pct_disclosure: 'Renewable energy % disclosure',
  consensus_mechanism_description: 'Consensus mechanism description (white paper)',
  ghg_emissions_scope1_scope2: 'GHG emissions (Scope 1 & 2) disclosure',
  environmental_impact_assessment: 'Environmental impact assessment',
  waste_electrical_equipment_disclosure: 'Waste electrical equipment disclosure',
  water_consumption_disclosure: 'Water consumption disclosure',
  biodiversity_impact_assessment: 'Biodiversity impact assessment',
  scope3_value_chain_emissions: 'Scope 3 value chain emissions',
  paris_alignment_statement: 'Paris Agreement alignment statement',
  third_party_assurance: 'Third-party assurance',
};

const Badge = ({ val, color, bg }) => (
  <span style={{ background: bg || '#e0e7ff', color: color || '#3730a3', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginLeft: 8 }}>{val}</span>
);
const StatusBadge = ({ status, liveLabel }) => {
  if (status === 'live') return <Badge val={liveLabel || '● Live — E76 crypto_climate_engine'} color="#166534" bg="#dcfce7" />;
  if (status === 'demo') return <Badge val="○ Demo Data — API unavailable" color="#92400e" bg="#fef3c7" />;
  if (status === 'loading') return <Badge val="…" color="#374151" bg="#f3f4f6" />;
  return null;
};

const KpiCard = ({ label, value, sub }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px', background: 'white' }}>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: '#1b3a5c' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{sub}</div>}
  </div>
);
const Btn = ({ children, onClick, variant = 'primary' }) => (
  <button onClick={onClick} style={{
    padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
    background: variant === 'primary' ? '#059669' : '#f3f4f6',
    color: variant === 'primary' ? 'white' : '#374151', fontWeight: 600, fontSize: 14,
  }}>{children}</button>
);
const Inp = ({ label, value, onChange, type = 'text', placeholder = '' }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</div>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
  </div>
);
const Sel = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, background: 'white' }}>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  </div>
);
const Section = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontSize: 16, fontWeight: 600, color: '#1b3a5c', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #059669' }}>{title}</div>
    {children}
  </div>
);
const Row = ({ children, gap = 12 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${React.Children.count(children)},1fr)`, gap }}>{children}</div>
);

const TABS = ['Asset Assessment', 'Mining Geography', 'MiCA Compliance', 'Tokenised Green Assets', 'Portfolio View'];
const COUNTRIES = ['US','CN','KZ','RU','CA','DE','NO','IS','SE','IR','MY','AU','KR','GB','NG'];
const MECHANISMS = [
  { value: 'pow', label: 'Proof of Work (PoW)' },
  { value: 'pos', label: 'Proof of Stake (PoS)' },
  { value: 'dpos', label: 'Delegated PoS (DPoS)' },
  { value: 'poa', label: 'Proof of Authority (PoA)' },
];
const ASSET_TYPES = [
  { value: 'green_bond', label: 'Green Bond' },
  { value: 'carbon_credit', label: 'Carbon Credit' },
  { value: 'renewable_certificate', label: 'Renewable Certificate' },
];
const STANDARDS = [
  { value: 'gold_standard', label: 'Gold Standard' },
  { value: 'vcs', label: 'Verified Carbon Standard (VCS)' },
  { value: 'eu_gbs', label: 'EU Green Bond Standard' },
];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b'];

// Seeded chart data
const competitorEnergy = [
  { name: 'BTC', lower: 85, central: 110, upper: 140 },
  { name: 'ETH', lower: 0.005, central: 0.008, upper: 0.012 },
  { name: 'SOL', lower: 0.001, central: 0.002, upper: 0.003 },
  { name: 'Target', lower: seed(7) * 5, central: seed(8) * 8, upper: seed(9) * 12 },
];
const countryIntensity = COUNTRIES.slice(0, 10).map((c, i) => ({
  name: c,
  intensity: Math.round(200 + seed(i + 20) * 600),
}));
const portfolioHoldings = [
  { asset: 'Bitcoin', mechanism: 'PoW', energy: 110.2, tco2e: 52100, mica: 'Partial', tier: 'High' },
  { asset: 'Ethereum', mechanism: 'PoS', energy: 0.008, tco2e: 3200, mica: 'Full', tier: 'Low' },
  { asset: 'Solana', mechanism: 'PoS', energy: 0.002, tco2e: 890, mica: 'Basic', tier: 'Low' },
  { asset: 'Litecoin', mechanism: 'PoW', energy: 0.42, tco2e: 1840, mica: 'Missing', tier: 'Medium' },
  { asset: 'Cardano', mechanism: 'PoS', energy: 0.006, tco2e: 510, mica: 'Full', tier: 'Low' },
  { asset: 'Monero', mechanism: 'PoW', energy: 0.38, tco2e: 1650, mica: 'Missing', tier: 'High' },
];
const piData = [
  { name: 'Proof of Work', value: 65 },
  { name: 'Proof of Stake', value: 30 },
  { name: 'Other', value: 5 },
];
const premiumData = ['gold_standard', 'vcs', 'eu_gbs'].map((s, i) => ({
  name: s.replace('_', ' ').toUpperCase(),
  green_bond: Math.round(15 + seed(i * 3 + 1) * 40),
  carbon_credit: Math.round(8 + seed(i * 3 + 2) * 30),
  renewable_cert: Math.round(5 + seed(i * 3 + 3) * 25),
}));

export default function CryptoClimatePage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);

  // Tab 1
  const [assetName, setAssetName] = useState('MyToken');
  const [ticker, setTicker] = useState('MTK');
  const [mechanism, setMechanism] = useState('pow');
  const [hashrate, setHashrate] = useState('5');
  const [dailyTx, setDailyTx] = useState('100000');
  const [assess, setAssess] = useState(null);
  const [assessStatus, setAssessStatus] = useState('idle'); // 'idle' | 'loading' | 'live' | 'demo'

  // Tab 2
  const [country, setCountry] = useState('US');
  const [miningShare, setMiningShare] = useState('12');
  const [mHashrate, setMHashrate] = useState('25');
  const [geoResult, setGeoResult] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle');

  // Tab 3
  const [micaDisclosure, setMicaDisclosure] = useState('true');
  const [micaRenewable, setMicaRenewable] = useState('40');
  const [micaVerified, setMicaVerified] = useState('false');
  const [micaEnvAssessed, setMicaEnvAssessed] = useState('false');
  const [micaMarketCap, setMicaMarketCap] = useState('150000000');
  const [micaResult, setMicaResult] = useState(null);
  const [micaStatus, setMicaStatus] = useState('idle');
  // Reference: EU MiCA Art 66 requirement lists per compliance level (GET
  // /ref/mica-requirements) — used to render a live, engine-accurate
  // requirements table instead of a hardcoded 5-row one.
  const [micaRef, setMicaRef] = useState(null);

  // Tab 4
  const [tokenType, setTokenType] = useState('green_bond');
  const [tokenAmount, setTokenAmount] = useState('1000000');
  const [tokenStandard, setTokenStandard] = useState('gold_standard');
  const [onChain, setOnChain] = useState('true');
  const [tokenResult, setTokenResult] = useState(null);
  const [tokenStatus, setTokenStatus] = useState('idle');

  // Tab 5 — Portfolio: auto-loaded on mount via POST /portfolio against a
  // representative 6-asset crypto book (same holdings shown in the seeded
  // demo table below), falling back to the seeded figures if unreachable.
  const [portfolioLive, setPortfolioLive] = useState(null);
  const [portfolioStatus, setPortfolioStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    axios.get(`${CRYPTO_API}/ref/mica-requirements`, { timeout: 10000 })
      .then(({ data }) => { if (!cancelled) setMicaRef(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.post(`${CRYPTO_API}/portfolio`, {
          portfolio_id: 'CRYPTO-DEMO-PORT-001',
          investor_name: 'Demo Digital Assets Fund',
          reporting_period: '2024',
          total_portfolio_value_usd: 10_000_000,
          holdings: [
            { symbol: 'BTC', consensus_mechanism: 'PoW', value_usd: 4_000_000, market_cap_usd: 1_200_000_000_000, mining_country_distribution: { US: 38, KZ: 13, RU: 9, CA: 6.5, other: 33.5 } },
            { symbol: 'ETH', consensus_mechanism: 'PoS', value_usd: 2_500_000, market_cap_usd: 400_000_000_000 },
            { symbol: 'SOL', consensus_mechanism: 'PoS', value_usd: 1_500_000, market_cap_usd: 80_000_000_000 },
            { symbol: 'LTC', consensus_mechanism: 'PoW', value_usd: 700_000, market_cap_usd: 6_000_000_000, mining_country_distribution: { US: 20, CN: 25, other: 55 } },
            { symbol: 'ADA', consensus_mechanism: 'PoS', value_usd: 800_000, market_cap_usd: 15_000_000_000 },
            { symbol: 'XMR', consensus_mechanism: 'PoW', value_usd: 500_000, market_cap_usd: 3_000_000_000, mining_country_distribution: { other: 100 } },
          ],
        }, { timeout: 15000 });
        if (!cancelled && data && data.holding_summaries) {
          setPortfolioLive(data);
          setPortfolioStatus('live');
        } else if (!cancelled) {
          setPortfolioStatus('demo');
        }
      } catch (e) {
        if (!cancelled) setPortfolioStatus('demo');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const runAssess = async () => {
    setLoading(true); setAssessStatus('loading');
    try {
      const hashrateNum = parseFloat(hashrate) || 0;
      const apiMechanism = MECHANISM_API[mechanism] || 'PoW';
      // Same CBECI hashrate->energy conversion used by /mining-geography
      // (hashrate EH/s -> TH/s -> Watts @ 40 J/TH -> kWh/yr -> TWh/yr), so a
      // user-entered hashrate actually drives the PoW energy estimate here.
      const networkEnergyTwhYr = apiMechanism === 'PoW' && hashrateNum > 0
        ? (hashrateNum * 1e6 * 40 * 8_760) / 1_000 / 1e9
        : undefined;
      const { data } = await axios.post(`${CRYPTO_API}/assess`, {
        asset_symbol: (ticker || assetName || 'MTK').toUpperCase(),
        consensus_mechanism: apiMechanism,
        annual_transaction_count: (parseInt(dailyTx, 10) || 0) * 365,
        network_energy_twh_yr: networkEnergyTwhYr,
      }, { timeout: 15000 });
      setAssess(data); setAssessStatus('live');
    } catch (e) {
      setAssess(null); setAssessStatus('demo');
    } finally { setLoading(false); }
  };

  const runGeo = async () => {
    setLoading(true); setGeoStatus('loading');
    try {
      const share = Math.max(0, Math.min(100, parseFloat(miningShare) || 0));
      const { data } = await axios.post(`${CRYPTO_API}/mining-geography`, {
        hashrate_eh_s: parseFloat(mHashrate) || 0,
        country_distribution: { [country]: share, other: 100 - share },
      }, { timeout: 15000 });
      setGeoResult(data); setGeoStatus('live');
    } catch (e) {
      setGeoResult(null); setGeoStatus('demo');
    } finally { setLoading(false); }
  };

  const runMica = async () => {
    setLoading(true); setMicaStatus('loading');
    try {
      const { data } = await axios.post(`${CRYPTO_API}/mica-compliance`, {
        asset_symbol: (ticker || assetName || 'MTK').toUpperCase(),
        consensus_mechanism: MECHANISM_API[mechanism] || 'PoW',
        market_cap_usd: parseFloat(micaMarketCap) || 0,
        has_white_paper: true,
        discloses_energy_consumption: micaDisclosure === 'true',
        discloses_renewable_pct: parseFloat(micaRenewable) > 0,
        discloses_ghg_emissions: micaEnvAssessed === 'true',
      }, { timeout: 15000 });
      setMicaResult(data); setMicaStatus('live');
    } catch (e) {
      setMicaResult(null); setMicaStatus('demo');
    } finally { setLoading(false); }
  };

  const runToken = async () => {
    setLoading(true); setTokenStatus('loading');
    try {
      const { data } = await axios.post(`${CRYPTO_API}/tokenised-green-assets`, {
        asset_symbol: (ticker || assetName || 'TOKEN').toUpperCase(),
        consensus_mechanism: MECHANISM_API[mechanism] || 'PoS',
        underlying_asset_type: ASSET_TYPE_API[tokenType] || tokenType,
        underlying_face_value_usd: parseFloat(tokenAmount) || 0,
        on_chain_verification: onChain === 'true',
        certification_standard: STANDARD_API[tokenStandard] || tokenStandard,
      }, { timeout: 15000 });
      setTokenResult(data); setTokenStatus('live');
    } catch (e) {
      setTokenResult(null); setTokenStatus('demo');
    } finally { setLoading(false); }
  };

  // Live requirements table — the achieved-level requirement list from the
  // engine's own MICA_REQUIREMENTS reference, with each item's Met/Missing
  // status taken from the live compliance check's `gaps` array.
  const liveMicaReqs = (micaResult && micaRef)
    ? (micaRef.compliance_levels?.[micaResult.required_level]?.requirements || []).map(reqKey => ({
        req: MICA_REQ_LABELS[reqKey] || reqKey,
        status: (micaResult.gaps || []).includes(reqKey) ? 'Missing' : 'Met',
      }))
    : null;

  const micaReqs = liveMicaReqs || [
    { req: 'Art 66(1) — Disclosure of environmental impact', status: micaDisclosure === 'true' ? 'Met' : 'Missing' },
    { req: 'Art 66(2) — Annual energy consumption report', status: parseFloat(micaRenewable) > 30 ? 'Partial' : 'Missing' },
    { req: 'Art 66(3) — Renewable energy target', status: parseFloat(micaRenewable) >= 50 ? 'Met' : 'Partial' },
    { req: 'Art 66(4) — Third-party verification', status: micaVerified === 'true' ? 'Met' : 'Missing' },
    { req: 'Art 66(5) — Environmental impact assessment', status: micaEnvAssessed === 'true' ? 'Met' : 'Missing' },
  ];

  // --- Tab 5 — Portfolio View: derive display rows/KPIs from the live
  // POST /portfolio response when available, else keep the seeded demo book.
  const MICA_LEVEL_LABEL = { full: 'Full', enhanced: 'Enhanced', basic: 'Basic', partial: 'Partial', non_compliant: 'Missing' };
  const RISK_TIER_LABEL = { very_high: 'Very High', high: 'High', medium: 'Medium', low: 'Low' };

  const portfolioRows = portfolioLive?.holding_summaries
    ? portfolioLive.holding_summaries.map(h => ({
        asset: h.symbol,
        mechanism: h.consensus_mechanism,
        energy: +(h.energy_mwh_yr_attributed / 1e6).toFixed(4),
        tco2e: Math.round(h.tco2e_yr_attributed),
        mica: MICA_LEVEL_LABEL[h.mica_compliance] || h.mica_compliance,
        tier: RISK_TIER_LABEL[h.climate_risk_tier] || h.climate_risk_tier,
      }))
    : portfolioHoldings;

  const portfolioKpis = portfolioLive?.holding_summaries ? {
    totalTco2e: Math.round(portfolioLive.total_tco2e_yr),
    posPct: Math.round(portfolioLive.holding_summaries.filter(h => h.consensus_mechanism === 'PoS').reduce((s, h) => s + h.weight_pct, 0)),
    avgTco2ePerHolding: Math.round(portfolioLive.total_tco2e_yr / Math.max(1, portfolioLive.holding_summaries.length)),
    micaFullCount: portfolioLive.holding_summaries.filter(h => h.mica_compliance === 'full').length,
    holdingCount: portfolioLive.holding_summaries.length,
  } : {
    totalTco2e: 60190, posPct: 50, avgTco2ePerHolding: 10032, micaFullCount: 2, holdingCount: 6,
  };

  const piDataLive = portfolioLive?.holding_summaries ? (() => {
    const byMech = {};
    let total = 0;
    portfolioLive.holding_summaries.forEach(h => {
      byMech[h.consensus_mechanism] = (byMech[h.consensus_mechanism] || 0) + h.energy_mwh_yr_attributed;
      total += h.energy_mwh_yr_attributed;
    });
    return Object.entries(byMech).map(([name, v]) => ({ name, value: total > 0 ? Math.round((v / total) * 100) : 0 }));
  })() : piData;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1b3a5c', margin: 0 }}>Crypto Climate Risk</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>MiCA Art 66 compliance · Energy footprint · Tokenised green assets · E76</p>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 0 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '10px 16px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            background: 'none', color: tab === i ? '#059669' : '#6b7280',
            borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>

      {loading && <div style={{ color: '#059669', marginBottom: 12, fontSize: 14 }}>Loading...</div>}

      {/* TAB 1 — Asset Assessment */}
      {tab === 0 && (
        <div>
          <Section title="Asset Configuration">
            <Row>
              <Inp label="Asset Name" value={assetName} onChange={setAssetName} placeholder="MyToken" />
              <Inp label="Ticker" value={ticker} onChange={setTicker} placeholder="MTK" />
            </Row>
            <Row>
              <Sel label="Consensus Mechanism" value={mechanism} onChange={setMechanism} options={MECHANISMS} />
              <Inp label="Hashrate (EH/s) — PoW only" value={hashrate} onChange={setHashrate} type="number" />
            </Row>
            <Row>
              <Inp label="Daily Transactions" value={dailyTx} onChange={setDailyTx} type="number" />
              <div />
            </Row>
            <Btn onClick={runAssess}>Run Assessment</Btn>
          </Section>

          {(assess || assessStatus === 'demo') && (
            <Section title={<span>Results <StatusBadge status={assessStatus} /></span>}>
              <Row gap={12}>
                <KpiCard label="Annual Energy (TWh)" value={(assess?.energy?.network_energy_twh_yr_central ?? seed(1) * 120).toFixed(2)} sub="Estimated consumption" />
                <KpiCard label="GHG Intensity" value={`${(assess?.emissions?.gco2e_per_tx_central ?? seed(2) * 800).toFixed(0)} gCO₂e/tx`} sub="Per transaction" />
                <KpiCard label="Annual tCO₂e" value={(assess?.emissions?.annual_network_tco2e ?? Math.round(seed(3) * 55000)).toLocaleString()} sub="Gross emissions" />
                <KpiCard label="Climate Risk Tier" value={assess?.climate_risk_tier ?? 'High'} sub="MiCA classification" />
              </Row>
              {assess?.summary && <div style={{ marginTop: 12, fontSize: 13, color: '#374151' }}>{assess.summary}</div>}
            </Section>
          )}

          <Section title="Energy vs Competitors (TWh/yr)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={competitorEnergy}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="lower" fill="#d1fae5" name="Lower Bound" />
                <Bar dataKey="central" fill="#059669" name="Central" />
                <Bar dataKey="upper" fill="#064e3b" name="Upper Bound" />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* TAB 2 — Mining Geography */}
      {tab === 1 && (
        <div>
          <Section title="Mining Location Input">
            <Row>
              <Sel label="Country Code" value={country} onChange={setCountry} options={COUNTRIES.map(c => ({ value: c, label: c }))} />
              <Inp label="Mining Share (%)" value={miningShare} onChange={setMiningShare} type="number" />
            </Row>
            <Row>
              <Inp label="Hashrate (EH/s)" value={mHashrate} onChange={setMHashrate} type="number" />
              <div />
            </Row>
            <Btn onClick={runGeo}>Analyse Geography</Btn>
          </Section>

          {(geoResult || geoStatus === 'demo') && (
            <Section title={<span>Geography Results <StatusBadge status={geoStatus} /></span>}>
              <Row gap={12}>
                <KpiCard label="Grid Carbon Intensity" value={`${(geoResult?.weighted_grid_carbon_gco2_kwh ?? Math.round(200 + seed(31) * 600)).toFixed(0)} gCO₂/kWh`} />
                <KpiCard label="Renewable Mix (%)" value={`${(geoResult?.weighted_renewable_pct ?? (seed(32) * 80).toFixed(1))}%`} />
                <KpiCard label="Mining Carbon (tCO₂e/yr)" value={(geoResult?.total_tco2e_yr ?? Math.round(seed(33) * 50000)).toLocaleString()} />
                <KpiCard
                  label="vs Fully-Renewable Grid"
                  value={geoResult
                    ? `+${Math.round(((geoResult.total_tco2e_yr - geoResult.renewable_counterfactual_tco2e) / Math.max(1, geoResult.renewable_counterfactual_tco2e)) * 100)}%`
                    : '+18%'}
                  sub="tCO₂e above an all-renewable counterfactual"
                />
              </Row>
            </Section>
          )}

          <Section title="Country Grid Carbon Intensity (gCO₂e/kWh)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={countryIntensity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="intensity" fill="#059669" name="gCO₂e/kWh" />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* TAB 3 — MiCA Compliance */}
      {tab === 2 && (
        <div>
          <Section title="MiCA Art 66 Inputs">
            <Row>
              <Sel label="Disclosure Published" value={micaDisclosure} onChange={setMicaDisclosure} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} />
              <Inp label="Renewable Energy (%)" value={micaRenewable} onChange={setMicaRenewable} type="number" />
            </Row>
            <Row>
              <Sel label="Third-Party Verified" value={micaVerified} onChange={setMicaVerified} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} />
              <Sel label="Environmental Impact Assessed" value={micaEnvAssessed} onChange={setMicaEnvAssessed} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} />
            </Row>
            <Row>
              <Inp label="Market Cap (USD) — assesses ticker from Tab 1" value={micaMarketCap} onChange={setMicaMarketCap} type="number" />
              <div />
            </Row>
            <Btn onClick={runMica}>Check MiCA Compliance</Btn>
          </Section>

          {(micaResult || micaStatus === 'demo') && (
            <Section title={<span>MiCA Results <StatusBadge status={micaStatus} /></span>}>
              <Row gap={12}>
                <KpiCard label="MiCA Score" value={`${micaResult?.score ?? Math.round(30 + seed(41) * 60)}/100`} />
                <KpiCard label="Compliance Level" value={micaResult?.compliance_level ?? 'basic'} />
                <KpiCard label="Gap Count" value={micaResult?.gaps?.length ?? 3} sub="Requirements not met" />
                <KpiCard label="Required Level" value={micaResult?.required_level ?? 'basic'} sub="Based on market cap" />
              </Row>
            </Section>
          )}

          <Section title={<span>MiCA Art 66 Requirements {liveMicaReqs && <StatusBadge status="live" liveLabel={`● Live — required level: ${micaResult.required_level}`} />}</span>}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Requirement</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {micaReqs.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.req}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        background: r.status === 'Met' ? '#d1fae5' : r.status === 'Partial' ? '#fef3c7' : '#fee2e2',
                        color: r.status === 'Met' ? '#065f46' : r.status === 'Partial' ? '#92400e' : '#991b1b',
                      }}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 4 — Tokenised Green Assets */}
      {tab === 3 && (
        <div>
          <Section title="Tokenisation Inputs">
            <Row>
              <Sel label="Asset Type" value={tokenType} onChange={setTokenType} options={ASSET_TYPES} />
              <Inp label="Underlying Amount (USD)" value={tokenAmount} onChange={setTokenAmount} type="number" />
            </Row>
            <Row>
              <Sel label="Verification Standard" value={tokenStandard} onChange={setTokenStandard} options={STANDARDS} />
              <Sel label="On-Chain Registry" value={onChain} onChange={setOnChain} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} />
            </Row>
            <Btn onClick={runToken}>Assess Token</Btn>
          </Section>

          {(tokenResult || tokenStatus === 'demo') && (
            <Section title={<span>Token Results <StatusBadge status={tokenStatus} /></span>}>
              <Row gap={12}>
                <KpiCard label="Tokenisation Premium" value={`${tokenResult?.tokenisation_premium_bps ?? Math.round(15 + seed(51) * 45)} bps`} sub="vs non-tokenised" />
                <KpiCard label="Verification Level" value={tokenResult?.verification_status ?? 'partial'} />
                <KpiCard label="Green Eligible" value={tokenResult ? (tokenResult.framework_alignment?.length > 0 ? 'Yes' : 'Conditional') : (tokenStandard === 'eu_gbs' ? 'Yes' : 'Conditional')} />
                <KpiCard label="On-Chain Integrity" value={(tokenResult?.on_chain_verification ?? (onChain === 'true')) ? 'Verified' : 'Unverified'} />
              </Row>
            </Section>
          )}

          <Section title="Tokenisation Premium by Standard & Asset Type (bps)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={premiumData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="green_bond" fill="#059669" name="Green Bond" />
                <Bar dataKey="carbon_credit" fill="#3b82f6" name="Carbon Credit" />
                <Bar dataKey="renewable_cert" fill="#f59e0b" name="Renewable Cert" />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* TAB 5 — Portfolio View */}
      {tab === 4 && (
        <div>
          <Section title={<span>Portfolio Summary <StatusBadge status={portfolioStatus} liveLabel="● Live — E76 crypto_climate_engine /portfolio" /></span>}>
            <Row gap={12}>
              <KpiCard label="Total tCO₂e/yr" value={portfolioKpis.totalTco2e.toLocaleString()} sub="Across all holdings" />
              <KpiCard label="PoS Holdings (%)" value={`${portfolioKpis.posPct}%`} sub="By attributed weight" />
              <KpiCard label="Avg tCO₂e per Holding" value={`${portfolioKpis.avgTco2ePerHolding.toLocaleString()} tCO₂e`} sub="Portfolio-weighted average" />
              <KpiCard label="MiCA Full Compliance" value={`${portfolioKpis.micaFullCount} / ${portfolioKpis.holdingCount}`} sub="Holdings" />
            </Row>
          </Section>

          <Section title="Crypto Holdings">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Asset', 'Mechanism', 'Annual Energy (TWh)', 'tCO₂e/yr', 'MiCA Status', 'Risk Tier'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolioRows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1b3a5c' }}>{r.asset}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.mechanism}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.energy}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.tco2e.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        background: r.mica === 'Full' ? '#d1fae5' : r.mica === 'Partial' ? '#fef3c7' : r.mica === 'Basic' ? '#e0f2fe' : '#fee2e2',
                        color: r.mica === 'Full' ? '#065f46' : r.mica === 'Partial' ? '#92400e' : r.mica === 'Basic' ? '#0369a1' : '#991b1b',
                      }}>{r.mica}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        background: r.tier === 'Low' ? '#d1fae5' : r.tier === 'Medium' ? '#fef3c7' : '#fee2e2',
                        color: r.tier === 'Low' ? '#065f46' : r.tier === 'Medium' ? '#92400e' : '#991b1b',
                      }}>{r.tier}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Energy Split by Consensus Mechanism">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={piDataLive} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                  {piDataLive.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}
    </div>
  );
}
