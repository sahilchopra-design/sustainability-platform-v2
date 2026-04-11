import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, AreaChart, Area,
  CartesianGrid, Legend,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SECTORS = ['Energy', 'Transport', 'Water', 'Telecoms', 'Health', 'Waste'];
const COUNTRIES = ['UK', 'Germany', 'France', 'Netherlands', 'Sweden', 'Spain', 'Italy', 'Poland'];
const SCENARIOS_C = ['1.5°C', '2°C', '3°C', '4°C'];

const ASSETS = Array.from({ length: 50 }, (_, i) => {
  const sector = SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];
  const country = COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];
  const assetValue = parseFloat((0.5 + sr(i * 3) * 19.5).toFixed(2));
  const physicalRisk = parseFloat((1 + sr(i * 5) * 9).toFixed(1));
  const floodRisk = parseFloat((1 + sr(i * 9) * 9).toFixed(1));
  const heatRisk = parseFloat((1 + sr(i * 13) * 9).toFixed(1));
  const adaptationCost = parseFloat((10 + sr(i * 17) * 490).toFixed(0));
  const residualRisk = parseFloat((Math.max(1, physicalRisk - sr(i * 19) * 3)).toFixed(1));
  const operationalImpact = parseFloat((2 + sr(i * 23) * 28).toFixed(1));
  const insuranceCoverage = parseFloat((30 + sr(i * 29) * 60).toFixed(1));
  const riskLevel = physicalRisk >= 7.5 ? 'Critical' : physicalRisk >= 5 ? 'High' : physicalRisk >= 2.5 ? 'Medium' : 'Low';
  return {
    id: i + 1,
    name: `${sector} ${country} ${i + 1}`,
    sector, country, assetValue, physicalRisk, floodRisk, heatRisk,
    adaptationCost, residualRisk, operationalImpact, insuranceCoverage, riskLevel,
  };
});

const TABS = [
  'Asset Overview', 'Physical Risk Map', 'Sector Analysis', 'Adaptation Costing',
  'Operational Impact', 'Insurance Gap', 'Resilience Pathway', 'Policy Alignment',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function InfrastructureClimateResiliencePage() {
  const [tab, setTab] = useState('Asset Overview');
  const [filterSector, setFilterSector] = useState('All');
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');
  const [climateScenario, setClimateScenario] = useState('2°C');
  const [adaptationInvestment, setAdaptationInvestment] = useState(5);

  const filtered = useMemo(() => ASSETS.filter(a => {
    if (filterSector !== 'All' && a.sector !== filterSector) return false;
    if (filterCountry !== 'All' && a.country !== filterCountry) return false;
    if (filterRisk !== 'All' && a.riskLevel !== filterRisk) return false;
    return true;
  }), [filterSector, filterCountry, filterRisk]);

  const totalAssetValue = filtered.length ? filtered.reduce((s, a) => s + a.assetValue, 0).toFixed(1) : '0.0';
  const avgPhysicalRisk = filtered.length ? (filtered.reduce((s, a) => s + a.physicalRisk, 0) / filtered.length).toFixed(1) : '0.0';
  const totalAdaptationCost = filtered.length ? filtered.reduce((s, a) => s + a.adaptationCost, 0).toFixed(0) : '0';
  const avgInsuranceGap = filtered.length ? (filtered.reduce((s, a) => s + (100 - a.insuranceCoverage), 0) / filtered.length).toFixed(1) : '0.0';

  const scenarioMults = { '1.5°C': 0.7, '2°C': 1.0, '3°C': 1.4, '4°C': 1.9 };

  const riskBySector = useMemo(() => SECTORS.map(s => {
    const arr = filtered.filter(a => a.sector === s);
    const mult = scenarioMults[climateScenario] || 1;
    return { name: s, 'Avg Physical Risk': arr.length ? parseFloat((arr.reduce((sa, a) => sa + a.physicalRisk, 0) / arr.length * mult).toFixed(1)) : 0 };
  }), [filtered, climateScenario]);

  const scatterData = useMemo(() => filtered.map(a => ({
    x: a.adaptationCost, y: a.physicalRisk, name: a.name,
  })), [filtered]);

  const resiliencePathway = useMemo(() => {
    const years = [2025, 2028, 2031, 2034, 2037, 2040, 2043, 2046, 2049, 2052];
    const baseRisk = filtered.length ? filtered.reduce((s, a) => s + a.physicalRisk, 0) / filtered.length : 5;
    const investmentFactor = adaptationInvestment / 5;
    return years.map((yr, i) => ({
      year: yr,
      'Baseline Risk': parseFloat((baseRisk * (1 + i * 0.03 * (scenarioMults[climateScenario] || 1))).toFixed(2)),
      'With Adaptation': parseFloat((baseRisk * (1 + i * 0.03 * (scenarioMults[climateScenario] || 1)) * (1 - investmentFactor * 0.06 * i)).toFixed(2)),
    }));
  }, [filtered, climateScenario, adaptationInvestment]);

  const opImpactByCountry = useMemo(() => COUNTRIES.map(c => {
    const arr = filtered.filter(a => a.country === c);
    return { name: c, 'Operational Impact (%)': arr.length ? parseFloat((arr.reduce((s, a) => s + a.operationalImpact, 0) / arr.length).toFixed(1)) : 0 };
  }), [filtered]);

  const insuranceGapBySector = useMemo(() => SECTORS.map(s => {
    const arr = filtered.filter(a => a.sector === s);
    return { name: s, 'Insurance Coverage (%)': arr.length ? parseFloat((arr.reduce((sa, a) => sa + a.insuranceCoverage, 0) / arr.length).toFixed(1)) : 0, 'Insurance Gap (%)': arr.length ? parseFloat((arr.reduce((sa, a) => sa + (100 - a.insuranceCoverage), 0) / arr.length).toFixed(1)) : 0 };
  }), [filtered]);

  const adaptBySector = useMemo(() => SECTORS.map(s => {
    const arr = filtered.filter(a => a.sector === s);
    return { name: s, 'Total Adaptation £M': arr.length ? parseFloat(arr.reduce((sa, a) => sa + a.adaptationCost, 0).toFixed(0)) : 0 };
  }), [filtered]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, marginBottom: 4 }}>EP-DE4 · GREEN REAL ESTATE & BUILT ENVIRONMENT</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Infrastructure Climate Resilience</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>50 infrastructure assets · 6 sectors · Adaptation costing · Resilience pathways · Insurance gap</div>
      </div>

      <div style={{ background: T.cream, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Sector', filterSector, setFilterSector, ['All', ...SECTORS]],
          ['Country', filterCountry, setFilterCountry, ['All', ...COUNTRIES]],
          ['Risk Level', filterRisk, setFilterRisk, ['All', 'Low', 'Medium', 'High', 'Critical']],
          ['Scenario', climateScenario, setClimateScenario, SCENARIOS_C]].map(([label, val, setter, opts]) => (
          <label key={label} style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}:
            <select value={val} onChange={e => setter(e.target.value)}
              style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, border: `1px solid ${T.border}`, background: T.card }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Adapt. Investment £{adaptationInvestment}Bn:
          <input type="range" min={1} max={20} value={adaptationInvestment} onChange={e => setAdaptationInvestment(+e.target.value)} style={{ width: 100 }} />
        </label>
        <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>{filtered.length} / {ASSETS.length} assets</span>
      </div>

      <div style={{ display: 'flex', gap: 16, padding: '20px 32px', flexWrap: 'wrap' }}>
        <KpiCard label="Total Asset Value" value={`£${Number(totalAssetValue).toLocaleString()}Bn`} sub="filtered assets" color={T.navy} />
        <KpiCard label="Avg Physical Risk" value={`${avgPhysicalRisk} / 10`} sub={climateScenario + ' scenario'} color={T.red} />
        <KpiCard label="Total Adaptation Cost" value={`£${Number(totalAdaptationCost).toLocaleString()}M`} sub="required investment" color={T.amber} />
        <KpiCard label="Avg Insurance Gap" value={`${avgInsuranceGap}%`} sub="uninsured exposure" color={T.orange} />
      </div>

      <div style={{ display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid ${T.border}` }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 14px', fontSize: 12, fontWeight: tab === t ? 700 : 400, background: 'none', border: 'none',
              borderBottom: tab === t ? `3px solid ${T.gold}` : '3px solid transparent',
              color: tab === t ? T.navy : T.textSec, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px 32px' }}>
        {tab === 'Asset Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Physical Risk by Sector — {climateScenario}</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={riskBySector}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} />
                  <Tooltip />
                  <Bar dataKey="Avg Physical Risk" fill={T.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Critical Assets ({filtered.filter(a => a.riskLevel === 'Critical').length})</div>
              {filtered.filter(a => a.riskLevel === 'Critical').slice(0, 10).map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                  <span>{a.name}</span>
                  <span style={{ fontFamily: T.fontMono, color: T.red, fontSize: 11 }}>Risk {a.physicalRisk} · £{a.assetValue}Bn</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Physical Risk Map' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Adaptation Cost vs Physical Risk</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Adaptation Cost £M" tick={{ fontSize: 11 }} label={{ value: '£M', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="y" name="Physical Risk" tick={{ fontSize: 11 }} domain={[0, 10]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatterData} fill={T.teal} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Operational Impact by Country (%)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={opImpactByCountry}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Operational Impact (%)" fill={T.orange} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Sector Analysis' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Physical Risk by Sector</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={riskBySector}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Avg Physical Risk" fill={T.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Insurance Gap by Sector</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={insuranceGapBySector}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Insurance Coverage (%)" fill={T.green} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Insurance Gap (%)" fill={T.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Adaptation Costing' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Adaptation Cost by Sector (£M)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={adaptBySector}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Total Adaptation £M" fill={T.amber} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Cost vs Risk Scatter</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="£M" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="y" name="Risk" tick={{ fontSize: 11 }} domain={[0, 10]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatterData} fill={T.indigo} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Operational Impact' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Operational Impact (% Revenue at Risk) by Country</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={opImpactByCountry}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Operational Impact (%)" fill={T.orange} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Insurance Gap' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Insurance Coverage vs Gap by Sector (%)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={insuranceGapBySector}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Insurance Coverage (%)" fill={T.green} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Insurance Gap (%)" fill={T.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Resilience Pathway' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: T.navy }}>Resilience Pathway — {climateScenario} / Investment £{adaptationInvestment}Bn</div>
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={resiliencePathway}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 12]} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Baseline Risk" stroke={T.red} fill={T.red} fillOpacity={0.25} strokeWidth={2} />
                  <Area type="monotone" dataKey="With Adaptation" stroke={T.green} fill={T.green} fillOpacity={0.2} strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'Policy Alignment' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Policy Frameworks</div>
              {[
                { framework: 'EU Climate Adaptation Strategy', status: 'Aligned', coverage: '85%' },
                { framework: 'UK National Adaptation Programme', status: 'Partial', coverage: '72%' },
                { framework: 'Sendai Framework (DRR)', status: 'Aligned', coverage: '78%' },
                { framework: 'Paris Agreement NDCs', status: 'Partial', coverage: '61%' },
                { framework: 'TCFD Recommendations', status: 'Aligned', coverage: '90%' },
                { framework: 'UN SDG 9 (Resilient Infrastructure)', status: 'Aligned', coverage: '88%' },
              ].map(f => (
                <div key={f.framework} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                  <span style={{ color: T.textPri }}>{f.framework}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec }}>{f.coverage}</span>
                    <span style={{ fontSize: 10, background: f.status === 'Aligned' ? T.green : T.amber, color: '#fff', padding: '2px 8px', borderRadius: 10 }}>{f.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: T.navy }}>Sector Risk Level Summary</div>
              {SECTORS.map(s => {
                const arr = filtered.filter(a => a.sector === s);
                const avg = arr.length ? (arr.reduce((sum, a) => sum + a.physicalRisk, 0) / arr.length).toFixed(1) : '0.0';
                const critical = arr.filter(a => a.riskLevel === 'Critical').length;
                return (
                  <div key={s} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${T.borderL}`, fontSize: 12 }}>
                    <span style={{ fontWeight: 600, color: T.textPri }}>{s}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: T.fontMono, fontSize: 11, color: +avg >= 7 ? T.red : +avg >= 4 ? T.amber : T.green }}>Avg risk {avg} / 10</div>
                      <div style={{ fontSize: 10, color: T.textSec }}>{critical} critical assets</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
