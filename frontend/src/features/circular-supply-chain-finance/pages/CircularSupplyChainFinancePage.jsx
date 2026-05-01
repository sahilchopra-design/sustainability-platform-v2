import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#0f172a', card: '#1e293b', border: '#334155', muted: '#94a3b8',
  text: '#f1f5f9', sub: '#cbd5e1', accent: '#06B6D4',
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

const CIRCULAR_LEVERS = [
  { lever: 'Reverse Logistics Networks', impact: 88, cost: 62, scalability: 72, description: 'Collect end-of-life products for remanufacture or recycling', examples: 'Caterpillar REMAN, Michelin retreads' },
  { lever: 'Industrial Symbiosis', impact: 76, cost: 45, scalability: 68, description: 'Waste from one process becomes feedstock for another', examples: 'Kalundborg, Rotterdam industrial cluster' },
  { lever: 'Product-as-a-Service', impact: 82, cost: 58, scalability: 80, description: 'Leasing retains OEM ownership, incentivises longevity', examples: 'Rolls-Royce Power-by-Hour, Philips light-as-service' },
  { lever: 'Remanufacturing & Refurbishment', impact: 71, cost: 52, scalability: 65, description: 'Restore products to original specification for resale', examples: 'Caterpillar, Apple Refurbished, Atlas Copco' },
  { lever: 'Material Passports (Digital)', impact: 65, cost: 70, scalability: 85, description: 'Track material composition for end-of-life recovery', examples: 'Madaster platform, EU DPP Regulation' },
  { lever: 'Circular Procurement Standards', impact: 68, cost: 35, scalability: 78, description: 'Buy-side requirements for recycled content and end-of-life', examples: 'Dutch government GPP, EU Green Deal procurement' },
];

const SUPPLY_CHAINS = Array.from({ length: 22 }, (_, i) => ({
  company: ['IKEA', 'H&M', 'Renault', 'Caterpillar', 'Philips', 'Apple', 'Samsung', 'ABInBev', 'Nestlé', 'Unilever',
    'Interface', 'Patagonia', 'Levi\'s', 'BMW', 'Volkswagen', 'Michelin', 'Schneider Electric', 'Siemens', 'DSM', 'Kingfisher',
    'REI', 'Steelcase'][i],
  sector: ['Retail', 'Apparel', 'Automotive', 'Industrials', 'Electronics', 'Electronics', 'Electronics', 'FMCG', 'FMCG', 'FMCG',
    'Flooring', 'Apparel', 'Apparel', 'Automotive', 'Automotive', 'Rubber', 'Electricals', 'Industrials', 'Chemicals', 'DIY Retail',
    'Outdoor', 'Office'][i],
  circularRevenuePct: Math.round(sr(i * 11) * 40 + 5),
  takeBactPct: Math.round(sr(i * 7) * 60 + 10),
  recycledInputPct: Math.round(sr(i * 13) * 55 + 8),
  circularScore: Math.round(sr(i * 9) * 40 + 45),
  scfUtilisation: Math.round(sr(i * 5) * 50 + 30),
  supplier3Tier: ['Yes', 'No', 'Partial'][Math.floor(sr(i * 3) * 3)],
}));

const FINANCE_INSTRUMENTS = [
  { instrument: 'Circular Supply Chain Finance (cSCF)', provider: 'ING / BNP Paribas', mechanism: 'Dynamic discounting linked to supplier circularity KPIs', maturity: 'Commercial', minSize: '$5M', rate: 'SOFR + 40–80bps' },
  { instrument: 'Circular Economy Bond', provider: 'EIB / ABN AMRO', mechanism: 'Green bond with CE use-of-proceeds (remanufacturing, RE)', maturity: 'Mature', minSize: '$100M', rate: 'Green premium –5–15bps' },
  { instrument: 'Impact-Linked Loan (CE)', provider: 'Rabobank / Crédit Agricole', mechanism: 'KPI: recycled content %, take-back rate, Circular Score', maturity: 'Growing', minSize: '$20M', rate: 'SOFR + 60bps ± 20bps KPI' },
  { instrument: 'Reverse Factoring (Circular)', provider: 'Taulia / C2FO', mechanism: 'Early payment for certified circular suppliers (GRS/ISCC+)', maturity: 'Pilot', minSize: '$1M', rate: 'Discount rate –10bps circular' },
  { instrument: 'Remanufacturing Warehouse Finance', provider: 'Asset-based lenders', mechanism: 'Inventory finance against certified reman stock', maturity: 'Commercial', minSize: '$2M', rate: 'ABL + 150–250bps' },
  { instrument: 'Circular Leasing / Equipment Finance', provider: 'DLL / Siemens Financial', mechanism: 'Full-service lease retaining OEM ownership (PaaS model)', maturity: 'Mature', minSize: '$100K', rate: 'Operating lease structure' },
];

const CE_RADAR_DATA = CIRCULAR_LEVERS.map(l => ({
  lever: l.lever.split(' ')[0],
  impact: l.impact,
  cost: l.cost,
  scalability: l.scalability,
}));

const VALUE_LEAKAGE = [
  { stage: 'Design', leakagePct: 8, capturedPct: 92, opportunity: '$12Bn' },
  { stage: 'Procurement', leakagePct: 18, capturedPct: 82, opportunity: '$34Bn' },
  { stage: 'Manufacturing', leakagePct: 22, capturedPct: 78, opportunity: '$48Bn' },
  { stage: 'Distribution', leakagePct: 14, capturedPct: 86, opportunity: '$22Bn' },
  { stage: 'Use Phase', leakagePct: 31, capturedPct: 69, opportunity: '$78Bn' },
  { stage: 'End of Life', leakagePct: 42, capturedPct: 58, opportunity: '$95Bn' },
];

const MATURITY_DATA = [
  { year: '2020', pilot: 12, scaling: 5, mainstream: 2 },
  { year: '2021', pilot: 18, scaling: 8, mainstream: 3 },
  { year: '2022', pilot: 28, scaling: 14, mainstream: 6 },
  { year: '2023', pilot: 42, scaling: 22, mainstream: 12 },
  { year: '2024', pilot: 58, scaling: 34, mainstream: 20 },
  { year: '2025E', pilot: 72, scaling: 48, mainstream: 32 },
  { year: '2026E', pilot: 85, scaling: 62, mainstream: 48 },
];

const TABS = ['Overview', 'Circular Levers', 'Company Scorecard', 'Finance Instruments', 'Value Leakage', 'Market Maturity'];

export default function CircularSupplyChainFinancePage() {
  const [tab, setTab] = useState(0);
  const [sortField, setSortField] = useState('circularScore');
  const [sectorFilter, setSectorFilter] = useState('All');

  const sectors = ['All', ...new Set(SUPPLY_CHAINS.map(s => s.sector))];
  const filteredChains = sectorFilter === 'All' ? SUPPLY_CHAINS : SUPPLY_CHAINS.filter(s => s.sector === sectorFilter);
  const sortedChains = useMemo(() => [...filteredChains].sort((a, b) => b[sortField] - a[sortField]), [filteredChains, sortField]);

  const avgCircularScore = SUPPLY_CHAINS.reduce((a, b) => a + b.circularScore, 0) / SUPPLY_CHAINS.length;
  const avgRecycledInput = SUPPLY_CHAINS.reduce((a, b) => a + b.recycledInputPct, 0) / SUPPLY_CHAINS.length;

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: 'Inter,sans-serif', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ background: T.accent + '22', border: `1px solid ${T.accent}`, borderRadius: 8, padding: '4px 12px', fontSize: 11, color: T.accent, fontWeight: 700 }}>EP-EJ6</div>
          <Pill label="Circular Supply Chain" color={T.accent} />
          <Pill label="Industrial Symbiosis" color={T.teal} />
          <Pill label="Reverse Logistics Finance" color={T.green} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Circular Supply Chain Finance</h1>
        <p style={{ color: T.muted, marginTop: 6, fontSize: 14 }}>Supply chain circularity analytics, reverse logistics financing, industrial symbiosis mapping, and financial instruments linking capital cost to circular economy performance.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Global CE Market Value" value="$4.5Tn" sub="Value at stake by 2030" color={T.accent} />
        <KpiCard label="Avg Circular Score" value={`${avgCircularScore.toFixed(0)}/100`} sub="22 companies tracked" color={T.green} />
        <KpiCard label="Avg Recycled Input" value={`${avgRecycledInput.toFixed(0)}%`} sub="Company universe" color={T.teal} />
        <KpiCard label="cSCF Market Size" value="$180Bn" sub="Circular supply chain finance 2024" color={T.amber} />
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
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Value Leakage by Supply Chain Stage</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={VALUE_LEAKAGE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="stage" stroke={T.muted} tick={{ fontSize: 10 }} />
                  <YAxis stroke={T.muted} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="leakagePct" name="Value Leakage %" fill={T.red} stackId="a" />
                  <Bar dataKey="capturedPct" name="Value Captured %" fill={T.green} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Circular Finance Market Maturity (# programmes)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={MATURITY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" stroke={T.muted} tick={{ fontSize: 11 }} />
                  <YAxis stroke={T.muted} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Legend />
                  <Area type="monotone" dataKey="pilot" name="Pilot" stroke={T.amber} fill={T.amber + '22'} stackId="1" />
                  <Area type="monotone" dataKey="scaling" name="Scaling" stroke={T.accent} fill={T.accent + '22'} stackId="2" />
                  <Area type="monotone" dataKey="mainstream" name="Mainstream" stroke={T.green} fill={T.green + '22'} stackId="3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Circular Lever Assessment</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={CE_RADAR_DATA}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="lever" tick={{ fill: T.muted, fontSize: 10 }} />
                  <Radar name="Impact" dataKey="impact" stroke={T.accent} fill={T.accent + '33'} />
                  <Radar name="Cost Efficiency" dataKey="cost" stroke={T.green} fill={T.green + '22'} />
                  <Radar name="Scalability" dataKey="scalability" stroke={T.amber} fill={T.amber + '22'} />
                  <Legend />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CIRCULAR_LEVERS.map(l => (
                <div key={l.lever} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{l.lever}</div>
                  <div style={{ color: T.sub, fontSize: 11, marginBottom: 6 }}>{l.description}</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <Pill label={`Impact ${l.impact}`} color={T.accent} />
                    <Pill label={`Scale ${l.scalability}`} color={T.green} />
                  </div>
                  <div style={{ color: T.muted, fontSize: 11 }}>{l.examples}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['All', 'Automotive', 'FMCG', 'Electronics', 'Apparel'].map(s => (
                <button key={s} onClick={() => setSectorFilter(s)} style={{ background: sectorFilter === s ? T.accent : T.card, color: sectorFilter === s ? '#fff' : T.sub, border: `1px solid ${sectorFilter === s ? T.accent : T.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{s}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['circularScore', 'CE Score'], ['recycledInputPct', 'Recycled Input'], ['takeBactPct', 'Take-Back'], ['circularRevenuePct', 'Circular Rev']].map(([f, l]) => (
                <button key={f} onClick={() => setSortField(f)} style={{ background: sortField === f ? T.teal : T.card, color: sortField === f ? '#fff' : T.sub, border: `1px solid ${sortField === f ? T.teal : T.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Company', 'Sector', 'CE Score', 'Circular Revenue %', 'Take-Back %', 'Recycled Input %', 'cSCF Utilisation %', '3-Tier Visibility'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedChains.map((c, i) => (
                    <tr key={c.company} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 === 0 ? T.bg + '55' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.company}</td>
                      <td style={{ padding: '10px 12px' }}><Pill label={c.sector} color={T.indigo} /></td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 50, height: 6, background: T.border, borderRadius: 3 }}>
                            <div style={{ width: `${c.circularScore}%`, height: '100%', background: c.circularScore > 70 ? T.green : c.circularScore > 55 ? T.amber : T.red, borderRadius: 3 }} />
                          </div>
                          <span>{c.circularScore}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', color: T.accent }}>{c.circularRevenuePct}%</td>
                      <td style={{ padding: '10px 12px' }}>{c.takeBactPct}%</td>
                      <td style={{ padding: '10px 12px', color: c.recycledInputPct >= 30 ? T.green : T.amber }}>{c.recycledInputPct}%</td>
                      <td style={{ padding: '10px 12px' }}>{c.scfUtilisation}%</td>
                      <td style={{ padding: '10px 12px' }}><Pill label={c.supplier3Tier} color={c.supplier3Tier === 'Yes' ? T.green : c.supplier3Tier === 'Partial' ? T.amber : T.red} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Circular Finance Instrument Landscape</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FINANCE_INSTRUMENTS.map(f => (
              <div key={f.instrument} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{f.instrument}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Pill label={f.maturity} color={f.maturity === 'Mature' ? T.green : f.maturity === 'Commercial' ? T.accent : f.maturity === 'Growing' ? T.teal : T.amber} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
                  <div style={{ color: T.sub, fontSize: 12 }}>{f.mechanism}</div>
                  <div>
                    <div style={{ color: T.muted, fontSize: 11 }}>Min Size</div>
                    <div style={{ color: T.amber, fontWeight: 700, fontSize: 13 }}>{f.minSize}</div>
                  </div>
                  <div>
                    <div style={{ color: T.muted, fontSize: 11 }}>Pricing</div>
                    <div style={{ color: T.green, fontWeight: 700, fontSize: 12 }}>{f.rate}</div>
                  </div>
                </div>
                <div style={{ color: T.muted, fontSize: 11, marginTop: 8 }}>Providers: {f.provider}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Value Leakage Opportunity by Supply Chain Stage</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={VALUE_LEAKAGE}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="stage" stroke={T.muted} tick={{ fontSize: 11 }} />
                <YAxis stroke={T.muted} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} formatter={(v, n) => [`${v}%`, n]} />
                <Bar dataKey="leakagePct" name="Leakage %" fill={T.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {VALUE_LEAKAGE.map(v => (
              <div key={v.stage} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ color: T.accent, fontWeight: 700, marginBottom: 4 }}>{v.stage}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.red }}>{v.leakagePct}%</div>
                <div style={{ color: T.sub, fontSize: 11, marginTop: 4 }}>Value leakage</div>
                <div style={{ color: T.green, fontSize: 18, fontWeight: 700, marginTop: 8 }}>{v.opportunity}</div>
                <div style={{ color: T.muted, fontSize: 11 }}>Opportunity at stake</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            { title: 'Circular Economy Standards & Frameworks', items: ['Ellen MacArthur Foundation CE100 — 100 corporate CE practitioners network', 'ISO 59000 series (2024) — Circular Economy standards family', 'BS 8001:2017 — BSI Framework for CE implementation in organisations', 'EU Circular Economy Action Plan — 35 legislative measures 2020–2025', 'Science Based Targets for Nature (SBTiN) — material footprint targets', 'GRI 306 Waste Disclosure — mandatory for CSRD reporters from 2024'] },
            { title: 'KPIs for Circular SCF Instruments', items: ['Recycled/renewable input material % (by weight, by spend)', 'Take-back and return rate % of products sold', 'Product lifetime extension (avg years of use vs. design life)', 'Remanufactured/refurbished product revenue as % of total', 'Supplier CE certification rate (GRS, ISCC+, Cradle to Cradle)', 'Waste sent to landfill % (vs. circular recovery)', 'Digital Product Passport coverage % across SKU base'] },
            { title: 'Blended Finance for EM Circular Transition', items: ['IFC Circular Economy Programme — $200M EM waste infrastructure fund', 'EBRD Green Economy Transition (GET) — circular economy earmarked tranche', 'ADB Circular Economy Finance — Southeast Asia focus', 'AIIB Sustainable Cities — circular waste + WtE co-financing', 'UN Environment IETC — technical assistance for EM extended producer responsibility', 'Guarantees for first-loss on EM circular economy project debt'] },
            { title: 'Technology Enablers', items: ['AI-powered design for disassembly tools (Autodesk, Siemens NX)', 'Blockchain provenance tracking for secondary materials (Circularise, TextileGenesis)', 'Reverse logistics platforms: Loop Industries, TeraCycle supply chain', 'Digital twin for product lifecycle management (PTC ThingWorx)', 'Chemical fingerprinting for recycled content verification (HolyGrail 2.0)', 'Automated disassembly robotics for EV batteries (AMBS, Li-Cycle)'] },
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
