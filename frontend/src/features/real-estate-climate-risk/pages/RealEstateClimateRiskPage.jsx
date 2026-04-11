import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const CITIES = ['London', 'Manchester', 'Birmingham', 'Bristol', 'Leeds', 'Edinburgh', 'Glasgow', 'Cardiff'];
const TYPES = ['Office', 'Retail', 'Residential', 'Industrial', 'Hotel', 'Mixed-Use', 'Logistics', 'Healthcare'];
const EPC_RATINGS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const SCENARIOS = ['Orderly', 'Disorderly', 'Hot House'];

const PROPERTIES = Array.from({ length: 100 }, (_, i) => {
  const city = CITIES[Math.floor(sr(i * 7) * CITIES.length)];
  const type = TYPES[Math.floor(sr(i * 11) * TYPES.length)];
  const epcRating = EPC_RATINGS[Math.floor(sr(i * 13) * EPC_RATINGS.length)];
  const buildYear = Math.round(1960 + sr(i * 17) * 63);
  const floodRisk = parseFloat((1 + sr(i * 3) * 4).toFixed(1));
  const heatRisk = parseFloat((1 + sr(i * 5) * 4).toFixed(1));
  const subsistenceRisk = parseFloat((1 + sr(i * 9) * 4).toFixed(1));
  const transitionRisk = parseFloat((1 + sr(i * 19) * 4).toFixed(1));
  const physicalRiskScore = parseFloat(((floodRisk + heatRisk + subsistenceRisk) / 3).toFixed(2));
  const ltvRatio = parseFloat((40 + sr(i * 23) * 50).toFixed(1));
  const insurancePremium = Math.round(2000 + sr(i * 29) * 28000);
  const epcIndex = EPC_RATINGS.indexOf(epcRating);
  const strandedYear = epcIndex >= 4 && physicalRiskScore > 3 ? 2025 + Math.round(sr(i * 31) * 20) : null;
  return {
    id: i + 1,
    name: `${type} ${city} ${i + 1}`,
    city, type, floodRisk, heatRisk, subsistenceRisk, transitionRisk,
    physicalRiskScore, epcRating, buildYear, ltvRatio, insurancePremium, strandedYear,
  };
});

const TABS = [
  'Risk Overview', 'Physical Hazards', 'Transition Exposure', 'Stranding Timeline',
  'Insurance Impact', 'LTV Sensitivity', 'Climate Scenario', 'Regulatory Compliance',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function RealEstateClimateRiskPage() {
  const [tab, setTab] = useState('Risk Overview');
  const [filterCity, setFilterCity] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterScenario, setFilterScenario] = useState('Orderly');

  const filtered = useMemo(() => PROPERTIES.filter(p => {
    if (filterCity !== 'All' && p.city !== filterCity) return false;
    if (filterType !== 'All' && p.type !== filterType) return false;
    return true;
  }), [filterCity, filterType]);

  const avgPhysical = filtered.length ? (filtered.reduce((s, p) => s + p.physicalRiskScore, 0) / filtered.length).toFixed(2) : '0.00';
  const strandedPct = filtered.length ? ((filtered.filter(p => p.strandedYear).length / filtered.length) * 100).toFixed(1) : '0.0';
  const avgInsurance = filtered.length ? (filtered.reduce((s, p) => s + p.insurancePremium, 0) / filtered.length).toFixed(0) : '0';
  const avgLtv = filtered.length ? (filtered.reduce((s, p) => s + p.ltvRatio, 0) / filtered.length).toFixed(1) : '0.0';

  const radarData = useMemo(() => [
    { subject: 'Flood Risk', A: filtered.length ? (filtered.reduce((s, p) => s + p.floodRisk, 0) / filtered.length).toFixed(2) : 0 },
    { subject: 'Heat Risk', A: filtered.length ? (filtered.reduce((s, p) => s + p.heatRisk, 0) / filtered.length).toFixed(2) : 0 },
    { subject: 'Subsistence', A: filtered.length ? (filtered.reduce((s, p) => s + p.subsistenceRisk, 0) / filtered.length).toFixed(2) : 0 },
    { subject: 'Transition', A: filtered.length ? (filtered.reduce((s, p) => s + p.transitionRisk, 0) / filtered.length).toFixed(2) : 0 },
    { subject: 'Physical', A: avgPhysical },
  ], [filtered, avgPhysical]);

  const strandingByYear = useMemo(() => {
    const years = {};
    filtered.filter(p => p.strandedYear).forEach(p => { years[p.strandedYear] = (years[p.strandedYear] || 0) + 1; });
    return Object.entries(years).sort((a, b) => +a[0] - +b[0]).map(([year, count]) => ({ year, 'Properties Stranded': count }));
  }, [filtered]);

  const ltvScenario = useMemo(() => {
    const scenarioMultipliers = { Orderly: { 2025: 1, 2030: 0.97, 2035: 0.95, 2040: 0.93, 2045: 0.91 }, Disorderly: { 2025: 1, 2030: 0.94, 2035: 0.89, 2040: 0.85, 2045: 0.80 }, 'Hot House': { 2025: 1, 2030: 0.91, 2035: 0.84, 2040: 0.78, 2045: 0.73 } };
    const base = filtered.length ? filtered.reduce((s, p) => s + p.ltvRatio, 0) / filtered.length : 65;
    return [2025, 2030, 2035, 2040, 2045].map(yr => ({
      year: yr,
      Orderly: parseFloat((base * scenarioMultipliers.Orderly[yr]).toFixed(1)),
      Disorderly: parseFloat((base * scenarioMultipliers.Disorderly[yr]).toFixed(1)),
      'Hot House': parseFloat((base * scenarioMultipliers['Hot House'][yr]).toFixed(1)),
    }));
  }, [filtered]);

  const insuranceByCity = useMemo(() => CITIES.map(c => {
    const arr = filtered.filter(p => p.city === c);
    return { name: c, 'Avg Premium £': arr.length ? Math.round(arr.reduce((s, p) => s + p.insurancePremium, 0) / arr.length) : 0 };
  }), [filtered]);

  const physicalByCity = useMemo(() => CITIES.map(c => {
    const arr = filtered.filter(p => p.city === c);
    return { name: c, 'Avg Physical Risk': arr.length ? parseFloat((arr.reduce((s, p) => s + p.physicalRiskScore, 0) / arr.length).toFixed(2)) : 0 };
  }), [filtered]);

  const transitionByType = useMemo(() => TYPES.map(t => {
    const arr = filtered.filter(p => p.type === t);
    return { name: t, 'Avg Transition Risk': arr.length ? parseFloat((arr.reduce((s, p) => s + p.transitionRisk, 0) / arr.length).toFixed(2)) : 0 };
  }), [filtered]);

  const scenarioMultMap = { Orderly: 0.8, Disorderly: 1.1, 'Hot House': 1.4 };
  const scenarioData = useMemo(() => CITIES.map(c => {
    const arr = filtered.filter(p => p.city === c);
    const base = arr.length ? arr.reduce((s, p) => s + p.physicalRiskScore, 0) / arr.length : 0;
    return { name: c, 'Risk Score': parseFloat((base * (scenarioMultMap[filterScenario] || 1)).toFixed(2)) };
  }), [filtered, filterScenario]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, marginBottom: 4 }}>EP-DE2 · GREEN REAL ESTATE & BUILT ENVIRONMENT</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Real Estate Climate Risk Analytics</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>100 properties · 8 cities · Physical & transition risk · Stranding timeline · Insurance impact</div>
      </div>

      <div style={{ background: T.cream, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['City', filterCity, setFilterCity, ['All', ...CITIES]],
          ['Type', filterType, setFilterType, ['All', ...TYPES]],
          ['Scenario', filterScenario, setFilterScenario, SCENARIOS]].map(([label, val, setter, opts]) => (
          <label key={label} style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}:
            <select value={val} onChange={e => setter(e.target.value)}
              style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, border: `1px solid ${T.border}`, background: T.card }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>{filtered.length} / {PROPERTIES.length} properties</span>
      </div>

      <div style={{ display: 'flex', gap: 16, padding: '20px 32px', flexWrap: 'wrap' }}>
        <KpiCard label="Avg Physical Risk Score" value={avgPhysical} sub="/ 5.0 scale" color={T.red} />
        <KpiCard label="At Stranding Risk" value={`${strandedPct}%`} sub="by 2045" color={T.orange} />
        <KpiCard label="Avg Insurance Premium" value={`£${Number(avgInsurance).toLocaleString()}`} sub="per property / yr" color={T.amber} />
        <KpiCard label="Avg LTV Ratio" value={`${avgLtv}%`} sub={filterScenario + ' scenario'} color={T.navy} />
      </div>

      <div style={{ display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid ${T.border}` }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 16px', fontSize: 12, fontWeight: tab === t ? 700 : 400, background: 'none', border: 'none',
              borderBottom: tab === t ? `3px solid ${T.gold}` : '3px solid transparent',
              color: tab === t ? T.navy : T.textSec, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px 32px' }}>
        {tab === 'Risk Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Risk Dimensions Radar</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <Radar name="Avg Score" dataKey="A" stroke={T.red} fill={T.red} fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Physical Risk Score by City</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={physicalByCity}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="Avg Physical Risk" fill={T.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Physical Hazards' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Physical Risk by City</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={physicalByCity}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="Avg Physical Risk" fill={T.orange} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Highest Physical Risk Properties</div>
              {[...filtered].sort((a, b) => b.physicalRiskScore - a.physicalRiskScore).slice(0, 10).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                  <span>{p.name}</span>
                  <span style={{ fontFamily: T.fontMono, color: p.physicalRiskScore > 4 ? T.red : T.amber }}>{p.physicalRiskScore.toFixed(2)} / 5</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Transition Exposure' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Avg Transition Risk by Property Type</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={transitionByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="Avg Transition Risk" fill={T.indigo} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Stranding Timeline' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Properties Stranding by Year</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={strandingByYear}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Properties Stranded" fill={T.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Stranded Asset Register</div>
              {filtered.filter(p => p.strandedYear).slice(0, 12).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                  <span>{p.name}</span>
                  <span style={{ fontFamily: T.fontMono, color: T.red, fontSize: 11 }}>Stranded {p.strandedYear} · EPC {p.epcRating}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Insurance Impact' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Average Insurance Premium by City (£/yr)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={insuranceByCity}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Avg Premium £" fill={T.amber} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'LTV Sensitivity' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>LTV Ratio Under Climate Scenarios (%)</div>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={ltvScenario}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[40, 80]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Orderly" stroke={T.green} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Disorderly" stroke={T.amber} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Hot House" stroke={T.red} strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Climate Scenario' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Risk Score by City — {filterScenario} Scenario</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={scenarioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="Risk Score" fill={filterScenario === 'Orderly' ? T.green : filterScenario === 'Disorderly' ? T.amber : T.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Regulatory Compliance' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Regulatory Compliance Summary</div>
              {[
                { label: 'EPC A-B (Compliant)', count: filtered.filter(p => ['A', 'B'].includes(p.epcRating)).length, color: T.green },
                { label: 'EPC C-D (At Risk by 2030)', count: filtered.filter(p => ['C', 'D'].includes(p.epcRating)).length, color: T.amber },
                { label: 'EPC E-G (Non-Compliant)', count: filtered.filter(p => ['E', 'F', 'G'].includes(p.epcRating)).length, color: T.red },
                { label: 'Stranded by 2035', count: filtered.filter(p => p.strandedYear && p.strandedYear <= 2035).length, color: T.red },
                { label: 'High Physical Risk (>3.5)', count: filtered.filter(p => p.physicalRiskScore > 3.5).length, color: T.orange },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 13 }}>
                  <span>{item.label}</span>
                  <span style={{ fontFamily: T.fontMono, fontWeight: 700, color: item.color }}>{item.count}</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Key Regulatory Milestones</div>
              {[
                { year: '2025', req: 'All commercial properties EPC C minimum', status: 'Active' },
                { year: '2027', req: 'MEES extension to residential landlords', status: 'Upcoming' },
                { year: '2028', req: 'Mandatory climate risk disclosure (FCA)', status: 'Upcoming' },
                { year: '2030', req: 'Net zero buildings roadmap checkpoint', status: 'Future' },
                { year: '2035', req: 'All properties EPC B minimum (proposed)', status: 'Future' },
              ].map(m => (
                <div key={m.year} style={{ padding: '10px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>{m.year}</span>
                    <span style={{ fontSize: 10, background: m.status === 'Active' ? T.green : m.status === 'Upcoming' ? T.amber : T.textSec, color: '#fff', padding: '2px 8px', borderRadius: 10 }}>{m.status}</span>
                  </div>
                  <div style={{ color: T.textSec, marginTop: 4 }}>{m.req}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
