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

const CDR_TECHNOLOGIES = [
  { id: 'daccs', name: 'Direct Air Carbon Capture (DACCS)', category: 'Engineered', maturity: 'Scaling', costLow: 250, costHigh: 600, potential2030: 0.05, potential2050: 5.0, permanence: 10000, additionality: 'Very High', lca: 0.02, companies: ['Climeworks', 'Carbon Engineering', '1PointFive', 'Global Thermostat'], energy: 'High Electric' },
  { id: 'beccs', name: 'Bioenergy + CCS (BECCS)', category: 'Hybrid', maturity: 'Demonstration', costLow: 80, costHigh: 200, potential2030: 0.5, potential2050: 5.0, permanence: 1000, additionality: 'High', lca: 0.08, companies: ['Drax', 'Boundary Dam', 'ILUC'], energy: 'Bioenergy' },
  { id: 'biochar', name: 'Biochar', category: 'Nature-Based', maturity: 'Scaling', costLow: 60, costHigh: 200, potential2030: 0.3, potential2050: 2.0, permanence: 500, additionality: 'High', lca: 0.12, companies: ['Carbofex', 'Biochar Now', 'Pyreg'], energy: 'Low' },
  { id: 'ew', name: 'Enhanced Weathering', category: 'Geochemical', maturity: 'Pilot', costLow: 50, costHigh: 200, potential2030: 0.2, potential2050: 4.0, permanence: 10000, additionality: 'Very High', lca: 0.15, companies: ['UNDO', 'Eion', 'Lithos Carbon'], energy: 'Medium' },
  { id: 'ocean-alk', name: 'Ocean Alkalinity Enhancement', category: 'Geochemical', maturity: 'Research', costLow: 40, costHigh: 250, potential2030: 0.1, potential2050: 8.0, permanence: 10000, additionality: 'Very High', lca: 0.10, companies: ['Planetary Tech', 'Ebb Carbon', 'Reefblocks'], energy: 'Medium' },
  { id: 'afforestation', name: 'Afforestation/Reforestation', category: 'Nature-Based', maturity: 'Proven', costLow: 5, costHigh: 50, potential2030: 3.5, potential2050: 10.0, permanence: 100, additionality: 'Medium', lca: 0.02, companies: ['Land Life', 'Terraformation', 'Pachama'], energy: 'Very Low' },
  { id: 'soil', name: 'Soil Carbon Sequestration', category: 'Nature-Based', maturity: 'Scaling', costLow: 10, costHigh: 100, potential2030: 1.5, potential2050: 5.0, permanence: 50, additionality: 'Medium', lca: 0.05, companies: ['Indigo Ag', 'Nori', 'Regen Network'], energy: 'Very Low' },
  { id: 'blue-carbon', name: 'Blue Carbon (Mangroves/Seagrass)', category: 'Nature-Based', maturity: 'Scaling', costLow: 20, costHigh: 100, potential2030: 0.8, potential2050: 3.0, permanence: 100, additionality: 'High', lca: 0.04, companies: ['South Pole', 'Verra', 'Plan Vivo'], energy: 'Very Low' },
  { id: 'mineralization', name: 'Mineral Carbonation', category: 'Geochemical', maturity: 'Pilot', costLow: 100, costHigh: 300, potential2030: 0.05, potential2050: 3.0, permanence: 10000, additionality: 'Very High', lca: 0.08, companies: ['CarbonCure', 'Solidia', 'Carbon Clean'], energy: 'Low' },
  { id: 'kelp', name: 'Macroalgae / Kelp Farming', category: 'Nature-Based', maturity: 'Research', costLow: 100, costHigh: 400, potential2030: 0.1, potential2050: 1.5, permanence: 50, additionality: 'Medium', lca: 0.06, companies: ['Running Tide', 'Phykos', 'SeaForester'], energy: 'Low' },
];

const PROJECTS = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  name: `${CDR_TECHNOLOGIES[i % CDR_TECHNOLOGIES.length].name.split('(')[0].trim()} Project ${i + 1}`,
  technology: CDR_TECHNOLOGIES[i % CDR_TECHNOLOGIES.length].id,
  techName: CDR_TECHNOLOGIES[i % CDR_TECHNOLOGIES.length].name.split('(')[0].trim(),
  region: ['North America', 'Europe', 'Asia', 'Africa', 'Latin America'][Math.floor(sr(i * 7) * 5)],
  capacityKtY: +(sr(i * 11) * 50 + 5).toFixed(1),
  costPerTon: Math.round(CDR_TECHNOLOGIES[i % CDR_TECHNOLOGIES.length].costLow + sr(i * 13) * (CDR_TECHNOLOGIES[i % CDR_TECHNOLOGIES.length].costHigh - CDR_TECHNOLOGIES[i % CDR_TECHNOLOGIES.length].costLow)),
  qualityScore: +(sr(i * 17) * 3 + 7).toFixed(1),
  standard: ['Verra VCU', 'Gold Standard', 'Puro.earth', 'Plan Vivo', 'SBTi CDR'][Math.floor(sr(i * 19) * 5)],
  status: ['Active', 'Pipeline', 'Operational', 'Development'][Math.floor(sr(i * 23) * 4)],
  vintage: 2023 + Math.floor(sr(i * 29) * 3),
  buyerType: ['Corporate', 'Government', 'Voluntary'][Math.floor(sr(i * 31) * 3)],
}));

const MARKET_DATA = ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'].map((yr, i) => ({
  year: yr,
  'Engineered CDR': +(0.01 * Math.pow(2.4, i) + sr(i) * 0.01).toFixed(3),
  'Nature-Based': +(0.1 + i * 0.18 + sr(i + 11) * 0.05).toFixed(2),
  'Hybrid (BECCS)': +(0.05 + i * 0.08 + sr(i + 22) * 0.03).toFixed(2),
  'Total Demand': +(0.16 + i * 0.32 + sr(i + 33) * 0.06).toFixed(2),
}));

const COST_CURVE = CDR_TECHNOLOGIES.map(t => ({ name: t.name.split(' ')[0] + (t.name.split(' ')[1] || ''), midCost: (t.costLow + t.costHigh) / 2, potential2050: t.potential2050, category: t.category }));

const TABS = ['Overview', 'CDR Registry', 'Technology Assessment', 'Market Outlook', 'Cost Curves', 'Quality Standards', 'Portfolio'];

export default function CarbonRemovalPage() {
  const [tab, setTab] = useState('Overview');
  const [techFilter, setTechFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('All');

  const categories = ['All', 'Engineered', 'Nature-Based', 'Geochemical', 'Hybrid'];
  const filteredTech = useMemo(() => catFilter === 'All' ? CDR_TECHNOLOGIES : CDR_TECHNOLOGIES.filter(t => t.category === catFilter), [catFilter]);
  const filteredProjects = useMemo(() => techFilter === 'All' ? PROJECTS : PROJECTS.filter(p => p.technology === techFilter), [techFilter]);

  const kpis = useMemo(() => {
    const totalCap = filteredProjects.reduce((s, p) => s + p.capacityKtY, 0);
    const avgCost = filteredProjects.length > 0 ? filteredProjects.reduce((s, p) => s + p.costPerTon, 0) / filteredProjects.length : 0;
    const totalPot2050 = CDR_TECHNOLOGIES.reduce((s, t) => s + t.potential2050, 0);
    return { count: filteredProjects.length, totalCapMt: (totalCap / 1000).toFixed(2), avgCost: avgCost.toFixed(0), totalPot2050: totalPot2050.toFixed(1) };
  }, [filteredProjects]);

  const tabBar = { display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20 };
  const tabBtn = (t) => ({ padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', border: 'none', background: tab === t ? T.navy : T.surfaceH, color: tab === t ? '#fff' : T.textSec, fontWeight: tab === t ? 600 : 400 });
  const matColor = (m) => ({ 'Proven': T.green, 'Scaling': T.teal, 'Demonstration': T.amber, 'Pilot': T.gold, 'Research': T.red }[m] || T.textSec);
  const catColor = (c) => ({ 'Engineered': T.navy, 'Nature-Based': T.sage, 'Geochemical': T.teal, 'Hybrid': T.gold }[c] || T.textSec);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: T.font, color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Carbon Removal Intelligence</div>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>CDR technology registry, project pipeline, cost curves & market outlook — EP-DI2</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="CDR Technologies" value={CDR_TECHNOLOGIES.length} sub="tracked pathways" color={T.navy} />
        <KpiCard label="Projects Tracked" value={kpis.count} sub={`${kpis.totalCapMt} MtCO₂/yr capacity`} color={T.sage} />
        <KpiCard label="Avg Cost" value={`$${kpis.avgCost}/t`} sub="across selected projects" color={T.gold} />
        <KpiCard label="2050 CDR Potential" value={`${kpis.totalPot2050} Gt/yr`} sub="all technologies combined" color={T.teal} />
        <KpiCard label="Gap to 1.5°C Need" value="~9 Gt/yr" sub="vs current 0.04 Gt deployed" color={T.red} />
      </div>

      <div style={tabBar}>{TABS.map(t => <button key={t} style={tabBtn(t)} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>2050 CDR Potential by Technology (GtCO₂/yr)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...CDR_TECHNOLOGIES].sort((a, b) => b.potential2050 - a.potential2050)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" stroke={T.textSec} fontSize={11} />
                <YAxis type="category" dataKey="name" stroke={T.textSec} fontSize={9} width={160} tickFormatter={v => v.length > 22 ? v.slice(0, 22) + '…' : v} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="potential2050" fill={T.teal} name="Potential 2050 (Gt)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>CDR Market Growth Trajectory (GtCO₂/yr)</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={MARKET_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" stroke={T.textSec} fontSize={11} />
                <YAxis stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
                <Area type="monotone" dataKey="Nature-Based" stroke={T.sage} fill={T.sage} fillOpacity={0.2} stackId="a" />
                <Area type="monotone" dataKey="Hybrid (BECCS)" stroke={T.gold} fill={T.gold} fillOpacity={0.2} stackId="a" />
                <Area type="monotone" dataKey="Engineered CDR" stroke={T.navy} fill={T.navy} fillOpacity={0.2} stackId="a" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20, gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Cost vs Permanence by Technology</div>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Cost ($/t)" stroke={T.textSec} fontSize={11} label={{ value: 'Mid Cost ($/tCO₂)', position: 'insideBottom', offset: -4, fill: T.textSec, fontSize: 10 }} />
                <YAxis dataKey="y" name="Permanence (yrs)" stroke={T.textSec} fontSize={11} label={{ value: 'Permanence (yrs)', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 10 }} scale="log" domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={CDR_TECHNOLOGIES.map(t => ({ name: t.name, x: (t.costLow + t.costHigh) / 2, y: t.permanence }))} fill={T.amber} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'CDR Registry' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setTechFilter('All')} style={{ ...tabBtn('All'), background: techFilter === 'All' ? T.teal : T.surfaceH, color: techFilter === 'All' ? '#fff' : T.textSec }}>All</button>
            {CDR_TECHNOLOGIES.slice(0, 6).map(t => (
              <button key={t.id} onClick={() => setTechFilter(t.id)} style={{ ...tabBtn(t.id), background: techFilter === t.id ? T.teal : T.surfaceH, color: techFilter === t.id ? '#fff' : T.textSec, fontSize: 11 }}>{t.name.split('(')[0].trim().split(' ').slice(0, 3).join(' ')}</button>
            ))}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  {['Project', 'Technology', 'Region', 'Capacity (kt/yr)', 'Cost ($/t)', 'Standard', 'Quality', 'Status', 'Vintage', 'Buyer'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.textSec, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? T.surface : 'transparent' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{p.name}</td>
                    <td style={{ padding: '10px 12px', color: T.textSec, fontSize: 11 }}>{p.techName}</td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{p.region}</td>
                    <td style={{ padding: '10px 12px', fontFamily: T.mono }}>{p.capacityKtY}</td>
                    <td style={{ padding: '10px 12px', fontFamily: T.mono, color: T.gold }}>${p.costPerTon}</td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: T.teal }}>{p.standard}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: p.qualityScore >= 9 ? T.green : T.amber }}>{p.qualityScore}</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: p.status === 'Operational' ? T.green : p.status === 'Active' ? T.teal : T.amber, fontSize: 11, fontWeight: 600 }}>{p.status}</span></td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{p.vintage}</td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{p.buyerType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Technology Assessment' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {categories.map(c => <button key={c} onClick={() => setCatFilter(c)} style={{ ...tabBtn(c), background: catFilter === c ? T.teal : T.surfaceH, color: catFilter === c ? '#fff' : T.textSec }}>{c}</button>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
            {filteredTech.map(t => (
              <div key={t.id} style={{ background: T.surface, borderRadius: 10, padding: 18, borderTop: `3px solid ${catColor(t.category)}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{t.name}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: catColor(t.category), background: `${catColor(t.category)}20`, padding: '2px 8px', borderRadius: 4 }}>{t.category}</span>
                  <span style={{ fontSize: 11, color: matColor(t.maturity), background: `${matColor(t.maturity)}20`, padding: '2px 8px', borderRadius: 4 }}>{t.maturity}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[['Cost Range', `$${t.costLow}–$${t.costHigh}/t`], ['2030 Potential', `${t.potential2030} GtCO₂/yr`], ['2050 Potential', `${t.potential2050} GtCO₂/yr`], ['Permanence', `${t.permanence.toLocaleString()} yrs`], ['Additionality', t.additionality], ['Energy', t.energy]].map(([k, v]) => (
                    <div key={k}><div style={{ fontSize: 10, color: T.textSec }}>{k}</div><div style={{ fontSize: 12, fontWeight: 600 }}>{v}</div></div>
                  ))}
                </div>
                <div style={{ marginTop: 12, fontSize: 11, color: T.textSec }}>Key players: {t.companies.slice(0, 3).join(' · ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Market Outlook' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Total CDR Market Demand Growth</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={MARKET_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" stroke={T.textSec} fontSize={11} />
                <YAxis stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
                <Line type="monotone" dataKey="Total Demand" stroke={T.navy} strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Nature-Based" stroke={T.sage} strokeWidth={2} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="Engineered CDR" stroke={T.teal} strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Cost Reduction Trajectory ($/tCO₂)</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={['2024', '2026', '2028', '2030', '2035', '2040', '2050'].map((yr, i) => ({
                year: yr,
                'DACCS': Math.max(100, 450 - i * 45 + sr(i) * 20),
                'BECCS': Math.max(60, 150 - i * 12 + sr(i + 7) * 10),
                'Biochar': Math.max(40, 120 - i * 10 + sr(i + 14) * 8),
                'Enhanced Weathering': Math.max(30, 130 - i * 14 + sr(i + 21) * 12),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" stroke={T.textSec} fontSize={11} />
                <YAxis stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
                {['DACCS', 'BECCS', 'Biochar', 'Enhanced Weathering'].map((k, i) => (
                  <Line key={k} type="monotone" dataKey={k} stroke={[T.navy, T.sage, T.gold, T.teal][i]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Cost Curves' && (
        <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Marginal Abatement Cost Curve — CDR Technologies</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={[...COST_CURVE].sort((a, b) => a.midCost - b.midCost)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" stroke={T.textSec} fontSize={9} angle={-30} textAnchor="end" height={60} />
              <YAxis stroke={T.textSec} fontSize={11} label={{ value: '$/tCO₂', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
              <Bar dataKey="midCost" fill={T.amber} name="Mid Cost ($/tCO₂)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 'Quality Standards' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { name: 'Puro.earth', focus: 'Engineered CDR', criteria: ['Quantification', 'Additionality', 'Permanence (≥50yr)', 'Leakage', 'MRV Protocol'], strength: 'Best for biochar/DACCS', color: T.navy },
              { name: 'Verra (VCS + CCB)', focus: 'Nature-Based', criteria: ['Third-party verification', 'Buffer pool', 'Co-benefits', 'SD VISta', 'REDD+ compatible'], strength: 'Largest voluntary registry', color: T.sage },
              { name: 'Gold Standard', focus: 'Mixed CDR', criteria: ['SDG impact scoring', 'Impact quantification', 'Third-party audit', 'Registry transparency', 'Social safeguards'], strength: 'SDG alignment leader', color: T.gold },
              { name: 'Plan Vivo', focus: 'Community NbS', criteria: ['Community ownership', 'Co-design', 'MRV light', 'Buffer pool', 'Smallholder focus'], strength: 'Community & equity focus', color: T.teal },
              { name: 'SBTi FLAG', focus: 'Land Sector', criteria: ['AFOLU guidance', 'IPCC AR6 aligned', 'Non-permanence risk', 'Scope 3 integration', 'Land use change'], strength: 'Corporate land-use targets', color: T.amber },
              { name: 'ISO 14064-2', focus: 'Engineered', criteria: ['GHG project standard', 'Baseline setting', 'Leakage calculation', 'Monitoring plan', 'Third-party assurance'], strength: 'International ISO standard', color: T.red },
            ].map(s => (
              <div key={s.name} style={{ background: T.surface, borderRadius: 10, padding: 18, borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 10 }}>{s.focus}</div>
                {s.criteria.map((c, i) => <div key={i} style={{ fontSize: 12, color: T.textSec, padding: '3px 0', borderBottom: `1px solid ${T.border}` }}>✓ {c}</div>)}
                <div style={{ fontSize: 11, color: s.color, marginTop: 10, fontStyle: 'italic' }}>{s.strength}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Portfolio' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Project Pipeline by Technology Type</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={CDR_TECHNOLOGIES.map(t => ({ name: t.name.split(' ')[0], count: PROJECTS.filter(p => p.technology === t.id).length, capacity: +PROJECTS.filter(p => p.technology === t.id).reduce((s, p) => s + p.capacityKtY, 0).toFixed(0) })).filter(d => d.count > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" stroke={T.textSec} fontSize={10} angle={-20} textAnchor="end" height={45} />
                <YAxis stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="count" fill={T.navy} name="Projects" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Quality Score Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[{ range: '7.0–7.5', count: PROJECTS.filter(p => p.qualityScore >= 7 && p.qualityScore < 7.5).length }, { range: '7.5–8.0', count: PROJECTS.filter(p => p.qualityScore >= 7.5 && p.qualityScore < 8).length }, { range: '8.0–8.5', count: PROJECTS.filter(p => p.qualityScore >= 8 && p.qualityScore < 8.5).length }, { range: '8.5–9.0', count: PROJECTS.filter(p => p.qualityScore >= 8.5 && p.qualityScore < 9).length }, { range: '9.0+', count: PROJECTS.filter(p => p.qualityScore >= 9).length }]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" stroke={T.textSec} fontSize={11} />
                <YAxis stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="count" fill={T.sage} name="Projects" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
