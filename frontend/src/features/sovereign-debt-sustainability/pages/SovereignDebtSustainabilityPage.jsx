import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell, Legend,
} from 'recharts';

/* ── Theme ─────────────────────────────────────────────────────────────────── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ── Constants ─────────────────────────────────────────────────────────────── */
const TABS = ['Debt Trajectory','Fiscal Climate Costs','Vulnerability Ranking','Investment Implications'];
const YEARS = [2024,2025,2026,2027,2028,2029,2030,2032,2035,2038,2040,2045,2050];
const SHORT_YEARS = [2024,2030,2035,2040,2045,2050];
const SCENARIOS = [
  { key:'baseline', label:'Baseline (No Climate)', color:T.navyL, dash:'' },
  { key:'orderly', label:'Orderly Transition', color:T.green, dash:'' },
  { key:'disorderly', label:'Disorderly Transition', color:T.amber, dash:'5 5' },
  { key:'hothouse', label:'Hot House World', color:T.red, dash:'3 3' },
];

const REGIONS = ['All','G20','EU','SIDS','LDC','EMDE','Frontier','Advanced'];
const COST_TYPES = ['Adaptation','Mitigation','Disaster Loss','Health','Stranded Assets'];
const VULN_DIMS = ['Debt Level','Climate Exposure','Fiscal Space','Institutional Capacity','External Support'];
const COST_COLORS = [T.sage, T.navyL, T.red, T.amber, T.gold];

/* ── 60 Countries with seed-driven data ────────────────────────────────────── */
const COUNTRIES_RAW = [
  {id:'US',name:'United States',region:'G20',group:'Advanced',gdpT:25.5,pop:331,debtGdp:122,rating:'AA+',fiscalBal:-5.8,co2Mt:5007},
  {id:'CN',name:'China',region:'G20',group:'EMDE',gdpT:18.3,pop:1412,debtGdp:77,rating:'A+',fiscalBal:-7.1,co2Mt:11472},
  {id:'JP',name:'Japan',region:'G20',group:'Advanced',gdpT:4.2,pop:125,debtGdp:254,rating:'A+',fiscalBal:-6.3,co2Mt:1067},
  {id:'DE',name:'Germany',region:'EU',group:'Advanced',gdpT:4.1,pop:84,debtGdp:64,rating:'AAA',fiscalBal:-2.1,co2Mt:675},
  {id:'GB',name:'United Kingdom',region:'G20',group:'Advanced',gdpT:3.1,pop:67,debtGdp:101,rating:'AA',fiscalBal:-4.5,co2Mt:341},
  {id:'FR',name:'France',region:'EU',group:'Advanced',gdpT:2.8,pop:67,debtGdp:112,rating:'AA-',fiscalBal:-5.0,co2Mt:306},
  {id:'IN',name:'India',region:'G20',group:'EMDE',gdpT:3.5,pop:1408,debtGdp:83,rating:'BBB-',fiscalBal:-6.4,co2Mt:2693},
  {id:'IT',name:'Italy',region:'EU',group:'Advanced',gdpT:2.0,pop:60,debtGdp:144,rating:'BBB',fiscalBal:-5.3,co2Mt:326},
  {id:'BR',name:'Brazil',region:'G20',group:'EMDE',gdpT:2.0,pop:214,debtGdp:74,rating:'BB',fiscalBal:-7.2,co2Mt:476},
  {id:'CA',name:'Canada',region:'G20',group:'Advanced',gdpT:2.1,pop:39,debtGdp:107,rating:'AAA',fiscalBal:-1.4,co2Mt:556},
  {id:'KR',name:'South Korea',region:'G20',group:'Advanced',gdpT:1.7,pop:52,debtGdp:54,rating:'AA',fiscalBal:-1.6,co2Mt:616},
  {id:'AU',name:'Australia',region:'G20',group:'Advanced',gdpT:1.7,pop:26,debtGdp:52,rating:'AAA',fiscalBal:-1.8,co2Mt:393},
  {id:'MX',name:'Mexico',region:'G20',group:'EMDE',gdpT:1.3,pop:130,debtGdp:54,rating:'BBB',fiscalBal:-3.3,co2Mt:467},
  {id:'ID',name:'Indonesia',region:'G20',group:'EMDE',gdpT:1.3,pop:276,debtGdp:40,rating:'BBB',fiscalBal:-2.3,co2Mt:619},
  {id:'SA',name:'Saudi Arabia',region:'G20',group:'EMDE',gdpT:1.1,pop:36,debtGdp:26,rating:'A',fiscalBal:2.4,co2Mt:588},
  {id:'TR',name:'Turkey',region:'G20',group:'EMDE',gdpT:0.9,pop:85,debtGdp:32,rating:'B+',fiscalBal:-3.4,co2Mt:391},
  {id:'AR',name:'Argentina',region:'G20',group:'EMDE',gdpT:0.6,pop:46,debtGdp:85,rating:'CCC-',fiscalBal:-4.0,co2Mt:170},
  {id:'ZA',name:'South Africa',region:'G20',group:'EMDE',gdpT:0.4,pop:60,debtGdp:72,rating:'BB-',fiscalBal:-4.9,co2Mt:435},
  {id:'ES',name:'Spain',region:'EU',group:'Advanced',gdpT:1.4,pop:48,debtGdp:113,rating:'A',fiscalBal:-3.6,co2Mt:231},
  {id:'NL',name:'Netherlands',region:'EU',group:'Advanced',gdpT:1.0,pop:17,debtGdp:51,rating:'AAA',fiscalBal:-0.6,co2Mt:147},
  {id:'PL',name:'Poland',region:'EU',group:'Advanced',gdpT:0.7,pop:38,debtGdp:49,rating:'A-',fiscalBal:-3.7,co2Mt:306},
  {id:'SE',name:'Sweden',region:'EU',group:'Advanced',gdpT:0.6,pop:10,debtGdp:33,rating:'AAA',fiscalBal:0.4,co2Mt:38},
  {id:'NG',name:'Nigeria',region:'Frontier',group:'EMDE',gdpT:0.5,pop:218,debtGdp:38,rating:'B-',fiscalBal:-5.1,co2Mt:92},
  {id:'EG',name:'Egypt',region:'EMDE',group:'EMDE',gdpT:0.4,pop:104,debtGdp:93,rating:'B-',fiscalBal:-6.1,co2Mt:247},
  {id:'TH',name:'Thailand',region:'EMDE',group:'EMDE',gdpT:0.5,pop:72,debtGdp:62,rating:'BBB+',fiscalBal:-3.0,co2Mt:256},
  {id:'PH',name:'Philippines',region:'EMDE',group:'EMDE',gdpT:0.4,pop:113,debtGdp:61,rating:'BBB+',fiscalBal:-5.5,co2Mt:157},
  {id:'BD',name:'Bangladesh',region:'LDC',group:'LDC',gdpT:0.4,pop:170,debtGdp:38,rating:'BB-',fiscalBal:-4.8,co2Mt:98},
  {id:'VN',name:'Vietnam',region:'EMDE',group:'EMDE',gdpT:0.4,pop:99,debtGdp:44,rating:'BB+',fiscalBal:-3.6,co2Mt:328},
  {id:'CL',name:'Chile',region:'EMDE',group:'EMDE',gdpT:0.3,pop:19,debtGdp:38,rating:'A',fiscalBal:-1.2,co2Mt:88},
  {id:'CO',name:'Colombia',region:'EMDE',group:'EMDE',gdpT:0.3,pop:52,debtGdp:56,rating:'BB+',fiscalBal:-4.3,co2Mt:75},
  {id:'KE',name:'Kenya',region:'Frontier',group:'EMDE',gdpT:0.1,pop:54,debtGdp:68,rating:'B',fiscalBal:-5.7,co2Mt:19},
  {id:'GH',name:'Ghana',region:'Frontier',group:'EMDE',gdpT:0.08,pop:33,debtGdp:88,rating:'CCC',fiscalBal:-7.5,co2Mt:16},
  {id:'PK',name:'Pakistan',region:'EMDE',group:'EMDE',gdpT:0.35,pop:230,debtGdp:75,rating:'CCC+',fiscalBal:-7.9,co2Mt:213},
  {id:'LK',name:'Sri Lanka',region:'EMDE',group:'EMDE',gdpT:0.08,pop:22,debtGdp:115,rating:'SD',fiscalBal:-8.1,co2Mt:22},
  {id:'ET',name:'Ethiopia',region:'LDC',group:'LDC',gdpT:0.13,pop:120,debtGdp:55,rating:'CCC',fiscalBal:-3.2,co2Mt:15},
  {id:'MZ',name:'Mozambique',region:'LDC',group:'LDC',gdpT:0.02,pop:33,debtGdp:102,rating:'CCC+',fiscalBal:-4.8,co2Mt:7},
  {id:'FJ',name:'Fiji',region:'SIDS',group:'SIDS',gdpT:0.005,pop:0.9,debtGdp:82,rating:'B+',fiscalBal:-5.2,co2Mt:1.2},
  {id:'MV',name:'Maldives',region:'SIDS',group:'SIDS',gdpT:0.006,pop:0.5,debtGdp:115,rating:'Caa1',fiscalBal:-12.5,co2Mt:1.5},
  {id:'BB',name:'Barbados',region:'SIDS',group:'SIDS',gdpT:0.005,pop:0.3,debtGdp:138,rating:'B-',fiscalBal:-3.8,co2Mt:1.4},
  {id:'BZ',name:'Belize',region:'SIDS',group:'SIDS',gdpT:0.002,pop:0.4,debtGdp:61,rating:'B-',fiscalBal:-1.1,co2Mt:0.5},
  {id:'TO',name:'Tonga',region:'SIDS',group:'SIDS',gdpT:0.0005,pop:0.1,debtGdp:47,rating:'NR',fiscalBal:-2.1,co2Mt:0.2},
  {id:'WS',name:'Samoa',region:'SIDS',group:'SIDS',gdpT:0.0009,pop:0.2,debtGdp:52,rating:'NR',fiscalBal:-3.6,co2Mt:0.3},
  {id:'VU',name:'Vanuatu',region:'SIDS',group:'SIDS',gdpT:0.001,pop:0.3,debtGdp:48,rating:'NR',fiscalBal:-4.3,co2Mt:0.1},
  {id:'MA',name:'Morocco',region:'EMDE',group:'EMDE',gdpT:0.14,pop:37,debtGdp:69,rating:'BB+',fiscalBal:-4.5,co2Mt:67},
  {id:'TN',name:'Tunisia',region:'EMDE',group:'EMDE',gdpT:0.05,pop:12,debtGdp:80,rating:'CCC+',fiscalBal:-6.2,co2Mt:28},
  {id:'JM',name:'Jamaica',region:'SIDS',group:'SIDS',gdpT:0.02,pop:3,debtGdp:83,rating:'B+',fiscalBal:-0.5,co2Mt:7.4},
  {id:'SN',name:'Senegal',region:'LDC',group:'LDC',gdpT:0.03,pop:17,debtGdp:68,rating:'B+',fiscalBal:-5.4,co2Mt:11},
  {id:'TZ',name:'Tanzania',region:'LDC',group:'LDC',gdpT:0.08,pop:62,debtGdp:42,rating:'B',fiscalBal:-3.8,co2Mt:13},
  {id:'UG',name:'Uganda',region:'LDC',group:'LDC',gdpT:0.05,pop:47,debtGdp:49,rating:'B',fiscalBal:-5.1,co2Mt:6},
  {id:'ZM',name:'Zambia',region:'Frontier',group:'EMDE',gdpT:0.03,pop:20,debtGdp:96,rating:'CCC+',fiscalBal:-6.3,co2Mt:5},
  {id:'RU',name:'Russia',region:'G20',group:'EMDE',gdpT:2.2,pop:146,debtGdp:22,rating:'NR',fiscalBal:-2.3,co2Mt:1756},
  {id:'MY',name:'Malaysia',region:'EMDE',group:'EMDE',gdpT:0.4,pop:33,debtGdp:67,rating:'A-',fiscalBal:-5.0,co2Mt:256},
  {id:'PE',name:'Peru',region:'EMDE',group:'EMDE',gdpT:0.24,pop:34,debtGdp:34,rating:'BBB',fiscalBal:-1.7,co2Mt:51},
  {id:'RO',name:'Romania',region:'EU',group:'Advanced',gdpT:0.3,pop:19,debtGdp:48,rating:'BBB-',fiscalBal:-5.7,co2Mt:70},
  {id:'UA',name:'Ukraine',region:'Frontier',group:'EMDE',gdpT:0.16,pop:44,debtGdp:82,rating:'CC',fiscalBal:-15.8,co2Mt:131},
  {id:'AO',name:'Angola',region:'Frontier',group:'EMDE',gdpT:0.12,pop:34,debtGdp:65,rating:'B-',fiscalBal:-1.5,co2Mt:22},
  {id:'CR',name:'Costa Rica',region:'EMDE',group:'EMDE',gdpT:0.07,pop:5,debtGdp:64,rating:'BB-',fiscalBal:-3.0,co2Mt:8},
  {id:'MM',name:'Myanmar',region:'LDC',group:'LDC',gdpT:0.06,pop:54,debtGdp:42,rating:'NR',fiscalBal:-5.3,co2Mt:25},
  {id:'HT',name:'Haiti',region:'LDC',group:'LDC',gdpT:0.02,pop:12,debtGdp:26,rating:'NR',fiscalBal:-2.7,co2Mt:3},
  {id:'SB',name:'Solomon Islands',region:'SIDS',group:'SIDS',gdpT:0.002,pop:0.7,debtGdp:15,rating:'NR',fiscalBal:-3.1,co2Mt:0.2},
];

/* ── Derived data generators ───────────────────────────────────────────────── */
const genDebtTrajectory = (c, idx) => {
  return YEARS.map((yr, yi) => {
    const t = (yr - 2024) / 26;
    const s = sr(idx * 100 + yi);
    const base = c.debtGdp + t * (4 + s * 3) * (c.debtGdp > 80 ? 1.3 : 1);
    const orderly = base + t * (1.5 + s * 2);
    const disorderly = base + t * (4 + s * 5) + (yr > 2035 ? (yr - 2035) * 0.8 : 0);
    const hothouse = base + t * (6 + s * 8) + (yr > 2030 ? (yr - 2030) * 1.2 : 0);
    return { year:yr, baseline:Math.round(base*10)/10, orderly:Math.round(orderly*10)/10, disorderly:Math.round(disorderly*10)/10, hothouse:Math.round(hothouse*10)/10 };
  });
};

const genFiscalCosts = (c, idx) => {
  const s = sr(idx * 200);
  const isSids = c.group === 'SIDS';
  const isLdc = c.group === 'LDC';
  const base = isSids ? 4.5 : isLdc ? 3.2 : 1.2;
  return YEARS.map((yr, yi) => {
    const t = (yr - 2024) / 26;
    const v = sr(idx * 300 + yi);
    return {
      year:yr,
      adaptation: Math.round((base * (1 + t * 1.5) + v * 0.5) * 100) / 100,
      mitigation: Math.round(((0.8 + s * 0.4) * (1 + t * 0.8) + v * 0.3) * 100) / 100,
      disasterLoss: Math.round(((isSids ? 3.0 : isLdc ? 1.8 : 0.5) * (1 + t * 2) + v * 0.8) * 100) / 100,
      health: Math.round(((0.3 + s * 0.2) * (1 + t * 0.6)) * 100) / 100,
      strandedAssets: Math.round(((c.gdpT > 1 ? 0.8 : 0.3) * (1 + t * 1.2) + v * 0.2) * 100) / 100,
    };
  });
};

const genVulnScore = (c, idx) => {
  const s = sr(idx * 400);
  const isSids = c.group === 'SIDS';
  const isLdc = c.group === 'LDC';
  const debtScore = Math.min(100, (c.debtGdp / 2.5) + s * 10);
  const climExp = isSids ? 85 + s * 15 : isLdc ? 65 + s * 20 : 25 + s * 30;
  const fiscalSpace = 100 - Math.min(100, Math.abs(c.fiscalBal) * 8 + s * 15);
  const instCap = c.group === 'Advanced' ? 75 + s * 20 : isLdc ? 20 + s * 25 : 40 + s * 25;
  const extSupport = isSids ? 55 + s * 20 : isLdc ? 45 + s * 20 : c.group === 'Advanced' ? 80 + s * 15 : 35 + s * 25;
  return { debtScore, climExp, fiscalSpace, instCap, extSupport };
};

const genGdpImpact = (c, idx) => {
  return SHORT_YEARS.map((yr, yi) => {
    const t = (yr - 2024) / 26;
    const s = sr(idx * 150 + yi);
    const isHigh = c.group === 'SIDS' || c.group === 'LDC';
    return {
      year: yr,
      baseline: Math.round(((isHigh ? 3.2 : 2.0) - t * 0.3 - s * 0.2) * 100) / 100,
      orderly: Math.round(((isHigh ? 2.8 : 1.7) - t * 0.5 - s * 0.3) * 100) / 100,
      disorderly: Math.round(((isHigh ? 2.2 : 1.3) - t * 1.2 - s * 0.5) * 100) / 100,
      hothouse: Math.round(((isHigh ? 1.5 : 0.8) - t * 2.0 - s * 0.8) * 100) / 100,
    };
  });
};

const COUNTRIES = COUNTRIES_RAW.map((c, i) => ({
  ...c,
  debtTrajectory: genDebtTrajectory(c, i),
  fiscalCosts: genFiscalCosts(c, i),
  vuln: genVulnScore(c, i),
  gdpImpact: genGdpImpact(c, i),
  spreadBps: Math.round(50 + (1 - (c.group === 'Advanced' ? 0.8 : c.group === 'SIDS' ? 0.2 : 0.45)) * 400 + sr(i * 500) * 100),
  greenBondSpread: Math.round(-15 + sr(i * 600) * 30),
  externalDebtPct: Math.round(20 + sr(i * 650) * 40),
  fxReserveMonths: Math.round((3 + sr(i * 660) * 9) * 10) / 10,
  primaryBal: Math.round((c.fiscalBal + 2 + sr(i * 670) * 3) * 10) / 10,
}));

/* ── Styles ────────────────────────────────────────────────────────────────── */
const sPage = { fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px', color:T.text };
const sHeader = { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 };
const sTitle = { fontSize:22, fontWeight:700, color:T.navy, letterSpacing:'-0.02em' };
const sSub = { fontSize:12, color:T.textMut, fontFamily:T.mono, marginTop:4 };
const sBadge = { fontSize:10, fontFamily:T.mono, padding:'3px 8px', borderRadius:4, fontWeight:600 };
const sTabBar = { display:'flex', gap:0, borderBottom:`2px solid ${T.border}`, marginBottom:20 };
const sTab = (a) => ({ padding:'10px 20px', fontSize:13, fontWeight:a?700:500, cursor:'pointer', color:a?T.navy:T.textSec, borderBottom:a?`2px solid ${T.gold}`:'2px solid transparent', marginBottom:-2, transition:'all 0.15s', background:'none', border:'none', fontFamily:T.font });
const sCard = { background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20, marginBottom:16 };
const sCardTitle = { fontSize:14, fontWeight:700, color:T.navy, marginBottom:12, fontFamily:T.mono, letterSpacing:'-0.01em' };
const sKpi = { background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'16px 20px', flex:1, minWidth:150 };
const sKpiVal = { fontSize:24, fontWeight:700, fontFamily:T.mono };
const sKpiLbl = { fontSize:11, color:T.textMut, marginTop:2, fontFamily:T.mono };
const sSelect = { padding:'6px 12px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, fontFamily:T.mono, background:T.surface, color:T.text };
const sBtn = (active) => ({ padding:'6px 14px', fontSize:11, fontWeight:active?700:500, borderRadius:6, border:`1px solid ${active?T.gold:T.border}`, background:active?T.gold:T.surface, color:active?'#fff':T.text, cursor:'pointer', fontFamily:T.mono, transition:'all 0.15s' });
const sTblWrap = { overflowX:'auto', borderRadius:8, border:`1px solid ${T.border}` };
const sTbl = { width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.mono };
const sTh = { padding:'10px 12px', textAlign:'left', fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.border}`, background:T.surfaceH, whiteSpace:'nowrap', fontSize:11 };
const sTd = { padding:'8px 12px', borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' };
const sSlider = { width:'100%', accentColor:T.gold };
const sChip = (color) => ({ display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:10, fontWeight:600, fontFamily:T.mono, background:color+'18', color });
const sGrid2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 };

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const fmt = (v, d=1) => v == null ? '\u2014' : typeof v === 'number' ? v.toFixed(d) : v;
const pct = (v) => v == null ? '\u2014' : v.toFixed(1) + '%';
const dsaLight = (debtGdp, scenario2050) => {
  if (scenario2050 > 120) return { label:'High Risk', color:T.red };
  if (scenario2050 > 80) return { label:'Medium Risk', color:T.amber };
  return { label:'Low Risk', color:T.green };
};
const ratingColor = (r) => {
  if (!r) return T.textMut;
  if (r.startsWith('AAA') || r.startsWith('AA')) return T.green;
  if (r.startsWith('A') || r.startsWith('BBB')) return T.navyL;
  if (r.startsWith('BB')) return T.amber;
  return T.red;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, padding:'10px 14px', fontSize:11, fontFamily:T.mono, boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight:700, marginBottom:4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color:p.color, marginTop:2 }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</div>
      ))}
    </div>
  );
};

/* ── Export CSV ─────────────────────────────────────────────────────────────── */
const exportCsv = (rows, filename) => {
  if (!rows.length) return;
  const hdr = Object.keys(rows[0]);
  const csv = [hdr.join(','), ...rows.map(r => hdr.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

/* ══════════════════════════════════════════════════════════════════════════════
   TAB 1: Debt Trajectory
   ══════════════════════════════════════════════════════════════════════════════ */
const DebtTrajectoryTab = ({ countries }) => {
  const [selCountry, setSelCountry] = useState('US');
  const [showThreshold, setShowThreshold] = useState(true);
  const [tableRows, setTableRows] = useState(20);

  const c = countries.find(x => x.id === selCountry) || countries[0];
  const data = c.debtTrajectory;
  const peak = Math.max(...data.map(d => Math.max(d.baseline, d.orderly, d.disorderly, d.hothouse)));
  const dsaBaseline = dsaLight(c.debtGdp, data[data.length - 1].baseline);
  const dsaHothouse = dsaLight(c.debtGdp, data[data.length - 1].hothouse);

  const costOverlay = c.fiscalCosts.map(f => ({
    year: f.year, adaptation: f.adaptation, disaster: f.disasterLoss, stranded: f.strandedAssets,
  }));

  const gdpData = c.gdpImpact;

  const allCountrySummary = useMemo(() => countries.map(cc => {
    const last = cc.debtTrajectory[cc.debtTrajectory.length - 1];
    const dsa = dsaLight(cc.debtGdp, last.hothouse);
    return { id:cc.id, name:cc.name, group:cc.group, current:cc.debtGdp, baseline2050:last.baseline, orderly2050:last.orderly, disorderly2050:last.disorderly, hothouse2050:last.hothouse, dsa, rating:cc.rating, extDebt:cc.externalDebtPct, fxRes:cc.fxReserveMonths };
  }), [countries]);

  return (
    <div>
      {/* KPIs */}
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        {[
          { v:`${fmt(c.debtGdp,1)}%`, l:'Current Debt/GDP', c:T.navy },
          { v:`${fmt(peak,1)}%`, l:'Projected Peak (Worst)', c:T.amber },
          { v:dsaBaseline.label, l:'DSA \u2014 Baseline', c:dsaBaseline.color },
          { v:dsaHothouse.label, l:'DSA \u2014 Hot House', c:dsaHothouse.color },
          { v:c.rating, l:'Sovereign Rating', c:ratingColor(c.rating) },
          { v:`${c.externalDebtPct}%`, l:'External Debt Share', c:T.navyL },
          { v:`${c.fxReserveMonths}m`, l:'FX Reserve Cover', c:c.fxReserveMonths < 3 ? T.red : T.green },
        ].map((k, i) => (
          <div key={i} style={sKpi}>
            <div style={{ ...sKpiVal, color:k.c }}>{k.v}</div>
            <div style={sKpiLbl}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Country selector */}
      <div style={{ display:'flex', gap:12, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        <select value={selCountry} onChange={e=>setSelCountry(e.target.value)} style={sSelect}>
          {countries.map(cc => <option key={cc.id} value={cc.id}>{cc.name} ({cc.id})</option>)}
        </select>
        <label style={{ fontSize:11, fontFamily:T.mono, display:'flex', alignItems:'center', gap:4, cursor:'pointer' }}>
          <input type="checkbox" checked={showThreshold} onChange={e=>setShowThreshold(e.target.checked)} /> IMF 60% threshold
        </label>
        <span style={{ fontSize:11, color:T.textMut, fontFamily:T.mono }}>
          GDP: ${c.gdpT}T | Pop: {c.pop}M | Fiscal Balance: {c.fiscalBal}% | CO2: {c.co2Mt}Mt
        </span>
      </div>

      {/* Debt trajectory chart */}
      <div style={sCard}>
        <div style={sCardTitle}>Debt-to-GDP Trajectory 2024\u20132050 \u2014 {c.name}</div>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={data} margin={{ top:10, right:30, bottom:10, left:10 }}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono, fill:T.textSec }} />
            <YAxis tick={{ fontSize:11, fontFamily:T.mono, fill:T.textSec }} domain={[0, 'auto']} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize:11, fontFamily:T.mono }} />
            {SCENARIOS.map(sc => (
              <Line key={sc.key} type="monotone" dataKey={sc.key} name={sc.label} stroke={sc.color} strokeWidth={sc.key === 'baseline' ? 2.5 : 1.8} strokeDasharray={sc.dash} dot={false} />
            ))}
            {showThreshold && (
              <Line type="monotone" dataKey={() => 60} name="IMF Threshold (60%)" stroke={T.textMut} strokeWidth={1} strokeDasharray="8 4" dot={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={sGrid2}>
        {/* Climate cost overlay */}
        <div style={sCard}>
          <div style={sCardTitle}>Climate Cost Overlay \u2014 {c.name} (% GDP)</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={costOverlay} margin={{ top:10, right:20, bottom:10, left:10 }}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize:10, fontFamily:T.mono, fill:T.textSec }} />
              <YAxis tick={{ fontSize:10, fontFamily:T.mono, fill:T.textSec }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:10, fontFamily:T.mono }} />
              <Area type="monotone" dataKey="adaptation" stackId="1" fill={T.sage+'60'} stroke={T.sage} name="Adaptation" />
              <Area type="monotone" dataKey="disaster" stackId="1" fill={T.red+'40'} stroke={T.red} name="Disaster Loss" />
              <Area type="monotone" dataKey="stranded" stackId="1" fill={T.amber+'40'} stroke={T.amber} name="Stranded Assets" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* GDP growth impact */}
        <div style={sCard}>
          <div style={sCardTitle}>GDP Growth Impact by Scenario \u2014 {c.name}</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={gdpData} margin={{ top:10, right:20, bottom:10, left:10 }}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize:10, fontFamily:T.mono, fill:T.textSec }} />
              <YAxis tick={{ fontSize:10, fontFamily:T.mono, fill:T.textSec }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:10, fontFamily:T.mono }} />
              {SCENARIOS.map(sc => (
                <Line key={sc.key} type="monotone" dataKey={sc.key} name={sc.label} stroke={sc.color} strokeWidth={1.5} strokeDasharray={sc.dash} dot={{ r:2 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* IMF DSA traffic lights */}
      <div style={sCard}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={sCardTitle}>IMF DSA Traffic Lights \u2014 All Countries</div>
          <select value={tableRows} onChange={e => setTableRows(+e.target.value)} style={sSelect}>
            <option value={20}>Show 20</option>
            <option value={40}>Show 40</option>
            <option value={60}>Show All 60</option>
          </select>
        </div>
        <div style={sTblWrap}>
          <table style={sTbl}>
            <thead>
              <tr>
                <th style={sTh}>Country</th>
                <th style={sTh}>Group</th>
                <th style={sTh}>Rating</th>
                <th style={sTh}>Current D/GDP</th>
                <th style={sTh}>Baseline 2050</th>
                <th style={sTh}>Orderly 2050</th>
                <th style={sTh}>Disorderly 2050</th>
                <th style={sTh}>Hothouse 2050</th>
                <th style={sTh}>Ext. Debt %</th>
                <th style={sTh}>FX Reserves</th>
                <th style={sTh}>DSA Signal</th>
              </tr>
            </thead>
            <tbody>
              {allCountrySummary.slice(0, tableRows).map((r, ri) => (
                <tr key={r.id} style={{ background:ri%2?T.surfaceH:'transparent', cursor:'pointer' }} onClick={() => setSelCountry(r.id)}>
                  <td style={{ ...sTd, fontWeight:600 }}>{r.name}</td>
                  <td style={sTd}><span style={sChip(r.group==='SIDS'?T.red:r.group==='LDC'?T.amber:r.group==='Advanced'?T.green:T.navyL)}>{r.group}</span></td>
                  <td style={sTd}><span style={{ color:ratingColor(r.rating), fontWeight:600 }}>{r.rating}</span></td>
                  <td style={sTd}>{fmt(r.current,1)}%</td>
                  <td style={sTd}>{fmt(r.baseline2050,1)}%</td>
                  <td style={sTd}>{fmt(r.orderly2050,1)}%</td>
                  <td style={sTd}>{fmt(r.disorderly2050,1)}%</td>
                  <td style={sTd}>{fmt(r.hothouse2050,1)}%</td>
                  <td style={sTd}>{r.extDebt}%</td>
                  <td style={sTd}>{r.fxRes}m</td>
                  <td style={sTd}><span style={sChip(r.dsa.color)}>{r.dsa.label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scenario comparison summary */}
      <div style={sCard}>
        <div style={sCardTitle}>Scenario Comparison Summary \u2014 {c.name}</div>
        <div style={sTblWrap}>
          <table style={sTbl}>
            <thead>
              <tr>
                <th style={sTh}>Scenario</th>
                <th style={sTh}>2030 Debt/GDP</th>
                <th style={sTh}>2040 Debt/GDP</th>
                <th style={sTh}>2050 Debt/GDP</th>
                <th style={sTh}>Peak Debt/GDP</th>
                <th style={sTh}>GDP Impact 2050</th>
                <th style={sTh}>DSA Assessment</th>
                <th style={sTh}>Fiscal Pressure</th>
              </tr>
            </thead>
            <tbody>
              {SCENARIOS.map((sc, si) => {
                const row2030 = data.find(d => d.year === 2030) || data[3];
                const row2040 = data.find(d => d.year === 2040) || data[8];
                const row2050 = data[data.length - 1];
                const peakVal = Math.max(...data.map(d => d[sc.key]));
                const dsa2 = dsaLight(c.debtGdp, row2050[sc.key]);
                const gdpRow = gdpData.find(g => g.year === 2050) || gdpData[gdpData.length - 1];
                const fiscalPressure = row2050[sc.key] > 120 ? 'Severe' : row2050[sc.key] > 80 ? 'Elevated' : 'Moderate';
                const fpColor = fiscalPressure === 'Severe' ? T.red : fiscalPressure === 'Elevated' ? T.amber : T.green;
                return (
                  <tr key={sc.key} style={{ background:si%2?T.surfaceH:'transparent' }}>
                    <td style={sTd}><span style={{ color:sc.color, fontWeight:700 }}>{sc.label}</span></td>
                    <td style={sTd}>{fmt(row2030[sc.key],1)}%</td>
                    <td style={sTd}>{fmt(row2040[sc.key],1)}%</td>
                    <td style={sTd}>{fmt(row2050[sc.key],1)}%</td>
                    <td style={sTd}><span style={{ fontWeight:700 }}>{fmt(peakVal,1)}%</span></td>
                    <td style={sTd}>{fmt(gdpRow[sc.key],2)}%</td>
                    <td style={sTd}><span style={sChip(dsa2.color)}>{dsa2.label}</span></td>
                    <td style={sTd}><span style={sChip(fpColor)}>{fiscalPressure}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Debt composition detail */}
      <div style={sCard}>
        <div style={sCardTitle}>Debt Composition Indicators \u2014 {c.name}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
          {[
            { label:'External Debt', value:`${c.externalDebtPct}%`, sub:'of total debt', color:c.externalDebtPct > 50 ? T.amber : T.navy },
            { label:'FX Reserve Coverage', value:`${c.fxReserveMonths}m`, sub:'months of imports', color:c.fxReserveMonths < 3 ? T.red : c.fxReserveMonths < 6 ? T.amber : T.green },
            { label:'Primary Balance', value:`${c.primaryBal}%`, sub:'of GDP', color:c.primaryBal < 0 ? T.red : T.green },
            { label:'CO2 Emissions', value:`${c.co2Mt}Mt`, sub:'annual total', color:T.textSec },
            { label:'Fiscal Balance', value:`${c.fiscalBal}%`, sub:'of GDP', color:c.fiscalBal < -5 ? T.red : c.fiscalBal < -3 ? T.amber : T.green },
            { label:'Population', value:`${c.pop}M`, sub:'total', color:T.navy },
            { label:'GDP (PPP)', value:`$${c.gdpT}T`, sub:'trillion USD', color:T.navy },
            { label:'Sovereign Rating', value:c.rating, sub:'current', color:ratingColor(c.rating) },
          ].map((item, i) => (
            <div key={i} style={{ background:T.surfaceH, borderRadius:6, padding:'12px 14px' }}>
              <div style={{ fontSize:18, fontWeight:700, fontFamily:T.mono, color:item.color }}>{item.value}</div>
              <div style={{ fontSize:11, fontWeight:600, color:T.navy, marginTop:2 }}>{item.label}</div>
              <div style={{ fontSize:10, color:T.textMut, fontFamily:T.mono }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   TAB 2: Fiscal Climate Costs
   ══════════════════════════════════════════════════════════════════════════════ */
const FiscalClimateTab = ({ countries }) => {
  const [selCountry, setSelCountry] = useState('FJ');
  const [carbonPriceSlider, setCarbonPriceSlider] = useState(85);
  const [subsidyRemoval, setSubsidyRemoval] = useState(50);
  const [greenBondShare, setGreenBondShare] = useState(20);
  const [adaptMultiplier, setAdaptMultiplier] = useState(100);
  const [costYear, setCostYear] = useState(2030);

  const c = countries.find(x => x.id === selCountry) || countries[0];
  const costs = c.fiscalCosts;
  const isSids = c.group === 'SIDS';
  const isLdc = c.group === 'LDC';
  const cIdx = countries.indexOf(c);

  const costBreakdownForYear = useMemo(() => {
    const row = costs.find(r => r.year === costYear) || costs[3];
    return COST_TYPES.map((t, i) => ({
      type: t,
      value: [row.adaptation * (adaptMultiplier / 100), row.mitigation, row.disasterLoss, row.health, row.strandedAssets][i],
      color: COST_COLORS[i],
    }));
  }, [costs, costYear, adaptMultiplier]);

  const stackedData = costs.map(r => ({
    year:r.year,
    Adaptation:r.adaptation * (adaptMultiplier / 100),
    Mitigation:r.mitigation,
    'Disaster Loss':r.disasterLoss,
    Health:r.health,
    'Stranded Assets':r.strandedAssets,
  }));

  const totalByYear = stackedData.map(r => ({
    year: r.year,
    total: r.Adaptation + r.Mitigation + r['Disaster Loss'] + r.Health + r['Stranded Assets'],
  }));

  // Revenue calculations
  const carbonRevenue = (carbonPriceSlider / 100) * (c.gdpT > 1 ? 1.8 : 0.6) * (1 + sr(cIdx * 700) * 0.3);
  const subsidyRev = (subsidyRemoval / 100) * (c.gdpT > 1 ? 0.8 : 0.2) * (1 + sr(cIdx * 800) * 0.3);
  const greenBondRev = (greenBondShare / 100) * c.debtGdp * 0.02;
  const concFinance = isSids ? 0.8 + sr(cIdx * 810) * 0.4 : isLdc ? 0.5 + sr(cIdx * 820) * 0.3 : 0.1 + sr(cIdx * 830) * 0.1;
  const totalRevenue = carbonRevenue + subsidyRev + greenBondRev + concFinance;
  const totalCost = costBreakdownForYear.reduce((a, b) => a + b.value, 0);
  const netPosition = totalRevenue - totalCost;

  // Cross-country comparison (top 10 most costly)
  const crossCountryFiscal = useMemo(() => {
    return countries.map(cc => {
      const row = cc.fiscalCosts.find(r => r.year === costYear) || cc.fiscalCosts[3];
      const total = row.adaptation + row.mitigation + row.disasterLoss + row.health + row.strandedAssets;
      return { name:cc.id, fullName:cc.name, group:cc.group, total:Math.round(total * 100) / 100 };
    }).sort((a, b) => b.total - a.total).slice(0, 20);
  }, [countries, costYear]);

  return (
    <div>
      <div style={{ display:'flex', gap:12, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        <select value={selCountry} onChange={e => setSelCountry(e.target.value)} style={sSelect}>
          {countries.map(cc => <option key={cc.id} value={cc.id}>{cc.name} ({cc.group})</option>)}
        </select>
        <span style={{ fontSize:11, fontFamily:T.mono, color:T.textMut }}>Year:</span>
        <select value={costYear} onChange={e => setCostYear(+e.target.value)} style={sSelect}>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span style={{ fontSize:11, color:T.textMut, fontFamily:T.mono }}>
          {isSids ? 'SIDS: Extreme climate fiscal exposure' : isLdc ? 'LDC: Limited fiscal headroom' : `Fiscal Balance: ${c.fiscalBal}% GDP`}
        </span>
      </div>

      {/* KPIs */}
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        {[
          { v:`${fmt(totalCost,2)}%`, l:`Total Climate Cost (${costYear})`, c:T.red },
          { v:`${fmt(totalRevenue,2)}%`, l:'Revenue Opportunities', c:T.green },
          { v:`${netPosition >= 0 ? '+' : ''}${fmt(netPosition,2)}%`, l:'Net Fiscal Position', c:netPosition >= 0 ? T.green : T.red },
          { v:`${fmt(c.primaryBal,1)}%`, l:'Primary Balance', c:c.primaryBal >= 0 ? T.green : T.red },
          { v:`${c.co2Mt}Mt`, l:'Annual CO2 Emissions', c:T.textSec },
        ].map((k, i) => (
          <div key={i} style={sKpi}>
            <div style={{ ...sKpiVal, color:k.c, fontSize:20 }}>{k.v}</div>
            <div style={sKpiLbl}>{k.l}</div>
          </div>
        ))}
      </div>

      <div style={sGrid2}>
        {/* Cost breakdown bar */}
        <div style={sCard}>
          <div style={sCardTitle}>Fiscal Impact Breakdown \u2014 {c.name} ({costYear}, % GDP)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={costBreakdownForYear} layout="vertical" margin={{ top:10, right:30, bottom:10, left:110 }}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize:11, fontFamily:T.mono, fill:T.textSec }} unit="%" />
              <YAxis type="category" dataKey="type" tick={{ fontSize:11, fontFamily:T.mono, fill:T.textSec }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="% GDP" radius={[0, 4, 4, 0]}>
                {costBreakdownForYear.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Total cost trajectory */}
        <div style={sCard}>
          <div style={sCardTitle}>Total Climate Cost Trajectory \u2014 {c.name} (% GDP)</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={totalByYear} margin={{ top:10, right:20, bottom:10, left:10 }}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize:10, fontFamily:T.mono, fill:T.textSec }} />
              <YAxis tick={{ fontSize:10, fontFamily:T.mono, fill:T.textSec }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" fill={T.red+'30'} stroke={T.red} strokeWidth={2} name="Total Climate Cost" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost trajectory stacked area */}
      <div style={sCard}>
        <div style={sCardTitle}>Climate Cost Trajectory by Type \u2014 {c.name} (% GDP)</div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={stackedData} margin={{ top:10, right:30, bottom:10, left:10 }}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono, fill:T.textSec }} />
            <YAxis tick={{ fontSize:11, fontFamily:T.mono, fill:T.textSec }} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize:11, fontFamily:T.mono }} />
            <Area type="monotone" dataKey="Adaptation" stackId="1" fill={T.sage+'60'} stroke={T.sage} />
            <Area type="monotone" dataKey="Mitigation" stackId="1" fill={T.navyL+'50'} stroke={T.navyL} />
            <Area type="monotone" dataKey="Disaster Loss" stackId="1" fill={T.red+'40'} stroke={T.red} />
            <Area type="monotone" dataKey="Health" stackId="1" fill={T.amber+'40'} stroke={T.amber} />
            <Area type="monotone" dataKey="Stranded Assets" stackId="1" fill={T.gold+'40'} stroke={T.gold} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Net fiscal position calculator */}
      <div style={sCard}>
        <div style={sCardTitle}>Net Fiscal Position Calculator \u2014 Revenue Opportunities</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
          <div>
            {[
              { label:'Carbon Price ($/t CO2)', val:carbonPriceSlider, set:setCarbonPriceSlider, min:10, max:250, rev:carbonRevenue },
              { label:'Fossil Subsidy Removal (%)', val:subsidyRemoval, set:setSubsidyRemoval, min:0, max:100, rev:subsidyRev },
              { label:'Green Bond Issuance (% of debt)', val:greenBondShare, set:setGreenBondShare, min:0, max:50, rev:greenBondRev },
              { label:'Adaptation Investment Multiplier (%)', val:adaptMultiplier, set:setAdaptMultiplier, min:50, max:200, rev:null },
            ].map((sl, si) => (
              <div key={si} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontFamily:T.mono, marginBottom:3 }}>
                  <span>{sl.label}</span>
                  <span style={{ fontWeight:700 }}>{sl.label.includes('$') ? '$' : ''}{sl.val}{sl.label.includes('$') ? '' : '%'}</span>
                </div>
                <input type="range" min={sl.min} max={sl.max} value={sl.val} onChange={e => sl.set(+e.target.value)} style={sSlider} />
                {sl.rev !== null && <div style={{ fontSize:10, color:T.textMut, fontFamily:T.mono }}>Revenue: {fmt(sl.rev, 2)}% GDP</div>}
              </div>
            ))}
            <div style={{ fontSize:10, color:T.textMut, fontFamily:T.mono, marginTop:4 }}>
              Concessional finance access: {fmt(concFinance, 2)}% GDP ({isSids ? 'SIDS premium' : isLdc ? 'LDC access' : 'Standard'})
            </div>
          </div>
          <div style={{ background:T.surfaceH, borderRadius:8, padding:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>Net Fiscal Position Summary</div>
            <div style={{ display:'grid', gap:8 }}>
              {[
                { l:'Adaptation Costs', v:-costBreakdownForYear[0].value, c:T.red },
                { l:'Mitigation Costs', v:-costBreakdownForYear[1].value, c:T.red },
                { l:'Disaster Contingencies', v:-costBreakdownForYear[2].value, c:T.red },
                { l:'Health Costs', v:-costBreakdownForYear[3].value, c:T.red },
                { l:'Stranded Asset Costs', v:-costBreakdownForYear[4].value, c:T.red },
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontFamily:T.mono }}>
                  <span>{item.l}</span>
                  <span style={{ color:item.c }}>{fmt(item.v, 2)}%</span>
                </div>
              ))}
              <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:6 }} />
              {[
                { l:'Carbon Pricing Revenue', v:carbonRevenue, c:T.green },
                { l:'Subsidy Removal Savings', v:subsidyRev, c:T.green },
                { l:'Green Bond Proceeds', v:greenBondRev, c:T.green },
                { l:'Concessional Finance', v:concFinance, c:T.green },
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontFamily:T.mono }}>
                  <span>{item.l}</span>
                  <span style={{ color:item.c }}>+{fmt(item.v, 2)}%</span>
                </div>
              ))}
              <div style={{ borderTop:`2px solid ${T.border}`, paddingTop:8, display:'flex', justifyContent:'space-between', fontSize:14, fontFamily:T.mono, fontWeight:700 }}>
                <span>Net Position</span>
                <span style={{ color: netPosition >= 0 ? T.green : T.red }}>{netPosition >= 0 ? '+' : ''}{fmt(netPosition, 2)}% GDP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-country fiscal comparison */}
      <div style={sCard}>
        <div style={sCardTitle}>Cross-Country Climate Fiscal Cost ({costYear}, % GDP) \u2014 Top 20</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={crossCountryFiscal} margin={{ top:10, right:20, bottom:50, left:10 }}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{ fontSize:9, fontFamily:T.mono, fill:T.textSec }} height={60} />
            <YAxis tick={{ fontSize:11, fontFamily:T.mono, fill:T.textSec }} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" name="Total Climate Cost (% GDP)" radius={[4, 4, 0, 0]}>
              {crossCountryFiscal.map((entry, i) => (
                <Cell key={i} fill={entry.group === 'SIDS' ? T.red : entry.group === 'LDC' ? T.amber : T.navyL} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   TAB 3: Vulnerability Ranking
   ══════════════════════════════════════════════════════════════════════════════ */
const VulnerabilityTab = ({ countries }) => {
  const [weights, setWeights] = useState({ debtScore:20, climExp:25, fiscalSpace:20, instCap:15, extSupport:20 });
  const [regionFilter, setRegionFilter] = useState('All');
  const [peerA, setPeerA] = useState('FJ');
  const [peerB, setPeerB] = useState('BD');
  const [sortCol, setSortCol] = useState('composite');
  const [sortDir, setSortDir] = useState('desc');

  const wKeys = ['debtScore','climExp','fiscalSpace','instCap','extSupport'];
  const totalW = wKeys.reduce((a, k) => a + weights[k], 0);

  const ranked = useMemo(() => {
    const list = countries.map(c => {
      const composite = wKeys.reduce((acc, k) => {
        const w = weights[k] / (totalW || 1);
        const raw = c.vuln[k];
        const inverted = (k === 'fiscalSpace' || k === 'instCap' || k === 'extSupport') ? (100 - raw) : raw;
        return acc + inverted * w;
      }, 0);
      return { ...c, composite: Math.round(composite * 10) / 10 };
    })
    .filter(c => regionFilter === 'All' || c.region === regionFilter || c.group === regionFilter);

    list.sort((a, b) => {
      const va = sortCol === 'composite' ? a.composite : sortCol === 'name' ? a.name : a.vuln[sortCol] || 0;
      const vb = sortCol === 'composite' ? b.composite : sortCol === 'name' ? b.name : b.vuln[sortCol] || 0;
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return list;
  }, [countries, weights, totalW, regionFilter, sortCol, sortDir]);

  const scatterData = ranked.map(c => ({
    name: c.name, id: c.id, vulnerability: c.composite, fiscalSpace: c.vuln.fiscalSpace, group: c.group,
  }));

  const peerAObj = countries.find(x => x.id === peerA);
  const peerBObj = countries.find(x => x.id === peerB);
  const peerCompare = useMemo(() => {
    if (!peerAObj || !peerBObj) return [];
    return VULN_DIMS.map((dim, i) => ({ dimension: dim, [peerAObj.name]: peerAObj.vuln[wKeys[i]], [peerBObj.name]: peerBObj.vuln[wKeys[i]] }));
  }, [peerAObj, peerBObj]);

  const groupCounts = useMemo(() => {
    const g = {};
    ranked.forEach(c => { g[c.group] = (g[c.group] || 0) + 1; });
    return Object.entries(g).sort((a, b) => b[1] - a[1]);
  }, [ranked]);

  const groupAvg = useMemo(() => {
    const groups = {};
    countries.forEach(c => {
      if (!groups[c.group]) groups[c.group] = { sum:0, count:0 };
      const comp = wKeys.reduce((acc, k) => {
        const w = weights[k] / (totalW || 1);
        const raw = c.vuln[k];
        const inverted = (k === 'fiscalSpace' || k === 'instCap' || k === 'extSupport') ? (100 - raw) : raw;
        return acc + inverted * w;
      }, 0);
      groups[c.group].sum += comp;
      groups[c.group].count += 1;
    });
    return Object.entries(groups).map(([g, v]) => ({
      group: g, avg: Math.round(v.sum / v.count * 10) / 10, count: v.count,
      color: g === 'SIDS' ? T.red : g === 'LDC' ? T.amber : g === 'Advanced' ? T.green : T.navyL,
    })).sort((a, b) => b.avg - a.avg);
  }, [countries, weights, totalW]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  return (
    <div>
      {/* Weighting sliders */}
      <div style={sCard}>
        <div style={sCardTitle}>Vulnerability Dimension Weights (Total: {totalW})</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:16 }}>
          {VULN_DIMS.map((dim, i) => (
            <div key={dim}>
              <div style={{ fontSize:11, fontFamily:T.mono, fontWeight:600, marginBottom:4, color:T.navy }}>{dim}</div>
              <input type="range" min={0} max={50} value={weights[wKeys[i]]} onChange={e => setWeights(prev => ({ ...prev, [wKeys[i]]:+e.target.value }))} style={sSlider} />
              <div style={{ fontSize:10, color:T.textMut, fontFamily:T.mono, textAlign:'center' }}>{weights[wKeys[i]]} ({totalW > 0 ? Math.round(weights[wKeys[i]] / totalW * 100) : 0}% eff.)</div>
            </div>
          ))}
        </div>
      </div>

      {/* Region filter + group stats */}
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        {REGIONS.map(r => (
          <button key={r} onClick={() => setRegionFilter(r)} style={sBtn(regionFilter === r)}>{r}</button>
        ))}
        <span style={{ fontSize:11, color:T.textMut, fontFamily:T.mono, marginLeft:12 }}>
          {ranked.length} countries | {groupCounts.map(([g, n]) => `${g}(${n})`).join(', ')}
        </span>
      </div>

      {/* Group averages */}
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        {groupAvg.map((g, i) => (
          <div key={i} style={{ ...sKpi, minWidth:130 }}>
            <div style={{ ...sKpiVal, color:g.color, fontSize:20 }}>{g.avg}</div>
            <div style={sKpiLbl}>{g.group} avg ({g.count})</div>
          </div>
        ))}
      </div>

      {/* Ranking table */}
      <div style={sCard}>
        <div style={sCardTitle}>Climate-Adjusted Debt Vulnerability Ranking</div>
        <div style={sTblWrap}>
          <table style={sTbl}>
            <thead>
              <tr>
                <th style={sTh}>#</th>
                <th style={{ ...sTh, cursor:'pointer' }} onClick={() => handleSort('name')}>Country {sortCol==='name' ? (sortDir==='asc'?'\u25B2':'\u25BC') : ''}</th>
                <th style={sTh}>Group</th>
                <th style={{ ...sTh, cursor:'pointer' }} onClick={() => handleSort('composite')}>Composite {sortCol==='composite' ? (sortDir==='asc'?'\u25B2':'\u25BC') : ''}</th>
                <th style={{ ...sTh, cursor:'pointer' }} onClick={() => handleSort('debtScore')}>Debt {sortCol==='debtScore' ? (sortDir==='asc'?'\u25B2':'\u25BC') : ''}</th>
                <th style={{ ...sTh, cursor:'pointer' }} onClick={() => handleSort('climExp')}>Climate {sortCol==='climExp' ? (sortDir==='asc'?'\u25B2':'\u25BC') : ''}</th>
                <th style={{ ...sTh, cursor:'pointer' }} onClick={() => handleSort('fiscalSpace')}>Fiscal {sortCol==='fiscalSpace' ? (sortDir==='asc'?'\u25B2':'\u25BC') : ''}</th>
                <th style={{ ...sTh, cursor:'pointer' }} onClick={() => handleSort('instCap')}>Inst.Cap {sortCol==='instCap' ? (sortDir==='asc'?'\u25B2':'\u25BC') : ''}</th>
                <th style={{ ...sTh, cursor:'pointer' }} onClick={() => handleSort('extSupport')}>Ext.Supp {sortCol==='extSupport' ? (sortDir==='asc'?'\u25B2':'\u25BC') : ''}</th>
                <th style={sTh}>Rating</th>
                <th style={sTh}>Debt/GDP</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((c, ri) => (
                <tr key={c.id} style={{ background:ri%2?T.surfaceH:'transparent' }}>
                  <td style={sTd}>{ri + 1}</td>
                  <td style={{ ...sTd, fontWeight:600 }}>{c.name}</td>
                  <td style={sTd}><span style={sChip(c.group==='SIDS'?T.red:c.group==='LDC'?T.amber:c.group==='Advanced'?T.green:T.navyL)}>{c.group}</span></td>
                  <td style={sTd}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:60, height:8, background:T.surfaceH, borderRadius:4, overflow:'hidden' }}>
                        <div style={{ width:`${Math.min(c.composite, 100)}%`, height:'100%', background:c.composite > 70 ? T.red : c.composite > 45 ? T.amber : T.green, borderRadius:4 }} />
                      </div>
                      <span style={{ fontWeight:700 }}>{fmt(c.composite, 1)}</span>
                    </div>
                  </td>
                  <td style={sTd}>{fmt(c.vuln.debtScore, 0)}</td>
                  <td style={sTd}>{fmt(c.vuln.climExp, 0)}</td>
                  <td style={sTd}>{fmt(c.vuln.fiscalSpace, 0)}</td>
                  <td style={sTd}>{fmt(c.vuln.instCap, 0)}</td>
                  <td style={sTd}>{fmt(c.vuln.extSupport, 0)}</td>
                  <td style={sTd}><span style={{ color:ratingColor(c.rating), fontWeight:600 }}>{c.rating}</span></td>
                  <td style={sTd}>{c.debtGdp}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={sGrid2}>
        {/* Scatter: vulnerability vs fiscal space */}
        <div style={sCard}>
          <div style={sCardTitle}>Vulnerability vs Fiscal Space</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={scatterData.slice(0, 25)} margin={{ top:10, right:20, bottom:50, left:10 }}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{ fontSize:8, fontFamily:T.mono, fill:T.textSec }} height={70} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono, fill:T.textSec }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:10, fontFamily:T.mono }} />
              <Bar dataKey="vulnerability" name="Vulnerability" fill={T.red+'90'} radius={[4, 4, 0, 0]} />
              <Bar dataKey="fiscalSpace" name="Fiscal Space" fill={T.sage+'90'} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Peer comparison */}
        <div style={sCard}>
          <div style={sCardTitle}>Peer Comparison</div>
          <div style={{ display:'flex', gap:12, marginBottom:12 }}>
            <select value={peerA} onChange={e => setPeerA(e.target.value)} style={sSelect}>
              {countries.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
            </select>
            <span style={{ fontFamily:T.mono, fontSize:12, color:T.textMut, alignSelf:'center' }}>vs</span>
            <select value={peerB} onChange={e => setPeerB(e.target.value)} style={sSelect}>
              {countries.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
            </select>
          </div>
          {peerAObj && peerBObj && (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={peerCompare} layout="vertical" margin={{ top:10, right:30, bottom:10, left:110 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize:11, fontFamily:T.mono, fill:T.textSec }} domain={[0, 100]} />
                <YAxis type="category" dataKey="dimension" tick={{ fontSize:11, fontFamily:T.mono, fill:T.textSec }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize:10, fontFamily:T.mono }} />
                <Bar dataKey={peerAObj.name} fill={T.navyL} radius={[0, 4, 4, 0]} />
                <Bar dataKey={peerBObj.name} fill={T.gold} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   TAB 4: Investment Implications
   ══════════════════════════════════════════════════════════════════════════════ */
const InvestmentTab = ({ countries }) => {
  const [scenarioView, setScenarioView] = useState('hothouse');
  const [showRows, setShowRows] = useState(30);

  const bondData = useMemo(() => {
    return countries.map((c, i) => {
      const s = sr(i * 900);
      const scenarioShock = { baseline:0, orderly:Math.round(10+s*20), disorderly:Math.round(30+s*50), hothouse:Math.round(50+s*80) };
      const adjSpread = c.spreadBps + scenarioShock[scenarioView];
      const signal = adjSpread < 100 ? 'BUY' : adjSpread < 250 ? 'HOLD' : adjSpread > 400 ? 'SELL' : 'REDUCE';
      const restructureRisk = (c.debtGdp > 80 && adjSpread > 350) || c.rating === 'SD' || c.rating === 'CCC' || c.rating === 'CC';
      const convictionPct = Math.round(50 + (adjSpread < 100 ? 30 : adjSpread > 400 ? 35 : 10) + s * 15);
      return {
        ...c, adjSpread:Math.round(adjSpread), scenarioShock:scenarioShock[scenarioView],
        signal, restructureRisk, greenPremium:c.greenBondSpread, convictionPct,
        relValue:c.greenBondSpread < -5 ? 'Green Cheap' : c.greenBondSpread > 5 ? 'Conv. Cheap' : 'Fair Value',
        duration: Math.round((5 + sr(i * 910) * 10) * 10) / 10,
        yieldEst: Math.round((2 + adjSpread / 100 + sr(i * 920) * 1.5) * 100) / 100,
      };
    }).sort((a, b) => b.adjSpread - a.adjSpread);
  }, [countries, scenarioView]);

  const spreadChart = useMemo(() => {
    return bondData.slice(0, 25).map(c => ({ name:c.id, 'Base Spread':c.spreadBps, 'Climate Add-on':c.scenarioShock }));
  }, [bondData]);

  const signalCounts = useMemo(() => {
    const counts = { BUY:0, HOLD:0, REDUCE:0, SELL:0 };
    bondData.forEach(b => { counts[b.signal] = (counts[b.signal] || 0) + 1; });
    return counts;
  }, [bondData]);

  const watchList = bondData.filter(b => b.restructureRisk);

  const yieldCurve = useMemo(() => {
    return bondData.slice(0, 15).map(b => ({
      name: b.id, yield: b.yieldEst, duration: b.duration, spread: b.adjSpread,
    }));
  }, [bondData]);

  const handleExport = useCallback(() => {
    const rows = bondData.map(b => ({
      Country:b.name, ID:b.id, Group:b.group, Rating:b.rating, 'Debt/GDP':b.debtGdp,
      'Base Spread (bps)':b.spreadBps, 'Climate Scenario':scenarioView,
      'Climate Add-on (bps)':b.scenarioShock, 'Adjusted Spread (bps)':b.adjSpread,
      Signal:b.signal, Conviction:b.convictionPct+'%', 'Restructure Risk':b.restructureRisk?'YES':'NO',
      'Green Bond Spread (bps)':b.greenPremium, 'Relative Value':b.relValue,
      'Est. Yield':b.yieldEst+'%', Duration:b.duration,
      'External Debt %':b.externalDebtPct, 'FX Reserves (months)':b.fxReserveMonths,
    }));
    exportCsv(rows, `sovereign_dsa_report_${scenarioView}.csv`);
  }, [bondData, scenarioView]);

  return (
    <div>
      {/* Signal KPIs */}
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        {[
          { l:'BUY', v:signalCounts.BUY, c:T.green },
          { l:'HOLD', v:signalCounts.HOLD, c:T.navyL },
          { l:'REDUCE', v:signalCounts.REDUCE, c:T.amber },
          { l:'SELL', v:signalCounts.SELL, c:T.red },
          { l:'Restructure Watch', v:watchList.length, c:T.red },
          { l:'Avg Spread (bps)', v:Math.round(bondData.reduce((a,b)=>a+b.adjSpread,0)/bondData.length), c:T.navy },
        ].map((k, i) => (
          <div key={i} style={sKpi}>
            <div style={{ ...sKpiVal, color:k.c }}>{k.v}</div>
            <div style={sKpiLbl}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Scenario selector + export */}
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        <span style={{ fontSize:11, fontFamily:T.mono, fontWeight:600 }}>Scenario:</span>
        {SCENARIOS.map(sc => (
          <button key={sc.key} onClick={() => setScenarioView(sc.key)} style={sBtn(scenarioView === sc.key)}>{sc.label}</button>
        ))}
        <div style={{ flex:1 }} />
        <button onClick={handleExport} style={{ ...sBtn(true), background:T.navy, color:'#fff', border:`1px solid ${T.navy}` }}>Export DSA Report CSV</button>
      </div>

      {/* Spread sensitivity chart */}
      <div style={sCard}>
        <div style={sCardTitle}>Sovereign Spread Sensitivity \u2014 {SCENARIOS.find(s=>s.key===scenarioView)?.label}</div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={spreadChart} margin={{ top:10, right:20, bottom:50, left:10 }}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{ fontSize:10, fontFamily:T.mono, fill:T.textSec }} height={60} />
            <YAxis tick={{ fontSize:11, fontFamily:T.mono, fill:T.textSec }} unit=" bps" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize:11, fontFamily:T.mono }} />
            <Bar dataKey="Base Spread" stackId="a" fill={T.navyL} />
            <Bar dataKey="Climate Add-on" stackId="a" fill={T.red+'90'} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Portfolio positioning table */}
      <div style={sCard}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={sCardTitle}>Portfolio Positioning \u2014 Climate-Adjusted Sovereign DSA</div>
          <select value={showRows} onChange={e=>setShowRows(+e.target.value)} style={sSelect}>
            <option value={20}>Top 20</option>
            <option value={30}>Top 30</option>
            <option value={60}>All 60</option>
          </select>
        </div>
        <div style={sTblWrap}>
          <table style={sTbl}>
            <thead>
              <tr>
                <th style={sTh}>Country</th>
                <th style={sTh}>Group</th>
                <th style={sTh}>Rating</th>
                <th style={sTh}>Debt/GDP</th>
                <th style={sTh}>Base Sprd</th>
                <th style={sTh}>+Climate</th>
                <th style={sTh}>Adj. Sprd</th>
                <th style={sTh}>Signal</th>
                <th style={sTh}>Conviction</th>
                <th style={sTh}>Yield Est.</th>
                <th style={sTh}>Duration</th>
                <th style={sTh}>Green Prm</th>
                <th style={sTh}>Rel. Value</th>
              </tr>
            </thead>
            <tbody>
              {bondData.slice(0, showRows).map((b, ri) => {
                const sigColor = b.signal === 'BUY' ? T.green : b.signal === 'SELL' ? T.red : b.signal === 'REDUCE' ? T.amber : T.navyL;
                return (
                  <tr key={b.id} style={{ background:ri%2?T.surfaceH:'transparent' }}>
                    <td style={{ ...sTd, fontWeight:600 }}>{b.name}</td>
                    <td style={sTd}><span style={sChip(b.group==='SIDS'?T.red:b.group==='LDC'?T.amber:b.group==='Advanced'?T.green:T.navyL)}>{b.group}</span></td>
                    <td style={sTd}><span style={{ color:ratingColor(b.rating), fontWeight:600 }}>{b.rating}</span></td>
                    <td style={sTd}>{b.debtGdp}%</td>
                    <td style={sTd}>{b.spreadBps}</td>
                    <td style={sTd}><span style={{ color:T.red }}>+{b.scenarioShock}</span></td>
                    <td style={{ ...sTd, fontWeight:700 }}>{b.adjSpread}</td>
                    <td style={sTd}><span style={{ ...sBadge, background:sigColor+'18', color:sigColor }}>{b.signal}</span></td>
                    <td style={sTd}>{b.convictionPct}%</td>
                    <td style={sTd}>{b.yieldEst}%</td>
                    <td style={sTd}>{b.duration}y</td>
                    <td style={sTd}><span style={{ color:b.greenPremium < 0 ? T.green : T.red }}>{b.greenPremium > 0 ? '+' : ''}{b.greenPremium}</span></td>
                    <td style={sTd}><span style={sChip(b.relValue === 'Green Cheap' ? T.green : b.relValue === 'Conv. Cheap' ? T.amber : T.navyL)}>{b.relValue}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={sGrid2}>
        {/* Green vs conventional */}
        <div style={sCard}>
          <div style={sCardTitle}>Green vs Conventional Sovereign Bond Spread</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bondData.slice(0, 20).map(b => ({ name:b.id, premium:b.greenPremium }))} margin={{ top:10, right:20, bottom:50, left:10 }}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{ fontSize:9, fontFamily:T.mono, fill:T.textSec }} height={50} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono, fill:T.textSec }} unit=" bps" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="premium" name="Green Premium (bps)" radius={[4, 4, 0, 0]}>
                {bondData.slice(0, 20).map((b, i) => <Cell key={i} fill={b.greenBondSpread < 0 ? T.green : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Yield curve scatter proxy */}
        <div style={sCard}>
          <div style={sCardTitle}>Yield vs Duration \u2014 Top 15 Widest Spreads</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yieldCurve} margin={{ top:10, right:20, bottom:50, left:10 }}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{ fontSize:9, fontFamily:T.mono, fill:T.textSec }} height={50} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono, fill:T.textSec }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:10, fontFamily:T.mono }} />
              <Bar dataKey="yield" name="Est. Yield (%)" fill={T.gold} radius={[4, 4, 0, 0]} />
              <Bar dataKey="duration" name="Duration (y)" fill={T.navyL+'70'} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Restructuring watch list */}
      <div style={sCard}>
        <div style={sCardTitle}>Debt Restructuring Watch List \u2014 {SCENARIOS.find(s=>s.key===scenarioView)?.label}</div>
        {watchList.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:T.textMut, fontFamily:T.mono }}>No countries on restructuring watch under this scenario</div>
        ) : (
          <div style={sTblWrap}>
            <table style={sTbl}>
              <thead>
                <tr>
                  <th style={sTh}>Country</th>
                  <th style={sTh}>Group</th>
                  <th style={sTh}>Rating</th>
                  <th style={sTh}>Debt/GDP</th>
                  <th style={sTh}>Adj. Spread</th>
                  <th style={sTh}>Ext. Debt %</th>
                  <th style={sTh}>FX Reserves</th>
                  <th style={sTh}>Primary Bal.</th>
                  <th style={sTh}>Risk Flag</th>
                </tr>
              </thead>
              <tbody>
                {watchList.map((w, wi) => (
                  <tr key={w.id} style={{ background:wi%2?T.surfaceH:'transparent' }}>
                    <td style={{ ...sTd, fontWeight:600 }}>{w.name}</td>
                    <td style={sTd}><span style={sChip(w.group==='SIDS'?T.red:w.group==='LDC'?T.amber:T.navyL)}>{w.group}</span></td>
                    <td style={sTd}><span style={{ color:T.red, fontWeight:600 }}>{w.rating}</span></td>
                    <td style={sTd}>{w.debtGdp}%</td>
                    <td style={{ ...sTd, fontWeight:700 }}>{w.adjSpread} bps</td>
                    <td style={sTd}>{w.externalDebtPct}%</td>
                    <td style={sTd}><span style={{ color:w.fxReserveMonths < 3 ? T.red : T.textSec }}>{w.fxReserveMonths}m</span></td>
                    <td style={sTd}><span style={{ color:w.primaryBal < 0 ? T.red : T.green }}>{w.primaryBal}%</span></td>
                    <td style={sTd}><span style={{ ...sBadge, background:T.red+'18', color:T.red }}>RESTRUCTURE RISK</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Article IV Climate Annex Summary */}
      <div style={sCard}>
        <div style={sCardTitle}>IMF Article IV Climate Annex \u2014 Summary Metrics</div>
        <div style={{ fontSize:11, color:T.textMut, fontFamily:T.mono, marginBottom:12 }}>
          Climate-adjusted sovereign risk indicators per IMF Article IV consultation framework
        </div>
        <div style={sTblWrap}>
          <table style={sTbl}>
            <thead>
              <tr>
                <th style={sTh}>Metric</th>
                <th style={sTh}>Current</th>
                <th style={sTh}>2030 (Orderly)</th>
                <th style={sTh}>2030 (Hothouse)</th>
                <th style={sTh}>2050 (Orderly)</th>
                <th style={sTh}>2050 (Hothouse)</th>
                <th style={sTh}>Assessment</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric:'Avg. Debt/GDP', cur:Math.round(bondData.reduce((a,b)=>a+b.debtGdp,0)/bondData.length), o30:'est.', h30:'est.', o50:'est.', h50:'est.' },
                { metric:'Countries >100% D/GDP', cur:bondData.filter(b=>b.debtGdp>100).length, o30:'\u2014', h30:'\u2014', o50:'\u2014', h50:'\u2014' },
                { metric:'Avg. Spread (bps)', cur:Math.round(bondData.reduce((a,b)=>a+b.spreadBps,0)/bondData.length), o30:'\u2014', h30:'\u2014', o50:'\u2014', h50:'\u2014' },
                { metric:'SELL Signals', cur:signalCounts.SELL, o30:'\u2014', h30:'\u2014', o50:'\u2014', h50:'\u2014' },
                { metric:'Restructure Watch', cur:watchList.length, o30:'\u2014', h30:'\u2014', o50:'\u2014', h50:'\u2014' },
                { metric:'SIDS at High Risk', cur:bondData.filter(b=>b.group==='SIDS' && b.adjSpread > 350).length, o30:'\u2014', h30:'\u2014', o50:'\u2014', h50:'\u2014' },
                { metric:'LDCs at High Risk', cur:bondData.filter(b=>b.group==='LDC' && b.adjSpread > 300).length, o30:'\u2014', h30:'\u2014', o50:'\u2014', h50:'\u2014' },
              ].map((row, ri) => (
                <tr key={ri} style={{ background:ri%2?T.surfaceH:'transparent' }}>
                  <td style={{ ...sTd, fontWeight:600 }}>{row.metric}</td>
                  <td style={{ ...sTd, fontWeight:700 }}>{row.cur}</td>
                  <td style={sTd}>{row.o30}</td>
                  <td style={sTd}>{row.h30}</td>
                  <td style={sTd}>{row.o50}</td>
                  <td style={sTd}>{row.h50}</td>
                  <td style={sTd}>
                    <span style={sChip(typeof row.cur === 'number' && row.cur > 5 ? T.red : T.green)}>
                      {typeof row.cur === 'number' && row.cur > 10 ? 'Critical' : typeof row.cur === 'number' && row.cur > 5 ? 'Warning' : 'Stable'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop:12, display:'flex', gap:16 }}>
          {[
            { label:'Portfolio Average Duration', value:`${fmt(bondData.reduce((a,b)=>a+b.duration,0)/bondData.length, 1)}y` },
            { label:'Portfolio Average Yield', value:`${fmt(bondData.reduce((a,b)=>a+b.yieldEst,0)/bondData.length, 2)}%` },
            { label:'Green Bond Coverage', value:`${bondData.filter(b=>b.greenPremium < 0).length} / ${bondData.length}` },
          ].map((m, mi) => (
            <div key={mi} style={{ fontSize:11, fontFamily:T.mono }}>
              <span style={{ color:T.textMut }}>{m.label}: </span>
              <span style={{ fontWeight:700, color:T.navy }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */
export default function SovereignDebtSustainabilityPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={sPage}>
      {/* Header */}
      <div style={sHeader}>
        <div>
          <div style={sTitle}>Climate-Adjusted Sovereign Debt Sustainability</div>
          <div style={sSub}>EP-AQ2 | DSA models incorporating climate costs, fiscal impact analysis, IMF Article IV-style climate annexes</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ ...sBadge, background:T.red+'18', color:T.red }}>60 COUNTRIES</span>
          <span style={{ ...sBadge, background:T.navy+'18', color:T.navy }}>4 SCENARIOS</span>
          <span style={{ ...sBadge, background:T.sage+'18', color:T.sage }}>2024\u20132050</span>
          <span style={{ ...sBadge, background:T.gold+'18', color:T.gold }}>IMF DSA</span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={sTabBar}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={sTab(tab === i)}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 0 && <DebtTrajectoryTab countries={COUNTRIES} />}
      {tab === 1 && <FiscalClimateTab countries={COUNTRIES} />}
      {tab === 2 && <VulnerabilityTab countries={COUNTRIES} />}
      {tab === 3 && <InvestmentTab countries={COUNTRIES} />}

      {/* Footer */}
      <div style={{ marginTop:24, padding:'12px 0', borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:10, color:T.textMut, fontFamily:T.mono }}>
          Methodology: IMF-WB DSA Framework | NGFS Phase IV Scenarios | IPCC AR6 Physical Risk | Fiscal space per IMF Article IV
        </span>
        <span style={{ fontSize:10, color:T.textMut, fontFamily:T.mono }}>
          Last updated: 2026-03-28 | {COUNTRIES.length} sovereigns | {YEARS.length} projection years | {SCENARIOS.length} climate scenarios
        </span>
      </div>
    </div>
  );
}
