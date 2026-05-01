import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const T = {
  bg: '#F0FDFA', card: '#FFFFFF', border: '#99F6E4', text: '#134E4A',
  sub: '#0F766E', accent: '#0D9488', light: '#CCFBF1',
  blue: '#2563EB', amber: '#D97706', red: '#DC2626',
  purple: '#7C3AED', green: '#16A34A',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const INFRA_SECTORS = [
  { sector: 'Transport (Roads/Rail)', climateRisk: 65, adaptCost: 2.8, adaptBenefit: 8.5, resilienceScore: 58, nbs: 25 },
  { sector: 'Water & Sanitation', climateRisk: 75, adaptCost: 1.9, adaptBenefit: 12.0, resilienceScore: 48, nbs: 45 },
  { sector: 'Energy Networks', climateRisk: 60, adaptCost: 1.5, adaptBenefit: 6.8, resilienceScore: 62, nbs: 15 },
  { sector: 'Coastal Infrastructure', climateRisk: 85, adaptCost: 3.5, adaptBenefit: 15.0, resilienceScore: 42, nbs: 55 },
  { sector: 'Urban Infrastructure', climateRisk: 70, adaptCost: 2.2, adaptBenefit: 9.5, resilienceScore: 55, nbs: 40 },
  { sector: 'Telecom / Digital', climateRisk: 45, adaptCost: 0.8, adaptBenefit: 3.5, resilienceScore: 72, nbs: 10 },
];

const PROJECTS = Array.from({ length: 22 }, (_, i) => ({
  id: i + 1,
  name: ['Coastal Flood Barrier', 'Urban Cooling Corridor', 'Climate-Resilient Rail', 'Smart Water Grid', 'Green Roof Network', 'Flood-Proof Road', 'Resilient Energy Hub', 'NbS Drainage', 'Heat-Resilient Bridge', 'Adaptive Port'][i % 10] + ` ${i + 1}`,
  sector: INFRA_SECTORS[i % INFRA_SECTORS.length].sector,
  country: ['Netherlands', 'USA', 'Bangladesh', 'India', 'UK', 'Australia', 'Japan', 'Singapore', 'Denmark', 'Canada'][i % 10],
  capex: Math.round(50 + sr(i * 13) * 950),
  adaptBcr: (1.5 + sr(i * 19) * 8.5).toFixed(1),
  climateProofing: Math.round(20 + sr(i * 23) * 55),
  lifetimeYears: Math.round(25 + sr(i * 29) * 55),
  ifc_ps: `PS ${1 + i % 8}`,
  gcfAligned: sr(i * 37) > 0.5,
  nbsComponent: sr(i * 41) > 0.4,
  irr: (5 + sr(i * 47) * 9).toFixed(1),
}));

const ADAPT_RETURNS = [
  { horizon: '5yr', traditional: 4.5, climateSmart: 5.8, nbs: 6.2 },
  { horizon: '10yr', traditional: 4.8, climateSmart: 6.5, nbs: 7.1 },
  { horizon: '20yr', traditional: 5.0, climateSmart: 7.8, nbs: 9.2 },
  { horizon: '30yr', traditional: 5.1, climateSmart: 9.2, nbs: 11.5 },
  { horizon: '50yr', traditional: 4.8, climateSmart: 11.0, nbs: 14.2 },
];

const IFC_STANDARDS = [
  { ps: 'PS 1', title: 'Assessment & Management of E&S Risks', climate: 'Climate risk assessment required in E&S risk identification' },
  { ps: 'PS 2', title: 'Labour & Working Conditions', climate: 'Heat stress protocols for outdoor workers' },
  { ps: 'PS 3', title: 'Resource Efficiency & Pollution Prevention', climate: 'GHG reporting; energy efficiency targets' },
  { ps: 'PS 4', title: 'Community Health, Safety & Security', climate: 'Climate-related community hazards; flood/heat risk' },
  { ps: 'PS 5', title: 'Land Acquisition & Involuntary Resettlement', climate: 'Climate-driven displacement; planned relocation' },
  { ps: 'PS 6', title: 'Biodiversity Conservation', climate: 'NbS preferred; ecosystem services baseline' },
  { ps: 'PS 7', title: 'Indigenous Peoples', climate: 'Climate vulnerability of indigenous communities' },
  { ps: 'PS 8', title: 'Cultural Heritage', climate: 'Climate risk to cultural heritage assets' },
];

const TABS = ['Overview', 'Sector Analysis', 'Project Pipeline', 'Adapt BCR', 'IFC Standards', 'GCF & Finance'];

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

export default function ClimateSmartInfrastructurePage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');

  const filtered = useMemo(() => sectorFilter === 'All' ? PROJECTS : PROJECTS.filter(p => p.sector === sectorFilter), [sectorFilter]);

  const kpis = useMemo(() => {
    const n = filtered.length || 1;
    return {
      avgBcr: (filtered.reduce((a, p) => a + parseFloat(p.adaptBcr), 0) / n).toFixed(1),
      totalCapex: Math.round(filtered.reduce((a, p) => a + p.capex, 0) / 1000),
      nbsPct: Math.round((filtered.filter(p => p.nbsComponent).length / n) * 100),
      gcfPct: Math.round((filtered.filter(p => p.gcfAligned).length / n) * 100),
    };
  }, [filtered]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ background: T.accent + '22', color: T.accent, border: `1px solid ${T.accent}44`, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>EP-EI6</span>
            <span style={{ fontSize: 12, color: T.sub }}>Climate-Smart Infrastructure Finance</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>Climate-Smart Infrastructure Finance Platform</h1>
          <p style={{ color: T.sub, marginTop: 4, fontSize: 14 }}>Resilient infrastructure investment: adaptation BCR, IFC Performance Standards, NbS integration, GCF alignment, and climate-proof project returns</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <KpiCard label="Avg Adapt BCR" value={`${kpis.avgBcr}×`} sub="benefit-cost ratio" color={T.accent} />
          <KpiCard label="Total CAPEX" value={`$${kpis.totalCapex}Bn`} sub="pipeline" color={T.blue} />
          <KpiCard label="NbS Components" value={`${kpis.nbsPct}%`} sub="include nature-based" color={T.green} />
          <KpiCard label="GCF Aligned" value={`${kpis.gcfPct}%`} sub="GCF eligible projects" color={T.purple} />
          <KpiCard label="Adapt Finance Gap" value="$194Bn/yr" sub="developing countries (UNEP)" color={T.amber} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: tab === i ? T.accent : T.light, color: tab === i ? '#fff' : T.text, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Climate Risk by Sector (%)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={INFRA_SECTORS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="sector" tick={{ fontSize: 10 }} width={130} />
                  <Tooltip />
                  <Bar dataKey="climateRisk" fill={T.red + '88'} name="Climate Risk" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Adaptation BCR by Sector</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={INFRA_SECTORS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="adaptBenefit" fill={T.accent} name="Benefit (×)" />
                  <Bar dataKey="adaptCost" fill={T.amber + '88'} name="Cost ($Bn)" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Sector Resilience Radar</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={INFRA_SECTORS.map(s => ({ subject: s.sector.split(' ')[0], resilience: s.resilienceScore, nbs: s.nbs, risk: s.climateRisk }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <Radar name="Resilience" dataKey="resilience" stroke={T.accent} fill={T.accent} fillOpacity={0.3} />
                  <Radar name="NbS %"  dataKey="nbs" stroke={T.green} fill={T.green} fillOpacity={0.2} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>NbS Component by Sector (%)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={INFRA_SECTORS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="nbs" fill={T.green} radius={[4, 4, 0, 0]} name="NbS Component %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['All', ...INFRA_SECTORS.map(s => s.sector)].map(s => (
                <button key={s} onClick={() => setSectorFilter(s)} style={{ padding: '4px 10px', borderRadius: 12, border: `1px solid ${T.border}`, background: sectorFilter === s ? T.accent : T.card, color: sectorFilter === s ? '#fff' : T.text, fontSize: 11, cursor: 'pointer' }}>{s.split(' ')[0]}</button>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: T.light }}>{['#', 'Project', 'Sector', 'Country', 'CAPEX ($M)', 'Adapt BCR', 'Climate-Proof', 'Lifetime', 'IFC PS', 'NbS', 'GCF', 'IRR'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: T.accent }}>{p.id}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11 }}>{p.sector}</td>
                      <td style={{ padding: '8px 12px' }}>{p.country}</td>
                      <td style={{ padding: '8px 12px' }}>${p.capex}M</td>
                      <td style={{ padding: '8px 12px', color: parseFloat(p.adaptBcr) > 5 ? T.green : T.amber, fontWeight: 600 }}>{p.adaptBcr}×</td>
                      <td style={{ padding: '8px 12px' }}>{p.climateProofing}%</td>
                      <td style={{ padding: '8px 12px' }}>{p.lifetimeYears}yr</td>
                      <td style={{ padding: '8px 12px' }}><Pill label={p.ifc_ps} color={T.accent} /></td>
                      <td style={{ padding: '8px 12px' }}><Pill label={p.nbsComponent ? 'Yes' : 'No'} color={p.nbsComponent ? T.green : T.amber} /></td>
                      <td style={{ padding: '8px 12px' }}><Pill label={p.gcfAligned ? 'Eligible' : 'Review'} color={p.gcfAligned ? T.green : T.blue} /></td>
                      <td style={{ padding: '8px 12px', color: T.blue }}>{p.irr}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ color: T.text, marginTop: 0 }}>IRR by Investment Horizon — Traditional vs Climate-Smart vs NbS</h3>
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={ADAPT_RETURNS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="horizon" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="traditional" stroke={T.amber} strokeWidth={2.5} name="Traditional Infrastructure" dot={false} />
                <Line type="monotone" dataKey="climateSmart" stroke={T.accent} strokeWidth={2.5} name="Climate-Smart" dot={false} />
                <Line type="monotone" dataKey="nbs" stroke={T.green} strokeWidth={2.5} name="Nature-Based Solutions" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: T.light }}>{['PS', 'Title', 'Climate Relevance'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
              <tbody>
                {IFC_STANDARDS.map((s, i) => (
                  <tr key={s.ps} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.accent }}>{s.ps}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text }}>{s.title}</td>
                    <td style={{ padding: '10px 14px', color: T.sub }}>{s.climate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { fund: 'Green Climate Fund (GCF)', focus: 'Adaptation + mitigation in developing nations', ticket: '$10M–$500M', conditions: 'NDA endorsement; accredited entity; country programme aligned', recentApproval: '$3.5Bn approved projects 2023' },
              { fund: 'Adaptation Fund (AF)', focus: 'Climate adaptation; most vulnerable countries', ticket: '$500k–$25M', conditions: 'NIE accreditation; national ownership; concrete adaptation benefit', recentApproval: '$150M ceiling raised to $25M/project' },
              { fund: 'IFC Climate Finance', focus: 'Private sector climate-smart infrastructure', ticket: '$10M–$200M', conditions: 'IFC PS compliance; additionality test; AIMM impact assessment', recentApproval: '$11.1Bn climate commitments FY2023' },
              { fund: 'AIIB Climate Focus', focus: 'Asia-Pacific climate infrastructure', ticket: '$50M–$1Bn', conditions: 'Sovereign + non-sovereign; Paris alignment; climate risk assessment', recentApproval: '50% of new approvals climate-themed' },
              { fund: 'EU Global Gateway', focus: 'Sustainable infrastructure globally', ticket: '€300Bn total by 2027', conditions: 'EU standards; green + digital twin track', recentApproval: '€150Bn climate commitments' },
              { fund: 'World Bank/IDA Climate', focus: 'Developing country adaptation', ticket: 'Flexible blended', conditions: 'IDA eligible; climate co-benefits required', recentApproval: '45% of WB financing climate-related (2023)' },
            ].map(f => (
              <div key={f.fund} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 6 }}>{f.fund}</div>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}><strong>Focus:</strong> {f.focus}</div>
                <div style={{ fontSize: 12, color: T.accent, marginBottom: 4 }}><strong>Ticket:</strong> {f.ticket}</div>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{f.conditions}</div>
                <div style={{ fontSize: 11, color: T.green }}>{f.recentApproval}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
