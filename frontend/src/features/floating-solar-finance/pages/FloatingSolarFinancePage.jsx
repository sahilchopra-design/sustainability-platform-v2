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

const WATER_BODY_TYPES = ['Reservoir', 'Lake', 'Irrigation Pond', 'Quarry Pond', 'Retention Basin'];
const ANCHORING_SYSTEMS = ['Anchor & Chain', 'Pile Foundation', 'Tension Mooring', 'Flexible Connector'];
const COUNTRIES_FPV = ['South Korea', 'China', 'India', 'Japan', 'Netherlands', 'France', 'USA', 'Thailand', 'Indonesia'];

const PROJECTS = Array.from({ length: 18 }, (_, i) => {
  const capacityMw = 1 + Math.round(sr(i * 7) * 199);
  const coveragePct = 5 + sr(i * 11) * 20;
  const evaporationSavingML = capacityMw * (3 + sr(i * 13) * 7);
  const coolingBoostPct = 2 + sr(i * 17) * 3;
  const structuralPremiumPct = 15 + sr(i * 19) * 10;
  const lcoe = 42 + sr(i * 23) * 28;
  const irrPct = 6.0 + sr(i * 29) * 6.5;
  const waterBodyAreaHa = capacityMw * (4 + sr(i * 31) * 3) / coveragePct * 100;
  return {
    id: `EC2-${String(i + 1).padStart(2, '0')}`,
    name: `FPV-${COUNTRIES_FPV[i % COUNTRIES_FPV.length]}-${String(i + 1).padStart(3, '0')}`,
    country: COUNTRIES_FPV[i % COUNTRIES_FPV.length],
    waterBody: WATER_BODY_TYPES[i % WATER_BODY_TYPES.length],
    capacityMw,
    coveragePct: +coveragePct.toFixed(1),
    evaporationSavingML: +evaporationSavingML.toFixed(0),
    coolingBoostPct: +coolingBoostPct.toFixed(1),
    structuralPremiumPct: +structuralPremiumPct.toFixed(1),
    lcoe: +lcoe.toFixed(1),
    irrPct: +irrPct.toFixed(2),
    anchoringSystem: ANCHORING_SYSTEMS[i % ANCHORING_SYSTEMS.length],
    waterBodyAreaHa: +waterBodyAreaHa.toFixed(0),
    aepBoostGwh: +(capacityMw * coolingBoostPct / 100 * 0.15 * 8760 / 1000).toFixed(1),
  };
});

const COUNTRY_PIPELINE = [
  { country: 'China', installedGw: 1.8, pipelineGw: 8.5, maturity: 'Mature' },
  { country: 'South Korea', installedGw: 0.6, pipelineGw: 2.1, maturity: 'Mature' },
  { country: 'India', installedGw: 0.25, pipelineGw: 4.2, maturity: 'Developing' },
  { country: 'Japan', installedGw: 0.48, pipelineGw: 1.2, maturity: 'Mature' },
  { country: 'Netherlands', installedGw: 0.25, pipelineGw: 0.8, maturity: 'Developing' },
  { country: 'France', installedGw: 0.05, pipelineGw: 0.6, maturity: 'Emerging' },
  { country: 'USA', installedGw: 0.12, pipelineGw: 1.8, maturity: 'Developing' },
  { country: 'Thailand', installedGw: 0.09, pipelineGw: 1.1, maturity: 'Emerging' },
];

const COST_COMPONENTS = [
  { component: 'Floating Structure', pctOfTotal: 18, groundEquiv: 0, fpvCost: 0.18 },
  { component: 'Anchoring System', pctOfTotal: 8, groundEquiv: 0, fpvCost: 0.08 },
  { component: 'Underwater Cabling', pctOfTotal: 7, groundEquiv: 2, fpvCost: 0.07 },
  { component: 'PV Modules', pctOfTotal: 28, groundEquiv: 30, fpvCost: 0.28 },
  { component: 'Inverters', pctOfTotal: 9, groundEquiv: 10, fpvCost: 0.09 },
  { component: 'Installation', pctOfTotal: 14, groundEquiv: 10, fpvCost: 0.14 },
  { component: 'Electrical BOS', pctOfTotal: 10, groundEquiv: 11, fpvCost: 0.10 },
  { component: 'Civil Works', pctOfTotal: 6, groundEquiv: 12, fpvCost: 0.06 },
];

const KPI_CARD = ({ label, value, unit, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {unit && <div style={{ fontSize: 11, color: T.sub }}>{unit}</div>}
  </div>
);

const TABS = [
  { id: 'portfolio', label: 'FPV Portfolio' },
  { id: 'hydrology', label: 'Hydrology & Cooling' },
  { id: 'structural', label: 'Structural Cost Premium' },
  { id: 'water', label: 'Water Conservation' },
  { id: 'revenue', label: 'Revenue Waterfall' },
  { id: 'pipeline', label: 'Country Pipeline' },
];

export default function FloatingSolarFinancePage() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [selectedCountry, setSelectedCountry] = useState('All');

  const filtered = useMemo(() =>
    selectedCountry === 'All' ? PROJECTS : PROJECTS.filter(p => p.country === selectedCountry),
    [selectedCountry]
  );

  const kpis = useMemo(() => {
    const totalMw = filtered.reduce((s, p) => s + p.capacityMw, 0);
    const avgLcoe = filtered.length ? filtered.reduce((s, p) => s + p.lcoe, 0) / filtered.length : 0;
    const avgIrr = filtered.length ? filtered.reduce((s, p) => s + p.irrPct, 0) / filtered.length : 0;
    const totalEvapSaving = filtered.reduce((s, p) => s + p.evaporationSavingML, 0);
    const avgCoolingBoost = filtered.length ? filtered.reduce((s, p) => s + p.coolingBoostPct, 0) / filtered.length : 0;
    const avgStructuralPremium = filtered.length ? filtered.reduce((s, p) => s + p.structuralPremiumPct, 0) / filtered.length : 0;
    return { totalMw, avgLcoe, avgIrr, totalEvapSaving, avgCoolingBoost, avgStructuralPremium };
  }, [filtered]);

  const hydrologyData = useMemo(() =>
    filtered.slice(0, 12).map(p => ({
      name: p.name.slice(-6),
      evapSaving: p.evaporationSavingML,
      coolingBoost: p.coolingBoostPct,
      coveragePct: p.coveragePct,
    })), [filtered]);

  const revenueWaterfallData = useMemo(() =>
    filtered.slice(0, 10).map(p => {
      const baseRevM = p.capacityMw * 0.15 * 8760 * 55 / 1e6;
      const coolingBonusM = p.aepBoostGwh * 55 / 1e3;
      const waterCreditM = p.evaporationSavingML * 0.15 / 1e3;
      return {
        name: p.name.slice(-6),
        baseRevM: +baseRevM.toFixed(2),
        coolingBonusM: +coolingBonusM.toFixed(2),
        waterCreditM: +waterCreditM.toFixed(2),
      };
    }), [filtered]);

  const structuralCostData = COST_COMPONENTS.map(c => ({
    ...c,
    delta: c.fpvCost - c.groundEquiv / 100,
  }));

  const evapTrendData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    withFpv: 120 + sr(i * 7) * 80,
    withoutFpv: 200 + sr(i * 11) * 90,
  }));

  const capexBreakdown = COST_COMPONENTS.map(c => ({ name: c.component, value: c.pctOfTotal, fill: [T.blue, T.teal, T.green, T.gold, T.indigo, T.amber, T.sage, T.red][COST_COMPONENTS.indexOf(c)] }));

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: T.sub, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>EP-EC2 · Solar Energy Finance</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text, margin: 0 }}>Floating Solar (FPV) Project Finance</h1>
          <p style={{ color: T.sub, marginTop: 6, fontSize: 14 }}>
            Floating photovoltaic project analytics — hydrology modelling, structural cost premium, water conservation economics and country pipeline intelligence.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, fontSize: 13 }}>
            <option value="All">All Countries</option>
            {COUNTRIES_FPV.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: T.sub, alignSelf: 'center' }}>
            {filtered.length} of {PROJECTS.length} projects · Global FPV: ~4.5 GW installed (2023)
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <KPI_CARD label="Total Capacity" value={kpis.totalMw.toLocaleString()} unit="MW" color={T.blue} />
          <KPI_CARD label="Avg LCOE" value={kpis.avgLcoe.toFixed(1)} unit="$/MWh" color={T.teal} />
          <KPI_CARD label="Avg IRR" value={kpis.avgIrr.toFixed(2)} unit="%" color={T.green} />
          <KPI_CARD label="Total Evap. Saved" value={(kpis.totalEvapSaving / 1000).toFixed(1)} unit="GL/yr" color={T.indigo} />
          <KPI_CARD label="Avg Cooling Boost" value={kpis.avgCoolingBoost.toFixed(1)} unit="% AEP gain" color={T.gold} />
          <KPI_CARD label="Structural Premium" value={kpis.avgStructuralPremium.toFixed(1)} unit="% vs ground" color={T.amber} />
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

        {activeTab === 'portfolio' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['ID', 'Name', 'Country', 'Water Body', 'MW', 'Coverage %', 'Evap. Saving (ML)', 'Cooling Boost %', 'Structural Premium %', 'LCOE $/MWh', 'IRR %', 'Anchoring'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : '#F9F8F5', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 12px', color: T.sub, fontFamily: 'monospace', fontSize: 11 }}>{p.id}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '8px 12px' }}>{p.country}</td>
                    <td style={{ padding: '8px 12px' }}>{p.waterBody}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{p.capacityMw}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{p.coveragePct}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: T.indigo }}>{p.evaporationSavingML.toLocaleString()}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: T.green, fontWeight: 600 }}>{p.coolingBoostPct}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: T.amber }}>{p.structuralPremiumPct}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{p.lcoe}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: T.teal, fontWeight: 600 }}>{p.irrPct}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11 }}>{p.anchoringSystem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'hydrology' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Cooling Effect: AEP Boost by Coverage %</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hydrologyData.slice(0, 12)} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="coolingBoost" name="Cooling Boost %" fill={T.teal} />
                  <Bar dataKey="coveragePct" name="Coverage %" fill={T.blue} opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Monthly Evaporation: With vs Without FPV (ML)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={evapTrendData} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="withoutFpv" name="Without FPV" fill={T.red} stroke={T.red} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="withFpv" name="With FPV" fill={T.blue} stroke={T.blue} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Evaporation Reduction', value: '50–70%', source: 'SERIS / NTU Singapore', color: T.blue },
                  { label: 'Module Temp. Reduction', value: '2–4 °C', source: 'NREL FPV Study 2022', color: T.teal },
                  { label: 'AEP Gain from Cooling', value: '2–5%', source: 'Ciel & Terre Field Data', color: T.green },
                  { label: 'Algae Inhibition', value: '30–50%', source: 'World Bank FPV Report', color: T.gold },
                ].map(item => (
                  <div key={item.label} style={{ padding: 14, background: T.bg, borderRadius: 8, borderTop: `3px solid ${item.color}` }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: 12, color: T.text, marginTop: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{item.source}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'structural' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>CAPEX Component Breakdown — FPV (%)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={capexBreakdown} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, value }) => `${value}%`} labelLine>
                    {capexBreakdown.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Structural Premium by Anchoring System</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { system: 'Pile Foundation', premium: 25, reliability: 95 },
                  { system: 'Tension Mooring', premium: 21, reliability: 88 },
                  { system: 'Anchor & Chain', premium: 17, reliability: 85 },
                  { system: 'Flexible Connector', premium: 15, reliability: 90 },
                ]} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="system" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="premium" name="Cost Premium %" fill={T.amber} />
                  <Bar dataKey="reliability" name="Reliability Score" fill={T.green} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'water' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Evaporation Saving (ML) by Project</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hydrologyData.slice(0, 12)} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v} ML`, 'Evap. Saving']} />
                  <Bar dataKey="evapSaving" name="Evaporation Saving (ML)" fill={T.indigo}>
                    {hydrologyData.slice(0, 12).map((_, i) => <Cell key={i} fill={T.indigo} opacity={0.5 + i * 0.04} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Water Value Economics</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { metric: 'Water Cost (Agriculture)', value: '$0.05–0.15/m³', color: T.blue },
                  { metric: 'Water Cost (Municipal)', value: '$0.40–1.20/m³', color: T.teal },
                  { metric: 'Evap. Saving per MW', value: '3–10 ML/MW/yr', color: T.green },
                  { metric: 'Revenue Credit Potential', value: '$0.15–1.80/MWh', color: T.gold },
                  { metric: 'LCOE Reduction (Water)', value: '0.5–2.0 $/MWh', color: T.indigo },
                ].map(item => (
                  <div key={item.metric} style={{ padding: '10px 14px', background: T.bg, borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: T.text }}>{item.metric}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: 12, background: '#EFF6FF', borderRadius: 8, fontSize: 12, color: T.text }}>
                <strong style={{ color: T.blue }}>World Bank (2022):</strong> FPV over drinking water reservoirs can save 80–90% of surface evaporation — critical in water-stressed regions.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Revenue Stack (M$/project)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueWaterfallData} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [`$${v}M`, n]} />
                  <Legend />
                  <Bar dataKey="baseRevM" name="PPA Revenue" stackId="a" fill={T.blue} />
                  <Bar dataKey="coolingBonusM" name="Cooling AEP Bonus" stackId="a" fill={T.green} />
                  <Bar dataKey="waterCreditM" name="Water Credit" stackId="a" fill={T.indigo} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>IRR Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filtered.map(p => ({ name: p.name.slice(-6), irr: p.irrPct }))} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[4, 14]} />
                  <Tooltip formatter={v => [`${v}%`, 'IRR']} />
                  <Bar dataKey="irr" name="Project IRR %">
                    {filtered.map((p, i) => <Cell key={i} fill={p.irrPct >= 9 ? T.green : p.irrPct >= 7 ? T.teal : T.amber} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}`, marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Global FPV Pipeline: Installed vs Announced (GW)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={COUNTRY_PIPELINE} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [`${v} GW`, n]} />
                  <Legend />
                  <Bar dataKey="installedGw" name="Installed GW" fill={T.blue} />
                  <Bar dataKey="pipelineGw" name="Pipeline GW" fill={T.teal} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['Country', 'Installed (GW)', 'Pipeline (GW)', 'Growth Multiple', 'Market Maturity'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COUNTRY_PIPELINE.map((c, i) => (
                    <tr key={c.country} style={{ background: i % 2 === 0 ? T.card : '#F9F8F5', borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600 }}>{c.country}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>{c.installedGw}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', color: T.teal, fontWeight: 600 }}>{c.pipelineGw}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>{(c.pipelineGw / (c.installedGw || 0.01)).toFixed(1)}×</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          background: c.maturity === 'Mature' ? '#D1FAE5' : c.maturity === 'Developing' ? '#DBEAFE' : '#FEF3C7',
                          color: c.maturity === 'Mature' ? T.green : c.maturity === 'Developing' ? T.blue : T.amber,
                          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600
                        }}>{c.maturity}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ marginTop: 32, padding: '16px 0', borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.sub }}>
          Data sources: World Bank FPV Report (2019, 2022) · SERIS / National University Singapore FPV Studies · NREL Floating PV Technical Potential (2022) · Ciel & Terre Hydrelio Field Data · IEA PVPS Task 8 FPV Chapter · SOLARIF Floating Solar Insurance Benchmark
        </div>
      </div>
    </div>
  );
}
