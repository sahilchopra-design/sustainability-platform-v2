import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#0f172a', card: '#1e293b', border: '#334155', muted: '#94a3b8',
  text: '#f1f5f9', sub: '#cbd5e1', accent: '#8B5CF6',
  green: '#16A34A', amber: '#D97706', red: '#DC2626', indigo: '#6366F1',
  teal: '#0D9488', blue: '#2563EB', purple: '#7C3AED',
};

const KpiCard = ({ label, value, sub, color = T.accent }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px' }}>
    <div style={{ color: T.muted, fontSize: 12, marginBottom: 6 }}>{label}</div>
    <div style={{ color, fontSize: 26, fontWeight: 700 }}>{value}</div>
    {sub && <div style={{ color: T.sub, fontSize: 11, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Pill = ({ label, color = T.accent }) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}55`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{label}</span>
);

const MATERIALS = [
  { material: 'rPET (food-grade)', code: 'rPET', virginPrice: 1080, recycledPrice: 940, premium: -13, recycleRate: 58, demand2024: 12.4, demand2030: 22.8, co2Saving: 1.8, purity: 'Food-grade', regions: 'EU/US' },
  { material: 'rHDPE', code: 'rHDPE', virginPrice: 1140, recycledPrice: 920, premium: -19, recycleRate: 34, demand2024: 8.1, demand2030: 15.2, co2Saving: 1.6, purity: 'Non-food', regions: 'Global' },
  { material: 'Recycled Aluminium', code: 'rAl', virginPrice: 2650, recycledPrice: 1980, premium: -25, recycleRate: 76, demand2024: 28.6, demand2030: 41.2, co2Saving: 8.4, purity: 'Secondary alloy', regions: 'Global' },
  { material: 'Recycled Steel (EAF)', code: 'rSteel', virginPrice: 720, recycledPrice: 580, premium: -19, recycleRate: 85, demand2024: 680, demand2030: 820, co2Saving: 1.4, purity: 'Various grades', regions: 'Global' },
  { material: 'rPP (post-consumer)', code: 'rPP', virginPrice: 1020, recycledPrice: 850, premium: -17, recycleRate: 22, demand2024: 5.2, demand2030: 11.4, co2Saving: 1.5, purity: 'Non-food', regions: 'EU/US/APAC' },
  { material: 'Recycled Glass (cullet)', code: 'rGlass', virginPrice: 180, recycledPrice: 95, premium: -47, recycleRate: 75, demand2024: 18.2, demand2030: 22.1, co2Saving: 0.3, purity: 'Colour-sorted', regions: 'EU/US' },
  { material: 'Recycled Paper/Cardboard', code: 'rFibre', virginPrice: 680, recycledPrice: 520, premium: -24, recycleRate: 72, demand2024: 145, demand2030: 168, co2Saving: 0.8, purity: 'Various grades', regions: 'Global' },
  { material: 'rPVC', code: 'rPVC', virginPrice: 980, recycledPrice: 720, premium: -27, recycleRate: 18, demand2024: 3.1, demand2030: 6.8, co2Saving: 1.4, purity: 'Construction', regions: 'EU' },
  { material: 'Recycled Copper', code: 'rCu', virginPrice: 9800, recycledPrice: 8200, premium: -16, recycleRate: 43, demand2024: 5.8, demand2030: 9.4, co2Saving: 3.2, purity: 'High-purity', regions: 'Global' },
  { material: 'Bio-based PLA', code: 'PLA', virginPrice: 2100, recycledPrice: 1650, premium: -21, recycleRate: 12, demand2024: 1.4, demand2030: 4.2, co2Saving: 2.1, purity: 'Compostable', regions: 'EU/US' },
];

const PRICE_SERIES = Array.from({ length: 36 }, (_, i) => ({
  month: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i % 12]}'${22 + Math.floor(i / 12)}`,
  rPET: Math.round(880 + sr(i * 11) * 120 + i * 1.8),
  rHDPE: Math.round(840 + sr(i * 7) * 100 + i * 2.2),
  rAl: Math.round(1850 + sr(i * 13) * 200 + i * 3.6),
}));

const BUYERS = Array.from({ length: 20 }, (_, i) => ({
  company: ['Unilever', 'Nestlé', 'P&G', 'Coca-Cola', 'PepsiCo', 'Danone', 'L\'Oréal', 'Henkel', 'Reckitt', 'Colgate',
    'Mars', 'Kellogg\'s', 'Mondelez', 'AB InBev', 'Heineken', 'Carlsberg', 'Diageo', 'Pernod Ricard', 'Beiersdorf', 'Kao'][i],
  rcTarget2025: Math.round(sr(i * 17) * 35 + 15),
  rcAchieved2024: Math.round(sr(i * 11) * 28 + 8),
  mainMaterial: ['rPET', 'rHDPE', 'rPP', 'rFibre', 'rGlass'][Math.floor(sr(i * 7) * 5)],
  annualVolumet: Math.round(sr(i * 13) * 80 + 10),
  premiumPaid: Math.round(sr(i * 9) * 120 + 20),
  certRequired: ['GRS', 'ISCC+', 'RecyClass', 'APR'][Math.floor(sr(i * 5) * 4)],
}));

const CERTIFICATIONS = [
  { name: 'Global Recycled Standard (GRS)', org: 'Textile Exchange', scope: 'All materials ≥20% recycled', chains: '5,800+', recognition: 'Global', type: 'Chain-of-custody' },
  { name: 'ISCC+ (Plastic)', org: 'ISCC', scope: 'Plastic + chemical recycling', chains: '3,200+', recognition: 'EU/US/APAC', type: 'Mass balance' },
  { name: 'RecyClass Protocol', org: 'RecyClass', scope: 'Packaging recyclability', chains: '1,100+', recognition: 'EU', type: 'Design for recycling' },
  { name: 'APR Design Guide', org: 'APR', scope: 'Plastic packaging (US)', chains: '800+', recognition: 'US', type: 'Design guidance' },
  { name: 'SCS Recycled Content', org: 'SCS Global', scope: 'All materials', chains: '1,600+', recognition: 'US', type: 'Product certification' },
  { name: 'Cradle to Cradle (C2C)', org: 'C2C Institute', scope: 'Multi-material products', chains: '650+', recognition: 'Global', type: 'Material health + circular' },
];

const DEMAND_FORECAST = MATERIALS.slice(0, 6).map(m => ({ material: m.code, demand2024: m.demand2024, demand2027: +(m.demand2024 * 1.4).toFixed(1), demand2030: m.demand2030 }));

const RADAR_DATA = [
  { metric: 'Collection Rate', rPET: 58, rHDPE: 34, rAl: 76, rSteel: 85 },
  { metric: 'Quality Premium', rPET: 82, rHDPE: 64, rAl: 88, rSteel: 72 },
  { metric: 'Demand Growth', rPET: 90, rHDPE: 75, rAl: 62, rSteel: 55 },
  { metric: 'Regulatory Drive', rPET: 95, rHDPE: 78, rAl: 70, rSteel: 65 },
  { metric: 'Tech Readiness', rPET: 88, rHDPE: 72, rAl: 92, rSteel: 96 },
  { metric: 'GHG Abatement', rPET: 70, rHDPE: 64, rAl: 98, rSteel: 72 },
];

const TABS = ['Market Overview', 'Material Pricing', 'Brand Buyer Demand', 'Certifications', 'Demand Forecast', 'Investment Thesis'];

export default function RecycledContentMarketsPage() {
  const [tab, setTab] = useState(0);
  const [sortField, setSortField] = useState('demand2024');
  const [buyerSort, setBuyerSort] = useState('rcTarget2025');

  const sortedMaterials = useMemo(() => [...MATERIALS].sort((a, b) => b[sortField] - a[sortField]), [sortField]);
  const sortedBuyers = useMemo(() => [...BUYERS].sort((a, b) => b[buyerSort] - a[buyerSort]), [buyerSort]);

  const avgRecycleRate = MATERIALS.reduce((a, b) => a + b.recycleRate, 0) / MATERIALS.length;
  const totalDemand2024 = MATERIALS.reduce((a, b) => a + b.demand2024, 0);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: 'Inter,sans-serif', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ background: T.accent + '22', border: `1px solid ${T.accent}`, borderRadius: 8, padding: '4px 12px', fontSize: 11, color: T.accent, fontWeight: 700 }}>EP-EJ4</div>
          <Pill label="Recycled Content Markets" color={T.accent} />
          <Pill label="Secondary Materials" color={T.green} />
          <Pill label="Circular Economy" color={T.teal} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Recycled Content Markets</h1>
        <p style={{ color: T.muted, marginTop: 6, fontSize: 14 }}>Secondary material pricing, recycled content demand from brand owners, certification standards, and investment intelligence across the circular materials economy.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Global Secondary Market" value="$680Bn" sub="Materials traded 2024" color={T.accent} />
        <KpiCard label="Avg Recycling Rate" value={`${avgRecycleRate.toFixed(0)}%`} sub="Across tracked materials" color={T.green} />
        <KpiCard label="Total Demand (dataset)" value={`${totalDemand2024.toFixed(0)}Mt`} sub="Recycled content 2024" color={T.teal} />
        <KpiCard label="EU PPWR rContent Target" value="30%" sub="For plastic packaging by 2030" color={T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ background: tab === i ? T.accent : T.card, color: tab === i ? '#fff' : T.sub, border: `1px solid ${tab === i ? T.accent : T.border}`, borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Material Radar — Market Attractiveness</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: T.muted, fontSize: 11 }} />
                  <Radar name="rPET" dataKey="rPET" stroke={T.accent} fill={T.accent + '33'} />
                  <Radar name="rAl" dataKey="rAl" stroke={T.amber} fill={T.amber + '22'} />
                  <Radar name="rSteel" dataKey="rSteel" stroke={T.blue} fill={T.blue + '22'} />
                  <Legend />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Recycled vs Virgin Price Premium (% discount)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={MATERIALS.map(m => ({ code: m.code, discount: Math.abs(m.premium) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="code" stroke={T.muted} tick={{ fontSize: 10 }} />
                  <YAxis stroke={T.muted} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Bar dataKey="discount" name="Discount to Virgin %" fill={T.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[['demand2024', 'Demand Volume'], ['recycleRate', 'Recycle Rate'], ['co2Saving', 'CO₂ Saving']].map(([f, l]) => (
              <button key={f} onClick={() => setSortField(f)} style={{ background: sortField === f ? T.accent : T.card, color: sortField === f ? '#fff' : T.sub, border: `1px solid ${sortField === f ? T.accent : T.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Material', 'Virgin ($/t)', 'Recycled ($/t)', 'Price Gap', 'Recycle Rate', 'Demand 2024', 'Demand 2030', 'CO₂ Saving', 'Purity', 'Regions'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedMaterials.map((m, i) => (
                    <tr key={m.code} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 === 0 ? T.bg + '55' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{m.material}</td>
                      <td style={{ padding: '10px 12px' }}>${m.virginPrice.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', color: T.green, fontWeight: 700 }}>${m.recycledPrice.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', color: T.accent }}>{m.premium}%</td>
                      <td style={{ padding: '10px 12px' }}>{m.recycleRate}%</td>
                      <td style={{ padding: '10px 12px' }}>{m.demand2024}Mt</td>
                      <td style={{ padding: '10px 12px', color: T.teal }}>{m.demand2030}Mt</td>
                      <td style={{ padding: '10px 12px', color: T.amber }}>{m.co2Saving} tCO₂e/t</td>
                      <td style={{ padding: '10px 12px', color: T.sub, fontSize: 11 }}>{m.purity}</td>
                      <td style={{ padding: '10px 12px', color: T.sub, fontSize: 11 }}>{m.regions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Price History — rPET, rHDPE, Recycled Aluminium (36mo)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={PRICE_SERIES}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" stroke={T.muted} tick={{ fontSize: 9 }} interval={5} />
                <YAxis stroke={T.muted} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="rPET" name="rPET ($/t)" stroke={T.accent} dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="rHDPE" name="rHDPE ($/t)" stroke={T.green} dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="rAl" name="rAl ($/t)" stroke={T.amber} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[['rcTarget2025', 'RC Target 2025'], ['rcAchieved2024', 'RC Achieved'], ['annualVolumet', 'Volume (t)'], ['premiumPaid', 'Premium Paid ($/t)']].map(([f, l]) => (
              <button key={f} onClick={() => setBuyerSort(f)} style={{ background: buyerSort === f ? T.purple : T.card, color: buyerSort === f ? '#fff' : T.sub, border: `1px solid ${buyerSort === f ? T.purple : T.border}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Brand Company', 'RC Target 2025', 'RC Achieved 2024', 'Gap', 'Material', 'Volume (t)', 'Premium Paid ($/t)', 'Cert Required'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedBuyers.map((b, i) => {
                    const gap = b.rcTarget2025 - b.rcAchieved2024;
                    return (
                      <tr key={b.company} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 === 0 ? T.bg + '55' : 'transparent' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{b.company}</td>
                        <td style={{ padding: '10px 12px' }}>{b.rcTarget2025}%</td>
                        <td style={{ padding: '10px 12px' }}>{b.rcAchieved2024}%</td>
                        <td style={{ padding: '10px 12px', color: gap > 10 ? T.red : gap > 5 ? T.amber : T.green, fontWeight: 700 }}>{gap > 0 ? `+${gap}%` : `${gap}%`}</td>
                        <td style={{ padding: '10px 12px' }}><Pill label={b.mainMaterial} color={T.accent} /></td>
                        <td style={{ padding: '10px 12px' }}>{b.annualVolumet.toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', color: T.amber }}>${b.premiumPaid}</td>
                        <td style={{ padding: '10px 12px' }}><Pill label={b.certRequired} color={T.indigo} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Recycled Content Certification Standards</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {CERTIFICATIONS.map(c => (
              <div key={c.name} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{c.name}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <Pill label={c.type} color={T.accent} />
                  <Pill label={c.recognition} color={T.indigo} />
                </div>
                <div style={{ fontSize: 11, color: T.sub }}>
                  <div><span style={{ color: T.muted }}>Body: </span>{c.org}</div>
                  <div><span style={{ color: T.muted }}>Scope: </span>{c.scope}</div>
                  <div><span style={{ color: T.muted }}>Certified chains: </span>{c.chains}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Recycled Content Demand Forecast (Mt) 2024–2030</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={DEMAND_FORECAST}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="material" stroke={T.muted} tick={{ fontSize: 11 }} />
                <YAxis stroke={T.muted} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="demand2024" name="2024" fill={T.blue} radius={[4, 4, 0, 0]} />
                <Bar dataKey="demand2027" name="2027E" fill={T.accent} radius={[4, 4, 0, 0]} />
                <Bar dataKey="demand2030" name="2030E" fill={T.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            { title: 'Regulatory Demand Drivers', items: ['EU PPWR: 30% recycled content in plastic packaging by 2030 (mandatory)', 'UK Plastic Packaging Tax: £223/t levy on <30% recycled content (2022+)', 'US RECOVER Act: federal recycled content procurement targets', 'EU Battery Regulation: 12–20% recycled Li/Co/Ni by 2031', 'EU End-of-Life Vehicles Regulation: 25% recycled plastics by 2030', 'SEC Climate Disclosure: Scope 3 Cat 1 now captures virgin material emissions'] },
            { title: 'Investment Themes', items: ['Chemical recycling scale-up: depolymerisation for food-grade rPET', 'Automated sorting technology: AI-enabled NIR sort plants (ZenRobotics, AMP)', 'Digital product passports (EU DPP Regulation 2026): MRV infrastructure', 'Feedstock aggregation platforms: reverse logistics for brand owners', 'rAl sheet for EV body panels: premium over secondary ingot', 'Cross-border certified rContent trading platforms (RecyClass exchange)'] },
            { title: 'Price Risk Factors', items: ['Virgin polymer price collapse (oil price drop) erodes recycled premium', 'China NHI import restrictions on scrap metal reduce global demand', 'Contamination rates (15–35%) reduce sortable yield and marketable volume', 'EU ETS price effect on energy-intensive recycling (aluminium re-melt)', 'Regulatory compliance deadline slippage (EPR implementation delays)', 'Brand commitment vs. actual procurement (intention-action gap)'] },
            { title: 'Financial Structuring', items: ['Offtake agreements with brand owners at guaranteed recycled content premium', 'Green bonds for sorting + processing infrastructure (EU Taxonomy Art. 5.1)', 'Supply chain finance: early payment for certified rContent feedstock suppliers', 'Impact-linked loans tied to recycled content % and collection rate KPIs', 'EU Innovation Fund grants for chemical recycling pilot plants', 'Blended finance for EM collection + sorting infrastructure (IFC, ADB)'] },
          ].map(s => (
            <div key={s.title} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: T.accent }}>{s.title}</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {s.items.map(it => <li key={it} style={{ color: T.sub, fontSize: 12, marginBottom: 6 }}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
