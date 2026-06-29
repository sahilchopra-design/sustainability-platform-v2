import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const T = {
  bg: '#0f172a', surface: '#1e293b', surfaceH: '#263248', border: '#334155', borderL: '#2d3f55',
  navy: '#60a5fa', navyL: '#93c5fd', gold: '#fbbf24', goldL: '#fcd34d',
  sage: '#34d399', sageL: '#6ee7b7', teal: '#2dd4bf', text: '#f1f5f9',
  textSec: '#94a3b8', textMut: '#64748b', red: '#f87171', green: '#4ade80',
  amber: '#fb923c', font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const ACCENT = '#34d399';
const COLORS = [T.navy, T.gold, T.sage, T.teal, T.amber, T.red, T.navyL, T.goldL, '#a78bfa', '#f472b6'];
const tip = { contentStyle: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, fontFamily: T.font }, labelStyle: { color: T.textSec, fontSize: 10 } };

const TABS = ['Portfolio Builder', 'Efficient Frontier', 'ITR Analysis', 'Constraint Analysis', 'Rebalancing', 'Engagement', 'Factor Model', 'Attribution', 'Benchmark', 'Optimization Engine', 'Reporting'];
const SECTORS = ['All', 'Technology', 'Financials', 'Healthcare', 'Energy', 'Consumer', 'Industrials', 'Materials', 'Utilities'];
const PAGE = 15;

const NAMES = [
  'Apple','Microsoft','Alphabet','Amazon','NVIDIA','Meta','Tesla','Broadcom','Cisco','AMD',
  'Qualcomm','Intel','Adobe','Salesforce','ServiceNow','CrowdStrike','Snowflake','Datadog','Intuit','PayPal',
  'JPMorgan','Visa','Mastercard','Goldman Sachs','Morgan Stanley','Bank of America','Citigroup','Wells Fargo','American Express','BlackRock',
  'Vanguard Financial','State Street','Invesco','T. Rowe Price','Charles Schwab','CME Group','Intercontinental','Nasdaq','S&P Global','MSCI',
  'UnitedHealth','J&J','Pfizer','Abbott','Eli Lilly','Merck','Amgen','Medtronic','Intuitive Surgical','Becton Dickinson',
  'Edwards Lifesciences','ResMed','Danaher','Thermo Fisher','Agilent','Mettler-Toledo','Bio-Techne','IQVIA','Labcorp','Quest Diagnostics',
  'Walmart','P&G','Coca-Cola','PepsiCo','Costco','McDonalds','Starbucks','Nike','Home Depot','Caterpillar',
  'Honeywell','Lockheed Martin','Deere & Co','GE Aerospace','Boeing','Raytheon','Northrop Grumman','L3Harris','General Dynamics','Parker Hannifin',
  'Chevron','ExxonMobil','ConocoPhillips','Pioneer Natural','Hess Corp','Schlumberger','Halliburton','Baker Hughes','Marathon Petroleum','Valero Energy',
  'NextEra Energy','Duke Energy','Southern Co','Dominion Energy','Xcel Energy','AES Corp','Eversource','WEC Energy','CMS Energy','Entergy',
  'Shell','BP','TotalEnergies','Equinor','Repsol','ENI','Nestle','Roche','Novartis','SAP',
  'Siemens','BASF','LVMH','Unilever','HSBC','BNP Paribas','AXA','Allianz','Munich Re','Zurich Insurance',
  'Enel','Iberdrola','Orsted','Brookfield Renewable','RWE','E.ON','EDF','Engie','SSE','Drax Group',
  'Acciona Energia','Neoen','Voltalia','Encavis','Boralex','Innergex','Solaria','Lightsource BP','Greenvolt','Enersis',
  'Toyota','Samsung','TSMC','Novo Nordisk','BHP','Rio Tinto','AbbVie','Tata Power','Adani Green','ReNew Power',
  'CATL','BYD','Panasonic','LG Energy Solution','SK Innovation','Posco Holdings','Nippon Steel','Mitsubishi Corp','Hitachi','Fujitsu',
  'First Solar','Enphase Energy','SolarEdge','Vestas Wind','Siemens Gamesa','GE Vernova','Plug Power','Ballard Power','Nel ASA','ITM Power',
  'Bloom Energy','Ceres Power','Air Products','Linde','Air Liquide','Chart Industries','Fortescue Metals','Anglo American','Glencore','Vale',
  'ArcelorMittal','Nucor','US Steel','Tata Steel','JSW Steel','Alcoa','Norsk Hydro','Vedanta','Hindalco','Holcim',
  'LafargeHolcim','HeidelbergCement','Cemex','Saint-Gobain','CRH','Vulcan Materials','Dow Chemical','LyondellBasell','Eastman Chemical','3M Company'
];

const SECS = [
  'Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology',
  'Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology',
  'Financials','Financials','Financials','Financials','Financials','Financials','Financials','Financials','Financials','Financials',
  'Financials','Financials','Financials','Financials','Financials','Financials','Financials','Financials','Financials','Financials',
  'Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare',
  'Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare','Healthcare',
  'Consumer','Consumer','Consumer','Consumer','Consumer','Consumer','Consumer','Consumer','Consumer','Industrials',
  'Industrials','Industrials','Industrials','Industrials','Industrials','Industrials','Industrials','Industrials','Industrials','Industrials',
  'Energy','Energy','Energy','Energy','Energy','Energy','Energy','Energy','Energy','Energy',
  'Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities',
  'Energy','Energy','Energy','Energy','Energy','Energy','Consumer','Healthcare','Healthcare','Technology',
  'Industrials','Materials','Consumer','Consumer','Financials','Financials','Financials','Financials','Financials','Financials',
  'Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities',
  'Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities','Utilities',
  'Industrials','Technology','Technology','Healthcare','Materials','Materials','Healthcare','Utilities','Utilities','Utilities',
  'Technology','Technology','Technology','Technology','Technology','Materials','Materials','Industrials','Technology','Technology',
  'Utilities','Utilities','Utilities','Utilities','Industrials','Industrials','Energy','Energy','Energy','Energy',
  'Energy','Energy','Materials','Materials','Materials','Industrials','Materials','Materials','Materials','Materials',
  'Materials','Materials','Materials','Materials','Materials','Materials','Materials','Materials','Materials','Materials',
  'Materials','Materials','Materials','Materials','Materials','Materials','Materials','Materials','Materials','Industrials'
];

const HOLDINGS = Array.from({ length: 200 }, (_, i) => {
  const wt = +(sr(i * 7) * 2.5 + 0.1).toFixed(2);
  const itr = +(sr(i * 11) * 3.2 + 0.7).toFixed(1);
  const ci = Math.round(sr(i * 13) * 400 + 5);
  const ret = +((sr(i * 17) - 0.3) * 22).toFixed(1);
  const vol = +(sr(i * 19) * 18 + 4).toFixed(1);
  return {
    id: i + 1, name: NAMES[i], sector: SECS[i], weightPct: wt, itr,
    carbonIntensity: ci, greenRevPct: Math.round(sr(i * 23) * 60),
    sbti: sr(i * 29) < 0.35 ? 'Approved' : sr(i * 29) < 0.65 ? 'Committed' : 'None',
    expectedReturn: ret, volatility: vol, sharpe: +(ret / Math.max(1, vol)).toFixed(2),
    esgScore: Math.round(sr(i * 31) * 40 + 50),
    trackingError: +(sr(i * 37) * 3 + 0.5).toFixed(1),
    beta: +(sr(i * 41) * 0.6 + 0.6).toFixed(2),
    divYield: +(sr(i * 43) * 5).toFixed(1),
    engagementStatus: sr(i * 53) < 0.25 ? 'Escalated' : sr(i * 53) < 0.55 ? 'Active' : 'Monitoring',
    targetYear: 2028 + Math.round(sr(i * 59) * 22),
    reductionPct: Math.round(sr(i * 61) * 55 + 15),
    transitionRisk: Math.round(sr(i * 71) * 80 + 10),
    physicalRisk: Math.round(sr(i * 73) * 70 + 10),
    climateVaR: +(sr(i * 79) * 8 + 0.5).toFixed(1),
    greenBondIssuer: sr(i * 83) < 0.35,
    nzamSignatory: sr(i * 89) < 0.45,
    pcafScore: Math.round(sr(i * 91) * 4 + 1),
    waci: Math.round(sr(i * 97) * 200 + 20),
  };
});

const FRONTIER = Array.from({ length: 25 }, (_, i) => ({
  risk: +(2.5 + i * 0.75).toFixed(1),
  returnNZ: +(1.8 + i * 0.52 + sr(i * 7) * 0.4).toFixed(1),
  returnBM: +(1.3 + i * 0.58 + sr(i * 11) * 0.3).toFixed(1),
  returnPAB: +(1.5 + i * 0.49 + sr(i * 13) * 0.35).toFixed(1),
}));

const PATHWAY_DATA = Array.from({ length: 13 }, (_, i) => ({
  year: `${2019 + i * 2}`,
  'Portfolio ITR': +(3.1 - i * 0.13 + sr(i * 7) * 0.07).toFixed(2),
  '1.5°C Target': 1.5, '2°C Target': 2.0,
  'Sector Avg': +(3.4 - i * 0.09 + sr(i * 11) * 0.06).toFixed(2),
  'MSCI ACWI': +(3.2 - i * 0.10 + sr(i * 13) * 0.05).toFixed(2),
}));

const ENGAGEMENT_DATA = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
  meetings: Math.round(sr(i * 7) * 12 + 6),
  milestones: Math.round(sr(i * 11) * 5 + 2),
  escalations: Math.round(sr(i * 13) * 3),
  resolved: Math.round(sr(i * 17) * 4 + 1),
}));

const CLIMATE_FACTORS = [
  { id: 'tr', name: 'Transition Risk', desc: 'Carbon pricing, policy & stranded asset exposure', portfolioLoading: 0.42, bmLoading: 0.61, returnContrib: -1.8, volContrib: 2.3, color: T.red },
  { id: 'pr', name: 'Physical Risk', desc: 'Acute & chronic physical climate hazard exposure', portfolioLoading: 0.38, bmLoading: 0.55, returnContrib: -0.9, volContrib: 1.4, color: T.amber },
  { id: 'gr', name: 'Green Revenue', desc: 'Taxonomy-aligned green revenue premium factor', portfolioLoading: 0.34, bmLoading: 0.18, returnContrib: 2.1, volContrib: 1.1, color: T.sage },
  { id: 'ce', name: 'Carbon Efficiency', desc: 'Low-carbon intensity outperformance factor', portfolioLoading: 0.47, bmLoading: 0.29, returnContrib: 1.6, volContrib: 0.8, color: T.teal },
  { id: 'em', name: 'ESG Momentum', desc: 'Improving ESG score trajectory premium', portfolioLoading: 0.28, bmLoading: 0.21, returnContrib: 0.7, volContrib: 0.6, color: T.navy },
];

const FACTOR_RETURNS = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
  'Transition Risk': +((sr(i * 7) - 0.52) * 4).toFixed(2),
  'Physical Risk': +((sr(i * 11) - 0.5) * 3).toFixed(2),
  'Green Revenue': +((sr(i * 13) - 0.4) * 5).toFixed(2),
  'Carbon Efficiency': +((sr(i * 17) - 0.45) * 3.5).toFixed(2),
  'ESG Momentum': +((sr(i * 19) - 0.48) * 2.5).toFixed(2),
}));

const ATTRIBUTION_SECTOR = ['Technology','Financials','Healthcare','Consumer','Industrials','Materials','Energy','Utilities'].map((sec, i) => ({
  sector: sec,
  allocation: +((sr(i * 7) - 0.45) * 5).toFixed(2),
  selection: +((sr(i * 11) - 0.4) * 6).toFixed(2),
  interaction: +((sr(i * 13) - 0.48) * 2).toFixed(2),
  get total() { return +(this.allocation + this.selection + this.interaction).toFixed(2); }
}));

const ATTRIBUTION_ITR = [
  { bucket: '≤1.5°C', allocation: 1.2, selection: 0.8, interaction: 0.3, total: 2.3 },
  { bucket: '1.5–2.0', allocation: 0.4, selection: 0.2, interaction: 0.1, total: 0.7 },
  { bucket: '2.0–2.5', allocation: -0.3, selection: -0.5, interaction: -0.1, total: -0.9 },
  { bucket: '2.5–3.0', allocation: -0.8, selection: -0.7, interaction: -0.2, total: -1.7 },
  { bucket: '>3.0', allocation: -1.4, selection: -1.1, interaction: -0.4, total: -2.9 },
];

const BENCHMARKS = [
  { name: 'This Portfolio', itr: 2.1, waci: 95, greenRev: 28, sbtiCov: 62, carbonFoot: 88, esg: 71, pa: 41, color: ACCENT },
  { name: 'MSCI ACWI', itr: 2.9, waci: 185, greenRev: 12, sbtiCov: 18, carbonFoot: 198, esg: 58, pa: 14, color: T.navy },
  { name: 'Paris-Aligned BM', itr: 1.7, waci: 72, greenRev: 38, sbtiCov: 74, carbonFoot: 61, esg: 78, pa: 68, color: T.sage },
  { name: 'S&P 500', itr: 2.7, waci: 162, greenRev: 14, sbtiCov: 22, carbonFoot: 175, esg: 60, pa: 18, color: T.gold },
  { name: 'MSCI ESG Leaders', itr: 2.3, waci: 118, greenRev: 22, sbtiCov: 45, carbonFoot: 121, esg: 74, pa: 32, color: T.teal },
];

const BENCHMARK_MULTI = ['ITR°C','WACI/10','Green Rev%','SBTi Cov%','Carbon Fpt/10','ESG Score','Paris Algn%'].map((metric, i) => ({
  metric,
  portfolio: [2.1, 9.5, 28, 62, 8.8, 71, 41][i],
  msciAcwi: [2.9, 18.5, 12, 18, 19.8, 58, 14][i],
  pab: [1.7, 7.2, 38, 74, 6.1, 78, 68][i],
}));

const OPT_FRONTIER = Array.from({ length: 16 }, (_, i) => {
  const itrLimit = +(3.8 - i * 0.15).toFixed(1);
  const count = Math.min(200, Math.round(60 + i * 8.5 + sr(i * 7) * 5));
  const ret = +(6.8 - i * 0.18 + sr(i * 7) * 0.15).toFixed(1);
  const vol = +(12.5 - i * 0.22 + sr(i * 11) * 0.1).toFixed(1);
  return { itrLimit, count, return: ret, volatility: vol, sharpe: +(ret / Math.max(1, vol)).toFixed(2) };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const cS = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 };

export default function NetZeroPortfolioBuilderPage() {
  const [tab, setTab] = useState('Portfolio Builder');
  const [search, setSearch] = useState('');
  const [sectorF, setSectorF] = useState('All');
  const [sortCol, setSortCol] = useState('weightPct');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [maxCarbon, setMaxCarbon] = useState(200);
  const [minGreen, setMinGreen] = useState(5);
  const [maxITR, setMaxITR] = useState(2.5);
  const [factorView, setFactorView] = useState('exposures');
  const [attrDim, setAttrDim] = useState('sector');
  const [optITR, setOptITR] = useState(2.0);
  const [optCarbon, setOptCarbon] = useState(150);
  const [optMinGreen, setOptMinGreen] = useState(10);

  const filtered = useMemo(() => {
    let d = [...HOLDINGS];
    if (search) d = d.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    if (sectorF !== 'All') d = d.filter(r => r.sector === sectorF);
    d.sort((a, b) => sortDir === 'asc' ? (a[sortCol] > b[sortCol] ? 1 : -1) : (a[sortCol] < b[sortCol] ? 1 : -1));
    return d;
  }, [search, sectorF, sortCol, sortDir]);

  const constrained = useMemo(() =>
    filtered.filter(h => h.carbonIntensity <= maxCarbon && h.greenRevPct >= minGreen && h.itr <= maxITR),
    [filtered, maxCarbon, minGreen, maxITR]);

  const paged = useMemo(() => constrained.slice((page - 1) * PAGE, page * PAGE), [constrained, page]);
  const totalPages = Math.ceil(constrained.length / PAGE);

  const doSort = col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(1);
  };

  const stats = useMemo(() => {
    const d = constrained;
    const n = Math.max(1, d.length);
    const totalWt = Math.max(0.01, d.reduce((s, r) => s + r.weightPct, 0));
    return {
      count: d.length,
      avgCI: Math.round(d.reduce((s, r) => s + r.carbonIntensity, 0) / n),
      avgGreen: Math.round(d.reduce((s, r) => s + r.greenRevPct, 0) / n),
      avgRet: (d.reduce((s, r) => s + r.expectedReturn, 0) / n).toFixed(1),
      avgVol: (d.reduce((s, r) => s + r.volatility, 0) / n).toFixed(1),
      sbtiApproved: d.filter(r => r.sbti === 'Approved').length,
      sbtiCommitted: d.filter(r => r.sbti === 'Committed').length,
      weightedITR: (d.reduce((s, r) => s + r.itr * r.weightPct, 0) / totalWt).toFixed(2),
      avgWACI: Math.round(d.reduce((s, r) => s + r.waci, 0) / n),
      climateVaR: (d.reduce((s, r) => s + r.climateVaR, 0) / n).toFixed(1),
      greenBondIssuers: d.filter(r => r.greenBondIssuer).length,
      nzamSignatories: d.filter(r => r.nzamSignatory).length,
    };
  }, [constrained]);

  const sectorAlloc = useMemo(() => {
    const m = {};
    constrained.forEach(h => { m[h.sector] = (m[h.sector] || 0) + h.weightPct; });
    return Object.entries(m).map(([k, v]) => ({ sector: k, weight: +v.toFixed(1) })).sort((a, b) => b.weight - a.weight);
  }, [constrained]);

  const optPortfolio = useMemo(() => {
    const d = HOLDINGS.filter(h => h.itr <= optITR && h.carbonIntensity <= optCarbon && h.greenRevPct >= optMinGreen);
    const n = Math.max(1, d.length);
    const totalWt = Math.max(0.01, d.reduce((s, r) => s + r.weightPct, 0));
    return {
      count: d.length,
      weightedITR: (d.reduce((s, r) => s + r.itr * r.weightPct, 0) / totalWt).toFixed(2),
      avgReturn: (d.reduce((s, r) => s + r.expectedReturn, 0) / n).toFixed(1),
      avgVol: (d.reduce((s, r) => s + r.volatility, 0) / n).toFixed(1),
      sharpe: (d.reduce((s, r) => s + r.sharpe, 0) / n).toFixed(2),
      avgCI: Math.round(d.reduce((s, r) => s + r.carbonIntensity, 0) / n),
      sbtiCov: Math.round((d.filter(r => r.sbti !== 'None').length / n) * 100),
      greenRev: Math.round(d.reduce((s, r) => s + r.greenRevPct, 0) / n),
    };
  }, [optITR, optCarbon, optMinGreen]);

  const exportCSV = useCallback((data, fn) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(r => keys.map(k => `"${r[k]}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fn; a.click();
    URL.revokeObjectURL(url);
  }, []);

  const si = (col, cur, dir) => cur === col ? (dir === 'asc' ? ' ▲' : ' ▼') : ' ○';
  const tabBtn = t => ({
    padding: '6px 12px', border: `1px solid ${tab === t ? ACCENT : T.border}`,
    borderRadius: 6, fontSize: 11, fontFamily: T.font, cursor: 'pointer',
    background: tab === t ? ACCENT : T.surface, color: tab === t ? '#0f172a' : T.textSec, fontWeight: tab === t ? 600 : 400,
  });
  const thS = { padding: '8px 10px', fontSize: 11, fontFamily: T.mono, color: T.textSec, cursor: 'pointer', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap', userSelect: 'none', textAlign: 'left', background: T.surfaceH };
  const tdS = { padding: '7px 10px', fontSize: 12, fontFamily: T.font, borderBottom: `1px solid ${T.border}`, color: T.text };
  const inpS = { padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: T.font, background: T.surface, color: T.text, outline: 'none', width: 180 };
  const selS = { padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, fontFamily: T.font, background: T.surface, color: T.text };
  const sliderS = { width: '100%', accentColor: ACCENT };
  const pgB = { padding: '4px 10px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, cursor: 'pointer', background: T.surface, color: T.text };

  const Panel = ({ item, onClose }) => {
    if (!item) return null;
    return (
      <div style={{ position: 'fixed', top: 0, right: 0, width: 460, height: '100vh', background: T.surface, borderLeft: `2px solid ${ACCENT}`, zIndex: 1000, overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{item.name}</div><div style={{ fontSize: 12, color: T.textSec }}>{item.sector}</div></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.textMut }}>✕</button>
        </div>
        <div style={{ padding: '16px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[['Weight', item.weightPct + '%'],['ITR', item.itr + '°C'],['Carbon CI', item.carbonIntensity],['Green Rev', item.greenRevPct + '%'],['SBTi', item.sbti],['E[Return]', item.expectedReturn + '%'],['Volatility', item.volatility + '%'],['Sharpe', item.sharpe],['ESG Score', item.esgScore + '/100'],['TE', item.trackingError + '%'],['Beta', item.beta],['Div Yield', item.divYield + '%'],['Trans Risk', item.transitionRisk + '/100'],['Phys Risk', item.physicalRisk + '/100'],['Climate VaR', item.climateVaR + '%'],['WACI', item.waci],['PCAF DQS', item.pcafScore + '/5'],['Engagement', item.engagementStatus]].map(([k, v], j) => (
              <div key={j} style={{ background: T.surfaceH, borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const SECT_LIST = ['Technology','Financials','Healthcare','Consumer','Industrials','Materials','Energy','Utilities'];

  return (
    <div style={{ padding: '24px 32px', fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Net Zero Portfolio Builder</h1>
        <p style={{ fontSize: 12, color: T.textSec, margin: '4px 0 0' }}>200 holdings · Climate factor model · ITR constraint optimizer · 5-benchmark comparison · Attribution engine</p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={tabBtn(t)}>{t}</button>)}
      </div>

      {tab === 'Portfolio Builder' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Holdings" value={stats.count} sub="of 200 total" />
            <KpiCard label="Weighted ITR" value={`${stats.weightedITR}°C`} color={+stats.weightedITR < 1.5 ? T.green : +stats.weightedITR < 2 ? T.sage : T.amber} />
            <KpiCard label="WACI" value={stats.avgWACI} color={T.amber} sub="tCO₂e/$M revenue" />
            <KpiCard label="Avg Green Revenue" value={`${stats.avgGreen}%`} color={T.sage} />
            <KpiCard label="Climate VaR" value={`${stats.climateVaR}%`} color={T.red} sub="95% confidence" />
            <KpiCard label="SBTi Approved" value={stats.sbtiApproved} color={T.green} />
          </div>
          <div style={{ ...cS, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Portfolio Constraints</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Max Carbon Intensity: <strong style={{ color: T.text }}>{maxCarbon} tCO₂e/$M</strong></div>
                <input type="range" min={50} max={600} value={maxCarbon} onChange={e => { setMaxCarbon(+e.target.value); setPage(1); }} style={sliderS} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Min Green Revenue: <strong style={{ color: T.text }}>{minGreen}%</strong></div>
                <input type="range" min={0} max={60} value={minGreen} onChange={e => { setMinGreen(+e.target.value); setPage(1); }} style={sliderS} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Max ITR: <strong style={{ color: T.text }}>{maxITR}°C</strong></div>
                <input type="range" min={10} max={45} value={Math.round(maxITR * 10)} onChange={e => { setMaxITR(+(e.target.value / 10).toFixed(1)); setPage(1); }} style={sliderS} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search holdings..." style={inpS} />
            <select value={sectorF} onChange={e => { setSectorF(e.target.value); setPage(1); }} style={selS}>
              {SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => exportCSV(constrained, 'nz_portfolio.csv')} style={{ padding: '6px 16px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, background: T.surface, color: T.text, cursor: 'pointer' }}>Export CSV</button>
            <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono }}>{stats.count} / 200 pass constraints</span>
          </div>
          <div style={{ overflowX: 'auto', ...cS, padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{[['name','Holding'],['sector','Sector'],['weightPct','Wt%'],['itr','ITR'],['carbonIntensity','Carbon CI'],['greenRevPct','Green%'],['transitionRisk','Trans'],['physicalRisk','Phys'],['expectedReturn','E[R]%'],['esgScore','ESG'],['sbti','SBTi']].map(([k, l]) => (
                  <th key={k} onClick={() => doSort(k)} style={thS}>{l}{si(k, sortCol, sortDir)}</th>
                ))}</tr>
              </thead>
              <tbody>
                {paged.map(r => (
                  <tr key={r.id} onClick={() => setSelected(r)} style={{ cursor: 'pointer', background: selected?.id === r.id ? T.surfaceH : 'transparent' }}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{r.name}</td>
                    <td style={tdS}>{r.sector}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{r.weightPct}%</td>
                    <td style={tdS}><span style={{ color: r.itr < 1.5 ? T.green : r.itr < 2 ? T.sage : r.itr < 2.5 ? T.amber : T.red, fontWeight: 600 }}>{r.itr}°C</span></td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{r.carbonIntensity}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{r.greenRevPct}%</td>
                    <td style={tdS}><span style={{ color: r.transitionRisk > 60 ? T.red : r.transitionRisk > 40 ? T.amber : T.sage, fontFamily: T.mono, fontSize: 11 }}>{r.transitionRisk}</span></td>
                    <td style={tdS}><span style={{ color: r.physicalRisk > 55 ? T.red : r.physicalRisk > 35 ? T.amber : T.sage, fontFamily: T.mono, fontSize: 11 }}>{r.physicalRisk}</span></td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: r.expectedReturn > 0 ? T.green : T.red }}>{r.expectedReturn}%</td>
                    <td style={tdS}>{r.esgScore}</td>
                    <td style={tdS}><span style={{ color: r.sbti === 'Approved' ? T.green : r.sbti === 'Committed' ? T.amber : T.textMut, fontSize: 11 }}>{r.sbti}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 12, alignItems: 'center', justifyContent: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pgB}>«</button>
              <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono }}>Page {page}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pgB}>»</button>
            </div>
          )}
        </div>
      )}

      {tab === 'Efficient Frontier' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Efficient Frontier: Net Zero vs Benchmarks</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={FRONTIER}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="risk" tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'Risk (%)', position: 'bottom', fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'Return (%)', angle: -90, position: 'left', fontSize: 10, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Line type="monotone" dataKey="returnNZ" stroke={ACCENT} strokeWidth={2} name="Net Zero" dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="returnBM" stroke={T.textMut} strokeWidth={2} name="Benchmark" dot={{ r: 2 }} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="returnPAB" stroke={T.navy} strokeWidth={2} name="Paris-Aligned BM" dot={{ r: 2 }} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Sector Allocation</div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={sectorAlloc} cx="50%" cy="50%" outerRadius={100} dataKey="weight" nameKey="sector">
                    {sectorAlloc.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tip} />
                  <Legend formatter={v => <span style={{ fontSize: 10, color: T.textSec }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...cS, gridColumn: '1/3' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Return vs Carbon Intensity (Constrained Holdings)</div>
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Carbon CI" tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'Carbon Intensity (tCO₂e/$M)', position: 'bottom', fontSize: 9, fill: T.textSec }} />
                  <YAxis dataKey="y" name="E[R]%" tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Scatter data={constrained.map(h => ({ name: h.name, x: h.carbonIntensity, y: h.expectedReturn }))} fill={ACCENT} fillOpacity={0.4} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'ITR Analysis' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Weighted ITR" value={`${stats.weightedITR}°C`} color={+stats.weightedITR < 1.5 ? T.green : +stats.weightedITR < 2 ? T.sage : T.amber} />
            <KpiCard label="Aligned ≤1.5°C" value={constrained.filter(h => h.itr <= 1.5).length} color={T.green} sub="holdings" />
            <KpiCard label="Aligned ≤2.0°C" value={constrained.filter(h => h.itr <= 2.0).length} color={T.sage} sub="holdings" />
            <KpiCard label="High Risk >3°C" value={constrained.filter(h => h.itr > 3.0).length} color={T.red} sub="holdings" />
            <KpiCard label="WACI" value={stats.avgWACI} color={T.amber} sub="tCO₂e/$M" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Portfolio ITR Pathway vs Targets</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={PATHWAY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis domain={[1, 4]} tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Line type="monotone" dataKey="Portfolio ITR" stroke={T.navy} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="1.5°C Target" stroke={T.green} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="2°C Target" stroke={T.amber} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="Sector Avg" stroke={T.red} strokeWidth={1} strokeDasharray="2 4" dot={false} />
                  <Line type="monotone" dataKey="MSCI ACWI" stroke={T.textMut} strokeWidth={1} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>ITR Distribution</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { r: '≤1.5°C', c: constrained.filter(h => h.itr <= 1.5).length },
                  { r: '1.5–2.0', c: constrained.filter(h => h.itr > 1.5 && h.itr <= 2).length },
                  { r: '2.0–2.5', c: constrained.filter(h => h.itr > 2 && h.itr <= 2.5).length },
                  { r: '2.5–3.0', c: constrained.filter(h => h.itr > 2.5 && h.itr <= 3).length },
                  { r: '>3.0', c: constrained.filter(h => h.itr > 3).length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="r" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="c" radius={[4, 4, 0, 0]}>
                    {[T.green, T.sage, T.amber, T.gold, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...cS, gridColumn: '1/3' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Weighted ITR by Sector</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={SECT_LIST.map(sec => {
                  const sh = constrained.filter(h => h.sector === sec);
                  const totalWt = Math.max(0.01, sh.reduce((s, r) => s + r.weightPct, 0));
                  const n = Math.max(1, sh.length);
                  return { sector: sec, 'Weighted ITR': +(sh.reduce((s, r) => s + r.itr * r.weightPct, 0) / totalWt).toFixed(2), 'Avg ITR': +(sh.reduce((s, r) => s + r.itr, 0) / n).toFixed(2) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis domain={[0, 4]} tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Bar dataKey="Weighted ITR" fill={T.navy} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Avg ITR" fill={T.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Constraint Analysis' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>SBTi Status Distribution</div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={[
                    { n: 'Approved', v: constrained.filter(h => h.sbti === 'Approved').length },
                    { n: 'Committed', v: constrained.filter(h => h.sbti === 'Committed').length },
                    { n: 'None', v: constrained.filter(h => h.sbti === 'None').length },
                  ]} cx="50%" cy="50%" outerRadius={90} dataKey="v" nameKey="n" label={({ n, v }) => `${n}: ${v}`}>
                    {[T.green, T.amber, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip {...tip} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Green Revenue Distribution</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { r: '0–10%', c: constrained.filter(h => h.greenRevPct < 10).length },
                  { r: '10–25%', c: constrained.filter(h => h.greenRevPct >= 10 && h.greenRevPct < 25).length },
                  { r: '25–50%', c: constrained.filter(h => h.greenRevPct >= 25 && h.greenRevPct < 50).length },
                  { r: '≥50%', c: constrained.filter(h => h.greenRevPct >= 50).length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="r" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="c" fill={T.sage} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Transition vs Physical Risk Scatter</div>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Transition Risk" tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'Transition Risk', position: 'bottom', fontSize: 9, fill: T.textSec }} />
                  <YAxis dataKey="y" name="Physical Risk" tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Scatter data={constrained.map(h => ({ name: h.name, x: h.transitionRisk, y: h.physicalRisk }))} fill={T.red} fillOpacity={0.5} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Climate VaR by Sector</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={SECT_LIST.map(sec => {
                  const sh = constrained.filter(h => h.sector === sec);
                  const n = Math.max(1, sh.length);
                  return { sector: sec, climateVaR: +(sh.reduce((s, r) => s + r.climateVaR, 0) / n).toFixed(1) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 8, fill: T.textSec }} angle={-15} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="climateVaR" fill={T.red} radius={[4, 4, 0, 0]} name="Avg Climate VaR%" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Rebalancing' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Top 20 Holdings by Weight</div>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={[...constrained].sort((a, b) => b.weightPct - a.weightPct).slice(0, 20)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 7, fill: T.textSec }} width={95} />
                  <Tooltip {...tip} />
                  <Bar dataKey="weightPct" fill={T.navy} radius={[0, 4, 4, 0]} name="Weight%" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>ESG Score vs Carbon Intensity</div>
              <ResponsiveContainer width="100%" height={380}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="ESG Score" tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'ESG Score', position: 'bottom', fontSize: 9, fill: T.textSec }} />
                  <YAxis dataKey="y" name="Carbon CI" tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Scatter data={constrained.map(h => ({ name: h.name, x: h.esgScore, y: h.carbonIntensity }))} fill={T.gold} fillOpacity={0.5} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Engagement' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Under Engagement" value={constrained.filter(h => h.engagementStatus !== 'Monitoring').length} />
            <KpiCard label="Escalated" value={constrained.filter(h => h.engagementStatus === 'Escalated').length} color={T.red} />
            <KpiCard label="Active Dialogue" value={constrained.filter(h => h.engagementStatus === 'Active').length} color={T.amber} />
            <KpiCard label="NZAM Signatories" value={stats.nzamSignatories} color={T.sage} sub="in portfolio" />
            <KpiCard label="Green Bond Issuers" value={stats.greenBondIssuers} color={T.teal} sub="in portfolio" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Engagement Activity 2025</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ENGAGEMENT_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Bar dataKey="meetings" fill={T.navy} radius={[4, 4, 0, 0]} name="Meetings" />
                  <Bar dataKey="milestones" fill={T.sage} radius={[4, 4, 0, 0]} name="Milestones" />
                  <Bar dataKey="escalations" fill={T.red} radius={[4, 4, 0, 0]} name="Escalations" />
                  <Bar dataKey="resolved" fill={T.green} radius={[4, 4, 0, 0]} name="Resolved" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>Priority Escalation Queue</div>
              <div style={{ overflowY: 'auto', maxHeight: 280 }}>
                {constrained.filter(h => h.engagementStatus === 'Escalated').slice(0, 15).map((h, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{h.name}</div>
                      <div style={{ fontSize: 10, color: T.textSec }}>{h.sector} · ITR: {h.itr}°C · Trans Risk: {h.transitionRisk}/100 · Target: {h.targetYear}</div>
                    </div>
                    <span style={{ color: T.red, fontSize: 11, fontFamily: T.mono }}>Escalated</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Factor Model' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: T.textSec }}>View:</span>
            {['exposures', 'returns', 'attribution'].map(v => (
              <button key={v} onClick={() => setFactorView(v)} style={{ padding: '5px 14px', border: `1px solid ${factorView === v ? T.navy : T.border}`, borderRadius: 6, fontSize: 11, cursor: 'pointer', background: factorView === v ? T.navy : T.surface, color: factorView === v ? '#0f172a' : T.textSec }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          {factorView === 'exposures' && (
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                {CLIMATE_FACTORS.map((f, i) => <KpiCard key={i} label={f.name} value={f.portfolioLoading.toFixed(2)} sub={`BM: ${f.bmLoading.toFixed(2)}`} color={f.color} />)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={cS}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Factor Loadings: Portfolio vs Benchmark</div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={CLIMATE_FACTORS.map(f => ({ factor: f.name.split(' ')[0], portfolio: f.portfolioLoading, benchmark: f.bmLoading }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="factor" tick={{ fontSize: 9, fill: T.textSec }} />
                      <YAxis domain={[0, 0.8]} tick={{ fontSize: 9, fill: T.textSec }} />
                      <Tooltip {...tip} />
                      <Legend />
                      <Bar dataKey="portfolio" fill={ACCENT} radius={[4, 4, 0, 0]} name="Portfolio" />
                      <Bar dataKey="benchmark" fill={T.textMut} radius={[4, 4, 0, 0]} name="Benchmark" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={cS}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>Factor Details & Risk Attribution</div>
                  {CLIMATE_FACTORS.map((f, i) => (
                    <div key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: f.color }}>{f.name}</div>
                          <div style={{ fontSize: 10, color: T.textSec }}>{f.desc}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, fontFamily: T.mono, color: f.returnContrib > 0 ? T.green : T.red }}>{f.returnContrib > 0 ? '+' : ''}{f.returnContrib}%</div>
                          <div style={{ fontSize: 9, color: T.textMut }}>return contrib</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 10, color: T.textSec }}>
                        <span>Vol contrib: <span style={{ color: T.amber, fontFamily: T.mono }}>{f.volContrib}%</span></span>
                        <span>Ptf loading: <span style={{ color: T.text, fontFamily: T.mono }}>{f.portfolioLoading}</span></span>
                        <span>Active: <span style={{ color: f.portfolioLoading > f.bmLoading ? T.green : T.red, fontFamily: T.mono }}>{(f.portfolioLoading - f.bmLoading).toFixed(2)}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {factorView === 'returns' && (
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Monthly Climate Factor Returns (%) — 2025</div>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={FACTOR_RETURNS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  {CLIMATE_FACTORS.map(f => <Line key={f.id} type="monotone" dataKey={f.name} stroke={f.color} strokeWidth={2} dot={{ r: 2 }} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {factorView === 'attribution' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={cS}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Factor Return Contribution YTD</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={CLIMATE_FACTORS.map(f => ({ factor: f.name.split(' ')[0], return: f.returnContrib }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="factor" tick={{ fontSize: 9, fill: T.textSec }} />
                    <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                    <Tooltip {...tip} />
                    <Bar dataKey="return" name="Return Contrib%" radius={[4, 4, 0, 0]}>
                      {CLIMATE_FACTORS.map((f, i) => <Cell key={i} fill={f.returnContrib > 0 ? T.green : T.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={cS}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Transition & Physical Risk by Sector</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={SECT_LIST.map(sec => {
                    const sh = constrained.filter(h => h.sector === sec);
                    const n = Math.max(1, sh.length);
                    return { sector: sec, transRisk: Math.round(sh.reduce((s, r) => s + r.transitionRisk, 0) / n), physRisk: Math.round(sh.reduce((s, r) => s + r.physicalRisk, 0) / n) };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 8, fill: T.textSec }} angle={-15} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                    <Tooltip {...tip} />
                    <Legend />
                    <Bar dataKey="transRisk" fill={T.red} radius={[4, 4, 0, 0]} name="Transition Risk" />
                    <Bar dataKey="physRisk" fill={T.amber} radius={[4, 4, 0, 0]} name="Physical Risk" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'Attribution' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: T.textSec }}>Attribution dimension:</span>
            {['sector', 'itr', 'sbti'].map(d => (
              <button key={d} onClick={() => setAttrDim(d)} style={{ padding: '5px 14px', border: `1px solid ${attrDim === d ? T.teal : T.border}`, borderRadius: 6, fontSize: 11, cursor: 'pointer', background: attrDim === d ? T.teal : T.surface, color: attrDim === d ? '#0f172a' : T.textSec }}>
                {d === 'sector' ? 'By Sector' : d === 'itr' ? 'By ITR Bucket' : 'By SBTi Status'}
              </button>
            ))}
          </div>
          {(() => {
            const attrData = attrDim === 'sector'
              ? ATTRIBUTION_SECTOR.map(d => ({ name: d.sector.substring(0, 7), alloc: d.allocation, selec: d.selection, inter: d.interaction, total: d.total }))
              : attrDim === 'itr'
              ? ATTRIBUTION_ITR.map(d => ({ name: d.bucket, alloc: d.allocation, selec: d.selection, inter: d.interaction, total: d.total }))
              : [{ name: 'Approved', alloc: 1.4, selec: 0.9, inter: 0.3, total: 2.6 }, { name: 'Committed', alloc: 0.3, selec: 0.1, inter: 0.0, total: 0.4 }, { name: 'None', alloc: -1.2, selec: -0.8, inter: -0.2, total: -2.2 }];
            return (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={cS}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Brinson-Hood-Beebower Attribution</div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={attrData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} />
                        <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                        <Tooltip {...tip} />
                        <Legend />
                        <Bar dataKey="alloc" fill={T.navy} radius={[2, 2, 0, 0]} name="Allocation" />
                        <Bar dataKey="selec" fill={T.teal} radius={[2, 2, 0, 0]} name="Selection" />
                        <Bar dataKey="inter" fill={T.gold} radius={[2, 2, 0, 0]} name="Interaction" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={cS}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Total Active Return Contribution</div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={attrData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} />
                        <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                        <Tooltip {...tip} />
                        <Bar dataKey="total" radius={[4, 4, 0, 0]} name="Total Active Return%">
                          {attrData.map((d, i) => <Cell key={i} fill={d.total > 0 ? T.sage : T.red} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div style={{ ...cS, marginTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>Attribution Detail Table</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['Dimension','Allocation%','Selection%','Interaction%','Total Active%'].map(h => <th key={h} style={{ padding: '8px 10px', fontSize: 11, fontFamily: T.mono, color: T.textSec, borderBottom: `1px solid ${T.border}`, textAlign: 'left', background: T.surfaceH }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {attrData.map((d, i) => (
                        <tr key={i}>
                          <td style={{ ...tdS, fontWeight: 600 }}>{d.name}</td>
                          {[d.alloc, d.selec, d.inter, d.total].map((v, j) => (
                            <td key={j} style={{ ...tdS, fontFamily: T.mono, color: v > 0 ? T.green : v < 0 ? T.red : T.textSec }}>{v > 0 ? '+' : ''}{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {tab === 'Benchmark' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="vs MSCI ACWI ITR" value={`-${(2.9 - +stats.weightedITR).toFixed(1)}°C`} color={T.green} sub="Portfolio advantage" />
            <KpiCard label="vs ACWI WACI" value={`-${Math.max(0, 185 - stats.avgWACI)}`} color={T.green} sub="tCO₂e/$M lower" />
            <KpiCard label="vs PAB ITR" value={`+${Math.max(0, +stats.weightedITR - 1.7).toFixed(1)}°C`} color={T.amber} sub="vs Paris-Aligned BM" />
            <KpiCard label="SBTi Coverage" value={`${stats.count > 0 ? Math.round((stats.sbtiApproved + stats.sbtiCommitted) / stats.count * 100) : 0}%`} color={T.teal} sub="vs 18% MSCI ACWI" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Portfolio vs Benchmarks — Climate KPIs</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Benchmark','ITR','WACI','Green Rev%','SBTi Cov%','ESG Score','Paris Algn%'].map(h => <th key={h} style={{ padding: '8px 10px', fontSize: 10, fontFamily: T.mono, color: T.textSec, borderBottom: `1px solid ${T.border}`, textAlign: 'left', background: T.surfaceH }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {BENCHMARKS.map((b, i) => (
                      <tr key={i} style={{ background: i === 0 ? T.surfaceH : 'transparent' }}>
                        <td style={{ padding: '7px 10px', fontSize: 12, borderBottom: `1px solid ${T.border}`, color: b.color, fontWeight: 600 }}>{b.name}</td>
                        <td style={{ padding: '7px 10px', fontSize: 12, borderBottom: `1px solid ${T.border}`, fontFamily: T.mono, color: b.itr < 2 ? T.green : b.itr < 2.5 ? T.sage : T.amber }}>{b.itr}°C</td>
                        <td style={{ padding: '7px 10px', fontSize: 12, borderBottom: `1px solid ${T.border}`, fontFamily: T.mono, color: b.waci < 100 ? T.green : b.waci < 160 ? T.amber : T.red }}>{b.waci}</td>
                        <td style={{ padding: '7px 10px', fontSize: 12, borderBottom: `1px solid ${T.border}`, fontFamily: T.mono }}>{b.greenRev}%</td>
                        <td style={{ padding: '7px 10px', fontSize: 12, borderBottom: `1px solid ${T.border}`, fontFamily: T.mono }}>{b.sbtiCov}%</td>
                        <td style={{ padding: '7px 10px', fontSize: 12, borderBottom: `1px solid ${T.border}`, fontFamily: T.mono }}>{b.esg}</td>
                        <td style={{ padding: '7px 10px', fontSize: 12, borderBottom: `1px solid ${T.border}`, fontFamily: T.mono }}>{b.pa}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>ITR Comparison Across Benchmarks</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={BENCHMARKS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: T.textSec }} angle={-15} textAnchor="end" height={50} />
                  <YAxis domain={[0, 4]} tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="itr" radius={[4, 4, 0, 0]} name="ITR (°C)">
                    {BENCHMARKS.map((b, i) => <Cell key={i} fill={b.itr < 1.8 ? T.green : b.itr < 2.5 ? T.amber : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...cS, gridColumn: '1/3' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Multi-Metric Benchmark Comparison (scaled)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={BENCHMARK_MULTI}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="metric" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Bar dataKey="portfolio" fill={ACCENT} radius={[4, 4, 0, 0]} name="This Portfolio" />
                  <Bar dataKey="msciAcwi" fill={T.navy} radius={[4, 4, 0, 0]} name="MSCI ACWI" />
                  <Bar dataKey="pab" fill={T.sage} radius={[4, 4, 0, 0]} name="Paris-Aligned BM" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Optimization Engine' && (
        <div>
          <div style={{ ...cS, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Portfolio Optimization — Multi-Constraint Sensitivity</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Target Max ITR: <strong style={{ color: ACCENT }}>{optITR}°C</strong></div>
                <input type="range" min={15} max={40} value={Math.round(optITR * 10)} onChange={e => setOptITR(+(e.target.value / 10).toFixed(1))} style={sliderS} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: T.textMut, marginTop: 2 }}><span>1.5°C</span><span>4.0°C</span></div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Max Carbon Intensity: <strong style={{ color: ACCENT }}>{optCarbon}</strong></div>
                <input type="range" min={30} max={500} value={optCarbon} onChange={e => setOptCarbon(+e.target.value)} style={sliderS} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: T.textMut, marginTop: 2 }}><span>30</span><span>500</span></div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Min Green Revenue: <strong style={{ color: ACCENT }}>{optMinGreen}%</strong></div>
                <input type="range" min={0} max={60} value={optMinGreen} onChange={e => setOptMinGreen(+e.target.value)} style={sliderS} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: T.textMut, marginTop: 2 }}><span>0%</span><span>60%</span></div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Holdings Passing" value={optPortfolio.count} sub="of 200" />
            <KpiCard label="Weighted ITR" value={`${optPortfolio.weightedITR}°C`} color={+optPortfolio.weightedITR < 1.5 ? T.green : +optPortfolio.weightedITR < 2 ? T.sage : T.amber} />
            <KpiCard label="Avg Return" value={`${optPortfolio.avgReturn}%`} color={+optPortfolio.avgReturn > 0 ? T.green : T.red} />
            <KpiCard label="Avg Volatility" value={`${optPortfolio.avgVol}%`} color={T.amber} />
            <KpiCard label="Sharpe Ratio" value={optPortfolio.sharpe} color={T.teal} />
            <KpiCard label="SBTi Coverage" value={`${optPortfolio.sbtiCov}%`} color={T.sage} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Holdings Count vs ITR Constraint</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={OPT_FRONTIER}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="itrLimit" tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'Max ITR Constraint (°C)', position: 'bottom', fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Line type="monotone" dataKey="count" stroke={T.navy} strokeWidth={2} name="Holdings Count" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Return / Volatility Trade-off vs ITR Constraint</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={OPT_FRONTIER}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="itrLimit" tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'Max ITR Constraint (°C)', position: 'bottom', fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Line type="monotone" dataKey="return" stroke={T.green} strokeWidth={2} name="Avg Return%" dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="volatility" stroke={T.red} strokeWidth={2} name="Avg Volatility%" dot={{ r: 2 }} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="sharpe" stroke={T.teal} strokeWidth={2} name="Sharpe Ratio" dot={{ r: 2 }} strokeDasharray="2 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Reporting' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>Portfolio Climate KPIs</div>
              {[
                { label: 'Weighted Average ITR', value: `${stats.weightedITR}°C`, benchmark: '2.9°C (MSCI ACWI)', good: +stats.weightedITR < 2.5 },
                { label: 'WACI', value: `${stats.avgWACI} tCO₂e/$M`, benchmark: '185 (MSCI ACWI)', good: stats.avgWACI < 150 },
                { label: 'SBTi Coverage (App+Comm)', value: `${stats.count > 0 ? Math.round((stats.sbtiApproved + stats.sbtiCommitted) / stats.count * 100) : 0}%`, benchmark: '18% (MSCI ACWI)', good: true },
                { label: 'Green Revenue Exposure', value: `${stats.avgGreen}%`, benchmark: '12% (MSCI ACWI)', good: stats.avgGreen > 12 },
                { label: 'Paris-Aligned Holdings (≤1.5°C)', value: `${constrained.filter(h => h.itr <= 1.5).length}/${stats.count}`, benchmark: 'Target: >50%', good: constrained.filter(h => h.itr <= 1.5).length > stats.count * 0.5 },
                { label: 'Average Climate VaR', value: `${stats.climateVaR}%`, benchmark: 'Internal limit: 5%', good: +stats.climateVaR < 5 },
                { label: 'Green Bond Issuers', value: `${stats.greenBondIssuers}/${stats.count}`, benchmark: 'Target: >30%', good: stats.count > 0 && stats.greenBondIssuers / stats.count > 0.3 },
                { label: 'NZAM Signatories', value: `${stats.nzamSignatories}/${stats.count}`, benchmark: 'Target: >40%', good: stats.count > 0 && stats.nzamSignatories / stats.count > 0.4 },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.text }}>{row.label}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{row.benchmark}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: row.good ? T.green : T.amber, fontFamily: T.mono }}>{row.value}</div>
                </div>
              ))}
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 10 }}>Regulatory Framework Alignment</div>
              {[
                { framework: 'EU SFDR Art. 9', status: 'Partial', detail: 'PAI indicators 15–18 require additional data' },
                { framework: 'EU Taxonomy Alignment', status: 'Partial', detail: 'Green revenue proxy; Taxonomy turnover TBC' },
                { framework: 'TCFD Disclosure', status: 'Aligned', detail: 'Scenario analysis: 1.5°C / 2°C / 3°C+' },
                { framework: 'SBTi Corporate Standard', status: 'Aligned', detail: `${stats.sbtiApproved} approved + ${stats.sbtiCommitted} committed in portfolio` },
                { framework: 'Net Zero Asset Managers (NZAM)', status: 'Aligned', detail: `${stats.nzamSignatories} NZAM signatories in scope` },
                { framework: 'Paris Alignment (PAT/PAII)', status: 'In Progress', detail: 'ITR ≤2°C; engagement on escalated holdings' },
                { framework: 'PCAF Accounting Standard', status: 'Aligned', detail: 'Financed emissions tracked via PCAF DQS' },
                { framework: 'EU CSRD (Investee Reporting)', status: 'Monitoring', detail: 'Monitoring mandatory phase-in from 2026' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.text }}>{f.framework}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{f.detail}</div>
                  </div>
                  <span style={{ color: f.status === 'Aligned' ? T.green : f.status === 'Partial' ? T.amber : f.status === 'In Progress' ? T.teal : T.gold, fontSize: 11, fontWeight: 600 }}>{f.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Panel item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
