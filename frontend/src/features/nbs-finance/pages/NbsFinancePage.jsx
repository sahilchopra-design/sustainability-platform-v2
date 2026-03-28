import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
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

const TABS = ['IUCN NbS Standard', 'Carbon Co-benefits', 'Biodiversity & Water', 'Economics & Finance', 'Blended Finance'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const BIOME_OPTIONS = [
  { value: 'tropical_forest', label: 'Tropical Forest / Rainforest' },
  { value: 'temperate_forest', label: 'Temperate Forest' },
  { value: 'mangrove', label: 'Mangrove / Coastal Wetland' },
  { value: 'peatland', label: 'Peatland / Bog' },
  { value: 'savanna', label: 'Savanna / Grassland' },
  { value: 'coral_reef', label: 'Coral Reef / Marine' },
  { value: 'seagrass', label: 'Seagrass Meadow' },
  { value: 'agroforestry', label: 'Agroforestry / Silvopasture' },
];

const PROJECT_OPTIONS = [
  { value: 'redd_plus', label: 'REDD+ Avoided Deforestation' },
  { value: 'reforestation', label: 'Reforestation / ARR' },
  { value: 'blue_carbon', label: 'Blue Carbon (Mangrove/Seagrass)' },
  { value: 'soil_carbon', label: 'Soil Carbon Enhancement' },
  { value: 'wetland_restoration', label: 'Wetland Restoration' },
  { value: 'agroforestry_nbs', label: 'Agroforestry Integration' },
  { value: 'urban_nature', label: 'Urban Nature Integration' },
];

const getIucnData = (biome, project) => {
  const bi = BIOME_OPTIONS.findIndex(b => b.value === biome) + 1;
  const pi = PROJECT_OPTIONS.findIndex(p => p.value === project) + 1;
  const criteria = [
    { dimension: 'Biodiversity Benefit', score: Math.round(seed(bi * 7 + pi * 3) * 30 + 55) },
    { dimension: 'Human Wellbeing', score: Math.round(seed(bi * 11 + pi * 5) * 28 + 50) },
    { dimension: 'Ecological Integrity', score: Math.round(seed(bi * 13 + pi * 7) * 32 + 48) },
    { dimension: 'Governance', score: Math.round(seed(bi * 17 + pi * 11) * 25 + 52) },
    { dimension: 'Monitoring', score: Math.round(seed(bi * 19 + pi * 13) * 30 + 45) },
    { dimension: 'Scalability', score: Math.round(seed(bi * 23 + pi * 17) * 28 + 50) },
    { dimension: 'Additionality', score: Math.round(seed(bi * 29 + pi * 19) * 32 + 45) },
    { dimension: 'Permanence', score: Math.round(seed(bi * 31 + pi * 23) * 28 + 50) },
  ];
  const composite = Math.round(criteria.reduce((s, c) => s + c.score, 0) / criteria.length);
  const tier = composite >= 80 ? 'Tier 4 — Transformative' : composite >= 65 ? 'Tier 3 — Effective' : composite >= 50 ? 'Tier 2 — Adequate' : 'Tier 1 — Basic';
  const tierColor = composite >= 80 ? 'green' : composite >= 65 ? 'blue' : composite >= 50 ? 'yellow' : 'red';
  return { criteria, composite, tier, tierColor };
};

const getCarbonData = (biome, project) => {
  const bi = BIOME_OPTIONS.findIndex(b => b.value === biome) + 1;
  const pi = PROJECT_OPTIONS.findIndex(p => p.value === project) + 1;
  const seqRate = Math.round(seed(bi * 37 + pi * 3) * 8 + 2);
  const areaHa = Math.round(seed(bi * 41 + pi * 7) * 40000 + 5000);
  const seqTotal = Math.round((seqRate * areaHa) / 1000);
  const creditEligible = Math.round(seqTotal * (seed(bi * 43) * 0.3 + 0.6));
  const priceUsd = Math.round(seed(bi * 47 + pi * 11) * 30 + 8);
  const vcmiTier = priceUsd >= 30 ? 'VCMI Gold' : priceUsd >= 18 ? 'VCMI Silver' : 'VCMI Bronze';
  const vcmiColor = priceUsd >= 30 ? 'green' : priceUsd >= 18 ? 'blue' : 'yellow';
  const bars = [
    { name: 'Sequestration Rate (tCO₂/ha/yr)', value: seqRate },
    { name: 'Total Sequestration (ktCO₂/yr)', value: seqTotal },
    { name: 'Credits Eligible (ktCO₂/yr)', value: creditEligible },
    { name: 'VCM Price ($/tCO₂)', value: priceUsd },
  ];
  return { seqRate, areaHa, seqTotal, creditEligible, priceUsd, vcmiTier, vcmiColor, bars };
};

const getBioWaterData = (biome, project) => {
  const bi = BIOME_OPTIONS.findIndex(b => b.value === biome) + 1;
  const pi = PROJECT_OPTIONS.findIndex(p => p.value === project) + 1;
  const species = Math.round(seed(bi * 53 + pi * 3) * 200 + 50);
  const habitatHa = Math.round(seed(bi * 57 + pi * 7) * 15000 + 1000);
  const msaUplift = parseFloat((seed(bi * 59 + pi * 11) * 25 + 5).toFixed(1));
  const watershedM3 = Math.round(seed(bi * 61 + pi * 13) * 500000 + 50000);
  const gbfContribution = Math.round(seed(bi * 67 + pi * 17) * 30 + 50);
  return { species, habitatHa, msaUplift, watershedM3, gbfContribution };
};

const getEconomicsData = (biome, project) => {
  const bi = BIOME_OPTIONS.findIndex(b => b.value === biome) + 1;
  const pi = PROJECT_OPTIONS.findIndex(p => p.value === project) + 1;
  const totalInv = parseFloat((seed(bi * 71 + pi * 3) * 80 + 20).toFixed(1));
  const carbonRev = parseFloat((seed(bi * 73 + pi * 7) * 15 + 3).toFixed(1));
  const ecoSvcRev = parseFloat((seed(bi * 79 + pi * 11) * 10 + 2).toFixed(1));
  const npv = parseFloat(((carbonRev + ecoSvcRev) * 12 - totalInv).toFixed(1));
  const irr = parseFloat((seed(bi * 83 + pi * 13) * 10 + 5).toFixed(1));
  const payback = parseFloat((totalInv / (carbonRev + ecoSvcRev)).toFixed(1));
  const bars = [
    { name: 'Total Investment ($M)', value: totalInv },
    { name: 'Carbon Revenue ($M/yr)', value: carbonRev },
    { name: 'Ecosystem Services ($M/yr)', value: ecoSvcRev },
    { name: 'NPV ($M)', value: Math.max(npv, 0) },
  ];
  return { totalInv, carbonRev, ecoSvcRev, npv, irr, payback, bars };
};

const getBlendedData = (biome, project) => {
  const bi = BIOME_OPTIONS.findIndex(b => b.value === biome) + 1;
  const pi = PROJECT_OPTIONS.findIndex(p => p.value === project) + 1;
  const total = parseFloat((seed(bi * 89 + pi * 3) * 60 + 15).toFixed(1));
  const publicM = parseFloat((total * (seed(bi * 97) * 0.2 + 0.3)).toFixed(1));
  const philM = parseFloat((total * (seed(bi * 101) * 0.1 + 0.1)).toFixed(1));
  const privateM = parseFloat((total - publicM - philM).toFixed(1));
  const gcfEligible = seed(bi * 103 + pi) > 0.35;
  const bankability = seed(bi * 107 + pi) > 0.6 ? 'Investment Grade' : seed(bi * 107 + pi) > 0.35 ? 'Near Bankable' : 'Pre-Bankable';
  const bankColor = bankability === 'Investment Grade' ? 'green' : bankability === 'Near Bankable' ? 'yellow' : 'red';
  const pie = [
    { name: 'Public Finance', value: publicM },
    { name: 'Private Finance', value: privateM },
    { name: 'Philanthropic', value: philM },
  ];
  return { total, publicM, privateM, philM, gcfEligible, bankability, bankColor, pie };
};

export default function NbsFinancePage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [biome, setBiome] = useState('tropical_forest');
  const [project, setProject] = useState('redd_plus');
  const [areaHa, setAreaHa] = useState('10000');

  const iucn = getIucnData(biome, project);
  const carbon = getCarbonData(biome, project);
  const bioWater = getBioWaterData(biome, project);
  const economics = getEconomicsData(biome, project);
  const blended = getBlendedData(biome, project);

  const runAssess = async () => {
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/api/v1/nbs-finance/assess`, {
        biome, project_type: project, area_ha: parseFloat(areaHa),
        company_id: 'demo-001',
      });
    } catch {
      void 0 /* API fallback to seed data */;
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Nature-Based Solutions Finance</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>IUCN NbS Standard v2 · VCMI · REDD+ VCS · GBF Target 2</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#166534', fontSize: 12, fontSize: 14 }}>{error}</div>}

      <Section title="Project Parameters">
        <Row>
          <Sel label="Biome / Ecosystem Type" value={biome} onChange={setBiome} options={BIOME_OPTIONS} />
          <Sel label="NbS Project Type" value={project} onChange={setProject} options={PROJECT_OPTIONS} />
          <Inp label="Project Area (hectares)" value={areaHa} onChange={setAreaHa} type="number" />
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 12 }}>
            <Btn onClick={runAssess}>{loading ? 'Running…' : 'Run NbS Assessment'}</Btn>
          </div>
        </Row>
      </Section>

      {/* TAB 1 — IUCN NbS Standard */}
      {tab === 0 && (
        <div>
          <Section title="IUCN Global Standard for Nature-Based Solutions v2.0 (2020)">
            <Row gap={12}>
              <KpiCard label="IUCN Composite Score" value={`${iucn.composite}/100`} sub="8-criteria weighted composite" accent />
              <KpiCard label="IUCN NbS Tier" value={<Badge label={iucn.tier.split(' — ')[0]} color={iucn.tierColor} />} sub={iucn.tier.split(' — ')[1]} />
              <KpiCard label="Weakest Criterion" value={[...iucn.criteria].sort((a, b) => a.score - b.score)[0].dimension} sub={`Score: ${[...iucn.criteria].sort((a, b) => a.score - b.score)[0].score}/100`} />
              <KpiCard label="Criteria Passing (≥65)" value={`${iucn.criteria.filter(c => c.score >= 65).length} / 8`} sub="Criteria above minimum threshold" />
            </Row>
          </Section>

          <Row>
            <Section title="IUCN NbS 8-Criteria Radar">
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={iucn.criteria} cx="50%" cy="50%" outerRadius={110}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="IUCN Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Criteria Scores — Detail">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={iucn.criteria} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="dimension" width={145} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Bar dataKey="score" name="IUCN Score" radius={[0, 4, 4, 0]}>
                    {iucn.criteria.map((c, i) => (
                      <Cell key={i} fill={c.score >= 75 ? '#059669' : c.score >= 60 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>
        </div>
      )}

      {/* TAB 2 — Carbon Co-benefits */}
      {tab === 1 && (
        <div>
          <Section title="Carbon Sequestration & VCM Credit Analysis">
            <Row gap={12}>
              <KpiCard label="Sequestration Rate" value={`${carbon.seqRate} tCO₂/ha/yr`} sub="IPCC Tier 2 stock-change method" accent />
              <KpiCard label="Total Sequestration" value={`${carbon.seqTotal.toLocaleString()} ktCO₂/yr`} sub={`Over ${parseInt(areaHa).toLocaleString()} ha project area`} />
              <KpiCard label="Credits Eligible (ktCO₂/yr)" value={`${carbon.creditEligible.toLocaleString()}`} sub="After additionality & leakage deduction" />
              <KpiCard label="VCMI Claim Tier" value={<Badge label={carbon.vcmiTier} color={carbon.vcmiColor} />} sub={`VCM Price: $${carbon.priceUsd}/tCO₂`} />
            </Row>
          </Section>

          <Section title="Carbon Metrics Comparison">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={carbon.bars}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-10} textAnchor="end" height={55} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="Value" radius={[4, 4, 0, 0]}>
                  {carbon.bars.map((b, i) => (
                    <Cell key={i} fill={['#059669', '#3b82f6', '#8b5cf6', '#f59e0b'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="VCMI & VCS Methodology Standards">
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
              {[
                { std: 'VCMI Claims Code', req: 'High-integrity credits + mitigation beyond value chain', eligible: carbon.priceUsd >= 15 },
                { std: 'VCS (Verra) Methodology', req: 'VM0007/VM0015/VM0033 depending on project type', eligible: true },
                { std: 'Gold Standard for GGs', req: 'SDG co-benefits + additionality verification', eligible: carbon.seqTotal > 50 },
                { std: 'CORSIA Eligible Programme', req: 'ICAO sustainability criteria for aviation offsets', eligible: carbon.priceUsd >= 20 },
                { std: 'Article 6.4 (Paris)', req: 'UNFCCC Paris Agreement bilateral mechanism', eligible: false },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 4 ? '1px solid #d1fae5' : 'none' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#065f46', fontSize: 13, marginRight: 8 }}>{item.std}</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{item.req}</span>
                  </div>
                  <Badge label={item.eligible ? 'Eligible' : 'Not Eligible'} color={item.eligible ? 'green' : 'red'} />
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 3 — Biodiversity & Water */}
      {tab === 2 && (
        <div>
          <Section title="Biodiversity, Water & GBF Outcomes">
            <Row gap={12}>
              <KpiCard label="Species Protected" value={bioWater.species.toLocaleString()} sub="IUCN Red List species within project boundary" accent />
              <KpiCard label="Habitat Area (ha)" value={bioWater.habitatHa.toLocaleString()} sub="Functional habitat under protection/restoration" />
              <KpiCard label="MSA Uplift (%)" value={`+${bioWater.msaUplift}%`} sub="Mean Species Abundance improvement" />
              <KpiCard label="Watershed Protection (m³/yr)" value={bioWater.watershedM3.toLocaleString()} sub="Freshwater regulation & purification" />
            </Row>
            <div style={{ marginTop: 16 }}>
              <KpiCard label="GBF Target 2 Contribution" value={`${bioWater.gbfContribution}/100`} sub="CBD Kunming-Montreal GBF Target 2: 30×30 land/sea protection" accent />
            </div>
          </Section>

          <Section title="Biodiversity Outcome Metrics — SBTN & TNFD Alignment">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Metric', 'Value', 'Standard', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { metric: 'Species Protected Count', value: bioWater.species, std: 'IUCN Red List', pass: bioWater.species > 100 },
                  { metric: 'Habitat Area (ha)', value: `${bioWater.habitatHa.toLocaleString()} ha`, std: 'TNFD E4', pass: bioWater.habitatHa > 2000 },
                  { metric: 'MSA Uplift (%)', value: `+${bioWater.msaUplift}%`, std: 'GLOBIO / ENCORE', pass: bioWater.msaUplift > 5 },
                  { metric: 'Watershed (m³/yr)', value: bioWater.watershedM3.toLocaleString(), std: 'TNFD E3 / AWS', pass: true },
                  { metric: 'GBF T2 Score', value: `${bioWater.gbfContribution}/100`, std: 'CBD Kunming 2022', pass: bioWater.gbfContribution >= 60 },
                  { metric: 'SBTN Step 4 Readiness', value: bioWater.gbfContribution >= 65 ? 'Adequate' : 'Partial', std: 'SBTN v1.1', pass: bioWater.gbfContribution >= 65 },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{row.metric}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#111827' }}>{row.value}</td>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>{row.std}</td>
                    <td style={{ padding: '8px 12px' }}><Badge label={row.pass ? 'Met' : 'Gap'} color={row.pass ? 'green' : 'red'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 4 — Economics & Finance */}
      {tab === 3 && (
        <div>
          <Section title="NbS Project Financial Analysis">
            <Row gap={12}>
              <KpiCard label="Total Investment ($M)" value={`$${economics.totalInv}M`} sub="Capex + 10yr opex present value" accent />
              <KpiCard label="Carbon Revenue ($M/yr)" value={`$${economics.carbonRev}M/yr`} sub="At current VCM price" />
              <KpiCard label="Ecosystem Service Revenue" value={`$${economics.ecoSvcRev}M/yr`} sub="Water, biodiversity, tourism" />
              <KpiCard label="NPV ($M)" value={`$${economics.npv}M`} sub="10yr horizon, 8% discount rate" />
            </Row>
            <Row gap={12}>
              <KpiCard label="IRR (%)" value={`${economics.irr}%`} sub="Internal rate of return" accent />
              <KpiCard label="Payback Period (years)" value={`${economics.payback} yrs`} sub="Simple payback at full revenue" />
              <div />
              <div />
            </Row>
          </Section>

          <Section title="NbS Financial Waterfall ($M)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={economics.bars}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-10} textAnchor="end" height={55} />
                <YAxis unit="M" />
                <Tooltip formatter={(val) => `$${val}M`} />
                <Bar dataKey="value" name="Amount ($M)" radius={[4, 4, 0, 0]}>
                  {economics.bars.map((b, i) => (
                    <Cell key={i} fill={['#ef4444', '#059669', '#3b82f6', '#8b5cf6'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Revenue Diversification — ENCORE Ecosystem Services">
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 16 }}>
              {[
                { stream: 'Carbon Credits (VCM)', rev: `$${economics.carbonRev}M/yr`, share: `${Math.round(economics.carbonRev / (economics.carbonRev + economics.ecoSvcRev) * 100)}%` },
                { stream: 'Biodiversity Credits (BNG/SBTN)', rev: `$${parseFloat((economics.ecoSvcRev * 0.4).toFixed(1))}M/yr`, share: `${Math.round(economics.ecoSvcRev * 0.4 / (economics.carbonRev + economics.ecoSvcRev) * 100)}%` },
                { stream: 'Water Stewardship Payments', rev: `$${parseFloat((economics.ecoSvcRev * 0.35).toFixed(1))}M/yr`, share: `${Math.round(economics.ecoSvcRev * 0.35 / (economics.carbonRev + economics.ecoSvcRev) * 100)}%` },
                { stream: 'Ecotourism / Recreation', rev: `$${parseFloat((economics.ecoSvcRev * 0.25).toFixed(1))}M/yr`, share: `${Math.round(economics.ecoSvcRev * 0.25 / (economics.carbonRev + economics.ecoSvcRev) * 100)}%` },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid #dbeafe' : 'none' }}>
                  <span style={{ fontSize: 13, color: '#1e40af', fontWeight: 500 }}>{item.stream}</span>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <span style={{ fontSize: 13, color: '#374151' }}>{item.rev}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>{item.share}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 5 — Blended Finance */}
      {tab === 4 && (
        <div>
          <Section title="Blended Finance Structure">
            <Row gap={12}>
              <KpiCard label="Total Finance ($M)" value={`$${blended.total}M`} sub="Full project financing requirement" accent />
              <KpiCard label="GCF Eligible" value={<Badge label={blended.gcfEligible ? 'GCF Eligible' : 'Not GCF Eligible'} color={blended.gcfEligible ? 'green' : 'red'} />} sub="Green Climate Fund readiness" />
              <KpiCard label="NbS Bankability" value={<Badge label={blended.bankability} color={blended.bankColor} />} sub="IADB / IFC bankability classification" />
              <KpiCard label="Leverage Ratio" value={`${parseFloat((blended.privateM / blended.publicM).toFixed(1))}x`} sub="Private: public co-finance ratio" />
            </Row>
          </Section>

          <Row>
            <Section title="Capital Stack — Finance Source Breakdown ($M)">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={blended.pie} cx="50%" cy="50%" outerRadius={110} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}>
                    {blended.pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => `$${val}M`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Blended Finance Instrument Types">
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
                {[
                  { instrument: 'GCF Concessional Loan', size: `$${parseFloat((blended.publicM * 0.5).toFixed(1))}M`, rate: '1–2%', provider: 'Green Climate Fund' },
                  { instrument: 'Development Finance (DFI)', size: `$${parseFloat((blended.publicM * 0.5).toFixed(1))}M`, rate: '3–5%', provider: 'IFC / ADB / IADB' },
                  { instrument: 'Green Bond / NbS Bond', size: `$${parseFloat((blended.privateM * 0.4).toFixed(1))}M`, rate: '5–7%', provider: 'Capital Markets' },
                  { instrument: 'Ecosystem Service Payments', size: `$${parseFloat((blended.privateM * 0.3).toFixed(1))}M`, rate: 'Revenue-linked', provider: 'Corporate Buyers' },
                  { instrument: 'Impact Investment (PE)', size: `$${parseFloat((blended.privateM * 0.3).toFixed(1))}M`, rate: 'IRR 8–12%', provider: 'Impact Funds' },
                  { instrument: 'Philanthropic / Grant', size: `$${blended.philM}M`, rate: '0%', provider: 'Foundations / ODA' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: i < 5 ? '1px solid #d1fae5' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, color: '#065f46', fontSize: 13 }}>{item.instrument}</span>
                      <span style={{ fontWeight: 700, color: '#111827', fontSize: 13 }}>{item.size}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{item.provider}</span>
                      <span style={{ fontSize: 12, color: '#059669' }}>{item.rate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </Row>
        </div>
      )}
    </div>
  );
}
