import React, { useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', navy:'#1b3a5c', gold:'#c5a96a', sage:'#5a8a6a', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', teal:'#0f766e', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const tip = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 11 };

const THEME = '#7c3aed';

const CARBON_PRICES = [
  { jurisdiction: 'EU ETS',       price: 68.4,  yearChange: +12.3, coverage: 40, mechanism: 'ETS',    trend: 'up'   },
  { jurisdiction: 'UK ETS',       price: 54.2,  yearChange: +8.1,  coverage: 28, mechanism: 'ETS',    trend: 'up'   },
  { jurisdiction: 'California',   price: 31.8,  yearChange: +4.2,  coverage: 85, mechanism: 'ETS',    trend: 'up'   },
  { jurisdiction: 'RGGI',         price: 14.6,  yearChange: +2.1,  coverage: 18, mechanism: 'ETS',    trend: 'flat' },
  { jurisdiction: 'China',        price: 8.7,   yearChange: +1.4,  coverage: 40, mechanism: 'ETS',    trend: 'up'   },
  { jurisdiction: 'Canada',       price: 65.0,  yearChange: +15.0, coverage: 78, mechanism: 'Tax',    trend: 'up'   },
  { jurisdiction: 'Australia',    price: 22.5,  yearChange: -1.2,  coverage: 28, mechanism: 'Hybrid', trend: 'down' },
  { jurisdiction: 'New Zealand',  price: 38.9,  yearChange: +5.7,  coverage: 49, mechanism: 'ETS',    trend: 'up'   },
  { jurisdiction: 'Switzerland',  price: 130.0, yearChange: +10.0, coverage: 10, mechanism: 'Tax',    trend: 'up'   },
  { jurisdiction: 'South Korea',  price: 16.2,  yearChange: +0.9,  coverage: 73, mechanism: 'ETS',    trend: 'flat' },
  { jurisdiction: 'Japan',        price: 2.4,   yearChange: +0.3,  coverage: 35, mechanism: 'ETS',    trend: 'up'   },
  { jurisdiction: 'Singapore',    price: 25.0,  yearChange: +10.0, coverage: 80, mechanism: 'Tax',    trend: 'up'   },
];

const NDC_TRACKER = [
  { economy: 'European Union',  target: 55, baseYear: 1990, currentProgress: 47, gap: 8,  onTrack: true,  updatedYear: 2023 },
  { economy: 'United States',   target: 50, baseYear: 2005, currentProgress: 21, gap: 29, onTrack: false, updatedYear: 2022 },
  { economy: 'China',           target: 65, baseYear: 2005, currentProgress: 38, gap: 27, onTrack: false, updatedYear: 2022 },
  { economy: 'India',           target: 45, baseYear: 2005, currentProgress: 33, gap: 12, onTrack: true,  updatedYear: 2023 },
  { economy: 'Japan',           target: 46, baseYear: 2013, currentProgress: 24, gap: 22, onTrack: false, updatedYear: 2022 },
  { economy: 'United Kingdom',  target: 68, baseYear: 1990, currentProgress: 51, gap: 17, onTrack: true,  updatedYear: 2023 },
  { economy: 'Brazil',          target: 43, baseYear: 2005, currentProgress: 18, gap: 25, onTrack: false, updatedYear: 2022 },
  { economy: 'Australia',       target: 43, baseYear: 2005, currentProgress: 20, gap: 23, onTrack: false, updatedYear: 2023 },
];

const POLICY_PIPELINE = [
  { policy: 'EU Carbon Border Adjustment Mechanism', jurisdiction: 'EU',          stage: 'Implemented',  effectiveDate: '2026-01', sector: 'Trade/Industry',   financialImpact: '$14bn/yr'  },
  { policy: 'US Clean Electricity Performance Plan', jurisdiction: 'USA',         stage: 'Proposed',     effectiveDate: '2027-06', sector: 'Power',             financialImpact: '$150bn/yr' },
  { policy: 'UK Green Finance Strategy Update',      jurisdiction: 'UK',          stage: 'Consultation', effectiveDate: '2026-04', sector: 'Finance',           financialImpact: '$8bn/yr'   },
  { policy: 'China ETS Phase III Expansion',         jurisdiction: 'China',       stage: 'Enacted',      effectiveDate: '2026-07', sector: 'Industry/Power',    financialImpact: '$22bn/yr'  },
  { policy: 'Canada Carbon Tax Escalation C$170',    jurisdiction: 'Canada',      stage: 'Enacted',      effectiveDate: '2030-01', sector: 'Economy-wide',      financialImpact: '$35bn/yr'  },
  { policy: 'Singapore Carbon Tax Increase $50',     jurisdiction: 'Singapore',   stage: 'Enacted',      effectiveDate: '2026-01', sector: 'Industry',          financialImpact: '$1.2bn/yr' },
  { policy: 'Australia Safeguard Mechanism Reform',  jurisdiction: 'Australia',   stage: 'Implemented',  effectiveDate: '2025-07', sector: 'Heavy Industry',    financialImpact: '$3.4bn/yr' },
  { policy: 'Japan GX Green Transformation Bond',   jurisdiction: 'Japan',       stage: 'Enacted',      effectiveDate: '2026-03', sector: 'Energy/Industry',   financialImpact: '$10bn/yr'  },
  { policy: 'India Carbon Credit Framework',         jurisdiction: 'India',       stage: 'Consultation', effectiveDate: '2027-01', sector: 'Economy-wide',      financialImpact: '$5bn/yr'   },
  { policy: 'CORSIA Aviation Carbon Offsetting',     jurisdiction: 'Global',      stage: 'Implemented',  effectiveDate: '2027-01', sector: 'Aviation',          financialImpact: '$2.8bn/yr' },
];

const POLITICAL_RISK = [
  { region: 'Europe',        politicalRisk: 2.1, policyStability: 8.4, climateAmbition: 8.9, regulatoryRisk: 1.8 },
  { region: 'North America', politicalRisk: 5.6, policyStability: 5.2, climateAmbition: 5.8, regulatoryRisk: 4.9 },
  { region: 'Asia Pacific',  politicalRisk: 4.2, policyStability: 6.1, climateAmbition: 5.5, regulatoryRisk: 4.0 },
  { region: 'Latin America', politicalRisk: 6.8, policyStability: 3.9, climateAmbition: 4.2, regulatoryRisk: 6.1 },
  { region: 'Middle East',   politicalRisk: 7.4, policyStability: 4.5, climateAmbition: 2.8, regulatoryRisk: 7.0 },
  { region: 'Africa',        politicalRisk: 6.1, policyStability: 4.0, climateAmbition: 3.9, regulatoryRisk: 5.8 },
];

// 24-month carbon price trend
const CARBON_PRICE_TREND = Array.from({ length: 24 }, (_, i) => ({
  month: i === 0 ? 'Mar\'24' : i === 6 ? 'Sep\'24' : i === 12 ? 'Mar\'25' : i === 18 ? 'Sep\'25' : i === 23 ? 'Feb\'26' : '',
  euEts:      +(48 + sr(i * 3.1) * 28 + i * 0.85).toFixed(1),
  california: +(25 + sr(i * 2.7) * 10 + i * 0.30).toFixed(1),
  ukEts:      +(38 + sr(i * 3.7) * 22 + i * 0.72).toFixed(1),
}));

const TABS = ['Overview', 'Carbon Pricing Tracker', 'NDC Monitor', 'Policy Pipeline', 'Political Risk'];

const STAGE_COLORS = {
  Proposed:     '#6366f1',
  Consultation: T.amber,
  Enacted:      T.teal,
  Implemented:  T.green,
};

const riskColor = v => v <= 3 ? T.green : v <= 5.5 ? T.amber : T.red;
const stabilityColor = v => v >= 7 ? T.green : v >= 5 ? T.amber : T.red;

const Stat = ({ label, value, sub, accent }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 22, fontWeight: 700, color: accent || THEME }}>{value}</div>
    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginTop: 2 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Badge = ({ label, color }) => (
  <span style={{ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>{label}</span>
);

export default function ClimatePolicyIntelligencePage() {
  const [tab, setTab] = useState(0);

  const top8 = [...CARBON_PRICES].sort((a, b) => b.price - a.price).slice(0, 8);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: THEME, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 16 }}>⚖</span>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>Climate Policy Intelligence</div>
            <div style={{ fontSize: 12, color: T.textMut }}>EP-AB2 · Carbon pricing, NDC tracking, policy pipeline & political risk</div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            background: 'none', border: 'none', borderBottom: tab === i ? `2px solid ${THEME}` : '2px solid transparent',
            color: tab === i ? THEME : T.textSec, fontWeight: tab === i ? 700 : 500,
            fontSize: 13, padding: '8px 16px', cursor: 'pointer', fontFamily: T.font, marginBottom: -1,
          }}>{t}</button>
        ))}
      </div>

      {/* ── TAB 0: Overview ── */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <Stat label="Active Carbon Pricing Instruments" value="73" sub="Globally operational" accent={THEME} />
            <Stat label="Carbon Market Value" value="$909bn" sub="Total 2025 market cap" accent={T.teal} />
            <Stat label="Global Emissions Covered" value="23%" sub="By carbon pricing" accent={T.sage} />
            <Stat label="Avg Carbon Price" value="$41/t" sub="Weighted average" accent={T.amber} />
          </div>

          {/* Top 8 carbon prices bar chart */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 14 }}>Top 8 Jurisdictions by Carbon Price ($/tCO₂)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={top8} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="jurisdiction" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={tip} formatter={v => [`$${v}/t`, 'Price']} />
                <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                  {top8.map((d, i) => (
                    <Cell key={i} fill={i === 0 ? THEME : i < 3 ? '#9f68f5' : '#c4a8f8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* NDC Summary Table */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>NDC Progress Summary</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Economy', 'Target', 'Progress', 'Gap', 'On Track', 'Updated'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: T.textMut, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NDC_TRACKER.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.bg }}>
                    <td style={{ padding: '7px 10px', fontWeight: 600, color: T.text }}>{r.economy}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{r.target}% vs {r.baseYear}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${(r.currentProgress / r.target) * 100}%`, height: '100%', background: r.onTrack ? T.green : T.amber, borderRadius: 3 }} />
                        </div>
                        <span style={{ color: T.textSec }}>{r.currentProgress}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '7px 10px', color: r.gap > 20 ? T.red : T.amber, fontWeight: 600 }}>{r.gap}pp</td>
                    <td style={{ padding: '7px 10px' }}><Badge label={r.onTrack ? 'Yes' : 'No'} color={r.onTrack ? T.green : T.red} /></td>
                    <td style={{ padding: '7px 10px', color: T.textMut }}>{r.updatedYear}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 1: Carbon Pricing Tracker ── */}
      {tab === 1 && (
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>All Carbon Pricing Jurisdictions</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Jurisdiction', 'Price ($/t)', 'YoY Change', 'Coverage', 'Mechanism', 'Trend'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: T.textMut, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CARBON_PRICES.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.bg }}>
                    <td style={{ padding: '7px 10px', fontWeight: 600, color: T.text }}>{r.jurisdiction}</td>
                    <td style={{ padding: '7px 10px', fontWeight: 700, color: THEME }}>${r.price.toFixed(1)}</td>
                    <td style={{ padding: '7px 10px', color: r.yearChange >= 0 ? T.green : T.red, fontWeight: 600 }}>
                      {r.yearChange >= 0 ? '+' : ''}{r.yearChange.toFixed(1)}
                    </td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{r.coverage}%</td>
                    <td style={{ padding: '7px 10px' }}>
                      <Badge label={r.mechanism} color={r.mechanism === 'ETS' ? THEME : r.mechanism === 'Tax' ? T.teal : T.amber} />
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ fontSize: 14 }}>{r.trend === 'up' ? '↑' : r.trend === 'down' ? '↓' : '→'}</span>
                      <span style={{ marginLeft: 4, color: r.trend === 'up' ? T.green : r.trend === 'down' ? T.red : T.textMut, fontSize: 11 }}>{r.trend}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 24-month trend area chart */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>24-Month Carbon Price Trend ($/tCO₂)</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
              {[['EU ETS', THEME], ['UK ETS', T.teal], ['California', T.amber]].map(([lbl, col]) => (
                <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <div style={{ width: 12, height: 3, background: col, borderRadius: 2 }} />
                  <span style={{ color: T.textSec }}>{lbl}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={CARBON_PRICE_TREND} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="euGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THEME} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={THEME} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ukGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.teal} stopOpacity={0.14} />
                    <stop offset="95%" stopColor={T.teal} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.amber} stopOpacity={0.14} />
                    <stop offset="95%" stopColor={T.amber} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={tip} formatter={v => [`$${v}/t`]} />
                <Area type="monotone" dataKey="euEts"      stroke={THEME}   fill="url(#euGrad)" strokeWidth={2} dot={false} name="EU ETS" />
                <Area type="monotone" dataKey="ukEts"      stroke={T.teal}  fill="url(#ukGrad)" strokeWidth={2} dot={false} name="UK ETS" />
                <Area type="monotone" dataKey="california" stroke={T.amber} fill="url(#caGrad)" strokeWidth={2} dot={false} name="California" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── TAB 2: NDC Monitor ── */}
      {tab === 2 && (
        <div>
          <div style={{ fontSize: 13, color: T.textSec, marginBottom: 18 }}>
            Progress toward Nationally Determined Contributions (NDCs) submitted under the Paris Agreement.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {NDC_TRACKER.map((r, i) => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{r.economy}</span>
                    <span style={{ marginLeft: 10, fontSize: 11, color: T.textMut }}>Updated {r.updatedYear}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Badge label={r.onTrack ? 'On Track' : 'Off Track'} color={r.onTrack ? T.green : T.red} />
                    <span style={{ fontSize: 12, color: T.textSec }}>Gap: <strong style={{ color: r.gap > 20 ? T.red : T.amber }}>{r.gap}pp</strong></span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 24, fontSize: 12, color: T.textSec, marginBottom: 8 }}>
                  <span>Target: <strong style={{ color: T.text }}>{r.target}% reduction vs {r.baseYear}</strong></span>
                  <span>Current: <strong style={{ color: T.text }}>{r.currentProgress}%</strong></span>
                </div>
                {/* Progress bar */}
                <div style={{ position: 'relative', height: 14, background: T.bg, borderRadius: 7, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                  <div style={{ width: `${(r.currentProgress / r.target) * 100}%`, height: '100%', background: r.onTrack ? T.green : T.amber, borderRadius: 7, transition: 'width 0.6s' }} />
                  {/* Target marker */}
                  <div style={{ position: 'absolute', top: 0, left: '100%', width: 2, height: '100%', background: T.navy, opacity: 0.4 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: T.textMut }}>
                  <span>0%</span>
                  <span>{Math.round((r.currentProgress / r.target) * 100)}% of target achieved</span>
                  <span>{r.target}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: Policy Pipeline ── */}
      {tab === 3 && (
        <div>
          {['Implemented', 'Enacted', 'Consultation', 'Proposed'].map(stage => {
            const items = POLICY_PIPELINE.filter(p => p.stage === stage);
            if (items.length === 0) return null;
            return (
              <div key={stage} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: STAGE_COLORS[stage] }} />
                  <span style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{stage}</span>
                  <span style={{ fontSize: 12, color: T.textMut }}>({items.length} policies)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map((p, i) => (
                    <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${STAGE_COLORS[stage]}`, borderRadius: '0 8px 8px 0', padding: '14px 18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: T.text, fontSize: 13 }}>{p.policy}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: THEME, whiteSpace: 'nowrap', marginLeft: 12 }}>{p.financialImpact}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 14, fontSize: 11, color: T.textSec }}>
                        <span>Jurisdiction: <strong>{p.jurisdiction}</strong></span>
                        <span>Effective: <strong>{p.effectiveDate}</strong></span>
                        <span>Sector: <strong>{p.sector}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 4: Political Risk ── */}
      {tab === 4 && (
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Regional Climate Policy Risk Matrix</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Region', 'Political Risk', 'Policy Stability', 'Climate Ambition', 'Regulatory Risk'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: T.textMut, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {POLITICAL_RISK.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : T.bg }}>
                    <td style={{ padding: '9px 10px', fontWeight: 700, color: T.text }}>{r.region}</td>
                    <td style={{ padding: '9px 10px' }}>
                      <span style={{ fontWeight: 700, color: riskColor(r.politicalRisk) }}>{r.politicalRisk.toFixed(1)}</span>
                      <span style={{ color: T.textMut, fontSize: 10 }}>/10</span>
                    </td>
                    <td style={{ padding: '9px 10px' }}>
                      <span style={{ fontWeight: 700, color: stabilityColor(r.policyStability) }}>{r.policyStability.toFixed(1)}</span>
                      <span style={{ color: T.textMut, fontSize: 10 }}>/10</span>
                    </td>
                    <td style={{ padding: '9px 10px' }}>
                      <span style={{ fontWeight: 700, color: stabilityColor(r.climateAmbition) }}>{r.climateAmbition.toFixed(1)}</span>
                      <span style={{ color: T.textMut, fontSize: 10 }}>/10</span>
                    </td>
                    <td style={{ padding: '9px 10px' }}>
                      <span style={{ fontWeight: 700, color: riskColor(r.regulatoryRisk) }}>{r.regulatoryRisk.toFixed(1)}</span>
                      <span style={{ color: T.textMut, fontSize: 10 }}>/10</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 11, color: T.textMut }}>
              <span>Risk scores: <span style={{ color: T.green }}>Low (≤3)</span> | <span style={{ color: T.amber }}>Med (3–5.5)</span> | <span style={{ color: T.red }}>High (&gt;5.5)</span></span>
              <span>Stability/Ambition: <span style={{ color: T.green }}>High (≥7)</span> | <span style={{ color: T.amber }}>Med (5–7)</span> | <span style={{ color: T.red }}>Low (&lt;5)</span></span>
            </div>
          </div>

          {/* Region comparison bar chart */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 14 }}>Climate Ambition Score by Region</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={POLITICAL_RISK} layout="vertical" margin={{ top: 4, right: 30, left: 10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis type="category" dataKey="region" tick={{ fontSize: 11, fill: T.textSec }} width={90} />
                <Tooltip contentStyle={tip} formatter={v => [v.toFixed(1), 'Score']} />
                <Bar dataKey="climateAmbition" radius={[0, 4, 4, 0]}>
                  {POLITICAL_RISK.map((r, i) => (
                    <Cell key={i} fill={r.climateAmbition >= 7 ? T.green : r.climateAmbition >= 5 ? THEME : T.amber} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
