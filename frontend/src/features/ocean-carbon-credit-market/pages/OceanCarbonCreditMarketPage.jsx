import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', gold: '#d4a843', sage: '#2d6a4f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const CREDIT_TYPES = [
  { id: 'mangrove_rest', name: 'Mangrove Restoration', registry: 'Verra VCS', methodology: 'VM0033', price2025: 32, priceRange: '$22-48', volume2025Mt: 3.8, qualityScore: 88, permanence: 'High', additionalityScore: 85, cobenefits: ['Biodiversity', 'Coastal protection'], vintage: '2022-2025', buyers: ['Microsoft', 'McKinsey', 'Delta Air Lines'] },
  { id: 'seagrass_rest', name: 'Seagrass Restoration', registry: 'Verra VCS', methodology: 'VM0024', price2025: 24, priceRange: '$16-36', volume2025Mt: 1.2, qualityScore: 74, permanence: 'Medium', additionalityScore: 78, cobenefits: ['Fisheries', 'Water quality'], vintage: '2023-2025', buyers: ['Shell', 'BP', 'Unilever'] },
  { id: 'saltmarsh', name: 'Salt Marsh Conservation', registry: 'Gold Standard', methodology: 'Coastal Wetland', price2025: 28, priceRange: '$18-42', volume2025Mt: 0.8, qualityScore: 82, permanence: 'High', additionalityScore: 80, cobenefits: ['Storm protection', 'Bird habitat'], vintage: '2021-2025', buyers: ['Apple', 'Google', 'Amazon'] },
  { id: 'kelp_farm', name: 'Open-Ocean Kelp Farming', registry: 'Emerging/CAR', methodology: 'CAR Blue Carbon', price2025: 14, priceRange: '$8-22', volume2025Mt: 0.3, qualityScore: 52, permanence: 'Low', additionalityScore: 62, cobenefits: ['Fisheries', 'Otter habitat'], vintage: '2024-2025', buyers: ['Stripe', 'Shopify', 'Klarna'] },
  { id: 'mpa_finance', name: 'MPA Debt-for-Nature', registry: 'Sovereign Voluntary', methodology: 'Bespoke', price2025: 38, priceRange: '$28-55', volume2025Mt: 0.5, qualityScore: 92, permanence: 'Very High', additionalityScore: 92, cobenefits: ['Fisheries', 'Biodiversity', 'Cultural'], vintage: '2020-2025', buyers: ['Sovereign buyers', 'Philanthropies'] },
  { id: 'enhanced_weathering', name: 'Ocean Alkalinity Enhancement', registry: 'Frontier / CAR', methodology: 'OAE Protocol', price2025: 280, priceRange: '$180-400', volume2025Mt: 0.02, qualityScore: 68, permanence: 'Permanent', additionalityScore: 95, cobenefits: ['Acidification reversal'], vintage: '2024-2025', buyers: ['Stripe Climate', 'Breakthrough Energy'] },
];

const PRICE_HISTORY = [
  { year: 2019, mangrove: 8, seagrass: 6, saltmarsh: 7, oae: 80 },
  { year: 2020, mangrove: 11, seagrass: 8, saltmarsh: 10, oae: 110 },
  { year: 2021, mangrove: 16, seagrass: 12, saltmarsh: 15, oae: 160 },
  { year: 2022, mangrove: 22, seagrass: 16, saltmarsh: 20, oae: 200 },
  { year: 2023, mangrove: 27, seagrass: 20, saltmarsh: 24, oae: 220 },
  { year: 2024, mangrove: 30, seagrass: 22, saltmarsh: 27, oae: 260 },
  { year: 2025, mangrove: 32, seagrass: 24, saltmarsh: 28, oae: 280 },
];

const BUYERS = [
  { name: 'Microsoft', sector: 'Tech', commitment: 'Carbon negative by 2030', annualBudgetM: 180, prefEco: 'Mangrove + MPA', avgPriceUsd: 34 },
  { name: 'Shell', sector: 'Energy', commitment: 'Net Zero 2050', annualBudgetM: 250, prefEco: 'Seagrass + Saltmarsh', avgPriceUsd: 22 },
  { name: 'Delta Air Lines', sector: 'Aviation', commitment: 'Carbon neutral 2030', annualBudgetM: 95, prefEco: 'Mangrove', avgPriceUsd: 28 },
  { name: 'Apple', sector: 'Tech', commitment: 'Carbon neutral 2030', annualBudgetM: 140, prefEco: 'Saltmarsh + Mangrove', avgPriceUsd: 36 },
  { name: 'Stripe Climate', sector: 'Fintech', commitment: '$1M/yr advance purchase', annualBudgetM: 8, prefEco: 'OAE + Kelp', avgPriceUsd: 285 },
  { name: 'Frontier', sector: 'Offtake Facility', commitment: '$1Bn advance market commit', annualBudgetM: 120, prefEco: 'CDR (OAE/DAC)', avgPriceUsd: 290 },
];

const FORWARD_CURVE = [
  { vintage: 2025, spot: 32, fwd1yr: 34, fwd3yr: 38, fwd5yr: 45 },
  { vintage: 2026, spot: 35, fwd1yr: 38, fwd3yr: 43, fwd5yr: 52 },
  { vintage: 2027, spot: 39, fwd1yr: 43, fwd3yr: 49, fwd5yr: 60 },
  { vintage: 2028, spot: 44, fwd1yr: 49, fwd3yr: 56, fwd5yr: 70 },
  { vintage: 2029, spot: 50, fwd1yr: 56, fwd3yr: 65, fwd5yr: 82 },
  { vintage: 2030, spot: 58, fwd1yr: 65, fwd3yr: 76, fwd5yr: 96 },
];

const QUALITY_METRICS = [
  { metric: 'Additionality', weight: 25, description: 'Project would not occur without carbon revenue' },
  { metric: 'Permanence', weight: 25, description: 'Carbon stored for 100+ years with monitoring' },
  { metric: 'MRV Rigour', weight: 20, description: 'Satellite + in-situ measurement, verification' },
  { metric: 'Co-Benefits', weight: 15, description: 'Biodiversity, community, water quality score' },
  { metric: 'Registry Oversight', weight: 10, description: 'Verra/Gold Standard vs bespoke registry' },
  { metric: 'Buyer Transparency', weight: 5, description: 'Public disclosure of purchases & impact' },
];

const TABS = ['Overview', 'Credit Types', 'Price History', 'Forward Curve', 'Buyer Landscape', 'Quality Framework', 'OAE Deep Dive', 'Liquidity & Risk', 'Portfolio Builder', 'Market Outlook'];

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function OceanCarbonCreditMarketPage() {
  const [tab, setTab] = useState(0);
  const [selType, setSelType] = useState('mangrove_rest');
  const [portfolio, setPortfolio] = useState([]);
  const [budget, setBudget] = useState(5);

  const ct = CREDIT_TYPES.find(c => c.id === selType) || CREDIT_TYPES[0];
  const totalVolume = CREDIT_MARKET_VOL();
  const avgPrice = CREDIT_TYPES.length > 0 ? CREDIT_TYPES.reduce((s, c) => s + c.price2025, 0) / CREDIT_TYPES.length : 0;
  const totalBuyerBudget = BUYERS.reduce((s, b) => s + b.annualBudgetM, 0);
  const qualColor = (s) => s >= 80 ? T.green : s >= 65 ? T.amber : T.red;
  const portfolioTotal = portfolio.length > 0 ? portfolio.reduce((s, p) => s + p.credits, 0) : 0;
  const portfolioAvgPrice = portfolio.length > 0 ? portfolio.reduce((s, p) => s + p.price * p.credits, 0) / portfolioTotal : 0;

  function CREDIT_MARKET_VOL() {
    return CREDIT_TYPES.reduce((s, c) => s + c.volume2025Mt, 0);
  }

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: 24 }}>
      <div style={{ borderBottom: `2px solid ${T.gold}`, paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 2 }}>EP-DZ5 · OCEAN & BLUE ECONOMY FINANCE</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0', color: T.text }}>Ocean Carbon Credit Market Intelligence</h1>
        <div style={{ fontSize: 12, color: T.textSec }}>Blue Carbon Credits · Verra VCS · OAE · Kelp · Price History · Forward Curve · Buyer Landscape · Quality Framework · 10 Tabs</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Kpi label="TOTAL MARKET VOL" value={`${totalVolume.toFixed(1)}MtCO₂`} sub="2025 issuance" />
        <Kpi label="AVG SPOT PRICE" value={`$${avgPrice.toFixed(0)}/tCO₂`} sub="Excl. OAE premium" color={T.teal} />
        <Kpi label="BUYER DEMAND" value={`$${(totalBuyerBudget / 1000).toFixed(1)}Bn`} sub="Annual budgets tracked" color={T.amber} />
        <Kpi label="OAE PRICE" value="$280/tCO₂" sub="Emerging CDR premium" color={T.gold} />
        <Kpi label="TOP REGISTRY" value="Verra VCS" sub="80%+ of volume" color={T.sage} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '6px 14px', borderRadius: 4, border: `1px solid ${tab === i ? T.gold : T.border}`, background: tab === i ? T.navy : T.surface, color: tab === i ? T.gold : T.textSec, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>BLUE CARBON PRICE HISTORY ($/tCO₂)</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={PRICE_HISTORY}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Line type="monotone" dataKey="mangrove" stroke={T.sage} strokeWidth={2} name="Mangrove" /><Line type="monotone" dataKey="seagrass" stroke={T.teal} strokeWidth={2} name="Seagrass" /><Line type="monotone" dataKey="saltmarsh" stroke={T.amber} strokeWidth={2} name="Salt Marsh" /></LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>2025 VOLUME BY CREDIT TYPE (MtCO₂)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={CREDIT_TYPES}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 8 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Bar dataKey="volume2025Mt" fill={T.teal} name="Volume (Mt)" /></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, gridColumn: '1/-1' }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>CREDIT TYPE DASHBOARD</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Type', 'Registry', 'Price 2025', 'Volume', 'Quality', 'Permanence', 'Additionality'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textMut, fontFamily: T.mono }}>{h}</th>)}
              </tr></thead>
              <tbody>{CREDIT_TYPES.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                  <td style={{ padding: '8px 10px', color: T.gold, fontFamily: T.mono }}>{c.name}</td>
                  <td style={{ padding: '8px 10px', color: T.text }}>{c.registry.split(' ')[0]}</td>
                  <td style={{ padding: '8px 10px', color: T.amber, fontFamily: T.mono }}>${c.price2025}</td>
                  <td style={{ padding: '8px 10px', color: T.teal, fontFamily: T.mono }}>{c.volume2025Mt}Mt</td>
                  <td style={{ padding: '8px 10px', color: qualColor(c.qualityScore) }}>{c.qualityScore}/100</td>
                  <td style={{ padding: '8px 10px', color: c.permanence === 'High' || c.permanence === 'Very High' || c.permanence === 'Permanent' ? T.green : c.permanence === 'Medium' ? T.amber : T.red }}>{c.permanence}</td>
                  <td style={{ padding: '8px 10px', color: qualColor(c.additionalityScore), fontFamily: T.mono }}>{c.additionalityScore}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CREDIT_TYPES.map(c => (
              <button key={c.id} onClick={() => setSelType(c.id)} style={{ padding: '6px 12px', borderRadius: 4, border: `1px solid ${selType === c.id ? T.gold : T.border}`, background: selType === c.id ? T.navy : T.surface, color: selType === c.id ? T.gold : T.text, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{c.name.split(' ')[0]}</button>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold, marginBottom: 4 }}>{ct.name}</div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>{ct.registry} · {ct.methodology} · Vintage: {ct.vintage}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <Kpi label="SPOT PRICE" value={`$${ct.price2025}/tCO₂`} sub={ct.priceRange} color={T.amber} />
              <Kpi label="2025 VOLUME" value={`${ct.volume2025Mt}MtCO₂`} sub="Market issuance" color={T.teal} />
              <Kpi label="QUALITY" value={`${ct.qualityScore}/100`} sub="Composite" color={qualColor(ct.qualityScore)} />
              <Kpi label="ADDITIONALITY" value={`${ct.additionalityScore}/100`} sub="Verification score" color={qualColor(ct.additionalityScore)} />
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 12, flex: 1 }}>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 6 }}>CO-BENEFITS</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ct.cobenefits.map((b, i) => <span key={i} style={{ background: T.navy, color: T.sage, borderRadius: 4, padding: '3px 8px', fontSize: 10, fontFamily: T.mono }}>{b}</span>)}
                </div>
              </div>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 12, flex: 1 }}>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 6 }}>KEY BUYERS</div>
                {ct.buyers.map((b, i) => <div key={i} style={{ fontSize: 11, color: T.text, marginBottom: 3 }}>{b}</div>)}
              </div>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 12, flex: 1 }}>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 6 }}>PERMANENCE</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: ct.permanence === 'High' || ct.permanence === 'Very High' || ct.permanence === 'Permanent' ? T.green : ct.permanence === 'Medium' ? T.amber : T.red, fontFamily: T.mono }}>{ct.permanence}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>PRICE HISTORY — BLUE CARBON CREDITS ($/tCO₂)</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={PRICE_HISTORY}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Line type="monotone" dataKey="mangrove" stroke={T.sage} strokeWidth={2} dot={{ fill: T.sage, r: 4 }} name="Mangrove" /><Line type="monotone" dataKey="seagrass" stroke={T.teal} strokeWidth={2} dot={{ fill: T.teal, r: 4 }} name="Seagrass" /><Line type="monotone" dataKey="saltmarsh" stroke={T.amber} strokeWidth={2} dot={{ fill: T.amber, r: 4 }} name="Salt Marsh" /></LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[['Mangrove CAGR', '22%', T.sage, '2019-2025'], ['Seagrass CAGR', '26%', T.teal, '2019-2025'], ['Salt Marsh CAGR', '22%', T.amber, '2019-2025'], ['OAE CAGR', '23%', T.gold, '2019-2025']].map(([label, val, color, sub]) => (
              <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: T.mono, marginTop: 6 }}>{val}</div>
                <div style={{ fontSize: 10, color: T.textSec }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>MANGROVE CREDIT FORWARD CURVE ($/tCO₂)</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={FORWARD_CURVE}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="vintage" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Line type="monotone" dataKey="spot" stroke={T.teal} strokeWidth={2} name="Spot" /><Line type="monotone" dataKey="fwd1yr" stroke={T.amber} strokeWidth={2} strokeDasharray="5 3" name="+1yr Fwd" /><Line type="monotone" dataKey="fwd3yr" stroke={T.sage} strokeWidth={2} strokeDasharray="8 3" name="+3yr Fwd" /><Line type="monotone" dataKey="fwd5yr" stroke={T.gold} strokeWidth={2} strokeDasharray="10 3" name="+5yr Fwd" /></LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[['Forward Premium (1yr)', '+6%', 'Upward sloping curve'], ['Forward Premium (3yr)', '+19%', 'Policy tightening expected'], ['Forward Premium (5yr)', '+41%', 'Supply scarcity priced in']].map(([label, val, sub]) => (
              <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.green, fontFamily: T.mono, marginTop: 6 }}>{val}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 6 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {BUYERS.map((b, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{b.sector} · {b.commitment}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.amber, fontFamily: T.mono }}>${b.annualBudgetM}M/yr</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>annual budget</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ background: T.surfaceH, borderRadius: 4, padding: 10, flex: 2 }}>
                  <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>PREFERRED ECO</div>
                  <div style={{ fontSize: 12, color: T.text, marginTop: 3 }}>{b.prefEco}</div>
                </div>
                <div style={{ background: T.surfaceH, borderRadius: 4, padding: 10, flex: 1 }}>
                  <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>AVG PRICE</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.teal, fontFamily: T.mono, marginTop: 3 }}>${b.avgPriceUsd}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>QUALITY SCORING FRAMEWORK</div>
            {QUALITY_METRICS.map((m, i) => (
              <div key={i} style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold }}>{m.metric}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.amber }}>Weight: {m.weight}%</div>
                </div>
                <div style={{ fontSize: 11, color: T.textSec }}>{m.description}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>QUALITY SCORE BY CREDIT TYPE</div>
            {CREDIT_TYPES.map((c, i) => (
              <div key={c.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: T.text }}>{c.name}</span>
                  <span style={{ color: qualColor(c.qualityScore), fontFamily: T.mono }}>{c.qualityScore}/100</span>
                </div>
                <div style={{ background: T.borderL, borderRadius: 4, height: 8 }}><div style={{ background: qualColor(c.qualityScore), width: `${c.qualityScore}%`, height: 8, borderRadius: 4 }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold, marginBottom: 8 }}>Ocean Alkalinity Enhancement (OAE) — Deep Dive</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>Permanently sequesters CO₂ by adding alkaline minerals to seawater · Reverses acidification · $180-400/tCO₂ · Frontier market</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              {[['MRV Technology', 'Titration + alkalinity sensors', T.teal], ['Permanence', '10,000+ years (geological)', T.green], ['Co-benefit', 'Reverses ocean acidification', T.sage], ['Scale Potential', '1-10 GtCO₂/yr by 2050', T.gold], ['Current Price', '$180-400/tCO₂', T.amber], ['Key Risk', 'Ecosystem impact monitoring', T.red]].map(([label, val, color]) => (
                <div key={label} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
                  <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>{label}</div>
                  <div style={{ fontSize: 13, color, marginTop: 6 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 10 }}>OAE PRICE TRAJECTORY ($/tCO₂)</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={PRICE_HISTORY}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Line type="monotone" dataKey="oae" stroke={T.gold} strokeWidth={2} dot={{ fill: T.gold, r: 4 }} name="OAE Price" /></LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 7 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>MARKET LIQUIDITY ASSESSMENT</div>
            {[['Bid-Ask Spread (Mangrove)', '8-12%', T.amber, 'Improving — OTC → exchange listing'], ['Bid-Ask Spread (OAE)', '25-40%', T.red, 'Nascent — advance purchase only'], ['Settlement', 'T+30 typical', T.teal, 'Some registries offer T+5'], ['Retirements/Trades', '60% retired on purchase', T.sage, 'High non-speculatory demand'], ['Forward Liquidity', 'Limited pre-2024', T.amber, 'Frontier markets growing'], ['Exchange Listings', 'CBL, Xpansiv, AirCarbon', T.green, '3 major exchanges active']].map(([label, val, color, note]) => (
              <div key={label} style={{ borderBottom: `1px solid ${T.borderL}`, padding: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: T.textSec }}>{label}</span>
                  <span style={{ color, fontFamily: T.mono }}>{val}</span>
                </div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{note}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>KEY MARKET RISKS</div>
            {[['Greenwashing / Integrity Risk', 82, T.red], ['Registry Methodology Change', 64, T.amber], ['Political / Sovereignty Risk (SIDS)', 58, T.amber], ['Permanence / Reversal Event', 71, T.amber], ['Demand Decline (corporate pledges)', 45, T.sage], ['Price Volatility (spot market)', 68, T.amber]].map(([label, score, color]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: T.text }}>{label}</span>
                  <span style={{ color, fontFamily: T.mono }}>{score}/100</span>
                </div>
                <div style={{ background: T.borderL, borderRadius: 4, height: 6 }}><div style={{ background: color, width: `${score}%`, height: 6, borderRadius: 4 }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 8 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>BUILD BLUE CARBON PORTFOLIO</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, fontFamily: T.mono }}>Annual Budget ($M): <span style={{ color: T.gold }}>{budget}</span></div>
              <input type="range" min={1} max={50} value={budget} onChange={e => setBudget(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
            </div>
            {CREDIT_TYPES.map(c => {
              const affordableCredits = Math.floor(budget * 1e6 / 6 / c.price2025);
              return (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.text }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>${c.price2025}/t · {affordableCredits.toLocaleString()} tCO₂ affordable</div>
                  </div>
                  <button onClick={() => setPortfolio(p => [...p, { id: c.id, name: c.name, price: c.price2025, credits: affordableCredits, quality: c.qualityScore }])} style={{ background: T.navy, color: T.gold, border: `1px solid ${T.gold}`, borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: T.mono }}>+ Add</button>
                </div>
              );
            })}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>MY PORTFOLIO ({portfolio.length} holdings)</div>
            {portfolio.length === 0 && <div style={{ color: T.textMut, fontSize: 12 }}>No holdings. Add credits from the left.</div>}
            {portfolio.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                <div>
                  <div style={{ fontSize: 12, color: T.text }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>{p.credits.toLocaleString()} tCO₂ @ ${p.price} · Quality: {p.quality}</div>
                </div>
                <button onClick={() => setPortfolio(prev => prev.filter((_, j) => j !== i))} style={{ background: 'transparent', color: T.red, border: `1px solid ${T.red}`, borderRadius: 4, padding: '4px 8px', fontSize: 10, cursor: 'pointer' }}>✕</button>
              </div>
            ))}
            {portfolio.length > 0 && (
              <div style={{ marginTop: 14, background: T.navy, borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: T.textMut }}>Total Credits:</span>
                  <span style={{ color: T.gold, fontFamily: T.mono }}>{portfolioTotal.toLocaleString()} tCO₂</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6 }}>
                  <span style={{ color: T.textMut }}>Portfolio Avg Price:</span>
                  <span style={{ color: T.teal, fontFamily: T.mono }}>${portfolioTotal > 0 ? portfolioAvgPrice.toFixed(0) : 0}/tCO₂</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 9 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>2026-2030 MARKET OUTLOOK</div>
            {[['Market Volume', '$2–5Bn by 2030', T.teal, 'Driven by corporate net-zero pledges + Article 6'], ['Price Trajectory', '$45-65/tCO₂ avg by 2030', T.gold, 'Upward pressure from supply constraints'], ['OAE Market', '$500M–1Bn by 2028', T.amber, 'Advance purchase from Frontier/Stripe/Shopify'], ['Regulatory Catalyst', 'Article 6.4 mechanism', T.sage, 'Sovereign-backed credits, ITMO framework'], ['Supply Bottleneck', 'Restoration pipeline', T.red, '3-8yr lag from project to first credits'], ['Exchange Evolution', 'Listed futures by 2027', T.green, 'CBL/Xpansiv standardization drive']].map(([label, val, color, note]) => (
              <div key={label} style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginBottom: 10 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{val}</div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>{note}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>PROJECTED PRICE RANGE 2025-2030</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={FORWARD_CURVE}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="vintage" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Line type="monotone" dataKey="spot" stroke={T.teal} strokeWidth={2} name="Spot" /><Line type="monotone" dataKey="fwd5yr" stroke={T.gold} strokeWidth={2} strokeDasharray="6 3" name="5yr Forward" /></LineChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 14, background: T.surfaceH, borderRadius: 6, padding: 12 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 6 }}>INVESTMENT THESIS</div>
              <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6 }}>Blue carbon credits are structurally undersupplied vs. demand. Forward purchase at $32-38/tCO₂ with 2028-2030 delivery offers 40-50% capital appreciation potential under base case policy trajectory.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
