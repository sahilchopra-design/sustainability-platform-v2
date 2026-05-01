import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#0f172a', card: '#1e293b', border: '#334155', muted: '#94a3b8',
  text: '#f1f5f9', sub: '#cbd5e1', accent: '#14B8A6',
  green: '#16A34A', amber: '#D97706', red: '#DC2626', indigo: '#6366F1',
  teal: '#0D9488', blue: '#2563EB', purple: '#7C3AED',
};

const KpiCard = ({ label, value, sub, color = T.accent }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px' }}>
    <div style={{ color: T.muted, fontSize: 12, marginBottom: 6 }}>{label}</div>
    <div style={{ color, fontSize: 26, fontWeight: 700 }}>{value}</div>
    {sub && <div style={{ color: T.sub, fontSize: 11, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Pill = ({ label, color = T.accent }) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}55`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{label}</span>
);

const PORTFOLIO_ASSETS = Array.from({ length: 28 }, (_, i) => ({
  name: ['Rotterdam Coastal Barrier', 'London TFL Cooling', 'Jakarta Mangrove Belt', 'Miami Beach Pump Sys', 'Philippines EWS', 'Dhaka Flood Retention', 'Copenhagen Climate Adapt', 'Singapore Marina Barrage', 'Tokyo Super Levee', 'NYC East Side Coastal', 'Lagos Flood Channels', 'Cape Town Water Recov', 'Medellín NbS Urban', 'Accra EWS Network', 'Kathmandu EQ Retrofit', 'Ho Chi Minh Dike', 'Chennai Sea Wall', 'Lima Water Harvesting', 'Casablanca Coastal', 'Istanbul Reservoir', 'Warsaw Green Infra', 'Nairobi Wetland Restore', 'Karachi Heat Cooling', 'Sao Paulo Green Roof', 'Melbourne Stormwater', 'Seoul Heat Corridor', 'Beijing Sponge City', 'Riyadh Urban Cooling'][i],
  type: ['Coastal Defense', 'Heat Adaptation', 'NbS', 'Flood Resilience', 'Early Warning', 'Water Security'][Math.floor(sr(i * 7) * 6)],
  region: ['EU', 'APAC', 'LATAM', 'Africa', 'N.America', 'MENA'][Math.floor(sr(i * 5) * 6)],
  capexM: Math.round(sr(i * 11) * 450 + 20),
  annualBenefitM: Math.round(sr(i * 13) * 80 + 5),
  bcr: +(sr(i * 9) * 10 + 2).toFixed(1),
  climateRisk: Math.round(sr(i * 3) * 40 + 40),
  adaptScore: Math.round(sr(i * 17) * 40 + 50),
  irrPct: +(sr(i * 19) * 10 + 4).toFixed(1),
  tenor: Math.round(sr(i * 23) * 25 + 15),
  financeSource: ['Green Bond', 'MDB Loan', 'Govt Budget', 'Blended', 'PPP'][Math.floor(sr(i * 15) * 5)],
  status: ['Operating', 'Construction', 'Development', 'Pipeline'][Math.floor(sr(i * 21) * 4)],
}));

const ALLOCATION_BY_TYPE = [
  { type: 'Flood Resilience', allocation: 32, count: 8, avgBCR: 6.8 },
  { type: 'Coastal Defense', allocation: 24, count: 6, avgBCR: 5.4 },
  { type: 'Heat Adaptation', allocation: 18, count: 5, avgBCR: 4.2 },
  { type: 'NbS', allocation: 12, count: 4, avgBCR: 7.6 },
  { type: 'Water Security', allocation: 8, count: 3, avgBCR: 5.1 },
  { type: 'Early Warning', allocation: 6, count: 2, avgBCR: 12.4 },
];

const RISK_RETURN = PORTFOLIO_ASSETS.slice(0, 20).map(a => ({
  name: a.name.split(' ').slice(0, 2).join(' '),
  risk: a.climateRisk,
  irrPct: a.irrPct,
  capex: a.capexM,
}));

const ATTRIBUTION = [
  { driver: 'Physical Risk Reduction', contribution: 42 },
  { driver: 'Economic Productivity Gain', contribution: 28 },
  { driver: 'Co-Benefit Monetisation', contribution: 14 },
  { driver: 'Carbon Credit Revenue', contribution: 8 },
  { driver: 'Insurance Premium Saving', contribution: 6 },
  { driver: 'Land Value Appreciation', contribution: 2 },
];

const REGION_RADAR = [
  { metric: 'BCR Score', EU: 82, APAC: 74, LATAM: 65, Africa: 58, MENA: 62, NAm: 78 },
  { metric: 'Adaptation Depth', EU: 88, APAC: 72, LATAM: 60, Africa: 52, MENA: 58, NAm: 80 },
  { metric: 'Finance Readiness', EU: 92, APAC: 70, LATAM: 58, Africa: 44, MENA: 64, NAm: 88 },
  { metric: 'Climate Urgency', EU: 54, APAC: 88, LATAM: 78, Africa: 94, MENA: 82, NAm: 62 },
  { metric: 'Co-benefits', EU: 74, APAC: 70, LATAM: 84, Africa: 78, MENA: 58, NAm: 68 },
  { metric: 'Policy Support', EU: 90, APAC: 68, LATAM: 62, Africa: 48, MENA: 60, NAm: 82 },
];

const CASHFLOW = Array.from({ length: 30 }, (_, i) => ({
  year: 2024 + i,
  capex: i < 3 ? -Math.round(sr(i * 7) * 50 + 80) : 0,
  opex: -Math.round(sr(i * 11) * 8 + 6),
  benefit: i >= 2 ? Math.round(sr(i * 13) * 15 + 22) : 0,
  cumulative: 0,
})).reduce((acc, row, idx) => {
  const prev = idx > 0 ? acc[idx - 1].cumulative : 0;
  acc.push({ ...row, cumulative: prev + row.capex + row.opex + row.benefit });
  return acc;
}, []);

const TABS = ['Portfolio Overview', 'Asset Scorecard', 'Risk-Return Map', 'Benefit Attribution', 'Regional Analysis', 'Cash Flow Model'];

export default function ClimateAdaptationPortfolioPage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [sortField, setSortField] = useState('bcr');

  const filtered = PORTFOLIO_ASSETS.filter(a =>
    (typeFilter === 'All' || a.type === typeFilter) &&
    (regionFilter === 'All' || a.region === regionFilter)
  );
  const sorted = useMemo(() => [...filtered].sort((a, b) => b[sortField] - a[sortField]), [filtered, sortField]);

  const avgBCR = filtered.length ? filtered.reduce((a, b) => a + b.bcr, 0) / filtered.length : 0;
  const totalCapex = filtered.reduce((a, b) => a + b.capexM, 0);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: 'Inter,sans-serif', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ background: T.accent + '22', border: `1px solid ${T.accent}`, borderRadius: 8, padding: '4px 12px', fontSize: 11, color: T.accent, fontWeight: 700 }}>EP-EK5</div>
          <Pill label="Adaptation Portfolio" color={T.accent} />
          <Pill label="Multi-Peril Resilience" color={T.blue} />
          <Pill label="Climate Infrastructure" color={T.green} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Climate Adaptation Portfolio</h1>
        <p style={{ color: T.muted, marginTop: 6, fontSize: 14 }}>Multi-hazard adaptation portfolio construction, asset-level BCR analytics, risk-return optimisation, benefit attribution, and regional allocation intelligence across climate resilience infrastructure.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Portfolio Assets" value={`${PORTFOLIO_ASSETS.length}`} sub="Across 6 adaptation types" color={T.accent} />
        <KpiCard label="Total CapEx" value={`$${totalCapex.toLocaleString()}M`} sub="Filtered portfolio" color={T.amber} />
        <KpiCard label="Avg BCR" value={`${avgBCR.toFixed(1)}x`} sub="Filtered portfolio" color={T.green} />
        <KpiCard label="Adaptation Gap 2030" value="$194Bn/yr" sub="UNEP Adaptation Gap Report" color={T.red} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ background: tab === i ? T.accent : T.card, color: tab === i ? '#fff' : T.sub, border: `1px solid ${tab === i ? T.accent : T.border}`, borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Portfolio Allocation by Type (%)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ALLOCATION_BY_TYPE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" stroke={T.muted} tick={{ fontSize: 9 }} />
                  <YAxis stroke={T.muted} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Bar dataKey="allocation" name="Allocation %" fill={T.accent} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Benefit Attribution (%)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ATTRIBUTION} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" stroke={T.muted} tick={{ fontSize: 11 }} unit="%" />
                  <YAxis dataKey="driver" type="category" stroke={T.muted} tick={{ fontSize: 9 }} width={140} />
                  <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                  <Bar dataKey="contribution" name="% of Total Benefit" fill={T.green} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {['All', 'Coastal Defense', 'Heat Adaptation', 'NbS', 'Flood Resilience', 'Water Security', 'Early Warning'].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{ background: typeFilter === t ? T.accent : T.card, color: typeFilter === t ? '#fff' : T.sub, border: `1px solid ${typeFilter === t ? T.accent : T.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{t}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {['All', 'EU', 'APAC', 'LATAM', 'Africa', 'N.America', 'MENA'].map(r => (
              <button key={r} onClick={() => setRegionFilter(r)} style={{ background: regionFilter === r ? T.teal : T.card, color: regionFilter === r ? '#fff' : T.sub, border: `1px solid ${regionFilter === r ? T.teal : T.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{r}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[['bcr', 'BCR'], ['irrPct', 'IRR'], ['adaptScore', 'Adapt Score'], ['capexM', 'CapEx']].map(([f, l]) => (
              <button key={f} onClick={() => setSortField(f)} style={{ background: sortField === f ? T.indigo : T.card, color: sortField === f ? '#fff' : T.sub, border: `1px solid ${sortField === f ? T.indigo : T.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Asset', 'Type', 'Region', 'CapEx ($M)', 'Annual Benefit', 'BCR', 'IRR %', 'Adapt Score', 'Tenor', 'Finance', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 10px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((a, i) => (
                    <tr key={a.name} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 === 0 ? T.bg + '55' : 'transparent' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{a.name}</td>
                      <td style={{ padding: '8px 10px' }}><Pill label={a.type} color={T.accent} /></td>
                      <td style={{ padding: '8px 10px' }}><Pill label={a.region} color={T.indigo} /></td>
                      <td style={{ padding: '8px 10px', color: T.amber }}>${a.capexM}M</td>
                      <td style={{ padding: '8px 10px', color: T.green }}>${a.annualBenefitM}M</td>
                      <td style={{ padding: '8px 10px', color: T.green, fontWeight: 700 }}>{a.bcr}x</td>
                      <td style={{ padding: '8px 10px' }}>{a.irrPct}%</td>
                      <td style={{ padding: '8px 10px' }}>{a.adaptScore}</td>
                      <td style={{ padding: '8px 10px' }}>{a.tenor}yr</td>
                      <td style={{ padding: '8px 10px' }}><Pill label={a.financeSource} color={T.teal} /></td>
                      <td style={{ padding: '8px 10px' }}><Pill label={a.status} color={a.status === 'Operating' ? T.green : a.status === 'Construction' ? T.accent : T.amber} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Risk-Return Map (Climate Risk vs IRR)</h3>
          <ResponsiveContainer width="100%" height={360}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="risk" name="Climate Risk Score" stroke={T.muted} tick={{ fontSize: 11 }} label={{ value: 'Climate Risk', position: 'insideBottom', offset: -5, fill: T.muted, fontSize: 11 }} />
              <YAxis dataKey="irrPct" name="IRR %" stroke={T.muted} tick={{ fontSize: 11 }} label={{ value: 'IRR %', angle: -90, position: 'insideLeft', fill: T.muted, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [n === 'IRR %' ? `${v}%` : v, n]} />
              <Scatter name="Portfolio Assets" data={RISK_RETURN} fill={T.accent} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Avg BCR by Asset Type</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ALLOCATION_BY_TYPE}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="type" stroke={T.muted} tick={{ fontSize: 9 }} />
                <YAxis stroke={T.muted} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Bar dataKey="avgBCR" name="Avg BCR" fill={T.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Benefit Attribution</h3>
            {ATTRIBUTION.map(a => (
              <div key={a.driver} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: T.sub }}>{a.driver}</span>
                  <span style={{ fontSize: 12, color: T.accent, fontWeight: 700 }}>{a.contribution}%</span>
                </div>
                <div style={{ height: 6, background: T.border, borderRadius: 3 }}>
                  <div style={{ width: `${a.contribution * 2}%`, height: '100%', background: T.accent, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Regional Adaptation Portfolio Radar</h3>
          <ResponsiveContainer width="100%" height={360}>
            <RadarChart data={REGION_RADAR}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="metric" tick={{ fill: T.muted, fontSize: 11 }} />
              <Radar name="EU" dataKey="EU" stroke={T.blue} fill={T.blue + '33'} />
              <Radar name="APAC" dataKey="APAC" stroke={T.accent} fill={T.accent + '22'} />
              <Radar name="Africa" dataKey="Africa" stroke={T.amber} fill={T.amber + '22'} />
              <Radar name="LATAM" dataKey="LATAM" stroke={T.green} fill={T.green + '22'} />
              <Legend />
              <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Illustrative 30-Year Portfolio Cash Flow ($M)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={CASHFLOW}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" stroke={T.muted} tick={{ fontSize: 11 }} />
              <YAxis stroke={T.muted} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="benefit" name="Annual Benefit" stroke={T.green} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="opex" name="OpEx" stroke={T.amber} strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="cumulative" name="Cumulative NCF" stroke={T.accent} strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
