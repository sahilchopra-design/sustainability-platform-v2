import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', sage: '#5a8a6a', text: '#1b3a5c',
  textSec: '#5c6b7e', textMut: '#9aa3ae', red: '#dc2626', green: '#16a34a',
  amber: '#d97706', blue: '#2563eb', orange: '#ea580c', purple: '#7c3aed',
  teal: '#0891b2',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

// ─── POLICY INSTRUMENTS ───────────────────────────────────────────────────────
const POLICIES = [
  {
    id: 'eu_ets', name: 'EU Emissions Trading System (ETS)', type: 'Carbon Market', jurisdiction: 'EU',
    icon: '🇪🇺', color: T.blue, status: 'Active', effective: '2005',
    sectors: ['Power', 'Industry', 'Aviation', 'Shipping (2024)'],
    price_floor: 20, price_ceiling: null, current_price: 65,
    allowance_traj: [
      { year: 2024, allowances: 1350, price: 65 }, { year: 2025, allowances: 1180, price: 72 },
      { year: 2026, allowances: 1020, price: 80 }, { year: 2027, allowances: 870, price: 90 },
      { year: 2028, allowances: 720, price: 102 }, { year: 2030, allowances: 450, price: 130 },
    ],
    revenue_impact_bn: -18.4, cost_impact_bn: 24.8, stranded_trigger: true,
    desc: 'Cap-and-trade covering ~40% EU emissions. Linear Reduction Factor raised to 4.3%/yr from 2024. Free allowances phased out 2026–2034.',
  },
  {
    id: 'cbam', name: 'Carbon Border Adjustment Mechanism', type: 'Trade Policy', jurisdiction: 'EU',
    icon: '🚢', color: T.teal, status: 'Transitional', effective: '2023-10',
    sectors: ['Steel', 'Cement', 'Aluminum', 'Fertilizers', 'Electricity', 'Hydrogen'],
    price_floor: null, price_ceiling: null, current_price: 65,
    allowance_traj: [
      { year: 2024, allowances: 0, price: 65, cbam_liability_bn: 0.8 },
      { year: 2026, allowances: 0, price: 80, cbam_liability_bn: 4.2 },
      { year: 2030, allowances: 0, price: 130, cbam_liability_bn: 18.6 },
      { year: 2034, allowances: 0, price: 220, cbam_liability_bn: 34.2 },
    ],
    revenue_impact_bn: -4.8, cost_impact_bn: 12.4, stranded_trigger: false,
    desc: 'Full implementation from 2026. Closes carbon leakage risk. ~700 Mt/yr imports covered. CBAM certificate price = EU ETS carbon price.',
  },
  {
    id: 'mees', name: 'UK MEES / EPC Mandates', type: 'Building Standard', jurisdiction: 'UK',
    icon: '🏠', color: T.purple, status: 'Active', effective: '2018',
    sectors: ['Real Estate', 'Commercial RE', 'Residential'],
    price_floor: null, price_ceiling: null, current_price: null,
    allowance_traj: [
      { year: 2024, standard: 'E', penalty_max: 150000 },
      { year: 2027, standard: 'D', penalty_max: 200000 },
      { year: 2030, standard: 'C (Domestic)', penalty_max: 250000 },
      { year: 2035, standard: 'B (Commercial)', penalty_max: 300000 },
    ],
    revenue_impact_bn: -2.2, cost_impact_bn: 8.9, stranded_trigger: true,
    desc: 'Min Energy Efficiency Standards. EPC F/G properties cannot be let. EPC C required for domestic rentals by 2030, B for commercial by 2035. ~3.9M UK homes at risk.',
  },
  {
    id: 'ira', name: 'US Inflation Reduction Act (IRA)', type: 'Subsidy/Tax Credit', jurisdiction: 'USA',
    icon: '🇺🇸', color: T.red, status: 'Active', effective: '2022-08',
    sectors: ['Solar', 'Wind', 'EVs', 'Battery', 'Clean H₂', 'Carbon Capture'],
    price_floor: null, price_ceiling: null, current_price: null,
    allowance_traj: [
      { year: 2024, total_credits_bn: 48, ptc_solar: 0.0275, ptc_wind: 0.0265, ev_credit: 7500 },
      { year: 2025, total_credits_bn: 58, ptc_solar: 0.0275, ptc_wind: 0.0265, ev_credit: 7500 },
      { year: 2030, total_credits_bn: 74, ptc_solar: 0.0275, ptc_wind: 0.0265, ev_credit: 7500 },
    ],
    revenue_impact_bn: 48.0, cost_impact_bn: -8.2, stranded_trigger: false,
    desc: '$369B in clean energy tax credits 2022–2032. PTC/ITC for solar/wind. $7,500 EV credit. $3/kg clean hydrogen credit. ~$0.85/t carbon capture. Massive green capex accelerator.',
  },
  {
    id: 'eu_taxonomy', name: 'EU Taxonomy for Sustainable Finance', type: 'Disclosure/Label', jurisdiction: 'EU',
    icon: '📗', color: T.green, status: 'Active', effective: '2020',
    sectors: ['Finance', 'All EU SFDR/CSRD entities'],
    price_floor: null, price_ceiling: null, current_price: null,
    allowance_traj: [
      { year: 2024, aligned_pct_eu_investment: 12, eligible_pct: 44 },
      { year: 2026, aligned_pct_eu_investment: 20, eligible_pct: 52 },
      { year: 2030, aligned_pct_eu_investment: 35, eligible_pct: 65 },
    ],
    revenue_impact_bn: 15.2, cost_impact_bn: 3.8, stranded_trigger: false,
    desc: '6 Environmental Objectives. DNSH criteria. 80 activities covered. Linked to SFDR Art.9, CSRD disclosure. Drives green bond issuance and CAPEX labelling.',
  },
  {
    id: 'corsia', name: 'ICAO CORSIA (Aviation Carbon)', type: 'Carbon Market', jurisdiction: 'Global',
    icon: '✈️', color: T.orange, status: 'Pilot', effective: '2021',
    sectors: ['International Aviation'],
    price_floor: null, price_ceiling: null, current_price: 18,
    allowance_traj: [
      { year: 2024, phase: 'Pilot', covered_pct: 40, offset_needed_mn_t: 48 },
      { year: 2027, phase: 'First', covered_pct: 60, offset_needed_mn_t: 120 },
      { year: 2030, phase: 'Second', covered_pct: 85, offset_needed_mn_t: 280 },
    ],
    revenue_impact_bn: -1.8, cost_impact_bn: 4.2, stranded_trigger: false,
    desc: 'Carbon Offsetting and Reduction Scheme for Int\'l Aviation. Pilots 2021–2026, mandatory phase 2027+. ~65% of int\'l aviation CO₂ covered by 2030. SAF credit mechanism included.',
  },
];

const TABS = ['Policy Landscape', 'EU ETS Deep-Dive', 'CBAM Impact', 'IRA Green Acceleration', 'Building Standards', 'Portfolio Exposure'];

export default function PolicyRegulatoryImpactPage() {
  const [tab, setTab] = useState(0);
  const [selectedPolicy, setSelectedPolicy] = useState('eu_ets');

  const policy = POLICIES.find(p => p.id === selectedPolicy);
  const totalRevImpact = POLICIES.reduce((s, p) => s + p.revenue_impact_bn, 0);
  const totalCostImpact = POLICIES.reduce((s, p) => s + p.cost_impact_bn, 0);
  const strandedCount = POLICIES.filter(p => p.stranded_trigger).length;

  const ETS_PRICE_DATA = [
    { year: 2019, price: 22 }, { year: 2020, price: 18 }, { year: 2021, price: 38 },
    { year: 2022, price: 78 }, { year: 2023, price: 85 }, { year: 2024, price: 65 },
    { year: 2025, price: 72 }, { year: 2026, price: 80 }, { year: 2027, price: 90 },
    { year: 2028, price: 102 }, { year: 2029, price: 116 }, { year: 2030, price: 130 },
  ];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CB3 · POLICY & REGULATORY IMPACT</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Policy & Regulatory Transition Impact Engine</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              EU ETS · CBAM · MEES/EPC · IRA · EU Taxonomy · CORSIA · 6 Instruments · Portfolio Exposure
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Revenue Impact', val: `${totalRevImpact > 0 ? '+' : ''}$${totalRevImpact.toFixed(1)}B`, col: totalRevImpact > 0 ? T.green : T.red },
              { label: 'Cost Impact', val: `+$${totalCostImpact.toFixed(1)}B`, col: T.orange },
              { label: 'Stranded Triggers', val: `${strandedCount}/6`, col: T.amber },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                <div style={{ color: m.col, fontSize: 20, fontWeight: 700, fontFamily: T.mono }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 12,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>

        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {POLICIES.map(p => (
                <div key={p.id} onClick={() => { setSelectedPolicy(p.id); setTab(1); }} style={{
                  background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`,
                  padding: 20, cursor: 'pointer', transition: 'border-color 0.2s'
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 28 }}>{p.icon}</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: 1 }}>{p.type}</div>
                      <div style={{ fontWeight: 700, color: T.navy, fontSize: 13 }}>{p.name}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12, lineHeight: 1.5 }}>
                    {p.desc.substring(0, 120)}...
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {p.sectors.slice(0, 3).map(s => (
                      <span key={s} style={{ background: p.color + '18', color: p.color, padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600 }}>{s}</span>
                    ))}
                    {p.sectors.length > 3 && <span style={{ color: T.textMut, fontSize: 11 }}>+{p.sectors.length - 3} more</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: p.revenue_impact_bn > 0 ? T.green : T.red, fontFamily: T.mono, fontWeight: 700 }}>
                      Rev: {p.revenue_impact_bn > 0 ? '+' : ''}${p.revenue_impact_bn}B
                    </span>
                    <span style={{ fontSize: 12, color: T.orange, fontFamily: T.mono, fontWeight: 700 }}>
                      Cost: +${p.cost_impact_bn}B
                    </span>
                    <span style={{ background: p.stranded_trigger ? T.red + '22' : T.green + '22', color: p.stranded_trigger ? T.red : T.green, padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>
                      {p.stranded_trigger ? '⚠ STRAND' : '✓ No Strand'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>EU ETS Carbon Price — Historical & Forecast (2019–2030)</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>
                LRF raised to 4.3%/yr from 2024. MSR (Market Stability Reserve) adjusting supply. Cap at 1,350 Mt in 2024 declining to 450 Mt by 2030.
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ETS_PRICE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `€${v}`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`€${v}/tCO₂e`]} />
                  <ReferenceLine x={2024} stroke={T.gold} strokeDasharray="4 4" label={{ value: 'Forecast →', fill: T.gold, fontSize: 11 }} />
                  <Line dataKey="price" stroke={T.blue} strokeWidth={2.5} dot={{ r: 4, fill: T.blue }} name="ETS Price (€/t)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h4 style={{ color: T.navy, margin: '0 0 12px', fontSize: 14 }}>ETS Allowance Cap — Declining Schedule</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={POLICIES[0].allowance_traj}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => `${v}Mt`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v, n) => [n === 'allowances' ? `${v} Mt` : `€${v}`, n]} />
                    <Bar dataKey="allowances" name="Allowances (Mt)" fill={T.blue} opacity={0.8} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                <h4 style={{ color: T.navy, margin: '0 0 12px', fontSize: 14 }}>ETS Sector Coverage & Free Allocation Phase-Out</h4>
                {['Power (2019–no free alloc)', 'Industry Heavy (2026–2034 phase-out)', 'Aviation (ETS from 2012)', 'Maritime (2024–gradual)', 'Buildings & Road (new ETS2 2027)'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.blue, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: T.navy }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>CBAM — Cumulative Liability Trajectory (2024–2034)</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>
                Full implementation 2026. Free allowances for covered sectors phased out by 2034. ~700 Mt/yr imports covered. Price = EU ETS carbon price.
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={POLICIES[1].allowance_traj}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${v}B`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`$${v}B`, 'CBAM Liability']} />
                  <Area dataKey="cbam_liability_bn" stroke={T.teal} fill={T.teal} fillOpacity={0.2} name="CBAM Liability ($B)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {POLICIES[1].sectors.map(sector => (
                <div key={sector} style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{sector}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>CBAM covered from 2026</div>
                  <div style={{ marginTop: 8, height: 4, background: T.border, borderRadius: 2 }}>
                    <div style={{ height: '100%', width: '100%', background: T.teal, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>IRA — Total Annual Clean Energy Tax Credits (2024–2032)</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>
                $369B total 2022–2032. PTC (Production Tax Credit) + ITC (Investment Tax Credit) + manufacturing credits + clean hydrogen + carbon capture.
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={POLICIES[3].allowance_traj}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${v}B`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [n === 'total_credits_bn' ? `$${v}B total` : `$${v}`, n]} />
                  <Bar dataKey="total_credits_bn" name="Total IRA Credits ($B)" fill={T.red} opacity={0.8} radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[
                { label: 'Solar PTC', val: '$0.0275/kWh', desc: '10yr credit for new solar PV, adder for domestic content, energy community' },
                { label: 'Wind PTC', val: '$0.0265/kWh', desc: 'Wind production tax credit, 10yr, prevailing wage requirement' },
                { label: 'Clean H₂', val: '$3.00/kg', desc: '45V credit, $0.60–$3.00/kg based on lifecycle GHG intensity' },
                { label: 'EV Credit', val: '$7,500', desc: '30D clean vehicle credit, income limits, final assembly requirement' },
                { label: 'Carbon Capture', val: '$0.85/t', desc: '45Q, enhanced $180/t for DAC, $85/t geological, $60/t EOR' },
                { label: 'Battery Mfg', val: '$35/kWh', desc: '45X credit for domestically manufactured battery cells & modules' },
              ].map(m => (
                <div key={m.label} style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 16 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 700, color: T.red, marginBottom: 4 }}>{m.val}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 12px', fontSize: 15 }}>UK MEES — EPC Tightening Timeline</h3>
                {[
                  { period: '2018–now', standard: 'E', desc: 'No new/renewed leases for F/G', penalty: '£150,000 max', status: 'Active', col: T.green },
                  { period: 'April 2027', standard: 'D', desc: 'Domestic rentals must reach EPC D', penalty: '£200,000 max', status: 'Upcoming', col: T.amber },
                  { period: 'April 2030', standard: 'C', desc: 'Domestic: minimum EPC C required', penalty: '£250,000 max', status: 'Upcoming', col: T.orange },
                  { period: 'April 2035', standard: 'B', desc: 'Commercial: minimum EPC B required', penalty: '£300,000 max', status: 'Proposed', col: T.red },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ background: item.col + '22', color: item.col, fontWeight: 700, fontSize: 18, padding: '4px 10px', borderRadius: 6, fontFamily: T.mono }}>{item.standard}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: T.navy, fontSize: 13 }}>{item.period}</div>
                      <div style={{ fontSize: 12, color: T.textSec }}>{item.desc}</div>
                      <div style={{ fontSize: 11, color: T.red, marginTop: 2 }}>Max penalty: {item.penalty}</div>
                    </div>
                    <span style={{ background: item.col + '22', color: item.col, padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>{item.status}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 12px', fontSize: 15 }}>UK RE Portfolio at Risk by EPC Band</h3>
                {[
                  { band: 'A/B', count_mn: 2.1, value_bn: 280, at_risk: false, desc: 'Already compliant', col: T.green },
                  { band: 'C', count_mn: 8.4, value_bn: 920, at_risk: false, desc: 'Compliant by 2030', col: T.green },
                  { band: 'D', count_mn: 11.2, value_bn: 1100, at_risk: true, desc: 'Upgrade needed by 2027', col: T.amber },
                  { band: 'E', count_mn: 5.8, value_bn: 520, at_risk: true, desc: 'Currently breaching MEES', col: T.orange },
                  { band: 'F/G', count_mn: 2.3, value_bn: 180, at_risk: true, desc: 'Cannot be let', col: T.red },
                ].map(item => (
                  <div key={item.band} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ background: item.col + '22', color: item.col, fontWeight: 700, padding: '3px 10px', borderRadius: 6, fontFamily: T.mono, fontSize: 14, minWidth: 40, textAlign: 'center' }}>{item.band}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{item.count_mn}M properties · £{item.value_bn}B value</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>{item.desc}</div>
                    </div>
                    {item.at_risk && <span style={{ fontSize: 10, fontWeight: 700, color: T.red, background: T.red + '11', padding: '2px 6px', borderRadius: 6 }}>AT RISK</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Portfolio Policy Exposure — Revenue & Cost Impact</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={POLICIES.map(p => ({ name: p.icon + ' ' + p.name.split('(')[0].trim().substring(0, 18), revenue: p.revenue_impact_bn, cost: p.cost_impact_bn, color: p.color }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={70} />
                  <YAxis tickFormatter={v => `$${v}B`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`$${v}B`]} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue Impact ($B)" fill={T.green} opacity={0.8} radius={[4,4,0,0]} />
                  <Bar dataKey="cost" name="Cost Impact ($B)" fill={T.red} opacity={0.7} radius={[4,4,0,0]} />
                  <ReferenceLine y={0} stroke={T.navy} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
