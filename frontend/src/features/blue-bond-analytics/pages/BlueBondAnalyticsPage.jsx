import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', gold: '#d4a843', sage: '#2d6a4f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const ISSUERS = [
  { id: 'wb', name: 'World Bank (IBRD)', type: 'Sovereign-Backed', rating: 'AAA', sizeGbn: 5.0, greeniumBps: 14, coupon: 3.85, maturity: 10, oceanFocus: ['Ocean pollution', 'Sustainable fisheries', 'Coastal protection'], iswgAligned: true, cbiCertified: true, country: 'Supranational' },
  { id: 'adb', name: 'Asian Development Bank', type: 'Supranational', rating: 'AAA', sizeGbn: 3.2, greeniumBps: 12, coupon: 3.95, maturity: 8, oceanFocus: ['Coral reef finance', 'Ocean waste', 'Blue infrastructure'], iswgAligned: true, cbiCertified: true, country: 'Supranational' },
  { id: 'seyc', name: 'Republic of Seychelles', type: 'Sovereign', rating: 'BB-', sizeGbn: 0.015, greeniumBps: 6, coupon: 6.50, maturity: 10, oceanFocus: ['MPA finance', 'Sustainable fisheries', 'Debt-for-nature'], iswgAligned: true, cbiCertified: false, country: 'Seychelles' },
  { id: 'belem', name: 'Belem Development Bank', type: 'DFI', rating: 'A+', sizeGbn: 1.8, greeniumBps: 10, coupon: 4.25, maturity: 7, oceanFocus: ['Amazon-ocean nexus', 'Blue carbon', 'Fisheries'], iswgAligned: true, cbiCertified: true, country: 'Brazil' },
  { id: 'eib', name: 'European Investment Bank', type: 'Supranational', rating: 'AAA', sizeGbn: 4.5, greeniumBps: 16, coupon: 3.45, maturity: 12, oceanFocus: ['Ocean clean-up', 'Port decarbonization', 'Marine biodiversity'], iswgAligned: true, cbiCertified: true, country: 'EU' },
  { id: 'nordic', name: 'Nordic Investment Bank', type: 'Supranational', rating: 'AAA', sizeGbn: 2.1, greeniumBps: 13, coupon: 3.60, maturity: 10, oceanFocus: ['Arctic ocean', 'Baltic fisheries', 'Blue infrastructure'], iswgAligned: true, cbiCertified: true, country: 'Nordic' },
  { id: 'nor', name: 'Kingdom of Norway', type: 'Sovereign', rating: 'AAA', sizeGbn: 2.8, greeniumBps: 11, coupon: 3.20, maturity: 15, oceanFocus: ['Offshore wind', 'Ocean monitoring', 'Fisheries management'], iswgAligned: true, cbiCertified: false, country: 'Norway' },
  { id: 'aus', name: 'Commonwealth of Australia', type: 'Sovereign', rating: 'AAA', sizeGbn: 1.5, greeniumBps: 9, coupon: 4.10, maturity: 10, oceanFocus: ['Great Barrier Reef', 'Coastal fisheries', 'Maritime emissions'], iswgAligned: false, cbiCertified: false, country: 'Australia' },
];

const USE_OF_PROCEEDS = [
  { category: 'Sustainable Fisheries & Aquaculture', share: 24, avgIrr: 7.2, co2Mt: 1.4, description: 'MSC-certified fleet, selective gear, MPA compliance' },
  { category: 'Marine Protected Area Finance', share: 19, avgIrr: 5.8, co2Mt: 3.2, description: 'MPA establishment, enforcement, ecosystem valuation' },
  { category: 'Ocean Pollution Reduction', share: 18, avgIrr: 6.5, co2Mt: 0.8, description: 'Plastic cleanup, nutrient runoff, vessel waste' },
  { category: 'Coastal & Port Infrastructure', share: 16, avgIrr: 8.1, co2Mt: 1.1, description: 'Green ports, sea level adaptation, flood barriers' },
  { category: 'Blue Carbon & Habitat Restoration', share: 13, avgIrr: 6.0, co2Mt: 5.6, description: 'Mangrove, seagrass, kelp restoration finance' },
  { category: 'Shipping Decarbonization', share: 10, avgIrr: 9.2, co2Mt: 4.8, description: 'Ammonia/methanol vessels, shore power, CII compliance' },
];

const MARKET_GROWTH = [
  { year: 2018, issuanceGbn: 1.4, deals: 8, avgGreeniumBps: 5 },
  { year: 2019, issuanceGbn: 3.8, deals: 18, avgGreeniumBps: 7 },
  { year: 2020, issuanceGbn: 5.2, deals: 24, avgGreeniumBps: 8 },
  { year: 2021, issuanceGbn: 9.1, deals: 41, avgGreeniumBps: 10 },
  { year: 2022, issuanceGbn: 12.4, deals: 58, avgGreeniumBps: 11 },
  { year: 2023, issuanceGbn: 18.7, deals: 82, avgGreeniumBps: 12 },
  { year: 2024, issuanceGbn: 26.3, deals: 115, avgGreeniumBps: 14 },
  { year: 2025, issuanceGbn: 34.8, deals: 148, avgGreeniumBps: 15 },
];

const FRAMEWORKS = [
  { name: 'ISWG Blue Bond Principles', body: 'ISWG (WB/GEF/WWF)', pillars: ['Sustainable fisheries', 'Ocean ecosystem', 'Blue economy'], mandatory: true, greeniumBps: 12 },
  { name: 'CBI Blue Economy Criteria', body: 'Climate Bonds Initiative', pillars: ['Marine-based renewable energy', 'Sustainable fisheries', 'Blue carbon'], mandatory: false, greeniumBps: 15 },
  { name: 'ICMA Green Bond Principles', body: 'ICMA', pillars: ['Use of proceeds', 'Evaluation', 'Reporting', 'Management'], mandatory: false, greeniumBps: 11 },
  { name: 'UN SDG 14 (Life Below Water)', body: 'United Nations', pillars: ['Ocean acidification', 'Marine pollution', 'Fisheries management'], mandatory: false, greeniumBps: 8 },
  { name: 'EU Sustainable Finance Taxonomy', body: 'European Commission', pillars: ['Coastal protection', 'Marine biodiversity', 'Sustainable aquaculture'], mandatory: true, greeniumBps: 13 },
];

const OCEAN_RISKS = [
  { risk: 'Acidification Exposure', severity: 74, trend: 'Worsening', linkedAssets: ['Aquaculture', 'Coral reef tourism', 'Shellfish'] },
  { risk: 'Sea Level Rise Stranding', severity: 68, trend: 'Worsening', linkedAssets: ['Coastal infrastructure', 'Port assets', 'MPA boundaries'] },
  { risk: 'Fisheries Stock Depletion', severity: 61, trend: 'Stable', linkedAssets: ['Fishing fleets', 'Aquaculture bonds', 'Seafood processing'] },
  { risk: 'Marine Heatwave Events', severity: 72, trend: 'Worsening', linkedAssets: ['Coral reef', 'Kelp forests', 'Cold-water fisheries'] },
  { risk: 'Plastic & Chemical Pollution', severity: 55, trend: 'Improving', linkedAssets: ['Coastal tourism', 'Seafood certification', 'MPA integrity'] },
  { risk: 'Shipping GHG Transition', severity: 48, trend: 'Improving', linkedAssets: ['Port operators', 'Shipping fleets', 'Fuel infrastructure'] },
];

const TABS = ['Overview', 'Issuers & Deals', 'Use of Proceeds', 'Greenium Engine', 'Frameworks', 'Market Growth', 'Ocean Risk', 'Credit Analysis', 'ESG Impact', 'Portfolio Builder'];

function calcGreenium({ faceValue, greeniumBps, maturity }) {
  const annSaving = faceValue * (greeniumBps / 10000);
  return annSaving * maturity;
}
function calcYieldEquiv({ coupon, spread, maturity }) {
  return coupon + spread / 100 + (maturity > 10 ? 0.15 : 0);
}
function calcImpact({ sizeGbn, useOfProceedsShare, co2Mt }) {
  return (sizeGbn * useOfProceedsShare / 100) * co2Mt;
}

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function BlueBondAnalyticsPage() {
  const [tab, setTab] = useState(0);
  const [selIssuer, setSelIssuer] = useState('wb');
  const [faceValue, setFaceValue] = useState(100);
  const [maturity, setMaturity] = useState(10);
  const [selFramework, setSelFramework] = useState(0);
  const [portfolio, setPortfolio] = useState([]);

  const issuer = ISSUERS.find(i => i.id === selIssuer) || ISSUERS[0];
  const fw = FRAMEWORKS[selFramework];

  const greeniumSaving = calcGreenium({ faceValue, greeniumBps: issuer.greeniumBps, maturity });
  const totalIssuance = ISSUERS.reduce((s, i) => s + i.sizeGbn, 0);
  const avgGreenium = ISSUERS.length > 0 ? ISSUERS.reduce((s, i) => s + i.greeniumBps, 0) / ISSUERS.length : 0;
  const iswgCount = ISSUERS.filter(i => i.iswgAligned).length;
  const totalCo2Impact = USE_OF_PROCEEDS.reduce((s, u) => s + u.co2Mt, 0);

  const scatterData = ISSUERS.map(i => ({ x: i.sizeGbn, y: i.greeniumBps, name: i.name, rating: i.rating }));
  const riskColor = (s) => s >= 70 ? T.red : s >= 55 ? T.amber : T.green;
  const portfolioTotal = portfolio.reduce((s, p) => s + p.amount, 0);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: 24 }}>
      <div style={{ borderBottom: `2px solid ${T.gold}`, paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 2 }}>EP-DZ1 · OCEAN & BLUE ECONOMY FINANCE</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0', color: T.text }}>Blue Bond Analytics Suite</h1>
        <div style={{ fontSize: 12, color: T.textSec }}>Sovereign · Supranational · DFI · ISWG/CBI/ICMA Frameworks · Ocean Impact · Greenium Engine · 10 Tabs</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Kpi label="TOTAL ISSUANCE" value={`$${totalIssuance.toFixed(1)}Bn`} sub="8 tracked issuers" />
        <Kpi label="AVG GREENIUM" value={`${avgGreenium.toFixed(1)} bps`} sub="vs conventional peers" color={T.teal} />
        <Kpi label="ISWG ALIGNED" value={`${iswgCount}/${ISSUERS.length}`} sub="Blue bond principles" color={T.sage} />
        <Kpi label="CO₂ IMPACT" value={`${totalCo2Impact.toFixed(1)} MtCO₂`} sub="Across use-of-proceeds" color={T.green} />
        <Kpi label="2025 MARKET" value="$34.8Bn" sub="Global blue bond issuance" color={T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '6px 14px', borderRadius: 4, border: `1px solid ${tab === i ? T.gold : T.border}`, background: tab === i ? T.navy : T.surface, color: tab === i ? T.gold : T.textSec, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>MARKET ISSUANCE GROWTH ($Bn)</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={MARKET_GROWTH}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Area type="monotone" dataKey="issuanceGbn" stroke={T.teal} fill={T.teal} fillOpacity={0.3} name="Issuance ($Bn)" /></AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>USE OF PROCEEDS SPLIT (%)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={USE_OF_PROCEEDS}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="category" stroke={T.textMut} tick={{ fontSize: 9 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Bar dataKey="share" fill={T.sage} name="Share (%)" /></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, gridColumn: '1/-1' }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>OCEAN RISK SEVERITY DASHBOARD</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {OCEAN_RISKS.map((r, i) => (
                <div key={i} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: riskColor(r.severity), marginBottom: 6 }}>{r.risk}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: riskColor(r.severity), fontFamily: T.mono }}>{r.severity}/100</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>Trend: {r.trend}</div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{r.linkedAssets.join(' · ')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ISSUERS.map(i => (
              <button key={i.id} onClick={() => setSelIssuer(i.id)} style={{ padding: '6px 12px', borderRadius: 4, border: `1px solid ${selIssuer === i.id ? T.gold : T.border}`, background: selIssuer === i.id ? T.navy : T.surface, color: selIssuer === i.id ? T.gold : T.text, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{i.name}</button>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold, marginBottom: 16 }}>{issuer.name} · {issuer.type} · {issuer.rating}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              <Kpi label="ISSUE SIZE" value={`$${issuer.sizeGbn}Bn`} sub={issuer.country} />
              <Kpi label="GREENIUM" value={`${issuer.greeniumBps} bps`} sub="vs conventional" color={T.teal} />
              <Kpi label="COUPON" value={`${issuer.coupon}%`} sub={`${issuer.maturity}yr tenor`} color={T.amber} />
              <Kpi label="ISWG ALIGNED" value={issuer.iswgAligned ? 'YES' : 'NO'} sub={issuer.cbiCertified ? 'CBI Certified' : 'Not CBI'} color={issuer.iswgAligned ? T.green : T.red} />
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 8 }}>OCEAN FOCUS AREAS</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {issuer.oceanFocus.map((f, i) => <span key={i} style={{ background: T.navy, color: T.gold, borderRadius: 4, padding: '4px 10px', fontSize: 11, fontFamily: T.mono }}>{f}</span>)}
              </div>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>GREENIUM vs ISSUE SIZE (SCATTER)</div>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="x" name="Size ($Bn)" stroke={T.textMut} tick={{ fontSize: 10 }} label={{ value: 'Size ($Bn)', position: 'insideBottom', offset: -5, fill: T.textMut, fontSize: 10 }} /><YAxis dataKey="y" name="Greenium (bps)" stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Scatter data={scatterData} fill={T.teal} /></ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {USE_OF_PROCEEDS.map((u, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ flex: 2 }}>
                <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold }}>{u.category}</div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{u.description}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>SHARE</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: T.mono }}>{u.share}%</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>AVG IRR</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.amber, fontFamily: T.mono }}>{u.avgIrr}%</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>CO₂ IMPACT</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.green, fontFamily: T.mono }}>{u.co2Mt} Mt</div>
              </div>
              <div style={{ flex: 3 }}>
                <div style={{ background: T.borderL, borderRadius: 4, height: 8 }}>
                  <div style={{ background: T.teal, width: `${u.share}%`, height: 8, borderRadius: 4 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 16 }}>GREENIUM CALCULATOR</div>
            {[['Face Value ($M)', faceValue, setFaceValue, 10, 5000], ['Maturity (years)', maturity, setMaturity, 1, 30]].map(([label, val, set, min, max]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, fontFamily: T.mono }}>{label}: <span style={{ color: T.gold }}>{val}</span></div>
                <input type="range" min={min} max={max} value={val} onChange={e => set(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 6, fontFamily: T.mono }}>SELECT ISSUER</div>
              <select value={selIssuer} onChange={e => setSelIssuer(e.target.value)} style={{ background: T.surfaceH, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 10px', width: '100%', fontFamily: T.mono, fontSize: 11 }}>
                {ISSUERS.map(i => <option key={i.id} value={i.id}>{i.name} ({i.greeniumBps} bps)</option>)}
              </select>
            </div>
            <div style={{ background: T.navy, borderRadius: 8, padding: 16, marginTop: 8 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 8 }}>GREENIUM RESULTS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Annual Saving</div><div style={{ fontSize: 18, fontWeight: 700, color: T.gold, fontFamily: T.mono }}>${(faceValue * issuer.greeniumBps / 10000 * 1e6 / 1e3).toFixed(0)}K</div></div>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Total Life Saving</div><div style={{ fontSize: 18, fontWeight: 700, color: T.green, fontFamily: T.mono }}>${(greeniumSaving * 1e6 / 1e6).toFixed(2)}M</div></div>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Greenium (bps)</div><div style={{ fontSize: 18, fontWeight: 700, color: T.teal, fontFamily: T.mono }}>{issuer.greeniumBps}</div></div>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Adj. Coupon</div><div style={{ fontSize: 18, fontWeight: 700, color: T.amber, fontFamily: T.mono }}>{(issuer.coupon - issuer.greeniumBps / 100).toFixed(2)}%</div></div>
              </div>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>GREENIUM TRENDS (bps)</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={MARKET_GROWTH}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Line type="monotone" dataKey="avgGreeniumBps" stroke={T.gold} strokeWidth={2} dot={false} name="Avg Greenium (bps)" /></LineChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16, background: T.surfaceH, borderRadius: 6, padding: 12 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 8 }}>GREENIUM DECOMPOSITION</div>
              {[['Investor ESG demand premium', 6], ['Issuer credibility premium', 3], ['Framework rigor premium', 3], ['Reporting transparency', 2]].map(([label, bps]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.text, marginBottom: 5 }}>
                  <span>{label}</span><span style={{ color: T.teal, fontFamily: T.mono }}>{bps} bps</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FRAMEWORKS.map((f, i) => (
              <button key={i} onClick={() => setSelFramework(i)} style={{ padding: '6px 12px', borderRadius: 4, border: `1px solid ${selFramework === i ? T.gold : T.border}`, background: selFramework === i ? T.navy : T.surface, color: selFramework === i ? T.gold : T.textSec, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{f.name.split(' ').slice(0, 2).join(' ')}</button>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold, marginBottom: 4 }}>{fw.name}</div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>Issued by: {fw.body} · Greenium premium: {fw.greeniumBps} bps · Mandatory: {fw.mandatory ? 'Yes' : 'No'}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {fw.pillars.map((p, i) => (
                <div key={i} style={{ background: T.navy, border: `1px solid ${T.border}`, borderRadius: 6, padding: '10px 16px', fontFamily: T.mono, fontSize: 12, color: T.text }}>
                  <span style={{ color: T.gold, marginRight: 6 }}>✓</span>{p}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>FRAMEWORK COMPARISON MATRIX</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Framework', 'Body', 'Greenium (bps)', 'Mandatory', 'Pillars'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textMut, fontFamily: T.mono }}>{h}</th>)}
              </tr></thead>
              <tbody>{FRAMEWORKS.map((f, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                  <td style={{ padding: '8px 12px', color: T.gold, fontFamily: T.mono }}>{f.name.split(' ').slice(0, 3).join(' ')}</td>
                  <td style={{ padding: '8px 12px', color: T.text }}>{f.body}</td>
                  <td style={{ padding: '8px 12px', color: T.teal, fontFamily: T.mono }}>{f.greeniumBps}</td>
                  <td style={{ padding: '8px 12px', color: f.mandatory ? T.green : T.textSec }}>{f.mandatory ? 'Yes' : 'No'}</td>
                  <td style={{ padding: '8px 12px', color: T.textSec }}>{f.pillars.length}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>GLOBAL BLUE BOND MARKET GROWTH</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={MARKET_GROWTH}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Area type="monotone" dataKey="issuanceGbn" stroke={T.teal} fill={T.teal} fillOpacity={0.3} name="Issuance ($Bn)" /><Area type="monotone" dataKey="deals" stroke={T.gold} fill={T.gold} fillOpacity={0.2} name="Deals" /></AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {MARKET_GROWTH.slice(-4).map((y, i) => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: T.gold }}>{y.year}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.text, fontFamily: T.mono, marginTop: 4 }}>${y.issuanceGbn}Bn</div>
                <div style={{ fontSize: 11, color: T.textSec }}>{y.deals} deals · {y.avgGreeniumBps} bps avg greenium</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {OCEAN_RISKS.map((r, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: T.mono, fontSize: 13, color: riskColor(r.severity) }}>{r.risk}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>Trend: {r.trend}</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: riskColor(r.severity), fontFamily: T.mono }}>{r.severity}</div>
              </div>
              <div style={{ background: T.borderL, borderRadius: 4, height: 8, marginBottom: 8 }}>
                <div style={{ background: riskColor(r.severity), width: `${r.severity}%`, height: 8, borderRadius: 4 }} />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {r.linkedAssets.map((a, j) => <span key={j} style={{ background: T.surfaceH, color: T.textSec, borderRadius: 4, padding: '3px 8px', fontSize: 10, fontFamily: T.mono }}>{a}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 7 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>CREDIT ANALYSIS BY ISSUER TYPE</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Issuer', 'Type', 'Rating', 'Size ($Bn)', 'Coupon', 'Greenium', 'ISWG', 'CBI'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textMut, fontFamily: T.mono }}>{h}</th>)}
              </tr></thead>
              <tbody>{ISSUERS.map((i, idx) => (
                <tr key={i.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: idx % 2 === 0 ? 'transparent' : T.surfaceH }}>
                  <td style={{ padding: '8px 10px', color: T.gold, fontFamily: T.mono }}>{i.name.split(' ').slice(0, 2).join(' ')}</td>
                  <td style={{ padding: '8px 10px', color: T.text }}>{i.type}</td>
                  <td style={{ padding: '8px 10px', color: T.amber, fontFamily: T.mono }}>{i.rating}</td>
                  <td style={{ padding: '8px 10px', color: T.text, fontFamily: T.mono }}>${i.sizeGbn}</td>
                  <td style={{ padding: '8px 10px', color: T.teal, fontFamily: T.mono }}>{i.coupon}%</td>
                  <td style={{ padding: '8px 10px', color: T.green, fontFamily: T.mono }}>{i.greeniumBps} bps</td>
                  <td style={{ padding: '8px 10px', color: i.iswgAligned ? T.green : T.red }}>{i.iswgAligned ? '✓' : '✗'}</td>
                  <td style={{ padding: '8px 10px', color: i.cbiCertified ? T.green : T.textMut }}>{i.cbiCertified ? '✓' : '–'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 8 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>CO₂ IMPACT BY USE-OF-PROCEEDS (MtCO₂)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={USE_OF_PROCEEDS} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis type="number" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="category" width={140} stroke={T.textMut} tick={{ fontSize: 9 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Bar dataKey="co2Mt" fill={T.green} name="CO₂ Impact (Mt)" /></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>ESG IMPACT SCORECARD</div>
            {[['Ocean Health Score', 76, T.teal], ['Biodiversity Additionality', 68, T.sage], ['Community Benefit', 72, T.amber], ['Climate Mitigation', 81, T.green], ['Governance Quality', 84, T.gold]].map(([label, score, color]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSec, marginBottom: 4 }}>
                  <span>{label}</span><span style={{ color, fontFamily: T.mono }}>{score}/100</span>
                </div>
                <div style={{ background: T.borderL, borderRadius: 4, height: 6 }}>
                  <div style={{ background: color, width: `${score}%`, height: 6, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 9 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>ADD TO PORTFOLIO</div>
            {ISSUERS.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                <div>
                  <div style={{ fontSize: 12, color: T.text }}>{i.name}</div>
                  <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>{i.rating} · {i.coupon}% · {i.greeniumBps} bps greenium</div>
                </div>
                <button onClick={() => setPortfolio(p => [...p, { id: i.id, name: i.name, amount: i.sizeGbn * 10, greenium: i.greeniumBps }])} style={{ background: T.navy, color: T.gold, border: `1px solid ${T.gold}`, borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: T.mono }}>+ Add</button>
              </div>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>MY BLUE BOND PORTFOLIO ({portfolio.length} holdings)</div>
            {portfolio.length === 0 && <div style={{ color: T.textMut, fontSize: 12 }}>No holdings yet. Add bonds from the left panel.</div>}
            {portfolio.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                <div>
                  <div style={{ fontSize: 12, color: T.text }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>${p.amount}M · {p.greenium} bps greenium</div>
                </div>
                <button onClick={() => setPortfolio(prev => prev.filter((_, j) => j !== i))} style={{ background: 'transparent', color: T.red, border: `1px solid ${T.red}`, borderRadius: 4, padding: '4px 8px', fontSize: 10, cursor: 'pointer' }}>Remove</button>
              </div>
            ))}
            {portfolio.length > 0 && (
              <div style={{ marginTop: 16, background: T.navy, borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: T.textMut }}>Total Portfolio:</span>
                  <span style={{ color: T.gold, fontFamily: T.mono }}>${portfolioTotal.toFixed(0)}M</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 6 }}>
                  <span style={{ color: T.textMut }}>Avg Greenium:</span>
                  <span style={{ color: T.teal, fontFamily: T.mono }}>{portfolio.length > 0 ? (portfolio.reduce((s, p) => s + p.greenium, 0) / portfolio.length).toFixed(1) : 0} bps</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
