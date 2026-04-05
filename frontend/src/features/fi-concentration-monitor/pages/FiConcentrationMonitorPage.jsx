/**
 * EP-CT5 — FI Concentration & Limit Monitor
 * Sprint CT · Financial Institution Profiler
 *
 * Concentration monitoring with limit dashboard, sector limits, country limits,
 * single name limits, HHI analysis, and breach history.
 */
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { HIGH_IMPACT_SECTORS, GEOGRAPHIC_REGIONS } from '../../../data/taxonomyTree';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Limit Dashboard', 'Sector Limits', 'Country Limits', 'Single Name', 'HHI Analysis', 'Breach History'];
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const trafficLight = (pct) => pct > 95 ? { color: T.red, label: 'RED' } : pct > 80 ? { color: T.amber, label: 'AMBER' } : { color: T.green, label: 'GREEN' };

const SECTOR_LIMITS = HIGH_IMPACT_SECTORS.map((s, i) => {
  const limit = Math.round(2000 + sr(i * 7) * 6000);
  const current = Math.round(limit * (0.4 + sr(i * 11) * 0.55));
  return { sector: s.name, code: s.code, limit, current, utilPct: Math.round((current / limit) * 100) };
});

const COUNTRY_LIMITS = GEOGRAPHIC_REGIONS.map((r, i) => {
  const limit = Math.round(3000 + sr(i * 7) * 8000);
  const current = Math.round(limit * (0.35 + sr(i * 13) * 0.6));
  return { region: r.name, code: r.code, limit, current, utilPct: Math.round((current / limit) * 100) };
});

const SINGLE_NAME = Array.from({ length: 10 }, (_, i) => {
  const names = ['Shell plc', 'BP plc', 'TotalEnergies', 'HSBC Holdings', 'Rio Tinto', 'ArcelorMittal', 'NextEra Energy', 'Enel SpA', 'Deutsche Bank', 'BHP Group'];
  const limit = Math.round(200 + sr(i * 7) * 800);
  const current = Math.round(limit * (0.5 + sr(i * 11) * 0.45));
  return { name: names[i], limit, current, utilPct: Math.round((current / limit) * 100) };
});

const BREACH_LOG = Array.from({ length: 12 }, (_, i) => {
  const types = ['Sector', 'Country', 'Single Name', 'Sector', 'Country', 'Single Name'];
  const d = new Date(2026, 3 - Math.floor(i / 4), 28 - i * 2);
  return {
    id: i + 1, date: d.toISOString().split('T')[0], type: types[i % 6],
    entity: ['Energy', 'MENA', 'Shell plc', 'Mining', 'LATAM', 'BP plc', 'Steel', 'APAC_E', 'TotalEnergies', 'Utilities', 'EUR_W', 'HSBC'][i],
    limitPct: Math.round(96 + sr(i * 7) * 12), response: i % 3 === 0 ? 'Limit increased' : i % 3 === 1 ? 'Exposure reduced' : 'Waiver approved',
    status: i < 4 ? 'OPEN' : 'RESOLVED',
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

export default function FiConcentrationMonitorPage() {
  const [tab, setTab] = useState(TABS[0]);

  const sectorBreaches = useMemo(() => SECTOR_LIMITS.filter(s => s.utilPct > 95).length, []);
  const countryBreaches = useMemo(() => COUNTRY_LIMITS.filter(c => c.utilPct > 95).length, []);
  const singleBreaches = useMemo(() => SINGLE_NAME.filter(s => s.utilPct > 95).length, []);

  const sectorHHI = useMemo(() => {
    const total = SECTOR_LIMITS.reduce((s, l) => s + l.current, 0);
    return Math.round(SECTOR_LIMITS.reduce((s, l) => s + Math.pow((l.current / total) * 100, 2), 0));
  }, []);

  const geoHHI = useMemo(() => {
    const total = COUNTRY_LIMITS.reduce((s, l) => s + l.current, 0);
    return Math.round(COUNTRY_LIMITS.reduce((s, l) => s + Math.pow((l.current / total) * 100, 2), 0));
  }, []);

  const limitSummary = useMemo(() => {
    const all = [...SECTOR_LIMITS, ...COUNTRY_LIMITS, ...SINGLE_NAME];
    return {
      green: all.filter(l => l.utilPct <= 80).length,
      amber: all.filter(l => l.utilPct > 80 && l.utilPct <= 95).length,
      red: all.filter(l => l.utilPct > 95).length,
    };
  }, []);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 4 }}>EP-CT5 · SPRINT CT</div>
          <h1 style={{ fontSize: 26, color: T.navy, margin: 0 }}>FI Concentration & Limit Monitor</h1>
          <p style={{ color: T.textSec, fontSize: 14, margin: '6px 0 0' }}>
            {SECTOR_LIMITS.length} sector limits · {COUNTRY_LIMITS.length} geo limits · {SINGLE_NAME.length} single-name limits
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Green', value: limitSummary.green, color: T.green },
            { label: 'Amber', value: limitSummary.amber, color: T.amber },
            { label: 'Red / Breach', value: limitSummary.red, color: T.red },
            { label: 'Sector HHI', value: sectorHHI, color: sectorHHI > 1800 ? T.red : sectorHHI > 1000 ? T.amber : T.green },
            { label: 'Geo HHI', value: geoHHI, color: geoHHI > 1800 ? T.red : geoHHI > 1000 ? T.amber : T.green },
          ].map((k, i) => (
            <Card key={i} style={{ textAlign: 'center', padding: 14 }}>
              <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.value}</div>
            </Card>
          ))}
        </div>

        <TabBar tabs={TABS} active={tab} onSelect={setTab} />

        {/* Tab 1: Dashboard */}
        {tab === TABS[0] && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card title="Traffic Light Summary">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={[
                    { name: 'Green', value: limitSummary.green, fill: T.green },
                    { name: 'Amber', value: limitSummary.amber, fill: T.amber },
                    { name: 'Red', value: limitSummary.red, fill: T.red },
                  ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                    <Cell fill={T.green} /><Cell fill={T.amber} /><Cell fill={T.red} />
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Top Utilization">
              {[...SECTOR_LIMITS, ...COUNTRY_LIMITS, ...SINGLE_NAME]
                .sort((a, b) => b.utilPct - a.utilPct).slice(0, 8).map((l, i) => {
                  const tl = trafficLight(l.utilPct);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: tl.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, flex: 1 }}>{l.sector || l.region || l.name}</span>
                      <div style={{ width: 100, height: 8, background: T.border, borderRadius: 4, flexShrink: 0 }}>
                        <div style={{ width: `${Math.min(l.utilPct, 100)}%`, height: '100%', background: tl.color, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: tl.color, width: 40, textAlign: 'right' }}>{l.utilPct}%</span>
                    </div>
                  );
                })}
            </Card>
          </div>
        )}

        {/* Tab 2: Sector Limits */}
        {tab === TABS[1] && (
          <Card title="Sector Concentration Limits">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>Sector</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Limit $M</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Current $M</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Utilization</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {SECTOR_LIMITS.map((s, i) => { const tl = trafficLight(s.utilPct); return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: s.utilPct > 95 ? '#fee2e2' : 'transparent' }}>
                    <td style={{ padding: 6, fontWeight: 600 }}>{s.sector}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>{s.limit.toLocaleString()}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>{s.current.toLocaleString()}</td>
                    <td style={{ textAlign: 'center', padding: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                        <div style={{ width: 60, height: 8, background: T.border, borderRadius: 4 }}>
                          <div style={{ width: `${Math.min(s.utilPct, 100)}%`, height: '100%', background: tl.color, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontFamily: T.mono, fontWeight: 700, color: tl.color }}>{s.utilPct}%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: 6 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff', background: tl.color }}>{tl.label}</span>
                    </td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </Card>
        )}

        {/* Tab 3: Country */}
        {tab === TABS[2] && (
          <Card title="Geographic Concentration Limits">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={COUNTRY_LIMITS.sort((a, b) => b.utilPct - a.utilPct)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="code" tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <YAxis domain={[0, 110]} tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <ReferenceLine y={95} stroke={T.red} strokeDasharray="5 5" label="Red" />
                <ReferenceLine y={80} stroke={T.amber} strokeDasharray="5 5" label="Amber" />
                <Bar dataKey="utilPct" name="Utilization %" radius={[4, 4, 0, 0]}>
                  {COUNTRY_LIMITS.sort((a, b) => b.utilPct - a.utilPct).map((c, i) => {
                    const tl = trafficLight(c.utilPct);
                    return <Cell key={i} fill={tl.color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Tab 4: Single Name */}
        {tab === TABS[3] && (
          <Card title="Single Name Concentration Limits">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>Counterparty</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Limit $M</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Current $M</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Utilization</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {SINGLE_NAME.sort((a, b) => b.utilPct - a.utilPct).map((s, i) => { const tl = trafficLight(s.utilPct); return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: s.utilPct > 95 ? '#fee2e2' : 'transparent' }}>
                    <td style={{ padding: 6, fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>{s.limit}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>{s.current}</td>
                    <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono, fontWeight: 700, color: tl.color }}>{s.utilPct}%</td>
                    <td style={{ textAlign: 'center', padding: 6 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff', background: tl.color }}>{tl.label}</span>
                    </td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </Card>
        )}

        {/* Tab 5: HHI */}
        {tab === TABS[4] && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card title={`Sector HHI: ${sectorHHI}`}>
              <div style={{ fontSize: 13, marginBottom: 12, color: T.textSec }}>
                HHI = sum of squared market shares. &lt;1000 = unconcentrated, 1000-1800 = moderate, &gt;1800 = concentrated.
              </div>
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: sectorHHI > 1800 ? T.red : sectorHHI > 1000 ? T.amber : T.green }}>{sectorHHI}</div>
                <div style={{ fontSize: 14, color: T.textSec }}>{sectorHHI > 1800 ? 'Highly Concentrated' : sectorHHI > 1000 ? 'Moderately Concentrated' : 'Unconcentrated'}</div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={SECTOR_LIMITS.map(s => ({ name: s.code, share: Math.round((s.current / SECTOR_LIMITS.reduce((sum, l) => sum + l.current, 0)) * 100) }))}>
                  <XAxis dataKey="name" tick={{ fontFamily: T.mono, fontSize: 10 }} />
                  <YAxis tick={{ fontFamily: T.mono, fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  <Bar dataKey="share" fill={T.navy} name="Market Share %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title={`Geographic HHI: ${geoHHI}`}>
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: geoHHI > 1800 ? T.red : geoHHI > 1000 ? T.amber : T.green }}>{geoHHI}</div>
                <div style={{ fontSize: 14, color: T.textSec }}>{geoHHI > 1800 ? 'Highly Concentrated' : geoHHI > 1000 ? 'Moderately Concentrated' : 'Unconcentrated'}</div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={COUNTRY_LIMITS.map(c => ({ name: c.code, share: Math.round((c.current / COUNTRY_LIMITS.reduce((sum, l) => sum + l.current, 0)) * 100) }))}>
                  <XAxis dataKey="name" tick={{ fontFamily: T.mono, fontSize: 10 }} />
                  <YAxis tick={{ fontFamily: T.mono, fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                  <Bar dataKey="share" fill={T.gold} name="Market Share %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* Tab 6: Breach History */}
        {tab === TABS[5] && (
          <Card title="Breach History Log">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'center', padding: 6 }}>#</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Date</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Type</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Entity</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Limit %</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Response</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {BREACH_LOG.map(b => (
                  <tr key={b.id} style={{ borderBottom: `1px solid ${T.border}`, background: b.status === 'OPEN' ? '#fee2e2' : 'transparent' }}>
                    <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono, color: T.textMut }}>{b.id}</td>
                    <td style={{ padding: 6, fontFamily: T.mono, fontSize: 11 }}>{b.date}</td>
                    <td style={{ padding: 6 }}>{b.type}</td>
                    <td style={{ padding: 6, fontWeight: 600 }}>{b.entity}</td>
                    <td style={{ textAlign: 'center', padding: 6, fontFamily: T.mono, fontWeight: 700, color: T.red }}>{b.limitPct}%</td>
                    <td style={{ padding: 6, color: T.textSec }}>{b.response}</td>
                    <td style={{ textAlign: 'center', padding: 6 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff', background: b.status === 'OPEN' ? T.red : T.green }}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <div style={{ marginTop: 24, padding: '12px 16px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: T.mono, color: T.textMut }}>
          <span>EP-CT5 · FI Concentration & Limit Monitor</span>
          <span>Sprint CT · {new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>
    </div>
  );
}
