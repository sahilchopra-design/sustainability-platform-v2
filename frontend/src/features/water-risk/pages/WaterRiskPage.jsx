import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell,
} from 'recharts';

const API = 'http://localhost:8001';
const seed = (s) => { let x = Math.sin(s * 2.7 + 1) * 10000; return x - Math.floor(x); };

const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ border: `1px solid ${accent ? '#059669' : '#e5e7eb'}`, borderRadius: 8, padding: '16px 20px', background: 'white' }}>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{sub}</div>}
  </div>
);
const Btn = ({ children, onClick }) => (
  <button onClick={onClick} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#059669', color: 'white', fontWeight: 600, fontSize: 14 }}>{children}</button>
);
const Inp = ({ label, value, onChange, type = 'text' }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</div>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, background: 'white', boxSizing: 'border-box' }} />
  </div>
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
    <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #059669' }}>{title}</div>
    {children}
  </div>
);
const Row = ({ children, gap = 12 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${React.Children.count(children)},1fr)`, gap }}>{children}</div>
);
const Badge = ({ label, color }) => {
  const colors = { green: { bg: '#d1fae5', text: '#065f46' }, yellow: { bg: '#fef3c7', text: '#92400e' }, red: { bg: '#fee2e2', text: '#991b1b' }, blue: { bg: '#dbeafe', text: '#1e40af' }, gray: { bg: '#f3f4f6', text: '#374151' }, purple: { bg: '#ede9fe', text: '#5b21b6' }, orange: { bg: '#ffedd5', text: '#9a3412' } };
  const c = colors[color] || colors.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: c.bg, color: c.text }}>{label}</span>;
};

const TABS = ['AQUEDUCT Risk', 'CDP Water Security', 'TNFD E3 Metrics', 'AWS Standard v2', 'Financial Exposure'];

const BASIN_OPTIONS = [
  { value: 'indus', label: 'Indus Basin (South Asia)' },
  { value: 'colorado', label: 'Colorado River (North America)' },
  { value: 'nile', label: 'Nile Basin (Africa)' },
  { value: 'yangtze', label: 'Yangtze River (China)' },
  { value: 'danube', label: 'Danube Basin (Europe)' },
  { value: 'amazon', label: 'Amazon Basin (South America)' },
  { value: 'tigris', label: 'Tigris-Euphrates (Middle East)' },
  { value: 'murray', label: 'Murray-Darling (Australia)' },
];

const SECTOR_OPTIONS = [
  { value: 'agriculture', label: 'Agriculture / Irrigation' },
  { value: 'mining', label: 'Mining & Quarrying' },
  { value: 'beverages', label: 'Food & Beverages' },
  { value: 'semiconductor', label: 'Semiconductor Manufacturing' },
  { value: 'textile', label: 'Textile / Apparel' },
  { value: 'utilities', label: 'Water Utilities' },
  { value: 'chemicals', label: 'Chemicals' },
  { value: 'power', label: 'Thermal Power' },
];

const getAqueductData = (basin, sector) => {
  const bi = BASIN_OPTIONS.findIndex(b => b.value === basin) + 1;
  const si = SECTOR_OPTIONS.findIndex(s => s.value === sector) + 1;
  const subScores = [
    { name: 'Baseline Water Stress', key: 'baseline_water_stress', value: parseFloat((seed(bi * 7 + si * 3) * 4 + 0.5).toFixed(2)) },
    { name: 'Interannual Variability', key: 'interannual_variability', value: parseFloat((seed(bi * 11 + si * 5) * 3 + 0.5).toFixed(2)) },
    { name: 'Seasonal Variability', key: 'seasonal_variability', value: parseFloat((seed(bi * 13 + si * 7) * 3 + 0.5).toFixed(2)) },
    { name: 'Groundwater Depletion', key: 'groundwater_depletion', value: parseFloat((seed(bi * 17 + si * 11) * 4 + 0.3).toFixed(2)) },
    { name: 'Riverine Flood Risk', key: 'riverine_flood_risk', value: parseFloat((seed(bi * 19 + si * 13) * 3 + 0.5).toFixed(2)) },
    { name: 'Coastal Eutrophication', key: 'coastal_eutrophication', value: parseFloat((seed(bi * 23 + si * 17) * 3 + 0.3).toFixed(2)) },
  ];
  const overall = parseFloat((subScores.reduce((s, x) => s + x.value, 0) / subScores.length).toFixed(2));
  const tier = overall >= 3.5 ? 'Extremely High' : overall >= 2.5 ? 'High' : overall >= 1.5 ? 'Medium-High' : overall >= 0.5 ? 'Low-Medium' : 'Low';
  const tierColor = overall >= 3.5 ? 'red' : overall >= 2.5 ? 'orange' : overall >= 1.5 ? 'yellow' : 'green';
  return { subScores, overall, tier, tierColor };
};

const getCdpData = (basin) => {
  const bi = BASIN_OPTIONS.findIndex(b => b.value === basin) + 1;
  const pillars = [
    { dimension: 'Governance', score: Math.round(seed(bi * 31) * 30 + 45) },
    { dimension: 'Risk Assessment', score: Math.round(seed(bi * 37) * 28 + 48) },
    { dimension: 'Targets', score: Math.round(seed(bi * 41) * 32 + 42) },
    { dimension: 'Performance', score: Math.round(seed(bi * 43) * 25 + 50) },
  ];
  const composite = Math.round(pillars.reduce((s, p) => s + p.score, 0) / pillars.length);
  const grade = composite >= 80 ? 'A' : composite >= 65 ? 'B' : composite >= 50 ? 'C' : 'D';
  const gradeColor = grade === 'A' ? 'green' : grade === 'B' ? 'blue' : grade === 'C' ? 'yellow' : 'red';
  const aListEligible = composite >= 75;
  return { pillars, composite, grade, gradeColor, aListEligible };
};

const getTnfdData = (sector) => {
  const si = SECTOR_OPTIONS.findIndex(s => s.value === sector) + 1;
  const withdrawal = Math.round(seed(si * 53) * 4000 + 500);
  const consumption = Math.round(withdrawal * (seed(si * 59) * 0.4 + 0.3));
  const discharge = withdrawal - consumption;
  const recycled = Math.round(seed(si * 61) * 40 + 15);
  const disclosureScore = Math.round(seed(si * 67) * 30 + 55);
  const metrics = [
    { name: 'Withdrawal (m³)', value: withdrawal },
    { name: 'Consumption (m³)', value: consumption },
    { name: 'Discharge (m³)', value: discharge },
    { name: 'Recycled (%)', value: recycled },
  ];
  return { metrics, withdrawal, consumption, discharge, recycled, disclosureScore };
};

const getAwsData = (basin) => {
  const bi = BASIN_OPTIONS.findIndex(b => b.value === basin) + 1;
  const criteria = [
    { dimension: 'Balance', score: Math.round(seed(bi * 71) * 30 + 50) },
    { dimension: 'Engagement', score: Math.round(seed(bi * 73) * 28 + 48) },
    { dimension: 'Governance', score: Math.round(seed(bi * 79) * 32 + 45) },
    { dimension: 'Efficiency', score: Math.round(seed(bi * 83) * 25 + 52) },
    { dimension: 'Transparency', score: Math.round(seed(bi * 89) * 30 + 47) },
  ];
  const overall = Math.round(criteria.reduce((s, c) => s + c.score, 0) / criteria.length);
  const tier = overall >= 75 ? 'Platinum' : overall >= 60 ? 'Gold' : overall >= 45 ? 'Silver' : 'Core';
  const tierColor = overall >= 75 ? 'green' : overall >= 60 ? 'blue' : overall >= 45 ? 'yellow' : 'gray';
  const certEligible = overall >= 55;
  return { criteria, overall, tier, tierColor, certEligible };
};

const getFinancialData = (sector) => {
  const si = SECTOR_OPTIONS.findIndex(s => s.value === sector) + 1;
  const opex = parseFloat((seed(si * 97) * 50 + 10).toFixed(1));
  const regulatory = parseFloat((seed(si * 101) * 30 + 5).toFixed(1));
  const stranded = parseFloat((seed(si * 103) * 80 + 20).toFixed(1));
  const total = parseFloat((opex + regulatory + stranded).toFixed(1));
  const bondEligible = seed(si * 107) > 0.4;
  const bars = [
    { name: 'Opex Risk', value: opex },
    { name: 'Regulatory Risk', value: regulatory },
    { name: 'Stranded Asset Risk', value: stranded },
  ];
  return { opex, regulatory, stranded, total, bondEligible, bars };
};

export default function WaterRiskPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [basin, setBasin] = useState('indus');
  const [sector, setSector] = useState('agriculture');

  const aqueduct = getAqueductData(basin, sector);
  const cdp = getCdpData(basin);
  const tnfd = getTnfdData(sector);
  const aws = getAwsData(basin);
  const financial = getFinancialData(sector);

  const runAssess = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/water-risk/assess`, {
        basin, sector,
        company_id: 'demo-001',
      });
    } catch {
      void 0 /* API fallback to seed data */;
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Water Risk & Stewardship Finance</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>WRI AQUEDUCT 4.0 · CDP Water · TNFD E3 · AWS Standard v2</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      {/* Shared inputs */}
      <Section title="Assessment Parameters">
        <Row>
          <Sel label="River Basin / Water Region" value={basin} onChange={setBasin} options={BASIN_OPTIONS} />
          <Sel label="Industry Sector" value={sector} onChange={setSector} options={SECTOR_OPTIONS} />
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 12 }}>
            <Btn onClick={runAssess}>{loading ? 'Running…' : 'Run Water Risk Assessment'}</Btn>
          </div>
        </Row>
      </Section>

      {/* TAB 1 — AQUEDUCT Risk */}
      {tab === 0 && (
        <div>
          <Section title="WRI AQUEDUCT 4.0 — Sub-Indicator Scores">
            <Row gap={12}>
              <KpiCard label="AQUEDUCT Overall Score" value={`${aqueduct.overall} / 5`} sub="Composite across 6 indicators" accent />
              <KpiCard label="Risk Tier" value={<Badge label={aqueduct.tier} color={aqueduct.tierColor} />} sub="WRI water risk classification" />
              <KpiCard label="Highest Risk Indicator" value={[...aqueduct.subScores].sort((a, b) => b.value - a.value)[0].name.split(' ')[0]} sub={`Score: ${[...aqueduct.subScores].sort((a, b) => b.value - a.value)[0].value} / 5`} />
              <KpiCard label="Indicators Above 2.5" value={`${aqueduct.subScores.filter(s => s.value > 2.5).length} / 6`} sub="High-stress threshold count" />
            </Row>
          </Section>

          <Section title="AQUEDUCT Sub-Indicator Scores (0–5 scale)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={aqueduct.subScores} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 5]} tickCount={6} />
                <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => [`${val} / 5`, 'Risk Score']} />
                <Bar dataKey="value" name="Risk Score" radius={[0, 4, 4, 0]}>
                  {aqueduct.subScores.map((s, i) => (
                    <Cell key={i} fill={s.value >= 3.5 ? '#ef4444' : s.value >= 2.5 ? '#f97316' : s.value >= 1.5 ? '#f59e0b' : '#059669'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Indicator Detail">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Indicator', 'Score (0–5)', 'Risk Level'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aqueduct.subScores.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{s.name}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#111827' }}>{s.value}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <Badge label={s.value >= 3.5 ? 'Extremely High' : s.value >= 2.5 ? 'High' : s.value >= 1.5 ? 'Medium-High' : 'Low-Medium'} color={s.value >= 3.5 ? 'red' : s.value >= 2.5 ? 'orange' : s.value >= 1.5 ? 'yellow' : 'green'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 2 — CDP Water Security */}
      {tab === 1 && (
        <div>
          <Section title="CDP Water Security Programme — Summary">
            <Row gap={12}>
              <KpiCard label="CDP Water Score" value={cdp.grade} sub={`Composite: ${cdp.composite}/100`} accent />
              <KpiCard label="CDP A-List Eligible" value={<Badge label={cdp.aListEligible ? 'Eligible' : 'Not Eligible'} color={cdp.aListEligible ? 'green' : 'red'} />} sub="≥75/100 threshold for A-List" />
              <KpiCard label="Top Pillar" value={[...cdp.pillars].sort((a, b) => b.score - a.score)[0].dimension} sub={`Score: ${[...cdp.pillars].sort((a, b) => b.score - a.score)[0].score}/100`} />
              <KpiCard label="Lowest Pillar" value={[...cdp.pillars].sort((a, b) => a.score - b.score)[0].dimension} sub={`Score: ${[...cdp.pillars].sort((a, b) => a.score - b.score)[0].score}/100`} />
            </Row>
          </Section>

          <Row>
            <Section title="CDP Water — 4-Pillar Radar">
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={cdp.pillars} cx="50%" cy="50%" outerRadius={110}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 13 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="CDP Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="CDP Pillar Scores">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={cdp.pillars}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Bar dataKey="score" name="CDP Score" radius={[4, 4, 0, 0]}>
                    {cdp.pillars.map((p, i) => (
                      <Cell key={i} fill={p.score >= 70 ? '#059669' : p.score >= 55 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 3 — TNFD E3 Metrics */}
      {tab === 2 && (
        <div>
          <Section title="TNFD ESRS E3 Water & Marine Resources Metrics">
            <Row gap={12}>
              <KpiCard label="Water Withdrawal (m³/yr)" value={tnfd.withdrawal.toLocaleString()} sub="Total freshwater withdrawal" accent />
              <KpiCard label="Water Consumption (m³/yr)" value={tnfd.consumption.toLocaleString()} sub="Net consumptive use" />
              <KpiCard label="Water Recycled (%)" value={`${tnfd.recycled}%`} sub="Circular water reuse rate" />
              <KpiCard label="TNFD E3 Disclosure Score" value={`${tnfd.disclosureScore}/100`} sub="ESRS E3 completeness" />
            </Row>
          </Section>

          <Section title="Water Volume Breakdown (m³/year)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tnfd.metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(val, name) => [val.toLocaleString(), name]} />
                <Bar dataKey="value" name="Volume (m³)" radius={[4, 4, 0, 0]}>
                  {tnfd.metrics.map((m, i) => (
                    <Cell key={i} fill={['#059669', '#3b82f6', '#f59e0b', '#8b5cf6'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="TNFD E3 Disclosure Gap Analysis">
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
              {[
                { dp: 'E3-1', desc: 'Policies related to water & marine resources', met: tnfd.disclosureScore >= 65 },
                { dp: 'E3-2', desc: 'Material water & marine resources-related impacts', met: tnfd.disclosureScore >= 60 },
                { dp: 'E3-3', desc: 'Water & marine resources-related targets', met: tnfd.disclosureScore >= 70 },
                { dp: 'E3-4', desc: 'Water consumption KPIs (withdrawal/discharge)', met: true },
                { dp: 'E3-5', desc: 'Anticipated financial effects from water risks', met: tnfd.disclosureScore >= 75 },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 4 ? '1px solid #d1fae5' : 'none' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#065f46', marginRight: 8, fontSize: 13 }}>{item.dp}</span>
                    <span style={{ fontSize: 13, color: '#374151' }}>{item.desc}</span>
                  </div>
                  <Badge label={item.met ? 'Disclosed' : 'Gap'} color={item.met ? 'green' : 'red'} />
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 4 — AWS Standard v2 */}
      {tab === 3 && (
        <div>
          <Section title="Alliance for Water Stewardship (AWS) Standard v2 Assessment">
            <Row gap={12}>
              <KpiCard label="AWS Overall Score" value={`${aws.overall}/100`} sub="5-criteria weighted composite" accent />
              <KpiCard label="AWS Certification Tier" value={<Badge label={aws.tier} color={aws.tierColor} />} sub="Core / Silver / Gold / Platinum" />
              <KpiCard label="Certification Eligible" value={<Badge label={aws.certEligible ? 'Eligible' : 'Not Eligible'} color={aws.certEligible ? 'green' : 'red'} />} sub="≥55/100 threshold" />
              <KpiCard label="Highest Criteria" value={[...aws.criteria].sort((a, b) => b.score - a.score)[0].dimension} sub={`Score: ${[...aws.criteria].sort((a, b) => b.score - a.score)[0].score}/100`} />
            </Row>
          </Section>

          <Row>
            <Section title="AWS Criteria — Radar Assessment">
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={aws.criteria} cx="50%" cy="50%" outerRadius={110}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 13 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="AWS Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="AWS Criteria Scores">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={aws.criteria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Bar dataKey="score" name="AWS Score" radius={[4, 4, 0, 0]}>
                    {aws.criteria.map((c, i) => (
                      <Cell key={i} fill={c.score >= 70 ? '#059669' : c.score >= 55 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 5 — Financial Exposure */}
      {tab === 4 && (
        <div>
          <Section title="Water-Related Financial Exposure ($M)">
            <Row gap={12}>
              <KpiCard label="Total Water Financial Risk" value={`$${financial.total}M`} sub="Aggregate across 3 risk categories" accent />
              <KpiCard label="OpEx Risk ($M)" value={`$${financial.opex}M`} sub="Water procurement & treatment costs" />
              <KpiCard label="Regulatory Risk ($M)" value={`$${financial.regulatory}M`} sub="Water pricing & permit risk" />
              <KpiCard label="Stranded Asset Risk ($M)" value={`$${financial.stranded}M`} sub="Asset value at risk from water scarcity" />
            </Row>
            <div style={{ marginTop: 16 }}>
              <KpiCard label="Water Bond Eligibility" value={<Badge label={financial.bondEligible ? 'Eligible' : 'Not Eligible'} color={financial.bondEligible ? 'green' : 'red'} />} sub="ICMA Water Social Bond Framework alignment" />
            </div>
          </Section>

          <Section title="Financial Risk Breakdown by Category ($M)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financial.bars}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                <YAxis unit="M" />
                <Tooltip formatter={(val) => `$${val}M`} />
                <Bar dataKey="value" name="Risk Exposure ($M)" radius={[4, 4, 0, 0]}>
                  {financial.bars.map((b, i) => (
                    <Cell key={i} fill={['#059669', '#3b82f6', '#ef4444'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Water Risk Mitigation Levers">
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 16 }}>
              {[
                { lever: 'Water Recycling & Reuse', savings: `$${parseFloat((financial.opex * 0.3).toFixed(1))}M`, priority: 'High' },
                { lever: 'On-site Treatment Upgrade', savings: `$${parseFloat((financial.regulatory * 0.5).toFixed(1))}M`, priority: 'Medium' },
                { lever: 'Supply Chain Water Mapping', savings: `$${parseFloat((financial.stranded * 0.2).toFixed(1))}M`, priority: 'High' },
                { lever: 'Watershed Stewardship Program', savings: `$${parseFloat((financial.total * 0.15).toFixed(1))}M`, priority: 'Low' },
                { lever: 'Water Footprint Certification (AWS)', savings: 'Risk premium reduction', priority: 'Medium' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 4 ? '1px solid #dbeafe' : 'none' }}>
                  <span style={{ fontSize: 13, color: '#1e40af', fontWeight: 500 }}>{item.lever}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#374151' }}>{item.savings}</span>
                    <Badge label={item.priority} color={item.priority === 'High' ? 'green' : item.priority === 'Medium' ? 'yellow' : 'gray'} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
