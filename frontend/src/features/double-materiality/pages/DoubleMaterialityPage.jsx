import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, Cell, ReferenceLine,
} from 'recharts';

const API = 'http://localhost:8001';
const hashStr = (s) => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
const seededRandom = (seed) => { let x = Math.sin(Math.abs(seed) * 9301 + 49297) * 233280; return x - Math.floor(x); };
const sr = (seed, offset = 0) => seededRandom(seed + offset);

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
  const colors = { green: { bg: '#d1fae5', text: '#065f46' }, yellow: { bg: '#fef3c7', text: '#92400e' }, red: { bg: '#fee2e2', text: '#991b1b' }, blue: { bg: '#dbeafe', text: '#1e40af' }, gray: { bg: '#f3f4f6', text: '#374151' } };
  const c = colors[color] || colors.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: c.bg, color: c.text }}>{label}</span>;
};

const TABS = ['Materiality Matrix', 'ESRS Topics Overview', 'IRO Registry', 'Stakeholder Engagement', 'Assurance Readiness'];

const ESRS_TOPICS = [
  { id: 'E1', label: 'Climate Change' },
  { id: 'E2', label: 'Pollution' },
  { id: 'E3', label: 'Water' },
  { id: 'E4', label: 'Biodiversity' },
  { id: 'E5', label: 'Circular Economy' },
  { id: 'S1', label: 'Own Workforce' },
  { id: 'S2', label: 'Value Chain Workers' },
  { id: 'S3', label: 'Affected Communities' },
  { id: 'S4', label: 'Consumers & End-users' },
  { id: 'G1', label: 'Business Conduct' },
];

const IRO_TYPES = ['Risk', 'Opportunity', 'Impact+', 'Impact-'];
const HORIZONS = ['Short-term', 'Medium-term', 'Long-term'];
const VC_POSITIONS = ['Own Operations', 'Upstream', 'Downstream'];
const STAKEHOLDER_GROUPS = [
  { subject: 'Employees', completeness: 0 },
  { subject: 'Investors', completeness: 0 },
  { subject: 'Customers', completeness: 0 },
  { subject: 'Suppliers', completeness: 0 },
  { subject: 'Communities', completeness: 0 },
  { subject: 'Regulators', completeness: 0 },
];

const ASSURANCE_CRITERIA = [
  'Material Topics Identified',
  'IRO Documentation Complete',
  'Double Materiality Assessment Signed',
  'Stakeholder Consultation Documented',
  'External Assurance Scope Defined',
];

const CSRD_WAVES = [
  { wave: '1', label: 'Wave 1 (2024+)', applies: true, threshold: '>500 employees, listed large' },
  { wave: '2', label: 'Wave 2 (2025+)', applies: false, threshold: '>250 employees or >€40m turnover' },
  { wave: '3', label: 'Wave 3 (2026+)', applies: false, threshold: 'Listed SMEs' },
  { wave: '4', label: 'Wave 4 (2028+)', applies: false, threshold: 'Non-EU companies' },
];

function buildData(entity, nace, employees, wave) {
  const seed = hashStr(entity + nace + employees + wave);
  const empNum = parseInt(employees) || 1000;

  const topics = ESRS_TOPICS.map((t, i) => {
    const finMat = parseFloat((sr(seed, i * 7 + 1) * 0.9 + 0.05).toFixed(2));
    const impMat = parseFloat((sr(seed, i * 11 + 3) * 0.9 + 0.05).toFixed(2));
    const isDouble = finMat >= 0.4 && impMat >= 0.4;
    const isSingle = (finMat >= 0.4) !== (impMat >= 0.4);
    const combined = parseFloat(((finMat + impMat) / 2).toFixed(2));
    const iroCount = Math.ceil(sr(seed, i * 13 + 5) * 5 + 1);
    return { ...t, finMat, impMat, combined, isDouble, isSingle, material: isDouble || isSingle, iroCount };
  });

  const scatterData = topics.map(t => ({
    x: t.finMat, y: t.impMat, name: t.id,
    color: t.isDouble ? '#ef4444' : t.isSingle ? '#f59e0b' : '#059669',
  }));

  const iros = [];
  topics.forEach((t, ti) => {
    const count = Math.min(t.iroCount, 2);
    for (let k = 0; k < count; k++) {
      iros.push({
        topic: t.id, label: t.label,
        type: IRO_TYPES[Math.floor(sr(seed, ti * 31 + k * 7) * IRO_TYPES.length)],
        horizon: HORIZONS[Math.floor(sr(seed, ti * 37 + k * 11) * HORIZONS.length)],
        impMat: t.impMat >= 0.4, finMat: t.finMat >= 0.4,
        vc: VC_POSITIONS[Math.floor(sr(seed, ti * 41 + k * 13) * VC_POSITIONS.length)],
      });
    }
  });

  const doubleMat = iros.filter(r => r.impMat && r.finMat).length;
  const impactOnly = iros.filter(r => r.impMat && !r.finMat).length;
  const financialOnly = iros.filter(r => !r.impMat && r.finMat).length;

  const stakeholders = STAKEHOLDER_GROUPS.map((sg, i) => ({
    ...sg,
    completeness: Math.round(sr(seed, i * 17 + 60) * 40 + 50),
    method: ['Surveys', 'Workshops', 'Interviews', 'Focus Groups', 'Public Consultation', 'Annual Meeting'][i],
    frequency: ['Quarterly', 'Annual', 'Bi-annual', 'Monthly', 'Ad-hoc', 'Annual'][i],
    status: sr(seed, i * 19 + 65) > 0.5 ? 'Complete' : 'In Progress',
  }));

  const completeness = Math.round(sr(seed, 71) * 25 + 65);
  const assuranceLevel = completeness >= 80 ? 'Limited' : completeness >= 65 ? 'Reasonable' : 'None';
  const dpReported = Math.round(sr(seed, 73) * 80 + 120);
  const materialTopics = topics.filter(t => t.material).length;

  const assuranceCriteria = ASSURANCE_CRITERIA.map((c, i) => ({
    criterion: c, score: Math.round(sr(seed, i * 23 + 80) * 35 + 55),
  }));

  const waveApplies = parseInt(wave) <= 2 || empNum > 500;

  return { topics, scatterData, iros, doubleMat, impactOnly, financialOnly, stakeholders, completeness, assuranceLevel, dpReported, materialTopics, assuranceCriteria, waveApplies };
}

export default function DoubleMaterialityPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [entity, setEntity] = useState('Heidelberg Materials');
  const [nace, setNace] = useState('C24');
  const [employees, setEmployees] = useState('15000');
  const [wave, setWave] = useState('1');

  const d = buildData(entity, nace, employees, wave);

  const runAssess = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/double-materiality/assess`, { entity_name: entity, nace_sector: nace, employee_count: parseInt(employees), csrd_wave: parseInt(wave) });
    } catch { setError('API unavailable — demo mode.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Double Materiality Assessment</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>CSRD ESRS 1 · Double Materiality Matrix · IRO Registry · Stakeholder Engagement · ISAE 3000 Assurance Readiness</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: 12, marginBottom: 16, color: '#dc2626', fontSize: 14 }}>{error}</div>}

      <Section title="Inputs">
        <Row>
          <Inp label="Entity Name" value={entity} onChange={setEntity} />
          <Sel label="NACE Sector" value={nace} onChange={setNace} options={['A01','B05','C10','C20','C24','D35','F41','G47','H49','I55','J62','K64','L68','M69','N78','O84','P85','Q86','R90','S94'].map(v => ({ value: v, label: v }))} />
          <Inp label="Employee Count" value={employees} onChange={setEmployees} type="number" />
          <Sel label="CSRD Wave" value={wave} onChange={setWave} options={[{ value: '1', label: 'Wave 1 (2024+)' }, { value: '2', label: 'Wave 2 (2025+)' }, { value: '3', label: 'Wave 3 (2026+)' }, { value: '4', label: 'Wave 4 (2028+)' }]} />
        </Row>
        <Btn onClick={runAssess}>{loading ? 'Assessing…' : 'Run Materiality Assessment'}</Btn>
      </Section>

      {tab === 0 && (
        <div>
          <Section title="Double Materiality Matrix — ESRS Topics (Financial × Impact Materiality)">
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Red = Double Material · Amber = Single Material · Green = Not Material · Quadrant threshold: 0.4 / 0.4</div>
            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="Financial Materiality" domain={[0, 1]} label={{ value: 'Financial Materiality →', position: 'bottom', offset: 20, fontSize: 12 }} tick={{ fontSize: 11 }} />
                <YAxis type="number" dataKey="y" name="Impact Materiality" domain={[0, 1]} label={{ value: '← Impact Materiality', angle: -90, position: 'insideLeft', fontSize: 12 }} tick={{ fontSize: 11 }} />
                <ReferenceLine x={0.4} stroke="#9ca3af" strokeDasharray="4 4" />
                <ReferenceLine y={0.4} stroke="#9ca3af" strokeDasharray="4 4" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                  if (!payload?.length) return null;
                  const p = payload[0].payload;
                  const t = d.topics.find(t => t.id === p.name);
                  return <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
                    <strong>{p.name} — {t?.label}</strong><br />
                    Financial: {p.x} · Impact: {p.y}
                  </div>;
                }} />
                <Scatter data={d.scatterData} shape={(props) => {
                  const { cx, cy, payload } = props;
                  return <g><circle cx={cx} cy={cy} r={14} fill={payload.color} fillOpacity={0.8} /><text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fill="white" fontWeight="bold">{payload.name}</text></g>;
                }} />
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              {[{ color: '#ef4444', label: 'Double Material (Financial + Impact ≥ 0.4)' }, { color: '#f59e0b', label: 'Single Material' }, { color: '#059669', label: 'Not Material' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {tab === 1 && (
        <div>
          <Section title="ESRS Topics — Combined Materiality Score">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={d.topics} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 1]} />
                <YAxis type="category" dataKey="id" width={40} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => val.toFixed(2)} />
                <Bar dataKey="combined" name="Combined Score" radius={[0, 4, 4, 0]}>
                  {d.topics.map((t, i) => <Cell key={i} fill={t.isDouble ? '#ef4444' : t.isSingle ? '#f59e0b' : '#059669'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
          <Section title="ESRS Topic Detail">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f9fafb' }}>
                {['Topic', 'Label', 'Material', 'IROs', 'Impact Score', 'Financial Score'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {d.topics.map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#059669' }}>{t.id}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{t.label}</td>
                    <td style={{ padding: '8px 12px' }}><Badge label={t.isDouble ? 'Double' : t.isSingle ? 'Single' : 'No'} color={t.isDouble ? 'red' : t.isSingle ? 'yellow' : 'green'} /></td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{t.iroCount}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{t.impMat.toFixed(2)}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{t.finMat.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {tab === 2 && (
        <div>
          <Section title="IRO Registry Summary">
            <Row gap={12}>
              <KpiCard label="Total IROs" value={d.iros.length} sub="Across all ESRS topics" accent />
              <KpiCard label="Double Material" value={d.doubleMat} sub="Financial + Impact material" />
              <KpiCard label="Impact Only" value={d.impactOnly} sub="Impact material, not financial" />
              <KpiCard label="Financial Only" value={d.financialOnly} sub="Financial material, not impact" />
            </Row>
          </Section>
          <Section title="IRO Detail Table">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#f9fafb' }}>
                {['Topic', 'Type', 'Horizon', 'Impact Mat.', 'Financial Mat.', 'Value Chain'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {d.iros.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#059669' }}>{r.topic}</td>
                    <td style={{ padding: '8px 12px' }}><Badge label={r.type} color={r.type.startsWith('Impact-') ? 'red' : r.type === 'Risk' ? 'yellow' : r.type === 'Opportunity' ? 'green' : 'blue'} /></td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{r.horizon}</td>
                    <td style={{ padding: '8px 12px' }}><Badge label={r.impMat ? 'Yes' : 'No'} color={r.impMat ? 'red' : 'gray'} /></td>
                    <td style={{ padding: '8px 12px' }}><Badge label={r.finMat ? 'Yes' : 'No'} color={r.finMat ? 'yellow' : 'gray'} /></td>
                    <td style={{ padding: '8px 12px', color: '#374151', fontSize: 12 }}>{r.vc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {tab === 3 && (
        <div>
          <Row>
            <Section title="Stakeholder Engagement Completeness Radar">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={d.stakeholders}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Completeness %" dataKey="completeness" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Engagement Detail">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f9fafb' }}>
                  {['Group', 'Method', 'Frequency', 'Status'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {d.stakeholders.map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#111827' }}>{s.subject}</td>
                      <td style={{ padding: '8px 12px', color: '#374151' }}>{s.method}</td>
                      <td style={{ padding: '8px 12px', color: '#374151' }}>{s.frequency}</td>
                      <td style={{ padding: '8px 12px' }}><Badge label={s.status} color={s.status === 'Complete' ? 'green' : 'yellow'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </Row>
        </div>
      )}

      {tab === 4 && (
        <div>
          <Section title="Assurance Readiness Summary">
            <Row gap={12}>
              <KpiCard label="Completeness %" value={`${d.completeness}%`} sub="Disclosure completeness score" accent />
              <KpiCard label="Assurance Level" value={<Badge label={d.assuranceLevel} color={d.assuranceLevel === 'Reasonable' ? 'green' : d.assuranceLevel === 'Limited' ? 'yellow' : 'gray'} />} sub="ISAE 3000 / ISSA 5000" />
              <KpiCard label="Material Topics" value={d.materialTopics} sub={`Out of ${ESRS_TOPICS.length} ESRS topics`} />
              <KpiCard label="DPs Reported" value={d.dpReported} sub="Quantitative data points disclosed" />
            </Row>
          </Section>
          <Section title="Assurance Criteria Progress">
            {d.assuranceCriteria.map((c, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151', marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>{c.criterion}</span>
                  <span style={{ fontWeight: 700, color: c.score >= 70 ? '#059669' : c.score >= 55 ? '#d97706' : '#dc2626' }}>{c.score}/100</span>
                </div>
                <div style={{ background: '#f3f4f6', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${c.score}%`, height: '100%', background: c.score >= 70 ? '#059669' : c.score >= 55 ? '#f59e0b' : '#ef4444', borderRadius: 8 }} />
                </div>
              </div>
            ))}
          </Section>
          <Section title="CSRD Wave Timeline">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {CSRD_WAVES.map((w, i) => {
                const active = w.wave === wave;
                return (
                  <div key={i} style={{ border: `2px solid ${active ? '#059669' : '#e5e7eb'}`, borderRadius: 8, padding: 12, background: active ? '#f0fdf4' : 'white' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: active ? '#059669' : '#9ca3af', marginBottom: 4 }}>{w.label}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{w.threshold}</div>
                    {active && <div style={{ marginTop: 8 }}><Badge label="Your Wave" color="green" /></div>}
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
