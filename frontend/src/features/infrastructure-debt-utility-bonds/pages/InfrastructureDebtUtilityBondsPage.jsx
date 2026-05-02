import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A',
  sub: '#64748B', accent: '#EF4444', blue: '#2563EB', indigo: '#4F46E5',
  green: '#059669', amber: '#D97706', red: '#DC2626', purple: '#7C3AED',
  teal: '#0D9488', sky: '#0284C7', muted: '#94A3B8',
};

const BONDS = [
  { id:1, issuer:'National Grid plc', sector:'T&D', type:'Green Bond', size:1000, currency:'GBP', coupon:4.25, tenor:12, maturity:'2036', rating:'Baa1/BBB+', spread:88, duration:9.8, ffo_debt:13.2, gearing:68, use:'Offshore HVDC cables', certified:'CBI', ytm:4.81, dscr:1.62 },
  { id:2, issuer:'Thames Water', sector:'Water', type:'Secured Bond', size:750, currency:'GBP', coupon:5.875, tenor:8, maturity:'2032', rating:'Baa2/BBB', spread:195, duration:6.4, ffo_debt:8.4, gearing:82, use:'Capital investment programme', certified:'None', ytm:6.18, dscr:1.38 },
  { id:3, issuer:'Terna SpA', sector:'T&D', type:'Green Bond', size:800, currency:'EUR', coupon:3.50, tenor:10, maturity:'2034', rating:'Baa2/BBB+', spread:72, duration:8.6, ffo_debt:15.1, gearing:58, use:'Grid infrastructure', certified:'CBI', ytm:3.98, dscr:1.68 },
  { id:4, issuer:'Duke Energy', sector:'Electric', type:'Green Bond', size:1250, currency:'USD', coupon:4.875, tenor:30, maturity:'2054', rating:'Baa1/BBB+', spread:105, duration:17.2, ffo_debt:14.8, gearing:54, use:'Clean energy transition', certified:'ICMA', ytm:5.14, dscr:1.71 },
  { id:5, issuer:'Enel Finance', sector:'Electric', type:'SLB', size:1500, currency:'EUR', coupon:3.375, tenor:8, maturity:'2032', rating:'Baa1/BBB+', spread:65, duration:6.9, ffo_debt:16.2, gearing:52, use:'General — RE capacity KPI', certified:'ICMA SLB', ytm:3.78, dscr:1.74 },
  { id:6, issuer:'Anglian Water', sector:'Water', type:'Green Bond', size:400, currency:'GBP', coupon:4.50, tenor:12, maturity:'2036', rating:'Baa2/BBB', spread:115, duration:9.4, ffo_debt:12.8, gearing:69, use:'Water efficiency & resilience', certified:'CBI', ytm:4.95, dscr:1.58 },
  { id:7, issuer:'Fluxys Belgium', sector:'Gas', type:'Sustainability Bond', size:600, currency:'EUR', coupon:2.875, tenor:15, maturity:'2039', rating:'A3/A-', spread:52, duration:12.1, ffo_debt:18.4, gearing:48, use:'H2 readiness & biomethane', certified:'ICMA', ytm:3.22, dscr:1.82 },
  { id:8, issuer:'Engie SA', sector:'Multi-utility', type:'Green Bond', size:1200, currency:'EUR', coupon:3.125, tenor:10, maturity:'2034', rating:'Baa1/BBB+', spread:68, duration:8.8, ffo_debt:15.6, gearing:50, use:'Renewables & green hydrogen', certified:'CBI', ytm:3.64, dscr:1.76 },
  { id:9, issuer:'Ameren Corp', sector:'Electric', type:'First Mortgage Bond', size:500, currency:'USD', coupon:5.25, tenor:10, maturity:'2034', rating:'Baa1/BBB+', spread:98, duration:7.8, ffo_debt:14.2, gearing:56, use:'Grid modernisation', certified:'None', ytm:5.64, dscr:1.66 },
  { id:10, issuer:'Veolia Environment', sector:'Water/Waste', type:'SLB', size:700, currency:'EUR', coupon:2.75, tenor:7, maturity:'2031', rating:'Baa1/BBB', spread:78, duration:5.9, ffo_debt:13.8, gearing:62, use:'Water & waste KPIs', certified:'ICMA SLB', ytm:3.28, dscr:1.59 },
  { id:11, issuer:'Severn Trent Water', sector:'Water', type:'Green Bond', size:350, currency:'GBP', coupon:4.00, tenor:10, maturity:'2034', rating:'Baa1/BBB+', spread:92, duration:8.2, ffo_debt:15.4, gearing:67, use:'Leakage & biodiversity', certified:'CBI', ytm:4.48, dscr:1.61 },
  { id:12, issuer:'Equinor ASA', sector:'Energy Trans.', type:'Green Bond', size:1000, currency:'USD', coupon:4.625, tenor:20, maturity:'2044', rating:'Aa3/AA-', spread:62, duration:14.8, ffo_debt:24.2, gearing:32, use:'Offshore wind & CCS', certified:'CBI', ytm:4.98, dscr:2.18 },
  { id:13, issuer:'Sempra LNG', sector:'Gas', type:'First Mortgage Bond', size:900, currency:'USD', coupon:5.50, tenor:10, maturity:'2034', rating:'Baa1/BBB+', spread:118, duration:7.6, ffo_debt:13.6, gearing:58, use:'LNG terminal capex', certified:'None', ytm:5.92, dscr:1.64 },
  { id:14, issuer:'Orsted A/S', sector:'Renewables', type:'Green Bond', size:800, currency:'EUR', coupon:3.75, tenor:10, maturity:'2034', rating:'Baa1/BBB+', spread:72, duration:8.4, ffo_debt:14.8, gearing:46, use:'Offshore wind CAPEX', certified:'CBI', ytm:4.18, dscr:1.78 },
  { id:15, issuer:'Cadent Gas', sector:'Gas', type:'Green Bond', size:500, currency:'GBP', coupon:4.125, tenor:12, maturity:'2036', rating:'Baa2/BBB', spread:108, duration:9.6, ffo_debt:12.4, gearing:71, use:'Gas network upgrades', certified:'ICMA', ytm:4.62, dscr:1.52 },
  { id:16, issuer:'Edison International', sector:'Electric', type:'SLB', size:600, currency:'USD', coupon:5.75, tenor:5, maturity:'2029', rating:'Baa2/BBB', spread:142, duration:4.2, ffo_debt:11.2, gearing:60, use:'PSPS wildfire KPI linked', certified:'ICMA SLB', ytm:6.18, dscr:1.49 },
  { id:17, issuer:'SNAM SpA', sector:'Gas', type:'Transition Bond', size:750, currency:'EUR', coupon:3.25, tenor:8, maturity:'2032', rating:'Baa1/BBB+', spread:75, duration:6.8, ffo_debt:15.8, gearing:54, use:'H2 blending infra', certified:'ICMA Trans', ytm:3.68, dscr:1.71 },
  { id:18, issuer:'Consolidated Edison', sector:'Electric/Gas', type:'Debenture', size:400, currency:'USD', coupon:5.50, tenor:10, maturity:'2034', rating:'Baa1/A-', spread:88, duration:7.6, ffo_debt:14.4, gearing:54, use:'General utility capex', certified:'None', ytm:5.92, dscr:1.68 },
  { id:19, issuer:'EDP Finance', sector:'Renewables', type:'Green Bond', size:1000, currency:'EUR', coupon:3.625, tenor:7, maturity:'2031', rating:'Baa2/BBB', spread:82, duration:5.9, ffo_debt:14.0, gearing:56, use:'Wind & solar CAPEX', certified:'CBI', ytm:4.08, dscr:1.63 },
  { id:20, issuer:'Xcel Energy', sector:'Electric', type:'First Mortgage Bond', size:550, currency:'USD', coupon:4.75, tenor:10, maturity:'2034', rating:'Baa1/BBB+', spread:92, duration:7.8, ffo_debt:13.8, gearing:58, use:'Clean energy capex', certified:'None', ytm:5.14, dscr:1.65 },
  { id:21, issuer:'Gasunie', sector:'Gas', type:'Sustainability Bond', size:650, currency:'EUR', coupon:2.50, tenor:15, maturity:'2039', rating:'Aa2/AA', spread:38, duration:12.4, ffo_debt:22.6, gearing:42, use:'H2 backbone network', certified:'ICMA', ytm:2.94, dscr:2.04 },
  { id:22, issuer:'RTE France', sector:'T&D', type:'Green Bond', size:900, currency:'EUR', coupon:3.25, tenor:20, maturity:'2044', rating:'A3/A-', spread:54, duration:15.2, ffo_debt:17.8, gearing:46, use:'Grid reinforcement', certified:'CBI', ytm:3.64, dscr:1.88 },
  { id:23, issuer:'National Grid US', sector:'Electric', type:'Secured Bond', size:800, currency:'USD', coupon:5.00, tenor:10, maturity:'2034', rating:'Baa1/BBB+', spread:94, duration:7.9, ffo_debt:14.6, gearing:55, use:'New England grid upgrade', certified:'None', ytm:5.38, dscr:1.67 },
  { id:24, issuer:'Iberdrola Finance', sector:'Electric', type:'Green Bond', size:1100, currency:'EUR', coupon:3.875, tenor:10, maturity:'2034', rating:'Baa1/BBB+', spread:71, duration:8.5, ffo_debt:15.2, gearing:50, use:'Renewables & smart grids', certified:'CBI', ytm:4.18, dscr:1.72 },
];

const CREDIT_CURVE = [
  { tenor: 2, aa: 38, a: 52, bbb: 78, bb: 185 },
  { tenor: 5, aa: 42, a: 62, bbb: 95, bb: 225 },
  { tenor: 7, aa: 46, a: 68, bbb: 108, bb: 255 },
  { tenor: 10, aa: 52, a: 78, bbb: 122, bb: 290 },
  { tenor: 15, aa: 58, a: 88, bbb: 142, bb: 340 },
  { tenor: 20, aa: 62, a: 96, bbb: 158, bb: 375 },
  { tenor: 30, aa: 68, a: 108, bbb: 178, bb: 420 },
];

const ISSUANCE_TREND = Array.from({ length: 8 }, (_, i) => ({
  year: 2017 + i,
  green: Math.round(42 + i*18 + sr(i*7)*15),
  slb: Math.round(i > 2 ? (i-2)*12 + sr(i*11)*8 : 0),
  transition: Math.round(i > 4 ? (i-4)*8 + sr(i*9)*5 : 0),
  conventional: Math.round(120 + i*8 + sr(i*13)*20),
}));

const COVENANT_DATA = [
  { name: 'FFO/Net Debt', threshold: '≥ 13%', category: 'Baa1', description: 'Moody\'s investment grade threshold for regulated utilities' },
  { name: 'Net Debt/EBITDA', threshold: '≤ 5.0×', category: 'Baa1', description: 'S&P leverage metric — critical for BBB rating floor' },
  { name: 'DSCR', threshold: '≥ 1.50×', category: 'Project Debt', description: 'Minimum debt service coverage — triggers cash lock-up below' },
  { name: 'Gearing (RAB)', threshold: '≤ 70%', category: 'UK Water', description: 'Ofwat default threshold — breach triggers licence modification' },
  { name: 'Interest Coverage', threshold: '≥ 3.0×', category: 'All Utility', description: 'EBIT/Interest — typically hardcoded in bond indentures' },
  { name: 'Capex / Maintenance', threshold: '≥ 85%', category: 'Infrastructure', description: 'Ensures adequate reinvestment — serviceability maintenance' },
  { name: 'Equity Ratio', threshold: '≥ 35%', category: 'Hybrid Struct.', description: 'Minimum equity in capital structure post-distribution lock-up' },
  { name: 'Distribution Lock-up DSCR', threshold: '< 1.20×', category: 'Project Debt', description: 'Distributions locked below this level — waterfall protection' },
];

const SPREAD_HISTORY = Array.from({ length: 48 }, (_, i) => ({
  period: `${2021 + Math.floor(i/12)}Q${(i%12 >= 9 ? 4 : i%12 >= 6 ? 3 : i%12 >= 3 ? 2 : 1)}`,
  bbb_utility: Math.round(82 + sr(i*7)*45 + (i > 20 ? 30 : 0) + (i > 36 ? -15 : 0)),
  a_utility: Math.round(54 + sr(i*11)*28 + (i > 20 ? 18 : 0) + (i > 36 ? -8 : 0)),
  greenium: Math.round(8 + sr(i*9)*6),
})).filter((_,i)=>i%3===0);

const RADAR_INFRA_DEBT = [
  { axis: 'Credit Quality', value: 82 },
  { axis: 'Duration Match', value: 74 },
  { axis: 'Inflation Protection', value: 88 },
  { axis: 'ESG Alignment', value: 79 },
  { axis: 'Liquidity', value: 65 },
  { axis: 'Covenant Quality', value: 76 },
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Pill = ({ label, color }) => (
  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: `${color}20`, color, border: `1px solid ${color}40`, marginRight: 4 }}>{label}</span>
);

export default function InfrastructureDebtUtilityBondsPage() {
  const [tab, setTab] = useState(0);
  const [filterType, setFilterType] = useState('All');
  const [filterSector, setFilterSector] = useState('All');
  const [selBond, setSelBond] = useState(0);
  const [durationTarget, setDurationTarget] = useState(10);
  const [ratingFilter, setRatingFilter] = useState('All');

  const bond = BONDS[selBond];
  const bondTypes = ['All', ...new Set(BONDS.map(b => b.type))];
  const sectors = ['All', ...new Set(BONDS.map(b => b.sector))];
  const ratings = ['All', 'AA', 'A', 'BBB'];

  const filtered = useMemo(() => BONDS.filter(b => {
    const typeMatch = filterType === 'All' || b.type === filterType;
    const sectorMatch = filterSector === 'All' || b.sector === filterSector;
    const ratingMatch = ratingFilter === 'All' || (ratingFilter === 'AA' ? b.rating.includes('Aa') : ratingFilter === 'A' ? b.rating.startsWith('A3') || b.rating.includes('A-') : true);
    return typeMatch && sectorMatch && ratingMatch;
  }), [filterType, filterSector, ratingFilter]);

  const totalIssuance = useMemo(() => (BONDS.reduce((s,b)=>s+b.size,0)/1000).toFixed(1),[]);
  const greenPct = useMemo(() => Math.round(BONDS.filter(b=>b.certified!=='None').length/BONDS.length*100),[]);
  const avgSpread = useMemo(() => Math.round(BONDS.reduce((s,b)=>s+b.spread,0)/BONDS.length),[]);
  const avgDuration = useMemo(() => (BONDS.reduce((s,b)=>s+b.duration,0)/BONDS.length).toFixed(1),[]);

  const durationMatch = filtered.filter(b => Math.abs(b.duration - durationTarget) < 2.5);

  const tabs = ['Bond Universe', 'Credit Spread Curve', 'Spread History', 'Green / SLB Analytics', 'Covenant Analysis', 'Duration Matching', 'Infra Debt Radar'];

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.bg, minHeight: '100vh', padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📊</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Infrastructure Debt & Utility Bond Analytics</h1>
            <p style={{ margin: 0, fontSize: 13, color: T.sub }}>EP-EL6 · Green bonds / SLBs · Credit spread decomposition · Duration analytics · Covenant tracking · ICMA/CBI frameworks</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <KpiCard label="Total Issuance" value={`€$${totalIssuance}B`} sub="24 bonds in universe" color={T.accent} />
        <KpiCard label="Green/SLB/Trans %" value={`${greenPct}%`} sub="ESG-labelled bonds" color={T.green} />
        <KpiCard label="Avg OAS Spread" value={`${avgSpread}bps`} sub="Over duration-matched govt" color={T.amber} />
        <KpiCard label="Avg Duration" value={`${avgDuration}yr`} sub="Modified duration" color={T.teal} />
        <KpiCard label="Avg Greenium" value="~8bps" sub="Green vs vanilla spread saving" color={T.purple} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === i ? T.accent : T.card, color: tab === i ? '#fff' : T.sub,
            boxShadow: tab === i ? `0 2px 8px ${T.accent}40` : 'none',
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {bondTypes.map(t => (
              <button key={t} onClick={() => setFilterType(t)} style={{ padding:'5px 10px', borderRadius:20, border:`1px solid ${T.border}`, cursor:'pointer', fontSize:11, fontWeight:600, background: filterType===t ? T.accent : T.card, color: filterType===t ? '#fff' : T.sub }}>{t}</button>
            ))}
            <span style={{ fontSize:11, color:T.muted, alignSelf:'center' }}>|</span>
            {sectors.map(s => (
              <button key={s} onClick={() => setFilterSector(s)} style={{ padding:'5px 10px', borderRadius:20, border:`1px solid ${T.border}`, cursor:'pointer', fontSize:11, fontWeight:600, background: filterSector===s ? T.purple : T.card, color: filterSector===s ? '#fff' : T.sub }}>{s}</button>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  {['Issuer','Sector','Type','Size M','CCY','Coupon','Tenor','Rating','Spread bps','Duration','FFO/Debt','YTM','Certified'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => (
                  <tr key={b.id} onClick={() => setSelBond(BONDS.indexOf(b))} style={{ cursor: 'pointer', background: selBond === BONDS.indexOf(b) ? `${T.accent}10` : 'transparent', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.text, fontSize: 11 }}>{b.issuer}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11, color: T.sub }}>{b.sector}</td>
                    <td style={{ padding: '8px 10px' }}><Pill label={b.type} color={b.type.includes('Green') ? T.green : b.type.includes('SLB') ? T.teal : T.accent} /></td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.accent }}>{b.size.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', color: T.sub }}>{b.currency}</td>
                    <td style={{ padding: '8px 10px' }}>{b.coupon}%</td>
                    <td style={{ padding: '8px 10px' }}>{b.tenor}yr</td>
                    <td style={{ padding: '8px 10px' }}><Pill label={b.rating.split('/')[0]} color={b.rating.includes('Aa') ? T.green : b.rating.startsWith('A') ? T.teal : T.amber} /></td>
                    <td style={{ padding: '8px 10px', color: b.spread > 130 ? T.red : T.text }}>{b.spread}</td>
                    <td style={{ padding: '8px 10px' }}>{b.duration}</td>
                    <td style={{ padding: '8px 10px', color: b.ffo_debt >= 15 ? T.green : T.amber }}>{b.ffo_debt}%</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.accent }}>{b.ytm}%</td>
                    <td style={{ padding: '8px 10px', fontSize: 11, color: b.certified !== 'None' ? T.green : T.muted }}>{b.certified}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Utility Credit Spread Curve by Rating Category</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={CREDIT_CURVE} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tenor" tick={{ fontSize:11, fill:T.sub }} unit="yr" />
                <YAxis tick={{ fontSize:11, fill:T.sub }} unit="bps" />
                <Tooltip contentStyle={{ fontSize:12 }} formatter={v=>[`${v}bps`]} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Line type="monotone" dataKey="aa" name="AA-rated" stroke={T.green} strokeWidth={2.5} dot />
                <Line type="monotone" dataKey="a" name="A-rated" stroke={T.teal} strokeWidth={2.5} dot />
                <Line type="monotone" dataKey="bbb" name="BBB-rated" stroke={T.amber} strokeWidth={2.5} dot />
                <Line type="monotone" dataKey="bb" name="BB-rated (HY)" stroke={T.red} strokeWidth={2} dot strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Spread vs Duration — Current Universe</h3>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="duration" name="Duration" tick={{ fontSize:10, fill:T.sub }} unit="yr" />
                  <YAxis dataKey="spread" name="Spread bps" tick={{ fontSize:10, fill:T.sub }} unit="bps" />
                  <Tooltip cursor={{ strokeDasharray:'3 3' }} contentStyle={{ fontSize:11 }} />
                  <Scatter data={BONDS} fill={T.accent} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Selected Bond Detail — {bond.issuer}</h3>
              <div style={{ background: '#FFF1F2', borderRadius: 8, padding: '14px 16px' }}>
                {[['Type', bond.type],['Size', `${bond.currency}${bond.size}M`],['Coupon', `${bond.coupon}%`],['Maturity', bond.maturity],['Rating', bond.rating],['OAS Spread', `${bond.spread}bps`],['YTM', `${bond.ytm}%`],['Duration', `${bond.duration}yr`],['FFO/Debt', `${bond.ffo_debt}%`],['Gearing', `${bond.gearing}%`],['Use of Proceeds', bond.use],['Certified', bond.certified]].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid #FECDD3`, fontSize:12 }}>
                    <span style={{ color:T.sub }}>{l}</span><span style={{ fontWeight:600, color:T.text }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Utility Bond Credit Spread History — OAS bps (2021–2024)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={SPREAD_HISTORY} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="period" tick={{ fontSize:10, fill:T.sub }} interval={1} />
                <YAxis yAxisId="left" tick={{ fontSize:11, fill:T.sub }} unit="bps" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 25]} tick={{ fontSize:11, fill:T.sub }} unit="bps" />
                <Tooltip contentStyle={{ fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Line yAxisId="left" type="monotone" dataKey="bbb_utility" name="BBB Utility OAS" stroke={T.amber} strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="a_utility" name="A Utility OAS" stroke={T.teal} strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="greenium" name="Greenium (bps)" stroke={T.green} strokeWidth={2} dot={false} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[['Peak Widening (Oct 2022)','~195bps BBB','UK mini-budget + rate shock — worst widen since 2008',T.red],['Post-Hike Normalisation','~120bps BBB','ECB/Fed pause cycle — infrastructure inflows resume',T.amber],['Current Environment','~122bps BBB','Rate-cut expectations; strong bid for long-dated infra debt',T.green],['Greenium Persistence','8–12bps','Green label saves 8–12bps vs same-issuer vanilla bond',T.teal]].map(([s,v,d,c]) => (
              <div key={s} style={{ flex:1, background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 16px', minWidth:180 }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:4 }}>{s}</div>
                <div style={{ fontSize:18, fontWeight:700, color:c, marginBottom:4 }}>{v}</div>
                <div style={{ fontSize:11, color:T.sub }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Green / SLB / Transition Bond Issuance Trend (€$B)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={ISSUANCE_TREND} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11, fill:T.sub }} />
                <YAxis tick={{ fontSize:11, fill:T.sub }} unit="$B" />
                <Tooltip contentStyle={{ fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Area type="monotone" dataKey="conventional" name="Conventional" stackId="a" stroke={T.sub} fill={T.sub} fillOpacity={0.15} />
                <Area type="monotone" dataKey="green" name="Green Bond" stackId="a" stroke={T.green} fill={T.green} fillOpacity={0.35} />
                <Area type="monotone" dataKey="slb" name="SLB" stackId="a" stroke={T.teal} fill={T.teal} fillOpacity={0.35} />
                <Area type="monotone" dataKey="transition" name="Transition Bond" stackId="a" stroke={T.amber} fill={T.amber} fillOpacity={0.35} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Green vs Conventional — Spread Advantage</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={BONDS.filter(b=>b.certified!=='None').slice(0,10)} margin={{ top:0, right:8, left:0, bottom:60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="issuer" tick={{ fontSize:8, fill:T.sub }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize:10, fill:T.sub }} unit="bps" />
                  <Tooltip contentStyle={{ fontSize:12 }} />
                  <Bar dataKey="spread" name="Spread bps" fill={T.green} radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: T.text }}>ESG Label Framework Comparison</h3>
              {[['Green Bond (ICMA GBP)','Use-of-proceeds — eligible categories: RE, energy efficiency, clean transport, water, climate adaptation'],['SLB (ICMA SBP)','Issuer-level KPI — coupon step-up if missed; no restrictions on use of proceeds'],['Transition Bond','Carbon-intensive sector decarbonisation — gas to H2; coal to gas'],['Climate Bond (CBI)','Sector-specific criteria; independent verification; most stringent standard'],['Social Bond','SDG-linked social outcomes — rare in utility sector; workforce/access focus'],['SFDR Article 9','Dark green fund can hold utility bonds meeting EU Taxonomy Article 10.4+']].map(([t,d],i) => (
                <div key={i} style={{ marginBottom:8, fontSize:12 }}>
                  <span style={{ fontWeight:700, color:T.text }}>{t}: </span><span style={{ color:T.sub }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Infrastructure Debt Covenant Framework</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  {['Metric','Threshold','Category','Description','Status'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COVENANT_DATA.map((c, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.text }}>{c.name}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.green }}>{c.threshold}</td>
                    <td style={{ padding: '8px 10px' }}><Pill label={c.category} color={T.teal} /></td>
                    <td style={{ padding: '8px 10px', color: T.sub, fontSize: 11 }}>{c.description}</td>
                    <td style={{ padding: '8px 10px' }}><Pill label={i < 2 ? 'Monitoring' : 'Standard'} color={i < 2 ? T.amber : T.green} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>FFO/Debt vs Gearing — Peer Positioning</h3>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="gearing" name="Gearing %" tick={{ fontSize:10, fill:T.sub }} unit="%" />
                  <YAxis dataKey="ffo_debt" name="FFO/Debt %" tick={{ fontSize:10, fill:T.sub }} unit="%" />
                  <Tooltip cursor={{ strokeDasharray:'3 3' }} contentStyle={{ fontSize:11 }} />
                  <Scatter data={BONDS} fill={T.accent} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Covenant Breach Risk Indicators</h3>
              {BONDS.filter(b=>b.gearing>70||b.ffo_debt<12).map((b,i) => (
                <div key={i} style={{ background:'#FFF7ED', borderRadius:8, padding:'10px 12px', marginBottom:8, border:`1px solid #FED7AA` }}>
                  <div style={{ fontWeight:700, fontSize:12, color:T.text }}>{b.issuer}</div>
                  <div style={{ fontSize:11, color:T.sub, marginTop:2 }}>
                    {b.gearing>70 && <span style={{ color:T.red }}>⚠ Gearing {b.gearing}% {'>'} 70% threshold </span>}
                    {b.ffo_debt<12 && <span style={{ color:T.amber }}>⚠ FFO/Debt {b.ffo_debt}% near Baa2 floor </span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, minWidth: 320 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Duration Matching Tool</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: T.sub }}>Target Duration: <strong>{durationTarget} years</strong></label>
                <input type="range" min={2} max={20} step={0.5} value={durationTarget} onChange={e=>setDurationTarget(+e.target.value)} style={{ width:'100%', marginTop:6 }} />
              </div>
              <div style={{ marginBottom: 12, fontSize: 12, color: T.sub }}>Matching bonds within ±2.5yr of target:</div>
              {durationMatch.length > 0 ? durationMatch.map((b,i) => (
                <div key={i} style={{ background:'#F8FAFC', borderRadius:8, padding:'10px 12px', marginBottom:8, border:`1px solid ${T.border}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontWeight:700, fontSize:12, color:T.text }}>{b.issuer}</span>
                    <Pill label={b.type} color={b.type.includes('Green') ? T.green : T.teal} />
                  </div>
                  <div style={{ display:'flex', gap:12, marginTop:4, fontSize:11 }}>
                    <span><strong style={{ color:T.accent }}>{b.duration}yr</strong> duration</span>
                    <span style={{ color:T.sub }}>{b.spread}bps spread</span>
                    <span style={{ color:T.sub }}>{b.rating.split('/')[0]}</span>
                    <span style={{ color:T.green }}>{b.ytm}% YTM</span>
                  </div>
                </div>
              )) : (
                <div style={{ fontSize:12, color:T.muted, padding:'16px 0' }}>No bonds within ±2.5yr of {durationTarget}yr target</div>
              )}
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Duration Distribution — Universe</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[2,5,7,10,15,20,30].map(d=>({ tenor:`${d}yr`, count:BONDS.filter(b=>Math.abs(b.duration-d)<2).length }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="tenor" tick={{ fontSize:11, fill:T.sub }} />
                  <YAxis tick={{ fontSize:11, fill:T.sub }} />
                  <Tooltip contentStyle={{ fontSize:12 }} />
                  <Bar dataKey="count" name="Bond Count" fill={T.accent} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop:16 }}>
                <h4 style={{ margin:'0 0 10px', fontSize:13, fontWeight:700, color:T.text }}>Liability Matching Framework</h4>
                {[['Pension matching','30yr+ utility bonds ideal for DB pension duration — regulatory-backed cashflows'],['Insurance ALM','10–20yr secured bonds match long-tail liabilities — Solvency II RFR sensitivity'],['Infrastructure debt fund','Direct infra debt 5–25yr — illiquidity premium 60–120bps vs public bonds'],['Duration overlay','Interest rate swap overlay to fine-tune duration without changing credit exposure'],['Inflation linkage','Index-linked RAB bonds available — CPI/RPI pass-through to investor']].map(([t,d],i) => (
                  <div key={i} style={{ marginBottom:7, fontSize:11 }}>
                    <span style={{ fontWeight:700, color:T.text }}>{t}: </span><span style={{ color:T.sub }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 300 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Infrastructure Debt Asset Class Radar</h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={RADAR_INFRA_DEBT}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: T.sub }} />
                <Radar name="Score" dataKey="value" stroke={T.accent} fill={T.accent} fillOpacity={0.2} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Infra Debt vs Other Asset Classes</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { class: 'Infra Debt', yield: 5.8, vol: 4.2, sharpe: 0.88 },
                { class: 'IG Corp', yield: 5.2, vol: 6.8, sharpe: 0.62 },
                { class: 'Govt Bond', yield: 4.2, vol: 5.5, sharpe: 0.51 },
                { class: 'HY Corp', yield: 8.4, vol: 12.4, sharpe: 0.55 },
                { class: 'Equity', yield: 9.8, vol: 18.2, sharpe: 0.48 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="class" tick={{ fontSize:10, fill:T.sub }} />
                <YAxis tick={{ fontSize:10, fill:T.sub }} />
                <Tooltip contentStyle={{ fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Bar dataKey="yield" name="Yield %" fill={T.accent} radius={[2,2,0,0]} />
                <Bar dataKey="vol" name="Volatility %" fill={T.sub} fillOpacity={0.4} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop:16 }}>
              <h4 style={{ margin:'0 0 10px', fontSize:13, fontWeight:700, color:T.text }}>Investment Case Summary</h4>
              {[['Yield premium','50–120bps over public corp bonds of equivalent rating — illiquidity premium'],['Inflation hedge','RAB-linked cashflows + index-linked bonds = natural inflation protection'],['Diversification','Low correlation to equities (0.22) and HY (0.38) — resilience in risk-off'],['ESG credentials','Green/SLB label + regulated utility = strong Paris-alignment case'],['Call/prepay protection','Long-dated, no-call indentures — predictable duration for ALM purposes'],['Refinancing risk','Staggered maturity ladders across Baa issuers — manageable rollover']].map(([t,d],i) => (
                <div key={i} style={{ marginBottom:7, fontSize:11 }}>
                  <span style={{ fontWeight:700, color:T.text }}>{t}: </span><span style={{ color:T.sub }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
