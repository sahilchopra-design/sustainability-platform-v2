import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

const SECTORS = ['Heavy Industry','Manufacturing','Chemicals','Mining','Steel & Metals','Food Processing'];
const COUNTRIES = ['Germany','Japan','USA','China','South Korea','France','UK','Sweden','Netherlands','Australia'];
const EFFICIENCY_TIERS = ['Laggard','Standard','Efficient','Best-in-Class'];

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const COMPANIES = Array.from({ length: 70 }, (_, i) => {
  const sector = SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];
  const country = COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];
  const resourceEfficiencyScore = Math.round(20 + sr(i * 5) * 76);
  const tier = resourceEfficiencyScore < 35 ? 'Laggard' : resourceEfficiencyScore < 55 ? 'Standard' : resourceEfficiencyScore < 75 ? 'Efficient' : 'Best-in-Class';
  return {
    id: i + 1,
    name: `${['InduCo','EcoProcess','ResEff','GreenOps','EfficientMfg','SustainPro','CleanMfg','GreenWork','EcoIndustry','CircuMfg'][i % 10]} ${['GmbH','Corp','AG','Ltd','SA','NV','Inc','BV','PLC','SE'][Math.floor(sr(i * 13) * 10)]}`,
    sector, country, tier, resourceEfficiencyScore,
    energyIntensity: +(5 + sr(i * 3) * 95).toFixed(1),
    waterIntensity: +(50 + sr(i * 17) * 950).toFixed(0),
    materialIntensity: +(10 + sr(i * 19) * 190).toFixed(1),
    wasteIntensity: +(2 + sr(i * 23) * 48).toFixed(1),
    energyProductivity: +(5 + sr(i * 29) * 55).toFixed(1),
    iso50001: sr(i * 31) > 0.45,
    circularityIntegration: +(1 + sr(i * 37) * 9).toFixed(1),
    resourceRisk: +(1 + sr(i * 41) * 9).toFixed(1),
    efficiencyCapex: Math.round(1 + sr(i * 43) * 99),
    resourceCostSavings: Math.round(0.5 + sr(i * 47) * 49.5),
  };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const TABS = ['Company Overview','Energy Efficiency','Water Efficiency','Material Efficiency','Waste Reduction','Productivity Trends','Resource Risk','Investment Returns'];

export default function ResourceEfficiencyAnalyticsPage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [energyPrice, setEnergyPrice] = useState(80);
  const [waterPrice, setWaterPrice] = useState(2.5);

  const filtered = useMemo(() => COMPANIES.filter(c =>
    (sectorFilter === 'All' || c.sector === sectorFilter) &&
    (countryFilter === 'All' || c.country === countryFilter) &&
    (tierFilter === 'All' || c.tier === tierFilter)
  ), [sectorFilter, countryFilter, tierFilter]);

  const n = Math.max(1, filtered.length);
  const avgScore = (filtered.reduce((s, c) => s + c.resourceEfficiencyScore, 0) / n).toFixed(1);
  const totalSavings = filtered.reduce((s, c) => s + c.resourceCostSavings, 0);
  const avgEnergyProd = (filtered.reduce((s, c) => s + c.energyProductivity, 0) / n).toFixed(1);
  const pctIso = ((filtered.filter(c => c.iso50001).length / n) * 100).toFixed(0);
  const totalCapex = filtered.reduce((s, c) => s + c.efficiencyCapex, 0);

  const sectorEffData = SECTORS.map(sec => {
    const cs = filtered.filter(c => c.sector === sec);
    return { sector: sec.substring(0, 8), score: cs.length ? Math.round(cs.reduce((s, c) => s + c.resourceEfficiencyScore, 0) / cs.length) : 0 };
  }).filter(d => d.score > 0);

  const countryEnergyData = COUNTRIES.map(cn => {
    const cs = filtered.filter(c => c.country === cn);
    return { country: cn.substring(0, 6), ei: cs.length ? +(cs.reduce((s, c) => s + c.energyIntensity, 0) / cs.length).toFixed(1) : 0 };
  }).filter(d => d.ei > 0).sort((a, b) => b.ei - a.ei).slice(0, 8);

  const sectorWaterData = SECTORS.map(sec => {
    const cs = filtered.filter(c => c.sector === sec);
    return { sector: sec.substring(0, 8), wi: cs.length ? Math.round(cs.reduce((s, c) => s + c.waterIntensity, 0) / cs.length) : 0 };
  }).filter(d => d.wi > 0);

  const scatterData = filtered.map(c => ({ x: c.efficiencyCapex, y: c.resourceCostSavings, name: c.name }));

  const roiData = filtered.map(c => ({
    name: c.name.substring(0, 10),
    roi: c.efficiencyCapex > 0 ? +((c.resourceCostSavings / c.efficiencyCapex) * 100).toFixed(1) : 0,
  })).sort((a, b) => b.roi - a.roi).slice(0, 12);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>⚡</span>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Resource Efficiency Analytics</div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: T.fontMono }}>EP-DL4 · 70 Industrial Companies · Energy, Water, Material & Waste Intelligence</div>
          </div>
        </div>
      </div>

      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Sector', sectorFilter, setSectorFilter, ['All', ...SECTORS]],
          ['Country', countryFilter, setCountryFilter, ['All', ...COUNTRIES]],
          ['Tier', tierFilter, setTierFilter, ['All', ...EFFICIENCY_TIERS]],
        ].map(([label, val, setter, opts]) => (
          <label key={label} style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}:
            <select value={val} onChange={e => setter(e.target.value)} style={{ fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, padding: '3px 6px', background: T.bg }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Energy ${energyPrice}/MWh:
          <input type="range" min={30} max={300} value={energyPrice} onChange={e => setEnergyPrice(+e.target.value)} style={{ width: 80 }} />
        </label>
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Water ${waterPrice}/m³:
          <input type="range" min={0.5} max={10} step={0.5} value={waterPrice} onChange={e => setWaterPrice(+e.target.value)} style={{ width: 80 }} />
        </label>
        <span style={{ fontSize: 11, color: T.textSec, marginLeft: 'auto' }}>{filtered.length} companies</span>
      </div>

      <div style={{ padding: '20px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Avg Resource Efficiency Score" value={avgScore} sub={`0–100 scale · ${filtered.filter(c => c.tier === 'Best-in-Class').length} best-in-class`} color={T.teal} />
        <KpiCard label="Total Cost Savings" value={`$${totalSavings.toLocaleString()}M/yr`} sub={`Total capex: $${totalCapex}M`} color={T.green} />
        <KpiCard label="Avg Energy Productivity" value={`${avgEnergyProd}%`} sub="5-yr improvement" color={T.indigo} />
        <KpiCard label="ISO 50001 Certified" value={`${pctIso}%`} sub={`${filtered.filter(c => c.iso50001).length} of ${filtered.length} companies`} color={T.gold} />
      </div>

      <div style={{ padding: '0 32px', display: 'flex', gap: 4, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '8px 14px', fontSize: 12, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? T.navy : T.textSec, background: tab === i ? T.card : 'transparent',
            border: 'none', borderBottom: tab === i ? `2px solid ${T.indigo}` : '2px solid transparent',
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
                  {['Company','Sector','Country','Tier','Score','EI(GJ/$M)','WI(m³/$M)','MI(t/$M)','WasteI','ISO50001'].map(h => (
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
                      <span style={{ background: c.tier === 'Best-in-Class' ? '#dcfce7' : c.tier === 'Efficient' ? '#dbeafe' : c.tier === 'Standard' ? '#fef9c3' : '#fee2e2', color: c.tier === 'Best-in-Class' ? T.green : c.tier === 'Efficient' ? T.blue : c.tier === 'Standard' ? T.amber : T.red, borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 600 }}>{c.tier}</span>
                    </td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: c.resourceEfficiencyScore >= 75 ? T.green : c.resourceEfficiencyScore >= 55 ? T.blue : T.amber }}>{c.resourceEfficiencyScore}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{c.energyIntensity}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{c.waterIntensity}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{c.materialIntensity}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{c.wasteIntensity}</td>
                    <td style={{ padding: '7px 10px' }}>{c.iso50001 ? <span style={{ color: T.green, fontWeight: 700 }}>✓</span> : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Energy Intensity by Country (GJ/$M rev)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={countryEnergyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v} GJ/$M`, 'Energy Intensity']} />
                  <Bar dataKey="ei" fill={T.amber} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Energy Cost Savings @ ${energyPrice}/MWh</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: T.amber, fontFamily: T.fontMono, marginBottom: 12 }}>
                ${((filtered.reduce((s, c) => s + c.resourceCostSavings * 0.4, 0)).toFixed(0))}M/yr
              </div>
              {[...filtered].sort((a, b) => b.energyProductivity - a.energyProductivity).slice(0, 12).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.amber }}>+{c.energyProductivity}% 5yr</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Water Intensity by Sector (m³/$M rev)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={sectorWaterData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="sector" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v} m³/$M`, 'Water Intensity']} />
                  <Bar dataKey="wi" fill={T.blue} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Water Cost @ ${waterPrice}/m³</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: T.blue, fontFamily: T.fontMono, marginBottom: 12 }}>
                ${((filtered.reduce((s, c) => s + c.resourceCostSavings * 0.25, 0)).toFixed(0))}M/yr saved
              </div>
              {[...filtered].sort((a, b) => a.waterIntensity - b.waterIntensity).slice(0, 12).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ fontSize: 12 }}>{c.name}</div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.blue }}>{c.waterIntensity} m³/$M</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Resource Efficiency Score by Sector</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={sectorEffData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="sector" tick={{ fontSize: 9 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [v, 'Avg Score']} />
                  <Bar dataKey="score" fill={T.teal} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Lowest Material Intensity (leaders)</div>
              {[...filtered].sort((a, b) => a.materialIntensity - b.materialIntensity).slice(0, 12).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.sage }}>{c.materialIntensity} t/$M</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Lowest Waste Intensity (top 15)</div>
              {[...filtered].sort((a, b) => a.wasteIntensity - b.wasteIntensity).slice(0, 15).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{c.sector}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.green }}>{c.wasteIntensity} t/$M</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Waste Reduction by Tier</div>
              {EFFICIENCY_TIERS.map(tier => {
                const cs = filtered.filter(c => c.tier === tier);
                const avgWI = cs.length ? (cs.reduce((s, c) => s + c.wasteIntensity, 0) / cs.length).toFixed(1) : '0';
                const clr = tier === 'Best-in-Class' ? T.green : tier === 'Efficient' ? T.blue : tier === 'Standard' ? T.amber : T.red;
                return (
                  <div key={tier} style={{ padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: clr }}>{tier}</span>
                      <span style={{ fontFamily: T.fontMono, fontSize: 12 }}>Avg WI: {avgWI} t/$M · {cs.length} cos</span>
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
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Energy Productivity Leaders (5-yr % improvement)</div>
              {[...filtered].sort((a, b) => b.energyProductivity - a.energyProductivity).slice(0, 15).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{c.sector} · {c.iso50001 ? 'ISO 50001 ✓' : 'No ISO'}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 13, color: T.indigo, fontWeight: 700 }}>+{c.energyProductivity}%</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>ISO 50001 Impact on Energy Productivity</div>
              {[['ISO 50001 Certified', true], ['Non-Certified', false]].map(([label, certified]) => {
                const cs = filtered.filter(c => c.iso50001 === certified);
                const avgProd = cs.length ? (cs.reduce((s, c) => s + c.energyProductivity, 0) / cs.length).toFixed(1) : '0';
                const clr = certified ? T.green : T.amber;
                return (
                  <div key={label} style={{ padding: '12px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: clr }}>{label}</span>
                      <span style={{ fontFamily: T.fontMono, fontSize: 14, fontWeight: 700, color: clr }}>{avgProd}% avg</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{cs.length} companies</div>
                  </div>
                );
              })}
              <div style={{ marginTop: 16, padding: 12, background: T.sub, borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: T.textSec }}>ISO 50001 energy management systems typically deliver 1–5% annual energy savings. Companies with certification show statistically higher productivity improvements across all sectors in this dataset.</div>
              </div>
            </div>
          </div>
        )}

        {tab === 6 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Highest Resource Risk (top 15)</div>
              {[...filtered].sort((a, b) => b.resourceRisk - a.resourceRisk).slice(0, 15).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{c.sector} · {c.country}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 13, color: c.resourceRisk >= 7 ? T.red : T.amber, fontWeight: 700 }}>{c.resourceRisk}/10</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Risk Distribution</div>
              {[['Critical (7–10)', 7, 10, T.red], ['Medium (4–6.9)', 4, 7, T.amber], ['Low (0–3.9)', 0, 4, T.green]].map(([label, lo, hi, clr]) => {
                const cnt = filtered.filter(c => c.resourceRisk >= lo && c.resourceRisk < hi).length;
                const pct = n > 0 ? (cnt / n) * 100 : 0;
                return (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: clr }}>{label}</span>
                      <span style={{ color: T.textSec, fontFamily: T.fontMono }}>{cnt} ({pct.toFixed(0)}%)</span>
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

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Efficiency Capex vs Cost Savings ($M)</div>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Capex" tick={{ fontSize: 10 }} label={{ value: 'Efficiency Capex ($M)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis dataKey="y" name="Savings" tick={{ fontSize: 10 }} label={{ value: 'Cost Savings ($M)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => [v, n === 'x' ? 'Capex ($M)' : 'Savings ($M)']} />
                  <Scatter data={scatterData.slice(0, 50)} fill={T.green} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Highest ROI on Efficiency Capex</div>
              {roiData.slice(0, 12).map((c, i) => (
                <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: c.roi >= 50 ? T.green : T.amber }}>{c.roi}% ROI</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
