import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const tip = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 11 };

const BILATERAL_DEALS = [
  { buyer: 'Switzerland', seller: 'Ghana',       type: 'Art 6.2', itmos: 2.5, status: 'Active',   framework: 'KAUPA/GACSA', sector: 'Clean Cookstoves', price: 12.50 },
  { buyer: 'Japan',       seller: 'Indonesia',   type: 'Art 6.2', itmos: 5.2, status: 'Active',   framework: 'JCM',         sector: 'Renewable Energy', price: 8.30 },
  { buyer: 'Japan',       seller: 'Thailand',    type: 'Art 6.2', itmos: 1.8, status: 'Active',   framework: 'JCM',         sector: 'Energy Efficiency', price: 9.10 },
  { buyer: 'Singapore',   seller: 'Cambodia',    type: 'Art 6.2', itmos: 0.9, status: 'Pipeline', framework: 'IACE',        sector: 'Avoided Deforestation', price: 15.00 },
  { buyer: 'Sweden',      seller: 'Zambia',      type: 'Art 6.2', itmos: 1.2, status: 'Active',   framework: 'GCPF',        sector: 'Waste Management', price: 11.20 },
  { buyer: 'Norway',      seller: 'Kenya',       type: 'Art 6.2', itmos: 3.4, status: 'Active',   framework: 'NORCE',       sector: 'REDD+',            price: 14.80 },
  { buyer: 'Switzerland', seller: 'Senegal',     type: 'Art 6.2', itmos: 0.6, status: 'Active',   framework: 'KAUPA',       sector: 'Solar Energy',     price: 13.40 },
  { buyer: 'Japan',       seller: 'Vietnam',     type: 'Art 6.2', itmos: 2.1, status: 'Pipeline', framework: 'JCM',         sector: 'Industrial Efficiency', price: 7.80 },
  { buyer: 'UAE',         seller: 'Rwanda',      type: 'Art 6.2', itmos: 1.5, status: 'Mandate',  framework: 'UAE CMP',     sector: 'Peatland Restoration', price: 18.00 },
  { buyer: 'South Korea', seller: 'Vietnam',     type: 'Art 6.2', itmos: 0.8, status: 'Pipeline', framework: 'K-ITMO',     sector: 'Transport',        price: 10.50 },
];

const ART64_ACTIVITIES = [
  { id: 'CM-001', country: 'Costa Rica',   sector: 'Forestry / REDD+',      methodology: 'AMS-III.AU', credits: 850, validation: 'Gold Standard', status: 'Registered', vintage: 2024 },
  { id: 'CM-002', country: 'Bangladesh',   sector: 'Solar Mini-Grid',        methodology: 'AMS-I.A',   credits: 420, validation: 'Verra VCS',    status: 'Pending',    vintage: 2025 },
  { id: 'CM-003', country: 'Malawi',       sector: 'Biochar Soil Amendment', methodology: 'VM0044',    credits: 310, validation: 'Puro Earth',   status: 'Registered', vintage: 2024 },
  { id: 'CM-004', country: 'Mongolia',     sector: 'Grassland Carbon',       methodology: 'VM0032',    credits: 670, validation: 'Verra VCS',    status: 'In Review',  vintage: 2025 },
  { id: 'CM-005', country: 'Nigeria',      sector: 'Blue Carbon Mangrove',   methodology: 'VM0033',    credits: 195, validation: 'Gold Standard', status: 'Registered', vintage: 2024 },
  { id: 'CM-006', country: 'Philippines',  sector: 'Methane Avoidance',      methodology: 'AMS-III.D', credits: 280, validation: 'CAR',          status: 'Pending',    vintage: 2025 },
];

const CORSIA_DATA = [
  { year: 2021, baseline: 0, actual: 0, obligation: 0, price: 0 },
  { year: 2022, baseline: 100, actual: 88, obligation: 0, price: 0 },
  { year: 2023, baseline: 100, actual: 95, obligation: 0, price: 4.2 },
  { year: 2024, baseline: 100, actual: 102, obligation: 2, price: 6.8 },
  { year: 2025, baseline: 100, actual: 108, obligation: 8, price: 9.4 },
  { year: 2026, baseline: 100, actual: 112, obligation: 12, price: 11.5 },
  { year: 2027, baseline: 100, actual: 116, obligation: 16, price: 14.0 },
];

const ITMO_PRICES = Array.from({ length: 24 }, (_, i) => ({
  month: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i % 12]} ${2025 + Math.floor(i / 12)}`,
  jcm: +(8 + sr(i * 3) * 4).toFixed(2),
  nature: +(12 + sr(i * 7) * 6).toFixed(2),
  tech: +(6 + sr(i * 11) * 3).toFixed(2),
}));

const TABS = ['Overview', 'Article 6.2 Bilateral Deals', 'Article 6.4 Mechanism', 'CORSIA Aviation', 'ITMO Pricing'];

const STAT = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px', borderTop: `3px solid ${color || T.teal}` }}>
    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function Article6MarketsPage() {
  const [tab, setTab] = useState(0);
  const statusColor = s => ({ Active: T.green, Pipeline: T.amber, Mandate: '#7c3aed', Registered: T.sage, Pending: T.amber, 'In Review': '#0891b2' }[s] || T.textMut);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: T.font }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0891b218', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌐</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.navy, margin: 0 }}>Article 6 Carbon Markets</h1>
            <span style={{ fontSize: 10, background: '#0891b218', color: '#0891b2', padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>EP-AA2</span>
          </div>
          <p style={{ color: T.textSec, fontSize: 13, margin: 0 }}>Paris Agreement Art 6.2 Cooperative Approaches · Art 6.4 Mechanism · ITMOs · CORSIA · Supervisory Body</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ label: 'Art 6.2 Active', color: T.sage }, { label: 'Art 6.4 Live', color: '#0891b2' }, { label: 'CORSIA Phase 2', color: T.gold }].map(b => (
            <span key={b.label} style={{ fontSize: 10, background: b.color + '18', color: b.color, padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>{b.label}</span>
          ))}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tab === i ? '#0891b2' : T.textSec, borderBottom: tab === i ? '2px solid #0891b2' : '2px solid transparent', marginBottom: -1, transition: 'color 0.15s' }}>{t}</button>
        ))}
      </div>

      {/* TAB 0: OVERVIEW */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
            <STAT label="Art 6.2 Bilateral Deals" value="38" sub="Active + Pipeline globally" color="#0891b2" />
            <STAT label="ITMOs Transferred" value="41.7Mt" sub="CO2e authorised 2023–2025" color={T.sage} />
            <STAT label="Art 6.4 Activities" value="127" sub="Registered / pipeline" color={T.gold} />
            <STAT label="CORSIA Eligible Units" value="9" sub="Schemes incl. VCS, Gold Std, ACR" color={T.amber} />
            <STAT label="JCM Countries (Japan)" value="29" sub="Joint Crediting Mechanism" color="#7c3aed" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Article 6 Architecture — Three Tracks</div>
              {[
                { track: 'Article 6.1 & 6.8', title: 'Non-Market Approaches', desc: 'Capacity building, technology transfer, finance — no carbon credit trading. UNEP/CTCN coordination.', color: T.teal },
                { track: 'Article 6.2', title: 'Bilateral Cooperative Approaches', desc: 'Country-to-country ITMOs (Internationally Transferred Mitigation Outcomes). Corresponding adjustments required. Host country governs.', color: '#0891b2' },
                { track: 'Article 6.4', title: 'Centralised Mechanism (PACM)', desc: 'UN Supervisory Body oversees. Activities registered, credits (A6.4ERs) issued. Replaces CDM. ~65% share to host, 15% SOP to Adaptation Fund.', color: T.sage },
              ].map(t => (
                <div key={t.track} style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 10, borderLeft: `4px solid ${t.color}` }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 11, color: t.color, fontWeight: 700, marginBottom: 2 }}>{t.track}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{t.title}</div>
                      <div style={{ fontSize: 12, color: T.textSec }}>{t.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>ITMO Price Range by Sector ($/ tCO2e)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { sector: 'REDD+', low: 10, high: 25 },
                  { sector: 'Blue Carbon', low: 15, high: 45 },
                  { sector: 'Clean Energy', low: 6, high: 18 },
                  { sector: 'Cookstoves', low: 8, high: 20 },
                  { sector: 'Biochar', low: 80, high: 200 },
                  { sector: 'BECCS', low: 50, high: 150 },
                  { sector: 'DAC', low: 200, high: 600 },
                ]} margin={{ bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 9, fill: T.textMut }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} scale="log" domain={['auto', 'auto']} />
                  <Tooltip formatter={v => `$${v}/tCO2e`} contentStyle={tip} />
                  <Bar dataKey="low" name="Floor price" fill={T.teal} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="high" name="Ceiling price" fill={T.gold} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 11, color: T.textMut, marginTop: 8 }}>Log scale. Prices reflect 2024–2025 market data; high variance by quality, permanence, and co-benefits.</p>
            </div>
          </div>

          <div style={{ background: '#0891b210', border: `1px solid #0891b240`, borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0891b2', marginBottom: 6 }}>⚡ Article 6.4 Supervisory Body — Key 2026 Milestones</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { milestone: 'Activity rules finalisation', date: 'Q1 2026', status: 'Complete' },
                { milestone: 'Removal activities methodology', date: 'Q2 2026', status: 'In Progress' },
                { milestone: 'Registry operationalisation', date: 'Q3 2026', status: 'Planned' },
              ].map(m => (
                <div key={m.milestone} style={{ background: T.surface, borderRadius: 8, padding: '10px 12px', border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{m.milestone}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: T.textMut }}>{m.date}</span>
                    <span style={{ fontSize: 10, background: m.status === 'Complete' ? T.sage + '20' : m.status === 'In Progress' ? T.amber + '20' : T.border, color: m.status === 'Complete' ? T.sage : m.status === 'In Progress' ? T.amber : T.textMut, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{m.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: ART 6.2 */}
      {tab === 1 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Article 6.2 Bilateral Cooperative Approach Deals</div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f6f4f0' }}>
                  {['Buyer Country', 'Host Country', 'Type', 'ITMOs (MtCO2e/yr)', 'Status', 'Framework', 'Sector', 'Price ($/t)'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BILATERAL_DEALS.map((r, i) => (
                  <tr key={r.buyer + r.seller} style={{ background: i % 2 === 0 ? T.surface : '#fafaf8', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.navy }}>{r.buyer}</td>
                    <td style={{ padding: '10px 14px', color: T.text }}>{r.seller}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 10, background: '#0891b218', color: '#0891b2', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{r.type}</span></td>
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{r.itmos}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 10, background: statusColor(r.status) + '18', color: statusColor(r.status), padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{r.status}</span></td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: T.textMut }}>{r.framework}</td>
                    <td style={{ padding: '10px 14px', color: T.textSec }}>{r.sector}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.teal }}>${r.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '14px 18px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Corresponding Adjustment Requirements</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 12, color: T.textSec }}>
              <div>
                <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>ITMO Transfer Process</div>
                <ol style={{ paddingLeft: 18, margin: 0, lineHeight: 1.8 }}>
                  <li>Host country approves activity and authorises ITMOs</li>
                  <li>Buyer country receives ITMOs in national registry</li>
                  <li>Both countries apply corresponding adjustments in NDC accounting</li>
                  <li>Annual reporting to UNFCCC transparency framework (ETF)</li>
                  <li>2% share of proceeds contributed to Adaptation Fund</li>
                </ol>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>Corresponding Adjustment — Formula</div>
                <div style={{ background: T.bg, borderRadius: 8, padding: '12px 14px', fontFamily: 'monospace', fontSize: 11, color: T.textSec }}>
                  <div>Host NDC Adjustment = NDC emissions − ITMOs transferred</div>
                  <div style={{ marginTop: 8 }}>Buyer NDC Adjustment = NDC emissions + ITMOs received</div>
                  <div style={{ marginTop: 8, color: T.textMut }}>// Prevents double counting under Art 6.2 para. 3</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ART 6.4 */}
      {tab === 2 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Article 6.4 Mechanism — Registered Activities (PACM)</div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f6f4f0' }}>
                  {['Activity ID', 'Host Country', 'Sector', 'Methodology', 'A6.4ERs (ktCO2e)', 'Validator', 'Status', 'Vintage'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ART64_ACTIVITIES.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? T.surface : '#fafaf8', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0891b2', fontFamily: 'monospace' }}>{r.id}</td>
                    <td style={{ padding: '10px 14px', color: T.navy, fontWeight: 600 }}>{r.country}</td>
                    <td style={{ padding: '10px 14px', color: T.textSec }}>{r.sector}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: T.textMut, fontFamily: 'monospace' }}>{r.methodology}</td>
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{r.credits}</td>
                    <td style={{ padding: '10px 14px', color: T.textSec, fontSize: 11 }}>{r.validation}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 10, background: statusColor(r.status) + '18', color: statusColor(r.status), padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{r.status}</span></td>
                    <td style={{ padding: '10px 14px', color: T.textSec }}>{r.vintage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { title: 'Share of Proceeds — 2%', desc: 'Automatic 2% levy on A6.4ER issuances directed to UNFCCC Adaptation Fund for developing country climate adaptation.' },
              { title: 'Mandatory Cancellation — 5%', desc: '5% of A6.4ERs from each activity must be cancelled (non-used) to deliver "overall mitigation" — net reduction beyond NDC.' },
              { title: 'Supervisory Body Oversight', desc: 'UN Art 6.4 Supervisory Body approves methodologies, validates activities, issues A6.4ERs, maintains centralised registry.' },
            ].map(c => (
              <div key={c.title} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: T.textSec }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CORSIA */}
      {tab === 3 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>CORSIA — Carbon Offsetting and Reduction Scheme for International Aviation</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            <STAT label="Eligible Offset Schemes" value="9" sub="incl. VCS, GS, ACR, CAR, ART TREES" color={T.gold} />
            <STAT label="Phase 2 Start" value="2024" sub="Mandatory phase — 126 states" color={T.amber} />
            <STAT label="2026 Offset Obligation" value="12%" sub="Above 2019 baseline" color={T.red} />
            <STAT label="CORSIA Credit Price" value="$11.5/t" sub="Mar 2026 est. (OPIS)" color={T.teal} />
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Aviation Emissions vs 2019 Baseline & Offset Obligation</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={CORSIA_DATA.filter(d => d.year >= 2023)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textMut }} />
                <YAxis tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, n) => [n === 'obligation' ? `${v}% above baseline` : `Index ${v}`, n]} contentStyle={tip} />
                <Bar dataKey="actual" name="Actual emissions (index)" fill={T.navy} radius={[4, 4, 0, 0]} />
                <Bar dataKey="obligation" name="Offset obligation %" fill={T.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>CORSIA Eligible Offset Programmes (CEPs)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {['Verra VCS', 'Gold Standard', 'American Carbon Registry (ACR)', 'Climate Action Reserve (CAR)', 'ART TREES', 'Plan Vivo', 'Social Carbon', 'BioCarbon Fund', 'REDD.plus'].map((s, i) => (
                <div key={s} style={{ padding: '8px 12px', background: T.bg, borderRadius: 8, fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: [T.teal, T.sage, T.gold, '#0891b2', '#7c3aed', T.amber, T.red, T.navy, '#be185d'][i] }} />
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ITMO PRICING */}
      {tab === 4 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>ITMO Price Tracker — By Activity Type ($/ tCO2e)</div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={ITMO_PRICES.slice(-12)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: T.textMut }} angle={-30} textAnchor="end" interval={0} height={50} />
                <YAxis tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => `$${v}/t`} contentStyle={tip} />
                <Area type="monotone" dataKey="nature" stroke={T.sage} fill={T.sage + '20'} name="Nature-based (REDD+/Blue)" strokeWidth={2} />
                <Area type="monotone" dataKey="jcm" stroke={T.teal} fill={T.teal + '20'} name="JCM (Japan bilateral)" strokeWidth={2} />
                <Area type="monotone" dataKey="tech" stroke={T.gold} fill={T.gold + '20'} name="Technology (renewables)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { type: 'Nature-based ITMOs', price: '$12–25/t', drivers: 'High co-benefits, permanence risk, REDD+ safeguards, SBSTA guidance', trend: 'Rising', color: T.sage },
              { type: 'JCM / Technology ITMOs', price: '$6–18/t', drivers: 'Japanese govt. subsidy support, JCM methodology quality, NDC ambition of host', trend: 'Stable', color: T.teal },
              { type: 'Removals (Biochar/DAC)', price: '$80–600/t', drivers: 'Permanence premium, novel methodology risk, carbon dioxide removal verification', trend: 'Rising', color: '#7c3aed' },
            ].map(c => (
              <div key={c.type} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', borderLeft: `4px solid ${c.color}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{c.type}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: c.color, marginBottom: 8 }}>{c.price}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{c.drivers}</div>
                <span style={{ fontSize: 10, background: c.trend === 'Rising' ? T.sage + '20' : T.border, color: c.trend === 'Rising' ? T.sage : T.textMut, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>Trend: {c.trend}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
