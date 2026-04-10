import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  ScatterChart, Scatter, PieChart, Pie, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, ReferenceLine
} from 'recharts';

const T = {
  surface:'#fafaf7', border:'#e2e0d8', navy:'#1b2a4a', gold:'#b8962e',
  text:'#1a1a2e', sub:'#64748b', card:'#ffffff', indigo:'#4f46e5',
  green:'#065f46', red:'#991b1b', amber:'#92400e',
  greenL:'#d1fae5', redL:'#fee2e2', amberL:'#fef3c7', indigoL:'#ede9fe',
  teal:'#0e7490', purple:'#6d28d9', orange:'#c2410c', blue:'#1e40af',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── Module-level data ──────────────────────────────────────────────────────

const COMPLIANCE_MARKETS = [
  { name:'EU ETS', region:'Europe', price:65, unit:'EUR', volume:8400, coverage:40, cap:1720, surplus:-320, mechanism:'Cap-and-trade', linked:'UK, Switzerland', trend:12, yr2030cap:1100, vintage:'2024' },
  { name:'UK ETS', region:'Europe', price:42, unit:'GBP', volume:890, coverage:25, cap:156, surplus:-18, mechanism:'Cap-and-trade', linked:'EU (review)', trend:8, yr2030cap:82, vintage:'2024' },
  { name:'California CaT', region:'N. America', price:32, unit:'USD', volume:1200, coverage:35, cap:310, surplus:45, mechanism:'Cap-and-trade', linked:'Quebec', trend:5, yr2030cap:200, vintage:'2024' },
  { name:'RGGI', region:'N. America', price:15, unit:'USD', volume:380, coverage:20, cap:92, surplus:12, mechanism:'Cap-and-trade', linked:'None', trend:3, yr2030cap:58, vintage:'2024' },
  { name:'China ETS', region:'Asia', price:9, unit:'CNY/tCO2', volume:42000, coverage:40, cap:5000, surplus:820, mechanism:'Intensity-based', linked:'None', trend:25, yr2030cap:4200, vintage:'2024' },
  { name:'Korea ETS', region:'Asia', price:8, unit:'USD', volume:620, coverage:70, cap:590, surplus:-22, mechanism:'Cap-and-trade', linked:'None', trend:-2, yr2030cap:420, vintage:'2024' },
  { name:'NZ ETS', region:'Oceania', price:35, unit:'NZD', volume:168, coverage:50, cap:160, surplus:-8, mechanism:'Cap-and-trade', linked:'None', trend:15, yr2030cap:98, vintage:'2024' },
  { name:'Switzerland ETS', region:'Europe', price:60, unit:'CHF', volume:42, coverage:10, cap:28, surplus:-2, mechanism:'Cap-and-trade', linked:'EU', trend:10, yr2030cap:16, vintage:'2024' },
  { name:'Canada OBPS', region:'N. America', price:65, unit:'CAD', volume:310, coverage:28, cap:290, surplus:-15, mechanism:'Output-based', linked:'None', trend:18, yr2030cap:170, vintage:'2024' },
  { name:'Mexico ETS', region:'L. America', price:2, unit:'USD', volume:140, coverage:38, cap:310, surplus:120, mechanism:'Pilot phase', linked:'None', trend:35, yr2030cap:240, vintage:'2024' },
  { name:'Chile ETS', region:'L. America', price:5, unit:'USD', volume:88, coverage:22, cap:78, surplus:8, mechanism:'Pilot phase', linked:'None', trend:20, yr2030cap:52, vintage:'2024' },
  { name:'Colombia NCRE', region:'L. America', price:3, unit:'USD', volume:62, coverage:15, cap:48, surplus:14, mechanism:'Carbon tax', linked:'None', trend:28, yr2030cap:38, vintage:'2024' },
];

const VCM_HISTORY = [
  { year:2015, issuance:84,  retirements:38,  cancellations:6,  forestry:38, energy:22, industry:14, waste:6,  agriculture:4,  avgPrice:3.2 },
  { year:2016, issuance:92,  retirements:44,  cancellations:7,  forestry:40, energy:24, industry:16, waste:7,  agriculture:5,  avgPrice:3.4 },
  { year:2017, issuance:98,  retirements:52,  cancellations:8,  forestry:44, energy:26, industry:16, waste:7,  agriculture:5,  avgPrice:3.8 },
  { year:2018, issuance:104, retirements:62,  cancellations:9,  forestry:48, energy:28, industry:17, waste:6,  agriculture:5,  avgPrice:4.1 },
  { year:2019, issuance:112, retirements:78,  cancellations:10, forestry:50, energy:30, industry:18, waste:8,  agriculture:6,  avgPrice:4.5 },
  { year:2020, issuance:124, retirements:95,  cancellations:11, forestry:54, energy:32, industry:20, waste:10, agriculture:8,  avgPrice:5.2 },
  { year:2021, issuance:198, retirements:155, cancellations:14, forestry:86, energy:52, industry:34, waste:14, agriculture:12, avgPrice:8.6 },
  { year:2022, issuance:165, retirements:142, cancellations:18, forestry:72, energy:44, industry:28, waste:12, agriculture:9,  avgPrice:7.8 },
  { year:2023, issuance:142, retirements:128, cancellations:22, forestry:60, energy:38, industry:24, waste:12, agriculture:8,  avgPrice:6.9 },
  { year:2024, issuance:168, retirements:152, cancellations:19, forestry:70, energy:44, industry:28, waste:14, agriculture:12, avgPrice:7.4 },
];

const POLICY_EVENTS = [
  { event:'EU CBAM Phase-In',        date:'2026-01', region:'Europe',   type:'Regulatory', price_impact_pct:18, description:'Carbon border adjustment on steel, cement, aluminium, fertilisers, hydrogen, electricity' },
  { event:'China ETS Sector Exp.',   date:'2025-06', region:'Asia',     type:'Expansion',  price_impact_pct:35, description:'Steel, cement, aluminium, aviation sectors added to China national ETS' },
  { event:'CORSIA Phase 2',          date:'2027-01', region:'Global',   type:'Aviation',   price_impact_pct:8,  description:'Mandatory phase of ICAO CORSIA covers all international aviation routes' },
  { event:'Art. 6.4 Rulebook Final', date:'2025-03', region:'Global',   type:'Rulebook',   price_impact_pct:12, description:'UN Article 6.4 Supervisory Body finalises additionality and baseline methodologies' },
  { event:'SBTi Net-Zero Standard',  date:'2025-09', region:'Global',   type:'Standard',   price_impact_pct:10, description:'SBTi corporate net-zero standard v2.0 tightens offset usage limits to <10% of value chain' },
  { event:'Verra VCS Revision 4.6',  date:'2024-12', region:'Global',   type:'Registry',   price_impact_pct:-8, description:'Verra revises REDD+ crediting methodology, removing ~120 MtCO2 of existing credits' },
  { event:'Gold Standard Update',    date:'2025-04', region:'Global',   type:'Registry',   price_impact_pct:5,  description:'Gold Standard integrates SDG Impact Score v2 — premium uplift for SDG-aligned credits' },
  { event:'EU Taxonomy Climate Act', date:'2026-06', region:'Europe',   type:'Taxonomy',   price_impact_pct:15, description:'EU delegated act restricts offsets from green bond proceeds for taxonomy-aligned assets' },
  { event:'US IRA Carbon Capture',   date:'2025-01', region:'N. America', type:'Incentive', price_impact_pct:7, description:'45Q tax credit increased to $185/tCO2 for DAC and $85/tCO2 for geological sequestration' },
  { event:'UK CBAM Implementation',  date:'2027-01', region:'Europe',   type:'Regulatory', price_impact_pct:9,  description:'UK carbon border mechanism launches, mirroring EU CBAM scope with GBP pricing' },
  { event:'ISSB IFRS S2 Mandatory',  date:'2025-07', region:'Global',   type:'Disclosure', price_impact_pct:6,  description:'G20 jurisdictions begin mandatory IFRS S2 climate disclosures including Scope 3' },
  { event:'Singapore Carbon Tax',    date:'2026-01', region:'Asia',     type:'Tax',        price_impact_pct:14, description:'Singapore carbon tax escalates to SGD $25/tCO2; companies may use offsets up to 5% liability' },
  { event:'Brazil REDD+ Registry',   date:'2025-10', region:'L. America', type:'Registry', price_impact_pct:11, description:'Brazil launches national REDD+ crediting registry integrated with Article 6 NDC accounting' },
  { event:'VCMI Claims Code v2',     date:'2025-02', region:'Global',   type:'Standard',   price_impact_pct:4,  description:'VCMI tightens Gold/Silver/Bronze claim criteria; retirement vintage requirements updated' },
  { event:'ICVCM CCPs Final',        date:'2024-11', region:'Global',   type:'Standard',   price_impact_pct:22, description:'ICVCM Core Carbon Principles label awarded to 11 methodologies covering ~800 MtCO2' },
];

const BILATERAL_DEALS = [
  { buyer:'Switzerland', seller:'Ghana',        sector:'Clean cookstoves', itmo_volume:0.28, price_usd:22, ca_applied:true,  status:'Authorized', year:2022 },
  { buyer:'Japan',       seller:'Thailand',     sector:'Forest conservation', itmo_volume:1.20, price_usd:18, ca_applied:true, status:'Authorized', year:2023 },
  { buyer:'Sweden',      seller:'Vanuatu',      sector:'Renewable energy', itmo_volume:0.15, price_usd:25, ca_applied:true, status:'Authorized', year:2023 },
  { buyer:'Singapore',   seller:'Cambodia',     sector:'Blue carbon', itmo_volume:0.42, price_usd:28, ca_applied:true, status:'Authorized', year:2023 },
  { buyer:'South Korea', seller:'Mongolia',     sector:'Renewable energy', itmo_volume:0.80, price_usd:14, ca_applied:true, status:'Under Review', year:2023 },
  { buyer:'Germany',     seller:'Rwanda',       sector:'Clean cooking/solar', itmo_volume:0.55, price_usd:20, ca_applied:true, status:'Authorized', year:2024 },
  { buyer:'Japan',       seller:'Kenya',        sector:'Geothermal', itmo_volume:1.80, price_usd:16, ca_applied:true, status:'Under Review', year:2024 },
  { buyer:'USA',         seller:'Brazil',       sector:'REDD+', itmo_volume:5.00, price_usd:12, ca_applied:false, status:'Negotiating', year:2024 },
  { buyer:'EU',          seller:'Senegal',      sector:'Solar/wind', itmo_volume:2.40, price_usd:19, ca_applied:true, status:'Authorized', year:2024 },
  { buyer:'Norway',      seller:'Indonesia',    sector:'Forests', itmo_volume:8.00, price_usd:10, ca_applied:false, status:'LOI Signed', year:2024 },
  { buyer:'Australia',   seller:'PNG',          sector:'REDD+', itmo_volume:3.50, price_usd:11, ca_applied:false, status:'Negotiating', year:2024 },
  { buyer:'UK',          seller:'Zimbabwe',     sector:'Clean cookstoves', itmo_volume:0.90, price_usd:24, ca_applied:true, status:'Authorized', year:2024 },
  { buyer:'Canada',      seller:'Chile',        sector:'Waste methane', itmo_volume:0.62, price_usd:17, ca_applied:true, status:'Under Review', year:2024 },
  { buyer:'Switzerland', seller:'Senegal',      sector:'Blue carbon', itmo_volume:0.35, price_usd:30, ca_applied:true, status:'Authorized', year:2024 },
  { buyer:'Japan',       seller:'Vietnam',      sector:'Energy efficiency', itmo_volume:2.10, price_usd:15, ca_applied:true, status:'Under Review', year:2025 },
  { buyer:'Singapore',   seller:'Peru',         sector:'Amazon forests', itmo_volume:1.60, price_usd:22, ca_applied:false, status:'LOI Signed', year:2025 },
  { buyer:'South Korea', seller:'Uzbekistan',   sector:'Solar energy', itmo_volume:0.95, price_usd:13, ca_applied:true, status:'Negotiating', year:2025 },
  { buyer:'EU',          seller:'Morocco',      sector:'Wind energy', itmo_volume:3.20, price_usd:21, ca_applied:true, status:'LOI Signed', year:2025 },
  { buyer:'Germany',     seller:'Colombia',     sector:'Blue carbon/mangroves', itmo_volume:0.75, price_usd:26, ca_applied:true, status:'Authorized', year:2025 },
  { buyer:'USA',         seller:'Mexico',       sector:'Methane avoidance', itmo_volume:1.40, price_usd:18, ca_applied:false, status:'Negotiating', year:2025 },
];

const EXCHANGES = [
  { name:'Xpansiv/CBL', daily_volume:8.4, market_share:38, methodology_focus:'Forestry/REDD+', avg_spread:0.12, otc_pct:22, founded:2019 },
  { name:'ACX (AirCarbon)', daily_volume:4.2, market_share:19, methodology_focus:'Diverse', avg_spread:0.08, otc_pct:15, founded:2019 },
  { name:'CME Carbon',  daily_volume:3.8, market_share:17, methodology_focus:'Nature-based', avg_spread:0.05, otc_pct:8, founded:2021 },
  { name:'Toucan/Polygon', daily_volume:1.9, market_share:9, methodology_focus:'Tokenised', avg_spread:0.18, otc_pct:5, founded:2021 },
  { name:'Climate Impact X', daily_volume:2.2, market_share:10, methodology_focus:'High-integrity', avg_spread:0.10, otc_pct:18, founded:2021 },
  { name:'OTC Bilateral', daily_volume:1.6, market_share:7, methodology_focus:'Bespoke', avg_spread:0.25, otc_pct:100, founded:2010 },
];

const REGIONAL_MARKETS = [
  { region:'EU/EEA',    pipeline_mtco2:240, policy_score:92, mrv_score:95, finance_score:88, registry_score:94, demand_score:90, compliance_link:'Yes', vcm_link:'Emerging' },
  { region:'UK',        pipeline_mtco2:42,  policy_score:85, mrv_score:90, finance_score:82, registry_score:88, demand_score:84, compliance_link:'Yes', vcm_link:'Growing' },
  { region:'N. America', pipeline_mtco2:180, policy_score:78, mrv_score:88, finance_score:85, registry_score:90, demand_score:86, compliance_link:'Partial', vcm_link:'Strong' },
  { region:'China',     pipeline_mtco2:520, policy_score:70, mrv_score:72, finance_score:74, registry_score:68, demand_score:62, compliance_link:'Yes', vcm_link:'Developing' },
  { region:'SE Asia',   pipeline_mtco2:380, policy_score:58, mrv_score:62, finance_score:55, registry_score:60, demand_score:68, compliance_link:'Partial', vcm_link:'Strong' },
  { region:'L. America', pipeline_mtco2:420, policy_score:62, mrv_score:65, finance_score:52, registry_score:64, demand_score:58, compliance_link:'Partial', vcm_link:'Strong' },
  { region:'Africa',    pipeline_mtco2:280, policy_score:48, mrv_score:50, finance_score:42, registry_score:52, demand_score:45, compliance_link:'None', vcm_link:'Emerging' },
  { region:'S. Asia',   pipeline_mtco2:160, policy_score:55, mrv_score:58, finance_score:48, registry_score:55, demand_score:52, compliance_link:'None', vcm_link:'Growing' },
  { region:'Oceania',   pipeline_mtco2:68,  policy_score:75, mrv_score:82, finance_score:72, registry_score:80, demand_score:70, compliance_link:'Yes', vcm_link:'Moderate' },
  { region:'Middle East', pipeline_mtco2:95, policy_score:42, mrv_score:48, finance_score:65, registry_score:44, demand_score:38, compliance_link:'None', vcm_link:'Nascent' },
];

const METHODOLOGY_ISSUANCE = [
  { method:'REDD+',            y2019:28, y2020:32, y2021:58, y2022:48, y2023:38, y2024:44 },
  { method:'Solar/Wind',       y2019:18, y2020:20, y2021:32, y2022:26, y2023:22, y2024:28 },
  { method:'Clean Cookstoves', y2019:12, y2020:14, y2021:22, y2022:18, y2023:16, y2024:20 },
  { method:'Methane Capture',  y2019:10, y2020:12, y2021:20, y2022:16, y2023:14, y2024:16 },
  { method:'Afforestation',    y2019:8,  y2020:9,  y2021:14, y2022:12, y2023:10, y2024:12 },
  { method:'Blue Carbon',      y2019:2,  y2020:3,  y2021:6,  y2022:8,  y2023:10, y2024:14 },
  { method:'DAC/CCS',          y2019:0,  y2020:1,  y2021:2,  y2022:4,  y2023:6,  y2024:10 },
  { method:'Soil Carbon',      y2019:3,  y2020:4,  y2021:8,  y2022:6,  y2023:8,  y2024:10 },
  { method:'Waste to Energy',  y2019:8,  y2020:9,  y2021:14, y2022:10, y2023:8,  y2024:8  },
  { method:'Transport',        y2019:4,  y2020:5,  y2021:8,  y2022:6,  y2023:4,  y2024:4  },
  { method:'Industrial Eff.',  y2019:12, y2020:10, y2021:10, y2022:9,  y2023:8,  y2024:10 },
  { method:'Water/Sanitation', y2019:2,  y2020:2,  y2021:4,  y2022:2,  y2023:2,  y2024:2  },
];

const CORRELATION_MATRIX = [
  { asset:'Equities (MSCI World)', corr:0.18 },
  { asset:'US Treasuries',         corr:-0.08 },
  { asset:'Crude Oil (WTI)',        corr:0.32 },
  { asset:'Gold',                   corr:0.04 },
  { asset:'Real Estate (REIT)',     corr:0.14 },
  { asset:'Infrastructure',         corr:0.22 },
  { asset:'Private Equity',         corr:0.28 },
  { asset:'Commodities (BCOM)',     corr:0.38 },
];

const TABS = [
  'Market Overview',
  'Compliance Deep-Dive',
  'Voluntary Carbon Mkt',
  'Regional Analysis',
  'Policy Impact Tracker',
  'Issuance & Retirement',
  'Price Forecast Engine',
  'Article 6 & ITMOs',
  'Market Microstructure',
  'Climate Finance Nexus',
];

const PALETTE = [T.indigo, T.green, T.teal, T.amber, T.purple, T.orange, T.blue, T.red, '#0f766e', '#b45309', '#7c3aed', '#0369a1'];

const card  = { background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const lbl   = { fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: 600 };
const kpiWrap = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 };

function KpiCard({ label, value, sub, color = T.navy }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Badge({ text, color }) {
  const bg = color + '22';
  return <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: bg, color }}>{text}</span>;
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function CarbonMarketIntelligencePage() {
  const [tab, setTab]                     = useState(0);
  const [marketFilter, setMarketFilter]   = useState('both');
  const [regionFilter, setRegionFilter]   = useState('All');
  const [scenario, setScenario]           = useState('NDC');
  const [caFilter, setCaFilter]           = useState('all');
  const [forecastModel, setForecastModel] = useState('all');
  const [carbonTax, setCarbonTax]         = useState(80);
  const [ndcAmbition, setNdcAmbition]     = useState(50);
  const [yearRange, setYearRange]         = useState(2024);
  const [exchFilter, setExchFilter]       = useState(['Xpansiv/CBL', 'ACX (AirCarbon)', 'CME Carbon', 'Toucan/Polygon', 'Climate Impact X', 'OTC Bilateral']);

  // ── Derived / memoised data ──────────────────────────────────────────────

  const totalComplianceCap = useMemo(() => COMPLIANCE_MARKETS.reduce((a, m) => a + m.volume, 0), []);
  const totalVCMIssuance   = useMemo(() => VCM_HISTORY.reduce((a, r) => a + r.issuance, 0), []);
  const totalRetirements   = useMemo(() => VCM_HISTORY.reduce((a, r) => a + r.retirements, 0), []);
  const art6Volume         = useMemo(() => BILATERAL_DEALS.reduce((a, d) => a + d.itmo_volume, 0), []);
  const avgCreditPrice     = useMemo(() => {
    const sum = VCM_HISTORY.reduce((a, r) => a + r.avgPrice, 0);
    return VCM_HISTORY.length ? (sum / VCM_HISTORY.length).toFixed(2) : '0.00';
  }, []);
  const retirementRate     = useMemo(() => {
    const tot = VCM_HISTORY.reduce((a, r) => a + r.issuance, 0);
    const ret = VCM_HISTORY.reduce((a, r) => a + r.retirements, 0);
    return tot > 0 ? ((ret / tot) * 100).toFixed(1) : '0.0';
  }, []);

  const compliancePriceHistory = useMemo(() => {
    return [
      { year:2018, euETS:16, california:15, china:2,  uk:null, korea:5 },
      { year:2019, euETS:25, california:17, china:3,  uk:null, korea:5 },
      { year:2020, euETS:32, california:18, china:4,  uk:null, korea:6 },
      { year:2021, euETS:53, california:24, china:6,  uk:null, korea:7 },
      { year:2022, euETS:80, california:28, china:8,  uk:50,   korea:8 },
      { year:2023, euETS:85, california:30, china:9,  uk:44,   korea:7 },
      { year:2024, euETS:65, california:32, china:9,  uk:42,   korea:8 },
    ];
  }, []);

  const vcmBuyerSegments = useMemo(() => [
    { name:'Corporates',    value:52 },
    { name:'Airlines',      value:14 },
    { name:'Finance',       value:18 },
    { name:'Governments',   value:8  },
    { name:'Retail/Other',  value:8  },
  ], []);

  const forecasts = useMemo(() => {
    const scenarioMult = { '1.5C':1.35, '2C':1.15, 'NDC':1.0, 'BAU':0.78 };
    const taxMult = 1 + (carbonTax - 80) / 800;
    const ndcMult = 1 + (ndcAmbition - 50) / 200;
    const sm = (scenarioMult[scenario] || 1) * taxMult * ndcMult;
    return [2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y, i) => {
      const base = 65;
      const mr = base + i * 4.2 * sm + (sr(i * 7) - 0.5) * 4;
      const tf = base + i * 7.8 * sm;
      const sc = base + i * 11 * sm - (y > 2027 ? (y - 2027) * 2.5 : 0);
      return { year: y, meanReversion: +mr.toFixed(1), trendFollowing: +tf.toFixed(1), scenarioConditional: +sc.toFixed(1), bull: +(sc * 1.2).toFixed(1), bear: +(mr * 0.78).toFixed(1) };
    });
  }, [scenario, carbonTax, ndcAmbition]);

  const filteredDeals = useMemo(() => {
    return BILATERAL_DEALS.filter(d => caFilter === 'all' || (caFilter === 'ca' ? d.ca_applied : !d.ca_applied));
  }, [caFilter]);

  const filteredExchanges = useMemo(() => {
    return EXCHANGES.filter(e => exchFilter.includes(e.name));
  }, [exchFilter]);

  const itmoPriceScatter = useMemo(() => {
    return BILATERAL_DEALS.map((d, i) => ({
      itmoPrice: d.price_usd,
      vcmPrice:  +(5 + sr(i * 13) * 12).toFixed(1),
      volume:    d.itmo_volume,
      country:   `${d.buyer}→${d.seller}`,
    }));
  }, []);

  const toggleExch = useCallback((name) => {
    setExchFilter(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);
  }, []);

  // ── Market overview stacked area 2015-2024 ───────────────────────────────
  const marketTrendData = useMemo(() => VCM_HISTORY.map(r => ({
    year: r.year,
    vcmIssuance:  r.issuance,
    vcmRetired:   r.retirements,
    compliance:   Math.round(600 + (r.year - 2015) * 22 + sr(r.year) * 30),
  })), []);

  // ── Allowance surplus bar ────────────────────────────────────────────────
  const surplusData = useMemo(() => COMPLIANCE_MARKETS.map(m => ({
    name: m.name.replace(' ETS', '').replace(' CaT', ''),
    surplus: m.surplus,
  })), []);

  // ── Methodology stacked bar ──────────────────────────────────────────────
  const methodData = useMemo(() => METHODOLOGY_ISSUANCE.map(m => ({
    method: m.method,
    '2019': m.y2019,
    '2020': m.y2020,
    '2021': m.y2021,
    '2022': m.y2022,
    '2023': m.y2023,
    '2024': m.y2024,
  })), []);

  // ── Demand forecast model ────────────────────────────────────────────────
  const demandForecast = useMemo(() => [
    { year:2024, supply:168,  demand:152,  gap:-16,  demandFcast:165 },
    { year:2025, supply:185,  demand:190,  gap:5,    demandFcast:210 },
    { year:2026, supply:200,  demand:240,  gap:40,   demandFcast:270 },
    { year:2027, supply:220,  demand:310,  gap:90,   demandFcast:350 },
    { year:2028, supply:240,  demand:400,  gap:160,  demandFcast:460 },
    { year:2029, supply:265,  demand:520,  gap:255,  demandFcast:600 },
    { year:2030, supply:290,  demand:680,  gap:390,  demandFcast:780 },
  ], []);

  // ── Daily trading pattern ────────────────────────────────────────────────
  const tradingPattern = useMemo(() => [
    { hour:'08:00', volume:0.8 }, { hour:'09:00', volume:2.4 }, { hour:'10:00', volume:4.2 },
    { hour:'11:00', volume:5.8 }, { hour:'12:00', volume:3.2 }, { hour:'13:00', volume:2.6 },
    { hour:'14:00', volume:4.8 }, { hour:'15:00', volume:6.4 }, { hour:'16:00', volume:5.2 },
    { hour:'17:00', volume:2.8 }, { hour:'18:00', volume:1.2 },
  ], []);

  // ── Carbon vs temp anomaly ───────────────────────────────────────────────
  const carbonTempData = useMemo(() => [
    { year:2015, carbonPrice:8,  tempAnomaly:0.87 },
    { year:2016, carbonPrice:6,  tempAnomaly:1.01 },
    { year:2017, carbonPrice:7,  tempAnomaly:0.92 },
    { year:2018, carbonPrice:16, tempAnomaly:0.83 },
    { year:2019, carbonPrice:25, tempAnomaly:0.98 },
    { year:2020, carbonPrice:32, tempAnomaly:1.02 },
    { year:2021, carbonPrice:53, tempAnomaly:0.85 },
    { year:2022, carbonPrice:80, tempAnomaly:0.89 },
    { year:2023, carbonPrice:85, tempAnomaly:1.17 },
    { year:2024, carbonPrice:65, tempAnomaly:1.24 },
  ], []);

  // ── ESG fund flows vs carbon price ──────────────────────────────────────
  const esgFlowData = useMemo(() => [
    { year:2018, esgFlows:260, carbonPrice:16 },
    { year:2019, esgFlows:290, carbonPrice:25 },
    { year:2020, esgFlows:360, carbonPrice:32 },
    { year:2021, esgFlows:540, carbonPrice:53 },
    { year:2022, esgFlows:490, carbonPrice:80 },
    { year:2023, esgFlows:520, carbonPrice:85 },
    { year:2024, esgFlows:580, carbonPrice:65 },
  ], []);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: T.font, background: T.surface, minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CN6 · CARBON MARKET INTELLIGENCE</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Carbon Market Intelligence & Analytics Hub</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              12 Compliance Markets · VCM 2015-2024 · 15 Policy Events · 20 Article 6 Deals · 6 Exchange Venues · 10 Analytical Tabs
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label:'VCM Issuance', val:`${totalVCMIssuance}Mt`, col:T.gold },
              { label:'Art.6 Vol.', val:`${art6Volume.toFixed(1)}Mt`, col:'#38bdf8' },
              { label:'Avg VCM Price', val:`$${avgCreditPrice}`, col:'#4ade80' },
            ].map(m => (
              <div key={m.label} style={{ background:'rgba(255,255,255,0.08)', borderRadius:8, padding:'10px 16px', textAlign:'right', minWidth:100 }}>
                <div style={{ color:'#94a3b8', fontSize:10, textTransform:'uppercase', letterSpacing:1 }}>{m.label}</div>
                <div style={{ color:m.col, fontSize:18, fontWeight:700, fontFamily:T.mono }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding:'10px 16px', border:'none', background:'transparent', cursor:'pointer', whiteSpace:'nowrap',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize:12,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      {/* ── Global controls strip ── */}
      <div style={{ background:'#f1f0eb', borderBottom:`1px solid ${T.border}`, padding:'10px 32px', display:'flex', gap:14, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:11, color:T.sub }}>Market Type:</span>
          {['both','compliance','voluntary'].map(v => (
            <button key={v} onClick={() => setMarketFilter(v)} style={{ padding:'4px 10px', borderRadius:16, border:`1px solid ${marketFilter===v ? T.navy : T.border}`, background: marketFilter===v ? T.navy : 'transparent', color: marketFilter===v ? '#fff' : T.sub, fontSize:11, cursor:'pointer' }}>
              {v.charAt(0).toUpperCase()+v.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:11, color:T.sub }}>Scenario:</span>
          {['1.5C','2C','NDC','BAU'].map(v => (
            <button key={v} onClick={() => setScenario(v)} style={{ padding:'4px 10px', borderRadius:16, border:`1px solid ${scenario===v ? T.indigo : T.border}`, background: scenario===v ? T.indigo : 'transparent', color: scenario===v ? '#fff' : T.sub, fontSize:11, cursor:'pointer' }}>{v}</button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:11, color:T.sub }}>Carbon Tax 2030:</span>
          <input type="range" min={10} max={200} value={carbonTax} onChange={e => setCarbonTax(+e.target.value)} style={{ width:90 }} />
          <span style={{ fontFamily:T.mono, fontSize:11, color:T.navy, minWidth:50 }}>${carbonTax}/t</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:11, color:T.sub }}>NDC Ambition:</span>
          <input type="range" min={0} max={100} value={ndcAmbition} onChange={e => setNdcAmbition(+e.target.value)} style={{ width:80 }} />
          <span style={{ fontFamily:T.mono, fontSize:11, color:T.navy, minWidth:30 }}>{ndcAmbition}%</span>
        </div>
      </div>

      <div style={{ padding:'24px 32px 48px' }}>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 0 — MARKET OVERVIEW
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === 0 && (
          <div>
            <div style={kpiWrap}>
              <KpiCard label="Total VCM Value" value="$1.8B" sub="2024 vintage; Xpansiv benchmark" color={T.green} />
              <KpiCard label="Compliance Market Cap" value="~$940B" sub="12 markets combined, USD-equiv." color={T.navy} />
              <KpiCard label="YoY Issuance Growth" value="+18.3%" sub="VCM 2023→2024 issuance change" color={T.indigo} />
              <KpiCard label="Retirement Rate" value={`${retirementRate}%`} sub="Cumulative retired / issued" color={T.teal} />
              <KpiCard label="Avg VCM Credit Price" value={`$${avgCreditPrice}`} sub="Blended 2015-2024 average" color={T.amber} />
              <KpiCard label="Article 6 Deal Volume" value={`${art6Volume.toFixed(1)} MtCO2`} sub="20 authorized bilateral deals" color={T.purple} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
              <div style={card}>
                <div style={lbl}>Compliance vs VCM Market Trend 2015-2024 (MtCO2 & $B)</div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={marketTrendData}>
                    <defs>
                      <linearGradient id="compG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={T.indigo} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={T.indigo} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="vcmG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={T.green} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={T.green} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="year" tick={{ fontSize:10 }}/>
                    <YAxis yAxisId="left"  tick={{ fontSize:10 }} label={{ value:'Mt / $B', angle:-90, position:'insideLeft', fontSize:9 }}/>
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10 }}/>
                    <Tooltip/>
                    <Legend wrapperStyle={{ fontSize:10 }}/>
                    <Area yAxisId="left" type="monotone" dataKey="compliance" name="Compliance ($B equiv)" stroke={T.indigo} fill="url(#compG)" strokeWidth={2}/>
                    <Area yAxisId="left" type="monotone" dataKey="vcmIssuance" name="VCM Issuance (Mt)" stroke={T.green} fill="url(#vcmG)" strokeWidth={2}/>
                    <Line yAxisId="right" type="monotone" dataKey="vcmRetired" name="VCM Retired (Mt)" stroke={T.amber} strokeWidth={2} dot={{ r:3 }}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={lbl}>Top 5 Markets by Volume Share</div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name:'EU ETS',    value:38 },
                        { name:'China ETS', value:28 },
                        { name:'California',value:10 },
                        { name:'UK ETS',    value:7 },
                        { name:'Others',    value:17 },
                      ]}
                      dataKey="value" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {[T.indigo, T.teal, T.amber, T.green, T.sub].map((c, i) => <Cell key={i} fill={c}/>)}
                    </Pie>
                    <Tooltip formatter={v => `${v}%`}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={card}>
              <div style={lbl}>Market Summary — 12 Compliance Markets</div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                  <thead>
                    <tr style={{ borderBottom:`2px solid ${T.border}`, background:'#f8f7f2' }}>
                      {['Market','Region','Price','Volume (Mt)','Coverage %','Cap (Mt)','Surplus/Deficit','Linked To','2030 Cap'].map(h => (
                        <th key={h} style={{ textAlign:'left', padding:'8px 8px', color:T.sub, fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPLIANCE_MARKETS.map((m, i) => (
                      <tr key={m.name} style={{ borderBottom:`1px solid ${T.border}`, background: i%2===0 ? '#fafaf7' : '#fff' }}>
                        <td style={{ padding:'8px 8px', fontWeight:600 }}>{m.name}</td>
                        <td style={{ padding:'8px 8px', color:T.sub }}>{m.region}</td>
                        <td style={{ padding:'8px 8px', fontFamily:T.mono }}>{m.unit} {m.price}</td>
                        <td style={{ padding:'8px 8px', fontFamily:T.mono }}>{m.volume.toLocaleString()}</td>
                        <td style={{ padding:'8px 8px' }}>{m.coverage}%</td>
                        <td style={{ padding:'8px 8px', fontFamily:T.mono }}>{m.cap.toLocaleString()}</td>
                        <td style={{ padding:'8px 8px', fontFamily:T.mono, color: m.surplus < 0 ? T.green : T.red }}>
                          {m.surplus > 0 ? '+' : ''}{m.surplus}
                        </td>
                        <td style={{ padding:'8px 8px', color:T.sub, fontSize:10 }}>{m.linked}</td>
                        <td style={{ padding:'8px 8px', fontFamily:T.mono }}>{m.yr2030cap}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1 — COMPLIANCE DEEP-DIVE
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === 1 && (
          <div>
            <div style={card}>
              <div style={lbl}>Compliance Market Price History — 5 Systems (USD/tCO2 equiv.)</div>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={compliancePriceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="year" tick={{ fontSize:10 }}/>
                  <YAxis yAxisId="left" tick={{ fontSize:10 }}/>
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10 }}/>
                  <Tooltip/>
                  <Legend wrapperStyle={{ fontSize:10 }}/>
                  <Line yAxisId="left"  type="monotone" dataKey="euETS"      stroke={T.indigo} strokeWidth={2} name="EU ETS (EUR)" dot={{ r:3 }}/>
                  <Line yAxisId="left"  type="monotone" dataKey="california"  stroke={T.amber}  strokeWidth={2} name="California (USD)" dot={{ r:3 }}/>
                  <Line yAxisId="left"  type="monotone" dataKey="uk"          stroke={T.green}  strokeWidth={2} name="UK ETS (GBP)" dot={{ r:3 }} strokeDasharray="5 3"/>
                  <Bar  yAxisId="right" dataKey="china"  name="China (CNY)" fill={T.teal} opacity={0.6} barSize={18}/>
                  <Line yAxisId="right" type="monotone" dataKey="korea"       stroke={T.purple} strokeWidth={1.5} name="Korea (USD)" dot={{ r:3 }} strokeDasharray="3 2"/>
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={card}>
                <div style={lbl}>Allowance Surplus / Deficit by Market (Mt)</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={surplusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis type="number" tick={{ fontSize:10 }}/>
                    <YAxis type="category" dataKey="name" width={88} tick={{ fontSize:9 }}/>
                    <Tooltip formatter={v => `${v} Mt`}/>
                    <ReferenceLine x={0} stroke={T.sub} strokeWidth={1.5}/>
                    <Bar dataKey="surplus" name="Surplus(+)/Deficit(-)" radius={[0,4,4,0]}>
                      {surplusData.map((d, i) => <Cell key={i} fill={d.surplus < 0 ? T.green : T.red}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={lbl}>Market Coverage & Cap Trajectory</div>
                <div style={{ overflowY:'auto', maxHeight:280 }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                    <thead>
                      <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                        {['Market','Coverage','Cap 2024','Cap 2030','Mechanism'].map(h => (
                          <th key={h} style={{ textAlign:'left', padding:'6px 8px', color:T.sub }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {COMPLIANCE_MARKETS.map((m, i) => (
                        <tr key={m.name} style={{ borderBottom:`1px solid ${T.border}` }}>
                          <td style={{ padding:'6px 8px', fontWeight:600, fontSize:10 }}>{m.name}</td>
                          <td style={{ padding:'6px 8px' }}>{m.coverage}%</td>
                          <td style={{ padding:'6px 8px', fontFamily:T.mono }}>{m.cap}</td>
                          <td style={{ padding:'6px 8px', fontFamily:T.mono, color: m.yr2030cap < m.cap ? T.green : T.sub }}>
                            {m.yr2030cap}
                          </td>
                          <td style={{ padding:'6px 8px', fontSize:10, color:T.sub }}>{m.mechanism}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div style={card}>
              <div style={lbl}>2024 Compliance Volume Distribution by Market (Mt)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={COMPLIANCE_MARKETS.map(m => ({ name: m.name.replace(' ETS','').replace(' CaT',''), volume: m.volume }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="name" tick={{ fontSize:9 }} angle={-15} textAnchor="end" height={48}/>
                  <YAxis tick={{ fontSize:10 }}/>
                  <Tooltip formatter={v => `${v.toLocaleString()} Mt`}/>
                  <Bar dataKey="volume" name="Volume (Mt)" radius={[4,4,0,0]}>
                    {COMPLIANCE_MARKETS.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2 — VOLUNTARY CARBON MARKET
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === 2 && (
          <div>
            <div style={kpiWrap}>
              <KpiCard label="Total VCM Issuance" value={`${totalVCMIssuance} Mt`} sub="2015-2024 cumulative" color={T.green}/>
              <KpiCard label="Total Retirements" value={`${totalRetirements} Mt`} sub="Demand-driven retirements" color={T.indigo}/>
              <KpiCard label="2024 Retirement Rate" value="90.5%" sub="Mt retired / Mt issued" color={T.amber}/>
            </div>

            <div style={card}>
              <div style={lbl}>VCM Issuance & Retirement by Sector 2015-2024 (Mt)</div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={VCM_HISTORY}>
                  <defs>
                    {['forestry','energy','industry','waste','agriculture'].map((k, i) => (
                      <linearGradient key={k} id={`g${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={PALETTE[i]} stopOpacity={0.5}/>
                        <stop offset="95%" stopColor={PALETTE[i]} stopOpacity={0.05}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="year" tick={{ fontSize:10 }}/>
                  <YAxis tick={{ fontSize:10 }}/>
                  <Tooltip/>
                  <Legend wrapperStyle={{ fontSize:10 }}/>
                  {['forestry','energy','industry','waste','agriculture'].map((k, i) => (
                    <Area key={k} type="monotone" dataKey={k} name={k.charAt(0).toUpperCase()+k.slice(1)} stroke={PALETTE[i]} fill={`url(#g${k})`} stackId="1"/>
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={card}>
                <div style={lbl}>Buyer Segment Mix 2024</div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={vcmBuyerSegments} dataKey="value" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {vcmBuyerSegments.map((_, i) => <Cell key={i} fill={PALETTE[i]}/>)}
                    </Pie>
                    <Tooltip formatter={v => `${v}%`}/>
                    <Legend wrapperStyle={{ fontSize:10 }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={lbl}>VCM vs Compliance Price Ratio</div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={VCM_HISTORY.map(r => ({
                    year: r.year,
                    vcm: r.avgPrice,
                    ratio: +(r.avgPrice / (16 + (r.year - 2015) * 7)).toFixed(3),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="year" tick={{ fontSize:10 }}/>
                    <YAxis yAxisId="l" tick={{ fontSize:10 }}/>
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize:10 }}/>
                    <Tooltip/>
                    <Legend wrapperStyle={{ fontSize:10 }}/>
                    <Line yAxisId="l" type="monotone" dataKey="vcm"   stroke={T.green}  strokeWidth={2} name="VCM Avg Price ($)" dot={{ r:3 }}/>
                    <Line yAxisId="r" type="monotone" dataKey="ratio" stroke={T.amber}  strokeWidth={2} name="VCM/Compliance Ratio" dot={{ r:3 }} strokeDasharray="4 2"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={card}>
              <div style={lbl}>VCM Annual Data Table</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                <thead>
                  <tr style={{ borderBottom:`2px solid ${T.border}`, background:'#f8f7f2' }}>
                    {['Year','Issuance (Mt)','Retirements (Mt)','Cancellations (Mt)','Avg Price ($)','Retire Ratio','Forestry','Energy','Industry','Waste','Agriculture'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'7px 6px', color:T.sub, fontWeight:600, whiteSpace:'nowrap', fontSize:10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {VCM_HISTORY.map((r, i) => (
                    <tr key={r.year} style={{ borderBottom:`1px solid ${T.border}`, background: i%2===0 ? '#fafaf7' : '#fff' }}>
                      <td style={{ padding:'6px 6px', fontWeight:700, fontFamily:T.mono }}>{r.year}</td>
                      <td style={{ padding:'6px 6px', fontFamily:T.mono }}>{r.issuance}</td>
                      <td style={{ padding:'6px 6px', fontFamily:T.mono, color:T.green }}>{r.retirements}</td>
                      <td style={{ padding:'6px 6px', fontFamily:T.mono, color:T.sub }}>{r.cancellations}</td>
                      <td style={{ padding:'6px 6px', fontFamily:T.mono }}>${r.avgPrice}</td>
                      <td style={{ padding:'6px 6px', fontFamily:T.mono }}>
                        <span style={{ color: r.retirements/r.issuance > 0.85 ? T.green : T.amber }}>
                          {(r.retirements/r.issuance*100).toFixed(0)}%
                        </span>
                      </td>
                      <td style={{ padding:'6px 6px' }}>{r.forestry}</td>
                      <td style={{ padding:'6px 6px' }}>{r.energy}</td>
                      <td style={{ padding:'6px 6px' }}>{r.industry}</td>
                      <td style={{ padding:'6px 6px' }}>{r.waste}</td>
                      <td style={{ padding:'6px 6px' }}>{r.agriculture}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3 — REGIONAL MARKET ANALYSIS
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === 3 && (
          <div>
            <div style={card}>
              <div style={lbl}>Regional Readiness Radar — Policy / MRV / Finance / Registry / Demand</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10 }}>
                {REGIONAL_MARKETS.slice(0, 5).map(r => (
                  <div key={r.region} style={{ border:`1px solid ${T.border}`, borderRadius:8, padding:10, background:T.card }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.navy, marginBottom:6 }}>{r.region}</div>
                    <ResponsiveContainer width="100%" height={130}>
                      <RadarChart data={[
                        { axis:'Policy', value:r.policy_score },
                        { axis:'MRV',    value:r.mrv_score },
                        { axis:'Finance',value:r.finance_score },
                        { axis:'Registry',value:r.registry_score },
                        { axis:'Demand', value:r.demand_score },
                      ]}>
                        <PolarGrid/>
                        <PolarAngleAxis dataKey="axis" tick={{ fontSize:8 }}/>
                        <PolarRadiusAxis domain={[0,100]} tick={false}/>
                        <Radar dataKey="value" stroke={T.indigo} fill={T.indigo} fillOpacity={0.25}/>
                      </RadarChart>
                    </ResponsiveContainer>
                    <div style={{ fontSize:9, color:T.sub, textAlign:'center' }}>Pipeline: {r.pipeline_mtco2} Mt</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10, marginTop:10 }}>
                {REGIONAL_MARKETS.slice(5).map(r => (
                  <div key={r.region} style={{ border:`1px solid ${T.border}`, borderRadius:8, padding:10, background:T.card }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.navy, marginBottom:6 }}>{r.region}</div>
                    <ResponsiveContainer width="100%" height={130}>
                      <RadarChart data={[
                        { axis:'Policy', value:r.policy_score },
                        { axis:'MRV',    value:r.mrv_score },
                        { axis:'Finance',value:r.finance_score },
                        { axis:'Registry',value:r.registry_score },
                        { axis:'Demand', value:r.demand_score },
                      ]}>
                        <PolarGrid/>
                        <PolarAngleAxis dataKey="axis" tick={{ fontSize:8 }}/>
                        <PolarRadiusAxis domain={[0,100]} tick={false}/>
                        <Radar dataKey="value" stroke={T.teal} fill={T.teal} fillOpacity={0.25}/>
                      </RadarChart>
                    </ResponsiveContainer>
                    <div style={{ fontSize:9, color:T.sub, textAlign:'center' }}>Pipeline: {r.pipeline_mtco2} Mt</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              <div style={lbl}>Regional VCM Pipeline by Score Band (MtCO2)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={REGIONAL_MARKETS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="region" tick={{ fontSize:9 }} angle={-20} textAnchor="end" height={50}/>
                  <YAxis tick={{ fontSize:10 }}/>
                  <Tooltip formatter={v => `${v} Mt`}/>
                  <Bar dataKey="pipeline_mtco2" name="VCM Pipeline (Mt)" radius={[4,4,0,0]}>
                    {REGIONAL_MARKETS.map((r, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={card}>
              <div style={lbl}>Regional Market Detail Table</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                <thead>
                  <tr style={{ borderBottom:`2px solid ${T.border}`, background:'#f8f7f2' }}>
                    {['Region','Pipeline (Mt)','Policy Score','MRV Score','Finance Score','Registry','Demand','Compliance Link','VCM Link'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'7px 8px', color:T.sub, fontSize:10, fontWeight:600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REGIONAL_MARKETS.map((r, i) => (
                    <tr key={r.region} style={{ borderBottom:`1px solid ${T.border}`, background: i%2===0 ? '#fafaf7' : '#fff' }}>
                      <td style={{ padding:'7px 8px', fontWeight:600 }}>{r.region}</td>
                      <td style={{ padding:'7px 8px', fontFamily:T.mono }}>{r.pipeline_mtco2}</td>
                      <td style={{ padding:'7px 8px', fontFamily:T.mono, color: r.policy_score>75 ? T.green : r.policy_score>55 ? T.amber : T.red }}>{r.policy_score}</td>
                      <td style={{ padding:'7px 8px', fontFamily:T.mono }}>{r.mrv_score}</td>
                      <td style={{ padding:'7px 8px', fontFamily:T.mono }}>{r.finance_score}</td>
                      <td style={{ padding:'7px 8px', fontFamily:T.mono }}>{r.registry_score}</td>
                      <td style={{ padding:'7px 8px', fontFamily:T.mono }}>{r.demand_score}</td>
                      <td style={{ padding:'7px 8px' }}><Badge text={r.compliance_link} color={r.compliance_link==='Yes' ? T.green : r.compliance_link==='Partial' ? T.amber : T.sub}/></td>
                      <td style={{ padding:'7px 8px', color:T.sub, fontSize:10 }}>{r.vcm_link}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 4 — POLICY IMPACT TRACKER
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === 4 && (
          <div>
            <div style={card}>
              <div style={lbl}>Price Impact by Policy Event (% change)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={POLICY_EVENTS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="event" tick={{ fontSize:8 }} angle={-22} textAnchor="end" height={70}/>
                  <YAxis tick={{ fontSize:10 }} tickFormatter={v => `${v>0?'+':''}${v}%`}/>
                  <Tooltip formatter={v => `${v>0?'+':''}${v}%`}/>
                  <ReferenceLine y={0} stroke={T.sub}/>
                  <Bar dataKey="price_impact_pct" name="Price Impact (%)" radius={[4,4,0,0]}>
                    {POLICY_EVENTS.map((e, i) => <Cell key={i} fill={e.price_impact_pct > 0 ? T.green : T.red}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={card}>
              <div style={lbl}>Policy Event Timeline — 15 Events</div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                  <thead>
                    <tr style={{ borderBottom:`2px solid ${T.border}`, background:'#f8f7f2' }}>
                      {['Date','Event','Region','Type','Price Impact','Description'].map(h => (
                        <th key={h} style={{ textAlign:'left', padding:'8px 8px', color:T.sub, fontWeight:600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {POLICY_EVENTS.map((e, i) => (
                      <tr key={e.event} style={{ borderBottom:`1px solid ${T.border}`, background: i%2===0 ? '#fafaf7' : '#fff' }}>
                        <td style={{ padding:'7px 8px', fontFamily:T.mono, fontSize:10 }}>{e.date}</td>
                        <td style={{ padding:'7px 8px', fontWeight:600 }}>{e.event}</td>
                        <td style={{ padding:'7px 8px', color:T.sub }}>{e.region}</td>
                        <td style={{ padding:'7px 8px' }}>
                          <Badge text={e.type} color={
                            e.type==='Regulatory' ? T.red :
                            e.type==='Standard'   ? T.indigo :
                            e.type==='Expansion'  ? T.green  :
                            e.type==='Registry'   ? T.amber  : T.teal
                          }/>
                        </td>
                        <td style={{ padding:'7px 8px', fontFamily:T.mono, color: e.price_impact_pct>0 ? T.green : T.red, fontWeight:700 }}>
                          {e.price_impact_pct>0 ? '+' : ''}{e.price_impact_pct}%
                        </td>
                        <td style={{ padding:'7px 8px', color:T.sub, fontSize:10, maxWidth:280 }}>{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={card}>
              <div style={lbl}>Policy Risk Scenario Matrix</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>
                {[
                  { title:'1.5°C Aligned', color:T.green, events:'CBAM, China expansion, Art.6.4, SBTi', priceImpact:'+45-80%', probability:'25%' },
                  { title:'2°C NDC Track', color:T.amber, events:'CBAM, partial CORSIA, ICVCM CCPs', priceImpact:'+20-35%', probability:'40%' },
                  { title:'Policy Delay', color:T.orange, events:'CORSIA limited, Art.6 stalled, VCS revision', priceImpact:'-5 to +10%', probability:'25%' },
                  { title:'Fragmentation', color:T.red, events:'No Art.6 agreement, bilateral only, registry divergence', priceImpact:'-15 to 0%', probability:'10%' },
                ].map(s => (
                  <div key={s.title} style={{ border:`1px solid ${T.border}`, borderRadius:8, padding:14, borderTop:`3px solid ${s.color}` }}>
                    <div style={{ fontWeight:700, color:s.color, marginBottom:6 }}>{s.title}</div>
                    <div style={{ fontSize:10, color:T.sub, marginBottom:4 }}>Key triggers: {s.events}</div>
                    <div style={{ fontSize:12, fontFamily:T.mono, color:T.text, fontWeight:600 }}>{s.priceImpact} VCM price</div>
                    <div style={{ fontSize:10, color:T.sub, marginTop:4 }}>Probability: {s.probability}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 5 — ISSUANCE & RETIREMENT ANALYTICS
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === 5 && (
          <div>
            <div style={card}>
              <div style={lbl}>Issuance by Methodology 2019-2024 (Stacked, Mt)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={methodData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis type="number" tick={{ fontSize:10 }}/>
                  <YAxis type="category" dataKey="method" width={110} tick={{ fontSize:9 }}/>
                  <Tooltip/>
                  <Legend wrapperStyle={{ fontSize:9 }}/>
                  {['2019','2020','2021','2022','2023','2024'].map((y, i) => (
                    <Bar key={y} dataKey={y} stackId="a" fill={PALETTE[i]} name={y}/>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={card}>
                <div style={lbl}>Retirement Demand by Sector 2024 (Mt)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={[
                      { name:'Tech & Software',   value:28 },
                      { name:'Energy & Utilities', value:24 },
                      { name:'Aviation',           value:22 },
                      { name:'Finance',            value:18 },
                      { name:'Consumer Brands',    value:14 },
                      { name:'Manufacturing',      value:12 },
                      { name:'Govt/Public',        value:8  },
                      { name:'Other',              value:26 },
                    ]} dataKey="value" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {PALETTE.map((c, i) => <Cell key={i} fill={c}/>)}
                    </Pie>
                    <Tooltip formatter={v => `${v} Mt`}/>
                    <Legend wrapperStyle={{ fontSize:9 }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={lbl}>Supply Gap Model & Demand Forecast 2024-2030 (Mt)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={demandForecast}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="year" tick={{ fontSize:10 }}/>
                    <YAxis tick={{ fontSize:10 }}/>
                    <Tooltip/>
                    <Legend wrapperStyle={{ fontSize:9 }}/>
                    <Area type="monotone" dataKey="demandFcast" name="Demand Forecast (Mt)" stroke={T.red} fill={T.red} fillOpacity={0.12} strokeWidth={2}/>
                    <Bar dataKey="supply" name="Supply (Mt)" fill={T.green} opacity={0.8} barSize={18}/>
                    <Line type="monotone" dataKey="demand" name="Actual Demand (Mt)" stroke={T.amber} strokeWidth={2} dot={{ r:3 }}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={card}>
              <div style={lbl}>Vintage Age at Retirement & Cancellation Rate by Registry</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div>
                  <div style={{ fontSize:11, color:T.sub, marginBottom:8, fontWeight:600 }}>Vintage Age at Retirement (Years)</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={[
                      { age:'<1yr', count:18 }, { age:'1-2yr', count:34 }, { age:'2-3yr', count:28 },
                      { age:'3-4yr', count:12 }, { age:'4-5yr', count:5 }, { age:'>5yr', count:3 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                      <XAxis dataKey="age" tick={{ fontSize:9 }}/>
                      <YAxis tick={{ fontSize:9 }}/>
                      <Tooltip formatter={v => `${v}%`}/>
                      <Bar dataKey="count" name="% of retirements" fill={T.indigo} radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={{ fontSize:11, color:T.sub, marginBottom:8, fontWeight:600 }}>Cancellation Rate by Registry (%)</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={[
                      { registry:'Verra VCS',    rate:12 },
                      { registry:'Gold Standard', rate:6  },
                      { registry:'ACR',           rate:8  },
                      { registry:'CAR',           rate:9  },
                      { registry:'Plan Vivo',     rate:4  },
                      { registry:'ART TREES',     rate:5  },
                    ]} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                      <XAxis type="number" tick={{ fontSize:9 }}/>
                      <YAxis type="category" dataKey="registry" width={90} tick={{ fontSize:9 }}/>
                      <Tooltip formatter={v => `${v}%`}/>
                      <Bar dataKey="rate" name="Cancellation Rate (%)" fill={T.amber} radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 6 — PRICE FORECAST ENGINE
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === 6 && (
          <div>
            <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:11, color:T.sub }}>Model:</span>
              {['all','meanReversion','trendFollowing','scenarioConditional'].map(m => (
                <button key={m} onClick={() => setForecastModel(m)} style={{
                  padding:'5px 13px', borderRadius:18, border:`2px solid ${forecastModel===m ? T.gold : T.border}`,
                  background: forecastModel===m ? T.gold + '22' : 'transparent', cursor:'pointer', fontSize:11
                }}>{m==='all' ? 'All Models' : m.replace(/([A-Z])/g,' $1').trim()}</button>
              ))}
            </div>

            <div style={card}>
              <div style={lbl}>EU ETS Price Forecast 2024-2030 — {scenario} Scenario, Tax $${carbonTax}/t (EUR/tCO2)</div>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={forecasts}>
                  <defs>
                    <linearGradient id="bullBear" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={T.indigo} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={T.indigo} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="year" tick={{ fontSize:10 }}/>
                  <YAxis tick={{ fontSize:10 }} tickFormatter={v => `€${v}`}/>
                  <Tooltip formatter={(v, n) => [`€${v}`, n]}/>
                  <Legend wrapperStyle={{ fontSize:10 }}/>
                  <Area type="monotone" dataKey="bull" name="Bull Case" stroke="transparent" fill={T.green} fillOpacity={0.12}/>
                  <Area type="monotone" dataKey="bear" name="Bear Case" stroke="transparent" fill={T.red}   fillOpacity={0.12}/>
                  {(forecastModel==='all'||forecastModel==='meanReversion')    && <Line type="monotone" dataKey="meanReversion"    stroke={T.indigo} strokeWidth={2} name="Mean Reversion" dot={{ r:3 }}/>}
                  {(forecastModel==='all'||forecastModel==='trendFollowing')   && <Line type="monotone" dataKey="trendFollowing"   stroke={T.green}  strokeWidth={2} name="Trend Following" dot={{ r:3 }}/>}
                  {(forecastModel==='all'||forecastModel==='scenarioConditional') && <Line type="monotone" dataKey="scenarioConditional" stroke={T.purple} strokeWidth={2} name="Scenario Conditional" dot={{ r:3 }}/>}
                  <ReferenceLine y={65} stroke={T.sub} strokeDasharray="4 2" label={{ value:'Current €65', fontSize:9, fill:T.sub }}/>
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={card}>
                <div style={lbl}>Model Comparison — 2030 Forecast (EUR)</div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                  <thead>
                    <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                      {['Model','Bear','Base','Bull','Methodology'].map(h => (
                        <th key={h} style={{ textAlign:'left', padding:'7px 6px', color:T.sub, fontWeight:600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { model:'Mean Reversion', bear: forecasts.at(-1)?.bear ?? 0, base: forecasts.at(-1)?.meanReversion ?? 0, bull: forecasts.at(-1)?.bull ?? 0, method:'O-U process, θ=0.42, μ=90' },
                      { model:'Trend Following', bear: ((forecasts.at(-1)?.trendFollowing??0)*0.78).toFixed(1), base: forecasts.at(-1)?.trendFollowing ?? 0, bull: ((forecasts.at(-1)?.trendFollowing??0)*1.2).toFixed(1), method:'Momentum + breakout detection' },
                      { model:'Scenario Cond.', bear: ((forecasts.at(-1)?.scenarioConditional??0)*0.78).toFixed(1), base: forecasts.at(-1)?.scenarioConditional ?? 0, bull: ((forecasts.at(-1)?.scenarioConditional??0)*1.2).toFixed(1), method:'NGFS-weighted policy paths' },
                    ].map(r => (
                      <tr key={r.model} style={{ borderBottom:`1px solid ${T.border}` }}>
                        <td style={{ padding:'7px 6px', fontWeight:600 }}>{r.model}</td>
                        <td style={{ padding:'7px 6px', fontFamily:T.mono, color:T.red }}>€{r.bear}</td>
                        <td style={{ padding:'7px 6px', fontFamily:T.mono, fontWeight:700 }}>€{r.base}</td>
                        <td style={{ padding:'7px 6px', fontFamily:T.mono, color:T.green }}>€{r.bull}</td>
                        <td style={{ padding:'7px 6px', color:T.sub, fontSize:10 }}>{r.method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={card}>
                <div style={lbl}>Scenario Description</div>
                {[
                  { sc:'1.5C', desc:'Full CBAM + China ETS sector expansion + Art.6.4 launch + SBTi net-zero adoption by 2000 companies. Carbon price approaches social cost of carbon $220/tCO2 by 2035.', col:T.green },
                  { sc:'2C',   desc:'Moderate CBAM, partial Art.6.4 adoption, CORSIA Phase 2, gradual NDC enhancement. Markets price in 45% abatement trajectory.', col:T.amber },
                  { sc:'NDC',  desc:'Current NDCs unchanged. CBAM limited to 4 sectors. Art.6.4 delayed to 2026. VCM reforms incomplete. Baseline trajectory.', col:T.indigo },
                  { sc:'BAU',  desc:'Policy reversal in key jurisdictions. Carbon price collapses in near-term below production cost. Market structural breakdown scenario.', col:T.red },
                ].map(s => (
                  <div key={s.sc} style={{ padding:'8px 0', borderBottom:`1px solid ${T.border}`, display:'flex', gap:10, alignItems:'flex-start' }}>
                    <Badge text={s.sc} color={s.col}/>
                    <div style={{ fontSize:11, color:T.sub, lineHeight:1.5 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 7 — ARTICLE 6 & ITMO INTELLIGENCE
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === 7 && (
          <div>
            <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center' }}>
              <span style={{ fontSize:11, color:T.sub }}>Corresponding Adjustment:</span>
              {['all','ca','no-ca'].map(v => (
                <button key={v} onClick={() => setCaFilter(v)} style={{
                  padding:'5px 12px', borderRadius:16, border:`1px solid ${caFilter===v ? T.indigo : T.border}`,
                  background: caFilter===v ? T.indigo : 'transparent', color: caFilter===v ? '#fff' : T.sub, fontSize:11, cursor:'pointer'
                }}>{v==='all' ? 'All Deals' : v==='ca' ? 'CA Applied' : 'No CA'}</button>
              ))}
              <span style={{ marginLeft:'auto', fontFamily:T.mono, fontSize:11, color:T.sub }}>
                {filteredDeals.length} deals · {filteredDeals.reduce((a,d)=>a+d.itmo_volume,0).toFixed(2)} MtCO2
              </span>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <div style={card}>
                <div style={lbl}>Art.6.2 vs Art.6.4 Mechanism Comparison</div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                  <thead>
                    <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                      {['Criterion','Article 6.2','Article 6.4'].map(h => (
                        <th key={h} style={{ textAlign:'left', padding:'7px 8px', color:T.sub }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { crit:'Structure', a62:'Bilateral Gov-Gov', a64:'UN Supervisory Body' },
                      { crit:'Unit Name', a62:'ITMO', a64:'A6.4ER' },
                      { crit:'Registry', a62:'National registry', a64:'UN Article 6.4 Registry' },
                      { crit:'Methodology', a62:'Country-defined', a64:'UNFCCC-approved baseline' },
                      { crit:'CA Required', a62:'Yes (mandatory)', a64:'Yes (mandatory)' },
                      { crit:'MRV', a62:'Bilateral agreement', a64:'Standardised UNFCCC MRV' },
                      { crit:'Status', a62:'Operational 2022+', a64:'Rulebook final Q1 2025' },
                      { crit:'Price Range', a62:'$10-$30/tCO2', a64:'Est. $18-$40/tCO2' },
                    ].map(r => (
                      <tr key={r.crit} style={{ borderBottom:`1px solid ${T.border}` }}>
                        <td style={{ padding:'6px 8px', fontWeight:600, color:T.text }}>{r.crit}</td>
                        <td style={{ padding:'6px 8px', color:T.sub }}>{r.a62}</td>
                        <td style={{ padding:'6px 8px', color:T.sub }}>{r.a64}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={card}>
                <div style={lbl}>ITMO Price vs VCM Price Scatter</div>
                <ResponsiveContainer width="100%" height={240}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="vcmPrice" name="VCM Price" unit="$" tick={{ fontSize:10 }} label={{ value:'VCM Price ($/t)', position:'insideBottom', offset:-5, fontSize:9 }}/>
                    <YAxis dataKey="itmoPrice" name="ITMO Price" unit="$" tick={{ fontSize:10 }} label={{ value:'ITMO Price ($/t)', angle:-90, position:'insideLeft', fontSize:9 }}/>
                    <Tooltip cursor={{ strokeDasharray:'3 3' }} content={({ payload }) => {
                      if (!payload?.length) return null;
                      const d = payload[0].payload;
                      return <div style={{ background:'#fff', border:`1px solid ${T.border}`, padding:8, fontSize:10, borderRadius:6 }}>
                        <div style={{ fontWeight:700 }}>{d.country}</div>
                        <div>ITMO: ${d.itmoPrice} | VCM: ${d.vcmPrice}</div>
                        <div>Volume: {d.volume} Mt</div>
                      </div>;
                    }}/>
                    <Scatter data={itmoPriceScatter} fill={T.indigo} opacity={0.75}/>
                    <ReferenceLine stroke={T.amber} strokeDasharray="4 3" segment={[{ x:0, y:0 }, { x:35, y:35 }]}/>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={card}>
              <div style={lbl}>Bilateral Article 6 Deal Tracker — {filteredDeals.length} Deals</div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                  <thead>
                    <tr style={{ borderBottom:`2px solid ${T.border}`, background:'#f8f7f2' }}>
                      {['Buyer','Seller','Sector','ITMO Vol (Mt)','Price ($/t)','CA Applied','Status','Year'].map(h => (
                        <th key={h} style={{ textAlign:'left', padding:'7px 8px', color:T.sub, fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeals.map((d, i) => (
                      <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background: i%2===0 ? '#fafaf7' : '#fff' }}>
                        <td style={{ padding:'7px 8px', fontWeight:600 }}>{d.buyer}</td>
                        <td style={{ padding:'7px 8px' }}>{d.seller}</td>
                        <td style={{ padding:'7px 8px', color:T.sub, fontSize:10 }}>{d.sector}</td>
                        <td style={{ padding:'7px 8px', fontFamily:T.mono }}>{d.itmo_volume.toFixed(2)}</td>
                        <td style={{ padding:'7px 8px', fontFamily:T.mono }}>${d.price_usd}</td>
                        <td style={{ padding:'7px 8px' }}><Badge text={d.ca_applied ? 'Yes' : 'No'} color={d.ca_applied ? T.green : T.amber}/></td>
                        <td style={{ padding:'7px 8px' }}>
                          <Badge text={d.status} color={
                            d.status==='Authorized' ? T.green :
                            d.status==='Under Review' ? T.amber :
                            d.status==='LOI Signed' ? T.indigo : T.sub
                          }/>
                        </td>
                        <td style={{ padding:'7px 8px', fontFamily:T.mono }}>{d.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 8 — MARKET MICROSTRUCTURE
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === 8 && (
          <div>
            <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:11, color:T.sub }}>Exchanges:</span>
              {EXCHANGES.map(e => (
                <button key={e.name} onClick={() => toggleExch(e.name)} style={{
                  padding:'4px 10px', borderRadius:14, fontSize:10, cursor:'pointer',
                  border:`1px solid ${exchFilter.includes(e.name) ? T.navy : T.border}`,
                  background: exchFilter.includes(e.name) ? T.navy : 'transparent',
                  color: exchFilter.includes(e.name) ? '#fff' : T.sub,
                }}>{e.name}</button>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={card}>
                <div style={lbl}>Exchange Volume Share 2024</div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={filteredExchanges.map(e => ({ name:e.name, value:e.market_share }))} dataKey="value" cx="50%" cy="50%" outerRadius={95} label={({ name, percent }) => `${name.split('/')[0]} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {filteredExchanges.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]}/>)}
                    </Pie>
                    <Tooltip formatter={v => `${v}%`}/>
                    <Legend wrapperStyle={{ fontSize:9 }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={lbl}>Daily Trading Pattern — Intraday Volume (Mt equiv.)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={tradingPattern}>
                    <defs>
                      <linearGradient id="tradG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={T.teal} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={T.teal} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="hour" tick={{ fontSize:10 }}/>
                    <YAxis tick={{ fontSize:10 }}/>
                    <Tooltip/>
                    <Area type="monotone" dataKey="volume" stroke={T.teal} fill="url(#tradG)" strokeWidth={2} name="Volume (Mt equiv.)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={card}>
              <div style={lbl}>Exchange Venue Analysis</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                <thead>
                  <tr style={{ borderBottom:`2px solid ${T.border}`, background:'#f8f7f2' }}>
                    {['Exchange','Daily Vol (Mt)','Market Share %','Avg Bid-Ask Spread ($)','OTC %','Methodology Focus','Founded'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'7px 8px', color:T.sub, fontWeight:600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EXCHANGES.map((e, i) => (
                    <tr key={e.name} style={{ borderBottom:`1px solid ${T.border}`, background: i%2===0 ? '#fafaf7' : '#fff' }}>
                      <td style={{ padding:'7px 8px', fontWeight:600 }}>{e.name}</td>
                      <td style={{ padding:'7px 8px', fontFamily:T.mono }}>{e.daily_volume}</td>
                      <td style={{ padding:'7px 8px', fontFamily:T.mono }}>{e.market_share}%</td>
                      <td style={{ padding:'7px 8px', fontFamily:T.mono, color: e.avg_spread < 0.10 ? T.green : T.amber }}>${e.avg_spread}</td>
                      <td style={{ padding:'7px 8px', fontFamily:T.mono }}>{e.otc_pct}%</td>
                      <td style={{ padding:'7px 8px', color:T.sub, fontSize:10 }}>{e.methodology_focus}</td>
                      <td style={{ padding:'7px 8px', fontFamily:T.mono }}>{e.founded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={card}>
                <div style={lbl}>Bid-Ask Spread Comparison by Venue ($)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={filteredExchanges.map(e => ({ name: e.name.split('/')[0], spread: e.avg_spread }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="name" tick={{ fontSize:9 }}/>
                    <YAxis tick={{ fontSize:10 }} tickFormatter={v => `$${v}`}/>
                    <Tooltip formatter={v => `$${v}`}/>
                    <Bar dataKey="spread" name="Avg Spread ($)" radius={[4,4,0,0]}>
                      {filteredExchanges.map((e, i) => <Cell key={i} fill={e.avg_spread < 0.10 ? T.green : e.avg_spread < 0.18 ? T.amber : T.red}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={lbl}>Market Concentration Metrics</div>
                {[
                  { label:'Herfindahl-Hirschman Index (HHI)', value:'1,842', note:'Moderately concentrated (HHI 1,500-2,500)', color:T.amber },
                  { label:'Top-3 Exchange Share', value:'74%', note:'Xpansiv + ACX + CME dominate exchange vol.', color:T.indigo },
                  { label:'OTC vs Exchange Split', value:'28% OTC', note:'Down from 45% in 2020 as venues proliferate', color:T.green },
                  { label:'Avg Spread (VWA)', value:'$0.11', note:'Volume-weighted avg across all venues', color:T.teal },
                  { label:'Daily Volume (All Venues)', value:`${filteredExchanges.reduce((a,e)=>a+e.daily_volume,0).toFixed(1)} Mt`, note:'Spot + futures combined estimate', color:T.navy },
                ].map(m => (
                  <div key={m.label} style={{ padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ fontSize:11, color:T.text }}>{m.label}</div>
                      <div style={{ fontFamily:T.mono, fontWeight:700, color:m.color }}>{m.value}</div>
                    </div>
                    <div style={{ fontSize:10, color:T.sub, marginTop:2 }}>{m.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 9 — CLIMATE FINANCE & CARBON NEXUS
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === 9 && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={card}>
                <div style={lbl}>EU ETS Price vs Global Temperature Anomaly (°C) 2015-2024</div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={carbonTempData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="year" tick={{ fontSize:10 }}/>
                    <YAxis yAxisId="l" tick={{ fontSize:10 }} tickFormatter={v => `€${v}`}/>
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize:10 }} tickFormatter={v => `${v}°C`}/>
                    <Tooltip/>
                    <Legend wrapperStyle={{ fontSize:10 }}/>
                    <Bar yAxisId="l" dataKey="carbonPrice" name="EU ETS Price (€)" fill={T.indigo} opacity={0.75} barSize={20}/>
                    <Line yAxisId="r" type="monotone" dataKey="tempAnomaly" stroke={T.red} strokeWidth={2} name="Temp Anomaly (°C)" dot={{ r:3 }}/>
                    <ReferenceLine yAxisId="r" y={1.5} stroke={T.red} strokeDasharray="4 2" label={{ value:'1.5°C', fontSize:9 }}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                <div style={lbl}>ESG Fund Flows ($B) vs Carbon Price (€/t) 2018-2024</div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={esgFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="year" tick={{ fontSize:10 }}/>
                    <YAxis yAxisId="l" tick={{ fontSize:10 }} tickFormatter={v => `$${v}B`}/>
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize:10 }} tickFormatter={v => `€${v}`}/>
                    <Tooltip/>
                    <Legend wrapperStyle={{ fontSize:10 }}/>
                    <Area yAxisId="l" type="monotone" dataKey="esgFlows" name="ESG Fund Flows ($B)" stroke={T.green} fill={T.green} fillOpacity={0.15} strokeWidth={2}/>
                    <Line yAxisId="r" type="monotone" dataKey="carbonPrice" stroke={T.indigo} strokeWidth={2} name="EU ETS (€/t)" dot={{ r:3 }}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={card}>
              <div style={lbl}>Carbon as Asset Class — Correlation with Major Asset Classes (EU ETS, 5yr)</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
                {CORRELATION_MATRIX.map(r => (
                  <div key={r.asset} style={{
                    border:`1px solid ${T.border}`, borderRadius:8, padding:'10px 14px', textAlign:'center',
                    borderTop:`3px solid ${r.corr > 0.3 ? T.green : r.corr > 0.1 ? T.amber : r.corr < 0 ? T.red : T.sub}`
                  }}>
                    <div style={{ fontSize:10, color:T.sub, marginBottom:6 }}>{r.asset}</div>
                    <div style={{ fontFamily:T.mono, fontSize:20, fontWeight:700, color: r.corr > 0.3 ? T.green : r.corr > 0.1 ? T.amber : r.corr < 0 ? T.red : T.sub }}>
                      {r.corr > 0 ? '+' : ''}{r.corr.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={CORRELATION_MATRIX} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis type="number" domain={[-0.2, 0.5]} tick={{ fontSize:10 }}/>
                  <YAxis type="category" dataKey="asset" width={130} tick={{ fontSize:9 }}/>
                  <Tooltip/>
                  <ReferenceLine x={0} stroke={T.sub}/>
                  <Bar dataKey="corr" name="Correlation with EU ETS" radius={[0,4,4,0]}>
                    {CORRELATION_MATRIX.map((r, i) => <Cell key={i} fill={r.corr > 0.25 ? T.green : r.corr > 0.05 ? T.amber : T.red}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={card}>
                <div style={lbl}>Central Bank Carbon Stress Test Scenarios</div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                  <thead>
                    <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                      {['Scenario','Carbon Price 2030','GDP Impact','Bank LGD Delta','Prob'].map(h => (
                        <th key={h} style={{ textAlign:'left', padding:'7px 6px', color:T.sub }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { sc:'Orderly 1.5°C',  cp:'$147', gdp:'-0.5%', lgd:'+0.8pp', prob:'20%', col:T.green  },
                      { sc:'Disorderly 2°C', cp:'$98',  gdp:'-2.1%', lgd:'+2.4pp', prob:'35%', col:T.amber  },
                      { sc:'Hot House BAU',  cp:'$22',  gdp:'-4.8%', lgd:'+5.2pp', prob:'30%', col:T.red    },
                      { sc:'Carbon Shock',   cp:'$220', gdp:'-3.2%', lgd:'+3.8pp', prob:'15%', col:T.purple },
                    ].map(r => (
                      <tr key={r.sc} style={{ borderBottom:`1px solid ${T.border}` }}>
                        <td style={{ padding:'7px 6px', fontWeight:600 }}><Badge text={r.sc} color={r.col}/></td>
                        <td style={{ padding:'7px 6px', fontFamily:T.mono }}>{r.cp}</td>
                        <td style={{ padding:'7px 6px', fontFamily:T.mono, color:T.red }}>{r.gdp}</td>
                        <td style={{ padding:'7px 6px', fontFamily:T.mono }}>{r.lgd}</td>
                        <td style={{ padding:'7px 6px', color:T.sub }}>{r.prob}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={card}>
                <div style={lbl}>Carbon Carry Trade P&L (EU ETS Futures, Indicative)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={[
                    { month:'Jan', pnl:1.2 }, { month:'Feb', pnl:2.8 }, { month:'Mar', pnl:-1.4 },
                    { month:'Apr', pnl:3.6 }, { month:'May', pnl:2.1 }, { month:'Jun', pnl:-0.8 },
                    { month:'Jul', pnl:4.2 }, { month:'Aug', pnl:3.1 }, { month:'Sep', pnl:1.8 },
                    { month:'Oct', pnl:-2.2 }, { month:'Nov', pnl:5.4 }, { month:'Dec', pnl:3.8 },
                  ]}>
                    <defs>
                      <linearGradient id="pnlG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={T.green} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={T.green} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                    <XAxis dataKey="month" tick={{ fontSize:9 }}/>
                    <YAxis tick={{ fontSize:9 }} tickFormatter={v => `€${v}M`}/>
                    <Tooltip formatter={v => [`€${v}M`, 'Monthly P&L']}/>
                    <ReferenceLine y={0} stroke={T.sub}/>
                    <Area type="monotone" dataKey="pnl" stroke={T.green} fill="url(#pnlG)" strokeWidth={2} name="P&L (€M)"/>
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:10 }}>
                  {[
                    { label:'Cumulative P&L', val:'€23.6M' },
                    { label:'Sharpe (Ann.)', val:'1.42' },
                    { label:'Max Drawdown', val:'-3.6%' },
                  ].map(m => (
                    <div key={m.label} style={{ textAlign:'center', padding:'8px 0', borderTop:`2px solid ${T.border}` }}>
                      <div style={{ fontSize:9, color:T.sub }}>{m.label}</div>
                      <div style={{ fontFamily:T.mono, fontWeight:700, color:T.navy, fontSize:14 }}>{m.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
