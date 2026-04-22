import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', gold: '#d4a843', sage: '#2d6a4f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const CITIES = [
  { id: 'nyc', name: 'New York City', country: 'USA', pop: 8336, hazards: ['Flooding', 'Heat', 'Storm Surge'], resilienceScore: 74, investment: 22.5, avoided: 85, bcr: 4.2, adaptScore: 78, fundingStack: { bonds: 55, federal: 28, grants: 12, private: 5 } },
  { id: 'miami', name: 'Miami', country: 'USA', pop: 470, hazards: ['Sea Rise', 'Hurricane', 'Heat'], resilienceScore: 52, investment: 4.2, avoided: 18, bcr: 2.8, adaptScore: 55, fundingStack: { bonds: 40, federal: 35, grants: 18, private: 7 } },
  { id: 'rotterdam', name: 'Rotterdam', country: 'Netherlands', pop: 651, hazards: ['Flooding', 'Sea Rise'], resilienceScore: 92, investment: 8.6, avoided: 62, bcr: 6.8, adaptScore: 94, fundingStack: { bonds: 30, federal: 45, grants: 20, private: 5 } },
  { id: 'copenhagen', name: 'Copenhagen', country: 'Denmark', pop: 794, hazards: ['Cloudbursts', 'Heat'], resilienceScore: 88, investment: 3.8, avoided: 28, bcr: 5.2, adaptScore: 91, fundingStack: { bonds: 35, federal: 40, grants: 18, private: 7 } },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', pop: 5686, hazards: ['Sea Rise', 'Heat', 'Flooding'], resilienceScore: 86, investment: 12.4, avoided: 72, bcr: 5.5, adaptScore: 88, fundingStack: { bonds: 20, federal: 60, grants: 10, private: 10 } },
  { id: 'lagos', name: 'Lagos', country: 'Nigeria', pop: 14862, hazards: ['Flooding', 'Sea Rise', 'Heat'], resilienceScore: 32, investment: 1.8, avoided: 8, bcr: 2.1, adaptScore: 35, fundingStack: { bonds: 10, federal: 25, grants: 48, private: 17 } },
  { id: 'jakarta', name: 'Jakarta', country: 'Indonesia', pop: 10562, hazards: ['Subsidence', 'Flooding', 'Sea Rise'], resilienceScore: 38, investment: 3.2, avoided: 14, bcr: 2.6, adaptScore: 40, fundingStack: { bonds: 15, federal: 40, grants: 35, private: 10 } },
  { id: 'houston', name: 'Houston', country: 'USA', pop: 2304, hazards: ['Flooding', 'Hurricane', 'Heat'], resilienceScore: 58, investment: 5.6, avoided: 24, bcr: 3.1, adaptScore: 62, fundingStack: { bonds: 45, federal: 38, grants: 12, private: 5 } },
];

const FUNDING_PROGRAMS = [
  { name: 'FEMA BRIC (Building Resilient Infrastructure)', amount: 1000, type: 'Federal Grant', match: '25% local', eligible: 'All hazards', deadline: 'Annual cycle', focus: 'Pre-disaster mitigation' },
  { name: 'HUD CDBG-DR (Disaster Recovery)', amount: 3500, type: 'Federal Grant', match: 'None', eligible: 'Post-disaster', deadline: 'Upon declaration', focus: 'Recovery + resilience' },
  { name: 'Army Corps of Engineers CSRM', amount: 2200, type: 'Federal Cost-share', match: '35% local', eligible: 'Flood + coastal', deadline: 'Annual appropriation', focus: 'Flood risk management' },
  { name: 'EPA WIFIA (Water Infrastructure Finance)', amount: 8000, type: 'Low-interest loan', match: 'None', eligible: 'Water infrastructure', deadline: 'Annual NOFA', focus: 'Green stormwater, resilience' },
  { name: 'USDA Water & Wastewater', amount: 1200, type: 'Grant/Loan', match: 'Varies', eligible: 'Rural areas', deadline: 'Continuous', focus: 'Rural water resilience' },
  { name: 'DOT RAISE Grants', amount: 1500, type: 'Federal Grant', match: '20% local', eligible: 'Transportation', deadline: 'Annual', focus: 'Climate-resilient transport' },
  { name: 'EU Cohesion Fund (Climate)', amount: 12000, type: 'EU Grant', match: '15–30% national', eligible: 'EU member states', deadline: '2021–2027 MFF', focus: 'Adaptation + mitigation' },
  { name: 'Green Climate Fund Adaptation Window', amount: 5000, type: 'Concessional Grant', match: 'None required', eligible: 'Developing countries', deadline: 'Continuous concept notes', focus: 'City adaptation in LDCs' },
];

const RESILIENCE_MEASURES = [
  { measure: 'Green Stormwater Infrastructure', capex: 45, annBenefit: 12, lifetime: 30, co2: 2.8, bcr: 3.8, hazard: 'Flooding', examples: 'Bioswales, rain gardens, permeable pavement' },
  { measure: 'Coastal Seawall Upgrade', capex: 280, annBenefit: 68, lifetime: 50, co2: 1.2, bcr: 4.2, hazard: 'Sea Rise/Storm', examples: 'Concrete armoring, rock revetment, offshore breakwater' },
  { measure: 'Urban Heat Island Reduction', capex: 38, annBenefit: 9.5, lifetime: 20, co2: 4.1, bcr: 3.2, hazard: 'Heat', examples: 'Green roofs, cool pavements, tree canopy expansion' },
  { measure: 'Flood-Resilient Infrastructure', capex: 120, annBenefit: 35, lifetime: 40, co2: 0.8, bcr: 4.5, hazard: 'Flooding', examples: 'Elevated roadways, floodgates, detention basins' },
  { measure: 'Backup Power Grid', capex: 85, annBenefit: 22, lifetime: 25, co2: 3.5, bcr: 2.8, hazard: 'All', examples: 'Microgrids, battery storage, distributed generation' },
  { measure: 'Nature-Based Solutions (NbS)', capex: 60, annBenefit: 18, lifetime: 50, co2: 8.5, bcr: 5.8, hazard: 'Multi-hazard', examples: 'Wetland restoration, mangroves, urban forest' },
  { measure: 'Resilient Building Codes', capex: 15, annBenefit: 8.5, lifetime: 40, co2: 0.5, bcr: 6.2, hazard: 'All', examples: 'Code updates, retrofit mandates, certification' },
  { measure: 'Early Warning Systems', capex: 22, annBenefit: 12.5, lifetime: 15, co2: 0.2, bcr: 8.1, hazard: 'All', examples: 'Sensor networks, IoT, AI alert platforms' },
];

const BOND_STRUCTURES = [
  { name: 'General Obligation Resilience Bond', security: 'Full faith & credit', tenor: '20-30yr', rate: 'Exempt + low spread', pros: 'Lowest cost', cons: 'Voter approval, tax cap' },
  { name: 'Revenue Bond (stormwater utility)', security: 'Stormwater fee revenue', tenor: '15-25yr', rate: 'Exempt + moderate spread', pros: 'No voter approval', cons: 'Fee acceptance risk' },
  { name: 'Green Resilience Bond (labeled)', security: 'Varies', tenor: '15-25yr', rate: 'Greenium benefit', pros: 'ESG investor access', cons: 'Reporting requirements' },
  { name: 'Social Impact Bond (SIB/PAYGO)', security: 'Outcome payment', tenor: '5-10yr', rate: 'Higher upfront, low net', pros: 'Private capital at risk', cons: 'Outcome measurement complexity' },
  { name: 'CAT Bond / Resilience Bond', security: 'Parametric trigger', tenor: '3-5yr', rate: 'Coupon + principal at risk', pros: 'Risk transfer to capital market', cons: 'Basis risk, complex structure' },
];

const TABS = ['Overview', 'City Rankings', 'Resilience Scoring', 'Adaptation Calculator', 'Funding Stack', 'Grant Programs', 'Bond Structures', 'Hazard Exposure', 'Co-benefit Valuation', 'Implementation Pipeline'];

function calcResilienceRoi({ investment, avoidedLoss }) {
  return investment > 0 ? (avoidedLoss / investment).toFixed(2) : '0';
}
function calcBcr({ annBenefit, capex, discountRate, lifetime }) {
  const dr = discountRate / 100;
  const pvBenefits = dr > 0 ? annBenefit * (1 - Math.pow(1 + dr, -lifetime)) / dr : annBenefit * lifetime;
  return capex > 0 ? (pvBenefits / capex).toFixed(2) : '0';
}
function calcNpv({ annBenefit, capex, discountRate, lifetime }) {
  const dr = discountRate / 100;
  const pvBenefits = dr > 0 ? annBenefit * (1 - Math.pow(1 + dr, -lifetime)) / dr : annBenefit * lifetime;
  return (pvBenefits - capex).toFixed(1);
}

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function MunicipalClimateResilienceHubPage() {
  const [tab, setTab] = useState('Overview');
  const [selectedCity, setSelectedCity] = useState('nyc');
  const [investment, setInvestment] = useState(50);
  const [discountRate, setDiscountRate] = useState(4);
  const [selectedMeasure, setSelectedMeasure] = useState(0);

  const city = CITIES.find(c => c.id === selectedCity) || CITIES[0];
  const roi = calcResilienceRoi({ investment, avoidedLoss: investment * (city.bcr - 1) });
  const measure = RESILIENCE_MEASURES[selectedMeasure];
  const bcr = calcBcr({ annBenefit: measure.annBenefit, capex: measure.capex, discountRate, lifetime: measure.lifetime });
  const npv = calcNpv({ annBenefit: measure.annBenefit, capex: measure.capex, discountRate, lifetime: measure.lifetime });

  const totalFunding = FUNDING_PROGRAMS.reduce((s, p) => s + p.amount, 0);

  const radarData = [
    { metric: 'Resilience Score', value: city.resilienceScore },
    { metric: 'Adapt Score', value: city.adaptScore },
    { metric: 'Investment ($M/yr)', value: Math.min(100, city.investment * 3) },
    { metric: 'BCR', value: Math.min(100, city.bcr * 15) },
    { metric: 'Avoided Loss', value: Math.min(100, city.avoided * 1.2) },
  ];

  const cityRankData = [...CITIES].sort((a, b) => b.resilienceScore - a.resilienceScore).map(c => ({
    name: c.name.split(' ')[0], score: c.resilienceScore, invest: c.investment,
  }));

  const measureBcrData = [...RESILIENCE_MEASURES].sort((a, b) => b.bcr - a.bcr).map(m => ({
    name: m.measure.split(' ')[0], bcr: m.bcr, capex: m.capex,
  }));

  const fundingTrend = useMemo(() => [2020, 2021, 2022, 2023, 2024, 2025].map((yr, i) => ({
    year: yr, total: Math.round(28 + i * 8.5 + sr(i * 13) * 4), federal: Math.round(15 + i * 4.5 + sr(i * 19) * 3),
  })), []);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text, padding: '24px 32px' }}>
      <div style={{ borderBottom: `2px solid ${T.gold}`, paddingBottom: 16, marginBottom: 24 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: '0.12em', marginBottom: 6 }}>EP-DY6 · MUNICIPAL CLIMATE RESILIENCE FINANCE HUB</div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: T.text }}>Municipal Climate Resilience Finance Hub</h1>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>FEMA BRIC · HUD CDBG-DR · Army Corps · EPA WIFIA · BCR Engine · Resilience Bonds · 8-City Dashboard</div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 28, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 14px', borderRadius: 4, border: `1px solid ${tab === t ? T.gold : T.border}`, background: tab === t ? T.gold : T.surface, color: tab === t ? T.bg : T.textSec, fontFamily: T.mono, fontSize: 11, cursor: 'pointer', fontWeight: tab === t ? 700 : 400 }}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <Kpi label="GLOBAL ADAPTATION FINANCE GAP" value="$359Bn/yr" sub="UNEP 2023 estimate" color={T.red} />
            <Kpi label="TRACKED CITY INVESTMENT" value={`$${CITIES.reduce((s, c) => s + c.investment, 0).toFixed(0)}Bn`} sub="Annual resilience spending" color={T.green} />
            <Kpi label="AVG BCR (RESILIENCE MEASURES)" value={`${(RESILIENCE_MEASURES.reduce((s, m) => s + m.bcr, 0) / RESILIENCE_MEASURES.length).toFixed(1)}x`} sub="Benefit-cost ratio" color={T.teal} />
            <Kpi label="TOTAL PROGRAM FUNDING" value={`$${(totalFunding / 1000).toFixed(0)}Bn`} sub="All tracked programs" color={T.amber} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>CITY RESILIENCE SCORES</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cityRankData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="score" fill={T.teal} name="Resilience Score" />
                  <ReferenceLine y={75} stroke={T.gold} strokeDasharray="4 2" label={{ value: 'Best practice', fill: T.gold, fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>BCR BY MEASURE TYPE</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={measureBcrData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="bcr" fill={T.green} name="BCR" />
                  <ReferenceLine y={4.0} stroke={T.gold} strokeDasharray="4 2" label={{ value: 'High-value', fill: T.gold, fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'City Rankings' && (
        <div>
          <div style={{ marginBottom: 20, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>CITY RESILIENCE DASHBOARD</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['City', 'Country', 'Pop (K)', 'Hazards', 'Resilience Score', 'Investment ($Bn)', 'BCR', 'Adapt Score'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{[...CITIES].sort((a, b) => b.resilienceScore - a.resilienceScore).map((c, i) => (
                <tr key={c.id} onClick={() => setSelectedCity(c.id)} style={{ cursor: 'pointer', background: selectedCity === c.id ? T.surfaceH : i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{c.country}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec, fontFamily: T.mono }}>{c.pop.toLocaleString()}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{c.hazards.join(', ')}</td>
                  <td style={{ padding: '7px 10px', color: c.resilienceScore >= 80 ? T.green : c.resilienceScore >= 55 ? T.amber : T.red, fontFamily: T.mono }}>{c.resilienceScore}</td>
                  <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono }}>${c.investment}Bn</td>
                  <td style={{ padding: '7px 10px', color: c.bcr >= 4 ? T.green : c.bcr >= 2.5 ? T.amber : T.red }}>{c.bcr}x</td>
                  <td style={{ padding: '7px 10px', color: T.teal }}>{c.adaptScore}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 16 }}>SELECTED: {city.name.toUpperCase()}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Kpi label="RESILIENCE SCORE" value={city.resilienceScore} sub="/100" color={city.resilienceScore >= 80 ? T.green : T.amber} />
                <Kpi label="INVESTMENT" value={`$${city.investment}Bn`} sub="/yr" color={T.teal} />
                <Kpi label="BCR" value={`${city.bcr}x`} sub="Benefit-cost ratio" color={T.green} />
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: T.textSec, fontSize: 10 }} />
                  <Radar dataKey="value" stroke={T.teal} fill={T.teal} fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Resilience Scoring' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="HIGHEST SCORER" value="Rotterdam" sub="Score: 92" color={T.green} />
            <Kpi label="LOWEST SCORER" value="Lagos" sub="Score: 32" color={T.red} />
            <Kpi label="GLOBAL AVG" value={`${(CITIES.reduce((s, c) => s + c.resilienceScore, 0) / CITIES.length).toFixed(0)}`} sub="/100 composite" />
            <Kpi label="FRAMEWORK" value="ICLEI/C40" sub="Urban resilience standard" color={T.teal} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>RESILIENCE SCORE COMPONENTS (FRAMEWORK)</div>
            {[['Physical & Infrastructure Resilience (30%)', 'Flood barriers, building codes, utility redundancy, transport durability. Engineering standards and grey/green infrastructure mix.'],
              ['Institutional & Governance Capacity (25%)', 'Climate action plan quality, cross-departmental coordination, emergency management maturity, political commitment.'],
              ['Economic & Financial Resilience (20%)', 'Fiscal space for adaptation, access to capital markets, insurance penetration, economic diversification.'],
              ['Social & Community Resilience (15%)', 'Social cohesion, EJ community preparedness, public awareness, early warning reach, community organizations.'],
              ['Natural Systems & Ecosystems (10%)', 'Green infrastructure, urban biodiversity, natural flood attenuation, urban forest coverage, coastal ecosystems.']].map(([title, desc], i) => (
              <div key={i} style={{ marginBottom: 10, padding: '10px 14px', background: T.surfaceH, borderRadius: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Adaptation Calculator' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 16 }}>BCR CALCULATOR</div>
              <div style={{ marginBottom: 12, fontSize: 11, color: T.textSec }}>
                Measure: <select value={selectedMeasure} onChange={e => setSelectedMeasure(Number(e.target.value))} style={{ background: T.surfaceH, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 6px', fontSize: 11 }}>
                  {RESILIENCE_MEASURES.map((m, i) => <option key={i} value={i}>{m.measure}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Discount Rate (%): <span style={{ color: T.gold, fontFamily: T.mono }}>{discountRate.toFixed(1)}</span></div>
                <input type="range" min={1} max={12} step={0.5} value={discountRate} onChange={e => setDiscountRate(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
              </div>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>CapEx</span>
                  <span style={{ fontSize: 13, color: T.gold, fontFamily: T.mono }}>${measure.capex}M</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>Ann. Benefit</span>
                  <span style={{ fontSize: 13, color: T.green, fontFamily: T.mono }}>${measure.annBenefit}M</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>Lifetime</span>
                  <span style={{ fontSize: 13, color: T.text, fontFamily: T.mono }}>{measure.lifetime}yr</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>BCR</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: Number(bcr) >= 4 ? T.green : Number(bcr) >= 2 ? T.amber : T.red, fontFamily: T.mono }}>{bcr}x</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>NPV</span>
                  <span style={{ fontSize: 13, color: Number(npv) >= 0 ? T.green : T.red, fontFamily: T.mono }}>${npv}M</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: T.sage }}>{measure.co2} Mt CO₂ co-benefit/yr</div>
                <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{measure.hazard} · {measure.examples.split(',')[0]}</div>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>BCR COMPARISON ACROSS MEASURES</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[...RESILIENCE_MEASURES].sort((a, b) => b.bcr - a.bcr).map(m => ({ name: m.measure.split(' ')[0], bcr: m.bcr }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="bcr" fill={T.sage} name="BCR" />
                  <ReferenceLine y={4} stroke={T.gold} strokeDasharray="4 2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Funding Stack' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="SELECTED CITY" value={city.name} sub="Funding breakdown" color={T.teal} />
            <Kpi label="BONDS" value={`${city.fundingStack.bonds}%`} sub="Municipal bonds" color={T.gold} />
            <Kpi label="FEDERAL GRANTS" value={`${city.fundingStack.federal}%`} sub="Federal programs" color={T.green} />
            <Kpi label="PRIVATE / OTHER" value={`${city.fundingStack.private}%`} sub="PPP / philanthropy" color={T.amber} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>FUNDING STACK: {city.name.toUpperCase()}</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[{ category: 'Bonds', pct: city.fundingStack.bonds }, { category: 'Federal', pct: city.fundingStack.federal }, { category: 'Grants', pct: city.fundingStack.grants }, { category: 'Private', pct: city.fundingStack.private }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="category" tick={{ fill: T.textSec, fontSize: 11 }} />
                  <YAxis domain={[0, 80]} tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Bar dataKey="pct" name="Share (%)" fill={T.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>ADAPTATION FUNDING TREND ($Bn)</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={fundingTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 11 }} />
                  <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                  <Area type="monotone" dataKey="total" stroke={T.teal} fill={T.navy} name="Total ($Bn)" />
                  <Area type="monotone" dataKey="federal" stroke={T.green} fill={T.sage} name="Federal ($Bn)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Grant Programs' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="TOTAL PROGRAMS" value={FUNDING_PROGRAMS.length} sub="Tracked" color={T.teal} />
            <Kpi label="TOTAL ANNUAL CAPACITY" value={`$${(totalFunding / 1000).toFixed(0)}Bn`} sub="All programs" />
            <Kpi label="LARGEST PROGRAM" value="DOT/EPA WIFIA" sub="$8Bn capacity" color={T.green} />
            <Kpi label="GRANT vs LOAN RATIO" value="60/40" sub="Grants dominate" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>FEDERAL & MULTILATERAL PROGRAMS</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Program', 'Amount ($M)', 'Type', 'Match Req.', 'Focus', 'Deadline'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{FUNDING_PROGRAMS.map((p, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600, fontSize: 11 }}>{p.name}</td>
                  <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono }}>{p.amount.toLocaleString()}</td>
                  <td style={{ padding: '7px 10px', color: T.teal }}>{p.type}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{p.match}</td>
                  <td style={{ padding: '7px 10px', color: T.green, fontSize: 11 }}>{p.focus}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{p.deadline}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Bond Structures' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="RESILIENCE BONDS" value="$18Bn" sub="Outstanding globally" />
            <Kpi label="CAT BONDS (MUNICIPAL)" value="$4.2Bn" sub="Parametric triggers" color={T.teal} />
            <Kpi label="GO RESILIENCE BONDS" value="Dominant" sub="US city preference" color={T.green} />
            <Kpi label="SIB/OUTCOME BONDS" value="Emerging" sub="5-10yr track record" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>BOND STRUCTURES FOR RESILIENCE FINANCE</div>
            {BOND_STRUCTURES.map((b, i) => (
              <div key={i} style={{ marginBottom: 12, padding: '12px 16px', background: T.surfaceH, borderRadius: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{b.name}</div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: T.textSec }}><strong style={{ color: T.gold }}>Security:</strong> {b.security}</span>
                  <span style={{ fontSize: 11, color: T.textSec }}><strong style={{ color: T.gold }}>Tenor:</strong> {b.tenor}</span>
                  <span style={{ fontSize: 11, color: T.textSec }}><strong style={{ color: T.gold }}>Rate:</strong> {b.rate}</span>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <span style={{ fontSize: 11, color: T.green }}>✓ {b.pros}</span>
                  <span style={{ fontSize: 11, color: T.amber }}>⚠ {b.cons}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Hazard Exposure' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="CITIES WITH FLOOD RISK" value={`${CITIES.filter(c => c.hazards.includes('Flooding')).length}/${CITIES.length}`} sub="Tracked universe" color={T.red} />
            <Kpi label="SEA RISE EXPOSED" value={`${CITIES.filter(c => c.hazards.some(h => h.includes('Sea'))).length}/${CITIES.length}`} sub="Coastal cities" color={T.amber} />
            <Kpi label="HEAT EXPOSED" value={`${CITIES.filter(c => c.hazards.includes('Heat')).length}/${CITIES.length}`} sub="Urban heat island" color={T.teal} />
            <Kpi label="MULTI-HAZARD CITIES" value={CITIES.filter(c => c.hazards.length >= 3).length} sub="3+ hazards" color={T.red} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>HAZARD EXPOSURE BY CITY</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['City', 'Hazards', 'Resilience Score', 'Investment ($Bn)', 'Avoided Loss ($Bn)', 'BCR'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{CITIES.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '7px 10px', color: T.amber, fontSize: 11 }}>{c.hazards.join(' · ')}</td>
                  <td style={{ padding: '7px 10px', color: c.resilienceScore >= 80 ? T.green : c.resilienceScore >= 55 ? T.amber : T.red }}>{c.resilienceScore}</td>
                  <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono }}>${c.investment}Bn</td>
                  <td style={{ padding: '7px 10px', color: T.green, fontFamily: T.mono }}>${c.avoided}Bn</td>
                  <td style={{ padding: '7px 10px', color: T.teal }}>{c.bcr}x</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Co-benefit Valuation' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="AVG CO₂ CO-BENEFIT" value={`${(RESILIENCE_MEASURES.reduce((s, m) => s + m.co2, 0) / RESILIENCE_MEASURES.length).toFixed(1)} Mt`} sub="per measure/yr" color={T.green} />
            <Kpi label="HIGHEST CO-BENEFIT" value="NbS" sub="8.5 Mt CO₂/yr" color={T.sage} />
            <Kpi label="SOCIAL BENEFIT MULTIPLIER" value="2.5x" sub="Health + economic gains" color={T.teal} />
            <Kpi label="PROPERTY VALUE UPLIFT" value="3–8%" sub="Within 500m of resilience" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>CO-BENEFIT COMPARISON BY MEASURE</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[...RESILIENCE_MEASURES].sort((a, b) => b.co2 - a.co2).map(m => ({ name: m.measure.split(' ')[0], co2: m.co2, bcr: m.bcr }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                <Legend />
                <Bar dataKey="co2" fill={T.green} name="CO₂ Co-benefit (Mt/yr)" />
                <Bar dataKey="bcr" fill={T.teal} name="BCR" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>CO-BENEFIT CATEGORIES</div>
            {[['Carbon Sequestration / Avoided Emissions', 'Green infrastructure and NbS measures sequester carbon or avoid GHG emissions through energy efficiency. Valued at prevailing carbon price ($50-$180/t under IRA 45Q).'],
              ['Health Co-benefits', 'Urban heat reduction, air quality improvement, and reduced flood trauma prevent premature mortality and morbidity. WHO values statistical life at $2.5–5M for OECD countries.'],
              ['Property Value Uplift', 'Proximity to resilience infrastructure (parks, green corridors, seawalls) increases property values 3–8% within 500m. This creates incremental tax revenue that can back Tax Increment Financing (TIF) bonds.'],
              ['Economic Productivity', 'Reduced disruption from climate events preserves GDP. Flooding 1% of urban land can reduce city-wide GDP by 0.5–2%. Resilience investment has measurable productivity returns.']].map(([title, desc], i) => (
              <div key={i} style={{ marginBottom: 10, padding: '10px 14px', background: T.surfaceH, borderRadius: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Implementation Pipeline' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Kpi label="PIPELINE MEASURES" value={RESILIENCE_MEASURES.length} sub="Tracked archetypes" color={T.teal} />
            <Kpi label="TOTAL CAPEX" value={`$${RESILIENCE_MEASURES.reduce((s, m) => s + m.capex, 0)}M`} sub="Per project average" />
            <Kpi label="AVG LIFETIME" value={`${Math.round(RESILIENCE_MEASURES.reduce((s, m) => s + m.lifetime, 0) / RESILIENCE_MEASURES.length)}yr`} sub="Measure longevity" color={T.green} />
            <Kpi label="TOP BCR MEASURE" value="Early Warning" sub="BCR: 8.1x" color={T.amber} />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: T.gold, fontFamily: T.mono, marginBottom: 12 }}>RESILIENCE MEASURE PIPELINE</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Measure', 'CapEx ($M)', 'Ann. Benefit ($M)', 'Lifetime (yr)', 'BCR', 'CO₂ (Mt/yr)', 'Hazard', 'Status'].map(h => <th key={h} style={{ textAlign: 'left', color: T.textSec, fontFamily: T.mono, padding: '6px 10px', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{[...RESILIENCE_MEASURES].sort((a, b) => b.bcr - a.bcr).map((m, i) => {
                const status = ['Planning', 'Design', 'Procurement', 'Construction', 'Operational'][Math.floor(sr(i * 17) * 5)];
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : 'transparent' }}>
                    <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600, fontSize: 11 }}>{m.measure}</td>
                    <td style={{ padding: '7px 10px', color: T.gold, fontFamily: T.mono }}>${m.capex}M</td>
                    <td style={{ padding: '7px 10px', color: T.green, fontFamily: T.mono }}>${m.annBenefit}M</td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{m.lifetime}yr</td>
                    <td style={{ padding: '7px 10px', color: m.bcr >= 5 ? T.green : m.bcr >= 3 ? T.teal : T.amber, fontWeight: 600 }}>{m.bcr}x</td>
                    <td style={{ padding: '7px 10px', color: T.sage }}>{m.co2}</td>
                    <td style={{ padding: '7px 10px', color: T.textSec, fontSize: 11 }}>{m.hazard}</td>
                    <td style={{ padding: '7px 10px', color: status === 'Operational' ? T.green : status === 'Construction' ? T.amber : T.textSec }}>{status}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
