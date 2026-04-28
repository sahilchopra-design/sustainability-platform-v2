import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie, Cell, Legend, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0',
  sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3',
  textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626',
  blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e',
  indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace'
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const TABS = [
  'Intelligence Dashboard', 'FinBERT Scoring Engine', 'Topic Modeling (LDA/BERTopic)',
  'Named Entity Recognition', 'Source Intelligence', 'EWMA Momentum & IC Decay',
  'Alpha Signal Factory', 'Data Sources & Integration'
];

const SECTORS = ['Energy', 'Technology', 'Financials', 'Healthcare', 'Industrials', 'Materials', 'Consumer', 'Real Estate', 'Utilities', 'Telecom'];

const COMPANY_NAMES = [
  'TotalEnergies','Shell plc','BP plc','Exxon Mobil','Chevron Corporation','ConocoPhillips','Equinor ASA','Eni SpA','Repsol SA','Occidental Petroleum',
  'Microsoft Corporation','Apple Inc','Alphabet Inc','Amazon.com','Meta Platforms','Nvidia Corporation','TSMC','Samsung Electronics','Intel Corporation','Advanced Micro Devices',
  'JPMorgan Chase','Goldman Sachs','Bank of America','HSBC Holdings','BNP Paribas','Deutsche Bank','Barclays plc','UBS Group','Credit Agricole','Societe Generale',
  'Johnson & Johnson','Pfizer Inc','Roche Holding','Novartis AG','AstraZeneca','Novo Nordisk','Merck & Co','Abbott Laboratories','Sanofi SA','Bristol-Myers Squibb',
  'Siemens AG','General Electric','Honeywell International','ABB Ltd','Schneider Electric','Caterpillar Inc','Deere & Company','Emerson Electric','Parker Hannifin','Illinois Tool Works',
  'Rio Tinto','BHP Group','Glencore plc','Vale SA','ArcelorMittal','Freeport-McMoRan','Anglo American','Nucor Corporation','Steel Dynamics','Alcoa Corporation',
  'Unilever plc','Nestle SA','Procter & Gamble','Coca-Cola Company','PepsiCo Inc','Walmart Inc','Costco Wholesale','Home Depot','Nike Inc','Adidas AG',
  'LVMH','Hermes International','Kering SA','Danone SA','LOreal Group','Diageo plc','AB InBev','Heineken NV','Pernod Ricard','Campari Group',
  'Prologis Inc','American Tower','Simon Property','Crown Castle','Equinix Inc','Realty Income','CBRE Group','Jones Lang LaSalle','Ventas Inc','Alexandria Real Estate',
  'NextEra Energy','Duke Energy','Southern Company','Dominion Energy','American Electric Power','Xcel Energy','Eversource Energy','Entergy Corporation','Consolidated Edison','PPL Corporation',
  'Deutsche Telekom','Verizon Communications','AT&T Inc','T-Mobile US','Softbank Group','Nippon Telegraph','BCE Inc','Telstra Group','Vodafone Group','Orange SA',
  'BlackRock Inc','Vanguard Group','State Street','Fidelity Investments','T Rowe Price','Franklin Templeton','Invesco Ltd','Amundi Asset Management','Schroders plc','Federated Hermes',
  'SAP SE','Oracle Corporation','Salesforce Inc','Adobe Inc','Workday Inc','ServiceNow','Palantir Technologies','Snowflake Inc','Datadog Inc','MongoDB Inc',
  'Volkswagen AG','BMW Group','Toyota Motor','Ford Motor Company','General Motors','Stellantis NV','Renault SA','Hyundai Motor','Daimler Truck','Volvo Group',
  'BASF SE','Dow Chemical','LyondellBasell','Eastman Chemical','Celanese Corporation','Huntsman Corporation','Ashland Global','Olin Corporation','Quaker Houghton','Innospec Inc',
  'Visa Inc','Mastercard','PayPal Holdings','Fiserv Inc','Jack Henry & Associates','Worldline SA','Nexi SpA','Adyen NV','Block Inc','Affirm Holdings',
  'Berkshire Hathaway','Allianz SE','AXA Group','Zurich Insurance','Munich Re','Swiss Re','Hannover Re','Tokio Marine','Chubb Limited','Marsh & McLennan',
  'Alphabet DeepMind','Anthropic PBC','OpenAI Inc','DataRobot Inc','C3.ai Inc','UiPath Inc','Automation Anywhere','Blue Prism Group','NICE Systems','Verint Systems',
  'Brookfield Renewable','Orsted AS','Vestas Wind Systems','Siemens Gamesa','SolarEdge Technologies','Enphase Energy','First Solar Inc','Sunrun Inc','Canadian Solar','Array Technologies',
  'Genpact Ltd','Cognizant Technology','Infosys Ltd','Wipro Ltd','HCL Technologies','Tata Consultancy','Capgemini SE','Accenture plc','DXC Technology','Conduent Inc'
];

const COMPANIES = Array.from({ length: 200 }, (_, i) => {
  const name = COMPANY_NAMES[i] || `Company ${i + 1}`;
  const sector = SECTORS[i % 10];
  const eScore = Math.round(20 + sr(i * 7) * 70);
  const sScore = Math.round(20 + sr(i * 11) * 70);
  const gScore = Math.round(30 + sr(i * 13) * 60);
  const raw = sr(i * 3);
  const rawNeu = sr(i * 5);
  const finbert_pos = parseFloat((raw * 0.7).toFixed(3));
  const finbert_neg = parseFloat(((1 - raw) * 0.4).toFixed(3));
  const finbert_neu = parseFloat(Math.max(0, 1 - finbert_pos - finbert_neg).toFixed(3));
  const ic = parseFloat((0.05 + sr(i * 17) * 0.25).toFixed(3));
  const momentumRaw = sr(i * 23);
  const momentum = momentumRaw > 0.65 ? 'Accelerating' : momentumRaw > 0.35 ? 'Stable' : 'Decelerating';
  const controversies = Math.round(sr(i * 29) * 8);
  const volume = Math.round(50 + sr(i * 31) * 950);
  const priceCorr = Math.round(-50 + sr(i * 37) * 100);
  const trend = sr(i * 41) > 0.45 ? 'Improving' : 'Declining';
  return {
    id: i, name, sector, eScore, sScore, gScore,
    overall: Math.round((eScore + sScore + gScore) / 3),
    finbert_pos, finbert_neu, finbert_neg, ic, momentum,
    controversies, volume, priceCorr, trend
  };
});

const HEADLINE_POOL = [
  'announces ambitious net-zero target ahead of schedule','faces regulatory probe over greenwashing claims','launches $2B sustainable infrastructure fund',
  'receives top ESG rating from MSCI','criticized by NGOs for forest destruction links','partners with UN on ocean plastic initiative',
  'board diversity metrics lag behind sector peers','reports record Scope 3 emissions reduction','wins CDP Climate A-List recognition',
  'sued over misleading climate disclosures','commits to science-based targets by 2030','faces labor union demands at major facility',
  'achieves carbon neutrality in EU operations','misses renewable energy transition milestone','discloses climate VaR of $3.2B under 2°C scenario',
  'expands sustainable finance framework','linked to controversial deep-sea mining project','publishes TCFD-aligned transition plan',
  'executive pay controversy escalates amid layoffs','invests $500M in hydrogen fuel cell technology'
];

const ARTICLES = Array.from({ length: 100 }, (_, i) => {
  const company = COMPANIES[Math.floor(sr(i * 7) * 200)];
  const headlineBase = HEADLINE_POOL[Math.floor(sr(i * 11) * HEADLINE_POOL.length)];
  const sourceTier = Math.ceil(sr(i * 13) * 5);
  const sources5 = ['SEC EDGAR','GDELT News','OpenAlex Research','Bloomberg','Reuters','Financial Times','NGO Reports','Social Media','Corporate Filings','Regulatory Notices','Industry Bodies','Alpha Vantage News','Academic Journals','UNFCCC','CDP Disclosures'];
  const sentRaw = sr(i * 17);
  const sentiment = sentRaw > 0.55 ? 'Positive' : sentRaw > 0.3 ? 'Neutral' : 'Negative';
  const score = sentiment === 'Positive' ? Math.round(55 + sr(i * 19) * 45) : sentiment === 'Neutral' ? Math.round(40 + sr(i * 21) * 20) : Math.round(5 + sr(i * 23) * 40);
  const pillar = ['E', 'S', 'G'][Math.floor(sr(i * 29) * 3)];
  const day = String(Math.ceil(sr(i * 31) * 28)).padStart(2, '0');
  const month = String(Math.ceil(sr(i * 37) * 3)).padStart(2, '0');
  return {
    id: i,
    date: `2026-0${month}-${day}`,
    company: company.name,
    sector: company.sector,
    headline: `${company.name} ${headlineBase}`,
    source: sources5[Math.floor(sr(i * 41) * 15)],
    tier: sourceTier,
    sentiment,
    score,
    confidence: parseFloat((0.60 + sr(i * 43) * 0.39).toFixed(2)),
    pillar,
    entities: [company.name, company.sector, ['EU Taxonomy', 'SFDR', 'TCFD', 'CDP', 'GRI'][Math.floor(sr(i * 47) * 5)]]
  };
});

const TOPIC_NAMES = [
  'Carbon Emissions & Net Zero','Green Hydrogen Transition','Biodiversity & Land Use','Water Stress & Scarcity',
  'Scope 3 Value Chain Emissions','TCFD Climate Disclosure','Greenwashing & Integrity','Supply Chain Due Diligence',
  'Just Transition & Labor','Board Diversity & Governance','Executive Compensation','Data Privacy & Cybersecurity',
  'Circular Economy & Waste','Climate Litigation Risk','Sovereign ESG Risk','Nature Capital Accounting',
  'Stranded Asset Exposure','Paris Agreement Alignment','Social Impact & DEI','Regulatory Compliance'
];

const TOPIC_TERM_POOL = [
  ['emissions','carbon','net-zero','GHG','Scope1','mitigation','offset','target','pathway','decarbonization'],
  ['hydrogen','electrolysis','green','fuel-cell','PEM','alkaline','storage','pipeline','CCUS','electrolyzer'],
  ['biodiversity','deforestation','TNFD','habitat','species','land-use','restoration','SBTN','IPBES','ecosystem'],
  ['water','stress','scarcity','withdrawal','recycling','Aqueduct','WRI','basin','drought','efficiency'],
  ['Scope3','value-chain','upstream','downstream','PCAF','financed','category15','supply','Tier1','FLAG'],
  ['TCFD','disclosure','scenario','physical','transition','1.5C','2C','governance','strategy','metrics'],
  ['greenwashing','ESG','fraud','misleading','claims','label','fund','certification','integrity','audit'],
  ['supply-chain','UFLPA','EUDR','due-diligence','traceability','Tier2','conflict','forced-labor','minerals','audit'],
  ['just-transition','workers','unions','reskilling','coal','communities','ILO','equity','social','stranded'],
  ['diversity','board','gender','ethnicity','inclusion','DEI','pay-gap','representation','targets','proxy'],
  ['CEO','pay','ratio','LTIP','ESG-link','compensation','say-on-pay','clawback','incentive','performance'],
  ['data','privacy','GDPR','breach','cybersecurity','AI','consent','sovereignty','regulation','framework'],
  ['circular','waste','recycling','EPR','plastic','packaging','cradle','lifecycle','design','material'],
  ['litigation','climate','lawsuit','liability','SEC','disclosure','fraud','tort','regulation','enforcement'],
  ['sovereign','ESG','country','risk','fiscal','governance','corruption','Transparency','CPI','IDA'],
  ['nature','capital','TNFD','LEAP','ecosystem','services','accounting','biodiversity','GBF','restoration'],
  ['stranded','asset','fossil','coal','reserve','impairment','write-down','transition','NGFS','scenario'],
  ['Paris','alignment','1.5C','ITR','temperature','SBTi','budget','NDC','pathway','overshoot'],
  ['social','impact','DEI','community','human-rights','UNGP','UNGPs','modern-slavery','gender','inclusion'],
  ['regulatory','compliance','CSRD','SFDR','EU','SEC','reporting','ISSB','ESRS','mandatory']
];

const TOPICS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  name: TOPIC_NAMES[i],
  coherence: parseFloat((0.40 + sr(i * 7) * 0.55).toFixed(3)),
  prevalence: parseFloat((0.02 + sr(i * 11) * 0.18).toFixed(3)),
  drift: parseFloat((-0.05 + sr(i * 13) * 0.10).toFixed(3)),
  terms: TOPIC_TERM_POOL[i] || ['esg','climate','risk','data','model','factor','score','signal','trend','impact'],
  monthly: Array.from({ length: 12 }, (_, m) => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m],
    prevalence: parseFloat((0.02 + sr(i * 11) * 0.18 + (-0.01 + sr(i * 100 + m * 7) * 0.02)).toFixed(3))
  }))
}));

const SOURCES_DATA = [
  { name: 'SEC EDGAR', tier: 1, articlesMonth: 4200, bias: 0.0, credWeight: 1.0, avgSentiment: 52 },
  { name: 'GDELT News', tier: 2, articlesMonth: 18000, bias: -2.1, credWeight: 0.85, avgSentiment: 48 },
  { name: 'OpenAlex Research', tier: 1, articlesMonth: 900, bias: 1.2, credWeight: 0.95, avgSentiment: 61 },
  { name: 'Bloomberg', tier: 1, articlesMonth: 3100, bias: 0.8, credWeight: 1.0, avgSentiment: 55 },
  { name: 'Reuters', tier: 1, articlesMonth: 2800, bias: 0.3, credWeight: 0.98, avgSentiment: 53 },
  { name: 'Financial Times', tier: 1, articlesMonth: 1400, bias: 1.1, credWeight: 0.97, avgSentiment: 57 },
  { name: 'NGO Reports', tier: 2, articlesMonth: 320, bias: -4.5, credWeight: 0.75, avgSentiment: 38 },
  { name: 'Social Media', tier: 5, articlesMonth: 95000, bias: -3.2, credWeight: 0.25, avgSentiment: 44 },
  { name: 'Corporate Filings', tier: 1, articlesMonth: 1800, bias: 3.1, credWeight: 0.92, avgSentiment: 67 },
  { name: 'Regulatory Notices', tier: 1, articlesMonth: 620, bias: 0.1, credWeight: 0.99, avgSentiment: 50 },
  { name: 'Industry Bodies', tier: 3, articlesMonth: 480, bias: 2.8, credWeight: 0.65, avgSentiment: 62 },
  { name: 'Alpha Vantage News', tier: 3, articlesMonth: 7200, bias: -0.9, credWeight: 0.60, avgSentiment: 49 },
  { name: 'Academic Journals', tier: 1, articlesMonth: 210, bias: 0.5, credWeight: 1.0, avgSentiment: 58 },
  { name: 'UNFCCC', tier: 1, articlesMonth: 140, bias: 1.8, credWeight: 0.98, avgSentiment: 63 },
  { name: 'CDP Disclosures', tier: 1, articlesMonth: 380, bias: 1.5, credWeight: 0.96, avgSentiment: 65 }
];

const ENTITY_TYPES = ['ORG', 'LOC', 'DATE', 'MONEY', 'PERCENT', 'METRIC', 'COMMITMENT'];
const ENTITIES_NER = Array.from({ length: 200 }, (_, i) => {
  const company = COMPANIES[i % 200];
  const type = ENTITY_TYPES[Math.floor(sr(i * 7) * 7)];
  const textMap = {
    ORG: company.name,
    LOC: ['European Union', 'United States', 'China', 'Germany', 'United Kingdom', 'Japan', 'India', 'Brazil', 'Canada', 'Australia'][Math.floor(sr(i * 11) * 10)],
    DATE: [`${2024 + Math.floor(sr(i * 13) * 3)}-Q${Math.ceil(sr(i * 17) * 4)}`],
    MONEY: `$${Math.round(0.1 + sr(i * 19) * 9.9).toFixed(1)}B`,
    PERCENT: `${Math.round(10 + sr(i * 23) * 85)}%`,
    METRIC: ['tCO2e', 'MWh', 'GJ', 'ML water', 'tonnes waste'][Math.floor(sr(i * 29) * 5)],
    COMMITMENT: ['Net Zero 2030', 'SBTi Validated', 'RE100 Member', 'B Corp Certified', 'UN SDG Signatory'][Math.floor(sr(i * 31) * 5)]
  };
  const firstYear = 2022 + Math.floor(sr(i * 37) * 4);
  const firstMonth = String(Math.ceil(sr(i * 41) * 12)).padStart(2, '0');
  return {
    text: Array.isArray(textMap[type]) ? textMap[type][0] : textMap[type],
    type,
    company: company.name,
    confidence: parseFloat((0.70 + sr(i * 43) * 0.30).toFixed(2)),
    mentions: Math.round(5 + sr(i * 47) * 195),
    firstSeen: `${firstYear}-${firstMonth}-01`
  };
});

const PIE_COLORS = [T.indigo, T.gold, T.teal, T.red, T.amber, T.purple, T.sage];

// ─── shared UI primitives ───────────────────────────────────────────────────
const Kpi = ({ label, value, sub, accent = T.indigo }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', borderLeft: `3px solid ${accent}` }}>
    <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.textPri }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: accent, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Card = ({ children, title, style = {} }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, ...style }}>
    {title && <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 12, borderBottom: `1px solid ${T.borderL}`, paddingBottom: 8 }}>{title}</div>}
    {children}
  </div>
);

const Badge = ({ children, color = T.indigo }) => (
  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: color + '20', color }}>
    {children}
  </span>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 700, color: T.textSec, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{children}</div>
);

const Th = ({ children, onClick, sorted }) => (
  <th onClick={onClick} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: T.textSec, background: T.surfaceH, border: `1px solid ${T.border}`, textAlign: 'left', cursor: onClick ? 'pointer' : 'default', whiteSpace: 'nowrap', userSelect: 'none' }}>
    {children}{sorted ? (sorted === 'asc' ? ' ↑' : ' ↓') : ''}
  </th>
);

const Td = ({ children, mono, right }) => (
  <td style={{ padding: '7px 10px', fontSize: 12, border: `1px solid ${T.border}`, color: T.textPri, fontFamily: mono ? T.fontMono : undefined, textAlign: right ? 'right' : 'left' }}>
    {children}
  </td>
);

const sentimentColor = s => s === 'Positive' ? T.green : s === 'Negative' ? T.red : T.amber;
const heatColor = v => {
  const pct = Math.max(0, Math.min(100, v)) / 100;
  if (pct < 0.4) return `hsl(0,70%,${55 + (0.4 - pct) * 40}%)`;
  if (pct > 0.6) return `hsl(142,60%,${35 + pct * 20}%)`;
  return `hsl(38,75%,58%)`;
};

// ─── TAB 1: Intelligence Dashboard ─────────────────────────────────────────
function TabDashboard() {
  const [pillar, setPillar] = useState('All');
  const [sector, setSector] = useState('All');

  const feed = useMemo(() => {
    let a = [...ARTICLES];
    if (pillar !== 'All') a = a.filter(x => x.pillar === pillar);
    if (sector !== 'All') a = a.filter(x => x.sector === sector);
    return a.slice(0, 50);
  }, [pillar, sector]);

  const totalArticles = 1200;
  const avgESG = Math.round(COMPANIES.reduce((a, c) => a + c.overall, 0) / Math.max(1, COMPANIES.length));
  const controversyIdx = parseFloat((COMPANIES.reduce((a, c) => a + c.controversies, 0) / Math.max(1, COMPANIES.length)).toFixed(1));

  const sectorHeatmap = SECTORS.map(s => {
    const cs = COMPANIES.filter(c => c.sector === s);
    return {
      sector: s,
      E: Math.round(cs.reduce((a, c) => a + c.eScore, 0) / Math.max(1, cs.length)),
      S: Math.round(cs.reduce((a, c) => a + c.sScore, 0) / Math.max(1, cs.length)),
      G: Math.round(cs.reduce((a, c) => a + c.gScore, 0) / Math.max(1, cs.length))
    };
  });

  const controversyAlerts = [...COMPANIES].sort((a, b) => b.controversies - a.controversies).slice(0, 10);

  const trendingBubbles = TOPIC_NAMES.slice(0, 12).map((t, i) => ({
    name: t, size: Math.round(30 + sr(i * 7) * 70), sentiment: sr(i * 11) > 0.5 ? 'Positive' : 'Negative'
  }));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <Kpi label="Companies Tracked" value="200" sub="ESG universe" accent={T.indigo} />
        <Kpi label="Articles / Month" value={totalArticles.toLocaleString()} sub="15 integrated sources" accent={T.teal} />
        <Kpi label="Avg ESG Score" value={avgESG} sub={avgESG > 55 ? 'Above neutral threshold' : 'Below neutral threshold'} accent={avgESG > 55 ? T.green : T.red} />
        <Kpi label="Controversy Index" value={controversyIdx.toFixed(1)} sub="Per-company avg (0–8)" accent={T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <SectionLabel>Pillar:</SectionLabel>
        {['All', 'E', 'S', 'G'].map(p => (
          <button key={p} onClick={() => setPillar(p)} style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: pillar === p ? T.indigo : T.card, color: pillar === p ? '#fff' : T.textPri, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{p}</button>
        ))}
        <select value={sector} onChange={e => setSector(e.target.value)} style={{ padding: '4px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, marginLeft: 8 }}>
          <option value="All">All Sectors</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 12, marginBottom: 16 }}>
        <Card title="Real-Time Article Intelligence Feed (50 items)">
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {feed.map(a => (
              <div key={a.id} style={{ padding: '9px 10px', borderBottom: `1px solid ${T.borderL}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri, marginBottom: 3 }}>{a.headline}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: T.textSec }}>{a.date}</span>
                  <Badge color={sentimentColor(a.sentiment)}>{a.sentiment} {a.score}</Badge>
                  <Badge color={T.indigo}>{a.pillar}</Badge>
                  <span style={{ fontSize: 11, color: T.textSec }}>{a.source} (Tier {a.tier})</span>
                  <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.textSec }}>conf {(a.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card title="Trending Topics — Bubble Map" style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {trendingBubbles.map((b, i) => (
                <div key={i} title={b.name} style={{
                  width: b.size * 0.8, height: b.size * 0.8, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: (b.sentiment === 'Positive' ? T.teal : T.red) + '25', border: `2px solid ${b.sentiment === 'Positive' ? T.teal : T.red}`,
                  fontSize: 9, fontWeight: 600, color: b.sentiment === 'Positive' ? T.teal : T.red, textAlign: 'center', padding: 4, cursor: 'default'
                }}>
                  {b.name.split(' ').slice(0, 2).join(' ')}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card title="Sector × Pillar Sentiment Heatmap" style={{ marginBottom: 16 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 12px', background: T.surfaceH, border: `1px solid ${T.border}`, textAlign: 'left', fontSize: 11, color: T.textSec }}>Sector</th>
                {['Environmental (E)', 'Social (S)', 'Governance (G)'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 11, color: T.textSec, textAlign: 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sectorHeatmap.map(row => (
                <tr key={row.sector}>
                  <td style={{ padding: '8px 12px', border: `1px solid ${T.border}`, fontWeight: 600, color: T.textPri, fontSize: 12 }}>{row.sector}</td>
                  {['E', 'S', 'G'].map(p => (
                    <td key={p} style={{ padding: '8px 12px', border: `1px solid ${T.border}`, background: heatColor(row[p]), textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#fff', fontFamily: T.fontMono }}>
                      {row[p]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Controversy Alert Table — Top 10 by Controversy Count">
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <Th>Company</Th><Th>Sector</Th><Th>Controversies</Th><Th>Severity</Th><Th>Trend</Th><Th>Price Corr (%)</Th>
            </tr>
          </thead>
          <tbody>
            {controversyAlerts.map((c, i) => (
              <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                <Td>{c.name}</Td>
                <Td><Badge color={T.indigo}>{c.sector}</Badge></Td>
                <Td mono right>{c.controversies}</Td>
                <Td><Badge color={c.controversies >= 6 ? T.red : c.controversies >= 4 ? T.amber : T.green}>{c.controversies >= 6 ? 'Critical' : c.controversies >= 4 ? 'High' : 'Medium'}</Badge></Td>
                <Td><Badge color={c.trend === 'Improving' ? T.green : T.red}>{c.trend}</Badge></Td>
                <Td mono right style={{ color: c.priceCorr >= 0 ? T.green : T.red }}>{c.priceCorr > 0 ? '+' : ''}{c.priceCorr}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── TAB 2: FinBERT Scoring Engine ──────────────────────────────────────────
function TabFinBERT() {
  const [selectedArticle, setSelectedArticle] = useState(0);
  const [domainWeight, setDomainWeight] = useState({ financial: 70, esg: 60, regulatory: 80 });

  const article = ARTICLES[selectedArticle];
  const pos = article.confidence * article.finbert_pos || article.confidence * (article.sentiment === 'Positive' ? 0.72 : 0.18);
  const neg = article.confidence * (article.sentiment === 'Negative' ? 0.71 : 0.12);
  const neu = Math.max(0, 1 - pos - neg);

  const softmaxData = [
    { label: 'Positive', prob: parseFloat(pos.toFixed(3)), color: T.green },
    { label: 'Neutral', prob: parseFloat(neu.toFixed(3)), color: T.amber },
    { label: 'Negative', prob: parseFloat(neg.toFixed(3)), color: T.red }
  ];

  const modelComparison = [
    { model: 'FinBERT', precision: 0.887, recall: 0.873, f1: 0.880, notes: 'Financial text pre-trained' },
    { model: 'ESG-BERT', precision: 0.861, recall: 0.849, f1: 0.855, notes: 'ESG domain fine-tuned' },
    { model: 'VADER', precision: 0.712, recall: 0.698, f1: 0.705, notes: 'Lexicon-based, fast' },
    { model: 'TextBlob', precision: 0.654, recall: 0.641, f1: 0.647, notes: 'General purpose NLP' }
  ];

  const bootstrapCI = Array.from({ length: 20 }, (_, i) => ({
    sample: i + 1,
    mean: parseFloat((pos + (-0.05 + sr(i * 7) * 0.10)).toFixed(3)),
    lower: parseFloat((pos - 0.08 - sr(i * 11) * 0.04).toFixed(3)),
    upper: parseFloat((pos + 0.05 + sr(i * 13) * 0.04).toFixed(3))
  }));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <Kpi label="Active Model" value="FinBERT" sub="ProsusAI/finbert" accent={T.indigo} />
        <Kpi label="Model F1 Score" value="0.880" sub="Financial domain" accent={T.green} />
        <Kpi label="Corpus Size" value="4.9B" sub="Tokens pre-trained" accent={T.teal} />
        <Kpi label="Inference Latency" value="~42ms" sub="Per article (CPU)" accent={T.amber} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, marginBottom: 16 }}>
        <Card title="Article Selection & FinBERT 3-Class Classification">
          <div style={{ marginBottom: 10 }}>
            <select value={selectedArticle} onChange={e => setSelectedArticle(Number(e.target.value))}
              style={{ width: '100%', padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
              {ARTICLES.slice(0, 50).map((a, i) => (
                <option key={a.id} value={i}>{a.headline.slice(0, 80)}</option>
              ))}
            </select>
          </div>
          <div style={{ padding: '10px 12px', background: T.sub, borderRadius: 8, marginBottom: 12, fontSize: 12, color: T.textPri, lineHeight: 1.6 }}>
            <strong>Source:</strong> {article.source} (Tier {article.tier}) &nbsp;|&nbsp;
            <strong>Date:</strong> {article.date} &nbsp;|&nbsp;
            <strong>Pillar:</strong> {article.pillar} &nbsp;|&nbsp;
            <strong>Confidence:</strong> <span style={{ fontFamily: T.fontMono }}>{(article.confidence * 100).toFixed(1)}%</span>
          </div>
          <SectionLabel>Softmax Probability Distribution</SectionLabel>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={softmaxData} margin={{ top: 4, right: 20, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} tickFormatter={v => v.toFixed(2)} />
              <Tooltip formatter={v => v.toFixed(4)} />
              <Bar dataKey="prob" radius={[4, 4, 0, 0]}>
                {softmaxData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {softmaxData.map(d => (
              <div key={d.label} style={{ flex: 1, textAlign: 'center', padding: '8px', background: d.color + '15', borderRadius: 6, border: `1px solid ${d.color}30` }}>
                <div style={{ fontSize: 11, color: T.textSec }}>{d.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: d.color, fontFamily: T.fontMono }}>{(d.prob * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card title="Domain Calibration Sliders">
            {Object.entries(domainWeight).map(([k, v]) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize', color: T.textPri }}>{k} text weight</span>
                  <span style={{ fontFamily: T.fontMono, color: T.indigo }}>{v}</span>
                </div>
                <input type="range" min={0} max={100} value={v}
                  onChange={e => setDomainWeight(prev => ({ ...prev, [k]: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: T.indigo }} />
              </div>
            ))}
            <div style={{ padding: '8px 10px', background: T.sub, borderRadius: 6, fontSize: 11, color: T.textSec }}>
              Higher weights increase sensitivity to domain-specific vocabulary. Financial + ESG calibration recommended for sustainability signals.
            </div>
          </Card>

          <Card title="Bootstrapped CI (±1σ, 20 samples)">
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={bootstrapCI} margin={{ top: 4, right: 10, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sample" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} tickFormatter={v => v.toFixed(2)} />
                <Tooltip formatter={v => v.toFixed(4)} />
                <Line type="monotone" dataKey="mean" stroke={T.indigo} strokeWidth={2} dot={false} name="Mean" />
                <Line type="monotone" dataKey="upper" stroke={T.green} strokeWidth={1} strokeDasharray="3 2" dot={false} name="+1σ" />
                <Line type="monotone" dataKey="lower" stroke={T.red} strokeWidth={1} strokeDasharray="3 2" dot={false} name="-1σ" />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      <Card title="Model Benchmark — Precision / Recall / F1 (ESG Financial Text)">
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr><Th>Model</Th><Th>Precision</Th><Th>Recall</Th><Th>F1 Score</Th><Th>Notes</Th></tr>
          </thead>
          <tbody>
            {modelComparison.map((m, i) => (
              <tr key={m.model} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                <Td><strong>{m.model}</strong></Td>
                <Td mono right>{m.precision.toFixed(3)}</Td>
                <Td mono right>{m.recall.toFixed(3)}</Td>
                <Td mono right><strong style={{ color: m.f1 > 0.85 ? T.green : m.f1 > 0.70 ? T.amber : T.red }}>{m.f1.toFixed(3)}</strong></Td>
                <Td>{m.notes}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── TAB 3: Topic Modeling ──────────────────────────────────────────────────
function TabTopicModeling() {
  const [selectedTopic, setSelectedTopic] = useState(0);
  const [sortBy, setSortBy] = useState('coherence');

  const sortedTopics = useMemo(() => [...TOPICS].sort((a, b) => b[sortBy] - a[sortBy]), [sortBy]);
  const topic = TOPICS[selectedTopic];

  const similarityMatrix = useMemo(() => TOPICS.slice(0, 8).map((t, i) =>
    TOPICS.slice(0, 8).map((t2, j) => parseFloat((i === j ? 1 : Math.max(0.05, sr(i * 31 + j * 7) * 0.6)).toFixed(2)))
  ), []);

  const driftData = TOPICS.slice(0, 10).map(t => ({
    name: t.name.split(' ').slice(0, 2).join(' '),
    drift: t.drift,
    color: t.drift > 0 ? T.green : T.red
  }));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <Kpi label="Total Topics (LDA)" value="20" sub="Optimal k via coherence" accent={T.indigo} />
        <Kpi label="Avg Coherence (Cv)" value={TOPICS.reduce((a, t) => a + t.coherence, 0) > 0 ? (TOPICS.reduce((a, t) => a + t.coherence, 0) / Math.max(1, TOPICS.length)).toFixed(3) : '0.000'} sub="Target > 0.55" accent={T.teal} />
        <Kpi label="Top Topic Prevalence" value={`${(Math.max(...TOPICS.map(t => t.prevalence)) * 100).toFixed(1)}%`} sub={[...TOPICS].sort((a, b) => b.prevalence - a.prevalence)[0].name.split(' ').slice(0, 3).join(' ')} accent={T.gold} />
        <Kpi label="Max Topic Drift" value={`${(Math.max(...TOPICS.map(t => Math.abs(t.drift))) * 100).toFixed(1)}pp`} sub="Monthly weight shift" accent={T.amber} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 12, marginBottom: 16 }}>
        <Card title="Topic Coherence & Prevalence Rankings">
          <div style={{ marginBottom: 8, display: 'flex', gap: 6 }}>
            {['coherence', 'prevalence', 'drift'].map(s => (
              <button key={s} onClick={() => setSortBy(s)} style={{ padding: '3px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: sortBy === s ? T.indigo : T.card, color: sortBy === s ? '#fff' : T.textPri, cursor: 'pointer', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{s}</button>
            ))}
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {sortedTopics.map((t, i) => (
              <div key={t.id} onClick={() => setSelectedTopic(t.id)} style={{ padding: '8px 10px', borderBottom: `1px solid ${T.borderL}`, cursor: 'pointer', background: selectedTopic === t.id ? T.indigo + '10' : 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>{i + 1}. {t.name}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Badge color={T.teal}>Cv {t.coherence.toFixed(3)}</Badge>
                    <Badge color={T.indigo}>{(t.prevalence * 100).toFixed(1)}%</Badge>
                    <Badge color={t.drift > 0 ? T.green : T.red}>{t.drift > 0 ? '+' : ''}{(t.drift * 100).toFixed(1)}pp</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card title={`Topic Detail: ${topic.name}`}>
            <SectionLabel>Top 10 Terms (simulated LDA φ weights)</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {topic.terms.map((term, i) => (
                <span key={i} style={{ padding: '3px 10px', background: T.indigo + `${Math.round((10 - i) * 8).toString(16).padStart(2, '0')}`, color: i < 4 ? '#fff' : T.indigo, border: `1px solid ${T.indigo}40`, borderRadius: 4, fontSize: 12, fontWeight: 600, fontFamily: T.fontMono }}>
                  {term}
                </span>
              ))}
            </div>
            <SectionLabel>12-Month Prevalence Trend</SectionLabel>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={topic.monthly} margin={{ top: 4, right: 10, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={v => `${(v * 100).toFixed(1)}%`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `${(v * 100).toFixed(2)}%`} />
                <Area type="monotone" dataKey="prevalence" stroke={T.indigo} fill={T.indigo + '30'} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card title="Cross-Topic Similarity Matrix (8×8 Heatmap)">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr>
                  <th style={{ padding: '4px 6px', background: T.surfaceH, border: `1px solid ${T.border}` }}></th>
                  {TOPICS.slice(0, 8).map(t => (
                    <th key={t.id} style={{ padding: '4px 6px', background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 9, color: T.textSec, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.name.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOPICS.slice(0, 8).map((t, i) => (
                  <tr key={t.id}>
                    <td style={{ padding: '4px 6px', border: `1px solid ${T.border}`, fontWeight: 600, fontSize: 9, color: T.textSec, maxWidth: 70, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name.split(' ')[0]}</td>
                    {similarityMatrix[i].map((v, j) => (
                      <td key={j} style={{ padding: '4px 8px', border: `1px solid ${T.border}`, background: `rgba(79,70,229,${v.toFixed(2)})`, textAlign: 'center', fontFamily: T.fontMono, fontSize: 10, color: v > 0.5 ? '#fff' : T.textPri }}>
                        {v.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Topic Drift Detection — Monthly Weight Shift (pp)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={driftData} layout="vertical" margin={{ top: 4, right: 30, bottom: 4, left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tickFormatter={v => `${(v * 100).toFixed(0)}pp`} tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={115} />
              <Tooltip formatter={v => `${(v * 100).toFixed(1)}pp`} />
              <ReferenceLine x={0} stroke={T.textSec} strokeDasharray="3 3" />
              <Bar dataKey="drift" radius={[0, 4, 4, 0]}>
                {driftData.map((d, i) => <Cell key={i} fill={d.drift > 0 ? T.green : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

// ─── TAB 4: Named Entity Recognition ────────────────────────────────────────
function TabNER() {
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchText, setSearchText] = useState('');

  const filtered = useMemo(() => {
    let e = [...ENTITIES_NER];
    if (typeFilter !== 'All') e = e.filter(x => x.type === typeFilter);
    if (searchText) e = e.filter(x => x.text.toLowerCase().includes(searchText.toLowerCase()) || x.company.toLowerCase().includes(searchText.toLowerCase()));
    return [...e].sort((a, b) => b.mentions - a.mentions).slice(0, 50);
  }, [typeFilter, searchText]);

  const typeCounts = ENTITY_TYPES.map(t => ({ type: t, count: ENTITIES_NER.filter(e => e.type === t).length }));

  const coMatrix = useMemo(() => {
    const topEnts = ENTITIES_NER.slice(0, 15);
    return topEnts.map((e1, i) => topEnts.map((e2, j) => i === j ? 0 : Math.round(sr(i * 47 + j * 13) * 80)));
  }, []);

  const topCoEnts = ENTITIES_NER.slice(0, 15).map(e => e.text.slice(0, 15));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <Kpi label="Total Entities" value="200" sub="Extracted from corpus" accent={T.indigo} />
        <Kpi label="Entity Types" value="7" sub="ORG/LOC/DATE/MONEY/..." accent={T.teal} />
        <Kpi label="Avg Confidence" value={`${(ENTITIES_NER.reduce((a, e) => a + e.confidence, 0) / Math.max(1, ENTITIES_NER.length) * 100).toFixed(1)}%`} sub="NER extraction model" accent={T.green} />
        <Kpi label="Disambiguation Rate" value="94.2%" sub="Wikidata entity linking" accent={T.gold} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12, marginBottom: 16 }}>
        <Card title="Entity Extraction Table (sorted by mentions)">
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search entities..." style={{ flex: 1, minWidth: 150, padding: '5px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }} />
            {['All', ...ENTITY_TYPES].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: typeFilter === t ? T.indigo : T.card, color: typeFilter === t ? '#fff' : T.textPri, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>{t}</button>
            ))}
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr><Th>Entity</Th><Th>Type</Th><Th>Company</Th><Th>Mentions</Th><Th>Confidence</Th><Th>First Seen</Th></tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <Td><strong>{e.text}</strong></Td>
                    <Td><Badge color={T.indigo}>{e.type}</Badge></Td>
                    <Td>{e.company.slice(0, 18)}</Td>
                    <Td mono right>{e.mentions}</Td>
                    <Td mono right>{(e.confidence * 100).toFixed(0)}%</Td>
                    <Td>{e.firstSeen}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Entity Type Distribution">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={typeCounts} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {typeCounts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 8 }}>
            {typeCounts.map((t, i) => (
              <div key={t.type} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11, borderBottom: `1px solid ${T.borderL}` }}>
                <span style={{ color: PIE_COLORS[i % PIE_COLORS.length], fontWeight: 600 }}>{t.type}</span>
                <span style={{ fontFamily: T.fontMono, color: T.textSec }}>{t.count} entities</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Entity Co-occurrence Matrix (Top 15 Entities)">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 9 }}>
            <thead>
              <tr>
                <th style={{ padding: '4px 6px', background: T.surfaceH, border: `1px solid ${T.border}` }}></th>
                {topCoEnts.map(e => (
                  <th key={e} style={{ padding: '4px 5px', background: T.surfaceH, border: `1px solid ${T.border}`, fontSize: 8, color: T.textSec, writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 65 }}>{e}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topCoEnts.map((e, i) => (
                <tr key={i}>
                  <td style={{ padding: '4px 6px', border: `1px solid ${T.border}`, fontWeight: 600, fontSize: 9, color: T.textSec, whiteSpace: 'nowrap' }}>{e}</td>
                  {coMatrix[i].map((v, j) => (
                    <td key={j} style={{ padding: '4px 6px', border: `1px solid ${T.border}`, background: v > 0 ? `rgba(79,70,229,${(v / 80).toFixed(2)})` : T.sub, textAlign: 'center', fontFamily: T.fontMono, fontSize: 9, color: v > 50 ? '#fff' : v > 20 ? T.indigo : T.textSec }}>
                      {v > 0 ? v : '–'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── TAB 5: Source Intelligence ──────────────────────────────────────────────
function TabSourceIntelligence() {
  const [selectedTier, setSelectedTier] = useState('All');

  const filtered = selectedTier === 'All' ? SOURCES_DATA : SOURCES_DATA.filter(s => s.tier === Number(selectedTier));

  const weightedAvg = SOURCES_DATA.reduce((a, s) => a + s.avgSentiment * s.credWeight, 0) / Math.max(0.01, SOURCES_DATA.reduce((a, s) => a + s.credWeight, 0));
  const rawAvg = SOURCES_DATA.reduce((a, s) => a + s.avgSentiment, 0) / Math.max(1, SOURCES_DATA.length);

  const divergenceData = SOURCES_DATA.map(s => ({
    name: s.name.slice(0, 14),
    raw: s.avgSentiment,
    weighted: Math.round(s.avgSentiment * s.credWeight),
    divergence: parseFloat((s.avgSentiment * s.credWeight - s.avgSentiment).toFixed(1))
  }));

  const tierColors = { 1: T.green, 2: T.teal, 3: T.amber, 4: T.orange, 5: T.red };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <Kpi label="Sources Integrated" value="15" sub="5-tier credibility model" accent={T.indigo} />
        <Kpi label="Weighted Avg Sentiment" value={weightedAvg.toFixed(1)} sub="Credibility-adjusted" accent={T.teal} />
        <Kpi label="Raw Avg Sentiment" value={rawAvg.toFixed(1)} sub="Unweighted average" accent={T.amber} />
        <Kpi label="Bias-Adj Divergence" value={`${(weightedAvg - rawAvg).toFixed(1)} pts`} sub="Weighted vs raw delta" accent={T.gold} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {['All', '1', '2', '3', '4', '5'].map(t => (
          <button key={t} onClick={() => setSelectedTier(t)} style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: selectedTier === t ? T.indigo : T.card, color: selectedTier === t ? '#fff' : T.textPri, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            {t === 'All' ? 'All Tiers' : `Tier ${t}`}
          </button>
        ))}
      </div>

      <Card title="Source Credibility Matrix" style={{ marginBottom: 16 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr><Th>Source</Th><Th>Tier</Th><Th>Articles/Month</Th><Th>Avg Bias</Th><Th>Cred Weight</Th><Th>Avg Sentiment</Th><Th>Weighted Sentiment</Th></tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.name} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                <Td><strong>{s.name}</strong></Td>
                <Td><Badge color={tierColors[s.tier] || T.textSec}>Tier {s.tier}</Badge></Td>
                <Td mono right>{s.articlesMonth.toLocaleString()}</Td>
                <Td mono right style={{ color: Math.abs(s.bias) > 3 ? T.red : Math.abs(s.bias) > 1.5 ? T.amber : T.green }}>{s.bias > 0 ? '+' : ''}{s.bias.toFixed(1)}</Td>
                <Td mono right>{s.credWeight.toFixed(2)}</Td>
                <Td mono right>{s.avgSentiment}</Td>
                <Td mono right style={{ color: T.indigo, fontWeight: 700 }}>{(s.avgSentiment * s.credWeight).toFixed(1)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card title="Raw vs Credibility-Weighted Sentiment by Source">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={divergenceData} margin={{ top: 4, right: 10, bottom: 60, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="raw" name="Raw Sentiment" fill={T.amber + '80'} radius={[3, 3, 0, 0]} />
              <Bar dataKey="weighted" name="Weighted Sentiment" fill={T.indigo} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Credibility Weight vs Articles Volume (Scatter)">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="credWeight" name="Cred Weight" type="number" domain={[0, 1.1]} tick={{ fontSize: 10 }} label={{ value: 'Credibility Weight', position: 'insideBottom', offset: -10, fontSize: 11 }} />
              <YAxis dataKey="articlesMonth" name="Articles/Month" type="number" tick={{ fontSize: 10 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                if (!payload || !payload[0]) return null;
                const d = payload[0].payload;
                return <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', borderRadius: 6, fontSize: 11 }}>
                  <div style={{ fontWeight: 700 }}>{d.name}</div>
                  <div>Cred Weight: {d.credWeight.toFixed(2)}</div>
                  <div>Articles/Mo: {d.articlesMonth.toLocaleString()}</div>
                  <div>Tier: {d.tier}</div>
                </div>;
              }} />
              <Scatter data={SOURCES_DATA} fill={T.indigo}>
                {SOURCES_DATA.map((s, i) => <Cell key={i} fill={tierColors[s.tier] || T.textSec} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

// ─── TAB 6: EWMA Momentum & IC Decay ────────────────────────────────────────
function TabEWMA() {
  const [lambda, setLambda] = useState(0.2);
  const [sortCol, setSortCol] = useState('ewma30');
  const [sortDir, setSortDir] = useState('desc');

  const lambdaOptions = [0.1, 0.2, 0.3];

  const icDecayData = Array.from({ length: 91 }, (_, d) => ({
    day: d,
    ic: parseFloat(Math.max(0.02, 0.25 * Math.exp(-d * 0.025)).toFixed(4)),
    halfLife: parseFloat(Math.max(0.01, 0.25 * Math.exp(-d * 0.04)).toFixed(4)),
    persistent: parseFloat(Math.max(0.02, 0.25 * Math.exp(-d * 0.012)).toFixed(4))
  }));

  const ewmaCompanies = useMemo(() => COMPANIES.slice(0, 40).map((c, i) => {
    const score30 = c.overall;
    const score90 = Math.round(score30 + (-10 + sr(i * 47) * 20));
    const ewma30 = parseFloat((score30 * lambda + score90 * (1 - lambda)).toFixed(1));
    const ewma90 = parseFloat((score30 * 0.1 + score90 * 0.9).toFixed(1));
    const momentumSignal = ewma30 > ewma90 + 3 ? 'Accelerating' : ewma30 < ewma90 - 3 ? 'Decelerating' : 'Stable';
    return { ...c, ewma30, ewma90, momentumSignal };
  }), [lambda]);

  const sortedEWMA = useMemo(() => [...ewmaCompanies].sort((a, b) => sortDir === 'asc' ? (a[sortCol] > b[sortCol] ? 1 : -1) : (a[sortCol] < b[sortCol] ? 1 : -1)), [ewmaCompanies, sortCol, sortDir]);

  const tierDecayData = Array.from({ length: 31 }, (_, d) => ({
    day: d,
    tier1: parseFloat(Math.max(0.03, 0.28 * Math.exp(-d * 0.02)).toFixed(3)),
    tier2: parseFloat(Math.max(0.02, 0.22 * Math.exp(-d * 0.03)).toFixed(3)),
    tier3: parseFloat(Math.max(0.01, 0.18 * Math.exp(-d * 0.045)).toFixed(3)),
    tier5: parseFloat(Math.max(0.005, 0.12 * Math.exp(-d * 0.08)).toFixed(3))
  }));

  const toggleSort = col => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <Kpi label="EWMA λ (selected)" value={lambda} sub="Decay factor" accent={T.indigo} />
        <Kpi label="IC at Day 0" value="0.2500" sub="Signal inception IC" accent={T.teal} />
        <Kpi label="IC Half-Life" value="~27 days" sub="e^(-λt) decay model" accent={T.gold} />
        <Kpi label="IC at Day 90" value="≈0.050" sub="Information decay horizon" accent={T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <SectionLabel>EWMA λ:</SectionLabel>
        {lambdaOptions.map(l => (
          <button key={l} onClick={() => setLambda(l)} style={{ padding: '4px 14px', borderRadius: 6, border: `1px solid ${T.border}`, background: lambda === l ? T.indigo : T.card, color: lambda === l ? '#fff' : T.textPri, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>λ={l}</button>
        ))}
        <span style={{ fontSize: 11, color: T.textSec, marginLeft: 12 }}>Higher λ → faster decay → more responsive to recent data</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <Card title="IC (Information Coefficient) Decay — Days 0→90">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={icDecayData} margin={{ top: 4, right: 20, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} label={{ value: 'Days from publication', position: 'insideBottom', offset: -4, fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v.toFixed(2)} />
              <Tooltip formatter={v => v.toFixed(4)} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine y={0.05} stroke={T.red} strokeDasharray="4 3" label={{ value: 'IC=0.05 threshold', position: 'right', fontSize: 9 }} />
              <Line type="monotone" dataKey="ic" stroke={T.indigo} strokeWidth={2.5} dot={false} name="IC Decay (base)" />
              <Line type="monotone" dataKey="halfLife" stroke={T.red} strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Fast decay (λ=0.04)" />
              <Line type="monotone" dataKey="persistent" stroke={T.green} strokeWidth={1.5} strokeDasharray="2 2" dot={false} name="Slow decay (λ=0.012)" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Signal IC Decay by Source Tier (Days 0→30)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={tierDecayData} margin={{ top: 4, right: 20, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v.toFixed(3)} />
              <Tooltip formatter={v => v.toFixed(4)} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="tier1" stroke={T.green} strokeWidth={2} dot={false} name="Tier 1 (SEC/Bloomberg)" />
              <Line type="monotone" dataKey="tier2" stroke={T.teal} strokeWidth={2} dot={false} name="Tier 2 (GDELT/NGO)" />
              <Line type="monotone" dataKey="tier3" stroke={T.amber} strokeWidth={2} dot={false} name="Tier 3 (Industry)" />
              <Line type="monotone" dataKey="tier5" stroke={T.red} strokeWidth={2} dot={false} name="Tier 5 (Social Media)" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title={`EWMA Momentum Table — λ=${lambda} (30d vs 90d EWMA, top 40 companies)`}>
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <Th>Company</Th>
                <Th>Sector</Th>
                <Th onClick={() => toggleSort('ewma30')} sorted={sortCol === 'ewma30' ? sortDir : null}>EWMA 30d</Th>
                <Th onClick={() => toggleSort('ewma90')} sorted={sortCol === 'ewma90' ? sortDir : null}>EWMA 90d</Th>
                <Th onClick={() => toggleSort('ic')} sorted={sortCol === 'ic' ? sortDir : null}>IC</Th>
                <Th>Momentum Signal</Th>
              </tr>
            </thead>
            <tbody>
              {sortedEWMA.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                  <Td>{c.name}</Td>
                  <Td><Badge color={T.indigo}>{c.sector}</Badge></Td>
                  <Td mono right>{c.ewma30.toFixed(1)}</Td>
                  <Td mono right>{c.ewma90.toFixed(1)}</Td>
                  <Td mono right>{c.ic.toFixed(3)}</Td>
                  <Td>
                    <Badge color={c.momentumSignal === 'Accelerating' ? T.green : c.momentumSignal === 'Decelerating' ? T.red : T.amber}>
                      {c.momentumSignal}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── TAB 7: Alpha Signal Factory ────────────────────────────────────────────
function TabAlphaFactory() {
  const [convictionThreshold, setConvictionThreshold] = useState(50);
  const [sortCol, setSortCol] = useState('ic');
  const [sortDir, setSortDir] = useState('desc');

  const toggleSort = col => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };

  const signalData = useMemo(() => COMPANIES.map(c => ({
    ...c,
    signal: c.overall >= convictionThreshold ? 'Long' : c.overall < (100 - convictionThreshold) ? 'Short' : 'Neutral',
    sharpeE: parseFloat((c.eScore * c.ic * 0.08).toFixed(3)),
    sharpeS: parseFloat((c.sScore * c.ic * 0.05).toFixed(3)),
    sharpeG: parseFloat((c.gScore * c.ic * 0.04).toFixed(3))
  })), [convictionThreshold]);

  const longs = signalData.filter(c => c.signal === 'Long');
  const shorts = signalData.filter(c => c.signal === 'Short');

  const scatterData = COMPANIES.slice(0, 100).map(c => ({ x: c.overall, y: c.priceCorr, name: c.name, sector: c.sector }));

  const pillarSharpe = [
    { pillar: 'Environmental', sharpe: parseFloat((signalData.reduce((a, c) => a + c.sharpeE, 0) / Math.max(1, signalData.length)).toFixed(3)) },
    { pillar: 'Social', sharpe: parseFloat((signalData.reduce((a, c) => a + c.sharpeS, 0) / Math.max(1, signalData.length)).toFixed(3)) },
    { pillar: 'Governance', sharpe: parseFloat((signalData.reduce((a, c) => a + c.sharpeG, 0) / Math.max(1, signalData.length)).toFixed(3)) }
  ];

  const sortedSignal = useMemo(() => [...signalData].sort((a, b) => sortDir === 'asc' ? (a[sortCol] > b[sortCol] ? 1 : -1) : (a[sortCol] < b[sortCol] ? 1 : -1)).slice(0, 40), [signalData, sortCol, sortDir]);

  const portfolioStats = {
    longs: longs.length,
    shorts: shorts.length,
    netExposure: longs.length - shorts.length,
    avgICLong: longs.length ? (longs.reduce((a, c) => a + c.ic, 0) / longs.length).toFixed(3) : '0.000',
    avgICSh: shorts.length ? (shorts.reduce((a, c) => a + c.ic, 0) / shorts.length).toFixed(3) : '0.000'
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <Kpi label="Long Signals" value={portfolioStats.longs} sub={`Avg IC: ${portfolioStats.avgICLong}`} accent={T.green} />
        <Kpi label="Short Signals" value={portfolioStats.shorts} sub={`Avg IC: ${portfolioStats.avgICSh}`} accent={T.red} />
        <Kpi label="Net L/S Exposure" value={portfolioStats.netExposure > 0 ? `+${portfolioStats.netExposure}` : portfolioStats.netExposure} sub="Long minus Short count" accent={T.indigo} />
        <Kpi label="Conviction Threshold" value={convictionThreshold} sub="ESG score cutoff" accent={T.gold} />
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <SectionLabel>Conviction Threshold (ESG Score Cutoff):</SectionLabel>
          <input type="range" min={30} max={75} value={convictionThreshold} onChange={e => setConvictionThreshold(Number(e.target.value))} style={{ flex: 1, accentColor: T.indigo }} />
          <span style={{ fontFamily: T.fontMono, color: T.indigo, fontWeight: 700, minWidth: 30 }}>{convictionThreshold}</span>
        </div>
        <div style={{ fontSize: 11, color: T.textSec, marginTop: 6 }}>
          Long: ESG ≥ {convictionThreshold} &nbsp;|&nbsp; Short: ESG &lt; {100 - convictionThreshold} &nbsp;|&nbsp; Neutral: {100 - convictionThreshold}–{convictionThreshold - 1}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 12, marginBottom: 16 }}>
        <Card title="Sentiment–Price Return Correlation Scatter (100 companies)">
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="x" name="ESG Score" type="number" domain={[15, 95]} tick={{ fontSize: 10 }} label={{ value: 'Avg ESG Score', position: 'insideBottom', offset: -10, fontSize: 10 }} />
              <YAxis dataKey="y" name="3m Price Return (%)" type="number" domain={[-55, 55]} tick={{ fontSize: 10 }} label={{ value: '3m Return (%)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <ReferenceLine y={0} stroke={T.textSec} strokeDasharray="3 3" />
              <ReferenceLine x={convictionThreshold} stroke={T.indigo} strokeDasharray="4 2" />
              <Tooltip content={({ payload }) => {
                if (!payload || !payload[0]) return null;
                const d = payload[0].payload;
                return <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '8px 12px', borderRadius: 6, fontSize: 11 }}>
                  <div style={{ fontWeight: 700 }}>{d.name}</div>
                  <div>ESG: {d.x} | Return: {d.y}%</div>
                  <div style={{ color: T.textSec }}>{d.sector}</div>
                </div>;
              }} />
              <Scatter data={scatterData}>
                {scatterData.map((d, i) => <Cell key={i} fill={d.x >= convictionThreshold ? T.green : d.x < 100 - convictionThreshold ? T.red : T.amber} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Sharpe Contribution by ESG Pillar">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={pillarSharpe} margin={{ top: 8, right: 10, bottom: 8, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="pillar" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => v.toFixed(4)} />
              <Bar dataKey="sharpe" name="Sharpe Contribution" radius={[4, 4, 0, 0]}>
                {pillarSharpe.map((_, i) => <Cell key={i} fill={[T.green, T.blue, T.indigo][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ padding: '8px 10px', background: T.sub, borderRadius: 6, fontSize: 11, color: T.textSec, marginTop: 8 }}>
            Sharpe contribution = pillar_score × IC × Fama-French factor loading proxy. E-pillar dominates due to stronger price co-movement with green transition assets.
          </div>
        </Card>
      </div>

      <Card title="Signal Conviction Table — Sortable by IC, Momentum, Controversy (Top 40)">
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <Th>Company</Th>
                <Th>Signal</Th>
                <Th onClick={() => toggleSort('overall')} sorted={sortCol === 'overall' ? sortDir : null}>ESG</Th>
                <Th onClick={() => toggleSort('ic')} sorted={sortCol === 'ic' ? sortDir : null}>IC</Th>
                <Th onClick={() => toggleSort('controversies')} sorted={sortCol === 'controversies' ? sortDir : null}>Controversies</Th>
                <Th>Momentum</Th>
                <Th onClick={() => toggleSort('priceCorr')} sorted={sortCol === 'priceCorr' ? sortDir : null}>Price Corr</Th>
                <Th>Trend</Th>
              </tr>
            </thead>
            <tbody>
              {sortedSignal.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                  <Td>{c.name}</Td>
                  <Td><Badge color={c.signal === 'Long' ? T.green : c.signal === 'Short' ? T.red : T.amber}>{c.signal}</Badge></Td>
                  <Td mono right>{c.overall}</Td>
                  <Td mono right style={{ color: c.ic > 0.18 ? T.green : c.ic < 0.10 ? T.red : T.amber }}>{c.ic.toFixed(3)}</Td>
                  <Td mono right style={{ color: c.controversies >= 6 ? T.red : c.controversies >= 3 ? T.amber : T.green }}>{c.controversies}</Td>
                  <Td><Badge color={c.momentum === 'Accelerating' ? T.green : c.momentum === 'Decelerating' ? T.red : T.amber}>{c.momentum}</Badge></Td>
                  <Td mono right style={{ color: c.priceCorr >= 0 ? T.green : T.red }}>{c.priceCorr > 0 ? '+' : ''}{c.priceCorr}%</Td>
                  <Td><Badge color={c.trend === 'Improving' ? T.teal : T.red}>{c.trend}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── TAB 8: Data Sources & Integration ──────────────────────────────────────
function TabDataSources() {
  const sources = [
    {
      name: 'GDELT Project',
      endpoint: 'https://api.gdeltproject.org/api/v2/doc/doc?query={TERM}&mode=artlist&format=json',
      format: 'JSON', rateLimit: '~300k articles/day, no hard cap', keyRequired: false,
      useCase: 'Real-time global news monitoring, ESG controversy detection, geopolitical risk signals',
      snippet: `fetch('https://api.gdeltproject.org/api/v2/doc/doc?query=ESG+greenwashing&mode=artlist&format=json')\n  .then(r => r.json()).then(d => d.articles.slice(0,10));`
    },
    {
      name: 'SEC EDGAR Full-Text',
      endpoint: 'https://efts.sec.gov/LATEST/search-index?q="{TERM}"&dateRange=custom&startdt={DATE}',
      format: 'JSON', rateLimit: '10 req/sec', keyRequired: false,
      useCase: '10-K/10-Q climate disclosure mining, TCFD/CSRD language extraction, greenwashing audit',
      snippet: `fetch('https://efts.sec.gov/LATEST/search-index?q="climate+risk"&dateRange=custom&startdt=2025-01-01')\n  .then(r => r.json()).then(d => console.log(d.hits.hits));`
    },
    {
      name: 'OpenAlex Research',
      endpoint: 'https://api.openalex.org/works?search={TERM}&filter=publication_year:>2022',
      format: 'JSON', rateLimit: '100k req/day (free)', keyRequired: false,
      useCase: 'Academic ESG research corpus, FinBERT training signal validation, methodology grounding',
      snippet: `fetch('https://api.openalex.org/works?search=ESG+sentiment+NLP&filter=publication_year:>2023')\n  .then(r => r.json()).then(d => d.results.map(w => w.title));`
    },
    {
      name: 'Alpha Vantage News Sentiment',
      endpoint: 'https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers={TICKER}&apikey={KEY}',
      format: 'JSON', rateLimit: '500 calls/day (free tier)', keyRequired: true,
      useCase: 'Per-ticker news sentiment with ESG relevance scores, pre-computed FinBERT-like scores',
      snippet: `fetch('https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&apikey=YOUR_KEY')\n  .then(r => r.json()).then(d => d.feed.slice(0,5));`
    },
    {
      name: 'World Bank Open Data',
      endpoint: 'https://api.worldbank.org/v2/country/{ISO}/indicator/{CODE}?format=json&mrv=10',
      format: 'JSON', rateLimit: 'Unlimited', keyRequired: false,
      useCase: 'Country ESG indicators: CO2/GDP, renewable energy %, governance index for sovereign ESG',
      snippet: `fetch('https://api.worldbank.org/v2/country/DE/indicator/EN.ATM.CO2E.KT?format=json&mrv=5')\n  .then(r => r.json()).then(([meta, data]) => data.map(d => ({year:d.date,value:d.value})));`
    },
    {
      name: 'UNFCCC NDC Registry',
      endpoint: 'https://unfccc.int/NDCREG/rest/ndcs?country={ISO}',
      format: 'JSON/CSV', rateLimit: 'Low traffic, effectively unlimited', keyRequired: false,
      useCase: 'Country climate commitments for sovereign alignment scoring, NDC ambition tracking',
      snippet: `// NDC documents available at:\n// https://unfccc.int/NDCREG\n// Parse commitment text with FinBERT for ambition scoring`
    },
    {
      name: 'Our World in Data (OWID CO2)',
      endpoint: 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv',
      format: 'CSV', rateLimit: 'GitHub CDN, effectively unlimited', keyRequired: false,
      useCase: 'Country-level CO2 time series for physical risk models, transition pathway benchmarks',
      snippet: `import Papa from 'papaparse';\nfetch('https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv')\n  .then(r => r.text()).then(csv => Papa.parse(csv, {header:true}).data);`
    },
    {
      name: 'HuggingFace FinBERT Inference',
      endpoint: 'https://api-inference.huggingface.co/models/ProsusAI/finbert',
      format: 'JSON', rateLimit: 'Free tier ~30k tokens/month', keyRequired: true,
      useCase: 'Direct FinBERT inference on article text, ESG-BERT via yiyanghkust/finbert-esg',
      snippet: `fetch('https://api-inference.huggingface.co/models/ProsusAI/finbert',{\n  method:'POST',\n  headers:{Authorization:'Bearer HF_TOKEN','Content-Type':'application/json'},\n  body:JSON.stringify({inputs:'Apple announces net-zero target by 2030'})\n}).then(r=>r.json());`
    },
    {
      name: 'NewsAPI.org',
      endpoint: 'https://newsapi.org/v2/everything?q={QUERY}&apiKey={KEY}&language=en&sortBy=publishedAt',
      format: 'JSON', rateLimit: '100 req/day (free dev tier)', keyRequired: true,
      useCase: 'Real-time ESG headline feed, controversy alert monitoring, sentiment trend detection',
      snippet: `fetch('https://newsapi.org/v2/everything?q=ESG+climate+risk&apiKey=YOUR_KEY&language=en')\n  .then(r=>r.json()).then(d=>d.articles.slice(0,20).map(a=>({title:a.title,source:a.source.name})));`
    },
    {
      name: 'ILO ILOSTAT API',
      endpoint: 'https://www.ilo.org/ilostat-files/WEB_bulk_download/indicator/{CODE}.csv.gz',
      format: 'CSV (gzip)', rateLimit: 'Unlimited', keyRequired: false,
      useCase: 'Labor rights indicators for S-pillar scoring: unemployment, child labor, wage data',
      snippet: `// Decompress .gz file in Node.js:\nimport zlib from 'zlib';\nfetch('https://www.ilo.org/ilostat-files/WEB_bulk_download/indicator/EAR_4MTH_SEX_ECO_CUR_NB_A.csv.gz')\n  .then(r=>r.arrayBuffer()).then(buf=>zlib.gunzipSync(Buffer.from(buf)).toString());`
    },
    {
      name: 'CDP Open Data Portal',
      endpoint: 'https://data.cdp.net/api/data/{YEAR}/{DATASET}',
      format: 'CSV/JSON', rateLimit: 'Free on cdp.net for select datasets', keyRequired: false,
      useCase: 'Corporate climate disclosures, water stewardship, forests data for E-pillar enrichment',
      snippet: `// CDP Open Data available at: https://data.cdp.net\n// Download CSV datasets for climate scores, water, forests\n// Key dataset: 2024 Climate Change – Complete Companies`
    },
    {
      name: 'Wikidata API (Entity Disambiguation)',
      endpoint: 'https://www.wikidata.org/w/api.php?action=wbsearchentities&search={ENTITY}&language=en&format=json',
      format: 'JSON', rateLimit: 'Unlimited (bot-compliant)', keyRequired: false,
      useCase: 'Resolve ambiguous entity mentions (e.g. "Apple" → Q312 Apple Inc), canonical IDs for NER',
      snippet: `fetch('https://www.wikidata.org/w/api.php?action=wbsearchentities&search=TotalEnergies&language=en&format=json')\n  .then(r=>r.json()).then(d=>d.search[0]);`
    }
  ];

  const [selected, setSelected] = useState(null);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <Kpi label="Free Data Sources" value="12" sub="Zero cost NLP pipeline" accent={T.indigo} />
        <Kpi label="Paid / Key Required" value="3" sub="Alpha Vantage, HF, News" accent={T.amber} />
        <Kpi label="Total Articles/Day" value="~320k+" sub="GDELT alone" accent={T.teal} />
        <Kpi label="Scholarly Corpus" value="250M+" sub="OpenAlex papers" accent={T.gold} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 12 }}>
        <Card title="Source Catalog (12 Free Public APIs)">
          <div style={{ maxHeight: 620, overflowY: 'auto' }}>
            {sources.map((s, i) => (
              <div key={i} onClick={() => setSelected(selected === i ? null : i)} style={{ padding: '10px 12px', borderBottom: `1px solid ${T.borderL}`, cursor: 'pointer', background: selected === i ? T.indigo + '10' : 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: T.textPri }}>{s.name}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Badge color={s.keyRequired ? T.amber : T.green}>{s.keyRequired ? 'Key Required' : 'No Key'}</Badge>
                    <Badge color={T.indigo}>{s.format}</Badge>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: T.textSec }}>{s.useCase.slice(0, 80)}…</div>
                <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>Rate limit: {s.rateLimit}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={selected !== null ? `Integration Detail: ${sources[selected].name}` : 'Select a source →'}>
          {selected !== null ? (
            <div>
              <div style={{ marginBottom: 12 }}>
                <SectionLabel>API Endpoint Template</SectionLabel>
                <div style={{ padding: '8px 12px', background: T.navy, borderRadius: 6, fontFamily: T.fontMono, fontSize: 11, color: '#7dd3fc', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {sources[selected].endpoint}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={{ padding: '8px', background: T.sub, borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: T.textSec }}>Format</div>
                  <div style={{ fontWeight: 700, color: T.indigo, fontSize: 13 }}>{sources[selected].format}</div>
                </div>
                <div style={{ padding: '8px', background: T.sub, borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: T.textSec }}>API Key</div>
                  <div style={{ fontWeight: 700, color: sources[selected].keyRequired ? T.amber : T.green, fontSize: 13 }}>{sources[selected].keyRequired ? 'Required' : 'Not Required'}</div>
                </div>
                <div style={{ padding: '8px', background: T.sub, borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: T.textSec }}>Rate Limit</div>
                  <div style={{ fontWeight: 600, color: T.textPri, fontSize: 11 }}>{sources[selected].rateLimit.slice(0, 20)}</div>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <SectionLabel>ESG NLP Use Case</SectionLabel>
                <div style={{ fontSize: 12, color: T.textPri, lineHeight: 1.7, padding: '8px 10px', background: T.sub, borderRadius: 6 }}>{sources[selected].useCase}</div>
              </div>
              <div>
                <SectionLabel>Integration Code Snippet</SectionLabel>
                <pre style={{ background: T.navy, color: '#a5f3fc', fontFamily: T.fontMono, fontSize: 11, padding: '12px 14px', borderRadius: 8, overflowX: 'auto', lineHeight: 1.7, margin: 0 }}>
                  {sources[selected].snippet}
                </pre>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: T.textSec, fontSize: 13 }}>
              Click a source in the catalog to view integration details
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SentimentAnalysisPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '16px 28px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, letterSpacing: '0.1em', marginBottom: 4 }}>E120 · ESG AI SENTIMENT INTELLIGENCE</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>Sentiment Analysis Platform</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>FinBERT · BERTopic · NER · IC Decay · EWMA · Alpha Signals · 15 Integrated Sources</div>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8', fontFamily: T.fontMono, flexDirection: 'column', alignItems: 'flex-end' }}>
            <span>200 companies · 100 articles · 20 topics</span>
            <span>λ-EWMA · Fama-French proxy · Softmax logits</span>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '0 20px', display: 'flex', overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            color: tab === i ? T.indigo : T.textSec, whiteSpace: 'nowrap',
            borderBottom: tab === i ? `3px solid ${T.indigo}` : '3px solid transparent',
            transition: 'color 0.15s'
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px' }}>
        {tab === 0 && <TabDashboard />}
        {tab === 1 && <TabFinBERT />}
        {tab === 2 && <TabTopicModeling />}
        {tab === 3 && <TabNER />}
        {tab === 4 && <TabSourceIntelligence />}
        {tab === 5 && <TabEWMA />}
        {tab === 6 && <TabAlphaFactory />}
        {tab === 7 && <TabDataSources />}
      </div>

      {/* Footer */}
      <div style={{ background: T.navy, padding: '10px 28px', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', fontFamily: T.fontMono }}>
        <span>E120 · SENTIMENT INTELLIGENCE · INVESTOR-GRADE NLP ANALYTICS</span>
        <span>FinBERT (ProsusAI) · BERTopic · spaCy NER · EWMA λ-decay · IC=f(t) · Fama-French ESG factor proxy</span>
      </div>
    </div>
  );
}
