import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E', sub: '#6B7280', indigo: '#4F46E5', green: '#065F46', red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', sky: '#0369A1', steel: '#374151' };
const TABS = ['Sector Landscape', 'Transition Finance', 'Deal Structuring', 'Abatement Levers', 'Blended Finance', 'Portfolio Analytics'];

const SECTORS = [
  { id: 'Steel', name: 'Steel & Iron', emissions: 2800, abatement2030: 22, abatement2050: 93, financeNeed: 1200, routes: 'DRI-H₂, EAF Scrap', readiness: 68 },
  { id: 'Cement', name: 'Cement & Concrete', emissions: 4200, abatement2030: 15, abatement2050: 90, financeNeed: 800, routes: 'CCUS, LC³, LEILAC', readiness: 52 },
  { id: 'Chemicals', name: 'Chemicals & Petrochemicals', emissions: 1800, abatement2030: 18, abatement2050: 85, financeNeed: 950, routes: 'Green H₂, Biomass, Elec.', readiness: 61 },
  { id: 'Aviation', name: 'Aviation', emissions: 1000, abatement2030: 8, abatement2050: 70, financeNeed: 600, routes: 'SAF, Electric, H₂', readiness: 45 },
  { id: 'Shipping', name: 'Shipping & Maritime', emissions: 900, abatement2030: 12, abatement2050: 80, financeNeed: 500, routes: 'Ammonia, Methanol, H₂', readiness: 42 },
  { id: 'Aluminium', name: 'Aluminium', emissions: 1100, abatement2030: 25, abatement2050: 88, financeNeed: 420, routes: 'Green Power, Inert Anode', readiness: 72 },
];

const DEALS = Array.from({ length: 16 }, (_, i) => {
  const sec = SECTORS[Math.floor(sr(i * 7 + 1) * SECTORS.length)];
  const capex = Math.round(100 + sr(i * 11 + 2) * 900);
  const country = ['Germany', 'USA', 'Japan', 'Sweden', 'UK', 'Netherlands', 'Australia', 'India'][Math.floor(sr(i * 13 + 3) * 8)];
  const structure = ['Green Bond', 'SLL', 'Transition Bond', 'Blended Finance', 'KPI-linked'][Math.floor(sr(i * 17 + 4) * 5)];
  const irr = parseFloat((5 + sr(i * 19 + 5) * 10).toFixed(1));
  const dscr = parseFloat((1.15 + sr(i * 23 + 6) * 0.70).toFixed(2));
  const status = ['Closed', 'Mandate', 'Diligence', 'Pipeline'][Math.floor(sr(i * 29 + 7) * 4)];
  const ci_before = parseFloat((0.8 + sr(i * 31 + 8) * 1.2).toFixed(2));
  const ci_after = parseFloat((ci_before * (0.05 + sr(i * 37 + 9) * 0.25)).toFixed(2));
  return { id: i + 1, name: `${country.substring(0, 3)}-${sec.id}-${i + 1}`, sector: sec.id, country, structure, capex, irr, dscr, status, ci_before, ci_after };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: '1 1 150px' }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);
const Pill = ({ v }) => {
  const c = { Closed: T.green, Mandate: T.sky, Diligence: T.amber, Pipeline: T.sub, 'Green Bond': T.green, SLL: T.sky, 'Transition Bond': T.amber, 'Blended Finance': T.indigo, 'KPI-linked': T.teal }[v] || T.sub;
  return <span style={{ background: c, color: '#fff', fontSize: 10, borderRadius: 12, padding: '2px 8px', fontWeight: 600 }}>{v}</span>;
};

export default function HardToAbateTransitionPage() {
  const [tab, setTab] = useState(0);
  const [selSector, setSelSector] = useState('ALL');
  const [carbonPrice, setCarbonPrice] = useState(80);

  const filtered = useMemo(() => DEALS.filter(d => selSector === 'ALL' || d.sector === selSector), [selSector]);
  const avgIrr = useMemo(() => filtered.length ? (filtered.reduce((s, d) => s + d.irr, 0) / filtered.length).toFixed(1) : '—', [filtered]);
  const totalCapex = useMemo(() => filtered.reduce((s, d) => s + d.capex, 0), [filtered]);
  const totalEmissions = useMemo(() => SECTORS.reduce((s, sec) => s + sec.emissions, 0), []);

  const radarData = SECTORS.map(s => ({ subject: s.id, readiness: s.readiness, abatement2030: s.abatement2030 * 4, finance: Math.min(100, s.financeNeed / 12) }));

  const timelineAbatement = [2025, 2028, 2030, 2035, 2040, 2050].map(yr => {
    const row = { year: yr };
    SECTORS.forEach(s => {
      const t = yr <= 2030 ? s.abatement2030 * (yr - 2024) / 6 : s.abatement2030 + (s.abatement2050 - s.abatement2030) * (yr - 2030) / 20;
      row[s.id] = parseFloat(t.toFixed(0));
    });
    return row;
  });

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      <div style={{ background: '#0C1A2E', padding: '20px 32px', borderBottom: `3px solid ${T.steel}` }}>
        <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>EP-EG6 · Green Steel Suite</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>Hard-to-Abate Sector Transition Finance</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Steel · Cement · Aviation · Shipping · Chemicals · Aluminium · 16 Deals · Blended Finance</div>
      </div>
      <div style={{ background: '#0C1A2E', display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid #1E3A5F` }}>
        {TABS.map((t, i) => <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 18px', fontSize: 12, fontWeight: tab === i ? 700 : 400, color: tab === i ? '#94A3B8' : '#6B7280', background: 'none', border: 'none', borderBottom: tab === i ? `2px solid #94A3B8` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>)}
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Total Emissions" value={`${(totalEmissions / 1000).toFixed(1)} GtCO₂`} sub="Hard-to-abate sectors" color={T.red} />
          <KpiCard label="Deals Tracked" value={filtered.length} sub={`$${(totalCapex / 1000).toFixed(1)}B CAPEX`} color={T.sky} />
          <KpiCard label="Avg Deal IRR" value={`${avgIrr}%`} sub="Transition finance" color={T.green} />
          <KpiCard label="Finance Needed" value="$5.5T" sub="2024–2050 cumulative" color={T.amber} />
          <KpiCard label="Carbon Price" value={`$${carbonPrice}/t`} sub="Sensitivity input" color={T.indigo} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <select value={selSector} onChange={e => setSelSector(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, background: T.card, color: T.text }}>
            <option value="ALL">All Sectors</option>
            {SECTORS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>Carbon: ${carbonPrice}/t</span><input type="range" min={20} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 100 }} /></div>
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Emissions by Sector (MtCO₂/yr)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={SECTORS.map(s => ({ name: s.id, emissions: s.emissions, financeNeed: s.financeNeed }))} layout="vertical" margin={{ left: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit=" Mt" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="emissions" name="Emissions Mt" fill={T.red} />
                  <Bar dataKey="financeNeed" name="Finance Need $B" fill={T.sky} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Readiness × Abatement Radar</div>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} outerRadius={90}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Readiness" dataKey="readiness" stroke={T.green} fill={T.green} fillOpacity={0.2} />
                  <Radar name="Abatement×4" dataKey="abatement2030" stroke={T.sky} fill={T.sky} fillOpacity={0.2} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Transition Finance Deal Table</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr style={{ background: '#F8F7F4' }}>
                    {['Deal', 'Sector', 'Country', 'CAPEX $M', 'Structure', 'IRR %', 'DSCR', 'CI Before', 'CI After', 'Status'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filtered.slice(0, 10).map((d, i) => (
                      <tr key={d.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 ? '#FAFAF7' : T.card }}>
                        <td style={{ padding: '7px 10px', fontWeight: 500 }}>{d.name}</td>
                        <td style={{ padding: '7px 10px', color: T.sub }}>{d.sector}</td>
                        <td style={{ padding: '7px 10px' }}>{d.country}</td>
                        <td style={{ padding: '7px 10px' }}>${d.capex}M</td>
                        <td style={{ padding: '7px 10px' }}><Pill v={d.structure} /></td>
                        <td style={{ padding: '7px 10px', fontWeight: 600, color: d.irr >= 10 ? T.green : T.amber }}>{d.irr}%</td>
                        <td style={{ padding: '7px 10px', color: d.dscr >= 1.3 ? T.green : T.amber }}>{d.dscr}</td>
                        <td style={{ padding: '7px 10px', color: T.red }}>{d.ci_before}</td>
                        <td style={{ padding: '7px 10px', color: T.green }}>{d.ci_after}</td>
                        <td style={{ padding: '7px 10px' }}><Pill v={d.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Annual Finance Need by Sector ($B/yr)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={SECTORS.map(s => ({ name: s.id, now: Math.round(s.financeNeed * 0.12), need2030: Math.round(s.financeNeed * 0.38) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$B" />
                  <Tooltip formatter={v => [`$${v}B/yr`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="now" name="Current Annual" fill={T.sky} />
                  <Bar dataKey="need2030" name="Needed by 2030" fill={T.amber} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Transition Finance Instruments</div>
              {[{ inst: 'Transition Bond', desc: 'Proceeds for high-CI asset phase-out/retrofit', premium: '-10–20bps', eligibility: 'ICMA Transition Handbook' }, { inst: 'Sustainability-Linked Loan', desc: 'KPI: emissions intensity reduction milestone', premium: '-5–15bps', eligibility: 'LMA SLL Principles' }, { inst: 'Green Bond (for CCS/H₂)', desc: 'Proceeds for green capex components only', premium: '-15–30bps', eligibility: 'ICMA GBP / EU GBS' }, { inst: 'Blended DFI/MDB', desc: 'First-loss tranche + concessional layer', premium: 'N/A (additionality)', eligibility: 'IFC/ADB/AIIB' }, { inst: 'KPI-Linked Subordinated Debt', desc: 'Step-up coupon if KPI missed; equity-like flex', premium: '+50–150bps if missed', eligibility: 'Bilateral / club' }].map(inst => (
                <div key={inst.inst} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{inst.inst}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>{inst.desc}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, marginTop: 3 }}>
                    <span style={{ color: T.green }}>{inst.premium}</span>
                    <span style={{ color: T.sky }}>{inst.eligibility}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Deal Structure by Instrument</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={['Green Bond', 'SLL', 'Transition Bond', 'Blended Finance', 'KPI-linked'].map(s => ({ struct: s, count: DEALS.filter(d => d.structure === s).length, capex: DEALS.filter(d => d.structure === s).reduce((a, d) => a + d.capex, 0) / 1000 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="struct" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="count" name="# Deals" fill={T.sky} />
                  <Bar dataKey="capex" name="CAPEX $B" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Abatement Pathway to 2050 (%)</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={timelineAbatement}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={v => [`${v}%`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  {SECTORS.map((s, i) => <Line key={s.id} dataKey={s.id} stroke={[T.steel, T.amber, T.sky, T.indigo, T.green, T.teal][i]} strokeWidth={2} dot={false} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Abatement vs Finance Need</div>
              {SECTORS.map(s => (
                <div key={s.id} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{s.name}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T.sub, marginTop: 2 }}>
                    <span>Routes: {s.routes}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 11 }}>
                    <span>2030 abatement: <strong style={{ color: T.sky }}>{s.abatement2030}%</strong></span>
                    <span>2050: <strong style={{ color: T.green }}>{s.abatement2050}%</strong></span>
                    <span>Finance: <strong style={{ color: T.amber }}>${s.financeNeed}B</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Blended Finance Capital Stack</div>
              {[['Senior Secured Debt', '40–50%', T.sky, 'Export credit / commercial banks'], ['DFI/MDB Loan', '10–15%', T.indigo, 'Concessional; sub-LIBOR'], ['Green/Transition Bond', '10–20%', T.green, 'Public markets; labeled'], ['KPI-Linked Facility', '5–10%', T.teal, 'Step-up coupon on miss'], ['Tax Equity / Grant', '5–10%', T.amber, 'IRA / EU Innovation Fund'], ['Sponsor Equity', '20–30%', T.steel, 'Committed from project co.']].map(([t, pct, color, note]) => (
                <div key={t} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span>{t}</span><span style={{ fontWeight: 600, color }}>{pct}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.sub, marginBottom: 3 }}>{note}</div>
                  <div style={{ background: T.border, borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: pct.split('–')[0] + '%', background: color, height: '100%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Global Blended Finance Programs (H2A)</div>
              {[{ prog: 'EU Innovation Fund', size: '€38B (2020–2030)', focus: 'Cement, Steel, Chemicals' }, { prog: 'US DOE Loan Programs', size: '$400B authority', focus: 'All industrial sectors' }, { prog: 'IEA CCUS Accelerator', size: 'Track + facilitate', focus: 'CCS in heavy industry' }, { prog: 'First Movers Coalition', size: '30+ corporates', focus: 'Advance market commitments' }, { prog: 'GFANZ Workstream', size: 'Policy-aligned', focus: 'Transition finance taxonomy' }, { prog: 'MDB Climate Finance', size: '$120B/yr target', focus: 'Emerging market H2A' }].map(p => (
                <div key={p.prog} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{p.prog}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T.sub, marginTop: 3 }}>
                    <span style={{ color: T.green }}>{p.size}</span><span>{p.focus}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>CI Reduction by Deal (Before → After)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={filtered.slice(0, 10).map(d => ({ name: d.name.split('-').slice(0, 2).join('-'), before: d.ci_before, after: d.ci_after, reduction: parseFloat(((d.ci_before - d.ci_after) / d.ci_before * 100).toFixed(0)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" tCO₂" />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="before" name="CI Before" fill={T.red} />
                  <Bar dataKey="after" name="CI After" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Portfolio Carbon Value @ ${carbonPrice}/tCO₂</div>
              {SECTORS.map(s => {
                const annualReduction = s.emissions * s.abatement2030 / 100;
                const carbonValue = Math.round(annualReduction * carbonPrice / 1e3);
                return (
                  <div key={s.id} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ fontWeight: 600 }}>{s.name}</span>
                      <span style={{ fontWeight: 700, color: T.green }}>${carbonValue}B/yr</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.sub }}>@{s.abatement2030}% abatement × {s.emissions} MtCO₂</div>
                  </div>
                );
              })}
              <div style={{ marginTop: 12, padding: '10px 12px', background: '#F0FFF4', borderRadius: 8, border: `1px solid ${T.green}` }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.green }}>Total Portfolio Carbon Value: ${SECTORS.reduce((s, sec) => s + Math.round(sec.emissions * sec.abatement2030 / 100 * carbonPrice / 1e3), 0)}B/yr</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
