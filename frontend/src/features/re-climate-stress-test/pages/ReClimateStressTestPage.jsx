import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const T = {
  bg: '#FDF4FF', card: '#FFFFFF', border: '#E9D5FF', text: '#2E1065',
  sub: '#5B21B6', accent: '#7C3AED', light: '#F3E8FF',
  red: '#DC2626', amber: '#D97706', green: '#16A34A',
  blue: '#2563EB', teal: '#0D9488',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SCENARIOS = [
  { id: 'NZ2050', label: 'Net Zero 2050', physTemp: 1.5, transRisk: 35, physRisk: 15, ltv_impact: -3.2, noi_impact: -1.8, capRate_impact: +0.25, vacancy_impact: +0.5 },
  { id: 'Below2', label: 'Below 2°C (Delayed)', physTemp: 1.8, transRisk: 55, physRisk: 25, ltv_impact: -8.5, noi_impact: -5.2, capRate_impact: +0.65, vacancy_impact: +2.2 },
  { id: 'NDC', label: 'Nationally Determined', physTemp: 2.7, transRisk: 30, physRisk: 45, ltv_impact: -15.0, noi_impact: -9.5, capRate_impact: +1.10, vacancy_impact: +4.8 },
  { id: 'HotHouse', label: 'Current Policies (3.5°C)', physTemp: 3.5, transRisk: 10, physRisk: 80, ltv_impact: -28.0, noi_impact: -18.0, capRate_impact: +2.20, vacancy_impact: +10.5 },
];

const SECTOR_RISK = [
  { sector: 'Prime Office', physRisk: 20, transRisk: 65, epcExposure: 35, floodExposure: 18, heatExposure: 22, overallRisk: 42 },
  { sector: 'Secondary Office', physRisk: 35, transRisk: 80, epcExposure: 68, floodExposure: 28, heatExposure: 35, overallRisk: 68 },
  { sector: 'Prime Retail', physRisk: 30, transRisk: 55, epcExposure: 45, floodExposure: 35, heatExposure: 30, overallRisk: 52 },
  { sector: 'Logistics/Industrial', physRisk: 25, transRisk: 40, epcExposure: 30, floodExposure: 42, heatExposure: 20, overallRisk: 38 },
  { sector: 'Residential BTR', physRisk: 28, transRisk: 70, epcExposure: 72, floodExposure: 25, heatExposure: 32, overallRisk: 60 },
  { sector: 'Hotel', physRisk: 40, transRisk: 50, epcExposure: 55, floodExposure: 30, heatExposure: 55, overallRisk: 58 },
];

const PORTFOLIO = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  asset: `Asset-${i + 1}`,
  sector: SECTOR_RISK[i % SECTOR_RISK.length].sector,
  country: ['UK', 'Germany', 'France', 'Netherlands', 'Spain', 'Italy'][i % 6],
  value: Math.round(20 + sr(i * 13) * 180),
  epc: ['A', 'B', 'C', 'D', 'E'][i % 5],
  floodZone: i % 4 === 0 ? 'High' : i % 3 === 0 ? 'Medium' : 'Low',
  physStress: (sr(i * 23) * 30).toFixed(1),
  transStress: (sr(i * 31) * 45).toFixed(1),
  totalImpact: (-(sr(i * 37) * 28)).toFixed(1),
}));

const TABS = ['Portfolio Heatmap', 'Scenario Analysis', 'Sector Risk Radar', 'Physical Risk', 'Transition Risk', 'Reporting'];

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

export default function ReClimateStressTestPage() {
  const [tab, setTab] = useState(0);
  const [scenario, setScenario] = useState('Below2');

  const sel = useMemo(() => SCENARIOS.find(s => s.id === scenario) || SCENARIOS[1], [scenario]);

  const portfolioValue = useMemo(() => PORTFOLIO.reduce((a, p) => a + p.value, 0), []);
  const stressedValue = useMemo(() => (portfolioValue * (1 + sel.ltv_impact / 100)).toFixed(0), [portfolioValue, sel]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ background: T.accent + '22', color: T.accent, border: `1px solid ${T.accent}44`, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>EP-EI4</span>
            <span style={{ fontSize: 12, color: T.sub }}>Real Estate Climate Stress Testing</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>Real Estate Climate Stress Testing</h1>
          <p style={{ color: T.sub, marginTop: 4, fontSize: 14 }}>NGFS scenario analysis for REIT and real estate portfolios — physical + transition risk, LTV / NOI / cap rate impacts, and regulatory reporting</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>Active Scenario:</span>
          {SCENARIOS.map(s => (
            <button key={s.id} onClick={() => setScenario(s.id)} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${T.border}`, background: scenario === s.id ? T.accent : T.card, color: scenario === s.id ? '#fff' : T.text, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>{s.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <KpiCard label="Warming Pathway" value={`${sel.physTemp}°C`} sub="by 2100" color={sel.physTemp > 2.5 ? T.red : T.amber} />
          <KpiCard label="LTV Impact" value={`${sel.ltv_impact}%`} sub="portfolio value shift" color={T.red} />
          <KpiCard label="NOI Impact" value={`${sel.noi_impact}%`} sub="net operating income" color={T.accent} />
          <KpiCard label="Cap Rate Shift" value={`+${sel.capRate_impact}%`} sub="decompression" color={T.blue} />
          <KpiCard label="Vacancy Delta" value={`+${sel.vacancy_impact}%`} sub="occupancy pressure" color={T.amber} />
          <KpiCard label="Stressed NAV" value={`€${stressedValue}M`} sub={`vs base €${portfolioValue}M`} color={T.teal} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: tab === i ? T.accent : T.light, color: tab === i ? '#fff' : T.text, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: T.light }}>{['#', 'Asset', 'Sector', 'Country', 'Value (€M)', 'EPC', 'Flood Zone', 'Physical Stress', 'Transition Stress', 'Total Impact'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}</tr></thead>
              <tbody>
                {PORTFOLIO.map((p, i) => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: T.accent }}>{p.id}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.asset}</td>
                    <td style={{ padding: '8px 12px' }}>{p.sector}</td>
                    <td style={{ padding: '8px 12px' }}><Pill label={p.country} color={T.blue} /></td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>€{p.value}M</td>
                    <td style={{ padding: '8px 12px' }}><Pill label={`EPC ${p.epc}`} color={p.epc <= 'B' ? T.green : p.epc <= 'C' ? T.amber : T.red} /></td>
                    <td style={{ padding: '8px 12px' }}><Pill label={p.floodZone} color={p.floodZone === 'High' ? T.red : p.floodZone === 'Medium' ? T.amber : T.green} /></td>
                    <td style={{ padding: '8px 12px', color: T.red }}>-{p.physStress}%</td>
                    <td style={{ padding: '8px 12px', color: T.blue }}>-{p.transStress}%</td>
                    <td style={{ padding: '8px 12px', color: T.red, fontWeight: 700 }}>{p.totalImpact}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>LTV Impact by Scenario (%)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={SCENARIOS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="ltv_impact" fill={T.red} radius={[4, 4, 0, 0]} name="LTV Impact %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Physical vs Transition Risk (%)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={SCENARIOS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="physRisk" fill={T.red + '88'} name="Physical Risk" />
                  <Bar dataKey="transRisk" fill={T.blue} name="Transition Risk" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Sector Risk Radar</h3>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={SECTOR_RISK.map(s => ({ subject: s.sector.split(' ')[0], physRisk: s.physRisk, transRisk: s.transRisk, epcExposure: s.epcExposure }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <Radar name="Physical Risk" dataKey="physRisk" stroke={T.red} fill={T.red} fillOpacity={0.2} />
                  <Radar name="Transition Risk" dataKey="transRisk" stroke={T.blue} fill={T.blue} fillOpacity={0.2} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Overall Risk Score by Sector</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={SECTOR_RISK} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="sector" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip />
                  <Bar dataKey="overallRisk" fill={T.accent} radius={[0, 4, 4, 0]} name="Overall Risk Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Physical Risk Profile by Hazard Type</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={SECTOR_RISK}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="floodExposure" fill={T.blue} name="Flood Exposure %" />
                  <Bar dataKey="heatExposure" fill={T.red + '88'} name="Heat Exposure %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, gridColumn: '1 / -1' }}>
              <h3 style={{ color: T.text, marginTop: 0 }}>Transition Risk — EPC Exposure vs Carbon Cost by Sector</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={SECTOR_RISK}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="epcExposure" fill={T.amber} name="EPC D-G Exposure %" />
                  <Bar dataKey="transRisk" fill={T.accent} name="Transition Risk Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { req: 'TCFD Climate Risk Disclosure', body: 'TCFD / IFRS S2', scope: 'Physical + transition risk narrative + quantitative impact', reFreq: 'Annual', applies: 'Listed REITs, large funds' },
              { req: 'ECB Climate Stress Test', body: 'European Central Bank', scope: 'Loan portfolio physical + transition risk under NGFS scenarios', reFreq: 'Biennial', applies: 'EU banks; indirect REIT impact via mortgage lending' },
              { req: 'ESRB/EIOPA RE Stress Test', body: 'ESRB + EIOPA', scope: 'Insurance + pension fund RE exposures under climate scenarios', reFreq: 'Ad-hoc', applies: 'EU insurers, pension funds with RE portfolios' },
              { req: 'SFDR PAI RE Indicators', body: 'ESMA / SFDR Level 2', scope: 'PAI 18: fossil fuel real estate; PAI 19: energy inefficient real estate', reFreq: 'Annual', applies: 'EU SFDR Article 8/9 real estate funds' },
            ].map(r => (
              <div key={r.req} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 6 }}>{r.req}</div>
                <Pill label={r.body} color={T.accent} />
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <div style={{ color: T.sub, marginBottom: 4 }}><strong>Scope:</strong> {r.scope}</div>
                  <div style={{ color: T.sub, marginBottom: 4 }}><strong>Frequency:</strong> {r.reFreq}</div>
                  <div style={{ color: T.sub }}><strong>Applies to:</strong> {r.applies}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
