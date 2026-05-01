import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E', sub: '#6B7280', indigo: '#4F46E5', green: '#065F46', red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', sky: '#0369A1', steel: '#374151' };
const TABS = ['Overview', 'Technology Economics', 'Heat Decarbonization', 'Project Pipeline', 'Grid Integration', 'ROI Calculator'];

const TECH_AREAS = [
  { id: 'HeatPumps', name: 'Industrial Heat Pumps', tempRange: 'Up to 200°C', elecFactor: 0.33, gasFactor: 0.80, lcoh: 65, abatement: 72, capex: 850, maturity: 'Commercial' },
  { id: 'ElecBoilers', name: 'Electric Boilers', tempRange: 'Up to 500°C', elecFactor: 0.97, gasFactor: 0.80, lcoh: 72, abatement: 85, capex: 180, maturity: 'Commercial' },
  { id: 'ElecFurnaces', name: 'Electric Arc Furnaces', tempRange: 'Up to 1800°C', elecFactor: 0.90, gasFactor: 0.85, lcoh: 95, abatement: 90, capex: 420, maturity: 'Commercial' },
  { id: 'MWHeating', name: 'Microwave / RF Heating', tempRange: 'Up to 1200°C', elecFactor: 0.75, gasFactor: 0.85, lcoh: 110, abatement: 88, capex: 280, maturity: 'Early Comm.' },
  { id: 'IH', name: 'Induction Heating', tempRange: 'Up to 1400°C', elecFactor: 0.85, gasFactor: 0.82, lcoh: 90, abatement: 88, capex: 350, maturity: 'Commercial' },
  { id: 'ThermalStorage', name: 'Thermal Energy Storage', tempRange: '100–700°C', elecFactor: 0.70, gasFactor: 0.80, lcoh: 55, abatement: 65, capex: 220, maturity: 'Early Comm.' },
];

const PROJECTS = Array.from({ length: 18 }, (_, i) => {
  const tech = TECH_AREAS[Math.floor(sr(i * 7 + 1) * TECH_AREAS.length)];
  const sectorName = ['Food & Bev', 'Paper/Pulp', 'Chemical', 'Automotive', 'Plastics', 'Pharma', 'Textile'][Math.floor(sr(i * 11 + 2) * 7)];
  const country = ['Germany', 'Netherlands', 'USA', 'Sweden', 'UK', 'France', 'Japan'][Math.floor(sr(i * 13 + 3) * 7)];
  const heatMWh = Math.round(5000 + sr(i * 17 + 4) * 95000);
  const status = ['Operating', 'Construction', 'FID', 'Engineering', 'Feasibility'][Math.floor(sr(i * 19 + 5) * 5)];
  const capex = Math.round(tech.capex * heatMWh / 10000);
  const irr = parseFloat((6 + sr(i * 23 + 6) * 10).toFixed(1));
  return { id: i + 1, name: `${country.substring(0, 3)}-${sectorName.split('/')[0].substring(0, 5)}-${i + 1}`, tech: tech.id, sector: sectorName, country, status, heatMWh, capex, irr, abatement: tech.abatement };
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

export default function IndustrialElectrificationFinancePage() {
  const [tab, setTab] = useState(0);
  const [elecPrice, setElecPrice] = useState(60);
  const [gasPrice, setGasPrice] = useState(45);
  const [carbonPrice, setCarbonPrice] = useState(80);
  const [heatDemand, setHeatDemand] = useState(50);

  const filtered = useMemo(() => PROJECTS, []);
  const avgIrr = useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.irr, 0) / filtered.length).toFixed(1) : '—', [filtered]);
  const totalHeat = useMemo(() => filtered.reduce((s, p) => s + p.heatMWh, 0), [filtered]);

  const economicsComparison = useMemo(() => TECH_AREAS.map(t => {
    const electricCost = heatDemand * 1000 * elecPrice / t.elecFactor / 1e6;
    const gasCost = heatDemand * 1000 * gasPrice / 1000 * 0.033 / t.gasFactor;
    const carbonSaving = t.abatement / 100 * heatDemand * 0.2 * carbonPrice / 1e3;
    const netElec = electricCost - carbonSaving;
    return { name: t.id.substring(0, 8), electricCost: parseFloat(electricCost.toFixed(2)), gasCost: parseFloat(gasCost.toFixed(2)), netElec: parseFloat(netElec.toFixed(2)) };
  }), [elecPrice, gasPrice, carbonPrice, heatDemand]);

  const heatTemps = [
    { range: '<100°C', share: 35, tech: 'Heat Pumps', potential: 'High' },
    { range: '100–200°C', share: 25, tech: 'Heat Pumps + Elec Boilers', potential: 'High' },
    { range: '200–500°C', share: 20, tech: 'Electric Boilers', potential: 'Medium' },
    { range: '500–1000°C', share: 12, tech: 'MW / IH / EAF', potential: 'Medium' },
    { range: '>1000°C', share: 8, tech: 'EAF + H₂ + Plasma', potential: 'Low' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      <div style={{ background: '#0C1A2E', padding: '20px 32px', borderBottom: `3px solid ${T.steel}` }}>
        <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>EP-EG5 · Green Steel Suite</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>Industrial Electrification Finance</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Heat Pumps · Electric Boilers · EAF · Induction · MW Heating · Thermal Storage · 18 Projects</div>
      </div>
      <div style={{ background: '#0C1A2E', display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid #1E3A5F` }}>
        {TABS.map((t, i) => <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 18px', fontSize: 12, fontWeight: tab === i ? 700 : 400, color: tab === i ? '#94A3B8' : '#6B7280', background: 'none', border: 'none', borderBottom: tab === i ? `2px solid #94A3B8` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>)}
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Projects Tracked" value={filtered.length} sub={`${(totalHeat / 1000).toFixed(0)} GWh heat`} color={T.sky} />
          <KpiCard label="Avg Project IRR" value={`${avgIrr}%`} sub="Industrial electrification" color={T.green} />
          <KpiCard label="Industrial Heat Share" value="21%" sub="of global final energy" color={T.indigo} />
          <KpiCard label="Electrification Target" value="35%" sub="Industry by 2030 (IEA NZE)" color={T.amber} />
          <KpiCard label="Elec. Price" value={`$${elecPrice}/MWh`} sub="vs Gas ${gasPrice}/MWh" color={T.teal} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>Electricity: ${elecPrice}/MWh</span><input type="range" min={20} max={150} value={elecPrice} onChange={e => setElecPrice(+e.target.value)} style={{ width: 100 }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>Gas: ${gasPrice}/MWh</span><input type="range" min={15} max={120} value={gasPrice} onChange={e => setGasPrice(+e.target.value)} style={{ width: 100 }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>Carbon: ${carbonPrice}/t</span><input type="range" min={20} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 100 }} /></div>
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Abatement % by Technology</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={TECH_AREAS.map(t => ({ name: t.id.substring(0, 8), abatement: t.abatement, capex: t.capex / 10 }))} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={v => [`${v}%`, 'Abatement']} />
                  <Bar dataKey="abatement" fill={T.green} radius={[0, 4, 4, 0]} />
                  <ReferenceLine x={80} stroke={T.amber} strokeDasharray="4 2" label={{ value: '80%', fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Industrial Heat Temperature Profile</div>
              {heatTemps.map(h => (
                <div key={h.range} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{h.range}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: T.sky }}>{h.share}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.sub }}>{h.tech}</div>
                  <div style={{ background: T.border, borderRadius: 4, height: 6, marginTop: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${h.share * 2}%`, background: h.potential === 'High' ? T.green : h.potential === 'Medium' ? T.sky : T.amber, height: '100%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Electric vs Gas Cost ({heatDemand} GWh/yr process heat)</div>
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>
                <span>Heat Demand: {heatDemand} GWh/yr</span>
                <input type="range" min={10} max={200} value={heatDemand} onChange={e => setHeatDemand(+e.target.value)} style={{ width: 120 }} />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={economicsComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$M" />
                  <Tooltip formatter={v => [`$${v}M/yr`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="electricCost" name="Electric Cost" fill={T.sky} />
                  <Bar dataKey="gasCost" name="Gas Cost" fill={T.amber} />
                  <Bar dataKey="netElec" name="Net Electric" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Technology Specifications</div>
              {TECH_AREAS.map(t => (
                <div key={t.id} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{t.name}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T.sub, marginTop: 3, flexWrap: 'wrap' }}>
                    <span>{t.tempRange}</span>
                    <span>Eff: {Math.round(t.elecFactor * 100)}%</span>
                    <span>Abatement: <strong style={{ color: T.green }}>{t.abatement}%</strong></span>
                    <span>CAPEX: ${t.capex}/kW</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Industrial Heat Demand by Temperature (EJ/yr)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={heatTemps.map(h => ({ range: h.range, heatShare: h.share, elecPotential: Math.round(h.share * (h.potential === 'High' ? 0.85 : h.potential === 'Medium' ? 0.55 : 0.25)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="heatShare" name="Heat Demand %" fill={T.amber} />
                  <Bar dataKey="elecPotential" name="Electrification Potential %" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Global Industrial Electrification Progress</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={[2024, 2027, 2030, 2035, 2040, 2050].map(yr => ({ year: yr, current: Math.round(22 + (yr - 2024) * 2), nze: Math.round(22 + (yr - 2024) * 4.5) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={v => [`${v}%`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="current" name="Current Trajectory" stroke={T.amber} strokeWidth={2} dot={false} />
                  <Line dataKey="nze" name="NZE Pathway" stroke={T.green} strokeWidth={2} dot={false} />
                  <ReferenceLine y={35} stroke={T.sky} strokeDasharray="4 2" label={{ value: '2030 Target', fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Electrification Project Pipeline</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: '#F8F7F4' }}>
                  {['Project', 'Technology', 'Sector', 'Country', 'Heat (MWh/yr)', 'CAPEX $M', 'IRR %', 'Abatement %', 'Status'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 ? '#FAFAF7' : T.card }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: T.sub }}>{p.tech}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11 }}>{p.sector}</td>
                      <td style={{ padding: '8px 12px' }}>{p.country}</td>
                      <td style={{ padding: '8px 12px' }}>{p.heatMWh.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px' }}>${p.capex}M</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: p.irr >= 10 ? T.green : T.amber }}>{p.irr}%</td>
                      <td style={{ padding: '8px 12px', color: p.abatement >= 80 ? T.green : T.sky }}>{p.abatement}%</td>
                      <td style={{ padding: '8px 12px' }}><Pill v={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Grid Demand Impact (GW peak, EU industrial)</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={[2025, 2028, 2030, 2033, 2035, 2040, 2050].map(yr => ({ year: yr, heatPumps: Math.round((yr - 2025) * 12), electricBoilers: Math.round((yr - 2025) * 8), furnaces: Math.round((yr - 2025) * 5), storage: Math.round((yr - 2025) * 6) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" GW" />
                  <Tooltip formatter={v => [`${v} GW`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="heatPumps" name="Heat Pumps" stackId="a" fill={T.sky} stroke={T.sky} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="electricBoilers" name="Elec. Boilers" stackId="a" fill={T.green} stroke={T.green} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="furnaces" name="Furnaces" stackId="a" fill={T.steel} stroke={T.steel} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="storage" name="Thermal Storage" stackId="a" fill={T.amber} stroke={T.amber} fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Grid Flexibility Benefits</div>
              {[{ benefit: 'Demand Response Revenue', value: '$8–15/MWh', detail: 'Industrial loads as grid balancing assets' }, { benefit: 'Thermal Storage Arbitrage', value: '$12–25/MWh saved', detail: 'Shift heating load to off-peak rates' }, { benefit: 'Avoided Grid Reinforcement', value: '$30–80/kW', detail: 'Smart scheduling reduces peak demand' }, { benefit: 'CO₂ Intensity Optimization', value: '20–35% reduction', detail: 'Scheduling to match low-carbon grid periods' }, { benefit: 'PPA Anchor Load Value', value: '+$5–12/MWh credit', detail: 'Long-term renewable offtake credibility' }].map(b => (
                <div key={b.benefit} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{b.benefit}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T.sub, marginTop: 3 }}>
                    <span style={{ color: T.green, fontWeight: 600 }}>{b.value}</span><span>{b.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Simple Payback Calculator</div>
              {TECH_AREAS.slice(0, 4).map(t => {
                const annualGasCost = heatDemand * 1000 * gasPrice / 1000 * 0.033 / t.gasFactor;
                const annualElecCost = heatDemand * 1000 * elecPrice / t.elecFactor / 1e6;
                const annualCarbonSaving = t.abatement / 100 * heatDemand * 0.2 * carbonPrice / 1e3;
                const netSaving = annualGasCost - annualElecCost + annualCarbonSaving;
                const capexM = t.capex * heatDemand * 1000 / 1e9;
                const payback = netSaving > 0 ? (capexM / netSaving).toFixed(1) : '∞';
                return (
                  <div key={t.id} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{t.name}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T.sub, marginTop: 3 }}>
                      <span>Gas Cost: ${annualGasCost.toFixed(2)}M</span>
                      <span>Elec Cost: ${annualElecCost.toFixed(2)}M</span>
                      <span style={{ color: T.green }}>Saving: ${netSaving.toFixed(2)}M/yr</span>
                      <span style={{ color: netSaving > 0 && parseFloat(payback) < 10 ? T.green : T.amber }}>Payback: {payback}yr</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>ROI by Electricity Price Scenario</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={[20, 40, 60, 80, 100, 120, 140].map(ep => {
                  const annualGas = heatDemand * 1000 * gasPrice / 1000 * 0.033 / 0.80;
                  const annualElec = heatDemand * 1000 * ep / 0.85 / 1e6;
                  const netSav = annualGas - annualElec + heatDemand * 0.2 * carbonPrice / 1e3;
                  const capexM2 = 850 * heatDemand * 1000 / 1e9;
                  return { elec: ep, irr: parseFloat(Math.max(0, netSav / capexM2 * 100).toFixed(1)) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="elec" tick={{ fontSize: 11 }} unit="$/MWh" />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={v => [`${v}%`, 'ROI']} />
                  <Line dataKey="irr" stroke={T.green} strokeWidth={2} dot={false} />
                  <ReferenceLine y={10} stroke={T.amber} strokeDasharray="4 2" label={{ value: 'Hurdle 10%', fontSize: 10 }} />
                  <ReferenceLine x={elecPrice} stroke={T.sky} strokeDasharray="3 2" label={{ value: `Current $${elecPrice}`, fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
