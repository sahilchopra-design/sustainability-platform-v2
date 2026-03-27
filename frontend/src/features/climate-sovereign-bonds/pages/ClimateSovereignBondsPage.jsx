import React, { useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, LineChart, Line, Legend } from 'recharts';
import { COUNTRY_PHYSICAL_RISK, getCountryPhysicalRisk } from '../../../services/climateRiskDataService';

const T = { bg:'#0f172a', surface:'#1e293b', border:'#334155', navy:'#1e3a5f', gold:'#f59e0b', sage:'#10b981', text:'#f1f5f9', textSec:'#94a3b8', textMut:'#64748b', red:'#ef4444', green:'#10b981', amber:'#f59e0b', teal:'#14b8a6', font:"'Inter',sans-serif" };
const ACCENT = '#0f766e';
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };
const tip = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 11 };

const SOVEREIGN_ISSUERS = [
  // Europe (18 issuers)
  { iso:'DE', name:'Germany',        outstanding:62.5, greenium:-4.2, rating:'AAA', framework:'EU GBS aligned',    uop:'Energy Transition', year:2020, ndcOnTrack:true,  region:'Europe' },
  { iso:'FR', name:'France',         outstanding:48.2, greenium:-3.8, rating:'AA',  framework:'EU GBS aligned',    uop:'Clean Transport',   year:2017, ndcOnTrack:true,  region:'Europe' },
  { iso:'NL', name:'Netherlands',    outstanding:22.4, greenium:-5.1, rating:'AAA', framework:'EU GBS',            uop:'Water Management',  year:2019, ndcOnTrack:true,  region:'Europe' },
  { iso:'GB', name:'United Kingdom', outstanding:35.8, greenium:-3.2, rating:'AA',  framework:'UK GBF',            uop:'Green Gilts',       year:2021, ndcOnTrack:false, region:'Europe' },
  { iso:'IT', name:'Italy',          outstanding:28.5, greenium:-2.8, rating:'BBB', framework:'EU GBS',            uop:'Energy Efficiency', year:2021, ndcOnTrack:false, region:'Europe' },
  { iso:'ES', name:'Spain',          outstanding:18.6, greenium:-3.5, rating:'A',   framework:'EU GBS aligned',    uop:'Renewables',        year:2021, ndcOnTrack:true,  region:'Europe' },
  { iso:'BE', name:'Belgium',        outstanding:12.4, greenium:-4.8, rating:'AA',  framework:'EU GBS',            uop:'Rail Transport',    year:2021, ndcOnTrack:true,  region:'Europe' },
  { iso:'SE', name:'Sweden',         outstanding:8.2,  greenium:-6.2, rating:'AAA', framework:'ICMA GBP',          uop:'Biodiversity',      year:2020, ndcOnTrack:true,  region:'Europe' },
  { iso:'DK', name:'Denmark',        outstanding:5.4,  greenium:-5.8, rating:'AAA', framework:'ICMA GBP',          uop:'Wind Energy',       year:2022, ndcOnTrack:true,  region:'Europe' },
  { iso:'PL', name:'Poland',         outstanding:6.2,  greenium:-1.8, rating:'A',   framework:'ICMA GBP',          uop:'Rail & Efficiency', year:2016, ndcOnTrack:false, region:'Europe' },
  { iso:'HU', name:'Hungary',        outstanding:4.8,  greenium:-2.2, rating:'BBB', framework:'ICMA GBP',          uop:'Energy Transition', year:2020, ndcOnTrack:false, region:'Europe' },
  { iso:'AT', name:'Austria',        outstanding:7.2,  greenium:-4.5, rating:'AA',  framework:'EU GBS aligned',    uop:'Hydro & Rail',      year:2022, ndcOnTrack:true,  region:'Europe' },
  { iso:'FI', name:'Finland',        outstanding:4.2,  greenium:-5.5, rating:'AA',  framework:'ICMA GBP',          uop:'Sustainable Forests',year:2023,ndcOnTrack:true,  region:'Europe' },
  { iso:'IE', name:'Ireland',        outstanding:3.8,  greenium:-4.2, rating:'AA',  framework:'EU GBS aligned',    uop:'Offshore Wind',     year:2023, ndcOnTrack:true,  region:'Europe' },
  { iso:'PT', name:'Portugal',       outstanding:5.6,  greenium:-3.2, rating:'BBB', framework:'ICMA GBP',          uop:'Solar & Wind',      year:2021, ndcOnTrack:false, region:'Europe' },
  { iso:'NO', name:'Norway',         outstanding:9.8,  greenium:-6.8, rating:'AAA', framework:'ICMA GBP',          uop:'EV Infrastructure', year:2023, ndcOnTrack:true,  region:'Europe' },
  { iso:'CH', name:'Switzerland',    outstanding:2.4,  greenium:-7.2, rating:'AAA', framework:'ICMA GBP',          uop:'Climate Adaptation',year:2023, ndcOnTrack:true,  region:'Europe' },
  { iso:'LU', name:'Luxembourg',     outstanding:1.8,  greenium:-5.8, rating:'AAA', framework:'EU GBS',            uop:'Sustainability',    year:2020, ndcOnTrack:true,  region:'Europe' },
  // Asia-Pacific (10 issuers)
  { iso:'JP', name:'Japan',          outstanding:22.0, greenium:-2.8, rating:'A',   framework:'Japan CTP Bonds',   uop:'Clean Energy',      year:2023, ndcOnTrack:false, region:'Asia-Pacific' },
  { iso:'CN', name:'China',          outstanding:18.5, greenium:-1.8, rating:'A+',  framework:'PBC GB Catalogue',  uop:'Clean Transport',   year:2016, ndcOnTrack:false, region:'Asia-Pacific' },
  { iso:'KR', name:'South Korea',    outstanding:8.2,  greenium:-3.2, rating:'AA',  framework:'K-Taxonomy',        uop:'H2 & Batteries',    year:2022, ndcOnTrack:false, region:'Asia-Pacific' },
  { iso:'SG', name:'Singapore',      outstanding:4.5,  greenium:-4.2, rating:'AAA', framework:'ICMA GBP',          uop:'Green Infra',       year:2022, ndcOnTrack:true,  region:'Asia-Pacific' },
  { iso:'AU', name:'Australia',      outstanding:6.8,  greenium:-3.8, rating:'AAA', framework:'ICMA GBP',          uop:'Clean Energy',      year:2023, ndcOnTrack:false, region:'Asia-Pacific' },
  { iso:'NZ', name:'New Zealand',    outstanding:2.2,  greenium:-4.5, rating:'AA',  framework:'ICMA GBP',          uop:'Climate Resilience',year:2022, ndcOnTrack:true,  region:'Asia-Pacific' },
  { iso:'IN', name:'India',          outstanding:8.0,  greenium:-2.2, rating:'BBB', framework:'India SGrB',        uop:'Solar & Wind',      year:2023, ndcOnTrack:false, region:'Asia-Pacific' },
  { iso:'ID', name:'Indonesia',      outstanding:5.2,  greenium:-1.5, rating:'BBB', framework:'ICMA GBP',          uop:'Sustainable Forestry',year:2018,ndcOnTrack:false, region:'Asia-Pacific' },
  { iso:'MY', name:'Malaysia',       outstanding:3.4,  greenium:-2.8, rating:'A',   framework:'SRI Sukuk',         uop:'Green Sukuk',       year:2017, ndcOnTrack:false, region:'Asia-Pacific' },
  { iso:'TH', name:'Thailand',       outstanding:2.8,  greenium:-2.4, rating:'BBB', framework:'ICMA GBP',          uop:'Mass Transit',      year:2022, ndcOnTrack:false, region:'Asia-Pacific' },
  // Americas (8 issuers)
  { iso:'CL', name:'Chile',          outstanding:4.8,  greenium:-3.8, rating:'A',   framework:'ICMA GBP',          uop:'Solar & Copper',    year:2019, ndcOnTrack:true,  region:'Americas' },
  { iso:'CO', name:'Colombia',       outstanding:2.4,  greenium:-2.8, rating:'BB',  framework:'ICMA GBP',          uop:'Biodiversity',      year:2021, ndcOnTrack:false, region:'Americas' },
  { iso:'BR', name:'Brazil',         outstanding:6.2,  greenium:-1.8, rating:'BB',  framework:'Brazil SLB',        uop:'Amazon Protection', year:2023, ndcOnTrack:false, region:'Americas' },
  { iso:'MX', name:'Mexico',         outstanding:3.8,  greenium:-2.2, rating:'BBB', framework:'ICMA GBP',          uop:'Clean Energy',      year:2020, ndcOnTrack:false, region:'Americas' },
  { iso:'PE', name:'Peru',           outstanding:1.8,  greenium:-2.8, rating:'BBB', framework:'ICMA GBP',          uop:'Hydro & Forestry',  year:2022, ndcOnTrack:false, region:'Americas' },
  { iso:'EC', name:'Ecuador',        outstanding:0.5,  greenium:-1.2, rating:'B',   framework:'Galapagos Debt Swap',uop:'Marine Biodiversity',year:2023,ndcOnTrack:false, region:'Americas' },
  { iso:'CA', name:'Canada',         outstanding:5.4,  greenium:-4.2, rating:'AAA', framework:'ICMA GBP',          uop:'Clean Tech',        year:2022, ndcOnTrack:false, region:'Americas' },
  { iso:'UY', name:'Uruguay',        outstanding:1.6,  greenium:-5.2, rating:'BBB', framework:'SLB (NDC-linked)',   uop:'Renewables KPI',    year:2022, ndcOnTrack:true,  region:'Americas' },
  // Africa & Middle East (6 issuers)
  { iso:'ZA', name:'South Africa',   outstanding:4.2,  greenium:-1.2, rating:'BB',  framework:'ICMA GBP',          uop:'Just Transition',   year:2023, ndcOnTrack:false, region:'Africa/M.East' },
  { iso:'EG', name:'Egypt',          outstanding:2.8,  greenium:-0.8, rating:'B',   framework:'ICMA GBP',          uop:'Solar & Wind',      year:2020, ndcOnTrack:false, region:'Africa/M.East' },
  { iso:'MA', name:'Morocco',        outstanding:1.4,  greenium:-1.8, rating:'BB',  framework:'ICMA GBP',          uop:'Desert Solar',      year:2021, ndcOnTrack:true,  region:'Africa/M.East' },
  { iso:'SA', name:'Saudi Arabia',   outstanding:12.5, greenium:+1.2, rating:'A+',  framework:'ICMA GBP',          uop:'NEOM & Renewables', year:2023, ndcOnTrack:false, region:'Africa/M.East' },
  { iso:'AE', name:'UAE',            outstanding:8.5,  greenium:+0.8, rating:'AA',  framework:'ICMA GBP',          uop:'Clean Energy',      year:2023, ndcOnTrack:false, region:'Africa/M.East' },
  { iso:'KE', name:'Kenya',          outstanding:0.8,  greenium:-0.5, rating:'B',   framework:'ICMA GBP',          uop:'Geothermal',        year:2022, ndcOnTrack:false, region:'Africa/M.East' },
];

// ISO -> country name map for physical risk service lookup
const ISO_TO_COUNTRY = {
  DE:'Germany', FR:'France', NL:'Netherlands', GB:'UK', IT:'Italy', ES:'Spain',
  BE:'Belgium', SE:'Sweden', DK:'Denmark', PL:'Poland', HU:'Hungary', AT:'Austria',
  FI:'Finland', IE:'Ireland', PT:'Portugal', NO:'Norway', CH:'Switzerland', LU:'Luxembourg',
  JP:'Japan', CN:'China', KR:'South Korea', SG:'Singapore', AU:'Australia', NZ:'New Zealand',
  IN:'India', ID:'Indonesia', MY:'Malaysia', TH:'Thailand',
  CL:'Chile', CO:'Colombia', BR:'Brazil', MX:'Mexico', PE:'Peru', EC:'Ecuador', CA:'Canada', UY:'Uruguay',
  ZA:'South Africa', EG:'Egypt', MA:'Morocco', SA:'Saudi Arabia', AE:'UAE', KE:'Kenya',
};

// Net-zero target years
const NET_ZERO_YEAR = {
  DE:2045, FR:2050, NL:2050, GB:2050, IT:2050, ES:2050, BE:2050, SE:2045, DK:2050,
  PL:2050, HU:2050, AT:2040, FI:2035, IE:2050, PT:2050, NO:2030, CH:2050, LU:2050,
  JP:2050, CN:2060, KR:2050, SG:2050, AU:2050, NZ:2050, IN:2070, ID:null, MY:null, TH:null,
  CL:2050, CO:2050, BR:2050, MX:2050, PE:2050, EC:null, CA:2050, UY:2050,
  ZA:2050, EG:null, MA:2050, SA:null, AE:2050, KE:2050,
};

function ratingColor(r) {
  if (r === 'AAA' || r === 'AA') return T.green;
  if (r === 'A' || r === 'A+' || r === 'BBB') return T.amber;
  return T.red;
}

function greeniumColor(g) {
  if (g < -3) return T.green;
  if (g < 0) return T.amber;
  return T.red;
}

function physRiskColor(s) {
  if (s > 6) return T.red;
  if (s > 3.5) return T.amber;
  return T.green;
}

const TABS = ['Global Market Overview','Issuer Directory','Physical Risk Overlay','Greenium Analysis','Use of Proceeds & Impact','NDC & Paris Alignment'];

const Card = ({ label, value, sub }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'16px 20px', flex:1, minWidth:140 }}>
    <div style={{ fontSize:11, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:T.text }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:2 }}>{sub}</div>}
  </div>
);

// ─── Tab 1: Global Market Overview ──────────────────────────────────────────
function Tab1() {
  const regions = ['Europe','Asia-Pacific','Americas','Africa/M.East'];
  const regionStats = regions.map(r => {
    const issuers = SOVEREIGN_ISSUERS.filter(i => i.region === r);
    const outstanding = issuers.reduce((a,b) => a+b.outstanding, 0);
    const avgGreenium = issuers.reduce((a,b) => a+b.greenium, 0) / issuers.length;
    const ndcPct = Math.round(issuers.filter(i => i.ndcOnTrack).length / issuers.length * 100);
    return { region: r, count: issuers.length, outstanding: outstanding.toFixed(1), avgGreenium: avgGreenium.toFixed(1), ndcPct };
  });

  const top15 = [...SOVEREIGN_ISSUERS].sort((a,b) => b.outstanding - a.outstanding).slice(0,15);

  // 24-month quarterly issuance trend
  const quarters = Array.from({length:8}, (_,i) => {
    const q = ['Q1','Q2','Q3','Q4'][i%4];
    const yr = 2024 + Math.floor(i/4);
    return { name:`${q} ${yr}`, issuance: +(18 + sr(i*7)*22).toFixed(1) };
  });

  const totalOutstanding = SOVEREIGN_ISSUERS.reduce((a,b) => a+b.outstanding,0).toFixed(0);
  const avgGreenium = (SOVEREIGN_ISSUERS.reduce((a,b) => a+b.greenium,0)/SOVEREIGN_ISSUERS.length).toFixed(1);
  const euGbsCount = SOVEREIGN_ISSUERS.filter(i => i.framework.includes('EU GBS')).length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        <Card label="Sovereign Issuers" value="42" sub="Across 4 regions" />
        <Card label="Outstanding" value={`$${totalOutstanding}bn`} sub="Total green sovereign debt" />
        <Card label="Avg Greenium" value={`${avgGreenium}bps`} sub="Market-wide premium" />
        <Card label="EU GBS Aligned" value={`${euGbsCount}`} sub="EU Green Bond Standard" />
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
        <div style={{ fontWeight:600, color:T.text, marginBottom:12 }}>Regional Breakdown</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ color:T.textMut }}>
              {['Region','Issuers','Outstanding ($bn)','Avg Greenium (bps)','NDC On-Track %'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'6px 10px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {regionStats.map(r => (
              <tr key={r.region} style={{ borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'8px 10px', color:T.text, fontWeight:500 }}>{r.region}</td>
                <td style={{ padding:'8px 10px', color:T.textSec }}>{r.count}</td>
                <td style={{ padding:'8px 10px', color:T.gold }}>${r.outstanding}bn</td>
                <td style={{ padding:'8px 10px', color: parseFloat(r.avgGreenium) < -3 ? T.green : parseFloat(r.avgGreenium) < 0 ? T.amber : T.red }}>{r.avgGreenium}bps</td>
                <td style={{ padding:'8px 10px', color: r.ndcPct > 50 ? T.green : T.amber }}>{r.ndcPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
        <div style={{ fontWeight:600, color:T.text, marginBottom:12 }}>Outstanding by Issuer — Top 15 ($bn)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={top15} margin={{ top:4, right:10, bottom:30, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:10 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fill:T.textMut, fontSize:10 }} />
            <Tooltip contentStyle={tip} />
            <Bar dataKey="outstanding" name="Outstanding ($bn)" radius={[3,3,0,0]}>
              {top15.map((d,i) => <Cell key={i} fill={ratingColor(d.rating)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize:10, color:T.textMut, marginTop:6 }}>Color: Green = AAA/AA · Amber = A/BBB · Red = BB/B</div>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
        <div style={{ fontWeight:600, color:T.text, marginBottom:12 }}>Global Sovereign Green Bond Issuance — 24-Month Trend</div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={quarters}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:10 }} />
            <YAxis tick={{ fill:T.textMut, fontSize:10 }} />
            <Tooltip contentStyle={tip} />
            <Area type="monotone" dataKey="issuance" name="Issuance ($bn)" stroke={ACCENT} fill={ACCENT} fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Tab 2: Issuer Directory ──────────────────────────────────────────────
function Tab2() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const regions = ['All','Europe','Asia-Pacific','Americas','Africa/M.East'];

  const filtered = SOVEREIGN_ISSUERS.filter(i => {
    const matchR = region === 'All' || i.region === region;
    const matchS = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.framework.toLowerCase().includes(search.toLowerCase());
    return matchR && matchS;
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search issuer or framework..."
          style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, padding:'6px 12px', color:T.text, fontSize:12, width:240, outline:'none' }}
        />
        <div style={{ display:'flex', gap:6 }}>
          {regions.map(r => (
            <button key={r} onClick={() => setRegion(r)}
              style={{ background: region===r ? ACCENT : T.surface, border:`1px solid ${region===r ? ACCENT : T.border}`, borderRadius:6, padding:'5px 12px', color: region===r ? '#fff' : T.textSec, fontSize:11, cursor:'pointer' }}>
              {r}
            </button>
          ))}
        </div>
        <span style={{ fontSize:11, color:T.textMut, marginLeft:'auto' }}>{filtered.length} issuers</span>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr style={{ color:T.textMut }}>
              {['Country','Rating','Outstanding ($bn)','Greenium (bps)','Framework','Use of Proceeds','Year','NDC'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'8px 12px', borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((d,i) => (
              <tr key={d.iso} style={{ background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.02)', borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'7px 12px', color:T.text, fontWeight:500 }}>{d.name}</td>
                <td style={{ padding:'7px 12px' }}>
                  <span style={{ background: ratingColor(d.rating)+'22', color: ratingColor(d.rating), borderRadius:4, padding:'2px 6px', fontWeight:600 }}>{d.rating}</span>
                </td>
                <td style={{ padding:'7px 12px', color:T.gold }}>{d.outstanding.toFixed(1)}</td>
                <td style={{ padding:'7px 12px', color: greeniumColor(d.greenium), fontWeight:600 }}>{d.greenium > 0 ? '+' : ''}{d.greenium.toFixed(1)}</td>
                <td style={{ padding:'7px 12px', color:T.textSec, maxWidth:160, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{d.framework}</td>
                <td style={{ padding:'7px 12px', color:T.textSec }}>{d.uop}</td>
                <td style={{ padding:'7px 12px', color:T.textMut }}>{d.year}</td>
                <td style={{ padding:'7px 12px' }}>
                  <span style={{ color: d.ndcOnTrack ? T.green : T.red, fontWeight:700, fontSize:14 }}>{d.ndcOnTrack ? '✓' : '✗'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize:10, color:T.textMut }}>
        Greenium: green &lt; -3bps · amber &lt; 0 · red &gt; 0 (negative = green bond trades at lower yield = borrower premium)
      </div>
    </div>
  );
}

// ─── Tab 3: Physical Risk Overlay ────────────────────────────────────────
function Tab3() {
  const [ssp, setSsp] = useState('SSP2-4.5');
  const ssps = ['SSP1-2.6','SSP2-4.5','SSP5-8.5'];

  // Fallback seeded physical risk for countries not in data service
  const SEEDED_RISK = {
    BE:3.1, SE:2.2, DK:2.0, PL:3.8, HU:3.5, AT:2.8, FI:2.0, IE:2.5, PT:3.6, NO:1.8, CH:2.0, LU:1.9,
    KR:4.2, SG:3.8, NZ:2.4, MY:5.2, KE:5.8, MA:5.0, CO:5.4, PE:5.1, EC:5.6, CA:2.6, CL:4.1, UY:3.2,
    ES:4.0, IT:3.9, AR:4.5, UY:3.2,
  };
  const SSP_MULT = { 'SSP1-2.6':0.82, 'SSP2-4.5':1.0, 'SSP5-8.5':1.58 };

  const top20 = SOVEREIGN_ISSUERS.slice(0,20).map(issuer => {
    const countryName = ISO_TO_COUNTRY[issuer.iso];
    const result = getCountryPhysicalRisk(countryName, ssp);
    const score = result ? result.composite : +((SEEDED_RISK[issuer.iso] || 3.0) * SSP_MULT[ssp]).toFixed(2);
    return { ...issuer, physScore: score };
  }).sort((a,b) => b.physScore - a.physScore);

  // Summary stats
  const highest = top20[0];
  const lowest = top20[top20.length-1];
  const corr = (-0.31 * SSP_MULT[ssp]).toFixed(2);

  // Quadrant logic: greenium < -3.5 = high greenium, physScore > 4 = high risk
  const quadrants = [
    { label:'Green Premium Leaders', desc:'High Greenium + Low Physical Risk', color:T.green, issuers: top20.filter(i => i.greenium < -3.5 && i.physScore <= 4) },
    { label:'Risk-Adjusted Value',   desc:'High Greenium + High Physical Risk', color:T.amber, issuers: top20.filter(i => i.greenium < -3.5 && i.physScore > 4) },
    { label:'Transition Laggards',   desc:'No/Low Greenium + High Physical Risk', color:T.red,  issuers: top20.filter(i => i.greenium >= -3.5 && i.physScore > 4) },
    { label:'Developing Market',     desc:'Low Greenium + Low Physical Risk', color:T.teal, issuers: top20.filter(i => i.greenium >= -3.5 && i.physScore <= 4) },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <span style={{ fontSize:12, color:T.textSec }}>Scenario:</span>
        {ssps.map(s => (
          <button key={s} onClick={() => setSsp(s)}
            style={{ background: ssp===s ? ACCENT : T.surface, border:`1px solid ${ssp===s ? ACCENT : T.border}`, borderRadius:6, padding:'5px 12px', color: ssp===s ? '#fff' : T.textSec, fontSize:11, cursor:'pointer' }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', gap:12 }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'12px 16px', flex:1 }}>
          <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase' }}>Highest Risk</div>
          <div style={{ fontSize:16, fontWeight:700, color:T.red }}>{highest.name}</div>
          <div style={{ fontSize:12, color:T.textSec }}>Score: {highest.physScore}</div>
        </div>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'12px 16px', flex:1 }}>
          <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase' }}>Lowest Risk</div>
          <div style={{ fontSize:16, fontWeight:700, color:T.green }}>{lowest.name}</div>
          <div style={{ fontSize:12, color:T.textSec }}>Score: {lowest.physScore}</div>
        </div>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'12px 16px', flex:1 }}>
          <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase' }}>Physical Risk vs Greenium Corr.</div>
          <div style={{ fontSize:16, fontWeight:700, color:T.amber }}>{corr}</div>
          <div style={{ fontSize:12, color:T.textSec }}>Partial negative correlation</div>
        </div>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
        <div style={{ fontWeight:600, color:T.text, marginBottom:12 }}>Physical Risk Score — Top 20 Issuers ({ssp})</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={top20} margin={{ top:4, right:10, bottom:34, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:9 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis domain={[0,10]} tick={{ fill:T.textMut, fontSize:10 }} />
            <Tooltip contentStyle={tip} />
            <Bar dataKey="physScore" name="Physical Risk Score" radius={[3,3,0,0]}>
              {top20.map((d,i) => <Cell key={i} fill={physRiskColor(d.physScore)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize:10, color:T.textMut, marginTop:4 }}>Score 0–10 · Red &gt;6 · Amber &gt;3.5 · Green ≤3.5</div>
      </div>

      <div style={{ fontWeight:600, color:T.text, marginBottom:4 }}>Greenium vs Physical Risk Quadrants</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {quadrants.map(q => (
          <div key={q.label} style={{ background:T.surface, border:`1px solid ${q.color}44`, borderRadius:10, padding:14 }}>
            <div style={{ fontWeight:600, color:q.color, fontSize:12, marginBottom:2 }}>{q.label}</div>
            <div style={{ fontSize:10, color:T.textMut, marginBottom:8 }}>{q.desc}</div>
            {q.issuers.length === 0
              ? <div style={{ fontSize:11, color:T.textMut, fontStyle:'italic' }}>No issuers in this quadrant</div>
              : q.issuers.map(i => (
                  <div key={i.iso} style={{ fontSize:11, color:T.textSec, marginBottom:2 }}>
                    {i.name} — Risk: {i.physScore} · Greenium: {i.greenium}bps
                  </div>
                ))
            }
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab 4: Greenium Analysis ─────────────────────────────────────────────
function Tab4() {
  const sorted15 = [...SOVEREIGN_ISSUERS].sort((a,b) => a.greenium - b.greenium).slice(0,15);

  const drivers = [
    { factor:'ESG Investor Demand',     direction:'↓ yield', impact:'High', magnitude:'-2.5bps avg', color:T.green },
    { factor:'EU Taxonomy Eligibility', direction:'↓ yield', impact:'High', magnitude:'-1.8bps avg', color:T.green },
    { factor:'EU GBS Certification',    direction:'↓ yield', impact:'Medium', magnitude:'-1.2bps avg', color:T.sage },
    { factor:'Credit Rating Quality',   direction:'↓ yield', impact:'Medium', magnitude:'-0.9bps avg', color:T.sage },
    { factor:'Market Liquidity',        direction:'↓ yield', impact:'Low', magnitude:'-0.5bps avg', color:T.amber },
    { factor:'NDC Credibility',         direction:'↓ yield', impact:'Low', magnitude:'-0.4bps avg', color:T.amber },
  ];

  // 24-month greenium trend by rating bucket (seeded)
  const months = Array.from({length:8}, (_,i) => ({
    name: ['Jan','Apr','Jul','Oct'][i%4] + ' ' + (2024 + Math.floor(i/4)),
    AAA:  +(-6.0 - sr(i*3)*1.5).toFixed(1),
    AA:   +(-4.5 - sr(i*5)*1.2).toFixed(1),
    A:    +(-3.0 - sr(i*7)*1.0).toFixed(1),
    BBB:  +(-2.0 - sr(i*9)*0.8).toFixed(1),
    HY:   +(-0.5 - sr(i*11)*0.5).toFixed(1),
  }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:T.navy, border:`1px solid ${ACCENT}`, borderRadius:10, padding:16 }}>
        <div style={{ fontWeight:700, color:T.gold, marginBottom:6 }}>What is a Green Bond Premium (Greenium)?</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          Green Bond Premium = Conventional bond yield minus Green bond yield. A <span style={{color:T.green}}>negative value</span> means the green bond trades at a <strong>lower yield</strong> than the equivalent conventional bond — the issuer saves borrowing cost. A <span style={{color:T.red}}>positive value</span> means green bonds trade at a penalty (common for GCC sovereigns with weak ESG credibility).
        </div>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
        <div style={{ fontWeight:600, color:T.text, marginBottom:10 }}>Top 15 Issuers — Sorted by Greenium (most negative = largest premium)</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ color:T.textMut }}>
              {['Rank','Country','Rating','Greenium (bps)','Framework','NDC On-Track'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'6px 10px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted15.map((d,i) => (
              <tr key={d.iso} style={{ borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'7px 10px', color:T.textMut }}>{i+1}</td>
                <td style={{ padding:'7px 10px', color:T.text, fontWeight:500 }}>{d.name}</td>
                <td style={{ padding:'7px 10px' }}>
                  <span style={{ color: ratingColor(d.rating), fontWeight:600 }}>{d.rating}</span>
                </td>
                <td style={{ padding:'7px 10px', color: greeniumColor(d.greenium), fontWeight:700 }}>{d.greenium > 0 ? '+' : ''}{d.greenium.toFixed(1)}</td>
                <td style={{ padding:'7px 10px', color:T.textSec, fontSize:11 }}>{d.framework}</td>
                <td style={{ padding:'7px 10px', color: d.ndcOnTrack ? T.green : T.red, fontWeight:700 }}>{d.ndcOnTrack ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
        <div style={{ fontWeight:600, color:T.text, marginBottom:12 }}>Greenium by Issuer (bps)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sorted15} margin={{ top:4, right:10, bottom:34, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:9 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fill:T.textMut, fontSize:10 }} />
            <Tooltip contentStyle={tip} />
            <Bar dataKey="greenium" name="Greenium (bps)" radius={[3,3,0,0]}>
              {sorted15.map((d,i) => <Cell key={i} fill={greeniumColor(d.greenium)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div style={{ fontWeight:600, color:T.text, marginBottom:10 }}>Greenium Drivers</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {drivers.map(d => (
            <div key={d.factor} style={{ background:T.surface, border:`1px solid ${d.color}33`, borderRadius:8, padding:12 }}>
              <div style={{ fontWeight:600, color:d.color, fontSize:12, marginBottom:4 }}>{d.factor}</div>
              <div style={{ fontSize:11, color:T.textSec }}>Direction: {d.direction}</div>
              <div style={{ fontSize:11, color:T.textSec }}>Impact: {d.impact}</div>
              <div style={{ fontSize:11, color:T.text, fontWeight:600, marginTop:4 }}>{d.magnitude}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
        <div style={{ fontWeight:600, color:T.text, marginBottom:12 }}>24-Month Greenium Trend by Rating Bucket</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={months}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:10 }} />
            <YAxis tick={{ fill:T.textMut, fontSize:10 }} />
            <Tooltip contentStyle={tip} />
            <Legend wrapperStyle={{ fontSize:11, color:T.textSec }} />
            <Line type="monotone" dataKey="AAA" stroke={T.green}  dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="AA"  stroke={T.teal}   dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="A"   stroke={T.amber}  dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="BBB" stroke={T.gold}   dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="HY"  stroke={T.red}    dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Tab 5: Use of Proceeds & Impact ────────────────────────────────────
function Tab5() {
  const uop = [
    { category:'Renewable Energy',      amount:185, color:T.gold },
    { category:'Clean Transport',       amount:124, color:'#0891b2' },
    { category:'Energy Efficiency',     amount:78,  color:T.teal },
    { category:'Biodiversity/Land Use', amount:52,  color:T.sage },
    { category:'Water Management',      amount:48,  color:'#1e40af' },
    { category:'Climate Adaptation',    amount:38,  color:'#7c3aed' },
  ];

  const frameworks = [
    { name:'ICMA GBP',  count:28, description:'International Capital Market Association Green Bond Principles — voluntary, disclosure-based' },
    { name:'EU GBS',    count:8,  description:'EU Green Bond Standard — aligned with EU Taxonomy, mandatory post-issuance reporting' },
    { name:'SLB',       count:3,  description:'Sustainability-Linked Bonds — KPI-linked coupon step-ups, NDC-referenced targets' },
    { name:'Other',     count:3,  description:'Country-specific frameworks (PBC Catalogue, Japan CTP, India SGrB)' },
  ];

  const impact = [
    { country:'Germany',     ghg:42.0, gw:18.5, people:12.0, forests:0.0 },
    { country:'France',      ghg:35.0, gw:14.2, people:8.0,  forests:0.5 },
    { country:'Netherlands', ghg:18.0, gw:6.8,  people:4.0,  forests:0.0 },
    { country:'UK',          ghg:28.0, gw:12.0, people:6.5,  forests:0.4 },
    { country:'Sweden',      ghg:12.0, gw:3.2,  people:2.0,  forests:2.1 },
    { country:'Norway',      ghg:15.0, gw:2.8,  people:1.5,  forests:1.8 },
    { country:'China',       ghg:85.0, gw:62.0, people:45.0, forests:3.2 },
    { country:'India',       ghg:32.0, gw:28.0, people:38.0, forests:1.5 },
    { country:'Indonesia',   ghg:18.0, gw:4.5,  people:22.0, forests:5.2 },
    { country:'Brazil',      ghg:25.0, gw:3.8,  people:15.0, forests:8.5 },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:12 }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'12px 16px', flex:1 }}>
          <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase' }}>Total GHG Avoided</div>
          <div style={{ fontSize:20, fontWeight:700, color:T.green }}>420 MtCO2/yr</div>
        </div>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'12px 16px', flex:1 }}>
          <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase' }}>Renewables Installed</div>
          <div style={{ fontSize:20, fontWeight:700, color:T.gold }}>280 GW</div>
        </div>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'12px 16px', flex:1 }}>
          <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase' }}>Avg Reporting Completeness</div>
          <div style={{ fontSize:20, fontWeight:700, color:T.amber }}>72%</div>
        </div>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
        <div style={{ fontWeight:600, color:T.text, marginBottom:12 }}>Use of Proceeds Allocation ($bn)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={uop} margin={{ top:4, right:10, bottom:30, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="category" tick={{ fill:T.textMut, fontSize:9 }} angle={-20} textAnchor="end" interval={0} />
            <YAxis tick={{ fill:T.textMut, fontSize:10 }} />
            <Tooltip contentStyle={tip} />
            <Bar dataKey="amount" name="$bn" radius={[3,3,0,0]}>
              {uop.map((d,i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
        <div style={{ fontWeight:600, color:T.text, marginBottom:10 }}>Impact Metrics — Selected Sovereign Issuers</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr style={{ color:T.textMut }}>
              {['Country','GHG Avoided (MtCO2/yr)','Renewable Capacity (GW)','Clean Energy Access (M people)','Forests Protected (Mha)'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'6px 10px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {impact.map((d,i) => (
              <tr key={d.country} style={{ borderBottom:`1px solid ${T.border}`, background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td style={{ padding:'7px 10px', color:T.text, fontWeight:500 }}>{d.country}</td>
                <td style={{ padding:'7px 10px', color:T.green }}>{d.ghg.toFixed(1)}</td>
                <td style={{ padding:'7px 10px', color:T.gold }}>{d.gw.toFixed(1)}</td>
                <td style={{ padding:'7px 10px', color:T.teal }}>{d.people.toFixed(1)}</td>
                <td style={{ padding:'7px 10px', color:T.sage }}>{d.forests.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
        <div style={{ fontWeight:600, color:T.text, marginBottom:10 }}>Bond Framework Summary</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ color:T.textMut }}>
              {['Framework','Issuer Count','Description'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'6px 10px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {frameworks.map(f => (
              <tr key={f.name} style={{ borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'7px 10px', fontWeight:600, color:T.gold }}>{f.name}</td>
                <td style={{ padding:'7px 10px', color:T.text }}>{f.count}</td>
                <td style={{ padding:'7px 10px', color:T.textSec, fontSize:11 }}>{f.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 6: NDC & Paris Alignment ────────────────────────────────────────
function Tab6() {
  // Paris Alignment tier logic
  function getTier(issuer) {
    const nzYear = NET_ZERO_YEAR[issuer.iso];
    if (issuer.ndcOnTrack && nzYear && nzYear <= 2050) return { tier:1, label:'Tier 1 — Paris Aligned',        color:T.green };
    if (!issuer.ndcOnTrack && nzYear && nzYear <= 2050) return { tier:2, label:'Tier 2 — Conditional Aligned', color:T.amber };
    if (!issuer.ndcOnTrack && nzYear && nzYear > 2050)  return { tier:3, label:'Tier 3 — Insufficient',        color:T.gold  };
    return                                                       { tier:4, label:'Tier 4 — Critically Insuff.',  color:T.red   };
  }

  // NDC progress seeded 0-100
  const top20ndcData = SOVEREIGN_ISSUERS.slice(0,20).map((iss,i) => ({
    name: iss.name,
    progress: iss.ndcOnTrack ? +(60 + sr(i*4+1)*35).toFixed(0) : +(15 + sr(i*4+2)*40).toFixed(0),
    onTrack: iss.ndcOnTrack,
  }));

  const tierCounts = [1,2,3,4].map(t => ({
    tier: t,
    label: `Tier ${t}`,
    count: SOVEREIGN_ISSUERS.filter(i => getTier(i).tier === t).length,
    color: [T.green,T.amber,T.gold,T.red][t-1],
  }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:10 }}>
        {tierCounts.map(tc => (
          <div key={tc.tier} style={{ background:T.surface, border:`1px solid ${tc.color}44`, borderRadius:8, padding:'12px 16px', flex:1 }}>
            <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase' }}>{tc.label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:tc.color }}>{tc.count}</div>
            <div style={{ fontSize:10, color:T.textMut }}>sovereign issuers</div>
          </div>
        ))}
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
        <div style={{ fontWeight:600, color:T.text, marginBottom:12 }}>NDC Progress % — Top 20 Issuers</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={top20ndcData} margin={{ top:4, right:10, bottom:34, left:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:9 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis domain={[0,100]} tick={{ fill:T.textMut, fontSize:10 }} unit="%" />
            <Tooltip contentStyle={tip} />
            <Bar dataKey="progress" name="NDC Progress %" radius={[3,3,0,0]}>
              {top20ndcData.map((d,i) => <Cell key={i} fill={d.onTrack ? T.green : T.red} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
        <div style={{ fontWeight:600, color:T.text, marginBottom:10 }}>Full Issuer NDC & Net-Zero Status</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr style={{ color:T.textMut }}>
              {['Country','NDC On-Track','Net-Zero Target','Paris Alignment Tier','Temperature Pathway'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'6px 10px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SOVEREIGN_ISSUERS.map((d,i) => {
              const tierInfo = getTier(d);
              const nzYear = NET_ZERO_YEAR[d.iso];
              const pathway = tierInfo.tier === 1 ? '1.5°C' : tierInfo.tier === 2 ? '1.8°C' : tierInfo.tier === 3 ? '2.5°C' : '3.0°C+';
              return (
                <tr key={d.iso} style={{ borderBottom:`1px solid ${T.border}`, background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding:'6px 10px', color:T.text, fontWeight:500 }}>{d.name}</td>
                  <td style={{ padding:'6px 10px', color: d.ndcOnTrack ? T.green : T.red, fontWeight:700 }}>{d.ndcOnTrack ? 'Yes' : 'No'}</td>
                  <td style={{ padding:'6px 10px', color:T.textSec }}>{nzYear ? nzYear : 'No law'}</td>
                  <td style={{ padding:'6px 10px' }}>
                    <span style={{ background:tierInfo.color+'22', color:tierInfo.color, borderRadius:4, padding:'2px 7px', fontSize:10, fontWeight:600 }}>{tierInfo.label}</span>
                  </td>
                  <td style={{ padding:'6px 10px', color:T.textSec }}>{pathway}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ background:`${ACCENT}22`, border:`1px solid ${ACCENT}`, borderRadius:10, padding:14 }}>
        <div style={{ fontWeight:600, color:T.gold, marginBottom:6 }}>Cross-Module Links</div>
        <div style={{ fontSize:12, color:T.textSec }}>
          See <strong style={{color:T.text}}>Climate Policy Intelligence</strong> for legislative NCD tracking →{' '}
          <span style={{ color:ACCENT, cursor:'pointer' }}>/climate-policy-intelligence</span>
          {'  |  '}
          <strong style={{color:T.text}}>Physical Risk</strong> deep-dive →{' '}
          <span style={{ color:ACCENT, cursor:'pointer' }}>/climate-physical-risk</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function ClimateSovereignBondsPage() {
  const [tab, setTab] = useState(0);
  const totalOutstanding = SOVEREIGN_ISSUERS.reduce((a,b) => a+b.outstanding,0).toFixed(0);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text, padding:'24px 28px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:700, color:T.text }}>Climate Sovereign Bonds</div>
        <div style={{ fontSize:13, color:T.textSec, marginTop:4 }}>
          42 sovereign issuers · ${totalOutstanding}bn outstanding · Physical risk overlay · Paris alignment linkage
        </div>
      </div>

      <div style={{ display:'flex', gap:2, marginBottom:20, borderBottom:`1px solid ${T.border}`, overflowX:'auto' }}>
        {TABS.map((t,i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ background:'transparent', border:'none', borderBottom: tab===i ? `2px solid ${ACCENT}` : '2px solid transparent', color: tab===i ? T.text : T.textMut, padding:'8px 14px', cursor:'pointer', fontSize:12, fontWeight: tab===i ? 600 : 400, whiteSpace:'nowrap', marginBottom:-1 }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && <Tab1 />}
      {tab === 1 && <Tab2 />}
      {tab === 2 && <Tab3 />}
      {tab === 3 && <Tab4 />}
      {tab === 4 && <Tab5 />}
      {tab === 5 && <Tab6 />}
    </div>
  );
}
