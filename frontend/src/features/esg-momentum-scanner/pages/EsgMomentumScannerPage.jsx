import React, { useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  BarChart, Bar, Cell, LineChart, Line, ResponsiveContainer, Legend, Label
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const TABS = [
  'Momentum Overview',
  'Improvers Leaderboard',
  'Controversy Recovery',
  'Sector Rotation',
  'Signal Builder',
  'Engagement Alpha',
];

// ── Tab 1 data ──────────────────────────────────────────────────────────────
const scatterData = [
  { x: 12.1, y: 8.4, name: 'Orsted', q: 'tr' },
  { x: 10.8, y: 6.2, name: 'Vestas', q: 'tr' },
  { x: 9.5,  y: 5.9, name: 'Enel',   q: 'tr' },
  { x: 8.7,  y: 4.1, name: 'Siemens',q: 'tr' },
  { x: 7.2,  y: 3.8, name: 'Iberdrola', q: 'tr' },
  { x: 6.9,  y: -1.2,name: 'Vale',   q: 'br' },
  { x: 5.8,  y: -2.4,name: 'H&M',    q: 'br' },
  { x: 5.1,  y: 1.2, name: 'Danone', q: 'tr' },
  { x: 4.3,  y: 2.7, name: 'Apple',  q: 'tr' },
  { x: 3.2,  y: 0.8, name: 'Barclays', q: 'tr' },
  { x: -2.1, y: -3.4,name: 'Glencore', q: 'bl' },
  { x: -3.5, y: -5.1,name: 'ArcelorMittal', q: 'bl' },
  { x: -4.8, y: -4.3,name: 'Repsol', q: 'bl' },
  { x: -5.2, y: -2.9,name: 'Equinor', q: 'bl' },
  { x: -6.1, y: 1.4, name: 'Samsung SDI', q: 'tl' },
  { x: -7.3, y: 0.9, name: 'Hyundai', q: 'tl' },
  { x: -8.0, y: 2.1, name: 'BNP Paribas', q: 'tl' },
  { x: -9.2, y: -6.8,name: 'Yara',   q: 'bl' },
  { x: 11.4, y: 7.1, name: 'NextEra', q: 'tr' },
  { x: 2.1,  y: -0.5,name: 'VW',     q: 'br' },
];

const topImprovers = ['Orsted','Vestas','Enel','Siemens','Iberdrola'];
const topDeteriorators = ['Yara','ArcelorMittal','Repsol','Equinor','Glencore'];

const qColor = (q) => {
  if (q === 'tr') return T.green;
  if (q === 'br') return T.amber;
  if (q === 'bl') return T.red;
  return T.navyL;
};

// ── Tab 2 data ──────────────────────────────────────────────────────────────
const improversData = [
  { rank:1,  name:'Volkswagen',    sector:'Consumer Disc.',  region:'Europe',      esg:62, esgPrior:48, chg:14.0, ret:6.2,  sig:9.1 },
  { rank:2,  name:'Orsted',        sector:'Utilities',       region:'Europe',      esg:88, esgPrior:75, chg:13.0, ret:8.4,  sig:9.8 },
  { rank:3,  name:'NextEra Energy',sector:'Utilities',       region:'N. America',  esg:85, esgPrior:73, chg:12.0, ret:7.1,  sig:9.4 },
  { rank:4,  name:'Vestas',        sector:'Industrials',     region:'Europe',      esg:84, esgPrior:73, chg:11.0, ret:6.2,  sig:9.0 },
  { rank:5,  name:'Enel',          sector:'Utilities',       region:'Europe',      esg:82, esgPrior:72, chg:10.0, ret:5.9,  sig:8.8 },
  { rank:6,  name:'Siemens',       sector:'Industrials',     region:'Europe',      esg:79, esgPrior:70, chg:9.0,  ret:4.1,  sig:8.3 },
  { rank:7,  name:'Iberdrola',     sector:'Utilities',       region:'Europe',      esg:86, esgPrior:78, chg:8.0,  ret:3.8,  sig:8.0 },
  { rank:8,  name:'Barclays',      sector:'Financials',      region:'Europe',      esg:67, esgPrior:59, chg:8.0,  ret:3.2,  sig:7.6 },
  { rank:9,  name:'Apple',         sector:'Technology',      region:'N. America',  esg:80, esgPrior:73, chg:7.0,  ret:2.7,  sig:7.4 },
  { rank:10, name:'Danone',        sector:'Cons. Staples',   region:'Europe',      esg:74, esgPrior:67, chg:7.0,  ret:2.5,  sig:7.2 },
  { rank:11, name:'H&M',           sector:'Consumer Disc.',  region:'Europe',      esg:65, esgPrior:58, chg:7.0,  ret:-2.4, sig:6.8 },
  { rank:12, name:'Yara',          sector:'Materials',       region:'Europe',      esg:61, esgPrior:55, chg:6.0,  ret:-6.8, sig:6.5 },
  { rank:13, name:'Hyundai',       sector:'Consumer Disc.',  region:'Asia-Pac',    esg:66, esgPrior:60, chg:6.0,  ret:0.9,  sig:6.3 },
  { rank:14, name:'BNP Paribas',   sector:'Financials',      region:'Europe',      esg:72, esgPrior:66, chg:6.0,  ret:1.2,  sig:6.1 },
  { rank:15, name:'Samsung SDI',   sector:'Technology',      region:'Asia-Pac',    esg:70, esgPrior:64, chg:6.0,  ret:1.4,  sig:6.0 },
  { rank:16, name:'Repsol',        sector:'Energy',          region:'Europe',      esg:63, esgPrior:58, chg:5.0,  ret:-4.3, sig:5.7 },
  { rank:17, name:'Vale',          sector:'Materials',       region:'LatAm',       esg:58, esgPrior:53, chg:5.0,  ret:-1.2, sig:5.4 },
  { rank:18, name:'Equinor',       sector:'Energy',          region:'Europe',      esg:69, esgPrior:65, chg:4.0,  ret:-2.9, sig:5.1 },
  { rank:19, name:'Glencore',      sector:'Materials',       region:'Europe',      esg:55, esgPrior:51, chg:4.0,  ret:-3.4, sig:4.8 },
  { rank:20, name:'ArcelorMittal', sector:'Materials',       region:'Europe',      esg:57, esgPrior:54, chg:3.0,  ret:-5.1, sig:4.4 },
];

// ── Tab 3 data ──────────────────────────────────────────────────────────────
const controversyData = [
  { company:'Volkswagen',    type:'Emissions Scandal',    peak:'2015-09', stage:'Late',  esgLow:28, esgNow:62, recPct:87, underperf:-34.2, recRet:18.4 },
  { company:'Glencore',      type:'Corruption',           peak:'2018-06', stage:'Mid',   esgLow:32, esgNow:55, recPct:61, underperf:-22.1, recRet:9.2  },
  { company:'Vale',          type:'Safety Incident',      peak:'2019-01', stage:'Mid',   esgLow:29, esgNow:58, recPct:65, underperf:-28.7, recRet:11.3 },
  { company:'H&M',           type:'Human Rights',         peak:'2020-03', stage:'Mid',   esgLow:38, esgNow:65, recPct:70, underperf:-18.4, recRet:7.8  },
  { company:'Barclays',      type:'Greenwashing',         peak:'2021-04', stage:'Late',  esgLow:42, esgNow:67, recPct:80, underperf:-14.6, recRet:6.1  },
  { company:'Samsung SDI',   type:'Data Breach',          peak:'2021-09', stage:'Early', esgLow:45, esgNow:70, recPct:40, underperf:-11.2, recRet:3.4  },
  { company:'Danone',        type:'Greenwashing',         peak:'2022-02', stage:'Late',  esgLow:48, esgNow:74, recPct:82, underperf:-9.8,  recRet:5.9  },
  { company:'Yara',          type:'Emissions Scandal',    peak:'2022-07', stage:'Early', esgLow:36, esgNow:61, recPct:44, underperf:-16.3, recRet:2.8  },
  { company:'ArcelorMittal', type:'Safety Incident',      peak:'2022-11', stage:'Early', esgLow:33, esgNow:57, recPct:38, underperf:-20.4, recRet:2.1  },
  { company:'Repsol',        type:'Greenwashing',         peak:'2023-03', stage:'Early', esgLow:41, esgNow:63, recPct:35, underperf:-8.7,  recRet:1.9  },
  { company:'BNP Paribas',   type:'Corruption',           peak:'2023-08', stage:'Early', esgLow:47, esgNow:72, recPct:30, underperf:-7.2,  recRet:1.4  },
  { company:'Hyundai',       type:'Supply Chain',         peak:'2023-11', stage:'Early', esgLow:43, esgNow:66, recPct:28, underperf:-6.1,  recRet:1.1  },
];

const vwTimeline = [
  { year:'2015 Q3', esg:28, event:'Dieselgate Scandal' },
  { year:'2016 Q1', esg:31, event:null },
  { year:'2016 Q3', esg:34, event:'$4.3bn fine settled' },
  { year:'2017 Q1', esg:38, event:null },
  { year:'2017 Q3', esg:41, event:null },
  { year:'2018 Q1', esg:45, event:'New CEO pledge' },
  { year:'2018 Q3', esg:48, event:null },
  { year:'2019 Q1', esg:51, event:'EV roadmap published' },
  { year:'2019 Q3', esg:53, event:null },
  { year:'2020 Q1', esg:55, event:null },
  { year:'2020 Q3', esg:57, event:'ID.3 launch' },
  { year:'2021 Q1', esg:58, event:null },
  { year:'2021 Q3', esg:60, event:null },
  { year:'2022 Q1', esg:61, event:'Net-zero 2050 target' },
  { year:'2022 Q3', esg:62, event:null },
  { year:'2023 Q1', esg:63, event:null },
  { year:'2023 Q3', esg:64, event:null },
  { year:'2024 Q1', esg:62, event:null },
];

// ── Tab 4 data ──────────────────────────────────────────────────────────────
const sectorData = [
  { sector:'Utilities',       momentum:8.2,  improving:42, deteriorating:8,  signal:'Bullish' },
  { sector:'Technology',      momentum:6.1,  improving:38, deteriorating:12, signal:'Bullish' },
  { sector:'Health Care',     momentum:4.3,  improving:29, deteriorating:11, signal:'Bullish' },
  { sector:'Real Estate',     momentum:3.2,  improving:18, deteriorating:9,  signal:'Neutral' },
  { sector:'Materials',       momentum:2.8,  improving:22, deteriorating:14, signal:'Neutral' },
  { sector:'Cons. Staples',   momentum:2.1,  improving:20, deteriorating:13, signal:'Neutral' },
  { sector:'Financials',      momentum:1.4,  improving:24, deteriorating:18, signal:'Neutral' },
  { sector:'Industrials',     momentum:0.8,  improving:19, deteriorating:16, signal:'Neutral' },
  { sector:'Consumer Disc.',  momentum:-1.2, improving:15, deteriorating:22, signal:'Bearish' },
  { sector:'Communication',   momentum:-2.3, improving:12, deteriorating:20, signal:'Bearish' },
  { sector:'Energy',          momentum:-3.1, improving:9,  deteriorating:28, signal:'Bearish' },
];

const momentumColor = (m) => {
  if (m >= 6) return '#166534';
  if (m >= 3) return T.green;
  if (m >= 1) return T.sage;
  if (m >= -1) return T.amber;
  if (m >= -2) return '#ea580c';
  return T.red;
};

// ── Tab 5 data ──────────────────────────────────────────────────────────────
const icHistory = [
  {m:'Mar-23',ic:0.06},{m:'Apr-23',ic:0.07},{m:'May-23',ic:0.09},{m:'Jun-23',ic:0.08},
  {m:'Jul-23',ic:0.07},{m:'Aug-23',ic:0.10},{m:'Sep-23',ic:0.08},{m:'Oct-23',ic:0.09},
  {m:'Nov-23',ic:0.07},{m:'Dec-23',ic:0.08},{m:'Jan-24',ic:0.09},{m:'Feb-24',ic:0.10},
  {m:'Mar-24',ic:0.07},{m:'Apr-24',ic:0.08},{m:'May-24',ic:0.09},{m:'Jun-24',ic:0.11},
  {m:'Jul-24',ic:0.08},{m:'Aug-24',ic:0.09},{m:'Sep-24',ic:0.10},{m:'Oct-24',ic:0.08},
  {m:'Nov-24',ic:0.09},{m:'Dec-24',ic:0.10},{m:'Jan-25',ic:0.08},{m:'Feb-25',ic:0.09},
  {m:'Mar-25',ic:0.08},{m:'Apr-25',ic:0.10},{m:'May-25',ic:0.09},{m:'Jun-25',ic:0.11},
  {m:'Jul-25',ic:0.08},{m:'Aug-25',ic:0.09},{m:'Sep-25',ic:0.10},{m:'Oct-25',ic:0.08},
  {m:'Nov-25',ic:0.09},{m:'Dec-25',ic:0.10},{m:'Jan-26',ic:0.09},{m:'Feb-26',ic:0.08},
];

const subcomponentAlpha = [
  { name:'E Momentum', ic:0.10, alpha:1.8 },
  { name:'S Momentum', ic:0.06, alpha:1.0 },
  { name:'G Momentum', ic:0.07, alpha:0.6 },
];

// ── Tab 6 data ──────────────────────────────────────────────────────────────
const engagementCases = [
  { company:'Orsted',        start:'2020-01', issue:'Climate Target',  months:18, esgBefore:64, esgAfter:88, retVsBench:9.2  },
  { company:'Enel',          start:'2020-06', issue:'Board Diversity', months:12, esgBefore:68, esgAfter:82, retVsBench:7.4  },
  { company:'Danone',        start:'2021-02', issue:'Supply Chain',    months:14, esgBefore:58, esgAfter:74, retVsBench:5.9  },
  { company:'Apple',         start:'2021-07', issue:'Water Risk',      months:10, esgBefore:68, esgAfter:80, retVsBench:4.8  },
  { company:'Barclays',      start:'2022-01', issue:'Exec Pay',        months:8,  esgBefore:55, esgAfter:67, retVsBench:3.7  },
  { company:'Siemens',       start:'2022-05', issue:'Biodiversity',    months:11, esgBefore:66, esgAfter:79, retVsBench:5.1  },
  { company:'BNP Paribas',   start:'2023-03', issue:'Lobbying',        months:9,  esgBefore:61, esgAfter:72, retVsBench:4.2  },
  { company:'Hyundai',       start:'2023-09', issue:'Tax Transparency', months:7, esgBefore:57, esgAfter:66, retVsBench:2.8  },
];

const engagementPipeline = [
  { company:'Volkswagen',    issue:'Scope 3 Targets',    stage:'Active',    progress:55 },
  { company:'Glencore',      issue:'Human Rights',       stage:'Committed', progress:75 },
  { company:'Vale',          issue:'Tailings Safety',    stage:'Active',    progress:40 },
  { company:'Yara',          issue:'Nitrogen Emissions', stage:'Initial',   progress:20 },
  { company:'ArcelorMittal', issue:'Green Steel Plan',   stage:'Initial',   progress:15 },
  { company:'Repsol',        issue:'Methane Reporting',  stage:'Active',    progress:50 },
];

const stageColor = (s) => {
  if (s === 'Resolved')  return T.green;
  if (s === 'Committed') return T.sage;
  if (s === 'Active')    return T.navyL;
  return T.textMut;
};

// ── Shared components ────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, color }) => (
  <div style={{
    background: T.surface, border:`1px solid ${T.border}`, borderRadius:10,
    padding:'18px 22px', boxShadow: T.card, flex:'1 1 160px',
  }}>
    <div style={{ fontSize:11, color: T.textMut, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:28, fontWeight:700, color: color || T.navy, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:12, color: T.textSec, marginTop:6 }}>{sub}</div>}
  </div>
);

const SectionHeader = ({ title, subtitle }) => (
  <div style={{ marginBottom:20 }}>
    <div style={{ fontSize:16, fontWeight:700, color: T.navy }}>{title}</div>
    {subtitle && <div style={{ fontSize:13, color: T.textSec, marginTop:3 }}>{subtitle}</div>}
  </div>
);

const Badge = ({ label, color }) => (
  <span style={{
    background: color ? `${color}18` : `${T.navy}12`,
    color: color || T.navy,
    border: `1px solid ${color || T.navy}30`,
    borderRadius:20, padding:'3px 10px', fontSize:12, fontWeight:600, marginRight:6, marginBottom:6, display:'inline-block',
  }}>{label}</span>
);

const SignalBadge = ({ signal }) => {
  const color = signal === 'Bullish' ? T.green : signal === 'Bearish' ? T.red : T.amber;
  return <Badge label={signal} color={color} />;
};

// ── Custom scatter dot ───────────────────────────────────────────────────────
const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  return <circle cx={cx} cy={cy} r={6} fill={qColor(payload.q)} fillOpacity={0.8} stroke="#fff" strokeWidth={1.5} />;
};

const CustomScatterTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'10px 14px', fontSize:12 }}>
      <div style={{ fontWeight:700, color: T.navy, marginBottom:4 }}>{d.name}</div>
      <div style={{ color: T.textSec }}>ESG Δ 12m: <b style={{ color: d.x >= 0 ? T.green : T.red }}>{d.x > 0 ? '+' : ''}{d.x} pts</b></div>
      <div style={{ color: T.textSec }}>Stock 3m: <b style={{ color: d.y >= 0 ? T.green : T.red }}>{d.y > 0 ? '+' : ''}{d.y}%</b></div>
    </div>
  );
};

// ── Tab 1 ────────────────────────────────────────────────────────────────────
const MomentumOverview = () => (
  <div>
    <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:28 }}>
      <KpiCard label="Universe Scanned"    value="2,400"  sub="Global companies"        color={T.navy} />
      <KpiCard label="Top Improvers"       value="147"    sub="ESG score up ≥3pts"      color={T.green} />
      <KpiCard label="Top Deteriorators"   value="89"     sub="ESG score down ≥3pts"    color={T.red} />
      <KpiCard label="Net Positive Signal" value="+58"    sub="vs prior quarter"        color={T.sage} />
    </div>

    <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'24px', marginBottom:24, boxShadow: T.card }}>
      <SectionHeader
        title="ESG Momentum vs. Stock Performance"
        subtitle="Top ESG improvers (quintile 1) outperform by +4.2% annualized. Bubble color = quadrant."
      />
      <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:12 }}>
        {[
          { label:'ESG Improver Outperformers', color: T.green },
          { label:'ESG Improver Laggards',      color: T.amber },
          { label:'ESG Deteriorator Under.',    color: T.red   },
          { label:'ESG Deteriorator Resilient', color: T.navyL },
        ].map(l => <Badge key={l.label} label={l.label} color={l.color} />)}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top:10, right:30, bottom:30, left:10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
          <XAxis type="number" dataKey="x" domain={[-12,14]} tick={{ fontSize:11 }} stroke={T.borderL}>
            <Label value="12-Month ESG Score Change (pts)" position="insideBottom" offset={-15} fontSize={11} fill={T.textSec} />
          </XAxis>
          <YAxis type="number" dataKey="y" domain={[-10,12]} tick={{ fontSize:11 }} stroke={T.borderL}>
            <Label value="3-Month Stock Return (%)" angle={-90} position="insideLeft" offset={15} fontSize={11} fill={T.textSec} />
          </YAxis>
          <ReferenceLine x={0} stroke={T.borderL} strokeDasharray="4 4" />
          <ReferenceLine y={0} stroke={T.borderL} strokeDasharray="4 4" />
          <Tooltip content={<CustomScatterTooltip />} />
          <Scatter data={scatterData} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'18px 22px', boxShadow: T.card }}>
        <div style={{ fontSize:13, fontWeight:700, color: T.green, marginBottom:10 }}>Top 5 Improvers</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {topImprovers.map(n => <Badge key={n} label={n} color={T.green} />)}
        </div>
      </div>
      <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'18px 22px', boxShadow: T.card }}>
        <div style={{ fontSize:13, fontWeight:700, color: T.red, marginBottom:10 }}>Top 5 Deteriorators</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {topDeteriorators.map(n => <Badge key={n} label={n} color={T.red} />)}
        </div>
      </div>
    </div>
  </div>
);

// ── Tab 2 ────────────────────────────────────────────────────────────────────
const [sortCol, setSortColState] = [null, () => {}]; // placeholder — using useState inside component

const ImprovLeaderboard = () => {
  const [sort, setSort] = useState({ col:'rank', dir:1 });
  const sorted = [...improversData].sort((a, b) => {
    const av = a[sort.col]; const bv = b[sort.col];
    return typeof av === 'string' ? av.localeCompare(bv) * sort.dir : (av - bv) * sort.dir;
  });
  const top10 = improversData.slice(0, 10);

  const thStyle = (col) => ({
    padding:'8px 10px', fontSize:11, fontWeight:700, color: T.textSec,
    textAlign:'left', background: T.surfaceH, cursor:'pointer', userSelect:'none',
    borderBottom:`2px solid ${sort.col === col ? T.navy : T.border}`,
    whiteSpace:'nowrap',
  });
  const tdStyle = { padding:'8px 10px', fontSize:12, color: T.text, borderBottom:`1px solid ${T.border}` };

  const handleSort = (col) => setSort(s => ({ col, dir: s.col === col ? -s.dir : 1 }));

  return (
    <div>
      <SectionHeader title="Top 20 ESG Improvers Leaderboard" subtitle="Ranked by 12-month ESG score change. Click column header to sort." />

      <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:24, marginBottom:24, boxShadow: T.card }}>
        <SectionHeader title="Top 10 by Momentum Signal Strength" />
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={top10} margin={{ top:5, right:20, bottom:40, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize:10, angle:-35, textAnchor:'end' }} stroke={T.borderL} interval={0} />
            <YAxis domain={[0,10]} tick={{ fontSize:11 }} stroke={T.borderL} />
            <Tooltip formatter={(v) => [`${v}`, 'Signal Strength']} />
            <Bar dataKey="sig" radius={[4,4,0,0]}>
              {top10.map((e, i) => <Cell key={i} fill={i < 3 ? T.green : i < 7 ? T.sage : T.navyL} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:'auto', boxShadow: T.card }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr>
              {[['rank','#'],['name','Company'],['sector','Sector'],['region','Region'],
                ['esg','ESG Now'],['esgPrior','ESG 12m Ago'],['chg','Δ (pts)'],['ret','3m Ret %'],['sig','Signal']
              ].map(([col,label]) => (
                <th key={col} style={thStyle(col)} onClick={() => handleSort(col)}>
                  {label}{sort.col === col ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.rank} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={tdStyle}><b style={{ color: T.textMut }}>{r.rank}</b></td>
                <td style={{ ...tdStyle, fontWeight:600, color: T.navy }}>{r.name}</td>
                <td style={{ ...tdStyle, color: T.textSec }}>{r.sector}</td>
                <td style={{ ...tdStyle, color: T.textSec }}>{r.region}</td>
                <td style={{ ...tdStyle, fontWeight:600 }}>{r.esg}</td>
                <td style={tdStyle}>{r.esgPrior}</td>
                <td style={{ ...tdStyle, fontWeight:700, color: r.chg >= 0 ? T.green : T.red }}>
                  {r.chg > 0 ? '+' : ''}{r.chg.toFixed(1)}
                </td>
                <td style={{ ...tdStyle, fontWeight:600, color: r.ret >= 0 ? T.green : T.red }}>
                  {r.ret > 0 ? '+' : ''}{r.ret}%
                </td>
                <td style={tdStyle}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:48, height:6, borderRadius:3, background: T.borderL, overflow:'hidden' }}>
                      <div style={{ width:`${r.sig * 10}%`, height:'100%', background: r.sig >= 8 ? T.green : r.sig >= 6 ? T.sage : T.amber, borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:11, color: T.textSec }}>{r.sig.toFixed(1)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Tab 3 ────────────────────────────────────────────────────────────────────
const ControversyRecovery = () => {
  const stageOrder = { Late:0, Mid:1, Early:2 };
  const lateAlpha = 6.8;

  return (
    <div>
      <SectionHeader title="Controversy Recovery Analytics" subtitle="Companies recovering from ESG controversies. Late-stage recoveries generate +6.8% alpha on average." />

      <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:24 }}>
        <KpiCard label="Companies Tracked"    value="12"    sub="Active controversy recovery" color={T.navy} />
        <KpiCard label="Late-Stage Alpha"     value="+6.8%" sub="Avg outperformance"         color={T.green} />
        <KpiCard label="Avg ESG Recovery"     value="+28pts" sub="Peak low to current"        color={T.sage} />
        <KpiCard label="Avg Underperf. Nadir" value="-16.8%" sub="During controversy peak"    color={T.red} />
      </div>

      <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:'auto', marginBottom:24, boxShadow: T.card }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Company','Controversy','Peak Date','Stage','ESG Low','ESG Now','Recovery %','Underperf.','Rec. Return'].map(h => (
                <th key={h} style={{ padding:'9px 12px', fontSize:11, fontWeight:700, color: T.textSec, textAlign:'left', borderBottom:`2px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...controversyData].sort((a,b) => (stageOrder[a.stage]??3) - (stageOrder[b.stage]??3)).map((r, i) => {
              const stageCol = r.stage === 'Late' ? T.green : r.stage === 'Mid' ? T.amber : T.textMut;
              return (
                <tr key={r.company} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding:'8px 12px', fontWeight:600, color: T.navy, borderBottom:`1px solid ${T.border}` }}>{r.company}</td>
                  <td style={{ padding:'8px 12px', color: T.textSec, borderBottom:`1px solid ${T.border}` }}>{r.type}</td>
                  <td style={{ padding:'8px 12px', color: T.textSec, borderBottom:`1px solid ${T.border}` }}>{r.peak}</td>
                  <td style={{ padding:'8px 12px', borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ background:`${stageCol}18`, color: stageCol, border:`1px solid ${stageCol}40`, borderRadius:20, padding:'2px 9px', fontSize:11, fontWeight:600 }}>{r.stage}</span>
                  </td>
                  <td style={{ padding:'8px 12px', color: T.red, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{r.esgLow}</td>
                  <td style={{ padding:'8px 12px', color: T.green, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{r.esgNow}</td>
                  <td style={{ padding:'8px 12px', borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:50, height:6, borderRadius:3, background: T.borderL, overflow:'hidden' }}>
                        <div style={{ width:`${r.recPct}%`, height:'100%', background: r.recPct >= 80 ? T.green : r.recPct >= 50 ? T.amber : T.navyL, borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:11, color: T.textSec }}>{r.recPct}%</span>
                    </div>
                  </td>
                  <td style={{ padding:'8px 12px', color: T.red, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{r.underperf}%</td>
                  <td style={{ padding:'8px 12px', color: T.green, fontWeight:700, borderBottom:`1px solid ${T.border}` }}>+{r.recRet}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:24, boxShadow: T.card }}>
        <SectionHeader title="Volkswagen ESG Recovery Trajectory (2015–2024)" subtitle="ESG score since Dieselgate scandal with key milestones marked." />
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={vwTimeline} margin={{ top:10, right:30, bottom:10, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="year" tick={{ fontSize:10, angle:-30, textAnchor:'end' }} stroke={T.borderL} interval={2} />
            <YAxis domain={[20,70]} tick={{ fontSize:11 }} stroke={T.borderL} />
            <Tooltip formatter={(v) => [`${v}`, 'ESG Score']} labelStyle={{ color: T.navy, fontWeight:600 }} />
            <Line type="monotone" dataKey="esg" stroke={T.navyL} strokeWidth={2.5} dot={(p) => {
              const d = p.payload;
              if (!d.event) return <circle key={p.key} cx={p.cx} cy={p.cy} r={3} fill={T.navyL} />;
              return (
                <g key={p.key}>
                  <circle cx={p.cx} cy={p.cy} r={6} fill={T.gold} stroke="#fff" strokeWidth={1.5} />
                </g>
              );
            }} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontSize:12, color: T.textSec, marginTop:8 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background: T.gold, display:'inline-block' }} />
            Gold dots = key milestones: Scandal (2015), Settlements, EV Launches, Net-zero pledge
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Tab 4 ────────────────────────────────────────────────────────────────────
const SectorRotation = () => {
  const overweights  = sectorData.filter(s => s.signal === 'Bullish').slice(0,3);
  const underweights = sectorData.filter(s => s.signal === 'Bearish').slice(0,2);

  return (
    <div>
      <SectionHeader title="Sector ESG Momentum Heat Map" subtitle="6-month ESG momentum score by GICS sector. Color intensity = signal strength." />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:28 }}>
        {sectorData.map(s => {
          const col = momentumColor(s.momentum);
          return (
            <div key={s.sector} style={{
              background: `${col}14`, border:`1.5px solid ${col}50`, borderRadius:10, padding:'14px 16px',
              display:'flex', flexDirection:'column', gap:6,
            }}>
              <div style={{ fontSize:12, fontWeight:700, color: T.navy }}>{s.sector}</div>
              <div style={{ fontSize:24, fontWeight:800, color: col, lineHeight:1 }}>
                {s.momentum > 0 ? '+' : ''}{s.momentum.toFixed(1)}
              </div>
              <div style={{ fontSize:11, color: T.textSec }}>
                ↑{s.improving} improving &nbsp;|&nbsp; ↓{s.deteriorating} det.
              </div>
              <SignalBadge signal={s.signal} />
            </div>
          );
        })}
      </div>

      <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:24, marginBottom:20, boxShadow: T.card }}>
        <SectionHeader title="Sector Momentum Bar Chart" />
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={[...sectorData].sort((a,b) => b.momentum - a.momentum)} layout="vertical" margin={{ top:5, right:30, bottom:5, left:120 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} horizontal={false} />
            <XAxis type="number" domain={[-5,10]} tick={{ fontSize:11 }} stroke={T.borderL} />
            <YAxis type="category" dataKey="sector" tick={{ fontSize:11 }} stroke={T.borderL} width={115} />
            <ReferenceLine x={0} stroke={T.borderL} strokeDasharray="4 4" />
            <Tooltip formatter={(v) => [`${v > 0 ? '+' : ''}${v.toFixed(1)} pts`, 'Momentum']} />
            <Bar dataKey="momentum" radius={[0,4,4,0]}>
              {[...sectorData].sort((a,b) => b.momentum - a.momentum).map((e, i) => (
                <Cell key={i} fill={momentumColor(e.momentum)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background:`${T.green}0e`, border:`1.5px solid ${T.green}40`, borderRadius:12, padding:'18px 22px' }}>
          <div style={{ fontSize:13, fontWeight:700, color: T.green, marginBottom:10 }}>Recommended Overweights</div>
          {overweights.map(s => (
            <div key={s.sector} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:13, color: T.navy, fontWeight:600 }}>{s.sector}</span>
              <span style={{ fontSize:13, color: T.green, fontWeight:700 }}>+{s.momentum.toFixed(1)} pts</span>
            </div>
          ))}
        </div>
        <div style={{ background:`${T.red}0e`, border:`1.5px solid ${T.red}40`, borderRadius:12, padding:'18px 22px' }}>
          <div style={{ fontSize:13, fontWeight:700, color: T.red, marginBottom:10 }}>Recommended Underweights</div>
          {underweights.map(s => (
            <div key={s.sector} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:13, color: T.navy, fontWeight:600 }}>{s.sector}</span>
              <span style={{ fontSize:13, color: T.red, fontWeight:700 }}>{s.momentum.toFixed(1)} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Tab 5 ────────────────────────────────────────────────────────────────────
const SignalBuilder = () => {
  const [eW, setEW] = useState(40);
  const [sW, setSW] = useState(30);
  const [gW, setGW] = useState(30);
  const [lookback, setLookback] = useState('6m');
  const [threshold, setThreshold] = useState(3);
  const [minCap, setMinCap] = useState(2);

  const ic   = (0.08 * (eW / 40 + (30 - Math.abs(sW - 30)) / 30 + (30 - Math.abs(gW - 30)) / 30) / 3).toFixed(2);
  const ir   = (ic * 7.75).toFixed(2);
  const hit  = Math.min(65, Math.round(58 + (eW - 40) / 10));
  const alpha = (ic * 42.5).toFixed(1);

  const Slider = ({ label, value, onChange, min, max, suffix }) => (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <span style={{ fontSize:12, color: T.textSec, fontWeight:600 }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:700, color: T.navy }}>{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width:'100%', accentColor: T.navy }} />
    </div>
  );

  return (
    <div>
      <SectionHeader title="Custom ESG Momentum Signal Builder" subtitle="Adjust weights and parameters to construct your composite ESG momentum signal." />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'22px 24px', boxShadow: T.card }}>
          <div style={{ fontSize:14, fontWeight:700, color: T.navy, marginBottom:16 }}>Signal Configuration</div>
          <Slider label="E Momentum Weight" value={eW} onChange={setEW} min={10} max={80} suffix="%" />
          <Slider label="S Momentum Weight" value={sW} onChange={setSW} min={10} max={60} suffix="%" />
          <Slider label="G Momentum Weight" value={gW} onChange={setGW} min={10} max={60} suffix="%" />
          <Slider label="Min Score Improvement Threshold" value={threshold} onChange={setThreshold} min={1} max={10} suffix=" pts" />
          <Slider label="Min Market Cap Filter" value={minCap} onChange={setMinCap} min={0.5} max={20} suffix=" $bn" />
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color: T.textSec, fontWeight:600, marginBottom:6 }}>Lookback Period</div>
            <div style={{ display:'flex', gap:8 }}>
              {['3m','6m','12m'].map(p => (
                <button key={p} onClick={() => setLookback(p)} style={{
                  flex:1, padding:'7px 0', borderRadius:7, border:`1.5px solid ${lookback === p ? T.navy : T.border}`,
                  background: lookback === p ? T.navy : T.surface, color: lookback === p ? '#fff' : T.textSec,
                  fontWeight:600, fontSize:13, cursor:'pointer',
                }}>{p}</button>
              ))}
            </div>
          </div>
          <div style={{ fontSize:11, color: T.textMut }}>E + S + G weights: {eW + sW + gW}% (ideal = 100%)</div>
        </div>

        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            <KpiCard label="IC (Info. Coeff.)"  value={ic}      sub="Higher = better predictive power" color={T.navy} />
            <KpiCard label="IR"                  value={ir}      sub="Information ratio"               color={T.navyL} />
            <KpiCard label="Hit Rate"            value={`${hit}%`} sub="% signals correct"            color={T.sage} />
            <KpiCard label="Annualized Alpha"    value={`+${alpha}%`} sub="Back-tested 3yr"            color={T.green} />
          </div>

          <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'16px 18px', boxShadow: T.card }}>
            <div style={{ fontSize:13, fontWeight:700, color: T.navy, marginBottom:12 }}>Sub-component Alpha Attribution</div>
            {subcomponentAlpha.map(c => (
              <div key={c.name} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, color: T.textSec, fontWeight:600 }}>{c.name}</span>
                  <span style={{ fontSize:12, fontWeight:700, color: T.navy }}>IC {c.ic} | +{c.alpha}% alpha</span>
                </div>
                <div style={{ height:6, borderRadius:3, background: T.borderL, overflow:'hidden' }}>
                  <div style={{ width:`${c.ic * 500}%`, height:'100%', background: c.name.startsWith('E') ? T.green : c.name.startsWith('G') ? T.navyL : T.sage, borderRadius:3 }} />
                </div>
              </div>
            ))}
            <div style={{ fontSize:11, color: T.textMut, marginTop:8 }}>Environmental momentum drives the most alpha (IC 0.10)</div>
          </div>
        </div>
      </div>

      <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:24, boxShadow: T.card }}>
        <SectionHeader title="Signal IC Over Time (Monthly, 3 Years)" subtitle="Consistent positive information coefficient — signal remains structurally valid." />
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={icHistory} margin={{ top:5, right:30, bottom:5, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="m" tick={{ fontSize:10, angle:-30, textAnchor:'end' }} stroke={T.borderL} interval={5} />
            <YAxis domain={[0, 0.15]} tick={{ fontSize:11 }} stroke={T.borderL} />
            <ReferenceLine y={0.08} stroke={T.gold} strokeDasharray="4 4" label={{ value:'Avg IC 0.08', position:'right', fontSize:11, fill: T.gold }} />
            <Tooltip formatter={(v) => [v.toFixed(3), 'Monthly IC']} />
            <Line type="monotone" dataKey="ic" stroke={T.navy} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ── Tab 6 ────────────────────────────────────────────────────────────────────
const EngagementAlpha = () => (
  <div>
    <SectionHeader title="Engagement Alpha Analytics" subtitle="Active engagement drives ESG improvements and generates measurable alpha." />

    <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:24 }}>
      <KpiCard label="Avg ESG Improvement"   value="+12.3 pts" sub="From engagement"        color={T.green} />
      <KpiCard label="Avg Stock Outperform." value="+5.7%"     sub="12m post-improvement"   color={T.sage} />
      <KpiCard label="Case Studies"          value="8"         sub="Completed engagements"  color={T.navy} />
      <KpiCard label="Active Pipeline"       value="6"         sub="Ongoing engagements"    color={T.navyL} />
    </div>

    <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:24, marginBottom:24, boxShadow: T.card }}>
      <SectionHeader title="Engagement Case Studies" subtitle="Completed engagements with ESG and return outcomes." />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
        {engagementCases.map(c => {
          const improvement = c.esgAfter - c.esgBefore;
          return (
            <div key={c.company} style={{
              border:`1px solid ${T.border}`, borderRadius:10, padding:'16px 18px',
              background: T.surfaceH,
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color: T.navy }}>{c.company}</div>
                  <div style={{ fontSize:11, color: T.textMut, marginTop:2 }}>Started {c.start} · {c.months}m engagement</div>
                </div>
                <Badge label={c.issue} color={T.navyL} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:10 }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:11, color: T.textMut }}>ESG Before</div>
                  <div style={{ fontSize:18, fontWeight:700, color: T.red }}>{c.esgBefore}</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:11, color: T.textMut }}>ESG After</div>
                  <div style={{ fontSize:18, fontWeight:700, color: T.green }}>{c.esgAfter}</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:11, color: T.textMut }}>Improvement</div>
                  <div style={{ fontSize:18, fontWeight:700, color: T.green }}>+{improvement}</div>
                </div>
              </div>
              <div style={{ marginTop:10, padding:'8px 12px', background:`${T.green}10`, borderRadius:8 }}>
                <div style={{ fontSize:12, color: T.textSec }}>
                  Stock outperformance vs benchmark:&nbsp;
                  <b style={{ color: T.green }}>+{c.retVsBench}%</b>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:24, marginBottom:24, boxShadow: T.card }}>
      <SectionHeader title="ESG Improvement vs. Stock Outperformance" subtitle="Correlation between engagement-driven ESG gains and subsequent alpha." />
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={engagementCases} margin={{ top:5, right:30, bottom:40, left:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} vertical={false} />
          <XAxis dataKey="company" tick={{ fontSize:10, angle:-30, textAnchor:'end' }} stroke={T.borderL} interval={0} />
          <YAxis yAxisId="left" tick={{ fontSize:11 }} stroke={T.borderL} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11 }} stroke={T.borderL} />
          <Tooltip />
          <Legend verticalAlign="top" wrapperStyle={{ fontSize:12 }} />
          <Bar yAxisId="left"  dataKey="retVsBench" name="Stock Outperf. %" fill={T.green}  radius={[4,4,0,0]} />
          <Bar yAxisId="right" dataKey={(d) => d.esgAfter - d.esgBefore} name="ESG Improvement (pts)" fill={T.navyL} radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:24, boxShadow: T.card }}>
      <SectionHeader title="Active Engagement Pipeline" subtitle="Companies currently under engagement — progress toward resolution." />
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {engagementPipeline.map(p => {
          const col = stageColor(p.stage);
          return (
            <div key={p.company} style={{ display:'flex', alignItems:'center', gap:16, padding:'12px 16px', background: T.surfaceH, borderRadius:9, border:`1px solid ${T.border}` }}>
              <div style={{ flex:'0 0 140px' }}>
                <div style={{ fontSize:13, fontWeight:700, color: T.navy }}>{p.company}</div>
                <div style={{ fontSize:11, color: T.textSec }}>{p.issue}</div>
              </div>
              <div style={{ flex:'0 0 90px' }}>
                <span style={{ background:`${col}18`, color: col, border:`1px solid ${col}40`, borderRadius:20, padding:'2px 9px', fontSize:11, fontWeight:600 }}>{p.stage}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:11, color: T.textMut }}>Progress</span>
                  <span style={{ fontSize:11, fontWeight:700, color: T.navy }}>{p.progress}%</span>
                </div>
                <div style={{ height:7, borderRadius:4, background: T.borderL, overflow:'hidden' }}>
                  <div style={{ width:`${p.progress}%`, height:'100%', background: col, borderRadius:4, transition:'width 0.4s ease' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// ── Main Page ────────────────────────────────────────────────────────────────
export default function EsgMomentumScannerPage() {
  const [activeTab, setActiveTab] = useState(0);

  const tabContent = [
    <MomentumOverview />,
    <ImprovLeaderboard />,
    <ControversyRecovery />,
    <SectorRotation />,
    <SignalBuilder />,
    <EngagementAlpha />,
  ];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight:'100vh', padding:'0 0 60px' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding:'28px 32px 0', boxShadow:'0 2px 12px rgba(27,58,92,0.15)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <span style={{ fontSize:11, fontWeight:700, color: T.gold, letterSpacing:'0.1em', textTransform:'uppercase' }}>EP-AF3</span>
              <span style={{ width:1, height:14, background:'rgba(255,255,255,0.2)', display:'inline-block' }} />
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>ESG Intelligence Suite</span>
            </div>
            <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'#ffffff', letterSpacing:'-0.02em' }}>
              ESG Momentum Scanner
            </h1>
            <p style={{ margin:'6px 0 0', fontSize:13, color:'rgba(255,255,255,0.6)' }}>
              Identify ESG improvers, track controversy recovery, and construct alpha-generating momentum signals
            </p>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {['Improvers','847 Signals','Controversy Recovery','Sector Rotation'].map(b => (
              <span key={b} style={{
                background:'rgba(197,169,106,0.2)', color: T.gold, border:`1px solid ${T.gold}50`,
                borderRadius:20, padding:'4px 12px', fontSize:11, fontWeight:600,
              }}>{b}</span>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex', gap:2, overflowX:'auto' }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)} style={{
              padding:'10px 18px', fontSize:13, fontWeight:activeTab === i ? 700 : 500,
              color: activeTab === i ? '#fff' : 'rgba(255,255,255,0.55)',
              background: activeTab === i ? 'rgba(255,255,255,0.15)' : 'transparent',
              border:'none', borderBottom: activeTab === i ? `2px solid ${T.gold}` : '2px solid transparent',
              cursor:'pointer', whiteSpace:'nowrap', borderRadius:'6px 6px 0 0', transition:'all 0.15s',
            }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'28px 24px' }}>
        {tabContent[activeTab]}
      </div>
    </div>
  );
}
