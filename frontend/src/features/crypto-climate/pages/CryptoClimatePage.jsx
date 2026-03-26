import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const API = 'http://localhost:8001';
const seed = (s) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };

const KpiCard = ({ label, value, sub }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px', background: 'white' }}>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{value}</div>
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
    <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #059669' }}>{title}</div>
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
  const [error, setError] = useState('');

  // Tab 1
  const [assetName, setAssetName] = useState('MyToken');
  const [ticker, setTicker] = useState('MTK');
  const [mechanism, setMechanism] = useState('pow');
  const [hashrate, setHashrate] = useState('5');
  const [dailyTx, setDailyTx] = useState('100000');
  const [assess, setAssess] = useState(null);

  // Tab 2
  const [country, setCountry] = useState('US');
  const [miningShare, setMiningShare] = useState('12');
  const [mHashrate, setMHashrate] = useState('25');
  const [geoResult, setGeoResult] = useState(null);

  // Tab 3
  const [micaDisclosure, setMicaDisclosure] = useState('true');
  const [micaRenewable, setMicaRenewable] = useState('40');
  const [micaVerified, setMicaVerified] = useState('false');
  const [micaEnvAssessed, setMicaEnvAssessed] = useState('false');
  const [micaResult, setMicaResult] = useState(null);

  // Tab 4
  const [tokenType, setTokenType] = useState('green_bond');
  const [tokenAmount, setTokenAmount] = useState('1000000');
  const [tokenStandard, setTokenStandard] = useState('gold_standard');
  const [onChain, setOnChain] = useState('true');
  const [tokenResult, setTokenResult] = useState(null);

  const call = async (endpoint, payload, setter) => {
    setLoading(true); setError('');
    try {
      const r = await axios.post(`${API}${endpoint}`, payload);
      setter(r.data);
    } catch {
      setError('API unavailable — demo mode.');
    } finally { setLoading(false); }
  };

  const runAssess = () => call('/api/v1/crypto-climate/assess', {
    asset_name: assetName, ticker, consensus_mechanism: mechanism,
    hashrate_eh_s: parseFloat(hashrate), daily_transactions: parseInt(dailyTx),
  }, setAssess);

  const runGeo = () => call('/api/v1/crypto-climate/mining-geography', {
    country_code: country, mining_share_pct: parseFloat(miningShare), hashrate_eh_s: parseFloat(mHashrate),
  }, setGeoResult);

  const runMica = () => call('/api/v1/crypto-climate/mica-compliance', {
    asset_name: assetName, disclosure_published: micaDisclosure === 'true',
    renewable_pct: parseFloat(micaRenewable), third_party_verified: micaVerified === 'true',
    env_impact_assessed: micaEnvAssessed === 'true',
  }, setMicaResult);

  const runToken = () => call('/api/v1/crypto-climate/tokenised-green-assets', {
    asset_type: tokenType, underlying_amount_usd: parseFloat(tokenAmount),
    verification_standard: tokenStandard, on_chain_registry: onChain === 'true',
  }, setTokenResult);

  const micaReqs = [
    { req: 'Art 66(1) — Disclosure of environmental impact', status: micaDisclosure === 'true' ? 'Met' : 'Missing' },
    { req: 'Art 66(2) — Annual energy consumption report', status: parseFloat(micaRenewable) > 30 ? 'Partial' : 'Missing' },
    { req: 'Art 66(3) — Renewable energy target', status: parseFloat(micaRenewable) >= 50 ? 'Met' : 'Partial' },
    { req: 'Art 66(4) — Third-party verification', status: micaVerified === 'true' ? 'Met' : 'Missing' },
    { req: 'Art 66(5) — Environmental impact assessment', status: micaEnvAssessed === 'true' ? 'Met' : 'Missing' },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Crypto Climate Risk</h1>
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

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: 12, marginBottom: 16, color: '#dc2626', fontSize: 14 }}>{error}</div>}
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

          {assess && (
            <Section title="Results">
              <Row gap={12}>
                <KpiCard label="Annual Energy (TWh)" value={(assess.annual_energy_twh ?? seed(1) * 120).toFixed(2)} sub="Estimated consumption" />
                <KpiCard label="GHG Intensity" value={`${(assess.ghg_intensity_gco2_per_tx ?? seed(2) * 800).toFixed(0)} gCO₂e/tx`} sub="Per transaction" />
                <KpiCard label="Annual tCO₂e" value={(assess.annual_tco2e ?? seed(3) * 55000).toLocaleString()} sub="Gross emissions" />
                <KpiCard label="Climate Risk Tier" value={assess.climate_risk_tier ?? 'High'} sub="MiCA classification" />
              </Row>
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

          {geoResult && (
            <Section title="Geography Results">
              <Row gap={12}>
                <KpiCard label="Grid Carbon Intensity" value={`${(geoResult.grid_intensity_gco2_kwh ?? Math.round(200 + seed(31) * 600)).toFixed(0)} gCO₂/kWh`} />
                <KpiCard label="Renewable Mix (%)" value={`${(geoResult.renewable_pct ?? (seed(32) * 80).toFixed(1))}%`} />
                <KpiCard label="Mining Carbon (tCO₂e/yr)" value={(geoResult.mining_tco2e ?? Math.round(seed(33) * 50000)).toLocaleString()} />
                <KpiCard label="vs Network Avg" value={geoResult.vs_network_avg ?? '–18%'} sub="Relative emission delta" />
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
            <Btn onClick={runMica}>Check MiCA Compliance</Btn>
          </Section>

          {micaResult && (
            <Section title="MiCA Results">
              <Row gap={12}>
                <KpiCard label="MiCA Score" value={`${micaResult.mica_score ?? Math.round(30 + seed(41) * 60)}/100`} />
                <KpiCard label="Compliance Level" value={micaResult.compliance_level ?? 'basic'} />
                <KpiCard label="Gap Count" value={micaResult.gap_count ?? 3} sub="Requirements not met" />
                <KpiCard label="Status" value={micaResult.status ?? 'Partial'} />
              </Row>
            </Section>
          )}

          <Section title="MiCA Art 66 Requirements">
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

          {tokenResult && (
            <Section title="Token Results">
              <Row gap={12}>
                <KpiCard label="Tokenisation Premium" value={`${tokenResult.premium_bps ?? Math.round(15 + seed(51) * 45)} bps`} sub="vs non-tokenised" />
                <KpiCard label="Verification Level" value={tokenResult.verification_level ?? 'Enhanced'} />
                <KpiCard label="Green Eligible" value={tokenResult.green_eligible ? 'Yes' : (tokenStandard === 'eu_gbs' ? 'Yes' : 'Conditional')} />
                <KpiCard label="On-Chain Integrity" value={onChain === 'true' ? 'Verified' : 'Unverified'} />
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
          <Section title="Portfolio Summary">
            <Row gap={12}>
              <KpiCard label="Total tCO₂e/yr" value={(60190).toLocaleString()} sub="Across all holdings" />
              <KpiCard label="PoS Holdings (%)" value="50%" sub="By count" />
              <KpiCard label="Avg Financed Emissions" value="10,032 tCO₂e" sub="Per holding" />
              <KpiCard label="MiCA Full Compliance" value="2 / 6" sub="Holdings" />
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
                {portfolioHoldings.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#111827' }}>{r.asset}</td>
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
                <Pie data={piData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                  {piData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
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
