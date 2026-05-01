import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E', sub: '#6B7280', indigo: '#4F46E5', green: '#065F46', red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', sky: '#0369A1', steel: '#374151' };
const TABS = ['CBAM Overview', 'Sector Exposure', 'Country Impact', 'Certificate Pricing', 'Compliance Costs', 'Strategic Responses'];

const CBAM_SECTORS = [
  { id: 'Steel', name: 'Iron & Steel', trad2023: 8.4, avgCI: 1.85, euEts: 62, cbaFactor: 0.35, phase: 'Full (2026)' },
  { id: 'Cement', name: 'Cement & Clinker', trad2023: 4.2, avgCI: 0.82, euEts: 62, cbaFactor: 0.28, phase: 'Full (2026)' },
  { id: 'Aluminium', name: 'Aluminium', trad2023: 3.8, avgCI: 11.5, euEts: 62, cbaFactor: 0.42, phase: 'Full (2026)' },
  { id: 'Fertilisers', name: 'Fertilisers (N)', trad2023: 2.1, avgCI: 2.20, euEts: 62, cbaFactor: 0.22, phase: 'Full (2026)' },
  { id: 'Electricity', name: 'Electricity', trad2023: 1.9, avgCI: 0.35, euEts: 62, cbaFactor: 0.90, phase: 'Full (2026)' },
  { id: 'Hydrogen', name: 'Hydrogen', trad2023: 0.4, avgCI: 10.0, euEts: 62, cbaFactor: 0.15, phase: 'Proposed (2027)' },
  { id: 'Chemicals', name: 'Organic Chemicals', trad2023: 0.2, avgCI: 2.80, euEts: 62, cbaFactor: 0.08, phase: 'Under study' },
];

const COUNTRIES = Array.from({ length: 20 }, (_, i) => {
  const country = ['China', 'Russia', 'Turkey', 'Ukraine', 'India', 'Brazil', 'USA', 'Japan', 'South Korea', 'Vietnam', 'Taiwan', 'Egypt', 'Algeria', 'Morocco', 'Mexico', 'Indonesia', 'Kazakhstan', 'Malaysia', 'Thailand', 'Pakistan'][i] || 'Other';
  const steelExport = parseFloat((sr(i * 7 + 1) * 8).toFixed(1));
  const ci = parseFloat((1.2 + sr(i * 11 + 2) * 1.4).toFixed(2));
  const annualCbam = parseFloat((steelExport * ci * 62 * 1e6 / 1e9).toFixed(2));
  const riskLevel = annualCbam > 1.5 ? 'High' : annualCbam > 0.5 ? 'Medium' : 'Low';
  return { id: i + 1, country, steelExport, ci, annualCbam, riskLevel };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: '1 1 150px' }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function CbamAnalyticsCompliancePage() {
  const [tab, setTab] = useState(0);
  const [euEts, setEuEts] = useState(62);
  const [selSector, setSelSector] = useState('ALL');

  const filteredCountries = useMemo(() => COUNTRIES.filter(c => c.steelExport > 0), []);
  const totalCbamRevenue = useMemo(() => COUNTRIES.reduce((s, c) => s + c.annualCbam, 0).toFixed(1), []);
  const highRisk = useMemo(() => COUNTRIES.filter(c => c.riskLevel === 'High').length, []);

  const sectorExposure = CBAM_SECTORS.map(s => ({
    name: s.id,
    annualCbam: parseFloat((s.trad2023 * s.avgCI * euEts * s.cbaFactor / 1000).toFixed(2)),
    tradeValue: s.trad2023,
    ci: s.avgCI,
  }));

  const timelineChart = [2024, 2025, 2026, 2027, 2028, 2030, 2032, 2034].map(yr => ({
    year: yr,
    free_alloc: Math.round(100 * Math.max(0, (2034 - yr) / (2034 - 2026))),
    cbam_rate: Math.round(100 * Math.min(1, Math.max(0, (yr - 2026) / (2034 - 2026)))),
    certificate_price: Math.round(euEts * (1 + (yr - 2024) * 0.03)),
  }));

  const strategicOptions = [
    { strategy: 'Decarbonize production (DRI-H₂)', cost: 200, saving: 145, payback: 3, risk: 'Low', priority: 1 },
    { strategy: 'Green H₂ supply agreements', cost: 80, saving: 110, payback: 2, risk: 'Medium', priority: 2 },
    { strategy: 'Shift to EAF scrap route', cost: 120, saving: 90, payback: 2, risk: 'Low', priority: 3 },
    { strategy: 'EU production relocation', cost: 350, saving: 140, payback: 5, risk: 'High', priority: 4 },
    { strategy: 'CBAM certificate purchasing', cost: 62, saving: 0, payback: 0, risk: 'Low', priority: 5 },
    { strategy: 'Carbon offsets (limited)', cost: 25, saving: 15, payback: 1, risk: 'High', priority: 6 },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      <div style={{ background: '#0C1A2E', padding: '20px 32px', borderBottom: `3px solid ${T.steel}` }}>
        <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>EP-EG3 · Green Steel Suite</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>CBAM Analytics & Compliance Finance</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>EU Carbon Border Adjustment · Steel · Cement · Aluminium · 7 Sectors · 20 Countries</div>
      </div>
      <div style={{ background: '#0C1A2E', display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid #1E3A5F` }}>
        {TABS.map((t, i) => <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 18px', fontSize: 12, fontWeight: tab === i ? 700 : 400, color: tab === i ? '#94A3B8' : '#6B7280', background: 'none', border: 'none', borderBottom: tab === i ? `2px solid #94A3B8` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>)}
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="EU ETS Price" value={`€${euEts}/t`} sub="Phase 4 current" color={T.indigo} />
          <KpiCard label="Sectors Covered" value={CBAM_SECTORS.filter(s => s.phase.includes('Full')).length} sub="Full from 2026" color={T.sky} />
          <KpiCard label="High Risk Countries" value={highRisk} sub="Annual CBAM > €1.5B" color={T.red} />
          <KpiCard label="Est. CBAM Revenue" value={`€${totalCbamRevenue}B`} sub="At current ETS price" color={T.amber} />
          <KpiCard label="Free Allocation 2026" value="0%" sub="Fully phased in by 2034" color={T.teal} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>EU ETS Price: €{euEts}/t</span><input type="range" min={30} max={200} value={euEts} onChange={e => setEuEts(+e.target.value)} style={{ width: 100 }} /></div>
          <select value={selSector} onChange={e => setSelSector(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, background: T.card, color: T.text }}>
            <option value="ALL">All Sectors</option>
            {CBAM_SECTORS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>CBAM Phase-in Timeline</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={timelineChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="€/t" />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="l" dataKey="free_alloc" name="Free Allocation %" stroke={T.amber} strokeWidth={2} dot={false} />
                  <Line yAxisId="l" dataKey="cbam_rate" name="CBAM Rate %" stroke={T.sky} strokeWidth={2} dot={false} />
                  <Line yAxisId="r" dataKey="certificate_price" name="Certificate €/t" stroke={T.green} strokeWidth={2} dot={false} strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>CBAM Framework</div>
              {[['Transition Period', '2023–2025: Reporting only'], ['Full Operational', 'From 1 Jan 2026'], ['Phase-out Free Alloc.', '2026–2034 (10yr linear)'], ['Sectors (Full)', 'Steel, Cement, Al, Fertiliser, Elec.'], ['Sectors (Proposed)', 'Hydrogen, Organics (2027+)'], ['Certificate', 'CBAM certificate = 1 tCO₂'], ['Price Link', 'Weekly avg EU ETS auction price'], ['Importers', 'EU registered CBAM declarants'], ['Third-country offset', 'Credit for carbon price paid at origin'], ['Scope', 'Direct + some indirect emissions']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Annual CBAM Cost by Sector (€B at €{euEts}/t)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sectorExposure} layout="vertical" margin={{ left: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="€B" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip formatter={v => [`€${v}B/yr`, 'CBAM Cost']} />
                  <Bar dataKey="annualCbam" fill={T.steel} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Sector Breakdown</div>
              {CBAM_SECTORS.map(s => (
                <div key={s.id} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: T.sub }}>{s.phase}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T.sub }}>
                    <span>Trade: €{s.trad2023}B</span>
                    <span>CI: {s.avgCI} tCO₂/t</span>
                    <span style={{ color: T.red, fontWeight: 600 }}>CBAM: €{(s.trad2023 * s.avgCI * euEts * s.cbaFactor / 1000).toFixed(1)}B</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Top 10 Countries by CBAM Exposure (€B)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={[...COUNTRIES].sort((a, b) => b.annualCbam - a.annualCbam).slice(0, 10).map(c => ({ name: c.country.substring(0, 7), cbam: c.annualCbam }))} layout="vertical" margin={{ left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 11 }} unit="€B" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip formatter={v => [`€${v}B/yr`]} />
                    <Bar dataKey="cbam" fill={T.red} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Country Risk Table</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead><tr style={{ background: '#F8F7F4' }}>
                      {['Country', 'Steel Export Mt', 'CI tCO₂/t', 'Annual CBAM €B', 'Risk'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {[...COUNTRIES].sort((a, b) => b.annualCbam - a.annualCbam).slice(0, 10).map((c, i) => (
                        <tr key={c.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 ? '#FAFAF7' : T.card }}>
                          <td style={{ padding: '7px 10px', fontWeight: 500 }}>{c.country}</td>
                          <td style={{ padding: '7px 10px' }}>{c.steelExport}</td>
                          <td style={{ padding: '7px 10px', color: c.ci > 1.5 ? T.red : T.amber }}>{c.ci}</td>
                          <td style={{ padding: '7px 10px', fontWeight: 600, color: T.red }}>€{c.annualCbam}B</td>
                          <td style={{ padding: '7px 10px' }}><span style={{ background: c.riskLevel === 'High' ? T.red : c.riskLevel === 'Medium' ? T.amber : T.green, color: '#fff', fontSize: 10, borderRadius: 12, padding: '2px 8px' }}>{c.riskLevel}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>CBAM Certificate Price Scenarios (€/tCO₂)</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={Array.from({ length: 8 }, (_, i) => ({ year: 2026 + i, base: Math.round(euEts * (1 + i * 0.04)), bull: Math.round(euEts * (1 + i * 0.08)), bear: Math.round(euEts * (1 + i * 0.01)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="€/t" />
                  <Tooltip formatter={v => [`€${v}/t`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="bull" name="Bull" fill={T.green} stroke={T.green} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="base" name="Base" fill={T.sky} stroke={T.sky} fillOpacity={0.2} />
                  <Area type="monotone" dataKey="bear" name="Bear" fill={T.amber} stroke={T.amber} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Certificate Cost per Tonne Steel Imported</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[30, 50, 75, 100, 130, 160, 200].map(p => ({ price: `€${p}`, bfbof: Math.round(1.85 * p), driNg: Math.round(1.10 * p), driH2: Math.round(0.05 * p), eafScrap: Math.round(0.60 * p) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="price" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="€/t" />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="bfbof" name="BF-BOF" fill={T.red} />
                  <Bar dataKey="driNg" name="DRI-NG" fill={T.amber} />
                  <Bar dataKey="driH2" name="DRI-H₂" fill={T.green} />
                  <Bar dataKey="eafScrap" name="EAF Scrap" fill={T.sky} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Compliance Cost Breakdown</div>
              {CBAM_SECTORS.filter(s => s.phase.includes('Full')).map(s => (
                <div key={s.id} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{s.name}</div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 11, color: T.sub, marginTop: 3 }}>
                    <span>CI: {s.avgCI} tCO₂/t</span>
                    <span>CBAM @ €{euEts}: <strong style={{ color: T.red }}>€{(s.avgCI * euEts).toFixed(0)}/t</strong></span>
                    <span>As % of value: <strong>{(s.avgCI * euEts / (s.trad2023 * 1e9 / 5e6) * 100).toFixed(1)}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>CBAM Cost vs Free Allocation Phase-Out</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={[2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034].map(yr => {
                  const pct = (yr - 2026) / (2034 - 2026);
                  const cbam = Math.round(1.85 * euEts * pct);
                  const saved = Math.round(1.85 * euEts * (1 - pct));
                  return { year: yr, cbam_cost: cbam, free_saved: saved };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="€/t" />
                  <Tooltip formatter={v => [`€${v}/t steel`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="cbam_cost" name="CBAM cost" fill={T.red} stroke={T.red} fillOpacity={0.3} />
                  <Area type="monotone" dataKey="free_saved" name="Free alloc. saving" fill={T.green} stroke={T.green} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Strategic Response Options</div>
              {[...strategicOptions].sort((a, b) => a.priority - b.priority).map(s => (
                <div key={s.strategy} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{s.strategy}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T.sub, marginTop: 3 }}>
                    <span>Cost: <strong style={{ color: T.red }}>${s.cost}/t</strong></span>
                    <span>CBAM saving: <strong style={{ color: T.green }}>${s.saving}/t</strong></span>
                    <span>Risk: <strong style={{ color: s.risk === 'Low' ? T.green : s.risk === 'Medium' ? T.amber : T.red }}>{s.risk}</strong></span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Cost vs Saving by Strategy ($/t)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={strategicOptions.map(s => ({ name: s.strategy.split(' ').slice(0, 2).join(' '), cost: s.cost, saving: s.saving }))} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="$/t" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={v => [`$${v}/t`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="cost" name="Cost $/t" fill={T.red} />
                  <Bar dataKey="saving" name="CBAM Saving $/t" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
