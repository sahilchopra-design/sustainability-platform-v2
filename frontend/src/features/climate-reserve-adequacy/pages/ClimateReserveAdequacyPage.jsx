import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ComposedChart, Area, ScatterChart, Scatter,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const NGFS_SCENARIOS = ['Net Zero 2050', 'Delayed Transition', 'Divergent Net Zero', 'Nationally Determined', 'Current Policies', 'Fragmented World'];
const SCEN_MULTS = [1.05, 1.12, 1.09, 1.18, 1.28, 1.38];
const SCEN_COLORS = ['#16a34a','#d97706','#0369a1','#ea580c','#dc2626','#7c3aed'];
const HORIZONS = [2025, 2030, 2040];

const LOB_NAMES = [
  'Motor Liability','Property Catastrophe','Workers Compensation','Marine & Liability',
  'Health & Life Reinsurance','Directors & Officers','Professional Indemnity',
  'Cyber Liability','Product Liability','Aviation & Space',
  'Flood Re','Wildfire Reinsurance','Agricultural Index','Directors & Officers Climate',
  'Professional Indemnity Climate','Marine Hull Climate','Employers Liability Climate',
  'Product Liability Green','Aviation Climate','Cyber-Climate Intersection',
];

const LOBS = LOB_NAMES.map((name, i) => {
  const premiumIncome = +(sr(i * 23 + 1) * 800 + 100).toFixed(0);
  const paidLoss = +(sr(i * 23 + 2) * 55 + 35).toFixed(1);
  const incurredLoss = +(paidLoss + sr(i * 23 + 3) * 8).toFixed(1);
  const devFactors = Array.from({ length: 7 }, (_, j) => +(1 + sr(i * 23 + 4 + j) * 0.15).toFixed(4));
  const cumulativeFactor = devFactors.reduce((a, b) => a * b, 1);
  const baseIBNR = +(premiumIncome * (sr(i * 23 + 11) * 0.25 + 0.05)).toFixed(0);
  const climateDevFactor = +(sr(i * 23 + 12) * 0.15 + 0.02).toFixed(4);
  const tailFactor = +(sr(i * 23 + 13) * 0.08 + 1.01).toFixed(4);
  const discountRate = +(sr(i * 23 + 14) * 0.03 + 0.01).toFixed(4);
  const reportingLag = Math.round(sr(i * 23 + 15) * 48 + 6);
  const ceded = +(sr(i * 23 + 16) * 0.45 + 0.05).toFixed(3);
  const longtail = sr(i * 23 + 17) > 0.5;
  const pvReserve = +(baseIBNR / Math.pow(1 + discountRate, reportingLag / 12)).toFixed(0);
  const scoreFactor = (1 - climateDevFactor * 3) * (1 - sr(i * 23 + 18) * 0.3);
  const lossTriangle = Array.from({ length: 8 }, (_, p) => +(premiumIncome * paidLoss / 100 * (p + 1) / 8 * (1 + sr(i * 23 + 19 + p) * 0.1)).toFixed(0));
  return {
    id: i, name,
    premiumIncome: +premiumIncome,
    baseIBNR: +baseIBNR,
    climateDevFactor,
    tailRiskFactor: tailFactor,
    reportingLag,
    reserveAdequacyScore: +(scoreFactor * 80 + 55).toFixed(1),
    longtailExposure: longtail,
    cededToReinsurance: ceded,
    netRetention: +(1 - ceded).toFixed(3),
    paidLossRatio: +paidLoss,
    incurredLossRatio: +incurredLoss,
    ultimateLossRatio: +(incurredLoss + sr(i * 23 + 20) * 5).toFixed(1),
    lossTrianglePeriods: lossTriangle,
    developmentFactors: devFactors,
    ibnrEstimate: +baseIBNR,
    discountRate,
    presentValueReserve: +pvReserve,
    cumulativeDevFactor: +cumulativeFactor.toFixed(4),
  };
});

function calcBFIBNR(lob, si) {
  const unreportedPct = 1 / (lob.cumulativeDevFactor > 0 ? lob.cumulativeDevFactor : 1);
  const expUltimate = lob.premiumIncome * lob.ultimateLossRatio / 100;
  const bf = unreportedPct * expUltimate;
  return +(bf * (1 + lob.climateDevFactor * SCEN_MULTS[si])).toFixed(0);
}
function calcChainLadderIBNR(lob) {
  const cdf = lob.cumulativeDevFactor;
  const paid = lob.paidLossRatio / 100 * lob.premiumIncome;
  return +(paid * cdf - paid).toFixed(0);
}
function calcClimateIBNR(lob, si) {
  return +(lob.baseIBNR * (1 + lob.climateDevFactor * SCEN_MULTS[si])).toFixed(0);
}
function calcDiscountedReserve(lob, discRate) {
  const rate = discRate / 100;
  return lob.reportingLag > 0 ? +(lob.baseIBNR / Math.pow(1 + rate, lob.reportingLag / 12)).toFixed(0) : lob.baseIBNR;
}
function calcSolvencyRiskMargin(lob) {
  const cocRate = 0.06;
  const duration = lob.reportingLag / 12;
  const reqCapital = lob.baseIBNR * 0.15;
  return +(cocRate * reqCapital * duration).toFixed(0);
}
function calcReservePercentile(lob, pct) {
  const seedMap = { 75: 1, 95: 2, 99.5: 3 };
  const seed = seedMap[pct] || 1;
  const factor = 1 + sr(lob.id * 31 + seed) * (pct === 99.5 ? 0.6 : pct === 95 ? 0.35 : 0.15);
  return +(lob.baseIBNR * factor).toFixed(0);
}

const KpiCard = ({ label, value, unit, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}<span style={{ fontSize: 12, color: T.muted, marginLeft: 4 }}>{unit}</span></div>
  </div>
);

const TabBtn = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: '7px 16px', background: active ? T.indigo : 'transparent', color: active ? '#fff' : T.muted, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: active ? 700 : 400, fontSize: 12 }}>{label}</button>
);

export default function ClimateReserveAdequacyPage() {
  const [tab, setTab] = useState(0);
  const [scenIdx, setScenIdx] = useState(0);
  const [longtailOnly, setLongtailOnly] = useState(false);
  const [devPeriod, setDevPeriod] = useState(8);
  const [discountSlider, setDiscountSlider] = useState(2.0);
  const [adequacyMin, setAdequacyMin] = useState(0);
  const [cessionFilter, setCessionFilter] = useState(0);
  const [search, setSearch] = useState('');
  const [drillLob, setDrillLob] = useState(0);
  const [sortCol, setSortCol] = useState('reserveAdequacyScore');
  const [sortAsc, setSortAsc] = useState(false);
  const [compareA, setCompareA] = useState(0);
  const [compareB, setCompareB] = useState(1);

  const filtered = useMemo(() => {
    let d = LOBS;
    if (longtailOnly) d = d.filter(l => l.longtailExposure);
    d = d.filter(l => l.reserveAdequacyScore >= adequacyMin);
    d = d.filter(l => l.cededToReinsurance >= cessionFilter / 100);
    if (search) d = d.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));
    return d;
  }, [longtailOnly, adequacyMin, cessionFilter, search]);

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => sortAsc ? (a[sortCol] > b[sortCol] ? 1 : -1) : (a[sortCol] < b[sortCol] ? 1 : -1));
  }, [filtered, sortCol, sortAsc]);

  const globalKpis = useMemo(() => {
    if (!filtered.length) return { avgAdequacy: 0, totalIBNR: 0, avgClimateLoad: 0, totalPV: 0 };
    const avgAdequacy = filtered.reduce((s, l) => s + l.reserveAdequacyScore, 0) / filtered.length;
    const totalIBNR = filtered.reduce((s, l) => s + calcClimateIBNR(l, scenIdx), 0);
    const avgClimateLoad = filtered.reduce((s, l) => s + l.climateDevFactor * 100, 0) / filtered.length;
    const totalPV = filtered.reduce((s, l) => s + calcDiscountedReserve(l, discountSlider), 0);
    return { avgAdequacy: +avgAdequacy.toFixed(1), totalIBNR: Math.round(totalIBNR), avgClimateLoad: +avgClimateLoad.toFixed(2), totalPV: Math.round(totalPV) };
  }, [filtered, scenIdx, discountSlider]);

  const devFactorData = useMemo(() => filtered.map(l => ({
    name: l.name.length > 14 ? l.name.slice(0, 14) + '…' : l.name,
    climateDev: +(l.climateDevFactor * 100).toFixed(2),
    bf: calcBFIBNR(l, scenIdx),
    cl: calcChainLadderIBNR(l),
  })), [filtered, scenIdx]);

  const drillL = LOBS[drillLob];

  const triangleData = useMemo(() => {
    return Array.from({ length: devPeriod }, (_, period) => {
      const obj = { period: `P${period + 1}` };
      obj.paid = drillL.lossTrianglePeriods[Math.min(period, 7)];
      if (period < drillL.developmentFactors.length) {
        obj.cumulative = +(drillL.lossTrianglePeriods.slice(0, period + 1).reduce((a, b) => a + b, 0) / drillL.premiumIncome * 100).toFixed(2);
        obj.devFactor = drillL.developmentFactors[period] || 1;
      }
      return obj;
    });
  }, [drillLob, devPeriod]);

  const discountSensitivity = useMemo(() => Array.from({ length: 11 }, (_, i) => {
    const rate = i * 0.5;
    return {
      rate: rate.toFixed(1) + '%',
      discountedReserve: filtered.length ? Math.round(filtered.reduce((s, l) => s + calcDiscountedReserve(l, rate), 0)) : 0,
    };
  }), [filtered]);

  const scenarioGapData = useMemo(() => {
    return HORIZONS.map((yr, hi) => {
      const obj = { year: yr };
      NGFS_SCENARIOS.forEach((sc, si) => {
        const scale = 1 + (SCEN_MULTS[si] - 1) * (hi / 2);
        obj[sc] = filtered.length ? Math.round(filtered.reduce((s, l) => s + l.baseIBNR * (1 + l.climateDevFactor * scale), 0)) : 0;
      });
      return obj;
    });
  }, [filtered]);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortAsc(v => !v);
    else { setSortCol(col); setSortAsc(false); }
  }, [sortCol]);

  const TABS = ['Reserve Dashboard','LoB Database','Development Factors','Run-Off Triangle','Solvency II Reserves','Scenario Stress','Summary & Export'];
  const thS = (col) => ({ padding: '7px 8px', textAlign: 'left', cursor: 'pointer', fontWeight: 700, fontSize: 11, borderBottom: `2px solid ${T.border}`, color: sortCol === col ? T.indigo : T.text, whiteSpace: 'nowrap' });
  const tdS = { padding: '5px 8px', fontSize: 11 };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text, padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>EP-DC3 · Sprint DC · Climate-Integrated Actuarial Intelligence Suite</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: '0 0 6px' }}>Climate Reserve Adequacy Analyzer</h1>
        <div style={{ fontSize: 12, color: T.muted }}>20 lines of business · Bornhuetter-Ferguson & chain-ladder · Solvency II risk margin · 6 NGFS scenarios</div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, background: T.card, padding: 14, borderRadius: 8, border: `1px solid ${T.border}`, alignItems: 'center' }}>
        <select value={scenIdx} onChange={e => setScenIdx(+e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          {NGFS_SCENARIOS.map((s, i) => <option key={s} value={i}>{s} (×{SCEN_MULTS[i]})</option>)}
        </select>
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={longtailOnly} onChange={e => setLongtailOnly(e.target.checked)} /> Long-tail only
        </label>
        <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          Dev Period: <input type="range" min={1} max={8} value={devPeriod} onChange={e => setDevPeriod(+e.target.value)} style={{ width: 80 }} /> {devPeriod}
        </label>
        <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          Discount: <input type="range" min={0} max={50} value={discountSlider * 10} onChange={e => setDiscountSlider(+e.target.value / 10)} style={{ width: 80 }} /> {discountSlider.toFixed(1)}%
        </label>
        <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          Adequacy≥ <input type="range" min={0} max={100} value={adequacyMin} onChange={e => setAdequacyMin(+e.target.value)} style={{ width: 80 }} /> {adequacyMin}
        </label>
        <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          Cession≥ <input type="range" min={0} max={40} value={cessionFilter} onChange={e => setCessionFilter(+e.target.value)} style={{ width: 80 }} /> {cessionFilter}%
        </label>
        <input placeholder="Search LoB…" value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: 140 }} />
        <span style={{ fontSize: 11, color: T.muted }}>{filtered.length} / 20 LoB</span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', background: T.card, padding: 8, borderRadius: 8, border: `1px solid ${T.border}` }}>
        {TABS.map((t, i) => <TabBtn key={t} label={t} active={tab === i} onClick={() => setTab(i)} />)}
      </div>

      {/* TAB 0: Reserve Dashboard */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Avg Reserve Adequacy" value={globalKpis.avgAdequacy} unit="" color={globalKpis.avgAdequacy < 65 ? T.red : T.green} />
            <KpiCard label="Total Climate IBNR" value={globalKpis.totalIBNR.toLocaleString()} unit="$M" color={T.orange} />
            <KpiCard label="Avg Climate Dev Factor" value={globalKpis.avgClimateLoad} unit="%" color={T.red} />
            <KpiCard label="Total PV Reserve" value={globalKpis.totalPV.toLocaleString()} unit="$M" color={T.navy} />
            <KpiCard label="Scenario" value={NGFS_SCENARIOS[scenIdx].split(' ')[0]} unit="" color={T.indigo} />
            <KpiCard label="Discount Rate" value={discountSlider.toFixed(1)} unit="%" color={T.teal} />
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Reserve Gap by LoB — Climate IBNR vs Base ({NGFS_SCENARIOS[scenIdx]})</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={filtered.map(l => ({ name: l.name.slice(0, 14), baseIBNR: l.baseIBNR, climateAdd: calcClimateIBNR(l, scenIdx) - l.baseIBNR }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="baseIBNR" name="Base IBNR $M" fill={T.navy} stackId="a" />
                <Bar dataKey="climateAdd" name="Climate Add-on $M" fill={T.red} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Reserve Adequacy Score Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { range: '<60 (Poor)', count: filtered.filter(l => l.reserveAdequacyScore < 60).length },
                { range: '60-70 (Below)', count: filtered.filter(l => l.reserveAdequacyScore >= 60 && l.reserveAdequacyScore < 70).length },
                { range: '70-80 (Adequate)', count: filtered.filter(l => l.reserveAdequacyScore >= 70 && l.reserveAdequacyScore < 80).length },
                { range: '≥80 (Strong)', count: filtered.filter(l => l.reserveAdequacyScore >= 80).length },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="LoB Count" fill={T.teal} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 1: LoB Database */}
      {tab === 1 && (
        <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>LoB Database — {sortedFiltered.length} / 20</span>
            <span style={{ fontSize: 11, color: T.muted }}>Click header to sort · Click row to set drill-down LoB</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ background: T.sub }}>
                {[['name','LoB'],['premiumIncome','Premium $M'],['baseIBNR','Base IBNR $M'],['climateDevFactor','Climate Dev Factor'],['tailRiskFactor','Tail Factor'],['reportingLag','Report Lag (mo)'],['reserveAdequacyScore','Adq Score'],['longtailExposure','Long-tail'],['cededToReinsurance','Ceded %'],['paidLossRatio','Paid LR %'],['incurredLossRatio','Incurred LR %'],['ultimateLossRatio','Ultimate LR %'],['discountRate','Discount Rate'],['presentValueReserve','PV Reserve $M']].map(([col, label]) => (
                  <th key={col} onClick={() => handleSort(col)} style={thS(col)}>{label}{sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : ''}</th>
                ))}
              </tr></thead>
              <tbody>{sortedFiltered.map((l, i) => (
                <tr key={l.id} style={{ background: i % 2 === 0 ? T.bg : T.card, cursor: 'pointer' }} onClick={() => setDrillLob(l.id)}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{l.name}</td>
                  <td style={tdS}>${l.premiumIncome}M</td>
                  <td style={tdS}>${l.baseIBNR}M</td>
                  <td style={{ ...tdS, color: l.climateDevFactor > 0.1 ? T.red : T.text }}>{(l.climateDevFactor * 100).toFixed(2)}%</td>
                  <td style={tdS}>{l.tailRiskFactor}</td>
                  <td style={tdS}>{l.reportingLag} mo</td>
                  <td style={{ ...tdS, color: l.reserveAdequacyScore < 65 ? T.red : T.green, fontWeight: 600 }}>{l.reserveAdequacyScore}</td>
                  <td style={tdS}>{l.longtailExposure ? '✓' : '—'}</td>
                  <td style={tdS}>{(l.cededToReinsurance * 100).toFixed(1)}%</td>
                  <td style={tdS}>{l.paidLossRatio}%</td>
                  <td style={tdS}>{l.incurredLossRatio}%</td>
                  <td style={tdS}>{l.ultimateLossRatio}%</td>
                  <td style={tdS}>{(l.discountRate * 100).toFixed(2)}%</td>
                  <td style={tdS}>${l.presentValueReserve}M</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Development Factors */}
      {tab === 2 && (
        <div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Climate Dev Factor by LoB ({NGFS_SCENARIOS[scenIdx]})</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={devFactorData} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="climateDev" name="Climate Dev %" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>BF vs Chain-Ladder IBNR Comparison</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={devFactorData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="bf" name="BF IBNR $M" fill={T.indigo} />
                <Bar dataKey="cl" name="Chain-Ladder IBNR $M" fill={T.teal} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>LoB Reserve Comparison Table</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr style={{ background: T.sub }}>
                    <th style={{ padding: '6px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}` }}>LoB</th>
                    <th style={{ padding: '6px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>BF IBNR</th>
                    <th style={{ padding: '6px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Chain-Ladder</th>
                    <th style={{ padding: '6px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Climate IBNR</th>
                    <th style={{ padding: '6px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Climate Add %</th>
                  </tr></thead>
                  <tbody>{filtered.map((l, i) => {
                    const bfIBNR = calcBFIBNR(l, scenIdx);
                    const clIBNR = calcChainLadderIBNR(l);
                    const climIBNR = calcClimateIBNR(l, scenIdx);
                    const addPct = l.baseIBNR > 0 ? +((climIBNR - l.baseIBNR) / l.baseIBNR * 100).toFixed(1) : 0;
                    return (
                      <tr key={l.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                        <td style={{ ...tdS, fontWeight: 600 }}>{l.name.slice(0, 20)}</td>
                        <td style={{ ...tdS, textAlign: 'right' }}>${bfIBNR.toLocaleString()}</td>
                        <td style={{ ...tdS, textAlign: 'right' }}>${clIBNR.toLocaleString()}</td>
                        <td style={{ ...tdS, textAlign: 'right', fontWeight: 600 }}>${climIBNR.toLocaleString()}</td>
                        <td style={{ ...tdS, textAlign: 'right', color: addPct > 10 ? T.red : T.green }}>+{addPct}%</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Development Factor Analysis</h3>
              <label style={{ fontSize: 12, marginBottom: 10, display: 'block' }}>
                Selected LoB:
                <select value={drillLob} onChange={e => setDrillLob(+e.target.value)} style={{ marginLeft: 8, padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
                  {LOBS.map((l, i) => <option key={i} value={i}>{l.name}</option>)}
                </select>
              </label>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={drillL.developmentFactors.map((f, i) => ({ period: `P${i+1}→P${i+2}`, factor: f }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                  <YAxis domain={[1.0, 1.2]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => v.toFixed(4)} />
                  <Bar dataKey="factor" name="Dev Factor" fill={T.navy} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Run-Off Triangle */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>LoB:</label>
            <select value={drillLob} onChange={e => setDrillLob(+e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
              {LOBS.map((l, i) => <option key={i} value={i}>{l.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Loss Development — {drillL.name}</h3>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={triangleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="paid" name="Paid Loss $M" fill={T.navy} />
                  <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative LR %" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Development Factors by Period</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={triangleData.filter(d => d.devFactor).map(d => ({ period: d.period, factor: d.devFactor }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis domain={[1.0, 1.25]} tick={{ fontSize: 11 }} tickFormatter={v => v.toFixed(3)} />
                  <Tooltip formatter={(v) => v.toFixed(4)} />
                  <Bar dataKey="factor" name="Dev Factor" fill={T.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Run-Off Triangle Matrix — {drillL.name}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}` }}>Period</th>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Paid Loss</th>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Cum LR %</th>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Dev Factor</th>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Cumul Dev Factor</th>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Est Ultimate</th>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>IBNR Est</th>
                </tr></thead>
                <tbody>
                  {Array.from({ length: 8 }, (_, p) => {
                    const cumDevF = drillL.developmentFactors.slice(p).reduce((a, b) => a * b, 1);
                    const paid = drillL.lossTrianglePeriods[p] || 0;
                    const ultimate = +(paid * cumDevF).toFixed(0);
                    return (
                      <tr key={p} style={{ background: p % 2 === 0 ? T.bg : T.card }}>
                        <td style={{ ...tdS, fontWeight: 600 }}>P{p + 1}</td>
                        <td style={{ ...tdS, textAlign: 'right' }}>${paid.toLocaleString()}</td>
                        <td style={{ ...tdS, textAlign: 'right' }}>{drillL.premiumIncome > 0 ? (paid / drillL.premiumIncome * 100).toFixed(1) : 0}%</td>
                        <td style={{ ...tdS, textAlign: 'right' }}>{p < drillL.developmentFactors.length ? drillL.developmentFactors[p] : '—'}</td>
                        <td style={{ ...tdS, textAlign: 'right' }}>{+cumDevF.toFixed(4)}</td>
                        <td style={{ ...tdS, textAlign: 'right' }}>${ultimate.toLocaleString()}</td>
                        <td style={{ ...tdS, textAlign: 'right', color: T.red }}>${(ultimate - paid).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 14, padding: 12, background: T.sub, borderRadius: 6, fontSize: 12 }}>
              <strong>Tail Factor:</strong> {drillL.tailRiskFactor} &nbsp;|&nbsp;
              <strong>Cumulative Dev Factor:</strong> {drillL.cumulativeDevFactor} &nbsp;|&nbsp;
              <strong>Reporting Lag:</strong> {drillL.reportingLag} months &nbsp;|&nbsp;
              <strong>Climate Dev Factor:</strong> {(drillL.climateDevFactor * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Solvency II Reserves */}
      {tab === 4 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              Discount Rate: <input type="range" min={0} max={50} value={discountSlider * 10} onChange={e => setDiscountSlider(+e.target.value / 10)} style={{ width: 100 }} /> {discountSlider.toFixed(1)}%
            </label>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Reserve vs Discount Rate — Sensitivity Analysis</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={discountSensitivity}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="rate" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="discountedReserve" name="PV Reserve $M" stroke={T.indigo} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Solvency II Risk Margin & Reserve Percentiles — All LoB</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['LoB','Base IBNR','PV Reserve','Risk Margin','75th Pctile','95th Pctile','99.5th Pctile','ADC Need?'].map(h => <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>)}
                </tr></thead>
                <tbody>{filtered.map((l, i) => {
                  const pv = calcDiscountedReserve(l, discountSlider);
                  const rm = calcSolvencyRiskMargin(l);
                  const p75 = calcReservePercentile(l, 75);
                  const p95 = calcReservePercentile(l, 95);
                  const p99 = calcReservePercentile(l, 99.5);
                  const adcNeed = pv < p99;
                  return (
                    <tr key={l.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                      <td style={{ ...tdS, fontWeight: 600 }}>{l.name.slice(0, 20)}</td>
                      <td style={tdS}>${l.baseIBNR.toLocaleString()}</td>
                      <td style={{ ...tdS, fontWeight: 600 }}>${pv.toLocaleString()}</td>
                      <td style={{ ...tdS, color: T.amber }}>${rm.toLocaleString()}</td>
                      <td style={tdS}>${p75.toLocaleString()}</td>
                      <td style={tdS}>${p95.toLocaleString()}</td>
                      <td style={{ ...tdS, color: T.red }}>${p99.toLocaleString()}</td>
                      <td style={tdS}><span style={{ background: adcNeed ? '#fee2e2' : '#dcfce7', color: adcNeed ? T.red : T.green, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{adcNeed ? 'Required' : 'Sufficient'}</span></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Scenario Stress */}
      {tab === 5 && (
        <div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>6-NGFS Reserve Gap Trajectory — {filtered.length} LoB Total ({HORIZONS.join('/')})</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={scenarioGapData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {NGFS_SCENARIOS.map((sc, si) => (
                  <Bar key={sc} dataKey={sc} fill={SCEN_COLORS[si]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>3-Horizon Reserve Table by LoB — {NGFS_SCENARIOS[scenIdx]}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}` }}>LoB</th>
                  {HORIZONS.map(h => <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>{h} $M</th>)}
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>2025→2040 Change</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}` }}>ADC Required?</th>
                </tr></thead>
                <tbody>{filtered.map((l, i) => {
                  const vals = HORIZONS.map((_, hi) => Math.round(l.baseIBNR * (1 + l.climateDevFactor * SCEN_MULTS[scenIdx] * (1 + hi / 2))));
                  const change = vals[0] > 0 ? +(((vals[2] - vals[0]) / vals[0]) * 100).toFixed(1) : 0;
                  return (
                    <tr key={l.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                      <td style={{ ...tdS, fontWeight: 600 }}>{l.name.slice(0, 20)}</td>
                      {vals.map((v, vi) => <td key={vi} style={{ ...tdS, textAlign: 'right' }}>${v.toLocaleString()}</td>)}
                      <td style={{ ...tdS, textAlign: 'right', color: change > 20 ? T.red : T.green }}>+{change}%</td>
                      <td style={tdS}><span style={{ background: change > 30 ? '#fee2e2' : '#dcfce7', color: change > 30 ? T.red : T.green, padding: '2px 8px', borderRadius: 4, fontSize: 10 }}>{change > 30 ? 'Yes' : 'No'}</span></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Summary & Export */}
      {tab === 6 && (
        <div>
          {/* Scenario comparison chart */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Reserve Adequacy Trend — All 6 Scenarios (Filtered LoB)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={NGFS_SCENARIOS.map((sc, si) => ({
                scenario: sc.split(' ').slice(0,2).join(' '),
                avgScore: filtered.length ? +(filtered.reduce((s, l) => s + l.reserveAdequacyScore * (1 - l.climateDevFactor * SCEN_MULTS[si] * 0.5), 0) / filtered.length).toFixed(1) : 0,
                totalIBNR: filtered.length ? Math.round(filtered.reduce((s, l) => s + calcClimateIBNR(l, si), 0)) : 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="avgScore" name="Avg Adequacy Score" stroke={T.green} strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="totalIBNR" name="Total IBNR $M" stroke={T.red} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Discount sensitivity cross-LoB */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Climate Dev Factor Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { bucket: '<2%', count: filtered.filter(l => l.climateDevFactor * 100 < 2).length },
                  { bucket: '2-5%', count: filtered.filter(l => l.climateDevFactor * 100 >= 2 && l.climateDevFactor * 100 < 5).length },
                  { bucket: '5-10%', count: filtered.filter(l => l.climateDevFactor * 100 >= 5 && l.climateDevFactor * 100 < 10).length },
                  { bucket: '≥10%', count: filtered.filter(l => l.climateDevFactor * 100 >= 10).length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="LoB Count" fill={T.red} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Premium vs IBNR Relationship</h3>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="premium" name="Premium $M" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="ibnr" name="Climate IBNR $M" tick={{ fontSize: 10 }} />
                  <Tooltip content={({ payload }) => payload?.length ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 8, fontSize: 11 }}><b>{payload[0]?.payload?.name}</b><br/>Premium: ${payload[0]?.payload?.premium}M<br/>IBNR: ${payload[0]?.payload?.ibnr}</div> : null} />
                  <Scatter data={filtered.map(l => ({ name: l.name.slice(0,14), premium: l.premiumIncome, ibnr: calcClimateIBNR(l, scenIdx) }))} fill={T.indigo} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Reserve metrics summary */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Reserve Key Metrics Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Long-tail LoB', value: filtered.filter(l => l.longtailExposure).length, color: T.orange },
                { label: 'ADC Required', value: filtered.filter(l => calcDiscountedReserve(l, discountSlider) < calcReservePercentile(l, 99.5)).length, color: T.red },
                { label: 'Avg Reporting Lag', value: filtered.length ? Math.round(filtered.reduce((s,l) => s + l.reportingLag, 0) / filtered.length) + ' mo' : '0', color: T.blue },
                { label: 'Avg Tail Factor', value: filtered.length ? +(filtered.reduce((s,l) => s + l.tailRiskFactor, 0) / filtered.length).toFixed(4) : 0, color: T.navy },
                { label: 'Total Risk Margin', value: '$' + Math.round(filtered.reduce((s,l) => s + calcSolvencyRiskMargin(l), 0)).toLocaleString(), color: T.amber },
                { label: 'Avg Cession %', value: filtered.length ? (filtered.reduce((s,l) => s + l.cededToReinsurance, 0) / filtered.length * 100).toFixed(1) + '%' : '0%', color: T.teal },
                { label: 'BF > Chain-Ladder', value: filtered.filter(l => calcBFIBNR(l, scenIdx) > calcChainLadderIBNR(l)).length, color: T.purple },
                { label: '99.5th % Total', value: '$' + Math.round(filtered.reduce((s,l) => s + calcReservePercentile(l, 99.5), 0)).toLocaleString(), color: T.red },
              ].map(item => (
                <div key={item.label} style={{ background: T.sub, borderRadius: 6, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <KpiCard label="LoB Analyzed" value={filtered.length} unit="/ 20" color={T.indigo} />
            <KpiCard label="Active Scenario" value={NGFS_SCENARIOS[scenIdx].split(' ')[0]} unit="" color={T.navy} />
            <KpiCard label="Avg Adequacy Score" value={globalKpis.avgAdequacy} unit="" color={globalKpis.avgAdequacy < 65 ? T.red : T.green} />
            <KpiCard label="Total Climate IBNR" value={globalKpis.totalIBNR.toLocaleString()} unit="$M" color={T.orange} />
            <KpiCard label="Total PV Reserve" value={globalKpis.totalPV.toLocaleString()} unit="$M" color={T.teal} />
            <KpiCard label="Avg Climate Dev" value={globalKpis.avgClimateLoad} unit="%" color={T.red} />
            <KpiCard label="Discount Rate" value={discountSlider.toFixed(1)} unit="%" color={T.blue} />
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Full KPI Export — {filtered.length} Lines of Business · Scenario: {NGFS_SCENARIOS[scenIdx]}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['LoB','Premium $M','Base IBNR','Climate IBNR','BF IBNR','Chain-Ladder','PV Reserve','Risk Margin','75th%','95th%','99.5th%','Adq Score','Climate Dev %','Ceded %','Long-tail'].map(h => (
                    <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{filtered.map((l, i) => (
                  <tr key={l.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{l.name.slice(0,18)}</td>
                    <td style={tdS}>${l.premiumIncome}M</td>
                    <td style={tdS}>${l.baseIBNR}M</td>
                    <td style={{ ...tdS, color: T.red }}>${calcClimateIBNR(l, scenIdx).toLocaleString()}</td>
                    <td style={tdS}>${calcBFIBNR(l, scenIdx).toLocaleString()}</td>
                    <td style={tdS}>${calcChainLadderIBNR(l).toLocaleString()}</td>
                    <td style={{ ...tdS, fontWeight: 600 }}>${calcDiscountedReserve(l, discountSlider).toLocaleString()}</td>
                    <td style={tdS}>${calcSolvencyRiskMargin(l).toLocaleString()}</td>
                    <td style={tdS}>${calcReservePercentile(l, 75).toLocaleString()}</td>
                    <td style={tdS}>${calcReservePercentile(l, 95).toLocaleString()}</td>
                    <td style={{ ...tdS, color: T.red }}>${calcReservePercentile(l, 99.5).toLocaleString()}</td>
                    <td style={{ ...tdS, color: l.reserveAdequacyScore < 65 ? T.red : T.green, fontWeight: 600 }}>{l.reserveAdequacyScore}</td>
                    <td style={tdS}>{(l.climateDevFactor * 100).toFixed(2)}%</td>
                    <td style={tdS}>{(l.cededToReinsurance * 100).toFixed(1)}%</td>
                    <td style={tdS}>{l.longtailExposure ? 'Yes' : 'No'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          {/* Scenario stress matrix */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Reserve Adequacy Scenario Matrix — All 6 Scenarios × All 20 LoB</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}` }}>LoB</th>
                  {NGFS_SCENARIOS.map((s, si) => (
                    <th key={s} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right', color: SCEN_COLORS[si], fontSize: 10, whiteSpace: 'nowrap' }}>{s.split(' ').slice(0,2).join(' ')}</th>
                  ))}
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Max Exposure $M</th>
                </tr></thead>
                <tbody>{LOBS.map((l, i) => {
                  const vals = NGFS_SCENARIOS.map((_, si) => calcClimateIBNR(l, si));
                  const maxVal = Math.max(...vals);
                  return (
                    <tr key={l.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                      <td style={{ padding: '5px 8px', fontWeight: 600, maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden' }}>{l.name.slice(0,18)}</td>
                      {vals.map((v, si) => (
                        <td key={si} style={{ padding: '5px 8px', textAlign: 'right', color: si > 3 ? T.red : T.text, fontWeight: si === 5 ? 700 : 400 }}>${v.toLocaleString()}</td>
                      ))}
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: T.red }}>${maxVal.toLocaleString()}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
          {/* Development factor comparison */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Age-to-Age Factor Comparison — All LoB</h3>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={Array.from({ length: 7 }, (_, pi) => {
                const obj = { period: `ATA-${pi + 1}` };
                LOBS.forEach(l => { obj[l.name.slice(0,8)] = l.developmentFactors[pi] || null; });
                obj.avgFactor = +(LOBS.reduce((s, l) => s + (l.developmentFactors[pi] || 0), 0) / LOBS.length).toFixed(4);
                return obj;
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis domain={[1.0, 1.25]} tick={{ fontSize: 11 }} tickFormatter={v => v.toFixed(3)} />
                <Tooltip formatter={(v) => v?.toFixed ? v.toFixed(4) : v} />
                <Bar dataKey="avgFactor" name="Avg ATA Factor" fill={T.navy} opacity={0.8} />
                <Line type="monotone" dataKey="avgFactor" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} name="Trend" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {/* Reserve adequacy action plan */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Reserve Action Plan — LoB Requiring Strengthening</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ background: T.sub }}>
                {['LoB','Adequacy Score','Climate IBNR $M','BF IBNR $M','Gap $M','99.5th% $M','ADC Need','Reporting Lag','Action Priority'].map(h => (
                  <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', textAlign: 'left' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{[...LOBS].filter(l => l.reserveAdequacyScore < 70).sort((a,b) => a.reserveAdequacyScore - b.reserveAdequacyScore).map((l, i) => {
                const climIBNR = calcClimateIBNR(l, scenIdx);
                const bfIBNR = calcBFIBNR(l, scenIdx);
                const gap = Math.max(0, climIBNR - bfIBNR);
                const p995 = calcReservePercentile(l, 99.5);
                const adcNeed = calcDiscountedReserve(l, discountSlider) < p995;
                const priority = l.reserveAdequacyScore < 60 ? 'Critical' : 'High';
                return (
                  <tr key={l.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                    <td style={{ padding: '5px 8px', fontWeight: 600 }}>{l.name.slice(0,18)}</td>
                    <td style={{ padding: '5px 8px', color: T.red, fontWeight: 600 }}>{l.reserveAdequacyScore}</td>
                    <td style={{ padding: '5px 8px', color: T.red }}>${climIBNR.toLocaleString()}</td>
                    <td style={{ padding: '5px 8px' }}>${bfIBNR.toLocaleString()}</td>
                    <td style={{ padding: '5px 8px', color: gap > 0 ? T.red : T.green, fontWeight: 600 }}>{gap > 0 ? '+$' + gap.toLocaleString() : '—'}</td>
                    <td style={{ padding: '5px 8px' }}>${p995.toLocaleString()}</td>
                    <td style={{ padding: '5px 8px' }}><span style={{ background: adcNeed ? '#fee2e2' : '#dcfce7', color: adcNeed ? T.red : T.green, padding: '2px 7px', borderRadius: 4, fontSize: 10 }}>{adcNeed ? 'Required' : 'Not needed'}</span></td>
                    <td style={{ padding: '5px 8px' }}>{l.reportingLag} mo</td>
                    <td style={{ padding: '5px 8px' }}><span style={{ background: priority === 'Critical' ? '#fee2e2' : '#fef3c7', color: priority === 'Critical' ? T.red : T.amber, padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{priority}</span></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
          {/* Reserve Adequacy Distribution Chart */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Reserve Adequacy Distribution — BF vs CL IBNR by LoB</h3>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={LOBS.map(l => ({
                name: l.name.slice(0, 8),
                bfIBNR: +calcBFIBNR(l, scenIdx).toFixed(0),
                clIBNR: +calcChainLadderIBNR(l).toFixed(0),
                discounted: +calcDiscountedReserve(l, discRate).toFixed(0),
                riskMargin: +calcSolvencyRiskMargin(l).toFixed(0),
              }))} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="bfIBNR" name="BF IBNR $M" fill={T.indigo} />
                <Bar dataKey="clIBNR" name="CL IBNR $M" fill={T.teal} />
                <Line type="monotone" dataKey="discounted" name="Discounted $M" stroke={T.orange} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="riskMargin" name="Risk Margin $M" stroke={T.red} strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {/* Key Metrics Summary Grid */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Reserve Portfolio Key Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { label: 'Total LoB', value: LOBS.length, color: T.indigo },
                { label: 'Avg BF IBNR $M', value: '$' + (LOBS.reduce((s, l) => s + calcBFIBNR(l, scenIdx), 0) / LOBS.length).toFixed(0) + 'M', color: T.blue },
                { label: 'Avg CL IBNR $M', value: '$' + (LOBS.reduce((s, l) => s + calcChainLadderIBNR(l), 0) / LOBS.length).toFixed(0) + 'M', color: T.teal },
                { label: 'Total Disc Reserve $B', value: '$' + (LOBS.reduce((s, l) => s + calcDiscountedReserve(l, discRate), 0) / 1000).toFixed(1) + 'B', color: T.green },
                { label: 'Total Risk Margin $M', value: '$' + LOBS.reduce((s, l) => s + calcSolvencyRiskMargin(l), 0).toFixed(0) + 'M', color: T.amber },
                { label: 'High Climate Loading', value: LOBS.filter(l => l.climateLoadingPct > 15).length + ' LoB', color: T.red },
                { label: 'Avg Reserve Adequacy', value: (LOBS.reduce((s, l) => s + l.reserveAdequacyRatio, 0) / LOBS.length).toFixed(1) + '%', color: T.orange },
                { label: 'Avg Reporting Lag', value: (LOBS.reduce((s, l) => s + l.reportingLag, 0) / LOBS.length).toFixed(1) + ' mo', color: T.purple },
                { label: 'NGFS Scenarios', value: NGFS_SCENARIOS.length, color: T.navy },
                { label: 'Discount Rate', value: (discRate * 100).toFixed(1) + '%', color: T.gold },
                { label: 'Active Scenario', value: NGFS_SCENARIOS[scenIdx].slice(0, 14), color: T.indigo },
                { label: 'Solvency II CoC', value: '6% pa', color: T.teal },
              ].map(m => (
                <div key={m.label} style={{ background: T.sub, borderRadius: 6, padding: '8px 10px', borderLeft: `3px solid ${m.color}` }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
          {/* IBNR Climate Uplift BarChart */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Climate IBNR Uplift vs Base — Top 12 LoB</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[...LOBS].sort((a, b) => Math.max(0, calcClimateIBNR(b, scenIdx) - calcBFIBNR(b, 0)) - Math.max(0, calcClimateIBNR(a, scenIdx) - calcBFIBNR(a, 0))).slice(0, 12).map(l => ({
                name: l.name.slice(0, 7),
                baseIBNR: +calcBFIBNR(l, 0).toFixed(0),
                climateUplift: +Math.max(0, calcClimateIBNR(l, scenIdx) - calcBFIBNR(l, 0)).toFixed(0),
              }))} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="baseIBNR" name="Base IBNR $M" fill={T.indigo} stackId="a" />
                <Bar dataKey="climateUplift" name="Climate Uplift $M" fill={T.red} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* BF vs CL IBNR Comparison by Scenario */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>BF vs Chain-Ladder IBNR — Scenario Comparison (Total Portfolio $M)</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={NGFS_SCENARIOS.map((s, si) => ({
                name: s.slice(0, 10),
                bfTotal: +LOBS.reduce((sum, l) => sum + calcBFIBNR(l, si), 0).toFixed(0),
                clTotal: +LOBS.reduce((sum, l) => sum + calcChainLadderIBNR(l), 0).toFixed(0),
                climTotal: +LOBS.reduce((sum, l) => sum + calcClimateIBNR(l, si), 0).toFixed(0),
              }))} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="bfTotal" name="BF IBNR" fill={T.indigo} />
                <Bar dataKey="clTotal" name="CL IBNR" fill={T.teal} />
                <Bar dataKey="climTotal" name="Climate IBNR" fill={T.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Discounted Reserve vs Risk Margin Scatter */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Discounted Reserve vs Risk Margin — LoB Scatter</h3>
            <ResponsiveContainer width="100%" height={210}>
              <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="discReserve" name="Discounted Reserve $M" type="number" tick={{ fontSize: 10 }} label={{ value: 'Discounted Reserve $M', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis dataKey="riskMargin" name="Risk Margin $M" type="number" tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => ['$' + v.toFixed(0) + 'M', n === 'discReserve' ? 'Discounted Reserve' : 'Risk Margin']} />
                <Scatter name="Lines of Business" data={LOBS.map(l => ({
                  discReserve: +calcDiscountedReserve(l, discRate).toFixed(0),
                  riskMargin: +calcSolvencyRiskMargin(l).toFixed(0),
                  name: l.name,
                }))} fill={T.teal} opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          {/* Reserve Action Alert */}
          <div style={{ background: '#fff8f0', border: `1px solid ${T.amber}`, borderRadius: 8, padding: '12px 16px', marginTop: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18 }}>⚠</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.amber, marginBottom: 4 }}>Reserve Adequacy Alert — Scenario: {NGFS_SCENARIOS[scenIdx]}</div>
              <div style={{ fontSize: 11, color: T.text }}>
                {LOBS.filter(l => l.reserveAdequacyScore < 70).length} lines of business have reserve adequacy scores below 70/100 under this scenario.
                Total climate IBNR uplift: ${LOBS.reduce((s, l) => s + Math.max(0, calcClimateIBNR(l, scenIdx) - calcBFIBNR(l, 0)), 0).toFixed(0)}M above base BF estimates.
                Recommend immediate actuarial review for {LOBS.filter(l => l.climateLoadingPct > 15).length} LoB with climate loading &gt;15%.
              </div>
            </div>
          </div>
          {/* LoB Reserve Adequacy Gauge Strip */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Reserve Adequacy Score by LoB — Gauge Strip</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {LOBS.map((l, li) => {
                const score = l.reserveAdequacyScore;
                const color = score < 70 ? T.red : score < 85 ? T.amber : T.green;
                return (
                  <div key={l.id} style={{ background: T.sub, borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.text, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden' }}>{l.name.slice(0, 16)}</div>
                    <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: Math.min(100, score) + '%', height: 8, background: color, borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color, marginTop: 3 }}>{score}/100</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
