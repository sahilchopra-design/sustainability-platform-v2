import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E', sub: '#6B7280', indigo: '#4F46E5', green: '#065F46', red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', sky: '#0369A1', steel: '#374151' };
const TABS = ['Technology Overview', 'Project Economics', 'Abatement Pathways', 'Carbon Value', 'Market Intelligence', 'Transition Roadmap'];

const TECHNOLOGIES = [
  { id: 'Conventional', name: 'Conventional Portland Cement', ci: 0.82, lcop: 85, capex: 320, maturity: 'Mature', abatement: 0 },
  { id: 'OxyfuelCCS', name: 'Oxyfuel + CCS', ci: 0.10, lcop: 145, capex: 680, maturity: 'Pilot/Demo', abatement: 88 },
  { id: 'LC3', name: 'LC³ (Calcined Clay + Limestone)', ci: 0.50, lcop: 80, capex: 95, maturity: 'Early Comm.', abatement: 39 },
  { id: 'CCUS_PostComb', name: 'Post-Combustion CCS', ci: 0.12, lcop: 125, capex: 520, maturity: 'Demo', abatement: 85 },
  { id: 'AlternativeBinder', name: 'Geopolymer / Alt. Binders', ci: 0.15, lcop: 95, capex: 180, maturity: 'Early Comm.', abatement: 82 },
  { id: 'ElectricKiln', name: 'Electric Kiln (Green Power)', ci: 0.25, lcop: 110, capex: 420, maturity: 'Pilot', abatement: 70 },
  { id: 'NovaLinko', name: 'Novacem / Calix LEILAC', ci: 0.05, lcop: 155, capex: 750, maturity: 'R&D/Demo', abatement: 94 },
];

const PROJECTS = Array.from({ length: 18 }, (_, i) => {
  const tech = TECHNOLOGIES[Math.floor(sr(i * 7 + 1) * TECHNOLOGIES.length)];
  const capMt = parseFloat((0.5 + sr(i * 11 + 2) * 4.5).toFixed(1));
  const country = ['Germany', 'France', 'USA', 'Japan', 'India', 'China', 'Brazil', 'UK', 'Spain'][Math.floor(sr(i * 13 + 3) * 9)];
  const status = ['Operating', 'Construction', 'FID', 'Engineering', 'Feasibility'][Math.floor(sr(i * 17 + 4) * 5)];
  const lcop = parseFloat((tech.lcop * (0.9 + sr(i * 19 + 5) * 0.25)).toFixed(0));
  const irr = parseFloat((5 + sr(i * 23 + 6) * 10).toFixed(1));
  return { id: i + 1, name: `${country.substring(0, 3)}-${tech.id.substring(0, 6)}-${i + 1}`, tech: tech.id, country, status, capMt, lcop, irr, ci: parseFloat((tech.ci * (0.9 + sr(i * 29 + 7) * 0.2)).toFixed(2)), capex: Math.round(tech.capex * capMt) };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: '1 1 150px' }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);
const Pill = ({ v }) => {
  const c = { Operating: T.green, Construction: T.sky, FID: T.indigo, Engineering: T.amber, Feasibility: T.sub, Mature: T.steel, 'Early Comm.': T.sky, Demo: T.amber, Pilot: T.sub, 'Pilot/Demo': T.amber, 'R&D/Demo': T.sub }[v] || T.sub;
  return <span style={{ background: c, color: '#fff', fontSize: 10, borderRadius: 12, padding: '2px 8px', fontWeight: 600 }}>{v}</span>;
};

export default function GreenCementConcreteFinancePage() {
  const [tab, setTab] = useState(0);
  const [carbonPrice, setCarbonPrice] = useState(80);
  const [selTech, setSelTech] = useState('ALL');

  const filtered = useMemo(() => PROJECTS.filter(p => selTech === 'ALL' || p.tech === selTech), [selTech]);
  const avgLcop = useMemo(() => filtered.length ? Math.round(filtered.reduce((s, p) => s + p.lcop, 0) / filtered.length) : 0, [filtered]);
  const avgCi = useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.ci, 0) / filtered.length).toFixed(2) : '—', [filtered]);

  const lcaComparison = TECHNOLOGIES.map(t => ({
    name: t.id.substring(0, 8),
    process: parseFloat((t.ci * 0.55).toFixed(2)),
    calcination: parseFloat((t.ci * 0.35).toFixed(2)),
    other: parseFloat((t.ci * 0.10).toFixed(2)),
    net: t.ci,
  }));

  const carbonValueChart = TECHNOLOGIES.map(t => ({
    name: t.id.substring(0, 8),
    carbonCost: parseFloat((t.ci * carbonPrice).toFixed(1)),
    abatementValue: parseFloat(((0.82 - t.ci) * carbonPrice).toFixed(1)),
  }));

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      <div style={{ background: '#0C1A2E', padding: '20px 32px', borderBottom: `3px solid ${T.steel}` }}>
        <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>EP-EG4 · Green Steel Suite</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>Green Cement & Low-Carbon Concrete Finance</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>LC³ · Oxyfuel CCS · LEILAC · Geopolymer · Electric Kiln · 7 Technologies · 18 Projects</div>
      </div>
      <div style={{ background: '#0C1A2E', display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid #1E3A5F` }}>
        {TABS.map((t, i) => <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 18px', fontSize: 12, fontWeight: tab === i ? 700 : 400, color: tab === i ? '#94A3B8' : '#6B7280', background: 'none', border: 'none', borderBottom: tab === i ? `2px solid #94A3B8` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>)}
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Avg LCOP (filtered)" value={`$${avgLcop}/t`} sub="Levelized Cost of Production" color={T.steel} />
          <KpiCard label="Projects" value={filtered.length} sub="in pipeline" color={T.indigo} />
          <KpiCard label="Avg CI" value={`${avgCi} tCO₂/t`} sub="Clinker / cement" color={avgCi < 0.4 ? T.green : T.amber} />
          <KpiCard label="Cement Sector CI" value="0.82 tCO₂/t" sub="Global average 2024" color={T.red} />
          <KpiCard label="Net Zero Target" value="0.10 tCO₂/t" sub="GCCA 2050 roadmap" color={T.teal} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <select value={selTech} onChange={e => setSelTech(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, background: T.card, color: T.text }}>
            <option value="ALL">All Technologies</option>
            {TECHNOLOGIES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>Carbon Price: ${carbonPrice}/t</span><input type="range" min={20} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 100 }} /></div>
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>CI vs LCOP by Technology</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={TECHNOLOGIES.map(t => ({ name: t.id.substring(0, 8), lcop: t.lcop, ci: t.ci * 100 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="$/t" />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit=" gCO₂" />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="lcop" name="LCOP $/t" fill={T.steel} />
                  <Bar yAxisId="r" dataKey="ci" name="CI (gCO₂×100)" fill={T.red} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Technology Overview</div>
              {TECHNOLOGIES.map(t => (
                <div key={t.id} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{t.name}</span>
                    <Pill v={t.maturity} />
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T.sub }}>
                    <span>CI: {t.ci} tCO₂/t</span>
                    <span>LCOP: ${t.lcop}/t</span>
                    <span>Abatement: <strong style={{ color: T.green }}>{t.abatement}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Project Pipeline ({filtered.length} projects)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: '#F8F7F4' }}>
                  {['Project', 'Technology', 'Country', 'Cap (Mt)', 'LCOP $/t', 'CI tCO₂/t', 'IRR %', 'CAPEX $M', 'Status'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 ? '#FAFAF7' : T.card }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: '8px 12px', fontSize: 11, color: T.sub }}>{p.tech}</td>
                      <td style={{ padding: '8px 12px' }}>{p.country}</td>
                      <td style={{ padding: '8px 12px' }}>{p.capMt}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: p.lcop < 100 ? T.green : T.amber }}>${p.lcop}</td>
                      <td style={{ padding: '8px 12px', color: p.ci < 0.3 ? T.green : T.amber }}>{p.ci}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: p.irr >= 10 ? T.green : T.amber }}>{p.irr}%</td>
                      <td style={{ padding: '8px 12px' }}>${p.capex}M</td>
                      <td style={{ padding: '8px 12px' }}><Pill v={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>CO₂ Sources in Cement (tCO₂/t clinker)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={lcaComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" t" />
                  <Tooltip formatter={v => [`${v} tCO₂/t`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="calcination" name="Calcination (process)" stackId="a" fill={T.red} />
                  <Bar dataKey="process" name="Thermal (fuel)" stackId="a" fill={T.amber} />
                  <Bar dataKey="other" name="Other" stackId="a" fill={T.sub} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Abatement % by Technology</div>
              {TECHNOLOGIES.map(t => (
                <div key={t.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span>{t.name.split(' ').slice(0, 2).join(' ')}</span>
                    <span style={{ fontWeight: 600, color: t.abatement > 70 ? T.green : t.abatement > 40 ? T.sky : T.amber }}>{t.abatement}%</span>
                  </div>
                  <div style={{ background: T.border, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${t.abatement}%`, background: t.abatement > 70 ? T.green : t.abatement > 40 ? T.sky : T.amber, height: '100%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Carbon Value & Abatement Benefit @ ${carbonPrice}/t</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={carbonValueChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="abatementValue" name="Abatement Benefit" fill={T.green} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="carbonCost" name="Carbon Cost" fill={T.red} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Break-Even Carbon Price by Technology</div>
              {TECHNOLOGIES.filter(t => t.id !== 'Conventional').map(t => {
                const breakeven = t.lcop > 85 ? Math.round((t.lcop - 85) / (0.82 - t.ci)) : 0;
                return (
                  <div key={t.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span>{t.name.split(' ').slice(0, 3).join(' ')}</span>
                      <span style={{ fontWeight: 600, color: breakeven <= carbonPrice ? T.green : T.red }}>${breakeven}/tCO₂</span>
                    </div>
                    <div style={{ background: T.border, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, breakeven / 200 * 100)}%`, background: breakeven <= carbonPrice ? T.green : T.red, height: '100%', borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Global Cement Sector Emissions (GtCO₂)</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={[2024, 2027, 2030, 2035, 2040, 2050].map(yr => ({ year: yr, baseline: parseFloat((4.2 + (yr - 2024) * 0.05).toFixed(1)), nze: parseFloat(Math.max(0.4, (4.2 - (yr - 2024) * 0.26)).toFixed(1)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" Gt" />
                  <Tooltip formatter={v => [`${v} GtCO₂`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="baseline" name="Baseline (no action)" fill={T.red} stroke={T.red} fillOpacity={0.2} />
                  <Area type="monotone" dataKey="nze" name="NZE Pathway" fill={T.green} stroke={T.green} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Market Intelligence</div>
              {[['Global cement production', '4.1 Gt/yr (2024)'], ['Sector CI average', '0.82 tCO₂/t clinker'], ['Process CO₂ share', '~60% of total (calcination)'], ['GCCA 2030 target', '20% reduction vs 2020'], ['GCCA 2050 target', 'Net zero (<0.10 tCO₂/t)'], ['LC³ cost premium', '~5% over OPC (scale-up)'], ['CCS cement projects', '>15 under development globally'], ['EU ETS cement 2024', '€62/t (full exposure 2026)'], ['Green concrete premium', '10–25% over conventional'], ['Concrete carbonation', 'Re-absorbs ~20% of process CO₂']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 600, maxWidth: '50%', textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Decarbonization Pathway to 2050</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[2025, 2030, 2035, 2040, 2050].map(yr => {
                  const base = 0.82;
                  const eff = base * (1 - (yr - 2025) * 0.008);
                  const af = base * (yr >= 2030 ? (yr - 2025) * 0.010 : 0);
                  const ccs = base * (yr >= 2030 ? (yr - 2025) * 0.018 : 0);
                  const lc3 = base * (yr >= 2026 ? (yr - 2025) * 0.012 : 0);
                  return { year: yr, efficiency: parseFloat(eff.toFixed(2)), alt_fuels: parseFloat(af.toFixed(2)), ccs_capture: parseFloat(ccs.toFixed(2)), lc3_blend: parseFloat(lc3.toFixed(2)) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" tCO₂" />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="efficiency" name="Efficiency" stackId="a" fill={T.steel} />
                  <Bar dataKey="alt_fuels" name="Alt Fuels" stackId="a" fill={T.amber} />
                  <Bar dataKey="lc3_blend" name="LC³/Blends" stackId="a" fill={T.sky} />
                  <Bar dataKey="ccs_capture" name="CCS Capture" stackId="a" fill={T.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Investment Needed per Lever ($B/yr global)</div>
              {[['Efficiency improvements', 8, T.steel], ['Alternative fuels/biomass', 12, T.amber], ['LC³ & blended cements', 15, T.sky], ['Novel binders (geopolymer)', 6, T.teal], ['CCS / LEILAC', 38, T.green], ['Electrification of kilns', 22, T.indigo]].map(([label, val, color]) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span>{label}</span><span style={{ fontWeight: 600, color }}>${val}B/yr</span>
                  </div>
                  <div style={{ background: T.border, borderRadius: 4, height: 7, overflow: 'hidden' }}>
                    <div style={{ width: `${val / 38 * 100}%`, background: color, height: '100%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
