import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const T = {
  bg: '#FFF7ED', card: '#FFFFFF', border: '#FED7AA', text: '#7C2D12',
  sub: '#9A3412', accent: '#EA580C', light: '#FFEDD5',
  biochar: '#B45309', beccs: '#059669', blend: '#7C3AED',
  red: '#DC2626', amber: '#D97706', blue: '#2563EB',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const calcIRR = (cashflows) => {
  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    const npv = cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
    const dnpv = cashflows.reduce((acc, cf, t) => t === 0 ? acc : acc - t * cf / Math.pow(1 + rate, t + 1), 0);
    if (Math.abs(dnpv) < 1e-10) break;
    const next = rate - npv / dnpv;
    if (Math.abs(next - rate) < 1e-6) { rate = next; break; }
    rate = next;
  }
  return rate;
};

const FEEDSTOCKS = [
  { id: 'AgriResidues', name: 'Agricultural Residues', yield: 0.30, cost: 25, permanence: 100, lcoc: 75, pathway: 'Biochar' },
  { id: 'ForestResidues', name: 'Forest Residues', yield: 0.33, cost: 35, permanence: 150, lcoc: 90, pathway: 'Biochar' },
  { id: 'WoodPellets', name: 'Wood Pellets (Dedicated)', yield: 0.32, cost: 90, permanence: 120, lcoc: 180, pathway: 'BECCS' },
  { id: 'MunicipalWaste', name: 'Municipal Solid Waste', yield: 0.18, cost: 15, permanence: 80, lcoc: 65, pathway: 'Biochar' },
  { id: 'EnergyCrops', name: 'Miscanthus / Switchgrass', yield: 0.28, cost: 55, permanence: 110, lcoc: 220, pathway: 'BECCS' },
  { id: 'SeaweedAlgae', name: 'Macroalgae / Seaweed', yield: 0.15, cost: 80, permanence: 500, lcoc: 350, pathway: 'Biochar' },
];

const PROJECTS = Array.from({ length: 22 }, (_, i) => ({
  id: i + 1,
  type: i % 2 === 0 ? 'Biochar' : 'BECCS',
  feedstock: FEEDSTOCKS[i % FEEDSTOCKS.length].id,
  country: ['USA', 'Germany', 'Australia', 'Brazil', 'Canada', 'UK', 'Sweden', 'Netherlands', 'Denmark', 'India'][i % 10],
  capex: Math.round(5 + sr(i * 13) * 95),
  lcoc: Math.round(60 + sr(i * 19) * 340),
  annualCDR: Math.round(200 + sr(i * 29) * 19800),
  permanence: FEEDSTOCKS[i % FEEDSTOCKS.length].permanence,
  agriCoben: (sr(i * 37) > 0.5 ? true : false),
  buyer: ['Microsoft', 'Stripe Frontier', 'Shopify', 'Airbus', 'BCG', 'Swiss Re', 'Holcim', 'UBS'][i % 8],
  priceUSD: Math.round(100 + sr(i * 43) * 500),
  irr: (8 + sr(i * 53) * 15).toFixed(1),
}));

const LCOC_COMPARISON = [
  { pathway: 'Biochar-AgriRes', lcoc: 75, permanence: 100, scalability: 85 },
  { pathway: 'Biochar-ForestRes', lcoc: 90, permanence: 150, scalability: 70 },
  { pathway: 'Biochar-MSW', lcoc: 65, permanence: 80, scalability: 90 },
  { pathway: 'BECCS-Wood', lcoc: 180, permanence: 10000, scalability: 55 },
  { pathway: 'BECCS-EnergyCrops', lcoc: 220, permanence: 10000, scalability: 50 },
  { pathway: 'BECCS-Algae', lcoc: 350, permanence: 500, scalability: 35 },
];

const MARKET_FORECAST = Array.from({ length: 10 }, (_, i) => ({
  year: 2024 + i,
  biocharVolume: Math.round(2 * Math.pow(1.65, i)),
  beccsVolume: Math.round(0.5 * Math.pow(1.8, i)),
  biocharPrice: Math.round(120 * Math.pow(0.93, i)),
  beccsPrice: Math.round(220 * Math.pow(0.91, i)),
}));

const IRA_BREAKDOWN = [
  { technology: 'Biochar (PyC)', iraSection: '§45Q Modified', ratePerTon: 35, eligible: true },
  { technology: 'BECCS (Power)', iraSection: '§45Q', ratePerTon: 85, eligible: true },
  { technology: 'BECCS (Industrial)', iraSection: '§45Q', ratePerTon: 85, eligible: true },
  { technology: 'BECCS (DAC-equivalent)', iraSection: '§45Q', ratePerTon: 180, eligible: false },
  { technology: 'Pyrolysis (RNG)', iraSection: '§45Z', ratePerTon: 20, eligible: true },
  { technology: 'Biomass Power', iraSection: '§45Y', ratePerTon: 15, eligible: true },
];

const TABS = ['Overview', 'Feedstock Economics', 'Project Finance', 'Market Forecast', 'Policy & IRA', 'Risk Register'];

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

export default function BiocharBeccsFinancePage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(120);
  const [feedstockCost, setFeedstockCost] = useState(40);

  const filtered = useMemo(() => {
    return typeFilter === 'All' ? PROJECTS : PROJECTS.filter(p => p.type === typeFilter);
  }, [typeFilter]);

  const kpis = useMemo(() => {
    const n = filtered.length || 1;
    return {
      avgLcoc: Math.round(filtered.reduce((a, p) => a + p.lcoc, 0) / n),
      totalCDR: Math.round(filtered.reduce((a, p) => a + p.annualCDR, 0) / 1000),
      avgIrr: (filtered.reduce((a, p) => a + parseFloat(p.irr), 0) / n).toFixed(1),
      avgPrice: Math.round(filtered.reduce((a, p) => a + p.priceUSD, 0) / n),
    };
  }, [filtered]);

  const finModel = useMemo(() => {
    const capex = 50; // $M
    const annualCDR = 10000; // tCO₂
    const revenue = annualCDR * carbonPrice;
    const opex = annualCDR * feedstockCost * 0.5;
    const ebitda = revenue - opex;
    const cfs = [-capex * 1e6, ...Array.from({ length: 20 }, () => ebitda)];
    const irr = calcIRR(cfs);
    const npv = cfs.reduce((acc, cf, t) => acc + cf / Math.pow(1.08, t), 0);
    return { capex, annualCDR, revenue: (revenue / 1e6).toFixed(2), opex: (opex / 1e6).toFixed(2), ebitda: (ebitda / 1e6).toFixed(2), irr: (irr * 100).toFixed(1), npv: (npv / 1e6).toFixed(1) };
  }, [carbonPrice, feedstockCost]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ background: T.biochar + '22', color: T.biochar, border: `1px solid ${T.biochar}44`, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>EP-EH3</span>
            <span style={{ fontSize: 12, color: T.sub }}>Biochar & BECCS Finance</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>Biochar & BECCS Finance Platform</h1>
          <p style={{ color: T.sub, marginTop: 4, fontSize: 14 }}>Biomass carbon removal: pyrolysis, bioenergy with CCS — feedstock economics, IRA §45Q policy, and project returns</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <KpiCard label="Avg LCOC" value={`$${kpis.avgLcoc}`} sub="per tCO₂ removed" color={T.biochar} />
          <KpiCard label="Portfolio CDR" value={`${kpis.totalCDR}k`} sub="tCO₂/yr" color={T.beccs} />
          <KpiCard label="Avg Project IRR" value={`${kpis.avgIrr}%`} sub="equity returns" color={T.blue} />
          <KpiCard label="Avg Credit Price" value={`$${kpis.avgPrice}`} sub="per tCO₂ (OTC)" color={T.accent} />
          <KpiCard label="Active Projects" value={filtered.length} sub="in pipeline" color={T.blend} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: tab === i ? T.biochar : T.light, color: tab === i ? '#fff' : T.text, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              {['All', 'Biochar', 'BECCS'].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '4px 14px', borderRadius: 12, border: `1px solid ${T.border}`, background: typeFilter === t ? T.biochar : T.card, color: typeFilter === t ? '#fff' : T.text, fontSize: 12, cursor: 'pointer' }}>{t}</button>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: T.light }}>{['#','Type','Feedstock','Country','CAPEX ($M)','LCOC ($/t)','CDR (t/yr)','Permanence','IRA Buyer','Credit Price','IRR'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.slice(0, 15).map((p, i) => (
                    <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: T.biochar }}>{p.id}</td>
                      <td style={{ padding: '8px 12px' }}><Pill label={p.type} color={p.type === 'Biochar' ? T.biochar : T.beccs} /></td>
                      <td style={{ padding: '8px 12px' }}>{p.feedstock}</td>
                      <td style={{ padding: '8px 12px' }}>{p.country}</td>
                      <td style={{ padding: '8px 12px' }}>${p.capex}M</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>${p.lcoc}</td>
                      <td style={{ padding: '8px 12px' }}>{p.annualCDR.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px' }}>{p.permanence} yr</td>
                      <td style={{ padding: '8px 12px' }}>{p.buyer}</td>
                      <td style={{ padding: '8px 12px', color: T.beccs, fontWeight: 600 }}>${p.priceUSD}</td>
                      <td style={{ padding: '8px 12px', color: T.blue }}>{p.irr}%</td>
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
              <h3 style={{ color: T.text, marginTop: 0 }}>LCOC by Feedstock Pathway</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={FEEDSTOCKS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="lcoc" fill={T.biochar} radius={[4, 4, 0, 0]} name="LCOC ($/tCO₂)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Permanence vs LCOC Trade-off</h3>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="permanence" name="Permanence (yr)" tick={{ fontSize: 11 }} label={{ value: 'Permanence (yr)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="lcoc" name="LCOC ($/t)" tick={{ fontSize: 11 }} label={{ value: '$/tCO₂', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={LCOC_COMPARISON} fill={T.biochar} fillOpacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Feedstock Yield & Cost Profile</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={FEEDSTOCKS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="yield" fill={T.biochar} name="Carbon Yield (tC/t)" />
                  <Bar yAxisId="right" dataKey="cost" fill={T.beccs} name="Feedstock Cost ($/t)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Project Finance Model — 10,000 tCO₂/yr Facility</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: T.sub }}>Carbon Credit Price: ${carbonPrice}/tCO₂</label>
                  <input type="range" min={50} max={600} value={carbonPrice} onChange={e => setCarbonPrice(Number(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: T.sub }}>Feedstock Cost Adj: ${feedstockCost}/unit</label>
                  <input type="range" min={10} max={150} value={feedstockCost} onChange={e => setFeedstockCost(Number(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 10 }}>
                <KpiCard label="CAPEX" value={`$${finModel.capex}M`} sub="project investment" color={T.red} />
                <KpiCard label="Annual CDR" value={`${finModel.annualCDR.toLocaleString()}`} sub="tCO₂/yr" color={T.biochar} />
                <KpiCard label="Revenue" value={`$${finModel.revenue}M`} sub="annual" color={T.beccs} />
                <KpiCard label="Opex" value={`$${finModel.opex}M`} sub="annual" color={T.amber} />
                <KpiCard label="EBITDA" value={`$${finModel.ebitda}M`} sub="annual" color={T.blue} />
                <KpiCard label="Project IRR" value={`${finModel.irr}%`} sub="20yr unlevered" color={parseFloat(finModel.irr) > 8 ? T.beccs : T.red} />
                <KpiCard label="NPV @8%" value={`$${finModel.npv}M`} sub="20yr horizon" color={parseFloat(finModel.npv) > 0 ? T.beccs : T.red} />
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>IRR Distribution by Project Type</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { range: '<8%', biochar: PROJECTS.filter(p => p.type === 'Biochar' && parseFloat(p.irr) < 8).length, beccs: PROJECTS.filter(p => p.type === 'BECCS' && parseFloat(p.irr) < 8).length },
                  { range: '8–12%', biochar: PROJECTS.filter(p => p.type === 'Biochar' && parseFloat(p.irr) >= 8 && parseFloat(p.irr) < 12).length, beccs: PROJECTS.filter(p => p.type === 'BECCS' && parseFloat(p.irr) >= 8 && parseFloat(p.irr) < 12).length },
                  { range: '12–16%', biochar: PROJECTS.filter(p => p.type === 'Biochar' && parseFloat(p.irr) >= 12 && parseFloat(p.irr) < 16).length, beccs: PROJECTS.filter(p => p.type === 'BECCS' && parseFloat(p.irr) >= 12 && parseFloat(p.irr) < 16).length },
                  { range: '>16%', biochar: PROJECTS.filter(p => p.type === 'Biochar' && parseFloat(p.irr) >= 16).length, beccs: PROJECTS.filter(p => p.type === 'BECCS' && parseFloat(p.irr) >= 16).length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="biochar" fill={T.biochar} name="Biochar" />
                  <Bar dataKey="beccs" fill={T.beccs} name="BECCS" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>CAPEX Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { range: '<$20M', count: PROJECTS.filter(p => p.capex < 20).length },
                  { range: '$20–50M', count: PROJECTS.filter(p => p.capex >= 20 && p.capex < 50).length },
                  { range: '$50–75M', count: PROJECTS.filter(p => p.capex >= 50 && p.capex < 75).length },
                  { range: '>$75M', count: PROJECTS.filter(p => p.capex >= 75).length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.biochar} radius={[4, 4, 0, 0]} name="# Projects" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Biochar & BECCS Volume Forecast (MtCO₂)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={MARKET_FORECAST}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="biocharVolume" stroke={T.biochar} fill={T.biochar + '33'} name="Biochar (Mt)" stackId="1" />
                  <Area type="monotone" dataKey="beccsVolume" stroke={T.beccs} fill={T.beccs + '33'} name="BECCS (Mt)" stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Credit Price Forecast ($/tCO₂)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={MARKET_FORECAST}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="biocharPrice" stroke={T.biochar} strokeWidth={2.5} name="Biochar Price" dot={false} />
                  <Line type="monotone" dataKey="beccsPrice" stroke={T.beccs} strokeWidth={2.5} name="BECCS Price" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>IRA §45Q — Biochar & BECCS Eligibility</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: T.light }}>{['Technology','IRA Section','Credit Rate ($/tCO₂)','Eligible'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {IRA_BREAKDOWN.map((row, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{row.technology}</td>
                      <td style={{ padding: '10px 12px', color: T.blue }}>{row.iraSection}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: T.beccs }}>${row.ratePerTon}</td>
                      <td style={{ padding: '10px 12px' }}><Pill label={row.eligible ? 'Eligible' : 'Not Eligible'} color={row.eligible ? T.beccs : T.red} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { risk: 'Feedstock Supply Risk', severity: 'High', description: 'Seasonal availability and competing uses (food, fiber, fuel) for biomass', mitigation: 'Long-term supply contracts, diversified feedstock mix' },
              { risk: 'Additionality Challenges', severity: 'High', description: 'Proving biomass sourcing is additional vs. baseline scenarios for registries', mitigation: 'Third-party audit, ICROA approval, VERRA or Gold Standard registration' },
              { risk: 'Land Use Change Risk', severity: 'High', description: 'BECCS energy crop expansion could displace food cropland', mitigation: 'Marginal land-only policy, no deforestation certification' },
              { risk: 'Permanence Risk (Biochar)', severity: 'Medium', description: 'Soil disturbance, oxidation could release stored carbon', mitigation: 'MRV monitoring, permanence buffer pools, 100yr stability assumption' },
              { risk: 'Technology Risk', severity: 'Medium', description: 'Pyrolysis yield optimization and BECCS capture efficiency variance', mitigation: 'Performance warranties, technology insurance' },
              { risk: 'Policy Risk', severity: 'Low', description: 'IRA §45Q future amendment risk post-2025 election cycle', mitigation: 'Lock in PPA pricing with fixed IRA pass-through clauses' },
            ].map(r => (
              <div key={r.risk} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{r.risk}</span>
                  <Pill label={r.severity} color={r.severity === 'High' ? T.red : r.severity === 'Medium' ? T.amber : T.beccs} />
                </div>
                <p style={{ fontSize: 13, color: T.sub, margin: '0 0 8px' }}>{r.description}</p>
                <p style={{ fontSize: 12, color: T.accent, margin: 0 }}>Mitigation: {r.mitigation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
