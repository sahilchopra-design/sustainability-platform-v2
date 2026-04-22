import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', gold: '#d4a843', sage: '#2d6a4f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const ECOSYSTEMS = [
  { id: 'mangrove', name: 'Mangroves', globalHaM: 14.7, seqTco2HaYr: 6.4, stockTco2Ha: 840, lossRateYr: 0.7, restorationCostHa: 1800, creditPriceUsd: 28, creditQuality: 'HIGH', verraApproved: true, cbcaAligned: true, cobenefits: ['Biodiversity', 'Coastal protection', 'Fisheries habitat'] },
  { id: 'seagrass', name: 'Seagrass Meadows', globalHaM: 17.2, seqTco2HaYr: 2.4, stockTco2Ha: 140, lossRateYr: 1.5, restorationCostHa: 4200, creditPriceUsd: 22, creditQuality: 'MEDIUM', verraApproved: true, cbcaAligned: true, cobenefits: ['Fisheries nursery', 'Water quality', 'Dugong habitat'] },
  { id: 'saltmarsh', name: 'Salt Marshes', globalHaM: 5.5, seqTco2HaYr: 4.8, stockTco2Ha: 620, lossRateYr: 1.2, restorationCostHa: 2600, creditPriceUsd: 24, creditQuality: 'HIGH', verraApproved: true, cbcaAligned: true, cobenefits: ['Storm surge buffer', 'Bird habitat', 'Water filtration'] },
  { id: 'kelp', name: 'Kelp Forests', globalHaM: 2.8, seqTco2HaYr: 1.1, stockTco2Ha: 35, lossRateYr: 2.1, restorationCostHa: 8500, creditPriceUsd: 14, creditQuality: 'EMERGING', verraApproved: false, cbcaAligned: false, cobenefits: ['Fisheries', 'Otter habitat', 'Biodiversity'] },
  { id: 'coral', name: 'Coral Reef Ecosystem', globalHaM: 28.0, seqTco2HaYr: 0.8, stockTco2Ha: 22, lossRateYr: 1.8, restorationCostHa: 12000, creditPriceUsd: 18, creditQuality: 'EMERGING', verraApproved: false, cbcaAligned: false, cobenefits: ['Fisheries', 'Tourism', 'Coastal protection'] },
];

const MPA_PROJECTS = [
  { id: 'seyc', name: 'Seychelles MPA Debt Swap', location: 'Indian Ocean', areaMha: 0.41, financing: 'Debt-for-nature $21.9M', creditsMt: 0.28, buyer: 'Sovereign', status: 'Operational', irr: 6.2 },
  { id: 'blue_amazon', name: 'Brazilian Blue Amazon', location: 'South Atlantic', areaMha: 1.2, financing: 'Green Bond $180M', creditsMt: 0.85, buyer: 'Corporate + Voluntary', status: 'Active', irr: 7.8 },
  { id: 'coral_triangle', name: 'Coral Triangle Initiative', location: 'Indo-Pacific', areaMha: 5.9, financing: 'MDB + ODA $350M', creditsMt: 1.2, buyer: 'Sovereign + NGO', status: 'Active', irr: 5.1 },
  { id: 'great_blue', name: 'Great Blue Wall (E. Africa)', location: 'Western Indian Ocean', areaMha: 2.0, financing: 'Blue Bond $120M', creditsMt: 0.62, buyer: 'Voluntary Market', status: 'Scaling', irr: 8.4 },
  { id: 'patagonia', name: 'Patagonia Marine Reserve', location: 'South Pacific', areaMha: 0.56, financing: 'Endowment $45M', creditsMt: 0.19, buyer: 'Corporate', status: 'Operational', irr: 4.8 },
];

const CREDIT_MARKET = [
  { year: 2019, volumeMtco2: 0.8, priceAvgUsd: 8, revenueMusd: 6 },
  { year: 2020, volumeMtco2: 1.4, priceAvgUsd: 11, revenueMusd: 15 },
  { year: 2021, volumeMtco2: 2.8, priceAvgUsd: 16, revenueMusd: 45 },
  { year: 2022, volumeMtco2: 4.1, priceAvgUsd: 22, revenueMusd: 90 },
  { year: 2023, volumeMtco2: 6.2, priceAvgUsd: 24, revenueMusd: 149 },
  { year: 2024, volumeMtco2: 9.8, priceAvgUsd: 27, revenueMusd: 265 },
  { year: 2025, volumeMtco2: 14.5, priceAvgUsd: 30, revenueMusd: 435 },
];

const METHODOLOGIES = [
  { name: 'VCS VM0033 (Mangrove Restoration)', body: 'Verra', ecosystems: ['Mangrove'], additionality: 'Project-based', permanence: '100yr buffer pool', approved: true },
  { name: 'VCS VM0024 (Coastal Blue Carbon)', body: 'Verra', ecosystems: ['Mangrove', 'Seagrass', 'Salt Marsh'], additionality: 'Regulatory surplus', permanence: 'Buffer pool + insurance', approved: true },
  { name: 'Gold Standard Blue Carbon', body: 'Gold Standard', ecosystems: ['Mangrove', 'Seagrass'], additionality: 'Additionality test', permanence: 'Project-level monitoring', approved: true },
  { name: 'CBCA Coastal Wetland Crediting', body: 'CBCA (US)', ecosystems: ['Salt Marsh', 'Mangrove'], additionality: 'Conservation surplus', permanence: '30yr monitoring', approved: false },
  { name: 'Plan Vivo Blue Carbon', body: 'Plan Vivo', ecosystems: ['Mangrove', 'Seagrass'], additionality: 'Community-based', permanence: 'Community stewardship', approved: true },
];

const TABS = ['Overview', 'Ecosystems', 'MPA Finance', 'Credit Market', 'Methodologies', 'Additionality', 'Permanence', 'Project Valuation', 'Co-Benefits', 'Deal Structuring'];

function calcCreditRevenue({ areaHa, seqTco2HaYr, creditPriceUsd }) {
  return areaHa * seqTco2HaYr * creditPriceUsd;
}
function calcRestorationNpv({ areaHa, restCostHa, annRevenue, discountRate, lifeYrs }) {
  const capex = areaHa * restCostHa;
  const pvRevenue = lifeYrs > 0 && discountRate > 0 ? annRevenue * (1 - Math.pow(1 + discountRate / 100, -lifeYrs)) / (discountRate / 100) : annRevenue * lifeYrs;
  return pvRevenue - capex;
}

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function MarineBlueCarbonFinancePage() {
  const [tab, setTab] = useState(0);
  const [selEco, setSelEco] = useState('mangrove');
  const [areaHa, setAreaHa] = useState(5000);
  const [discountRate, setDiscountRate] = useState(8);
  const [lifeYrs, setLifeYrs] = useState(30);
  const [creditPrice, setCreditPrice] = useState(25);

  const eco = ECOSYSTEMS.find(e => e.id === selEco) || ECOSYSTEMS[0];
  const annRevenue = calcCreditRevenue({ areaHa, seqTco2HaYr: eco.seqTco2HaYr, creditPriceUsd: creditPrice });
  const npv = calcRestorationNpv({ areaHa, restCostHa: eco.restorationCostHa, annRevenue, discountRate, lifeYrs });
  const totalGlobalSeq = ECOSYSTEMS.reduce((s, e) => s + e.globalHaM * 1e6 * e.seqTco2HaYr / 1e9, 0);
  const qualColor = (q) => ({ HIGH: T.green, MEDIUM: T.amber, EMERGING: T.teal }[q] || T.textMut);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: 24 }}>
      <div style={{ borderBottom: `2px solid ${T.gold}`, paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 2 }}>EP-DZ3 · OCEAN & BLUE ECONOMY FINANCE</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0', color: T.text }}>Marine & Blue Carbon Finance Intelligence</h1>
        <div style={{ fontSize: 12, color: T.textSec }}>Mangrove · Seagrass · Salt Marsh · MPA Finance · Verra VCS · CBCA · Blue Carbon Credits · Project Valuation · 10 Tabs</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Kpi label="BLUE CARBON POTENTIAL" value={`${totalGlobalSeq.toFixed(2)} GtCO₂/yr`} sub="Global coastal ecosystems" />
        <Kpi label="2025 MARKET SIZE" value="$435M" sub="Blue carbon credit revenue" color={T.teal} />
        <Kpi label="AVG CREDIT PRICE" value="$30/tCO₂" sub="Mangrove & seagrass" color={T.amber} />
        <Kpi label="VERRA APPROVED" value="3/5" sub="Ecosystem methodologies" color={T.green} />
        <Kpi label="MPA FINANCE TRACKED" value="$716M" sub="5 flagship projects" color={T.sage} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '6px 14px', borderRadius: 4, border: `1px solid ${tab === i ? T.gold : T.border}`, background: tab === i ? T.navy : T.surface, color: tab === i ? T.gold : T.textSec, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>BLUE CARBON CREDIT MARKET GROWTH</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={CREDIT_MARKET}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Area type="monotone" dataKey="revenueMusd" stroke={T.teal} fill={T.teal} fillOpacity={0.3} name="Revenue ($M)" /></AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>ECOSYSTEM CARBON SEQUESTRATION (tCO₂/ha/yr)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ECOSYSTEMS}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 9 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Bar dataKey="seqTco2HaYr" fill={T.sage} name="Seq. (tCO₂/ha/yr)" /></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, gridColumn: '1/-1' }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>ECOSYSTEM OVERVIEW TABLE</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Ecosystem', 'Global Area', 'Seq (tCO₂/ha/yr)', 'Stock (tCO₂/ha)', 'Loss Rate', 'Credit Price', 'Quality', 'Verra'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textMut, fontFamily: T.mono }}>{h}</th>)}
              </tr></thead>
              <tbody>{ECOSYSTEMS.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                  <td style={{ padding: '8px 10px', color: T.gold, fontFamily: T.mono }}>{e.name}</td>
                  <td style={{ padding: '8px 10px', color: T.text }}>{e.globalHaM}M ha</td>
                  <td style={{ padding: '8px 10px', color: T.sage, fontFamily: T.mono }}>{e.seqTco2HaYr}</td>
                  <td style={{ padding: '8px 10px', color: T.teal, fontFamily: T.mono }}>{e.stockTco2Ha}</td>
                  <td style={{ padding: '8px 10px', color: T.red, fontFamily: T.mono }}>{e.lossRateYr}%/yr</td>
                  <td style={{ padding: '8px 10px', color: T.amber, fontFamily: T.mono }}>${e.creditPriceUsd}</td>
                  <td style={{ padding: '8px 10px', color: qualColor(e.creditQuality) }}>{e.creditQuality}</td>
                  <td style={{ padding: '8px 10px', color: e.verraApproved ? T.green : T.textMut }}>{e.verraApproved ? '✓' : '–'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ECOSYSTEMS.map(e => (
              <button key={e.id} onClick={() => setSelEco(e.id)} style={{ padding: '6px 12px', borderRadius: 4, border: `1px solid ${selEco === e.id ? T.gold : T.border}`, background: selEco === e.id ? T.navy : T.surface, color: selEco === e.id ? T.gold : T.text, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{e.name}</button>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold, marginBottom: 16 }}>{eco.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              <Kpi label="GLOBAL AREA" value={`${eco.globalHaM}M ha`} sub={`Loss: ${eco.lossRateYr}%/yr`} />
              <Kpi label="SEQUESTRATION" value={`${eco.seqTco2HaYr} tCO₂/ha/yr`} sub="Net annual uptake" color={T.sage} />
              <Kpi label="CARBON STOCK" value={`${eco.stockTco2Ha} tCO₂/ha`} sub="Soil + biomass" color={T.teal} />
              <Kpi label="CREDIT PRICE" value={`$${eco.creditPriceUsd}`} sub={`Quality: ${eco.creditQuality}`} color={qualColor(eco.creditQuality)} />
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 8 }}>CO-BENEFITS</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {eco.cobenefits.map((b, i) => <span key={i} style={{ background: T.navy, color: T.sage, borderRadius: 4, padding: '4px 10px', fontSize: 11, fontFamily: T.mono }}>{b}</span>)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 12, flex: 1 }}>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>VERRA APPROVED</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: eco.verraApproved ? T.green : T.amber, fontFamily: T.mono, marginTop: 4 }}>{eco.verraApproved ? 'YES' : 'PENDING'}</div>
              </div>
              <div style={{ background: T.surfaceH, borderRadius: 6, padding: 12, flex: 1 }}>
                <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>RESTORATION COST</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.amber, fontFamily: T.mono, marginTop: 4 }}>${eco.restorationCostHa.toLocaleString()}/ha</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {MPA_PROJECTS.map((p, i) => (
            <div key={p.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{p.location}</div>
                </div>
                <div style={{ background: T.navy, borderRadius: 4, padding: '4px 10px', fontFamily: T.mono, fontSize: 11, color: p.status === 'Operational' ? T.green : T.amber }}>{p.status}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[['AREA', `${p.areaMha}M ha`], ['FINANCING', p.financing], ['CREDITS', `${p.creditsMt}Mt CO₂`], ['IRR', `${p.irr}%`]].map(([label, val]) => (
                  <div key={label} style={{ background: T.surfaceH, borderRadius: 4, padding: 10 }}>
                    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>{label}</div>
                    <div style={{ fontSize: 12, color: T.text, marginTop: 3 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>BLUE CARBON CREDIT MARKET — VOLUME & PRICE</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={CREDIT_MARKET}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Area type="monotone" dataKey="volumeMtco2" stroke={T.teal} fill={T.teal} fillOpacity={0.3} name="Volume (MtCO₂)" /><Area type="monotone" dataKey="priceAvgUsd" stroke={T.gold} fill={T.gold} fillOpacity={0.2} name="Avg Price ($/tCO₂)" /></AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {CREDIT_MARKET.slice(-4).map((y, i) => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: T.gold }}>{y.year}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.teal, fontFamily: T.mono, marginTop: 4 }}>{y.volumeMtco2}Mt</div>
                <div style={{ fontSize: 11, color: T.textSec }}>${y.priceAvgUsd}/t · ${y.revenueMusd}M revenue</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {METHODOLOGIES.map((m, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>Body: {m.body}</div>
                </div>
                <div style={{ background: m.approved ? T.sage : T.surfaceH, borderRadius: 4, padding: '4px 10px', fontFamily: T.mono, fontSize: 11, color: m.approved ? T.text : T.textMut }}>{m.approved ? 'APPROVED' : 'DRAFT'}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[['ECOSYSTEMS', m.ecosystems.join(', ')], ['ADDITIONALITY', m.additionality], ['PERMANENCE', m.permanence]].map(([label, val]) => (
                  <div key={label} style={{ background: T.surfaceH, borderRadius: 4, padding: 10 }}>
                    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>{label}</div>
                    <div style={{ fontSize: 11, color: T.text, marginTop: 3 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>ADDITIONALITY FRAMEWORK</div>
            {[['Financial Additionality', 'Project would not occur without carbon revenue', T.green], ['Regulatory Surplus', 'Carbon sequestration beyond legal requirements', T.teal], ['Baseline Establishment', 'Without-project scenario quantified & validated', T.amber], ['Performance Standard', 'Emissions below sectoral benchmark', T.sage], ['Common Practice Test', 'Restoration not common in project area', T.gold]].map(([label, desc, color]) => (
              <div key={label} style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginBottom: 10 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color }}>{label}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>ADDITIONALITY SCORE BY ECOSYSTEM</div>
            {ECOSYSTEMS.map((e, i) => {
              const score = Math.round(60 + sr(i * 13) * 30);
              return (
                <div key={e.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSec, marginBottom: 4 }}>
                    <span>{e.name}</span><span style={{ color: score >= 80 ? T.green : score >= 65 ? T.amber : T.red, fontFamily: T.mono }}>{score}/100</span>
                  </div>
                  <div style={{ background: T.borderL, borderRadius: 4, height: 6 }}><div style={{ background: score >= 80 ? T.green : score >= 65 ? T.amber : T.red, width: `${score}%`, height: 6, borderRadius: 4 }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>PERMANENCE RISK FRAMEWORK</div>
            {[['Reversal Buffer Pool', '10-20% credits held in Verra buffer', T.teal], ['Coastal Risk Premium', '+5% buffer for storm/sea level risk', T.amber], ['Monitoring & Verification', 'Satellite + in-situ biennial MRV', T.sage], ['Insurance Products', 'Parametric cover for catastrophic loss', T.gold], ['Long-Term Stewardship', '30-100yr monitoring obligations', T.green]].map(([label, desc, color]) => (
              <div key={label} style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginBottom: 10 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color }}>{label}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>RISK-ADJUSTED CREDIT PRICING</div>
            {ECOSYSTEMS.map((e, i) => {
              const riskDiscount = Math.round(5 + sr(i * 7) * 15);
              const adjPrice = Math.max(8, e.creditPriceUsd - riskDiscount * e.creditPriceUsd / 100);
              return (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.text }}>{e.name}</div>
                    <div style={{ fontSize: 10, color: T.textMut }}>Permanence discount: {riskDiscount}%</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.gold, fontFamily: T.mono }}>${adjPrice.toFixed(0)}</div>
                    <div style={{ fontSize: 10, color: T.textMut }}>risk-adj. price</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 7 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 16 }}>PROJECT VALUATION ENGINE</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, fontFamily: T.mono }}>Ecosystem:</div>
              <select value={selEco} onChange={e => setSelEco(e.target.value)} style={{ background: T.surfaceH, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 10px', width: '100%', fontFamily: T.mono, fontSize: 11 }}>
                {ECOSYSTEMS.map(e => <option key={e.id} value={e.id}>{e.name} (${e.creditPriceUsd}/t)</option>)}
              </select>
            </div>
            {[['Restoration Area (ha)', areaHa, setAreaHa, 100, 50000, 100], ['Carbon Price ($/tCO₂)', creditPrice, setCreditPrice, 5, 80], ['Discount Rate (%)', discountRate, setDiscountRate, 3, 20], ['Project Life (years)', lifeYrs, setLifeYrs, 10, 50]].map(([label, val, set, min, max, step = 1]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, fontFamily: T.mono }}>{label}: <span style={{ color: T.gold }}>{val}</span></div>
                <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
              </div>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>VALUATION RESULTS</div>
            <div style={{ background: T.navy, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[['Total Capex', `$${(areaHa * eco.restorationCostHa / 1e6).toFixed(2)}M`, T.amber], ['Annual Revenue', `$${(annRevenue / 1e6).toFixed(3)}M`, T.teal], ['Annual Credits', `${(areaHa * eco.seqTco2HaYr / 1000).toFixed(1)} Kt`, T.sage], ['Project NPV', `$${(npv / 1e6).toFixed(2)}M`, npv > 0 ? T.green : T.red]].map(([label, val, color]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: T.textMut }}>{label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: T.mono, marginTop: 4 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.surfaceH, borderRadius: 6, padding: 12 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 8 }}>VIABILITY ASSESSMENT</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: npv > 0 ? T.green : T.red }}>{npv > 0 ? 'PROJECT VIABLE — positive NPV under current parameters' : 'BELOW THRESHOLD — adjust price or reduce costs'}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 6 }}>Break-even credit price: ${eco.restorationCostHa > 0 && areaHa > 0 && eco.seqTco2HaYr > 0 ? (eco.restorationCostHa / (eco.seqTco2HaYr * lifeYrs * (discountRate > 0 ? (1 - Math.pow(1 + discountRate / 100, -lifeYrs)) / (discountRate / 100) : lifeYrs) / eco.restorationCostHa * eco.seqTco2HaYr)).toFixed(0) : '—'}/tCO₂</div>
            </div>
          </div>
        </div>
      )}

      {tab === 8 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>CO-BENEFIT FRAMEWORK</div>
            {[['Biodiversity (TNFD)', 'Species habitat area, endemic species protected', T.sage, 88], ['Coastal Protection', 'Storm surge attenuation, erosion reduction', T.teal, 82], ['Fisheries Productivity', 'Nursery habitat, sustainable catch support', T.green, 75], ['Water Quality', 'Nutrient filtration, sediment trapping', T.amber, 68], ['Community Livelihoods', 'Local employment, sustainable use rights', T.gold, 71], ['Cultural Value', 'Indigenous rights, heritage sites, tourism', '#9c27b0', 58]].map(([label, desc, color, score]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: T.text }}>{label}</span><span style={{ color, fontFamily: T.mono }}>{score}/100</span>
                </div>
                <div style={{ background: T.borderL, borderRadius: 4, height: 6, marginBottom: 4 }}><div style={{ background: color, width: `${score}%`, height: 6, borderRadius: 4 }} /></div>
                <div style={{ fontSize: 10, color: T.textMut }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>CO-BENEFIT MONETIZATION</div>
            {[['Coastal flood protection value', '$8,000–$22,000/ha/yr'], ['Fisheries productivity uplift', '$1,200–$4,500/ha/yr'], ['Water quality services', '$400–$1,800/ha/yr'], ['Biodiversity offset premium', '$5–$15/tCO₂ add-on'], ['Ecotourism revenue potential', '$200–$800/ha/yr'], ['Carbon credit + co-benefit bundle', '30–50% price premium']].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 11 }}>
                <span style={{ color: T.text }}>{label}</span>
                <span style={{ color: T.gold, fontFamily: T.mono }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 9 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>BLUE CARBON DEAL STRUCTURING OPTIONS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[['Debt-for-Nature Swap', 'Sovereign debt restructured in exchange for MPA establishment; pioneered by Seychelles ($21.9M, 410K km² MPA)', T.teal], ['Endowment Fund', 'Capital endowment generates perpetual income for MPA management; suited for legacy donors and foundations', T.sage], ['Blue Bond (Project Finance)', 'Special purpose vehicle issues labeled blue bond; proceeds fund restoration; credits service debt', T.amber], ['Pay-for-Performance (REDD+ analog)', 'Payments conditional on verified sequestration; reduces investor risk; suited for bilateral climate finance', T.gold], ['Voluntary Carbon + Co-benefit Bundle', 'Credits sold to corporates at premium; co-benefits (biodiversity, fisheries) generate additional revenue streams', T.green], ['Blended Finance Facility', 'DFI/ODA first-loss tranche de-risks commercial capital; typical split: 20% concessional / 80% market rate', '#9c27b0']].map(([title, desc, color]) => (
                <div key={title} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 12, color, marginBottom: 8 }}>{title}</div>
                  <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
