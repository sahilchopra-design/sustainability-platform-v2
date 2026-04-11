import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Legend } from 'recharts';

const SECTORS = ['Packaging','Electronics','Textiles','Automotive','Construction','Food & Beverage','Chemicals','Retail'];
const COUNTRIES = ['Germany','Netherlands','France','UK','Sweden','Denmark','Japan','South Korea','USA','Australia'];

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const CIRCULARITY_TIERS = ['Emerging','Developing','Advanced','Leader'];

const COMPANIES = Array.from({ length: 65 }, (_, i) => {
  const sector = SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];
  const country = COUNTRIES[Math.floor(sr(i * 13) * COUNTRIES.length)];
  const circularityScore = Math.round(20 + sr(i * 3) * 75);
  const tier = circularityScore < 35 ? 'Emerging' : circularityScore < 55 ? 'Developing' : circularityScore < 75 ? 'Advanced' : 'Leader';
  return {
    id: i + 1,
    name: `${['CircuTech','EcoLoop','GreenCycle','ReSource','NaturFlow','BioCir','LoopCo','ReCraft','EcoVen','PureCir'][i % 10]} ${['AG','NV','SA','Ltd','GmbH','Corp','BV','PLC','Inc','SE'][Math.floor(sr(i * 11) * 10)]}`,
    sector, country, circularityScore, tier,
    materialEfficiency: Math.round(40 + sr(i * 5) * 55),
    wasteRecoveryRate: Math.round(30 + sr(i * 9) * 65),
    productLifeExtension: +(1 + sr(i * 17) * 8).toFixed(1),
    revenueFromCircular: Math.round(10 + sr(i * 23) * 490),
    circularCapex: Math.round(5 + sr(i * 29) * 295),
    carbonSaving: Math.round(500 + sr(i * 31) * 49500),
    waterSaving: +(0.1 + sr(i * 37) * 4.9).toFixed(2),
    rawMaterialReduction: Math.round(10 + sr(i * 41) * 60),
    circularBondIssued: sr(i * 43) > 0.6,
    ecoDesignScore: +(2 + sr(i * 47) * 8).toFixed(1),
  };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const TABS = ['Company Overview','Circularity Scoring','Material Efficiency','Waste Recovery','Revenue Impact','Carbon Savings','Water & Resources','Circular Finance'];

export default function CircularEconomyFinancePage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(65);
  const [materialCostMultiplier, setMaterialCostMultiplier] = useState(1.2);

  const filtered = useMemo(() => COMPANIES.filter(c =>
    (sectorFilter === 'All' || c.sector === sectorFilter) &&
    (countryFilter === 'All' || c.country === countryFilter) &&
    (tierFilter === 'All' || c.tier === tierFilter)
  ), [sectorFilter, countryFilter, tierFilter]);

  const n = Math.max(1, filtered.length);
  const avgCircularity = (filtered.reduce((s, c) => s + c.circularityScore, 0) / n).toFixed(1);
  const totalCarbonSaving = filtered.reduce((s, c) => s + c.carbonSaving, 0);
  const totalCapex = filtered.reduce((s, c) => s + c.circularCapex, 0);
  const pctBonds = filtered.length ? ((filtered.filter(c => c.circularBondIssued).length / n) * 100).toFixed(0) : '0';

  const carbonValueM = ((totalCarbonSaving * carbonPrice) / 1e6).toFixed(1);

  const sectorBarData = SECTORS.map(sec => {
    const scos = filtered.filter(c => c.sector === sec).map(c => c.circularityScore);
    return { sector: sec.substring(0, 8), avg: scos.length ? Math.round(scos.reduce((a, b) => a + b, 0) / scos.length) : 0 };
  }).filter(d => d.avg > 0);

  const wasteBarData = SECTORS.map(sec => {
    const wrs = filtered.filter(c => c.sector === sec).map(c => c.wasteRecoveryRate);
    return { sector: sec.substring(0, 8), avg: wrs.length ? Math.round(wrs.reduce((a, b) => a + b, 0) / wrs.length) : 0 };
  }).filter(d => d.avg > 0);

  const countryRevData = COUNTRIES.map(cn => {
    const revs = filtered.filter(c => c.country === cn).map(c => c.revenueFromCircular);
    return { country: cn.substring(0, 6), total: revs.reduce((a, b) => a + b, 0) };
  }).filter(d => d.total > 0).sort((a, b) => b.total - a.total).slice(0, 8);

  const scatterData = filtered.map(c => ({ x: c.circularCapex, y: c.carbonSaving / 1000, name: c.name }));

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', color: T.textPri }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>♻️</span>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Circular Economy Finance</div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: T.fontMono }}>EP-DL1 · 65 Companies · 8 Sectors · Circularity Intelligence</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Sector', sectorFilter, setSectorFilter, ['All', ...SECTORS]],
          ['Country', countryFilter, setCountryFilter, ['All', ...COUNTRIES]],
          ['Tier', tierFilter, setTierFilter, ['All', ...CIRCULARITY_TIERS]]
        ].map(([label, val, setter, opts]) => (
          <label key={label} style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}:
            <select value={val} onChange={e => setter(e.target.value)} style={{ fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, padding: '3px 6px', background: T.bg }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Carbon Price ${carbonPrice}/tCO2:
          <input type="range" min={20} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 90 }} />
        </label>
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Material Cost ×{materialCostMultiplier.toFixed(1)}:
          <input type="range" min={1} max={3} step={0.1} value={materialCostMultiplier} onChange={e => setMaterialCostMultiplier(+e.target.value)} style={{ width: 90 }} />
        </label>
        <span style={{ fontSize: 11, color: T.textSec, marginLeft: 'auto' }}>{filtered.length} companies shown</span>
      </div>

      {/* KPIs */}
      <div style={{ padding: '20px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Avg Circularity Score" value={avgCircularity} sub="0–100 scale" color={T.teal} />
        <KpiCard label="Total Carbon Savings" value={`${(totalCarbonSaving / 1000).toFixed(0)}k`} sub={`tCO2e/yr · $${carbonValueM}M value @ $${carbonPrice}/t`} color={T.green} />
        <KpiCard label="Total Circular Capex" value={`$${totalCapex.toLocaleString()}M`} sub={`×${materialCostMultiplier.toFixed(1)} material cost adj.`} color={T.indigo} />
        <KpiCard label="% With Circular Bonds" value={`${pctBonds}%`} sub={`${filtered.filter(c => c.circularBondIssued).length} companies`} color={T.gold} />
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 32px', display: 'flex', gap: 4, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '8px 14px', fontSize: 12, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? T.navy : T.textSec, background: tab === i ? T.card : 'transparent',
            border: 'none', borderBottom: tab === i ? `2px solid ${T.teal}` : '2px solid transparent',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{t}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '24px 32px' }}>

        {tab === 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Company','Sector','Country','Tier','Circularity','Mat.Eff%','Waste Rec%','Life Ext(yr)','Eco Design','Bond'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 40).map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                    <td style={{ padding: '7px 10px' }}>{c.sector}</td>
                    <td style={{ padding: '7px 10px' }}>{c.country}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ background: c.tier === 'Leader' ? '#dcfce7' : c.tier === 'Advanced' ? '#dbeafe' : c.tier === 'Developing' ? '#fef9c3' : '#fee2e2', color: c.tier === 'Leader' ? T.green : c.tier === 'Advanced' ? T.blue : c.tier === 'Developing' ? T.amber : T.red, borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 600 }}>{c.tier}</span>
                    </td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: c.circularityScore >= 75 ? T.green : c.circularityScore >= 55 ? T.blue : T.amber }}>{c.circularityScore}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{c.materialEfficiency}%</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{c.wasteRecoveryRate}%</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{c.productLifeExtension}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{c.ecoDesignScore}/10</td>
                    <td style={{ padding: '7px 10px' }}>{c.circularBondIssued ? <span style={{ color: T.green, fontWeight: 700 }}>✓</span> : <span style={{ color: T.textSec }}>–</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Avg Circularity Score by Sector</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sectorBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [v, 'Avg Score']} />
                  <Bar dataKey="avg" fill={T.teal} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Tier Distribution</div>
              {CIRCULARITY_TIERS.map(tier => {
                const cnt = filtered.filter(c => c.tier === tier).length;
                const pct = n > 0 ? (cnt / n) * 100 : 0;
                const clr = tier === 'Leader' ? T.green : tier === 'Advanced' ? T.blue : tier === 'Developing' ? T.amber : T.red;
                return (
                  <div key={tier} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: T.textPri }}>{tier}</span>
                      <span style={{ color: T.textSec, fontFamily: T.fontMono }}>{cnt} companies ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ background: T.borderL, borderRadius: 4, height: 10 }}>
                      <div style={{ background: clr, width: `${pct}%`, height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
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
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Material Efficiency Distribution</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={sectorBarData.map(d => {
                  const scos = filtered.filter(c => c.sector.startsWith(d.sector.substring(0, 6))).map(c => c.materialEfficiency);
                  return { ...d, mat: scos.length ? Math.round(scos.reduce((a, b) => a + b, 0) / scos.length) : 0 };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v}%`, 'Mat. Efficiency']} />
                  <Bar dataKey="mat" fill={T.indigo} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Top 15 — Material Efficiency</div>
              {[...filtered].sort((a, b) => b.materialEfficiency - a.materialEfficiency).slice(0, 15).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{c.sector} · {c.country}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 13, fontWeight: 700, color: T.indigo }}>{c.materialEfficiency}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Waste Recovery Rate by Sector</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={wasteBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v}%`, 'Waste Recovery']} />
                  <Bar dataKey="avg" fill={T.green} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Waste Recovery Leaders</div>
              {[...filtered].sort((a, b) => b.wasteRecoveryRate - a.wasteRecoveryRate).slice(0, 12).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 13, color: T.green, fontWeight: 700 }}>{c.wasteRecoveryRate}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Circular Revenue by Country ($M)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={countryRevData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`$${v}M`, 'Circular Revenue']} />
                  <Bar dataKey="total" fill={T.gold} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Revenue Impact Summary</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>Material cost multiplier: ×{materialCostMultiplier.toFixed(1)}</div>
              {filtered.slice(0, 12).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ fontSize: 12 }}>{c.name}</div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.gold, fontWeight: 700 }}>${(c.revenueFromCircular * materialCostMultiplier).toFixed(0)}M</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Capex vs Carbon Saving</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Capex ($M)" tick={{ fontSize: 10 }} label={{ value: 'Circular Capex ($M)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis dataKey="y" name="Carbon Saving" tick={{ fontSize: 10 }} label={{ value: 'CO2 Saving (ktCO2e)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => [v, n === 'x' ? 'Capex ($M)' : 'Carbon Saving (ktCO2e)']} />
                  <Scatter data={scatterData.slice(0, 40)} fill={T.teal} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Carbon Value at ${carbonPrice}/tCO2</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: T.green, fontFamily: T.fontMono, marginBottom: 12 }}>${carbonValueM}M</div>
              {[...filtered].sort((a, b) => b.carbonSaving - a.carbonSaving).slice(0, 12).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ fontSize: 12 }}>{c.name}</div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.green }}>{(c.carbonSaving / 1000).toFixed(1)}k tCO2e</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 6 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Water Saving Leaders (M m³/yr)</div>
              {[...filtered].sort((a, b) => b.waterSaving - a.waterSaving).slice(0, 15).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.blue }}>{c.waterSaving} M m³</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Raw Material Reduction (%)</div>
              {[...filtered].sort((a, b) => b.rawMaterialReduction - a.rawMaterialReduction).slice(0, 15).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ fontSize: 12 }}>{c.name}</div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.sage }}>{c.rawMaterialReduction}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Circular Bond Issuers</div>
              {filtered.filter(c => c.circularBondIssued).slice(0, 20).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{c.sector} · {c.country}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.gold }}>${ c.circularCapex }M capex</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Circular Finance KPIs</div>
              {[
                { label: 'Total Circular Capex', val: `$${totalCapex.toLocaleString()}M`, clr: T.indigo },
                { label: 'Bond Issuers', val: `${filtered.filter(c => c.circularBondIssued).length} companies (${pctBonds}%)`, clr: T.gold },
                { label: 'Avg Capex per Company', val: `$${(totalCapex / n).toFixed(0)}M`, clr: T.navy },
                { label: 'Carbon Value Created', val: `$${carbonValueM}M`, clr: T.green },
                { label: 'Avg Eco Design Score', val: `${(filtered.reduce((s, c) => s + c.ecoDesignScore, 0) / n).toFixed(1)}/10`, clr: T.teal },
                { label: 'Avg Product Life Extension', val: `${(filtered.reduce((s, c) => s + c.productLifeExtension, 0) / n).toFixed(1)} yrs`, clr: T.sage },
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
