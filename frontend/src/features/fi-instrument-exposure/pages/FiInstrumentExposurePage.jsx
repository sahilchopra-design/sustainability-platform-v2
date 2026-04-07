/**
 * EP-CT2 — FI Instrument Exposure Engine
 * Sprint CT · Financial Institution Profiler
 *
 * Instrument exposure with asset class mix, maturity profile,
 * climate VaR, green vs brown classification, and hedging analysis.
 */
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Instrument Summary', 'Asset Class Mix', 'Maturity Profile', 'Climate VaR by Instrument', 'Green vs Brown', 'Hedging Analysis'];
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const INSTRUMENT_TYPES = [
  { type: 'Term Loan', color: T.navy },
  { type: 'Revolver', color: T.blue },
  { type: 'Bond', color: T.teal },
  { type: 'CDS', color: T.purple },
  { type: 'Equity Swap', color: T.orange },
  { type: 'Mortgage', color: T.sage },
  { type: 'Trade Finance', color: T.amber },
  { type: 'Guarantee', color: T.red },
];

const INSTRUMENTS = Array.from({ length: 200 }, (_, i) => {
  const typeIdx = i % 8;
  const maturity = 2025 + Math.floor(sr(i * 7) * 11);
  const notional = Math.round(5 + sr(i * 11) * 195);
  const isGreen = sr(i * 13) > 0.55;
  return {
    id: `INS-${String(i + 1).padStart(4, '0')}`, type: INSTRUMENT_TYPES[typeIdx].type,
    counterparty: `Client-${(i % 50) + 1}`, notional, maturity,
    climateVaR: Math.round(notional * (0.02 + sr(i * 17) * 0.12)),
    taxonomyAlignment: Math.round(isGreen ? 60 + sr(i * 19) * 40 : sr(i * 23) * 40),
    green: isGreen, currency: ['USD', 'EUR', 'GBP', 'JPY'][i % 4],
  };
});

const TabBar = ({ tabs, active, onSelect }) => (
  <div style={{ display: 'flex', borderBottom: `2px solid ${T.gold}`, marginBottom: 20, flexWrap: 'wrap' }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onSelect(t)} style={{
        padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: T.font, fontSize: 13, fontWeight: active === t ? 700 : 400,
        color: active === t ? T.gold : T.navy,
        borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent',
      }}>{t}</button>
    ))}
  </div>
);

const Card = ({ title, children, style }) => (
  <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16, ...style }}>
    {title && <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 12 }}>{title}</div>}
    {children}
  </div>
);

export default function FiInstrumentExposurePage() {
  const [tab, setTab] = useState(TABS[0]);
  const [filterType, setFilterType] = useState('all');

  const totalNotional = useMemo(() => INSTRUMENTS.reduce((s, i) => s + i.notional, 0), []);
  const totalVaR = useMemo(() => INSTRUMENTS.reduce((s, i) => s + i.climateVaR, 0), []);
  const greenCount = useMemo(() => INSTRUMENTS.filter(i => i.green).length, []);

  const assetClassMix = useMemo(() => {
    const map = {};
    INSTRUMENTS.forEach(inst => { if (!map[inst.type]) map[inst.type] = { type: inst.type, notional: 0, count: 0, var: 0 }; map[inst.type].notional += inst.notional; map[inst.type].count++; map[inst.type].var += inst.climateVaR; });
    return Object.values(map).sort((a, b) => b.notional - a.notional);
  }, []);

  const maturityProfile = useMemo(() => {
    const map = {};
    INSTRUMENTS.forEach(inst => { if (!map[inst.maturity]) map[inst.maturity] = { year: inst.maturity, notional: 0, count: 0 }; map[inst.maturity].notional += inst.notional; map[inst.maturity].count++; });
    return Object.values(map).sort((a, b) => a.year - b.year);
  }, []);

  const varByType = useMemo(() => assetClassMix.map(a => ({
    type: a.type, var: a.var, varPct: ((a.var / a.notional) * 100).toFixed(1),
  })), [assetClassMix]);

  const greenBrown = useMemo(() => {
    const green = INSTRUMENTS.filter(i => i.green);
    const brown = INSTRUMENTS.filter(i => !i.green);
    return {
      summary: [
        { label: 'Green', count: green.length, notional: green.reduce((s, i) => s + i.notional, 0), avgAlign: Math.round(green.reduce((s, i) => s + i.taxonomyAlignment, 0) / green.length) },
        { label: 'Brown', count: brown.length, notional: brown.reduce((s, i) => s + i.notional, 0), avgAlign: Math.round(brown.reduce((s, i) => s + i.taxonomyAlignment, 0) / brown.length) },
      ],
      pie: [
        { name: 'Green', value: green.reduce((s, i) => s + i.notional, 0), fill: T.green },
        { name: 'Brown', value: brown.reduce((s, i) => s + i.notional, 0), fill: '#78716c' },
      ],
    };
  }, []);

  const hedgingData = useMemo(() => INSTRUMENT_TYPES.map((it, i) => ({
    type: it.type, grossExposure: Math.round(500 + sr(i * 7) * 3000),
    hedged: Math.round(200 + sr(i * 11) * 1500), hedgeRatio: Math.round(20 + sr(i * 13) * 60),
    instrument: ['Interest Rate Swap', 'CDS', 'Currency Forward', 'Commodity Future', 'Options Collar', 'Total Return Swap', 'Weather Derivative', 'Cat Bond'][i],
  })), []);

  const filtered = useMemo(() => {
    if (filterType === 'all') return INSTRUMENTS;
    return INSTRUMENTS.filter(i => i.type === filterType);
  }, [filterType]);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 4 }}>EP-CT2 · SPRINT CT</div>
          <h1 style={{ fontSize: 26, color: T.navy, margin: 0 }}>FI Instrument Exposure Engine</h1>
          <p style={{ color: T.textSec, fontSize: 14, margin: '6px 0 0' }}>
            {INSTRUMENTS.length} instruments · ${(totalNotional / 1000).toFixed(1)}B notional · 8 asset classes
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Notional', value: `$${(totalNotional / 1000).toFixed(1)}B` },
            { label: 'Instruments', value: INSTRUMENTS.length },
            { label: 'Climate VaR', value: `$${totalVaR}M`, color: T.red },
            { label: 'Green Ratio', value: `${((greenCount / INSTRUMENTS.length) * 100).toFixed(0)}%`, color: T.green },
            { label: 'Asset Classes', value: 8 },
          ].map((k, i) => (
            <Card key={i} style={{ textAlign: 'center', padding: 14 }}>
              <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: k.color || T.navy }}>{k.value}</div>
            </Card>
          ))}
        </div>

        <TabBar tabs={TABS} active={tab} onSelect={setTab} />

        {/* Tab 1 */}
        {tab === TABS[0] && (
          <Card title="Instrument Summary">
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.font, fontSize: 12, marginBottom: 12 }}>
              <option value="all">All Types</option>
              {INSTRUMENT_TYPES.map(it => <option key={it.type} value={it.type}>{it.type}</option>)}
            </select>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.font }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ textAlign: 'left', padding: 5 }}>ID</th>
                    <th style={{ textAlign: 'left', padding: 5 }}>Type</th>
                    <th style={{ textAlign: 'right', padding: 5 }}>Notional $M</th>
                    <th style={{ textAlign: 'center', padding: 5 }}>Maturity</th>
                    <th style={{ textAlign: 'right', padding: 5 }}>CVaR $M</th>
                    <th style={{ textAlign: 'center', padding: 5 }}>Align %</th>
                    <th style={{ textAlign: 'center', padding: 5 }}>Class</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 30).map(inst => (
                    <tr key={inst.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: 5, fontFamily: T.mono, color: T.textMut }}>{inst.id}</td>
                      <td style={{ padding: 5 }}>{inst.type}</td>
                      <td style={{ padding: 5, textAlign: 'right', fontFamily: T.mono }}>{inst.notional}</td>
                      <td style={{ textAlign: 'center', padding: 5, fontFamily: T.mono }}>{inst.maturity}</td>
                      <td style={{ padding: 5, textAlign: 'right', fontFamily: T.mono, color: T.red }}>{inst.climateVaR}</td>
                      <td style={{ textAlign: 'center', padding: 5, fontFamily: T.mono }}>{inst.taxonomyAlignment}%</td>
                      <td style={{ textAlign: 'center', padding: 5 }}>
                        <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, color: '#fff', background: inst.green ? T.green : '#78716c' }}>{inst.green ? 'GREEN' : 'BROWN'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 2 */}
        {tab === TABS[1] && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card title="Asset Class Pie">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={assetClassMix.map((a, i) => ({ ...a, name: a.type, value: a.notional, fill: INSTRUMENT_TYPES[i % 8].color }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, value }) => `${name}: $${value}M`}>
                    {assetClassMix.map((_, i) => <Cell key={i} fill={INSTRUMENT_TYPES[i % 8].color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Asset Class Table">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ textAlign: 'left', padding: 6 }}>Type</th>
                    <th style={{ textAlign: 'right', padding: 6 }}># Instruments</th>
                    <th style={{ textAlign: 'right', padding: 6 }}>Notional $M</th>
                    <th style={{ textAlign: 'right', padding: 6 }}>CVaR $M</th>
                  </tr>
                </thead>
                <tbody>
                  {assetClassMix.map((a, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: 6, fontWeight: 600 }}>{a.type}</td>
                      <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>{a.count}</td>
                      <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>{a.notional.toLocaleString()}</td>
                      <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono, color: T.red }}>{a.var}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* Tab 3 */}
        {tab === TABS[2] && (
          <Card title="Maturity Profile (2025-2035)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={maturityProfile}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <YAxis tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <Bar dataKey="notional" fill={T.navy} name="Notional $M" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Tab 4 */}
        {tab === TABS[3] && (
          <Card title="Climate VaR by Instrument Type">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={varByType}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="type" tick={{ fontFamily: T.font, fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <Bar dataKey="var" fill={T.red} name="CVaR $M" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Tab 5 */}
        {tab === TABS[4] && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card title="Green vs Brown Classification">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={greenBrown.pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: $${value}M`}>
                    {greenBrown.pie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Green/Brown Summary">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: T.font }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ textAlign: 'left', padding: 8 }}>Classification</th>
                    <th style={{ textAlign: 'right', padding: 8 }}>Count</th>
                    <th style={{ textAlign: 'right', padding: 8 }}>Notional $M</th>
                    <th style={{ textAlign: 'right', padding: 8 }}>Avg Alignment</th>
                  </tr>
                </thead>
                <tbody>
                  {greenBrown.summary.map((s, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: 8 }}>
                        <span style={{ padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#fff', background: s.label === 'Green' ? T.green : '#78716c' }}>{s.label}</span>
                      </td>
                      <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono }}>{s.count}</td>
                      <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono }}>{s.notional.toLocaleString()}</td>
                      <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono, fontWeight: 700 }}>{s.avgAlign}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* Tab 6 */}
        {tab === TABS[5] && (
          <Card title="Hedging Analysis by Asset Class">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>Asset Class</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Gross $M</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Hedged $M</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Hedge Ratio</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Hedge Instrument</th>
                </tr>
              </thead>
              <tbody>
                {hedgingData.map((h, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 6, fontWeight: 600 }}>{h.type}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>{h.grossExposure.toLocaleString()}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>{h.hedged.toLocaleString()}</td>
                    <td style={{ textAlign: 'center', padding: 6 }}>
                      <span style={{ fontFamily: T.mono, fontWeight: 700, color: h.hedgeRatio >= 50 ? T.green : h.hedgeRatio >= 30 ? T.amber : T.red }}>{h.hedgeRatio}%</span>
                    </td>
                    <td style={{ padding: 6, fontSize: 11, color: T.textSec }}>{h.instrument}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <div style={{ marginTop: 24, padding: '12px 16px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: T.mono, color: T.textMut }}>
          <span>EP-CT2 · FI Instrument Exposure Engine</span>
          <span>Sprint CT · {new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>
    </div>
  );
}
