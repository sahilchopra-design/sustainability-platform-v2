import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, ReferenceLine, LineChart,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const PARENT_INDICES = ['MSCI World','STOXX 600','S&P 500','FTSE 100','EM'];
const CB_SECTORS = ['Energy','Materials','Industrials','Technology','Financials','Healthcare','Utilities','Consumer Disc.','Consumer Stap.','Real Estate','Telecom','Basic Res.'];

const UNIVERSE = Array.from({ length: 300 }, (_, i) => {
  const sec = CB_SECTORS[Math.floor(sr(i * 7 + 1) * CB_SECTORS.length)];
  const parent = PARENT_INDICES[Math.floor(sr(i * 11 + 2) * PARENT_INDICES.length)];
  const ci = sr(i * 13 + 3) * 900 + 5;
  const mc = sr(i * 17 + 4) * 200 + 0.5; // $Bn
  const rawW = mc / 1000;
  return {
    id: i,
    name: `${sec.substring(0, 3).toUpperCase()}-C${String(i + 1).padStart(3, '0')}`,
    sector: sec,
    country: ['US','UK','DE','FR','JP','CN','CH','NL'][Math.floor(sr(i * 19 + 5) * 8)],
    parentIndex: parent,
    marketCap: mc,
    carbonIntensity: ci,
    temperature: sr(i * 23 + 6) * 3 + 1.5,
    greenRevenue: sr(i * 29 + 7),
    controversyFlag: sr(i * 31 + 8) > 0.85,
    esgScore: sr(i * 37 + 9) * 100,
    taxonomyAligned: sr(i * 41 + 10) > 0.55,
    weight_parent: rawW,
    euTaxonomyPct: sr(i * 43 + 11) * 60,
    parisAligned: sr(i * 47 + 12) > 0.45,
    volume: sr(i * 53 + 13) * 5000 + 100,
    divYield: sr(i * 59 + 14) * 0.06,
  };
});

// Normalize parent weights per index
const byIndex = {};
PARENT_INDICES.forEach(idx => {
  const subs = UNIVERSE.filter(s => s.parentIndex === idx);
  const tot = subs.reduce((s, x) => s + x.weight_parent, 0);
  subs.forEach(s => { s.weight_norm = tot > 0 ? s.weight_parent / tot : 0; });
  byIndex[idx] = subs;
});

// Sector avg CI for exclusion threshold
const sectorAvgCI = {};
CB_SECTORS.forEach(sec => {
  const subs = UNIVERSE.filter(s => s.sector === sec);
  sectorAvgCI[sec] = subs.length ? subs.reduce((s, x) => s + x.carbonIntensity, 0) / subs.length : 0;
});

const EU_BMR_RULES = [
  'Exclude UNGC violators',
  'Exclude controversial weapons',
  'Exclude coal >1% revenue',
  'Exclude oil sands >10% revenue',
  'Minimum 50% CI reduction vs parent (PAB)',
  'Minimum 30% CI reduction vs parent (CTB)',
  '7% annual decarbonization path (PAB)',
  'Climate-related ESG controversy screen',
  'Minimum ESG score disclosure coverage',
  'Taxonomy alignment data availability',
  'Weighted average ITR disclosed',
  'Physical risk assessment conducted',
];

const TABS = ['Benchmark Builder','Constituent Universe','Construction Rules','Carbon Analytics','EU BMR Compliance','Greenium Analysis','Summary & Export'];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function ClimateBenchmarkConstructorPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [parentIndex, setParentIndex] = useState('MSCI World');
  const [benchmarkType, setBenchmarkType] = useState('PAB');
  const [carbonReduction, setCarbonReduction] = useState(50);
  const [exclusionMultiplier, setExclusionMultiplier] = useState(20);
  const [esgMin, setEsgMin] = useState(30);
  const [excludeControversy, setExcludeControversy] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('marketCap');
  const [sortDir, setSortDir] = useState('desc');

  const parentConstituents = useMemo(() => byIndex[parentIndex] || [], [parentIndex]);
  const parentAvgCI = useMemo(() => parentConstituents.length ? parentConstituents.reduce((s, x) => s + x.weight_norm * x.carbonIntensity, 0) : 0, [parentConstituents]);

  const benchmarkConstituents = useMemo(() => {
    let pool = [...parentConstituents];
    // Step 1: ESG filter
    pool = pool.filter(s => s.esgScore >= esgMin);
    // Step 2: controversy exclusion
    if (excludeControversy) pool = pool.filter(s => !s.controversyFlag);
    // Step 3: high-carbon exclusion
    pool = pool.filter(s => s.carbonIntensity <= sectorAvgCI[s.sector] * exclusionMultiplier);
    // Step 4: carbon reduction target
    const targetCI = parentAvgCI * (1 - carbonReduction / 100);
    // Tilt weights: reduce high-CI
    const tilted = pool.map(s => ({
      ...s,
      benchWeight: s.weight_norm * Math.exp(-Math.max(0, s.carbonIntensity - targetCI) / (targetCI + 1)),
    }));
    const tw = tilted.reduce((s, x) => s + x.benchWeight, 0);
    return tw > 0 ? tilted.map(s => ({ ...s, benchWeight: s.benchWeight / tw })) : tilted;
  }, [parentConstituents, parentAvgCI, esgMin, excludeControversy, exclusionMultiplier, carbonReduction]);

  const benchmarkAvgCI = useMemo(() => benchmarkConstituents.length ? benchmarkConstituents.reduce((s, x) => s + x.benchWeight * x.carbonIntensity, 0) : 0, [benchmarkConstituents]);
  const actualReduction = useMemo(() => parentAvgCI > 0 ? (1 - benchmarkAvgCI / parentAvgCI) * 100 : 0, [parentAvgCI, benchmarkAvgCI]);
  const trackingError = useMemo(() => {
    const bmkVol = Math.sqrt(benchmarkConstituents.reduce((s, x) => s + Math.pow(x.benchWeight * (0.08 + sr(x.id * 7 + 1) * 0.2), 2), 0));
    const parVol = Math.sqrt(parentConstituents.reduce((s, x) => s + Math.pow(x.weight_norm * (0.08 + sr(x.id * 7 + 1) * 0.2), 2), 0));
    return Math.abs(bmkVol - parVol) * 100;
  }, [benchmarkConstituents, parentConstituents]);

  const sectorTilts = useMemo(() => {
    const map = {};
    CB_SECTORS.forEach(sec => {
      const bw = benchmarkConstituents.filter(s => s.sector === sec).reduce((s, x) => s + x.benchWeight, 0);
      const pw = parentConstituents.filter(s => s.sector === sec).reduce((s, x) => s + x.weight_norm, 0);
      map[sec] = { sector: sec, benchWeight: +(bw * 100).toFixed(2), parentWeight: +(pw * 100).toFixed(2), tilt: +((bw - pw) * 100).toFixed(2) };
    });
    return Object.values(map);
  }, [benchmarkConstituents, parentConstituents]);

  const filteredUniverse = useMemo(() => {
    let d = benchmarkConstituents.filter(s =>
      search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || s.sector.toLowerCase().includes(search.toLowerCase())
    );
    d = [...d].sort((a, b) => {
      const v = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'benchWeight') return v * (a.benchWeight - b.benchWeight);
      if (sortField === 'carbonIntensity') return v * (a.carbonIntensity - b.carbonIntensity);
      if (sortField === 'esgScore') return v * (a.esgScore - b.esgScore);
      return v * (a.marketCap - b.marketCap);
    });
    return d;
  }, [benchmarkConstituents, search, sortField, sortDir]);

  const bmrCompliance = useMemo(() => {
    return EU_BMR_RULES.map((rule, i) => {
      let pass = true;
      let detail = '';
      if (i === 0) { pass = true; detail = 'No UNGC violators in benchmark'; }
      else if (i === 4) { pass = actualReduction >= 50; detail = `Actual: ${actualReduction.toFixed(1)}% (req ≥50%)`; }
      else if (i === 5) { pass = actualReduction >= 30; detail = `Actual: ${actualReduction.toFixed(1)}% (req ≥30%)`; }
      else if (i === 6) { pass = true; detail = '7% annual decarbonization path applied'; }
      else { pass = sr(i * 13 + 77) > 0.25; detail = pass ? 'Compliant' : 'Derogation applied'; }
      return { rule, pass, detail };
    });
  }, [actualReduction]);

  // Greenium: sr-seeded yield spread vs brown equivalent
  const greeniumData = useMemo(() => {
    return CB_SECTORS.map((sec, i) => {
      const greenYield = sr(i * 11 + 3) * 0.04 + 0.02;
      const brownYield = greenYield + (sr(i * 17 + 5) * 0.003 - 0.0015);
      return { sector: sec.substring(0, 7), greenium: +((brownYield - greenYield) * 10000).toFixed(1) };
    });
  }, []);

  const constructionSteps = useMemo(() => {
    const step1 = parentConstituents.length;
    const step2 = parentConstituents.filter(s => s.esgScore >= esgMin).length;
    const step3 = step2 - (excludeControversy ? parentConstituents.filter(s => s.esgScore >= esgMin && s.controversyFlag).length : 0);
    const step4 = parentConstituents.filter(s => s.esgScore >= esgMin && (!excludeControversy || !s.controversyFlag) && s.carbonIntensity <= sectorAvgCI[s.sector] * exclusionMultiplier).length;
    const step5 = benchmarkConstituents.length;
    return [
      { step: '1. Parent Index', count: step1, excluded: 0 },
      { step: '2. ESG Filter', count: step2, excluded: step1 - step2 },
      { step: '3. Controversy', count: step3, excluded: step2 - step3 },
      { step: '4. Carbon Excl.', count: step4, excluded: step3 - step4 },
      { step: `5. ${benchmarkType} Tilt`, count: step5, excluded: step4 - step5 },
    ];
  }, [parentConstituents, esgMin, excludeControversy, exclusionMultiplier, benchmarkConstituents, benchmarkType]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>EP-CZ3 · CLIMATE BENCHMARK CONSTRUCTOR</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Climate Benchmark Constructor</h1>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>PAB/CTB construction · 300 constituent universe · EU BMR compliance · Greenium analysis</div>
      </div>

      {/* Controls */}
      <div style={{ background: T.sub, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
        <select value={parentIndex} onChange={e => setParentIndex(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          {PARENT_INDICES.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <select value={benchmarkType} onChange={e => setBenchmarkType(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option value="PAB">PAB (Paris-Aligned)</option>
          <option value="CTB">CTB (Climate Transition)</option>
          <option value="Custom">Custom</option>
        </select>
        <label style={{ fontSize: 12, color: T.muted }}>CI Reduction: <strong style={{ color: T.text }}>{carbonReduction}%</strong>
          <input type="range" min={30} max={70} value={carbonReduction} onChange={e => setCarbonReduction(+e.target.value)} style={{ marginLeft: 8, width: 90 }} />
        </label>
        <label style={{ fontSize: 12, color: T.muted }}>Excl. Threshold: <strong style={{ color: T.text }}>{exclusionMultiplier}×</strong>
          <input type="range" min={5} max={50} value={exclusionMultiplier} onChange={e => setExclusionMultiplier(+e.target.value)} style={{ marginLeft: 8, width: 80 }} />
        </label>
        <label style={{ fontSize: 12, color: T.muted }}>ESG Min: <strong style={{ color: T.text }}>{esgMin}</strong>
          <input type="range" min={0} max={70} value={esgMin} onChange={e => setEsgMin(+e.target.value)} style={{ marginLeft: 8, width: 80 }} />
        </label>
        <label style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={excludeControversy} onChange={e => setExcludeControversy(e.target.checked)} />
          Exclude Controversy
        </label>
        <input placeholder="Search constituents..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: 160 }} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: T.card, borderBottom: `1px solid ${T.border}`, padding: '0 32px', overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)} style={{ padding: '12px 16px', fontSize: 12, fontWeight: activeTab === i ? 700 : 500, color: activeTab === i ? T.indigo : T.muted, background: 'none', border: 'none', borderBottom: activeTab === i ? `2px solid ${T.indigo}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 32px' }}>

        {/* TAB 0: Benchmark Builder */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <KpiCard label="Parent Constituents" value={parentConstituents.length} sub={parentIndex} />
              <KpiCard label="Benchmark Constituents" value={benchmarkConstituents.length} sub={`after ${benchmarkType} rules`} color={T.indigo} />
              <KpiCard label="Tracking Error" value={`${trackingError.toFixed(2)}%`} sub="vs parent index" color={T.amber} />
              <KpiCard label="CI Reduction" value={`${actualReduction.toFixed(1)}%`} sub={`Target: ${carbonReduction}%`} color={actualReduction >= carbonReduction ? T.green : T.red} />
              <KpiCard label="Parent Avg CI" value={`${parentAvgCI.toFixed(0)}`} sub="tCO₂e/$M revenue" />
              <KpiCard label="Benchmark CI" value={`${benchmarkAvgCI.toFixed(0)}`} sub="tCO₂e/$M revenue" color={T.teal} />
              <KpiCard label="BMR Compliant" value={`${bmrCompliance.filter(r => r.pass).length}/12`} sub="EU BMR rules" color={bmrCompliance.filter(r => r.pass).length >= 10 ? T.green : T.amber} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Benchmark vs Parent CI by Sector</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sectorTilts} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="parentWeight" fill={T.muted} name="Parent %" opacity={0.6} />
                    <Bar dataKey="benchWeight" fill={T.indigo} name={`${benchmarkType} %`} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Sector Weight Tilts (Benchmark - Parent)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sectorTilts} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v > 0 ? '+' : ''}${v}%`, 'Tilt']} />
                    <ReferenceLine y={0} stroke={T.border} />
                    <Bar dataKey="tilt" fill={T.teal} radius={[4, 4, 0, 0]} name="Weight Tilt" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: Constituent Universe */}
        {activeTab === 1 && (
          <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: T.muted }}>Sort by:</span>
              {['marketCap','benchWeight','carbonIntensity','esgScore'].map(f => (
                <button key={f} onClick={() => { setSortField(f); setSortDir(sortField === f && sortDir === 'desc' ? 'asc' : 'desc'); }}
                  style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 11, fontWeight: sortField === f ? 700 : 400, background: sortField === f ? T.indigo : T.card, color: sortField === f ? '#fff' : T.text, cursor: 'pointer' }}>
                  {f} {sortField === f ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </button>
              ))}
              <span style={{ fontSize: 12, color: T.muted, marginLeft: 'auto' }}>{filteredUniverse.length} constituents</span>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub, position: 'sticky', top: 0 }}>
                      {['Name','Sector','Country','Parent Index','Mkt Cap $Bn','Bench Weight %','CI','Temp','ESG','Taxonomy','Paris','Controversy'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUniverse.map((s, i) => (
                      <tr key={s.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{s.name}</td>
                        <td style={{ padding: '6px 10px', color: T.muted, fontSize: 10 }}>{s.sector}</td>
                        <td style={{ padding: '6px 10px' }}>{s.country}</td>
                        <td style={{ padding: '6px 10px', fontSize: 10, color: T.blue }}>{s.parentIndex}</td>
                        <td style={{ padding: '6px 10px' }}>{s.marketCap.toFixed(1)}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{(s.benchWeight * 100).toFixed(3)}%</td>
                        <td style={{ padding: '6px 10px', color: s.carbonIntensity > benchmarkAvgCI ? T.amber : T.text }}>{s.carbonIntensity.toFixed(0)}</td>
                        <td style={{ padding: '6px 10px', color: s.temperature <= 2 ? T.green : T.amber }}>{s.temperature.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px' }}>{s.esgScore.toFixed(0)}</td>
                        <td style={{ padding: '6px 10px', color: s.taxonomyAligned ? T.green : T.red }}>{s.taxonomyAligned ? 'Yes' : 'No'}</td>
                        <td style={{ padding: '6px 10px', color: s.parisAligned ? T.green : T.red }}>{s.parisAligned ? 'Yes' : 'No'}</td>
                        <td style={{ padding: '6px 10px', color: s.controversyFlag ? T.red : T.green }}>{s.controversyFlag ? 'Flag' : 'Clean'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Construction Rules */}
        {activeTab === 2 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>{benchmarkType} Construction — Step by Step</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={constructionSteps} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="step" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="count" fill={T.indigo} name="Included" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="excluded" fill={T.red} name="Excluded" opacity={0.5} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>PAB Construction Rules</h3>
                {['Start from parent index','Exclude high-carbon (>20× sector avg CI)','Exclude UNGC violators','Apply 50% CI reduction vs parent','Apply 7%/yr annual decarbonization path','Maximize Paris alignment','Minimize tracking error'].map((r, i) => (
                  <div key={r} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ background: T.indigo, color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                    <span style={{ fontSize: 12 }}>{r}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>CTB Construction Rules</h3>
                {['Start from parent index','Exclude high-carbon (>10× sector avg CI)','Apply 30% CI reduction vs parent','Climate transition pathway alignment','5%/yr annual decarbonization path','Positive ESG momentum screen','Minimize active share vs parent'].map((r, i) => (
                  <div key={r} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ background: T.teal, color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                    <span style={{ fontSize: 12 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Carbon Analytics */}
        {activeTab === 3 && (
          <div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <KpiCard label="Parent CI" value={`${parentAvgCI.toFixed(0)}`} sub="tCO₂e/$M" />
              <KpiCard label={`${benchmarkType} CI`} value={`${benchmarkAvgCI.toFixed(0)}`} sub="tCO₂e/$M" color={T.indigo} />
              <KpiCard label="Actual Reduction" value={`${actualReduction.toFixed(1)}%`} color={actualReduction >= carbonReduction ? T.green : T.red} />
              <KpiCard label="Target Reduction" value={`${carbonReduction}%`} color={T.navy} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>CI Comparison: {benchmarkType} vs Parent vs CTB</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={CB_SECTORS.map((sec, i) => {
                    const pSubs = parentConstituents.filter(s => s.sector === sec);
                    const bSubs = benchmarkConstituents.filter(s => s.sector === sec);
                    const pW = pSubs.reduce((s, x) => s + x.weight_norm, 0);
                    const bW = bSubs.reduce((s, x) => s + x.benchWeight, 0);
                    const pCI = pW > 0 ? pSubs.reduce((s, x) => s + (x.weight_norm / pW) * x.carbonIntensity, 0) : 0;
                    const bCI = bW > 0 ? bSubs.reduce((s, x) => s + (x.benchWeight / bW) * x.carbonIntensity, 0) : 0;
                    return { sector: sec.substring(0, 6), parent: +pCI.toFixed(0), benchmark: +bCI.toFixed(0), ctb: +(pCI * 0.7).toFixed(0) };
                  })} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="parent" fill={T.muted} name="Parent" opacity={0.7} />
                    <Bar dataKey="benchmark" fill={T.indigo} name={benchmarkType} />
                    <Bar dataKey="ctb" fill={T.teal} name="CTB" opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Annual Decarbonization Path (2025–2040)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={Array.from({ length: 16 }, (_, i) => ({
                    year: 2025 + i,
                    pab: +(benchmarkAvgCI * Math.pow(0.93, i)).toFixed(0),
                    ctb: +(parentAvgCI * 0.7 * Math.pow(0.95, i)).toFixed(0),
                    parent: +(parentAvgCI * Math.pow(0.99, i)).toFixed(0),
                  }))} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="parent" stroke={T.muted} strokeWidth={1.5} name="Parent" dot={false} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="pab" stroke={T.indigo} strokeWidth={2.5} name="PAB" dot={false} />
                    <Line type="monotone" dataKey="ctb" stroke={T.teal} strokeWidth={2} name="CTB" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EU BMR Compliance */}
        {activeTab === 4 && (
          <div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <KpiCard label="Rules Passed" value={`${bmrCompliance.filter(r => r.pass).length}/12`} color={T.green} />
              <KpiCard label="Rules Failed" value={`${bmrCompliance.filter(r => !r.pass).length}/12`} color={T.red} />
              <KpiCard label="Compliance Score" value={`${(bmrCompliance.filter(r => r.pass).length / 12 * 100).toFixed(0)}%`} color={bmrCompliance.filter(r => r.pass).length >= 10 ? T.green : T.amber} />
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>EU Benchmark Regulation (BMR) Compliance Checklist — {benchmarkType}</h3>
              {bmrCompliance.map((r, i) => (
                <div key={r.rule} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: i % 2 === 0 ? T.card : T.sub, borderRadius: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, color: r.pass ? T.green : T.red, width: 20 }}>{r.pass ? '✓' : '✗'}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{r.rule}</span>
                  <span style={{ fontSize: 11, color: T.muted }}>{r.detail}</span>
                  <span style={{ background: r.pass ? T.green : T.red, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{r.pass ? 'PASS' : 'FAIL'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Greenium Analysis */}
        {activeTab === 5 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <KpiCard label="Avg Portfolio Greenium" value={`${(greeniumData.reduce((s, x) => s + x.greenium, 0) / greeniumData.length).toFixed(1)} bps`} sub="Green vs brown yield" color={T.teal} />
              <KpiCard label="Max Greenium" value={`${Math.max(...greeniumData.map(x => x.greenium)).toFixed(1)} bps`} color={T.green} />
              <KpiCard label="Sectors with Premium" value={greeniumData.filter(x => x.greenium > 0).length} sub="of 12 sectors" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Greenium by Sector (bps)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={greeniumData} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} unit=" bps" />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v} bps`, 'Greenium']} />
                    <ReferenceLine y={0} stroke={T.border} strokeWidth={2} />
                    <Bar dataKey="greenium" fill={T.teal} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Duration-Adjusted Greenium Comparison</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={CB_SECTORS.map((sec, i) => ({
                    sector: sec.substring(0, 6),
                    green: +(sr(i * 13 + 3) * 0.04 + 0.02).toFixed(4),
                    brown: +(sr(i * 13 + 3) * 0.04 + 0.02 + sr(i * 17 + 5) * 0.003).toFixed(4),
                  }))} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v * 100).toFixed(2)}%`} />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${(v * 100).toFixed(3)}%`, '']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="green" fill={T.green} name="Green Yield" />
                    <Bar dataKey="brown" fill={T.amber} name="Brown Yield" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Summary & Export */}
        {activeTab === 6 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Benchmark Construction Summary — {benchmarkType} on {parentIndex}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Metric','Parent Index','PAB','CTB','Target'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Constituents', parentConstituents.length, benchmarkConstituents.length, Math.round(benchmarkConstituents.length * 1.3), 'N/A'],
                    ['Avg CI (tCO₂e/$M)', parentAvgCI.toFixed(0), benchmarkAvgCI.toFixed(0), (parentAvgCI * 0.7).toFixed(0), `${(parentAvgCI * (1 - carbonReduction/100)).toFixed(0)} (${carbonReduction}% red.)`],
                    ['CI Reduction %', '0%', `${actualReduction.toFixed(1)}%`, '30%', `${carbonReduction}%`],
                    ['Tracking Error %', '0%', `${trackingError.toFixed(2)}%`, `${(trackingError * 0.7).toFixed(2)}%`, '<5%'],
                    ['BMR Compliance', 'N/A', `${bmrCompliance.filter(r => r.pass).length}/12`, `${Math.min(12, bmrCompliance.filter(r => r.pass).length + 1)}/12`, '12/12'],
                    ['Avg Greenium bps', 'N/A', `${(greeniumData.reduce((s, x) => s + x.greenium, 0) / greeniumData.length).toFixed(1)}`, 'N/A', '>0'],
                    ['Excluded (ESG)', '0', parentConstituents.length - benchmarkConstituents.length, 'Variable', 'Min needed'],
                  ].map(([m, p, pab, ctb, t], i) => (
                    <tr key={m} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{m}</td>
                      <td style={{ padding: '8px 12px', color: T.muted }}>{p}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: T.indigo }}>{pab}</td>
                      <td style={{ padding: '8px 12px', color: T.teal }}>{ctb}</td>
                      <td style={{ padding: '8px 12px', color: T.muted, fontSize: 11 }}>{t}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Top 50 Benchmark Constituents ({benchmarkType})</h3>
              <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Name','Sector','Country','Bench Wt %','Parent Wt %','Active Wt %','CI','ESG','ITR','Taxonomy'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...benchmarkConstituents].sort((a, b) => b.benchWeight - a.benchWeight).slice(0, 50).map((s, i) => (
                      <tr key={s.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '5px 10px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{s.name}</td>
                        <td style={{ padding: '5px 10px', fontSize: 10, color: T.muted }}>{s.sector}</td>
                        <td style={{ padding: '5px 10px' }}>{s.country}</td>
                        <td style={{ padding: '5px 10px', fontWeight: 700 }}>{(s.benchWeight * 100).toFixed(3)}%</td>
                        <td style={{ padding: '5px 10px', color: T.muted }}>{(s.weight_norm * 100).toFixed(3)}%</td>
                        <td style={{ padding: '5px 10px', color: (s.benchWeight - s.weight_norm) >= 0 ? T.green : T.red }}>
                          {((s.benchWeight - s.weight_norm) * 100 >= 0 ? '+' : '')}{((s.benchWeight - s.weight_norm) * 100).toFixed(3)}%
                        </td>
                        <td style={{ padding: '5px 10px' }}>{s.carbonIntensity.toFixed(0)}</td>
                        <td style={{ padding: '5px 10px' }}>{s.esgScore.toFixed(0)}</td>
                        <td style={{ padding: '5px 10px', color: s.temperature <= 2 ? T.green : T.amber }}>{s.temperature.toFixed(2)}</td>
                        <td style={{ padding: '5px 10px', color: s.taxonomyAligned ? T.green : T.red }}>{s.taxonomyAligned ? 'Y' : 'N'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Parent index comparison */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Benchmark vs All Parent Indices — CI Comparison</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={PARENT_INDICES.map(idx => {
                  const subs = byIndex[idx] || [];
                  const tot = subs.reduce((s, x) => s + x.weight_norm, 0);
                  const ci = tot > 0 ? subs.reduce((s, x) => s + (x.weight_norm / tot) * x.carbonIntensity, 0) : 0;
                  return { index: idx, ci: +ci.toFixed(0) };
                })} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="index" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v} tCO₂e/$M`, 'Carbon Intensity']} />
                  <ReferenceLine y={benchmarkAvgCI} stroke={T.indigo} strokeDasharray="5 5" label={{ value: `${benchmarkType}: ${benchmarkAvgCI.toFixed(0)}`, fontSize: 9, fill: T.indigo }} />
                  <Bar dataKey="ci" fill={T.navy} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Country distribution */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Country Weight Distribution — {benchmarkType}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={['US','UK','DE','FR','JP','CN','CH','NL'].map(cty => ({
                  country: cty,
                  weight: +(benchmarkConstituents.filter(s => s.country === cty).reduce((s, x) => s + x.benchWeight * 100, 0)).toFixed(2),
                }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v}%`, 'Weight']} />
                  <Bar dataKey="weight" fill={T.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* ESG distribution */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>ESG Score Distribution — {benchmarkType} Constituents</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={Array.from({ length: 10 }, (_, i) => ({
                  range: `${i * 10}-${(i + 1) * 10}`,
                  count: benchmarkConstituents.filter(s => s.esgScore >= i * 10 && s.esgScore < (i + 1) * 10).length,
                }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v} constituents`, 'Count']} />
                  <Bar dataKey="count" fill={T.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Temperature distribution */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>ITR Distribution — {benchmarkType}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { range: '1.5-2.0', count: benchmarkConstituents.filter(s => s.temperature < 2).length },
                  { range: '2.0-2.5', count: benchmarkConstituents.filter(s => s.temperature >= 2 && s.temperature < 2.5).length },
                  { range: '2.5-3.0', count: benchmarkConstituents.filter(s => s.temperature >= 2.5 && s.temperature < 3).length },
                  { range: '3.0-3.5', count: benchmarkConstituents.filter(s => s.temperature >= 3 && s.temperature < 3.5).length },
                  { range: '3.5-4.5', count: benchmarkConstituents.filter(s => s.temperature >= 3.5).length },
                ]} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={v => [`${v}`, 'Count']} />
                  <Bar dataKey="count" fill={T.amber} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Taxonomy & Paris alignment metrics table */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Sector-Level Taxonomy & Paris Alignment</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Sector','# Constituents','Bench Wt %','Taxonomy Aligned %','Paris Aligned %','Controversy-Free %','Avg ESG','Avg CI','Avg ITR'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CB_SECTORS.map((sec, i) => {
                    const sh = benchmarkConstituents.filter(s => s.sector === sec);
                    if (!sh.length) return null;
                    const bw = sh.reduce((s, x) => s + x.benchWeight * 100, 0);
                    const taxPct = sh.filter(s => s.taxonomyAligned).length / sh.length * 100;
                    const parisPct = sh.filter(s => s.parisAligned).length / sh.length * 100;
                    const cleanPct = sh.filter(s => !s.controversyFlag).length / sh.length * 100;
                    const avgESG2 = sh.reduce((s, x) => s + x.esgScore, 0) / sh.length;
                    const avgCI2 = sh.reduce((s, x) => s + x.carbonIntensity, 0) / sh.length;
                    const avgITR2 = sh.reduce((s, x) => s + x.temperature, 0) / sh.length;
                    return (
                      <tr key={sec} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{sec}</td>
                        <td style={{ padding: '6px 10px' }}>{sh.length}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{bw.toFixed(2)}%</td>
                        <td style={{ padding: '6px 10px', color: taxPct >= 50 ? T.green : T.amber }}>{taxPct.toFixed(1)}%</td>
                        <td style={{ padding: '6px 10px', color: parisPct >= 50 ? T.green : T.amber }}>{parisPct.toFixed(1)}%</td>
                        <td style={{ padding: '6px 10px', color: cleanPct >= 80 ? T.green : T.red }}>{cleanPct.toFixed(1)}%</td>
                        <td style={{ padding: '6px 10px' }}>{avgESG2.toFixed(0)}</td>
                        <td style={{ padding: '6px 10px', color: avgCI2 > benchmarkAvgCI ? T.amber : T.text }}>{avgCI2.toFixed(0)}</td>
                        <td style={{ padding: '6px 10px', color: avgITR2 <= 2 ? T.green : T.amber }}>{avgITR2.toFixed(2)}</td>
                      </tr>
                    );
                  }).filter(Boolean)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bottom panel: quick stats */}
        {activeTab !== 6 && (
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Construction Settings</div>
              {[
                ['Parent Index', parentIndex],
                ['Benchmark Type', benchmarkType],
                ['CI Reduction', `${carbonReduction}%`],
                ['Excl. Multiplier', `${exclusionMultiplier}×`],
                ['ESG Min Score', esgMin],
                ['Controversy Filter', excludeControversy ? 'Active' : 'Off'],
                ['Actual CI Reduction', `${actualReduction.toFixed(1)}%`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: T.muted }}>{l}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Benchmark KPIs</div>
              {[
                ['Parent Constituents', parentConstituents.length],
                ['Benchmark Constituents', benchmarkConstituents.length],
                ['Excluded', parentConstituents.length - benchmarkConstituents.length],
                ['Tracking Error', `${trackingError.toFixed(2)}%`],
                ['Parent Avg CI', `${parentAvgCI.toFixed(0)}`],
                ['Benchmark CI', `${benchmarkAvgCI.toFixed(0)}`],
                ['BMR Rules Passed', `${bmrCompliance.filter(r => r.pass).length}/12`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: T.muted }}>{l}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>Taxonomy & Paris Alignment</div>
              {[
                ['Taxonomy Aligned', `${(benchmarkConstituents.filter(s => s.taxonomyAligned).length / (benchmarkConstituents.length || 1) * 100).toFixed(1)}%`],
                ['Paris Aligned', `${(benchmarkConstituents.filter(s => s.parisAligned).length / (benchmarkConstituents.length || 1) * 100).toFixed(1)}%`],
                ['Controversy-Free', `${(benchmarkConstituents.filter(s => !s.controversyFlag).length / (benchmarkConstituents.length || 1) * 100).toFixed(1)}%`],
                ['Avg ESG Score', benchmarkConstituents.length ? (benchmarkConstituents.reduce((s, x) => s + x.esgScore, 0) / benchmarkConstituents.length).toFixed(1) : 0],
                ['Avg ITR', benchmarkConstituents.length ? (benchmarkConstituents.reduce((s, x) => s + x.temperature, 0) / benchmarkConstituents.length).toFixed(2) + '°C' : '—'],
                ['EU Taxonomy %', `${(benchmarkConstituents.filter(s => s.euTaxonomyPct > 50).length / (benchmarkConstituents.length || 1) * 100).toFixed(1)}%`],
                ['Avg Greenium', `${(greeniumData.reduce((s, x) => s + x.greenium, 0) / greeniumData.length).toFixed(1)} bps`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span style={{ color: T.muted }}>{l}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Annual decarbonization milestones */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Annual Decarbonization Milestones — PAB vs CTB</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Year','PAB CI Target','CTB CI Target','Parent CI','PAB Reduction %','CTB Reduction %','PAB Status','CTB Status'].map(h => (
                    <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[2025, 2026, 2027, 2028, 2029, 2030, 2035, 2040, 2050].map((yr, i) => {
                  const yOffset = yr - 2025;
                  const pabCI = +(benchmarkAvgCI * Math.pow(0.93, yOffset)).toFixed(0);
                  const ctbCI = +(parentAvgCI * 0.7 * Math.pow(0.95, yOffset)).toFixed(0);
                  const parCI = +(parentAvgCI * Math.pow(0.99, yOffset)).toFixed(0);
                  const pabRed = +((1 - pabCI / parCI) * 100).toFixed(1);
                  const ctbRed = +((1 - ctbCI / parCI) * 100).toFixed(1);
                  return (
                    <tr key={yr} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '7px 12px', fontWeight: 700 }}>{yr}</td>
                      <td style={{ padding: '7px 12px', color: T.indigo }}>{pabCI}</td>
                      <td style={{ padding: '7px 12px', color: T.teal }}>{ctbCI}</td>
                      <td style={{ padding: '7px 12px', color: T.muted }}>{parCI}</td>
                      <td style={{ padding: '7px 12px', color: pabRed >= carbonReduction ? T.green : T.red }}>{pabRed}%</td>
                      <td style={{ padding: '7px 12px', color: ctbRed >= 30 ? T.green : T.red }}>{ctbRed}%</td>
                      <td style={{ padding: '7px 12px' }}><span style={{ background: pabRed >= carbonReduction ? T.green : T.red, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{pabRed >= carbonReduction ? 'On Track' : 'Lagging'}</span></td>
                      <td style={{ padding: '7px 12px' }}><span style={{ background: ctbRed >= 30 ? T.green : T.red, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{ctbRed >= 30 ? 'On Track' : 'Lagging'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAB vs CTB vs Parent detailed comparison */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>PAB vs CTB vs Parent Index — Detailed Risk Comparison</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Metric','Parent Index','CTB','PAB (Current)','Delta PAB vs Parent','Notes'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Constituents', parentConstituents.length, Math.round(benchmarkConstituents.length * 1.3), benchmarkConstituents.length, '', 'After exclusions'],
                  ['Avg CI', parentAvgCI.toFixed(0), (parentAvgCI * 0.7).toFixed(0), benchmarkAvgCI.toFixed(0), `${actualReduction.toFixed(1)}% reduction`, 'tCO₂e/$M'],
                  ['Tracking Error', '0%', `${(trackingError * 0.7).toFixed(2)}%`, `${trackingError.toFixed(2)}%`, '', 'vs parent'],
                  ['Taxonomy Aligned', `${(parentConstituents.filter(s => s.taxonomyAligned).length / (parentConstituents.length || 1) * 100).toFixed(0)}%`, '', `${(benchmarkConstituents.filter(s => s.taxonomyAligned).length / (benchmarkConstituents.length || 1) * 100).toFixed(0)}%`, '', 'EU taxonomy'],
                  ['Paris Aligned', `${(parentConstituents.filter(s => s.parisAligned).length / (parentConstituents.length || 1) * 100).toFixed(0)}%`, '', `${(benchmarkConstituents.filter(s => s.parisAligned).length / (benchmarkConstituents.length || 1) * 100).toFixed(0)}%`, '', '≤2°C'],
                  ['Controversy-Free', `${(parentConstituents.filter(s => !s.controversyFlag).length / (parentConstituents.length || 1) * 100).toFixed(0)}%`, '', `${(benchmarkConstituents.filter(s => !s.controversyFlag).length / (benchmarkConstituents.length || 1) * 100).toFixed(0)}%`, '', 'Excl. filter'],
                  ['Avg ESG Score', parentConstituents.length ? (parentConstituents.reduce((s, x) => s + x.esgScore, 0) / parentConstituents.length).toFixed(0) : 0, '', benchmarkConstituents.length ? (benchmarkConstituents.reduce((s, x) => s + x.esgScore, 0) / benchmarkConstituents.length).toFixed(0) : 0, '', 'ESG min filter'],
                  ['BMR Rules Passed', 'N/A', 'N/A', `${bmrCompliance.filter(r => r.pass).length}/12`, '', 'EU BMR compliance'],
                ].map(([m, p, ctb, pab, delta, note], i) => (
                  <tr key={m} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>{m}</td>
                    <td style={{ padding: '6px 10px', color: T.muted }}>{p}</td>
                    <td style={{ padding: '6px 10px', color: T.teal }}>{ctb || '—'}</td>
                    <td style={{ padding: '6px 10px', fontWeight: 600, color: T.indigo }}>{pab}</td>
                    <td style={{ padding: '6px 10px', color: T.green }}>{delta || '—'}</td>
                    <td style={{ padding: '6px 10px', color: T.muted, fontSize: 11 }}>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sector tilt detailed */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Sector Weight Tilt Detail — {benchmarkType} vs {parentIndex}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Sector','Parent Wt %','Benchmark Wt %','Active Tilt %','Tilt Direction','Avg CI Sector','Avg ESG Sector','Tilt Rationale'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectorTilts.map((st, i) => {
                  const sh = benchmarkConstituents.filter(s => s.sector === st.sector);
                  const avgCI2 = sh.length ? sh.reduce((s, x) => s + x.carbonIntensity, 0) / sh.length : 0;
                  const avgESG2 = sh.length ? sh.reduce((s, x) => s + x.esgScore, 0) / sh.length : 0;
                  const rationale = st.tilt > 1 ? 'Low CI / High ESG' : st.tilt < -1 ? 'High CI excluded' : 'Neutral';
                  return (
                    <tr key={st.sector} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{st.sector}</td>
                      <td style={{ padding: '6px 10px', color: T.muted }}>{st.parentWeight.toFixed(2)}%</td>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{st.benchWeight.toFixed(2)}%</td>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: st.tilt > 0 ? T.green : st.tilt < 0 ? T.red : T.muted }}>
                        {st.tilt > 0 ? '+' : ''}{st.tilt.toFixed(2)}%
                      </td>
                      <td style={{ padding: '6px 10px' }}>{st.tilt > 0.5 ? '▲ Overweight' : st.tilt < -0.5 ? '▼ Underweight' : '= Neutral'}</td>
                      <td style={{ padding: '6px 10px', color: avgCI2 > benchmarkAvgCI ? T.amber : T.text }}>{avgCI2.toFixed(0)}</td>
                      <td style={{ padding: '6px 10px' }}>{avgESG2.toFixed(0)}</td>
                      <td style={{ padding: '6px 10px', color: T.muted, fontSize: 11 }}>{rationale}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Constituent classification grid */}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Constituent Classification Summary — {benchmarkType} on {parentIndex}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              {[
                { label: 'Taxonomy\nAligned', value: benchmarkConstituents.filter(s => s.taxonomyAligned).length, total: benchmarkConstituents.length, color: T.green },
                { label: 'Paris\nAligned', value: benchmarkConstituents.filter(s => s.parisAligned).length, total: benchmarkConstituents.length, color: T.teal },
                { label: 'High ESG\n(≥70)', value: benchmarkConstituents.filter(s => s.esgScore >= 70).length, total: benchmarkConstituents.length, color: T.indigo },
                { label: 'Low CI\n(<100)', value: benchmarkConstituents.filter(s => s.carbonIntensity < 100).length, total: benchmarkConstituents.length, color: T.blue },
                { label: 'Clean\n(No Contr.)', value: benchmarkConstituents.filter(s => !s.controversyFlag).length, total: benchmarkConstituents.length, color: T.purple },
              ].map(item => (
                <div key={item.label} style={{ background: T.sub, borderRadius: 8, padding: 12, textAlign: 'center', borderLeft: `3px solid ${item.color}` }}>
                  <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, marginBottom: 4, whiteSpace: 'pre' }}>{item.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: T.muted }}>{item.total > 0 ? (item.value / item.total * 100).toFixed(0) : 0}%</div>
                  <div style={{ background: T.border, borderRadius: 4, height: 4, marginTop: 6 }}>
                    <div style={{ background: item.color, borderRadius: 4, height: 4, width: `${item.total > 0 ? item.value / item.total * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: T.text }}>Annual Decarbonisation Compliance Audit — PAB 7% Year-on-Year Pathway</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Year', 'PAB Target CI', 'CTB Target CI', 'Portfolio CI', 'PAB Status', 'CTB Status', 'Δ vs PAB', 'Δ vs CTB', 'Correction Required'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: T.text, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }, (_, y) => {
                  const year = 2024 + y;
                  const basePAB = 120;
                  const baseCTB = 180;
                  const decayPAB = Math.pow(0.93, y);
                  const decayCTB = Math.pow(0.95, y);
                  const pabTarget = +(basePAB * decayPAB).toFixed(1);
                  const ctbTarget = +(baseCTB * decayCTB).toFixed(1);
                  const portCI = +(pabTarget * (0.85 + sr(y * 7 + 3) * 0.4)).toFixed(1);
                  const pabOK = portCI <= pabTarget;
                  const ctbOK = portCI <= ctbTarget;
                  const dPAB = +(portCI - pabTarget).toFixed(1);
                  const dCTB = +(portCI - ctbTarget).toFixed(1);
                  const corr = !pabOK ? `Reduce by ${Math.abs(dPAB).toFixed(0)} tCO₂e/$M` : !ctbOK ? 'Minor tilt' : 'None';
                  return (
                    <tr key={year} style={{ background: y % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '6px 10px', fontWeight: 700 }}>{year}</td>
                      <td style={{ padding: '6px 10px' }}>{pabTarget}</td>
                      <td style={{ padding: '6px 10px' }}>{ctbTarget}</td>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: pabOK ? T.green : T.red }}>{portCI}</td>
                      <td style={{ padding: '6px 10px' }}><span style={{ background: pabOK ? T.green : T.red, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{pabOK ? '✓ Pass' : '✗ Fail'}</span></td>
                      <td style={{ padding: '6px 10px' }}><span style={{ background: ctbOK ? T.green : T.amber, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10 }}>{ctbOK ? '✓ Pass' : '! Warn'}</span></td>
                      <td style={{ padding: '6px 10px', color: dPAB > 0 ? T.red : T.green, fontWeight: 600 }}>{dPAB > 0 ? '+' : ''}{dPAB}</td>
                      <td style={{ padding: '6px 10px', color: dCTB > 0 ? T.amber : T.green }}>{dCTB > 0 ? '+' : ''}{dCTB}</td>
                      <td style={{ padding: '6px 10px', fontSize: 10, color: corr === 'None' ? T.green : T.red }}>{corr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {activeTab !== 6 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: T.text }}>Greenium vs Carbon Intensity — Percentile Correlation Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {['P10', 'P25', 'P50', 'P75', 'P90'].map((pct, pi) => {
                const ciBound = [50, 100, 200, 350, 500][pi];
                const avgGreenium = +(sr(pi * 13 + 5) * 0.2 - 0.1).toFixed(4);
                const inBench = benchmarkConstituents.filter(s => s.carbonIntensity <= ciBound).length;
                const pctCov = benchmarkConstituents.length > 0 ? (inBench / benchmarkConstituents.length * 100).toFixed(0) : 0;
                return (
                  <div key={pct} style={{ background: T.sub, borderRadius: 8, padding: 12, textAlign: 'center', borderTop: `3px solid ${T.indigo}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.muted }}>{pct}</div>
                    <div style={{ fontSize: 11, color: T.text, marginTop: 4 }}>CI ≤ {ciBound}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: avgGreenium >= 0 ? T.red : T.green, marginTop: 4 }}>{avgGreenium >= 0 ? '+' : ''}{avgGreenium.toFixed(4)}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>Avg Greenium</div>
                    <div style={{ fontSize: 10, color: T.blue, marginTop: 4 }}>{pctCov}% in bench</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
