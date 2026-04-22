import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', gold: '#d4a843', sage: '#2d6a4f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const ISSUERS = [
  { id: 'nyc', name: 'New York City', type: 'GO', rating: 'AA', size: 4200, greenShare: 28, spread: 32, coupon: 3.85, maturity: 10, useOfProceeds: 'Water infrastructure, transit, parks', greenium: 8, iceScore: 72, population: 8336817 },
  { id: 'la', name: 'Los Angeles', type: 'GO', rating: 'Aa2', size: 2800, greenShare: 35, spread: 38, coupon: 4.05, maturity: 12, useOfProceeds: 'Solar installations, EVs, resilience', greenium: 10, iceScore: 68, population: 3898747 },
  { id: 'chicago', name: 'Chicago', type: 'GO', rating: 'BBB+', size: 1900, greenShare: 22, spread: 95, coupon: 4.85, maturity: 8, useOfProceeds: 'Building retrofits, transit electrification', greenium: 6, iceScore: 55, population: 2696555 },
  { id: 'boston', name: 'City of Boston', type: 'GO', rating: 'AAA', size: 850, greenShare: 45, spread: 18, coupon: 3.65, maturity: 15, useOfProceeds: 'Climate resilience, clean energy, parks', greenium: 12, iceScore: 85, population: 675647 },
  { id: 'seattle', name: 'Seattle', type: 'Revenue', rating: 'AA+', size: 1200, greenShare: 60, spread: 28, coupon: 3.80, maturity: 20, useOfProceeds: 'Green power, stormwater, EV charging', greenium: 11, iceScore: 80, population: 749256 },
  { id: 'denver', name: 'Denver', type: 'Revenue', rating: 'AA', size: 680, greenShare: 40, spread: 35, coupon: 3.95, maturity: 10, useOfProceeds: 'Transit, water reclamation, solar', greenium: 9, iceScore: 70, population: 715522 },
  { id: 'london', name: 'Greater London Auth.', type: 'Green Bond', rating: 'AA', size: 3500, greenShare: 100, spread: 22, coupon: 3.25, maturity: 12, useOfProceeds: 'Zero-emission buses, retrofit, flood defense', greenium: 15, iceScore: 88, population: 8982000 },
  { id: 'paris', name: 'City of Paris', type: 'Green Bond', rating: 'AA+', size: 3100, greenShare: 100, spread: 18, coupon: 2.95, maturity: 10, useOfProceeds: 'Bike lanes, energy efficiency, urban forest', greenium: 18, iceScore: 91, population: 2148271 },
];

const BOND_TYPES = [
  { type: 'General Obligation (GO)', security: 'Full faith & credit of issuer', callProt: '10yr', amtStatus: 'Usually exempt', defaultRate: 0.04, example: 'NYC Water Authority' },
  { type: 'Revenue Bond', security: 'Specific revenue stream', callProt: '7-10yr', amtStatus: 'Varies', defaultRate: 0.10, example: 'LA Metro Green' },
  { type: 'Green Bond (Labeled)', security: 'Varies', callProt: '10yr', amtStatus: 'Varies', defaultRate: 0.04, example: 'City of Paris' },
  { type: 'Build America Bond (BAB)', security: 'GO or Revenue', callProt: '10yr', amtStatus: 'Taxable + subsidy', defaultRate: 0.03, example: 'Various US munis' },
  { type: 'QECB / Muni Climate Bond', security: 'GO', callProt: '10yr', amtStatus: 'Exempt', defaultRate: 0.02, example: 'MA Clean Energy Bond' },
  { type: 'Resilience Bond', security: 'Special levy', callProt: '5yr', amtStatus: 'Varies', defaultRate: 0.05, example: 'NYC Resiliency' },
];

const USE_OF_PROCEEDS = [
  { category: 'Clean Transport', share: 28, projects: ['EV fleets', 'Rail electrification', 'Bus rapid transit'], co2AvoidedMt: 4.2 },
  { category: 'Water & Wastewater', share: 22, projects: ['Green stormwater', 'Water recycling', 'Flood barriers'], co2AvoidedMt: 1.1 },
  { category: 'Energy Efficiency', share: 18, projects: ['Building retrofits', 'LED lighting', 'HVAC upgrades'], co2AvoidedMt: 2.8 },
  { category: 'Renewable Energy', share: 15, projects: ['Solar carports', 'Rooftop PV', 'Community solar'], co2AvoidedMt: 3.5 },
  { category: 'Climate Resilience', share: 10, projects: ['Seawall upgrades', 'Urban cooling', 'Green roofs'], co2AvoidedMt: 0.4 },
  { category: 'Green Buildings', share: 7, projects: ['LEED municipal', 'Net-zero schools', 'Libraries'], co2AvoidedMt: 0.9 },
];

const RATING_SPREADS = [
  { rating: 'AAA', spread10yr: 15, spread20yr: 22, spread30yr: 28, defaultRate: 0.00, taxEqvYield: 5.8 },
  { rating: 'AA+', spread10yr: 20, spread20yr: 30, spread30yr: 38, defaultRate: 0.01, taxEqvYield: 6.2 },
  { rating: 'AA', spread10yr: 28, spread20yr: 42, spread30yr: 52, defaultRate: 0.02, taxEqvYield: 6.5 },
  { rating: 'AA-', spread10yr: 38, spread20yr: 58, spread30yr: 72, defaultRate: 0.04, taxEqvYield: 6.9 },
  { rating: 'A+', spread10yr: 52, spread20yr: 78, spread30yr: 98, defaultRate: 0.08, taxEqvYield: 7.3 },
  { rating: 'A', spread10yr: 72, spread20yr: 108, spread30yr: 138, defaultRate: 0.12, taxEqvYield: 7.8 },
  { rating: 'BBB+', spread10yr: 110, spread20yr: 160, spread30yr: 200, defaultRate: 0.25, taxEqvYield: 8.5 },
];

const GREENIUM_DATA = [
  { year: 2019, greeniumBps: 4, issuanceGbn: 48, pct: 8 },
  { year: 2020, greeniumBps: 6, issuanceGbn: 72, pct: 12 },
  { year: 2021, greeniumBps: 9, issuanceGbn: 115, pct: 18 },
  { year: 2022, greeniumBps: 10, issuanceGbn: 98, pct: 16 },
  { year: 2023, greeniumBps: 12, issuanceGbn: 140, pct: 22 },
  { year: 2024, greeniumBps: 14, issuanceGbn: 185, pct: 28 },
  { year: 2025, greeniumBps: 16, issuanceGbn: 225, pct: 33 },
];

const TABS = ['Overview', 'Bond Mechanics', 'Greenium Engine', 'Credit Analysis', 'Tax Exemption', 'Use of Proceeds', 'Rating Curves', 'Market Comparison', 'ESG Impact', 'Portfolio Builder'];

function calcAfterTaxYield({ coupon, taxRate, amt }) {
  if (amt) return coupon;
  return coupon * (1 - taxRate / 100);
}
function calcTaxEquivalentYield({ muniYield, taxRate }) {
  return taxRate > 0 ? muniYield / (1 - taxRate / 100) : muniYield;
}
function calcGreeniumValue({ faceValue, greeniumBps, maturity }) {
  const annualSaving = faceValue * (greeniumBps / 10000);
  return annualSaving * maturity;
}
function calcDsr({ annualRevenue, annualDebtService }) {
  return annualDebtService > 0 ? annualRevenue / annualDebtService : 0;
}

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function MunicipalGreenBondAnalyticsPage() {
  const [tab, setTab] = useState('Overview');
  const [selectedIssuer, setSelectedIssuer] = useState('nyc');
  const [coupon, setCoupon] = useState(3.85);
  const [taxRate, setTaxRate] = useState(37);
  const [faceValue, setFaceValue] = useState(100);
  const [greeniumBps, setGreeniumBps] = useState(12);
  const [maturity, setMaturity] = useState(10);
  const [isAmt, setIsAmt] = useState(false);
  const [portfolioSize, setPortfolioSize] = useState(10);

  const issuer = ISSUERS.find(i => i.id === selectedIssuer) || ISSUERS[0];
  const afterTax = calcAfterTaxYield({ coupon, taxRate, amt: isAmt });
  const teq = calcTaxEquivalentYield({ muniYield: coupon, taxRate });
  const greeniumVal = calcGreeniumValue({ faceValue, greeniumBps, maturity });
  const dsr = calcDsr({ annualRevenue: faceValue * 0.15, annualDebtService: faceValue * coupon / 100 });

  const yieldCurveData = useMemo(() => [2, 5, 7, 10, 15, 20, 30].map((yr, i) => ({
    maturity: `${yr}Y`, muniYield: (coupon - 0.4 + yr * 0.02 + sr(i * 7) * 0.15).toFixed(2),
    teqYield: (teq - 0.3 + yr * 0.025 + sr(i * 11) * 0.12).toFixed(2),
    usTreasury: (3.8 + yr * 0.015 + sr(i * 13) * 0.1).toFixed(2),
  })), [coupon, teq]);

  const spreadByRating = useMemo(() => RATING_SPREADS.map(r => ({ rating: r.rating, '10yr': r.spread10yr, '20yr': r.spread20yr })), []);

  const portfolioData = useMemo(() => [...ISSUERS].sort((a, b) => b.iceScore - a.iceScore).slice(0, portfolioSize).map((iss, i) => ({
    name: iss.name.split(' ')[0], iceScore: iss.iceScore, greenShare: iss.greenShare, spread: iss.spread, yield: iss.coupon,
  })), [portfolioSize]);

  const impactData = USE_OF_PROCEEDS.map(u => ({ category: u.category, co2Mt: u.co2AvoidedMt, share: u.share }));

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text, padding: '24px 32px' }}>
      <div style={{ borderBottom: `2px solid ${T.gold}`, paddingBottom: 16, marginBottom: 24 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: '0.12em', marginBottom: 6 }}>EP-DY1 · MUNICIPAL GREEN BOND ANALYTICS</div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>Municipal Green Bond Analytics Suite</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>GO vs Revenue · Greenium Engine · Tax Equivalency · Credit Spread Curves · Use of Proceeds · ESG Impact</div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 14px', borderRadius: 4, border: `1px solid ${tab === t ? T.gold : T.border}`, background: tab === t ? T.gold : T.surface, color: tab === t ? T.bg : T.textSec, fontFamily: T.mono, fontSize: 11, cursor: 'pointer', fontWeight: tab === t ? 700 : 400 }}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <Kpi label="GLOBAL MUNI GREEN ISSUANCE" value="$225Bn" sub="2025 estimate" />
            <Kpi label="AVG GREENIUM" value="16 bps" sub="vs conventional peers" color={T.green} />
            <Kpi label="GREEN SHARE OF MUNI MKT" value="33%" sub="up from 8% in 2019" />
            <Kpi label="ISSUERS TRACKED" value={ISSUERS.length} sub="across US & Europe" color={T.teal} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>GREENIUM TREND (2019–2025)</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={GREENIUM_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 11 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Area type="monotone" dataKey="greeniumBps" stroke={T.green} fill={T.sage} name="Greenium (bps)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>ISSUANCE VOLUME ($Bn)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={GREENIUM_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 11 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="issuanceGbn" fill={T.teal} name="Issuance ($Bn)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ marginTop: 20, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>ISSUER UNIVERSE</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Issuer', 'Type', 'Rating', 'Size ($M)', 'Green Share', 'Greenium (bps)', 'Coupon', 'ICE Score'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{ISSUERS.map((iss, i) => (
                <tr key={iss.id} onClick={() => setSelectedIssuer(iss.id)} style={{ cursor: 'pointer', background: selectedIssuer === iss.id ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{iss.name}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{iss.type}</td>
                  <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono }}>{iss.rating}</td>
                  <td style={{ padding: '7px 10px', color: T.text, fontFamily: T.mono }}>{iss.size.toLocaleString()}</td>
                  <td style={{ padding: '7px 10px', color: T.green }}>{iss.greenShare}%</td>
                  <td style={{ padding: '7px 10px', color: T.teal, fontFamily: T.mono }}>{iss.greenium} bps</td>
                  <td style={{ padding: '7px 10px', color: T.text, fontFamily: T.mono }}>{iss.coupon.toFixed(2)}%</td>
                  <td style={{ padding: '7px 10px', color: iss.iceScore >= 80 ? T.green : iss.iceScore >= 60 ? T.amber : T.red }}>{iss.iceScore}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Bond Mechanics' && (
        <div>
          <div style={{ marginBottom: 20, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>MUNICIPAL BOND TYPES</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Bond Type', 'Security', 'Call Protection', 'AMT Status', 'Default Rate', 'Example'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{BOND_TYPES.map((b, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{b.type}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{b.security}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{b.callProt}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{b.amtStatus}</td>
                  <td style={{ padding: '7px 10px', color: b.defaultRate < 0.05 ? T.green : T.amber, fontFamily: T.mono }}>{(b.defaultRate * 100).toFixed(2)}%</td>
                  <td style={{ padding: '7px 10px', color: T.teal }}>{b.example}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 16 }}>SELECTED ISSUER: {issuer.name.toUpperCase()}</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
              <Kpi label="BOND TYPE" value={issuer.type} sub="Security structure" color={T.teal} />
              <Kpi label="CREDIT RATING" value={issuer.rating} sub="Moody's / S&P" />
              <Kpi label="OUTSTANDING ($M)" value={`$${issuer.size.toLocaleString()}`} sub="Total debt" color={T.text} />
              <Kpi label="GREEN SHARE" value={`${issuer.greenShare}%`} sub="Of total issuance" color={T.green} />
            </div>
            <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7 }}>
              <strong style={{ color: T.text }}>Use of Proceeds:</strong> {issuer.useOfProceeds}<br />
              <strong style={{ color: T.text }}>Greenium:</strong> {issuer.greenium} bps below conventional peers<br />
              <strong style={{ color: T.text }}>Population Served:</strong> {issuer.population.toLocaleString()}<br />
              <strong style={{ color: T.text }}>ICE ESG Score:</strong> {issuer.iceScore}/100
            </div>
          </div>
        </div>
      )}

      {tab === 'Greenium Engine' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 16 }}>GREENIUM CALCULATOR</div>
              {[['Face Value ($M)', faceValue, setFaceValue, 1, 500], ['Greenium (bps)', greeniumBps, setGreeniumBps, 1, 30], ['Maturity (years)', maturity, setMaturity, 1, 30]].map(([label, val, setter, min, max]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{label}: <span style={{ color: T.gold, fontFamily: T.mono }}>{val}</span></div>
                  <input type="range" min={min} max={max} value={val} onChange={e => setter(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
                </div>
              ))}
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>TOTAL GREENIUM SAVING</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.green, fontFamily: T.mono }}>${greeniumVal.toFixed(2)}M</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Over {maturity}-year bond life</div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>GREENIUM BY ISSUER (bps vs CONVENTIONAL)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ISSUERS.map(i => ({ name: i.name.split(' ')[0], greenium: i.greenium, rating: i.rating }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="greenium" fill={T.green} name="Greenium (bps)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Credit Analysis' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="AVG MUNI DEFAULT RATE" value="0.08%" sub="10yr cumulative (Moody's)" color={T.green} />
            <Kpi label="RECOVERY RATE" value="67%" sub="Post-default average" />
            <Kpi label="CREDIT SPREAD (AA)" value="28 bps" sub="vs UST 10yr" color={T.teal} />
            <Kpi label="UPGRADE/DOWNGRADE RATIO" value="1.8x" sub="2024 Moody's" color={T.green} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>CREDIT SPREAD BY RATING (bps vs UST)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={spreadByRating}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="rating" tick={{ fill: T.textSec, fontSize: 11 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Bar dataKey="10yr" fill={T.gold} name="10yr Spread (bps)" />
                <Bar dataKey="20yr" fill={T.teal} name="20yr Spread (bps)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>RATING DETAIL TABLE</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Rating', '10yr Spread', '20yr Spread', '30yr Spread', 'Default Rate', 'Tax-Equiv Yield'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{RATING_SPREADS.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.gold, fontWeight: 700, fontFamily: T.mono }}>{r.rating}</td>
                  <td style={{ padding: '7px 10px', color: T.text, fontFamily: T.mono }}>{r.spread10yr} bps</td>
                  <td style={{ padding: '7px 10px', color: T.text, fontFamily: T.mono }}>{r.spread20yr} bps</td>
                  <td style={{ padding: '7px 10px', color: T.text, fontFamily: T.mono }}>{r.spread30yr} bps</td>
                  <td style={{ padding: '7px 10px', color: r.defaultRate < 0.05 ? T.green : T.amber, fontFamily: T.mono }}>{(r.defaultRate * 100).toFixed(2)}%</td>
                  <td style={{ padding: '7px 10px', color: T.teal, fontFamily: T.mono }}>{r.taxEqvYield.toFixed(1)}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Tax Exemption' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 16 }}>TAX EQUIVALENCY CALCULATOR</div>
              {[['Muni Coupon (%)', coupon, setCoupon, 1, 8, 0.05], ['Marginal Tax Rate (%)', taxRate, setTaxRate, 10, 50, 1]].map(([label, val, setter, min, max, step]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{label}: <span style={{ color: T.gold, fontFamily: T.mono }}>{typeof val === 'number' ? val.toFixed(2) : val}</span></div>
                  <input type="range" min={min} max={max} step={step} value={val} onChange={e => setter(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
                </div>
              ))}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: T.textSec, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={isAmt} onChange={e => setIsAmt(e.target.checked)} style={{ accentColor: T.gold }} /> AMT-subject bond
                </label>
              </div>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>TAX-EQUIV YIELD</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: T.green, fontFamily: T.mono }}>{teq.toFixed(2)}%</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>After-tax yield: {afterTax.toFixed(2)}%</div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 3 }}>{isAmt ? 'AMT applies — no federal exemption' : 'Federal income tax exempt'}</div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>TAX-EQUIVALENT YIELD BY BRACKET</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={[22, 24, 32, 35, 37, 40].map(rate => ({ rate: `${rate}%`, teq: (coupon / (1 - rate / 100)).toFixed(2), muniYield: coupon.toFixed(2) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="rate" tick={{ fill: T.textSec, fontSize: 11 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Line type="monotone" dataKey="teq" stroke={T.green} name="Tax-Equiv Yield (%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="muniYield" stroke={T.amber} strokeDasharray="5 5" name="Muni Yield (%)" />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 16, fontSize: 12, color: T.textSec, lineHeight: 1.7 }}>
                <strong style={{ color: T.text }}>AMT note:</strong> Private Activity Bonds (PABs) may be subject to AMT for some investors. Green bonds issued for public purposes (transit, water) are typically AMT-exempt. BABs are taxable but receive 35% federal interest subsidy.
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Use of Proceeds' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            {USE_OF_PROCEEDS.map((u, i) => <Kpi key={i} label={u.category.toUpperCase()} value={`${u.share}%`} sub={`${u.co2AvoidedMt} Mt CO₂e avoided`} color={[T.green, T.teal, T.gold, T.amber, T.sage, T.navy][i % 6]} />)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>PROCEEDS ALLOCATION</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={USE_OF_PROCEEDS.map(u => ({ name: u.category.split(' ')[0], share: u.share }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="share" fill={T.sage} name="Share (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>CO₂ AVOIDED BY CATEGORY (Mt)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={impactData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="category" tick={{ fill: T.textSec, fontSize: 9 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="co2Mt" fill={T.green} name="CO₂ Avoided (Mt)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ marginTop: 20, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>USE OF PROCEEDS DETAIL</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {USE_OF_PROCEEDS.map((u, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 6, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{u.category}</div>
                  <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono, marginBottom: 6 }}>{u.share}% · {u.co2AvoidedMt} Mt CO₂e</div>
                  {u.projects.map((p, j) => <div key={j} style={{ fontSize: 11, color: T.textSec, marginBottom: 2 }}>• {p}</div>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Rating Curves' && (
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>MUNICIPAL YIELD CURVE vs US TREASURY</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={yieldCurveData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="maturity" tick={{ fill: T.textSec, fontSize: 11 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Legend />
                <Line type="monotone" dataKey="muniYield" stroke={T.green} name="Muni Yield (%)" strokeWidth={2} />
                <Line type="monotone" dataKey="teqYield" stroke={T.gold} name="Tax-Equiv Yield (%)" strokeWidth={2} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="usTreasury" stroke={T.amber} name="US Treasury (%)" strokeWidth={2} strokeDasharray="2 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Market Comparison' && (
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>ISSUER COMPARISON: SPREAD vs ICE SCORE</div>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="spread" name="Spread (bps)" tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: 'Spread (bps)', position: 'insideBottom', offset: -5, fill: T.textSec, fontSize: 11 }} />
                <YAxis dataKey="iceScore" name="ICE ESG Score" tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={ISSUERS.map(i => ({ spread: i.spread, iceScore: i.iceScore, name: i.name }))} fill={T.teal} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>YIELD vs GREEN SHARE</div>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="greenShare" name="Green Share (%)" tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: 'Green Share (%)', position: 'insideBottom', offset: -5, fill: T.textSec, fontSize: 11 }} />
                <YAxis dataKey="coupon" name="Coupon (%)" tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Scatter data={ISSUERS.map(i => ({ greenShare: i.greenShare, coupon: i.coupon, name: i.name }))} fill={T.green} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'ESG Impact' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="TOTAL CO₂ AVOIDED" value="13.0 Mt" sub="Tracked universe" color={T.green} />
            <Kpi label="AVG ICE ESG SCORE" value={ISSUERS.length ? (ISSUERS.reduce((s, i) => s + i.iceScore, 0) / ISSUERS.length).toFixed(0) : 'N/A'} sub="/100 ICE methodology" />
            <Kpi label="GREEN BOND PRINCIPLES" value="GBP 2021" sub="ICMA alignment" color={T.teal} />
            <Kpi label="CLIMATE BONDS STD" value="CBS v3.0" sub="CBI certification" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>ICE ESG SCORES BY ISSUER</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[...ISSUERS].sort((a, b) => b.iceScore - a.iceScore).map(i => ({ name: i.name.split(' ')[0], score: i.iceScore }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Bar dataKey="score" fill={T.sage} name="ICE ESG Score" />
                <ReferenceLine y={75} stroke={T.gold} strokeDasharray="4 2" label={{ value: 'Best-in-class', fill: T.gold, fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Portfolio Builder' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Portfolio Size (top N by ICE score): <span style={{ color: T.gold, fontFamily: T.mono }}>{portfolioSize}</span></div>
            <input type="range" min={2} max={ISSUERS.length} value={portfolioSize} onChange={e => setPortfolioSize(Number(e.target.value))} style={{ width: 220, accentColor: T.gold }} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="PORTFOLIO ISSUERS" value={portfolioData.length} sub="Selected" color={T.teal} />
            <Kpi label="AVG ICE SCORE" value={portfolioData.length ? (portfolioData.reduce((s, d) => s + d.iceScore, 0) / portfolioData.length).toFixed(0) : 0} sub="/100" color={T.green} />
            <Kpi label="AVG GREEN SHARE" value={portfolioData.length ? (portfolioData.reduce((s, d) => s + d.greenShare, 0) / portfolioData.length).toFixed(0) + '%' : '0%'} sub="of issuance" />
            <Kpi label="AVG YIELD" value={portfolioData.length ? (portfolioData.reduce((s, d) => s + d.yield, 0) / portfolioData.length).toFixed(2) + '%' : '0%'} sub="coupon" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={portfolioData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Legend />
                <Bar dataKey="iceScore" fill={T.teal} name="ICE Score" />
                <Bar dataKey="greenShare" fill={T.sage} name="Green Share (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
