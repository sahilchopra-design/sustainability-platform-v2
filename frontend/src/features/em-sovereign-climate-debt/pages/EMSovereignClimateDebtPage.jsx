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

const REGIONS = ['Sub-Saharan Africa', 'South Asia', 'East Asia & Pacific', 'Latin America', 'MENA', 'Eastern Europe & CA', 'Caribbean'];
const RATINGS = ['AAA-AA', 'A-BBB', 'BB-B', 'CCC-C', 'Distressed'];
const NAMES = [
  'Nigeria','Kenya','Ghana','Ethiopia','Tanzania','Zambia','Rwanda','Senegal','Mozambique','Uganda',
  'Bangladesh','Pakistan','Sri Lanka','Nepal','Vietnam','Philippines','Indonesia','Cambodia','Laos','Myanmar',
  'China','India','Thailand','Malaysia','Mongolia','Papua New Guinea','Fiji','Samoa','Vanuatu','Solomon Islands',
  'Brazil','Argentina','Colombia','Peru','Ecuador','Bolivia','Paraguay','Uruguay','Costa Rica','Honduras',
  'Egypt','Morocco','Tunisia','Jordan','Lebanon','Iraq','Libya','Algeria','Oman','Yemen',
  'Ukraine','Georgia','Armenia','Moldova','Uzbekistan','Kazakhstan','Kyrgyzstan','Tajikistan','Azerbaijan','Belarus',
];

const SOVEREIGNS = Array.from({ length: 60 }, (_, i) => {
  const region = REGIONS[i % REGIONS.length];
  const ratingIdx = Math.floor(sr(i * 7) * RATINGS.length);
  const gdpBn = +(20 + sr(i * 11) * 980).toFixed(1);
  const debtGdpPct = +(35 + sr(i * 13) * 95).toFixed(1);
  const climateVulnerabilityIndex = Math.round(20 + sr(i * 17) * 75);
  return {
    id: i,
    name: NAMES[i] || `EM Country ${i + 1}`,
    region,
    gdpBn,
    debtGdpPct,
    greenBondIssuance: +(0.1 + sr(i * 19) * 8.9).toFixed(2),
    climateVulnerabilityIndex,
    adaptationFinanceGap: +(0.5 + sr(i * 23) * 19.5).toFixed(2),
    debtRestructuringRisk: +(1 + sr(i * 29) * 9).toFixed(1),
    ndcAmbition: +(2 + sr(i * 31) * 8).toFixed(1),
    climateOdaReceived: +(0.05 + sr(i * 37) * 2.95).toFixed(2),
    sovereignCreditRating: RATINGS[ratingIdx],
    defaultProbability: +(1 + sr(i * 41) * 29).toFixed(1),
    debtForNatureSwapEligible: sr(i * 43) > 0.45,
  };
});

const TABS = [
  'Country Overview', 'Debt Sustainability', 'Green Bond Market', 'Climate Vulnerability',
  'Adaptation Finance Gap', 'Debt-for-Nature Swaps', 'NDC Ambition', 'MDB Engagement',
];

const RATING_BUCKET_MAP = {
  'IG': ['AAA-AA', 'A-BBB'],
  'HY': ['BB-B'],
  'Distressed': ['CCC-C', 'Distressed'],
};

const kpi = (label, value, sub, color) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', minWidth: 160, flex: 1 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function EMSovereignClimateDebtPage() {
  const [tab, setTab] = useState(0);
  const [regionFilter, setRegionFilter] = useState('All');
  const [ratingBucket, setRatingBucket] = useState('All');
  const [dnFilter, setDnFilter] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(25);
  const [debtRelief, setDebtRelief] = useState(10);

  const filtered = useMemo(() => {
    return SOVEREIGNS.filter(s => {
      if (regionFilter !== 'All' && s.region !== regionFilter) return false;
      if (ratingBucket !== 'All') {
        const allowed = RATING_BUCKET_MAP[ratingBucket] || [];
        if (!allowed.includes(s.sovereignCreditRating)) return false;
      }
      if (dnFilter === 'Eligible' && !s.debtForNatureSwapEligible) return false;
      if (dnFilter === 'Not Eligible' && s.debtForNatureSwapEligible) return false;
      return true;
    });
  }, [regionFilter, ratingBucket, dnFilter]);

  const totalGreenBond = filtered.reduce((a, s) => a + s.greenBondIssuance, 0);
  const avgVuln = filtered.length ? filtered.reduce((a, s) => a + s.climateVulnerabilityIndex, 0) / filtered.length : 0;
  const totalAdaptGap = filtered.reduce((a, s) => a + s.adaptationFinanceGap, 0);
  const dnEligiblePct = filtered.length ? (filtered.filter(s => s.debtForNatureSwapEligible).length / filtered.length * 100).toFixed(1) : '0.0';

  // Chart data
  const greenBondByRegion = REGIONS.map(r => ({
    region: r.split(' ')[0],
    issuance: +filtered.filter(s => s.region === r).reduce((a, s) => a + s.greenBondIssuance, 0).toFixed(2),
  })).filter(d => d.issuance > 0);

  const scatterData = filtered.map(s => ({ x: s.debtGdpPct, y: s.climateVulnerabilityIndex, name: s.name }));

  const top15AdaptGap = [...filtered].sort((a, b) => b.adaptationFinanceGap - a.adaptationFinanceGap).slice(0, 15).map(s => ({
    name: s.name.slice(0, 10),
    gap: s.adaptationFinanceGap,
  }));

  const defaultByRegion = REGIONS.map(r => ({
    region: r.split(' ')[0],
    avgDefault: +( filtered.filter(s => s.region === r).reduce((a, s) => a + s.defaultProbability, 0) /
      Math.max(1, filtered.filter(s => s.region === r).length) ).toFixed(1),
  })).filter(d => d.avgDefault > 0);

  const selStyle = active => ({
    padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    background: active ? T.navy : T.sub, color: active ? '#fff' : T.textSec,
    border: `1px solid ${active ? T.navy : T.border}`, fontFamily: T.fontMono,
  });

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'DM Sans',sans-serif", color: T.textPri }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '24px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, marginBottom: 4 }}>EP-DH1 · EMERGING MARKETS & DEVELOPMENT FINANCE</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>EM Sovereign Climate Debt Analytics</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
          60 Sovereigns · Green Bond Markets · Debt-for-Nature Swaps · Adaptation Finance · NDC Ambition
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: T.sub }}>
          <option value="All">All Regions</option>
          {REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={ratingBucket} onChange={e => setRatingBucket(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: T.sub }}>
          <option value="All">All Ratings</option>
          <option value="IG">Investment Grade</option>
          <option value="HY">High Yield</option>
          <option value="Distressed">Distressed</option>
        </select>
        <select value={dnFilter} onChange={e => setDnFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: T.sub }}>
          <option value="All">All D4N Status</option>
          <option value="Eligible">D4N Eligible</option>
          <option value="Not Eligible">Not Eligible</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 24, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: T.textSec }}>
            Carbon Price: <strong style={{ color: T.navy }}>${carbonPrice}/tCO₂</strong>
            <input type="range" min={5} max={150} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ marginLeft: 8, width: 80 }} />
          </label>
          <label style={{ fontSize: 12, color: T.textSec }}>
            Debt Relief: <strong style={{ color: T.navy }}>${debtRelief}Bn</strong>
            <input type="range" min={1} max={100} value={debtRelief} onChange={e => setDebtRelief(+e.target.value)} style={{ marginLeft: 8, width: 80 }} />
          </label>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ padding: '20px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {kpi('Total Green Bond Issuance', `$${totalGreenBond.toFixed(1)}Bn`, `${filtered.length} sovereigns`, T.green)}
        {kpi('Avg Climate Vulnerability', avgVuln.toFixed(1), 'Index 0–100', avgVuln > 65 ? T.red : avgVuln > 45 ? T.amber : T.green)}
        {kpi('Total Adaptation Gap', `$${totalAdaptGap.toFixed(1)}Bn`, 'Annual financing need', T.red)}
        {kpi('D4N Swap Eligible', `${dnEligiblePct}%`, 'Share of filtered countries', T.indigo)}
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 32px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={selStyle(tab === i)}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '0 32px 40px' }}>
        {/* Tab 0 — Country Overview */}
        {tab === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Country','Region','GDP ($Bn)','Debt/GDP (%)','Green Bond ($Bn)','Vuln. Index','Default Prob (%)','Rating','D4N'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 20).map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{s.region.split(' ')[0]}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{s.gdpBn.toFixed(0)}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: s.debtGdpPct > 90 ? T.red : T.textPri }}>{s.debtGdpPct.toFixed(1)}%</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.green }}>{s.greenBondIssuance.toFixed(2)}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: s.climateVulnerabilityIndex > 65 ? T.red : s.climateVulnerabilityIndex > 45 ? T.amber : T.green }}>{s.climateVulnerabilityIndex}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: s.defaultProbability > 15 ? T.red : T.textPri }}>{s.defaultProbability.toFixed(1)}%</td>
                      <td style={{ padding: '8px 12px' }}><span style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 6px', fontSize: 11 }}>{s.sovereignCreditRating}</span></td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>{s.debtForNatureSwapEligible ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > 20 && <div style={{ padding: '10px 16px', fontSize: 12, color: T.textSec, background: T.sub }}>Showing 20 of {filtered.length} sovereigns</div>}
          </div>
        )}

        {/* Tab 1 — Debt Sustainability */}
        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Climate Vulnerability vs Debt/GDP</div>
              <ResponsiveContainer width="100%" height={320}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Debt/GDP %" label={{ value: 'Debt/GDP (%)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="y" name="Climate Vuln." label={{ value: 'Vuln. Index', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.[0] ? (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', fontSize: 12, borderRadius: 6 }}>
                      <div style={{ fontWeight: 700 }}>{payload[0].payload.name}</div>
                      <div>Debt/GDP: {payload[0].payload.x}%</div>
                      <div>Vuln: {payload[0].payload.y}</div>
                    </div>
                  ) : null} />
                  <Scatter data={scatterData} fill={T.indigo} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Default Probability by Region</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={defaultByRegion}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={v => `${v}%`} />
                  <Bar dataKey="avgDefault" fill={T.red} name="Avg Default Prob" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 2 — Green Bond Market */}
        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Sovereign Green Bond Issuance by Region ($Bn)</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={greenBondByRegion}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="Bn" />
                <Tooltip formatter={v => `$${v}Bn`} />
                <Bar dataKey="issuance" fill={T.green} name="Green Bond Issuance" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {filtered.slice(0, 8).map(s => (
                <div key={s.id} style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', minWidth: 140 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.green, fontFamily: T.fontMono }}>${s.greenBondIssuance}Bn</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{s.sovereignCreditRating} · {s.region.split(' ')[0]}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3 — Climate Vulnerability */}
        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Climate Vulnerability Index — Top 20 Countries</div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={[...filtered].sort((a, b) => b.climateVulnerabilityIndex - a.climateVulnerabilityIndex).slice(0, 20).map(s => ({ name: s.name.slice(0, 10), vuln: s.climateVulnerabilityIndex, region: s.region.split(' ')[0] }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="vuln" fill={T.red} name="Vulnerability Index" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tab 4 — Adaptation Finance Gap */}
        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: T.navy }}>Adaptation Finance Gap — Top 15 Countries ($Bn/yr)</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>
              Carbon price sensitivity: At ${carbonPrice}/tCO₂, estimated gap reduction: ${(carbonPrice * 0.02 * totalAdaptGap).toFixed(1)}Bn
            </div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={top15AdaptGap}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="Bn" />
                <Tooltip formatter={v => `$${v}Bn`} />
                <Bar dataKey="gap" fill={T.amber} name="Adaptation Gap" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tab 5 — Debt-for-Nature Swaps */}
        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>D4N Eligible Sovereigns</div>
              {filtered.filter(s => s.debtForNatureSwapEligible).slice(0, 10).map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: T.textSec, marginLeft: 8 }}>{s.region.split(' ')[0]}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: T.fontMono, fontSize: 12, color: T.green }}>Vuln: {s.climateVulnerabilityIndex}</div>
                    <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec }}>Debt/GDP: {s.debtGdpPct}%</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Debt Relief Scenario</div>
              <div style={{ background: T.sub, borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: T.textSec }}>Debt Relief Amount</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>${debtRelief}Bn</div>
              </div>
              <div style={{ background: T.sub, borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: T.textSec }}>Estimated Nature Finance Unlocked</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: T.green, fontFamily: T.fontMono }}>${(debtRelief * 0.35).toFixed(1)}Bn</div>
              </div>
              <div style={{ background: T.sub, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 13, color: T.textSec }}>Eligible Countries (filtered)</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: T.indigo, fontFamily: T.fontMono }}>
                  {filtered.filter(s => s.debtForNatureSwapEligible).length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6 — NDC Ambition */}
        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>NDC Ambition Scores (0–10 scale)</div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={[...filtered].sort((a, b) => b.ndcAmbition - a.ndcAmbition).slice(0, 20).map(s => ({ name: s.name.slice(0, 10), ndc: s.ndcAmbition, oda: s.climateOdaReceived }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} domain={[0, 10]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="ndc" fill={T.teal} name="NDC Ambition" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="oda" fill={T.gold} name="Climate ODA ($Bn)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tab 7 — MDB Engagement */}
        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Climate ODA Received ($Bn)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={REGIONS.map(r => ({ region: r.split(' ')[0], oda: +filtered.filter(s => s.region === r).reduce((a, s) => a + s.climateOdaReceived, 0).toFixed(2) })).filter(d => d.oda > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="Bn" />
                  <Tooltip formatter={v => `$${v}Bn`} />
                  <Bar dataKey="oda" fill={T.blue} name="Climate ODA" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Debt Restructuring Risk vs NDC Ambition</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Debt Restructuring Risk" label={{ value: 'Restructuring Risk', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis dataKey="y" name="NDC Ambition" label={{ value: 'NDC Ambition', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.[0] ? (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '6px 10px', borderRadius: 6, fontSize: 11 }}>
                      <div style={{ fontWeight: 700 }}>{payload[0].payload.name}</div>
                      <div>Restructuring Risk: {payload[0].payload.x}</div>
                      <div>NDC Ambition: {payload[0].payload.y}</div>
                    </div>
                  ) : null} />
                  <Scatter data={filtered.map(s => ({ x: s.debtRestructuringRisk, y: s.ndcAmbition, name: s.name }))} fill={T.sage} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
