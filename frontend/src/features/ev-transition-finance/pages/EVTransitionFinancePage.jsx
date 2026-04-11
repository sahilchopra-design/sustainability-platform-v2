import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, Legend, Cell,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const EV_TYPES = ['OEM', 'Charging', 'Battery', 'Software'];
const EV_COUNTRIES = ['USA', 'Germany', 'China', 'Japan', 'South Korea', 'UK', 'France', 'Sweden', 'India', 'Australia'];

const TYPE_COLORS = { OEM: T.blue, Charging: T.green, Battery: T.amber, Software: T.indigo };

const COMPANIES = Array.from({ length: 60 }, (_, i) => {
  const type = i < 35 ? 'OEM' : EV_TYPES[1 + Math.floor(sr(i * 7) * 3)];
  const country = EV_COUNTRIES[Math.floor(sr(i * 11) * EV_COUNTRIES.length)];
  const evRevenuePct = type === 'OEM' ? parseFloat((5 + sr(i * 13) * 85).toFixed(1)) :
    type === 'Charging' ? 100 : type === 'Battery' ? parseFloat((60 + sr(i * 13) * 40).toFixed(1)) : parseFloat((40 + sr(i * 13) * 60).toFixed(1));
  const iceStrandedAssets = type === 'OEM' ? parseFloat((0.5 + sr(i * 17) * 49.5).toFixed(1)) : parseFloat((sr(i * 17) * 2).toFixed(1));
  const evCapex = type === 'OEM' ? parseFloat((0.5 + sr(i * 19) * 19.5).toFixed(1)) : parseFloat((0.1 + sr(i * 19) * 4.9).toFixed(1));
  const evModels = type === 'OEM' ? Math.round(1 + sr(i * 23) * 24) : 0;
  const chargingPoints = type === 'Charging' ? Math.round(1 + sr(i * 29) * 499) : 0;
  const batterySupplySecured = Math.round(20 + sr(i * 31) * 80);
  const marketShare = parseFloat((0.1 + sr(i * 37) * 14.9).toFixed(1));
  const transitionScore = Math.round(20 + sr(i * 41) * 80);
  const climateAligned = transitionScore >= 60;
  const oemNames = ['Tesla', 'BYD', 'Volkswagen', 'GM', 'Ford', 'Rivian', 'Lucid', 'NIO', 'Xpeng', 'Li Auto',
    'Stellantis', 'BMW', 'Mercedes', 'Hyundai', 'Kia', 'Renault', 'Nissan', 'Toyota', 'Honda', 'Volvo',
    'Polestar', 'SAIC', 'Geely', 'Chery', 'CATL OEM', 'Arrival', 'Canoo', 'Fisker', 'VinFast', 'Ola EV',
    'Foxconn EV', 'Mahindra EV', 'Tata EV', 'Subaru EV', 'Mazda EV'];
  const chargNames = ['ChargePoint', 'EVgo', 'Blink', 'IONITY', 'Electrify America', 'BP Pulse', 'Shell Recharge',
    'Pod Point', 'Osprey', 'Gridserve', 'Fastned', 'Mer Charge', 'Engie EV', 'Allego', 'Zunder', 'NewMotion',
    'Virta', 'Driveco', 'Circle K EV', 'TotalEnergies EV', 'AVIA Charge', 'Compleo', 'Heliox', 'ABB E-Mobility', 'Kempower'];
  const name = type === 'OEM' ? oemNames[i % oemNames.length] : type === 'Charging' ? chargNames[(i - 35) % chargNames.length] :
    type === 'Battery' ? ['CATL', 'LG Energy', 'Panasonic', 'Samsung SDI', 'SK On', 'BYD Battery', 'AESC', 'Northvolt'][Math.floor(sr(i * 53) * 8)] :
    ['Mobileye', 'NVIDIA Drive', 'Waymo', 'Argo AI', 'Aurora', 'Zoox', 'Motional'][Math.floor(sr(i * 53) * 7)];
  return { id: i + 1, name, type, country, evRevenuePct, iceStrandedAssets, evCapex, evModels, chargingPoints, batterySupplySecured, marketShare, transitionScore, climateAligned };
});

const MARKET_SHARE_PROJ = [2024, 2026, 2028, 2030, 2035, 2040].map((yr, i) => ({
  year: yr,
  global: Math.round(18 + i * 13 + sr(i * 17) * 5),
  china: Math.round(35 + i * 11 + sr(i * 23) * 5),
  europe: Math.round(22 + i * 12 + sr(i * 29) * 5),
  usa: Math.round(10 + i * 12 + sr(i * 31) * 5),
})).map(d => ({
  ...d,
  global: Math.min(100, d.global),
  china: Math.min(100, d.china),
  europe: Math.min(100, d.europe),
  usa: Math.min(100, d.usa),
}));

const TABS = [
  'OEM Overview', 'EV Market Share', 'Stranded ICE Assets', 'Charging Infrastructure',
  'Battery Supply Chain', 'Transition Scoring', 'Policy Alignment', 'Investment Flows',
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px', flex: 1, minWidth: 180 }}>
    <div style={{ fontSize: 12, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function EVTransitionFinancePage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [evAdoption, setEvAdoption] = useState(30);
  const [carbonPrice, setCarbonPrice] = useState(80);

  const filtered = useMemo(() => COMPANIES.filter(c =>
    (typeFilter === 'All' || c.type === typeFilter) &&
    (countryFilter === 'All' || c.country === countryFilter)
  ), [typeFilter, countryFilter]);

  const totalStranded = filtered.reduce((s, c) => s + c.iceStrandedAssets, 0).toFixed(1);
  const avgEvRevPct = filtered.length ? (filtered.reduce((s, c) => s + c.evRevenuePct, 0) / filtered.length).toFixed(1) : '0.0';
  const totalEvCapex = filtered.reduce((s, c) => s + c.evCapex, 0).toFixed(1);
  const avgTransScore = filtered.length ? Math.round(filtered.reduce((s, c) => s + c.transitionScore, 0) / filtered.length) : 0;

  const oems = filtered.filter(c => c.type === 'OEM');
  const topOems = [...oems].sort((a, b) => b.evRevenuePct - a.evRevenuePct).slice(0, 15);

  const strandedScatter = oems.map(c => ({ x: c.iceStrandedAssets, y: c.transitionScore, name: c.name, evPct: c.evRevenuePct }));

  const chargingByCountry = EV_COUNTRIES.map(cn => ({
    country: cn,
    points: filtered.filter(c => c.type === 'Charging' && c.country === cn).reduce((s, c) => s + c.chargingPoints, 0),
    companies: filtered.filter(c => c.type === 'Charging' && c.country === cn).length,
  })).filter(d => d.companies > 0);

  const batteryData = filtered.filter(c => c.type === 'Battery').map(c => ({
    name: c.name,
    secured: c.batterySupplySecured,
    country: c.country,
  }));

  // Adjusted stranded assets with EV adoption
  const adjStrandedFactor = 1 - (evAdoption - 30) * 0.01 - (carbonPrice - 80) * 0.002;
  const adjStrandedTotal = (parseFloat(totalStranded) * Math.max(0.1, adjStrandedFactor)).toFixed(1);

  const transitionBuckets = [
    { label: 'Leader (≥70)', count: filtered.filter(c => c.transitionScore >= 70).length, color: T.green },
    { label: 'Progressing (50–69)', count: filtered.filter(c => c.transitionScore >= 50 && c.transitionScore < 70).length, color: T.blue },
    { label: 'Lagging (30–49)', count: filtered.filter(c => c.transitionScore >= 30 && c.transitionScore < 50).length, color: T.amber },
    { label: 'At Risk (<30)', count: filtered.filter(c => c.transitionScore < 30).length, color: T.red },
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', padding: '28px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>⚡ EV Transition Finance</span>
          <span style={{ fontSize: 11, background: T.orange, color: '#fff', borderRadius: 4, padding: '2px 8px', fontWeight: 700 }}>EP-DF5</span>
        </div>
        <div style={{ fontSize: 13, color: T.textSec }}>60 OEM & infrastructure companies · Stranded ICE assets, transition scoring, battery supply chain & policy alignment</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
        {[
          { label: 'Type', value: typeFilter, setter: setTypeFilter, opts: ['All', ...EV_TYPES] },
          { label: 'Country', value: countryFilter, setter: setCountryFilter, opts: ['All', ...EV_COUNTRIES] },
        ].map(({ label, value, setter, opts }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>{label}</span>
            <select value={value} onChange={e => setter(e.target.value)}
              style={{ fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', background: T.bg, color: T.textPri }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>EV Adoption: {evAdoption}%</span>
          <input type="range" min={10} max={80} value={evAdoption} onChange={e => setEvAdoption(+e.target.value)} style={{ width: 100 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Carbon: ${carbonPrice}/tCO₂</span>
          <input type="range" min={0} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 100 }} />
        </div>
        <span style={{ fontSize: 12, color: T.textSec, alignSelf: 'center' }}>{filtered.length} companies</span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        <KpiCard label="Total Stranded ICE Assets" value={`$${totalStranded}Bn`} sub={`adj. for ${evAdoption}% EV adoption: $${adjStrandedTotal}Bn`} color={T.red} />
        <KpiCard label="Avg EV Revenue %" value={`${avgEvRevPct}%`} sub="EV share of total revenue" color={T.green} />
        <KpiCard label="Total EV Capex" value={`$${totalEvCapex}Bn/yr`} sub="annual EV investment" color={T.blue} />
        <KpiCard label="Avg Transition Score" value={avgTransScore} sub="0–100 score" color={avgTransScore >= 60 ? T.green : T.amber} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: '7px 14px', borderRadius: 7, border: `1px solid ${tab === i ? T.orange : T.border}`, background: tab === i ? T.orange : T.card, color: tab === i ? '#fff' : T.textSec, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
        {tab === 0 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>OEM Overview — All Filtered Companies</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Company', 'Type', 'Country', 'EV Rev %', 'ICE Stranded ($Bn)', 'EV Capex ($Bn/yr)', 'Models', 'Bat. Supply %', 'Trans. Score'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 20).map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '7px 10px', color: T.navy, fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '7px 10px' }}><span style={{ background: TYPE_COLORS[c.type] + '22', color: TYPE_COLORS[c.type], borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 700 }}>{c.type}</span></td>
                    <td style={{ padding: '7px 10px', color: T.textSec }}>{c.country}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: c.evRevenuePct >= 50 ? T.green : c.evRevenuePct >= 20 ? T.amber : T.red }}>{c.evRevenuePct}%</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: c.iceStrandedAssets > 20 ? T.red : T.amber }}>{c.iceStrandedAssets}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{c.evCapex}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: T.blue }}>{c.evModels || '–'}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{c.batterySupplySecured}%</td>
                    <td style={{ padding: '7px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 40, height: 5, background: T.border, borderRadius: 3 }}>
                          <div style={{ width: `${c.transitionScore}%`, height: 5, background: c.transitionScore >= 70 ? T.green : c.transitionScore >= 50 ? T.blue : T.amber, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: T.fontMono, fontSize: 11 }}>{c.transitionScore}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 1 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>EV Revenue % — Top 15 OEMs</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topOems.map(c => ({ name: c.name, pct: c.evRevenuePct, country: c.country }))}
                layout="vertical" margin={{ top: 10, right: 40, left: 100, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} width={100} />
                <Tooltip formatter={(v) => [`${v}%`, 'EV Revenue']} />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                  {topOems.map((c, idx) => <Cell key={idx} fill={c.evRevenuePct >= 50 ? T.green : c.evRevenuePct >= 20 ? T.blue : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>EV Market Share Projection by Region (% of new car sales)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={MARKET_SHARE_PROJ} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} unit="%" />
                  <Tooltip formatter={(v) => [`${v}%`]} />
                  <Line type="monotone" dataKey="global" name="Global" stroke={T.navy} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="china" name="China" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="europe" name="Europe" stroke={T.blue} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="usa" name="USA" stroke={T.orange} strokeWidth={2} dot={{ r: 3 }} />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Stranded ICE Assets vs Transition Score</div>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>EV Adoption {evAdoption}% · Carbon ${carbonPrice}/tCO₂ → Adjusted stranded: ${adjStrandedTotal}Bn</div>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Stranded ICE Assets ($Bn)" label={{ value: 'Stranded ICE Assets ($Bn)', position: 'bottom', fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis dataKey="y" name="Transition Score" label={{ value: 'Transition Score', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip formatter={(v, n) => [v, n]} />
                <Scatter data={strandedScatter} fill={T.orange} fillOpacity={0.65} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 3 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Charging Infrastructure by Country</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chargingByCountry} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="points" name="Charging Points (k)" fill={T.green} radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="companies" name="Companies" fill={T.blue} radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 4 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Battery Supply Chain — Supply Security by Manufacturer</div>
            {batteryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={batteryData} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} unit="%" />
                  <Tooltip formatter={(v) => [`${v}%`, 'Supply Secured']} />
                  <Bar dataKey="secured" radius={[4, 4, 0, 0]}>
                    {batteryData.map((d, idx) => <Cell key={idx} fill={d.secured >= 70 ? T.green : d.secured >= 50 ? T.amber : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: T.textSec }}>Filter includes no Battery companies. Change filter to show battery supply data.</div>
            )}
          </div>
        )}

        {tab === 5 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Transition Scoring — Portfolio Distribution</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {transitionBuckets.map(b => (
                <div key={b.label} style={{ flex: 1, background: b.color + '18', border: `1px solid ${b.color}44`, borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: b.color, textTransform: 'uppercase' }}>{b.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: b.color, fontFamily: T.fontMono }}>{b.count}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{filtered.length ? ((b.count / filtered.length) * 100).toFixed(0) : 0}% of portfolio</div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={filtered.slice(0, 15).map(c => ({ name: c.name.split(' ')[0], score: c.transitionScore, type: c.type }))}
                margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} />
                <Tooltip formatter={(v) => [v, 'Transition Score']} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {filtered.slice(0, 15).map((c, idx) => <Cell key={idx} fill={c.transitionScore >= 70 ? T.green : c.transitionScore >= 50 ? T.blue : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 6 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Policy Alignment — Regulatory Landscape</div>
            {[
              { region: 'European Union', policy: 'ICE ban by 2035 · CBAM · EU Taxonomy Green criteria for EVs', score: 92, color: T.blue },
              { region: 'United States', policy: 'IRA EV Tax Credit ($7.5k) · EPA ICE 2032 rules · Clean Vehicle Credits', score: 78, color: T.orange },
              { region: 'China', policy: 'NEV dual-credit policy · 2060 carbon neutrality · Subsidy phase-out', score: 88, color: T.red },
              { region: 'UK', policy: 'ZEV mandate 22% by 2024 → 100% by 2035 · OZEV grants ending 2025', score: 82, color: T.purple },
              { region: 'Japan', policy: 'Green growth strategy · EV target 100% by 2035 · $7.8Bn battery investment', score: 71, color: T.green },
            ].map(({ region, policy, score, color }) => (
              <div key={region} style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{region}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color, fontFamily: T.fontMono }}>{score}/100</div>
                </div>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 8 }}>{policy}</div>
                <div style={{ background: T.border, borderRadius: 4, height: 5 }}>
                  <div style={{ width: `${score}%`, height: 5, background: color, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 7 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Investment Flows — EV Capex by Company Type</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={EV_TYPES.map(t => ({
                type: t,
                capex: parseFloat(filtered.filter(c => c.type === t).reduce((s, c) => s + c.evCapex, 0).toFixed(1)),
                count: filtered.filter(c => c.type === t).length,
              }))} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: '$Bn/yr', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textSec }} />
                <Tooltip formatter={(v) => [`$${v}Bn/yr`, 'EV Capex']} />
                <Bar dataKey="capex" radius={[4, 4, 0, 0]}>
                  {EV_TYPES.map(t => <Cell key={t} fill={TYPE_COLORS[t]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
