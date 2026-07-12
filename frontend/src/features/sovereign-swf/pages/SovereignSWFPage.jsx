import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, Legend, PieChart, Pie, ScatterChart, Scatter,
  AreaChart, Area, LineChart, Line,
} from 'recharts';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f4f6f9',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SWF_NAMES = [
  'Government Pension Fund Global','Abu Dhabi Investment Authority','China Investment Corporation',
  'Kuwait Investment Authority','Hong Kong Monetary Authority Investment Portfolio',
  'GIC Private Limited','Temasek Holdings','Public Investment Fund',
  'Qatar Investment Authority','National Wealth Fund of Russia',
  'Investment Corporation of Dubai','Abu Dhabi Investment Council',
  'Mubadala Investment Company','Korea Investment Corporation',
  'Alaska Permanent Fund','Future Fund Australia','New Zealand Superannuation Fund',
  'Ireland Strategic Investment Fund','Samruk-Kazyna','National Fund of Kazakhstan',
  'Khazanah Nasional','Brunei Investment Agency','Revenue Equalization Reserve Fund',
  'Permanent Fund of Kiribati','Timor-Leste Petroleum Fund',
  'Fundo Soberano de Angola','Nigeria Sovereign Investment Authority',
  'Ghana Heritage Fund','Senegal Fund for Future Generations',
  'Libya Investment Authority','Pula Fund Botswana',
  'Texas Permanent School Fund','Texas Permanent University Fund',
  'Wyoming Permanent Mineral Trust Fund','Alabama Trust Fund',
  'North Dakota Legacy Fund','New Mexico State Investment Council',
  'Montana Coal Tax Trust Fund','Permanent Wyoming Mineral Trust',
  'Heritage Fund Alberta','Fonds de reserve pour les retraites France',
  'AP7 Sweden','Ilmarinen Finland','Norwegian Government Pension Fund',
  'Danish Social Pension Fund','Austrian Pension Reserve Fund',
  'Belgian Federal Holding','Swiss National Pension Reserve',
  'Portuguese Social Security Financial Stabilisation Fund',
  'Italian Strategic Fund','Spanish Social Security Reserve Fund',
  'Fondo de Reserva de Pensiones Chile','Fondo de Ahorro de Panama',
  'Fondo de Estabilizacion Macroeconomica Venezuela',
  'Fondo de Ahorro y Estabilizacion Colombia','Trinidad and Tobago Heritage Fund',
  'Alberta Heritage Savings Trust Fund','Sustainable Capital Fund Singapore',
  'Meraas Capital UAE','Bahrain Mumtalakat Holding',
  'Oman Investment Fund','Indonesia Investment Authority',
  'Viet Nam State Capital Investment Corporation','Philippine Social Security System',
  'Bangladesh Investment Development Authority','Sri Lanka National Wealth Fund',
  'Pakistan Sovereign Wealth Initiative','Nepal Prosperity Fund',
  'Mongolia Fiscal Stabilisation Fund','Azerbaijan SOFAZ',
  'Turkmenistan Stabilization Fund','Uzbekistan Reconstruction Fund',
  'Rwanda Green Development Fund','Ethiopia Sovereign Wealth Fund',
  'Kenya National Social Security Wealth Fund',
];

const SWF_COUNTRIES = [
  'Norway','UAE','China','Kuwait','Hong Kong','Singapore','Singapore','Saudi Arabia',
  'Qatar','Russia','UAE','UAE','UAE','South Korea','United States','Australia',
  'New Zealand','Ireland','Kazakhstan','Kazakhstan','Malaysia','Brunei','Kiribati',
  'Kiribati','Timor-Leste','Angola','Nigeria','Ghana','Senegal','Libya',
  'Botswana','United States','United States','United States','United States',
  'United States','United States','United States','United States','Canada',
  'France','Sweden','Finland','Norway','Denmark','Austria','Belgium','Switzerland',
  'Portugal','Italy','Spain','Chile','Panama','Venezuela','Colombia',
  'Trinidad & Tobago','Canada','Singapore','UAE','Bahrain','Oman','Indonesia',
  'Vietnam','Philippines','Bangladesh','Sri Lanka','Pakistan','Nepal',
  'Mongolia','Azerbaijan','Turkmenistan','Uzbekistan','Rwanda','Ethiopia','Kenya',
];

const REGIONS = ['GCC','East Asia','Europe','Americas','Africa','South Asia','Other'];
const FUND_TYPES = ['Stabilization','Savings','Development','Reserve Investment','Pension Reserve','Strategic'];

const getRegion = i => {
  if (i === 0) return 'Europe';
  if (i === 1 || i === 7 || i === 10 || i === 11 || i === 12) return 'GCC';
  if (i === 2 || i === 4 || i === 5 || i === 6 || i === 13) return 'East Asia';
  if (i === 3 || i === 8) return 'GCC';
  if (i === 9) return 'Other';
  const r = sr(i * 7 + 3);
  if (r < 0.18) return 'GCC';
  if (r < 0.35) return 'East Asia';
  if (r < 0.55) return 'Europe';
  if (r < 0.68) return 'Americas';
  if (r < 0.80) return 'Africa';
  if (r < 0.90) return 'South Asia';
  return 'Other';
};

const getFundType = i => {
  const v = sr(i * 11 + 5);
  if (v < 0.18) return 'Stabilization';
  if (v < 0.36) return 'Savings';
  if (v < 0.52) return 'Development';
  if (v < 0.68) return 'Reserve Investment';
  if (v < 0.84) return 'Pension Reserve';
  return 'Strategic';
};

const SWFS = Array.from({ length: 75 }, (_, i) => {
  const aum = i === 0 ? 1380 : i === 1 ? 993 : i === 2 ? 1240 : i === 3 ? 750 : i === 4 ? 580 :
    i < 10 ? Math.round(100 + sr(i * 13 + 2) * 500) :
    Math.round(10 + sr(i * 17 + 3) * 200);
  const sanScore = Math.round(40 + sr(i * 19 + 7) * 60);
  const esgScore = Math.round(30 + sr(i * 23 + 11) * 70);
  const climateScore = Math.round(25 + sr(i * 29 + 13) * 75);
  const fossilFuel = parseFloat((5 + sr(i * 31 + 17) * 45).toFixed(1));
  const greenAlloc = parseFloat((2 + sr(i * 37 + 19) * 28).toFixed(1));
  const portTemp = parseFloat((1.6 + sr(i * 41 + 23) * 2.4).toFixed(2));
  const transScore = Math.round(35 + sr(i * 43 + 29) * 65);
  const govScore = Math.round(40 + sr(i * 47 + 31) * 60);
  const nztRaw = sr(i * 53 + 37);
  const netZeroTarget = nztRaw < 0.25 ? null : nztRaw < 0.55 ? 2050 : nztRaw < 0.78 ? 2040 : 2060;
  return {
    id: i + 1,
    name: SWF_NAMES[i] || `Sovereign Fund ${i + 1}`,
    country: SWF_COUNTRIES[i] || 'Other',
    region: getRegion(i),
    aum,
    fundType: getFundType(i),
    founded: Math.round(1950 + sr(i * 59 + 41) * 70),
    santiagoScore: sanScore,
    esgScore,
    climateScore,
    fossilFuelExposure: fossilFuel,
    greenAllocation: greenAlloc,
    portfolioTemp: portTemp,
    divest2030: sr(i * 61 + 43) > 0.55,
    netZeroTarget,
    exclusionList: sr(i * 67 + 47) > 0.35,
    transparencyScore: transScore,
    iiwgMember: sr(i * 71 + 53) > 0.50,
    co2eTonnes: Math.round(aum * (10 + sr(i * 73 + 59) * 90) * 1000),
    governanceScore: govScore,
  };
});

const EXCLUSION_POLICIES = [
  'Weapons','Tobacco','Coal','Oil Sands','Deforestation',
  'Human Rights Violations','Corruption','Nuclear','Gambling','Adult Content',
];

const GAPP_PRINCIPLES = [
  { id: 1, title: 'Legal Framework', desc: 'The SWF should be established and operated on a sound legal basis.' },
  { id: 2, title: 'Policy Purpose', desc: 'The policy purpose should be clearly defined and publicly disclosed.' },
  { id: 3, title: 'Macroeconomic Policy', desc: 'SWF activities should be consistent with sound macroeconomic policies.' },
  { id: 4, title: 'Clear Policies', desc: 'Fiscal and monetary authorities should have clear policies toward the SWF.' },
  { id: 5, title: 'Accountability Framework', desc: 'Accountability and responsibility for SWF management should be clearly defined.' },
  { id: 6, title: 'Reporting', desc: 'SWFs should have in place adequate reporting procedures.' },
  { id: 7, title: 'Operational Controls', desc: 'Operational risk management frameworks should be established.' },
  { id: 8, title: 'Governance Independence', desc: 'Governance frameworks should ensure operational independence from owner.' },
  { id: 9, title: 'Investment Policy', desc: 'SWF investment policy should be clearly set out.' },
  { id: 10, title: 'Active Ownership', desc: 'Ownership rights should be managed to protect the investment.' },
  { id: 11, title: 'ESG Integration', desc: 'ESG factors should be reflected in the investment framework.' },
  { id: 12, title: 'Risk Management', desc: 'A sound risk management framework including asset allocation should exist.' },
  { id: 13, title: 'Performance Measurement', desc: 'Performance of the SWF should be measured relative to benchmarks.' },
  { id: 14, title: 'Liability Management', desc: 'SWF investment decisions should be based on sound analytical criteria.' },
  { id: 15, title: 'Leverage', desc: 'Leverage policy of the SWF should be set out and managed prudently.' },
  { id: 16, title: 'Derivatives Use', desc: 'Derivative use should be permitted only for hedging purposes.' },
  { id: 17, title: 'Reporting Standards', desc: 'Financial statements should be audited under recognized standards.' },
  { id: 18, title: 'Transparency', desc: 'Annual reports and information should be publicly available.' },
  { id: 19, title: 'Market Conduct', desc: 'SWFs should not seek or use privileged information.' },
  { id: 20, title: 'Cross-border Rules', desc: 'Investment policies should comply with host country laws.' },
  { id: 21, title: 'Disclosure', desc: 'Ownership disclosure should comply with relevant regulations.' },
  { id: 22, title: 'Corporate Governance', desc: 'SWFs should vote in accordance with governance policies.' },
  { id: 23, title: 'Engagement', desc: 'SWFs should engage collaboratively on systemic risks.' },
  { id: 24, title: 'Stewardship', desc: 'SWFs should be long-term stewards of assets.' },
];

const DIVESTMENT_COMMITMENTS = Array.from({ length: 50 }, (_, i) => {
  const fund = SWFS[Math.floor(sr(i * 83 + 7) * 75)].name;
  const sectors = ['Coal Mining','Oil & Gas E&P','Fossil Fuel Utilities','Oil Sands','Tar Sands',
    'Thermal Coal Power','Deforestation-linked Timber','Tobacco Manufacturing','Weapons Systems','Nuclear Energy'];
  const assetClasses = ['Equity','Fixed Income','Private Equity','Real Assets','Alternatives'];
  const statuses = ['Announced','In Progress','Complete'];
  return {
    id: i + 1,
    fund,
    assetClass: assetClasses[Math.floor(sr(i * 89 + 11) * assetClasses.length)],
    sector: sectors[Math.floor(sr(i * 97 + 13) * sectors.length)],
    value: parseFloat((0.5 + sr(i * 101 + 17) * 49.5).toFixed(1)),
    targetYear: 2025 + Math.floor(sr(i * 103 + 19) * 10),
    status: statuses[Math.floor(sr(i * 107 + 23) * statuses.length)],
  };
});

const REGION_COLORS = {
  GCC: T.gold, 'East Asia': T.teal, Europe: T.navy, Americas: T.blue,
  Africa: T.green, 'South Asia': T.amber, Other: T.purple,
};
const FUND_TYPE_COLORS = {
  Stabilization: T.blue, Savings: T.green, Development: T.teal,
  'Reserve Investment': T.gold, 'Pension Reserve': T.navy, Strategic: T.purple,
};

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const TabBar = ({ tabs, active, onSelect }) => (
  <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, background: T.card, overflowX: 'auto' }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onSelect(t)} style={{
        padding: '12px 18px', fontSize: 12, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer',
        color: active === t ? T.gold : T.textSec, whiteSpace: 'nowrap',
        borderBottom: active === t ? `2px solid ${T.gold}` : '2px solid transparent',
      }}>{t}</button>
    ))}
  </div>
);

const TABS = [
  'SWF Universe','Santiago Principles','ESG & Exclusions','Climate Allocation',
  'Portfolio Temperature','Divestment Pathway','Governance Benchmarking','Sovereign Credit & Climate',
];

export default function SovereignSWFPage() {
  const [activeTab, setActiveTab] = useState('SWF Universe');
  const [regionFilter, setRegionFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [divest2030Filter, setDivest2030Filter] = useState(false);
  const [selectedFund, setSelectedFund] = useState(SWFS[0].name);
  const [divRateSlider, setDivRateSlider] = useState(10);
  const [divStatusFilter, setDivStatusFilter] = useState('All');
  const [divSectorFilter, setDivSectorFilter] = useState('All');

  const filteredSWFs = useMemo(() => SWFS.filter(f =>
    (regionFilter === 'All' || f.region === regionFilter) &&
    (typeFilter === 'All' || f.fundType === typeFilter) &&
    (!divest2030Filter || f.divest2030) &&
    (search === '' || f.name.toLowerCase().includes(search.toLowerCase()) || f.country.toLowerCase().includes(search.toLowerCase()))
  ), [regionFilter, typeFilter, search, divest2030Filter]);

  const totalAUM = useMemo(() => filteredSWFs.reduce((s, f) => s + f.aum, 0), [filteredSWFs]);
  const avgESG = useMemo(() => filteredSWFs.length ? (filteredSWFs.reduce((s, f) => s + f.esgScore, 0) / filteredSWFs.length).toFixed(1) : '0.0', [filteredSWFs]);
  const avgTemp = useMemo(() => filteredSWFs.length ? (filteredSWFs.reduce((s, f) => s + f.portfolioTemp, 0) / filteredSWFs.length).toFixed(2) : '0.00', [filteredSWFs]);

  const aumByRegion = useMemo(() => REGIONS.map(r => ({
    name: r,
    aum: SWFS.filter(f => f.region === r).reduce((s, f) => s + f.aum, 0),
    count: SWFS.filter(f => f.region === r).length,
  })), []);

  const fundTypeData = useMemo(() => FUND_TYPES.map(t => ({
    name: t,
    count: SWFS.filter(f => f.fundType === t).length,
    avgESG: (() => {
      const g = SWFS.filter(f => f.fundType === t);
      return g.length ? +(g.reduce((s, f) => s + f.esgScore, 0) / g.length).toFixed(1) : 0;
    })(),
  })), []);

  const selectedFundObj = useMemo(() => SWFS.find(f => f.name === selectedFund) || SWFS[0], [selectedFund]);

  const gappData = useMemo(() => GAPP_PRINCIPLES.map((p, i) => ({
    principle: `GAPP ${p.id}`,
    title: p.title,
    score: Math.round(selectedFundObj.santiagoScore * (0.7 + sr(selectedFundObj.id * 109 + i * 13) * 0.6)),
  })), [selectedFundObj]);

  const santiagoRanking = useMemo(() => [...SWFS].sort((a, b) => b.santiagoScore - a.santiagoScore).slice(0, 20), []);

  const exclusionAdoption = useMemo(() => EXCLUSION_POLICIES.map((p, pi) => ({
    policy: p,
    adopted: SWFS.filter((_, i) => sr(i * 113 + pi * 7) > 0.40).length,
    pct: +((SWFS.filter((_, i) => sr(i * 113 + pi * 7) > 0.40).length / Math.max(1, SWFS.length)) * 100).toFixed(1),
  })), []);

  const esgByRegion = useMemo(() => REGIONS.map(r => {
    const g = SWFS.filter(f => f.region === r);
    return { region: r, avgESG: g.length ? +(g.reduce((s, f) => s + f.esgScore, 0) / g.length).toFixed(1) : 0, count: g.length };
  }), []);

  const topESG = useMemo(() => [...SWFS].sort((a, b) => b.esgScore - a.esgScore).slice(0, 10), []);
  const bottomESG = useMemo(() => [...SWFS].sort((a, b) => a.esgScore - b.esgScore).slice(0, 10), []);

  const greenTop20 = useMemo(() => [...SWFS].sort((a, b) => b.greenAllocation - a.greenAllocation).slice(0, 20), []);
  const fossilDesc = useMemo(() => [...SWFS].sort((a, b) => b.fossilFuelExposure - a.fossilFuelExposure).slice(0, 20), []);

  const tempHistogram = useMemo(() => {
    const bins = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
    return bins.map((b, bi) => ({
      range: `${b}-${bins[bi + 1] || 4.5}C`,
      count: SWFS.filter(f => f.portfolioTemp >= b && f.portfolioTemp < (bins[bi + 1] || 999)).length,
    }));
  }, []);

  const tempByType = useMemo(() => FUND_TYPES.map(t => {
    const g = SWFS.filter(f => f.fundType === t);
    return { type: t, avgTemp: g.length ? +(g.reduce((s, f) => s + f.portfolioTemp, 0) / g.length).toFixed(2) : 0 };
  }), []);

  const above2 = useMemo(() => SWFS.filter(f => f.portfolioTemp > 2.0).length, []);
  const below2 = useMemo(() => SWFS.filter(f => f.portfolioTemp <= 2.0).length, []);

  const ngfsAlignment = useMemo(() => {
    const thresholds = [
      { scenario: '1.5C Aligned', min: 0, max: 1.75, color: T.green },
      { scenario: '2C Aligned', min: 1.75, max: 2.5, color: T.teal },
      { scenario: '3C Aligned', min: 2.5, max: 3.5, color: T.amber },
      { scenario: '4C+', min: 3.5, max: 99, color: T.red },
    ];
    return thresholds.map(s => ({
      ...s,
      count: SWFS.filter(f => f.portfolioTemp >= s.min && f.portfolioTemp < s.max).length,
    }));
  }, []);

  const whatIfTemp = useMemo(() => {
    const base = SWFS.reduce((s, f) => s + f.portfolioTemp, 0) / Math.max(1, SWFS.length);
    const reduction = (divRateSlider / 100) * 0.8;
    return (base - reduction).toFixed(2);
  }, [divRateSlider]);

  const filteredCommitments = useMemo(() => DIVESTMENT_COMMITMENTS.filter(d =>
    (divStatusFilter === 'All' || d.status === divStatusFilter) &&
    (divSectorFilter === 'All' || d.sector === divSectorFilter)
  ), [divStatusFilter, divSectorFilter]);

  const commitBySector = useMemo(() => {
    const map = {};
    DIVESTMENT_COMMITMENTS.forEach(d => { map[d.sector] = (map[d.sector] || 0) + d.value; });
    return Object.entries(map).map(([sector, value]) => ({ sector, value: +value.toFixed(1) }));
  }, []);

  const commitByStatus = useMemo(() => ['Announced','In Progress','Complete'].map(s => ({
    name: s, value: DIVESTMENT_COMMITMENTS.filter(d => d.status === s).length,
  })), []);

  const cumulativeDivest = useMemo(() => {
    const years = Array.from({ length: 10 }, (_, i) => 2025 + i);
    let cum = 0;
    return years.map(y => {
      cum += DIVESTMENT_COMMITMENTS.filter(d => d.targetYear === y).reduce((s, d) => s + d.value, 0);
      return { year: y, cumulative: +cum.toFixed(1) };
    });
  }, []);

  const top10Divestors = useMemo(() => {
    const map = {};
    DIVESTMENT_COMMITMENTS.forEach(d => { map[d.fund] = (map[d.fund] || 0) + d.value; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([fund, value]) => ({
      fund: fund.length > 22 ? fund.slice(0, 22) + '...' : fund, value: +value.toFixed(1),
    }));
  }, []);

  const govScatter = useMemo(() => SWFS.map(f => ({ name: f.name, gov: f.governanceScore, aum: f.aum, region: f.region })), []);

  const transTop20 = useMemo(() => [...SWFS].sort((a, b) => b.transparencyScore - a.transparencyScore).slice(0, 20), []);

  const radarByRegion = useMemo(() => REGIONS.map(r => {
    const g = SWFS.filter(f => f.region === r);
    const avg = key => g.length ? +(g.reduce((s, f) => s + f[key], 0) / g.length).toFixed(1) : 0;
    return {
      region: r,
      diversity: avg('esgScore'),
      independence: avg('governanceScore'),
      climateExpertise: avg('climateScore'),
      reporting: avg('transparencyScore'),
      stewardship: avg('santiagoScore'),
    };
  }), []);

  const co2Scatter = useMemo(() => SWFS.map(f => ({
    name: f.name,
    co2Intensity: +(f.co2eTonnes / Math.max(1, f.aum * 1000)).toFixed(2),
    esg: f.esgScore,
    aum: f.aum,
    region: f.region,
  })), []);

  const greenBondByCountry = useMemo(() => {
    const countries = ['Norway','UAE','China','Singapore','Saudi Arabia','Qatar','Australia','France','Sweden','South Korea'];
    return countries.map((c, i) => ({ country: c, issuance: +(5 + sr(i * 127 + 3) * 95).toFixed(1) }));
  }, []);

  const leadershipIndex = useMemo(() => [...SWFS].map(f => ({
    name: f.name.length > 22 ? f.name.slice(0, 22) + '...' : f.name,
    index: +((f.esgScore * 0.3 + f.climateScore * 0.3 + f.santiagoScore * 0.2 + f.governanceScore * 0.2)).toFixed(1),
  })).sort((a, b) => b.index - a.index).slice(0, 15), []);

  const sel = selectedFundObj;

  const totalUniverseAUM = SWFS.reduce((s, f) => s + f.aum, 0);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, marginBottom: 2 }}>E107 · SOVEREIGN WEALTH FUNDS</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>Sovereign Wealth Fund Intelligence Suite</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
              75 SWFs · IWG-GAPP Santiago Principles · ESG &amp; Climate Analytics · $
              {(totalUniverseAUM / 1000).toFixed(1)}T AUM Universe
            </div>
          </div>
        </div>
      </div>

      <TabBar tabs={TABS} active={activeTab} onSelect={setActiveTab} />

      <div style={{ padding: '24px 32px' }}>

        {/* ── TAB 1: SWF Universe ── */}
        {activeTab === 'SWF Universe' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <KpiCard label="TOTAL FUNDS" value={filteredSWFs.length} sub="in view" />
              <KpiCard label="TOTAL AUM" value={totalAUM >= 1000 ? `$${(totalAUM / 1000).toFixed(1)}T` : `$${totalAUM}B`} sub="USD" color={T.gold} />
              <KpiCard label="AVG ESG SCORE" value={avgESG} sub="/ 100" color={T.green} />
              <KpiCard label="AVG PORT TEMP" value={`${avgTemp}C`} sub="weighted" color={parseFloat(avgTemp) > 2 ? T.red : T.teal} />
              <KpiCard label="DIVEST 2030" value={filteredSWFs.filter(f => f.divest2030).length} sub="committed" color={T.indigo} />
              <KpiCard label="IIWG MEMBERS" value={filteredSWFs.filter(f => f.iiwgMember).length} sub="of total" color={T.navy} />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="Search fund or country..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '7px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, width: 220 }}
              />
              {['All', ...REGIONS].map(r => (
                <button key={r} onClick={() => setRegionFilter(r)} style={{
                  padding: '6px 12px', fontSize: 11, borderRadius: 5,
                  border: `1px solid ${regionFilter === r ? T.gold : T.border}`,
                  background: regionFilter === r ? T.gold : T.card,
                  color: regionFilter === r ? '#fff' : T.textSec, cursor: 'pointer',
                }}>{r}</button>
              ))}
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                style={{ padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
                <option value="All">All Types</option>
                {FUND_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={divest2030Filter} onChange={e => setDivest2030Filter(e.target.checked)} />
                Divest 2030 Only
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>AUM by Region ($Bn)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={aumByRegion}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => `$${v}B`} />
                    <Bar dataKey="aum" radius={[3, 3, 0, 0]}>
                      {aumByRegion.map((r, i) => <Cell key={i} fill={REGION_COLORS[r.name] || T.blue} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>Fund Type Distribution</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={fundTypeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={110} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                      {fundTypeData.map((d, i) => <Cell key={i} fill={FUND_TYPE_COLORS[d.name] || T.blue} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Fund','Country','Region','Type','AUM ($B)','ESG','Climate','Port Temp','Santiago','Divest30','NZ Target'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: T.textPri, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSWFs.slice(0, 30).map((f, i) => (
                    <tr key={f.id}
                      onClick={() => { setSelectedFund(f.name); setActiveTab('Santiago Principles'); }}
                      style={{ background: i % 2 === 0 ? T.card : T.cream, cursor: 'pointer' }}>
                      <td style={{ padding: '7px 12px', color: T.navy, fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</td>
                      <td style={{ padding: '7px 12px', color: T.textSec }}>{f.country}</td>
                      <td style={{ padding: '7px 12px' }}>
                        <span style={{ padding: '2px 7px', borderRadius: 10, fontSize: 10, background: (REGION_COLORS[f.region] || T.blue) + '22', color: REGION_COLORS[f.region] || T.blue }}>{f.region}</span>
                      </td>
                      <td style={{ padding: '7px 12px', color: T.textSec, fontSize: 10 }}>{f.fundType}</td>
                      <td style={{ padding: '7px 12px', fontFamily: T.fontMono }}>${f.aum}</td>
                      <td style={{ padding: '7px 12px', color: f.esgScore >= 70 ? T.green : f.esgScore >= 50 ? T.amber : T.red, fontWeight: 600 }}>{f.esgScore}</td>
                      <td style={{ padding: '7px 12px', color: T.teal }}>{f.climateScore}</td>
                      <td style={{ padding: '7px 12px', color: f.portfolioTemp <= 2 ? T.green : f.portfolioTemp <= 3 ? T.amber : T.red, fontFamily: T.fontMono }}>{f.portfolioTemp}C</td>
                      <td style={{ padding: '7px 12px' }}>{f.santiagoScore}</td>
                      <td style={{ padding: '7px 12px' }}>{f.divest2030 ? 'Yes' : '-'}</td>
                      <td style={{ padding: '7px 12px', color: T.textSec }}>{f.netZeroTarget || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSWFs.length > 30 && (
                <div style={{ padding: '8px 16px', fontSize: 11, color: T.textSec }}>Showing 30 of {filteredSWFs.length} results</div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: Santiago Principles ── */}
        {activeTab === 'Santiago Principles' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.textPri }}>Fund:</div>
              <select value={selectedFund} onChange={e => setSelectedFund(e.target.value)}
                style={{ padding: '7px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, minWidth: 280 }}>
                {SWFS.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
              <KpiCard label="SANTIAGO SCORE" value={sel.santiagoScore} sub="/ 100" color={T.gold} />
              <KpiCard label="IIWG MEMBER" value={sel.iiwgMember ? 'Yes' : 'No'} color={sel.iiwgMember ? T.green : T.red} />
              <KpiCard label="GAP TO LEADER" value={Math.max(0, 100 - sel.santiagoScore)} sub="points" color={T.amber} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>GAPP Principle Compliance — {sel.name.slice(0, 28)}</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={gappData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <YAxis dataKey="principle" type="category" tick={{ fontSize: 9 }} width={54} />
                    <Tooltip formatter={v => `${v}/100`} labelFormatter={l => gappData.find(d => d.principle === l)?.title || l} />
                    <Bar dataKey="score" radius={[0, 3, 3, 0]}>
                      {gappData.map((d, i) => <Cell key={i} fill={d.score >= 75 ? T.green : d.score >= 50 ? T.gold : T.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>Santiago Score Ranking (Top 20)</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={santiagoRanking.map(f => ({ name: f.name.slice(0, 16), score: f.santiagoScore, iiwg: f.iiwgMember }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" interval={0} height={60} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                      {santiagoRanking.map((f, i) => <Cell key={i} fill={f.iiwgMember ? T.gold : T.navy} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 10, color: T.textSec, marginTop: 6 }}>
                  <span style={{ color: T.gold }}>&#9632;</span> IIWG Member &nbsp;
                  <span style={{ color: T.navy }}>&#9632;</span> Non-member
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: T.textPri }}>Score Distribution Histogram</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={[0,10,20,30,40,50,60,70,80,90].map(b => ({
                    range: `${b}-${b+10}`, count: SWFS.filter(f => f.santiagoScore >= b && f.santiagoScore < b + 10).length,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={T.gold} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: T.textPri }}>IIWG Member vs Non-Member (Avg Santiago)</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={[
                    { group: 'IIWG Members', avg: +(SWFS.filter(f => f.iiwgMember).reduce((s, f) => s + f.santiagoScore, 0) / Math.max(1, SWFS.filter(f => f.iiwgMember).length)).toFixed(1) },
                    { group: 'Non-Members', avg: +(SWFS.filter(f => !f.iiwgMember).reduce((s, f) => s + f.santiagoScore, 0) / Math.max(1, SWFS.filter(f => !f.iiwgMember).length)).toFixed(1) },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="group" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="avg" radius={[3, 3, 0, 0]}>
                      <Cell fill={T.gold} /><Cell fill={T.navy} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: ESG & Exclusions ── */}
        {activeTab === 'ESG & Exclusions' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <KpiCard label="AVG ESG SCORE" value={(SWFS.reduce((s, f) => s + f.esgScore, 0) / Math.max(1, SWFS.length)).toFixed(1)} sub="all funds" color={T.green} />
              <KpiCard label="EXCLUSION LISTS" value={SWFS.filter(f => f.exclusionList).length} sub="funds" color={T.indigo} />
              <KpiCard label="AVG TRANSPARENCY" value={(SWFS.reduce((s, f) => s + f.transparencyScore, 0) / Math.max(1, SWFS.length)).toFixed(1)} sub="/ 100" color={T.teal} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>Exclusion Policy Adoption Rate (%)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={exclusionAdoption} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                    <YAxis dataKey="policy" type="category" tick={{ fontSize: 10 }} width={130} />
                    <Tooltip formatter={v => `${v}%`} />
                    <Bar dataKey="pct" radius={[0, 3, 3, 0]} fill={T.indigo} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>ESG Score by Region</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={esgByRegion}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="avgESG" radius={[3, 3, 0, 0]}>
                      {esgByRegion.map((d, i) => <Cell key={i} fill={REGION_COLORS[d.region] || T.blue} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: T.textPri }}>Top 10 by ESG Score</div>
                {topESG.map((f, i) => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ fontSize: 10, color: T.textSec, width: 18 }}>{i + 1}</span>
                    <span style={{ fontSize: 11, flex: 1, color: T.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name.slice(0, 26)}</span>
                    <div style={{ width: 80, height: 6, background: T.borderL, borderRadius: 3 }}>
                      <div style={{ width: `${f.esgScore}%`, height: '100%', background: T.green, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.green, width: 28, textAlign: 'right' }}>{f.esgScore}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: T.textPri }}>Bottom 10 by ESG Score</div>
                {bottomESG.map((f, i) => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ fontSize: 10, color: T.textSec, width: 18 }}>{i + 1}</span>
                    <span style={{ fontSize: 11, flex: 1, color: T.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name.slice(0, 26)}</span>
                    <div style={{ width: 80, height: 6, background: T.borderL, borderRadius: 3 }}>
                      <div style={{ width: `${f.esgScore}%`, height: '100%', background: T.red, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.red, width: 28, textAlign: 'right' }}>{f.esgScore}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: Climate Allocation ── */}
        {activeTab === 'Climate Allocation' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <KpiCard label="AVG GREEN ALLOC" value={`${(SWFS.reduce((s, f) => s + f.greenAllocation, 0) / Math.max(1, SWFS.length)).toFixed(1)}%`} color={T.green} />
              <KpiCard label="AVG FOSSIL EXPOSURE" value={`${(SWFS.reduce((s, f) => s + f.fossilFuelExposure, 0) / Math.max(1, SWFS.length)).toFixed(1)}%`} color={T.red} />
              <KpiCard label="NET ZERO 2050" value={SWFS.filter(f => f.netZeroTarget === 2050).length} sub="funds" color={T.teal} />
              <KpiCard label="NET ZERO 2040" value={SWFS.filter(f => f.netZeroTarget === 2040).length} sub="early" color={T.indigo} />
              <KpiCard label="NO TARGET" value={SWFS.filter(f => f.netZeroTarget === null).length} sub="funds" color={T.amber} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>Green Allocation % (Top 20 Funds)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={greenTop20.map(f => ({ name: f.name.slice(0, 13), pct: f.greenAllocation }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" height={55} interval={0} />
                    <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => `${v}%`} />
                    <Bar dataKey="pct" fill={T.green} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>Fossil Fuel Exposure % (Top 20, Descending)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={fossilDesc.map(f => ({ name: f.name.slice(0, 13), pct: f.fossilFuelExposure }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" height={55} interval={0} />
                    <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => `${v}%`} />
                    <Bar dataKey="pct" fill={T.red} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>Green vs Fossil Scatter</div>
                <ResponsiveContainer width="100%" height={200}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="fossil" name="Fossil %" tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} label={{ value: 'Fossil %', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis dataKey="green" name="Green %" tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} label={{ value: 'Green %', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={SWFS.map(f => ({ fossil: f.fossilFuelExposure, green: f.greenAllocation }))} fill={T.teal} fillOpacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>Net Zero Target Year Distribution</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { year: '2040', count: SWFS.filter(f => f.netZeroTarget === 2040).length },
                    { year: '2050', count: SWFS.filter(f => f.netZeroTarget === 2050).length },
                    { year: '2060', count: SWFS.filter(f => f.netZeroTarget === 2060).length },
                    { year: 'No Target', count: SWFS.filter(f => f.netZeroTarget === null).length },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                      <Cell fill={T.indigo} /><Cell fill={T.green} /><Cell fill={T.amber} /><Cell fill={T.red} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: Portfolio Temperature ── */}
        {activeTab === 'Portfolio Temperature' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <KpiCard label="AVG PORT TEMP" value={`${(SWFS.reduce((s, f) => s + f.portfolioTemp, 0) / Math.max(1, SWFS.length)).toFixed(2)}C`} color={T.amber} />
              <KpiCard label="ABOVE 2C" value={above2} sub={`${((above2 / Math.max(1, SWFS.length)) * 100).toFixed(0)}% of funds`} color={T.red} />
              <KpiCard label="BELOW 2C" value={below2} sub={`${((below2 / Math.max(1, SWFS.length)) * 100).toFixed(0)}% of funds`} color={T.green} />
              <KpiCard label="WHAT-IF TEMP" value={`${whatIfTemp}C`} sub={`at ${divRateSlider}% divestment`} color={parseFloat(whatIfTemp) <= 2 ? T.green : T.amber} />
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: T.textPri }}>What-If: Fossil Fuel Divestment Rate vs Portfolio Temperature</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 11, color: T.textSec }}>0%</span>
                <input type="range" min={0} max={100} value={divRateSlider} onChange={e => setDivRateSlider(+e.target.value)}
                  style={{ flex: 1, accentColor: T.gold }} />
                <span style={{ fontSize: 11, color: T.textSec }}>100%</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.gold, width: 60, textAlign: 'center' }}>{divRateSlider}%</span>
              </div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 6 }}>
                A {divRateSlider}% divestment reduces average portfolio temperature from{' '}
                <strong>{(SWFS.reduce((s, f) => s + f.portfolioTemp, 0) / Math.max(1, SWFS.length)).toFixed(2)}C</strong>{' '}
                to <strong style={{ color: parseFloat(whatIfTemp) <= 2 ? T.green : T.amber }}>{whatIfTemp}C</strong>.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>Temperature Distribution Histogram</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={tempHistogram}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                      {tempHistogram.map((d, i) => (
                        <Cell key={i} fill={i === 0 ? T.green : i === 1 ? T.teal : i === 2 ? T.amber : T.red} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>Avg Temperature by Fund Type</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={tempByType}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="type" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={45} />
                    <YAxis domain={[1.5, 4]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}C`} />
                    <Tooltip formatter={v => `${v}C`} />
                    <Bar dataKey="avgTemp" radius={[3, 3, 0, 0]}>
                      {tempByType.map((d, i) => (
                        <Cell key={i} fill={d.avgTemp <= 2 ? T.green : d.avgTemp <= 2.5 ? T.teal : d.avgTemp <= 3 ? T.amber : T.red} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>NGFS Scenario Alignment Count</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {ngfsAlignment.map(s => (
                  <div key={s.scenario} style={{ background: T.sub, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 24px', flex: 1, minWidth: 120, textAlign: 'center' }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{s.scenario}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: Divestment Pathway ── */}
        {activeTab === 'Divestment Pathway' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <KpiCard label="TOTAL COMMITMENTS" value={DIVESTMENT_COMMITMENTS.length} sub="events" />
              <KpiCard label="TOTAL VALUE" value={`$${DIVESTMENT_COMMITMENTS.reduce((s, d) => s + d.value, 0).toFixed(0)}B`} color={T.gold} />
              <KpiCard label="COMPLETE" value={DIVESTMENT_COMMITMENTS.filter(d => d.status === 'Complete').length} color={T.green} />
              <KpiCard label="IN PROGRESS" value={DIVESTMENT_COMMITMENTS.filter(d => d.status === 'In Progress').length} color={T.amber} />
              <KpiCard label="ANNOUNCED" value={DIVESTMENT_COMMITMENTS.filter(d => d.status === 'Announced').length} color={T.blue} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              {['All','Announced','In Progress','Complete'].map(s => (
                <button key={s} onClick={() => setDivStatusFilter(s)} style={{
                  padding: '6px 12px', fontSize: 11, borderRadius: 5,
                  border: `1px solid ${divStatusFilter === s ? T.gold : T.border}`,
                  background: divStatusFilter === s ? T.gold : T.card,
                  color: divStatusFilter === s ? '#fff' : T.textSec, cursor: 'pointer',
                }}>{s}</button>
              ))}
              <select value={divSectorFilter} onChange={e => setDivSectorFilter(e.target.value)}
                style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
                <option value="All">All Sectors</option>
                {[...new Set(DIVESTMENT_COMMITMENTS.map(d => d.sector))].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>Cumulative Divestment Value by Year ($Bn)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={cumulativeDivest}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}B`} />
                    <Tooltip formatter={v => `$${v}B`} />
                    <Area type="monotone" dataKey="cumulative" stroke={T.green} fill={T.green + '33'} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>Status Distribution</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={commitByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name}: ${value}`}>
                      <Cell fill={T.blue} /><Cell fill={T.amber} /><Cell fill={T.green} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>Commitments by Sector ($Bn)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={commitBySector} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}B`} />
                    <YAxis dataKey="sector" type="category" tick={{ fontSize: 9 }} width={150} />
                    <Tooltip formatter={v => `$${v}B`} />
                    <Bar dataKey="value" fill={T.red} radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>Top 10 Funds by Divestment Value ($Bn)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={top10Divestors} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}B`} />
                    <YAxis dataKey="fund" type="category" tick={{ fontSize: 9 }} width={150} />
                    <Tooltip formatter={v => `$${v}B`} />
                    <Bar dataKey="value" fill={T.navy} radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Fund','Asset Class','Sector','Value ($B)','Target Year','Status'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: T.textPri, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCommitments.slice(0, 20).map((d, i) => (
                    <tr key={d.id} style={{ background: i % 2 === 0 ? T.card : T.cream }}>
                      <td style={{ padding: '6px 12px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.fund}</td>
                      <td style={{ padding: '6px 12px', color: T.textSec }}>{d.assetClass}</td>
                      <td style={{ padding: '6px 12px', color: T.textSec }}>{d.sector}</td>
                      <td style={{ padding: '6px 12px', fontFamily: T.fontMono }}>${d.value}B</td>
                      <td style={{ padding: '6px 12px' }}>{d.targetYear}</td>
                      <td style={{ padding: '6px 12px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 10, fontSize: 10,
                          background: d.status === 'Complete' ? T.green + '22' : d.status === 'In Progress' ? T.amber + '22' : T.blue + '22',
                          color: d.status === 'Complete' ? T.green : d.status === 'In Progress' ? T.amber : T.blue,
                        }}>{d.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 7: Governance Benchmarking ── */}
        {activeTab === 'Governance Benchmarking' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <KpiCard label="AVG GOV SCORE" value={(SWFS.reduce((s, f) => s + f.governanceScore, 0) / Math.max(1, SWFS.length)).toFixed(1)} sub="/ 100" color={T.navy} />
              <KpiCard label="AVG TRANSPARENCY" value={(SWFS.reduce((s, f) => s + f.transparencyScore, 0) / Math.max(1, SWFS.length)).toFixed(1)} sub="/ 100" color={T.teal} />
              <KpiCard label="HIGH GOV (>=80)" value={SWFS.filter(f => f.governanceScore >= 80).length} sub="funds" color={T.green} />
              <KpiCard label="LOW GOV (<50)" value={SWFS.filter(f => f.governanceScore < 50).length} sub="funds" color={T.red} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>Governance Score vs AUM</div>
                <ResponsiveContainer width="100%" height={240}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="gov" name="Gov Score" tick={{ fontSize: 10 }} label={{ value: 'Governance Score', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis dataKey="aum" name="AUM $B" tick={{ fontSize: 10 }} label={{ value: 'AUM $B', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={govScatter}>
                      {govScatter.map((d, i) => <Cell key={i} fill={REGION_COLORS[d.region] || T.blue} fillOpacity={0.7} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>Transparency Score Ranking (Top 20)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={transTop20.map(f => ({ name: f.name.slice(0, 14), score: f.transparencyScore }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" height={55} interval={0} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="score" fill={T.teal} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>Board Composition Radar — Average by Region (First 3 Regions)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {radarByRegion.slice(0, 3).map(r => (
                  <div key={r.region}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: REGION_COLORS[r.region] || T.navy, marginBottom: 6, textAlign: 'center' }}>{r.region}</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <RadarChart data={[
                        { dim: 'ESG', val: r.diversity },
                        { dim: 'Governance', val: r.independence },
                        { dim: 'Climate', val: r.climateExpertise },
                        { dim: 'Transparency', val: r.reporting },
                        { dim: 'Santiago', val: r.stewardship },
                      ]}>
                        <PolarGrid stroke={T.borderL} />
                        <PolarAngleAxis dataKey="dim" tick={{ fontSize: 9 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} />
                        <Radar dataKey="val" stroke={REGION_COLORS[r.region] || T.navy} fill={REGION_COLORS[r.region] || T.navy} fillOpacity={0.25} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 8: Sovereign Credit & Climate ── */}
        {activeTab === 'Sovereign Credit & Climate' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <KpiCard label="AVG CO2e INTENSITY" value={(co2Scatter.reduce((s, f) => s + f.co2Intensity, 0) / Math.max(1, co2Scatter.length)).toFixed(2)} sub="tCO2e/$M AUM" color={T.amber} />
              <KpiCard label="CLIMATE LEADERS" value={leadershipIndex.filter(f => f.index >= 70).length} sub="index >=70" color={T.green} />
              <KpiCard label="AVG LEADERSHIP IDX" value={(leadershipIndex.reduce((s, f) => s + f.index, 0) / Math.max(1, leadershipIndex.length)).toFixed(1)} color={T.gold} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>CO2e Intensity vs ESG Score</div>
                <ResponsiveContainer width="100%" height={240}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="co2Intensity" name="CO2e Intensity" tick={{ fontSize: 10 }} label={{ value: 'CO2e Intensity', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                    <YAxis dataKey="esg" name="ESG Score" tick={{ fontSize: 10 }} label={{ value: 'ESG Score', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={co2Scatter.slice(0, 40)}>
                      {co2Scatter.slice(0, 40).map((d, i) => <Cell key={i} fill={REGION_COLORS[d.region] || T.blue} fillOpacity={0.7} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>Green Bond Issuance by Country ($Bn)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={greenBondByCountry}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="country" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={50} interval={0} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}B`} />
                    <Tooltip formatter={v => `$${v}B`} />
                    <Bar dataKey="issuance" fill={T.green} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.textPri }}>SWF Climate Leadership Index (Top 15 — Composite Score)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={leadershipIndex}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-25} textAnchor="end" height={60} interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="index" radius={[3, 3, 0, 0]}>
                    {leadershipIndex.map((d, i) => (
                      <Cell key={i} fill={d.index >= 75 ? T.green : d.index >= 55 ? T.gold : T.amber} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 10, color: T.textSec, marginTop: 8 }}>
                Composite = ESG (30%) + Climate (30%) + Santiago (20%) + Governance (20%)
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
