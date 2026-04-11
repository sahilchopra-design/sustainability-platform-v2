import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

const TYPES = ['Specialty','Commodity','Bio-based','Green Ammonia','Green Methanol','Polymer'];
const COUNTRIES = ['Germany','USA','Japan','Netherlands','China','France','UK','Belgium','Switzerland','South Korea','India','Brazil'];
const GREEN_TIERS = ['Laggard','Transition','Advanced'];

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const COMPANIES = Array.from({ length: 60 }, (_, i) => {
  const type = TYPES[Math.floor(sr(i * 7) * TYPES.length)];
  const country = COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];
  const greenChemistryPct = Math.round(5 + sr(i * 5) * 80);
  const tier = greenChemistryPct < 25 ? 'Laggard' : greenChemistryPct < 55 ? 'Transition' : 'Advanced';
  return {
    id: i + 1,
    name: `${['GreenChem','BioChemCo','EcoChem','NatureChem','SustainChem','CircuChem','GreenSynth','EcoFormula','BioChem','GreenPoly'][i % 10]} ${['AG','Corp','NV','SA','Ltd','GmbH','Inc','BV','PLC','SE'][Math.floor(sr(i * 13) * 10)]}`,
    type, country, tier, greenChemistryPct,
    revenue: +(0.5 + sr(i * 3) * 29.5).toFixed(1),
    hazardousChemicals: Math.round(5 + sr(i * 17) * 70),
    renewableFeedstock: Math.round(5 + sr(i * 19) * 75),
    scope1: +(0.05 + sr(i * 23) * 4.95).toFixed(2),
    processInnovationScore: +(1 + sr(i * 29) * 9).toFixed(1),
    reachCompliance: sr(i * 31) > 0.25,
    euGreenDealExposure: +(1 + sr(i * 37) * 9).toFixed(1),
    transitionCapex: Math.round(5 + sr(i * 41) * 495),
    greenChemistryRevenue: Math.round(10 + sr(i * 43) * 490),
    saferChemicalsScore: Math.round(20 + sr(i * 47) * 75),
  };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const TABS = ['Company Overview','Green Chemistry Score','Hazardous Reduction','Bio-based Transition','Renewable Feedstock','Compliance Risk','Transition Capex','Innovation Leaders'];

export default function GreenChemistryFinancePage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(65);
  const [biobasedPremium, setBiobasedPremium] = useState(15);

  const filtered = useMemo(() => COMPANIES.filter(c =>
    (typeFilter === 'All' || c.type === typeFilter) &&
    (countryFilter === 'All' || c.country === countryFilter) &&
    (tierFilter === 'All' || c.tier === tierFilter)
  ), [typeFilter, countryFilter, tierFilter]);

  const n = Math.max(1, filtered.length);
  const avgGreenPct = (filtered.reduce((s, c) => s + c.greenChemistryPct, 0) / n).toFixed(1);
  const totalTransCapex = filtered.reduce((s, c) => s + c.transitionCapex, 0);
  const avgSaferScore = (filtered.reduce((s, c) => s + c.saferChemicalsScore, 0) / n).toFixed(1);
  const pctReach = ((filtered.filter(c => c.reachCompliance).length / n) * 100).toFixed(0);
  const carbonCost = ((filtered.reduce((s, c) => s + c.scope1, 0) * 1e6 * carbonPrice) / 1e9).toFixed(1);
  const bioRevenue = ((filtered.reduce((s, c) => s + c.greenChemistryRevenue, 0) * (1 + biobasedPremium / 100))).toFixed(0);

  const typeGreenData = TYPES.map(t => {
    const cs = filtered.filter(c => c.type === t);
    return { type: t.substring(0, 10), green: cs.length ? Math.round(cs.reduce((s, c) => s + c.greenChemistryPct, 0) / cs.length) : 0 };
  }).filter(d => d.green > 0);

  const hazardousWorst = [...filtered].sort((a, b) => b.hazardousChemicals - a.hazardousChemicals).slice(0, 15);

  const countryBioData = COUNTRIES.map(cn => {
    const cs = filtered.filter(c => c.country === cn);
    return { country: cn.substring(0, 6), bio: cs.length ? Math.round(cs.reduce((s, c) => s + c.renewableFeedstock, 0) / cs.length) : 0 };
  }).filter(d => d.bio > 0).sort((a, b) => b.bio - a.bio).slice(0, 8);

  const scatterData = filtered.map(c => ({ x: c.transitionCapex, y: c.greenChemistryPct, name: c.name }));

  const innovationLeaders = [...filtered].sort((a, b) => b.processInnovationScore - a.processInnovationScore).slice(0, 15);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🧪</span>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Green Chemistry Finance</div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: T.fontMono }}>EP-DL6 · 60 Chemical Companies · Green Transition, REACH & EU Green Deal Analytics</div>
          </div>
        </div>
      </div>

      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Type', typeFilter, setTypeFilter, ['All', ...TYPES]],
          ['Country', countryFilter, setCountryFilter, ['All', ...COUNTRIES]],
          ['Green Tier', tierFilter, setTierFilter, ['All', ...GREEN_TIERS]],
        ].map(([label, val, setter, opts]) => (
          <label key={label} style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}:
            <select value={val} onChange={e => setter(e.target.value)} style={{ fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, padding: '3px 6px', background: T.bg }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Carbon ${carbonPrice}/tCO2:
          <input type="range" min={20} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 80 }} />
        </label>
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Bio-based Premium {biobasedPremium}%:
          <input type="range" min={0} max={50} value={biobasedPremium} onChange={e => setBiobasedPremium(+e.target.value)} style={{ width: 80 }} />
        </label>
        <span style={{ fontSize: 11, color: T.textSec, marginLeft: 'auto' }}>{filtered.length} companies</span>
      </div>

      <div style={{ padding: '20px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Avg Green Chemistry %" value={`${avgGreenPct}%`} sub={`${filtered.filter(c => c.tier === 'Advanced').length} advanced`} color={T.green} />
        <KpiCard label="Total Transition Capex" value={`$${totalTransCapex.toLocaleString()}M`} sub={`Bio-adj revenue: $${bioRevenue}M`} color={T.indigo} />
        <KpiCard label="Avg Safer Chemicals Score" value={`${avgSaferScore}`} sub="0–100 scale" color={T.teal} />
        <KpiCard label="REACH Compliant" value={`${pctReach}%`} sub={`Carbon liability: $${carbonCost}Bn @ $${carbonPrice}`} color={T.gold} />
      </div>

      <div style={{ padding: '0 32px', display: 'flex', gap: 4, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '8px 14px', fontSize: 12, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? T.navy : T.textSec, background: tab === i ? T.card : 'transparent',
            border: 'none', borderBottom: tab === i ? `2px solid ${T.sage}` : '2px solid transparent',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 32px' }}>
        {tab === 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Company','Type','Country','Tier','GreenChem%','Rev($Bn)','Hazard%','Renewable%','Scope1(Mt)','REACH'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 40).map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                    <td style={{ padding: '7px 10px' }}>{c.type}</td>
                    <td style={{ padding: '7px 10px' }}>{c.country}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ background: c.tier === 'Advanced' ? '#dcfce7' : c.tier === 'Transition' ? '#dbeafe' : '#fee2e2', color: c.tier === 'Advanced' ? T.green : c.tier === 'Transition' ? T.blue : T.red, borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 600 }}>{c.tier}</span>
                    </td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: c.greenChemistryPct >= 55 ? T.green : c.greenChemistryPct >= 25 ? T.blue : T.amber }}>{c.greenChemistryPct}%</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{c.revenue}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: c.hazardousChemicals >= 50 ? T.red : T.amber }}>{c.hazardousChemicals}%</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: c.renewableFeedstock >= 50 ? T.green : T.textPri }}>{c.renewableFeedstock}%</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{c.scope1}</td>
                    <td style={{ padding: '7px 10px' }}>{c.reachCompliance ? <span style={{ color: T.green, fontWeight: 700 }}>✓</span> : <span style={{ color: T.red }}>✗</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Green Chemistry % by Type</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={typeGreenData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="type" tick={{ fontSize: 9 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v}%`, 'Avg Green Chem']} />
                  <Bar dataKey="green" fill={T.green} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Green Tier Distribution</div>
              {GREEN_TIERS.map(tier => {
                const cnt = filtered.filter(c => c.tier === tier).length;
                const pct = n > 0 ? (cnt / n) * 100 : 0;
                const clr = tier === 'Advanced' ? T.green : tier === 'Transition' ? T.blue : T.red;
                return (
                  <div key={tier} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: clr }}>{tier}</span>
                      <span style={{ fontFamily: T.fontMono, color: T.textSec }}>{cnt} companies ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ background: T.borderL, borderRadius: 4, height: 10 }}>
                      <div style={{ background: clr, width: `${pct}%`, height: '100%', borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Worst 15 — Hazardous Chemical % of Portfolio</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hazardousWorst.map(c => ({ name: c.name.substring(0, 10), haz: c.hazardousChemicals }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={80} />
                  <Tooltip formatter={v => [`${v}%`, 'Hazardous']} />
                  <Bar dataKey="haz" fill={T.red} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Hazardous Portfolio Summary</div>
              {[['Critical (>60%)', 60, 100, T.red], ['High (40–60%)', 40, 60, T.orange], ['Medium (20–40%)', 20, 40, T.amber], ['Low (<20%)', 0, 20, T.green]].map(([label, lo, hi, clr]) => {
                const cnt = filtered.filter(c => c.hazardousChemicals >= lo && c.hazardousChemicals < hi).length;
                const pct = n > 0 ? (cnt / n) * 100 : 0;
                return (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, color: clr }}>{label}</span>
                      <span style={{ fontFamily: T.fontMono, color: T.textSec }}>{cnt} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ background: T.borderL, borderRadius: 4, height: 8 }}>
                      <div style={{ background: clr, width: `${pct}%`, height: '100%', borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Bio-based Adoption by Country (%)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={countryBioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v}%`, 'Avg Bio-based']} />
                  <Bar dataKey="bio" fill={T.sage} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Bio-based Leaders</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Bio-based premium: +{biobasedPremium}% · Adj. revenue: ${bioRevenue}M</div>
              {[...filtered].sort((a, b) => b.renewableFeedstock - a.renewableFeedstock).slice(0, 15).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{c.type} · {c.country}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.sage }}>{c.renewableFeedstock}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Top Renewable Feedstock Companies</div>
              {[...filtered].sort((a, b) => b.renewableFeedstock - a.renewableFeedstock).slice(0, 15).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{c.type} · {c.country}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.green }}>{c.renewableFeedstock}%</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Feedstock Transition Distribution</div>
              {[['> 60% Renewable', 60, 100, T.green], ['30–60%', 30, 60, T.blue], ['< 30%', 0, 30, T.amber]].map(([label, lo, hi, clr]) => {
                const cnt = filtered.filter(c => c.renewableFeedstock >= lo && c.renewableFeedstock < hi).length;
                const pct = n > 0 ? (cnt / n) * 100 : 0;
                return (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: clr }}>{label}</span>
                      <span style={{ fontFamily: T.fontMono, color: T.textSec }}>{cnt} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ background: T.borderL, borderRadius: 4, height: 10 }}>
                      <div style={{ background: clr, width: `${pct}%`, height: '100%', borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>REACH & EU Green Deal Risk</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>Carbon liability @ ${carbonPrice}/tCO2: ${carbonCost}Bn</div>
              {[['REACH Compliant', true, T.green], ['REACH Non-Compliant', false, T.red]].map(([label, comp, clr]) => {
                const cnt = filtered.filter(c => c.reachCompliance === comp).length;
                return (
                  <div key={label} style={{ padding: '12px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: clr }}>{label}</span>
                      <span style={{ fontFamily: T.fontMono, fontSize: 14, fontWeight: 700, color: clr }}>{cnt} ({(cnt / n * 100).toFixed(0)}%)</span>
                    </div>
                    <div style={{ background: T.borderL, borderRadius: 4, height: 10 }}>
                      <div style={{ background: clr, width: `${(cnt / n) * 100}%`, height: '100%', borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>EU Green Deal Exposure</div>
                {[...filtered].sort((a, b) => b.euGreenDealExposure - a.euGreenDealExposure).slice(0, 8).map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div style={{ fontSize: 11 }}>{c.name}</div>
                    <span style={{ fontFamily: T.fontMono, fontSize: 11, color: c.euGreenDealExposure >= 7 ? T.green : T.amber }}>{c.euGreenDealExposure}/10</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Compliance KPIs</div>
              {[
                { label: 'REACH Compliance Rate', val: `${pctReach}%`, clr: T.green },
                { label: 'Avg EU Green Deal Exposure', val: `${(filtered.reduce((s, c) => s + c.euGreenDealExposure, 0) / n).toFixed(1)}/10`, clr: T.blue },
                { label: 'Carbon Liability (Scope 1)', val: `$${carbonCost}Bn`, clr: T.red },
                { label: 'Total Scope 1 Emissions', val: `${filtered.reduce((s, c) => s + c.scope1, 0).toFixed(1)} MtCO2e`, clr: T.orange },
                { label: 'Avg Process Innovation', val: `${(filtered.reduce((s, c) => s + c.processInnovationScore, 0) / n).toFixed(1)}/10`, clr: T.teal },
                { label: 'Non-REACH Companies', val: `${filtered.filter(c => !c.reachCompliance).length}`, clr: T.red },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <span style={{ fontSize: 12, color: T.textSec }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: T.fontMono, color: item.clr }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 6 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Transition Capex vs Green Chemistry %</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Capex" tick={{ fontSize: 10 }} label={{ value: 'Transition Capex ($M)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis dataKey="y" name="Green Chem %" tick={{ fontSize: 10 }} label={{ value: 'Green Chemistry %', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => [v, n === 'x' ? 'Capex ($M)' : 'Green Chem %']} />
                  <Scatter data={scatterData.slice(0, 50)} fill={T.sage} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Top Transition Capex Companies</div>
              {[...filtered].sort((a, b) => b.transitionCapex - a.transitionCapex).slice(0, 15).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{c.type} · {c.country}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.indigo }}>${c.transitionCapex}M</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Process Innovation Leaders</div>
              {innovationLeaders.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{c.type} · {c.country} · GreenChem: {c.greenChemistryPct}%</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 13, color: c.processInnovationScore >= 7 ? T.green : T.amber, fontWeight: 700 }}>{c.processInnovationScore}/10</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Summary KPIs</div>
              {[
                { label: 'Avg Green Chemistry %', val: `${avgGreenPct}%`, clr: T.green },
                { label: 'Avg Green Chem Revenue', val: `$${(filtered.reduce((s, c) => s + c.greenChemistryRevenue, 0) / n).toFixed(0)}M`, clr: T.gold },
                { label: 'Total Green Chem Revenue', val: `$${filtered.reduce((s, c) => s + c.greenChemistryRevenue, 0).toLocaleString()}M`, clr: T.gold },
                { label: 'Avg Safer Chemicals Score', val: `${avgSaferScore}/100`, clr: T.teal },
                { label: 'Avg Process Innovation', val: `${(filtered.reduce((s, c) => s + c.processInnovationScore, 0) / n).toFixed(1)}/10`, clr: T.indigo },
                { label: 'Advanced Green Tier', val: `${filtered.filter(c => c.tier === 'Advanced').length} companies`, clr: T.green },
                { label: 'Total Transition Capex', val: `$${totalTransCapex.toLocaleString()}M`, clr: T.indigo },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <span style={{ fontSize: 12, color: T.textSec }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: T.fontMono, color: item.clr }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
