import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const T = {
  bg: '#F5F3FF', card: '#FFFFFF', border: '#DDD6FE', text: '#2E1065',
  sub: '#5B21B6', accent: '#7C3AED', light: '#EDE9FE',
  cdr: '#0D9488', dac: '#2563EB', biochar: '#B45309',
  red: '#DC2626', amber: '#D97706', green: '#16A34A',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const CREDIT_TYPES = [
  { id: 'DAC-Geological', name: 'DAC — Geological Storage', permanence: 'Permanent (>10,000 yr)', price2024: 600, price2030: 350, volume2024: 0.05, volume2030: 5, registry: 'Puro.earth / DNV / VERRA', additionality: 'Very High' },
  { id: 'DAC-Mineral', name: 'DAC — Mineral Carbonation', permanence: 'Permanent (~1,000 yr)', price2024: 500, price2030: 280, volume2024: 0.02, volume2030: 3, registry: 'Puro.earth', additionality: 'Very High' },
  { id: 'BECCS-Power', name: 'BECCS — Power Generation', permanence: 'Permanent (geological)', price2024: 200, price2030: 140, volume2024: 0.3, volume2030: 15, registry: 'Gold Standard / VERRA', additionality: 'High' },
  { id: 'Biochar', name: 'Biochar Soil Application', permanence: '100–300 yr (MRV-verified)', price2024: 150, price2030: 90, volume2024: 1.2, volume2030: 20, registry: 'Puro.earth / EBC / VERRA', additionality: 'High' },
  { id: 'EW-Basalt', name: 'Enhanced Weathering — Basalt', permanence: '1,000–50,000 yr', price2024: 180, price2030: 100, volume2024: 0.3, volume2030: 8, registry: 'UNDO / Eion / CarbonBuilders', additionality: 'High' },
  { id: 'OAE', name: 'Ocean Alkalinity Enhancement', permanence: '10,000+ yr', price2024: 250, price2030: 120, volume2024: 0.02, volume2030: 4, registry: 'Pre-commercial (no registry yet)', additionality: 'Very High' },
  { id: 'Kelp-BECCS', name: 'Kelp / Ocean Biomass', permanence: '100–500 yr (uncertain)', price2024: 200, price2030: 130, volume2024: 0.01, volume2030: 2, registry: 'Pilot / bespoke', additionality: 'Medium' },
];

const BUYERS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  buyer: ['Microsoft', 'Google', 'Meta', 'Stripe Frontier', 'Shopify', 'Airbus', 'McKinsey', 'BCG', 'Swiss Re', 'Goldman Sachs',
    'JPMorgan', 'HSBC', 'Holcim', 'LaFarge', 'Shell', 'BP', 'Unilever', 'Nestle', 'Amazon', 'Apple'][i],
  sector: ['Tech', 'Tech', 'Tech', 'Fintech', 'E-commerce', 'Aviation', 'Consulting', 'Consulting', 'Insurance', 'Finance',
    'Finance', 'Finance', 'Cement', 'Cement', 'Energy', 'Energy', 'FMCG', 'FMCG', 'E-commerce', 'Tech'][i],
  commitment2030: Math.round(50 + sr(i * 19) * 950),
  preferredType: CREDIT_TYPES[i % CREDIT_TYPES.length].id,
  maxPrice: Math.round(150 + sr(i * 29) * 850),
  permanenceReq: ['Any', 'Permanent only', '100+ yr', 'Permanent only', 'Any', 'Permanent only', '100+ yr', 'Any'][i % 8],
  vintageReq: [2024, 2025, 2026, 2024, 2025, 2026, 2027, 2024][i % 8],
}));

const PRICE_HISTORY = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
  dac: Math.round(650 - i * 4 + sr(i * 17) * 40 - 20),
  beccs: Math.round(220 - i * 2 + sr(i * 23) * 20 - 10),
  biochar: Math.round(160 - i + sr(i * 31) * 15 - 7),
  ew: Math.round(195 - i * 1.5 + sr(i * 37) * 18 - 9),
}));

const PERMANENCE_SPECTRUM = [
  { tier: 'Tier 1: Permanent', duration: '>10,000 yr', examples: 'Geological DAC, BECCS w/ storage', price: '$300–$700', marketShare: 15 },
  { tier: 'Tier 2: High', duration: '1,000–10,000 yr', examples: 'EW (olivine/basalt), OAE', price: '$100–$300', marketShare: 20 },
  { tier: 'Tier 3: Medium', duration: '100–1,000 yr', examples: 'Biochar (>90% C stable fraction)', price: '$80–$200', marketShare: 45 },
  { tier: 'Tier 4: Low', duration: '<100 yr', examples: 'Kelp (no monitoring), soil carbon', price: '$20–$80', marketShare: 20 },
];

const TABS = ['Market Overview', 'Credit Types', 'Buyer Intelligence', 'Permanence Tiers', 'Price History', 'Registry Landscape'];

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

export default function CdrCreditMarketsPage() {
  const [tab, setTab] = useState(0);

  const totalCommitment = useMemo(() => Math.round(BUYERS.reduce((a, b) => a + b.commitment2030, 0) / 1000), []);
  const avgMaxPrice = useMemo(() => Math.round(BUYERS.reduce((a, b) => a + b.maxPrice, 0) / BUYERS.length), []);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ background: T.accent + '22', color: T.accent, border: `1px solid ${T.accent}44`, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>EP-EH5</span>
            <span style={{ fontSize: 12, color: T.sub }}>CDR Credit Markets & Permanence</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>CDR Credit Markets & Permanence Platform</h1>
          <p style={{ color: T.sub, marginTop: 4, fontSize: 14 }}>High-durability carbon removal credits: permanence tiers, buyer intelligence, registry landscape, and OTC price discovery</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <KpiCard label="CDR Credit Types" value={CREDIT_TYPES.length} sub="tracked by platform" color={T.accent} />
          <KpiCard label="Buyer Commitments" value={`${totalCommitment}k`} sub="ktCO₂ by 2030" color={T.cdr} />
          <KpiCard label="Avg Buyer Max Price" value={`$${avgMaxPrice}`} sub="per tCO₂" color={T.dac} />
          <KpiCard label="Permanent Credit Share" value="15%" sub="of 2024 market" color={T.biochar} />
          <KpiCard label="Market CAGR" value="~180%" sub="2024–2030 (CDR only)" color={T.green} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: tab === i ? T.accent : T.light, color: tab === i ? '#fff' : T.text, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>2024 vs 2030 Volume (MtCO₂)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={CREDIT_TYPES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="volume2024" fill={T.accent + '88'} name="2024 Volume (Mt)" />
                  <Bar dataKey="volume2030" fill={T.accent} name="2030 Volume (Mt)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Price Forecast 2024 → 2030 ($/tCO₂)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={CREDIT_TYPES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="price2024" fill={T.red + '88'} name="2024 Price" />
                  <Bar dataKey="price2030" fill={T.cdr} name="2030 Price (est.)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Market Share by Permanence Tier</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                {PERMANENCE_SPECTRUM.map(t => (
                  <div key={t.tier} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                    <div style={{ fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 6 }}>{t.tier}</div>
                    <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>{t.duration}</div>
                    <div style={{ background: T.light, borderRadius: 4, height: 10, marginBottom: 8 }}>
                      <div style={{ background: T.accent, borderRadius: 4, height: 10, width: `${t.marketShare}%` }} />
                    </div>
                    <div style={{ fontSize: 12, color: T.accent, fontWeight: 700 }}>{t.marketShare}% market share</div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{t.examples}</div>
                    <div style={{ fontSize: 12, color: T.cdr, marginTop: 4, fontWeight: 600 }}>{t.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: T.light }}>{['Credit Type','Permanence','2024 Price','2030 Price (est.)','2024 Vol (Mt)','2030 Vol (Mt)','Registry','Additionality'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
              <tbody>
                {CREDIT_TYPES.map((c, i) => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: T.accent }}>{c.name}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12 }}>{c.permanence}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: T.red }}>${c.price2024}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: T.cdr }}>${c.price2030}</td>
                    <td style={{ padding: '10px 12px' }}>{c.volume2024}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.volume2030}</td>
                    <td style={{ padding: '10px 12px', fontSize: 11 }}>{c.registry}</td>
                    <td style={{ padding: '10px 12px' }}><Pill label={c.additionality} color={c.additionality === 'Very High' ? T.cdr : c.additionality === 'High' ? T.dac : T.amber} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: T.light }}>{['#','Buyer','Sector','2030 Commit (kt)','Preferred Type','Max Price ($/t)','Permanence Req.','Vintage'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {BUYERS.map((b, i) => (
                    <tr key={b.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: T.accent }}>{b.id}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{b.buyer}</td>
                      <td style={{ padding: '8px 12px' }}>{b.sector}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: T.cdr }}>{b.commitment2030}k</td>
                      <td style={{ padding: '8px 12px', fontSize: 11 }}>{b.preferredType}</td>
                      <td style={{ padding: '8px 12px', color: T.dac, fontWeight: 600 }}>${b.maxPrice}</td>
                      <td style={{ padding: '8px 12px' }}>{b.permanenceReq}</td>
                      <td style={{ padding: '8px 12px' }}>{b.vintageReq}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Permanence Tiers — Price vs Duration</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={PERMANENCE_SPECTRUM}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="tier" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="marketShare" fill={T.accent} radius={[4, 4, 0, 0]} name="Market Share %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {PERMANENCE_SPECTRUM.map(tier => (
              <div key={tier.tier} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 14, marginBottom: 6 }}>{tier.tier}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                  <div><span style={{ color: T.sub }}>Duration: </span><span style={{ fontWeight: 600 }}>{tier.duration}</span></div>
                  <div><span style={{ color: T.sub }}>Market Share: </span><span style={{ fontWeight: 600, color: T.accent }}>{tier.marketShare}%</span></div>
                  <div><span style={{ color: T.sub }}>Price Range: </span><span style={{ fontWeight: 600, color: T.cdr }}>{tier.price}</span></div>
                </div>
                <div style={{ fontSize: 12, color: T.sub, marginTop: 8 }}>Examples: {tier.examples}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 4 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ color: T.text, marginTop: 0 }}>CDR OTC Credit Price History — 2024 ($/tCO₂)</h3>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={PRICE_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="dac" stroke={T.dac} strokeWidth={2.5} name="DAC-Geological" dot={false} />
                <Line type="monotone" dataKey="beccs" stroke={T.green} strokeWidth={2.5} name="BECCS" dot={false} />
                <Line type="monotone" dataKey="biochar" stroke={T.biochar} strokeWidth={2.5} name="Biochar" dot={false} />
                <Line type="monotone" dataKey="ew" stroke={T.cdr} strokeWidth={2.5} name="Enhanced Weathering" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { name: 'Puro.earth', type: 'CDR-Specialist', standards: 'Biochar, EW, BECCS, DAC', fee: '~8–12% levy', acceptance: 'High (frontier CDR)' },
              { name: 'VERRA VCS', type: 'General', standards: 'Biochar, BECCS, Soil', fee: '~2–5% levy', acceptance: 'Medium (CDR methodologies limited)' },
              { name: 'Gold Standard', type: 'General + SDG', standards: 'Biochar, BECCS, LandUse', fee: '~3–6%', acceptance: 'Medium' },
              { name: 'UNDO', type: 'EW-Specialist', standards: 'Basalt / EW only', fee: 'Project-specific', acceptance: 'High for EW' },
              { name: 'Eion', type: 'EW-Specialist', standards: 'Basalt / EW only', fee: 'Project-specific', acceptance: 'High for EW' },
              { name: 'EBC (European Biochar)', type: 'Biochar-Specialist', standards: 'Biochar only', fee: '~€30–50/t', acceptance: 'High (EU market)' },
              { name: 'CarbonBuilders', type: 'EW-Specialist', standards: 'Enhanced Weathering', fee: 'Undisclosed', acceptance: 'Emerging' },
              { name: 'DNV / TÜV', type: 'Verification Body', standards: 'Audit & verification only', fee: 'Project-based', acceptance: 'N/A (verifier)' },
              { name: 'ICVCM Core Carbon', type: 'Meta-Standard', standards: 'Quality assurance overlay', fee: 'None (endorsement)', acceptance: 'High (if endorsed)' },
            ].map(reg => (
              <div key={reg.name} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 8 }}>{reg.name}</div>
                <Pill label={reg.type} color={reg.type.includes('Specialist') ? T.cdr : reg.type === 'Meta-Standard' ? T.accent : T.dac} />
                <div style={{ marginTop: 10, fontSize: 12 }}>
                  <div style={{ color: T.sub, marginBottom: 4 }}>Standards: <span style={{ fontWeight: 600, color: T.text }}>{reg.standards}</span></div>
                  <div style={{ color: T.sub, marginBottom: 4 }}>Fee: <span style={{ fontWeight: 600, color: T.accent }}>{reg.fee}</span></div>
                  <div style={{ color: T.sub }}>Acceptance: <span style={{ fontWeight: 600, color: T.cdr }}>{reg.acceptance}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
