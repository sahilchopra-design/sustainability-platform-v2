import React, { useState } from 'react';
import {
  BarChart, Bar, ScatterChart, Scatter, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', sage: '#5a8a6a', text: '#1b3a5c',
  textSec: '#5c6b7e', textMut: '#9aa3ae', red: '#dc2626', green: '#16a34a',
  amber: '#d97706', blue: '#2563eb', orange: '#ea580c', purple: '#7c3aed',
  teal: '#0891b2',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const REGIONS = [
  { region: 'Appalachia, USA',      country: 'US', sector: 'Coal Mining',     fossil_jobs: 42000, green_jobs: 18000, wage_fossil: 72000,  wage_green: 58000,  reskill_cost: 340,  vuln: 82, jtf_need: 4200, jtf_avail: 1800, color: T.red },
  { region: 'Ruhr Valley, Germany', country: 'DE', sector: 'Coal Power',      fossil_jobs: 28000, green_jobs: 45000, wage_fossil: 68000,  wage_green: 74000,  reskill_cost: 280,  vuln: 62, jtf_need: 2800, jtf_avail: 2600, color: T.amber },
  { region: 'Silesia, Poland',      country: 'PL', sector: 'Coal Mining',     fossil_jobs: 85000, green_jobs: 12000, wage_fossil: 38000,  wage_green: 32000,  reskill_cost: 520,  vuln: 91, jtf_need: 8500, jtf_avail: 1200, color: T.red },
  { region: 'Mpumalanga, S.Africa', country: 'ZA', sector: 'Coal Mining',     fossil_jobs: 92000, green_jobs: 8000,  wage_fossil: 22000,  wage_green: 18000,  reskill_cost: 680,  vuln: 95, jtf_need: 9200, jtf_avail: 480,  color: T.purple },
  { region: 'Alberta, Canada',      country: 'CA', sector: 'Oil Sands',       fossil_jobs: 65000, green_jobs: 28000, wage_fossil: 95000,  wage_green: 82000,  reskill_cost: 410,  vuln: 58, jtf_need: 5200, jtf_avail: 3800, color: T.orange },
  { region: 'Sabine Pass, USA',     country: 'US', sector: 'LNG / Petrochem', fossil_jobs: 18000, green_jobs: 12000, wage_fossil: 88000,  wage_green: 72000,  reskill_cost: 220,  vuln: 54, jtf_need: 1800, jtf_avail: 1200, color: T.amber },
  { region: 'Kemerovo, Russia',     country: 'RU', sector: 'Coal Mining',     fossil_jobs: 110000,green_jobs: 2000,  wage_fossil: 18000,  wage_green: 14000,  reskill_cost: 820,  vuln: 98, jtf_need: 11000, jtf_avail: 120, color: T.red },
  { region: 'Rheinland, Germany',   country: 'DE', sector: 'Lignite Mining',  fossil_jobs: 18000, green_jobs: 22000, wage_fossil: 62000,  wage_green: 68000,  reskill_cost: 180,  vuln: 45, jtf_need: 1600, jtf_avail: 1800, color: T.green },
  { region: 'Jharkhand, India',     country: 'IN', sector: 'Coal Mining',     fossil_jobs: 340000,green_jobs: 45000, wage_fossil: 8000,   wage_green: 6500,   reskill_cost: 2800, vuln: 96, jtf_need: 34000, jtf_avail: 800, color: T.red },
  { region: 'La Guajira, Colombia', country: 'CO', sector: 'Coal Exports',    fossil_jobs: 12000, green_jobs: 18000, wage_fossil: 15000,  wage_green: 14000,  reskill_cost: 140,  vuln: 72, jtf_need: 1200, jtf_avail: 680, color: T.amber },
];

const ILO_PILLARS = [
  { name: 'Social Dialogue', desc: 'Inclusive consultation with workers, unions, communities', weight: 25, color: T.blue },
  { name: 'Rights at Work', desc: 'Labour rights, health & safety, ILO core conventions', weight: 20, color: T.green },
  { name: 'Employment Creation', desc: 'New decent work, skills matching, job guarantee schemes', weight: 30, color: T.teal },
  { name: 'Social Protection', desc: 'Income support, pension bridges, healthcare continuity', weight: 15, color: T.amber },
  { name: 'Development Policy', desc: 'Community investment, infrastructure, regional renewal', weight: 10, color: T.purple },
];

const TABS = ['Regional Intelligence', 'Vulnerability Matrix', 'Financing Gap', 'ILO JTF Alignment', 'Green Job Sectors'];

export default function JustTransitionIntelligencePage() {
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState(0);

  const r = REGIONS[selected];
  const netJobs = r.green_jobs - r.fossil_jobs;
  const wageGap = r.wage_green - r.wage_fossil;
  const jtfGap = r.jtf_need - r.jtf_avail;
  const totalFossil = REGIONS.reduce((s, x) => s + x.fossil_jobs, 0);
  const totalGreen = REGIONS.reduce((s, x) => s + x.green_jobs, 0);
  const totalJtfGap = REGIONS.reduce((s, x) => s + (x.jtf_need - x.jtf_avail), 0);

  const GREEN_SECTORS = [
    { sector: 'Solar PV Installation', jobs_2030: 1800, jobs_2040: 4200, wage_premium: 8, reskill_months: 3 },
    { sector: 'Wind Operations & Maint.', jobs_2030: 920, jobs_2040: 2100, wage_premium: 12, reskill_months: 6 },
    { sector: 'Battery Manufacturing', jobs_2030: 1400, jobs_2040: 3800, wage_premium: 5, reskill_months: 9 },
    { sector: 'Green H₂ Production', jobs_2030: 380, jobs_2040: 1600, wage_premium: 18, reskill_months: 12 },
    { sector: 'Energy Efficiency Retrofit', jobs_2030: 2200, jobs_2040: 3500, wage_premium: -5, reskill_months: 4 },
    { sector: 'EV Manufacturing', jobs_2030: 1100, jobs_2040: 2900, wage_premium: 10, reskill_months: 8 },
    { sector: 'Sustainable Agriculture', jobs_2030: 650, jobs_2040: 1400, wage_premium: -12, reskill_months: 6 },
    { sector: 'Nature Restoration', jobs_2030: 420, jobs_2040: 980, wage_premium: -8, reskill_months: 2 },
  ];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CB2 · JUST TRANSITION INTELLIGENCE</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Just Transition — Worker & Community Impact Intelligence</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              10 Regions · ILO JTF Framework · Financing Gap · Vulnerability Scoring · Green Job Pipeline
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Fossil Jobs at Risk', val: `${(totalFossil/1000).toFixed(0)}K`, col: T.red },
              { label: 'Green Jobs (2030)', val: `${(totalGreen/1000).toFixed(0)}K`, col: T.green },
              { label: 'JTF Financing Gap', val: `$${(totalJtfGap/1000).toFixed(1)}B`, col: T.amber },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                <div style={{ color: m.col, fontSize: 20, fontWeight: 700, fontFamily: T.mono }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 13,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>

        {tab === 0 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
              {/* Region list */}
              <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16, maxHeight: 600, overflowY: 'auto' }}>
                <h4 style={{ color: T.navy, margin: '0 0 12px', fontSize: 14 }}>Select Region</h4>
                {REGIONS.map((reg, i) => (
                  <div key={i} onClick={() => setSelected(i)} style={{
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 6,
                    background: selected === i ? reg.color + '11' : T.bg,
                    border: `1px solid ${selected === i ? reg.color : 'transparent'}`
                  }}>
                    <div style={{ fontWeight: 600, color: T.navy, fontSize: 13 }}>{reg.region}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{reg.sector} · {reg.country}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: T.red }}>{reg.fossil_jobs.toLocaleString()} jobs at risk</span>
                      <span style={{ fontSize: 11, color: reg.vuln > 80 ? T.red : reg.vuln > 60 ? T.amber : T.green, fontWeight: 700 }}>Vuln: {reg.vuln}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Region detail */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: T.surface, borderRadius: 10, border: `2px solid ${r.color}44`, padding: 24 }}>
                  <h2 style={{ color: T.navy, margin: '0 0 4px', fontSize: 20 }}>{r.region}</h2>
                  <div style={{ color: T.textSec, fontSize: 13, marginBottom: 16 }}>{r.sector} · {r.country}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'Fossil Jobs', val: r.fossil_jobs.toLocaleString(), col: T.red },
                      { label: 'Green Jobs 2030', val: r.green_jobs.toLocaleString(), col: T.green },
                      { label: 'Net Change', val: `${netJobs > 0 ? '+' : ''}${netJobs.toLocaleString()}`, col: netJobs > 0 ? T.green : T.red },
                      { label: 'Vulnerability', val: `${r.vuln}/100`, col: r.vuln > 80 ? T.red : r.vuln > 60 ? T.amber : T.green },
                    ].map(m => (
                      <div key={m.label} style={{ background: T.bg, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>{m.label}</div>
                        <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: m.col, marginTop: 4 }}>{m.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: T.bg, borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>Wage Differential</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div><div style={{ fontSize: 11, color: T.textMut }}>Fossil</div><div style={{ fontFamily: T.mono, fontWeight: 700, color: T.red }}>${(r.wage_fossil/1000).toFixed(0)}K/yr</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20 }}>→</div><div style={{ fontSize: 11, color: wageGap > 0 ? T.green : T.red }}>{wageGap > 0 ? '+' : ''}{((wageGap/r.wage_fossil)*100).toFixed(0)}%</div></div>
                        <div><div style={{ fontSize: 11, color: T.textMut }}>Green</div><div style={{ fontFamily: T.mono, fontWeight: 700, color: T.green }}>${(r.wage_green/1000).toFixed(0)}K/yr</div></div>
                      </div>
                    </div>
                    <div style={{ background: T.bg, borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>Just Transition Finance</div>
                      <div style={{ fontSize: 11, color: T.textMut }}>Needed: <strong style={{ color: T.red }}>${(r.jtf_need/1000).toFixed(1)}B</strong></div>
                      <div style={{ fontSize: 11, color: T.textMut }}>Available: <strong style={{ color: T.green }}>${(r.jtf_avail/1000).toFixed(1)}B</strong></div>
                      <div style={{ height: 8, background: T.border, borderRadius: 4, marginTop: 8 }}>
                        <div style={{ height: '100%', width: `${(r.jtf_avail/r.jtf_need)*100}%`, background: jtfGap > r.jtf_need * 0.6 ? T.red : T.amber, borderRadius: 4 }} />
                      </div>
                      <div style={{ fontSize: 11, color: T.red, marginTop: 4 }}>Gap: ${(jtfGap/1000).toFixed(1)}B ({((jtfGap/r.jtf_need)*100).toFixed(0)}% unfunded)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 8px', fontSize: 15 }}>Vulnerability vs. Financing Gap Matrix</h3>
              <p style={{ color: T.textSec, fontSize: 12, margin: '0 0 16px' }}>X: Community Vulnerability Score (0–100) · Y: JTF Financing Gap ($M)</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
                {REGIONS.map((reg, i) => {
                  const gapPct = (reg.jtf_need - reg.jtf_avail) / reg.jtf_need * 100;
                  return (
                    <div key={i} style={{ background: T.bg, borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: reg.color, marginTop: 3, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: T.navy, fontSize: 13 }}>{reg.region}</div>
                        <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{reg.sector}</div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 10, color: T.textMut }}>Vulnerability</div>
                            <div style={{ fontFamily: T.mono, fontWeight: 700, color: reg.vuln > 80 ? T.red : reg.vuln > 60 ? T.amber : T.green }}>{reg.vuln}/100</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: T.textMut }}>JTF Gap</div>
                            <div style={{ fontFamily: T.mono, fontWeight: 700, color: T.red }}>{gapPct.toFixed(0)}% unfunded</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: T.textMut }}>Fossil Jobs</div>
                            <div style={{ fontFamily: T.mono, fontWeight: 700, color: T.navy }}>{reg.fossil_jobs.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>JTF Financing Gap by Region</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={REGIONS.map(r => ({ name: r.region.split(',')[0], need: r.jtf_need, avail: r.jtf_avail, gap: r.jtf_need - r.jtf_avail, color: r.color }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}B`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`$${(v/1000).toFixed(2)}B`]} />
                  <Legend />
                  <Bar dataKey="avail" name="Finance Available" fill={T.green} opacity={0.8} stackId="a" />
                  <Bar dataKey="gap" name="Financing Gap" fill={T.red} opacity={0.8} stackId="a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>ILO Just Transition Framework — 5 Pillars</h3>
                {ILO_PILLARS.map(p => (
                  <div key={p.name} style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 16, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>{p.name}</div>
                      <span style={{ fontFamily: T.mono, fontWeight: 700, color: p.color, fontSize: 14 }}>{p.weight}%</span>
                    </div>
                    <div style={{ color: T.textSec, fontSize: 12, marginBottom: 8 }}>{p.desc}</div>
                    <div style={{ height: 6, background: T.border, borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${p.weight * 3.33}%`, background: p.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Regional JTF Pillar Alignment</h3>
                {REGIONS.slice(0, 5).map((reg, i) => {
                  const scores = ILO_PILLARS.map(p => ({
                    pillar: p.name.split(' ')[0],
                    // ILO JTF pillar score — deterministic per region+pillar (no Math.random)
                    score: Math.round(40 + Math.sin(i * 1.5 + ILO_PILLARS.indexOf(p)) * 30 + 7.5 * (Math.sin(i * 3.7 + ILO_PILLARS.indexOf(p) * 2.1) + 1)),
                  }));
                  const overall = Math.round(scores.reduce((s, x) => s + x.score, 0) / scores.length);
                  return (
                    <div key={i} style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 14, marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontWeight: 600, color: T.navy, fontSize: 13 }}>{reg.region}</div>
                        <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: overall > 60 ? T.green : overall > 40 ? T.amber : T.red }}>{overall}/100</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {scores.map(s => (
                          <div key={s.pillar} style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ height: 40, background: T.border, borderRadius: 4, position: 'relative' }}>
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${s.score}%`, background: s.score > 60 ? T.green : s.score > 40 ? T.amber : T.red, borderRadius: 4 }} />
                            </div>
                            <div style={{ fontSize: 9, color: T.textMut, marginTop: 2 }}>{s.pillar}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 16px', fontSize: 15 }}>Green Job Sector Pipeline — 2030 vs. 2040 (Thousands)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={GREEN_SECTORS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={70} />
                  <YAxis tickFormatter={v => `${v}K`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`${v}K jobs`]} />
                  <Legend />
                  <Bar dataKey="jobs_2030" name="2030 Jobs (K)" fill={T.teal} opacity={0.8} radius={[4,4,0,0]} />
                  <Bar dataKey="jobs_2040" name="2040 Jobs (K)" fill={T.green} opacity={0.8} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {GREEN_SECTORS.map(s => (
                <div key={s.sector} style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{s.sector}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                    <div style={{ background: T.bg, borderRadius: 6, padding: 8 }}>
                      <div style={{ fontSize: 10, color: T.textMut }}>2030</div>
                      <div style={{ fontFamily: T.mono, fontWeight: 700, color: T.teal }}>{s.jobs_2030}K</div>
                    </div>
                    <div style={{ background: T.bg, borderRadius: 6, padding: 8 }}>
                      <div style={{ fontSize: 10, color: T.textMut }}>2040</div>
                      <div style={{ fontFamily: T.mono, fontWeight: 700, color: T.green }}>{s.jobs_2040}K</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: s.wage_premium > 0 ? T.green : T.red }}>
                    Wage vs. fossil: {s.wage_premium > 0 ? '+' : ''}{s.wage_premium}%
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec }}>Reskill: {s.reskill_months} months</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
