import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, Legend, ReferenceLine, PieChart, Pie
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', red: '#991b1b', green: '#065f46', gray: '#6b7280', orange: '#c2410c', teal: '#0f766e', purple: '#6d28d9' };
const fmt = (n, d = 1) => n >= 1e9 ? `$${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(d)}M` : `$${n.toFixed(d)}`;
const bp = (n) => `${(n * 10000).toFixed(0)}bps`;
const pct = (n) => `${(n * 100).toFixed(2)}%`;

const TRIGGER_TYPES = ['Indemnity', 'Industry Index', 'Parametric', 'Modeled Loss'];
const PERILS = ['Multi-Peril', 'US Wind', 'EU Windstorm', 'Japan EQ', 'US EQ', 'Flood', 'Wildfire'];
const RATINGS = ['BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'NR'];
const RATING_COLORS = { 'BB+': '#059669', 'BB': '#0f766e', 'BB-': '#0369a1', 'B+': '#b45309', 'B': T.orange, 'B-': T.red, 'NR': T.gray };

// Cat bond universe
const CAT_BONDS = Array.from({ length: 24 }, (_, i) => {
  const issueYear = 2021 + Math.floor(sr(i * 3) * 4);
  const tenor = 3 + Math.floor(sr(i * 7) * 2);
  const attachment = 0.02 + sr(i * 11) * 0.06;
  const exhaustion = attachment + 0.03 + sr(i * 13) * 0.05;
  const eloss = attachment * (0.3 + sr(i * 17) * 0.4);
  const spread = eloss * (2.5 + sr(i * 19) * 2.0);
  return {
    id: `Bond-${String(i + 1).padStart(3, '0')}`,
    peril: PERILS[i % PERILS.length],
    trigger: TRIGGER_TYPES[i % TRIGGER_TYPES.length],
    issuer: ['Swiss Re Capital Markets', 'Munich Re', 'Hannover Re', 'Aon Securities', 'GC Securities'][i % 5],
    size: Math.round((100 + sr(i * 23) * 400) * 1e6),
    issueYear,
    maturity: `${issueYear + tenor}-${String(Math.floor(1 + sr(i * 29) * 11) + 1).padStart(2, '0')}`,
    tenor,
    attachmentPct: (attachment * 100).toFixed(2),
    exhaustionPct: (exhaustion * 100).toFixed(2),
    eloss: (eloss * 100).toFixed(3),
    spread: (spread * 100).toFixed(2),
    multipleOfEL: (spread / eloss).toFixed(2),
    rating: RATINGS[i % RATINGS.length],
    status: i < 18 ? 'Active' : i < 21 ? 'Matured' : 'Triggered',
  };
});

const activeBonds = CAT_BONDS.filter(b => b.status === 'Active');

// Historical events
const LOSS_EVENTS = [
  { year: 2017, event: 'Harvey/Irma/Maria', insuredLoss: 92, ilsLoss: 14.2, trigger: true,  peril: 'US Wind' },
  { year: 2018, event: 'Michael + Florence', insuredLoss: 28, ilsLoss: 2.1,  trigger: false, peril: 'US Wind' },
  { year: 2019, event: 'Typhoon Hagibis',    insuredLoss: 17, ilsLoss: 1.4,  trigger: false, peril: 'Japan EQ' },
  { year: 2020, event: 'California Wildfires', insuredLoss: 13, ilsLoss: 0.6, trigger: false, peril: 'Wildfire' },
  { year: 2021, event: 'European Floods',    insuredLoss: 40, ilsLoss: 3.8,  trigger: false, peril: 'Flood' },
  { year: 2022, event: 'Ian + Nicole',       insuredLoss: 110, ilsLoss: 16.4, trigger: true, peril: 'US Wind' },
  { year: 2023, event: 'Turkey EQ',          insuredLoss: 6,  ilsLoss: 0.3,  trigger: false, peril: 'Japan EQ' },
  { year: 2024, event: 'Helene + Milton',    insuredLoss: 78, ilsLoss: 9.8,  trigger: true,  peril: 'US Wind' },
];

// Market size time series
const MARKET_SIZE = Array.from({ length: 12 }, (_, i) => ({
  year: 2013 + i,
  outstanding: Math.round((17 + i * 2.8 + sr(i * 7) * 3) * 1e9),
  issuance:    Math.round((6 + i * 1.4 + sr(i * 11) * 2) * 1e9),
  spread_index: (650 + Math.sin(i * 0.9) * 120 + sr(i * 13) * 80).toFixed(0),
}));

// Spread term structure
const SPREAD_CURVE = [1, 2, 3, 4, 5].map((tenor, i) => ({
  tenor: `${tenor}Y`,
  indemnity:    (450 + tenor * 40 + sr(i * 7) * 80).toFixed(0),
  industryIdx:  (380 + tenor * 35 + sr(i * 11) * 60).toFixed(0),
  parametric:   (320 + tenor * 30 + sr(i * 13) * 50).toFixed(0),
  modeledLoss:  (360 + tenor * 32 + sr(i * 17) * 55).toFixed(0),
}));

const PERIL_PIE = PERILS.map((p, i) => ({
  name: p,
  value: Math.round((8 + sr(i * 5) * 22) * 1e9),
}));
const PIE_COLORS = ['#0f766e', '#1d4ed8', '#6d28d9', '#b45309', T.red, '#0369a1', '#374151'];

const TabBar = ({ tabs, active, onSelect }) => (
  <div style={{ display: 'flex', borderBottom: `2px solid ${T.gold}`, marginBottom: 20 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onSelect(t)} style={{
        padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: active === t ? 700 : 400,
        color: active === t ? T.gold : T.navy, borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent',
        marginBottom: -2,
      }}>{t}</button>
    ))}
  </div>
);

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: 8, padding: '14px 18px', flex: 1 }}>
    <div style={{ fontSize: 11, color: T.gray, fontFamily: 'DM Sans, sans-serif', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.gray, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Section = ({ title, children, badge }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: 8, padding: 20, marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.navy }}>{title}</h3>
      {badge && <span style={{ fontSize: 10, background: T.navy, color: '#fff', padding: '2px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>{badge}</span>}
    </div>
    {children}
  </div>
);

const StatusBadge = ({ status }) => {
  const c = { Active: T.green, Matured: T.gray, Triggered: T.red }[status] || T.gray;
  return <span style={{ background: c, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>{status}</span>;
};

const RatingBadge = ({ rating }) => (
  <span style={{ background: RATING_COLORS[rating] || T.gray, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>{rating}</span>
);

export default function CatBondILSPage() {
  const [tab, setTab] = useState('ILS Market');
  const [perilFilter, setPerilFilter] = useState('All');
  const [triggerFilter, setTriggerFilter] = useState('All');
  const [attachInput, setAttachInput] = useState(3.0);
  const [exhaustInput, setExhaustInput] = useState(8.0);
  const [elossInput, setElossInput] = useState(1.2);

  const totalOutstanding = Math.round(62.4 * 1e9);
  const totalIssuance2024 = Math.round(17.8 * 1e9);
  const avgSpread = activeBonds.reduce((a, b) => a + parseFloat(b.spread), 0) / activeBonds.length;
  const avgMultiple = activeBonds.reduce((a, b) => a + parseFloat(b.multipleOfEL), 0) / activeBonds.length;

  const filteredBonds = activeBonds.filter(b =>
    (perilFilter === 'All' || b.peril === perilFilter) &&
    (triggerFilter === 'All' || b.trigger === triggerFilter)
  );

  // Pricer
  const pricedSpread = useMemo(() => {
    const el = elossInput / 100;
    const attach = attachInput / 100;
    const trigger_discount = triggerFilter === 'Parametric' ? 0.82 : triggerFilter === 'Industry Index' ? 0.88 : triggerFilter === 'Modeled Loss' ? 0.91 : 1.0;
    return (el * 3.2 * trigger_discount * 10000).toFixed(0);
  }, [attachInput, exhaustInput, elossInput, triggerFilter]);

  const TABS = ['ILS Market', 'Bond Universe', 'Cat Bond Pricer', 'Historical Events', 'Spread Analytics'];

  return (
    <div style={{ padding: 24, background: T.cream, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: T.gray, background: '#e9e4db', padding: '3px 8px', borderRadius: 4 }}>EP-BM2</span>
          <span style={{ fontSize: 11, color: T.teal, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>CAT BOND · ILS</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.navy }}>Cat Bond & ILS Analytics</h1>
        <p style={{ margin: '4px 0 0', color: T.gray, fontSize: 13 }}>Insurance-Linked Securities · Trigger mechanisms · Attachment/exhaustion · Spread analytics · Historical loss events</p>
      </div>

      <TabBar tabs={TABS} active={tab} onSelect={setTab} />

      {tab === 'ILS Market' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Outstanding ILS" value={fmt(totalOutstanding)} sub="Global market, 2024" color={T.navy} />
            <Kpi label="2024 Issuance" value={fmt(totalIssuance2024)} sub="Record year" color={T.teal} />
            <Kpi label="Avg Cat Bond Spread" value={`${avgSpread.toFixed(0)}bps`} sub="Current market level" color={T.gold} />
            <Kpi label="Avg Multiple of EL" value={`${avgMultiple.toFixed(2)}×`} sub="Spread / Expected loss" color={T.orange} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            <Section title="ILS Market Outstanding & Issuance Volume" badge="2013–2024">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={MARKET_SIZE} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="year" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Area type="monotone" dataKey="outstanding" name="Outstanding" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="issuance"    name="Issuance"    stroke={T.gold} fill={T.gold} fillOpacity={0.2}  strokeWidth={2} />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Outstanding by Peril" badge="% of Market">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={PERIL_PIE} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}>
                    {PERIL_PIE.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </Section>
          </div>

          <Section title="Cat Bond Spread Index vs Issuance Volume" badge="bps">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={MARKET_SIZE} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="year" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <YAxis style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="spread_index" name="Spread Index (bps)" stroke={T.orange} strokeWidth={2.5} dot={{ r: 4, fill: T.orange }} />
              </LineChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {tab === 'Bond Universe' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: T.gray, marginBottom: 3 }}>Filter by Peril</div>
              <select value={perilFilter} onChange={e => setPerilFilter(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #d1c9bc', borderRadius: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                <option>All</option>
                {PERILS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.gray, marginBottom: 3 }}>Filter by Trigger</div>
              <select value={triggerFilter} onChange={e => setTriggerFilter(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #d1c9bc', borderRadius: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                <option>All</option>
                {TRIGGER_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 12, color: T.gray }}>{filteredBonds.length} bonds shown</span>
            </div>
          </div>

          <Section title="Active Cat Bond Universe">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['ID', 'Peril', 'Trigger', 'Size', 'Maturity', 'Attach%', 'Exhaust%', 'EL%', 'Spread%', 'EL Multiple', 'Rating', 'Status'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBonds.map((b, i) => (
                    <tr key={b.id} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: T.navy }}>{b.id}</td>
                      <td style={{ padding: '7px 10px' }}>{b.peril}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11, color: T.purple }}>{b.trigger}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(b.size)}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{b.maturity}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{b.attachmentPct}%</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{b.exhaustionPct}%</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', color: T.orange }}>{b.eloss}%</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', color: T.teal, fontWeight: 700 }}>{b.spread}%</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', color: parseFloat(b.multipleOfEL) > 4 ? T.green : T.gray }}>{b.multipleOfEL}×</td>
                      <td style={{ padding: '7px 10px' }}><RatingBadge rating={b.rating} /></td>
                      <td style={{ padding: '7px 10px' }}><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="Spread vs Expected Loss (EL Multiple)">
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="eloss" name="EL %" tickFormatter={v => `${v}%`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} label={{ value: 'Expected Loss %', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="spread" name="Spread %" tickFormatter={v => `${v}%`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [`${v}%`, n]} />
                  <Scatter data={filteredBonds.map(b => ({ eloss: parseFloat(b.eloss), spread: parseFloat(b.spread), id: b.id }))} fill={T.teal} opacity={0.7} r={5} />
                </ScatterChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Size Distribution by Trigger Type">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={TRIGGER_TYPES.map(trig => ({
                  trigger: trig.replace(' ', '\n'),
                  total: filteredBonds.filter(b => b.trigger === trig).reduce((a, b) => a + b.size, 0),
                  count: filteredBonds.filter(b => b.trigger === trig).length,
                }))} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="trigger" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10 }} />
                  <YAxis tickFormatter={v => fmt(v)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Bar dataKey="total" name="Total Size" fill={T.teal} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </div>
        </>
      )}

      {tab === 'Cat Bond Pricer' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
            <div>
              <Section title="Bond Parameters">
                {[
                  { label: 'Attachment Point (%)', key: 'attach', value: attachInput, set: setAttachInput, min: 1, max: 20, step: 0.5 },
                  { label: 'Exhaustion Point (%)', key: 'exhaust', value: exhaustInput, set: setExhaustInput, min: attachInput + 1, max: 30, step: 0.5 },
                  { label: 'Expected Loss (%)', key: 'eloss', value: elossInput, set: setElossInput, min: 0.1, max: 5, step: 0.1 },
                ].map(({ label, value, set, min, max, step }) => (
                  <div key={label} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.navy, marginBottom: 4 }}>
                      <span>{label}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', color: T.gold, fontWeight: 700 }}>{value.toFixed(1)}%</span>
                    </div>
                    <input type="range" min={min} max={max} step={step} value={value}
                      onChange={e => set(+e.target.value)} style={{ width: '100%', accentColor: T.gold }} />
                  </div>
                ))}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: T.navy, marginBottom: 6 }}>Trigger Type</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {TRIGGER_TYPES.map(t => (
                      <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                        <input type="radio" name="trigger" value={t} checked={triggerFilter === t} onChange={() => setTriggerFilter(t)} style={{ accentColor: T.gold }} />
                        {t}
                        {t === 'Indemnity' && <span style={{ fontSize: 10, color: T.gray }}>(+20bps basis risk premium)</span>}
                      </label>
                    ))}
                  </div>
                </div>
              </Section>
            </div>

            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <Kpi label="Indicated Spread" value={`${pricedSpread}bps`} sub="Modeled fair value" color={T.teal} />
                <Kpi label="Expected Loss" value={`${elossInput.toFixed(2)}%`} sub="Annual EL estimate" color={T.orange} />
                <Kpi label="EL Multiple" value={`${(parseFloat(pricedSpread) / 100 / elossInput).toFixed(2)}×`} sub="Spread / EL" color={T.purple} />
                <Kpi label="Layer Thickness" value={`${(exhaustInput - attachInput).toFixed(1)}%`} sub="Exhaust − Attach" color={T.navy} />
              </div>

              <Section title="Sensitivity — Spread vs Expected Loss">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={[0.2, 0.5, 0.8, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0].map(el => ({
                    el,
                    indemnity:   Math.round(el * 3.2 * 100),
                    industryIdx: Math.round(el * 3.2 * 0.88 * 100),
                    parametric:  Math.round(el * 3.2 * 0.82 * 100),
                  }))} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                    <XAxis dataKey="el" tickFormatter={v => `${v}%`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                    <YAxis tickFormatter={v => `${v}bps`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                    <Tooltip formatter={v => `${v}bps`} />
                    <ReferenceLine x={elossInput} stroke={T.gold} strokeDasharray="4 4" />
                    <Line dataKey="indemnity"   name="Indemnity"    stroke={T.red}    strokeWidth={2} dot={false} />
                    <Line dataKey="industryIdx" name="Industry Idx" stroke={T.orange} strokeWidth={2} dot={false} strokeDasharray="5 3" />
                    <Line dataKey="parametric"  name="Parametric"   stroke={T.teal}   strokeWidth={2} dot={false} strokeDasharray="3 2" />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </Section>

              <Section title="Trigger Type Spread Discount vs Indemnity">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={TRIGGER_TYPES.map((t, i) => ({ trigger: t, discount: [0, 12, 18, 9][i] }))}
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                    <XAxis dataKey="trigger" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                    <YAxis tickFormatter={v => `${v}%`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                    <Tooltip formatter={v => `${v}% discount`} />
                    <Bar dataKey="discount" name="Spread Discount %" fill={T.teal} radius={[3, 3, 0, 0]}>
                      {TRIGGER_TYPES.map((_, i) => <Cell key={i} fill={[T.red, T.orange, T.teal, T.purple][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </div>
          </div>
        </>
      )}

      {tab === 'Historical Events' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Kpi label="Total Insured Losses" value={`$${LOSS_EVENTS.reduce((a, e) => a + e.insuredLoss, 0)}B`} sub="2017–2024" color={T.red} />
            <Kpi label="Total ILS Impact" value={`$${LOSS_EVENTS.reduce((a, e) => a + e.ilsLoss, 0).toFixed(1)}B`} sub="Triggered losses" color={T.orange} />
            <Kpi label="Events Triggering ILS" value={`${LOSS_EVENTS.filter(e => e.trigger).length} / ${LOSS_EVENTS.length}`} sub="Major cat bond triggers" color={T.teal} />
            <Kpi label="ILS/Insured Ratio" value={`${((LOSS_EVENTS.reduce((a, e) => a + e.ilsLoss, 0) / LOSS_EVENTS.reduce((a, e) => a + e.insuredLoss, 0)) * 100).toFixed(1)}%`} sub="Average loss transfer" color={T.purple} />
          </div>

          <Section title="Historical Loss Events — Insured vs ILS Impact">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={LOSS_EVENTS} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="event" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tickFormatter={v => `$${v}B`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `$${v}B`} />
                <Bar dataKey="insuredLoss" name="Insured Loss ($B)" fill={T.navy} radius={[3, 3, 0, 0]} />
                <Bar dataKey="ilsLoss"     name="ILS Impact ($B)"   fill={T.red}  radius={[3, 3, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Event Detail">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Year', 'Event', 'Peril', 'Insured Loss', 'ILS Impact', 'ILS/Total', 'Cat Bond Trigger'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LOSS_EVENTS.map((e, i) => (
                  <tr key={e.year + e.event} style={{ background: i % 2 === 0 ? '#faf9f7' : '#fff' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{e.year}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{e.event}</td>
                    <td style={{ padding: '8px 12px', color: T.purple }}>{e.peril}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.red }}>${e.insuredLoss}B</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: T.orange }}>${e.ilsLoss}B</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{((e.ilsLoss / e.insuredLoss) * 100).toFixed(1)}%</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ background: e.trigger ? T.red : T.green, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                        {e.trigger ? 'TRIGGERED' : 'NO TRIGGER'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      {tab === 'Spread Analytics' && (
        <>
          <Section title="Spread Term Structure by Trigger Type" badge="bps">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={SPREAD_CURVE} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                <XAxis dataKey="tenor" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }} />
                <YAxis tickFormatter={v => `${v}bps`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                <Tooltip formatter={v => `${v}bps`} />
                <Line dataKey="indemnity"   name="Indemnity"    stroke={T.red}    strokeWidth={2.5} dot={{ r: 5, fill: T.red }} />
                <Line dataKey="industryIdx" name="Industry Idx" stroke={T.orange} strokeWidth={2.5} dot={{ r: 5, fill: T.orange }} />
                <Line dataKey="modeledLoss" name="Modeled Loss" stroke={T.purple} strokeWidth={2.5} dot={{ r: 5, fill: T.purple }} />
                <Line dataKey="parametric"  name="Parametric"   stroke={T.teal}   strokeWidth={2.5} dot={{ r: 5, fill: T.teal }} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Section title="Spread Premium by Peril (3-Year Bonds)">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={PERILS.map((p, i) => ({
                  peril: p.split(' ')[0],
                  spread: Math.round(280 + sr(i * 7) * 400),
                  el:     Math.round(80 + sr(i * 11) * 120),
                }))} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="peril" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${v}bps`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <Tooltip formatter={v => `${v}bps`} />
                  <Bar dataKey="el"     name="Expected Loss" fill={T.orange} radius={[0, 0, 0, 0]} stackId="a" />
                  <Bar dataKey="spread" name="Risk Premium"  fill={T.teal}   radius={[3, 3, 0, 0]} stackId="a" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="EL Multiple Distribution (Active Bonds)">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0].map((bucket, i) => ({
                  range: `${bucket}×`,
                  count: activeBonds.filter(b => parseFloat(b.multipleOfEL) >= bucket && parseFloat(b.multipleOfEL) < bucket + 0.5).length,
                }))} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                  <XAxis dataKey="range" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <YAxis style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
                  <Tooltip formatter={v => `${v} bonds`} />
                  <Bar dataKey="count" name="# Bonds" fill={T.teal} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
