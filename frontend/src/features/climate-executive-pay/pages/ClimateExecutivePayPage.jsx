import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';

/* ── PRNG ── */
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ── Theme ── */
const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

/* ── Data ── */
const SECTORS = ['Energy','Finance','Technology','Industrials','Consumer','Healthcare','Materials','Utilities'];
const COUNTRIES = ['USA','UK','Germany','France','Japan','Canada','Australia','Netherlands'];

const EXECS = Array.from({ length: 65 }, (_, i) => {
  const sector = SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];
  const country = COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];
  const totalComp = parseFloat((2 + sr(i * 13) * 48).toFixed(1));
  const climateKpiWeight = parseFloat((5 + sr(i * 17) * 35).toFixed(1));
  const climateBonusActual = parseFloat((totalComp * climateKpiWeight / 100 * (0.5 + sr(i * 19) * 0.7)).toFixed(2));
  const scope1Reduction = parseFloat((sr(i * 23) * 30).toFixed(1));
  const scope1Target = parseFloat((5 + sr(i * 29) * 25).toFixed(1));
  const climateMetricMet = scope1Reduction >= scope1Target * 0.9;
  const carbonPricingIncentive = sr(i * 31) > 0.45;
  const longTermClimateVesting = sr(i * 37) > 0.4;
  const peerBenchmarkPct = parseFloat((70 + sr(i * 41) * 60).toFixed(0));
  const payRatio = Math.round(50 + sr(i * 43) * 350);
  const climatePayScore = Math.round(
    climateKpiWeight * 1.5 +
    (climateMetricMet ? 20 : 0) +
    (carbonPricingIncentive ? 15 : 0) +
    (longTermClimateVesting ? 15 : 0) +
    sr(i * 47) * 15
  );
  const targetStatus = scope1Reduction >= scope1Target ? 'Met' : scope1Reduction >= scope1Target * 0.7 ? 'Partial' : 'Missed';
  return {
    id: i + 1,
    name: `CEO ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ''}`,
    company: `Corp ${String.fromCharCode(65 + ((i + 3) % 26))}`,
    sector, country, totalComp, climateKpiWeight, climateBonusActual,
    scope1Reduction, scope1Target, climateMetricMet, carbonPricingIncentive,
    longTermClimateVesting, peerBenchmarkPct: +peerBenchmarkPct, payRatio,
    climatePayScore: Math.min(100, climatePayScore), targetStatus,
  };
});

const TABS = [
  'Executive Overview','Climate KPI Weighting','Bonus Attribution','Target vs Actual',
  'Peer Benchmarking','Long-Term Incentives','Pay Ratio','Climate Pay Score',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function ClimateExecutivePayPage() {
  const [tab, setTab] = useState(0);
  const [filterSector, setFilterSector] = useState('All');
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [minKpiWeight, setMinKpiWeight] = useState(0);
  const [minComp, setMinComp] = useState(0);

  const filtered = useMemo(() => EXECS.filter(e =>
    (filterSector === 'All' || e.sector === filterSector) &&
    (filterCountry === 'All' || e.country === filterCountry) &&
    (filterStatus === 'All' || e.targetStatus === filterStatus) &&
    e.climateKpiWeight >= minKpiWeight &&
    e.totalComp >= minComp
  ), [filterSector, filterCountry, filterStatus, minKpiWeight, minComp]);

  const n = Math.max(1, filtered.length);
  const avgKpiWeight = (filtered.reduce((a, e) => a + e.climateKpiWeight, 0) / n).toFixed(1);
  const totalBonusPool = filtered.reduce((a, e) => a + e.climateBonusActual, 0).toFixed(1);
  const pctMet = ((filtered.filter(e => e.targetStatus === 'Met').length / n) * 100).toFixed(0);
  const avgPayScore = (filtered.reduce((a, e) => a + e.climatePayScore, 0) / n).toFixed(1);

  const bySector = SECTORS.map(s => {
    const sc = filtered.filter(e => e.sector === s);
    if (!sc.length) return null;
    return {
      sector: s,
      avgWeight: parseFloat((sc.reduce((a, e) => a + e.climateKpiWeight, 0) / sc.length).toFixed(1)),
      avgScore: parseFloat((sc.reduce((a, e) => a + e.climatePayScore, 0) / sc.length).toFixed(1)),
      pctLtv: parseFloat(((sc.filter(e => e.longTermClimateVesting).length / sc.length) * 100).toFixed(0)),
    };
  }).filter(Boolean);

  const byCountry = COUNTRIES.map(cn => {
    const cc = filtered.filter(e => e.country === cn);
    if (!cc.length) return null;
    return {
      country: cn,
      pctLtv: parseFloat(((cc.filter(e => e.longTermClimateVesting).length / cc.length) * 100).toFixed(0)),
    };
  }).filter(Boolean);

  const scatterData = filtered.map(e => ({ x: e.scope1Target, y: e.scope1Reduction, name: e.name, met: e.climateMetricMet }));
  const sel = { background: T.indigo, color: '#fff', border: `1px solid ${T.indigo}` };
  const unsel = { background: T.card, color: T.textPri, border: `1px solid ${T.border}` };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px' }}>
        <div style={{ color: T.gold, fontSize: 11, fontFamily: T.fontMono, letterSpacing: '0.1em', marginBottom: 4 }}>EP-DK4 · SPRINT DK</div>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>Climate Executive Pay</div>
        <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>65 executives · Climate KPI weighting · Bonus attribution · Target vs actual performance</div>
      </div>

      {/* Filters */}
      <div style={{ background: T.sub, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Sector', SECTORS, filterSector, setFilterSector], ['Country', COUNTRIES, filterCountry, setFilterCountry], ['Status', ['Met','Partial','Missed'], filterStatus, setFilterStatus]].map(([label, opts, val, set]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: T.textSec }}>{label}:</span>
            <select value={val} onChange={e => set(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card }}>
              <option value="All">All</option>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Min KPI Weight: {minKpiWeight}%</span>
          <input type="range" min={0} max={40} value={minKpiWeight} onChange={e => setMinKpiWeight(+e.target.value)} style={{ width: 100 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Min Comp: ${minComp}M</span>
          <input type="range" min={0} max={30} value={minComp} onChange={e => setMinComp(+e.target.value)} style={{ width: 100 }} />
        </div>
        <span style={{ fontSize: 12, color: T.textSec, marginLeft: 'auto' }}>{filtered.length} / {EXECS.length} executives</span>
      </div>

      {/* KPIs */}
      <div style={{ padding: '20px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Avg Climate KPI Weight" value={`${avgKpiWeight}%`} sub="of total compensation" color={T.indigo} />
        <KpiCard label="Total Climate Bonus Pool" value={`$${totalBonusPool}M`} sub="actual climate bonuses" color={T.gold} />
        <KpiCard label="% Targets Met" value={`${pctMet}%`} sub="Scope 1 targets achieved" color={T.green} />
        <KpiCard label="Avg Climate Pay Score" value={avgPayScore} sub="out of 100" color={T.teal} />
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 32px', display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ ...i === tab ? sel : unsel, padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '0 32px 40px' }}>
        {tab === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>Executive Overview — {filtered.length} Leaders</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Name','Company','Sector','Country','Total Comp ($M)','Climate KPI %','Bonus ($M)','S1 Target','S1 Actual','Status','Pay Score'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 25).map((e, i) => (
                    <tr key={e.id} style={{ borderTop: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '9px 12px', fontWeight: 600 }}>{e.name}</td>
                      <td style={{ padding: '9px 12px' }}>{e.company}</td>
                      <td style={{ padding: '9px 12px' }}>{e.sector}</td>
                      <td style={{ padding: '9px 12px' }}>{e.country}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{e.totalComp.toFixed(1)}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: e.climateKpiWeight >= 20 ? T.green : e.climateKpiWeight >= 10 ? T.teal : T.amber }}>{e.climateKpiWeight.toFixed(1)}%</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{e.climateBonusActual.toFixed(2)}</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{e.scope1Target.toFixed(1)}%</td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{e.scope1Reduction.toFixed(1)}%</td>
                      <td style={{ padding: '9px 12px' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: e.targetStatus === 'Met' ? '#dcfce7' : e.targetStatus === 'Partial' ? '#fef9c3' : '#fee2e2', color: e.targetStatus === 'Met' ? T.green : e.targetStatus === 'Partial' ? T.amber : T.red }}>{e.targetStatus}</span></td>
                      <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: e.climatePayScore >= 70 ? T.green : e.climatePayScore >= 50 ? T.teal : T.amber }}>{e.climatePayScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Avg Climate KPI Weight by Sector (%)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={[...bySector].sort((a, b) => b.avgWeight - a.avgWeight)} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={v => [`${v}%`, 'Avg KPI Weight']} />
                <Bar dataKey="avgWeight" radius={[4,4,0,0]} name="Avg KPI Weight %">
                  {[...bySector].sort((a, b) => b.avgWeight - a.avgWeight).map((e, idx) => <Cell key={idx} fill={e.avgWeight >= 20 ? T.green : e.avgWeight >= 12 ? T.teal : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>Top Climate Bonus Recipients</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Rank','Name','Company','Sector','Total Comp ($M)','KPI Weight','Climate Bonus ($M)','Carbon Pricing','LT Vesting'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered].sort((a, b) => b.climateBonusActual - a.climateBonusActual).slice(0, 20).map((e, i) => (
                  <tr key={e.id} style={{ borderTop: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: T.gold }}>#{i + 1}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 600 }}>{e.name}</td>
                    <td style={{ padding: '9px 12px' }}>{e.company}</td>
                    <td style={{ padding: '9px 12px' }}>{e.sector}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{e.totalComp.toFixed(1)}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{e.climateKpiWeight.toFixed(1)}%</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: T.gold }}>${e.climateBonusActual.toFixed(2)}M</td>
                    <td style={{ padding: '9px 12px', color: e.carbonPricingIncentive ? T.green : T.red }}>{e.carbonPricingIncentive ? '✓' : '✗'}</td>
                    <td style={{ padding: '9px 12px', color: e.longTermClimateVesting ? T.green : T.red }}>{e.longTermClimateVesting ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Scope 1 Target vs Actual Reduction (% YoY)</div>
            <ResponsiveContainer width="100%" height={340}>
              <ScatterChart margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="x" name="Target %" label={{ value: 'Target Reduction %', position: 'insideBottom', offset: -5, fontSize: 11 }} tick={{ fontSize: 11 }} />
                <YAxis dataKey="y" name="Actual %" label={{ value: 'Actual Reduction %', angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.[0] ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', borderRadius: 6, fontSize: 12 }}><div style={{ fontWeight: 600 }}>{payload[0].payload.name}</div><div>Target: {payload[0].payload.x.toFixed(1)}%</div><div>Actual: {payload[0].payload.y.toFixed(1)}%</div><div style={{ color: payload[0].payload.met ? T.green : T.red }}>{payload[0].payload.met ? 'Target Met' : 'Target Missed'}</div></div> : null} />
                <Scatter data={scatterData} name="Executives">
                  {scatterData.map((entry, index) => <Cell key={index} fill={entry.met ? T.green : T.red} opacity={0.75} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>Peer Benchmark Percentile — Above/Below Market</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Name','Company','Sector','Total Comp ($M)','Peer Benchmark %','Above Median?','Climate KPI %','Pay Score'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered].sort((a, b) => b.peerBenchmarkPct - a.peerBenchmarkPct).slice(0, 20).map((e, i) => (
                  <tr key={e.id} style={{ borderTop: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600 }}>{e.name}</td>
                    <td style={{ padding: '9px 12px' }}>{e.company}</td>
                    <td style={{ padding: '9px 12px' }}>{e.sector}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{e.totalComp.toFixed(1)}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: e.peerBenchmarkPct >= 100 ? T.orange : T.green }}>{e.peerBenchmarkPct}%</td>
                    <td style={{ padding: '9px 12px' }}><span style={{ color: e.peerBenchmarkPct >= 100 ? T.red : T.green, fontWeight: 600 }}>{e.peerBenchmarkPct >= 100 ? 'Above' : 'Below'}</span></td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{e.climateKpiWeight.toFixed(1)}%</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{e.climatePayScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Long-Term Climate Vesting Prevalence by Country (%)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={byCountry} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={v => [`${v}%`, '% With LT Vesting']} />
                <Bar dataKey="pctLtv" fill={T.indigo} radius={[4,4,0,0]} name="% LT Climate Vesting">
                  {byCountry.map((e, idx) => <Cell key={idx} fill={e.pctLtv >= 60 ? T.green : e.pctLtv >= 40 ? T.teal : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontSize: 14 }}>Pay Ratio vs Median Worker — Highest Ratios</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Rank','Name','Sector','Country','Pay Ratio (×)','Total Comp ($M)','Climate KPI %','Status'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered].sort((a, b) => b.payRatio - a.payRatio).slice(0, 20).map((e, i) => (
                  <tr key={e.id} style={{ borderTop: `1px solid ${T.borderL}`, background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: T.gold }}>#{i + 1}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 600 }}>{e.name}</td>
                    <td style={{ padding: '9px 12px' }}>{e.sector}</td>
                    <td style={{ padding: '9px 12px' }}>{e.country}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono, fontWeight: 700, color: e.payRatio >= 200 ? T.red : e.payRatio >= 100 ? T.amber : T.green }}>{e.payRatio}×</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{e.totalComp.toFixed(1)}</td>
                    <td style={{ padding: '9px 12px', fontFamily: T.fontMono }}>{e.climateKpiWeight.toFixed(1)}%</td>
                    <td style={{ padding: '9px 12px' }}><span style={{ color: e.targetStatus === 'Met' ? T.green : e.targetStatus === 'Partial' ? T.amber : T.red, fontWeight: 600 }}>{e.targetStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Climate Pay Score by Sector (avg)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={[...bySector].sort((a, b) => b.avgScore - a.avgScore)} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip formatter={v => [`${v}`, 'Avg Climate Pay Score']} />
                <Bar dataKey="avgScore" radius={[4,4,0,0]} name="Avg Pay Score">
                  {[...bySector].sort((a, b) => b.avgScore - a.avgScore).map((e, idx) => <Cell key={idx} fill={e.avgScore >= 70 ? T.green : e.avgScore >= 50 ? T.teal : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
