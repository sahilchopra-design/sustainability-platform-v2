import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#0f172a', card: '#1e293b', border: '#334155', muted: '#94a3b8',
  text: '#f1f5f9', sub: '#cbd5e1', accent: '#A78BFA',
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

const BONDS = Array.from({ length: 24 }, (_, i) => ({
  name: ['World Bank Cat Bond 2024', 'Jamaica CAT 2023', 'Mexico MultiCat 2023', 'Philippines PCRAFI 2023', 'IBRD Pandemic Cat 2024', 'NZ Earthquake 2023', 'USAA Flood Cat 2024', 'Swiss Re Wildfire Cat', 'CCRIF Parametric 2024', 'Barbados Resilience Bond', 'Fiji Sovereign Bond', 'Colombia Climate Bond', 'Kenya Resilience SLB', 'Morocco Adaptation Bond', 'Vietnam Climate Bond', 'Bangladesh Flood Bond', 'Peru Drought Bond', 'Chile Earthquake Cat', 'Turkey Earthquake Cat', 'Romania Flood Cat', 'Portugal Fire Cat', 'Italy Flood Cat', 'Indonesia Coastal Cat', 'India Cyclone Bond'][i],
  issuer: ['MDB', 'Sovereign', 'Sovereign', 'Sovereign', 'MDB', 'Corporate', 'Corporate', 'Corporate', 'Regional', 'Sovereign', 'Sovereign', 'Sovereign', 'Sovereign', 'Sovereign', 'Sovereign', 'Sovereign', 'Sovereign', 'Sovereign', 'Sovereign', 'Sovereign', 'Sovereign', 'Sovereign', 'Sovereign', 'Sovereign'][i],
  size: Math.round(sr(i * 7) * 450 + 50),
  coupon: +(sr(i * 11) * 6 + 3).toFixed(2),
  tenor: Math.round(sr(i * 5) * 5 + 2),
  peril: ['Flood', 'Hurricane', 'Earthquake', 'Drought', 'Wildfire', 'Multi-Peril'][Math.floor(sr(i * 13) * 6)],
  trigger: ['Parametric', 'Indemnity', 'Modelled Loss', 'Industry Index'][Math.floor(sr(i * 9) * 4)],
  rating: ['BB', 'BB+', 'BBB-', 'BBB', 'B+', 'B'][Math.floor(sr(i * 3) * 6)],
  couponStep: Math.round(sr(i * 17) * 100 + 25),
  kpiMet: Math.round(sr(i * 19) * 40 + 55),
}));

const ISSUANCE_TREND = [
  { year: '2018', catBond: 12.4, climateAdapt: 1.2, parametric: 2.8 },
  { year: '2019', catBond: 14.6, climateAdapt: 1.8, parametric: 3.4 },
  { year: '2020', catBond: 11.8, climateAdapt: 2.4, parametric: 4.1 },
  { year: '2021', catBond: 18.2, climateAdapt: 3.6, parametric: 5.8 },
  { year: '2022', catBond: 22.4, climateAdapt: 5.2, parametric: 8.2 },
  { year: '2023', catBond: 26.8, climateAdapt: 7.8, parametric: 11.4 },
  { year: '2024', catBond: 31.2, climateAdapt: 11.2, parametric: 15.8 },
];

const TRIGGER_COMPARISON = [
  { metric: 'Speed of Payout', parametric: 95, indemnity: 35, modelledLoss: 60, industryIndex: 72 },
  { metric: 'Basis Risk', parametric: 42, indemnity: 95, modelledLoss: 78, industryIndex: 68 },
  { metric: 'Moral Hazard Protection', parametric: 88, indemnity: 52, modelledLoss: 72, industryIndex: 80 },
  { metric: 'Transparency', parametric: 92, indemnity: 58, modelledLoss: 74, industryIndex: 84 },
  { metric: 'Sovereign Suitability', parametric: 86, indemnity: 42, modelledLoss: 64, industryIndex: 58 },
  { metric: 'Data Requirements', parametric: 70, indemnity: 88, modelledLoss: 92, industryIndex: 82 },
];

const COUPON_ANALYTICS = Array.from({ length: 20 }, (_, i) => ({
  bond: `Bond ${i + 1}`,
  baseSpread: Math.round(sr(i * 7) * 500 + 200),
  kpiAdjustment: Math.round((sr(i * 11) - 0.5) * 80),
  effectiveSpread: 0,
})).map(b => ({ ...b, effectiveSpread: b.baseSpread + b.kpiAdjustment }));

const INVESTOR_TYPES = [
  { type: 'ILS / Cat Bond Funds', allocationBn: 42, avgCoupon: 8.2, preference: 'Parametric / Indemnity' },
  { type: 'Pension Funds', allocationBn: 28, avgCoupon: 5.4, preference: 'Long tenor, rated' },
  { type: 'Sovereign Wealth Funds', allocationBn: 18, avgCoupon: 4.8, preference: 'Adaptation-focused' },
  { type: 'Impact Investors', allocationBn: 12, avgCoupon: 4.2, preference: 'SDG-linked, EM issuers' },
  { type: 'Insurance Companies', allocationBn: 38, avgCoupon: 6.8, preference: 'Diversified perils' },
  { type: 'Asset Managers', allocationBn: 22, avgCoupon: 5.1, preference: 'Investment grade' },
];

const TABS = ['Market Overview', 'Bond Universe', 'Trigger Mechanics', 'Coupon Analytics', 'Investor Base', 'Structuring Guide'];

export default function ResilienceBondAnalyticsPage() {
  const [tab, setTab] = useState(0);
  const [perilFilter, setPerilFilter] = useState('All');
  const [sortField, setSortField] = useState('size');

  const filteredBonds = perilFilter === 'All' ? BONDS : BONDS.filter(b => b.peril === perilFilter);
  const sortedBonds = useMemo(() => [...filteredBonds].sort((a, b) => b[sortField] - a[sortField]), [filteredBonds, sortField]);

  const totalIssuance = BONDS.reduce((a, b) => a + b.size, 0);
  const avgCoupon = BONDS.reduce((a, b) => a + b.coupon, 0) / BONDS.length;

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: 'Inter,sans-serif', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ background: T.accent + '22', border: `1px solid ${T.accent}`, borderRadius: 8, padding: '4px 12px', fontSize: 11, color: T.accent, fontWeight: 700 }}>EP-EK4</div>
          <Pill label="CAT Bonds" color={T.accent} />
          <Pill label="Resilience Finance" color={T.teal} />
          <Pill label="Parametric ILS" color={T.blue} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Resilience Bond Analytics</h1>
        <p style={{ color: T.muted, marginTop: 6, fontSize: 14 }}>Catastrophe bond market analytics, parametric trigger mechanics, KPI-linked coupon structures, investor base analysis, and structuring intelligence for climate resilience bonds.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Cat Bond Market 2024" value="$31Bn" sub="Outstanding issuance" color={T.accent} />
        <KpiCard label="Dataset Issuance" value={`$${totalIssuance.toLocaleString()}M`} sub="24 bonds tracked" color={T.blue} />
        <KpiCard label="Avg Coupon" value={`${avgCoupon.toFixed(2)}%`} sub="Spread over risk-free" color={T.green} />
        <KpiCard label="Adaptation Bond CAGR" value="+42%" sub="2022–2024" color={T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ background: tab === i ? T.accent : T.card, color: tab === i ? '#fff' : T.sub, border: `1px solid ${tab === i ? T.accent : T.border}`, borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>ILS / Cat Bond Issuance Trend ($Bn)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ISSUANCE_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" stroke={T.muted} tick={{ fontSize: 11 }} />
                  <YAxis stroke={T.muted} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="catBond" name="Cat Bonds" fill={T.accent} stackId="a" />
                  <Bar dataKey="climateAdapt" name="Climate Adaptation" fill={T.teal} stackId="a" />
                  <Bar dataKey="parametric" name="Parametric" fill={T.blue} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Investor Allocation by Type ($Bn)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={INVESTOR_TYPES} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.muted} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="type" type="category" stroke={T.muted} tick={{ fontSize: 9 }} width={110} />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Bar dataKey="allocationBn" name="Allocation ($Bn)" fill={T.purple} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {['All', 'Flood', 'Hurricane', 'Earthquake', 'Drought', 'Wildfire', 'Multi-Peril'].map(p => (
              <button key={p} onClick={() => setPerilFilter(p)} style={{ background: perilFilter === p ? T.accent : T.card, color: perilFilter === p ? '#fff' : T.sub, border: `1px solid ${perilFilter === p ? T.accent : T.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{p}</button>
            ))}
            <div style={{ display: 'flex', gap: 6 }}>
              {[['size', 'Size'], ['coupon', 'Coupon'], ['tenor', 'Tenor']].map(([f, l]) => (
                <button key={f} onClick={() => setSortField(f)} style={{ background: sortField === f ? T.teal : T.card, color: sortField === f ? '#fff' : T.sub, border: `1px solid ${sortField === f ? T.teal : T.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Bond', 'Issuer Type', 'Size ($M)', 'Coupon %', 'Tenor (yr)', 'Peril', 'Trigger', 'Rating', 'KPI Step (bps)', 'KPI Met %'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedBonds.map((b, i) => (
                    <tr key={b.name} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 === 0 ? T.bg + '55' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 11 }}>{b.name}</td>
                      <td style={{ padding: '10px 12px' }}><Pill label={b.issuer} color={T.indigo} /></td>
                      <td style={{ padding: '10px 12px', color: T.amber, fontWeight: 700 }}>${b.size}M</td>
                      <td style={{ padding: '10px 12px', color: T.green }}>{b.coupon}%</td>
                      <td style={{ padding: '10px 12px' }}>{b.tenor}yr</td>
                      <td style={{ padding: '10px 12px' }}><Pill label={b.peril} color={T.accent} /></td>
                      <td style={{ padding: '10px 12px' }}><Pill label={b.trigger} color={T.teal} /></td>
                      <td style={{ padding: '10px 12px', color: b.rating.startsWith('BB') ? T.amber : T.green }}>{b.rating}</td>
                      <td style={{ padding: '10px 12px' }}>{b.couponStep}bps</td>
                      <td style={{ padding: '10px 12px', color: b.kpiMet > 75 ? T.green : T.amber }}>{b.kpiMet}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Trigger Type Comparison</h3>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={TRIGGER_COMPARISON}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="metric" tick={{ fill: T.muted, fontSize: 11 }} />
              <Radar name="Parametric" dataKey="parametric" stroke={T.accent} fill={T.accent + '33'} />
              <Radar name="Indemnity" dataKey="indemnity" stroke={T.amber} fill={T.amber + '22'} />
              <Radar name="Modelled Loss" dataKey="modelledLoss" stroke={T.blue} fill={T.blue + '22'} />
              <Radar name="Industry Index" dataKey="industryIndex" stroke={T.green} fill={T.green + '22'} />
              <Legend />
              <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>KPI-Adjusted Coupon Spread (bps)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={COUPON_ANALYTICS}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="bond" stroke={T.muted} tick={{ fontSize: 9 }} />
              <YAxis stroke={T.muted} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="baseSpread" name="Base Spread (bps)" fill={T.blue} />
              <Bar dataKey="kpiAdjustment" name="KPI Adjustment (bps)" fill={T.accent} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Investor Landscape</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Investor Type', 'Allocated ($Bn)', 'Avg Coupon Target', 'Preferences'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INVESTOR_TYPES.map((inv, i) => (
                  <tr key={inv.type} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 === 0 ? T.bg + '55' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{inv.type}</td>
                    <td style={{ padding: '10px 14px', color: T.amber, fontWeight: 700 }}>${inv.allocationBn}Bn</td>
                    <td style={{ padding: '10px 14px', color: T.green }}>{inv.avgCoupon}%</td>
                    <td style={{ padding: '10px 14px', color: T.sub, fontSize: 12 }}>{inv.preference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            { title: 'Cat Bond Structuring Steps', items: ['1. Peril identification and hazard modelling (RMS, AIR, Verisk)', '2. Trigger design: parametric (e.g., Mw >7.0) vs. modelled loss', '3. SPV establishment in Cayman / Bermuda / Ireland', '4. Investor roadshow: ILS funds, pension funds, sovereign', '5. Rating agency engagement (S&P, Fitch, AM Best)', '6. Reinsurance collateral: Treasury MMF + interest rate swap', '7. Trustee appointment and loss reporting protocol', '8. Annual reset / coupon adjustment mechanism'] },
            { title: 'Climate Adaptation Bond Features', items: ['Use-of-proceeds: flood defense, heat adaptation, early warning, NbS', 'KPI-linked coupon: step-up/down based on infrastructure BCR, heat days avoided', 'GDP-linked payout: sovereign bonds with principal tied to disaster GDP loss', 'Outcome bond: payout upon verified reduction in AAL vs. baseline', 'Multi-hazard portfolio: aggregate exceedance probability (AEP) trigger', 'Ring-fenced reserve fund: pre-funded adaptation CapEx account', 'Managed retreat bond: coupon proceeds fund relocation of at-risk communities'] },
            { title: 'Key Standards & Frameworks', items: ['ICMA Green Bond Principles — Adaptation and Resilience workstream', 'CBI Climate Bonds Standard — Adaptation Finance Criteria (2024)', 'World Bank Resiliency Bond Framework — sovereign adaptation issuance', 'AIIB Climate Finance Framework — infrastructure resilience criteria', 'UN Sendai Framework — DRR targets informing parametric triggers', 'GCF Accredited Entity Standards — adaptation result measurement'] },
            { title: 'Secondary Market & Risk Metrics', items: ['ILS secondary market: Artemis / GC Securities / Lane Financial platform', 'Expected Loss (EL): probability × severity of principal loss at maturity', 'Attachment probability vs. exhaustion probability — tranche structure', 'Duration: typically 3yr with annual reset; some 5yr climate bonds', 'Diversification benefit: low correlation with financial market beta', 'Mark-to-model: no liquid secondary market for sub-$50M tranches'] },
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
