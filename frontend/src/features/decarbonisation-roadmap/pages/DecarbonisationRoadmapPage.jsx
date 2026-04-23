import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const T = {
  bg: '#0f172a', surface: '#1e293b', surfaceH: '#334155', border: '#334155',
  navy: '#3b82f6', gold: '#f59e0b', sage: '#10b981', teal: '#14b8a6',
  text: '#f1f5f9', textSec: '#94a3b8', textMut: '#64748b',
  red: '#ef4444', green: '#22c55e', amber: '#f59e0b', font: 'Inter,sans-serif', mono: 'JetBrains Mono,monospace'
};
const sr = (s) => Math.abs(Math.sin(s * 9301 + 49297) * 233280) % 1;
const KpiCard = ({ label, value, sub, color = T.navy }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textMut, marginTop: 2 }}>{sub}</div>}
  </div>
);

const CORPORATES = [
  { name: 'Shell', sector: 'Energy', baseYear: 2019, baseline: 1620, target2030: 810, target2050: 0, current: 1240, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 65, investMn: 2800, abatement: 'Fuel Switching+CCS', status: 'On Track' },
  { name: 'BP', sector: 'Energy', baseYear: 2019, baseline: 1450, target2030: 580, target2050: 0, current: 1120, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 58, investMn: 3200, abatement: 'Renewables+Electrification', status: 'Behind' },
  { name: 'TotalEnergies', sector: 'Energy', baseYear: 2015, baseline: 1180, target2030: 590, target2050: 0, current: 980, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 72, investMn: 2100, abatement: 'NbS+CCS', status: 'On Track' },
  { name: 'ArcelorMittal', sector: 'Steel', baseYear: 2018, baseline: 208, target2030: 167, target2050: 0, current: 192, netZeroYear: 2050, sbti: 'Approved', carbonPrice: 90, investMn: 4400, abatement: 'Hydrogen DRI', status: 'On Track' },
  { name: 'HeidelbergCement', sector: 'Cement', baseYear: 1990, baseline: 800, target2030: 560, target2050: 0, current: 640, netZeroYear: 2050, sbti: 'Approved', carbonPrice: 85, investMn: 1800, abatement: 'CCS+Alt Fuels', status: 'On Track' },
  { name: 'Maersk', sector: 'Shipping', baseYear: 2020, baseline: 10600, target2030: 10100, target2050: 0, current: 10300, netZeroYear: 2040, sbti: 'Approved', carbonPrice: 110, investMn: 5600, abatement: 'Green Methanol', status: 'Ahead' },
  { name: 'Volkswagen', sector: 'Auto', baseYear: 2018, baseline: 82, target2030: 45, target2050: 0, current: 68, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 50, investMn: 8900, abatement: 'EV Transition', status: 'On Track' },
  { name: 'Microsoft', sector: 'Technology', baseYear: 2020, baseline: 14, target2030: 7, target2050: -14, current: 11, netZeroYear: 2030, sbti: 'Approved', carbonPrice: 145, investMn: 1200, abatement: 'DACCS+Biochar', status: 'Ahead' },
  { name: 'Apple', sector: 'Technology', baseYear: 2019, baseline: 25, target2030: 10, target2050: 0, current: 18, netZeroYear: 2030, sbti: 'Approved', carbonPrice: 200, investMn: 4500, abatement: 'Renewable+Suppliers', status: 'Ahead' },
  { name: 'Unilever', sector: 'Consumer', baseYear: 2015, baseline: 56, target2030: 28, target2050: 0, current: 42, netZeroYear: 2039, sbti: 'Approved', carbonPrice: 68, investMn: 950, abatement: 'Supply Chain+NbS', status: 'On Track' },
  { name: 'Nestle', sector: 'Consumer', baseYear: 2018, baseline: 92, target2030: 37, target2050: 0, current: 71, netZeroYear: 2050, sbti: 'Approved', carbonPrice: 62, investMn: 1400, abatement: 'Agri+Packaging', status: 'Behind' },
  { name: 'Lafarge', sector: 'Cement', baseYear: 1990, baseline: 725, target2030: 480, target2050: 0, current: 590, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 78, investMn: 1200, abatement: 'CCS+Low Carbon Cement', status: 'On Track' },
  { name: 'Rio Tinto', sector: 'Mining', baseYear: 2018, baseline: 32, target2030: 22, target2050: 0, current: 27, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 55, investMn: 7600, abatement: 'Electrification+H2', status: 'On Track' },
  { name: 'BHP', sector: 'Mining', baseYear: 2020, baseline: 38, target2030: 30, target2050: 0, current: 34, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 50, investMn: 4200, abatement: 'Renewables+EV Fleet', status: 'Behind' },
  { name: 'Delta Airlines', sector: 'Aviation', baseYear: 2019, baseline: 45, target2030: 36, target2050: 0, current: 42, netZeroYear: 2050, sbti: 'None', carbonPrice: 38, investMn: 1100, abatement: 'SAF+Offsets', status: 'Behind' },
  { name: 'Siemens Energy', sector: 'Industrials', baseYear: 2019, baseline: 2.8, target2030: 1.4, target2050: 0, current: 2.1, netZeroYear: 2030, sbti: 'Approved', carbonPrice: 120, investMn: 680, abatement: 'Electrification', status: 'Ahead' },
  { name: 'Schneider Electric', sector: 'Industrials', baseYear: 2017, baseline: 1.5, target2030: 0.8, target2050: 0, current: 1.1, netZeroYear: 2025, sbti: 'Approved', carbonPrice: 135, investMn: 420, abatement: 'Efficiency+RE', status: 'Ahead' },
  { name: 'Yara International', sector: 'Agriculture', baseYear: 2018, baseline: 28, target2030: 19, target2050: 0, current: 24, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 72, investMn: 4800, abatement: 'Green Ammonia', status: 'On Track' },
  { name: 'Duke Energy', sector: 'Utilities', baseYear: 2005, baseline: 108, target2030: 65, target2050: 0, current: 84, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 45, investMn: 12000, abatement: 'RE+Nuclear', status: 'On Track' },
  { name: 'Orsted', sector: 'Utilities', baseYear: 2006, baseline: 16, target2030: 0.4, target2050: 0, current: 1.8, netZeroYear: 2025, sbti: 'Approved', carbonPrice: 160, investMn: 5800, abatement: 'Offshore Wind', status: 'Ahead' },
];

const ABATEMENT_LEVERS = [
  { lever: 'Renewable Energy', sector: 'Cross-Sector', potentialMtY: 8.4, cost: -12, maturity: 'Proven', adoption: 72 },
  { lever: 'Energy Efficiency', sector: 'Cross-Sector', potentialMtY: 6.2, cost: -8, maturity: 'Proven', adoption: 68 },
  { lever: 'Electrification (Heat)', sector: 'Industry', potentialMtY: 4.8, cost: 18, maturity: 'Scaling', adoption: 32 },
  { lever: 'Green Hydrogen (DRI)', sector: 'Steel', potentialMtY: 2.6, cost: 95, maturity: 'Demonstration', adoption: 8 },
  { lever: 'Carbon Capture (CCUS)', sector: 'Heavy Industry', potentialMtY: 4.2, cost: 62, maturity: 'Scaling', adoption: 14 },
  { lever: 'Sustainable Aviation Fuel', sector: 'Aviation', potentialMtY: 1.4, cost: 220, maturity: 'Scaling', adoption: 6 },
  { lever: 'Green Methanol/Ammonia', sector: 'Shipping', potentialMtY: 1.8, cost: 180, maturity: 'Demonstration', adoption: 4 },
  { lever: 'Supply Chain Decarbonisation', sector: 'Consumer', potentialMtY: 5.6, cost: 28, maturity: 'Early', adoption: 22 },
  { lever: 'Nature-Based Solutions', sector: 'Cross-Sector', potentialMtY: 3.2, cost: 15, maturity: 'Proven', adoption: 38 },
  { lever: 'Low Carbon Cement', sector: 'Cement', potentialMtY: 1.6, cost: 42, maturity: 'Scaling', adoption: 18 },
  { lever: 'EV Fleet Transition', sector: 'Transport', potentialMtY: 3.8, cost: 8, maturity: 'Scaling', adoption: 44 },
  { lever: 'Circular Economy', sector: 'Manufacturing', potentialMtY: 2.2, cost: -4, maturity: 'Proven', adoption: 29 },
];

const PATHWAY_TREND = ['2020','2021','2022','2023','2024','2025','2026','2027','2028','2029','2030'].map((yr, i) => ({
  year: yr,
  'Committed Path': 100 - i * 4.5 + sr(i) * 1.5,
  'Current Pace': 100 - i * 2.8 + sr(i + 11) * 1.8,
  '1.5°C Required': 100 - i * 6.2,
  'Best Practice': 100 - i * 5.8 + sr(i + 22) * 1.2,
}));

const TABS = ['Overview', 'Corporate Tracker', 'Abatement Levers', 'Pathway Analysis', 'Sector Benchmarks', 'Investment', 'Milestones'];

export default function DecarbonisationRoadmapPage() {
  const [tab, setTab] = useState('Overview');
  const [sectorFilter, setSectorFilter] = useState('All');

  const sectors = ['All', ...new Set(CORPORATES.map(c => c.sector))];
  const filtered = useMemo(() => sectorFilter === 'All' ? CORPORATES : CORPORATES.filter(c => c.sector === sectorFilter), [sectorFilter]);

  const kpis = useMemo(() => {
    const n = filtered.length > 0 ? filtered.length : 1;
    const onTrack = filtered.filter(c => c.status === 'On Track' || c.status === 'Ahead').length;
    const sbtiApproved = filtered.filter(c => c.sbti === 'Approved').length;
    const avgInvest = filtered.reduce((s, c) => s + c.investMn, 0) / n;
    const avgCarbon = filtered.reduce((s, c) => s + c.carbonPrice, 0) / n;
    return { n, onTrack, sbtiApproved, avgInvest: avgInvest.toFixed(0), avgCarbon: avgCarbon.toFixed(0) };
  }, [filtered]);

  const tabBar = { display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20 };
  const tabBtn = (t) => ({ padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', border: 'none', background: tab === t ? T.navy : T.surfaceH, color: tab === t ? '#fff' : T.textSec, fontWeight: tab === t ? 600 : 400 });
  const statusColor = (s) => ({ 'Ahead': T.green, 'On Track': T.sage, 'Behind': T.amber, 'Off Track': T.red }[s] || T.textSec);
  const maturityColor = (m) => ({ 'Proven': T.green, 'Scaling': T.teal, 'Demonstration': T.amber, 'Early': T.red }[m] || T.textSec);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: T.font, color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Decarbonisation Roadmap Builder</div>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>Corporate net-zero pathways, abatement levers & milestone tracking — EP-DI1</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {sectors.map(s => <button key={s} onClick={() => setSectorFilter(s)} style={{ ...tabBtn(s), background: sectorFilter === s ? T.teal : T.surfaceH, color: sectorFilter === s ? '#fff' : T.textSec }}>{s}</button>)}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Corporates" value={kpis.n} sub={`${kpis.onTrack} on track or ahead`} color={T.navy} />
        <KpiCard label="SBTi Approved" value={kpis.sbtiApproved} sub={`of ${kpis.n} corporates`} color={T.green} />
        <KpiCard label="On/Ahead Track" value={`${kpis.onTrack}/${kpis.n}`} sub="pathway compliance" color={T.sage} />
        <KpiCard label="Avg Investment" value={`$${Number(kpis.avgInvest).toLocaleString()}M`} sub="decarbonisation capex" color={T.gold} />
        <KpiCard label="Avg Internal Carbon Price" value={`$${kpis.avgCarbon}/t`} sub="internal price assumption" color={T.teal} />
      </div>

      <div style={tabBar}>{TABS.map(t => <button key={t} style={tabBtn(t)} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Status Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={['Ahead', 'On Track', 'Behind', 'Off Track'].map(s => ({ status: s, count: CORPORATES.filter(c => c.status === s).length }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="status" stroke={T.textSec} fontSize={12} />
                <YAxis stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="count" name="Corporates" radius={[6, 6, 0, 0]} fill={T.navy} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Emission Reduction vs Target (2030)</div>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Target Reduction %" stroke={T.textSec} fontSize={11} label={{ value: 'Target Reduction %', position: 'insideBottom', offset: -4, fill: T.textSec, fontSize: 10 }} />
                <YAxis dataKey="y" name="Current Progress %" stroke={T.textSec} fontSize={11} label={{ value: 'Progress %', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={CORPORATES.map(c => ({ name: c.name, x: Math.round((1 - c.target2030 / c.baseline) * 100), y: Math.round((1 - c.current / c.baseline) * 100) }))} fill={T.teal} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20, gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Aggregate Pathway vs 1.5°C Requirement (Index 2020=100)</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={PATHWAY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" stroke={T.textSec} fontSize={11} />
                <YAxis domain={[0, 105]} stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
                <Line type="monotone" dataKey="1.5°C Required" stroke={T.red} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="Best Practice" stroke={T.green} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Committed Path" stroke={T.navy} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Current Pace" stroke={T.amber} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Corporate Tracker' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['Corporate', 'Sector', 'Baseline', 'Target 2030', 'Current', '2030 Gap', 'Net Zero Year', 'SBTi', 'Carbon Price', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.textSec, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const gap = c.current - c.target2030;
                return (
                  <tr key={c.name} style={{ background: i % 2 === 0 ? T.surface : 'transparent' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{c.sector}</td>
                    <td style={{ padding: '10px 12px', fontFamily: T.mono }}>{c.baseline}</td>
                    <td style={{ padding: '10px 12px', fontFamily: T.mono, color: T.sage }}>{c.target2030}</td>
                    <td style={{ padding: '10px 12px', fontFamily: T.mono }}>{c.current}</td>
                    <td style={{ padding: '10px 12px', fontFamily: T.mono, color: gap > 0 ? T.amber : T.green }}>{gap > 0 ? `+${gap}` : gap}</td>
                    <td style={{ padding: '10px 12px', color: T.gold }}>{c.netZeroYear}</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: c.sbti === 'Approved' ? T.green : c.sbti === 'Committed' ? T.amber : T.textSec, fontSize: 11, fontWeight: 600 }}>{c.sbti}</span></td>
                    <td style={{ padding: '10px 12px', fontFamily: T.mono }}>${c.carbonPrice}</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: statusColor(c.status), fontWeight: 600, fontSize: 11 }}>{c.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Abatement Levers' && (
        <div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Abatement Cost Curve ($/tCO₂ vs Mt/yr potential)</div>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Cost $/tCO₂" stroke={T.textSec} fontSize={11} label={{ value: 'Abatement Cost ($/tCO₂)', position: 'insideBottom', offset: -4, fill: T.textSec, fontSize: 10 }} />
                <YAxis dataKey="y" name="Mt/yr Potential" stroke={T.textSec} fontSize={11} label={{ value: 'Potential (Mt/yr)', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={ABATEMENT_LEVERS.map(l => ({ name: l.lever, x: l.cost, y: l.potentialMtY }))} fill={T.teal} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {ABATEMENT_LEVERS.map(l => (
              <div key={l.lever} style={{ background: T.surface, borderRadius: 8, padding: 16, borderLeft: `3px solid ${maturityColor(l.maturity)}` }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{l.lever}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 10 }}>{l.sector}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {[['Potential', `${l.potentialMtY} Mt/yr`], ['Cost', `$${l.cost}/t`], ['Maturity', l.maturity], ['Adoption', `${l.adoption}%`]].map(([k, v]) => (
                    <div key={k}><div style={{ fontSize: 10, color: T.textSec }}>{k}</div><div style={{ fontSize: 12, fontWeight: 600, color: k === 'Maturity' ? maturityColor(l.maturity) : T.text }}>{v}</div></div>
                  ))}
                </div>
                <div style={{ background: T.surfaceH, borderRadius: 3, height: 6, marginTop: 10 }}>
                  <div style={{ width: `${l.adoption}%`, height: '100%', background: maturityColor(l.maturity), borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Pathway Analysis' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Corporate Investment in Decarbonisation ($M)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filtered].sort((a, b) => b.investMn - a.investMn).slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" stroke={T.textSec} fontSize={11} />
                <YAxis type="category" dataKey="name" stroke={T.textSec} fontSize={10} width={100} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="investMn" fill={T.navy} name="Investment ($M)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Internal Carbon Prices by Corporate</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filtered].sort((a, b) => b.carbonPrice - a.carbonPrice)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" stroke={T.textSec} fontSize={11} />
                <YAxis type="category" dataKey="name" stroke={T.textSec} fontSize={10} width={100} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="carbonPrice" fill={T.gold} name="$/tCO₂" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Sector Benchmarks' && (
        <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Sector Decarbonisation Progress (% vs Baseline)</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={[...new Set(CORPORATES.map(c => c.sector))].map(s => {
              const cos = CORPORATES.filter(c => c.sector === s);
              const n = cos.length > 0 ? cos.length : 1;
              return {
                sector: s,
                progress: +(cos.reduce((sum, c) => sum + (1 - c.current / c.baseline) * 100, 0) / n).toFixed(1),
                target: +(cos.reduce((sum, c) => sum + (1 - c.target2030 / c.baseline) * 100, 0) / n).toFixed(1),
              };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sector" stroke={T.textSec} fontSize={11} angle={-20} textAnchor="end" height={50} />
              <YAxis stroke={T.textSec} fontSize={11} />
              <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
              <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
              <Bar dataKey="progress" fill={T.sage} name="Current Progress %" />
              <Bar dataKey="target" fill={T.navy} name="2030 Target %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 'Investment' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Abatement Potential by Technology (Mt/yr)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...ABATEMENT_LEVERS].sort((a, b) => b.potentialMtY - a.potentialMtY)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="lever" stroke={T.textSec} fontSize={9} angle={-30} textAnchor="end" height={55} />
                <YAxis stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="potentialMtY" fill={T.teal} name="Mt/yr Potential" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Adoption Rate by Abatement Lever</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ABATEMENT_LEVERS} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} stroke={T.textSec} fontSize={11} />
                <YAxis type="category" dataKey="lever" stroke={T.textSec} fontSize={9} width={140} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="adoption" fill={T.gold} name="Adoption %" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Milestones' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {filtered.map(c => {
              const pct2030 = Math.max(0, Math.min(100, ((c.baseline - c.current) / (c.baseline - c.target2030)) * 100));
              return (
                <div key={c.name} style={{ background: T.surface, borderRadius: 10, padding: 16, border: `1px solid ${statusColor(c.status)}40` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>{c.sector}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: statusColor(c.status) }}>{c.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>2030 Milestone Progress</div>
                  <div style={{ background: T.surfaceH, borderRadius: 4, height: 8, marginBottom: 8 }}>
                    <div style={{ width: `${pct2030.toFixed(0)}%`, height: '100%', background: statusColor(c.status), borderRadius: 4 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMut }}>
                    <span>Progress: {pct2030.toFixed(0)}%</span>
                    <span>NZ: {c.netZeroYear}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 6 }}>🔧 {c.abatement}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
