import React, { useState } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, Legend,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const TABS = [
  'Portfolio Overview',
  'Climate PD Migration',
  'EBA Due Diligence',
  'CLO Tranche Analysis',
  'Transition Default',
  'Sustainable Finance',
];

const tip = {
  background: T.surface, border: `1px solid ${T.border}`,
  borderRadius: 8, color: T.text, fontSize: 11,
};

/* ─── DATA ──────────────────────────────────────────────────────────── */

const LOANS = [
  { id: 1,  borrower: 'Energize Holdings',      type: 'Direct Lending',    outstanding: 142, industry: 'Oil & Gas',       climateRisk: 4, physRisk: 3.8, transRisk: 4.2, pd: 3.1, lgd: 42, el: 130 },
  { id: 2,  borrower: 'GreenBuild Partners',     type: 'Direct Lending',    outstanding: 87,  industry: 'Real Estate',     climateRisk: 2, physRisk: 2.9, transRisk: 1.8, pd: 1.4, lgd: 35, el: 49  },
  { id: 3,  borrower: 'Nordic Cement AS',        type: 'Direct Lending',    outstanding: 115, industry: 'Materials',       climateRisk: 4, physRisk: 2.1, transRisk: 4.5, pd: 2.8, lgd: 45, el: 126 },
  { id: 4,  borrower: 'Apex Auto Components',    type: 'Direct Lending',    outstanding: 96,  industry: 'Automotive',      climateRisk: 3, physRisk: 1.9, transRisk: 3.4, pd: 2.2, lgd: 38, el: 84  },
  { id: 5,  borrower: 'Coastal Logistics Ltd',   type: 'Direct Lending',    outstanding: 74,  industry: 'Transport',       climateRisk: 3, physRisk: 3.4, transRisk: 2.7, pd: 1.9, lgd: 40, el: 76  },
  { id: 6,  borrower: 'AgriCore Foods',          type: 'Direct Lending',    outstanding: 58,  industry: 'Agriculture',     climateRisk: 3, physRisk: 4.1, transRisk: 2.2, pd: 1.7, lgd: 36, el: 61  },
  { id: 7,  borrower: 'TechServ DataCo',         type: 'Direct Lending',    outstanding: 43,  industry: 'Technology',      climateRisk: 1, physRisk: 1.2, transRisk: 1.1, pd: 0.9, lgd: 30, el: 27  },
  { id: 8,  borrower: 'Precision Manufacturing', type: 'Direct Lending',    outstanding: 67,  industry: 'Industrials',     climateRisk: 3, physRisk: 2.3, transRisk: 3.0, pd: 1.8, lgd: 39, el: 70  },
  { id: 9,  borrower: 'Vanguard Coal Ltd',       type: 'Leveraged Loans',   outstanding: 210, industry: 'Coal Mining',     climateRisk: 5, physRisk: 2.8, transRisk: 5.0, pd: 5.8, lgd: 55, el: 319 },
  { id: 10, borrower: 'Atlantic Oil Services',   type: 'Leveraged Loans',   outstanding: 185, industry: 'Oil & Gas',       climateRisk: 5, physRisk: 3.0, transRisk: 4.8, pd: 4.9, lgd: 50, el: 245 },
  { id: 11, borrower: 'Iberian Steel Works',     type: 'Leveraged Loans',   outstanding: 132, industry: 'Materials',       climateRisk: 4, physRisk: 2.5, transRisk: 4.1, pd: 3.4, lgd: 44, el: 150 },
  { id: 12, borrower: 'Skybridge Aviation',      type: 'Leveraged Loans',   outstanding: 168, industry: 'Aviation',        climateRisk: 4, physRisk: 2.2, transRisk: 4.3, pd: 3.8, lgd: 48, el: 182 },
  { id: 13, borrower: 'Metro Power Grid',        type: 'Leveraged Loans',   outstanding: 94,  industry: 'Utilities',       climateRisk: 2, physRisk: 3.1, transRisk: 1.5, pd: 1.2, lgd: 33, el: 40  },
  { id: 14, borrower: 'Apex CLO 2021-1',        type: 'CLOs',              outstanding: 320, industry: 'Diversified',     climateRisk: 3, physRisk: 2.4, transRisk: 2.9, pd: 2.1, lgd: 38, el: 80  },
  { id: 15, borrower: 'Meridian CLO 2019-3',    type: 'CLOs',              outstanding: 285, industry: 'Diversified',     climateRisk: 3, physRisk: 2.7, transRisk: 3.2, pd: 2.5, lgd: 41, el: 102 },
  { id: 16, borrower: 'Horizon CLO 2022-2',     type: 'CLOs',              outstanding: 195, industry: 'Diversified',     climateRisk: 2, physRisk: 2.0, transRisk: 2.4, pd: 1.8, lgd: 36, el: 65  },
  { id: 17, borrower: 'Vantage CLO 2018-1',     type: 'CLOs',              outstanding: 240, industry: 'Diversified',     climateRisk: 4, physRisk: 3.2, transRisk: 3.8, pd: 3.1, lgd: 43, el: 133 },
  { id: 18, borrower: 'Thames Gateway PropCo',  type: 'Real Estate Debt',  outstanding: 98,  industry: 'Real Estate',     climateRisk: 3, physRisk: 4.2, transRisk: 2.1, pd: 1.6, lgd: 37, el: 59  },
  { id: 19, borrower: 'Nordic Office REIT',     type: 'Real Estate Debt',  outstanding: 76,  industry: 'Real Estate',     climateRisk: 2, physRisk: 2.8, transRisk: 1.6, pd: 1.1, lgd: 32, el: 35  },
  { id: 20, borrower: 'Iberian Retail PropCo',  type: 'Real Estate Debt',  outstanding: 113, industry: 'Real Estate',     climateRisk: 3, physRisk: 3.6, transRisk: 2.5, pd: 1.9, lgd: 38, el: 72  },
];

const INDUSTRY_CHART = [
  { industry: 'Coal Mining',  outstanding: 210, avgRisk: 5 },
  { industry: 'Oil & Gas',    outstanding: 327, avgRisk: 4.5 },
  { industry: 'Aviation',     outstanding: 168, avgRisk: 4 },
  { industry: 'Materials',    outstanding: 247, avgRisk: 4 },
  { industry: 'Automotive',   outstanding: 96,  avgRisk: 3 },
  { industry: 'Transport',    outstanding: 74,  avgRisk: 3 },
  { industry: 'Agriculture',  outstanding: 58,  avgRisk: 3 },
  { industry: 'Industrials',  outstanding: 67,  avgRisk: 3 },
  { industry: 'Real Estate',  outstanding: 287, avgRisk: 2.7 },
  { industry: 'Diversified',  outstanding: 1040,avgRisk: 3 },
  { industry: 'Utilities',    outstanding: 94,  avgRisk: 2 },
  { industry: 'Technology',   outstanding: 43,  avgRisk: 1 },
];

const riskColor = (r) => {
  if (r >= 4.5) return T.red;
  if (r >= 3.5) return '#f97316';
  if (r >= 2.5) return T.amber;
  if (r >= 1.5) return T.gold;
  return T.sage;
};

const EL_SPLIT = [
  { name: 'Energy',      physEl: 18, transEl: 112 },
  { name: 'Materials',   physEl: 22, transEl: 88  },
  { name: 'Transport',   physEl: 35, transEl: 62  },
  { name: 'Automotive',  physEl: 12, transEl: 72  },
  { name: 'Aviation',    physEl: 20, transEl: 162 },
  { name: 'Real Estate', physEl: 55, transEl: 22  },
  { name: 'Agriculture', physEl: 48, transEl: 13  },
  { name: 'Diversified', physEl: 28, transEl: 52  },
];

/* Tab 2 */
const SECTORS_PD = [
  { sector: 'Coal Mining',   basePD: 3.2, nz2050: 8.4, below2: 6.1, divNZ: 7.8, delayed: 4.8, ndc: 4.1, currPol: 3.5 },
  { sector: 'Oil & Gas',     basePD: 2.8, nz2050: 6.9, below2: 5.3, divNZ: 6.4, delayed: 4.2, ndc: 3.5, currPol: 3.0 },
  { sector: 'Utilities',     basePD: 1.2, nz2050: 1.8, below2: 1.5, divNZ: 2.1, delayed: 2.8, ndc: 1.6, currPol: 1.3 },
  { sector: 'Automotive',    basePD: 2.2, nz2050: 4.8, below2: 3.7, divNZ: 4.1, delayed: 3.5, ndc: 2.9, currPol: 2.4 },
  { sector: 'Aviation',      basePD: 3.1, nz2050: 5.9, below2: 4.8, divNZ: 5.5, delayed: 4.5, ndc: 3.8, currPol: 3.3 },
  { sector: 'Materials',     basePD: 2.5, nz2050: 5.2, below2: 4.0, divNZ: 4.7, delayed: 3.8, ndc: 3.1, currPol: 2.7 },
  { sector: 'Agriculture',   basePD: 1.7, nz2050: 3.1, below2: 2.5, divNZ: 2.8, delayed: 3.6, ndc: 2.4, currPol: 1.9 },
  { sector: 'Real Estate',   basePD: 1.5, nz2050: 2.9, below2: 2.3, divNZ: 2.6, delayed: 3.4, ndc: 2.2, currPol: 1.7 },
  { sector: 'Transport',     basePD: 1.9, nz2050: 3.7, below2: 2.9, divNZ: 3.3, delayed: 3.1, ndc: 2.6, currPol: 2.1 },
  { sector: 'Technology',    basePD: 0.9, nz2050: 1.1, below2: 1.0, divNZ: 1.2, delayed: 1.3, ndc: 1.0, currPol: 0.9 },
];

const PD_UPLIFT_CHART = SECTORS_PD.map(s => ({
  sector: s.sector.replace(' ', '\n'),
  'NZ2050': +((s.nz2050 - s.basePD) * 100).toFixed(0),
  'Delayed': +((s.delayed - s.basePD) * 100).toFixed(0),
  'Curr Pol': +((s.currPol - s.basePD) * 100).toFixed(0),
}));

const MIGRATION_MATRIX = [
  { borrower: 'Vanguard Coal Ltd',    current: 'BB', aaa: 0, aa: 0, a: 0, bbb: 5, bb: 28, b: 22, ccc: 45 },
  { borrower: 'Atlantic Oil Services',current: 'BB+', aaa: 0, aa: 0, a: 2, bbb: 18, bb: 42, b: 28, ccc: 10 },
  { borrower: 'Iberian Steel Works',  current: 'BB-', aaa: 0, aa: 0, a: 0, bbb: 8, bb: 35, b: 38, ccc: 19 },
];

/* Tab 3 */
const DD_LOANS = LOANS.map((l, i) => ({
  ...l,
  physComplete: [1,2,3,4,5,6,7,8,10,12,13,14,15,16,18,19].includes(l.id),
  transComplete: [1,2,3,5,6,7,8,9,10,12,13,14,15,17,18,20].includes(l.id),
  tcfd: i % 3 === 0 ? 'Y' : i % 3 === 1 ? 'Partial' : 'N',
  collateralAdj: [1,2,3,4,6,7,8,9,10,12,14,15,16,17,18,19].includes(l.id),
  climateCovenant: [1,3,5,7,9,10,12,14,15,17,18,20].includes(l.id),
}));

const COVENANTS = [
  { name: 'Carbon Intensity KPI',             count: 12, spread: -8  },
  { name: 'Energy Efficiency Target',         count: 9,  spread: -6  },
  { name: 'TCFD Reporting Obligation',        count: 15, spread: -4  },
  { name: 'Science-Based Target Commitment', count: 7,  spread: -12 },
  { name: 'Sustainability Margin Ratchet',   count: 8,  spread: -9  },
];

/* Tab 4 */
const CLO_DEALS = [
  { name: 'Apex CLO 2021-1',    vintage: 2021 },
  { name: 'Meridian CLO 2019-3',vintage: 2019 },
  { name: 'Horizon CLO 2022-2', vintage: 2022 },
  { name: 'Vantage CLO 2018-1', vintage: 2018 },
];

const TRANCHES = ['AAA','AA','A','BBB','BB','B','CCC','Equity'];
const TRANCHE_BASE = [
  { tranche:'AAA', outstanding:120, climateEl:0.4, climateBeta:0.05, oc:28.5, stress:'Pass' },
  { tranche:'AA',  outstanding:45,  climateEl:0.9, climateBeta:0.12, oc:21.3, stress:'Pass' },
  { tranche:'A',   outstanding:32,  climateEl:1.8, climateBeta:0.21, oc:15.8, stress:'Pass' },
  { tranche:'BBB', outstanding:28,  climateEl:3.4, climateBeta:0.38, oc:10.2, stress:'Watch' },
  { tranche:'BB',  outstanding:22,  climateEl:6.2, climateBeta:0.65, oc:5.9,  stress:'Watch' },
  { tranche:'B',   outstanding:18,  climateEl:11.4,climateBeta:1.02, oc:2.8,  stress:'Fail'  },
  { tranche:'CCC', outstanding:12,  climateEl:18.7,climateBeta:1.45, oc:0.8,  stress:'Fail'  },
  { tranche:'Equity',outstanding:8, climateEl:42.1,climateBeta:2.10, oc:0,    stress:'Fail'  },
];

const CLO_BETA_CHART = CLO_DEALS.map(d => ({
  deal: d.name.replace('CLO ',''),
  vintage: d.vintage,
  ...Object.fromEntries(TRANCHES.map((tr, i) => [tr, +(TRANCHE_BASE[i].climateBeta * (d.vintage < 2020 ? 1.3 : 1.0)).toFixed(2)])),
}));

const WATERFALL = TRANCHE_BASE.map(t => ({
  tranche: t.tranche,
  loss: +(t.climateEl * t.outstanding / 1000).toFixed(2),
}));

/* Tab 5 */
const HIGH_CARBON = [
  { borrower: 'Atlantic Oil Services', rating:'BB+', ci: 820, transScore: 3.2, cp65: 53, cp130: 106 },
  { borrower: 'Vanguard Coal Ltd',     rating:'BB',  ci:1420, transScore: 1.8, cp65: 92, cp130: 184 },
  { borrower: 'Nordic Cement AS',      rating:'B+',  ci: 640, transScore: 4.1, cp65: 42, cp130: 83  },
  { borrower: 'Apex Auto Components',  rating:'B',   ci: 380, transScore: 5.4, cp65: 25, cp130: 49  },
  { borrower: 'Skybridge Aviation',    rating:'CCC+',ci: 710, transScore: 2.9, cp65: 46, cp130: 92  },
];

const DEFAULT_TIMELINE = [
  { year:2024, nz2050:0, delayed:0, currPol:0 },
  { year:2025, nz2050:2, delayed:1, currPol:0.5 },
  { year:2026, nz2050:5, delayed:2, currPol:1 },
  { year:2027, nz2050:9, delayed:3, currPol:1.5 },
  { year:2028, nz2050:15,delayed:5, currPol:2 },
  { year:2029, nz2050:22,delayed:7, currPol:2.5 },
  { year:2030, nz2050:31,delayed:10,currPol:3 },
  { year:2031, nz2050:38,delayed:13,currPol:3.5 },
  { year:2032, nz2050:44,delayed:18,currPol:4 },
  { year:2033, nz2050:50,delayed:24,currPol:4.8 },
  { year:2034, nz2050:57,delayed:32,currPol:5.5 },
  { year:2035, nz2050:64,delayed:41,currPol:6.2 },
];

const CLIFF_EVENTS = [
  { year: 2026, event: 'EU ETS Phase 4 — End of free allocations for aviation', sectors: 'Aviation' },
  { year: 2026, event: 'CBAM Full Implementation (Steel, Cement, Fertilisers)', sectors: 'Materials' },
  { year: 2030, event: 'Coal phase-out mandate (OECD)',                         sectors: 'Coal Mining' },
  { year: 2031, event: 'ICE vehicle new-sales ban (EU)',                         sectors: 'Automotive' },
  { year: 2033, event: 'EU ETS phase-out of free allocations for heavy industry',sectors: 'Oil & Gas, Materials' },
  { year: 2035, event: 'Global coal phase-out (IEA Net Zero)',                   sectors: 'Coal Mining' },
];

/* Tab 6 */
const SLLS = [
  { borrower:'GreenBuild Partners',     kpi:'Carbon Intensity Reduction', baseMargin:245, stepDown:12, stepUp:15, trajectory:'↓22%',  status:'On-Track'  },
  { borrower:'Nordic Cement AS',        kpi:'Energy Efficiency Target',   baseMargin:280, stepDown:8,  stepUp:12, trajectory:'↓8%',   status:'Off-Track' },
  { borrower:'Coastal Logistics Ltd',   kpi:'Carbon Intensity Reduction', baseMargin:235, stepDown:10, stepUp:14, trajectory:'↓15%',  status:'On-Track'  },
  { borrower:'AgriCore Foods',          kpi:'Water Intensity Reduction',  baseMargin:220, stepDown:7,  stepUp:10, trajectory:'↓18%',  status:'Achieved'  },
  { borrower:'Metro Power Grid',        kpi:'Renewables Mix Target',      baseMargin:195, stepDown:15, stepUp:18, trajectory:'62%',   status:'On-Track'  },
  { borrower:'TechServ DataCo',         kpi:'Gender Diversity Target',    baseMargin:185, stepDown:6,  stepUp:8,  trajectory:'38%',   status:'On-Track'  },
  { borrower:'Nordic Office REIT',      kpi:'Energy Efficiency Target',   baseMargin:210, stepDown:9,  stepUp:12, trajectory:'↓11%',  status:'Achieved'  },
  { borrower:'Precision Manufacturing', kpi:'TRIR Reduction',             baseMargin:255, stepDown:8,  stepUp:11, trajectory:'↓14%',  status:'Off-Track' },
];

const GREEN_LOANS = [
  { borrower:'Thames Gateway PropCo', size:98,  use:'Green Building Retrofit',   verified:true,  standard:'LMA Green Loan' },
  { borrower:'Metro Power Grid',      size:94,  use:'Wind Farm Refinancing',      verified:true,  standard:'ICMA GBP'       },
  { borrower:'Iberian Retail PropCo', size:113, use:'Solar PV Installation',      verified:false, standard:'LMA Green Loan' },
  { borrower:'Nordic Office REIT',    size:76,  use:'EV Charging Infrastructure', verified:true,  standard:'EU Taxonomy'    },
];

const PIPELINE = [
  { borrower:'Energize Holdings',    type:'SLL', kpi:'Carbon Intensity -30% by 2027', margin:265, ratchet:'±18bps', status:'Term Sheet' },
  { borrower:'Iberian Steel Works',  type:'SLL', kpi:'Green Steel Share >40% by 2028',margin:290, ratchet:'±14bps', status:'Negotiation' },
  { borrower:'Skybridge Aviation',   type:'SLL', kpi:'SAF Blend >5% by 2026',         margin:310, ratchet:'±20bps', status:'Due Diligence' },
];

/* ─── HELPERS ───────────────────────────────────────────────────────── */
const Card = ({ children, style }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 12, padding: '20px 24px',
    boxShadow: T.card, ...style,
  }}>{children}</div>
);

const KPI = ({ label, value, sub, color }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 12, padding: '18px 22px', boxShadow: T.card,
    flex: 1, minWidth: 180,
  }}>
    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 6 }}>{sub}</div>}
  </div>
);

const Badge = ({ text, color, bg }) => (
  <span style={{
    background: bg || '#eef2f8', color: color || T.navy,
    borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600,
  }}>{text}</span>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 14, marginTop: 4 }}>{children}</div>
);

const CustomTip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ ...tip, padding: '10px 14px', minWidth: 140 }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: T.navy }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>{p.name}: <b>{p.value}</b></div>
      ))}
    </div>
  );
};

/* ─── TAB 1: Portfolio Overview ─────────────────────────────────────── */
function Tab1() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KPI label="Portfolio Outstanding" value="$2.8bn" sub="20 loans across 4 types" />
        <KPI label="Wtd Avg Climate Risk" value="2.8 / 5" sub="↑ from 2.4 (prior year)" color={T.amber} />
        <KPI label="Climate-Adj EL Uplift" value="+32 bps" sub="vs non-climate baseline" color={T.red} />
        <KPI label="Climate DD Completed" value="67%" sub="22% partial · 11% pending" color={T.sage} />
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <Card style={{ flex: 2, minWidth: 360 }}>
          <SectionTitle>Outstanding by Industry — Climate Risk Colour Coded</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={INDUSTRY_CHART} margin={{ left: 10, right: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="industry" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit="M" />
              <Tooltip content={<CustomTip />} />
              <Bar dataKey="outstanding" name="Outstanding ($M)" radius={[4,4,0,0]}>
                {INDUSTRY_CHART.map((d, i) => <Cell key={i} fill={riskColor(d.avgRisk)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            {[['5 – Critical',T.red],['4 – High','#f97316'],['3 – Medium',T.amber],['2 – Low',T.gold],['1 – Minimal',T.sage]].map(([l,c]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:T.textSec }}>
                <div style={{ width:10, height:10, borderRadius:2, background:c }} />{l}
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ flex: 1, minWidth: 260 }}>
          <SectionTitle>Physical vs Transition Risk — EL Contribution</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={EL_SPLIT} layout="vertical" margin={{ left: 50, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} unit=" bps" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip content={<CustomTip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="physEl" name="Physical EL" fill={T.amber} stackId="a" radius={[0,0,0,0]} />
              <Bar dataKey="transEl" name="Transition EL" fill={T.navy} stackId="a" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionTitle>Loan Portfolio — Key Climate Metrics</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['Borrower','Type','$M','Industry','Climate Risk','Phys','Trans','PD%','LGD%','EL bps'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LOANS.map((l, i) => (
                <tr key={l.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding:'7px 10px', fontWeight:600, color:T.text, whiteSpace:'nowrap' }}>{l.borrower}</td>
                  <td style={{ padding:'7px 10px', color:T.textSec }}>{l.type}</td>
                  <td style={{ padding:'7px 10px', color:T.textSec }}>{l.outstanding}</td>
                  <td style={{ padding:'7px 10px', color:T.textSec }}>{l.industry}</td>
                  <td style={{ padding:'7px 10px' }}>
                    <span style={{ background: riskColor(l.climateRisk) + '22', color: riskColor(l.climateRisk), borderRadius:6, padding:'2px 8px', fontWeight:700, fontSize:12 }}>{l.climateRisk}/5</span>
                  </td>
                  <td style={{ padding:'7px 10px', color:T.textSec }}>{l.physRisk}</td>
                  <td style={{ padding:'7px 10px', color:T.textSec }}>{l.transRisk}</td>
                  <td style={{ padding:'7px 10px', color: l.pd > 4 ? T.red : T.text }}>{l.pd}%</td>
                  <td style={{ padding:'7px 10px', color:T.textSec }}>{l.lgd}%</td>
                  <td style={{ padding:'7px 10px', fontWeight:700, color: l.el > 150 ? T.red : l.el > 80 ? T.amber : T.green }}>{l.el}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─── TAB 2: Climate PD Migration ───────────────────────────────────── */
function Tab2() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ background:`${T.amber}18`, border:`1px solid ${T.amber}40`, borderRadius:10, padding:'12px 18px', fontSize:13, color:T.amber }}>
        <b>Key Finding:</b> Coal mining loans migrate to CCC with <b>45% probability</b> under Net Zero 2050 by 2030. Oil & Gas PD uplift reaches <b>+410 bps</b> in accelerated scenarios.
      </div>

      <Card>
        <SectionTitle>Sector PD Uplift by Scenario (bps above baseline)</SectionTitle>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={PD_UPLIFT_CHART} margin={{ left:10, right:10, bottom:50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" tick={{ fontSize:9, fill:T.textSec }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize:10, fill:T.textSec }} unit=" bps" />
            <Tooltip content={<CustomTip />} />
            <Legend wrapperStyle={{ fontSize:11 }} />
            <Bar dataKey="NZ2050" name="Net Zero 2050" fill={T.red} radius={[3,3,0,0]} />
            <Bar dataKey="Delayed" name="Delayed Transition" fill={T.amber} radius={[3,3,0,0]} />
            <Bar dataKey="Curr Pol" name="Current Policies" fill={T.sage} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
        <Card style={{ flex:2, minWidth:320 }}>
          <SectionTitle>Sector PD — All 6 NGFS Phase IV Scenarios</SectionTitle>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:T.surfaceH }}>
                  {['Sector','Baseline','NZ 2050','Below 2°C','Div NZ','Delayed','NDC','Curr Pol'].map(h => (
                    <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTORS_PD.map((s, i) => (
                  <tr key={s.sector} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding:'7px 10px', fontWeight:600, color:T.text }}>{s.sector}</td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>{s.basePD}%</td>
                    {[s.nz2050, s.below2, s.divNZ, s.delayed, s.ndc, s.currPol].map((v, j) => (
                      <td key={j} style={{ padding:'7px 10px', fontWeight:700, color: v > s.basePD * 1.5 ? T.red : v > s.basePD * 1.2 ? T.amber : T.green }}>{v}%</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card style={{ flex:1, minWidth:260 }}>
          <SectionTitle>3-Year PD Migration Matrix — Net Zero 2050</SectionTitle>
          <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>High-carbon borrowers by rating band probability (%)</div>
          {MIGRATION_MATRIX.map(m => (
            <div key={m.borrower} style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontWeight:700, fontSize:12, color:T.navy }}>{m.borrower}</span>
                <Badge text={`Current: ${m.current}`} />
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {TRANCHES.map(tr => {
                  const v = m[tr.toLowerCase()] || 0;
                  return (
                    <div key={tr} style={{ flex:1, textAlign:'center' }}>
                      <div style={{ background: v > 30 ? T.red + '33' : v > 15 ? T.amber + '33' : T.border, borderRadius:4, padding:'4px 2px', fontSize:11, fontWeight:700, color: v > 30 ? T.red : v > 15 ? T.amber : T.textMut }}>
                        {v}%
                      </div>
                      <div style={{ fontSize:9, color:T.textMut, marginTop:2 }}>{tr}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/* ─── TAB 3: EBA Due Diligence ──────────────────────────────────────── */
function Tab3() {
  const fullCompliant = DD_LOANS.filter(l => l.physComplete && l.transComplete && l.tcfd === 'Y' && l.collateralAdj && l.climateCovenant).length;
  const partial = DD_LOANS.filter(l => {
    const score = [l.physComplete, l.transComplete, l.tcfd==='Y', l.collateralAdj, l.climateCovenant].filter(Boolean).length;
    return score >= 2 && score < 5;
  }).length;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        <KPI label="Full EBA Compliance" value={`${fullCompliant}/20`} sub="Meets EBA/GL/2020/06 fully" color={T.green} />
        <KPI label="Partial Compliance" value={`${partial}/20`} sub="1–3 criteria outstanding" color={T.amber} />
        <KPI label="Non-Compliant" value={`${20-fullCompliant-partial}/20`} sub="Remediation required" color={T.red} />
        <KPI label="TCFD Disclosure" value="45%" sub="Full · 35% Partial · 20% None" color={T.navyL} />
      </div>

      <Card>
        <SectionTitle>EBA Climate Due Diligence Checklist — All 20 Loans</SectionTitle>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead>
              <tr style={{ background:T.surfaceH }}>
                {['Borrower','Type','Physical DD','Transition DD','TCFD','Collateral Adj','Climate Covenant','Status'].map(h => (
                  <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DD_LOANS.map((l, i) => {
                const score = [l.physComplete, l.transComplete, l.tcfd==='Y', l.collateralAdj, l.climateCovenant].filter(Boolean).length;
                const status = score === 5 ? 'Compliant' : score >= 3 ? 'Partial' : 'Non-Compliant';
                const statusColor = status === 'Compliant' ? T.green : status === 'Partial' ? T.amber : T.red;
                return (
                  <tr key={l.id} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding:'6px 10px', fontWeight:600, color:T.text, whiteSpace:'nowrap' }}>{l.borrower}</td>
                    <td style={{ padding:'6px 10px', color:T.textSec, fontSize:10 }}>{l.type}</td>
                    {[l.physComplete, l.transComplete].map((v, j) => (
                      <td key={j} style={{ padding:'6px 10px', textAlign:'center' }}>
                        <span style={{ color: v ? T.green : T.red, fontWeight:700 }}>{v ? '✓' : '✗'}</span>
                      </td>
                    ))}
                    <td style={{ padding:'6px 10px', textAlign:'center' }}>
                      <Badge text={l.tcfd} color={l.tcfd==='Y' ? T.green : l.tcfd==='Partial' ? T.amber : T.red} bg={l.tcfd==='Y' ? '#dcfce7' : l.tcfd==='Partial' ? '#fef3c7' : '#fee2e2'} />
                    </td>
                    {[l.collateralAdj, l.climateCovenant].map((v, j) => (
                      <td key={j} style={{ padding:'6px 10px', textAlign:'center' }}>
                        <span style={{ color: v ? T.green : T.red, fontWeight:700 }}>{v ? '✓' : '✗'}</span>
                      </td>
                    ))}
                    <td style={{ padding:'6px 10px' }}>
                      <Badge text={status} color={statusColor} bg={statusColor + '20'} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionTitle>Climate Covenant Toolkit — EBA-Aligned Green Covenants</SectionTitle>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          {COVENANTS.map(c => (
            <div key={c.name} style={{ flex:1, minWidth:180, background:T.surfaceH, borderRadius:10, padding:'16px 18px', border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:10 }}>{c.name}</div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:11, color:T.textSec }}>Loans with covenant</span>
                <span style={{ fontWeight:700, color:T.navy }}>{c.count}/20</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:11, color:T.textSec }}>Spread impact</span>
                <span style={{ fontWeight:700, color:T.sage }}>{c.spread} bps</span>
              </div>
              <div style={{ marginTop:10, background:`${T.sage}22`, borderRadius:6, height:6 }}>
                <div style={{ width:`${(c.count/20)*100}%`, background:T.sage, borderRadius:6, height:6 }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ─── TAB 4: CLO Tranche Analysis ───────────────────────────────────── */
function Tab4() {
  const [selectedDeal, setSelectedDeal] = useState(0);
  const deal = CLO_DEALS[selectedDeal];
  const isOldVintage = deal.vintage < 2020;
  const vintageMultiplier = isOldVintage ? 1.3 : 1.0;
  const tranches = TRANCHE_BASE.map(t => ({ ...t, climateEl: +(t.climateEl * vintageMultiplier).toFixed(1), climateBeta: +(t.climateBeta * vintageMultiplier).toFixed(2) }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ background:`${T.navy}0d`, border:`1px solid ${T.navyL}30`, borderRadius:10, padding:'12px 18px', fontSize:13, color:T.navy }}>
        <b>Key Insight:</b> Equity tranches absorb <b>85%</b> of climate-related credit losses under Net Zero 2050. BBB tranches see <b>+12% EL uplift</b>. Pre-2019 vintage CLOs carry <b>30% higher</b> climate exposure due to fewer covenant protections.
      </div>

      <div style={{ display:'flex', gap:12 }}>
        {CLO_DEALS.map((d, i) => (
          <button key={d.name} onClick={() => setSelectedDeal(i)} style={{ padding:'8px 16px', borderRadius:8, border:`1px solid ${i===selectedDeal ? T.navy : T.border}`, background: i===selectedDeal ? T.navy : T.surface, color: i===selectedDeal ? '#fff' : T.textSec, fontWeight:600, fontSize:12, cursor:'pointer' }}>
            {d.name} <span style={{ opacity:0.7, fontSize:10 }}>({d.vintage})</span>
            {d.vintage < 2020 && <span style={{ marginLeft:6, color:i===selectedDeal ? '#fbbf24' : T.amber }}>⚠</span>}
          </button>
        ))}
      </div>

      {isOldVintage && (
        <div style={{ background:`${T.amber}18`, border:`1px solid ${T.amber}40`, borderRadius:8, padding:'10px 16px', fontSize:12, color:T.amber }}>
          <b>Vintage Warning:</b> {deal.name} (vintage {deal.vintage}) — pre-2020 CLO with limited climate covenant protections. Climate exposure multiplied by 1.3x.
        </div>
      )}

      <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
        <Card style={{ flex:2, minWidth:320 }}>
          <SectionTitle>{deal.name} — Tranche Climate Risk Profile</SectionTitle>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:T.surfaceH }}>
                  {['Tranche','Outstanding $M','Climate EL %','Climate Beta','OC Headroom %','NZ2050 Stress'].map(h => (
                    <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tranches.map((t, i) => (
                  <tr key={t.tranche} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding:'7px 10px', fontWeight:700, color:T.navy }}>{t.tranche}</td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>{t.outstanding}</td>
                    <td style={{ padding:'7px 10px', fontWeight:700, color: t.climateEl > 20 ? T.red : t.climateEl > 8 ? T.amber : T.green }}>{t.climateEl}%</td>
                    <td style={{ padding:'7px 10px', color: t.climateBeta > 1 ? T.red : T.textSec }}>{t.climateBeta}</td>
                    <td style={{ padding:'7px 10px', color: t.oc < 3 ? T.red : T.textSec }}>{t.oc}%</td>
                    <td style={{ padding:'7px 10px' }}>
                      <Badge text={t.stress} color={t.stress==='Pass' ? T.green : t.stress==='Watch' ? T.amber : T.red} bg={t.stress==='Pass' ? '#dcfce7' : t.stress==='Watch' ? '#fef3c7' : '#fee2e2'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card style={{ flex:1, minWidth:220 }}>
          <SectionTitle>Climate Loss Waterfall — Tranche Allocation</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={WATERFALL} layout="vertical" margin={{ left:40, right:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize:10 }} unit="$M" />
              <YAxis type="category" dataKey="tranche" tick={{ fontSize:11, fontWeight:600, fill:T.navy }} />
              <Tooltip content={<CustomTip />} />
              <Bar dataKey="loss" name="Climate Loss ($M)" radius={[0,4,4,0]}>
                {WATERFALL.map((d, i) => <Cell key={i} fill={riskColor(i / 1.4 + 1)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionTitle>Tranche Climate Beta — All CLO Deals</SectionTitle>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={CLO_BETA_CHART} margin={{ left:10, right:10, bottom:10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="deal" tick={{ fontSize:11, fill:T.textSec }} />
            <YAxis tick={{ fontSize:10, fill:T.textSec }} />
            <Tooltip content={<CustomTip />} />
            <Legend wrapperStyle={{ fontSize:11 }} />
            {['AAA','BBB','BB','Equity'].map((tr, i) => (
              <Bar key={tr} dataKey={tr} fill={[T.sage, T.gold, T.amber, T.red][i]} radius={[3,3,0,0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

/* ─── TAB 5: Transition Default Modelling ───────────────────────────── */
function Tab5() {
  const [selectedBorrower, setSelectedBorrower] = useState(0);
  const b = HIGH_CARBON[selectedBorrower];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {HIGH_CARBON.map((hc, i) => (
          <button key={hc.borrower} onClick={() => setSelectedBorrower(i)} style={{ padding:'10px 16px', borderRadius:8, border:`1px solid ${i===selectedBorrower ? T.navy : T.border}`, background: i===selectedBorrower ? T.navy : T.surface, color: i===selectedBorrower ? '#fff' : T.textSec, fontWeight:600, fontSize:11, cursor:'pointer', flex:1, minWidth:140 }}>
            <div>{hc.borrower}</div>
            <div style={{ fontSize:10, opacity:0.7, marginTop:3 }}>{hc.rating} · CI: {hc.ci} tCO₂e</div>
          </button>
        ))}
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        <KPI label="Credit Rating" value={b.rating} sub="Current S&P equivalent" color={b.rating.includes('CCC') ? T.red : b.rating.includes('B+') || b.rating.includes('B ') ? T.amber : T.navy} />
        <KPI label="Carbon Intensity" value={`${b.ci} tCO₂e`} sub="per $M revenue" color={b.ci > 1000 ? T.red : b.ci > 600 ? T.amber : T.sage} />
        <KPI label="Transition Score" value={`${b.transScore}/10`} sub="Business model readiness" color={b.transScore < 3 ? T.red : b.transScore < 5 ? T.amber : T.green} />
        <KPI label="Carbon Cost @ €65/t" value={`€${b.cp65}M`} sub={`€${b.cp130}M at €130/t`} color={T.amber} />
      </div>

      <Card>
        <SectionTitle>Cumulative Default Probability 2024–2035 — High-Carbon Borrowers (Composite)</SectionTitle>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={DEFAULT_TIMELINE} margin={{ left:10, right:20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize:11, fill:T.textSec }} />
            <YAxis tick={{ fontSize:10, fill:T.textSec }} unit="%" />
            <Tooltip content={<CustomTip />} />
            <Legend wrapperStyle={{ fontSize:11 }} />
            <Line type="monotone" dataKey="nz2050" name="Net Zero 2050 (Accel. Carbon Price)" stroke={T.red} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="delayed" name="Delayed Transition" stroke={T.amber} strokeWidth={2} dot={false} strokeDasharray="6 3" />
            <Line type="monotone" dataKey="currPol" name="Current Policies" stroke={T.sage} strokeWidth={2} dot={false} strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
        <Card style={{ flex:1, minWidth:280 }}>
          <SectionTitle>Regulatory Cliff Risk Events</SectionTitle>
          {CLIFF_EVENTS.map((e, i) => (
            <div key={i} style={{ display:'flex', gap:14, padding:'10px 0', borderBottom:`1px solid ${T.border}` }}>
              <div style={{ background: e.year <= 2027 ? `${T.red}22` : `${T.amber}22`, color: e.year <= 2027 ? T.red : T.amber, borderRadius:8, padding:'4px 10px', fontWeight:700, fontSize:13, minWidth:44, textAlign:'center', alignSelf:'flex-start' }}>{e.year}</div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:T.navy, lineHeight:1.4 }}>{e.event}</div>
                <div style={{ fontSize:11, color:T.textSec, marginTop:3 }}>Sectors: {e.sectors}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ flex:1, minWidth:260 }}>
          <SectionTitle>Recommended Covenant Adjustments</SectionTitle>
          {HIGH_CARBON.map(hc => (
            <div key={hc.borrower} style={{ marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${T.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontWeight:700, fontSize:12, color:T.navy }}>{hc.borrower}</span>
                <Badge text={hc.rating} color={hc.rating.includes('CCC') ? T.red : T.amber} bg={hc.rating.includes('CCC') ? '#fee2e2' : '#fef3c7'} />
              </div>
              <div style={{ fontSize:11, color:T.textSec, lineHeight:1.6 }}>
                {hc.transScore < 3 ? '• Immediate carbon strategy covenant required\n• Monthly TCFD reporting trigger\n• Carbon price hedging requirement' :
                 hc.transScore < 5 ? '• Annual carbon intensity KPI with step-down\n• Science-based target commitment by 2026\n• Green capex sweep mechanism' :
                 '• SBT verification covenant\n• ESG margin ratchet (-8bps on target achievement)\n• Annual third-party transition audit'}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/* ─── TAB 6: Sustainable Finance Structures ─────────────────────────── */
function Tab6() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        <KPI label="SLL / Green Loans" value="12 / 20" sub="60% of portfolio sustainability-linked" color={T.sage} />
        <KPI label="Avg Sustainability Premium" value="-7 bps" sub="vs conventional loans" color={T.green} />
        <KPI label="On-Track / Achieved" value="6 / 8" sub="75% SLL KPI performance" color={T.navyL} />
        <KPI label="Pipeline SLL Volume" value="$665M" sub="3 deals under negotiation" color={T.gold} />
      </div>

      <Card>
        <SectionTitle>Sustainability-Linked Loans — KPI Performance & Ratchet Structure</SectionTitle>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:T.surfaceH }}>
                {['Borrower','KPI','Base Margin','Step-Down','Step-Up','Trajectory','Status'].map(h => (
                  <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLLS.map((s, i) => (
                <tr key={s.borrower} style={{ background:i%2===0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding:'7px 10px', fontWeight:600, color:T.text, whiteSpace:'nowrap' }}>{s.borrower}</td>
                  <td style={{ padding:'7px 10px', color:T.textSec, fontSize:11 }}>{s.kpi}</td>
                  <td style={{ padding:'7px 10px', color:T.textSec }}>{s.baseMargin} bps</td>
                  <td style={{ padding:'7px 10px', color:T.green, fontWeight:700 }}>-{s.stepDown} bps</td>
                  <td style={{ padding:'7px 10px', color:T.red, fontWeight:700 }}>+{s.stepUp} bps</td>
                  <td style={{ padding:'7px 10px', color:T.navy, fontWeight:600 }}>{s.trajectory}</td>
                  <td style={{ padding:'7px 10px' }}>
                    <Badge text={s.status} color={s.status==='Achieved' ? T.green : s.status==='On-Track' ? T.navyL : T.red} bg={s.status==='Achieved' ? '#dcfce7' : s.status==='On-Track' ? '#e0e9f5' : '#fee2e2'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
        <Card style={{ flex:1, minWidth:280 }}>
          <SectionTitle>Green Loan Structures — Use of Proceeds</SectionTitle>
          {GREEN_LOANS.map(g => (
            <div key={g.borrower} style={{ padding:'12px 0', borderBottom:`1px solid ${T.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontWeight:700, fontSize:12, color:T.navy }}>{g.borrower}</span>
                <span style={{ fontWeight:700, color:T.navyL }}>${g.size}M</span>
              </div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:6 }}>{g.use}</div>
              <div style={{ display:'flex', gap:8 }}>
                <Badge text={g.standard} color={T.navy} bg={`${T.navy}15`} />
                <Badge text={g.verified ? 'Verified' : 'Pending Verification'} color={g.verified ? T.green : T.amber} bg={g.verified ? '#dcfce7' : '#fef3c7'} />
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ flex:1, minWidth:280 }}>
          <SectionTitle>New Deal Pipeline — SLL Structures Under Negotiation</SectionTitle>
          {PIPELINE.map((p, i) => (
            <div key={p.borrower} style={{ padding:'14px 0', borderBottom: i < PIPELINE.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontWeight:700, fontSize:13, color:T.navy }}>{p.borrower}</span>
                <Badge text={p.status} color={p.status==='Term Sheet' ? T.green : p.status==='Negotiation' ? T.amber : T.navyL} bg={p.status==='Term Sheet' ? '#dcfce7' : p.status==='Negotiation' ? '#fef3c7' : '#e0e9f5'} />
              </div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}><b>KPI:</b> {p.kpi}</div>
              <div style={{ display:'flex', gap:16, fontSize:11 }}>
                <span style={{ color:T.textSec }}><b>Margin:</b> {p.margin} bps</span>
                <span style={{ color:T.sage }}><b>Ratchet:</b> {p.ratchet}</span>
              </div>
            </div>
          ))}

          <div style={{ marginTop:20 }}>
            <SectionTitle>ESG Ratchet Performance League</SectionTitle>
            {SLLS.sort((a, b) => (b.status==='Achieved' ? 1 : 0) - (a.status==='Achieved' ? 1 : 0)).slice(0, 5).map((s, i) => (
              <div key={s.borrower} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:`1px solid ${T.border}` }}>
                <div>
                  <span style={{ fontSize:12, color:T.textMut, marginRight:8 }}>#{i+1}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:T.navy }}>{s.borrower}</span>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:11, color:T.textSec }}>{s.trajectory}</span>
                  <Badge text={s.status} color={s.status==='Achieved' ? T.green : s.status==='On-Track' ? T.navyL : T.red} bg={s.status==='Achieved' ? '#dcfce7' : s.status==='On-Track' ? '#e0e9f5' : '#fee2e2'} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─────────────────────────────────────────────────────── */
export default function PrivateCreditClimatePage() {
  const [activeTab, setActiveTab] = useState(0);

  const BADGE_TAGS = ['Direct Lending', '$1.7T Market', 'EBA Climate DD', 'CLO Tranche Risk', 'Transition Default'];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '24px 32px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ background: T.navy, color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>EP-AG2</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.navy }}>Private Credit Climate Risk</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {BADGE_TAGS.map(b => <Badge key={b} text={b} />)}
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <div style={{ background:`${T.red}15`, border:`1px solid ${T.red}30`, borderRadius:8, padding:'8px 14px', textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:800, color:T.red }}>$2.8bn</div>
              <div style={{ fontSize:10, color:T.textSec }}>Portfolio AUM</div>
            </div>
            <div style={{ background:`${T.amber}15`, border:`1px solid ${T.amber}30`, borderRadius:8, padding:'8px 14px', textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:800, color:T.amber }}>+32bps</div>
              <div style={{ fontSize:10, color:T.textSec }}>Climate EL Uplift</div>
            </div>
            <div style={{ background:`${T.sage}15`, border:`1px solid ${T.sage}30`, borderRadius:8, padding:'8px 14px', textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:800, color:T.sage }}>67%</div>
              <div style={{ fontSize:10, color:T.textSec }}>DD Complete</div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '12px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
                fontFamily: T.font, fontSize: 13, fontWeight: activeTab === i ? 700 : 500,
                color: activeTab === i ? T.navy : T.textSec, whiteSpace: 'nowrap',
                borderBottom: activeTab === i ? `2px solid ${T.navy}` : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px 32px' }}>
        {activeTab === 0 && <Tab1 />}
        {activeTab === 1 && <Tab2 />}
        {activeTab === 2 && <Tab3 />}
        {activeTab === 3 && <Tab4 />}
        {activeTab === 4 && <Tab5 />}
        {activeTab === 5 && <Tab6 />}
      </div>
    </div>
  );
}
