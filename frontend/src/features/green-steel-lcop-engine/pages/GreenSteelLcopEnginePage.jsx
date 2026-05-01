import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ScatterChart, Scatter } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E', sub: '#6B7280', indigo: '#4F46E5', green: '#065F46', red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', sky: '#0369A1', steel: '#374151' };
const TABS = ['LCOP Overview', 'DRI-EAF vs BF-BOF', 'Capital Model', 'H₂ Steel Economics', 'Carbon Price Impact', 'Project Pipeline'];

const ROUTES = [
  { id: 'BF-BOF', name: 'BF-BOF (Blast Furnace)', type: 'Conventional', lcop: 420, capex: 1200, ci: 1.85, h2_t: 0, elec_mwh: 0.5, coal_t: 0.78, maturity: 'Mature' },
  { id: 'DRI-EAF-NG', name: 'DRI-EAF (Natural Gas)', type: 'Transition', lcop: 480, capex: 850, ci: 1.10, h2_t: 0, elec_mwh: 1.1, coal_t: 0, maturity: 'Commercial' },
  { id: 'DRI-EAF-H2', name: 'DRI-EAF (Green H₂)', type: 'Green', lcop: 680, capex: 950, ci: 0.05, h2_t: 55, elec_mwh: 1.3, coal_t: 0, maturity: 'Early Comm.' },
  { id: 'EAF-Scrap', name: 'EAF (Scrap/Electric)', type: 'Low-carbon', lcop: 390, capex: 320, ci: 0.60, h2_t: 0, elec_mwh: 0.55, coal_t: 0, maturity: 'Commercial' },
  { id: 'Molten-Oxide', name: 'Molten Oxide Electrolysis', type: 'Emerging', lcop: 750, capex: 1400, ci: 0.02, h2_t: 0, elec_mwh: 3.2, coal_t: 0, maturity: 'Pilot' },
  { id: 'HIsarna', name: 'HIsarna + CCS', type: 'Transition+CCS', lcop: 520, capex: 1150, ci: 0.30, h2_t: 0, elec_mwh: 0.4, coal_t: 0.55, maturity: 'Demo' },
];

const PROJECTS = Array.from({ length: 22 }, (_, i) => {
  const route = ROUTES[Math.floor(sr(i * 7 + 1) * ROUTES.length)];
  const capMt = parseFloat((0.5 + sr(i * 11 + 2) * 4.5).toFixed(1));
  const country = ['Germany', 'Sweden', 'USA', 'Japan', 'South Korea', 'India', 'Brazil', 'Australia'][Math.floor(sr(i * 13 + 3) * 8)];
  const status = ['Operating', 'Construction', 'FID', 'Announced', 'Feasibility'][Math.floor(sr(i * 17 + 4) * 5)];
  const lcop = parseFloat((route.lcop * (0.88 + sr(i * 19 + 5) * 0.28)).toFixed(0));
  const greenPremium = route.type === 'Green' || route.type === 'Low-carbon' ? Math.round(50 + sr(i * 23 + 6) * 150) : 0;
  return { id: i + 1, name: `${country.substring(0, 3)}-${route.id.split('-')[0]}-${i + 1}`, route: route.id, type: route.type, country, status, capMt, lcop, greenPremium, ci: parseFloat((route.ci * (0.9 + sr(i * 29 + 7) * 0.25)).toFixed(2)), capex: Math.round(route.capex * capMt) };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: '1 1 150px' }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);
const Pill = ({ v }) => {
  const c = { Operating: T.green, Construction: T.sky, FID: T.indigo, Announced: T.amber, Feasibility: T.sub, 'Early Comm.': T.sky, Commercial: T.green, Mature: T.steel, Demo: T.amber, Pilot: T.sub }[v] || T.sub;
  return <span style={{ background: c, color: '#fff', fontSize: 10, borderRadius: 12, padding: '2px 8px', fontWeight: 600 }}>{v}</span>;
};

export default function GreenSteelLcopEnginePage() {
  const [tab, setTab] = useState(0);
  const [selType, setSelType] = useState('ALL');
  const [carbonPrice, setCarbonPrice] = useState(80);
  const [h2Price, setH2Price] = useState(4.5);
  const [elecPrice, setElecPrice] = useState(60);

  const filtered = useMemo(() => PROJECTS.filter(p => selType === 'ALL' || p.type === selType), [selType]);
  const avgLcop = useMemo(() => filtered.length ? Math.round(filtered.reduce((s, p) => s + p.lcop, 0) / filtered.length) : 0, [filtered]);
  const avgCi = useMemo(() => filtered.length ? (filtered.reduce((s, p) => s + p.ci, 0) / filtered.length).toFixed(2) : '—', [filtered]);
  const greenCount = useMemo(() => PROJECTS.filter(p => p.type === 'Green' || p.type === 'Low-carbon').length, []);

  const routeWithCarbon = useMemo(() => ROUTES.map(r => ({
    ...r,
    totalLcop: Math.round(r.lcop + r.ci * carbonPrice + r.h2_t * h2Price + r.elec_mwh * elecPrice * 0.1),
    carbonCost: Math.round(r.ci * carbonPrice),
    h2Cost: Math.round(r.h2_t * h2Price),
  })), [carbonPrice, h2Price, elecPrice]);

  const learningCurve = Array.from({ length: 10 }, (_, i) => ({
    year: 2024 + i,
    BF_BOF: Math.round(420 * (1 + i * 0.015)),
    DRI_EAF_H2: Math.round(680 * Math.pow(0.93, i)),
    EAF_Scrap: Math.round(390 * (1 - i * 0.005)),
  }));

  const sensitivityH2 = [1, 2, 3, 4, 5, 6, 7, 8].map(p => ({
    h2: p,
    dri_eaf_h2: Math.round(680 + (p - 4.5) * 15),
    dri_eaf_ng: 480,
    bf_bof: Math.round(420 + carbonPrice * 1.85),
  }));

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      <div style={{ background: '#0C1A2E', padding: '20px 32px', borderBottom: `3px solid ${T.steel}` }}>
        <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>EP-EG1 · Green Steel Suite</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>Green Steel LCOP Engine</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>DRI-EAF · BF-BOF · EAF Scrap · MOE · HIsarna · 6 Routes · 22 Projects · Carbon Price Sensitivity</div>
      </div>
      <div style={{ background: '#0C1A2E', display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid #1E3A5F` }}>
        {TABS.map((t, i) => <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 18px', fontSize: 12, fontWeight: tab === i ? 700 : 400, color: tab === i ? '#94A3B8' : '#6B7280', background: 'none', border: 'none', borderBottom: tab === i ? `2px solid #94A3B8` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>)}
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Avg LCOP (filtered)" value={`$${avgLcop}/t`} sub="Levelized Cost of Production" color={T.steel} />
          <KpiCard label="Projects" value={filtered.length} sub="in pipeline" color={T.indigo} />
          <KpiCard label="Avg CO₂ Intensity" value={`${avgCi} tCO₂/t`} sub="Steel produced" color={avgCi < 0.5 ? T.green : T.amber} />
          <KpiCard label="Green/Low-C Projects" value={`${greenCount}/${PROJECTS.length}`} sub="DRI-H2 + EAF Scrap" color={T.green} />
          <KpiCard label="Green Premium" value="$180–300/t" sub="Over BF-BOF today" color={T.amber} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <select value={selType} onChange={e => setSelType(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, background: T.card, color: T.text }}>
            {['ALL', ...new Set(ROUTES.map(r => r.type))].map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Routes' : t}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>Carbon Price: ${carbonPrice}/t</span><input type="range" min={20} max={200} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 100 }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>H₂ Price: ${h2Price}/kg</span><input type="range" min={1} max={10} step={0.5} value={h2Price} onChange={e => setH2Price(+e.target.value)} style={{ width: 100 }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>Electricity: ${elecPrice}/MWh</span><input type="range" min={20} max={150} value={elecPrice} onChange={e => setElecPrice(+e.target.value)} style={{ width: 100 }} /></div>
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>LCOP by Route (incl. carbon cost at ${carbonPrice}/t)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={routeWithCarbon.map(r => ({ name: r.id.replace('-', '\n'), base: r.lcop, carbon: r.carbonCost, h2: r.h2Cost }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                  <Tooltip formatter={v => [`$${v}/t`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="base" name="Base LCOP" stackId="a" fill={T.steel} />
                  <Bar dataKey="carbon" name="Carbon Cost" stackId="a" fill={T.red} />
                  <Bar dataKey="h2" name="H₂ Cost" stackId="a" fill={T.sky} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>CO₂ Intensity by Route (tCO₂/t steel)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ROUTES.map(r => ({ name: r.id.split('-')[0], ci: r.ci }))} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit=" t" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={v => [`${v} tCO₂/t`, 'CI']} />
                  <Bar dataKey="ci" fill={T.teal} radius={[0, 4, 4, 0]} />
                  <ReferenceLine x={1.85} stroke={T.red} strokeDasharray="4 2" label={{ value: 'BF-BOF', fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>DRI-EAF vs BF-BOF Comparison</div>
              {[['Production Route', 'DRI-EAF (H₂)', 'BF-BOF'], ['CO₂ Intensity', '0.05 tCO₂/t', '1.85 tCO₂/t'], ['CO₂ Reduction', '97%', '—'], ['LCOP (2024)', '$680/t', '$420/t'], ['Green Premium', '+$260/t', '—'], ['CAPEX ($/t cap)', '$950', '$1,200'], ['Electricity (MWh/t)', '1.3', '0.5'], ['H₂ input (kg/t)', '55 kg/t', '—'], ['Coal input (t/t)', '—', '0.78 t/t'], ['Carbon cost @ $80/t', '$4/t', '$148/t'], ['2030 LCOP outlook', '~$500/t', '~$520/t (w/ CBAM)']].map(([metric, dri, bfbof]) => (
                <div key={metric} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span style={{ color: T.sub }}>{metric}</span>
                  <span style={{ fontWeight: 600, color: T.green }}>{dri}</span>
                  <span style={{ fontWeight: 600, color: T.steel }}>{bfbof}</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>LCOP Convergence Timeline</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={learningCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                  <Tooltip formatter={v => [`$${v}/t`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="BF_BOF" name="BF-BOF" stroke={T.steel} strokeWidth={2} dot={false} />
                  <Line dataKey="DRI_EAF_H2" name="DRI-EAF H₂" stroke={T.green} strokeWidth={2} dot={false} />
                  <Line dataKey="EAF_Scrap" name="EAF Scrap" stroke={T.sky} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>CAPEX by Route ($/t capacity)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ROUTES.map(r => ({ name: r.id.split('-')[0], capex: r.capex }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                  <Tooltip formatter={v => [`$${v}/t capacity`, 'CAPEX']} />
                  <Bar dataKey="capex" fill={T.steel} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Route Maturity Assessment</div>
              {ROUTES.map(r => (
                <div key={r.id} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{r.name}</span>
                    <Pill v={r.maturity} />
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 11, color: T.sub }}>
                    <span>LCOP: ${r.lcop}/t</span>
                    <span>CI: {r.ci} tCO₂/t</span>
                    <span>CAPEX: ${r.capex}/t</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>DRI-EAF H₂ Cost Sensitivity to H₂ Price</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={sensitivityH2}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="h2" tick={{ fontSize: 11 }} unit="$/kg" />
                  <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                  <Tooltip formatter={v => [`$${v}/t`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="dri_eaf_h2" name="DRI-EAF H₂" stroke={T.green} strokeWidth={2} dot={false} />
                  <Line dataKey="dri_eaf_ng" name="DRI-EAF NG" stroke={T.amber} strokeWidth={2} dot={false} strokeDasharray="5 3" />
                  <Line dataKey="bf_bof" name="BF-BOF (w/ carbon)" stroke={T.steel} strokeWidth={2} dot={false} />
                  <ReferenceLine x={h2Price} stroke={T.sky} strokeDasharray="3 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>H₂ Break-Even Price for Green Steel Parity</div>
              <div style={{ background: '#F0FFF4', borderRadius: 10, padding: 14, border: `1px solid ${T.green}`, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.green, marginBottom: 6 }}>Break-Even Analysis</div>
                <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7 }}>
                  At ${carbonPrice}/t CO₂:<br />
                  BF-BOF effective cost: <strong>${Math.round(420 + 1.85 * carbonPrice)}/t</strong><br />
                  DRI-EAF H₂ cost: <strong>${Math.round(680 - 55 * (4.5 - h2Price) * 2)}/t</strong><br />
                  Parity H₂ price: <strong>${((680 - 420 - 1.85 * carbonPrice) / (55 * 2)).toFixed(2)}/kg</strong>
                </div>
              </div>
              {[['Steel sector annual emissions', '3.3 Gt CO₂ (8% global)'], ['Global steel production 2024', '~1.9 Gt/yr'], ['Green steel share 2024', '<1%'], ['HYBRIT (Sweden) milestone', '2021: first H₂-DRI steel'], ['H₂ needed for 100% green steel', '~110 Mt H₂/yr'], ['Green H₂ production 2024', '<1 Mt/yr'], ['Carbon border mechanism', 'EU CBAM covers steel from 2026']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 600, maxWidth: '50%', textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>CBAM Impact on Steel Import Cost ($80→$200/t CO₂)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[80, 100, 130, 160, 200].map(cp => ({ price: `$${cp}`, bfbof_import: Math.round(420 + 1.85 * cp), dri_ng: Math.round(480 + 1.10 * cp), dri_h2: Math.round(680 + 0.05 * cp), eaf_scrap: Math.round(390 + 0.60 * cp) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="price" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="bfbof_import" name="BF-BOF Import" fill={T.red} />
                  <Bar dataKey="dri_ng" name="DRI-NG" fill={T.amber} />
                  <Bar dataKey="dri_h2" name="DRI-H₂" fill={T.green} />
                  <Bar dataKey="eaf_scrap" name="EAF Scrap" fill={T.sky} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Annual Carbon Cost per Route @ ${carbonPrice}/tCO₂</div>
              {ROUTES.map(r => (
                <div key={r.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span>{r.id}</span>
                    <span style={{ fontWeight: 600, color: r.ci < 0.3 ? T.green : r.ci < 1 ? T.amber : T.red }}>${Math.round(r.ci * carbonPrice)}/t steel</span>
                  </div>
                  <div style={{ background: T.border, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, r.ci / 1.85 * 100)}%`, background: r.ci < 0.3 ? T.green : r.ci < 1 ? T.amber : T.red, height: '100%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Projects by Status</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={['Operating', 'Construction', 'FID', 'Announced', 'Feasibility'].map(s => ({ status: s, count: PROJECTS.filter(p => p.status === s).length }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={T.steel} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>LCOP vs CI Scatter</div>
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart margin={{ left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="ci" name="CI" unit=" t" tick={{ fontSize: 11 }} label={{ value: 'CO₂ Intensity (t/t steel)', position: 'insideBottom', offset: -8, fontSize: 11 }} />
                    <YAxis dataKey="lcop" name="LCOP" unit=" $/t" tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [n === 'ci' ? `${v} tCO₂/t` : `$${v}/t`, n]} />
                    <Scatter data={filtered.map(p => ({ ci: p.ci, lcop: p.lcop, name: p.name }))} fill={T.steel} fillOpacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Project Pipeline ({filtered.length} projects)</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: '#F8F7F4' }}>
                    {['Project', 'Route', 'Type', 'Country', 'Cap (Mt)', 'LCOP $/t', 'CI (tCO₂/t)', 'Green Premium $/t', 'CAPEX $M', 'Status'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filtered.slice(0, 12).map((p, i) => (
                      <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 ? '#FAFAF7' : T.card }}>
                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>{p.name}</td>
                        <td style={{ padding: '8px 12px', color: T.sub, fontSize: 11 }}>{p.route}</td>
                        <td style={{ padding: '8px 12px', fontSize: 11 }}>{p.type}</td>
                        <td style={{ padding: '8px 12px' }}>{p.country}</td>
                        <td style={{ padding: '8px 12px' }}>{p.capMt}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: p.lcop < 500 ? T.green : T.amber }}>${p.lcop}</td>
                        <td style={{ padding: '8px 12px', color: p.ci < 0.3 ? T.green : T.amber }}>{p.ci}</td>
                        <td style={{ padding: '8px 12px', color: T.teal }}>{p.greenPremium > 0 ? `$${p.greenPremium}` : '—'}</td>
                        <td style={{ padding: '8px 12px' }}>${p.capex}M</td>
                        <td style={{ padding: '8px 12px' }}><Pill v={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
