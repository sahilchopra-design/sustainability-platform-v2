import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E', sub: '#6B7280', indigo: '#4F46E5', green: '#065F46', red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', sky: '#0369A1' };
const TABS = ['Policy Overview', 'Mandate Tracker', 'CORSIA Intelligence', 'IRA §40B Deep Dive', 'Market Impact', 'Compliance Modeler'];

const POLICIES = [
  { id: 'ReFuelEU', name: 'EU ReFuelEU Aviation', region: 'EU', mandate2025: 2, mandate2030: 6, mandate2035: 20, mandate2050: 70, mechanism: 'Blending mandate', credit: 'None', pathways: 'All ASTM D7566', note: 'Airport refueling obligation; 5× for PtL from 2030' },
  { id: 'UK_SAF', name: 'UK Sustainable Aviation Mandate', region: 'UK', mandate2025: 2, mandate2030: 10, mandate2035: 22, mandate2050: 75, mechanism: 'Blending mandate', credit: 'SAF certificates', pathways: 'All ASTM D7566', note: 'Tradeable SAF certificates system' },
  { id: 'IRA40B', name: 'IRA §40B SAF Credit (USA)', region: 'USA', mandate2025: 0, mandate2030: 0, mandate2035: 0, mandate2050: 0, mechanism: 'Production tax credit', credit: '$1.25–1.75/gal', pathways: 'All sustainable pathways', note: 'Expires 2027; §45Z replaces 2025+' },
  { id: 'SAF_GC', name: 'US SAF Grand Challenge', region: 'USA', mandate2025: 0, mandate2030: 0, mandate2035: 0, mandate2050: 100, mechanism: 'Aspirational target', credit: 'Multiple', pathways: 'All', note: 'No mandate; 3B gal/yr by 2030, 100% by 2050' },
  { id: 'Japan_GIF', name: 'Japan Green Innovation Fund (SAF)', region: 'Japan', mandate2025: 0, mandate2030: 10, mandate2035: 15, mandate2050: 50, mechanism: 'Grant/Subsidy', credit: '¥150B SAF fund', pathways: 'HEFA + PtL', note: 'METI-managed; bilateral GHG credit links' },
  { id: 'SG_Blend', name: 'Singapore SAF Blending', region: 'Singapore', mandate2025: 0.5, mandate2030: 1, mandate2035: 3, mandate2050: 10, mechanism: 'Airport mandate', credit: 'ETS offset', pathways: 'CORSIA-eligible', note: 'Changi Airport; CAAS-regulated' },
  { id: 'CORSIA', name: 'ICAO CORSIA Phase II', region: 'Global', mandate2025: 0, mandate2030: 0, mandate2035: 0, mandate2050: 0, mechanism: 'Carbon offset', credit: '$5–50/tCO₂', pathways: 'CORSIA eligible', note: 'Voluntary 2021–2026; mandatory from 2027' },
  { id: 'AU_SAF', name: 'Australia SAF Mandate (Proposed)', region: 'Australia', mandate2025: 0, mandate2030: 5, mandate2035: 10, mandate2050: 50, mechanism: 'Proposed mandate', credit: 'LGC-based', pathways: 'HEFA + FT', note: 'Under consultation 2024; likely 2026 start' },
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: '1 1 150px' }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function SafPolicyMandatePage() {
  const [tab, setTab] = useState(0);
  const [selRegion, setSelRegion] = useState('ALL');
  const [year, setYear] = useState(2030);
  const [annualProd, setAnnualProd] = useState(0.3);
  const [pathway, setPathway] = useState('HEFA');

  const filtered = useMemo(() => POLICIES.filter(p => selRegion === 'ALL' || p.region === selRegion), [selRegion]);
  const regions = useMemo(() => ['ALL', ...new Set(POLICIES.map(p => p.region))], []);

  const mandateAt = (p) => year <= 2025 ? p.mandate2025 : year <= 2030 ? p.mandate2025 + (p.mandate2030 - p.mandate2025) * (year - 2025) / 5 : year <= 2035 ? p.mandate2030 + (p.mandate2035 - p.mandate2030) * (year - 2030) / 5 : p.mandate2035 + (p.mandate2050 - p.mandate2035) * (year - 2035) / 15;

  const mandateChart = filtered.map(p => ({ name: p.id, mandate: parseFloat(mandateAt(p).toFixed(1)), region: p.region }));

  const timelineChart = [2024, 2026, 2028, 2030, 2035, 2040, 2050].map(yr => ({
    year: yr,
    EU: POLICIES.find(p => p.id === 'ReFuelEU') ? parseFloat((yr <= 2025 ? 2 : yr <= 2030 ? 6 : yr <= 2035 ? 20 : yr <= 2040 ? 37 : 70).toFixed(0)) : 0,
    UK: parseFloat((yr <= 2025 ? 2 : yr <= 2030 ? 10 : yr <= 2035 ? 22 : yr <= 2040 ? 40 : 75).toFixed(0)),
    Japan: parseFloat((yr <= 2025 ? 0 : yr <= 2030 ? 10 : yr <= 2035 ? 15 : yr <= 2040 ? 30 : 50).toFixed(0)),
    Singapore: parseFloat((yr <= 2025 ? 0.5 : yr <= 2030 ? 1 : yr <= 2035 ? 3 : yr <= 2040 ? 6 : 10).toFixed(1)),
  }));

  const corsiaData = Array.from({ length: 8 }, (_, i) => ({
    year: 2024 + i,
    emissions: parseFloat((800 + i * 45).toFixed(0)),
    baseline: 770,
    offset: parseFloat(Math.max(0, (800 + i * 45 - 770) * (i < 3 ? 0.15 : 0.85)).toFixed(0)),
  }));

  const iraCalc = useMemo(() => {
    const gallons = annualProd * 1e6 * 264;
    const ciReduction = pathway === 'HEFA' ? 65 : pathway === 'PtL' ? 120 : 50;
    const creditPerGal = Math.min(1.75, 1.25 + Math.max(0, ciReduction - 50) * 0.01);
    return { gallons: gallons.toFixed(0), creditPerGal: creditPerGal.toFixed(2), annualCredit: (gallons * creditPerGal / 1e6).toFixed(1) };
  }, [annualProd, pathway]);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      <div style={{ background: '#0C1A2E', padding: '20px 32px', borderBottom: `3px solid ${T.sky}` }}>
        <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>EP-EF4 · SAF Finance Suite</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>SAF Policy & Mandate Intelligence</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>ReFuelEU · UK Mandate · IRA §40B/§45Z · CORSIA · Japan GIF · 8 Jurisdictions</div>
      </div>
      <div style={{ background: '#0C1A2E', display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid #1E3A5F` }}>
        {TABS.map((t, i) => <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 18px', fontSize: 12, fontWeight: tab === i ? 700 : 400, color: tab === i ? T.sky : '#94A3B8', background: 'none', border: 'none', borderBottom: tab === i ? `2px solid ${T.sky}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>)}
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Jurisdictions" value={filtered.length} sub="Active mandates / policies" color={T.sky} />
          <KpiCard label="EU 2030 Target" value="6%" sub="ReFuelEU blending mandate" color={T.indigo} />
          <KpiCard label="IRA §40B Max Credit" value="$1.75/gal" sub="For CI reduction ≥100%" color={T.green} />
          <KpiCard label="CORSIA from" value="2027" sub="Mandatory Phase II" color={T.amber} />
          <KpiCard label="Global 2050 SAF Demand" value="~450Mt" sub="IATA net-zero scenario" color={T.teal} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <select value={selRegion} onChange={e => setSelRegion(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, background: T.card, color: T.text }}>
            {regions.map(r => <option key={r} value={r}>{r === 'ALL' ? 'All Regions' : r}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}>
            <span>Target Year: {year}</span>
            <input type="range" min={2025} max={2050} step={1} value={year} onChange={e => setYear(+e.target.value)} style={{ width: 120 }} />
          </div>
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>SAF Mandate at {year} (%)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={mandateChart} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={v => [`${v.toFixed(1)}%`, 'Mandate']} />
                  <Bar dataKey="mandate" fill={T.sky} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Policy Detail Cards</div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {filtered.map(p => (
                  <div key={p.id} style={{ padding: '12px', borderBottom: `1px solid ${T.border}`, background: '#FAFAF7', borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>{p.mechanism} | {p.credit}</div>
                    <div style={{ fontSize: 11, marginTop: 4, display: 'flex', gap: 12 }}>
                      <span style={{ color: T.green }}>2030: {p.mandate2030}%</span>
                      <span style={{ color: T.amber }}>2035: {p.mandate2035}%</span>
                      <span style={{ color: T.indigo }}>2050: {p.mandate2050}%</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{p.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Mandate Trajectories by Jurisdiction</div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={timelineChart}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={v => [`${v}%`]} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="EU" stroke={T.indigo} strokeWidth={2} dot={false} />
                <Line dataKey="UK" stroke={T.sky} strokeWidth={2} dot={false} />
                <Line dataKey="Japan" stroke={T.green} strokeWidth={2} dot={false} />
                <Line dataKey="Singapore" stroke={T.amber} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>CORSIA Emissions vs Baseline (MtCO₂)</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={corsiaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" Mt" />
                  <Tooltip formatter={v => [`${v} Mt`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="emissions" name="Total Emissions" stroke={T.red} fill={T.red} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="offset" name="Offset Required" stroke={T.sky} fill={T.sky} fillOpacity={0.3} />
                  <ReferenceLine y={770} stroke={T.amber} strokeDasharray="4 2" label={{ value: 'CORSIA Baseline', fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>CORSIA Framework</div>
              {[['Phase', 'Pilot (2021–2023): voluntary'], ['Phase I', '2024–2026: voluntary'], ['Phase II', '2027–2035: mandatory (180 states)'], ['Eligible Fuels', 'CORSIA-eligible SAF only'], ['MRV', 'ICAO-approved methodologies'], ['Offset price', '$5–50/tCO₂ in 2024'], ['SAF credit', 'Full lifecycle CI reduction'], ['Double counting', 'Prohibited with EU ETS']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                  <span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>IRA §40B Credit Calculator</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>Annual Production ({annualProd} Mt/yr)</div>
                  <input type="range" min={0.05} max={2} step={0.05} value={annualProd} onChange={e => setAnnualProd(+e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>Pathway</div>
                  <select value={pathway} onChange={e => setPathway(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, background: T.card, color: T.text, width: '100%' }}>
                    {['HEFA', 'AtJ', 'FT-MSW', 'PtL'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 20, background: '#F0FFF4', borderRadius: 10, padding: 16, border: `1px solid ${T.green}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.green, marginBottom: 8 }}>IRA §40B Credit Calculation</div>
                {[['Annual Production', `${annualProd} Mt/yr`], ['Gallons per Mt', '264 gal/t'], ['Total Gallons', `${Number(iraCalc.gallons).toLocaleString()}`], ['Credit Rate', `$${iraCalc.creditPerGal}/gal`], ['Annual IRA Credit', `$${iraCalc.annualCredit}M`]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid #D1FAE5`, fontSize: 12 }}>
                    <span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 700, color: T.green }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>§40B Credit by Production Scale</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[0.1, 0.3, 0.5, 0.8, 1.0, 1.5, 2.0].map(cap => ({ cap, credit: parseFloat((cap * 1e6 * 264 * 1.50 / 1e6).toFixed(1)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="cap" tick={{ fontSize: 11 }} unit=" Mt" />
                  <YAxis tick={{ fontSize: 11 }} unit="$M" />
                  <Tooltip formatter={v => [`$${v}M/yr`, 'IRA Credit']} />
                  <Bar dataKey="credit" fill={T.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>SAF Demand from Mandates (Mt/yr)</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={[2025, 2027, 2030, 2035, 2040, 2050].map(yr => ({ year: yr, EU: parseFloat((yr <= 2025 ? 1.5 : yr <= 2030 ? 4.8 : yr <= 2035 ? 16 : yr <= 2040 ? 28 : 56).toFixed(1)), UK: parseFloat((yr <= 2025 ? 0.6 : yr <= 2030 ? 3.2 : yr <= 2035 ? 7 : yr <= 2040 ? 14 : 24).toFixed(1)), USA: parseFloat((yr <= 2025 ? 0.5 : yr <= 2030 ? 3.3 : yr <= 2035 ? 11 : yr <= 2040 ? 22 : 50).toFixed(1)), Japan: parseFloat((yr <= 2025 ? 0 : yr <= 2030 ? 3.8 : yr <= 2035 ? 5.7 : yr <= 2040 ? 11 : 19).toFixed(1)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" Mt" />
                  <Tooltip formatter={v => [`${v} Mt`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="EU" stackId="a" fill={T.indigo} stroke={T.indigo} fillOpacity={0.7} />
                  <Area type="monotone" dataKey="UK" stackId="a" fill={T.sky} stroke={T.sky} fillOpacity={0.7} />
                  <Area type="monotone" dataKey="USA" stackId="a" fill={T.green} stroke={T.green} fillOpacity={0.7} />
                  <Area type="monotone" dataKey="Japan" stackId="a" fill={T.amber} stroke={T.amber} fillOpacity={0.7} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>SAF Price Under Mandates ($/L)</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={[2024, 2026, 2028, 2030, 2033, 2035, 2040, 2050].map(yr => ({ year: yr, withMandate: parseFloat((4.2 - (yr - 2024) * 0.08).toFixed(2)), noMandate: parseFloat((3.2 - (yr - 2024) * 0.05).toFixed(2)), jetA: parseFloat((0.85 + (yr - 2024) * 0.015).toFixed(2)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$/L" />
                  <Tooltip formatter={v => [`$${v}/L`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="withMandate" name="SAF w/ Mandate" stroke={T.sky} strokeWidth={2} dot={false} />
                  <Line dataKey="noMandate" name="SAF w/o Mandate" stroke={T.amber} strokeWidth={2} dot={false} strokeDasharray="5 3" />
                  <Line dataKey="jetA" name="Jet-A" stroke={T.green} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Compliance Cost by Airline ($/seat)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[{ airline: 'Long-haul', base: 12, mandate: 22 }, { airline: 'Short-haul EU', base: 4, mandate: 8 }, { airline: 'US Domestic', base: 3, mandate: 5 }, { airline: 'Asia-Pacific', base: 8, mandate: 14 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="airline" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$/seat" />
                  <Tooltip formatter={v => [`$${v}/seat`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="base" name="Base (2024)" fill={T.sky} />
                  <Bar dataKey="mandate" name="Mandate 2030" fill={T.amber} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Compliance Roadmap</div>
              {POLICIES.filter(p => p.mandate2030 > 0).map(p => (
                <div key={p.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span>{p.name.split(' ').slice(0, 3).join(' ')}</span>
                    <span style={{ color: T.sky }}>{p.mandate2030}% by 2030</span>
                  </div>
                  <div style={{ background: T.border, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, p.mandate2030 * 5)}%`, background: T.sky, height: '100%', borderRadius: 4 }} />
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
