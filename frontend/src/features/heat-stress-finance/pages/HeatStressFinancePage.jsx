import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const REGIONS = ['South Asia', 'Southeast Asia', 'Sub-Saharan Africa', 'MENA', 'Latin America', 'Southern Europe', 'Caribbean', 'Pacific Islands'];
const SECTORS = ['Construction', 'Agriculture', 'Manufacturing', 'Mining', 'Logistics', 'Utilities', 'Tourism', 'Military'];

const CITIES = Array.from({ length: 60 }, (_, i) => {
  const cityNames = ['Karachi','Delhi','Mumbai','Chennai','Kolkata','Dhaka','Lahore','Yangon','Bangkok','Ho Chi Minh','Jakarta','Manila','Lagos','Nairobi','Cairo','Riyadh','Dubai','Kuwait City','Doha','Abu Dhabi','Khartoum','Bamako','Niamey','Dakar','Accra','Abidjan','São Paulo','Rio de Janeiro','Buenos Aires','Lima','Bogotá','Mexico City','Havana','Kingston','Madrid','Athens','Palermo','Tunis','Algiers','Casablanca','Colombo','Kathmandu','Kabul','Islamabad','Hyderabad','Pune','Ahmedabad','Surat','Jeddah','Muscat','Aden','Djibouti','Port Sudan','Ndjamena','Ouagadougou','Freetown','Conakry','Monrovia','Harare','Lusaka'];
  const rIdx = Math.floor(sr(i * 3) * REGIONS.length);
  const wbgt = 24 + sr(i * 7) * 17;
  const prodLoss = 3 + sr(i * 11) * 22;
  const adaptCost = 0.2 + sr(i * 13) * 4.8;
  const labourRisk = Math.min(100, 20 + sr(i * 17) * 70);
  const heatDeaths = Math.round(10 + sr(i * 19) * 490);
  const gdpImpact = 0.5 + sr(i * 23) * 6.5;
  const workdaysLost = Math.round(5 + sr(i * 29) * 55);
  const insuranceGap = 20 + sr(i * 31) * 70;
  return { id: i, name: cityNames[i] || `City ${i+1}`, region: REGIONS[rIdx], wbgt: +wbgt.toFixed(1), prodLoss: +prodLoss.toFixed(1), adaptCost: +adaptCost.toFixed(2), labourRisk: +labourRisk.toFixed(1), heatDeaths, gdpImpact: +gdpImpact.toFixed(2), workdaysLost, insuranceGap: +insuranceGap.toFixed(1) };
});

const SECTOR_DATA = SECTORS.map((s, i) => ({
  sector: s,
  exposedWorkers: Math.round(500 + sr(i * 41) * 9500),
  prodLossPct: +(3 + sr(i * 43) * 28).toFixed(1),
  adaptCapex: +(0.5 + sr(i * 47) * 9.5).toFixed(1),
  heatMortality: +(0.2 + sr(i * 53) * 4.8).toFixed(2),
  insuranceCoverage: +(10 + sr(i * 59) * 60).toFixed(1),
  ngfsRcp45: +(1 + sr(i * 61) * 5).toFixed(1),
  ngfsRcp85: +(3 + sr(i * 67) * 12).toFixed(1),
}));

const TABS = ['Overview', 'WBGT Index', 'Productivity Loss', 'Labour Risk', 'Adaptation Finance', 'Sector Exposure', 'Insurance Gap', 'Scenario Analysis'];

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px', borderTop: `3px solid ${color || T.gold}` }}>
      <div style={{ fontSize: 10, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontFamily: T.fontMono }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Bar({ pct, color }) {
  return (
    <div style={{ background: T.borderL, borderRadius: 2, height: 6, width: '100%' }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: 2, background: color || T.gold }} />
    </div>
  );
}

export default function HeatStressFinancePage() {
  const [tab, setTab] = useState(0);
  const [regionFilter, setRegionFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [wbgtMin, setWbgtMin] = useState(24);
  const [scenario, setScenario] = useState('RCP4.5');

  const filtered = useMemo(() => {
    return CITIES.filter(c =>
      (regionFilter === 'All' || c.region === regionFilter) &&
      c.wbgt >= wbgtMin
    );
  }, [regionFilter, wbgtMin]);

  const avgWbgt = filtered.length ? (filtered.reduce((a, c) => a + c.wbgt, 0) / filtered.length).toFixed(1) : '0.0';
  const avgProdLoss = filtered.length ? (filtered.reduce((a, c) => a + c.prodLoss, 0) / filtered.length).toFixed(1) : '0.0';
  const totalAdaptCost = filtered.reduce((a, c) => a + c.adaptCost, 0).toFixed(1);
  const totalHeatDeaths = filtered.reduce((a, c) => a + c.heatDeaths, 0).toLocaleString();
  const avgGdpImpact = filtered.length ? (filtered.reduce((a, c) => a + c.gdpImpact, 0) / filtered.length).toFixed(2) : '0.00';
  const avgInsGap = filtered.length ? (filtered.reduce((a, c) => a + c.insuranceGap, 0) / filtered.length).toFixed(1) : '0.0';

  const scenarioMultiplier = scenario === 'RCP8.5' ? 1.8 : scenario === 'RCP6.0' ? 1.4 : 1.0;

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto', fontFamily: "'DM Sans', sans-serif", background: T.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>EP-DP1 · HEALTH & CLIMATE WELLBEING</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.navy, margin: 0 }}>Heat Stress Finance</h1>
            <p style={{ color: T.textSec, fontSize: 13, marginTop: 4 }}>WBGT index · Productivity loss · Labour risk · Adaptation cost — 60 cities · 8 sectors</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['RCP4.5', 'RCP6.0', 'RCP8.5'].map(s => (
              <button key={s} onClick={() => setScenario(s)} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.border}`, background: scenario === s ? T.navy : T.card, color: scenario === s ? '#fff' : T.navy, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Avg WBGT" value={`${avgWbgt}°C`} sub="Cities in filter" color={T.orange} />
        <KpiCard label="Avg Productivity Loss" value={`${avgProdLoss}%`} sub="Annual hours" color={T.red} />
        <KpiCard label="Total Adapt. Cost" value={`$${totalAdaptCost}Bn`} sub="Capex required" color={T.indigo} />
        <KpiCard label="Heat Deaths/yr" value={totalHeatDeaths} sub="Excess mortality" color={T.red} />
        <KpiCard label="Avg GDP Impact" value={`-${avgGdpImpact}%`} sub={`Under ${scenario}`} color={T.amber} />
        <KpiCard label="Avg Insurance Gap" value={`${avgInsGap}%`} sub="Uninsured exposure" color={T.purple} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, background: T.card, color: T.navy }}>
          <option value="All">All Regions</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Min WBGT:</span>
          <input type="range" min={24} max={38} value={wbgtMin} onChange={e => setWbgtMin(+e.target.value)} style={{ width: 120 }} />
          <span style={{ fontSize: 12, fontFamily: T.fontMono, color: T.navy }}>{wbgtMin}°C</span>
        </div>
        <span style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center' }}>{filtered.length} cities</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 16px', border: 'none', background: 'none', borderBottom: tab === i ? `2px solid ${T.navy}` : '2px solid transparent', color: tab === i ? T.navy : T.textSec, fontWeight: tab === i ? 700 : 400, fontSize: 13, cursor: 'pointer', marginBottom: -2 }}>{t}</button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Top 10 Heat-Stressed Cities</div>
              {[...filtered].sort((a, b) => b.wbgt - a.wbgt).slice(0, 10).map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontFamily: T.fontMono, color: T.textSec, width: 16 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: T.navy, flex: 1 }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: T.textSec }}>{c.region}</span>
                  <span style={{ fontSize: 12, fontFamily: T.fontMono, fontWeight: 700, color: c.wbgt >= 35 ? T.red : c.wbgt >= 30 ? T.amber : T.green }}>{c.wbgt}°C</span>
                  <div style={{ width: 60 }}><Bar pct={(c.wbgt - 24) / 17 * 100} color={c.wbgt >= 35 ? T.red : c.wbgt >= 30 ? T.amber : T.green} /></div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Regional Summary</div>
              {REGIONS.map((r, i) => {
                const rcities = filtered.filter(c => c.region === r);
                const avgW = rcities.length ? (rcities.reduce((a, c) => a + c.wbgt, 0) / rcities.length).toFixed(1) : '-';
                const avgP = rcities.length ? (rcities.reduce((a, c) => a + c.prodLoss, 0) / rcities.length).toFixed(1) : '-';
                return (
                  <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '6px 8px', background: T.sub, borderRadius: 4 }}>
                    <span style={{ fontSize: 13, color: T.navy, flex: 1 }}>{r}</span>
                    <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.textSec }}>{rcities.length} cities</span>
                    <span style={{ fontSize: 12, fontFamily: T.fontMono, color: T.orange }}>WBGT: {avgW}°C</span>
                    <span style={{ fontSize: 12, fontFamily: T.fontMono, color: T.red }}>-{avgP}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>WBGT Index — All Cities</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {filtered.map(c => (
              <div key={c.id} style={{ background: T.sub, borderRadius: 6, padding: '8px 12px', borderLeft: `3px solid ${c.wbgt >= 35 ? T.red : c.wbgt >= 32 ? T.amber : c.wbgt >= 28 ? T.gold : T.green}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{c.name}</div>
                <div style={{ fontSize: 10, color: T.textSec, marginBottom: 4 }}>{c.region}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, fontFamily: T.fontMono, color: c.wbgt >= 35 ? T.red : c.wbgt >= 32 ? T.amber : T.navy }}>{c.wbgt}°C</span>
                  <span style={{ fontSize: 10, fontFamily: T.fontMono, color: c.wbgt >= 35 ? T.red : T.textSec }}>{c.wbgt >= 35 ? 'EXTREME' : c.wbgt >= 32 ? 'HIGH' : c.wbgt >= 28 ? 'MOD' : 'LOW'}</span>
                </div>
                <Bar pct={(c.wbgt - 24) / 17 * 100} color={c.wbgt >= 35 ? T.red : c.wbgt >= 32 ? T.amber : T.green} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Productivity Loss by City (Annual %)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[...filtered].sort((a, b) => b.prodLoss - a.prodLoss).slice(0, 24).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                  <span style={{ fontSize: 12, color: T.navy, width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <div style={{ flex: 1 }}><Bar pct={c.prodLoss / 25 * 100} color={c.prodLoss > 15 ? T.red : c.prodLoss > 10 ? T.amber : T.sage} /></div>
                  <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.navy, width: 40, textAlign: 'right' }}>{c.prodLoss}%</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Sector Productivity Impact</div>
            {SECTOR_DATA.map(s => (
              <div key={s.sector} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ width: 120, fontSize: 13, color: T.navy }}>{s.sector}</span>
                <div style={{ flex: 1 }}><Bar pct={s.prodLossPct / 32 * 100} color={s.prodLossPct > 20 ? T.red : s.prodLossPct > 12 ? T.amber : T.sage} /></div>
                <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.navy, width: 45, textAlign: 'right' }}>{s.prodLossPct}%</span>
                <span style={{ fontSize: 11, color: T.textSec }}>{s.exposedWorkers.toLocaleString()} workers</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {filtered.slice(0, 24).map(c => (
              <div key={c.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 600, color: T.navy, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{c.region}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <div style={{ background: T.sub, borderRadius: 4, padding: '6px 8px' }}>
                    <div style={{ fontSize: 10, color: T.textSec }}>Labour Risk</div>
                    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: T.fontMono, color: c.labourRisk > 70 ? T.red : c.labourRisk > 40 ? T.amber : T.sage }}>{c.labourRisk}%</div>
                  </div>
                  <div style={{ background: T.sub, borderRadius: 4, padding: '6px 8px' }}>
                    <div style={{ fontSize: 10, color: T.textSec }}>Workdays Lost</div>
                    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: T.fontMono, color: T.orange }}>{c.workdaysLost}</div>
                  </div>
                  <div style={{ background: T.sub, borderRadius: 4, padding: '6px 8px' }}>
                    <div style={{ fontSize: 10, color: T.textSec }}>Heat Deaths/yr</div>
                    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: T.fontMono, color: T.red }}>{c.heatDeaths}</div>
                  </div>
                  <div style={{ background: T.sub, borderRadius: 4, padding: '6px 8px' }}>
                    <div style={{ fontSize: 10, color: T.textSec }}>GDP Impact</div>
                    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: T.fontMono, color: T.indigo }}>-{c.gdpImpact}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Adaptation Finance Requirements by City ($Bn)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[...filtered].sort((a, b) => b.adaptCost - a.adaptCost).slice(0, 20).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 100, fontSize: 12, color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <div style={{ flex: 1 }}><Bar pct={c.adaptCost / 5 * 100} color={T.indigo} /></div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.indigo, width: 50, textAlign: 'right' }}>${c.adaptCost}Bn</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Sector Adaptation Capex Requirements</div>
            {SECTOR_DATA.map(s => (
              <div key={s.sector} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{ width: 130, fontSize: 13, color: T.navy }}>{s.sector}</span>
                <div style={{ flex: 1 }}><Bar pct={s.adaptCapex / 10 * 100} color={T.indigo} /></div>
                <span style={{ fontFamily: T.fontMono, fontSize: 12, width: 55 }}>${s.adaptCapex}Bn</span>
                <span style={{ fontSize: 10, color: T.textSec }}>Cooling infra + shade structures</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Sector Exposure Matrix</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Sector', 'Exposed Workers', 'Prod. Loss %', 'Adapt Capex $Bn', 'Heat Mortality', 'Ins. Coverage %', 'NGFS RCP4.5', 'NGFS RCP8.5'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: T.textSec, fontFamily: T.fontMono, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTOR_DATA.map((s, i) => (
                  <tr key={s.sector} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{s.sector}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{s.exposedWorkers.toLocaleString()}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: s.prodLossPct > 15 ? T.red : T.amber }}>{s.prodLossPct}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.indigo }}>${s.adaptCapex}Bn</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.red }}>{s.heatMortality}/1k</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{s.insuranceCoverage}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.amber }}>-{s.ngfsRcp45}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.red }}>-{s.ngfsRcp85}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {filtered.slice(0, 18).map(c => (
              <div key={c.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 600, color: T.navy }}>{c.name}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>{c.region}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: T.textSec }}>Insurance Gap</span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: T.fontMono, color: c.insuranceGap > 60 ? T.red : c.insuranceGap > 40 ? T.amber : T.sage }}>{c.insuranceGap}%</span>
                </div>
                <Bar pct={c.insuranceGap} color={c.insuranceGap > 60 ? T.red : c.insuranceGap > 40 ? T.amber : T.sage} />
                <div style={{ fontSize: 10, color: T.textSec, marginTop: 6 }}>Uninsured heat-related losses · MiDAS parametric trigger</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 7 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Scenario Analysis: GDP Impact Under NGFS Pathways</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'RCP4.5 (Delayed Transition)', multiplier: 1.0, color: T.amber },
                { label: 'RCP6.0 (Current Policies)', multiplier: 1.4, color: T.orange },
                { label: 'RCP8.5 (Hot House World)', multiplier: 1.8, color: T.red },
              ].map(sc => (
                <div key={sc.label} style={{ background: T.sub, borderRadius: 8, padding: 14, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: sc.color, marginBottom: 8 }}>{sc.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: T.fontMono, color: T.navy }}>-{(+avgGdpImpact * sc.multiplier).toFixed(2)}%</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>Avg GDP impact on filtered cities</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Productivity loss: {(+avgProdLoss * sc.multiplier).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Sector-Level Scenario Impact ({scenario})</div>
            {SECTOR_DATA.map(s => (
              <div key={s.sector} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, padding: '8px 10px', background: T.sub, borderRadius: 6 }}>
                <span style={{ width: 120, fontSize: 13, color: T.navy, fontWeight: 600 }}>{s.sector}</span>
                <span style={{ fontSize: 11, color: T.textSec }}>Workers: {s.exposedWorkers.toLocaleString()}</span>
                <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.amber }}>RCP4.5: -{s.ngfsRcp45}%</span>
                <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.red }}>RCP8.5: -{s.ngfsRcp85}%</span>
                <div style={{ flex: 1 }}><Bar pct={(scenario === 'RCP8.5' ? s.ngfsRcp85 : s.ngfsRcp45) / 15 * 100} color={scenario === 'RCP8.5' ? T.red : T.amber} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
