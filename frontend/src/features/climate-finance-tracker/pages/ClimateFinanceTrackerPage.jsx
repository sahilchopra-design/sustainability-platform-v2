import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', navy:'#1b3a5c', gold:'#c5a96a', sage:'#5a8a6a', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', teal:'#0f766e', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const tip = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 11 };

const FINANCE_FLOWS = Array.from({ length: 10 }, (_, i) => ({
  year: 2015 + i,
  publicBilateral: Math.round(25 + sr(i * 3) * 10 + i * 2.5),
  publicMDB: Math.round(18 + sr(i * 5) * 8 + i * 2.0),
  private: Math.round(20 + sr(i * 7) * 30 + i * 3.5),
  adaptation: Math.round(8 + sr(i * 11) * 4 + i * 0.8),
}));

const GCF_PROJECTS = [
  { country: 'Bangladesh',  project: 'Urban Resilience & Flood Defence',      type: 'Adaptation', amount: 120, status: 'Disbursing', sector: 'Infrastructure' },
  { country: 'Indonesia',   project: 'Geothermal Energy Transition',          type: 'Mitigation', amount: 250, status: 'Disbursing', sector: 'Energy' },
  { country: 'Ethiopia',    project: 'Sustainable Land & Watershed Mgmt',     type: 'Cross-cutting', amount: 95, status: 'Approved', sector: 'Land Use' },
  { country: 'Philippines', project: 'Coastal Resilience & Mangrove Restore', type: 'Adaptation', amount: 85, status: 'Approved', sector: 'Ecosystems' },
  { country: 'Mozambique',  project: 'Climate-Smart Agriculture Finance',     type: 'Adaptation', amount: 60, status: 'Active', sector: 'Agriculture' },
  { country: 'Peru',        project: 'Amazon Jurisdiction REDD+ Programme',   type: 'Mitigation', amount: 180, status: 'Disbursing', sector: 'Forests' },
  { country: 'Pakistan',    project: 'Solar Rural Electrification',           type: 'Mitigation', amount: 210, status: 'Approved', sector: 'Energy' },
  { country: 'Cambodia',    project: 'Peatland Restoration & Carbon',         type: 'Cross-cutting', amount: 45, status: 'Active', sector: 'Land Use' },
];

const ADAPTATION_GAPS = [
  { sector: 'Agriculture & Food', need: 78, current: 12, unit: '$bn/yr' },
  { sector: 'Water & Sanitation', need: 65, current: 8, unit: '$bn/yr' },
  { sector: 'Coastal & Sea Level', need: 55, current: 5, unit: '$bn/yr' },
  { sector: 'Health Systems', need: 42, current: 4, unit: '$bn/yr' },
  { sector: 'Infrastructure', need: 95, current: 11, unit: '$bn/yr' },
  { sector: 'Ecosystems & NbS', need: 52, current: 6, unit: '$bn/yr' },
];

const COUNTRY_FLOWS = [
  { country: 'USA',         public: 11.4, private: 18.2, adaptation: 1.8, mitigation: 27.8, total: 29.6 },
  { country: 'Japan',       public: 17.2, private: 8.4,  adaptation: 3.2, mitigation: 22.4, total: 25.6 },
  { country: 'Germany',     public: 9.8,  private: 12.1, adaptation: 2.9, mitigation: 19.0, total: 21.9 },
  { country: 'France',      public: 7.6,  private: 9.8,  adaptation: 2.1, mitigation: 15.3, total: 17.4 },
  { country: 'UK',          public: 6.2,  private: 7.4,  adaptation: 1.8, mitigation: 11.8, total: 13.6 },
  { country: 'Canada',      public: 4.4,  private: 3.8,  adaptation: 0.9, mitigation: 7.3,  total: 8.2 },
  { country: 'Netherlands', public: 3.1,  private: 5.2,  adaptation: 1.2, mitigation: 7.1,  total: 8.3 },
  { country: 'Sweden',      public: 2.8,  private: 2.1,  adaptation: 0.8, mitigation: 4.1,  total: 4.9 },
];

const TABS = ['Overview', 'Flow Analysis', 'GCF Portfolio', 'Adaptation Gap', 'Country Contributions'];

const STAT = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px', borderTop: `3px solid ${color || '#7c3aed'}` }}>
    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function ClimateFinanceTrackerPage() {
  const [tab, setTab] = useState(0);
  const statusColor = s => ({ Disbursing: T.green, Approved: T.teal, Active: T.sage }[s] || T.textMut);
  const typeColor = s => ({ Adaptation: T.amber, Mitigation: T.teal, 'Cross-cutting': '#7c3aed' }[s] || T.textMut);

  const totalFlows = FINANCE_FLOWS[FINANCE_FLOWS.length - 1];
  const total2025 = totalFlows.publicBilateral + totalFlows.publicMDB + totalFlows.private;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: T.font }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#7c3aed18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💧</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.navy, margin: 0 }}>Climate Finance Tracker</h1>
            <span style={{ fontSize: 10, background: '#7c3aed18', color: '#7c3aed', padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>EP-AA4</span>
          </div>
          <p style={{ color: T.textSec, fontSize: 13, margin: 0 }}>COP $100bn Commitment · GCF / GIF / CIF · Public + Private Flows · Adaptation Finance Gap · NCQG 2025</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ label: '$100bn COP Pledge', color: T.amber }, { label: 'NCQG $300bn/yr', color: '#7c3aed' }, { label: 'GCF $11.6bn', color: T.sage }].map(b => (
            <span key={b.label} style={{ fontSize: 10, background: b.color + '18', color: b.color, padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>{b.label}</span>
          ))}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${T.border}` }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tab === i ? '#7c3aed' : T.textSec, borderBottom: tab === i ? '2px solid #7c3aed' : '2px solid transparent', marginBottom: -1, transition: 'color 0.15s' }}>{t}</button>
        ))}
      </div>

      {/* TAB 0: OVERVIEW */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
            <STAT label="Total Mobilised 2025" value="$92bn" sub="vs $100bn COP pledge" color={T.red} />
            <STAT label="Public Finance 2025" value="$58bn" sub="Bilateral + MDB combined" color={T.teal} />
            <STAT label="Private Finance 2025" value="$34bn" sub="Leveraged via MDBs / instruments" color={T.gold} />
            <STAT label="Adaptation Share" value="14%" sub="vs 50% target by 2025" color={T.amber} />
            <STAT label="NCQG 2035 Target" value="$300bn/yr" sub="Agreed COP29 Baku 2024" color="#7c3aed" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Climate Finance Flows 2015–2025 ($bn/yr)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={FINANCE_FLOWS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textMut }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => `$${v}bn`} contentStyle={tip} />
                  <Bar dataKey="publicBilateral" stackId="a" name="Public Bilateral" fill={T.teal} />
                  <Bar dataKey="publicMDB" stackId="a" name="Public MDB" fill="#0891b2" />
                  <Bar dataKey="private" stackId="a" name="Private" fill={T.gold} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>2025 Finance Mix</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={[
                    { name: 'Public Bilateral', value: totalFlows.publicBilateral },
                    { name: 'Public MDB', value: totalFlows.publicMDB },
                    { name: 'Private', value: totalFlows.private },
                  ]} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2}>
                    {[T.teal, '#0891b2', T.gold].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip formatter={v => `$${v}bn`} contentStyle={tip} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {[{ name: 'Public Bilateral', val: totalFlows.publicBilateral, color: T.teal }, { name: 'Public MDB', val: totalFlows.publicMDB, color: '#0891b2' }, { name: 'Private', val: totalFlows.private, color: T.gold }].map(d => (
                  <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSec }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                      {d.name}
                    </div>
                    <span style={{ fontWeight: 700, color: T.navy }}>${d.val}bn ({((d.val / total2025) * 100).toFixed(0)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: T.red + '08', border: `1px solid ${T.red}30`, borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 8 }}>⚠️ $100bn Gap Analysis — Why the Target Was Missed</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { issue: 'Accounting methodology disputes', detail: 'Loans counted at face value, not grant equivalent — OECD vs developing country positions' },
                { issue: 'Private finance attribution', detail: 'Disputed whether MDB-leveraged private finance counts toward $100bn government pledge' },
                { issue: 'Adaptation underfunding', detail: 'Only ~$14bn for adaptation vs estimated $387bn need — systemic bias toward mitigation' },
              ].map(c => (
                <div key={c.issue} style={{ background: T.surface, borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{c.issue}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{c.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: FLOW ANALYSIS */}
      {tab === 1 && (
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Adaptation vs Mitigation Finance 2015–2025 ($bn)</div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={FINANCE_FLOWS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textMut }} />
                <YAxis tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tip} />
                <Area type="monotone" dataKey="adaptation" stroke={T.amber} fill={T.amber + '20'} name="Adaptation" strokeWidth={2} />
                <Area type="monotone" dataKey="private" stroke={T.gold} fill={T.gold + '18'} name="Private Mitigation" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { title: 'Multilateral Climate Funds', items: ['Green Climate Fund (GCF) — $11.6bn pledged, GCF-2 replenishment', 'Global Environment Facility (GEF) — $5.3bn GEF-8', 'Climate Investment Funds (CIF) — $10bn+, 72 countries', 'Adaptation Fund — $1.9bn total, levy on CDM/Art 6.4'], color: T.teal },
              { title: 'Bilateral Finance Channels', items: ['Japan JICA — $17bn/yr climate-related ODA', 'Germany KfW / GIZ — €9.8bn/yr climate finance', 'France AFD — €7.6bn/yr green and social projects', 'UK FCDO / BII — £6.2bn climate finance commitment'], color: '#0891b2' },
              { title: 'MDB Climate Finance 2025', items: ['World Bank Group — $38bn commitment (67% dev. country)', 'ADB — $14bn/yr (75% climate co-benefit)', 'AIIB — $6bn climate targets by 2030', 'EBRD — 50%+ portfolio green taxonomy by 2025'], color: '#7c3aed' },
            ].map(c => (
              <div key={c.title} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', borderLeft: `4px solid ${c.color}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>{c.title}</div>
                {c.items.map(item => (
                  <div key={item} style={{ padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.textSec }}>{item}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: GCF PORTFOLIO */}
      {tab === 2 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Green Climate Fund — Active Portfolio</div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f6f4f0' }}>
                  {['Country', 'Project', 'Type', 'GCF Amount ($m)', 'Status', 'Sector'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GCF_PROJECTS.map((r, i) => (
                  <tr key={r.project} style={{ background: i % 2 === 0 ? T.surface : '#fafaf8', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.navy }}>{r.country}</td>
                    <td style={{ padding: '10px 14px', color: T.textSec }}>{r.project}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 10, background: typeColor(r.type) + '18', color: typeColor(r.type), padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{r.type}</span></td>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>${r.amount}m</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 10, background: statusColor(r.status) + '18', color: statusColor(r.status), padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{r.status}</span></td>
                    <td style={{ padding: '10px 14px', color: T.textSec, fontSize: 11 }}>{r.sector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <STAT label="GCF Portfolio Projects" value="243" sub="Across 128 countries" />
            <STAT label="Total GCF-1 Approved" value="$11.6bn" sub="GCF-2 replenishment ongoing" color={T.teal} />
            <STAT label="Disbursement Rate" value="38%" sub="Portfolio-level disbursement" color={T.amber} />
            <STAT label="Private Co-Finance Ratio" value="1:2.8" sub="For every $1 GCF, $2.8 co-finance" color={T.sage} />
          </div>
        </div>
      )}

      {/* TAB 3: ADAPTATION GAP */}
      {tab === 3 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Adaptation Finance Gap by Sector (UNEP Adaptation Gap Report 2024)</div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            {ADAPTATION_GAPS.map(r => (
              <div key={r.sector} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{r.sector}</span>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                    <span style={{ color: T.textMut }}>Need: <strong style={{ color: T.navy }}>${r.need}bn/yr</strong></span>
                    <span style={{ color: T.textMut }}>Current: <strong style={{ color: T.amber }}>${r.current}bn/yr</strong></span>
                    <span style={{ color: T.red, fontWeight: 700 }}>Gap: ${r.need - r.current}bn/yr ({(((r.need - r.current) / r.need) * 100).toFixed(0)}%)</span>
                  </div>
                </div>
                <div style={{ height: 10, background: T.border, borderRadius: 5 }}>
                  <div style={{ height: '100%', width: `${(r.current / r.need) * 100}%`, background: r.current / r.need < 0.15 ? T.red : r.current / r.need < 0.25 ? T.amber : T.sage, borderRadius: 5 }} />
                </div>
                <div style={{ fontSize: 10, color: T.textMut, marginTop: 3 }}>{((r.current / r.need) * 100).toFixed(0)}% funded · {((1 - r.current / r.need) * 100).toFixed(0)}% gap</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.amber + '10', border: `1px solid ${T.amber}40`, borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.amber, marginBottom: 8 }}>Glasgow–Sharm el-Sheikh Work Programme Goal</div>
            <div style={{ fontSize: 12, color: T.textSec }}>Double adaptation finance from developed to developing countries by 2025 (from ~$21bn 2019 baseline). Progress: ~$14bn 2025 = insufficient. COP29 Baku established adaptation finance goal under Global Goal on Adaptation (GGA).</div>
          </div>
        </div>
      )}

      {/* TAB 4: COUNTRY CONTRIBUTIONS */}
      {tab === 4 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Developed Country Climate Finance Contributions 2025 ($bn)</div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f6f4f0' }}>
                  {['Country', 'Public Finance', 'Private Finance', 'Adaptation', 'Mitigation', 'Total', 'Share'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COUNTRY_FLOWS.map((r, i) => {
                  const totalAll = COUNTRY_FLOWS.reduce((s, c) => s + c.total, 0);
                  return (
                    <tr key={r.country} style={{ background: i % 2 === 0 ? T.surface : '#fafaf8', borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: T.navy }}>{r.country}</td>
                      <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums' }}>${r.public}bn</td>
                      <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums', color: T.gold }}>${r.private}bn</td>
                      <td style={{ padding: '10px 14px', color: T.amber }}>${r.adaptation}bn</td>
                      <td style={{ padding: '10px 14px', color: T.teal }}>${r.mitigation}bn</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: T.navy }}>${r.total}bn</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ height: 6, background: T.border, borderRadius: 3, flex: 1, maxWidth: 80 }}>
                            <div style={{ height: '100%', width: `${(r.total / totalAll) * 100}%`, background: T.teal, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, color: T.textMut, whiteSpace: 'nowrap' }}>{((r.total / totalAll) * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Country Contributions Stacked ($bn)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={COUNTRY_FLOWS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 10, fill: T.textMut }} />
                <YAxis tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => `$${v}bn`} contentStyle={tip} />
                <Bar dataKey="public" stackId="a" name="Public" fill={T.teal} />
                <Bar dataKey="private" stackId="a" name="Private" fill={T.gold} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
