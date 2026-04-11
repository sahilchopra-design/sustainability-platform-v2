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

const SECTORS = ['Energy', 'Mining', 'Automotive', 'Steel', 'Chemicals', 'Aviation', 'Shipping', 'Agriculture', 'Real Estate', 'Finance'];
const COUNTRIES = ['USA', 'Germany', 'China', 'UK', 'France', 'Japan', 'Australia', 'Canada', 'India', 'Brazil', 'Netherlands', 'Norway'];

const CORP_NAMES = [
  'Shell', 'BP', 'TotalEnergies', 'ExxonMobil', 'Chevron', 'Rio Tinto', 'BHP', 'Glencore', 'ArcelorMittal', 'Thyssenkrupp',
  'Volkswagen', 'Ford', 'General Motors', 'Toyota', 'Stellantis', 'BASF', 'Dow Chemical', 'LyondellBasell', 'Airbus', 'Boeing',
  'Maersk', 'MSC', 'Evergreen', 'COSCO', 'Hapag-Lloyd', 'Cargill', 'ADM', 'Bunge', 'CF Industries', 'Mosaic',
  'Lafarge', 'HeidelbergMat', 'Saint-Gobain', 'Holcim', 'Cemex', 'Unilever', 'Nestlé', 'Danone', 'JBS', 'Tyson Foods',
  'Repsol', 'Eni', 'Equinor', 'Woodside', 'Santos', 'Vale', 'Freeport', 'Barrick', 'Newmont', 'Anglo American',
  'Nippon Steel', 'POSCO', 'Tata Steel', 'Baowu Steel', 'Nucor',
];

const JT_CORPORATES = Array.from({ length: 55 }, (_, i) => {
  const sector = SECTORS[i % SECTORS.length];
  const country = COUNTRIES[i % COUNTRIES.length];
  const revenue = +(10 + sr(i * 7) * 190).toFixed(1);
  const justTransitionScore = Math.round(20 + sr(i * 11) * 75);
  const workforceReduction = +(1 + sr(i * 13) * 29).toFixed(1);
  const newGreenJobs = +(workforceReduction * (0.2 + sr(i * 17) * 1.5)).toFixed(1);
  return {
    id: i,
    name: CORP_NAMES[i] || `Corp ${i + 1}`,
    sector,
    country,
    revenue,
    transitionCapex: +(revenue * (0.05 + sr(i * 19) * 0.25)).toFixed(2),
    workerRetrainingBudget: +(10 + sr(i * 23) * 490).toFixed(0),
    communityInvestment: +(5 + sr(i * 29) * 295).toFixed(0),
    supplierTransitionSupport: +(5 + sr(i * 31) * 195).toFixed(0),
    justTransitionScore,
    workforceReduction,
    newGreenJobs,
    humanRightsScore: +(3 + sr(i * 37) * 7).toFixed(1),
    indigenousConsultation: sr(i * 41) > 0.5,
    genderEquityScore: +(3 + sr(i * 43) * 7).toFixed(1),
  };
});

const TABS = [
  'Company Overview', 'Transition Capex', 'Worker Retraining', 'Community Investment',
  'Supplier Support', 'Just Transition Score', 'Human Rights', 'Gender Equity',
];

const getJTLabel = score => score >= 75 ? 'Leader' : score >= 55 ? 'High' : score >= 35 ? 'Medium' : 'Low';
const JT_COLORS = { Low: T.red, Medium: T.amber, High: T.teal, Leader: T.green };

export default function CorporateJustTransitionPage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [jtFilter, setJtFilter] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(80);
  const [retrainingMultiplier, setRetrainingMultiplier] = useState(1.0);

  const filtered = useMemo(() => {
    return JT_CORPORATES.filter(c => {
      if (sectorFilter !== 'All' && c.sector !== sectorFilter) return false;
      if (countryFilter !== 'All' && c.country !== countryFilter) return false;
      if (jtFilter !== 'All' && getJTLabel(c.justTransitionScore) !== jtFilter) return false;
      return true;
    });
  }, [sectorFilter, countryFilter, jtFilter]);

  const carbonBoost = carbonPrice / 80;
  const totalCapex = filtered.reduce((s, c) => s + c.transitionCapex * carbonBoost, 0);
  const avgJTScore = filtered.length ? filtered.reduce((s, c) => s + c.justTransitionScore, 0) / filtered.length : 0;
  const totalRetraining = filtered.reduce((s, c) => s + c.workerRetrainingBudget * retrainingMultiplier, 0);
  const netJobsImpact = filtered.reduce((s, c) => s + c.newGreenJobs - c.workforceReduction, 0);

  const scatterData = filtered.map(c => ({ x: c.transitionCapex * carbonBoost, y: c.justTransitionScore, name: c.name }));

  const retrainingBySector = SECTORS.map(sec => {
    const sub = filtered.filter(c => c.sector === sec);
    return { sector: sec, budget: +(sub.reduce((s, c) => s + c.workerRetrainingBudget * retrainingMultiplier, 0)).toFixed(0) };
  }).filter(d => d.budget > 0);

  const communityByCountry = COUNTRIES.map(country => {
    const sub = filtered.filter(c => c.country === country);
    return { country, investment: +(sub.reduce((s, c) => s + c.communityInvestment, 0)).toFixed(0) };
  }).filter(d => d.investment > 0).sort((a, b) => b.investment - a.investment).slice(0, 10);

  const netJobsData = filtered.slice(0, 15).map(c => ({
    name: c.name.slice(0, 10),
    reduction: -c.workforceReduction,
    newJobs: c.newGreenJobs,
    net: +(c.newGreenJobs - c.workforceReduction).toFixed(1),
  }));

  const kpis = [
    { label: 'Total Transition Capex', value: `$${totalCapex.toFixed(1)}Bn`, color: T.navy },
    { label: 'Avg JT Score', value: avgJTScore.toFixed(1), color: T.green },
    { label: 'Total Retraining Budget', value: `$${(totalRetraining / 1000).toFixed(1)}Bn`, color: T.teal },
    { label: 'Net Jobs Impact', value: `${netJobsImpact >= 0 ? '+' : ''}${netJobsImpact.toFixed(0)}k`, color: netJobsImpact >= 0 ? T.green : T.red },
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.gold, letterSpacing: 1 }}>EP-DI3</span>
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec }}>CLIMATE WORKFORCE & JUST TRANSITION</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.navy, margin: 0 }}>Corporate Just Transition Analytics</h1>
          <p style={{ color: T.textSec, fontSize: 13, margin: '4px 0 0' }}>
            55 corporations · Transition capex · Worker retraining · Community investment · JT scoring · Human rights
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {kpis.map(k => (
            <div key={k.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 6 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {[
            { label: 'Sector', val: sectorFilter, set: setSectorFilter, opts: ['All', ...SECTORS] },
            { label: 'Country', val: countryFilter, set: setCountryFilter, opts: ['All', ...COUNTRIES] },
            { label: 'JT Score', val: jtFilter, set: setJtFilter, opts: ['All', 'Low', 'Medium', 'High', 'Leader'] },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: T.fontMono }}>{f.label}</div>
              <select value={f.val} onChange={e => f.set(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.sub, fontSize: 13, color: T.textPri }}>
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: T.fontMono }}>Carbon Price: ${carbonPrice}/tCO2</div>
            <input type="range" min={20} max={200} value={carbonPrice} onChange={e => setCarbonPrice(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, fontFamily: T.fontMono }}>Retraining Multiplier: {retrainingMultiplier.toFixed(1)}x</div>
            <input type="range" min={0.5} max={3.0} step={0.1} value={retrainingMultiplier} onChange={e => setRetrainingMultiplier(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textSec }}>{filtered.length} companies</div>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === i ? 600 : 400, background: tab === i ? T.navy : T.card, color: tab === i ? '#fff' : T.textSec }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>JT Score Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={['Low', 'Medium', 'High', 'Leader'].map(l => ({ label: l, count: filtered.filter(c => getJTLabel(c.justTransitionScore) === l).length }))} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" fill={T.navy} radius={[3, 3, 0, 0]} name="Companies" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Transition Capex vs JT Score</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Transition Capex ($Bn)" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Capex ($Bn)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="y" name="JT Score" tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'JT Score', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.length ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', fontSize: 12 }}><b>{payload[0]?.payload?.name}</b><br />Capex: ${payload[0]?.payload?.x?.toFixed(2)}Bn<br />JT Score: {payload[0]?.payload?.y}</div> : null} />
                  <Scatter data={scatterData} fill={T.teal} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Transition Capex by Company (Top 20, $Bn)</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={[...filtered].sort((a, b) => b.transitionCapex - a.transitionCapex).slice(0, 20).map(c => ({ name: c.name.slice(0, 12), capex: +(c.transitionCapex * carbonBoost).toFixed(2) }))} margin={{ bottom: 60, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="capex" fill={T.indigo} radius={[3, 3, 0, 0]} name="Transition Capex ($Bn)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Worker Retraining Budget by Sector ($M)</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={retrainingBySector} margin={{ bottom: 40, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 11, fill: T.textSec }} angle={-20} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="budget" fill={T.teal} radius={[3, 3, 0, 0]} name="Retraining Budget ($M)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Community Investment by Country ($M)</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={communityByCountry} margin={{ bottom: 40, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="country" tick={{ fontSize: 11, fill: T.textSec }} angle={-20} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="investment" fill={T.sage} radius={[3, 3, 0, 0]} name="Community Investment ($M)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Supplier Transition Support by Sector ($M)</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={SECTORS.map(sec => { const sub = filtered.filter(c => c.sector === sec); return { sector: sec, support: +(sub.reduce((s, c) => s + c.supplierTransitionSupport, 0)).toFixed(0) }; }).filter(d => d.support > 0)} margin={{ bottom: 40, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 11, fill: T.textSec }} angle={-20} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="support" fill={T.purple} radius={[3, 3, 0, 0]} name="Supplier Support ($M)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Top 20 Companies — JT Score Ranking</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={[...filtered].sort((a, b) => b.justTransitionScore - a.justTransitionScore).slice(0, 20).map(c => ({ name: c.name.slice(0, 12), score: c.justTransitionScore }))} margin={{ bottom: 60, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="score" fill={T.green} radius={[3, 3, 0, 0]} name="JT Score (0-100)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Human Rights Score by Sector</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={SECTORS.map(sec => { const sub = filtered.filter(c => c.sector === sec); return { sector: sec, hr: sub.length ? +(sub.reduce((s, c) => s + c.humanRightsScore, 0) / sub.length).toFixed(1) : 0 }; }).filter(d => d.hr > 0)} margin={{ bottom: 40, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 11, fill: T.textSec }} angle={-20} textAnchor="end" interval={0} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="hr" fill={T.blue} radius={[3, 3, 0, 0]} name="Human Rights Score (0-10)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 16 }}>Net Jobs Impact — Top 15 Companies (k workers)</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={netJobsData} margin={{ bottom: 60, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="reduction" fill={T.red} radius={[3, 3, 0, 0]} name="Workforce Reduction (k)" />
                <Bar dataKey="newJobs" fill={T.green} radius={[3, 3, 0, 0]} name="New Green Jobs (k)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20, overflowX: 'auto' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Corporate Detail Table</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.sub }}>
                {['Company', 'Sector', 'Country', 'Revenue ($Bn)', 'Capex ($Bn)', 'Retraining ($M)', 'Community ($M)', 'JT Score', 'Net Jobs (k)', 'HR Score'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 25).map(c => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                  <td style={{ padding: '7px 10px', color: T.textPri, fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{c.sector}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{c.country}</td>
                  <td style={{ padding: '7px 10px', color: T.textPri }}>{c.revenue}</td>
                  <td style={{ padding: '7px 10px', color: T.indigo, fontWeight: 600 }}>{(c.transitionCapex * carbonBoost).toFixed(2)}</td>
                  <td style={{ padding: '7px 10px', color: T.teal }}>{(c.workerRetrainingBudget * retrainingMultiplier).toFixed(0)}</td>
                  <td style={{ padding: '7px 10px', color: T.sage }}>{c.communityInvestment}</td>
                  <td style={{ padding: '7px 10px' }}><span style={{ color: JT_COLORS[getJTLabel(c.justTransitionScore)], fontWeight: 700 }}>{c.justTransitionScore}</span></td>
                  <td style={{ padding: '7px 10px', color: c.newGreenJobs - c.workforceReduction >= 0 ? T.green : T.red, fontWeight: 600 }}>{(c.newGreenJobs - c.workforceReduction).toFixed(1)}</td>
                  <td style={{ padding: '7px 10px', color: c.humanRightsScore >= 7 ? T.green : c.humanRightsScore >= 4 ? T.amber : T.red }}>{c.humanRightsScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
