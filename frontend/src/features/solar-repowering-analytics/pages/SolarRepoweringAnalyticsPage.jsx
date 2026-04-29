import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie
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

const OWNERS = ['NextEra Energy', 'Brookfield RE', 'Ørsted', 'EDP Renewables', 'Enel Green Power', 'AES Clean Energy', 'Invenergy'];
const STATES_REPOWER = ['California', 'Texas', 'Nevada', 'Arizona', 'New Mexico', 'Florida', 'North Carolina', 'Pennsylvania'];

const PROJECTS = Array.from({ length: 18 }, (_, i) => {
  const vintageYear = 2008 + Math.round(sr(i * 7) * 8);
  const currentCapacityMw = 20 + Math.round(sr(i * 11) * 280);
  const newCapacityMw = currentCapacityMw * (1.2 + sr(i * 13) * 0.8);
  const aepUpliftPct = 15 + sr(i * 17) * 20;
  const repowerCapex = newCapacityMw * (0.55 + sr(i * 19) * 0.20) * 1e6;
  const inverterReplaceCost = currentCapacityMw * (0.04 + sr(i * 23) * 0.03) * 1e6;
  const moduleUpgradeCost = newCapacityMw * (0.25 + sr(i * 29) * 0.12) * 1e6;
  const remainingPPAyrs = 2 + Math.round(sr(i * 31) * 12);
  const currentAep = currentCapacityMw * 0.21 * 8760 / 1000; // GWh
  const newAep = currentAep * (1 + aepUpliftPct / 100);
  const annualRevDelta = (newAep - currentAep) * 50 * 1000; // $k (50 $/MWh)
  const repowerIrr = 7.0 + sr(i * 37) * 5.5;
  const lifeExtIrr = 4.5 + sr(i * 41) * 3.5;
  const plantAge = 2026 - vintageYear;
  return {
    id: `EC6-${String(i + 1).padStart(2, '0')}`,
    name: `RP-${STATES_REPOWER[i % STATES_REPOWER.length].slice(0, 2).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
    owner: OWNERS[i % OWNERS.length],
    state: STATES_REPOWER[i % STATES_REPOWER.length],
    vintageYear,
    plantAge,
    currentCapacityMw,
    newCapacityMw: +newCapacityMw.toFixed(0),
    expansionMw: +(newCapacityMw - currentCapacityMw).toFixed(0),
    aepUpliftPct: +aepUpliftPct.toFixed(1),
    repowerCapexM: +(repowerCapex / 1e6).toFixed(1),
    inverterReplaceM: +(inverterReplaceCost / 1e6).toFixed(1),
    moduleUpgradeM: +(moduleUpgradeCost / 1e6).toFixed(1),
    remainingPPAyrs,
    currentAepGwh: +currentAep.toFixed(1),
    newAepGwh: +newAep.toFixed(1),
    annualRevDeltaM: +(annualRevDelta / 1e6).toFixed(2),
    repowerIrr: +repowerIrr.toFixed(2),
    lifeExtIrr: +lifeExtIrr.toFixed(2),
    recommendation: repowerIrr > 9.5 ? 'Full Repower' : repowerIrr > 7.5 ? 'Partial Repower' : 'Life Extension',
    currentModuleEff: 14 + sr(i * 43) * 2,
    newModuleEff: 21 + sr(i * 47) * 2,
  };
});

const DECOMMISSION_COSTS = [
  { component: 'Module Removal & Recycling', costPerMw: 18000, note: 'EPR obligations in EU; US variable' },
  { component: 'Inverter Disposal', costPerMw: 4000, note: 'Hazardous components; WEEE' },
  { component: 'Structural Dismantling', costPerMw: 12000, note: 'Racking, tracker removal' },
  { component: 'Cabling & Earthworks', costPerMw: 9000, note: 'Underground cable extraction' },
  { component: 'Land Remediation', costPerMw: 6000, note: 'Topsoil restoration, reseeding' },
  { component: 'Grid Disconnection', costPerMw: 5000, note: 'Substation decommission' },
];

const AEP_UPLIFT_DRIVERS = [
  { driver: 'Mono-PERC → TOPCon Modules', uplift: 8, source: 'Technology' },
  { driver: 'Fixed-tilt → SAT Tracking', uplift: 5, source: 'Technology' },
  { driver: 'Bifacial Gain (if ground-mounted)', uplift: 4, source: 'Technology' },
  { driver: 'New Inverters (reduced losses)', uplift: 2, source: 'Operational' },
  { driver: 'Capacity Expansion (new MW)', uplift: 12, source: 'Capacity' },
  { driver: 'Soiling/Degradation Recovery', uplift: 3, source: 'Operational' },
];

const PPA_RESTRUCTURING = [
  { structure: 'PPA Extension (same terms)', term: '10 yrs', impact: 'Low upside — legacy price locked', risk: 'Medium' },
  { structure: 'New PPA at market rates', term: '15–20 yrs', impact: 'Full market price reset; AEP uplift captured', risk: 'Low' },
  { structure: 'Merchant + Hedge', term: '5 yrs', impact: 'Price upside with collar protection', risk: 'High' },
  { structure: 'Corporate PPA (C&I offtaker)', term: '10–15 yrs', impact: 'ESG premium; fixed price', risk: 'Low' },
  { structure: 'Capacity Market + Energy', term: '3+15 yrs', impact: 'Ancillary value capture (CAISO/PJM)', risk: 'Medium' },
];

const KPI_CARD = ({ label, value, unit, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {unit && <div style={{ fontSize: 11, color: T.sub }}>{unit}</div>}
  </div>
);

const TABS = [
  { id: 'fleet', label: 'Fleet Dashboard' },
  { id: 'decision', label: 'Repower vs Extend' },
  { id: 'aep', label: 'AEP Uplift Model' },
  { id: 'ppa', label: 'PPA Restructuring' },
  { id: 'decommission', label: 'Decommissioning' },
  { id: 'capex', label: 'Capex Waterfall' },
];

export default function SolarRepoweringAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('fleet');
  const [selectedOwner, setSelectedOwner] = useState('All');

  const filtered = useMemo(() =>
    selectedOwner === 'All' ? PROJECTS : PROJECTS.filter(p => p.owner === selectedOwner),
    [selectedOwner]
  );

  const kpis = useMemo(() => {
    const totalCurrentMw = filtered.reduce((s, p) => s + p.currentCapacityMw, 0);
    const totalNewMw = filtered.reduce((s, p) => s + p.newCapacityMw, 0);
    const avgAepUplift = filtered.length ? filtered.reduce((s, p) => s + p.aepUpliftPct, 0) / filtered.length : 0;
    const avgRepowerIrr = filtered.length ? filtered.reduce((s, p) => s + p.repowerIrr, 0) / filtered.length : 0;
    const avgAge = filtered.length ? filtered.reduce((s, p) => s + p.plantAge, 0) / filtered.length : 0;
    const fullRepower = filtered.filter(p => p.recommendation === 'Full Repower').length;
    return { totalCurrentMw, totalNewMw, avgAepUplift, avgRepowerIrr, avgAge, fullRepower };
  }, [filtered]);

  const repowerVsExtendData = useMemo(() =>
    filtered.slice(0, 12).map(p => ({
      name: p.name,
      repowerIrr: p.repowerIrr,
      lifeExtIrr: p.lifeExtIrr,
      diff: +(p.repowerIrr - p.lifeExtIrr).toFixed(2),
    })), [filtered]);

  const capexWaterfallData = useMemo(() => {
    const avgInverter = filtered.length ? filtered.reduce((s, p) => s + p.inverterReplaceM, 0) / filtered.length : 0;
    const avgModule = filtered.length ? filtered.reduce((s, p) => s + p.moduleUpgradeM, 0) / filtered.length : 0;
    const avgTotal = filtered.length ? filtered.reduce((s, p) => s + p.repowerCapexM, 0) / filtered.length : 0;
    const avgOther = avgTotal - avgInverter - avgModule;
    return [
      { component: 'Module Upgrade', value: +avgModule.toFixed(1), color: T.blue },
      { component: 'Inverter Replacement', value: +avgInverter.toFixed(1), color: T.teal },
      { component: 'Grid/Civil/Other', value: +Math.max(avgOther, 0).toFixed(1), color: T.amber },
    ];
  }, [filtered]);

  const vintageDistribution = useMemo(() => {
    const byYear = {};
    filtered.forEach(p => {
      const yr = String(p.vintageYear);
      if (!byYear[yr]) byYear[yr] = { year: yr, count: 0, totalMw: 0 };
      byYear[yr].count++;
      byYear[yr].totalMw += p.currentCapacityMw;
    });
    return Object.values(byYear).sort((a, b) => a.year.localeCompare(b.year));
  }, [filtered]);

  const aepProjectionData = Array.from({ length: 10 }, (_, yr) => {
    const base = 100;
    const degradeOld = base * Math.pow(0.9945, yr) * (1 - yr * 0.003);
    const repower = yr < 2 ? base - yr * 5 : 100 * Math.pow(0.9945, Math.max(0, yr - 2));
    return {
      year: `Yr ${yr + 1}`,
      degradedFleet: +degradeOld.toFixed(1),
      afterRepower: +repower.toFixed(1),
      upliftTarget: +(100 * (1 + (kpis.avgAepUplift) / 100)).toFixed(1),
    };
  });

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: T.sub, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>EP-EC6 · Solar Energy Finance</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text, margin: 0 }}>Solar Repowering & Life Extension Analytics</h1>
          <p style={{ color: T.sub, marginTop: 6, fontSize: 14 }}>
            Fleet repowering decision analytics — AEP uplift modelling, incremental IRR, PPA restructuring and decommissioning economics for ageing solar assets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <select value={selectedOwner} onChange={e => setSelectedOwner(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, fontSize: 13 }}>
            <option value="All">All Owners</option>
            {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: T.sub, alignSelf: 'center' }}>
            {filtered.length} assets · Wood Mackenzie: 10 GW US solar eligible for repower by 2027
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <KPI_CARD label="Current Fleet" value={kpis.totalCurrentMw.toLocaleString()} unit="MW (current)" color={T.sub} />
          <KPI_CARD label="Post-Repower" value={kpis.totalNewMw.toLocaleString()} unit="MW (new)" color={T.blue} />
          <KPI_CARD label="Avg AEP Uplift" value={kpis.avgAepUplift.toFixed(1)} unit="%" color={T.green} />
          <KPI_CARD label="Avg Repower IRR" value={kpis.avgRepowerIrr.toFixed(2)} unit="%" color={T.gold} />
          <KPI_CARD label="Avg Plant Age" value={kpis.avgAge.toFixed(1)} unit="years" color={T.amber} />
          <KPI_CARD label="Full Repower" value={kpis.fullRepower} unit={`of ${filtered.length} assets`} color={T.teal} />
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.border}` }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                padding: '8px 16px', border: 'none',
                background: activeTab === t.id ? T.blue : 'transparent',
                color: activeTab === t.id ? '#fff' : T.sub,
                borderRadius: '6px 6px 0 0', cursor: 'pointer',
                fontWeight: activeTab === t.id ? 600 : 400, fontSize: 13
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'fleet' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Fleet by Vintage Year (MW)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={vintageDistribution} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="totalMw" name="Fleet MW">
                      {vintageDistribution.map((_, i) => <Cell key={i} fill={T.blue} opacity={0.5 + i * 0.1} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Recommendation Distribution</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Full Repower', value: filtered.filter(p => p.recommendation === 'Full Repower').length, fill: T.green },
                      { name: 'Partial Repower', value: filtered.filter(p => p.recommendation === 'Partial Repower').length, fill: T.teal },
                      { name: 'Life Extension', value: filtered.filter(p => p.recommendation === 'Life Extension').length, fill: T.amber },
                    ]} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`} labelLine={false} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['ID', 'Name', 'Owner', 'Vintage', 'Age', 'MW Now', 'MW New', 'AEP Uplift %', 'Repower $M', 'Inv. $M', 'Mod. $M', 'Rem. PPA Yr', 'Repower IRR', 'LifeExt IRR', 'Rec.'].map(h => (
                      <th key={h} style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : '#F9F8F5', borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '7px 10px', color: T.sub, fontFamily: 'monospace', fontSize: 11 }}>{p.id}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11 }}>{p.owner.split(' ')[0]}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.vintageYear}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: p.plantAge >= 14 ? T.red : p.plantAge >= 12 ? T.amber : T.teal, fontWeight: 600 }}>{p.plantAge}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.currentCapacityMw}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: T.blue }}>{p.newCapacityMw}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: T.green, fontWeight: 600 }}>{p.aepUpliftPct}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.repowerCapexM}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.inverterReplaceM}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.moduleUpgradeM}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.remainingPPAyrs}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: p.repowerIrr >= 9 ? T.green : p.repowerIrr >= 7.5 ? T.teal : T.amber }}>{p.repowerIrr}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right' }}>{p.lifeExtIrr}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', background: p.recommendation === 'Full Repower' ? '#D1FAE5' : p.recommendation === 'Partial Repower' ? '#DBEAFE' : '#FEF3C7', color: p.recommendation === 'Full Repower' ? T.green : p.recommendation === 'Partial Repower' ? T.blue : T.amber }}>
                          {p.recommendation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'decision' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Repower vs Life Extension IRR</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={repowerVsExtendData} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis domain={[3, 16]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                  <Legend />
                  <Bar dataKey="repowerIrr" name="Repower IRR %" fill={T.blue} />
                  <Bar dataKey="lifeExtIrr" name="Life Ext. IRR %" fill={T.amber} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>IRR Uplift: Repower over Life Extension</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={repowerVsExtendData} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v}%`, 'IRR Uplift']} />
                  <Bar dataKey="diff" name="IRR Uplift (pp)">
                    {repowerVsExtendData.map((p, i) => <Cell key={i} fill={p.diff > 2 ? T.green : p.diff > 0 ? T.teal : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Decision Framework — Key Triggers</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { rec: 'Full Repower', criteria: ['Plant age ≥ 15 yrs', 'Remaining PPA ≤ 5 yrs', 'AEP uplift ≥ 25%', 'Incremental IRR > 9.5%'], color: T.green },
                  { rec: 'Partial Repower', criteria: ['Age 12–15 yrs', 'PPA expires in 6–10 yrs', 'AEP uplift 15–25%', 'IRR 7.5–9.5%'], color: T.teal },
                  { rec: 'Life Extension', criteria: ['Age < 12 yrs', 'PPA > 10 yrs remaining', 'AEP uplift < 15%', 'IRR < 7.5% for repower'], color: T.amber },
                ].map(item => (
                  <div key={item.rec} style={{ padding: 14, background: T.bg, borderRadius: 8, borderTop: `3px solid ${item.color}` }}>
                    <div style={{ fontWeight: 700, color: item.color, marginBottom: 8 }}>{item.rec}</div>
                    {item.criteria.map(c => (
                      <div key={c} style={{ fontSize: 12, color: T.text, marginBottom: 4 }}>• {c}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'aep' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>AEP Trajectory: Current vs Repowered (indexed)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={aepProjectionData} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis domain={[75, 125]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="degradedFleet" name="Aging Fleet" stroke={T.red} dot={false} strokeWidth={2} strokeDasharray="5 3" />
                  <Line type="monotone" dataKey="afterRepower" name="Post-Repower" stroke={T.blue} dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="upliftTarget" name="AEP Target" stroke={T.green} dot={false} strokeWidth={2} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>AEP Uplift Drivers</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={AEP_UPLIFT_DRIVERS} layout="vertical" margin={{ left: 160 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="driver" type="category" tick={{ fontSize: 10 }} width={160} />
                  <Tooltip formatter={v => [`+${v}%`, 'AEP Uplift']} />
                  <Bar dataKey="uplift" name="AEP Uplift %">
                    {AEP_UPLIFT_DRIVERS.map((d, i) => (
                      <Cell key={i} fill={d.source === 'Technology' ? T.blue : d.source === 'Capacity' ? T.green : T.teal} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Module Efficiency: 2008–2016 vs 2024 Technology</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { era: '2008–2012 Modules', eff: '13–15%', tech: 'Poly-Si / Early Mono', color: T.amber },
                  { era: '2013–2016 Modules', eff: '15–17%', tech: 'Mono-PERC (early)', color: T.gold },
                  { era: '2023 Mono-PERC', eff: '20–21%', tech: 'Current standard', color: T.teal },
                  { era: '2024 TOPCon/HJT', eff: '22–24%', tech: 'Premium technology', color: T.green },
                ].map(item => (
                  <div key={item.era} style={{ padding: 14, background: T.bg, borderRadius: 8, borderTop: `3px solid ${item.color}` }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: item.color }}>{item.eff}</div>
                    <div style={{ fontSize: 12, color: T.text, marginTop: 2 }}>{item.era}</div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{item.tech}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ppa' && (
          <div>
            <div style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['PPA Structure', 'Term', 'Revenue Impact', 'Risk Level'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PPA_RESTRUCTURING.map((p, i) => (
                    <tr key={p.structure} style={{ background: i % 2 === 0 ? T.card : '#F9F8F5', borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: T.blue }}>{p.structure}</td>
                      <td style={{ padding: '10px 16px' }}>{p.term}</td>
                      <td style={{ padding: '10px 16px', color: T.sub, fontSize: 12 }}>{p.impact}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: p.risk === 'Low' ? '#D1FAE5' : p.risk === 'Medium' ? '#DBEAFE' : '#FEF2F2', color: p.risk === 'Low' ? T.green : p.risk === 'Medium' ? T.blue : T.red }}>
                          {p.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Annual Revenue Delta by Project (M$)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={filtered.slice(0, 12).map(p => ({ name: p.name, delta: p.annualRevDeltaM }))} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`$${v}M`, 'Annual Rev Delta']} />
                  <Bar dataKey="delta" name="Annual Revenue Uplift $M">
                    {filtered.slice(0, 12).map((p, i) => <Cell key={i} fill={p.annualRevDeltaM > 0 ? T.green : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'decommission' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Decommissioning Cost Components ($/MW)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={DECOMMISSION_COSTS} layout="vertical" margin={{ left: 140 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="component" type="category" tick={{ fontSize: 10 }} width={140} />
                  <Tooltip formatter={v => [`$${v.toLocaleString()}/MW`]} />
                  <Bar dataKey="costPerMw" name="$/MW">
                    {DECOMMISSION_COSTS.map((_, i) => <Cell key={i} fill={[T.blue, T.teal, T.green, T.amber, T.gold, T.indigo][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Decommissioning Notes</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DECOMMISSION_COSTS.map((item, i) => (
                  <div key={item.component} style={{ padding: '10px 14px', background: T.bg, borderRadius: 8, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 12, color: T.text, flex: 1 }}>{item.component}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: [T.blue, T.teal, T.green, T.amber, T.gold, T.indigo][i], whiteSpace: 'nowrap' }}>${item.costPerMw.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ padding: 12, background: '#EFF6FF', borderRadius: 8, marginTop: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.blue }}>Total Decommission Cost (avg)</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.navy, marginTop: 4 }}>
                    ${DECOMMISSION_COSTS.reduce((s, c) => s + c.costPerMw, 0).toLocaleString()}/MW
                  </div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>Source: Wood Mackenzie Solar Decommissioning Report 2023</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'capex' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Total Repower CAPEX by Asset ($M)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filtered.map(p => ({ name: p.name, total: p.repowerCapexM, inv: p.inverterReplaceM, mod: p.moduleUpgradeM, other: +(p.repowerCapexM - p.inverterReplaceM - p.moduleUpgradeM).toFixed(1) }))} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [`$${v}M`, n]} />
                  <Legend />
                  <Bar dataKey="mod" name="Module Upgrade" stackId="a" fill={T.blue} />
                  <Bar dataKey="inv" name="Inverter Replace" stackId="a" fill={T.teal} />
                  <Bar dataKey="other" name="Grid/Civil/Other" stackId="a" fill={T.amber} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Avg Capex Breakdown</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={capexWaterfallData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                    label={({ component, percent }) => `${component.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {capexWaterfallData.map((item, i) => <Cell key={i} fill={item.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`$${v}M`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {capexWaterfallData.map(item => (
                  <div key={item.component} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: item.color, fontWeight: 600 }}>{item.component}</span>
                    <span style={{ fontWeight: 700 }}>${item.value}M</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 32, padding: '16px 0', borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.sub }}>
          Data sources: Wood Mackenzie Solar Repowering Market Report 2023 · NREL Solar Fleet Repowering Techno-Economic Analysis · Lawrence Berkeley LBNL Utility-Scale Solar 2023 · SEIA Solar Repower Best Practice Guide · Fraunhofer ISE Module Technology Roadmap 2024
        </div>
      </div>
    </div>
  );
}
