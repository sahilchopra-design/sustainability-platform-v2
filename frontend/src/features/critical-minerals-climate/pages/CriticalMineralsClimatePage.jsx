import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

const MINERALS = ['Lithium','Cobalt','Nickel','Copper','Rare Earth','Manganese','Graphite','Silicon'];
const REGIONS = ['Africa','Latin America','Asia Pacific','North America','Europe & CIS','Middle East'];
const SUPPLY_RISK_TIERS = ['Low','Medium','High','Critical'];

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const COUNTRIES_BY_REGION = {
  'Africa': ['DRC','South Africa','Zambia','Zimbabwe','Morocco','Namibia'],
  'Latin America': ['Chile','Peru','Brazil','Argentina','Bolivia','Mexico'],
  'Asia Pacific': ['Australia','China','Indonesia','Philippines','Papua New Guinea','Myanmar'],
  'North America': ['USA','Canada','Mexico'],
  'Europe & CIS': ['Russia','Kazakhstan','Ukraine','Finland','Norway'],
  'Middle East': ['Saudi Arabia','UAE','Turkey','Jordan'],
};

const ALL_COUNTRIES = Object.values(COUNTRIES_BY_REGION).flat();

const PROJECTS = Array.from({ length: 75 }, (_, i) => {
  const mineral = MINERALS[Math.floor(sr(i * 7) * MINERALS.length)];
  const region = REGIONS[Math.floor(sr(i * 11) * REGIONS.length)];
  const countryPool = COUNTRIES_BY_REGION[region];
  const country = countryPool[Math.floor(sr(i * 13) * countryPool.length)];
  const supplyConcentration = Math.round(500 + sr(i * 17) * 4500);
  const supplyRisk = supplyConcentration < 1500 ? 'Low' : supplyConcentration < 2500 ? 'Medium' : supplyConcentration < 3500 ? 'High' : 'Critical';
  return {
    id: i + 1,
    name: `${['LithCo','CobaltMine','NickelOre','CopperMine','REEMine','ManganMine','GraphiteCo','SiliconMine','MinTech','CritMin'][i % 10]} ${country.substring(0, 4)} ${i + 1}`,
    mineral, country, region, supplyConcentration, supplyRisk,
    reservesMt: +(0.5 + sr(i * 3) * 49.5).toFixed(1),
    productionKt: Math.round(5 + sr(i * 5) * 495),
    carbonIntensity: +(2 + sr(i * 19) * 48).toFixed(1),
    waterIntensity: +(50 + sr(i * 23) * 950).toFixed(0),
    tailingsRisk: +(1 + sr(i * 29) * 9).toFixed(1),
    evDemandGrowth: +(5 + sr(i * 31) * 45).toFixed(1),
    recyclingRate: Math.round(5 + sr(i * 37) * 65),
    justiceConcerns: +(1 + sr(i * 41) * 9).toFixed(1),
    transitionCriticalScore: Math.round(30 + sr(i * 43) * 65),
  };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const TABS = ['Mineral Overview','Supply Concentration','Carbon Intensity','Water Risk','Tailings Risk','EV Demand Outlook','Recycling & Circularity','Just Transition'];

export default function CriticalMineralsClimatePage() {
  const [tab, setTab] = useState(0);
  const [mineralFilter, setMineralFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [evAdoption, setEvAdoption] = useState(30);
  const [carbonPrice, setCarbonPrice] = useState(65);

  const filtered = useMemo(() => PROJECTS.filter(p =>
    (mineralFilter === 'All' || p.mineral === mineralFilter) &&
    (regionFilter === 'All' || p.region === regionFilter) &&
    (riskFilter === 'All' || p.supplyRisk === riskFilter)
  ), [mineralFilter, regionFilter, riskFilter]);

  const n = Math.max(1, filtered.length);
  const totalReserves = (filtered.reduce((s, p) => s + p.reservesMt, 0)).toFixed(0);
  const avgCarbonIntensity = (filtered.reduce((s, p) => s + p.carbonIntensity, 0) / n).toFixed(1);
  const avgSupplyConcentration = Math.round(filtered.reduce((s, p) => s + p.supplyConcentration, 0) / n);
  const avgTransitionScore = (filtered.reduce((s, p) => s + p.transitionCriticalScore, 0) / n).toFixed(1);

  const evDemandMultiplier = (1 + (evAdoption / 100) * 2).toFixed(2);
  const carbonCostM = ((filtered.reduce((s, p) => s + p.productionKt * p.carbonIntensity, 0) * carbonPrice) / 1e6).toFixed(0);

  const mineralProdData = MINERALS.map(m => {
    const ps = filtered.filter(p => p.mineral === m);
    return { mineral: m.substring(0, 8), prod: ps.reduce((s, p) => s + p.productionKt, 0) };
  }).filter(d => d.prod > 0);

  const mineralHHIData = MINERALS.map(m => {
    const ps = filtered.filter(p => p.mineral === m);
    return { mineral: m.substring(0, 8), hhi: ps.length ? Math.round(ps.reduce((s, p) => s + p.supplyConcentration, 0) / ps.length) : 0 };
  }).filter(d => d.hhi > 0);

  const mineralEVData = MINERALS.map(m => {
    const ps = filtered.filter(p => p.mineral === m);
    return { mineral: m.substring(0, 8), evGrowth: ps.length ? +(ps.reduce((s, p) => s + p.evDemandGrowth, 0) / ps.length).toFixed(1) : 0 };
  }).filter(d => d.evGrowth > 0);

  const scatterData = filtered.map(p => ({ x: p.carbonIntensity, y: p.recyclingRate, name: p.name, mineral: p.mineral }));

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>💎</span>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Critical Minerals & Climate</div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: T.fontMono }}>EP-DL5 · 75 Projects · 8 Minerals · Supply Concentration & EV Transition Analytics</div>
          </div>
        </div>
      </div>

      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Mineral', mineralFilter, setMineralFilter, ['All', ...MINERALS]],
          ['Region', regionFilter, setRegionFilter, ['All', ...REGIONS]],
          ['Supply Risk', riskFilter, setRiskFilter, ['All', ...SUPPLY_RISK_TIERS]],
        ].map(([label, val, setter, opts]) => (
          <label key={label} style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}:
            <select value={val} onChange={e => setter(e.target.value)} style={{ fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, padding: '3px 6px', background: T.bg }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          EV Adoption {evAdoption}%:
          <input type="range" min={5} max={80} value={evAdoption} onChange={e => setEvAdoption(+e.target.value)} style={{ width: 80 }} />
        </label>
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Carbon ${carbonPrice}/tCO2:
          <input type="range" min={20} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 80 }} />
        </label>
        <span style={{ fontSize: 11, color: T.textSec, marginLeft: 'auto' }}>{filtered.length} projects</span>
      </div>

      <div style={{ padding: '20px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Total Reserves" value={`${totalReserves} Mt`} sub={`${filtered.length} projects tracked`} color={T.purple} />
        <KpiCard label="Avg Carbon Intensity" value={`${avgCarbonIntensity}`} sub={`tCO2e/t mineral · Cost: $${carbonCostM}M`} color={T.orange} />
        <KpiCard label="Avg Supply Concentration" value={`${avgSupplyConcentration}`} sub="HHI Index (>2500 = high conc.)" color={T.red} />
        <KpiCard label="Avg Transition Critical Score" value={`${avgTransitionScore}`} sub={`EV demand ×${evDemandMultiplier} with ${evAdoption}% adoption`} color={T.teal} />
      </div>

      <div style={{ padding: '0 32px', display: 'flex', gap: 4, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '8px 14px', fontSize: 12, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? T.navy : T.textSec, background: tab === i ? T.card : 'transparent',
            border: 'none', borderBottom: tab === i ? `2px solid ${T.purple}` : '2px solid transparent',
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
                  {['Project','Mineral','Country','Region','Supply Risk','Reserves(Mt)','Prod(kt)','CI(tCO2/t)','EV Growth%','Trans.Score'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 40).map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{p.name}</td>
                    <td style={{ padding: '7px 10px' }}>{p.mineral}</td>
                    <td style={{ padding: '7px 10px' }}>{p.country}</td>
                    <td style={{ padding: '7px 10px' }}>{p.region}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ background: p.supplyRisk === 'Critical' ? '#fee2e2' : p.supplyRisk === 'High' ? '#fef3c7' : p.supplyRisk === 'Medium' ? '#fef9c3' : '#dcfce7', color: p.supplyRisk === 'Critical' ? T.red : p.supplyRisk === 'High' ? T.orange : p.supplyRisk === 'Medium' ? T.amber : T.green, borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 600 }}>{p.supplyRisk}</span>
                    </td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{p.reservesMt}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{p.productionKt}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: p.carbonIntensity >= 30 ? T.red : p.carbonIntensity >= 15 ? T.amber : T.green }}>{p.carbonIntensity}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: T.teal }}>+{p.evDemandGrowth}%</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: p.transitionCriticalScore >= 70 ? T.purple : T.blue }}>{p.transitionCriticalScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Avg Supply Concentration (HHI) by Mineral</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mineralHHIData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="mineral" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [v, 'HHI Index']} />
                  <Bar dataKey="hhi" fill={T.red} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Supply Risk Distribution</div>
              {SUPPLY_RISK_TIERS.map(tier => {
                const cnt = filtered.filter(p => p.supplyRisk === tier).length;
                const pct = n > 0 ? (cnt / n) * 100 : 0;
                const clr = tier === 'Critical' ? T.red : tier === 'High' ? T.orange : tier === 'Medium' ? T.amber : T.green;
                return (
                  <div key={tier} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, color: clr }}>{tier}</span>
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

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Carbon Intensity vs Recycling Rate</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Carbon Intensity" tick={{ fontSize: 10 }} label={{ value: 'Carbon Intensity (tCO2/t)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis dataKey="y" name="Recycling Rate" tick={{ fontSize: 10 }} label={{ value: 'Recycling Rate (%)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => [v, n === 'x' ? 'tCO2/t mineral' : 'Recycling %']} />
                  <Scatter data={scatterData.slice(0, 50)} fill={T.indigo} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Lowest Carbon Intensity Projects</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Carbon cost @ ${carbonPrice}/tCO2: ${carbonCostM}M total</div>
              {[...filtered].sort((a, b) => a.carbonIntensity - b.carbonIntensity).slice(0, 15).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{p.mineral} · {p.country}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.green }}>{p.carbonIntensity} tCO2/t</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Highest Water Intensity Projects</div>
              {[...filtered].sort((a, b) => b.waterIntensity - a.waterIntensity).slice(0, 15).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{p.mineral} · {p.region}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.blue }}>{p.waterIntensity} m³/t</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Water Risk by Mineral</div>
              {MINERALS.map(m => {
                const ps = filtered.filter(p => p.mineral === m);
                const avgWI = ps.length ? Math.round(ps.reduce((s, p) => s + p.waterIntensity, 0) / ps.length) : 0;
                const maxWI = Math.max(...MINERALS.map(mm => {
                  const mps = filtered.filter(p => p.mineral === mm);
                  return mps.length ? Math.round(mps.reduce((s, p) => s + p.waterIntensity, 0) / mps.length) : 0;
                }));
                const pct = maxWI > 0 ? (avgWI / maxWI) * 100 : 0;
                return (
                  <div key={m} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600 }}>{m}</span>
                      <span style={{ fontFamily: T.fontMono, color: T.textSec }}>{avgWI} m³/t avg</span>
                    </div>
                    <div style={{ background: T.borderL, borderRadius: 4, height: 8 }}>
                      <div style={{ background: T.blue, width: `${pct}%`, height: '100%', borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Highest Tailings Risk Projects</div>
              {[...filtered].sort((a, b) => b.tailingsRisk - a.tailingsRisk).slice(0, 15).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{p.mineral} · {p.country}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 13, color: p.tailingsRisk >= 7 ? T.red : T.amber, fontWeight: 700 }}>{p.tailingsRisk}/10</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Tailings Risk Categories</div>
              {[['Critical (7–10)', 7, 10, T.red], ['Elevated (4–6.9)', 4, 7, T.amber], ['Manageable (<4)', 0, 4, T.green]].map(([label, lo, hi, clr]) => {
                const cnt = filtered.filter(p => p.tailingsRisk >= lo && p.tailingsRisk < hi).length;
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
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>EV Demand Growth by Mineral (%pa)</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>At {evAdoption}% EV adoption → demand multiplier ×{evDemandMultiplier}</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={mineralEVData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="mineral" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v}%pa`, 'EV Demand Growth']} />
                  <Bar dataKey="evGrowth" fill={T.teal} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Top EV Demand Growth Projects</div>
              {[...filtered].sort((a, b) => b.evDemandGrowth - a.evDemandGrowth).slice(0, 15).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{p.mineral} · {p.country}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.teal }}>+{p.evDemandGrowth}%pa</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 6 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Production by Mineral (kt/yr)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mineralProdData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="mineral" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v} kt`, 'Production']} />
                  <Bar dataKey="prod" fill={T.indigo} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Recycling Rate Leaders</div>
              {[...filtered].sort((a, b) => b.recyclingRate - a.recyclingRate).slice(0, 15).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{p.mineral}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.sage }}>{p.recyclingRate}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Highest Justice Concerns (top 15)</div>
              {[...filtered].sort((a, b) => b.justiceConcerns - a.justiceConcerns).slice(0, 15).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{p.mineral} · {p.country}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 13, color: p.justiceConcerns >= 7 ? T.red : T.amber, fontWeight: 700 }}>{p.justiceConcerns}/10</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Just Transition KPIs</div>
              {[
                { label: 'Avg Justice Concerns', val: `${(filtered.reduce((s, p) => s + p.justiceConcerns, 0) / n).toFixed(1)}/10`, clr: T.red },
                { label: 'Critical Justice Issues (>7)', val: `${filtered.filter(p => p.justiceConcerns >= 7).length}`, clr: T.red },
                { label: 'Avg Tailings Risk', val: `${(filtered.reduce((s, p) => s + p.tailingsRisk, 0) / n).toFixed(1)}/10`, clr: T.orange },
                { label: 'Avg Transition Critical Score', val: `${avgTransitionScore}/100`, clr: T.teal },
                { label: 'High-Risk Supply (>3500 HHI)', val: `${filtered.filter(p => p.supplyConcentration > 3500).length}`, clr: T.red },
                { label: 'Avg Recycling Rate', val: `${(filtered.reduce((s, p) => s + p.recyclingRate, 0) / n).toFixed(1)}%`, clr: T.sage },
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
