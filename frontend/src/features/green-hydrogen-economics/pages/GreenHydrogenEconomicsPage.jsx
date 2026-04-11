import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, AreaChart, Area, Legend, Cell,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const ROUTES = ['Green', 'Blue', 'Grey', 'Turquoise', 'Pink', 'Yellow'];
const COUNTRIES_H2 = ['USA', 'Germany', 'Australia', 'Japan', 'Saudi Arabia', 'Chile', 'UK', 'Netherlands', 'China', 'Canada'];
const DEMAND_SECTORS = ['Transport', 'Industry', 'Power', 'Export'];
const RENEW_SOURCES = ['Solar', 'Wind', 'Hydro', 'Mixed'];

const ROUTE_COLORS = [T.green, T.blue, '#6b7280', '#7c3aed', '#ec4899', '#f59e0b'];

const PROJECTS = Array.from({ length: 50 }, (_, i) => {
  const route = ROUTES[Math.floor(sr(i * 7) * ROUTES.length)];
  const country = COUNTRIES_H2[Math.floor(sr(i * 11) * COUNTRIES_H2.length)];
  const capacity = Math.round(5 + sr(i * 13) * 495);
  const lcoehBase = { Green: 3.5, Blue: 1.8, Grey: 1.2, Turquoise: 2.2, Pink: 2.8, Yellow: 4.0 }[route];
  const lcoh = parseFloat((lcoehBase + sr(i * 17) * 2.5 - 1.0).toFixed(2));
  const capex = Math.round(50 + sr(i * 19) * 2950);
  const electrolyzerCapacity = route === 'Green' ? Math.round(10 + sr(i * 23) * 490) : 0;
  const renewableSource = route === 'Green' ? RENEW_SOURCES[Math.floor(sr(i * 29) * RENEW_SOURCES.length)] : 'N/A';
  const co2Intensity = { Green: 0.05, Blue: 1.8, Grey: 9.0, Turquoise: 0.8, Pink: 0.1, Yellow: 0.5 }[route] * (0.8 + sr(i * 31) * 0.4);
  const subsidyEligible = sr(i * 37) > 0.4;
  const onlineYear = 2024 + Math.floor(sr(i * 41) * 7);
  const demandSector = DEMAND_SECTORS[Math.floor(sr(i * 43) * DEMAND_SECTORS.length)];
  const projNames = ['HydroPure', 'GreenH2', 'BlueStar', 'TurqWave', 'PinkAtom', 'SolarH2', 'WindH2', 'HydroGen',
    'CleanH2', 'FutureH2', 'ProtonX', 'H2Flow', 'NexHydro', 'AquaH2', 'PolarH2', 'SunH2', 'WindGen'];
  const name = `${projNames[i % projNames.length]}-${String(i + 1).padStart(2, '0')} ${country.substring(0, 3).toUpperCase()}`;
  return { id: i + 1, name, route, country, capacity, lcoh, capex, electrolyzerCapacity, renewableSource, co2Intensity: parseFloat(co2Intensity.toFixed(2)), subsidyEligible, onlineYear, demandSector };
});

const BUILDOUT_DATA = [2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr, i) => ({
  year: yr,
  green: Math.round(20 + sr(i * 7) * 40 + i * 60),
  blue: Math.round(30 + sr(i * 11) * 30 + i * 20),
  total: 0,
})).map(d => ({ ...d, total: d.green + d.blue }));

const TABS = [
  'Project Overview', 'Production Economics', 'LCOH Curves', 'Electrolyzer Market',
  'CO₂ Intensity', 'Demand Mapping', 'Policy & Subsidies', 'Investment Pipeline',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px', flex: 1, minWidth: 180 }}>
    <div style={{ fontSize: 12, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function GreenHydrogenEconomicsPage() {
  const [tab, setTab] = useState(0);
  const [routeFilter, setRouteFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [demandFilter, setDemandFilter] = useState('All');
  const [elecPrice, setElecPrice] = useState(50);
  const [carbonPrice, setCarbonPrice] = useState(80);

  const filtered = useMemo(() => PROJECTS.filter(p =>
    (routeFilter === 'All' || p.route === routeFilter) &&
    (countryFilter === 'All' || p.country === countryFilter) &&
    (demandFilter === 'All' || p.demandSector === demandFilter)
  ), [routeFilter, countryFilter, demandFilter]);

  const totalCapacity = filtered.reduce((s, p) => s + p.capacity, 0);
  const greenProjects = filtered.filter(p => p.route === 'Green');
  const avgLcohGreen = greenProjects.length ? (greenProjects.reduce((s, p) => s + p.lcoh, 0) / greenProjects.length).toFixed(2) : 'N/A';
  const totalCapex = filtered.reduce((s, p) => s + p.capex, 0);
  const pctSubsidy = filtered.length ? ((filtered.filter(p => p.subsidyEligible).length / filtered.length) * 100).toFixed(0) : '0';

  // LCOH adjusted for electricity price
  const adjustedLcoh = ROUTES.map((r, ri) => {
    const base = { Green: 3.5, Blue: 1.8, Grey: 1.2, Turquoise: 2.2, Pink: 2.8, Yellow: 4.0 }[r];
    const elecAdj = r === 'Green' ? (elecPrice - 50) * 0.015 : r === 'Pink' ? (elecPrice - 50) * 0.008 : 0;
    const carbonAdj = ['Green', 'Pink'].includes(r) ? 0 : (carbonPrice / 100) * { Blue: 0.5, Grey: 2.5, Turquoise: 0.3, Yellow: 0.2 }[r];
    return { route: r, lcoh: parseFloat((base + elecAdj + carbonAdj).toFixed(2)) };
  });

  const co2Data = ROUTES.map(r => ({
    route: r,
    avgCo2: (() => {
      const rp = filtered.filter(p => p.route === r);
      return rp.length ? parseFloat((rp.reduce((s, p) => s + p.co2Intensity, 0) / rp.length).toFixed(2)) : 0;
    })(),
    count: filtered.filter(p => p.route === r).length,
  }));

  const demandData = DEMAND_SECTORS.map(ds => ({
    sector: ds,
    count: filtered.filter(p => p.demandSector === ds).length,
    capacity: filtered.filter(p => p.demandSector === ds).reduce((s, p) => s + p.capacity, 0),
  }));

  const investByYear = [2024, 2025, 2026, 2027, 2028, 2029, 2030].map(yr => ({
    year: yr,
    capex: filtered.filter(p => p.onlineYear === yr).reduce((s, p) => s + p.capex, 0),
    count: filtered.filter(p => p.onlineYear === yr).length,
  }));

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', padding: '28px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>⚡ Green Hydrogen Economics</span>
          <span style={{ fontSize: 11, background: T.green, color: '#fff', borderRadius: 4, padding: '2px 8px', fontWeight: 700 }}>EP-DF2</span>
        </div>
        <div style={{ fontSize: 13, color: T.textSec }}>50 hydrogen projects · 6 production routes · LCOH curves, electrolyzer markets & demand mapping</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
        {[
          { label: 'Route', value: routeFilter, setter: setRouteFilter, opts: ['All', ...ROUTES] },
          { label: 'Country', value: countryFilter, setter: setCountryFilter, opts: ['All', ...COUNTRIES_H2] },
          { label: 'Demand Sector', value: demandFilter, setter: setDemandFilter, opts: ['All', ...DEMAND_SECTORS] },
        ].map(({ label, value, setter, opts }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>{label}</span>
            <select value={value} onChange={e => setter(e.target.value)}
              style={{ fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', background: T.bg, color: T.textPri }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Electricity: ${elecPrice}/MWh</span>
          <input type="range" min={20} max={120} value={elecPrice} onChange={e => setElecPrice(+e.target.value)} style={{ width: 100 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Carbon: ${carbonPrice}/tCO₂</span>
          <input type="range" min={0} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 100 }} />
        </div>
        <span style={{ fontSize: 12, color: T.textSec, alignSelf: 'center' }}>{filtered.length} projects</span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        <KpiCard label="Total Capacity Pipeline" value={`${totalCapacity.toLocaleString()} ktH₂/yr`} sub="filtered projects" color={T.green} />
        <KpiCard label="Avg LCOH (Green)" value={`$${avgLcohGreen}/kgH₂`} sub="levelised cost of hydrogen" color={T.blue} />
        <KpiCard label="Total Capex" value={`$${(totalCapex / 1000).toFixed(1)}Bn`} sub="capital expenditure" color={T.indigo} />
        <KpiCard label="Subsidy Eligible" value={`${pctSubsidy}%`} sub="of filtered projects" color={T.amber} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: '7px 14px', borderRadius: 7, border: `1px solid ${tab === i ? T.green : T.border}`, background: tab === i ? T.green : T.card, color: tab === i ? '#fff' : T.textSec, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
        {tab === 0 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Project Overview — Hydrogen Pipeline</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Project', 'Route', 'Country', 'Capacity (ktH₂/yr)', 'LCOH ($/kgH₂)', 'Capex ($M)', 'CO₂ Int.', 'Online', 'Demand'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 20).map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '7px 10px', color: T.navy, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ background: ROUTE_COLORS[ROUTES.indexOf(p.route)] + '22', color: ROUTE_COLORS[ROUTES.indexOf(p.route)], borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 700 }}>{p.route}</span>
                    </td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{p.country}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{p.capacity}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: p.lcoh < 2 ? T.green : p.lcoh < 4 ? T.amber : T.red }}>${p.lcoh}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>${p.capex.toLocaleString()}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: p.co2Intensity < 1 ? T.green : T.amber }}>{p.co2Intensity}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{p.onlineYear}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{p.demandSector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 1 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Production Economics — Capacity vs Capex</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>Electricity: ${elecPrice}/MWh · Carbon price: ${carbonPrice}/tCO₂ — LCOH adjusted dynamically</div>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Capacity (ktH₂/yr)" label={{ value: 'Capacity (ktH₂/yr)', position: 'bottom', fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis dataKey="y" name="Capex ($M)" label={{ value: 'Capex ($M)', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip />
                <Scatter data={filtered.map(p => ({ x: p.capacity, y: p.capex, name: p.name, route: p.route }))} fill={T.green} fillOpacity={0.65} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 8 }}>LCOH Curves — By Production Route (Price-Adjusted)</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>Sliders above adjust electricity & carbon price impact on LCOH</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={adjustedLcoh} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="route" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: '$/kgH₂', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                <Tooltip formatter={(v) => [`$${v}/kgH₂`, 'LCOH']} />
                <Bar dataKey="lcoh" radius={[4, 4, 0, 0]}>
                  {adjustedLcoh.map((_, idx) => <Cell key={idx} fill={ROUTE_COLORS[idx % ROUTE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Electrolyzer Market — Green Hydrogen Projects</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              {RENEW_SOURCES.map(rs => {
                const rp = greenProjects.filter(p => p.renewableSource === rs);
                return (
                  <div key={rs} style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{rs}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: T.green, fontFamily: T.fontMono }}>{rp.length}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>Avg electrolyzer: {rp.length ? Math.round(rp.reduce((s, p) => s + p.electrolyzerCapacity, 0) / rp.length) : 0} MW</div>
                  </div>
                );
              })}
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={RENEW_SOURCES.map(rs => ({ source: rs, capacity: greenProjects.filter(p => p.renewableSource === rs).reduce((s, p) => s + p.electrolyzerCapacity, 0) }))}
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="source" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip formatter={(v) => [`${v} MW`, 'Electrolyzer Capacity']} />
                <Bar dataKey="capacity" fill={T.teal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>CO₂ Intensity by Production Route</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={co2Data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="route" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'kgCO₂/kgH₂', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                <Tooltip formatter={(v) => [`${v} kgCO₂/kgH₂`, 'CO₂ Intensity']} />
                <Bar dataKey="avgCo2" radius={[4, 4, 0, 0]}>
                  {co2Data.map((d, idx) => <Cell key={idx} fill={d.avgCo2 < 1 ? T.green : d.avgCo2 < 4 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 5 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Demand Mapping — Projects by End-Use Sector</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={demandData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="count" name="Projects" fill={T.blue} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="capacity" name="Capacity (ktH₂/yr)" fill={T.green} radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Policy & Subsidies — Eligibility Analysis</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              {[
                { label: 'Subsidy Eligible', count: filtered.filter(p => p.subsidyEligible).length, color: T.green },
                { label: 'Not Eligible', count: filtered.filter(p => !p.subsidyEligible).length, color: T.amber },
              ].map(({ label, count, color }) => (
                <div key={label} style={{ background: color + '18', border: `1px solid ${color}44`, borderRadius: 10, padding: '18px 24px', flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: T.fontMono }}>{count}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>projects ({filtered.length ? ((count / filtered.length) * 100).toFixed(0) : 0}%)</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, fontSize: 13, color: T.textSec }}>
              <strong style={{ color: T.navy }}>Key Policy Drivers:</strong> US IRA Hydrogen Production Tax Credit ($3/kg clean H₂) · EU H2 Strategy 10Mt domestic / 10Mt import by 2030 · UK Net Zero Hydrogen Fund · Japan Green Innovation Fund ¥200Bn · Australia Hydrogen Headstart Programme AUD$2Bn
            </div>
          </div>
        )}

        {tab === 7 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Investment Pipeline — Capex Build-Out by Year</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={BUILDOUT_DATA} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip />
                <Area type="monotone" dataKey="green" name="Green H₂" stroke={T.green} fill={T.green + '33'} stackId="a" />
                <Area type="monotone" dataKey="blue" name="Blue H₂" stroke={T.blue} fill={T.blue + '33'} stackId="a" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Project Capex by Online Year (Filtered)</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={investByYear} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip formatter={(v) => [`$${v.toLocaleString()}M`, 'Capex']} />
                  <Bar dataKey="capex" fill={T.indigo} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
