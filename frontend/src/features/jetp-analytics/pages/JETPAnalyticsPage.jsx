import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Legend,
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const REGIONS = ['Sub-Saharan Africa', 'South Asia', 'East Asia', 'Latin America', 'MENA'];
const STATUSES = ['On Track', 'Delayed', 'At Risk'];

const JETP_COUNTRIES = [
  { id: 0,  name: 'South Africa',   region: 'Sub-Saharan Africa' },
  { id: 1,  name: 'Indonesia',      region: 'East Asia'          },
  { id: 2,  name: 'Vietnam',        region: 'East Asia'          },
  { id: 3,  name: 'India',          region: 'South Asia'         },
  { id: 4,  name: 'Senegal',        region: 'Sub-Saharan Africa' },
  { id: 5,  name: 'Egypt',          region: 'MENA'               },
  { id: 6,  name: 'Kenya',          region: 'Sub-Saharan Africa' },
  { id: 7,  name: 'Philippines',    region: 'East Asia'          },
  { id: 8,  name: 'Morocco',        region: 'MENA'               },
  { id: 9,  name: 'Nigeria',        region: 'Sub-Saharan Africa' },
  { id: 10, name: 'Pakistan',       region: 'South Asia'         },
  { id: 11, name: 'Bangladesh',     region: 'South Asia'         },
  { id: 12, name: 'Colombia',       region: 'Latin America'      },
  { id: 13, name: 'Brazil',         region: 'Latin America'      },
  { id: 14, name: 'Kazakhstan',     region: 'MENA'               },
].map((c, i) => ({
  ...c,
  coalCapacity: +(5 + sr(i * 7) * 45).toFixed(1),
  retirementTarget: +(2 + sr(i * 11) * 25).toFixed(1),
  renewableTarget: +(3 + sr(i * 13) * 47).toFixed(1),
  pledgedFinance: +(1 + sr(i * 17) * 29).toFixed(1),
  disbursedFinance: +(0.1 + sr(i * 19) * 12).toFixed(1),
  justTransitionWorkers: +(0.05 + sr(i * 23) * 1.95).toFixed(2),
  ipRecommendations: Math.round(5 + sr(i * 29) * 45),
  implementationScore: Math.round(20 + sr(i * 31) * 75),
  coalJobsAtRisk: Math.round(10 + sr(i * 37) * 290),
  renewableJobsCreated: Math.round(5 + sr(i * 41) * 245),
  energyPovertyRisk: +(1 + sr(i * 43) * 9).toFixed(1),
  status: STATUSES[Math.floor(sr(i * 47) * 3)],
}));

const TABS = [
  'Country Overview', 'Coal Transition', 'Renewable Build-Out', 'Finance Pledges vs Disbursements',
  'Just Transition Workers', 'IP Recommendations', 'Implementation Tracker', 'Outcomes Dashboard',
];

const STATUS_COLORS = { 'On Track': T.green, 'Delayed': T.amber, 'At Risk': T.red };

const kpi = (label, value, sub, color) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', minWidth: 160, flex: 1 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function JETPAnalyticsPage() {
  const [tab, setTab] = useState(0);
  const [regionFilter, setRegionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [disbursementRate, setDisbursementRate] = useState(40);
  const [coalAcceleration, setCoalAcceleration] = useState(2);

  const filtered = useMemo(() => JETP_COUNTRIES.filter(c => {
    if (regionFilter !== 'All' && c.region !== regionFilter) return false;
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    return true;
  }), [regionFilter, statusFilter]);

  const totalRetirement = filtered.reduce((a, c) => a + c.retirementTarget, 0);
  const totalPledged = filtered.reduce((a, c) => a + c.pledgedFinance, 0);
  const avgImpl = filtered.length ? filtered.reduce((a, c) => a + c.implementationScore, 0) / filtered.length : 0;
  const totalWorkers = filtered.reduce((a, c) => a + c.justTransitionWorkers, 0);

  // Adjusted disbursement with slider
  const projectedDisbursed = filtered.reduce((a, c) => a + c.pledgedFinance * disbursementRate / 100, 0);

  const selStyle = active => ({
    padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    background: active ? T.navy : T.sub, color: active ? '#fff' : T.textSec,
    border: `1px solid ${active ? T.navy : T.border}`, fontFamily: T.fontMono,
  });

  const financeData = filtered.map(c => ({
    name: c.name.slice(0, 10),
    pledged: c.pledgedFinance,
    disbursed: +(c.pledgedFinance * disbursementRate / 100).toFixed(2),
  }));

  const coalData = [...filtered].sort((a, b) => b.retirementTarget - a.retirementTarget).map(c => ({
    name: c.name.slice(0, 10),
    target: c.retirementTarget,
    capacity: c.coalCapacity,
    adjusted: +(c.retirementTarget + coalAcceleration).toFixed(1),
  }));

  const implScatterData = filtered.map(c => ({
    x: c.pledgedFinance,
    y: c.implementationScore,
    name: c.name,
  }));

  const workerData = filtered.map(c => ({
    name: c.name.slice(0, 10),
    atRisk: c.coalJobsAtRisk,
    created: c.renewableJobsCreated,
  }));

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'DM Sans',sans-serif", color: T.textPri }}>
      <div style={{ background: T.navy, padding: '24px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, marginBottom: 4 }}>EP-DH3 · EMERGING MARKETS & DEVELOPMENT FINANCE</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>JETP Analytics Platform</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
          15 JETP Countries · Coal Transition · Finance Pledges · Just Transition Workers · Implementation Tracker
        </div>
      </div>

      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: T.sub }}>
          <option value="All">All Regions</option>
          {REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: T.sub }}>
          <option value="All">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 24, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: T.textSec }}>
            Disbursement Rate: <strong style={{ color: T.navy }}>{disbursementRate}%</strong>
            <input type="range" min={10} max={100} value={disbursementRate} onChange={e => setDisbursementRate(+e.target.value)} style={{ marginLeft: 8, width: 80 }} />
          </label>
          <label style={{ fontSize: 12, color: T.textSec }}>
            Coal Retirement Acceleration: <strong style={{ color: T.navy }}>+{coalAcceleration}GW/yr</strong>
            <input type="range" min={0} max={10} value={coalAcceleration} onChange={e => setCoalAcceleration(+e.target.value)} style={{ marginLeft: 8, width: 80 }} />
          </label>
        </div>
      </div>

      <div style={{ padding: '20px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {kpi('Total Coal Retirement Target', `${totalRetirement.toFixed(1)}GW`, 'by 2030', T.amber)}
        {kpi('Total Pledged Finance', `$${totalPledged.toFixed(1)}Bn`, `$${projectedDisbursed.toFixed(1)}Bn projected disbursed`, T.blue)}
        {kpi('Avg Implementation Score', avgImpl.toFixed(1), 'out of 100', avgImpl >= 60 ? T.green : avgImpl >= 40 ? T.amber : T.red)}
        {kpi('Total Workers Affected', `${totalWorkers.toFixed(2)}M`, `${filtered.length} JETP countries`, T.indigo)}
      </div>

      <div style={{ padding: '0 32px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => <button key={t} onClick={() => setTab(i)} style={selStyle(tab === i)}>{t}</button>)}
      </div>

      <div style={{ padding: '0 32px 40px' }}>
        {tab === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Country','Region','Coal (GW)','Retirement (GW)','Renewable (GW)','Pledged ($Bn)','Impl. Score','Status'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '8px 12px', color: T.textSec, fontSize: 11 }}>{c.region.split(' ')[0]}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{c.coalCapacity.toFixed(1)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.amber }}>{c.retirementTarget.toFixed(1)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.green }}>{c.renewableTarget.toFixed(1)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.blue }}>${c.pledgedFinance.toFixed(1)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: c.implementationScore >= 60 ? T.green : c.implementationScore >= 40 ? T.amber : T.red }}>{c.implementationScore}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ background: STATUS_COLORS[c.status] + '20', color: STATUS_COLORS[c.status], padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Coal Capacity vs Retirement Targets (GW) — Acceleration: +{coalAcceleration}GW/yr</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={coalData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} unit="GW" />
                <Tooltip formatter={v => `${v}GW`} />
                <Legend />
                <Bar dataKey="capacity" fill={T.textSec} name="Current Coal Capacity" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" fill={T.amber} name="2030 Retirement Target" radius={[4, 4, 0, 0]} />
                <Bar dataKey="adjusted" fill={T.red} name="Accelerated Retirement" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Renewable Build-Out Targets by 2030 (GW)</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={[...filtered].sort((a, b) => b.renewableTarget - a.renewableTarget).map(c => ({ name: c.name.slice(0, 10), renewable: c.renewableTarget, energyPoverty: c.energyPovertyRisk }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} unit="GW" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="renewable" fill={T.green} name="Renewable Target (GW)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="energyPoverty" fill={T.orange} name="Energy Poverty Risk (0-10)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: T.navy }}>Finance Pledges vs Disbursements ($Bn)</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>Disbursement Rate: {disbursementRate}% · Total Disbursed: ${projectedDisbursed.toFixed(1)}Bn</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={financeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} unit="Bn" />
                <Tooltip formatter={v => `$${v}Bn`} />
                <Legend />
                <Bar dataKey="pledged" fill={T.blue} name="Pledged Finance" radius={[4, 4, 0, 0]} />
                <Bar dataKey="disbursed" fill={T.teal} name="Disbursed (projected)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Just Transition: Jobs at Risk vs Created</div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={workerData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} unit="k" />
                <Tooltip formatter={v => `${v}k workers`} />
                <Legend />
                <Bar dataKey="atRisk" fill={T.red} name="Coal Jobs at Risk (k)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="created" fill={T.green} name="Renewable Jobs Created (k)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>IP Recommendations & Finance Correlation</div>
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="x" name="IP Recommendations" label={{ value: 'IP Recommendations (count)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis dataKey="y" name="Pledged Finance ($Bn)" label={{ value: 'Pledged Finance ($Bn)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.[0] ? (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', fontSize: 12, borderRadius: 6 }}>
                    <div style={{ fontWeight: 700 }}>{payload[0].payload.name}</div>
                    <div>IP Recs: {payload[0].payload.x}</div>
                    <div>Pledged: ${payload[0].payload.y}Bn</div>
                  </div>
                ) : null} />
                <Scatter data={filtered.map(c => ({ x: c.ipRecommendations, y: c.pledgedFinance, name: c.name }))} fill={T.purple} fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Implementation Tracker</div>
            {filtered.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                <div style={{ width: 120, fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                <div style={{ flex: 1, background: T.sub, borderRadius: 6, height: 18 }}>
                  <div style={{ height: '100%', background: c.implementationScore >= 60 ? T.green : c.implementationScore >= 40 ? T.amber : T.red, width: `${c.implementationScore}%`, borderRadius: 6 }} />
                </div>
                <div style={{ width: 36, textAlign: 'right', fontFamily: T.fontMono, fontSize: 12, fontWeight: 700 }}>{c.implementationScore}</div>
                <div style={{ width: 80 }}>
                  <span style={{ background: STATUS_COLORS[c.status] + '20', color: STATUS_COLORS[c.status], padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Finance vs Implementation Score</div>
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="x" name="Pledged Finance ($Bn)" label={{ value: 'Pledged Finance ($Bn)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                <YAxis dataKey="y" name="Implementation Score" label={{ value: 'Implementation Score', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.[0] ? (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', fontSize: 12, borderRadius: 6 }}>
                    <div style={{ fontWeight: 700 }}>{payload[0].payload.name}</div>
                    <div>Finance: ${payload[0].payload.x}Bn</div>
                    <div>Implementation: {payload[0].payload.y}</div>
                  </div>
                ) : null} />
                <Scatter data={implScatterData} fill={T.teal} fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
