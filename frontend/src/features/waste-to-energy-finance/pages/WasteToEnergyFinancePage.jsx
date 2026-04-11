import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

const TYPES = ['Incineration','Anaerobic Digestion','Gasification','Landfill Gas','Pyrolysis','Biomass'];
const REGIONS = ['Europe','Asia Pacific','North America','Latin America','Middle East & Africa','South Asia'];
const STATUSES = ['Operating','Construction','Development'];
const COUNTRIES = ['Germany','UK','Sweden','Japan','China','USA','Brazil','India','South Korea','Australia','France','Canada'];

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const PROJECTS = Array.from({ length: 55 }, (_, i) => {
  const type = TYPES[Math.floor(sr(i * 7) * TYPES.length)];
  const country = COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];
  const region = REGIONS[Math.floor(sr(i * 13) * REGIONS.length)];
  const status = STATUSES[Math.floor(sr(i * 17) * STATUSES.length)];
  const capacityMW = Math.round(5 + sr(i * 3) * 295);
  const wasteProcessed = Math.round(50 + sr(i * 5) * 950);
  const energyOutput = Math.round(capacityMW * (2000 + sr(i * 19) * 3000) / 1000);
  return {
    id: i + 1,
    name: `${['WtE','EcoGen','BioEnergy','GreenPower','WasteGen','CircuPower','BioGas','ThermoGen','PyroEnergy','LandfillPwr'][i % 10]} ${['Plant','Facility','Project','Station','Works'][Math.floor(sr(i * 23) * 5)]} ${String.fromCharCode(65 + i % 26)}`,
    type, country, region, status, capacityMW, wasteProcessed,
    energyOutput,
    projectValue: Math.round(20 + sr(i * 29) * 480),
    lcoe: Math.round(60 + sr(i * 31) * 140),
    carbonCredits: Math.round(5 + sr(i * 37) * 145),
    co2Intensity: Math.round(50 + sr(i * 41) * 350),
    irr: +(4 + sr(i * 43) * 18).toFixed(1),
    subsidyEligible: sr(i * 47) > 0.4,
  };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const TABS = ['Project Overview','Technology Types','Energy Output','Waste Processing','Carbon Credits','LCOE Analysis','Project Finance','Policy Landscape'];

export default function WasteToEnergyFinancePage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(55);
  const [gateFee, setGateFee] = useState(45);

  const filtered = useMemo(() => PROJECTS.filter(p =>
    (typeFilter === 'All' || p.type === typeFilter) &&
    (regionFilter === 'All' || p.region === regionFilter) &&
    (statusFilter === 'All' || p.status === statusFilter)
  ), [typeFilter, regionFilter, statusFilter]);

  const n = Math.max(1, filtered.length);
  const totalCapacity = filtered.reduce((s, p) => s + p.capacityMW, 0);
  const totalWaste = filtered.reduce((s, p) => s + p.wasteProcessed, 0);
  const totalEnergy = filtered.reduce((s, p) => s + p.energyOutput, 0);
  const avgLcoe = (filtered.reduce((s, p) => s + p.lcoe, 0) / n).toFixed(0);
  const totalCredits = filtered.reduce((s, p) => s + p.carbonCredits, 0);
  const creditValue = ((totalCredits * carbonPrice) / 1000).toFixed(1);
  const gateRevenue = ((totalWaste * gateFee) / 1000).toFixed(0);

  const typeCapData = TYPES.map(t => {
    const ps = filtered.filter(p => p.type === t);
    return { type: t.substring(0, 10), capacity: ps.reduce((s, p) => s + p.capacityMW, 0) };
  }).filter(d => d.capacity > 0);

  const typeLcoeData = TYPES.map(t => {
    const ps = filtered.filter(p => p.type === t);
    return { type: t.substring(0, 10), lcoe: ps.length ? Math.round(ps.reduce((s, p) => s + p.lcoe, 0) / ps.length) : 0 };
  }).filter(d => d.lcoe > 0);

  const typeCreditData = TYPES.map(t => {
    const ps = filtered.filter(p => p.type === t);
    return { type: t.substring(0, 10), credits: ps.reduce((s, p) => s + p.carbonCredits, 0) };
  }).filter(d => d.credits > 0);

  const scatterData = filtered.map(p => ({ x: p.wasteProcessed, y: p.energyOutput, name: p.name }));

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🔥</span>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Waste-to-Energy Finance</div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: T.fontMono }}>EP-DL2 · 55 Projects · 6 Technologies · Global WtE Intelligence</div>
          </div>
        </div>
      </div>

      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Technology', typeFilter, setTypeFilter, ['All', ...TYPES]],
          ['Region', regionFilter, setRegionFilter, ['All', ...REGIONS]],
          ['Status', statusFilter, setStatusFilter, ['All', ...STATUSES]],
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
          <input type="range" min={20} max={150} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 80 }} />
        </label>
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Gate Fee ${gateFee}/t:
          <input type="range" min={10} max={120} value={gateFee} onChange={e => setGateFee(+e.target.value)} style={{ width: 80 }} />
        </label>
        <span style={{ fontSize: 11, color: T.textSec, marginLeft: 'auto' }}>{filtered.length} projects</span>
      </div>

      <div style={{ padding: '20px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Total Capacity" value={`${totalCapacity.toLocaleString()} MW`} sub={`${filtered.length} projects`} color={T.orange} />
        <KpiCard label="Total Waste Processed" value={`${(totalWaste / 1000).toFixed(0)}M t/yr`} sub={`Gate revenue: $${gateRevenue}M @ $${gateFee}/t`} color={T.indigo} />
        <KpiCard label="Total Energy Output" value={`${(totalEnergy / 1000).toFixed(0)}k GWh/yr`} sub="Generated electricity" color={T.green} />
        <KpiCard label="Avg LCOE" value={`$${avgLcoe}`} sub="$/MWh weighted avg" color={T.teal} />
      </div>

      <div style={{ padding: '0 32px', display: 'flex', gap: 4, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '8px 14px', fontSize: 12, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? T.navy : T.textSec, background: tab === i ? T.card : 'transparent',
            border: 'none', borderBottom: tab === i ? `2px solid ${T.orange}` : '2px solid transparent',
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
                  {['Project','Type','Country','Status','MW','Waste(kt)','Energy(GWh)','LCOE($/MWh)','IRR%','Subsidy'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 40).map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                    <td style={{ padding: '7px 10px' }}>{p.type}</td>
                    <td style={{ padding: '7px 10px' }}>{p.country}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ background: p.status === 'Operating' ? '#dcfce7' : p.status === 'Construction' ? '#dbeafe' : '#fef9c3', color: p.status === 'Operating' ? T.green : p.status === 'Construction' ? T.blue : T.amber, borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 600 }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{p.capacityMW}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{p.wasteProcessed}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{p.energyOutput}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{p.lcoe}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: p.irr >= 12 ? T.green : T.amber }}>{p.irr}%</td>
                    <td style={{ padding: '7px 10px' }}>{p.subsidyEligible ? <span style={{ color: T.green, fontWeight: 700 }}>✓</span> : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Total Capacity by Technology (MW)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={typeCapData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="type" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v} MW`, 'Capacity']} />
                  <Bar dataKey="capacity" fill={T.orange} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Technology Mix Summary</div>
              {TYPES.map(t => {
                const ps = filtered.filter(p => p.type === t);
                const pct = n > 0 ? (ps.length / n) * 100 : 0;
                return (
                  <div key={t} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600 }}>{t}</span>
                      <span style={{ fontFamily: T.fontMono, color: T.textSec }}>{ps.length} projects ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ background: T.borderL, borderRadius: 4, height: 8 }}>
                      <div style={{ background: T.orange, width: `${pct}%`, height: '100%', borderRadius: 4 }} />
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
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Waste Input vs Energy Output</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Waste (kt/yr)" tick={{ fontSize: 10 }} label={{ value: 'Waste Processed (kt/yr)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis dataKey="y" name="Energy (GWh)" tick={{ fontSize: 10 }} label={{ value: 'Energy Output (GWh)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => [v, n === 'x' ? 'Waste (kt/yr)' : 'Energy (GWh)']} />
                  <Scatter data={scatterData.slice(0, 40)} fill={T.green} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Top Energy Producers</div>
              {[...filtered].sort((a, b) => b.energyOutput - a.energyOutput).slice(0, 15).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{p.type}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.green, fontWeight: 700 }}>{p.energyOutput} GWh</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Waste Processing by Technology</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>Total: {(totalWaste / 1000).toFixed(1)}M kt/yr · Gate rev: ${gateRevenue}M</div>
              {TYPES.map(t => {
                const tot = filtered.filter(p => p.type === t).reduce((s, p) => s + p.wasteProcessed, 0);
                const pct = totalWaste > 0 ? (tot / totalWaste) * 100 : 0;
                return (
                  <div key={t} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600 }}>{t}</span>
                      <span style={{ fontFamily: T.fontMono, color: T.textSec }}>{(tot / 1000).toFixed(1)}M kt ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ background: T.borderL, borderRadius: 4, height: 8 }}>
                      <div style={{ background: T.indigo, width: `${pct}%`, height: '100%', borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Top 12 — Waste Processors</div>
              {[...filtered].sort((a, b) => b.wasteProcessed - a.wasteProcessed).slice(0, 12).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.indigo }}>{p.wasteProcessed} kt</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Carbon Credits by Technology (ktCO2/yr)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={typeCreditData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="type" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v} ktCO2`, 'Carbon Credits']} />
                  <Bar dataKey="credits" fill={T.green} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Carbon Credit Revenue @ ${carbonPrice}/tCO2</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: T.green, fontFamily: T.fontMono, marginBottom: 12 }}>${creditValue}M</div>
              {[...filtered].sort((a, b) => b.carbonCredits - a.carbonCredits).slice(0, 12).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ fontSize: 12 }}>{p.name}</div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.green }}>{p.carbonCredits} ktCO2</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Avg LCOE by Technology ($/MWh)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={typeLcoeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="type" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`$${v}/MWh`, 'Avg LCOE']} />
                  <Bar dataKey="lcoe" fill={T.amber} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Lowest LCOE Projects</div>
              {[...filtered].sort((a, b) => a.lcoe - b.lcoe).slice(0, 15).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{p.type}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.teal }}>${p.lcoe}/MWh</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 6 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Top IRR Projects</div>
              {[...filtered].sort((a, b) => b.irr - a.irr).slice(0, 15).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{p.type} · ${p.projectValue}M</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 13, color: p.irr >= 15 ? T.green : T.amber, fontWeight: 700 }}>{p.irr}%</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Finance KPIs</div>
              {[
                { label: 'Total Project Value', val: `$${filtered.reduce((s, p) => s + p.projectValue, 0).toLocaleString()}M`, clr: T.navy },
                { label: 'Avg IRR', val: `${(filtered.reduce((s, p) => s + p.irr, 0) / n).toFixed(1)}%`, clr: T.green },
                { label: 'Subsidy Eligible Projects', val: `${filtered.filter(p => p.subsidyEligible).length} (${((filtered.filter(p => p.subsidyEligible).length / n) * 100).toFixed(0)}%)`, clr: T.gold },
                { label: 'Carbon Credit Revenue', val: `$${creditValue}M`, clr: T.teal },
                { label: 'Gate Fee Revenue', val: `$${gateRevenue}M`, clr: T.indigo },
                { label: 'Operating Projects', val: `${filtered.filter(p => p.status === 'Operating').length}`, clr: T.sage },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <span style={{ fontSize: 12, color: T.textSec }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: T.fontMono, color: item.clr }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Policy & Subsidy Landscape</div>
              {[
                { region: 'Europe', policy: 'EU ETS + Renewable Energy Directive 2023', impact: 'High' },
                { region: 'Asia Pacific', policy: 'Japan Feed-in Tariff & China WtE quotas', impact: 'High' },
                { region: 'North America', policy: 'US IRA Clean Electricity Credits', impact: 'Medium' },
                { region: 'Latin America', policy: 'Brazil PNRS & Colombia REC framework', impact: 'Medium' },
                { region: 'Middle East & Africa', policy: 'UAE National Waste Plan 2030', impact: 'Developing' },
                { region: 'South Asia', policy: 'India SBM & MSW Rules 2016 revision', impact: 'Developing' },
              ].map(r => (
                <div key={r.region} style={{ padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{r.region}</span>
                    <span style={{ fontSize: 11, background: r.impact === 'High' ? '#dcfce7' : r.impact === 'Medium' ? '#dbeafe' : '#fef9c3', color: r.impact === 'High' ? T.green : r.impact === 'Medium' ? T.blue : T.amber, borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>{r.impact}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{r.policy}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Regional Project Distribution</div>
              {REGIONS.map(reg => {
                const cnt = filtered.filter(p => p.region === reg).length;
                const pct = n > 0 ? (cnt / n) * 100 : 0;
                return (
                  <div key={reg} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600 }}>{reg}</span>
                      <span style={{ color: T.textSec, fontFamily: T.fontMono }}>{cnt} projects</span>
                    </div>
                    <div style={{ background: T.borderL, borderRadius: 4, height: 8 }}>
                      <div style={{ background: T.teal, width: `${pct}%`, height: '100%', borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
