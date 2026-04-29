import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#F7F6F2', card: '#FFFFFF', border: '#E5E2D9',
  text: '#1A1A2E', sub: '#6B7280', accent: '#B8860B',
  green: '#065F46', red: '#991B1B', blue: '#1E40AF',
  teal: '#0F766E', amber: '#92400E', navy: '#0F172A',
  indigo: '#4F46E5', gold: '#C59A1E', sage: '#4A7C59',
  font: "'DM Sans',system-ui,sans-serif"
};

const TERMINALS = [
  { terminal: 'Port of Dampier', country: 'Australia', storageCapacity_kt: 80, tankType: 'refrigerated', crackerCapacity_tpd: 450, shippingVesselClass: 'VLGC', routeOrigin: 'Dampier', routeDest: 'Yokohama', freightCost_usd_t: 65, totalChainCost_usd_t: 145 },
  { terminal: 'Port Bonython', country: 'Australia', storageCapacity_kt: 50, tankType: 'refrigerated', crackerCapacity_tpd: 280, shippingVesselClass: 'MGC', routeOrigin: 'Bonython', routeDest: 'Ulsan', freightCost_usd_t: 72, totalChainCost_usd_t: 158 },
  { terminal: 'Antofagasta Export', country: 'Chile', storageCapacity_kt: 35, tankType: 'refrigerated', crackerCapacity_tpd: 200, shippingVesselClass: 'VLGC', routeOrigin: 'Antofagasta', routeDest: 'Rotterdam', freightCost_usd_t: 95, totalChainCost_usd_t: 185 },
  { terminal: 'Sines Terminal', country: 'Portugal', storageCapacity_kt: 45, tankType: 'refrigerated', crackerCapacity_tpd: 250, shippingVesselClass: 'MGC', routeOrigin: 'Sines', routeDest: 'Hamburg', freightCost_usd_t: 42, totalChainCost_usd_t: 110 },
  { terminal: 'Sohar Industrial', country: 'Oman', storageCapacity_kt: 60, tankType: 'refrigerated', crackerCapacity_tpd: 340, shippingVesselClass: 'VLGC', routeOrigin: 'Sohar', routeDest: 'Busan', freightCost_usd_t: 68, totalChainCost_usd_t: 148 },
  { terminal: 'Jeddah Islamic Port', country: 'Saudi Arabia', storageCapacity_kt: 90, tankType: 'refrigerated', crackerCapacity_tpd: 500, shippingVesselClass: 'VLGC', routeOrigin: 'Jeddah', routeDest: 'Tokyo', freightCost_usd_t: 70, totalChainCost_usd_t: 150 },
  { terminal: 'Tanger Med', country: 'Morocco', storageCapacity_kt: 30, tankType: 'pressurized', crackerCapacity_tpd: 170, shippingVesselClass: 'LGC', routeOrigin: 'Tanger', routeDest: 'Bremerhaven', freightCost_usd_t: 55, totalChainCost_usd_t: 128 },
  { terminal: 'Walvis Bay', country: 'Namibia', storageCapacity_kt: 25, tankType: 'pressurized', crackerCapacity_tpd: 140, shippingVesselClass: 'MGC', routeOrigin: 'Walvis Bay', routeDest: 'Antwerp', freightCost_usd_t: 88, totalChainCost_usd_t: 175 },
  { terminal: 'Port Hedland', country: 'Australia', storageCapacity_kt: 120, tankType: 'refrigerated', crackerCapacity_tpd: 680, shippingVesselClass: 'VLGC', routeOrigin: 'Port Hedland', routeDest: 'Osaka', freightCost_usd_t: 62, totalChainCost_usd_t: 140 },
  { terminal: 'Mesaieed', country: 'Qatar', storageCapacity_kt: 75, tankType: 'refrigerated', crackerCapacity_tpd: 420, shippingVesselClass: 'VLGC', routeOrigin: 'Mesaieed', routeDest: 'Incheon', freightCost_usd_t: 60, totalChainCost_usd_t: 138 },
  { terminal: 'Pipavav Port', country: 'India', storageCapacity_kt: 20, tankType: 'pressurized', crackerCapacity_tpd: 110, shippingVesselClass: 'LGC', routeOrigin: 'Pipavav', routeDest: 'Mundra', freightCost_usd_t: 28, totalChainCost_usd_t: 78 },
  { terminal: 'Brunei Ammonia', country: 'Brunei', storageCapacity_kt: 40, tankType: 'refrigerated', crackerCapacity_tpd: 220, shippingVesselClass: 'MGC', routeOrigin: 'Brunei', routeDest: 'Tomakomai', freightCost_usd_t: 55, totalChainCost_usd_t: 125 },
  { terminal: 'Tarragona Hub', country: 'Spain', storageCapacity_kt: 18, tankType: 'pressurized', crackerCapacity_tpd: 100, shippingVesselClass: 'LGC', routeOrigin: 'Tarragona', routeDest: 'Marseille', freightCost_usd_t: 35, totalChainCost_usd_t: 88 },
  { terminal: 'Esbjerg H2', country: 'Denmark', storageCapacity_kt: 15, tankType: 'pressurized', crackerCapacity_tpd: 85, shippingVesselClass: 'LGC', routeOrigin: 'Esbjerg', routeDest: 'Gothenburg', freightCost_usd_t: 38, totalChainCost_usd_t: 94 },
  { terminal: 'Kashima Port', country: 'Japan', storageCapacity_kt: 55, tankType: 'refrigerated', crackerCapacity_tpd: 310, shippingVesselClass: 'VLGC', routeOrigin: 'Various', routeDest: 'Kashima', freightCost_usd_t: 75, totalChainCost_usd_t: 162 },
];

const TRADE_ROUTES = [
  { route: 'Australia → Japan', distance_km: 7200, freightUsdT: 65, loadingCost: 12, dischargeCost: 15, totalLogistics: 92, lcoaAtOrigin: 510 },
  { route: 'Chile → Netherlands', distance_km: 12800, freightUsdT: 95, loadingCost: 14, dischargeCost: 18, totalLogistics: 127, lcoaAtOrigin: 530 },
  { route: 'Morocco → Germany', distance_km: 3800, freightUsdT: 55, loadingCost: 10, dischargeCost: 16, totalLogistics: 81, lcoaAtOrigin: 560 },
  { route: 'Oman → South Korea', distance_km: 5500, freightUsdT: 68, loadingCost: 11, dischargeCost: 14, totalLogistics: 93, lcoaAtOrigin: 495 },
  { route: 'Saudi Arabia → India', distance_km: 2500, freightUsdT: 42, loadingCost: 10, dischargeCost: 12, totalLogistics: 64, lcoaAtOrigin: 480 },
];

const TABS = ['Infrastructure Map', 'Storage Economics', 'Shipping Cost Model', 'Cracking Economics', 'Trade Route Comparison', 'Safety Standards'];

const KpiCard = ({ label, value, unit, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {unit && <div style={{ fontSize: 11, color: T.sub }}>{unit}</div>}
  </div>
);

export default function GreenAmmoniaShippingStoragePage() {
  const [tab, setTab] = useState(0);
  const [vesselFilter, setVesselFilter] = useState('All');
  const [tankFilter, setTankFilter] = useState('All');

  const filtered = useMemo(() => {
    let d = TERMINALS;
    if (vesselFilter !== 'All') d = d.filter(t => t.shippingVesselClass === vesselFilter);
    if (tankFilter !== 'All') d = d.filter(t => t.tankType === tankFilter);
    return d;
  }, [vesselFilter, tankFilter]);

  const avgFreight = useMemo(() =>
    filtered.length ? filtered.reduce((a, b) => a + b.freightCost_usd_t, 0) / filtered.length : 0,
    [filtered]);

  const totalStorage = useMemo(() =>
    filtered.reduce((a, b) => a + b.storageCapacity_kt, 0), [filtered]);

  const avgChainCost = useMemo(() =>
    filtered.length ? filtered.reduce((a, b) => a + b.totalChainCost_usd_t, 0) / filtered.length : 0,
    [filtered]);

  const vesselTypes = ['All', 'VLGC', 'MGC', 'LGC'];
  const tankTypes = ['All', 'refrigerated', 'pressurized'];

  // Tank type breakdown
  const tankBreakdown = useMemo(() => {
    const ref = TERMINALS.filter(t => t.tankType === 'refrigerated');
    const pres = TERMINALS.filter(t => t.tankType === 'pressurized');
    return [
      { name: 'Refrigerated (-33°C)', value: ref.length, storage: ref.reduce((a, b) => a + b.storageCapacity_kt, 0) },
      { name: 'Pressurized (8-18 bar)', value: pres.length, storage: pres.reduce((a, b) => a + b.storageCapacity_kt, 0) },
    ];
  }, []);

  // Shipping cost by distance
  const freightCurve = useMemo(() =>
    [500, 1000, 2000, 3000, 5000, 7000, 10000, 15000].map((d, i) => ({
      dist: d,
      vlgc: Math.round(20 + d * 0.0055 + sr(i * 7) * 5),
      mgc: Math.round(28 + d * 0.0068 + sr(i * 11) * 5),
      lgc: Math.round(35 + d * 0.0085 + sr(i * 13) * 5),
    })),
    []);

  // Cracking data
  const crackingData = useMemo(() =>
    [...filtered].sort((a, b) => b.crackerCapacity_tpd - a.crackerCapacity_tpd).slice(0, 8).map(t => ({
      name: t.terminal.slice(0, 12),
      capacity: t.crackerCapacity_tpd,
      energyPenalty: Math.round(t.crackerCapacity_tpd * 0.15 * (300 + sr(t.crackerCapacity_tpd) * 20)),
    })),
    [filtered]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ background: T.teal, color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>EP-EE2</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Green Ammonia Shipping & Storage Infrastructure</h1>
        </div>
        <p style={{ color: T.sub, fontSize: 13, margin: 0 }}>Global terminal network, vessel economics, cracking infrastructure · Source: IEA Ammonia Roadmap, IRENA, Platts, DNV</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 12, color: T.sub, marginRight: 6 }}>Vessel Class</label>
          <select value={vesselFilter} onChange={e => setVesselFilter(e.target.value)}
            style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 13, background: T.card }}>
            {vesselTypes.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: T.sub, marginRight: 6 }}>Tank Type</label>
          <select value={tankFilter} onChange={e => setTankFilter(e.target.value)}
            style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 13, background: T.card }}>
            {tankTypes.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Avg Freight Cost" value={`$${Math.round(avgFreight)}`} unit="USD/t NH3" color={T.teal} />
        <KpiCard label="Total Storage (filtered)" value={`${totalStorage} kt`} unit="capacity" color={T.green} />
        <KpiCard label="Avg Chain Cost" value={`$${Math.round(avgChainCost)}`} unit="USD/t delivered" color={T.amber} />
        <KpiCard label="Cracking Penalty" value="~15%" unit="energy loss on reconversion" color={T.red} />
        <KpiCard label="Terminals (filtered)" value={filtered.length} unit="in selection" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === i ? 700 : 400, background: tab === i ? T.teal : T.card, color: tab === i ? '#fff' : T.text }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab 0: Infrastructure Map */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Terminal Directory — Storage & Vessel Capabilities</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Terminal', 'Country', 'Storage (kt)', 'Tank Type', 'Cracker (tpd)', 'Vessel', 'Route', 'Freight $/t', 'Chain Cost $/t'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600, color: T.text }}>{t.terminal}</td>
                      <td style={{ padding: '7px 10px', color: T.sub }}>{t.country}</td>
                      <td style={{ padding: '7px 10px' }}>{t.storageCapacity_kt}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <span style={{ background: t.tankType === 'refrigerated' ? '#EFF6FF' : '#FFFBEB', color: t.tankType === 'refrigerated' ? T.blue : T.amber, borderRadius: 4, padding: '2px 6px', fontSize: 11 }}>{t.tankType}</span>
                      </td>
                      <td style={{ padding: '7px 10px' }}>{t.crackerCapacity_tpd}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <span style={{ background: t.shippingVesselClass === 'VLGC' ? '#F0FDF4' : t.shippingVesselClass === 'MGC' ? '#EFF6FF' : '#FDF4FF', color: t.shippingVesselClass === 'VLGC' ? T.green : t.shippingVesselClass === 'MGC' ? T.blue : T.indigo, borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 700 }}>{t.shippingVesselClass}</span>
                      </td>
                      <td style={{ padding: '7px 10px', fontSize: 11, color: T.sub }}>{t.routeOrigin} → {t.routeDest}</td>
                      <td style={{ padding: '7px 10px', color: T.teal, fontWeight: 600 }}>${t.freightCost_usd_t}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 700 }}>${t.totalChainCost_usd_t}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Tank Type Split (by count)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={tankBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  <Cell fill={T.blue} />
                  <Cell fill={T.amber} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Storage Capacity by Country (kt)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={Object.entries(TERMINALS.reduce((acc, t) => {
                acc[t.country] = (acc[t.country] || 0) + t.storageCapacity_kt; return acc;
              }, {})).map(([country, kt]) => ({ country, kt })).sort((a, b) => b.kt - a.kt)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} unit=" kt" />
                <Tooltip />
                <Bar dataKey="kt" fill={T.teal} name="Storage kt" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 1: Storage Economics */}
      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Storage Cost Comparison: Refrigerated vs. Pressurized</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[
                { category: 'CAPEX ($/t cap.)', ref: 450, pres: 280 },
                { category: 'OPEX ($/t/yr)', ref: 12, pres: 8 },
                { category: 'Boil-off (%/day)', ref: 0.04, pres: 0.1 },
                { category: 'Min temp (°C)', ref: -33, pres: 20 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ref" fill={T.blue} name="Refrigerated" />
                <Bar dataKey="pres" fill={T.amber} name="Pressurized" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Key Storage Parameters</h3>
            {[
              { type: 'Refrigerated (atm)', temp: '-33°C', pressure: '1 atm', capex: '$350-550/t', suitability: 'Large-scale export hubs', boiloff: '0.03-0.05%/day' },
              { type: 'Pressurized (ambient)', temp: '~20°C', pressure: '8-18 bar', capex: '$200-350/t', suitability: 'Smaller volumes, inland', boiloff: '0.05-0.15%/day' },
            ].map((s, i) => (
              <div key={i} style={{ background: T.bg, borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <div style={{ fontWeight: 700, color: T.text, marginBottom: 6 }}>{s.type}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                  <div><span style={{ color: T.sub }}>Temperature: </span><b>{s.temp}</b></div>
                  <div><span style={{ color: T.sub }}>Pressure: </span><b>{s.pressure}</b></div>
                  <div><span style={{ color: T.sub }}>CAPEX: </span><b>{s.capex}</b></div>
                  <div><span style={{ color: T.sub }}>Boil-off: </span><b>{s.boiloff}</b></div>
                  <div style={{ gridColumn: '1/-1' }}><span style={{ color: T.sub }}>Best for: </span><b>{s.suitability}</b></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Storage CAPEX Scaling (by capacity)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={[10, 20, 50, 100, 200, 500, 1000].map((kt, i) => ({
                kt,
                refrigerated: Math.round(550 - Math.log(kt) * 25 + sr(i * 7) * 15),
                pressurized: Math.round(350 - Math.log(kt) * 18 + sr(i * 11) * 10),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="kt" unit=" kt" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="refrigerated" stroke={T.blue} fill="#EFF6FF" name="Refrigerated $/t cap." />
                <Area type="monotone" dataKey="pressurized" stroke={T.amber} fill="#FFFBEB" name="Pressurized $/t cap." />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: Shipping Cost Model */}
      {tab === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Freight Cost vs. Voyage Distance by Vessel Class (USD/t)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={freightCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="dist" unit=" km" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                <Tooltip />
                <Legend />
                <Line dataKey="vlgc" stroke={T.green} strokeWidth={2} name="VLGC (84,000 m³)" />
                <Line dataKey="mgc" stroke={T.teal} strokeWidth={2} name="MGC (35,000 m³)" />
                <Line dataKey="lgc" stroke={T.amber} strokeWidth={2} name="LGC (15,000 m³)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Vessel Class Specifications</h3>
            {[
              { cls: 'VLGC', cap: '84,000 m³', cargo: '~46,000 t NH3', speed: '16-17 kn', typical: '$50-120/t', fleet: '~370 vessels', note: 'Dominant NH3 carrier class' },
              { cls: 'MGC', cap: '35,000 m³', cargo: '~19,000 t NH3', speed: '15-16 kn', typical: '$55-140/t', fleet: '~120 vessels', note: 'Flexible routing' },
              { cls: 'LGC', cap: '15,000 m³', cargo: '~8,000 t NH3', speed: '14-15 kn', typical: '$65-160/t', fleet: '~220 vessels', note: 'Regional/coastal trades' },
            ].map((v, i) => (
              <div key={i} style={{ background: T.bg, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: T.text }}>{v.cls}</span>
                  <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>{v.typical}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12 }}>
                  <div><span style={{ color: T.sub }}>Cap: </span>{v.cap}</div>
                  <div><span style={{ color: T.sub }}>Cargo: </span>{v.cargo}</div>
                  <div><span style={{ color: T.sub }}>Speed: </span>{v.speed}</div>
                  <div><span style={{ color: T.sub }}>Fleet: </span>{v.fleet}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Freight Cost Distribution (terminals)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[...filtered].sort((a, b) => a.freightCost_usd_t - b.freightCost_usd_t).map(t => ({ name: t.terminal.slice(0, 10), freight: t.freightCost_usd_t }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-25} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                <Tooltip />
                <Bar dataKey="freight" name="Freight $/t">
                  {filtered.map((t, i) => <Cell key={i} fill={t.freightCost_usd_t < 50 ? T.green : t.freightCost_usd_t < 80 ? T.teal : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3: Cracking Economics */}
      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Cracker Capacity by Terminal (tpd H2-equiv)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={crackingData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} unit=" tpd" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip />
                <Bar dataKey="capacity" fill={T.teal} name="Cracker tpd" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>NH3 Cracking Process Economics</h3>
            {[
              { param: 'Reaction', value: '2NH₃ → N₂ + 3H₂', note: 'Endothermic, 46 kJ/mol' },
              { param: 'Energy requirement', value: '~0.7 kWh/Nm³ H2', note: '~3.5 MWh/t H2 produced' },
              { param: 'Energy penalty', value: '15-20%', note: 'vs. H2 LHV in ammonia' },
              { param: 'Catalyst (Ru-based)', value: '$2-8M per 100 tpd', note: 'Higher efficiency vs Fe' },
              { param: 'Temperature', value: '400-600°C', note: 'Ru catalyst ≥ 350°C operational' },
              { param: 'H2 purity (output)', value: '99.97% H2', note: 'Post PSA purification' },
              { param: 'Cracker CAPEX', value: '$500-900/kW H2', note: 'Varies by scale' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${T.border}`, padding: '7px 0', fontSize: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, color: T.text }}>{p.param}</div>
                  <div style={{ color: T.sub, fontSize: 11 }}>{p.note}</div>
                </div>
                <div style={{ fontWeight: 700, color: T.teal, whiteSpace: 'nowrap', marginLeft: 8 }}>{p.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Full Supply Chain Cost vs. Direct NH3 Use</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { use: 'Direct Fertiliser', production: 480, storage: 45, shipping: 65, cracking: 0, total: 590 },
                { use: 'Co-firing (NH3)', production: 480, storage: 45, shipping: 65, cracking: 0, total: 590 },
                { use: 'Back-to-H2 (import)', production: 480, storage: 45, shipping: 65, cracking: 120, total: 710 },
                { use: 'Shipping fuel', production: 480, storage: 55, shipping: 75, cracking: 0, total: 610 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="use" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                <Tooltip />
                <Legend />
                <Bar dataKey="production" stackId="a" fill={T.green} name="Production LCOA" />
                <Bar dataKey="storage" stackId="a" fill={T.teal} name="Storage" />
                <Bar dataKey="shipping" stackId="a" fill={T.blue} name="Shipping" />
                <Bar dataKey="cracking" stackId="a" fill={T.red} name="Cracking penalty" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 4: Trade Route Comparison */}
      {tab === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Key Trade Routes — Delivered Cost Stack (USD/t NH3)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={TRADE_ROUTES}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="route" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                <Tooltip />
                <Legend />
                <Bar dataKey="lcoaAtOrigin" stackId="a" fill={T.green} name="LCOA at Origin" />
                <Bar dataKey="loadingCost" stackId="a" fill={T.teal} name="Loading/Export" />
                <Bar dataKey="freightUsdT" stackId="a" fill={T.blue} name="Freight" />
                <Bar dataKey="dischargeCost" stackId="a" fill={T.indigo} name="Discharge/Import" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {TRADE_ROUTES.map((r, i) => (
            <div key={i} style={{ background: T.card, borderRadius: 12, padding: 16, border: `1px solid ${T.border}` }}>
              <div style={{ fontWeight: 700, color: T.text, marginBottom: 8 }}>{r.route}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                <div><span style={{ color: T.sub }}>Distance: </span><b>{r.distance_km.toLocaleString()} km</b></div>
                <div><span style={{ color: T.sub }}>Freight: </span><b style={{ color: T.teal }}>${r.freightUsdT}/t</b></div>
                <div><span style={{ color: T.sub }}>Loading: </span><b>${r.loadingCost}/t</b></div>
                <div><span style={{ color: T.sub }}>Discharge: </span><b>${r.dischargeCost}/t</b></div>
                <div><span style={{ color: T.sub }}>LCOA origin: </span><b>${r.lcoaAtOrigin}/t</b></div>
                <div><span style={{ color: T.sub }}>Total delivered: </span><b style={{ color: T.amber }}>${r.lcoaAtOrigin + r.totalLogistics}/t</b></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Safety Standards */}
      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>NH3 Safety Risk Profile</h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={[
                { metric: 'Toxicity', nh3: 85, lng: 10, lpg: 15 },
                { metric: 'Flammability', nh3: 35, lng: 90, lpg: 88 },
                { metric: 'Corrosivity', nh3: 75, lng: 20, lpg: 18 },
                { metric: 'Reactivity', nh3: 40, lng: 25, lpg: 30 },
                { metric: 'Dispersion risk', nh3: 70, lng: 45, lpg: 50 },
              ]}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <Radar dataKey="nh3" stroke={T.red} fill={T.red} fillOpacity={0.2} name="Ammonia" />
                <Radar dataKey="lng" stroke={T.blue} fill={T.blue} fillOpacity={0.1} name="LNG (ref)" />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Regulatory Standards</h3>
            {[
              { std: 'IGC Code (IMO)', scope: 'Vessel design & ops', status: 'Mandatory', note: 'Updated 2023 for NH3 fuel' },
              { std: 'IHF (Int. Handling)', scope: 'Terminal safety', status: 'Mandatory', note: 'Loading arm specs, detection' },
              { std: 'NFPA 55/704', scope: 'US onshore storage', status: 'Mandatory', note: 'Compressed gas classification' },
              { std: 'EN 13794', scope: 'EU storage tanks', status: 'Mandatory', note: 'Refrigerated NH3 tanks' },
              { std: 'ATEX Directive', scope: 'EU explosion zones', status: 'Mandatory', note: 'Zone 1/2 classification' },
              { std: 'ISGOTT', scope: 'Ship/shore interface', status: 'Best practice', note: 'Loading safety checks' },
              { std: 'ISO 20815', scope: 'Production assurance', status: 'Best practice', note: 'Reliability framework' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${T.border}`, padding: '7px 0', fontSize: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, color: T.text }}>{s.std}</div>
                  <div style={{ color: T.sub, fontSize: 11 }}>{s.scope} · {s.note}</div>
                </div>
                <span style={{ background: s.status === 'Mandatory' ? '#FEE2E2' : '#EFF6FF', color: s.status === 'Mandatory' ? T.red : T.blue, borderRadius: 4, padding: '2px 6px', fontSize: 11, whiteSpace: 'nowrap', marginLeft: 8 }}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: 11, color: T.sub, textAlign: 'center' }}>
        EP-EE2 · Sources: IEA Ammonia Technology Roadmap (2021), IRENA Innovation Outlook PtX, Platts, DNV — Green Ammonia Safety & Infrastructure 2023
      </div>
    </div>
  );
}
