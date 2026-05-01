import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const T = {
  bg: '#EFF6FF', card: '#FFFFFF', border: '#BFDBFE', text: '#1E3A5F',
  sub: '#1E40AF', accent: '#2563EB', light: '#DBEAFE',
  ocean: '#0891B2', alkalinity: '#0D9488', kelp: '#16A34A',
  red: '#DC2626', amber: '#D97706', purple: '#7C3AED',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const CDR_APPROACHES = [
  { id: 'OAE', name: 'Ocean Alkalinity Enhancement', lcoc: 50, potential: 1000, permanence: 10000, maturity: 'R&D / Pilot', risk: 'Medium', co2Mechanism: 'Alkalinity addition shifts ocean carbonate chemistry' },
  { id: 'Kelp', name: 'Macroalgae / Kelp Farming', lcoc: 200, potential: 500, permanence: 100, maturity: 'Pilot', risk: 'High', co2Mechanism: 'Biomass CDR via subduction or burial on seafloor' },
  { id: 'Seaweed-Burial', name: 'Seaweed Sinking / Burial', lcoc: 150, potential: 300, permanence: 1000, maturity: 'R&D', risk: 'High', co2Mechanism: 'Sinking biomass to deep ocean sequesters carbon' },
  { id: 'ARIEL', name: 'Artificial Upwelling', lcoc: 300, potential: 200, permanence: 500, maturity: 'Early R&D', risk: 'Very High', co2Mechanism: 'Stimulating biological pump via nutrient upwelling' },
  { id: 'ElectroChem', name: 'Electrochemical CDR', lcoc: 400, potential: 100, permanence: 10000, maturity: 'Lab Scale', risk: 'High', co2Mechanism: 'Direct CO₂ extraction from seawater via electrolysis' },
  { id: 'OceanFert', name: 'Ocean Iron Fertilisation', lcoc: 25, potential: 3000, permanence: 100, maturity: 'Experimental', risk: 'Very High', co2Mechanism: 'Stimulates phytoplankton blooms; high leakage risk' },
];

const PROJECTS = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  approach: CDR_APPROACHES[i % CDR_APPROACHES.length].id,
  operator: ['Running Tide', 'Ebb Carbon', 'Planetary', 'Seafields', 'Calcarea', 'Equatic', 'Captura', 'Carbyne', 'Brilliant Planet', 'Ocean Visions'][i % 10],
  location: ['North Atlantic', 'Pacific Northwest', 'Mediterranean', 'Arabian Sea', 'North Sea', 'Caribbean', 'Southern Ocean', 'Bering Sea', 'Bay of Bengal', 'Coral Sea'][i % 10],
  lcoc: Math.round(CDR_APPROACHES[i % CDR_APPROACHES.length].lcoc * (0.8 + sr(i * 17) * 0.4)),
  annualCDR: Math.round(500 + sr(i * 23) * 49500),
  permanence: CDR_APPROACHES[i % CDR_APPROACHES.length].permanence,
  fundingStage: ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Grant', 'Pilot Contract'][i % 6],
  creditPrice: Math.round(40 + sr(i * 31) * 160),
  buyer: ['Stripe Frontier', 'Microsoft', 'Shopify', 'Google', 'Meta', 'Breakthrough Energy'][i % 6],
  mrvApproach: ['Autonomous floats', 'Ship-based sampling', 'Satellite + AI', 'In-situ sensors', 'Isotope tracing', 'Model-based'][i % 6],
}));

const MARKET_SIZING = Array.from({ length: 10 }, (_, i) => ({
  year: 2024 + i,
  oae: Math.round(0.1 * Math.pow(2.5, i)),
  kelp: Math.round(0.05 * Math.pow(2.2, i)),
  electrochem: Math.round(0.02 * Math.pow(2.0, i)),
  total: Math.round(0.17 * Math.pow(2.4, i)),
}));

const MRV_CHALLENGES = [
  { challenge: 'Baseline Quantification', score: 35, description: 'Establishing ocean carbon baselines is analytically complex and expensive' },
  { challenge: 'Additionality Proof', score: 40, description: 'Demonstrating incremental CO₂ uptake beyond natural variability' },
  { challenge: 'Permanence Uncertainty', score: 55, description: 'Deep ocean carbon residence times are uncertain; outgassing risk' },
  { challenge: 'Ecosystem Risk', score: 30, description: 'Potential side effects on marine ecosystems and biodiversity' },
  { challenge: 'Measurement Scalability', score: 45, description: 'Cost of ocean monitoring at project scale remains prohibitive' },
  { challenge: 'Registry Acceptance', score: 60, description: 'Few registries have approved ocean CDR methodologies yet' },
];

const TABS = ['Overview', 'Technology Analysis', 'Project Pipeline', 'MRV & Permanence', 'Market Sizing', 'Investment Landscape'];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.accent }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Pill = ({ label, color }) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{label}</span>
);

export default function OceanCdrFinancePage() {
  const [tab, setTab] = useState(0);
  const [approachFilter, setApproachFilter] = useState('All');

  const filtered = useMemo(() => {
    return approachFilter === 'All' ? PROJECTS : PROJECTS.filter(p => p.approach === approachFilter);
  }, [approachFilter]);

  const kpis = useMemo(() => {
    const n = filtered.length || 1;
    return {
      avgLcoc: Math.round(filtered.reduce((a, p) => a + p.lcoc, 0) / n),
      totalCDR: Math.round(filtered.reduce((a, p) => a + p.annualCDR, 0) / 1000),
      avgPrice: Math.round(filtered.reduce((a, p) => a + p.creditPrice, 0) / n),
      seriesA: filtered.filter(p => p.fundingStage === 'Series A' || p.fundingStage === 'Series B').length,
    };
  }, [filtered]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ background: T.ocean + '22', color: T.ocean, border: `1px solid ${T.ocean}44`, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>EP-EH4</span>
            <span style={{ fontSize: 12, color: T.sub }}>Ocean CDR Finance</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>Ocean CDR Finance Platform</h1>
          <p style={{ color: T.sub, marginTop: 4, fontSize: 14 }}>Ocean alkalinity enhancement, kelp farming, electrochemical CDR — MRV maturity, permanence economics, and frontier credit markets</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <KpiCard label="Avg LCOC" value={`$${kpis.avgLcoc}`} sub="per tCO₂ removed" color={T.ocean} />
          <KpiCard label="Pipeline CDR" value={`${kpis.totalCDR}k`} sub="tCO₂/yr potential" color={T.alkalinity} />
          <KpiCard label="Avg Credit Price" value={`$${kpis.avgPrice}`} sub="frontier OTC market" color={T.accent} />
          <KpiCard label="Venture-Stage" value={kpis.seriesA} sub="Series A/B projects" color={T.purple} />
          <KpiCard label="Approaches" value={CDR_APPROACHES.length} sub="active ocean CDR pathways" color={T.kelp} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: tab === i ? T.ocean : T.light, color: tab === i ? '#fff' : T.text, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {CDR_APPROACHES.map(a => (
              <div key={a.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{a.name}</span>
                  <Pill label={a.maturity} color={a.maturity === 'Pilot' ? T.amber : a.maturity === 'R&D / Pilot' ? T.ocean : T.red} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: T.sub }}>LCOC: <span style={{ fontWeight: 700, color: T.ocean }}>${a.lcoc}/t</span></div>
                  <div style={{ fontSize: 12, color: T.sub }}>Potential: <span style={{ fontWeight: 700 }}>{a.potential} Mt/yr</span></div>
                  <div style={{ fontSize: 12, color: T.sub }}>Permanence: <span style={{ fontWeight: 700 }}>{a.permanence.toLocaleString()} yr</span></div>
                  <div style={{ fontSize: 12, color: T.sub }}>Risk: <span style={{ fontWeight: 700, color: a.risk === 'Very High' ? T.red : a.risk === 'High' ? T.amber : T.kelp }}>{a.risk}</span></div>
                </div>
                <p style={{ fontSize: 12, color: T.sub, margin: 0 }}>{a.co2Mechanism}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>LCOC by Ocean CDR Approach ($/tCO₂)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={CDR_APPROACHES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="lcoc" fill={T.ocean} radius={[4, 4, 0, 0]} name="LCOC ($/tCO₂)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>CDR Potential by Approach (GtCO₂/yr)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={CDR_APPROACHES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="potential" fill={T.alkalinity} radius={[4, 4, 0, 0]} name="Potential (MtCO₂/yr)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>LCOC vs Permanence (Frontier Trade-off)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="permanence" name="Permanence (yr)" tick={{ fontSize: 11 }} label={{ value: 'Permanence (yr)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="lcoc" name="LCOC" tick={{ fontSize: 11 }} label={{ value: '$/tCO₂', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={CDR_APPROACHES} fill={T.ocean} fillOpacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              {['All', ...CDR_APPROACHES.map(a => a.id)].map(f => (
                <button key={f} onClick={() => setApproachFilter(f)} style={{ padding: '4px 12px', borderRadius: 12, border: `1px solid ${T.border}`, background: approachFilter === f ? T.ocean : T.card, color: approachFilter === f ? '#fff' : T.text, fontSize: 12, cursor: 'pointer' }}>{f}</button>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: T.light }}>{['#','Approach','Operator','Location','LCOC ($/t)','CDR (t/yr)','Permanence','Funding','Credit $','Buyer','MRV'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: T.ocean }}>{p.id}</td>
                      <td style={{ padding: '8px 12px' }}>{p.approach}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.operator}</td>
                      <td style={{ padding: '8px 12px' }}>{p.location}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>${p.lcoc}</td>
                      <td style={{ padding: '8px 12px' }}>{p.annualCDR.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px' }}>{p.permanence.toLocaleString()} yr</td>
                      <td style={{ padding: '8px 12px' }}><Pill label={p.fundingStage} color={p.fundingStage.includes('Series') ? T.kelp : T.amber} /></td>
                      <td style={{ padding: '8px 12px', color: T.alkalinity, fontWeight: 600 }}>${p.creditPrice}</td>
                      <td style={{ padding: '8px 12px' }}>{p.buyer}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11 }}>{p.mrvApproach}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>MRV Readiness Radar</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={MRV_CHALLENGES}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="challenge" tick={{ fontSize: 10 }} />
                  <Radar name="Readiness Score" dataKey="score" stroke={T.ocean} fill={T.ocean} fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>MRV Challenge Scores</h3>
              {MRV_CHALLENGES.map(c => (
                <div key={c.challenge} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: T.text }}>{c.challenge}</span>
                    <span style={{ color: T.ocean, fontWeight: 700 }}>{c.score}/100</span>
                  </div>
                  <div style={{ background: T.light, borderRadius: 4, height: 8 }}>
                    <div style={{ background: T.ocean, borderRadius: 4, height: 8, width: `${c.score}%` }} />
                  </div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>{c.description}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Permanence Duration by Approach</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={CDR_APPROACHES} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="id" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="permanence" fill={T.alkalinity} radius={[0, 4, 4, 0]} name="Permanence (yr)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Ocean CDR Market Volume Forecast (MtCO₂)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={MARKET_SIZING}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="oae" stroke={T.ocean} fill={T.ocean + '33'} name="OAE" stackId="1" />
                  <Area type="monotone" dataKey="kelp" stroke={T.kelp} fill={T.kelp + '33'} name="Kelp/Seaweed" stackId="1" />
                  <Area type="monotone" dataKey="electrochem" stroke={T.alkalinity} fill={T.alkalinity + '33'} name="ElectroChem" stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Total Ocean CDR Market Trajectory</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={MARKET_SIZING}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke={T.ocean} strokeWidth={3} name="Total Market (Mt)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Key Ocean CDR Investors & Buyers (2024)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {[
                  { name: 'Stripe Frontier', type: 'Offtake Buyer', commitment: '$925M portfolio-wide', focus: 'Pre-commercial ocean CDR' },
                  { name: 'Microsoft', type: 'Offtake Buyer', commitment: '$200M+ CDR commitments', focus: 'Biochar, BECCS, ocean' },
                  { name: 'Breakthrough Energy', type: 'VC / R&D Funder', commitment: 'Undisclosed', focus: 'Technology development' },
                  { name: 'Lowercarbon Capital', type: 'Venture Capital', commitment: '$350M Climate Fund', focus: 'Ocean + DAC startups' },
                  { name: 'Prelude Ventures', type: 'Venture Capital', commitment: '$250M', focus: 'Marine CDR and ocean biotech' },
                  { name: 'Google / DeepMind', type: 'Research Partner', commitment: 'AI-for-MRV collaboration', focus: 'Ocean monitoring systems' },
                ].map(inv => (
                  <div key={inv.name} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                    <div style={{ fontWeight: 700, color: T.text, marginBottom: 6 }}>{inv.name}</div>
                    <Pill label={inv.type} color={inv.type.includes('Buyer') ? T.alkalinity : inv.type === 'Venture Capital' ? T.purple : T.ocean} />
                    <div style={{ fontSize: 12, color: T.sub, marginTop: 8 }}>Commitment: {inv.commitment}</div>
                    <div style={{ fontSize: 12, color: T.accent, marginTop: 4 }}>Focus: {inv.focus}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
