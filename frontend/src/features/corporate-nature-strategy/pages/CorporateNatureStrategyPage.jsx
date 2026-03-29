import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const API = 'http://localhost:8001';
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const seed = (s) => { let x = Math.sin(s * 2.7 + 1) * 10000; return x - Math.floor(x); };

const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ border: `1px solid ${accent ? '#059669' : '#e5e7eb'}`, borderRadius: 8, padding: '16px 20px', background: 'white' }}>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: '#1b3a5c' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{sub}</div>}
  </div>
);
const Btn = ({ children, onClick }) => (
  <button onClick={onClick} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#059669', color: 'white', fontWeight: 600, fontSize: 14 }}>{children}</button>
);
const Sel = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, background: 'white' }}>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  </div>
);
const Section = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontSize: 16, fontWeight: 600, color: '#1b3a5c', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #059669' }}>{title}</div>
    {children}
  </div>
);
const Row = ({ children, gap = 12 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${React.Children.count(children)},1fr)`, gap }}>{children}</div>
);
const Badge = ({ label, color }) => {
  const colors = {
    green: { bg: '#d1fae5', text: '#065f46' },
    yellow: { bg: '#fef3c7', text: '#92400e' },
    red: { bg: '#fee2e2', text: '#991b1b' },
    blue: { bg: '#dbeafe', text: '#1e40af' },
    gray: { bg: '#f3f4f6', text: '#374151' },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: c.bg, color: c.text }}>{label}</span>
  );
};

const TABS = ['SBTN Assessment', 'TNFD Disclosure', 'EU Nature Restoration', 'GBF Target 3 & ENCORE', 'Nature Strategy Overview'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

// Deterministic seed data
const sbtnRadar = [
  { step: 'Assess', score: Math.round(seed(1) * 60 + 35) },
  { step: 'Interpret', score: Math.round(seed(2) * 60 + 30) },
  { step: 'Measure', score: Math.round(seed(3) * 55 + 25) },
  { step: 'Set', score: Math.round(seed(4) * 50 + 20) },
  { step: 'Disclose', score: Math.round(seed(5) * 65 + 30) },
];
const sbtnSectors = [
  { sector: 'Agriculture & Livestock', drivers: 'Land use, water consumption, pesticides', priority: 'Critical' },
  { sector: 'Food & Beverages', drivers: 'Supply chain, packaging, water discharge', priority: 'High' },
  { sector: 'Pharmaceuticals', drivers: 'Chemical pollution, R&D land use', priority: 'Medium' },
  { sector: 'Real Estate & Construction', drivers: 'Land conversion, material extraction', priority: 'High' },
  { sector: 'Mining & Metals', drivers: 'Habitat destruction, water contamination', priority: 'Critical' },
  { sector: 'Textiles & Apparel', drivers: 'Water use, chemical discharge, land use', priority: 'Medium' },
];
const materialLocations = [
  { location: 'Amazon Basin, Brazil', type: 'Tropical Forest', dependency: 'High', exposure: '€ 142M' },
  { location: 'Congo Basin, DRC', type: 'Tropical Forest', dependency: 'High', exposure: '€ 98M' },
  { location: 'Mekong Delta, Vietnam', type: 'Freshwater', dependency: 'Medium', exposure: '€ 67M' },
  { location: 'Great Barrier Reef, Australia', type: 'Marine Coastal', dependency: 'Medium', exposure: '€ 54M' },
  { location: 'Po Valley, Italy', type: 'Temperate Grassland', dependency: 'Low', exposure: '€ 31M' },
];
const tnfdPillars = [
  { pillar: 'Governance', score: Math.round(seed(11) * 40 + 50) },
  { pillar: 'Strategy', score: Math.round(seed(12) * 45 + 35) },
  { pillar: 'Risk Mgmt', score: Math.round(seed(13) * 50 + 30) },
  { pillar: 'Metrics', score: Math.round(seed(14) * 40 + 25) },
];
const tnfdMetrics = [
  'Nature-related risks identified', 'Board oversight of nature', 'Nature in strategy',
  'LEAP assessment completed', 'Dependencies identified', 'Impacts assessed',
  'Risk management processes', 'Targets set', 'KPIs reported', 'Species at risk',
  'Land use change tracked', 'Water withdrawal reported', 'GHG emissions (E1)', 'Restoration commitments',
];
const tnfdStatus = tnfdMetrics.map((_, i) => seed(i + 20) > 0.45);
const habitatTypes = [
  { habitat: 'Tropical Moist Forest', target: 30, clientExposure: Math.round(seed(31) * 20 + 8), liability: Math.round(seed(32) * 80 + 20) },
  { habitat: 'Temperate Broadleaf Forest', target: 30, clientExposure: Math.round(seed(33) * 15 + 5), liability: Math.round(seed(34) * 40 + 10) },
  { habitat: 'Freshwater Wetlands', target: 40, clientExposure: Math.round(seed(35) * 12 + 4), liability: Math.round(seed(36) * 50 + 15) },
  { habitat: 'Coastal & Marine', target: 30, clientExposure: Math.round(seed(37) * 10 + 3), liability: Math.round(seed(38) * 35 + 8) },
  { habitat: 'Mediterranean Shrubland', target: 25, clientExposure: Math.round(seed(39) * 8 + 2), liability: Math.round(seed(40) * 20 + 5) },
  { habitat: 'Boreal Forest', target: 20, clientExposure: Math.round(seed(41) * 6 + 2), liability: Math.round(seed(42) * 15 + 3) },
];
const gbfCountries = ['BR', 'ID', 'CD', 'AU', 'MX', 'MY', 'PE', 'CO', 'MG', 'PG'].map((c, i) => ({
  country: c,
  protected30x30: Math.round(seed(i + 50) * 25 + 5),
  portfolioExposure: Math.round(seed(i + 60) * 400 + 50),
}));
const encoreDependencies = [
  'Water Flow Reg.', 'Erosion Control', 'Pollination', 'Pest Control', 'Disease Control',
  'Flood Control', 'Coastal Protection', 'Air Quality', 'Climate Regulation', 'Noise Reduction',
  'Soil Quality', 'Genetic Resources', 'Medicinal Resources', 'Timber', 'Fibres',
  'Animal-based Energy', 'Freshwater', 'Marine Food', 'Wild Plants', 'Biotic Materials', 'Soil Formation',
];
const sectorGroups = ['Agri', 'Manufacturing', 'Financial'];
const encoreMatrix = encoreDependencies.map((dep, i) =>
  sectorGroups.map((_, j) => {
    const v = seed(i * 3 + j + 70);
    return v > 0.66 ? 'High' : v > 0.33 ? 'Medium' : 'Low';
  })
);
const maturityData = [
  { year: '2021', score: 18 }, { year: '2022', score: 29 }, { year: '2023', score: 41 },
  { year: '2024', score: 56 }, { year: '2025E', score: 68 },
];

export default function CorporateNatureStrategyPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scenario, setScenario] = useState('current');

  const sbtnComposite = Math.round(sbtnRadar.reduce((s, r) => s + r.score, 0) / sbtnRadar.length);
  const tnfdComposite = Math.round(tnfdPillars.reduce((s, r) => s + r.score, 0) / tnfdPillars.length);
  const tnfdCompleted = tnfdStatus.filter(Boolean).length;
  const totalLiability = habitatTypes.reduce((s, h) => s + h.liability, 0);
  const maturityTier = sbtnComposite >= 70 ? 'Advanced' : sbtnComposite >= 50 ? 'Developing' : sbtnComposite >= 30 ? 'Emerging' : 'Initial';
  const maturityColor = sbtnComposite >= 70 ? 'green' : sbtnComposite >= 50 ? 'blue' : sbtnComposite >= 30 ? 'yellow' : 'red';

  const pieData = [
    { name: 'Tropical Forest', value: 38 },
    { name: 'Freshwater', value: 22 },
    { name: 'Marine Coastal', value: 18 },
    { name: 'Grassland', value: 12 },
    { name: 'Boreal Forest', value: 10 },
  ];
  const compositeScore = Math.round((sbtnComposite + tnfdComposite) / 2);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1b3a5c', margin: 0 }}>Corporate Nature Strategy</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>SBTN · TNFD · EU Nature Restoration Law · GBF 30×30 · ENCORE · E80</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: 'none', color: tab === i ? '#059669' : '#6b7280',
            borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      {/* TAB 1 — SBTN Assessment */}
      {tab === 0 && (
        <div>
          <Section title="SBTN 5-Step Maturity Scores">
            <Row>
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={sbtnRadar}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="step" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.3} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <Row gap={12}>
                  <KpiCard label="SBTN Composite Score" value={`${sbtnComposite}/100`} sub="Across 5 steps" accent />
                  <KpiCard label="Nature Maturity Tier" value={<Badge label={maturityTier} color={maturityColor} />} sub="SBTN classification" />
                </Row>
                <div style={{ marginTop: 16 }}>
                  {sbtnRadar.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ width: 90, fontSize: 13, color: '#374151', fontWeight: 500 }}>{r.step}</div>
                      <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 8, marginRight: 10 }}>
                        <div style={{ width: `${r.score}%`, background: r.score >= 60 ? '#059669' : r.score >= 40 ? '#f59e0b' : '#ef4444', height: 8, borderRadius: 4 }} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1b3a5c', width: 30 }}>{r.score}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Row>
          </Section>

          <Section title="High-Impact Sectors">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Sector', 'Impact Drivers', 'Priority'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sbtnSectors.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1b3a5c' }}>{r.sector}</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{r.drivers}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge label={r.priority} color={r.priority === 'Critical' ? 'red' : r.priority === 'High' ? 'yellow' : 'blue'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Material Locations">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Location', 'Ecosystem Type', 'Dependency', 'Portfolio Exposure'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materialLocations.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', color: '#1b3a5c' }}>{r.location}</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{r.type}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge label={r.dependency} color={r.dependency === 'High' ? 'red' : r.dependency === 'Medium' ? 'yellow' : 'green'} />
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1b3a5c' }}>{r.exposure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 2 — TNFD Disclosure */}
      {tab === 1 && (
        <div>
          <Section title="TNFD 4-Pillar Scores">
            <Row>
              <div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={tnfdPillars}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="pillar" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <Row gap={12}>
                  <KpiCard label="TNFD Composite Score" value={`${tnfdComposite}/100`} sub="4-pillar average" accent />
                  <KpiCard label="TNFD Alignment" value={`${Math.round((tnfdCompleted / tnfdMetrics.length) * 100)}%`} sub={`${tnfdCompleted}/${tnfdMetrics.length} metrics met`} />
                </Row>
                <div style={{ marginTop: 16, padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46', marginBottom: 6 }}>TNFD Framework Status</div>
                  {tnfdPillars.map((p, i) => (
                    <div key={i} style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{p.pillar}:</span> {p.score >= 70 ? 'Advanced' : p.score >= 50 ? 'Developing' : 'Initial'} ({p.score}/100)
                    </div>
                  ))}
                </div>
              </div>
            </Row>
          </Section>

          <Section title="TNFD Disclosure Metric Checklist (14 Metrics)">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {tnfdMetrics.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f9fafb', borderRadius: 6, border: `1px solid ${tnfdStatus[i] ? '#bbf7d0' : '#fecaca'}` }}>
                  <span style={{ fontSize: 16, color: tnfdStatus[i] ? '#059669' : '#ef4444' }}>{tnfdStatus[i] ? '✓' : '✗'}</span>
                  <span style={{ fontSize: 13, color: '#374151' }}>{m}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 3 — EU Nature Restoration */}
      {tab === 2 && (
        <div>
          <Section title="Habitat Restoration Liability Overview">
            <Row gap={12}>
              <KpiCard label="Total Restoration Liability" value={`€ ${totalLiability}M`} sub="Across all habitat types" accent />
              <KpiCard label="2030 Compliance Deadline" value="Partial" sub="Wetlands & forests prioritised" />
              <KpiCard label="2040 Target" value="75% restored" sub="NRL Art. 4 degraded habitats" />
              <KpiCard label="2050 Target" value="100%" sub="NRL full restoration obligation" />
            </Row>
          </Section>

          <Section title="NRL Habitat Exposure & Restoration Liability">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Habitat Type', 'NRL Target (%)', 'Client Exposure (%)', 'Restoration Liability (€M)', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habitatTypes.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500, color: '#1b3a5c' }}>{r.habitat}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.target}%</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.clientExposure}%</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: r.liability > 40 ? '#dc2626' : '#1b3a5c' }}>€ {r.liability}M</td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge label={r.clientExposure > 12 ? 'Material' : r.clientExposure > 6 ? 'Moderate' : 'Low'} color={r.clientExposure > 12 ? 'red' : r.clientExposure > 6 ? 'yellow' : 'green'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="NRL Compliance Timeline">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[
                { year: '2030', req: '30% of degraded ecosystems restored; wetland & peatland priority; urban greenery targets.', status: 'At Risk', color: 'red' },
                { year: '2040', req: '60% of degraded terrestrial habitats restored; Marine Strategy Framework Directive alignment.', status: 'In Progress', color: 'yellow' },
                { year: '2050', req: '100% restoration and no net deterioration; all habitats in good ecological condition.', status: 'Planning Stage', color: 'blue' },
              ].map((t, i) => (
                <div key={i} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#059669', marginBottom: 4 }}>{t.year}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>{t.req}</div>
                  <Badge label={t.status} color={t.color} />
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 4 — GBF Target 3 & ENCORE */}
      {tab === 3 && (
        <div>
          <Section title="30×30 Protection Status — Top 10 Exposure Countries">
            <Row gap={12}>
              <KpiCard label="Total Financial Nature Exposure" value="€ 1.24B" sub="Across 10 key countries" accent />
              <KpiCard label="Avg 30×30 Coverage" value={`${Math.round(gbfCountries.reduce((s, c) => s + c.protected30x30, 0) / gbfCountries.length)}%`} sub="Portfolio-weighted" />
            </Row>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gbfCountries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="protected30x30" fill="#059669" name="Protected Area (%)" />
                <Bar yAxisId="right" dataKey="portfolioExposure" fill="#3b82f6" name="Portfolio Exposure (€M)" />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="ENCORE Dependency Matrix (21 Services × 3 Sectors)">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151', minWidth: 160 }}>Ecosystem Service</th>
                    {sectorGroups.map(s => (
                      <th key={s} style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {encoreDependencies.map((dep, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '7px 10px', color: '#374151', fontWeight: 500 }}>{dep}</td>
                      {encoreMatrix[i].map((level, j) => (
                        <td key={j} style={{ padding: '7px 10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                            background: level === 'High' ? '#fee2e2' : level === 'Medium' ? '#fef3c7' : '#d1fae5',
                            color: level === 'High' ? '#991b1b' : level === 'Medium' ? '#92400e' : '#065f46',
                          }}>{level}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      )}

      {/* TAB 5 — Nature Strategy Overview */}
      {tab === 4 && (
        <div>
          <Section title="Nature Strategy KPI Summary">
            <Row gap={12}>
              <KpiCard label="Composite Nature Score" value={`${compositeScore}/100`} sub="SBTN + TNFD weighted avg" accent />
              <KpiCard label="SBTN Score" value={`${sbtnComposite}/100`} sub="5-step assessment" />
              <KpiCard label="TNFD Composite" value={`${tnfdComposite}/100`} sub="4-pillar disclosure" />
              <KpiCard label="NRL Liability" value={`€ ${totalLiability}M`} sub="Restoration obligations" />
            </Row>
            <div style={{ marginTop: 12 }}>
              <Row gap={12}>
                <KpiCard label="ENCORE Dependencies" value={`${encoreMatrix.flat().filter(v => v === 'High').length} High`} sub="21 ecosystem services" />
                <KpiCard label="Material Locations" value={materialLocations.length} sub="TNFD LEAP sites" />
                <KpiCard label="30×30 Avg Coverage" value={`${Math.round(gbfCountries.reduce((s, c) => s + c.protected30x30, 0) / gbfCountries.length)}%`} sub="Portfolio countries" />
                <KpiCard label="Nature Maturity" value={<Badge label={maturityTier} color={maturityColor} />} sub="Current tier" />
              </Row>
            </div>
          </Section>

          <Section title="Nature Maturity Score Progression">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={maturityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#059669" strokeWidth={2} dot={{ r: 5 }} name="Maturity Score" />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Portfolio Nature Exposure by Ecosystem Type">
            <Row>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div>
                <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#065f46', marginBottom: 8 }}>Recommended Action Plan</div>
                  {[
                    'Complete SBTN Step 2 (Interpret & Prioritise) for top 5 sectors',
                    'Publish TNFD LEAP assessment for 3 material locations by Q3',
                    'Engage agriculture supply chain on NRL restoration requirements',
                    'Set SBTN Corporate Engagement targets for high-priority counterparties',
                    'Integrate ENCORE dependency scores into credit risk models',
                    'File GBF Target 15 disclosure in next annual sustainability report',
                  ].map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#374151' }}>
                      <span style={{ color: '#059669', fontWeight: 700 }}>{i + 1}.</span>
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Row>
          </Section>
        </div>
      )}
    </div>
  );
}
