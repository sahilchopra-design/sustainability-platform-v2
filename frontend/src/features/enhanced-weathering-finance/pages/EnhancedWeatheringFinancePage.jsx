import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const T = {
  bg: '#F0FDF4', card: '#FFFFFF', border: '#BBF7D0', text: '#14532D',
  sub: '#166534', accent: '#15803D', light: '#DCFCE7',
  ew: '#16A34A', mineral: '#059669', ocean: '#0891B2',
  red: '#DC2626', amber: '#D97706', blue: '#2563EB',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const MINERAL_TYPES = [
  { id: 'Basalt', name: 'Basalt Rock', cdrPotential: 2.0, costMin: 80, costMax: 180, mineAbundance: 'Very High', soilType: 'Tropical/Agricultural', status: 'Commercial Pilot' },
  { id: 'Olivine', name: 'Olivine / Dunite', cdrPotential: 3.5, costMin: 60, costMax: 150, mineAbundance: 'High', soilType: 'Tropical', status: 'R&D / Early Pilot' },
  { id: 'Wollastonite', name: 'Wollastonite', cdrPotential: 1.8, costMin: 120, costMax: 250, mineAbundance: 'Medium', soilType: 'Temperate', status: 'Early Commercial' },
  { id: 'Serpentine', name: 'Serpentine / Magnesite', cdrPotential: 2.8, costMin: 100, costMax: 200, mineAbundance: 'High', soilType: 'Various', status: 'R&D' },
  { id: 'Steel-Slag', name: 'Steel Slag (Waste)', cdrPotential: 0.5, costMin: 40, costMax: 100, mineAbundance: 'Industrial Byproduct', soilType: 'All Types', status: 'Early Commercial' },
  { id: 'Cement-Kiln', name: 'Cement Kiln Dust', cdrPotential: 0.3, costMin: 30, costMax: 80, mineAbundance: 'Industrial Byproduct', soilType: 'All Types', status: 'Emerging' },
];

const PROJECTS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  mineral: MINERAL_TYPES[i % MINERAL_TYPES.length].id,
  country: ['India', 'Brazil', 'Ghana', 'Indonesia', 'Kenya', 'Philippines', 'Colombia', 'Tanzania', 'Sri Lanka', 'Vietnam'][i % 10],
  hectares: Math.round(500 + sr(i * 17) * 9500),
  lcoc: Math.round(80 + sr(i * 23) * 200),
  annualCDR: Math.round(500 + sr(i * 31) * 9500),
  yieldBenefit: (0.05 + sr(i * 41) * 0.25).toFixed(2),
  cobenefits: Math.round(2 + sr(i * 53) * 8),
  creditPrice: Math.round(50 + sr(i * 61) * 100),
  permanence: Math.round(1000 + sr(i * 71) * 49000),
  mrv: ['UNDO', 'Stripe Frontier', 'Eion', 'CarbonBuilders', 'Planetary'][i % 5],
  status: ['Active', 'Active', 'Pilot', 'Development', 'Active'][i % 5],
}));

const LCOC_BREAKDOWN = [
  { component: 'Rock Mining', basalt: 25, olivine: 18, wollastonite: 45, slag: 8 },
  { component: 'Crushing & Grinding', basalt: 30, olivine: 28, wollastonite: 35, slag: 12 },
  { component: 'Transport to Field', basalt: 35, olivine: 40, wollastonite: 50, slag: 20 },
  { component: 'Field Application', basalt: 15, olivine: 15, wollastonite: 20, slag: 10 },
  { component: 'MRV & Monitoring', basalt: 25, olivine: 25, wollastonite: 30, slag: 20 },
  { component: 'Verification & Registry', basalt: 10, olivine: 10, wollastonite: 12, slag: 8 },
];

const LEARNING_CURVE = Array.from({ length: 10 }, (_, i) => ({
  year: 2024 + i,
  basalt: Math.round(180 * Math.pow(0.88, i)),
  olivine: Math.round(150 * Math.pow(0.87, i)),
  wollastonite: Math.round(220 * Math.pow(0.86, i)),
  slag: Math.round(80 * Math.pow(0.90, i)),
}));

const CO_BENEFITS = [
  { benefit: 'Crop Yield +', score: 85, description: 'Avg 8–15% yield uplift in tropical soils' },
  { benefit: 'Soil pH Balance', score: 78, description: 'Counteracts acid rain & soil degradation' },
  { benefit: 'Erosion Reduction', score: 65, description: 'Improved soil structure & water retention' },
  { benefit: 'Trace Nutrient Supply', score: 72, description: 'Silica, Ca, Mg, Fe micro-nutrient release' },
  { benefit: 'Biodiversity Support', score: 55, description: 'Improved microbial diversity in soil' },
  { benefit: 'Farmer Income Lift', score: 68, description: 'Reduced fertiliser cost ($30–80/ha/yr)' },
];

const TABS = ['Overview', 'Mineral Analysis', 'Project Economics', 'Learning Curves', 'Co-Benefits', 'Market & MRV'];

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

export default function EnhancedWeatheringFinancePage() {
  const [tab, setTab] = useState(0);
  const [mineralFilter, setMineralFilter] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(100);
  const [scaleSlider, setScaleSlider] = useState(1000);

  const filtered = useMemo(() => {
    return mineralFilter === 'All' ? PROJECTS : PROJECTS.filter(p => p.mineral === mineralFilter);
  }, [mineralFilter]);

  const kpis = useMemo(() => {
    const n = filtered.length || 1;
    return {
      avgLcoc: Math.round(filtered.reduce((a, p) => a + p.lcoc, 0) / n),
      totalCDR: Math.round(filtered.reduce((a, p) => a + p.annualCDR, 0) / 1000),
      avgPermance: Math.round(filtered.reduce((a, p) => a + p.permanence, 0) / n),
      avgYield: (filtered.reduce((a, p) => a + parseFloat(p.yieldBenefit), 0) / n * 100).toFixed(1),
    };
  }, [filtered]);

  const scaleEconomics = useMemo(() => {
    const scaleFactor = Math.pow(scaleSlider / 1000, -0.15);
    const baseLcoc = 150;
    const scaledLcoc = Math.round(baseLcoc * scaleFactor);
    const annualCDR = scaleSlider;
    const annualRevenue = annualCDR * carbonPrice * 1000;
    const annualCost = annualCDR * scaledLcoc * 1000;
    return { scaledLcoc, annualCDR, annualRevenue: (annualRevenue / 1e6).toFixed(1), annualCost: (annualCost / 1e6).toFixed(1), margin: ((annualRevenue - annualCost) / 1e6).toFixed(1) };
  }, [scaleSlider, carbonPrice]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ background: T.ew + '22', color: T.ew, border: `1px solid ${T.ew}44`, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>EP-EH2</span>
            <span style={{ fontSize: 12, color: T.sub }}>Enhanced Weathering & Mineral Carbonation Finance</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>Enhanced Weathering Finance Platform</h1>
          <p style={{ color: T.sub, marginTop: 4, fontSize: 14 }}>Rock-to-soil CDR: basalt, olivine & industrial mineral deployment economics, MRV, and credit market intelligence</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <KpiCard label="Avg LCOC (Basalt)" value={`$${kpis.avgLcoc}`} sub="per tCO₂ removed" color={T.ew} />
          <KpiCard label="Portfolio CDR" value={`${kpis.totalCDR}k`} sub="tCO₂/yr across projects" color={T.mineral} />
          <KpiCard label="Avg Permanence" value={`${(kpis.avgPermance / 1000).toFixed(0)}k`} sub="years CO₂ sequestered" color={T.blue} />
          <KpiCard label="Avg Yield Benefit" value={`+${kpis.avgYield}%`} sub="crop yield co-benefit" color={T.accent} />
          <KpiCard label="Active Projects" value={filtered.filter(p => p.status === 'Active').length} sub="of portfolio" color={T.ocean} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: tab === i ? T.ew : T.light, color: tab === i ? '#fff' : T.text, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ fontSize: 13, color: T.sub }}>Mineral Type: </label>
              {['All', ...MINERAL_TYPES.map(m => m.id)].map(m => (
                <button key={m} onClick={() => setMineralFilter(m)} style={{ padding: '4px 12px', borderRadius: 12, border: `1px solid ${T.border}`, background: mineralFilter === m ? T.ew : T.card, color: mineralFilter === m ? '#fff' : T.text, fontSize: 12, cursor: 'pointer' }}>{m}</button>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: T.light }}>{['ID','Mineral','Country','Hectares','LCOC ($/tCO₂)','CDR (tCO₂/yr)','Yield Benefit','Permanence (yr)','MRV Partner','Status'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: T.ew }}>{p.id}</td>
                      <td style={{ padding: '8px 12px' }}>{p.mineral}</td>
                      <td style={{ padding: '8px 12px' }}>{p.country}</td>
                      <td style={{ padding: '8px 12px' }}>{p.hectares.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>${p.lcoc}</td>
                      <td style={{ padding: '8px 12px' }}>{p.annualCDR.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', color: T.ew }}>+{(parseFloat(p.yieldBenefit) * 100).toFixed(0)}%</td>
                      <td style={{ padding: '8px 12px' }}>{p.permanence.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px' }}>{p.mrv}</td>
                      <td style={{ padding: '8px 12px' }}><Pill label={p.status} color={p.status === 'Active' ? T.ew : p.status === 'Pilot' ? T.amber : T.blue} /></td>
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
              <h3 style={{ color: T.text, marginTop: 0 }}>Mineral CDR Potential (tCO₂/t rock)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={MINERAL_TYPES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="cdrPotential" fill={T.ew} radius={[4, 4, 0, 0]} name="CDR Potential (tCO₂/t)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>LCOC Range by Mineral Type ($/tCO₂)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={MINERAL_TYPES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="costMin" fill={T.ew + '88'} radius={[4, 4, 0, 0]} name="Cost Min" />
                  <Bar dataKey="costMax" fill={T.ew} radius={[4, 4, 0, 0]} name="Cost Max" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>LCOC Cost Breakdown by Component</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={LCOC_BREAKDOWN}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="component" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="basalt" fill={T.ew} name="Basalt" />
                  <Bar dataKey="olivine" fill={T.mineral} name="Olivine" />
                  <Bar dataKey="wollastonite" fill={T.ocean} name="Wollastonite" />
                  <Bar dataKey="slag" fill={T.amber} name="Steel Slag" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Scale Economics Calculator</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: T.sub }}>Deployment Scale: {scaleSlider.toLocaleString()} ktCO₂/yr</label>
                  <input type="range" min={100} max={10000} value={scaleSlider} onChange={e => setScaleSlider(Number(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: T.sub }}>Carbon Credit Price: ${carbonPrice}/tCO₂</label>
                  <input type="range" min={40} max={300} value={carbonPrice} onChange={e => setCarbonPrice(Number(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
                <KpiCard label="Scale-Adj LCOC" value={`$${scaleEconomics.scaledLcoc}`} sub="/tCO₂" color={T.ew} />
                <KpiCard label="Annual CDR" value={`${scaleEconomics.annualCDR}k`} sub="tCO₂/yr" color={T.mineral} />
                <KpiCard label="Annual Revenue" value={`$${scaleEconomics.annualRevenue}M`} sub="credit sales" color={T.blue} />
                <KpiCard label="Annual Cost" value={`$${scaleEconomics.annualCost}M`} sub="operations" color={T.red} />
                <KpiCard label="Net Margin" value={`$${scaleEconomics.margin}M`} sub="operating profit" color={parseFloat(scaleEconomics.margin) > 0 ? T.ew : T.red} />
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>LCOC vs Project Scale Scatter</h3>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="hectares" name="Hectares" tick={{ fontSize: 11 }} label={{ value: 'Hectares', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="lcoc" name="LCOC" tick={{ fontSize: 11 }} label={{ value: '$/tCO₂', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={PROJECTS} fill={T.ew} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>LCOC Break-Even Carbon Price</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={MINERAL_TYPES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="costMin" fill={T.ew} name="Break-even (Best)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="costMax" fill={T.red} name="Break-even (High)" radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ color: T.text, marginTop: 0 }}>LCOC Learning Curves 2024–2033 ($/tCO₂)</h3>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={LEARNING_CURVE}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="basalt" stroke={T.ew} strokeWidth={2.5} name="Basalt" dot={false} />
                <Line type="monotone" dataKey="olivine" stroke={T.mineral} strokeWidth={2.5} name="Olivine" dot={false} />
                <Line type="monotone" dataKey="wollastonite" stroke={T.ocean} strokeWidth={2.5} name="Wollastonite" dot={false} />
                <Line type="monotone" dataKey="slag" stroke={T.amber} strokeWidth={2.5} name="Steel Slag" dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 16 }}>
              {['Basalt', 'Olivine', 'Wollastonite', 'Steel Slag'].map((m, i) => {
                const key = m.toLowerCase().replace(' ', '');
                const first = LEARNING_CURVE[0][key === 'steelslag' ? 'slag' : key];
                const last = LEARNING_CURVE[LEARNING_CURVE.length - 1][key === 'steelslag' ? 'slag' : key];
                const reduction = Math.round((1 - last / first) * 100);
                return <KpiCard key={m} label={m} value={`${reduction}%`} sub="cost reduction by 2033" color={[T.ew, T.mineral, T.ocean, T.amber][i]} />;
              })}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Co-Benefits Radar</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={CO_BENEFITS}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="benefit" tick={{ fontSize: 11 }} />
                  <Radar name="Score" dataKey="score" stroke={T.ew} fill={T.ew} fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Co-Benefit Score Breakdown</h3>
              {CO_BENEFITS.map(b => (
                <div key={b.benefit} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: T.text }}>{b.benefit}</span>
                    <span style={{ color: T.ew, fontWeight: 700 }}>{b.score}/100</span>
                  </div>
                  <div style={{ background: T.light, borderRadius: 4, height: 8 }}>
                    <div style={{ background: T.ew, borderRadius: 4, height: 8, width: `${b.score}%` }} />
                  </div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>{b.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>MRV Partner Distribution</h3>
              {['UNDO', 'Stripe Frontier', 'Eion', 'CarbonBuilders', 'Planetary'].map(mrv => {
                const count = PROJECTS.filter(p => p.mrv === mrv).length;
                return (
                  <div key={mrv} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontWeight: 600, color: T.text, fontSize: 13 }}>{mrv}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ background: T.light, borderRadius: 4, height: 8, width: 100 }}>
                        <div style={{ background: T.ew, borderRadius: 4, height: 8, width: `${(count / PROJECTS.length) * 100}%` }} />
                      </div>
                      <span style={{ color: T.sub, fontSize: 12 }}>{count} projects</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Enhanced Weathering Market Outlook</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={Array.from({ length: 10 }, (_, i) => ({ year: 2024 + i, volume: Math.round(0.5 * Math.pow(2.2, i)), value: Math.round(50 * Math.pow(2.0, i)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="volume" stroke={T.ew} fill={T.ew + '33'} name="Volume (MtCO₂)" />
                  <Area yAxisId="right" type="monotone" dataKey="value" stroke={T.mineral} fill={T.mineral + '33'} name="Market Value ($M)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
