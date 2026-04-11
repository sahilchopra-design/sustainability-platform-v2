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

const REGIONS = ['Sub-Saharan Africa', 'South Asia', 'East Asia & Pacific', 'Small Island States', 'Latin America', 'MENA'];
const V20_NAMES = [
  'Bangladesh','Pakistan','Nepal','Philippines','Vietnam','Cambodia','Myanmar','Sri Lanka','Laos','Timor-Leste',
  'Ethiopia','Kenya','Tanzania','Uganda','Mozambique','Malawi','Madagascar','Zimbabwe','Zambia','Rwanda',
  'Ghana','Senegal','Mali','Niger','Burkina Faso','Chad','Guinea','Sierra Leone','Liberia','Togo',
  'Haiti','Honduras','Nicaragua','El Salvador','Guatemala','Bolivia','Paraguay','Ecuador','Colombia','Peru',
  'Maldives','Vanuatu','Samoa','Tonga','Kiribati','Fiji','Solomon Islands','Marshall Islands','Tuvalu','Palau',
  'Egypt','Yemen','Jordan','Morocco','Djibouti','Comoros',
];

const COUNTRIES = Array.from({ length: 55 }, (_, i) => {
  const region = REGIONS[i % REGIONS.length];
  const hdi = +(0.3 + sr(i * 7) * 0.5).toFixed(3);
  return {
    id: i,
    name: V20_NAMES[i] || `V20 Country ${i + 1}`,
    region,
    lossesEconomic: +(0.1 + sr(i * 11) * 9.9).toFixed(2),
    lossesNonEconomic: +(1 + sr(i * 13) * 9).toFixed(1),
    climateAttributedLosses: Math.round(20 + sr(i * 17) * 75),
    gcfAccess: sr(i * 19) > 0.4,
    ldFundEligible: sr(i * 23) > 0.35,
    adaptationDeficit: +(0.2 + sr(i * 29) * 7.8).toFixed(2),
    displacedPersons: +(0.01 + sr(i * 31) * 3.99).toFixed(2),
    extremeEventFrequency: +(2 + sr(i * 37) * 28).toFixed(1),
    gdpLossClimate: +(0.5 + sr(i * 41) * 14.5).toFixed(1),
    insuranceCoverage: +(1 + sr(i * 43) * 49).toFixed(1),
    humanDevelopmentIndex: hdi,
  };
});

const TABS = [
  'Country Overview', 'Economic Losses', 'Non-Economic Losses', 'Climate Attribution',
  'L&D Fund Access', 'Adaptation Deficit', 'Displacement Analytics', 'Insurance Gap',
];

const kpi = (label, value, sub, color) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', minWidth: 160, flex: 1 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function LossAndDamageFinancePage() {
  const [tab, setTab] = useState(0);
  const [regionFilter, setRegionFilter] = useState('All');
  const [ldFilter, setLdFilter] = useState('All');
  const [gcfFilter, setGcfFilter] = useState('All');
  const [tempScenario, setTempScenario] = useState(1.5);
  const [finMobilisation, setFinMobilisation] = useState(50);

  const filtered = useMemo(() => COUNTRIES.filter(c => {
    if (regionFilter !== 'All' && c.region !== regionFilter) return false;
    if (ldFilter === 'Eligible' && !c.ldFundEligible) return false;
    if (ldFilter === 'Not Eligible' && c.ldFundEligible) return false;
    if (gcfFilter === 'GCF Access' && !c.gcfAccess) return false;
    if (gcfFilter === 'No GCF Access' && c.gcfAccess) return false;
    return true;
  }), [regionFilter, ldFilter, gcfFilter]);

  const totalEconomicLoss = filtered.reduce((a, c) => a + c.lossesEconomic, 0);
  const avgGdpLoss = filtered.length ? filtered.reduce((a, c) => a + c.gdpLossClimate, 0) / filtered.length : 0;
  const ldEligiblePct = filtered.length ? (filtered.filter(c => c.ldFundEligible).length / filtered.length * 100).toFixed(1) : '0.0';
  const totalDisplaced = filtered.reduce((a, c) => a + c.displacedPersons, 0);

  // Temperature scenario multiplier
  const tempMultiplier = tempScenario <= 1.5 ? 1.0 : tempScenario <= 2.0 ? 1.4 : tempScenario <= 3.0 ? 2.1 : 3.2;

  const selStyle = active => ({
    padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    background: active ? T.navy : T.sub, color: active ? '#fff' : T.textSec,
    border: `1px solid ${active ? T.navy : T.border}`, fontFamily: T.fontMono,
  });

  const top15Losses = [...filtered].sort((a, b) => b.lossesEconomic - a.lossesEconomic).slice(0, 15).map(c => ({
    name: c.name.slice(0, 10),
    economic: +(c.lossesEconomic * tempMultiplier).toFixed(2),
  }));

  const hdiScatter = filtered.map(c => ({ x: c.humanDevelopmentIndex, y: c.lossesEconomic * tempMultiplier, name: c.name }));

  const adaptGapByRegion = REGIONS.map(r => ({
    region: r.split(' ')[0],
    gap: +filtered.filter(c => c.region === r).reduce((a, c) => a + c.adaptationDeficit, 0).toFixed(2),
  })).filter(d => d.gap > 0);

  const insuranceGap = [...filtered].sort((a, b) => a.insuranceCoverage - b.insuranceCoverage).slice(0, 15).map(c => ({
    name: c.name.slice(0, 10),
    covered: c.insuranceCoverage,
    gap: +(100 - c.insuranceCoverage).toFixed(1),
  }));

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'DM Sans',sans-serif", color: T.textPri }}>
      <div style={{ background: T.navy, padding: '24px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, marginBottom: 4 }}>EP-DH5 · EMERGING MARKETS & DEVELOPMENT FINANCE</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>Loss & Damage Finance Analytics</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
          55 V20 & LDC Countries · Economic Losses · Climate Attribution · L&D Fund Access · Insurance Gap
        </div>
      </div>

      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: T.sub }}>
          <option value="All">All Regions</option>
          {REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={ldFilter} onChange={e => setLdFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: T.sub }}>
          <option value="All">All L&D Status</option>
          <option value="Eligible">L&D Fund Eligible</option>
          <option value="Not Eligible">Not Eligible</option>
        </select>
        <select value={gcfFilter} onChange={e => setGcfFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, background: T.sub }}>
          <option value="All">All GCF Status</option>
          <option value="GCF Access">GCF Access</option>
          <option value="No GCF Access">No GCF Access</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 24, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: T.textSec }}>
            Temp Scenario: <strong style={{ color: T.red }}>{tempScenario}°C</strong>
            <input type="range" min={1.5} max={4} step={0.5} value={tempScenario} onChange={e => setTempScenario(+e.target.value)} style={{ marginLeft: 8, width: 80 }} />
          </label>
          <label style={{ fontSize: 12, color: T.textSec }}>
            Finance Mobilisation: <strong style={{ color: T.navy }}>${finMobilisation}Bn</strong>
            <input type="range" min={10} max={400} value={finMobilisation} onChange={e => setFinMobilisation(+e.target.value)} style={{ marginLeft: 8, width: 80 }} />
          </label>
        </div>
      </div>

      <div style={{ padding: '20px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {kpi('Total Economic Losses', `$${(totalEconomicLoss * tempMultiplier).toFixed(1)}Bn/yr`, `At ${tempScenario}°C scenario`, T.red)}
        {kpi('Avg GDP Loss (Climate)', `${avgGdpLoss.toFixed(1)}%`, `${filtered.length} countries`, T.amber)}
        {kpi('L&D Fund Eligible', `${ldEligiblePct}%`, `${filtered.filter(c => c.ldFundEligible).length} countries`, T.green)}
        {kpi('Total Displaced Persons', `${totalDisplaced.toFixed(1)}M`, 'climate-induced', T.indigo)}
      </div>

      <div style={{ padding: '0 32px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => <button key={t} onClick={() => setTab(i)} style={selStyle(tab === i)}>{t}</button>)}
      </div>

      <div style={{ padding: '0 32px 40px' }}>
        {tab === 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Country','Region','Econ Losses ($Bn)','Non-Econ (0-10)','GDP Loss %','HDI','L&D Fund','GCF','Displaced (M)'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 20).map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '8px 12px', color: T.textSec, fontSize: 11 }}>{c.region.split(' ')[0]}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.red }}>{(c.lossesEconomic * tempMultiplier).toFixed(2)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: c.lossesNonEconomic > 7 ? T.red : T.amber }}>{c.lossesNonEconomic.toFixed(1)}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: c.gdpLossClimate > 8 ? T.red : T.textPri }}>{c.gdpLossClimate.toFixed(1)}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: c.humanDevelopmentIndex < 0.5 ? T.red : T.green }}>{c.humanDevelopmentIndex.toFixed(3)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}><span style={{ color: c.ldFundEligible ? T.green : T.textSec }}>{c.ldFundEligible ? '✓' : '—'}</span></td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}><span style={{ color: c.gcfAccess ? T.blue : T.textSec }}>{c.gcfAccess ? '✓' : '—'}</span></td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{c.displacedPersons.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 20 && <div style={{ padding: '10px 16px', fontSize: 12, color: T.textSec, background: T.sub }}>Showing 20 of {filtered.length} countries</div>}
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: T.navy }}>Top 15 Countries by Economic Losses ($Bn/yr)</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>At {tempScenario}°C — multiplier: {tempMultiplier.toFixed(1)}× baseline</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={top15Losses}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} unit="Bn" />
                <Tooltip formatter={v => `$${v}Bn`} />
                <Bar dataKey="economic" fill={T.red} name="Economic Losses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 2 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Non-Economic Losses (0-10 Scale) — Top 20</div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={[...filtered].sort((a, b) => b.lossesNonEconomic - a.lossesNonEconomic).slice(0, 20).map(c => ({ name: c.name.slice(0, 10), loss: c.lossesNonEconomic, freq: c.extremeEventFrequency }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 10]} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="loss" fill={T.orange} name="Non-Economic Loss (0-10)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Climate Attribution — % of Losses Attributed to Climate Change</div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={[...filtered].sort((a, b) => b.climateAttributedLosses - a.climateAttributedLosses).slice(0, 20).map(c => ({ name: c.name.slice(0, 10), pct: c.climateAttributedLosses }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="pct" fill={T.amber} name="Climate Attribution %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>L&D Fund Access Overview</div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1, background: T.sub, borderRadius: 8, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: T.green }}>{filtered.filter(c => c.ldFundEligible).length}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>L&D Eligible</div>
                </div>
                <div style={{ flex: 1, background: T.sub, borderRadius: 8, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: T.blue }}>{filtered.filter(c => c.gcfAccess).length}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>GCF Access</div>
                </div>
                <div style={{ flex: 1, background: T.sub, borderRadius: 8, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: T.purple }}>{filtered.filter(c => c.ldFundEligible && c.gcfAccess).length}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>Both</div>
                </div>
              </div>
              <div style={{ padding: 12, background: T.sub, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: T.textSec }}>Finance Mobilisation (scenario)</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>${finMobilisation}Bn</div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>
                  Per eligible country: ${filtered.filter(c => c.ldFundEligible).length > 0 ? (finMobilisation / filtered.filter(c => c.ldFundEligible).length).toFixed(1) : '0'}Bn
                </div>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Top Countries — Extreme Event Frequency</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[...filtered].sort((a, b) => b.extremeEventFrequency - a.extremeEventFrequency).slice(0, 10).map(c => ({ name: c.name.slice(0, 8), freq: c.extremeEventFrequency }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} unit="/dec" />
                  <Tooltip formatter={v => `${v}/decade`} />
                  <Bar dataKey="freq" fill={T.red} name="Extreme Events/Decade" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Adaptation Deficit by Region ($Bn/yr)</div>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={adaptGapByRegion}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="Bn" />
                <Tooltip formatter={v => `$${v}Bn`} />
                <Bar dataKey="gap" fill={T.amber} name="Adaptation Deficit" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>HDI vs Climate-Attributed Economic Losses</div>
            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="x" name="HDI" label={{ value: 'Human Development Index', position: 'insideBottom', offset: -5, fontSize: 11 }} domain={[0.3, 0.9]} />
                <YAxis dataKey="y" name="Economic Losses ($Bn)" label={{ value: 'Econ Losses ($Bn)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.[0] ? (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', fontSize: 12, borderRadius: 6 }}>
                    <div style={{ fontWeight: 700 }}>{payload[0].payload.name}</div>
                    <div>HDI: {payload[0].payload.x}</div>
                    <div>Econ Loss: ${payload[0].payload.y}Bn</div>
                  </div>
                ) : null} />
                <Scatter data={hdiScatter} fill={T.orange} fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 7 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, color: T.navy }}>Insurance Coverage Gap — Least Covered Countries</div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={insuranceGap}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={v => `${v}%`} />
                <Legend />
                <Bar dataKey="covered" fill={T.green} name="Insurance Coverage %" stackId="a" />
                <Bar dataKey="gap" fill={T.red} name="Coverage Gap %" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
