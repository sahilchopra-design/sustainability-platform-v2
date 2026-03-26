import React, { useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell,
} from 'recharts';

const API = 'http://localhost:8000';

/* ── Deterministic seed helpers ─────────────────────────────────────────── */
const seededRandom = (seed) => { let x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };
const hashStr = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return Math.abs(h); };

/* ── Theme ──────────────────────────────────────────────────────────────── */
const T = {
  bg: '#f6f4f0', navy: '#1b3a5c', gold: '#c5a96a', sage: '#5a8a6a',
  card: '#ffffff', border: '#e2ddd5', text: '#2c2c2c', sub: '#6b7280',
  red: '#dc2626', amber: '#d97706', green: '#16a34a', blue: '#2563eb',
  indigo: '#4f46e5', teal: '#0d9488',
  font: "'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

const OBJ_COLORS = {
  mitigation: '#1b3a5c', adaptation: '#2563eb', water: '#0d9488',
  circular: '#5a8a6a', pollution: '#d97706', biodiversity: '#16a34a',
};
const OBJ_LABELS = ['Climate Mitigation', 'Climate Adaptation', 'Water', 'Circular Economy', 'Pollution', 'Biodiversity'];
const OBJ_KEYS = ['mitigation', 'adaptation', 'water', 'circular', 'pollution', 'biodiversity'];

const NACE_OPTIONS = [
  { value: 'D35.11', label: 'D35.11 - Production of electricity' },
  { value: 'C20.11', label: 'C20.11 - Manufacture of industrial gases' },
  { value: 'F41.1', label: 'F41.1 - Development of building projects' },
  { value: 'F41.2', label: 'F41.2 - Construction of buildings' },
  { value: 'H49.10', label: 'H49.10 - Passenger rail transport' },
  { value: 'H49.20', label: 'H49.20 - Freight rail transport' },
  { value: 'C29.10', label: 'C29.10 - Motor vehicle manufacturing' },
  { value: 'J62.01', label: 'J62.01 - Computer programming' },
  { value: 'M71.12', label: 'M71.12 - Engineering activities' },
  { value: 'E38.11', label: 'E38.11 - Waste collection' },
  { value: 'C24.10', label: 'C24.10 - Iron & steel manufacturing' },
  { value: 'C23.51', label: 'C23.51 - Cement manufacturing' },
  { value: 'A02.10', label: 'A02.10 - Silviculture / forestry' },
  { value: 'K64.19', label: 'K64.19 - Other monetary intermediation' },
  { value: 'K65.12', label: 'K65.12 - Non-life insurance' },
];

const SECTOR_OPTIONS = ['Energy', 'Manufacturing', 'Construction', 'Transport', 'ICT', 'Forestry', 'Water & Waste', 'Financial Services', 'Real Estate'];

const TABS = ['Activity Assessment', 'Entity Assessment', 'Portfolio GAR', 'Reference Data', 'Reporting Timeline'];

/* ── Mini components ────────────────────────────────────────────────────── */
const Btn = ({ children, onClick, disabled, color = 'navy', sm }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? '#9ca3af' : (color === 'navy' ? T.navy : color === 'gold' ? T.gold : color === 'green' ? T.green : color === 'red' ? T.red : color === 'sage' ? T.sage : T.navy),
    color: '#fff', border: 'none', borderRadius: 6,
    padding: sm ? '6px 14px' : '10px 22px',
    fontSize: sm ? 12 : 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: T.font, transition: 'opacity .15s',
  }}>{children}</button>
);

const Card = ({ children, style }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)', ...style }}>{children}</div>
);

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 11, color: T.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy, margin: '6px 0 2px' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub }}>{sub}</div>}
  </div>
);

const Inp = ({ label, value, onChange, type = 'text', placeholder, small }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{label}</label>}
    <input value={value} onChange={e => onChange(e.target.value)} type={type} placeholder={placeholder}
      style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: small ? '5px 10px' : '8px 12px',
        fontSize: small ? 12 : 13, fontFamily: T.font, background: '#fafafa', color: T.text, outline: 'none', boxSizing: 'border-box' }} />
  </div>
);

const Sel = ({ label, value, onChange, options }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 12px', fontSize: 13, fontFamily: T.font, background: '#fafafa', color: T.text }}>
      {options.map(o => <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>{typeof o === 'string' ? o : o.label}</option>)}
    </select>
  </div>
);

const Badge = ({ label, color }) => {
  const colors = { green: { bg: '#d1fae5', text: '#065f46' }, red: { bg: '#fee2e2', text: '#991b1b' }, yellow: { bg: '#fef3c7', text: '#92400e' }, blue: { bg: '#dbeafe', text: '#1e40af' }, gray: { bg: '#f3f4f6', text: '#374151' }, teal: { bg: '#ccfbf1', text: '#115e59' }, amber: { bg: '#ffedd5', text: '#9a3412' } };
  const c = colors[color] || colors.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: c.bg, color: c.text }}>{label}</span>;
};

const Chk = ({ label, checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.text, cursor: 'pointer', padding: '4px 0' }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
      style={{ width: 16, height: 16, accentColor: T.navy }} />
    {label}
  </label>
);

const Row = ({ children, cols, gap = 12 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: cols || `repeat(${React.Children.count(children)},1fr)`, gap }}>{children}</div>
);

const Section = ({ title, color, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: color || T.navy, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${color || T.navy}` }}>{title}</div>
    {children}
  </div>
);

/* ── Data generation ────────────────────────────────────────────────────── */
const genActivityResult = (name, nace, sector, revenue, capex, opex, seed0) => {
  const r = (n) => seededRandom(seed0 + n);
  const objScores = OBJ_KEYS.map((k, i) => ({ key: k, label: OBJ_LABELS[i], score: Math.round(r(i + 1) * 40 + 40) }));
  const targetIdx = Math.floor(r(7) * 6);
  objScores[targetIdx].score = Math.min(100, objScores[targetIdx].score + 25);
  const substantialContrib = objScores[targetIdx].score;
  const dnshResults = OBJ_KEYS.map((k, i) => ({
    objective: OBJ_LABELS[i], isTarget: i === targetIdx, pass: i === targetIdx ? null : r(10 + i) > 0.25,
    criteria: i === targetIdx ? 'Target objective' : (r(20 + i) > 0.5 ? 'Emissions within threshold' : 'Risk assessment completed'),
  }));
  const dnshPass = dnshResults.filter(d => !d.isTarget).every(d => d.pass);
  const safeguards = { oecd: r(30) > 0.2, ungp: r(31) > 0.25, ilo: r(32) > 0.2, csddd: r(33) > 0.3 };
  const safeguardsPass = Object.values(safeguards).every(Boolean);
  const eligible = substantialContrib >= 40;
  const aligned = eligible && dnshPass && safeguardsPass;
  const gaps = [];
  if (!eligible) gaps.push({ area: 'Substantial Contribution', issue: `Score ${substantialContrib}% below 50% threshold`, priority: 'High' });
  dnshResults.filter(d => !d.isTarget && !d.pass).forEach(d => gaps.push({ area: `DNSH - ${d.objective}`, issue: 'Criteria not met', priority: 'Medium' }));
  Object.entries(safeguards).filter(([, v]) => !v).forEach(([k]) => gaps.push({ area: `Safeguard - ${k.toUpperCase()}`, issue: 'Compliance gap', priority: 'High' }));
  return { name, nace, sector, revenue: parseFloat(revenue) || 0, capex: parseFloat(capex) || 0, opex: parseFloat(opex) || 0, objScores, targetObjective: OBJ_LABELS[targetIdx], substantialContrib, dnshResults, dnshPass, safeguards, safeguardsPass, eligible, aligned, gaps };
};

const genEntityData = (activities) => {
  const totalRev = activities.reduce((s, a) => s + a.revenue, 0) || 1;
  const totalCapex = activities.reduce((s, a) => s + a.capex, 0) || 1;
  const totalOpex = activities.reduce((s, a) => s + a.opex, 0) || 1;
  const alignedRev = activities.filter(a => a.aligned).reduce((s, a) => s + a.revenue, 0);
  const eligibleRev = activities.filter(a => a.eligible).reduce((s, a) => s + a.revenue, 0);
  const alignedCapex = activities.filter(a => a.aligned).reduce((s, a) => s + a.capex, 0);
  const eligibleCapex = activities.filter(a => a.eligible).reduce((s, a) => s + a.capex, 0);
  const alignedOpex = activities.filter(a => a.aligned).reduce((s, a) => s + a.opex, 0);
  const eligibleOpex = activities.filter(a => a.eligible).reduce((s, a) => s + a.opex, 0);
  return {
    turnoverAligned: ((alignedRev / totalRev) * 100).toFixed(1),
    turnoverEligible: ((eligibleRev / totalRev) * 100).toFixed(1),
    capexAligned: ((alignedCapex / totalCapex) * 100).toFixed(1),
    capexEligible: ((eligibleCapex / totalCapex) * 100).toFixed(1),
    opexAligned: ((alignedOpex / totalOpex) * 100).toFixed(1),
    opexEligible: ((eligibleOpex / totalOpex) * 100).toFixed(1),
  };
};

const DEFAULT_PORTFOLIO = [
  { name: 'Tata Power', sector: 'Energy', nace: 'D35.11', weight: 25, revenue: 480, capex: 120, opex: 85 },
  { name: 'Larsen & Toubro', sector: 'Construction', nace: 'F41.2', weight: 20, revenue: 1200, capex: 340, opex: 210 },
  { name: 'HDFC Bank', sector: 'Financial Services', nace: 'K64.19', weight: 20, revenue: 890, capex: 60, opex: 45 },
  { name: 'JSW Steel', sector: 'Manufacturing', nace: 'C24.10', weight: 20, revenue: 960, capex: 280, opex: 190 },
  { name: 'Adani Green Energy', sector: 'Energy', nace: 'D35.11', weight: 15, revenue: 320, capex: 250, opex: 55 },
];

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 1 — Activity Assessment
   ═══════════════════════════════════════════════════════════════════════════ */
const ActivityTab = () => {
  const [form, setForm] = useState({ name: 'Solar PV Installation', nace: 'D35.11', sector: 'Energy', revenue: '150', capex: '80', opex: '25',
    ghgReduction: '72', energyEff: '35', renewablePct: '90',
    physRiskDone: true, adaptSolutions: true, vulnReduction: true,
    waterReduction: '18', wastewaterLevel: 'tertiary', waterBodyImpact: 'none',
    recycledContent: '30', wasteReduction: '25', durability: true,
    pollutantVsThreshold: 'below', reachCompliance: true, aqImpact: 'positive',
    eiaDone: true, bioNetGain: true, protectedArea: false, ecoRestoration: true,
  });
  const [dnshChecks, setDnshChecks] = useState({ adaptation: true, water: true, circular: true, pollution: true, biodiversity: true });
  const [safeguards, setSafeguards] = useState({ oecd: true, ungp: true, ilo: true, csddd: false });
  const [result, setResult] = useState(null);

  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const assess = () => setResult(genActivityResult(form.name, form.nace, form.sector, form.revenue, form.capex, form.opex, hashStr(form.name + form.nace)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Common fields */}
      <Card>
        <Section title="Activity Details">
          <Row cols="1fr 1fr 1fr" gap={16}>
            <Inp label="Activity Name" value={form.name} onChange={v => u('name', v)} />
            <Sel label="NACE Code" value={form.nace} onChange={v => u('nace', v)} options={NACE_OPTIONS} />
            <Sel label="Sector" value={form.sector} onChange={v => u('sector', v)} options={SECTOR_OPTIONS} />
          </Row>
          <div style={{ height: 12 }} />
          <Row cols="1fr 1fr 1fr" gap={16}>
            <Inp label="Revenue (Cr)" value={form.revenue} onChange={v => u('revenue', v)} type="number" />
            <Inp label="CapEx (Cr)" value={form.capex} onChange={v => u('capex', v)} type="number" />
            <Inp label="OpEx (Cr)" value={form.opex} onChange={v => u('opex', v)} type="number" />
          </Row>
        </Section>
      </Card>

      {/* 6 Objective Cards */}
      <Row cols="1fr 1fr" gap={16}>
        <Card style={{ borderTop: `3px solid ${OBJ_COLORS.mitigation}` }}>
          <Section title="Climate Mitigation" color={OBJ_COLORS.mitigation}>
            <Row cols="1fr 1fr 1fr" gap={12}>
              <Inp label="GHG Reduction %" value={form.ghgReduction} onChange={v => u('ghgReduction', v)} type="number" small />
              <Inp label="Energy Efficiency %" value={form.energyEff} onChange={v => u('energyEff', v)} type="number" small />
              <Inp label="Renewable Energy %" value={form.renewablePct} onChange={v => u('renewablePct', v)} type="number" small />
            </Row>
          </Section>
        </Card>
        <Card style={{ borderTop: `3px solid ${OBJ_COLORS.adaptation}` }}>
          <Section title="Climate Adaptation" color={OBJ_COLORS.adaptation}>
            <Chk label="Physical risk assessment conducted" checked={form.physRiskDone} onChange={v => u('physRiskDone', v)} />
            <Chk label="Adaptation solutions implemented" checked={form.adaptSolutions} onChange={v => u('adaptSolutions', v)} />
            <Chk label="Vulnerability reduction measures" checked={form.vulnReduction} onChange={v => u('vulnReduction', v)} />
          </Section>
        </Card>
        <Card style={{ borderTop: `3px solid ${OBJ_COLORS.water}` }}>
          <Section title="Water & Marine Resources" color={OBJ_COLORS.water}>
            <Row cols="1fr 1fr" gap={12}>
              <Inp label="Water Use Reduction %" value={form.waterReduction} onChange={v => u('waterReduction', v)} type="number" small />
              <Sel label="Wastewater Treatment" value={form.wastewaterLevel} onChange={v => u('wastewaterLevel', v)} options={['primary', 'secondary', 'tertiary']} />
            </Row>
            <div style={{ height: 8 }} />
            <Sel label="Water Body Impact" value={form.waterBodyImpact} onChange={v => u('waterBodyImpact', v)} options={['none', 'minor', 'moderate', 'significant']} />
          </Section>
        </Card>
        <Card style={{ borderTop: `3px solid ${OBJ_COLORS.circular}` }}>
          <Section title="Circular Economy" color={OBJ_COLORS.circular}>
            <Row cols="1fr 1fr" gap={12}>
              <Inp label="Recycled Content %" value={form.recycledContent} onChange={v => u('recycledContent', v)} type="number" small />
              <Inp label="Waste Reduction %" value={form.wasteReduction} onChange={v => u('wasteReduction', v)} type="number" small />
            </Row>
            <div style={{ height: 8 }} />
            <Chk label="Durability / repairability design" checked={form.durability} onChange={v => u('durability', v)} />
          </Section>
        </Card>
        <Card style={{ borderTop: `3px solid ${OBJ_COLORS.pollution}` }}>
          <Section title="Pollution Prevention" color={OBJ_COLORS.pollution}>
            <Sel label="Pollutant Emissions vs Threshold" value={form.pollutantVsThreshold} onChange={v => u('pollutantVsThreshold', v)} options={['below', 'at threshold', 'above']} />
            <div style={{ height: 8 }} />
            <Chk label="REACH compliance" checked={form.reachCompliance} onChange={v => u('reachCompliance', v)} />
            <Sel label="Air/Water/Soil Quality Impact" value={form.aqImpact} onChange={v => u('aqImpact', v)} options={['positive', 'neutral', 'negative']} />
          </Section>
        </Card>
        <Card style={{ borderTop: `3px solid ${OBJ_COLORS.biodiversity}` }}>
          <Section title="Biodiversity & Ecosystems" color={OBJ_COLORS.biodiversity}>
            <Chk label="EIA conducted" checked={form.eiaDone} onChange={v => u('eiaDone', v)} />
            <Chk label="Biodiversity net gain" checked={form.bioNetGain} onChange={v => u('bioNetGain', v)} />
            <Chk label="Protected area impact" checked={form.protectedArea} onChange={v => u('protectedArea', v)} />
            <Chk label="Ecosystem restoration measures" checked={form.ecoRestoration} onChange={v => u('ecoRestoration', v)} />
          </Section>
        </Card>
      </Row>

      {/* DNSH & Safeguards */}
      <Row cols="1fr 1fr" gap={16}>
        <Card>
          <Section title="DNSH Assessment" color={T.indigo}>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 8 }}>For each non-target objective, confirm DNSH criteria met:</div>
            {OBJ_KEYS.filter(k => k !== 'mitigation').map(k => (
              <Chk key={k} label={`DNSH - ${OBJ_LABELS[OBJ_KEYS.indexOf(k)]}`} checked={dnshChecks[k] || false} onChange={v => setDnshChecks(p => ({ ...p, [k]: v }))} />
            ))}
          </Section>
        </Card>
        <Card>
          <Section title="Minimum Safeguards" color={T.amber}>
            <Chk label="OECD Guidelines for MNEs" checked={safeguards.oecd} onChange={v => setSafeguards(p => ({ ...p, oecd: v }))} />
            <Chk label="UN Guiding Principles (UNGP)" checked={safeguards.ungp} onChange={v => setSafeguards(p => ({ ...p, ungp: v }))} />
            <Chk label="ILO Core Labour Conventions" checked={safeguards.ilo} onChange={v => setSafeguards(p => ({ ...p, ilo: v }))} />
            <Chk label="CSDDD Compliance" checked={safeguards.csddd} onChange={v => setSafeguards(p => ({ ...p, csddd: v }))} />
          </Section>
        </Card>
      </Row>

      <div style={{ textAlign: 'center' }}><Btn onClick={assess}>Assess Activity Alignment</Btn></div>

      {/* Results */}
      {result && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <KpiCard label="Eligible" value={result.eligible ? 'Yes' : 'No'} color={result.eligible ? T.green : T.red} />
            <KpiCard label="Aligned" value={result.aligned ? 'Yes' : 'No'} color={result.aligned ? T.green : T.red} />
            <KpiCard label="Substantial Contribution" value={`${result.substantialContrib}%`} color={result.substantialContrib >= 50 ? T.green : T.amber} />
            <KpiCard label="DNSH Pass" value={result.dnshPass ? 'Yes' : 'No'} color={result.dnshPass ? T.green : T.red} />
            <KpiCard label="Safeguards Pass" value={result.safeguardsPass ? 'Yes' : 'No'} color={result.safeguardsPass ? T.green : T.red} />
          </div>

          <Row cols="1fr 1fr" gap={16}>
            {/* Radar */}
            <Card>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>6-Objective Radar</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={result.objScores.map(o => ({ subject: o.label, score: o.score, fullMark: 100 }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Score" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
            {/* DNSH Heatmap */}
            <Card>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>DNSH Matrix</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: 8, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>Objective</th>
                    <th style={{ padding: 8, textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>Status</th>
                    <th style={{ padding: 8, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>Criteria</th>
                  </tr>
                </thead>
                <tbody>
                  {result.dnshResults.map((d, i) => (
                    <tr key={i} style={{ background: d.isTarget ? '#f0f9ff' : d.pass ? '#f0fdf4' : '#fef2f2' }}>
                      <td style={{ padding: 8, borderBottom: `1px solid ${T.border}`, fontWeight: d.isTarget ? 600 : 400 }}>{d.objective}</td>
                      <td style={{ padding: 8, textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
                        {d.isTarget ? <Badge label="Target" color="blue" /> : d.pass ? <Badge label="Pass" color="green" /> : <Badge label="Fail" color="red" />}
                      </td>
                      <td style={{ padding: 8, borderBottom: `1px solid ${T.border}`, color: T.sub }}>{d.criteria}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Row>

          {/* Gap analysis */}
          {result.gaps.length > 0 && (
            <Card>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Gap Analysis</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: 8, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>Area</th>
                    <th style={{ padding: 8, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>Issue</th>
                    <th style={{ padding: 8, textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {result.gaps.map((g, i) => (
                    <tr key={i}>
                      <td style={{ padding: 8, borderBottom: `1px solid ${T.border}`, fontWeight: 600 }}>{g.area}</td>
                      <td style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}>{g.issue}</td>
                      <td style={{ padding: 8, textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
                        <Badge label={g.priority} color={g.priority === 'High' ? 'red' : 'yellow'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 2 — Entity Assessment
   ═══════════════════════════════════════════════════════════════════════════ */
const EntityTab = () => {
  const [entityName, setEntityName] = useState('Tata Power Ltd');
  const [activities, setActivities] = useState([
    { name: 'Solar PV', nace: 'D35.11', sector: 'Energy', revenue: '200', capex: '90', opex: '30' },
    { name: 'Wind Farm', nace: 'D35.11', sector: 'Energy', revenue: '180', capex: '110', opex: '28' },
    { name: 'Grid Infrastructure', nace: 'D35.11', sector: 'Energy', revenue: '100', capex: '60', opex: '27' },
  ]);
  const [results, setResults] = useState(null);

  const addActivity = () => setActivities(p => [...p, { name: '', nace: 'D35.11', sector: 'Energy', revenue: '0', capex: '0', opex: '0' }]);
  const removeActivity = (idx) => setActivities(p => p.filter((_, i) => i !== idx));
  const updateActivity = (idx, k, v) => setActivities(p => p.map((a, i) => i === idx ? { ...a, [k]: v } : a));

  const assess = () => {
    const assessed = activities.map(a => genActivityResult(a.name, a.nace, a.sector, a.revenue, a.capex, a.opex, hashStr(entityName + a.name + a.nace)));
    const entity = genEntityData(assessed);
    setResults({ activities: assessed, entity });
  };

  const barData = results ? [
    { kpi: 'Turnover', aligned: parseFloat(results.entity.turnoverAligned), eligible: parseFloat(results.entity.turnoverEligible) - parseFloat(results.entity.turnoverAligned), nonEligible: 100 - parseFloat(results.entity.turnoverEligible) },
    { kpi: 'CapEx', aligned: parseFloat(results.entity.capexAligned), eligible: parseFloat(results.entity.capexEligible) - parseFloat(results.entity.capexAligned), nonEligible: 100 - parseFloat(results.entity.capexEligible) },
    { kpi: 'OpEx', aligned: parseFloat(results.entity.opexAligned), eligible: parseFloat(results.entity.opexEligible) - parseFloat(results.entity.opexAligned), nonEligible: 100 - parseFloat(results.entity.opexEligible) },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <Section title="Entity Details">
          <Inp label="Entity Name" value={entityName} onChange={setEntityName} />
        </Section>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>Economic Activities ({activities.length})</div>
          <Btn onClick={addActivity} sm color="sage">+ Add Activity</Btn>
        </div>
        {activities.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 10, padding: 12, background: '#fafaf8', borderRadius: 8, border: `1px solid ${T.border}` }}>
            <div style={{ flex: 2 }}><Inp label="Activity" value={a.name} onChange={v => updateActivity(i, 'name', v)} small /></div>
            <div style={{ flex: 2 }}><Sel label="NACE" value={a.nace} onChange={v => updateActivity(i, 'nace', v)} options={NACE_OPTIONS} /></div>
            <div style={{ flex: 1 }}><Inp label="Rev (Cr)" value={a.revenue} onChange={v => updateActivity(i, 'revenue', v)} type="number" small /></div>
            <div style={{ flex: 1 }}><Inp label="CapEx (Cr)" value={a.capex} onChange={v => updateActivity(i, 'capex', v)} type="number" small /></div>
            <div style={{ flex: 1 }}><Inp label="OpEx (Cr)" value={a.opex} onChange={v => updateActivity(i, 'opex', v)} type="number" small /></div>
            <Btn onClick={() => removeActivity(i)} sm color="red">X</Btn>
          </div>
        ))}
      </Card>

      <div style={{ textAlign: 'center' }}><Btn onClick={assess}>Assess Entity Alignment</Btn></div>

      {results && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <KpiCard label="Turnover Aligned" value={`${results.entity.turnoverAligned}%`} sub={`Eligible: ${results.entity.turnoverEligible}%`} color={parseFloat(results.entity.turnoverAligned) > 30 ? T.green : T.amber} />
            <KpiCard label="CapEx Aligned" value={`${results.entity.capexAligned}%`} sub={`Eligible: ${results.entity.capexEligible}%`} color={parseFloat(results.entity.capexAligned) > 30 ? T.green : T.amber} />
            <KpiCard label="OpEx Aligned" value={`${results.entity.opexAligned}%`} sub={`Eligible: ${results.entity.opexEligible}%`} color={parseFloat(results.entity.opexAligned) > 30 ? T.green : T.amber} />
            <KpiCard label="Activities" value={results.activities.length} sub={`${results.activities.filter(a => a.aligned).length} aligned`} />
          </div>

          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>KPI Breakdown: Aligned vs Eligible vs Non-Eligible</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="kpi" width={80} />
                <Tooltip formatter={v => `${v.toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="aligned" stackId="a" fill={T.green} name="Aligned" />
                <Bar dataKey="eligible" stackId="a" fill={T.gold} name="Eligible (not aligned)" />
                <Bar dataKey="nonEligible" stackId="a" fill="#d1d5db" name="Non-Eligible" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Activity-Level Results</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Activity', 'NACE', 'Revenue', 'CapEx', 'Eligible', 'Aligned', 'SC %', 'DNSH', 'Safeguards'].map(h => (
                      <th key={h} style={{ padding: 8, textAlign: 'left', borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.sub }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.activities.map((a, i) => (
                    <tr key={i}>
                      <td style={{ padding: 8, borderBottom: `1px solid ${T.border}`, fontWeight: 600 }}>{a.name}</td>
                      <td style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}>{a.nace}</td>
                      <td style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}>{a.revenue} Cr</td>
                      <td style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}>{a.capex} Cr</td>
                      <td style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}><Badge label={a.eligible ? 'Yes' : 'No'} color={a.eligible ? 'green' : 'red'} /></td>
                      <td style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}><Badge label={a.aligned ? 'Yes' : 'No'} color={a.aligned ? 'green' : 'red'} /></td>
                      <td style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}>{a.substantialContrib}%</td>
                      <td style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}><Badge label={a.dnshPass ? 'Pass' : 'Fail'} color={a.dnshPass ? 'green' : 'red'} /></td>
                      <td style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}><Badge label={a.safeguardsPass ? 'Pass' : 'Fail'} color={a.safeguardsPass ? 'green' : 'red'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 3 — Portfolio GAR
   ═══════════════════════════════════════════════════════════════════════════ */
const PortfolioTab = () => {
  const [holdings, setHoldings] = useState(DEFAULT_PORTFOLIO.map(h => ({ ...h })));
  const [result, setResult] = useState(null);

  const updateHolding = (idx, k, v) => setHoldings(p => p.map((h, i) => i === idx ? { ...h, [k]: k === 'weight' || k === 'revenue' || k === 'capex' || k === 'opex' ? parseFloat(v) || 0 : v } : h));
  const addHolding = () => setHoldings(p => [...p, { name: '', sector: 'Energy', nace: 'D35.11', weight: 0, revenue: 0, capex: 0, opex: 0 }]);
  const removeHolding = (idx) => setHoldings(p => p.filter((_, i) => i !== idx));

  const calculate = () => {
    const entities = holdings.map(h => {
      const act = genActivityResult(h.name, h.nace, h.sector, String(h.revenue), String(h.capex), String(h.opex), hashStr(h.name + h.nace));
      return { ...h, aligned: act.aligned, eligible: act.eligible, alignedPct: act.aligned ? act.substantialContrib : 0 };
    });
    const totalWeight = entities.reduce((s, e) => s + e.weight, 0) || 1;
    const gar = entities.reduce((s, e) => s + (e.aligned ? e.weight * e.alignedPct / 100 : 0), 0) / totalWeight;
    const btar = entities.reduce((s, e) => s + (e.eligible ? e.weight * 0.6 : 0), 0) / totalWeight;
    const weightedAlignment = entities.reduce((s, e) => s + e.weight * e.alignedPct / 100, 0) / totalWeight;
    setResult({ entities, gar: gar.toFixed(1), btar: btar.toFixed(1), weightedAlignment: (weightedAlignment * 100).toFixed(1) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>Portfolio Holdings ({holdings.length})</div>
          <Btn onClick={addHolding} sm color="sage">+ Add Holding</Btn>
        </div>
        {holdings.map((h, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 8, padding: 10, background: '#fafaf8', borderRadius: 8, border: `1px solid ${T.border}` }}>
            <div style={{ flex: 2 }}><Inp label="Entity" value={h.name} onChange={v => updateHolding(i, 'name', v)} small /></div>
            <div style={{ flex: 1.5 }}><Sel label="Sector" value={h.sector} onChange={v => updateHolding(i, 'sector', v)} options={SECTOR_OPTIONS} /></div>
            <div style={{ flex: 1 }}><Inp label="Weight %" value={h.weight} onChange={v => updateHolding(i, 'weight', v)} type="number" small /></div>
            <div style={{ flex: 1 }}><Inp label="Rev (Cr)" value={h.revenue} onChange={v => updateHolding(i, 'revenue', v)} type="number" small /></div>
            <div style={{ flex: 1 }}><Inp label="CapEx (Cr)" value={h.capex} onChange={v => updateHolding(i, 'capex', v)} type="number" small /></div>
            <div style={{ flex: 1 }}><Inp label="OpEx (Cr)" value={h.opex} onChange={v => updateHolding(i, 'opex', v)} type="number" small /></div>
            <Btn onClick={() => removeHolding(i)} sm color="red">X</Btn>
          </div>
        ))}
      </Card>

      <div style={{ textAlign: 'center' }}><Btn onClick={calculate}>Calculate Portfolio GAR</Btn></div>

      {result && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <KpiCard label="Green Asset Ratio (GAR)" value={`${result.gar}%`} sub="Taxonomy-aligned / total assets" color={parseFloat(result.gar) > 15 ? T.green : T.amber} />
            <KpiCard label="BTAR" value={`${result.btar}%`} sub="Banking Book Taxonomy Alignment" color={parseFloat(result.btar) > 20 ? T.green : T.amber} />
            <KpiCard label="Weighted Alignment" value={`${result.weightedAlignment}%`} sub="Portfolio-weighted alignment" />
            <KpiCard label="Holdings" value={result.entities.length} sub={`${result.entities.filter(e => e.aligned).length} aligned`} />
          </div>

          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Portfolio Alignment Breakdown</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={result.entities.map(e => ({ name: e.name, alignment: e.alignedPct, weight: e.weight }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v, n) => n === 'weight' ? `${v}%` : `${v}%`} />
                <Legend />
                <Bar dataKey="alignment" fill={T.navy} name="Alignment %" />
                <Bar dataKey="weight" fill={T.gold} name="Weight %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Entity-Level Results</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Entity', 'Sector', 'Weight', 'Revenue', 'Eligible', 'Aligned', 'Alignment %'].map(h => (
                    <th key={h} style={{ padding: 8, textAlign: 'left', borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.sub }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.entities.map((e, i) => (
                  <tr key={i}>
                    <td style={{ padding: 8, borderBottom: `1px solid ${T.border}`, fontWeight: 600 }}>{e.name}</td>
                    <td style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}>{e.sector}</td>
                    <td style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}>{e.weight}%</td>
                    <td style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}>{e.revenue} Cr</td>
                    <td style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}><Badge label={e.eligible ? 'Yes' : 'No'} color={e.eligible ? 'green' : 'red'} /></td>
                    <td style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}><Badge label={e.aligned ? 'Yes' : 'No'} color={e.aligned ? 'green' : 'red'} /></td>
                    <td style={{ padding: 8, borderBottom: `1px solid ${T.border}`, fontWeight: 600, color: e.alignedPct > 50 ? T.green : T.amber }}>{e.alignedPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 4 — Reference Data
   ═══════════════════════════════════════════════════════════════════════════ */
const ReferenceTab = () => {
  const [refTab, setRefTab] = useState(0);
  const refTabs = ['Environmental Objectives', 'DNSH Matrix', 'Minimum Safeguards', 'NACE Activities', 'Transitional vs Enabling', 'Financial KPIs'];

  const objectives = [
    { name: 'Climate Change Mitigation', code: 'CCM', color: OBJ_COLORS.mitigation, desc: 'Stabilising GHG emissions consistent with Paris Agreement long-term temperature goal through avoidance, reduction or removal of GHG emissions.', tsc: 'Sector-specific GHG thresholds, energy efficiency benchmarks, renewable energy criteria', timeline: '2022: Eligibility + Alignment' },
    { name: 'Climate Change Adaptation', code: 'CCA', color: OBJ_COLORS.adaptation, desc: 'Reducing or preventing the adverse impact of current/expected climate, or the risks of such adverse impact, on the activity itself or people, nature, assets.', tsc: 'Physical risk assessment, adaptation solution implementation, vulnerability reduction', timeline: '2022: Eligibility + Alignment' },
    { name: 'Sustainable Use of Water & Marine Resources', code: 'WTR', color: OBJ_COLORS.water, desc: 'Ensuring water use, marine resource utilisation does not compromise good status of water bodies or marine ecosystems.', tsc: 'Water use efficiency, wastewater treatment, water body impact assessment', timeline: '2024: Eligibility, 2026: Alignment' },
    { name: 'Transition to a Circular Economy', code: 'CE', color: OBJ_COLORS.circular, desc: 'Increasing durability, reparability, recyclability and resource efficiency of products, reducing waste, and promoting circular business models.', tsc: 'Recycled content, waste reduction, design for longevity', timeline: '2024: Eligibility, 2026: Alignment' },
    { name: 'Pollution Prevention & Control', code: 'PPC', color: OBJ_COLORS.pollution, desc: 'Preventing or reducing pollutant emissions to air, water and soil (other than GHGs), minimising adverse impacts on human health and the environment.', tsc: 'Emission thresholds, REACH compliance, BAT adoption', timeline: '2024: Eligibility, 2026: Alignment' },
    { name: 'Protection of Biodiversity & Ecosystems', code: 'BIO', color: OBJ_COLORS.biodiversity, desc: 'Protecting, conserving or restoring biodiversity, achieving good condition of ecosystems, or protecting ecosystems already in good condition.', tsc: 'EIA requirement, biodiversity net gain, ecosystem restoration', timeline: '2024: Eligibility, 2026: Alignment' },
  ];

  const dnshMatrix = [
    { target: 'CCM', dnsh: ['CCA', 'WTR', 'CE', 'PPC', 'BIO'] },
    { target: 'CCA', dnsh: ['CCM', 'WTR', 'CE', 'PPC', 'BIO'] },
    { target: 'WTR', dnsh: ['CCM', 'CCA', 'CE', 'PPC', 'BIO'] },
    { target: 'CE', dnsh: ['CCM', 'CCA', 'WTR', 'PPC', 'BIO'] },
    { target: 'PPC', dnsh: ['CCM', 'CCA', 'WTR', 'CE', 'BIO'] },
    { target: 'BIO', dnsh: ['CCM', 'CCA', 'WTR', 'CE', 'PPC'] },
  ];

  const safeguards = [
    { framework: 'OECD Guidelines for MNEs', scope: 'Broad responsible business conduct covering human rights, employment, environment, anti-corruption, consumer interests, taxation', requirement: 'Align business operations with OECD Guidelines; implement due diligence processes' },
    { framework: 'UN Guiding Principles (UNGP)', scope: 'Human rights due diligence: identify, prevent, mitigate, account for adverse human rights impacts', requirement: 'Policy commitment, human rights impact assessments, grievance mechanisms' },
    { framework: 'ILO Core Labour Conventions', scope: 'Freedom of association, collective bargaining, elimination of forced and child labour, non-discrimination', requirement: 'Respect all 8 fundamental conventions regardless of national ratification status' },
    { framework: 'CSDDD (Corp. Sustainability Due Diligence)', scope: 'EU directive requiring companies to conduct due diligence on human rights and environmental impacts across value chains', requirement: 'Establish due diligence processes, integrate into governance, provide remediation' },
  ];

  const naceActivities = [
    { code: 'A02.10', desc: 'Silviculture & forestry', sector: 'Forestry', objectives: 'CCM, BIO' },
    { code: 'C20.11', desc: 'Industrial gases manufacture', sector: 'Manufacturing', objectives: 'CCM' },
    { code: 'C23.51', desc: 'Cement manufacturing', sector: 'Manufacturing', objectives: 'CCM' },
    { code: 'C24.10', desc: 'Iron & steel manufacturing', sector: 'Manufacturing', objectives: 'CCM, CE' },
    { code: 'C29.10', desc: 'Motor vehicle manufacturing', sector: 'Manufacturing', objectives: 'CCM, PPC' },
    { code: 'D35.11', desc: 'Electricity production', sector: 'Energy', objectives: 'CCM, CCA' },
    { code: 'E38.11', desc: 'Waste collection', sector: 'Water & Waste', objectives: 'CE, PPC' },
    { code: 'F41.1', desc: 'Building development', sector: 'Construction', objectives: 'CCM, CCA' },
    { code: 'F41.2', desc: 'Building construction', sector: 'Construction', objectives: 'CCM, CE' },
    { code: 'H49.10', desc: 'Passenger rail transport', sector: 'Transport', objectives: 'CCM, PPC' },
    { code: 'H49.20', desc: 'Freight rail transport', sector: 'Transport', objectives: 'CCM' },
    { code: 'J62.01', desc: 'Computer programming', sector: 'ICT', objectives: 'CCM' },
    { code: 'K64.19', desc: 'Monetary intermediation', sector: 'Financial Services', objectives: 'CCM, CCA' },
    { code: 'K65.12', desc: 'Non-life insurance', sector: 'Financial Services', objectives: 'CCA' },
    { code: 'M71.12', desc: 'Engineering activities', sector: 'Professional Services', objectives: 'CCM, CCA' },
  ];

  const transVsEnable = [
    { type: 'Transitional', definition: 'Activities for which there is no technologically and economically feasible low-carbon alternative, but that support the transition to climate neutrality', examples: 'Cement manufacturing (C23.51), Steel production (C24.10), Freight transport (H49.20)', conditions: 'Best available performance, no lock-in of carbon-intensive assets, no hindrance to low-carbon alternatives' },
    { type: 'Enabling', definition: 'Activities that directly enable other activities to make a substantial contribution to one or more environmental objectives', examples: 'Energy efficiency equipment (C28), Data processing for climate monitoring (J63), Engineering consulting (M71)', conditions: 'Does not lead to lock-in, has substantial positive environmental impact based on life-cycle assessment' },
  ];

  const financialKpis = [
    { entity: 'Non-Financial Corporates', kpi: 'Turnover KPI', definition: 'Proportion of net revenue from taxonomy-aligned activities / total net revenue', formula: 'Aligned Turnover / Total Turnover x 100' },
    { entity: 'Non-Financial Corporates', kpi: 'CapEx KPI', definition: 'Capital expenditure on taxonomy-aligned activities or CapEx plans / total CapEx', formula: 'Aligned CapEx / Total CapEx x 100' },
    { entity: 'Non-Financial Corporates', kpi: 'OpEx KPI', definition: 'Operating expenditure on taxonomy-aligned activities (non-capitalised R&D, renovation, maintenance) / total OpEx', formula: 'Aligned OpEx / Total OpEx x 100' },
    { entity: 'Credit Institutions', kpi: 'Green Asset Ratio (GAR)', definition: 'Proportion of banking book exposures financing taxonomy-aligned activities', formula: 'Sum(Aligned exposures) / Total covered assets' },
    { entity: 'Credit Institutions', kpi: 'BTAR', definition: 'Banking Book Taxonomy Alignment Ratio for counterparties not covered by NFRD/CSRD', formula: 'Aligned banking book / Total banking book' },
    { entity: 'Insurance/Reinsurance', kpi: 'Investment KPI', definition: 'Taxonomy-aligned investments / total investments', formula: 'Aligned investments / Total investments' },
    { entity: 'Asset Managers', kpi: 'Investment KPI', definition: 'Weighted average taxonomy alignment of managed portfolio', formula: 'Sum(weight_i x alignment_i) / Sum(weight_i)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {refTabs.map((t, i) => (
          <button key={i} onClick={() => setRefTab(i)} style={{
            padding: '7px 16px', borderRadius: 6, border: `1px solid ${refTab === i ? T.navy : T.border}`,
            background: refTab === i ? T.navy : T.card, color: refTab === i ? '#fff' : T.text,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.font,
          }}>{t}</button>
        ))}
      </div>

      {refTab === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {objectives.map((o, i) => (
            <Card key={i} style={{ borderLeft: `4px solid ${o.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: o.color }}>{o.code} - {o.name}</div>
                <Badge label={o.timeline} color="blue" />
              </div>
              <div style={{ fontSize: 13, color: T.text, marginBottom: 8 }}>{o.desc}</div>
              <div style={{ fontSize: 12, color: T.sub }}><strong>TSC Summary:</strong> {o.tsc}</div>
            </Card>
          ))}
        </div>
      )}

      {refTab === 1 && (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>DNSH Matrix: Which objectives apply as DNSH for each target</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: 8, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>Target Objective</th>
                {['CCM', 'CCA', 'WTR', 'CE', 'PPC', 'BIO'].map(c => (
                  <th key={c} style={{ padding: 8, textAlign: 'center', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dnshMatrix.map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: 8, borderBottom: `1px solid ${T.border}`, fontWeight: 600 }}>{row.target}</td>
                  {['CCM', 'CCA', 'WTR', 'CE', 'PPC', 'BIO'].map(c => (
                    <td key={c} style={{ padding: 8, textAlign: 'center', borderBottom: `1px solid ${T.border}`,
                      background: c === row.target ? '#e0f2fe' : row.dnsh.includes(c) ? '#f0fdf4' : '#f9fafb' }}>
                      {c === row.target ? <span style={{ color: T.blue, fontWeight: 700 }}>Target</span> : row.dnsh.includes(c) ? <span style={{ color: T.green }}>DNSH</span> : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {refTab === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {safeguards.map((s, i) => (
            <Card key={i}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{s.framework}</div>
              <div style={{ fontSize: 13, color: T.text, marginBottom: 6 }}>{s.scope}</div>
              <div style={{ fontSize: 12, color: T.sub, background: '#f9fafb', padding: 10, borderRadius: 6 }}><strong>Requirement:</strong> {s.requirement}</div>
            </Card>
          ))}
        </div>
      )}

      {refTab === 3 && (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Eligible NACE Activities</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['NACE Code', 'Description', 'Sector', 'Relevant Objectives'].map(h => (
                  <th key={h} style={{ padding: 8, textAlign: 'left', borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.sub }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {naceActivities.map((a, i) => (
                <tr key={i}>
                  <td style={{ padding: 8, borderBottom: `1px solid ${T.border}`, fontWeight: 600, fontFamily: 'monospace' }}>{a.code}</td>
                  <td style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}>{a.desc}</td>
                  <td style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}>{a.sector}</td>
                  <td style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}>{a.objectives.split(', ').map(o => <Badge key={o} label={o} color="teal" />)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {refTab === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {transVsEnable.map((t, i) => (
            <Card key={i} style={{ borderLeft: `4px solid ${i === 0 ? T.amber : T.teal}` }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: i === 0 ? T.amber : T.teal, marginBottom: 8 }}>{t.type} Activities</div>
              <div style={{ fontSize: 13, color: T.text, marginBottom: 8 }}>{t.definition}</div>
              <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}><strong>Examples:</strong> {t.examples}</div>
              <div style={{ fontSize: 12, color: T.sub, background: '#f9fafb', padding: 10, borderRadius: 6 }}><strong>Conditions:</strong> {t.conditions}</div>
            </Card>
          ))}
        </div>
      )}

      {refTab === 5 && (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Financial Institution & Corporate KPIs</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Entity Type', 'KPI', 'Definition', 'Formula'].map(h => (
                  <th key={h} style={{ padding: 8, textAlign: 'left', borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.sub }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {financialKpis.map((k, i) => (
                <tr key={i}>
                  <td style={{ padding: 8, borderBottom: `1px solid ${T.border}`, fontWeight: 600 }}>{k.entity}</td>
                  <td style={{ padding: 8, borderBottom: `1px solid ${T.border}`, color: T.navy, fontWeight: 600 }}>{k.kpi}</td>
                  <td style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}>{k.definition}</td>
                  <td style={{ padding: 8, borderBottom: `1px solid ${T.border}`, fontFamily: 'monospace', fontSize: 12, color: T.sub }}>{k.formula}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   TAB 5 — Reporting Timeline
   ═══════════════════════════════════════════════════════════════════════════ */
const TimelineTab = () => {
  const phases = [
    { year: '2024', color: T.blue, items: [
      { scope: 'All in-scope entities', detail: 'Eligibility reporting for all 6 environmental objectives' },
      { scope: 'All in-scope entities', detail: 'Alignment reporting for Obj 1 (Climate Mitigation) and Obj 2 (Climate Adaptation)' },
      { scope: 'Financial institutions', detail: 'GAR reporting based on counterparty Taxonomy disclosures' },
    ]},
    { year: '2025', color: T.teal, items: [
      { scope: 'Non-financial corporates (CSRD)', detail: 'Full alignment reporting for Obj 1-2 with verified data' },
      { scope: 'Non-financial corporates (CSRD)', detail: 'Eligibility reporting for Obj 3-6 (Water, CE, Pollution, Biodiversity)' },
      { scope: 'Financial institutions', detail: 'BTAR reporting phase-in begins for non-NFRD counterparties' },
    ]},
    { year: '2026', color: T.green, items: [
      { scope: 'All in-scope entities', detail: 'Full alignment reporting for all 6 environmental objectives' },
      { scope: 'Financial institutions', detail: 'Complete GAR with all 6 objectives, full BTAR reporting' },
      { scope: 'Large non-EU companies', detail: 'Reporting under CSRD extraterritorial scope (phased)' },
    ]},
    { year: '2027+', color: T.navy, items: [
      { scope: 'Listed SMEs', detail: 'Simplified taxonomy reporting obligations begin' },
      { scope: 'Third-country entities', detail: 'Full CSRD extraterritorial reporting requirements' },
      { scope: 'All entities', detail: 'Platform on Sustainable Finance review and potential TSC updates' },
    ]},
  ];

  const entityTypes = [
    { type: 'Large listed companies (>500 employees)', start: 'Jan 2024', eligibility: 'All 6 Obj', alignment: 'Obj 1-2 from 2024, All 6 from 2026' },
    { type: 'Large companies (CSRD scope)', start: 'Jan 2025', eligibility: 'All 6 Obj', alignment: 'Obj 1-2 from 2025, All 6 from 2026' },
    { type: 'Listed SMEs', start: 'Jan 2027', eligibility: 'Phased', alignment: 'Simplified criteria' },
    { type: 'Non-EU large companies', start: 'Jan 2028', eligibility: 'All 6 Obj', alignment: 'All 6 Obj' },
    { type: 'Credit institutions', start: 'Jan 2024', eligibility: 'Based on counterparty data', alignment: 'GAR + BTAR phase-in' },
    { type: 'Asset managers', start: 'Jan 2024', eligibility: 'Portfolio-level', alignment: 'Weighted portfolio alignment' },
    { type: 'Insurance undertakings', start: 'Jan 2024', eligibility: 'Investment + underwriting', alignment: 'Investment KPI phase-in' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Visual timeline */}
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>EU Taxonomy Reporting Phase-In Schedule</div>
        <div style={{ display: 'flex', gap: 0 }}>
          {phases.map((p, pi) => (
            <div key={pi} style={{ flex: 1, position: 'relative' }}>
              <div style={{ background: p.color, color: '#fff', textAlign: 'center', padding: '10px 8px', fontWeight: 700, fontSize: 16, borderRadius: pi === 0 ? '8px 0 0 0' : pi === phases.length - 1 ? '0 8px 0 0' : 0 }}>{p.year}</div>
              <div style={{ border: `1px solid ${T.border}`, borderTop: 'none', padding: 12, minHeight: 160, borderRadius: pi === 0 ? '0 0 0 8px' : pi === phases.length - 1 ? '0 0 8px 0' : 0 }}>
                {p.items.map((item, ii) => (
                  <div key={ii} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: ii < p.items.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: p.color, marginBottom: 2 }}>{item.scope}</div>
                    <div style={{ fontSize: 12, color: T.text }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Entity type table */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Phase-In by Entity Type</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Entity Type', 'Reporting Start', 'Eligibility Scope', 'Alignment Scope'].map(h => (
                <th key={h} style={{ padding: 10, textAlign: 'left', borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.sub }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entityTypes.map((e, i) => (
              <tr key={i}>
                <td style={{ padding: 10, borderBottom: `1px solid ${T.border}`, fontWeight: 600 }}>{e.type}</td>
                <td style={{ padding: 10, borderBottom: `1px solid ${T.border}` }}><Badge label={e.start} color="blue" /></td>
                <td style={{ padding: 10, borderBottom: `1px solid ${T.border}` }}>{e.eligibility}</td>
                <td style={{ padding: 10, borderBottom: `1px solid ${T.border}` }}>{e.alignment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function EuTaxonomyPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ background: T.navy, color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>E150</span>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.navy }}>EU Taxonomy Alignment</h1>
        </div>
        <div style={{ fontSize: 13, color: T.sub }}>
          Activity-level substantial contribution, DNSH, minimum safeguards assessment | Entity KPIs (Turnover / CapEx / OpEx) | Portfolio Green Asset Ratio
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '10px 20px', border: 'none', borderBottom: tab === i ? `3px solid ${T.navy}` : '3px solid transparent',
            background: 'transparent', color: tab === i ? T.navy : T.sub,
            fontSize: 14, fontWeight: tab === i ? 700 : 500, cursor: 'pointer', fontFamily: T.font,
            marginBottom: -2, transition: 'all .15s',
          }}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 0 && <ActivityTab />}
      {tab === 1 && <EntityTab />}
      {tab === 2 && <PortfolioTab />}
      {tab === 3 && <ReferenceTab />}
      {tab === 4 && <TimelineTab />}
    </div>
  );
}
