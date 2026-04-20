import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', navyL: '#2a4a6f', gold: '#d4a843', goldL: '#e8c060', sage: '#2d6a4f', sageL: '#3d8a6f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const ASSET_CLASSES = [
  { id: 'solar_abs', name: 'Solar ABS', type: 'ABS', assetType: 'Residential Solar Loans', avgBalance: 28000, fico: 742, ltv: null, yieldSpr: 145, greenPct: 100, carbonAvoid: 4.2, poolSize: 500 },
  { id: 'ev_abs', name: 'EV ABS', type: 'ABS', assetType: 'Electric Vehicle Loans', avgBalance: 45000, fico: 758, ltv: 88, yieldSpr: 120, greenPct: 100, carbonAvoid: 2.8, poolSize: 300 },
  { id: 'green_rmbs', name: 'Green RMBS', type: 'RMBS', assetType: 'Green Certified Mortgages', avgBalance: 385000, fico: 768, ltv: 72, yieldSpr: 55, greenPct: 85, carbonAvoid: 1.9, poolSize: 1200 },
  { id: 'energy_eff_abs', name: 'Energy Efficiency ABS', type: 'ABS', assetType: 'PACE / Home Improvement', avgBalance: 22000, fico: 720, ltv: null, yieldSpr: 175, greenPct: 100, carbonAvoid: 3.5, poolSize: 250 },
  { id: 'green_cmbs', name: 'Green CMBS', type: 'CMBS', assetType: 'LEED/BREEAM Commercial', avgBalance: 12500000, fico: null, ltv: 58, yieldSpr: 185, greenPct: 78, carbonAvoid: 6.1, poolSize: 80 },
  { id: 'infra_abs', name: 'Climate Infra ABS', type: 'ABS', assetType: 'Wind/Solar Project Loans', avgBalance: 85000000, fico: null, ltv: 62, yieldSpr: 210, greenPct: 100, carbonAvoid: 12.4, poolSize: 25 },
];

const TRANCHES = [
  { name: 'Class A (AAA)', rating: 'AAA', attachPct: 18, detachPct: 100, couponSpr: 45, size: 82, lossAbsorb: 'Senior', creditEnhance: 'Overcollat + Reserve + Sub' },
  { name: 'Class B (AA)', rating: 'AA', attachPct: 12, detachPct: 18, couponSpr: 90, size: 6, lossAbsorb: 'Senior Sub', creditEnhance: 'Overcollat + Reserve' },
  { name: 'Class C (A)', rating: 'A', attachPct: 7, detachPct: 12, couponSpr: 150, size: 5, lossAbsorb: 'Mezzanine', creditEnhance: 'Overcollat' },
  { name: 'Class D (BBB)', rating: 'BBB', attachPct: 4, detachPct: 7, couponSpr: 250, size: 3, lossAbsorb: 'Junior Mezz', creditEnhance: 'Excess Spread' },
  { name: 'Class E (BB)', rating: 'BB', attachPct: 1.5, detachPct: 4, couponSpr: 450, size: 2.5, lossAbsorb: 'Junior', creditEnhance: 'Residual' },
  { name: 'Class F / Equity', rating: 'NR', attachPct: 0, detachPct: 1.5, couponSpr: null, size: 1.5, lossAbsorb: 'First Loss', creditEnhance: 'None' },
];

const CREDIT_ENHANCE = [
  { method: 'Overcollateralisation', typical: '8–15%', cost: 'Low', effect: 'Senior enhancement', mechanic: 'Asset pool > note balance by OC%' },
  { method: 'Reserve Fund', typical: '0.5–2%', cost: 'Medium', effect: 'Liquidity + loss buffer', mechanic: 'Cash reserve funded at close or via excess spread' },
  { method: 'Subordination', typical: '15–22%', cost: 'Equity pricing', effect: 'Structural waterfall', mechanic: 'Junior tranches absorb losses first' },
  { method: 'Excess Spread', typical: '50–200bps', cost: 'None (structural)', effect: 'Dynamic loss coverage', mechanic: 'Asset yield minus note cost > 0' },
  { method: 'Swap/Hedge', typical: 'Basis risk cost', cost: 'Swap premium', effect: 'Interest rate mismatch', mechanic: 'Fixed-floating swap to match liabilities' },
  { method: 'Wrap / Guarantee', typical: '20–50bps fee', cost: 'Guarantee fee', effect: 'External credit support', mechanic: 'Monolines or DFI first-loss guarantee' },
];

const GREEN_FRAMEWORKS = [
  { name: 'EU Green Bond Standard', scope: 'EU Taxonomy aligned', eligibility: 'Do No Significant Harm + minimum social safeguards', verification: 'External reviewer + regulator notification', greenium: '3–8bps', coverage: 'Europe' },
  { name: 'ICMA Green Bond Principles', scope: 'Use of Proceeds', eligibility: '10 eligible categories incl. renewable energy, green buildings', verification: 'Second Party Opinion', greenium: '2–5bps', coverage: 'Global' },
  { name: 'Climate Bonds Standard', scope: 'Sector criteria', eligibility: 'Science-based sector thresholds (solar, EE, low-carbon transport)', verification: 'CBI Approved Verifier', greenium: '3–6bps', coverage: 'Global' },
  { name: 'SFDR Art. 9 ABS', scope: 'Sustainable investment', eligibility: 'DNSH + principal adverse impact', verification: 'Fund manager + depositary', greenium: '1–4bps', coverage: 'EU investors' },
  { name: 'Fannie Mae Green MBS', scope: 'Energy/water savings', eligibility: 'Properties with 20%+ energy/water saving certification', verification: 'Lender reporting', greenium: '5–12bps', coverage: 'US MF mortgages' },
  { name: 'PACE ABS Framework', scope: 'Energy improvement', eligibility: 'State-specific PACE program eligibility', verification: 'Program administrator', greenium: '8–15bps', coverage: 'US PACE' },
];

const MARKET_ISSUANCE = [
  { year: 2019, greenAbs: 18, greenRmbs: 32, greenCmbs: 8, pace: 4, total: 62 },
  { year: 2020, greenAbs: 22, greenRmbs: 45, greenCmbs: 11, pace: 5, total: 83 },
  { year: 2021, greenAbs: 38, greenRmbs: 72, greenCmbs: 18, pace: 7, total: 135 },
  { year: 2022, greenAbs: 42, greenRmbs: 65, greenCmbs: 15, pace: 8, total: 130 },
  { year: 2023, greenAbs: 55, greenRmbs: 88, greenCmbs: 22, pace: 11, total: 176 },
  { year: 2024, greenAbs: 71, greenRmbs: 115, greenCmbs: 31, pace: 14, total: 231 },
];

const INVESTOR_BASE = [
  { type: 'Green / ESG Bond Funds', aum: 485, demandGrowth: 32, greeniumSensitivity: 'High', kpiRequirements: 'Annual impact report', typical: 'Class A-B' },
  { type: 'Insurance Companies', aum: 1240, demandGrowth: 18, greeniumSensitivity: 'Low', kpiRequirements: 'SFDR PAI + taxonomy alignment pct', typical: 'Class A (AAA)' },
  { type: 'Central Banks / Sovereigns', aum: 2100, demandGrowth: 24, greeniumSensitivity: 'Medium', kpiRequirements: 'Climate-aligned issuer policy', typical: 'Class A' },
  { type: 'Pension Funds', aum: 890, demandGrowth: 21, greeniumSensitivity: 'Medium', kpiRequirements: 'Net-zero commitment + reporting', typical: 'Class A-C' },
  { type: 'Banks (STS Eligible)', aum: 620, demandGrowth: 15, greeniumSensitivity: 'Low', kpiRequirements: 'LCR / HQLA treatment', typical: 'Class A' },
  { type: 'Climate-Focused Hedge Funds', aum: 95, demandGrowth: 45, greeniumSensitivity: 'Very High', kpiRequirements: 'Carbon reduction metrics, additionality', typical: 'Class D-F' },
];

const TABS = [
  'Overview', 'Pool Analytics', 'Waterfall Structuring', 'Credit Enhancement',
  'Green Eligibility', 'Pricing Engine', 'Market Intelligence', 'Investor Demand',
  'Risk Analytics', 'FI Economics'
];

function calcWaterfall({ poolBal, poolYield, cprPct, cdrPct, lgdPct, tranches }) {
  const annLoss = poolBal * (cdrPct / 100) * (lgdPct / 100);
  const annPrepay = poolBal * (cprPct / 100);
  const totalInterest = poolBal * (poolYield / 100);
  const results = [];
  let remaining = annLoss;
  for (let i = tranches.length - 1; i >= 0; i--) {
    const t = tranches[i];
    const notional = poolBal * t.size / 100;
    const absorbed = Math.min(remaining, notional);
    const lossRate = notional > 0 ? absorbed / notional : 0;
    const coupon = t.couponSpr !== null ? notional * (t.couponSpr / 10000) : 0;
    results.unshift({ ...t, notional: notional / 1e6, absorbed: absorbed / 1e6, lossRate: (lossRate * 100).toFixed(2), coupon: coupon / 1e3 });
    remaining = Math.max(0, remaining - notional);
  }
  const excessSpread = Math.max(0, totalInterest - results.reduce((s, r) => s + r.coupon * 1000, 0)) / 1e6;
  return { results, excessSpread: excessSpread.toFixed(2), annLossMm: (annLoss / 1e6).toFixed(1) };
}

function calcGreenPricing({ poolM, greenPct, framework, wacc, seniorSpr, mezzSpr }) {
  const greeniumBps = { 'EU GBS': 6, 'ICMA GBP': 3, 'CBS': 5, 'SFDR Art9': 2, 'Fannie Green': 9, 'PACE': 12 }[framework] || 4;
  const seniorNotional = poolM * 0.82;
  const mezzNotional = poolM * 0.165;
  const equityNotional = poolM * 0.015;
  const seniorCost = seniorNotional * (seniorSpr - greeniumBps * greenPct / 100) / 10000;
  const mezzCost = mezzNotional * mezzSpr / 10000;
  const wac = (seniorCost + mezzCost) / (poolM * 0.985);
  const greenBenefit = poolM * greeniumBps * greenPct / 100 / 10000;
  return { seniorNotional, mezzNotional, equityNotional, seniorCost, mezzCost, wac: (wac * 10000).toFixed(0), greenBenefit, greeniumBps };
}

export default function GreenSecuritizationPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState('solar_abs');
  const [poolM, setPoolM] = useState(500);
  const [cprPct, setCprPct] = useState(12);
  const [cdrPct, setCdrPct] = useState(1.8);
  const [lgdPct, setLgdPct] = useState(35);
  const [framework, setFramework] = useState('ICMA GBP');
  const [seniorSpr, setSeniorSpr] = useState(55);
  const [mezzSpr, setMezzSpr] = useState(185);
  const [stressScenario, setStressScenario] = useState('base');

  const asset = useMemo(() => ASSET_CLASSES.find(a => a.id === selectedAsset) || ASSET_CLASSES[0], [selectedAsset]);

  const waterfall = useMemo(() => {
    const mult = { base: 1, mild: 2, severe: 4, extreme: 7 }[stressScenario] || 1;
    return calcWaterfall({ poolBal: poolM * 1e6, poolYield: asset.yieldSpr / 100 + 4.5, cprPct, cdrPct: cdrPct * mult, lgdPct, tranches: TRANCHES });
  }, [poolM, cprPct, cdrPct, lgdPct, stressScenario, asset]);

  const pricing = useMemo(() => calcGreenPricing({ poolM: poolM * 1e6, greenPct: asset.greenPct, framework, wacc: 5.5, seniorSpr, mezzSpr }), [poolM, asset, framework, seniorSpr, mezzSpr]);

  const trancheChart = useMemo(() => TRANCHES.map(t => ({
    name: t.rating, size: t.size, spread: t.couponSpr || 0, lossAbsorb: t.attachPct,
  })), []);

  const stressLossData = useMemo(() => [
    { scenario: 'Base', cdr: cdrPct, loss: parseFloat(calcWaterfall({ poolBal: poolM * 1e6, poolYield: 7, cprPct, cdrPct, lgdPct, tranches: TRANCHES }).annLossMm) },
    { scenario: 'Mild', cdr: cdrPct * 2, loss: parseFloat(calcWaterfall({ poolBal: poolM * 1e6, poolYield: 7, cprPct, cdrPct: cdrPct * 2, lgdPct, tranches: TRANCHES }).annLossMm) },
    { scenario: 'Severe', cdr: cdrPct * 4, loss: parseFloat(calcWaterfall({ poolBal: poolM * 1e6, poolYield: 7, cprPct, cdrPct: cdrPct * 4, lgdPct, tranches: TRANCHES }).annLossMm) },
    { scenario: 'Extreme', cdr: cdrPct * 7, loss: parseFloat(calcWaterfall({ poolBal: poolM * 1e6, poolYield: 7, cprPct, cdrPct: cdrPct * 7, lgdPct, tranches: TRANCHES }).annLossMm) },
  ], [poolM, cprPct, cdrPct, lgdPct]);

  const poolComposition = useMemo(() => ASSET_CLASSES.map((a, i) => ({
    name: a.name, pct: Math.round(sr(i * 13 + 7) * 25 + 5), carbonAvoid: a.carbonAvoid, greenPct: a.greenPct,
  })), []);

  const carbonImpact = useMemo(() => ({
    annCO2Avoided: (asset.carbonAvoid * poolM / 100).toFixed(1),
    lifetimeCO2: (asset.carbonAvoid * poolM / 100 * 20).toFixed(0),
    equivalentCars: Math.round(asset.carbonAvoid * poolM / 100 * 1000 / 4.6),
  }), [asset, poolM]);

  const fiEconomics = useMemo(() => {
    const arrangementBps = 35;
    const arrangementFee = poolM * 1e6 * arrangementBps / 10000 / 1e3;
    const annualServicing = poolM * 1e6 * 0.0012 / 1e3;
    const greenVerification = 85;
    const reportingFee = 45;
    const lifetimeRev = arrangementFee + (annualServicing + reportingFee) * 5;
    return { arrangementFee, annualServicing, greenVerification, reportingFee, lifetimeRev };
  }, [poolM]);

  const s = { padding: '24px', fontFamily: T.font, color: T.text, background: T.bg, minHeight: '100vh' };
  const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px', marginBottom: 16 };
  const kpi = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px', textAlign: 'center' };
  const tab = (i) => ({ padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: T.font, background: activeTab === i ? T.gold : T.surface, color: activeTab === i ? T.navy : T.text, fontWeight: activeTab === i ? 700 : 400 });
  const inp = { background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 10px', color: T.text, fontSize: 13, fontFamily: T.mono, width: '100%' };
  const sel = { ...inp, cursor: 'pointer' };
  const badge = (c) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: c === 'AAA' ? '#065f46' : c === 'AA' ? '#1e40af' : c === 'A' ? '#1d4ed8' : c === 'BBB' ? '#92400e' : c === 'BB' ? '#7f1d1d' : '#374151', color: '#fff' });

  return (
    <div style={s}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🏗️</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.navy }}>Green Securitization Intelligence Suite</h1>
            <p style={{ margin: 0, fontSize: 13, color: T.textSec }}>EP-DW3 · Green ABS/RMBS/CMBS Structuring · Waterfall Mechanics · Credit Enhancement · FI Economics</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => <button key={i} onClick={() => setActiveTab(i)} style={tab(i)}>{t}</button>)}
        </div>
      </div>

      {activeTab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Global Green ABS Issuance 2024', value: '$231B', sub: '+31% YoY' },
              { label: 'Green RMBS Outstanding', value: '$1.2T', sub: 'Fannie Mae + EU' },
              { label: 'Avg Greenium (Senior)', value: '5bps', sub: 'vs. conventional ABS' },
              { label: 'Carbon Avoided (Solar ABS)', value: '4.2tCO₂/$100K', sub: 'Per pool notional' },
            ].map((k, i) => (
              <div key={i} style={kpi}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>{k.value}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>{k.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Asset Class Landscape</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>{['Asset Class','Type','Avg Balance','Green %','Yield Spr','CO₂ Avoid'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                <tbody>{ASSET_CLASSES.map((a, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                    <td style={{ padding: '7px 8px', color: T.navy, fontWeight: 600 }}>{a.name}</td>
                    <td style={{ padding: '7px 8px', color: T.textSec }}>{a.type}</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono }}>${(a.avgBalance > 1e6 ? (a.avgBalance/1e6).toFixed(1)+'M' : (a.avgBalance/1000).toFixed(0)+'K')}</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono, color: a.greenPct === 100 ? T.green : T.amber }}>{a.greenPct}%</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono }}>{a.yieldSpr}bps</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.teal }}>{a.carbonAvoid}t/$100K</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Market Issuance Trend ($Bn)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={MARKET_ISSUANCE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="greenAbs" name="Green ABS" stackId="1" stroke={T.teal} fill={T.teal} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="greenRmbs" name="Green RMBS" stackId="1" stroke={T.navy} fill={T.navy} fillOpacity={0.5} />
                  <Area type="monotone" dataKey="greenCmbs" name="Green CMBS" stackId="1" stroke={T.gold} fill={T.gold} fillOpacity={0.5} />
                  <Area type="monotone" dataKey="pace" name="PACE ABS" stackId="1" stroke={T.sage} fill={T.sage} fillOpacity={0.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Capital Structure Overview — Standard Green ABS</h3>
            <div style={{ display: 'flex', gap: 0, height: 60, borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
              {[{ pct: 82, color: '#1e3a5f', label: 'Class A (AAA) 82%' }, { pct: 6, color: '#1d4ed8', label: 'B 6%' }, { pct: 5, color: '#2563eb', label: 'C 5%' }, { pct: 3, color: '#d97706', label: 'D 3%' }, { pct: 2.5, color: '#b91c1c', label: 'E 2.5%' }, { pct: 1.5, color: '#374151', label: 'F/Eq 1.5%' }].map((t, i) => (
                <div key={i} style={{ width: `${t.pct}%`, background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', padding: '0 2px' }}>{t.pct >= 5 ? t.label : ''}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
              {TRANCHES.map((t, i) => (
                <div key={i} style={{ ...kpi, padding: '12px 8px' }}>
                  <div style={{ ...badge(t.rating), marginBottom: 8 }}>{t.rating}</div>
                  <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{t.size}% of pool</div>
                  <div style={{ fontSize: 12, fontFamily: T.mono, color: T.navy }}>{t.couponSpr ? `+${t.couponSpr}bps` : 'Residual'}</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>{t.lossAbsorb}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
            <div>
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Pool Parameters</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Asset Class</label><select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)} style={sel}>
                    {ASSET_CLASSES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Pool Size ($M): {poolM}</label><input type="range" min={50} max={2000} step={50} value={poolM} onChange={e => setPoolM(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>CPR (% p.a.): {cprPct}</label><input type="range" min={3} max={35} step={1} value={cprPct} onChange={e => setCprPct(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>CDR (% p.a.): {cdrPct}</label><input type="range" min={0.2} max={8} step={0.1} value={cdrPct} onChange={e => setCdrPct(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>LGD (%): {lgdPct}</label><input type="range" min={10} max={70} step={5} value={lgdPct} onChange={e => setLgdPct(+e.target.value)} style={{ width: '100%' }} /></div>
                </div>
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Selected Asset Profile</h3>
                {[
                  ['Type', asset.assetType],
                  ['Avg Balance', `$${asset.avgBalance > 1e6 ? (asset.avgBalance/1e6).toFixed(1)+'M' : (asset.avgBalance/1000).toFixed(0)+'K'}`],
                  ['FICO Score', asset.fico || 'N/A'],
                  ['LTV', asset.ltv ? `${asset.ltv}%` : 'N/A'],
                  ['Green %', `${asset.greenPct}%`],
                  ['Carbon Avoid', `${asset.carbonAvoid}t/$100K`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                    <span style={{ color: T.textSec }}>{k}</span>
                    <span style={{ fontFamily: T.mono, color: T.navy }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Pool Size', value: `$${poolM}M` },
                  { label: 'Ann. Default Loss', value: `$${waterfall.annLossMm}M` },
                  { label: 'Excess Spread', value: `$${waterfall.excessSpread}M` },
                  { label: 'CO₂ Avoided (ann)', value: `${carbonImpact.annCO2Avoided}ktCO₂` },
                  { label: 'Equiv. Cars Off Road', value: carbonImpact.equivalentCars.toLocaleString() },
                  { label: 'Lifetime CO₂ Saved', value: `${carbonImpact.lifetimeCO2}ktCO₂` },
                ].map((k, i) => <div key={i} style={kpi}><div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{k.label}</div><div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{k.value}</div></div>)}
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Pool Composition (Illustrative Mix)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={poolComposition}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                    <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`${v}%`, 'Pool Share']} />
                    <Bar dataKey="pct" name="Pool %" fill={T.teal} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 14, color: T.navy }}>Stress Scenario</h3>
                <select value={stressScenario} onChange={e => setStressScenario(e.target.value)} style={{ ...sel, width: 'auto' }}>
                  {['base','mild','severe','extreme'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>{['Tranche','Rating','Size','Notional ($M)','Loss Absorbed ($M)','Loss Rate (%)','Coupon ($K/yr)'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'right', color: T.textMut, borderBottom: `1px solid ${T.border}`, textAlign: h === 'Tranche' ? 'left' : 'right' }}>{h}</th>)}</tr></thead>
                <tbody>{waterfall.results.map((t, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                    <td style={{ padding: '7px 8px', color: T.navy, fontWeight: 600, fontSize: 11 }}>{t.name}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right' }}><span style={badge(t.rating)}>{t.rating}</span></td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono }}>{t.size}%</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono }}>{t.notional.toFixed(1)}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono, color: parseFloat(t.absorbed) > 0 ? T.red : T.green }}>{t.absorbed.toFixed(2)}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono, color: parseFloat(t.lossRate) > 0 ? T.red : T.green }}>{t.lossRate}%</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: T.mono }}>{t.coupon > 0 ? t.coupon.toFixed(0) : '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
              <div style={{ marginTop: 12, padding: 10, background: T.surfaceH, borderRadius: 6, fontSize: 12 }}>
                <span style={{ color: T.textSec }}>Annual Loss: </span><span style={{ fontFamily: T.mono, color: T.red }}>${waterfall.annLossMm}M </span>
                <span style={{ color: T.textSec, marginLeft: 12 }}>Excess Spread: </span><span style={{ fontFamily: T.mono, color: T.green }}>${waterfall.excessSpread}M</span>
              </div>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Stress Loss Scenarios</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stressLossData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="scenario" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: '$M', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`$${v}M`, 'Annual Loss']} />
                  <Bar dataKey="loss" name="Annual Loss ($M)" fill={T.red} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Tranche Spread vs. Size</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trancheChart}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Spread (bps)', angle: -90, position: 'insideLeft', fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Size (%)', angle: 90, position: 'insideRight', fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="spread" name="Spread (bps)" fill={T.navy} radius={[3,3,0,0]} />
                <Bar yAxisId="right" dataKey="size" name="Size (% pool)" fill={T.teal} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {CREDIT_ENHANCE.map((ce, i) => (
              <div key={i} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, color: T.navy }}>{ce.method}</h3>
                  <span style={{ fontSize: 11, fontFamily: T.mono, background: T.surfaceH, padding: '3px 8px', borderRadius: 4, color: T.teal }}>{ce.typical}</span>
                </div>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>{ce.mechanic}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1, padding: 8, background: T.surfaceH, borderRadius: 4, fontSize: 11 }}>
                    <div style={{ color: T.textMut, marginBottom: 3 }}>Cost</div>
                    <div style={{ color: T.amber, fontWeight: 600 }}>{ce.cost}</div>
                  </div>
                  <div style={{ flex: 2, padding: 8, background: T.surfaceH, borderRadius: 4, fontSize: 11 }}>
                    <div style={{ color: T.textMut, marginBottom: 3 }}>Effect</div>
                    <div style={{ color: T.navy, fontWeight: 600 }}>{ce.effect}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 4 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {GREEN_FRAMEWORKS.map((gf, i) => (
              <div key={i} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, color: T.navy }}>{gf.name}</h3>
                  <span style={{ fontSize: 12, fontFamily: T.mono, color: T.green, fontWeight: 700 }}>{gf.greenium} greenium</span>
                </div>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 6 }}>Coverage: {gf.coverage} · Scope: {gf.scope}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[['Eligibility', gf.eligibility], ['Verification', gf.verification]].map(([k, v]) => (
                    <div key={k} style={{ fontSize: 12 }}>
                      <span style={{ color: T.textSec, fontWeight: 600 }}>{k}: </span>
                      <span style={{ color: T.text }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 5 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
            <div>
              <div style={card}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Pricing Inputs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Green Framework</label>
                    <select value={framework} onChange={e => setFramework(e.target.value)} style={sel}>
                      {['EU GBS','ICMA GBP','CBS','SFDR Art9','Fannie Green','PACE'].map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Senior Spread (bps): {seniorSpr}</label><input type="range" min={20} max={150} step={5} value={seniorSpr} onChange={e => setSeniorSpr(+e.target.value)} style={{ width: '100%' }} /></div>
                  <div><label style={{ fontSize: 12, color: T.textSec }}>Mezz Spread (bps): {mezzSpr}</label><input type="range" min={80} max={400} step={10} value={mezzSpr} onChange={e => setMezzSpr(+e.target.value)} style={{ width: '100%' }} /></div>
                </div>
              </div>
            </div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Greenium (bps)', value: pricing.greeniumBps },
                  { label: 'Green Benefit ($K)', value: (pricing.greenBenefit / 1000).toFixed(0) },
                  { label: 'Blended WAC (bps)', value: pricing.wac },
                  { label: 'Senior Notional ($M)', value: (pricing.seniorNotional / 1e6).toFixed(0) },
                  { label: 'Mezz Notional ($M)', value: (pricing.mezzNotional / 1e6).toFixed(0) },
                  { label: 'Equity ($M)', value: (pricing.equityNotional / 1e6).toFixed(1) },
                ].map((k, i) => <div key={i} style={kpi}><div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{k.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: T.navy }}>{k.value}</div></div>)}
              </div>
              <div style={card}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Greenium by Framework</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { name: 'EU GBS', bps: 6 }, { name: 'CBS', bps: 5 }, { name: 'Fannie Green', bps: 9 },
                    { name: 'ICMA GBP', bps: 3 }, { name: 'SFDR Art9', bps: 2 }, { name: 'PACE', bps: 12 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                    <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                    <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`${v}bps`, 'Greenium']} />
                    <Bar dataKey="bps" fill={T.green} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 6 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Annual Issuance by Segment ($Bn)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={MARKET_ISSUANCE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="total" name="Total" stroke={T.navy} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="greenAbs" name="Green ABS" stroke={T.teal} strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="greenRmbs" name="Green RMBS" stroke={T.gold} strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="greenCmbs" name="Green CMBS" stroke={T.sage} strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Market Growth Outlook</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={[
                  ...MARKET_ISSUANCE,
                  { year: 2025, total: 310, greenAbs: 95, greenRmbs: 155, greenCmbs: 42, pace: 18 },
                  { year: 2026, total: 415, greenAbs: 128, greenRmbs: 210, greenCmbs: 56, pace: 21 },
                  { year: 2027, total: 545, greenAbs: 168, greenRmbs: 278, greenCmbs: 74, pace: 25 },
                  { year: 2030, total: 950, greenAbs: 290, greenRmbs: 490, greenCmbs: 128, pace: 42 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <ReferenceLine x={2024} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'Forecast →', fontSize: 10, fill: T.amber }} />
                  <Area type="monotone" dataKey="total" name="Total ($Bn)" stroke={T.navy} fill={T.navy} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 7 && (
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.navy }}>Investor Base by Type</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Investor Type','AUM ($Bn)','Demand Growth','Greenium Sensitivity','KPI Requirements','Typical Tranches'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.textMut, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{INVESTOR_BASE.map((inv, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: T.navy }}>{inv.type}</td>
                  <td style={{ padding: '8px 10px', fontFamily: T.mono }}>${inv.aum}B</td>
                  <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.green }}>+{inv.demandGrowth}%</td>
                  <td style={{ padding: '8px 10px', color: inv.greeniumSensitivity === 'High' || inv.greeniumSensitivity === 'Very High' ? T.teal : T.textSec }}>{inv.greeniumSensitivity}</td>
                  <td style={{ padding: '8px 10px', color: T.textSec, fontSize: 11 }}>{inv.kpiRequirements}</td>
                  <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{inv.typical}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Investor AUM by Type ($Bn)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={INVESTOR_BASE} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis dataKey="type" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={180} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`$${v}B`, 'AUM']} />
                <Bar dataKey="aum" fill={T.navy} radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 8 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Prepayment Risk (CPR Sensitivity)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={[5,8,12,15,20,25,30,35].map(cpr => ({
                  cpr, seniorSpd: Math.max(20, seniorSpr - (cpr - 12) * 0.5), convexity: -(cpr / 10).toFixed(1),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="cpr" label={{ value: 'CPR (%)', position: 'insideBottom', offset: -2, fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Line type="monotone" dataKey="seniorSpd" name="Senior Spread (bps)" stroke={T.navy} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Climate Correlation Risk</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { risk: 'Physical Climate (flooding)', impact: 'CDR increase in coastal pools', severity: 'High', mitigation: 'Geography diversification + insurance wrap' },
                  { risk: 'Transition Risk (EV adoption)', impact: 'Prepayment acceleration in EV ABS', severity: 'Medium', mitigation: 'CPR stress testing + call protection' },
                  { risk: 'Policy Risk (PACE changes)', impact: 'Lien priority challenge', severity: 'High', mitigation: 'State-by-state legal analysis' },
                  { risk: 'Greenwashing / ESG rerating', impact: 'Greenium compression post-issuance', severity: 'Medium', mitigation: 'Annual impact reporting + verifier SPO' },
                  { risk: 'Correlation (solar + property values)', impact: 'LGD spike in weather events', severity: 'Medium', mitigation: 'OC buffer + geographic concentration limits' },
                ].map((r, i) => (
                  <div key={i} style={{ padding: '10px 14px', background: T.surfaceH, borderRadius: 6, borderLeft: `3px solid ${r.severity === 'High' ? T.red : T.amber}` }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: T.navy, marginBottom: 4 }}>{r.risk}</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>{r.impact}</div>
                    <div style={{ fontSize: 11, color: T.teal }}><span style={{ color: T.textMut }}>Mitigation: </span>{r.mitigation}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 9 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Arrangement Fee ($K)', value: fiEconomics.arrangementFee.toFixed(0) },
              { label: 'Annual Servicing ($K)', value: fiEconomics.annualServicing.toFixed(0) },
              { label: 'Green Verification ($K)', value: fiEconomics.greenVerification },
              { label: 'Lifetime Revenue ($K, 5yr)', value: fiEconomics.lifetimeRev.toFixed(0) },
            ].map((k, i) => <div key={i} style={kpi}><div style={{ fontSize: 11, color: T.textMut, marginBottom: 6 }}>{k.label}</div><div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>${k.value}</div></div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>FI Revenue Decomposition</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { component: 'Arrangement', revenue: fiEconomics.arrangementFee },
                  { component: 'Servicing (5yr)', revenue: fiEconomics.annualServicing * 5 },
                  { component: 'Green Report (5yr)', revenue: fiEconomics.reportingFee * 5 },
                  { component: 'Verification (5yr)', revenue: fiEconomics.greenVerification * 5 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="component" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`$${v.toFixed(0)}K`, 'Revenue']} />
                  <Bar dataKey="revenue" fill={T.gold} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.navy }}>Revenue vs. Pool Size Sensitivity</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={[50,100,200,300,500,750,1000,1500,2000].map(ps => ({
                  pool: ps, lifetime: (ps * 1e6 * 35 / 10000 / 1e3 + (ps * 1e6 * 0.0012 / 1e3 + 45 + 85/5) * 5),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="pool" label={{ value: 'Pool ($M)', position: 'insideBottom', offset: -2, fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={(v) => [`$${v.toFixed(0)}K`, '5yr Revenue']} />
                  <Line type="monotone" dataKey="lifetime" stroke={T.gold} strokeWidth={2} dot={false} />
                  <ReferenceLine x={poolM} stroke={T.navy} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
