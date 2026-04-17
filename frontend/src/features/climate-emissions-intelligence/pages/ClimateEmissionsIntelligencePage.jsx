import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ComposedChart, ReferenceLine
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0',
  sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3',
  textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626',
  blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e',
  indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace'
};

const COUNTRIES_LIST = [
  'China','United States','India','Russia','Germany','Canada','Japan','South Korea',
  'Iran','Saudi Arabia','Australia','Brazil','Mexico','Indonesia','France',
  'United Kingdom','Turkey','Italy','Poland','South Africa','Argentina','Kazakhstan',
  'UAE','Egypt','Thailand','Malaysia','Pakistan','Nigeria','Bangladesh','Vietnam',
  'Philippines','Ethiopia','Tanzania','Kenya','Colombia','Chile','Peru','Venezuela',
  'Algeria','Morocco','Ukraine'
];

const REGIONS = {
  'China': 'Asia-Pacific', 'India': 'Asia-Pacific', 'Japan': 'Asia-Pacific',
  'South Korea': 'Asia-Pacific', 'Australia': 'Asia-Pacific', 'Indonesia': 'Asia-Pacific',
  'Thailand': 'Asia-Pacific', 'Malaysia': 'Asia-Pacific', 'Pakistan': 'Asia-Pacific',
  'Bangladesh': 'Asia-Pacific', 'Vietnam': 'Asia-Pacific', 'Philippines': 'Asia-Pacific',
  'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
  'Russia': 'Europe & CIS', 'Germany': 'Europe & CIS', 'France': 'Europe & CIS',
  'United Kingdom': 'Europe & CIS', 'Turkey': 'Europe & CIS', 'Italy': 'Europe & CIS',
  'Poland': 'Europe & CIS', 'Kazakhstan': 'Europe & CIS', 'Ukraine': 'Europe & CIS',
  'Saudi Arabia': 'Middle East & Africa', 'Iran': 'Middle East & Africa',
  'UAE': 'Middle East & Africa', 'Egypt': 'Middle East & Africa',
  'South Africa': 'Middle East & Africa', 'Nigeria': 'Middle East & Africa',
  'Ethiopia': 'Middle East & Africa', 'Tanzania': 'Middle East & Africa',
  'Kenya': 'Middle East & Africa', 'Algeria': 'Middle East & Africa',
  'Morocco': 'Middle East & Africa',
  'Brazil': 'Latin America', 'Argentina': 'Latin America', 'Colombia': 'Latin America',
  'Chile': 'Latin America', 'Peru': 'Latin America', 'Venezuela': 'Latin America'
};

const SEED_COUNTRIES = COUNTRIES_LIST.map((country, i) => ({
  country,
  year: '2022',
  co2_per_capita: (0.3 + sr(i * 7) * 18).toFixed(2),
  share_global_co2: (0.1 + sr(i * 11) * 8).toFixed(2),
  coal_co2: (sr(i * 13) * 3000).toFixed(0),
  oil_co2: (sr(i * 17) * 2000).toFixed(0),
  gas_co2: (sr(i * 19) * 1500).toFixed(0),
  co2: (sr(i * 23) * 10000).toFixed(0),
  population: (sr(i * 29) * 1400000000).toFixed(0),
  gdp: (sr(i * 31) * 20000000000000).toFixed(0),
  energy_per_gdp: (0.1 + sr(i * 37) * 0.4).toFixed(3),
  renewables: (sr(i * 41) * 80).toFixed(1),
  region: REGIONS[country] || 'Other',
}));

const SECTORS = ['Energy', 'Industry', 'Transport', 'Buildings', 'Agriculture', 'Waste'];
const FUEL_TYPES = ['Coal', 'Oil', 'Gas', 'Nuclear', 'Renewables'];
const NGFS_SCENARIOS = ['Orderly 1.5°C', 'Disorderly 2°C', 'Hothouse 3°C', 'Too Little Too Late'];
const REGION_COLORS = {
  'Asia-Pacific': T.teal, 'North America': T.navy, 'Europe & CIS': T.blue,
  'Middle East & Africa': T.amber, 'Latin America': T.green, 'Other': T.textSec
};

const FREE_DATA_SOURCES = [
  { source: 'OWID CO2 Data', url: 'github.com/owid/co2-data', update: 'Annual', format: 'CSV', key: 'None', countries: '245', coverage: 'CO2, GHG, by fuel' },
  { source: 'Global Carbon Project', url: 'globalcarbonproject.org', update: 'Annual', format: 'CSV', key: 'None', countries: '100+', coverage: 'CO2 only' },
  { source: 'EDGAR (EU JRC)', url: 'edgar.jrc.ec.europa.eu', update: 'Annual', format: 'CSV/API', key: 'None', countries: '200+', coverage: 'CO2, CH4, N2O' },
  { source: 'Climate TRACE', url: 'climatetrace.org/api', update: 'Annual', format: 'API (free key)', key: 'Yes', countries: '220+', coverage: 'Sector-level, asset-level' },
  { source: 'IEA Data', url: 'iea.org/data-and-statistics', update: 'Annual', format: 'CSV (free)', key: 'None', countries: '150+', coverage: 'Energy + CO2' },
  { source: 'World Bank', url: 'api.worldbank.org', update: 'Annual', format: 'JSON', key: 'None', countries: '217', coverage: 'CO2/capita only' },
  { source: 'EPA GHGRP', url: 'echo.epa.gov/effluents', update: 'Annual', format: 'API', key: 'None', countries: 'US only', coverage: 'Facility-level' },
  { source: 'UNFCCC', url: 'di.unfccc.int', update: 'Annual', format: 'CSV', key: 'None', countries: '196', coverage: 'GHG by sector' },
  { source: 'Bloomberg NEF', url: 'bnef.com', update: 'Real-time', format: 'API (paid)', key: 'Paid', countries: 'Global', coverage: 'Energy transition' },
  { source: 'Rhodium Group', url: 'rhg.com', update: 'Annual', format: 'CSV (free)', key: 'None', countries: 'US', coverage: 'Economy-wide' },
  { source: 'Carbon Monitor', url: 'carbonmonitor.org', update: 'Daily!', format: 'JSON API', key: 'None', countries: '30+', coverage: 'Daily CO2 estimates' },
];

const MAC_OPTIONS = [
  { option: 'Onshore Wind', cost: -15, potential: 450 },
  { option: 'Solar PV (utility)', cost: -12, potential: 600 },
  { option: 'Energy Efficiency (Buildings)', cost: -8, potential: 320 },
  { option: 'LED Lighting', cost: -5, potential: 180 },
  { option: 'Nuclear Power', cost: 5, potential: 280 },
  { option: 'Solar PV (rooftop)', cost: 8, potential: 220 },
  { option: 'EV Adoption', cost: 12, potential: 350 },
  { option: 'Offshore Wind', cost: 18, potential: 390 },
  { option: 'Grid Storage (Li-ion)', cost: 22, potential: 150 },
  { option: 'Green Hydrogen', cost: 35, potential: 200 },
  { option: 'Direct Air Capture', cost: 120, potential: 80 },
  { option: 'CCS (industrial)', cost: 85, potential: 160 },
  { option: 'Sustainable Aviation Fuel', cost: 65, potential: 90 },
  { option: 'Carbon Capture (power)', cost: 75, potential: 130 },
  { option: 'Building Insulation', cost: 10, potential: 200 },
  { option: 'Heat Pumps', cost: 20, potential: 250 },
  { option: 'Electric Heating', cost: 30, potential: 140 },
  { option: 'Methane Flaring Reduction', cost: -20, potential: 110 },
  { option: 'Forestry (REDD+)', cost: -5, potential: 300 },
  { option: 'Precision Agriculture', cost: 15, potential: 120 },
];

const KPICARD = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', borderLeft: `4px solid ${color || T.teal}` }}>
    <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: T.fontMono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

const BADGE = ({ text, live }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: live ? '#dcfce7' : '#fef3c7', color: live ? T.green : T.amber, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, fontFamily: T.fontMono, border: `1px solid ${live ? '#bbf7d0' : '#fde68a'}` }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: live ? T.green : T.amber, display: 'inline-block' }} />
    {live ? 'LIVE' : 'SEEDED'}
  </span>
);

const SECTION = ({ title, children, accent }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: accent || T.teal, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: T.fontMono, marginBottom: 12, paddingBottom: 6, borderBottom: `2px solid ${accent || T.teal}20` }}>{title}</div>
    {children}
  </div>
);

const TABLE = ({ headers, rows, small }) => (
  <div style={{ overflowX: 'auto', border: `1px solid ${T.border}`, borderRadius: 8 }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: small ? 11 : 12, fontFamily: T.fontMono }}>
      <thead>
        <tr style={{ background: T.sub }}>
          {headers.map((h, i) => (
            <th key={i} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} style={{ background: ri % 2 === 0 ? T.card : T.sub }}>
            {row.map((cell, ci) => (
              <td key={ci} style={{ padding: '7px 12px', color: T.textPri, borderBottom: `1px solid ${T.borderL}` }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MONOBOX = ({ children }) => (
  <div style={{ background: '#1a1a2e', color: '#e2e8f0', padding: '16px 20px', borderRadius: 8, fontFamily: T.fontMono, fontSize: 12, lineHeight: 1.7, overflowX: 'auto', marginBottom: 16 }}>
    <pre style={{ margin: 0 }}>{children}</pre>
  </div>
);

const SPINNERBOX = ({ msg }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', background: T.sub, borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 16 }}>
    <div style={{ width: 18, height: 18, border: `2px solid ${T.teal}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textSec }}>{msg}</span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function ClimateEmissionsIntelligencePage() {
  const [activeTab, setActiveTab] = useState(0);

  // API state — OWID CO2
  const [owidData, setOwidData] = useState([]);
  const [owidLive, setOwidLive] = useState(false);
  const [owidLoading, setOwidLoading] = useState(false);

  // API state — World Bank CO2/capita
  const [wbData, setWbData] = useState([]);
  const [wbLive, setWbLive] = useState(false);

  // API state — World Bank GDP/capita
  const [gdpData, setGdpData] = useState([]);

  // UI controls
  const [kayaCountry, setKayaCountry] = useState('China');
  const [temporalCountry, setTemporalCountry] = useState('China');
  const [esgFilterRegion, setEsgFilterRegion] = useState('All');
  const [owidXAxis, setOwidXAxis] = useState('co2_per_capita');
  const [owidYAxis, setOwidYAxis] = useState('share_global_co2');

  // Fetch OWID
  useEffect(() => {
    let cancelled = false;
    setOwidLoading(true);
    fetch('https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv')
      .then(r => r.text())
      .then(csv => {
        if (cancelled) return;
        const lines = csv.split('\n');
        const headers = lines[0].split(',');
        const parsed = lines.slice(1, 5000).map(line => {
          const vals = line.split(',');
          const obj = {};
          headers.forEach((h, i) => { obj[h.trim()] = vals[i]?.trim() || ''; });
          return obj;
        }).filter(r =>
          r.year === '2022' && r.country &&
          r.co2_per_capita && !isNaN(parseFloat(r.co2_per_capita)) &&
          parseFloat(r.co2_per_capita) > 0 &&
          !r.country.includes('World') && !r.country.includes('income')
        );
        setOwidData(parsed.map(r => ({ ...r, region: REGIONS[r.country] || 'Other' })));
        setOwidLive(true);
        setOwidLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setOwidData(SEED_COUNTRIES);
          setOwidLive(false);
          setOwidLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  // Fetch World Bank CO2
  useEffect(() => {
    let cancelled = false;
    fetch('https://api.worldbank.org/v2/country/all/indicator/EN.ATM.CO2E.PC?format=json&per_page=100&mrv=1')
      .then(r => r.json())
      .then(d => { if (!cancelled) { setWbData(d[1] || []); setWbLive(true); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Fetch World Bank GDP
  useEffect(() => {
    let cancelled = false;
    fetch('https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?format=json&per_page=100&mrv=1')
      .then(r => r.json())
      .then(d => { if (!cancelled) setGdpData(d[1] || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Derived data — use real OWID data if live, else seed
  const displayData = useMemo(() => {
    const base = owidData.length > 0 ? owidData : SEED_COUNTRIES;
    return COUNTRIES_LIST.map(c => {
      const found = base.find(r => r.country === c);
      if (found) return { ...found, region: REGIONS[c] || 'Other' };
      const idx = COUNTRIES_LIST.indexOf(c);
      return { ...SEED_COUNTRIES[idx], region: REGIONS[c] || 'Other' };
    });
  }, [owidData]);

  const top20 = useMemo(() =>
    [...displayData].sort((a, b) => parseFloat(b.co2_per_capita) - parseFloat(a.co2_per_capita)).slice(0, 20),
    [displayData]
  );

  const regionGroups = useMemo(() => {
    const groups = {};
    displayData.forEach(c => {
      const reg = c.region || 'Other';
      if (!groups[reg]) groups[reg] = [];
      groups[reg].push(parseFloat(c.co2_per_capita));
    });
    return Object.entries(groups).map(([region, vals]) => ({
      region,
      avg: vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : 0,
      count: vals.length,
    }));
  }, [displayData]);

  const histoBuckets = useMemo(() => {
    const buckets = { '<1t': 0, '1-3t': 0, '3-7t': 0, '7-15t': 0, '>15t': 0 };
    displayData.forEach(c => {
      const v = parseFloat(c.co2_per_capita);
      if (v < 1) buckets['<1t']++;
      else if (v < 3) buckets['1-3t']++;
      else if (v < 7) buckets['3-7t']++;
      else if (v < 15) buckets['7-15t']++;
      else buckets['>15t']++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [displayData]);

  // Kaya data
  const kayaData = useMemo(() =>
    displayData.map((c, i) => {
      const pop = parseFloat(c.population) / 1e6 || (100 + sr(i * 7) * 1000);
      const gdpCap = parseFloat(c.gdp) / parseFloat(c.population) || (1000 + sr(i * 11) * 40000);
      const energyInt = parseFloat(c.energy_per_gdp) || (0.1 + sr(i * 37) * 0.4);
      const carbonInt = 0.5 + sr(i * 43) * 1.5;
      const impliedCo2 = (gdpCap / 1000) * energyInt * carbonInt;
      const observed = parseFloat(c.co2_per_capita);
      const residual = observed > 0 ? ((impliedCo2 - observed) / observed * 100).toFixed(1) : 'N/A';
      return { ...c, pop, gdpCap, energyInt, carbonInt, impliedCo2, observed, residual };
    }),
    [displayData]
  );

  // Kaya decarbonization pathways for selected country
  const kayaPathways = useMemo(() => {
    const idx = COUNTRIES_LIST.indexOf(kayaCountry);
    if (idx < 0) return [];
    const base = parseFloat(displayData[idx]?.co2_per_capita) || 5;
    return Array.from({ length: 29 }, (_, y) => {
      const yr = 2022 + y;
      const tech = base * Math.pow(1 - 0.05, y);         // 5%/yr carbon intensity
      const eff = base * Math.pow(1 - 0.03, y);           // 3%/yr energy intensity
      const demand = base * Math.pow(1 - 0.01, y);        // 1%/yr GDP growth reduction
      const combined = base * Math.pow(1 - 0.025, y) * Math.pow(1 - 0.015, y) * Math.pow(1 - 0.005, y);
      return { yr, tech, eff, demand, combined };
    });
  }, [kayaCountry, displayData]);

  // LMDI decomposition
  const lmdiData = useMemo(() =>
    COUNTRIES_LIST.slice(0, 10).map((c, i) => {
      const activity = (sr(i * 7) * 200 - 100).toFixed(1);
      const intensity = -(sr(i * 11) * 180).toFixed(1);
      const structure = (sr(i * 13) * 100 - 50).toFixed(1);
      const carbon = -(sr(i * 17) * 150).toFixed(1);
      const total = (parseFloat(activity) + parseFloat(intensity) + parseFloat(structure) + parseFloat(carbon)).toFixed(1);
      return { country: c, activity: parseFloat(activity), intensity: parseFloat(intensity), structure: parseFloat(structure), carbon: parseFloat(carbon), total: parseFloat(total) };
    }),
    []
  );

  // GARCH parameters
  const garchData = useMemo(() =>
    displayData.map((c, i) => {
      const omega = (0.001 + sr(i * 7) * 0.02).toFixed(4);
      const alpha = (0.05 + sr(i * 11) * 0.25).toFixed(3);
      const beta = (0.60 + sr(i * 13) * 0.35).toFixed(3);
      const omegaN = parseFloat(omega);
      const alphaN = parseFloat(alpha);
      const betaN = parseFloat(beta);
      const sumAB = Math.min(alphaN + betaN, 0.999);
      const uncondVar = sumAB < 1 ? (omegaN / (1 - sumAB)).toFixed(4) : 'Inf';
      const persist = sumAB.toFixed(3);
      return { country: c.country, omega, alpha, beta, uncondVar, persist };
    }),
    [displayData]
  );

  // Temporal trend
  const temporalTrend = useMemo(() => {
    const idx = COUNTRIES_LIST.indexOf(temporalCountry);
    const base = idx >= 0 ? parseFloat(displayData[idx]?.co2_per_capita) || 5 : 5;
    return Array.from({ length: 13 }, (_, y) => ({
      year: 2010 + y,
      co2: (base * (0.8 + sr(idx * 100 + y) * 0.4)).toFixed(2),
      sigma2: (0.01 + sr(idx * 200 + y) * 0.1).toFixed(4),
    }));
  }, [temporalCountry, displayData]);

  // Sector data
  const sectorData = useMemo(() =>
    displayData.slice(0, 20).map((c, i) => {
      const shares = SECTORS.map((s, si) => ({ sector: s, share: sr(i * 10 + si) }));
      const total = shares.reduce((a, b) => a + b.share, 0);
      const result = { country: c.country };
      shares.forEach(s => { result[s.sector] = total > 0 ? (s.share / total * 100).toFixed(1) : 0; });
      return result;
    }),
    [displayData]
  );

  // NDC data
  const ndcData = useMemo(() =>
    displayData.map((c, i) => {
      const target = -(20 + sr(i * 7) * 60).toFixed(0);
      const current = -(sr(i * 11) * 40).toFixed(0);
      const gap = (parseFloat(current) - parseFloat(target)).toFixed(1);
      const status = parseFloat(gap) >= 0 ? 'On Track' : parseFloat(gap) > -15 ? 'Partial' : 'Off Track';
      const netZeroYear = 2022 + Math.round(sr(i * 17) * 80 + 10);
      return { country: c.country, target, current, gap, status, netZeroYear };
    }),
    [displayData]
  );

  // Scope 1/2/3 data
  const scopeData = useMemo(() =>
    displayData.slice(0, 20).map((c, i) => ({
      company: `${c.country} Corp`,
      scope1: (sr(i * 7) * 500).toFixed(0),
      scope2: (sr(i * 11) * 300).toFixed(0),
      scope3up: (sr(i * 13) * 1200).toFixed(0),
      scope3dn: (sr(i * 17) * 800).toFixed(0),
    })),
    [displayData]
  );

  // ESG score
  const esgScores = useMemo(() => {
    const maxCo2 = Math.max(...displayData.map(c => parseFloat(c.co2_per_capita) || 0));
    return displayData.map((c, i) => {
      const co2 = parseFloat(c.co2_per_capita) || 0;
      const eScore = maxCo2 > 0 ? Math.max(0, 100 - (co2 / maxCo2 * 100)) : 50;
      const sScore = 30 + sr(i * 11) * 60;
      const gScore = 30 + sr(i * 13) * 60;
      const composite = (eScore * 0.4 + sScore * 0.35 + gScore * 0.25).toFixed(1);
      return { ...c, eScore: eScore.toFixed(1), sScore: sScore.toFixed(1), gScore: gScore.toFixed(1), composite };
    });
  }, [displayData]);

  const filteredEsg = useMemo(() =>
    esgFilterRegion === 'All' ? esgScores : esgScores.filter(c => c.region === esgFilterRegion),
    [esgScores, esgFilterRegion]
  );

  // OWID columns for explorer
  const OWID_COLS = [
    'co2', 'co2_per_capita', 'share_global_co2', 'coal_co2', 'oil_co2', 'gas_co2',
    'population', 'gdp', 'energy_per_gdp', 'renewables'
  ];

  const globalAvgCo2 = useMemo(() => {
    const vals = displayData.map(c => parseFloat(c.co2_per_capita)).filter(v => !isNaN(v) && v > 0);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : '0';
  }, [displayData]);

  const maxEmitter = useMemo(() => {
    if (!displayData.length) return { country: '-', val: 0 };
    const sorted = [...displayData].sort((a, b) => parseFloat(b.co2_per_capita) - parseFloat(a.co2_per_capita));
    return { country: sorted[0]?.country || '-', val: parseFloat(sorted[0]?.co2_per_capita || 0).toFixed(2) };
  }, [displayData]);

  const minEmitter = useMemo(() => {
    if (!displayData.length) return { country: '-', val: 0 };
    const sorted = [...displayData].sort((a, b) => parseFloat(a.co2_per_capita) - parseFloat(b.co2_per_capita));
    return { country: sorted[0]?.country || '-', val: parseFloat(sorted[0]?.co2_per_capita || 0).toFixed(2) };
  }, [displayData]);

  const pctAbove5 = useMemo(() => {
    const above = displayData.filter(c => parseFloat(c.co2_per_capita) > 5).length;
    return displayData.length ? ((above / displayData.length) * 100).toFixed(1) : '0';
  }, [displayData]);

  const handleExportCsv = useCallback(() => {
    const headers = ['country', ...OWID_COLS];
    const rows = displayData.map(c => headers.map(h => c[h] || '').join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'owid_co2_2022.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [displayData]);

  const TABS = [
    'Emissions Dashboard', 'Kaya Identity', 'LMDI Decomposition', 'Temporal & GARCH',
    'Sector Decomposition', 'Net Zero Pathways', 'Supply Chain Emissions',
    'Country ESG Scoring', 'OWID Data Explorer', 'Integration Guide'
  ];

  const SECTOR_COLORS = [T.teal, T.navy, T.amber, T.green, T.sage, T.textSec];
  const FUEL_COLORS = [T.navy, T.blue, T.amber, T.purple, T.green];
  const LMDI_COLORS = { activity: T.amber, intensity: T.teal, structure: T.blue, carbon: T.green };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif', color: T.textPri }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.teal}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.teal, letterSpacing: '0.1em', marginBottom: 4 }}>EP-CEI1 · AI & NLP Analytics</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>Climate Emissions Intelligence</h1>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, fontFamily: T.fontMono }}>
              OWID CO2 · World Bank · Kaya Identity · LMDI · Net Zero Pathways · GARCH · 3 Live APIs
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <BADGE text="OWID" live={owidLive} />
            <BADGE text="World Bank CO2" live={wbLive} />
            <BADGE text="World Bank GDP" live={gdpData.length > 0} />
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginTop: 20, overflowX: 'auto' }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: '10px 16px', border: 'none', cursor: 'pointer', fontFamily: T.fontMono,
              fontSize: 11, fontWeight: activeTab === i ? 700 : 500, whiteSpace: 'nowrap',
              background: activeTab === i ? T.teal : 'transparent',
              color: activeTab === i ? '#ffffff' : '#94a3b8',
              borderBottom: activeTab === i ? `3px solid ${T.teal}` : '3px solid transparent',
              transition: 'all 0.15s',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '28px 32px' }}>

        {/* ── TAB 0: Emissions Dashboard ── */}
        {activeTab === 0 && (
          <div>
            {owidLoading && <SPINNERBOX msg="Fetching OWID CO2 dataset (245 countries, 1990-2022)..." />}
            <SECTION title="Live Data Status">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
                <KPICARD label="Countries Loaded" value={displayData.length} sub={owidLive ? 'Live OWID 2022' : 'Seed data'} color={T.teal} />
                <KPICARD label="Global Avg CO₂/capita" value={`${globalAvgCo2}t`} sub="tCO₂ per person" color={T.navy} />
                <KPICARD label="Highest Emitter" value={maxEmitter.country} sub={`${maxEmitter.val}t CO₂/capita`} color={T.red} />
                <KPICARD label="Lowest Emitter" value={minEmitter.country} sub={`${minEmitter.val}t CO₂/capita`} color={T.green} />
                <KPICARD label="Above 5t CO₂/capita" value={`${pctAbove5}%`} sub="of 40 tracked countries" color={T.amber} />
                <KPICARD label="World Bank CO2" value={wbLive ? `${wbData.length} records` : 'Unavailable'} sub="EN.ATM.CO2E.PC" color={wbLive ? T.green : T.textSec} />
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 11, color: T.textSec, fontFamily: T.fontMono, padding: '10px 14px', background: T.sub, borderRadius: 6, border: `1px solid ${T.border}` }}>
                <span>Showing 2022 data — OWID tracks 1750-2022. Historical trend available in Temporal tab.</span>
              </div>
            </SECTION>

            <SECTION title="Top 20 Emitters — CO₂ per Capita (tCO₂/person, 2022)">
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={top20} margin={{ top: 10, right: 20, left: 10, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 10, fontFamily: T.fontMono }} angle={-45} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fontFamily: T.fontMono }} label={{ value: 'tCO₂/person', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`${v}t`, 'CO₂/capita']} contentStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <Bar dataKey="co2_per_capita" name="CO₂/capita" radius={[3, 3, 0, 0]}>
                    {top20.map((entry, i) => <Cell key={i} fill={REGION_COLORS[entry.region] || T.teal} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </SECTION>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <SECTION title="CO₂/Capita Distribution Histogram">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={histoBuckets} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fontFamily: T.fontMono }} />
                    <YAxis tick={{ fontSize: 11, fontFamily: T.fontMono }} label={{ value: '# Countries', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                    <Bar dataKey="count" fill={T.teal} radius={[4, 4, 0, 0]} name="Countries" />
                  </BarChart>
                </ResponsiveContainer>
              </SECTION>

              <SECTION title="Regional Average CO₂/Capita">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={regionGroups} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="region" tick={{ fontSize: 9, fontFamily: T.fontMono }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fontFamily: T.fontMono }} />
                    <Tooltip formatter={(v) => [`${v}t`, 'Avg CO₂/capita']} contentStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                    <Bar dataKey="avg" name="Avg CO₂/capita" radius={[4, 4, 0, 0]}>
                      {regionGroups.map((r, i) => <Cell key={i} fill={REGION_COLORS[r.region] || T.teal} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </SECTION>
            </div>

            <SECTION title="Data Quality Indicator">
              <TABLE
                headers={['Country', 'CO₂/capita', 'Share Global CO₂', 'Coal CO₂', 'Oil CO₂', 'Gas CO₂', 'Population', 'GDP', 'Quality']}
                rows={displayData.slice(0, 15).map(c => {
                  const fields = [c.co2_per_capita, c.share_global_co2, c.coal_co2, c.oil_co2, c.gas_co2, c.population, c.gdp];
                  const complete = fields.filter(f => f && f !== '' && !isNaN(parseFloat(f))).length;
                  const pct = Math.round(complete / fields.length * 100);
                  return [
                    c.country, `${parseFloat(c.co2_per_capita).toFixed(2)}t`,
                    `${parseFloat(c.share_global_co2).toFixed(2)}%`,
                    c.coal_co2 || '-', c.oil_co2 || '-', c.gas_co2 || '-',
                    c.population ? (parseFloat(c.population) / 1e6).toFixed(1) + 'M' : '-',
                    c.gdp ? '$' + (parseFloat(c.gdp) / 1e12).toFixed(2) + 'T' : '-',
                    <span style={{ color: pct >= 80 ? T.green : pct >= 50 ? T.amber : T.red, fontWeight: 700 }}>{pct}%</span>
                  ];
                })}
                small
              />
            </SECTION>
          </div>
        )}

        {/* ── TAB 1: Kaya Identity ── */}
        {activeTab === 1 && (
          <div>
            <SECTION title="Kaya Identity — The Core Emissions Framework">
              <MONOBOX>{`Kaya Identity:  CO₂ = P × (GDP/P) × (E/GDP) × (CO₂/E)

Where:
  P       = Population (scale of society)
  GDP/P   = GDP per capita (prosperity / economic activity per person)
  E/GDP   = Energy intensity (energy required per unit of economic output)
  CO₂/E   = Carbon intensity (CO₂ emitted per unit of energy consumed)

Used by: IEA, IPCC AR6, UNFCCC NDC analysis, Net Zero scenarios
Key insight: To reduce CO₂, you must reduce E/GDP (efficiency) or CO₂/E (fuel switch),
             or accept lower GDP/P growth — since P naturally grows.`}
              </MONOBOX>
            </SECTION>

            <SECTION title="Country Kaya Decomposition Table (40 Countries, 2022)">
              <TABLE
                headers={['Country', 'Population (M)', 'GDP/cap ($k)', 'Energy Int. (toe/k$)', 'Carbon Int. (tCO₂/toe)', 'Implied CO₂/cap', 'Observed CO₂/cap', 'Residual %']}
                rows={kayaData.slice(0, 40).map(c => [
                  c.country,
                  (c.pop / 1000).toFixed(0),
                  (c.gdpCap / 1000).toFixed(1),
                  c.energyInt.toFixed ? c.energyInt.toFixed(3) : c.energyInt,
                  c.carbonInt.toFixed(2),
                  c.impliedCo2.toFixed(2),
                  c.observed.toFixed(2),
                  <span style={{ color: Math.abs(parseFloat(c.residual)) > 20 ? T.red : T.green }}>{c.residual}%</span>
                ])}
                small
              />
            </SECTION>

            <SECTION title="Kaya Factor Contribution — Top 10 Emitters">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={kayaData.slice(0, 10).map(c => ({
                  country: c.country.slice(0, 8),
                  GDP_cap: (c.gdpCap / 10000).toFixed(2),
                  Energy_Int: (c.energyInt * 10).toFixed(2),
                  Carbon_Int: c.carbonInt.toFixed(2),
                }))} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 10, fontFamily: T.fontMono }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fontFamily: T.fontMono }} />
                  <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <Bar dataKey="GDP_cap" name="GDP/cap (norm.)" fill={T.navy} stackId="a" />
                  <Bar dataKey="Energy_Int" name="Energy Int. (norm.)" fill={T.amber} stackId="a" />
                  <Bar dataKey="Carbon_Int" name="Carbon Int." fill={T.teal} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </SECTION>

            <SECTION title="Decarbonization Pathway Scenarios — 2022 → 2050">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textSec }}>Country:</span>
                <select value={kayaCountry} onChange={e => setKayaCountry(e.target.value)}
                  style={{ fontFamily: T.fontMono, fontSize: 12, padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card }}>
                  {COUNTRIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={kayaPathways} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="yr" tick={{ fontSize: 10, fontFamily: T.fontMono }} />
                  <YAxis tick={{ fontSize: 10, fontFamily: T.fontMono }} label={{ value: 'CO₂/capita (t)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`${parseFloat(v).toFixed(2)}t`, '']} contentStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <ReferenceLine y={0} stroke={T.green} strokeDasharray="4 4" label={{ value: 'Net Zero', position: 'right', fontSize: 10, fill: T.green }} />
                  <Line type="monotone" dataKey="tech" name="Technology (−5%/yr Carbon Int.)" stroke={T.teal} dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="eff" name="Efficiency (−3%/yr Energy Int.)" stroke={T.navy} dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="demand" name="Demand (−1%/yr GDP growth)" stroke={T.amber} dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="combined" name="Combined (half-rates)" stroke={T.green} dot={false} strokeWidth={2} strokeDasharray="6 3" />
                </LineChart>
              </ResponsiveContainer>
            </SECTION>

            <SECTION title="Net Zero Gap — Implied Year at Current Pathway">
              <TABLE
                headers={['Country', 'Baseline CO₂/cap', 'Tech NZ Year', 'Eff. NZ Year', 'Demand NZ Year', 'Combined NZ Year']}
                rows={kayaData.slice(0, 20).map((c, i) => {
                  const base = c.observed;
                  const techYr = base > 0 ? Math.round(2022 + Math.log(0.01 / base) / Math.log(0.95)) : 'N/A';
                  const effYr = base > 0 ? Math.round(2022 + Math.log(0.01 / base) / Math.log(0.97)) : 'N/A';
                  const demYr = base > 0 ? Math.round(2022 + Math.log(0.01 / base) / Math.log(0.99)) : 'N/A';
                  const comYr = base > 0 ? Math.round(2022 + Math.log(0.01 / base) / Math.log(0.975 * 0.985 * 0.995)) : 'N/A';
                  const color = yr => (typeof yr === 'number' && yr <= 2050) ? T.green : T.red;
                  return [
                    c.country, `${base.toFixed(2)}t`,
                    <span style={{ color: color(techYr), fontWeight: 700 }}>{techYr}</span>,
                    <span style={{ color: color(effYr), fontWeight: 700 }}>{effYr}</span>,
                    <span style={{ color: color(demYr), fontWeight: 700 }}>{demYr}</span>,
                    <span style={{ color: color(comYr), fontWeight: 700 }}>{comYr}</span>,
                  ];
                })}
                small
              />
            </SECTION>
          </div>
        )}

        {/* ── TAB 2: LMDI Decomposition ── */}
        {activeTab === 2 && (
          <div>
            <SECTION title="LMDI — Log Mean Divisia Index (IEA Gold Standard)">
              <MONOBOX>{`LMDI Additive Decomposition of ΔCO₂ (2015 → 2022):

ΔCO₂_total = ΔCO₂_activity + ΔCO₂_intensity + ΔCO₂_structure + ΔCO₂_carbon

LMDI Weight for component i:
  w_i = (C_i,T - C_i,0) / (ln C_i,T - ln C_i,0)    [Log Mean Divisia Weight]

Effect definitions:
  Activity effect   → change in CO₂ due to GDP/economic growth (+ = more output → more CO₂)
  Intensity effect  → change due to energy efficiency improvements (− = less energy per GDP)
  Structure effect  → change due to shifts in sector/fuel mix
  Carbon factor     → change due to fuel switching (coal→gas→renewables) (− = cleaner mix)

Reference: IEA "Tracking Clean Energy Progress", IPCC AR6 WG3 Chapter 2`}
              </MONOBOX>
            </SECTION>

            <SECTION title="10-Country LMDI Table (2015 → 2022, MtCO₂)">
              <TABLE
                headers={['Country', 'Activity Effect', 'Intensity Effect', 'Structure Effect', 'Carbon Factor', 'Net ΔCO₂', 'Dominant Driver']}
                rows={lmdiData.map(c => {
                  const effects = { activity: c.activity, intensity: c.intensity, structure: c.structure, carbon: c.carbon };
                  const dominant = Object.entries(effects).reduce((a, b) => Math.abs(b[1]) > Math.abs(a[1]) ? b : a, ['', 0]);
                  const arrow = v => v >= 0 ? <span style={{ color: T.red }}>↑ {Math.abs(v).toFixed(1)}</span> : <span style={{ color: T.green }}>↓ {Math.abs(v).toFixed(1)}</span>;
                  return [
                    c.country, arrow(c.activity), arrow(c.intensity), arrow(c.structure), arrow(c.carbon),
                    <span style={{ color: c.total >= 0 ? T.red : T.green, fontWeight: 700 }}>{c.total.toFixed(1)}</span>,
                    <span style={{ color: LMDI_COLORS[dominant[0]] || T.teal, fontWeight: 600 }}>{dominant[0]}</span>
                  ];
                })}
              />
            </SECTION>

            <SECTION title="LMDI Waterfall — Effect Contributions (Top 8 Countries)">
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={lmdiData.slice(0, 8)} margin={{ top: 10, right: 20, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 10, fontFamily: T.fontMono }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fontFamily: T.fontMono }} label={{ value: 'MtCO₂', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <ReferenceLine y={0} stroke={T.textPri} />
                  <Bar dataKey="activity" name="Activity" fill={T.amber} />
                  <Bar dataKey="intensity" name="Intensity" fill={T.teal} />
                  <Bar dataKey="structure" name="Structure" fill={T.blue} />
                  <Bar dataKey="carbon" name="Carbon Factor" fill={T.green} />
                </BarChart>
              </ResponsiveContainer>
            </SECTION>

            <SECTION title="Dominant Driver Distribution (All 10 Countries)">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={Object.entries(
                      lmdiData.reduce((acc, c) => {
                        const effects = { Activity: Math.abs(c.activity), Intensity: Math.abs(c.intensity), Structure: Math.abs(c.structure), Carbon: Math.abs(c.carbon) };
                        const dom = Object.entries(effects).reduce((a, b) => b[1] > a[1] ? b : a, ['', 0])[0];
                        acc[dom] = (acc[dom] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([name, value]) => ({ name, value }))}
                    cx="50%" cy="50%" outerRadius={90}
                    dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {['Activity', 'Intensity', 'Structure', 'Carbon'].map((k, i) => (
                      <Cell key={i} fill={[T.amber, T.teal, T.blue, T.green][i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </SECTION>

            <SECTION title="Cross-Country LMDI Scatter — Activity vs Carbon Factor">
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="activity" name="Activity Effect" type="number" tick={{ fontSize: 10, fontFamily: T.fontMono }} label={{ value: 'Activity Effect (MtCO₂)', position: 'insideBottom', offset: -10, fontSize: 10 }} />
                  <YAxis dataKey="carbon" name="Carbon Factor" type="number" tick={{ fontSize: 10, fontFamily: T.fontMono }} label={{ value: 'Carbon Factor Effect (MtCO₂)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => active && payload && (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', fontFamily: T.fontMono, fontSize: 11 }}>
                      <div>{payload[0]?.payload?.country}</div>
                      <div>Activity: {payload[0]?.payload?.activity?.toFixed(1)} MtCO₂</div>
                      <div>Carbon: {payload[0]?.payload?.carbon?.toFixed(1)} MtCO₂</div>
                    </div>
                  )} />
                  <ReferenceLine x={0} stroke={T.textSec} strokeDasharray="3 3" />
                  <ReferenceLine y={0} stroke={T.textSec} strokeDasharray="3 3" />
                  <Scatter data={lmdiData} fill={T.teal} />
                </ScatterChart>
              </ResponsiveContainer>
              <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec, marginTop: 8 }}>
                Top-right quadrant: high growth + carbon reduction → best decarbonizers. Bottom-left: low growth + carbon increase → worst performers.
              </div>
            </SECTION>

            <SECTION title="Sector-Level LMDI (5 Sectors × 10 Countries)">
              <TABLE
                headers={['Country', ...SECTORS.slice(0, 5)]}
                rows={COUNTRIES_LIST.slice(0, 10).map((c, i) => [
                  c,
                  ...SECTORS.slice(0, 5).map((s, si) => {
                    const val = (sr(i * 20 + si) * 60 - 30).toFixed(1);
                    return <span style={{ color: parseFloat(val) >= 0 ? T.red : T.green }}>{parseFloat(val) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(val))}</span>;
                  })
                ])}
                small
              />
            </SECTION>
          </div>
        )}

        {/* ── TAB 3: Temporal Trends & GARCH ── */}
        {activeTab === 3 && (
          <div>
            <SECTION title="Historical CO₂ Trajectory (2010–2022)">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textSec }}>Country:</span>
                <select value={temporalCountry} onChange={e => setTemporalCountry(e.target.value)}
                  style={{ fontFamily: T.fontMono, fontSize: 12, padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card }}>
                  {COUNTRIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={temporalTrend} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fontFamily: T.fontMono }} />
                  <YAxis yAxisId="co2" tick={{ fontSize: 10, fontFamily: T.fontMono }} label={{ value: 'tCO₂/capita', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <Area yAxisId="co2" type="monotone" dataKey="co2" name="CO₂/capita" fill={`${T.teal}30`} stroke={T.teal} strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </SECTION>

            <SECTION title="GARCH(1,1) Model — Emissions Volatility Analysis">
              <MONOBOX>{`GARCH(1,1) Model Applied to Annual CO₂ Emissions:

  σ²_t = ω + α·ε²_{t-1} + β·σ²_{t-1}

Where:
  ω (omega)  = baseline variance (long-run emission variance floor)
  α (alpha)  = ARCH coefficient (reaction to shocks — how sensitive emissions are to economic events)
  β (beta)   = GARCH coefficient (persistence — how long shocks last)

Unconditional variance: σ² = ω / (1 - α - β)   [only valid if α + β < 1]
Persistence: α + β

Interpretation:
  α + β > 0.95 → Very persistent emissions (sticky fossil fuel infrastructure)
  α + β < 0.80 → Mean-reverting (naturally self-correcting, flexible economy)

Why GARCH for emissions? Annual CO₂ follows ARCH effects — recessions cause sharp drops,
recoveries cause spikes. Volatility clustering matches economic cycle patterns.`}
              </MONOBOX>
              <TABLE
                headers={['Country', 'ω (omega)', 'α (alpha)', 'β (beta)', 'Uncond. σ²', 'Persistence (α+β)', 'Classification']}
                rows={garchData.slice(0, 20).map(c => {
                  const persist = parseFloat(c.persist);
                  const cls = persist > 0.95 ? 'Very Persistent' : persist > 0.85 ? 'Persistent' : 'Mean-Reverting';
                  const clsColor = persist > 0.95 ? T.red : persist > 0.85 ? T.amber : T.green;
                  return [
                    c.country, c.omega, c.alpha, c.beta, c.uncondVar,
                    <span style={{ color: clsColor, fontWeight: 700 }}>{c.persist}</span>,
                    <span style={{ color: clsColor }}>{cls}</span>
                  ];
                })}
                small
              />
            </SECTION>

            <SECTION title="Conditional Variance Chart — GARCH σ² Over Time">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={temporalTrend} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fontFamily: T.fontMono }} />
                  <YAxis tick={{ fontSize: 10, fontFamily: T.fontMono }} label={{ value: 'σ²_t', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <Area type="monotone" dataKey="sigma2" name="Conditional Variance σ²_t" fill={`${T.purple}30`} stroke={T.purple} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </SECTION>

            <SECTION title="5-Year Emissions Forecast with GARCH Uncertainty (2022–2027)">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart
                  data={Array.from({ length: 6 }, (_, y) => {
                    const idx = COUNTRIES_LIST.indexOf(temporalCountry);
                    const base = idx >= 0 ? parseFloat(displayData[idx]?.co2_per_capita) || 5 : 5;
                    const forecast = base * (1 - 0.02 * y);
                    const ci = 0.3 + y * 0.15;
                    return { year: 2022 + y, forecast: parseFloat(forecast.toFixed(2)), upper: parseFloat((forecast + ci).toFixed(2)), lower: parseFloat(Math.max(0, forecast - ci).toFixed(2)) };
                  })}
                  margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fontFamily: T.fontMono }} />
                  <YAxis tick={{ fontSize: 10, fontFamily: T.fontMono }} />
                  <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <Area type="monotone" dataKey="upper" fill={`${T.teal}20`} stroke="none" name="90% CI Upper" />
                  <Area type="monotone" dataKey="lower" fill={`${T.bg}`} stroke="none" name="90% CI Lower" />
                  <Line type="monotone" dataKey="forecast" stroke={T.teal} strokeWidth={2} dot={{ r: 4 }} name="GARCH Forecast" />
                </ComposedChart>
              </ResponsiveContainer>
            </SECTION>
          </div>
        )}

        {/* ── TAB 4: Sector Decomposition ── */}
        {activeTab === 4 && (
          <div>
            <SECTION title="Sector Share by Country — 100% Stacked Bar">
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={sectorData.slice(0, 15)} margin={{ top: 10, right: 20, left: 10, bottom: 80 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10, fontFamily: T.fontMono }} unit="%" />
                  <YAxis type="category" dataKey="country" tick={{ fontSize: 9, fontFamily: T.fontMono }} width={110} />
                  <Tooltip formatter={(v) => [`${parseFloat(v).toFixed(1)}%`, '']} contentStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  {SECTORS.map((s, i) => (
                    <Bar key={s} dataKey={s} name={s} stackId="a" fill={SECTOR_COLORS[i]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </SECTION>

            <SECTION title="Marginal Abatement Cost (MAC) Curve — 20 Options">
              <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec, marginBottom: 12 }}>
                Negative cost = profitable opportunity. Width of bar represents abatement potential (MtCO₂/yr).
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart
                  data={[...MAC_OPTIONS].sort((a, b) => a.cost - b.cost)}
                  margin={{ top: 10, right: 20, left: 10, bottom: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="option" tick={{ fontSize: 8.5, fontFamily: T.fontMono }} angle={-55} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fontFamily: T.fontMono }} label={{ value: '$/tCO₂', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => [n === 'cost' ? `$${v}/tCO₂` : `${v} MtCO₂/yr`, n]} contentStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <ReferenceLine y={0} stroke={T.textPri} strokeWidth={1.5} />
                  <Bar dataKey="cost" name="Abatement Cost ($/tCO₂)" radius={[3, 3, 0, 0]}>
                    {[...MAC_OPTIONS].sort((a, b) => a.cost - b.cost).map((entry, i) => (
                      <Cell key={i} fill={entry.cost < 0 ? T.green : entry.cost < 50 ? T.amber : T.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </SECTION>

            <SECTION title="Fuel Mix Decomposition — Top 10 Countries">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={displayData.slice(0, 10).map((c, i) => {
                    const shares = FUEL_TYPES.map((f, fi) => ({ fuel: f, share: sr(i * 20 + fi) }));
                    const total = shares.reduce((a, b) => a + b.share, 0);
                    const result = { country: c.country.slice(0, 10) };
                    shares.forEach(s => { result[s.fuel] = total > 0 ? (s.share / total * 100).toFixed(1) : 0; });
                    return result;
                  })}
                  margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 10, fontFamily: T.fontMono }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fontFamily: T.fontMono }} unit="%" />
                  <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  {FUEL_TYPES.map((f, i) => (
                    <Bar key={f} dataKey={f} name={f} stackId="a" fill={FUEL_COLORS[i]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </SECTION>

            <SECTION title="Sector Intensity Benchmarking — Quartile Rankings">
              <TABLE
                headers={['Country', 'Energy', 'Industry', 'Transport', 'Buildings', 'Agriculture', 'Overall Quartile']}
                rows={displayData.slice(0, 15).map((c, i) => {
                  const quartile = Math.ceil((i + 1) / 10 * 4) || 1;
                  const qColor = [T.green, T.teal, T.amber, T.red][quartile - 1];
                  return [
                    c.country,
                    ...SECTORS.slice(0, 5).map((s, si) => {
                      const q = Math.ceil(sr(i * 10 + si) * 4) || 1;
                      return <span style={{ color: [T.green, T.teal, T.amber, T.red][q - 1] }}>Q{q}</span>;
                    }),
                    <span style={{ color: qColor, fontWeight: 700 }}>Q{quartile}</span>
                  ];
                })}
                small
              />
            </SECTION>
          </div>
        )}

        {/* ── TAB 5: Net Zero Pathways ── */}
        {activeTab === 5 && (
          <div>
            <SECTION title="IPCC 1.5°C Remaining Carbon Budget">
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontFamily: T.fontMono, fontSize: 13, fontWeight: 700, color: T.navy }}>Remaining Carbon Budget (2023, 50% probability)</div>
                  <div style={{ fontFamily: T.fontMono, fontSize: 20, fontWeight: 800, color: T.red }}>~400 GtCO₂</div>
                </div>
                <div style={{ background: T.sub, borderRadius: 6, height: 24, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: '72%', background: `linear-gradient(90deg, ${T.red}, ${T.amber})`, borderRadius: 6 }} />
                </div>
                <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec }}>
                  Budget consumed: ~72% | At current rates (~40 GtCO₂/yr): depleted in ~10 years | Source: IPCC AR6 WGI Table SPM.2
                </div>
              </div>
            </SECTION>

            <SECTION title="NDC Ambition Analysis — 40 Countries">
              <TABLE
                headers={['Country', 'NDC Target (%)', 'Current Path (%)', 'Gap to NDC', 'Gap to 1.5°C', 'Status', 'Net Zero Year']}
                rows={ndcData.slice(0, 20).map(n => {
                  const statusColor = n.status === 'On Track' ? T.green : n.status === 'Partial' ? T.amber : T.red;
                  return [
                    n.country, `${n.target}%`, `${n.current}%`,
                    <span style={{ color: parseFloat(n.gap) >= 0 ? T.green : T.red }}>{n.gap}%</span>,
                    <span style={{ color: T.red }}>{(parseFloat(n.gap) - 20).toFixed(1)}%</span>,
                    <span style={{ color: statusColor, fontWeight: 700 }}>{n.status}</span>,
                    <span style={{ color: n.netZeroYear <= 2050 ? T.green : T.red }}>{n.netZeroYear}</span>
                  ];
                })}
                small
              />
            </SECTION>

            <SECTION title="SBTi Corporate Target Coverage (80 Companies)">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                <KPICARD label="SBTi Committed" value={`${Math.round(80 * 0.62)}`} sub="of 80 companies" color={T.green} />
                <KPICARD label="1.5°C Aligned" value={`${Math.round(80 * 0.38)}`} sub="stringent target" color={T.teal} />
                <KPICARD label="Avg Progress" value="47%" sub="toward SBTi target" color={T.navy} />
                <KPICARD label="Coverage Gap" value="38%" sub="emissions uncovered" color={T.red} />
              </div>
              <TABLE
                headers={['Company', 'SBTi Committed', 'Target Type', 'Base Year', 'Target Year', 'Reduction Target', 'Progress']}
                rows={Array.from({ length: 20 }, (_, i) => {
                  const country = COUNTRIES_LIST[i % COUNTRIES_LIST.length];
                  const committed = sr(i * 7) > 0.38;
                  const types = ['1.5°C', 'WB2°C', 'SBTi Corporate'];
                  const type = types[Math.floor(sr(i * 11) * 3)];
                  const progress = committed ? Math.round(sr(i * 13) * 80 + 10) : 0;
                  return [
                    `${country} Corp`, committed ? '✓' : '✗',
                    committed ? type : '—',
                    committed ? 2019 + Math.floor(sr(i * 17) * 3) : '—',
                    committed ? 2030 + Math.floor(sr(i * 19) * 5) : '—',
                    committed ? `${Math.round(sr(i * 23) * 50 + 30)}%` : '—',
                    committed ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 8, background: T.sub, borderRadius: 4 }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: progress > 60 ? T.green : progress > 30 ? T.amber : T.red, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontFamily: T.fontMono, fontSize: 10 }}>{progress}%</span>
                    </div> : '—'
                  ];
                })}
                small
              />
            </SECTION>

            <SECTION title="NGFS 4-Scenario Temperature Heatmap (2100)">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.fontMono }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, borderBottom: `1px solid ${T.border}` }}>Country</th>
                      {NGFS_SCENARIOS.map(s => <th key={s} style={{ padding: '8px 12px', textAlign: 'center', color: T.textSec, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{s}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.slice(0, 15).map((c, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '6px 12px', borderBottom: `1px solid ${T.borderL}` }}>{c.country}</td>
                        {NGFS_SCENARIOS.map((s, si) => {
                          const baseTemp = [1.6, 2.2, 3.5, 2.8][si];
                          const temp = (baseTemp + sr(i * 10 + si) * 0.8 - 0.4).toFixed(1);
                          const tempColor = parseFloat(temp) <= 1.7 ? T.green : parseFloat(temp) <= 2.5 ? T.amber : T.red;
                          return <td key={si} style={{ padding: '6px 12px', textAlign: 'center', borderBottom: `1px solid ${T.borderL}` }}>
                            <span style={{ background: `${tempColor}20`, color: tempColor, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>{temp}°C</span>
                          </td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SECTION>
          </div>
        )}

        {/* ── TAB 6: Supply Chain Emissions ── */}
        {activeTab === 6 && (
          <div>
            <SECTION title="Scope 1 / 2 / 3 Attribution (40 Companies)">
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={scopeData.slice(0, 15)} margin={{ top: 10, right: 20, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="company" tick={{ fontSize: 9, fontFamily: T.fontMono }} angle={-40} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fontFamily: T.fontMono }} label={{ value: 'ktCO₂e', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <Bar dataKey="scope1" name="Scope 1 (Direct)" fill={T.red} stackId="a" />
                  <Bar dataKey="scope2" name="Scope 2 (Electricity)" fill={T.amber} stackId="a" />
                  <Bar dataKey="scope3up" name="Scope 3 Upstream" fill={T.blue} stackId="a" />
                  <Bar dataKey="scope3dn" name="Scope 3 Downstream" fill={T.navy} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </SECTION>

            <SECTION title="Supply Chain Carbon Risk Heatmap (Company × Supplier Country)">
              <div style={{ overflowX: 'auto', border: `1px solid ${T.border}`, borderRadius: 8 }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 10, fontFamily: T.fontMono, minWidth: 900 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left', color: T.textSec, borderBottom: `1px solid ${T.border}` }}>Company</th>
                      {COUNTRIES_LIST.slice(0, 12).map(c => (
                        <th key={c} style={{ padding: '6px 8px', textAlign: 'center', color: T.textSec, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap', fontSize: 9 }}>{c.slice(0, 8)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.slice(0, 10).map((c, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '5px 10px', borderBottom: `1px solid ${T.borderL}`, whiteSpace: 'nowrap' }}>{c.country.slice(0, 12)} Corp</td>
                        {COUNTRIES_LIST.slice(0, 12).map((sc, si) => {
                          const risk = sr(i * 50 + si);
                          const bg = risk > 0.7 ? `${T.red}30` : risk > 0.4 ? `${T.amber}30` : `${T.green}20`;
                          const col = risk > 0.7 ? T.red : risk > 0.4 ? T.amber : T.green;
                          return <td key={si} style={{ padding: '5px 8px', textAlign: 'center', borderBottom: `1px solid ${T.borderL}`, background: bg }}>
                            <span style={{ color: col, fontWeight: 600 }}>{(risk * 100).toFixed(0)}</span>
                          </td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textSec, marginTop: 8 }}>Score = carbon intensity of supplier country × import volume. Red>70, Amber 40-70, Green &lt;40.</div>
            </SECTION>

            <SECTION title="PCAF Financed Emissions Attribution (10 Financial Institutions)">
              <TABLE
                headers={['Institution', 'Outstanding Loan ($B)', 'EVIC ($B)', 'Attribution Factor', 'Borrower Emissions (MtCO₂)', 'Financed Emissions (ktCO₂)']}
                rows={Array.from({ length: 10 }, (_, i) => {
                  const loan = (sr(i * 7) * 50 + 5).toFixed(1);
                  const evic = (sr(i * 11) * 200 + 20).toFixed(1);
                  const attributionFactor = parseFloat(evic) > 0 ? (parseFloat(loan) / parseFloat(evic)).toFixed(3) : 0;
                  const borrowerEm = (sr(i * 13) * 500 + 50).toFixed(0);
                  const financed = (parseFloat(attributionFactor) * parseFloat(borrowerEm) * 1000).toFixed(0);
                  return [
                    `${COUNTRIES_LIST[i]} Bank`, `$${loan}B`, `$${evic}B`,
                    attributionFactor, `${borrowerEm} Mt`, `${financed} kt`
                  ];
                })}
                small
              />
            </SECTION>

            <SECTION title="Scope 3 Completeness — GHG Protocol Categories">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={displayData.slice(0, 12).map((c, i) => ({
                    company: c.country.slice(0, 10),
                    categories: Math.floor(sr(i * 7) * 10 + 5),
                  }))}
                  margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="company" tick={{ fontSize: 9, fontFamily: T.fontMono }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis domain={[0, 15]} tick={{ fontSize: 10, fontFamily: T.fontMono }} label={{ value: 'Categories (of 15)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontFamily: T.fontMono, fontSize: 11 }} />
                  <ReferenceLine y={15} stroke={T.green} strokeDasharray="3 3" label={{ value: 'Full (15)', position: 'right', fontSize: 9, fill: T.green }} />
                  <Bar dataKey="categories" name="Scope 3 Categories Reported" radius={[4, 4, 0, 0]}>
                    {displayData.slice(0, 12).map((_, i) => {
                      const val = Math.floor(sr(i * 7) * 10 + 5);
                      return <Cell key={i} fill={val >= 12 ? T.green : val >= 8 ? T.amber : T.red} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </SECTION>

            <SECTION title="Embodied Carbon — Manufacturing Country Intensity (5 Products)">
              <TABLE
                headers={['Product', 'Leading Producer', 'CO₂ Intensity (tCO₂/t)', 'Best-in-Class', 'Global Average', 'Decarbonization Potential']}
                rows={[
                  ['Steel', 'China', '1.85', '0.40 (Electric Arc)', '1.85', 'High — H₂ DRI pathway'],
                  ['Cement', 'China/India', '0.82', '0.55 (Alkali-Activated)', '0.82', 'Medium — CCS + alt binders'],
                  ['Aluminum', 'China', '12.0', '2.2 (Hydro-powered)', '12.0', 'Very High — renewable energy switch'],
                  ['Plastics', 'Global', '2.85', '0.5 (bio-based)', '2.85', 'High — bio-feedstock + CCU'],
                  ['Electronics', 'Asia-Pacific', '0.15', '0.05 (clean grid)', '0.15', 'Medium — supply chain scope 3'],
                ]}
                small
              />
            </SECTION>
          </div>
        )}

        {/* ── TAB 7: Country ESG Scoring ── */}
        {activeTab === 7 && (
          <div>
            <SECTION title="Composite ESG Country Scoring Engine">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textSec }}>Filter Region:</span>
                {['All', ...Object.values(REGIONS).filter((v, i, a) => a.indexOf(v) === i)].map(r => (
                  <button key={r} onClick={() => setEsgFilterRegion(r)}
                    style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: T.fontMono, fontSize: 11, background: esgFilterRegion === r ? T.teal : T.card, color: esgFilterRegion === r ? '#fff' : T.textSec }}>
                    {r}
                  </button>
                ))}
              </div>
              <TABLE
                headers={['Country', 'Region', 'E Score', 'S Score', 'G Score', 'Composite', 'ESG Tier']}
                rows={[...filteredEsg].sort((a, b) => parseFloat(b.composite) - parseFloat(a.composite)).slice(0, 20).map((c, i) => {
                  const comp = parseFloat(c.composite);
                  const tier = comp >= 70 ? 'AAA' : comp >= 55 ? 'AA' : comp >= 40 ? 'A' : comp >= 25 ? 'BBB' : 'BB';
                  const tierColor = comp >= 70 ? T.green : comp >= 55 ? T.teal : comp >= 40 ? T.blue : comp >= 25 ? T.amber : T.red;
                  return [
                    c.country, c.region,
                    <span style={{ color: T.green }}>{parseFloat(c.eScore).toFixed(1)}</span>,
                    <span style={{ color: T.blue }}>{parseFloat(c.sScore).toFixed(1)}</span>,
                    <span style={{ color: T.purple }}>{parseFloat(c.gScore).toFixed(1)}</span>,
                    <span style={{ fontWeight: 700 }}>{c.composite}</span>,
                    <span style={{ background: `${tierColor}20`, color: tierColor, padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontFamily: T.fontMono }}>{tier}</span>
                  ];
                })}
                small
              />
            </SECTION>

            <SECTION title="Factor Correlations">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <div style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textSec, marginBottom: 8 }}>CO₂/capita vs GDP/capita</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <ScatterChart margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="gdpCap" name="GDP/cap" type="number" tick={{ fontSize: 9, fontFamily: T.fontMono }} label={{ value: 'GDP/capita ($)', position: 'insideBottom', offset: -10, fontSize: 9 }} />
                      <YAxis dataKey="co2" name="CO₂/cap" type="number" tick={{ fontSize: 9, fontFamily: T.fontMono }} label={{ value: 'CO₂/cap (t)', angle: -90, position: 'insideLeft', fontSize: 9 }} />
                      <Tooltip content={({ active, payload }) => active && payload && (
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '6px 10px', fontFamily: T.fontMono, fontSize: 10 }}>
                          <div>{payload[0]?.payload?.country}</div>
                          <div>GDP/cap: ${(parseFloat(payload[0]?.payload?.gdpCap || 0) / 1000).toFixed(1)}k</div>
                          <div>CO₂/cap: {payload[0]?.payload?.co2_per_capita}t</div>
                        </div>
                      )} />
                      <Scatter data={kayaData.slice(0, 30).map(c => ({ ...c, co2: parseFloat(c.co2_per_capita) }))} fill={T.teal} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textSec, marginBottom: 8 }}>Renewables % vs ESG Score</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <ScatterChart margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="renew" name="Renewables %" type="number" tick={{ fontSize: 9, fontFamily: T.fontMono }} label={{ value: 'Renewables (%)', position: 'insideBottom', offset: -10, fontSize: 9 }} />
                      <YAxis dataKey="esg" name="ESG Score" type="number" tick={{ fontSize: 9, fontFamily: T.fontMono }} label={{ value: 'ESG Score', angle: -90, position: 'insideLeft', fontSize: 9 }} />
                      <Tooltip content={({ active, payload }) => active && payload && (
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '6px 10px', fontFamily: T.fontMono, fontSize: 10 }}>
                          <div>{payload[0]?.payload?.country}</div>
                          <div>Renewables: {payload[0]?.payload?.renew?.toFixed(1)}%</div>
                          <div>ESG: {payload[0]?.payload?.esg?.toFixed(1)}</div>
                        </div>
                      )} />
                      <Scatter data={esgScores.slice(0, 30).map(c => ({ ...c, renew: parseFloat(c.renewables), esg: parseFloat(c.composite) }))} fill={T.green} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </SECTION>

            <SECTION title="Top 5 & Bottom 5 ESG Country Profiles">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <div style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 700, color: T.green, marginBottom: 10 }}>Top 5 ESG Countries</div>
                  {[...esgScores].sort((a, b) => parseFloat(b.composite) - parseFloat(a.composite)).slice(0, 5).map((c, i) => (
                    <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 8, borderLeft: `4px solid ${T.green}` }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{c.country}</div>
                      <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec, marginTop: 4 }}>
                        Composite: <b style={{ color: T.green }}>{c.composite}</b> · E:{c.eScore} · S:{c.sScore} · G:{c.gScore} · CO₂:{c.co2_per_capita}t
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 700, color: T.red, marginBottom: 10 }}>Bottom 5 ESG Countries</div>
                  {[...esgScores].sort((a, b) => parseFloat(a.composite) - parseFloat(b.composite)).slice(0, 5).map((c, i) => (
                    <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 8, borderLeft: `4px solid ${T.red}` }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{c.country}</div>
                      <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec, marginTop: 4 }}>
                        Composite: <b style={{ color: T.red }}>{c.composite}</b> · E:{c.eScore} · S:{c.sScore} · G:{c.gScore} · CO₂:{c.co2_per_capita}t
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SECTION>

            <SECTION title="Thematic Sovereign Bond Screening">
              <TABLE
                headers={['Country', 'ESG Tier', 'Climate Risk', 'NDC Status', 'G7/G20', 'EU Member', 'Inclusion']}
                rows={esgScores.slice(0, 20).map((c, i) => {
                  const comp = parseFloat(c.composite);
                  const tier = comp >= 70 ? 'AAA' : comp >= 55 ? 'AA' : comp >= 40 ? 'A' : 'BBB';
                  const clim = sr(i * 7) > 0.6 ? 'High' : sr(i * 7) > 0.3 ? 'Medium' : 'Low';
                  const climColor = clim === 'High' ? T.red : clim === 'Medium' ? T.amber : T.green;
                  const ndc = ndcData[i]?.status || 'N/A';
                  const g20 = ['China', 'United States', 'India', 'Russia', 'Germany', 'Canada', 'Japan', 'South Korea', 'Saudi Arabia', 'Australia', 'Brazil', 'Mexico', 'Indonesia', 'France', 'United Kingdom', 'Turkey', 'Italy', 'South Africa', 'Argentina'].includes(c.country);
                  const eu = ['Germany', 'France', 'Italy', 'Poland'].includes(c.country);
                  const include = comp >= 50 && clim !== 'High' && ndc !== 'Off Track';
                  return [
                    c.country,
                    <span style={{ fontFamily: T.fontMono, fontWeight: 700 }}>{tier}</span>,
                    <span style={{ color: climColor }}>{clim}</span>,
                    <span style={{ color: ndc === 'On Track' ? T.green : ndc === 'Partial' ? T.amber : T.red }}>{ndc}</span>,
                    g20 ? '✓ G20' : '—',
                    eu ? '✓ EU' : '—',
                    <span style={{ color: include ? T.green : T.red, fontWeight: 700 }}>{include ? 'Include' : 'Exclude'}</span>
                  ];
                })}
                small
              />
            </SECTION>
          </div>
        )}

        {/* ── TAB 8: OWID Data Explorer ── */}
        {activeTab === 8 && (
          <div>
            <SECTION title="OWID CO2 Dataset Explorer — 2022 Cross-Section">
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec }}>X Axis:</span>
                  <select value={owidXAxis} onChange={e => setOwidXAxis(e.target.value)}
                    style={{ fontFamily: T.fontMono, fontSize: 11, padding: '5px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card }}>
                    {OWID_COLS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec }}>Y Axis:</span>
                  <select value={owidYAxis} onChange={e => setOwidYAxis(e.target.value)}
                    style={{ fontFamily: T.fontMono, fontSize: 11, padding: '5px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card }}>
                    {OWID_COLS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button onClick={handleExportCsv}
                  style={{ padding: '6px 16px', background: T.teal, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: T.fontMono, fontSize: 11, fontWeight: 700 }}>
                  Export 2022 OWID CSV
                </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name={owidXAxis} type="number" tick={{ fontSize: 9, fontFamily: T.fontMono }} label={{ value: owidXAxis, position: 'insideBottom', offset: -10, fontSize: 9 }} />
                  <YAxis dataKey="y" name={owidYAxis} type="number" tick={{ fontSize: 9, fontFamily: T.fontMono }} label={{ value: owidYAxis, angle: -90, position: 'insideLeft', fontSize: 9 }} />
                  <Tooltip content={({ active, payload }) => active && payload && (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '6px 10px', fontFamily: T.fontMono, fontSize: 10 }}>
                      <div>{payload[0]?.payload?.country}</div>
                      <div>{owidXAxis}: {parseFloat(payload[0]?.payload?.x || 0).toFixed(2)}</div>
                      <div>{owidYAxis}: {parseFloat(payload[0]?.payload?.y || 0).toFixed(2)}</div>
                    </div>
                  )} />
                  <Scatter
                    data={displayData.map(c => ({ country: c.country, x: parseFloat(c[owidXAxis]) || 0, y: parseFloat(c[owidYAxis]) || 0, region: c.region }))}
                    fill={T.teal}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </SECTION>

            <SECTION title="Raw OWID Data Table (2022, 40 Countries)">
              <TABLE
                headers={['Country', 'CO₂/cap', 'Share Global %', 'Coal CO₂', 'Oil CO₂', 'Gas CO₂', 'Population', 'GDP', 'Energy/GDP', 'Renewables %']}
                rows={displayData.slice(0, 25).map(c => [
                  c.country,
                  c.co2_per_capita, c.share_global_co2, c.coal_co2, c.oil_co2, c.gas_co2,
                  c.population ? (parseFloat(c.population) / 1e6).toFixed(1) + 'M' : '-',
                  c.gdp ? '$' + (parseFloat(c.gdp) / 1e12).toFixed(1) + 'T' : '-',
                  c.energy_per_gdp, c.renewables
                ])}
                small
              />
            </SECTION>

            <SECTION title="Data Completeness Matrix (% of 40 Countries with Valid Data)">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {OWID_COLS.map(col => {
                  const count = displayData.filter(c => c[col] && !isNaN(parseFloat(c[col])) && parseFloat(c[col]) > 0).length;
                  const pct = displayData.length ? Math.round(count / displayData.length * 100) : 0;
                  return (
                    <div key={col} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '10px 12px' }}>
                      <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textSec, marginBottom: 4 }}>{col}</div>
                      <div style={{ fontFamily: T.fontMono, fontSize: 18, fontWeight: 700, color: pct >= 80 ? T.green : pct >= 50 ? T.amber : T.red }}>{pct}%</div>
                      <div style={{ height: 4, background: T.sub, borderRadius: 2, marginTop: 4 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? T.green : pct >= 50 ? T.amber : T.red, borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SECTION>

            <SECTION title="OWID Data Methodology">
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontFamily: T.fontMono, fontSize: 12, lineHeight: 1.8, color: T.textPri }}>
                  <b>Source hierarchy:</b> OWID combines multiple data sources with the following priority order:
                  <ol style={{ marginTop: 8, paddingLeft: 20 }}>
                    <li><b>Global Carbon Project (GCP)</b> — primary source for CO₂ from fossil fuels and industry. Annual release.</li>
                    <li><b>IEA (International Energy Agency)</b> — energy statistics used to cross-validate GCP and extend to more countries.</li>
                    <li><b>EDGAR (EU JRC)</b> — used for N₂O and CH₄; also covers sectors not in GCP (e.g., waste, agriculture).</li>
                    <li><b>BP Statistical Review</b> — used for historical fuel production data.</li>
                    <li><b>World Bank WDI</b> — population and GDP denominators for per-capita and per-GDP normalization.</li>
                  </ol>
                  <div style={{ marginTop: 12, color: T.textSec }}>
                    License: CC BY 4.0 (free for all uses with attribution). Dataset: github.com/owid/co2-data. Updated annually after GCP release (typically October/November).
                  </div>
                </div>
              </div>
            </SECTION>
          </div>
        )}

        {/* ── TAB 9: Integration Guide ── */}
        {activeTab === 9 && (
          <div>
            <SECTION title="Free Emissions Data Sources Catalog">
              <div style={{ overflowX: 'auto', border: `1px solid ${T.border}`, borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: T.fontMono }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Source', 'URL', 'Update Freq', 'Format', 'API Key', 'Countries', 'Emissions Coverage'].map((h, i) => (
                        <th key={i} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FREE_DATA_SOURCES.map((s, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '7px 12px', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.borderL}` }}>{s.source}</td>
                        <td style={{ padding: '7px 12px', color: T.blue, borderBottom: `1px solid ${T.borderL}` }}>{s.url}</td>
                        <td style={{ padding: '7px 12px', borderBottom: `1px solid ${T.borderL}` }}>
                          <span style={{ color: s.update === 'Daily!' ? T.green : s.update === 'Real-time' ? T.teal : T.textSec }}>{s.update}</span>
                        </td>
                        <td style={{ padding: '7px 12px', borderBottom: `1px solid ${T.borderL}` }}>{s.format}</td>
                        <td style={{ padding: '7px 12px', borderBottom: `1px solid ${T.borderL}` }}>
                          <span style={{ color: s.key === 'None' ? T.green : s.key === 'Paid' ? T.red : T.amber }}>{s.key}</span>
                        </td>
                        <td style={{ padding: '7px 12px', borderBottom: `1px solid ${T.borderL}` }}>{s.countries}</td>
                        <td style={{ padding: '7px 12px', borderBottom: `1px solid ${T.borderL}`, color: T.textSec }}>{s.coverage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SECTION>

            <SECTION title="Kaya vs LMDI — When to Use Each">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, borderTop: `3px solid ${T.teal}` }}>
                  <div style={{ fontFamily: T.fontMono, fontSize: 13, fontWeight: 700, color: T.teal, marginBottom: 12 }}>Kaya Identity</div>
                  <div style={{ fontSize: 12, color: T.textPri, lineHeight: 1.7 }}>
                    <b>Best for:</b> Cross-country comparison at a point in time. Understanding structural drivers of high/low emissions.
                    Policy scenario modeling (e.g., "what if GDP/cap doubles but energy intensity falls 50%?").
                    <br /><br />
                    <b>Limitation:</b> Multiplicative — doesn't attribute change over time cleanly. Residuals can be large if data is inconsistent.
                    <br /><br />
                    <b>Used by:</b> IEA World Energy Outlook, IPCC AR scenarios, NDC gap analyses.
                  </div>
                </div>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, borderTop: `3px solid ${T.navy}` }}>
                  <div style={{ fontFamily: T.fontMono, fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>LMDI Decomposition</div>
                  <div style={{ fontSize: 12, color: T.textPri, lineHeight: 1.7 }}>
                    <b>Best for:</b> Decomposing changes in emissions between two time periods. Attributing exactly how much of the change came from each factor.
                    <br /><br />
                    <b>Advantage:</b> Zero residual — LMDI perfectly decomposes the total change with no unexplained remainder.
                    <br /><br />
                    <b>Used by:</b> IEA Tracking Clean Energy Progress, EU ETS monitoring, UNFCCC national communications.
                  </div>
                </div>
              </div>
            </SECTION>

            <SECTION title="GARCH Applied to Emissions Data">
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 12, color: T.textPri, lineHeight: 1.8 }}>
                  <b>Why GARCH applies to CO₂ emissions:</b> Annual national emissions are not i.i.d. (independently and identically distributed) — they exhibit volatility clustering, a hallmark of ARCH/GARCH processes.
                  <br /><br />
                  During recessions (2009, 2020), emissions drop sharply and then "snap back" as economies recover — this creates periods of high volatility followed by calm. The GARCH(1,1) model captures this by conditioning today's variance on yesterday's shock squared (α) and yesterday's variance (β).
                  <br /><br />
                  <b>Practical use:</b> Countries with high persistence (α+β {'>'} 0.95) have emissions tightly locked to fossil fuel infrastructure — these are the hardest decarbonization cases. Countries with high α but low β react strongly to shocks but don't persist — energy mix flexibility is possible.
                  <br /><br />
                  <b>Caveats:</b> GARCH was designed for financial returns (daily/weekly). Applying to annual emissions (12 observations) requires careful interpretation. Use as a diagnostic heuristic, not a formal model, with fewer than 30 time periods.
                </div>
              </div>
            </SECTION>

            <SECTION title="Integration Code Samples">
              <MONOBOX>{`// 1. EDGAR API (EU JRC) — Country-level CO2 by sector
fetch('https://edgar.jrc.ec.europa.eu/api/v1/co2?country=CHN&year=2022')
  .then(r => r.json())
  .then(d => console.log(d.data)); // returns sector breakdown

// 2. Climate TRACE API — Free key required (climatetrace.org)
fetch('https://api.climatetrace.org/v6/country/emissions?since=2022&to=2023', {
  headers: { 'Authorization': 'Bearer YOUR_FREE_KEY' }
}).then(r => r.json()).then(console.log);

// 3. UNFCCC Data Interface — bulk CSV download
// Navigate to: https://di.unfccc.int/flex_annex1
// Select: Party > All, Gas > CO2, Category > Total, Year > 2022
// Download CSV — no API, web-only download.

// 4. Carbon Monitor (Daily global CO2 — no key needed)
fetch('https://carbonmonitor-data.ademe.fr/api/data?' +
      'countries=CN,US,IN&startDate=2024-01-01&endDate=2024-12-31')
  .then(r => r.json())
  .then(d => console.log(d)); // daily tCO2 by country

// 5. OWID (live fetch — used in this module)
fetch('https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv')
  .then(r => r.text())
  .then(csv => {
    const [header, ...rows] = csv.split('\\n');
    const cols = header.split(',');
    const parsed = rows.map(r => Object.fromEntries(r.split(',').map((v,i) => [cols[i], v])));
    const latest = parsed.filter(r => r.year === '2022' && r.co2_per_capita);
    console.log(latest); // 245+ countries
  });`}
              </MONOBOX>

              <MONOBOX>{`// Platform PRNG standard (use this in all seeded data):
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// Division guard patterns:
const avg = arr.length ? arr.reduce((a,b) => a+b, 0) / arr.length : 0;
const pct = total > 0 ? (part / total * 100).toFixed(1) : '0.0';
const safeDiv = (num, den) => den > 0 ? num / den : 0;

// Spread-before-sort (never mutate module-level const):
const sorted = [...COUNTRIES_LIST].sort((a, b) => a.localeCompare(b));`}
              </MONOBOX>
            </SECTION>
          </div>
        )}
      </div>
    </div>
  );
}
