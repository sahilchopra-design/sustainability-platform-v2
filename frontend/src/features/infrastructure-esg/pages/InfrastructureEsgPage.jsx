import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

/* ================================================================= THEME */
const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7',
  border:'#e5e0d8', borderL:'#d5cfc5',
  navy:'#1b3a5c', navyL:'#2c5a8c',
  gold:'#c5a96a', goldL:'#d4be8a',
  sage:'#5a8a6a', sageL:'#7ba67d',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  card:'0 1px 4px rgba(27,58,92,0.06)',
  cardH:'0 4px 16px rgba(27,58,92,0.1)',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

/* ================================================================= HELPERS */
const fmt1 = n => Number(n).toFixed(1);
const slColor = v => v === 'Low' ? T.green : v === 'Medium' ? T.amber : T.red;
const esgColor = v => v >= 75 ? T.green : v >= 55 ? T.amber : T.red;
const psColor = v => v === 'Full' ? T.green : v === 'Partial' ? T.amber : v === 'Non-compliant' ? T.red : T.textMut;
const riskColor = v => v === 'Low' ? T.green : v === 'Medium' ? T.amber : v === 'High' ? T.red : '#7c3aed';

/* ================================================================= DATA */
const UNIVERSE = [
  // Renewable Energy (5)
  { id:1,  name:'Hornsea 3 Offshore Wind',      sector:'Renewable Energy', country:'UK',     stage:'Operating',     inv:2800, esg:88, gresb:89, ifc:94, sl:'Low'    },
  { id:2,  name:'Rajasthan Solar Park',          sector:'Renewable Energy', country:'India',  stage:'Operating',     inv:650,  esg:79, gresb:74, ifc:82, sl:'Low'    },
  { id:3,  name:'Itaipu Hydro Expansion',        sector:'Renewable Energy', country:'Brazil', stage:'Construction',  inv:1200, esg:68, gresb:null,ifc:76, sl:'Medium' },
  { id:4,  name:'Kenya Geothermal KenGen',       sector:'Renewable Energy', country:'Kenya',  stage:'Operating',     inv:420,  esg:72, gresb:70, ifc:80, sl:'Low'    },
  { id:5,  name:'Neom Battery Storage Hub',      sector:'Renewable Energy', country:'KSA',    stage:'Development',   inv:900,  esg:61, gresb:null,ifc:65, sl:'Medium' },
  // Transport (4)
  { id:6,  name:'Lima–Ica Toll Road',            sector:'Transport',        country:'Peru',   stage:'Operating',     inv:780,  esg:55, gresb:null,ifc:68, sl:'Medium' },
  { id:7,  name:'Heathrow T5 Expansion',         sector:'Transport',        country:'UK',     stage:'Development',   inv:3400, esg:49, gresb:null,ifc:58, sl:'High'   },
  { id:8,  name:'Port of Tanger Med II',         sector:'Transport',        country:'Morocco',stage:'Operating',     inv:960,  esg:66, gresb:null,ifc:72, sl:'Low'    },
  { id:9,  name:'HS2 Rail Phase 2',              sector:'Transport',        country:'UK',     stage:'Construction',  inv:5200, esg:58, gresb:null,ifc:70, sl:'Medium' },
  // Utilities (4)
  { id:10, name:'Singapore NEWater III',         sector:'Utilities',        country:'Singapore',stage:'Operating',   inv:340,  esg:84, gresb:82, ifc:91, sl:'Low'    },
  { id:11, name:'Copenhagen District Heating',   sector:'Utilities',        country:'Denmark',stage:'Operating',     inv:560,  esg:87, gresb:85, ifc:90, sl:'Low'    },
  { id:12, name:'Rural Broadband Connect UK',    sector:'Utilities',        country:'UK',     stage:'Construction',  inv:290,  esg:74, gresb:null,ifc:78, sl:'Low'    },
  { id:13, name:'Dublin Waste-to-Energy',        sector:'Utilities',        country:'Ireland',stage:'Operating',     inv:480,  esg:71, gresb:68, ifc:75, sl:'Medium' },
  // Social Infrastructure (3)
  { id:14, name:'Lagos Teaching Hospital PPP',   sector:'Social Infra',     country:'Nigeria',stage:'Operating',     inv:220,  esg:63, gresb:null,ifc:70, sl:'Low'    },
  { id:15, name:'Delhi School Build Programme',  sector:'Social Infra',     country:'India',  stage:'Construction',  inv:180,  esg:67, gresb:null,ifc:72, sl:'Low'    },
  { id:16, name:'São Paulo Affordable Housing',  sector:'Social Infra',     country:'Brazil', stage:'Operating',     inv:310,  esg:59, gresb:null,ifc:64, sl:'Medium' },
  // Digital (2)
  { id:17, name:'AMS-1 Hyperscale Data Centre',  sector:'Digital',          country:'Netherlands',stage:'Operating', inv:1100, esg:76, gresb:78, ifc:81, sl:'Low'    },
  { id:18, name:'PEACE Subsea Cable',            sector:'Digital',          country:'Multi',  stage:'Operating',     inv:620,  esg:70, gresb:null,ifc:74, sl:'Low'    },
  // Resources (2)
  { id:19, name:'Mozambique LNG Terminal',       sector:'Resources',        country:'Mozambique',stage:'Development',inv:2100, esg:42, gresb:null,ifc:55, sl:'High'   },
  { id:20, name:'Israel Desal Plant Sorek B',    sector:'Resources',        country:'Israel', stage:'Operating',     inv:380,  esg:74, gresb:72, ifc:79, sl:'Low'    },
];

const GRESB_ASSETS = UNIVERSE.filter(a => a.gresb !== null).map(a => ({
  ...a,
  mgmt: Math.round(a.gresb * 0.30),
  perf: Math.round(a.gresb * 0.70),
  pctile: a.gresb > 80 ? 85 : a.gresb > 70 ? 65 : a.gresb > 60 ? 45 : 28,
  greenStar: a.gresb > 65,
  benchmark: a.sector === 'Digital' || a.sector === 'Utilities' ? 'Asset-level' : 'Fund-level',
}));

const GRESB_TREND = [
  { year:2020, avg:62.4 },
  { year:2021, avg:65.1 },
  { year:2022, avg:67.8 },
  { year:2023, avg:70.5 },
  { year:2024, avg:72.6 },
  { year:2025, avg:74.3 },
];

const PS_STANDARDS = [
  { code:'PS1', label:'Assessment & Management of E&S Risks' },
  { code:'PS2', label:'Labour & Working Conditions' },
  { code:'PS3', label:'Resource Efficiency & Pollution Prevention' },
  { code:'PS4', label:'Community Health, Safety & Security' },
  { code:'PS5', label:'Land Acquisition & Involuntary Resettlement' },
  { code:'PS6', label:'Biodiversity Conservation' },
  { code:'PS7', label:'Indigenous Peoples' },
  { code:'PS8', label:'Cultural Heritage' },
];

const PS_COMPLIANCE = [
  { id:1,  ps1:'Full',    ps2:'Full',    ps3:'Full',    ps4:'Full',    ps5:'Full',    ps6:'Full',    ps7:'N/A',     ps8:'Full'    },
  { id:2,  ps1:'Full',    ps2:'Partial', ps3:'Full',    ps4:'Full',    ps5:'Partial', ps6:'Partial', ps7:'Partial', ps8:'Partial' },
  { id:3,  ps1:'Partial', ps2:'Full',    ps3:'Partial', ps4:'Full',    ps5:'Partial', ps6:'Partial', ps7:'Partial', ps8:'Partial' },
  { id:4,  ps1:'Full',    ps2:'Full',    ps3:'Full',    ps4:'Full',    ps5:'N/A',     ps6:'Partial', ps7:'N/A',     ps8:'Full'    },
  { id:5,  ps1:'Partial', ps2:'Partial', ps3:'Partial', ps4:'Partial', ps5:'N/A',     ps6:'Partial', ps7:'N/A',     ps8:'N/A'     },
  { id:6,  ps1:'Full',    ps2:'Full',    ps3:'Partial', ps4:'Full',    ps5:'Non-compliant', ps6:'Partial', ps7:'Partial', ps8:'Partial' },
  { id:7,  ps1:'Partial', ps2:'Full',    ps3:'Partial', ps4:'Partial', ps5:'Non-compliant', ps6:'Non-compliant', ps7:'N/A', ps8:'Partial' },
  { id:8,  ps1:'Full',    ps2:'Full',    ps3:'Full',    ps4:'Full',    ps5:'Full',    ps6:'Partial', ps7:'N/A',     ps8:'Full'    },
  { id:9,  ps1:'Full',    ps2:'Full',    ps3:'Partial', ps4:'Full',    ps5:'Partial', ps6:'Partial', ps7:'Partial', ps8:'Full'    },
  { id:10, ps1:'Full',    ps2:'Full',    ps3:'Full',    ps4:'Full',    ps5:'N/A',     ps6:'Full',    ps7:'N/A',     ps8:'N/A'     },
  { id:11, ps1:'Full',    ps2:'Full',    ps3:'Full',    ps4:'Full',    ps5:'N/A',     ps6:'Full',    ps7:'N/A',     ps8:'N/A'     },
  { id:12, ps1:'Full',    ps2:'Full',    ps3:'Full',    ps4:'Full',    ps5:'N/A',     ps6:'Partial', ps7:'N/A',     ps8:'N/A'     },
  { id:13, ps1:'Full',    ps2:'Full',    ps3:'Partial', ps4:'Full',    ps5:'N/A',     ps6:'Partial', ps7:'N/A',     ps8:'N/A'     },
  { id:14, ps1:'Full',    ps2:'Partial', ps3:'Full',    ps4:'Full',    ps5:'N/A',     ps6:'N/A',     ps7:'N/A',     ps8:'Partial' },
  { id:15, ps1:'Full',    ps2:'Partial', ps3:'Full',    ps4:'Full',    ps5:'Partial', ps6:'N/A',     ps7:'N/A',     ps8:'Partial' },
  { id:16, ps1:'Partial', ps2:'Full',    ps3:'Partial', ps4:'Full',    ps5:'Partial', ps6:'N/A',     ps7:'N/A',     ps8:'N/A'     },
  { id:17, ps1:'Full',    ps2:'Full',    ps3:'Partial', ps4:'Full',    ps5:'N/A',     ps6:'N/A',     ps7:'N/A',     ps8:'N/A'     },
  { id:18, ps1:'Full',    ps2:'Full',    ps3:'Full',    ps4:'Partial', ps5:'N/A',     ps6:'Partial', ps7:'N/A',     ps8:'N/A'     },
  { id:19, ps1:'Partial', ps2:'Partial', ps3:'Partial', ps4:'Partial', ps5:'Non-compliant', ps6:'Non-compliant', ps7:'Non-compliant', ps8:'Partial' },
  { id:20, ps1:'Full',    ps2:'Full',    ps3:'Full',    ps4:'Full',    ps5:'N/A',     ps6:'Partial', ps7:'N/A',     ps8:'N/A'     },
];

const PS_AGG = [
  { ps:'PS1', pct:87, label:'Assessment & Mgmt' },
  { ps:'PS2', pct:91, label:'Labour Conditions' },
  { ps:'PS3', pct:80, label:'Resource Efficiency' },
  { ps:'PS4', pct:89, label:'Community H&S' },
  { ps:'PS5', pct:78, label:'Land Acquisition' },
  { ps:'PS6', pct:74, label:'Biodiversity' },
  { ps:'PS7', pct:79, label:'Indigenous Peoples' },
  { ps:'PS8', pct:83, label:'Cultural Heritage' },
];

const SL_ASSETS = UNIVERSE.map(a => ({
  ...a,
  community: Math.round(a.esg * 0.9 + (a.sl==='Low'?10:a.sl==='Medium'?0:-10)),
  regulatory: Math.round(a.esg * 0.85 + 5),
  ngo:        Math.round(a.esg * 0.8  + (a.sl==='High'?-15:5)),
  indigenous: Math.round(a.esg * 0.88 + (a.sl==='Low'?8:0)),
  jobs:       Math.round(a.esg * 0.92 + 3),
  envTrust:   Math.round(a.esg * 0.87 + (a.sl==='High'?-10:5)),
}));

const SL_TREND = [
  { q:'Q1 2023', avg:58 },
  { q:'Q2 2023', avg:60 },
  { q:'Q3 2023', avg:61 },
  { q:'Q4 2023', avg:59 },
  { q:'Q1 2024', avg:63 },
  { q:'Q2 2024', avg:65 },
  { q:'Q3 2024', avg:67 },
  { q:'Q4 2024', avg:68 },
  { q:'Q1 2025', avg:70 },
];

const SL_CASES = [
  {
    name:'Lima–Ica Toll Road',
    country:'Peru',
    current:'Medium',
    prev:'High',
    summary:'Community opposition to land acquisition along 320 km corridor. Engagement programme with 14 district councils reduced risk from High to Medium. Compensation framework now aligned to IFC PS5. 3 legal challenges outstanding.',
    indicators:['Media: 42 mentions/month (down from 118)','Protests: 1 in past 6 months (down from 9)','Legal: 3 challenges pending'],
  },
  {
    name:'Heathrow T5 Expansion',
    country:'UK',
    current:'High',
    prev:'High',
    summary:'Noise pollution disputes across 12 communities. Judicial review pending (Court of Appeal, hearing set Q3 2025). NGO coalition of 8 groups actively campaigning. Night-flight restrictions contested. Environmental statement challenged on biodiversity net-gain methodology.',
    indicators:['Media: 280 mentions/month','Protests: 6 events in past 6 months','Legal: Judicial review active'],
  },
  {
    name:'Rajasthan Solar Park',
    country:'India',
    current:'Low',
    prev:'Low',
    summary:'Strong community relations. 400 direct construction jobs created; 68% local content ratio. Community revenue sharing: INR 12Cr/year to 8 villages. Land leased (not acquired) from farmers at premium rates. Model for ESG integration from feasibility stage.',
    indicators:['Media: 12 positive mentions/month','Protests: 0','Legal: 0 challenges'],
  },
];

const CLIMATE_ASSETS = UNIVERSE.map((a, i) => {
  const coastal = ['Port of Tanger Med II','PEACE Subsea Cable','Israel Desal Plant Sorek B','Mozambique LNG Terminal'].includes(a.name);
  const southAsia = a.country === 'India' || a.country === 'KSA' || a.country === 'Singapore';
  const floodProne = a.name.includes('Toll Road') || a.name.includes('HS2');
  return {
    ...a,
    flood245_2030:  coastal ? 'Medium' : floodProne ? 'High' : 'Low',
    flood245_2050:  coastal ? 'High'   : floodProne ? 'High' : 'Low',
    flood585_2050:  coastal ? 'High'   : floodProne ? 'Very High' : 'Medium',
    heat245_2030:   southAsia ? 'High'  : 'Low',
    heat245_2050:   southAsia ? 'High'  : 'Medium',
    heat585_2050:   southAsia ? 'Very High' : 'Medium',
    slr245_2050:    coastal ? 'Medium' : 'N/A',
    slr585_2050:    coastal ? 'High'   : 'N/A',
    climateCapex:   coastal ? 15 : floodProne ? 22 : southAsia ? 8 : 3,
  };
});

const GF_PROJECTS = [
  { id:'GF1',  name:'Morocco Green H2 Hub',      sector:'Energy',       country:'Morocco',    stage:'Feasibility',      esgRisk:'Medium', expGresb:72, ifcGaps:4, eiaStatus:'Scoping' },
  { id:'GF2',  name:'Tanzania Transmission Grid', sector:'Utilities',    country:'Tanzania',   stage:'ESIA',             esgRisk:'High',   expGresb:65, ifcGaps:7, eiaStatus:'Draft EIS' },
  { id:'GF3',  name:'Colombia Wind Corridor',     sector:'Renewable',    country:'Colombia',   stage:'ESIA',             esgRisk:'Medium', expGresb:75, ifcGaps:3, eiaStatus:'Community consult' },
  { id:'GF4',  name:'Vietnam Solar Cluster',      sector:'Renewable',    country:'Vietnam',    stage:'Financial Close',  esgRisk:'Low',    expGresb:78, ifcGaps:2, eiaStatus:'Approved' },
  { id:'GF5',  name:'Turkey Geothermal IPP',      sector:'Renewable',    country:'Turkey',     stage:'Construction',     esgRisk:'Medium', expGresb:70, ifcGaps:3, eiaStatus:'Approved' },
  { id:'GF6',  name:'Pakistan Hydro Diamer',      sector:'Renewable',    country:'Pakistan',   stage:'Construction',     esgRisk:'High',   expGresb:60, ifcGaps:8, eiaStatus:'Partial' },
  { id:'GF7',  name:'Ghana Hospital Concession',  sector:'Social Infra', country:'Ghana',      stage:'Feasibility',      esgRisk:'Low',    expGresb:null,ifcGaps:2, eiaStatus:'N/A' },
  { id:'GF8',  name:'Egypt Data Centre Park',     sector:'Digital',      country:'Egypt',      stage:'ESIA',             esgRisk:'Low',    expGresb:74, ifcGaps:3, eiaStatus:'Scoping' },
  { id:'GF9',  name:'Brazil Toll Ring Road',      sector:'Transport',    country:'Brazil',     stage:'Financial Close',  esgRisk:'High',   expGresb:62, ifcGaps:6, eiaStatus:'Approved' },
  { id:'GF10', name:'India Smart Metering',       sector:'Utilities',    country:'India',      stage:'Construction',     esgRisk:'Low',    expGresb:77, ifcGaps:2, eiaStatus:'Approved' },
];

const ESG_DIST_DATA = [
  { range:'<50',    greenfield:1, brownfield:0 },
  { range:'50–59',  greenfield:3, brownfield:2 },
  { range:'60–69',  greenfield:4, brownfield:4 },
  { range:'70–79',  greenfield:2, brownfield:7 },
  { range:'80–89',  greenfield:0, brownfield:5 },
  { range:'90+',    greenfield:0, brownfield:2 },
];

const ESG_STAGE_COST = [
  { stage:'Feasibility', cost:0.5,  label:'$0.5M' },
  { stage:'Construction',cost:5,    label:'$5M'   },
  { stage:'Operations',  cost:25,   label:'$25M+' },
];

/* ================================================================= SHARED COMPONENTS */
const Badge = ({ children, color }) => (
  <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600,
    background: color === 'green' ? '#dcfce7' : color === 'amber' ? '#fef3c7' : color === 'red' ? '#fee2e2' : '#e0e7ff',
    color: color === 'green' ? T.green : color === 'amber' ? T.amber : color === 'red' ? T.red : '#6366f1' }}>
    {children}
  </span>
);

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'16px 20px',
    boxShadow:T.card, flex:'1 1 180px', minWidth:160 }}>
    <div style={{ fontSize:11, color:T.textMut, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:26, fontWeight:700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>{sub}</div>}
  </div>
);

const SectionHead = ({ title, sub }) => (
  <div style={{ marginBottom:20 }}>
    <div style={{ fontSize:16, fontWeight:700, color:T.navy }}>{title}</div>
    {sub && <div style={{ fontSize:12, color:T.textSec, marginTop:2 }}>{sub}</div>}
  </div>
);

const TABS = [
  'Infrastructure Universe',
  'GRESB Assessment',
  'IFC Performance Standards',
  'Social Licence to Operate',
  'Climate Resilience',
  'Greenfield vs Brownfield',
];

/* ================================================================= TAB 1 */
function Tab1() {
  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
        <KpiCard label="Portfolio Avg ESG Score" value="71.3" sub="Across 20 assets" color={T.sage} />
        <KpiCard label="Global Infra Investment Gap" value="$15T" sub="Through 2040 — GI Hub" color={T.navy} />
        <KpiCard label="Assets with GRESB Rating" value="65%" sub="13 of 20 assets" color={T.navyL} />
        <KpiCard label="Social Licence Risk" value="3 of 20" sub="High risk assets" color={T.red} />
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:T.surfaceH }}>
              {['Asset','Sector','Country','Stage','Inv ($M)','ESG','GRESB','IFC PS','SL Risk'].map(h => (
                <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {UNIVERSE.map((a, i) => (
              <tr key={a.id} style={{ background: i%2===0 ? T.surface : T.bg, borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'7px 10px', fontWeight:600, color:T.navy }}>{a.name}</td>
                <td style={{ padding:'7px 10px', color:T.textSec }}>{a.sector}</td>
                <td style={{ padding:'7px 10px', color:T.textSec }}>{a.country}</td>
                <td style={{ padding:'7px 10px' }}>
                  <Badge color={a.stage==='Operating'?'green':a.stage==='Construction'?'amber':''}>{a.stage}</Badge>
                </td>
                <td style={{ padding:'7px 10px', color:T.text }}>{a.inv.toLocaleString()}</td>
                <td style={{ padding:'7px 10px', fontWeight:700, color:esgColor(a.esg) }}>{a.esg}</td>
                <td style={{ padding:'7px 10px', color:a.gresb ? esgColor(a.gresb) : T.textMut }}>{a.gresb ?? '—'}</td>
                <td style={{ padding:'7px 10px', color:esgColor(a.ifc) }}>{a.ifc}</td>
                <td style={{ padding:'7px 10px' }}>
                  <Badge color={a.sl==='Low'?'green':a.sl==='Medium'?'amber':'red'}>{a.sl}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================= TAB 2 */
function Tab2() {
  return (
    <div>
      <SectionHead title="GRESB Infrastructure Assessment" sub="GRESB 100-point framework: Management (30pts) + Performance (70pts). Scored assets only." />
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
        <KpiCard label="Top Performer" value="89/100" sub="Hornsea 3 Offshore Wind" color={T.green} />
        <KpiCard label="Bottom Performer" value="42/100" sub="Dublin Waste-to-Energy" color={T.red} />
        <KpiCard label="Avg YoY Improvement" value="+4.2 pts" sub="Per year portfolio average" color={T.sage} />
        <KpiCard label="Green Star Status" value={`${GRESB_ASSETS.filter(a=>a.greenStar).length} assets`} sub=">50th pctile Mgmt + Perf" color={T.gold} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, boxShadow:T.card }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>GRESB Score by Asset</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={GRESB_ASSETS} layout="vertical" margin={{ left:10, right:10, top:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={T.border} />
              <XAxis type="number" domain={[0,100]} tick={{ fontSize:10, fill:T.textMut }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize:9, fill:T.textSec }} width={130} />
              <Tooltip formatter={(v, n) => [v, n==='mgmt'?'Management':'Performance']} contentStyle={{ fontSize:11 }} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey="mgmt" name="Management" stackId="a" fill={T.navyL} />
              <Bar dataKey="perf" name="Performance" stackId="a" fill={T.sage} radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, boxShadow:T.card }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>Portfolio GRESB Trend (2020–2025)</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={GRESB_TREND} margin={{ left:0, right:10, top:4, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize:10, fill:T.textMut }} />
              <YAxis domain={[55,80]} tick={{ fontSize:10, fill:T.textMut }} />
              <Tooltip contentStyle={{ fontSize:11 }} />
              <Line type="monotone" dataKey="avg" stroke={T.sage} strokeWidth={2.5} dot={{ r:4, fill:T.sage }} name="Avg GRESB" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:T.surfaceH }}>
              {['Asset','Mgmt (30)','Perf (70)','Total','Percentile','Benchmark','Green Star'].map(h => (
                <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GRESB_ASSETS.map((a, i) => (
              <tr key={a.id} style={{ background: i%2===0 ? T.surface : T.bg, borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'7px 10px', fontWeight:600, color:T.navy }}>{a.name}</td>
                <td style={{ padding:'7px 10px', color:T.navyL }}>{a.mgmt}</td>
                <td style={{ padding:'7px 10px', color:T.sage }}>{a.perf}</td>
                <td style={{ padding:'7px 10px', fontWeight:700, color:esgColor(a.gresb) }}>{a.gresb}</td>
                <td style={{ padding:'7px 10px', color:T.textSec }}>{a.pctile}th</td>
                <td style={{ padding:'7px 10px', color:T.textSec }}>{a.benchmark}</td>
                <td style={{ padding:'7px 10px' }}>
                  {a.greenStar ? <Badge color="green">Green Star</Badge> : <span style={{ color:T.textMut }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================= TAB 3 */
function Tab3() {
  const psKeys = ['ps1','ps2','ps3','ps4','ps5','ps6','ps7','ps8'];
  const showAssets = UNIVERSE.slice(0, 10);
  const showCompliance = PS_COMPLIANCE.slice(0, 10);

  return (
    <div>
      <SectionHead title="IFC Performance Standards 1–8 Compliance" sub="Assessed across 20 infrastructure assets. Heat map shows 10 assets for readability; aggregate across all 20 below." />
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10 }}>Aggregate Compliance Rate by Performance Standard</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={PS_AGG} margin={{ left:0, right:10, top:4, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="ps" tick={{ fontSize:10, fill:T.textMut }} />
            <YAxis domain={[0,100]} tick={{ fontSize:10, fill:T.textMut }} />
            <Tooltip formatter={(v, n, p) => [`${v}%`, p.payload.label]} contentStyle={{ fontSize:11 }} />
            <Bar dataKey="pct" name="Compliance %" radius={[3,3,0,0]}>
              {PS_AGG.map((d, i) => <Cell key={i} fill={d.pct>=85?T.green:d.pct>=78?T.amber:T.red} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop:6, fontSize:11, color:T.textSec }}>
          Lowest: PS6 Biodiversity (74%) — Highest: PS2 Labour Conditions (91%). Non-compliance flags: Mozambique LNG (PS5, PS6, PS7), Heathrow Expansion (PS5, PS6), Lima Toll Road (PS5).
        </div>
      </div>
      <div style={{ overflowX:'auto', marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8 }}>Heat Map — First 10 Assets (All 8 PS Standards)</div>
        <table style={{ borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr style={{ background:T.surfaceH }}>
              <th style={{ padding:'6px 10px', textAlign:'left', color:T.textSec, borderBottom:`1px solid ${T.border}`, minWidth:160, fontWeight:600 }}>Asset</th>
              {PS_STANDARDS.map(ps => (
                <th key={ps.code} style={{ padding:'6px 8px', textAlign:'center', color:T.textSec, borderBottom:`1px solid ${T.border}`, fontWeight:600, whiteSpace:'nowrap' }} title={ps.label}>{ps.code}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showAssets.map((a, i) => {
              const comp = showCompliance[i];
              return (
                <tr key={a.id} style={{ background: i%2===0 ? T.surface : T.bg }}>
                  <td style={{ padding:'6px 10px', fontWeight:600, color:T.navy, borderBottom:`1px solid ${T.border}` }}>{a.name}</td>
                  {psKeys.map(k => {
                    const v = comp[k];
                    const bg = v==='Full'?'#dcfce7':v==='Partial'?'#fef3c7':v==='Non-compliant'?'#fee2e2':'#f3f4f6';
                    const fc = psColor(v);
                    return (
                      <td key={k} style={{ padding:'6px 8px', textAlign:'center', borderBottom:`1px solid ${T.border}`, background:bg }}>
                        <span style={{ fontSize:10, fontWeight:700, color:fc }}>
                          {v==='Full'?'F':v==='Partial'?'P':v==='Non-compliant'?'NC':'N/A'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ marginTop:8, display:'flex', gap:16, fontSize:11, color:T.textSec }}>
          {[['F','Full','#dcfce7',T.green],['P','Partial','#fef3c7',T.amber],['NC','Non-compliant','#fee2e2',T.red],['N/A','Not Applicable','#f3f4f6',T.textMut]].map(([code,label,bg,fc]) => (
            <span key={code} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ display:'inline-block', width:20, height:16, background:bg, borderRadius:2, textAlign:'center', fontSize:10, fontWeight:700, color:fc, lineHeight:'16px' }}>{code}</span>
              {label}
            </span>
          ))}
        </div>
      </div>
      <div style={{ background:'#fff7ed', border:`1px solid #fed7aa`, borderRadius:8, padding:14 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.amber, marginBottom:8 }}>Critical Non-Compliance Flags — Remediation Required</div>
        {[
          { asset:'Mozambique LNG Terminal', issues:'PS5 (land displacement — 840 HH), PS6 (mangrove impact), PS7 (Makonde community engagement)', deadline:'Q4 2025', cost:'$12M' },
          { asset:'Heathrow T5 Expansion', issues:'PS5 (CPO compensation disputes), PS6 (ancient woodland — no net loss not demonstrated)', deadline:'Q2 2026', cost:'$8M' },
          { asset:'Lima–Ica Toll Road', issues:'PS5 (land acquisition — 3 communities not yet settled)', deadline:'Q3 2025', cost:'$3.5M' },
        ].map(f => (
          <div key={f.asset} style={{ marginBottom:10, padding:10, background:T.surface, borderRadius:6, border:`1px solid ${T.border}` }}>
            <div style={{ fontWeight:700, color:T.navy, fontSize:12 }}>{f.asset}</div>
            <div style={{ color:T.textSec, fontSize:11, margin:'3px 0' }}>{f.issues}</div>
            <div style={{ display:'flex', gap:20, fontSize:11 }}>
              <span style={{ color:T.amber }}>Deadline: {f.deadline}</span>
              <span style={{ color:T.red }}>Est. cost: {f.cost}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================= TAB 4 */
function Tab4() {
  const [selected, setSelected] = useState(null);
  const dims = ['community','regulatory','ngo','indigenous','jobs','envTrust'];
  const dimLabels = ['Community Acceptance','Regulatory Relations','NGO & Media','Indigenous Engagement','Jobs & Econ Benefit','Environmental Trust'];

  const radarData = selected
    ? dims.map((d, i) => ({ subject:dimLabels[i], score:SL_ASSETS.find(a=>a.id===selected)?.[d] ?? 0 }))
    : null;

  return (
    <div>
      <SectionHead title="Social Licence to Operate Assessment" sub="6 dimensions scored 0–100. Click any asset to see radar breakdown." />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        <div>
          <div style={{ overflowX:'auto', maxHeight:360, overflowY:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead style={{ position:'sticky', top:0, background:T.surfaceH }}>
                <tr>
                  {['Asset','SL Risk','Community','Regulatory','NGO'].map(h => (
                    <th key={h} style={{ padding:'7px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SL_ASSETS.map((a, i) => (
                  <tr key={a.id}
                    onClick={() => setSelected(selected===a.id ? null : a.id)}
                    style={{ background: selected===a.id ? '#eff6ff' : i%2===0 ? T.surface : T.bg, cursor:'pointer', borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:'6px 10px', fontWeight:600, color:T.navy, fontSize:11 }}>{a.name}</td>
                    <td style={{ padding:'6px 10px' }}><Badge color={a.sl==='Low'?'green':a.sl==='Medium'?'amber':'red'}>{a.sl}</Badge></td>
                    <td style={{ padding:'6px 10px', color:esgColor(a.community) }}>{a.community}</td>
                    <td style={{ padding:'6px 10px', color:esgColor(a.regulatory) }}>{a.regulatory}</td>
                    <td style={{ padding:'6px 10px', color:esgColor(a.ngo) }}>{a.ngo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, boxShadow:T.card }}>
          {radarData ? (
            <>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8 }}>
                {SL_ASSETS.find(a=>a.id===selected)?.name}
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize:9, fill:T.textSec }} />
                  <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fontSize:8, fill:T.textMut }} />
                  <Radar name="Score" dataKey="score" stroke={T.navyL} fill={T.navyL} fillOpacity={0.3} />
                  <Tooltip contentStyle={{ fontSize:11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div style={{ height:260, display:'flex', alignItems:'center', justifyContent:'center', color:T.textMut, fontSize:13 }}>
              Select an asset to view radar breakdown
            </div>
          )}
        </div>
      </div>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, boxShadow:T.card, marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>Portfolio Social Licence Risk Trend</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={SL_TREND} margin={{ left:0, right:10, top:4, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="q" tick={{ fontSize:9, fill:T.textMut }} />
            <YAxis domain={[50,80]} tick={{ fontSize:10, fill:T.textMut }} />
            <Tooltip contentStyle={{ fontSize:11 }} />
            <Line type="monotone" dataKey="avg" stroke={T.sage} strokeWidth={2.5} dot={{ r:3 }} name="Avg SL Score" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>Case Studies</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
        {SL_CASES.map(c => (
          <div key={c.name} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:14, boxShadow:T.card }}>
            <div style={{ fontWeight:700, color:T.navy, fontSize:13 }}>{c.name}</div>
            <div style={{ color:T.textMut, fontSize:11, marginBottom:8 }}>{c.country}</div>
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              <Badge color={c.prev==='High'?'red':c.prev==='Medium'?'amber':'green'}>Was: {c.prev}</Badge>
              <span style={{ fontSize:12, color:T.textMut }}>→</span>
              <Badge color={c.current==='High'?'red':c.current==='Medium'?'amber':'green'}>Now: {c.current}</Badge>
            </div>
            <div style={{ fontSize:11, color:T.textSec, lineHeight:'1.5', marginBottom:10 }}>{c.summary}</div>
            <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:8 }}>
              <div style={{ fontSize:10, fontWeight:700, color:T.textMut, marginBottom:4 }}>EARLY WARNING INDICATORS</div>
              {c.indicators.map((ind, i) => (
                <div key={i} style={{ fontSize:10, color:T.textSec, marginBottom:2 }}>• {ind}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================= TAB 5 */
function Tab5() {
  const scenarios = [
    { key:'flood245_2030', label:'Flood SSP2 2030' },
    { key:'flood245_2050', label:'Flood SSP2 2050' },
    { key:'flood585_2050', label:'Flood SSP5 2050' },
    { key:'heat245_2030',  label:'Heat SSP2 2030' },
    { key:'heat245_2050',  label:'Heat SSP2 2050' },
    { key:'heat585_2050',  label:'Heat SSP5 2050' },
    { key:'slr245_2050',   label:'SLR SSP2 2050' },
    { key:'slr585_2050',   label:'SLR SSP5 2050' },
  ];

  return (
    <div>
      <SectionHead title="Physical Climate Risk Assessment" sub="SSP2-4.5 and SSP5-8.5 scenarios, 2030 and 2050 horizons. TCFD-aligned." />
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
        <KpiCard label="Climate CAPEX Required" value="$180M" sub="Over 10 years, portfolio" color={T.amber} />
        <KpiCard label="IRR Impact (Resilience)" value="+35bps" sub="Risk-adjusted IRR from avoided losses" color={T.green} />
        <KpiCard label="Coastal SLR Exposure" value="3 assets" sub="Significant risk by 2050 (SSP5)" color={T.red} />
        <KpiCard label="Heat-Stressed Assets" value="2 assets" sub="South Asia solar efficiency risk" color={T.amber} />
      </div>
      <div style={{ overflowX:'auto', marginBottom:20 }}>
        <table style={{ borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr style={{ background:T.surfaceH }}>
              <th style={{ padding:'7px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, minWidth:160 }}>Asset</th>
              <th style={{ padding:'7px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>Country</th>
              {scenarios.map(s => (
                <th key={s.key} style={{ padding:'7px 8px', textAlign:'center', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap', fontSize:10 }}>{s.label}</th>
              ))}
              <th style={{ padding:'7px 10px', textAlign:'center', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>CAPEX $M</th>
            </tr>
          </thead>
          <tbody>
            {CLIMATE_ASSETS.map((a, i) => (
              <tr key={a.id} style={{ background: i%2===0 ? T.surface : T.bg, borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'6px 10px', fontWeight:600, color:T.navy }}>{a.name}</td>
                <td style={{ padding:'6px 10px', color:T.textSec }}>{a.country}</td>
                {scenarios.map(s => {
                  const v = a[s.key];
                  const bg = v==='Very High'?'#fee2e2':v==='High'?'#fef3c7':v==='Medium'?'#fef9c3':v==='Low'?'#dcfce7':'#f3f4f6';
                  const fc = v==='Very High'?T.red:v==='High'?T.amber:v==='Medium'?'#ca8a04':v==='Low'?T.green:T.textMut;
                  return (
                    <td key={s.key} style={{ padding:'6px 8px', textAlign:'center', background:bg }}>
                      <span style={{ fontSize:10, fontWeight:700, color:fc }}>{v==='N/A'?'—':v}</span>
                    </td>
                  );
                })}
                <td style={{ padding:'6px 10px', textAlign:'center', fontWeight:700, color:a.climateCapex>15?T.red:a.climateCapex>8?T.amber:T.textSec }}>{a.climateCapex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ background:'#eff6ff', border:`1px solid #bfdbfe`, borderRadius:8, padding:14 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.navyL, marginBottom:8 }}>Key Climate Risk Findings</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, fontSize:12, color:T.textSec }}>
          <div>• <b>Coastal ports (3 assets):</b> Significant sea level rise exposure by 2050 under SSP5-8.5. Adaptive investment required: berth elevation, storm surge barriers, drainage upgrades.</div>
          <div>• <b>South Asia solar (2 assets):</b> Heat-related efficiency losses of 8–12% projected by 2050 due to operating days exceeding panel temperature thresholds.</div>
          <div>• <b>Flood-prone toll road (Peru):</b> Return period EAL increases from 1:100 to 1:25 by 2050 under SSP5. Road closures cost $18M/year at current exposure.</div>
          <div>• <b>Portfolio resilience investment:</b> $180M CAPEX over 10 years generates +35bps risk-adjusted IRR through avoided downtime losses and lower insurance premiums.</div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================= TAB 6 */
function Tab6() {
  return (
    <div>
      <SectionHead title="Greenfield vs Brownfield ESG Analysis" sub="ESG risk profile, value creation opportunities, and remediation cost escalation by entry stage." />
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
        <KpiCard label="Feasibility ESG Cost" value="$0.5M" sub="Embed ESG at conception" color={T.green} />
        <KpiCard label="Construction ESG Cost" value="$5M" sub="10x cost escalation" color={T.amber} />
        <KpiCard label="Operations ESG Cost" value="$25M+" sub="50x cost vs feasibility (EBRD)" color={T.red} />
        <KpiCard label="Greenfield Pipeline" value="10 projects" sub="$9.5B total investment" color={T.navy} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, boxShadow:T.card }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>ESG Score Distribution: Greenfield vs Brownfield</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ESG_DIST_DATA} margin={{ left:0, right:10, top:4, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="range" tick={{ fontSize:10, fill:T.textMut }} />
              <YAxis tick={{ fontSize:10, fill:T.textMut }} />
              <Tooltip contentStyle={{ fontSize:11 }} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey="greenfield" name="Greenfield" fill={T.navyL} radius={[3,3,0,0]} />
              <Bar dataKey="brownfield" name="Brownfield" fill={T.sage} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, boxShadow:T.card }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>ESG Remediation Cost by Entry Stage (EBRD Data)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ESG_STAGE_COST} margin={{ left:0, right:10, top:4, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="stage" tick={{ fontSize:11, fill:T.textMut }} />
              <YAxis tick={{ fontSize:10, fill:T.textMut }} unit="M" />
              <Tooltip formatter={v => [`$${v}M`, 'Avg Remediation Cost']} contentStyle={{ fontSize:11 }} />
              <Bar dataKey="cost" name="Remediation Cost ($M)" radius={[4,4,0,0]}>
                {ESG_STAGE_COST.map((_, i) => <Cell key={i} fill={i===0?T.green:i===1?T.amber:T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10 }}>Greenfield Pipeline — ESG Risk & GRESB Readiness</div>
      <div style={{ overflowX:'auto', marginBottom:20 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:T.surfaceH }}>
              {['Project','Sector','Country','Stage','ESG Risk','Exp. GRESB','IFC Gaps','EIA Status'].map(h => (
                <th key={h} style={{ padding:'7px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GF_PROJECTS.map((p, i) => (
              <tr key={p.id} style={{ background: i%2===0 ? T.surface : T.bg, borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'7px 10px', fontWeight:600, color:T.navy }}>{p.name}</td>
                <td style={{ padding:'7px 10px', color:T.textSec }}>{p.sector}</td>
                <td style={{ padding:'7px 10px', color:T.textSec }}>{p.country}</td>
                <td style={{ padding:'7px 10px' }}>
                  <Badge color={p.stage==='Financial Close'||p.stage==='Construction'?'amber':p.stage==='ESIA'?'':''}>
                    {p.stage}
                  </Badge>
                </td>
                <td style={{ padding:'7px 10px' }}>
                  <Badge color={p.esgRisk==='Low'?'green':p.esgRisk==='Medium'?'amber':'red'}>{p.esgRisk}</Badge>
                </td>
                <td style={{ padding:'7px 10px', color:p.expGresb ? esgColor(p.expGresb) : T.textMut }}>{p.expGresb ?? '—'}</td>
                <td style={{ padding:'7px 10px', fontWeight:700, color:p.ifcGaps>=6?T.red:p.ifcGaps>=4?T.amber:T.green }}>{p.ifcGaps}</td>
                <td style={{ padding:'7px 10px', color:T.textSec }}>{p.eiaStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ background:'#f0fdf4', border:`1px solid #bbf7d0`, borderRadius:8, padding:14 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.sage, marginBottom:8 }}>ESG Value Creation at Entry — Framework</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, fontSize:12, color:T.textSec }}>
          <div style={{ background:T.surface, borderRadius:6, padding:12, border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.green, marginBottom:4 }}>Feasibility Stage</div>
            <div style={{ fontWeight:700, fontSize:16, color:T.green, marginBottom:4 }}>$0.5M</div>
            <div>Embed IFC PS requirements in project design. Community engagement plan from day one. ESIA integrated with engineering. ESG-linked financing terms locked. Lowest remediation cost and highest value creation opportunity.</div>
          </div>
          <div style={{ background:T.surface, borderRadius:6, padding:12, border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.amber, marginBottom:4 }}>Construction Stage</div>
            <div style={{ fontWeight:700, fontSize:16, color:T.amber, marginBottom:4 }}>$5M</div>
            <div>Design changes costly once construction commences. Community opposition harder to manage. Contractor ESG compliance monitoring adds cost. Biodiversity mitigation retroactively expensive. 10x cost vs feasibility entry (EBRD benchmark).</div>
          </div>
          <div style={{ background:T.surface, borderRadius:6, padding:12, border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.red, marginBottom:4 }}>Operations Stage</div>
            <div style={{ fontWeight:700, fontSize:16, color:T.red, marginBottom:4 }}>$25M+</div>
            <div>Legacy ESG issues require full remediation programmes. Social licence disputes may require asset modifications. GRESB score improvement requires capital investment in E&S systems. Regulatory fines and community litigation possible. 50x cost vs feasibility entry.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================= MAIN PAGE */
export default function InfrastructureEsgPage() {
  const [tab, setTab] = useState(0);

  const BADGES = ['GRESB Infra','IFC PS 1-8','Social Licence','$15T Gap','Greenfield vs Brownfield'];

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:8 }}>
          <div style={{ fontSize:22, fontWeight:800, color:T.navy }}>Infrastructure ESG Rating</div>
          <span style={{ fontSize:11, fontWeight:600, color:T.textMut, background:T.surfaceH, border:`1px solid ${T.border}`,
            borderRadius:4, padding:'2px 8px' }}>EP-AG3</span>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {BADGES.map(b => (
            <span key={b} style={{ fontSize:11, fontWeight:600, color:T.navyL, background:'#eff6ff',
              border:'1px solid #bfdbfe', borderRadius:4, padding:'2px 8px' }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display:'flex', gap:0, borderBottom:`2px solid ${T.border}`, marginBottom:24, overflowX:'auto' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding:'10px 18px', border:'none', background:'none', cursor:'pointer',
            fontSize:13, fontWeight:tab===i?700:500,
            color: tab===i ? T.navy : T.textSec,
            borderBottom: tab===i ? `3px solid ${T.gold}` : '3px solid transparent',
            marginBottom:-2, whiteSpace:'nowrap', transition:'color 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div>
        {tab === 0 && <Tab1 />}
        {tab === 1 && <Tab2 />}
        {tab === 2 && <Tab3 />}
        {tab === 3 && <Tab4 />}
        {tab === 4 && <Tab5 />}
        {tab === 5 && <Tab6 />}
      </div>
    </div>
  );
}
