import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── OFAC SDN entries (seeded sample) ─────────────────────────────────────────
const PROG_TYPES = ['SDN','BLOCKED','EO13662','EO14024','IRAN','RUSSIA','DPRK','CUBA','VENEZUELA','CYBER'];
const ENTITY_TYPES = ['individual','entity','vessel','aircraft','entity','individual','entity'];
const NATIONALITIES = ['RU','IR','CN','KP','VE','SY','CU','BY','MM','AF'];

const SDN_ENTRIES = Array.from({ length: 60 }, (_, i) => {
  const prog = PROG_TYPES[i % 10];
  const type = ENTITY_TYPES[i % 7];
  const nat = NATIONALITIES[i % 10];
  const riskScore = 70 + Math.floor(sr(i * 3) * 30);
  return {
    id: `SDN-${String(10000 + i * 137).slice(1)}`,
    name: type === 'vessel' ? `MV ${['AURORA','NEPTUNE','VOLGA','BERING','CASPIAN','URAL'][i%6]} ${i+1}`
         : type === 'aircraft' ? `${['B737','A320','IL-76','TU-154'][i%4]}-${String(1000+i).slice(1)}`
         : `${['Alexei','Ivan','Hassan','Kim','José','Omar','Viktor','Wei','Sergei','Ali'][i%10]} ${String.fromCharCode(65+i%26)}.`,
    type,
    program: prog,
    nationality: nat,
    riskScore,
    addedDate: `202${3 + Math.floor(sr(i+10)*2)}-${String((i%12)+1).padStart(2,'0')}-${String((i%28)+1).padStart(2,'0')}`,
    aliases: Math.floor(sr(i+20)*4),
    matchedPortfolioEntities: Math.floor(sr(i+30)*3),
    ukList: sr(i+40) > 0.5,
    euList: sr(i+50) > 0.45,
    unList: sr(i+60) > 0.65,
  };
});

// ── Watchlist lists summary ───────────────────────────────────────────────────
const LISTS = [
  { name: 'OFAC SDN',            authority: 'US Treasury',       entries: 14820, lastUpdate: '2026-04-01', type: 'Sanctions',     coverage: 'Global',           critical: true  },
  { name: 'OFAC Non-SDN',        authority: 'US Treasury',       entries: 1240,  lastUpdate: '2026-04-01', type: 'Sanctions',     coverage: 'Global',           critical: true  },
  { name: 'EU Consolidated',     authority: 'EU Council',        entries: 2890,  lastUpdate: '2026-03-28', type: 'Sanctions',     coverage: 'EU Jurisdiction',  critical: true  },
  { name: 'UK HM Treasury',      authority: 'HM Treasury',       entries: 3420,  lastUpdate: '2026-03-29', type: 'Sanctions',     coverage: 'UK Jurisdiction',  critical: true  },
  { name: 'UN Security Council', authority: 'UNSC',              entries: 840,   lastUpdate: '2026-03-15', type: 'Sanctions',     coverage: 'International',    critical: true  },
  { name: 'INTERPOL Red Notice', authority: 'INTERPOL',          entries: 7200,  lastUpdate: '2026-03-20', type: 'Law Enforcement',coverage: 'Global',          critical: false },
  { name: 'FATF High-Risk',      authority: 'FATF',              entries: 3,     lastUpdate: '2026-02-15', type: 'AML/CFT',       coverage: 'Jurisdictions',    critical: false },
  { name: 'PEP Global',          authority: 'ComplyAdvantage',   entries: 1240000,lastUpdate: '2026-04-01', type: 'PEP',          coverage: '200+ countries',   critical: false },
  { name: 'Adverse Media',       authority: 'NLP Classifier',    entries: 285000, lastUpdate: '2026-04-01', type: 'Media Risk',   coverage: 'Global news feeds',critical: false },
  { name: 'OFAC EO 14024',       authority: 'US Treasury',       entries: 2640,  lastUpdate: '2026-04-01', type: 'Sanctions',     coverage: 'Russia-related',   critical: true  },
];

// ── Portfolio screening hits ──────────────────────────────────────────────────
const SCREENING_HITS = Array.from({ length: 18 }, (_, i) => {
  const matchTypes = ['Exact Name','Fuzzy Name (87%)','Alias Match','LEI Cross-ref','ISIN Cross-ref'];
  const actions = ['Block Transaction','Enhanced DD Required','Flag for Review','Auto-cleared','Escalate to Compliance'];
  return {
    hit: i + 1,
    portfolioEntity: `Portfolio Entity ${String.fromCharCode(65 + i)}`,
    matchedEntry: SDN_ENTRIES[i * 3].name,
    list: LISTS[i % 5].name,
    matchType: matchTypes[i % 5],
    matchScore: 72 + Math.floor(sr(i + 80) * 28),
    action: actions[i % 5],
    status: i % 4 === 0 ? 'Pending Review' : i % 4 === 1 ? 'Cleared' : i % 4 === 2 ? 'Escalated' : 'Blocked',
    detectedAt: `2026-0${(i%3)+1}-${String((i%28)+1).padStart(2,'0')}`,
  };
});

// ── Monthly additions trend ───────────────────────────────────────────────────
const MONTHLY_ADDS = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
  ofac: 180 + Math.floor(sr(i * 7) * 120),
  eu: 60 + Math.floor(sr(i * 7 + 1) * 80),
  uk: 45 + Math.floor(sr(i * 7 + 2) * 60),
  un: 5 + Math.floor(sr(i * 7 + 3) * 15),
}));

const RISK_COLOR = (score) => score >= 90 ? T.red : score >= 80 ? T.amber : T.teal;
const STATUS_COLOR = { 'Blocked': T.red, 'Escalated': T.amber, 'Pending Review': T.purple, 'Cleared': T.green };

const pill = (label, color) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}44`,
    borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>
    {label}
  </span>
);

const card = (label, value, sub, color = T.navy) => (
  <div style={{ background: '#fff', border: `1px solid ${T.navy}22`, borderRadius: 8,
    padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.slate, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function SanctionsWatchlistPage() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [progFilter, setProgFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const tabs = ['SDN Screener', 'Watchlist Intelligence', 'Portfolio Hits', 'Compliance Reference'];

  const filteredSdn = useMemo(() => SDN_ENTRIES.filter(e => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.id.includes(search.toUpperCase())) return false;
    if (progFilter !== 'ALL' && e.program !== progFilter) return false;
    if (typeFilter !== 'ALL' && e.type !== typeFilter) return false;
    return true;
  }), [search, progFilter, typeFilter]);

  const progBreakdown = useMemo(() => PROG_TYPES.map(p => ({
    program: p,
    count: SDN_ENTRIES.filter(e => e.program === p).length,
  })), []);

  const natBreakdown = useMemo(() => NATIONALITIES.map(n => ({
    name: n, value: SDN_ENTRIES.filter(e => e.nationality === n).length,
  })), []);

  const NAT_COLORS = ['#b91c1c','#b45309','#6d28d9','#0f766e','#1b3a5c','#15803d','#0284c7','#dc2626','#9333ea','#0891b2'];

  const criticalLists = LISTS.filter(l => l.critical);
  const totalCriticalEntries = criticalLists.reduce((s,l)=>s+l.entries,0);

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Critical alert banner */}
      <div style={{ background: T.red + '15', border: `1px solid ${T.red}44`, borderRadius: 8,
        padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: T.red, fontWeight: 800, fontSize: 13 }}>⚠ COMPLIANCE NOTICE</span>
        <span style={{ fontSize: 12, color: T.slate }}>
          Sanctions screening is a legal obligation under OFAC 31 CFR § 501, EU Regulation 2580/2001, and UK Sanctions and Anti-Money Laundering Act 2018.
          This module provides a monitoring dashboard — it does not constitute legal advice or replace certified screening systems.
        </span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ background: T.red, color: '#fff', borderRadius: 8, padding: '6px 14px',
          fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>EP-BG2</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>
          Sanctions &amp; Watchlist Intelligence
        </h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pill('OFAC SDN 14.8K', T.red)}
          {pill('UN · EU · UK Lists', T.navy)}
          {pill('10 Programs', T.amber)}
          {pill('PEP 1.24M', T.purple)}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.navy}22` }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            background: tab === i ? T.red : 'transparent',
            color: tab === i ? '#fff' : T.slate,
            border: 'none', borderRadius: '6px 6px 0 0', padding: '8px 16px',
            fontFamily: T.font, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      {/* ── Tab 0: SDN Screener ── */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('OFAC SDN Entries', '14,820', 'As of 2026-04-01')}
            {card('Individuals', SDN_ENTRIES.filter(e=>e.type==='individual').length, 'In sample set', T.red)}
            {card('Entities', SDN_ENTRIES.filter(e=>e.type==='entity').length, 'Corporations, orgs', T.amber)}
            {card('Vessels + Aircraft', SDN_ENTRIES.filter(e=>['vessel','aircraft'].includes(e.type)).length, 'Transport assets', T.purple)}
            {card('Avg Risk Score', (SDN_ENTRIES.reduce((s,e)=>s+e.riskScore,0)/SDN_ENTRIES.length).toFixed(0), 'Model risk 0–100', T.navy)}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name or SDN ID…"
              style={{ padding: '7px 12px', border: `1px solid ${T.navy}33`, borderRadius: 6,
                fontFamily: T.mono, fontSize: 12, width: 260 }} />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['ALL', ...PROG_TYPES.slice(0,6)].map(p => (
                <button key={p} onClick={() => setProgFilter(p)} style={{
                  background: progFilter === p ? T.red : '#fff', color: progFilter === p ? '#fff' : T.slate,
                  border: `1px solid ${T.red}44`, borderRadius: 5, padding: '4px 8px', fontSize: 10, cursor: 'pointer',
                }}>{p}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['ALL', 'individual', 'entity', 'vessel', 'aircraft'].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)} style={{
                  background: typeFilter === t ? T.navy : '#fff', color: typeFilter === t ? '#fff' : T.slate,
                  border: `1px solid ${T.navy}33`, borderRadius: 5, padding: '4px 8px', fontSize: 10, cursor: 'pointer',
                }}>{t}</button>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['SDN ID','Name / Identifier','Type','Program','Nationality','Risk Score','Added','Aliases','UK','EU','UN'].map(h => (
                    <th key={h} style={{ padding: '10px 10px', textAlign: 'left', fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSdn.slice(0, 30).map((e, i) => (
                  <tr key={e.id} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11` }}>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.slate, fontSize: 10 }}>{e.id}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.navy }}>{e.name}</td>
                    <td style={{ padding: '8px 10px' }}>{pill(e.type, T.teal)}</td>
                    <td style={{ padding: '8px 10px' }}>{pill(e.program, T.red)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, fontWeight: 700 }}>{e.nationality}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ fontFamily: T.mono, fontWeight: 700, color: RISK_COLOR(e.riskScore) }}>{e.riskScore}</span>
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, fontSize: 10 }}>{e.addedDate}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, textAlign: 'center' }}>{e.aliases}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{e.ukList ? '✓' : '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{e.euList ? '✓' : '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{e.unList ? '✓' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Entries by Program</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={progBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="program" tick={{ fontSize: 9, fontFamily: T.mono }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.red} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Nationality Distribution (Sample)</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={natBreakdown} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name }) => name}>
                    {natBreakdown.map((_, i) => <Cell key={i} fill={NAT_COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 1: Watchlist Intelligence ── */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('Total Lists', LISTS.length, 'Active watchlists')}
            {card('Critical Lists', criticalLists.length, 'Mandatory screening', T.red)}
            {card('Total Entries', (totalCriticalEntries / 1000).toFixed(0) + 'K', 'Critical lists combined', T.amber)}
            {card('PEP Universe', '1.24M', 'Global PEP database', T.purple)}
          </div>

          {/* Monthly additions chart */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Monthly Designations Added (2025)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MONTHLY_ADDS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ofac" name="OFAC" fill={T.red} stackId="a" />
                <Bar dataKey="eu"   name="EU"   fill={T.amber} stackId="a" />
                <Bar dataKey="uk"   name="UK"   fill={T.purple} stackId="a" />
                <Bar dataKey="un"   name="UN"   fill={T.navy}  stackId="a" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lists table */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['List','Authority','Entries','Last Update','Type','Coverage','Critical'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LISTS.map((l, i) => (
                  <tr key={l.name} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11` }}>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: l.critical ? T.red : T.navy }}>{l.name}</td>
                    <td style={{ padding: '9px 12px', color: T.slate }}>{l.authority}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, textAlign: 'right' }}>{l.entries.toLocaleString()}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.mono, fontSize: 11 }}>{l.lastUpdate}</td>
                    <td style={{ padding: '9px 12px' }}>{pill(l.type, l.type === 'Sanctions' ? T.red : l.type === 'PEP' ? T.purple : T.amber)}</td>
                    <td style={{ padding: '9px 12px', fontSize: 11, color: T.slate }}>{l.coverage}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'center' }}>{l.critical ? pill('REQUIRED', T.red) : pill('Advisory', T.teal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 2: Portfolio Hits ── */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('Total Hits', SCREENING_HITS.length, 'Portfolio matches found')}
            {card('Blocked', SCREENING_HITS.filter(h=>h.status==='Blocked').length, 'Transactions halted', T.red)}
            {card('Escalated', SCREENING_HITS.filter(h=>h.status==='Escalated').length, 'Compliance review', T.amber)}
            {card('Pending', SCREENING_HITS.filter(h=>h.status==='Pending Review').length, 'Awaiting decision', T.purple)}
            {card('Cleared', SCREENING_HITS.filter(h=>h.status==='Cleared').length, 'False positives', T.green)}
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['#','Portfolio Entity','Matched Entry','List','Match Type','Score','Status','Recommended Action','Detected'].map(h => (
                    <th key={h} style={{ padding: '10px 10px', textAlign: 'left', fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCREENING_HITS.map((h, i) => (
                  <tr key={h.hit} style={{ background: i % 2 === 0 ? '#fff' : T.cream + '80',
                    borderBottom: `1px solid ${T.navy}11` }}>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, color: T.slate }}>{h.hit}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.navy }}>{h.portfolioEntity}</td>
                    <td style={{ padding: '8px 10px', color: T.red }}>{h.matchedEntry}</td>
                    <td style={{ padding: '8px 10px' }}>{pill(h.list.replace('OFAC ',''), T.red)}</td>
                    <td style={{ padding: '8px 10px' }}>{pill(h.matchType, T.purple)}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ fontFamily: T.mono, fontWeight: 700, color: RISK_COLOR(h.matchScore) }}>{h.matchScore}%</span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>{pill(h.status, STATUS_COLOR[h.status] || T.slate)}</td>
                    <td style={{ padding: '8px 10px', fontSize: 10, color: T.slate }}>{h.action}</td>
                    <td style={{ padding: '8px 10px', fontFamily: T.mono, fontSize: 10 }}>{h.detectedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 3: Compliance Reference ── */}
      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            {
              title: 'OFAC Regulatory Framework', color: T.red,
              items: [
                '31 CFR § 501 — Reporting, Procedures and Penalties Regulations',
                'Civil penalty: up to $356,579 per transaction or 2× transaction value',
                'Criminal penalty: up to $1M per violation and/or 20 years imprisonment',
                'OFAC 50% Rule: entities 50%+ owned by SDN are themselves blocked',
                'General Licenses (GL): authorise otherwise prohibited transactions',
                'OFAC SDGT, FSRQ, DPRK, IRAN, RUSSIA, CYBER, CAATSA programs',
                'Screening cadence: real-time on all payments, daily batch for portfolio',
              ],
            },
            {
              title: 'UK Sanctions (SAMLA 2018)', color: T.navy,
              items: [
                'Sanctions and Anti-Money Laundering Act 2018 — post-Brexit framework',
                'OFSI (HM Treasury) enforces UK asset freezes and travel bans',
                'Regulations: Russia, Iran, ISIL/Daesh & Al-Qaida, Cyber, Global Anti-Corruption',
                'Monetary penalty: up to £1M or 50% of funds involved (higher of two)',
                'Voluntary disclosure available — reduces penalty by up to 50%',
                'UK maintains consolidated list at gov.uk/government/publications/financial-sanctions-consolidated-list',
              ],
            },
            {
              title: 'EU Sanctions (EU 2580/2001 + Russia Regime)', color: T.amber,
              items: [
                'EU Consolidated Financial Sanctions List (CFSP decisions)',
                'Russia sanctions package: Regulations 269/2014, 833/2014, 2022/328 ff.',
                'Asset freeze, transaction prohibition, port bans, aviation restrictions',
                'EU Sanctions Map: sanctionsmap.eu — real-time list viewer',
                'Member states enforce — divergent penalty regimes (0 to criminal)',
                'Derogations require prior competent authority authorisation',
                'Beneficial ownership: 50%+ ownership by listed person triggers freeze',
              ],
            },
            {
              title: 'AML/KYC — FATF Framework', color: T.purple,
              items: [
                'FATF 40 Recommendations — international standard for AML/CFT/CPF',
                'Risk-Based Approach (RBA): higher risk = enhanced due diligence (EDD)',
                'PEP screening: senior political figures, immediate family, close associates',
                'Adverse media: negative news screening (financial crime, corruption, sanctions evasion)',
                'FATF High-Risk Jurisdictions: enhanced measures required (as of Feb 2026)',
                'AMLD6 (EU): harmonised criminal offences, corporate liability, 4-year minimum sentence',
                'Ongoing monitoring: transaction monitoring + periodic KYC refresh (annual for high-risk)',
              ],
            },
            {
              title: 'UN Security Council Sanctions', color: T.teal,
              items: [
                'Chapter VII UN Charter — binding on all member states',
                'Committees: 1267 (Al-Qaida/ISIL), 1718 (DPRK), 1970 (Libya), 2374 (Mali)',
                '840 individuals and entities on UN consolidated list (Mar 2026)',
                'Delisting procedure: Focal Point (individuals) or state submission',
                'Ombudsperson mechanism for 1267 list (ISIL/Al-Qaida only)',
                'Asset freeze + travel ban + arms embargo — standard measures',
              ],
            },
            {
              title: 'Sanctions Ingester Architecture', color: T.green,
              items: [
                'OfacSdnIngester: daily 01:00 — SDN XML download from ofac.treas.gov',
                'UnSanctionsIngester: daily 01:30 — UN XML from un.org/sc/suborg/en/sanctions/un-sc-consolidated-list',
                'EuSanctionsIngester: daily 02:00 — EU API at sanctionsapi.ec.europa.eu',
                'UkSanctionsIngester: daily 01:45 — HM Treasury CSV download',
                'Fuzzy matching: Jaro-Winkler + Damerau-Levenshtein, threshold 85%',
                'LEI cross-reference: GLEIF table join on legal name + country',
                'Tables: ofac_sdn, un_consolidated, eu_sanctions, uk_hmt_list',
              ],
            },
          ].map(item => (
            <div key={item.title} style={{ background: '#fff', borderRadius: 10,
              border: `2px solid ${item.color}33`, padding: 16 }}>
              <div style={{ fontWeight: 800, color: item.color, fontSize: 13, marginBottom: 10 }}>{item.title}</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {item.items.map((s, i) => (
                  <li key={i} style={{ fontSize: 11, color: T.slate, marginBottom: 5, lineHeight: 1.5 }}>{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
