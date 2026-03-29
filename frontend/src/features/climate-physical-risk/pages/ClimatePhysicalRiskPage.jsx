import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  AreaChart, Area,
} from 'recharts';
import {
  COUNTRY_PHYSICAL_RISK,
  PHYSICAL_MULTIPLIERS,
  getCountryPhysicalRisk,
  NGFS_PHASE4,
} from '../../../services/climateRiskDataService';

/* ── Deterministic seed ──────────────────────────────────────────────────────── */
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ── Theme ───────────────────────────────────────────────────────────────────── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const ACCENT = '#0ea5e9';

/* ── Shared helpers ──────────────────────────────────────────────────────────── */
const scoreColor = v => v >= 7 ? T.red : v >= 4.5 ? T.amber : T.green;
const riskColor  = v => v >= 0.70 ? T.red : v >= 0.45 ? T.amber : T.green;

const Card = ({ children, style = {} }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, ...style }}>
    {children}
  </div>
);

const Stat = ({ label, value, sub, color }) => (
  <Card style={{ flex: 1 }}>
    <div style={{ color: T.textMut, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ color: color || ACCENT, fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ color: T.textSec, fontSize: 12, marginTop: 4 }}>{sub}</div>}
  </Card>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${T.border}`, marginBottom: 24, flexWrap: 'wrap' }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{
        padding: '9px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        background: active === t ? ACCENT : 'transparent',
        color: active === t ? '#fff' : T.textSec,
        borderRadius: '6px 6px 0 0',
        borderBottom: active === t ? `2px solid ${ACCENT}` : '2px solid transparent',
      }}>{t}</button>
    ))}
  </div>
);

const TH = ({ children, style = {} }) => (
  <th style={{ padding: '8px 12px', textAlign: 'left', color: T.textMut, fontSize: 11,
    fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: `1px solid ${T.border}`, ...style }}>
    {children}
  </th>
);
const TD = ({ children, style = {} }) => (
  <td style={{ padding: '7px 12px', color: T.textSec, fontSize: 13, borderBottom: `1px solid ${T.border}`, ...style }}>
    {children}
  </td>
);

const Badge = ({ val, fmt = v => v }) => (
  <span style={{ background: scoreColor(val) + '22', color: scoreColor(val),
    padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
    {fmt(val)}
  </span>
);

/* ── SSP Selector ────────────────────────────────────────────────────────────── */
const SSPS = ['SSP1-2.6', 'SSP2-4.5', 'SSP3-7.0', 'SSP5-8.5'];

const SSPSelector = ({ selected, onChange }) => (
  <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
    {SSPS.map(s => (
      <button key={s} onClick={() => onChange(s)} style={{
        padding: '6px 14px', borderRadius: 6, border: `1px solid ${selected === s ? ACCENT : T.border}`,
        background: selected === s ? ACCENT + '22' : 'transparent',
        color: selected === s ? ACCENT : T.textSec, fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}>{s}</button>
    ))}
  </div>
);

/* ── Trend data (24 months) ──────────────────────────────────────────────────── */
const TREND_DATA = Array.from({ length: 24 }, (_, i) => ({
  month: `M${String(i + 1).padStart(2, '0')}`,
  index: +(45 + sr(i * 7) * 30).toFixed(1),
}));

/* ── Return-period setup ─────────────────────────────────────────────────────── */
const RETURN_PERIODS = [10, 25, 50, 100, 200, 500];
const RP_MULTIPLIERS = [2.2, 3.8, 5.5, 8.0, 11.5, 16.0];
const REP_COUNTRIES = ['USA', 'Bangladesh', 'Netherlands'];
const RP_HAZARDS    = ['flood', 'cyclone', 'heatwave'];

const EAL_BASE = { USA: 0.18, Bangladesh: 0.52, Netherlands: 0.22 };

function buildRPLoss(country, hazard, rpIdx) {
  const base = EAL_BASE[country] || 0.20;
  const hm = { flood: 1.0, cyclone: 0.85, heatwave: 0.55 };
  return +(base * hm[hazard] * RP_MULTIPLIERS[rpIdx]).toFixed(2);
}

/* ── Hazard card data ────────────────────────────────────────────────────────── */
const HAZARD_META = [
  { id: 'flood',    label: 'Flood',        gdpT: 14.2, regions: 'South Asia, SE Asia, N. Europe' },
  { id: 'cyclone',  label: 'Cyclone',      gdpT: 8.5,  regions: 'W. Pacific, Gulf Coast, Bay of Bengal' },
  { id: 'wildfire', label: 'Wildfire',     gdpT: 3.8,  regions: 'Australia, W. USA, Mediterranean' },
  { id: 'heatwave', label: 'Heatwave',     gdpT: 11.6, regions: 'South Asia, MENA, Sub-Saharan Africa' },
  { id: 'drought',  label: 'Drought',      gdpT: 9.4,  regions: 'Sub-Saharan Africa, MENA, S. America' },
  { id: 'sealevel', label: 'Sea Level Rise', gdpT: 7.1, regions: 'Low-lying islands, coastal deltas, SE Asia' },
];

/* ── Adaptation actions ──────────────────────────────────────────────────────── */
const ADAPT_ACTIONS = [
  { action: 'Coastal Defense Infrastructure', cost: 180, effectiveness: 8.2, priority: 'Critical' },
  { action: 'Early Warning Systems',          cost: 12,  effectiveness: 9.1, priority: 'Critical' },
  { action: 'Drought-Resistant Crops',        cost: 45,  effectiveness: 7.5, priority: 'High'     },
  { action: 'Urban Heat Island Mitigation',   cost: 68,  effectiveness: 6.8, priority: 'High'     },
  { action: 'Upgraded Building Codes',        cost: 95,  effectiveness: 7.2, priority: 'High'     },
  { action: 'Climate Insurance Schemes',      cost: 32,  effectiveness: 8.5, priority: 'Medium'   },
];

/* ── Asset-level data ────────────────────────────────────────────────────────── */
const ASSET_TYPES = [
  { type: 'Commercial RE',      hazard: 'Flood/Heat',     eal: +(1.8 + sr(1)*1.2).toFixed(2),  insured: 62, var95: +(sr(11)*180+90).toFixed(0),  jurisdictions: 'NYC, London, Tokyo' },
  { type: 'Residential RE',     hazard: 'Flood/SLR',      eal: +(1.4 + sr(2)*1.0).toFixed(2),  insured: 55, var95: +(sr(12)*220+110).toFixed(0), jurisdictions: 'Miami, Mumbai, Shanghai' },
  { type: 'Infrastructure',     hazard: 'Flood/Wind',     eal: +(2.2 + sr(3)*1.4).toFixed(2),  insured: 38, var95: +(sr(13)*280+150).toFixed(0), jurisdictions: 'Bangladesh, Philippines' },
  { type: 'Agriculture',        hazard: 'Drought/Heat',   eal: +(3.1 + sr(4)*1.8).toFixed(2),  insured: 28, var95: +(sr(14)*160+80).toFixed(0),  jurisdictions: 'India, Brazil, MENA' },
  { type: 'Coastal Port',       hazard: 'Cyclone/SLR',    eal: +(2.8 + sr(5)*1.5).toFixed(2),  insured: 45, var95: +(sr(15)*200+120).toFixed(0), jurisdictions: 'Rotterdam, Singapore, HK' },
  { type: 'Power Generation',   hazard: 'Drought/Flood',  eal: +(1.9 + sr(6)*1.1).toFixed(2),  insured: 52, var95: +(sr(16)*150+75).toFixed(0),  jurisdictions: 'US Southeast, India, China' },
  { type: 'Industrial Facility',hazard: 'Flood/Cyclone',  eal: +(2.4 + sr(7)*1.3).toFixed(2),  insured: 48, var95: +(sr(17)*190+95).toFixed(0),  jurisdictions: 'Gulf Coast, SE Asia' },
  { type: 'Tourism',            hazard: 'Heat/SLR',       eal: +(1.6 + sr(8)*0.9).toFixed(2),  insured: 22, var95: +(sr(18)*120+60).toFixed(0),  jurisdictions: 'Maldives, Caribbean, GBR' },
];

/* ══════════════════════════════════════════════════════════════════════════════ */
export default function ClimatePhysicalRiskPage() {
  const [tab, setTab]         = useState('Portfolio Overview');
  const [ssp, setSsp]         = useState('SSP2-4.5');
  const [ngfsIdx, setNgfsIdx] = useState(5);

  const TABS = [
    'Portfolio Overview',
    'Hazard Deep Dive',
    'Return-Period Loss',
    'NGFS Amplifiers',
    'Adaptation & Resilience',
    'Asset-Level Exposure',
  ];

  /* Computed country table for Tab 1 */
  const countryRows = COUNTRY_PHYSICAL_RISK.map(c => getCountryPhysicalRisk(c.country, ssp))
    .filter(Boolean)
    .sort((a, b) => b.composite - a.composite)
    .slice(0, 15);

  /* Computed hazard card data for Tab 2 */
  const mult = PHYSICAL_MULTIPLIERS[ssp];
  const hazardCards = HAZARD_META.map(h => ({
    ...h,
    multiplier: mult[h.id].toFixed(2),
    highRiskCount: COUNTRY_PHYSICAL_RISK.filter(c => (c[h.id] || 0) > 0.30).length,
  }));

  /* Top-10 by highest flood for Tab 2 bar chart */
  const top10Flood = [...COUNTRY_PHYSICAL_RISK]
    .sort((a, b) => (b.flood * mult.flood) - (a.flood * mult.flood))
    .slice(0, 10)
    .map(c => ({ name: c.country, value: +((c.flood * mult.flood) * 10).toFixed(2) }));

  /* SSP × hazard matrix */
  const sspHazardMatrix = SSPS.map(s => {
    const m = PHYSICAL_MULTIPLIERS[s];
    return { ssp: s, flood: m.flood, cyclone: m.cyclone, wildfire: m.wildfire, heatwave: m.heatwave, drought: m.drought, sealevel: m.sealevel };
  });

  /* Return-period chart data (100yr) */
  const rp100Data = REP_COUNTRIES.flatMap(c =>
    RP_HAZARDS.map(h => ({ name: `${c} – ${h}`, value: buildRPLoss(c, h, 3) }))
  );

  /* NGFS bar data */
  const ngfsBarData = NGFS_PHASE4.map(s => ({ name: s.name.replace(' ', '\n'), score: s.physicalRisk, cat: s.category }));

  /* Adaptation table */
  const adaptRows = [...COUNTRY_PHYSICAL_RISK]
    .sort((a, b) => a.ndgain - b.ndgain)
    .slice(0, 20)
    .map(c => ({
      country: c.country, ndgain: c.ndgain, gdpExposed: c.gdpExposed,
      adaptCapacity: Math.round(c.ndgain * 0.92),
      resilGap: Math.round(100 - c.ndgain * 0.92),
    }));

  const adaptBarData = adaptRows.map(r => ({ name: r.country, gap: r.resilGap }));

  /* Shared tooltip style */
  const ttStyle = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12 };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '28px 32px', fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{ background: ACCENT + '22', borderRadius: 10, padding: '8px 12px', fontSize: 22 }}>🌍</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.text }}>Climate Physical Risk</h1>
            <div style={{ color: T.textSec, fontSize: 13, marginTop: 2 }}>
              IPCC AR6 · NGFS Phase IV · ND-GAIN Adaptation · Sovereign Spread Analysis
            </div>
          </div>
        </div>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* ── TAB 1: Portfolio Overview ─────────────────────────────────────────── */}
      {tab === 'Portfolio Overview' && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <Stat label="Composite Physical Risk" value="4.8 / 10" sub="Weighted portfolio average" color={T.amber} />
            <Stat label="At-Risk Asset Value"     value="$28.4T"  sub="SSP2-4.5 baseline exposure" color={T.red} />
            <Stat label="High-Risk Holdings"      value="34%"     sub="Score ≥ 7.0 threshold" color={T.amber} />
            <Stat label="Active Scenario"         value={ssp}     sub="IPCC AR6 pathway" color={ACCENT} />
          </div>

          <SSPSelector selected={ssp} onChange={setSsp} />

          {/* Country risk table */}
          <Card style={{ marginBottom: 24, overflowX: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: T.text }}>
              Top 15 Countries — Physical Risk Scores ({ssp})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH>Country</TH><TH>Region</TH><TH>Composite</TH>
                  <TH>Flood</TH><TH>Cyclone</TH><TH>Heatwave</TH>
                  <TH>Drought</TH><TH>Sea Level</TH><TH>ND-GAIN</TH>
                </tr>
              </thead>
              <tbody>
                {countryRows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : T.bg + '55' }}>
                    <TD style={{ fontWeight: 600, color: T.text }}>{r.country}</TD>
                    <TD>{r.region}</TD>
                    <TD><Badge val={r.composite} fmt={v => v.toFixed(1)} /></TD>
                    <TD style={{ color: riskColor(r.floodAdj) }}>{r.floodAdj.toFixed(2)}</TD>
                    <TD style={{ color: riskColor(r.cycloneAdj) }}>{r.cycloneAdj.toFixed(2)}</TD>
                    <TD style={{ color: riskColor(r.heatwaveAdj) }}>{r.heatwaveAdj.toFixed(2)}</TD>
                    <TD style={{ color: riskColor(r.droughtAdj) }}>{r.droughtAdj.toFixed(2)}</TD>
                    <TD style={{ color: riskColor(r.sealevelAdj) }}>{r.sealevelAdj.toFixed(2)}</TD>
                    <TD style={{ color: r.ndgain < 45 ? T.red : r.ndgain < 60 ? T.amber : T.green }}>
                      {r.ndgain.toFixed(1)}
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* 24-month trend */}
          <Card>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Portfolio Physical Risk Index — 24-Month Trend</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={TREND_DATA}>
                <defs>
                  <linearGradient id="phRiskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={ACCENT} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={ACCENT} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: T.textMut, fontSize: 11 }} />
                <YAxis domain={[40, 80]} tick={{ fill: T.textMut, fontSize: 11 }} />
                <Tooltip contentStyle={ttStyle} />
                <Area type="monotone" dataKey="index" stroke={ACCENT} fill="url(#phRiskGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* ── TAB 2: Hazard Deep Dive ───────────────────────────────────────────── */}
      {tab === 'Hazard Deep Dive' && (
        <div>
          <SSPSelector selected={ssp} onChange={setSsp} />

          {/* 6 hazard cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
            {hazardCards.map((h, i) => (
              <Card key={i}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>{h.label}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: T.textMut, fontSize: 12 }}>SSP Multiplier</span>
                  <span style={{ color: ACCENT, fontWeight: 700 }}>{h.multiplier}×</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: T.textMut, fontSize: 12 }}>High-Risk Countries</span>
                  <span style={{ color: T.amber, fontWeight: 700 }}>{h.highRiskCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: T.textMut, fontSize: 12 }}>GDP Exposed</span>
                  <span style={{ color: T.red, fontWeight: 700 }}>${h.gdpT}T</span>
                </div>
                <div style={{ color: T.textSec, fontSize: 11, marginTop: 6 }}>{h.regions}</div>
              </Card>
            ))}
          </div>

          {/* Top 10 by flood */}
          <Card style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
              Top 10 Countries — Flood Adjusted Score ({ssp})
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={top10Flood} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 10]} tick={{ fill: T.textMut, fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: T.textSec, fontSize: 11 }} width={80} />
                <Tooltip contentStyle={ttStyle} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {top10Flood.map((d, i) => (
                    <Cell key={i} fill={d.value >= 7 ? T.red : d.value >= 5 ? T.amber : T.green} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* SSP × hazard matrix */}
          <Card style={{ overflowX: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>SSP × Hazard Multiplier Matrix</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH>Scenario</TH>
                  {['Flood','Cyclone','Wildfire','Heatwave','Drought','Sea Level'].map(h => <TH key={h}>{h}</TH>)}
                </tr>
              </thead>
              <tbody>
                {sspHazardMatrix.map((row, i) => (
                  <tr key={i} style={{ background: row.ssp === ssp ? ACCENT + '11' : 'transparent' }}>
                    <TD style={{ fontWeight: 600, color: row.ssp === ssp ? ACCENT : T.text }}>{row.ssp}</TD>
                    {['flood','cyclone','wildfire','heatwave','drought','sealevel'].map(h => (
                      <TD key={h} style={{ color: row[h] >= 1.5 ? T.red : row[h] >= 1.1 ? T.amber : T.green }}>
                        {row[h].toFixed(2)}×
                      </TD>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ── TAB 3: Return-Period Loss Curves ─────────────────────────────────── */}
      {tab === 'Return-Period Loss' && (
        <div>
          {/* EAL explanation */}
          <Card style={{ marginBottom: 20, borderLeft: `4px solid ${ACCENT}` }}>
            <div style={{ fontWeight: 700, color: ACCENT, marginBottom: 6 }}>Methodology — Expected Annual Loss</div>
            <div style={{ color: T.textSec, fontSize: 13 }}>
              Annualised Expected Loss = Σ (Loss at Return Period / Return Period Interval).
              Return-period multipliers applied: 10yr×2.2 · 25yr×3.8 · 50yr×5.5 · 100yr×8.0 · 200yr×11.5 · 500yr×16.0
            </div>
          </Card>

          {/* 100yr bar chart */}
          <Card style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
              100-Year Return Period Loss % by Country & Hazard
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={rp100Data} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" unit="%" tick={{ fill: T.textMut, fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: T.textSec, fontSize: 11 }} width={120} />
                <Tooltip contentStyle={ttStyle} formatter={v => [`${v}%`, 'Loss']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {rp100Data.map((d, i) => (
                    <Cell key={i} fill={d.value >= 4 ? T.red : d.value >= 2 ? T.amber : T.green} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Full return-period matrix */}
          <Card style={{ overflowX: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
              Full Return-Period Loss Matrix — % of Asset Value
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH>Country</TH><TH>Hazard</TH>
                  {RETURN_PERIODS.map(r => <TH key={r}>{r}yr</TH>)}
                </tr>
              </thead>
              <tbody>
                {REP_COUNTRIES.flatMap(c =>
                  RP_HAZARDS.map((h, hi) => (
                    <tr key={`${c}-${h}`} style={{ background: hi === 0 ? T.bg + '44' : 'transparent' }}>
                      {hi === 0
                        ? <td rowSpan={3} style={{ padding: '8px 12px', fontWeight: 700, color: T.text, fontSize: 13,
                            verticalAlign: 'middle', borderBottom: `1px solid ${T.border}` }}>{c}</td>
                        : null}
                      <TD style={{ color: T.textSec, textTransform: 'capitalize' }}>{h}</TD>
                      {RETURN_PERIODS.map((_, rpIdx) => {
                        const v = buildRPLoss(c, h, rpIdx);
                        return (
                          <TD key={rpIdx} style={{ color: v >= 4 ? T.red : v >= 2 ? T.amber : T.green, fontWeight: 600 }}>
                            {v}%
                          </TD>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ── TAB 4: NGFS Physical Risk Amplifiers ─────────────────────────────── */}
      {tab === 'NGFS Amplifiers' && (
        <div>
          {/* 3 summary stats */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <Stat label="Hottest Scenario (Current Policies)" value="3.0°C" sub="NGFS Phase IV upper bound" color={T.red} />
            <Stat label="Max Physical Risk Score"             value="9.5 / 10" sub="Current Policies scenario"   color={T.red} />
            <Stat label="Max Sovereign Spread Widening"       value="160 bps"  sub="Emerging markets, 2050"     color={T.amber} />
          </div>

          {/* NGFS scenario table */}
          <Card style={{ marginBottom: 24, overflowX: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>NGFS Phase IV — Physical Risk Scenarios</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH>#</TH><TH>Scenario</TH><TH>Category</TH><TH>Temp</TH>
                  <TH>Phys. Risk</TH><TH>SSP Equiv.</TH><TH>GDP Impact 2050</TH><TH>Spread (bps)</TH>
                </tr>
              </thead>
              <tbody>
                {NGFS_PHASE4.map((s, i) => (
                  <tr key={i}
                    onClick={() => setNgfsIdx(i)}
                    style={{
                      cursor: 'pointer',
                      background: ngfsIdx === i ? ACCENT + '18' : i % 2 === 0 ? 'transparent' : T.bg + '44',
                    }}>
                    <TD style={{ color: T.textMut }}>{i + 1}</TD>
                    <TD style={{ fontWeight: 600, color: ngfsIdx === i ? ACCENT : T.text }}>{s.name}</TD>
                    <TD>
                      <span style={{
                        padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                        background: s.category === 'Orderly' ? T.green + '22' : s.category === 'Disorderly' ? T.amber + '22' : T.red + '22',
                        color: s.category === 'Orderly' ? T.green : s.category === 'Disorderly' ? T.amber : T.red,
                      }}>{s.category}</span>
                    </TD>
                    <TD style={{ color: T.red, fontWeight: 600 }}>{s.temp}°C</TD>
                    <TD><Badge val={s.physicalRisk} fmt={v => v.toFixed(1)} /></TD>
                    <TD style={{ color: T.textSec }}>{s.sspEquiv}</TD>
                    <TD style={{ color: T.red, fontWeight: 600 }}>{s.gdpImpact2050}%</TD>
                    <TD style={{ color: T.amber, fontWeight: 600 }}>{s.sovereignSpread}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* NGFS bar chart */}
          <Card style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Physical Risk Score by NGFS Scenario</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ngfsBarData}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: T.textMut, fontSize: 10 }} />
                <YAxis domain={[0, 10]} tick={{ fill: T.textMut, fontSize: 11 }} />
                <Tooltip contentStyle={ttStyle} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {ngfsBarData.map((d, i) => (
                    <Cell key={i} fill={d.score >= 7 ? T.red : d.score >= 4 ? T.amber : T.green} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Cross-reference panel */}
          {(() => {
            const sel = NGFS_PHASE4[ngfsIdx];
            const m = PHYSICAL_MULTIPLIERS[sel.sspEquiv] || PHYSICAL_MULTIPLIERS['SSP2-4.5'];
            return (
              <Card style={{ borderLeft: `4px solid ${ACCENT}` }}>
                <div style={{ fontWeight: 700, color: ACCENT, marginBottom: 10 }}>
                  Cross-Reference: {sel.name} → {sel.sspEquiv}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  {Object.entries(m).map(([h, v]) => (
                    <div key={h} style={{ background: T.bg, borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ color: T.textMut, fontSize: 11, textTransform: 'uppercase' }}>{h}</div>
                      <div style={{ color: v >= 1.5 ? T.red : v >= 1.1 ? T.amber : T.green, fontSize: 18, fontWeight: 700 }}>
                        {v.toFixed(2)}×
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })()}
        </div>
      )}

      {/* ── TAB 5: Adaptation & Resilience ───────────────────────────────────── */}
      {tab === 'Adaptation & Resilience' && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <Stat label="Avg Global Adaptation Score" value="58"        sub="ND-GAIN index (0–100)" color={T.amber} />
            <Stat label="Countries Score < 40"        value="12"        sub="In dataset — lowest resilience" color={T.red} />
            <Stat label="Adaptation Finance Gap"      value="$400bn/yr" sub="Annual shortfall vs. need"  color={T.red} />
          </div>

          {/* Adaptation table */}
          <Card style={{ marginBottom: 24, overflowX: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
              20 Countries — ND-GAIN Adaptation & Resilience Gap
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH>Country</TH><TH>ND-GAIN Score</TH><TH>GDP Exposed ($bn)</TH>
                  <TH>Adapt. Capacity</TH><TH>Resilience Gap</TH>
                </tr>
              </thead>
              <tbody>
                {adaptRows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : T.bg + '55' }}>
                    <TD style={{ fontWeight: 600, color: T.text }}>{r.country}</TD>
                    <TD style={{ color: r.ndgain < 45 ? T.red : r.ndgain < 60 ? T.amber : T.green, fontWeight: 600 }}>
                      {r.ndgain.toFixed(1)}
                    </TD>
                    <TD>${r.gdpExposed.toLocaleString()}</TD>
                    <TD>{r.adaptCapacity}</TD>
                    <TD style={{ color: r.resilGap > 60 ? T.red : r.resilGap > 40 ? T.amber : T.green, fontWeight: 600 }}>
                      {r.resilGap}
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Resilience gap bar chart */}
          <Card style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Resilience Gap (100 − Adaptation Capacity)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={adaptBarData} layout="vertical" margin={{ left: 90 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: T.textMut, fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} width={90} />
                <Tooltip contentStyle={ttStyle} />
                <Bar dataKey="gap" radius={[0, 4, 4, 0]}>
                  {adaptBarData.map((d, i) => (
                    <Cell key={i} fill={d.gap > 60 ? T.red : d.gap > 40 ? T.amber : T.green} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Adaptation actions */}
          <Card style={{ overflowX: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Adaptation Actions — Cost, Effectiveness & Priority</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH>Action</TH><TH>Cost ($bn)</TH><TH>Effectiveness (0-10)</TH><TH>Priority</TH>
                </tr>
              </thead>
              <tbody>
                {ADAPT_ACTIONS.map((a, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : T.bg + '44' }}>
                    <TD style={{ fontWeight: 600, color: T.text }}>{a.action}</TD>
                    <TD>${a.cost}</TD>
                    <TD>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ height: 6, width: `${a.effectiveness * 10}%`, background: a.effectiveness >= 8 ? T.green : T.amber,
                          borderRadius: 3, minWidth: 20 }} />
                        <span style={{ color: T.textSec, fontSize: 12 }}>{a.effectiveness}</span>
                      </div>
                    </TD>
                    <TD>
                      <span style={{
                        padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                        background: a.priority === 'Critical' ? T.red + '22' : a.priority === 'High' ? T.amber + '22' : T.teal + '22',
                        color: a.priority === 'Critical' ? T.red : a.priority === 'High' ? T.amber : T.teal,
                      }}>{a.priority}</span>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ── TAB 6: Asset-Level Exposure ──────────────────────────────────────── */}
      {tab === 'Asset-Level Exposure' && (
        <div>
          {/* Cross-module callout */}
          <div style={{
            background: T.teal + '18', border: `1px solid ${T.teal}`, borderRadius: 10,
            padding: '12px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 18 }}>📊</span>
            <span style={{ color: T.teal, fontWeight: 600, fontSize: 14 }}>
              View Portfolio Climate VaR → /portfolio-climate-var
            </span>
            <span style={{ color: T.textSec, fontSize: 12, marginLeft: 8 }}>
              Deep-dive into Value-at-Risk by asset class, scenario and time horizon
            </span>
          </div>

          {/* Asset exposure table */}
          <Card style={{ marginBottom: 24, overflowX: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Asset-Level Physical Risk Exposure</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH>Asset Type</TH><TH>Primary Hazard</TH><TH>EAL %</TH>
                  <TH>Insured %</TH><TH>Physical VaR 95% ($bn)</TH><TH>Key Jurisdictions</TH>
                </tr>
              </thead>
              <tbody>
                {ASSET_TYPES.map((a, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : T.bg + '44' }}>
                    <TD style={{ fontWeight: 600, color: T.text }}>{a.type}</TD>
                    <TD style={{ color: T.textSec }}>{a.hazard}</TD>
                    <TD style={{ color: a.eal >= 3 ? T.red : a.eal >= 2 ? T.amber : T.green, fontWeight: 600 }}>{a.eal}%</TD>
                    <TD style={{ color: a.insured < 35 ? T.red : a.insured < 50 ? T.amber : T.green }}>{a.insured}%</TD>
                    <TD style={{ color: ACCENT, fontWeight: 600 }}>${a.var95}</TD>
                    <TD style={{ color: T.textMut, fontSize: 12 }}>{a.jurisdictions}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Physical VaR bar chart */}
          <Card>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Physical VaR (95%) by Asset Type ($bn)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ASSET_TYPES.map(a => ({ name: a.type.replace(' ', '\n'), var95: a.var95 }))}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: T.textMut, fontSize: 10 }} />
                <YAxis tick={{ fill: T.textMut, fontSize: 11 }} />
                <Tooltip contentStyle={ttStyle} formatter={v => [`$${v}bn`, 'Physical VaR 95%']} />
                <Bar dataKey="var95" radius={[4, 4, 0, 0]}>
                  {ASSET_TYPES.map((a, i) => (
                    <Cell key={i} fill={a.var95 >= 250 ? T.red : a.var95 >= 150 ? T.amber : ACCENT} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
}
