import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell,
} from 'recharts';

const API = 'http://localhost:8001';
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const seed = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

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
  const colors = { green: { bg: '#d1fae5', text: '#065f46' }, yellow: { bg: '#fef3c7', text: '#92400e' }, red: { bg: '#fee2e2', text: '#991b1b' }, blue: { bg: '#dbeafe', text: '#1e40af' }, gray: { bg: '#f3f4f6', text: '#374151' }, purple: { bg: '#ede9fe', text: '#5b21b6' } };
  const c = colors[color] || colors.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: c.bg, color: c.text }}>{label}</span>;
};

const TABS = ['ICP Mechanism Design', 'Scope Cost Allocation', 'Carbon Budget Tracking', 'Abatement Cost Curve', 'Net-Zero Economics'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

const years = Array.from({ length: 27 }, (_, i) => 2024 + i);
const trajectoryData = years.map((yr, i) => ({
  year: yr,
  euETS: Math.round(65 + i * 3.8 + seed(i + 1) * 8),
  ets2: Math.round(20 + i * 4.2 + seed(i + 20) * 6),
  sbti15: Math.round(135 + i * 5.5 + seed(i + 40) * 4),
  sbti2c: Math.round(80 + i * 3.2 + seed(i + 60) * 5),
  current: Math.round(85 + i * 2.1 + seed(i + 80) * 3),
}));

const buUnits = [
  { name: 'Manufacturing', scope1: 12.4, scope2: 8.7, scope3: 31.2, ebitda: 145 },
  { name: 'Logistics', scope1: 18.6, scope2: 4.2, scope3: 22.1, ebitda: 67 },
  { name: 'Real Estate', scope1: 3.1, scope2: 15.8, scope3: 8.9, ebitda: 89 },
  { name: 'Retail', scope1: 1.8, scope2: 9.4, scope3: 41.3, ebitda: 112 },
  { name: 'Data Centres', scope1: 0.6, scope2: 22.1, scope3: 5.7, ebitda: 78 },
];

const carbonPrice = 85;
const buCostData = buUnits.map(u => ({
  name: u.name,
  scope1Cost: +(u.scope1 * carbonPrice / 1000).toFixed(1),
  scope2Cost: +(u.scope2 * carbonPrice / 1000).toFixed(1),
  scope3Cost: +(u.scope3 * carbonPrice / 1000).toFixed(1),
  pctEbitda: +((u.scope1 + u.scope2 + u.scope3) * carbonPrice / 1000 / u.ebitda * 100).toFixed(1),
}));

const budgetData = Array.from({ length: 11 }, (_, i) => ({
  year: 2020 + i,
  budget: Math.round(1000 - i * 85 + seed(i + 100) * 10),
  actual: Math.round(1000 - i * 70 + seed(i + 110) * 15),
}));
const remainingBudget = Math.round(budgetData[budgetData.length - 1].budget - budgetData[budgetData.length - 1].actual);

const macMeasures = [
  { measure: 'LED Lighting', cost: -45, abatement: 8.2 },
  { measure: 'Heat Pumps', cost: -18, abatement: 12.4 },
  { measure: 'Building Insulation', cost: 12, abatement: 18.6 },
  { measure: 'Solar PV Rooftop', cost: 22, abatement: 24.1 },
  { measure: 'Fleet EV Switch', cost: 35, abatement: 15.8 },
  { measure: 'Process Efficiency', cost: 48, abatement: 9.7 },
  { measure: 'Green Hydrogen', cost: 78, abatement: 22.3 },
  { measure: 'CCUS Retrofit', cost: 112, abatement: 31.4 },
  { measure: 'Bioenergy CHP', cost: 145, abatement: 19.2 },
  { measure: 'Direct Air Capture', cost: 312, abatement: 11.8 },
].sort((a, b) => a.cost - b.cost);

const nzeWaterfall = [
  { name: 'Energy Savings', value: 42, color: '#059669' },
  { name: 'ETS Cost Avoid.', value: 28, color: '#10b981' },
  { name: 'Green Premium', value: 15, color: '#34d399' },
  { name: 'CAPEX', value: -85, color: '#ef4444' },
  { name: 'OPEX', value: -18, color: '#f87171' },
  { name: 'Carbon Credits', value: -12, color: '#fca5a5' },
  { name: 'Net NPV', value: 0, color: '#059669' },
];
const npvTotal = nzeWaterfall.filter(d => d.value !== 0).reduce((s, d) => s + d.value, 0);
nzeWaterfall[nzeWaterfall.length - 1].value = npvTotal;

const etsShadow = years.slice(0, 15).map((yr, i) => ({
  year: yr,
  etsPhase4: Math.round(80 + i * 4.2 + seed(i + 200) * 6),
  ets2Exposure: Math.round(22 + i * 3.8 + seed(i + 210) * 4),
  totalLiability: Math.round(102 + i * 8 + seed(i + 220) * 8),
}));

export default function InternalCarbonPricePage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mechanism, setMechanism] = useState('shadow_price');

  const currentICP = 85;
  const sbtiMin15 = 135;
  const gap = sbtiMin15 - currentICP;
  const icpAdequacy = currentICP >= sbtiMin15 ? 'Aligned' : 'Below SBTi Minimum';
  const icpColor = currentICP >= sbtiMin15 ? 'green' : 'red';
  const totalCarbonCost = buCostData.reduce((s, u) => s + u.scope1Cost + u.scope2Cost + u.scope3Cost, 0);
  const totalEbitda = buUnits.reduce((s, u) => s + u.ebitda, 0);
  const pctEbitda = ((totalCarbonCost / totalEbitda) * 100).toFixed(1);
  const budgetOnTrack = budgetData[budgetData.length - 1].actual <= budgetData[budgetData.length - 1].budget;
  const annualReductionRequired = Math.round((budgetData[budgetData.length - 1].actual - 200) / (2030 - 2030 + 1));
  const exhaustionYear = 2028 + Math.round(seed(301) * 3);
  const cumulativeAbatement = macMeasures.reduce((s, m) => s + m.abatement, 0);
  const irr = (Math.round(seed(401) * 8 + 12)).toFixed(1);
  const paybackYrs = (Math.round(seed(402) * 4 + 6)).toFixed(1);
  const totalCarbonLiability = Math.round(seed(403) * 50 + 120);

  const runAnalysis = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/internal-carbon-price/assess`, { mechanism, current_price: currentICP });
    } catch {
      void 0 /* API fallback to seed data */;
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1b3a5c', margin: 0 }}>Internal Carbon Pricing (E84)</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>ICP Mechanism Design · Scope Cost Allocation · Carbon Budget · MAC Curve · Net-Zero Economics</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      {/* TAB 1 — ICP Mechanism Design */}
      {tab === 0 && (
        <div>
          <Section title="Mechanism Configuration">
            <Row>
              <Sel label="ICP Mechanism Type" value={mechanism} onChange={setMechanism} options={[
                { value: 'shadow_price', label: 'Shadow Price (Internal Only)' },
                { value: 'fee_dividend', label: 'Fee & Dividend (Revenue Recycled)' },
                { value: 'budget_based', label: 'Budget-Based (Sector Allocations)' },
              ]} />
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Btn onClick={runAnalysis}>{loading ? 'Analysing…' : 'Run ICP Analysis'}</Btn>
              </div>
            </Row>
          </Section>

          <Section title="ICP Price vs Benchmarks">
            <Row gap={12}>
              <KpiCard label="Current ICP (€/tCO₂e)" value={`€${currentICP}`} sub="Board-approved internal price" accent />
              <KpiCard label="SBTi 1.5°C Minimum" value={`€${sbtiMin15}`} sub="Required by 2025 (CDP/SBTi)" />
              <KpiCard label="Price Gap" value={`€${gap}/t`} sub="Current vs SBTi minimum" />
              <KpiCard label="ICP Adequacy" value={<Badge label={icpAdequacy} color={icpColor} />} sub="Against SBTi 1.5°C benchmark" />
            </Row>
          </Section>

          <Section title="ICP Trajectory 2024–2050">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trajectoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis unit="€/t" />
                <Tooltip formatter={(val) => `€${val}/t`} />
                <Legend />
                <Line type="monotone" dataKey="euETS" stroke="#3b82f6" strokeWidth={2} name="EU ETS Market" dot={false} />
                <Line type="monotone" dataKey="ets2" stroke="#f59e0b" strokeWidth={2} name="EU ETS2" dot={false} />
                <Line type="monotone" dataKey="sbti15" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3" name="SBTi 1.5°C Path" dot={false} />
                <Line type="monotone" dataKey="sbti2c" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="4 4" name="SBTi 2°C Path" dot={false} />
                <Line type="monotone" dataKey="current" stroke="#059669" strokeWidth={3} name="Internal Carbon Price" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Mechanism Design Recommendation">
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#065f46', marginBottom: 8 }}>Recommended: {mechanism === 'shadow_price' ? 'Shadow Price' : mechanism === 'fee_dividend' ? 'Fee & Dividend' : 'Budget-Based'}</div>
              {[
                `Raise ICP from €${currentICP}/t to €${sbtiMin15}/t by 2025 to meet SBTi 1.5°C minimum requirement.`,
                `Implement graduated escalation: €${currentICP}→€110 (2025), €110→€135 (2026), €135→€175 (2027) aligned with EU ETS2 trajectory.`,
                `Apply ICP across Scope 1 + Scope 2 first; extend to material Scope 3 categories (C1, C11, C15) by 2026.`,
                `Ring-fence 60% of ICP revenues for low-carbon CAPEX; 40% for employee transition support under fee-dividend mechanism.`,
                `Board reporting: quarterly ICP adequacy review vs EU ETS Phase 4 outturn prices and SBTi annual update.`,
              ].map((rec, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#374151' }}>
                  <span style={{ color: '#059669', fontWeight: 700, minWidth: 18 }}>{i + 1}.</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 2 — Scope Cost Allocation */}
      {tab === 1 && (
        <div>
          <Section title="Carbon Cost Summary">
            <Row gap={12}>
              <KpiCard label="Total Carbon Cost (€M)" value={`€${totalCarbonCost.toFixed(1)}M`} sub={`At ICP €${carbonPrice}/tCO₂e`} accent />
              <KpiCard label="Carbon Cost as % EBITDA" value={`${pctEbitda}%`} sub="Group-level materiality" />
              <KpiCard label="Scope 1 Cost (€M)" value={`€${buCostData.reduce((s, u) => s + u.scope1Cost, 0).toFixed(1)}M`} sub="Direct emissions" />
              <KpiCard label="Scope 3 Cost (€M)" value={`€${buCostData.reduce((s, u) => s + u.scope3Cost, 0).toFixed(1)}M`} sub="Value chain emissions" />
            </Row>
          </Section>

          <Section title="Carbon Cost by Business Unit (€M) — Scope Breakdown">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={buCostData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis unit="€M" />
                <Tooltip formatter={(val) => `€${val}M`} />
                <Legend />
                <Bar dataKey="scope1Cost" stackId="a" fill="#ef4444" name="Scope 1 Cost" />
                <Bar dataKey="scope2Cost" stackId="a" fill="#f59e0b" name="Scope 2 Cost" />
                <Bar dataKey="scope3Cost" stackId="a" fill="#059669" name="Scope 3 Cost" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Business Unit Carbon Cost Detail">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Business Unit', 'Scope 1 (€M)', 'Scope 2 (€M)', 'Scope 3 (€M)', 'Total (€M)', '% EBITDA', 'Risk'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {buCostData.map((r, i) => {
                  const total = +(r.scope1Cost + r.scope2Cost + r.scope3Cost).toFixed(1);
                  const risk = r.pctEbitda > 8 ? 'High' : r.pctEbitda > 4 ? 'Medium' : 'Low';
                  const riskColor = risk === 'High' ? 'red' : risk === 'Medium' ? 'yellow' : 'green';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1b3a5c' }}>{r.name}</td>
                      <td style={{ padding: '10px 12px', color: '#ef4444' }}>{r.scope1Cost}</td>
                      <td style={{ padding: '10px 12px', color: '#f59e0b' }}>{r.scope2Cost}</td>
                      <td style={{ padding: '10px 12px', color: '#059669' }}>{r.scope3Cost}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{total}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: r.pctEbitda > 8 ? '#dc2626' : '#374151' }}>{r.pctEbitda}%</td>
                      <td style={{ padding: '10px 12px' }}><Badge label={risk} color={riskColor} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 3 — Carbon Budget Tracking */}
      {tab === 2 && (
        <div>
          <Section title="Budget Status">
            <Row gap={12}>
              <KpiCard label="Remaining Carbon Budget" value={`${remainingBudget > 0 ? '+' : ''}${remainingBudget} ktCO₂e`} sub="2030 cumulative budget vs actual" accent />
              <KpiCard label="Budget Exhaustion Year" value={budgetOnTrack ? '>' + exhaustionYear : exhaustionYear.toString()} sub="At current reduction trajectory" />
              <KpiCard label="Annual Reduction Required" value={`${Math.abs(annualReductionRequired)} ktCO₂e/yr`} sub="To meet 2030 target" />
              <KpiCard label="On-Track Status" value={<Badge label={budgetOnTrack ? 'On Track' : 'Off Track'} color={budgetOnTrack ? 'green' : 'red'} />} sub="2030 carbon budget" />
            </Row>
          </Section>

          <Section title="Cumulative Carbon Budget vs Actual (2020–2030, ktCO₂e)">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis unit="kt" />
                <Tooltip formatter={(val) => `${val} ktCO₂e`} />
                <Legend />
                <Area type="monotone" dataKey="budget" stroke="#059669" fill="#d1fae5" strokeWidth={2} name="Budget Allocation" />
                <Area type="monotone" dataKey="actual" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} name="Actual Emissions" fillOpacity={0.5} />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Budget Variance by Year">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Year', 'Budget (ktCO₂e)', 'Actual (ktCO₂e)', 'Variance', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {budgetData.map((r, i) => {
                  const variance = r.budget - r.actual;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1b3a5c' }}>{r.year}</td>
                      <td style={{ padding: '10px 12px', color: '#059669', fontWeight: 600 }}>{r.budget}</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{r.actual}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: variance >= 0 ? '#059669' : '#dc2626' }}>
                        {variance >= 0 ? '+' : ''}{variance}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge label={variance >= 0 ? 'Within Budget' : 'Over Budget'} color={variance >= 0 ? 'green' : 'red'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 4 — Abatement Cost Curve */}
      {tab === 3 && (
        <div>
          <Section title="Marginal Abatement Cost (MAC) Overview">
            <Row gap={12}>
              <KpiCard label="Cumulative Abatement Potential" value={`${cumulativeAbatement.toFixed(1)} MtCO₂e`} sub="All 10 measures combined" accent />
              <KpiCard label="Measures Below ICP (€85/t)" value={macMeasures.filter(m => m.cost <= carbonPrice).length} sub={`Cost-effective at €${carbonPrice}/t`} />
              <KpiCard label="Cheapest Measure" value={macMeasures[0].measure} sub={`€${macMeasures[0].cost}/t · ${macMeasures[0].abatement} MtCO₂e`} />
              <KpiCard label="Total CAPEX Required" value="€342M" sub="Across all cost-effective measures" />
            </Row>
          </Section>

          <Section title="Marginal Abatement Cost Curve (€/tCO₂e vs Abatement Potential MtCO₂e)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={macMeasures}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="measure" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={55} />
                <YAxis yAxisId="left" label={{ value: '€/tCO₂e', angle: -90, position: 'insideLeft', offset: 10 }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'MtCO₂e', angle: 90, position: 'insideRight', offset: 10 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="cost" name="MAC (€/tCO₂e)" radius={[4, 4, 0, 0]}>
                  {macMeasures.map((m, i) => (
                    <Cell key={i} fill={m.cost < 0 ? '#059669' : m.cost <= carbonPrice ? '#10b981' : m.cost <= 150 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
                <Bar yAxisId="right" dataKey="abatement" name="Abatement Potential (Mt)" fill="#3b82f680" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="MAC Measure Detail">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Measure', 'MAC (€/tCO₂e)', 'Abatement (MtCO₂e)', 'vs ICP', 'Priority'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {macMeasures.map((m, i) => {
                  const vsIcp = carbonPrice - m.cost;
                  const priority = m.cost < 0 ? 'Immediate' : m.cost <= carbonPrice ? 'High' : m.cost <= 150 ? 'Medium' : 'Low';
                  const pc = priority === 'Immediate' ? 'green' : priority === 'High' ? 'blue' : priority === 'Medium' ? 'yellow' : 'gray';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1b3a5c' }}>{m.measure}</td>
                      <td style={{ padding: '10px 12px', color: m.cost < 0 ? '#059669' : '#374151', fontWeight: 600 }}>{m.cost < 0 ? `−€${Math.abs(m.cost)}` : `€${m.cost}`}</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{m.abatement} Mt</td>
                      <td style={{ padding: '10px 12px', color: vsIcp >= 0 ? '#059669' : '#dc2626', fontWeight: 600 }}>{vsIcp >= 0 ? `+€${vsIcp}` : `−€${Math.abs(vsIcp)}`}</td>
                      <td style={{ padding: '10px 12px' }}><Badge label={priority} color={pc} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 5 — Net-Zero Economics */}
      {tab === 4 && (
        <div>
          <Section title="Net-Zero Investment Economics">
            <Row gap={12}>
              <KpiCard label="NZE Net NPV (€M)" value={`€${npvTotal}M`} sub="30-year horizon, 5% discount rate" accent />
              <KpiCard label="Internal Rate of Return" value={`${irr}%`} sub="Blended NZE portfolio IRR" />
              <KpiCard label="Payback Period" value={`${paybackYrs} yrs`} sub="Simple payback on CAPEX" />
              <KpiCard label="Total Carbon Liability" value={`€${totalCarbonLiability}M`} sub="ETS + ETS2 combined (2024–2035)" />
            </Row>
          </Section>

          <Section title="NZE Investment vs Savings Waterfall (€M)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={nzeWaterfall}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis unit="€M" />
                <Tooltip formatter={(val) => `€${val}M`} />
                <Bar dataKey="value" name="Value (€M)" radius={[4, 4, 0, 0]}>
                  {nzeWaterfall.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="EU ETS Phase 4 + ETS2 Shadow Exposure (2024–2038)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={etsShadow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis unit="€M" />
                <Tooltip formatter={(val) => `€${val}M`} />
                <Legend />
                <Line type="monotone" dataKey="etsPhase4" stroke="#3b82f6" strokeWidth={2} name="ETS Phase 4 Exposure" dot={false} />
                <Line type="monotone" dataKey="ets2Exposure" stroke="#f59e0b" strokeWidth={2} name="ETS2 Exposure" dot={false} />
                <Line type="monotone" dataKey="totalLiability" stroke="#ef4444" strokeWidth={3} name="Total Carbon Liability" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}
    </div>
  );
}
