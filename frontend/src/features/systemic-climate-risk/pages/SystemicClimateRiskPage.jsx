import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SECTOR_NAMES = [
  'Energy','Financials','Utilities','Materials','Consumer','Industrials',
  'Healthcare','Technology','Real Estate','Transportation',
  'Pharma','Aerospace','Shipping','Mining','Telecoms',
  'Media','Professional Services','Agri & Food','Chemicals','Automotive',
];

const SECTORS = SECTOR_NAMES.map((name, i) => {
  const gdpWeight = 0.02 + sr(i * 7) * 0.10;
  const systRiskIndex = 20 + sr(i * 11) * 75;
  const contagionScore = 10 + sr(i * 13) * 70;
  const physRisk = 10 + sr(i * 17) * 80;
  const transRisk = 10 + sr(i * 19) * 80;
  const leverageRatio = 1.0 + sr(i * 23) * 5.0;
  const liquidityBuffer = 0.05 + sr(i * 29) * 0.45;
  const interconnectedness = 20 + sr(i * 31) * 70;
  const greenRevenuePct = sr(i * 37) * 40;
  const fossilDependency = sr(i * 41) * 60;
  const policyVulnerability = 10 + sr(i * 43) * 80;
  const adaptationScore = 10 + sr(i * 47) * 80;
  const marketShare = 0.01 + sr(i * 53) * 0.12;
  return {
    id: i, name, gdpWeight, systRiskIndex, contagionScore, physRisk, transRisk,
    leverageRatio, liquidityBuffer, interconnectedness, greenRevenuePct,
    fossilDependency, policyVulnerability, adaptationScore, marketShare,
  };
});

// 20×20 contagion network matrix
const NETWORK = SECTORS.map((s, i) =>
  SECTORS.map((t, j) => i === j ? 1.0 : sr(i * 20 + j) * 0.6)
);

// 5 NGFS scenarios, 7 time points 2025-2055
const NGFS_SCENARIOS = [
  { id: 0, name: 'Orderly',             color: T.green,  baseMult: 1.0 },
  { id: 1, name: 'Disorderly',          color: T.amber,  baseMult: 1.4 },
  { id: 2, name: 'Hot House World',     color: T.red,    baseMult: 2.2 },
  { id: 3, name: 'Below 2°C',           color: T.teal,   baseMult: 1.2 },
  { id: 4, name: 'Nationally Determined',color: T.blue,  baseMult: 1.7 },
];
const TIME_POINTS = [2025, 2030, 2035, 2040, 2045, 2050, 2055];

const SCENARIO_SERIES = NGFS_SCENARIOS.map(sc =>
  TIME_POINTS.map((yr, ti) => ({
    year: yr,
    sriLevel: +(40 + sc.baseMult * (5 + ti * 3.5) + sr(sc.id * 7 + ti) * 8).toFixed(2),
  }))
);

// 25 central bank indicators
const CB_INDICATORS = [
  { id: 0,  domain: 'Credit Risk',       name: 'Climate Credit Risk Index',          value: null, threshold: 65 },
  { id: 1,  domain: 'Credit Risk',       name: 'Carbon Loan Exposure Ratio',          value: null, threshold: 30 },
  { id: 2,  domain: 'Credit Risk',       name: 'Stranded Asset Credit Loss',          value: null, threshold: 40 },
  { id: 3,  domain: 'Systemic Risk',     name: 'Systemic Climate Amplification',      value: null, threshold: 70 },
  { id: 4,  domain: 'Systemic Risk',     name: 'Network Contagion Intensity',         value: null, threshold: 55 },
  { id: 5,  domain: 'Systemic Risk',     name: 'Climate Leverage Amplifier',          value: null, threshold: 45 },
  { id: 6,  domain: 'Liquidity',         name: 'Climate Liquidity Risk Score',        value: null, threshold: 50 },
  { id: 7,  domain: 'Liquidity',         name: 'Insurance Protection Gap',            value: null, threshold: 60 },
  { id: 8,  domain: 'Macro',             name: 'GDP Climate Sensitivity',             value: null, threshold: 40 },
  { id: 9,  domain: 'Macro',             name: 'Climate Policy Uncertainty VIX',      value: null, threshold: 35 },
  { id: 10, domain: 'Transition',        name: 'Carbon Lock-In Systemic Score',       value: null, threshold: 55 },
  { id: 11, domain: 'Transition',        name: 'Green Transition Acceleration Index', value: null, threshold: 70 },
  { id: 12, domain: 'Transition',        name: 'Fossil Fuel Exposure Ratio',          value: null, threshold: 25 },
  { id: 13, domain: 'Physical Risk',     name: 'Physical Risk Composite Index',       value: null, threshold: 60 },
  { id: 14, domain: 'Physical Risk',     name: 'Climate Bail-Out Risk',               value: null, threshold: 45 },
  { id: 15, domain: 'Physical Risk',     name: 'Natural Disaster Loss Index',         value: null, threshold: 50 },
  { id: 16, domain: 'Disclosure',        name: 'TCFD Adoption Rate',                  value: null, threshold: 80, higherBetter: true },
  { id: 17, domain: 'Disclosure',        name: 'Net-Zero Credibility Index',          value: null, threshold: 70, higherBetter: true },
  { id: 18, domain: 'Disclosure',        name: 'Scenario Analysis Coverage',          value: null, threshold: 65, higherBetter: true },
  { id: 19, domain: 'Contagion',         name: 'Stranded Asset Cascade Risk',         value: null, threshold: 55 },
  { id: 20, domain: 'Contagion',         name: 'Tipping Point Proximity Index',       value: null, threshold: 50 },
  { id: 21, domain: 'Contagion',         name: 'Climate Contagion Shock Multiplier',  value: null, threshold: 40 },
  { id: 22, domain: 'Amplifier',         name: 'Debt-Climate Amplification',          value: null, threshold: 60 },
  { id: 23, domain: 'Amplifier',         name: 'Climate-Credit Spiral Risk',          value: null, threshold: 50 },
  { id: 24, domain: 'Amplifier',         name: 'Systemic Feedback Loop Score',        value: null, threshold: 65 },
].map((ind, i) => ({
  ...ind,
  value: +(20 + sr(i * 17) * 75).toFixed(1),
  trend: sr(i * 23) > 0.5 ? 'up' : 'down',
}));

const AMPLIFIER_CHANNELS = [
  { id: 0, name: 'Credit & Leverage',   desc: 'Carbon loan exposure × leverage amplification', color: T.indigo },
  { id: 1, name: 'Liquidity & Funding', desc: 'Climate flight-to-quality + collateral haircuts', color: T.blue  },
  { id: 2, name: 'Confidence & Market', desc: 'Climate sentiment shock + repricing cascade',     color: T.amber },
  { id: 3, name: 'Policy & Regulatory', desc: 'Carbon tax shocks + stranded asset regulation',  color: T.red   },
];

const CB_DOMAINS = ['All', ...Array.from(new Set(CB_INDICATORS.map(x => x.domain)))];

const KpiCard = ({ label, value, color = T.text, sub = '' }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const TABS = ['Systemic Risk Dashboard','Sector Database','Network Contagion','Amplifier Channels','Indicator Monitor','Macro Scenarios','Summary & Export'];

export default function SystemicClimateRiskPage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [indicatorBreachFilter, setIndicatorBreachFilter] = useState(false);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [networkDepth, setNetworkDepth] = useState(1);
  const [equalWeight, setEqualWeight] = useState(false);
  const [horizonIdx, setHorizonIdx] = useState(3);
  const [amplifierEnabled, setAmplifierEnabled] = useState([true, true, true, true]);
  const [domainFilter, setDomainFilter] = useState('All');
  const [sortCol, setSortCol] = useState('systRiskIndex');
  const [sortDir, setSortDir] = useState(-1);

  const activeScenario = NGFS_SCENARIOS[scenarioIdx];
  const activeHorizon = TIME_POINTS[horizonIdx];

  const filteredSectors = useMemo(() => {
    let d = SECTORS;
    if (sectorFilter !== 'All') d = d.filter(x => x.name === sectorFilter);
    return [...d].sort((a, b) => sortDir * ((a[sortCol] || 0) - (b[sortCol] || 0)));
  }, [sectorFilter, sortCol, sortDir]);

  // GDP-weighted systemic risk index
  const gdpWeightedSRI = useMemo(() => {
    const totalW = equalWeight ? SECTORS.length : SECTORS.reduce((s, x) => s + x.gdpWeight, 0);
    if (totalW <= 0) return 0;
    return SECTORS.reduce((s, x) => s + x.systRiskIndex * (equalWeight ? 1 : x.gdpWeight), 0) / totalW;
  }, [equalWeight]);

  // Contagion cascade (1-hop or 2-hop)
  const contagionScores = useMemo(() => SECTORS.map((s, i) => {
    const n = SECTORS.length;
    let score1Hop = 0;
    for (let j = 0; j < n; j++) {
      if (i !== j) score1Hop += NETWORK[i][j] * SECTORS[j].systRiskIndex;
    }
    score1Hop = n > 1 ? score1Hop / (n - 1) : 0;

    let score2Hop = score1Hop;
    if (networkDepth >= 2) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          for (let k = 0; k < n; k++) {
            if (k !== i && k !== j) score2Hop += NETWORK[i][j] * NETWORK[j][k] * SECTORS[k].systRiskIndex * 0.3;
          }
        }
      }
      score2Hop = n > 1 ? score2Hop / (n - 1) : 0;
    }
    return { name: s.name, score1Hop: +score1Hop.toFixed(2), score2Hop: +score2Hop.toFixed(2), baseRisk: s.systRiskIndex };
  }), [networkDepth]);

  // Top 5 sector pairs by contagion
  const topPairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < SECTORS.length; i++) {
      for (let j = i + 1; j < SECTORS.length; j++) {
        pairs.push({ from: SECTORS[i].name, to: SECTORS[j].name, strength: +(NETWORK[i][j] * SECTORS[j].systRiskIndex).toFixed(2) });
      }
    }
    return [...pairs].sort((a, b) => b.strength - a.strength).slice(0, 5);
  }, []);

  // Amplifier channel scores
  const amplifierData = useMemo(() => AMPLIFIER_CHANNELS.map((ch, ci) => {
    if (!amplifierEnabled[ci]) return { ...ch, score: 0, enabled: false };
    const score = SECTORS.reduce((s, sec, si) => {
      const channelFactor = [sec.leverageRatio / 6, 1 - sec.liquidityBuffer, sec.systRiskIndex / 100, sec.policyVulnerability / 100][ci];
      return s + channelFactor * sec.gdpWeight;
    }, 0);
    return { ...ch, score: +(score * 100).toFixed(2), enabled: true };
  }), [amplifierEnabled]);

  const enabledAmplifiers = amplifierData.filter(a => a.enabled);
  const combinedAmplification = useMemo(() => {
    if (!enabledAmplifiers.length) return 1.0;
    const product = enabledAmplifiers.reduce((p, a) => p * (1 + a.score / 100), 1);
    return +(Math.pow(product, 1 / enabledAmplifiers.length)).toFixed(3);
  }, [enabledAmplifiers]);

  // CB indicators filtered
  const filteredIndicators = useMemo(() => {
    let d = CB_INDICATORS;
    if (domainFilter !== 'All') d = d.filter(x => x.domain === domainFilter);
    if (indicatorBreachFilter) d = d.filter(x => x.higherBetter ? x.value < x.threshold : x.value > x.threshold);
    return d;
  }, [domainFilter, indicatorBreachFilter]);

  const breachCount = useMemo(() => CB_INDICATORS.filter(x => x.higherBetter ? x.value < x.threshold : x.value > x.threshold).length, []);

  // Scenario time series data
  const scenarioChartData = useMemo(() => TIME_POINTS.map((yr, ti) => {
    const row = { year: yr };
    NGFS_SCENARIOS.forEach(sc => { row[sc.name] = SCENARIO_SERIES[sc.id][ti].sriLevel; });
    return row;
  }), []);

  // Policy response urgency
  const policyUrgency = useMemo(() => SECTORS.map(s => ({
    name: s.name.split(' ')[0],
    urgency: +((s.systRiskIndex * (1 - s.adaptationScore / 100)) * activeScenario.baseMult).toFixed(1),
  })).sort((a, b) => b.urgency - a.urgency), [scenarioIdx]);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortDir(d => -d);
    else { setSortCol(col); setSortDir(-1); }
  }, [sortCol]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>EP-DB6 · Sprint DB · Enterprise Climate Risk Capital</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '4px 0 2px', color: T.navy }}>Systemic Climate Risk Monitor</h1>
        <div style={{ fontSize: 13, color: T.muted }}>20 sectors · 20×20 contagion network · 25 CB indicators · 5 NGFS scenarios · DebtRank amplification</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="GDP-Weighted SRI" value={gdpWeightedSRI.toFixed(1)} color={gdpWeightedSRI > 60 ? T.red : gdpWeightedSRI > 40 ? T.amber : T.green} sub={equalWeight ? 'Equal weighted' : 'GDP weighted'} />
        <KpiCard label="CB Indicator Breaches" value={`${breachCount}/25`} color={breachCount > 10 ? T.red : breachCount > 5 ? T.amber : T.green} sub="vs thresholds" />
        <KpiCard label="Amplification Factor" value={`${combinedAmplification.toFixed(3)}×`} color={combinedAmplification > 1.3 ? T.red : T.amber} sub={`${enabledAmplifiers.length} channels active`} />
        <KpiCard label="Active Scenario" value={activeScenario.name.split(' ')[0]} color={activeScenario.color} sub={`${activeScenario.baseMult}× base mult`} />
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 24 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === i ? 700 : 400, color: tab === i ? T.indigo : T.muted, borderBottom: tab === i ? `2px solid ${T.indigo}` : '2px solid transparent', marginBottom: -2, whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      {/* Global controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, padding: '10px 16px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, alignItems: 'center' }}>
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
          <option>All</option>{SECTOR_NAMES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={scenarioIdx} onChange={e => setScenarioIdx(+e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
          {NGFS_SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={horizonIdx} onChange={e => setHorizonIdx(+e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
          {TIME_POINTS.map((yr, i) => <option key={i} value={i}>{yr}</option>)}
        </select>
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="range" min={1} max={2} value={networkDepth} onChange={e => setNetworkDepth(+e.target.value)} style={{ width: 50 }} /> Network depth: {networkDepth}-hop
        </label>
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={equalWeight} onChange={e => setEqualWeight(e.target.checked)} /> Equal weights
        </label>
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={indicatorBreachFilter} onChange={e => setIndicatorBreachFilter(e.target.checked)} /> Breaches only
        </label>
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Sector Systemic Risk Index (SRI) — {equalWeight ? 'Equal' : 'GDP'} Weighted</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[...SECTORS].sort((a, b) => b.systRiskIndex - a.systRiskIndex)} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip formatter={v => Number(v).toFixed(1)} />
                  <Bar dataKey="systRiskIndex" name="SRI" radius={[2,2,0,0]}>
                    {[...SECTORS].sort((a, b) => b.systRiskIndex - a.systRiskIndex).map((s, i) => (
                      <rect key={i} fill={s.systRiskIndex > 70 ? T.red : s.systRiskIndex > 50 ? T.amber : T.green} />
                    ))}
                  </Bar>
                  <ReferenceLine y={gdpWeightedSRI} stroke={T.indigo} strokeDasharray="4 2" label={{ value: 'Wtd Avg SRI', fontSize: 10, fill: T.indigo }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>5-Scenario SRI Time Series 2025–2055</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={scenarioChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[30, 100]} />
                  <Tooltip formatter={v => Number(v).toFixed(1)} />
                  <Legend />
                  {NGFS_SCENARIOS.map(sc => <Line key={sc.id} type="monotone" dataKey={sc.name} stroke={sc.color} strokeWidth={2} dot={{ r: 3 }} />)}
                  <ReferenceLine y={65} stroke={T.muted} strokeDasharray="3 3" label={{ value: 'Systemic threshold', fontSize: 10, fill: T.muted }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
            {NGFS_SCENARIOS.map(sc => {
              const sriAtHorizon = SCENARIO_SERIES[sc.id][horizonIdx].sriLevel;
              return (
                <div key={sc.id} onClick={() => setScenarioIdx(sc.id)} style={{ padding: '12px 14px', background: sc.id === scenarioIdx ? '#eef2ff' : T.card, border: `2px solid ${sc.id === scenarioIdx ? T.indigo : T.border}`, borderRadius: 8, cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: sc.id === scenarioIdx ? T.indigo : T.text }}>{sc.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: sc.color, marginTop: 4 }}>{sriAtHorizon}</div>
                  <div style={{ fontSize: 10, color: T.muted }}>{activeHorizon} SRI</div>
                  <div style={{ fontSize: 10, color: T.muted }}>{sc.baseMult}× base</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {[['Sector','name'],['GDP Wt','gdpWeight'],['SRI','systRiskIndex'],['Contagion','contagionScore'],['PhysRisk','physRisk'],['TransRisk','transRisk'],['Leverage','leverageRatio'],['Liquidity Buf','liquidityBuffer'],['Intercon','interconnectedness'],['GreenRev%','greenRevenuePct'],['FossilDep%','fossilDependency'],['PolicyVuln','policyVulnerability'],['Adaptation','adaptationScore'],['Market Sh','marketShare']].map(([h,k]) => (
                    <th key={k} onClick={() => handleSort(k)} style={{ padding: '7px 9px', textAlign: 'left', fontWeight: 600, fontSize: 10, color: sortCol === k ? T.indigo : T.muted, borderBottom: `1px solid ${T.border}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>{h}{sortCol === k ? (sortDir > 0 ? ' ↑' : ' ↓') : ''}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSectors.map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? T.card : T.sub, borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 9px', fontWeight: 500 }}>{s.name}</td>
                    <td style={{ padding: '6px 9px' }}>{(s.gdpWeight * 100).toFixed(1)}%</td>
                    <td style={{ padding: '6px 9px', color: s.systRiskIndex > 70 ? T.red : s.systRiskIndex > 50 ? T.amber : T.green, fontWeight: 600 }}>{s.systRiskIndex.toFixed(1)}</td>
                    <td style={{ padding: '6px 9px', color: s.contagionScore > 50 ? T.red : T.text }}>{s.contagionScore.toFixed(1)}</td>
                    <td style={{ padding: '6px 9px', color: s.physRisk > 60 ? T.red : T.text }}>{s.physRisk.toFixed(1)}</td>
                    <td style={{ padding: '6px 9px', color: s.transRisk > 60 ? T.red : T.text }}>{s.transRisk.toFixed(1)}</td>
                    <td style={{ padding: '6px 9px' }}>{s.leverageRatio.toFixed(1)}×</td>
                    <td style={{ padding: '6px 9px', color: s.liquidityBuffer < 0.15 ? T.red : T.green }}>{(s.liquidityBuffer * 100).toFixed(1)}%</td>
                    <td style={{ padding: '6px 9px' }}>{s.interconnectedness.toFixed(1)}</td>
                    <td style={{ padding: '6px 9px', color: T.green }}>{s.greenRevenuePct.toFixed(1)}%</td>
                    <td style={{ padding: '6px 9px', color: s.fossilDependency > 30 ? T.red : T.muted }}>{s.fossilDependency.toFixed(1)}%</td>
                    <td style={{ padding: '6px 9px', color: s.policyVulnerability > 60 ? T.red : T.text }}>{s.policyVulnerability.toFixed(1)}</td>
                    <td style={{ padding: '6px 9px', color: s.adaptationScore < 30 ? T.red : T.green }}>{s.adaptationScore.toFixed(1)}</td>
                    <td style={{ padding: '6px 9px' }}>{(s.marketShare * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: T.muted }}>{filteredSectors.length} sectors · GDP-Weighted Avg SRI: {gdpWeightedSRI.toFixed(1)}</div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Contagion Score by Sector — {networkDepth}-Hop Network</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[...contagionScores].sort((a, b) => b.score2Hop - a.score2Hop)} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => Number(v).toFixed(2)} />
                  <Legend />
                  <Bar dataKey="score1Hop" fill={T.blue} name="1-Hop Contagion" radius={[2,2,0,0]} />
                  {networkDepth >= 2 && <Bar dataKey="score2Hop" fill={T.red} name="2-Hop Cascade" radius={[2,2,0,0]} />}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Top 5 Sector Contagion Pairs</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>{['Source','Target','Contagion Strength','Risk Level'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {topPairs.map((p, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 10px', fontWeight: 500 }}>{p.from}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 500 }}>{p.to}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: p.strength > 25 ? T.red : T.amber }}>{p.strength.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px' }}><span style={{ background: p.strength > 25 ? '#fef2f2' : '#fffbeb', color: p.strength > 25 ? T.red : T.amber, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{p.strength > 25 ? 'CRITICAL' : 'ELEVATED'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 12, padding: '10px 14px', background: T.sub, borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>2-Hop Cascade Analysis</div>
                <div style={{ fontSize: 12, color: T.muted }}>With {networkDepth}-hop depth, cascade amplification factor: <strong style={{ color: T.red }}>{(1 + contagionScores.reduce((s, x) => s + x.score2Hop, 0) / (contagionScores.reduce((s, x) => s + x.score1Hop, 0) || 1) * 0.3).toFixed(2)}×</strong></div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Avg 1-hop: {contagionScores.length ? (contagionScores.reduce((s, x) => s + x.score1Hop, 0) / contagionScores.length).toFixed(2) : 0} | Avg 2-hop: {contagionScores.length ? (contagionScores.reduce((s, x) => s + x.score2Hop, 0) / contagionScores.length).toFixed(2) : 0}</div>
              </div>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Sector Contagion vs Base Risk Matrix</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>{['Sector','Base SRI','1-Hop Score','2-Hop Score','Cascade Uplift','Total Risk'].map(h => <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {[...contagionScores].sort((a, b) => b.score2Hop - a.score2Hop).map((s, i) => {
                    const uplift = s.score1Hop > 0 ? ((s.score2Hop - s.score1Hop) / s.score1Hop * 100) : 0;
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '6px 10px', fontWeight: 500 }}>{s.name}</td>
                        <td style={{ padding: '6px 10px', color: s.baseRisk > 70 ? T.red : T.text }}>{s.baseRisk.toFixed(1)}</td>
                        <td style={{ padding: '6px 10px', color: T.blue }}>{s.score1Hop.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px', color: T.red }}>{s.score2Hop.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px', color: uplift > 20 ? T.red : T.muted }}>{uplift > 0 ? '+' : ''}{uplift.toFixed(1)}%</td>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{(s.baseRisk + s.score2Hop * 0.3).toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ marginBottom: 16, padding: '12px 16px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Amplifier Channel Controls</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {AMPLIFIER_CHANNELS.map((ch, ci) => (
                <label key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={amplifierEnabled[ci]} onChange={e => setAmplifierEnabled(prev => { const n = [...prev]; n[ci] = e.target.checked; return n; })} />
                  <span style={{ fontWeight: 600, color: ch.color }}>{ch.name}</span>
                  <span style={{ fontSize: 11, color: T.muted }}>— {ch.desc}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Amplifier Channel Scores (GDP-weighted)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={amplifierData.filter(a => a.enabled)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${Number(v).toFixed(1)}%`} />
                  <Tooltip formatter={v => `${Number(v).toFixed(2)}%`} />
                  <Bar dataKey="score" name="Channel Score%" radius={[2,2,0,0]}>
                    {amplifierData.filter(a => a.enabled).map((a, i) => <rect key={i} fill={a.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Combined Amplification Factor</div>
              <div style={{ textAlign: 'center', padding: 30 }}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>GEOMETRIC MEAN AMPLIFICATION</div>
                <div style={{ fontSize: 48, fontWeight: 700, color: combinedAmplification > 1.3 ? T.red : combinedAmplification > 1.15 ? T.amber : T.green }}>{combinedAmplification.toFixed(3)}×</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 8 }}>{enabledAmplifiers.length} channels enabled</div>
                <div style={{ fontSize: 12, color: T.muted }}>Portfolio SRI amplified: {(gdpWeightedSRI * combinedAmplification).toFixed(1)}</div>
              </div>
              <div style={{ marginTop: 16 }}>
                {AMPLIFIER_CHANNELS.map((ch, ci) => (
                  <div key={ci} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                    <span style={{ color: amplifierEnabled[ci] ? ch.color : T.muted, fontWeight: amplifierEnabled[ci] ? 600 : 400 }}>{ch.name}</span>
                    <span style={{ fontWeight: 600 }}>{amplifierEnabled[ci] ? `${(amplifierData[ci]?.score || 0).toFixed(2)}%` : 'Disabled'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Amplifier Channel Interaction Heatmap</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
              {AMPLIFIER_CHANNELS.map((ra, ai) => AMPLIFIER_CHANNELS.map((rb, bi) => {
                const interaction = ai === bi ? 1.0 : +(0.2 + sr(ai * 4 + bi) * 0.6).toFixed(2);
                const intensity = interaction;
                return (
                  <div key={`${ai}-${bi}`} style={{ padding: '8px', background: `rgba(79,70,229,${intensity * 0.4})`, borderRadius: 4, textAlign: 'center', fontSize: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 9, color: T.navy }}>{ra.name.split(' ')[0]} × {rb.name.split(' ')[0]}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: ai === bi ? T.indigo : interaction > 0.6 ? T.red : T.text }}>{(interaction * 100).toFixed(0)}</div>
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 16px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, alignItems: 'center' }}>
            <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
              {CB_DOMAINS.map(d => <option key={d}>{d}</option>)}
            </select>
            <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={indicatorBreachFilter} onChange={e => setIndicatorBreachFilter(e.target.checked)} /> Breaches Only ({breachCount} total)
            </label>
            <span style={{ fontSize: 12, color: T.muted }}>{filteredIndicators.length} indicators shown</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>CB Indicator Breach Chart</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredIndicators} layout="vertical" margin={{ left: 180, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={180} />
                  <Tooltip formatter={(v, n, p) => [Number(v).toFixed(1), p.dataKey === 'value' ? 'Value' : 'Threshold']} />
                  <Bar dataKey="value" fill={T.indigo} name="Value" radius={[0,2,2,0]} />
                  <Bar dataKey="threshold" fill={T.border} name="Threshold" radius={[0,2,2,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, overflowY: 'auto', maxHeight: 360 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>25 Indicator Table</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>{['Domain','Indicator','Value','Threshold','Trend','Status'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredIndicators.map((ind, i) => {
                    const breach = ind.higherBetter ? ind.value < ind.threshold : ind.value > ind.threshold;
                    return (
                      <tr key={i} style={{ background: breach ? '#fef2f2' : i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '5px 8px', color: T.indigo, fontWeight: 600, fontSize: 10 }}>{ind.domain}</td>
                        <td style={{ padding: '5px 8px' }}>{ind.name}</td>
                        <td style={{ padding: '5px 8px', fontWeight: 600, color: breach ? T.red : T.green }}>{ind.value.toFixed(1)}</td>
                        <td style={{ padding: '5px 8px', color: T.muted }}>{ind.threshold}</td>
                        <td style={{ padding: '5px 8px' }}><span style={{ fontSize: 14 }}>{ind.trend === 'up' ? '↑' : '↓'}</span></td>
                        <td style={{ padding: '5px 8px' }}><span style={{ background: breach ? '#fef2f2' : '#f0fdf4', color: breach ? T.red : T.green, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{breach ? 'BREACH' : 'OK'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>5-Scenario SRI Evolution 2025–2055</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={scenarioChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[30, 100]} />
                <Tooltip formatter={v => Number(v).toFixed(1)} />
                <Legend />
                {NGFS_SCENARIOS.map(sc => <Area key={sc.id} type="monotone" dataKey={sc.name} stroke={sc.color} fill={sc.color} fillOpacity={0.08} strokeWidth={2} />)}
                <ReferenceLine y={65} stroke={T.navy} strokeDasharray="4 2" label={{ value: 'Critical threshold', fontSize: 10, fill: T.navy }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Policy Response Urgency by Sector — {activeScenario.name}</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={policyUrgency.slice(0, 15)} layout="vertical" margin={{ left: 90, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip formatter={v => Number(v).toFixed(1)} />
                  <Bar dataKey="urgency" fill={T.red} name="Policy Urgency" radius={[0,2,2,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Regulatory Action Threshold Table</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>{['SRI Level','Alert Level','Required Action','Timeline'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {[['< 40','Monitor','Routine monitoring, quarterly reporting','Ongoing'], ['40–55','Watch','Enhanced monitoring, scenario stress testing','6 months'], ['55–65','Alert','Supervisory intervention, capital buffer review','3 months'], ['65–75','Critical','Emergency capital requirements, systemic review','1 month'], ['> 75','Systemic Crisis','Macro-prudential emergency measures, central bank intervention','Immediate']].map(([l, a, d, t], i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600 }}>{l}</td>
                      <td style={{ padding: '7px 10px' }}><span style={{ background: ['#f0fdf4','#fffbeb','#fef3c7','#fef2f2','#fef2f2'][i], color: [T.green, T.amber, T.amber, T.red, T.red][i], padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{a}</span></td>
                      <td style={{ padding: '7px 10px', color: T.muted, fontSize: 11 }}>{d}</td>
                      <td style={{ padding: '7px 10px' }}>{t}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
            <KpiCard label="GDP-Weighted SRI" value={gdpWeightedSRI.toFixed(1)} color={gdpWeightedSRI > 60 ? T.red : T.amber} sub={`${equalWeight ? 'Equal' : 'GDP'} weighted`} />
            <KpiCard label="CB Indicator Breaches" value={`${breachCount}/25`} color={breachCount > 10 ? T.red : T.amber} sub="vs thresholds" />
            <KpiCard label="Amplification Factor" value={`${combinedAmplification.toFixed(3)}×`} color={T.orange} sub="geometric mean" />
            <KpiCard label="Active Scenario" value={activeScenario.name.split(' ')[0]} color={activeScenario.color} sub={`${activeHorizon} horizon`} />
            <KpiCard label="Sectors Monitored" value="20" color={T.navy} sub="across all domains" />
            <KpiCard label="Network Depth" value={`${networkDepth}-hop`} color={T.teal} sub="contagion cascade" />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Full Sector Risk Export — 20 sectors</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Sector','GDP Wt','SRI','Contagion','PhysRisk','TransRisk','Leverage','LiqBuf','Intercon','GreenRev%','FossilDep%','PolicyVuln','Adaptation','1-Hop','2-Hop','Policy Urgency'].map(h => (
                    <th key={h} style={{ padding: '5px 7px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap', fontSize: 9 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTORS.map((s, i) => {
                  const cScore = contagionScores.find(c => c.name === s.name);
                  const urgency = policyUrgency.find(p => p.name === s.name.split(' ')[0]);
                  return (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '4px 7px', fontWeight: 500 }}>{s.name}</td>
                      <td style={{ padding: '4px 7px' }}>{(s.gdpWeight * 100).toFixed(1)}%</td>
                      <td style={{ padding: '4px 7px', color: s.systRiskIndex > 70 ? T.red : T.text, fontWeight: 600 }}>{s.systRiskIndex.toFixed(1)}</td>
                      <td style={{ padding: '4px 7px' }}>{s.contagionScore.toFixed(1)}</td>
                      <td style={{ padding: '4px 7px', color: s.physRisk > 60 ? T.red : T.text }}>{s.physRisk.toFixed(1)}</td>
                      <td style={{ padding: '4px 7px', color: s.transRisk > 60 ? T.red : T.text }}>{s.transRisk.toFixed(1)}</td>
                      <td style={{ padding: '4px 7px' }}>{s.leverageRatio.toFixed(1)}×</td>
                      <td style={{ padding: '4px 7px', color: s.liquidityBuffer < 0.15 ? T.red : T.green }}>{(s.liquidityBuffer * 100).toFixed(1)}%</td>
                      <td style={{ padding: '4px 7px' }}>{s.interconnectedness.toFixed(1)}</td>
                      <td style={{ padding: '4px 7px', color: T.green }}>{s.greenRevenuePct.toFixed(1)}%</td>
                      <td style={{ padding: '4px 7px', color: s.fossilDependency > 30 ? T.red : T.muted }}>{s.fossilDependency.toFixed(1)}%</td>
                      <td style={{ padding: '4px 7px' }}>{s.policyVulnerability.toFixed(1)}</td>
                      <td style={{ padding: '4px 7px', color: s.adaptationScore < 30 ? T.red : T.green }}>{s.adaptationScore.toFixed(1)}</td>
                      <td style={{ padding: '4px 7px', color: T.blue }}>{cScore?.score1Hop.toFixed(2) || '—'}</td>
                      <td style={{ padding: '4px 7px', color: T.red }}>{cScore?.score2Hop.toFixed(2) || '—'}</td>
                      <td style={{ padding: '4px 7px', color: (urgency?.urgency || 0) > 50 ? T.red : T.amber, fontWeight: 600 }}>{urgency?.urgency.toFixed(1) || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>CB Indicator Summary — {filteredIndicators.length} indicators</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
              {CB_INDICATORS.map((ind, i) => {
                const breach = ind.higherBetter ? ind.value < ind.threshold : ind.value > ind.threshold;
                return (
                  <div key={i} style={{ padding: '8px 10px', background: breach ? '#fef2f2' : T.sub, borderRadius: 6, borderLeft: `3px solid ${breach ? T.red : T.green}` }}>
                    <div style={{ fontSize: 9, color: T.muted, marginBottom: 2 }}>{ind.domain}</div>
                    <div style={{ fontSize: 10, fontWeight: 500, marginBottom: 4 }}>{ind.name.length > 22 ? ind.name.substring(0, 22) + '...' : ind.name}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: breach ? T.red : T.green }}>{ind.value.toFixed(1)}</div>
                    <div style={{ fontSize: 9, color: T.muted }}>vs {ind.threshold} threshold</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Systemic Risk Deep Dive — Sector × Scenario Matrix at {activeHorizon}</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    <th style={{ padding:'6px 8px',textAlign:'left',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>Sector</th>
                    {NGFS_SCENARIOS.map(sc=><th key={sc.id} style={{ padding:'6px 8px',textAlign:'center',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap' }}>{sc.name.split(' ')[0]}</th>)}
                    <th style={{ padding:'6px 8px',textAlign:'center',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>Max Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {SECTORS.map((s,si)=>{
                    const scenValues=NGFS_SCENARIOS.map(sc=>{
                      const hrFactor=1+horizonIdx*0.08;
                      return +(s.systRiskIndex*sc.baseMult*hrFactor*(0.85+sr(si*7+sc.id*3)*0.3)).toFixed(1);
                    });
                    const maxVal=Math.max(...scenValues);
                    return (
                      <tr key={si} style={{ background:si%2===0?T.card:T.sub,borderBottom:`1px solid ${T.border}` }}>
                        <td style={{ padding:'5px 8px',fontWeight:500 }}>{s.name}</td>
                        {scenValues.map((val,vi)=>{
                          const intensity=Math.min(1,val/120);
                          return <td key={vi} style={{ padding:'5px 8px',textAlign:'center',fontWeight:600,color:val>80?T.red:val>60?T.amber:T.green,background:`rgba(220,38,38,${intensity*0.2})` }}>{val}</td>;
                        })}
                        <td style={{ padding:'5px 8px',textAlign:'center',fontWeight:700,color:maxVal>80?T.red:T.amber }}>{maxVal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Central Bank Response Framework & Indicator Domain Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
              {Array.from(new Set(CB_INDICATORS.map(x=>x.domain))).map(domain=>{
                const sub=CB_INDICATORS.filter(x=>x.domain===domain);
                const breaches=sub.filter(x=>x.higherBetter?x.value<x.threshold:x.value>x.threshold).length;
                const avgVal=sub.reduce((s,x)=>s+x.value,0)/sub.length;
                return (
                  <div key={domain} style={{ padding:'10px 14px',background:breaches>0?'#fef2f2':T.sub,borderRadius:8,borderLeft:`3px solid ${breaches>0?T.red:T.green}` }}>
                    <div style={{ fontWeight:600,fontSize:12,color:T.navy }}>{domain}</div>
                    <div style={{ fontSize:11,color:T.muted,marginTop:2 }}>{sub.length} indicators | {breaches} breaches</div>
                    <div style={{ fontSize:16,fontWeight:700,color:breaches>0?T.red:T.green,marginTop:4 }}>Avg: {avgVal.toFixed(1)}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontWeight:600,fontSize:13,marginBottom:8 }}>Sector Adaptation Gap Analysis</div>
                <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                  <thead><tr style={{ background:T.sub }}>{['Sector','SRI','Adapt Score','Policy Urgency','Net Risk','Gap'].map(h=><th key={h} style={{ padding:'5px 8px',textAlign:'left',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[...SECTORS].sort((a,b)=>b.systRiskIndex-a.systRiskIndex).slice(0,10).map((s,i)=>{
                      const netRisk=s.systRiskIndex*(1-s.adaptationScore/100);
                      const gap=s.systRiskIndex-s.adaptationScore;
                      return (
                        <tr key={i} style={{ background:i%2===0?T.card:T.sub }}>
                          <td style={{ padding:'5px 8px',fontWeight:500 }}>{s.name}</td>
                          <td style={{ padding:'5px 8px',color:s.systRiskIndex>70?T.red:T.text,fontWeight:600 }}>{s.systRiskIndex.toFixed(1)}</td>
                          <td style={{ padding:'5px 8px',color:s.adaptationScore<30?T.red:T.green }}>{s.adaptationScore.toFixed(1)}</td>
                          <td style={{ padding:'5px 8px',color:T.amber }}>{((s.systRiskIndex*(1-s.adaptationScore/100))*activeScenario.baseMult).toFixed(1)}</td>
                          <td style={{ padding:'5px 8px',fontWeight:600 }}>{netRisk.toFixed(1)}</td>
                          <td style={{ padding:'5px 8px',color:gap>40?T.red:T.muted }}>{gap.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div>
                <div style={{ fontWeight:600,fontSize:13,marginBottom:8 }}>GDP-Weighted Risk Decomposition</div>
                <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                  <thead><tr style={{ background:T.sub }}>{['Sector','GDP Wt','Weighted SRI','Weighted Contagion','Fossil Dep Index','Contribution%'].map(h=><th key={h} style={{ padding:'5px 8px',textAlign:'left',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {(() => {
                      const totalW=equalWeight?SECTORS.length:SECTORS.reduce((s,x)=>s+x.gdpWeight,0);
                      return [...SECTORS].sort((a,b)=>b.systRiskIndex*b.gdpWeight-a.systRiskIndex*a.gdpWeight).slice(0,10).map((s,i)=>{
                        const w=equalWeight?1:s.gdpWeight;
                        const wSRI=s.systRiskIndex*w;
                        const wContagion=s.contagionScore*w;
                        const contribution=totalW>0?wSRI/totalW/gdpWeightedSRI*100:0;
                        return (
                          <tr key={i} style={{ background:i%2===0?T.card:T.sub }}>
                            <td style={{ padding:'5px 8px',fontWeight:500 }}>{s.name}</td>
                            <td style={{ padding:'5px 8px' }}>{(s.gdpWeight*100).toFixed(1)}%</td>
                            <td style={{ padding:'5px 8px',fontWeight:600,color:wSRI>5?T.red:T.text }}>{wSRI.toFixed(2)}</td>
                            <td style={{ padding:'5px 8px' }}>{wContagion.toFixed(2)}</td>
                            <td style={{ padding:'5px 8px',color:s.fossilDependency>30?T.red:T.muted }}>{s.fossilDependency.toFixed(1)}%</td>
                            <td style={{ padding:'5px 8px',color:contribution>15?T.red:T.muted,fontWeight:contribution>10?600:400 }}>{contribution.toFixed(1)}%</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Additional: Policy Urgency & Indicator Deep-Dive ── */}
      {activeTab === 'indicators' && (
        <div style={{ display:'flex',flexDirection:'column',gap:16,marginTop:16 }}>
          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Central Bank Domain Readiness Scorecard</div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10 }}>
              {CB_DOMAINS.map((domain,di)=>{
                const domainIndicators=CB_INDICATORS.filter(ind=>ind.domain===domain);
                const avgScore=domainIndicators.length?domainIndicators.reduce((s,ind)=>s+ind.value,0)/domainIndicators.length:0;
                const alertCount=domainIndicators.filter(ind=>ind.value>ind.threshold).length;
                return (
                  <div key={domain} style={{ background:T.sub,borderRadius:8,padding:12 }}>
                    <div style={{ fontWeight:700,fontSize:11,color:T.text,marginBottom:6 }}>{domain}</div>
                    <div style={{ fontSize:22,fontWeight:800,color:avgScore>70?T.red:avgScore>50?T.amber:T.green,marginBottom:4 }}>{avgScore.toFixed(1)}</div>
                    <div style={{ fontSize:10,color:T.muted }}>Avg Risk Score</div>
                    <div style={{ marginTop:8,fontSize:10 }}>
                      <span style={{ color:T.muted }}>Indicators: {domainIndicators.length} | </span>
                      <span style={{ color:alertCount>0?T.red:T.green,fontWeight:600 }}>{alertCount} alerts</span>
                    </div>
                    <div style={{ marginTop:6,background:T.border,borderRadius:4,height:4,overflow:'hidden' }}>
                      <div style={{ width:`${Math.min(100,avgScore)}%`,height:'100%',background:avgScore>70?T.red:avgScore>50?T.amber:T.green }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Sector Systemic Risk Index — NGFS Scenario Comparison</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SECTORS.slice(0,10).map(s=>({
                sector:s.name.substring(0,10),
                orderly:+(s.systemicRiskIndex*(SCENARIOS[0].physMult+SCENARIOS[0].transMult)/2).toFixed(2),
                hotHouse:+(s.systemicRiskIndex*(SCENARIOS[4].physMult+SCENARIOS[4].transMult)/2).toFixed(2),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize:9 }} />
                <YAxis tick={{ fontSize:10 }} />
                <Tooltip formatter={v=>`${Number(v).toFixed(2)}`} />
                <Legend />
                <Bar dataKey="orderly" fill={T.teal} name="Orderly 1.5°C" radius={[2,2,0,0]} />
                <Bar dataKey="hotHouse" fill={T.red} name="Hot House 4°C+" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Network Contagion Heatmap — Top 10 Sector Pairs (2-Hop Risk)</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ borderCollapse:'collapse',fontSize:10 }}>
                <thead>
                  <tr style={{ background:T.sub }}>
                    <th style={{ padding:'4px 6px',width:90 }}></th>
                    {SECTORS.slice(0,8).map(s=>(
                      <th key={s.name} style={{ padding:'4px 5px',textAlign:'right',color:T.muted,fontWeight:500 }}>{s.name.substring(0,6)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SECTORS.slice(0,8).map((row,ri)=>(
                    <tr key={row.name}>
                      <td style={{ padding:'4px 6px',fontWeight:600,color:T.text,fontSize:10 }}>{row.name.substring(0,9)}</td>
                      {SECTORS.slice(0,8).map((col,ci)=>{
                        const val=ri===ci?1:NETWORK[ri][ci];
                        const twoHop=SECTORS.slice(0,8).reduce((s,_,k)=>s+NETWORK[ri][k]*NETWORK[k][ci],0);
                        const combined=Math.min(1,val+twoHop*0.3);
                        const bg=ri===ci?T.navy:combined>0.6?`${T.red}60`:combined>0.35?`${T.amber}50`:combined>0.15?`${T.teal}30`:'transparent';
                        return (
                          <td key={col.name} style={{ padding:'4px 5px',textAlign:'right',background:bg,color:ri===ci?'#fff':T.text,fontWeight:combined>0.5?700:400 }}>
                            {ri===ci?'—':combined.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Policy Urgency Index — Scenario × Adaptation Capacity</div>
            <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
              {SCENARIOS.map((sc,si)=>{
                const avgPU=SECTORS.length?SECTORS.reduce((s,sec)=>{
                  const pu=(sec.systemicRiskIndex*(1-sec.adaptationScore/100))*(sc.physMult+sc.transMult)/2;
                  return s+pu;
                },0)/SECTORS.length:0;
                const barW=Math.min(100,avgPU*15);
                return (
                  <div key={sc.name} style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <div style={{ width:160,fontSize:10,color:T.muted }}>{sc.name}</div>
                    <div style={{ flex:1,background:T.sub,borderRadius:4,height:16,overflow:'hidden' }}>
                      <div style={{ width:`${barW}%`,height:'100%',background:si===4?T.red:si>=2?T.amber:T.green,borderRadius:4 }} />
                    </div>
                    <div style={{ width:50,textAlign:'right',fontSize:10,fontWeight:700,color:si===4?T.red:T.text }}>{avgPU.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Macro GDP Scenario Impact — By Sector Category</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                <thead>
                  <tr style={{ background:T.sub }}>
                    <th style={{ padding:'6px 10px',textAlign:'left',color:T.muted }}>Sector</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>GDP Weight</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>SRI</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Fossil Dep</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Orderly ΔGDPpp</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Disorderly ΔGDPpp</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Hot House ΔGDPpp</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Adaptation Score</th>
                  </tr>
                </thead>
                <tbody>
                  {SECTORS.map((s,si)=>{
                    const orderly=-(s.fossilDependency*0.01*SCENARIOS[0].transMult+s.systemicRiskIndex*0.05*SCENARIOS[0].physMult);
                    const disorderly=-(s.fossilDependency*0.015*SCENARIOS[2].transMult+s.systemicRiskIndex*0.07*SCENARIOS[2].physMult);
                    const hotHouse=-(s.fossilDependency*0.02*SCENARIOS[4].transMult+s.systemicRiskIndex*0.12*SCENARIOS[4].physMult);
                    return (
                      <tr key={s.name} style={{ background:si%2===0?T.card:T.sub }}>
                        <td style={{ padding:'5px 10px',fontWeight:600,fontSize:11 }}>{s.name}</td>
                        <td style={{ padding:'5px 8px',textAlign:'right' }}>{(s.gdpWeight*100).toFixed(1)}%</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:s.systemicRiskIndex>7?T.red:T.text }}>{s.systemicRiskIndex.toFixed(1)}</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:s.fossilDependency>40?T.red:T.muted }}>{s.fossilDependency.toFixed(1)}%</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:orderly<-2?T.red:T.text }}>{orderly.toFixed(2)}pp</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:disorderly<-3?T.red:T.amber }}>{disorderly.toFixed(2)}pp</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:T.red,fontWeight:700 }}>{hotHouse.toFixed(2)}pp</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:s.adaptationScore>60?T.green:T.amber }}>{s.adaptationScore.toFixed(0)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Amplifier Channel Contribution — Scenario × Channel Heatmap</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:11 }}>
                <thead>
                  <tr style={{ background:T.sub }}>
                    <th style={{ padding:'5px 8px',textAlign:'left',color:T.muted }}>Scenario</th>
                    {AMPLIFIER_CHANNELS.map(ch=>(
                      <th key={ch.name} style={{ padding:'5px 6px',textAlign:'right',color:T.muted,fontSize:10 }}>{ch.name.split(' ')[0]}</th>
                    ))}
                    <th style={{ padding:'5px 6px',textAlign:'right',color:T.muted,fontWeight:700 }}>Combined</th>
                  </tr>
                </thead>
                <tbody>
                  {SCENARIOS.map((sc,si)=>{
                    const chVals=AMPLIFIER_CHANNELS.map(ch=>{
                      const base=ch.baseScore*(sc.physMult*0.5+sc.transMult*0.5);
                      return Math.min(10,base);
                    });
                    const combined=chVals.length?Math.pow(chVals.reduce((p,v)=>p*v,1),1/chVals.length):1;
                    return (
                      <tr key={sc.name} style={{ background:si%2===0?T.card:T.sub }}>
                        <td style={{ padding:'4px 8px',fontWeight:600,fontSize:10 }}>{sc.name}</td>
                        {chVals.map((v,vi)=>{
                          const bg=v>7?`${T.red}30`:v>5?`${T.amber}30`:`${T.teal}20`;
                          return <td key={vi} style={{ padding:'4px 6px',textAlign:'right',background:bg,color:v>7?T.red:v>5?T.amber:T.text }}>{v.toFixed(1)}</td>;
                        })}
                        <td style={{ padding:'4px 6px',textAlign:'right',fontWeight:700,color:combined>6?T.red:T.text }}>{combined.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Fossil Dependency × Systemic Risk — Bubble Analysis (Top 20 Sectors)</div>
            <ResponsiveContainer width="100%" height={180}>
              <ScatterChart margin={{ top:5,right:20,bottom:20,left:10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="fossil" name="Fossil Dependency %" tick={{ fontSize:10 }} label={{ value:'Fossil Dep%',position:'insideBottom',offset:-10,fontSize:10 }} />
                <YAxis dataKey="sri" name="Systemic Risk Index" tick={{ fontSize:10 }} />
                <Tooltip formatter={(v,n)=>[typeof v==='number'?v.toFixed(2):v,n]} />
                <Scatter data={SECTORS.map(s=>({ fossil:s.fossilDependency, sri:s.systemicRiskIndex, gdp:s.gdpWeight }))} fill={T.indigo} opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
