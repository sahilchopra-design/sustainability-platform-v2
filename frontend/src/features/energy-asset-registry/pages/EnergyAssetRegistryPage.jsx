import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
  ReferenceLine, ZAxis
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const FUEL_COLORS = { Coal:'#374151', Gas:'#3b82f6', Oil:'#92400e', Nuclear:'#7c3aed', Hydro:'#0891b2', Wind:'#06b6d4', Solar:'#f59e0b', Biomass:'#16a34a' };

const ASSETS = [
  { id:'A01', name:'Blackrock Coal Station', type:'Power Plant', fuel:'Coal', capacity_mw:1200, annual_output_gwh:7884, carbon_intensity:920, country:'Australia', lat:-33.8, lng:151.2, year:1985, retirement:2030, book_mn:180, wri_id:'AUS0001234' },
  { id:'A02', name:'Riverview Gas CCGT', type:'Power Plant', fuel:'Gas', capacity_mw:800, annual_output_gwh:5256, carbon_intensity:380, country:'USA', lat:29.7, lng:-95.4, year:2005, retirement:2045, book_mn:320, wri_id:'USA0005678' },
  { id:'A03', name:'Gulf LNG Terminal', type:'LNG Terminal', fuel:'Gas', capacity_mw:0, annual_output_gwh:0, carbon_intensity:45, country:'Qatar', lat:25.3, lng:51.5, year:2010, retirement:2055, book_mn:2100, wri_id:'-' },
  { id:'A04', name:'Darwin Refinery', type:'Refinery', fuel:'Oil', capacity_mw:0, annual_output_gwh:0, carbon_intensity:210, country:'Australia', lat:-12.5, lng:130.8, year:1992, retirement:2035, book_mn:450, wri_id:'-' },
  { id:'A05', name:'Nordic Wind Farm', type:'Power Plant', fuel:'Wind', capacity_mw:600, annual_output_gwh:1752, carbon_intensity:12, country:'Norway', lat:59.9, lng:10.8, year:2018, retirement:2048, book_mn:480, wri_id:'NOR0003456' },
  { id:'A06', name:'Sahara Solar Park', type:'Power Plant', fuel:'Solar', capacity_mw:400, annual_output_gwh:876, carbon_intensity:8, country:'Morocco', lat:31.6, lng:-8.0, year:2020, retirement:2050, book_mn:350, wri_id:'MAR0007890' },
  { id:'A07', name:'Rhine Nuclear Plant', type:'Power Plant', fuel:'Nuclear', capacity_mw:1400, annual_output_gwh:11388, carbon_intensity:6, country:'France', lat:48.9, lng:2.3, year:1990, retirement:2040, book_mn:890, wri_id:'FRA0002345' },
  { id:'A08', name:'Andes Hydro Dam', type:'Power Plant', fuel:'Hydro', capacity_mw:950, annual_output_gwh:4161, carbon_intensity:18, country:'Chile', lat:-33.4, lng:-70.7, year:1998, retirement:2058, book_mn:520, wri_id:'CHL0006789' },
  { id:'A09', name:'Appalachian Coal Mine', type:'Mine', fuel:'Coal', capacity_mw:0, annual_output_gwh:0, carbon_intensity:1100, country:'USA', lat:37.8, lng:-81.2, year:1978, retirement:2028, book_mn:85, wri_id:'-' },
  { id:'A10', name:'Permian Basin Pipeline', type:'Pipeline', fuel:'Oil', capacity_mw:0, annual_output_gwh:0, carbon_intensity:65, country:'USA', lat:31.9, lng:-102.1, year:2002, retirement:2050, book_mn:780, wri_id:'-' },
  { id:'A11', name:'Shandong Coal Station', type:'Power Plant', fuel:'Coal', capacity_mw:2000, annual_output_gwh:13140, carbon_intensity:950, country:'China', lat:36.7, lng:117.0, year:1995, retirement:2032, book_mn:210, wri_id:'CHN0001111' },
  { id:'A12', name:'Jakarta Gas Turbine', type:'Power Plant', fuel:'Gas', capacity_mw:500, annual_output_gwh:3285, carbon_intensity:410, country:'Indonesia', lat:-6.2, lng:106.8, year:2008, retirement:2040, book_mn:190, wri_id:'IDN0002222' },
  { id:'A13', name:'Texas Wind Complex', type:'Power Plant', fuel:'Wind', capacity_mw:1000, annual_output_gwh:2920, carbon_intensity:11, country:'USA', lat:32.4, lng:-99.7, year:2019, retirement:2049, book_mn:720, wri_id:'USA0003333' },
  { id:'A14', name:'Rajasthan Solar Farm', type:'Power Plant', fuel:'Solar', capacity_mw:750, annual_output_gwh:1643, carbon_intensity:9, country:'India', lat:26.9, lng:70.9, year:2021, retirement:2051, book_mn:410, wri_id:'IND0004444' },
  { id:'A15', name:'Alberta Oil Sands', type:'Mine', fuel:'Oil', capacity_mw:0, annual_output_gwh:0, carbon_intensity:580, country:'Canada', lat:56.7, lng:-111.4, year:1999, retirement:2038, book_mn:1200, wri_id:'-' },
  { id:'A16', name:'Biomass CHP Leipzig', type:'Power Plant', fuel:'Biomass', capacity_mw:120, annual_output_gwh:788, carbon_intensity:45, country:'Germany', lat:51.3, lng:12.4, year:2015, retirement:2045, book_mn:95, wri_id:'DEU0005555' },
  { id:'A17', name:'North Sea Gas Platform', type:'Pipeline', fuel:'Gas', capacity_mw:0, annual_output_gwh:0, carbon_intensity:72, country:'UK', lat:57.5, lng:1.8, year:2001, retirement:2036, book_mn:560, wri_id:'-' },
  { id:'A18', name:'Patagonia Wind Park', type:'Power Plant', fuel:'Wind', capacity_mw:350, annual_output_gwh:1022, carbon_intensity:10, country:'Argentina', lat:-51.6, lng:-69.2, year:2022, retirement:2052, book_mn:280, wri_id:'ARG0006666' },
  { id:'A19', name:'South Africa Coal Plant', type:'Power Plant', fuel:'Coal', capacity_mw:3600, annual_output_gwh:23652, carbon_intensity:1010, country:'South Africa', lat:-26.2, lng:28.0, year:1980, retirement:2029, book_mn:120, wri_id:'ZAF0007777' },
  { id:'A20', name:'Bass Strait Refinery', type:'Refinery', fuel:'Oil', capacity_mw:0, annual_output_gwh:0, carbon_intensity:195, country:'Australia', lat:-38.3, lng:145.1, year:1988, retirement:2033, book_mn:340, wri_id:'-' },
  { id:'A21', name:'Caspian Gas Field', type:'Pipeline', fuel:'Gas', capacity_mw:0, annual_output_gwh:0, carbon_intensity:55, country:'Kazakhstan', lat:41.6, lng:50.3, year:2006, retirement:2046, book_mn:920, wri_id:'-' },
  { id:'A22', name:'Ontario Nuclear Station', type:'Power Plant', fuel:'Nuclear', capacity_mw:900, annual_output_gwh:7020, carbon_intensity:5, country:'Canada', lat:43.9, lng:-78.2, year:1993, retirement:2043, book_mn:650, wri_id:'CAN0008888' },
  { id:'A23', name:'Atacama Solar Gigapark', type:'Power Plant', fuel:'Solar', capacity_mw:1200, annual_output_gwh:2628, carbon_intensity:7, country:'Chile', lat:-23.6, lng:-68.1, year:2023, retirement:2053, book_mn:860, wri_id:'CHL0009999' },
  { id:'A24', name:'Polish Brown Coal', type:'Power Plant', fuel:'Coal', capacity_mw:1800, annual_output_gwh:11826, carbon_intensity:1080, country:'Poland', lat:51.1, lng:17.0, year:1982, retirement:2031, book_mn:95, wri_id:'POL0010000' },
  { id:'A25', name:'Mozambique LNG', type:'LNG Terminal', fuel:'Gas', capacity_mw:0, annual_output_gwh:0, carbon_intensity:42, country:'Mozambique', lat:-12.3, lng:40.5, year:2024, retirement:2060, book_mn:3200, wri_id:'-' },
  { id:'A26', name:'Vietnam Coal II', type:'Power Plant', fuel:'Coal', capacity_mw:600, annual_output_gwh:3942, carbon_intensity:890, country:'Vietnam', lat:20.8, lng:106.7, year:2015, retirement:2045, book_mn:280, wri_id:'VNM0011111' },
  { id:'A27', name:'Bavaria Hydro Run-of-River', type:'Power Plant', fuel:'Hydro', capacity_mw:180, annual_output_gwh:1051, carbon_intensity:4, country:'Germany', lat:47.6, lng:11.0, year:1965, retirement:2055, book_mn:110, wri_id:'DEU0012222' },
  { id:'A28', name:'Kuwait Oil Refinery', type:'Refinery', fuel:'Oil', capacity_mw:0, annual_output_gwh:0, carbon_intensity:240, country:'Kuwait', lat:29.2, lng:48.0, year:1996, retirement:2040, book_mn:680, wri_id:'-' },
  { id:'A29', name:'Taiwan Offshore Wind', type:'Power Plant', fuel:'Wind', capacity_mw:900, annual_output_gwh:2628, carbon_intensity:13, country:'Taiwan', lat:24.1, lng:120.7, year:2025, retirement:2055, book_mn:950, wri_id:'TWN0013333' },
  { id:'A30', name:'Colombian Biomass Plant', type:'Power Plant', fuel:'Biomass', capacity_mw:80, annual_output_gwh:525, carbon_intensity:50, country:'Colombia', lat:4.7, lng:-74.1, year:2019, retirement:2049, book_mn:55, wri_id:'COL0014444' },
];

const TABS = ['Asset Map','Carbon Intensity by Asset','Capacity Mix','Age & Retirement','WRI GPPD Cross-Reference','Asset Watchlist'];
const sectorAvgCI = Math.round(ASSETS.reduce((s,a) => s + a.carbon_intensity, 0) / ASSETS.length);

export default function EnergyAssetRegistryPage() {
  const [tab, setTab] = useState(0);
  const [fuelFilter, setFuelFilter] = useState('All');
  const [sortBy, setSortBy] = useState('carbon_intensity');
  const [bookmarked, setBookmarked] = useState([]);

  const fuels = ['All', ...Object.keys(FUEL_COLORS)];
  const filtered = useMemo(() => fuelFilter === 'All' ? ASSETS : ASSETS.filter(a => a.fuel === fuelFilter), [fuelFilter]);

  const capacityByFuel = useMemo(() => {
    const map = {};
    ASSETS.filter(a => a.capacity_mw > 0).forEach(a => { map[a.fuel] = (map[a.fuel] || 0) + a.capacity_mw; });
    return Object.entries(map).map(([fuel, mw]) => ({ fuel, mw }));
  }, []);

  const ageData = useMemo(() => {
    const decades = {};
    ASSETS.forEach(a => {
      const d = Math.floor(a.year / 10) * 10 + 's';
      decades[d] = (decades[d] || 0) + 1;
    });
    return Object.entries(decades).sort().map(([dec, count]) => ({ decade: dec, count }));
  }, []);

  const retirementTimeline = useMemo(() => {
    const years = {};
    ASSETS.forEach(a => { const y = a.retirement; years[y] = (years[y] || 0) + 1; });
    return Object.entries(years).sort(([a],[b]) => a - b).map(([yr, count]) => ({ year: +yr, count }));
  }, []);

  const watchlist = useMemo(() => ASSETS.filter(a => a.carbon_intensity > sectorAvgCI), []);

  const card = (label, value, sub, color = T.navy) => (
    <div style={{ background: T.surface, borderRadius: 10, padding: '14px 18px', border: `1px solid ${T.border}`, minWidth: 150 }}>
      <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ background: T.navy, color: '#fff', fontFamily: T.mono, fontSize: 11, padding: '3px 10px', borderRadius: 6 }}>EP-CU1</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Energy Asset Registry</h1>
      </div>
      <p style={{ color: T.textSec, fontSize: 13, marginBottom: 16 }}>
        Comprehensive asset-level inventory with carbon intensity, capacity mix, and WRI GPPD cross-referencing.
        <span style={{ fontFamily: T.mono, marginLeft: 8, fontSize: 11, color: T.textMut }}>Source: WRI Global Power Plant Database (GPPD v1.3)</span>
      </p>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {card('Total Assets', ASSETS.length, '30 across 15 countries')}
        {card('Total Capacity', `${(ASSETS.reduce((s,a) => s + a.capacity_mw, 0)/1000).toFixed(1)} GW`, 'Nameplate capacity')}
        {card('Avg Carbon Intensity', `${sectorAvgCI}`, 'tCO2/GWh weighted', sectorAvgCI > 400 ? T.red : T.green)}
        {card('Book Value', `$${(ASSETS.reduce((s,a) => s + a.book_mn, 0)/1000).toFixed(1)}B`, 'Total book value')}
        {card('Watchlist', watchlist.length, `Assets > ${sectorAvgCI} tCO2/GWh`, T.red)}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 18 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '10px 18px', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 13, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? T.navy : T.textSec, background: tab === i ? T.surface : 'transparent',
            borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent', marginBottom: -2, borderRadius: '6px 6px 0 0'
          }}>{t}</button>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <select value={fuelFilter} onChange={e => setFuelFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13 }}>
          {fuels.map(f => <option key={f}>{f}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13 }}>
          <option value="carbon_intensity">Sort: Carbon Intensity</option>
          <option value="capacity_mw">Sort: Capacity</option>
          <option value="book_mn">Sort: Book Value</option>
          <option value="year">Sort: Commissioning Year</option>
        </select>
      </div>

      {/* Tab Content */}
      {tab === 0 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Asset Location Map (Scatter Proxy)</h3>
          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="lng" type="number" name="Longitude" domain={[-120, 160]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="lat" type="number" name="Latitude" domain={[-60, 70]} tick={{ fontSize: 11 }} />
              <ZAxis dataKey="capacity_mw" range={[40, 400]} name="Capacity MW" />
              <Tooltip content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (<div style={{ background: '#fff', border: `1px solid ${T.border}`, padding: 10, borderRadius: 8, fontSize: 12 }}>
                  <div style={{ fontWeight: 700 }}>{d.name}</div>
                  <div>{d.type} | {d.fuel} | {d.country}</div>
                  <div>Capacity: {d.capacity_mw} MW | CI: {d.carbon_intensity} tCO2/GWh</div>
                </div>);
              }} />
              {filtered.map(a => (
                <Scatter key={a.id} data={[a]} fill={FUEL_COLORS[a.fuel] || T.navy}>
                  <Cell fill={FUEL_COLORS[a.fuel] || T.navy} opacity={0.8} />
                </Scatter>
              ))}
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10 }}>
            {Object.entries(FUEL_COLORS).map(([f, c]) => (
              <span key={f} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />{f}
              </span>
            ))}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Carbon Intensity by Asset (tCO2/GWh)</h3>
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={[...filtered].sort((a, b) => b.carbon_intensity - a.carbon_intensity)} layout="vertical" margin={{ left: 140 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={135} />
              <Tooltip formatter={v => [`${v} tCO2/GWh`, 'Carbon Intensity']} />
              <ReferenceLine x={sectorAvgCI} stroke={T.red} strokeDasharray="5 5" label={{ value: `Avg ${sectorAvgCI}`, position: 'top', fontSize: 11 }} />
              <Bar dataKey="carbon_intensity" radius={[0, 4, 4, 0]}>
                {[...filtered].sort((a, b) => b.carbon_intensity - a.carbon_intensity).map(a => (
                  <Cell key={a.id} fill={a.carbon_intensity > sectorAvgCI ? T.red : T.green} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Capacity Mix by Fuel Type</h3>
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <Pie data={capacityByFuel} dataKey="mw" nameKey="fuel" cx="50%" cy="50%" outerRadius={130} label={({ fuel, mw }) => `${fuel}: ${mw} MW`}>
                {capacityByFuel.map(d => <Cell key={d.fuel} fill={FUEL_COLORS[d.fuel] || T.navy} />)}
              </Pie>
              <Tooltip formatter={v => [`${v} MW`, 'Capacity']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, padding: 12, background: T.bg, borderRadius: 8, fontSize: 12, color: T.textSec }}>
            <strong>Note:</strong> Renewables (Wind + Solar + Hydro + Biomass) = {Math.round(capacityByFuel.filter(d => ['Wind','Solar','Hydro','Biomass'].includes(d.fuel)).reduce((s,d) => s + d.mw, 0) / capacityByFuel.reduce((s,d) => s + d.mw, 0) * 100)}% of total capacity.
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Commissioning Decade Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="decade" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill={T.navy} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <h3 style={{ color: T.navy, fontSize: 15, margin: '20px 0 12px' }}>Planned Retirement Timeline</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={retirementTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="stepAfter" dataKey="count" stroke={T.red} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>WRI Global Power Plant Database Cross-Reference</h3>
          <p style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Cross-referenced with WRI GPPD v1.3. Pipeline, refinery, mine, and terminal assets have no GPPD ID.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Asset','Type','Fuel','Capacity MW','Country','WRI GPPD ID','Matched'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10, color: T.textMut }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ASSETS.map(a => (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>{a.name}</td>
                    <td style={{ padding: '6px 10px' }}>{a.type}</td>
                    <td style={{ padding: '6px 10px' }}><span style={{ background: FUEL_COLORS[a.fuel], color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 10 }}>{a.fuel}</span></td>
                    <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{a.capacity_mw || '-'}</td>
                    <td style={{ padding: '6px 10px' }}>{a.country}</td>
                    <td style={{ padding: '6px 10px', fontFamily: T.mono, fontSize: 11 }}>{a.wri_id}</td>
                    <td style={{ padding: '6px 10px' }}>{a.wri_id !== '-' ? <span style={{ color: T.green }}>Yes</span> : <span style={{ color: T.textMut }}>N/A</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 4 }}>Asset Watchlist</h3>
          <p style={{ fontSize: 12, color: T.textSec, marginBottom: 14 }}>Assets with carbon intensity above sector average ({sectorAvgCI} tCO2/GWh) flagged for transition review.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#fef2f2' }}>
                  {['Asset','Fuel','CI tCO2/GWh','Over Avg','Retirement','Book $M','Action'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10, color: T.red }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {watchlist.sort((a, b) => b.carbon_intensity - a.carbon_intensity).map(a => (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>{a.name}</td>
                    <td style={{ padding: '6px 10px' }}>{a.fuel}</td>
                    <td style={{ padding: '6px 10px', fontFamily: T.mono, color: T.red, fontWeight: 700 }}>{a.carbon_intensity}</td>
                    <td style={{ padding: '6px 10px', fontFamily: T.mono }}>+{a.carbon_intensity - sectorAvgCI}</td>
                    <td style={{ padding: '6px 10px' }}>{a.retirement}</td>
                    <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{a.book_mn}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <button onClick={() => setBookmarked(b => b.includes(a.id) ? b.filter(x => x !== a.id) : [...b, a.id])}
                        style={{ padding: '3px 10px', borderRadius: 4, border: `1px solid ${bookmarked.includes(a.id) ? T.gold : T.border}`, background: bookmarked.includes(a.id) ? '#fef3c7' : T.surface, cursor: 'pointer', fontSize: 11 }}>
                        {bookmarked.includes(a.id) ? 'Bookmarked' : 'Bookmark'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 14, padding: 12, background: '#fef2f2', borderRadius: 8, fontSize: 12, color: T.red, border: `1px solid #fecaca` }}>
            <strong>Transition Risk:</strong> {watchlist.length} assets ({Math.round(watchlist.length / ASSETS.length * 100)}%) exceed sector average CI. Total book value at risk: ${(watchlist.reduce((s,a) => s + a.book_mn, 0)/1000).toFixed(1)}B.
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 20, padding: 14, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 11, color: T.textMut }}>
        <strong>Data Sources:</strong> WRI Global Power Plant Database v1.3 | IEA World Energy Outlook 2025 | Company annual reports.
        <span style={{ float: 'right', fontFamily: T.mono }}>EP-CU1 v1.0 | Asset Registry</span>
      </div>
    </div>
  );
}
