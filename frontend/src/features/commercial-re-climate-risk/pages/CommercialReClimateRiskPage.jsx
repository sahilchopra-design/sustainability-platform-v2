import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const T = {
  bg: '#FFF7ED', card: '#FFFFFF', border: '#FED7AA', text: '#7C2D12',
  sub: '#9A3412', accent: '#EA580C', light: '#FFEDD5',
  stranded: '#DC2626', risk: '#D97706', safe: '#16A34A',
  blue: '#2563EB', purple: '#7C3AED',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const EPC_RATINGS = [
  { rating: 'A', pct: 8, rentPremium: 12, strandedRisk: 5, euTaxonomy: true, crremAligned: true },
  { rating: 'B', pct: 14, rentPremium: 7, strandedRisk: 12, euTaxonomy: true, crremAligned: true },
  { rating: 'C', pct: 22, rentPremium: 2, strandedRisk: 25, euTaxonomy: false, crremAligned: false },
  { rating: 'D', pct: 25, rentPremium: -3, strandedRisk: 45, euTaxonomy: false, crremAligned: false },
  { rating: 'E', pct: 18, rentPremium: -8, strandedRisk: 68, euTaxonomy: false, crremAligned: false },
  { rating: 'F', pct: 9, rentPremium: -14, strandedRisk: 82, euTaxonomy: false, crremAligned: false },
  { rating: 'G', pct: 4, rentPremium: -20, strandedRisk: 95, euTaxonomy: false, crremAligned: false },
];

const PROPERTIES = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  type: ['Office', 'Retail', 'Logistics', 'Hotel', 'Mixed-Use', 'Residential'][i % 6],
  city: ['London', 'Paris', 'Amsterdam', 'Frankfurt', 'Madrid', 'Milan', 'Brussels', 'Stockholm'][i % 8],
  epc: ['A', 'B', 'C', 'D', 'E', 'F', 'G'][Math.floor(sr(i * 13) * 7)],
  yearBuilt: Math.round(1970 + sr(i * 17) * 50),
  energyIntensity: Math.round(80 + sr(i * 23) * 320),
  crremGap: (sr(i * 29) * 60 - 10).toFixed(1),
  retrofitCost: Math.round(200 + sr(i * 37) * 1800),
  strandedYear: Math.round(2026 + sr(i * 41) * 14),
  currentValue: Math.round(5 + sr(i * 43) * 95),
  valuationRisk: (sr(i * 47) * 25).toFixed(1),
}));

const CRREM_PATHWAY = Array.from({ length: 11 }, (_, i) => ({
  year: 2024 + i * 2.5,
  officeTarget: Math.round(120 - i * 9),
  retailTarget: Math.round(160 - i * 12),
  logisticsTarget: Math.round(80 - i * 5.5),
  hotelTarget: Math.round(200 - i * 15),
}));

const NGFS_SCENARIOS = [
  { scenario: 'Net Zero 2050 (Orderly)', physicalRisk: 15, transitionRisk: 35, strandedAssets: 20, avgValuationImpact: -8 },
  { scenario: 'Below 2°C (Delayed)', physicalRisk: 25, transitionRisk: 55, strandedAssets: 38, avgValuationImpact: -18 },
  { scenario: 'Nationally Determined', physicalRisk: 45, transitionRisk: 30, strandedAssets: 52, avgValuationImpact: -25 },
  { scenario: 'Current Policies (Hot House)', physicalRisk: 80, transitionRisk: 10, strandedAssets: 70, avgValuationImpact: -35 },
];

const TABS = ['Overview', 'EPC & Stranding', 'CRREM Pathway', 'NGFS Stress Test', 'Retrofit Economics', 'Regulatory Intelligence'];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.accent }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Pill = ({ label, color }) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{label}</span>
);

export default function CommercialReClimateRiskPage() {
  const [tab, setTab] = useState(0);
  const [epcFilter, setEpcFilter] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(80);

  const filtered = useMemo(() => epcFilter === 'All' ? PROPERTIES : PROPERTIES.filter(p => p.epc === epcFilter), [epcFilter]);

  const kpis = useMemo(() => {
    const n = filtered.length || 1;
    const strandedPct = Math.round((filtered.filter(p => p.epc >= 'D').length / n) * 100);
    const avgRetrofit = Math.round(filtered.reduce((a, p) => a + p.retrofitCost, 0) / n);
    const avgValRisk = (filtered.reduce((a, p) => a + parseFloat(p.valuationRisk), 0) / n).toFixed(1);
    return { strandedPct, avgRetrofit, avgValRisk };
  }, [filtered]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ background: T.stranded + '22', color: T.stranded, border: `1px solid ${T.stranded}44`, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>EP-EI2</span>
            <span style={{ fontSize: 12, color: T.sub }}>Commercial Real Estate Climate Risk</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>CRE Climate Risk & Stranded Asset Intelligence</h1>
          <p style={{ color: T.sub, marginTop: 4, fontSize: 14 }}>CRREM pathways, EPC stranding risk, NGFS scenario stress testing, and retrofit economics for commercial real estate portfolios</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <KpiCard label="Stranded Asset Risk" value={`${kpis.strandedPct}%`} sub="EPC D-G in portfolio" color={T.stranded} />
          <KpiCard label="Avg Retrofit Cost" value={`€${kpis.avgRetrofit}/m²`} sub="to reach EPC B target" color={T.risk} />
          <KpiCard label="Avg Valuation Risk" value={`-${kpis.avgValRisk}%`} sub="NGFS delayed transition" color={T.purple} />
          <KpiCard label="CRREM Below 2°C" value="2031" sub="avg stranding year (D-G)" color={T.blue} />
          <KpiCard label="EU Taxonomy Aligned" value={`${PROPERTIES.filter(p => p.epc <= 'B').length}`} sub="of portfolio properties" color={T.safe} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: tab === i ? T.stranded : T.light, color: tab === i ? '#fff' : T.text, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['All', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map(r => (
                <button key={r} onClick={() => setEpcFilter(r)} style={{ padding: '4px 12px', borderRadius: 12, border: `1px solid ${T.border}`, background: epcFilter === r ? T.stranded : T.card, color: epcFilter === r ? '#fff' : T.text, fontSize: 12, cursor: 'pointer' }}>{r}</button>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: T.light }}>{['#', 'Type', 'City', 'EPC', 'Built', 'Energy (kWh/m²)', 'CRREM Gap', 'Retrofit Cost', 'Stranded By', 'Value (€M)', 'Val Risk'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: T.accent }}>{p.id}</td>
                      <td style={{ padding: '8px 12px' }}>{p.type}</td>
                      <td style={{ padding: '8px 12px' }}>{p.city}</td>
                      <td style={{ padding: '8px 12px' }}><Pill label={`EPC ${p.epc}`} color={p.epc <= 'B' ? T.safe : p.epc <= 'D' ? T.risk : T.stranded} /></td>
                      <td style={{ padding: '8px 12px' }}>{p.yearBuilt}</td>
                      <td style={{ padding: '8px 12px' }}>{p.energyIntensity}</td>
                      <td style={{ padding: '8px 12px', color: parseFloat(p.crremGap) > 0 ? T.stranded : T.safe, fontWeight: 600 }}>{p.crremGap > 0 ? '+' : ''}{p.crremGap}%</td>
                      <td style={{ padding: '8px 12px' }}>€{p.retrofitCost}/m²</td>
                      <td style={{ padding: '8px 12px', color: p.strandedYear < 2030 ? T.stranded : T.risk }}>{p.strandedYear}</td>
                      <td style={{ padding: '8px 12px' }}>€{p.currentValue}M</td>
                      <td style={{ padding: '8px 12px', color: T.stranded }}>-{p.valuationRisk}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>EPC Distribution — EU Portfolio</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={EPC_RATINGS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="pct" name="Portfolio %" radius={[4, 4, 0, 0]} fill={T.risk} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Stranded Asset Risk by EPC (%)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={EPC_RATINGS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="strandedRisk" name="Stranded Risk %" fill={T.stranded} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Rent Premium vs EPC Rating (%)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={EPC_RATINGS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="rentPremium" name="Rent Premium %" radius={[4, 4, 0, 0]}>
                    {EPC_RATINGS.map((e, idx) => <rect key={idx} fill={e.rentPremium > 0 ? T.safe : T.stranded} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ color: T.text, marginTop: 0 }}>CRREM Carbon Intensity Pathways (kgCO₂/m²/yr) — Below 2°C</h3>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={CRREM_PATHWAY}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="officeTarget" stroke={T.blue} strokeWidth={2.5} name="Office" dot={false} />
                <Line type="monotone" dataKey="retailTarget" stroke={T.risk} strokeWidth={2.5} name="Retail" dot={false} />
                <Line type="monotone" dataKey="logisticsTarget" stroke={T.safe} strokeWidth={2.5} name="Logistics" dot={false} />
                <Line type="monotone" dataKey="hotelTarget" stroke={T.purple} strokeWidth={2.5} name="Hotel" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>NGFS Climate Scenario Stress Test — CRE Portfolio Impact</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: T.light }}>{['Scenario', 'Physical Risk', 'Transition Risk', 'Stranded Assets', 'Avg Valuation Impact'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {NGFS_SCENARIOS.map((s, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: T.text }}>{s.scenario}</td>
                      <td style={{ padding: '10px 12px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ background: T.light, borderRadius: 4, height: 8, width: 80 }}><div style={{ background: s.physicalRisk > 50 ? T.stranded : T.risk, borderRadius: 4, height: 8, width: `${s.physicalRisk}%` }} /></div><span style={{ color: T.text }}>{s.physicalRisk}%</span></div></td>
                      <td style={{ padding: '10px 12px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ background: T.light, borderRadius: 4, height: 8, width: 80 }}><div style={{ background: T.blue, borderRadius: 4, height: 8, width: `${s.transitionRisk}%` }} /></div><span style={{ color: T.text }}>{s.transitionRisk}%</span></div></td>
                      <td style={{ padding: '10px 12px', color: T.stranded, fontWeight: 600 }}>{s.strandedAssets}% of stock</td>
                      <td style={{ padding: '10px 12px', color: T.stranded, fontWeight: 700 }}>{s.avgValuationImpact}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: T.sub }}>Carbon Price: €{carbonPrice}/tCO₂</label>
                <input type="range" min={20} max={200} value={carbonPrice} onChange={e => setCarbonPrice(Number(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
              </div>
              <h3 style={{ color: T.text, marginTop: 0 }}>Retrofit Economics by EPC Band</h3>
              {[{from:'G→E', cost: 800, energySave: 40, carbonSave: 55, years: 12}, {from:'F→D', cost: 650, energySave: 30, carbonSave: 42, years: 9}, {from:'E→C', cost: 500, energySave: 22, carbonSave: 30, years: 7}, {from:'D→B', cost: 700, energySave: 35, carbonSave: 45, years: 8}, {from:'C→A', cost: 900, energySave: 45, carbonSave: 58, years: 10}].map(r => {
                const annualSaving = (r.energySave * 0.15) + (r.carbonSave * carbonPrice / 1000);
                const pb = (r.cost / annualSaving).toFixed(1);
                return (
                  <div key={r.from} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: T.text, fontSize: 13 }}>EPC {r.from}</span>
                      <span style={{ color: T.safe, fontWeight: 700 }}>€{r.cost}/m²</span>
                    </div>
                    <div style={{ fontSize: 12, color: T.sub }}>Energy save: {r.energySave}% · CO₂ save: {r.carbonSave}% · Payback: <strong style={{ color: T.accent }}>{pb}yr</strong></div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Retrofit Cost vs Stranding Avoidance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="retrofitCost" name="Retrofit Cost (€/m²)" tick={{ fontSize: 11 }} label={{ value: 'Retrofit Cost (€/m²)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="valuationRisk" name="Valuation Risk %" tick={{ fontSize: 11 }} label={{ value: 'Val Risk %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={PROPERTIES.map(p => ({ retrofitCost: p.retrofitCost, valuationRisk: parseFloat(p.valuationRisk) }))} fill={T.stranded} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { reg: 'EU Taxonomy CCM Activity 7.7', jurisdiction: 'EU', requirement: 'Top 15% national energy performance or NZEB', penalty: 'Exclusion from Art.8/9 funds; GAR ineligibility', timeline: 'In force 2022' },
              { reg: 'UK MEES (Minimum EPC Standard)', jurisdiction: 'UK', requirement: 'EPC C by 2028 (non-domestic); EPC B by 2030', penalty: 'Cannot let without valid EPC at minimum standard', timeline: '2025–2030 phase-in' },
              { reg: 'EU Energy Performance of Buildings', jurisdiction: 'EU', requirement: 'NZEB for new builds; worst-performing 15% renovated by 2030', penalty: 'National penalties + stranded asset risk', timeline: 'EPBD Recast 2024' },
              { reg: 'France Décret Tertiaire', jurisdiction: 'France', requirement: '-40% by 2030; -50% by 2040; -60% by 2050 vs 2010', penalty: 'Admin fines up to €1,500/yr for non-reporting', timeline: 'In force 2019 (reporting)' },
              { reg: 'Singapore BCA Green Mark 2021', jurisdiction: 'Singapore', requirement: 'GM Platinum or FIT for new buildings; 80% green stock by 2030', penalty: 'Development permits conditional', timeline: '2021+ for new builds' },
              { reg: 'US SEC Climate Disclosure Rule', jurisdiction: 'USA', requirement: 'Scope 1+2 GHG disclosure; material Scope 3 for large accelerated filers', penalty: 'SEC enforcement; restatement risk', timeline: '2026 effective (large filers)' },
            ].map(r => (
              <div key={r.reg} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 6 }}>{r.reg}</div>
                <Pill label={r.jurisdiction} color={T.blue} />
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <div style={{ color: T.sub, marginBottom: 4 }}>Requirement: <span style={{ color: T.text }}>{r.requirement}</span></div>
                  <div style={{ color: T.sub, marginBottom: 4 }}>Penalty: <span style={{ color: T.stranded }}>{r.penalty}</span></div>
                  <div style={{ color: T.sub }}>Timeline: <span style={{ color: T.safe, fontWeight: 600 }}>{r.timeline}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
