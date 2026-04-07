import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const INSTITUTION_TYPES = ['Commercial Bank','Investment Bank','Universal Bank','Regional Bank','Insurance Group','Asset Manager','Cooperative Bank','Development Bank'];
const JURISDICTIONS = ['EU','UK','US','Canada','Australia','Japan','Singapore','Switzerland','UAE','Brazil'];
const FRAMEWORKS_BY_JURIS = { EU:'CRR2', UK:'CRR2', US:'NAIC', Canada:'OSFI B-15', Australia:'APRA', Japan:'Basel IV', Singapore:'Basel IV', Switzerland:'Basel IV', UAE:'Basel IV', Brazil:'Basel IV' };
const CET1_THRESHOLDS = { EU:10.5, UK:11.0, US:9.5, Canada:10.0, Australia:10.25, Japan:9.0, Singapore:10.0, Switzerland:12.0, UAE:9.5, Brazil:8.5 };
const JURIS_RULES = {
  EU:          { label:'CRR2 + EBA GL',    minCET1: 10.5, pillarMult: 1.20, greenBonus: 0.12 },
  UK:          { label:'PRA SS3/19',        minCET1: 11.0, pillarMult: 1.15, greenBonus: 0.10 },
  US:          { label:'FRB Climate Pilot', minCET1: 9.5,  pillarMult: 1.00, greenBonus: 0.05 },
  Canada:      { label:'OSFI B-15',         minCET1: 10.0, pillarMult: 1.10, greenBonus: 0.08 },
  Australia:   { label:'APRA CPG 229',      minCET1: 10.25,pillarMult: 1.08, greenBonus: 0.07 },
  Japan:       { label:'FSA Climate',       minCET1: 9.0,  pillarMult: 1.00, greenBonus: 0.05 },
  Singapore:   { label:'MAS Guidelines',    minCET1: 10.0, pillarMult: 1.05, greenBonus: 0.06 },
  Switzerland: { label:'FINMA',             minCET1: 12.0, pillarMult: 1.25, greenBonus: 0.10 },
  UAE:         { label:'CBUAE Framework',   minCET1: 9.5,  pillarMult: 0.95, greenBonus: 0.04 },
  Brazil:      { label:'BCB Resolution 4',  minCET1: 8.5,  pillarMult: 1.02, greenBonus: 0.04 },
};

const INST_NAMES = [
  'Barclays Global','JPMorgan Chase','Deutsche Bank','HSBC Holdings','BNP Paribas','Société Générale',
  'UniCredit Group','Intesa Sanpaolo','Santander SA','ING Group','Rabobank','Credit Suisse',
  'UBS Group','Nordea Bank','DnB ASA','Handelsbanken','Swedbank','SEB Group','Danske Bank','ABN AMRO',
  'Commerzbank','Bayern LB','DZ Bank','Helaba','LBBW','Volkswagen Bank','Siemens Bank','Allianz SE',
  'Munich Re','Axa Group','Generali','Zurich Insurance','AIG Corp','MetLife','Prudential PLC',
  'Aviva Group','Legal & General','Standard Life','Aegon NV','Mapfre SA','Fidelity Intl','Vanguard',
  'BlackRock','State Street','Wellington','Bridgewater','Pimco Capital','T Rowe Price','Capital Group',
  'Northern Trust','Bank of America','Wells Fargo','Citigroup','Goldman Sachs','Morgan Stanley',
  'US Bancorp','PNC Financial','Truist Financial','KeyCorp','Regions Financial','Comerica','Zions Banco',
  'SVB Financial','First Republic','Signature Bank','East West Banco','Glacier Bancorp','Cullen Bankers',
  'Royal Bank Canada','TD Financial','Bank Montreal','CIBC Holdings','Scotiabank','Laurentian Bank',
  'CWB Financial','National Bank CA','Desjardins Grp','Meridian CU','Commonwealth Bank','ANZ Banking',
  'Westpac Banking','NAB Group','Bendigo Bank','Bank Queensland','Suncorp Group','AMP Limited',
  'Macquarie Group','Challenger Fin','MUFG Bank','Mizuho Financial','SMFG Holdings','Nomura Holdings',
  'Daiwa Securities','Resona Holdings','Sumitomo Mitsui','Japan Post Bank','DBS Group','OCBC Bank',
  'UOB Limited','Standard Chart',
];

const INSTITUTIONS = INST_NAMES.map((name, i) => {
  const juris = JURISDICTIONS[Math.floor(sr(i * 7) * JURISDICTIONS.length)];
  const type = INSTITUTION_TYPES[Math.floor(sr(i * 11) * INSTITUTION_TYPES.length)];
  const totalRWA = 50 + sr(i * 13) * 950;
  const tier1 = 0.08 + sr(i * 17) * 0.10;
  const cet1 = tier1 - sr(i * 19) * 0.015;
  const climatRWAPct = 0.05 + sr(i * 23) * 0.30;
  const physicalRiskScore = 10 + sr(i * 29) * 80;
  const transitionRiskScore = 10 + sr(i * 31) * 80;
  const natcatRWA = totalRWA * climatRWAPct * sr(i * 37) * 0.4;
  const greenLoanPct = sr(i * 41) * 0.45;
  const fossilFuelExposure = sr(i * 43) * 0.35;
  const ESGrating = ['AAA','AA','A','BBB','BB','B'][Math.floor(sr(i * 47) * 6)];
  const carbonIntensive = sr(i * 53) > 0.65;
  const lcrRatio = 1.0 + sr(i * 59) * 0.8;
  const nsfr = 1.0 + sr(i * 61) * 0.4;
  const leverageRatio = 0.03 + sr(i * 67) * 0.05;
  const pillar2Guidance = 0.005 + sr(i * 71) * 0.030;
  const climateStressBuffer = physicalRiskScore * 0.001 * totalRWA;
  return {
    id: i, name, type, jurisdiction: juris, totalRWA, tier1Capital: tier1,
    cet1Capital: cet1, climatRWAPct, physicalRiskScore, transitionRiskScore,
    natcatRWA, greenLoanPct, fossilFuelExposure, ESGrating, carbonIntensive,
    lcrRatio, nsfr, leverageRatio, pillar2Guidance, climateStressBuffer,
    regulatoryFramework: FRAMEWORKS_BY_JURIS[juris],
  };
});

const SCENARIOS = [
  { id: 0, name: 'Baseline',         pillar2AddPct: 0,   haircut: 0,    natcatMultiplier: 1.0, greenAssetRatioBonus: 0    },
  { id: 1, name: 'Orderly 1.5°C',    pillar2AddPct: 0.8, haircut: 0.03, natcatMultiplier: 1.2, greenAssetRatioBonus: 0.10 },
  { id: 2, name: 'Disorderly 2°C',   pillar2AddPct: 1.5, haircut: 0.06, natcatMultiplier: 1.5, greenAssetRatioBonus: 0.05 },
  { id: 3, name: 'Hot House 3°C',    pillar2AddPct: 2.8, haircut: 0.12, natcatMultiplier: 2.2, greenAssetRatioBonus: 0    },
  { id: 4, name: 'Tail Risk 4°C+',   pillar2AddPct: 4.5, haircut: 0.20, natcatMultiplier: 3.5, greenAssetRatioBonus: 0    },
  { id: 5, name: 'Bifurcated',        pillar2AddPct: 2.0, haircut: 0.08, natcatMultiplier: 1.8, greenAssetRatioBonus: 0.03 },
  { id: 6, name: 'Policy Shock',      pillar2AddPct: 3.2, haircut: 0.15, natcatMultiplier: 1.6, greenAssetRatioBonus: 0.08 },
  { id: 7, name: 'Tech Revolution',   pillar2AddPct: 0.5, haircut: 0.02, natcatMultiplier: 1.1, greenAssetRatioBonus: 0.15 },
];

function computeCapital(inst, scenario) {
  const rule = JURIS_RULES[inst.jurisdiction];
  const pillar2AddOn = inst.climatRWAPct * inst.totalRWA * (scenario.pillar2AddPct / 100) * rule.pillarMult;
  const garBonus = inst.greenLoanPct > 0.30 ? pillar2AddOn * scenario.greenAssetRatioBonus : 0;
  const netPillar2 = Math.max(0, pillar2AddOn - garBonus);
  const baseCapital = inst.tier1Capital * inst.totalRWA;
  const adjustedCapital = baseCapital - netPillar2;
  const cet1Impact = inst.totalRWA > 0 ? adjustedCapital / inst.totalRWA : 0;
  const shortfall = Math.max(0, rule.minCET1 / 100 - cet1Impact);
  const stressBuffer = inst.physicalRiskScore * 0.001 * inst.totalRWA * scenario.natcatMultiplier;
  const lvgImpact = inst.leverageRatio - netPillar2 / Math.max(inst.totalRWA * 12.5, 1) * 0.01;
  return { pillar2AddOn, garBonus, netPillar2, cet1Impact, shortfall, stressBuffer, lvgImpact, threshold: rule.minCET1 / 100 };
}

const KpiCard = ({ label, value, color = T.text, sub = '' }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const TABS = ['Capital Overview','Institution Database','Scenario Stress Matrix','RWA Decomposition','Jurisdiction Comparison','Sensitivity Analysis','Summary & Export'];

export default function ClimateCapitalAdequacyPage() {
  const [tab, setTab] = useState(0);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [jurisFilter, setJurisFilter] = useState('All');
  const [carbonFilter, setCarbonFilter] = useState(false);
  const [garFilter, setGarFilter] = useState(0);
  const [cet1Min, setCet1Min] = useState(0);
  const [fossilMax, setFossilMax] = useState(100);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('totalRWA');
  const [sortDir, setSortDir] = useState(-1);
  const [selectedId, setSelectedId] = useState(null);
  const [compareId, setCompareId] = useState(null);
  const [compareMode, setCompareMode] = useState(false);

  const scenario = SCENARIOS[scenarioIdx];

  const enriched = useMemo(() => INSTITUTIONS.map(inst => ({ ...inst, ...computeCapital(inst, scenario) })), [scenarioIdx]);

  const filtered = useMemo(() => {
    let d = enriched;
    if (typeFilter !== 'All') d = d.filter(x => x.type === typeFilter);
    if (jurisFilter !== 'All') d = d.filter(x => x.jurisdiction === jurisFilter);
    if (carbonFilter) d = d.filter(x => x.carbonIntensive);
    if (garFilter > 0) d = d.filter(x => x.greenLoanPct * 100 >= garFilter);
    d = d.filter(x => x.cet1Impact * 100 >= cet1Min);
    d = d.filter(x => x.fossilFuelExposure * 100 <= fossilMax);
    if (search) d = d.filter(x => x.name.toLowerCase().includes(search.toLowerCase()) || x.jurisdiction.toLowerCase().includes(search.toLowerCase()));
    return [...d].sort((a, b) => sortDir * ((a[sortCol] || 0) - (b[sortCol] || 0)));
  }, [enriched, typeFilter, jurisFilter, carbonFilter, garFilter, cet1Min, fossilMax, search, sortCol, sortDir]);

  const portfolioAvgCET1 = useMemo(() => filtered.length ? filtered.reduce((s, x) => s + x.cet1Impact, 0) / filtered.length : 0, [filtered]);
  const totalShortfall = useMemo(() => filtered.reduce((s, x) => s + x.shortfall * x.totalRWA, 0), [filtered]);
  const avgPillar2 = useMemo(() => filtered.length ? filtered.reduce((s, x) => s + x.pillar2AddOn, 0) / filtered.length : 0, [filtered]);
  const breachCount = useMemo(() => filtered.filter(x => x.shortfall > 0).length, [filtered]);

  const top25Pillar2 = useMemo(() => [...filtered].sort((a, b) => b.pillar2AddOn - a.pillar2AddOn).slice(0, 25), [filtered]);

  const jurisBreakdown = useMemo(() => JURISDICTIONS.map(j => {
    const sub = filtered.filter(x => x.jurisdiction === j);
    const avgCET1 = sub.length ? sub.reduce((s, x) => s + x.cet1Impact * 100, 0) / sub.length : 0;
    const breaches = sub.filter(x => x.shortfall > 0).length;
    return { jurisdiction: j, avgCET1: +avgCET1.toFixed(2), institutions: sub.length, breaches, threshold: JURIS_RULES[j].minCET1 };
  }), [filtered]);

  const selectedInst = useMemo(() => selectedId != null ? enriched.find(x => x.id === selectedId) : null, [enriched, selectedId]);
  const compareInst = useMemo(() => compareId != null ? enriched.find(x => x.id === compareId) : null, [enriched, compareId]);

  const scenarioMatrix = useMemo(() => {
    if (!selectedInst) return [];
    return SCENARIOS.map(sc => {
      const c = computeCapital(selectedInst, sc);
      return { scenario: sc.name, cet1: +(c.cet1Impact * 100).toFixed(2), pillar2: +c.pillar2AddOn.toFixed(1), shortfall: +(c.shortfall * 100).toFixed(3), buffer: +c.stressBuffer.toFixed(1) };
    });
  }, [selectedInst]);

  const rwaDeco = useMemo(() => filtered.slice(0, 30).map(x => ({
    name: x.name.split(' ')[0],
    climateRWA: +(x.totalRWA * x.climatRWAPct).toFixed(1),
    nonClimateRWA: +(x.totalRWA * (1 - x.climatRWAPct)).toFixed(1),
    greenLoanPct: +(x.greenLoanPct * 100).toFixed(1),
  })), [filtered]);

  const sensitivityData = useMemo(() => [
    { name: 'Physical Risk +1σ',    impact: -(filtered.length ? filtered.reduce((s, x) => s + x.physicalRiskScore * 0.0001, 0) / filtered.length : 0) },
    { name: 'Fossil Exposure +10%', impact: -0.018 },
    { name: 'Climate RWA +5%',      impact: -(scenario.pillar2AddPct / 100 * 0.05) * 100 },
    { name: 'GAR Bonus +10%',       impact: +(scenario.greenAssetRatioBonus * 0.1) * 100 },
    { name: 'Scenario Escalation',  impact: -(scenario.pillar2AddPct * 0.003) * 10 },
    { name: 'Pillar 2 Mult +0.1',   impact: -0.030 },
    { name: 'CET1 Threshold +0.5%', impact: -0.050 },
    { name: 'Leverage Ratio -1%',   impact: -0.020 },
  ].map(v => ({ ...v, impact: +v.impact.toFixed(4) })), [filtered, scenario]);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortDir(d => -d);
    else { setSortCol(col); setSortDir(-1); }
  }, [sortCol]);

  const filterRow = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center', padding: '12px 16px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }}>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search institutions..." style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, width: 160 }} />
      <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
        <option>All</option>{INSTITUTION_TYPES.map(t => <option key={t}>{t}</option>)}
      </select>
      <select value={jurisFilter} onChange={e => setJurisFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
        <option>All</option>{JURISDICTIONS.map(j => <option key={j}>{j}</option>)}
      </select>
      <select value={scenarioIdx} onChange={e => setScenarioIdx(+e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
        {SCENARIOS.map((s, i) => <option key={i} value={i}>{s.name}</option>)}
      </select>
      <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
        <input type="checkbox" checked={carbonFilter} onChange={e => setCarbonFilter(e.target.checked)} /> Carbon Intensive
      </label>
      <label style={{ fontSize: 12 }}>GAR ≥{garFilter}%
        <input type="range" min={0} max={40} value={garFilter} onChange={e => setGarFilter(+e.target.value)} style={{ marginLeft: 6, width: 70 }} />
      </label>
      <label style={{ fontSize: 12 }}>Fossil ≤{fossilMax}%
        <input type="range" min={0} max={100} value={fossilMax} onChange={e => setFossilMax(+e.target.value)} style={{ marginLeft: 6, width: 70 }} />
      </label>
      <label style={{ fontSize: 12 }}>CET1 ≥{cet1Min}%
        <input type="range" min={0} max={20} value={cet1Min} onChange={e => setCet1Min(+e.target.value)} style={{ marginLeft: 6, width: 70 }} />
      </label>
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>EP-DB1 · Sprint DB · Enterprise Climate Risk Capital</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '4px 0 2px', color: T.navy }}>Climate Capital Adequacy Engine</h1>
        <div style={{ fontSize: 13, color: T.muted }}>100 institutions · 8 Basel scenarios · 10 jurisdictions · Multi-scenario Pillar 2 stress engine</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Portfolio Avg CET1" value={`${(portfolioAvgCET1 * 100).toFixed(2)}%`} color={T.indigo} sub={`Scenario: ${scenario.name}`} />
        <KpiCard label="Capital Shortfall" value={`$${(totalShortfall / 1000).toFixed(1)}T`} color={totalShortfall > 0 ? T.red : T.green} sub={`${breachCount} breaches`} />
        <KpiCard label="Avg Pillar 2 Add-On" value={`$${avgPillar2.toFixed(1)}B`} color={T.amber} sub={`${scenario.pillar2AddPct}% param`} />
        <KpiCard label="Filtered Institutions" value={`${filtered.length}/100`} color={T.navy} sub={typeFilter !== 'All' ? typeFilter : 'All types'} />
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 24 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === i ? 700 : 400, color: tab === i ? T.indigo : T.muted, borderBottom: tab === i ? `2px solid ${T.indigo}` : '2px solid transparent', marginBottom: -2, whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          {filterRow}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Top 25 Institutions by Pillar 2 Add-On ($B)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={top25Pillar2} margin={{ left: 0, right: 8, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`$${Number(v).toFixed(1)}B`]} />
                  <Legend />
                  <Bar dataKey="pillar2AddOn" fill={T.indigo} name="Pillar 2 Add-On" radius={[2,2,0,0]} />
                  <Bar dataKey="garBonus" fill={T.green} name="GAR Bonus" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Jurisdiction: Avg CET1 vs Regulatory Threshold</div>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={jurisBreakdown} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="jurisdiction" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[7, 14]} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${Number(v).toFixed(2)}%`} />
                  <Legend />
                  <Bar dataKey="avgCET1" fill={T.blue} name="Avg CET1%" radius={[2,2,0,0]} />
                  <Line type="monotone" dataKey="threshold" stroke={T.red} dot={false} name="Min Threshold%" strokeWidth={2} strokeDasharray="4 2" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ marginTop: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Scenario Parameter Matrix — Click to Select Active Scenario</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {SCENARIOS.map((s, i) => (
                <div key={i} onClick={() => setScenarioIdx(i)} style={{ cursor: 'pointer', padding: '10px 16px', borderRadius: 8, border: `2px solid ${i === scenarioIdx ? T.indigo : T.border}`, background: i === scenarioIdx ? '#eef2ff' : T.sub, minWidth: 140, transition: 'all 0.15s' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: i === scenarioIdx ? T.indigo : T.text }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>P2 Add: {s.pillar2AddPct}% | Haircut: {(s.haircut*100).toFixed(0)}%</div>
                  <div style={{ fontSize: 11, color: T.muted }}>NatCat: {s.natcatMultiplier}× | GAR: {(s.greenAssetRatioBonus*100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          {filterRow}
          <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12 }}><input type="checkbox" checked={compareMode} onChange={e => setCompareMode(e.target.checked)} style={{ marginRight: 4 }} />Compare Mode</label>
            {compareMode && <span style={{ fontSize: 12, color: T.indigo }}>Click first row = primary, second row = compare</span>}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto', maxHeight: 600 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ position: 'sticky', top: 0 }}>
                <tr style={{ background: T.sub }}>
                  {[['Name','name'],['Type','type'],['Juris','jurisdiction'],['RWA($B)','totalRWA'],['CET1%','cet1Impact'],['GAR%','greenLoanPct'],['Fossil%','fossilFuelExposure'],['ESG','ESGrating'],['P2($B)','pillar2AddOn'],['Shortfall','shortfall'],['Framework','regulatoryFramework']].map(([h,k]) => (
                    <th key={k} onClick={() => handleSort(k)} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: sortCol === k ? T.indigo : T.muted, borderBottom: `1px solid ${T.border}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>{h}{sortCol === k ? (sortDir > 0 ? ' ↑' : ' ↓') : ''}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((x, i) => (
                  <tr key={x.id} onClick={() => {
                    if (!compareMode) { setSelectedId(x.id); }
                    else if (!selectedId) { setSelectedId(x.id); }
                    else if (selectedId === x.id) { setSelectedId(null); }
                    else { setCompareId(x.id); }
                  }} style={{ background: x.id === selectedId ? '#eef2ff' : x.id === compareId ? '#fdf4ff' : i % 2 === 0 ? T.card : T.sub, cursor: 'pointer', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 10px', fontWeight: 500 }}>{x.name}</td>
                    <td style={{ padding: '6px 10px', color: T.muted, fontSize: 11 }}>{x.type}</td>
                    <td style={{ padding: '6px 10px' }}>{x.jurisdiction}</td>
                    <td style={{ padding: '6px 10px' }}>{x.totalRWA.toFixed(0)}</td>
                    <td style={{ padding: '6px 10px', color: x.cet1Impact * 100 < CET1_THRESHOLDS[x.jurisdiction] ? T.red : T.green, fontWeight: 600 }}>{(x.cet1Impact * 100).toFixed(2)}%</td>
                    <td style={{ padding: '6px 10px', color: x.greenLoanPct > 0.30 ? T.green : T.muted }}>{(x.greenLoanPct * 100).toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', color: x.fossilFuelExposure > 0.20 ? T.red : T.text }}>{(x.fossilFuelExposure * 100).toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px' }}>{x.ESGrating}</td>
                    <td style={{ padding: '6px 10px' }}>{x.pillar2AddOn.toFixed(2)}</td>
                    <td style={{ padding: '6px 10px', color: x.shortfall > 0 ? T.red : T.green }}>{x.shortfall > 0 ? `${(x.shortfall * 100).toFixed(3)}%` : '—'}</td>
                    <td style={{ padding: '6px 10px', color: T.muted, fontSize: 11 }}>{x.regulatoryFramework}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: T.muted }}>{filtered.length} institutions · Click to select for Scenario Matrix</div>
          {compareMode && selectedInst && compareInst && (
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[selectedInst, compareInst].map((inst, ci) => (
                <div key={ci} style={{ background: T.card, border: `2px solid ${ci === 0 ? T.indigo : T.purple}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: ci === 0 ? T.indigo : T.purple }}>{inst.name}</div>
                  {[['CET1 Impact',`${(inst.cet1Impact*100).toFixed(2)}%`],['Pillar 2 Add-On',`$${inst.pillar2AddOn.toFixed(1)}B`],['Shortfall',inst.shortfall > 0 ? `${(inst.shortfall*100).toFixed(3)}%` : 'None'],['Climate Stress Buffer',`$${inst.stressBuffer.toFixed(1)}B`],['Green Loan %',`${(inst.greenLoanPct*100).toFixed(1)}%`],['Fossil Exposure',`${(inst.fossilFuelExposure*100).toFixed(1)}%`]].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${T.border}`, padding: '5px 0', fontSize: 13 }}>
                      <span style={{ color: T.muted }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 2 && (
        <div>
          {filterRow}
          <div style={{ marginBottom: 12, padding: '10px 16px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13 }}>
            {selectedInst ? <span>Analyzing: <strong>{selectedInst.name}</strong> ({selectedInst.jurisdiction} · {selectedInst.type})</span> : <span style={{ color: T.muted }}>No institution selected — go to Institution Database and click a row.</span>}
          </div>
          {selectedInst ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>CET1 Across 8 Scenarios — {selectedInst.name}</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={scenarioMatrix}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="scenario" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 10 }} domain={[0, 20]} tickFormatter={v => `${v}%`} />
                      <Tooltip formatter={v => `${Number(v).toFixed(2)}%`} />
                      <Bar dataKey="cet1" fill={T.blue} name="CET1%" radius={[2,2,0,0]} />
                      <ReferenceLine y={JURIS_RULES[selectedInst.jurisdiction].minCET1} stroke={T.red} strokeDasharray="4 2" label={{ value: 'Min', fontSize: 10, fill: T.red }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>Stress Buffer by Scenario ($B)</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={scenarioMatrix}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="scenario" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={v => `$${Number(v).toFixed(1)}B`} />
                      <Bar dataKey="buffer" fill={T.amber} name="Stress Buffer ($B)" radius={[2,2,0,0]} />
                      <Bar dataKey="pillar2" fill={T.red} name="Pillar 2 ($B)" radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{ marginTop: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>Scenario Stress Matrix — Full Detail</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>{['Scenario','CET1%','vs Min','Pillar2($B)','Shortfall','Stress Buffer($B)','Status'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {scenarioMatrix.map((r, i) => {
                      const minCet1 = JURIS_RULES[selectedInst.jurisdiction].minCET1;
                      return (
                        <tr key={i} style={{ background: i === scenarioIdx ? '#eef2ff' : i % 2 === 0 ? T.card : T.sub }}>
                          <td style={{ padding: '7px 10px', fontWeight: i === scenarioIdx ? 700 : 400 }}>{r.scenario}</td>
                          <td style={{ padding: '7px 10px', color: r.cet1 < minCet1 ? T.red : T.green, fontWeight: 600 }}>{r.cet1}%</td>
                          <td style={{ padding: '7px 10px', color: r.cet1 - minCet1 < 0 ? T.red : T.muted }}>{r.cet1 - minCet1 > 0 ? '+' : ''}{(r.cet1 - minCet1).toFixed(2)}%</td>
                          <td style={{ padding: '7px 10px' }}>${r.pillar2}</td>
                          <td style={{ padding: '7px 10px', color: r.shortfall > 0 ? T.red : T.green }}>{r.shortfall > 0 ? `${r.shortfall.toFixed(3)}%` : '—'}</td>
                          <td style={{ padding: '7px 10px' }}>${r.buffer}</td>
                          <td style={{ padding: '7px 10px' }}><span style={{ background: r.cet1 >= minCet1 ? '#f0fdf4' : '#fef2f2', color: r.cet1 >= minCet1 ? T.green : T.red, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{r.cet1 >= minCet1 ? 'PASS' : 'BREACH'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : <div style={{ padding: 60, textAlign: 'center', color: T.muted }}>Select an institution from the Institution Database tab to view scenario stress analysis.</div>}
        </div>
      )}

      {tab === 3 && (
        <div>
          {filterRow}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Climate vs Non-Climate RWA — Top 30 ($B)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={rwaDeco} margin={{ left: 0, right: 8, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => `$${Number(v).toFixed(1)}B`} />
                  <Legend />
                  <Bar dataKey="climateRWA" stackId="a" fill={T.red} name="Climate RWA" />
                  <Bar dataKey="nonClimateRWA" stackId="a" fill={T.blue} name="Non-Climate RWA" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Green Asset Ratio — Top 30 Institutions</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={rwaDeco} margin={{ left: 0, right: 8, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={v => `${Number(v).toFixed(1)}%`} />
                  <Bar dataKey="greenLoanPct" fill={T.green} name="Green Loan %" radius={[2,2,0,0]} />
                  <ReferenceLine y={30} stroke={T.amber} strokeDasharray="4 2" label={{ value: 'GAR Bonus Threshold (30%)', fontSize: 10, fill: T.amber }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ marginTop: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>RWA Decomposition Summary by Institution Type</div>
            {(() => {
              const typeData = INSTITUTION_TYPES.map(t => {
                const sub = filtered.filter(x => x.type === t);
                if (!sub.length) return null;
                const avgClimateRWA = sub.reduce((s, x) => s + x.totalRWA * x.climatRWAPct, 0) / sub.length;
                const avgTotalRWA = sub.reduce((s, x) => s + x.totalRWA, 0) / sub.length;
                const avgGAR = sub.reduce((s, x) => s + x.greenLoanPct * 100, 0) / sub.length;
                return { type: t.split(' ')[0], avgClimateRWA: +avgClimateRWA.toFixed(1), avgNonClimate: +(avgTotalRWA - avgClimateRWA).toFixed(1), avgGAR: +avgGAR.toFixed(1) };
              }).filter(Boolean);
              return (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={typeData} margin={{ left: 0, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => `$${Number(v).toFixed(1)}B avg`} />
                    <Legend />
                    <Bar dataKey="avgClimateRWA" stackId="a" fill={T.red} name="Avg Climate RWA" />
                    <Bar dataKey="avgNonClimate" stackId="a" fill={T.blue} name="Avg Non-Climate RWA" />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Jurisdiction Avg CET1 vs Threshold — Active Scenario: {scenario.name}</div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={jurisBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="jurisdiction" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[7, 14]} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => `${Number(v).toFixed(2)}%`} />
                <Legend />
                <Bar dataKey="avgCET1" fill={T.indigo} name="Avg CET1%" radius={[2,2,0,0]} />
                <Line type="monotone" dataKey="threshold" stroke={T.red} dot={false} name="Min Threshold%" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Jurisdiction Regulatory Rules & Capital Adequacy Summary</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Jurisdiction','Framework','Min CET1%','Pillar Mult','GAR Bonus','Institutions','Breaches','Avg CET1%','Status'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {jurisBreakdown.map((j, i) => {
                  const rule = JURIS_RULES[j.jurisdiction];
                  const pass = j.avgCET1 >= rule.minCET1;
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '7px 10px', fontWeight: 500 }}>{j.jurisdiction}</td>
                      <td style={{ padding: '7px 10px', color: T.muted }}>{rule.label}</td>
                      <td style={{ padding: '7px 10px' }}>{rule.minCET1}%</td>
                      <td style={{ padding: '7px 10px' }}>{rule.pillarMult}×</td>
                      <td style={{ padding: '7px 10px', color: T.green }}>{(rule.greenBonus * 100).toFixed(0)}%</td>
                      <td style={{ padding: '7px 10px' }}>{j.institutions}</td>
                      <td style={{ padding: '7px 10px', color: j.breaches > 0 ? T.red : T.green, fontWeight: j.breaches > 0 ? 600 : 400 }}>{j.breaches}</td>
                      <td style={{ padding: '7px 10px', color: pass ? T.green : T.red, fontWeight: 600 }}>{j.avgCET1}%</td>
                      <td style={{ padding: '7px 10px' }}><span style={{ background: pass ? '#f0fdf4' : '#fef2f2', color: pass ? T.green : T.red, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{j.institutions > 0 ? (pass ? 'ADEQUATE' : 'STRESSED') : 'N/A'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Sensitivity Tornado — Impact on Portfolio Avg CET1</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>Base CET1: {(portfolioAvgCET1 * 100).toFixed(2)}% | Scenario: {scenario.name} | {filtered.length} institutions</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[...sensitivityData].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))} layout="vertical" margin={{ left: 170, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v > 0 ? '+' : ''}${Number(v).toFixed(3)}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={170} />
                <Tooltip formatter={v => [`${v > 0 ? '+' : ''}${Number(v).toFixed(4)}% CET1`, 'Impact']} />
                <ReferenceLine x={0} stroke={T.border} strokeWidth={2} />
                <Bar dataKey="impact" radius={[0,2,2,0]} name="CET1 Change (%)"
                  fill={T.indigo}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Sensitivity Analysis — Detail Table</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>{['Variable','CET1 Impact (%)','Direction','Significance','Action'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {[...sensitivityData].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).map((v, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '7px 10px', fontWeight: 500 }}>{v.name}</td>
                    <td style={{ padding: '7px 10px', color: v.impact < 0 ? T.red : T.green, fontWeight: 600 }}>{v.impact > 0 ? '+' : ''}{v.impact.toFixed(4)}%</td>
                    <td style={{ padding: '7px 10px' }}>{v.impact < 0 ? 'Adverse' : 'Beneficial'}</td>
                    <td style={{ padding: '7px 10px', color: Math.abs(v.impact) > 0.01 ? T.red : Math.abs(v.impact) > 0.005 ? T.amber : T.muted }}>{Math.abs(v.impact) > 0.01 ? 'High' : Math.abs(v.impact) > 0.005 ? 'Medium' : 'Low'}</td>
                    <td style={{ padding: '7px 10px', color: T.muted, fontSize: 11 }}>{v.impact < 0 ? 'Monitor & mitigate' : 'Leverage & expand'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
            <KpiCard label="Portfolio Avg CET1" value={`${(portfolioAvgCET1 * 100).toFixed(2)}%`} color={T.indigo} sub={`Scenario: ${scenario.name}`} />
            <KpiCard label="Total Institutions" value={`${filtered.length}`} color={T.navy} sub="filtered" />
            <KpiCard label="CET1 Breaches" value={`${breachCount}`} color={breachCount > 0 ? T.red : T.green} sub="vs jurisdiction thresholds" />
            <KpiCard label="Avg Pillar 2 Add-On" value={`$${avgPillar2.toFixed(1)}B`} color={T.amber} sub="portfolio average" />
            <KpiCard label="Total Capital Shortfall" value={`$${(totalShortfall/1000).toFixed(2)}T RWA`} color={T.red} sub="sum of shortfalls" />
            <KpiCard label="Active Scenario" value={scenario.name} color={T.teal} sub={`P2 add: ${scenario.pillar2AddPct}%`} />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Full Institution KPI Export — {filtered.length} institutions</div>
            <div style={{ overflowX: 'auto', maxHeight: 500 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead style={{ position: 'sticky', top: 0 }}>
                  <tr style={{ background: T.sub }}>
                    {['Institution','Jurisdiction','Type','RWA($B)','CET1%','Tier1%','ClimRWA%','GAR%','Fossil%','ESG','P2($B)','Shortfall%','Stress Buf($B)','Framework','Result'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((x, i) => (
                    <tr key={x.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '5px 8px', fontWeight: 500 }}>{x.name}</td>
                      <td style={{ padding: '5px 8px' }}>{x.jurisdiction}</td>
                      <td style={{ padding: '5px 8px', color: T.muted, fontSize: 10 }}>{x.type.split(' ')[0]}</td>
                      <td style={{ padding: '5px 8px' }}>{x.totalRWA.toFixed(0)}</td>
                      <td style={{ padding: '5px 8px', color: x.cet1Impact * 100 < CET1_THRESHOLDS[x.jurisdiction] ? T.red : T.green, fontWeight: 600 }}>{(x.cet1Impact * 100).toFixed(2)}%</td>
                      <td style={{ padding: '5px 8px' }}>{(x.tier1Capital * 100).toFixed(2)}%</td>
                      <td style={{ padding: '5px 8px' }}>{(x.climatRWAPct * 100).toFixed(1)}%</td>
                      <td style={{ padding: '5px 8px', color: x.greenLoanPct > 0.30 ? T.green : T.text }}>{(x.greenLoanPct * 100).toFixed(1)}%</td>
                      <td style={{ padding: '5px 8px', color: x.fossilFuelExposure > 0.20 ? T.red : T.text }}>{(x.fossilFuelExposure * 100).toFixed(1)}%</td>
                      <td style={{ padding: '5px 8px' }}>{x.ESGrating}</td>
                      <td style={{ padding: '5px 8px' }}>{x.pillar2AddOn.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', color: x.shortfall > 0 ? T.red : T.green }}>{x.shortfall > 0 ? `${(x.shortfall*100).toFixed(3)}%` : '—'}</td>
                      <td style={{ padding: '5px 8px' }}>{x.stressBuffer.toFixed(1)}</td>
                      <td style={{ padding: '5px 8px', color: T.muted, fontSize: 10 }}>{x.regulatoryFramework}</td>
                      <td style={{ padding: '5px 8px' }}><span style={{ background: x.shortfall > 0 ? '#fef2f2' : '#f0fdf4', color: x.shortfall > 0 ? T.red : T.green, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{x.shortfall > 0 ? 'BREACH' : 'PASS'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginTop: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Portfolio-Level Capital Adequacy Analytics</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
              {[
                ['Total RWA', `$${(filtered.reduce((s,x)=>s+x.totalRWA,0)/1000).toFixed(1)}T`, T.navy],
                ['Avg Fossil Exposure', `${filtered.length ? (filtered.reduce((s,x)=>s+x.fossilFuelExposure,0)/filtered.length*100).toFixed(1) : 0}%`, T.red],
                ['GAR > 30% Count', `${filtered.filter(x=>x.greenLoanPct>0.30).length}`, T.green],
                ['Carbon Intensive', `${filtered.filter(x=>x.carbonIntensive).length}`, T.amber],
              ].map(([l,v,c]) => (
                <div key={l} style={{ padding: '10px 14px', background: T.sub, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: T.muted }}>{l}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: c }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Institution Type Breakdown</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: T.sub }}>{['Type','Count','Avg CET1%','Breaches'].map(h=><th key={h} style={{ padding:'5px 8px',textAlign:'left',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {INSTITUTION_TYPES.map((type, ti) => {
                      const sub = filtered.filter(x=>x.type===type);
                      if (!sub.length) return null;
                      const avgCET1 = sub.reduce((s,x)=>s+x.cet1Impact*100,0)/sub.length;
                      const breaches = sub.filter(x=>x.shortfall>0).length;
                      return (
                        <tr key={ti} style={{ background: ti%2===0?T.card:T.sub }}>
                          <td style={{ padding:'5px 8px',fontWeight:500 }}>{type}</td>
                          <td style={{ padding:'5px 8px' }}>{sub.length}</td>
                          <td style={{ padding:'5px 8px',color:T.indigo,fontWeight:600 }}>{avgCET1.toFixed(2)}%</td>
                          <td style={{ padding:'5px 8px',color:breaches>0?T.red:T.green }}>{breaches}</td>
                        </tr>
                      );
                    }).filter(Boolean)}
                  </tbody>
                </table>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>ESG Rating Breakdown</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: T.sub }}>{['ESG','Count','Avg Fossil%','Avg GAR%','Avg CET1%'].map(h=><th key={h} style={{ padding:'5px 8px',textAlign:'left',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {['AAA','AA','A','BBB','BB','B'].map((esg, ei) => {
                      const sub = filtered.filter(x=>x.ESGrating===esg);
                      if (!sub.length) return null;
                      const avgFossil = sub.reduce((s,x)=>s+x.fossilFuelExposure*100,0)/sub.length;
                      const avgGar = sub.reduce((s,x)=>s+x.greenLoanPct*100,0)/sub.length;
                      const avgCET1 = sub.reduce((s,x)=>s+x.cet1Impact*100,0)/sub.length;
                      return (
                        <tr key={ei} style={{ background: ei%2===0?T.card:T.sub }}>
                          <td style={{ padding:'5px 8px',fontWeight:700 }}>{esg}</td>
                          <td style={{ padding:'5px 8px' }}>{sub.length}</td>
                          <td style={{ padding:'5px 8px',color:avgFossil>20?T.red:T.text }}>{avgFossil.toFixed(1)}%</td>
                          <td style={{ padding:'5px 8px',color:avgGar>30?T.green:T.muted }}>{avgGar.toFixed(1)}%</td>
                          <td style={{ padding:'5px 8px',color:T.indigo,fontWeight:600 }}>{avgCET1.toFixed(2)}%</td>
                        </tr>
                      );
                    }).filter(Boolean)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Multi-Scenario Capital Summary — All 8 Scenarios vs Jurisdiction Thresholds</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    <th style={{ padding:'6px 8px',textAlign:'left',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>Jurisdiction</th>
                    {SCENARIOS.map(s=><th key={s.id} style={{ padding:'6px 8px',textAlign:'center',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap' }}>{s.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {JURISDICTIONS.map((j, ji) => {
                    const sub = filtered.filter(x=>x.jurisdiction===j);
                    if (!sub.length) return null;
                    const thresh = JURIS_RULES[j].minCET1;
                    return (
                      <tr key={ji} style={{ background: ji%2===0?T.card:T.sub }}>
                        <td style={{ padding:'5px 8px',fontWeight:500 }}>{j}</td>
                        {SCENARIOS.map(sc => {
                          const avgCET1 = sub.length ? sub.reduce((s,inst) => {
                            const c = computeCapital(inst, sc);
                            return s + c.cet1Impact * 100;
                          }, 0) / sub.length : 0;
                          const pass = avgCET1 >= thresh;
                          return (
                            <td key={sc.id} style={{ padding:'5px 8px',textAlign:'center',fontWeight:600,color:pass?T.green:T.red,background:pass?'transparent':'#fef2f2' }}>
                              {avgCET1.toFixed(2)}%
                            </td>
                          );
                        })}
                      </tr>
                    );
                  }).filter(Boolean)}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: T.muted }}>Values are avg CET1% per jurisdiction under each scenario. Red = below minimum threshold. Green = adequate.</div>
          </div>
          <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Capital Adequacy Trend Analysis — Stress Buffer vs Pillar 2 by RWA Band</div>
            {(() => {
              const bands = [
                { label:'<100B', min:0, max:100 }, { label:'100-250B', min:100, max:250 },
                { label:'250-500B', min:250, max:500 }, { label:'500B+', min:500, max:9999 },
              ];
              const bandData = bands.map(b => {
                const sub = filtered.filter(x=>x.totalRWA>=b.min&&x.totalRWA<b.max);
                if (!sub.length) return { label:b.label, avgCET1:0, avgP2:0, avgBuffer:0, count:0 };
                return {
                  label:b.label,
                  avgCET1:+(sub.reduce((s,x)=>s+x.cet1Impact*100,0)/sub.length).toFixed(2),
                  avgP2:+(sub.reduce((s,x)=>s+x.pillar2AddOn,0)/sub.length).toFixed(1),
                  avgBuffer:+(sub.reduce((s,x)=>s+x.stressBuffer,0)/sub.length).toFixed(1),
                  count:sub.length,
                };
              });
              return (
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={bandData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="label" tick={{ fontSize:10 }} />
                      <YAxis yAxisId="left" tick={{ fontSize:10 }} tickFormatter={v=>`${v}%`} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10 }} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="avgCET1" fill={T.indigo} name="Avg CET1%" radius={[2,2,0,0]} />
                      <Line yAxisId="right" type="monotone" dataKey="avgP2" stroke={T.red} strokeWidth={2} dot={{ r:4 }} name="Avg Pillar2($B)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div>
                    <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                      <thead><tr style={{ background:T.sub }}>{['RWA Band','Count','Avg CET1%','Avg P2($B)','Avg Stress Buf($B)','Pass Rate%'].map(h=><th key={h} style={{ padding:'5px 8px',textAlign:'left',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {bandData.map((b,i)=>{
                          const sub=filtered.filter(x=>{
                            const bands2=[{min:0,max:100},{min:100,max:250},{min:250,max:500},{min:500,max:9999}];
                            return x.totalRWA>=bands2[i].min&&x.totalRWA<bands2[i].max;
                          });
                          const passRate=sub.length?sub.filter(x=>x.shortfall===0).length/sub.length*100:0;
                          return (
                            <tr key={i} style={{ background:i%2===0?T.card:T.sub }}>
                              <td style={{ padding:'5px 8px',fontWeight:500 }}>{b.label}</td>
                              <td style={{ padding:'5px 8px' }}>{b.count}</td>
                              <td style={{ padding:'5px 8px',fontWeight:600,color:T.indigo }}>{b.avgCET1}%</td>
                              <td style={{ padding:'5px 8px',color:T.amber }}>{b.avgP2}</td>
                              <td style={{ padding:'5px 8px',color:T.blue }}>{b.avgBuffer}</td>
                              <td style={{ padding:'5px 8px',color:passRate>80?T.green:T.red,fontWeight:600 }}>{passRate.toFixed(0)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
          <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Liquidity Stress Indicators — LCR & NSFR Under Climate Scenarios</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontWeight:600,fontSize:13,marginBottom:8 }}>LCR Distribution by Institution Type</div>
                {(() => {
                  const typeData=INSTITUTION_TYPES.map((t,ti)=>{
                    const sub=filtered.filter(x=>x.type===t);
                    if(!sub.length) return null;
                    return { type:t.split(' ')[0], avgLCR:+(sub.reduce((s,x)=>s+x.lcrRatio,0)/sub.length).toFixed(3), avgNSFR:+(sub.reduce((s,x)=>s+x.nsfr,0)/sub.length).toFixed(3), below1:sub.filter(x=>x.lcrRatio<1.0).length };
                  }).filter(Boolean);
                  return (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={typeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="type" tick={{ fontSize:9 }} />
                        <YAxis tick={{ fontSize:10 }} domain={[0.8,2.0]} />
                        <Tooltip formatter={v=>Number(v).toFixed(3)} />
                        <Legend />
                        <Bar dataKey="avgLCR" fill={T.blue} name="Avg LCR" radius={[2,2,0,0]} />
                        <Bar dataKey="avgNSFR" fill={T.teal} name="Avg NSFR" radius={[2,2,0,0]} />
                        <ReferenceLine y={1.0} stroke={T.red} strokeDasharray="4 2" label={{ value:'Min 1.0', fontSize:9, fill:T.red }} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
              <div>
                <div style={{ fontWeight:600,fontSize:13,marginBottom:8 }}>Leverage Ratio by Jurisdiction</div>
                {(() => {
                  const jurisData=JURISDICTIONS.map(j=>{
                    const sub=filtered.filter(x=>x.jurisdiction===j);
                    if(!sub.length) return null;
                    return { jurisdiction:j, avgLev:+(sub.reduce((s,x)=>s+x.leverageRatio*100,0)/sub.length).toFixed(2), avgLCR:+(sub.reduce((s,x)=>s+x.lcrRatio,0)/sub.length).toFixed(3) };
                  }).filter(Boolean);
                  return (
                    <ResponsiveContainer width="100%" height={200}>
                      <ComposedChart data={jurisData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="jurisdiction" tick={{ fontSize:10 }} />
                        <YAxis yAxisId="left" tick={{ fontSize:10 }} tickFormatter={v=>`${v}%`} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10 }} />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="avgLev" fill={T.purple} name="Avg Leverage%" radius={[2,2,0,0]} />
                        <Line yAxisId="right" type="monotone" dataKey="avgLCR" stroke={T.blue} strokeWidth={2} dot={{ r:3 }} name="Avg LCR" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 8 hidden: Advanced Scenario Deep-Dive ── */}
      {activeTab === 'deep' && (
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12,color:T.text }}>Tail-Risk Capital Waterfall — Scenario × Institution Type</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                <thead>
                  <tr style={{ background:T.sub }}>
                    <th style={{ padding:'6px 10px',textAlign:'left',color:T.muted }}>Institution Type</th>
                    {SCENARIOS.map(s=>(
                      <th key={s.name} style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>{s.name.split(' ')[0]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INST_TYPES.map((type,ti)=>{
                    const sub=INSTITUTIONS.filter(x=>x.type===type);
                    if(!sub.length) return null;
                    return (
                      <tr key={type} style={{ background:ti%2===0?T.card:T.sub }}>
                        <td style={{ padding:'5px 10px',fontWeight:600,fontSize:11 }}>{type.split(' ').slice(0,2).join(' ')}</td>
                        {SCENARIOS.map(sc=>{
                          const avgShortfall=sub.length?sub.reduce((s,inst)=>s+computeCapital(inst,sc).shortfall,0)/sub.length:0;
                          const pct=(avgShortfall*100).toFixed(2);
                          const clr=avgShortfall>0.02?T.red:avgShortfall>0.005?T.amber:T.green;
                          return <td key={sc.name} style={{ padding:'5px 8px',textAlign:'right',fontWeight:600,color:clr }}>{pct}%</td>;
                        })}
                      </tr>
                    );
                  }).filter(Boolean)}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Jurisdiction Capital Adequacy Summary — All Scenarios</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                <thead>
                  <tr style={{ background:T.sub }}>
                    <th style={{ padding:'6px 10px',textAlign:'left',color:T.muted }}>Jurisdiction</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Count</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Avg Tier1</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Baseline CET1</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>HotHouse CET1</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Capital Erosion</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Institutions at Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {JURISDICTIONS.map((j,ji)=>{
                    const sub=INSTITUTIONS.filter(x=>x.jurisdiction===j);
                    if(!sub.length) return null;
                    const baseline=SCENARIOS[0];
                    const hotHouse=SCENARIOS[3];
                    const avgT1=sub.length?sub.reduce((s,x)=>s+x.tier1Capital,0)/sub.length:0;
                    const avgBaseCET1=sub.length?sub.reduce((s,x)=>s+computeCapital(x,baseline).cet1Impact,0)/sub.length:0;
                    const avgHHCET1=sub.length?sub.reduce((s,x)=>s+computeCapital(x,hotHouse).cet1Impact,0)/sub.length:0;
                    const erosion=avgBaseCET1-avgHHCET1;
                    const atRisk=sub.filter(x=>computeCapital(x,hotHouse).shortfall>0).length;
                    return (
                      <tr key={j} style={{ background:ji%2===0?T.card:T.sub }}>
                        <td style={{ padding:'5px 10px',fontWeight:600 }}>{j}</td>
                        <td style={{ padding:'5px 8px',textAlign:'right' }}>{sub.length}</td>
                        <td style={{ padding:'5px 8px',textAlign:'right' }}>{(avgT1*100).toFixed(2)}%</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:T.green }}>{(avgBaseCET1*100).toFixed(2)}%</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:T.red }}>{(avgHHCET1*100).toFixed(2)}%</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:erosion>0.01?T.red:T.amber }}>{(erosion*100).toFixed(2)}pp</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',fontWeight:600,color:atRisk>0?T.red:T.green }}>{atRisk}/{sub.length}</td>
                      </tr>
                    );
                  }).filter(Boolean)}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:10 }}>Green Asset Ratio Impact Analysis</div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8 }}>
              {['0–10%','10–20%','20–30%','30–40%','40%+'].map((band,bi)=>{
                const [lo,hi]=[bi*0.1,(bi+1)*0.1];
                const sub=INSTITUTIONS.filter(x=>x.greenLoanPct>=lo&&x.greenLoanPct<(bi===4?2:hi));
                const avgGarBonus=sub.length?sub.reduce((s,x)=>s+computeCapital(x,SCENARIOS[1]).garBonus,0)/sub.length:0;
                const avgShortfall=sub.length?sub.reduce((s,x)=>s+computeCapital(x,SCENARIOS[1]).shortfall,0)/sub.length:0;
                return (
                  <div key={band} style={{ background:T.sub,borderRadius:6,padding:10,textAlign:'center' }}>
                    <div style={{ fontSize:10,color:T.muted,marginBottom:4 }}>GAR Band: {band}</div>
                    <div style={{ fontSize:12,fontWeight:700,color:T.text }}>{sub.length} insts</div>
                    <div style={{ fontSize:11,color:T.teal,marginTop:4 }}>Bonus: {(avgGarBonus/1e9).toFixed(2)}B</div>
                    <div style={{ fontSize:11,color:avgShortfall>0?T.red:T.green }}>Shortfall: {(avgShortfall*100).toFixed(2)}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:10 }}>Stress Buffer Adequacy vs Physical Risk Score</div>
            <ResponsiveContainer width="100%" height={180}>
              <ScatterChart margin={{ top:5,right:20,bottom:5,left:10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="physScore" name="Physical Risk Score" tick={{ fontSize:10 }} label={{ value:'Physical Risk Score',position:'insideBottom',offset:-2,fontSize:10 }} />
                <YAxis dataKey="buffer" name="Stress Buffer ($B)" tick={{ fontSize:10 }} tickFormatter={v=>`${v.toFixed(1)}B`} />
                <Tooltip formatter={(v,n)=>[typeof v==='number'?v.toFixed(2):v,n]} />
                <Scatter data={INSTITUTIONS.slice(0,40).map(inst=>({
                  physScore:inst.physicalRiskScore,
                  buffer:computeCapital(inst,SCENARIOS[1]).stressBuffer/1e9,
                }))} fill={T.indigo} opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
