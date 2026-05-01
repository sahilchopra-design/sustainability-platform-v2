import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#0f172a', card: '#1e293b', border: '#334155', muted: '#94a3b8',
  text: '#f1f5f9', sub: '#cbd5e1', accent: '#F97316',
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

const REGIONS = Array.from({ length: 22 }, (_, i) => ({
  name: ['Appalachia, USA', 'Ruhr Valley, DE', 'Silesia, PL', 'Mpumalanga, ZA', 'Jharkhand, IN', 'Inner Mongolia, CN', 'Limpopo, ZA', 'Hunter Valley, AU', 'Asturias, ES', 'Nord-Pas-de-Calais, FR', 'Donbas, UA', 'Zambia Copperbelt', 'Thar Desert, PK', 'Sumatra, ID', 'Bangladesh Coast', 'Niger Delta, NG', 'Texas Permian, US', 'Kiruna, SE', 'Vossloh Valley, DE', 'Kuznetsk Basin, RU', 'Cerrejon, CO', 'Hunter Valley B, AU'][i],
  country: ['USA', 'DE', 'PL', 'ZA', 'IN', 'CN', 'ZA', 'AU', 'ES', 'FR', 'UA', 'ZM', 'PK', 'ID', 'BD', 'NG', 'US', 'SE', 'DE', 'RU', 'CO', 'AU'][i],
  fossilDependency: Math.round(sr(i * 7) * 60 + 30),
  workers: Math.round(sr(i * 11) * 80000 + 5000),
  gdpShareFossil: Math.round(sr(i * 5) * 35 + 15),
  vulnerabilityScore: Math.round(sr(i * 13) * 40 + 40),
  adaptFinanceGap: Math.round(sr(i * 9) * 800 + 100),
  renewableJobPotential: Math.round(sr(i * 3) * 60000 + 2000),
  justicePillar: ['Procedural', 'Distributive', 'Restorative', 'All Three'][Math.floor(sr(i * 17) * 4)],
  transitionPlan: ['Yes', 'Draft', 'None'][Math.floor(sr(i * 19) * 3)],
}));

const FINANCE_MECHANISMS = [
  { mechanism: 'EU Just Transition Fund (JTF)', size: 17.5, region: 'EU', focus: 'Coal regions economic diversification', alignment: 'Art.2(1) Paris', instrument: 'Grant' },
  { mechanism: 'South Africa Just Energy Transition Partnership', size: 8.5, region: 'Africa', focus: 'Coal workers + EM adaptation', alignment: 'COP26 JETP', instrument: 'Blended' },
  { mechanism: 'Indonesia JETP', size: 20.0, region: 'APAC', focus: 'Sumatran coal + coastal adaptation', alignment: 'COP27 JETP', instrument: 'Blended' },
  { mechanism: 'India JETP', size: 15.5, region: 'APAC', focus: 'Jharkhand coal districts', alignment: 'COP27 JETP', instrument: 'Blended' },
  { mechanism: 'US Inflation Reduction Act §48C', size: 10.0, region: 'N.America', focus: 'Coal community economic reinvestment', alignment: 'IRA 2022', instrument: 'Tax Credit' },
  { mechanism: 'JTIP (World Bank Group)', size: 4.2, region: 'Global', focus: 'Coal community livelihoods', alignment: 'Paris / SDGs', instrument: 'IFC + IBRD' },
  { mechanism: 'UK JT Platform', size: 1.8, region: 'UK', focus: 'North Sea decommissioning', alignment: 'North Sea plan', instrument: 'Grant + Equity' },
  { mechanism: 'ADB Energy Transition Mechanism', size: 3.5, region: 'APAC', focus: 'Coal plant early retirement', alignment: 'COP26 ETM', instrument: 'Blended Finance' },
];

const SOCIAL_RADAR = [
  { metric: 'Income Equity', fossil: 42, transition: 68, adaptation: 74 },
  { metric: 'Employment Access', fossil: 58, transition: 72, adaptation: 66 },
  { metric: 'Community Voice', fossil: 35, transition: 62, adaptation: 78 },
  { metric: 'Gender Inclusion', fossil: 38, transition: 64, adaptation: 80 },
  { metric: 'Indigenous Rights', fossil: 28, transition: 58, adaptation: 72 },
  { metric: 'Health & Safety', fossil: 52, transition: 74, adaptation: 82 },
];

const JOBS_DATA = [
  { sector: 'Solar PV', jobsCreated: 820, lostFromFossil: 0, net: 820, region: 'Global' },
  { sector: 'Wind Onshore', jobsCreated: 650, lostFromFossil: 0, net: 650, region: 'Global' },
  { sector: 'Green H₂', jobsCreated: 380, lostFromFossil: 0, net: 380, region: 'EU/APAC' },
  { sector: 'Coal Mining', jobsCreated: 0, lostFromFossil: 420, net: -420, region: 'Global' },
  { sector: 'Oil & Gas', jobsCreated: 0, lostFromFossil: 280, net: -280, region: 'Global' },
  { sector: 'Adaptation Infra', jobsCreated: 540, lostFromFossil: 0, net: 540, region: 'EM-focus' },
  { sector: 'Reforestation', jobsCreated: 190, lostFromFossil: 0, net: 190, region: 'Tropics' },
  { sector: 'Circular Economy', jobsCreated: 310, lostFromFossil: 0, net: 310, region: 'Global' },
];

const INVESTMENT_TREND = Array.from({ length: 7 }, (_, i) => ({
  year: 2020 + i,
  fossil: Math.round(1800 - i * 80 + sr(i * 7) * 60),
  cleanEnergy: Math.round(280 + i * 120 + sr(i * 11) * 40),
  adaptation: Math.round(46 + i * 22 + sr(i * 13) * 12),
  justTransition: Math.round(8 + i * 14 + sr(i * 9) * 6),
}));

const TABS = ['Overview', 'Regional Vulnerability', 'Finance Mechanisms', 'Jobs Transition', 'Social Justice Radar', 'Investment Flow'];

export default function JustTransitionAdaptationPage() {
  const [tab, setTab] = useState(0);
  const [sortField, setSortField] = useState('vulnerabilityScore');
  const [planFilter, setPlanFilter] = useState('All');

  const filteredRegions = planFilter === 'All' ? REGIONS : REGIONS.filter(r => r.transitionPlan === planFilter);
  const sortedRegions = useMemo(() => [...filteredRegions].sort((a, b) => b[sortField] - a[sortField]), [filteredRegions, sortField]);

  const totalWorkers = REGIONS.reduce((a, b) => a + b.workers, 0);
  const avgVulnerability = REGIONS.reduce((a, b) => a + b.vulnerabilityScore, 0) / REGIONS.length;
  const totalFinanceGap = REGIONS.reduce((a, b) => a + b.adaptFinanceGap, 0);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: 'Inter,sans-serif', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ background: T.accent + '22', border: `1px solid ${T.accent}`, borderRadius: 8, padding: '4px 12px', fontSize: 11, color: T.accent, fontWeight: 700 }}>EP-EK6</div>
          <Pill label="Just Transition" color={T.accent} />
          <Pill label="Climate Adaptation" color={T.teal} />
          <Pill label="Social Equity Finance" color={T.green} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Just Transition & Adaptation</h1>
        <p style={{ color: T.muted, marginTop: 6, fontSize: 14 }}>Regional vulnerability assessment for fossil fuel communities, just transition finance mechanisms, job displacement analytics, social justice indicators, and blended finance structuring for equitable adaptation.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Workers at Risk (dataset)" value={`${(totalWorkers / 1000).toFixed(0)}K`} sub="Fossil fuel dependent" color={T.accent} />
        <KpiCard label="Avg Vulnerability Score" value={`${avgVulnerability.toFixed(0)}/100`} sub="22 regions tracked" color={T.red} />
        <KpiCard label="Adaptation Finance Gap" value={`$${(totalFinanceGap / 1000).toFixed(1)}Bn`} sub="Dataset regions total" color={T.amber} />
        <KpiCard label="JETP Commitments" value="$147Bn" sub="COP26/27 pledges" color={T.green} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ background: tab === i ? T.accent : T.card, color: tab === i ? '#fff' : T.sub, border: `1px solid ${tab === i ? T.accent : T.border}`, borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Investment Flow by Category ($Bn)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={INVESTMENT_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" stroke={T.muted} tick={{ fontSize: 11 }} />
                  <YAxis stroke={T.muted} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Legend />
                  <Area type="monotone" dataKey="cleanEnergy" name="Clean Energy" stroke={T.green} fill={T.green + '33'} />
                  <Area type="monotone" dataKey="adaptation" name="Adaptation" stroke={T.blue} fill={T.blue + '22'} />
                  <Area type="monotone" dataKey="justTransition" name="Just Transition" stroke={T.accent} fill={T.accent + '22'} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Net Jobs by Sector (Thousands)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={JOBS_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" stroke={T.muted} tick={{ fontSize: 9 }} />
                  <YAxis stroke={T.muted} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Bar dataKey="net" name="Net Jobs (K)" fill={T.accent} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {[['vulnerabilityScore', 'Vulnerability'], ['workers', 'Workers at Risk'], ['adaptFinanceGap', 'Finance Gap'], ['renewableJobPotential', 'RE Job Potential']].map(([f, l]) => (
              <button key={f} onClick={() => setSortField(f)} style={{ background: sortField === f ? T.accent : T.card, color: sortField === f ? '#fff' : T.sub, border: `1px solid ${sortField === f ? T.accent : T.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{l}</button>
            ))}
            {['All', 'Yes', 'Draft', 'None'].map(p => (
              <button key={p} onClick={() => setPlanFilter(p)} style={{ background: planFilter === p ? T.teal : T.card, color: planFilter === p ? '#fff' : T.sub, border: `1px solid ${planFilter === p ? T.teal : T.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Plan: {p}</button>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Region', 'Country', 'Fossil Dependency', 'Workers at Risk', 'GDP Share', 'Vulnerability', 'Finance Gap ($M)', 'RE Job Potential', 'Justice Pillar', 'Transition Plan'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRegions.map((r, i) => (
                    <tr key={r.name} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 === 0 ? T.bg + '55' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 11 }}>{r.name}</td>
                      <td style={{ padding: '10px 12px' }}>{r.country}</td>
                      <td style={{ padding: '10px 12px' }}>{r.fossilDependency}%</td>
                      <td style={{ padding: '10px 12px', color: T.amber }}>{r.workers.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px' }}>{r.gdpShareFossil}%</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 50, height: 6, background: T.border, borderRadius: 3 }}>
                            <div style={{ width: `${r.vulnerabilityScore}%`, height: '100%', background: r.vulnerabilityScore > 70 ? T.red : r.vulnerabilityScore > 55 ? T.amber : T.green, borderRadius: 3 }} />
                          </div>
                          <span>{r.vulnerabilityScore}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', color: T.red }}>${r.adaptFinanceGap}M</td>
                      <td style={{ padding: '10px 12px', color: T.green }}>{r.renewableJobPotential.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px' }}><Pill label={r.justicePillar} color={T.indigo} /></td>
                      <td style={{ padding: '10px 12px' }}><Pill label={r.transitionPlan} color={r.transitionPlan === 'Yes' ? T.green : r.transitionPlan === 'Draft' ? T.amber : T.red} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Just Transition Finance Mechanisms</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FINANCE_MECHANISMS.map(m => (
              <div key={m.mechanism} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{m.mechanism}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Pill label={m.region} color={T.indigo} />
                    <Pill label={m.instrument} color={T.accent} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                  <div style={{ color: T.sub, fontSize: 12 }}>{m.focus}</div>
                  <div>
                    <div style={{ color: T.muted, fontSize: 11 }}>Committed ($Bn)</div>
                    <div style={{ color: T.green, fontWeight: 700, fontSize: 16 }}>${m.size}Bn</div>
                  </div>
                  <div>
                    <div style={{ color: T.muted, fontSize: 11 }}>Policy Anchor</div>
                    <div style={{ color: T.teal, fontSize: 12 }}>{m.alignment}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Net Jobs Created / Lost by Sector</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={JOBS_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" stroke={T.muted} tick={{ fontSize: 10 }} />
                <YAxis stroke={T.muted} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="jobsCreated" name="Jobs Created" fill={T.green} stackId="a" />
                <Bar dataKey="lostFromFossil" name="Jobs Lost" fill={T.red} stackId="b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {JOBS_DATA.filter(j => j.net !== 0).slice(0, 4).map(j => (
              <div key={j.sector} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ color: T.muted, fontSize: 12 }}>{j.sector}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: j.net > 0 ? T.green : T.red, marginTop: 4 }}>{j.net > 0 ? `+${j.net}K` : `${j.net}K`}</div>
                <div style={{ color: T.sub, fontSize: 11, marginTop: 4 }}>{j.region}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Social Justice Outcomes: Fossil vs. Transition vs. Adaptation</h3>
          <ResponsiveContainer width="100%" height={360}>
            <RadarChart data={SOCIAL_RADAR}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="metric" tick={{ fill: T.muted, fontSize: 11 }} />
              <Radar name="Fossil Economy" dataKey="fossil" stroke={T.red} fill={T.red + '22'} />
              <Radar name="Just Transition" dataKey="transition" stroke={T.accent} fill={T.accent + '33'} />
              <Radar name="Adaptation Focus" dataKey="adaptation" stroke={T.green} fill={T.green + '22'} />
              <Legend />
              <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            { title: 'Just Transition Principles (ILO / COP26)', items: ['Social dialogue and community consultation before plant closures', 'Labour rights protection: severance, retraining, early retirement', 'Territorial development: place-based investment in affected regions', 'Gender and indigenous inclusion in planning and benefit sharing', 'Access to adaptation finance for most climate-vulnerable workers', 'Monitoring & accountability: public reporting of transition outcomes'] },
            { title: 'JETP Structure & Governance', items: ['Country-led Investment Plan (IP) — 12–18 months post-announcement', 'International Partners Group (IPG) — G7 + bilateral + MDB donors', 'Private finance mobilisation: concessional public capital crowds in private', 'Grant element: typically 10–25% of total JETP commitment', 'Conditionality: coal phase-out timeline, emissions trajectory, social safeguards', 'Gender and social equity annex — ILO / Oxfam partner review requirement'] },
            { title: 'Adaptation Equity Assessment', items: ['Climate justice screening: rank communities by compound vulnerability', 'Exposure + sensitivity + adaptive capacity (IPCC WGII framework)', 'Historical emissions contribution vs. current climate impact (loss & damage framing)', 'Asset gap: climate-vulnerable communities lack collateral for finance access', 'Insurance gap: low-income households excluded from flood/crop insurance', 'Just Adaptation Index: combine physical risk, social vulnerability, finance access'] },
            { title: 'Investor Frameworks', items: ['ILO Just Transition Finance Guidelines (2024) — institutional investor toolkit', 'PRI Signatory Guidance — social factors in climate transition assessment', 'UNPRI Just Transition Due Diligence: community impact screening for steel/coal', 'EU Platform on Sustainable Finance — social taxonomy (2024 draft)', 'IFC PS 2: Labour and Working Conditions — applicable to JETP project finance', 'GRI 409 Forced or Compulsory Labour — applicable to supply chain disclosure'] },
          ].map(s => (
            <div key={s.title} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.accent }}>{s.title}</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {s.items.map(it => <li key={it} style={{ color: T.sub, fontSize: 12, marginBottom: 6 }}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
