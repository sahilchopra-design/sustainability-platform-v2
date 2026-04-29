import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#F7F6F2', card: '#FFFFFF', border: '#E5E2D9',
  text: '#1A1A2E', sub: '#6B7280', accent: '#B8860B',
  green: '#065F46', red: '#991B1B', blue: '#1E40AF',
  teal: '#0F766E', amber: '#92400E', navy: '#0F172A',
  indigo: '#4F46E5', gold: '#C59A1E', sage: '#4A7C59',
  font: "'DM Sans',system-ui,sans-serif"
};

const POLICIES = [
  { scheme: 'IRA §45V (USA)', region: 'USA', type: 'PTC', valueUsdPerT: 180, eligibilityCriteria: '<0.45 kgCO2e/kg H2 (tier 4)', durationYrs: 10, maxVolumeGt: 50, stackableWithOthers: true, note: '$3/kg H2 = ~$18/t NH3 H2-equiv; full credit tier 4 requires nuclear/EAF' },
  { scheme: 'EU H2Global', region: 'EU', type: 'H2Global', valueUsdPerT: 220, eligibilityCriteria: 'Renewable H2 + RFNBO criteria', durationYrs: 10, maxVolumeGt: 2.5, stackableWithOthers: false, note: '€900M first tranche; double-auction mechanism; Germany buyer of last resort' },
  { scheme: 'EU CBAM (Fertiliser)', region: 'EU', type: 'CBAM', valueUsdPerT: 78, eligibilityCriteria: 'Non-ETS-covered fertiliser imports', durationYrs: 0, maxVolumeGt: 100, stackableWithOthers: true, note: 'Phased 2026-2034; ~€65-80/t NH3 at €60/tCO2 EU ETS price' },
  { scheme: 'UK CfD H2 Business Model', region: 'UK', type: 'CfD', valueUsdPerT: 155, eligibilityCriteria: 'UK-certified green H2 >2MW', durationYrs: 15, maxVolumeGt: 5, stackableWithOthers: false, note: 'Strike price vs reference; IETF revenue support mechanism' },
  { scheme: 'Japan GIF NH3', region: 'Japan', type: 'subsidy', valueUsdPerT: 130, eligibilityCriteria: 'NH3 co-firing utility supply contracts', durationYrs: 10, maxVolumeGt: 15, stackableWithOthers: true, note: '¥2 trillion Green Innovation Fund; NEDO project grants + price gap fill' },
  { scheme: 'South Korea CCF', region: 'South Korea', type: 'subsidy', valueUsdPerT: 110, eligibilityCriteria: 'NH3 power co-firing >20%', durationYrs: 8, maxVolumeGt: 8, stackableWithOthers: true, note: 'Korea Clean Fuel Program; 2030 target 1.5 Mt/yr NH3 imports' },
  { scheme: 'Australia Hydrogen Headstart', region: 'Australia', type: 'PTC', valueUsdPerT: 95, eligibilityCriteria: '<0.6 kgCO2e/kg H2 (CertifHy-equiv)', durationYrs: 7, maxVolumeGt: 3, stackableWithOthers: true, note: 'A$2bn Headstart; ~$2/kg H2 production credit; export-eligible' },
  { scheme: 'EU ETS (shipping)', region: 'EU', type: 'ETS', valueUsdPerT: 95, eligibilityCriteria: 'Vessels >5000 GT EU waters', durationYrs: 0, maxVolumeGt: 200, stackableWithOthers: true, note: 'FuelEU 2% bio/synthetic mandate 2025; NH3 = zero GHG under IPCC LCA' },
  { scheme: 'India NGHM VGF', region: 'India', type: 'subsidy', valueUsdPerT: 75, eligibilityCriteria: 'Green H2 <₹50/kg by 2030 target', durationYrs: 5, maxVolumeGt: 10, stackableWithOthers: true, note: '₹19,744 Cr; viability gap funding for early projects; electrolyser target 5GW' },
  { scheme: 'Germany H2 Import', region: 'Germany', type: 'H2Global', valueUsdPerT: 200, eligibilityCriteria: 'RFNBO certified, traceable', durationYrs: 10, maxVolumeGt: 5, stackableWithOthers: false, note: 'Part of EU H2Global instrument; Namibia/Chile key corridors' },
  { scheme: 'Netherlands SDE+', region: 'Netherlands', type: 'subsidy', valueUsdPerT: 120, eligibilityCriteria: 'Electrolyser >1MW, Dutch grid', durationYrs: 12, maxVolumeGt: 2, stackableWithOthers: false, note: 'SDE++ renewable energy production incentive; NH3/H2 plant eligible' },
  { scheme: 'EU RED III (RFNBO)', region: 'EU', type: 'subsidy', valueUsdPerT: 60, eligibilityCriteria: '70% GHG saving vs. fossil ref.', durationYrs: 0, maxVolumeGt: 500, stackableWithOthers: true, note: 'RFNBO mandate 42% of H2 in industry by 2030; NH3 = hydrogen carrier' },
  { scheme: 'Chile CORFO Export', region: 'Chile', type: 'subsidy', valueUsdPerT: 85, eligibilityCriteria: 'Export NH3 from designated zones', durationYrs: 10, maxVolumeGt: 8, stackableWithOthers: true, note: 'CORFO H2 roadmap $25bn; Antofagasta free-trade zone tax benefits' },
  { scheme: 'Morocco AMDIE', region: 'Morocco', type: 'subsidy', valueUsdPerT: 70, eligibilityCriteria: 'OCP-linked or designated export', durationYrs: 8, maxVolumeGt: 6, stackableWithOthers: true, note: 'Moroccan Investment Authority H2 incentive framework; Tanger Med hub' },
  { scheme: 'IMO FuelEU Offset', region: 'International', type: 'ETS', valueUsdPerT: 88, eligibilityCriteria: 'IMO Tier III certified vessels', durationYrs: 0, maxVolumeGt: 300, stackableWithOthers: true, note: 'Zero-emission shipping credit; NH3 qualifies under CII calculation' },
];

const TYPE_COLORS = {
  PTC: T.green,
  H2Global: T.blue,
  CBAM: T.red,
  CfD: T.indigo,
  subsidy: T.amber,
  ETS: T.teal,
};

const TABS = ['Policy Landscape', 'H2Global Mechanism', 'IRA §45V Value', 'CBAM Fertiliser Impact', 'Carbon Credit Revenue', 'Policy Stack Optimizer'];

const KpiCard = ({ label, value, unit, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {unit && <div style={{ fontSize: 11, color: T.sub }}>{unit}</div>}
  </div>
);

export default function GreenAmmoniaPolicyCreditPage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [volumeMt, setVolumeMt] = useState(1.0);
  const [iraH2Tier, setIraH2Tier] = useState(4);
  const [etsPriceEur, setEtsPriceEur] = useState(65);

  const types = ['All', 'PTC', 'H2Global', 'CBAM', 'CfD', 'subsidy', 'ETS'];
  const filtered = useMemo(() => typeFilter === 'All' ? POLICIES : POLICIES.filter(p => p.type === typeFilter), [typeFilter]);

  const maxValue = useMemo(() => filtered.length ? Math.max(...filtered.map(p => p.valueUsdPerT)) : 0, [filtered]);
  const avgValue = useMemo(() => filtered.length ? filtered.reduce((a, b) => a + b.valueUsdPerT, 0) / filtered.length : 0, [filtered]);

  // IRA §45V value by tier
  const iraTiers = [
    { tier: 1, threshold: '<4 kgCO2e/kg H2', credit_kg: 0.60, note: 'Reforming with ~50% CCS', creditPerTNH3: Math.round(0.60 * 1000 / 5.5) },
    { tier: 2, threshold: '<2.5 kgCO2e/kg H2', credit_kg: 0.75, note: 'Blue H2 high-capture', creditPerTNH3: Math.round(0.75 * 1000 / 5.5) },
    { tier: 3, threshold: '<1.5 kgCO2e/kg H2', credit_kg: 1.00, note: 'Nuclear / geothermal H2', creditPerTNH3: Math.round(1.00 * 1000 / 5.5) },
    { tier: 4, threshold: '<0.45 kgCO2e/kg H2', credit_kg: 3.00, note: 'Full green (wind/solar)', creditPerTNH3: Math.round(3.00 * 1000 / 5.5) },
  ];

  // CBAM impact by EU ETS price
  const cbamData = useMemo(() =>
    [30, 40, 50, 60, 70, 80, 90, 100, 120].map((ets, i) => ({
      ets,
      cbamFertiliser: Math.round(ets * 1.8 * 0.82), // ~1.8 tCO2/t grey NH3
      cbamUrea: Math.round(ets * 2.1 * 0.82),
      advantage: Math.round(ets * 1.8 * 0.82 * 0.9),
    })),
    []);

  // Carbon credit revenue calculator
  const carbonRevenueData = useMemo(() =>
    [200, 300, 400, 500, 600, 700, 800, 1000].map((lcoa, i) => ({
      lcoa,
      creditRevenue45V: Math.round(iraH2Tier === 4 ? 545 : iraH2Tier === 3 ? 182 : iraH2Tier === 2 ? 136 : 109),
      netCost: Math.max(0, lcoa - (iraH2Tier === 4 ? 545 : iraH2Tier === 3 ? 182 : 136)),
      greyNH3: 275,
    })),
    [iraH2Tier]);

  // Policy stack for a hypothetical project
  const stackData = useMemo(() => {
    const ira45v = iraH2Tier === 4 ? 545 : iraH2Tier === 3 ? 182 : 136;
    const cbamVal = Math.round(etsPriceEur * 1.8 * 0.82);
    return [
      { scheme: 'IRA §45V', value: ira45v, stackable: true },
      { scheme: 'EU H2Global', value: 220, stackable: false },
      { scheme: 'CBAM premium', value: cbamVal, stackable: true },
      { scheme: 'Australia Headstart', value: 95, stackable: true },
      { scheme: 'Japan GIF', value: 130, stackable: true },
    ];
  }, [iraH2Tier, etsPriceEur]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ background: T.blue, color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>EP-EE5</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Green Ammonia Policy, Subsidies & Carbon Credits</h1>
        </div>
        <p style={{ color: T.sub, fontSize: 13, margin: 0 }}>15 policy instruments across 10 regions · IRA §45V, EU H2Global, CBAM, CfD · Source: EU Reg. 2023/956, IRS §45V, H2Global GmbH, IRENA</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 12, color: T.sub, marginRight: 6 }}>Instrument Type</label>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 13, background: T.card }}>
            {types.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: T.sub, marginRight: 6 }}>IRA §45V Tier</label>
          <select value={iraH2Tier} onChange={e => setIraH2Tier(+e.target.value)}
            style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 13, background: T.card }}>
            {[1, 2, 3, 4].map(t => <option key={t} value={t}>Tier {t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: T.sub, marginRight: 6 }}>EU ETS Price (€/tCO2)</label>
          <input type="range" min={30} max={150} step={5} value={etsPriceEur}
            onChange={e => setEtsPriceEur(+e.target.value)}
            style={{ verticalAlign: 'middle', marginRight: 6 }} />
          <span style={{ fontSize: 12 }}>€{etsPriceEur}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Max Instrument Value" value={`$${maxValue}`} unit="USD/t NH3" color={T.green} />
        <KpiCard label="Avg Policy Value" value={`$${Math.round(avgValue)}`} unit="USD/t NH3" color={T.blue} />
        <KpiCard label="IRA §45V (Tier 4)" value="$545/t" unit="NH3 equiv. benefit" color={T.indigo} />
        <KpiCard label="CBAM Est." value={`$${Math.round(etsPriceEur * 1.8 * 0.82)}`} unit={`at €${etsPriceEur}/tCO2`} color={T.red} />
        <KpiCard label="EU H2Global Budget" value="€900M" unit="first tranche" color={T.teal} />
        <KpiCard label="Schemes (filtered)" value={filtered.length} unit="of 15" />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === i ? 700 : 400, background: tab === i ? T.blue : T.card, color: tab === i ? '#fff' : T.text }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab 0: Policy Landscape */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Policy Value by Scheme (USD/t NH3)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filtered].sort((a, b) => b.valueUsdPerT - a.valueUsdPerT)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} unit="$/t" />
                <YAxis dataKey="scheme" type="category" tick={{ fontSize: 9 }} width={150} />
                <Tooltip formatter={v => [`$${v}/t`, 'Value']} />
                <Bar dataKey="valueUsdPerT" name="USD/t NH3">
                  {filtered.map((p, i) => <Cell key={i} fill={TYPE_COLORS[p.type] || T.sub} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Value Distribution by Instrument Type</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={Object.entries(POLICIES.reduce((acc, p) => {
                if (!acc[p.type]) acc[p.type] = { type: p.type, maxVal: 0, count: 0 };
                acc[p.type].maxVal = Math.max(acc[p.type].maxVal, p.valueUsdPerT);
                acc[p.type].count += 1;
                return acc;
              }, {})).map(([, v]) => v)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                <Tooltip />
                <Bar dataKey="maxVal" name="Max value $/t">
                  {Object.keys(TYPE_COLORS).map((t, i) => <Cell key={i} fill={TYPE_COLORS[t]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: T.text, marginTop: 16, marginBottom: 8 }}>Policy Legend</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: color }} />
                  <span>{type}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Policy Directory</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Scheme', 'Region', 'Type', 'Value $/t', 'Duration', 'Stackable', 'Eligibility'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filtered].sort((a, b) => b.valueUsdPerT - a.valueUsdPerT).map((p, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600, color: T.text }}>{p.scheme}</td>
                      <td style={{ padding: '7px 10px', color: T.sub }}>{p.region}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <span style={{ background: '#F0F9F4', color: TYPE_COLORS[p.type] || T.sub, borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 700 }}>{p.type}</span>
                      </td>
                      <td style={{ padding: '7px 10px', fontWeight: 700, color: T.green }}>${p.valueUsdPerT}</td>
                      <td style={{ padding: '7px 10px' }}>{p.durationYrs ? `${p.durationYrs}yr` : 'Ongoing'}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <span style={{ color: p.stackableWithOthers ? T.green : T.red }}>{p.stackableWithOthers ? '✓ Yes' : '✗ No'}</span>
                      </td>
                      <td style={{ padding: '7px 10px', color: T.sub, fontSize: 11 }}>{p.eligibilityCriteria}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: H2Global */}
      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>H2Global Double-Auction Mechanism</h3>
            <div style={{ background: '#EFF6FF', borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 13 }}>
              <div style={{ fontWeight: 700, color: T.blue, marginBottom: 6 }}>How H2Global Works</div>
              <ol style={{ paddingLeft: 18, margin: 0, lineHeight: 1.7, color: T.text, fontSize: 12 }}>
                <li>HINT GmbH (German SPV) acts as intermediary</li>
                <li><b>Buy-side auction:</b> purchases green H2/NH3/MeOH from producers at lowest price (10-year HPA contracts)</li>
                <li><b>Sell-side auction:</b> sells to European buyers at market price (5-year forward)</li>
                <li>German government pays subsidy gap between buy and sell price</li>
                <li>€900M first tranche (2022); scale-up to €4bn proposed</li>
              </ol>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { k: 'Budget (1st tranche)', v: '€900M' },
                { k: 'Contract duration', v: '10yr HPA (buy)' },
                { k: 'First tenders', v: 'NH3, MeOH, H2' },
                { k: 'Key corridors', v: 'Chile, Namibia, Oman' },
                { k: 'Typical gap fill', v: '€150-300/MWh H2' },
                { k: 'Status (2025)', v: 'First contracts awarded' },
              ].map(({ k, v }) => (
                <div key={k} style={{ background: T.bg, borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontSize: 11, color: T.sub }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>H2Global Subsidy Gap Over Time ($/t NH3)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={[2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033].map((yr, i) => ({
                yr,
                lcoa: Math.round(580 - i * 20 + sr(i * 7) * 30),
                marketPrice: Math.round(320 + i * 8 + sr(i * 11) * 15),
                gap: Math.max(0, Math.round(580 - i * 20 + sr(i * 7) * 30) - Math.round(320 + i * 8 + sr(i * 11) * 15)),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="yr" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="lcoa" stroke={T.red} fill="#FEE2E2" name="Producer LCOA" />
                <Area type="monotone" dataKey="marketPrice" stroke={T.green} fill="#D1FAE5" name="Market price" />
                <Area type="monotone" dataKey="gap" stroke={T.blue} fill="#DBEAFE" name="H2Global gap fill" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: IRA §45V */}
      {tab === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>IRA §45V Credit by Tier</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={iraTiers}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tier" tickFormatter={v => `Tier ${v}`} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="$/t NH3" />
                <Tooltip formatter={v => [`$${v}/t NH3`, 'Credit value']} />
                <Bar dataKey="creditPerTNH3" name="Credit $/t NH3">
                  {iraTiers.map((t, i) => <Cell key={i} fill={i === 3 ? T.green : i === 2 ? T.teal : i === 1 ? T.amber : T.sub} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12 }}>
              {iraTiers.map((t, i) => (
                <div key={i} style={{ background: iraH2Tier === t.tier ? '#F0FDF4' : T.bg, borderRadius: 8, padding: 10, marginBottom: 6, border: iraH2Tier === t.tier ? `2px solid ${T.green}` : '1px solid transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: T.text, fontSize: 12 }}>Tier {t.tier}: {t.threshold}</span>
                    <span style={{ fontWeight: 700, color: T.green }}>${t.credit_kg}/kg H2</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.sub }}>{t.note} · NH3 equiv: <b>${t.creditPerTNH3}/t</b></div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Net Green NH3 Cost After §45V (Tier {iraH2Tier})</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={carbonRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="lcoa" unit="$/t" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                <Tooltip />
                <Legend />
                <Line dataKey="lcoa" stroke={T.amber} strokeWidth={2} name="LCOA (gross)" dot={false} />
                <Line dataKey="netCost" stroke={T.green} strokeWidth={2} name="Net after §45V" dot={false} />
                <Line dataKey="greyNH3" stroke={T.sub} strokeDasharray="5 5" strokeWidth={2} name="Grey NH3 ref." dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3: CBAM Fertiliser */}
      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>CBAM Fertiliser Levy vs. EU ETS Price (USD/t NH3 equivalent)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={cbamData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="ets" unit=" €/t" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                <Tooltip />
                <Legend />
                <Line dataKey="cbamFertiliser" stroke={T.red} strokeWidth={2} name="CBAM on NH3 ($/t)" />
                <Line dataKey="cbamUrea" stroke={T.amber} strokeWidth={2} name="CBAM on Urea ($/t)" />
                <Line dataKey="advantage" stroke={T.green} strokeWidth={2} name="Green NH3 price advantage" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>CBAM: NH3 Carbon Intensity Reference</h3>
            {[
              { product: 'Grey NH3 (SMR)', intensity: '1.6-2.0 tCO2/t', cbamEst: `$${Math.round(etsPriceEur * 1.8 * 0.82)}/t`, exempt: false },
              { product: 'Blue NH3 (SMR+CCS)', intensity: '0.3-0.8 tCO2/t', cbamEst: `$${Math.round(etsPriceEur * 0.55 * 0.82)}/t`, exempt: false },
              { product: 'Green NH3 (electrolysis)', intensity: '<0.1 tCO2/t', cbamEst: `$${Math.round(etsPriceEur * 0.08 * 0.82)}/t`, exempt: true },
              { product: 'Urea (from grey NH3)', intensity: '1.8-2.2 tCO2/t', cbamEst: `$${Math.round(etsPriceEur * 2.1 * 0.82)}/t`, exempt: false },
              { product: 'AN/CAN (from green)', intensity: '<0.1 tCO2/t', cbamEst: 'Near-zero', exempt: true },
            ].map((p, i) => (
              <div key={i} style={{ background: p.exempt ? '#F0FDF4' : T.bg, borderRadius: 8, padding: 10, marginBottom: 7, border: p.exempt ? `1px solid ${T.green}` : '1px solid transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{p.product}</span>
                  <span style={{ fontWeight: 700, color: p.exempt ? T.green : T.red, fontSize: 12 }}>{p.cbamEst}</span>
                </div>
                <div style={{ fontSize: 11, color: T.sub }}>Intensity: {p.intensity} · {p.exempt ? 'Exempt/minimal CBAM' : 'CBAM applicable'}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>CBAM Timeline</h3>
            {[
              { phase: 'Transitional Phase', period: 'Oct 2023 – Dec 2025', action: 'Reporting only; no financial obligation' },
              { phase: 'Phase 1', period: '2026', action: '25% of CBAM levy payable on imported embedded carbon' },
              { phase: 'Phase 2', period: '2027', action: '50% of levy' },
              { phase: 'Phase 3', period: '2028', action: '75% of levy' },
              { phase: 'Full Implementation', period: '2034', action: 'Free EU ETS allowances fully phased out; 100% CBAM' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, borderBottom: `1px solid ${T.border}`, padding: '8px 0', fontSize: 12 }}>
                <div style={{ minWidth: 120, color: T.sub }}>{p.period}</div>
                <div>
                  <div style={{ fontWeight: 600, color: T.text }}>{p.phase}</div>
                  <div style={{ color: T.sub, fontSize: 11 }}>{p.action}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Carbon Credit Revenue */}
      {tab === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Annual Carbon Credit Revenue by EU ETS Price (1 Mt/yr green NH3 project)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[30, 40, 50, 60, 70, 80, 100, 120, 150].map((ets, i) => ({
                ets,
                cbamRevenue: Math.round(1e6 * ets * 1.8 * 0.82 / 1000) / 1000,
                etsCredit: Math.round(1e6 * ets * 1.75 / 1000) / 1000,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="ets" unit=" €/t" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" $M" />
                <Tooltip formatter={v => [`$${v}M`, '']} />
                <Legend />
                <Bar dataKey="cbamRevenue" fill={T.red} name="CBAM avoided cost ($M, 1 Mt NH3)" />
                <Bar dataKey="etsCredit" fill={T.green} name="ETS credit value ($M, 1 Mt NH3)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Green NH3 GHG Abatement Value</h3>
            {[
              { context: 'Replace grey NH3 fertiliser (EU)', abatement: '1.75 tCO2/t NH3', valueAt60: `$${Math.round(60 * 1.75 * 1.08)}/t` },
              { context: 'Replace VLSFO marine fuel', abatement: '~2.8 tCO2e/t NH3', valueAt60: `$${Math.round(60 * 2.8 * 1.08)}/t` },
              { context: 'Replace coal in power (Japan)', abatement: '~1.5 tCO2/t NH3', valueAt60: `$${Math.round(60 * 1.5 * 1.08)}/t` },
              { context: 'H2 carrier (German industry)', abatement: '~2.2 tCO2/t NH3', valueAt60: `$${Math.round(60 * 2.2 * 1.08)}/t` },
            ].map((p, i) => (
              <div key={i} style={{ background: T.bg, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 12 }}>{p.context}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12 }}>
                  <span style={{ color: T.sub }}>{p.abatement}</span>
                  <span style={{ fontWeight: 700, color: T.green }}>{p.valueAt60} @ €60/tCO2</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Voluntary Carbon Market (VCM) Premiums</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { standard: 'Gold Standard', premium: 18, volume: 'Low' },
                { standard: 'Verra VCS', premium: 12, volume: 'High' },
                { standard: 'ACR (US)', premium: 15, volume: 'Medium' },
                { standard: 'PURO.earth', premium: 22, volume: 'Medium' },
                { standard: 'I-REC (renewable)', premium: 8, volume: 'Very high' },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="standard" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11 }} unit="$/tCO2" />
                <Tooltip />
                <Bar dataKey="premium" fill={T.teal} name="VCM premium $/tCO2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 5: Policy Stack Optimizer */}
      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Policy Stack Value (USD/t NH3, selected instruments)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stackData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scheme" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                <Tooltip />
                <Bar dataKey="value" name="Value $/t">
                  {stackData.map((s, i) => <Cell key={i} fill={s.stackable ? T.green : T.blue} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 8 }}>
              <span style={{ color: T.green }}>■</span> Stackable with others &nbsp;
              <span style={{ color: T.blue }}>■</span> Exclusive instrument
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Optimal Policy Stack Scenarios</h3>
            {[
              { scenario: 'US Green NH3 Export (to EU)', stack: ['IRA §45V Tier 4', 'EU CBAM avoided', 'FuelEU premium'], totalValue: 545 + Math.round(etsPriceEur * 1.8 * 0.82) + 70 },
              { scenario: 'Australia → Japan', stack: ['Headstart PTC', 'Japan GIF offtake', 'ACCUs (ARENA)'], totalValue: 95 + 130 + 40 },
              { scenario: 'Morocco → Germany (H2Global)', stack: ['H2Global gap fill', 'EU RED III premium'], totalValue: 220 + 60 },
              { scenario: 'Chile → EU VLSFO sub.', stack: ['FuelEU offset', 'EU ETS credit', 'CORFO export'], totalValue: 95 + Math.round(etsPriceEur * 2.8 * 0.82) + 85 },
            ].map((s, i) => (
              <div key={i} style={{ background: T.bg, borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: T.text, fontSize: 13 }}>{s.scenario}</span>
                  <span style={{ fontWeight: 700, color: T.green, fontSize: 14 }}>${s.totalValue}/t</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {s.stack.map((st, j) => (
                    <span key={j} style={{ background: '#D1FAE5', color: T.green, borderRadius: 4, padding: '2px 7px', fontSize: 11 }}>{st}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: 11, color: T.sub, textAlign: 'center' }}>
        EP-EE5 · Sources: EU CBAM Regulation 2023/956, IRS §45V guidance (2024), H2Global GmbH, IRENA Policy Database, IEA Clean Energy Policy Report
      </div>
    </div>
  );
}
