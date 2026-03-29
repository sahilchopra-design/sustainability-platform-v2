import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const tip = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 11 };

const MODULES = [
  { path: '/article6-markets',         label: 'Article 6 Carbon Markets',    badge: 'PA Art 6.2 / 6.4 · ITMO · CORSIA',      code: 'EP-AA2', color: '#0891b2' },
  { path: '/cbam-compliance',          label: 'CBAM Compliance Engine',       badge: 'EU 2023/956 · 6 Sectors · Certificates', code: 'EP-AA3', color: '#b45309' },
  { path: '/climate-finance-tracker',  label: 'Climate Finance Tracker',      badge: '$100bn COP · GCF · Adaptation Gap',      code: 'EP-AA4', color: '#7c3aed' },
  { path: '/green-taxonomy-navigator', label: 'Green Taxonomy Navigator',     badge: '8 Jurisdictions · IPSF · Transition',    code: 'EP-AA5', color: '#059669' },
  { path: '/climate-sovereign-bonds',  label: 'Climate Sovereign Bonds',      badge: 'Green Gilts · EU GBS · Greenium',        code: 'EP-AA6', color: '#be185d' },
];

const INSTRUMENTS = [
  { name: 'Green Bond',          volume: 672, yoy: 18, regulatory: 'EU GBS / ICMA GBP', useOfProceeds: 'Mitigation + Adaptation', tenor: '5–30yr', greenium: '3–8bps', market: 'Public' },
  { name: 'Sustainability Bond', volume: 281, yoy: 22, regulatory: 'ICMA SBP + GBP',    useOfProceeds: 'Green + Social combined', tenor: '3–15yr', greenium: '2–5bps', market: 'Public' },
  { name: 'SLL',                 volume: 498, yoy: -4, regulatory: 'LMA SLBP',           useOfProceeds: 'General / KPI-linked',    tenor: '1–7yr',  greenium: 'N/A', market: 'Loan' },
  { name: 'SLB',                 volume: 97,  yoy: 8,  regulatory: 'ICMA SLBP',          useOfProceeds: 'General / KPI-linked',    tenor: '5–20yr', greenium: '1–4bps', market: 'Bond' },
  { name: 'Blue Bond',           volume: 5,   yoy: 45, regulatory: 'ICMA Blue Bond',     useOfProceeds: 'Ocean / water projects',  tenor: '5–10yr', greenium: '5–10bps', market: 'Public' },
  { name: 'Transition Bond',     volume: 12,  yoy: 67, regulatory: 'GFANZ / TPT',       useOfProceeds: 'Hard-to-abate sectors',   tenor: '3–10yr', greenium: '0–2bps', market: 'Public' },
  { name: 'Climate Derivative',  volume: 43,  yoy: 132,regulatory: 'EMIR / MiFID II',   useOfProceeds: 'Hedging / speculation',   tenor: '<1yr',   greenium: 'N/A', market: 'OTC' },
  { name: 'CBAM Certificate',    volume: 8,   yoy: null,regulatory: 'EU 2023/956',       useOfProceeds: 'Embedded carbon cost',    tenor: 'Annual', greenium: 'N/A', market: 'Compliance' },
];

const PIPELINE = [
  { issuer: 'UK DMO', instrument: 'Green Gilt', size: 10000, currency: 'GBP', status: 'Announced', date: 'Q2 2026', framework: 'UK GGF', sector: 'Sovereign' },
  { issuer: 'EU Commission', instrument: 'EU GBS CAB', size: 12000, currency: 'EUR', status: 'Bookbuilding', date: 'Apr 2026', framework: 'EU GBS', sector: 'Supranational' },
  { issuer: 'Republic of Chile', instrument: 'Sovereign SDG Bond', size: 2000, currency: 'USD', status: 'Roadshow', date: 'May 2026', framework: 'ICMA GBP', sector: 'EM Sovereign' },
  { issuer: 'Ørsted', instrument: 'Green Bond', size: 750, currency: 'EUR', status: 'Priced', date: 'Mar 2026', framework: 'EU GBS', sector: 'Utility' },
  { issuer: 'World Bank IBRD', instrument: 'Blue Bond', size: 500, currency: 'USD', status: 'Settled', date: 'Feb 2026', framework: 'ICMA Blue', sector: 'MDB' },
  { issuer: 'BNDES', instrument: 'Transition Finance', size: 1200, currency: 'BRL', status: 'Mandate', date: 'Jun 2026', framework: 'GFANZ', sector: 'DFI' },
  { issuer: 'KfW', instrument: 'Green Bond', size: 5000, currency: 'EUR', status: 'Priced', date: 'Jan 2026', framework: 'ICMA GBP', sector: 'Agency' },
  { issuer: 'EBRD', instrument: 'Climate Resilience Bond', size: 300, currency: 'USD', status: 'Pipeline', date: 'Q3 2026', framework: 'TCAF', sector: 'MDB' },
];

const REGULATORY_EVENTS = [
  { date: '1 Apr 2026', event: 'EU CBAM Full Implementation', framework: 'EU CBAM', status: 'Imminent', impact: 'High' },
  { date: '30 Jun 2026', event: 'SFDR Level 2 RTS PAI Data Refresh', framework: 'SFDR', status: 'Upcoming', impact: 'High' },
  { date: '31 Mar 2026', event: 'UK Green Gilt Allocation Report', framework: 'UK GGF', status: 'Imminent', impact: 'Medium' },
  { date: '15 May 2026', event: 'Article 6.4 Supervisory Body – Rules Adoption', framework: 'Paris Art 6', status: 'Upcoming', impact: 'Very High' },
  { date: '1 Jul 2026', event: 'EU GBS Aligned Issuance Label Launch', framework: 'EU GBS', status: 'Upcoming', impact: 'High' },
  { date: '30 Sep 2026', event: 'CORSIA Phase 2 Eligibility Assessment', framework: 'ICAO CORSIA', status: 'Upcoming', impact: 'Medium' },
  { date: '31 Dec 2026', event: 'CSRD Wave 2 — Large Private Companies', framework: 'CSRD', status: 'Upcoming', impact: 'Very High' },
];

const VOLUME_TREND = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
  green: Math.round(45 + sr(i * 7) * 30),
  sust: Math.round(18 + sr(i * 11) * 12),
  slb: Math.round(7 + sr(i * 13) * 5),
  transition: Math.round(1 + sr(i * 17) * 2),
}));

const STAT = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px', borderTop: `3px solid ${color || T.teal}` }}>
    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

const TABS = ['Overview', 'Instrument Matrix', 'Deal Pipeline', 'Regulatory Calendar', 'Analytics'];

export default function ClimateFinanceHubPage() {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  const statusColor = s => ({ Imminent: T.red, Upcoming: T.amber, Priced: T.green, Settled: T.sage, Bookbuilding: T.teal, Roadshow: '#7c3aed', Announced: T.amber, Pipeline: T.textMut, Mandate: '#0891b2' }[s] || T.textMut);
  const impactColor = i => ({ 'Very High': T.red, High: T.amber, Medium: T.sage, Low: T.textMut }[i] || T.textMut);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: T.font }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0f766e18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏦</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.navy, margin: 0 }}>Climate Finance Hub</h1>
            <span style={{ fontSize: 10, background: '#0f766e18', color: T.teal, padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>EP-AA1</span>
          </div>
          <p style={{ color: T.textSec, fontSize: 13, margin: 0 }}>Sprint AA · Climate Finance Architecture · ICMA · EU GBS · Paris Art 6 · CBAM · IPSF</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ label: 'COP $100bn', color: T.teal }, { label: 'CBAM Live', color: T.amber }, { label: 'Art 6 Active', color: T.sage }].map(b => (
            <span key={b.label} style={{ fontSize: 10, background: b.color + '18', color: b.color, padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>{b.label}</span>
          ))}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            color: tab === i ? T.teal : T.textSec, borderBottom: tab === i ? `2px solid ${T.teal}` : '2px solid transparent',
            marginBottom: -1, transition: 'color 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* ─── TAB 0: OVERVIEW ─── */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
            <STAT label="Green Bond Issuance 2025" value="$672bn" sub="+18% YoY" color={T.teal} />
            <STAT label="CBAM Sectors Covered" value="6" sub="Cement · Al · Steel · H₂ · Fert · Elec" color={T.amber} />
            <STAT label="Article 6 Deals Registered" value="38" sub="Art 6.2 Bilateral + 6.4 Mechanism" color="#0891b2" />
            <STAT label="COP $100bn Gap 2025" value="$8bn" sub="$92bn mobilised vs $100bn pledge" color={T.red} />
            <STAT label="Sovereign Green Issuers" value="47" sub="30 new issuers since 2020" color="#7c3aed" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Monthly Issuance Volume ($bn) — Green · Sustainability · SLB · Transition</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={VOLUME_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textMut }} axisLine={{ stroke: T.border }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tip} />
                  <Area type="monotone" dataKey="green" stackId="1" stroke={T.teal} fill="#0f766e22" name="Green Bond" strokeWidth={2} />
                  <Area type="monotone" dataKey="sust" stackId="1" stroke={T.sage} fill="#5a8a6a22" name="Sustainability" strokeWidth={2} />
                  <Area type="monotone" dataKey="slb" stackId="1" stroke={T.gold} fill="#c5a96a22" name="SLB" strokeWidth={2} />
                  <Area type="monotone" dataKey="transition" stackId="1" stroke="#7c3aed" fill="#7c3aed18" name="Transition" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Volume by Instrument 2025</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={INSTRUMENTS.slice(0, 6).map(d => ({ name: d.name, value: d.volume }))} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={2}>
                    {INSTRUMENTS.slice(0, 6).map((_, i) => <Cell key={i} fill={[T.teal, T.sage, T.gold, '#7c3aed', '#0891b2', T.amber][i]} />)}
                  </Pie>
                  <Tooltip formatter={v => `$${v}bn`} contentStyle={tip} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginTop: 6 }}>
                {INSTRUMENTS.slice(0, 6).map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: T.textSec }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: [T.teal, T.sage, T.gold, '#7c3aed', '#0891b2', T.amber][i] }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sprint AA Module Cards */}
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Sprint AA — Climate Finance Architecture Modules</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {MODULES.map(m => (
              <div key={m.path} onClick={() => navigate(m.path)} style={{
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px',
                borderLeft: `4px solid ${m.color}`, cursor: 'pointer', transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(27,58,92,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{m.label}</div>
                  <span style={{ fontSize: 9, background: m.color + '18', color: m.color, padding: '2px 7px', borderRadius: 12, fontWeight: 700 }}>{m.code}</span>
                </div>
                <div style={{ fontSize: 11, color: T.textMut }}>{m.badge}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 1: INSTRUMENT MATRIX ─── */}
      {tab === 1 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Climate Finance Instrument Comparison Matrix</div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f6f4f0' }}>
                  {['Instrument', 'Issuance 2025 ($bn)', 'YoY %', 'Regulatory Framework', 'Use of Proceeds', 'Typical Tenor', 'Greenium', 'Market'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INSTRUMENTS.map((r, i) => (
                  <tr key={r.name} style={{ background: i % 2 === 0 ? T.surface : '#fafaf8', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.navy }}>{r.name}</td>
                    <td style={{ padding: '10px 14px', color: T.text, fontVariantNumeric: 'tabular-nums' }}>{r.volume.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {r.yoy !== null ? <span style={{ color: r.yoy > 0 ? T.green : T.red, fontWeight: 700 }}>{r.yoy > 0 ? '+' : ''}{r.yoy}%</span> : <span style={{ color: T.textMut }}>New</span>}
                    </td>
                    <td style={{ padding: '10px 14px', color: T.textSec, fontSize: 11 }}>{r.regulatory}</td>
                    <td style={{ padding: '10px 14px', color: T.textSec }}>{r.useOfProceeds}</td>
                    <td style={{ padding: '10px 14px', color: T.textSec }}>{r.tenor}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, color: r.greenium === 'N/A' ? T.textMut : T.teal, fontWeight: r.greenium !== 'N/A' ? 700 : 400 }}>{r.greenium}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 10, background: T.teal + '18', color: T.teal, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{r.market}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Issuance Volume by Instrument 2025 ($bn)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={INSTRUMENTS} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textMut }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => `$${v}bn`} contentStyle={tip} />
                  <Bar dataKey="volume" radius={[4, 4, 0, 0]} fill={T.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Key Regulatory Standards by Instrument</div>
              {[
                { standard: 'ICMA Green Bond Principles (GBP)', instruments: 'Green Bond, Blue Bond', year: 'Updated 2021', status: 'Voluntary' },
                { standard: 'EU Green Bond Standard (EU GBS)', instruments: 'Green Bond (EU-aligned)', year: 'Effective Dec 2024', status: 'Regulatory' },
                { standard: 'LMA Sustainability Linked Loan Principles', instruments: 'SLL', year: 'Updated 2023', status: 'Voluntary' },
                { standard: 'ICMA Sustainability-Linked Bond Principles', instruments: 'SLB', year: 'Updated 2023', status: 'Voluntary' },
                { standard: 'GFANZ / TPT Transition Finance Framework', instruments: 'Transition Bond', year: '2024', status: 'Guidance' },
                { standard: 'EU CBAM Regulation (EU) 2023/956', instruments: 'CBAM Certificate', year: 'Full Apr 2026', status: 'Regulatory' },
              ].map(s => (
                <div key={s.standard} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{s.standard}</div>
                    <div style={{ fontSize: 11, color: T.textMut }}>{s.instruments} · {s.year}</div>
                  </div>
                  <span style={{ fontSize: 10, background: s.status === 'Regulatory' ? T.red + '18' : T.sage + '18', color: s.status === 'Regulatory' ? T.red : T.sage, padding: '2px 8px', borderRadius: 10, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 10 }}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: DEAL PIPELINE ─── */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>Live Deal Pipeline — Climate Finance Instruments</div>
            <span style={{ fontSize: 11, color: T.textMut }}>{PIPELINE.length} transactions · Q1–Q3 2026</span>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f6f4f0' }}>
                  {['Issuer', 'Instrument', 'Size', 'CCY', 'Status', 'Expected', 'Framework', 'Sector'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PIPELINE.map((r, i) => (
                  <tr key={r.issuer + i} style={{ background: i % 2 === 0 ? T.surface : '#fafaf8', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.navy }}>{r.issuer}</td>
                    <td style={{ padding: '10px 14px', color: T.text }}>{r.instrument}</td>
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{r.size.toLocaleString()}m</td>
                    <td style={{ padding: '10px 14px', color: T.textSec }}>{r.currency}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 10, background: statusColor(r.status) + '18', color: statusColor(r.status), padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{r.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: T.textSec }}>{r.date}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: T.textMut }}>{r.framework}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 10, background: T.border, color: T.textSec, padding: '2px 8px', borderRadius: 10 }}>{r.sector}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Total Pipeline Volume', value: '$31.8bn', sub: '8 transactions' },
              { label: 'Green Bonds', value: '5', sub: '$27.7bn notional' },
              { label: 'Avg Deal Size', value: '$3.97bn', sub: 'Range: $300m–$12bn' },
              { label: 'Sovereign Share', value: '71%', sub: 'By volume' },
            ].map(s => <STAT key={s.label} {...s} />)}
          </div>
        </div>
      )}

      {/* ─── TAB 3: REGULATORY CALENDAR ─── */}
      {tab === 3 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Climate Finance Regulatory Calendar 2026</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {REGULATORY_EVENTS.map(e => (
              <div key={e.event} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ minWidth: 110, fontSize: 12, fontWeight: 700, color: T.teal }}>{e.date}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{e.event}</div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>{e.framework}</div>
                </div>
                <span style={{ fontSize: 10, background: statusColor(e.status) + '18', color: statusColor(e.status), padding: '3px 10px', borderRadius: 12, fontWeight: 700 }}>{e.status}</span>
                <span style={{ fontSize: 10, background: impactColor(e.impact) + '18', color: impactColor(e.impact), padding: '3px 10px', borderRadius: 12, fontWeight: 700 }}>{e.impact}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: ANALYTICS ─── */}
      {tab === 4 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>COP $100bn Mobilisation Progress 2016–2025</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={Array.from({ length: 10 }, (_, i) => ({ year: 2016 + i, public: Math.round(40 + sr(i * 3) * 20 + i * 4), private: Math.round(20 + sr(i * 7) * 30 + i * 3) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textMut }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => `$${v}bn`} contentStyle={tip} />
                  <Bar dataKey="public" stackId="a" name="Public Finance" fill={T.teal} />
                  <Bar dataKey="private" stackId="a" name="Private Finance" fill={T.gold} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 10, padding: '8px 12px', background: T.red + '10', borderRadius: 8, fontSize: 12, color: T.red }}>
                ⚠️ $100bn target not yet met — 2025 estimate: $92bn (public+private combined)
              </div>
            </div>

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Climate Finance Gap — Mitigation vs Adaptation</div>
              {[
                { label: 'Annual mitigation need (2030)', need: 4700, current: 1100, unit: '$bn/yr' },
                { label: 'Annual adaptation need (2030)', need: 387, current: 46, unit: '$bn/yr' },
                { label: 'Loss & damage need (2030)', need: 290, current: 6, unit: '$bn/yr' },
                { label: 'Nature-based solutions need', need: 700, current: 200, unit: '$bn/yr' },
              ].map(r => (
                <div key={r.label} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textSec, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600, color: T.navy }}>{r.label}</span>
                    <span style={{ color: T.textMut }}>${r.current}bn / ${r.need}bn {r.unit}</span>
                  </div>
                  <div style={{ height: 8, background: T.border, borderRadius: 4 }}>
                    <div style={{ height: '100%', width: `${Math.min((r.current / r.need) * 100, 100)}%`, background: r.current / r.need < 0.3 ? T.red : r.current / r.need < 0.6 ? T.amber : T.sage, borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 3 }}>{((r.current / r.need) * 100).toFixed(0)}% funded</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Climate Finance Architecture — Key Principles</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { title: 'Additionality', desc: 'Finance must be additional to baseline — not business-as-usual redirected', icon: '➕' },
                { title: 'Transformational', desc: 'Systemic change in economies, not incremental marginal improvements', icon: '🔄' },
                { title: 'Country Ownership', desc: 'Developing country priorities drive allocation, not donor preferences', icon: '🌍' },
                { title: 'Grant-equivalent', desc: 'Concessional terms measured on grant-equivalent basis (OECD DAC)', icon: '💰' },
                { title: 'Results-based', desc: 'Disbursements linked to verified outcomes (REDD+, FCPF, GCF REAP)', icon: '✅' },
                { title: 'MRV Framework', desc: 'Measurement, Reporting, Verification under UNFCCC transparency framework', icon: '📊' },
              ].map(p => (
                <div key={p.title} style={{ padding: '14px 16px', background: T.bg, borderRadius: 10, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{p.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
