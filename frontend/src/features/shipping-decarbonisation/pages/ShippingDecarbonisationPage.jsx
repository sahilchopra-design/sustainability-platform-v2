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

const SHIP_TYPES = ['Container', 'Bulk', 'Tanker', 'LNG', 'Cruise', 'Ferry'];
const COUNTRIES = ['Greece', 'Japan', 'China', 'Norway', 'USA', 'Germany', 'South Korea', 'Denmark', 'Singapore', 'UK'];
const CII_RATINGS = ['A', 'B', 'C', 'D', 'E'];
const FUEL_TYPES = ['HFO', 'LNG', 'Methanol', 'Ammonia', 'Hybrid'];

const FLEET_NAMES = [
  'Maersk Ocean', 'MSC Adriatic', 'CMA CGM Pacific', 'Evergreen Star', 'COSCO Pacific',
  'Hapag Lloyd Nordic', 'ONE Atlantic', 'Yang Ming Sun', 'HMM Horizon', 'Zim Mediterranean',
  'Pacific Bulk I', 'Atlantic Bulk II', 'Nordic Dry III', 'Asian Bulk IV', 'Southern Grain V',
  'Eagle Tanker', 'Nordic Spirit', 'Pacific Pride', 'Atlantic Venture', 'Caspian Sea',
  'LNG Atlantic', 'LNG Pacific', 'Q-Max Neptune', 'Arctic LNG I', 'Coral Methane',
  'Viking Cruise I', 'Queen Atlantic', 'Royal Pacific', 'Carnival Nordic', 'MSC Armonia',
  'Baltic Ferry', 'Dover Strait', 'Adriatic Link', 'North Sea Ferry', 'Irish Crossing',
  'Alpha Container', 'Beta Bulk', 'Gamma Tanker', 'Delta LNG', 'Epsilon Carrier',
  'Nordic Green', 'Pacific Clean', 'Atlantic Zero', 'Arctic Pioneer', 'Southern Star',
  'Apollo Container', 'Zeus Bulk', 'Poseidon Tanker', 'Ares LNG', 'Hermes Ferry',
  'Ocean Pioneer', 'Sea Champion', 'Blue Horizon', 'Green Voyager', 'Clean Seas',
  'Future Fleet I', 'Net Zero Ship', 'Hydrogen Wave', 'Ammonia Pioneer', 'Carbon Free I',
];

const FLEETS = Array.from({ length: 60 }, (_, i) => {
  const type = SHIP_TYPES[i % SHIP_TYPES.length];
  const country = COUNTRIES[i % COUNTRIES.length];
  const ciiRating = CII_RATINGS[Math.floor(sr(i * 7) * 5)];
  const fuelType = FUEL_TYPES[Math.floor(sr(i * 11) * 5)];
  const eexi = +(3 + sr(i * 13) * 22).toFixed(2);
  return {
    id: i,
    name: FLEET_NAMES[i] || `Fleet ${i + 1}`,
    type,
    country,
    fleetSize: Math.round(3 + sr(i * 3) * 47),
    avgAgeYrs: +(5 + sr(i * 5) * 20).toFixed(1),
    ciiRating,
    eexi,
    fuelType,
    retrofitCapex: +(5 + sr(i * 17) * 195).toFixed(1),
    greenFuelReadiness: +(1 + sr(i * 19) * 9).toFixed(1),
    imoAligned: sr(i * 23) > 0.45,
    carbonIntensity: +(2 + sr(i * 29) * 18).toFixed(2),
    stranded2030Risk: +(5 + sr(i * 31) * 70).toFixed(1),
  };
});

const TABS = [
  'Fleet Overview', 'CII Ratings', 'Fuel Transition', 'EEXI Compliance',
  'Retrofit Economics', 'Green Fuel Pathways', 'IMO Alignment', 'Stranding Risk',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const CII_COLORS = { A: '#16a34a', B: '#65a30d', C: '#d97706', D: '#ea580c', E: '#dc2626' };

export default function ShippingDecarbonisationPage() {
  const [tab, setTab] = useState(0);
  const [filterType, setFilterType] = useState('All');
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterCII, setFilterCII] = useState('All');
  const [carbonPrice, setCarbonPrice] = useState(75);
  const [fuelPrice, setFuelPrice] = useState(600);

  const filtered = useMemo(() => FLEETS.filter(f =>
    (filterType === 'All' || f.type === filterType) &&
    (filterCountry === 'All' || f.country === filterCountry) &&
    (filterCII === 'All' || f.ciiRating === filterCII)
  ), [filterType, filterCountry, filterCII]);

  const totalFleet = filtered.reduce((a, f) => a + f.fleetSize, 0);
  const avgCII = filtered.length
    ? (filtered.reduce((a, f) => a + CII_RATINGS.indexOf(f.ciiRating), 0) / filtered.length).toFixed(2)
    : '0.00';
  const totalRetrofitCapex = filtered.reduce((a, f) => a + f.retrofitCapex, 0).toFixed(0);
  const imoAlignedPct = filtered.length
    ? ((filtered.filter(f => f.imoAligned).length / filtered.length) * 100).toFixed(1)
    : '0.0';

  const ciiDist = CII_RATINGS.map(r => ({ rating: r, count: filtered.filter(f => f.ciiRating === r).length }));

  const fuelMix = FUEL_TYPES.map(ft => ({
    fuel: ft,
    count: filtered.filter(f => f.fuelType === ft).length,
  }));

  const retrofitByType = SHIP_TYPES.map(t => ({
    type: t,
    capex: +filtered.filter(f => f.type === t).reduce((a, f) => a + f.retrofitCapex, 0).toFixed(1),
  }));

  const carbonCostData = filtered.slice(0, 20).map(f => ({
    name: f.name.split(' ').slice(0, 2).join(' '),
    annualCarbonCost: +(f.carbonIntensity * f.fleetSize * carbonPrice * 0.001).toFixed(1),
    fuelCostPerVessel: +(fuelPrice * f.eexi * 0.1).toFixed(1),
  }));

  const scatterData = filtered.map(f => ({
    x: +f.avgAgeYrs.toFixed(1),
    y: +f.carbonIntensity.toFixed(2),
    name: f.name,
  }));

  const imoReadiness = filtered.slice(0, 15).map(f => ({
    name: f.name.split(' ').slice(0, 2).join(' '),
    readiness: +f.greenFuelReadiness.toFixed(1),
    stranded: +f.stranded2030Risk.toFixed(1),
  }));

  const strandingData = filtered.slice(0, 20).map(f => ({
    name: f.name.split(' ').slice(0, 2).join(' '),
    risk: +f.stranded2030Risk.toFixed(1),
    capex: +f.retrofitCapex.toFixed(1),
  }));

  const eexiData = filtered.slice(0, 20).map(f => ({
    name: f.name.split(' ').slice(0, 2).join(' '),
    eexi: +f.eexi.toFixed(2),
    limit: 10,
  }));

  const fuelPathways = FUEL_TYPES.map(ft => {
    const ships = filtered.filter(f => f.fuelType === ft);
    return {
      fuel: ft,
      avgReadiness: ships.length ? +(ships.reduce((a, s) => a + s.greenFuelReadiness, 0) / ships.length).toFixed(1) : 0,
      fleetCount: ships.reduce((a, s) => a + s.fleetSize, 0),
    };
  });

  const sel = { background: T.navy, color: '#fff', border: `1px solid ${T.navy}` };
  const unsel = { background: T.card, color: T.textPri, border: `1px solid ${T.border}` };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '24px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: 2, marginBottom: 6 }}>
              EP-DJ1 · OCEAN, SHIPPING & BLUE ECONOMY
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff' }}>Shipping Decarbonisation Analytics</h1>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>60 Fleets · CII/EEXI · IMO 2050 · Fuel Transition · Retrofit Economics</div>
          </div>
          <div style={{ textAlign: 'right', color: '#94a3b8', fontSize: 11, fontFamily: T.fontMono }}>
            <div>Carbon Price: ${carbonPrice}/tCO₂</div>
            <div>Fuel Price: ${fuelPrice}/t</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, fontSize: 13 }}>
            <option value="All">All Types</option>
            {SHIP_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, fontSize: 13 }}>
            <option value="All">All Countries</option>
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={filterCII} onChange={e => setFilterCII(e.target.value)}
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, fontSize: 13 }}>
            <option value="All">All CII Ratings</option>
            {CII_RATINGS.map(r => <option key={r}>{r}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Carbon Price: <strong>${carbonPrice}</strong></label>
            <input type="range" min={10} max={300} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 100 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Fuel Price: <strong>${fuelPrice}/t</strong></label>
            <input type="range" min={200} max={2000} step={50} value={fuelPrice} onChange={e => setFuelPrice(+e.target.value)} style={{ width: 100 }} />
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <KpiCard label="Total Fleet Size" value={totalFleet.toLocaleString()} sub="vessels" color={T.teal} />
          <KpiCard label="Avg CII Score" value={avgCII} sub="0=A, 4=E scale" color={T.blue} />
          <KpiCard label="Total Retrofit Capex" value={`$${(+totalRetrofitCapex/1000).toFixed(1)}Bn`} sub="required investment" color={T.amber} />
          <KpiCard label="IMO Aligned" value={`${imoAlignedPct}%`} sub="fleets on track" color={T.green} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              style={{ padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, ...(tab === i ? sel : unsel) }}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 320, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>CII Rating Distribution</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={ciiDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={T.teal} radius={[4, 4, 0, 0]} name="Fleets" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 2, minWidth: 320, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Fleet Age vs Carbon Intensity</div>
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="x" name="Age (yrs)" tick={{ fontSize: 11 }} label={{ value: 'Age (yrs)', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                    <YAxis dataKey="y" name="Carbon Intensity" tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={scatterData} fill={T.indigo} opacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Fleet', 'Type', 'Country', 'Vessels', 'Age (yrs)', 'CII', 'EEXI', 'Fuel', 'IMO Aligned', 'Stranded Risk'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 20).map((f, i) => (
                    <tr key={f.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{f.name}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{f.type}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{f.country}</td>
                      <td style={{ padding: '8px 12px' }}>{f.fleetSize}</td>
                      <td style={{ padding: '8px 12px' }}>{f.avgAgeYrs}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: CII_COLORS[f.ciiRating] + '22', color: CII_COLORS[f.ciiRating], padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontFamily: T.fontMono }}>
                          {f.ciiRating}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{f.eexi}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{f.fuelType}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ color: f.imoAligned ? T.green : T.red, fontWeight: 600 }}>{f.imoAligned ? 'Yes' : 'No'}</span>
                      </td>
                      <td style={{ padding: '8px 12px', color: f.stranded2030Risk > 50 ? T.red : f.stranded2030Risk > 30 ? T.amber : T.green, fontWeight: 600 }}>
                        {f.stranded2030Risk}%
                      </td>
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
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>CII Distribution by Count</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ciiDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="rating" tick={{ fontSize: 13 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Fleets" radius={[6, 6, 0, 0]}>
                    {ciiDist.map((entry, idx) => (
                      <rect key={`bar-${idx}`} fill={CII_COLORS[entry.rating] || T.teal} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              {CII_RATINGS.map(r => {
                const count = filtered.filter(f => f.ciiRating === r).length;
                const pct = filtered.length ? ((count / filtered.length) * 100).toFixed(1) : '0.0';
                return (
                  <div key={r} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 20px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: CII_COLORS[r] }}>CII {r}</span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{count} fleets · {pct}%</span>
                    </div>
                    <div style={{ marginTop: 8, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: CII_COLORS[r], borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 340, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Fuel Type Mix (Fleet Count)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={fuelMix}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="fuel" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.blue} radius={[4, 4, 0, 0]} name="Fleets" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 2, minWidth: 340, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Green Fuel Pathways</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={fuelPathways}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="fuel" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="avgReadiness" fill={T.green} radius={[4, 4, 0, 0]} name="Avg Readiness (0-10)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>EEXI Values (gCO₂/t·nm) — Top 20 Fleets</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={eexiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="eexi" fill={T.indigo} radius={[3, 3, 0, 0]} name="EEXI" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {['A', 'B', 'C', 'D', 'E'].map(r => {
                const ships = filtered.filter(f => f.ciiRating === r);
                const avgEexi = ships.length ? (ships.reduce((a, s) => a + s.eexi, 0) / ships.length).toFixed(2) : '—';
                return (
                  <div key={r} style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px' }}>
                    <div style={{ fontSize: 12, color: T.textSec }}>CII {r} avg EEXI</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: CII_COLORS[r] }}>{avgEexi}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>gCO₂/t·nm</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Retrofit Capex by Ship Type ($M)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={retrofitByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="capex" fill={T.amber} radius={[4, 4, 0, 0]} name="Retrofit Capex ($M)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Annual Carbon Cost vs Fuel Cost — Carbon Price: ${carbonPrice}/tCO₂</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={carbonCostData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="annualCarbonCost" fill={T.red} radius={[3, 3, 0, 0]} name="Carbon Cost ($M)" />
                  <Bar dataKey="fuelCostPerVessel" fill={T.orange} radius={[3, 3, 0, 0]} name="Fuel Cost/Vessel ($K)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 340, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Green Fuel Readiness Score by Fuel Type</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={fuelPathways}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="fuel" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="avgReadiness" fill={T.teal} radius={[4, 4, 0, 0]} name="Avg Readiness" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              {fuelPathways.map(fp => (
                <div key={fp.fuel} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>{fp.fuel}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textSec }}>
                    <span>Fleet vessels: {fp.fleetCount}</span>
                    <span>Readiness: <strong style={{ color: T.teal }}>{fp.avgReadiness}/10</strong></span>
                  </div>
                  <div style={{ marginTop: 8, height: 5, background: T.border, borderRadius: 3 }}>
                    <div style={{ width: `${fp.avgReadiness * 10}%`, height: '100%', background: T.teal, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 6 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>IMO Alignment & Green Fuel Readiness (Top 15)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={imoReadiness}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="readiness" fill={T.green} radius={[3, 3, 0, 0]} name="Green Fuel Readiness (0-10)" />
                  <Bar dataKey="stranded" fill={T.red} radius={[3, 3, 0, 0]} name="Stranded 2030 Risk (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px' }}>
                <div style={{ fontSize: 12, color: T.textSec }}>IMO 2030 Aligned</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: T.green }}>{filtered.filter(f => f.imoAligned).length}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>of {filtered.length} fleets</div>
              </div>
              <div style={{ flex: 1, minWidth: 200, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px' }}>
                <div style={{ fontSize: 12, color: T.textSec }}>Not IMO Aligned</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: T.red }}>{filtered.filter(f => !f.imoAligned).length}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>require transition plan</div>
              </div>
              <div style={{ flex: 1, minWidth: 200, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px' }}>
                <div style={{ fontSize: 12, color: T.textSec }}>Avg Green Fuel Readiness</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: T.teal }}>
                  {filtered.length ? (filtered.reduce((a, f) => a + f.greenFuelReadiness, 0) / filtered.length).toFixed(1) : '0.0'}/10
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 7 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Stranding Risk vs Retrofit Capex (Top 20)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={strandingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="risk" fill={T.red} radius={[3, 3, 0, 0]} name="Stranded 2030 Risk (%)" />
                  <Bar dataKey="capex" fill={T.amber} radius={[3, 3, 0, 0]} name="Retrofit Capex ($M)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Fleet', 'Type', 'CII', 'Fuel', 'Stranded 2030 Risk', 'Retrofit Capex', 'IMO Aligned', 'Carbon Intensity'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filtered].sort((a, b) => b.stranded2030Risk - a.stranded2030Risk).slice(0, 15).map((f, i) => (
                    <tr key={f.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{f.name}</td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{f.type}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ color: CII_COLORS[f.ciiRating], fontWeight: 700 }}>{f.ciiRating}</span>
                      </td>
                      <td style={{ padding: '8px 12px', color: T.textSec }}>{f.fuelType}</td>
                      <td style={{ padding: '8px 12px', color: f.stranded2030Risk > 50 ? T.red : f.stranded2030Risk > 30 ? T.amber : T.green, fontWeight: 600 }}>
                        {f.stranded2030Risk}%
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>${f.retrofitCapex}M</td>
                      <td style={{ padding: '8px 12px', color: f.imoAligned ? T.green : T.red, fontWeight: 600 }}>{f.imoAligned ? 'Yes' : 'No'}</td>
                      <td style={{ padding: '8px 12px', fontFamily: T.fontMono }}>{f.carbonIntensity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
