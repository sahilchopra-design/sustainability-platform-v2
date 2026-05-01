import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ReferenceLine, ComposedChart } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E', sub: '#6B7280', accent: '#B8860B', indigo: '#4F46E5', green: '#065F46', red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', sky: '#0369A1' };

const TABS = ['LCOF Overview','Pathway Comparison','Feedstock Economics','Capital & Opex','Policy & IRA §40B','Sensitivity Analysis'];

const PATHWAYS = [
  { id: 'HEFA-UCO', name: 'HEFA-UCO', feedstock: 'Used Cooking Oil', maturity: 'Commercial', lcof: 1.85, capex: 320, yield: 0.78, ci: 28, cert: 'ISCC+/RSB' },
  { id: 'HEFA-Tallow', name: 'HEFA-Tallow', feedstock: 'Animal Tallow', maturity: 'Commercial', lcof: 2.10, capex: 340, yield: 0.76, ci: 35, cert: 'ISCC+' },
  { id: 'AtJ-Cellulosic', name: 'AtJ (Cellulosic)', feedstock: 'Cellulosic Ethanol', maturity: 'Early Comm.', lcof: 3.20, capex: 580, yield: 0.38, ci: 12, cert: 'ISCC+' },
  { id: 'FT-MSW', name: 'FT-MSW', feedstock: 'Municipal Solid Waste', maturity: 'Demo/Scale', lcof: 3.80, capex: 720, yield: 0.22, ci: 5, cert: 'RSB' },
  { id: 'FT-Agricultural', name: 'FT-Agricultural', feedstock: 'Agri Residues', maturity: 'Demo', lcof: 4.10, capex: 780, yield: 0.20, ci: 8, cert: 'RSB/ISCC+' },
  { id: 'PtL-DAC', name: 'PtL (DAC + GreenH2)', feedstock: 'CO₂ + Green H₂', maturity: 'Pilot', lcof: 6.80, capex: 1400, yield: 0.55, ci: -70, cert: 'RSB/CORSIA' },
];

const PROJECTS = Array.from({ length: 24 }, (_, i) => {
  const pw = PATHWAYS[Math.floor(sr(i * 7 + 1) * PATHWAYS.length)];
  const capMt = parseFloat((0.05 + sr(i * 11 + 2) * 0.95).toFixed(2));
  const lcof = parseFloat((pw.lcof * (0.88 + sr(i * 13 + 3) * 0.28)).toFixed(2));
  const country = ['USA', 'EU', 'UK', 'Japan', 'Australia', 'Singapore', 'UAE', 'Brazil'][Math.floor(sr(i * 17 + 4) * 8)];
  const status = ['Operating', 'Construction', 'FID', 'Engineering', 'Development'][Math.floor(sr(i * 19 + 5) * 5)];
  const irr = parseFloat((7 + sr(i * 23 + 6) * 14).toFixed(1));
  const corsia = sr(i * 29 + 7) > 0.5;
  return { id: i + 1, name: `${country}-SAF-${String.fromCharCode(65 + (i % 26))}${i + 1}`, pathway: pw.id, feedstock: pw.feedstock, capMt, lcof, country, status, irr, corsia, ci: Math.round(pw.ci * (0.9 + sr(i * 31 + 8) * 0.2)) };
});

const FEEDSTOCKS = [
  { name: 'Used Cooking Oil', price: 780, avail: 6.0, ci: 28, risk: 'High (policy-linked)' },
  { name: 'Animal Tallow', price: 620, avail: 4.5, ci: 35, risk: 'Medium' },
  { name: 'Cellulosic Ethanol', price: 420, avail: 120, ci: 12, risk: 'Low' },
  { name: 'MSW / RDF', price: 80, avail: 800, ci: 5, risk: 'Low' },
  { name: 'Agricultural Residues', price: 95, avail: 500, ci: 8, risk: 'Low-Medium' },
  { name: 'Green Hydrogen (PtL)', price: 4200, avail: 'Limited', ci: -70, risk: 'High (H₂ supply)' },
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: '1 1 160px' }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Pill = ({ v }) => {
  const map = { Operating: T.green, Construction: T.blue, FID: T.indigo, Engineering: T.amber, Development: T.sub, Commercial: T.green, 'Early Comm.': T.blue, 'Demo/Scale': T.amber, Demo: T.amber, Pilot: T.sub };
  return <span style={{ background: map[v] || T.sub, color: '#fff', fontSize: 10, borderRadius: 12, padding: '2px 8px', fontWeight: 600 }}>{v}</span>;
};

export default function SafLcofEnginePage() {
  const [tab, setTab] = useState(0);
  const [selPathway, setSelPathway] = useState('ALL');
  const [selCountry, setSelCountry] = useState('ALL');
  const [carbonPrice, setCarbonPrice] = useState(80);
  const [hydrogenPrice, setHydrogenPrice] = useState(4.5);
  const [feedstockPremium, setFeedstockPremium] = useState(0);

  const countries = useMemo(() => ['ALL', ...new Set(PROJECTS.map(p => p.country))], []);
  const filtered = useMemo(() => PROJECTS.filter(p =>
    (selPathway === 'ALL' || p.pathway === selPathway) &&
    (selCountry === 'ALL' || p.country === selCountry)
  ), [selPathway, selCountry]);

  const avgLcof = useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.lcof, 0) / filtered.length).toFixed(2) : '—', [filtered]);
  const avgIrr = useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.irr, 0) / filtered.length).toFixed(1) : '—', [filtered]);
  const corsiaShare = useMemo(() => filtered.length ? Math.round(filtered.filter(p => p.corsia).length / filtered.length * 100) : 0, [filtered]);

  const pathwayChart = PATHWAYS.map(pw => ({ name: pw.id.split('-')[0], lcof: pw.lcof, capex: pw.capex / 100, ci: Math.abs(pw.ci) }));

  const learningCurve = Array.from({ length: 10 }, (_, i) => {
    const yr = 2024 + i;
    return {
      year: yr,
      HEFA: parseFloat((1.85 * Math.pow(0.97, i)).toFixed(2)),
      AtJ: parseFloat((3.20 * Math.pow(0.92, i)).toFixed(2)),
      FT: parseFloat((3.80 * Math.pow(0.90, i)).toFixed(2)),
      PtL: parseFloat((6.80 * Math.pow(0.85, i)).toFixed(2)),
    };
  });

  const sensitivityData = useMemo(() => {
    const base = 3.50;
    return [
      { param: 'Feedstock +20%', delta: +(base * 0.18).toFixed(2), dir: 'up' },
      { param: 'Green H₂ price', delta: +(hydrogenPrice * 0.08 - 0.22).toFixed(2), dir: hydrogenPrice > 3 ? 'up' : 'dn' },
      { param: `Carbon price $${carbonPrice}`, delta: -(carbonPrice * 0.006).toFixed(2), dir: 'dn' },
      { param: 'WACC +2pp', delta: +0.32, dir: 'up' },
      { param: 'IRA §40B credit', delta: -1.25, dir: 'dn' },
      { param: 'Capacity factor -10%', delta: +0.28, dir: 'up' },
    ];
  }, [carbonPrice, hydrogenPrice]);

  const iraCredit = carbonPrice > 50 ? 1.75 : 1.25;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      {/* Header */}
      <div style={{ background: '#0C1A2E', padding: '20px 32px', borderBottom: `3px solid ${T.sky}` }}>
        <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>EP-EF1 · SAF Finance Suite</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>Sustainable Aviation Fuel — LCOF Engine</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>HEFA · AtJ · FT · Power-to-Liquid · CORSIA · IRA §40B · 24 Projects · 6 Pathways</div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#0C1A2E', display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid #1E3A5F` }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 18px', fontSize: 12, fontWeight: tab === i ? 700 : 400, color: tab === i ? T.sky : '#94A3B8', background: 'none', border: 'none', borderBottom: tab === i ? `2px solid ${T.sky}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '28px 32px' }}>
        {/* KPI Row */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Avg LCOF (filtered)" value={`$${avgLcof}/L`} sub="Levelized Cost of Fuel" color={T.sky} />
          <KpiCard label="Projects" value={filtered.length} sub={`of ${PROJECTS.length} total`} color={T.indigo} />
          <KpiCard label="CORSIA Eligible" value={`${corsiaShare}%`} sub="Book-and-Claim qualified" color={T.green} />
          <KpiCard label="Avg Project IRR" value={`${avgIrr}%`} sub="Unlevered pre-tax" color={T.amber} />
          <KpiCard label="IRA §40B Credit" value={`$${iraCredit}/gallon`} sub={`Carbon price $${carbonPrice}/tCO₂`} color={T.teal} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <select value={selPathway} onChange={e => setSelPathway(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, background: T.card, color: T.text }}>
            <option value="ALL">All Pathways</option>
            {PATHWAYS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={selCountry} onChange={e => setSelCountry(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, background: T.card, color: T.text }}>
            {countries.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All Countries' : c}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>
            <span>Carbon Price: ${carbonPrice}/t</span>
            <input type="range" min={20} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 100 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>
            <span>H₂ Price: ${hydrogenPrice}/kg</span>
            <input type="range" min={1} max={10} step={0.5} value={hydrogenPrice} onChange={e => setHydrogenPrice(+e.target.value)} style={{ width: 100 }} />
          </div>
        </div>

        {tab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>LCOF by Pathway ($/L)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={pathwayChart} margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="$/L" />
                    <Tooltip formatter={(v, n) => [n === 'lcof' ? `$${v}/L` : n === 'capex' ? `$${(v * 100).toFixed(0)}M/Mt` : `${v} gCO₂/MJ`, n]} />
                    <Bar dataKey="lcof" name="LCOF" fill={T.sky} radius={[4, 4, 0, 0]} />
                    <ReferenceLine y={0.80} stroke={T.green} strokeDasharray="4 2" label={{ value: 'Jet-A $0.80', position: 'insideTopRight', fontSize: 10 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>LCOF Learning Curves 2024–2033</div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={learningCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="$/L" />
                    <Tooltip formatter={v => [`$${v}/L`]} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Line dataKey="HEFA" stroke={T.green} strokeWidth={2} dot={false} />
                    <Line dataKey="AtJ" stroke={T.sky} strokeWidth={2} dot={false} />
                    <Line dataKey="FT" stroke={T.amber} strokeWidth={2} dot={false} />
                    <Line dataKey="PtL" stroke={T.indigo} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Project Pipeline ({filtered.length} projects)</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#F8F7F4' }}>
                      {['Project', 'Pathway', 'Country', 'Cap (Mt/yr)', 'LCOF ($/L)', 'IRR (%)', 'CORSIA', 'CI (gCO₂/MJ)', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 12).map((p, i) => (
                      <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 ? '#FAFAF7' : T.card }}>
                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>{p.name}</td>
                        <td style={{ padding: '8px 12px', color: T.sub }}>{p.pathway}</td>
                        <td style={{ padding: '8px 12px' }}>{p.country}</td>
                        <td style={{ padding: '8px 12px' }}>{p.capMt}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: p.lcof < 2.5 ? T.green : p.lcof > 5 ? T.red : T.amber }}>${p.lcof}</td>
                        <td style={{ padding: '8px 12px' }}>{p.irr}%</td>
                        <td style={{ padding: '8px 12px' }}>{p.corsia ? '✓' : '—'}</td>
                        <td style={{ padding: '8px 12px', color: p.ci < 20 ? T.green : p.ci < 50 ? T.amber : T.sub }}>{p.ci}</td>
                        <td style={{ padding: '8px 12px' }}><Pill v={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Pathway Specifications</div>
              {PATHWAYS.map(pw => (
                <div key={pw.id} style={{ padding: '12px 0', borderBottom: `1px solid ${T.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{pw.name}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>{pw.feedstock}</div>
                    <Pill v={pw.maturity} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: T.sub }}>LCOF</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: pw.lcof < 3 ? T.green : pw.lcof > 5 ? T.red : T.amber }}>${pw.lcof}/L</div>
                    <div style={{ fontSize: 11, color: T.sub }}>CAPEX: ${pw.capex}M/Mt</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: T.sub }}>Carbon Intensity</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: pw.ci < 20 ? T.green : pw.ci > 40 ? T.amber : T.text }}>{pw.ci} gCO₂/MJ</div>
                    <div style={{ fontSize: 11, color: T.sub }}>Cert: {pw.cert}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>CAPEX vs LCOF Scatter</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="capex" name="CAPEX" unit=" M$" tick={{ fontSize: 11 }} label={{ value: 'CAPEX ($M/Mt/yr)', position: 'insideBottom', offset: -8, fontSize: 11 }} />
                  <YAxis dataKey="lcof" name="LCOF" unit=" $/L" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => n === 'capex' ? [`$${v}M/Mt`, 'CAPEX'] : [`$${v}/L`, 'LCOF']} />
                  <Scatter data={PATHWAYS.map(p => ({ capex: p.capex, lcof: p.lcof, name: p.id }))} fill={T.sky} />
                </ScatterChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 16, marginBottom: 10 }}>Mandate Coverage by 2030</div>
              {[{ region: 'EU ReFuelEU', mandate: 6, achieved: 2.1, color: T.indigo }, { region: 'US SAF Grand Challenge', mandate: 11, achieved: 1.2, color: T.sky }, { region: 'UK SAF Mandate', mandate: 10, achieved: 0.8, color: T.green }, { region: 'Japan GIF', mandate: 10, achieved: 0.3, color: T.amber }, { region: 'Singapore Blending', mandate: 1, achieved: 0.1, color: T.teal }].map(m => (
                <div key={m.region} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span>{m.region}</span><span style={{ color: T.sub }}>Target: {m.mandate}% | Now: {m.achieved}%</span>
                  </div>
                  <div style={{ background: T.border, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, m.achieved / m.mandate * 100)}%`, background: m.color, height: '100%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Feedstock Market Intelligence</div>
              {FEEDSTOCKS.map((f, i) => (
                <div key={f.name} style={{ padding: '12px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{f.name}</div>
                    <div style={{ fontWeight: 700, color: T.amber, fontSize: 14 }}>${f.price}/t</div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: T.sub }}>
                    <span>Availability: {typeof f.avail === 'number' ? `${f.avail}M t/yr` : f.avail}</span>
                    <span>CI: {f.ci} gCO₂/MJ</span>
                    <span>Supply Risk: {f.risk}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Feedstock Cost Stack ($/L SAF)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={PATHWAYS.map(pw => ({ name: pw.id.replace('-', '\n'), feed: parseFloat((pw.lcof * 0.52).toFixed(2)), cap: parseFloat((pw.lcof * 0.28).toFixed(2)), op: parseFloat((pw.lcof * 0.12).toFixed(2)), other: parseFloat((pw.lcof * 0.08).toFixed(2)) }))} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$/L" />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="feed" name="Feedstock" stackId="a" fill={T.amber} />
                  <Bar dataKey="cap" name="Capital" stackId="a" fill={T.sky} />
                  <Bar dataKey="op" name="Opex" stackId="a" fill={T.green} />
                  <Bar dataKey="other" name="Other" stackId="a" fill={T.indigo} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Capital Cost Benchmarks</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={PATHWAYS.map(pw => ({ name: pw.id.split('-')[0], capex: pw.capex }))} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit=" $M" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={v => [`$${v}M/Mt/yr`, 'CAPEX']} />
                  <Bar dataKey="capex" fill={T.sky} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Opex Breakdown (% of LCOF)</div>
              {[['Feedstock / Inputs', 52, T.amber], ['CAPEX Amortization', 28, T.sky], ['Operations & Maintenance', 12, T.green], ['Other (G&A, Insurance)', 8, T.indigo]].map(([label, pct, color]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>{label}</span><span style={{ fontWeight: 600, color }}>{pct}%</span>
                  </div>
                  <div style={{ background: T.border, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
              <div style={{ background: '#F0F7FF', borderRadius: 10, padding: 14, marginTop: 16, border: `1px solid ${T.sky}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.sky, marginBottom: 6 }}>IRA §40B SAF Credit (2023–2027)</div>
                <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.6 }}>
                  $1.25–$1.75/gallon base credit | CI reduction ≥50% vs Jet-A required<br />
                  Additional $0.01/gal per % CI reduction above 50%<br />
                  Max $1.75/gal (>0% lifecycle CI). SAF blendstock must be ≥50% SAF.
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Policy Landscape</div>
              {[
                { policy: 'IRA §40B (USA)', value: '$1.25–1.75/gal', expires: '2027', scope: 'HEFA/AtJ/FT/PtL' },
                { policy: 'EU ReFuelEU Aviation', value: '6% SAF by 2030', expires: 'Permanent', scope: 'CORSIA-eligible' },
                { policy: 'UK Sustainable Aviation', value: '10% by 2030', expires: 'Permanent', scope: 'All ASTM D7566' },
                { policy: 'Japan GIF (METI)', value: '$2B subsidy pool', expires: '2030', scope: 'PtL + HEFA' },
                { policy: 'Singapore Blending Mandate', value: '1% by 2026', expires: 'Rolling', scope: 'CORSIA-eligible' },
                { policy: 'CORSIA Offset/Credit', value: '~$5–50/tCO₂', expires: 'Phase II 2027', scope: 'International flights' },
              ].map(p => (
                <div key={p.policy} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.policy}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: T.sub, marginTop: 3 }}>
                    <span style={{ color: T.green, fontWeight: 600 }}>{p.value}</span>
                    <span>Expires: {p.expires}</span>
                    <span>Scope: {p.scope}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Net LCOF After IRA §40B ($/L)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={PATHWAYS.map(pw => ({ name: pw.id.split('-')[0], gross: pw.lcof, net: parseFloat(Math.max(0, pw.lcof - iraCredit * 0.264).toFixed(2)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$/L" />
                  <Tooltip formatter={v => [`$${v}/L`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="gross" name="Gross LCOF" fill={T.amber} />
                  <Bar dataKey="net" name="Net After Credit" fill={T.green} />
                  <ReferenceLine y={0.80} stroke={T.red} strokeDasharray="4 2" label={{ value: 'Jet-A', fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>LCOF Sensitivity (delta from $3.50/L base)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={sensitivityData} layout="vertical" margin={{ left: 140 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="$/L" />
                  <YAxis dataKey="param" type="category" tick={{ fontSize: 11 }} width={140} />
                  <Tooltip formatter={v => [`${v > 0 ? '+' : ''}$${v}/L`, 'Delta LCOF']} />
                  <Bar dataKey="delta" name="LCOF Delta" fill={T.sky} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Monte Carlo LCOF Distribution</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={Array.from({ length: 20 }, (_, i) => ({ bin: (1.5 + i * 0.35).toFixed(1), freq: Math.round(50 * Math.exp(-0.5 * Math.pow((i - 8) / 4, 2))) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="bin" tick={{ fontSize: 11 }} unit="$/L" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="freq" fill={T.sky} stroke={T.sky} fillOpacity={0.3} />
                  <ReferenceLine x="4.3" stroke={T.red} strokeDasharray="4 2" label={{ value: 'P90', fontSize: 10 }} />
                  <ReferenceLine x="3.5" stroke={T.green} strokeDasharray="4 2" label={{ value: 'P50', fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
