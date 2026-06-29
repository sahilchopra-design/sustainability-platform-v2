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

const MODULES = [
  { id: 1, manufacturer: 'LONGi', product: 'Hi-MO 6', powerClass: 580, efficiency: 22.8, degradYr1: 2.0, degradSubseq: 0.45, tempCoeff: -0.29, warrantyProduct: 15, warrantyPower: 30, bankability: 5, certs: 'IEC61215,IEC61730,MCS', technology: 'TOPCon' },
  { id: 2, manufacturer: 'Jinko', product: 'Tiger Neo 580N', powerClass: 580, efficiency: 23.0, degradYr1: 2.0, degradSubseq: 0.40, tempCoeff: -0.30, warrantyProduct: 12, warrantyPower: 30, bankability: 5, certs: 'IEC61215,IEC61730,UL61730', technology: 'TOPCon' },
  { id: 3, manufacturer: 'JA Solar', product: 'DeepBlue 4.0', powerClass: 615, efficiency: 23.2, degradYr1: 2.0, degradSubseq: 0.45, tempCoeff: -0.30, warrantyProduct: 12, warrantyPower: 30, bankability: 5, certs: 'IEC61215,IEC61730', technology: 'TOPCon' },
  { id: 4, manufacturer: 'Trina Solar', product: 'Vertex S+', powerClass: 440, efficiency: 22.5, degradYr1: 2.0, degradSubseq: 0.45, tempCoeff: -0.32, warrantyProduct: 12, warrantyPower: 30, bankability: 5, certs: 'IEC61215,IEC61730,IEC62716', technology: 'TOPCon' },
  { id: 5, manufacturer: 'First Solar', product: 'Series 7', powerClass: 520, efficiency: 19.8, degradYr1: 2.0, degradSubseq: 0.50, tempCoeff: -0.28, warrantyProduct: 10, warrantyPower: 30, bankability: 5, certs: 'IEC61215,IEC61730,UL61730', technology: 'CdTe' },
  { id: 6, manufacturer: 'REC Group', product: 'Alpha Pure-R', powerClass: 430, efficiency: 22.3, degradYr1: 2.0, degradSubseq: 0.43, tempCoeff: -0.24, warrantyProduct: 20, warrantyPower: 25, bankability: 5, certs: 'IEC61215,IEC61730,MCS,IEC62716', technology: 'HJT' },
  { id: 7, manufacturer: 'Maxeon', product: 'Maxeon 6', powerClass: 440, efficiency: 24.0, degradYr1: 2.0, degradSubseq: 0.40, tempCoeff: -0.29, warrantyProduct: 25, warrantyPower: 40, bankability: 5, certs: 'IEC61215,IEC61730,UL61730', technology: 'IBC' },
  { id: 8, manufacturer: 'Canadian Solar', product: 'HiHero 430HJT', powerClass: 430, efficiency: 22.0, degradYr1: 2.0, degradSubseq: 0.44, tempCoeff: -0.24, warrantyProduct: 15, warrantyPower: 30, bankability: 4, certs: 'IEC61215,IEC61730', technology: 'HJT' },
  { id: 9, manufacturer: 'Hanwha Q CELLS', product: 'Q.PEAK DUO BLK', powerClass: 405, efficiency: 21.5, degradYr1: 2.0, degradSubseq: 0.54, tempCoeff: -0.35, warrantyProduct: 12, warrantyPower: 25, bankability: 4, certs: 'IEC61215,IEC61730,IEC62716', technology: 'PERC' },
  { id: 10, manufacturer: 'Meyer Burger', product: 'White 395W', powerClass: 395, efficiency: 21.8, degradYr1: 2.0, degradSubseq: 0.42, tempCoeff: -0.24, warrantyProduct: 25, warrantyPower: 30, bankability: 4, certs: 'IEC61215,IEC61730', technology: 'HJT' },
  { id: 11, manufacturer: 'Risen Energy', product: 'Titan RSM72', powerClass: 545, efficiency: 21.2, degradYr1: 2.0, degradSubseq: 0.55, tempCoeff: -0.34, warrantyProduct: 12, warrantyPower: 25, bankability: 3, certs: 'IEC61215,IEC61730', technology: 'PERC' },
  { id: 12, manufacturer: 'Huasun', product: 'Himalaya G12', powerClass: 730, efficiency: 24.5, degradYr1: 2.0, degradSubseq: 0.40, tempCoeff: -0.24, warrantyProduct: 12, warrantyPower: 30, bankability: 3, certs: 'IEC61215,IEC61730', technology: 'HJT' },
  { id: 13, manufacturer: 'Seraphim', product: 'Edge Series', powerClass: 415, efficiency: 21.3, degradYr1: 2.5, degradSubseq: 0.60, tempCoeff: -0.36, warrantyProduct: 10, warrantyPower: 25, bankability: 3, certs: 'IEC61215,IEC61730', technology: 'PERC' },
  { id: 14, manufacturer: 'Astronergy', product: 'CHSM72M', powerClass: 585, efficiency: 22.5, degradYr1: 2.0, degradSubseq: 0.45, tempCoeff: -0.31, warrantyProduct: 12, warrantyPower: 30, bankability: 3, certs: 'IEC61215,IEC61730', technology: 'TOPCon' },
  { id: 15, manufacturer: 'Vikram Solar', product: 'Somera Series', powerClass: 545, efficiency: 21.0, degradYr1: 2.5, degradSubseq: 0.55, tempCoeff: -0.38, warrantyProduct: 10, warrantyPower: 25, bankability: 3, certs: 'IEC61215,IEC61730', technology: 'PERC' },
  { id: 16, manufacturer: 'Znshine Solar', product: 'ZXP8-72H', powerClass: 395, efficiency: 20.5, degradYr1: 2.5, degradSubseq: 0.65, tempCoeff: -0.39, warrantyProduct: 10, warrantyPower: 25, bankability: 2, certs: 'IEC61215,IEC61730', technology: 'PERC' },
  { id: 17, manufacturer: 'Axitec', product: 'AXIpremium', powerClass: 410, efficiency: 21.1, degradYr1: 2.0, degradSubseq: 0.50, tempCoeff: -0.36, warrantyProduct: 12, warrantyPower: 30, bankability: 3, certs: 'IEC61215,IEC61730,MCS', technology: 'PERC' },
  { id: 18, manufacturer: 'Silfab Solar', product: 'Elite SIL-380', powerClass: 380, efficiency: 20.8, degradYr1: 2.0, degradSubseq: 0.50, tempCoeff: -0.37, warrantyProduct: 12, warrantyPower: 25, bankability: 3, certs: 'IEC61215,IEC61730,UL61730', technology: 'PERC' },
  { id: 19, manufacturer: 'SunPower', product: 'SPR-MAX3-400', powerClass: 400, efficiency: 22.8, degradYr1: 2.0, degradSubseq: 0.40, tempCoeff: -0.29, warrantyProduct: 25, warrantyPower: 25, bankability: 4, certs: 'IEC61215,IEC61730,UL61730', technology: 'IBC' },
  { id: 20, manufacturer: 'Panasonic', product: 'EverVolt HK', powerClass: 400, efficiency: 21.7, degradYr1: 2.0, degradSubseq: 0.42, tempCoeff: -0.24, warrantyProduct: 25, warrantyPower: 25, bankability: 4, certs: 'IEC61215,IEC61730,UL61730', technology: 'HJT' },
];

function computeP90Yield(module, years = 25) {
  const data = [];
  let power = module.powerClass;
  for (let y = 0; y <= years; y++) {
    if (y === 0) {
      data.push({ year: y, p90: 100, p50: 100 });
    } else {
      const p50Degrade = y === 1
        ? (1 - module.degradYr1 / 100)
        : (1 - module.degradYr1 / 100) * Math.pow(1 - module.degradSubseq / 100, y - 1);
      const p90Degrade = p50Degrade * (1 - sr(y * module.id) * 0.02);
      data.push({ year: y, p50: +(p50Degrade * 100).toFixed(2), p90: +(Math.max(p90Degrade * 100, p50Degrade * 100 - 2.5)).toFixed(2) });
    }
  }
  return data;
}

const TABS = [
  'Bankability Scorecard', 'Degradation Model', 'Warranty Analysis',
  'IEC Test Standards', 'PAN File Simulation', 'Lender Requirements'
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function SolarModuleQualityBankabilityPage() {
  const [tab, setTab] = useState(0);
  const [techFilter, setTechFilter] = useState('All');
  const [selectedModule, setSelectedModule] = useState(MODULES[0]);
  const [bankFilter, setBankFilter] = useState(0);

  const techs = useMemo(() => ['All', ...Array.from(new Set(MODULES.map(m => m.technology)))], []);

  const filtered = useMemo(() => MODULES.filter(m =>
    (techFilter === 'All' || m.technology === techFilter) &&
    m.bankability >= bankFilter
  ), [techFilter, bankFilter]);

  const degradData = useMemo(() => computeP90Yield(selectedModule, 25), [selectedModule]);

  const avgBankability = useMemo(() => filtered.length ? (filtered.reduce((a, m) => a + m.bankability, 0) / filtered.length).toFixed(1) : '0.0', [filtered]);
  const avgDegradSubseq = useMemo(() => filtered.length ? (filtered.reduce((a, m) => a + m.degradSubseq, 0) / filtered.length).toFixed(2) : '0.00', [filtered]);
  const p90at25yr = useMemo(() => {
    const endYield = degradData[degradData.length - 1];
    return endYield ? endYield.p90.toFixed(1) : '0.0';
  }, [degradData]);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 28px', color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>EP-ED6 · PVEL PV Module Reliability Scorecard / DNV Solar Bankability / IEC 61215/61730/62716</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: T.navy }}>Solar Module Quality, Bankability & Warranty Analytics</h1>
        <p style={{ color: T.sub, marginTop: 6, fontSize: 13 }}>P90 yield modelling · LID/LETID degradation · PAN file PVsyst parameters · DNV/PVEL bankability scoring</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Avg Bankability Score" value={`${avgBankability}/5`} sub="PVEL/DNV composite" color={T.green} />
        <KpiCard label="Avg Subsequent Degradation" value={`${avgDegradSubseq}%/yr`} sub="filtered set" color={T.amber} />
        <KpiCard label="P90 Yield at 25yr" value={`${p90at25yr}%`} sub={`${selectedModule.manufacturer} ${selectedModule.product}`} color={T.blue} />
        <KpiCard label="Best Power Warranty" value="40 yrs" sub="Maxeon IBC — industry leading" color={T.teal} />
        <KpiCard label="PVEL Scorecard" value="2024" sub="Annual reliability benchmark" color={T.indigo} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: tab === i ? 700 : 500,
            background: tab === i ? T.navy : T.card, color: tab === i ? '#FFF' : T.sub,
            border: `1px solid ${tab === i ? T.navy : T.border}`, cursor: 'pointer'
          }}>{t}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {techs.map(t => (
          <button key={t} onClick={() => setTechFilter(t)} style={{
            padding: '5px 12px', borderRadius: 14, fontSize: 12, fontWeight: techFilter === t ? 700 : 400,
            background: techFilter === t ? T.teal : T.card, color: techFilter === t ? '#FFF' : T.sub,
            border: `1px solid ${techFilter === t ? T.teal : T.border}`, cursor: 'pointer'
          }}>{t}</button>
        ))}
        {[0, 3, 4, 5].map(b => (
          <button key={b} onClick={() => setBankFilter(b)} style={{
            padding: '5px 12px', borderRadius: 14, fontSize: 12, fontWeight: bankFilter === b ? 700 : 400,
            background: bankFilter === b ? T.indigo : T.card, color: bankFilter === b ? '#FFF' : T.sub,
            border: `1px solid ${bankFilter === b ? T.indigo : T.border}`, cursor: 'pointer'
          }}>{b === 0 ? 'All Bankability' : `Bank ≥ ${b}/5`}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Bankability Score by Manufacturer</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filtered].sort((a, b) => b.bankability - a.bankability || b.efficiency - a.efficiency)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="manufacturer" width={90} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v}/5`, 'Bankability']} />
                <Bar dataKey="bankability" radius={[0, 4, 4, 0]}>
                  {[...filtered].sort((a, b) => b.bankability - a.bankability).map((m, i) => (
                    <Cell key={i} fill={m.bankability >= 5 ? T.green : m.bankability >= 4 ? T.teal : m.bankability >= 3 ? T.amber : T.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Efficiency vs Bankability</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="efficiency" name="Efficiency (%)" label={{ value: 'Efficiency (%)', position: 'insideBottom', offset: -4, fontSize: 11 }} tick={{ fontSize: 11 }} domain={[19, 25]} />
                <YAxis dataKey="bankability" name="Bankability" label={{ value: 'Bankability (1-5)', angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 11 }} domain={[1, 5]} />
                <ZAxis dataKey="powerClass" range={[30, 200]} />
                <Tooltip content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 700 }}>{d.manufacturer} {d.product}</div>
                      <div>Efficiency: {d.efficiency}%</div>
                      <div>Bankability: {d.bankability}/5</div>
                      <div>Technology: {d.technology}</div>
                    </div>
                  );
                }} />
                <Scatter data={filtered} fill={T.blue} opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Module Quality Benchmark Table</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Manufacturer', 'Product', 'Tech', 'Power (W)', 'Eff. (%)', 'Yr1 Degrad.', 'Sub. Degrad.', 'Temp Coeff', 'Prod. Warranty', 'Power Warranty', 'Bankability', 'Certs'].map(h => (
                      <th key={h} style={{ padding: '7px 9px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => (
                    <tr key={m.id} style={{ background: i % 2 === 0 ? T.card : T.bg, cursor: 'pointer' }} onClick={() => setSelectedModule(m)}>
                      <td style={{ padding: '6px 9px', fontWeight: 700, fontSize: 11 }}>{m.manufacturer}</td>
                      <td style={{ padding: '6px 9px', fontSize: 11 }}>{m.product}</td>
                      <td style={{ padding: '6px 9px', fontSize: 11 }}>{m.technology}</td>
                      <td style={{ padding: '6px 9px' }}>{m.powerClass}W</td>
                      <td style={{ padding: '6px 9px' }}>{m.efficiency}%</td>
                      <td style={{ padding: '6px 9px', color: m.degradYr1 > 2 ? T.amber : T.green }}>{m.degradYr1}%</td>
                      <td style={{ padding: '6px 9px', color: m.degradSubseq > 0.55 ? T.red : m.degradSubseq > 0.45 ? T.amber : T.green }}>{m.degradSubseq}%/yr</td>
                      <td style={{ padding: '6px 9px', color: m.tempCoeff < -0.35 ? T.red : T.green }}>{m.tempCoeff}%/°C</td>
                      <td style={{ padding: '6px 9px' }}>{m.warrantyProduct} yr</td>
                      <td style={{ padding: '6px 9px', fontWeight: 600, color: m.warrantyPower >= 30 ? T.green : T.amber }}>{m.warrantyPower} yr</td>
                      <td style={{ padding: '6px 9px', fontWeight: 700, color: m.bankability >= 5 ? T.green : m.bankability >= 4 ? T.teal : T.amber }}>{m.bankability}/5</td>
                      <td style={{ padding: '6px 9px', fontSize: 10, color: T.sub }}>{m.certs}</td>
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
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>P90 vs P50 Yield Model — {selectedModule.manufacturer} {selectedModule.product}</h3>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Click any module in the Bankability tab to update. Technology: {selectedModule.technology}</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={degradData}>
                <defs>
                  <linearGradient id="p50Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.blue} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={T.blue} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="p90Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.red} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={T.red} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} label={{ value: 'Operating Year', position: 'insideBottom', offset: -4, fontSize: 11 }} />
                <YAxis domain={[75, 102]} tick={{ fontSize: 11 }} label={{ value: 'Output (%)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}%`, '']} />
                <Legend />
                <Area type="monotone" dataKey="p50" name="P50 Yield (%)" stroke={T.blue} fill="url(#p50Grad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="p90" name="P90 Yield (%)" stroke={T.red} fill="url(#p90Grad)" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Subsequent Degradation Rate Comparison (%/yr)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filtered].sort((a, b) => a.degradSubseq - b.degradSubseq)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 0.75]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="manufacturer" width={90} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v}%/yr`, 'Degradation']} />
                <Bar dataKey="degradSubseq" radius={[0, 4, 4, 0]}>
                  {[...filtered].sort((a, b) => a.degradSubseq - b.degradSubseq).map((m, i) => (
                    <Cell key={i} fill={m.degradSubseq <= 0.42 ? T.green : m.degradSubseq <= 0.50 ? T.teal : T.amber} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Power Warranty Duration (Years)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...filtered].sort((a, b) => b.warrantyPower - a.warrantyPower)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 45]} />
                <YAxis type="category" dataKey="manufacturer" width={90} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v} years`, 'Power Warranty']} />
                <Bar dataKey="warrantyPower" radius={[0, 4, 4, 0]}>
                  {[...filtered].sort((a, b) => b.warrantyPower - a.warrantyPower).map((m, i) => (
                    <Cell key={i} fill={m.warrantyPower >= 35 ? T.green : m.warrantyPower >= 30 ? T.teal : T.amber} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Warranty Coverage Scatter</h3>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="warrantyProduct" name="Product Warranty (yr)" label={{ value: 'Product Warranty (yr)', position: 'insideBottom', offset: -4, fontSize: 11 }} tick={{ fontSize: 11 }} />
                <YAxis dataKey="warrantyPower" name="Power Warranty (yr)" label={{ value: 'Power Warranty (yr)', angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 11 }} />
                <Tooltip content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}><div style={{ fontWeight: 700 }}>{d.manufacturer}</div><div>Product: {d.warrantyProduct}yr</div><div>Power: {d.warrantyPower}yr</div></div>;
                }} />
                <Scatter data={filtered} fill={T.indigo} opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>IEC Certification Coverage by Module</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={filtered.map(m => ({ manufacturer: m.manufacturer, certCount: m.certs.split(',').length })).sort((a, b) => b.certCount - a.certCount)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 5]} />
                <YAxis type="category" dataKey="manufacturer" width={90} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v} certifications`, 'Count']} />
                <Bar dataKey="certCount" radius={[0, 4, 4, 0]}>
                  {filtered.sort((a, b) => b.certs.split(',').length - a.certs.split(',').length).map((m, i) => (
                    <Cell key={i} fill={m.certs.split(',').length >= 4 ? T.green : m.certs.split(',').length >= 3 ? T.teal : T.amber} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Key IEC Test Standards</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { std: 'IEC 61215', desc: 'Terrestrial photovoltaic modules — design qualification and type approval', scope: 'Baseline' },
                { std: 'IEC 61730', desc: 'PV module safety qualification — construction and testing requirements', scope: 'Safety' },
                { std: 'IEC 62716', desc: 'Ammonia corrosion testing (agri/rooftop environments)', scope: 'Environmental' },
                { std: 'IEC 62782', desc: 'Dynamic mechanical load testing for flex-frame and bifacial', scope: 'Mechanical' },
                { std: 'IEC 63209', desc: 'Extended stress testing — LeTID, light induced degradation', scope: 'Reliability' },
                { std: 'IEC 62804', desc: 'Potential induced degradation (PID) test methods', scope: 'Reliability' },
                { std: 'PVEL Scorecard', desc: 'DNV/PVEL 12-test battery beyond IEC baseline; independent ranking', scope: 'Bankability' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: T.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{s.std}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>{s.desc}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.indigo, whiteSpace: 'nowrap', background: `${T.indigo}15`, padding: '2px 8px', borderRadius: 10 }}>{s.scope}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>PAN File Key Parameters — {selectedModule.manufacturer} {selectedModule.product}</h3>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>PVsyst simulation inputs</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { param: 'Technology', val: selectedModule.technology },
                { param: 'Nominal Power (Pnom)', val: `${selectedModule.powerClass} W` },
                { param: 'Module efficiency (Effic)', val: `${selectedModule.efficiency}%` },
                { param: 'Temperature coeff. (muPmpp)', val: `${selectedModule.tempCoeff}%/°C` },
                { param: 'Yr1 degradation (DegradYr1)', val: `${selectedModule.degradYr1}%` },
                { param: 'Annual degradation (DegradAnn)', val: `${selectedModule.degradSubseq}%/yr` },
                { param: 'Bifaciality factor', val: selectedModule.technology === 'HJT' ? '0.92' : selectedModule.technology === 'IBC' ? '0.95' : selectedModule.technology === 'TOPCon' ? '0.80' : 'n/a' },
                { param: 'IAM model', val: 'ASHRAE b0=0.05 (standard)' },
                { param: 'Low irradiance correction', val: '-0.5% at 200 W/m²' },
                { param: 'Mismatch loss (default)', val: '1.0–2.0%' },
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: i % 2 === 0 ? T.bg : T.card, borderRadius: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: T.sub, fontFamily: 'monospace' }}>{p.param}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{p.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Temp Coefficient Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...filtered].sort((a, b) => a.tempCoeff - b.tempCoeff)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="manufacturer" width={90} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v}%/°C`, 'Temp Coefficient']} />
                <Bar dataKey="tempCoeff" radius={[4, 0, 0, 4]}>
                  {[...filtered].sort((a, b) => a.tempCoeff - b.tempCoeff).map((m, i) => (
                    <Cell key={i} fill={m.tempCoeff >= -0.28 ? T.green : m.tempCoeff >= -0.33 ? T.teal : T.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Lender Requirements Checklist</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { req: 'PVEL / DNV Scorecard', status: 'Required', detail: 'Top Performer listing preferred for project finance' },
                { req: 'IEC 61215 + IEC 61730', status: 'Mandatory', detail: 'Without these, modules are not bankable' },
                { req: 'Bankability Score ≥ 4/5', status: 'Preferred', detail: 'Sub-4 triggers lender hold or additional bond' },
                { req: 'Manufacturer net worth', status: 'Required', detail: '≥ 1x warranty replacement cost of project fleet' },
                { req: 'Degradation < 0.5%/yr', status: 'Preferred', detail: 'P90 bankable models require this assumption' },
                { req: 'Product warranty ≥ 10yr', status: 'Required', detail: 'Minimum acceptable; 12–15yr preferred' },
                { req: 'Power warranty ≥ 25yr', status: 'Required', detail: '25-yr for short-term debt; 30yr for long-term' },
                { req: 'Flash test / factory PAN file', status: 'Recommended', detail: 'Independent lab verification of stated Pnom ±3%' },
                { req: 'LeTID / LID test data', status: 'Recommended', detail: 'IEC 63209 data strengthens lender confidence' },
                { req: 'Insurance reserve', status: 'Required', detail: 'Operations reserve + module replacement reserve' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 10px', background: i % 2 === 0 ? T.bg : T.card, borderRadius: 6, alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0,
                    background: r.status === 'Mandatory' ? `${T.red}20` : r.status === 'Required' ? `${T.amber}20` : `${T.green}20`,
                    color: r.status === 'Mandatory' ? T.red : r.status === 'Required' ? T.amber : T.green
                  }}>{r.status}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{r.req}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>{r.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>P90 Power at Year 25 by Module</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={filtered.map(m => {
                const p50at25 = (1 - m.degradYr1 / 100) * Math.pow(1 - m.degradSubseq / 100, 24) * 100;
                const p90at25 = Math.max(p50at25 * (1 - sr(m.id * 3) * 0.02), p50at25 - 2.5);
                return { manufacturer: m.manufacturer, p90: +p90at25.toFixed(1) };
              }).sort((a, b) => b.p90 - a.p90)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[75, 90]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="manufacturer" width={90} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'P90 Power at Year 25']} />
                <Bar dataKey="p90" radius={[0, 4, 4, 0]}>
                  {[...filtered].sort((a, b) => {
                    const pa = Math.max((1 - a.degradYr1 / 100) * Math.pow(1 - a.degradSubseq / 100, 24) * 100 - 2.5, 0);
                    const pb = Math.max((1 - b.degradYr1 / 100) * Math.pow(1 - b.degradSubseq / 100, 24) * 100 - 2.5, 0);
                    return pb - pa;
                  }).map((m, i) => (
                    <Cell key={i} fill={i < 4 ? T.green : i < 8 ? T.teal : T.amber} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
