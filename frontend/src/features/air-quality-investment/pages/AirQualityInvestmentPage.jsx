import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const POLLUTANTS = ['PM2.5', 'PM10', 'NO2', 'SO2', 'O3', 'CO'];
const REGION_TYPES = ['Industrial', 'Urban', 'Suburban', 'Rural', 'Coastal', 'Alpine'];

const REGIONS = Array.from({ length: 55 }, (_, i) => {
  const regionNames = ['Beijing','Shanghai','Delhi','Mumbai','Lahore','Dhaka','Karachi','Cairo','Lagos','Nairobi','Jakarta','Manila','Bangkok','Ho Chi Minh','Seoul','Tokyo','Osaka','Guangzhou','Chengdu','Wuhan','Kolkata','Chennai','Hyderabad','Bangalore','Tehran','Baghdad','Riyadh','Kabul','Kathmandu','Ulaanbaatar','Los Angeles','Houston','Mexico City','São Paulo','Bogotá','Lima','Buenos Aires','Athens','Warsaw','Prague','Krakow','Istanbul','Ankara','Casablanca','Johannesburg','Accra','Kinshasa','Addis Ababa','Khartoum','Dar es Salaam','Lusaka','Harare','Kampala','Yangon','Hanoi'];
  const rt = REGION_TYPES[Math.floor(sr(i * 5) * REGION_TYPES.length)];
  const pm25 = 5 + sr(i * 7) * 145;
  const no2 = 10 + sr(i * 11) * 90;
  const pm10 = pm25 * (1.2 + sr(i * 13) * 1.3);
  const healthCost = 0.1 + sr(i * 17) * 14.9;
  const adjReturn = (3 + sr(i * 19) * 5) * (1 - pm25 / 200);
  const cleanAirInv = 0.05 + sr(i * 23) * 2.95;
  const premDeaths = Math.round(100 + sr(i * 29) * 4900);
  const whoExceed = pm25 > 15;
  return { id: i, name: regionNames[i] || `Region ${i+1}`, type: rt, pm25: +pm25.toFixed(1), no2: +no2.toFixed(1), pm10: +pm10.toFixed(1), healthCost: +healthCost.toFixed(2), adjReturn: +adjReturn.toFixed(2), cleanAirInv: +cleanAirInv.toFixed(3), premDeaths, whoExceed };
});

const POLLUTANT_FINANCE = POLLUTANTS.map((p, i) => ({
  pollutant: p,
  globalBurdenBn: +(10 + sr(i * 41) * 490).toFixed(1),
  mitigationCapex: +(1 + sr(i * 43) * 49).toFixed(1),
  returnPenalty: +(0.5 + sr(i * 47) * 4.5).toFixed(2),
  whoLimit: [15, 45, 40, 20, 100, 4][i],
  avgLevel: +(10 + sr(i * 53) * 80).toFixed(1),
  exceedanceRate: +(20 + sr(i * 59) * 75).toFixed(1),
}));

const TABS = ['Overview', 'PM2.5 Burden', 'NO2 Analysis', 'Health-Adjusted Returns', 'Clean Air Finance', 'Pollutant Matrix', 'Investment Screener', 'Policy Alignment'];

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

export default function AirQualityInvestmentPage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [pm25Filter, setPm25Filter] = useState(0);
  const [selectedPollutant, setSelectedPollutant] = useState('PM2.5');

  const filtered = useMemo(() => {
    return REGIONS.filter(r =>
      (typeFilter === 'All' || r.type === typeFilter) &&
      r.pm25 >= pm25Filter
    );
  }, [typeFilter, pm25Filter]);

  const avgPm25 = filtered.length ? (filtered.reduce((a, r) => a + r.pm25, 0) / filtered.length).toFixed(1) : '0.0';
  const totalHealthCost = filtered.reduce((a, r) => a + r.healthCost, 0).toFixed(1);
  const totalPremDeaths = filtered.reduce((a, r) => a + r.premDeaths, 0).toLocaleString();
  const avgAdjReturn = filtered.length ? (filtered.reduce((a, r) => a + r.adjReturn, 0) / filtered.length).toFixed(2) : '0.00';
  const totalCleanAirInv = filtered.reduce((a, r) => a + r.cleanAirInv, 0).toFixed(2);
  const whoExceedCount = filtered.filter(r => r.whoExceed).length;

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto', fontFamily: "'DM Sans', sans-serif", background: T.bg, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>EP-DP3 · HEALTH & CLIMATE WELLBEING</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.navy, margin: 0 }}>Air Quality Investment Analytics</h1>
            <p style={{ color: T.textSec, fontSize: 13, marginTop: 4 }}>PM2.5/NO2 burden · Health-adjusted returns · Clean air finance — 55 regions · 6 pollutants</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {POLLUTANTS.map(p => (
              <button key={p} onClick={() => setSelectedPollutant(p)} style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: selectedPollutant === p ? T.navy : T.card, color: selectedPollutant === p ? '#fff' : T.navy, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Avg PM2.5" value={`${avgPm25} μg/m³`} sub="WHO limit: 15" color={T.red} />
        <KpiCard label="Health Cost" value={`$${totalHealthCost}Bn`} sub="Annual burden" color={T.orange} />
        <KpiCard label="Premature Deaths" value={totalPremDeaths} sub="Air pollution" color={T.red} />
        <KpiCard label="Health-Adj Return" value={`${avgAdjReturn}%`} sub="After pollution drag" color={T.teal} />
        <KpiCard label="Clean Air Finance" value={`$${totalCleanAirInv}Bn`} sub="Investment gap" color={T.indigo} />
        <KpiCard label="WHO Exceedances" value={whoExceedCount} sub={`of ${filtered.length} regions`} color={T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, background: T.card, color: T.navy }}>
          <option value="All">All Region Types</option>
          {REGION_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Min PM2.5:</span>
          <input type="range" min={0} max={100} value={pm25Filter} onChange={e => setPm25Filter(+e.target.value)} style={{ width: 100 }} />
          <span style={{ fontSize: 12, fontFamily: T.fontMono, color: T.navy }}>{pm25Filter} μg/m³</span>
        </div>
        <span style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center' }}>{filtered.length} regions</span>
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: `2px solid ${T.border}` }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 14px', border: 'none', background: 'none', borderBottom: tab === i ? `2px solid ${T.navy}` : '2px solid transparent', color: tab === i ? T.navy : T.textSec, fontWeight: tab === i ? 700 : 400, fontSize: 12, cursor: 'pointer', marginBottom: -2 }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Most Polluted Regions (PM2.5 μg/m³)</div>
            {[...filtered].sort((a, b) => b.pm25 - a.pm25).slice(0, 15).map((r, i) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontFamily: T.fontMono, color: T.textSec, width: 18 }}>{i + 1}</span>
                <span style={{ fontSize: 13, color: T.navy, flex: 1 }}>{r.name}</span>
                <span style={{ fontSize: 10, color: T.textSec }}>{r.type}</span>
                <span style={{ fontSize: 12, fontFamily: T.fontMono, color: r.pm25 > 75 ? T.red : r.pm25 > 35 ? T.amber : T.sage, fontWeight: 700 }}>{r.pm25}</span>
                <div style={{ width: 60 }}><Bar pct={r.pm25 / 150 * 100} color={r.pm25 > 75 ? T.red : r.pm25 > 35 ? T.amber : T.sage} /></div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Pollutant Finance Summary</div>
            {POLLUTANT_FINANCE.map(p => (
              <div key={p.pollutant} style={{ marginBottom: 12, padding: '8px 10px', background: T.sub, borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{p.pollutant}</span>
                  <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.red }}>WHO limit: {p.whoLimit} μg/m³</span>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>Burden: <b style={{ color: T.orange }}>${p.globalBurdenBn}Bn</b></span>
                  <span style={{ fontSize: 11, color: T.textSec }}>Exceed: <b style={{ color: T.red }}>{p.exceedanceRate}%</b></span>
                  <span style={{ fontSize: 11, color: T.textSec }}>Mitigation: <b style={{ color: T.indigo }}>${p.mitigationCapex}Bn</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>PM2.5 Burden Across All Regions</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {filtered.map(r => (
              <div key={r.id} style={{ background: T.sub, borderRadius: 6, padding: '10px 12px', borderLeft: `3px solid ${r.pm25 > 75 ? T.red : r.pm25 > 35 ? T.amber : r.pm25 > 15 ? T.gold : T.sage}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{r.name}</div>
                <div style={{ fontSize: 10, color: T.textSec, marginBottom: 4 }}>{r.type}</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: T.fontMono, color: r.pm25 > 75 ? T.red : r.pm25 > 35 ? T.amber : T.sage }}>{r.pm25}</div>
                <div style={{ fontSize: 9, color: T.textSec, marginBottom: 4 }}>μg/m³ {r.whoExceed ? '⚠ WHO EXCEED' : '✓ WHO COMPLIANT'}</div>
                <Bar pct={r.pm25 / 150 * 100} color={r.pm25 > 75 ? T.red : r.pm25 > 35 ? T.amber : T.sage} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>NO2 Analysis — Traffic & Industrial Emissions</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[...filtered].sort((a, b) => b.no2 - a.no2).slice(0, 30).map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: T.sub, borderRadius: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{r.name}</div>
                  <div style={{ fontSize: 10, color: T.textSec }}>{r.type}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontFamily: T.fontMono, fontWeight: 700, color: r.no2 > 60 ? T.red : T.amber }}>{r.no2}</div>
                  <div style={{ fontSize: 9, color: T.textSec }}>μg/m³</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Health-Adjusted Returns — Pollution Drag on Investment Performance</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {filtered.slice(0, 24).map(r => (
                <div key={r.id} style={{ background: T.sub, borderRadius: 6, padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{r.name}</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginBottom: 6 }}>{r.type} · PM2.5: {r.pm25} μg/m³</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div><div style={{ fontSize: 9, color: T.textSec }}>Gross Return</div><div style={{ fontSize: 16, fontFamily: T.fontMono, fontWeight: 700, color: T.sage }}>6.5%</div></div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: 9, color: T.red }}>Health-Adj</div><div style={{ fontSize: 16, fontFamily: T.fontMono, fontWeight: 700, color: T.teal }}>{r.adjReturn}%</div></div>
                  </div>
                  <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>Health cost drag: ${r.healthCost}Bn</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Clean Air Finance — Investment Opportunities by Region</div>
            {[...filtered].sort((a, b) => b.cleanAirInv - a.cleanAirInv).slice(0, 25).map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ width: 110, fontSize: 13, color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                <span style={{ fontSize: 11, color: T.textSec, width: 80 }}>{r.type}</span>
                <div style={{ flex: 1 }}><Bar pct={r.cleanAirInv / 3 * 100} color={T.teal} /></div>
                <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.teal, width: 55 }}>${r.cleanAirInv}Bn</span>
                <span style={{ fontSize: 10, color: r.whoExceed ? T.red : T.sage }}>{r.whoExceed ? 'Priority' : 'Standard'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Pollutant Matrix — Global Finance & Health Impact</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Pollutant', 'WHO Limit', 'Avg Level', 'Exceed Rate %', 'Global Burden $Bn', 'Mitigation Capex', 'Return Penalty %'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: T.textSec, fontFamily: T.fontMono, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {POLLUTANT_FINANCE.map((p, i) => (
                  <tr key={p.pollutant} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: T.navy }}>{p.pollutant}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{p.whoLimit} μg/m³</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: p.avgLevel > p.whoLimit ? T.red : T.sage }}>{p.avgLevel}</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.amber }}>{p.exceedanceRate}%</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.orange }}>${p.globalBurdenBn}Bn</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.indigo }}>${p.mitigationCapex}Bn</td>
                    <td style={{ padding: '8px 12px', fontFamily: T.fontMono, color: T.red }}>-{p.returnPenalty}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Clean Air Investment Screener</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {filtered.filter(r => r.whoExceed).slice(0, 18).map(r => (
                <div key={r.id} style={{ background: T.sub, borderRadius: 8, padding: 12, border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, color: T.navy, fontSize: 13 }}>{r.name}</div>
                    <span style={{ fontSize: 9, fontFamily: T.fontMono, color: T.red, background: `${T.red}15`, padding: '2px 6px', borderRadius: 3 }}>WHO EXCEED</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.textSec, marginBottom: 8 }}>{r.type}</div>
                  {[
                    { label: 'PM2.5', val: `${r.pm25} μg/m³`, color: T.red },
                    { label: 'Health Cost', val: `$${r.healthCost}Bn`, color: T.orange },
                    { label: 'Clean Air Inv', val: `$${r.cleanAirInv}Bn`, color: T.teal },
                    { label: 'Adj Return', val: `${r.adjReturn}%`, color: T.sage },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: T.textSec }}>{item.label}</span>
                      <span style={{ fontSize: 11, fontFamily: T.fontMono, color: item.color, fontWeight: 600 }}>{item.val}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 7 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Policy Alignment — Clean Air Finance Frameworks</div>
          {[
            { policy: 'WHO Global Air Quality Guidelines 2021', scope: 'PM2.5 · PM10 · NO2 · O3 · SO2 · CO', status: 'ACTIVE', bond: 'Green Bond eligible' },
            { policy: 'EU Clean Air Policy Package', scope: 'EU member states · 500M population', status: 'ACTIVE', bond: 'EU Taxonomy aligned' },
            { policy: 'Climate & Clean Air Coalition (CCAC)', scope: '70+ countries · SLCPs focus', status: 'ACTIVE', bond: 'CCAC finance window' },
            { policy: 'World Bank Clean Air Fund', scope: 'Low/middle income · $50Bn pipeline', status: 'ACTIVE', bond: 'MDB concessional' },
            { policy: 'US EPA National Ambient Air Quality Standards', scope: 'US domestic · Global model', status: 'ACTIVE', bond: 'Social bond eligible' },
            { policy: 'UN Environment Programme GEO-7', scope: 'Global · SDG 3.9 · SDG 11.6', status: 'MONITORING', bond: 'SDG-linked finance' },
            { policy: 'C40 Clean Air Cities Network', scope: '100 cities · Urban focus', status: 'ACTIVE', bond: 'Municipal green bond' },
            { policy: 'South Asia Clean Air Programme', scope: 'Bangladesh/India/Nepal/Pakistan', status: 'ACTIVE', bond: 'ADB green finance' },
          ].map(p => (
            <div key={p.policy} style={{ display: 'flex', gap: 14, padding: '10px 12px', marginBottom: 8, background: T.sub, borderRadius: 6, borderLeft: `3px solid ${T.teal}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{p.policy}</div>
                <div style={{ fontSize: 10, color: T.textSec }}>{p.scope}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontFamily: T.fontMono, color: T.sage, marginBottom: 2 }}>{p.status}</div>
                <div style={{ fontSize: 10, color: T.teal }}>{p.bond}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
