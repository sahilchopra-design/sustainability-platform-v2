import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

// ─── TCFD Pillar data ───────────────────────────────────────────────────────
const TCFD_PILLARS = [
  {
    pillar: 'Governance',
    code: 'G',
    color: T.teal,
    disclosures: [
      { id: 'G1', req: 'Board oversight of climate-related risks and opportunities', status: 'COMPLETE', text: 'The Board Climate & Sustainability Committee (CSC) meets quarterly. Climate risk is a standing agenda item. ESG performance is linked to executive compensation (15% weighting from FY2025).' },
      { id: 'G2', req: "Management's role in assessing and managing climate-related risks", status: 'COMPLETE', text: 'A Chief Sustainability Officer (CSO) reports directly to the CEO. The Climate Risk Working Group (CRWG) meets monthly across Risk, Finance, and Operations divisions.' },
    ]
  },
  {
    pillar: 'Strategy',
    code: 'S',
    color: T.blue,
    disclosures: [
      { id: 'S1', req: 'Climate-related risks and opportunities identified over short, medium, and long term', status: 'COMPLETE', text: 'Short term (0–3yr): Regulatory compliance costs (EU ETS, CBAM). Medium term (3–10yr): Physical risk exposure in Asia Pacific assets; technology displacement in Energy sector. Long term (10–30yr): Stranded asset risk for fossil fuel holdings; transition to net-zero economy.' },
      { id: 'S2', req: 'Impact of climate-related risks and opportunities on business, strategy and financial planning', status: 'COMPLETE', text: 'Portfolio transition risk exposure: $2.1B stranded assets under NZ2050. Climate VaR: 8.7% of AUM. Upside: green infrastructure pipeline $0.8B (2026–2030 deployment).' },
      { id: 'S3', req: 'Resilience of strategy under different climate scenarios', status: 'PARTIAL', text: 'Scenario analysis conducted across 3 NGFS Phase 5 scenarios (Current Policies, Below 2°C, Net Zero 2050). Full Divergent Net Zero and Delayed Transition scenarios in progress for FY2026 report.' },
    ]
  },
  {
    pillar: 'Risk Management',
    code: 'R',
    color: T.orange,
    disclosures: [
      { id: 'R1', req: 'Processes for identifying and assessing climate-related risks', status: 'COMPLETE', text: 'Annual climate risk assessment using Climate VaR Engine (EP-CE1). Physical risk screening via NGFS-IEA hazard maps. Transition risk scored on 6-pillar methodology (EP-CD1).' },
      { id: 'R2', req: 'Processes for managing climate-related risks', status: 'COMPLETE', text: 'Risk appetite: maximum 10% of portfolio with transition score < 40. Engagement protocol for HIGH/CRITICAL holdings (EP-CE2 dashboard). Divestment trigger: ITR > 4.0°C with no credible transition plan.' },
      { id: 'R3', req: 'Integration into overall risk management', status: 'COMPLETE', text: 'Climate risk integrated into Group Risk Appetite Statement (RAS). TCFD metrics reported to ALCO quarterly. Climate scenario stress tests included in annual ICAAP submission.' },
    ]
  },
  {
    pillar: 'Metrics & Targets',
    code: 'M',
    color: T.green,
    disclosures: [
      { id: 'M1', req: 'Climate-related metrics used to assess risks and opportunities', status: 'COMPLETE', text: 'Portfolio financed emissions (WACI): 182 tCO₂/$M revenue. Implied Temperature Rise (ITR): 2.4°C. Climate VaR: 8.7% of AUM. GFANZ alignment: 61% by AUM.' },
      { id: 'M2', req: 'Scope 1, 2 and 3 GHG emissions', status: 'PARTIAL', text: 'Scope 1: 12,400 tCO₂e (operations). Scope 2 (market-based): 3,200 tCO₂e. Financed emissions (Scope 3 Cat 15): 1.84M tCO₂e. Scope 3 Cat 11 in progress for FY2026.' },
      { id: 'M3', req: 'Targets used to manage climate-related risks and opportunities', status: 'COMPLETE', text: 'Target 1: ITR ≤ 1.8°C by 2030. Target 2: 50% reduction in WACI by 2030 vs. 2020 baseline. Target 3: 100% GFANZ-aligned portfolio by 2040. Net Zero financed emissions by 2050.' },
    ]
  }
];

// ─── ISSB S2 disclosures ────────────────────────────────────────────────────
const ISSB_ITEMS = [
  { para: 'Para 10', topic: 'Governance — Board Oversight', status: 'COMPLETE', color: T.green },
  { para: 'Para 14', topic: 'Strategy — Business model & value chain', status: 'COMPLETE', color: T.green },
  { para: 'Para 17', topic: 'Strategy — Climate scenario analysis', status: 'PARTIAL', color: T.amber },
  { para: 'Para 22', topic: 'Strategy — Financial position impact', status: 'COMPLETE', color: T.green },
  { para: 'Para 25', topic: 'Risk Mgmt — Risk identification process', status: 'COMPLETE', color: T.green },
  { para: 'Para 29', topic: 'Metrics — Industry-based metrics (SASB)', status: 'PARTIAL', color: T.amber },
  { para: 'Para 33', topic: 'Metrics — GHG emissions Scope 1/2/3', status: 'PARTIAL', color: T.amber },
  { para: 'Para 36', topic: 'Metrics — GHG emissions targets', status: 'COMPLETE', color: T.green },
  { para: 'Para 39', topic: 'Transition plan — Net zero roadmap', status: 'IN PROGRESS', color: T.orange },
];

// ─── Narrative scenarios for board report ──────────────────────────────────
const NARRATIVES = {
  'Current Policies': {
    title: 'Current Policies Scenario — Baseline Risk Narrative',
    itr: '3.1°C', vaR: '5.8%', stranded: '$0.9B',
    text: `Under the Current Policies scenario, global temperature rise is projected at 3.1°C above pre-industrial levels by 2100. For our portfolio, this translates to a Climate VaR of 5.8% of AUM over a 10-year horizon, driven primarily by acute physical risk events (tropical cyclones, flooding, heat stress) in our Asia Pacific and Emerging Market exposures.

Transition risk is comparatively lower in this scenario due to the absence of aggressive regulatory acceleration. However, financial institutions globally face increasing reputational and market risk as investors price in climate inaction premia. Energy sector holdings (22% of portfolio) face modest CAPEX efficiency headwinds of $0.9B in stranded asset write-downs by 2035.

This scenario represents the risk of insufficient action — not our target trajectory. We continue to align toward Net Zero 2050.`,
  },
  'Below 2°C': {
    title: 'Below 2°C Scenario — Orderly Transition Narrative',
    itr: '1.8°C', vaR: '8.7%', stranded: '$2.1B',
    text: `The Below 2°C scenario assumes coordinated global policy action with carbon prices rising to €150/tCO₂ by 2040 (EU ETS), deployment of CBAM across major economies by 2026, and accelerated technology displacement of fossil fuel infrastructure.

For our portfolio, Climate VaR rises to 8.7% of AUM reflecting elevated near-term transition costs. The energy and materials sectors face $2.1B in stranded asset exposure, primarily in fossil fuel-linked CAPEX. However, our 61% GFANZ-aligned holdings ($9.1B) benefit from greenium compression of 28–42 basis points on refinancing, partially offsetting transition costs.

Portfolio ITR of 2.4°C remains above the 1.8°C threshold in this scenario, requiring acceleration of engagement with Shell, BP, and Lufthansa.`,
  },
  'Net Zero 2050': {
    title: 'Net Zero 2050 Scenario — Accelerated Transition Narrative',
    itr: '1.5°C', vaR: '11.2%', stranded: '$3.8B',
    text: `The Net Zero 2050 scenario represents the highest near-term transition disruption. Carbon prices accelerate to €220/tCO₂ by 2035 under Phase IV EU ETS, with CORSIA Phase II adding aviation sector liability of €340M across portfolio holdings.

Short-term Climate VaR peaks at 11.2% of AUM (10yr horizon) driven by rapid technology displacement (EV penetration 85% by 2035 impairing Lufthansa's ground transport adjacencies), green hydrogen cost curves accelerating past fossil gas parity by 2028, and stranded asset write-downs of $3.8B concentrated in Energy and Materials.

Resilience factors: our 23 green bond and SLB positions ($4.2B face value) provide structural alignment with the transition economy. Vestas Wind, Microsoft, and Siemens AG — constituting 10.3% of AUM — are rated LEADER tier and projected to outperform benchmark by 340bps in this scenario.`,
  }
};

// ─── Metrics table ─────────────────────────────────────────────────────────
const METRICS_TABLE = [
  { metric: 'Portfolio Climate VaR (NZ2050, 10yr)', value: '8.7%', unit: '% of AUM', source: 'EP-CE1', status: 'VERIFIED' },
  { metric: 'Implied Temperature Rise (ITR)', value: '2.4°C', unit: '°C', source: 'EP-CC1', status: 'VERIFIED' },
  { metric: 'WACI — Financed Emissions', value: '182', unit: 'tCO₂/$M revenue', source: 'EP-CC2', status: 'VERIFIED' },
  { metric: 'GFANZ Alignment', value: '61%', unit: '% of AUM', source: 'EP-CC1', status: 'VERIFIED' },
  { metric: 'Stranded Asset Exposure (NZ2050)', value: '$2.1B', unit: 'USD', source: 'EP-CA2', status: 'VERIFIED' },
  { metric: 'Scope 1 (operational)', value: '12,400', unit: 'tCO₂e', source: 'EP-CD3', status: 'VERIFIED' },
  { metric: 'Scope 2 (market-based)', value: '3,200', unit: 'tCO₂e', source: 'EP-CD3', status: 'VERIFIED' },
  { metric: 'Scope 3 Cat 15 (financed)', value: '1.84M', unit: 'tCO₂e', source: 'EP-CC2', status: 'VERIFIED' },
  { metric: 'Scope 3 Cat 11 (use of sold products)', value: 'N/A', unit: 'tCO₂e', source: 'EP-CD3', status: 'IN PROGRESS' },
  { metric: 'Carbon Price Exposure (CBAM 2026)', value: '€180M', unit: 'EUR p.a.', source: 'EP-CB3', status: 'ESTIMATED' },
  { metric: 'Transition Score (portfolio avg)', value: '58/100', unit: 'composite', source: 'EP-CD1', status: 'VERIFIED' },
  { metric: 'Green Bond Screen Pass Rate', value: '60.5%', unit: '%', source: 'EP-CC3', status: 'VERIFIED' },
];

// ─── Emissions trajectory ──────────────────────────────────────────────────
const EMISSIONS_TREND = [
  { yr: 2020, actual: 225, target: 225 },
  { yr: 2021, actual: 218, target: 214 },
  { yr: 2022, actual: 208, target: 202 },
  { yr: 2023, actual: 196, target: 191 },
  { yr: 2024, actual: 182, target: 180 },
  { yr: 2025, actual: null, target: 169 },
  { yr: 2026, actual: null, target: 158 },
  { yr: 2027, actual: null, target: 147 },
  { yr: 2028, actual: null, target: 136 },
  { yr: 2029, actual: null, target: 125 },
  { yr: 2030, actual: null, target: 112 },
];

const TABS = ['TCFD Report', 'ISSB S2 Disclosure', 'Board Narrative', 'Metrics Register', 'Export Centre'];

export default function TransitionRegReportingPage() {
  const [tab, setTab] = useState(0);
  const [expandedPillar, setExpandedPillar] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [scenario, setScenario] = useState('Below 2°C');
  const [exportFormat, setExportFormat] = useState('PDF');

  const narrative = NARRATIVES[scenario];

  const statusBadge = (s) => {
    const cfg = {
      COMPLETE: { color: T.green, bg: T.green + '22', label: 'COMPLETE' },
      PARTIAL: { color: T.amber, bg: T.amber + '22', label: 'PARTIAL' },
      'IN PROGRESS': { color: T.orange, bg: T.orange + '22', label: 'IN PROGRESS' },
      VERIFIED: { color: T.green, bg: T.green + '22', label: '✓ VERIFIED' },
      ESTIMATED: { color: T.amber, bg: T.amber + '22', label: 'ESTIMATED' },
    }[s] || { color: T.textMut, bg: T.border, label: s };
    return (
      <span style={{ background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      {/* ── Header ── */}
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CE3 · TRANSITION REGULATORY REPORTING</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Climate Transition Regulatory Reporting Suite</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              TCFD · ISSB S2 · CSRD ESRS E1 · Scenario Narratives · Metrics Register · Board-Ready Export
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Current Policies', 'Below 2°C', 'Net Zero 2050'].map(s => (
              <button key={s} onClick={() => setScenario(s)} style={{
                padding: '8px 14px', borderRadius: 8, border: `2px solid ${scenario === s ? T.gold : 'transparent'}`,
                background: scenario === s ? 'rgba(197,169,106,0.15)' : 'rgba(255,255,255,0.08)',
                color: scenario === s ? T.gold : '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 600
              }}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 13,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>

        {/* ══ TAB 0: TCFD Report ══ */}
        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            {/* Completion summary */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {TCFD_PILLARS.map(p => {
                const total = p.disclosures.length;
                const complete = p.disclosures.filter(d => d.status === 'COMPLETE').length;
                const pct = Math.round((complete / total) * 100);
                return (
                  <div key={p.pillar} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: T.navy, fontSize: 13 }}>{p.pillar}</span>
                      <span style={{ fontFamily: T.mono, fontWeight: 700, color: p.color, fontSize: 18 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 5, background: T.border, borderRadius: 3 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: p.color, borderRadius: 3 }} />
                    </div>
                    <div style={{ color: T.textMut, fontSize: 10, marginTop: 6 }}>{complete}/{total} disclosures complete</div>
                  </div>
                );
              })}
            </div>

            {/* Pillar accordion */}
            {TCFD_PILLARS.map(pillar => (
              <div key={pillar.pillar} style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 12, overflow: 'hidden' }}>
                <button
                  onClick={() => setExpandedPillar(expandedPillar === pillar.code ? null : pillar.code)}
                  style={{
                    width: '100%', padding: '16px 24px', background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ background: pillar.color, color: '#fff', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{pillar.code}</span>
                    <span style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>TCFD — {pillar.pillar}</span>
                    <span style={{ fontSize: 12, color: T.textSec }}>{pillar.disclosures.length} required disclosures</span>
                  </div>
                  <span style={{ color: T.textMut, fontSize: 18 }}>{expandedPillar === pillar.code ? '▲' : '▼'}</span>
                </button>

                {expandedPillar === pillar.code && (
                  <div style={{ padding: '0 24px 20px' }}>
                    {pillar.disclosures.map(d => (
                      <div key={d.id} style={{ marginBottom: 12 }}>
                        <button
                          onClick={() => setExpandedItem(expandedItem === d.id ? null : d.id)}
                          style={{
                            width: '100%', padding: '12px 16px', background: T.bg, borderRadius: 8, border: `1px solid ${T.border}`,
                            cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left'
                          }}
                        >
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
                            <span style={{ fontFamily: T.mono, fontSize: 11, color: pillar.color, fontWeight: 700, width: 32 }}>{d.id}</span>
                            <span style={{ fontSize: 12, color: T.navy, flex: 1 }}>{d.req}</span>
                          </div>
                          {statusBadge(d.status)}
                        </button>
                        {expandedItem === d.id && (
                          <div style={{ padding: '14px 16px', background: '#f8f7f5', borderRadius: '0 0 8px 8px', border: `1px solid ${T.border}`, borderTop: 'none', fontSize: 12, color: T.textSec, lineHeight: 1.7 }}>
                            {d.text}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══ TAB 1: ISSB S2 ══ */}
        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 15 }}>IFRS S2 Climate-related Disclosures — Compliance Tracker</h3>
                  <p style={{ color: T.textSec, fontSize: 12, margin: 0 }}>International Sustainability Standards Board · Effective for annual periods beginning 1 January 2024</p>
                </div>
                <div style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 22, color: T.teal }}>
                  {Math.round((ISSB_ITEMS.filter(i => i.status === 'COMPLETE').length / ISSB_ITEMS.length) * 100)}% Complete
                </div>
              </div>

              {ISSB_ITEMS.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, alignItems: 'center', padding: '12px 0',
                  borderBottom: i < ISSB_ITEMS.length - 1 ? `1px solid ${T.border}` : 'none'
                }}>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, width: 60 }}>{item.para}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: T.navy, fontWeight: 600 }}>{item.topic}</div>
                  </div>
                  <span style={{ background: item.color + '22', color: item.color, padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{item.status}</span>
                </div>
              ))}
            </div>

            {/* CSRD comparison */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 14 }}>CSRD ESRS E1 — Alignment Gap Analysis</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { topic: 'E1-1 Transition plan for climate change mitigation', tcfd: 'S3', issb: 'Para 39', csrd: 'ESRS E1-1', status: 'PARTIAL', gap: 'Net Zero pathway documentation incomplete' },
                  { topic: 'E1-2 Policies related to climate change mitigation', tcfd: 'G1/G2', issb: 'Para 10', csrd: 'ESRS E1-2', status: 'COMPLETE', gap: '—' },
                  { topic: 'E1-3 Actions and resources for climate change', tcfd: 'S2', issb: 'Para 22', csrd: 'ESRS E1-3', status: 'COMPLETE', gap: '—' },
                  { topic: 'E1-4 Targets for climate change mitigation', tcfd: 'M3', issb: 'Para 36', csrd: 'ESRS E1-4', status: 'COMPLETE', gap: '—' },
                  { topic: 'E1-5 Energy consumption and energy mix', tcfd: 'M1', issb: 'Para 29', csrd: 'ESRS E1-5', status: 'PARTIAL', gap: 'Renewable energy % by portfolio company pending' },
                  { topic: 'E1-6 GHG emissions Scope 1/2/3', tcfd: 'M2', issb: 'Para 33', csrd: 'ESRS E1-6', status: 'PARTIAL', gap: 'Scope 3 Cat 11 in progress' },
                ].map((r, i) => (
                  <div key={i} style={{ padding: 14, background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 8, lineHeight: 1.4 }}>{r.topic}</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      {[r.tcfd, r.issb, r.csrd].map((ref, j) => (
                        <span key={j} style={{ background: T.navy + '11', color: T.navy, padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700 }}>{ref}</span>
                      ))}
                    </div>
                    {statusBadge(r.status)}
                    {r.gap !== '—' && <div style={{ fontSize: 10, color: T.amber, marginTop: 8, lineHeight: 1.4 }}>⚠ {r.gap}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 2: Board Narrative ══ */}
        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Scenario ITR', value: narrative.itr, color: T.red },
                { label: 'Climate VaR', value: narrative.vaR, color: T.orange },
                { label: 'Stranded Assets', value: narrative.stranded, color: T.amber },
              ].map(m => (
                <div key={m.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
                  <div style={{ fontFamily: T.mono, fontSize: 30, fontWeight: 700, color: m.color }}>{m.value}</div>
                  <div style={{ color: T.textSec, fontSize: 12, marginTop: 4 }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 28, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 4, height: 32, background: T.gold, borderRadius: 2 }} />
                <h2 style={{ color: T.navy, margin: 0, fontSize: 18 }}>{narrative.title}</h2>
              </div>
              <div style={{ fontFamily: T.font, fontSize: 13, color: T.navy, lineHeight: 1.9, whiteSpace: 'pre-line' }}>
                {narrative.text}
              </div>
            </div>

            {/* Emissions trajectory */}
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px', fontSize: 14 }}>WACI — Financed Emissions Trajectory vs. SBTi Target</h3>
              <p style={{ color: T.textSec, fontSize: 11, margin: '0 0 14px' }}>Portfolio-weighted average carbon intensity (tCO₂/$M revenue) · 50% reduction target by 2030</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={EMISSIONS_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="yr" tick={{ fontSize: 10 }} />
                  <YAxis domain={[80, 240]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => [`${v} tCO₂/$M`, n === 'actual' ? 'Actual WACI' : 'SBTi Target']} />
                  <Legend />
                  <Area type="monotone" dataKey="actual" name="Actual WACI" stroke={T.navy} fill={T.navy + '15'} strokeWidth={2} connectNulls={false} />
                  <Area type="monotone" dataKey="target" name="SBTi Target" stroke={T.green} fill={T.green + '11'} strokeWidth={2} strokeDasharray="6 3" />
                  <ReferenceLine x={2024} stroke={T.gold} strokeDasharray="3 3" label={{ value: 'Today', fill: T.gold, fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ══ TAB 3: Metrics Register ══ */}
        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ color: T.navy, margin: 0, fontSize: 15 }}>TCFD/ISSB Metrics Register — FY2025</h3>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ background: T.green + '22', color: T.green, padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                    {METRICS_TABLE.filter(m => m.status === 'VERIFIED').length} Verified
                  </span>
                  <span style={{ background: T.amber + '22', color: T.amber, padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                    {METRICS_TABLE.filter(m => m.status === 'ESTIMATED').length} Estimated
                  </span>
                  <span style={{ background: T.orange + '22', color: T.orange, padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                    {METRICS_TABLE.filter(m => m.status === 'IN PROGRESS').length} In Progress
                  </span>
                </div>
              </div>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    {['Metric', 'Value', 'Unit', 'Source Module', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', color: '#fff', textAlign: h === 'Metric' ? 'left' : 'center', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {METRICS_TABLE.map((m, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.bg : T.surface, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 14px', color: T.navy, fontSize: 11 }}>{m.metric}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: T.mono, fontWeight: 700, color: T.navy }}>{m.value}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', color: T.textSec, fontSize: 11 }}>{m.unit}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{ fontFamily: T.mono, fontSize: 10, background: T.navy + '11', color: T.navy, padding: '2px 6px', borderRadius: 3 }}>{m.source}</span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>{statusBadge(m.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ TAB 4: Export Centre ══ */}
        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
              {/* Export options */}
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 14 }}>Export Configuration</h3>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Format</div>
                  {['PDF (Board Report)', 'XBRL (Machine-Readable)', 'Excel (Metrics Tables)', 'Word (Narrative Draft)', 'JSON (API Payload)'].map(f => (
                    <label key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', cursor: 'pointer' }}>
                      <input type="radio" name="format" checked={exportFormat === f} onChange={() => setExportFormat(f)} />
                      <span style={{ fontSize: 12, color: T.navy }}>{f}</span>
                    </label>
                  ))}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Frameworks to Include</div>
                  {['TCFD (all pillars)', 'ISSB S2', 'CSRD ESRS E1', 'SFDR PAI Indicators', 'UK TPT Annex'].map(fw => (
                    <label key={fw} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked />
                      <span style={{ fontSize: 12, color: T.navy }}>{fw}</span>
                    </label>
                  ))}
                </div>

                <button style={{
                  width: '100%', padding: '12px', borderRadius: 8, border: 'none',
                  background: T.navy, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13
                }}>
                  Generate {exportFormat.split(' ')[0]} Report →
                </button>
              </div>

              {/* Report preview */}
              <div>
                <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 28, marginBottom: 16 }}>
                  <div style={{ borderBottom: `3px solid ${T.gold}`, paddingBottom: 16, marginBottom: 20 }}>
                    <div style={{ fontFamily: T.mono, fontSize: 10, color: T.gold, letterSpacing: 2, marginBottom: 6 }}>CONFIDENTIAL · BOARD REPORT · FY2025</div>
                    <h2 style={{ color: T.navy, margin: '0 0 4px', fontSize: 20 }}>Climate Transition Risk Disclosure</h2>
                    <p style={{ color: T.textSec, fontSize: 12, margin: 0 }}>Prepared in accordance with TCFD · IFRS S2 · CSRD ESRS E1 · As at 31 December 2025</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Climate VaR', v: '8.7%' },
                      { label: 'Portfolio ITR', v: '2.4°C' },
                      { label: 'WACI', v: '182' },
                      { label: 'GFANZ Align.', v: '61%' },
                    ].map(m => (
                      <div key={m.label} style={{ background: T.bg, borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 20, color: T.navy }}>{m.v}</div>
                        <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.8 }}>
                    <p><strong style={{ color: T.navy }}>Executive Summary.</strong> Our portfolio has demonstrated consistent improvement in climate transition alignment across FY2025. The composite 6-pillar transition score improved from 48 (Q1-24) to 58 (Q2-25), reflecting our engagement programme and portfolio rebalancing toward GFANZ-aligned assets.</p>
                    <p><strong style={{ color: T.navy }}>Material Risks.</strong> Energy sector holdings represent our highest transition risk exposure, with Shell PLC and BP PLC accounting for 58% of total stranded asset exposure. We have initiated board-level escalation with both companies and expect SBTi-aligned transition plans by Q3-2026.</p>
                    <p><strong style={{ color: T.navy }}>Progress Against Targets.</strong> WACI has reduced 19% from the 2020 baseline (225 → 182 tCO₂/$M), tracking the 50% reduction target by 2030. Portfolio ITR has improved from 2.9°C to 2.4°C, with a target of 1.8°C by 2030.</p>
                  </div>

                  <div style={{ marginTop: 20, padding: '12px 16px', background: T.border + '44', borderRadius: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Data Auditor', val: 'PwC LLP' },
                      { label: 'Methodology', val: 'TCFD / IFRS S2 / GHG Protocol' },
                      { label: 'Scenario Source', val: 'NGFS Phase 5 · IEA WEO 2024' },
                      { label: 'Assurance', val: 'Limited Assurance · ISAE 3000' },
                    ].map(f => (
                      <div key={f.label} style={{ fontSize: 10, color: T.textSec }}>
                        <strong style={{ color: T.navy }}>{f.label}:</strong> {f.val}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Table of contents preview */}
                <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24 }}>
                  <h3 style={{ color: T.navy, margin: '0 0 14px', fontSize: 13 }}>Report Contents</h3>
                  {[
                    { section: '1.', title: 'Executive Summary & KPI Dashboard', pages: '3–5' },
                    { section: '2.', title: 'TCFD Governance Disclosures (G1–G2)', pages: '6–9' },
                    { section: '3.', title: 'TCFD Strategy & Scenario Analysis (S1–S3)', pages: '10–18' },
                    { section: '4.', title: 'TCFD Risk Management (R1–R3)', pages: '19–24' },
                    { section: '5.', title: 'TCFD Metrics & Targets (M1–M3)', pages: '25–31' },
                    { section: '6.', title: 'ISSB S2 Supplementary Disclosures', pages: '32–38' },
                    { section: '7.', title: 'CSRD ESRS E1 Gap Analysis', pages: '39–45' },
                    { section: '8.', title: 'Engagement & Stewardship Report', pages: '46–52' },
                    { section: 'A.', title: 'Appendix: Full Metrics Register', pages: '53–57' },
                    { section: 'B.', title: 'Appendix: Methodology Notes', pages: '58–62' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < 9 ? `1px solid ${T.border}` : 'none' }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, fontWeight: 700, width: 24 }}>{row.section}</span>
                        <span style={{ fontSize: 12, color: T.navy }}>{row.title}</span>
                      </div>
                      <span style={{ fontFamily: T.mono, fontSize: 10, color: T.textMut }}>pp. {row.pages}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
