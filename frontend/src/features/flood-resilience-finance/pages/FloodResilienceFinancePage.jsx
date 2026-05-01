import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#0f172a', card: '#1e293b', border: '#334155', muted: '#94a3b8',
  text: '#f1f5f9', sub: '#cbd5e1', accent: '#3B82F6',
  green: '#16A34A', amber: '#D97706', red: '#DC2626', indigo: '#6366F1',
  teal: '#0D9488', blue: '#2563EB', purple: '#7C3AED',
};

const KpiCard = ({ label, value, sub, color = T.accent }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px' }}>
    <div style={{ color: T.muted, fontSize: 12, marginBottom: 6 }}>{label}</div>
    <div style={{ color, fontSize: 26, fontWeight: 700 }}>{value}</div>
    {sub && <div style={{ color: T.sub, fontSize: 11, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Pill = ({ label, color = T.accent }) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}55`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{label}</span>
);

const FLOOD_RISKS = [
  { city: 'Jakarta', country: 'Indonesia', population: 10.56, floodExposure: 92, annualLoss: 4.8, adaptCost: 12.4, bcr: 4.2, seaLevelRise: 0.48, subsidence: 2.5, category: 'Coastal + Riverine' },
  { city: 'Mumbai', country: 'India', population: 20.4, floodExposure: 78, annualLoss: 3.2, adaptCost: 8.9, bcr: 5.1, seaLevelRise: 0.38, subsidence: 0.8, category: 'Coastal + Pluvial' },
  { city: 'Dhaka', country: 'Bangladesh', population: 21.8, floodExposure: 88, annualLoss: 2.8, adaptCost: 7.2, bcr: 6.4, seaLevelRise: 0.45, subsidence: 1.2, category: 'Riverine' },
  { city: 'Bangkok', country: 'Thailand', population: 10.5, floodExposure: 72, annualLoss: 2.1, adaptCost: 6.8, bcr: 3.8, seaLevelRise: 0.35, subsidence: 3.2, category: 'Coastal + Riverine' },
  { city: 'Rotterdam', country: 'Netherlands', population: 0.65, floodExposure: 55, annualLoss: 1.4, adaptCost: 4.2, bcr: 8.2, seaLevelRise: 0.52, subsidence: 0.4, category: 'Coastal + Riverine' },
  { city: 'New York', country: 'USA', population: 8.3, floodExposure: 48, annualLoss: 6.8, adaptCost: 18.6, bcr: 5.6, seaLevelRise: 0.44, subsidence: 0.3, category: 'Coastal' },
  { city: 'Shanghai', country: 'China', population: 26.3, floodExposure: 65, annualLoss: 8.4, adaptCost: 22.1, bcr: 4.9, seaLevelRise: 0.41, subsidence: 1.8, category: 'Coastal + Riverine' },
  { city: 'Houston', country: 'USA', population: 2.3, floodExposure: 62, annualLoss: 5.2, adaptCost: 11.4, bcr: 3.2, seaLevelRise: 0.36, subsidence: 0.9, category: 'Pluvial + Riverine' },
  { city: 'Osaka', country: 'Japan', population: 2.7, floodExposure: 58, annualLoss: 3.8, adaptCost: 9.6, bcr: 4.4, seaLevelRise: 0.42, subsidence: 0.5, category: 'Coastal' },
  { city: 'Miami', country: 'USA', population: 0.45, floodExposure: 71, annualLoss: 4.1, adaptCost: 10.8, bcr: 3.6, seaLevelRise: 0.62, subsidence: 0.1, category: 'Coastal' },
];

const INTERVENTIONS = [
  { type: 'Coastal Flood Barriers', capexM: 850, annualMaint: 12, lifeYears: 75, protection100yr: true, nbsElement: false, greenPremium: false, exampleBCR: 6.2 },
  { type: 'Urban Green Infrastructure', capexM: 120, annualMaint: 4, lifeYears: 40, protection100yr: false, nbsElement: true, greenPremium: true, exampleBCR: 4.8 },
  { type: 'Managed Retreat Schemes', capexM: 280, annualMaint: 2, lifeYears: 50, protection100yr: true, nbsElement: false, greenPremium: false, exampleBCR: 8.4 },
  { type: 'Levees & Embankments', capexM: 450, annualMaint: 8, lifeYears: 60, protection100yr: true, nbsElement: false, greenPremium: false, exampleBCR: 5.1 },
  { type: 'Wetland Restoration (NbS)', capexM: 65, annualMaint: 1.5, lifeYears: 50, protection100yr: false, nbsElement: true, greenPremium: true, exampleBCR: 7.6 },
  { type: 'Early Warning Systems', capexM: 18, annualMaint: 0.8, lifeYears: 15, protection100yr: false, nbsElement: false, greenPremium: false, exampleBCR: 12.8 },
  { type: 'Storm Water Retention', capexM: 95, annualMaint: 2.2, lifeYears: 40, protection100yr: false, nbsElement: true, greenPremium: true, exampleBCR: 5.9 },
  { type: 'Flood Insurance Pools', capexM: 40, annualMaint: 1.2, lifeYears: 10, protection100yr: false, nbsElement: false, greenPremium: false, exampleBCR: 3.4 },
];

const LOSS_SCENARIOS = [
  { scenario: '1-in-20yr Flood', rcp26: 8.2, rcp45: 11.4, rcp85: 16.8 },
  { scenario: '1-in-50yr Flood', rcp26: 18.6, rcp45: 26.4, rcp85: 42.1 },
  { scenario: '1-in-100yr Flood', rcp26: 34.2, rcp45: 54.8, rcp85: 88.4 },
  { scenario: '1-in-200yr Flood', rcp26: 58.4, rcp45: 96.2, rcp85: 162.8 },
  { scenario: '1-in-500yr Flood', rcp26: 94.6, rcp45: 168.4, rcp85: 298.2 },
];

const AAL_TREND = Array.from({ length: 10 }, (_, i) => ({
  year: 2025 + i,
  baseline: +(85 + i * 2.8 + sr(i * 11) * 8).toFixed(1),
  rcp45: +(85 + i * 4.2 + sr(i * 7) * 8).toFixed(1),
  rcp85: +(85 + i * 7.4 + sr(i * 13) * 8).toFixed(1),
}));

const FINANCE_DATA = [
  { source: 'MDB/DFI Grants', amount: 28, desc: 'World Bank, ADB, AFDB adaptation grants' },
  { source: 'Green Bonds', amount: 42, desc: 'Infrastructure-grade flood defense bonds' },
  { source: 'CAT Bonds', desc: 'Parametric flood risk transfer', amount: 18 },
  { source: 'Parametric Insurance', amount: 14, desc: 'Trigger-based flood payout' },
  { source: 'Govt Budget', amount: 38, desc: 'National adaptation finance' },
  { source: 'Private Equity', amount: 8, desc: 'Resilience infrastructure funds' },
];

const TABS = ['Risk Landscape', 'City Exposure', 'Intervention Economics', 'Loss Modelling', 'Finance Structures', 'Investment Intelligence'];

export default function FloodResilienceFinancePage() {
  const [tab, setTab] = useState(0);
  const [sortField, setSortField] = useState('annualLoss');
  const [capexBudget, setCapexBudget] = useState(200);
  const [bcrThreshold, setBcrThreshold] = useState(4);

  const sortedCities = useMemo(() => [...FLOOD_RISKS].sort((a, b) => b[sortField] - a[sortField]), [sortField]);
  const eligibleInterventions = INTERVENTIONS.filter(i => i.capexM <= capexBudget && i.exampleBCR >= bcrThreshold);

  const totalAnnualLoss = FLOOD_RISKS.reduce((a, b) => a + b.annualLoss, 0);
  const avgBCR = INTERVENTIONS.reduce((a, b) => a + b.exampleBCR, 0) / INTERVENTIONS.length;

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: 'Inter,sans-serif', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ background: T.accent + '22', border: `1px solid ${T.accent}`, borderRadius: 8, padding: '4px 12px', fontSize: 11, color: T.accent, fontWeight: 700 }}>EP-EK1</div>
          <Pill label="Flood Resilience" color={T.accent} />
          <Pill label="Climate Adaptation" color={T.teal} />
          <Pill label="Infrastructure Finance" color={T.green} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Flood Resilience Finance</h1>
        <p style={{ color: T.muted, marginTop: 6, fontSize: 14 }}>Urban flood risk exposure analytics, adaptation intervention economics, benefit-cost analysis, climate scenario loss modelling, and blended finance structuring for flood resilience infrastructure.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Global Flood Annual Loss" value="$280Bn" sub="Average 2024 estimate" color={T.accent} />
        <KpiCard label="Dataset City AAL" value={`$${totalAnnualLoss.toFixed(1)}Bn`} sub="Top 10 flood-risk cities" color={T.red} />
        <KpiCard label="Avg Intervention BCR" value={`${avgBCR.toFixed(1)}x`} sub="Benefit-cost ratio" color={T.green} />
        <KpiCard label="Adaptation Finance Gap" value="$194Bn/yr" sub="UNEP 2023 Adaptation Gap" color={T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ background: tab === i ? T.accent : T.card, color: tab === i ? '#fff' : T.sub, border: `1px solid ${tab === i ? T.accent : T.border}`, borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Annual Average Loss (AAL) Trend under Climate Scenarios ($Bn)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={AAL_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" stroke={T.muted} tick={{ fontSize: 11 }} />
                  <YAxis stroke={T.muted} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Legend />
                  <Area type="monotone" dataKey="baseline" name="Current Policy" stroke={T.accent} fill={T.accent + '22'} />
                  <Area type="monotone" dataKey="rcp45" name="RCP 4.5" stroke={T.amber} fill={T.amber + '22'} />
                  <Area type="monotone" dataKey="rcp85" name="RCP 8.5" stroke={T.red} fill={T.red + '22'} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Adaptation Finance Sources ($Bn)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={FINANCE_DATA} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.muted} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="source" type="category" stroke={T.muted} tick={{ fontSize: 10 }} width={110} />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Bar dataKey="amount" name="Amount ($Bn)" fill={T.accent} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[['annualLoss', 'Annual Loss'], ['floodExposure', 'Flood Exposure'], ['bcr', 'BCR'], ['adaptCost', 'Adapt Cost']].map(([f, l]) => (
              <button key={f} onClick={() => setSortField(f)} style={{ background: sortField === f ? T.accent : T.card, color: sortField === f ? '#fff' : T.sub, border: `1px solid ${sortField === f ? T.accent : T.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['City', 'Country', 'Pop (M)', 'Flood Exposure', 'Annual Loss ($Bn)', 'Adapt Cost ($Bn)', 'BCR', 'SLR (m)', 'Subsidence', 'Type'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedCities.map((c, i) => (
                    <tr key={c.city} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 === 0 ? T.bg + '55' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{c.city}</td>
                      <td style={{ padding: '10px 12px' }}>{c.country}</td>
                      <td style={{ padding: '10px 12px' }}>{c.population}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 50, height: 6, background: T.border, borderRadius: 3 }}>
                            <div style={{ width: `${c.floodExposure}%`, height: '100%', background: c.floodExposure > 75 ? T.red : c.floodExposure > 55 ? T.amber : T.green, borderRadius: 3 }} />
                          </div>
                          <span>{c.floodExposure}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', color: T.red, fontWeight: 700 }}>${c.annualLoss}Bn</td>
                      <td style={{ padding: '10px 12px', color: T.amber }}>${c.adaptCost}Bn</td>
                      <td style={{ padding: '10px 12px', color: T.green, fontWeight: 700 }}>{c.bcr}x</td>
                      <td style={{ padding: '10px 12px' }}>{c.seaLevelRise}m</td>
                      <td style={{ padding: '10px 12px', color: c.subsidence > 1.5 ? T.red : T.sub }}>{c.subsidence}cm/yr</td>
                      <td style={{ padding: '10px 12px' }}><Pill label={c.category} color={T.indigo} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Intervention Screener</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
              <div>
                <label style={{ color: T.muted, fontSize: 12 }}>Max CapEx Budget ($M): {capexBudget}</label>
                <input type="range" min={20} max={1000} value={capexBudget} onChange={e => setCapexBudget(+e.target.value)} style={{ width: '100%', marginTop: 8 }} />
              </div>
              <div>
                <label style={{ color: T.muted, fontSize: 12 }}>Min BCR Threshold: {bcrThreshold}x</label>
                <input type="range" min={2} max={12} step={0.5} value={bcrThreshold} onChange={e => setBcrThreshold(+e.target.value)} style={{ width: '100%', marginTop: 8 }} />
              </div>
            </div>
            <div style={{ color: T.muted, fontSize: 12, marginBottom: 12 }}>
              Eligible interventions: <span style={{ color: T.green, fontWeight: 700 }}>{eligibleInterventions.length}</span> of {INTERVENTIONS.length}
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Intervention', 'CapEx ($M)', 'Annual O&M', 'Asset Life', '100yr Protection', 'NbS Component', 'Example BCR', 'Green Finance'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INTERVENTIONS.map((int, i) => {
                    const eligible = int.capexM <= capexBudget && int.exampleBCR >= bcrThreshold;
                    return (
                      <tr key={int.type} style={{ borderBottom: `1px solid ${T.border}22`, background: eligible ? T.green + '11' : i % 2 === 0 ? T.bg + '55' : 'transparent', opacity: eligible ? 1 : 0.6 }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{int.type}</td>
                        <td style={{ padding: '10px 12px', color: int.capexM <= capexBudget ? T.green : T.red }}>${int.capexM}M</td>
                        <td style={{ padding: '10px 12px' }}>${int.annualMaint}M</td>
                        <td style={{ padding: '10px 12px' }}>{int.lifeYears}yr</td>
                        <td style={{ padding: '10px 12px' }}><Pill label={int.protection100yr ? 'Yes' : 'No'} color={int.protection100yr ? T.green : T.amber} /></td>
                        <td style={{ padding: '10px 12px' }}><Pill label={int.nbsElement ? 'NbS' : 'Grey'} color={int.nbsElement ? T.teal : T.indigo} /></td>
                        <td style={{ padding: '10px 12px', color: int.exampleBCR >= bcrThreshold ? T.green : T.amber, fontWeight: 700 }}>{int.exampleBCR}x</td>
                        <td style={{ padding: '10px 12px' }}><Pill label={int.greenPremium ? 'Eligible' : 'Standard'} color={int.greenPremium ? T.green : T.muted} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Return Period Loss Estimates by Climate Scenario ($Bn)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={LOSS_SCENARIOS}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="scenario" stroke={T.muted} tick={{ fontSize: 10 }} />
              <YAxis stroke={T.muted} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="rcp26" name="RCP 2.6" fill={T.green} radius={[4, 4, 0, 0]} />
              <Bar dataKey="rcp45" name="RCP 4.5" fill={T.amber} radius={[4, 4, 0, 0]} />
              <Bar dataKey="rcp85" name="RCP 8.5" fill={T.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {[
            { title: 'Green Bond Structures for Flood Defense', items: ['ICMA Climate Bonds Initiative — Adaptation Finance Criteria (2024)', 'World Bank Resilience Bond — GDP-linked coupon tied to flood protection KPIs', 'Green Sukuk for coastal adaptation (Malaysia, Indonesia)', 'Municipal resilience bonds — US BVAL muni market, $18Bn/yr', 'EU Taxonomy Article 7.1 — flood defense CapEx eligible (CE compliant)', 'EIB Climate Awareness Bond — adaptation use-of-proceeds tranche'] },
            { title: 'Parametric / Catastrophe Finance', items: ['Caribbean Catastrophe Risk Insurance Facility (CCRIF) — parametric payout', 'African Risk Capacity (ARC) — index-based flood insurance for sovereigns', 'World Bank Catastrophe Deferred Drawdown Option (Cat DDO)', 'Swiss Re flood ILS (Insurance Linked Securities) — cat bond transfer', 'FEMA Risk Rating 2.0 — US property-level flood risk repricing (2021+)', 'Southeast Asia Disaster Risk Insurance (SEADRIF) — regional pool'] },
            { title: 'MDB & Blended Finance', items: ['World Bank GFDRR — $630M resilience grants pipeline 2024', 'ADB Climate Change Fund — adaptation projects in Pacific/South Asia', 'AIIB Climate Finance — urban flood resilience in China and India', 'EBRD SEMED — coastal resilience in North Africa and Turkey', 'GCF Readiness — Tier B adaptation grants for EM governments', 'UK FCDO AFRL — adaptation finance results-based grants'] },
            { title: 'Risk Pricing & Insurance Innovation', items: ['Flood risk surcharge in mortgage pricing (FEMA RR2.0 + UK FloodRe)', 'UK FloodRe reinsurance pool: covers £500K properties, sunset 2039', 'Mandatory flood disclosure at point-of-sale (US FEMA mapping + EU DAFI)', 'Parametric equity-linked notes (ELN) — payout on flood index breach', 'Climate adaptation PPP structures: concession fee linked to protection level', 'Community Resilience Bonds — retail investor co-funding of local flood schemes'] },
          ].map(s => (
            <div key={s.title} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.accent }}>{s.title}</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {s.items.map(it => <li key={it} style={{ color: T.sub, fontSize: 12, marginBottom: 6 }}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            { title: 'Investment Themes', items: ['Nature-based flood defense (wetlands, mangroves) — 7.6x BCR vs 6.2x grey infrastructure', 'Early Warning Systems — highest BCR (12.8x) at lowest cost ($18M)', 'Flood insurance technology — digital risk scoring, parametric products', 'Managed retreat financing — long-term liability reduction in highest-risk zones', 'Green stormwater infrastructure — urban retrofits for pluvial flood reduction', 'Resilience as infrastructure asset class — long-duration pension capital alignment'] },
            { title: 'Key Risk Factors', items: ['Physical risk underestimation: current flood maps lag climate change projections by 20–30yr', 'Moral hazard in flood insurance: public backstops distort risk pricing signals', 'Compound risk: flood + heat + drought simultaneously under RCP 8.5', 'Subsidence amplification: Jakarta, Bangkok — land sinking faster than SLR', 'Political economy of managed retreat: displacement and social equity risk', 'Stranded assets: EU and US properties repriced below mortgage balance at flood risk'] },
          ].map(s => (
            <div key={s.title} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.accent }}>{s.title}</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {s.items.map(it => <li key={it} style={{ color: T.sub, fontSize: 12, marginBottom: 6 }}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
