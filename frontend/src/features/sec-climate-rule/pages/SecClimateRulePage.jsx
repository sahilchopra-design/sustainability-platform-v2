import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const T = {
  bg: '#0f172a', surface: '#1e293b', surfaceH: '#334155', border: '#334155',
  navy: '#3b82f6', gold: '#f59e0b', sage: '#10b981', teal: '#14b8a6',
  text: '#f1f5f9', textSec: '#94a3b8', textMut: '#64748b',
  red: '#ef4444', green: '#22c55e', amber: '#f59e0b', font: 'Inter,sans-serif', mono: 'JetBrains Mono,monospace'
};
const sr = (s) => Math.abs(Math.sin(s * 9301 + 49297) * 233280) % 1;
const KpiCard = ({ label, value, sub, color = T.navy }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textMut, marginTop: 2 }}>{sub}</div>}
  </div>
);

const FILER_TYPES = ['Large Accelerated Filer', 'Accelerated Filer', 'Non-Accelerated Filer', 'Smaller Reporting Co', 'EGC'];
const SECTORS = ['Technology', 'Energy', 'Financials', 'Healthcare', 'Consumer', 'Industrials', 'Materials', 'Utilities', 'Real Estate'];
const COMPLIANCE_PHASES = [
  { phase: 'Phase 1 — Large Accelerated', deadline: 'FY2025 (filed 2026)', scope: 'Scope 1+2 GHG + Material Climate Risks + Financial Impact', filerType: 'Large Accelerated Filer', assurance: 'Limited Assurance', status: 'Active' },
  { phase: 'Phase 2 — Accelerated Filers', deadline: 'FY2026 (filed 2027)', scope: 'Scope 1+2 GHG + Material Climate Risks', filerType: 'Accelerated Filer', assurance: 'Limited Assurance', status: 'Upcoming' },
  { phase: 'Phase 3 — Non-Accelerated', deadline: 'FY2027 (filed 2028)', scope: 'Material Climate Risk Disclosures only', filerType: 'Non-Accelerated Filer', assurance: 'None Required', status: 'Upcoming' },
  { phase: 'Scope 3 — Stayed Pending Review', deadline: 'TBD (court challenge)', scope: 'Scope 3 (value chain) — stayed by SEC March 2024', filerType: 'Large Accelerated', assurance: 'Stayed', status: 'Stayed' },
];

const DISCLOSURE_REQUIREMENTS = [
  { req: 'Material Climate Risks', category: 'Risk Disclosure', required: true, notes: 'Both physical and transition risks if material', difficulty: 'Medium' },
  { req: 'GHG Emissions (Scope 1)', category: 'GHG Quantification', required: true, notes: 'Mandatory for Large Accelerated + Accelerated', difficulty: 'Medium' },
  { req: 'GHG Emissions (Scope 2)', category: 'GHG Quantification', required: true, notes: 'Location-based or market-based method', difficulty: 'Low' },
  { req: 'GHG Emissions (Scope 3)', category: 'GHG Quantification', required: false, notes: 'Stayed — not currently required', difficulty: 'High' },
  { req: 'Financial Impact Estimates', category: 'Financial Disclosure', required: true, notes: '1% of pretax income/loss or absolute $$ threshold', difficulty: 'High' },
  { req: 'Climate Risk Governance', category: 'Governance', required: true, notes: 'Board oversight + management role', difficulty: 'Low' },
  { req: 'Climate Risk Management', category: 'Strategy', required: true, notes: 'Integration into enterprise risk management', difficulty: 'Medium' },
  { req: 'Transition Plans', category: 'Strategy', required: false, notes: 'Voluntary — if adopted must disclose', difficulty: 'Medium' },
  { req: 'Internal Carbon Price', category: 'Strategy', required: false, notes: 'Voluntary — if used must disclose', difficulty: 'Low' },
  { req: 'Limited Assurance (S1+S2)', category: 'Assurance', required: true, notes: 'Large Accelerated only, phased in', difficulty: 'Medium' },
  { req: 'Cap/Trade + Carbon Offsets', category: 'GHG Quantification', required: true, notes: 'If material; registry/methodology required', difficulty: 'Medium' },
  { req: 'Extreme Weather Costs', category: 'Financial Disclosure', required: true, notes: '>$100K threshold in financials footnote', difficulty: 'High' },
];

const COMPANIES = Array.from({ length: 30 }, (_, i) => {
  const names = ['Apple', 'Microsoft', 'Amazon', 'Alphabet', 'Tesla', 'NVIDIA', 'Meta', 'JPMorgan', 'Visa', 'UnitedHealth', 'J&J', 'Walmart', 'P&G', 'Mastercard', 'Chevron', 'Home Depot', 'Coca-Cola', 'Pfizer', 'Exxon Mobil', 'Eli Lilly', 'Broadcom', 'Cisco', 'Merck', 'Accenture', 'Goldman Sachs', 'Caterpillar', 'Duke Energy', 'NextEra Energy', 'BHP USA', 'Ford Motor'];
  const ftype = FILER_TYPES[Math.floor(sr(i * 7) * 3)];
  const sector = SECTORS[i % SECTORS.length];
  const scope1 = Math.round(sr(i * 11) * 8000 + 200);
  const scope2 = Math.round(sr(i * 13) * 2000 + 100);
  const complScore = Math.round(40 + sr(i * 17) * 55);
  const ghgDisc = sr(i * 19) > 0.3;
  const riskDisc = sr(i * 23) > 0.2;
  const finImpact = sr(i * 29) > 0.4;
  const assurance = ftype === 'Large Accelerated Filer' ? (sr(i * 31) > 0.5 ? 'Limited' : 'None Yet') : 'N/A';
  const gaps = (!ghgDisc ? 1 : 0) + (!riskDisc ? 1 : 0) + (!finImpact ? 1 : 0);
  return { id: i + 1, name: names[i], sector, filerType: ftype, scope1, scope2, scope3: sr(i * 37) > 0.6 ? Math.round(scope1 * (sr(i * 41) * 8 + 2)) : null, complianceScore: complScore, ghgDisclosed: ghgDisc, riskDisclosed: riskDisc, financialImpact: finImpact, assurance, transitionPlan: sr(i * 43) > 0.55, internalCarbonPrice: sr(i * 47) > 0.5 ? Math.round(sr(i * 53) * 140 + 20) : null, disclosureGaps: gaps, status: complScore >= 75 ? 'Compliant' : complScore >= 50 ? 'Partial' : 'Non-Compliant' };
});

const TREND = ['Q3-22', 'Q4-22', 'Q1-23', 'Q2-23', 'Q3-23', 'Q4-23', 'Q1-24', 'Q2-24', 'Q3-24', 'Q4-24'].map((q, i) => ({
  quarter: q,
  'GHG Disclosed': Math.round(42 + i * 4.2 + sr(i) * 3),
  'Risk Disclosed': Math.round(55 + i * 3.8 + sr(i + 10) * 2),
  'Compliant': Math.round(28 + i * 5.5 + sr(i + 20) * 3),
}));

const TABS = ['Overview', 'Compliance Tracker', 'Disclosure Requirements', 'GHG Disclosures', 'Phase Timeline', 'Sector Analysis', 'Gap Assessment'];

export default function SecClimateRulePage() {
  const [tab, setTab] = useState('Overview');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [filerFilter, setFilerFilter] = useState('All');

  const filtered = useMemo(() => {
    let d = COMPANIES;
    if (sectorFilter !== 'All') d = d.filter(c => c.sector === sectorFilter);
    if (filerFilter !== 'All') d = d.filter(c => c.filerType === filerFilter);
    return d;
  }, [sectorFilter, filerFilter]);

  const kpis = useMemo(() => {
    const n = filtered.length > 0 ? filtered.length : 1;
    return {
      compliant: filtered.filter(c => c.status === 'Compliant').length,
      avgScore: (filtered.reduce((s, c) => s + c.complianceScore, 0) / n).toFixed(1),
      ghgDisc: filtered.filter(c => c.ghgDisclosed).length,
      hasTransPlan: filtered.filter(c => c.transitionPlan).length,
      hasICP: filtered.filter(c => c.internalCarbonPrice).length,
    };
  }, [filtered]);

  const tabBar = { display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20 };
  const tabBtn = (t) => ({ padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', border: 'none', background: tab === t ? T.navy : T.surfaceH, color: tab === t ? '#fff' : T.textSec, fontWeight: tab === t ? 600 : 400 });
  const statusColor = (s) => ({ 'Compliant': T.green, 'Partial': T.amber, 'Non-Compliant': T.red }[s] || T.textSec);
  const diffColor = (d) => ({ 'Low': T.green, 'Medium': T.amber, 'High': T.red }[d] || T.textSec);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: T.font, color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>SEC Climate Rule Compliance</div>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>SEC climate disclosure tracking across S&P 500 filers — ESRS/TCFD/GHG alignment — EP-DI3</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: T.textSec, alignSelf: 'center' }}>Sector:</span>
        {['All', ...SECTORS].map(s => <button key={s} onClick={() => setSectorFilter(s)} style={{ ...tabBtn(s), background: sectorFilter === s ? T.teal : T.surfaceH, color: sectorFilter === s ? '#fff' : T.textSec, fontSize: 11 }}>{s}</button>)}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Compliant Filers" value={`${kpis.compliant}/${filtered.length}`} sub="full compliance" color={T.green} />
        <KpiCard label="Avg Compliance Score" value={kpis.avgScore} sub="out of 100" color={T.navy} />
        <KpiCard label="GHG Disclosed" value={`${kpis.ghgDisc}/${filtered.length}`} sub="Scope 1+2 reported" color={T.teal} />
        <KpiCard label="Transition Plans" value={kpis.hasTransPlan} sub="voluntary disclosure" color={T.sage} />
        <KpiCard label="Internal Carbon Price" value={kpis.hasICP} sub="companies using ICP" color={T.gold} />
      </div>

      <div style={tabBar}>{TABS.map(t => <button key={t} style={tabBtn(t)} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Compliance Status Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={['Compliant', 'Partial', 'Non-Compliant'].map(s => ({ status: s, count: COMPANIES.filter(c => c.status === s).length }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="status" stroke={T.textSec} fontSize={12} />
                <YAxis stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="count" name="Companies" radius={[6, 6, 0, 0]} fill={T.navy} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Disclosure Adoption Trend</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="quarter" stroke={T.textSec} fontSize={10} />
                <YAxis domain={[20, 100]} stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
                <Line type="monotone" dataKey="GHG Disclosed" stroke={T.teal} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Risk Disclosed" stroke={T.sage} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Compliant" stroke={T.navy} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20, gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Key Rule Facts</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Rule Effective', value: 'March 2024', sub: 'Final rule adopted by SEC', color: T.navy },
                { label: 'Scope 3 Status', value: 'Stayed', sub: '4th Circuit challenge — paused Mar 2024', color: T.amber },
                { label: 'Phase 1 Deadline', value: 'FY2025', sub: 'Large Accelerated Filers first', color: T.teal },
                { label: 'Assurance Standard', value: 'PCAOB / IAASB', sub: 'Limited → Reasonable phased', color: T.sage },
                { label: 'GHG Protocol', value: 'Required', sub: 'Must use GHG Protocol for Scope 1+2', color: T.green },
                { label: 'Financial Threshold', value: '1% Pretax', sub: 'Trigger for financial impact disclosure', color: T.gold },
              ].map(k => (
                <div key={k.label} style={{ background: T.surfaceH, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 11, color: T.textSec }}>{k.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: k.color, marginTop: 4 }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: T.textMut, marginTop: 2 }}>{k.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Compliance Tracker' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['Company', 'Sector', 'Filer Type', 'Compliance Score', 'GHG Disc.', 'Risk Disc.', 'Fin. Impact', 'Trans. Plan', 'Assurance', 'Gaps', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 10px', textAlign: 'left', color: T.textSec, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? T.surface : 'transparent' }}>
                  <td style={{ padding: '9px 10px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                  <td style={{ padding: '9px 10px', color: T.textSec }}>{c.sector}</td>
                  <td style={{ padding: '9px 10px', fontSize: 11, color: T.textSec }}>{c.filerType.replace(' Filer', '')}</td>
                  <td style={{ padding: '9px 10px', fontWeight: 700, color: statusColor(c.status) }}>{c.complianceScore}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'center', color: c.ghgDisclosed ? T.green : T.red }}>{c.ghgDisclosed ? '✓' : '✗'}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'center', color: c.riskDisclosed ? T.green : T.red }}>{c.riskDisclosed ? '✓' : '✗'}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'center', color: c.financialImpact ? T.green : T.red }}>{c.financialImpact ? '✓' : '✗'}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'center', color: c.transitionPlan ? T.green : T.textMut }}>{c.transitionPlan ? '✓' : '–'}</td>
                  <td style={{ padding: '9px 10px', fontSize: 11, color: c.assurance === 'Limited' ? T.sage : T.textMut }}>{c.assurance}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'center', color: c.disclosureGaps > 0 ? T.amber : T.green }}>{c.disclosureGaps}</td>
                  <td style={{ padding: '9px 10px' }}><span style={{ color: statusColor(c.status), fontWeight: 600, fontSize: 11 }}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Disclosure Requirements' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            <KpiCard label="Mandatory Items" value={DISCLOSURE_REQUIREMENTS.filter(r => r.required).length} sub={`of ${DISCLOSURE_REQUIREMENTS.length} total`} color={T.red} />
            <KpiCard label="GHG-Related" value={DISCLOSURE_REQUIREMENTS.filter(r => r.category === 'GHG Quantification').length} sub="scope 1/2/3 items" color={T.teal} />
            <KpiCard label="Financial Disclosure" value={DISCLOSURE_REQUIREMENTS.filter(r => r.category === 'Financial Disclosure').length} sub="financial impact items" color={T.gold} />
            <KpiCard label="High Difficulty" value={DISCLOSURE_REQUIREMENTS.filter(r => r.difficulty === 'High').length} sub="complex requirements" color={T.amber} />
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.surfaceH }}>
                  {['Requirement', 'Category', 'Required', 'Difficulty', 'Notes'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.textSec, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DISCLOSURE_REQUIREMENTS.map((r, i) => (
                  <tr key={r.req} style={{ background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.req}</td>
                    <td style={{ padding: '10px 12px', color: T.teal, fontSize: 11 }}>{r.category}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: r.required ? T.green : T.textMut }}>{r.required ? '✓ Mandatory' : '○ Voluntary'}</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ color: diffColor(r.difficulty), fontSize: 11, fontWeight: 600 }}>{r.difficulty}</span></td>
                    <td style={{ padding: '10px 12px', color: T.textSec, fontSize: 12 }}>{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'GHG Disclosures' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Scope 1 Emissions Distribution</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={SECTORS.map(s => ({ sector: s, scope1: Math.round(COMPANIES.filter(c => c.sector === s).reduce((sum, c) => sum + c.scope1, 0) / Math.max(1, COMPANIES.filter(c => c.sector === s).length)) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" stroke={T.textSec} fontSize={9} angle={-25} textAnchor="end" height={50} />
                <YAxis stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="scope1" fill={T.navy} name="Avg Scope 1 (ktCO₂e)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Compliance Score vs GHG Intensity</div>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Scope 1 (kt)" stroke={T.textSec} fontSize={11} />
                <YAxis dataKey="y" name="Compliance Score" stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={filtered.map(c => ({ name: c.name, x: c.scope1, y: c.complianceScore }))} fill={T.teal} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Phase Timeline' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            {COMPLIANCE_PHASES.map((p, i) => (
              <div key={p.phase} style={{ background: T.surface, borderRadius: 10, padding: 20, borderLeft: `4px solid ${p.status === 'Active' ? T.green : p.status === 'Stayed' ? T.amber : T.navy}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{p.phase}</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>Deadline: {p.deadline}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: p.status === 'Active' ? T.green : p.status === 'Stayed' ? T.amber : T.textSec, background: `${p.status === 'Active' ? T.green : T.amber}20`, padding: '4px 10px', borderRadius: 6 }}>{p.status}</span>
                </div>
                <div style={{ fontSize: 13, color: T.textSec }}><strong style={{ color: T.text }}>Scope:</strong> {p.scope}</div>
                <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}><strong style={{ color: T.text }}>Assurance:</strong> {p.assurance}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Sector Analysis' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Avg Compliance Score by Sector</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={SECTORS.map(s => ({ sector: s, score: +(COMPANIES.filter(c => c.sector === s).reduce((sum, c) => sum + c.complianceScore, 0) / Math.max(1, COMPANIES.filter(c => c.sector === s).length)).toFixed(1) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" stroke={T.textSec} fontSize={9} angle={-25} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Bar dataKey="score" fill={T.sage} name="Avg Score" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Transition Plan Adoption by Sector</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={SECTORS.map(s => ({ sector: s, adopted: COMPANIES.filter(c => c.sector === s && c.transitionPlan).length, total: COMPANIES.filter(c => c.sector === s).length }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" stroke={T.textSec} fontSize={9} angle={-25} textAnchor="end" height={50} />
                <YAxis stroke={T.textSec} fontSize={11} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: 'none', color: T.text }} />
                <Legend wrapperStyle={{ color: T.textSec, fontSize: 11 }} />
                <Bar dataKey="total" fill={T.surfaceH} name="Total Filers" />
                <Bar dataKey="adopted" fill={T.teal} name="With Trans. Plan" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Gap Assessment' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
            {[['0 Gaps', COMPANIES.filter(c => c.disclosureGaps === 0).length, T.green], ['1 Gap', COMPANIES.filter(c => c.disclosureGaps === 1).length, T.amber], ['2+ Gaps', COMPANIES.filter(c => c.disclosureGaps >= 2).length, T.red]].map(([l, v, c]) => (
              <KpiCard key={l} label={l} value={v} sub={`of ${COMPANIES.length} filers`} color={c} />
            ))}
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Filers with Disclosure Gaps</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {COMPANIES.filter(c => c.disclosureGaps > 0).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: T.surfaceH, borderRadius: 8, borderLeft: `3px solid ${c.disclosureGaps >= 2 ? T.red : T.amber}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{c.sector} · {c.filerType.replace(' Filer', '')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {!c.ghgDisclosed && <span style={{ fontSize: 11, color: T.red, background: `${T.red}20`, padding: '2px 8px', borderRadius: 4 }}>GHG Missing</span>}
                    {!c.riskDisclosed && <span style={{ fontSize: 11, color: T.amber, background: `${T.amber}20`, padding: '2px 8px', borderRadius: 4 }}>Risk Missing</span>}
                    {!c.financialImpact && <span style={{ fontSize: 11, color: T.gold, background: `${T.gold}20`, padding: '2px 8px', borderRadius: 4 }}>Fin. Impact Missing</span>}
                    <span style={{ fontSize: 13, fontWeight: 700, color: statusColor(c.status) }}>{c.complianceScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
