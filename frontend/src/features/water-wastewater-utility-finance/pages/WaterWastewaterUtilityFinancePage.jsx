import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A',
  sub: '#64748B', accent: '#0EA5E9', blue: '#0284C7', indigo: '#4F46E5',
  green: '#059669', amber: '#D97706', red: '#DC2626', purple: '#7C3AED',
  teal: '#0D9488', sky: '#0369A1', muted: '#94A3B8',
};

const UTILITIES = [
  { id:1, name:'Thames Water',country:'UK',rab:17200,customers:15e6,leakage:287,leakage_target:231,opex:890,capex:1240,totex_eff:0.94,cmex:72,serviceability:'B',wacc_real:2.92,earn_wacc:2.71,dscr:1.38,gearing:82,moody:'Baa2',dividend:280,ph_compliance:99.91,pollution_incidents:156 },
  { id:2, name:'Severn Trent',country:'UK',rab:9800,customers:8.1e6,leakage:178,leakage_target:155,opex:520,capex:710,totex_eff:1.04,cmex:83,serviceability:'A',wacc_real:2.92,earn_wacc:3.01,dscr:1.61,gearing:68,moody:'Baa1',dividend:195,ph_compliance:99.95,pollution_incidents:62 },
  { id:3, name:'United Utilities',country:'UK',rab:10400,customers:7.4e6,leakage:195,leakage_target:170,opex:560,capex:780,totex_eff:1.01,cmex:79,serviceability:'A',wacc_real:2.92,earn_wacc:2.98,dscr:1.55,gearing:71,moody:'Baa1',dividend:210,ph_compliance:99.93,pollution_incidents:78 },
  { id:4, name:'Anglian Water',country:'UK',rab:8600,customers:6.3e6,leakage:168,leakage_target:142,opex:490,capex:680,totex_eff:1.06,cmex:85,serviceability:'A',wacc_real:2.92,earn_wacc:3.04,dscr:1.58,gearing:69,moody:'Baa2',dividend:180,ph_compliance:99.94,pollution_incidents:71 },
  { id:5, name:'Veolia Water UK',country:'UK',rab:3200,customers:3.2e6,leakage:94,leakage_target:78,opex:210,capex:280,totex_eff:0.98,cmex:76,serviceability:'B',wacc_real:2.92,earn_wacc:2.85,dscr:1.44,gearing:74,moody:'Baa2',dividend:65,ph_compliance:99.92,pollution_incidents:42 },
  { id:6, name:'Yorkshire Water',country:'UK',rab:5400,customers:5.2e6,leakage:140,leakage_target:120,opex:310,capex:440,totex_eff:0.99,cmex:77,serviceability:'B',wacc_real:2.92,earn_wacc:2.88,dscr:1.47,gearing:76,moody:'Baa2',dividend:105,ph_compliance:99.90,pollution_incidents:95 },
  { id:7, name:'Veolia France',country:'France',rab:12400,customers:28e6,leakage:122,leakage_target:100,opex:1840,capex:980,totex_eff:1.02,cmex:81,serviceability:'A',wacc_real:3.50,earn_wacc:3.61,dscr:1.65,gearing:62,moody:'Baa1',dividend:420,ph_compliance:99.96,pollution_incidents:34 },
  { id:8, name:'Suez Environment',country:'France',rab:9800,customers:22e6,leakage:138,leakage_target:115,opex:1560,capex:820,totex_eff:0.97,cmex:78,serviceability:'B',wacc_real:3.50,earn_wacc:3.42,dscr:1.52,gearing:66,moody:'Baa2',dividend:310,ph_compliance:99.94,pollution_incidents:48 },
  { id:9, name:'Acciona Agua',country:'Spain',rab:5800,customers:9.4e6,leakage:98,leakage_target:82,opex:580,capex:410,totex_eff:1.03,cmex:80,serviceability:'A',wacc_real:4.10,earn_wacc:4.18,dscr:1.62,gearing:60,moody:'Baa1',dividend:115,ph_compliance:99.93,pollution_incidents:29 },
  { id:10, name:'FCC Aqualia',country:'Spain',rab:4200,customers:6.8e6,leakage:112,leakage_target:94,opex:420,capex:290,totex_eff:0.96,cmex:74,serviceability:'B',wacc_real:4.10,earn_wacc:3.96,dscr:1.48,gearing:72,moody:'Baa2',dividend:82,ph_compliance:99.91,pollution_incidents:41 },
  { id:11, name:'Aguas Andinas',country:'Chile',rab:3100,customers:6.2e6,leakage:78,leakage_target:65,opex:290,capex:220,totex_eff:1.07,cmex:86,serviceability:'A',wacc_real:5.20,earn_wacc:5.31,dscr:1.74,gearing:55,moody:'A3',dividend:70,ph_compliance:99.97,pollution_incidents:12 },
  { id:12, name:'Manila Water',country:'Philippines',rab:2400,customers:7.1e6,leakage:145,leakage_target:120,opex:215,capex:180,totex_eff:0.95,cmex:70,serviceability:'B',wacc_real:6.80,earn_wacc:6.65,dscr:1.55,gearing:64,moody:'Baa3',dividend:45,ph_compliance:99.88,pollution_incidents:58 },
];

const OUTCOMES = [
  { category: 'Leakage Reduction', weight: 18, pa_rate: 280, incentive_cap: 120, performance: 'Outperforming', pct: 82 },
  { category: 'Per Capita Consumption', weight: 12, pa_rate: 180, incentive_cap: 80, performance: 'On Track', pct: 68 },
  { category: 'Pollution Incidents', weight: 20, pa_rate: -320, incentive_cap: 180, performance: 'Underperforming', pct: 42 },
  { category: 'Drinking Water Quality', weight: 16, pa_rate: 220, incentive_cap: 95, performance: 'Outperforming', pct: 88 },
  { category: 'Flooding Internal', weight: 14, pa_rate: 160, incentive_cap: 70, performance: 'On Track', pct: 71 },
  { category: 'River Water Quality', weight: 12, pa_rate: -240, incentive_cap: 110, performance: 'Underperforming', pct: 38 },
  { category: 'C-MeX Customer Score', weight: 8, pa_rate: 95, incentive_cap: 45, performance: 'On Track', pct: 73 },
];

const TOTEX_TREND = Array.from({ length: 8 }, (_, i) => ({
  year: 2017 + i,
  capex: Math.round(580 + sr(i*7)*280 + i*35),
  opex: Math.round(420 + sr(i*11)*95 + i*12),
  totex_allowed: Math.round(1080 + i*58),
  totex_actual: Math.round(1040 + sr(i*13)*120 + i*52),
}));

const ASSET_HEALTH = [
  { asset: 'Water Mains', total_km: 31200, grade_a: 42, grade_b: 28, grade_c: 18, grade_d: 9, grade_e: 3, replacement_rate: 0.8, backlog_km: 420 },
  { asset: 'Sewer Network', total_km: 47800, grade_a: 38, grade_b: 30, grade_c: 19, grade_d: 10, grade_e: 3, replacement_rate: 0.5, backlog_km: 680 },
  { asset: 'Treatment Works', total_sites: 320, grade_a: 35, grade_b: 32, grade_c: 21, grade_d: 10, grade_e: 2, replacement_rate: 1.2, backlog_km: 0 },
  { asset: 'Pumping Stations', total_sites: 890, grade_a: 40, grade_b: 29, grade_c: 20, grade_d: 9, grade_e: 2, replacement_rate: 2.1, backlog_km: 0 },
  { asset: 'Service Reservoirs', total_sites: 145, grade_a: 48, grade_b: 27, grade_c: 15, grade_d: 8, grade_e: 2, replacement_rate: 1.8, backlog_km: 0 },
];

const RAB_TREND = Array.from({ length: 6 }, (_, i) => ({
  period: `AMP${i+3}`,
  rab: Math.round(8200 * (1 + i * 0.12) + sr(i*17)*400),
  wacc: parseFloat((4.2 - i * 0.2 + sr(i*9)*0.3).toFixed(2)),
  allowed_return: 0,
})).map(r => ({ ...r, allowed_return: Math.round(r.rab * r.wacc / 100) }));

const WATER_QUALITY_TREND = Array.from({ length: 20 }, (_, i) => ({
  year: 2005 + i,
  compliance: parseFloat((99.70 + i*0.012 + sr(i*7)*0.08).toFixed(3)),
  incidents: Math.round(180 - i*5 + sr(i*11)*40),
  leakage_index: parseFloat((1.0 - i*0.018 + sr(i*9)*0.04).toFixed(3)),
}));

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

const GradeBar = ({ a, b, c, d, e }) => {
  const colors = [T.green, '#86EFAC', T.amber, '#F97316', T.red];
  return (
    <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', width: '100%' }}>
      {[a, b, c, d, e].map((v, i) => (
        <div key={i} style={{ width: `${v}%`, background: colors[i] }} title={`Grade ${['A','B','C','D','E'][i]}: ${v}%`} />
      ))}
    </div>
  );
};

export default function WaterWastewaterUtilityFinancePage() {
  const [tab, setTab] = useState(0);
  const [selUtil, setSelUtil] = useState(0);
  const [filterCountry, setFilterCountry] = useState('All');
  const [waccAdj, setWaccAdj] = useState(0);
  const [leakageTarget, setLeakageTarget] = useState(25);

  const util = UTILITIES[selUtil];
  const countries = ['All', ...new Set(UTILITIES.map(u => u.country))];
  const filteredUtils = useMemo(() => filterCountry === 'All' ? UTILITIES : UTILITIES.filter(u => u.country === filterCountry), [filterCountry]);

  const totalRAB = useMemo(() => UTILITIES.reduce((s,u) => s+u.rab, 0), []);
  const avgDSCR = useMemo(() => (UTILITIES.reduce((s,u) => s+u.dscr, 0)/UTILITIES.length).toFixed(2), []);
  const avgLeakage = useMemo(() => Math.round(UTILITIES.reduce((s,u) => s+u.leakage, 0)/UTILITIES.length), []);
  const avgCmex = useMemo(() => Math.round(UTILITIES.reduce((s,u) => s+u.cmex, 0)/UTILITIES.length), []);

  const adjWACC = (util.wacc_real + waccAdj / 100).toFixed(2);
  const allowedReturn = (util.rab * +adjWACC / 100 / 1000).toFixed(2);
  const leakageSaving = Math.round(util.leakage * leakageTarget / 100 * 0.42);

  const tabs = ['Utility Universe', 'Totex & Efficiency', 'Asset Serviceability', 'Outcome Delivery', 'RAB & WACC', 'Water Quality', 'Valuation'];

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.bg, minHeight: '100vh', padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💧</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Water & Wastewater Utility Finance</h1>
            <p style={{ margin: 0, fontSize: 13, color: T.sub }}>EP-EL2 · Ofwat PR24/AMP8 · RAB/WACC model · Totex efficiency · ODIs · Asset serviceability</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <KpiCard label="Aggregate RAB" value={`£${(totalRAB/1000).toFixed(0)}B`} sub="12 utilities surveyed" color={T.accent} />
        <KpiCard label="Avg DSCR" value={avgDSCR} sub="Debt service coverage" color={T.green} />
        <KpiCard label="Avg Daily Leakage" value={`${avgLeakage}Ml/d`} sub="Per utility average" color={T.amber} />
        <KpiCard label="Avg C-MeX Score" value={avgCmex} sub="Customer experience (max 100)" color={T.teal} />
        <KpiCard label="PR24 Review" value="2025–2030" sub="AMP8 period" color={T.purple} />
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
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {countries.map(c => (
              <button key={c} onClick={() => setFilterCountry(c)} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${T.border}`, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: filterCountry === c ? T.accent : T.card, color: filterCountry === c ? '#fff' : T.sub }}>{c}</button>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  {['Utility','Country','RAB £M','Customers M','Leakage Ml/d','Target Ml/d','DSCR','Gearing','C-MeX','Serviceability','Rating'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUtils.map((u, i) => (
                  <tr key={u.id} onClick={() => setSelUtil(UTILITIES.indexOf(u))} style={{ cursor: 'pointer', background: selUtil === UTILITIES.indexOf(u) ? `${T.accent}10` : 'transparent', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.text }}>{u.name}</td>
                    <td style={{ padding: '8px 10px', color: T.sub }}>{u.country}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.accent }}>{u.rab.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px' }}>{(u.customers/1e6).toFixed(1)}</td>
                    <td style={{ padding: '8px 10px', color: u.leakage > u.leakage_target ? T.red : T.green }}>{u.leakage}</td>
                    <td style={{ padding: '8px 10px', color: T.sub }}>{u.leakage_target}</td>
                    <td style={{ padding: '8px 10px', color: u.dscr >= 1.5 ? T.green : T.amber }}>{u.dscr}</td>
                    <td style={{ padding: '8px 10px', color: u.gearing > 75 ? T.red : T.amber }}>{u.gearing}%</td>
                    <td style={{ padding: '8px 10px', color: u.cmex >= 80 ? T.green : T.amber }}>{u.cmex}</td>
                    <td style={{ padding: '8px 10px' }}><Pill label={u.serviceability} color={u.serviceability === 'A' ? T.green : T.amber} /></td>
                    <td style={{ padding: '8px 10px' }}><Pill label={u.moody} color={u.moody.startsWith('Baa1') ? T.green : T.amber} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>RAB Ranking</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[...UTILITIES].sort((a,b) => b.rab-a.rab)} layout="vertical" margin={{ top:0, right:16, left:110, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize:10, fill:T.sub }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize:9, fill:T.sub }} width={110} />
                  <Tooltip contentStyle={{ fontSize:12 }} />
                  <Bar dataKey="rab" name="RAB £M" fill={T.accent} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Gearing vs DSCR — Peer Map</h3>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="gearing" name="Gearing %" tick={{ fontSize:10, fill:T.sub }} label={{ value:'Gearing %', position:'insideBottom', offset:-4, style:{fontSize:10} }} />
                  <YAxis dataKey="dscr" name="DSCR" tick={{ fontSize:10, fill:T.sub }} />
                  <Tooltip cursor={{ strokeDasharray:'3 3' }} contentStyle={{ fontSize:11 }} />
                  <Scatter data={UTILITIES} fill={T.teal} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Totex Trend — Allowed vs Actual (8-Year History)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={TOTEX_TREND} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11, fill:T.sub }} />
                <YAxis tick={{ fontSize:11, fill:T.sub }} />
                <Tooltip contentStyle={{ fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Area type="monotone" dataKey="totex_allowed" name="Allowed Totex £M" stroke={T.sub} fill={`${T.sub}15`} strokeDasharray="6 3" />
                <Area type="monotone" dataKey="totex_actual" name="Actual Totex £M" stroke={T.accent} fill={`${T.accent}20`} />
                <Bar dataKey="capex" name="Capex £M" fill={T.blue} radius={[2,2,0,0]} />
                <Bar dataKey="opex" name="Opex £M" fill={T.teal} radius={[2,2,0,0]} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Totex Efficiency Score — Peer Comparison</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[...UTILITIES].sort((a,b)=>b.totex_eff-a.totex_eff)} layout="vertical" margin={{ top:0, right:16, left:110, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0.88, 1.10]} tick={{ fontSize:10, fill:T.sub }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize:9, fill:T.sub }} width={110} />
                  <Tooltip contentStyle={{ fontSize:12 }} formatter={v => [`${(v*100).toFixed(0)}%`]} />
                  <Bar dataKey="totex_eff" name="Totex Efficiency" radius={[0,3,3,0]} fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop:10, fontSize:11, color:T.sub }}>Above 1.0 = outperforming allowed totex → incentive income earned</div>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Capex / Opex Split Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={UTILITIES} stackOffset="expand">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize:9, fill:T.sub }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tickFormatter={v => `${(v*100).toFixed(0)}%`} tick={{ fontSize:10, fill:T.sub }} />
                  <Tooltip contentStyle={{ fontSize:12 }} formatter={v => `${(v*100).toFixed(0)}%`} />
                  <Legend wrapperStyle={{ fontSize:12 }} />
                  <Bar dataKey="capex" name="Capex" stackId="a" fill={T.accent} />
                  <Bar dataKey="opex" name="Opex" stackId="a" fill={T.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: T.text }}>Asset Serviceability Grade Distribution</h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: T.sub }}>Grade A = Excellent · B = Good · C = Stable · D = Deteriorating · E = At Risk</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  {['Asset Class','Total Units','Grade A%','Grade B%','Grade C%','Grade D%','Grade E%','Replacement Rate','Backlog'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ASSET_HEALTH.map((a, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.text }}>{a.asset}</td>
                    <td style={{ padding: '8px 10px', color: T.sub }}>{a.total_km ? `${a.total_km.toLocaleString()} km` : `${a.total_sites} sites`}</td>
                    <td style={{ padding: '8px 10px', color: T.green }}>{a.grade_a}%</td>
                    <td style={{ padding: '8px 10px', color: '#86EFAC' }}>{a.grade_b}%</td>
                    <td style={{ padding: '8px 10px', color: T.amber }}>{a.grade_c}%</td>
                    <td style={{ padding: '8px 10px', color: '#F97316' }}>{a.grade_d}%</td>
                    <td style={{ padding: '8px 10px', color: T.red }}>{a.grade_e}%</td>
                    <td style={{ padding: '8px 10px' }}>{a.replacement_rate}%/yr</td>
                    <td style={{ padding: '8px 10px', color: T.amber }}>{a.backlog_km > 0 ? `${a.backlog_km} km` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {ASSET_HEALTH.map((a, i) => (
              <div key={i} style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px', minWidth: 180 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>{a.asset}</div>
                <GradeBar a={a.grade_a} b={a.grade_b} c={a.grade_c} d={a.grade_d} e={a.grade_e} />
                <div style={{ fontSize: 11, color: T.sub, marginTop: 6 }}>{a.grade_a + a.grade_b}% Grade A/B · {a.grade_d + a.grade_e}% Grade D/E</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Outcome Delivery Incentives (ODIs) — Performance vs Target</h3>
            {OUTCOMES.map((o, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{o.category} <span style={{ fontSize: 11, color: T.sub }}>({o.weight}% weight)</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Pill label={o.performance} color={o.performance === 'Outperforming' ? T.green : o.performance === 'On Track' ? T.accent : T.red} />
                    <span style={{ fontSize: 12, color: T.sub }}>P/A rate: <strong style={{ color: o.pa_rate > 0 ? T.green : T.red }}>£{o.pa_rate}M</strong></span>
                  </div>
                </div>
                <div style={{ background: '#E2E8F0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${o.pct}%`, height: '100%', background: o.performance === 'Outperforming' ? T.green : o.performance === 'On Track' ? T.accent : T.red, borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{o.pct}% of target achieved · Max incentive: £{o.incentive_cap}M</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>ODI Incentive Value at Risk / Reward</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={OUTCOMES}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: T.sub }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: T.sub }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="pa_rate" name="P/A Rate £M" fill={T.accent} radius={[3,3,0,0]} />
                <Bar dataKey="incentive_cap" name="Cap £M" fill={T.teal} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>RAB Evolution by AMP Period</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={RAB_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="period" tick={{ fontSize:11, fill:T.sub }} />
                  <YAxis tick={{ fontSize:11, fill:T.sub }} />
                  <Tooltip contentStyle={{ fontSize:12 }} />
                  <Legend wrapperStyle={{ fontSize:12 }} />
                  <Area type="monotone" dataKey="rab" name="RAB £M" stroke={T.accent} fill={`${T.accent}20`} />
                  <Area type="monotone" dataKey="allowed_return" name="Allowed Return £M" stroke={T.green} fill={`${T.green}15`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>WACC Trend — Real Pre-Tax</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={RAB_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="period" tick={{ fontSize:11, fill:T.sub }} />
                  <YAxis tick={{ fontSize:11, fill:T.sub }} domain={[2, 5]} tickFormatter={v=>`${v}%`} />
                  <Tooltip contentStyle={{ fontSize:12 }} formatter={v => [`${v}%`]} />
                  <Line type="monotone" dataKey="wacc" name="WACC Real Pre-Tax" stroke={T.purple} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>WACC Sensitivity — {util.name}</h3>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: T.sub }}>WACC Adjustment: <strong>{waccAdj > 0 ? '+' : ''}{waccAdj} bps</strong></label>
                <input type="range" min={-100} max={150} step={5} value={waccAdj} onChange={e => setWaccAdj(+e.target.value)} style={{ width: '100%', marginTop: 6 }} />
              </div>
              <div style={{ background: '#F0F9FF', borderRadius: 8, padding: '14px 16px' }}>
                {[['Allowed WACC (Real)', `${util.wacc_real}%`],['Adjusted WACC', `${adjWACC}%`],['Earned WACC', `${util.earn_wacc}%`],['RAB', `£${util.rab.toLocaleString()}M`],['Allowed Return', `£${allowedReturn}B`],['Outperformance', `${((util.earn_wacc - util.wacc_real)*100).toFixed(0)} bps`]].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid #BFDBFE`, fontSize:12 }}>
                    <span style={{ color:T.sub }}>{l}</span><span style={{ fontWeight:700, color:T.text }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Allowed vs Earned WACC — Peer</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={UTILITIES} margin={{ top:0, right:8, left:0, bottom:60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize:9, fill:T.sub }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize:10, fill:T.sub }} tickFormatter={v=>`${v}%`} />
                  <Tooltip contentStyle={{ fontSize:12 }} />
                  <Legend wrapperStyle={{ fontSize:12 }} />
                  <Bar dataKey="wacc_real" name="Allowed WACC%" fill={T.sub} radius={[2,2,0,0]} />
                  <Bar dataKey="earn_wacc" name="Earned WACC%" fill={T.accent} radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Drinking Water Quality & Leakage Index — 20-Year Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={WATER_QUALITY_TREND} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11, fill:T.sub }} />
                <YAxis yAxisId="left" domain={[99.6, 100]} tick={{ fontSize:11, fill:T.sub }} tickFormatter={v=>`${v}%`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fill:T.sub }} />
                <Tooltip contentStyle={{ fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Line yAxisId="left" type="monotone" dataKey="compliance" name="DWI Compliance %" stroke={T.green} strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="incidents" name="Pollution Incidents" stroke={T.red} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Leakage Reduction Simulator</h3>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: T.sub }}>Reduction Target vs Current: <strong>{leakageTarget}%</strong></label>
                <input type="range" min={5} max={50} step={5} value={leakageTarget} onChange={e => setLeakageTarget(+e.target.value)} style={{ width: '100%', marginTop: 6 }} />
              </div>
              <div style={{ background: '#F0FDF4', borderRadius: 8, padding: '14px 16px' }}>
                {[['Current Leakage', `${util.leakage} Ml/d`],['Target Leakage', `${util.leakage_target} Ml/d`],['Reduction Target', `${Math.round(util.leakage*leakageTarget/100)} Ml/d`],['Estimated Saving', `£${leakageSaving}M NPV`],['Delivery Period', '5 years (AMP8)'],['ODI Outcome', leakageSaving > 50 ? 'Incentive Income Likely' : 'On Track']].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid #BBF7D0`, fontSize:12 }}>
                    <span style={{ color:T.sub }}>{l}</span><span style={{ fontWeight:700, color:T.text }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>pH Compliance vs Pollution Incidents</h3>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="pollution_incidents" name="Incidents" tick={{ fontSize:10, fill:T.sub }} label={{ value:'Pollution Incidents', position:'insideBottom', offset:-4, style:{fontSize:10} }} />
                  <YAxis dataKey="ph_compliance" name="Compliance %" tick={{ fontSize:10, fill:T.sub }} domain={[99.8, 100]} />
                  <Tooltip cursor={{ strokeDasharray:'3 3' }} contentStyle={{ fontSize:11 }} />
                  <Scatter data={UTILITIES} fill={T.accent} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 300 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Regulatory Valuation Summary</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  {['Utility','RAB £M','Premium','EV £M','EV/RAB','Yield'].map(h => (
                    <th key={h} style={{ padding: '7px 8px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {UTILITIES.map((u,i) => {
                  const premium = u.totex_eff > 1 ? 1.08 : 0.98;
                  const ev = Math.round(u.rab * premium);
                  return (
                    <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'7px 8px', fontWeight:600, color:T.text, fontSize:11 }}>{u.name}</td>
                      <td style={{ padding:'7px 8px', color:T.accent }}>{u.rab.toLocaleString()}</td>
                      <td style={{ padding:'7px 8px', color: premium>1 ? T.green : T.amber }}>{(premium*100-100).toFixed(0)}%</td>
                      <td style={{ padding:'7px 8px', fontWeight:700 }}>{ev.toLocaleString()}</td>
                      <td style={{ padding:'7px 8px' }}>{premium.toFixed(2)}×</td>
                      <td style={{ padding:'7px 8px', color:T.green }}>{(u.dividend/ev*100).toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Key Investment Risks — Water Sector</h3>
            {[['Regulatory Reset Risk','Ofwat PR29 WACC may compress further — monitor UK CMA appeals precedent'],['Political Risk','Renationalisation debate persists — Thames Water restructuring sets precedent'],['Climate Physical Risk','Drought events, flooding of assets — adaptation capex not fully in RAB'],['Gearing Covenant Breach','Thames at 82% gearing vs Ofwat guidance of 60-65% — refinancing overhang'],['Pollution Fines','EA fines material — Southern Water £90M 2021, Thames £104M 2022'],['Dividend Restriction','Ofwat can link dividend to performance — high ESG scrutiny'],['Inflation Sensitivity','CPI-linked RAB beneficial in high-inflation environment'],['Interest Rate Risk','High gearing amplifies rate sensitivity — floating rate exposure']].map(([t,d],i) => (
              <div key={i} style={{ marginBottom: 10, fontSize:12 }}>
                <span style={{ fontWeight:700, color:T.text }}>{t}: </span>
                <span style={{ color:T.sub }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
