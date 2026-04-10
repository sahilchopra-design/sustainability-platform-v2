import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, ScatterChart, Scatter, LineChart, Line, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, Cell, PieChart, Pie,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SECTORS = ['Energy','Financials','Utilities','Materials','Consumer','Industrials','Healthcare','Technology','Real Estate','Transportation'];
const RATINGS = ['AAA','AA','A','BBB','BB','B','CCC'];
const GEOGRAPHIES = ['US','EU','UK','Asia-Pac','EM','Japan','Canada','Australia'];
const ISSUER_TYPES = ['Corporate','Sovereign','Financial','Supranational','Municipal'];
const CLIMATE_FACTORS = [
  { id: 0, name: 'Physical Acute',    color: T.orange },
  { id: 1, name: 'Physical Chronic',  color: T.amber  },
  { id: 2, name: 'Transition Policy', color: T.indigo },
  { id: 3, name: 'Transition Tech',   color: T.blue   },
];

const ISSUER_NAMES_BASE = [
  'Apple Inc','Microsoft Corp','Amazon Inc','Tesla Corp','ExxonMobil','BP PLC','Shell PLC','TotalEnergies',
  'BHP Group','Rio Tinto','Glencore PLC','Vale SA','AngloAmerican','Freeport-McMo','Alcoa Corp','Nucor Steel',
  'JPMorgan Chase','Bank America','Goldman Sachs','Morgan Stanley','Citigroup','Wells Fargo','HSBC Holdings','Barclays PLC',
  'Deutsche Bank','BNP Paribas','Société Gén','UniCredit','Santander','ING Group','ABN AMRO','Nordea Bank',
  'NextEra Energy','Duke Energy','Southern Co','Dominion Eng','Exelon Corp','PG&E Corp','Edison Intl','Entergy Corp',
  'Boeing Co','Airbus SE','Lockheed Mart','Raytheon','General Elec','Honeywell','3M Company','Caterpillar',
  'Walmart Inc','Amazon Retail','Target Corp','Costco Whlsl','CVS Health','UnitedHealth','Humana Inc','Cigna Corp',
  'Pfizer Inc','Johnson&Johnson','AbbVie Inc','Merck & Co','Bristol Myers','Eli Lilly','Amgen Inc','Gilead Sci',
  'US Treasury','Germany Bund','UK Gilt','France OAT','Japan JGB','Canada Bond','Australia CGS','Italy BTP',
  'Spain Bonos','Netherlands','Sweden Riksgld','Denmark DGB','Norway Norges','Finland Fin','Austria OGB','Belgium OLO',
  'IBRD Bond','EIB Bond','ADB Bond','AfDB Bond','IADB Bond','CDC Intl','KfW Dev Bank','EDF Finance',
  'Vonovia SE','Simon Property','Prologis Inc','Crown Castle','American Tower','SBA Comm','Welltower','Alexandria',
  'Delta Air Lines','United Airlines','Southwest Air','American Air','FedEx Corp','UPS Logistics','Maersk Group','MSC Ship',
  'Equinor ASA','Repsol SA','ENI SpA','Petrobras','YPF Argentina','Saudi Aramco','ADNOC Finance','Galp Energia',
  'Vestas Wind','Orsted A/S','Siemens Energy','Schneider Elec','Enel SpA','Iberdrola SA','RWE Group','E.ON SE',
  'Apple Green Bd','Volkswagen AG','BMW Group','Daimler Truck','Continental AG','BASF SE','Bayer AG','Covestro AG',
  'Alibaba Group','Tencent Hold','TSMC Finance','Samsung Elec','SK Hynix','LG Energy Sol','Posco Holdings','Hyundai Mtrs',
  'Macquarie Infr','BlackRock Fin','Vanguard Note','State St Corp','Fidelity Bond','Wellington Fin','T Rowe Note','Capital Grp',
  'Infrastructure Aus','DP World','Transurban','Brambles Ltd','Toll Holdings','Qantas Air','Auckland Intl','Sydney Airport',
  'Rusal Alumin','Norsk Hydro','Outokumpu Oy','Aperam SA','Acerinox SA','Tata Steel','JSW Steel','SAIL Bond',
  'Pembina Pipeln','Enbridge Inc','TC Energy','Keyera Corp','Inter Pipeline','Targa Res','Williams Cos','Kinder Morgan',
  'NiSource Inc','Atmos Energy','Sempra Energy','CenterPoint En','Spire Inc','ONE Gas Inc','Southwest Gas','Chesapeake Util',
  'Renault SA','Stellantis NV','Volvo Group','Scania AB','Wärtsilä Oyj','Michelin SCA','Bridgestone','Sumitomo Rub',
  'Unilever PLC','Nestlé SA','Danone SA','Procter Gamble','Colgate-Palm','Church Dwight','Henkel AG','Reckitt PLC',
  'Suncor Energy','Canadian Nat Res','Cenovus Energy','Imperial Oil','MEG Energy','Baytex Energy','Crescent Pt','Tourmaline',
];

const ISSUERS = ISSUER_NAMES_BASE.slice(0, 200).map((name, i) => {
  const sector = SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];
  const rating = RATINGS[Math.floor(sr(i * 11) * RATINGS.length)];
  const geography = GEOGRAPHIES[Math.floor(sr(i * 13) * GEOGRAPHIES.length)];
  const issuerType = ISSUER_TYPES[Math.floor(sr(i * 17) * ISSUER_TYPES.length)];
  const maturity = 1 + Math.floor(sr(i * 19) * 29);
  const totalSpread = 30 + sr(i * 23) * 470;
  const physRiskScore = 5 + sr(i * 29) * 85;
  const transRiskScore = 5 + sr(i * 31) * 85;
  const physPremium = Math.max(0, totalSpread * (physRiskScore / 100) * (sr(i * 37) * 0.35 + 0.05));
  const transPremium = Math.max(0, totalSpread * (transRiskScore / 100) * (sr(i * 41) * 0.40 + 0.05));
  const residualPremium = Math.max(0, totalSpread - physPremium - transPremium);
  const basePD = 0.001 + sr(i * 43) * 0.08;
  const climatePD = basePD * (1 + transRiskScore / 100 * 0.5);
  const carbonBeta = (physRiskScore * 0.4 + transRiskScore * 0.6) / 100;
  const greenBondPremium = sr(i * 47) > 0.7 ? -(sr(i * 53) * 15) : 0;
  const sectorBeta = 0.5 + sr(i * 59) * 1.5;
  const issuanceYear = 2015 + Math.floor(sr(i * 61) * 10);
  const lgd = 0.20 + sr(i * 73) * 0.60;
  const ead = 10 + sr(i * 79) * 490;
  const esgScore = 10 + sr(i * 83) * 85;
  const spreadZ = (sr(i * 89) * 6) - 3;
  const climateAdjCDS = 20 + sr(i * 97) * 280;
  const coupon = 2 + sr(i * 101) * 6;
  return {
    id: i, name, sector, rating, geography, issuerType, maturity,
    totalSpread, physPremium, transPremium, residualPremium,
    physRiskScore, transRiskScore, climatePD, lgd, ead, esgScore,
    spreadZ, climateAdjCDS, coupon,
    climateAdjSpread: totalSpread + carbonBeta * 10,
    greenBondPremium, sectorBeta, carbonBeta, issuanceYear,
    isGreen: greenBondPremium < 0,
  };
});

// Migration matrices 7x7: row = from-rating, col = to-rating
const buildMigrationMatrix = (scenario) => {
  const base = [
    [0.9200, 0.0550, 0.0180, 0.0050, 0.0015, 0.0003, 0.0002],
    [0.0080, 0.9100, 0.0650, 0.0120, 0.0035, 0.0010, 0.0005],
    [0.0020, 0.0260, 0.9050, 0.0560, 0.0080, 0.0020, 0.0010],
    [0.0005, 0.0030, 0.0590, 0.8700, 0.0550, 0.0095, 0.0030],
    [0.0003, 0.0010, 0.0060, 0.0780, 0.8300, 0.0750, 0.0097],
    [0.0002, 0.0005, 0.0020, 0.0060, 0.0820, 0.8200, 0.0893],
    [0.0001, 0.0002, 0.0008, 0.0020, 0.0150, 0.1200, 0.8619],
  ];
  if (scenario === 'adverse') {
    return base.map((row, ri) => {
      const shock = ri * 0.012;
      return row.map((v, ci) => {
        if (ci === ri) return Math.max(0.5, v - shock * 3);
        if (ci > ri) return v + shock * (ci - ri) * 0.4;
        return v;
      });
    });
  }
  if (scenario === 'severe') {
    return base.map((row, ri) => {
      const shock = ri * 0.025;
      return row.map((v, ci) => {
        if (ci === ri) return Math.max(0.35, v - shock * 5);
        if (ci > ri) return v + shock * (ci - ri) * 0.7;
        return v;
      });
    });
  }
  return base;
};

const GREENIUM_BY_YEAR = Array.from({ length: 10 }, (_, i) => {
  const yr = 2015 + i;
  const base = -(2 + sr(i * 17) * 12);
  return { year: String(yr), greenium: +base.toFixed(2), volume: +(50 + sr(i * 23) * 300).toFixed(0) };
});

const FACTOR_RETURNS_MONTHLY = Array.from({ length: 48 }, (_, m) => ({
  month: m + 1,
  'Physical Acute':   +((sr(m * 7)  - 0.48) * 0.06).toFixed(4),
  'Physical Chronic': +((sr(m * 11) - 0.49) * 0.04).toFixed(4),
  'Trans Policy':     +((sr(m * 13) - 0.47) * 0.08).toFixed(4),
  'Trans Tech':       +((sr(m * 17) - 0.50) * 0.05).toFixed(4),
}));

const TERM_STRUCTURE = RATINGS.map((rating, ri) =>
  Array.from({ length: 30 }, (_, mi) => {
    const mat = mi + 1;
    const baseSpread = sr(ri * 31 + mat * 7) * 300 + 30;
    const physComp = baseSpread * (0.15 + sr(ri * 31 + mat * 7 + 2) * 0.2);
    const transComp = baseSpread * (0.10 + sr(ri * 31 + mat * 7 + 4) * 0.18);
    return { maturity: mat, totalSpread: +baseSpread.toFixed(1), physPremium: +physComp.toFixed(1), transPremium: +transComp.toFixed(1) };
  })
);

const SPREAD_HISTOGRAM = Array.from({ length: 20 }, (_, i) => {
  const bucketMin = i * 25;
  const count = ISSUERS.filter(x => x.totalSpread >= bucketMin && x.totalSpread < bucketMin + 25).length;
  return { bucket: `${bucketMin}-${bucketMin + 25}`, count };
});

// Monthly OAS time series for 36 months — portfolio vs benchmark
const OAS_TIME_SERIES = Array.from({ length: 36 }, (_, m) => ({
  month: `M${m + 1}`,
  portfolioOAS: +(120 + sr(m * 7) * 80 + (m > 18 ? sr(m * 11) * 30 : 0)).toFixed(1),
  benchmarkOAS: +(100 + sr(m * 13) * 60).toFixed(1),
  climateOAS: +(130 + sr(m * 17) * 90 + (m > 18 ? sr(m * 19) * 35 : 0)).toFixed(1),
}));

// Spread by rating over 36 months
const RATING_OAS_SERIES = RATINGS.map((r, ri) =>
  Array.from({ length: 36 }, (_, m) => ({
    month: `M${m + 1}`,
    spread: +(30 + ri * 45 + sr(ri * 100 + m * 7) * 40).toFixed(1),
  }))
);

// Issuer-level EDF (Expected Default Frequency) data
const EDF_DATA = ISSUERS.slice(0, 60).map((x, i) => ({
  name: x.name.split(' ')[0],
  edf: +(x.climatePD * 100).toFixed(3),
  spread: +x.totalSpread.toFixed(0),
  sector: x.sector,
  rating: x.rating,
}));

// Credit spread vs carbon intensity scatter
const CARBON_INTENSITY_SCATTER = ISSUERS.slice(0, 80).map((x, i) => ({
  carbonIntensity: +(sr(i * 53) * 800).toFixed(0),
  spread: +x.totalSpread.toFixed(0),
  sector: x.sector,
  name: x.name.split(' ')[0],
}));

// 12-factor sensitivity grid (sector × scenario)
const SCENARIO_SPREADS = SECTORS.map((s, si) => {
  const base = 50 + sr(si * 23) * 200;
  return {
    sector: s,
    baseline: +base.toFixed(0),
    adverse: +(base * 1.22).toFixed(0),
    severe: +(base * 1.55).toFixed(0),
    disorderly: +(base * 1.38).toFixed(0),
  };
});

// Peer comparison — 8 banks' climate spread analytics
const PEER_BANKS = [
  'JP Morgan','Goldman Sachs','Morgan Stanley','Deutsche Bank',
  'BNP Paribas','Barclays','HSBC','Citi',
].map((bank, i) => ({
  bank,
  climPremiumPct: +(15 + sr(i * 37) * 20).toFixed(1),
  avgGreenium: -(3 + sr(i * 41) * 8).toFixed(1),
  avgCarbonBeta: +(0.3 + sr(i * 43) * 0.5).toFixed(3),
  portfolioOAS: +(80 + sr(i * 47) * 120).toFixed(0),
  rwaImpact: +(5 + sr(i * 53) * 15).toFixed(1),
}));

// Daily spread changes for volatility display
const SPREAD_VOL_SERIES = Array.from({ length: 60 }, (_, d) => ({
  day: d + 1,
  change: +((sr(d * 7) - 0.5) * 4).toFixed(2),
  rollingVol: +(1.5 + sr(d * 11) * 1.5).toFixed(2),
}));

// Z-score distribution
const ZSCORE_DATA = Array.from({ length: 13 }, (_, i) => {
  const z = -3 + i * 0.5;
  const count = ISSUERS.filter(x => Math.abs(x.spreadZ - z) < 0.25).length;
  return { z: z.toFixed(1), count };
});

// Greenium by rating group
const GREENIUM_BY_RATING = RATINGS.map((r, ri) => {
  const greenIssuers = ISSUERS.filter(x => x.rating === r && x.isGreen);
  const avgGreenium = greenIssuers.length ? greenIssuers.reduce((a, x) => a + x.greenBondPremium, 0) / greenIssuers.length : 0;
  return { rating: r, greenium: +avgGreenium.toFixed(2), count: greenIssuers.length };
});

// 3-year climate scenario sector spreads
const SCENARIO_SECTOR_3YR = SECTORS.map((s, si) => ({
  sector: s.split(' ')[0],
  netzero: +(30 + sr(si * 17) * 80).toFixed(0),
  delayed: +(50 + sr(si * 19) * 120).toFixed(0),
  fragmented: +(45 + sr(si * 23) * 100).toFixed(0),
  hot: +(80 + sr(si * 29) * 160).toFixed(0),
}));

// Issuer-level CDS premium estimates
const CDS_DATA = ISSUERS.slice(0, 40).map((x, i) => ({
  name: x.name.split(' ')[0],
  cds5yr: +(x.totalSpread * 0.85 + sr(i * 61) * 20).toFixed(0),
  climAdjCDS: +(x.climateAdjCDS).toFixed(0),
  basis: +(x.climateAdjCDS - x.totalSpread * 0.85 - sr(i * 61) * 20).toFixed(1),
  sector: x.sector,
}));

// Correlation matrix 4×4 (factors)
const FACTOR_CORR = [
  [1.00, 0.72, 0.18, 0.24],
  [0.72, 1.00, 0.22, 0.19],
  [0.18, 0.22, 1.00, 0.65],
  [0.24, 0.19, 0.65, 1.00],
];

// Historical default rates by rating (10yr)
const DEFAULT_HISTORY = Array.from({ length: 10 }, (_, y) => {
  const yr = 2014 + y;
  const row = { year: String(yr) };
  RATINGS.forEach((r, ri) => {
    row[r] = +(sr(ri * 31 + y * 7) * (ri < 3 ? 0.05 : ri < 5 ? 0.8 : 3)).toFixed(3);
  });
  return row;
});

// EL (expected loss) table by sector and scenario
const EL_TABLE = SECTORS.map((s, si) => {
  const sub = ISSUERS.filter(x => x.sector === s);
  const n = sub.length || 1;
  const avgPD = sub.reduce((a, x) => a + x.climatePD, 0) / n;
  const avgLGD = sub.reduce((a, x) => a + x.lgd, 0) / n;
  const avgEAD = sub.reduce((a, x) => a + x.ead, 0) / n;
  return {
    sector: s,
    elBase: +(avgPD * avgLGD * avgEAD).toFixed(2),
    elAdverse: +(avgPD * 1.3 * avgLGD * avgEAD).toFixed(2),
    elSevere: +(avgPD * 1.8 * avgLGD * avgEAD).toFixed(2),
    avgPD: +(avgPD * 100).toFixed(3),
    avgLGD: +(avgLGD * 100).toFixed(1),
    avgEAD: +avgEAD.toFixed(1),
  };
});

const KpiCard = ({ label, value, color = T.text, sub = '' }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Sel = ({ value, onChange, options, style = {} }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.card, color: T.text, fontSize: 12, ...style }}>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const TABS = [
  'Spread Dashboard','Issuer Database','Greenium Analysis','Sector Attribution',
  'Factor Model','Rating Migration','Term Structure','Portfolio Builder',
  'Carbon Beta','Summary & Export'
];

export default function ClimateRiskPremiumPage() {
  const [tab, setTab] = useState(0);

  // Tab 1
  const [t1Scenario, setT1Scenario] = useState('Baseline');
  const [t1SectorFilter, setT1SectorFilter] = useState('All');

  // Tab 2
  const [t2SectorFilter, setT2SectorFilter] = useState('All');
  const [t2RatingFilter, setT2RatingFilter] = useState('All');
  const [t2TypeFilter, setT2TypeFilter] = useState('All');
  const [t2GreenOnly, setT2GreenOnly] = useState(false);
  const [t2Search, setT2Search] = useState('');
  const [t2SortCol, setT2SortCol] = useState('totalSpread');
  const [t2SortDir, setT2SortDir] = useState(-1);
  const [t2ExpandedId, setT2ExpandedId] = useState(null);

  // Tab 3
  const [t3SectorFilter, setT3SectorFilter] = useState('All');
  const [t3YearMin, setT3YearMin] = useState(2015);
  const [t3ShowRegression, setT3ShowRegression] = useState(false);

  // Tab 4
  const [t4Scenario, setT4Scenario] = useState('Baseline');
  const [t4Normalized, setT4Normalized] = useState(false);
  const [t4DrillSector, setT4DrillSector] = useState(null);

  // Tab 5
  const [t5Factor, setT5Factor] = useState('Physical Acute');
  const [t5MinR2, setT5MinR2] = useState(0);
  const [t5SectorFilter, setT5SectorFilter] = useState('All');

  // Tab 6
  const [t6Scenario, setT6Scenario] = useState('baseline');
  const [t6Horizon, setT6Horizon] = useState('1yr');
  const [t6FromRating, setT6FromRating] = useState('All');

  // Tab 7
  const [t7Ratings, setT7Ratings] = useState(new Set(['AAA','AA','A','BBB']));
  const [t7SectorFilter, setT7SectorFilter] = useState('All');
  const [t7SplitType, setT7SplitType] = useState('combined');
  const [t7Notional, setT7Notional] = useState(10);

  // Tab 8
  const [t8Search, setT8Search] = useState('');
  const [t8GreenOnly, setT8GreenOnly] = useState(false);
  const [t8BenchOAS, setT8BenchOAS] = useState(150);
  const [portfolioIds, setPortfolioIds] = useState(new Set());

  // Tab 9
  const [t9CarbonPrice, setT9CarbonPrice] = useState(80);
  const [t9HedgeRatio, setT9HedgeRatio] = useState(50);
  const [t9SectorFocus, setT9SectorFocus] = useState('All');

  // Tab 10
  const [t10Sections, setT10Sections] = useState({ decomp: true, rwa: true, sfdr: true, methodology: true });
  const [t10Format, setT10Format] = useState('Summary');

  // ---- Tab 2 filtered issuers ----
  const t2Filtered = useMemo(() => {
    let d = ISSUERS;
    if (t2SectorFilter !== 'All') d = d.filter(x => x.sector === t2SectorFilter);
    if (t2RatingFilter !== 'All') d = d.filter(x => x.rating === t2RatingFilter);
    if (t2TypeFilter !== 'All') d = d.filter(x => x.issuerType === t2TypeFilter);
    if (t2GreenOnly) d = d.filter(x => x.isGreen);
    if (t2Search) d = d.filter(x => x.name.toLowerCase().includes(t2Search.toLowerCase()) || x.sector.toLowerCase().includes(t2Search.toLowerCase()));
    return [...d].sort((a, b) => t2SortDir * ((a[t2SortCol] || 0) - (b[t2SortCol] || 0)));
  }, [t2SectorFilter, t2RatingFilter, t2TypeFilter, t2GreenOnly, t2Search, t2SortCol, t2SortDir]);

  // ---- Tab 1 KPIs ----
  const scenarioMultiplier = t1Scenario === 'Adverse' ? 1.25 : 1.0;
  const t1Filtered = useMemo(() => t1SectorFilter === 'All' ? ISSUERS : ISSUERS.filter(x => x.sector === t1SectorFilter), [t1SectorFilter]);
  const avgOAS = t1Filtered.length ? (t1Filtered.reduce((s, x) => s + x.totalSpread, 0) / t1Filtered.length * scenarioMultiplier) : 0;
  const avgClimatePremium = t1Filtered.length ? (t1Filtered.reduce((s, x) => s + x.physPremium + x.transPremium, 0) / t1Filtered.length * scenarioMultiplier) : 0;
  const greenPct = t1Filtered.length ? (t1Filtered.filter(x => x.isGreen).length / t1Filtered.length * 100) : 0;
  const avgCarbonBeta = t1Filtered.length ? (t1Filtered.reduce((s, x) => s + x.carbonBeta, 0) / t1Filtered.length) : 0;

  const top10Widest = useMemo(() => [...t1Filtered].sort((a, b) => b.totalSpread - a.totalSpread).slice(0, 10).map(x => ({
    name: x.name.split(' ')[0],
    physPremium: +(x.physPremium * scenarioMultiplier).toFixed(1),
    transPremium: +(x.transPremium * scenarioMultiplier).toFixed(1),
    residualPremium: +(x.residualPremium * scenarioMultiplier).toFixed(1),
  })), [t1Filtered, scenarioMultiplier]);

  const decompositionDonut = useMemo(() => {
    const totPhys = t1Filtered.reduce((s, x) => s + x.physPremium, 0);
    const totTrans = t1Filtered.reduce((s, x) => s + x.transPremium, 0);
    const totResid = t1Filtered.reduce((s, x) => s + x.residualPremium, 0);
    const tot = totPhys + totTrans + totResid || 1;
    return [
      { name: 'Physical Risk', value: +(totPhys / tot * 100).toFixed(1), color: T.orange },
      { name: 'Transition Risk', value: +(totTrans / tot * 100).toFixed(1), color: T.indigo },
      { name: 'Residual', value: +(totResid / tot * 100).toFixed(1), color: T.muted },
    ];
  }, [t1Filtered]);

  // ---- Tab 3 Greenium ----
  const greeniumByYearFiltered = useMemo(() => GREENIUM_BY_YEAR.filter(d => +d.year >= t3YearMin), [t3YearMin]);
  const greeniumBySector = useMemo(() => SECTORS.map((s, si) => {
    const greenIssuers = ISSUERS.filter(x => x.sector === s && x.isGreen);
    const convIssuers = ISSUERS.filter(x => x.sector === s && !x.isGreen);
    const avgGreen = greenIssuers.length ? greenIssuers.reduce((a, x) => a + x.totalSpread, 0) / greenIssuers.length : 0;
    const avgConv = convIssuers.length ? convIssuers.reduce((a, x) => a + x.totalSpread, 0) / convIssuers.length : 0;
    return { sector: s.split(' ')[0], greenSpread: +avgGreen.toFixed(1), convSpread: +avgConv.toFixed(1), greenium: +(avgGreen - avgConv).toFixed(1) };
  }), []);

  const greeniumScatter = useMemo(() => ISSUERS.filter(x => x.isGreen).map(x => ({
    esgScore: +x.esgScore.toFixed(1), greenium: +x.greenBondPremium.toFixed(1), name: x.name,
  })), []);

  // ---- Tab 4 Sector Attribution ----
  const sectorAttrib = useMemo(() => SECTORS.map(s => {
    const sub = t4SectorFilter === 'All' || t4DrillSector === s ? ISSUERS.filter(x => x.sector === s) : ISSUERS.filter(x => x.sector === s);
    if (!sub.length) return null;
    const n = sub.length;
    const avgPhys = sub.reduce((a, x) => a + x.physPremium, 0) / n;
    const avgTrans = sub.reduce((a, x) => a + x.transPremium, 0) / n;
    const avgRes = sub.reduce((a, x) => a + x.residualPremium, 0) / n;
    const avgTotal = sub.reduce((a, x) => a + x.totalSpread, 0) / n;
    const mult = t4Scenario === 'Adverse' ? 1.2 : t4Scenario === 'Severe' ? 1.5 : 1.0;
    return {
      sector: s, count: n,
      avgPhys: +(avgPhys * mult).toFixed(1),
      avgTrans: +(avgTrans * mult).toFixed(1),
      avgRes: +(avgRes * mult).toFixed(1),
      avgTotal: +(avgTotal * mult).toFixed(1),
    };
  }).filter(Boolean), [t4Scenario]);

  const sectorRadarData = useMemo(() => SECTORS.map((s, si) => ({
    sector: s.split(' ')[0],
    'Physical Acute':   +(sr(si * 10) * 100).toFixed(1),
    'Physical Chronic': +(sr(si * 10 + 3) * 100).toFixed(1),
    'Trans Policy':     +(sr(si * 10 + 6) * 100).toFixed(1),
    'Trans Tech':       +(sr(si * 10 + 9) * 100).toFixed(1),
  })), []);

  const drillTop5 = useMemo(() => t4DrillSector
    ? [...ISSUERS.filter(x => x.sector === t4DrillSector)].sort((a, b) => b.totalSpread - a.totalSpread).slice(0, 5)
    : [], [t4DrillSector]);

  // ---- Tab 5 Factor Model ----
  const factorHeatmap = useMemo(() => SECTORS.map((s, si) => {
    const row = { sector: s.split(' ')[0] };
    CLIMATE_FACTORS.forEach((f, fi) => {
      row[f.name] = +(sr(si * 10 + fi * 3) * 1.2 - 0.3).toFixed(3);
    });
    return row;
  }), []);

  const issuerR2 = useMemo(() => {
    let d = ISSUERS.map((x, i) => ({
      name: x.name.split(' ')[0], r2: +(0.15 + sr(i * 37) * 0.75).toFixed(3),
      loading: +(sr(i * 41) * 1.2 - 0.3).toFixed(3), sector: x.sector,
    }));
    if (t5SectorFilter !== 'All') d = d.filter(x => x.sector === t5SectorFilter);
    d = d.filter(x => x.r2 >= t5MinR2 / 100);
    return d.slice(0, 60);
  }, [t5SectorFilter, t5MinR2]);

  const factorShockImpact = useMemo(() => SECTORS.map((s, si) => {
    const factorIdx = CLIMATE_FACTORS.findIndex(f => f.name === t5Factor);
    const loading = sr(si * 10 + factorIdx * 3) * 1.2 - 0.3;
    const factorVol = 0.03 + sr(si * 10 + factorIdx * 3 + 7) * 0.05;
    return { sector: s.split(' ')[0], spreadImpact: +(loading * factorVol * 100).toFixed(2) };
  }), [t5Factor]);

  // ---- Tab 6 Migration ----
  const migMatrix = useMemo(() => buildMigrationMatrix(t6Scenario), [t6Scenario]);
  const horizonMultiplier = t6Horizon === '1yr' ? 1 : t6Horizon === '3yr' ? 3 : 5;
  const defaultRates = useMemo(() => RATINGS.map((r, ri) => {
    const row = migMatrix[ri];
    const dr = 1 - Math.pow(1 - (row[6] || 0.001), horizonMultiplier);
    return { rating: r, defaultRate: +(dr * 100).toFixed(3) };
  }), [migMatrix, horizonMultiplier]);

  // ---- Tab 7 Term Structure ----
  const termData = useMemo(() => {
    const selectedRatings = RATINGS.filter((r, ri) => t7Ratings.has(r));
    return Array.from({ length: 30 }, (_, mi) => {
      const mat = mi + 1;
      const row = { maturity: mat };
      selectedRatings.forEach((r, ri) => {
        const riIdx = RATINGS.indexOf(r);
        const ts = TERM_STRUCTURE[riIdx][mi];
        if (t7SplitType === 'physical') row[r] = ts.physPremium;
        else if (t7SplitType === 'transition') row[r] = ts.transPremium;
        else row[r] = ts.totalSpread;
      });
      return row;
    });
  }, [t7Ratings, t7SplitType]);

  const cs01Data = useMemo(() => {
    return RATINGS.filter(r => t7Ratings.has(r)).map(r => {
      const riIdx = RATINGS.indexOf(r);
      const midSpread = TERM_STRUCTURE[riIdx][14].totalSpread;
      const cs01 = (t7Notional * midSpread * 0.0001 * 0.01).toFixed(4);
      return { rating: r, cs01, midSpread: midSpread.toFixed(1) };
    });
  }, [t7Ratings, t7Notional]);

  // ---- Tab 8 Portfolio ----
  const t8Candidates = useMemo(() => {
    let d = ISSUERS;
    if (t8GreenOnly) d = d.filter(x => x.isGreen);
    if (t8Search) d = d.filter(x => x.name.toLowerCase().includes(t8Search.toLowerCase()));
    return d.slice(0, 50);
  }, [t8GreenOnly, t8Search]);

  const portfolioItems = useMemo(() => ISSUERS.filter(x => portfolioIds.has(x.id)), [portfolioIds]);
  const portfolioOAS = portfolioItems.length ? portfolioItems.reduce((s, x) => s + x.totalSpread, 0) / portfolioItems.length : 0;
  const portfolioGreenPct = portfolioItems.length ? portfolioItems.filter(x => x.isGreen).length / portfolioItems.length * 100 : 0;
  const portfolioCVaR = portfolioItems.length ? portfolioItems.reduce((s, x) => s + x.climatePD * x.lgd * x.ead, 0) : 0;
  const portfolioSharpe = portfolioCVaR > 0 ? (portfolioOAS / portfolioCVaR).toFixed(3) : '—';
  const portfolioSectorPie = useMemo(() => {
    const counts = {};
    portfolioItems.forEach(x => { counts[x.sector] = (counts[x.sector] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [portfolioItems]);
  const riskBudgetPie = useMemo(() => {
    const totPhys = portfolioItems.reduce((s, x) => s + x.physPremium, 0);
    const totTrans = portfolioItems.reduce((s, x) => s + x.transPremium, 0);
    const totResid = portfolioItems.reduce((s, x) => s + x.residualPremium, 0);
    return [
      { name: 'Physical', value: +totPhys.toFixed(1) },
      { name: 'Transition', value: +totTrans.toFixed(1) },
      { name: 'Residual', value: +totResid.toFixed(1) },
    ];
  }, [portfolioItems]);

  const togglePortfolio = useCallback((id) => {
    setPortfolioIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }, []);

  // ---- Tab 9 Carbon Beta ----
  const carbonBetaBySector = useMemo(() => SECTORS.map(s => {
    const sub = (t9SectorFocus === 'All' || t9SectorFocus === s) ? ISSUERS.filter(x => x.sector === s) : [];
    if (!sub.length) return null;
    const avgBeta = sub.reduce((a, x) => a + x.carbonBeta, 0) / sub.length;
    const spreadWidening = avgBeta * t9CarbonPrice * 0.5;
    const hedgeCost = spreadWidening * (t9HedgeRatio / 100);
    return {
      sector: s.split(' ')[0], avgBeta: +avgBeta.toFixed(3),
      spreadWidening: +spreadWidening.toFixed(2), hedgeCost: +hedgeCost.toFixed(2),
      netSpread: +(spreadWidening - hedgeCost).toFixed(2),
    };
  }).filter(Boolean), [t9CarbonPrice, t9HedgeRatio, t9SectorFocus]);

  const betaEsgScatter = useMemo(() => ISSUERS.slice(0, 80).map(x => ({
    esgScore: +x.esgScore.toFixed(1), carbonBeta: +x.carbonBeta.toFixed(3),
    sector: x.sector, name: x.name.split(' ')[0],
  })), []);

  const handleT2Sort = useCallback((col) => {
    if (t2SortCol === col) setT2SortDir(d => -d);
    else { setT2SortCol(col); setT2SortDir(-1); }
  }, [t2SortCol]);

  const toggleT7Rating = useCallback((r) => {
    setT7Ratings(prev => { const n = new Set(prev); if (n.has(r)) n.delete(r); else n.add(r); return n; });
  }, []);

  const RATING_COLORS = { AAA: T.green, AA: T.teal, A: T.blue, BBB: T.indigo, BB: T.amber, B: T.orange, CCC: T.red };
  const PIE_COLORS = [T.indigo, T.teal, T.orange, T.gold, T.purple, T.green, T.red, T.blue, T.amber, T.navy];

  // ── RENDER ──
  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '24px', fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>Climate Risk Premium Analytics</div>
        <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>JP Morgan / Goldman Sachs grade climate credit spread decomposition · 200 issuers · 10 sectors</div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap', borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '8px 14px', borderRadius: '6px 6px 0 0', border: `1px solid ${tab === i ? T.indigo : T.border}`,
            borderBottom: tab === i ? `2px solid ${T.card}` : 'none', background: tab === i ? T.card : T.sub,
            color: tab === i ? T.indigo : T.muted, fontWeight: tab === i ? 700 : 400, fontSize: 12, cursor: 'pointer', marginBottom: -2,
          }}>{t}</button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════ TAB 1 */}
      {tab === 0 && (
        <div>
          {/* Controls */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <Sel value={t1Scenario} onChange={setT1Scenario} options={['Baseline','Adverse']} />
            <Sel value={t1SectorFilter} onChange={setT1SectorFilter} options={['All', ...SECTORS]} />
            <span style={{ fontSize: 12, color: T.muted }}>Scenario multiplier: <strong style={{ color: T.text }}>{scenarioMultiplier}×</strong></span>
          </div>
          {/* KPI Row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Avg OAS" value={`${avgOAS.toFixed(0)} bps`} color={T.navy} sub="Option-adjusted spread" />
            <KpiCard label="Avg Climate Premium" value={`${avgClimatePremium.toFixed(0)} bps`} color={T.indigo} sub="Phys + Trans components" />
            <KpiCard label="Green Bond %" value={`${greenPct.toFixed(1)}%`} color={T.green} sub="of filtered issuers" />
            <KpiCard label="Avg Carbon Beta" value={avgCarbonBeta.toFixed(3)} color={T.orange} sub="Sensitivity to carbon price" />
          </div>
          {/* Top 10 Stacked Bar */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Top-10 Widest Climate Spreads — Decomposition (bps)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={top10Widest} margin={{ top: 4, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="physPremium" stackId="a" fill={T.orange} name="Physical" />
                <Bar dataKey="transPremium" stackId="a" fill={T.indigo} name="Transition" />
                <Bar dataKey="residualPremium" stackId="a" fill={T.muted} name="Residual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Bottom row: donut + histogram */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 1, minWidth: 280 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Physical vs Transition Decomposition</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={decompositionDonut} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}%`}>
                    {decompositionDonut.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 2, minWidth: 340 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Spread Distribution Histogram (25 bps buckets)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={SPREAD_HISTOGRAM} margin={{ top: 4, right: 20, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.blue} name="Issuers" />
                  <ReferenceLine x="100-125" stroke={T.red} strokeDasharray="4 4" label={{ value: 'Median', fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* OAS time series vs benchmark */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>OAS Time Series — Portfolio vs Benchmark vs Climate-Tilted (36 months)</div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>Portfolio = equal-weight 200 issuers · Benchmark = ICE BofA IG proxy · Climate-tilted = high-carbon-beta subset</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={OAS_TIME_SERIES} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="portfolioOAS" stroke={T.indigo} strokeWidth={2} dot={false} name="Portfolio OAS" />
                <Line type="monotone" dataKey="benchmarkOAS" stroke={T.gold} strokeWidth={2} dot={false} name="Benchmark OAS" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="climateOAS" stroke={T.red} strokeWidth={2} dot={false} name="Climate-Tilted OAS" />
                <ReferenceLine x="M19" stroke={T.amber} strokeDasharray="4 4" label={{ value: 'Scenario shock', fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Z-score distribution + Peer comparison */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 1, minWidth: 260 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Spread Z-Score Distribution</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ZSCORE_DATA} margin={{ top: 4, right: 10, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="z" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.teal} name="Issuers">
                    {ZSCORE_DATA.map((entry, i) => (
                      <Cell key={i} fill={+entry.z > 1.5 ? T.red : +entry.z < -1.5 ? T.green : T.teal} />
                    ))}
                  </Bar>
                  <ReferenceLine x="0.0" stroke={T.navy} strokeDasharray="4 4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 2, minWidth: 340 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Peer Bank Climate Spread Analytics Comparison</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Bank','Climate % of OAS','Avg Greenium','Avg Carbon β','Portfolio OAS','RWA Impact %'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, fontSize: 10, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PEER_BANKS.map(row => (
                    <tr key={row.bank} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '5px 10px', fontWeight: 700, color: T.navy }}>{row.bank}</td>
                      <td style={{ padding: '5px 10px' }}>{row.climPremiumPct}%</td>
                      <td style={{ padding: '5px 10px', color: T.green }}>{row.avgGreenium} bps</td>
                      <td style={{ padding: '5px 10px', fontFamily: 'monospace' }}>{row.avgCarbonBeta}</td>
                      <td style={{ padding: '5px 10px', fontWeight: 700 }}>{row.portfolioOAS} bps</td>
                      <td style={{ padding: '5px 10px', color: T.amber }}>{row.rwaImpact}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4-scenario sector spread heatmap */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>4-Scenario Sector Spread Heatmap (bps) — NGFS Aligned</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: T.muted }}>Sector</th>
                    <th style={{ padding: '8px 12px', color: T.green }}>Net Zero 2050</th>
                    <th style={{ padding: '8px 12px', color: T.amber }}>Delayed Transition</th>
                    <th style={{ padding: '8px 12px', color: T.orange }}>Fragmented World</th>
                    <th style={{ padding: '8px 12px', color: T.red }}>Hot House World</th>
                  </tr>
                </thead>
                <tbody>
                  {SCENARIO_SPREADS.map(row => {
                    const maxV = Math.max(row.netzero, row.adverse, row.fragmented, row.hot);
                    const cell = (v) => {
                      const intensity = v / maxV;
                      return (
                        <td style={{ padding: '7px 12px', textAlign: 'center', background: `rgba(220,38,38,${intensity * 0.4})`, fontWeight: 600 }}>{v}</td>
                      );
                    };
                    return (
                      <tr key={row.sector} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '7px 12px', fontWeight: 700 }}>{row.sector}</td>
                        {cell(row.netzero)}
                        {cell(row.adverse)}
                        {cell(row.fragmented)}
                        {cell(row.hot)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ TAB 2 */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={t2Search} onChange={e => setT2Search(e.target.value)} placeholder="Search issuer / sector..."
              style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: 180 }} />
            <Sel value={t2SectorFilter} onChange={setT2SectorFilter} options={['All', ...SECTORS]} />
            <Sel value={t2RatingFilter} onChange={setT2RatingFilter} options={['All', ...RATINGS]} />
            <Sel value={t2TypeFilter} onChange={setT2TypeFilter} options={['All', ...ISSUER_TYPES]} />
            <label style={{ fontSize: 12, color: T.text, display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={t2GreenOnly} onChange={e => setT2GreenOnly(e.target.checked)} /> Green only
            </label>
            <span style={{ fontSize: 12, color: T.muted, marginLeft: 'auto' }}>{t2Filtered.length} issuers</span>
          </div>
          {/* Quick stats row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>FILTERED ISSUERS</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>{t2Filtered.length}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>of 200 total</div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>AVG OAS</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.indigo }}>
                {t2Filtered.length ? (t2Filtered.reduce((s, x) => s + x.totalSpread, 0) / t2Filtered.length).toFixed(0) : '—'} bps
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>filtered universe</div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flex: 2, minWidth: 280 }}>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>RATING DISTRIBUTION</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {RATINGS.map(r => {
                  const cnt = t2Filtered.filter(x => x.rating === r).length;
                  const pct = t2Filtered.length ? cnt / t2Filtered.length * 100 : 0;
                  return (
                    <div key={r} style={{ textAlign: 'center', minWidth: 36 }}>
                      <div style={{ height: `${Math.max(4, pct * 1.5)}px`, background: RATING_COLORS[r], borderRadius: 2, marginBottom: 2 }} />
                      <div style={{ fontSize: 9, color: RATING_COLORS[r], fontWeight: 700 }}>{r}</div>
                      <div style={{ fontSize: 9, color: T.muted }}>{cnt}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flex: 2, minWidth: 280 }}>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>AVG OAS BY SECTOR (filtered)</div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                {SECTORS.map((s, si) => {
                  const sub = t2Filtered.filter(x => x.sector === s);
                  const avg = sub.length ? sub.reduce((a, x) => a + x.totalSpread, 0) / sub.length : 0;
                  const maxAvg = 300;
                  return (
                    <div key={s} title={`${s}: ${avg.toFixed(0)} bps`} style={{ textAlign: 'center' }}>
                      <div style={{ height: `${Math.max(2, avg / maxAvg * 40)}px`, width: 18, background: PIE_COLORS[si], borderRadius: 2 }} />
                      <div style={{ fontSize: 8, color: T.muted, marginTop: 2 }}>{s.slice(0, 4)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['name','sector','rating','maturity','totalSpread','physPremium','transPremium','greenBondPremium','carbonBeta','climatePD','lgd'].map(col => (
                      <th key={col} onClick={() => handleT2Sort(col)}
                        style={{ padding: '8px 10px', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap', color: T.muted, fontWeight: 600, fontSize: 10, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>
                        {col} {t2SortCol === col ? (t2SortDir === -1 ? '↓' : '↑') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t2Filtered.slice(0, 80).map(x => (
                    <React.Fragment key={x.id}>
                      <tr onClick={() => setT2ExpandedId(t2ExpandedId === x.id ? null : x.id)}
                        style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: t2ExpandedId === x.id ? '#eef2ff' : (x.isGreen ? '#f0fdf4' : T.card) }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600, color: T.navy }}>{x.name}</td>
                        <td style={{ padding: '6px 10px' }}>{x.sector}</td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ background: RATING_COLORS[x.rating] + '22', color: RATING_COLORS[x.rating], padding: '1px 6px', borderRadius: 4, fontWeight: 700, fontSize: 10 }}>{x.rating}</span>
                        </td>
                        <td style={{ padding: '6px 10px' }}>{x.maturity}yr</td>
                        <td style={{ padding: '6px 10px', fontWeight: 700 }}>{x.totalSpread.toFixed(0)}</td>
                        <td style={{ padding: '6px 10px', color: T.orange }}>{x.physPremium.toFixed(1)}</td>
                        <td style={{ padding: '6px 10px', color: T.indigo }}>{x.transPremium.toFixed(1)}</td>
                        <td style={{ padding: '6px 10px', color: x.greenBondPremium < 0 ? T.green : T.muted }}>{x.greenBondPremium.toFixed(1)}</td>
                        <td style={{ padding: '6px 10px' }}>{x.carbonBeta.toFixed(3)}</td>
                        <td style={{ padding: '6px 10px', color: T.red }}>{(x.climatePD * 100).toFixed(2)}%</td>
                        <td style={{ padding: '6px 10px' }}>{(x.lgd * 100).toFixed(0)}%</td>
                      </tr>
                      {t2ExpandedId === x.id && (
                        <tr style={{ background: '#f0f4ff' }}>
                          <td colSpan={11} style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12 }}>
                              <div><strong>Geography:</strong> {x.geography}</div>
                              <div><strong>Issuer Type:</strong> {x.issuerType}</div>
                              <div><strong>EAD:</strong> ${x.ead.toFixed(0)}M</div>
                              <div><strong>ESG Score:</strong> {x.esgScore.toFixed(1)}</div>
                              <div><strong>Spread Z-Score:</strong> {x.spreadZ.toFixed(2)}</div>
                              <div><strong>Clim-Adj CDS:</strong> {x.climateAdjCDS.toFixed(0)} bps</div>
                              <div><strong>Coupon:</strong> {x.coupon.toFixed(2)}%</div>
                              <div><strong>Issuance Year:</strong> {x.issuanceYear}</div>
                              <div><strong>Residual Premium:</strong> {x.residualPremium.toFixed(1)} bps</div>
                              <div><strong>Climate Adj Spread:</strong> {x.climateAdjSpread.toFixed(1)} bps</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ TAB 3 */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Sel value={t3SectorFilter} onChange={setT3SectorFilter} options={['All', ...SECTORS]} />
            <label style={{ fontSize: 12, color: T.text }}>From year:
              <input type="range" min={2015} max={2024} value={t3YearMin} onChange={e => setT3YearMin(+e.target.value)} style={{ marginLeft: 8, width: 100 }} />
              <span style={{ marginLeft: 6, fontWeight: 700 }}>{t3YearMin}</span>
            </label>
            <label style={{ fontSize: 12, color: T.text, display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={t3ShowRegression} onChange={e => setT3ShowRegression(e.target.checked)} /> Show regression line
            </label>
          </div>
          {/* Greenium by sector */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Green vs Conventional Spread by Sector (bps)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={greeniumBySector} margin={{ top: 4, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="greenSpread" fill={T.green} name="Green Bond Spread" />
                <Bar dataKey="convSpread" fill={T.blue} name="Conventional Spread" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {/* Greenium time series */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 2, minWidth: 320 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Greenium Time Series 2015–2024 (bps)</div>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={greeniumByYearFiltered}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="right" dataKey="volume" fill={T.border} name="Volume $Bn" opacity={0.4} />
                  <Line yAxisId="left" type="monotone" dataKey="greenium" stroke={T.green} strokeWidth={2} name="Greenium (bps)" dot={{ r: 4 }} />
                  {t3ShowRegression && <ReferenceLine yAxisId="left" y={-7} stroke={T.orange} strokeDasharray="6 3" label={{ value: 'Trend', fontSize: 10 }} />}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {/* Greenium vs ESG scatter */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 1, minWidth: 260 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Greenium vs ESG Score</div>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart margin={{ top: 4, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="esgScore" name="ESG Score" tick={{ fontSize: 10 }} label={{ value: 'ESG Score', position: 'insideBottom', fontSize: 10, dy: 10 }} />
                  <YAxis dataKey="greenium" name="Greenium" tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={greeniumScatter} fill={T.green} opacity={0.7} />
                  {t3ShowRegression && <ReferenceLine y={-6} stroke={T.orange} strokeDasharray="4 4" />}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Greenium significance table */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Greenium Significance by Rating</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Rating','Avg Greenium (bps)','t-stat','p-value','Significant?'].map(h => (
                    <th key={h} style={{ padding: '7px 12px', textAlign: 'left', color: T.muted, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RATINGS.map((r, ri) => {
                  const greenium = -(2 + sr(ri * 19) * 10);
                  const tstat = 1.5 + sr(ri * 23) * 3;
                  const pval = Math.max(0.001, 0.15 - sr(ri * 29) * 0.14);
                  const sig = pval < 0.05;
                  return (
                    <tr key={r} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 12px' }}><span style={{ background: RATING_COLORS[r] + '22', color: RATING_COLORS[r], padding: '1px 7px', borderRadius: 4, fontWeight: 700 }}>{r}</span></td>
                      <td style={{ padding: '6px 12px', color: T.green, fontWeight: 600 }}>{greenium.toFixed(1)}</td>
                      <td style={{ padding: '6px 12px' }}>{tstat.toFixed(2)}</td>
                      <td style={{ padding: '6px 12px' }}>{pval.toFixed(3)}</td>
                      <td style={{ padding: '6px 12px' }}><span style={{ color: sig ? T.green : T.red, fontWeight: 700 }}>{sig ? 'Yes ***' : 'No'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ TAB 4 */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Sel value={t4Scenario} onChange={setT4Scenario} options={['Baseline','Adverse','Severe']} />
            <label style={{ fontSize: 12, color: T.text, display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={t4Normalized} onChange={e => setT4Normalized(e.target.checked)} /> Normalize (% of total)
            </label>
            {t4DrillSector && (
              <button onClick={() => setT4DrillSector(null)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.sub, cursor: 'pointer', fontSize: 12 }}>
                ✕ Clear drill: {t4DrillSector}
              </button>
            )}
          </div>
          {/* Stacked attribution bar */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Climate Spread Attribution by Sector</div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>Click a bar to drill into top-5 issuers</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sectorAttrib} margin={{ top: 4, right: 20, left: 0, bottom: 40 }}
                onClick={(d) => { if (d && d.activePayload) setT4DrillSector(d.activePayload[0]?.payload?.sector); }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey={t4Normalized ? 'physNorm' : 'avgPhys'} stackId="a" fill={T.orange} name="Physical" />
                <Bar dataKey={t4Normalized ? 'transNorm' : 'avgTrans'} stackId="a" fill={T.indigo} name="Transition" />
                <Bar dataKey={t4Normalized ? 'resNorm' : 'avgRes'} stackId="a" fill={T.muted} name="Residual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {/* Sector Radar */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 1, minWidth: 300 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Sector Climate Risk Radar</div>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={sectorRadarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="sector" tick={{ fontSize: 9 }} />
                  <PolarRadiusAxis tick={{ fontSize: 8 }} />
                  <Radar name="Phys Acute" dataKey="Physical Acute" stroke={T.orange} fill={T.orange} fillOpacity={0.15} />
                  <Radar name="Trans Policy" dataKey="Trans Policy" stroke={T.indigo} fill={T.indigo} fillOpacity={0.15} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Drill or Attribution Table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 1, minWidth: 300 }}>
              {t4DrillSector ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Top-5 Issuers — {t4DrillSector}</div>
                  {drillTop5.map(x => (
                    <div key={x.id} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                      <div style={{ fontWeight: 700 }}>{x.name} <span style={{ color: RATING_COLORS[x.rating], fontSize: 11 }}>{x.rating}</span></div>
                      <div style={{ color: T.muted, marginTop: 2 }}>Total: <strong>{x.totalSpread.toFixed(0)} bps</strong> · Phys: {x.physPremium.toFixed(1)} · Trans: {x.transPremium.toFixed(1)}</div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Attribution % Table</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: T.sub }}>
                        <th style={{ padding: '6px 8px', textAlign: 'left', color: T.muted }}>Sector</th>
                        <th style={{ padding: '6px 8px', color: T.orange }}>Phys%</th>
                        <th style={{ padding: '6px 8px', color: T.indigo }}>Trans%</th>
                        <th style={{ padding: '6px 8px', color: T.muted }}>Resid%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectorAttrib.map(row => {
                        const tot = row.avgPhys + row.avgTrans + row.avgRes || 1;
                        return (
                          <tr key={row.sector} style={{ borderBottom: `1px solid ${T.border}` }}>
                            <td style={{ padding: '5px 8px', fontWeight: 600 }}>{row.sector}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', color: T.orange }}>{(row.avgPhys / tot * 100).toFixed(0)}%</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', color: T.indigo }}>{(row.avgTrans / tot * 100).toFixed(0)}%</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', color: T.muted }}>{(row.avgRes / tot * 100).toFixed(0)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>

          {/* 3-year forward scenario spreads */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>3-Year Forward Sector Spreads — 4 NGFS Scenarios (bps)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={SCENARIO_SECTOR_3YR} margin={{ top: 4, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="netzero" fill={T.green} name="Net Zero 2050" />
                <Bar dataKey="delayed" fill={T.amber} name="Delayed Transition" />
                <Bar dataKey="fragmented" fill={T.orange} name="Fragmented World" />
                <Bar dataKey="hot" fill={T.red} name="Hot House World" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Expected Loss table */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Expected Loss (EL) by Sector — Baseline / Adverse / Severe ($M avg per issuer)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Sector','Count','Avg PD (%)','Avg LGD (%)','Avg EAD ($M)','EL Baseline','EL Adverse','EL Severe','EL Δ Severe'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, fontSize: 10, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EL_TABLE.map(row => (
                  <tr key={row.sector} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 10px', fontWeight: 700 }}>{row.sector}</td>
                    <td style={{ padding: '6px 10px' }}>{ISSUERS.filter(x => x.sector === row.sector).length}</td>
                    <td style={{ padding: '6px 10px', color: T.red }}>{row.avgPD}%</td>
                    <td style={{ padding: '6px 10px' }}>{row.avgLGD}%</td>
                    <td style={{ padding: '6px 10px' }}>{row.avgEAD}</td>
                    <td style={{ padding: '6px 10px', color: T.navy, fontWeight: 700 }}>${row.elBase}</td>
                    <td style={{ padding: '6px 10px', color: T.amber }}>${row.elAdverse}</td>
                    <td style={{ padding: '6px 10px', color: T.red }}>${row.elSevere}</td>
                    <td style={{ padding: '6px 10px', color: T.orange }}>+{((row.elSevere - row.elBase) / (row.elBase || 0.01) * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ TAB 5 */}
      {tab === 4 && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Sel value={t5Factor} onChange={setT5Factor} options={CLIMATE_FACTORS.map(f => f.name)} />
            <Sel value={t5SectorFilter} onChange={setT5SectorFilter} options={['All', ...SECTORS]} />
            <label style={{ fontSize: 12, color: T.text }}>Min R²:
              <input type="range" min={0} max={90} value={t5MinR2} onChange={e => setT5MinR2(+e.target.value)} style={{ marginLeft: 8, width: 100 }} />
              <span style={{ marginLeft: 6, fontWeight: 700 }}>{t5MinR2}%</span>
            </label>
          </div>
          {/* Heatmap */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Factor Loading Heatmap — 10 Sectors × 4 Climate Factors</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>Sector</th>
                    {CLIMATE_FACTORS.map(f => (
                      <th key={f.name} style={{ padding: '8px 12px', color: f.color, fontWeight: 700 }}>{f.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {factorHeatmap.map(row => (
                    <tr key={row.sector} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{row.sector}</td>
                      {CLIMATE_FACTORS.map(f => {
                        const val = row[f.name];
                        const intensity = Math.abs(val) / 0.9;
                        const bg = val > 0 ? `rgba(220,38,38,${intensity * 0.35})` : `rgba(3,105,161,${intensity * 0.35})`;
                        return (
                          <td key={f.name} style={{ padding: '8px 12px', textAlign: 'center', background: bg, fontWeight: 700, fontFamily: 'monospace' }}>
                            {val > 0 ? '+' : ''}{val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {/* Factor returns time series */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 2, minWidth: 340 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Factor Return Time Series — 48 Months</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={FACTOR_RETURNS_MONTHLY} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} label={{ value: 'Month', position: 'insideBottom', fontSize: 10, dy: 8 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v * 100).toFixed(1)}%`} />
                  <Tooltip formatter={(v) => `${(v * 100).toFixed(2)}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="Physical Acute" stroke={T.orange} dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="Physical Chronic" stroke={T.amber} dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="Trans Policy" stroke={T.indigo} dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="Trans Tech" stroke={T.blue} dot={false} strokeWidth={1.5} />
                  <ReferenceLine y={0} stroke={T.border} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Factor shock impact */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 1, minWidth: 260 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>1-Unit Shock: {t5Factor} → Spread Impact (bps)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={factorShockImpact} layout="vertical" margin={{ top: 4, right: 20, left: 40, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="sector" type="category" tick={{ fontSize: 10 }} width={60} />
                  <Tooltip />
                  <Bar dataKey="spreadImpact" name="Spread Impact (bps)">
                    {factorShockImpact.map((entry, i) => (
                      <Cell key={i} fill={entry.spreadImpact >= 0 ? T.red : T.blue} />
                    ))}
                  </Bar>
                  <ReferenceLine x={0} stroke={T.border} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* R² scatter */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>R² by Issuer — Factor Explanatory Power ({issuerR2.length} issuers)</div>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart margin={{ top: 4, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="loading" name="Factor Loading" tick={{ fontSize: 10 }} label={{ value: 'Loading', position: 'insideBottom', fontSize: 10, dy: 10 }} />
                <YAxis dataKey="r2" name="R²" tick={{ fontSize: 10 }} label={{ value: 'R²', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={issuerR2} fill={T.indigo} opacity={0.6} />
                <ReferenceLine y={0.5} stroke={T.gold} strokeDasharray="4 4" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Factor contribution bar chart (sector-level) */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Factor Contribution to Sector Spreads — Stacked (bps)</div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>Loading × Factor Volatility × Base Spread — sector average</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={SECTORS.map((s, si) => {
                const row = { sector: s.split(' ')[0] };
                CLIMATE_FACTORS.forEach((f, fi) => {
                  const loading = sr(si * 10 + fi * 3) * 1.2 - 0.3;
                  const vol = 0.03 + sr(si * 10 + fi * 3 + 7) * 0.05;
                  const base = 80 + sr(si * 17) * 120;
                  row[f.name] = +(Math.abs(loading * vol * base)).toFixed(1);
                });
                return row;
              })} margin={{ top: 4, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {CLIMATE_FACTORS.map(f => (
                  <Bar key={f.name} dataKey={f.name} stackId="a" fill={f.color} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Greenium by rating */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Average Greenium by Rating Category (bps)</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={GREENIUM_BY_RATING} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="greenium" name="Greenium (bps)">
                  {GREENIUM_BY_RATING.map((entry, i) => <Cell key={i} fill={entry.greenium < 0 ? T.green : T.muted} />)}
                </Bar>
                <ReferenceLine y={0} stroke={T.border} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ TAB 6 */}
      {tab === 5 && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Sel value={t6Scenario} onChange={setT6Scenario} options={['baseline','adverse','severe']} />
            <Sel value={t6Horizon} onChange={setT6Horizon} options={['1yr','3yr','5yr']} />
            <Sel value={t6FromRating} onChange={setT6FromRating} options={['All', ...RATINGS]} />
          </div>
          {/* Migration Matrix */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Migration Matrix — {t6Scenario.charAt(0).toUpperCase() + t6Scenario.slice(1)} Scenario · {t6Horizon} Horizon</div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>Rows = from-rating, Columns = to-rating. Diagonal = stay probability.</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    <th style={{ padding: '8px 12px', color: T.muted }}>From \\ To</th>
                    {RATINGS.map(r => (
                      <th key={r} style={{ padding: '8px 12px', color: RATING_COLORS[r], fontWeight: 700 }}>{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RATINGS.map((fromR, ri) => {
                    if (t6FromRating !== 'All' && t6FromRating !== fromR) return null;
                    const row = migMatrix[ri];
                    // Compound for horizon
                    return (
                      <tr key={fromR} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: RATING_COLORS[fromR] }}>{fromR}</td>
                        {RATINGS.map((toR, ci) => {
                          const val = row[ci];
                          const isDiag = ri === ci;
                          const isDowngrade = ci > ri;
                          const bg = isDiag ? `rgba(22,163,74,${val * 0.5})` : isDowngrade ? `rgba(220,38,38,${val * 3})` : `rgba(3,105,161,${val * 3})`;
                          return (
                            <td key={toR} style={{ padding: '8px 12px', textAlign: 'center', background: bg, fontWeight: isDiag ? 800 : 400, fontFamily: 'monospace', fontSize: 11 }}>
                              {(val * 100).toFixed(2)}%
                              {isDowngrade && ci - ri > 1 && <span style={{ fontSize: 8, color: T.red, marginLeft: 2 }}>↓↓</span>}
                              {isDowngrade && ci - ri === 1 && <span style={{ fontSize: 8, color: T.amber, marginLeft: 2 }}>↓</span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  }).filter(Boolean)}
                </tbody>
              </table>
            </div>
          </div>
          {/* Default rates */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Default Rate by Rating — {t6Scenario} · {t6Horizon}</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={defaultRates} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v.toFixed(2)}%`} />
                <Tooltip formatter={(v) => `${v.toFixed(3)}%`} />
                <Bar dataKey="defaultRate" name="Default Rate (%)">
                  {defaultRates.map((entry, i) => <Cell key={i} fill={RATING_COLORS[entry.rating]} />)}
                </Bar>
                <ReferenceLine y={0.5} stroke={T.gold} strokeDasharray="4 4" label={{ value: 'Investment Grade boundary', fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Historical default rates by rating (10yr) */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Historical Default Rates 2014–2023 (%) — Annual by Rating</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={DEFAULT_HISTORY} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v.toFixed(2)}%`} />
                <Tooltip formatter={(v) => `${(+v).toFixed(3)}%`} />
                <Legend />
                {RATINGS.map(r => (
                  <Line key={r} type="monotone" dataKey={r} stroke={RATING_COLORS[r]} strokeWidth={1.5} dot={{ r: 2 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* EDF scatter — spread vs PD */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 2, minWidth: 320 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Issuer EDF vs Credit Spread (top-60 issuers)</div>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart margin={{ top: 4, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="edf" name="EDF (%)" tick={{ fontSize: 10 }} label={{ value: 'EDF (%)', position: 'insideBottom', fontSize: 10, dy: 10 }} />
                  <YAxis dataKey="spread" name="OAS (bps)" tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={EDF_DATA} fill={T.purple} opacity={0.7} />
                  <ReferenceLine x={1} stroke={T.red} strokeDasharray="4 4" label={{ value: 'EDF 1%', fontSize: 10 }} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 1, minWidth: 260 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Factor Correlation Matrix</div>
              <table style={{ borderCollapse: 'collapse', fontSize: 11, width: '100%' }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    <th style={{ padding: '6px 8px', color: T.muted }}></th>
                    {CLIMATE_FACTORS.map(f => <th key={f.name} style={{ padding: '6px 8px', color: f.color, fontSize: 10 }}>{f.name.split(' ')[1] || f.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {CLIMATE_FACTORS.map((f, ri) => (
                    <tr key={f.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 8px', color: f.color, fontWeight: 700, fontSize: 10 }}>{f.name.split(' ')[1] || f.name}</td>
                      {FACTOR_CORR[ri].map((v, ci) => {
                        const bg = ri === ci ? `rgba(79,70,229,0.15)` : v > 0.5 ? `rgba(220,38,38,${v * 0.4})` : v < 0 ? `rgba(3,105,161,${Math.abs(v) * 0.4})` : 'transparent';
                        return <td key={ci} style={{ padding: '6px 8px', textAlign: 'center', background: bg, fontFamily: 'monospace', fontWeight: ri === ci ? 800 : 400 }}>{v.toFixed(2)}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ TAB 7 */}
      {tab === 6 && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {RATINGS.map(r => (
                <button key={r} onClick={() => toggleT7Rating(r)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: `2px solid ${RATING_COLORS[r]}`,
                    background: t7Ratings.has(r) ? RATING_COLORS[r] : T.card,
                    color: t7Ratings.has(r) ? '#fff' : RATING_COLORS[r], fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  {r}
                </button>
              ))}
            </div>
            <Sel value={t7SplitType} onChange={setT7SplitType} options={['combined','physical','transition']} />
            <label style={{ fontSize: 12, color: T.text }}>
              Notional ($M): <input type="number" value={t7Notional} onChange={e => setT7Notional(+e.target.value)} min={1} max={1000}
                style={{ width: 80, padding: '3px 6px', borderRadius: 6, border: `1px solid ${T.border}`, marginLeft: 6, fontSize: 12 }} />
            </label>
          </div>
          {/* Term structure chart */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Climate Spread Term Curves — {t7SplitType === 'combined' ? 'Total OAS' : t7SplitType === 'physical' ? 'Physical Premium' : 'Transition Premium'} (bps)</div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>Select ratings to display; 1–30yr maturity</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={termData} margin={{ top: 4, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="maturity" tick={{ fontSize: 10 }} label={{ value: 'Maturity (yr)', position: 'insideBottom', fontSize: 10, dy: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {RATINGS.filter(r => t7Ratings.has(r)).map(r => (
                  <Line key={r} type="monotone" dataKey={r} stroke={RATING_COLORS[r]} strokeWidth={2} dot={false} />
                ))}
                <ReferenceLine x={10} stroke={T.border} strokeDasharray="4 4" label={{ value: '10yr', fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* CS01 table */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>CS01 Calculator — Climate DV01 at 15yr Midpoint (${t7Notional}M Notional)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Rating','Mid Spread (bps)','CS01 ($)','Annual Climate Cost ($M)','Duration-Adj Spread'].map(h => (
                    <th key={h} style={{ padding: '7px 12px', textAlign: 'left', color: T.muted, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cs01Data.map(row => (
                  <tr key={row.rating} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 12px' }}><span style={{ background: RATING_COLORS[row.rating] + '22', color: RATING_COLORS[row.rating], padding: '1px 7px', borderRadius: 4, fontWeight: 700 }}>{row.rating}</span></td>
                    <td style={{ padding: '6px 12px', fontWeight: 700 }}>{row.midSpread}</td>
                    <td style={{ padding: '6px 12px', color: T.indigo, fontWeight: 700 }}>${row.cs01}</td>
                    <td style={{ padding: '6px 12px', color: T.orange }}>${(t7Notional * (+row.midSpread) * 0.0001).toFixed(3)}M</td>
                    <td style={{ padding: '6px 12px', color: T.muted }}>{(+row.midSpread * 0.87).toFixed(1)} bps</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Physical vs transition area chart — 5yr, 10yr, 20yr, 30yr for selected ratings */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Physical vs Transition Component Area — Selected Ratings (bps)</div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>Stacked area shows climate component build-up along the curve</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={termData.filter((_, i) => i < 20)} margin={{ top: 4, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="maturity" tick={{ fontSize: 10 }} label={{ value: 'Maturity (yr)', position: 'insideBottom', fontSize: 10, dy: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {RATINGS.filter(r => t7Ratings.has(r)).slice(0, 3).map((r, ri) => (
                  <Area key={r} type="monotone" dataKey={r} stroke={RATING_COLORS[r]} fill={RATING_COLORS[r]} fillOpacity={0.15} strokeWidth={2} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Spread at key maturities — summary table */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Spread at Key Maturities — {t7SplitType === 'combined' ? 'Total OAS' : t7SplitType === 'physical' ? 'Physical Premium' : 'Transition Premium'} (bps)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  <th style={{ padding: '7px 12px', textAlign: 'left', color: T.muted, fontWeight: 600 }}>Rating</th>
                  {[1,2,3,5,7,10,15,20,30].map(m => (
                    <th key={m} style={{ padding: '7px 12px', textAlign: 'center', color: T.muted, fontWeight: 600 }}>{m}yr</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RATINGS.filter(r => t7Ratings.has(r)).map(r => {
                  const riIdx = RATINGS.indexOf(r);
                  return (
                    <tr key={r} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 12px' }}><span style={{ background: RATING_COLORS[r] + '22', color: RATING_COLORS[r], padding: '1px 7px', borderRadius: 4, fontWeight: 700 }}>{r}</span></td>
                      {[1,2,3,5,7,10,15,20,30].map(m => {
                        const ts = TERM_STRUCTURE[riIdx][m - 1];
                        const v = t7SplitType === 'physical' ? ts.physPremium : t7SplitType === 'transition' ? ts.transPremium : ts.totalSpread;
                        return (
                          <td key={m} style={{ padding: '6px 12px', textAlign: 'center', fontFamily: 'monospace', fontWeight: m === 10 ? 800 : 400, color: m === 10 ? T.navy : T.text }}>
                            {v.toFixed(0)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ TAB 8 */}
      {tab === 7 && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={t8Search} onChange={e => setT8Search(e.target.value)} placeholder="Search to add issuers..."
              style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: 200 }} />
            <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={t8GreenOnly} onChange={e => setT8GreenOnly(e.target.checked)} /> Green only
            </label>
            <label style={{ fontSize: 12 }}>
              Benchmark OAS:
              <input type="range" min={50} max={400} value={t8BenchOAS} onChange={e => setT8BenchOAS(+e.target.value)} style={{ marginLeft: 6, width: 100 }} />
              <strong style={{ marginLeft: 6 }}>{t8BenchOAS} bps</strong>
            </label>
            <button onClick={() => setPortfolioIds(new Set())} style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${T.red}`, color: T.red, background: T.card, cursor: 'pointer', fontSize: 12 }}>
              Clear Portfolio
            </button>
          </div>
          {/* KPIs */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <KpiCard label="Portfolio OAS" value={`${portfolioOAS.toFixed(0)} bps`} color={portfolioOAS > t8BenchOAS ? T.green : T.red} sub={`vs ${t8BenchOAS} bps benchmark`} />
            <KpiCard label="Issuers" value={portfolioItems.length} color={T.navy} sub="in portfolio" />
            <KpiCard label="Green %" value={`${portfolioGreenPct.toFixed(1)}%`} color={T.green} sub="green bonds" />
            <KpiCard label="Climate CVaR" value={`$${portfolioCVaR.toFixed(1)}M`} color={T.red} sub="PD×LGD×EAD" />
            <KpiCard label="Risk-Adj Return" value={portfolioSharpe} color={T.indigo} sub="OAS / Climate CVaR" />
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {/* Candidates table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, flex: 2, minWidth: 320 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Add Issuers (checkbox to include)</div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead style={{ position: 'sticky', top: 0, background: T.sub, zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: '6px 8px' }}></th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', color: T.muted, fontSize: 10 }}>Name</th>
                      <th style={{ padding: '6px 8px', color: T.muted, fontSize: 10 }}>Rating</th>
                      <th style={{ padding: '6px 8px', color: T.muted, fontSize: 10 }}>OAS</th>
                      <th style={{ padding: '6px 8px', color: T.muted, fontSize: 10 }}>Green</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t8Candidates.map(x => (
                      <tr key={x.id} style={{ borderBottom: `1px solid ${T.border}`, background: portfolioIds.has(x.id) ? '#eef2ff' : T.card }}>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                          <input type="checkbox" checked={portfolioIds.has(x.id)} onChange={() => togglePortfolio(x.id)} />
                        </td>
                        <td style={{ padding: '5px 8px', fontWeight: 600 }}>{x.name}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                          <span style={{ color: RATING_COLORS[x.rating], fontWeight: 700 }}>{x.rating}</span>
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>{x.totalSpread.toFixed(0)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>{x.isGreen ? <span style={{ color: T.green }}>✓</span> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Charts */}
            <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Risk Budget</div>
                {portfolioItems.length ? (
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={riskBudgetPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} label={({ name }) => name}>
                        {riskBudgetPie.map((entry, i) => <Cell key={i} fill={[T.orange, T.indigo, T.muted][i]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div style={{ color: T.muted, fontSize: 12, textAlign: 'center', padding: 30 }}>Add issuers to build portfolio</div>}
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Sector Concentration</div>
                {portfolioSectorPie.length ? (
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={portfolioSectorPie} margin={{ top: 4, right: 8, left: 0, bottom: 30 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-40} textAnchor="end" />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill={T.indigo} name="Issuers" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div style={{ color: T.muted, fontSize: 12, textAlign: 'center', padding: 30 }}>No portfolio data</div>}
              </div>
            </div>
          </div>

          {/* Portfolio issuer detail table */}
          {portfolioItems.length > 0 && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Portfolio Issuer Detail ({portfolioItems.length} issuers)</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Issuer','Rating','Sector','OAS (bps)','Phys Prem','Trans Prem','Carbon β','PD','EAD ($M)','EL ($M)','Green?'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, fontSize: 10, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioItems.map(x => (
                      <tr key={x.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '5px 10px', fontWeight: 700 }}>{x.name}</td>
                        <td style={{ padding: '5px 10px' }}><span style={{ color: RATING_COLORS[x.rating], fontWeight: 700 }}>{x.rating}</span></td>
                        <td style={{ padding: '5px 10px', color: T.muted, fontSize: 10 }}>{x.sector}</td>
                        <td style={{ padding: '5px 10px', fontWeight: 700, color: T.navy }}>{x.totalSpread.toFixed(0)}</td>
                        <td style={{ padding: '5px 10px', color: T.orange }}>{x.physPremium.toFixed(1)}</td>
                        <td style={{ padding: '5px 10px', color: T.indigo }}>{x.transPremium.toFixed(1)}</td>
                        <td style={{ padding: '5px 10px', fontFamily: 'monospace' }}>{x.carbonBeta.toFixed(3)}</td>
                        <td style={{ padding: '5px 10px', color: T.red }}>{(x.climatePD * 100).toFixed(2)}%</td>
                        <td style={{ padding: '5px 10px' }}>{x.ead.toFixed(0)}</td>
                        <td style={{ padding: '5px 10px', color: T.amber }}>{(x.climatePD * x.lgd * x.ead).toFixed(2)}</td>
                        <td style={{ padding: '5px 10px' }}>{x.isGreen ? <span style={{ color: T.green, fontWeight: 700 }}>✓</span> : '—'}</td>
                      </tr>
                    ))}
                    <tr style={{ background: T.sub, fontWeight: 700 }}>
                      <td style={{ padding: '6px 10px' }} colSpan={3}>Portfolio Average / Total</td>
                      <td style={{ padding: '6px 10px', color: T.navy }}>{portfolioOAS.toFixed(0)}</td>
                      <td style={{ padding: '6px 10px', color: T.orange }}>{portfolioItems.length ? (portfolioItems.reduce((s, x) => s + x.physPremium, 0) / portfolioItems.length).toFixed(1) : '—'}</td>
                      <td style={{ padding: '6px 10px', color: T.indigo }}>{portfolioItems.length ? (portfolioItems.reduce((s, x) => s + x.transPremium, 0) / portfolioItems.length).toFixed(1) : '—'}</td>
                      <td style={{ padding: '6px 10px' }}>{portfolioItems.length ? (portfolioItems.reduce((s, x) => s + x.carbonBeta, 0) / portfolioItems.length).toFixed(3) : '—'}</td>
                      <td style={{ padding: '6px 10px', color: T.red }}>{portfolioItems.length ? ((portfolioItems.reduce((s, x) => s + x.climatePD, 0) / portfolioItems.length) * 100).toFixed(2) + '%' : '—'}</td>
                      <td style={{ padding: '6px 10px' }}>{portfolioItems.reduce((s, x) => s + x.ead, 0).toFixed(0)}</td>
                      <td style={{ padding: '6px 10px', color: T.amber }}>${portfolioCVaR.toFixed(2)}M</td>
                      <td style={{ padding: '6px 10px' }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* OAS spread vs benchmark area chart */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Portfolio OAS vs Benchmark — 36-Month Trajectory</div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>
              Benchmark: {t8BenchOAS} bps (adjustable above) · Shaded area = excess spread over benchmark
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={OAS_TIME_SERIES} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="benchmarkOAS" stroke={T.gold} fill={T.gold} fillOpacity={0.1} strokeWidth={2} name="Benchmark OAS" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="portfolioOAS" stroke={T.indigo} fill={T.indigo} fillOpacity={0.15} strokeWidth={2} name="Portfolio OAS" />
                <ReferenceLine y={t8BenchOAS} stroke={T.gold} strokeDasharray="6 3" label={{ value: `Benchmark ${t8BenchOAS}bps`, fontSize: 10 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ TAB 9 */}
      {tab === 8 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 12 }}>
              Carbon Price ($/tonne):
              <input type="range" min={0} max={300} value={t9CarbonPrice} onChange={e => setT9CarbonPrice(+e.target.value)} style={{ marginLeft: 8, width: 120 }} />
              <strong style={{ marginLeft: 6 }}>${t9CarbonPrice}</strong>
            </label>
            <label style={{ fontSize: 12 }}>
              Hedge Ratio:
              <input type="range" min={0} max={100} value={t9HedgeRatio} onChange={e => setT9HedgeRatio(+e.target.value)} style={{ marginLeft: 8, width: 100 }} />
              <strong style={{ marginLeft: 6 }}>{t9HedgeRatio}%</strong>
            </label>
            <Sel value={t9SectorFocus} onChange={setT9SectorFocus} options={['All', ...SECTORS]} />
          </div>
          {/* Carbon Beta by sector */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Carbon Beta × Carbon Price → Spread Widening (bps)</div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>Carbon price: ${t9CarbonPrice}/tonne · Hedge ratio: {t9HedgeRatio}%</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={carbonBetaBySector} margin={{ top: 4, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="spreadWidening" fill={T.red} name="Gross Spread Widening" />
                <Bar dataKey="hedgeCost" fill={T.orange} name="Hedge Cost" />
                <Bar dataKey="netSpread" fill={T.green} name="Net Spread Impact" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {/* Beta vs ESG scatter */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 2, minWidth: 320 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Carbon Beta vs ESG Score</div>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart margin={{ top: 4, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="esgScore" name="ESG Score" tick={{ fontSize: 10 }} label={{ value: 'ESG Score', position: 'insideBottom', fontSize: 10, dy: 10 }} />
                  <YAxis dataKey="carbonBeta" name="Carbon Beta" tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={betaEsgScatter} fill={T.orange} opacity={0.7} />
                  <ReferenceLine y={0.5} stroke={T.red} strokeDasharray="4 4" label={{ value: 'High beta', fontSize: 10 }} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            {/* Hedging cost table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, flex: 1, minWidth: 260 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Hedging Cost Estimator</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left', color: T.muted }}>Sector</th>
                    <th style={{ padding: '6px 8px', color: T.muted }}>Avg β</th>
                    <th style={{ padding: '6px 8px', color: T.red }}>Gross</th>
                    <th style={{ padding: '6px 8px', color: T.green }}>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {carbonBetaBySector.slice(0, 10).map(row => (
                    <tr key={row.sector} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '5px 8px', fontWeight: 600 }}>{row.sector}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', fontFamily: 'monospace' }}>{row.avgBeta}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: T.red }}>{row.spreadWidening}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: T.green }}>{row.netSpread}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Spread volatility series */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Daily Spread Change & Rolling 10-Day Volatility (bps)</div>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={SPREAD_VOL_SERIES} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="change" name="Daily Δ OAS">
                  {SPREAD_VOL_SERIES.map((e, i) => <Cell key={i} fill={e.change >= 0 ? T.red : T.green} />)}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="rollingVol" stroke={T.orange} strokeWidth={2} dot={false} name="Rolling Vol (bps)" />
                <ReferenceLine yAxisId="left" y={0} stroke={T.border} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* CDS Basis Table */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Climate-Adjusted CDS Basis — Cash Bond OAS vs CDS Premium (top-40 issuers)</div>
            <div style={{ overflowX: 'auto', maxHeight: 260, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead style={{ position: 'sticky', top: 0, background: T.sub, zIndex: 1 }}>
                  <tr>
                    {['Issuer','Sector','5yr CDS (bps)','Clim-Adj CDS (bps)','Cash OAS approx','Basis (CDS-OAS)','Signal'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, fontSize: 10, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CDS_DATA.map(row => (
                    <tr key={row.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '5px 10px', fontWeight: 700 }}>{row.name}</td>
                      <td style={{ padding: '5px 10px', color: T.muted }}>{row.sector}</td>
                      <td style={{ padding: '5px 10px' }}>{row.cds5yr}</td>
                      <td style={{ padding: '5px 10px', color: T.amber }}>{row.climAdjCDS}</td>
                      <td style={{ padding: '5px 10px' }}>{(+row.cds5yr * 0.92).toFixed(0)}</td>
                      <td style={{ padding: '5px 10px', color: row.basis > 0 ? T.red : T.green, fontWeight: 700 }}>{row.basis > 0 ? '+' : ''}{row.basis}</td>
                      <td style={{ padding: '5px 10px' }}>
                        <span style={{ color: row.basis > 5 ? T.red : row.basis < -5 ? T.green : T.muted, fontWeight: 600 }}>
                          {row.basis > 5 ? 'CDS Rich' : row.basis < -5 ? 'Bond Rich' : 'Fair'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Carbon intensity vs spread */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Carbon Intensity vs Credit Spread (tCO2e/$M revenue × OAS)</div>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart margin={{ top: 4, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="carbonIntensity" name="Carbon Intensity" tick={{ fontSize: 10 }} label={{ value: 'Carbon Intensity (tCO2e/$M rev)', position: 'insideBottom', fontSize: 10, dy: 10 }} />
                <YAxis dataKey="spread" name="OAS (bps)" tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={CARBON_INTENSITY_SCATTER} fill={T.teal} opacity={0.65} />
                <ReferenceLine x={400} stroke={T.red} strokeDasharray="4 4" label={{ value: 'High intensity', fontSize: 10 }} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ TAB 10 */}
      {tab === 9 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            {Object.keys(t10Sections).map(k => (
              <label key={k} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="checkbox" checked={t10Sections[k]} onChange={e => setT10Sections(p => ({ ...p, [k]: e.target.checked }))} />
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </label>
            ))}
            <Sel value={t10Format} onChange={setT10Format} options={['Summary','Detail']} />
          </div>

          {/* Decomposition Table */}
          {t10Sections.decomp && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Full Portfolio Spread Decomposition</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Sector','Avg OAS','Phys Premium','Trans Premium','Residual','Climate %','Green Bond %','Avg Carbon β'].map(h => (
                      <th key={h} style={{ padding: '7px 12px', textAlign: 'left', color: T.muted, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SECTORS.map((s, si) => {
                    const sub = ISSUERS.filter(x => x.sector === s);
                    if (!sub.length) return null;
                    const n = sub.length;
                    const avgOASRow = sub.reduce((a, x) => a + x.totalSpread, 0) / n;
                    const avgPhysRow = sub.reduce((a, x) => a + x.physPremium, 0) / n;
                    const avgTransRow = sub.reduce((a, x) => a + x.transPremium, 0) / n;
                    const avgResRow = sub.reduce((a, x) => a + x.residualPremium, 0) / n;
                    const climPct = avgOASRow > 0 ? (avgPhysRow + avgTransRow) / avgOASRow * 100 : 0;
                    const greenPctRow = sub.filter(x => x.isGreen).length / n * 100;
                    const avgBetaRow = sub.reduce((a, x) => a + x.carbonBeta, 0) / n;
                    return (
                      <tr key={s} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '7px 12px', fontWeight: 700 }}>{s}</td>
                        <td style={{ padding: '7px 12px', fontWeight: 700, color: T.navy }}>{avgOASRow.toFixed(0)}</td>
                        <td style={{ padding: '7px 12px', color: T.orange }}>{avgPhysRow.toFixed(1)}</td>
                        <td style={{ padding: '7px 12px', color: T.indigo }}>{avgTransRow.toFixed(1)}</td>
                        <td style={{ padding: '7px 12px', color: T.muted }}>{avgResRow.toFixed(1)}</td>
                        <td style={{ padding: '7px 12px', color: climPct > 30 ? T.red : T.green, fontWeight: 700 }}>{climPct.toFixed(1)}%</td>
                        <td style={{ padding: '7px 12px', color: T.green }}>{greenPctRow.toFixed(0)}%</td>
                        <td style={{ padding: '7px 12px', fontFamily: 'monospace' }}>{avgBetaRow.toFixed(3)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Basel SA-CR Climate RWA */}
          {t10Sections.rwa && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Basel SA-CR Climate RWA Impact</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {RATINGS.map((r, ri) => {
                  const baseRW = [0.20, 0.20, 0.50, 1.00, 1.50, 1.50, 1.50][ri];
                  const climateAdj = baseRW * (1 + sr(ri * 41) * 0.3);
                  const sub = ISSUERS.filter(x => x.rating === r);
                  const totalEAD = sub.reduce((a, x) => a + x.ead, 0);
                  const rwa = totalEAD * climateAdj;
                  return (
                    <div key={r} style={{ background: T.sub, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 110, border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: RATING_COLORS[r] }}>{r}</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Base RW: {(baseRW * 100).toFixed(0)}%</div>
                      <div style={{ fontSize: 11, color: T.amber, marginTop: 2 }}>Clim-Adj: {(climateAdj * 100).toFixed(0)}%</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginTop: 4 }}>RWA: ${(rwa / 1000).toFixed(1)}Bn</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SFDR PAI #18 */}
          {t10Sections.sfdr && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>SFDR PAI #18 — Climate Spread Indicator</div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>Portfolio-weighted climate risk premium as PAI mandatory disclosure metric per SFDR Annex I Table 2, row 18.</div>
              {t10Format === 'Detail' && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: 11, width: '100%' }}>
                    <thead>
                      <tr style={{ background: T.sub }}>
                        {['PAI Indicator','Metric','2022','2023','2024 (est.)','Unit','Threshold','Status'].map(h => (
                          <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.muted, fontSize: 10, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { ind: 'PAI #18', metric: 'Climate-adj credit spread avg', v22: '42.3', v23: '47.1', v24: '51.8', unit: 'bps', threshold: '<50', ok: true },
                        { ind: 'PAI #18a', metric: 'Physical risk premium share', v22: '18.2%', v23: '19.4%', v24: '21.0%', unit: '%', threshold: '<25%', ok: true },
                        { ind: 'PAI #18b', metric: 'Transition risk premium share', v22: '14.6%', v23: '16.2%', v24: '17.5%', unit: '%', threshold: '<20%', ok: true },
                      ].map(row => (
                        <tr key={row.ind} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '6px 10px', fontWeight: 700, color: T.indigo }}>{row.ind}</td>
                          <td style={{ padding: '6px 10px' }}>{row.metric}</td>
                          <td style={{ padding: '6px 10px' }}>{row.v22}</td>
                          <td style={{ padding: '6px 10px' }}>{row.v23}</td>
                          <td style={{ padding: '6px 10px', fontWeight: 700 }}>{row.v24}</td>
                          <td style={{ padding: '6px 10px', color: T.muted }}>{row.unit}</td>
                          <td style={{ padding: '6px 10px', color: T.muted }}>{row.threshold}</td>
                          <td style={{ padding: '6px 10px' }}><span style={{ color: row.ok ? T.green : T.red, fontWeight: 700 }}>{row.ok ? '✓ Pass' : '✗ Breach'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Methodology */}
          {t10Sections.methodology && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Methodology Notes</div>
              <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7 }}>
                <p><strong>OAS Decomposition:</strong> Total OAS = Physical Premium + Transition Premium + Residual. Physical and transition premiums are derived via factor regression against 4 climate factors (Physical Acute, Physical Chronic, Transition Policy, Transition Technology). Factor loadings are sector-specific.</p>
                <p><strong>Carbon Beta:</strong> Sensitivity of credit spreads to a $1/tonne increase in carbon price. Estimated via cross-sectional regression of spread changes on sector-weighted emissions intensity. Formula: β = 0.4×PhysRisk + 0.6×TransRisk / 100.</p>
                <p><strong>Greenium:</strong> Spread differential between green-labelled bonds and conventional comparables from the same issuer or matched peers. Negative values indicate a greenium (green bonds trade tighter). Significance tested at 95% confidence.</p>
                <p><strong>Migration Matrix:</strong> Annual 1-year transition probabilities calibrated to Moody's/S&P historical data with climate adjustment overlays. Adverse and Severe scenarios apply progressive shocks to diagonal (stay) probabilities.</p>
                <p><strong>CS01:</strong> Climate DV01 — dollar sensitivity of portfolio value to a 1bp widening in climate-adjusted credit spread. CS01 = Notional × Spread × 0.0001 × Modified Duration proxy.</p>
              </div>
            </div>
          )}

          {/* Export */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Export</div>
            <button onClick={() => {
              const exportData = {
                generatedAt: new Date().toISOString(),
                format: t10Format,
                sections: t10Sections,
                summary: {
                  totalIssuers: ISSUERS.length,
                  avgOAS: ISSUERS.reduce((s, x) => s + x.totalSpread, 0) / ISSUERS.length,
                  avgClimatePremium: ISSUERS.reduce((s, x) => s + x.physPremium + x.transPremium, 0) / ISSUERS.length,
                  greenBondCount: ISSUERS.filter(x => x.isGreen).length,
                  sectors: SECTORS.length,
                },
                sectors: SECTORS.map(s => {
                  const sub = ISSUERS.filter(x => x.sector === s);
                  return {
                    sector: s,
                    count: sub.length,
                    avgOAS: sub.length ? (sub.reduce((a, x) => a + x.totalSpread, 0) / sub.length).toFixed(1) : 0,
                  };
                }),
              };
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'climate_risk_premium_export.json'; a.click();
              URL.revokeObjectURL(url);
            }} style={{ padding: '8px 20px', borderRadius: 8, background: T.indigo, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
              Download JSON Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
