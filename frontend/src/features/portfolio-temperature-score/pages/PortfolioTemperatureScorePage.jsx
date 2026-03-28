import React, { useState } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';

// ── Theme ────────────────────────────────────────────────────────────────────
const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7',
  border:'#e5e0d8', borderL:'#d5cfc5',
  navy:'#1b3a5c', navyL:'#2c5a8c',
  gold:'#c5a96a', goldL:'#d4be8a',
  sage:'#5a8a6a', sageL:'#7ba67d',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  card:'0 1px 4px rgba(27,58,92,0.06)',
  cardH:'0 4px 16px rgba(27,58,92,0.1)',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

// ── Deterministic seed helper ─────────────────────────────────────────────────
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── Static data ───────────────────────────────────────────────────────────────

const TEMP_DISTRIBUTION = [
  { range: '≤1.5°C', count: 8, pct: 16, color: T.green },
  { range: '1.5–2°C', count: 14, pct: 28, color: '#4ade80' },
  { range: '2–2.5°C', count: 12, pct: 24, color: T.amber },
  { range: '2.5–3°C', count: 9, pct: 18, color: '#f97316' },
  { range: '>3°C', count: 7, pct: 14, color: T.red },
];

const PACTA_SECTORS = [
  {
    sector: 'Power',
    tempScore: 3.8,
    current: 'Coal: 45% (2,840 MW)',
    target: '0% coal by 2030 (NGFS NZ)',
    aligned: 890,
    portfolio: 2840,
    gap: '+1,950 MW',
    unit: 'MW',
    radarScore: 28,
  },
  {
    sector: 'Automotive',
    tempScore: 2.4,
    current: 'EV share: 38%',
    target: '85% EV by 2030 (NGFS NZ)',
    aligned: 52,
    portfolio: 38,
    gap: '-14pp',
    unit: '%',
    radarScore: 55,
  },
  {
    sector: 'Oil & Gas',
    tempScore: 3.2,
    current: '840 mboe/d production',
    target: 'IEA NZE: 690 mboe/d by 2025',
    aligned: 690,
    portfolio: 840,
    gap: '+150 mboe/d',
    unit: 'mboe/d',
    radarScore: 35,
  },
  {
    sector: 'Steel',
    tempScore: 2.8,
    current: 'EAF share: 42%',
    target: '58% EAF by 2030',
    aligned: 58,
    portfolio: 42,
    gap: '-16pp',
    unit: '%',
    radarScore: 48,
  },
  {
    sector: 'Cement',
    tempScore: 2.6,
    current: 'Clinker ratio: 74%',
    target: '≤65% clinker ratio by 2030',
    aligned: 65,
    portfolio: 74,
    gap: '+9pp',
    unit: '%',
    radarScore: 52,
  },
];

const RADAR_DATA = PACTA_SECTORS.map(s => ({ subject: s.sector, score: s.radarScore, fullMark: 100 }));

const HOLDINGS_ALIGNED = [
  { rank: 1, name: 'Ørsted', temp: 1.2, sector: 'Power', weight: 1.8, sbti: 'Approved', engagement: 'Monitoring' },
  { rank: 2, name: 'NextEra Energy', temp: 1.3, sector: 'Power', weight: 2.1, sbti: 'Approved', engagement: 'Monitoring' },
  { rank: 3, name: 'Tesla', temp: 1.4, sector: 'Automotive', weight: 1.5, sbti: 'Committed', engagement: 'Monitoring' },
  { rank: 4, name: 'Vestas', temp: 1.4, sector: 'Power', weight: 0.9, sbti: 'Approved', engagement: 'Monitoring' },
  { rank: 5, name: 'Siemens Energy', temp: 1.5, sector: 'Industrials', weight: 1.1, sbti: 'Approved', engagement: 'Monitoring' },
  { rank: 6, name: 'Iberdrola', temp: 1.6, sector: 'Power', weight: 2.4, sbti: 'Approved', engagement: 'Monitoring' },
  { rank: 7, name: 'Enphase Energy', temp: 1.7, sector: 'Technology', weight: 0.7, sbti: 'Committed', engagement: 'Monitoring' },
  { rank: 8, name: 'First Solar', temp: 1.8, sector: 'Power', weight: 0.8, sbti: 'Approved', engagement: 'Monitoring' },
  { rank: 9, name: 'Enel SpA', temp: 1.9, sector: 'Power', weight: 3.3, sbti: 'Approved', engagement: 'Monitoring' },
  { rank: 10, name: 'BYD Co Ltd', temp: 2.0, sector: 'Automotive', weight: 2.6, sbti: 'Committed', engagement: 'Active' },
];

const HOLDINGS_MISALIGNED = [
  { rank: 1, name: 'Saudi Aramco', temp: 4.8, sector: 'Oil & Gas', weight: 1.9, sbti: 'None', engagement: 'Priority 2' },
  { rank: 2, name: 'Glencore', temp: 4.2, sector: 'Mining', weight: 2.8, sbti: 'None', engagement: 'Priority 1' },
  { rank: 3, name: 'China Shenhua', temp: 4.1, sector: 'Power', weight: 1.2, sbti: 'None', engagement: 'Priority 5' },
  { rank: 4, name: 'Thyssenkrupp Steel', temp: 3.8, sector: 'Steel', weight: 1.4, sbti: 'None', engagement: 'Priority 3' },
  { rank: 5, name: 'Lufthansa', temp: 3.6, sector: 'Aviation', weight: 1.6, sbti: 'Committed', engagement: 'Priority 4' },
  { rank: 6, name: 'Vale SA', temp: 3.5, sector: 'Mining', weight: 1.3, sbti: 'None', engagement: 'Queued' },
  { rank: 7, name: 'Nippon Steel', temp: 3.4, sector: 'Steel', weight: 1.9, sbti: 'None', engagement: 'Queued' },
];

const ENGAGEMENT_QUEUE = [
  { priority: 1, name: 'Glencore', weight: 2.8, temp: 4.2, sector: 'Mining', action: 'Coal phase-out timeline request', deadline: 'Q2 2026', status: 'In Progress' },
  { priority: 2, name: 'Saudi Aramco', weight: 1.9, temp: 4.8, sector: 'Oil & Gas', action: 'Scope 3 targets request', deadline: 'Q3 2026', status: 'Initiated' },
  { priority: 3, name: 'Thyssenkrupp Steel', weight: 1.4, temp: 3.8, sector: 'Steel', action: 'Green steel transition plan', deadline: 'Q3 2026', status: 'Initiated' },
  { priority: 4, name: 'Lufthansa', weight: 1.6, temp: 3.6, sector: 'Aviation', action: 'SAF adoption roadmap', deadline: 'Q4 2026', status: 'Queued' },
  { priority: 5, name: 'China Shenhua', weight: 1.2, temp: 4.1, sector: 'Power', action: 'Coal capacity reduction plan', deadline: 'Q4 2026', status: 'Queued' },
  { priority: 6, name: 'Vale SA', weight: 1.3, temp: 3.5, sector: 'Mining', action: 'Net-zero roadmap by 2050', deadline: 'Q1 2027', status: 'Queued' },
  { priority: 7, name: 'Nippon Steel', weight: 1.9, temp: 3.4, sector: 'Steel', action: 'EAF transition investment plan', deadline: 'Q1 2027', status: 'Queued' },
  { priority: 8, name: 'AES Corporation', weight: 3.0, temp: 3.1, sector: 'Power', action: 'Coal exit accelerated schedule', deadline: 'Q2 2027', status: 'Queued' },
  { priority: 9, name: 'MSC Group', weight: 1.6, temp: 3.3, sector: 'Shipping', action: 'Zero-carbon fuel pathway', deadline: 'Q2 2027', status: 'Queued' },
  { priority: 10, name: 'Delta Air Lines', weight: 1.2, temp: 3.2, sector: 'Aviation', action: 'SAF blending commitment 10%', deadline: 'Q3 2027', status: 'Queued' },
];

const SCENARIOS = [
  { name: 'Current Portfolio', temp: 2.7, color: T.amber },
  { name: 'Divest Top 3 Misaligned', temp: 2.4, color: '#f97316' },
  { name: '+10% Renewable Allocation', temp: 2.5, color: T.sage },
  { name: 'SBTi Engagement (>3°C)', temp: 2.3, color: T.navy },
  { name: 'Combined Paris-Aligned', temp: 1.7, color: T.green },
  { name: 'Paris 1.5°C Target', temp: 1.5, color: '#4ade80' },
];

// ── Style helpers ─────────────────────────────────────────────────────────────
const s = {
  page: { background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: '24px' },
  header: { marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.3px' },
  sub: { fontSize: 13, color: T.textSec, marginTop: 4 },
  badgeRow: { display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  badge: (bg, col) => ({ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: bg, color: col, border: `1px solid ${col}33` }),
  tabs: { display: 'flex', gap: 0, borderBottom: `1px solid ${T.border}`, marginBottom: 24 },
  tab: (active) => ({
    padding: '9px 18px', fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? T.navy : T.textSec, cursor: 'pointer',
    borderBottom: active ? `2px solid ${T.navy}` : '2px solid transparent',
    background: 'none', border: 'none', outline: 'none',
    transition: 'color 0.15s',
  }),
  grid: (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 20 }),
  card: (extra) => ({ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, boxShadow: T.card, ...extra }),
  kpiVal: { fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1 },
  kpiLabel: { fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 6 },
  kpiSub: { fontSize: 12, color: T.textSec, marginTop: 6 },
  sectionLabel: { fontSize: 11, fontWeight: 600, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { padding: '7px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '7px 10px', borderBottom: `1px solid ${T.borderL}`, verticalAlign: 'middle' },
};

// ── Temperature colour helper ─────────────────────────────────────────────────
const tempColor = (t) => {
  if (t <= 1.5) return T.green;
  if (t <= 2.0) return '#4ade80';
  if (t <= 2.5) return T.amber;
  if (t <= 3.0) return '#f97316';
  return T.red;
};

// ── Gauge bar component ───────────────────────────────────────────────────────
const TempGauge = ({ value, max = 5 }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: T.borderL, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: tempColor(value), borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: tempColor(value), minWidth: 36 }}>{value}°C</span>
    </div>
  );
};

// ── Temperature spectrum bar ──────────────────────────────────────────────────
const SpectrumBar = ({ value }) => {
  const pct = ((value - 1.0) / (5.0 - 1.0)) * 100;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ position: 'relative', height: 20, borderRadius: 10, overflow: 'hidden',
        background: 'linear-gradient(to right, #06c896, #4ade80, #f0a828, #f97316, #f04060)' }}>
        <div style={{
          position: 'absolute', top: 0, left: `${pct}%`, transform: 'translateX(-50%)',
          width: 4, height: '100%', background: '#fff', borderRadius: 2, boxShadow: '0 0 6px rgba(255,255,255,0.8)',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMut, marginTop: 3 }}>
        <span>1.0°C</span><span>1.5°C (Paris)</span><span>2°C</span><span>3°C</span><span>5°C</span>
      </div>
    </div>
  );
};

// ── Custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: T.textSec, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.text }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ── TAB 1: Portfolio Temperature Score ────────────────────────────────────────
const TabTemperatureScore = () => (
  <div>
    {/* KPI row */}
    <div style={s.grid(4)}>
      <div style={s.card()}>
        <div style={{ ...s.kpiVal, color: T.amber }}>2.7°C</div>
        <div style={s.kpiLabel}>Portfolio Implied Temp Rise</div>
        <div style={s.kpiSub}>Previous: 3.1°C — improved 0.4°C</div>
      </div>
      <div style={s.card()}>
        <div style={{ ...s.kpiVal, color: T.textSec }}>2.9°C</div>
        <div style={s.kpiLabel}>Peer Median</div>
        <div style={s.kpiSub}>Portfolio outperforms peers by 0.2°C</div>
      </div>
      <div style={s.card()}>
        <div style={{ ...s.kpiVal, color: T.green }}>≤1.5°C</div>
        <div style={s.kpiLabel}>Paris-Aligned Target</div>
        <div style={s.kpiSub}>Net Zero target: 1.5°C by 2050</div>
      </div>
      <div style={s.card()}>
        <div style={{ ...s.kpiVal, color: T.sage }}>50</div>
        <div style={s.kpiLabel}>Holdings Assessed</div>
        <div style={s.kpiSub}>PACTA + SBTi methodology</div>
      </div>
    </div>

    {/* Spectrum bar */}
    <div style={s.card({ marginBottom: 20 })}>
      <div style={s.sectionLabel}>Portfolio Temperature Position</div>
      <SpectrumBar value={2.7} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: T.amber }} />
        <span style={{ fontSize: 12, color: T.textSec }}>Portfolio at <strong style={{ color: T.amber }}>2.7°C</strong> — 1.2°C above Paris 1.5°C target</span>
      </div>
    </div>

    {/* Distribution */}
    <div style={s.grid(2)}>
      <div style={s.card()}>
        <div style={s.sectionLabel}>Temperature Distribution — 50 Holdings</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={TEMP_DISTRIBUTION} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="range" tick={{ fill: T.textSec, fontSize: 11 }} axisLine={{ stroke: T.border }} tickLine={false} />
            <YAxis tick={{ fill: T.textSec, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {TEMP_DISTRIBUTION.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={s.card()}>
        <div style={s.sectionLabel}>Alignment Breakdown</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {TEMP_DISTRIBUTION.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: d.color, flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: T.text, flex: 1 }}>{d.range}</div>
              <div style={{ fontSize: 12, color: T.textSec, minWidth: 60 }}>{d.count} holdings</div>
              <div style={{ flex: 1, height: 6, background: T.borderL, borderRadius: 3 }}>
                <div style={{ width: `${d.pct}%`, height: '100%', background: d.color, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: d.color, minWidth: 36, textAlign: 'right' }}>{d.pct}%</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: '10px 12px', background: T.bg, borderRadius: 6, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, color: T.textSec }}>Paris-aligned (≤1.5°C)</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.green, marginTop: 2 }}>8 holdings — 16% of portfolio</div>
          <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>Misaligned (&gt;3°C): 7 holdings — 14% of portfolio</div>
        </div>
      </div>
    </div>
  </div>
);

// ── TAB 2: PACTA Sector Analysis ──────────────────────────────────────────────
const TabPactaSectors = () => (
  <div>
    <div style={s.grid(2)}>
      <div style={s.card()}>
        <div style={s.sectionLabel}>Sector Alignment Radar — PACTA Score (0–100)</div>
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={RADAR_DATA} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke={T.border} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: T.textSec, fontSize: 12 }} />
            <Radar name="Portfolio" dataKey="score" stroke={T.sage} fill={T.sage} fillOpacity={0.2} dot={{ fill: T.sage, r: 3 }} />
            <Radar name="Paris-Aligned" dataKey="fullMark" stroke={T.green} fill="none" strokeDasharray="4 4" strokeOpacity={0.4} />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 11, color: T.textMut, textAlign: 'center' }}>Higher score = closer to Paris alignment</div>
      </div>
      <div style={s.card()}>
        <div style={s.sectionLabel}>Sector Temperature Contributions</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={PACTA_SECTORS} layout="vertical" margin={{ top: 4, right: 40, left: 60, bottom: 4 }}>
            <XAxis type="number" domain={[0, 5]} tick={{ fill: T.textSec, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="sector" type="category" tick={{ fill: T.textSec, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="tempScore" name="Temp Score (°C)" radius={[0, 3, 3, 0]}>
              {PACTA_SECTORS.map((d, i) => <Cell key={i} fill={tempColor(d.tempScore)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Sector detail cards */}
    <div style={s.sectionLabel}>Sector-Level PACTA Detail</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {PACTA_SECTORS.map((sec, i) => (
        <div key={i} style={{ ...s.card(), display: 'grid', gridTemplateColumns: '160px 1fr 1fr 1fr 120px', gap: 16, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{sec.sector}</div>
            <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>PACTA sector</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec }}>Current Portfolio</div>
            <div style={{ fontSize: 13, color: T.text, marginTop: 2 }}>{sec.current}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec }}>Target</div>
            <div style={{ fontSize: 13, color: T.textSec, marginTop: 2 }}>{sec.target}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec }}>Gap</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.red, marginTop: 2 }}>{sec.gap}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textSec }}>Temp Contribution</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: tempColor(sec.tempScore), marginTop: 2 }}>{sec.tempScore}°C</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── TAB 3: Holdings Ranking ───────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const colorMap = {
    'Approved': { bg: '#06c89622', color: T.green },
    'Committed': { bg: '#0ea5e922', color: T.sage },
    'None': { bg: '#f0406022', color: T.red },
  };
  const c = colorMap[status] || { bg: T.borderL, color: T.textSec };
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3, background: c.bg, color: c.color }}>
      {status}
    </span>
  );
};

const EngagementBadge = ({ status }) => {
  const isActive = status.startsWith('Priority');
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3,
      background: isActive ? '#f0a82822' : T.borderL,
      color: isActive ? T.amber : T.textMut }}>
      {status}
    </span>
  );
};

const TabHoldingsRanking = () => (
  <div>
    <div style={s.grid(2)}>
      {/* Best aligned */}
      <div style={s.card()}>
        <div style={{ ...s.sectionLabel, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: T.green }}>▲</span> Top Aligned Holdings (≤2.0°C)
        </div>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>#</th>
                <th style={s.th}>Company</th>
                <th style={s.th}>Sector</th>
                <th style={s.th}>Wt%</th>
                <th style={s.th}>SBTi</th>
                <th style={s.th}>Temperature</th>
              </tr>
            </thead>
            <tbody>
              {HOLDINGS_ALIGNED.map((h, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : `${T.surfaceH}44` }}>
                  <td style={{ ...s.td, color: T.textMut }}>{h.rank}</td>
                  <td style={{ ...s.td, fontWeight: 600, color: T.text }}>{h.name}</td>
                  <td style={{ ...s.td, color: T.textSec }}>{h.sector}</td>
                  <td style={{ ...s.td, color: T.textSec }}>{h.weight}%</td>
                  <td style={s.td}><StatusBadge status={h.sbti} /></td>
                  <td style={{ ...s.td, minWidth: 110 }}><TempGauge value={h.temp} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Most misaligned */}
      <div style={s.card()}>
        <div style={{ ...s.sectionLabel, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: T.red }}>▼</span> Most Misaligned Holdings (&gt;3.0°C)
        </div>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>#</th>
                <th style={s.th}>Company</th>
                <th style={s.th}>Sector</th>
                <th style={s.th}>Wt%</th>
                <th style={s.th}>SBTi</th>
                <th style={s.th}>Temperature</th>
              </tr>
            </thead>
            <tbody>
              {HOLDINGS_MISALIGNED.map((h, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : `${T.surfaceH}44` }}>
                  <td style={{ ...s.td, color: T.textMut }}>{h.rank}</td>
                  <td style={{ ...s.td, fontWeight: 600, color: T.text }}>{h.name}</td>
                  <td style={{ ...s.td, color: T.textSec }}>{h.sector}</td>
                  <td style={{ ...s.td, color: T.textSec }}>{h.weight}%</td>
                  <td style={s.td}><StatusBadge status={h.sbti} /></td>
                  <td style={{ ...s.td, minWidth: 110 }}><TempGauge value={h.temp} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 14, padding: '10px 12px', background: T.bg, borderRadius: 6, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, color: T.textSec }}>Combined weight of misaligned holdings (&gt;3°C)</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.red, marginTop: 2 }}>
            {HOLDINGS_MISALIGNED.reduce((a, h) => a + h.weight, 0).toFixed(1)}% of portfolio
          </div>
          <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>Temperature drag: +0.8°C vs. divested scenario</div>
        </div>
      </div>
    </div>

    {/* Summary distribution by engagement status */}
    <div style={s.card()}>
      <div style={s.sectionLabel}>Engagement Status Across All Holdings</div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Paris-Aligned (≤1.5°C)', count: 8, color: T.green },
          { label: 'Near-Aligned (1.5–2°C)', count: 14, color: '#4ade80' },
          { label: 'Moderate Gap (2–2.5°C)', count: 12, color: T.amber },
          { label: 'Significant Gap (2.5–3°C)', count: 9, color: '#f97316' },
          { label: 'Misaligned (>3°C)', count: 7, color: T.red },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
            <span style={{ fontSize: 12, color: T.textSec }}>{item.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── TAB 4: Engagement & Alignment Plan ───────────────────────────────────────
const TabEngagement = () => (
  <div>
    <div style={s.grid(2)}>
      {/* Scenario impact */}
      <div style={s.card()}>
        <div style={s.sectionLabel}>Portfolio Re-Alignment Scenarios</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={SCENARIOS} layout="vertical" margin={{ top: 4, right: 50, left: 10, bottom: 4 }}>
            <XAxis type="number" domain={[1, 3.5]} tick={{ fill: T.textSec, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fill: T.textSec, fontSize: 11 }} axisLine={false} tickLine={false} width={160} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="temp" name="Implied Temp (°C)" radius={[0, 3, 3, 0]}>
              {SCENARIOS.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {SCENARIOS.map((sc, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: sc.color }} />
                <span style={{ color: T.textSec }}>{sc.name}</span>
              </div>
              <span style={{ fontWeight: 700, color: sc.color }}>{sc.temp}°C</span>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement impact summary */}
      <div style={s.card()}>
        <div style={s.sectionLabel}>Pathway to Paris Alignment</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { action: 'Divest Top 3 Misaligned', impact: '-0.3°C', from: 2.7, to: 2.4, color: '#f97316' },
            { action: '+10% Renewable Allocation', impact: '-0.2°C', from: 2.7, to: 2.5, color: T.sage },
            { action: 'SBTi Engagement (>3°C holdings)', impact: '-0.4°C', from: 2.7, to: 2.3, color: T.navy },
            { action: 'Combined Paris-Aligned Construction', impact: '-1.0°C', from: 2.7, to: 1.7, color: T.green },
          ].map((item, i) => (
            <div key={i} style={{ padding: '10px 12px', background: T.bg, borderRadius: 6, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{item.action}</div>
                <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.impact}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: T.textSec }}>{item.from}°C</span>
                <div style={{ flex: 1, height: 4, background: T.borderL, borderRadius: 2 }}>
                  <div style={{ width: `${((item.from - item.to) / item.from) * 100}%`, height: '100%', background: item.color, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.to}°C</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Engagement queue table */}
    <div style={s.card()}>
      <div style={s.sectionLabel}>Engagement Queue — Top 10 Priority Companies</div>
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Priority</th>
              <th style={s.th}>Company</th>
              <th style={s.th}>Sector</th>
              <th style={s.th}>Weight</th>
              <th style={s.th}>Temp Score</th>
              <th style={s.th}>Engagement Action</th>
              <th style={s.th}>Deadline</th>
              <th style={s.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {ENGAGEMENT_QUEUE.map((e, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : `${T.surfaceH}44` }}>
                <td style={{ ...s.td, fontWeight: 700, color: e.priority <= 3 ? T.red : T.amber }}>
                  P{e.priority}
                </td>
                <td style={{ ...s.td, fontWeight: 600, color: T.text }}>{e.name}</td>
                <td style={{ ...s.td, color: T.textSec }}>{e.sector}</td>
                <td style={{ ...s.td, color: T.textSec }}>{e.weight}%</td>
                <td style={{ ...s.td, fontWeight: 700, color: tempColor(e.temp) }}>{e.temp}°C</td>
                <td style={{ ...s.td, color: T.textSec, maxWidth: 220 }}>{e.action}</td>
                <td style={{ ...s.td, color: T.textSec, whiteSpace: 'nowrap' }}>{e.deadline}</td>
                <td style={s.td}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3,
                    background: e.status === 'In Progress' ? '#06c89622' : e.status === 'Initiated' ? '#0ea5e922' : T.borderL,
                    color: e.status === 'In Progress' ? T.green : e.status === 'Initiated' ? T.sage : T.textMut,
                  }}>{e.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Engagement metrics summary */}
    <div style={s.grid(4)}>
      {[
        { label: 'Total Engagements', value: '10', sub: 'Active queue', color: T.text },
        { label: 'In Progress', value: '1', sub: 'Glencore', color: T.green },
        { label: 'Initiated', value: '2', sub: 'Aramco + Thyssenkrupp', color: T.sage },
        { label: 'Portfolio Temp if All Succeed', value: '2.1°C', sub: 'Optimistic scenario', color: T.amber },
      ].map((m, i) => (
        <div key={i} style={s.card()}>
          <div style={{ ...s.kpiVal, fontSize: 24, color: m.color }}>{m.value}</div>
          <div style={s.kpiLabel}>{m.label}</div>
          <div style={s.kpiSub}>{m.sub}</div>
        </div>
      ))}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const TABS = ['Temperature Score', 'PACTA Sectors', 'Holdings Ranking', 'Engagement Plan'];

// suppress unused warning for sr helper (used for deterministic seeding if needed)
void sr;

export default function PortfolioTemperatureScorePage() {
  const [activeTab, setActiveTab] = useState(0);

  const tabContent = [
    <TabTemperatureScore key="t1" />,
    <TabPactaSectors key="t2" />,
    <TabHoldingsRanking key="t3" />,
    <TabEngagement key="t4" />,
  ];

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={s.title}>Portfolio Temperature Score — PACTA &amp; TCFD Alignment</h1>
            <p style={s.sub}>EP-AJ4 · Sprint AJ — Financed Emissions &amp; Climate Banking Analytics · PACTA + SBTi Temperature Score v1.2</p>
            <div style={s.badgeRow}>
              <span style={s.badge('#06c89618', T.green)}>✓ Methodology: PACTA (2° Investing Initiative) · SBTi Temperature Score v1.2</span>
              <span style={s.badge('#f0a82818', T.amber)}>⚠️ Portfolio holdings are illustrative</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: T.textSec }}>Assessment Date</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Q1 2026</div>
            </div>
            <div style={{ width: 1, height: 36, background: T.border }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: T.textSec }}>Portfolio Temp</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.amber }}>2.7°C</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map((tab, i) => (
          <button key={i} style={s.tab(activeTab === i)} onClick={() => setActiveTab(i)}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tabContent[activeTab]}
    </div>
  );
}
