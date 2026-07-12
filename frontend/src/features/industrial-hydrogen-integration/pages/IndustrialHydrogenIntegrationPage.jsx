import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E', sub: '#6B7280', indigo: '#4F46E5', green: '#065F46', red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', sky: '#0369A1', steel: '#374151' };
const TABS = ['Sector Overview', 'H₂ Demand by Industry', 'Project Economics', 'Infrastructure Finance', 'Policy & Subsidies', 'Market Intelligence'];

const SECTORS = [
  { id: 'Steel', name: 'Green Steel (DRI-EAF)', h2Demand2030: 32, h2Demand2050: 108, h2Price: 4.5, ci: 0.05, capex: 950, abatement: 94, projects: 18 },
  { id: 'Chemicals', name: 'Green Ammonia / Chemicals', h2Demand2030: 18, h2Demand2050: 55, h2Price: 3.8, ci: 0.25, capex: 720, abatement: 82, projects: 24 },
  { id: 'Refining', name: 'Refinery Decarbonization', h2Demand2030: 12, h2Demand2050: 28, h2Price: 3.2, ci: 0.40, capex: 480, abatement: 65, projects: 31 },
  { id: 'Cement', name: 'Cement Process Heat', h2Demand2030: 8, h2Demand2050: 22, h2Price: 5.2, ci: 0.65, capex: 380, abatement: 40, projects: 9 },
  { id: 'Glass', name: 'Float Glass Firing', h2Demand2030: 3, h2Demand2050: 9, h2Price: 4.8, ci: 0.20, capex: 250, abatement: 55, projects: 6 },
  { id: 'Ceramics', name: 'Ceramics / High-Temp', h2Demand2030: 2, h2Demand2050: 7, h2Price: 5.5, ci: 0.28, capex: 210, abatement: 48, projects: 4 },
];

const PROJECTS = Array.from({ length: 20 }, (_, i) => {
  const sec = SECTORS[Math.floor(sr(i * 7 + 1) * SECTORS.length)];
  const capMt = parseFloat((0.2 + sr(i * 11 + 2) * 2.8).toFixed(1));
  const country = ['Germany', 'Netherlands', 'USA', 'Japan', 'Sweden', 'UK', 'Australia', 'South Korea'][Math.floor(sr(i * 13 + 3) * 8)];
  const status = ['Operating', 'Construction', 'FID', 'Engineering', 'Feasibility'][Math.floor(sr(i * 17 + 4) * 5)];
  const irr = parseFloat((5 + sr(i * 19 + 5) * 10).toFixed(1));
  const dscr = parseFloat((1.15 + sr(i * 23 + 6) * 0.75).toFixed(2));
  const h2Need = parseFloat((capMt * (8 + sr(i * 29 + 7) * 15)).toFixed(0));
  return { id: i + 1, name: `${country.substring(0, 3)}-${sec.id}-PF${i + 1}`, sector: sec.id, country, status, capMt, irr, dscr, h2Need, capex: Math.round(sec.capex * capMt) };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: '1 1 150px' }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);
const Pill = ({ v }) => {
  const c = { Operating: T.green, Construction: T.sky, FID: T.indigo, Engineering: T.amber, Feasibility: T.sub }[v] || T.sub;
  return <span style={{ background: c, color: '#fff', fontSize: 10, borderRadius: 12, padding: '2px 8px', fontWeight: 600 }}>{v}</span>;
};

export default function IndustrialHydrogenIntegrationPage() {
  const [tab, setTab] = useState(0);
  const [selSector, setSelSector] = useState('ALL');
  const [h2Price, setH2Price] = useState(4.5);
  const [carbonPrice, setCarbonPrice] = useState(80);

  const filtered = useMemo(() => PROJECTS.filter(p => selSector === 'ALL' || p.sector === selSector), [selSector]);
  const avgIrr = useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.irr, 0) / filtered.length).toFixed(1) : '—', [filtered]);
  const totalH2Need = useMemo(() => filtered.reduce((s, p) => s + p.h2Need, 0), [filtered]);

  const demandChart = SECTORS.map(s => ({ name: s.id, demand2030: s.h2Demand2030, demand2050: s.h2Demand2050 }));

  const economicsTable = useMemo(() => SECTORS.map(s => {
    const carbonSaving = s.abatement / 100 * 1.85 * carbonPrice;
    const netCost = s.capex * 0.12 + h2Price * s.h2Demand2030 - carbonSaving;
    return { ...s, carbonSaving: parseFloat(carbonSaving.toFixed(1)), netCost: parseFloat(netCost.toFixed(1)) };
  }), [h2Price, carbonPrice]);

  const infraCosts = [
    { component: 'Electrolyzer (PEM)', cost: 600, unit: '$/kW', scale2030: 350, scale2050: 120 },
    { component: 'H₂ Pipeline (new)', cost: 2800, unit: '$/km', scale2030: 2200, scale2050: 1800 },
    { component: 'H₂ Storage (salt)', cost: 0.8, unit: '$/kWh', scale2030: 0.5, scale2050: 0.3 },
    { component: 'DRI Shaft Furnace', cost: 580, unit: '$/t cap', scale2030: 520, scale2050: 440 },
    { component: 'EAF (100t)', cost: 380, unit: '$/t cap', scale2030: 340, scale2050: 290 },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      <div style={{ background: '#0C1A2E', padding: '20px 32px', borderBottom: `3px solid ${T.steel}` }}>
        <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>EP-EG2 · Green Steel Suite</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>Industrial Hydrogen Integration Finance</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Steel · Chemicals · Refining · Cement · 6 Sectors · 20 Projects · CAPEX/IRR/DSCR</div>
      </div>
      <div style={{ background: '#0C1A2E', display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid #1E3A5F` }}>
        {TABS.map((t, i) => <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 18px', fontSize: 12, fontWeight: tab === i ? 700 : 400, color: tab === i ? '#94A3B8' : '#6B7280', background: 'none', border: 'none', borderBottom: tab === i ? `2px solid #94A3B8` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>)}
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Projects Tracked" value={filtered.length} sub={`${totalH2Need} kt H₂ needed`} color={T.sky} />
          <KpiCard label="Avg Project IRR" value={`${avgIrr}%`} sub="Industrial H₂ projects" color={T.green} />
          <KpiCard label="2030 H₂ Demand" value="75 Mt" sub="All hard-to-abate sectors" color={T.indigo} />
          <KpiCard label="Steel H₂ Need" value="32 Mt" sub="2030 green steel target" color={T.amber} />
          <KpiCard label="H₂ Price Now" value={`$${h2Price}/kg`} sub="Green electrolytic" color={T.teal} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <select value={selSector} onChange={e => setSelSector(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, background: T.card, color: T.text }}>
            <option value="ALL">All Sectors</option>
            {SECTORS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>H₂ Price: ${h2Price}/kg</span><input type="range" min={1} max={10} step={0.5} value={h2Price} onChange={e => setH2Price(+e.target.value)} style={{ width: 100 }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>Carbon: ${carbonPrice}/t</span><input type="range" min={20} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 100 }} /></div>
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>H₂ Demand by Sector (Mt/yr)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={demandChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" Mt" />
                  <Tooltip formatter={v => [`${v} Mt/yr`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="demand2030" name="2030 Demand" fill={T.sky} />
                  <Bar dataKey="demand2050" name="2050 Demand" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Sector Overview</div>
              {SECTORS.map(s => (
                <div key={s.id} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{s.name}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T.sub, marginTop: 3 }}>
                    <span>2030: {s.h2Demand2030} Mt H₂</span>
                    <span>Abatement: {s.abatement}%</span>
                    <span style={{ color: T.amber }}>H₂ req: ${s.h2Price}/kg</span>
                    <span>{s.projects} projects</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>H₂ Demand Growth to 2050 (Mt/yr)</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={[2024, 2027, 2030, 2035, 2040, 2050].map(yr => ({
                  year: yr,
                  Steel: Math.round(2 + (yr - 2024) * (108 - 2) / 26),
                  Chemicals: Math.round(5 + (yr - 2024) * (55 - 5) / 26),
                  Refining: Math.round(3 + (yr - 2024) * (28 - 3) / 26),
                  Cement: Math.round(0 + (yr - 2024) * (22 - 0) / 26),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" Mt" />
                  <Tooltip formatter={v => [`${v} Mt`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="Steel" stackId="a" fill={T.steel} stroke={T.steel} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="Chemicals" stackId="a" fill={T.sky} stroke={T.sky} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="Refining" stackId="a" fill={T.amber} stroke={T.amber} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="Cement" stackId="a" fill={T.green} stroke={T.green} fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Abatement Cost ($/tCO₂) by Sector</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={economicsTable.map(s => ({ name: s.id, abatement: Math.round(s.capex * 0.1 / (s.abatement / 100 * 1.85 * 1e3) * 1e6) }))} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit=" $/t" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={v => [`$${v}/tCO₂`, 'Abatement Cost']} />
                  <Bar dataKey="abatement" fill={T.sky} radius={[0, 4, 4, 0]} />
                  <ReferenceLine x={carbonPrice} stroke={T.amber} strokeDasharray="4 2" label={{ value: `Carbon $${carbonPrice}`, fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Project Economics Table</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: '#F8F7F4' }}>
                    {['Project', 'Sector', 'Country', 'Cap (Mt)', 'H₂ Need (kt)', 'CAPEX $M', 'IRR %', 'DSCR', 'Status'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filtered.slice(0, 14).map((p, i) => (
                      <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 ? '#FAFAF7' : T.card }}>
                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>{p.name}</td>
                        <td style={{ padding: '8px 12px', color: T.sub }}>{p.sector}</td>
                        <td style={{ padding: '8px 12px' }}>{p.country}</td>
                        <td style={{ padding: '8px 12px' }}>{p.capMt}</td>
                        <td style={{ padding: '8px 12px' }}>{p.h2Need}</td>
                        <td style={{ padding: '8px 12px' }}>${p.capex}M</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: p.irr >= 10 ? T.green : T.amber }}>{p.irr}%</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: p.dscr >= 1.30 ? T.green : T.amber }}>{p.dscr}</td>
                        <td style={{ padding: '8px 12px' }}><Pill v={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Infrastructure Cost Benchmarks</div>
              {infraCosts.map(c => (
                <div key={c.component} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{c.component}</div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 11, color: T.sub, marginTop: 3 }}>
                    <span>Today: <strong style={{ color: T.amber }}>{c.cost} {c.unit}</strong></span>
                    <span>2030: <strong style={{ color: T.sky }}>{c.scale2030} {c.unit}</strong></span>
                    <span>2050: <strong style={{ color: T.green }}>{c.scale2050} {c.unit}</strong></span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Electrolyzer CAPEX Learning Curve</div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={Array.from({ length: 10 }, (_, i) => ({ year: 2024 + i, pem: Math.round(600 * Math.pow(0.88, i)), ael: Math.round(500 * Math.pow(0.90, i)), soec: Math.round(900 * Math.pow(0.85, i)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$/kW" />
                  <Tooltip formatter={v => [`$${v}/kW`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="pem" name="PEM" stroke={T.sky} strokeWidth={2} dot={false} />
                  <Line dataKey="ael" name="AEL" stroke={T.green} strokeWidth={2} dot={false} />
                  <Line dataKey="soec" name="SOEC" stroke={T.amber} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Key Policy Support Programs</div>
              {[{ prog: 'EU H₂ Bank / Innovation Fund', value: '€800M auction 2024', focus: 'All hard-to-abate' }, { prog: 'US DOE H₂ Hubs ($7B)', value: '$7B over 5 years', focus: 'Industrial clusters' }, { prog: 'Germany H₂-ImportDeal', value: '€2B/yr by 2030', focus: 'Steel + chemicals' }, { prog: 'Japan GIF Steel', value: '¥200B', focus: 'DRI-EAF demonstration' }, { prog: 'UK Industrial Decarbonization', value: '£1B', focus: 'Net zero industrial clusters' }, { prog: 'EU CBAM (Steel)', value: 'Phased 2024–2026', focus: 'Import carbon cost' }].map(p => (
                <div key={p.prog} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{p.prog}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T.sub, marginTop: 3 }}>
                    <span style={{ color: T.green, fontWeight: 600 }}>{p.value}</span><span>{p.focus}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Policy Value by Sector ($/tCO₂ equiv.)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={SECTORS.map(s => ({ name: s.id, direct: Math.round(carbonPrice * 0.8), indirect: Math.round(carbonPrice * 0.3), grant: Math.round(s.capex * 0.05) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="direct" name="Carbon Price" stackId="a" fill={T.sky} />
                  <Bar dataKey="indirect" name="CBAM Relief" stackId="a" fill={T.teal} />
                  <Bar dataKey="grant" name="Grant/Subsidy" stackId="a" fill={T.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Industrial H₂ Investment Needed ($B/yr)</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={[2025, 2027, 2030, 2033, 2035, 2040].map(yr => ({ year: yr, steel: Math.round(12 + (yr - 2025) * 8), chem: Math.round(8 + (yr - 2025) * 5), refine: Math.round(5 + (yr - 2025) * 2), other: Math.round(3 + (yr - 2025) * 3) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$B" />
                  <Tooltip formatter={v => [`$${v}B`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="steel" name="Steel" stackId="a" fill={T.steel} stroke={T.steel} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="chem" name="Chemicals" stackId="a" fill={T.sky} stroke={T.sky} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="refine" name="Refining" stackId="a" fill={T.amber} stroke={T.amber} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="other" name="Other" stackId="a" fill={T.green} stroke={T.green} fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Market Intelligence</div>
              {[['Industrial H₂ demand 2024', '95 Mt/yr (grey)'], ['Green H₂ share 2024', '<1%'], ['Net-zero target (IEA NZE)', '500 Mt H₂/yr by 2050'], ['H₂ price green 2024', '$4–6/kg (BNEF)'], ['H₂ price target 2030', '$2/kg (US DOE)'], ['Steel sector share', '35% of industrial H₂ need'], ['Electrolyzer orders 2024', '5 GW commissioned'], ['HYBRIT (Sweden)', 'First fossil-free steel 2021'], ['H₂ Backbone EU', '53,000 km by 2040'], ['CBAM steel phase-in', '2024–2025 reporting; 2026 financial']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 600, maxWidth: '50%', textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
