import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = (s) => Math.abs(Math.sin(s * 9301 + 49297) * 233280) % 1;

const FUNDS = Array.from({ length: 18 }, (_, i) => ({
  name: ['Paine Schwartz Agri','TIAA Farmland','Nuveen Natural Capital','Gresham House Forestry','Schroders Green Earth',
    'Dunavant Ag Fund','AgIS Capital','Fiera Comox','Insight Agri','UBS Agrivest',
    'BNP Green Agri','Stafford Agri','Manulife Agri','Hancock Natural Res','GreenFirst Forest',
    'Ecotierra Carbon','Mirova NBS','Astanor Alt Protein'][i],
  type: ['Farmland','Farmland','Forestry','Forestry','Mixed','Farmland','Farmland','Mixed','Farmland','Farmland',
    'Green Bond','Mixed','Farmland','Forestry','Forestry','Carbon','NBS','Alt Protein'][i],
  aum: +(sr(i * 7) * 3000 + 200).toFixed(0),
  targetReturn: +(sr(i * 11) * 8 + 6).toFixed(1),
  actualReturn: +(sr(i * 17) * 9 + 5).toFixed(1),
  impactScore: +(sr(i * 23) * 40 + 50).toFixed(1),
  carbonIntensity: +(sr(i * 29) * 60 + 10).toFixed(1),
  tenure: 2018 + (i % 7),
  sbti: i % 3 !== 0,
}));

const GREEN_BONDS = Array.from({ length: 10 }, (_, i) => ({
  issuer: ['FAO Green Bond','World Bank SLB','IFC Agri Bond','EBRD Food Sys','ADB FoodChain',
    'Rabobank Sust Agri','BNDES Agri Bond','BNP Green Food','Barclays Agri SLB','ABN AMRO NBS'][i],
  volume: +(sr(i * 13) * 500 + 100).toFixed(0),
  coupon: +(sr(i * 19) * 1.5 + 3.0).toFixed(2),
  tenor: 5 + (i % 10),
  year: 2019 + (i % 6),
  certification: ['ICMA GBP','SLB','ICMA GBP','SLB','ICMA GBP','LMA SLL','SLB','ICMA GBP','SLB','ICMA GBP'][i],
  kpiLinked: i % 2 === 0,
  greeniumBps: +(sr(i * 31) * 10 + 2).toFixed(1),
}));

const REGEN_PRACTICES = [
  { practice: 'Cover Cropping', adoption: 28, yieldImpact: +2, carbonSeq: 0.8, cost: 45, payback: 3.2 },
  { practice: 'No-Till / Reduced Till', adoption: 42, yieldImpact: +1, carbonSeq: 1.2, cost: 25, payback: 2.1 },
  { practice: 'Crop Rotation', adoption: 55, yieldImpact: +4, carbonSeq: 0.5, cost: 15, payback: 1.5 },
  { practice: 'Agroforestry', adoption: 12, yieldImpact: +6, carbonSeq: 3.8, cost: 180, payback: 7.8 },
  { practice: 'Compost Application', adoption: 18, yieldImpact: +5, carbonSeq: 0.9, cost: 120, payback: 4.5 },
  { practice: 'Integrated Pest Mgmt', adoption: 35, yieldImpact: +3, carbonSeq: 0.2, cost: 60, payback: 2.8 },
  { practice: 'Precision Irrigation', adoption: 24, yieldImpact: +7, carbonSeq: 0.1, cost: 350, payback: 5.2 },
  { practice: 'Biochar Application', adoption: 6, yieldImpact: +3, carbonSeq: 2.5, cost: 280, payback: 9.1 },
];

const RETURN_SERIES = [2018, 2019, 2020, 2021, 2022, 2023, 2024].map((yr, i) => ({
  year: yr,
  farmland: +(7 + sr(i * 7) * 6 - 2).toFixed(1),
  forestry: +(6 + sr(i * 11) * 5 - 1).toFixed(1),
  agBonds: +(4 + sr(i * 17) * 3 - 0.5).toFixed(1),
  altProtein: +(12 + sr(i * 23) * 15 - 5).toFixed(1),
  baseline: +(5 + sr(i * 29) * 4 - 1).toFixed(1),
}));

const T = { bg: '#0f1117', surface: '#1a1d2e', surfaceH: '#252840', border: '#2e3148',
  navy: '#3b4fd8', navyL: '#5a6de8', gold: '#d4a017', goldL: '#e8b830', sage: '#2d7a4f',
  sageL: '#3a9962', teal: '#0d9488', text: '#e8eaf0', textSec: '#9ca3af', textMut: '#6b7280',
  red: '#ef4444', green: '#22c55e', amber: '#f59e0b', font: "'Inter','sans-serif'", mono: "'JetBrains Mono','monospace'" };

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px' }}>
    <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.text, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const TABS = ['Overview', 'Regen Ag Finance', 'Green Bonds', 'ROI Analytics', 'Impact', 'Portfolio', 'Opportunities'];
const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 };
const h2 = { fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 16, marginTop: 0 };
const grid = (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 24 });
const select = { background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: '6px 10px', fontSize: 12 };

export default function SustainableAgricultureInvestmentPage() {
  const [tab, setTab] = useState('Overview');
  const [fundType, setFundType] = useState('All');
  const [practiceSort, setPracticeSort] = useState('carbonSeq');

  const fundTypes = ['All', ...new Set(FUNDS.map(f => f.type))];
  const filteredFunds = fundType === 'All' ? FUNDS : FUNDS.filter(f => f.type === fundType);

  const totalAUM = useMemo(() => filteredFunds.reduce((a, f) => a + +f.aum, 0), [filteredFunds]);
  const avgReturn = useMemo(() => filteredFunds.length > 0 ? (filteredFunds.reduce((a, f) => a + f.actualReturn, 0) / filteredFunds.length).toFixed(1) : '–', [filteredFunds]);
  const avgImpact = useMemo(() => filteredFunds.length > 0 ? (filteredFunds.reduce((a, f) => a + f.impactScore, 0) / filteredFunds.length).toFixed(1) : '–', [filteredFunds]);

  const sortedPractices = useMemo(() => [...REGEN_PRACTICES].sort((a, b) => b[practiceSort] - a[practiceSort]), [practiceSort]);

  const gbData = useMemo(() => GREEN_BONDS.map(b => ({ name: b.issuer.split(' ').slice(0, 2).join(' '), volume: b.volume, greenium: b.greeniumBps })), []);

  const returnData = useMemo(() => RETURN_SERIES, []);

  const tabBar = { display: 'flex', gap: 4, marginBottom: 28, borderBottom: `1px solid ${T.border}` };
  const tabBtn = (active) => ({ padding: '10px 18px', fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? T.navyL : T.textSec, borderBottom: active ? `2px solid ${T.navyL}` : '2px solid transparent',
    cursor: 'pointer', background: 'none', border: 'none', marginBottom: -1 });

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: T.font, padding: '24px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: T.text }}>Sustainable Agriculture Investment</h1>
        <p style={{ margin: 0, color: T.textSec, fontSize: 13 }}>Regenerative agriculture investment, green bond finance &amp; ROI analytics across global food &amp; farmland markets</p>
      </div>
      <div style={tabBar}>{TABS.map(t => <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === 'Overview' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="Tracked Funds AUM" value={`$${FUNDS.reduce((a, f) => a + +f.aum, 0).toLocaleString()}M`} sub="Sustainable agri investment funds" color={T.navy} />
            <KpiCard label="Green Bond Issuance" value={`$${GREEN_BONDS.reduce((a, b) => a + b.volume, 0).toLocaleString()}M`} sub="Agri-linked green bond volume" color={T.green} />
            <KpiCard label="Avg Fund Return" value={`${(FUNDS.reduce((a, f) => a + f.actualReturn, 0) / FUNDS.length).toFixed(1)}%`} sub="Annual average realized return" color={T.gold} />
            <KpiCard label="Avg Impact Score" value={`${(FUNDS.reduce((a, f) => a + f.impactScore, 0) / FUNDS.length).toFixed(1)}`} sub="Out of 100 (proprietary scoring)" color={T.teal} />
          </div>
          <div style={card}>
            <h2 style={h2}>Sustainable Agri Investment Returns 2018–2024</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={returnData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="farmland" name="Farmland %" stroke={T.navy} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="forestry" name="Forestry %" stroke={T.green} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="agBonds" name="Agri Bonds %" stroke={T.gold} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="altProtein" name="Alt Protein %" stroke={T.red} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="baseline" name="Baseline %" stroke={T.textMut} strokeWidth={1} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Top Funds by AUM</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Fund','Type','AUM ($M)','Target Ret.','Actual Ret.','Impact Score','SBTi'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{FUNDS.slice(0, 8).map(f => (
                <tr key={f.name} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '4px 8px', color: T.text, fontWeight: 500 }}>{f.name}</td>
                  <td style={{ padding: '4px 8px', color: T.textSec, fontSize: 10 }}>{f.type}</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.navy }}>{(+f.aum).toLocaleString()}</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.amber }}>{f.targetReturn}%</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: f.actualReturn >= f.targetReturn ? T.green : T.red }}>{f.actualReturn}%</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.teal }}>{f.impactScore}</td>
                  <td style={{ padding: '4px 8px', color: f.sbti ? T.green : T.textMut }}>{f.sbti ? '✓' : '–'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Regen Ag Finance' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Sort by:</label>
            <select style={select} value={practiceSort} onChange={e => setPracticeSort(e.target.value)}>
              <option value="carbonSeq">Carbon Sequestration</option>
              <option value="yieldImpact">Yield Impact</option>
              <option value="adoption">Adoption Rate</option>
              <option value="cost">Cost</option>
            </select>
          </div>
          <div style={grid(4)}>
            <KpiCard label="Global Regen Agri" value="$2.4Bn" sub="Annual investment flow 2024" color={T.green} />
            <KpiCard label="Soil Carbon Potential" value="2–5 GtCO₂/yr" sub="Global sequestration potential" color={T.sage} />
            <KpiCard label="Avg Yield Uplift" value={`+${(REGEN_PRACTICES.reduce((a, p) => a + p.yieldImpact, 0) / REGEN_PRACTICES.length).toFixed(1)}%`} sub="Across regen practices" color={T.gold} />
            <KpiCard label="Avg Payback" value={`${(REGEN_PRACTICES.reduce((a, p) => a + p.payback, 0) / REGEN_PRACTICES.length).toFixed(1)} yr`} sub="Average investment payback" color={T.amber} />
          </div>
          <div style={card}>
            <h2 style={h2}>Regenerative Practice Performance Matrix</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sortedPractices.map(p => ({ name: p.practice.split(' ')[0], seq: p.carbonSeq, yield: p.yieldImpact, adopt: p.adoption }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar yAxisId="left" dataKey="seq" name="Carbon Seq (tCO₂/ha/yr)" fill={T.sage} radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="yield" name="Yield Impact (%)" fill={T.gold} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Regen Practice Detail Table</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Practice','Adoption %','Yield Impact','Carbon Seq (t/ha/yr)','Cost ($/ha)','Payback (yr)'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{sortedPractices.map(p => (
                <tr key={p.practice} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '5px 8px', color: T.text, fontWeight: 500 }}>{p.practice}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.teal }}>{p.adoption}%</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: p.yieldImpact > 0 ? T.green : T.red }}>{p.yieldImpact > 0 ? '+' : ''}{p.yieldImpact}%</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.sage }}>{p.carbonSeq}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: T.amber }}>${p.cost}</td>
                  <td style={{ padding: '5px 8px', fontFamily: T.mono, color: p.payback <= 3 ? T.green : T.amber }}>{p.payback}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Green Bonds' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="Total Ag GB Issuance" value={`$${GREEN_BONDS.reduce((a, b) => a + b.volume, 0).toLocaleString()}M`} sub="Tracked green bond portfolio" color={T.green} />
            <KpiCard label="Avg Coupon" value={`${(GREEN_BONDS.reduce((a, b) => a + b.coupon, 0) / GREEN_BONDS.length).toFixed(2)}%`} sub="Portfolio weighted average" color={T.navy} />
            <KpiCard label="Avg Greenium" value={`${(GREEN_BONDS.reduce((a, b) => a + b.greeniumBps, 0) / GREEN_BONDS.length).toFixed(1)} bps`} sub="Green bond pricing advantage" color={T.gold} />
            <KpiCard label="SLB Linked" value={GREEN_BONDS.filter(b => b.kpiLinked).length} sub={`of ${GREEN_BONDS.length} with KPI ratchets`} color={T.teal} />
          </div>
          <div style={card}>
            <h2 style={h2}>Green Bond Volume &amp; Greenium by Issuer</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={gbData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar yAxisId="left" dataKey="volume" name="Volume ($M)" fill={T.green} radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="greenium" name="Greenium (bps)" fill={T.gold} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Green Bond Detail</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Issuer','Volume ($M)','Coupon %','Tenor (yr)','Year','Certification','KPI-Linked','Greenium bps'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{GREEN_BONDS.map(b => (
                <tr key={b.issuer} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '4px 8px', color: T.text, fontWeight: 500 }}>{b.issuer}</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.green }}>{b.volume}</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.amber }}>{b.coupon}%</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.textSec }}>{b.tenor}</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.textSec }}>{b.year}</td>
                  <td style={{ padding: '4px 8px', color: T.teal, fontSize: 10 }}>{b.certification}</td>
                  <td style={{ padding: '4px 8px', color: b.kpiLinked ? T.green : T.textMut }}>{b.kpiLinked ? '✓' : '–'}</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.gold }}>{b.greeniumBps}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'ROI Analytics' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Fund Type:</label>
            <select style={select} value={fundType} onChange={e => setFundType(e.target.value)}>
              {fundTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={grid(3)}>
            <KpiCard label="Total AUM" value={`$${totalAUM.toLocaleString()}M`} sub={`${filteredFunds.length} funds (${fundType})`} color={T.navy} />
            <KpiCard label="Avg Actual Return" value={`${avgReturn}%`} sub="Annual realized return" color={T.green} />
            <KpiCard label="Avg Impact Score" value={avgImpact} sub="Proprietary ESG impact rating" color={T.teal} />
          </div>
          <div style={card}>
            <h2 style={h2}>Return vs Impact — Fund Scatter</h2>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="impactScore" name="Impact Score" label={{ value: 'Impact Score', position: 'insideBottom', offset: -5, fill: T.textSec, fontSize: 11 }} tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis dataKey="actualReturn" name="Actual Return %" label={{ value: 'Return %', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Scatter data={filteredFunds} fill={T.navyL} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Historical Asset Class Returns</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={returnData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Area type="monotone" dataKey="farmland" name="Farmland %" stroke={T.navy} fill={`${T.navy}33`} strokeWidth={2} />
                <Area type="monotone" dataKey="forestry" name="Forestry %" stroke={T.green} fill={`${T.green}33`} strokeWidth={2} />
                <Area type="monotone" dataKey="altProtein" name="Alt Protein %" stroke={T.red} fill={`${T.red}22`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === 'Impact' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="Total Carbon Seq." value="12.4 MtCO₂/yr" sub="Across portfolio farmland/forestry" color={T.sage} />
            <KpiCard label="Farmers Supported" value="~820K" sub="Smallholder integration programs" color={T.teal} />
            <KpiCard label="Biodiversity Score" value="7.2/10" sub="Avg portfolio biodiversity index" color={T.green} />
            <KpiCard label="SDG Alignment" value="SDG 2/13/15" sub="Primary UN SDGs addressed" color={T.navy} />
          </div>
          <div style={card}>
            <h2 style={h2}>Impact Metrics by Fund</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={FUNDS.slice(0, 12).map(f => ({ name: f.name.split(' ').slice(-1)[0], score: f.impactScore, ci: f.carbonIntensity }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar yAxisId="left" dataKey="score" name="Impact Score" fill={T.green} radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="ci" name="Carbon Intensity" fill={T.red} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>SDG Contribution Map</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { sdg: 'SDG 2', title: 'Zero Hunger', color: '#DDA63A', score: 8.4, desc: 'Food security, nutrition & sustainable agriculture' },
                { sdg: 'SDG 6', title: 'Clean Water', color: '#26BDE2', score: 6.2, desc: 'Water use efficiency in irrigation' },
                { sdg: 'SDG 8', title: 'Decent Work', color: '#A21942', score: 5.8, desc: 'Smallholder livelihoods & fair wages' },
                { sdg: 'SDG 12', title: 'Responsible Consumption', color: '#BF8B2E', score: 7.1, desc: 'Reducing food waste and packaging' },
                { sdg: 'SDG 13', title: 'Climate Action', color: '#3F7E44', score: 8.9, desc: 'Carbon sequestration & GHG reduction' },
                { sdg: 'SDG 14', title: 'Life Below Water', color: '#0A97D9', score: 4.5, desc: 'Runoff reduction & watershed protection' },
                { sdg: 'SDG 15', title: 'Life on Land', color: '#56C02B', score: 8.2, desc: 'Biodiversity, soil health & deforestation avoidance' },
                { sdg: 'SDG 17', title: 'Partnerships', color: '#19486A', score: 6.6, desc: 'Blended finance & multi-stakeholder coalitions' },
              ].map(s => (
                <div key={s.sdg} style={{ background: T.surfaceH, borderRadius: 8, padding: 12, border: `1px solid ${s.color}44` }}>
                  <div style={{ fontWeight: 700, color: s.color, fontSize: 12, marginBottom: 4 }}>{s.sdg}</div>
                  <div style={{ fontWeight: 600, color: T.text, fontSize: 11, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginBottom: 8 }}>{s.desc}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: T.textMut }}>Alignment</span>
                    <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: s.color }}>{s.score}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'Portfolio' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Filter:</label>
            <select style={select} value={fundType} onChange={e => setFundType(e.target.value)}>
              {fundTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={card}>
            <h2 style={h2}>Fund Portfolio — {fundType === 'All' ? 'All Types' : fundType}</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Fund Name','Type','AUM ($M)','Vintage','Target Ret. %','Actual Ret. %','Carbon Int.','Impact Score','SBTi'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{filteredFunds.map(f => (
                <tr key={f.name} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '4px 8px', color: T.text, fontWeight: 500 }}>{f.name}</td>
                  <td style={{ padding: '4px 8px', color: T.textSec, fontSize: 10 }}>{f.type}</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.navy }}>{(+f.aum).toLocaleString()}</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.textSec }}>{f.tenure}</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.amber }}>{f.targetReturn}%</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: f.actualReturn >= f.targetReturn ? T.green : T.red }}>{f.actualReturn}%</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.red }}>{f.carbonIntensity}</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.teal }}>{f.impactScore}</td>
                  <td style={{ padding: '4px 8px', color: f.sbti ? T.green : T.textMut }}>{f.sbti ? '✓' : '–'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Opportunities' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="Farmland Global AUM" value="$1.8Tn" sub="Institutional farmland investment" color={T.navy} />
            <KpiCard label="Precision Ag Market" value="$12.9Bn" sub="2025; CAGR 13.1%" color={T.teal} />
            <KpiCard label="Alt Protein VC" value="$4.1Bn" sub="2023 venture investment" color={T.green} />
            <KpiCard label="Carbon Insets" value="$850M" sub="Scope 3 inset credit market 2024" color={T.sage} />
          </div>
          <div style={card}>
            <h2 style={h2}>Investment Theme Landscape</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { theme: 'Farmland (Global N/S)', cap: '$450Bn addressable', horizon: '7–15 yr', return: '7–11%', risk: 'Low-Med', color: T.navy },
                { theme: 'Vertical Farming', cap: '$28Bn by 2030', horizon: '5–10 yr', return: '14–24%', risk: 'High', color: T.teal },
                { theme: 'Carbon Insets', cap: '$2Bn+ by 2027', horizon: '3–8 yr', return: '12–28%', risk: 'Medium', color: T.sage },
                { theme: 'Regen Ag Platforms', cap: '$1.4Bn VC 2024', horizon: '5–10 yr', return: '18–32%', risk: 'High', color: T.green },
                { theme: 'Precision Irrigation', cap: '$6.3Bn market', horizon: '4–8 yr', return: '11–17%', risk: 'Low-Med', color: T.gold },
                { theme: 'Biochar & Soil Tech', cap: '$1.1Bn by 2028', horizon: '6–12 yr', return: '16–26%', risk: 'Medium', color: T.amber },
              ].map(o => (
                <div key={o.theme} style={{ background: T.surfaceH, borderRadius: 8, padding: 14, border: `1px solid ${o.color}44` }}>
                  <div style={{ fontWeight: 600, color: o.color, marginBottom: 8, fontSize: 13 }}>{o.theme}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[{ label: 'Market Size', val: o.cap }, { label: 'Horizon', val: o.horizon },
                      { label: 'Target Return', val: o.return }, { label: 'Risk', val: o.risk }].map(m => (
                      <div key={m.label}>
                        <div style={{ fontSize: 9, color: T.textMut }}>{m.label}</div>
                        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.text }}>{m.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
