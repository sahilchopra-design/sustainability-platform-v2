import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ZAxis, Legend, ReferenceLine, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── Scenarios (subset for credit integration) ─────────────────────────────────
const SCENARIOS_CC = [
  { code: 'NGFS_NZ2050', name: 'Net Zero 2050',      temp: 1.5, pdMultiplier: 1.08, lgdMultiplier: 1.05, color: T.green  },
  { code: 'NGFS_B2DS',   name: 'Below 2°C',          temp: 1.8, pdMultiplier: 1.12, lgdMultiplier: 1.07, color: T.teal   },
  { code: 'NGFS_DT',     name: 'Delayed Transition',  temp: 1.8, pdMultiplier: 1.22, lgdMultiplier: 1.12, color: T.amber  },
  { code: 'NGFS_NDC',    name: 'NDC Policies',        temp: 2.5, pdMultiplier: 1.35, lgdMultiplier: 1.18, color: T.purple },
  { code: 'NGFS_CP',     name: 'Current Policies',    temp: 2.7, pdMultiplier: 1.58, lgdMultiplier: 1.28, color: T.red    },
];

// ── 40 obligors with climate-adjusted credit metrics ─────────────────────────
const SECTORS_CC = ['Power','Steel','Cement','Oil & Gas','Transport','Buildings','Agri-Food','Financial','Real Estate','Retail'];
const OBLIGORS_CC = Array.from({ length: 40 }, (_, i) => {
  const sector = SECTORS_CC[i % 10];
  const pd_base = 0.005 + sr(i * 3) * 0.04;
  const lgd_base = 0.25 + sr(i * 3 + 1) * 0.45;
  const ead = 50 + sr(i * 3 + 2) * 950;
  const carbonInt = 80 + sr(i * 5) * 1200;         // tCO₂/$M revenue
  const physScore = 10 + sr(i * 5 + 1) * 80;
  const transScore = 10 + sr(i * 5 + 2) * 80;
  const stage_base = pd_base > 0.03 ? 3 : pd_base > 0.01 ? 2 : 1;
  // Climate adjustments per scenario
  const scenarios_adj = SCENARIOS_CC.map(sc => {
    // Carbon intensity amplifies transition risk; physScore amplifies physical risk
    // carbonInt normalised to 800 tCO₂e/GWh — coal power carbon intensity ceiling (IEA Electricity 2023,
    // Table 3.1: supercritical coal ≈ 820 gCO₂/kWh). At carbonInt = 800, full pdMultiplier applies.
    // Analogously physScore normalised to 80 (platform max physical risk score, ×0.3 weight).
    const carbonFactor = 1 + (sc.pdMultiplier - 1) * (carbonInt / 800);
    const physFactor   = 1 + (sc.pdMultiplier - 1) * (physScore / 80) * 0.3;
    const pd_adj = Math.min(1, pd_base * carbonFactor * physFactor);
    const lgd_adj = lgd_base * sc.lgdMultiplier;
    const ecl_base = pd_base * lgd_base * ead;
    const ecl_adj  = pd_adj  * lgd_adj  * ead;
    const uplift_pct = ((ecl_adj - ecl_base) / ecl_base * 100);
    const sicr_z_adj = (pd_adj - pd_base) / (pd_base * 0.3 + 0.001);
    const stage_adj = pd_adj > 0.03 ? 3 : pd_adj > 0.01 ? 2 : 1;
    return {
      sc_code: sc.code, sc_name: sc.name,
      pd_adj: +pd_adj.toFixed(5), lgd_adj: +lgd_adj.toFixed(3),
      ecl_base: +ecl_base.toFixed(2), ecl_adj: +ecl_adj.toFixed(2),
      uplift_usd: +(ecl_adj - ecl_base).toFixed(2),
      uplift_pct: +uplift_pct.toFixed(1),
      stage_adj, stage_migration: stage_adj > stage_base, sicr_z_adj: +sicr_z_adj.toFixed(2),
    };
  });
  return {
    id: `OBL-${String(i + 1).padStart(3,'0')}`,
    name: `Obligor ${String.fromCharCode(65 + i%26)}${Math.floor(i/26)+1}`,
    sector, pd_base: +pd_base.toFixed(5), lgd_base: +lgd_base.toFixed(3),
    ead: +ead.toFixed(1), carbonInt: +carbonInt.toFixed(0),
    physScore: +physScore.toFixed(1), transScore: +transScore.toFixed(1),
    stage_base, scenarios_adj,
  };
});

// ── Hazard × sector matrix ────────────────────────────────────────────────────
const HAZARDS = ['Flood','Wildfire','Heat Stress','Drought','Carbon Price','Policy Shock','Stranded Asset'];
const HAZARD_MATRIX = SECTORS_CC.map((sector, si) => {
  const row = { sector };
  HAZARDS.forEach((h, hi) => {
    row[h] = +(10 + sr(si * 20 + hi * 7) * 85).toFixed(0);
  });
  return row;
});

// ── Intermodular mapping ──────────────────────────────────────────────────────
const MODULE_LINKS = [
  { module: 'Portfolio Manager',       code: 'EP-F1',  linkType: 'Scenario Feed',        vars: ['carbon_price','temp_alignment','waci'],               direction: 'output', status: 'active' },
  { module: 'Scenario Stress Tester',  code: 'EP-G2',  linkType: 'Scenario Parameters',  vars: ['ngfs_nz2050','ngfs_cp','ips_b2ds','temp_pathway'],     direction: 'output', status: 'active' },
  { module: 'Carbon Budget Tracker',   code: 'EP-G3',  linkType: 'Pathway Reference',    vars: ['co2_gt_nz2050','co2_gt_cp','carbon_price_2050'],       direction: 'output', status: 'active' },
  { module: 'PCAF Financed Emissions', code: 'EP-AJ1', linkType: 'Scenario-Adj WACI',    vars: ['evic','financed_emissions','scenario_temp'],            direction: 'bidirectional', status: 'active' },
  { module: 'DME Financial Risk',      code: 'EP-BE1', linkType: 'ECL Uplift Input',      vars: ['pd_climate_adj','lgd_climate_adj','ecl_uplift_pct'],   direction: 'output', status: 'active' },
  { module: 'Credit Risk Analytics',   code: 'EP-BI1', linkType: 'PD Adjustment',         vars: ['pd_multiplier','lgd_multiplier','stage_migration'],    direction: 'output', status: 'active' },
  { module: 'SBTi Registry',           code: 'EP-BG1', linkType: 'Target vs Pathway',    vars: ['sbti_target_yr','scenario_pathway','temp_gap'],        direction: 'bidirectional', status: 'active' },
  { module: 'Transition Plan Builder', code: 'EP-AL1', linkType: 'Scenario Baseline',    vars: ['ngfs_sector_pathway','carbon_price','renewable_gw'],   direction: 'output', status: 'active' },
  { module: 'Climate Stress Test',     code: 'EP-AJ2', linkType: 'Stress Parameters',    vars: ['pd_uplift_cp','ecl_ngfs_dt','portfolio_var_uplift'],   direction: 'output', status: 'active' },
  { module: 'DB Migration Console',    code: 'EP-BH1', linkType: 'Schema: 088',          vars: ['climate_scenarios','climate_scenario_variables','asset_climate_risk'], direction: 'metadata', status: 'active' },
  { module: 'Portfolio Temperature Score', code: 'EP-AJ4', linkType: 'Temp Alignment',  vars: ['implied_temp','waci','portfolio_temp_score'],          direction: 'output', status: 'active' },
  { module: 'Physical Risk Engine',    code: 'EP-H7',  linkType: 'Hazard Scores',        vars: ['flood_risk','wildfire_risk','heat_stress','drought'],  direction: 'output', status: 'active' },
];

const LINK_COLOR = { output: T.teal, bidirectional: T.purple, metadata: T.slate };

// ── Sector transition risk 2030/2050 ─────────────────────────────────────────
const SECTOR_TRANSITION = SECTORS_CC.map((s, i) => ({
  sector: s,
  carbon_cost_2030_nz: Math.round(50 + sr(i * 11) * 950),
  carbon_cost_2050_nz: Math.round(200 + sr(i * 11 + 1) * 3800),
  carbon_cost_2030_cp: Math.round(5  + sr(i * 11 + 2) * 80),
  carbon_cost_2050_cp: Math.round(10 + sr(i * 11 + 3) * 120),
  stranded_pct_nz: +(5  + sr(i * 13) * 60).toFixed(1),
  stranded_pct_cp: +(0.5 + sr(i * 13 + 1) * 8).toFixed(1),
}));

const pill = (label, color) => (
  <span style={{ background: color + '22', color, border: `1px solid ${color}44`,
    borderRadius: 4, padding: '1px 7px', fontSize: 10, fontFamily: T.mono, fontWeight: 700 }}>
    {label}
  </span>
);

const card = (label, value, sub, color = T.navy) => (
  <div style={{ background: '#fff', border: `1px solid ${T.navy}22`, borderRadius: 8,
    padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.slate, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>{sub}</div>}
  </div>
);

const STAGE_COLOR = { 1: T.green, 2: T.amber, 3: T.red };

export default function ClimateCreditIntegrationPage() {
  const [tab, setTab] = useState(0);
  const [activeScenario, setActiveScenario] = useState('NGFS_CP');
  const [sectorFilter, setSectorFilter] = useState('ALL');

  const tabs = ['ECL Uplift Dashboard', 'Hazard × Sector Matrix', 'Sector Transition Risk', 'Intermodular Map'];

  const selectedSc = SCENARIOS_CC.find(s => s.code === activeScenario);
  const scIdx = SCENARIOS_CC.findIndex(s => s.code === activeScenario);
  const safeScIdx = scIdx >= 0 ? scIdx : 0; // guard: invalid activeScenario → fall back to first scenario

  const filteredObligors = useMemo(() => {
    let obs = OBLIGORS_CC;
    if (sectorFilter !== 'ALL') obs = obs.filter(o => o.sector === sectorFilter);
    return obs.map(o => ({
      ...o,
      adj: o.scenarios_adj[safeScIdx],
    })).sort((a, b) => b.adj.uplift_pct - a.adj.uplift_pct);
  }, [sectorFilter, scIdx]);

  const portfolioStats = useMemo(() => {
    const obs = OBLIGORS_CC;
    return SCENARIOS_CC.map((sc, si) => {
      const eclBase = obs.reduce((s, o) => s + o.scenarios_adj[0].ecl_base, 0);
      const eclAdj  = obs.reduce((s, o) => s + o.scenarios_adj[si].ecl_adj, 0);
      const migrations = obs.filter(o => o.scenarios_adj[si].stage_migration).length;
      return {
        sc_name: sc.name.length > 14 ? sc.name.slice(0,13)+'…' : sc.name,
        ecl_base: +eclBase.toFixed(0), ecl_adj: +eclAdj.toFixed(0),
        uplift_pct: +((eclAdj - eclBase) / eclBase * 100).toFixed(1),
        migrations, color: sc.color,
      };
    });
  }, []);

  const hazardScoreData = useMemo(() => {
    const sector = sectorFilter !== 'ALL' ? HAZARD_MATRIX.find(r => r.sector === sectorFilter) : null;
    if (sector) return HAZARDS.map(h => ({ subject: h, score: sector[h], fullMark: 100 }));
    return HAZARDS.map(h => ({
      subject: h,
      score: Math.round(HAZARD_MATRIX.reduce((s, r) => s + r[h], 0) / HAZARD_MATRIX.length),
      fullMark: 100,
    }));
  }, [sectorFilter]);

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ background: T.red, color: '#fff', borderRadius: 8, padding: '6px 14px',
          fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>EP-BJ2</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.navy }}>
          Climate-Credit Risk Integration
        </h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pill('NGFS 5 Scenarios', T.navy)}
          {pill('40 Obligors', T.teal)}
          {pill('IFRS 9 ECL Uplift', T.amber)}
          {pill('Basel IV RWA Adj', T.purple)}
          {pill('12 Module Links', T.green)}
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.slate, marginBottom: 18 }}>
        ECL uplift = (PD_climate × LGD_climate × EAD) − (PD_base × LGD_base × EAD) &nbsp;·&nbsp;
        PD_climate = PD_base × f(carbon_intensity, physical_score, scenario_temp) &nbsp;·&nbsp;
        Stage migration triggered when climate-adjusted SICR z-score crosses threshold
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.navy}22` }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            background: tab === i ? T.red : 'transparent',
            color: tab === i ? '#fff' : T.slate,
            border: 'none', borderRadius: '6px 6px 0 0', padding: '8px 16px',
            fontFamily: T.font, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      {/* ── Tab 0: ECL Uplift Dashboard ── */}
      {tab === 0 && (
        <div>
          {/* Scenario selector */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {SCENARIOS_CC.map(sc => (
              <button key={sc.code} onClick={() => setActiveScenario(sc.code)} style={{
                background: activeScenario === sc.code ? sc.color : '#fff',
                color: activeScenario === sc.code ? '#fff' : T.slate,
                border: `2px solid ${sc.color}`, borderRadius: 6,
                padding: '6px 12px', fontSize: 12, cursor: 'pointer',
              }}>{sc.name}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('PD Multiplier', selectedSc ? selectedSc.pdMultiplier.toFixed(2)+'×' : '—', 'Climate adjustment to PD', selectedSc?.color || T.navy)}
            {card('Portfolio ECL Base', '$' + OBLIGORS_CC.reduce((s,o)=>s+o.scenarios_adj[0].ecl_base,0).toFixed(0)+'M', 'IFRS 9 baseline')}
            {card('Portfolio ECL Adj', '$' + OBLIGORS_CC.reduce((s,o)=>s+o.scenarios_adj[scIdx].ecl_adj,0).toFixed(0)+'M', activeScenario, selectedSc?.color || T.amber)}
            {card('ECL Uplift', portfolioStats[scIdx]?.uplift_pct.toFixed(1)+'%', 'Portfolio level', T.red)}
            {card('Stage Migrations', portfolioStats[scIdx]?.migrations, 'Obligors changing stage', T.purple)}
          </div>

          {/* Portfolio uplift comparison */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>ECL Uplift (%) by Scenario — Portfolio Level</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={portfolioStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="sc_name" tick={{ fontSize: 10, fontFamily: T.mono }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v + '%'} />
                <Tooltip formatter={v => [v+'%', 'ECL Uplift']} />
                <ReferenceLine y={0} stroke={T.slate} />
                <Bar dataKey="uplift_pct" name="ECL Uplift %" radius={[4,4,0,0]}>
                  {portfolioStats.map((p, i) => <Cell key={i} fill={SCENARIOS_CC[i].color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sector filter */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
            {['ALL', ...SECTORS_CC].map(s => (
              <button key={s} onClick={() => setSectorFilter(s)} style={{
                background: sectorFilter === s ? T.navy : '#fff', color: sectorFilter === s ? '#fff' : T.slate,
                border: `1px solid ${T.navy}33`, borderRadius: 5, padding: '3px 8px', fontSize: 10, cursor: 'pointer',
              }}>{s}</button>
            ))}
          </div>

          {/* Obligor table */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Obligor','Sector','PD Base','PD Adj','LGD Adj','EAD ($M)','ECL Base ($M)','ECL Adj ($M)','Uplift %','Stage (base→adj)','SICR Z-Adj'].map(h => (
                    <th key={h} style={{ padding: '9px 9px', textAlign: 'left', fontFamily: T.mono, fontSize: 9 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredObligors.slice(0, 25).map((o, i) => (
                  <tr key={o.id} style={{ background: i%2===0?'#fff':T.cream+'80', borderBottom:`1px solid ${T.navy}11` }}>
                    <td style={{ padding:'7px 9px', fontWeight:600, color:T.navy, fontSize:11 }}>{o.name}</td>
                    <td style={{ padding:'7px 9px' }}>{pill(o.sector, T.teal)}</td>
                    <td style={{ padding:'7px 9px', fontFamily:T.mono, fontSize:10 }}>{(o.pd_base*100).toFixed(3)}%</td>
                    <td style={{ padding:'7px 9px', fontFamily:T.mono, fontSize:10, color:T.red }}>{(o.adj.pd_adj*100).toFixed(3)}%</td>
                    <td style={{ padding:'7px 9px', fontFamily:T.mono, fontSize:10 }}>{(o.adj.lgd_adj*100).toFixed(1)}%</td>
                    <td style={{ padding:'7px 9px', fontFamily:T.mono, textAlign:'right' }}>{o.ead.toFixed(0)}</td>
                    <td style={{ padding:'7px 9px', fontFamily:T.mono, textAlign:'right' }}>{o.adj.ecl_base.toFixed(2)}</td>
                    <td style={{ padding:'7px 9px', fontFamily:T.mono, fontWeight:700, color:T.amber, textAlign:'right' }}>{o.adj.ecl_adj.toFixed(2)}</td>
                    <td style={{ padding:'7px 9px' }}>{pill('+'+o.adj.uplift_pct.toFixed(1)+'%', o.adj.uplift_pct>30?T.red:o.adj.uplift_pct>10?T.amber:T.teal)}</td>
                    <td style={{ padding:'7px 9px', display:'flex', alignItems:'center', gap:4 }}>
                      {pill('S'+o.stage_base, STAGE_COLOR[o.stage_base])}
                      {o.adj.stage_migration && <span style={{color:T.red}}>→</span>}
                      {o.adj.stage_migration && pill('S'+o.adj.stage_adj, STAGE_COLOR[o.adj.stage_adj])}
                    </td>
                    <td style={{ padding:'7px 9px', fontFamily:T.mono, fontSize:10,
                      color: o.adj.sicr_z_adj > 2 ? T.red : o.adj.sicr_z_adj > 1 ? T.amber : T.green }}>
                      {o.adj.sicr_z_adj.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 1: Hazard × Sector Matrix ── */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['ALL', ...SECTORS_CC].map(s => (
                <button key={s} onClick={() => setSectorFilter(s)} style={{
                  background: sectorFilter === s ? T.navy : '#fff', color: sectorFilter === s ? '#fff' : T.slate,
                  border: `1px solid ${T.navy}33`, borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                }}>{s}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Radar for selected sector */}
            <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>
                Hazard Exposure Radar — {sectorFilter === 'ALL' ? 'Portfolio Average' : sectorFilter}
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={hazardScoreData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Exposure" dataKey="score" stroke={T.red} fill={T.red} fillOpacity={0.25} />
                  <Tooltip formatter={v=>[v, 'Exposure Score']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Heatmap substitute — bar per hazard per sector */}
            <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Avg Hazard Score by Sector</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={HAZARD_MATRIX.map(r => ({
                  sector: r.sector.replace(' & ',' /'),
                  avg: Math.round(HAZARDS.reduce((s,h)=>s+r[h],0)/HAZARDS.length),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="sector" tick={{ fontSize: 9 }} />
                  <YAxis domain={[0,100]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v=>[v,'Avg Hazard']} />
                  <Bar dataKey="avg" radius={[3,3,0,0]}>
                    {HAZARD_MATRIX.map((r,i) => {
                      const avg = Math.round(HAZARDS.reduce((s,h)=>s+r[h],0)/HAZARDS.length);
                      return <Cell key={i} fill={avg>65?T.red:avg>45?T.amber:T.teal} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Full hazard matrix table */}
          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 11 }}>Sector</th>
                  {HAZARDS.map(h => (
                    <th key={h} style={{ padding: '10px 10px', textAlign: 'right', fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                  ))}
                  <th style={{ padding: '10px 10px', textAlign: 'right', fontFamily: T.mono, fontSize: 10 }}>Avg</th>
                </tr>
              </thead>
              <tbody>
                {HAZARD_MATRIX.map((row, i) => {
                  const avg = Math.round(HAZARDS.reduce((s,h)=>s+row[h],0)/HAZARDS.length);
                  return (
                    <tr key={row.sector} style={{ background: i%2===0?'#fff':T.cream+'80', borderBottom:`1px solid ${T.navy}11` }}>
                      <td style={{ padding:'9px 12px', fontWeight:600, color:T.navy }}>{row.sector}</td>
                      {HAZARDS.map(h => (
                        <td key={h} style={{ padding:'9px 10px', textAlign:'right', fontFamily:T.mono,
                          background: row[h]>70?T.red+'22':row[h]>50?T.amber+'18':row[h]>30?T.teal+'12':'transparent',
                          color: row[h]>70?T.red:row[h]>50?T.amber:T.slate }}>{row[h]}</td>
                      ))}
                      <td style={{ padding:'9px 10px', textAlign:'right', fontFamily:T.mono, fontWeight:700,
                        color: avg>60?T.red:avg>40?T.amber:T.teal }}>{avg}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 2: Sector Transition Risk ── */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('Highest Transition Risk', 'Oil & Gas', 'Carbon cost + stranded assets', T.red)}
            {card('NZ2050 Max Stranded', SECTOR_TRANSITION.map(s=>s.stranded_pct_nz).reduce((a,b)=>Math.max(a,b)).toFixed(0)+'%', 'As % of sector value', T.amber)}
            {card('CP Stranded Risk', SECTOR_TRANSITION.map(s=>s.stranded_pct_cp).reduce((a,b)=>Math.max(a,b)).toFixed(1)+'%', 'Current Policies max', T.teal)}
            {card('Carbon Cost Range', '$10–$4.8K M', 'Per sector NZ2050 by 2050', T.navy)}
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: T.navy, marginBottom: 12 }}>Carbon Cost 2050 by Sector — NZ2050 vs Current Policies ($M)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={SECTOR_TRANSITION}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="sector" tick={{ fontSize: 9 }} />
                <YAxis tickFormatter={v=>'$'+(v/1000).toFixed(0)+'B'} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v=>['$'+v.toLocaleString()+'M']} />
                <Legend />
                <Bar dataKey="carbon_cost_2050_nz" name="NZ2050 Carbon Cost" fill={T.green}  radius={[3,3,0,0]} />
                <Bar dataKey="carbon_cost_2050_cp" name="Current Policies"   fill={T.red}    radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Sector','Carbon Cost 2030 NZ ($M)','Carbon Cost 2050 NZ ($M)','Stranded % (NZ)','Carbon Cost 2030 CP','Stranded % (CP)','Risk Delta'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTOR_TRANSITION.map((s, i) => (
                  <tr key={s.sector} style={{ background: i%2===0?'#fff':T.cream+'80', borderBottom:`1px solid ${T.navy}11` }}>
                    <td style={{ padding:'9px 12px', fontWeight:600, color:T.navy }}>{s.sector}</td>
                    <td style={{ padding:'9px 12px', fontFamily:T.mono, textAlign:'right' }}>{s.carbon_cost_2030_nz.toLocaleString()}</td>
                    <td style={{ padding:'9px 12px', fontFamily:T.mono, fontWeight:700, color:T.amber, textAlign:'right' }}>{s.carbon_cost_2050_nz.toLocaleString()}</td>
                    <td style={{ padding:'9px 12px' }}>{pill(s.stranded_pct_nz.toFixed(1)+'%', s.stranded_pct_nz>40?T.red:s.stranded_pct_nz>20?T.amber:T.teal)}</td>
                    <td style={{ padding:'9px 12px', fontFamily:T.mono, textAlign:'right' }}>{s.carbon_cost_2030_cp.toLocaleString()}</td>
                    <td style={{ padding:'9px 12px' }}>{pill(s.stranded_pct_cp.toFixed(1)+'%', T.green)}</td>
                    <td style={{ padding:'9px 12px' }}>{pill('+'+((s.carbon_cost_2050_nz/Math.max(s.carbon_cost_2050_cp,1)-1)*100).toFixed(0)+'%', T.purple)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 3: Intermodular Map ── */}
      {tab === 3 && (
        <div>
          <div style={{ background: T.teal+'12', border:`1px solid ${T.teal}44`, borderRadius:8, padding:'12px 16px', marginBottom:16, fontSize:12, color:T.slate }}>
            <strong style={{ color: T.teal }}>Intermodular Wiring (Migration 088 — intermodule_climate_links table):</strong>{' '}
            NGFS/IEA scenario outputs flow into 12 downstream platform modules. Bidirectional links exchange data back for calibration.
            Variables passed are stored in JSONB column <code style={{ fontFamily: T.mono }}>variables_passed</code> in the DB.
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {card('Downstream Modules', MODULE_LINKS.length, 'Receive scenario data')}
            {card('Bidirectional Links', MODULE_LINKS.filter(m=>m.direction==='bidirectional').length, 'Two-way data exchange', T.purple)}
            {card('Output Links', MODULE_LINKS.filter(m=>m.direction==='output').length, 'Scenario → Module feeds', T.teal)}
            {card('Variables Mapped', MODULE_LINKS.reduce((s,m)=>s+m.vars.length,0), 'Across all links', T.amber)}
          </div>

          <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.navy}22`, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#fff' }}>
                  {['Target Module','EP Code','Link Type','Direction','Variables Passed','DB Table (088)','Status'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULE_LINKS.map((m, i) => (
                  <tr key={m.code} style={{ background: i%2===0?'#fff':T.cream+'80', borderBottom:`1px solid ${T.navy}11` }}>
                    <td style={{ padding:'9px 12px', fontWeight:600, color:T.navy }}>{m.module}</td>
                    <td style={{ padding:'9px 12px' }}>{pill(m.code, T.teal)}</td>
                    <td style={{ padding:'9px 12px', fontSize:11, color:T.slate }}>{m.linkType}</td>
                    <td style={{ padding:'9px 12px' }}>{pill(m.direction, LINK_COLOR[m.direction]||T.navy)}</td>
                    <td style={{ padding:'9px 12px' }}>
                      <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                        {m.vars.map(v => (
                          <span key={v} style={{ fontFamily:T.mono, fontSize:9, background:T.navy+'12',
                            color:T.navy, borderRadius:3, padding:'1px 5px' }}>{v}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding:'9px 12px', fontFamily:T.mono, fontSize:10, color:T.teal }}>
                      {m.direction==='metadata' ? 'intermodule_climate_links' : 'portfolio_climate_alignment'}
                    </td>
                    <td style={{ padding:'9px 12px' }}>{pill('Active', T.green)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* DB schema summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[
              { table: 'climate_scenarios',          cols: 15, purpose: 'Master scenario catalogue: NGFS/IEA/IPCC/IRENA/GFANZ',       color: T.teal  },
              { table: 'climate_scenario_variables',  cols: 12, purpose: 'Time-series values per scenario (500+ variables, 2020–2100)', color: T.navy  },
              { table: 'scenario_ensemble_weights',   cols: 9,  purpose: 'BMA weights: 6 methods, temperature-conditional Gaussian',   color: T.purple },
              { table: 'asset_climate_risk',          cols: 28, purpose: 'Physical + transition risk per asset × scenario',             color: T.amber },
              { table: 'climate_hazard_sector_matrix',cols: 8,  purpose: 'Sector × hazard exposure weights + vulnerability coeffs',    color: T.red   },
              { table: 'portfolio_climate_alignment', cols: 20, purpose: 'Portfolio-level: WACI, temp score, ECL uplift, RWA',          color: T.green },
              { table: 'climate_credit_risk',         cols: 24, purpose: 'Obligor-level PD/LGD/ECL adj, IFRS9 staging, Merton DD',     color: T.blue  },
              { table: 'intermodule_climate_links',   cols: 9,  purpose: 'Registry of all cross-module data flows from this engine',    color: T.slate },
            ].map(t => (
              <div key={t.table} style={{ background: '#fff', borderRadius: 8, border: `2px solid ${t.color}33`, padding: 12 }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: t.color, fontWeight: 700, marginBottom: 4 }}>{t.table}</div>
                <div style={{ fontSize: 10, color: T.slate, marginBottom: 4 }}>{t.purpose}</div>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: T.navy }}>{t.cols} columns · migration 088</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
