import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import Apr2026CarbonAnalytics from '../../_shared/Apr2026CarbonAnalytics';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', gold: '#d4a843', sage: '#2d6a4f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const IPPS = [
  { id: 'ntpc', name: 'NTPC Renewable Energy', parentCo: 'NTPC Ltd (GoI)', installedGw: 3.8, targetGw2030: 60, pipelineGw: 12.4, statesFocus: ['Rajasthan', 'Gujarat', 'MP'], plf: 0.22, gridEf: 0.82, cctsCreditsYr: 0, recYr: 0, jcmEligible: true, greenBondIssuedGbn: 2.1, debtEquity: [70, 30], dscrAvg: 1.38, irrEquity: 14.2, ppa: 'SECI/NTPC' },
  { id: 'adani', name: 'Adani Green Energy', parentCo: 'Adani Group', installedGw: 10.9, targetGw2030: 45, pipelineGw: 18.2, statesFocus: ['Rajasthan', 'Gujarat', 'UP'], plf: 0.24, gridEf: 0.82, cctsCreditsYr: 0, recYr: 0, jcmEligible: true, greenBondIssuedGbn: 3.5, debtEquity: [75, 25], dscrAvg: 1.42, irrEquity: 15.8, ppa: 'SECI/DISCOMS' },
  { id: 'renew', name: 'ReNew Power', parentCo: 'ReNew (NASDAQ: RNW)', installedGw: 9.4, targetGw2030: 18, pipelineGw: 8.1, statesFocus: ['Karnataka', 'Rajasthan', 'Andhra Pradesh'], plf: 0.23, gridEf: 0.82, cctsCreditsYr: 0, recYr: 0, jcmEligible: true, greenBondIssuedGbn: 1.8, debtEquity: [72, 28], dscrAvg: 1.35, irrEquity: 13.6, ppa: 'State DISCOMs / C&I' },
  { id: 'greenko', name: 'Greenko Energy', parentCo: 'Greenko Group', installedGw: 8.1, targetGw2030: 20, pipelineGw: 10.2, statesFocus: ['Andhra Pradesh', 'Telangana', 'Karnataka'], plf: 0.25, gridEf: 0.82, cctsCreditsYr: 0, recYr: 0, jcmEligible: true, greenBondIssuedGbn: 2.4, debtEquity: [68, 32], dscrAvg: 1.44, irrEquity: 16.1, ppa: 'C&I + SECI' },
  { id: 'azure', name: 'Azure Power', parentCo: 'Azure Power Global (CDPQ)', installedGw: 2.8, targetGw2030: 5, pipelineGw: 2.2, statesFocus: ['Rajasthan', 'Punjab', 'UP'], plf: 0.21, gridEf: 0.82, cctsCreditsYr: 0, recYr: 0, jcmEligible: false, greenBondIssuedGbn: 0.8, debtEquity: [74, 26], dscrAvg: 1.31, irrEquity: 12.4, ppa: 'SECI' },
  { id: 'torrent', name: 'Torrent Power Solar', parentCo: 'Torrent Group', installedGw: 1.4, targetGw2030: 6, pipelineGw: 3.8, statesFocus: ['Gujarat', 'Rajasthan', 'Maharashtra'], plf: 0.22, gridEf: 0.82, cctsCreditsYr: 0, recYr: 0, jcmEligible: false, greenBondIssuedGbn: 0.4, debtEquity: [65, 35], dscrAvg: 1.52, irrEquity: 17.2, ppa: 'C&I + DISCOM' },
];

const GRID_EF_HISTORY = [
  { yr: 2018, ef: 0.94 }, { yr: 2019, ef: 0.91 }, { yr: 2020, ef: 0.88 }, { yr: 2021, ef: 0.86 },
  { yr: 2022, ef: 0.84 }, { yr: 2023, ef: 0.83 }, { yr: 2024, ef: 0.82 }, { yr: 2025, ef: 0.80 },
  { yr: 2026, ef: 0.77 }, { yr: 2028, ef: 0.71 }, { yr: 2030, ef: 0.62 },
];

const CREDIT_METHODOLOGIES = [
  { name: 'ACM0002 (Grid-Connected RE)', registry: 'CDM / VCS', approach: 'Baseline grid EF × net gen', baselineEf: 0.82, discountPct: 3, vintage: 'Annual', price: '$8-18', jcmCompat: true },
  { name: 'AMS-I.D. (Small Grid-Connected)', registry: 'CDM / Gold Standard', approach: 'Combined margin EF × net gen', baselineEf: 0.85, discountPct: 2, vintage: 'Annual', price: '$10-22', jcmCompat: true },
  { name: 'India CCTS Offset (Non-PAT sector)', registry: 'BEE / MoEFCC', approach: 'Grid EF (CEA) × net gen', baselineEf: 0.82, discountPct: 0, vintage: 'Annual', price: '₹200-600', jcmCompat: false },
  { name: 'VCS VM0048 (Afforestation + RE)', registry: 'Verra', approach: 'RE + co-located nature credit', baselineEf: 0.82, discountPct: 5, vintage: 'Annual', price: '$15-30', jcmCompat: false },
  { name: 'JCM Solar Methodology (Japan)', registry: 'JCM / MoEF Japan-India', approach: 'CEA grid EF × generation, JCM bilateral', baselineEf: 0.82, discountPct: 0, vintage: 'Annual', price: '$14-22', jcmCompat: true },
];

const REC_DATA = [
  { yr: '2020', solar: 3.2, nonsolar: 2.1, price: 3.5 }, { yr: '2021', solar: 3.8, nonsolar: 2.4, price: 3.8 },
  { yr: '2022', solar: 4.5, nonsolar: 2.6, price: 4.2 }, { yr: '2023', solar: 5.1, nonsolar: 2.8, price: 4.6 },
  { yr: '2024', solar: 5.8, nonsolar: 3.0, price: 4.9 }, { yr: '2025', solar: 6.2, nonsolar: 3.2, price: 5.2 },
];

const PROJECT_FINANCE_WATERFALL = [
  { layer: 'Senior Debt (SBI/PFC/REC)', share: 55, rate: '9.5-10.5%', tenor: '20yr', security: 'Hypothecation of assets + DSRA' },
  { layer: 'Green Bond (listed)', share: 15, rate: '8.5-9.5%', tenor: '10yr', security: 'Second charge + escrow' },
  { layer: 'Subordinated Debt (NaBFID/IFC)', share: 5, rate: '8.0-9.0%', tenor: '15yr', security: 'Third charge + guarantee' },
  { layer: 'Mezzanine (PE / DFI)', share: 5, rate: '12-16%', tenor: '7yr', security: 'Equity pledge' },
  { layer: 'Equity (Promoter + FDI)', share: 20, rate: '14-18% target IRR', tenor: 'Perpetual', security: 'Residual claim' },
];

const TABS = ['Overview', 'IPP Dashboard', 'Carbon Credit Calc.', 'Methodology Compare', 'REC Market', 'Green Bond Structure', 'Project Finance', 'JCM Eligibility', 'CCTS Compliance', 'IRR Sensitivity'];

function calcCarbonCredits({ gwInstalled, plf, gridEf, discountPct, creditPrice }) {
  const annGenMwh = gwInstalled * 1000 * plf * 8760;
  const grossCredits = annGenMwh * gridEf / 1000;
  const netCredits = grossCredits * (1 - discountPct / 100);
  const revenue = netCredits * creditPrice;
  return { annGenMwh, grossCredits, netCredits, revenue };
}
function calcDscr({ annRevenue, annOpex, annDebtService }) {
  return annDebtService > 0 ? (annRevenue - annOpex) / annDebtService : 0;
}

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function SolarDeveloperCarbonFinancePage() {
  const [tab, setTab] = useState(0);
  const [selIpp, setSelIpp] = useState('adani');
  const [gwInput, setGwInput] = useState(1.0);
  const [plfInput, setPlfInput] = useState(22);
  const [gridEfInput, setGridEfInput] = useState(82);
  const [creditPriceInput, setCreditPriceInput] = useState(15);
  const [discountInput, setDiscountInput] = useState(3);
  const [selMethod, setSelMethod] = useState(0);

  const ipp = IPPS.find(i => i.id === selIpp) || IPPS[0];
  const method = CREDIT_METHODOLOGIES[selMethod];
  const calc = calcCarbonCredits({ gwInstalled: gwInput, plf: plfInput / 100, gridEf: gridEfInput / 100, discountPct: discountInput, creditPrice: creditPriceInput });
  const totalInstalledGw = IPPS.reduce((s, i) => s + i.installedGw, 0);
  const totalPipelineGw = IPPS.reduce((s, i) => s + i.pipelineGw, 0);
  const totalGreenBonds = IPPS.reduce((s, i) => s + i.greenBondIssuedGbn, 0);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: 24 }}>
      <div style={{ borderBottom: `2px solid ${T.gold}`, paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 2 }}>EP-EA2 · INDIA GREEN ECONOMY CARBON FINANCE</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0', color: T.text }}>Solar Power Developer Carbon Finance</h1>
        <div style={{ fontSize: 12, color: T.textSec }}>India Solar IPPs · ACM0002/AMS-I.D. Credits · CCTS Offset · REC Market · JCM Bilateral · Green Bond Structure · Project Finance · 10 Tabs</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Kpi label="TOTAL INSTALLED (6 IPPs)" value={`${totalInstalledGw.toFixed(1)} GW`} sub="Tracked solar capacity" />
        <Kpi label="PIPELINE" value={`${totalPipelineGw.toFixed(1)} GW`} sub="Under construction/awarded" color={T.amber} />
        <Kpi label="GREEN BONDS ISSUED" value={`$${totalGreenBonds.toFixed(1)}Bn`} sub="Aggregate issuance" color={T.teal} />
        <Kpi label="INDIA GRID EF (CEA 2024)" value="0.82 tCO₂/MWh" sub="Combined margin (CM)" color={T.sage} />
        <Kpi label="RPO SOLAR TARGET" value="8% by 2030" sub="Renewable Purchase Obligation" color={T.gold} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '6px 14px', borderRadius: 4, border: `1px solid ${tab === i ? T.gold : T.border}`, background: tab === i ? T.navy : T.surface, color: tab === i ? T.gold : T.textSec, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>INDIA GRID EMISSION FACTOR TRAJECTORY (CEA, tCO₂/MWh)</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={GRID_EF_HISTORY}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="yr" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} domain={[0.5, 1.0]} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><ReferenceLine y={0.82} stroke={T.gold} strokeDasharray="3 3" label={{ value: 'Current 0.82', fill: T.gold, fontSize: 9 }} /><Line type="monotone" dataKey="ef" stroke={T.amber} strokeWidth={2} dot={{ fill: T.amber, r: 4 }} name="Grid EF (tCO₂/MWh)" /></LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>IPP INSTALLED vs PIPELINE CAPACITY (GW)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={IPPS}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 8 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Bar dataKey="installedGw" fill={T.sage} name="Installed (GW)" /><Bar dataKey="pipelineGw" fill={T.amber} name="Pipeline (GW)" /></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, gridColumn: '1/-1' }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>IPP CARBON FINANCE METRICS</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>{['IPP', 'Installed (GW)', 'Target 2030', 'PLF', 'DSCR', 'Equity IRR', 'Green Bond', 'JCM'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.textMut, fontFamily: T.mono }}>{h}</th>)}</tr></thead>
              <tbody>{IPPS.map((i, idx) => (
                <tr key={i.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: idx % 2 === 0 ? 'transparent' : T.surfaceH }}>
                  <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono }}>{i.name.split(' ').slice(0, 2).join(' ')}</td>
                  <td style={{ padding: '7px 10px', color: T.text, fontFamily: T.mono }}>{i.installedGw}</td>
                  <td style={{ padding: '7px 10px', color: T.amber, fontFamily: T.mono }}>{i.targetGw2030} GW</td>
                  <td style={{ padding: '7px 10px', color: T.teal, fontFamily: T.mono }}>{(i.plf * 100).toFixed(0)}%</td>
                  <td style={{ padding: '7px 10px', color: i.dscrAvg >= 1.3 ? T.green : T.amber, fontFamily: T.mono }}>{i.dscrAvg}×</td>
                  <td style={{ padding: '7px 10px', color: T.green, fontFamily: T.mono }}>{i.irrEquity}%</td>
                  <td style={{ padding: '7px 10px', color: T.sage, fontFamily: T.mono }}>${i.greenBondIssuedGbn}Bn</td>
                  <td style={{ padding: '7px 10px', color: i.jcmEligible ? T.green : T.textMut }}>{i.jcmEligible ? '✓' : '–'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {IPPS.map(i => <button key={i.id} onClick={() => setSelIpp(i.id)} style={{ padding: '6px 12px', borderRadius: 4, border: `1px solid ${selIpp === i.id ? T.gold : T.border}`, background: selIpp === i.id ? T.navy : T.surface, color: selIpp === i.id ? T.gold : T.text, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{i.name.split(' ')[0]}</button>)}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold, marginBottom: 4 }}>{ipp.name}</div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>{ipp.parentCo} · PPA: {ipp.ppa}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              <Kpi label="INSTALLED" value={`${ipp.installedGw} GW`} sub={`Target 2030: ${ipp.targetGw2030} GW`} />
              <Kpi label="PLF" value={`${(ipp.plf * 100).toFixed(0)}%`} sub="Plant Load Factor" color={T.amber} />
              <Kpi label="EQUITY IRR" value={`${ipp.irrEquity}%`} sub="Post-tax levered" color={T.green} />
              <Kpi label="DSCR" value={`${ipp.dscrAvg}×`} sub="Average DSCR" color={ipp.dscrAvg >= 1.3 ? T.green : T.amber} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 8 }}>ANNUAL CARBON CREDITS (ACM0002 @ 0.82 tCO₂/MWh)</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.sage, fontFamily: T.mono }}>{(ipp.installedGw * 1000 * ipp.plf * 8760 * 0.82 / 1000 * 0.97 / 1000).toFixed(0)}Kt CO₂</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>@ $15/t ≈ ${(ipp.installedGw * 1000 * ipp.plf * 8760 * 0.82 / 1000 * 0.97 * 15 / 1e6).toFixed(1)}M/yr revenue</div>
              </div>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 8 }}>CAPITAL STRUCTURE</div>
                {[['Debt', ipp.debtEquity[0]], ['Equity', ipp.debtEquity[1]]].map(([label, pct]) => (
                  <div key={label} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSec, marginBottom: 3 }}><span>{label}</span><span style={{ fontFamily: T.mono }}>{pct}%</span></div>
                    <div style={{ background: T.borderL, borderRadius: 3, height: 6 }}><div style={{ background: label === 'Debt' ? T.teal : T.gold, width: `${pct}%`, height: 6, borderRadius: 3 }} /></div>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 8 }}>Green Bond: ${ipp.greenBondIssuedGbn}Bn issued · JCM: {ipp.jcmEligible ? 'Eligible' : 'Not eligible'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 16 }}>CARBON CREDIT REVENUE CALCULATOR</div>
            {[['Capacity (GW)', gwInput, setGwInput, 0.1, 20, 0.1], ['PLF (%)', plfInput, setPlfInput, 10, 35], ['Grid EF (tCO₂/MWh × 100)', gridEfInput, setGridEfInput, 50, 95], ['Credit Price ($/t)', creditPriceInput, setCreditPriceInput, 5, 50], ['Discount / Buffer (%)', discountInput, setDiscountInput, 0, 15]].map(([label, val, set, min, max, step = 1]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, fontFamily: T.mono }}>{label}: <span style={{ color: T.gold }}>{val}</span></div>
                <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
              </div>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>RESULTS</div>
            <div style={{ background: T.navy, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[['Annual Generation', `${(calc.annGenMwh / 1e6).toFixed(2)} TWh`, T.teal], ['Gross Credits', `${(calc.grossCredits / 1000).toFixed(1)}Kt CO₂`, T.amber], ['Net Credits (after disc.)', `${(calc.netCredits / 1000).toFixed(1)}Kt CO₂`, T.sage], ['Annual Revenue', `$${(calc.revenue / 1e6).toFixed(2)}M`, T.green]].map(([label, val, color]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: T.textMut }}>{label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: T.mono, marginTop: 4 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 8 }}>CARBON REVENUE AS % OF PPA REVENUE</div>
              <div style={{ fontSize: 11, color: T.textSec }}>Typical solar PPA (India): ₹2.5-3.5/kWh · At {gwInput}GW/{plfInput}% PLF → ₹{(gwInput * 1000 * plfInput / 100 * 8760 * 3.0 / 1e6).toFixed(0)}M/yr PPA revenue</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.gold, marginTop: 6, fontFamily: T.mono }}>Carbon credit premium: {calc.revenue > 0 ? (calc.revenue / 1e6 / Math.max(1, gwInput * 1000 * plfInput / 100 * 8760 * 3.0 / (1e6 * 84)) * 100).toFixed(1) : 0}% of PPA revenue</div>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {CREDIT_METHODOLOGIES.map((m, i) => <button key={i} onClick={() => setSelMethod(i)} style={{ padding: '6px 12px', borderRadius: 4, border: `1px solid ${selMethod === i ? T.gold : T.border}`, background: selMethod === i ? T.navy : T.surface, color: selMethod === i ? T.gold : T.text, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{m.name.split(' ')[0]}</button>)}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold, marginBottom: 4 }}>{method.name}</div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>Registry: {method.registry}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <Kpi label="APPROACH" value={method.approach.split('×')[0]} sub={method.approach} />
              <Kpi label="BASELINE EF" value={`${method.baselineEf} tCO₂/MWh`} sub="Grid emission factor" color={T.amber} />
              <Kpi label="DISCOUNT" value={`${method.discountPct}%`} sub="Permanence / buffer" color={T.teal} />
              <Kpi label="CREDIT PRICE" value={method.price} sub={`JCM compatible: ${method.jcmCompat ? 'Yes' : 'No'}`} color={method.jcmCompat ? T.green : T.textMut} />
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>METHODOLOGY COMPARISON</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>{['Methodology', 'Registry', 'Baseline EF', 'Discount', 'Price', 'JCM Compat'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.textMut, fontFamily: T.mono }}>{h}</th>)}</tr></thead>
              <tbody>{CREDIT_METHODOLOGIES.map((m, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                  <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono }}>{m.name.split(' ')[0]}</td>
                  <td style={{ padding: '7px 10px', color: T.text }}>{m.registry}</td>
                  <td style={{ padding: '7px 10px', color: T.amber, fontFamily: T.mono }}>{m.baselineEf}</td>
                  <td style={{ padding: '7px 10px', color: T.teal, fontFamily: T.mono }}>{m.discountPct}%</td>
                  <td style={{ padding: '7px 10px', color: T.green, fontFamily: T.mono }}>{m.price}</td>
                  <td style={{ padding: '7px 10px', color: m.jcmCompat ? T.green : T.textMut }}>{m.jcmCompat ? '✓ Yes' : '✗ No'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>INDIA REC MARKET — SOLAR vs NON-SOLAR (M RECs & Price ₹/kWh)</div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={REC_DATA}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="yr" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Area type="monotone" dataKey="solar" stroke={T.gold} fill={T.gold} fillOpacity={0.25} name="Solar RECs (M)" /><Area type="monotone" dataKey="nonsolar" stroke={T.sage} fill={T.sage} fillOpacity={0.2} name="Non-Solar RECs (M)" /></AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>REC FRAMEWORK (INDIA)</div>
              {[['Issued by', 'Central Electricity Regulatory Commission (CERC)'], ['Registry', 'NLDC / POSOCO REC Registry'], ['Solar REC Price', '₹3.5-6.0 per kWh (floor ₹3.50, forbearance ₹6.00)'], ['Non-Solar REC Price', '₹1.5-3.0 per kWh'], ['RPO Compliance', 'DISCOMs + large consumers (C&I)'], ['Trading Platform', 'IEX / PXIL — monthly clearing'], ['CDM linkage', 'RECs and CERs cannot be double-claimed'], ['JCM linkage', 'JCM credits additionally issued if no REC claimed']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 11 }}>
                  <span style={{ color: T.textSec }}>{k}</span><span style={{ color: T.gold, fontFamily: T.mono, textAlign: 'right', maxWidth: '55%' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>REC vs CARBON CREDIT STACKING RULES</div>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginBottom: 10 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.amber }}>Cannot stack (same MWh):</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>REC + CDM CER from same generation unit — double-counting prohibited (CDM EB ruling)</div>
              </div>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginBottom: 10 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.green }}>Can stack (different claims):</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>REC (RPO compliance) + CCTS Offset Credit (if different additionality claim) — pending BEE clarification</div>
              </div>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 12 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.teal }}>JCM + REC combination:</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>JCM credits can be issued if no REC is simultaneously claimed for the same generation — developer must choose one instrument</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>GREEN BOND STRUCTURE — INDIA SOLAR IPP</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              <Kpi label="FRAMEWORK" value="SEBI GBF + ICMA" sub="Green Bond Framework 2023" />
              <Kpi label="USE OF PROCEEDS" value="Solar capex + O&M" sub="Eligible green category" color={T.sage} />
              <Kpi label="TYPICAL TENOR" value="5-10 yr" sub="Listed NSE/BSE" color={T.teal} />
              <Kpi label="COUPON SAVING" value="15-40 bps" sub="vs conventional bond" color={T.green} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 10 }}>ELIGIBLE GREEN CATEGORIES (SEBI)</div>
                {['Renewable energy (solar/wind/hydro)', 'Energy efficiency', 'Clean transportation', 'Sustainable water & wastewater', 'Climate change adaptation', 'Pollution prevention'].map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.sage }} />
                    <div style={{ fontSize: 11, color: T.text }}>{c}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 10 }}>REPORTING REQUIREMENTS</div>
                {[['Allocation Report', 'Annual · Independent verifier'], ['Impact Report', 'Annual · kWh generated · tCO₂ avoided'], ['Second Party Opinion (SPO)', 'CRISIL / CARE / ICRA ESG'], ['External Review', 'Pre-issuance + post-issuance'], ['SEBI Filing', '15 days post-issuance, and annual'], ['Carbon Registrations', 'Optional but investor value-add']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 11 }}>
                    <span style={{ color: T.textSec }}>{k}</span><span style={{ color: T.teal }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>PROJECT FINANCE CAPITAL STACK — INDIA SOLAR SPV</div>
            {PROJECT_FINANCE_WATERFALL.map((layer, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: T.gold, minWidth: 220 }}>{layer.layer}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ background: T.borderL, borderRadius: 4, height: 10 }}><div style={{ background: i === 0 ? T.teal : i === 1 ? T.sage : i === 2 ? T.amber : i === 3 ? '#a855f7' : T.gold, width: `${layer.share * 3}%`, height: 10, borderRadius: 4 }} /></div>
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 13, color: T.text, minWidth: 40 }}>{layer.share}%</div>
                <div style={{ fontSize: 11, color: T.textSec, minWidth: 140 }}>{layer.rate}</div>
                <div style={{ fontSize: 10, color: T.textMut }}>{layer.tenor}</div>
              </div>
            ))}
            <div style={{ background: T.navy, borderRadius: 8, padding: 14, marginTop: 14 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 8 }}>KEY FINANCIAL METRICS (ILLUSTRATIVE 200 MW PROJECT)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[['Total Capex', '₹850 Cr ($102M)', T.text], ['DSCR (Year 1)', '1.42×', T.green], ['Equity IRR', '14-16%', T.gold], ['Carbon Revenue', '₹3-5 Cr/yr uplift', T.sage]].map(([k, v, color]) => (
                  <div key={k}><div style={{ fontSize: 10, color: T.textMut }}>{k}</div><div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: T.mono, marginTop: 4 }}>{v}</div></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 7 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>JCM (Joint Crediting Mechanism) — India-Japan Solar Eligibility</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.teal, marginBottom: 10 }}>ELIGIBILITY CRITERIA</div>
                {[['Technology transfer', 'Japanese equipment / IP involved in project', T.green], ['Additionality', 'JCM additionality tool (barriers analysis)', T.green], ['No REC claim', 'RECs must not be claimed for same generation', T.amber], ['Host country approval', 'India MoEFCC authorization letter required', T.amber], ['Monitoring plan', 'CEA-based metering, biannual verification', T.green], ['Registration', 'JCM Joint Committee (Japan + India) approval', T.teal]].map(([label, desc, color]) => (
                  <div key={label} style={{ background: T.surfaceH, borderRadius: 4, padding: '8px 12px', marginBottom: 8 }}>
                    <div style={{ fontFamily: T.mono, fontSize: 11, color }}>{label}</div>
                    <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{desc}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.teal, marginBottom: 10 }}>JCM CREDIT FLOW (INDIA → JAPAN)</div>
                {[['1. Project Registration', 'JCM Joint Committee approves project (6-12 months)'], ['2. Credit Issuance', 'JCM Secretariat issues J-Credits based on MRV report'], ['3. Credit Split', 'India: ~30% (NDC use) · Japan: ~70% (GX-ETS/CORSIA)'], ['4. Corresponding Adjustment', 'India reduces NDC surplus by credits transferred (Art. 6.2)'], ['5. ITMO Price', '$14-22/tCO₂ — premium vs VCS due to bilateral nature'], ['6. GX-ETS Use', 'Japan companies use J-Credits for GX League compliance']].map(([step, desc]) => (
                  <div key={step} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <div style={{ fontFamily: T.mono, fontSize: 10, color: T.gold, minWidth: 130 }}>{step}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>JCM-ELIGIBLE IPPS & EST. ANNUAL CREDITS</div>
            {IPPS.filter(i => i.jcmEligible).map((i, idx) => {
              const annCreditsKt = (i.installedGw * 1000 * i.plf * 8760 * 0.82 * 0.97 / 1e6).toFixed(0);
              const jcmRevenue = (Number(annCreditsKt) * 0.7 * 18).toFixed(1);
              return (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div><div style={{ fontSize: 12, color: T.gold }}>{i.name}</div><div style={{ fontSize: 10, color: T.textMut }}>JCM eligible · {i.installedGw} GW</div></div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.sage, fontFamily: T.mono }}>{annCreditsKt} Kt CO₂/yr</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>JCM share (70%): ${jcmRevenue}M @ $18/t</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 8 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>INDIA CCTS — SOLAR SECTOR OFFSET ELIGIBILITY</div>
            <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14, marginBottom: 14 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.amber, marginBottom: 8 }}>STATUS (2025): Solar power is NOT in PAT/CCTS obligated sector — eligible as offset credit issuer</div>
              <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.7 }}>Under the CCTS Offset mechanism (design phase, expected 2026), solar developers in non-obligated sectors can issue offset credits (CCerts) to be purchased by obligated sectors (cement, steel, aluminium etc.) for compliance. This creates a new revenue stream for India solar IPPs separate from RECs.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[['Offset Credit Price Est.', '₹300-800/tCO₂', 'Equivalent to $3.6-9.6/t at ₹83/USD', T.gold], ['Additionality Requirement', 'Financial additionality test', 'Must demonstrate carbon revenue is needed for viability', T.amber], ['MRV Standard', 'CEA Grid EF (2024: 0.82 tCO₂/MWh)', 'Biannual verification by BEE-accredited body', T.teal], ['Double-Counting Guard', 'REC vs CCert choice', 'Cannot claim both REC + CCTS offset for same MWh', T.red], ['Vintage', 'Annual issuance post-verification', 'Offset credits valid for 3yr from issuance', T.sage], ['Market Demand', 'PAT sector obligated buyers', 'Steel/cement/aluminium — 500 Mt covered', T.green]].map(([label, val, note, color]) => (
                <div key={label} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{val}</div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 6 }}>{note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 9 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>EQUITY IRR SENSITIVITY — CARBON CREDIT PRICE UPLIFT</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={[5, 10, 15, 20, 25, 30, 40, 50].map(cp => ({ creditPrice: cp, irrBase: 14.2, irrWithCarbon: parseFloat((14.2 + cp * gwInput * 1000 * plfInput / 100 * 8760 * gridEfInput / 100 / 1000 * 0.97 / 1e6 * 0.8).toFixed(1)) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="creditPrice" stroke={T.textMut} tick={{ fontSize: 10 }} label={{ value: 'Carbon Credit Price ($/t)', position: 'insideBottom', offset: -5, fill: T.textMut, fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Line type="monotone" dataKey="irrBase" stroke={T.textSec} strokeWidth={1} strokeDasharray="4 4" name="Base IRR (no carbon)" /><Line type="monotone" dataKey="irrWithCarbon" stroke={T.gold} strokeWidth={2} name="IRR with Carbon Revenue (%)" /></LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[5, 15, 25, 40].map(cp => {
              const annRev = gwInput * 1000 * plfInput / 100 * 8760 * gridEfInput / 100 / 1000 * 0.97 * cp;
              const irrUplift = (annRev / 1e6 * 0.8).toFixed(1);
              return (
                <div key={cp} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 12, color: T.gold }}>${cp}/tCO₂</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: T.green, fontFamily: T.mono, marginTop: 6 }}>+{irrUplift}%</div>
                  <div style={{ fontSize: 10, color: T.textSec }}>IRR uplift</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Apr2026CarbonAnalytics moduleCode="EP-EA2" moduleTitle="Solar Developer Carbon Finance" flavor="developer" basePrice={14} T={T} />
    </div>
  );
}
