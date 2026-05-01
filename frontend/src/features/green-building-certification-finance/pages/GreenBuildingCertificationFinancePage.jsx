import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const T = {
  bg: '#F0FDF4', card: '#FFFFFF', border: '#BBF7D0', text: '#14532D',
  sub: '#166534', accent: '#15803D', light: '#DCFCE7',
  leed: '#16A34A', breeam: '#0891B2', nabers: '#7C3AED',
  red: '#DC2626', amber: '#D97706', blue: '#2563EB',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const CERTIFICATIONS = [
  { id: 'LEED-Platinum', name: 'LEED Platinum', system: 'LEED', region: 'Global (US-dominant)', points: '80+', premium: 8.5, rentPremium: 6.2, costPremium: 3.5, marketShare: 12 },
  { id: 'LEED-Gold', name: 'LEED Gold', system: 'LEED', region: 'Global', points: '60–79', premium: 5.8, rentPremium: 4.1, costPremium: 2.2, marketShare: 28 },
  { id: 'BREEAM-Outstanding', name: 'BREEAM Outstanding', system: 'BREEAM', region: 'UK/Europe', points: '85%+', premium: 9.2, rentPremium: 7.1, costPremium: 4.0, marketShare: 8 },
  { id: 'BREEAM-Excellent', name: 'BREEAM Excellent', system: 'BREEAM', region: 'UK/Europe', points: '70–84%', premium: 6.5, rentPremium: 4.8, costPremium: 2.8, marketShare: 22 },
  { id: 'NABERS-6', name: 'NABERS 6 Star', system: 'NABERS', region: 'Australia', points: '6 Stars', premium: 7.0, rentPremium: 5.5, costPremium: 3.0, marketShare: 15 },
  { id: 'NABERS-5', name: 'NABERS 5 Star', system: 'NABERS', region: 'Australia', points: '5 Stars', premium: 4.0, rentPremium: 3.0, costPremium: 1.8, marketShare: 18 },
  { id: 'Green-Star', name: 'Green Star 6-Star', system: 'Green Star', region: 'Australia/NZ', points: '75–100', premium: 5.5, rentPremium: 4.2, costPremium: 2.5, marketShare: 10 },
  { id: 'DGNB-Platinum', name: 'DGNB Platinum', system: 'DGNB', region: 'Germany/DACH', points: '90%+', premium: 7.8, rentPremium: 5.9, costPremium: 3.2, marketShare: 8 },
];

const BUILDINGS = Array.from({ length: 22 }, (_, i) => ({
  id: i + 1,
  cert: CERTIFICATIONS[i % CERTIFICATIONS.length].id,
  type: ['Office', 'Retail', 'Logistics', 'Residential', 'Mixed-Use', 'Hotel'][i % 6],
  city: ['London', 'New York', 'Sydney', 'Singapore', 'Frankfurt', 'Paris', 'Tokyo', 'Toronto', 'Amsterdam', 'Dubai'][i % 10],
  gfa: Math.round(5000 + sr(i * 17) * 95000),
  certCost: Math.round(50 + sr(i * 23) * 450),
  salePremium: (3 + sr(i * 31) * 8).toFixed(1),
  rentPremium: (2 + sr(i * 37) * 6).toFixed(1),
  energySaving: Math.round(20 + sr(i * 43) * 45),
  co2Saving: Math.round(15 + sr(i * 47) * 55),
  payback: (3 + sr(i * 53) * 9).toFixed(1),
  investor: ['BlackRock RE', 'Brookfield', 'CBRE IM', 'LaSalle', 'Prologis', 'Hines', 'JLL', 'Savills'][i % 8],
}));

const MARKET_TREND = Array.from({ length: 10 }, (_, i) => ({
  year: 2024 + i,
  certifiedStock: Math.round(15 + i * 2.5),
  avgPremium: (5.5 + i * 0.3).toFixed(1),
  greenLoanVolume: Math.round(80 + i * 18),
}));

const ROI_BREAKDOWN = [
  { component: 'Sale Premium', leed: 8.5, breeam: 9.2, nabers: 7.0 },
  { component: 'Rent Premium', leed: 6.2, breeam: 7.1, nabers: 5.5 },
  { component: 'Vacancy Reduction', leed: 2.5, breeam: 3.0, nabers: 2.2 },
  { component: 'Energy Savings', leed: 3.0, breeam: 3.5, nabers: 4.0 },
  { component: 'OpEx Reduction', leed: 1.5, breeam: 1.8, nabers: 2.0 },
  { component: 'Financing Cost Saving', leed: 0.8, breeam: 0.9, nabers: 0.7 },
];

const TABS = ['Overview', 'Certification Analysis', 'ROI Deep Dive', 'Market Trends', 'Investor Intelligence', 'Green Finance'];

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

export default function GreenBuildingCertificationFinancePage() {
  const [tab, setTab] = useState(0);
  const [certFilter, setCertFilter] = useState('All');
  const [capex, setCapex] = useState(20);
  const [discountRate, setDiscountRate] = useState(7);

  const filtered = useMemo(() => certFilter === 'All' ? BUILDINGS : BUILDINGS.filter(b => b.cert.startsWith(certFilter)), [certFilter]);

  const kpis = useMemo(() => {
    const n = filtered.length || 1;
    return {
      avgSalePremium: (filtered.reduce((a, b) => a + parseFloat(b.salePremium), 0) / n).toFixed(1),
      avgRentPremium: (filtered.reduce((a, b) => a + parseFloat(b.rentPremium), 0) / n).toFixed(1),
      avgEnergySaving: Math.round(filtered.reduce((a, b) => a + b.energySaving, 0) / n),
      avgPayback: (filtered.reduce((a, b) => a + parseFloat(b.payback), 0) / n).toFixed(1),
    };
  }, [filtered]);

  const npvCalc = useMemo(() => {
    const annualBenefit = capex * 0.08;
    const npv = Array.from({ length: 10 }, (_, t) => annualBenefit / Math.pow(1 + discountRate / 100, t + 1)).reduce((a, v) => a + v, 0) - capex;
    return { npv: npv.toFixed(2), moic: (1 + npv / capex).toFixed(2) };
  }, [capex, discountRate]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ background: T.leed + '22', color: T.leed, border: `1px solid ${T.leed}44`, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>EP-EI1</span>
            <span style={{ fontSize: 12, color: T.sub }}>Green Building Certification Finance</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>Green Building Certification Finance</h1>
          <p style={{ color: T.sub, marginTop: 4, fontSize: 14 }}>LEED, BREEAM, NABERS, DGNB — certification ROI, green premium analytics, sale/rent uplift, and green finance structuring</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <KpiCard label="Avg Sale Premium" value={`+${kpis.avgSalePremium}%`} sub="vs uncertified comparable" color={T.leed} />
          <KpiCard label="Avg Rent Premium" value={`+${kpis.avgRentPremium}%`} sub="annual rent uplift" color={T.breeam} />
          <KpiCard label="Avg Energy Saving" value={`${kpis.avgEnergySaving}%`} sub="operational energy reduction" color={T.nabers} />
          <KpiCard label="Avg Payback" value={`${kpis.avgPayback}yr`} sub="certification investment" color={T.blue} />
          <KpiCard label="Portfolio Buildings" value={filtered.length} sub="certified in pipeline" color={T.accent} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: tab === i ? T.leed : T.light, color: tab === i ? '#fff' : T.text, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {['All', 'LEED', 'BREEAM', 'NABERS', 'Green-Star', 'DGNB'].map(f => (
                <button key={f} onClick={() => setCertFilter(f)} style={{ padding: '4px 12px', borderRadius: 12, border: `1px solid ${T.border}`, background: certFilter === f ? T.leed : T.card, color: certFilter === f ? '#fff' : T.text, fontSize: 12, cursor: 'pointer' }}>{f}</button>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: T.light }}>{['#', 'Certification', 'Type', 'City', 'GFA (m²)', 'Cert Cost ($k)', 'Sale +%', 'Rent +%', 'Energy Saved', 'CO₂ Saved', 'Payback', 'Investor'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map((b, i) => (
                    <tr key={b.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: T.leed }}>{b.id}</td>
                      <td style={{ padding: '8px 12px' }}><Pill label={b.cert} color={b.cert.includes('LEED') ? T.leed : b.cert.includes('BREEAM') ? T.breeam : T.nabers} /></td>
                      <td style={{ padding: '8px 12px' }}>{b.type}</td>
                      <td style={{ padding: '8px 12px' }}>{b.city}</td>
                      <td style={{ padding: '8px 12px' }}>{b.gfa.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px' }}>${b.certCost}k</td>
                      <td style={{ padding: '8px 12px', color: T.leed, fontWeight: 600 }}>+{b.salePremium}%</td>
                      <td style={{ padding: '8px 12px', color: T.breeam, fontWeight: 600 }}>+{b.rentPremium}%</td>
                      <td style={{ padding: '8px 12px' }}>{b.energySaving}%</td>
                      <td style={{ padding: '8px 12px' }}>{b.co2Saving}%</td>
                      <td style={{ padding: '8px 12px' }}>{b.payback}yr</td>
                      <td style={{ padding: '8px 12px', fontSize: 11 }}>{b.investor}</td>
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
              <h3 style={{ color: T.text, marginTop: 0 }}>Sale Premium by Certification (%)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={CERTIFICATIONS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="premium" fill={T.leed} radius={[4, 4, 0, 0]} name="Sale Premium %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Rent Premium vs Cost Premium (%)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={CERTIFICATIONS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rentPremium" fill={T.breeam} name="Rent Premium %" />
                  <Bar dataKey="costPremium" fill={T.red + '88'} name="Cost Premium %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Certification Details — 8 Systems</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: T.light }}>{['System', 'Region', 'Level', 'Sale Premium', 'Rent Premium', 'Build Cost Premium', 'Market Share'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {CERTIFICATIONS.map((c, i) => (
                    <tr key={c.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: T.leed }}>{c.name}</td>
                      <td style={{ padding: '8px 12px' }}>{c.region}</td>
                      <td style={{ padding: '8px 12px' }}>{c.points}</td>
                      <td style={{ padding: '8px 12px', color: T.leed, fontWeight: 600 }}>+{c.premium}%</td>
                      <td style={{ padding: '8px 12px', color: T.breeam }}>+{c.rentPremium}%</td>
                      <td style={{ padding: '8px 12px', color: T.amber }}>+{c.costPremium}%</td>
                      <td style={{ padding: '8px 12px' }}>{c.marketShare}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>ROI Component Calculator</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: T.sub }}>Certification CAPEX: ${capex}k per 100m²</label>
                  <input type="range" min={5} max={80} value={capex} onChange={e => setCapex(Number(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: T.sub }}>Discount Rate: {discountRate}%</label>
                  <input type="range" min={4} max={12} value={discountRate} onChange={e => setDiscountRate(Number(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <KpiCard label="10yr NPV" value={`$${npvCalc.npv}k`} sub="per 100m² certified" color={parseFloat(npvCalc.npv) > 0 ? T.leed : T.red} />
                <KpiCard label="MOIC" value={`${npvCalc.moic}×`} sub="10yr money multiple" color={T.breeam} />
                <KpiCard label="Annual Benefit" value={`$${(capex * 0.08).toFixed(1)}k`} sub="8% annual return assumption" color={T.nabers} />
                <KpiCard label="Break-Even" value={`${(capex / (capex * 0.08)).toFixed(1)}yr`} sub="simple payback" color={T.blue} />
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>ROI Components by System (%)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ROI_BREAKDOWN}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="component" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="leed" fill={T.leed} name="LEED" />
                  <Bar dataKey="breeam" fill={T.breeam} name="BREEAM" />
                  <Bar dataKey="nabers" fill={T.nabers} name="NABERS" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Sale Premium vs Payback (Scatter)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="payback" name="Payback (yr)" tick={{ fontSize: 11 }} label={{ value: 'Payback (yr)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="salePremium" name="Sale Premium %" tick={{ fontSize: 11 }} label={{ value: 'Sale Premium %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={BUILDINGS.map(b => ({ payback: parseFloat(b.payback), salePremium: parseFloat(b.salePremium) }))} fill={T.leed} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Green Certified Stock Growth (% of total)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={MARKET_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="certifiedStock" stroke={T.leed} strokeWidth={2.5} name="Certified Stock %" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Green Loan Volume Forecast ($Bn)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={MARKET_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="greenLoanVolume" stroke={T.breeam} fill={T.breeam + '33'} name="Green Loan Volume ($Bn)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { name: 'BlackRock Real Assets', aum: '$35Bn', greenTarget: '100% LEED/BREEAM by 2030', strategy: 'Core+ and Value-Add offices', focus: 'LEED Gold minimum standard' },
              { name: 'Brookfield Asset Mgmt', aum: '$42Bn RE', greenTarget: 'Net-zero portfolio by 2050', strategy: 'Global diversified RE', focus: 'BREEAM Excellent; LEED Gold' },
              { name: 'CBRE Investment Mgmt', aum: '$28Bn', greenTarget: 'All new investments LEED/BREEAM', strategy: 'Core office and logistics', focus: 'NABERS 5+ for Australia assets' },
              { name: 'LaSalle Investment Mgmt', aum: '$30Bn', greenTarget: 'GRESB top quartile by 2025', strategy: 'Europe-focused logistics+office', focus: 'BREEAM minimum; CRREM pathway' },
              { name: 'Prologis', aum: '$200Bn logistics', greenTarget: 'Net-zero buildings by 2040', strategy: 'Global logistics/industrial', focus: 'LEED Silver minimum; PV rooftops' },
              { name: 'Hines', aum: '$20Bn', greenTarget: 'LEED/BREEAM on all developments', strategy: 'Premium office + mixed-use', focus: 'LEED Platinum flagship; BREEAM O/S' },
            ].map(inv => (
              <div key={inv.name} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 14, marginBottom: 6 }}>{inv.name}</div>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>AUM: <strong style={{ color: T.leed }}>{inv.aum}</strong></div>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{inv.greenTarget}</div>
                <div style={{ fontSize: 11, color: T.breeam }}>{inv.focus}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Green Finance Instruments for Certified Buildings</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {[
                  { instrument: 'Green Mortgage', spread: '-15 to -30bps', eligibility: 'EPC A/B or BREEAM Excellent+', volume: '€500Bn EU (2023)', body: 'EU Mortgage Credit Directive + EBA Green Mortgage Standards' },
                  { instrument: 'Green Bond (ICMA)', spread: '-5 to -10bps greenium', eligibility: 'Use of proceeds for LEED Gold+ or BREEAM Excellent+', volume: '$600Bn global (2023)', body: 'ICMA Green Bond Principles; Climate Bonds Initiative Buildings Standard' },
                  { instrument: 'PACE Financing', spread: 'Fixed rate tied to property', eligibility: 'US commercial properties; energy efficiency or clean energy upgrades', volume: '$13Bn US cumulative', body: 'PACE Nation; state-specific enabling legislation' },
                  { instrument: 'Sustainability-Linked Loan', spread: '-3 to -7bps margin ratchet', eligibility: 'KPIs: energy intensity, GRESB score, EPC rating', volume: '$400Bn global SLL (2023)', body: 'LMA/APLMA SLL Principles 2023' },
                  { instrument: 'SFDR Article 8/9 RE Fund', spread: 'Investor ESG allocation premium', eligibility: 'DNSH assessment + EU Taxonomy alignment', volume: '€300Bn+ in Article 8/9 RE', body: 'EU SFDR + EU Taxonomy Regulation (CCM activity 7.7)' },
                  { instrument: 'CBI Building Label', spread: 'Green bond labelling', eligibility: 'CRREM-aligned; top 15% energy intensity by country/type', volume: 'Certifies eligible green bonds', body: 'Climate Bonds Initiative Low Carbon Building Criteria' },
                ].map(inst => (
                  <div key={inst.instrument} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                    <div style={{ fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 6 }}>{inst.instrument}</div>
                    <div style={{ fontSize: 12, color: T.leed, fontWeight: 600, marginBottom: 4 }}>{inst.spread}</div>
                    <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{inst.eligibility}</div>
                    <div style={{ fontSize: 11, color: T.breeam }}>{inst.volume}</div>
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
