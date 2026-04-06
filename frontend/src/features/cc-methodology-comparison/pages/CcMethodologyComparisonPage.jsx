import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell,
} from 'recharts';

const API = 'http://localhost:8001';
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ border: `1px solid ${accent || T.border}`, borderRadius: 8, padding: '16px 20px', background: T.surface }}>
    <div style={{ fontSize: 12, color: T.textMut, marginBottom: 4, fontFamily: T.mono }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);
const Section = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontSize: 16, fontWeight: 600, color: T.navy, marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${T.gold}` }}>{title}</div>
    {children}
  </div>
);
const Row = ({ children, gap = 12 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${React.Children.count(children)},1fr)`, gap }}>{children}</div>
);
const Badge = ({ label, color }) => {
  const colors = { green: { bg: '#d1fae5', text: '#065f46' }, yellow: { bg: '#fef3c7', text: '#92400e' }, red: { bg: '#fee2e2', text: '#991b1b' }, blue: { bg: '#dbeafe', text: '#1e40af' }, gray: { bg: '#f3f4f6', text: '#374151' }, purple: { bg: '#ede9fe', text: '#5b21b6' }, orange: { bg: '#ffedd5', text: '#9a3412' }, teal: { bg: '#ccfbf1', text: '#115e59' } };
  const c = colors[color] || colors.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: c.bg, color: c.text }}>{label}</span>;
};
const Sel = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: T.textSec, marginBottom: 4 }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 14, background: T.surface, fontFamily: T.font }}>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  </div>
);
const DualInput = ({ label, value, onChange, min = 0, max = 100, step = 1 }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: T.textSec, marginBottom: 4 }}>{label}</div>}
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1 }} />
      <input type="number" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: 70, padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, textAlign: 'center', fontFamily: T.mono }} />
    </div>
  </div>
);
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 20, overflowX: 'auto' }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)}
        style={{ padding: '10px 18px', border: 'none', borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent',
          background: 'none', cursor: 'pointer', fontWeight: active === t ? 700 : 500,
          color: active === t ? T.navy : T.textMut, fontSize: 13, fontFamily: T.font, whiteSpace: 'nowrap' }}>
        {t}
      </button>
    ))}
  </div>
);

const TABS = ['Methodology Matrix', 'Cost Curve Analysis', 'Permanence Comparison', 'Integrity Scoring', 'Co-Benefits Analysis', 'Scenario Builder'];
const FAMILIES = ['Nature-Based', 'Agriculture & Soil', 'Energy Transition', 'Waste & Circular', 'Industrial Process', 'Carbon Dioxide Removal', 'Community & Cookstoves'];
const FAMILY_COLORS = { 'Nature-Based': '#059669', 'Agriculture & Soil': '#84cc16', 'Energy Transition': '#3b82f6', 'Waste & Circular': '#f59e0b', 'Industrial Process': '#8b5cf6', 'Carbon Dioxide Removal': '#06b6d4', 'Community & Cookstoves': '#ec4899' };

const CLUSTERS = [
  { id: 1, name: 'REDD+ & Forests', family: 'Nature-Based', permanence: 40, additionality: 65, mrvComplexity: 85, coBenefitScore: 82, avgPrice: 12.50, bufferRate: 20, abatementCost: 8, sdgCommunity: 75, sdgBiodiversity: 90, sdgHealth: 30, sdgGender: 45 },
  { id: 2, name: 'Blue Carbon', family: 'Nature-Based', permanence: 50, additionality: 78, mrvComplexity: 92, coBenefitScore: 88, avgPrice: 18.20, bufferRate: 25, abatementCost: 15, sdgCommunity: 80, sdgBiodiversity: 95, sdgHealth: 25, sdgGender: 40 },
  { id: 3, name: 'Soil Carbon', family: 'Agriculture & Soil', permanence: 15, additionality: 55, mrvComplexity: 78, coBenefitScore: 70, avgPrice: 22.00, bufferRate: 30, abatementCost: 18, sdgCommunity: 65, sdgBiodiversity: 50, sdgHealth: 40, sdgGender: 55 },
  { id: 4, name: 'Regenerative Ag', family: 'Agriculture & Soil', permanence: 20, additionality: 60, mrvComplexity: 65, coBenefitScore: 75, avgPrice: 25.00, bufferRate: 25, abatementCost: 20, sdgCommunity: 70, sdgBiodiversity: 60, sdgHealth: 50, sdgGender: 60 },
  { id: 5, name: 'Rice Methane', family: 'Agriculture & Soil', permanence: 10, additionality: 72, mrvComplexity: 70, coBenefitScore: 68, avgPrice: 15.00, bufferRate: 15, abatementCost: 12, sdgCommunity: 60, sdgBiodiversity: 35, sdgHealth: 55, sdgGender: 65 },
  { id: 6, name: 'Renewable Energy', family: 'Energy Transition', permanence: 100, additionality: 45, mrvComplexity: 30, coBenefitScore: 42, avgPrice: 4.50, bufferRate: 5, abatementCost: 3, sdgCommunity: 40, sdgBiodiversity: 15, sdgHealth: 20, sdgGender: 30 },
  { id: 7, name: 'Methane Avoidance', family: 'Waste & Circular', permanence: 100, additionality: 68, mrvComplexity: 55, coBenefitScore: 55, avgPrice: 8.00, bufferRate: 10, abatementCost: 6, sdgCommunity: 45, sdgBiodiversity: 20, sdgHealth: 60, sdgGender: 25 },
  { id: 8, name: 'Landfill Gas', family: 'Waste & Circular', permanence: 100, additionality: 62, mrvComplexity: 50, coBenefitScore: 50, avgPrice: 6.50, bufferRate: 8, abatementCost: 5, sdgCommunity: 35, sdgBiodiversity: 10, sdgHealth: 65, sdgGender: 20 },
  { id: 9, name: 'Household Devices', family: 'Community & Cookstoves', permanence: 100, additionality: 80, mrvComplexity: 45, coBenefitScore: 92, avgPrice: 9.00, bufferRate: 5, abatementCost: 7, sdgCommunity: 95, sdgBiodiversity: 10, sdgHealth: 90, sdgGender: 85 },
  { id: 10, name: 'Safe Water', family: 'Community & Cookstoves', permanence: 100, additionality: 82, mrvComplexity: 40, coBenefitScore: 90, avgPrice: 7.50, bufferRate: 5, abatementCost: 5, sdgCommunity: 90, sdgBiodiversity: 5, sdgHealth: 85, sdgGender: 80 },
  { id: 11, name: 'Cement & Materials', family: 'Industrial Process', permanence: 100, additionality: 70, mrvComplexity: 60, coBenefitScore: 30, avgPrice: 10.00, bufferRate: 8, abatementCost: 9, sdgCommunity: 20, sdgBiodiversity: 5, sdgHealth: 30, sdgGender: 15 },
  { id: 12, name: 'Industrial Gas', family: 'Industrial Process', permanence: 100, additionality: 75, mrvComplexity: 55, coBenefitScore: 25, avgPrice: 5.50, bufferRate: 5, abatementCost: 4, sdgCommunity: 15, sdgBiodiversity: 5, sdgHealth: 25, sdgGender: 10 },
  { id: 13, name: 'Biochar', family: 'Carbon Dioxide Removal', permanence: 500, additionality: 88, mrvComplexity: 72, coBenefitScore: 65, avgPrice: 120.00, bufferRate: 10, abatementCost: 95, sdgCommunity: 50, sdgBiodiversity: 45, sdgHealth: 30, sdgGender: 35 },
  { id: 14, name: 'BECCS', family: 'Carbon Dioxide Removal', permanence: 5000, additionality: 90, mrvComplexity: 90, coBenefitScore: 35, avgPrice: 180.00, bufferRate: 15, abatementCost: 150, sdgCommunity: 25, sdgBiodiversity: 15, sdgHealth: 20, sdgGender: 15 },
  { id: 15, name: 'DAC', family: 'Carbon Dioxide Removal', permanence: 10000, additionality: 95, mrvComplexity: 85, coBenefitScore: 20, avgPrice: 450.00, bufferRate: 5, abatementCost: 380, sdgCommunity: 15, sdgBiodiversity: 5, sdgHealth: 10, sdgGender: 10 },
  { id: 16, name: 'Geo-Storage', family: 'Carbon Dioxide Removal', permanence: 10000, additionality: 92, mrvComplexity: 95, coBenefitScore: 15, avgPrice: 250.00, bufferRate: 8, abatementCost: 200, sdgCommunity: 10, sdgBiodiversity: 5, sdgHealth: 10, sdgGender: 5 },
  { id: 17, name: 'Mangrove Restoration', family: 'Nature-Based', permanence: 30, additionality: 82, mrvComplexity: 88, coBenefitScore: 90, avgPrice: 20.00, bufferRate: 22, abatementCost: 16, sdgCommunity: 85, sdgBiodiversity: 92, sdgHealth: 35, sdgGender: 50 },
  { id: 18, name: 'Peatland Rewetting', family: 'Nature-Based', permanence: 25, additionality: 75, mrvComplexity: 80, coBenefitScore: 78, avgPrice: 16.00, bufferRate: 20, abatementCost: 12, sdgCommunity: 55, sdgBiodiversity: 85, sdgHealth: 20, sdgGender: 30 },
  { id: 19, name: 'Enhanced Weathering', family: 'Carbon Dioxide Removal', permanence: 10000, additionality: 85, mrvComplexity: 82, coBenefitScore: 40, avgPrice: 90.00, bufferRate: 10, abatementCost: 70, sdgCommunity: 30, sdgBiodiversity: 25, sdgHealth: 15, sdgGender: 10 },
  { id: 20, name: 'Agroforestry', family: 'Agriculture & Soil', permanence: 30, additionality: 70, mrvComplexity: 68, coBenefitScore: 85, avgPrice: 18.00, bufferRate: 18, abatementCost: 14, sdgCommunity: 80, sdgBiodiversity: 70, sdgHealth: 45, sdgGender: 60 },
];

export default function CcMethodologyComparisonPage() {
  const [tab, setTab] = useState(TABS[0]);
  const [sel1, setSel1] = useState('1');
  const [sel2, setSel2] = useState('9');
  const [sel3, setSel3] = useState('15');

  const [retireTarget, setRetireTarget] = useState(100000);
  const [budget, setBudget] = useState(2000000);
  const [minPermanence, setMinPermanence] = useState(10);
  const [minCoBenefits, setMinCoBenefits] = useState(30);
  const [maxConcentration, setMaxConcentration] = useState(40);

  const maccData = useMemo(() =>
    [...CLUSTERS].sort((a, b) => a.abatementCost - b.abatementCost).map(c => ({
      name: c.name, cost: c.abatementCost, family: c.family, fill: FAMILY_COLORS[c.family] || T.sage
    })), []);

  const permanenceData = useMemo(() =>
    [...CLUSTERS].sort((a, b) => a.permanence - b.permanence).map(c => ({
      name: c.name, years: Math.min(c.permanence, 10000), family: c.family, fill: FAMILY_COLORS[c.family] || T.sage,
      label: c.permanence >= 10000 ? '10,000+' : c.permanence >= 1000 ? (c.permanence / 1000).toFixed(0) + 'k' : String(c.permanence)
    })), []);

  const integrityCompare = useMemo(() => {
    const ids = [Number(sel1), Number(sel2), Number(sel3)];
    return ids.map(id => CLUSTERS.find(c => c.id === id)).filter(Boolean).map(c => ({
      name: c.name,
      data: [
        { axis: 'Additionality', value: c.additionality },
        { axis: 'Baseline Robustness', value: Math.round(100 - c.mrvComplexity * 0.3 + sr(c.id * 7) * 15) },
        { axis: 'Leakage Risk', value: Math.round(100 - sr(c.id * 11) * 40 - 20) },
        { axis: 'MRV Quality', value: c.mrvComplexity },
        { axis: 'Permanence', value: Math.min(Math.round(Math.log10(c.permanence + 1) * 25), 100) },
      ]
    }));
  }, [sel1, sel2, sel3]);

  const coBenefitHeat = useMemo(() =>
    FAMILIES.map(f => {
      const fc = CLUSTERS.filter(c => c.family === f);
      if (!fc.length) return null;
      return {
        family: f,
        community: Math.round(fc.reduce((s, c) => s + c.sdgCommunity, 0) / fc.length),
        biodiversity: Math.round(fc.reduce((s, c) => s + c.sdgBiodiversity, 0) / fc.length),
        health: Math.round(fc.reduce((s, c) => s + c.sdgHealth, 0) / fc.length),
        gender: Math.round(fc.reduce((s, c) => s + c.sdgGender, 0) / fc.length),
      };
    }).filter(Boolean), []);

  const scenarioResult = useMemo(() => {
    const eligible = CLUSTERS.filter(c => c.permanence >= minPermanence && c.coBenefitScore >= minCoBenefits);
    if (!eligible.length) return { allocations: [], totalCredits: 0, totalCost: 0, avgPermanence: 0, avgCoBenefit: 0 };

    const sorted = [...eligible].sort((a, b) => a.abatementCost - b.abatementCost);
    let remaining = budget;
    let creditsLeft = retireTarget;
    const allocs = [];

    for (const c of sorted) {
      if (remaining <= 0 || creditsLeft <= 0) break;
      const maxByConc = Math.round(retireTarget * (maxConcentration / 100));
      const canAfford = Math.floor(remaining / c.avgPrice);
      const take = Math.min(canAfford, creditsLeft, maxByConc);
      if (take > 0) {
        allocs.push({ cluster: c.name, family: c.family, credits: take, cost: Math.round(take * c.avgPrice), price: c.avgPrice, permanence: c.permanence, coBenefit: c.coBenefitScore });
        remaining -= take * c.avgPrice;
        creditsLeft -= take;
      }
    }

    const totalCredits = allocs.reduce((s, a) => s + a.credits, 0);
    const totalCost = allocs.reduce((s, a) => s + a.cost, 0);
    const avgPermanence = allocs.length ? Math.round(allocs.reduce((s, a) => s + a.permanence * a.credits, 0) / Math.max(totalCredits, 1)) : 0;
    const avgCoBenefit = allocs.length ? Math.round(allocs.reduce((s, a) => s + a.coBenefit * a.credits, 0) / Math.max(totalCredits, 1)) : 0;

    return { allocations: allocs, totalCredits, totalCost, avgPermanence, avgCoBenefit, budgetUsed: (budget > 0 ? (totalCost / budget) * 100 : 0).toFixed(1), targetMet: (retireTarget > 0 ? (totalCredits / retireTarget) * 100 : 0).toFixed(1) };
  }, [retireTarget, budget, minPermanence, minCoBenefits, maxConcentration]);

  const RADAR_COLORS = ['#059669', '#3b82f6', '#f59e0b'];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.navy, margin: 0 }}>Cross-Methodology Comparison</h1>
          <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.mono, marginTop: 4 }}>EP-BW3 | 20 clusters across 7 families | MACC, permanence, integrity, co-benefits & scenario builder</div>
        </div>

        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {tab === 'Methodology Matrix' && (
          <Section title="Full Methodology Comparison (20 Clusters)">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['#', 'Cluster', 'Family', 'Permanence (yr)', 'Additionality', 'MRV Complexity', 'Co-Benefit', 'Avg $/t', 'Buffer %'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: T.textMut, fontWeight: 600, fontFamily: T.mono, fontSize: 10, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CLUSTERS.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '6px 8px', fontFamily: T.mono, color: T.textMut }}>{c.id}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '6px 8px' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: FAMILY_COLORS[c.family], marginRight: 4 }} />{c.family.split(' ')[0]}</td>
                      <td style={{ padding: '6px 8px', fontFamily: T.mono }}>{c.permanence >= 10000 ? '10,000+' : c.permanence.toLocaleString()}</td>
                      <td style={{ padding: '6px 8px' }}><Badge label={c.additionality} color={c.additionality >= 80 ? 'green' : c.additionality >= 60 ? 'yellow' : 'red'} /></td>
                      <td style={{ padding: '6px 8px' }}><Badge label={c.mrvComplexity} color={c.mrvComplexity >= 80 ? 'red' : c.mrvComplexity >= 60 ? 'yellow' : 'green'} /></td>
                      <td style={{ padding: '6px 8px' }}><Badge label={c.coBenefitScore} color={c.coBenefitScore >= 75 ? 'green' : c.coBenefitScore >= 50 ? 'yellow' : 'gray'} /></td>
                      <td style={{ padding: '6px 8px', fontFamily: T.mono, fontWeight: 600 }}>${c.avgPrice.toFixed(2)}</td>
                      <td style={{ padding: '6px 8px', fontFamily: T.mono }}>{c.bufferRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {tab === 'Cost Curve Analysis' && (
          <>
            <Section title="Marginal Abatement Cost Curve (MACC)">
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>Clusters ordered by abatement cost ($/tCO2e) - lower cost on the left</div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={maccData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" style={{ fontSize: 9 }} angle={-30} textAnchor="end" height={90} />
                  <YAxis style={{ fontSize: 11 }} label={{ value: '$/tCO2e', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                  <Tooltip formatter={v => '$' + v.toFixed(2) + '/tCO2e'} />
                  <Bar dataKey="cost" name="Abatement Cost">
                    {maccData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Cost vs Co-Benefit Tradeoff">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8 }}>Low Cost Leaders (under $10/t)</div>
                  {CLUSTERS.filter(c => c.abatementCost < 10).sort((a, b) => a.abatementCost - b.abatementCost).map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                      <span>{c.name}</span>
                      <span style={{ fontFamily: T.mono }}>${c.abatementCost}/t | Co-B: {c.coBenefitScore}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8 }}>High Permanence Leaders (1000+ yrs)</div>
                  {CLUSTERS.filter(c => c.permanence >= 1000).sort((a, b) => b.permanence - a.permanence).map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                      <span>{c.name}</span>
                      <span style={{ fontFamily: T.mono }}>{c.permanence >= 10000 ? '10k+' : c.permanence.toLocaleString()} yrs | ${c.abatementCost}/t</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </>
        )}

        {tab === 'Permanence Comparison' && (
          <Section title="Permanence Spectrum (log scale conceptual)">
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>From soil carbon (10-20 yrs) to geological CCS (10,000+ yrs)</div>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={permanenceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis type="number" style={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : String(v)} label={{ value: 'Permanence (years)', position: 'bottom', style: { fontSize: 11 } }} />
                <YAxis type="category" dataKey="name" width={150} style={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n, p) => [p.payload.label + ' years', 'Permanence']} />
                <Bar dataKey="years" name="Permanence (years)">
                  {permanenceData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
              {[
                { range: 'Short (10-30 yrs)', examples: 'Soil Carbon, Rice Methane, Peatland', color: T.amber },
                { range: 'Medium (30-100 yrs)', examples: 'REDD+, Forests, Mangrove', color: '#84cc16' },
                { range: 'Long (100+ yrs)', examples: 'Renewable Energy, Waste, Cookstoves', color: '#3b82f6' },
                { range: 'Geological (1000+ yrs)', examples: 'Biochar, BECCS, DAC, Geo-CCS', color: '#8b5cf6' },
              ].map(b => (
                <div key={b.range} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, background: T.surface, borderTop: `3px solid ${b.color}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{b.range}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{b.examples}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {tab === 'Integrity Scoring' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <Sel label="Cluster 1" value={sel1} onChange={setSel1} options={CLUSTERS.map(c => ({ value: String(c.id), label: c.name }))} />
              <Sel label="Cluster 2" value={sel2} onChange={setSel2} options={CLUSTERS.map(c => ({ value: String(c.id), label: c.name }))} />
              <Sel label="Cluster 3" value={sel3} onChange={setSel3} options={CLUSTERS.map(c => ({ value: String(c.id), label: c.name }))} />
            </div>

            <Section title="Integrity Radar Comparison">
              <ResponsiveContainer width="100%" height={380}>
                <RadarChart data={integrityCompare[0]?.data || []}>
                  <PolarGrid stroke={T.borderL} />
                  <PolarAngleAxis dataKey="axis" style={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} style={{ fontSize: 9 }} />
                  {integrityCompare.map((ic, idx) => (
                    <Radar key={ic.name} name={ic.name} dataKey="value"
                      data={ic.data} stroke={RADAR_COLORS[idx]} fill={RADAR_COLORS[idx]} fillOpacity={0.15} />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Side-by-Side Detail">
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${integrityCompare.length}, 1fr)`, gap: 16 }}>
                {integrityCompare.map((ic, idx) => {
                  const c = CLUSTERS.find(cl => cl.name === ic.name);
                  if (!c) return null;
                  return (
                    <div key={c.id} style={{ border: `2px solid ${RADAR_COLORS[idx]}`, borderRadius: 10, padding: 16, background: T.surface }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: T.textMut, marginBottom: 12 }}>{c.family}</div>
                      {[
                        ['Additionality', c.additionality],
                        ['MRV Quality', c.mrvComplexity],
                        ['Co-Benefit Score', c.coBenefitScore],
                        ['Permanence', c.permanence >= 10000 ? '10,000+ yrs' : c.permanence + ' yrs'],
                        ['Buffer Rate', c.bufferRate + '%'],
                        ['Avg Price', '$' + c.avgPrice.toFixed(2)],
                      ].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                          <span style={{ color: T.textSec }}>{k}</span>
                          <span style={{ fontWeight: 600, fontFamily: T.mono }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </Section>
          </>
        )}

        {tab === 'Co-Benefits Analysis' && (
          <Section title="SDG Co-Benefits Heatmap by Family">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['Family', 'Community', 'Biodiversity', 'Health', 'Gender'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: T.textMut, fontWeight: 600, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coBenefitHeat.map((f, i) => (
                    <tr key={f.family} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: FAMILY_COLORS[f.family], marginRight: 6 }} />{f.family}</td>
                      {['community', 'biodiversity', 'health', 'gender'].map(dim => {
                        const v = f[dim];
                        const intensity = v / 100;
                        const bg = `rgba(5, 150, 105, ${intensity * 0.7 + 0.05})`;
                        const textC = intensity > 0.5 ? '#fff' : T.navy;
                        return (
                          <td key={dim} style={{ padding: '10px 12px', background: bg, color: textC, fontWeight: 700, fontFamily: T.mono, textAlign: 'center' }}>
                            {v}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8 }}>Cluster-Level Detail</div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={CLUSTERS.slice(0, 12)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis type="number" domain={[0, 100]} style={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={140} style={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sdgCommunity" name="Community" stackId="a" fill="#059669" />
                  <Bar dataKey="sdgBiodiversity" name="Biodiversity" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="sdgHealth" name="Health" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="sdgGender" name="Gender" stackId="a" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        )}

        {tab === 'Scenario Builder' && (
          <>
            <Section title="Portfolio Construction Parameters">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <DualInput label="Retirement Target (tCO2e)" value={retireTarget} onChange={setRetireTarget} min={10000} max={1000000} step={10000} />
                  <DualInput label="Total Budget ($)" value={budget} onChange={setBudget} min={100000} max={50000000} step={100000} />
                  <DualInput label="Min Permanence (years)" value={minPermanence} onChange={setMinPermanence} min={0} max={10000} step={10} />
                  <DualInput label="Min Co-Benefit Score" value={minCoBenefits} onChange={setMinCoBenefits} min={0} max={100} step={5} />
                  <DualInput label="Max Single-Cluster Concentration (%)" value={maxConcentration} onChange={setMaxConcentration} min={10} max={100} step={5} />
                </div>
                <div>
                  <div style={{ border: `2px solid ${T.gold}`, borderRadius: 10, padding: 20, background: T.surface }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Scenario Results</div>
                    <Row>
                      <KpiCard label="CREDITS SECURED" value={scenarioResult.totalCredits.toLocaleString()} sub={`${scenarioResult.targetMet}% of target`} accent={T.gold} />
                      <KpiCard label="TOTAL COST" value={'$' + (scenarioResult.totalCost / 1e6).toFixed(2) + 'M'} sub={`${scenarioResult.budgetUsed}% of budget`} />
                    </Row>
                    <div style={{ marginTop: 12 }}>
                      <Row>
                        <KpiCard label="AVG PERMANENCE" value={scenarioResult.avgPermanence >= 1000 ? (scenarioResult.avgPermanence / 1000).toFixed(1) + 'k yrs' : scenarioResult.avgPermanence + ' yrs'} />
                        <KpiCard label="AVG CO-BENEFIT" value={scenarioResult.avgCoBenefit + '/100'} />
                      </Row>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {scenarioResult.allocations.length > 0 && (
              <>
                <Section title="Recommended Allocation">
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                          {['Cluster', 'Family', 'Credits', 'Cost', 'Price/t', 'Permanence', 'Co-Benefit', 'Share'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: T.textMut, fontWeight: 600, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {scenarioResult.allocations.map((a, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600 }}>{a.cluster}</td>
                            <td style={{ padding: '8px 10px' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: FAMILY_COLORS[a.family], marginRight: 4 }} />{a.family.split(' ')[0]}</td>
                            <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{a.credits.toLocaleString()}</td>
                            <td style={{ padding: '8px 10px', fontFamily: T.mono }}>${(a.cost / 1e6).toFixed(2)}M</td>
                            <td style={{ padding: '8px 10px', fontFamily: T.mono }}>${a.price.toFixed(2)}</td>
                            <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{a.permanence >= 10000 ? '10k+' : a.permanence} yrs</td>
                            <td style={{ padding: '8px 10px' }}><Badge label={a.coBenefit} color={a.coBenefit >= 75 ? 'green' : a.coBenefit >= 50 ? 'yellow' : 'gray'} /></td>
                            <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{((a.credits / scenarioResult.totalCredits) * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>

                <Section title="Allocation by Family">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={scenarioResult.allocations}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                      <XAxis dataKey="cluster" style={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                      <YAxis tickFormatter={v => (v / 1e3).toFixed(0) + 'k'} style={{ fontSize: 11 }} />
                      <Tooltip formatter={v => v.toLocaleString()} />
                      <Bar dataKey="credits" name="Credits Allocated">
                        {scenarioResult.allocations.map((a, i) => <Cell key={i} fill={FAMILY_COLORS[a.family] || T.sage} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Section>
              </>
            )}

            {scenarioResult.allocations.length === 0 && (
              <div style={{ border: `1px dashed ${T.border}`, borderRadius: 10, padding: 40, textAlign: 'center', color: T.textMut }}>
                No eligible clusters match the current constraints. Try lowering permanence or co-benefit minimums.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
