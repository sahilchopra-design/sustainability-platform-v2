import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Legend,
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const REGIONS = ['North Pacific', 'South Pacific', 'North Atlantic', 'South Atlantic', 'Indian Ocean', 'Arctic', 'Antarctic', 'Mediterranean', 'Caribbean', 'Coral Triangle'];

const REGION_NAMES = [
  'North Pacific Gyre', 'California Current', 'Gulf of Alaska', 'Bering Sea', 'Kuroshio Current',
  'Great Barrier Reef', 'Coral Sea', 'Tasman Sea', 'South Pacific Subtropical', 'Polynesian Waters',
  'North Atlantic Subtropical', 'Norwegian Sea', 'North Sea', 'Baltic Sea', 'Celtic Sea',
  'South Atlantic Subtropical', 'Brazilian Current', 'Benguela Current', 'Agulhas Current', 'Angola Basin',
  'Arabian Sea', 'Bay of Bengal', 'Andaman Sea', 'Mozambique Channel', 'Red Sea',
  'Arctic Basin', 'Barents Sea', 'Greenland Sea', 'Labrador Sea', 'Beaufort Sea',
  'Ross Sea', 'Weddell Sea', 'Southern Ocean', 'Antarctic Peninsula', 'Amundsen Sea',
  'Mediterranean Eastern', 'Mediterranean Western', 'Aegean Sea', 'Adriatic Sea', 'Ionian Sea',
  'Caribbean Eastern', 'Caribbean Western', 'Gulf of Mexico', 'Florida Straits', 'Bahamas Bank',
  'Coral Triangle Java', 'Coral Triangle Sulawesi', 'Sulu Sea', 'Banda Sea', 'Flores Sea',
];

const getRiskLevel = ohi => {
  if (ohi < 40) return 'Critical';
  if (ohi < 60) return 'High';
  if (ohi < 75) return 'Medium';
  return 'Low';
};

const getMpaStatus = mpa => {
  if (mpa >= 30) return 'Exceeds 30x30';
  if (mpa >= 20) return 'On Track';
  if (mpa >= 10) return 'Partial';
  return 'Below Target';
};

const OCEAN_REGIONS = Array.from({ length: 50 }, (_, i) => {
  const region = REGIONS[i % REGIONS.length];
  const ohi = Math.round(20 + sr(i * 7) * 75);
  const mpa = +(2 + sr(i * 11) * 48).toFixed(1);
  return {
    id: i,
    name: REGION_NAMES[i] || `Ocean Region ${i + 1}`,
    region,
    seaTemperatureAnomaly: +(0.1 + sr(i * 3) * 2.9).toFixed(2),
    acidificationLevel: +(-0.05 - sr(i * 5) * 0.25).toFixed(3),
    coralBleachingRisk: +(1 + sr(i * 13) * 9).toFixed(1),
    fisheryCollapseProbability: +(3 + sr(i * 17) * 67).toFixed(1),
    marineProtectedAreaPct: mpa,
    plasticPollutionIndex: +(1 + sr(i * 19) * 9).toFixed(1),
    oceanHealthIndex: ohi,
    conservationInvestment: +(5 + sr(i * 23) * 495).toFixed(0),
    blueEconomyGdpPct: +(0.5 + sr(i * 29) * 14.5).toFixed(1),
    oxygenMinimumZoneExpansion: +(0.1 + sr(i * 31) * 15).toFixed(1),
    carbonSinkCapacity: +(0.01 + sr(i * 37) * 0.49).toFixed(3),
    riskLevel: getRiskLevel(ohi),
    mpaStatus: getMpaStatus(mpa),
  };
});

const TABS = [
  'Region Overview', 'Temperature & Acidification', 'Coral Reef Risk', 'Fisheries Health',
  'Marine Protected Areas', 'Plastic Pollution', 'Conservation Finance', 'Carbon Sink Analytics',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const RISK_COLORS = { Critical: '#dc2626', High: '#ea580c', Medium: '#d97706', Low: '#16a34a' };
const MPA_COLORS = { 'Exceeds 30x30': '#16a34a', 'On Track': '#0369a1', 'Partial': '#d97706', 'Below Target': '#dc2626' };

export default function OceanHealthFinancePage() {
  const [tab, setTab] = useState(0);
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');
  const [filterMpa, setFilterMpa] = useState('All');
  const [tempScenario, setTempScenario] = useState(1.5);
  const [conservInvest, setConservInvest] = useState(5);

  const filtered = useMemo(() => OCEAN_REGIONS.filter(r =>
    (filterRegion === 'All' || r.region === filterRegion) &&
    (filterRisk === 'All' || r.riskLevel === filterRisk) &&
    (filterMpa === 'All' || r.mpaStatus === filterMpa)
  ), [filterRegion, filterRisk, filterMpa]);

  const avgOhi = filtered.length
    ? (filtered.reduce((a, r) => a + r.oceanHealthIndex, 0) / filtered.length).toFixed(1)
    : '0';
  const avgCoral = filtered.length
    ? (filtered.reduce((a, r) => a + r.coralBleachingRisk, 0) / filtered.length).toFixed(1)
    : '0';
  const totalConserv = filtered.reduce((a, r) => a + +r.conservationInvestment, 0);
  const avgMpa = filtered.length
    ? (filtered.reduce((a, r) => a + r.marineProtectedAreaPct, 0) / filtered.length).toFixed(1)
    : '0';

  const ohiByRegion = REGIONS.map(r => {
    const rs = filtered.filter(o => o.region === r);
    return {
      region: r.split(' ').slice(0, 2).join(' '),
      avgOhi: rs.length ? +(rs.reduce((a, o) => a + o.oceanHealthIndex, 0) / rs.length).toFixed(1) : 0,
    };
  });

  const tempVsAcid = filtered.map(r => ({
    x: +r.seaTemperatureAnomaly.toFixed(2),
    y: +Math.abs(r.acidificationLevel).toFixed(3),
    name: r.name,
  }));

  const mpaByRegion = REGIONS.map(r => {
    const rs = filtered.filter(o => o.region === r);
    return {
      region: r.split(' ').slice(0, 2).join(' '),
      avgMpa: rs.length ? +(rs.reduce((a, o) => a + o.marineProtectedAreaPct, 0) / rs.length).toFixed(1) : 0,
    };
  });

  const fisheryCollapse = [...filtered].sort((a, b) => b.fisheryCollapseProbability - a.fisheryCollapseProbability).slice(0, 15).map(r => ({
    name: r.name.split(' ').slice(0, 2).join(' '),
    probability: +r.fisheryCollapseProbability.toFixed(1),
    ohi: +r.oceanHealthIndex,
  }));

  const plasticData = [...filtered].sort((a, b) => b.plasticPollutionIndex - a.plasticPollutionIndex).slice(0, 15).map(r => ({
    name: r.name.split(' ').slice(0, 2).join(' '),
    plastic: +r.plasticPollutionIndex.toFixed(1),
  }));

  const conservData = [...filtered].sort((a, b) => b.conservationInvestment - a.conservationInvestment).slice(0, 15).map(r => ({
    name: r.name.split(' ').slice(0, 2).join(' '),
    investment: +r.conservationInvestment,
    ohi: +r.oceanHealthIndex,
  }));

  const carbonSinkData = [...filtered].sort((a, b) => b.carbonSinkCapacity - a.carbonSinkCapacity).slice(0, 15).map(r => ({
    name: r.name.split(' ').slice(0, 2).join(' '),
    sink: +r.carbonSinkCapacity.toFixed(3),
    adjusted: +(r.carbonSinkCapacity * (1 - (tempScenario - 1.5) * 0.08)).toFixed(3),
  }));

  const sel = { background: T.teal, color: '#fff', border: `1px solid ${T.teal}` };
  const unsel = { background: T.card, color: T.textPri, border: `1px solid ${T.border}` };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '24px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, marginBottom: 6 }}>
              EP-DJ4 · OCEAN, SHIPPING & BLUE ECONOMY
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff' }}>Ocean Health Finance</h1>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>50 Marine Regions · OHI · Acidification · Coral Reef · Fisheries · MPA Coverage · Carbon Sinks</div>
          </div>
          <div style={{ textAlign: 'right', color: '#94a3b8', fontSize: 11, fontFamily: T.fontMono }}>
            <div>Temp Scenario: +{tempScenario}°C</div>
            <div>Conservation: ${conservInvest}Bn</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, fontSize: 13 }}>
            <option value="All">All Regions</option>
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
          <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, fontSize: 13 }}>
            <option value="All">All Risk Levels</option>
            {['Critical', 'High', 'Medium', 'Low'].map(r => <option key={r}>{r}</option>)}
          </select>
          <select value={filterMpa} onChange={e => setFilterMpa(e.target.value)}
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, fontSize: 13 }}>
            <option value="All">All MPA Status</option>
            {['Exceeds 30x30', 'On Track', 'Partial', 'Below Target'].map(s => <option key={s}>{s}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Temp: <strong>+{tempScenario}°C</strong></label>
            <input type="range" min={0.5} max={4} step={0.1} value={tempScenario} onChange={e => setTempScenario(+e.target.value)} style={{ width: 100 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Conservation: <strong>${conservInvest}Bn</strong></label>
            <input type="range" min={1} max={50} step={1} value={conservInvest} onChange={e => setConservInvest(+e.target.value)} style={{ width: 100 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <KpiCard label="Avg Ocean Health Index" value={avgOhi} sub="out of 100" color={T.teal} />
          <KpiCard label="Avg Coral Bleaching Risk" value={`${avgCoral}/10`} sub="" color={T.red} />
          <KpiCard label="Total Conservation Invest." value={`$${(totalConserv / 1000).toFixed(0)}M`} sub="across regions" color={T.green} />
          <KpiCard label="Avg MPA Coverage" value={`${avgMpa}%`} sub="target: 30%" color={T.blue} />
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              style={{ padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, ...(tab === i ? sel : unsel) }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 320, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Ocean Health Index by Region</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={ohiByRegion}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="region" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="avgOhi" fill={T.teal} radius={[4, 4, 0, 0]} name="Avg OHI" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 2, minWidth: 320, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Temperature Anomaly vs Acidification</div>
                <ResponsiveContainer width="100%" height={240}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="x" name="Temp Anomaly (°C)" tick={{ fontSize: 11 }} label={{ value: 'Temp Anomaly (°C)', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                    <YAxis dataKey="y" name="Acidification (|ΔpH|)" tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={tempVsAcid} fill={T.orange} opacity={0.65} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Region', 'Area', 'Risk', 'OHI', 'Temp Anomaly', 'Acidification', 'Coral Risk', 'MPA %', 'Conservation ($M)'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 20).map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{r.name}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{r.region}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: RISK_COLORS[r.riskLevel] + '22', color: RISK_COLORS[r.riskLevel], padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{r.riskLevel}</span>
                      </td>
                      <td style={{ padding: '8px 12px', color: r.oceanHealthIndex >= 75 ? T.green : r.oceanHealthIndex >= 55 ? T.amber : T.red, fontWeight: 700 }}>{r.oceanHealthIndex}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>+{r.seaTemperatureAnomaly}°C</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: Math.abs(r.acidificationLevel) > 0.15 ? T.red : T.amber }}>{r.acidificationLevel}</td>
                      <td style={{ padding: '8px 12px', color: r.coralBleachingRisk >= 7 ? T.red : r.coralBleachingRisk >= 5 ? T.amber : T.green, fontWeight: 600 }}>{r.coralBleachingRisk}/10</td>
                      <td style={{ padding: '8px 12px', color: r.marineProtectedAreaPct >= 30 ? T.green : r.marineProtectedAreaPct >= 10 ? T.amber : T.red }}>{r.marineProtectedAreaPct}%</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>${r.conservationInvestment}M</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 340, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Temperature Anomaly vs Ocean Acidification</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Temp Anomaly (°C)" tick={{ fontSize: 11 }} label={{ value: 'Temperature Anomaly (°C)', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                  <YAxis dataKey="y" name="Acidification" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={tempVsAcid} fill={T.orange} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: T.textSec }}>Avg Temperature Anomaly</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.red }}>
                  +{filtered.length ? (filtered.reduce((a, r) => a + r.seaTemperatureAnomaly, 0) / filtered.length).toFixed(2) : '0'}°C
                </div>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: T.textSec }}>Avg Acidification Level</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.orange }}>
                  {filtered.length ? (filtered.reduce((a, r) => a + r.acidificationLevel, 0) / filtered.length).toFixed(3) : '0'} ΔpH
                </div>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, color: T.textSec }}>Avg O₂ Minimum Zone Expansion</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.purple }}>
                  +{filtered.length ? (filtered.reduce((a, r) => a + r.oxygenMinimumZoneExpansion, 0) / filtered.length).toFixed(1) : '0'}%
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Coral Bleaching Risk (Top 15 regions)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[...filtered].sort((a, b) => b.coralBleachingRisk - a.coralBleachingRisk).slice(0, 15).map(r => ({ name: r.name.split(' ').slice(0, 2).join(' '), risk: +r.coralBleachingRisk.toFixed(1) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="risk" fill={T.red} radius={[3, 3, 0, 0]} name="Coral Bleaching Risk (0-10)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <KpiCard label="Critical Risk (≥8)" value={filtered.filter(r => r.coralBleachingRisk >= 8).length} sub="regions" color={T.red} />
              <KpiCard label="High Risk (5-8)" value={filtered.filter(r => r.coralBleachingRisk >= 5 && r.coralBleachingRisk < 8).length} sub="regions" color={T.orange} />
              <KpiCard label="Moderate (<5)" value={filtered.filter(r => r.coralBleachingRisk < 5).length} sub="regions" color={T.amber} />
            </div>
          </div>
        )}

        {tab === 3 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Fishery Collapse Probability (%) — Top 15 at Risk</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={fisheryCollapse}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="probability" fill={T.red} radius={[3, 3, 0, 0]} name="Collapse Probability (%)" />
                  <Bar dataKey="ohi" fill={T.teal} radius={[3, 3, 0, 0]} name="Ocean Health Index" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 340, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>MPA Coverage by Region (%)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mpaByRegion}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="region" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="avgMpa" fill={T.blue} radius={[4, 4, 0, 0]} name="Avg MPA Coverage (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              {['Exceeds 30x30', 'On Track', 'Partial', 'Below Target'].map(s => {
                const count = filtered.filter(r => r.mpaStatus === s).length;
                return (
                  <div key={s} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 10, borderLeft: `4px solid ${MPA_COLORS[s]}` }}>
                    <div style={{ fontWeight: 600, color: MPA_COLORS[s] }}>{s}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{count} regions</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Plastic Pollution Index — Top 15 Affected Regions</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={plasticData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="plastic" fill={T.purple} radius={[3, 3, 0, 0]} name="Plastic Pollution Index (0-10)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 6 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Conservation Investment vs OHI — Top 15 by Investment</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={conservData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="investment" fill={T.sage} radius={[3, 3, 0, 0]} name="Conservation Investment ($M)" />
                  <Bar dataKey="ohi" fill={T.teal} radius={[3, 3, 0, 0]} name="Ocean Health Index" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <KpiCard label="Total Conservation" value={`$${(totalConserv / 1000).toFixed(1)}M`} sub="committed" color={T.sage} />
              <KpiCard label="Avg Blue Economy GDP" value={`${filtered.length ? (filtered.reduce((a, r) => a + r.blueEconomyGdpPct, 0) / filtered.length).toFixed(1) : '0'}%`} sub="blue economy share" color={T.blue} />
              <KpiCard label="Additional Investment Need" value={`$${Math.max(0, conservInvest * 1000 - totalConserv).toFixed(0)}M`} sub={`for $${conservInvest}Bn target`} color={T.amber} />
            </div>
          </div>
        )}

        {tab === 7 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Carbon Sink Capacity — Baseline vs +{tempScenario}°C Scenario (GtCO₂/yr)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={carbonSinkData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sink" fill={T.teal} radius={[3, 3, 0, 0]} name="Baseline (GtCO₂/yr)" />
                  <Bar dataKey="adjusted" fill={T.red} radius={[3, 3, 0, 0]} name={`+${tempScenario}°C Scenario`} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <KpiCard label="Total Carbon Sink (Baseline)" value={`${filtered.reduce((a, r) => a + r.carbonSinkCapacity, 0).toFixed(2)}GtCO₂`} sub="per year" color={T.teal} />
              <KpiCard label={`Sink under +${tempScenario}°C`} value={`${filtered.reduce((a, r) => a + r.carbonSinkCapacity * (1 - (tempScenario - 1.5) * 0.08), 0).toFixed(2)}GtCO₂`} sub="degraded capacity" color={T.red} />
              <KpiCard label="Sink Loss" value={`${(filtered.reduce((a, r) => a + r.carbonSinkCapacity * (tempScenario - 1.5) * 0.08, 0)).toFixed(3)}GtCO₂`} sub="annual loss" color={T.orange} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
