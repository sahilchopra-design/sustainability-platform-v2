import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', gold: '#d4a843', sage: '#2d6a4f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const BOND_SECTORS = [
  { id: 'water', name: 'Water & Wastewater', icon: '💧', revenueSource: 'Water/sewer user rates', rating: 'AA', dscr: 2.4, greenShare: 55, coupon: 3.80, spread: 28, resilience: 'Flood adaptation, pipe replacement', issuanceGbn: 48.2, taxStatus: 'Exempt' },
  { id: 'electric', name: 'Electric Utility', icon: '⚡', revenueSource: 'Electricity sales revenue', rating: 'A+', dscr: 2.1, greenShare: 68, coupon: 4.05, spread: 45, resilience: 'Grid hardening, renewable build-out', issuanceGbn: 72.4, taxStatus: 'Exempt' },
  { id: 'airport', name: 'Airport Green', icon: '✈️', revenueSource: 'Landing fees, concessions', rating: 'A', dscr: 1.8, greenShare: 42, coupon: 4.40, spread: 65, resilience: 'SAF infrastructure, EV ground equipment', issuanceGbn: 18.6, taxStatus: 'AMT' },
  { id: 'transit', name: 'Transit Authority', icon: '🚊', revenueSource: 'Farebox + gov. subsidy', rating: 'AA-', dscr: 1.5, greenShare: 72, coupon: 3.90, spread: 38, resilience: 'EV bus fleet, flood-proof stations', issuanceGbn: 22.1, taxStatus: 'Exempt' },
  { id: 'toll', name: 'Toll Road', icon: '🛣️', revenueSource: 'Toll revenue', rating: 'A-', dscr: 1.9, greenShare: 28, coupon: 4.55, spread: 72, resilience: 'EV charging corridor, climate roadway', issuanceGbn: 14.8, taxStatus: 'Exempt' },
  { id: 'hospital', name: 'Hospital Green', icon: '🏥', revenueSource: 'Patient service revenue', rating: 'A', dscr: 2.2, greenShare: 38, coupon: 4.30, spread: 58, resilience: 'Backup power, cooling, efficiency', issuanceGbn: 9.4, taxStatus: 'Exempt' },
];

const COVENANT_TYPES = [
  { name: 'Rate Covenant', description: 'Issuer must set rates sufficient to produce net revenues ≥ X% of debt service (typically 115-125%)', typical: '115–125% DSC', strength: 'Strong' },
  { name: 'Additional Bonds Test (ABT)', description: 'Before issuing more bonds, must demonstrate historic DSCR ≥ 1.25x and projected DSCR ≥ 1.20x for new bonds', typical: '1.20–1.25x', strength: 'Strong' },
  { name: 'Reserve Fund', description: 'Debt service reserve fund (DSRF) equal to max annual debt service — provides 12-month liquidity buffer', typical: 'Max annual DS', strength: 'Medium' },
  { name: 'Rate Stabilization Fund', description: 'Excess revenues set aside to smooth rate increases; drawn down in lean years. Protects against revenue volatility.', typical: 'Discretionary', strength: 'Medium' },
  { name: 'Flow of Funds (Waterfall)', description: 'Revenue waterfall: O&M expenses → Senior DS → DSRF → Additional bonds → Rate stabilization → Surplus', typical: 'Standard', strength: 'Strong' },
  { name: 'Insurance Covenant', description: 'Issuer must maintain property/casualty, business interruption, and workers comp insurance. Climate-linked additions: flood/wind coverage.', typical: 'Replacement cost', strength: 'Medium' },
];

const GREEN_STANDARDS = [
  { standard: 'Climate Bonds Initiative (CBI)', focus: 'Sector-specific science-based criteria', coverage: 'Water, transport, energy, land', certBody: 'CBI-approved verifier', greenium: '8–15 bps' },
  { standard: 'ICMA Green Bond Principles', focus: 'Use of proceeds + reporting', coverage: 'All green categories', certBody: 'Second party opinion', greenium: '5–12 bps' },
  { standard: 'MSRB/GFOA Green Bond Guidelines', focus: 'US muni-specific framework', coverage: 'Muni sector', certBody: 'Self-certification or SPO', greenium: '5–10 bps' },
  { standard: 'S&P Green Evaluation', focus: 'Environmental score 0–100', coverage: 'All bonds', certBody: 'S&P Global Ratings', greenium: 'No direct greenium' },
  { standard: 'Moody\'s Green Bond Assessment', focus: 'GB1–GB5 scale', coverage: 'All bonds', certBody: 'Moody\'s', greenium: 'No direct greenium' },
];

const STRESS_SCENARIOS = [
  { scenario: 'Base Case', revenueChg: 0, dscrResult: 2.10, rateIncrease: 3.0, feasible: true },
  { scenario: '10% Revenue Decline', revenueChg: -10, dscrResult: 1.89, rateIncrease: 5.0, feasible: true },
  { scenario: 'Climate Disruption (Hurricane)', revenueChg: -25, dscrResult: 1.58, rateIncrease: 8.5, feasible: true },
  { scenario: '40% Revenue Decline', revenueChg: -40, dscrResult: 1.26, rateIncrease: 15.0, feasible: true },
  { scenario: 'Revenue Shortfall (50%)', revenueChg: -50, dscrResult: 1.05, rateIncrease: 22.0, feasible: true },
  { scenario: 'Catastrophic Failure', revenueChg: -65, dscrResult: 0.74, rateIncrease: 35.0, feasible: false },
];

const TABS = ['Overview', 'Revenue Modeling', 'DSCR Engine', 'Rate Covenant', 'Resilience Stress Test', 'Green Certification', 'Covenant Analytics', 'Rating Methodology', 'ESG Score', 'Market Benchmarks'];

function calcDscr({ annualRevenue, annualOm, annualDebtService }) {
  const netRevenue = annualRevenue - annualOm;
  return annualDebtService > 0 ? netRevenue / annualDebtService : 0;
}

function calcDebtService({ principal, coupon, tenor }) {
  const r = coupon / 100;
  return principal > 0 && r > 0 ? principal * r / (1 - Math.pow(1 + r, -tenor)) : 0;
}

function calcGreeniumSaving({ faceValue, greeniumBps, tenor }) {
  return faceValue * (greeniumBps / 10000) * tenor;
}

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function ClimateRevenueBondModelerPage() {
  const [tab, setTab] = useState('Overview');
  const [selectedSector, setSelectedSector] = useState('electric');
  const [bondPrincipal, setBondPrincipal] = useState(200);
  const [coupon, setCoupon] = useState(4.05);
  const [tenor, setTenor] = useState(20);
  const [annRevenue, setAnnRevenue] = useState(85);
  const [annOm, setAnnOm] = useState(28);
  const [greeniumBps, setGreeniumBps] = useState(10);
  const [rateIncrease, setRateIncrease] = useState(5);

  const sector = BOND_SECTORS.find(s => s.id === selectedSector) || BOND_SECTORS[0];
  const annDebtService = calcDebtService({ principal: bondPrincipal, coupon, tenor });
  const dscr = calcDscr({ annualRevenue: annRevenue, annualOm: annOm, annualDebtService: annDebtService });
  const greeniumSaving = calcGreeniumSaving({ faceValue: bondPrincipal, greeniumBps, tenor });

  const totalIssuance = BOND_SECTORS.reduce((s, b) => s + b.issuanceGbn, 0);

  const revenueProjection = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    year: 2025 + i,
    revenue: (annRevenue * Math.pow(1 + (rateIncrease / 100), i)).toFixed(1),
    om: (annOm * Math.pow(1.03, i)).toFixed(1),
    ds: annDebtService.toFixed(1),
    dscr: ((annRevenue * Math.pow(1 + rateIncrease / 100, i) - annOm * Math.pow(1.03, i)) / annDebtService).toFixed(2),
  })), [annRevenue, annOm, annDebtService, rateIncrease]);

  const stressData = STRESS_SCENARIOS.map(s => ({
    scenario: s.scenario.split(' ').slice(0, 2).join(' '),
    dscr: s.dscrResult,
    rateInc: s.rateIncrease,
    feasible: s.feasible,
  }));

  const issuanceData = [...BOND_SECTORS].sort((a, b) => b.issuanceGbn - a.issuanceGbn).map(s => ({ sector: s.name.split(' ')[0], issuance: s.issuanceGbn, greenShare: s.greenShare }));

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text, padding: '24px 32px' }}>
      <div style={{ borderBottom: `2px solid ${T.gold}`, paddingBottom: 16, marginBottom: 24 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: '0.12em', marginBottom: 6 }}>EP-DY5 · CLIMATE REVENUE BOND MODELER</div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>Climate Revenue Bond Modeler</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>Water · Electric Utility · Airport · Transit · Toll Road · DSCR Engine · Rate Covenant · Green Certification</div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 28, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 14px', borderRadius: 4, border: `1px solid ${tab === t ? T.gold : T.border}`, background: tab === t ? T.gold : T.surface, color: tab === t ? T.bg : T.textSec, fontFamily: T.mono, fontSize: 11, cursor: 'pointer', fontWeight: tab === t ? 700 : 400 }}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <Kpi label="TOTAL REVENUE BOND ISSUANCE" value={`$${totalIssuance.toFixed(0)}Bn`} sub="Annual US market" />
            <Kpi label="AVG GREEN SHARE" value={`${(BOND_SECTORS.reduce((s, b) => s + b.greenShare, 0) / BOND_SECTORS.length).toFixed(0)}%`} sub="Green-labeled bonds" color={T.green} />
            <Kpi label="AVG DSCR (SECTOR)" value={(BOND_SECTORS.reduce((s, b) => s + b.dscr, 0) / BOND_SECTORS.length).toFixed(1) + 'x'} sub="Debt service coverage" color={T.teal} />
            <Kpi label="SECTORS TRACKED" value={BOND_SECTORS.length} sub="With green issuance" color={T.amber} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>ANNUAL ISSUANCE BY SECTOR ($Bn)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={issuanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="sector" tick={{ fill: T.textSec, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="issuance" fill={T.teal} name="Issuance ($Bn)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>GREEN SHARE BY SECTOR (%)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={issuanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="sector" tick={{ fill: T.textSec, fontSize: 10 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="greenShare" fill={T.sage} name="Green Share (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ marginTop: 20, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>SECTOR OVERVIEW</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Sector', 'Revenue Source', 'Rating', 'DSCR', 'Green %', 'Coupon', 'Spread', 'Tax Status'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{BOND_SECTORS.map((s, i) => (
                <tr key={s.id} onClick={() => setSelectedSector(s.id)} style={{ cursor: 'pointer', background: selectedSector === s.id ? T.surfaceH : i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{s.icon} {s.name}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{s.revenueSource}</td>
                  <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono }}>{s.rating}</td>
                  <td style={{ padding: '7px 10px', color: s.dscr >= 2.0 ? T.green : s.dscr >= 1.5 ? T.amber : T.red, fontFamily: T.mono }}>{s.dscr}x</td>
                  <td style={{ padding: '7px 10px', color: T.green }}>{s.greenShare}%</td>
                  <td style={{ padding: '7px 10px', color: T.text, fontFamily: T.mono }}>{s.coupon.toFixed(2)}%</td>
                  <td style={{ padding: '7px 10px', color: T.teal, fontFamily: T.mono }}>{s.spread} bps</td>
                  <td style={{ padding: '7px 10px', color: s.taxStatus === 'Exempt' ? T.green : T.amber }}>{s.taxStatus}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Revenue Modeling' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 16 }}>REVENUE MODEL INPUTS</div>
              <div style={{ marginBottom: 10, fontSize: 11, color: T.textSec }}>
                Sector: <select value={selectedSector} onChange={e => setSelectedSector(e.target.value)} style={{ background: T.surfaceH, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 6px', fontSize: 11 }}>
                  {BOND_SECTORS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {[['Annual Revenue ($M)', annRevenue, setAnnRevenue, 5, 500], ['Annual O&M ($M)', annOm, setAnnOm, 1, 200], ['Rate Increase (%/yr)', rateIncrease, setRateIncrease, 0, 15, 0.5]].map(([label, val, setter, min, max, step]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{label}: <span style={{ color: T.gold, fontFamily: T.mono }}>{typeof val === 'number' ? val.toFixed(1) : val}</span></div>
                  <input type="range" min={min} max={max} step={step || 1} value={val} onChange={e => setter(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
                </div>
              ))}
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 11, color: T.textSec }}>NET REVENUE (YR 1)</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.green, fontFamily: T.mono }}>${(annRevenue - annOm).toFixed(1)}M</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>O&M Ratio: {annRevenue > 0 ? (annOm / annRevenue * 100).toFixed(0) : 0}%</div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>10-YEAR REVENUE PROJECTION ($M)</div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueProjection}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 11 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke={T.green} fill={T.sage} name="Revenue ($M)" />
                  <Area type="monotone" dataKey="om" stroke={T.amber} fill="rgba(230,126,34,0.1)" name="O&M ($M)" />
                  <ReferenceLine y={annDebtService} stroke={T.red} strokeDasharray="4 2" label={{ value: 'Debt Svc', fill: T.red, fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'DSCR Engine' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 16 }}>BOND PARAMETERS</div>
              {[['Principal ($M)', bondPrincipal, setBondPrincipal, 10, 1000], ['Coupon (%)', coupon, setCoupon, 1, 8, 0.05], ['Tenor (years)', tenor, setTenor, 5, 40]].map(([label, val, setter, min, max, step]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{label}: <span style={{ color: T.gold, fontFamily: T.mono }}>{typeof val === 'number' ? val.toFixed(2) : val}</span></div>
                  <input type="range" min={min} max={max} step={step || 1} value={val} onChange={e => setter(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
                </div>
              ))}
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14, marginTop: 8 }}>
                <div style={{ fontSize: 11, color: T.textSec }}>ANNUAL DEBT SERVICE</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.gold, fontFamily: T.mono }}>${annDebtService.toFixed(2)}M</div>
                <div style={{ marginTop: 10, fontSize: 11, color: T.textSec }}>DSCR</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: dscr >= 2.0 ? T.green : dscr >= 1.25 ? T.amber : T.red, fontFamily: T.mono }}>{dscr.toFixed(2)}x</div>
                <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>{dscr >= 2.0 ? 'Strong coverage' : dscr >= 1.25 ? 'Adequate coverage' : 'Below threshold'}</div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>DSCR PROJECTION (10-YEAR)</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenueProjection}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 11 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Line type="monotone" dataKey="dscr" stroke={T.green} strokeWidth={2} name="DSCR" />
                  <ReferenceLine y={1.25} stroke={T.amber} strokeDasharray="4 2" label={{ value: 'Min 1.25x', fill: T.amber, fontSize: 10 }} />
                  <ReferenceLine y={1.5} stroke={T.teal} strokeDasharray="4 2" label={{ value: 'Target 1.5x', fill: T.teal, fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 16, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 8 }}>DSCR BENCHMARKS</div>
                {[['> 2.0x', 'Excellent — investment-grade AA range', T.green], ['1.5–2.0x', 'Good — A range typical for revenue bonds', T.teal], ['1.25–1.5x', 'Adequate — minimum for investment grade', T.amber], ['< 1.25x', 'Inadequate — triggers covenant breach', T.red]].map(([range, note, color]) => (
                  <div key={range} style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color, fontFamily: T.mono, minWidth: 80 }}>{range}</span>
                    <span style={{ fontSize: 11, color: T.textSec }}>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Rate Covenant' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="TYPICAL RATE COVENANT" value="115–125%" sub="Of annual debt service" color={T.teal} />
            <Kpi label="RATE STABILIZATION" value="Common" sub="Smoothing mechanism" />
            <Kpi label="RATE INCREASE (MODELED)" value={`${rateIncrease.toFixed(1)}%/yr`} sub="Escalation assumption" color={T.green} />
            <Kpi label="10-YR DSCR TREND" value={revenueProjection.length ? revenueProjection[revenueProjection.length - 1].dscr + 'x' : 'N/A'} sub="Year 10 projected" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>COVENANT TYPES & TYPICAL TERMS</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Covenant', 'Description', 'Typical Level', 'Strength'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{COVENANT_TYPES.map((c, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{c.description}</td>
                  <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono }}>{c.typical}</td>
                  <td style={{ padding: '7px 10px', color: c.strength === 'Strong' ? T.green : T.amber }}>{c.strength}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Resilience Stress Test' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="BASE CASE DSCR" value={`${STRESS_SCENARIOS[0].dscrResult}x`} sub="No disruption" color={T.green} />
            <Kpi label="HURRICANE SCENARIO" value={`${STRESS_SCENARIOS[2].dscrResult}x`} sub="-25% revenue shock" color={T.amber} />
            <Kpi label="COVENANT BREACH" value="-65% revenue" sub="Below 1.0x threshold" color={T.red} />
            <Kpi label="SELECTED SECTOR" value={sector.name} sub={sector.resilience} color={T.teal} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>STRESS TEST: DSCR BY SCENARIO</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stressData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="scenario" tick={{ fill: T.textSec, fontSize: 9 }} />
                <YAxis domain={[0, 3]} tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Bar dataKey="dscr" name="DSCR" fill={T.teal} />
                <ReferenceLine y={1.25} stroke={T.amber} strokeDasharray="4 2" label={{ value: 'Min 1.25x', fill: T.amber, fontSize: 10 }} />
                <ReferenceLine y={1.0} stroke={T.red} strokeDasharray="4 2" label={{ value: 'Default', fill: T.red, fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Scenario', 'Revenue Change', 'DSCR Result', 'Rate Increase Needed', 'Feasible'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{STRESS_SCENARIOS.map((s, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{s.scenario}</td>
                  <td style={{ padding: '7px 10px', color: s.revenueChg < 0 ? T.red : T.green, fontFamily: T.mono }}>{s.revenueChg === 0 ? 'Base' : `${s.revenueChg}%`}</td>
                  <td style={{ padding: '7px 10px', color: s.dscrResult >= 1.5 ? T.green : s.dscrResult >= 1.25 ? T.amber : T.red, fontFamily: T.mono }}>{s.dscrResult}x</td>
                  <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono }}>{s.rateIncrease}%</td>
                  <td style={{ padding: '7px 10px', color: s.feasible ? T.green : T.red }}>{s.feasible ? 'Yes' : 'No'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Green Certification' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="GREEN BOND SAVING" value={`$${greeniumSaving.toFixed(2)}M`} sub={`${greeniumBps}bps over ${tenor}yr`} color={T.green} />
            <Kpi label="CBI CERTIFIED" value={sector.name} sub="Eligible sector" color={T.teal} />
            <Kpi label="GREENIUM (bps)" value={greeniumBps} sub="vs conventional" />
            <Kpi label="ANNUAL SAVING" value={`$${(bondPrincipal * greeniumBps / 10000).toFixed(2)}M`} sub="Per year" color={T.amber} />
          </div>
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 11, color: T.textSec }}>Greenium (bps): <span style={{ color: T.gold, fontFamily: T.mono }}>{greeniumBps}</span></div>
            <input type="range" min={0} max={25} value={greeniumBps} onChange={e => setGreeniumBps(Number(e.target.value))} style={{ width: 200, accentColor: T.gold }} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>GREEN BOND STANDARDS FOR REVENUE BONDS</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Standard', 'Focus', 'Coverage', 'Certification', 'Greenium'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{GREEN_STANDARDS.map((s, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{s.standard}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{s.focus}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{s.coverage}</td>
                  <td style={{ padding: '7px 10px', color: T.teal }}>{s.certBody}</td>
                  <td style={{ padding: '7px 10px', color: T.green }}>{s.greenium}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Covenant Analytics' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="RATE COVENANT" value="125%" sub="Minimum coverage" color={T.teal} />
            <Kpi label="CURRENT DSCR" value={`${dscr.toFixed(2)}x`} sub="vs ${annDebtService.toFixed(1)}M DS" color={dscr >= 1.25 ? T.green : T.red} />
            <Kpi label="HEADROOM" value={`${Math.max(0, dscr - 1.25).toFixed(2)}x`} sub="Above minimum" color={dscr >= 1.25 ? T.green : T.red} />
            <Kpi label="ADDITIONAL BONDS" value={dscr >= 1.2 ? 'Eligible' : 'Restricted'} sub="ABT test" color={dscr >= 1.2 ? T.green : T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>FLOW OF FUNDS (REVENUE WATERFALL)</div>
            {[['Step 1: O&M Fund', `$${annOm.toFixed(1)}M — Operating & maintenance expenses paid first`, T.amber],
              ['Step 2: Senior Debt Service', `$${annDebtService.toFixed(2)}M — Coupon + scheduled principal payments`, T.red],
              ['Step 3: DSRF Replenishment', 'Top up reserve fund to max annual debt service', T.textSec],
              ['Step 4: Additional Bonds DS', 'Payments on subordinate or parity bonds (if any)', T.textSec],
              ['Step 5: Rate Stabilization Fund', 'Excess revenues deposited; drawdown in lean years', T.teal],
              ['Step 6: Surplus Revenue', `$${Math.max(0, annRevenue - annOm - annDebtService).toFixed(1)}M — Available for capital or rate relief`, T.green]].map(([step, detail, color], i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, padding: '10px 14px', background: T.surfaceH, borderRadius: 6, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 200 }}>{step}</span>
                <span style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>{detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Rating Methodology' && (
        <div>
          {[['Moody\'s Revenue Bond Methodology', '1. Issuer profile (legal framework, service area) 2. Revenue framework (rate flexibility, diversification) 3. Financial performance (DSCR, liquidity) 4. Capital planning (infrastructure age, CIP) 5. Management & governance. DSCR is primary quantitative driver.'],
            ['S&P Revenue Bond Framework', 'Enterprise risk assessment (1–6) × Financial risk assessment (1–6) → Indicative rating. Revenue stability and rate-setting authority are critical qualitative factors.'],
            ['Climate Considerations in Rating', 'Both Moody\'s and S&P have introduced physical and transition risk overlays. Water utilities in drought-prone regions face negative rating pressure. Electric utilities with coal exposure flagged for transition risk.'],
            ['Green Bond Rating Enhancement', 'Green certification does not directly improve credit rating but may provide market access benefits (lower spreads, broader investor base). CBI Climate Bonds Certification provides most credible framework.']].map(([title, desc], i) => (
            <div key={i} style={{ marginBottom: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'ESG Score' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="SELECTED SECTOR" value={sector.name} sub={`${sector.greenShare}% green share`} color={T.green} />
            <Kpi label="RESILIENCE USE" value="Yes" sub={sector.resilience} color={T.teal} />
            <Kpi label="SOCIAL CO-BENEFIT" value="High" sub="Public service essential" color={T.amber} />
            <Kpi label="GOVERNANCE" value="Strong" value2="Municipal oversight" color={T.gold} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>ESG SECTOR SCORECARD</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Sector', 'E Score', 'S Score', 'G Score', 'Overall ESG', 'Green Share'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{BOND_SECTORS.map((s, i) => {
                const eScore = Math.round(s.greenShare * 0.8 + sr(i * 11) * 20);
                const sScore = Math.round(70 + sr(i * 17) * 25);
                const gScore = Math.round(75 + sr(i * 23) * 20);
                const overall = Math.round((eScore + sScore + gScore) / 3);
                return (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                    <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: '7px 10px', color: T.green }}>{eScore}</td>
                    <td style={{ padding: '7px 10px', color: T.teal }}>{sScore}</td>
                    <td style={{ padding: '7px 10px', color: T.gold }}>{gScore}</td>
                    <td style={{ padding: '7px 10px', color: overall >= 75 ? T.green : T.amber, fontWeight: 600 }}>{overall}</td>
                    <td style={{ padding: '7px 10px', color: T.sage }}>{s.greenShare}%</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Market Benchmarks' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="US MUNI MARKET SIZE" value="$4.1Tn" sub="Outstanding bonds" />
            <Kpi label="REVENUE BOND SHARE" value="68%" sub="of muni market" color={T.green} />
            <Kpi label="GREEN LABELED SHARE" value="24%" sub="2024 issuance" color={T.teal} />
            <Kpi label="TYPICAL MATURITY" value="20-30yr" sub="Revenue bonds" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>SPREAD vs CREDIT RATING BY SECTOR</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={BOND_SECTORS.map(s => ({ name: s.name.split(' ')[0], spread: s.spread, dscr: s.dscr * 20 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Legend />
                <Bar dataKey="spread" fill={T.teal} name="Spread (bps)" />
                <Bar dataKey="dscr" fill={T.gold} name="DSCR×20" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
