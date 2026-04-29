import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie,
  ScatterChart, Scatter, ZAxis,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#F7F6F2', card: '#FFFFFF', border: '#E5E2D9',
  text: '#1A1A2E', sub: '#6B7280', accent: '#B8860B',
  green: '#065F46', red: '#991B1B', blue: '#1E40AF',
  teal: '#0F766E', amber: '#92400E', navy: '#0F172A',
  indigo: '#4F46E5', gold: '#C59A1E', sage: '#4A7C59',
  font: "'DM Sans',system-ui,sans-serif"
};

const SUPPLIERS = [
  { id: 1, manufacturer: 'Tongwei', country: 'China', annualCapacityGW: 300, costUsdKg: 6.2, hhiShare: 18.4, uyghurRisk: 7, certs: 'RBA', tech: 'FBR', region: 'Asia' },
  { id: 2, manufacturer: 'GCL-Poly', country: 'China', annualCapacityGW: 270, costUsdKg: 5.8, hhiShare: 16.5, uyghurRisk: 8, certs: 'OECD', tech: 'Siemens', region: 'Asia' },
  { id: 3, manufacturer: 'Daqo New Energy', country: 'China', annualCapacityGW: 180, costUsdKg: 6.5, hhiShare: 11.0, uyghurRisk: 9, certs: 'None', tech: 'Siemens', region: 'Asia' },
  { id: 4, manufacturer: 'Xinte Energy', country: 'China', annualCapacityGW: 160, costUsdKg: 6.8, hhiShare: 9.8, uyghurRisk: 8, certs: 'RBA', tech: 'FBR', region: 'Asia' },
  { id: 5, manufacturer: 'OCI Solar Power', country: 'South Korea', annualCapacityGW: 55, costUsdKg: 9.1, hhiShare: 3.4, uyghurRisk: 1, certs: 'RBA,OECD', tech: 'Siemens', region: 'Asia' },
  { id: 6, manufacturer: 'Wacker Chemie', country: 'Germany', annualCapacityGW: 80, costUsdKg: 14.2, hhiShare: 4.9, uyghurRisk: 0, certs: 'RBA,OECD,Signatory', tech: 'Siemens', region: 'Europe' },
  { id: 7, manufacturer: 'REC Silicon', country: 'Norway', annualCapacityGW: 20, costUsdKg: 16.5, hhiShare: 1.2, uyghurRisk: 0, certs: 'RBA,OECD,Signatory', tech: 'FBR', region: 'Europe' },
  { id: 8, manufacturer: 'Hemlock Semiconductor', country: 'USA', annualCapacityGW: 36, costUsdKg: 17.8, hhiShare: 2.2, uyghurRisk: 0, certs: 'RBA,OECD', tech: 'Siemens', region: 'Americas' },
  { id: 9, manufacturer: 'Shin-Etsu', country: 'Japan', annualCapacityGW: 28, costUsdKg: 18.5, hhiShare: 1.7, uyghurRisk: 0, certs: 'OECD', tech: 'Siemens', region: 'Asia' },
  { id: 10, manufacturer: 'EAST Hope', country: 'China', annualCapacityGW: 100, costUsdKg: 6.3, hhiShare: 6.1, uyghurRisk: 7, certs: 'None', tech: 'FBR', region: 'Asia' },
  { id: 11, manufacturer: 'Zhongneng Silicon', country: 'China', annualCapacityGW: 60, costUsdKg: 6.6, hhiShare: 3.7, uyghurRisk: 6, certs: 'RBA', tech: 'Siemens', region: 'Asia' },
  { id: 12, manufacturer: 'Asia Silicon', country: 'China', annualCapacityGW: 45, costUsdKg: 7.0, hhiShare: 2.8, uyghurRisk: 7, certs: 'None', tech: 'FBR', region: 'Asia' },
  { id: 13, manufacturer: 'Polysilicon Korea', country: 'South Korea', annualCapacityGW: 18, costUsdKg: 10.2, hhiShare: 1.1, uyghurRisk: 1, certs: 'OECD', tech: 'Siemens', region: 'Asia' },
  { id: 14, manufacturer: 'Qatar Solar', country: 'Qatar', annualCapacityGW: 8, costUsdKg: 12.1, hhiShare: 0.5, uyghurRisk: 2, certs: 'OECD', tech: 'Siemens', region: 'MENA' },
  { id: 15, manufacturer: 'Elkem Solar', country: 'Norway', annualCapacityGW: 6, costUsdKg: 15.8, hhiShare: 0.4, uyghurRisk: 0, certs: 'RBA,OECD,Signatory', tech: 'FBR', region: 'Europe' },
  { id: 16, manufacturer: 'Advanced Silicon Materials', country: 'USA', annualCapacityGW: 12, costUsdKg: 16.9, hhiShare: 0.7, uyghurRisk: 0, certs: 'RBA', tech: 'Siemens', region: 'Americas' },
  { id: 17, manufacturer: 'Mitsubishi Polysilicon', country: 'Japan', annualCapacityGW: 10, costUsdKg: 19.2, hhiShare: 0.6, uyghurRisk: 0, certs: 'OECD', tech: 'Siemens', region: 'Asia' },
  { id: 18, manufacturer: 'Siemens Solar', country: 'India', annualCapacityGW: 5, costUsdKg: 11.4, hhiShare: 0.3, uyghurRisk: 1, certs: 'RBA', tech: 'Siemens', region: 'Asia' },
  { id: 19, manufacturer: 'Canadian Silicon', country: 'Canada', annualCapacityGW: 4, costUsdKg: 15.2, hhiShare: 0.2, uyghurRisk: 0, certs: 'RBA,OECD', tech: 'FBR', region: 'Americas' },
  { id: 20, manufacturer: 'SiliconAustralia', country: 'Australia', annualCapacityGW: 3, costUsdKg: 14.7, hhiShare: 0.2, uyghurRisk: 0, certs: 'OECD,Signatory', tech: 'Siemens', region: 'Pacific' },
];

const PRICE_HISTORY = [
  { year: 2014, polysiliconPrice: 21.5, waferPriceCents: 52, spotVsContract: 1.08 },
  { year: 2015, polysiliconPrice: 16.2, waferPriceCents: 44, spotVsContract: 1.05 },
  { year: 2016, polysiliconPrice: 14.8, waferPriceCents: 38, spotVsContract: 1.03 },
  { year: 2017, polysiliconPrice: 17.1, waferPriceCents: 41, spotVsContract: 1.06 },
  { year: 2018, polysiliconPrice: 12.4, waferPriceCents: 33, spotVsContract: 1.04 },
  { year: 2019, polysiliconPrice: 9.8, waferPriceCents: 28, spotVsContract: 1.02 },
  { year: 2020, polysiliconPrice: 8.1, waferPriceCents: 24, spotVsContract: 0.99 },
  { year: 2021, polysiliconPrice: 24.7, waferPriceCents: 58, spotVsContract: 1.22 },
  { year: 2022, polysiliconPrice: 38.2, waferPriceCents: 76, spotVsContract: 1.35 },
  { year: 2023, polysiliconPrice: 8.9, waferPriceCents: 22, spotVsContract: 0.97 },
  { year: 2024, polysiliconPrice: 5.4, waferPriceCents: 16, spotVsContract: 0.94 },
  { year: 2025, polysiliconPrice: 5.1, waferPriceCents: 14, spotVsContract: 0.95 },
];

const TABS = [
  'Supply Chain Map', 'Price History', 'Concentration & HHI',
  'UFLPA Compliance', 'Technology Comparison', 'Geographic Risk'
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function PolysiliconWaferSupplyChainPage() {
  const [tab, setTab] = useState(0);
  const [regionFilter, setRegionFilter] = useState('All');
  const [techFilter, setTechFilter] = useState('All');

  const regions = useMemo(() => ['All', ...Array.from(new Set(SUPPLIERS.map(s => s.region)))], []);

  const filteredSuppliers = useMemo(() => {
    return SUPPLIERS.filter(s =>
      (regionFilter === 'All' || s.region === regionFilter) &&
      (techFilter === 'All' || s.tech === techFilter)
    );
  }, [regionFilter, techFilter]);

  const totalCapacity = useMemo(() => filteredSuppliers.reduce((a, s) => a + s.annualCapacityGW, 0), [filteredSuppliers]);
  const chinaCapacity = useMemo(() => SUPPLIERS.filter(s => s.country === 'China').reduce((a, s) => a + s.annualCapacityGW, 0), []);
  const chinaPct = useMemo(() => {
    const total = SUPPLIERS.reduce((a, s) => a + s.annualCapacityGW, 0);
    return total ? ((chinaCapacity / total) * 100).toFixed(1) : '0.0';
  }, [chinaCapacity]);

  const hhi = useMemo(() => {
    const total = filteredSuppliers.reduce((a, s) => a + s.annualCapacityGW, 0);
    if (!total) return 0;
    return filteredSuppliers.reduce((acc, s) => acc + Math.pow((s.annualCapacityGW / total) * 100, 2), 0).toFixed(0);
  }, [filteredSuppliers]);

  const avgUyghurRisk = useMemo(() => {
    return filteredSuppliers.length ? (filteredSuppliers.reduce((a, s) => a + s.uyghurRisk, 0) / filteredSuppliers.length).toFixed(1) : '0.0';
  }, [filteredSuppliers]);

  const avgCost = useMemo(() => {
    return filteredSuppliers.length ? (filteredSuppliers.reduce((a, s) => a + s.costUsdKg, 0) / filteredSuppliers.length).toFixed(1) : '0.0';
  }, [filteredSuppliers]);

  const regionConcentration = useMemo(() => {
    const totCap = SUPPLIERS.reduce((a, s) => a + s.annualCapacityGW, 0);
    const byRegion = {};
    SUPPLIERS.forEach(s => { byRegion[s.region] = (byRegion[s.region] || 0) + s.annualCapacityGW; });
    return Object.entries(byRegion).map(([name, cap]) => ({
      name, value: cap, pct: totCap ? ((cap / totCap) * 100).toFixed(1) : '0.0'
    }));
  }, []);

  const techComparison = useMemo(() => {
    const groups = {};
    SUPPLIERS.forEach(s => {
      if (!groups[s.tech]) groups[s.tech] = { count: 0, totalCap: 0, totalCost: 0, totalRisk: 0 };
      groups[s.tech].count++;
      groups[s.tech].totalCap += s.annualCapacityGW;
      groups[s.tech].totalCost += s.costUsdKg;
      groups[s.tech].totalRisk += s.uyghurRisk;
    });
    return Object.entries(groups).map(([tech, d]) => ({
      tech,
      avgCost: d.count ? (d.totalCost / d.count).toFixed(2) : 0,
      totalCap: d.totalCap,
      avgRisk: d.count ? (d.totalRisk / d.count).toFixed(1) : 0,
    }));
  }, []);

  const COLORS = [T.red, T.blue, T.green, T.amber, T.indigo, T.teal];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 28px', color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>EP-ED1 · BloombergNEF / PV InfoLink / NREL</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: T.navy }}>Polysilicon & Wafer Supply Chain Risk Analytics</h1>
        <p style={{ color: T.sub, marginTop: 6, fontSize: 13 }}>China ~85% global polysilicon capacity · UFLPA enacted Dec 2021 · Siemens vs FBR technology cost benchmark</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="China Polysilicon Share" value={`${chinaPct}%`} sub="of global capacity" color={T.red} />
        <KpiCard label="Global Capacity (GW)" value={SUPPLIERS.reduce((a, s) => a + s.annualCapacityGW, 0).toLocaleString()} sub="annualised nameplate" color={T.blue} />
        <KpiCard label="HHI (filtered)" value={hhi} sub=">2500 = highly concentrated" color={Number(hhi) > 2500 ? T.red : T.amber} />
        <KpiCard label="Avg Uyghur Risk" value={`${avgUyghurRisk}/10`} sub="UFLPA exposure score" color={Number(avgUyghurRisk) > 5 ? T.red : T.green} />
        <KpiCard label="Avg Cost ($/kg)" value={`$${avgCost}`} sub="filtered set" color={T.teal} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: tab === i ? 700 : 500,
            background: tab === i ? T.navy : T.card, color: tab === i ? '#FFF' : T.sub,
            border: `1px solid ${tab === i ? T.navy : T.border}`, cursor: 'pointer'
          }}>{t}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {regions.map(r => (
          <button key={r} onClick={() => setRegionFilter(r)} style={{
            padding: '5px 12px', borderRadius: 14, fontSize: 12, fontWeight: regionFilter === r ? 700 : 400,
            background: regionFilter === r ? T.indigo : T.card, color: regionFilter === r ? '#FFF' : T.sub,
            border: `1px solid ${regionFilter === r ? T.indigo : T.border}`, cursor: 'pointer'
          }}>{r}</button>
        ))}
        {['All', 'Siemens', 'FBR'].map(t => (
          <button key={t} onClick={() => setTechFilter(t)} style={{
            padding: '5px 12px', borderRadius: 14, fontSize: 12, fontWeight: techFilter === t ? 700 : 400,
            background: techFilter === t ? T.teal : T.card, color: techFilter === t ? '#FFF' : T.sub,
            border: `1px solid ${techFilter === t ? T.teal : T.border}`, cursor: 'pointer'
          }}>{t === 'All' ? 'All Tech' : t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Supplier Capacity (GW) — Top 12</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filteredSuppliers].sort((a, b) => b.annualCapacityGW - a.annualCapacityGW).slice(0, 12)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="manufacturer" width={100} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v} GW`, 'Capacity']} />
                <Bar dataKey="annualCapacityGW" radius={[0, 4, 4, 0]}>
                  {filteredSuppliers.map((s, i) => <Cell key={i} fill={s.country === 'China' ? T.red : T.blue} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Cost vs Uyghur Risk Score</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="costUsdKg" name="Cost ($/kg)" label={{ value: 'Cost ($/kg)', position: 'insideBottom', offset: -5, fontSize: 11 }} tick={{ fontSize: 11 }} />
                <YAxis dataKey="uyghurRisk" name="Uyghur Risk" label={{ value: 'Uyghur Risk (0-10)', angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 11 }} />
                <ZAxis dataKey="annualCapacityGW" range={[30, 300]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 700 }}>{d.manufacturer}</div>
                      <div>Country: {d.country}</div>
                      <div>Cost: ${d.costUsdKg}/kg</div>
                      <div>Risk: {d.uyghurRisk}/10</div>
                    </div>
                  );
                }} />
                <Scatter data={filteredSuppliers} fill={T.indigo} opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Supplier Details Table</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Manufacturer', 'Country', 'Capacity (GW)', 'Cost ($/kg)', 'HHI Share (%)', 'Uyghur Risk', 'Tech', 'Certifications'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600 }}>{s.manufacturer}</td>
                      <td style={{ padding: '7px 10px' }}>{s.country}</td>
                      <td style={{ padding: '7px 10px' }}>{s.annualCapacityGW}</td>
                      <td style={{ padding: '7px 10px' }}>${s.costUsdKg}</td>
                      <td style={{ padding: '7px 10px' }}>{s.hhiShare}%</td>
                      <td style={{ padding: '7px 10px', color: s.uyghurRisk >= 7 ? T.red : s.uyghurRisk >= 4 ? T.amber : T.green, fontWeight: 600 }}>{s.uyghurRisk}/10</td>
                      <td style={{ padding: '7px 10px' }}>{s.tech}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11 }}>{s.certs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Polysilicon Price History ($/kg) 2014–2025</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={PRICE_HISTORY}>
                <defs>
                  <linearGradient id="polyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.indigo} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={T.indigo} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, n) => [n === 'polysiliconPrice' ? `$${v}/kg` : `${v}¢/Wp`, n === 'polysiliconPrice' ? 'Polysilicon Price' : 'Wafer Price']} />
                <Legend />
                <Area type="monotone" dataKey="polysiliconPrice" name="Polysilicon ($/kg)" stroke={T.indigo} fill="url(#polyGrad)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="spotVsContract" name="Spot/Contract Ratio" stroke={T.amber} strokeWidth={2} dot={false} yAxisId={0} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Wafer Price Trend (¢/Wp)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={PRICE_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}¢/Wp`, 'Wafer Price']} />
                <Line type="monotone" dataKey="waferPriceCents" stroke={T.teal} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700 }}>Key Price Events</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { year: '2021 Spike', note: 'Xinjiang power curtailments + COVID logistics → polysilicon +205% YoY', color: T.red },
                { year: '2022 Peak', note: 'Supply shortages drove $38/kg — highest since 2011; wafers hit 76¢/Wp', color: T.amber },
                { year: '2023 Crash', note: 'Massive Chinese capacity additions flooded market; price fell -77% from peak', color: T.green },
                { year: '2024–25', note: 'Prices stabilised near $5/kg as FBR technology cuts marginal cost to $4–5/kg', color: T.teal },
              ].map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 12px', borderRadius: 8, background: T.bg, borderLeft: `3px solid ${e.color}` }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: e.color, whiteSpace: 'nowrap' }}>{e.year}</span>
                  <span style={{ fontSize: 12, color: T.sub }}>{e.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Regional Capacity Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={regionConcentration} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, pct }) => `${name} ${pct}%`} labelLine={false}>
                  {regionConcentration.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} GW`, 'Capacity']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>HHI Analysis — Market Concentration</h3>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: T.red }}>{hhi}</div>
              <div style={{ fontSize: 12, color: T.sub }}>Herfindahl–Hirschman Index (filtered set)</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'HHI < 1500', desc: 'Unconcentrated market', color: T.green },
                { label: 'HHI 1500–2500', desc: 'Moderately concentrated', color: T.amber },
                { label: 'HHI > 2500', desc: 'Highly concentrated (current)', color: T.red },
              ].map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 10px', borderRadius: 6, background: T.bg }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{h.label}</span>
                  <span style={{ fontSize: 12, color: T.sub }}>{h.desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>HHI Share by Supplier (Top 10)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[...SUPPLIERS].sort((a, b) => b.hhiShare - a.hhiShare).slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="manufacturer" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: 'HHI Share (%)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'HHI Share']} />
                <Bar dataKey="hhiShare" radius={[4, 4, 0, 0]}>
                  {SUPPLIERS.map((s, i) => <Cell key={i} fill={s.country === 'China' ? T.red : T.blue} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>UFLPA Risk Score Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...filteredSuppliers].sort((a, b) => b.uyghurRisk - a.uyghurRisk)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="manufacturer" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}/10`, 'UFLPA Risk Score']} />
                <Bar dataKey="uyghurRisk" radius={[4, 4, 0, 0]}>
                  {filteredSuppliers.map((s, i) => (
                    <Cell key={i} fill={s.uyghurRisk >= 7 ? T.red : s.uyghurRisk >= 4 ? T.amber : T.green} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>UFLPA Compliance Framework</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'UFLPA Enacted', val: 'December 23, 2021', color: T.navy },
                { label: 'Entity List Suppliers', val: `${SUPPLIERS.filter(s => s.uyghurRisk >= 8).length} of 20 suppliers`, color: T.red },
                { label: 'Xinjiang Origin Materials', val: 'Rebuttable presumption of forced labor', color: T.amber },
                { label: 'Required Documentation', val: 'Supply chain traceability to mine level', color: T.blue },
                { label: 'RBA Certified Suppliers', val: `${SUPPLIERS.filter(s => s.certs.includes('RBA')).length} of 20`, color: T.green },
                { label: 'Compliant Capacity', val: `${SUPPLIERS.filter(s => s.uyghurRisk <= 2).reduce((a, s) => a + s.annualCapacityGW, 0)} GW`, color: T.teal },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: T.bg, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: T.sub }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Siemens vs FBR: Avg Cost ($/kg)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={techComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tech" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="avgCost" name="Avg Cost ($/kg)" fill={T.blue} radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgRisk" name="Avg UFLPA Risk" fill={T.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Technology Summary</h3>
            {techComparison.map((t, i) => (
              <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: T.bg, marginBottom: 10, borderLeft: `4px solid ${i === 0 ? T.blue : T.teal}` }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t.tech} Process</div>
                <div style={{ display: 'flex', gap: 20, fontSize: 12, color: T.sub }}>
                  <span>Total Capacity: <strong style={{ color: T.text }}>{t.totalCap} GW</strong></span>
                  <span>Avg Cost: <strong style={{ color: T.text }}>${t.avgCost}/kg</strong></span>
                  <span>Avg Risk: <strong style={{ color: T.red }}>{t.avgRisk}/10</strong></span>
                </div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>
                  {t.tech === 'FBR' ? 'Fluidized Bed Reactor — lower energy, granular product, newer technology' : 'Trichlorosilane thermal decomposition — mature, higher purity, higher energy'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Geopolitical Risk Score by Country</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { country: 'China', risk: 8.5, cap: chinaCapacity },
                { country: 'Germany', risk: 1.2, cap: 80 },
                { country: 'South Korea', risk: 2.1, cap: 73 },
                { country: 'USA', risk: 1.5, cap: 48 },
                { country: 'Norway', risk: 0.8, cap: 26 },
                { country: 'Japan', risk: 1.0, cap: 38 },
                { country: 'Qatar', risk: 3.5, cap: 8 },
                { country: 'India', risk: 2.8, cap: 5 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="country" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="risk" name="Geopolitical Risk (0-10)" fill={T.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Supply Chain Diversification Index</h3>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: T.red }}>Very High Risk</div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>China concentration 85%+ creates critical supply chain vulnerability</div>
            </div>
            {[
              { label: 'Single-country risk', val: 'China >85%', status: 'critical' },
              { label: 'UFLPA exclusion potential', val: `${SUPPLIERS.filter(s => s.uyghurRisk >= 7).reduce((a, s) => a + s.annualCapacityGW, 0)} GW at risk`, status: 'high' },
              { label: 'Allied-nation capacity', val: `${SUPPLIERS.filter(s => ['Germany', 'USA', 'Norway', 'Japan', 'South Korea', 'Canada', 'Australia'].includes(s.country)).reduce((a, s) => a + s.annualCapacityGW, 0)} GW`, status: 'low' },
              { label: 'Diversification timeline', val: 'Meaningful ex-China scale 2028–2030', status: 'medium' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 6, background: T.bg, marginBottom: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: T.sub }}>{r.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: r.status === 'critical' ? T.red : r.status === 'high' ? T.amber : r.status === 'medium' ? T.blue : T.green }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
