import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import Apr2026CarbonAnalytics from '../../_shared/Apr2026CarbonAnalytics';
import IndiaAdvancedAnalytics from '../../_shared/IndiaAdvancedAnalytics';
import IndiaGreenHybridFinance from '../../_shared/IndiaGreenHybridFinance';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', gold: '#d4a843', sage: '#2d6a4f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const MARKETS = {
  eu: {
    id: 'eu', name: 'EU ETS', label: 'European Union Emissions Trading System', color: '#3b82f6',
    price2025: 68, priceRange: '€55-95', currency: 'EUR', unit: 'EUA',
    capMtco2: 1290, freeAllocation: 43, auctionShare: 57, sectorsCovered: 11,
    sectors: ['Power', 'Industry (steel/cement/refining)', 'Aviation (intra-EU)', 'Maritime (2024)', 'Aluminium'],
    mechanism: 'Cap-and-trade, annual cap decline 4.3% from 2024 (LRF), CBAM Phase-In 2026',
    msrThreshold: 833, innovationFund: '€38Bn 2021-2030', socialClimate: '€65Bn',
    reforms: ['Fit for 55 — -62% by 2030 vs 2005', 'CBAM full implementation 2026', 'Aviation scope expanded', 'Maritime ETS 2024'],
    priceHistory: [{ yr: '2019', p: 25 }, { yr: '2020', p: 25 }, { yr: '2021', p: 53 }, { yr: '2022', p: 81 }, { yr: '2023', p: 64 }, { yr: '2024', p: 58 }, { yr: '2025', p: 68 }],
    forwardCurve: [{ yr: '2025', p: 68 }, { yr: '2026', p: 75 }, { yr: '2027', p: 82 }, { yr: '2028', p: 90 }, { yr: '2030', p: 110 }],
  },
  india: {
    id: 'india', name: 'India CCTS', label: 'Carbon Credit Trading Scheme (BEE / MoEFCC)', color: '#f97316',
    price2025: 9, priceRange: '₹200-800/t (est.)', currency: 'INR', unit: 'CCert',
    capMtco2: null, freeAllocation: null, auctionShare: null, sectorsCovered: 8,
    sectors: ['Aluminium', 'Cement', 'Chlor-alkali', 'Fertilisers', 'Iron & Steel', 'Petrochemicals', 'Pulp & Paper', 'Textiles'],
    mechanism: 'Intensity-based PAT Scheme → CCTS (Energy Conservation Amendment Act 2022). Phase 1: 2023-2026 compliance. CCerts & ESCerts co-exist.',
    msrThreshold: null, innovationFund: 'INR 650Bn NGRBA equivalent', socialClimate: null,
    reforms: ['PAT Cycle 7 ongoing (2022-2025)', 'CCTS notified June 2023', 'Offset Mechanism under design', 'Article 6 NDC alignment 2025'],
    priceHistory: [{ yr: '2019', p: 1.5 }, { yr: '2020', p: 1.8 }, { yr: '2021', p: 2.2 }, { yr: '2022', p: 3.0 }, { yr: '2023', p: 4.5 }, { yr: '2024', p: 6.5 }, { yr: '2025', p: 9.0 }],
    forwardCurve: [{ yr: '2025', p: 9 }, { yr: '2026', p: 12 }, { yr: '2027', p: 16 }, { yr: '2028', p: 22 }, { yr: '2030', p: 35 }],
  },
  japan: {
    id: 'japan', name: 'Japan GX-ETS', label: 'GX League / GX-ETS / J-Credit Scheme', color: '#a855f7',
    price2025: 12, priceRange: '$8-22 (J-Credit)', currency: 'JPY', unit: 'J-Credit',
    capMtco2: 600, freeAllocation: 100, auctionShare: 0, sectorsCovered: 25,
    sectors: ['Power', 'Steel', 'Chemicals', 'Cement', 'Forestry (J-Credit)', 'Agriculture', 'Waste', 'Transport'],
    mechanism: 'GX League (voluntary 2023-2025) → GX-ETS (mandatory from 2026). J-Credit for SMEs. JCM bilateral (25+ countries). GX Bond ¥20Tn.',
    msrThreshold: null, innovationFund: '¥20Tn GX Investment (10yr)', socialClimate: '¥20Tn Green Transformation Bond',
    reforms: ['GX League Phase 1 closed Mar 2025', 'GX-ETS Mandatory 2026', 'JCM expanded to India/Vietnam', 'J-Credit enhanced methodology 2024'],
    priceHistory: [{ yr: '2019', p: 5 }, { yr: '2020', p: 5.5 }, { yr: '2021', p: 7 }, { yr: '2022', p: 9 }, { yr: '2023', p: 11 }, { yr: '2024', p: 12 }, { yr: '2025', p: 12 }],
    forwardCurve: [{ yr: '2025', p: 12 }, { yr: '2026', p: 18 }, { yr: '2027', p: 25 }, { yr: '2028', p: 32 }, { yr: '2030', p: 50 }],
  },
};

const CROSS_MARKET_COMPARE = [
  { metric: 'Current Price (USD equiv.)', eu: '$68', india: '$9', japan: '$12' },
  { metric: 'Price 2030 Forecast (USD)', eu: '$110', india: '$35', japan: '$50' },
  { metric: 'Coverage (Mt CO₂/yr)', eu: '1,290', india: '~500 (PAT sectors)', japan: '600' },
  { metric: 'Mechanism Type', eu: 'Absolute cap-and-trade', india: 'Intensity-based + offset', japan: 'Voluntary→Mandatory ETS' },
  { metric: 'Free Allocation', eu: '43% (declining)', india: 'Intensity benchmark', japan: '100% (2026 phase-out)' },
  { metric: 'Offset Eligible', eu: 'No (since 2021)', india: 'Yes (CCTS Offset)', japan: 'Yes (J-Credit/JCM)' },
  { metric: 'CBAM Exposure', eu: 'Issuer (imports pay)', india: 'Exporter (pays via CBAM)', japan: 'Exporter (pays via CBAM)' },
  { metric: 'Article 6 Status', eu: 'Buyer (ITMO importer)', india: 'Seller (NDC surplus)', japan: 'Buyer (JCM host)' },
];

const JCM_CORRIDORS = [
  { corridor: 'India → Japan', type: 'JCM Bilateral', sectors: ['Solar', 'Green H2', 'Energy efficiency'], itmoPrice: '$14-22', volume2025Mt: 0.8, status: 'Active' },
  { corridor: 'India → EU', type: 'Article 6.2 ITMO', sectors: ['Renewable energy', 'Nature-based'], itmoPrice: '$18-35', volume2025Mt: 0.3, status: 'Pilot' },
  { corridor: 'India → Korea', type: 'Article 6.2', sectors: ['Solar', 'EV', 'Industry'], itmoPrice: '$12-20', volume2025Mt: 0.5, status: 'Active' },
  { corridor: 'India → Singapore', type: 'Article 6.2', sectors: ['Nature-based', 'Clean energy'], itmoPrice: '$15-28', volume2025Mt: 0.2, status: 'MOU Signed' },
];

const INDIA_PAT_SECTORS = [
  { sector: 'Aluminium', units: 18, targetMtoe: 0.25, achieved2024: 0.31, overachieve: 0.06, escertEarned: 60, ccertEarned: 48 },
  { sector: 'Cement', units: 85, targetMtoe: 1.48, achieved2024: 1.61, overachieve: 0.13, escertEarned: 130, ccertEarned: 110 },
  { sector: 'Iron & Steel', units: 67, targetMtoe: 2.12, achieved2024: 1.98, overachieve: -0.14, escertEarned: 0, ccertEarned: 0 },
  { sector: 'Fertilisers', units: 29, targetMtoe: 0.34, achieved2024: 0.39, overachieve: 0.05, escertEarned: 50, ccertEarned: 42 },
  { sector: 'Petrochemicals', units: 22, targetMtoe: 0.18, achieved2024: 0.21, overachieve: 0.03, escertEarned: 30, ccertEarned: 25 },
  { sector: 'Textiles', units: 90, targetMtoe: 0.22, achieved2024: 0.25, overachieve: 0.03, escertEarned: 30, ccertEarned: 22 },
];

// CBAM liability = embedded_emissions_tCO2 x EU_ETS_price_per_tCO2.
// exportToEU_Mt is in million tonnes of product; co2IntensityT is tCO2 per tonne of product;
// so embedded_emissions_tCO2 = exportToEU_Mt * 1e6 * co2IntensityT, and dividing by 1e6 to express
// the liability in $M cancels the *1e6, leaving exportToEU_Mt * co2IntensityT * price directly.
// (Previous version multiplied by a stray *1000 instead of *1e6 before dividing by 1e6/1e9,
// which understated every row's cost by ~1000x, and used the year "2024" instead of the
// €68/tCO2 EUA price for Steel, understating that row by ~33,500x.)
const CBAM_EXPOSURE = [
  { sector: 'Steel', exportToEU_Mt: 2.4, co2IntensityT: 1.85, cbamCostUsdM: 68 * 2.4 * 1.85 },
  { sector: 'Aluminium', exportToEU_Mt: 0.8, co2IntensityT: 8.20, cbamCostUsdM: 68 * 0.8 * 8.20 },
  { sector: 'Cement (clinker)', exportToEU_Mt: 0.3, co2IntensityT: 0.82, cbamCostUsdM: 68 * 0.3 * 0.82 },
  { sector: 'Fertilisers (urea)', exportToEU_Mt: 1.2, co2IntensityT: 2.30, cbamCostUsdM: 68 * 1.2 * 2.30 },
  { sector: 'Solar Panels (glass/al)', exportToEU_Mt: 0.5, co2IntensityT: 0.65, cbamCostUsdM: 68 * 0.5 * 0.65 },
];

const TABS = ['Market Overview', 'EU ETS Deep Dive', 'India CCTS Deep Dive', 'Japan GX-ETS', 'Cross-Market Compare', 'India PAT / CCTS Sectors', 'CBAM Exposure (India)', 'JCM Corridors', 'Price Convergence', 'Arbitrage Snapshot', 'Advanced Analytics', 'Hybrid Finance'];

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function RegionalCarbonMarketHubPage() {
  const [tab, setTab] = useState(0);
  const [selMarket, setSelMarket] = useState('eu');
  const [carbonQty, setCarbonQty] = useState(10000);
  const [srcMarket, setSrcMarket] = useState('india');
  const [dstMarket, setDstMarket] = useState('eu');

  const mkt = MARKETS[selMarket];
  const src = MARKETS[srcMarket];
  const dst = MARKETS[dstMarket];
  const arbitrageSpread = dst.price2025 - src.price2025;
  const arbitrageRevenue = arbitrageSpread * carbonQty;

  const combinedPriceHistory = MARKETS.eu.priceHistory.map((d, i) => ({
    yr: d.yr, eu: MARKETS.eu.priceHistory[i]?.p, india: MARKETS.india.priceHistory[i]?.p, japan: MARKETS.japan.priceHistory[i]?.p
  }));
  const combinedForward = MARKETS.eu.forwardCurve.map((d, i) => ({
    yr: d.yr, eu: MARKETS.eu.forwardCurve[i]?.p, india: MARKETS.india.forwardCurve[i]?.p, japan: MARKETS.japan.forwardCurve[i]?.p
  }));

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: 24 }}>
      <div style={{ borderBottom: `2px solid ${T.gold}`, paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 2 }}>EP-EA1 · INDIA GREEN ECONOMY CARBON FINANCE</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0', color: T.text }}>Regional Carbon Market Intelligence Hub</h1>
        <div style={{ fontSize: 12, color: T.textSec }}>EU ETS · India CCTS/PAT · Japan GX-ETS/J-Credit · Cross-Market Arbitrage · CBAM · JCM Corridors · Article 6 ITMOs · 10 Tabs</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Kpi label="EU ETS PRICE" value="€68/t" sub="EUA spot · Cap: 1,290 Mt" color="#3b82f6" />
        <Kpi label="INDIA CCTS PRICE" value="~$9/t" sub="CCert est. · PAT sectors" color="#f97316" />
        <Kpi label="JAPAN J-CREDIT" value="$12/t" sub="GX-ETS voluntary phase" color="#a855f7" />
        <Kpi label="CBAM STARTS" value="2026" sub="Full enforcement · India impact" color={T.red} />
        <Kpi label="JCM CORRIDORS" value="4 Active" sub="India bilateral offsets" color={T.sage} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '6px 14px', borderRadius: 4, border: `1px solid ${tab === i ? T.gold : T.border}`, background: tab === i ? T.navy : T.surface, color: tab === i ? T.gold : T.textSec, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>CARBON PRICE HISTORY — 3 MARKETS (USD EQUIV.)</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={combinedPriceHistory}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="yr" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Line type="monotone" dataKey="eu" stroke="#3b82f6" strokeWidth={2} name="EU ETS (€)" /><Line type="monotone" dataKey="india" stroke="#f97316" strokeWidth={2} name="India CCTS ($)" /><Line type="monotone" dataKey="japan" stroke="#a855f7" strokeWidth={2} name="Japan J-Credit ($)" /></LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>FORWARD PRICE CURVE (USD EQUIV., 2025-2030)</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={combinedForward}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="yr" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Line type="monotone" dataKey="eu" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 3" name="EU ETS Fwd" /><Line type="monotone" dataKey="india" stroke="#f97316" strokeWidth={2} strokeDasharray="5 3" name="India CCTS Fwd" /><Line type="monotone" dataKey="japan" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 3" name="Japan GX-ETS Fwd" /></LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, gridColumn: '1/-1' }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>3-MARKET SNAPSHOT</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {Object.values(MARKETS).map(m => (
                <div key={m.id} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 13, color: m.color, marginBottom: 8 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{m.label}</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                    <div><div style={{ fontSize: 10, color: T.textMut }}>SPOT PRICE</div><div style={{ fontSize: 20, fontWeight: 700, color: m.color, fontFamily: T.mono }}>${m.price2025}</div></div>
                    <div><div style={{ fontSize: 10, color: T.textMut }}>SECTORS</div><div style={{ fontSize: 20, fontWeight: 700, color: T.text, fontFamily: T.mono }}>{m.sectorsCovered}</div></div>
                  </div>
                  <div style={{ fontSize: 10, color: T.textMut, lineHeight: 1.7 }}>{m.mechanism.slice(0, 100)}...</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <Kpi label="EUA SPOT" value="€68/t" sub="Q2 2025" color="#3b82f6" />
            <Kpi label="2030 CAP DECLINE" value="4.3%/yr" sub="LRF post-2024" color={T.red} />
            <Kpi label="FREE ALLOCATION" value="43%" sub="Phase-out by 2034" color={T.amber} />
            <Kpi label="CBAM FULL" value="2026" sub="Steel/Al/Cement/Fert/H2" color={T.gold} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: '#3b82f6', marginBottom: 12 }}>EU ETS PRICE HISTORY (€/t EUA)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={MARKETS.eu.priceHistory}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="yr" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Line type="monotone" dataKey="p" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} name="EUA Price (€)" /></LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: '#3b82f6', marginBottom: 12 }}>EU ETS KEY REFORMS (FIT FOR 55)</div>
              {MARKETS.eu.reforms.map((r, i) => <div key={i} style={{ background: T.surfaceH, borderRadius: 4, padding: '8px 12px', marginBottom: 8, fontSize: 11, color: T.text }}><span style={{ color: '#3b82f6', marginRight: 8 }}>▸</span>{r}</div>)}
              <div style={{ background: T.navy, borderRadius: 6, padding: 12, marginTop: 10 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 6 }}>FUND ALLOCATION</div>
                {[['Innovation Fund', '€38Bn (2021-2030)'], ['Social Climate Fund', '€65Bn'], ['MSR Threshold', '833 Mt triggers cancellation'], ['CBAM Revenue', 'Est. €9-14Bn/yr by 2030']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
                    <span style={{ color: T.textSec }}>{k}</span><span style={{ color: T.gold, fontFamily: T.mono }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: '#3b82f6', marginBottom: 12 }}>COVERED SECTORS</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MARKETS.eu.sectors.map((s, i) => <span key={i} style={{ background: T.navy, color: '#3b82f6', borderRadius: 4, padding: '4px 10px', fontSize: 11, fontFamily: T.mono }}>{s}</span>)}
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <Kpi label="CCTS PRICE EST." value="~₹600-800/t" sub="CCert · Phase 1 2023-26" color="#f97316" />
            <Kpi label="PAT SECTORS" value="8" sub="~500 Mt covered" color={T.amber} />
            <Kpi label="ESCERT PRICE" value="~₹200-400/t" sub="Energy savings cert" color={T.teal} />
            <Kpi label="NDC TARGET" value="-45% vs 2005" sub="Emission intensity of GDP" color={T.sage} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: '#f97316', marginBottom: 12 }}>INDIA CCTS — PAT CYCLE STATUS</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>{['Sector', 'Units', 'Target', 'Achieved', 'ESCert', 'CCert'].map(h => <th key={h} style={{ padding: '7px 8px', textAlign: 'left', color: T.textMut, fontFamily: T.mono }}>{h}</th>)}</tr></thead>
                <tbody>{INDIA_PAT_SECTORS.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '7px 8px', color: '#f97316', fontFamily: T.mono }}>{s.sector}</td>
                    <td style={{ padding: '7px 8px', color: T.text }}>{s.units}</td>
                    <td style={{ padding: '7px 8px', color: T.textSec, fontFamily: T.mono }}>{s.targetMtoe}</td>
                    <td style={{ padding: '7px 8px', color: s.achieved2024 >= s.targetMtoe ? T.green : T.red, fontFamily: T.mono }}>{s.achieved2024}</td>
                    <td style={{ padding: '7px 8px', color: T.gold, fontFamily: T.mono }}>{s.escertEarned}</td>
                    <td style={{ padding: '7px 8px', color: '#f97316', fontFamily: T.mono }}>{s.ccertEarned}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: '#f97316', marginBottom: 12 }}>CCTS FRAMEWORK & KEY REFORMS</div>
              {MARKETS.india.reforms.map((r, i) => <div key={i} style={{ background: T.surfaceH, borderRadius: 4, padding: '8px 12px', marginBottom: 8, fontSize: 11, color: T.text }}><span style={{ color: '#f97316', marginRight: 8 }}>▸</span>{r}</div>)}
              <div style={{ background: T.navy, borderRadius: 6, padding: 12, marginTop: 10 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 8 }}>CARBON CERT TYPES (INDIA)</div>
                {[['ESCert (Energy Savings)', 'PAT scheme, mtoe-based', T.teal], ['CCert (Carbon Credit)', 'CCTS Phase 1, tCO₂-based', '#f97316'], ['REC (Renewable Energy)', 'RPO compliance, ₹3-6/kWh', T.green], ['CCTS Offset Credit', 'Non-obligated sectors, under design', T.amber]].map(([label, desc, color]) => (
                  <div key={label} style={{ marginBottom: 8 }}>
                    <div style={{ fontFamily: T.mono, fontSize: 11, color }}>{label}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <Kpi label="J-CREDIT PRICE" value="$8-22/t" sub="Varies by methodology" color="#a855f7" />
            <Kpi label="GX BOND" value="¥20 Tn" sub="10-year green transformation" color={T.gold} />
            <Kpi label="GX-ETS MANDATORY" value="2026" sub="GX League voluntary closes 2025" color={T.amber} />
            <Kpi label="JCM COUNTRIES" value="25+" sub="Bilateral offset mechanism" color={T.sage} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: '#a855f7', marginBottom: 12 }}>JAPAN GX-ETS TRANSITION TIMELINE</div>
              {[['2020-2022', 'J-Credit scheme scaling — forestry, renewables, energy eff.', T.textSec], ['2023-2025', 'GX League (voluntary) — 600+ companies, ¥20Tn GX Bond issuance', '#a855f7'], ['2026', 'GX-ETS Phase 1 (mandatory) — power sector. Free allocation 100%', T.amber], ['2028', 'Carbon levy introduced — ¥289/tCO₂ starting low', T.amber], ['2033', 'Auctioning starts — progressive transition from free allocation', T.red], ['2050', 'Carbon neutrality target', T.green]].map(([yr, desc, color]) => (
                <div key={yr} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color, minWidth: 60 }}>{yr}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: '#a855f7', marginBottom: 12 }}>J-CREDIT METHODOLOGY TYPES</div>
              {[['Renewable Energy (solar/wind)', '$12-18/t', 'ACM0002 / JCM AMS-I.D.'], ['Energy Efficiency (industry)', '$8-14/t', 'JCM EE methodology'], ['Forestry & Land Use', '$10-20/t', 'AR-CM001 / VCS+JCM'], ['Waste Management', '$6-12/t', 'CDM AMS-III.F equiv.'], ['Agriculture (biochar/soil)', '$15-22/t', 'Japan Agricultural Carbon'], ['EV / Clean Transport', '$10-16/t', 'AMS-III.C JCM version']].map(([name, price, method]) => (
                <div key={name} style={{ background: T.surfaceH, borderRadius: 4, padding: '8px 12px', marginBottom: 8 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: '#a855f7' }}>{name}</div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: T.gold, fontFamily: T.mono }}>{price}</span>
                    <span style={{ fontSize: 10, color: T.textSec }}>{method}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>CROSS-MARKET COMPARISON MATRIX</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Metric', 'EU ETS', 'India CCTS', 'Japan GX-ETS'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textMut, fontFamily: T.mono }}>{h}</th>)}
              </tr></thead>
              <tbody>{CROSS_MARKET_COMPARE.map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                  <td style={{ padding: '8px 12px', color: T.textSec, fontFamily: T.mono }}>{row.metric}</td>
                  <td style={{ padding: '8px 12px', color: '#3b82f6' }}>{row.eu}</td>
                  <td style={{ padding: '8px 12px', color: '#f97316' }}>{row.india}</td>
                  <td style={{ padding: '8px 12px', color: '#a855f7' }}>{row.japan}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: '#f97316', marginBottom: 12 }}>INDIA PAT SECTOR PERFORMANCE (PAT Cycle 6 est.)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={INDIA_PAT_SECTORS}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="sector" stroke={T.textMut} tick={{ fontSize: 9 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Bar dataKey="targetMtoe" fill={T.navy} name="Target (Mtoe)" /><Bar dataKey="achieved2024" fill="#f97316" name="Achieved (Mtoe)" /></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: '#f97316', marginBottom: 12 }}>ESCert / CCert EARNED BY SECTOR</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={INDIA_PAT_SECTORS}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="sector" stroke={T.textMut} tick={{ fontSize: 9 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Bar dataKey="escertEarned" fill={T.teal} name="ESCert Earned" /><Bar dataKey="ccertEarned" fill="#f97316" name="CCert Earned" /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.red, marginBottom: 12 }}>INDIA CBAM EXPOSURE — KEY EXPORT SECTORS (@ €68/t EUA, 2026)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>{['Sector', 'Exports to EU (Mt)', 'CO₂ Intensity', 'Est. CBAM Cost', 'Mitigation via India CCTS?'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textMut, fontFamily: T.mono }}>{h}</th>)}</tr></thead>
              <tbody>{CBAM_EXPOSURE.map((c, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                  <td style={{ padding: '8px 10px', color: T.gold, fontFamily: T.mono }}>{c.sector}</td>
                  <td style={{ padding: '8px 10px', color: T.text, fontFamily: T.mono }}>{c.exportToEU_Mt}</td>
                  <td style={{ padding: '8px 10px', color: T.amber, fontFamily: T.mono }}>{c.co2IntensityT} tCO₂/t</td>
                  <td style={{ padding: '8px 10px', color: T.red, fontFamily: T.mono }}>${c.cbamCostUsdM.toFixed(0)}M/yr</td>
                  <td style={{ padding: '8px 10px', color: T.sage }}>Partial (if CCTS carbon price recognised by EU)</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.red, marginBottom: 12 }}>CBAM MITIGATION STRATEGY FOR INDIAN EXPORTERS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['CCTS Carbon Price Credit', 'If India CCTS price recognised, deduct from CBAM liability (Art. 9 CBAM Reg)', T.sage], ['Switch to Green Power (RE100)', 'Zero-carbon electricity reduces Scope 2 in CBAM calc; solar PPA key strategy', T.green], ['Green H2 / DRI-EAF (Steel)', 'Decarbonise process — H2-DRI reduces steel CO₂ from 1.85→0.2 tCO₂/t', T.teal], ['Product Carbon Passport', 'EPD documentation for CBAM declarant — reduces risk of over-reporting', T.amber], ['Export shift to non-CBAM markets', 'Short-term: divert to ASEAN/MENA; longer-term: decarbonise for EU market', T.gold], ['JCM / Article 6 Credits', 'Use J-Credit or ITMO to offset residual CBAM — pending regulatory clarity', '#a855f7']].map(([label, desc, color]) => (
                <div key={label} style={{ background: T.surfaceH, borderRadius: 6, padding: 12 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 7 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {JCM_CORRIDORS.map((c, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold }}>{c.corridor}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{c.type} · Volume 2025: {c.volume2025Mt}Mt</div>
                </div>
                <div style={{ background: c.status === 'Active' ? T.sage : T.navy, borderRadius: 4, padding: '4px 10px', fontFamily: T.mono, fontSize: 11, color: c.status === 'Active' ? T.text : T.amber }}>{c.status}</div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ background: T.surfaceH, borderRadius: 4, padding: 10, flex: 1 }}>
                  <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>ITMO PRICE</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.gold, fontFamily: T.mono, marginTop: 3 }}>{c.itmoPrice}</div>
                </div>
                <div style={{ background: T.surfaceH, borderRadius: 4, padding: 10, flex: 3 }}>
                  <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>ELIGIBLE SECTORS</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    {c.sectors.map((s, j) => <span key={j} style={{ background: T.navy, color: T.teal, borderRadius: 3, padding: '2px 7px', fontSize: 10 }}>{s}</span>)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>ARTICLE 6 MECHANISM OVERVIEW</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[['Article 6.2 (ITMO)', 'Bilateral agreements between countries. India→Japan, India→Korea. Corresponding adjustments required. NDC surplus tradeable.', '#3b82f6'], ['Article 6.4 (Supervisory Body)', 'UN-administered carbon market. A6.4ERs. India eligible as host. First A6.4 project approvals 2025.', '#f97316'], ['Article 6.8 (Non-market)', 'Bilateral cooperation — technology transfer, capacity building. Complements 6.2 flows.', '#a855f7']].map(([label, desc, color]) => (
                <div key={label} style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 12, color, marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 8 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>PRICE CONVERGENCE FORECAST (USD/tCO₂)</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={combinedForward}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="yr" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Line type="monotone" dataKey="eu" stroke="#3b82f6" strokeWidth={3} name="EU ETS" /><Line type="monotone" dataKey="india" stroke="#f97316" strokeWidth={3} name="India CCTS" /><Line type="monotone" dataKey="japan" stroke="#a855f7" strokeWidth={3} name="Japan GX-ETS" /></LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[['Convergence Driver: CBAM', 'CBAM forces Indian exporters to align with EU carbon price, creating implicit parity pressure on CCTS price trajectory', T.red], ['Convergence Driver: JCM/Article 6', 'ITMO flows arbitrage price differentials — will compress spread between India/Japan and EU over 2026-2030', '#a855f7'], ['Convergence Outlook', 'By 2030: EU ~$110 · Japan ~$50 · India ~$35. Gap narrows but won\'t fully close due to different mechanisms', T.gold]].map(([label, desc, color]) => (
              <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontFamily: T.mono, fontSize: 12, color }}>{label}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 8, lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 9 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 16 }}>CROSS-MARKET ARBITRAGE CALCULATOR</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 6, fontFamily: T.mono }}>SOURCE MARKET (BUY)</div>
              <select value={srcMarket} onChange={e => setSrcMarket(e.target.value)} style={{ background: T.surfaceH, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 10px', width: '100%', fontFamily: T.mono, fontSize: 11 }}>
                {Object.values(MARKETS).map(m => <option key={m.id} value={m.id}>{m.name} (${m.price2025}/t)</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 6, fontFamily: T.mono }}>DESTINATION MARKET (SELL)</div>
              <select value={dstMarket} onChange={e => setDstMarket(e.target.value)} style={{ background: T.surfaceH, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 10px', width: '100%', fontFamily: T.mono, fontSize: 11 }}>
                {Object.values(MARKETS).map(m => <option key={m.id} value={m.id}>{m.name} (${m.price2025}/t)</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, fontFamily: T.mono }}>VOLUME (tCO₂): <span style={{ color: T.gold }}>{carbonQty.toLocaleString()}</span></div>
              <input type="range" min={1000} max={500000} step={1000} value={carbonQty} onChange={e => setCarbonQty(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
            </div>
            <div style={{ background: T.navy, borderRadius: 8, padding: 16, marginTop: 8 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 10 }}>ARBITRAGE RESULTS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Buy Price</div><div style={{ fontSize: 18, fontWeight: 700, color: src.color || T.teal, fontFamily: T.mono }}>${src.price2025}/t</div></div>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Sell Price</div><div style={{ fontSize: 18, fontWeight: 700, color: dst.color || T.gold, fontFamily: T.mono }}>${dst.price2025}/t</div></div>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Spread</div><div style={{ fontSize: 18, fontWeight: 700, color: arbitrageSpread > 0 ? T.green : T.red, fontFamily: T.mono }}>${arbitrageSpread}/t</div></div>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Gross Revenue</div><div style={{ fontSize: 18, fontWeight: 700, color: arbitrageRevenue > 0 ? T.green : T.red, fontFamily: T.mono }}>${(arbitrageRevenue / 1e6).toFixed(2)}M</div></div>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: T.amber }}>* Requires Article 6 Corresponding Adjustment for cross-border credit transfer. Transaction costs: est. 8-15% of spread.</div>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>ARBITRAGE OPPORTUNITIES RANKED</div>
            {[['India CCTS → EU ETS', '$9 → $68', '$59/t spread', 'HIGH', 'Requires Art. 6.2 CA'], ['India CCTS → Japan GX-ETS', '$9 → $12', '$3/t spread', 'LOW', 'JCM bilateral possible'], ['Japan J-Credit → EU ETS', '$12 → $68', '$56/t spread', 'HIGH', 'EU does not accept J-Credit currently'], ['Voluntary VCS → India CCTS', '$18 → $9', 'Negative spread', 'NONE', 'Domestic compliance only'], ['India NDC surplus → Japan', '$9 → $14 (ITMO)', '$5/t ITMO premium', 'MEDIUM', 'Article 6.2 signed MOU']].map(([name, prices, spread, opp, note]) => (
              <div key={name} style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold }}>{name}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: opp === 'HIGH' ? T.green : opp === 'MEDIUM' ? T.amber : T.red }}>{opp}</div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 10, color: T.teal, fontFamily: T.mono }}>{prices}</span>
                  <span style={{ fontSize: 10, color: T.amber, fontFamily: T.mono }}>{spread}</span>
                </div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>{note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 10 && (
        <IndiaAdvancedAnalytics
          T={T}
          moduleCode="EP-EA1"
          title="Cross-Market Arbitrage — MC, Tornado & NGFS Scenario Suite"
          mcModel={{
            title: `MC Arbitrage Revenue ($M) · ${src.name} → ${dst.name}`,
            unit: 'M',
            fmt: (n) => (n / 1e6).toFixed(2),
            vars: {
              srcPrice: { min: src.price2025 * 0.7, mode: src.price2025, max: src.price2025 * 1.3 },
              dstPrice: { min: dst.price2025 * 0.7, mode: dst.price2025, max: dst.price2025 * 1.3 },
              qty:      { min: carbonQty * 0.6,     mode: carbonQty,     max: carbonQty * 1.4 },
              artSix:   { min: 0.05,                mode: 0.12,          max: 0.25 },
            },
            compute: (v) => Math.max(0, (v.dstPrice - v.srcPrice) * (1 - v.artSix)) * v.qty,
          }}
          tornadoModel={{
            title: `${src.name} → ${dst.name} arbitrage revenue ($)`,
            fmt: (n) => '$' + (n / 1e6).toFixed(2) + 'M',
            inputs: { srcPrice: src.price2025, dstPrice: dst.price2025, qty: carbonQty, artSix: 0.12 },
            compute: (v) => Math.max(0, (v.dstPrice - v.srcPrice) * (1 - v.artSix)) * v.qty,
          }}
          scenarioImpact={(priceUSDt) => Math.max(0, priceUSDt - src.price2025) * carbonQty / 1e6}
          scenarioFmt={(n) => '$' + n.toFixed(1) + 'M'}
          scenarioTitle="Arbitrage Revenue $M — NGFS/IEA destination price × horizons"
          peers={{
            cols: [
              { k: 'name', label: 'Market' },
              { k: 'p25', label: '2025 $/t', align: 'right', mono: true },
              { k: 'p30', label: '2030 $/t', align: 'right', mono: true },
              { k: 'cov', label: 'Coverage Mt', align: 'right', mono: true },
              { k: 'mech', label: 'Mechanism' },
            ],
            rows: [
              { name: 'EU ETS',         p25: 68, p30: 110, cov: '1,290', mech: 'Cap-and-trade · Auction 57%' },
              { name: 'India CCTS',     p25: 9,  p30: 35,  cov: '~500',  mech: 'Intensity-based · Offset' },
              { name: 'Japan GX-ETS',   p25: 12, p30: 50,  cov: '600',   mech: 'Voluntary → Mandatory 2026' },
              { name: 'UK ETS',         p25: 45, p30: 85,  cov: '156',   mech: 'Cap-and-trade · CBAM 2027' },
              { name: 'Korea K-ETS',    p25: 8,  p30: 28,  cov: '590',   mech: 'Cap-and-trade · offset eligible' },
              { name: 'China National', p25: 12, p30: 40,  cov: '4,500', mech: 'Power sector · intensity' },
            ],
          }}
          defaultCovered={['gov1', 'str1', 'str2', 'met1', 'met2', 'met3']}
        />
      )}


      {tab === 11 && (
        <IndiaGreenHybridFinance T={T} useCases={[
    {
      tag: 'UC-1', title: 'EU ETS compliance buyer: Art 6 ITMO procurement strategy',
      persona: 'EU Steel Manufacturer (ETS obligated)', personaDetail: 'Annual ETS obligation: 4.5 MtCO2; short 800 ktCO2 post-MSR tightening',
      problem: 'EUA @ €85/t creates €68M compliance cost; CBAM on scrap imports. Seeks ITMOs (Art 6.2 India-JCM) at cleared €12-18/t to offset 10% via DNSH projects.', outcome: 'Procures 500 kt ITMO @ €15/t from Indian solar portfolio; books €35M compliance saving vs EUA; 6.3x IRR on pre-paid ITMO advance to developer.',
      capitalStack: [
          { label: 'ITMO pre-pay (senior)', amount: 75, unit: '€M', source: 'EU buyer advance' },
          { label: 'Developer equity', amount: 45, unit: '€M', source: 'Indian IPP' },
          { label: 'Green bond (NaBFID wrap)', amount: 120, unit: '€M', source: '10-yr NaBFID/IREDA' },
          { label: 'GCF concessional', amount: 25, unit: '€M', source: 'NABARD-GCF 3.5%/20Y' },
        ],
      revenueStack: [
          { label: 'ITMO sale (500 kt × €15)', value: 7.5, source: 'Art 6.2 BTA · CA applied', scenSens: true },
          { label: 'India CCTS credit', value: 2.2, source: '20% CCC retained · ₹2,200/t', scenSens: true },
          { label: 'Green PPA premium', value: 3.1, source: 'Green tariff vs grey basis' },
          { label: 'REC monetisation', value: 0.8, source: 'CERC REC floor ₹1,000' },
        ],
      revenueUnit: '€M/yr',
      termSheet: [
          { k: 'Instrument', v: 'Pre-paid ITMO forward' },
          { k: 'Volume', v: '500 kt CO2e / 5Y' },
          { k: 'Strike', v: '€15/t · collar €12-22' },
          { k: 'Tenor', v: '5Y · annual delivery' },
          { k: 'Settlement', v: 'Post-DOA + MoEFCC LoA' },
          { k: 'Buffer pool', v: '15% delivery buffer' },
          { k: 'Counterparty', v: 'A- (EU buyer)' },
          { k: 'Legal', v: 'ICC Paris · English law' },
        ],
      dscrCovenant: 1.25,
      financialModel: {
        years: 10, revenue0: 13.6, revenueGrowth: 0.045,
        opexPct: 0.18, daPct: 0.08, taxRate: 0.22, wacc: 0.07,
        capex: [5.5, 4.8, 3.2, 1.8, 1.2, 0.8, 0.5, 0.5, 0.4, 0.3],
        debtService: 8.4,
      },
      risk: {
        var95: 2.1, es99: 4.8, defaultProb: 0.018,
        policyScore: 6.5, fxSensPct: -3.2, fxPair: 'EUR/INR',
        carbonBeta: 0.62, dv01: 0.08, climVaR: 1.6,
        unit: '€M', ratingImplied: 'A- (EU buyer) · BB+ (developer)',
      },
      bankability: [
          { label: 'EU buyer credit (A-)', score: 8.5 },
          { label: 'Art 6 BTA enforceability', score: 6.5 },
          { label: 'Solar portfolio tech risk', score: 9.0 },
          { label: 'Price collar structure', score: 7.5 },
          { label: 'MRV (DOE + ICVCM CCP)', score: 8.0 },
          { label: 'Delivery / COD phasing', score: 7.0 },
        ],
      lenders: [
          { name: 'NaBFID', instrument: 'Senior term (INR)', tenor: '15Y', pricing: 'MCLR+150', ticket: '₹800Cr', fit: 'High' },
          { name: 'IREDA', instrument: 'Green senior', tenor: '15Y', pricing: 'RR+175', ticket: '₹400Cr', fit: 'High' },
          { name: 'GCF (NABARD)', instrument: 'Concessional', tenor: '20Y', pricing: '3.5% fixed', ticket: '$40M', fit: 'High' },
          { name: 'Credit Agricole', instrument: 'EU buyer structured', tenor: '7Y', pricing: 'EURIBOR+220', ticket: '€60M', fit: 'Mid' },
          { name: 'JBIC', instrument: 'JCM co-finance', tenor: '12Y', pricing: 'JIBOR+120', ticket: '¥8B', fit: 'Mid' },
        ],
      closingNotes: 'Arbitrage window €50-70/t (EUA spot minus ITMO cleared). Critical: (1) Art 6 corresponding-adjustment timing (MoEFCC LoA post-verification); (2) CBAM deductibility of ITMOs — EC ruling pending. Mitigants: pre-pay locks price; buffer absorbs under-delivery; CCP label preserves VCM sale if compliance route closes.',
    },
    {
      tag: 'UC-2', title: '$500M multi-market carbon trading book',
      persona: 'Tier-1 commodity trading house', personaDetail: 'Proprietary mandate: $500M deployed across 4 carbon markets · VaR limit 8%',
      problem: 'EU ETS, India CCTS, Japan GX-ETS, Art 6 ITMO show 5-8× dispersion. Construct optimal book: EUA long (€85) vs ITMO long (€15) + EUA puts @ €70 for carry.', outcome: 'Book: 60% ITMO long, 25% CCC long, 15% EUA collar. Expected ROE 22% vs single-market 9%.',
      capitalStack: [
          { label: 'Proprietary capital', amount: 300, unit: '$M', source: 'House book' },
          { label: 'Repo on EUA inventory', amount: 120, unit: '$M', source: 'ICE Clear haircut 12%' },
          { label: 'Prime brokerage margin', amount: 80, unit: '$M', source: 'JPM / MS' },
        ],
      revenueStack: [
          { label: 'EUA carry (theta + basis)', value: 18, source: '€75-strike put roll-down', scenSens: true },
          { label: 'ITMO appreciation', value: 37, source: 'MTM vs delivery', scenSens: true },
          { label: 'CCC rally (CCTS compliance)', value: 23, source: 'Compliance cycle tightening', scenSens: true },
          { label: 'VCM Removals rotational', value: 6, source: 'ICVCM CCP uplift', scenSens: true },
        ],
      revenueUnit: '$M/yr',
      termSheet: [
          { k: 'Book NAV', v: '$500M' },
          { k: 'Max VaR 95%/1d', v: '$25M (5.0%)' },
          { k: 'Stress loss ES 99%', v: '$60M (12%)' },
          { k: 'Prime brokers', v: 'JPM · MS · Nomura' },
          { k: 'Clearing', v: 'ICE · EEX · MEX' },
          { k: 'Leverage cap', v: '2.5×' },
          { k: 'Holding period', v: '6-24M' },
          { k: 'Fee', v: '2% + 20% carry' },
        ],
      dscrCovenant: 1.50,
      financialModel: {
        years: 10, revenue0: 84, revenueGrowth: 0.055,
        opexPct: 0.22, daPct: 0.04, taxRate: 0.20, wacc: 0.08,
        capex: [25, 15, 10, 8, 6, 5, 4, 4, 3, 3],
        debtService: 14.2,
      },
      risk: {
        var95: 25.2, es99: 60.8, defaultProb: 0.008,
        policyScore: 5.5, fxSensPct: -4.5, fxPair: 'EUR/USD · INR/USD basket',
        carbonBeta: 1.35, dv01: 0.34, climVaR: 8.2,
        unit: '$M', ratingImplied: 'Desk internal AA-',
      },
      bankability: [
          { label: 'EU ETS liquidity', score: 9.5 },
          { label: 'India CCTS liquidity', score: 4.5 },
          { label: 'ITMO basis risk', score: 5.5 },
          { label: 'Funding (repo stability)', score: 7.5 },
          { label: 'Regulatory overhang (CBAM)', score: 6.5 },
          { label: 'Desk talent (12Y ETS)', score: 8.0 },
        ],
      lenders: [
          { name: 'JPMorgan Prime', instrument: 'Margin financing', tenor: 'Rolling', pricing: 'SOFR+85', ticket: '$50M', fit: 'High' },
          { name: 'Morgan Stanley', instrument: 'Synthetic prime', tenor: 'Rolling', pricing: 'SOFR+95', ticket: '$40M', fit: 'High' },
          { name: 'ICE Clear Europe', instrument: 'EUA repo', tenor: '1M', pricing: 'ESTR+45', ticket: '€30M', fit: 'High' },
        ],
      closingNotes: 'Book hinges on (i) Art 6 BTA delivery discipline; (ii) CCTS auction price discovery Q3-26; (iii) EUA MSR cancellation through 2027. 25% overlay via EUA Dec-27 puts @ €70 (prem 4.2%) caps drawdown in disorderly scenario.',
    },
  ]} moduleCode="EP-EA1" title="Cross-Market Carbon Arbitrage & Compliance"
        />
      )}

      <Apr2026CarbonAnalytics moduleCode="EP-EA1" moduleTitle="Regional Carbon Market Hub" flavor="market" basePrice={mkt.price2025} T={T} />
    </div>
  );
}
