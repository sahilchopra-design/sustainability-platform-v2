import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, PieChart, Pie, Cell, Legend,
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const SECTORS = ['Meat', 'Dairy', 'Grains', 'Beverages', 'Packaged Food', 'Retail'];
const COUNTRIES = ['USA', 'Brazil', 'Germany', 'France', 'UK', 'China', 'India', 'Australia', 'Netherlands', 'Denmark'];
const COMPANY_NAMES = [
  'MeatCo Global', 'NovaDairy', 'GrainPath AG', 'BevWorld', 'PackFoods Inc', 'RetailGreen',
  'ProteMax', 'LactoEco', 'CerealPlus', 'DrinkNature', 'FoodFusion', 'EcoRetail',
  'BeefTech', 'MilkFarm', 'WheatMills', 'AquaBev', 'NatureFoods', 'GreenShelf',
  'MethaneCuts', 'CoolDairy', 'GrainFutures', 'SodaZero', 'PlantPack', 'FoodChain',
  'CarbonMeat', 'DairyPlus', 'AgriGrains', 'PureFresh', 'LeafFoods', 'ClimateMart',
  'FarmTech', 'CheeseCo', 'RiceWorld', 'JuiceFuture', 'CleanPack', 'BioRetail',
  'GrassBeef', 'YogurtPlus', 'OatMills', 'TeaForce', 'VegPack', 'FreshMart',
  'SustainMeat', 'AlmondMilk', 'SoyGrain', 'CocoaDrink', 'RecycPack', 'EcoshopCo',
  'ProteInvest', 'FermentCo', 'WholeGrain', 'HydroBev', 'BioPack', 'GreenRetail',
  'AquaCulture',
];

const COMPANIES = Array.from({ length: 55 }, (_, i) => {
  const sector = SECTORS[i % SECTORS.length];
  const country = COUNTRIES[i % COUNTRIES.length];
  const transitionScore = Math.round(20 + sr(i * 7) * 75);
  return {
    id: i,
    name: COMPANY_NAMES[i] || `Company ${i + 1}`,
    sector,
    country,
    revenue: +(1 + sr(i * 11) * 80).toFixed(1),
    scope1: +(0.1 + sr(i * 13) * 5).toFixed(2),
    scope2: +(0.05 + sr(i * 17) * 2).toFixed(2),
    scope3AgriPct: +(30 + sr(i * 5) * 60).toFixed(1),
    deforestationCommitment: sr(i * 3) > 0.45,
    scienceBasedTarget: sr(i * 19) > 0.5,
    transitionScore,
    supplierEngagementPct: +(15 + sr(i * 23) * 70).toFixed(1),
    alternativeProteinInvestment: +(sr(i * 29) * 500).toFixed(0),
    biodiversityCommitment: sr(i * 31) > 0.55,
  };
});

const TABS = [
  'Company Overview', 'Emissions Profile', 'Scope 3 Agriculture', 'Deforestation Commitments',
  'SBT Alignment', 'Transition Scoring', 'Supplier Engagement', 'Alternative Protein',
];

const PIE_COLORS = [T.green, T.amber, T.red, T.blue, T.purple, T.teal];

export default function FoodSystemTransitionPage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [sbtStatus, setSbtStatus] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(50);
  const [scope3Target, setScope3Target] = useState(30);

  const filtered = useMemo(() => {
    return COMPANIES.filter(c => {
      if (sectorFilter !== 'All' && c.sector !== sectorFilter) return false;
      if (countryFilter !== 'All' && c.country !== countryFilter) return false;
      if (sbtStatus === 'Approved' && !c.scienceBasedTarget) return false;
      if (sbtStatus === 'Not Set' && c.scienceBasedTarget) return false;
      return true;
    });
  }, [sectorFilter, countryFilter, sbtStatus]);

  const kpis = useMemo(() => {
    const n = Math.max(1, filtered.length);
    const totalRevenue = filtered.reduce((a, c) => a + c.revenue, 0);
    const avgTransition = filtered.reduce((a, c) => a + c.transitionScore, 0) / n;
    const sbtPct = filtered.filter(c => c.scienceBasedTarget).length / n * 100;
    const defoPct = filtered.filter(c => c.deforestationCommitment).length / n * 100;
    return {
      totalRevenue: totalRevenue.toFixed(0),
      avgTransition: avgTransition.toFixed(0),
      sbtPct: sbtPct.toFixed(0),
      defoPct: defoPct.toFixed(0),
    };
  }, [filtered]);

  const scope3BySector = useMemo(() =>
    SECTORS.map(s => {
      const items = filtered.filter(c => c.sector === s);
      const n = Math.max(1, items.length);
      return { sector: s, avgPct: +(items.reduce((a, c) => a + c.scope3AgriPct, 0) / n).toFixed(1) };
    }), [filtered]);

  const sbtPieData = useMemo(() => {
    const approved = filtered.filter(c => c.scienceBasedTarget).length;
    const notSet = filtered.length - approved;
    return [
      { name: 'SBT Approved', value: approved },
      { name: 'Not Set', value: notSet },
    ];
  }, [filtered]);

  const defoBySecotr = useMemo(() =>
    SECTORS.map(s => {
      const items = filtered.filter(c => c.sector === s);
      const committed = items.filter(c => c.deforestationCommitment).length;
      return { sector: s, committed, total: items.length, pct: items.length ? Math.round(committed / items.length * 100) : 0 };
    }), [filtered]);

  const s = { fontFamily: "'DM Sans', system-ui, sans-serif" };

  return (
    <div style={{ ...s, background: T.bg, minHeight: '100vh', padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>EP-DG2 · Food, Agriculture & Land Use</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.navy, margin: 0 }}>Food System Transition</h1>
        <p style={{ color: T.textSec, fontSize: 13, margin: '4px 0 0' }}>Emissions, deforestation commitments, SBT alignment and transition scoring across 55 food & beverage companies</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Revenue', value: `$${kpis.totalRevenue}Bn`, color: T.navy },
          { label: 'Avg Transition Score', value: `${kpis.avgTransition}/100`, color: T.indigo },
          { label: '% with SBT', value: `${kpis.sbtPct}%`, color: T.green },
          { label: 'Deforestation-Free Committed', value: `${kpis.defoPct}%`, color: T.sage },
        ].map(k => (
          <div key={k.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'Sector', value: sectorFilter, set: setSectorFilter, opts: ['All', ...SECTORS] },
          { label: 'Country', value: countryFilter, set: setCountryFilter, opts: ['All', ...COUNTRIES] },
          { label: 'SBT Status', value: sbtStatus, set: setSbtStatus, opts: ['All', 'Approved', 'Not Set'] },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>{f.label}</div>
            <select value={f.value} onChange={e => f.set(e.target.value)} style={{ fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', background: T.bg, color: T.textPri }}>
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>Carbon Price: ${carbonPrice}/tCO2</div>
          <input type="range" min={10} max={200} step={5} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 120 }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 3 }}>Scope 3 Target: {scope3Target}% reduction</div>
          <input type="range" min={0} max={80} step={5} value={scope3Target} onChange={e => setScope3Target(+e.target.value)} style={{ width: 120 }} />
        </div>
        <div style={{ fontSize: 12, color: T.textSec, marginLeft: 'auto' }}>{filtered.length} companies</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            fontSize: 12, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: tab === i ? T.navy : T.sub, color: tab === i ? '#fff' : T.textSec, fontWeight: tab === i ? 600 : 400,
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Company Profiles</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Company', 'Sector', 'Country', 'Revenue ($Bn)', 'Transition Score', 'SBT', 'Deforestation'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 20).map(c => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                    <td style={{ padding: '6px 10px', color: T.textPri, fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '6px 10px', color: T.textSec }}>{c.sector}</td>
                    <td style={{ padding: '6px 10px', color: T.textSec }}>{c.country}</td>
                    <td style={{ padding: '6px 10px', fontFamily: T.fontMono }}>{c.revenue}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 4, background: T.borderL, borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${c.transitionScore}%`, background: c.transitionScore >= 60 ? T.green : c.transitionScore >= 40 ? T.amber : T.red, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontFamily: T.fontMono, fontSize: 11 }}>{c.transitionScore}</span>
                      </div>
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <span style={{ color: c.scienceBasedTarget ? T.green : T.red, fontWeight: 600, fontSize: 11 }}>{c.scienceBasedTarget ? 'Yes' : 'No'}</span>
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <span style={{ color: c.deforestationCommitment ? T.green : T.amber, fontWeight: 600, fontSize: 11 }}>{c.deforestationCommitment ? 'Committed' : 'Pending'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Scope 1 & 2 by Sector (MtCO2e avg)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={SECTORS.map(sec => {
                const items = filtered.filter(c => c.sector === sec);
                const n = Math.max(1, items.length);
                return { sector: sec, scope1: +(items.reduce((a, c) => a + c.scope1, 0) / n).toFixed(2), scope2: +(items.reduce((a, c) => a + c.scope2, 0) / n).toFixed(2) };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="scope1" name="Scope 1" fill={T.red} radius={[4, 4, 0, 0]} />
                <Bar dataKey="scope2" name="Scope 2" fill={T.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Carbon Cost Exposure at ${carbonPrice}/tCO2</div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Estimated annual cost ($M) based on Scope 1+2</div>
            <div style={{ overflowY: 'auto', maxHeight: 240 }}>
              {[...filtered].sort((a, b) => (b.scope1 + b.scope2) - (a.scope1 + a.scope2)).slice(0, 15).map(c => {
                const cost = ((c.scope1 + c.scope2) * carbonPrice).toFixed(1);
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ fontSize: 12, flex: 1, color: T.textPri }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: T.textSec }}>{c.sector}</span>
                    <span style={{ fontSize: 12, color: T.red, fontFamily: T.fontMono, fontWeight: 600 }}>${cost}M</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Scope 3 Agriculture Share by Sector (%)</div>
          <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>% of total Scope 3 emissions from agricultural supply chain</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={scope3BySector}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="sector" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip formatter={v => [`${v}%`, 'Agri Share']} />
              <Bar dataKey="avgPct" fill={T.orange} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Deforestation Commitment Coverage by Sector</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={defoBySecotr}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="sector" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={v => [`${v}%`, 'Committed']} />
              <Bar dataKey="pct" name="% Committed" fill={T.sage} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>SBT Status Distribution</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={sbtPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine>
                  {sbtPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8 }}>Companies with SBT Targets</div>
            <div style={{ overflowY: 'auto', maxHeight: 240 }}>
              {filtered.filter(c => c.scienceBasedTarget).map(c => (
                <div key={c.id} style={{ padding: '6px 0', borderBottom: `1px solid ${T.borderL}`, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, flex: 1, color: T.textPri }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: T.textSec }}>{c.sector}</span>
                  <span style={{ fontSize: 12, color: T.green, fontFamily: T.fontMono }}>{c.transitionScore}/100</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 4 }}>Revenue vs Transition Score</div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="x" name="Revenue ($Bn)" tick={{ fontSize: 11 }} label={{ value: 'Revenue ($Bn)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis dataKey="y" name="Transition Score" tick={{ fontSize: 11 }} label={{ value: 'Transition Score', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={filtered.map(c => ({ x: c.revenue, y: c.transitionScore, name: c.name }))} fill={T.indigo} fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 6 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Supplier Engagement Coverage (%)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[...filtered].sort((a, b) => b.supplierEngagementPct - a.supplierEngagementPct).slice(0, 20).map(c => ({ name: c.name.split(' ')[0], pct: c.supplierEngagementPct }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={v => [`${v}%`, 'Engagement']} />
              <Bar dataKey="pct" fill={T.teal} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 7 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Alternative Protein Investment ($M)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...filtered].sort((a, b) => b.alternativeProteinInvestment - a.alternativeProteinInvestment).slice(0, 15).map(c => ({ name: c.name.split(' ')[0], inv: +c.alternativeProteinInvestment }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [`$${v}M`, 'Investment']} />
                <Bar dataKey="inv" fill={T.purple} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8 }}>Alt Protein Leaders</div>
            <div style={{ overflowY: 'auto', maxHeight: 260 }}>
              {[...filtered].sort((a, b) => b.alternativeProteinInvestment - a.alternativeProteinInvestment).slice(0, 12).map((c, i) => (
                <div key={c.id} style={{ padding: '7px 0', borderBottom: `1px solid ${T.borderL}`, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: T.textSec, width: 20 }}>#{i + 1}</span>
                  <span style={{ fontSize: 12, flex: 1, color: T.textPri }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: T.textSec }}>{c.sector}</span>
                  <span style={{ fontSize: 12, color: T.purple, fontFamily: T.fontMono, fontWeight: 600 }}>${c.alternativeProteinInvestment}M</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
