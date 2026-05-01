import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

const T = {
  bg: '#FFFBEB', card: '#FFFFFF', border: '#FDE68A', text: '#451A03',
  sub: '#92400E', accent: '#D97706', light: '#FEF3C7',
  green: '#16A34A', blue: '#2563EB', red: '#DC2626',
  purple: '#7C3AED', teal: '#0D9488',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const CE_MODELS = [
  { model: 'Product-as-a-Service', sector: 'Electronics/Machinery', revenueModel: 'Subscription/lease', marginUplift: 15, resourceSaving: 40, scalability: 75, exampleCo: 'Philips Lighting (Circular Lighting)' },
  { model: 'Take-Back / Remanufacturing', sector: 'Automotive/Electronics', revenueModel: 'Residual value + resale', marginUplift: 22, resourceSaving: 60, scalability: 65, exampleCo: 'Caterpillar Reman; Renault Re-Factory' },
  { model: 'Industrial Symbiosis', sector: 'Manufacturing/Chemicals', revenueModel: 'Waste-to-feedstock revenue', marginUplift: 8, resourceSaving: 55, scalability: 50, exampleCo: 'Kalundborg Symbiosis; Dow Circular' },
  { model: 'Materials Marketplace', sector: 'Construction/Packaging', revenueModel: 'Marketplace commission', marginUplift: 5, resourceSaving: 45, scalability: 90, exampleCo: 'Excess Materials Exchange; Globachem' },
  { model: 'Repair & Refurbish Platform', sector: 'Consumer Goods', revenueModel: 'Service fee + parts', marginUplift: 18, resourceSaving: 35, scalability: 80, exampleCo: 'Back Market; iFixit; PTC ServiceMax' },
  { model: 'Closed-Loop Packaging', sector: 'FMCG/Retail', revenueModel: 'Deposit return + resale', marginUplift: 6, resourceSaving: 70, scalability: 85, exampleCo: 'Loop (TerraCycle); Pret deposit cups' },
];

const INVESTMENTS = Array.from({ length: 22 }, (_, i) => ({
  id: i + 1,
  company: ['Loop Industries', 'Renewlogy', 'Carbios', 'Novamont', 'Renewtech', 'Triton Solar', 'RecycleAI', 'Circulor', 'Greyparrot', 'ReSiGN', 'Renewlogy', 'Retronix', 'Rubicon', 'PureStar', 'Renewtek', 'Closed Loop Partners', 'BlueTriton', 'Renewus', 'Loop Return', 'Renewica', 'CycleUp', 'Renewera'][i],
  model: CE_MODELS[i % CE_MODELS.length].model,
  sector: ['Plastics', 'Packaging', 'Textiles', 'Electronics', 'Construction', 'Food'][i % 6],
  stage: ['Series A', 'Series B', 'Growth', 'Pre-IPO', 'Seed', 'Series A'][i % 6],
  valuation: Math.round(10 + sr(i * 13) * 490),
  revCagr: Math.round(25 + sr(i * 19) * 75),
  materialSaving: Math.round(20 + sr(i * 23) * 55),
  co2Saving: Math.round(15 + sr(i * 29) * 60),
  investor: ['KKR', 'Blackrock', 'TPG Rise', 'EQT Ventures', 'Breakthrough', 'GreenStar'][i % 6],
}));

const MARKET_SIZE = Array.from({ length: 8 }, (_, i) => ({
  year: 2024 + i,
  ceMarket: Math.round(1200 + i * 380),
  recyclingTech: Math.round(250 + i * 110),
  productService: Math.round(180 + i * 95),
}));

const TABS = ['Overview', 'CE Business Models', 'Investment Pipeline', 'Market Sizing', 'ROI Analysis', 'Ellen MacArthur Framework'];

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

export default function CircularEconomyInvestmentPage() {
  const [tab, setTab] = useState(0);
  const [modelFilter, setModelFilter] = useState('All');

  const filtered = useMemo(() => modelFilter === 'All' ? INVESTMENTS : INVESTMENTS.filter(i => i.model === modelFilter), [modelFilter]);

  const kpis = useMemo(() => {
    const n = filtered.length || 1;
    return {
      avgValuation: Math.round(filtered.reduce((a, i) => a + i.valuation, 0) / n),
      avgRevCagr: Math.round(filtered.reduce((a, i) => a + i.revCagr, 0) / n),
      avgMaterialSaving: Math.round(filtered.reduce((a, i) => a + i.materialSaving, 0) / n),
      totalCo2: Math.round(filtered.reduce((a, i) => a + i.co2Saving, 0) / 1000),
    };
  }, [filtered]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ background: T.accent + '22', color: T.accent, border: `1px solid ${T.accent}44`, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>EP-EJ1</span>
            <span style={{ fontSize: 12, color: T.sub }}>Circular Economy Investment Analytics</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>Circular Economy Investment Platform</h1>
          <p style={{ color: T.sub, marginTop: 4, fontSize: 14 }}>CE business model ROI, venture investment pipeline, Ellen MacArthur frameworks, resource efficiency economics, and circular market sizing</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <KpiCard label="CE Market 2030" value="$4.5Tn" sub="global circular economy opportunity" color={T.accent} />
          <KpiCard label="Avg Valuation" value={`$${kpis.avgValuation}M`} sub="pipeline company" color={T.green} />
          <KpiCard label="Avg Rev CAGR" value={`${kpis.avgRevCagr}%`} sub="circular business models" color={T.blue} />
          <KpiCard label="Avg Material Saving" value={`${kpis.avgMaterialSaving}%`} sub="virgin material reduction" color={T.teal} />
          <KpiCard label="CO₂ Saving (ktpa)" value={kpis.totalCo2} sub="portfolio aggregate" color={T.purple} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: tab === i ? T.accent : T.light, color: tab === i ? '#fff' : T.text, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Margin Uplift by CE Model (%)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={CE_MODELS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="model" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="marginUplift" fill={T.accent} radius={[4, 4, 0, 0]} name="Margin Uplift %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Resource Saving vs Scalability</h3>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="scalability" name="Scalability" tick={{ fontSize: 11 }} label={{ value: 'Scalability', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="resourceSaving" name="Resource Saving %" tick={{ fontSize: 11 }} label={{ value: 'Resource Saving %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={CE_MODELS} fill={T.accent} fillOpacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {CE_MODELS.map(m => (
              <div key={m.model} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 6 }}>{m.model}</div>
                <Pill label={m.sector} color={T.accent} />
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                  <div style={{ color: T.sub }}>Margin Uplift: <strong style={{ color: T.green }}>+{m.marginUplift}%</strong></div>
                  <div style={{ color: T.sub }}>Resource Saving: <strong style={{ color: T.teal }}>{m.resourceSaving}%</strong></div>
                  <div style={{ color: T.sub }}>Scalability: <strong>{m.scalability}/100</strong></div>
                  <div style={{ color: T.sub }}>Revenue: <strong style={{ color: T.blue }}>{m.revenueModel}</strong></div>
                </div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 8 }}>📌 {m.exampleCo}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {['All', ...CE_MODELS.map(m => m.model)].map(m => (
                <button key={m} onClick={() => setModelFilter(m)} style={{ padding: '4px 10px', borderRadius: 12, border: `1px solid ${T.border}`, background: modelFilter === m ? T.accent : T.card, color: modelFilter === m ? '#fff' : T.text, fontSize: 11, cursor: 'pointer' }}>{m.split(' ').slice(0, 2).join(' ')}</button>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: T.light }}>{['#', 'Company', 'CE Model', 'Sector', 'Stage', 'Valuation ($M)', 'Rev CAGR', 'Material Save', 'CO₂ Save', 'Lead Investor'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map((inv, i) => (
                    <tr key={inv.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: T.accent }}>{inv.id}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{inv.company}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11 }}>{inv.model}</td>
                      <td style={{ padding: '8px 12px' }}>{inv.sector}</td>
                      <td style={{ padding: '8px 12px' }}><Pill label={inv.stage} color={inv.stage.includes('Growth') || inv.stage.includes('IPO') ? T.green : T.blue} /></td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: T.green }}>${inv.valuation}M</td>
                      <td style={{ padding: '8px 12px', color: T.accent, fontWeight: 600 }}>{inv.revCagr}%</td>
                      <td style={{ padding: '8px 12px' }}>{inv.materialSaving}%</td>
                      <td style={{ padding: '8px 12px' }}>{inv.co2Saving} kt</td>
                      <td style={{ padding: '8px 12px' }}>{inv.investor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ color: T.text, marginTop: 0 }}>Circular Economy Market Size Forecast ($Bn)</h3>
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={MARKET_SIZE}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="ceMarket" stroke={T.accent} fill={T.accent + '33'} name="Total CE Market" stackId="1" />
                <Area type="monotone" dataKey="recyclingTech" stroke={T.green} fill={T.green + '33'} name="Recycling Tech" stackId="1" />
                <Area type="monotone" dataKey="productService" stroke={T.blue} fill={T.blue + '33'} name="Product-as-Service" stackId="1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Revenue CAGR Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { range: '<30%', count: INVESTMENTS.filter(i => i.revCagr < 30).length },
                  { range: '30–50%', count: INVESTMENTS.filter(i => i.revCagr >= 30 && i.revCagr < 50).length },
                  { range: '50–75%', count: INVESTMENTS.filter(i => i.revCagr >= 50 && i.revCagr < 75).length },
                  { range: '>75%', count: INVESTMENTS.filter(i => i.revCagr >= 75).length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.accent} radius={[4, 4, 0, 0]} name="# Companies" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Material Saving by CE Model (%)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={CE_MODELS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="model" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="resourceSaving" fill={T.teal} radius={[4, 4, 0, 0]} name="Resource Saving %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Ellen MacArthur Foundation — Circular Economy Principles</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {[
                  { principle: 'Eliminate Waste & Pollution', description: 'Design out waste; no concept of waste — only resource. Eliminate single-use plastics, toxic materials.', metric: 'Material efficiency %; waste-to-landfill reduction' },
                  { principle: 'Circulate Products & Materials', description: 'Keep products and materials in use at their highest value. Inner loops (reuse, repair) preferred over outer loops (recycling).', metric: 'Circularity rate %; loops hierarchy score' },
                  { principle: 'Regenerate Natural Systems', description: 'Enhance natural capital through soil regeneration, biodiversity, and returning biological nutrients to biosphere.', metric: 'Biodiversity net gain; soil organic carbon' },
                  { principle: 'Design for Longevity', description: 'Products designed for durability, repairability, disassembly, and remanufacturing. Modularity key.', metric: 'Product lifetime extension; repair index score' },
                  { principle: 'Business Model Innovation', description: 'Shift from ownership to performance; product-as-a-service aligns incentives with resource efficiency.', metric: 'Revenue from services/total; material intensity/revenue' },
                  { principle: 'Systemic Thinking', description: 'Understand how parts affect each other — industrial symbiosis, urban mining, city-level material flows.', metric: 'Material flow analysis; urban mine potential' },
                ].map(p => (
                  <div key={p.principle} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                    <div style={{ fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 6 }}>{p.principle}</div>
                    <p style={{ fontSize: 12, color: T.sub, margin: '0 0 6px' }}>{p.description}</p>
                    <div style={{ fontSize: 11, color: T.accent }}>Metric: {p.metric}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
