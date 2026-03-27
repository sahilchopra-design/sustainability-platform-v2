import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, ScatterChart, Scatter, ZAxis } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', navy:'#1b3a5c', gold:'#c5a96a', sage:'#5a8a6a', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', teal:'#0f766e', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const tip = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 11 };

const SOVEREIGN_ISSUERS = [
  { country: 'Germany',    currency: 'EUR', outstanding: 60.0, firstYear: 2020, framework: 'German Green Bond Framework', rating: 'AAA', greenium: 4.0, uop: 'Energy transition, transport, R&D', region: 'Europe' },
  { country: 'France',     currency: 'EUR', outstanding: 55.0, firstYear: 2017, framework: "France Sovereign Green OAT", rating: 'AA', greenium: 3.5, uop: 'Green R&D, biodiversity, clean transport', region: 'Europe' },
  { country: 'Netherlands',currency: 'EUR', outstanding: 21.5, firstYear: 2019, framework: 'DSL Green Bond Framework', rating: 'AAA', greenium: 3.0, uop: 'Water management, renewables, circular economy', region: 'Europe' },
  { country: 'UK',         currency: 'GBP', outstanding: 18.0, firstYear: 2021, framework: 'UK Green Financing Framework', rating: 'AA', greenium: 3.8, uop: 'Offshore wind, rail, nature recovery', region: 'Europe' },
  { country: 'Italy',      currency: 'EUR', outstanding: 16.5, firstYear: 2021, framework: 'Italy BTP Green Framework', rating: 'BBB', greenium: 2.5, uop: 'Energy efficiency, clean mobility, biodiversity', region: 'Europe' },
  { country: 'Spain',      currency: 'EUR', outstanding: 14.0, firstYear: 2021, framework: 'Spain SDG Bond Framework', rating: 'A', greenium: 2.8, uop: 'Renewable energy, rail, R&D sustainability', region: 'Europe' },
  { country: 'Chile',      currency: 'USD', outstanding: 8.0,  firstYear: 2019, framework: 'Chile Sovereign Green/SDG Bond', rating: 'A', greenium: 5.5, uop: 'Solar, wind, sustainable water, social', region: 'EM' },
  { country: 'Indonesia',  currency: 'USD', outstanding: 5.5,  firstYear: 2018, framework: 'Indonesia Green Sukuk Framework', rating: 'BBB', greenium: 6.0, uop: 'Renewable energy, sustainable transport, marine', region: 'EM' },
  { country: 'Poland',     currency: 'EUR', outstanding: 9.5,  firstYear: 2016, framework: 'Poland Green Bond Framework', rating: 'A', greenium: 3.2, uop: 'Renewables, clean transport, adaptation', region: 'Europe' },
  { country: 'Belgium',    currency: 'EUR', outstanding: 13.0, firstYear: 2018, framework: 'Belgium OLO Green Bond', rating: 'AA', greenium: 3.1, uop: 'Renewables, rail transport, R&D', region: 'Europe' },
  { country: 'Egypt',      currency: 'USD', outstanding: 2.5,  firstYear: 2020, framework: 'Egypt Green Bond Framework', rating: 'B', greenium: 7.5, uop: 'Renewables, energy efficiency, clean water', region: 'EM' },
  { country: 'India',      currency: 'USD', outstanding: 3.0,  firstYear: 2023, framework: 'India Sovereign Green Bond', rating: 'BBB', greenium: 5.0, uop: 'Solar, wind, mass transit, green hydrogen', region: 'EM' },
];

const USE_OF_PROCEEDS = [
  { category: 'Renewable Energy',        share: 34, eu: 38, em: 28, color: T.gold },
  { category: 'Clean Transport',         share: 22, eu: 24, em: 18, color: '#0891b2' },
  { category: 'Energy Efficiency',       share: 15, eu: 16, em: 13, color: T.teal },
  { category: 'Nature & Biodiversity',   share: 8,  eu: 10, em: 5,  color: T.sage },
  { category: 'Sustainable Water',       share: 7,  eu: 5,  em: 10, color: '#1e40af' },
  { category: 'R&D / Innovation',        share: 9,  eu: 7,  em: 12, color: '#7c3aed' },
  { category: 'Social / SDG',           share: 5,  eu: 0,  em: 14, color: '#be185d' },
];

const IMPACT_METRICS = [
  { country: 'Germany',    ghgAvoided: 8.2,  renewablesMW: 2100, jobsCreated: 45000, treesMillion: 12 },
  { country: 'France',     ghgAvoided: 7.8,  renewablesMW: 1850, jobsCreated: 38000, treesMillion: 18 },
  { country: 'UK',         ghgAvoided: 5.1,  renewablesMW: 1200, jobsCreated: 22000, treesMillion: 8 },
  { country: 'Chile',      ghgAvoided: 2.4,  renewablesMW: 680,  jobsCreated: 8500,  treesMillion: 15 },
  { country: 'Indonesia',  ghgAvoided: 1.8,  renewablesMW: 420,  jobsCreated: 12000, treesMillion: 22 },
  { country: 'India',      ghgAvoided: 1.2,  renewablesMW: 380,  jobsCreated: 6500,  treesMillion: 5 },
];

const GREENIUM_TREND = Array.from({ length: 24 }, (_, i) => ({
  month: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i % 12]} ${2025 + Math.floor(i / 12)}`,
  aaa: +(3.2 + sr(i * 3) * 1.5).toFixed(1),
  aa: +(3.8 + sr(i * 7) * 1.8).toFixed(1),
  bbb: +(5.5 + sr(i * 11) * 2.5).toFixed(1),
  em: +(6.2 + sr(i * 13) * 3.0).toFixed(1),
}));

const TABS = ['Overview', 'Issuance Pipeline', 'Use of Proceeds', 'Impact Reporting', 'Greenium Analysis'];

const STAT = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px', borderTop: `3px solid ${color || '#be185d'}` }}>
    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function ClimateSovereignBondsPage() {
  const [tab, setTab] = useState(0);
  const [sortCol, setSortCol] = useState('outstanding');
  const sortedIssuers = [...SOVEREIGN_ISSUERS].sort((a, b) => b[sortCol] - a[sortCol]);
  const ratingColor = r => ({ AAA: T.sage, AA: T.teal, A: '#0891b2', BBB: T.gold, BB: T.amber, B: T.red }[r] || T.textMut);
  const regionColor = r => ({ Europe: T.teal, EM: T.amber }[r] || T.textMut);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: T.font }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#be185d18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏛️</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.navy, margin: 0 }}>Climate Sovereign Bonds</h1>
            <span style={{ fontSize: 10, background: '#be185d18', color: '#be185d', padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>EP-AA6</span>
          </div>
          <p style={{ color: T.textSec, fontSize: 13, margin: 0 }}>Green Gilts · EU GBS CAB · EM Sovereign Green · Greenium Analysis · Impact Reporting · 47 Sovereign Issuers</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ label: '47 Issuers', color: '#be185d' }, { label: '$365bn Outstanding', color: T.navy }, { label: 'Greenium 3–8bps', color: T.sage }].map(b => (
            <span key={b.label} style={{ fontSize: 10, background: b.color + '18', color: b.color, padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>{b.label}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${T.border}` }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tab === i ? '#be185d' : T.textSec, borderBottom: tab === i ? '2px solid #be185d' : '2px solid transparent', marginBottom: -1, transition: 'color 0.15s' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
            <STAT label="Total Outstanding" value="$365bn" sub="47 sovereign issuers" color="#be185d" />
            <STAT label="2025 Issuance" value="$92bn" sub="+22% YoY; new record" color={T.sage} />
            <STAT label="EM Sovereigns" value="18" sub="Incl. green sukuk issuers" color={T.gold} />
            <STAT label="Avg Greenium (EU AAA)" value="3.2bps" sub="Tighter during stable market" color={T.teal} />
            <STAT label="First Sovereign Issuer" value="Poland 2016" sub="€750m — started modern era" color={T.textSec} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Outstanding by Issuer (Top 12, $bn)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={SOVEREIGN_ISSUERS} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 9, fill: T.textMut }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => `$${v}bn`} contentStyle={tip} />
                  <Bar dataKey="outstanding" name="Outstanding ($bn)" radius={[4, 4, 0, 0]}>
                    {SOVEREIGN_ISSUERS.map((s, i) => <Bar key={i} fill={s.region === 'Europe' ? T.teal : T.gold} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Greenium by Rating Category (bps)</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={GREENIUM_TREND.slice(-12)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 8, fill: T.textMut }} angle={-30} textAnchor="end" height={50} interval={1} />
                  <YAxis tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => `${v}bps`} contentStyle={tip} />
                  <Area type="monotone" dataKey="aaa" stroke={T.sage} fill={T.sage + '20'} name="AAA" strokeWidth={2} />
                  <Area type="monotone" dataKey="aa" stroke={T.teal} fill={T.teal + '18'} name="AA" strokeWidth={2} />
                  <Area type="monotone" dataKey="em" stroke={T.gold} fill={T.gold + '18'} name="EM" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Market Development Milestones</div>
            <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
              {[
                { year: '2016', event: 'Poland — first sovereign green bond ($750m)', color: '#7c3aed' },
                { year: '2017', event: 'France OAT Verte — €7bn inaugural, benchmark set', color: '#be185d' },
                { year: '2019', event: 'Netherlands DSL — $6bn, DNSH introduced', color: T.teal },
                { year: '2021', event: 'UK Green Gilt — £10bn; EU CAB inaugural €12bn', color: '#0891b2' },
                { year: '2023', event: 'EU GBS fully effective; India sovereign debut', color: T.sage },
                { year: '2025', event: 'EM acceleration; 47 sovereign issuers, $365bn outstanding', color: T.gold },
              ].map((m, i, arr) => (
                <div key={m.year} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, marginBottom: 8 }}>{m.year.slice(2)}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{m.event}</div>
                  </div>
                  {i < arr.length - 1 && <div style={{ fontSize: 16, color: T.textMut, padding: '6px 4px', flexShrink: 0 }}>→</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>Sovereign Green Bond Issuers — Market Overview</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: T.textMut }}>Sort by:</span>
              {['outstanding', 'greenium', 'firstYear'].map(c => (
                <button key={c} onClick={() => setSortCol(c)} style={{ padding: '4px 10px', border: `1px solid ${sortCol === c ? '#be185d' : T.border}`, borderRadius: 6, background: sortCol === c ? '#be185d18' : T.surface, color: sortCol === c ? '#be185d' : T.textSec, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>{c === 'outstanding' ? 'Size' : c === 'greenium' ? 'Greenium' : 'Year'}</button>
              ))}
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f6f4f0' }}>
                  {['Country', 'CCY', 'Outstanding ($bn)', 'First Year', 'Framework', 'Rating', 'Greenium (bps)', 'Use of Proceeds', 'Region'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedIssuers.map((r, i) => (
                  <tr key={r.country} style={{ background: i % 2 === 0 ? T.surface : '#fafaf8', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: T.navy }}>{r.country}</td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{r.currency}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>${r.outstanding}bn</td>
                    <td style={{ padding: '10px 12px', color: T.textSec }}>{r.firstYear}</td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: T.textMut, maxWidth: 160 }}>{r.framework}</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ fontSize: 10, background: ratingColor(r.rating) + '18', color: ratingColor(r.rating), padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{r.rating}</span></td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: T.sage }}>{r.greenium}bps</td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: T.textMut }}>{r.uop}</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ fontSize: 10, background: regionColor(r.region) + '18', color: regionColor(r.region), padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{r.region}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Use of Proceeds — Sovereign Green Bond Market 2025</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Overall Market Allocation (%)</div>
              {USE_OF_PROCEEDS.map(r => (
                <div key={r.category} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: T.textSec, fontWeight: 600 }}>{r.category}</span>
                    <span style={{ fontWeight: 700, color: T.navy }}>{r.share}%</span>
                  </div>
                  <div style={{ height: 8, background: T.border, borderRadius: 4 }}>
                    <div style={{ height: '100%', width: `${r.share}%`, background: r.color, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>EU vs EM Allocation Comparison (%)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={USE_OF_PROCEEDS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: T.textMut }} />
                  <YAxis type="category" dataKey="category" width={130} tick={{ fontSize: 9, fill: T.textSec }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => `${v}%`} contentStyle={tip} />
                  <Bar dataKey="eu" name="EU" fill={T.teal} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="em" name="EM" fill={T.gold} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Use of Proceeds Eligibility — EU GBS Taxonomy Requirements</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { req: 'EU Taxonomy Alignment', detail: 'At least 90% of proceeds must fund activities meeting EU Taxonomy TSC for sovereign issuers using EU GBS label', status: 'Mandatory for EU GBS label' },
                { req: 'DNSH Principles', detail: 'All funded activities must not significantly harm any of the 6 environmental objectives — verified via TSC and environmental screening', status: 'Mandatory for EU GBS label' },
                { req: 'Third-Party Review', detail: 'Pre-issuance external review (2nd party opinion or certification) + post-issuance allocation report within 12 months of full allocation', status: 'Mandatory' },
                { req: 'Impact Reporting', detail: 'Annual impact report with quantified outcomes (GHG avoided, renewable capacity added, beneficiaries) until full allocation', status: 'Best Practice (mandatory for EU GBS)' },
                { req: 'Ring-Fencing', detail: 'Proceeds tracked via internal or external register; earmarked for eligible projects within 2 years of issuance', status: 'Best Practice' },
                { req: 'Additionality', detail: 'Debate ongoing: sovereign bonds often refinance existing expenditure — ICMA supports reporting on government green expenditure share of GDP', status: 'Voluntary' },
              ].map(r => (
                <div key={r.req} style={{ padding: '12px 14px', background: T.bg, borderRadius: 10, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{r.req}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{r.detail}</div>
                  <span style={{ fontSize: 10, background: T.sage + '18', color: T.sage, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Impact Reporting — Selected Sovereign Issuers</div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f6f4f0' }}>
                  {['Country', 'GHG Avoided (MtCO2/yr)', 'Renewables Added (MW)', 'Jobs Created', 'Trees Planted (m)', 'Impact Score'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {IMPACT_METRICS.map((r, i) => (
                  <tr key={r.country} style={{ background: i % 2 === 0 ? T.surface : '#fafaf8', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.navy }}>{r.country}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.sage }}>{r.ghgAvoided}Mt</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.renewablesMW.toLocaleString()} MW</td>
                    <td style={{ padding: '10px 14px' }}>{r.jobsCreated.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', color: T.sage }}>{r.treesMillion}m</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ height: 6, width: 60, background: T.border, borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${Math.min((r.ghgAvoided / 8.5) * 100, 100)}%`, background: T.sage, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>{((r.ghgAvoided / 8.5) * 100).toFixed(0)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>GHG Avoided by Country (MtCO2/yr)</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={IMPACT_METRICS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 10, fill: T.textMut }} angle={-15} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => `${v}Mt CO2/yr`} contentStyle={tip} />
                  <Bar dataKey="ghgAvoided" name="GHG Avoided" fill={T.sage} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Impact Reporting Frameworks</div>
              {[
                { framework: 'ICMA Harmonised Framework for Impact Reporting', scope: 'Core KPIs for green, social, sustainability bonds' },
                { framework: 'EU GBS Impact Report Template', scope: 'Mandatory for EU GBS-labelled sovereign issuers' },
                { framework: 'MDB Joint Impact Reporting', scope: 'World Bank, IFC, ADB harmonised sovereign climate KPIs' },
                { framework: 'UNFCCC Transparency Framework (ETF)', scope: 'National inventory reports — links to sovereign bond impact' },
                { framework: 'TCFD Sovereign Implementation', scope: 'Scenario analysis for sovereign debt portfolios' },
              ].map(f => (
                <div key={f.framework} style={{ padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <div style={{ fontWeight: 600, color: T.navy }}>{f.framework}</div>
                  <div style={{ color: T.textMut, marginTop: 2 }}>{f.scope}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Greenium (New-Issue Premium) Analysis</div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Greenium Trend by Rating Category (bps) — 12 Months</div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={GREENIUM_TREND.slice(-12)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: T.textMut }} angle={-30} textAnchor="end" height={50} interval={1} />
                <YAxis tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => `${v}bps`} contentStyle={tip} />
                <Area type="monotone" dataKey="aaa" stroke={T.sage} fill={T.sage + '20'} name="AAA Sovereign" strokeWidth={2} />
                <Area type="monotone" dataKey="aa" stroke={T.teal} fill={T.teal + '18'} name="AA Sovereign" strokeWidth={2} />
                <Area type="monotone" dataKey="bbb" stroke={T.gold} fill={T.gold + '18'} name="BBB Sovereign" strokeWidth={2} />
                <Area type="monotone" dataKey="em" stroke="#be185d" fill="#be185d18" name="EM Sovereign" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { title: 'Why Greenium Exists', points: ['Excess demand from ESG-mandated investors', 'SRI / green fund oversubscription', 'Lower secondary market volatility', 'Reputational premium from sustainability narrative'] },
              { title: 'Greenium Determinants', points: ['Issuer credit rating (AAA = lower greenium)', 'Framework quality (EU GBS > ICMA GBP)', 'Bond tenor (longer tenor = larger premium)', 'Market conditions (greenium tightens in risk-off)'] },
              { title: 'Criticisms & Limitations', points: ['Greenium may reflect new-issue premium, not green', 'Tight greenium ≠ higher capital mobilisation', 'Measurement difficult: no identical conventional twin', 'Greenwashing risk if impact reporting is weak'] },
            ].map(c => (
              <div key={c.title} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>{c.title}</div>
                {c.points.map(p => (
                  <div key={p} style={{ padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.textSec, display: 'flex', gap: 8 }}>
                    <span style={{ color: T.sage, flexShrink: 0 }}>•</span>{p}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
