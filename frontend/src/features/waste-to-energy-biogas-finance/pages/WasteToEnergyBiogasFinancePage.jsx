import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#0f172a', card: '#1e293b', border: '#334155', muted: '#94a3b8',
  text: '#f1f5f9', sub: '#cbd5e1', accent: '#10B981',
  green: '#16A34A', amber: '#D97706', red: '#DC2626', indigo: '#6366F1',
  teal: '#0D9488', blue: '#2563EB', purple: '#7C3AED',
};

const KpiCard = ({ label, value, sub, color = T.accent }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px' }}>
    <div style={{ color: T.muted, fontSize: 12, marginBottom: 6 }}>{label}</div>
    <div style={{ color, fontSize: 26, fontWeight: 700 }}>{value}</div>
    {sub && <div style={{ color: T.sub, fontSize: 11, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Pill = ({ label, color = T.accent }) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}55`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{label}</span>
);

const TECHNOLOGIES = [
  { name: 'Anaerobic Digestion', code: 'AD', feedstock: 'Organic / Food Waste', capex: 2.8, opex: 0.12, efficiency: 34, gateFee: 55, lcoe: 82, ghgAbatement: 0.48, maturity: 'Mature', capacity: '0.5–50 MWe' },
  { name: 'Landfill Gas Capture', code: 'LFG', feedstock: 'MSW Landfill', capex: 1.2, opex: 0.06, efficiency: 28, gateFee: 0, lcoe: 48, ghgAbatement: 0.65, maturity: 'Mature', capacity: '1–25 MWe' },
  { name: 'Mass-burn Incineration (EfW)', code: 'EfW', feedstock: 'Mixed MSW', capex: 6.4, opex: 0.18, efficiency: 26, gateFee: 88, lcoe: 95, ghgAbatement: 0.31, maturity: 'Mature', capacity: '20–200 MWe' },
  { name: 'Gasification (Syngas)', code: 'GAS', feedstock: 'RDF / Biomass', capex: 4.1, opex: 0.22, efficiency: 38, gateFee: 62, lcoe: 110, ghgAbatement: 0.42, maturity: 'Commercial', capacity: '5–50 MWe' },
  { name: 'Pyrolysis (Plastic)', code: 'PYR', feedstock: 'Plastic Waste', capex: 3.6, opex: 0.19, efficiency: 42, gateFee: 70, lcoe: 125, ghgAbatement: 0.38, maturity: 'Early Commercial', capacity: '1–20 MWe' },
  { name: 'Biogas Upgrading (Biomethane)', code: 'BIO', feedstock: 'Biogas', capex: 1.8, opex: 0.08, efficiency: 95, gateFee: 45, lcoe: 65, ghgAbatement: 0.72, maturity: 'Mature', capacity: '500 Nm³/h+' },
  { name: 'Hydrothermal Carbonisation', code: 'HTC', feedstock: 'Wet Organic', capex: 2.2, opex: 0.14, efficiency: 31, gateFee: 58, lcoe: 92, ghgAbatement: 0.45, maturity: 'Demonstration', capacity: '1–10 MWe' },
  { name: 'Plasma Arc Gasification', code: 'PAG', feedstock: 'Hazardous / Mixed', capex: 8.9, opex: 0.28, efficiency: 22, gateFee: 140, lcoe: 165, ghgAbatement: 0.28, maturity: 'Niche', capacity: '1–5 MWe' },
];

const PROJECTS = Array.from({ length: 22 }, (_, i) => ({
  name: ['Thames EfW Barking', 'Biffa AD Cannock', 'Veolia Biogas Leeds', 'Suez LFG Kent', 'Renewi Gasification NL', 'PreZero EfW Krefeld', 'Covanta Dublin', 'Enva Biomethane IE', 'Blue Sphere AD FL', 'Aria Energy LFG TX', 'Montauk LFG PA', 'Genie Energy EfW NY', 'Paques AD NL', 'HoSt Biogas BE', 'Weltec AD DE', 'BKK EfW Bergen', 'SITA EfW Lyon', 'Indaver Ghent', 'Stena EfW Goteborg', 'Fortum EfW Helsinki', 'Sembcorp EfW SG', 'Neo Energy LFG AU'][i],
  tech: TECHNOLOGIES[Math.floor(sr(i * 7) * TECHNOLOGIES.length)].code,
  capacityMW: Math.round(sr(i * 11) * 80 + 5),
  capexM: +(sr(i * 13) * 180 + 20).toFixed(1),
  gateFeePerT: Math.round(sr(i * 9) * 80 + 20),
  irr: +(sr(i * 17) * 8 + 7).toFixed(1),
  debtGearing: Math.round(sr(i * 5) * 30 + 60),
  tenorYrs: Math.round(sr(i * 3) * 10 + 15),
  status: ['Operating', 'Construction', 'Development', 'Permitted'][Math.floor(sr(i * 23) * 4)],
  region: ['UK', 'EU', 'US', 'APAC'][Math.floor(sr(i * 19) * 4)],
}));

const REVENUE_STREAMS = [
  { stream: 'Gate Fee (tipping fee)', pct: 45, driver: 'Waste volume + contract tenor', risk: 'Low' },
  { stream: 'Electricity Revenue', pct: 28, driver: 'Merchant price + CfD/FiT', risk: 'Medium' },
  { stream: 'Heat Revenue (DH)', pct: 12, driver: 'District heating offtake', risk: 'Low' },
  { stream: 'REC / ROC / LCFS Credits', pct: 8, driver: 'Green certificate price', risk: 'High' },
  { stream: 'Biomethane Premium (RHI/BioSNG)', pct: 5, driver: 'Gas grid injection tariff', risk: 'Medium' },
  { stream: 'Carbon Credits (BioChar/LULUCF)', pct: 2, driver: 'Voluntary carbon price', risk: 'High' },
];

const IRREVOL_CHART = Array.from({ length: 20 }, (_, i) => ({
  scenario: `Scenario ${i + 1}`,
  gateFee: 40 + Math.round(sr(i * 7) * 60),
  irr: +(7 + sr(i * 11) * 8).toFixed(1),
}));

const CF_DATA = Array.from({ length: 25 }, (_, i) => ({
  year: 2024 + i,
  revenue: +(sr(i * 13) * 2 + 6 + i * 0.08).toFixed(2),
  opex: +(sr(i * 7) * 0.5 + 1.2).toFixed(2),
  debt: +(Math.max(0, 3.5 - i * 0.14)).toFixed(2),
  fcf: +(sr(i * 17) * 1 + 1.5 + i * 0.04).toFixed(2),
}));

const POLICY_DATA = [
  { country: 'UK', policy: 'ROC / CfD Allocation Round', support: 'RO Banding: AD 0.5, EfW 0.5 ROC/MWh; CfD strike price £160', status: 'Active' },
  { country: 'Germany', policy: 'EEG 2023 Biomass Tender', support: 'Tender premium €165/MWh for eligible biomass', status: 'Active' },
  { country: 'France', policy: 'Appels d\'offres Biogaz', support: 'Biomethane purchase obligation, tariff €95–125/MWh', status: 'Active' },
  { country: 'Italy', policy: 'DM 23/06/2016 + RD 2022', support: 'Incentive €250–300/MWh biomethane injection', status: 'Active' },
  { country: 'USA', policy: 'IRA §45 & LCFS Credits', support: '§45 clean electricity PTC $26/MWh + state LCFS', status: 'Active' },
  { country: 'Netherlands', policy: 'SDE++ Green Gas', support: 'SDE++ subsidy gap-filling up to €0.12/Nm³', status: 'Active' },
];

const TABS = ['Market Overview', 'Technology Matrix', 'Project Pipeline', 'Revenue Modelling', 'Cash Flow Analysis', 'Policy & Finance'];

export default function WasteToEnergyBiogasFinancePage() {
  const [tab, setTab] = useState(0);
  const [filterTech, setFilterTech] = useState('All');
  const [capacityMW, setCapacityMW] = useState(20);
  const [gateFeeSel, setGateFeeSel] = useState(65);
  const [electricityPrice, setElectricityPrice] = useState(90);

  const filteredProjects = filterTech === 'All' ? PROJECTS : PROJECTS.filter(p => p.tech === filterTech);

  const annualRevenue = (capacityMW * 8760 * 0.85 * electricityPrice / 1e6 + capacityMW * 1.8 * gateFeeSel / 1000).toFixed(2);
  const estimatedIRR = Math.min(18, Math.max(5, (gateFeeSel / 10 + electricityPrice / 50))).toFixed(1);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: 'Inter,sans-serif', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ background: T.accent + '22', border: `1px solid ${T.accent}`, borderRadius: 8, padding: '4px 12px', fontSize: 11, color: T.accent, fontWeight: 700 }}>EP-EJ3</div>
          <Pill label="Waste-to-Energy" color={T.accent} />
          <Pill label="Biogas & Biomethane" color={T.teal} />
          <Pill label="Circular Finance" color={T.green} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Waste-to-Energy & Biogas Finance</h1>
        <p style={{ color: T.muted, marginTop: 6, fontSize: 14 }}>Technology economics, project finance structuring, revenue stream analytics, and policy intelligence for WtE, AD, gasification, and biomethane infrastructure.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Global WtE Capacity" value="450 GW" sub="Installed 2024" color={T.accent} />
        <KpiCard label="Avg AD Project IRR" value="9–13%" sub="Gate fee + power revenues" color={T.green} />
        <KpiCard label="Biomethane Premium" value="€120/MWh" sub="EU avg injection tariff" color={T.teal} />
        <KpiCard label="Pipeline Projects" value={`${PROJECTS.length}`} sub="In dataset" color={T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ background: tab === i ? T.accent : T.card, color: tab === i ? '#fff' : T.sub, border: `1px solid ${tab === i ? T.accent : T.border}`, borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Revenue Stream Breakdown</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={REVENUE_STREAMS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.muted} tick={{ fontSize: 11 }} unit="%" />
                  <YAxis dataKey="stream" type="category" stroke={T.muted} tick={{ fontSize: 9 }} width={130} />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Bar dataKey="pct" name="Revenue Share %" fill={T.accent} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Technology LCOE Comparison ($/MWh)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={TECHNOLOGIES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="code" stroke={T.muted} tick={{ fontSize: 11 }} />
                  <YAxis stroke={T.muted} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Bar dataKey="lcoe" name="LCOE ($/MWh)" fill={T.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {[
              { label: 'Gate Fee Driver', desc: 'Primary revenue in EU (€50–140/t) driven by landfill tax differentials and MSW processing contracts.' },
              { label: 'Merchant Power Risk', desc: 'EfW & AD exposed to merchant electricity market; CfD/FiT structures reduce this risk for qualifying projects.' },
              { label: 'Biogas Upgrading Premium', desc: 'Biomethane injection commands 2–3× raw biogas value due to gas grid access and green gas certificates.' },
              { label: 'LCFS / REC Value', desc: 'US Renewable Fuel Standard (RIN) and CA LCFS credits add $30–90/MWh equivalent for eligible facilities.' },
            ].map(c => (
              <div key={c.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ color: T.accent, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{c.label}</div>
                <div style={{ color: T.sub, fontSize: 12 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Technology Comparison Matrix</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Technology', 'Feedstock', 'CapEx ($/W)', 'OpEx ($/kWh)', 'Efficiency %', 'Gate Fee ($/t)', 'LCOE ($/MWh)', 'GHG Abatement', 'Maturity', 'Capacity'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TECHNOLOGIES.map((t, i) => (
                  <tr key={t.code} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 === 0 ? T.bg + '55' : 'transparent' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{t.name}</td>
                    <td style={{ padding: '10px 12px', color: T.sub, fontSize: 11 }}>{t.feedstock}</td>
                    <td style={{ padding: '10px 12px', color: T.amber }}>${t.capex}</td>
                    <td style={{ padding: '10px 12px' }}>${t.opex}</td>
                    <td style={{ padding: '10px 12px' }}>{t.efficiency}%</td>
                    <td style={{ padding: '10px 12px' }}>{t.gateFee > 0 ? `$${t.gateFee}` : '—'}</td>
                    <td style={{ padding: '10px 12px', color: T.green, fontWeight: 700 }}>${t.lcoe}</td>
                    <td style={{ padding: '10px 12px', color: T.teal }}>{t.ghgAbatement} tCO₂e/MWh</td>
                    <td style={{ padding: '10px 12px' }}><Pill label={t.maturity} color={t.maturity === 'Mature' ? T.green : t.maturity === 'Commercial' ? T.accent : T.amber} /></td>
                    <td style={{ padding: '10px 12px', color: T.sub, fontSize: 11 }}>{t.capacity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setFilterTech('All')} style={{ background: filterTech === 'All' ? T.accent : T.card, color: filterTech === 'All' ? '#fff' : T.sub, border: `1px solid ${filterTech === 'All' ? T.accent : T.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>All</button>
            {TECHNOLOGIES.map(t => (
              <button key={t.code} onClick={() => setFilterTech(t.code)} style={{ background: filterTech === t.code ? T.accent : T.card, color: filterTech === t.code ? '#fff' : T.sub, border: `1px solid ${filterTech === t.code ? T.accent : T.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{t.code}</button>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Project', 'Tech', 'Capacity (MW)', 'CapEx ($M)', 'Gate Fee ($/t)', 'Equity IRR', 'Gearing %', 'Tenor (yr)', 'Status', 'Region'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((p, i) => (
                    <tr key={p.name} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 === 0 ? T.bg + '55' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '10px 12px' }}><Pill label={p.tech} color={T.indigo} /></td>
                      <td style={{ padding: '10px 12px' }}>{p.capacityMW}</td>
                      <td style={{ padding: '10px 12px', color: T.amber }}>${p.capexM}M</td>
                      <td style={{ padding: '10px 12px' }}>${p.gateFeePerT}</td>
                      <td style={{ padding: '10px 12px', color: T.green, fontWeight: 700 }}>{p.irr}%</td>
                      <td style={{ padding: '10px 12px' }}>{p.debtGearing}%</td>
                      <td style={{ padding: '10px 12px' }}>{p.tenorYrs}yr</td>
                      <td style={{ padding: '10px 12px' }}><Pill label={p.status} color={p.status === 'Operating' ? T.green : p.status === 'Construction' ? T.accent : T.amber} /></td>
                      <td style={{ padding: '10px 12px' }}><Pill label={p.region} color={T.indigo} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>IRR Sensitivity to Gate Fee</h3>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="gateFee" name="Gate Fee ($/t)" stroke={T.muted} tick={{ fontSize: 11 }} label={{ value: 'Gate Fee ($/t)', position: 'insideBottom', offset: -5, fill: T.muted, fontSize: 11 }} />
                <YAxis dataKey="irr" name="Equity IRR %" stroke={T.muted} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Projects" data={IRREVOL_CHART} fill={T.accent} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Project Economics Calculator</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ color: T.muted, fontSize: 12 }}>Capacity (MW): {capacityMW}</label>
                <input type="range" min={1} max={100} value={capacityMW} onChange={e => setCapacityMW(+e.target.value)} style={{ width: '100%', marginTop: 8 }} />
              </div>
              <div>
                <label style={{ color: T.muted, fontSize: 12 }}>Gate Fee ($/t): {gateFeeSel}</label>
                <input type="range" min={20} max={140} value={gateFeeSel} onChange={e => setGateFeeSel(+e.target.value)} style={{ width: '100%', marginTop: 8 }} />
              </div>
              <div>
                <label style={{ color: T.muted, fontSize: 12 }}>Electricity Price ($/MWh): {electricityPrice}</label>
                <input type="range" min={40} max={200} value={electricityPrice} onChange={e => setElectricityPrice(+e.target.value)} style={{ width: '100%', marginTop: 8 }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              <KpiCard label="Est. Annual Revenue" value={`$${annualRevenue}M`} sub="Power + gate fee" color={T.green} />
              <KpiCard label="Est. Equity IRR" value={`${estimatedIRR}%`} sub="Blended assumptions" color={T.accent} />
              <KpiCard label="Annual GHG Abatement" value={`${(capacityMW * 8760 * 0.85 * 0.42 / 1000).toFixed(1)}kt`} sub="CO₂e avoided" color={T.teal} />
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>25-Year Project Cash Flow ($M)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={CF_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" stroke={T.muted} tick={{ fontSize: 11 }} />
                <YAxis stroke={T.muted} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={T.green} fill={T.green + '33'} stackId="1" />
                <Area type="monotone" dataKey="opex" name="OpEx" stroke={T.amber} fill={T.amber + '22'} stackId="2" />
                <Area type="monotone" dataKey="debt" name="Debt Service" stroke={T.red} fill={T.red + '22'} stackId="2" />
                <Line type="monotone" dataKey="fcf" name="Free Cash Flow" stroke={T.accent} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Policy Support Landscape</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Country', 'Policy / Scheme', 'Support Mechanism', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {POLICY_DATA.map((p, i) => (
                    <tr key={p.country} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 === 0 ? T.bg + '55' : 'transparent' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{p.country}</td>
                      <td style={{ padding: '10px 14px', color: T.sub, fontSize: 12 }}>{p.policy}</td>
                      <td style={{ padding: '10px 14px', color: T.sub, fontSize: 12 }}>{p.support}</td>
                      <td style={{ padding: '10px 14px' }}><Pill label={p.status} color={T.green} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { title: 'Green Finance Instruments', items: ['Project Finance (PF) — non-recourse, gate fee as primary collateral', 'Green Bonds — EIB Green Bond Standard eligible for biogas projects', 'Infrastructure Debt Funds — long-duration (15–25yr) WtE assets', 'EBRD/IFC Climate Finance — concessional lending for EM waste infrastructure', 'EU Taxonomy Article 13.1 — EfW eligible under specific waste hierarchy conditions', 'GIB / UK IIB — co-investment for UK waste infrastructure gap'] },
              { title: 'Key Finance Risks', items: ['Feedstock volume & composition variability — offtake contract critical', 'Technology performance risk — EPC wrap and O&M guarantees required', 'Landfill tax trajectory — gate fee supported by rising landfill costs', 'Merchant power price — hedge via CfD/FiT for minimum 10yr tenor', 'Permitting & planning risk — 2–4yr timeline for large EfW', 'Regulatory reclassification — Art. 17 EU Taxonomy "do no significant harm" exclusions'] },
            ].map(s => (
              <div key={s.title} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.accent }}>{s.title}</h3>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {s.items.map(it => <li key={it} style={{ color: T.sub, fontSize: 12, marginBottom: 6 }}>{it}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
